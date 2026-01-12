
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ArchiveEntry } from '../types';
import { Archive, FileText, Image, Video, History, File, Plus, Edit, Trash, Search, Loader, ExternalLink, X, Save, Users, Database, ChevronLeft, FolderOpen, AlertTriangle, UserSearch, Play, ArrowLeft, DollarSign, Globe, Home, Heart, Coffee, Smile, Library, Mic, Mic2, GraduationCap, Book, BookOpen, Music, Settings, UserCheck, Cross, Upload, Trash2, ZoomIn, Calendar } from 'lucide-react';

const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'Document': FileText,
    'Photo': Image,
    'Video': Video,
    'History': History,
    'Minute': File,
    'Rawngbawltu te': Users,
    'Pastors': UserCheck,
    'Upa kal ta te': Cross
};

const SUB_CATEGORY_ICONS: Record<string, React.ElementType> = {
    'Executive Body': Users,
    'Ramthar': Globe,
    'FINANCE': DollarSign,
    'BUILDING': Home,
    'SOCIAL FRONT': Heart,
    'REFRESHMENT': Coffee,
    'KRISTIAN CHHUNGKUA': Home,
    'WORSHIP': Music, // Using Music icon defined below in component or standard Lucide
    'MASIHI SANGATI': Users,
    'BSI': BookOpen,
    'RECEPTION, USHERING & DECORATION': Smile,
    'ARCHIVE & LIBRARY': Library,
    'MUSIC': Mic2,
    'LIGHT & SOUND': Mic,
    'SUNDAY SCHOOL': Book,
    'Sunday School Teachers': GraduationCap,
    'THUHRILTU': Mic,
    'ṬANTU': BookOpen,
    'KOHHRAN HMEICHHIA': Users,
    'KTP': Users,
    'KOHHRAN PAVALAI PAWL': Users
};

// Category Metadata for the Grid View
const ARCHIVE_SECTIONS = [
    { id: 'Pastors', label: 'Pastors', icon: UserCheck, color: 'bg-cyan-600', description: 'Records of our spiritual shepherds.' },
    { id: 'Upa kal ta te', label: 'Upa kal ta te', icon: Cross, color: 'bg-slate-600', description: 'Kohhran hruaitu min kalsan tawhte.' },
    { id: 'Document', label: 'Documents', icon: FileText, color: 'bg-blue-500', description: 'Official papers, reports, and publications.' },
    { id: 'Photo', label: 'Photos', icon: Image, color: 'bg-emerald-500', description: 'Gallery of church events and memories.' },
    { id: 'Video', label: 'Videos', icon: Video, color: 'bg-red-500', description: 'Recordings of services and special items.' },
    { id: 'History', label: 'History', icon: History, color: 'bg-amber-500', description: 'Church history, milestones, and timeline.' },
    { id: 'Minute', label: 'Minutes', icon: File, color: 'bg-purple-500', description: 'Committee meeting records and resolutions.' },
    { id: 'Rawngbawltu te', label: 'Rawngbawltu te', icon: Users, color: 'bg-church-600', description: 'Records of past leaders and committees.' },
];

// Default Sub-categories for Rawngbawltu te
const DEFAULT_RAWNGBAWLTU_SUBCATEGORIES = [
    'Executive Body',
    'Ramthar',
    'FINANCE',
    'BUILDING',
    'SOCIAL FRONT',
    'REFRESHMENT',
    'KRISTIAN CHHUNGKUA',
    'WORSHIP',
    'MASIHI SANGATI',
    'BSI',
    'RECEPTION, USHERING & DECORATION',
    'ARCHIVE & LIBRARY',
    'MUSIC',
    'LIGHT & SOUND',
    'SUNDAY SCHOOL', 
    'Sunday School Teachers', 
    'THUHRILTU',
    'ṬANTU',
    'KOHHRAN HMEICHHIA',
    'KTP',
    'KOHHRAN PAVALAI PAWL'
];

const SS_DEPARTMENTS = [
    'O.B.',
    'Puitling',
    'Senior',
    'Sacrament',
    'Intermediate',
    'Junior',
    'Primary',
    'Beginner',
    'Pre-Beginner'
];

