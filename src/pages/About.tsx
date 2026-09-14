
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FileSpreadsheet, Wand2, Image as ImageIcon, Home as HomeIcon, Baby
} from 'lucide-react';
import StatsCounter from '../components/StatsCounter';
import { useAuth } from '../contexts/AuthContext';
import StaffEditModal from '../components/StaffEditModal';
import TableBuilderModal, { parseTextToTableData, generateTableHtml } from '../components/TableBuilderModal';
import { ImageInsertModal } from '../components/ImageInsertModal';
import { attachImagePasteAndDrop, insertImageAtQuillCursor, sanitizeContentForStorage } from '../utils/imageUtils';
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
    ['blockquote', 'link', 'image'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false
  }
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'align',
  'blockquote', 'link', 'image'
];

// Helper to gracefully render rich HTML or plain text fallback
const formatRichText = (rawContent?: string): string => {
  if (!rawContent) return '';

  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawContent);
  if (hasHtmlTags) {
    let html = rawContent.replace(/&nbsp;/g, ' ');
    // Ensure all <table> elements have responsive wrapper
    if (html.includes('<table') && !html.includes('table-responsive-wrapper')) {
      html = html.replace(/<table([\s\S]*?)<\/table>/gi, (match) => {
        return `<div class="table-responsive-wrapper">${match}</div>`;
      });
    }
    return html;
  }

  return rawContent
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
              // Convert any inline base64/pasted images to permanent hosted URLs to stay well within Firestore 1MB limits
              const cleanContent = await sanitizeContentForStorage(newContent);
              await db.collection('settings').doc('aboutPage').set(cleanContent, { merge: true });
              setContent(cleanContent);
              setIsPageEditModalOpen(false);
          } catch (error) {
              console.error("Error saving page content:", error);
              alert("Failed to save content: " + (error instanceof Error ? error.message : "Unknown error"));
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

        {/* Latest Church Statistics (Inchhiarna) */}
        <div id="inchhiarna-section" className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-10 lg:p-12">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-church-50 text-church-800 text-xs font-bold tracking-wide uppercase mb-3 border border-church-200">
                    <BarChart3 size={14} className="text-church-600" />
                    <span>Official Church Statistics</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                    Inchhiarna (as of August 2023)
                </h2>
                <div className="h-1 w-20 bg-church-500 mx-auto my-4 rounded-full"></div>
                <p className="text-slate-600 text-sm sm:text-base font-medium">
                    Champai Bethel Kohhran Chhungkaw Inchhiarna Statistics
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    (1st September 2025 atanga 31st August 2026 / As on 31st August 2026)
                </p>
            </div>

            {/* Quick Stat Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm">
                    <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider mb-1">Kohhran Mi Zawng</p>
                    <p className="text-3xl font-black text-white">2,114</p>
                    <p className="text-[11px] text-slate-300 mt-1 font-medium">Mipa: 1,021 • Hmeichhia: 1,093</p>
                </div>
                <div className="bg-gradient-to-br from-church-700 to-church-900 text-white p-5 rounded-2xl shadow-sm">
                    <p className="text-xs text-church-200 font-semibold uppercase tracking-wider mb-1">Dan Zawh Kim</p>
                    <p className="text-3xl font-black text-white">1,527</p>
                    <p className="text-[11px] text-church-200 mt-1 font-medium">72.2% of total membership</p>
                </div>
                <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-5 rounded-2xl shadow-sm">
                    <p className="text-xs text-amber-200 font-semibold uppercase tracking-wider mb-1">Chhungkua</p>
                    <p className="text-3xl font-black text-white">435</p>
                    <p className="text-[11px] text-amber-200 mt-1 font-medium">Inawmpawlh: 10</p>
                </div>
                <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white p-5 rounded-2xl shadow-sm">
                    <p className="text-xs text-teal-200 font-semibold uppercase tracking-wider mb-1">Naupang (≤ 14 Kum)</p>
                    <p className="text-3xl font-black text-white">547</p>
                    <p className="text-[11px] text-teal-200 mt-1 font-medium">Baptisma chang: 540 • Chang lo: 7</p>
                </div>
            </div>

            {/* Detailed Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Table (Cols 1-7 on desktop) */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                        <div className="bg-church-800 text-white px-5 py-3.5 flex justify-between items-center font-bold text-sm tracking-wide">
                            <span className="uppercase tracking-wider text-xs">CATEGORY / DESCRIPTION</span>
                            <span className="uppercase tracking-wider text-xs">ZAT (COUNT)</span>
                        </div>
                        
                        <div className="divide-y divide-slate-100 text-sm">
                            <div className="px-5 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <span className="text-slate-700 font-medium">Dan zawh kim</span>
                                <span className="font-bold text-slate-900 font-mono text-base">1527</span>
                            </div>
                            <div className="px-5 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <span className="text-slate-700 font-medium">Puitling Baptisma chang tawh (Dan la zawh kim lo)</span>
                                <span className="font-bold text-slate-900 font-mono text-base">3</span>
                            </div>
                            <div className="px-5 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <span className="text-slate-700 font-medium">Puitling kum 15 chin chung lam (Baptisma chang lo)</span>
                                <span className="font-bold text-slate-900 font-mono text-base">0</span>
                            </div>
                            <div className="px-5 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <span className="text-slate-700 font-medium">Naupang kum 14 leh hnuai lam (Baptisma chang tawh)</span>
                                <span className="font-bold text-slate-900 font-mono text-base">540</span>
                            </div>
                            <div className="px-5 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <span className="text-slate-700 font-medium">Naupang kum 14 hnuai lam (Baptisma chang lo)</span>
                                <span className="font-bold text-slate-900 font-mono text-base">7</span>
                            </div>
                            <div className="px-5 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <span className="text-slate-700 font-medium">Thunun tawk mek zat</span>
                                <span className="font-bold text-slate-900 font-mono text-base">37</span>
                            </div>

                            {/* Subtotal Total (Cols 1-6) */}
                            <div className="px-5 py-3.5 bg-church-50/70 flex justify-between items-center font-bold text-church-900 border-t-2 border-church-200">
                                <span className="text-church-950 font-bold">Total (Cols 1-6)</span>
                                <span className="text-lg font-mono text-church-900 font-extrabold">2114</span>
                            </div>

                            <div className="px-5 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <span className="text-slate-700 font-medium">Mipa zawng zawng</span>
                                <span className="font-bold text-slate-900 font-mono text-base">1021</span>
                            </div>
                            <div className="px-5 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <span className="text-slate-700 font-medium">Hmeichhia zawng zawng</span>
                                <span className="font-bold text-slate-900 font-mono text-base">1093</span>
                            </div>

                            {/* Total Mipa & Hmeichhia */}
                            <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center font-bold">
                                <span className="tracking-wide">Total Mipa & Hmeichhia</span>
                                <span className="text-xl font-mono text-amber-300 font-black">2114</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Chhungkua, Naupiang & Mitthi (Cols 8-12 on desktop) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Chhungkua Box */}
                    <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-amber-200/60">
                            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                                <HomeIcon size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-serif font-bold text-amber-950">Chhungkua</h3>
                                <p className="text-xs text-amber-800 font-medium">Families & Church Transfers</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center text-slate-800 bg-white/70 px-3.5 py-2.5 rounded-lg border border-amber-100">
                                <span className="font-medium text-slate-700">Kohhran mi awm hlangna chhungkua</span>
                                <span className="font-bold text-amber-950 font-mono text-base">435</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-800 bg-white/70 px-3.5 py-2.5 rounded-lg border border-amber-100">
                                <span className="font-medium text-slate-700">Inawmpawlhna chhungkua</span>
                                <span className="font-bold text-amber-950 font-mono text-base">10</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-800 bg-white/70 px-3.5 py-2.5 rounded-lg border border-amber-100">
                                <span className="font-medium text-slate-700">Pawl danga pakai</span>
                                <span className="font-bold text-amber-950 font-mono text-base">2</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-800 bg-white/70 px-3.5 py-2.5 rounded-lg border border-amber-100">
                                <span className="font-medium text-slate-700">Pawl dang atanga rawn pakai</span>
                                <span className="font-bold text-amber-950 font-mono text-base">31</span>
                            </div>
                        </div>
                    </div>

                    {/* Naupiang zat & Mitthi zat Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nau piang zat */}
                        <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                            <div>
                                <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-rose-200/60 text-rose-900">
                                    <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                                        <Baby size={16} />
                                    </div>
                                    <h4 className="font-bold text-base text-rose-950">Nau piang zat</h4>
                                </div>
                                <div className="space-y-2 text-sm text-slate-700 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Mipa</span>
                                        <span className="font-bold font-mono text-rose-950">11</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Hmeichhia</span>
                                        <span className="font-bold font-mono text-rose-950">12</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-rose-200/60 text-rose-950 px-3.5 py-2 rounded-xl flex justify-between items-center font-bold text-sm">
                                <span>Naupiang belhkhawm</span>
                                <span className="text-base font-black font-mono">23</span>
                            </div>
                        </div>

                        {/* Mitthi zat */}
                        <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                            <div>
                                <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-teal-200/60 text-teal-900">
                                    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                                        <Users size={16} />
                                    </div>
                                    <h4 className="font-bold text-base text-teal-950">Mitthi zat</h4>
                                </div>
                                <div className="space-y-2 text-sm text-slate-700 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500"></span> Mipa</span>
                                        <span className="font-bold font-mono text-teal-950">12</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500"></span> Hmeichhia</span>
                                        <span className="font-bold font-mono text-teal-950">3</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-teal-200/60 text-teal-950 px-3.5 py-2 rounded-xl flex justify-between items-center font-bold text-sm">
                                <span>Mitthi belhkhawm</span>
                                <span className="text-base font-black font-mono">15</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Official Footer Tag */}
            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Champai Bethel Kohhran Chhungkaw Inchhiarna Form • 1st September 2025 atanga 31st August 2026
                </p>
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

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [activeImageField, setActiveImageField] = useState<keyof AboutPageContent>('mizo_historyText');
    const [uploadStatus, setUploadStatus] = useState<{ uploading: boolean; message: string }>({ uploading: false, message: '' });

    const historyQuillRef = useRef<any>(null);
    const missionQuillRef = useRef<any>(null);
    const faithQuillRef = useRef<any>(null);

    const handleTextChange = (field: keyof AboutPageContent, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getActiveEditorRef = (field: keyof AboutPageContent) => {
        const f = field.toString();
        if (f.includes('history')) return historyQuillRef;
        if (f.includes('mission')) return missionQuillRef;
        return faithQuillRef;
    };

    const handleOpenImageModal = (field: keyof AboutPageContent) => {
        setActiveImageField(field);
        setIsImageModalOpen(true);
    };

    const handleImageInserted = (htmlSnippet: string) => {
        try {
            const editorRef = getActiveEditorRef(activeImageField);
            if (editorRef.current) {
                const editor = editorRef.current.getEditor();
                const selection = editor?.getSelection() || { index: editor?.getLength() - 1, length: 0 };
                editor.clipboard.dangerouslyPasteHTML(selection.index, htmlSnippet);
                const updatedVal = editor.root.innerHTML;
                handleTextChange(activeImageField, updatedVal);
                return;
            }
        } catch {
            // ignore
        }

        const currentVal = (formData[activeImageField] as string) || '';
        const updated = currentVal ? `${currentVal}${htmlSnippet}` : htmlSnippet;
        handleTextChange(activeImageField, updated);
    };

    // Helper for active language field names
    const getField = (suffix: string): keyof AboutPageContent => {
        return `${activeLang}_${suffix}` as keyof AboutPageContent;
    };

    // Attach paste and drag-and-drop image listeners to the active Quill editor instances
    useEffect(() => {
        const cleanups: (() => void)[] = [];

        const attach = (ref: React.RefObject<any>, field: keyof AboutPageContent) => {
            if (ref.current) {
                const editor = ref.current.getEditor();
                if (editor) {
                    const cleanup = attachImagePasteAndDrop(editor, (status) => {
                        setUploadStatus(status);
                        if (!status.uploading) {
                            setTimeout(() => {
                                handleTextChange(field, editor.root.innerHTML);
                            }, 50);
                        }
                    });
                    cleanups.push(cleanup);
                }
            }
        };

        const timer = setTimeout(() => {
            attach(historyQuillRef, getField('historyText'));
            attach(missionQuillRef, getField('missionText'));
            attach(faithQuillRef, getField('faithText'));
        }, 200);

        return () => {
            clearTimeout(timer);
            cleanups.forEach(fn => fn());
        };
    }, [activeTab, activeLang]);

    const getEditorModules = useCallback((field: keyof AboutPageContent) => ({
        toolbar: {
            container: [
                [{ header: [1, 2, 3, 4, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ color: [] }, { background: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ align: [] }],
                ['blockquote', 'link', 'image'],
                ['clean']
            ],
            handlers: {
                image: () => handleOpenImageModal(field)
            }
        },
        clipboard: {
            matchVisual: false
        }
    }), [activeLang]);

    const handleOpenTableBuilder = (field: keyof AboutPageContent) => {
        setActiveTableField(field);
        let selectedSnippet = '';
        try {
            const editorRef = getActiveEditorRef(field);
            if (editorRef.current) {
                const editor = editorRef.current.getEditor();
                const selection = editor?.getSelection();
                if (selection && selection.length > 0) {
                    // Extract ONLY the text that the user highlighted
                    selectedSnippet = editor.getText(selection.index, selection.length).trim();
                }
            }
        } catch {
            // ignore
        }
        setTableInitialText(selectedSnippet);
        setIsTableModalOpen(true);
    };

    const handleTableInserted = (tableHtml: string) => {
        try {
            const editorRef = getActiveEditorRef(activeTableField);
            if (editorRef.current) {
                const editor = editorRef.current.getEditor();
                const selection = editor?.getSelection();
                if (selection) {
                    if (selection.length > 0) {
                        editor.deleteText(selection.index, selection.length);
                    }
                    editor.clipboard.dangerouslyPasteHTML(selection.index, `<p><br/></p>${tableHtml}<p><br/></p>`);
                    const updatedVal = editor.root.innerHTML;
                    handleTextChange(activeTableField, updatedVal);
                    return;
                }
            }
        } catch {
            // ignore
        }

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
                                        onClick={() => handleOpenImageModal(getField('historyText'))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-church-50 text-church-700 hover:bg-church-100 border border-church-200 shadow-2xs transition"
                                    >
                                        <ImageIcon size={14} className="text-church-600" />
                                        <span>Insert Image</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenTableBuilder(getField('historyText'))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs transition"
                                    >
                                        <TableIcon size={14} className="text-slate-600" />
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
                                    value={formData[getField('historyTitle')] as string || ''}
                                    onChange={e => handleTextChange(getField('historyTitle'), e.target.value)}
                                    placeholder={activeLang === 'mizo' ? 'Kan Chanchin' : 'Our History'}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none text-slate-800 font-semibold"
                                />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                                        Detailed History Story (Rich Text & Images)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenImageModal(getField('historyText'))}
                                            className="text-[11px] font-bold text-church-700 hover:text-church-900 bg-church-50 hover:bg-church-100 border border-church-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                                        >
                                            <ImageIcon size={12} className="text-church-600" />
                                            <span>Add Image</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenTableBuilder(getField('historyText'))}
                                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                                        >
                                            <FileSpreadsheet size={12} />
                                            <span>Table Formatter</span>
                                        </button>
                                    </div>
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
                                            ref={historyQuillRef}
                                            theme="snow"
                                            value={formData[getField('historyText')] as string || ''}
                                            onChange={val => handleTextChange(getField('historyText'), val)}
                                            modules={getEditorModules(getField('historyText'))}
                                            formats={quillFormats}
                                            className="h-64 mb-12 sm:mb-14 font-sans text-slate-800"
                                            placeholder="Write or paste your church history here..."
                                        />
                                    </div>
                                )}

                                {uploadStatus.uploading && (
                                    <div className="mt-2 flex items-center gap-2 p-2.5 bg-church-50 border border-church-200 rounded-xl text-xs font-bold text-church-800 animate-pulse">
                                        <Loader size={14} className="animate-spin text-church-600" />
                                        <span>{uploadStatus.message || 'Uploading and placing image in paragraph...'}</span>
                                    </div>
                                )}
                                <p className="text-[11px] text-slate-400 italic flex items-center gap-1 mt-1.5">
                                    <span>💡 <strong>Tip:</strong> You can paste (Ctrl+V / Cmd+V) any screenshot or copied image directly anywhere inside paragraphs, or click <strong>Insert Image</strong>.</span>
                                </p>
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
                                        onClick={() => handleOpenImageModal(getField('missionText'))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-church-50 text-church-700 hover:bg-church-100 border border-church-200 shadow-2xs transition"
                                    >
                                        <ImageIcon size={14} className="text-church-600" />
                                        <span>Insert Image</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenTableBuilder(getField('missionText'))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs transition"
                                    >
                                        <TableIcon size={14} className="text-slate-600" />
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
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                                        Mission Statement Content (Rich Text & Images)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenImageModal(getField('missionText'))}
                                        className="text-[11px] font-bold text-church-700 hover:text-church-900 bg-church-50 hover:bg-church-100 border border-church-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                                    >
                                        <ImageIcon size={12} className="text-church-600" />
                                        <span>Add Image</span>
                                    </button>
                                </div>
                                
                                {showLivePreview ? (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 min-h-[220px]">
                                        <div className="prose prose-slate max-w-none ql-editor !p-0 font-sans text-slate-700"
                                            dangerouslySetInnerHTML={{ __html: formatRichText(formData[getField('missionText')] as string || '') }}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-church-500 focus-within:border-church-500">
                                        <ReactQuill
                                            ref={missionQuillRef}
                                            theme="snow"
                                            value={formData[getField('missionText')] as string || ''}
                                            onChange={val => handleTextChange(getField('missionText'), val)}
                                            modules={getEditorModules(getField('missionText'))}
                                            formats={quillFormats}
                                            className="h-64 mb-12 sm:mb-14 font-sans text-slate-800"
                                            placeholder="Write your mission & vision statement here..."
                                        />
                                    </div>
                                )}

                                {uploadStatus.uploading && (
                                    <div className="mt-2 flex items-center gap-2 p-2.5 bg-church-50 border border-church-200 rounded-xl text-xs font-bold text-church-800 animate-pulse">
                                        <Loader size={14} className="animate-spin text-church-600" />
                                        <span>{uploadStatus.message || 'Uploading and placing image in paragraph...'}</span>
                                    </div>
                                )}
                                <p className="text-[11px] text-slate-400 italic flex items-center gap-1 mt-1.5">
                                    <span>💡 <strong>Tip:</strong> Paste any picture or screenshot directly into the paragraph.</span>
                                </p>
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
                                        onClick={() => handleOpenImageModal(getField('faithText'))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-church-50 text-church-700 hover:bg-church-100 border border-church-200 shadow-2xs transition"
                                    >
                                        <ImageIcon size={14} className="text-church-600" />
                                        <span>Insert Image</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenTableBuilder(getField('faithText'))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs transition"
                                    >
                                        <TableIcon size={14} className="text-slate-600" />
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
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                                        Statement of Faith Body (Rich Text & Images)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenImageModal(getField('faithText'))}
                                        className="text-[11px] font-bold text-church-700 hover:text-church-900 bg-church-50 hover:bg-church-100 border border-church-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                                    >
                                        <ImageIcon size={12} className="text-church-600" />
                                        <span>Add Image</span>
                                    </button>
                                </div>
                                
                                {showLivePreview ? (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 min-h-[220px]">
                                        <div className="prose prose-slate max-w-none ql-editor !p-0 font-sans text-slate-700"
                                            dangerouslySetInnerHTML={{ __html: formatRichText(formData[getField('faithText')] as string || '') }}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-church-500 focus-within:border-church-500">
                                        <ReactQuill
                                            ref={faithQuillRef}
                                            theme="snow"
                                            value={formData[getField('faithText')] as string || ''}
                                            onChange={val => handleTextChange(getField('faithText'), val)}
                                            modules={getEditorModules(getField('faithText'))}
                                            formats={quillFormats}
                                            className="h-64 mb-12 sm:mb-14 font-sans text-slate-800"
                                            placeholder="Write your doctrinal beliefs and statement of faith here..."
                                        />
                                    </div>
                                )}

                                {uploadStatus.uploading && (
                                    <div className="mt-2 flex items-center gap-2 p-2.5 bg-church-50 border border-church-200 rounded-xl text-xs font-bold text-church-800 animate-pulse">
                                        <Loader size={14} className="animate-spin text-church-600" />
                                        <span>{uploadStatus.message || 'Uploading and placing image in paragraph...'}</span>
                                    </div>
                                )}
                                <p className="text-[11px] text-slate-400 italic flex items-center gap-1 mt-1.5">
                                    <span>💡 <strong>Tip:</strong> Paste images directly anywhere inside the statement of faith.</span>
                                </p>
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

        {isImageModalOpen && (
            <ImageInsertModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onInsertImage={handleImageInserted}
            />
        )}
        </>
    );
};

export default About;

