import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { ArchiveEntry } from '../types';
import { 
  Archive, FileText, Image as ImageIcon, Video, History, 
  FileClock, Users, User, Search, Plus, Edit, Trash, X, 
  ExternalLink, Play, Loader, Save
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Document': FileText,
  'Photo': ImageIcon,
  'Video': Video,
  'History': History,
  'Minute': FileClock,
  'Rawngbawltu te': Users,
  'Pastors': User,
  'Upa kal ta te': User
};

const getYouTubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const Archives: React.FC = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArchive, setEditingArchive] = useState<Partial<ArchiveEntry>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchArchives = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
      setArchives([]);
      setLoading(false);
      return;
    }

    try {
      const snapshot = await db.collection('archives').orderBy('date', 'desc').get();
      if (!snapshot.empty) {
        const data = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as ArchiveEntry[];
        setArchives(data);
      } else {
        setArchives([]);
      }
    } catch (error) {
      console.error("Error fetching archives:", error);
      setArchives([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const handleAddNew = () => {
    setEditingArchive({
      title: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Document',
      description: '',
      link: ''
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = (entry: ArchiveEntry) => {
    setEditingArchive({ ...entry });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!db?.doc || !window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await db.collection('archives').doc(id).delete();
      fetchArchives();
    } catch (error) {
      console.error("Error deleting archive:", error);
    }
  };

  const handleSave = async () => {
    if (!db?.collection) return;
    setIsSaving(true);
    try {
      const { id, ...data } = editingArchive;
      if (id) {
        await db.collection('archives').doc(id).set(data, { merge: true });
      } else {
        await db.collection('archives').add(data);
      }
      setIsEditModalOpen(false);
      fetchArchives();
    } catch (error) {
      console.error("Error saving archive:", error);
      alert("Failed to save.");
    }
    setIsSaving(false);
  };

  const filteredArchives = archives.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Document', 'Photo', 'Video', 'History', 'Minute', 'Rawngbawltu te', 'Pastors', 'Upa kal ta te'];

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">{t.archives.title}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">{t.archives.subtitle}</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search archives..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-church-500 outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
             {categories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors ${selectedCategory === cat ? 'bg-church-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
               >
                 {cat}
               </button>
             ))}
          </div>

          {isAdmin && (
            <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm transition font-bold shrink-0">
              <Plus size={18} className="mr-2" /> Add Entry
            </button>
          )}
        </div>

        {/* Content Grid */}
        {loading ? (
            <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
        ) : filteredArchives.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArchives.map(entry => {
                    const Icon = CATEGORY_ICONS[entry.category] || Archive;
                    const isOfficeBearer = entry.category === 'Rawngbawltu te';
                    const showFullDescription = isOfficeBearer || ['Pastors', 'Upa kal ta te'].includes(entry.category);
                    const youtubeId = entry.category === 'Video' ? getYouTubeId(entry.link) : null;

                    return (
                        <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition group relative flex flex-col h-full">
                            {isAdmin && (
                                <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={() => handleEdit(entry)} className="p-1.5 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-600 bg-red-50 rounded-full hover:bg-red-100"><Trash size={16} /></button>
                                </div>
                            )}
                            
                            {youtubeId ? (
                                <div className="flex flex-col h-full">
                                    <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden mb-4 cursor-pointer group/video shadow-sm" onClick={() => setPlayingVideoId(youtubeId)}>
                                        <img src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} alt={entry.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/video:bg-black/30 transition">
                                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover/video:scale-110 transition"><Play size={20} className="text-church-600 ml-1 fill-current" /></div>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2">{entry.title}</h3>
                                    <p className="text-xs text-slate-500 mb-3">{entry.date}</p>
                                    <div className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">{entry.description}</div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start mb-4">
                                        <div className="p-3 bg-church-50 text-church-600 rounded-lg mr-4 shrink-0"><Icon size={24} /></div>
                                        <div>
                                            {!isOfficeBearer && (<div className="flex flex-wrap gap-2 mb-1"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{entry.category}</span>{entry.subCategory && (<span className="text-xs font-bold text-church-600 bg-church-100 px-2 py-0.5 rounded-full">{entry.subCategory}</span>)}</div>)}
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{entry.title}</h3>
                                            {!isOfficeBearer && <p className="text-xs text-slate-500 mt-1">{entry.date}</p>}
                                        </div>
                                    </div>
                                    
                                    {(entry.category === 'Upa kal ta te' || entry.category === 'Pastors') && (
                                        <div className="mt-3 mb-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                            {entry.birthDate && <div><span className="font-bold text-slate-700">Pian Ni:</span> {entry.birthDate}</div>}
                                            {entry.ordinationDate && <div><span className="font-bold text-slate-700">Nemngheh Ni:</span> {entry.ordinationDate}</div>}
                                            {entry.category === 'Pastors' && entry.tenureYears && <div><span className="font-bold text-slate-700">Tenure:</span> {entry.tenureYears}</div>}
                                            {entry.deathDate && <div><span className="font-bold text-slate-700">Thih Ni:</span> {entry.deathDate}</div>}
                                        </div>
                                    )}

                                    <div className={`text-slate-600 text-sm mb-4 flex-grow whitespace-pre-wrap ${showFullDescription ? '' : 'line-clamp-3'}`}>{entry.description}</div>
                                    
                                    {entry.imageUrls && entry.imageUrls.length > 0 && (
                                        <div className={`grid gap-2 mb-4 ${entry.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                            {entry.imageUrls.slice(0, 4).map((url, i) => (
                                                <div 
                                                    key={i} 
                                                    className="relative overflow-hidden rounded-lg bg-slate-100 aspect-square cursor-pointer hover:opacity-90"
                                                    onClick={() => setPreviewImage(url)}
                                                >
                                                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                                    {i === 3 && entry.imageUrls!.length > 4 && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">+{entry.imageUrls!.length - 4}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {entry.link && (<a href={entry.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-church-600 hover:text-church-800 mt-auto">View Resource <ExternalLink size={14} className="ml-1" /></a>)}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                <Archive className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-700">No archives found</h3>
                <p className="text-slate-500 mt-1">Try changing category or search terms.</p>
            </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-slate-800">{editingArchive.id ? 'Edit Entry' : 'Add New Entry'}</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                        <input className="w-full border p-2.5 rounded-lg" value={editingArchive.title || ''} onChange={e => setEditingArchive({...editingArchive, title: e.target.value})} placeholder="Title" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                            <select className="w-full border p-2.5 rounded-lg" value={editingArchive.category} onChange={e => setEditingArchive({...editingArchive, category: e.target.value as any})}>
                                {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                            <input type="date" className="w-full border p-2.5 rounded-lg" value={editingArchive.date || ''} onChange={e => setEditingArchive({...editingArchive, date: e.target.value})} />
                        </div>
                    </div>
                    
                    {editingArchive.category === 'Rawngbawltu te' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Sub Category</label>
                            <input className="w-full border p-2.5 rounded-lg" value={editingArchive.subCategory || ''} onChange={e => setEditingArchive({...editingArchive, subCategory: e.target.value})} placeholder="e.g. Executive Body" />
                        </div>
                    )}

                    {(editingArchive.category === 'Pastors' || editingArchive.category === 'Upa kal ta te') && (
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Pian Ni</label><input type="date" className="w-full border p-2 rounded" value={editingArchive.birthDate || ''} onChange={e => setEditingArchive({...editingArchive, birthDate: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Nemngheh Ni</label><input type="date" className="w-full border p-2 rounded" value={editingArchive.ordinationDate || ''} onChange={e => setEditingArchive({...editingArchive, ordinationDate: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Thih Ni</label><input type="date" className="w-full border p-2 rounded" value={editingArchive.deathDate || ''} onChange={e => setEditingArchive({...editingArchive, deathDate: e.target.value})} /></div>
                            {editingArchive.category === 'Pastors' && <div><label className="block text-xs font-bold text-slate-500 mb-1">Tenure</label><input className="w-full border p-2 rounded" value={editingArchive.tenureYears || ''} onChange={e => setEditingArchive({...editingArchive, tenureYears: e.target.value})} placeholder="e.g. 2010 - 2015" /></div>}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Description / Content</label>
                        <textarea className="w-full border p-2.5 rounded-lg h-32" value={editingArchive.description || ''} onChange={e => setEditingArchive({...editingArchive, description: e.target.value})} placeholder="Details..." />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">External Link / Video URL</label>
                        <input className="w-full border p-2.5 rounded-lg" value={editingArchive.link || ''} onChange={e => setEditingArchive({...editingArchive, link: e.target.value})} placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Image URL (Optional)</label>
                        <input className="w-full border p-2.5 rounded-lg" value={editingArchive.imageUrls?.[0] || ''} onChange={e => setEditingArchive({...editingArchive, imageUrls: e.target.value ? [e.target.value] : []})} placeholder="https://..." />
                    </div>
                </div>
                <div className="p-6 bg-slate-50 flex justify-end space-x-3 rounded-b-2xl">
                    <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-church-600 text-white rounded-lg font-bold flex items-center">{isSaving ? <Loader className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16} />} Save</button>
                </div>
            </div>
        </div>
      )}

      {/* Video Modal */}
      {playingVideoId && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setPlayingVideoId(null)}>
            <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
                <button onClick={() => setPlayingVideoId(null)} className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-black/20 p-2 rounded-full"><X size={24}/></button>
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`} title="YouTube video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
            <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full"><X size={32}/></button>
        </div>
      )}
    </div>
  );
};

export default Archives;