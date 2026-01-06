
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { Ministry, KTPHruaitute, KTPMember, KTPGroup } from '../types';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Users, Calendar, Loader, Home, Book, List, History, Camera, Video, UserSquare, Edit, Phone, Save, X, PlusCircle, Trash2, Shield, Plus, UserPlus } from 'lucide-react';

const INITIAL_KTP_2026_DATA: KTPHruaitute = {
    year: 2026,
    leaders: [
        { id: 'l1', role: 'Leader', name: 'Pu V.Lalbiakdika', phone: '9862501797' },
        { id: 'l2', role: 'Asst. Leader', name: 'Pu Zoramenga', phone: '8731914707' },
        { id: 'l3', role: 'Secretary', name: 'Tv. Thangdeihmanga', phone: '9862408944' },
        { id: 'l4', role: 'Asst. Secretary', name: 'Tv. Vanlalchhana', phone: '9774960512' },
        { id: 'l5', role: 'Treasurer', name: 'Tv H.Lalfakawma', phone: '9862532108' },
        { id: 'l6', role: 'Fin. Secretary', name: 'Nl. Lallawmzuali', phone: '9862859665' },
    ],
    committeeMembers: [
        { id: 'cm1', name: 'Pu C. Rodinthara', phone: '8731914713' },
        { id: 'cm2', name: 'Nl. Ningsianmawii', phone: '8974711669' },
        { id: 'cm3', name: 'Pu Manliankhupa', phone: '8259813082' },
        { id: 'cm4', name: 'Pu Lalhmunngheta', phone: '8014535906' },
        { id: 'cm5', name: 'Pu K. Lalramngheta', phone: '9856015972' },
        { id: 'cm6', name: 'Nl. B Lalnunsiami', phone: '9862775676' },
        { id: 'cm7', name: 'Nl. Lalnunthari', phone: '8730975332' },
        { id: 'cm8', name: 'Pu C. Lalchhanhima', phone: '8974742027' },
        { id: 'cm9', name: 'Tv. B Thangzauva', phone: '8414932248' },
        { id: 'cm10', name: 'Tv. PB Hmangaihropuia', phone: '8459481985' },
        { id: 'cm11', name: 'Tv. Liankhankhama', phone: '8798677049' },
        { id: 'cm12', name: 'Pu T. Lalramnghaka', phone: '9862652584' },
        { id: 'cm13', name: 'Pu C. Ramtharnghaka', phone: '9612983809' },
        { id: 'cm14', name: 'Tv. Vanlaldanmawia', phone: '9612577054' },
        { id: 'cm15', name: 'Pu Vanlalzamlova', phone: '7628028283' },
        { id: 'cm16', name: 'Pu Tluangzathanga', phone: '7628875311' },
        { id: 'cm17', name: 'Tv Vanlalzauva', phone: '8131959913' },
        { id: 'cm18', name: 'Nl Vungngaihdawni', phone: '7085363712' },
        { id: 'cm19', name: 'Nl Thangdinsangi', phone: '9612852334' },
        { id: 'cm20', name: 'Nl V.Nunmawii', phone: '8974238630' },
        { id: 'cm21', name: 'Nl C.Lalremruati', phone: '9862670041' },
        { id: 'cm22', name: 'Pu Vanlalruatpuia', phone: '8132804701' },
        { id: 'cm23', name: 'Pu Lalthangliana', phone: '7085198550' },
    ],
    exOfficioMembers: [
        { id: 'eo1', name: 'Upa David Lalchhanhima', phone: '9862630996', role: 'Kohhran Committee Aiawh' },
        { id: 'eo2', name: 'Upa Hmingthanmawia Sailo', phone: '9862532256', role: 'Kohhran Committee Aiawh' },
        { id: 'eo3', name: 'Rev. Lalhmingthanga Chhangte', phone: '7085626477', role: 'Ex-Officio' },
        { id: 'eo4', name: 'Pro Pastor Lallawmsanga', phone: '9862727756', role: 'Ex-Officio' },
    ],
    groupLeaders: [
        {
            id: 'g1', groupName: 'UPA KHAWIDAWLA', members: [
                { id: 'g1l1', role: 'Leader', name: 'Pu Tluangzathanga' },
                { id: 'g1l2', role: 'Asst. Leader', name: 'Tv. Zothanpuia' },
                { id: 'g1l3', role: 'Secretary', name: 'Tv Thangzasanga' },
                { id: 'g1l4', role: 'Asst Secretary', name: 'Nl. Lalnunsiami' },
                { id: 'g1l5', role: 'Treasurer', name: 'Nl. Thangdinsangi' },
                { id: 'g1l6', role: 'Fin. Secretary', name: 'Tv. Zodintluanga' },
                { id: 'g1l7', role: 'Branch O.B', name: 'Tv. H. Lalfakawma' },
            ]
        },
        {
            id: 'g2', groupName: 'Upa MANHLEIA', members: [
                { id: 'g2l1', role: 'Leader', name: 'Tv B. Thangzauva' },
                { id: 'g2l2', role: 'Asst. Leader', name: 'Pu Ramdinpuia' },
                { id: 'g2l3', role: 'Secretary', name: 'Tv Lalhmuliana' },
                { id: 'g2l4', role: 'Asst.Secretary', name: 'Nl. Ruth Lalnunfeli' },
                { id: 'g2l5', role: 'Treasurer', name: 'Nl. C. Lalremruati' },
                { id: 'g2l6', role: 'Fin. Secretary', name: 'Pu Vanlalmawia' },
                { id: 'g2l7', role: 'Branch O.B', name: 'Pu Zoramenga' },
            ]
        },
        {
            id: 'g3', groupName: 'UPA C.LALRINTLUANGA', members: [
                { id: 'g3l1', role: 'Leader', name: 'Pu C.Ramtharnghaka' },
                { id: 'g3l2', role: 'Asst. Leader', name: 'Pu Lalhruaitluanga' },
                { id: 'g3l3', role: 'Secretary', name: 'Tv Lalrochawia' },
                { id: 'g3l4', role: 'Asst. Secretary', name: 'Nl Zodinsangi' },
                { id: 'g3l5', role: 'Treasurer', name: 'Nl. V.Nunmawiii' },
                { id: 'g3l6', role: 'Fin. Secretary', name: 'Tv Lalengkima' },
                { id: 'g3l7', role: 'Branch O.B', name: 'Tv Thangdeihmanga' },
                { id: 'g3l8', role: 'Branch O.B', name: 'Nl Lallawmzuali' },
            ]
        },
        {
            id: 'g4', groupName: 'UPA H.LALMAWIA', members: [
                { id: 'g4l1', role: 'Leader', name: 'Tv Vanlalzauva' },
                { id: 'g4l2', role: 'Asst. Leader', name: 'Pu Samuel Lalbiakzuala' },
                { id: 'g4l3', role: 'Secretary', name: 'Tv Chinngoliana' },
                { id: 'g4l4', role: 'Asst. Secretary', name: 'Nl Zosangpuii' },
                { id: 'g4l5', role: 'Treasurer', name: 'Nl. Vungngaihdawni' },
                { id: 'g4l6', role: 'Fin. Secretary', name: 'Tv Lalmalsawmzuala' },
                { id: 'g4l7', role: 'Branch O.B', name: 'Pu V.Lalbiakdika' },
                { id: 'g4l8', role: 'Branch O.B', name: 'Tv Vanlalchhana' },
            ]
        },
    ]
};

