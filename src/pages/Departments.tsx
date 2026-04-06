import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  BookOpen, DollarSign, Globe, Home, Users, Coffee, Heart, Music, 
  Smile, Library, Book, Box, Newspaper, FileText, UserPlus, Clock, 
  ClipboardCheck, Handshake, ChevronDown, ChevronUp, Search, Loader, 
  AlertTriangle, Phone, Plus, Edit, Trash, Save, X, Database, ArrowUp, ArrowDown,
  ChevronRight,
  Upload, Download, File, FileSpreadsheet, Trash2, BarChart2, Image as ImageIcon,
  Camera
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { db, storage, handleFirestoreError, OperationType } from '../services/firebase';
import { Committee, CommitteeMember, CommitteeImage } from '../types';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommitteeReport {
  id: string;
  name: string;           // e.g. "Annual Report 2024"
  type: 'yearly' | 'monthly';
  year: number;           // e.g. 2024
  month?: number;         // 1–12, only for monthly
  fileUrl: string;        // download / embed URL
  fileType: 'pdf' | 'excel';
  uploadedAt: string;     // ISO date string
  uploadedBy?: string;
}

// ─── Icon maps (unchanged) ───────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  'BookOpen': BookOpen, 'DollarSign': DollarSign, 'Globe': Globe,
  'Home': Home, 'Users': Users, 'Coffee': Coffee, 'Heart': Heart,
  'Music': Music, 'Smile': Smile, 'Library': Library, 'Book': Book,
  'Box': Box, 'Newspaper': Newspaper, 'FileText': FileText,
  'UserPlus': UserPlus, 'Clock': Clock, 'ClipboardCheck': ClipboardCheck,
  'Handshake': Handshake
};

