
import React, { useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useLanguage } from '../contexts/LanguageContext';
import { Staff } from '../types';
import { db } from '../services/firebase';
import { 
  Loader, History, Target, ShieldCheck, Plus, Edit, Trash, 
  BookOpen, Quote, Calendar, X, Users, ChevronRight, Phone, 
  MessageCircle, Save, BarChart3, Globe, Sparkles, Eye, 
  Type, Check, UserCheck, GraduationCap, Layout, Table as TableIcon,
  FileSpreadsheet, Wand2
} from 'lucide-react';
import StatsCounter from '../components/StatsCounter';
import { useAuth } from '../contexts/AuthContext';
import StaffEditModal from '../components/StaffEditModal';
import TableBuilderModal, { parseTextToTableData, generateTableHtml } from '../components/TableBuilderModal';
import { translations } from '../translations';
import { ProtectedContact } from '../components/ProtectedContact';

// Define the structure for the editable content
interface AboutPageContent {
  en_title?: string;
  mizo_title?: string;
  en_subtitle?: string;
  mizo_subtitle?: string;
  en_historyTitle?: string;
  mizo_historyTitle?: string;
  en_historyText?: string;
  mizo_historyText?: string;
  en_missionTitle?: string;
  mizo_missionTitle?: string;
  en_missionText?: string;
  mizo_missionText?: string;
  en_faithTitle?: string;
  mizo_faithTitle?: string;
  en_faithText?: string;
  mizo_faithText?: string;
  stats_families?: number;
  stats_members?: number;
  stats_sundayschool?: number;
}

// Quill configuration
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['blockquote', 'link'],
    ['clean']
  ]
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'align',
  'blockquote', 'link'
];

