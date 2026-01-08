
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ArchiveEntry } from '../types';
import { Archive, FileText, Image, Video, History, File, Plus, Edit, Trash, Search, Loader, ExternalLink, X, Save, AlertTriangle } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'Document': FileText,
    'Photo': Image,
    'Video': Video,
    'History': History,
    'Minute': File
};

const Archives: React.FC = () => {
    const { t } = useLanguage();
    const { isAdmin } = useAuth();
    const [archives, setArchives] = useState<ArchiveEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Partial<ArchiveEntry>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initial Mock Data (Fallback)
    const MOCK_ARCHIVES: ArchiveEntry[] = [
        { id: '1', title: 'Church Foundation Stone Laying', date: '1985-04-12', category: 'History', description: 'Records of the foundation stone laying ceremony.', link: '#' },
        { id: '2', title: 'Silver Jubilee Souvenir', date: '2010-10-15', category: 'Document', description: 'Scanned copy of the Silver Jubilee souvenir book.', link: '#' },
        { id: '3', title: 'Old Church Building Photo', date: '1990-05-20', category: 'Photo', description: 'Photograph of the first church building.', link: '#' }
    ];

    const fetchArchives = useCallback(async () => {
        setLoading(true);
        if (!db || !db.collection) {
            setArchives(MOCK_ARCHIVES);
            setLoading(false);
            return;
        }

        try {
            const snapshot = await db.collection('archives').orderBy('date', 'desc').get();
            if (!snapshot.empty) {
                const fetchedData = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data()
                })) as ArchiveEntry[];
                setArchives(fetchedData);
            } else {
                setArchives(MOCK_ARCHIVES); // Use mock data if empty for demo purposes, or empty array in production
            }
        } catch (error) {
            console.error("Error fetching archives:", error);
            setArchives(MOCK_ARCHIVES);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchArchives();
    }, [fetchArchives]);

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
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!db?.collection || !window.confirm("Are you sure you want to delete this archive entry?")) return;
        try {
            await db.collection('archives').doc(id).delete();
            fetchArchives();
        } catch (error) {
            console.error("Error deleting archive:", error);
            alert("Failed to delete archive entry.");
        }
    };

    const handleSave = async () => {
        if (!db?.collection) {
            alert("Database connection not available.");
            return;
        }
        
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
            console.error("Error saving archive:", error);
            alert("Failed to save archive entry.");
        }
        setIsSaving(false);
    };

    const filteredArchives = archives.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', 'Document', 'Photo', 'Video', 'History', 'Minute'];

    return (
        <div className="py-12 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">{t.archives.title}</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">{t.archives.subtitle}</p>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                    selectedCategory === cat 
                                    ? 'bg-church-600 text-white' 
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search archives..." 
                                className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 focus:border-transparent outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {isAdmin && (
                            <button 
                                onClick={handleAddNew}
                                className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm transition whitespace-nowrap"
                            >
                                <Plus size={18} className="mr-2" /> {t.archives.add}
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
                ) : filteredArchives.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredArchives.map(entry => {
                            const Icon = CATEGORY_ICONS[entry.category] || Archive;
                            return (
                                <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition group relative">
                                    {isAdmin && (
                                        <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(entry)} className="p-1.5 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-600 bg-red-50 rounded-full hover:bg-red-100"><Trash size={16} /></button>
                                        </div>
                                    )}
                                    <div className="flex items-start mb-4">
                                        <div className="p-3 bg-church-50 text-church-600 rounded-lg mr-4">
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{entry.category}</span>
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight mt-1">{entry.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1">{entry.date}</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                                        {entry.description}
                                    </p>
                                    {entry.link && (
                                        <a 
                                            href={entry.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm font-medium text-church-600 hover:text-church-800"
                                        >
                                            View Resource <ExternalLink size={14} className="ml-1" />
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                        <Archive className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">{t.archives.empty}</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-church-50 rounded-t-xl">
                            <h3 className="text-xl font-bold text-church-900">{editingEntry.id ? 'Edit Archive' : 'Add New Archive'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                                <input 
                                    className="w-full border border-slate-300 rounded p-2.5" 
                                    value={editingEntry.title || ''} 
                                    onChange={e => setEditingEntry({...editingEntry, title: e.target.value})}
                                    placeholder="e.g., Annual Report 2020"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                                    <input 
                                        type="date"
                                        className="w-full border border-slate-300 rounded p-2.5" 
                                        value={editingEntry.date || ''} 
                                        onChange={e => setEditingEntry({...editingEntry, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded p-2.5 bg-white" 
                                        value={editingEntry.category} 
                                        onChange={e => setEditingEntry({...editingEntry, category: e.target.value as any})}
                                    >
                                        {Object.keys(CATEGORY_ICONS).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Link (URL)</label>
                                <input 
                                    className="w-full border border-slate-300 rounded p-2.5" 
                                    value={editingEntry.link || ''} 
                                    onChange={e => setEditingEntry({...editingEntry, link: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea 
                                    className="w-full border border-slate-300 rounded p-2.5 h-32" 
                                    value={editingEntry.description || ''} 
                                    onChange={e => setEditingEntry({...editingEntry, description: e.target.value})}
                                    placeholder="Details about this record..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center transition shadow-sm disabled:opacity-50">
                                {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={18} className="mr-2" />} Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Archives;
