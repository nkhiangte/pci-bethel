
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ArchiveEntry } from '../types';
import { 
  Search, Archive, Plus, Edit, Trash, X, Save, Loader, FileText, 
  Image as ImageIcon, Video, History, Calendar, LayoutList, Grid, 
  Filter, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

const Archives: React.FC = () => {
  const { isAdmin } = useAuth();
  
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<ArchiveEntry>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    setLoading(true);
    if (!db || !db.collection) {
      setArchives([]); 
      setLoading(false);
      return;
    }
    try {
      const snapshot = await db.collection('archives').orderBy('date', 'desc').get();
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ArchiveEntry[];
      setArchives(data);
    } catch (error) {
      console.error("Error fetching archives:", error);
    }
    setLoading(false);
  };

  const handleAddNew = () => {
    setEditingEntry({
      title: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Document',
      description: '',
      link: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (entry: ArchiveEntry) => {
    setEditingEntry({ ...entry });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this archive entry?")) return;
    try {
      await db.collection('archives').doc(id).delete();
      fetchArchives();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { id, ...data } = editingEntry;
      if (id) {
        await db.collection('archives').doc(id).set(data, { merge: true });
      } else {
        await db.collection('archives').add(data);
      }
      setIsModalOpen(false);
      fetchArchives();
    } catch (error) {
      console.error("Error saving:", error);
    }
    setIsSaving(false);
  };

  const filteredArchives = useMemo(() => {
    return archives.filter(a => {
      const matchesSearch = (a.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                            (a.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [archives, searchTerm, selectedCategory]);

  const categories = ['All', 'Document', 'Photo', 'Video', 'History', 'Minute', 'Rawngbawltu te', 'Weekly Program', 'Pastors', 'Upa kal ta te'];
  
  const isSSDepartmentView = selectedCategory === 'Rawngbawltu te' && editingEntry.subCategory === 'Sunday School';
  const isSSHotute = selectedCategory === 'Rawngbawltu te' && editingEntry.subCategory === 'Sunday School Hotute';

  const getIcon = (category: string) => {
      switch(category) {
          case 'Photo': return <ImageIcon size={20} className="text-blue-500" />;
          case 'Video': return <Video size={20} className="text-red-500" />;
          case 'History': return <History size={20} className="text-amber-500" />;
          case 'Minute': return <FileText size={20} className="text-slate-500" />;
          case 'Weekly Program': return <Calendar size={20} className="text-green-500" />;
          default: return <Archive size={20} className="text-church-500" />;
      }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-4xl font-serif font-bold text-church-900 mb-2">Archives</h1>
                <p className="text-slate-600">Historical records, documents, and past leadership.</p>
            </div>
            {isAdmin && (
                <button 
                    onClick={handleAddNew}
                    className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm transition font-bold"
                >
                    <Plus size={18} className="mr-2" /> Add Entry
                </button>
            )}
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            selectedCategory === cat 
                            ? 'bg-church-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow text-church-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutList size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow text-church-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Grid size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* Content */}
        {loading ? (
            <div className="text-center py-20"><Loader className="animate-spin h-10 w-10 mx-auto text-church-500" /></div>
        ) : filteredArchives.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                <Archive className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No archives found.</p>
            </div>
        ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {filteredArchives.map(archive => (
                    <div 
                        key={archive.id} 
                        className={`bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition ${
                            viewMode === 'list' ? 'flex flex-col md:flex-row items-start md:items-center p-4' : 'flex flex-col p-0'
                        }`}
                    >
                        <div className={`flex items-center gap-4 ${viewMode === 'grid' ? 'p-4 border-b border-slate-50' : 'flex-1'}`}>
                            <div className={`p-3 rounded-lg ${viewMode === 'list' ? 'bg-slate-50' : 'bg-church-50 text-church-600'}`}>
                                {getIcon(archive.category)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg leading-tight">{archive.title}</h3>
                                <p className="text-xs text-slate-500 mt-1">{archive.date} • {archive.category}</p>
                            </div>
                        </div>

                        <div className={`${viewMode === 'list' ? 'md:w-1/2 mt-2 md:mt-0 pl-16 md:pl-0' : 'p-4 flex-1'}`}>
                            <p className="text-slate-600 text-sm line-clamp-2">{archive.description}</p>
                        </div>

                        <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'mt-4 md:mt-0 md:ml-4' : 'p-4 pt-0 justify-end'}`}>
                            {archive.link && (
                                <a 
                                    href={archive.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="Open Link"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            )}
                            {isAdmin && (
                                <>
                                    <button 
                                        onClick={() => handleEdit(archive)}
                                        className="p-2 text-slate-400 hover:text-church-600 hover:bg-slate-50 rounded-lg transition"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(archive.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-slate-800">{editingEntry.id ? 'Edit Entry' : 'Add Entry'}</h3>
                    <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                        <input className="w-full border p-2.5 rounded-lg" value={editingEntry.title || ''} onChange={e => setEditingEntry({...editingEntry, title: e.target.value})} placeholder="Archive Title" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                            <input type="date" className="w-full border p-2.5 rounded-lg" value={editingEntry.date || ''} onChange={e => setEditingEntry({...editingEntry, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                            <select className="w-full border p-2.5 rounded-lg bg-white" value={editingEntry.category || 'Document'} onChange={e => setEditingEntry({...editingEntry, category: e.target.value as any})}>
                                {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                        <textarea className="w-full border p-2.5 rounded-lg h-32" value={editingEntry.description || ''} onChange={e => setEditingEntry({...editingEntry, description: e.target.value})} placeholder="Details..." />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Link (Optional)</label>
                        <input className="w-full border p-2.5 rounded-lg" value={editingEntry.link || ''} onChange={e => setEditingEntry({...editingEntry, link: e.target.value})} placeholder="https://..." />
                    </div>
                </div>
                <div className="p-6 border-t bg-slate-50 rounded-b-xl flex justify-end space-x-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-white transition">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center transition shadow-sm">
                        {isSaving ? <Loader className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>} Save
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Archives;