const ktpLogoUrl = "https://i.ibb.co/KzQf1j7j/Gemini-Generated-Image-k4xevgk4xevgk4xe.png";

const Fellowship: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const [fellowship, setFellowship] = useState<Ministry | null | undefined>(undefined);

  const isKTP = id === 'ktp';
  const [ktpActiveTab, setKtpActiveTab] = useState('home');
  const [ktpHruaitute, setKtpHruaitute] = useState<KTPHruaitute | null | undefined>(undefined);
  const [loadingKtpData, setLoadingKtpData] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const ktpNavLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'circular', label: '2026 hruaitute', icon: Book },
    { id: 'members', label: 'Member List', icon: List },
    { id: 'history', label: 'Our History', icon: History },
    { id: 'gallery', label: 'Picture Gallery', icon: Camera },
    { id: 'productions', label: 'Productions', icon: Video },
    { id: 'whoswho', label: "Who's Who", icon: UserSquare },
  ];

  useEffect(() => {
    if (!id) return;
    const fetchFellowship = async () => {
        if (!db?.doc) {
            const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
            setFellowship(staticFellowship || null);
            return;
        }

        try {
            const docRef = db.collection('ministries').doc(id);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                setFellowship({ ...docSnap.data(), id: docSnap.id } as Ministry);
            } else {
                console.warn(`Ministry with id ${id} not found in Firestore.`);
                const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
                setFellowship(staticFellowship || null);
            }
        } catch (error) {
            console.error("Error fetching fellowship:", error);
            const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
            setFellowship(staticFellowship || null);
        }
    };
    fetchFellowship();
  }, [id, language]);

  useEffect(() => {
    if (isKTP && ktpActiveTab === 'circular') {
      const fetchKtpData = async () => {
        setLoadingKtpData(true);
        if (!db?.doc) {
          setKtpHruaitute(null);
          setLoadingKtpData(false);
          return;
        }
        try {
          const docRef = db.collection('ktpLeaders').doc('2026');
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            setKtpHruaitute(docSnap.data() as KTPHruaitute);
          } else {
            setKtpHruaitute(null);
          }
        } catch (error) {
          console.error("Error fetching KTP Hruaitute:", error);
          setKtpHruaitute(null);
        }
        setLoadingKtpData(false);
      };
      fetchKtpData();
    }
  }, [isKTP, ktpActiveTab]);

  const handleSaveKtpData = async (data: KTPHruaitute) => {
    setLoadingKtpData(true);
    if (!db?.doc) {
      alert("Database not available.");
      setLoadingKtpData(false);
      return;
    }
    try {
      await db.collection('ktpLeaders').doc(String(data.year)).set(data);
      setKtpHruaitute(data);
      setIsEditModalOpen(false);
      alert("Hruaitute updated successfully!");
    } catch (error) {
      console.error("Error saving KTP data:", error);
      alert("Failed to save data.");
    }
    setLoadingKtpData(false);
  };
  
  const KtpContentPlaceholder = ({ tabId }: { tabId: string }) => {
    const tab = ktpNavLinks.find(l => l.id === tabId);
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold text-slate-700">Content Coming Soon</h3>
        <p className="text-slate-500 mt-2">The "{tab?.label}" section is under construction.</p>
      </div>
    );
  };

  if (fellowship === undefined) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-10 w-10 text-church-500" /></div>;
  if (!fellowship) return <Navigate to="/worship" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-church-900 text-white py-20">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={fellowship.image} 
            alt={fellowship.name} 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {isKTP ? (
            <img src={ktpLogoUrl} alt="KTP Logo" className="mx-auto h-24 w-24 mb-6 rounded-full shadow-lg bg-white/10 p-1" />
          ) : fellowship.acronym ? (
            <span className="inline-block py-1 px-3 rounded-full bg-church-500 text-white text-sm font-bold tracking-wide mb-4">
              {fellowship.acronym}
            </span>
          ) : null}
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">{fellowship.name}</h1>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
            {fellowship.description}
          </p>
        </div>
      </div>

      {isKTP ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8 overflow-x-auto">
            <nav className="flex">
              {ktpNavLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => setKtpActiveTab(link.id)}
                  className={`flex items-center gap-2 px-5 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors duration-200 ${
                    ktpActiveTab === link.id
                      ? 'border-church-500 text-church-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <link.icon size={16} />
                  {link.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 min-h-[300px]">
            {ktpActiveTab === 'home' ? (
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Leadership & Schedule</h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-church-50 text-church-600 rounded-lg"><Users size={24} /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">Leader</h3>
                        <p className="text-slate-600 mt-1">{fellowship.leader}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Clock size={24} /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">Regular Meeting</h3>
                        <p className="text-slate-600 mt-1">{fellowship.schedule}</p>
                      </div>
                    </div>
                  </div>
                </div>
            ) : ktpActiveTab === 'circular' ? (
              loadingKtpData ? <div className="text-center py-20"><Loader className="animate-spin h-8 w-8 text-church-500 mx-auto" /></div> :
              ktpHruaitute ? <KTPHruaituteView data={ktpHruaitute} onEdit={() => setIsEditModalOpen(true)} isAdmin={isAdmin} /> :
              <KTPDataMissing onSetup={() => setIsEditModalOpen(true)} isAdmin={isAdmin} />
            ) : (
              <KtpContentPlaceholder tabId={ktpActiveTab} />
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Leadership & Schedule</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-church-50 text-church-600 rounded-lg">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Leader</h3>
                  <p className="text-slate-600 mt-1">{fellowship.leader}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Regular Meeting</h3>
                  <p className="text-slate-600 mt-1">{fellowship.schedule}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100">
               <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                 <Calendar className="mr-2 text-church-500" size={20} /> Upcoming Activities
               </h3>
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center text-slate-500 italic">
                 No specific activities scheduled for this week. Please check Announcements for updates.
               </div>
            </div>
          </div>
        </div>
      )}
      
      {isEditModalOpen && <KTPHruaituteEditModal data={ktpHruaitute || INITIAL_KTP_2026_DATA} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveKtpData} />}
    </div>
  );
};

const formatWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) return `https://wa.me/91${cleaned}`;
    if (cleaned.startsWith('91') && cleaned.length === 12) return `https://wa.me/${cleaned}`;
    return `https://wa.me/${cleaned}`;
};

const KTPHruaituteView: React.FC<{ data: KTPHruaitute, onEdit: () => void, isAdmin: boolean }> = ({ data, onEdit, isAdmin }) => (
    <div>
        <div className="flex justify-between items-start mb-6 pb-4 border-b">
            <div className="flex items-center gap-4">
                <img src={ktpLogoUrl} alt="KTP Logo" className="h-16 w-16 rounded-full shadow-md bg-white p-1" />
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">KTP HRUAITUTE {data.year}</h2>
                    <p className="text-slate-500">Kristian Ṭhalai Pawl, Bethel Branch</p>
                </div>
            </div>
            {isAdmin && <button onClick={onEdit} className="flex items-center gap-2 text-xs font-bold text-white bg-church-600 hover:bg-church-700 px-3 py-2 rounded-full transition shadow-md"><Edit size={14} /> Edit</button>}
        </div>

        <Section title="Office Bearers">
            {data.leaders.map(p => <PersonCard key={p.id} person={p} formatWhatsAppLink={formatWhatsAppLink} />)}
        </Section>
        <Section title="Committee Members">
            {data.committeeMembers.map(p => <PersonCard key={p.id} person={p} formatWhatsAppLink={formatWhatsAppLink} />)}
        </Section>
        <Section title="Kohhran Committee Aiawhte & Ex-Officio">
            {data.exOfficioMembers.map(p => <PersonCard key={p.id} person={p} formatWhatsAppLink={formatWhatsAppLink} />)}
        </Section>
        
        {data.groupLeaders && data.groupLeaders.length > 0 && (
            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">GROUP Hruaitute</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.groupLeaders.map(group => <GroupCard key={group.id} group={group} />)}
                </div>
            </div>
        )}
    </div>
);

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{title}</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children}
        </div>
    </div>
);

