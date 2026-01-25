
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { Ministry, KTPHruaitute, KTPBudget, KTPMember, KTPSubCommittee, BudgetItem } from '../types';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, Users, Calendar, Loader, Home, Book, List, History, Camera, Video, UserSquare, 
  Edit, Save, X, Trash2, Plus, DollarSign, Table as TableIcon,
  Download, FileUp, FileDown, TrendingUp, Phone, MessageCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

// --- KTP SPECIFIC COMPONENTS ---

const KtpLeaders: React.FC<{ data: KTPHruaitute | null | undefined }> = ({ data }) => {
  if (!data) return <div className="p-8 bg-white rounded-xl shadow-sm text-center"><Loader className="animate-spin mx-auto"/></div>;

  const MemberList: React.FC<{ title: string; members: KTPMember[] }> = ({ title, members }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">{title}</h3>
      <ul className="space-y-1">
        {members.map((member, index) => (
          <li key={index} className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-2 py-3 border-b border-slate-100 last:border-b-0">
            <div>
              <p className="font-semibold text-slate-800">{member.name}</p>
              <p className="text-slate-500">{member.role}</p>
            </div>
            {member.phone && (
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center mt-2 sm:mt-0">
                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">{member.phone}</span>
                <a href={`tel:${member.phone.replace(/\s+/g, '')}`} className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition" title={`Call ${member.name}`}>
                  <Phone size={16} />
                </a>
                <a href={`https://wa.me/91${member.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 transition" title={`WhatsApp ${member.name}`}>
                  <MessageCircle size={16} />
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {data.leaders && <MemberList title="Office Bearers" members={data.leaders} />}
      {data.committeeMembers && <MemberList title="Committee Members" members={data.committeeMembers} />}
      {data.exOfficioMembers && <MemberList title="Ex-Officio Members" members={data.exOfficioMembers} />}
    </div>
  );
};

const KtpSubCommittees: React.FC<{ data: KTPSubCommittee[] | undefined }> = ({ data }) => {
  if (!data || data.length === 0) return <div className="p-8 bg-white rounded-xl shadow-sm text-center">No sub-committee data available.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {data.map((committee) => (
        <div key={committee.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-4">{committee.name}</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            {committee.members.map((member, index) => (
              <li key={index} className="flex justify-between items-center text-sm border-b border-slate-100 py-3 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 truncate">{member.name}</p>
                  <p className="text-slate-500 text-xs truncate">{member.role}</p>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={`tel:${member.phone.replace(/\s+/g, '')}`} className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition" title={`Call ${member.name}`}>
                      <Phone size={12} />
                    </a>
                    <a href={`https://wa.me/91${member.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 transition" title={`WhatsApp ${member.name}`}>
                      <MessageCircle size={12} />
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const KtpBudgetComponent: React.FC<{ data: KTPBudget | null | undefined }> = ({ data }) => {
    if (!data) return <div className="p-8 bg-white rounded-xl shadow-sm text-center"><Loader className="animate-spin mx-auto"/></div>;
  
    const calculateTotal = (items: BudgetItem[]) => items.reduce((sum, item) => sum + parseFloat(item.amount.replace(/,/g, '')), 0);
  
    const totalIncome = calculateTotal(data.income);
    const totalExpenditure = calculateTotal(data.expenditure);
    const balance = totalIncome - totalExpenditure;
  
    const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN')}`;
  
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 animate-in fade-in duration-300">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Project & Budget {data.year}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Income */}
          <div>
            <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2"><TrendingUp size={20}/> Sum hmuhna tura ruahman (Income)</h3>
            <div className="space-y-2 text-sm">
              {data.income.map((item) => (
                <div key={item.id} className="flex justify-between p-2 rounded hover:bg-green-50">
                  <span className="text-slate-700">{item.item}</span>
                  <span className="font-mono font-semibold text-slate-800">{formatCurrency(parseFloat(item.amount.replace(/,/g, '')))}</span>
                </div>
              ))}
              <div className="flex justify-between p-2 mt-4 border-t-2 border-green-200 font-bold">
                <span className="text-green-800">Total Income</span>
                <span className="font-mono text-green-800">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
          </div>
          {/* Expenditure */}
          <div>
            <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2"><FileDown size={20}/> Sum hmanna tura ruahman (Expenditure)</h3>
            <div className="space-y-2 text-sm">
              {data.expenditure.map((item) => (
                <div key={item.id} className="flex justify-between p-2 rounded hover:bg-red-50">
                  <span className="text-slate-700">{item.item}</span>
                  <span className="font-mono font-semibold text-slate-800">{formatCurrency(parseFloat(item.amount.replace(/,/g, '')))}</span>
                </div>
              ))}
              <div className="flex justify-between p-2 mt-4 border-t-2 border-red-200 font-bold">
                <span className="text-red-800">Total Expenditure</span>
                <span className="font-mono text-red-800">{formatCurrency(totalExpenditure)}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Balance */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
             <div className={`p-4 rounded-lg flex items-center justify-between w-full md:w-1/2 ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>Balance</span>
                <span className={`text-2xl font-mono font-black ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatCurrency(balance)}</span>
             </div>
        </div>
      </div>
    );
};


// --- Generic Stats Table Component ---
interface StatsTableProps {
  title: string;
  collectionName: string;
  columns: { key: string; label: string; type?: 'number' | 'text' }[];
  isAdmin: boolean;
}

const StatsTable: React.FC<StatsTableProps> = ({ title, collectionName, columns, isAdmin }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>({});
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
        setLoading(false);
        return;
    }
    try {
      const snapshot = await db.collection(collectionName).get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by Year Descending
      items.sort((a: any, b: any) => parseInt(b.year) - parseInt(a.year));
      setData(items);
    } catch (e) {
      console.error(`Error fetching ${collectionName}:`, e);
    }
    setLoading(false);
  }, [collectionName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!db || !db.collection) return;
    try {
      const { id, ...saveData } = editingItem;
      if (id) {
        await db.collection(collectionName).doc(id).set(saveData, { merge: true });
      } else {
        await db.collection(collectionName).add(saveData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      alert("Failed to save record.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !window.confirm("Are you sure?")) return;
    try {
      await db.collection(collectionName).doc(id).delete();
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(item => {
        const row: any = {};
        columns.forEach(col => row[col.label] = item[col.key]);
        return row;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_Export.xlsx`);
  };

  const handleTemplate = () => {
    const row: any = {};
    columns.forEach(col => row[col.label] = "");
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_Template.xlsx`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      
      const batch = db.batch();
      const ref = db.collection(collectionName);

      jsonData.forEach((row: any) => {
        const docData: any = {};
        columns.forEach(col => {
           // Map localized headers back to keys
           docData[col.key] = row[col.label] !== undefined ? String(row[col.label]) : "";
        });
        // Basic Validation: Ensure Year exists
        if (docData.year) {
            // Recalculate percentage during import if possible
            if (collectionName === 'kpvmBuhfaitham' && docData.donors && docData.totalFamilies) {
                const pct = (parseFloat(docData.donors) / parseFloat(docData.totalFamilies)) * 100;
                docData.percentage = pct.toFixed(2);
            } else if (collectionName === 'kpvmNitinInkhawm' && docData.performers && docData.totalHouses) {
                const pct = (parseFloat(docData.performers) / parseFloat(docData.totalHouses)) * 100;
                docData.percentage = pct.toFixed(2);
            }

            const newDoc = ref.doc();
            batch.set(newDoc, docData);
        }
      });

      await batch.commit();
      alert("Import successful!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Import failed. Check file format.");
    } finally {
      setIsImporting(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  // Helper to auto-calculate percentage if fields are present
  const updatePercentage = (newItem: any) => {
      let p = newItem;
      if (collectionName === 'kpvmBuhfaitham' && p.donors && p.totalFamilies) {
          const pct = (parseFloat(p.donors) / parseFloat(p.totalFamilies)) * 100;
          p.percentage = pct.toFixed(2);
      } else if (collectionName === 'kpvmNitinInkhawm' && p.performers && p.totalHouses) {
          const pct = (parseFloat(p.performers) / parseFloat(p.totalHouses)) * 100;
          p.percentage = pct.toFixed(2);
      }
      setEditingItem({...p});
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <div className="flex gap-2">
                <button onClick={handleExport} className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200" title="Export Excel">
                    <FileDown size={18} />
                </button>
                {isAdmin && (
                    <>
                        <button onClick={handleTemplate} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200" title="Download Template">
                            <Download size={18} />
                        </button>
                        <button onClick={() => importFileRef.current?.click()} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg border border-orange-200" title="Import Excel">
                            {isImporting ? <Loader className="animate-spin" size={18}/> : <FileUp size={18} />}
                        </button>
                        <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept=".xlsx, .xls" />
                        <button onClick={() => { setEditingItem({}); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold">
                            <Plus size={18} className="mr-2"/> Add Record
                        </button>
                    </>
                )}
            </div>
        </div>

        {loading ? (
            <div className="p-12 text-center"><Loader className="animate-spin mx-auto text-church-500" /></div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                            {columns.map(col => <th key={col.key} className="px-6 py-4">{col.label}</th>)}
                            {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                {columns.map(col => (
                                    <td key={col.key} className="px-6 py-4 text-slate-700 font-medium">
                                        {col.key === 'percentage' ? (
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${parseFloat(item[col.key]) >= 80 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {item[col.key]}%
                                            </span>
                                        ) : item[col.key]}
                                    </td>
                                ))}
                                {isAdmin && (
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr><td colSpan={columns.length + 1} className="p-8 text-center text-slate-400 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">{editingItem.id ? 'Edit' : 'Add'} Record</h3>
                        <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                        {columns.map(col => (
                            <div key={col.key}>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{col.label}</label>
                                <input 
                                    type={col.key === 'year' || col.type === 'number' ? 'number' : 'text'}
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-church-500 outline-none"
                                    value={editingItem[col.key] || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        const newItem = { ...editingItem, [col.key]: val };
                                        // Trigger auto-calc if relevant fields change
                                        if (['donors', 'totalFamilies', 'performers', 'totalHouses'].includes(col.key)) {
                                            updatePercentage(newItem);
                                        } else {
                                            setEditingItem(newItem);
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold">Save</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const Fellowship: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const [fellowship, setFellowship] = useState<Ministry | null | undefined>(undefined);

  const isKTP = id === 'ktp';
  const isKPVM = id === 'kpvm';
  const [ktpActiveTab, setKtpActiveTab] = useState('circular'); 
  const [kpvmActiveTab, setKpvmActiveTab] = useState('home');
  
  const [ktpHruaitute, setKtpHruaitute] = useState<KTPHruaitute | null | undefined>(undefined);
  const [ktpBudget, setKtpBudget] = useState<KTPBudget | null | undefined>(undefined);
  
  const ktpNavLinks = [
    { id: 'circular', label: '2026 Hruaitute', icon: Book },
    { id: 'sub-committees', label: 'Sub-Committees', icon: Users }, 
    { id: 'project-budget', label: 'Project & Budget', icon: DollarSign },
    { id: 'members', label: 'Member List', icon: List },
    { id: 'history', label: 'Our History', icon: History },
    { id: 'gallery', label: 'Picture Gallery', icon: Camera },
    { id: 'productions', label: 'Productions', icon: Video },
    { id: 'whoswho', label: "Who's Who", icon: UserSquare },
  ];

  const kpvmNavLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'buhfaitham', label: 'Buhfaitham', icon: TrendingUp },
    { id: 'nitin-inkhawm', label: 'Kristian Chhungkua', icon: Users },
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
    if (isKTP && db?.collection) {
      const fetchKtpData = async () => {
        try {
          const leadersDoc = await db.collection('ktpLeaders').doc('2026').get();
          if (leadersDoc.exists) setKtpHruaitute(leadersDoc.data() as KTPHruaitute);

          const budgetDoc = await db.collection('ktpBudget').doc('2026').get();
          if (budgetDoc.exists) setKtpBudget(budgetDoc.data() as KTPBudget);
        } catch (e) { console.error("Error fetching KTP data:", e); }
      };
      fetchKtpData();
    }
  }, [isKTP]);


  if (fellowship === undefined) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-church-500" /></div>;
  if (fellowship === null) return <Navigate to="/" />;

  // --- KPVM Specific Render ---
  if (isKPVM) {
      return (
          <div className="bg-slate-50 min-h-screen pb-12">
              <div className="bg-white border-b border-slate-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                      <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-slate-200 rounded-2xl overflow-hidden shadow-md shrink-0">
                              <img src={fellowship.image} alt={fellowship.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                              <h1 className="text-3xl font-serif font-bold text-slate-900">{fellowship.name}</h1>
                              <p className="text-slate-600 mt-2 max-w-2xl">{fellowship.description}</p>
                          </div>
                      </div>
                  </div>
                  {/* Tab Navigation */}
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex space-x-1 overflow-x-auto no-scrollbar">
                          {kpvmNavLinks.map(link => (
                              <button
                                  key={link.id}
                                  onClick={() => setKpvmActiveTab(link.id)}
                                  className={`flex items-center px-5 py-4 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                                      kpvmActiveTab === link.id
                                          ? 'border-church-600 text-church-700 bg-church-50/50'
                                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                  }`}
                              >
                                  <link.icon size={18} className="mr-2" />
                                  {link.label}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {kpvmActiveTab === 'home' && (
                      <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                          {/* Standard Info Card */}
                          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Users size={20} className="mr-2 text-church-600"/> Leadership & Schedule</h3>
                              <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-700">
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Leader</span>
                                      <span className="text-lg font-bold">{fellowship.leader || 'N/A'}</span>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weekly Service</span>
                                      <span className="text-lg font-bold">{fellowship.schedule || 'N/A'}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {kpvmActiveTab === 'buhfaitham' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <StatsTable 
                              title="Buhfaitham Record"
                              collectionName="kpvmBuhfaitham"
                              isAdmin={isAdmin}
                              columns={[
                                  { key: 'year', label: 'Year', type: 'number' },
                                  { key: 'totalFamilies', label: 'Chhungkaw zat', type: 'number' },
                                  { key: 'donors', label: 'Tham thei zat', type: 'number' },
                                  { key: 'percentage', label: '%', type: 'text' },
                                  { key: 'weight', label: 'Weight (kg)', type: 'text' },
                                  { key: 'amount', label: 'Amount (₹)', type: 'text' }
                              ]}
                          />
                      </div>
                  )}

                  {kpvmActiveTab === 'nitin-inkhawm' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <StatsTable 
                              title="Kristian Chhungkua (Nitin Inkhawm)"
                              collectionName="kpvmNitinInkhawm"
                              isAdmin={isAdmin}
                              columns={[
                                  { key: 'year', label: 'Year', type: 'number' },
                                  { key: 'totalHouses', label: 'In zat', type: 'number' },
                                  { key: 'performers', label: 'Inkhawm thei zat', type: 'number' },
                                  { key: 'percentage', label: '%', type: 'text' }
                              ]}
                          />
                      </div>
                  )}
              </div>
          </div>
      );
  }
  
  // --- KTP Specific Render ---
  if (isKTP) {
     return (
        <div className="bg-slate-50 min-h-screen pb-12">
              <div className="bg-church-900 text-white border-b border-church-800">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                      <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-white p-2 rounded-full shadow-xl shrink-0">
                             <img src={fellowship.image} alt={fellowship.name} className="w-full h-full object-contain rounded-full" />
                          </div>
                          <div>
                              <h1 className="text-3xl font-serif font-bold text-white">{fellowship.name}</h1>
                              <p className="text-church-200 mt-2 max-w-2xl">{fellowship.description}</p>
                          </div>
                      </div>
                  </div>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex space-x-1 overflow-x-auto no-scrollbar">
                          {ktpNavLinks.map(link => (
                              <button
                                  key={link.id}
                                  onClick={() => setKtpActiveTab(link.id)}
                                  className={`flex items-center px-4 py-3 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                                      ktpActiveTab === link.id
                                          ? 'border-yellow-400 text-yellow-300'
                                          : 'border-transparent text-church-300 hover:text-white hover:border-church-700'
                                  }`}
                              >
                                  <link.icon size={16} className="mr-2" />
                                  {link.label}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {ktpActiveTab === 'circular' && <KtpLeaders data={ktpHruaitute} />}
                 {ktpActiveTab === 'sub-committees' && <KtpSubCommittees data={ktpHruaitute?.subCommittees} />}
                 {ktpActiveTab === 'project-budget' && <KtpBudgetComponent data={ktpBudget} />}
                 {ktpActiveTab === 'members' && <div className="p-8 bg-white rounded-xl shadow-sm">Member List content goes here...</div>}
                 {ktpActiveTab === 'history' && <div className="p-8 bg-white rounded-xl shadow-sm">History content goes here...</div>}
                 {ktpActiveTab === 'gallery' && <div className="p-8 bg-white rounded-xl shadow-sm">Gallery content goes here...</div>}
                 {ktpActiveTab === 'productions' && <div className="p-8 bg-white rounded-xl shadow-sm">Productions content goes here...</div>}
                 {ktpActiveTab === 'whoswho' && <div className="p-8 bg-white rounded-xl shadow-sm">Who's Who content goes here...</div>}
              </div>
        </div>
     );
  }

  // --- Generic Fallback Render ---
  return (
    <div className="bg-slate-50 min-h-screen">
        <div className="bg-church-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 bg-white p-2 rounded-full shadow-xl shrink-0">
                        <img src={fellowship.image} alt="Logo" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-serif font-bold mb-2">{fellowship.name}</h1>
                        <p className="text-church-200 text-lg max-w-2xl">{fellowship.description}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
             <div className="bg-white p-8 rounded-xl shadow-sm">
                 <h2 className="text-2xl font-bold text-slate-800 mb-4">About {fellowship.acronym || fellowship.name}</h2>
                 <p className="text-slate-600 leading-relaxed mb-6">{fellowship.description}</p>
                 <div className="grid md:grid-cols-2 gap-6">
                     <div className="p-4 border rounded-lg">
                         <h3 className="font-bold text-slate-700">Leader</h3>
                         <p>{fellowship.leader}</p>
                     </div>
                     <div className="p-4 border rounded-lg">
                         <h3 className="font-bold text-slate-700">Schedule</h3>
                         <p>{fellowship.schedule}</p>
                     </div>
                 </div>
             </div>
        </div>
    </div>
  );
};

export default Fellowship;
