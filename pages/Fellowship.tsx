
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { Ministry, KTPHruaitute, KTPMember, KTPGroup, KTPBudget, BudgetItem, KTPSubCommittee } from '../types';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Users, Calendar, Loader, Home, Book, List, History, Camera, Video, UserSquare, Edit, Phone, Save, X, PlusCircle, Trash2, Shield, Plus, UserPlus, DollarSign } from 'lucide-react';

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
        { id: 'eo1', name: 'Upa David Lalchhanhima', phone: '9862630996', role: 'Kohhran Committee Aiawhte' },
        { id: 'eo2', name: 'Upa Hmingthanmawia Sailo', phone: '9862532256', role: 'Kohhran Committee Aiawhte' },
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
    ],
    subCommittees: [
        {
            id: 'sc1', name: 'PROGRAMME', members: [
                { id: 'sc1-c', role: 'Chairman', name: 'Pu V.Lalbiakdika' },
                { id: 'sc1-s', role: 'Secretary', name: 'Tv Vanlalchhana' },
                { id: 'sc1-m1', name: 'Pu Zoramenga' }, { id: 'sc1-m2', name: 'Tv Thangdeihmanga' },
                { id: 'sc1-m3', name: 'Tv H.Lalfakawma' }, { id: 'sc1-m4', name: 'Nl Lallawmzuali' },
                { id: 'sc1-m5', name: 'Pu Tluangzathanga' }, { id: 'sc1-m6', name: 'Tv B.Thangzauva' },
                { id: 'sc1-m7', name: 'Pu C.Ramtharnghaka' }, { id: 'sc1-m8', name: 'Tv Vanlalzauva' },
                { id: 'sc1-m9', name: 'Tv Thangzasanga' }, { id: 'sc1-m10', name: 'Tv Lalhmuliana' },
                { id: 'sc1-m11', name: 'Tv Lalrochawia' }, { id: 'sc1-m12', name: 'Tv Chinngoliana' },
            ]
        },
        {
            id: 'sc2', name: 'MUSIC', members: [
                { id: 'sc2-c', role: 'Chairman', name: 'Tv Thangdeihmanga' },
                { id: 'sc2-cd', role: 'Conductor', name: 'Tv. Liankhankhama' },
                { id: 'sc2-acd', role: 'Asst. Conductor', name: 'Pu K.Lalramngheta' },
                { id: 'sc2-m1', name: 'Tv PB Hmangaihropuia' },
                { id: 'sc2-m2', name: 'Pu Manliankhupa' },
                { id: 'sc2-m3', name: 'Tv C.Lalhumhima' },
            ]
        },
        {
            id: 'sc3', name: 'REFRESHMENT', members: [
                { id: 'sc3-c', role: 'Chairman', name: 'Nl. Lallawmzuali' },
                { id: 'sc3-s', role: 'Secretary', name: 'Pu Vanlalzamlova' },
                { id: 'sc3-m1', name: 'Nl B.Lalnunsiami' }, { id: 'sc3-m2', name: 'Pu T.Lalramnghaka' },
                { id: 'sc3-m3', name: 'Pu Vanlalruatpuia' }, { id: 'sc3-m4', name: 'Pu Lalthangliana' },
                { id: 'sc3-m5', name: 'Nl Chingsawmluni' },
            ]
        },
        {
            id: 'sc4', name: 'EVANGELICAL', members: [
                { id: 'sc4-c', role: 'Chairman', name: 'Tv H.Lalfakawma' },
                { id: 'sc4-s', role: 'Secretary', name: 'Nl Ningsianmawii' },
                { id: 'sc4-m1', name: 'Nl B.Lalnunsiami' }, { id: 'sc4-m2', name: 'Nl Lalnunthari' },
                { id: 'sc4-m3', name: 'Pu C.Lalchhanhima' }, { id: 'sc4-m4', name: 'Tv Vanlaldanmawia' },
                { id: 'sc4-m5', name: 'Nl Baby Romalsawmi' }, { id: 'sc4-m6', name: 'Nl Anny Lalliandawli' },
                { id: 'sc4-m7', name: 'Nl B.Lalrinfeli' },
            ]
        },
        {
            id: 'sc5', name: 'PROPERTY & DECORATION', members: [
                { id: 'sc5-c', role: 'Chairman', name: 'Tv. Vanlalchhana' },
                { id: 'sc5-s', role: 'Secretary', name: 'Pu. Lalhmunngheta' },
                { id: 'sc5-m1', name: 'Pu V.Lalbiakdika' }, { id: 'sc5-m2', name: 'Pu Zoramenga' },
                { id: 'sc5-m3', name: 'Tv Thangdeihmanga' }, { id: 'sc1-m4', name: 'Tv H.Lalfakawma' },
                { id: 'sc5-m5', name: 'Nl. Lallawmzuali' },
            ]
        },
        {
            id: 'sc6', name: 'MEDIA & DOCUMENTATION', members: [
                { id: 'sc6-c', role: 'Chairman', name: 'Pu Zoramenga' },
                { id: 'sc6-s', role: 'Secretary', name: 'Pu Manliankhupa' },
                { id: 'sc6-m1', name: 'Pu V.Lalbiakdika' }, { id: 'sc6-m2', name: 'Tv Thangdeihmanga' },
                { id: 'sc6-m3', name: 'Tv Vanlalchhana' }, { id: 'sc6-m4', name: 'Tv H.Lalfakawma' },
                { id: 'sc6-m5', name: 'Nl Lallawmzuali' }, { id: 'sc6-m6', name: 'Tv C.Lalmuankima' },
                { id: 'sc6-m7', name: 'Tv Pauengliana' }, { id: 'sc6-m8', name: 'Tv Lalhmangaihsanga' },
            ]
        }
    ]
};

