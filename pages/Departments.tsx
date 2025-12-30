
import React, { useEffect, useState, useCallback } from 'react';
import { 
  BookOpen, DollarSign, Globe, Home, Users, Coffee, Heart, Music, 
  Smile, Library, Book, Box, Newspaper, FileText, UserPlus, Clock, 
  ClipboardCheck, Handshake, ChevronDown, ChevronUp, Search, Loader, 
  AlertTriangle, Phone, Plus, Edit, Trash, Save, X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { Committee, CommitteeMember } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Map string names to actual components
const ICON_MAP: Record<string, React.ElementType> = {
  'BookOpen': BookOpen,
  'DollarSign': DollarSign,
  'Globe': Globe,
  'Home': Home,
  'Users': Users,
  'Coffee': Coffee,
  'Heart': Heart,
  'Music': Music,
  'Smile': Smile,
  'Library': Library,
  'Book': Book,
  'Box': Box,
  'Newspaper': Newspaper,
  'FileText': FileText,
  'UserPlus': UserPlus,
  'Clock': Clock,
  'ClipboardCheck': ClipboardCheck,
  'Handshake': Handshake
};

// Full Data with Members (Fallback and Initial Seed)
const INITIAL_COMMITTEES: Omit<Committee, 'id'>[] = [
  {
    name: 'Kohhran Committee',
    icon: 'UserPlus',
    members: [
      { id: 'kc-m1', name: 'Rev. Lalhmingthanga Chhangte', role: 'Chairman', phone: '7085626477' },
      { id: 'kc-m2', name: 'Upa Lianpianga', role: 'Secretary', phone: '9862501798' },
      { id: 'kc-m3', name: 'Upa C.Zohmingthanga', role: 'Asst. Secretary' },
      { id: 'kc-m4', name: 'Upa PC Lalhmingliana', role: 'Treasurer (Tualchhung)', phone: '8974384066' },
      { id: 'kc-m5', name: 'Upa R.Lalramhluna', role: 'Treasurer (Synod)', phone: '8415847356' },
      { id: 'kc-m6', name: 'Upa HT Vanlalsawma', role: 'Finance Secretary', phone: '9612586354' },
    ]
  },
  {
    name: 'Sunday School',
    icon: 'BookOpen',
    members: [
      { id: 'ss-m1', name: 'Upa David Lalchhanhima', role: 'Chairman' },
      { id: 'ss-m2', name: 'Upa Lalremruata', role: 'Vice Chairman' },
      { id: 'ss-m3', name: 'Pu C.Rohmingliana', role: 'Secretary' },
      { id: 'ss-m4', name: 'Pu Manliankhupa', role: 'Asst. Secretary' },
      { id: 'ss-m5', name: 'Kohhran Committee te', role: 'Members' },
      { id: 'ss-m6', name: 'Pu Zoramenga', role: 'Leader - Senior Dept.' },
      { id: 'ss-m7', name: 'T.Upa Hmingthansanga', role: 'Leader - Sacrament Dept.' },
      { id: 'ss-m8', name: 'Pu V.Lalbiakdika', role: 'Leader - Intermediate Dept.' },
      { id: 'ss-m9', name: 'Tv.H.Lalfakawma', role: 'Leader - Junior Dept.' },
      { id: 'ss-m10', name: 'Pu Mungngaihsanga', role: 'Leader - Primary Dept.' },
      { id: 'ss-m11', name: 'Pi K.Lalbiakthangi', role: 'Leader - Beginners Dept.' },
      { id: 'ss-m12', name: 'Pi K.Lalrokhumi', role: 'Leader - Pre-Beginners Dept.' },
      { id: 'ss-m13', name: 'Upa Daikhawzama', role: 'Librarian' }
    ]
  },
  // Add unique IDs to all other members as well
];

const Departments: React.FC = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCommitteeId, setExpandedCommitteeId] = useState<string | null>(null);

  // State for Modals
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Partial<Committee> | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMemberInfo, setEditingMemberInfo] = useState<{ committeeId: string; member?: CommitteeMember } | null>(null);

  const fetchCommittees = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
       console.warn("Firestore not available, using static data.");
       setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}` } as Committee)));
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
            
            fetchedData.sort((a, b) => a.name.localeCompare(b.name));
            setCommittees(fetchedData);
            setIsOfflineMode(false);
        } else {
            setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}` } as Committee)));
        }
    } catch (error: any) {
        console.warn("Firebase access denied or failed, using static data:", error.message);
        setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}` } as Committee)));
        setIsOfflineMode(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCommittees();
  }, [fetchCommittees]);
  
  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingCommittee) return;

    setLoading(true);
    try {
        const { id, ...dataToSave } = editingCommittee;

        if (id && !id.startsWith('static-')) {
            await db.collection('committees').doc(id).set(dataToSave, { merge: true });
        } else {
            await db.collection('committees').add({
                name: dataToSave.name || 'Untitled',
                icon: dataToSave.icon || 'Users',
                members: dataToSave.members || []
            });
        }
        
        setIsCommitteeModalOpen(false);
        setEditingCommittee(null);
        fetchCommittees();
    } catch (error) {
        console.error("Error saving committee:", error);
    }
    setLoading(false);
  };
  
  const handleDeleteCommittee = async (committeeId: string) => {
    if (!db || !window.confirm("Are you sure you want to delete this entire committee?")) return;
    try {
        await db.collection('committees').doc(committeeId).delete();
        fetchCommittees();
    } catch (error) {
        console.error("Error deleting committee:", error);
    }
  };

  const handleSaveMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !editingMemberInfo?.committeeId || !editingMemberInfo.member) return;

    setLoading(true);
    const { committeeId, member } = editingMemberInfo;
    
    try {
        const committeeRef = db.collection('committees').doc(committeeId);
        const doc = await committeeRef.get();
        if (!doc.exists) throw new Error("Committee not found");

        const committeeData = doc.data() as Committee;
        let members = committeeData.members || [];

        if (member.id) { // Editing
            members = members.map(m => m.id === member.id ? member : m);
        } else { // Adding
            const newMember = { ...member, id: Date.now().toString() };
            members.push(newMember);
        }
        
        await committeeRef.update({ members });
        
        setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, members } : c));
        
        setIsMemberModalOpen(false);
    } catch (error) {
        console.error("Error saving member:", error);
    }
    setLoading(false);
  };

  const handleDeleteMember = async (committeeId: string, memberId: string) => {
    if (!db || !window.confirm("Delete this member?")) return;
    try {
        const committeeRef = db.collection('committees').doc(committeeId);
        const doc = await committeeRef.get();
        if (!doc.exists) throw new Error("Committee not found");

        const committeeData = doc.data() as Committee;
        const members = (committeeData.members || []).filter(m => m.id !== memberId);
        
        await committeeRef.update({ members });
        setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, members } : c));
    } catch (error) {
        console.error("Error deleting member:", error);
    }
  };


  const openCommitteeModal = (committee: Partial<Committee> | null) => {
    setEditingCommittee(committee || { name: '', icon: 'Users', members: [] });
    setIsCommitteeModalOpen(true);
  };

  const openMemberModal = (committeeId: string, member?: CommitteeMember) => {
      setEditingMemberInfo({ committeeId, member: member || { name: '', role: '', phone: '' } });
      setIsMemberModalOpen(true);
  };


  const toggleExpand = (id: string) => setExpandedCommitteeId(prev => prev === id ? null : id);

  const filteredCommittees = committees.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.members?.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-church-900 mb-4 text-center">{t.departments.title}</h1>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">{t.departments.subtitle}</p>

        <div className="max-w-md mx-auto mb-8 relative">
            <Search size={20} className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400" />
            <input type="text" className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-300 focus:ring-2 focus:ring-church-500" placeholder="Search committees or members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        {isAdmin && !isOfflineMode && (
          <div className="text-center mb-8">
            <button onClick={() => openCommitteeModal(null)} className="inline-flex items-center px-6 py-2 bg-church-600 text-white rounded-full hover:bg-church-700 shadow-sm transition">
              <Plus size={18} className="mr-2" /> Add New Committee
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
        ) : (
          <>
             {isOfflineMode && (
                 <div className="mb-6 p-3 bg-blue-50 text-blue-700 text-xs rounded text-center flex items-center justify-center">
                    <AlertTriangle size={14} className="mr-2" />
                    Public View Mode. Admin controls are disabled.
                 </div>
             )}

             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredCommittees.map((c) => {
                 const Icon = ICON_MAP[c.icon] || Users;
                 const isExpanded = expandedCommitteeId === c.id;
                 
                 return (
                   <div key={c.id} className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-lg ring-1 ring-church-200 border-church-300' : 'shadow-sm border-slate-200 hover:shadow-md'}`}>
                     <div onClick={() => toggleExpand(c.id)} className="p-6 flex items-center justify-between cursor-pointer bg-white relative">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-lg mr-4 transition-colors shadow-sm ${isExpanded ? 'bg-church-100 text-church-700' : 'bg-slate-50 text-slate-400'}`}><Icon size={24} /></div>
                            <div>
                                <h3 className={`text-base font-bold transition-colors ${isExpanded ? 'text-church-900' : 'text-slate-800'}`}>{c.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">{c.members?.length || 0} Members</p>
                            </div>
                        </div>
                        <div className="text-slate-400">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                        {isAdmin && !isOfflineMode && (
                           <div className="absolute top-2 right-2 flex space-x-1">
                             <button onClick={(e) => { e.stopPropagation(); openCommitteeModal(c); }} className="p-1.5 text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100"><Edit size={14} /></button>
                             <button onClick={(e) => { e.stopPropagation(); handleDeleteCommittee(c.id); }} className="p-1.5 text-red-500 bg-red-50 rounded-full hover:bg-red-100"><Trash size={14} /></button>
                           </div>
                        )}
                     </div>

                     {isExpanded && (
                         <div className="border-t border-slate-100 bg-slate-50/70 p-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Members</h4>
                                {isAdmin && !isOfflineMode && (
                                  <button onClick={() => openMemberModal(c.id)} className="text-xs font-semibold text-church-600 bg-church-100 px-2 py-1 rounded-md hover:bg-church-200">+ Add</button>
                                )}
                            </div>
                            {!c.members || c.members.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No members listed.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {c.members.map((member) => (
                                        <li key={member.id} className="group flex flex-col sm:flex-row sm:justify-between sm:items-baseline text-sm">
                                            <span className="font-semibold text-slate-800 flex items-center">{member.name}</span>
                                            <div className="flex items-baseline">
                                                <span className="text-slate-500 text-xs sm:text-sm mr-2">{member.role}</span>
                                                {isAdmin && !isOfflineMode && (
                                                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => openMemberModal(c.id, member)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit size={14} /></button>
                                                    <button onClick={() => handleDeleteMember(c.id, member.id!)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash size={14} /></button>
                                                  </div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                         </div>
                     )}
                   </div>
                 );
               })}
             </div>
             
             {filteredCommittees.length === 0 && (<div className="text-center py-12 text-slate-500"><p>No committees found matching "{searchTerm}"</p></div>)}
          </>
        )}
      </div>
    </div>
    
    {/* Committee Modal */}
    {isCommitteeModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <form onSubmit={handleSaveCommittee}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{editingCommittee?.id ? 'Edit Committee' : 'New Committee'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Committee Name</label>
                  <input required className="w-full border border-slate-300 rounded p-2" value={editingCommittee?.name || ''} onChange={e => setEditingCommittee({...editingCommittee, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Icon</label>
                  <select required className="w-full border border-slate-300 rounded p-2" value={editingCommittee?.icon} onChange={e => setEditingCommittee({...editingCommittee, icon: e.target.value})}>
                    {Object.keys(ICON_MAP).map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-xl">
              <button type="button" onClick={() => setIsCommitteeModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">{loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Member Modal */}
    {isMemberModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <form onSubmit={handleSaveMember}>
             <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{editingMemberInfo?.member?.id ? 'Edit Member' : 'Add Member'}</h3>
              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input required className="w-full border border-slate-300 rounded p-2" value={editingMemberInfo?.member?.name || ''} onChange={e => setEditingMemberInfo({...editingMemberInfo, member: { ...editingMemberInfo?.member, name: e.target.value }})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                    <input required className="w-full border border-slate-300 rounded p-2" value={editingMemberInfo?.member?.role || ''} onChange={e => setEditingMemberInfo({...editingMemberInfo, member: { ...editingMemberInfo?.member, role: e.target.value }})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Phone (Optional)</label>
                    <input className="w-full border border-slate-300 rounded p-2" value={editingMemberInfo?.member?.phone || ''} onChange={e => setEditingMemberInfo({...editingMemberInfo, member: { ...editingMemberInfo?.member, phone: e.target.value }})} />
                  </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-xl">
              <button type="button" onClick={() => setIsMemberModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">{loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
};

export default Departments;
