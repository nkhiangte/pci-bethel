
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { Article } from '../types';
import { 
  FileText, Mic, Search, Plus, Edit, Trash, X, Save, 
  Calendar, User, Filter, ExternalLink, Loader, ChevronRight
} from 'lucide-react';

const Articles: React.FC = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'All' | 'Article' | 'Sermon'>('All');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false); // Reading modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Editing modal
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editingArticle, setEditingArticle] = useState<Partial<Article>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
      setArticles([]);
      setLoading(false);
      return;
    }

    try {
      const snapshot = await db.collection('articles').orderBy('date', 'desc').get();
      if (!snapshot.empty) {
        const data = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Article[];
        setArticles(data);
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      setArticles([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleAddNew = () => {
    setEditingArticle({
      title: '',
      author: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Article',
      content: '',
      imageUrl: '',
      videoUrl: ''
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    setEditingArticle({ ...article });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!db?.doc || !window.confirm(t.articles.deleteConfirm)) return;
    
    try {
      await db.collection('articles').doc(id).delete();
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      alert(t.articles.deleteFail);
    }
  };

  const handleSave = async () => {
    if (!db?.collection) return;
    
    // Basic validation
    if (!editingArticle.title || !editingArticle.author || !editingArticle.content) {
      alert(t.articles.validation);
      return;
    }

    setIsSaving(true);
    try {
      const { id, ...data } = editingArticle;
      
      if (id) {
        await db.collection('articles').doc(id).set(data, { merge: true });
      } else {
        await db.collection('articles').add({
            ...data,
            views: 0 // Initialize views
        });
      }
      
      setIsEditModalOpen(false);
      fetchArticles();
    } catch (error) {
      console.error("Error saving article:", error);
      alert(t.articles.saveFail);
    }
    setIsSaving(false);
  };

  const openReader = (article: Article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
    // Optional: Increment view count logic here
  };

  const filteredArticles = articles.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">{t.articles.title}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">{t.articles.subtitle}</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t.articles.searchPlaceholder} 
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-church-500 focus:border-transparent outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {/* Filter */}
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
                {(['All', 'Article', 'Sermon'] as const).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === cat ? 'bg-church-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        {cat === 'All' ? t.articles.category.all : cat === 'Article' ? t.articles.category.article : t.articles.category.sermon}
                    </button>
                ))}
            </div>

            {/* Add Button */}
            {isAdmin && (
                <button 
                    onClick={handleAddNew}
                    className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm transition whitespace-nowrap shrink-0"
                >
                    <Plus size={18} className="mr-2" /> {t.articles.addNew}
                </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
            <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
        ) : filteredArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map(article => (
                    <div 
                        key={article.id} 
                        onClick={() => openReader(article)}
                        className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col h-full"
                    >
                        {article.imageUrl && (
                            <div className="h-48 overflow-hidden bg-slate-200 relative">
                                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-church-700 uppercase tracking-wider flex items-center shadow-sm">
                                    {article.category === 'Sermon' ? <Mic size={12} className="mr-1"/> : <FileText size={12} className="mr-1"/>}
                                    {article.category}
                                </div>
                            </div>
                        )}
                        <div className="p-6 flex flex-col flex-grow relative">
                            {!article.imageUrl && (
                                <div className="mb-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${article.category === 'Sermon' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {article.category === 'Sermon' ? <Mic size={12} className="mr-1"/> : <FileText size={12} className="mr-1"/>}
                                        {article.category}
                                    </span>
                                </div>
                            )}
                            
                            <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-church-700 transition-colors">
                                {article.title}
                            </h3>
                            
                            <div className="flex items-center text-sm text-slate-500 mb-4 space-x-3">
                                <span className="flex items-center"><User size={14} className="mr-1"/> {article.author}</span>
                                <span className="flex items-center"><Calendar size={14} className="mr-1"/> {new Date(article.date).toLocaleDateString()}</span>
                            </div>

                            <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-grow">
                                {article.content}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                <span className="text-church-600 font-semibold text-sm flex items-center group-hover:underline">
                                    {t.articles.readMore} <ChevronRight size={16} />
                                </span>
                                
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => handleEdit(e, article)}
                                            className="p-1.5 text-slate-400 hover:text-church-600 hover:bg-slate-50 rounded transition"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(e, article.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded transition"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-700">{t.articles.noContent}</h3>
                <p className="text-slate-500 mt-1">{t.articles.noContentSub}</p>
            </div>
        )}
      </div>

      {/* Reader Modal */}
      {isModalOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm overflow-y-auto">
            <div className="max-w-3xl mx-auto min-h-screen bg-slate-50 shadow-2xl relative">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${selectedArticle.category === 'Sermon' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {selectedArticle.category}
                        </span>
                        <span>•</span>
                        <span>{new Date(selectedArticle.date).toLocaleDateString()}</span>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-8 md:px-12 md:py-12">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-6 leading-tight">
                        {selectedArticle.title}
                    </h1>
                    
                    <div className="flex items-center gap-3 mb-8 pb-8 border-b border-slate-100">
                        <div className="w-10 h-10 bg-church-100 rounded-full flex items-center justify-center text-church-600 font-bold">
                            {selectedArticle.author.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">{selectedArticle.author}</p>
                            <p className="text-xs text-slate-500">{t.articles.writtenBy}</p>
                        </div>
                    </div>

                    {selectedArticle.imageUrl && (
                        <div className="mb-8 rounded-xl overflow-hidden shadow-sm">
                            <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-auto" />
                        </div>
                    )}

                    <article className="prose prose-slate prose-lg max-w-none font-serif text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedArticle.content}
                    </article>

                    {selectedArticle.videoUrl && (
                        <div className="mt-10 pt-8 border-t border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Mic size={20} className="mr-2"/> {t.articles.watchListen}</h3>
                            <a 
                                href={selectedArticle.videoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                            >
                                <ExternalLink size={18} className="mr-2" /> {t.articles.openVideo}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Admin Edit/Add Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-slate-800">{editingArticle.id ? t.articles.editContent : t.articles.addNewContent}</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t.articles.form.title}</label>
                        <input 
                            className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                            value={editingArticle.title || ''} 
                            onChange={e => setEditingArticle({...editingArticle, title: e.target.value})} 
                            placeholder={t.articles.form.placeholders.title}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.articles.form.author}</label>
                            <input 
                                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                                value={editingArticle.author || ''} 
                                onChange={e => setEditingArticle({...editingArticle, author: e.target.value})} 
                                placeholder={t.articles.form.placeholders.author}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.articles.form.date}</label>
                            <input 
                                type="date"
                                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                                value={editingArticle.date || ''} 
                                onChange={e => setEditingArticle({...editingArticle, date: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t.articles.form.category}</label>
                        <div className="flex gap-4 mt-1">
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="category" 
                                    value="Article" 
                                    checked={editingArticle.category === 'Article'} 
                                    onChange={() => setEditingArticle({...editingArticle, category: 'Article'})}
                                    className="mr-2 text-church-600 focus:ring-church-500"
                                />
                                <span className="text-sm">Article</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="category" 
                                    value="Sermon" 
                                    checked={editingArticle.category === 'Sermon'} 
                                    onChange={() => setEditingArticle({...editingArticle, category: 'Sermon'})}
                                    className="mr-2 text-church-600 focus:ring-church-500"
                                />
                                <span className="text-sm">Sermon</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t.articles.form.content}</label>
                        <textarea 
                            className="w-full border p-2.5 rounded-lg h-64 focus:ring-2 focus:ring-church-500 outline-none font-mono text-sm" 
                            value={editingArticle.content || ''} 
                            onChange={e => setEditingArticle({...editingArticle, content: e.target.value})} 
                            placeholder={t.articles.form.placeholders.content}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.articles.form.imageUrl}</label>
                            <input 
                                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                                value={editingArticle.imageUrl || ''} 
                                onChange={e => setEditingArticle({...editingArticle, imageUrl: e.target.value})} 
                                placeholder={t.articles.form.placeholders.image}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.articles.form.videoUrl}</label>
                            <input 
                                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                                value={editingArticle.videoUrl || ''} 
                                onChange={e => setEditingArticle({...editingArticle, videoUrl: e.target.value})} 
                                placeholder={t.articles.form.placeholders.video}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-xl">
                    <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition">{t.articles.cancel}</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center transition shadow-sm disabled:opacity-50">
                        {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={18} className="mr-2" />} {t.articles.saveContent}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Articles;
