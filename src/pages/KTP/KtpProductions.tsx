import React, { useState, useEffect, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ProductionItem, ProductionFolder } from '../../types';
import { db, storage, handleFirestoreError, OperationType } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
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
  GripVertical,
  Edit2,
  Play,
  FileText,
  FolderPlus,
  Type
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
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ReactQuill = React.lazy(() => import('react-quill-new'));
import 'react-quill-new/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet',
  'link'
];

const getYouTubeId = (url: string | undefined) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

interface SortableProductionItemProps {
  item: ProductionItem;
  isAdmin: boolean;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onEdit: (item: ProductionItem) => void;
  onPreview: (item: ProductionItem) => void;
}

const SortableProductionItem: React.FC<SortableProductionItemProps> = ({ item, isAdmin, onDelete, onEdit, onPreview }) => {
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

  const videoId = item.videoUrl ? getYouTubeId(item.videoUrl) : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : item.imageUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-100"
    >
      <div 
        className="aspect-video overflow-hidden cursor-pointer relative bg-slate-50 flex items-center justify-center"
        onClick={() => onPreview(item)}
      >
        {item.type === 'text' ? (
          <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-church-600 transition-colors">
            <FileText size={48} className="mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider">Document</span>
          </div>
        ) : (
          <>
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300">
                <ImageIcon size={48} />
              </div>
            )}
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={24} className="text-church-600 ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="p-4 flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 truncate">{item.title}</h4>
          <div className="flex items-center text-xs text-slate-500 mt-1">
            <Calendar size={12} className="mr-1" />
            {item.date}
          </div>
        </div>
        {isAdmin && (
          <div 
            {...attributes} 
            {...listeners}
            className="p-2 text-slate-400 hover:text-church-600 cursor-grab active:cursor-grabbing bg-slate-50 rounded-lg hover:bg-church-50 transition-colors ml-2"
            title="Drag to reorder"
          >
            <GripVertical size={20} />
          </div>
        )}
      </div>
      
      {isAdmin && (
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="p-2 bg-white/90 text-church-600 rounded-full shadow-md hover:bg-church-50 transition"
            title="Edit Details"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(item.id, e); }}
            className="p-2 bg-white/90 text-red-500 rounded-full shadow-md hover:bg-red-50 transition"
            title="Delete Item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const KtpProductions: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentCategory = 'KTP Productions';
  
  // Parse URL: /ktp/productions/:folderId?
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentFolderId = pathParts[2];
  
  const [folders, setFolders] = useState<ProductionFolder[]>([]);
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<ProductionFolder | null>(null);
  const [parentFolders, setParentFolders] = useState<ProductionFolder[]>([]);
  
  // Modal states
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemType, setItemType] = useState<'image' | 'video' | 'text'>('image');
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductionItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const [folderForm, setFolderForm] = useState<Partial<ProductionFolder>>({ name: '', date: new Date().toISOString().split('T')[0] });
  const [itemForm, setItemForm] = useState<Partial<ProductionItem>>({ 
    title: '', 
    imageUrl: '', 
    videoUrl: '', 
    content: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [selectedItem, setSelectedItem] = useState<ProductionItem | null>(null);

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

  React.useEffect(() => {
    setLoading(true);
    
    // Fetch folders
    const unsubscribeFolders = db.collection('production_folders')
        .where('category', '==', currentCategory)
        .onSnapshot((snapshot: any) => {
            const folderData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            folderData.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
            setFolders(folderData);
            
            if (currentFolderId) {
                const folder = folderData.find((f: any) => f.id === currentFolderId);
                setCurrentFolder(folder || null);
                
                // Build breadcrumbs
                const parents: ProductionFolder[] = [];
                let current = folder;
                while (current && current.parentId) {
                  const parent = folderData.find((f: any) => f.id === current.parentId);
                  if (parent) {
                    parents.unshift(parent);
                    current = parent;
                  } else {
                    break;
                  }
                }
                setParentFolders(parents);
            } else {
                setCurrentFolder(null);
                setParentFolders([]);
            }
        }, (error: any) => {
            handleFirestoreError(error, OperationType.GET, 'production_folders');
            setLoading(false);
        });

    // Fetch items
    const unsubscribeItems = db.collection('productions')
        .where('category', '==', currentCategory)
        .onSnapshot((snapshot: any) => {
            const itemData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            
            const filteredItems = itemData.filter((item: any) => 
                (item.folderId || null) === (currentFolderId || null)
            );
            
            const sortedItems = [...filteredItems].sort((a: any, b: any) => {
                const orderA = a.order !== undefined ? a.order : 999999;
                const orderB = b.order !== undefined ? b.order : 999999;
                if (orderA !== orderB) return orderA - orderB;
                return (b.date || '').localeCompare(a.date || '');
            });
            
            setItems(sortedItems);
            setLoading(false);
        }, (error: any) => {
            handleFirestoreError(error, OperationType.GET, 'productions');
            setLoading(false);
        });

    return () => {
        unsubscribeFolders();
        unsubscribeItems();
    };
  }, [currentFolderId]);

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.name) return;
    
    try {
        await db.collection('production_folders').add({
            ...folderForm,
            category: currentCategory,
            parentId: currentFolderId || null
        });
        setIsAddingFolder(false);
        setFolderForm({ name: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'production_folders');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.title) return;
    
    setUploading(true);
    setUploadProgress(0);

    try {
        let finalImageUrl = itemForm.imageUrl || '';

        if (itemType === 'image' && selectedFile) {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const storagePath = `productions/${fileName}`;
            const storageRef = storage.ref().child(storagePath);
            
            const uploadTask = storageRef.put(selectedFile);
            
            finalImageUrl = await new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (error) => reject(error),
                    async () => {
                        const url = await uploadTask.snapshot.ref.getDownloadURL();
                        resolve(url);
                    }
                );
            });
        }

        await db.collection('productions').add({
            title: itemForm.title,
            type: itemType,
            date: itemForm.date,
            imageUrl: itemType === 'image' ? finalImageUrl : null,
            videoUrl: itemType === 'video' ? itemForm.videoUrl : null,
            content: itemType === 'text' ? itemForm.content : null,
            category: currentCategory,
            folderId: currentFolderId || null,
            order: items.length
        });

        setIsAddingItem(false);
        setItemForm({ title: '', imageUrl: '', videoUrl: '', content: '', date: new Date().toISOString().split('T')[0] });
        setSelectedFile(null);
        setFilePreview(null);
        setUploadProgress(0);
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'productions');
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
      try {
        const batch = db.batch();
        newItems.forEach((item, index) => {
          const ref = db.collection('productions').doc(item.id);
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
        await db.collection('productions').doc(editingItem.id).update({
            title: editingItem.title,
            date: editingItem.date,
            videoUrl: editingItem.type === 'video' ? editingItem.videoUrl : null,
            content: editingItem.type === 'text' ? editingItem.content : null,
        });
        setIsEditingItem(false);
        setEditingItem(null);
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `productions/${editingItem.id}`);
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this folder and all its contents?")) return;
    
    try {
        const itemsSnapshot = await db.collection('productions').where('folderId', '==', id).get();
        const batch = db.batch();
        itemsSnapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
        await batch.commit();
        
        await db.collection('production_folders').doc(id).delete();
        if (currentFolderId === id) navigate(`/ktp/productions`);
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `production_folders/${id}`);
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this item?")) return;
    try {
        await db.collection('productions').doc(id).delete();
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `productions/${id}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 animate-in fade-in duration-300 overflow-hidden">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Link to="/ktp/productions" className="hover:text-church-600 transition">Productions</Link>
          {parentFolders.map((pf) => (
            <React.Fragment key={pf.id}>
              <ChevronRight size={14} className="text-slate-400" />
              <Link to={`/ktp/productions/${pf.id}`} className="hover:text-church-600 transition">
                {pf.name}
              </Link>
            </React.Fragment>
          ))}
          {currentFolder && (
            <>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="font-bold text-church-700">{currentFolder.name}</span>
            </>
          )}
        </div>
        
        {currentFolderId && (
          <button 
            onClick={() => navigate(currentFolder?.parentId ? `/ktp/productions/${currentFolder.parentId}` : '/ktp/productions')}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-church-600 transition"
          >
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {currentFolder ? currentFolder.name : 'Productions'}
          </h2>
          
          {isAdmin && (
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsAddingFolder(true)}
                className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 transition shadow-sm text-sm"
              >
                <FolderPlus size={18} className="mr-2" /> New Folder
              </button>
              <button 
                onClick={() => {
                  setItemType('image');
                  setIsAddingItem(true);
                }}
                className="flex items-center px-4 py-2 bg-white text-church-600 border border-church-200 rounded-lg hover:bg-church-50 transition shadow-sm text-sm"
              >
                <Plus size={18} className="mr-2" /> Add Content
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-church-600 mb-4" size={48} />
            <p className="text-slate-500">Loading productions...</p>
          </div>
        ) : (
          <>
            {/* Folders */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
              {folders.filter(f => (f.parentId || null) === (currentFolderId || null)).map((folder) => (
                <Link 
                  key={folder.id}
                  to={`/ktp/productions/${folder.id}`}
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
              
              {folders.filter(f => (f.parentId || null) === (currentFolderId || null)).length === 0 && !currentFolderId && (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Folder size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No folders created yet.</p>
                  {isAdmin && <p className="text-sm text-church-600 mt-2">Click "New Folder" to get started.</p>}
                </div>
              )}
            </div>

            {/* Items */}
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
                    <SortableProductionItem
                      key={item.id}
                      item={item}
                      isAdmin={isAdmin}
                      onDelete={handleDeleteItem}
                      onEdit={(item) => {
                        setEditingItem(item);
                        setIsEditingItem(true);
                      }}
                      onPreview={setSelectedItem}
                    />
                  ))}
                  
                  {items.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">No content in this folder.</p>
                      {isAdmin && <p className="text-sm text-church-600 mt-2">Click "Add Content" to upload.</p>}
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Preview Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">{selectedItem.title}</h3>
                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-200 rounded-full transition">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {selectedItem.type === 'image' && selectedItem.imageUrl && (
                  <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-auto rounded-lg shadow-lg" referrerPolicy="no-referrer" />
                )}
                {selectedItem.type === 'video' && selectedItem.videoUrl && (
                  <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg bg-black">
                    <iframe 
                      src={`https://www.youtube.com/embed/${getYouTubeId(selectedItem.videoUrl)}`}
                      className="w-full h-full"
                      allowFullScreen
                      title={selectedItem.title}
                    />
                  </div>
                )}
                {selectedItem.type === 'text' && selectedItem.content && (
                  <div className="prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: selectedItem.content }} />
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t text-xs text-slate-500 flex items-center">
                <Calendar size={14} className="mr-1" /> {selectedItem.date}
              </div>
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
                    value={folderForm.name}
                    onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 outline-none transition"
                    placeholder="e.g. Drama 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input 
                    required
                    type="date" 
                    value={folderForm.date}
                    onChange={(e) => setFolderForm({ ...folderForm, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 outline-none transition"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingFolder(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 bg-church-600 text-white rounded-lg font-bold hover:bg-church-700 transition flex items-center justify-center shadow-md"
                  >
                    <Save size={20} className="mr-2" /> Create Folder
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-900 text-white">
                <h3 className="text-xl font-bold">Add New Content</h3>
                <button onClick={() => setIsAddingItem(false)} className="text-white/70 hover:text-white transition">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex border-b border-slate-100">
                <button 
                  onClick={() => setItemType('image')}
                  className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition-colors ${itemType === 'image' ? 'bg-church-50 text-church-700 border-b-2 border-church-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <ImageIcon size={18} className="mr-2" /> Image
                </button>
                <button 
                  onClick={() => setItemType('video')}
                  className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition-colors ${itemType === 'video' ? 'bg-church-50 text-church-700 border-b-2 border-church-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Play size={18} className="mr-2" /> Video
                </button>
                <button 
                  onClick={() => setItemType('text')}
                  className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition-colors ${itemType === 'text' ? 'bg-church-50 text-church-700 border-b-2 border-church-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Type size={18} className="mr-2" /> Text
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                  <input 
                    required
                    type="text" 
                    value={itemForm.title}
                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 outline-none transition"
                    placeholder="Enter title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input 
                    required
                    type="date" 
                    value={itemForm.date}
                    onChange={(e) => setItemForm({ ...itemForm, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 outline-none transition"
                  />
                </div>

                {itemType === 'image' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/50">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="h-full w-full object-contain p-2" />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 text-slate-400 mb-3" />
                            <p className="text-sm text-slate-500">Click to upload image</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">or</span></div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Image URL</label>
                      <input 
                        type="url" 
                        value={itemForm.imageUrl}
                        onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 outline-none transition"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}

                {itemType === 'video' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">YouTube Video URL</label>
                    <input 
                      required
                      type="url" 
                      value={itemForm.videoUrl}
                      onChange={(e) => setItemForm({ ...itemForm, videoUrl: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 outline-none transition"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                )}

                {itemType === 'text' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Content</label>
                    <div className="bg-white rounded-lg overflow-hidden border border-slate-300 min-h-[200px]">
                      <Suspense fallback={<div className="p-4 text-slate-400">Loading editor...</div>}>
                        <ReactQuill 
                          theme="snow"
                          value={itemForm.content}
                          onChange={(val) => setItemForm({ ...itemForm, content: val })}
                          modules={quillModules}
                          formats={quillFormats}
                          className="h-full"
                        />
                      </Suspense>
                    </div>
                  </div>
                )}

                {uploading && (
                  <div className="pt-4">
                    <div className="flex justify-between text-xs font-bold text-church-600 mb-1 uppercase tracking-wider">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className="bg-church-600 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button"
                    disabled={uploading}
                    onClick={() => setIsAddingItem(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-3 bg-church-600 text-white rounded-lg font-bold hover:bg-church-700 transition flex items-center justify-center shadow-md disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save size={20} className="mr-2" />}
                    Save Content
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Item Modal */}
        {isEditingItem && editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-900 text-white">
                <h3 className="text-xl font-bold">Edit Content</h3>
                <button onClick={() => setIsEditingItem(false)} className="text-white/70 hover:text-white transition">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleUpdateItem} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                  <input 
                    required
                    type="text" 
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input 
                    required
                    type="date" 
                    value={editingItem.date}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 outline-none transition"
                  />
                </div>

                {editingItem.type === 'video' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">YouTube Video URL</label>
                    <input 
                      required
                      type="url" 
                      value={editingItem.videoUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, videoUrl: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 outline-none transition"
                    />
                  </div>
                )}

                {editingItem.type === 'text' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Content</label>
                    <div className="bg-white rounded-lg overflow-hidden border border-slate-300 min-h-[200px]">
                      <Suspense fallback={<div className="p-4 text-slate-400">Loading editor...</div>}>
                        <ReactQuill 
                          theme="snow"
                          value={editingItem.content || ''}
                          onChange={(val) => setEditingItem({ ...editingItem, content: val })}
                          modules={quillModules}
                          formats={quillFormats}
                          className="h-full"
                        />
                      </Suspense>
                    </div>
                  </div>
                )}

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
      </AnimatePresence>
    </div>
  );
};

export default KtpProductions;