const INITIAL_KTP_2026_BUDGET: KTPBudget = {
    year: 2026,
    income: [
      { id: 'i1', item: "Faith Promise", amount: "420000" },
      { id: 'i2', item: "Inkhawm Thilpek", amount: "160500" },
      { id: 'i3', item: "Group Budget", amount: "100000" },
      { id: 'i4', item: "Comt. Budget", amount: "10500" },
      { id: 'i5', item: "Inhlawhna", amount: "80000" },
      { id: 'i6', item: "Opening Balance", amount: "632226" },
    ],
    expenditure: [
      { id: 'e1', item: "Missionary chawmna", amount: "96000" },
      { id: 'e2', item: "Bial KTP Budget", amount: "65000" },
      { id: 'e3', item: "Bial Conf/meet thlengtu puina", amount: "10000" },
      { id: 'e4', item: "Property tihchangtlunna", amount: "150000" },
      { id: 'e5', item: "Half Yearly meet", amount: "80000" },
      { id: 'e6', item: "KTP inkhawm kim lawmman", amount: "20000" },
      { id: 'e7', item: "Synod Rescue Home", amount: "20000" },
      { id: 'e8', item: "Gen. Conference kal na", amount: "30000" },
      { id: 'e9', item: "YRC Special Budget", amount: "15000" },
      { id: 'e10', item: "Branch Golden Jubilee pual", amount: "50000" },
      { id: 'e11', item: "Kohhrana chhunluh", amount: "50000" },
      { id: 'e12', item: "Krismas leh Kumthar pual", amount: "50000" },
      { id: 'e13', item: "Branch in enkawlna", amount: "767266" },
    ],
};


const ktpLogoUrl = "https://i.ibb.co/KzQf1j7j/Gemini-Generated-Image-k4xevgk4xevgk4xe.png";