const PersonCard: React.FC<{ person: KTPMember, formatWhatsAppLink: (phone: string) => string }> = ({ person, formatWhatsAppLink }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
        <p className="font-bold text-slate-900">{person.name}</p>
        {person.role && <p className="text-xs text-church-600 font-semibold">{person.role}</p>}
        {person.phone && person.phone !== 'N/A' && (
             <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-500 mt-1 hover:text-green-600 transition">
                <Phone size={12} /> {person.phone}
            </a>
        )}
    </div>
);

const GroupCard: React.FC<{ group: KTPGroup }> = ({ group }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h4 className="font-bold text-church-800 border-b border-slate-200 pb-2 mb-2">Group: {group.groupName}</h4>
        <ul className="space-y-1.5">
            {group.members.map(member => (
                <li key={member.id} className="text-sm flex justify-between">
                    <span className="text-slate-600">{member.role}:</span>
                    <span className="font-semibold text-slate-900 text-right">{member.name}</span>
                </li>
            ))}
        </ul>
    </div>
);

const KTPDataMissing: React.FC<{ onSetup: () => void, isAdmin: boolean }> = ({ onSetup, isAdmin }) => (
    <div className="text-center py-20">
        <img src={ktpLogoUrl} alt="KTP Logo" className="mx-auto h-20 w-20 mb-6 opacity-50" />
        <h3 className="text-xl font-bold text-slate-700">Hruaitute Details Not Available</h3>
        <p className="text-slate-500 mt-2">Information for {INITIAL_KTP_2026_DATA.year} has not been added yet.</p>
        {isAdmin && (
            <button onClick={onSetup} className="mt-6 flex items-center mx-auto gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition shadow-md">
                <PlusCircle size={16} /> Setup {INITIAL_KTP_2026_DATA.year} Hruaitute
            </button>
        )}
    </div>
);

