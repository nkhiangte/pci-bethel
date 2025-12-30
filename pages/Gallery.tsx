
import React, { useState, useEffect } from 'react';
import { GalleryItem } from '../types';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash, X, Image as ImageIcon } from 'lucide-react';

const Gallery: React.FC = () => {
  const { isAdmin } = useAuth();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<GalleryItem>>({});

  const MOCK_IMAGES: GalleryItem[] = Array.from({ length: 9 }).map((_, i) => ({
      id: `mock-${i}`,
      title: i % 2 === 0 ? 'Worship Service' : 'Youth Fellowship',
      imageUrl: `https://picsum.photos/600/600?random=${200+i}`,
      category: i % 3 === 0 ? 'Event' : 'Worship',
      date: '2023-11-20'
  }));

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    if (db && db.collection) {
        try {
            const snapshot = await db.collection('gallery').get();
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
      setForm({
          title: '',
          category: 'Event',
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
         <div className="flex justify-between items-center mb-8">
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
         
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
                <div 
                    key={img.id} 
                    className="aspect-square bg-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition group relative border border-slate-200"
                    onClick={() => setSelectedImage(img)}
                >
                    <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4">
                        <span className="text-white font-bold">{img.title}</span>
                        <span className="text-slate-200 text-xs">{img.category}</span>
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
       </div>

       {/* Add Modal */}
       {isAdding && (
           <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Add New Photo</h3>
                        <button onClick={() => setIsAdding(false)}><X size={20} /></button>
                    </div>
                    <div className="space-y-3">
                        <input className="w-full border p-2 rounded" placeholder="Caption/Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                        <select className="w-full border p-2 rounded" value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}>
                            <option value="Event">Event</option>
                            <option value="Worship">Worship</option>
                            <option value="Outreach">Outreach</option>
                        </select>
                        <input className="w-full border p-2 rounded" placeholder="Image URL (https://...)" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} />
                        <p className="text-xs text-slate-500">Note: Use a direct image link (e.g. from Imgur or Google Photos direct link)</p>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-church-600 text-white rounded">Save</button>
                    </div>
               </div>
           </div>
       )}

       {/* Lightbox */}
       {selectedImage && (
           <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
               <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
                   <img src={selectedImage.imageUrl} alt={selectedImage.title} className="max-w-full max-h-[85vh] rounded shadow-2xl" />
                   <div className="text-white mt-4 text-center">
                       <h3 className="text-xl font-bold">{selectedImage.title}</h3>
                       <p className="text-slate-400 text-sm">{selectedImage.date}</p>
                   </div>
                   <button onClick={() => setSelectedImage(null)} className="absolute top-0 right-0 -mt-10 -mr-4 text-white hover:text-slate-300">
                       <X size={32} />
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};

export default Gallery;