const Fellowship: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const [fellowship, setFellowship] = useState<Ministry | null | undefined>(undefined);

  const isKTP = id === 'ktp';
  const [ktpActiveTab, setKtpActiveTab] = useState('circular'); // Changed initial tab from 'home' to 'circular'
  
  // State for KTP specific data
  const [ktpHruaitute, setKtpHruaitute] = useState<KTPHruaitute | null | undefined>(undefined);
  const [ktpBudget, setKtpBudget] = useState<KTPBudget | null | undefined>(undefined);
  const [loadingKtpData, setLoadingKtpData] = useState(false);
  const [isHruaituteEditModalOpen, setIsHruaituteEditModalOpen] = useState(false);
  const [isBudgetEditModalOpen, setIsBudgetEditModalOpen] = useState(false);

  const ktpNavLinks = [
    // { id: 'home', label: 'Home', icon: Home }, // Removed Home tab
    { id: 'circular', label: '2026 hruaitute', icon: Book },
    { id: 'sub-committees', label: 'Sub-Committees', icon: Users }, // New tab for Sub-Committees
    { id: 'project-budget', label: 'Project & Budget 2026', icon: DollarSign },
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
    if (!isKTP) return;
    
    const fetchKtpDataForTab = async (tab: string) => {
        setLoadingKtpData(true);
        if (!db?.doc) {
            setKtpHruaitute(null);
            setKtpBudget(null);
            setLoadingKtpData(false);
            return;
        }

        if (tab === 'circular' || tab === 'sub-committees') { // Fetch KTPHruaitute for both these tabs
            try {
                const docRef = db.collection('ktpLeaders').doc('2026');
                const docSnap = await docRef.get();
                setKtpHruaitute(docSnap.exists ? (docSnap.data() as KTPHruaitute) : null);
            } catch (error) {
                console.error("Error fetching KTP Hruaitute:", error);
                setKtpHruaitute(null);
            }
        } else if (tab === 'project-budget') {
            try {
                const docRef = db.collection('ktpBudget').doc('2026');
                const docSnap = await docRef.get();
                setKtpBudget(docSnap.exists ? (docSnap.data() as KTPBudget) : null);
            } catch (error) {
                console.error("Error fetching KTP Budget:", error);
                setKtpBudget(null);
            }
        }
        setLoadingKtpData(false);
    };

    fetchKtpDataForTab(ktpActiveTab);
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
      setIsHruaituteEditModalOpen(false);
      alert("Hruaitute updated successfully!");
    } catch (error) {
      console.error("Error saving KTP data:", error);
      alert("Failed to save data.");
    }
    setLoadingKtpData(false);
  };
  
  const handleSaveKtpBudget = async (data: KTPBudget) => {
    setLoadingKtpData(true);
    if (!db?.doc) {
      alert("Database not available.");
      setLoadingKtpData(false);
      return;
    }
    try {
      await db.collection('ktpBudget').doc(String(data.year)).set(data);
      setKtpBudget(data);
      setIsBudgetEditModalOpen(false);
      alert("Budget updated successfully!");
    } catch (error) {
      console.error("Error saving KTP budget:", error);
      alert("Failed to save budget data.");
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

  const renderKtpTabContent = () => {
    if (loadingKtpData) return <div className="text-center py-20"><Loader className="animate-spin h-8 w-8 text-cyan-500 mx-auto" /></div>;

    switch(ktpActiveTab) {
        case 'home':
            return (
                <div>
                  {/* Removed h2 "Leadership & Schedule" */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-cyan-50 text-cyan-600 rounded-lg"><Users size={24} /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">Leader</h3>
                        <p className="text-slate-600 mt-1">{fellowship.leader}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-cyan-50 text-cyan-600 rounded-lg"><Clock size={24} /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">Regular Meeting</h3>
                        <p className="text-slate-600 mt-1">{fellowship.schedule}</p>
                      </div>
                    </div>
                  </div>
                </div>
            );
        case 'circular':
            return ktpHruaitute ? 
                   <KTPHruaituteView data={ktpHruaitute} onEdit={() => setIsHruaituteEditModalOpen(true)} isAdmin={isAdmin} /> :
                   <KTPDataMissing title="Hruaitute Details" onSetup={() => setIsHruaituteEditModalOpen(true)} isAdmin={isAdmin} year={INITIAL_KTP_2026_DATA.year} />;
        case 'sub-committees': // New case for Sub-Committees
            return ktpHruaitute ?
                   <KTPSubCommitteesView data={ktpHruaitute} onEdit={() => setIsHruaituteEditModalOpen(true)} isAdmin={isAdmin} /> :
                   <KTPDataMissing title="Sub-Committees" onSetup={() => setIsHruaituteEditModalOpen(true)} isAdmin={isAdmin} year={INITIAL_KTP_2026_DATA.year} />;
        case 'project-budget':
            return ktpBudget ?
                   <KTPBudgetView data={ktpBudget} onEdit={() => setIsBudgetEditModalOpen(true)} isAdmin={isAdmin} /> :
                   <KTPDataMissing title="Project & Budget" onSetup={() => setIsBudgetEditModalOpen(true)} isAdmin={isAdmin} year={INITIAL_KTP_2026_BUDGET.year} />;
        default:
            return <KtpContentPlaceholder tabId={ktpActiveTab} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`relative ${isKTP ? 'bg-cyan-800' : 'bg-church-900'} text-white py-20`}>
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
            <span className={`inline-block py-1 px-3 rounded-full ${isKTP ? 'bg-cyan-500' : 'bg-church-500'} text-white text-sm font-bold tracking-wide mb-4`}>
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
                      ? 'border-cyan-500 text-cyan-700'
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
             {renderKtpTabContent()}
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
      
      {isHruaituteEditModalOpen && <KTPHruaituteEditModal data={ktpHruaitute || INITIAL_KTP_2026_DATA} onClose={() => setIsHruaituteEditModalOpen(false)} onSave={handleSaveKtpData} />}
      {isBudgetEditModalOpen && <KTPBudgetEditModal data={ktpBudget || INITIAL_KTP_2026_BUDGET} onClose={() => setIsBudgetEditModalOpen(false)} onSave={handleSaveKtpBudget} />}
    </div>
  );
};

const formatWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) return `https://wa.me/91${cleaned}`;
    if (cleaned.startsWith('91') && cleaned.length === 12) return `https://wa.me/${cleaned}`;
    return `https://wa.me/${cleaned}`;
};

