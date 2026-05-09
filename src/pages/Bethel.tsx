
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
  const [navigationStack, setNavigationStack] = useState<BethelFolder[]>([]);
  
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const currentFolder = navigationStack.length > 0 ? navigationStack[navigationStack.length - 1] : null;
  const currentFolderId = currentFolder?.id || null;

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    if (!db?.collection) { setLoading(false); return; }
    try {
      // For simplicity, we fetch the folders at the current level
      // In a real large app, we'd use a where query on parentId
      const snapshot = await db.collection('bethelFolders').get();
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BethelFolder));
      docs.sort((a, b) => b.date.localeCompare(a.date));
      setFolders(docs);
    } catch (e) {
      console.error("Error fetching folders:", e);
    }
    setLoading(false);
  }, []);

  const fetchPdfs = useCallback(async (folderId: string | null) => {
    if (!db?.collection) return;
    try {
      const query = folderId 
        ? db.collection('bethelPdfs').where('folderId', '==', folderId)
        : db.collection('bethelPdfs').where('folderId', '==', 'root'); // Should handle root null cases
      
      const snapshot = await query.get();
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BethelPdf));
      docs.sort((a, b) => b.date.localeCompare(a.date));
      setPdfs(docs);
    } catch (e) {
      console.error("Error fetching PDFs:", e);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
    fetchPdfs(currentFolderId);
  }, [fetchFolders, fetchPdfs, currentFolderId]);

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const docRef = await db.collection('bethelFolders').add({
        name: newFolderName,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        parentId: currentFolderId
      });
      setNewFolderName('');
      setAddingFolder(false);
      await fetchFolders();
    } catch (e) {
      alert('Failed to add folder.');
    }
  };

  const handleDeleteFolder = async (folder: BethelFolder) => {
    if (!window.confirm(`${t.bethel.deleteConfirm || 'Delete folder?'} "${folder.name}"?`)) return;
    
    try {
      // Check for subfolders
      const subSnapshot = await db.collection('bethelFolders').where('parentId', '==', folder.id).get();
      if (!subSnapshot.empty) {
        alert('Cannot delete folder: It contains subfolders. Please delete subfolders first.');
        return;
      }

      // Check for PDFs
      const pdfSnapshot = await db.collection('bethelPdfs').where('folderId', '==', folder.id).get();
      if (!pdfSnapshot.empty) {
        alert('Cannot delete folder: It still contains PDFs. Please delete PDFs first.');
        return;
      }
      
      await db.collection('bethelFolders').doc(folder.id).delete();
      await fetchFolders();
    } catch (e) {
      alert('Failed to delete folder.');
    }
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
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

      const folderName = currentFolder ? currentFolder.name : 'root';
      const path = `bethelNewspaper/${folderName}/${Date.now()}_${file.name}`;
      const ref = storage.ref(path);
      await ref.put(file);
      const url = await ref.getDownloadURL();

      const newPdf = {
        name: file.name,
        url,
        storagePath: path,
        folderId: currentFolderId || 'root',
        date: new Date().toISOString(),
        uploadedAt: new Date().toISOString()
      };

      await db.collection('bethelPdfs').add(newPdf);

      setUploadProgress('');
      await fetchPdfs(currentFolderId);
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
      await fetchPdfs(currentFolderId);
    } catch (e) {
      alert('Failed to delete PDF.');
    }
    setDeletingId(null);
  };

  const formatDate = (iso: string) => 
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const currentFolders = folders.filter(f => 
    (f.parentId || null) === currentFolderId &&
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigateTo = (folder: BethelFolder) => {
    setNavigationStack(prev => [...prev, folder]);
    setSearchTerm('');
  };

  const navigateBack = (index: number) => {
    setNavigationStack(prev => prev.slice(0, index + 1));
    setSearchTerm('');
  };

  const navigateToRoot = () => {
    setNavigationStack([]);
    setSearchTerm('');
  };

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
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 min-h-[600px] flex flex-col">
          
          {/* Breadcrumbs / Toolbar */}
          <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2 text-sm">
              <button 
                onClick={navigateToRoot}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  navigationStack.length === 0 ? 'bg-church-100 text-church-700 font-bold' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <FolderOpen size={16} /> Root
              </button>
              
              {navigationStack.map((folder, idx) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight size={14} className="text-slate-300" />
                  <button 
                    onClick={() => navigateBack(idx)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      idx === navigationStack.length - 1 ? 'bg-church-100 text-church-700 font-bold' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search current level..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-church-500 outline-none transition w-full md:w-64"
                />
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setAddingFolder(true)}
                    className="p-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition shadow-sm"
                    title="Add Subfolder"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2 bg-yellow-500 text-black rounded-xl hover:bg-yellow-400 transition shadow-sm disabled:opacity-50"
                    title="Upload PDF"
                  >
                    {uploading ? <Loader className="animate-spin" size={20} /> : <FileUp size={20} />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleUploadPdf} />
                </div>
              )}
            </div>
          </div>

          <main className="flex-1 p-6 md:p-8 bg-slate-50/30 overflow-y-auto">
            {addingFolder && (
               <div className="max-w-md mb-8 bg-white p-6 rounded-3xl border-2 border-church-200 shadow-xl animate-in zoom-in-95 duration-200">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <FolderOpen className="text-church-600" size={20} /> New folder in {currentFolder?.name || 'Root'}
                 </h3>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Folder name..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                    className="w-full px-4 py-3 border-2 border-slate-100 rounded-2xl text-sm focus:border-church-500 outline-none mb-4"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={handleAddFolder}
                      className="flex-1 py-3 bg-church-600 text-white text-sm font-bold rounded-2xl hover:bg-church-700 transition"
                    >
                      Create Folder
                    </button>
                    <button 
                      onClick={() => setAddingFolder(false)}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
               </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader className="animate-spin mb-4" size={32} />
                <p className="font-medium">Syncing with cloud...</p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Folders Selection */}
                <section>
                   <div className="flex items-center gap-3 mb-6">
                     <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Folders</h3>
                     <div className="flex-1 h-px bg-slate-200"></div>
                   </div>
                   
                   {currentFolders.length === 0 ? (
                     <div className="text-center py-8 bg-dashed border-2 border-dashed border-slate-200 rounded-3xl">
                       <p className="text-slate-400 text-sm italic">No folders here yet.</p>
                     </div>
                   ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {currentFolders.map(folder => (
                        <div 
                          key={folder.id}
                          onClick={() => navigateTo(folder)}
                          className="group relative bg-white border border-slate-100 p-5 rounded-3xl cursor-pointer hover:border-church-400 hover:shadow-xl hover:-translate-y-1 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-church-50 text-church-600 flex items-center justify-center group-hover:bg-church-600 group-hover:text-white transition-colors duration-300">
                              <FolderOpen size={24} />
                            </div>
                            <div className="min-w-0">
                               <h4 className="font-bold text-slate-800 truncate group-hover:text-church-700">{folder.name}</h4>
                               <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{formatDate(folder.date)}</p>
                            </div>
                          </div>
                          
                          {isAdmin && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                   )}
                </section>

                {/* PDFs Selection */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Documents</h3>
                    <div className="flex-1 h-px bg-slate-200"></div>
                  </div>

                  {pdfs.length === 0 ? (
                    <div className="text-center py-12 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl">
                      <FileText className="mx-auto mb-4 text-slate-200" size={48} />
                      <p className="text-slate-400 text-sm italic">No PDFs uploaded in this scope.</p>
                      {isAdmin && (
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-4 text-church-600 font-bold text-sm hover:underline"
                        >
                          Upload first PDF
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pdfs.map((pdf, idx) => (
                        <div 
                          key={pdf.id}
                          className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-3xl hover:border-church-400 hover:shadow-xl transition-all group"
                        >
                          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                            <FileText size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 truncate mb-1">{pdf.name}</h4>
                            <p className="text-slate-400 text-xs">{formatDate(pdf.uploadedAt)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setViewingPdf(pdf)} className="p-2 text-church-600 hover:bg-church-50 rounded-xl transition"><Eye size={18} /></button>
                            <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"><Download size={18} /></a>
                            {isAdmin && (
                              <button onClick={() => handleDeletePdf(pdf)} disabled={deletingId === pdf.id} className="p-2 text-red-400 hover:text-red-500 rounded-xl transition">
                                {deletingId === pdf.id ? <Loader className="animate-spin" size={18} /> : <Trash2 size={18} />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Bethel;