const ICON_COLORS: Record<string, string> = {
  'BookOpen': 'from-blue-600 to-blue-800 text-white border-blue-400',
  'DollarSign': 'from-emerald-600 to-emerald-800 text-white border-emerald-400',
  'Globe': 'from-indigo-600 to-indigo-800 text-white border-indigo-400',
  'Home': 'from-orange-600 to-orange-800 text-white border-orange-400',
  'Users': 'from-violet-600 to-violet-800 text-white border-violet-400',
  'Coffee': 'from-amber-600 to-amber-800 text-white border-amber-400',
  'Heart': 'from-rose-600 to-rose-800 text-white border-rose-400',
  'Music': 'from-pink-600 to-pink-800 text-white border-pink-400',
  'Smile': 'from-yellow-500 to-yellow-700 text-white border-yellow-300',
  'Library': 'from-cyan-600 to-cyan-800 text-white border-cyan-400',
  'Book': 'from-blue-600 to-blue-800 text-white border-blue-400',
  'Box': 'from-slate-600 to-slate-800 text-white border-slate-400',
  'Newspaper': 'from-gray-600 to-gray-800 text-white border-gray-400',
  'FileText': 'from-teal-600 to-teal-800 text-white border-teal-400',
  'UserPlus': 'from-green-600 to-green-800 text-white border-green-400',
  'Clock': 'from-fuchsia-600 to-fuchsia-800 text-white border-fuchsia-400',
  'ClipboardCheck': 'from-lime-600 to-lime-800 text-white border-lime-400',
  'Handshake': 'from-sky-600 to-sky-800 text-white border-sky-400'
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ─── Initial committee data (unchanged) ─────────────────────────────────────

const INITIAL_COMMITTEES: Omit<Committee, 'id'>[] = [
   {
    name: 'Sunday School',
    icon: 'BookOpen',
    description: 'Sunday School Committee hian naupang leh ṭhalaite thlarau lama an ṭhanlenna tura zirtirna kalpui te, zirlai bu ruahman te leh hun pawimawh hrang hrang buatsaihte a thawk a ni.',
    members: [
        { id: 'ss-c', name: 'Upa David Lalchhanhima', role: 'Chairman' },
        { id: 'ss-vc', name: 'Upa Lalremruata', role: 'Vice Chairman' },
        { id: 'ss-s', name: 'Pu C. Rohmingliana', role: 'Secretary' },
        { id: 'ss-as', name: 'Pu Manliankhupa', role: 'Asst. Secretary' },
        { id: 'ss-m-kc', name: 'Kohhran Committee te', role: 'Member' },
        { id: 'ss-m-dl1', name: 'Pu Zoramenga', role: 'Leader, Senior Dept.' },
        { id: 'ss-m-dl2', name: 'T.Upa Hmingthansanga', role: 'Leader, Sacrament Dept.' },
        { id: 'ss-m-dl3', name: 'Pu V.Lalbiakdika', role: 'Leader, Intermediate Dept.' },
        { id: 'ss-m-dl4', name: 'Tv.H.Lalfakawma', role: 'Leader, Junior Dept.' },
        { id: 'ss-m-dl5', name: 'Pu Mungngaihsanga', role: 'Leader, Primary Dept.' },
        { id: 'ss-m-dl6', name: 'Pi K.Lalbiakthangi', role: 'Leader, Beginners Dept.' },
        { id: 'ss-m-dl7', name: 'Pi K.Lalrokhumi', role: 'Leader, Pre-Beginners Dept.' },
        { id: 'ss-m-lib', name: 'Upa Daikhawzama', role: 'Librarian' }
    ]
  },
  {
    name: 'Finance Committee',
    icon: 'DollarSign',
    description: 'Kohhran Thawhlawm ki pui Pathian Ram chhiartu leh in sem tute an ni.',
    members: [
        { id: 'fin-c', name: 'Upa C.Lalthantluanga', role: 'Chairman' },
        { id: 'fin-vc', name: 'Upa Daikhawzama', role: 'Vice Chairman' },
        { id: 'fin-s', name: 'Pu Lalmuanpuia Ralte', role: 'Secretary' },
        { id: 'fin-as1', name: 'Pu C.Lalmuansanga', role: 'Asst. Secretary' },
        { id: 'fin-as2', name: 'Pu R.Lalmalsawma', role: 'Asst. Secretary' },
        { id: 'fin-m1', name: 'Pu Dawngsuanpauva', role: 'Member' },
        { id: 'fin-m2', name: 'Pu C.Rohmingliana', role: 'Member' },
        { id: 'fin-m3', name: 'Pu Lalsanglura Zote', role: 'Member' },
        { id: 'fin-m4', name: 'Pu Lalramthara', role: 'Member' },
        { id: 'fin-m5', name: 'Pu T.Sangtluanga', role: 'Member' },
        { id: 'fin-m6', name: 'Pu Thangdeihchina', role: 'Member' },
        { id: 'fin-m7', name: 'Pu JC Laldinthara', role: 'Member' },
        { id: 'fin-m8', name: 'Pu MS Dawngliana', role: 'Member' },
        { id: 'fin-m9', name: 'Pu K.Lalengthanga', role: 'Member' },
        { id: 'fin-m10', name: 'Pu C.Lalrawngbawla', role: 'Member' },
        { id: 'fin-m11', name: 'Pu Lalhmingmawia', role: 'Member' },
        { id: 'fin-m12', name: 'Pu Thanglianmanga', role: 'Member' },
        { id: 'fin-m13', name: 'Pu Kenneth Lalthanzauva', role: 'Member' },
        { id: 'fin-m14', name: 'Pu Nelson Khiangte', role: 'Member' },
        { id: 'fin-m15', name: 'Pu Kapthuama', role: 'Member' },
        { id: 'fin-m16', name: 'Pu Khawlrosiama', role: 'Member' },
        { id: 'fin-m17', name: 'Pu Thangkunga Hualngo', role: 'Member' },
        { id: 'fin-m18', name: 'Pu Mungngaihsanga', role: 'Member' },
        { id: 'fin-m19', name: 'Pu C.Malsawmdawngliana', role: 'Member' },
        { id: 'fin-m20', name: 'Pu B.Zelkhangova', role: 'Member' },
        { id: 'fin-m21', name: 'Pu PC Zoramthanga', role: 'Member' },
        { id: 'fin-m22', name: 'Pu K.Lalengkima', role: 'Member' },
        { id: 'fin-m23', name: 'Pu Lalthanghulha', role: 'Member' },
        { id: 'fin-m24', name: 'Pu C.Lalengmawia', role: 'Member' },
        { id: 'fin-m25', name: 'Pu Lalmuanpuia', role: 'Member' },
        { id: 'fin-m26', name: 'Pu Lalramnghakhlela', role: 'Member' },
        { id: 'fin-m27', name: 'Pu F.Lalhriatpuia', role: 'Member' },
        { id: 'fin-m28', name: 'Pu H.Lalzuitluanga', role: 'Member' },
    ]
  },
  {
    name: 'Ramthar Committee',
    icon: 'Globe',
    description: 'Missionary-te thlawpna leh ramthara Chanchin Ṭha puandarhna kawnga hma latu an ni.',
    members: [
      { id: 'ramthar-c', name: 'Upa H.Zairemmawia', role: 'Chairman' },
      { id: 'ramthar-vc', name: 'Pu H.Vanlalthanga', role: 'Vice Chairman' },
      { id: 'ramthar-s', name: 'Pu K.Lalengthanga', role: 'Secretary' },
      { id: 'ramthar-as', name: 'Pu Thangkunga Hualngo', role: 'Asst. Secretary' },
      { id: 'ramthar-t', name: 'Pu T.Sangtluanga', role: 'Treasurer' },
      { id: 'ramthar-fs', name: 'Pu C.Lalrawngbawla', role: 'Fin. Secretary' },
      { id: 'ramthar-m1', name: 'Pu R.Lalremmawia', role: 'Member' },
    ]
  },
  {
    name: 'Building Committee',
    icon: 'Home',
    description: 'Kohhran in leh lo, hmunhma enkawl leh cheiṭhat hna thawk tute an ni.',
    members: [
        { id: 'bld-c', name: 'Upa David Lalchhanhima', role: 'Chairman' },
        { id: 'bld-vc', name: 'Upa R.Lalramhluna', role: 'Vice Chairman' },
    ]
  },
  {
    name: 'Social Front Committee',
    icon: 'Handshake',
    description: 'Organizes community service projects, social welfare initiatives, and outreach to those in need within and outside the church.',
    members: []
  },
  {
    name: 'Refreshment Committee',
    icon: 'Coffee',
    description: 'Coordinates hospitality and refreshments for church events, ensuring comfort and fellowship for all attendees.',
    members: []
  },
  {
    name: 'Kristian Chhungkua Committee',
    icon: 'Heart',
    description: 'Promotes Christian family values and provides support for families within the church through various programs and counseling.',
    members: []
  },
  {
    name: 'Worship Committee',
    icon: 'Music',
    description: 'Plans and organizes all worship services, including music, liturgy, and special programs to enhance the worship experience.',
    members: []
  },
  {
    name: 'Masihi Sangati Committee',
    icon: 'Users',
    description: 'Fosters fellowship and spiritual growth among non-Mizo speaking members, organizing services and activities in Hindi.',
    members: []
  },
  {
    name: 'Reception, Ushering & Decoration Committee',
    icon: 'Smile',
    description: 'Ensures a warm welcome for all visitors and members, manages ushering duties, and beautifies the church premises.',
    members: []
  },
  {
    name: 'Archive & Library Committee',
    icon: 'Library',
    description: 'Preserves the church\'s historical records, documents, and maintains the church library for members to access spiritual resources.',
    members: []
  },
  {
    name: 'Bible Society of India (BSI)',
    icon: 'BookOpen',
    description: 'Supports the mission of the Bible Society of India in making Bibles available and accessible to everyone in local languages.',
    members: []
  },
  {
    name: 'Bungraw Enkawltu Committee',
    icon: 'Box',
    description: 'Manages and maintains all church assets and supplies, ensuring resources are available and in good condition.',
    members: []
  },
];

// ─── Main Departments component ───────────────────────────────────────────────

const Departments: React.FC = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Partial<Committee> | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Reordering
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const initialOrderRef = useRef<string[]>([]);

  const fetchCommittees = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
       setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}`, order: i } as Committee)));
       setIsOfflineMode(true);
       setLoading(false);
       return;
    }

    try {
        const snapshot = await db.collection('committees').get();
        if (!snapshot.empty) {
            const fetchedData = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })) as Committee[];
            fetchedData.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                return a.name.localeCompare(b.name);
            });

            setCommittees(fetchedData);
            initialOrderRef.current = fetchedData.map(c => c.id);
            setIsOfflineMode(false);
        } else {
            setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}`, order: i } as Committee)));
        }
    } catch (error: any) {
        setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}`, order: i } as Committee)));
        setIsOfflineMode(true);
    }
    setLoading(false);
    setHasOrderChanged(false);
  }, []);

  useEffect(() => { fetchCommittees(); }, [fetchCommittees]);

  // ── Save committee ──────────────────────────────────────────────────────────

  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingCommittee) return;
    setLoading(true);
    try {
        let logoUrl = editingCommittee.logoUrl;

        if (logoFile) {
            setIsUploading(true);
            const storageRef = storage.ref(`committee_logos/${Date.now()}_${logoFile.name}`);
            await storageRef.put(logoFile);
            logoUrl = await storageRef.getDownloadURL();
            setIsUploading(false);
        }

        const { id, ...dataToSave } = editingCommittee;
        const finalData = { ...dataToSave, logoUrl };

        if (id && !id.startsWith('static-')) {
            await db.collection('committees').doc(id).set(finalData, { merge: true });
        } else {
            const newOrder = committees.length > 0 ? Math.max(...committees.map(c => c.order || 0)) + 1 : 0;
            await db.collection('committees').add({ 
                ...finalData,
                name: dataToSave.name || 'Untitled', 
                icon: dataToSave.icon || 'Users', 
                description: dataToSave.description || '', 
                members: dataToSave.members || [], 
                order: newOrder 
            });
        }
        setIsCommitteeModalOpen(false);
        setEditingCommittee(null);
        setLogoFile(null);
        fetchCommittees();
    } catch (error) { 
        console.error("Error saving committee:", error); 
        setIsUploading(false);
    }
    setLoading(false);
  };

  const handleDeleteCommittee = async (committeeId: string) => {
    if (!db || !window.confirm(t.departments.deleteConfirm)) return;
    try { await db.collection('committees').doc(committeeId).delete(); fetchCommittees(); }
    catch (error) { console.error("Error deleting committee:", error); }
  };

  // ── Seed / order ────────────────────────────────────────────────────────────

  const handleSeedData = async () => {
    if (!db || !db.collection || !window.confirm(t.departments.seedConfirm)) return;
    setIsSeeding(true);
    try {
        const committeesRef = db.collection('committees');
        const existingDocs = await committeesRef.get();
        if (!existingDocs.empty) {
            const deleteBatch = db.batch();
            existingDocs.docs.forEach((doc: any) => deleteBatch.delete(doc.ref));
            await deleteBatch.commit();
        }
        const addBatch = db.batch();
        INITIAL_COMMITTEES.forEach((committeeData, index) => {
            const newDocRef = committeesRef.doc();
            addBatch.set(newDocRef, { ...committeeData, order: index });
        });
        await addBatch.commit();
        await fetchCommittees();
        alert("Seeding complete!");
    } catch (error) { console.error("Error seeding data:", error); alert("An error occurred during seeding."); }
    setIsSeeding(false);
  };

  const handleMoveCommittee = (id: string, direction: 'up' | 'down') => {
    if (searchTerm) return;
    const currentIndex = committees.findIndex(c => c.id === id);
    if (currentIndex === -1) return;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < committees.length) {
      const updatedCommittees = [...committees];
      const [movedCommittee] = updatedCommittees.splice(currentIndex, 1);
      updatedCommittees.splice(newIndex, 0, movedCommittee);
      setCommittees(updatedCommittees);
      setHasOrderChanged(true);
    }
  };

  const handleSaveOrder = async () => {
    if (!db || !db.batch || !window.confirm(t.departments.orderConfirm)) return;
    setLoading(true);
    try {
        const batch = db.batch();
        committees.forEach((committee, index) => {
            if (committee.id && !committee.id.startsWith('static-')) {
                batch.update(db.collection('committees').doc(committee.id), { order: index });
            }
        });
        await batch.commit();
        setHasOrderChanged(false);
        initialOrderRef.current = committees.map(c => c.id);
        alert("Order saved successfully!");
    } catch (error) { console.error("Error saving order:", error); alert("Failed to save order."); }
    setLoading(false);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const openCommitteeModal = (committee: Partial<Committee> | null) => {
    setEditingCommittee(committee || { name: '', icon: 'Users', description: '', members: [] });
    setLogoFile(null);
    setIsCommitteeModalOpen(true);
  };

  const filteredCommittees = committees.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-church-900 mb-4 text-center">{t.departments.title}</h1>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">{t.departments.subtitle}</p>

        <div className="max-w-md mx-auto mb-8 relative">
          <Search size={20} className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400" style={{ top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-300 focus:ring-2 focus:ring-church-500" placeholder={t.departments.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {isAdmin && !isOfflineMode && (
          <div className="text-center mb-8 flex flex-wrap justify-center gap-4">
            <button onClick={() => openCommitteeModal(null)} className="inline-flex items-center px-6 py-2 bg-church-600 text-white rounded-full hover:bg-church-700 shadow-sm transition">
              <Plus size={18} className="mr-2" /> {t.departments.addNew}
            </button>
            <button onClick={handleSaveOrder} disabled={!hasOrderChanged || loading} className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm transition disabled:opacity-50">
              <Save size={18} className="mr-2" /> {t.departments.saveOrder}
            </button>
            <button onClick={handleSeedData} disabled={isSeeding} className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition disabled:opacity-50">
              {isSeeding ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Database size={18} className="mr-2" />}
              {t.departments.seedAll}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
        ) : (
          <>
            {isOfflineMode && (
              <div className="mb-6 p-3 bg-church-50 text-church-700 text-xs rounded text-center flex items-center justify-center">
                <AlertTriangle size={14} className="mr-2" />
                {t.departments.offlineMode}
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCommittees.map((c, index) => {
                const Icon = ICON_MAP[c.icon] || Users;
                const colorClass = ICON_COLORS[c.icon] || 'from-church-600 to-church-800 text-white border-church-400';

                return (
                  <Link 
                    key={c.id} 
                    to={`/committees/${c.id}`}
                    className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full relative"
                  >
                    {/* Admin Controls */}
                    {isAdmin && !isOfflineMode && (
                      <div className="absolute top-4 right-4 flex space-x-1 z-20" onClick={(e) => e.preventDefault()}>
                        {!searchTerm && (
                          <>
                            <button onClick={() => handleMoveCommittee(c.id, 'up')} disabled={index === 0} className="p-2 text-slate-500 bg-white/90 rounded-full hover:bg-church-50 hover:text-church-600 disabled:opacity-30 shadow-sm" title="Move Up"><ArrowUp size={14} /></button>
                            <button onClick={() => handleMoveCommittee(c.id, 'down')} disabled={index === filteredCommittees.length - 1} className="p-2 text-slate-500 bg-white/90 rounded-full hover:bg-church-50 hover:text-church-600 disabled:opacity-30 shadow-sm" title="Move Down"><ArrowDown size={14} /></button>
                          </>
                        )}
                        <button onClick={() => openCommitteeModal(c)} className="p-2 text-church-600 bg-white/90 rounded-full hover:bg-church-100 shadow-sm"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteCommittee(c.id)} className="p-2 text-red-500 bg-white/90 rounded-full hover:bg-red-100 shadow-sm"><Trash size={14} /></button>
                      </div>
                    )}

                    <div className="p-8 flex flex-col items-center text-center flex-grow">
                      <div className="perspective-1000 mb-6">
                        <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br border-2 token-3d group-hover:animate-rotate-y-slow preserve-3d flex items-center justify-center overflow-hidden shadow-lg ${colorClass}`}>
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine pointer-events-none z-10"></div>
                          <div className="relative z-20 backface-hidden" style={{ transform: 'translateZ(20px)' }}>
                            {c.logoUrl ? (
                              <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Icon size={36} className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" strokeWidth={2.5} />
                            )}
                          </div>
                          <div className="absolute inset-0.5 rounded-2xl border border-white/20 z-0"></div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-church-700 transition-colors mb-3">{c.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{c.description || 'Dedicated to serving the church and community.'}</p>
                    </div>

                    <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center overflow-hidden">
                              <Users size={12} className="text-slate-400" />
                            </div>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {c.members?.length || 0} {t.departments.members}
                        </span>
                      </div>
                      <div className="text-church-600 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {t.departments.viewDetails} <ChevronRight size={14} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredCommittees.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <Search size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500">{t.departments.noResults} "{searchTerm}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* ── Committee Modal ── */}
    {isCommitteeModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <form onSubmit={handleSaveCommittee}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{editingCommittee?.id ? t.departments.editCommittee : t.departments.newCommittee}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.departments.form.name}</label>
                  <input required className="w-full border border-slate-300 rounded p-2" value={editingCommittee?.name || ''} onChange={e => setEditingCommittee({...editingCommittee, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.common.description}</label>
                  <textarea className="w-full border border-slate-300 rounded p-2 h-24" value={editingCommittee?.description || ''} onChange={e => setEditingCommittee({...editingCommittee, description: e.target.value})} placeholder={t.common.description + '...'}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.departments.form.icon}</label>
                  <select required className="w-full border border-slate-300 rounded p-2" value={editingCommittee?.icon} onChange={e => setEditingCommittee({...editingCommittee, icon: e.target.value})}>
                    {Object.keys(ICON_MAP).map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.departments.form.logo}</label>
                  <div className="flex items-center space-x-4">
                    {editingCommittee?.logoUrl && !logoFile && (
                      <div className="w-12 h-12 rounded border overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={editingCommittee.logoUrl} alt={t.departments.form.currentLogo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="flex-grow">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-church-50 file:text-church-700 hover:file:bg-church-100"
                        onChange={e => setLogoFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    {editingCommittee?.logoUrl && (
                      <button 
                        type="button" 
                        onClick={() => setEditingCommittee({...editingCommittee, logoUrl: ''})}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title={t.departments.form.removeLogo}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{t.departments.form.logoNote}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-xl">
              <button type="button" onClick={() => setIsCommitteeModalOpen(false)} className="px-4 py-2 border rounded">{t.departments.cancel}</button>
              <button type="submit" disabled={loading || isUploading} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">
                {(loading || isUploading) ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} 
                {isUploading ? t.departments.form.uploading : t.departments.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
};

export default Departments;
