
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { Users, MapPin, ChevronDown, ChevronUp, Database, Loader, Plus, Edit, Trash, X, Save, Upload, Trash2, Globe, LocateFixed } from 'lucide-react';

const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';
const BASE_MAP_URL = 'https://www.google.com/maps/d/embed?mid=1Xns6BCmnqrgImcTeDiWKwYGyRqS_zJo';

interface UpaBialData {
  id: string; // e.g., 'bial-1'
  number: number;
  areaDescription: string;
  leader: string;
  members: string[];
  imageUrl?: string;
  // New fields for Map Linking
  mapLat?: string;
  mapLng?: string;
  mapZoom?: string;
}

// Hardcoded map to ensure images show up even if not present in the database fetch
const BIAL_IMAGES: Record<number, string> = {
  1: 'https://i.ibb.co/FL6dnZN1/Upa-Hminga.jpg',
  2: 'https://i.ibb.co/fYQGQ3mW/Ruata.jpg',
  3: 'https://i.ibb.co/b5TcDF1y/Upa-Tehluna.jpg',
  6: 'https://i.ibb.co/fV4FY94Y/Upa-Dav.jpg',
  8: 'https://i.ibb.co/7tsDcQDk/Upa-Zaia.jpg',
  9: 'https://i.ibb.co/Gvq96sxK/T-Upa-Hminga.jpg',
  10: 'https://i.ibb.co/1fsM0n5b/Upa-Liana.jpg',
  11: 'https://i.ibb.co/S4FMThT1/Upa-Sawma.jpg',
  12: 'https://i.ibb.co/v4wDgNKq/Upa-Zoa.jpg'
};