// Placeholder seed data for other categories
const EXECUTIVE_BODY_SEED_DATA: any[] = [];
// ... (Keeping empty arrays for brevity, seed logic remains)
const RAMTHAR_SEED_DATA: any[] = [];
const SUNDAY_SCHOOL_TEACHERS_SEED_DATA = [
  { year: '1981', details: "Superintendent : Pu Manhleia\nAsst. Supdt. : Pu Thangchuanga\nAsst. Supdt (NPSS) : Pu Saizama Sailo\nSecretary : Pu B.Hranghlira\nAsst. Secretary : Pu Rinliana\nAsst. Secy (NPSS) : Tv.Rohita\n\n[Puitling zirtirtu]\nPu T.Sawmpauva, Pu P.C.Lalhlira, Pu Zakima, Upa Khawidawla\n\n[Intermediate]\nPu R.D.Lalchhuana, Nl.Rotuahthangi\n\n[Junior]\nPi Lalchhawnkimi, Tv.Goodthanga\n\n[Primary]\nPu Thangngolanga, Nl.Lalnunsangi, Pu Ralkapthanga\n\n[Beginner]\nNl.Biakengi, Tv.Biga, Nl.Bawihthansangi, Nl.Lalchhuanawmi" },
];

// Helper to extract YouTube ID
const getYouTubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Helper function to generate static data for fallback
const getStaticArchives = (): ArchiveEntry[] => {
    const MOCK_ARCHIVES: ArchiveEntry[] = [
        { id: '1', title: 'Church Foundation Stone Laying', date: '1985-04-12', category: 'History', description: 'Records of the foundation stone laying ceremony.', link: '#' },
        { id: '2', title: 'Silver Jubilee Souvenir', date: '2010-10-15', category: 'Document', description: 'Scanned copy of the Silver Jubilee souvenir book.', link: '#' },
        { id: '3', title: 'Old Church Building Photo', date: '1990-05-20', category: 'Photo', description: 'Photograph of the first church building.', link: '#' },
        { id: '4', title: '2023', date: '2023-01-01', category: 'Rawngbawltu te', subCategory: 'Executive Body', description: 'List of executive committee members for the year 2023.', link: '#' },
        { id: '5', title: 'Special Choir Performance 2023', date: '2023-12-25', category: 'Video', description: 'Christmas special item performance by the standing choir.', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
    ];
    return MOCK_ARCHIVES;
};

export const Archives: React.FC = () => {
    const { t } = useLanguage();
    const { isAdmin } = useAuth();
    const [archives, setArchives] = useState<ArchiveEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // selectedCategory is initially null to show the grid view
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [activeSSDepartment, setActiveSSDepartment] = useState<string | null>(null);
    const [missingIndexUrl, setMissingIndexUrl] = useState<string | null>(null);
    
    // Video Playback & Image Preview
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    
    // Search State
    const [ssSearchTerm, setSsSearchTerm] = useState('');
    const [ssSearchResults, setSsSearchResults] = useState<ArchiveEntry[]>([]);
    const [allRawngbawltuRecords, setAllRawngbawltuRecords] = useState<ArchiveEntry[]>([]);
    const [isSearchingRealData, setIsSearchingRealData] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState(''); // New local search state

    // Departments Management
    const [subCategories, setSubCategories] = useState<string[]>(DEFAULT_RAWNGBAWLTU_SUBCATEGORIES);
    const [isManageDeptsOpen, setIsManageDeptsOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Partial<ArchiveEntry>>({});
    const [isSaving, setIsSaving] = useState(false);
    
    // Image Upload State
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch SubCategories from Metadata
    useEffect(() => {
        const fetchMetadata = async () => {
            if (!db || !db.collection) return;
            try {
                const doc = await db.collection('archives').doc('metadata').get();
                if (doc.exists && doc.data()?.subCategories) {
                    setSubCategories(doc.data()?.subCategories);
                }
            } catch (e) {
                console.error("Error fetching metadata:", e);
            }
        };
        fetchMetadata();
    }, []);

    const fetchArchives = useCallback(async () => {
        // Only fetch if a category is selected
        if (!selectedCategory) {
            setArchives([]);
            return;
        }

        // If in 'Rawngbawltu te' mode but no subcategory is selected, we are in the grid view, so don't fetch
        if (selectedCategory === 'Rawngbawltu te' && !selectedSubCategory) {
            setArchives([]);
            return;
        }

        setLoading(true);
        setMissingIndexUrl(null);
        
        let fetchedData: ArchiveEntry[] = [];
        let useStatic = false;

        if (!db || !db.collection) {
            useStatic = true;
        } else {
            try {
                // Base Reference
                let collectionRef = db.collection('archives');
                let baseQuery: any = collectionRef;
                let requiresSortInJs = false;
                
                // Construct Filters
                if (selectedCategory === 'Rawngbawltu te' && selectedSubCategory) {
                    if (selectedSubCategory === 'Sunday School Teachers') {
                        if (!activeSSDepartment) {
                             // If no dept selected in UI, fetch nothing from DB
                             setArchives([]); 
                             setLoading(false);
                             return; 
                        }
                        baseQuery = baseQuery.where('subCategory', '==', `SS Zirtirtute - ${activeSSDepartment}`);
                    } else {
                        baseQuery = baseQuery.where('subCategory', '==', selectedSubCategory);
                    }
                } else {
                    // For main categories (including Pastors and Deceased Elders)
                    baseQuery = baseQuery.where('category', '==', selectedCategory);
                }

                // Attempt 1: Query WITH server-side sorting (Fastest, but needs index)
                try {
                    const sortedQuery = baseQuery.orderBy('date', 'desc');
                    const snapshot = await sortedQuery.get();
                    if (!snapshot.empty) {
                        fetchedData = snapshot.docs.map((doc: any) => ({
                            id: doc.id,
                            ...doc.data()
                        })) as ArchiveEntry[];
                    }
                } catch (indexError: any) {
                    // Check if error is missing index
                    if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
                        console.warn("Index missing for Archives query. Falling back to client-side sorting.", indexError);
                        const match = indexError.message?.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
                        if (match && isAdmin) {
                             setMissingIndexUrl(match[0]);
                        }
                        const unsortedSnapshot = await baseQuery.get();
                        if (!unsortedSnapshot.empty) {
                            fetchedData = unsortedSnapshot.docs.map((doc: any) => ({
                                id: doc.id,
                                ...doc.data()
                            })) as ArchiveEntry[];
                            requiresSortInJs = true;
                        }
                    } else {
                        throw indexError;
                    }
                }

                // Client-side sort if needed
                if (requiresSortInJs) {
                    fetchedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                }

            } catch (error) {
                console.error("Error fetching archives:", error);
                useStatic = true; 
            }
        }

        if (useStatic) {
            const allStatic = getStaticArchives();
            // Filter static data
            fetchedData = allStatic.filter(item => {
                if (item.category !== selectedCategory) return false;
                if (selectedCategory === 'Rawngbawltu te') {
                    if (selectedSubCategory === 'Sunday School Teachers') {
                        if (!activeSSDepartment) return false;
                        return item.subCategory === `SS Zirtirtute - ${activeSSDepartment}`;
                    }
                    return item.subCategory === selectedSubCategory;
                }
                return true;
            });
            fetchedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        setArchives(fetchedData);
        setLoading(false);
    }, [selectedCategory, selectedSubCategory, activeSSDepartment, isAdmin]);

    useEffect(() => {
        fetchArchives();
    }, [fetchArchives]);

    // Reset subcategory logic when main category changes
    useEffect(() => {
        setSelectedSubCategory(null);
        setActiveSSDepartment(null);
        setSsSearchTerm('');
        setSsSearchResults([]);
        setLocalSearchTerm('');
    }, [selectedCategory]);

    useEffect(() => {
        setLocalSearchTerm('');
    }, [selectedSubCategory]);

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        window.scrollTo(0, 0);
    };

    const handleSubCategorySelect = (subId: string) => {
        setSelectedSubCategory(subId);
        window.scrollTo(0, 0);
    }

    const handleBack = () => {
        if (selectedCategory === 'Rawngbawltu te' && selectedSubCategory) {
            if (selectedSubCategory === 'Sunday School Teachers' && activeSSDepartment) {
                setActiveSSDepartment(null);
                return;
            }
            setSelectedSubCategory(null); // Go back to SubCategory Grid
            setArchives([]);
        } else {
            // Go back to Main Grid
            setSelectedCategory(null);
            setArchives([]);
            setSearchTerm('');
            setSelectedSubCategory(null);
            setActiveSSDepartment(null);
        }
    };

    const handleAddNew = () => {
        setEditingEntry({
            title: '',
            date: new Date().toISOString().split('T')[0],
            category: (selectedCategory as any) || 'Document', // Default to current category
            subCategory: selectedSubCategory || '',
            description: '',
            link: '',
            imageUrls: [],
            birthDate: '',
            ordinationDate: '',
            deathDate: '',
            tenureYears: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (entry: ArchiveEntry) => {
        setEditingEntry({
            ...entry,
            imageUrls: entry.imageUrls || []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (id.startsWith('static-')) {
            alert("Cannot delete static/seed data directly. Please seed the database first to manage records.");
            return;
        }
        if (!db?.collection || !window.confirm("Are you sure you want to delete this archive entry?")) return;
        try {
            await db.collection('archives').doc(id).delete();
            fetchArchives();
            // Also update search results if in search mode
            if (ssSearchTerm) {
                setSsSearchResults(prev => prev.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error("Error deleting archive:", error);
            alert("Failed to delete archive entry.");
        }
    };

    const handleSave = async () => {
        if (!db?.collection) {
            alert("Database connection not available.");
            return;
        }
        
        setIsSaving(true);
        try {
            const { id, ...data } = editingEntry;
            
            // Clean up subCategory if category is not Rawngbawltu te
            if (data.category !== 'Rawngbawltu te') {
                delete data.subCategory;
            }

            if (id && !id.startsWith('static-')) {
                await db.collection('archives').doc(id).set(data, { merge: true });
            } else {
                await db.collection('archives').add(data);
            }
            setIsModalOpen(false);
            fetchArchives();
            // Refresh search data if needed
            if (selectedCategory === 'Rawngbawltu te') {
                // Invalidate search cache to force refetch next time or update manually
                setAllRawngbawltuRecords([]); 
            }
        } catch (error) {
            console.error("Error saving archive:", error);
            alert("Failed to save archive entry.");
        }
        setIsSaving(false);
    };

    // ImgBB Upload Handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImage(true);
        try {
            const newUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();
                if (result.success) {
                    newUrls.push(result.data.url);
                } else {
                    console.error("Image upload failed:", result.error?.message);
                }
            }

            setEditingEntry(prev => ({
                ...prev,
                imageUrls: [...(prev.imageUrls || []), ...newUrls]
            }));

        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading images.");
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setEditingEntry(prev => ({
            ...prev,
            imageUrls: prev.imageUrls?.filter((_, i) => i !== index)
        }));
    };

    // Generic Seed Function for simple categories
    const handleSeedGeneric = async (data: any[], subCategory: string) => {
        if (!db?.collection || !window.confirm(`This will add/overwrite ${subCategory} records. Continue?`)) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            data.forEach(item => {
                const docId = `${subCategory.toLowerCase().replace(/\s+/g, '-')}-${item.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: item.year, 
                    date: `${item.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: subCategory,
                    description: item.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert(`${subCategory} data seeded successfully!`);
            fetchArchives();
        } catch (error) {
            console.error(`Error seeding ${subCategory}:`, error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    // Specific Seed Function for Sunday School Teachers
    const handleSeedSundaySchoolTeachers = async () => {
        if (!db?.collection || !window.confirm("This will seed Sunday School Teachers data. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            const normalizeDept = (raw: string) => {
                if (raw.includes('Puitling')) return 'Puitling';
                if (raw.includes('Senior')) return 'Senior';
                if (raw.includes('Sacrament')) return 'Sacrament';
                if (raw.includes('Intermediate')) return 'Intermediate';
                if (raw.includes('Junior')) return 'Junior';
                if (raw.includes('Primary')) return 'Primary';
                if (raw.includes('Pre-Beginner')) return 'Pre-Beginner';
                if (raw.includes('Beginner')) return 'Beginner';
                return 'O.B.';
            };

            SUNDAY_SCHOOL_TEACHERS_SEED_DATA.forEach(data => {
                const year = data.year;
                const lines = data.details.split('\n');
                let currentDept = 'O.B.';
                let currentContent: string[] = [];
                
                const flushDept = (dept: string, content: string[]) => {
                    if (content.length === 0) return;
                    const normalizedDept = normalizeDept(dept);
                    const docId = `ss-zirtirtute-${normalizedDept.toLowerCase()}-${year}`;
                    const docRef = collectionRef.doc(docId);
                    const entry: ArchiveEntry = {
                        id: docId,
                        title: `${year} - ${normalizedDept}`,
                        date: `${year}-01-01`,
                        category: 'Rawngbawltu te',
                        subCategory: `SS Zirtirtute - ${normalizedDept}`,
                        description: content.join('\n'),
                        link: ''
                    };
                    batch.set(docRef, entry);
                };

                lines.forEach(line => {
                    const deptMatch = line.match(/^\[(.*?)\]/);
                    if (deptMatch) {
                        flushDept(currentDept, currentContent);
                        currentDept = deptMatch[1];
                        currentContent = [];
                    } else {
                        if (line.trim()) currentContent.push(line.trim());
                    }
                });
                flushDept(currentDept, currentContent);
            });

            await batch.commit();
            alert("Sunday School Teachers data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding SS data:", error);
            alert("Failed to seed SS data.");
        }
        setIsSaving(false);
    };

    // Client-side search for main archives list
    const filteredArchives = archives.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch; 
    });

    const handleSearch = async (term: string) => {
        setSsSearchTerm(term);
        if (!term.trim()) {
            setSsSearchResults([]);
            return;
        }
        
        setIsSearchingRealData(true);
        
        // Ensure we have all records loaded for search
        let recordsToSearch = allRawngbawltuRecords;
        if (recordsToSearch.length === 0 && db && db.collection) {
            try {
                // Fetch ALL Rawngbawltu te records once for client-side search
                const snapshot = await db.collection('archives')
                    .where('category', '==', 'Rawngbawltu te')
                    .get();
                if (!snapshot.empty) {
                    recordsToSearch = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ArchiveEntry[];
                    setAllRawngbawltuRecords(recordsToSearch);
                }
            } catch (e) {
                console.error("Error fetching records for search:", e);
            }
        }

        // Perform Search on recordsToSearch
        const results = recordsToSearch.filter(record => 
            record.description.toLowerCase().includes(term.toLowerCase()) ||
            record.title.toLowerCase().includes(term.toLowerCase()) ||
            record.subCategory?.toLowerCase().includes(term.toLowerCase())
        );
        
        setSsSearchResults(results);
        setIsSearchingRealData(false);
    };

    const handleAddDepartment = async () => {
        if (!newDeptName.trim() || !db?.collection) return;
        const updated = [...subCategories, newDeptName.trim()];
        setSubCategories(updated);
        setNewDeptName('');
        await db.collection('archives').doc('metadata').set({ subCategories: updated }, { merge: true });
    };

    const handleRemoveDepartment = async (dept: string) => {
        if (!window.confirm(`Delete "${dept}" from list?`)) return;
        const updated = subCategories.filter(s => s !== dept);
        setSubCategories(updated);
        if (db?.collection) {
            await db.collection('archives').doc('metadata').set({ subCategories: updated }, { merge: true });
        }
    };

    // Render Department Grid
    const renderDepartmentGrid = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Sunday School Departments</h2>
                    <p className="text-slate-500 text-sm">Select a department to view records or search a teacher's name.</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={handleSeedSundaySchoolTeachers}
                        disabled={isSaving}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50 text-sm"
                    >
                        {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Database size={16} className="mr-2" />}
                        Seed SS Teachers Data
                    </button>
                )}
            </div>

            {/* SS Search Bar (Now searches real DB records) */}
            <div className="relative mb-8">
                <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-church-500" size={20} />
                <input 
                    type="text" 
                    placeholder="Search for a name (searches all Rawngbawltu te records)..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-church-500 focus:border-transparent outline-none shadow-sm text-lg"
                    value={ssSearchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                {isSearchingRealData && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-church-500" size={20} />}
            </div>

            {ssSearchTerm ? (
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700">Search Results for "{ssSearchTerm}" ({ssSearchResults.length})</h3>
                    {ssSearchResults.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {ssSearchResults.map((entry) => (
                                <div key={entry.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:border-church-200 transition relative group">
                                    {isAdmin && (
                                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white rounded-full p-1 shadow-sm">
                                            <button onClick={() => handleEdit(entry)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"><Edit size={14} /></button>
                                            <button onClick={() => handleDelete(entry.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-full"><Trash size={14} /></button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-church-100 text-church-700 text-xs font-bold px-2 py-1 rounded">{entry.title}</span>
                                        <span className="text-xs text-slate-400 font-medium uppercase truncate max-w-[150px]">{entry.subCategory}</span>
                                    </div>
                                    {/* Highlight matched text logic simplified for brevity */}
                                    <div className="text-slate-800 text-sm whitespace-pre-wrap">
                                        {entry.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-lg border border-dashed border-slate-200">
                            <p className="text-slate-500">No records found matching "{ssSearchTerm}".</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SS_DEPARTMENTS.map((dept) => (
                        <button
                            key={dept}
                            onClick={() => setActiveSSDepartment(dept)}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-church-200 transition text-left group flex items-center"
                        >
                            <div className="p-3 bg-church-50 text-church-600 rounded-lg mr-4 group-hover:bg-church-100 transition-colors">
                                <FolderOpen size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-church-700 transition-colors">{dept}</h3>
                                <p className="text-xs text-slate-500 mt-1">View Teacher Records</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const localSearchResults = localSearchTerm 
    ? archives.filter(doc => doc.description.toLowerCase().includes(localSearchTerm.toLowerCase()))
    : [];

    return (
        <div className="py-12 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">{t.archives.title}</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">{t.archives.subtitle}</p>
                </div>

                {/* Database Index Warning for Admins */}
                {isAdmin && missingIndexUrl && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center">
                            <div className="bg-yellow-100 p-2 rounded-full mr-3">
                                <AlertTriangle className="text-yellow-700" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Database Index Required</h3>
                                <p className="text-xs mt-1 max-w-xl">
                                    To optimize sorting, Firestore requires a composite index. 
                                    <span className="font-bold text-yellow-900 block mt-1">Your data is currently visible using a client-side fallback.</span>
                                </p>
                            </div>
                        </div>
                        <a href={missingIndexUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-yellow-600 text-white text-xs font-bold rounded-lg hover:bg-yellow-700 transition shadow-sm whitespace-nowrap flex items-center">
                            Create Index <ExternalLink size={12} className="ml-1" />
                        </a>
                    </div>
                )}

                {!selectedCategory ? (
                    // GRID VIEW OF CATEGORIES
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {ARCHIVE_SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => handleCategorySelect(section.id)}
                                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-xl hover:border-church-200 hover:-translate-y-1 transition-all duration-300 text-left group"
                            >
                                <div className={`w-16 h-16 ${section.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-md group-hover:scale-110 transition-transform`}>
                                    <section.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-church-700 transition-colors">{section.label}</h3>
                                <p className="text-slate-500">{section.description}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    // LIST VIEW OR SUB-GRID VIEW
                    <div className="animate-in fade-in zoom-in duration-200">
                        {/* Header Navigation */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
                            <div className="flex items-center">
                                <button 
                                    onClick={handleBack} 
                                    className="p-2 mr-4 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-church-600 hover:border-church-300 transition-all shadow-sm group"
                                >
                                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                                </button>
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-800 flex items-center">
                                        {selectedCategory === 'Rawngbawltu te' && !selectedSubCategory ? 
                                            'Departments' : 
                                            (selectedSubCategory || ARCHIVE_SECTIONS.find(s => s.id === selectedCategory)?.label)
                                        }
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {selectedCategory === 'Rawngbawltu te' && !selectedSubCategory 
                                            ? 'Select a department to view records' 
                                            : 'Viewing records'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                                {selectedCategory !== 'Rawngbawltu te' && (
                                    <div className="relative flex-grow md:flex-grow-0">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="Search archives..." 
                                            className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                )}
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        {selectedCategory === 'Rawngbawltu te' && !selectedSubCategory && (
                                            <button 
                                                onClick={() => setIsManageDeptsOpen(true)}
                                                className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 shadow-sm transition whitespace-nowrap"
                                            >
                                                <Settings size={18} className="mr-2" /> Manage Depts
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleAddNew}
                                            className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm transition whitespace-nowrap"
                                        >
                                            <Plus size={18} className="mr-2" /> Add Entry
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rawngbawltu te Sub-Category Grid */}
                        {selectedCategory === 'Rawngbawltu te' && !selectedSubCategory ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {subCategories.map((sub) => {
                                    const Icon = SUB_CATEGORY_ICONS[sub] || Users;
                                    return (
                                        <button
                                            key={sub}
                                            onClick={() => handleSubCategorySelect(sub)}
                                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-church-200 hover:-translate-y-1 transition-all duration-200 text-left group flex items-center"
                                        >
                                            <div className="p-3 bg-slate-50 text-slate-500 rounded-lg mr-4 group-hover:bg-church-100 group-hover:text-church-600 transition-colors shrink-0">
                                                <Icon size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-sm group-hover:text-church-700 transition-colors line-clamp-2">{sub}</h3>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Loading State */
                            loading ? (
                                <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
                            ) : (
                                // Logic for displaying content based on selection
                                selectedSubCategory === 'Sunday School Teachers' && !activeSSDepartment ? (
                                    renderDepartmentGrid()
                                ) : (
                                    <div>
                                        {activeSSDepartment && (
                                            <div className="mb-6 flex items-center">
                                                <button 
                                                    onClick={() => setActiveSSDepartment(null)}
                                                    className="flex items-center text-slate-500 hover:text-church-600 transition font-medium"
                                                >
                                                    <ChevronLeft size={20} className="mr-1" /> Back to Departments
                                                </button>
                                                <span className="mx-3 text-slate-300">|</span>
                                                <h2 className="text-xl font-bold text-slate-800">{activeSSDepartment} Teachers</h2>
                                            </div>
                                        )}

                                        {selectedCategory === 'Rawngbawltu te' && selectedSubCategory && (
                                            <div className="mb-6 relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="text" 
                                                    placeholder={`Search names in ${activeSSDepartment || selectedSubCategory}...`} 
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-church-500 outline-none shadow-sm"
                                                    value={localSearchTerm}
                                                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {localSearchTerm && localSearchResults.length > 0 ? (
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-slate-700">Found in {localSearchResults.length} years</h3>
                                                {localSearchResults.map(entry => {
                                                    const lines = entry.description.split('\n');
                                                    const matchingLines = lines.filter(line => line.toLowerCase().includes(localSearchTerm.toLowerCase()));
                                                    
                                                    return (
                                                        <div key={entry.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:border-church-200 transition">
                                                            <div className="flex justify-between items-start mb-2 border-b border-slate-50 pb-2">
                                                                 <h4 className="text-lg font-bold text-church-700">{entry.title}</h4>
                                                                 <span className="text-xs text-slate-400">{entry.date}</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {matchingLines.map((line, idx) => (
                                                                    <p key={idx} className="text-sm text-slate-800 bg-yellow-50 p-2 rounded border border-yellow-100">
                                                                        {line}
                                                                    </p>
                                                                ))}
                                                                {matchingLines.length === 0 && <p className="text-sm text-slate-500 italic">Match found in raw text.</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : localSearchTerm ? (
                                            <div className="text-center py-10 text-slate-500">No matches found for "{localSearchTerm}".</div>
                                        ) : (
                                            filteredArchives.length > 0 ? (
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filteredArchives.map(entry => {
                                                    const Icon = CATEGORY_ICONS[entry.category] || Archive;
                                                    const isOfficeBearer = entry.category === 'Rawngbawltu te';
                                                    const youtubeId = entry.category === 'Video' ? getYouTubeId(entry.link) : null;

                                                    return (
                                                        <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition group relative flex flex-col h-full">
                                                            {isAdmin && (
                                                                <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                    <button onClick={() => handleEdit(entry)} className="p-1.5 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100"><Edit size={16} /></button>
                                                                    <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-600 bg-red-50 rounded-full hover:bg-red-100"><Trash size={16} /></button>
                                                                </div>
                                                            )}
                                                            {/* Render Content */}
                                                            {youtubeId ? (
                                                                <div className="flex flex-col h-full">
                                                                    <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden mb-4 cursor-pointer group/video shadow-sm" onClick={() => setPlayingVideoId(youtubeId)}>
                                                                        <img src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} alt={entry.title} className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/video:bg-black/30 transition">
                                                                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover/video:scale-110 transition"><Play size={20} className="text-church-600 ml-1 fill-current" /></div>
                                                                        </div>
                                                                    </div>
                                                                    <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2">{entry.title}</h3>
                                                                    <p className="text-xs text-slate-500 mb-3">{entry.date}</p>
                                                                    <div className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">{entry.description}</div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-start mb-4">
                                                                        <div className="p-3 bg-church-50 text-church-600 rounded-lg mr-4 shrink-0"><Icon size={24} /></div>
                                                                        <div>
                                                                            {!isOfficeBearer && (<div className="flex flex-wrap gap-2 mb-1"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{entry.category}</span>{entry.subCategory && (<span className="text-xs font-bold text-church-600 bg-church-100 px-2 py-0.5 rounded-full">{entry.subCategory}</span>)}</div>)}
                                                                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{entry.title}</h3>
                                                                            {!isOfficeBearer && <p className="text-xs text-slate-500 mt-1">{entry.date}</p>}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Display special date fields for Pastors and Upa kal ta te */}
                                                                    {(entry.category === 'Upa kal ta te' || entry.category === 'Pastors') && (
                                                                        <div className="mt-3 mb-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                                            {entry.birthDate && <div><span className="font-bold text-slate-700">Pian Ni:</span> {entry.birthDate}</div>}
                                                                            {entry.ordinationDate && <div><span className="font-bold text-slate-700">Nemngheh Ni:</span> {entry.ordinationDate}</div>}
                                                                            {entry.category === 'Pastors' && entry.tenureYears && <div><span className="font-bold text-slate-700">Tenure:</span> {entry.tenureYears}</div>}
                                                                            {entry.deathDate && <div><span className="font-bold text-slate-700">Thih Ni:</span> {entry.deathDate}</div>}
                                                                        </div>
                                                                    )}

                                                                    <div className={`text-slate-600 text-sm mb-4 flex-grow whitespace-pre-wrap ${isOfficeBearer ? '' : 'line-clamp-3'}`}>{entry.description}</div>
                                                                    
                                                                    {/* IMAGE GALLERY DISPLAY */}
                                                                    {entry.imageUrls && entry.imageUrls.length > 0 && (
                                                                        <div className={`grid gap-2 mb-4 ${entry.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                                            {entry.imageUrls.slice(0, 4).map((url, i) => (
                                                                                <div 
                                                                                    key={i} 
                                                                                    className="relative overflow-hidden rounded-lg bg-slate-100 aspect-square cursor-pointer hover:opacity-90"
                                                                                    onClick={() => setPreviewImage(url)}
                                                                                >
                                                                                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                                                                    {i === 3 && entry.imageUrls!.length > 4 && (
                                                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">+{entry.imageUrls!.length - 4}</div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {entry.link && (<a href={entry.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-church-600 hover:text-church-800 mt-auto">View Resource <ExternalLink size={14} className="ml-1" /></a>)}
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                                                <Archive className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                                <p className="text-slate-500">{t.archives.empty}</p>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Video Modal */}
            {playingVideoId && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setPlayingVideoId(null)}>
                    <div className="w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPlayingVideoId(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"><X size={24} /></button>
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setPreviewImage(null)}>
                    <button className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 p-2 rounded-full transition"><X size={32}/></button>
                    <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}/>
                </div>
            )}

            {/* Manage Departments Modal */}
            {isManageDeptsOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold">Manage Sub-Categories</h3>
                            <button onClick={() => setIsManageDeptsOpen(false)}><X/></button>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                            {subCategories.map(dept => (
                                <div key={dept} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                    <span>{dept}</span>
                                    <button onClick={() => handleRemoveDepartment(dept)} className="text-red-500 hover:text-red-700"><Trash size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input className="border p-2 rounded flex-grow" placeholder="New Department Name" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
                            <button onClick={handleAddDepartment} className="bg-church-600 text-white px-4 py-2 rounded">Add</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-church-50 rounded-t-xl">
                            <h3 className="text-xl font-bold text-church-900">{editingEntry.id ? 'Edit Archive' : 'Add New Archive'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Title (Name or Year)</label>
                                <input className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 outline-none transition" value={editingEntry.title || ''} onChange={e => setEditingEntry({...editingEntry, title: e.target.value})} placeholder="e.g., Rev. Zosangliana or 2023" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                                    <input type="date" className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 outline-none transition" value={editingEntry.date || ''} onChange={e => setEditingEntry({...editingEntry, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-church-500 outline-none transition" value={editingEntry.category} onChange={e => setEditingEntry({...editingEntry, category: e.target.value as any})}>
                                        {Object.keys(CATEGORY_ICONS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            {editingEntry.category === 'Rawngbawltu te' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Sub Category</label>
                                    {editingEntry.subCategory?.startsWith('SS Zirtirtute') ? (
                                        <input className="w-full border border-slate-300 rounded p-2.5 bg-slate-100 text-slate-600 cursor-not-allowed" value={editingEntry.subCategory} readOnly />
                                    ) : (
                                        <select className="w-full border border-slate-300 rounded-lg p-3 bg-white" value={editingEntry.subCategory || ''} onChange={e => setEditingEntry({...editingEntry, subCategory: e.target.value})}>
                                            <option value="" disabled>Select Sub-Category</option>
                                            {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                        </select>
                                    )}
                                </div>
                            )}

                            {(editingEntry.category === 'Upa kal ta te' || editingEntry.category === 'Pastors') && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pian Ni (DOB)</label>
                                            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm" value={editingEntry.birthDate || ''} onChange={e => setEditingEntry({...editingEntry, birthDate: e.target.value})} placeholder="DD/MM/YYYY" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nemngheh Ni</label>
                                            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm" value={editingEntry.ordinationDate || ''} onChange={e => setEditingEntry({...editingEntry, ordinationDate: e.target.value})} placeholder="DD/MM/YYYY" />
                                        </div>
                                        {editingEntry.category === 'Pastors' && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tenure (Years)</label>
                                                <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm" value={editingEntry.tenureYears || ''} onChange={e => setEditingEntry({...editingEntry, tenureYears: e.target.value})} placeholder="e.g., 2010 - 2015" />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Thih Ni (DOD)</label>
                                            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm" value={editingEntry.deathDate || ''} onChange={e => setEditingEntry({...editingEntry, deathDate: e.target.value})} placeholder="DD/MM/YYYY" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Link (Video / PDF / External)</label>
                                <input className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-church-500 outline-none transition" value={editingEntry.link || ''} onChange={e => setEditingEntry({...editingEntry, link: e.target.value})} placeholder="https://..." />
                            </div>
                            
                            {/* Image Upload Section */}
                            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                    <Image size={16} /> Photo Gallery
                                </label>
                                
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    {editingEntry.imageUrls?.map((url, index) => (
                                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-white border border-slate-200">
                                            <img src={url} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => removeImage(index)} 
                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-700"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingImage}
                                        className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-church-600 hover:border-church-400 transition bg-white"
                                    >
                                        {uploadingImage ? <Loader className="animate-spin" size={20} /> : <Upload size={20} />}
                                        <span className="text-[10px] font-bold uppercase mt-1">Upload</span>
                                    </button>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleImageUpload} 
                                    className="hidden" 
                                    accept="image/*"
                                    multiple
                                />
                                {uploadingImage && <p className="text-xs text-church-600 animate-pulse text-center">Uploading to ImgBB...</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description / Biography</label>
                                <textarea className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-church-500 outline-none transition resize-none" value={editingEntry.description || ''} onChange={e => setEditingEntry({...editingEntry, description: e.target.value})} placeholder="Details about this record..." />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center transition shadow-sm disabled:opacity-50">
                                {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={18} className="mr-2" />} Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Archives;
