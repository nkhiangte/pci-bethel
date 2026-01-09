
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { Users, MapPin, User, ChevronDown, ChevronUp, Database, Loader } from 'lucide-react';

interface UpaBialData {
  id: string; // e.g., 'bial-1'
  number: number;
  areaDescription: string;
  leader: string;
  members: string[];
}

const INITIAL_BIAL_DATA: UpaBialData[] = [
  {
    id: 'bial-1',
    number: 1,
    areaDescription: 'Venglai Kawng phei chung lam zawng leh DC Complex hlui zawng',
    leader: 'Upa PC Lalhmingliana',
    members: ['Pu C Lalrawngbawla', 'Pu Lalmuanpuia']
  },
  {
    id: 'bial-2',
    number: 2,
    areaDescription: 'MJA Building leh BSI Building atangin Pu K Lalrawna In thlengin chhuah lam zawng',
    leader: 'Upa Lalremruata',
    members: ['Pu C Rohmingliana', 'Pu JC Laldinthara']
  },
  {
    id: 'bial-3',
    number: 3,
    areaDescription: 'Upa PC Lalhmingliana In atangin kawngui dung zelah Pu L Khenpauva In huamin Biak In leh Soil Comlex huamin chhuah lam zawng',
    leader: 'Upa R Lalramhluna',
    members: ['Pu Thanglianmanga', 'Pu H Lalzuitluanga']
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
    members: ['Pu Kapthuama', 'Pu Thangdeihchina']
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
    members: ['Pu Nelson Khiangte', 'Pu C Lalengmawia']
  },
  {
    id: 'bial-9',
    number: 9,
    areaDescription: 'Upa R Lalramhluna In atangin Chhura hmun mual zawng',
    leader: 'Upa Hmingthanmawia Sailo',
    members: ['Pu K Lalengthanga', 'Pu T Sangtluanga', 'Pu Khawlrosiama']
  },
  {
    id: 'bial-10',
    number: 10,
    areaDescription: 'Chhura hmun peng atangin kawngpui dungah Vengthar ramri thlengin, Mualnuam mual huamin tlak lam zawng',
    leader: 'Upa Lianpianga',
    members: ['Pu Lalramthara', 'Pu Lalramnghakhlela', 'Pu K Lalengkima']
  },
  {
    id: 'bial-11',
    number: 11,
    areaDescription: 'Pu PC Thanhluma In atangin Kohhran ram huamin, Vengthar ramri su in kawngpui dung chhuah lam zawng',
    leader: 'Upa HT Vanlalsawma',
    members: ['Pu Keneth Lalthanzauva', 'Pu PC Zoramthanga']
  },
  {
    id: 'bial-12',
    number: 12,
    areaDescription: 'Pu T Sawmpauva In bul step atangin Pu Salmanga tuikhur suin chhuah lam mual zawng',
    leader: 'Upa C Zohmingthanga',
    members: ['Pu C Malsawmdawngliana', 'Pu Lalthanghulha']
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

  useEffect(() => {
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
          const fetchedData = snapshot.docs.map(doc => doc.data() as UpaBialData);
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

    fetchBials();
  }, []);

  const handleSeedData = async () => {
    if (!db || !db.collection || !window.confirm("Overwrite Upa Bial data in Firebase?")) return;
    setIsSeeding(true);
    try {
      const batch = db.batch();
      const ref = db.collection('upaBials');
      
      // Delete existing to avoid duplicates if ID strategy changes (though here we use fixed IDs)
      const snapshot = await ref.get();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));

      INITIAL_BIAL_DATA.forEach(item => {
        const doc = ref.doc(item.id);
        batch.set(doc, item);
      });
      await batch.commit();
      alert("Data seeded successfully!");
      setBials(INITIAL_BIAL_DATA);
    } catch (e) {
      console.error("Error seeding:", e);
      alert("Failed to seed data.");
    }
    setIsSeeding(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">Kohhran Upa Bialte</h1>
          <p className="max-w-2xl mx-auto text-slate-600">Pastoral Care Districts and Leaders</p>
        </div>

        {/* Map Embed */}
        <div className="mb-12 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
             <iframe 
               src="https://www.google.com/maps/d/embed?mid=1Xns6BCmnqrgImcTeDiWKwYGyRqS_zJo" 
               width="100%" 
               height="480" 
               style={{ border: 0 }}
               title="Upa Bial Map"
               loading="lazy"
             ></iframe>
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

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bials.map((bial) => {
              const isExpanded = expandedId === bial.id;
              
              return (
                <div key={bial.id} className={`bg-white rounded-xl border transition-all duration-300 ${isExpanded ? 'shadow-lg border-church-300 ring-1 ring-church-200 col-span-1 md:col-span-2 lg:col-span-3' : 'shadow-sm border-slate-200 hover:shadow-md'}`}>
                  <button 
                    onClick={() => toggleExpand(bial.id)}
                    className="w-full text-left p-6 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-church-50 text-church-600 flex items-center justify-center font-bold text-lg shadow-sm border border-church-100 shrink-0">
                        {bial.number}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">BIAL - {bial.number}</h3>
                        <p className="text-sm text-church-600 font-medium">{bial.leader}</p>
                      </div>
                    </div>
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-0 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200 bg-slate-50/50 rounded-b-xl">
                      <div className="mt-4 grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                            <MapPin size={14} className="mr-1" /> Huam Chhung (Area)
                          </h4>
                          <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                            {bial.areaDescription}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                            <Users size={14} className="mr-1" /> Bialtu Dangte (Assistants)
                          </h4>
                          <ul className="space-y-2">
                            {bial.members.map((member, idx) => (
                              <li key={idx} className="flex items-center text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 shadow-sm">
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs mr-3 font-bold">{idx + 1}</span>
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
    </div>
  );
};

export default UpaBial;
