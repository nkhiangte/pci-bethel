
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';
import { Staff } from '../types';
import { db } from '../services/firebase';
import { Loader, History, Target, ShieldCheck, Plus, Edit, Trash, BookOpen, Quote, Calendar, X, Users, ChevronRight, Phone, MessageCircle, Save, BarChart3 } from 'lucide-react';
import StatsCounter from '../components/StatsCounter';
import { useAuth } from '../contexts/AuthContext';
import StaffEditModal from '../components/StaffEditModal';

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
                <p className="text-slate-600 leading-relaxed">{c('en_historyText', t.about.historyText)}</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-6 text-church-600">
                    <Target size={32} className="mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">{c('en_missionTitle', t.about.missionTitle)}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">{c('en_missionText', t.about.missionText)}</p>
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center"><ShieldCheck size={20} className="mr-2 text-church-500"/> {c('en_faithTitle', t.about.faithTitle)}</h3>
                    <p className="text-slate-600 text-sm">{c('en_faithText', t.about.faithText)}</p>
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
            {/* ... rest of the leaders rendering logic ... */}
        </div>

      </div>

      {/* Page Content Edit Modal */}
      {isPageEditModalOpen && (
        <PageContentEditModal
          content={content}
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
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* English Column */}
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
                        {/* Mizo Column */}
                        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                            <h4 className="font-bold text-center text-slate-600">Mizo Content</h4>
                            <FormField label="Title" name="mizo_title" />
                            <FormField label="Subtitle" name="mizo_subtitle" />
                            <FormField label="History Title" name="mizo_historyTitle" />
                            <FormField label="History Text" name="mizo_historyText" isTextarea />
                            <FormField label="Mission Title" name="mizo_missionTitle" />
                            <FormField label="Mission Text" name="mizo_missionText" isTextarea />
                            <FormField label="Faith Title" name="mizo_faithTitle" />
                            <FormField label="Faith Text" name="mizo_faithText" isTextarea />
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
