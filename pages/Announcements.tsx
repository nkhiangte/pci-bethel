
import React, { useState, useEffect, useRef } from 'react';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { Announcement } from '../types';
import { Bell, Plus, Edit, Trash, X, Save, Loader, AlertCircle, Image as ImageIcon, Upload, Trash2, ZoomIn } from 'lucide-react';

// Replace this with your actual ImgBB API key from https://api.imgbb.com/
const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49'; 

const Announcements: React.FC = () => {
  const { language, t } = useLanguage();
  const { announcements: staticAnnouncements } = getConstants(language);
  const { isAdmin } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Announcement>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [language]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    if (!db || !db.collection) {
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
      content: '',
      imageUrls: []
    });
    setIsEditing(true);
  };

  const handleEditClick = (item: Announcement) => {
    setEditForm({ 
      ...item, 
      imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : []) 
    });
    setIsEditing(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const newUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          newUrls.push(result.data.url);
        } else {
          console.error("Image upload failed for a file:", result.error?.message);
        }
      }

      setEditForm(prev => ({ 
        ...prev, 
        imageUrls: [...(prev.imageUrls || []), ...newUrls] 
      }));
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error connecting to image server.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImageAt = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      imageUrls: prev.imageUrls?.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!db || !db.collection) {
        alert("Database unavailable.");
        return;
    }

    try {
      const ref = db.collection('announcements');
      const docRef = editForm.id ? ref.doc(editForm.id) : ref.doc();
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
                    className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 transition shadow-sm font-bold"
                >
                    <Plus size={18} className="mr-2" /> Post Announcement
                </button>
            )}
        </div>

        {loading ? (
           <div className="flex justify-center py-12"><Loader className="animate-spin text-church-500" /></div>
        ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-12">
            {announcements.map((item) => {
                const displayImages = item.imageUrls || (item.imageUrl ? [item.imageUrl] : []);
                
                return (
                    <div key={item.id} className="relative pl-8 group">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${
                        item.category === 'Emergency' ? 'bg-red-500' : 'bg-church-500'
                    }`}></div>
                    
                    {isAdmin && (
                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2 z-10 bg-white/50 p-1 rounded-lg backdrop-blur-sm">
                            <button onClick={() => handleEditClick(item)} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"><Edit size={16} /></button>
                            <button onClick={() => setShowDeleteConfirm(item.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash size={16} /></button>
                        </div>
                    )}

                    <div className="mb-1 text-sm text-slate-500 font-medium">{item.date}</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">{item.title}</h2>
                    <div className="flex items-center mb-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                            item.category === 'Emergency' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {item.category}
                        </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition">
                        <div className="p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {item.content}
                        </div>
                        {displayImages.length > 0 && (
                            <div className={`grid gap-2 p-4 pt-0 ${displayImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {displayImages.map((url, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setPreviewImage(url)}
                                        className={`relative overflow-hidden bg-slate-200 rounded-lg cursor-zoom-in group/img ${displayImages.length === 1 ? 'h-72' : 'h-48'}`}
                                    >
                                        <img src={url} alt={`${item.title} ${idx + 1}`} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                            <ZoomIn className="text-white drop-shadow-md" size={32} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    </div>
                );
            })}
            </div>
        )}
      </div>

      {/* Lightbox for Full Size Preview */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setPreviewImage(null)}
        >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20">
                <X size={32} />
            </button>
            <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
                <img 
                    src={previewImage} 
                    alt="Full size preview" 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-50">
                    <h3 className="text-xl font-bold text-church-900">
                        {editForm.id ? 'Edit Announcement' : 'New Announcement'}
                    </h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                        <input 
                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-church-500 transition" 
                            value={editForm.title || ''} 
                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                            placeholder="Announcement Heading"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                            <input 
                                type="date"
                                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-church-500 transition" 
                                value={editForm.date || ''} 
                                onChange={e => setEditForm({...editForm, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                            <select 
                                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-church-500 transition" 
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
                    
                    {/* Multiple Image Upload Section */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Pictures (Multiple allowed)</label>
                        
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            {editForm.imageUrls?.map((url, index) => (
                                <div key={index} className="relative group rounded-lg overflow-hidden h-24 bg-slate-100 border border-slate-200">
                                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <button onClick={() => removeImageAt(index)} className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-church-600 hover:border-church-300 transition bg-slate-50"
                            >
                                {uploadingImage ? (
                                    <Loader className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Upload size={20} className="mb-1" />
                                        <span className="text-[10px] font-bold uppercase">Add Photo</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleImageUpload} 
                            className="hidden" 
                            accept="image/*"
                            multiple
                        />
                        
                        {uploadingImage && (
                            <p className="text-[10px] text-church-600 font-bold uppercase tracking-widest animate-pulse">Uploading to ImgBB...</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Content</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-2.5 h-32 outline-none focus:ring-2 focus:ring-church-500 transition" 
                            value={editForm.content || ''} 
                            onChange={e => setEditForm({...editForm, content: e.target.value})}
                            placeholder="Detailed announcement text..."
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white font-medium transition">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold transition shadow-sm">Save Post</button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
         <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 max-sm w-full shadow-2xl">
                <div className="flex items-center text-red-600 mb-4">
                    <AlertCircle className="mr-2" size={24} />
                    <h3 className="text-lg font-bold">Delete Announcement?</h3>
                </div>
                <p className="text-slate-600 mb-6">This action will permanently remove this post and cannot be undone.</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition">Confirm Delete</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Announcements;
