import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GalleryItem, GalleryFolder } from '../types';
import { db, auth, storage, handleFirestoreError, OperationType } from '../services/firebase';
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
  ChevronRight,
  Upload,
  CheckCircle2,
  GripVertical,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortablePhotoProps {
  item: GalleryItem;
  isAdmin: boolean;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onEdit: (item: GalleryItem) => void;
  onPreview: (url: string) => void;
}

const SortablePhoto: React.FC<SortablePhotoProps> = ({ item, isAdmin, onDelete, onEdit, onPreview }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
    >
      <div 
        className="aspect-square overflow-hidden cursor-pointer"
        onClick={() => onPreview(item.imageUrl)}
      >
        <img 
          src={item.imageUrl} 
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="p-4 flex justify-between items-start">
        <div>
          <h4 className="font-bold text-slate-800 truncate max-w-[150px]">{item.title}</h4>
          <div className="flex items-center text-xs text-slate-500 mt-1">
            <Calendar size={12} className="mr-1" />
            {item.date}
          </div>
        </div>
        {isAdmin && (
          <div 
            {...attributes} 
            {...listeners}
            className="p-1 text-slate-400 hover:text-church-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={18} />
          </div>
        )}
      </div>
      
      {isAdmin && (
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="p-2 bg-white/90 text-church-600 rounded-full shadow-md hover:bg-church-50 transition"
            title="Edit Caption"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => onDelete(item.id, e)}
            className="p-2 bg-white/90 text-red-500 rounded-full shadow-md hover:bg-red-50 transition"
            title="Delete Photo"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

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
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  
  const [folderForm, setFolderForm] = useState<Partial<GalleryFolder>>({ name: '', date: new Date().toISOString().split('T')[0] });
  const [itemForm, setItemForm] = useState<Partial<GalleryItem>>({ title: '', imageUrl: '', date: new Date().toISOString().split('T')[0] });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        // Sort by order first, then by date
        itemData.sort((a: any, b: any) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            return (b.date || '').localeCompare(a.date || '');
        });
        
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.title || !currentCategory || (selectedFiles.length === 0 && !itemForm.imageUrl)) return;
    
    setUploading(true);
    setUploadProgress(0);

    try {
        const totalFiles = selectedFiles.length;
        let completedFiles = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const storagePath = `gallery/${currentCategoryPath}/${fileName}`;
            const storageRef = storage.ref().child(storagePath);
            
            const uploadTask = storageRef.put(file);
            
            const downloadUrl = await new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const fileProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        const overallProgress = ((completedFiles * 100) + fileProgress) / totalFiles;
                        setUploadProgress(overallProgress);
                    },
                    (error) => reject(error),
                    async () => {
                        const url = await uploadTask.snapshot.ref.getDownloadURL();
                        resolve(url);
                    }
                );
            });

            // Use current items length + i as order
            const order = items.length + i;

            await db.collection('gallery').add({
                ...itemForm,
                title: totalFiles > 1 ? `${itemForm.title} (${i + 1})` : itemForm.title,
                imageUrl: downloadUrl,
                category: currentCategory,
                folderId: currentFolderId || null,
                order: order
            });

            completedFiles++;
            setUploadProgress((completedFiles / totalFiles) * 100);
        }

        setIsAddingItem(false);
        setItemForm({ title: '', imageUrl: '', date: new Date().toISOString().split('T')[0] });
        setSelectedFiles([]);
        setFilePreviews([]);
        setUploadProgress(0);
    } catch (error) {
        console.error("Error adding items:", error);
        handleFirestoreError(error, OperationType.CREATE, 'gallery');
    } finally {
        setUploading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update Firestore with new orders
      try {
        const batch = db.batch();
        newItems.forEach((item, index) => {
          const ref = db.collection('gallery').doc(item.id);
          batch.update(ref, { order: index });
        });
        await batch.commit();
      } catch (error) {
        console.error("Error updating item order:", error);
      }
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title) return;
    
    try {
        await db.collection('gallery').doc(editingItem.id).update({
            title: editingItem.title,
            date: editingItem.date
        });
        setIsEditingItem(false);
        setEditingItem(null);
    } catch (error) {
        console.error("Error updating item:", error);
        handleFirestoreError(error, OperationType.UPDATE, `gallery/${editingItem.id}`);
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map(i => i.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {items.map((item) => (
                        <SortablePhoto
                          key={item.id}
                          item={item}
                          isAdmin={isAdmin}
                          onDelete={handleDeleteItem}
                          onEdit={(item) => {
                            setEditingItem(item);
                            setIsEditingItem(true);
                          }}
                          onPreview={setSelectedImage}
                        />
                      ))}
                      
                      {items.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                          <ImageIcon size={48} className="mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-500">No photos in this {currentFolderId ? 'folder' : 'category'} yet.</p>
                          {isAdmin && <p className="text-sm text-church-600 mt-2">Click "Add Photo" to upload images.</p>}
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Edit Item Modal */}
        {isEditingItem && editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-900 text-white">
                <h3 className="text-xl font-bold">Edit Photo Details</h3>
                <button onClick={() => setIsEditingItem(false)} className="text-white/70 hover:text-white transition">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
                <div className="flex justify-center mb-4">
                  <img 
                    src={editingItem.imageUrl} 
                    alt="Preview" 
                    className="h-32 w-32 object-cover rounded-lg shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Caption / Title</label>
                  <input 
                    type="text" 
                    required
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 focus:border-transparent outline-none transition"
                    placeholder="Enter photo caption"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={editingItem.date}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 focus:border-transparent outline-none transition"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditingItem(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 bg-church-600 text-white rounded-lg font-bold hover:bg-church-700 transition flex items-center justify-center shadow-md"
                  >
                    <Save size={20} className="mr-2" /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

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
                    disabled={uploading}
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none transition disabled:bg-slate-50"
                    placeholder="e.g. Group Photo"
                    value={itemForm.title}
                    onChange={e => setItemForm({...itemForm, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Upload Photos</label>
                  <div className="mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-church-400 transition-colors relative overflow-hidden">
                    {filePreviews.length > 0 ? (
                      <div className="w-full space-y-4">
                        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2">
                          {filePreviews.map((preview, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => handleRemoveFile(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                disabled={uploading}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="text-center">
                          <label className="cursor-pointer text-sm font-bold text-church-600 hover:text-church-500">
                            Add more photos
                            <input 
                              type="file" 
                              className="sr-only" 
                              multiple
                              accept="image/*"
                              onChange={handleFileChange}
                              disabled={uploading}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                        <div className="flex text-sm text-slate-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-church-600 hover:text-church-500 focus-within:outline-none">
                            <span>Upload files</span>
                            <input 
                              type="file" 
                              className="sr-only" 
                              multiple
                              accept="image/*"
                              onChange={handleFileChange}
                              disabled={uploading}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB each</p>
                      </div>
                    )}
                    
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 z-10">
                        <Loader2 className="animate-spin text-church-600 mb-2" size={32} />
                        <div className="w-full max-w-[200px] bg-slate-200 rounded-full h-2 mb-1">
                          <div 
                            className="bg-church-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs font-bold text-church-700">{Math.round(uploadProgress)}% Uploading...</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input 
                    required
                    type="date"
                    disabled={uploading}
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none transition disabled:bg-slate-50"
                    value={itemForm.date}
                    onChange={e => setItemForm({...itemForm, date: e.target.value})}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button"
                    disabled={uploading}
                    onClick={() => setIsAddingItem(false)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={uploading || (selectedFiles.length === 0 && !itemForm.imageUrl)}
                    className="flex-1 px-4 py-3 bg-church-600 text-white rounded-lg font-bold hover:bg-church-700 transition flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" /> Add Photo
                      </>
                    )}
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
