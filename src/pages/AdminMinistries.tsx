
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { Ministry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Edit, Save, X, Database, Users } from 'lucide-react';
import { getConstants } from '../constants';

const AdminMinistries: React.FC = () => {
    const { isAdmin } = useAuth();
    const [ministries, setMinistries] = useState<Ministry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMinistry, setEditingMinistry] = useState<Partial<Ministry> | null>(null);

    const initialMinistriesData = getConstants('en').ministries; // Using 'en' as the source of truth for seeding.

    const fetchMinistries = useCallback(async () => {
        setLoading(true);
        if (!db || !db.collection) {
            // Fallback mode
            setMinistries(initialMinistriesData);
            setLoading(false);
            return;
        }

        try {
            const snapshot = await db.collection('ministries').get();
            if (!snapshot.empty) {
                const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ministry[];
                setMinistries(fetchedData);
            } else {
                setMinistries([]); // Show empty if DB is empty, user can seed it.
            }
        } catch (error) {
            console.error("Error fetching ministries:", error);
            setMinistries(initialMinistriesData);
        }
        setLoading(false);
    }, [initialMinistriesData]);

    useEffect(() => {
        fetchMinistries();
    }, [fetchMinistries]);

    const handleSeedData = async () => {
        if (!db || !db.collection || !window.confirm("This will overwrite existing ministries data in Firebase. Are you sure?")) {
            return;
        }
        setIsSeeding(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('ministries');
            
            initialMinistriesData.forEach(ministryData => {
                const docRef = collectionRef.doc(ministryData.id); // Use the existing ID ('ktp', 'kpvm')
                batch.set(docRef, ministryData);
            });
            
            await batch.commit();
            alert("Ministries data seeded successfully!");
            fetchMinistries();
        } catch (error) {
            console.error("Error seeding data:", error);
            alert("An error occurred during seeding.");
        }
        setIsSeeding(false);
    };
    
    const handleOpenModal = (ministry: Partial<Ministry>) => {
        setEditingMinistry(ministry);
        setIsModalOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!db || !db.collection || !editingMinistry || !editingMinistry.id) return;
        setLoading(true);
        try {
          const { id, ...dataToSave } = editingMinistry;
          await db.collection('ministries').doc(id).set(dataToSave, { merge: true });
          setIsModalOpen(false);
          fetchMinistries();
        } catch (error) {
          console.error("Error saving ministry:", error);
          alert("Failed to save ministry details.");
        }
        // Always turn off loading, even on error
        const updatedMinistries = ministries.map(m => m.id === editingMinistry.id ? editingMinistry as Ministry : m);
        setMinistries(updatedMinistries);
        setIsModalOpen(false);
        setLoading(false);
      };


    if (!isAdmin) {
        return <div className="p-8 text-center">Access Denied.</div>
    }

    return (
        <div className="py-12 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">Manage Ministries</h1>
                    <p className="max-w-2xl mx-auto text-slate-600">Update details for church fellowships like KTP, Kohhran Hmeichhia, and Pavalai Pawl.</p>
                </div>

                <div className="text-center mb-8">
                    <button 
                        onClick={handleSeedData} 
                        disabled={isSeeding}
                        className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                    >
                        {isSeeding ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Database size={18} className="mr-2" />}
                        Seed/Reset Ministries Data
                    </button>
                </div>

                {loading ? (
                     <div className="text-center py-20"><Loader className="animate-spin h-10 w-10 mx-auto text-church-500" /></div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {ministries.map(ministry => (
                            <div key={ministry.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative group">
                                <div className="h-40 bg-slate-200 overflow-hidden">
                                    <img src={ministry.image} alt={ministry.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-slate-800">{ministry.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{ministry.description}</p>
                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
                                        <p><span className="font-bold w-20 inline-block text-slate-500">Leader:</span> {ministry.leader}</p>
                                        <p><span className="font-bold w-20 inline-block text-slate-500">Schedule:</span> {ministry.schedule}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleOpenModal(ministry)} className="absolute top-4 right-4 flex items-center gap-2 text-xs font-bold text-white bg-church-600 hover:bg-church-700 px-3 py-2 rounded-full transition shadow-md opacity-0 group-hover:opacity-100">
                                    <Edit size={14} /> Edit
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && editingMinistry && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">Edit {editingMinistry.name}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X/></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div><label className="block text-sm font-bold mb-1">Name</label><input className="w-full border p-2 rounded" value={editingMinistry.name || ''} onChange={e => setEditingMinistry({...editingMinistry, name: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold mb-1">Acronym</label><input className="w-full border p-2 rounded" value={editingMinistry.acronym || ''} onChange={e => setEditingMinistry({...editingMinistry, acronym: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold mb-1">Description</label><textarea className="w-full border p-2 rounded h-24" value={editingMinistry.description || ''} onChange={e => setEditingMinistry({...editingMinistry, description: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold mb-1">Leader</label><input className="w-full border p-2 rounded" value={editingMinistry.leader || ''} onChange={e => setEditingMinistry({...editingMinistry, leader: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold mb-1">Weekly Schedule</label><input className="w-full border p-2 rounded" value={editingMinistry.schedule || ''} onChange={e => setEditingMinistry({...editingMinistry, schedule: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold mb-1">Image URL</label><input className="w-full border p-2 rounded" value={editingMinistry.image || ''} onChange={e => setEditingMinistry({...editingMinistry, image: e.target.value})} /></div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end space-x-2 mt-auto">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={handleSaveChanges} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">
                                {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMinistries;
