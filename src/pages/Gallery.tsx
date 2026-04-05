import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GalleryItem, GalleryFolder } from '../types';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Folder, 
  ArrowLeft, 
  Calendar, 
  Loader2,
  X,
  Save,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Gallery: React.FC = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse URL: /gallery/:category?/:folderId?
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentCategoryPath = pathParts[1]; // e.g. 'committees'
  const currentFolderId = pathParts[2]; // e.g. folder document ID
  
  const categories = [
    { name: 'Committees', path: 'committees', label: 'Committees' },
    { name: 'Kohhran Chetna', path: 'kohhran-chetna', label: 'Kohhran Chetna' },
    { name: 'Kohhran Hunpui', path: 'kohhran-hunpui', label: 'Kohhran Hunpui' },
  ];
  
  const currentCategory = categories.find(c => c.path === currentCategoryPath)?.label as GalleryFolder['category'] | undefined;
  
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<GalleryFolder | null>(null);
  
  // Modal states
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [folderForm, setFolderForm] = useState<Partial<GalleryFolder>>({ name: '', date: new Date().toISOString().split('T')[0] });
  const [itemForm, setItemForm] = useState<Partial<GalleryItem>>({ title: '', imageUrl: '', date: new Date().toISOString().split('T')[0] });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentCategory) {
        setLoading(false);
        return;
    }
    
    setLoading(true);
    
    // Fetch folders for this category
    const unsubscribeFolders = db.collection('gallery_folders')
        .where('category', '==', currentCategory)
        .onSnapshot((snapshot: any) => {
            const folderData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            // Sort in memory to avoid index requirement
            folderData.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
            
            setFolders(folderData);
            
            if (currentFolderId) {
                const folder = folderData.find((f: any) => f.id === currentFolderId);
                setCurrentFolder(folder || null);
            } else {
                setCurrentFolder(null);
            }
        }, (error: any) => {
            console.error("Error fetching folders:", error);
            handleFirestoreError(error, OperationType.GET, 'gallery_folders');
            setLoading(false);
        });

    // Fetch items
    let query = db.collection('gallery').where('category', '==', currentCategory);
    if (currentFolderId) {
        query = query.where('folderId', '==', currentFolderId);
    } else {
        // If no folder selected, show items with no folderId
        query = query.where('folderId', '==', null);
    }
    
    const unsubscribeItems = query.onSnapshot((snapshot: any) => {
        const itemData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        // Sort in memory to avoid index requirement
        itemData.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
        
        setItems(itemData);
        setLoading(false);
    }, (error: any) => {
        console.error("Error fetching items:", error);
        handleFirestoreError(error, OperationType.GET, 'gallery');
        setLoading(false);
    });

    return () => {
        unsubscribeFolders();
        unsubscribeItems();
    };
  }, [currentCategory, currentFolderId]);

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.name || !currentCategory) return;
    
    try {
        await db.collection('gallery_folders').add({
            ...folderForm,
            category: currentCategory
        });
        setIsAddingFolder(false);
        setFolderForm({ name: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
        console.error("Error adding folder:", error);
        handleFirestoreError(error, OperationType.CREATE, 'gallery_folders');
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.title || !itemForm.imageUrl || !currentCategory) return;
    
    try {
        await db.collection('gallery').add({
            ...itemForm,
            category: currentCategory,
            folderId: currentFolderId || null
        });
        setIsAddingItem(false);
        setItemForm({ title: '', imageUrl: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
        console.error("Error adding item:", error);
        handleFirestoreError(error, OperationType.CREATE, 'gallery');
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this folder and all its contents?")) return;
    
    try {
        // Delete items in folder first
        const itemsSnapshot = await db.collection('gallery').where('folderId', '==', id).get();
        const batch = db.batch();
        itemsSnapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
        await batch.commit();
        
        // Delete folder
        await db.collection('gallery_folders').doc(id).delete();
        if (currentFolderId === id) navigate(`/gallery/${currentCategoryPath}`);
    } catch (error) {
        console.error("Error deleting folder:", error);
        handleFirestoreError(error, OperationType.DELETE, `gallery_folders/${id}`);
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this image?")) return;
    try {
        await db.collection('gallery').doc(id).delete();
    } catch (error) {
        console.error("Error deleting item:", error);
        handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div className="bg-church-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            Church Gallery
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-church-100 max-w-2xl mx-auto"
          >
            Capturing the moments and memories of our church life and service.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Navigation Breadcrumbs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Link to="/gallery" className="hover:text-church-600 transition">Gallery</Link>
            {currentCategory && (
              <>
                <ChevronRight size={14} className="text-slate-400" />
                <Link to={`/gallery/${currentCategoryPath}`} className={`hover:text-church-600 transition ${!currentFolderId ? 'font-bold text-church-700' : ''}`}>
                  {currentCategory}
                </Link>
              </>
            )}
            {currentFolder && (
              <>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="font-bold text-church-700">{currentFolder.name}</span>
              </>
            )}
          </div>
          
          {currentCategoryPath && (
            <button 
              onClick={() => navigate(currentFolderId ? `/gallery/${currentCategoryPath}` : '/gallery')}
              className="flex items-center text-sm font-medium text-slate-500 hover:text-church-600 transition"
            >
              <ArrowLeft size={16} className="mr-1" /> Back
            </button>
          )}
        </div>

        {/* Main Content */}
        {!currentCategoryPath ? (
          /* Category Selection */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link 
                  to={`/gallery/${cat.path}`}
                  className="group block bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="h-48 bg-church-100 flex items-center justify-center group-hover:bg-church-200 transition-colors">
                    <Folder size={64} className="text-church-400 group-hover:scale-110 transition-transform duration-300" fill="currentColor" fillOpacity={0.1} />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{cat.label}</h3>
                    <p className="text-sm text-slate-500">View folders and photos</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Category View (Folders or Items) */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {currentFolder ? currentFolder.name : currentCategory}
              </h2>
              
              {isAdmin && (
                <div className="flex space-x-2">
                  {!currentFolderId && (
                    <button 
                      onClick={() => setIsAddingFolder(true)}
                      className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 transition shadow-sm"
                    >
                      <Plus size={18} className="mr-2" /> New Folder
                    </button>
                  )}
                  <button 
                    onClick={() => setIsAddingItem(true)}
                    className="flex items-center px-4 py-2 bg-white text-church-600 border border-church-200 rounded-lg hover:bg-church-50 transition shadow-sm"
                  >
                    <Plus size={18} className="mr-2" /> Add Photo
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-church-600 mb-4" size={48} />
                <p className="text-slate-500">Loading gallery...</p>
              </div>
            ) : (
              <>
                {/* Folders (only shown if no folder is selected) */}
                {!currentFolderId && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
                    {folders.map((folder) => (
                      <Link 
                        key={folder.id}
                        to={`/gallery/${currentCategoryPath}/${folder.id}`}
                        className="group relative bg-white p-4 rounded-xl border border-slate-200 hover:border-church-300 hover:shadow-md transition-all text-center"
                      >
                        <div className="mb-3 flex justify-center">
                          <Folder size={48} className="text-amber-400 group-hover:scale-110 transition-transform" fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <h4 className="font-bold text-slate-800 truncate">{folder.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{folder.date}</p>
                        
                        {isAdmin && (
                          <button 
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                            className="absolute top-2 right-2 p-1.5 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-full transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </Link>
                    ))}
                    
                    {folders.length === 0 && (
                      <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <Folder size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500">No folders created yet.</p>
                        {isAdmin && <p className="text-sm text-church-600 mt-2">Click "New Folder" to get started.</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Items (Photos) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {items.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                    >
                      <div 
                        className="aspect-square overflow-hidden cursor-pointer"
                        onClick={() => setSelectedImage(item.imageUrl)}
                      >
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-slate-800 truncate">{item.title}</h4>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <Calendar size={12} className="mr-1" />
                          {item.date}
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <button 
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 hover:bg-red-50 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <ImageIcon size={48} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">No photos in this {currentFolderId ? 'folder' : 'category'} yet.</p>
                      {isAdmin && <p className="text-sm text-church-600 mt-2">Click "Add Photo" to upload images.</p>}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Folder Modal */}
        {isAddingFolder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-900 text-white">
                <h3 className="text-xl font-bold">Create New Folder</h3>
                <button onClick={() => setIsAddingFolder(false)} className="text-white/70 hover:text-white transition">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSaveFolder} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Folder Name</label>
                  <input 
                    required
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none transition"
                    placeholder="e.g. Sunday School 2024"
                    value={folderForm.name}
                    onChange={e => setFolderForm({...folderForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input 
                    required
                    type="date"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none transition"
                    value={folderForm.date}
                    onChange={e => setFolderForm({...folderForm, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
                  <textarea 
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none transition h-24"
                    placeholder="Brief description of the folder contents..."
                    value={folderForm.description || ''}
                    onChange={e => setFolderForm({...folderForm, description: e.target.value})}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingFolder(false)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 bg-church-600 text-white rounded-lg font-bold hover:bg-church-700 transition flex items-center justify-center shadow-md"
                  >
                    <Save size={18} className="mr-2" /> Create Folder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Item Modal */}
        {isAddingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-900 text-white">
                <h3 className="text-xl font-bold">Add New Photo</h3>
                <button onClick={() => setIsAddingItem(false)} className="text-white/70 hover:text-white transition">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Photo Title</label>
                  <input 
                    required
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none transition"
                    placeholder="e.g. Group Photo"
                    value={itemForm.title}
                    onChange={e => setItemForm({...itemForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Image URL</label>
                  <input 
                    required
                    type="url"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none transition"
                    placeholder="https://example.com/image.jpg"
                    value={itemForm.imageUrl}
                    onChange={e => setItemForm({...itemForm, imageUrl: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input 
                    required
                    type="date"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none transition"
                    value={itemForm.date}
                    onChange={e => setItemForm({...itemForm, date: e.target.value})}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 bg-church-600 text-white rounded-lg font-bold hover:bg-church-700 transition flex items-center justify-center shadow-md"
                  >
                    <Save size={18} className="mr-2" /> Add Photo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={selectedImage} 
                alt="Preview" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-church-300 transition"
              >
                <X size={32} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
