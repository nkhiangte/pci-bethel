
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';
import { Staff } from '../types';
import { db } from '../services/firebase';
import { Loader, History, Target, ShieldCheck, Plus, Edit, Trash, BookOpen, Quote, Calendar, X, Users, ChevronRight } from 'lucide-react';
import StatsCounter from '../components/StatsCounter';
import { useAuth } from '../contexts/AuthContext';
import StaffEditModal from '../components/StaffEditModal';

const About: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAdmin } = useAuth();
  const { pastors: staticPastors, elders: staticElders, proPastors: staticProPastors } = getConstants(language);

  // State for Lists
  const [pastors, setPastors] = useState<Staff[]>([]);
  const [proPastors, setProPastors] = useState<Staff[]>([]);
  const [elders, setElders] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Modal & Actions
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff>>({});
  const [targetCollection, setTargetCollection] = useState<'pastors' | 'elders' | 'proPastors'>('pastors');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Biography Modal State
  const [selectedLeader, setSelectedLeader] = useState<Staff | null>(null);

  const fetchAllLeaders = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
      setPastors(staticPastors);
      setProPastors(staticProPastors);
      setElders(staticElders);
      setLoading(false);
      return;
    }

    try {
      const [pSnap, ppSnap, eSnap] = await Promise.all([
        db.collection('pastors').orderBy('order', 'asc').get(),
        db.collection('proPastors').orderBy('order', 'asc').get(),
        db.collection('elders').orderBy('order', 'asc').get()
      ]);

      setPastors(pSnap.empty ? staticPastors : pSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      setProPastors(ppSnap.empty ? staticProPastors : ppSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      setElders(eSnap.empty ? staticElders : eSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching leaders:", error);
      setPastors(staticPastors);
      setProPastors(staticProPastors);
      setElders(staticElders);
    }
    setLoading(false);
  }, [staticPastors, staticProPastors, staticElders]);

  useEffect(() => {
    fetchAllLeaders();
  }, [fetchAllLeaders]);

  const handleAddNew = (collection: 'pastors' | 'elders' | 'proPastors') => {
    setEditingStaff({ name: '', role: collection === 'elders' ? 'Upa' : 'Pastor', imageUrl: '', description: '', biography: '' });
    setTargetCollection(collection);
    setIsEditModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, staff: Staff, collection: 'pastors' | 'elders' | 'proPastors') => {
    e.stopPropagation();
    setEditingStaff(staff);
    setTargetCollection(collection);
    setIsEditModalOpen(true);
  };

  const handleSave = async (staff: Staff, collectionName: 'pastors' | 'elders' | 'proPastors') => {
    setIsSaving(true);
    try {
      if (staff.id) {
        await db.collection(collectionName).doc(staff.id).set(staff, { merge: true });
      } else {
        const currentList = collectionName === 'pastors' ? pastors : collectionName === 'elders' ? elders : proPastors;
        const maxOrder = currentList.length > 0 ? Math.max(...currentList.map(s => s.order || 0)) : 0;
        await db.collection(collectionName).add({ ...staff, order: maxOrder + 1 });
      }
      setIsEditModalOpen(false);
      fetchAllLeaders();
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
      setIsEditModalOpen(false);
      fetchAllLeaders();
      if (selectedLeader?.id === id) setSelectedLeader(null);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete.");
    }
    setIsSaving(false);
  };

  const allPastoralLeaders = [
    ...pastors.map(p => ({ ...p, collection: 'pastors' as const })),
    ...proPastors.map(p => ({ ...p, collection: 'proPastors' as const }))
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <div className="bg-church-900 py-20 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{t.about.title}</h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">{t.about.subtitle}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* History & Mission */}
        <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-6 text-church-600">
                    <History size={32} className="mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">{t.about.historyTitle}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">{t.about.historyText}</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-6 text-church-600">
                    <Target size={32} className="mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">{t.about.missionTitle}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">{t.about.missionText}</p>
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center"><ShieldCheck size={20} className="mr-2 text-church-500"/> {t.about.faithTitle}</h3>
                    <p className="text-slate-600 text-sm">{t.about.faithText}</p>
                </div>
            </div>
        </div>

        {/* Stats */}
        <StatsCounter />

        {/* Leaders Section (Pastors) */}
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

            {loading ? (
                <div className="flex justify-center"><Loader className="animate-spin text-church-500" /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                    {allPastoralLeaders.map((leader) => (
                        <div 
                            key={leader.id} 
                            onClick={() => setSelectedLeader(leader)}
                            className="bg-white rounded-xl shadow-lg overflow-hidden group hover:-translate-y-2 transition duration-300 relative text-left w-full cursor-pointer ring-1 ring-slate-100 hover:ring-church-200"
                        >
                            <div className="h-80 overflow-hidden relative bg-slate-200">
                                <img 
                                    src={leader.imageUrl} 
                                    alt={leader.name} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    style={{
                                        objectPosition: `${leader.imagePositionX ?? 50}% ${leader.imagePositionY ?? 0}%`,
                                        transform: `scale(${leader.imageScale ?? 1})`
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <p className="text-church-300 font-bold text-xs tracking-wider uppercase mb-1">{leader.role}</p>
                                    <h3 className="text-2xl font-serif font-black group-hover:underline group-hover:text-church-100 transition-all">{leader.name}</h3>
                                    {leader.period && <p className="text-xs text-slate-300 mt-1 uppercase tracking-widest font-bold">Ordination: {leader.period}</p>}
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-600 italic line-clamp-2 leading-relaxed">"{leader.description}"</p>
                                <div className="mt-6 flex items-center text-[10px] font-black text-church-600 uppercase tracking-[0.2em] group-hover:text-church-800 transition-colors">
                                    <BookOpen size={14} className="mr-2" /> View Biography <ChevronRight size={12} className="ml-1" />
                                </div>
                            </div>
                            {isAdmin && (
                                <button 
                                    onClick={(e) => handleEditClick(e, leader, leader.collection)}
                                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md text-church-600 hover:text-church-800 opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-slate-100"
                                    title="Edit"
                                >
                                    <Edit size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Elders Grid */}
        <div>
            <div className="text-center mb-12 relative">
                <h2 className="text-3xl font-serif font-bold text-church-900 mb-4">{t.home.kohhranElders}</h2>
                <div className="h-1 w-20 bg-church-500 mx-auto mb-4"></div>
                {isAdmin && (
                    <button onClick={() => handleAddNew('elders')} className="flex items-center mx-auto text-sm font-bold text-white bg-church-600 px-3 py-1 rounded-full shadow-sm hover:bg-church-700">
                        <Plus size={14} className="mr-1"/> Add Elder
                    </button>
                )}
            </div>
            {loading ? (
                <div className="flex justify-center"><Loader className="animate-spin text-church-500" /></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {elders.map((elder) => (
                        <div 
                            key={elder.id} 
                            onClick={() => setSelectedLeader(elder)}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md hover:border-church-200 transition-all relative group cursor-pointer"
                        >
                            <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 bg-slate-200 border-2 border-transparent group-hover:border-church-500 transition-all shadow-sm">
                                <img src={elder.imageUrl} alt={elder.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 group-hover:underline group-hover:text-church-700 transition-colors leading-tight">{elder.name}</h3>
                                <p className="text-[10px] text-church-600 font-bold uppercase tracking-wider mt-1">{elder.role} {elder.period ? `(${elder.period})` : ''}</p>
                                <div className="flex items-center text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Full Bio <ChevronRight size={8} className="ml-0.5" />
                                </div>
                            </div>
                            {isAdmin && (
                                <button 
                                    onClick={(e) => handleEditClick(e, elder, 'elders')} 
                                    className="absolute top-2 right-2 text-slate-300 hover:text-church-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                    <Edit size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>

      {/* Staff Edit Modal */}
      {isEditModalOpen && (
          <StaffEditModal
            staff={editingStaff}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSave}
            onDelete={handleDelete}
            isLoading={isSaving}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            collectionName={targetCollection}
          />
      )}

      {/* BIOGRAPHY THEATER MODAL */}
      {selectedLeader && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header Profile Area */}
                <div className="relative h-64 md:h-80 shrink-0 bg-church-900 text-white flex items-end">
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

                    <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-8 w-full">
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white shrink-0">
                            <img 
                                src={selectedLeader.imageUrl} 
                                alt={selectedLeader.name} 
                                className="w-full h-full object-cover" 
                                style={{ objectPosition: `${selectedLeader.imagePositionX ?? 50}% ${selectedLeader.imagePositionY ?? 0}%` }}
                            />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <span className="inline-block bg-church-600 text-white text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full mb-3 shadow-lg">
                                {selectedLeader.role}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-serif font-black mb-2 leading-tight">
                                {selectedLeader.name}
                            </h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-church-200 opacity-90">
                                {selectedLeader.period && (
                                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest">
                                        <Calendar size={14} /> Ordination: {selectedLeader.period}
                                    </div>
                                )}
                                <div className="hidden md:block w-1 h-1 rounded-full bg-church-400"></div>
                                <div className="font-bold text-white uppercase tracking-widest text-xs">Champhai Bethel Kohhran</div>
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
                                <article className="prose prose-slate prose-lg max-w-none font-serif text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedLeader.biography}
                                </article>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <BookOpen size={40} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 italic">Detailed biography not yet added to Firebase.</p>
                                    {isAdmin && <p className="text-church-600 text-sm mt-2 font-bold underline cursor-pointer" onClick={() => {
                                        setEditingStaff(selectedLeader);
                                        setTargetCollection(
                                            pastors.some(p => p.id === selectedLeader.id) ? 'pastors' : 
                                            elders.some(e => e.id === selectedLeader.id) ? 'elders' : 'proPastors'
                                        );
                                        setIsEditModalOpen(true);
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
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Affiliation</p>
                                        <p className="text-sm font-bold text-slate-800 line-clamp-1">Champhai Bethel Kohhran</p>
                                    </div>
                                </div>
                            </div>

                            {isAdmin && (
                                <button 
                                    onClick={() => {
                                        setEditingStaff(selectedLeader);
                                        setTargetCollection(
                                            pastors.some(p => p.id === selectedLeader.id) ? 'pastors' : 
                                            elders.some(e => e.id === selectedLeader.id) ? 'elders' : 'proPastors'
                                        );
                                        setIsEditModalOpen(true);
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

export default About;