const INITIAL_BIAL_DATA: UpaBialData[] = [
  {
    id: 'bial-1',
    number: 1,
    areaDescription: 'Venglai Kawng phei chung lam zawng leh DC Complex hlui zawng',
    leader: 'Upa PC Lalhmingliana',
    members: ['Pu C Lalrawngbawla', 'Pu Lalmuanpuia'],
    imageUrl: BIAL_IMAGES[1]
  },
  {
    id: 'bial-2',
    number: 2,
    areaDescription: 'MJA Building leh BSI Building atangin Pu K Lalrawna In thlengin chhuah lam zawng',
    leader: 'Upa Lalremruata',
    members: ['Pu C Rohmingliana', 'Pu JC Laldinthara'],
    imageUrl: BIAL_IMAGES[2]
  },
  {
    id: 'bial-3',
    number: 3,
    areaDescription: 'Upa PC Lalhmingliana In atangin kawngui dung zelah Pu L Khenpauva In huamin Biak In leh Soil Comlex huamin chhuah lam zawng',
    leader: 'Upa R Lalramhluna',
    members: ['Pu Thanglianmanga', 'Pu H Lalzuitluanga'],
    imageUrl: BIAL_IMAGES[3]
  },
  {
    id: 'bial-4',
    number: 4,
    areaDescription: 'Pi Suneihi In atangin Pi SR Lalrintluangi In thleng',
    leader: 'T Upa V Kaizasiama',
    members: ['Pu Dawngsuanpauva', 'Pu B Zelkhangova']
  },
  {
    id: 'bial-5',
    number: 5,
    areaDescription: 'Pu C Roliana In atangin Upa HT Vanlalsawma in bul step thlengin, Pu Buka tuikhur bul leh a chung lam huamin, kawngpui tlak lam zawng',
    leader: 'T Upa C Lalthazuala',
    members: ['Pu Thangkunga Hualngo', 'Pu Lalhmingmawia']
  },
  {
    id: 'bial-6',
    number: 6,
    areaDescription: 'Pu K Zakima In bul step-ah chhuk thlain, Pu Salmanga tuikhur suin, Zion Veng ramri thleng',
    leader: 'Upa David Lalchhanhima',
    members: ['Pu Kapthuama', 'Pu Thangdeihchina'],
    imageUrl: BIAL_IMAGES[6]
  },
  {
    id: 'bial-7',
    number: 7,
    areaDescription: 'Pu B Lalliantawna In atangin Pu PC Thanhluma in bul step suin a inkar zawng',
    leader: 'Upa HT Lalthlengliana',
    members: ['Pu MS Dawnga', 'Pu F Lalhriatpuia']
  },
  {
    id: 'bial-8',
    number: 8,
    areaDescription: 'PWD Complex zawng leh Upa HT Vanlalsawma In atangin Pu JC Laldinthara Inah kualin Pu TC Vanlalchuana In/Pu Buka tuikhur thlengin',
    leader: 'Upa H Zairemmawia',
    members: ['Pu Nelson Khiangte', 'Pu C Lalengmawia'],
    imageUrl: BIAL_IMAGES[8]
  },
  {
    id: 'bial-9',
    number: 9,
    areaDescription: 'Upa R Lalramhluna In atangin Chhura hmun mual zawng',
    leader: 'Upa Hmingthanmawia Sailo',
    members: ['Pu K Lalengthanga', 'Pu T Sangtluanga', 'Pu Khawlrosiama'],
    imageUrl: BIAL_IMAGES[9]
  },
  {
    id: 'bial-10',
    number: 10,
    areaDescription: 'Chhura hmun peng atangin kawngpui dungah Vengthar ramri thlengin, Mualnuam mual huamin tlak lam zawng',
    leader: 'Upa Lianpianga',
    members: ['Pu Lalramthara', 'Pu Lalramnghakhlela', 'Pu K Lalengkima'],
    imageUrl: BIAL_IMAGES[10]
  },
  {
    id: 'bial-11',
    number: 11,
    areaDescription: 'Pu PC Thanhluma In atangin Kohhran ram huamin, Vengthar ramri su in kawngpui dung chhuah lam zawng',
    leader: 'Upa HT Vanlalsawma',
    members: ['Pu Keneth Lalthanzauva', 'Pu PC Zoramthanga'],
    imageUrl: BIAL_IMAGES[11]
  },
  {
    id: 'bial-12',
    number: 12,
    areaDescription: 'Pu T Sawmpauva In bul step atangin Pu Salmanga tuikhur suin chhuah lam mual zawng',
    leader: 'Upa C Zohmingthanga',
    members: ['Pu C Malsawmdawngliana', 'Pu Lalthanghulha'],
    imageUrl: BIAL_IMAGES[12]
  },
  {
    id: 'bial-13',
    number: 13,
    areaDescription: 'Pi Lalrinzami (L) In huamin Pu Zamsianthanga In atangin Pu Pauzathanga In thleng',
    leader: 'T Upa Hmingthansanga',
    members: ['Pu Lalsanglura Zote', 'Pu Mungngaihsanga']
  }
];

