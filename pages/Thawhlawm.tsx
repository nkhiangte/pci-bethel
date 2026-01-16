
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, Globe, Coffee, Home, Users, ArrowLeft, Calendar, User, MapPin, DollarSign, QrCode, Upload, CheckCircle2, Loader, ArrowRight, Settings, Save, X, FileDown, FileUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import * as XLSX from 'xlsx';

const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';

const CATEGORIES = [
  { id: 'pathian-ram', title: 'Pathian Ram', icon: Heart, color: 'bg-blue-600', description: 'General Fund, Ramthar & Tualchhung' },
  { id: 'ramthar', title: 'Ramthar', icon: Globe, color: 'bg-green-600', description: 'Mission Field Support' },
  { id: 'refreshment', title: 'Refreshment', icon: Coffee, color: 'bg-orange-500', description: 'Tea & Snacks Ministry' },
  { id: 'building', title: 'Building', icon: Home, color: 'bg-purple-600', description: 'Church Building Fund' },
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

const Thawhlawm: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  const { isAdmin } = useAuth();
  
  // Form State
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [formData, setFormData] = useState<ContributionForm>(INITIAL_FORM);
  const [total, setTotal] = useState(0);
  
  // Family List State
  const [familyOptions, setFamilyOptions] = useState<string[]>([]);
  const [fetchingFamilies, setFetchingFamilies] = useState(false);

  // Admin Management State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageBial, setManageBial] = useState(BIAL_OPTIONS[0]);
  const [manageNamesText, setManageNamesText] = useState('');
  const [savingFamilies, setSavingFamilies] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  
  // Upload State
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      // Auto-calculate total
      const pr = parseFloat(formData.pathianRam) || 0;
      const rt = parseFloat(formData.ramthar) || 0;
      const tc = parseFloat(formData.tualchhung) || 0;
      setTotal(pr + rt + tc);
  }, [formData.pathianRam, formData.ramthar, formData.tualchhung]);

  // Fetch families when Bial changes
  useEffect(() => {
      const fetchFamilies = async () => {
          if (!formData.bial || !db || !db.collection) {
              setFamilyOptions([]);
              return;
          }
          
          setFetchingFamilies(true);
          try {
              const docId = formData.bial.toLowerCase().replace(/\s+/g, '-'); // e.g., 'bial-1'
              const doc = await db.collection('bialMembers').doc(docId).get();
              if (doc.exists) {
                  const data = doc.data();
                  // Ensure names are sorted naturally if they start with numbers (e.g. "1. Name", "2. Name", "10. Name")
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
  }, [formData.bial]);

  const handleCategoryClick = (id: string) => {
    setSearchParams({ category: id });
    setStep('form');
    setFormData(INITIAL_FORM);
    setScreenshot(null);
    setPreviewUrl(null);
  };

  const handleBack = () => {
    if (step === 'payment') {
        setStep('form');
    } else if (step === 'success') {
        setSearchParams({});
        setStep('form');
    } else {
        setSearchParams({});
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.bial || total === 0) {
          alert("Please fill in all required fields and ensure total amount is greater than 0.");
          return;
      }
      setStep('payment');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setScreenshot(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const handleSubmit = async () => {
      if (!screenshot) {
          alert("Please upload a screenshot of your payment.");
          return;
      }
      
      setIsSubmitting(true);
      try {
          // 1. Upload Image to ImgBB
          const imgFormData = new FormData();
          imgFormData.append('image', screenshot);
          const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
              method: 'POST', body: imgFormData
          });
          const imgData = await imgRes.json();
          
          if (!imgData.success) throw new Error("Image upload failed");
          const imageUrl = imgData.data.url;

          // 2. Save Data to Firestore
          if (db && db.collection) {
              await db.collection('thawhlawm').add({
                  ...formData,
                  amounts: {
                      pathianRam: parseFloat(formData.pathianRam) || 0,
                      ramthar: parseFloat(formData.ramthar) || 0,
                      tualchhung: parseFloat(formData.tualchhung) || 0
                  },
                  totalAmount: total,
                  screenshotUrl: imageUrl,
                  status: 'pending',
                  category: activeCategory,
                  timestamp: new Date().toISOString()
              });
          } else {
              // Mock success if DB not connected
              console.log("DB not connected, mock submission success.");
          }

          setStep('success');
      } catch (error) {
          console.error("Submission error:", error);
          alert("Failed to submit contribution. Please try again.");
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- Admin Functions ---

  const openManageModal = async () => {
      setIsManageModalOpen(true);
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
      } catch (e) {
          console.error(e);
      }
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
              // Match specified headers 'Serial No' and 'Family Name'
              const slNo = row['Serial No'] || row['Sl. No'] || row['Sl No'];
              const name = row['Family Name'] || row['Hming'] || row['Name'];
              
              if (!name) return null;
              
              // Include Serial Number if present
              return slNo ? `${slNo}. ${name}` : name;
          }).filter(n => typeof n === 'string' && n.trim() !== '' && !n.includes('Example Name'));

          if (names.length > 0) {
              setManageNamesText(prev => {
                  const existing = prev ? prev.split('\n') : [];
                  // Combine and deduplicate
                  const combined = Array.from(new Set([...existing, ...names]));
                  // Sort naturally
                  combined.sort((a, b) => {
                      const numA = parseInt(a.split('.')[0]) || 0;
                      const numB = parseInt(b.split('.')[0]) || 0;
                      if (numA && numB) return numA - numB;
                      return a.localeCompare(b);
                  });
                  return combined.join('\n');
              });
              alert(`Loaded ${names.length} names from file.`);
          } else {
              alert("No valid names found in file. Please ensure column headers are 'Serial No' and 'Family Name'.");
          }
      } catch (error) {
          console.error("Error reading file:", error);
          alert("Failed to read file.");
      }
      
      if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleSaveFamilies = async () => {
      if (!db || !db.collection) return;
      setSavingFamilies(true);
      try {
          const docId = manageBial.toLowerCase().replace(/\s+/g, '-');
          const families = manageNamesText.split('\n').map(s => s.trim()).filter(Boolean);
          
          await db.collection('bialMembers').doc(docId).set({
              bial: manageBial,
              families: families
          });
          alert(`Saved ${families.length} families for ${manageBial}`);
          
          // Refresh if current user has this bial selected
          if (formData.bial === manageBial) {
              setFamilyOptions(families);
          }
          setIsManageModalOpen(false);
      } catch (e) {
          console.error(e);
          alert("Failed to save.");
      }
      setSavingFamilies(false);
  };

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-serif font-bold text-church-900 mb-2">Thawhlawm Thawhna</h1>
          <p className="text-slate-600">Online Contribution Portal</p>
        </div>

        {!activeCategory ? (
          /* Landing View: Categories */
          <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    <p className="text-slate-500 text-sm">{cat.description}</p>
                </div>
                <div className="ml-auto text-slate-300 group-hover:text-church-500">
                    <ArrowRight size={24} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Detail View */
          <div className="animate-in fade-in zoom-in duration-200">
            {/* Nav Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button 
                    onClick={handleBack}
                    className="p-2 mr-4 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-church-600 hover:border-church-300 transition-all shadow-sm"
                    >
                    <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {currentCategory?.title} Contribution
                    </h2>
                </div>
                {isAdmin && (
                    <button 
                        onClick={openManageModal}
                        className="p-2 text-church-600 hover:bg-church-50 rounded-full transition"
                        title="Manage Families"
                    >
                        <Settings size={20} />
                    </button>
                )}
            </div>

            {/* FORM STEP */}
            {step === 'form' && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 md:p-8">
                    <form onSubmit={handleProceedToPayment} className="space-y-6">
                        {/* Personal Info */}
                        <div className="space-y-4 pb-6 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User size={16}/> Personal Details
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Month</label>
                                    <select 
                                        name="month"
                                        value={formData.month} 
                                        onChange={handleInputChange}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition"
                                    >
                                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Year</label>
                                    <select 
                                        name="year"
                                        value={formData.year} 
                                        onChange={handleInputChange}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition"
                                    >
                                        <option value="2024">2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                    </select>
                                </div>
                            </div>

                            {/* Upa Bial Field moved up */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Upa Bial</label>
                                <div className="relative">
                                    <select 
                                        name="bial"
                                        value={formData.bial}
                                        onChange={handleInputChange}
                                        className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition appearance-none"
                                        required
                                    >
                                        <option value="">Select Bial...</option>
                                        {BIAL_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                            </div>

                            {/* Name Field (Dropdown) */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Hming (Full Name)</label>
                                <div className="relative">
                                    <select 
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition appearance-none"
                                        required
                                        disabled={!formData.bial || fetchingFamilies}
                                    >
                                        <option value="">Select Name...</option>
                                        {familyOptions.map((name, idx) => (
                                            <option key={idx} value={name}>{name}</option>
                                        ))}
                                    </select>
                                    
                                    {fetchingFamilies ? (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader size={16} className="animate-spin text-church-500" />
                                        </div>
                                    ) : (
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    )}
                                </div>
                                {!formData.bial && (
                                    <p className="text-xs text-slate-400 mt-1">Please select Upa Bial first to see family names.</p>
                                )}
                            </div>
                        </div>

                        {/* Amount Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={16}/> Contribution Amount (₹)
                            </h3>
                            
                            <div className="grid gap-4">
                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <label className="w-32 font-bold text-slate-700 text-sm">Pathian Ram</label>
                                    <input 
                                        type="number" 
                                        name="pathianRam"
                                        value={formData.pathianRam}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-right font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <label className="w-32 font-bold text-slate-700 text-sm">Ramthar</label>
                                    <input 
                                        type="number" 
                                        name="ramthar"
                                        value={formData.ramthar}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-right font-mono font-bold focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <label className="w-32 font-bold text-slate-700 text-sm">Tualchhung</label>
                                    <input 
                                        type="number" 
                                        name="tualchhung"
                                        value={formData.tualchhung}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-right font-mono font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-church-900 text-white rounded-xl flex justify-between items-center shadow-lg">
                                <span className="font-bold text-sm uppercase tracking-widest text-church-200">Grand Total</span>
                                <span className="text-2xl font-black font-mono">₹ {total.toLocaleString()}</span>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-4 bg-church-600 text-white font-bold rounded-xl shadow-lg hover:bg-church-700 transition transform active:scale-95 flex justify-center items-center gap-2"
                        >
                            Proceed to Payment <ArrowRight size={20} />
                        </button>
                    </form>
                </div>
            )}

            {/* PAYMENT STEP */}
            {step === 'payment' && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 md:p-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <QrCode size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800">Scan & Pay</h3>
                        <p className="text-slate-500">Please scan the QR code to transfer <span className="font-bold text-slate-900">₹ {total.toLocaleString()}</span></p>
                    </div>

                    <div className="flex flex-col items-center gap-6 mb-8">
                        <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
                            {/* Using a placeholder QR for Bethel Church. In prod, use real UPI string */}
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=bethelchurch@sbi&pn=PCI%20Champhai%20Bethel&am=${total}&cu=INR`} 
                                alt="Payment QR" 
                                className="w-48 h-48 md:w-56 md:h-56 object-contain"
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">UPI ID</p>
                            <div className="bg-slate-100 px-4 py-2 rounded-lg font-mono font-bold text-slate-700 flex items-center gap-2 cursor-pointer hover:bg-slate-200 transition" onClick={() => {navigator.clipboard.writeText('bethelchurch@sbi'); alert('UPI ID Copied!')}}>
                                bethelchurch@sbi <span className="text-xs text-slate-400">(Tap to copy)</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-8">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Upload size={18} /> Upload Payment Screenshot
                        </h4>
                        
                        <div className="space-y-4">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-church-500 hover:bg-church-50 transition group"
                            >
                                {previewUrl ? (
                                    <div className="relative h-40 w-full">
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-contain mx-auto" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg">
                                            <p className="text-white font-bold text-sm">Click to Change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4">
                                        <Upload className="mx-auto text-slate-300 group-hover:text-church-500 mb-2" size={32} />
                                        <p className="text-sm font-medium text-slate-600">Tap to upload screenshot</p>
                                        <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept="image/*" 
                                />
                            </div>

                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting || !screenshot}
                                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader className="animate-spin" /> : <CheckCircle2 size={20} />}
                                {isSubmitting ? 'Submitting...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS STEP */}
            {step === 'success' && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-12 text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Thank You!</h2>
                    <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                        Your contribution of <span className="font-bold text-slate-900">₹ {total.toLocaleString()}</span> has been submitted for verification.
                    </p>
                    
                    <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left text-sm space-y-2 border border-slate-100">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Contributor</span>
                            <span className="font-bold text-slate-800">{formData.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Bial</span>
                            <span className="font-bold text-slate-800">{formData.bial}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Period</span>
                            <span className="font-bold text-slate-800">{formData.month} {formData.year}</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => { setStep('form'); setSearchParams({}); }}
                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition shadow-lg"
                    >
                        Return Home
                    </button>
                </div>
            )}

          </div>
        )}
      </div>

      {/* Admin Modal for Managing Families */}
      {isManageModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                      <h3 className="text-lg font-bold text-slate-800">Manage Bial Families</h3>
                      <button onClick={() => setIsManageModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="p-6 space-y-4 overflow-y-auto">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Select Upa Bial</label>
                          <select 
                              className="w-full p-2 border rounded-lg bg-white"
                              value={manageBial}
                              onChange={handleManageBialChange}
                          >
                              {BIAL_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                      </div>
                      
                      <div className="flex gap-2">
                          <button onClick={handleDownloadTemplate} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 border border-slate-200">
                              <FileDown size={16} /> Template
                          </button>
                          <button onClick={() => importFileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 border border-blue-200">
                              <FileUp size={16} /> Import Excel
                          </button>
                          <input type="file" ref={importFileRef} onChange={handleImportFile} className="hidden" accept=".xlsx, .xls" />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Family Heads / Members (One per line)</label>
                          <textarea 
                              className="w-full h-64 p-3 border rounded-lg focus:ring-2 focus:ring-church-500 outline-none text-sm font-mono"
                              value={manageNamesText}
                              onChange={(e) => setManageNamesText(e.target.value)}
                              placeholder="Paste list of names here or import from Excel..."
                          />
                      </div>
                  </div>
                  <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                      <button onClick={() => setIsManageModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-white transition">Cancel</button>
                      <button 
                          onClick={handleSaveFamilies} 
                          disabled={savingFamilies}
                          className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center font-bold"
                      >
                          {savingFamilies ? <Loader size={16} className="animate-spin mr-2"/> : <Save size={16} className="mr-2"/>}
                          Save List
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Thawhlawm;
