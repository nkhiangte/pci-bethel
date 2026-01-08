import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';
import { Staff } from '../types';
import { db } from '../services/firebase';
import { Loader, History, Target, ShieldCheck, Plus, Edit, Trash } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff>>({});
  const [targetCollection, setTargetCollection] = useState<'pastors' | 'elders' | 'proPastors'>('pastors');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchAllLeaders = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
      // Fallback: use static data
      setPastors(staticPastors);
      setProPastors(staticProPastors);
      setElders(staticElders);
      setLoading(false);
      return;
    }

    try {
      // Fetch Pastors
      const pSnapshot = await db.collection('pastors').orderBy('order', 'asc').orderBy('name', 'asc').get();
      const pData = pSnapshot.empty ? staticPastors : pSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setPastors(pData);

      // Fetch Pro Pastors
      const ppSnapshot = await db.collection('proPastors').orderBy('order', 'asc').orderBy('name', 'asc').get();
      const ppData = ppSnapshot.empty ? staticProPastors : ppSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setProPastors(ppData);

      // Fetch Elders
      const eSnapshot = await db.collection('elders').orderBy('order', 'asc').orderBy('name', 'asc').get();
      const eData = eSnapshot.empty ? staticElders : eSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setElders(eData);

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
      setEditingStaff({ name: '', role: collection === 'elders' ? 'Upa' : 'Pastor', imageUrl: '', description: '' });
      setTargetCollection(collection);
      setIsModalOpen(true);
  };

  const handleEdit = (staff: Staff, collection: 'pastors' | 'elders' | 'proPastors') => {
      setEditingStaff(staff);
      setTargetCollection(collection);
      setIsModalOpen(true);
  };

  const handleSave = async (staff: Staff, collectionName: 'pastors' | 'elders' | 'proPastors') => {
      setIsSaving(true);
      try {
          if (staff.id) {
              await db.collection(collectionName).doc(staff.id).set(staff, { merge: true });
          } else {
              // Add new, set order to last
              const currentList = collectionName === 'pastors' ? pastors : collectionName === 'elders' ? elders : proPastors;
              const maxOrder = currentList.length > 0 ? Math.max(...currentList.map(s => s.order || 0)) : 0;
              await db.collection(collectionName).add({ ...staff, order: maxOrder + 1 });
          }
          setIsModalOpen(false);
          fetchAllLeaders();
      } catch (error) {
          console.error(`Error saving ${collectionName}:`, error);
          alert(`Failed to save. Please try again.`);
      }
      setIsSaving(false);
  };

  const handleDelete = async (id: string, collectionName: 'pastors' | 'elders' | 'proPastors') => {
      setIsSaving(true);
      try {
          await db.collection(collectionName).doc(id).delete();
          setShowDeleteConfirm(null);
          setIsModalOpen(false); // Close modal if open
          fetchAllLeaders();
      } catch (error) {
          console.error(`Error deleting from ${collectionName}:`, error);
          alert("Failed to delete.");
      }
      setIsSaving(false);
  };

  // Combine Pastors and Pro-Pastors for the display section (if desired to keep them together visually)
  // or display them in sequence. Let's display them in sequence but grouped visually as "Shepherds"
  const allPastoralLeaders = [...pastors.map(p => ({...p, collection: 'pastors' as const})), ...proPastors.map(p => ({...p, collection: 'proPastors' as const}))];

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
                <p className="text-slate-600 leading-relaxed">
                    {t.about.historyText}
                </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-6 text-church-600">
                    <Target size={32} className="mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">{t.about.missionTitle}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">
                    {t.about.missionText}
                </p>
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center"><ShieldCheck size={20} className="mr-2 text-church-500"/> {t.about.faithTitle}</h3>
                    <p className="text-slate-600 text-sm">{t.about.faithText}</p>
                </div>
            </div>
        </div>

        {/* Stats */}
        <StatsCounter />

        {/* Leaders Section (Pastors & Pro Pastors) */}
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
                        <div key={leader.id} className="bg-white rounded-xl shadow-lg overflow-hidden group hover:-translate-y-2 transition duration-300 relative">
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
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <p className="text-church-300 font-bold text-sm tracking-wider uppercase mb-1">{leader.role}</p>
                                    <h3 className="text-2xl font-bold">{leader.name}</h3>
                                    {leader.period && <p className="text-xs text-slate-300 mt-1">{leader.period}</p>}
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-600 italic">"{leader.description}"</p>
                            </div>
                            {isAdmin && (
                                <button 
                                    onClick={() => handleEdit(leader, leader.collection)}
                                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md text-church-600 hover:text-church-800 opacity-0 group-hover:opacity-100 transition-opacity"
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
                        <div key={elder.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition relative group">
                            <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 bg-slate-200">
                                <img src={elder.imageUrl} alt={elder.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">{elder.name}</h3>
                                <p className="text-sm text-church-600">{elder.role} {elder.period ? `(${elder.period})` : ''}</p>
                            </div>
                            {isAdmin && (
                                <button 
                                    onClick={() => handleEdit(elder, 'elders')} 
                                    className="absolute top-2 right-2 text-slate-400 hover:text-church-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Edit size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>

      {/* Edit Modal */}
      {isModalOpen && (
          <StaffEditModal
            staff={editingStaff}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            onDelete={handleDelete}
            isLoading={isSaving}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            collectionName={targetCollection}
          />
      )}
    </div>
  );
};

export default About;