const KTPHruaituteEditModal: React.FC<{ data: KTPHruaitute, onClose: () => void, onSave: (data: KTPHruaitute) => Promise<void> }> = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState<KTPHruaitute>(JSON.parse(JSON.stringify(data))); // Deep copy
    const [isSaving, setIsSaving] = useState(false);

    const handleMemberChange = (listName: 'leaders' | 'committeeMembers' | 'exOfficioMembers', index: number, field: keyof KTPMember, value: string) => {
        const list = formData[listName] as KTPMember[];
        const newList = [...list];
        (newList[index] as any)[field] = value;
        setFormData({ ...formData, [listName]: newList });
    };
    
    const addMember = (listName: 'leaders' | 'committeeMembers' | 'exOfficioMembers') => {
        const list = formData[listName] as KTPMember[];
        const newList = [...list, { id: `new-${Date.now()}`, name: '', phone: '', role: listName !== 'committeeMembers' ? 'New Role' : '' }];
        setFormData({ ...formData, [listName]: newList });
    };

    const removeMember = (listName: 'leaders' | 'committeeMembers' | 'exOfficioMembers', id: string) => {
        const list = formData[listName] as KTPMember[];
        const newList = list.filter(m => m.id !== id);
        setFormData({ ...formData, [listName]: newList });
    };
    
    const handleGroupChange = (groupIndex: number, field: keyof KTPGroup, value: string) => {
        const newGroups = [...(formData.groupLeaders || [])];
        (newGroups[groupIndex] as any)[field] = value;
        setFormData({ ...formData, groupLeaders: newGroups });
    };

    const handleGroupMemberChange = (groupIndex: number, memberIndex: number, field: keyof KTPMember, value: string) => {
        const newGroups = [...(formData.groupLeaders || [])];
        const newMembers = [...newGroups[groupIndex].members];
        (newMembers[memberIndex] as any)[field] = value;
        newGroups[groupIndex] = { ...newGroups[groupIndex], members: newMembers };
        setFormData({ ...formData, groupLeaders: newGroups });
    };
    
    const addGroup = () => {
        const newGroup: KTPGroup = { id: `new-group-${Date.now()}`, groupName: 'New Group', members: [] };
        setFormData({ ...formData, groupLeaders: [...(formData.groupLeaders || []), newGroup] });
    };

    const removeGroup = (groupId: string) => {
        const newGroups = (formData.groupLeaders || []).filter(g => g.id !== groupId);
        setFormData({ ...formData, groupLeaders: newGroups });
    };
    
    const addGroupMember = (groupIndex: number) => {
        const newGroups = [...(formData.groupLeaders || [])];
        const newMembers = [...newGroups[groupIndex].members, { id: `new-member-${Date.now()}`, name: '', role: 'New Role', phone: '' }];
        newGroups[groupIndex] = { ...newGroups[groupIndex], members: newMembers };
        setFormData({ ...formData, groupLeaders: newGroups });
    };

    const removeGroupMember = (groupIndex: number, memberId: string) => {
        const newGroups = [...(formData.groupLeaders || [])];
        const newMembers = newGroups[groupIndex].members.filter(m => m.id !== memberId);
        newGroups[groupIndex] = { ...newGroups[groupIndex], members: newMembers };
        setFormData({ ...formData, groupLeaders: newGroups });
    };


    const handleSaveClick = async () => {
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    const MemberRow: React.FC<{listName: 'leaders' | 'committeeMembers' | 'exOfficioMembers', member: KTPMember, index: number, hasRole: boolean}> = ({listName, member, index, hasRole}) => (
        <div className="grid grid-cols-12 gap-2 items-center">
            {hasRole && <input className="col-span-3 border p-2 text-sm rounded" placeholder="Role" value={member.role || ''} onChange={e => handleMemberChange(listName, index, 'role', e.target.value)} />}
            <input className={hasRole ? "col-span-4" : "col-span-7"} placeholder="Name" value={member.name} onChange={e => handleMemberChange(listName, index, 'name', e.target.value)} />
            <input className="col-span-4" placeholder="Phone" value={member.phone || ''} onChange={e => handleMemberChange(listName, index, 'phone', e.target.value)} />
            <button type="button" onClick={() => removeMember(listName, member.id)} className="col-span-1 text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-bold">Edit KTP Hruaitute {formData.year}</h3><button onClick={onClose}><X/></button></div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <h4 className="font-bold mb-2">Office Bearers</h4>
                        <div className="space-y-2">{formData.leaders.map((p, i) => <MemberRow key={p.id} listName="leaders" member={p} index={i} hasRole={true}/>)}</div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Committee Members</h4>
                        <div className="space-y-2">{formData.committeeMembers.map((p, i) => <MemberRow key={p.id} listName="committeeMembers" member={p} index={i} hasRole={false}/>)}</div>
                        <button type="button" onClick={() => addMember('committeeMembers')} className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1"><PlusCircle size={14}/> Add Committee Member</button>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Ex-Officio Members</h4>
                        <div className="space-y-2">{formData.exOfficioMembers.map((p, i) => <MemberRow key={p.id} listName="exOfficioMembers" member={p} index={i} hasRole={true}/>)}</div>
                        <button type="button" onClick={() => addMember('exOfficioMembers')} className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1"><PlusCircle size={14}/> Add Ex-Officio</button>
                    </div>
                    <div className="border-t pt-4">
                         <h4 className="font-bold mb-2">Group Hruaitute</h4>
                         <div className="space-y-4">
                             {(formData.groupLeaders || []).map((group, groupIndex) => (
                                <div key={group.id} className="p-4 border rounded-lg bg-slate-50 space-y-3">
                                    <div className="flex items-center gap-2">
                                       <input className="font-bold text-lg w-full border-b bg-transparent" value={group.groupName} onChange={(e) => handleGroupChange(groupIndex, 'groupName', e.target.value)} />
                                       <button type="button" onClick={() => removeGroup(group.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="space-y-2">
                                       {group.members.map((member, memberIndex) => (
                                          <div key={member.id} className="grid grid-cols-12 gap-2 items-center">
                                              <input className="col-span-4 border p-2 text-sm rounded" placeholder="Role" value={member.role || ''} onChange={e => handleGroupMemberChange(groupIndex, memberIndex, 'role', e.target.value)} />
                                              <input className="col-span-7" placeholder="Name" value={member.name} onChange={e => handleGroupMemberChange(groupIndex, memberIndex, 'name', e.target.value)} />
                                              <button type="button" onClick={() => removeGroupMember(groupIndex, member.id)} className="col-span-1 text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                                          </div>
                                       ))}
                                    </div>
                                    <button type="button" onClick={() => addGroupMember(groupIndex)} className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1"><UserPlus size={14}/> Add Member</button>
                                </div>
                             ))}
                         </div>
                         <button type="button" onClick={addGroup} className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full transition shadow-sm mt-4 flex items-center gap-1"><Plus size={16}/> Add Group</button>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end space-x-2 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 bg-church-600 text-white rounded flex items-center disabled:opacity-50" disabled={isSaving}>
                        {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Fellowship;
