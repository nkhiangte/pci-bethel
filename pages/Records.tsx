
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ChurchRecord, BaptismRecord, WeddingRecord, DeathRecord, InkhawmpuiRecord } from '../types';
import { BookUser, HeartHandshake, Baby, Cross, Users, Plus, Edit, Trash, X, Save, Loader, AlertTriangle, FileDown, FileUp, FileSpreadsheet, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

type RecordType = 'baptism' | 'wedding' | 'death' | 'inkhawmpui';

const TEMPLATE_HEADERS: Record<RecordType, string[]> = {
    baptism: ['name', 'dateOfBirth', 'baptismDate', 'parents', 'minister'],
    wedding: ['groomName', 'brideName', 'weddingDate', 'minister'],
    death: ['name', 'dateOfDeath', 'age', 'familyContact'],
    inkhawmpui: ['eventName', 'year', 'theme', 'location', 'speakers'],
};

const formatDateCell = (value: any): string => {
  if (!value && value !== 0) return '';

  // Handle Excel serial numbers (which are numbers)
  if (typeof value === 'number' && value > 1) {
    // Excel's epoch starts on 1900-01-01, but it incorrectly considers 1900 a leap year.
    // The offset 25569 is for converting from Excel's epoch to UNIX epoch (days between 1900 and 1970).
    const date = new Date((value - 25569) * 86400 * 1000);
    // Add a check for valid date, since some numbers might not be dates
    if (isNaN(date.getTime()) || date.getUTCFullYear() < 1900 || date.getUTCFullYear() > 2100) {
        return String(value); // If conversion fails or out of range, return original number
    }
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  // Handle strings (like 'YYYY-MM-DD' from newer imports)
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    // Otherwise, return the string as is (e.g., for '??/??/1977' or if already formatted)
    return value;
  }

  return String(value);
};


const Records: React.FC = () => {
    const { t } = useLanguage();
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<RecordType>('baptism');
    const [records, setRecords] = useState<ChurchRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Partial<BaptismRecord> | Partial<WeddingRecord> | Partial<DeathRecord> | Partial<InkhawmpuiRecord> | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState<any[] | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [importFileName, setImportFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);


    const MOCK_DATA: ChurchRecord[] = [
        { id: 'b1', type: 'baptism', name: 'Lalrinfela Pachuau', dateOfBirth: '2023-01-15', baptismDate: '2023-05-20', parents: 'Pu Lalthanmawia & Pi Zorini', minister: 'Rev. H. Vanlalruata' },
        { id: 'w1', type: 'wedding', groomName: 'Samuel V.L. Hriata', brideName: 'Esther Lalhlimpuii', weddingDate: '2024-02-14', minister: 'Rev. H. Vanlalruata' },
        { id: 'd1', type: 'death', name: 'Upa C. Lalzuala', dateOfDeath: '2024-03-01', age: 78, familyContact: 'Pu Lalhruaia' },
        { id: 'i1', type: 'inkhawmpui', eventName: 'Bial Inkhawmpui Vawi 50-na', year: 2023, theme: 'Krista Chhungkua', location: 'Bethel Kohhran', speakers: 'Rev. Dr. Vanlalzuala' }
    ];

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setLoading(true);
        setIsOfflineMode(false);
        if (!db?.collection) {
            setRecords(MOCK_DATA);
            setIsOfflineMode(true);
            setLoading(false);
            return;
        }
        try {
            const snapshot = await db.collection('records').orderBy('baptismDate', 'desc').get(); // Basic sorting
            if (snapshot.empty) {
                setRecords(MOCK_DATA);
            } else {
                const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ChurchRecord[];
                setRecords(data);
            }
        } catch (error: any) {
            console.error("Error fetching records:", error.message);
            if (error.code === 'permission-denied' || error.message.includes('permission')) {
                setIsOfflineMode(true);
            }
            setRecords(MOCK_DATA);
        }
        setLoading(false);
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
        }
        setLoading(false);
    };

    const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
        const headers = TEMPLATE_HEADERS[activeTab];
        const placeholderData = [Object.fromEntries(headers.map(h => [h, `Sample ${h}`]))];

        const ws = XLSX.utils.json_to_sheet(placeholderData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        
        XLSX.writeFile(wb, `${activeTab}_template.${format}`);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportFileName(file.name);
        setImportError(null);
        setImportData(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // Read without cellDates to handle dates robustly
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                if (json.length === 0) {
                    setImportError("The file is empty or could not be read.");
                    return;
                }

                const fileHeaders = Object.keys(json[0] as object).map(h => h.trim());
                const templateHeaders = TEMPLATE_HEADERS[activeTab];

                const allHeadersMatch = templateHeaders.every(h => fileHeaders.includes(h));

                if (!allHeadersMatch) {
                    setImportError(`File headers do not match the template. Expected: [${templateHeaders.join(', ')}]. Found: [${fileHeaders.join(', ')}]`);
                    return;
                }

                const processedData = json.map(row => {
                    const newRow: { [key: string]: any } = {};
                    const dateFields = ['dateOfBirth', 'baptismDate', 'weddingDate', 'dateOfDeath'];
                    
                    templateHeaders.forEach(header => {
                        let value = (row as any)[header];
                        
                        // Sanitize undefined/null to empty string to prevent Firestore errors
                        if (value === undefined || value === null) {
                            value = '';
                        }

                        if (dateFields.includes(header) && value) {
                            let formattedDate: string | null = null;
                            if (typeof value === 'number' && value > 1) { // Excel date serial number
                                const date = XLSX.SSF.parse_date_code(value);
                                if (date) {
                                    const year = date.y;
                                    const month = String(date.m).padStart(2, '0');
                                    const day = String(date.d).padStart(2, '0');
                                    formattedDate = `${year}-${month}-${day}`;
                                }
                            } else if (value instanceof Date) { // JS Date Object
                                const year = value.getUTCFullYear();
                                const month = String(value.getUTCMonth() + 1).padStart(2, '0');
                                const day = String(value.getUTCDate()).padStart(2, '0');
                                formattedDate = `${year}-${month}-${day}`;
                            } else if (typeof value === 'string') { // Date String
                                const parsedDate = new Date(value);
                                if (!isNaN(parsedDate.getTime())) {
                                    const year = parsedDate.getFullYear();
                                    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                                    const day = String(parsedDate.getDate()).padStart(2, '0');
                                    if (year > 1900 && year < 2100) { // Basic sanity check
                                        formattedDate = `${year}-${month}-${day}`;
                                    }
                                }
                            }
                            newRow[header] = formattedDate || value.toString();
                        } else {
                            newRow[header] = value.toString();
                        }
                    });
                    return newRow;
                });

                setImportData(processedData);
            } catch (err) {
                console.error("Error parsing file:", err);
                setImportError("Failed to parse the file. Please ensure it's a valid XLSX or CSV.");
            }
        };
        reader.readAsBinaryString(file);
        setIsImportModalOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
    };

    const handleConfirmImport = async () => {
        if (!db?.batch || !importData) return;

        setLoading(true);
        try {
            const batch = db.batch();
            const recordsRef = db.collection('records');
            
            importData.forEach(row => {
                const newDocRef = recordsRef.doc();
                const recordWithType = { ...row, type: activeTab };
                batch.set(newDocRef, recordWithType);
            });

            await batch.commit();
            setIsImportModalOpen(false);
            fetchRecords(); // Refresh data
        } catch (error) {
            setImportError("An error occurred while uploading records to the database.");
            console.error(error);
        }
        setLoading(false);
    };

    const tabs = [
        { id: 'baptism', label: t.records.tabs.baptism, icon: Baby },
        { id: 'wedding', label: t.records.tabs.wedding, icon: HeartHandshake },
        { id: 'death', label: t.records.tabs.death, icon: Cross },
        { id: 'inkhawmpui', label: t.records.tabs.conference, icon: Users },
    ];
    
    const filteredRecords = records.filter(r => r.type === activeTab);
    const dateFields = ['dateOfBirth', 'baptismDate', 'weddingDate', 'dateOfDeath'];

    const searchedRecords = filteredRecords.filter(rec => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();

        switch (rec.type) {
            case 'baptism':
                return (rec.name?.toLowerCase().includes(term) || rec.minister?.toLowerCase().includes(term));
            case 'wedding':
                return (rec.groomName?.toLowerCase().includes(term) || rec.brideName?.toLowerCase().includes(term) || rec.minister?.toLowerCase().includes(term));
            case 'death':
                return (rec.name?.toLowerCase().includes(term));
            case 'inkhawmpui':
                return (rec.eventName?.toLowerCase().includes(term) || rec.speakers?.toLowerCase().includes(term));
            default:
                return false;
        }
    });

    return (
        <div className="py-12 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-serif font-bold text-church-900 mb-4 text-center">{t.records.title}</h1>
                <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">{t.records.subtitle}</p>
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 mb-8 flex flex-wrap gap-2 justify-center">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as RecordType)} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${ activeTab === tab.id ? 'bg-church-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                            <tab.icon size={16} className="mr-2" /> {tab.label}
                        </button>
                    ))}
                </div>

                {isOfflineMode && (
                    <div className="mb-6 p-3 bg-blue-50 text-blue-700 text-xs rounded text-center flex items-center justify-center">
                        <AlertTriangle size={14} className="mr-2" />
                        Public View Mode. Admin controls are disabled due to database permissions.
                    </div>
                )}

                {isAdmin && !isOfflineMode && (
                     <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-8">
                         <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                             <div className="text-center sm:text-left">
                                 <h3 className="font-bold text-slate-800">Import & Export Tools</h3>
                                 <p className="text-xs text-slate-500">Download a template or upload a completed file to add records in bulk.</p>
                             </div>
                             <div className="flex items-center gap-2 flex-wrap justify-center">
                                 <button onClick={() => handleDownloadTemplate('xlsx')} className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-md transition"><FileDown size={14}/> Download XLSX Template</button>
                                 <button onClick={() => handleDownloadTemplate('csv')} className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition"><FileDown size={14}/> Download CSV Template</button>
                                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs font-bold text-white bg-church-600 hover:bg-church-700 px-3 py-2 rounded-md transition"><FileUp size={14}/> Import Records</button>
                                 <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".xlsx, .csv" />
                             </div>
                         </div>
                     </div>
                )}

                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, minister, etc..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-church-500"
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                    {isAdmin && !isOfflineMode && (
                        <div className="flex justify-end mb-4">
                            <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm">
                                <Plus size={18} className="mr-2" /> {t.records.add}
                            </button>
                        </div>
                    )}
                    
                    <div className="overflow-x-auto">
                        {loading ? <Loader className="animate-spin mx-auto my-12" /> : searchedRecords.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">
                                {searchTerm ? `No records found for "${searchTerm}".` : t.records.empty}
                            </p>
                        ) : (
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        {TEMPLATE_HEADERS[activeTab].map(header => <th key={header} className="px-6 py-3">{t.records.theads[header as keyof typeof t.records.theads] || header}</th>)}
                                        {isAdmin && !isOfflineMode && <th className="px-6 py-3">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {searchedRecords.map(rec => (
                                        <tr key={rec.id} className="bg-white border-b hover:bg-slate-50">
                                            {TEMPLATE_HEADERS[activeTab].map(header => (
                                                <td key={header} className="px-6 py-4 font-medium text-slate-900">
                                                    {dateFields.includes(header) ? formatDateCell((rec as any)[header]) : (rec as any)[header]}
                                                </td>
                                            ))}
                                            {isAdmin && !isOfflineMode && (
                                                <td className="px-6 py-4 flex space-x-2">
                                                    <button onClick={() => handleEdit(rec)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(rec.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash size={16} /></button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {isEditModalOpen && editingRecord && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                            <div className="p-6 border-b flex justify-between items-center">
                                <h3 className="text-lg font-bold">{editingRecord.id ? 'Edit' : 'Add'} {tabs.find(t=>t.id === activeTab)?.label} Record</h3>
                                <button onClick={() => setIsEditModalOpen(false)}><X/></button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                {TEMPLATE_HEADERS[activeTab].map(field => (
                                    <div key={field}>
                                        <label className="capitalize block text-sm font-medium text-slate-600 mb-1">{field.replace(/([A-Z])/g, ' $1')}</label>
                                        <input 
                                           type={field.toLowerCase().includes('date') ? 'date' : field === 'age' || field === 'year' ? 'number' : 'text'}
                                           className="w-full border p-2 rounded" 
                                           placeholder={`Enter ${field}`}
                                           value={(editingRecord as any)[field] || ''} 
                                           onChange={e => setEditingRecord({...editingRecord, [field]: e.target.value})} 
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-end space-x-2">
                                <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button onClick={handleSave} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">
                                    {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                 {/* Import Modal */}
                {isImportModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full">
                            <div className="p-6 border-b flex justify-between items-center">
                                <h3 className="text-lg font-bold flex items-center gap-2"><FileSpreadsheet size={20}/> Import Preview</h3>
                                <button onClick={() => setIsImportModalOpen(false)}><X/></button>
                            </div>
                            <div className="p-6 max-h-[70vh] overflow-y-auto">
                                <p className="text-sm text-slate-600 mb-2">File: <span className="font-medium">{importFileName}</span></p>
                                {importError ? (
                                    <div className="bg-red-50 text-red-700 p-4 rounded text-sm"><AlertTriangle className="inline w-4 h-4 mr-2"/>{importError}</div>
                                ) : !importData ? (
                                    <div className="text-center py-8"><Loader className="animate-spin mx-auto"/> <p>Processing file...</p></div>
                                ) : (
                                    <div>
                                        <p className="text-sm text-green-700 bg-green-50 p-3 rounded mb-4">
                                            Successfully parsed <span className="font-bold">{importData.length}</span> records. Please review the preview below before uploading.
                                        </p>
                                        <div className="overflow-x-auto border rounded-lg">
                                            <table className="w-full text-xs">
                                                <thead className="bg-slate-50">
                                                    <tr>{Object.keys(importData[0]).map(h => <th key={h} className="p-2 text-left font-medium">{h}</th>)}</tr>
                                                </thead>
                                                <tbody>
                                                    {importData.slice(0, 5).map((row, idx) => (
                                                        <tr key={idx} className="border-b last:border-0">
                                                            {Object.values(row).map((val: any, i) => <td key={i} className="p-2 whitespace-nowrap">{String(val)}</td>)}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {importData.length > 5 && <p className="text-center text-xs text-slate-500 bg-slate-50 p-2">...and {importData.length - 5} more rows.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-end space-x-2">
                                <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button onClick={handleConfirmImport} disabled={!!importError || !importData || loading} className="px-4 py-2 bg-church-600 text-white rounded flex items-center disabled:opacity-50">
                                    {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} 
                                    Confirm & Upload {importData?.length || ''} Records
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Records;
