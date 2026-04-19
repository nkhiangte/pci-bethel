
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';
import { Staff } from '../types';
import { db } from '../services/firebase';
import { Loader, History, Target, ShieldCheck, Plus, Edit, Trash, BookOpen, Quote, Calendar, X, Users, ChevronRight, Phone, MessageCircle, Save, BarChart3 } from 'lucide-react';
import StatsCounter from '../components/StatsCounter';
import { useAuth } from '../contexts/AuthContext';
import StaffEditModal from '../components/StaffEditModal';
import { translations } from '../translations';
import { ProtectedContact } from '../components/ProtectedContact';

// Define the structure for the editable content
interface AboutPageContent {
  en_title: string;
  mizo_title: string;
  en_subtitle: string;
  mizo_subtitle: string;
  en_historyTitle: string;
  mizo_historyTitle: string;
  en_historyText: string;
  mizo_historyText: string;
  en_missionTitle: string;
  mizo_missionTitle: string;
  en_missionText: string;
  mizo_missionText: string;
  en_faithTitle: string;
  mizo_faithTitle: string;
  en_faithText: string;
  mizo_faithText: string;
  stats_families?: number;
  stats_members?: number;
  stats_sundayschool?: number;
}

const About: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAdmin } = useAuth();
  const { pastors: staticPastors, elders: staticElders, proPastors: staticProPastors } = getConstants(language);

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
      setPastors(staticPastors);
      setProPastors(staticProPastors);
      setElders(staticElders);
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
          if (snap.empty) return null;
          const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          return data.filter((item: any, index: number, self: any[]) =>
            index === self.findIndex((t) => t.name === item.name)
          );
      };

      setPastors(getUniqueData(pSnap) || staticPastors);
      setProPastors(getUniqueData(ppSnap) || staticProPastors);
      setElders(getUniqueData(eSnap) || staticElders);
    } catch (error) {
      console.error("Error fetching page data:", error);
      setPastors(staticPastors);
      setProPastors(staticProPastors);
      setElders(staticElders);
    }
    setLoading(false);
  }, [staticPastors, staticProPastors, staticElders]);

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
      const langKey = `${language}_${key.split('_')[1]}` as keyof AboutPageContent;
      return (content as any)[langKey] || fallback;
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
      stats_families: content.stats_families || 440,
      stats_members: content.stats_members || 2094,
      stats_sundayschool: content.stats_sundayschool || 1773,
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
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-church-700 transition shadow-lg"
              >
                  <Edit size={16} /> Edit Page Content
              </button>
          </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* History & Mission */}
        <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-6 text-church-600">
                    <History size={32} className="mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">{c('en_historyTitle', t.about.historyTitle)}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{c('en_historyText', t.about.historyText)}</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-6 text-church-600">
                    <Target size={32} className="mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">{c('en_missionTitle', t.about.missionTitle)}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{c('en_missionText', t.about.missionText)}</p>
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center"><ShieldCheck size={20} className="mr-2 text-church-500"/> {c('en_faithTitle', t.about.faithTitle)}</h3>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{c('en_faithText', t.about.faithText)}</p>
                </div>
            </div>
        </div>

        {/* Stats */}
        <StatsCounter 
            families={content.stats_families || 440}
            members={content.stats_members || 2094}
            sundaySchoolStudents={content.stats_sundayschool || 1773}
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

      {/* BIOGRAPHY THEATER MODAL (unchanged) */}
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

// New component for the page content edit modal
interface PageContentEditModalProps {
    content: Partial<AboutPageContent>;
    onClose: () => void;
    onSave: (data: Partial<AboutPageContent>) => void;
    isLoading: boolean;
}

const PageContentEditModal: React.FC<PageContentEditModalProps> = ({ content, onClose, onSave, isLoading }) => {
    const [formData, setFormData] = useState(content);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value === '' ? undefined : parseInt(value, 10) });
    };

    const handleSaveClick = () => {
        onSave(formData);
    };

    const FormField: React.FC<{ label: string, name: keyof AboutPageContent, isTextarea?: boolean }> = ({ label, name, isTextarea = false }) => (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
            {isTextarea ? (
                <textarea name={name} value={(formData as any)[name] || ''} onChange={handleChange} className="w-full border p-2 rounded-lg h-24" />
            ) : (
                <input name={name} value={(formData as any)[name] || ''} onChange={handleChange} className="w-full border p-2 rounded-lg" />
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-slate-800">Edit 'About Us' Page</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid md:grid-cols-1 gap-6">
                        {/* English Column Only */}
                        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                            <h4 className="font-bold text-center text-slate-600">English Content</h4>
                            <FormField label="Title" name="en_title" />
                            <FormField label="Subtitle" name="en_subtitle" />
                            <FormField label="History Title" name="en_historyTitle" />
                            <FormField label="History Text" name="en_historyText" isTextarea />
                            <FormField label="Mission Title" name="en_missionTitle" />
                            <FormField label="Mission Text" name="en_missionText" isTextarea />
                            <FormField label="Faith Title" name="en_faithTitle" />
                            <FormField label="Faith Text" name="en_faithText" isTextarea />
                        </div>
                    </div>
                    {/* Statistics Section */}
                    <div className="p-4 bg-slate-50 rounded-lg border mt-6">
                        <h4 className="font-bold text-center text-slate-600 mb-4 flex items-center justify-center gap-2">
                            <BarChart3 size={18} /> Statistics Counters
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Families</label>
                                <input type="number" name="stats_families" value={formData.stats_families || ''} onChange={handleNumberChange} className="w-full border p-2 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Members</label>
                                <input type="number" name="stats_members" value={formData.stats_members || ''} onChange={handleNumberChange} className="w-full border p-2 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sunday School</label>
                                <input type="number" name="stats_sundayschool" value={formData.stats_sundayschool || ''} onChange={handleNumberChange} className="w-full border p-2 rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t bg-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-700 font-bold hover:bg-white transition rounded-xl border border-slate-300">Cancel</button>
                    <button onClick={handleSaveClick} disabled={isLoading} className="px-8 py-2.5 bg-church-600 text-white rounded-xl flex items-center shadow-lg font-bold hover:bg-church-700 transition">
                        {isLoading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save Content
                    </button>
                </div>
            </div>
        </div>
    );
};


export default About;
