
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ChevronDown, ChevronUp, Mic, BookOpen, Users, Database, Loader, Search } from 'lucide-react';

interface ChanvoGroup {
  id: string;
  title: string;
  subGroups?: { title: string; members: string[] }[];
  members?: string[];
}

export const SEED_DATA: ChanvoGroup[] = [
  {
    id: 'thuhriltute',
    title: 'THUHRILTUTE',
    subGroups: [
      {
        title: 'Pathianni Zan',
        members: ['Kohhran Committee te']
      },
      {
        title: 'Pathianni Chawhnu',
        members: [
          'Pu K.Lalduha', 'Pu V.Lalpianga', 'Pu C.Roliana', 'Pi PC Lalhmachhuani',
          'Pu K.Lalduata', 'Pu H.Vanlalthanga', 'Pu K.Lalduhawma', 'Pu K.Thuamluaia',
          'Pu Dawngsuanpauva', 'Upa G.Vanlallawma', 'Pu P.Lalhmingthanga', 'Pu V.Lalbiakzuala',
          'Pu MS Dawngliana', 'Rev.Vankhuma', 'Pu R.Lalremmawia', 'Pu GF Thanga',
          'Pu C.Rokima', 'Pu Lalramthara', 'Pu C.Vanlalruata', 'Pu Kamdingliana Sailo'
        ]
      },
      {
        title: 'Inrinni Zan',
        members: [
          'Pu K.Lalengthanga', 'Pu Lalmuanpuia Ralte', 'Pi Sapzingi', 'Pi C.Chawngpuii',
          'Pu R.Lalmalsawma', 'Pu Lalsanglura Zote', 'Pu R.Lalrintluanga', 'Pi R.Ramengzuali',
          'Pu C.Rohmingliana', 'Pi V.Sangkungi', 'Pu JC Laldinthara', 'Pu C.Malsawmdawngliana',
          'Pu Lalhmingmawia', 'Pi Lalhlimthangi Khiangte', 'Pu C.Lalrawngbawla', 'Pu C.Lalmuansanga',
          'Pu T.Zaitawna', 'Pu Thanglianmanga', 'Pu Kapthuama', 'Pu B.Zelkhangova',
          'Pi K.Malsawmdawngi', 'Pu Zoramenga'
        ]
      }
    ]
  },
  {
    id: 'nilai-zan',
    title: 'NILAI ZAN THUPUI HAWNGTUTE',
    members: [
      'Pu Vanlalhriata', 'Nl.Ngurbawitluangi', 'Pu Kenneth Lalthanzauva', 'Pi Lalbiakkungi',
      'Pu Saihmingliana Sailo', 'Pu T.Sangtluanga', 'Pu Nelson Khiangte', 'Nl.Lalrammawii Renthlei',
      'Pu TK Manga', 'Pu V.Lalbiakdika', 'Pu F.Lalduhawma', 'Tv.H.Lalfakawma',
      'Pi Malsawmi Tlau', 'Pi K.Thangkimi', 'Pi PC Lalnunsangi', 'Pi C.Lallawmsangi',
      'Pi R.Lalromawii', 'Pu Khawlrosiama', 'Pu F.Lalhriatpuia', 'Pu L.Khenpauva',
      'Pu Manliankhupa', 'Tv.Thangdeihmanga', 'Pu Thangkunga Hualngo', 'Pu C.Rodinthara',
      'Tv.Vanlalchhana', 'Pu Lalramnghakhlela', 'Pu Mungngaihsanga', 'Nl.PC Lalrintluangi',
      'Nl.Lallawmzuali'
    ]
  },
  {
    id: 'tantute',
    title: 'TANTUTE',
    subGroups: [
      {
        title: 'Sunday School',
        members: [
          'Pi Khawlchuani', 'Pi Lalhmunsangi', 'Pi Lalthlengliani', 'Pi H.Lalremtluangi',
          'Pi K.Zohmingthangi', 'Pi Lalrawngbawli', 'Pi Laltlanchhingi', 'Pi Lalramengi',
          'Pi C.Lalhmingmawii', 'Pi Dimdeihsiani', 'Pi F.Lalthianghlimi', 'Pi R.Vanlalhruaii',
          'Pi Rosiammawii', 'Pi V.Lalhmangaihi', 'Pi Vanlalruati', 'Pi R.Lalngaihzuali',
          'Pi Rothangveli', 'Pi Laltlanzami', 'Pi PC Lalnunpuii', 'Pi C.Lalmalsawmi',
          'Pi PC Thuami', 'Pi R.Lallawmkimi', 'Pi Dimzaliani', 'Pi Vanlalengi',
          'Pi Lalthanzuali', 'Pi Vanlalawii', 'Pi K.Rochharliani', 'Pi R.Lalhmangaihzuali',
          'Pi Lalramchuani', 'Pi R.Lalniengi'
        ]
      },
      {
        title: 'Pathianni Chawhnu',
        members: [
          'Pi Awikhani', 'Pi MC Vanlalzuii', 'Pi Chalnghilhlovi', 'Pi Lalrintluangi',
          'Pi Lalbiakzami', 'Pi Challianmawii', 'Pi B.Ronghaki', 'Pu Tawnliana',
          'Pi LD Thangi', 'Pi C.Lalthangpuii', 'Pi K.Zosiami', 'Pi Lalbiakhnuni',
          'Pi Dimdawnchingi', 'Pi Thangkimi', 'Pi S.Vanlalvuani', 'Pu Langkhansuana',
          'Pi Rinsangkhumi', 'Pi Lalherliani', 'Pi Lalnunziri', 'Pi Lalkutthangi',
          'Pi PS Ronghaki', 'Pi Siamliani', 'Pi C.Lainguri', 'Pi NK Pari',
          'Pi F.Lalrawngbawli', 'Pi F.Lalduati', 'Pi TS Ningi', 'Pi Lunngaihkimi',
          'Pi Gochingi', 'Pu K.Vanengmawia', 'Pu VLP Zarzokima', 'Pi Aimawii',
          'Pi Lalthapuii'
        ]
      },
      {
        title: 'Nilai leh Inrinni Zan',
        members: [
          'Nl.Lalmuanpuii', 'Nl.Lalmuanchhungi', 'Pi LR Dinsangi', 'Pi Hmingthanmawii',
          'Pi C.Lalchhandami', 'Pi K.Lalbiakthangi', 'Pi H.Lallawmkimi', 'Pi Vanlalnghaki Colney',
          'Pi K.Malsawmtluangi', 'Pi Lalmuanpuii Hlawndo', 'Pu Lalchhanhima', 'Pi Lalzokhumi',
          'Pi Awingaihluni', 'Pi Mary Lalnunmawii', 'Pi Lianngaihmani', 'Pu H.Lalfela',
          'Pi R.R.Zairemthangi', 'Pi Hmingchungnungi', 'Pu C.Lalengmawia', 'Pi Rakilpari',
          'Pi Lalmuanzuali Varte', 'Pi Chingsawmliani', 'Pi C.Lalhruaitluangi', 'Pi Zorammuani',
          'Pi Lalbiakdiki', 'Pi K.Lalrokhumi', 'Pi Lalhmunengi', 'Pi Lynda Vanlalruati',
          'Nl.PC Lalthanmawii', 'Pi Lalremchhungi Pautu', 'Pi Lalchhuanawmi', 'Pi Chinghaumangi',
          'Pi Lalchawiliani', 'Pu Zonunmawia Khiangte', 'Pu K.Pianthanga', 'Pu K.Lalengkima',
          'Pu Lalmuanpuia', 'Pu Thangbuanga Guite', 'Pi Lalhlimpuii', 'Pi Lalsiamliani',
          'Pi KC Lalnunhlimi', 'Pi Lalruatthangi', 'Nl.Zodinpuii', 'Pi Cicily Lalrindiki',
          'Pi Lalchhanhimi', 'Pi H.Lalrintluangi', 'Pi Siamthangpuii', 'Pi Lalremruati',
          'Pi C.Lalrokimi', 'Pi Lalhrilmawii'
        ]
      }
    ]
  }
];

