
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { Missionary, ServiceHistory } from '../types';
import { 
  Globe, MapPin, Loader, Plus, Edit, Trash, X, Save, 
  ChevronRight, BookOpen, Upload, User, Image as ImageIcon, Calendar, Trash2,
  Move, ZoomIn
} from 'lucide-react';

const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';

const Missionaries: React.FC = () => {
  const { isAdmin } = useAuth();
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // URL Params for Modal Navigation
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  const [selectedMissionary, setSelectedMissionary] = useState<Missionary | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMissionary, setEditingMissionary] = useState<Partial<Missionary>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMissionaries = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
        setMissionaries([]);
        setLoading(false);
        return;
    }

    try {
        const snapshot = await db.collection('missionaries').get();
        if (!snapshot.empty) {
            const data = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })) as Missionary[];
            
            // Sort by seniority (earliest start year first)
            data.sort((a, b) => {
                const getStartYear = (m: Missionary) => {
                    const years: number[] = [];
                    // Check legacy period field
                    if (m.period) {
                        const match = m.period.match(/\d{4}/);
                        if (match) years.push(parseInt(match[0]));
                    }
                    // Check service history
                    if (m.serviceHistory) {
                        m.serviceHistory.forEach(h => {
                            const match = h.period.match(/\d{4}/);
                            if (match) years.push(parseInt(match[0]));
                        });
                    }
                    return years.length > 0 ? Math.min(...years) : 9999;
                };

                const yearA = getStartYear(a);
                const yearB = getStartYear(b);
                
                if (yearA !== yearB) return yearA - yearB;
                return a.name.localeCompare(b.name);
            });

            setMissionaries(data);
        } else {
            setMissionaries([]);
        }
    } catch (error) {
        console.error("Error fetching missionaries:", error);
        setMissionaries([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMissionaries();
  }, [fetchMissionaries]);

  // Sync selected missionary with URL param
  useEffect(() => {
      if (selectedId && missionaries.length > 0) {
          const m = missionaries.find(item => item.id === selectedId);
          if (m) setSelectedMissionary(m);
      } else {
          setSelectedMissionary(null);
      }
  }, [selectedId, missionaries]);

  const openModal = (m: Missionary) => {
      setSearchParams({ id: m.id });
  };

  const closeModal = () => {
      setSearchParams({});
  };

  const handleAddNew = () => {
    setEditingMissionary({
        name: '',
        qualification: '',
        field: '',
        period: '',
        bio: '',
        imageUrl: '',
        serviceHistory: [],
        imagePositionX: 50,
        imagePositionY: 0,
        imageScale: 1
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, m: Missionary) => {
    e.stopPropagation();
    setEditingMissionary({ 
        ...m, 
        serviceHistory: m.serviceHistory || [],
        imagePositionX: m.imagePositionX ?? 50,
        imagePositionY: m.imagePositionY ?? 0,
        imageScale: m.imageScale ?? 1
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!db?.doc || !window.confirm("Are you sure you want to delete this missionary record?")) return;
    
    try {
        await db.collection('missionaries').doc(id).delete();
        fetchMissionaries();
        if (selectedId === id) closeModal();
    } catch (error) {
        console.error("Error deleting:", error);
    }
  };

  const handleAddService = () => {
      const currentHistory = editingMissionary.serviceHistory || [];
      setEditingMissionary({
          ...editingMissionary,
          serviceHistory: [...currentHistory, { field: '', period: '' }]
      });
  };

  const handleServiceChange = (index: number, key: keyof ServiceHistory, value: string) => {
      const currentHistory = [...(editingMissionary.serviceHistory || [])];
      currentHistory[index] = { ...currentHistory[index], [key]: value };
      setEditingMissionary({ ...editingMissionary, serviceHistory: currentHistory });
  };

  const handleRemoveService = (index: number) => {
      const currentHistory = [...(editingMissionary.serviceHistory || [])];
      currentHistory.splice(index, 1);
      setEditingMissionary({ ...editingMissionary, serviceHistory: currentHistory });
  };

  const handleSave = async () => {
    if (!db?.collection) return;
    
    if (!editingMissionary.name) {
        alert("Name is required.");
        return;
    }

    setIsSaving(true);
    try {
        const { id, ...data } = editingMissionary;
        
        if (data.serviceHistory && data.serviceHistory.length > 0) {
            const latest = data.serviceHistory[data.serviceHistory.length - 1];
            data.field = latest.field;
            data.period = latest.period;
        }

        if (id) {
            await db.collection('missionaries').doc(id).set(data, { merge: true });
        } else {
            await db.collection('missionaries').add(data);
        }
        setIsEditModalOpen(false);
        fetchMissionaries();
    } catch (error) {
        console.error("Error saving:", error);
        alert("Failed to save. Please try again.");
    }
    setIsSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST', body: formData,
        });
        const result = await response.json();
        if (result.success) {
            setEditingMissionary(prev => ({ ...prev, imageUrl: result.data.url }));
        } else {
            alert("Image upload failed.");
        }
    } catch (error) {
        alert("Error connecting to image server.");
    } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-church-50 rounded-full text-church-600">
                        <Globe size={40} />
                    </div>
                </div>
                <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">Kan kohhran atanga Krista pasaltha te</h1>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                    "Go into all the world and preach the gospel to all creation." - Mark 16:15
                </p>
                {isAdmin && (
                    <button 
                        onClick={handleAddNew}
                        className="mt-8 inline-flex items-center px-6 py-3 bg-church-600 text-white rounded-full hover:bg-church-700 shadow-lg transition transform hover:-translate-y-1 font-bold text-sm"
                    >
                        <Plus size={18} className="mr-2" /> Add Missionary
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
            ) : missionaries.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {missionaries.map((m) => (
                        <div 
                            key={m.id} 
                            onClick={() => openModal(m)}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full"
                        >
                            <div className="relative h-64 bg-slate-200 overflow-hidden">
                                {m.imageUrl ? (
                                    <img 
                                        src={m.imageUrl} 
                                        alt={m.name} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                        style={{ objectPosition: `${m.imagePositionX ?? 50}% ${m.imagePositionY ?? 0}%` }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-church-50 text-church-300">
                                        <User size={64} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    <h3 className="text-xl font-bold font-serif leading-tight mb-1">{m.name}</h3>
                                    {m.qualification && <p className="text-xs text-church-200 font-medium mb-1 uppercase tracking-wide">{m.qualification}</p>}
                                    <div className="flex flex-col gap-1 text-sm font-medium text-church-200">
                                        <div className="flex items-center">
                                            <MapPin size={14} className="mr-1" /> {m.field || 'Multiple Fields'}
                                        </div>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => handleEdit(e, m)} className="p-2 bg-white/90 text-church-600 rounded-full hover:bg-white"><Edit size={16} /></button>
                                        <button onClick={(e) => handleDelete(e, m.id)} className="p-2 bg-white/90 text-red-600 rounded-full hover:bg-white"><Trash size={16} /></button>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="mb-4">
                                    {m.serviceHistory && m.serviceHistory.length > 0 ? (
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Service History</p>
                                            {m.serviceHistory.slice(0, 2).map((h, i) => (
                                                <div key={i} className="flex justify-between text-xs text-slate-700">
                                                    <span className="font-semibold">{h.field}</span>
                                                    <span className="text-slate-500">{h.period}</span>
                                                </div>
                                            ))}
                                            {m.serviceHistory.length > 2 && (
                                                <p className="text-xs text-church-600 italic">+{m.serviceHistory.length - 2} more</p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Service Period</p>
                                            <p className="text-slate-800 font-medium">{m.period || 'Current'}</p>
                                        </>
                                    )}
                                </div>
                                <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-grow">{m.bio}</p>
                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                                    <span className="text-church-600 text-xs font-black uppercase tracking-widest flex items-center group-hover:underline">
                                        Read Biography <ChevronRight size={14} className="ml-1" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <Globe size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Missionaries Found</h3>
                    <p className="text-slate-500">Records will appear here once added.</p>
                </div>
            )}
        </div>

        {/* View Modal (Biography Theater) */}
        {selectedMissionary && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={closeModal}>
                <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                    <div className="relative h-48 md:h-64 shrink-0 bg-slate-900 overflow-hidden">
                        {selectedMissionary.imageUrl && (
                            <img 
                                src={selectedMissionary.imageUrl} 
                                alt={selectedMissionary.name} 
                                className="w-full h-full object-cover opacity-60" 
                                style={{ 
                                    objectPosition: `${selectedMissionary.imagePositionX ?? 50}% ${selectedMissionary.imagePositionY ?? 0}%`,
                                    transform: `scale(${selectedMissionary.imageScale ?? 1})`
                                }}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        <button onClick={closeModal} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition"><X size={24}/></button>
                        
                        <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 text-white">
                            <span className="inline-block px-3 py-1 bg-church-600 rounded-full text-xs font-bold uppercase tracking-widest mb-3">Missionary</span>
                            <h2 className="text-3xl md:text-5xl font-serif font-black leading-tight mb-2">{selectedMissionary.name}</h2>
                            {selectedMissionary.qualification && (
                                <p className="text-lg text-church-200 font-medium mb-4">{selectedMissionary.qualification}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-6 text-sm md:text-base font-medium text-slate-300">
                                {selectedMissionary.serviceHistory && selectedMissionary.serviceHistory.length > 0 ? (
                                    <span>Served in {selectedMissionary.serviceHistory.length} fields</span>
                                ) : (
                                    <>
                                        <span className="flex items-center"><MapPin size={18} className="mr-2 text-church-400"/> {selectedMissionary.field}</span>
                                        <span className="w-1 h-1 bg-slate-500 rounded-full hidden md:block"></span>
                                        <span>{selectedMissionary.period || 'Serving'}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8 md:p-12 overflow-y-auto bg-white flex-1">
                        <div className="max-w-3xl mx-auto">
                            {/* Service History Table */}
                            {selectedMissionary.serviceHistory && selectedMissionary.serviceHistory.length > 0 && (
                                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center">
                                        <MapPin size={14} className="mr-2"/> Service History
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedMissionary.serviceHistory.map((h, i) => (
                                            <div key={i} className="flex justify-between items-center border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                                <span className="font-serif font-bold text-slate-800">{h.field}</span>
                                                <span className="text-sm text-church-600 font-medium bg-church-50 px-2 py-1 rounded">{h.period}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-px bg-slate-200 flex-1"></div>
                                <BookOpen size={20} className="text-church-600" />
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                            <div 
                                className="prose prose-lg prose-slate max-w-none font-serif leading-relaxed text-slate-700 ql-editor first-letter:text-5xl first-letter:font-bold first-letter:text-church-900 first-letter:mr-1 first-letter:float-left"
                                dangerouslySetInnerHTML={{ __html: selectedMissionary.bio || "Biography details not available." }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                        <h3 className="text-xl font-bold text-slate-800">{editingMissionary.id ? 'Edit Record' : 'Add Missionary'}</h3>
                        <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    
                    <div className="p-6 space-y-5 overflow-y-auto bg-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                                <input className="w-full border p-2.5 rounded-lg" value={editingMissionary.name || ''} onChange={e => setEditingMissionary({...editingMissionary, name: e.target.value})} placeholder="Full Name" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Qualification</label>
                                <input className="w-full border p-2.5 rounded-lg" value={editingMissionary.qualification || ''} onChange={e => setEditingMissionary({...editingMissionary, qualification: e.target.value})} placeholder="e.g. B.Th, M.Div" />
                            </div>
                        </div>
                        
                        {/* Multiple Mission Fields Section */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                                <Globe size={16} className="mr-2"/> Mission Fields & Tenure
                            </label>
                            
                            <div className="space-y-3 mb-3">
                                {(editingMissionary.serviceHistory || []).map((history, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <input 
                                            className="flex-1 border p-2 rounded-lg text-sm" 
                                            placeholder="Field (e.g. Nepal)" 
                                            value={history.field} 
                                            onChange={e => handleServiceChange(index, 'field', e.target.value)}
                                        />
                                        <input 
                                            className="flex-1 border p-2 rounded-lg text-sm" 
                                            placeholder="Period (e.g. 2010-2015)" 
                                            value={history.period} 
                                            onChange={e => handleServiceChange(index, 'period', e.target.value)}
                                        />
                                        <button 
                                            onClick={() => handleRemoveService(index)}
                                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={handleAddService}
                                className="text-xs font-bold text-church-600 flex items-center hover:underline"
                            >
                                <Plus size={14} className="mr-1"/> Add Another Field
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Photo URL</label>
                            <div className="flex gap-2">
                                <input className="w-full border p-2.5 rounded-lg" value={editingMissionary.imageUrl || ''} onChange={e => setEditingMissionary({...editingMissionary, imageUrl: e.target.value})} placeholder="https://..." />
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="px-4 bg-slate-100 border rounded-lg text-slate-600 hover:bg-slate-200">
                                    {uploadingImage ? <Loader className="animate-spin" size={20} /> : <Upload size={20} />}
                                </button>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            <p className="text-xs text-slate-400 mt-1">Upload an image or paste a direct link.</p>
                        </div>

                        {editingMissionary.imageUrl && (
                            <div className="space-y-4 border border-slate-200 p-4 rounded-xl bg-slate-50">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center"><Move size={14} className="mr-1"/> Image Adjustment</label>
                                
                                <div className="h-64 w-full bg-slate-200 rounded-lg overflow-hidden border shadow-inner relative">
                                     <img 
                                        src={editingMissionary.imageUrl} 
                                        alt="Preview" 
                                        className="w-full h-full object-cover transition-all duration-200"
                                        style={{
                                            objectPosition: `${editingMissionary.imagePositionX ?? 50}% ${editingMissionary.imagePositionY ?? 0}%`,
                                            transform: `scale(${editingMissionary.imageScale ?? 1})`
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Pos X ({editingMissionary.imagePositionX ?? 50}%)</label>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={editingMissionary.imagePositionX ?? 50} 
                                            onChange={e => setEditingMissionary({...editingMissionary, imagePositionX: Number(e.target.value)})}
                                            className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-church-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Pos Y ({editingMissionary.imagePositionY ?? 0}%)</label>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={editingMissionary.imagePositionY ?? 0} 
                                            onChange={e => setEditingMissionary({...editingMissionary, imagePositionY: Number(e.target.value)})}
                                            className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-church-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 mb-1 block flex items-center"><ZoomIn size={10} className="mr-1"/> Zoom ({editingMissionary.imageScale ?? 1}x)</label>
                                        <input 
                                            type="range" min="0.1" max="3" step="0.1"
                                            value={editingMissionary.imageScale ?? 1} 
                                            onChange={e => setEditingMissionary({...editingMissionary, imageScale: Number(e.target.value)})}
                                            className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-church-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Biography (Rich Text)</label>
                            <div className="bg-white rounded-xl overflow-hidden border border-slate-300">
                                <ReactQuill 
                                    theme="snow" 
                                    value={editingMissionary.bio || ''} 
                                    onChange={content => setEditingMissionary({...editingMissionary, bio: content})} 
                                    placeholder="Write the missionary's biography here..."
                                    className="h-48"
                                    modules={{
                                        toolbar: [
                                            ['bold', 'italic', 'underline'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                            ['link', 'clean']
                                        ]
                                    }}
                                />
                            </div>
                            <div className="h-10"></div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end space-x-3 rounded-b-2xl">
                        <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-church-600 text-white rounded-xl font-bold hover:bg-church-700 flex items-center shadow-lg shadow-church-200">
                            {isSaving ? <Loader className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18} />} Save Record
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Missionaries;