const UpaBial: React.FC = () => {
  const { isAdmin } = useAuth();
  const [bials, setBials] = useState<UpaBialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [currentMapUrl, setCurrentMapUrl] = useState(BASE_MAP_URL);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBial, setEditingBial] = useState<Partial<UpaBialData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const fetchBials = async () => {
    setLoading(true);
    if (!db || !db.collection) {
      setBials(INITIAL_BIAL_DATA);
      setLoading(false);
      return;
    }

    try {
      const snapshot = await db.collection('upaBials').get();
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        })) as UpaBialData[];
        fetchedData.sort((a, b) => a.number - b.number);
        setBials(fetchedData);
      } else {
        setBials(INITIAL_BIAL_DATA);
      }
    } catch (error) {
      console.error("Error fetching Upa Bial data:", error);
      setBials(INITIAL_BIAL_DATA);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBials();
  }, []);

  const handleSeedData = async () => {
    if (!db || !db.collection || !window.confirm("Overwrite Upa Bial data in Firebase?")) return;
    setIsSeeding(true);
    try {
      const batch = db.batch();
      const ref = db.collection('upaBials');
      
      const snapshot = await ref.get();
      snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));

      INITIAL_BIAL_DATA.forEach(item => {
        const doc = ref.doc(item.id);
        batch.set(doc, item);
      });
      await batch.commit();
      alert("Data seeded successfully!");
      fetchBials();
    } catch (e) {
      console.error("Error seeding:", e);
      alert("Failed to seed data.");
    }
    setIsSeeding(false);
  };

  const handleAddNew = () => {
    setEditingBial({
        number: (bials.length > 0 ? Math.max(...bials.map(b => b.number)) + 1 : 1),
        leader: '',
        areaDescription: '',
        members: [],
        imageUrl: '',
        mapLat: '',
        mapLng: '',
        mapZoom: '18'
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, bial: UpaBialData) => {
    e.stopPropagation();
    setEditingBial({ ...bial });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!db?.doc || !window.confirm("Delete this Bial record?")) return;
    try {
        await db.collection('upaBials').doc(id).delete();
        fetchBials();
    } catch (error) {
        console.error("Error deleting:", error);
    }
  };

  const handleSave = async () => {
    if (!db?.collection) return;
    setIsSaving(true);
    try {
        const { id, ...data } = editingBial;
        // Clean members array (remove empty strings)
        data.members = (data.members || []).filter(m => m.trim() !== '');

        if (id) {
            await db.collection('upaBials').doc(id).set(data, { merge: true });
        } else {
            await db.collection('upaBials').add(data);
        }
        setIsEditModalOpen(false);
        fetchBials();
    } catch (error) {
        console.error("Error saving:", error);
        alert("Failed to save.");
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
            setEditingBial(prev => ({ ...prev, imageUrl: result.data.url }));
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

  const handleAddMember = () => {
      setEditingBial(prev => ({
          ...prev,
          members: [...(prev.members || []), '']
      }));
  };

  const handleMemberChange = (index: number, value: string) => {
      const newMembers = [...(editingBial.members || [])];
      newMembers[index] = value;
      setEditingBial(prev => ({ ...prev, members: newMembers }));
  };

  const handleRemoveMember = (index: number) => {
      const newMembers = [...(editingBial.members || [])];
      newMembers.splice(index, 1);
      setEditingBial(prev => ({ ...prev, members: newMembers }));
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
        // Collapsing
        setExpandedId(null);
        setCurrentMapUrl(BASE_MAP_URL);
    } else {
        // Expanding
        setExpandedId(id);
        const selectedBial = bials.find(b => b.id === id);
        
        // Update map URL if coordinates exist
        if (selectedBial && selectedBial.mapLat && selectedBial.mapLng) {
            const zoom = selectedBial.mapZoom || '18';
            setCurrentMapUrl(`${BASE_MAP_URL}&ll=${selectedBial.mapLat},${selectedBial.mapLng}&z=${zoom}`);
            
            // Only scroll on mobile, on desktop the map is sticky
            if (window.innerWidth < 1024 && mapContainerRef.current) {
                mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            setCurrentMapUrl(BASE_MAP_URL);
        }
    }
  };

  const handleLocateOnMap = (e: React.MouseEvent, bial: UpaBialData) => {
      e.stopPropagation();
      setExpandedId(bial.id);
      if (bial.mapLat && bial.mapLng) {
          const zoom = bial.mapZoom || '18';
          setCurrentMapUrl(`${BASE_MAP_URL}&ll=${bial.mapLat},${bial.mapLng}&z=${zoom}`);
      } else {
          setCurrentMapUrl(BASE_MAP_URL);
          alert("Coordinates not set for this Bial yet.");
      }
      
      // Scroll map into view on mobile
      if (window.innerWidth < 1024 && mapContainerRef.current) {
          mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-church-900 text-white py-12 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-serif font-bold mb-4">Kohhran Upa Bialte</h1>
            <p className="max-w-2xl mx-auto text-church-200">Pastoral Care Districts and Leaders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* List Column */}
            <div className="w-full lg:w-1/3 order-2 lg:order-1">
                {isAdmin && (
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        <button 
                        onClick={handleAddNew}
                        className="inline-flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm transition text-sm font-bold"
                        >
                        <Plus size={16} className="mr-2" /> New Bial
                        </button>
                        <button 
                        onClick={handleSeedData} 
                        disabled={isSeeding}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 text-sm font-bold"
                        >
                        {isSeeding ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Database size={16} className="mr-2" />}
                        Seed
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
                ) : (
                    <div className="space-y-4">
                        {bials.map((bial) => {
                        const isExpanded = expandedId === bial.id;
                        const displayImage = bial.imageUrl || BIAL_IMAGES[bial.number];
                        
                        return (
                            <div key={bial.id} className={`bg-white rounded-xl border transition-all duration-300 ${isExpanded ? 'shadow-lg border-church-500 ring-1 ring-church-200' : 'shadow-sm border-slate-200 hover:shadow-md'}`}>
                                <button 
                                    onClick={() => toggleExpand(bial.id)}
                                    className="w-full text-left p-4 flex justify-between items-center group relative overflow-hidden"
                                >
                                    {isExpanded && <div className="absolute left-0 top-0 bottom-0 w-1 bg-church-500"></div>}
                                    <div className="flex items-center gap-4 pl-2">
                                    {displayImage ? (
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm shrink-0">
                                        <img 
                                            src={displayImage} 
                                            alt={`Upa Bial ${bial.number}`} 
                                            className="w-full h-full object-cover"
                                        />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-church-50 text-church-600 flex items-center justify-center font-bold text-lg shadow-sm border border-church-100 shrink-0">
                                        {bial.number}
                                        </div>
                                    )}
                                    
                                    <div>
                                        <h3 className={`font-bold text-lg transition-colors ${isExpanded ? 'text-church-700' : 'text-slate-800'}`}>BIAL - {bial.number}</h3>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{bial.leader}</p>
                                    </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {/* Quick Map Action */}
                                        <div 
                                            role="button"
                                            onClick={(e) => handleLocateOnMap(e, bial)}
                                            className={`p-2 rounded-full transition ${isExpanded ? 'text-church-600 bg-church-50' : 'text-slate-300 hover:text-church-500 hover:bg-slate-50'}`}
                                            title="Show on Map"
                                        >
                                            <LocateFixed size={20} />
                                        </div>

                                        {isAdmin && (
                                            <div className="flex gap-1 mr-1">
                                                <span onClick={(e) => handleEdit(e, bial)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full transition"><Edit size={16} /></span>
                                                <span onClick={(e) => handleDelete(e, bial.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full transition"><Trash size={16} /></span>
                                            </div>
                                        )}
                                        <div className="text-slate-300">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200 bg-slate-50/30 rounded-b-xl">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                                                    <MapPin size={12} className="mr-1" /> Huam Chhung (Area)
                                                </h4>
                                                <p className="text-slate-700 text-sm leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                    {bial.areaDescription}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                                                    <Users size={12} className="mr-1" /> Bialtu Dangte
                                                </h4>
                                                <ul className="space-y-1">
                                                    {bial.members.map((member, idx) => (
                                                    <li key={idx} className="flex items-center text-xs font-bold text-slate-600 bg-white px-3 py-2 rounded border border-slate-200">
                                                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] mr-2">{idx + 1}</span>
                                                        {member}
                                                    </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                        })}
                    </div>
                )}
            </div>

            {/* Map Column (Sticky on Desktop) */}
            <div className="w-full lg:w-2/3 order-1 lg:order-2 h-[500px] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24">
                <div ref={mapContainerRef} className="w-full h-full bg-white rounded-2xl shadow-xl border-4 border-white overflow-hidden relative group">
                    <iframe 
                        src={currentMapUrl} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }}
                        title="Upa Bial Map"
                        loading="lazy"
                        className="transition-opacity duration-500 w-full h-full"
                    ></iframe>
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg text-xs font-bold text-slate-700 shadow-md pointer-events-none border border-slate-200 z-10 flex items-center gap-2">
                        <Globe size={14} className="text-church-600" />
                        {expandedId ? `Viewing Bial ${bials.find(b => b.id === expandedId)?.number}` : 'Interactive Map'}
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-slate-800">{editingBial.id ? 'Edit Bial' : 'Add New Bial'}</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-5 overflow-y-auto bg-white">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Bial No</label>
                            <input 
                                type="number"
                                className="w-full border p-2.5 rounded-lg text-center font-bold" 
                                value={editingBial.number || ''} 
                                onChange={e => setEditingBial({...editingBial, number: parseInt(e.target.value)})} 
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Leader Name</label>
                            <input 
                                className="w-full border p-2.5 rounded-lg" 
                                value={editingBial.leader || ''} 
                                onChange={e => setEditingBial({...editingBial, leader: e.target.value})} 
                                placeholder="Upa Name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Area Description</label>
                        <textarea 
                            className="w-full border p-2.5 rounded-lg h-24" 
                            value={editingBial.areaDescription || ''} 
                            onChange={e => setEditingBial({...editingBial, areaDescription: e.target.value})} 
                            placeholder="Describe the area..."
                        />
                    </div>

                    {/* Map Linking Section */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center">
                            <Globe size={16} className="mr-1"/> Map Coordinates
                        </label>
                        <p className="text-xs text-blue-600 mb-3">
                            Enter the Latitude and Longitude to focus the map when this card is expanded.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Latitude</label>
                                <input className="w-full border p-2 rounded text-sm" value={editingBial.mapLat || ''} onChange={e => setEditingBial({...editingBial, mapLat: e.target.value})} placeholder="e.g. 23.4758" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Longitude</label>
                                <input className="w-full border p-2 rounded text-sm" value={editingBial.mapLng || ''} onChange={e => setEditingBial({...editingBial, mapLng: e.target.value})} placeholder="e.g. 93.3294" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Zoom</label>
                                <input type="number" className="w-full border p-2 rounded text-sm" value={editingBial.mapZoom || '18'} onChange={e => setEditingBial({...editingBial, mapZoom: e.target.value})} placeholder="18" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Leader Photo</label>
                        <div className="flex gap-2">
                            <input className="w-full border p-2.5 rounded-lg" value={editingBial.imageUrl || ''} onChange={e => setEditingBial({...editingBial, imageUrl: e.target.value})} placeholder="https://..." />
                            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="px-4 bg-slate-100 border rounded-lg text-slate-600 hover:bg-slate-200">
                                {uploadingImage ? <Loader className="animate-spin" size={20} /> : <Upload size={20} />}
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                        <p className="text-xs text-slate-400 mt-1">Upload an image or paste a direct link. If empty, it uses the hardcoded default.</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
                            <span>Assistant Members</span>
                            <button onClick={handleAddMember} className="text-xs text-church-600 flex items-center hover:underline"><Plus size={12} className="mr-1"/> Add Member</button>
                        </label>
                        <div className="space-y-2">
                            {(editingBial.members || []).map((member, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <span className="text-xs font-bold text-slate-400 w-4">{index + 1}.</span>
                                    <input 
                                        className="flex-1 border p-2 rounded-lg text-sm" 
                                        value={member} 
                                        onChange={e => handleMemberChange(index, e.target.value)}
                                        placeholder="Member Name"
                                    />
                                    <button onClick={() => handleRemoveMember(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            ))}
                            {(editingBial.members || []).length === 0 && <p className="text-sm text-slate-400 italic">No assistant members added.</p>}
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t flex justify-end space-x-3 rounded-b-2xl">
                    <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-church-600 text-white rounded-xl font-bold hover:bg-church-700 flex items-center shadow-lg shadow-church-200">
                        {isSaving ? <Loader className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18} />} Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UpaBial;
