
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';
import { WeeklyDuty, Announcement, Staff } from '../types';
import { db } from '../services/firebase';
import { useVerseOfTheDay } from '../hooks/useVerseOfTheDay';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, Users, UserCircle, Radio, Music, ArrowRight, Calendar, Clock, ChevronRight, Edit, Plus, X, BookOpen, Quote, ShieldCheck, Phone, MessageCircle, Heart, Globe, Coffee, Home as HomeIcon, MapPin, DollarSign, QrCode, Upload, CheckCircle2, ArrowLeft, Settings, Save, FileDown, FileUp, ChevronDown, User, Loader } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import StaffEditModal from '../components/StaffEditModal';
import * as XLSX from 'xlsx';

// --- Thawhlawm Constants ---
const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';

const CATEGORIES = [
  { id: 'pathian-ram', title: 'Pathian Ram', icon: Heart, color: 'bg-blue-600', description: 'General Fund, Ramthar & Tualchhung' },
  { id: 'ramthar', title: 'Ramthar', icon: Globe, color: 'bg-green-600', description: 'Mission Field Support' },
  { id: 'refreshment', title: 'Refreshment', icon: Coffee, color: 'bg-orange-500', description: 'Tea & Snacks Ministry' },
  { id: 'building', title: 'Building', icon: HomeIcon, color: 'bg-purple-600', description: 'Church Building Fund' },
  { id: 'masihi-sangati', title: 'Masihi Sangati', icon: Users, color: 'bg-pink-600', description: 'Masihi Sangati Ministry' },
];

const BIAL_OPTIONS = Array.from({ length: 13 }, (_, i) => `Bial ${i + 1}`);
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];

interface ContributionForm {
    name: string;
    month: string;
    year: string;
    bial: string;
    pathianRam: string;
    ramthar: string;
    tualchhung: string;
}

const INITIAL_FORM: ContributionForm = {
    name: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    bial: '',
    pathianRam: '',
    ramthar: '',
    tualchhung: ''
};

