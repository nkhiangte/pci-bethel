
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GalleryItem } from '../types';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash, X, Image as ImageIcon, Camera } from 'lucide-react';

const Gallery: React.FC = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<GalleryItem>>({});

  const subGalleries = [
    { name: 'Committees', path: '/gallery/committees', category: 'Committees' as const },
    { name: 'Kohhran Chetna', path: '/gallery/kohhran-chetna', category: 'Kohhran Chetna' as const },
    { name: 'Kohhran Hunpui', path: '/gallery/kohhran-hunpui', category: 'Kohhran Hunpui' as const },
  ];

  const MOCK_IMAGES: GalleryItem[] = [
    ...Array.from({ length: 4 }).map((_, i) => ({
      id: `mock-c${i}`, title: `Committee Meeting ${i + 1}`,
      imageUrl: `https://picsum.photos/600/600?random=${200 + i}`,
      category: 'Committees' as const, date: '2024-05-10'
    })),
    ...Array.from({ length: 6 }).map((_, i) => ({
      id: `mock-kc${i}`, title: `Hnatlang - Biak In Tifai ${i + 1}`,
      imageUrl: `https://picsum.photos/600/600?random=${210 + i}`,
      category: 'Kohhran Chetna' as const, date: '2024-04-22'
    })),
    ...Array.from({ length: 5 }).map((_, i) => ({
      id: `mock-kh${i}`, title: `Good Friday Service ${i + 1}`,
      imageUrl: `https://picsum.photos/600/600?random=${220 + i}`,
      category: 'Kohhran Hunpui' as const, date: '2024-03-29'
    })),
  ];

  useEffect(() => {
    // Redirect base /gallery path to the first sub-page
    if (location.pathname === '/gallery' || location.pathname === '/gallery/') {
        navigate(subGalleries[0].path, { replace: true });
    }
  }, [location.pathname, navigate]);
  
  useEffect(() => {
    fetchGallery();
  }, []);

  useEffect(() => {
    // Filter images whenever the main image list or URL path changes
    const currentSubGallery = subGalleries.find(sg => location.pathname.startsWith(sg.path));
    if (currentSubGallery) {
      setFilteredImages(images.filter(img => img.category === currentSubGallery.category));
    } else {
      setFilteredImages([]);
    }
  }, [images, location.pathname]);

  const fetchGallery = async () => {
    if (db && db.collection) {
        try {
            const snapshot = await db.collection('gallery').orderBy('date', 'desc').get();
            if (!snapshot.empty) {
                const fetched = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data()
                })) as GalleryItem[];
                setImages(fetched);
            } else {
                setImages(MOCK_IMAGES);
            }
        } catch (e) {
            setImages(MOCK_IMAGES);
        }
    } else {
        setImages(MOCK_IMAGES);
    }
  };

  const handleAddNew = () => {
      const currentCategory = subGalleries.find(sg => location.pathname.startsWith(sg.path))?.category || 'Committees';
      setForm({
          title: '',
          category: currentCategory,
          imageUrl: '',
          date: new Date().toISOString().split('T')[0]
      });
      setIsAdding(true);
  };

  const handleSave = async () => {
    if (!db || !db.collection) return;
    try {
        await db.collection('gallery').add(form);
        setIsAdding(false);
        fetchGallery();
    } catch (e) {
        alert("Error saving image.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!db || !db.collection) return;
      if (window.confirm("Delete this photo?")) {
          await db.collection('gallery').doc(id).delete();
          fetchGallery();
      }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-serif font-bold text-church-900">Photo Gallery</h1>
            {isAdmin && (
                <button 
                    onClick={handleAddNew}
                    className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm"
                >
                    <Plus size={18} className="mr-2" /> Add Photo
                </button>
            )}
         </div>

         {/* Sub-page Navigation */}
         <div className="flex justify-center border-b border-slate-200 mb-8 bg-white/50 backdrop-blur-sm rounded-t-lg shadow-sm">
           {subGalleries.map(sg => {
              const isActive = location.pathname.startsWith(sg.path);
              return (
              <Link
                key={sg.path}
                to={sg.path}
                className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  isActive ? 'border-church-500 text-church-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {sg.name}
              </Link>
           )})}
         </div>
         
         {filteredImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((img) => (
                    <div 
                        key={img.id} 
                        className="aspect-square bg-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition group relative border border-slate-200"
                        onClick={() => setSelectedImage(img)}
                    >
                        <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4">
                            <span className="text-white font-bold drop-shadow-md">{img.title}</span>
                        </div>
                        {isAdmin && (
                            <button 
                                onClick={(e) => handleDelete(e, img.id)}
                                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-700 z-10"
                            >
                                <Trash size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
         ) : (
            <div className="text-center py-20 bg-white rounded-b-lg shadow-sm border border-slate-100">
                <Camera size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No Photos Yet</h3>
                <p className="text-slate-500">Check back later for photos in this category.</p>
            </div>
         )}
       </div>

       {/* Add Modal */}
       {isAdding && (
           <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Add New Photo</h3>
                        <button onClick={() => setIsAdding(false)}><X size={20} /></button>
                    </div>
                    <div className="space-y-4">
                        <input className="w-full border p-2 rounded" placeholder="Caption/Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                        
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-1 block">Category</label>
                            <select className="w-full border p-2 rounded bg-white" value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}>
                                {subGalleries.map(sg => (
                                    <option key={sg.category} value={sg.category}>{sg.name}</option>
                                ))}
                            </select>
                        </div>

                        <input className="w-full border p-2 rounded" placeholder="Image URL (https://...)" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} />
                        <p className="text-xs text-slate-500">Note: Use a direct image link (e.g. from Imgur or Google Photos direct link)</p>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-church-600 text-white rounded">Save</button>
                    </div>
               </div>
           </div>
       )}

       {/* Lightbox */}
       {selectedImage && (
           <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedImage(null)}>
               <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
                   <img src={selectedImage.imageUrl} alt={selectedImage.title} className="max-w-full max-h-[85vh] rounded shadow-2xl" />
                   <div className="text-white mt-4 text-center">
                       <h3 className="text-xl font-bold">{selectedImage.title}</h3>
                       <p className="text-slate-400 text-sm">{selectedImage.date}</p>
                   </div>
                   <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:text-slate-300">
                       <X size={24} />
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};

export default Gallery;
