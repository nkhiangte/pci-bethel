
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ChurchRecord, BaptismRecord, WeddingRecord, DeathRecord, InkhawmpuiRecord } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BookUser, Baby, Cross, Users, Plus, Edit, Trash, X, Save, 
  Loader, AlertTriangle, FileDown, FileUp, FileSpreadsheet, 
  Search, ExternalLink, FileText, ChevronLeft, Droplet, 
  Heart, Church, ArrowRight, CheckCircle2, ArrowUp, ArrowDown, ArrowUpDown,
  BarChart3, LayoutList, PieChart, TrendingUp, UserCheck, Calendar, Camera, Upload, Database
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';

type RecordType = 'baptism' | 'wedding' | 'death' | 'inkhawmpui';
type ViewMode = 'selection' | 'details';
type DisplayMode = 'table' | 'analytics';

const TEMPLATE_HEADERS: Record<RecordType, string[]> = {
    baptism: ['name', 'dateOfBirth', 'baptismDate', 'parents', 'minister'],
    wedding: ['groomName', 'brideName', 'weddingDate', 'minister'],
    death: ['name', 'fatherName', 'age', 'dateOfDeath', 'causeOfDeath', 'minister'],
    inkhawmpui: ['eventName', 'year', 'theme', 'puipate', 'speakers'],
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

const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const Records: React.FC = () => {
    const { t, language } = useLanguage();
    const { isAdmin } = useAuth();
    
    // URL Params Integration (v6 compatible)
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const typeParam = searchParams.get('type') as RecordType | null;
    
    const activeTab = typeParam || 'baptism';
    const viewMode: ViewMode = typeParam ? 'details' : 'selection';

    const [displayMode, setDisplayMode] = useState<DisplayMode>('table');
    const [records, setRecords] = useState<ChurchRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [missingIndexUrl, setMissingIndexUrl] = useState<string | null>(null);
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Partial<BaptismRecord> | Partial<WeddingRecord> | Partial<DeathRecord> | Partial<InkhawmpuiRecord> | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState<any[] | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [importFileName, setImportFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Folder Image Customization State
    const [folderImages, setFolderImages] = useState<Record<string, string>>({});
    const [uploadingFolderId, setUploadingFolderId] = useState<string | null>(null);
    const folderImageInputRef = useRef<HTMLInputElement>(null);
    const targetFolderIdRef = useRef<string | null>(null);

    const categoryCards = [
        { id: 'baptism', title: 'Baptisma Record', sub: 'Hming & Ni chhinchhiahte', icon: Droplet, defaultImg: 'https://images.unsplash.com/photo-1544131232-026c28f09673?auto=format&fit=crop&q=80&w=800' },
        { id: 'wedding', title: 'Inneihna Record', sub: 'Inneih hriatpuina hrang hrang', icon: Heart, defaultImg: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
        { id: 'death', title: 'Thihna Record', sub: 'Mithi chhinchhiahna leh thlan', icon: Church, defaultImg: 'https://images.unsplash.com/photo-1502481851512-e9e2529bbbf9?auto=format&fit=crop&q=80&w=800' },
        { id: 'inkhawmpui', title: 'Khawmpui Record', sub: 'Bial leh Inkhawmpui Liante', icon: Users, defaultImg: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800' },
    ];

    // Fetch Folder Images
    useEffect(() => {
        const fetchFolderImages = async () => {
            if (!db || !db.collection) return;
            try {
                const doc = await db.collection('settings').doc('recordImages').get();
                if (doc.exists) {
                    setFolderImages(doc.data() as Record<string, string>);
                }
            } catch (e) {
                console.error("Error fetching record images", e);
            }
        };
        fetchFolderImages();
    }, []);

    const handleFolderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const targetId = targetFolderIdRef.current;
        
        if (!file || !targetId) return;

        setUploadingFolderId(targetId);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST', body: formData,
            });
            const result = await response.json();
            
            if (result.success) {
                const newUrl = result.data.url;
                
                // Update Firebase
                if (db && db.collection) {
                    await db.collection('settings').doc('recordImages').set({
                        [targetId]: newUrl
                    }, { merge: true });
                }

                // Update Local State
                setFolderImages(prev => ({ ...prev, [targetId]: newUrl }));
            } else {
                alert("Image upload failed.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error connecting to image server.");
        } finally {
            setUploadingFolderId(null);
            if (folderImageInputRef.current) folderImageInputRef.current.value = '';
        }
    };

    const triggerFolderImageUpload = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent card click
        targetFolderIdRef.current = id;
        folderImageInputRef.current?.click();
    };

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
            setSortConfig({ key: sortField, direction: 'desc' });
            
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
                     setSortConfig({ key: sortField, direction: 'desc' });
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
        setSearchParams({ type });
        setSearchTerm('');
        setDisplayMode('table');
    };

    const handleBack = () => {
        setSearchParams({});
    };

    const handleAddNew = () => {
        switch(activeTab) {
            case 'baptism': setEditingRecord({ type: 'baptism', name: '', dateOfBirth: '', baptismDate: '', parents: '', minister: '' }); break;
            case 'wedding': setEditingRecord({ type: 'wedding', groomName: '', brideName: '', weddingDate: '', minister: '' }); break;
            case 'death': setEditingRecord({ type: 'death', name: '', fatherName: '', age: '', dateOfDeath: '', causeOfDeath: '', minister: '' }); break;
            case 'inkhawmpui': setEditingRecord({ type: 'inkhawmpui', eventName: '', year: new Date().getFullYear(), theme: '', puipate: '', speakers: '' }); break;
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

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleExportExcel = () => {
        const headers = TEMPLATE_HEADERS[activeTab];
        const dateFields = ['dateOfBirth', 'baptismDate', 'weddingDate', 'dateOfDeath'];
        const exportData = finalSortedRecords.map(rec => {
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
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        triggerDownload(new Blob([wbout], { type: 'application/octet-stream' }), `Bethel_Kohhran_${activeTab}_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const headers = TEMPLATE_HEADERS[activeTab];
        const dateFields = ['dateOfBirth', 'baptismDate', 'weddingDate', 'dateOfDeath'];
        const tableHead = headers.map(h => t.records.theads[h as keyof typeof t.records.theads] || h);
        const tableBody = finalSortedRecords.map(rec => headers.map(header => {
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
        
        const pdfBlob = doc.output('blob');
        triggerDownload(pdfBlob, `Bethel_Kohhran_${activeTab}_Records_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setImportError(null);
        setImportFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }) as any[];
                if (json.length === 0) { setLoading(false); return; }
                const templateFields = TEMPLATE_HEADERS[activeTab];
                const headerMap: Record<string, string> = {};
                templateFields.forEach(field => {
                    headerMap[field.toLowerCase()] = field;
                    const enHeader = (t.records.theads as any)[field] || '';
                    if (enHeader) headerMap[enHeader.toLowerCase()] = field;
                });
                const mizoHeads: Record<string, string[]> = {
                    name: ['hming'],
                    fatherName: ['chhungte hming', 'pa hming', 'family', 'relative', 'parent', 'familymember'],
                    age: ['kum', 'age'],
                    dateOfBirth: ['pian ni', 'birthday'],
                    baptismDate: ['baptis ni', 'baptisma ni'],
                    parents: ['nu leh pa', 'chhungte'],
                    minister: ['inneihtir tu', 'baptistu', 'minister', 'vuitu'],
                    dateOfDeath: ['thih ni', 'date of death'],
                    causeOfDeath: ['thih chhan', 'cause of death'],
                    puipate: ['puipate', 'leaders', 'officers']
                };
                Object.entries(mizoHeads).forEach(([key, variations]) => {
                    variations.forEach(v => headerMap[v.toLowerCase()] = key);
                });
                const processedData = json.map(row => {
                    const newRow: { [key: string]: any } = {};
                    const rowKeys = Object.keys(row);
                    templateFields.forEach(targetField => {
                        const sourceKey = rowKeys.find(rk => {
                            const normalizedRK = rk.trim().toLowerCase();
                            return headerMap[normalizedRK] === targetField || normalizedRK === targetField.toLowerCase();
                        });
                        let value = sourceKey ? row[sourceKey] : '';
                        if (targetField.toLowerCase().includes('date') && typeof value === 'number') {
                            const dateObj = new Date((value - 25569) * 86400 * 1000);
                            if (!isNaN(dateObj.getTime())) value = dateObj.toISOString().split('T')[0];
                        }
                        newRow[targetField] = value.toString();
                    });
                    return newRow;
                }).filter(row => Object.values(row).some(v => v !== ''));
                if (processedData.length === 0) {
                    setImportError("Could not match any columns.");
                } else {
                    setImportData(processedData);
                    setIsImportModalOpen(true);
                }
            } catch (err) { setImportError("Failed to read Excel file."); }
            setLoading(false);
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmImport = async () => {
        if (!db?.batch || !importData) return;
        setLoading(true);
        try {
            const recordsRef = db.collection('records');
            const chunkSize = 450;
            for (let i = 0; i < importData.length; i += chunkSize) {
                const chunk = importData.slice(i, i + chunkSize);
                const batch = db.batch();
                chunk.forEach(row => {
                    const newDocRef = recordsRef.doc();
                    batch.set(newDocRef, { ...row, type: activeTab });
                });
                await batch.commit();
            }
            setIsImportModalOpen(false);
            setImportData(null);
            fetchRecords();
        } catch (error) { alert("Failed to upload."); }
        setLoading(false);
    };

    const dateFields = ['dateOfBirth', 'baptismDate', 'weddingDate', 'dateOfDeath'];

    // Analytics Processing Logic
    const stats = useMemo(() => {
        if (records.length === 0) return null;
        
        const summary: any = {
            total: records.length,
            yearlyTrends: {} as Record<string, number>,
            ministers: {} as Record<string, number>,
            avgAge: 0,
            causes: {} as Record<string, number>,
        };

        let ageSum = 0;
        let ageCount = 0;

        records.forEach((rec: any) => {
            // Year Trends
            const dateVal = rec.baptismDate || rec.weddingDate || rec.dateOfDeath || (rec.year ? String(rec.year) : '');
            if (dateVal) {
                const year = String(dateVal).split('-')[0].split('/')[0];
                if (year.length === 4) {
                    summary.yearlyTrends[year] = (summary.yearlyTrends[year] || 0) + 1;
                }
            }

            // Minister Usage
            if (rec.minister) {
                summary.ministers[rec.minister] = (summary.ministers[rec.minister] || 0) + 1;
            }

            // Death Specifics
            if (activeTab === 'death') {
                const age = parseInt(rec.age);
                if (!isNaN(age)) {
                    ageSum += age;
                    ageCount++;
                }
                if (rec.causeOfDeath) {
                    summary.causes[rec.causeOfDeath] = (summary.causes[rec.causeOfDeath] || 0) + 1;
                }
            }
        });

        summary.avgAge = ageCount > 0 ? (ageSum / ageCount).toFixed(1) : 0;
        
        // Transform trends to sorted array for display
        summary.trendData = Object.entries(summary.yearlyTrends)
            .map(([year, count]) => ({ year, count: count as number }))
            .sort((a, b) => a.year.localeCompare(b.year));

        summary.topMinisters = Object.entries(summary.ministers)
            .map(([name, count]) => ({ name, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
            
        summary.topCauses = Object.entries(summary.causes)
            .map(([name, count]) => ({ name, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return summary;
    }, [records, activeTab]);

    // Filtering
    const searchedRecords = useMemo(() => {
        return records.filter(rec => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            switch (rec.type) {
                case 'baptism': {
                    const r = rec as BaptismRecord;
                    return (
                        r.name?.toLowerCase().includes(term) || 
                        r.minister?.toLowerCase().includes(term) ||
                        r.parents?.toLowerCase().includes(term) ||
                        r.baptismDate?.includes(term) ||
                        r.dateOfBirth?.includes(term)
                    );
                }
                case 'wedding': return (rec.groomName?.toLowerCase().includes(term) || rec.brideName?.toLowerCase().includes(term) || rec.minister?.toLowerCase().includes(term) || (rec as WeddingRecord).weddingDate?.includes(term));
                case 'death': return (rec.name?.toLowerCase().includes(term) || (rec as DeathRecord).fatherName?.toLowerCase().includes(term) || (rec as DeathRecord).dateOfDeath?.includes(term));
                case 'inkhawmpui': return (rec.eventName?.toLowerCase().includes(term) || (rec as InkhawmpuiRecord).speakers?.toLowerCase().includes(term) || (rec as InkhawmpuiRecord).puipate?.toLowerCase().includes(term) || String((rec as InkhawmpuiRecord).year).includes(term));
                default: return false;
            }
        });
    }, [records, searchTerm]);

    // Derived Sorting
    const finalSortedRecords = useMemo(() => {
        if (!sortConfig) return searchedRecords;
        const sorted = [...searchedRecords].sort((a, b) => {
            const aVal = (a as any)[sortConfig.key] || '';
            const bVal = (b as any)[sortConfig.key] || '';
            if (typeof aVal === 'number' && typeof bVal === 'number') return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            const compareResult = String(aVal).localeCompare(String(bVal));
            return sortConfig.direction === 'asc' ? compareResult : -compareResult;
        });
        return sorted;
    }, [searchedRecords, sortConfig]);

    // Helper function to apply specific colors to Inkhawmpui columns
    const getCellClass = (type: RecordType, header: string) => {
        // Base styles for reuse
        const nameStyle = 'font-bold text-slate-900 text-base';
        const dateBadgeStyle = 'font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg text-xs font-bold inline-block border border-blue-100 shadow-sm';
        const ministerStyle = 'text-purple-700 font-bold text-xs bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 inline-block';
        
        switch(type) {
            case 'baptism':
                switch(header) {
                    case 'name': return nameStyle;
                    case 'dateOfBirth': return 'text-slate-500 font-mono text-xs';
                    case 'baptismDate': return dateBadgeStyle;
                    case 'parents': return 'text-slate-600 italic border-l-2 border-slate-200 pl-3 text-sm';
                    case 'minister': return ministerStyle;
                    default: return 'text-slate-700';
                }
            case 'wedding':
                switch(header) {
                    case 'groomName': return 'font-bold text-blue-900 text-base';
                    case 'brideName': return 'font-bold text-pink-900 text-base';
                    case 'weddingDate': return 'font-mono text-pink-700 bg-pink-50 px-2.5 py-1 rounded-lg text-xs font-bold inline-block border border-pink-100 shadow-sm';
                    case 'minister': return ministerStyle;
                    default: return 'text-slate-700';
                }
            case 'death':
                switch(header) {
                    case 'name': return 'font-bold text-slate-900 text-base';
                    case 'fatherName': return 'text-slate-500 text-sm';
                    case 'age': return 'font-mono font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs border border-orange-100 inline-block';
                    case 'dateOfDeath': return 'font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-bold inline-block border border-slate-200';
                    case 'causeOfDeath': return 'text-red-600 italic text-sm font-medium';
                    case 'minister': return ministerStyle;
                    default: return 'text-slate-700';
                }
            case 'inkhawmpui':
                switch(header) {
                    case 'eventName': return 'font-bold text-church-800 text-base leading-tight'; // Highlight Event Name
                    case 'year': return dateBadgeStyle; // Badge for Year
                    case 'theme': return 'text-slate-600 italic font-serif border-l-2 border-church-200 pl-3'; // Distinct Theme style
                    case 'puipate': return 'text-slate-800 text-xs font-medium bg-orange-50/50 p-2.5 rounded-lg border border-orange-100 whitespace-pre-line leading-relaxed'; // Box for Leaders
                    case 'speakers': return 'text-purple-700 font-semibold'; // Color for Speakers
                    default: return 'text-slate-700';
                }
            default: return 'text-slate-700';
        }
    };

    if (viewMode === 'selection') {
        return (
            <div className="bg-[#0f0a1a] min-h-screen text-white pb-24">
                <div className="max-w-4xl mx-auto px-6 pt-12 mb-8">
                    <p className="text-purple-600 font-bold tracking-widest text-xs mb-3 uppercase">CHAMPHAI BETHEL KOHHRAN</p>
                    <h1 className="text-4xl md:text-5xl font-serif font-black mb-2 tracking-tight">Record hrang hrangte</h1>
                    <p className="text-slate-400 text-sm md:text-base font-medium">Zawnna awlsam zawk nan leh hriatpuina atan.</p>
                </div>
                <div className="max-w-4xl mx-auto px-6 mb-12">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-600 group-focus-within:text-purple-400 transition-colors" size={20} />
                        <input type="text" placeholder="Zawnna (Hming/Ni/Thla/Kum)..." className="w-full bg-[#1c142b] border-none rounded-2xl pl-14 pr-6 py-5 text-lg font-medium placeholder-slate-500 focus:ring-2 focus:ring-purple-600 outline-none transition-all shadow-lg" />
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {categoryCards.map((card) => {
                        const bgImage = folderImages[card.id] || card.defaultImg;
                        const isUploading = uploadingFolderId === card.id;

                        return (
                            <div key={card.id} className="relative group">
                                <button onClick={() => handleSelectCategory(card.id as RecordType)} className="w-full relative aspect-[1.2/1] rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-2xl">
                                    <img src={bgImage} alt={card.title} className="absolute inset-0 w-full h-full object-cover brightness-[0.6] group-hover:brightness-[0.7] transition-all" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1a] via-transparent to-transparent opacity-80"></div>
                                    <div className="absolute top-6 right-6 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform"><card.icon size={22} className="text-white fill-current" /></div>
                                    <div className="absolute bottom-8 left-8 text-left">
                                        <h3 className="text-2xl font-serif font-black text-white leading-tight mb-2">{card.title}</h3>
                                        <p className="text-slate-300 text-sm font-medium">{card.sub}</p>
                                    </div>
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                                            <Loader className="animate-spin text-white w-8 h-8" />
                                        </div>
                                    )}
                                </button>
                                
                                {/* Admin Edit Image Button */}
                                {isAdmin && (
                                    <button 
                                        onClick={(e) => triggerFolderImageUpload(e, card.id)}
                                        className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-sm transition-all z-10 opacity-0 group-hover:opacity-100"
                                        title="Change Cover Image"
                                    >
                                        <Camera size={16} />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
                {/* Hidden Input for Folder Image Upload */}
                <input 
                    type="file" 
                    ref={folderImageInputRef} 
                    className="hidden" 
                    onChange={handleFolderImageUpload} 
                    accept="image/*" 
                />
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="bg-church-900 py-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none transform -rotate-12 scale-150"><BookUser size={300} /></div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <button onClick={handleBack} className="flex items-center text-church-200 hover:text-white mb-4 transition font-bold"><ChevronLeft size={20} /> Back to Records</button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <h1 className="text-4xl font-serif font-black">{t.records.tabs[activeTab === 'inkhawmpui' ? 'conference' : activeTab]} Register</h1>
                        
                        <div className="flex bg-church-800/50 p-1 rounded-xl border border-white/10">
                            <button 
                                onClick={() => setDisplayMode('table')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${displayMode === 'table' ? 'bg-church-600 text-white shadow-lg' : 'text-church-200 hover:text-white'}`}
                            >
                                <LayoutList size={16} /> Table
                            </button>
                            <button 
                                onClick={() => setDisplayMode('analytics')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${displayMode === 'analytics' ? 'bg-church-600 text-white shadow-lg' : 'text-church-200 hover:text-white'}`}
                            >
                                <BarChart3 size={16} /> Analytics
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {displayMode === 'table' ? (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1">
                                <div className="bg-white text-slate-600 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm whitespace-nowrap border border-slate-200 w-full sm:w-auto justify-center sm:justify-start ring-1 ring-slate-100">
                                    <div className="bg-church-50 p-1.5 rounded-md">
                                        <Database size={14} className="text-church-600" />
                                    </div>
                                    <span>{finalSortedRecords.length} Records Found</span>
                                </div>
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                        placeholder={activeTab === 'baptism' ? "Search Name, Parents, Year, Minister..." : "Search records..."}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-church-500 outline-none transition" 
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                {isAdmin && (
                                    <>
                                        <button onClick={handleExportExcel} className="p-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition" title="Export Excel"><FileSpreadsheet size={20}/></button>
                                        <button onClick={handleExportPDF} className="p-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition" title="Export PDF"><FileText size={20}/></button>
                                        <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-church-50 text-church-600 rounded-lg hover:bg-church-100 transition" title="Import Data"><FileUp size={20}/></button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".xlsx, .csv" />
                                        <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
                                        <button onClick={handleAddNew} className="flex items-center px-4 py-2.5 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold transition shadow-sm whitespace-nowrap"><Plus size={18} className="mr-2" /> Add Entry</button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="text-center py-24"><Loader className="animate-spin h-10 w-10 mx-auto text-church-500" /></div>
                                ) : finalSortedRecords.length === 0 ? (
                                    <div className="text-center py-24 text-slate-400 italic">No records found.</div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest">
                                            <tr>
                                                {TEMPLATE_HEADERS[activeTab].map(header => (
                                                    <th key={header} className="px-6 py-5 cursor-pointer hover:bg-slate-800 transition-colors group/th" onClick={() => handleSort(header)}>
                                                        <div className="flex items-center">{t.records.theads[header as keyof typeof t.records.theads] || header}
                                                            <span className="ml-2">{sortConfig?.key === header ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-church-400" /> : <ArrowDown size={14} className="text-church-400" />) : (<ArrowUpDown size={14} className="text-slate-600 group-hover/th:text-slate-400" />)}</span>
                                                        </div>
                                                    </th>
                                                ))}
                                                {isAdmin && <th className="px-6 py-5 text-right font-black">Actions</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {finalSortedRecords.map(rec => (
                                                <tr key={rec.id} className="hover:bg-slate-50 transition group/row">
                                                    {TEMPLATE_HEADERS[activeTab].map(header => (
                                                        <td key={header} className={`px-6 py-5 text-sm font-medium ${getCellClass(activeTab, header)}`}>
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
                    </>
                ) : (
                    /* Analytics View Mode */
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {loading || !stats ? (
                             <div className="text-center py-24"><Loader className="animate-spin h-10 w-10 mx-auto text-church-500" /></div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Quick Stats */}
                                <div className="space-y-6">
                                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-church-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 relative z-10">Total Records</p>
                                        <div className="flex items-end gap-3 relative z-10">
                                            <span className="text-5xl font-serif font-black text-slate-900">{stats.total}</span>
                                            <span className="text-church-600 font-bold mb-1.5 uppercase text-[10px] tracking-widest">Entries</span>
                                        </div>
                                    </div>

                                    {activeTab === 'death' && (
                                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 relative z-10">Average Age</p>
                                            <div className="flex items-end gap-3 relative z-10">
                                                <span className="text-5xl font-serif font-black text-slate-900">{stats.avgAge}</span>
                                                <span className="text-blue-600 font-bold mb-1.5 uppercase text-[10px] tracking-widest">Years</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl text-white">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                                            <UserCheck size={14} className="text-church-400" />
                                            Top Ministers
                                        </h3>
                                        <div className="space-y-5">
                                            {stats.topMinisters.map((m: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center group">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{m.name}</p>
                                                        <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5">
                                                            <div className="bg-church-500 h-1 rounded-full" style={{ width: `${(m.count / stats.total) * 100}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-black bg-slate-800 px-2.5 py-1 rounded-lg text-church-400">{m.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Trends & Details */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Yearly Trend Chart */}
                                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                                        <div className="flex items-center justify-between mb-10">
                                            <h3 className="text-lg font-serif font-black text-slate-900">Yearly Trends</h3>
                                            <TrendingUp size={20} className="text-church-600" />
                                        </div>
                                        <div className="h-64 flex items-end gap-2 md:gap-4">
                                            {stats.trendData.slice(-12).map((d: any, i: number) => {
                                                const max = Math.max(...stats.trendData.map((x: any) => x.count));
                                                const height = (d.count / max) * 100;
                                                return (
                                                    <div key={i} className="flex-1 flex flex-col items-center group">
                                                        <div className="relative w-full flex justify-center">
                                                            <div className="bg-slate-50 group-hover:bg-church-50 transition-colors rounded-t-xl w-full h-64 absolute bottom-0 -z-10 opacity-50"></div>
                                                            <div 
                                                                className="bg-church-200 group-hover:bg-church-500 transition-all duration-500 rounded-t-xl w-full relative" 
                                                                style={{ height: `${height}%`, minHeight: '4px' }}
                                                            >
                                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {d.count}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 mt-4 rotate-45 md:rotate-0">{d.year}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Sub-details (e.g. Cause of Death) */}
                                    {activeTab === 'death' && (
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Common Causes</h3>
                                                <div className="space-y-4">
                                                    {stats.topCauses.map((c: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between">
                                                            <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                                            <span className="text-xs font-black text-slate-400">{c.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-church-600 p-8 rounded-[2.5rem] shadow-lg text-white flex flex-col justify-center items-center text-center">
                                                <PieChart size={40} className="mb-4 text-church-200" />
                                                <h4 className="text-xl font-serif font-black mb-2">Detailed Reports</h4>
                                                <p className="text-church-100 text-xs mb-6 font-medium">Export all records for further analysis in spreadsheet software.</p>
                                                <button onClick={handleExportExcel} className="bg-white text-church-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-church-50 transition shadow-lg">Download Data</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Import Confirmation Modal */}
            {isImportModalOpen && importData && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b bg-church-50 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-church-600 text-white rounded-2xl shadow-lg"><FileUp size={24} /></div>
                                <div>
                                    <h3 className="text-2xl font-serif font-black text-church-900 leading-tight">Confirm Import</h3>
                                    <p className="text-slate-500 text-sm font-medium">{importFileName} • {importData.length} records found</p>
                                </div>
                            </div>
                            <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-white rounded-full transition text-slate-400 hover:text-slate-600"><X size={24}/></button>
                        </div>
                        <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-[0.1em]">
                                        <tr>{TEMPLATE_HEADERS[activeTab].map(header => (<th key={header} className="px-4 py-3">{t.records.theads[header as keyof typeof t.records.theads] || header}</th>))}</tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {importData.slice(0, 15).map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">{TEMPLATE_HEADERS[activeTab].map(header => (<td key={header} className="px-4 py-3 text-slate-600 font-medium">{row[header] || '-'}</td>))}</tr>
                                        ))}
                                    </tbody>
                                </table>
                                {importData.length > 15 && (<div className="p-4 bg-slate-50 text-center text-slate-500 text-xs font-bold uppercase tracking-widest border-t">And {importData.length - 15} more records...</div>)}
                            </div>
                        </div>
                        <div className="p-8 border-t bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-slate-500 text-xs max-w-md text-center sm:text-left"><AlertTriangle className="inline mr-1 text-orange-400" size={14} /> Please verify the data before proceeding.</p>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button onClick={() => setIsImportModalOpen(false)} className="flex-1 sm:flex-none px-6 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={handleConfirmImport} disabled={loading} className="flex-1 sm:flex-none px-8 py-3 bg-church-600 text-white font-bold rounded-xl shadow-lg shadow-church-200 hover:bg-church-700 flex items-center justify-center transition disabled:opacity-50">{loading ? <Loader className="animate-spin mr-2" size={18}/> : <CheckCircle2 className="mr-2" size={18} />} Import All</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingRecord && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-church-50 rounded-t-2xl">
                            <h3 className="text-xl font-serif font-black text-church-900">{editingRecord.id ? 'Edit' : 'Add'} Record</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white rounded-full transition text-slate-400"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {TEMPLATE_HEADERS[activeTab].map(field => (
                                <div key={field}>
                                    <label className="capitalize block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">{t.records.theads[field as keyof typeof t.records.theads] || field.replace(/([A-Z])/g, ' $1')}</label>
                                    {field === 'puipate' ? (
                                        <textarea 
                                            className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition bg-slate-50 focus:bg-white h-24" 
                                            value={(editingRecord as any)[field] || ''} 
                                            onChange={e => setEditingRecord({ ...editingRecord, [field]: e.target.value } as any)}
                                            placeholder="Enter names, one per line or separated by commas"
                                        />
                                    ) : (
                                        <input 
                                            type={dateFields.includes(field) ? 'date' : field === 'age' || field === 'year' ? 'number' : 'text'} 
                                            className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition bg-slate-50 focus:bg-white" 
                                            value={(editingRecord as any)[field] || ''} 
                                            onChange={e => setEditingRecord({ ...editingRecord, [field]: e.target.value } as any)} 
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-slate-50 flex justify-end space-x-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-slate-700 font-bold hover:bg-white transition rounded-xl">Cancel</button>
                            <button onClick={handleSave} className="px-8 py-2.5 bg-church-600 text-white rounded-xl flex items-center shadow-lg font-bold hover:bg-church-700 transition">{loading ? <Loader className="animate-spin h-4 w-4 mr-2" /> : <Save size={16} className="mr-2" />} Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Records;
