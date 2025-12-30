
import React, { useState, useEffect } from 'react';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { Announcement } from '../types';
import { Bell, Plus, Edit, Trash, X, Save, Loader, AlertCircle } from 'lucide-react';

const Announcements: React.FC = () => {
  const { language, t } = useLanguage();
  const { announcements: staticAnnouncements } = getConstants(language);
  const { isAdmin } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Announcement>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [language]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    if (!db || !db.collection) {
      // Fallback to static data
      setAnnouncements(staticAnnouncements);
      setLoading(false);
      return;
    }

    try {
      const snapshot = await db.collection('announcements').get();
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Announcement[];
        // Sort by date descending
        fetchedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAnnouncements(fetchedData);
      } else {
        setAnnouncements(staticAnnouncements);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncements(staticAnnouncements);
    }
    setLoading(false);
  };

  const handleAddNew = () => {
    setEditForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      category: 'General',
      content: ''
    });
    setIsEditing(true);
  };

  const handleEditClick = (item: Announcement) => {
    setEditForm({ ...item });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!db || !db.collection) {
        alert("Database unavailable in this mode.");
        return;
    }

    try {
      const ref = db.collection('announcements');
      let docRef;

      if (editForm.id) {
        docRef = ref.doc(editForm.id);
      } else {
        docRef = ref.doc();
      }

      // Remove undefined id from data object
      const dataToSave = { ...editForm };
      delete dataToSave.id;

      await docRef.set(dataToSave, { merge: true });
      setIsEditing(false);
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save announcement.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !db.collection) return;
    try {
      await db.collection('announcements').doc(id).delete();
      setShowDeleteConfirm(null);
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  return (
    <div className="py-12 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-church-900">{t.announcements.title}</h1>
            {isAdmin && (
                <button 
                    onClick={handleAddNew}
                    className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 transition shadow-sm"
                >
                    <Plus size={18} className="mr-2" /> Post Announcement
                </button>
            )}
        </div>

        {loading ? (
           <div className="flex justify-center py-12"><Loader className="animate-spin text-church-500" /></div>
        ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-12">
            {announcements.map((item) => (
                <div key={item.id} className="relative pl-8 group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${
                    item.category === 'Emergency' ? 'bg-red-500' : 'bg-church-500'
                }`}></div>
                
                {/* Admin Controls */}
                {isAdmin && (
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        <button onClick={() => handleEditClick(item)} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"><Edit size={16} /></button>
                        <button onClick={() => setShowDeleteConfirm(item.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash size={16} /></button>
                    </div>
                )}

                <div className="mb-1 text-sm text-slate-500 font-medium">{item.date}</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h2>
                <div className="flex items-center mb-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        item.category === 'Emergency' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {item.category}
                    </span>
                </div>
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                </div>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-church-900">
                        {editForm.id ? 'Edit Announcement' : 'New Announcement'}
                    </h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                        <input 
                            className="w-full border border-slate-300 rounded p-2.5" 
                            value={editForm.title || ''} 
                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                            <input 
                                type="date"
                                className="w-full border border-slate-300 rounded p-2.5" 
                                value={editForm.date || ''} 
                                onChange={e => setEditForm({...editForm, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                            <select 
                                className="w-full border border-slate-300 rounded p-2.5" 
                                value={editForm.category} 
                                onChange={e => setEditForm({...editForm, category: e.target.value as any})}
                            >
                                <option value="General">General</option>
                                <option value="Youth">Youth</option>
                                <option value="Funeral">Funeral</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Content</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded p-2.5 h-32" 
                            value={editForm.content || ''} 
                            onChange={e => setEditForm({...editForm, content: e.target.value})}
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-xl">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-300 rounded hover:bg-white">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-church-600 text-white rounded hover:bg-church-700">Save</button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold text-red-600 mb-2">Delete Announcement?</h3>
                <p className="text-slate-600 mb-6">This action cannot be undone.</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                    <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Announcements;
