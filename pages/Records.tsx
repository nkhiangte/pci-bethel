
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ChurchRecord, BaptismRecord, WeddingRecord, DeathRecord, InkhawmpuiRecord } from '../types';
import { 
  BookUser, Baby, Cross, Users, Plus, Edit, Trash, X, Save, 
  Loader, AlertTriangle, FileDown, FileUp, FileSpreadsheet, 
  Search, ExternalLink, FileText, ChevronLeft, Droplet, 
  Heart, Church, ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type RecordType = 'baptism' | 'wedding' | 'death' | 'inkhawmpui';
type ViewMode = 'selection' | 'details';

const TEMPLATE_HEADERS: Record<RecordType, string[]> = {
    baptism: ['name', 'dateOfBirth', 'baptismDate', 'parents', 'minister'],
    wedding: ['groomName', 'brideName', 'weddingDate', 'minister'],
    death: ['name', 'dateOfDeath', 'age', 'familyContact'],
    inkhawmpui: ['eventName', 'year', 'theme', 'location', 'speakers'],
};

const DATE_SORT_FIELD_MAP: Record<RecordType, string> = {
    baptism: 'baptismDate',
    wedding: 'weddingDate',
    death: 'dateOfDeath',
    inkhawmpui: 'year',
};

const formatDateCell = (value: any): string => {
  if (!value && value !== 0) return '';
  if (typeof value === 'number' && value > 1) {
    const date = new Date((value - 25569) * 86400 * 1000);
    if (isNaN(date.getTime()) || date.getUTCFullYear() < 1800 || date.getUTCFullYear() > 2100) return String(value);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getUTCFullYear()}`;
  }
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    return value;
  }
  return String(value);
};

const Records: React.FC = () => {
    const { t, language } = useLanguage();
    const { isAdmin } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>('selection');
    const [activeTab, setActiveTab] = useState<RecordType>('baptism');
    const [records, setRecords] = useState<ChurchRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [missingIndexUrl, setMissingIndexUrl] = useState<string | null>(null);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Partial<BaptismRecord> | Partial<WeddingRecord> | Partial<DeathRecord> | Partial<InkhawmpuiRecord> | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState<any[] | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [importFileName, setImportFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchRecords = useCallback(async () => {
        if (viewMode === 'selection') return;
        
        setLoading(true);
        setIsOfflineMode(false);
        setMissingIndexUrl(null);
        
        const sortField = DATE_SORT_FIELD_MAP[activeTab];

        if (!db?.collection) {
            setRecords([]); 
            setIsOfflineMode(true);
            setLoading(false);
            return;
        }

        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('timeout')), 8000)
            );

            const fetchPromise = db.collection('records')
                                     .where('type', '==', activeTab)
                                     .orderBy(sortField, 'desc')
                                     .get();
                                     
            const snapshot: any = await Promise.race([fetchPromise, timeoutPromise]);
            const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ChurchRecord[];
            setRecords(data);
            
        } catch (error: any) {
            console.error("Fetch Error:", error.message);
            const errorMessage = error.message || '';
            const isIndexError = error.code === 'failed-precondition' || errorMessage.toLowerCase().includes('index');
            const isTimeout = errorMessage === 'timeout';

            if (isIndexError || isTimeout) {
                 if (isIndexError) {
                    const match = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
                    setMissingIndexUrl(match ? match[0] : "https://console.firebase.google.com/project/bethelpci/firestore/indexes");
                 }

                 try {
                     const fallbackSnapshot = await db.collection('records')
                                              .where('type', '==', activeTab)
                                              .get();
                    
                     const data = fallbackSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ChurchRecord[];
                     data.sort((a: any, b: any) => {
                         const valA = a[sortField];
                         const valB = b[sortField];
                         if (activeTab === 'inkhawmpui') return (Number(valB) || 0) - (Number(valA) || 0);
                         return String(valB || '').localeCompare(String(valA || ''));
                     });
                     setRecords(data);
                     if (isTimeout) setIsOfflineMode(true);
                 } catch (fallbackError) {
                     setRecords([]);
                 }
            } else {
                setRecords([]);
            }
        }
        setLoading(false);
    }, [activeTab, viewMode]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleSelectCategory = (type: RecordType) => {
        setActiveTab(type);
        setViewMode('details');
        setSearchTerm('');
    };

    const handleAddNew = () => {
        switch(activeTab) {
            case 'baptism': setEditingRecord({ type: 'baptism', name: '', dateOfBirth: '', baptismDate: '', parents: '', minister: '' }); break;
            case 'wedding': setEditingRecord({ type: 'wedding', groomName: '', brideName: '', weddingDate: '', minister: '' }); break;
            case 'death': setEditingRecord({ type: 'death', name: '', dateOfDeath: '', age: 0, familyContact: '' }); break;
            case 'inkhawmpui': setEditingRecord({ type: 'inkhawmpui', eventName: '', year: new Date().getFullYear(), theme: '', location: '', speakers: '' }); break;
        }
        setIsEditModalOpen(true);
    };
    
    const handleEdit = (record: ChurchRecord) => {
        setEditingRecord(record);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!db?.doc || !window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await db.collection('records').doc(id).delete();
            fetchRecords();
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    };
    
    const handleSave = async () => {
        if (!db?.collection || !editingRecord) return;
        setLoading(true);
        try {
            const { id, ...data } = editingRecord;
            if (id) {
                await db.collection('records').doc(id).set(data, { merge: true });
            } else {
                await db.collection('records').add(data);
            }
            setIsEditModalOpen(false);
            fetchRecords();
        } catch (error) {
            console.error("Error saving record:", error);
            alert("Connection error. Record might not have saved to server yet.");
        }
        setLoading(false);
    };

    const handleExportExcel = () => {
        const headers = TEMPLATE_HEADERS[activeTab];
        const dateFields = ['dateOfBirth', 'baptismDate', 'weddingDate', 'dateOfDeath'];
        const exportData = searchedRecords.map(rec => {
            const row: any = {};
            headers.forEach(header => {
                const displayHeader = t.records.theads[header as keyof typeof t.records.theads] || header;
                const value = (rec as any)[header];
                row[displayHeader] = dateFields.includes(header) ? formatDateCell(value) : value;
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Records");
        XLSX.writeFile(wb, `Bethel_Kohhran_${activeTab}_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const headers = TEMPLATE_HEADERS[activeTab];
        const dateFields = ['dateOfBirth', 'baptismDate', 'weddingDate', 'dateOfDeath'];
        const tableHead = headers.map(h => t.records.theads[h as keyof typeof t.records.theads] || h);
        const tableBody = searchedRecords.map(rec => headers.map(header => {
            const value = (rec as any)[header];
            return dateFields.includes(header) ? formatDateCell(value) : (value || '');
        }));
        doc.setFontSize(16);
        doc.text(`${t.records.tabs[activeTab === 'inkhawmpui' ? 'conference' : activeTab]} Records`, 14, 20);
        autoTable(doc, {
            head: [tableHead],
            body: tableBody,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [134, 120, 79] }, 
            styles: { fontSize: 8 }
        });
        doc.save(`Bethel_Kohhran_${activeTab}_Records_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setImportFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];
                const processedData = json.map(row => {
                    const newRow: { [key: string]: any } = {};
                    const templateHeaders = TEMPLATE_HEADERS[activeTab];
                    templateHeaders.forEach(header => {
                        let value = (row as any)[header] || '';
                        newRow[header] = value.toString();
                    });
                    return newRow;
                });
                setImportData(processedData);
                setIsImportModalOpen(true);
            } catch (err) {
                console.error("Import error", err);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmImport = async () => {
        if (!db?.batch || !importData) return;
        setLoading(true);
        try {
            const batch = db.batch();
            const recordsRef = db.collection('records');
            importData.forEach(row => {
                const newDocRef = recordsRef.doc();
                batch.set(newDocRef, { ...row, type: activeTab });
            });
            await batch.commit();
            setIsImportModalOpen(false);
            fetchRecords();
        } catch (error) {
            console.error("Upload failed", error);
        }
        setLoading(false);
    };

    const dateFields = ['dateOfBirth', 'baptismDate', 'weddingDate', 'dateOfDeath'];

    const searchedRecords = records.filter(rec => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        switch (rec.type) {
            case 'baptism': return (rec.name?.toLowerCase().includes(term) || rec.minister?.toLowerCase().includes(term));
            case 'wedding': return (rec.groomName?.toLowerCase().includes(term) || rec.brideName?.toLowerCase().includes(term) || rec.minister?.toLowerCase().includes(term));
            case 'death': return (rec.name?.toLowerCase().includes(term));
            case 'inkhawmpui': return (rec.eventName?.toLowerCase().includes(term) || rec.speakers?.toLowerCase().includes(term));
            default: return false;
        }
    });

    const categoryCards = [
        { 
            id: 'baptism', 
            title: 'Baptisma Record', 
            sub: 'Hming & Ni chhinchhiahte', 
            icon: Droplet, 
            img: 'https://images.unsplash.com/photo-1544131232-026c28f09673?auto=format&fit=crop&q=80&w=800' 
        },
        { 
            id: 'wedding', 
            title: 'Inneihna Record', 
            sub: 'Inneih hriatpuina hrang hrang', 
            icon: Heart, 
            img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' 
        },
        { 
            id: 'death', 
            title: 'Thihna Record', 
            sub: 'Mithi chhinchhiahna leh thlan', 
            icon: Church, 
            img: 'https://images.unsplash.com/photo-1502481851512-e9e2529bbbf9?auto=format&fit=crop&q=80&w=800' 
        },
        { 
            id: 'inkhawmpui', 
            title: 'Khawmpui Record', 
            sub: 'Bial leh Inkhawmpui Liante', 
            icon: Users, 
            img: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800' 
        },
    ];

    if (viewMode === 'selection') {
        return (
            <div className="bg-[#0f0a1a] min-h-screen text-white pb-24">
                {/* Header matching screenshot */}
                <div className="max-w-4xl mx-auto px-6 pt-12 mb-8">
                    <p className="text-purple-600 font-bold tracking-widest text-xs mb-3 uppercase">CHAMPHAI BETHEL KOHHRAN</p>
                    <h1 className="text-4xl md:text-5xl font-serif font-black mb-2 tracking-tight">Record hrang hrangte</h1>
                    <p className="text-slate-400 text-sm md:text-base font-medium">Zawnna awlsam zawk nan leh hriatpuina atan.</p>
                </div>

                {/* Search Bar matching screenshot */}
                <div className="max-w-4xl mx-auto px-6 mb-12">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-600 group-focus-within:text-purple-400 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Zawnna (Hming/Ni/Thla/Kum)..."
                            className="w-full bg-[#1c142b] border-none rounded-2xl pl-14 pr-6 py-5 text-lg font-medium placeholder-slate-500 focus:ring-2 focus:ring-purple-600 outline-none transition-all shadow-lg"
                        />
                    </div>
                </div>

                {/* Selection Grid matching screenshot */}
                <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {categoryCards.map((card) => (
                        <button 
                            key={card.id} 
                            onClick={() => handleSelectCategory(card.id as RecordType)}
                            className="relative aspect-[1.2/1] rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-2xl"
                        >
                            <img src={card.img} alt={card.title} className="absolute inset-0 w-full h-full object-cover brightness-[0.6] group-hover:brightness-[0.7] transition-all" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1a] via-transparent to-transparent opacity-80"></div>
                            
                            {/* Floating Purple Icon Badge */}
                            <div className="absolute top-6 right-6 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                                <card.icon size={22} className="text-white fill-current" />
                            </div>

                            <div className="absolute bottom-8 left-8 text-left">
                                <h3 className="text-2xl font-serif font-black text-white leading-tight mb-2">{card.title}</h3>
                                <p className="text-slate-300 text-sm font-medium">{card.sub}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Details View Header */}
            <div className="bg-church-900 py-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none transform -rotate-12 scale-150">
                    <BookUser size={300} />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <button 
                        onClick={() => setViewMode('selection')}
                        className="flex items-center text-church-200 hover:text-white mb-4 transition font-bold"
                    >
                        <ChevronLeft size={20} /> Back to Records
                    </button>
                    <h1 className="text-4xl font-serif font-black">{t.records.tabs[activeTab === 'inkhawmpui' ? 'conference' : activeTab]} Register</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {isOfflineMode && (
                    <div className="mb-6 p-3 bg-blue-50 text-blue-700 text-xs rounded text-center border border-blue-100 flex items-center justify-center">
                        <AlertTriangle size={14} className="mr-2" />
                        Operating in limited connectivity mode.
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search in these records..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-church-500 outline-none transition"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {isAdmin && (
                            <>
                                <button onClick={handleExportExcel} className="p-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition" title="Export Excel"><FileSpreadsheet size={20}/></button>
                                <button onClick={handleExportPDF} className="p-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition" title="Export PDF"><FileText size={20}/></button>
                                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-church-50 text-church-600 rounded-lg hover:bg-church-100 transition" title="Import Data"><FileUp size={20}/></button>
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".xlsx, .csv" />
                                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                                <button onClick={handleAddNew} className="flex items-center px-4 py-2.5 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold transition shadow-sm">
                                    <Plus size={18} className="mr-2" /> Add Entry
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="text-center py-24"><Loader className="animate-spin h-10 w-10 mx-auto text-church-500" /></div>
                        ) : searchedRecords.length === 0 ? (
                            <div className="text-center py-24 text-slate-400 italic">No records found.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-white uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        {TEMPLATE_HEADERS[activeTab].map(header => (
                                            <th key={header} className="px-6 py-5">{t.records.theads[header as keyof typeof t.records.theads] || header}</th>
                                        ))}
                                        {isAdmin && <th className="px-6 py-5 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {searchedRecords.map(rec => (
                                        <tr key={rec.id} className="hover:bg-slate-50 transition">
                                            {TEMPLATE_HEADERS[activeTab].map(header => (
                                                <td key={header} className="px-6 py-5 text-sm text-slate-700 font-medium">
                                                    {dateFields.includes(header) ? formatDateCell((rec as any)[header]) : (rec as any)[header]}
                                                </td>
                                            ))}
                                            {isAdmin && (
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button onClick={() => handleEdit(rec)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16} /></button>
                                                        <button onClick={() => handleDelete(rec.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash size={16} /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Existing Edit Modal */}
            {isEditModalOpen && editingRecord && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b flex justify-between items-center bg-church-50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-church-900">{editingRecord.id ? 'Edit' : 'Add'} Record</h3>
                            <button onClick={() => setIsEditModalOpen(false)}><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {TEMPLATE_HEADERS[activeTab].map(field => (
                                <div key={field}>
                                    <label className="capitalize block text-sm font-bold text-slate-600 mb-1">{field.replace(/([A-Z])/g, ' $1')}</label>
                                    <input 
                                       type={field.toLowerCase().includes('date') ? 'date' : field === 'age' || field === 'year' ? 'number' : 'text'}
                                       className="w-full border border-slate-300 p-2.5 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" 
                                       value={(editingRecord as any)[field] || ''} 
                                       onChange={e => setEditingRecord({...editingRecord, [field]: e.target.value})} 
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-slate-50 flex justify-end space-x-2 rounded-b-2xl">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-slate-700 font-bold hover:bg-white transition rounded-xl">Cancel</button>
                            <button onClick={handleSave} className="px-5 py-2.5 bg-church-600 text-white rounded-xl flex items-center shadow-lg font-bold hover:bg-church-700 transition">
                                {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Records;