const InkhawmChanvo: React.FC = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<ChanvoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!db || !db.collection) {
        setData(SEED_DATA);
        setLoading(false);
        return;
      }

      try {
        const snapshot = await db.collection('inkhawmChanvo').get();
        if (!snapshot.empty) {
          const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChanvoGroup));
          // Sort to match order: Thuhriltute, Nilai Zan, Tantute
          const sorted = fetchedData.sort((a, b) => {
             const order = ['thuhriltute', 'nilai-zan', 'tantute'];
             return order.indexOf(a.id) - order.indexOf(b.id);
          });
          setData(sorted);
        } else {
          setData(SEED_DATA);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setData(SEED_DATA);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSeedData = async () => {
    if (!db || !db.collection || !window.confirm("Overwrite Inkhawm Chanvo data in Firebase?")) return;
    setIsSeeding(true);
    try {
      const batch = db.batch();
      const ref = db.collection('inkhawmChanvo');
      SEED_DATA.forEach(item => {
        const doc = ref.doc(item.id);
        batch.set(doc, item);
      });
      await batch.commit();
      alert("Data seeded successfully!");
      setData(SEED_DATA);
    } catch (e) {
      console.error("Error seeding:", e);
      alert("Failed to seed data.");
    }
    setIsSeeding(false);
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const filterMembers = (members: string[]) => {
    if (!searchTerm) return members;
    return members.filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const hasMatches = (group: ChanvoGroup) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    if (group.members) {
      return group.members.some(m => m.toLowerCase().includes(term));
    }
    if (group.subGroups) {
      return group.subGroups.some(sub => sub.members.some(m => m.toLowerCase().includes(term)));
    }
    return false;
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'thuhriltute': return <Mic size={24} />;
      case 'nilai-zan': return <Users size={24} />;
      case 'tantute': return <BookOpen size={24} />;
      default: return <Users size={24} />;
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">Inkhawm Chanvo</h1>
          <p className="text-slate-600">List of members assigned for various church services.</p>
        </div>

        {isAdmin && (
          <div className="text-center mb-8">
            <button 
              onClick={handleSeedData} 
              disabled={isSeeding}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 text-sm"
            >
              {isSeeding ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Database size={16} className="mr-2" />}
              Seed/Reset List
            </button>
          </div>
        )}

        <div className="mb-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Search name..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-church-500 outline-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
        ) : (
          <div className="space-y-6">
            {data.filter(hasMatches).map((group) => {
              const isOpen = openSections.includes(group.title) || !!searchTerm;
              const Icon = getIcon(group.id);

              return (
                <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <button 
                    onClick={() => toggleSection(group.title)}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-church-50 text-church-600 rounded-lg">{Icon}</div>
                      <h3 className="font-bold text-lg text-slate-800">{group.title}</h3>
                    </div>
                    <div className="text-slate-400">
                      {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-in slide-in-from-top-2 duration-200">
                      {group.subGroups ? (
                        <div className="space-y-6">
                          {group.subGroups.map((sub, idx) => {
                             const filtered = filterMembers(sub.members);
                             if (filtered.length === 0 && searchTerm) return null;
                             
                             return (
                                <div key={idx}>
                                  <h4 className="font-bold text-church-700 mb-3 border-b border-church-200 pb-1 inline-block">{sub.title}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filtered.map((member, mIdx) => (
                                      <div key={mIdx} className="bg-white p-3 rounded border border-slate-200 text-sm font-medium text-slate-700 shadow-sm">
                                        <span className="text-slate-400 mr-2 text-xs">{sub.members.indexOf(member) + 1}.</span> {member}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                             );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filterMembers(group.members || []).map((member, mIdx) => (
                            <div key={mIdx} className="bg-white p-3 rounded border border-slate-200 text-sm font-medium text-slate-700 shadow-sm">
                               <span className="text-slate-400 mr-2 text-xs">{(group.members?.indexOf(member) || 0) + 1}.</span> {member}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Empty State for Search */}
                      {searchTerm && !hasMatches(group) && (
                          <p className="text-center text-slate-500 py-4 italic">No matches found in this category.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {data.filter(hasMatches).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <p>No results found for "{searchTerm}"</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InkhawmChanvo;
