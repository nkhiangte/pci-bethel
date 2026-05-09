
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FolderOpen, FileText, Plus, Trash2, Loader, 
  FileUp, Eye, Download, X, ChevronRight, Newspaper, Info, Search
} from 'lucide-react';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BethelFolder, BethelPdf } from '../types';

const Bethel: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  
  const [folders, setFolders] = useState<BethelFolder[]>([]);
  const [pdfs, setPdfs] = useState<BethelPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<BethelFolder | null>(null);
  
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<BethelPdf | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    if (!db?.collection) { setLoading(false); return; }
    try {
      const snapshot = await db.collection('bethelFolders').get();
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BethelFolder));
      docs.sort((a, b) => b.date.localeCompare(a.date));
      setFolders(docs);
    } catch (e) {
      console.error("Error fetching folders:", e);
    }
    setLoading(false);
  }, []);

  const fetchPdfs = useCallback(async (folderId: string) => {
    if (!db?.collection) return;
    try {
      const snapshot = await db.collection('bethelPdfs')
        .where('folderId', '==', folderId)
        .get();
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BethelPdf));
      docs.sort((a, b) => b.date.localeCompare(a.date));
      setPdfs(docs);
    } catch (e) {
      console.error("Error fetching PDFs:", e);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    if (selectedFolder) {
      fetchPdfs(selectedFolder.id);
    } else {
      setPdfs([]);
    }
  }, [selectedFolder, fetchPdfs]);

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const docRef = await db.collection('bethelFolders').add({
        name: newFolderName,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setNewFolderName('');
      setAddingFolder(false);
      await fetchFolders();
      // Optionally auto-select the new folder
      const newFolder = { id: docRef.id, name: newFolderName, date: new Date().toISOString() };
      setSelectedFolder(newFolder as BethelFolder);
    } catch (e) {
      alert('Failed to add folder.');
    }
  };

  const handleDeleteFolder = async (folder: BethelFolder) => {
    if (!window.confirm(`${t.bethel.deleteConfirm || 'Delete folder?'} "${folder.name}"?`)) return;
    
    try {
      // First check if there are PDFs inside
      const pdfSnapshot = await db.collection('bethelPdfs').where('folderId', '==', folder.id).get();
      if (!pdfSnapshot.empty) {
        alert('Cannot delete folder: It still contains PDFs. Please delete PDFs first.');
        return;
      }
      
      await db.collection('bethelFolders').doc(folder.id).delete();
      if (selectedFolder?.id === folder.id) setSelectedFolder(null);
      await fetchFolders();
    } catch (e) {
      alert('Failed to delete folder.');
    }
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFolder || !e.target.files?.length) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      return;
    }

    setUploading(true);
    setUploadProgress('Uploading...');

    try {
      const { storage } = await import('../services/firebase');
      if (!storage) throw new Error('Storage not available');

      const path = `bethelNewspaper/${selectedFolder.name}/${Date.now()}_${file.name}`;
      const ref = storage.ref(path);
      await ref.put(file);
      const url = await ref.getDownloadURL();

      const newPdf = {
        name: file.name,
        url,
        storagePath: path,
        folderId: selectedFolder.id,
        date: new Date().toISOString(),
        uploadedAt: new Date().toISOString()
      };

      await db.collection('bethelPdfs').add(newPdf);

      setUploadProgress('');
      await fetchPdfs(selectedFolder.id);
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
      setUploadProgress('');
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePdf = async (pdf: BethelPdf) => {
    if (!window.confirm(`Delete library item "${pdf.name}"?`)) return;
    setDeletingId(pdf.id);
    try {
      const { storage } = await import('../services/firebase');
      if (storage && pdf.storagePath) {
        try {
          await storage.ref(pdf.storagePath).delete();
        } catch (_) {}
      }
      await db.collection('bethelPdfs').doc(pdf.id).delete();
      if (selectedFolder) await fetchPdfs(selectedFolder.id);
    } catch (e) {
      alert('Failed to delete PDF.');
    }
    setDeletingId(null);
  };

  const formatDate = (iso: string) => 
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PdfViewerModal: React.FC<{ pdf: BethelPdf; onClose: () => void }> = ({ pdf, onClose }) => (
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col backdrop-blur-sm">
      <div className="bg-church-900 text-white px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-yellow-400" />
          <span className="font-bold truncate max-w-md">{pdf.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href={pdf.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-bold hover:bg-yellow-400 transition shadow-sm"
          >
            <Download size={16} /> Download
          </a>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-church-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>
      <div className="flex-grow bg-slate-800">
        <iframe 
          src={`${pdf.url}#toolbar=1`} 
          className="w-full h-full border-none"
          title={pdf.name}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      {viewingPdf && <PdfViewerModal pdf={viewingPdf} onClose={() => setViewingPdf(null)} />}
      
      {/* Header Section */}
      <section className="bg-church-900 text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Newspaper size={400} className="absolute -right-20 -bottom-20 rotate-12" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-yellow-500/30">
                <Newspaper size={14} /> Weekly Bulletin
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{t.bethel.title}</h1>
              <p className="text-church-100 text-lg leading-relaxed max-w-xl">
                {t.bethel.description}
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                 <div className="flex items-center gap-3 text-sm">
                   <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                     <Info size={20} />
                   </div>
                   <div>
                     <p className="font-bold">Digital Archive</p>
                     <p className="text-church-200">Preserving our history</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 min-h-[600px] flex flex-col lg:flex-row">
          
          {/* Sidebar: Folders List */}
          <aside className="w-full lg:w-80 border-r border-slate-100 bg-slate-50/50 flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t.bethel.folders}</h3>
                {isAdmin && (
                  <button 
                    onClick={() => setAddingFolder(true)}
                    className="p-2 rounded-xl bg-church-600 text-white hover:bg-church-700 transition-all shadow-sm hover:shadow-md"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search folders..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-church-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {addingFolder && (
                 <div className="bg-white p-4 rounded-2xl border-2 border-church-200 shadow-lg animate-in zoom-in-95 duration-200 mb-4">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Folder Name</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="e.g. 2024 Bulletins"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                      className="w-full px-3 py-2 border-2 border-slate-100 rounded-xl text-sm focus:border-church-500 outline-none mb-3"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleAddFolder}
                        className="flex-1 py-2 bg-church-600 text-white text-sm font-bold rounded-xl hover:bg-church-700"
                      >
                        Create
                      </button>
                      <button 
                        onClick={() => setAddingFolder(false)}
                        className="flex-1 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                 </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader className="animate-spin mb-3" size={24} />
                  <p className="text-sm font-medium">Loading folders...</p>
                </div>
              ) : filteredFolders.length === 0 ? (
                <div className="text-center py-20 px-6">
                  <FolderOpen className="mx-auto mb-4 text-slate-200" size={48} />
                  <p className="text-slate-400 font-medium">{t.bethel.noFolders}</p>
                </div>
              ) : (
                filteredFolders.map(folder => (
                  <div 
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder)}
                    className={`group relative flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                      selectedFolder?.id === folder.id 
                        ? 'bg-church-600 text-white border-church-500 shadow-lg translate-x-1' 
                        : 'bg-white border-slate-100 text-slate-700 hover:border-church-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        selectedFolder?.id === folder.id ? 'bg-church-500/50' : 'bg-slate-100 text-church-600'
                      }`}>
                        <FolderOpen size={18} />
                      </div>
                      <span className="font-bold text-sm truncate">{folder.name}</span>
                    </div>
                    
                    <div className="flex items-center shrink-0">
                      {isAdmin && selectedFolder?.id !== folder.id && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <ChevronRight size={16} className={selectedFolder?.id === folder.id ? 'text-white' : 'text-slate-300'} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Main Content: Files List */}
          <main className="flex-1 bg-white p-6 md:p-8 flex flex-col h-full overflow-hidden">
            {!selectedFolder ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                   <Newspaper size={48} className="opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Select a folder</h3>
                <p className="max-w-xs text-center text-slate-400 leading-relaxed">
                  Browse the historical archives of Bethel Newspaper by selecting a folder from the sidebar.
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-church-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-church-200">
                      <FolderOpen size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedFolder.name}</h2>
                      <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                        {pdfs.length} PDF Document{pdfs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex items-center">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-6 py-3 bg-church-600 text-white rounded-2xl font-bold hover:bg-church-700 transition shadow-lg shadow-church-100 disabled:opacity-60 disabled:cursor-not-allowed group"
                      >
                        {uploading ? (
                          <><Loader className="animate-spin" size={20} /> <span>{uploadProgress}</span></>
                        ) : (
                          <><FileUp size={20} className="group-hover:-translate-y-1 transition-transform" /> <span>{t.bethel.uploadPdf}</span></>
                        )}
                      </button>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleUploadPdf}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {pdfs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                      <FileText size={64} className="mb-4 opacity-10" />
                      <p className="font-bold text-lg">{t.bethel.noPdfs}</p>
                      {isAdmin && <p className="text-sm mt-1">Upload the first newspaper for this folder.</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pdfs.map((pdf, idx) => (
                        <div 
                          key={pdf.id}
                          className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-3xl hover:border-church-400 hover:shadow-xl hover:shadow-church-50 transition-all group"
                        >
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                              <FileText size={24} />
                            </div>
                            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                              {pdfs.length - idx}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 truncate mb-1 group-hover:text-church-700 transition-colors">{pdf.name}</h4>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Added {formatDate(pdf.uploadedAt)}</p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setViewingPdf(pdf)}
                              className="p-2.5 text-church-600 hover:bg-church-50 rounded-xl transition"
                              title="Quick View"
                            >
                              <Eye size={18} />
                            </button>
                            <a 
                              href={pdf.url} 
                              download 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                              title="Download PDF"
                            >
                              <Download size={18} />
                            </a>
                            {isAdmin && (
                              <button 
                                onClick={() => handleDeletePdf(pdf)}
                                disabled={deletingId === pdf.id}
                                className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingId === pdf.id ? <Loader className="animate-spin" size={18} /> : <Trash2 size={18} />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Bethel;