const KTPBudgetView: React.FC<{ data: KTPBudget, onEdit: () => void, isAdmin: boolean }> = ({ data, onEdit, isAdmin }) => {
  const calculateTotal = (items: BudgetItem[]) => {
    return items.reduce((sum, item) => sum + parseFloat(item.amount.replace(/,/g, '') || '0'), 0);
  };

  const totalIncome = calculateTotal(data.income);
  const totalExpenditure = calculateTotal(data.expenditure);

  const formatCurrency = (value: number) => {
    return `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const BudgetSection: React.FC<{ title: string; items: BudgetItem[], total: number; colorClass: string; }> = ({ title, items, total, colorClass }) => (
    <div>
      <h3 className={`text-xl font-bold mb-4 border-b-2 pb-2 ${colorClass}`}>{title}</h3>
      <table className="w-full text-sm">
        <tbody>
          {items.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-100 last:border-b-0">
              <td className="py-2.5 px-2 text-slate-700">{entry.item}</td>
              <td className="py-2.5 px-2 text-right font-mono text-slate-800">{parseFloat(entry.amount).toLocaleString('en-IN')} /-</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-slate-50">
            <td className="py-3 px-2">Total</td>
            <td className="py-3 px-2 text-right font-mono text-lg">{formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div>
       <div className="flex justify-between items-start mb-8 pb-4 border-b">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">2026 BUDGET & PROJECT RUAHMANNA</h2>
            <p className="text-slate-500">Bethel Branch KTP</p>
         </div>
         {isAdmin && <button onClick={onEdit} className="flex items-center gap-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 px-3 py-2 rounded-full transition shadow-md"><Edit size={14} /> Edit</button>}
       </div>
      <div className="grid md:grid-cols-2 gap-12">
        <BudgetSection title="BUDGET HEAD" items={data.income} total={totalIncome} colorClass="border-green-500 text-green-700" />
        <BudgetSection title="SUM HMANNA TURTE" items={data.expenditure} total={totalExpenditure} colorClass="border-red-500 text-red-700" />
      </div>
    </div>
  );
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
            {isAdmin && <button onClick={onEdit} className="flex items-center gap-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 px-3 py-2 rounded-full transition shadow-md"><Edit size={14} /> Edit</button>}
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
            <Section title="Group Hruaitute">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-1 md:col-span-2 lg:col-span-3">
                    {data.groupLeaders.map(group => <GroupCard key={group.id} group={group} />)}
                </div>
            </Section>
        )}
        {/* Removed subCommittees rendering from here */}
    </div>
);

// New component for Sub-Committees
const KTPSubCommitteesView: React.FC<{ data: KTPHruaitute, onEdit: () => void, isAdmin: boolean }> = ({ data, onEdit, isAdmin }) => (
    <div>
        <div className="flex justify-between items-start mb-6 pb-4 border-b">
            <div className="flex items-center gap-4">
                <img src={ktpLogoUrl} alt="KTP Logo" className="h-16 w-16 rounded-full shadow-md bg-white p-1" />
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">KTP SUB-COMMITTEES {data.year}</h2>
                    <p className="text-slate-500">Kristian Ṭhalai Pawl, Bethel Branch</p>
                </div>
            </div>
            {isAdmin && <button onClick={onEdit} className="flex items-center gap-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 px-3 py-2 rounded-full transition shadow-md"><Edit size={14} /> Edit</button>}
        </div>

        {data.subCommittees && data.subCommittees.length > 0 ? (
             <Section title="Sub-Committees">
                {/* Removed the inner grid, now Section's grid will control the layout */}
                {data.subCommittees.map(sub => <SubCommitteeCard key={sub.id} subcommittee={sub} />)}
            </Section>
        ) : (
            <div className="text-center py-10 text-slate-500">No sub-committees defined yet.</div>
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
        {person.role && <p className="text-xs text-cyan-600 font-semibold">{person.role}</p>}
        {person.phone && person.phone !== 'N/A' && (
             <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-500 mt-1 hover:text-green-600 transition">
                <Phone size={12} /> {person.phone}
            </a>
        )}
    </div>
);

const GroupCard: React.FC<{ group: KTPGroup }> = ({ group }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h4 className="font-bold text-cyan-800 border-b border-slate-200 pb-2 mb-2">Group: {group.groupName}</h4>
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

const SubCommitteeCard: React.FC<{ subcommittee: KTPSubCommittee }> = ({ subcommittee }) => {
    const mainRoles = ['Chairman', 'Secretary', 'Conductor', 'Asst. Conductor'];
    const leaders = subcommittee.members.filter(m => m.role && mainRoles.includes(m.role));
    const members = subcommittee.members.filter(m => !m.role || !mainRoles.includes(m.role));
    
    return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-cyan-800 border-b border-slate-200 pb-2 mb-2">{subcommittee.name}</h4>
            <ul className="space-y-1.5 mb-3">
                {leaders.map(member => (
                    <li key={member.id} className="text-sm flex items-baseline gap-1"> {/* Added flex and items-baseline */}
                        <span className="text-slate-600 whitespace-nowrap">{member.role}:</span> {/* Added whitespace-nowrap */}
                        <span className="font-semibold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">{member.name}</span> {/* Added whitespace-nowrap, overflow-hidden, text-ellipsis */}
                    </li>
                ))}
            </ul>
            {members.length > 0 && (
                 <>
                    <h5 className="text-xs font-bold text-slate-400">Members:</h5>
                    <div className="text-sm font-medium text-slate-800 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {members.map(m => <span key={m.id}>{m.name}</span>)}
                    </div>
                 </>
            )}
        </div>
    );
};

const KTPDataMissing: React.FC<{ title: string, onSetup: () => void, isAdmin: boolean, year: number }> = ({ title, onSetup, isAdmin, year }) => (
    <div className="text-center py-20">
        <img src={ktpLogoUrl} alt="KTP Logo" className="mx-auto h-20 w-20 mb-6 opacity-50" />
        <h3 className="text-xl font-bold text-slate-700">{title} Not Available</h3>
        <p className="text-slate-500 mt-2">Information for {year} has not been added yet.</p>
        {isAdmin && (
            <button onClick={onSetup} className="mt-6 flex items-center mx-auto gap-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-full transition shadow-md">
                <PlusCircle size={16} /> Setup {year} {title}
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

    const handleSubCommitteeChange = (index: number, value: string) => {
        const newSubs = [...(formData.subCommittees || [])];
        newSubs[index].name = value;
        setFormData({ ...formData, subCommittees: newSubs });
    };

    const handleSubCommitteeMemberChange = (subIndex: number, memberIndex: number, field: keyof KTPMember, value: string) => {
        const newSubs = [...(formData.subCommittees || [])];
        (newSubs[subIndex].members[memberIndex] as any)[field] = value;
        setFormData({ ...formData, subCommittees: newSubs });
    };

    const addSubCommittee = () => {
        const newSub: KTPSubCommittee = { id: `new-sub-${Date.now()}`, name: 'New Sub-Committee', members: [] };
        setFormData({ ...formData, subCommittees: [...(formData.subCommittees || []), newSub] });
    };

    const removeSubCommittee = (id: string) => {
        const newSubs = (formData.subCommittees || []).filter(s => s.id !== id);
        setFormData({ ...formData, subCommittees: newSubs });
    };

    const addSubCommitteeMember = (subIndex: number) => {
        const newSubs = [...(formData.subCommittees || [])];
        newSubs[subIndex].members.push({ id: `new-sub-member-${Date.now()}`, name: '', role: '' });
        setFormData({ ...formData, subCommittees: newSubs });
    };

    const removeSubCommitteeMember = (subIndex: number, memberId: string) => {
        const newSubs = [...(formData.subCommittees || [])];
        newSubs[subIndex].members = newSubs[subIndex].members.filter(m => m.id !== memberId);
        setFormData({ ...formData, subCommittees: newSubs });
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
                     <div className="border-t pt-4">
                         <h4 className="font-bold mb-2">Sub-Committees</h4>
                         <div className="space-y-4">
                             {(formData.subCommittees || []).map((sub, subIndex) => (
                                <div key={sub.id} className="p-4 border rounded-lg bg-slate-50 space-y-3">
                                    <div className="flex items-center gap-2">
                                       <input className="font-bold text-lg w-full border-b bg-transparent" value={sub.name} onChange={(e) => handleSubCommitteeChange(subIndex, e.target.value)} />
                                       <button type="button" onClick={() => removeSubCommittee(sub.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="space-y-2">
                                       {sub.members.map((member, memberIndex) => (
                                          <div key={member.id} className="grid grid-cols-12 gap-2 items-center">
                                              <input className="col-span-4 border p-2 text-sm rounded" placeholder="Role (Optional)" value={member.role || ''} onChange={e => handleSubCommitteeMemberChange(subIndex, memberIndex, 'role', e.target.value)} />
                                              <input className="col-span-7" placeholder="Name" value={member.name} onChange={e => handleSubCommitteeMemberChange(subIndex, memberIndex, 'name', e.target.value)} />
                                              <button type="button" onClick={() => removeSubCommitteeMember(subIndex, member.id)} className="col-span-1 text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                                          </div>
                                       ))}
                                    </div>
                                    <button type="button" onClick={() => addSubCommitteeMember(subIndex)} className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1"><UserPlus size={14}/> Add Member</button>
                                </div>
                             ))}
                         </div>
                         <button type="button" onClick={addSubCommittee} className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full transition shadow-sm mt-4 flex items-center gap-1"><Plus size={16}/> Add Sub-Committee</button>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end space-x-2 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 bg-cyan-600 text-white rounded flex items-center disabled:opacity-50" disabled={isSaving}>
                        {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const KTPBudgetEditModal: React.FC<{ data: KTPBudget, onClose: () => void, onSave: (data: KTPBudget) => Promise<void> }> = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState<KTPBudget>(JSON.parse(JSON.stringify(data)));
    const [isSaving, setIsSaving] = useState(false);
    
    const handleItemChange = (listName: 'income' | 'expenditure', index: number, field: 'item' | 'amount', value: string) => {
        const list = formData[listName];
        const newList = [...list];
        newList[index] = { ...newList[index], [field]: value };
        setFormData({ ...formData, [listName]: newList });
    };

    const addItem = (listName: 'income' | 'expenditure') => {
        const list = formData[listName];
        const newItem: BudgetItem = { id: `new-${Date.now()}`, item: '', amount: '' };
        setFormData({ ...formData, [listName]: [...list, newItem] });
    };
    
    const removeItem = (listName: 'income' | 'expenditure', id: string) => {
        const list = formData[listName];
        setFormData({ ...formData, [listName]: list.filter(item => item.id !== id) });
    };

    const handleSaveClick = async () => {
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    const BudgetItemRow: React.FC<{ listName: 'income' | 'expenditure', item: BudgetItem, index: number }> = ({ listName, item, index }) => (
        <div className="grid grid-cols-12 gap-2 items-center">
            <input className="col-span-7 border p-2 text-sm rounded" placeholder="Item Name" value={item.item} onChange={e => handleItemChange(listName, index, 'item', e.target.value)} />
            <input type="number" className="col-span-4 border p-2 text-sm rounded" placeholder="Amount" value={item.amount} onChange={e => handleItemChange(listName, index, 'amount', e.target.value)} />
            <button type="button" onClick={() => removeItem(listName, item.id)} className="col-span-1 text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-bold">Edit KTP Budget {formData.year}</h3><button onClick={onClose}><X/></button></div>
                <div className="p-6 grid md:grid-cols-2 gap-6 overflow-y-auto">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="font-bold">BUDGET HEAD (Income)</h4>
                           <button type="button" onClick={() => addItem('income')} className="text-xs text-blue-600 font-bold flex items-center gap-1"><PlusCircle size={14}/> Add Item</button>
                        </div>
                        <div className="space-y-2">{formData.income.map((p, i) => <BudgetItemRow key={p.id} listName="income" item={p} index={i} />)}</div>
                    </div>
                     <div>
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="font-bold">SUM HMANNA TURTE (Expenditure)</h4>
                           <button type="button" onClick={() => addItem('expenditure')} className="text-xs text-blue-600 font-bold flex items-center gap-1"><PlusCircle size={14}/> Add Item</button>
                        </div>
                        <div className="space-y-2">{formData.expenditure.map((p, i) => <BudgetItemRow key={p.id} listName="expenditure" item={p} index={i} />)}</div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end space-x-2 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 bg-cyan-600 text-white rounded flex items-center disabled:opacity-50" disabled={isSaving}>
                        {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};


export default Fellowship;