// Helper to gracefully render rich HTML or plain text fallback with smart table detection
const formatRichText = (rawContent?: string): string => {
  if (!rawContent) return '';

  let processed = rawContent;

  // If text contains unformatted church elder table lines like "KOHHRAN UPATE\nSl.No UPA HMING..."
  // or consecutive lines starting with "1 Upa...", auto-convert them to responsive table HTML
  if (!processed.includes('<table') && (
    /(S[Il]\.?\s*No\s+UPA\s+HMING|KOHHRAN\s+UPATE)/i.test(processed) ||
    /(\n\s*1\s+Upa\s+[^\n]+\n\s*2\s+Upa\s+)/i.test(processed)
  )) {
    const lines = processed.split(/\r?\n/);
    const textBefore: string[] = [];
    const tableLines: string[] = [];
    const textAfter: string[] = [];
    let state: 'before' | 'table' | 'after' = 'before';

    for (const line of lines) {
      if (state === 'before' && (
        /(KOHHRAN\s+UPATE|S[Il]\.?\s*No\s+UPA\s+HMING)/i.test(line) ||
        /^\s*1\s+Upa\s+/i.test(line)
      )) {
        state = 'table';
        tableLines.push(line);
      } else if (state === 'table') {
        if (/^\s*\d+\.?\s+/i.test(line) || /(S[Il]\.?\s*No|UPA\s+HMING|HMUN|KUM)/i.test(line) || line.trim() === '') {
          if (line.trim() !== '') tableLines.push(line);
        } else {
          state = 'after';
          textAfter.push(line);
        }
      } else if (state === 'after') {
        textAfter.push(line);
      } else {
        textBefore.push(line);
      }
    }

    if (tableLines.length > 0) {
      const parsed = parseTextToTableData(tableLines.join('\n'));
      const tableHtml = generateTableHtml(parsed.headers, parsed.rows, 'KOHHRAN UPATE');
      processed = (textBefore.length ? textBefore.join('\n') + '\n\n' : '') + 
                  tableHtml + 
                  (textAfter.length ? '\n\n' + textAfter.join('\n') : '');
    }
  }

  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(processed);
  if (hasHtmlTags) {
    let html = processed.replace(/&nbsp;/g, ' ');
    // Ensure all <table> elements have responsive wrapper
    if (html.includes('<table') && !html.includes('table-responsive-wrapper')) {
      html = html.replace(/<table([\s\S]*?)<\/table>/gi, (match) => {
        return `<div class="table-responsive-wrapper">${match}</div>`;
      });
    }
    return html;
  }

  return processed
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`)
    .join('');
};

const About: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAdmin } = useAuth();

  // State for dynamic page content
  const [content, setContent] = useState<Partial<AboutPageContent>>({});
  
  // State for Lists
  const [pastors, setPastors] = useState<Staff[]>([]);
  const [proPastors, setProPastors] = useState<Staff[]>([]);
  const [elders, setElders] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Modal & Actions
  const [isStaffEditModalOpen, setIsStaffEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff>>({});
  const [targetCollection, setTargetCollection] = useState<'pastors' | 'elders' | 'proPastors'>('pastors');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Biography Modal State
  const [selectedLeader, setSelectedLeader] = useState<Staff | null>(null);

  // Page Content Edit Modal State
  const [isPageEditModalOpen, setIsPageEditModalOpen] = useState(false);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
      setPastors([]);
      setProPastors([]);
      setElders([]);
      setLoading(false);
      return;
    }

    try {
      const [pSnap, ppSnap, eSnap, contentSnap] = await Promise.all([
        db.collection('pastors').orderBy('order', 'asc').get(),
        db.collection('proPastors').orderBy('order', 'asc').get(),
        db.collection('elders').orderBy('order', 'asc').get(),
        db.collection('settings').doc('aboutPage').get()
      ]);

      if (contentSnap.exists) {
          setContent(contentSnap.data() as AboutPageContent);
      }

      const getUniqueData = (snap: any) => {
          if (snap.empty) return [];
          const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          return data.filter((item: any, index: number, self: any[]) =>
            index === self.findIndex((t) => t.name === item.name)
          );
      };

      setPastors(getUniqueData(pSnap));
      setProPastors(getUniqueData(ppSnap));
      setElders(getUniqueData(eSnap));
    } catch (error) {
      console.error("Error fetching page data:", error);
      setPastors([]);
      setProPastors([]);
      setElders([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddNew = (collection: 'pastors' | 'elders' | 'proPastors') => {
    setEditingStaff({ name: '', role: collection === 'elders' ? 'Upa' : 'Pastor', imageUrl: '', description: '', biography: '' });
    setTargetCollection(collection);
    setIsStaffEditModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, staff: Staff, collection: 'pastors' | 'elders' | 'proPastors') => {
    e.stopPropagation();
    setEditingStaff(staff);
    setTargetCollection(collection);
    setIsStaffEditModalOpen(true);
  };

  const handleSaveStaff = async (staff: Staff, collectionName: 'pastors' | 'elders' | 'proPastors') => {
    setIsSaving(true);
    try {
      if (staff.id) {
        await db.collection(collectionName).doc(staff.id).set(staff, { merge: true });
      } else {
        const currentList = collectionName === 'pastors' ? pastors : collectionName === 'elders' ? elders : proPastors;
        const maxOrder = currentList.length > 0 ? Math.max(...currentList.map(s => s.order || 0)) : 0;
        await db.collection(collectionName).add({ ...staff, order: maxOrder + 1 });
      }
      setIsStaffEditModalOpen(false);
      fetchAllData();
      if (selectedLeader?.id === staff.id) setSelectedLeader(staff);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save to Firebase.");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string, collectionName: 'pastors' | 'elders' | 'proPastors') => {
    setIsSaving(true);
    try {
      await db.collection(collectionName).doc(id).delete();
      setShowDeleteConfirm(null);
      setIsStaffEditModalOpen(false);
      fetchAllData();
      if (selectedLeader?.id === id) setSelectedLeader(null);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete.");
    }
    setIsSaving(false);
  };

  const handleSaveContent = async (newContent: Partial<AboutPageContent>) => {
      setIsSaving(true);
      if (db) {
          try {
              await db.collection('settings').doc('aboutPage').set(newContent, { merge: true });
              setContent(newContent);
              setIsPageEditModalOpen(false);
          } catch (error) {
              console.error("Error saving page content:", error);
              alert("Failed to save content.");
          }
      }
      setIsSaving(false);
  };

  const allPastoralLeaders = [
    ...pastors.map(p => ({ ...p, collection: 'pastors' as const })),
    ...proPastors.map(p => ({ ...p, collection: 'proPastors' as const }))
  ];

  const c = (key: keyof AboutPageContent, fallback: string) => {
      const suffix = key.toString().replace(/^(en_|mizo_)/, '');
      const langKey = `${language}_${suffix}` as keyof AboutPageContent;
      const defaultKey = `en_${suffix}` as keyof AboutPageContent;
      return (content as any)[langKey] || (content as any)[defaultKey] || (content as any)[key] || fallback;
  };

  // Merge current DB content with default translations for the modal
  const getMergedContent = (): Partial<AboutPageContent> => ({
      en_title: content.en_title || translations.en.about.title,
      en_subtitle: content.en_subtitle || translations.en.about.subtitle,
      en_historyTitle: content.en_historyTitle || translations.en.about.historyTitle,
      en_historyText: content.en_historyText || translations.en.about.historyText,
      en_missionTitle: content.en_missionTitle || translations.en.about.missionTitle,
      en_missionText: content.en_missionText || translations.en.about.missionText,
      en_faithTitle: content.en_faithTitle || translations.en.about.faithTitle,
      en_faithText: content.en_faithText || translations.en.about.faithText,
      mizo_title: content.mizo_title || translations.mizo.about.title,
      mizo_subtitle: content.mizo_subtitle || translations.mizo.about.subtitle,
      mizo_historyTitle: content.mizo_historyTitle || translations.mizo.about.historyTitle,
      mizo_historyText: content.mizo_historyText || translations.mizo.about.historyText,
      mizo_missionTitle: content.mizo_missionTitle || translations.mizo.about.missionTitle,
      mizo_missionText: content.mizo_missionText || translations.mizo.about.missionText,
      mizo_faithTitle: content.mizo_faithTitle || translations.mizo.about.faithTitle,
      mizo_faithText: content.mizo_faithText || translations.mizo.about.faithText,
      stats_families: content.stats_families ?? 0,
      stats_members: content.stats_members ?? 0,
      stats_sundayschool: content.stats_sundayschool ?? 0,
  });

  return (
    <div className="bg-slate-50 min-h-screen relative">
      {/* Hero */}
      <div className="bg-church-900 py-20 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{c('en_title', t.about.title)}</h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">{c('en_subtitle', t.about.subtitle)}</p>
      </div>

      {isAdmin && (
          <div className="sticky top-24 z-40 flex justify-center py-4">
              <button 
                onClick={() => setIsPageEditModalOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-church-50 hover:text-church-700 hover:border-church-200 transition shadow-lg group"
              >
                  <Edit size={16} className="text-church-600 group-hover:scale-110 transition-transform" /> 
                  <span>Edit Page Content (Rich Text)</span>
              </button>
          </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* History - Full Width Column */}
        <div className="w-full bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center mb-8 pb-4 border-b border-slate-100 text-church-600">
                <div className="w-12 h-12 rounded-2xl bg-church-50 text-church-600 flex items-center justify-center mr-4 shrink-0 shadow-xs">
                    <History size={26} />
                </div>
                <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">{c('en_historyTitle', t.about.historyTitle)}</h2>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">Champhai Bethel Kohhran Chanchin Tlangpui</p>
                </div>
            </div>
            <article 
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-sans ql-editor !p-0 text-base sm:text-lg"
                dangerouslySetInnerHTML={{ __html: formatRichText(c('en_historyText', t.about.historyText)) }}
            />
        </div>

        {/* Mission & Statement of Faith - Scrolled Section */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Our Mission */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex items-center mb-6 text-church-600">
                    <div className="w-12 h-12 rounded-2xl bg-church-50 text-church-600 flex items-center justify-center mr-4 shrink-0 shadow-xs">
                        <Target size={26} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-slate-900">{c('en_missionTitle', t.about.missionTitle)}</h2>
                        <p className="text-xs text-slate-400 font-medium">Kan Thuvawn & Rawngbawlna Tum</p>
                    </div>
                </div>
                <article 
                    className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-sans ql-editor !p-0 flex-1 text-base"
                    dangerouslySetInnerHTML={{ __html: formatRichText(c('en_missionText', t.about.missionText)) }}
                />
            </div>

            {/* Statement of Faith */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex items-center mb-6 text-church-600">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4 shrink-0 shadow-xs">
                        <ShieldCheck size={26} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-slate-900">{c('en_faithTitle', t.about.faithTitle)}</h2>
                        <p className="text-xs text-slate-400 font-medium">Kan Rinna Bul Thute</p>
                    </div>
                </div>
                <article 
                    className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-sans ql-editor !p-0 flex-1 text-base"
                    dangerouslySetInnerHTML={{ __html: formatRichText(c('en_faithText', t.about.faithText)) }}
                />
            </div>
        </div>

        {/* Stats */}
        <StatsCounter 
            families={content.stats_families || 0}
            members={content.stats_members || 0}
            sundaySchoolStudents={content.stats_sundayschool || 0}
        />

        {/* Leaders Section */}
        <div>
            <div className="text-center mb-12 relative">
                <h2 className="text-3xl font-serif font-bold text-church-900 mb-4">{t.about.shepherdsTitle}</h2>
                <div className="h-1 w-20 bg-church-500 mx-auto mb-4"></div>
                {isAdmin && (
                    <div className="flex justify-center gap-2">
                        <button onClick={() => handleAddNew('pastors')} className="flex items-center text-sm font-bold text-white bg-church-600 px-3 py-1 rounded-full shadow-sm hover:bg-church-700">
                            <Plus size={14} className="mr-1"/> Add Pastor
                        </button>
                        <button onClick={() => handleAddNew('proPastors')} className="flex items-center text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded-full shadow-sm hover:bg-blue-700">
                            <Plus size={14} className="mr-1"/> Add Pro-Pastor
                        </button>
                    </div>
                )}
            </div>
            
            {/* Pastors & Pro Pastors */}
            <div className="flex flex-wrap justify-center gap-12 mb-16">
                {allPastoralLeaders.length > 0 ? (
                    allPastoralLeaders.map(p => (
                        <div key={p.id} className="text-center group relative cursor-pointer" onClick={() => setSelectedLeader(p)}>
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto mb-5 relative bg-slate-200">
                                <img 
                                    src={p.imageUrl} 
                                    alt={p.name} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    style={{
                                        objectPosition: `${p.imagePositionX ?? 50}% ${p.imagePositionY ?? 0}%`,
                                        transform: `scale(${p.imageScale ?? 1})`
                                    }}
                                />
                            </div>
                            <h3 className="font-bold text-xl text-slate-900 mb-1">{p.name}</h3>
                            <p className="text-sm font-bold text-church-600 uppercase tracking-widest">{p.role}</p>
                            {isAdmin && (
                                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => handleEditClick(e, p, p.collection)} className="p-2 bg-white text-church-600 rounded-full shadow-md"><Edit size={14}/></button>
                                    <button onClick={() => handleDelete(p.id, p.collection)} className="p-2 bg-white text-red-600 rounded-full shadow-md"><Trash size={14}/></button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-slate-500 italic">No pastor data available.</p>
                )}
            </div>

            {/* Elders */}
            <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-slate-700 mb-2">{t.about.statsElders}</h3>
                <div className="h-0.5 w-10 bg-slate-300 mx-auto mb-8"></div>
                {isAdmin && (
                    <button onClick={() => handleAddNew('elders')} className="flex items-center mx-auto text-sm font-bold text-white bg-church-600 px-3 py-1 rounded-full shadow-sm hover:bg-church-700 mb-6">
                        <Plus size={14} className="mr-1"/> Add Elder
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {elders.map(e => (
                    <div key={e.id} className="text-center group cursor-pointer relative" onClick={() => setSelectedLeader(e)}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md mx-auto mb-3 bg-slate-200">
                            <img 
                                src={e.imageUrl} 
                                alt={e.name} 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                style={{
                                    objectPosition: `${e.imagePositionX ?? 50}% ${e.imagePositionY ?? 0}%`,
                                    transform: `scale(${e.imageScale ?? 1})`
                                }}
                            />
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 leading-tight group-hover:text-church-700 transition-colors">{e.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{e.role}</p>
                        
                        {isAdmin && (
                            <div className="absolute top-0 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(ev) => handleEditClick(ev, e, 'elders')} className="p-1 bg-white text-church-600 rounded-full shadow-sm"><Edit size={12}/></button>
                                <button onClick={() => handleDelete(e.id, 'elders')} className="p-1 bg-white text-red-600 rounded-full shadow-sm"><Trash size={12}/></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* Page Content Edit Modal */}
      {isPageEditModalOpen && (
        <PageContentEditModal
          content={getMergedContent()}
          onClose={() => setIsPageEditModalOpen(false)}
          onSave={handleSaveContent}
          isLoading={isSaving}
        />
      )}

      {/* Staff Edit Modal */}
      {isStaffEditModalOpen && (
          <StaffEditModal
            staff={editingStaff}
            onClose={() => setIsStaffEditModalOpen(false)}
            onSave={handleSaveStaff}
            onDelete={handleDelete}
            isLoading={isSaving}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            collectionName={targetCollection}
          />
      )}

      {/* BIOGRAPHY THEATER MODAL */}
      {selectedLeader && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedLeader(null)}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                
                {/* Header Profile Area */}
                <div className="relative min-h-[14rem] md:min-h-[16rem] shrink-0 bg-church-900 text-white flex items-end overflow-hidden">
                    <img 
                        src={selectedLeader.imageUrl} 
                        className="absolute inset-0 w-full h-full object-cover opacity-40" 
                        alt="Profile BG"
                        style={{ objectPosition: `${selectedLeader.imagePositionX ?? 50}% ${selectedLeader.imagePositionY ?? 0}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-church-900 via-church-900/60 to-transparent"></div>
                    
                    <button 
                        onClick={() => setSelectedLeader(null)}
                        className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition text-white border border-white/20 z-20"
                    >
                        <X size={24} />
                    </button>

                    <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                        {/* Image */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white shrink-0">
                            <img 
                                src={selectedLeader.imageUrl} 
                                alt={selectedLeader.name} 
                                className="w-full h-full object-cover" 
                                style={{ objectPosition: `${selectedLeader.imagePositionX ?? 50}% ${selectedLeader.imagePositionY ?? 0}%` }}
                            />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                                <span className="inline-block bg-church-600 text-white text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full shadow-lg">
                                    {selectedLeader.role}
                                </span>
                                {selectedLeader.qualification && (
                                    <span className="inline-block bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                                        {selectedLeader.qualification}
                                    </span>
                                )}
                            </div>
                            
                            <h2 className="text-2xl md:text-4xl font-serif font-black mb-2 leading-tight">
                                {selectedLeader.name}
                            </h2>
                            
                            <div className="flex flex-col gap-1 text-sm text-church-200 opacity-90 mt-2">
                                {/* Ordination & Probation Row */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                     {selectedLeader.period && (
                                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-xs">
                                            <Calendar size={14} /> Ordination: {selectedLeader.period}
                                        </div>
                                    )}
                                    {selectedLeader.probationTenure && (
                                        <>
                                            <div className="hidden md:block w-1 h-1 rounded-full bg-church-400"></div>
                                            <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-xs">
                                                Probation: {selectedLeader.probationTenure}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Previous Bials Row (if exists) */}
                                {selectedLeader.previousBials && selectedLeader.previousBials.length > 0 && (
                                     <div className="text-xs mt-1 leading-relaxed">
                                        <span className="font-bold uppercase tracking-widest text-church-400 mr-2">Previous Bials:</span>
                                        {selectedLeader.previousBials.map((b, i) => (
                                            <span key={i} className="inline-block mr-2">
                                                {b.field} <span className="opacity-70">({b.period})</span>{i < selectedLeader.previousBials!.length - 1 ? ',' : ''}
                                            </span>
                                        ))}
                                     </div>
                                )}
                                
                                {selectedLeader.phoneNumber && (
                                    <div className="mt-3">
                                        <ProtectedContact 
                                            phone={selectedLeader.phoneNumber} 
                                            name={selectedLeader.name} 
                                            variant="full" 
                                            className="max-w-[280px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-8 md:p-12 overflow-y-auto bg-white flex-1">
                    <div className="grid lg:grid-cols-12 gap-12">
                        {/* Bio Text */}
                        <div className="lg:col-span-8">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-px bg-slate-100 flex-1"></div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Biography & Testimonial</h3>
                                <div className="h-px bg-slate-100 flex-1"></div>
                            </div>
                            
                            {selectedLeader.biography ? (
                                <article 
                                    className="prose prose-slate prose-lg max-w-none font-serif text-slate-700 leading-relaxed ql-editor !p-0"
                                    dangerouslySetInnerHTML={{ __html: selectedLeader.biography }}
                                />
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <BookOpen size={40} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 italic">Detailed biography not yet added to Firebase.</p>
                                    {isAdmin && <p className="text-church-600 text-sm mt-2 font-bold underline cursor-pointer" onClick={() => {
                                        setEditingStaff(selectedLeader);
                                        setTargetCollection(
                                            pastors.some(p => p.id === selectedLeader.id) ? 'pastors' :
                                            proPastors.some(p => p.id === selectedLeader.id) ? 'proPastors' : 'elders'
                                        );
                                        setIsStaffEditModalOpen(true);
                                    }}>Click here to add biography</p>}
                                </div>
                            )}
                        </div>

                        {/* Sidebar Info */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                                <Quote size={48} className="absolute -top-4 -left-4 text-church-100" />
                                <h4 className="text-xs font-black text-church-600 uppercase tracking-widest mb-4 relative z-10">Mission / Quote</h4>
                                <p className="text-slate-600 italic font-serif leading-relaxed relative z-10">
                                    "{selectedLeader.description}"
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Leadership Record</h4>
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-church-50 rounded-xl flex items-center justify-center text-church-600 shadow-inner">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Current Role</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedLeader.role}</p>
                                    </div>
                                </div>
                            </div>

                            {isAdmin && (
                                <button 
                                    onClick={() => {
                                        setEditingStaff(selectedLeader);
                                        setTargetCollection(
                                            pastors.some(p => p.id === selectedLeader.id) ? 'pastors' :
                                            proPastors.some(p => p.id === selectedLeader.id) ? 'proPastors' : 'elders'
                                        );
                                        setIsStaffEditModalOpen(true);
                                    }}
                                    className="w-full py-4 bg-church-50 text-church-700 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-church-100 hover:bg-church-100 transition shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Edit size={14} /> Edit Firebase Record
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Footer Controls */}
                <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        © Champhai Bethel Kohhran Archives
                    </p>
                    <button 
                        onClick={() => setSelectedLeader(null)}
                        className="px-10 py-3 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition shadow-lg"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

// Rich Text Page Content Edit Modal Component
interface PageContentEditModalProps {
    content: Partial<AboutPageContent>;
    onClose: () => void;
    onSave: (data: Partial<AboutPageContent>) => void;
    isLoading: boolean;
}

type SectionTab = 'history' | 'mission' | 'faith' | 'overview' | 'stats';

const PageContentEditModal: React.FC<PageContentEditModalProps> = ({ content, onClose, onSave, isLoading }) => {
    const [formData, setFormData] = useState<Partial<AboutPageContent>>(content);
    const [activeLang, setActiveLang] = useState<'mizo' | 'en'>('mizo');
    const [activeTab, setActiveTab] = useState<SectionTab>('history');
    const [showLivePreview, setShowLivePreview] = useState(false);
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [activeTableField, setActiveTableField] = useState<keyof AboutPageContent>('mizo_historyText');
    const [tableInitialText, setTableInitialText] = useState('');

    const handleTextChange = (field: keyof AboutPageContent, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOpenTableBuilder = (field: keyof AboutPageContent) => {
        setActiveTableField(field);
        const currentVal = formData[field] as string || '';
        if (/(S[Il]\.?\s*No|KOHHRAN\s+UPATE|UPA\s+HMING)/i.test(currentVal)) {
            const plainText = currentVal.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ').trim();
            setTableInitialText(plainText);
        } else {
            setTableInitialText('');
        }
        setIsTableModalOpen(true);
    };

    const handleTableInserted = (tableHtml: string) => {
        const currentVal = (formData[activeTableField] as string) || '';
        let updated = '';
        if (currentVal) {
            updated = `${currentVal}<p><br/></p>${tableHtml}<p><br/></p>`;
        } else {
            updated = tableHtml;
        }
        handleTextChange(activeTableField, updated);
    };

    const handleNumberChange = (field: keyof AboutPageContent, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value === '' ? 0 : parseInt(value, 10) || 0 }));
    };

    const handleSaveClick = () => {
        onSave(formData);
    };

    // Helper for active language field names
    const getField = (suffix: string): keyof AboutPageContent => {
        return `${activeLang}_${suffix}` as keyof AboutPageContent;
    };

    const tabs: { id: SectionTab; label: string; icon: React.ReactNode; badge?: string }[] = [
        { id: 'history', label: 'History (Chanchin)', icon: <History size={16} /> },
        { id: 'mission', label: 'Mission (Tum)', icon: <Target size={16} /> },
        { id: 'faith', label: 'Faith (Rinna)', icon: <ShieldCheck size={16} /> },
        { id: 'overview', label: 'Header & Subtitle', icon: <Type size={16} /> },
        { id: 'stats', label: 'Statistics', icon: <BarChart3 size={16} /> },
    ];

    return (
        <>
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                
                {/* Modal Header */}
                <div className="p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/80 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-church-600 text-white flex items-center justify-center shadow-md shadow-church-200 shrink-0">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900">About Page Editor</h3>
                            <p className="text-xs text-slate-500 font-medium">Customize history, mission, faith statement & statistics with rich text</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        {/* Language Selector */}
                        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setActiveLang('mizo')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    activeLang === 'mizo' 
                                        ? 'bg-church-600 text-white shadow-sm' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <span>🇲🇿</span> Mizo
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveLang('en')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    activeLang === 'en' 
                                        ? 'bg-church-600 text-white shadow-sm' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <span>🇬🇧</span> English
                            </button>
                        </div>

                        {/* Close button */}
                        <button 
                            onClick={onClose} 
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-full transition border border-transparent hover:border-slate-200"
                        >
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* Section Navigation Tabs */}
                <div className="bg-slate-100/70 border-b border-slate-200 px-4 sm:px-6 pt-3 flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-bold transition whitespace-nowrap border-t-2 ${
                                    isActive
                                        ? 'bg-white text-church-700 border-church-600 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]'
                                        : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/50'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content Body */}
                <div className="p-5 sm:p-8 space-y-6 overflow-y-auto flex-1 bg-white">
                    
                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="space-y-5 animate-in fade-in duration-150">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <History size={18} className="text-church-600" />
                                        <span>History Section ({activeLang === 'mizo' ? 'Kan Chanchin' : 'Our History'})</span>
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Founding story, milestones, and church background</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenTableBuilder(getField('historyText'))}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-church-50 text-church-700 hover:bg-church-100 border border-church-200 shadow-xs transition"
                                    >
                                        <TableIcon size={14} className="text-church-600" />
                                        <span>Insert / Format Table</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowLivePreview(!showLivePreview)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                            showLivePreview ? 'bg-church-50 text-church-700 border-church-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        <Eye size={14} /> {showLivePreview ? 'Edit Mode' : 'Preview'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                    Section Title
                                </label>
                                <input
                                    type="text"
                                    value={formData[getField('historyTitle')] as string || ''}
                                    onChange={e => handleTextChange(getField('historyTitle'), e.target.value)}
                                    placeholder={activeLang === 'mizo' ? 'Kan Chanchin' : 'Our History'}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none text-slate-800 font-semibold"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                                        Detailed History Story (Rich Text)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenTableBuilder(getField('historyText'))}
                                        className="text-[11px] font-bold text-church-600 hover:text-church-800 underline flex items-center gap-1"
                                    >
                                        <FileSpreadsheet size={13} />
                                        <span>Convert or Insert Column Table</span>
                                    </button>
                                </div>
                                
                                {showLivePreview ? (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 min-h-[220px]">
                                        <div className="prose prose-slate max-w-none ql-editor !p-0 font-sans text-slate-700"
                                            dangerouslySetInnerHTML={{ __html: formatRichText(formData[getField('historyText')] as string || '') }}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-church-500 focus-within:border-church-500">
                                        <ReactQuill
                                            theme="snow"
                                            value={formData[getField('historyText')] as string || ''}
                                            onChange={val => handleTextChange(getField('historyText'), val)}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            className="h-64 mb-12 sm:mb-14 font-sans text-slate-800"
                                            placeholder="Write or paste your church history here..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MISSION TAB */}
                    {activeTab === 'mission' && (
                        <div className="space-y-5 animate-in fade-in duration-150">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <Target size={18} className="text-church-600" />
                                        <span>Mission & Vision Section ({activeLang === 'mizo' ? 'Kan Tum' : 'Our Mission'})</span>
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Core mission statement, outreach vision, and evangelism objectives</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenTableBuilder(getField('missionText'))}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-church-50 text-church-700 hover:bg-church-100 border border-church-200 shadow-xs transition"
                                    >
                                        <TableIcon size={14} className="text-church-600" />
                                        <span>Insert Table</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowLivePreview(!showLivePreview)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                            showLivePreview ? 'bg-church-50 text-church-700 border-church-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        <Eye size={14} /> {showLivePreview ? 'Edit Mode' : 'Preview'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                    Section Title
                                </label>
                                <input
                                    type="text"
                                    value={formData[getField('missionTitle')] as string || ''}
                                    onChange={e => handleTextChange(getField('missionTitle'), e.target.value)}
                                    placeholder={activeLang === 'mizo' ? 'Kan Tum' : 'Our Mission'}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none text-slate-800 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>Mission Statement Content (Rich Text)</span>
                                    <span className="text-[10px] font-normal text-slate-400 lowercase">supports formatting, headings, lists & links</span>
                                </label>
                                
                                {showLivePreview ? (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 min-h-[220px]">
                                        <div className="prose prose-slate max-w-none ql-editor !p-0 font-sans text-slate-700"
                                            dangerouslySetInnerHTML={{ __html: formatRichText(formData[getField('missionText')] as string || '') }}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-church-500 focus-within:border-church-500">
                                        <ReactQuill
                                            theme="snow"
                                            value={formData[getField('missionText')] as string || ''}
                                            onChange={val => handleTextChange(getField('missionText'), val)}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            className="h-64 mb-12 sm:mb-14 font-sans text-slate-800"
                                            placeholder="Write your mission & vision statement here..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* FAITH TAB */}
                    {activeTab === 'faith' && (
                        <div className="space-y-5 animate-in fade-in duration-150">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <ShieldCheck size={18} className="text-church-600" />
                                        <span>Statement of Faith ({activeLang === 'mizo' ? 'Kan Rinna' : 'Our Faith'})</span>
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Foundational theological beliefs, scriptures, and doctrinal statements</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenTableBuilder(getField('faithText'))}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-church-50 text-church-700 hover:bg-church-100 border border-church-200 shadow-xs transition"
                                    >
                                        <TableIcon size={14} className="text-church-600" />
                                        <span>Insert Table</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowLivePreview(!showLivePreview)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                            showLivePreview ? 'bg-church-50 text-church-700 border-church-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        <Eye size={14} /> {showLivePreview ? 'Edit Mode' : 'Preview'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                    Section Title
                                </label>
                                <input
                                    type="text"
                                    value={formData[getField('faithTitle')] as string || ''}
                                    onChange={e => handleTextChange(getField('faithTitle'), e.target.value)}
                                    placeholder={activeLang === 'mizo' ? 'Kan Rinna' : 'Our Faith'}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none text-slate-800 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>Statement of Faith Body (Rich Text)</span>
                                    <span className="text-[10px] font-normal text-slate-400 lowercase">supports formatting, headings, lists & links</span>
                                </label>
                                
                                {showLivePreview ? (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 min-h-[220px]">
                                        <div className="prose prose-slate max-w-none ql-editor !p-0 font-sans text-slate-700"
                                            dangerouslySetInnerHTML={{ __html: formatRichText(formData[getField('faithText')] as string || '') }}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-church-500 focus-within:border-church-500">
                                        <ReactQuill
                                            theme="snow"
                                            value={formData[getField('faithText')] as string || ''}
                                            onChange={val => handleTextChange(getField('faithText'), val)}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            className="h-64 mb-12 sm:mb-14 font-sans text-slate-800"
                                            placeholder="Write your doctrinal beliefs and statement of faith here..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* OVERVIEW / HEADER TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-150">
                            <div>
                                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Type size={18} className="text-church-600" />
                                    <span>About Page Header & Subtitle ({activeLang === 'mizo' ? 'Mizo' : 'English'})</span>
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">Top banner headline and introduction tagline</p>
                            </div>

                            <div className="space-y-4 bg-slate-50/80 p-6 rounded-2xl border border-slate-200">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                        Main Page Headline
                                    </label>
                                    <input
                                        type="text"
                                        value={formData[getField('title')] as string || ''}
                                        onChange={e => handleTextChange(getField('title'), e.target.value)}
                                        placeholder={activeLang === 'mizo' ? 'Kan Chanchin' : 'About Us'}
                                        className="w-full border border-slate-200 bg-white p-3 rounded-xl focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none text-slate-800 font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                        Page Subtitle / Tagline
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData[getField('subtitle')] as string || ''}
                                        onChange={e => handleTextChange(getField('subtitle'), e.target.value)}
                                        placeholder={activeLang === 'mizo' ? 'Pathian hriat leh amah hriattir.' : 'To know God and make Him known.'}
                                        className="w-full border border-slate-200 bg-white p-3 rounded-xl focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none text-slate-800 font-medium leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STATISTICS TAB */}
                    {activeTab === 'stats' && (
                        <div className="space-y-6 animate-in fade-in duration-150">
                            <div>
                                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <BarChart3 size={18} className="text-church-600" />
                                    <span>Church Statistics Counters</span>
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">Key figures displayed on the About page counter banner</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center gap-3 mb-3 text-church-600">
                                        <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-100">
                                            <Users size={20} />
                                        </div>
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                            Chhungkua (Families)
                                        </label>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stats_families ?? ''}
                                        onChange={e => handleNumberChange('stats_families', e.target.value)}
                                        placeholder="e.g. 250"
                                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-church-500 outline-none text-center"
                                    />
                                </div>

                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center gap-3 mb-3 text-blue-600">
                                        <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-100">
                                            <UserCheck size={20} />
                                        </div>
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                            Member Zawng (Members)
                                        </label>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stats_members ?? ''}
                                        onChange={e => handleNumberChange('stats_members', e.target.value)}
                                        placeholder="e.g. 1200"
                                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-church-500 outline-none text-center"
                                    />
                                </div>

                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center gap-3 mb-3 text-emerald-600">
                                        <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-100">
                                            <GraduationCap size={20} />
                                        </div>
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                            Sunday School Zirlai
                                        </label>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stats_sundayschool ?? ''}
                                        onChange={e => handleNumberChange('stats_sundayschool', e.target.value)}
                                        placeholder="e.g. 450"
                                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-church-500 outline-none text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Modal Footer */}
                <div className="p-5 sm:p-6 border-t bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-3xl shrink-0">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start sm:self-auto">
                        <Check size={15} className="text-emerald-500" />
                        <span>Changes will be immediately saved to Firebase Firestore</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="px-5 py-2.5 text-slate-700 font-bold hover:bg-white transition rounded-2xl border border-slate-300 text-xs uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button"
                            onClick={handleSaveClick} 
                            disabled={isLoading} 
                            className="px-7 py-2.5 bg-church-600 hover:bg-church-700 text-white rounded-2xl flex items-center shadow-lg font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="animate-spin w-4 h-4 mr-2" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} className="mr-2" /> Save Content
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>

        {isTableModalOpen && (
            <TableBuilderModal
                isOpen={isTableModalOpen}
                onClose={() => setIsTableModalOpen(false)}
                onInsertTable={handleTableInserted}
                initialText={tableInitialText}
            />
        )}
        </>
    );
};

export default About;