const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  const { weeklyDuty: staticDuty, pastors: staticPastors, elders: staticElders, proPastors: staticProPastors } = getConstants(language);
  
  const [weeklyDuty, setWeeklyDuty] = useState<WeeklyDuty>(staticDuty);
  const [latestNews, setLatestNews] = useState<Announcement[]>([]);
  const [pastors, setPastors] = useState<Staff[]>([]);
  const [proPastors, setProPastors] = useState<Staff[]>([]);
  const [elders, setElders] = useState<Staff[]>([]);
  
  const { verse, loading: verseLoading, error: verseError } = useVerseOfTheDay(language);

  // --- Home Admin & Modal States ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff>>({});
  const [targetCollection, setTargetCollection] = useState<'pastors' | 'elders' | 'proPastors'>('pastors');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<Staff | null>(null);

  // --- Thawhlawm Integration States ---
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  
  const [thawhlawmStep, setThawhlawmStep] = useState<'form' | 'payment' | 'success'>('form');
  const [contribFormData, setContribFormData] = useState<ContributionForm>(INITIAL_FORM);
  const [contribTotal, setContribTotal] = useState(0);
  
  const [familyOptions, setFamilyOptions] = useState<string[]>([]);
  const [fetchingFamilies, setFetchingFamilies] = useState(false);

  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [manageBial, setManageBial] = useState(BIAL_OPTIONS[0]);
  const [manageNamesText, setManageNamesText] = useState('');
  const [savingFamilies, setSavingFamilies] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmittingThawhlawm, setIsSubmittingThawhlawm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    if (!db || !db.collection) {
        setPastors(staticPastors);
        setProPastors(staticProPastors);
        setElders(staticElders);
        return;
    }

    try {
        const dutyDoc = await db.collection('weeklyDuties').doc('current').get();
        if (dutyDoc.exists) setWeeklyDuty(dutyDoc.data() as WeeklyDuty);

        const newsSnap = await db.collection('announcements').orderBy('date', 'desc').limit(3).get();
        const newsData = newsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Announcement[];
        setLatestNews(newsData);

        const fetchStaff = async (collection: string) => {
            const snap = await db.collection(collection).orderBy('order', 'asc').get();
            const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Staff[];
            return data.filter((p, index, self) => index === self.findIndex((t) => t.name === p.name));
        };

        setPastors(await fetchStaff('pastors') || staticPastors);
        setProPastors(await fetchStaff('proPastors') || staticProPastors);
        setElders(await fetchStaff('elders') || staticElders);

    } catch (e) {
        console.error("Error fetching homepage data:", e);
        setPastors(staticPastors);
        setProPastors(staticProPastors);
        setElders(staticElders);
        setWeeklyDuty(staticDuty);
    }
  }, [staticPastors, staticProPastors, staticElders, staticDuty]);

  useEffect(() => {
    fetchData();
  }, [fetchData, language]);

  // --- Thawhlawm Effects ---
  useEffect(() => {
      const pr = parseFloat(contribFormData.pathianRam) || 0;
      const rt = parseFloat(contribFormData.ramthar) || 0;
      const tc = parseFloat(contribFormData.tualchhung) || 0;
      setContribTotal(pr + rt + tc);
  }, [contribFormData.pathianRam, contribFormData.ramthar, contribFormData.tualchhung]);

  useEffect(() => {
      const fetchFamilies = async () => {
          if (!contribFormData.bial || !db || !db.collection) {
              setFamilyOptions([]);
              return;
          }
          
          setFetchingFamilies(true);
          try {
              const docId = contribFormData.bial.toLowerCase().replace(/\s+/g, '-');
              const doc = await db.collection('bialMembers').doc(docId).get();
              if (doc.exists) {
                  const data = doc.data();
                  const loadedFamilies = data?.families || [];
                  loadedFamilies.sort((a: string, b: string) => {
                      const numA = parseInt(a.split('.')[0]) || 0;
                      const numB = parseInt(b.split('.')[0]) || 0;
                      if (numA && numB) return numA - numB;
                      return a.localeCompare(b);
                  });
                  setFamilyOptions(loadedFamilies);
              } else {
                  setFamilyOptions([]);
              }
          } catch (error) {
              console.error("Error fetching families:", error);
          }
          setFetchingFamilies(false);
      };

      fetchFamilies();
  }, [contribFormData.bial]);

  // --- Thawhlawm Handlers ---
  const handleCategoryClick = (id: string) => {
    setSearchParams({ category: id });
    setThawhlawmStep('form');
    setContribFormData(INITIAL_FORM);
    setScreenshot(null);
    setPreviewUrl(null);
    
    // Scroll to contribution section
    const el = document.getElementById('contribution');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleThawhlawmBack = () => {
    if (thawhlawmStep === 'payment') {
        setThawhlawmStep('form');
    } else if (thawhlawmStep === 'success') {
        setSearchParams({});
        setThawhlawmStep('form');
    } else {
        setSearchParams({});
    }
  };

  const handleContribInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setContribFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!contribFormData.name || !contribFormData.bial || contribTotal === 0) {
          alert("Please fill in all required fields and ensure total amount is greater than 0.");
          return;
      }
      setThawhlawmStep('payment');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setScreenshot(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const handleContribSubmit = async () => {
      if (!screenshot) {
          alert("Please upload a screenshot of your payment.");
          return;
      }
      
      setIsSubmittingThawhlawm(true);
      try {
          const imgFormData = new FormData();
          imgFormData.append('image', screenshot);
          const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
              method: 'POST', body: imgFormData
          });
          const imgData = await imgRes.json();
          if (!imgData.success) throw new Error("Image upload failed");
          const imageUrl = imgData.data.url;

          if (db && db.collection) {
              await db.collection('thawhlawm').add({
                  ...contribFormData,
                  amounts: {
                      pathianRam: parseFloat(contribFormData.pathianRam) || 0,
                      ramthar: parseFloat(contribFormData.ramthar) || 0,
                      tualchhung: parseFloat(contribFormData.tualchhung) || 0
                  },
                  totalAmount: contribTotal,
                  screenshotUrl: imageUrl,
                  status: 'pending',
                  category: activeCategory,
                  timestamp: new Date().toISOString()
              });
          }
          setThawhlawmStep('success');
      } catch (error) {
          console.error("Submission error:", error);
          alert("Failed to submit contribution. Please try again.");
      } finally {
          setIsSubmittingThawhlawm(false);
      }
  };

  // --- Thawhlawm Admin Functions ---
  const openFamilyModal = async () => {
      setIsFamilyModalOpen(true);
      await fetchFamiliesForAdmin(manageBial);
  };

  const fetchFamiliesForAdmin = async (bialName: string) => {
      if (!db || !db.collection) return;
      const docId = bialName.toLowerCase().replace(/\s+/g, '-');
      try {
          const doc = await db.collection('bialMembers').doc(docId).get();
          if (doc.exists) {
              const list = doc.data()?.families || [];
              setManageNamesText(list.join('\n'));
          } else {
              setManageNamesText('');
          }
      } catch (e) { console.error(e); }
  };

  const handleManageBialChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newBial = e.target.value;
      setManageBial(newBial);
      await fetchFamiliesForAdmin(newBial);
  };

  const handleDownloadTemplate = () => {
      const ws = XLSX.utils.json_to_sheet([
          { "Serial No": 1, "Family Name": "Example Name 1" },
          { "Serial No": 2, "Family Name": "Example Name 2" }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "Bial_Family_List_Template.xlsx");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const names = jsonData.map((row: any) => {
              const slNo = row['Serial No'] || row['Sl. No'] || row['Sl No'];
              const name = row['Family Name'] || row['Hming'] || row['Name'];
              if (!name) return null;
              return slNo ? `${slNo}. ${name}` : name;
          }).filter(Boolean);

          if (names.length > 0) {
              setManageNamesText(prev => {
                  const existing = prev ? prev.split('\n') : [];
                  const combined = Array.from(new Set([...existing, ...names]));
                  combined.sort((a, b) => {
                      const numA = parseInt(a.split('.')[0]) || 0;
                      const numB = parseInt(b.split('.')[0]) || 0;
                      if (numA && numB) return numA - numB;
                      return a.localeCompare(b);
                  });
                  return combined.join('\n');
              });
              alert(`Loaded ${names.length} names.`);
          }
      } catch (error) { alert("Failed to read file."); }
      if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleSaveFamilies = async () => {
      if (!db || !db.collection) return;
      setSavingFamilies(true);
      try {
          const docId = manageBial.toLowerCase().replace(/\s+/g, '-');
          const families = manageNamesText.split('\n').map(s => s.trim()).filter(Boolean);
          await db.collection('bialMembers').doc(docId).set({ bial: manageBial, families: families });
          if (contribFormData.bial === manageBial) setFamilyOptions(families);
          setIsFamilyModalOpen(false);
          alert("Saved successfully!");
      } catch (e) { alert("Failed to save."); }
      setSavingFamilies(false);
  };

  // --- Staff Admin Handlers (Existing Home logic) ---
  const handleAddNew = (collection: 'pastors' | 'elders' | 'proPastors') => {
    let defaultRole = collection === 'elders' ? 'Upa' : collection === 'proPastors' ? 'Pro Pastor' : 'Pastor';
    setEditingStaff({ name: '', role: defaultRole, imageUrl: '', description: '', biography: '' });
    setTargetCollection(collection);
    setIsEditModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, staff: Staff, collection: 'pastors' | 'elders' | 'proPastors') => {
    e.stopPropagation();
    setEditingStaff(staff);
    setTargetCollection(collection);
    setIsEditModalOpen(true);
  };

  const handleSaveStaff = async (staff: Staff, collectionName: 'pastors' | 'elders' | 'proPastors') => {
    setIsSaving(true);
    try {
      if (staff.id) {
        await db.collection(collectionName).doc(staff.id).set(staff, { merge: true });
      } else {
        const currentList = collectionName === 'pastors' ? pastors : collectionName === 'elders' ? elders : proPastors;
        const maxOrder = currentList.length > 0 ? Math.max(...currentList.map(s => s.order || 0)) : 0;
        await db.collection(collectionName).add({ ...staff, order: maxOrder + 1 });
      }
      setIsEditModalOpen(false);
      fetchData();
      if (selectedLeader?.id === staff.id) setSelectedLeader(staff);
    } catch (error) { alert("Failed to save."); }
    setIsSaving(false);
  };

  const handleDeleteStaff = async (id: string, collectionName: 'pastors' | 'elders' | 'proPastors') => {
    setIsSaving(true);
    try {
      await db.collection(collectionName).doc(id).delete();
      setShowDeleteConfirm(null);
      setIsEditModalOpen(false);
      fetchData();
      if (selectedLeader?.id === id) setSelectedLeader(null);
    } catch (error) { alert("Failed to delete."); }
    setIsSaving(false);
  };

  const renderVerseContent = () => {
    if (verseLoading) return <div className="animate-pulse flex flex-col items-center"><div className="h-4 bg-yellow-200 rounded w-3/4 mb-2"></div><div className="h-4 bg-yellow-200 rounded w-1/2"></div></div>;
    if (verseError) return null;
    if (verse) {
      const verseParts = verse.match(/(.*) - ([\w\s]+ \d+:\d+.*)/);
      if (verseParts) {
        return <><p className="text-lg md:text-xl italic text-yellow-900 font-serif mb-2">"{verseParts[1]}"</p><p className="text-sm font-bold text-yellow-700 uppercase tracking-widest">{verseParts[2]}</p></>;
      }
      return <p className="text-lg italic text-yellow-900 font-serif">"{verse}"</p>;
    }
    return null;
  };

  const allPastoralLeaders = [
    ...pastors.map(p => ({ ...p, collection: 'pastors' as const })),
    ...proPastors.map(p => ({ ...p, collection: 'proPastors' as const }))
  ];

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="space-y-16 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Verse of the Day */}
      <section className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center shadow-sm">
        <h3 className="text-xs font-black text-yellow-600 uppercase tracking-[0.2em] mb-4">{t.home.verseOfTheDay}</h3>
        {renderVerseContent()}
      </section>

      {/* --- CONTRIBUTION SECTION (Moved from Thawhlawm.tsx) --- */}
      <section id="contribution" className="scroll-mt-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-slate-900">Thawhlawm Thawhna</h2>
          <p className="text-slate-500">Online Contribution Portal</p>
        </div>

        {!activeCategory ? (
          /* Landing View: Categories */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-church-200 transition-all duration-300 text-left group flex items-center"
              >
                <div className={`p-4 ${cat.color} rounded-xl text-white mr-5 shadow-md group-hover:scale-110 transition-transform`}>
                  <cat.icon size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-church-700 transition-colors">{cat.title}</h3>
                    <p className="text-slate-500 text-sm mt-1">{cat.description}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Detail View */
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={handleThawhlawmBack} className="p-2 mr-3 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-church-600 transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">{currentCategory?.title}</h2>
                </div>
                {isAdmin && (
                    <button onClick={openFamilyModal} className="p-2 text-church-600 hover:bg-church-50 rounded-full transition" title="Manage Families">
                        <Settings size={20} />
                    </button>
                )}
            </div>

            <div className="p-6 md:p-8">
                {thawhlawmStep === 'form' && (
                    <form onSubmit={handleProceedToPayment} className="space-y-6">
                        {/* Personal Info */}
                        <div className="space-y-4 pb-6 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={16}/> Personal Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Month</label>
                                    <select name="month" value={contribFormData.month} onChange={handleContribInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition">
                                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Year</label>
                                    <select name="year" value={contribFormData.year} onChange={handleContribInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition">
                                        <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Upa Bial</label>
                                <div className="relative">
                                    <select name="bial" value={contribFormData.bial} onChange={handleContribInputChange} className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition appearance-none" required>
                                        <option value="">Select Bial...</option>
                                        {BIAL_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Hming (Full Name)</label>
                                <div className="relative">
                                    <select name="name" value={contribFormData.name} onChange={handleContribInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition appearance-none" required disabled={!contribFormData.bial || fetchingFamilies}>
                                        <option value="">Select Name...</option>
                                        {familyOptions.map((name, idx) => (<option key={idx} value={name}>{name}</option>))}
                                    </select>
                                    {fetchingFamilies ? <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader size={16} className="animate-spin text-church-500" /></div> : <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />}
                                </div>
                                {!contribFormData.bial && <p className="text-xs text-slate-400 mt-1">Please select Upa Bial first to see family names.</p>}
                            </div>
                        </div>

                        {/* Amount Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><DollarSign size={16}/> Contribution Amount (₹)</h3>
                            <div className="grid gap-4">
                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <label className="w-32 font-bold text-slate-700 text-sm">Pathian Ram</label>
                                    <input type="number" name="pathianRam" value={contribFormData.pathianRam} onChange={handleContribInputChange} placeholder="0" className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-right font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <label className="w-32 font-bold text-slate-700 text-sm">Ramthar</label>
                                    <input type="number" name="ramthar" value={contribFormData.ramthar} onChange={handleContribInputChange} placeholder="0" className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-right font-mono font-bold focus:ring-2 focus:ring-green-500 outline-none"/>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <label className="w-32 font-bold text-slate-700 text-sm">Tualchhung</label>
                                    <input type="number" name="tualchhung" value={contribFormData.tualchhung} onChange={handleContribInputChange} placeholder="0" className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-right font-mono font-bold focus:ring-2 focus:ring-orange-500 outline-none"/>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-church-900 text-white rounded-xl flex justify-between items-center shadow-lg">
                                <span className="font-bold text-sm uppercase tracking-widest text-church-200">Grand Total</span>
                                <span className="text-2xl font-black font-mono">₹ {contribTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <button type="submit" className="w-full py-4 bg-church-600 text-white font-bold rounded-xl shadow-lg hover:bg-church-700 transition transform active:scale-95 flex justify-center items-center gap-2">
                            Proceed to Payment <ArrowRight size={20} />
                        </button>
                    </form>
                )}

                {thawhlawmStep === 'payment' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><QrCode size={32} /></div>
                            <h3 className="text-2xl font-bold text-slate-800">Scan & Pay</h3>
                            <p className="text-slate-500">Please scan the QR code to transfer <span className="font-bold text-slate-900">₹ {contribTotal.toLocaleString()}</span></p>
                        </div>
                        <div className="flex flex-col items-center gap-6 mb-8">
                            <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=bethelchurch@sbi&pn=PCI%20Champhai%20Bethel&am=${contribTotal}&cu=INR`} alt="Payment QR" className="w-48 h-48 md:w-56 md:h-56 object-contain"/>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">UPI ID</p>
                                <div className="bg-slate-100 px-4 py-2 rounded-lg font-mono font-bold text-slate-700 flex items-center gap-2 cursor-pointer hover:bg-slate-200 transition" onClick={() => {navigator.clipboard.writeText('bethelchurch@sbi'); alert('UPI ID Copied!')}}>
                                    bethelchurch@sbi <span className="text-xs text-slate-400">(Tap to copy)</span>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-100 pt-8">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Upload size={18} /> Upload Payment Screenshot</h4>
                            <div className="space-y-4">
                                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-church-500 hover:bg-church-50 transition group">
                                    {previewUrl ? (
                                        <div className="relative h-40 w-full">
                                            <img src={previewUrl} alt="Preview" className="h-full w-full object-contain mx-auto" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg"><p className="text-white font-bold text-sm">Click to Change</p></div>
                                        </div>
                                    ) : (
                                        <div className="py-4">
                                            <Upload className="mx-auto text-slate-300 group-hover:text-church-500 mb-2" size={32} />
                                            <p className="text-sm font-medium text-slate-600">Tap to upload screenshot</p>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                </div>
                                <button onClick={handleContribSubmit} disabled={isSubmittingThawhlawm || !screenshot} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition flex justify-center items-center gap-2 disabled:opacity-50">
                                    {isSubmittingThawhlawm ? <Loader className="animate-spin" /> : <CheckCircle2 size={20} />}
                                    {isSubmittingThawhlawm ? 'Submitting...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {thawhlawmStep === 'success' && (
                    <div className="text-center animate-in zoom-in duration-300 py-8">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CheckCircle2 size={40} /></div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Thank You!</h2>
                        <p className="text-slate-600 mb-8 max-w-sm mx-auto">Your contribution of <span className="font-bold text-slate-900">₹ {contribTotal.toLocaleString()}</span> has been submitted.</p>
                        <button onClick={() => { setThawhlawmStep('form'); setSearchParams({}); }} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition shadow-lg">Return</button>
                    </div>
                )}
            </div>
          </div>
        )}
      </section>

      {/* --- NEWS SECTION --- */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-900">{t.home.newsTitle}</h2>
          <Link to="/announcements" className="text-sm font-bold text-church-600 hover:text-church-700 flex items-center">
            {t.home.viewAll} <ArrowRight size={16} className="ml-1"/>
          </Link>
        </div>
        
        {latestNews.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
            {latestNews.map((item) => (
                <Link key={item.id} to="/announcements" className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition flex flex-col h-full">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                        <div className="h-40 bg-slate-200 overflow-hidden relative">
                            <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-800 uppercase tracking-wider shadow-sm">
                                {item.category}
                            </div>
                        </div>
                    ) : item.imageUrl ? (
                        <div className="h-40 bg-slate-200 overflow-hidden relative">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-800 uppercase tracking-wider shadow-sm">
                                {item.category}
                            </div>
                        </div>
                    ) : (
                        <div className="h-20 bg-church-50 flex items-center justify-center border-b border-church-100">
                             <div className="text-[10px] font-bold text-church-400 uppercase tracking-wider">{item.category}</div>
                        </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                        <p className="text-xs font-bold text-slate-400 mb-2">{item.date}</p>
                        <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-church-700 transition-colors">{item.title}</h3>
                        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed flex-1">{item.content}</p>
                        <div className="mt-4 flex items-center text-xs font-bold text-church-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                            Read More <ChevronRight size={12} className="ml-1"/>
                        </div>
                    </div>
                </Link>
            ))}
            </div>
        ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 italic">No recent announcements.</p>
            </div>
        )}
      </section>

      {/* --- WEEKLY DUTY SECTION --- */}
      <section>
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">Inkhawm & Rawngbawlna</h2>
                <p className="text-slate-500 text-sm mt-1">{weeklyDuty.weekRange}</p>
            </div>
            <Link to="/events" className="text-sm font-bold text-church-600 hover:text-church-700 flex items-center">
                View Full Schedule <ArrowRight size={16} className="ml-1"/>
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                <div className="bg-church-900 text-white p-6 flex items-center gap-3">
                    <ClipboardList size={22} className="text-church-400" />
                    <h4 className="text-sm font-black uppercase tracking-[0.2em]">Tun thla rawngbawltute</h4>
                </div>
                
                <div className="p-8 md:p-10 grid md:grid-cols-12 gap-y-12 md:gap-x-12">
                    <div className="md:col-span-4 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-church-50">
                            <Users size={16} className="text-church-600" />
                            <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Thawhlawm chhiartute</h5>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {weeklyDuty.thawhlawmChiartute?.map((name, i) => (
                                <div key={i} className="flex items-center gap-3 py-1.5 group">
                                    <div className="w-1 h-1 rounded-full bg-church-300 group-hover:bg-church-600 transition-colors"></div>
                                    <span className="text-sm font-bold text-slate-700">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-8 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-church-50">
                            <UserCircle size={16} className="text-church-600" />
                            <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Ushers (Male & Female)</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-0 divide-y divide-slate-50 border-t border-slate-50">
                            {weeklyDuty.ushers?.map((name, i) => (
                                <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-slate-50 group hover:bg-slate-50 transition-colors px-1">
                                    <span className="text-[9px] font-black text-church-300 group-hover:text-church-600">#</span>
                                    <span className="text-[12px] font-bold text-slate-600 truncate">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center gap-3">
                    <Radio size={22} className="text-church-700" />
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Tun kar rawngbawltute</h4>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-y-6">
                        <div className="group">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Zai Hruaitu</label>
                            <p className="text-sm font-black text-slate-800 group-hover:text-church-700 transition-colors">{weeklyDuty.zaiHruaitu || '-'}</p>
                            <div className="h-0.5 w-full bg-slate-50 mt-2"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Piano</label>
                                <p className="text-sm font-black text-slate-800">{weeklyDuty.pianoTumtu || '-'}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hla Hriltu</label>
                                <p className="text-sm font-black text-slate-800">{weeklyDuty.hlaHriltu || '-'}</p>
                            </div>
                        </div>
                        <div className="group">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Light & Sound</label>
                            <p className="text-sm font-black text-slate-800">{weeklyDuty.lightAndSoundDuty || '-'}</p>
                            <div className="h-0.5 w-full bg-slate-50 mt-2"></div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                                <Music size={10} className="text-church-400"/> Biak In Pangpar
                            </label>
                            <p className="text-sm font-bold text-slate-700 bg-church-50/50 p-2 rounded-lg border border-church-100 text-center">{weeklyDuty.pangparKhawitu || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- LEADERS SECTION --- */}
      <section className="bg-gradient-to-b from-transparent to-slate-50/50 rounded-[3rem] py-8">
         <div className="text-center mb-10 relative">
            <h2 className="text-2xl font-serif font-bold text-slate-900">{t.home.puipate}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Click for individual biography</p>
            <div className="h-1 w-20 bg-church-500 mx-auto mt-3 rounded-full"></div>
         </div>
         
         {/* Pastors & Pro Pastors */}
         <div className="mb-12">
             <div className="flex justify-center gap-8 flex-wrap relative">
                {isAdmin && (
                    <div className="absolute right-0 top-0 flex flex-col gap-2 z-10 md:flex-row">
                        <button onClick={() => handleAddNew('pastors')} className="text-xs font-bold text-white bg-church-600 px-3 py-1 rounded-full hover:bg-church-700 flex items-center shadow-sm">
                            <Plus size={12} className="mr-1"/> Add Pastor
                        </button>
                        <button onClick={() => handleAddNew('proPastors')} className="text-xs font-bold text-white bg-blue-600 px-3 py-1 rounded-full hover:bg-blue-700 flex items-center shadow-sm">
                            <Plus size={12} className="mr-1"/> Add Pro-Pastor
                        </button>
                    </div>
                )}
                {allPastoralLeaders.length === 0 ? (
                    <p className="text-slate-500 italic">No pastor data available.</p>
                ) : (
                    allPastoralLeaders.map(p => (
                    <div key={p.id} className="text-center group relative cursor-pointer" onClick={() => setSelectedLeader(p)}>
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto mb-4 relative bg-slate-200">
                            <img 
                                src={p.imageUrl} 
                                alt={p.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                style={{
                                    objectPosition: `${p.imagePositionX ?? 50}% ${p.imagePositionY ?? 0}%`,
                                    transform: `scale(${p.imageScale ?? 1})`
                                }}
                            />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                        <p className="text-sm text-church-600 font-medium uppercase tracking-wider">{p.role}</p>
                        {isAdmin && (
                            <button onClick={(e) => handleEditClick(e, p, p.collection)} className="absolute top-0 right-0 p-1.5 bg-white text-church-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit size={14} />
                            </button>
                        )}
                    </div>
                    ))
                )}
             </div>
         </div>

         {/* Elders Grid */}
         <div className="relative">
             {isAdmin && (
                <div className="text-center mb-6">
                    <button onClick={() => handleAddNew('elders')} className="text-xs font-bold text-white bg-church-600 px-3 py-1 rounded-full hover:bg-church-700 flex items-center mx-auto shadow-sm">
                        <Plus size={12} className="mr-1"/> Add Elder
                    </button>
                </div>
             )}
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
                {elders.map(e => (
                <div key={e.id} className="text-center group cursor-pointer relative" onClick={() => setSelectedLeader(e)}>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md mx-auto mb-3 bg-slate-200">
                        <img 
                            src={e.imageUrl} 
                            alt={e.name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                            style={{
                                objectPosition: `${e.imagePositionX ?? 50}% ${e.imagePositionY ?? 0}%`,
                                transform: `scale(${e.imageScale ?? 1})`
                            }}
                        />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 leading-tight group-hover:text-church-700 transition-colors">{e.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{e.role}</p>
                    {isAdmin && (
                        <button onClick={(event) => handleEditClick(event, e, 'elders')} className="absolute top-0 right-4 p-1 bg-white text-church-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit size={12} />
                        </button>
                    )}
                </div>
                ))}
             </div>
         </div>
         
         <div className="text-center mt-12">
            <Link to="/about" className="inline-flex items-center px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-church-700 transition shadow-sm">
               View All Leaders & Profiles <ChevronRight size={16} className="ml-2" />
            </Link>
         </div>
      </section>

      {/* --- MODALS --- */}

      {/* Staff Edit Modal */}
      {isEditModalOpen && (
          <StaffEditModal
            staff={editingStaff}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveStaff}
            onDelete={handleDeleteStaff}
            isLoading={isSaving}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            collectionName={targetCollection}
          />
      )}

      {/* Biography Theater */}
      {selectedLeader && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedLeader(null)}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                {/* (Profile Content Truncated for brevity - same as existing) */}
                <div className="relative min-h-[14rem] md:min-h-[16rem] shrink-0 bg-church-900 text-white flex items-end overflow-hidden">
                    <img src={selectedLeader.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Profile BG" style={{ objectPosition: `${selectedLeader.imagePositionX ?? 50}% ${selectedLeader.imagePositionY ?? 0}%` }}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-church-900 via-church-900/60 to-transparent"></div>
                    <button onClick={() => setSelectedLeader(null)} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition text-white border border-white/20 z-20"><X size={24} /></button>
                    <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white shrink-0">
                            <img src={selectedLeader.imageUrl} alt={selectedLeader.name} className="w-full h-full object-cover" style={{ objectPosition: `${selectedLeader.imagePositionX ?? 50}% ${selectedLeader.imagePositionY ?? 0}%` }}/>
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h2 className="text-2xl md:text-4xl font-serif font-black mb-2 leading-tight">{selectedLeader.name}</h2>
                            <p className="text-church-200">{selectedLeader.role}</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 md:p-12 overflow-y-auto bg-white flex-1">
                    {selectedLeader.biography ? (
                        <article className="prose prose-slate prose-lg max-w-none font-serif text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedLeader.biography}</article>
                    ) : <p className="text-center text-slate-500 italic">No biography available.</p>}
                </div>
            </div>
        </div>
      )}

      {/* Thawhlawm Family Management Modal */}
      {isFamilyModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                      <h3 className="text-lg font-bold text-slate-800">Manage Bial Families</h3>
                      <button onClick={() => setIsFamilyModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="p-6 space-y-4 overflow-y-auto">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Select Upa Bial</label>
                          <select className="w-full p-2 border rounded-lg bg-white" value={manageBial} onChange={handleManageBialChange}>
                              {BIAL_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={handleDownloadTemplate} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 border border-slate-200"><FileDown size={16} /> Template</button>
                          <button onClick={() => importFileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 border border-blue-200"><FileUp size={16} /> Import Excel</button>
                          <input type="file" ref={importFileRef} onChange={handleImportFile} className="hidden" accept=".xlsx, .xls" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Family Heads / Members (One per line)</label>
                          <textarea className="w-full h-64 p-3 border rounded-lg focus:ring-2 focus:ring-church-500 outline-none text-sm font-mono" value={manageNamesText} onChange={(e) => setManageNamesText(e.target.value)} placeholder="Paste list of names here or import from Excel..."/>
                      </div>
                  </div>
                  <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                      <button onClick={() => setIsFamilyModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-white transition">Cancel</button>
                      <button onClick={handleSaveFamilies} disabled={savingFamilies} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center font-bold">
                          {savingFamilies ? <Loader size={16} className="animate-spin mr-2"/> : <Save size={16} className="mr-2"/>} Save List
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Home;
