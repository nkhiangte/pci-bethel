
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import 'react-quill-new/dist/quill.snow.css';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { Announcement } from '../types';
import { Bell, Plus, Edit, Trash, X, Save, Loader, AlertCircle, Image as ImageIcon, Upload, Trash2, ZoomIn, Type, Play, Youtube, PlusCircle } from 'lucide-react';

const ReactQuill = lazy(() => import('react-quill-new'));

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'blockquote', 'code-block'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  }
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'blockquote', 'code-block'
];

const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49'; 

const getYouTubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const Announcements: React.FC = () => {
  const { language, t } = useLanguage();
  const { announcements: staticAnnouncements } = getConstants(language);
  const { isAdmin } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<string[]>(['General', 'Sunna']);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Announcement>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAnnouncements();
    fetchCategories();
  }, [language]);

  const fetchCategories = async () => {
    try {
      const committeeSnap = await db.collection('committees').get();
      const committeeNames = committeeSnap.docs.map(doc => doc.data().name);
      
      // Static fellowships as they are defined in Navbar
      const fellowshipNames = ['Kohhran Hmeichhia', 'Kristian Ṭhalai Pawl (KTP)', 'Kohhran Pavalai Pawl (KPP)'];

      const allCats = ['General', 'Sunna', ...committeeNames, ...fellowshipNames];
      // Remove duplicates
      const uniqueCats = Array.from(new Set(allCats));
      
      // Sort: General first, Sunna second, then alphabetical
      const sortedCats = uniqueCats.sort((a, b) => {
        if (a === 'General') return -1;
        if (b === 'General') return 1;
        if (a === 'Sunna') return -1;
        if (b === 'Sunna') return 1;
        return a.localeCompare(b);
      });
      setCategories(sortedCats);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

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
      category: categories[0] || 'General',
      content: '',
      imageUrls: [],
      imageCaptions: [],
      videoUrls: []
    });
    setIsEditing(true);
  };

  const handleEditClick = (item: Announcement) => {
    setEditForm({ 
      ...item, 
      imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : []),
      imageCaptions: item.imageCaptions || [],
      videoUrls: item.videoUrls || (item.videoUrl ? [item.videoUrl] : [])
    });
    setIsEditing(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const newUrls: string[] = [];
      const newCaps: string[] = [];
      
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
          newCaps.push(''); // Initial empty caption
        } else {
          console.error("Image upload failed for a file:", result.error?.message);
        }
      }

      setEditForm(prev => ({ 
        ...prev, 
        imageUrls: [...(prev.imageUrls || []), ...newUrls],
        imageCaptions: [...(prev.imageCaptions || []), ...newCaps]
      }));
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error connecting to image server.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateCaption = (index: number, text: string) => {
    const newCaptions = [...(editForm.imageCaptions || [])];
    while (newCaptions.length <= index) newCaptions.push('');
    newCaptions[index] = text;
    setEditForm({ ...editForm, imageCaptions: newCaptions });
  };

  const removeImageAt = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      imageUrls: prev.imageUrls?.filter((_, i) => i !== index),
      imageCaptions: prev.imageCaptions?.filter((_, i) => i !== index)
    }));
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    
    // Basic URL validation
    try {
      new URL(newImageUrl);
    } catch (e) {
      alert("Please enter a valid URL");
      return;
    }

    setEditForm(prev => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), newImageUrl.trim()],
      imageCaptions: [...(prev.imageCaptions || []), '']
    }));
    setNewImageUrl('');
  };

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    const vidId = getYouTubeId(newVideoUrl);
    if (!vidId) {
        alert(t.announcements.validation.video);
        return;
    }
    setEditForm(prev => ({
        ...prev,
        videoUrls: [...(prev.videoUrls || []), newVideoUrl.trim()]
    }));
    setNewVideoUrl('');
  };

  const removeVideoAt = (index: number) => {
      setEditForm(prev => ({
          ...prev,
          videoUrls: prev.videoUrls?.filter((_, i) => i !== index)
      }));
  };

  const handleSave = async () => {
    if (!db || !db.collection) {
        alert(t.announcements.validation.db);
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
      alert(t.announcements.validation.saveFail);
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
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-church-900">{t.announcements.title}</h1>
            {isAdmin && (
                <button 
                    onClick={handleAddNew}
                    className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 transition shadow-sm font-bold"
                >
                    <Plus size={18} className="mr-2" /> {t.announcements.postAnnouncement}
                </button>
            )}
        </div>

        {loading ? (
           <div className="flex justify-center py-12"><Loader className="animate-spin text-church-500" /></div>
        ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-12">
            {announcements.map((item) => {
                const displayImages = item.imageUrls || (item.imageUrl ? [item.imageUrl] : []);
                const displayCaptions = item.imageCaptions || [];
                const displayVideos = item.videoUrls || (item.videoUrl ? [item.videoUrl] : []);
                
                return (
                    <div key={item.id} className="relative pl-8 group">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${
                        item.category === 'Sunna' ? 'bg-slate-800' : 'bg-church-500'
                    }`}></div>
                    
                    {isAdmin && (
                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2 z-10 bg-white/50 p-1 rounded-lg backdrop-blur-sm">
                            <button onClick={() => handleEditClick(item)} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"><Edit size={16} /></button>
                            <button onClick={() => setShowDeleteConfirm(item.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash size={16} /></button>
                        </div>
                    )}

                    <div className="mb-1 text-sm text-slate-500 font-medium">{item.date}</div>
                    <Link to={`/announcements/${item.id}`} className="hover:text-church-600 transition-colors">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">{item.title}</h2>
                    </Link>
                    <div className="flex items-center mb-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                            item.category === 'Sunna' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {item.category === 'General' ? t.announcements.categories.general :
                         item.category === 'Sunna' ? t.announcements.categories.sunna :
                         item.category}
                        </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition">
                        <div 
                            className="p-6 text-slate-700 leading-relaxed prose prose-slate max-w-none"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                        />

                        {/* Multiple Videos Display */}
                        {displayVideos.length > 0 && (
                            <div className={`grid gap-3 px-4 pb-4 grid-cols-1 ${displayVideos.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                                {displayVideos.map((url, vIdx) => {
                                    const vidId = getYouTubeId(url);
                                    if (!vidId) return null;
                                    return (
                                        <div 
                                            key={vIdx}
                                            className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 cursor-pointer group/vid shadow-sm"
                                            onClick={() => setPlayingVideoId(vidId)}
                                        >
                                            <img 
                                                src={`https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`} 
                                                alt="Video Preview" 
                                                className="w-full h-full object-cover opacity-80 group-hover/vid:scale-105 transition-transform duration-700"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${vidId}/0.jpg`;
                                                }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/vid:bg-black/40 transition-colors">
                                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-2xl group-hover/vid:scale-110 transition-transform">
                                                    <Play className="text-church-600 fill-current ml-0.5" size={24} />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white font-bold uppercase tracking-wider">
                                                <Youtube size={12} className="text-red-500" /> {t.announcements.watch}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Image Grid Display */}
                        {displayImages.length > 0 && (
                            <div className={`grid gap-3 p-4 pt-0 grid-cols-1 ${displayImages.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                                {displayImages.map((url, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <div 
                                            onClick={() => setPreviewImage(url)}
                                            className={`relative overflow-hidden bg-slate-200 rounded-t-lg cursor-zoom-in group/img ${displayImages.length === 1 ? 'h-72' : 'h-48'} ${!displayCaptions[idx] ? 'rounded-b-lg' : ''}`}
                                        >
                                            <img src={url} alt={`${item.title} ${idx + 1}`} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <ZoomIn className="text-white drop-shadow-md" size={32} />
                                            </div>
                                        </div>
                                        {displayCaptions[idx] && (
                                            <div className="bg-white/80 border-x border-b border-slate-200 p-2.5 rounded-b-lg backdrop-blur-sm">
                                                <p className="text-[11px] font-medium text-slate-600 italic leading-snug">
                                                    {displayCaptions[idx]}
                                                </p>
                                            </div>
                                        )}
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

      {/* Video Modal */}
      {playingVideoId && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={() => setPlayingVideoId(null)}
        >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-3 bg-white/10 rounded-full hover:bg-white/20">
                <X size={28} />
            </button>
            <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-black">
                <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`} 
                    title="YouTube Video" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                ></iframe>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-50">
                    <h3 className="text-xl font-bold text-church-900">
                        {editForm.id ? t.announcements.editAnnouncement : t.announcements.newAnnouncement}
                    </h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t.announcements.form.title}</label>
                        <input 
                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-church-500 transition" 
                            value={editForm.title || ''} 
                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                            placeholder={t.announcements.form.placeholders.title}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.announcements.form.date}</label>
                            <input 
                                type="date"
                                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-church-500 transition" 
                                value={editForm.date || ''} 
                                onChange={e => setEditForm({...editForm, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.announcements.form.category}</label>
                            <select 
                                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-church-500 transition" 
                                value={editForm.category} 
                                onChange={e => setEditForm({...editForm, category: e.target.value as any})}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === 'General' ? t.announcements.categories.general :
                                         cat === 'Sunna' ? t.announcements.categories.sunna :
                                         cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Multiple Video Support Section */}
                    <div className="space-y-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
                        <label className="block text-sm font-bold text-red-900 flex items-center gap-2">
                           <Youtube size={18} className="text-red-500" /> {t.announcements.form.videos}
                        </label>
                        
                        <div className="space-y-2">
                            {editForm.videoUrls?.map((url, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-red-100 shadow-sm">
                                    <div className="w-10 h-7 shrink-0 bg-slate-900 rounded overflow-hidden">
                                        <img src={`https://img.youtube.com/vi/${getYouTubeId(url)}/0.jpg`} className="w-full h-full object-cover" alt="Thumb" />
                                    </div>
                                    <span className="flex-1 text-[11px] font-mono text-slate-500 truncate">{url}</span>
                                    <button onClick={() => removeVideoAt(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input 
                                className="flex-1 border border-red-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-red-400" 
                                value={newVideoUrl} 
                                onChange={e => setNewVideoUrl(e.target.value)}
                                placeholder={t.announcements.form.placeholders.video}
                                onKeyPress={e => e.key === 'Enter' && handleAddVideo()}
                            />
                            <button 
                                onClick={handleAddVideo}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-bold transition shadow-sm flex items-center gap-2"
                            >
                                <PlusCircle size={16} /> {t.announcements.form.addLink}
                            </button>
                        </div>
                    </div>
                    
                    {/* Multiple Image Upload Section with Captions */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700">{t.announcements.form.pictures}</label>
                        
                        <div className="grid grid-cols-1 gap-4 mb-3">
                            {editForm.imageUrls?.map((url, index) => (
                                <div key={index} className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white">
                                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        <button 
                                            onClick={() => removeImageAt(index)} 
                                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Type size={12} /> {t.announcements.form.placeholders.caption} {index + 1}
                                        </div>
                                        <textarea 
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-church-400 outline-none resize-none h-14"
                                            placeholder={t.announcements.form.placeholders.caption}
                                            value={editForm.imageCaptions?.[index] || ''}
                                            onChange={(e) => updateCaption(index, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                            
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-church-500" 
                                        value={newImageUrl} 
                                        onChange={e => setNewImageUrl(e.target.value)}
                                        placeholder={t.announcements.form.placeholders.imageUrl}
                                        onKeyPress={e => e.key === 'Enter' && handleAddImageUrl()}
                                    />
                                    <button 
                                        onClick={handleAddImageUrl}
                                        className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 text-xs font-bold transition shadow-sm flex items-center gap-2"
                                    >
                                        <PlusCircle size={16} /> {t.announcements.form.addUrl}
                                    </button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">or</span></div>
                                </div>

                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                    className="h-16 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-church-600 hover:border-church-300 transition bg-slate-50"
                                >
                                    {uploadingImage ? (
                                        <Loader className="animate-spin" size={24} />
                                    ) : (
                                        <>
                                            <Upload size={20} className="mb-1" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t.announcements.form.addPhotos}</span>
                                        </>
                                    )}
                                </button>
                            </div>
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
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t.announcements.form.content}</label>
                        <div className="bg-white rounded-lg overflow-hidden border border-slate-300 min-h-[200px]">
                            <Suspense fallback={<div className="p-4 text-slate-400 flex items-center gap-2"><Loader className="animate-spin" size={16} /> Loading editor...</div>}>
                                <ReactQuill 
                                    theme="snow" 
                                    value={editForm.content || ''} 
                                    onChange={(content) => setEditForm(prev => ({ ...prev, content }))}
                                    placeholder={t.announcements.form.placeholders.content}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    className="h-48"
                                />
                            </Suspense>
                        </div>
                        <div className="h-12"></div> {/* Spacer for Quill toolbar/overflow */}
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white font-medium transition">{t.announcements.cancel}</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold transition shadow-sm">{t.announcements.savePost}</button>
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
                    <h3 className="text-lg font-bold">{t.announcements.deleteTitle}</h3>
                </div>
                <p className="text-slate-600 mb-6">{t.announcements.deleteSub}</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">{t.announcements.cancel}</button>
                    <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition">{t.announcements.deleteConfirm}</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Announcements;
