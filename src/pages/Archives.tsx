
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { ArchiveEntry } from '../types';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Archive, FileText, Image as ImageIcon, Video, History, 
  FileClock, Users, User, Search, Plus, Edit, Trash, X, 
  ExternalLink, Play, Loader, Save, Folder, ArrowLeft,
  ChevronRight, Settings, Upload, Trash2, Cross, UserCheck, Calendar,
  BarChart3, LayoutList, TrendingUp, PieChart, FolderOpen, Briefcase, UserCog, FileDown,
  FileSpreadsheet, FileUp, Search as SearchIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';

const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Document': FileText,
  'Photo': ImageIcon,
  'Video': Video,
  'History': History,
  'Minute': FileClock,
  'Rawngbawltu te': Users,
  'Pastors': UserCheck,
  'Upa kal ta te': Cross,
  'Weekly Program': Calendar
};

const DEFAULT_RAWNGBAWLTU_SUBCATEGORIES = [
    'Executive Body', 'Ramthar', 'FINANCE', 'BUILDING', 'SOCIAL FRONT', 
    'REFRESHMENT', 'KRISTIAN CHHUNGKUA', 'WORSHIP', 'MASIHI SANGATI', 
    'BSI', 'RECEPTION, USHERING & DECORATION', 'ARCHIVE & LIBRARY', 
    'MUSIC', 'LIGHT & SOUND', 'SUNDAY SCHOOL', 'THUHRILTU', 'ṬANTU', 
    'KOHHRAN HMEICHHIA', 'KTP', 'KOHHRAN PAVALAI PAWL'
];

const SS_ZIRTIRTUTE_DEPARTMENTS = [
    'Pre-Beginner', 'Beginner', 'Primary', 'Junior', 'Intermediate', 'Sacrament', 'Senior', 'Puitling'
];

const getYouTubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Generate years 2025 down to 1981
const SS_YEAR_RANGE = Array.from({length: 2025 - 1981 + 1}, (_, i) => (2025 - i).toString());

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

const Archives: React.FC = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  const ARCHIVE_SECTIONS = [
    { id: 'Weekly Program', label: t.archives.sections.weeklyProgram, icon: Calendar, color: 'bg-indigo-600', description: t.archives.descriptions.weeklyProgram },
    { id: 'Pastors', label: t.archives.sections.pastors, icon: UserCheck, color: 'bg-cyan-600', description: t.archives.descriptions.pastors },
    { id: 'Upa kal ta te', label: t.archives.sections.upaKalTaTe, icon: Cross, color: 'bg-slate-600', description: t.archives.descriptions.upaKalTaTe },
    { id: 'Rawngbawltu te', label: t.archives.sections.rawngbawltuTe, icon: Users, color: 'bg-church-600', description: t.archives.descriptions.rawngbawltuTe },
    { id: 'Document', label: t.archives.sections.documents, icon: FileText, color: 'bg-blue-500', description: t.archives.descriptions.documents },
    { id: 'Photo', label: t.archives.sections.photos, icon: ImageIcon, color: 'bg-emerald-500', description: t.archives.descriptions.photos },
    { id: 'Video', label: t.archives.sections.videos, icon: Video, color: 'bg-red-500', description: t.archives.descriptions.videos },
    { id: 'History', label: t.archives.sections.history, icon: History, color: 'bg-amber-500', description: t.archives.descriptions.history },
    { id: 'Minute', label: t.archives.sections.minutes, icon: FileClock, color: 'bg-purple-500', description: t.archives.descriptions.minutes },
  ];
  
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Navigation State via URL Params (v6 compatible)
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get('category');
  const selectedSubCategory = searchParams.get('sub');

  const [subCategories, setSubCategories] = useState<string[]>(DEFAULT_RAWNGBAWLTU_SUBCATEGORIES);
  
  // View Mode: List or Analytics
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');

  // Sunday School Navigation State
  const [currentSSPath, setCurrentSSPath] = useState<string[]>([]);

  // Derived State for Sunday School Logic
  const isSSRoot = selectedSubCategory === 'SUNDAY SCHOOL' && currentSSPath.length === 0;
  const isSSZirtirtuteRoot = selectedSubCategory === 'SUNDAY SCHOOL' && currentSSPath.length === 1 && currentSSPath[0] === 'Zirtirtute';
  const isSSHotute = selectedSubCategory === 'SUNDAY SCHOOL' && currentSSPath.length === 1 && currentSSPath[0] === 'Hotute';
  const isSSDepartmentView = selectedSubCategory === 'SUNDAY SCHOOL' && currentSSPath.length === 2 && currentSSPath[0] === 'Zirtirtute';
  
  // Puitling Special Logic: 60 teachers, no leader/secretary
  const isPuitling = isSSDepartmentView && currentSSPath[1] === 'Puitling';
  const teacherColumnCount = isPuitling ? 60 : 20;

  const isViewingRecords = !(selectedCategory === 'Rawngbawltu te' && !selectedSubCategory) && !isSSRoot && !isSSZirtirtuteRoot && !isSSHotute && !isSSDepartmentView;

  // Global Search State for Sunday School
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<ArchiveEntry[]>([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Edit/Add Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArchive, setEditingArchive] = useState<Partial<ArchiveEntry>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // View Modal State
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveEntry | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Reset view mode when category changes
  useEffect(() => {
      setViewMode('list');
      setCurrentSSPath([]); // Reset SS path when changing main categories
      setHasSearched(false);
      setGlobalSearchTerm('');
      setGlobalSearchResults([]);
  }, [selectedCategory, selectedSubCategory]);

  // Fetch Metadata (Subcategories)
  useEffect(() => {
      const fetchMetadata = async () => {
          if (!db || !db.collection) return;
          try {
              const doc = await db.collection('archives').doc('metadata').get();
              if (doc.exists && doc.data()?.subCategories) {
                  setSubCategories(doc.data()?.subCategories);
              }
          } catch (e) { console.error(e); }
      };
      fetchMetadata();
  }, []);

  const fetchArchives = useCallback(async () => {
    if (!selectedCategory) {
        setArchives([]);
        return;
    }
    // For 'Rawngbawltu te', wait until subcategory is selected
    if (selectedCategory === 'Rawngbawltu te' && !selectedSubCategory) {
        setArchives([]);
        return;
    }

    setLoading(true);
    
    // Check if we are in a Sunday School specific folder structure
    let shouldFetch = true;
    let targetDepartment: string | undefined = undefined;

    if (selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'SUNDAY SCHOOL') {
        if (currentSSPath.length === 0) {
            // Root of SS: Show Committee & Zirtirtute folders (No fetch)
            shouldFetch = false;
        } else if (currentSSPath.length === 1 && currentSSPath[0] === 'Committee') {
            // Inside SS -> Committee (Fetch with department='Committee')
            targetDepartment = 'Committee';
        } else if (currentSSPath.length === 1 && currentSSPath[0] === 'Hotute') {
            // Inside SS -> Hotute (Fetch with department='Hotute')
            targetDepartment = 'Hotute';
        } else if (currentSSPath.length === 1 && currentSSPath[0] === 'Zirtirtute') {
            // Inside SS -> Zirtirtute (Show Departments folders, No fetch)
            shouldFetch = false;
        } else if (currentSSPath.length === 2 && currentSSPath[0] === 'Zirtirtute') {
            // Inside SS -> Zirtirtute -> [Department] (Fetch)
            targetDepartment = currentSSPath[1];
        }
    }

    if (!shouldFetch) {
        setArchives([]);
        setLoading(false);
        return;
    }

    try {
      // Simplified query: Only filter by main category.
      // Filtering by subCategory/department and sorting by date happens client-side
      // to avoid complex composite index requirements which cause errors.
      const query = db.collection('archives').where('category', '==', selectedCategory);
      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        let data = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as ArchiveEntry[];

        // Client-side filtering for sub-category
        if (selectedCategory === 'Rawngbawltu te' && selectedSubCategory) {
            data = data.filter(d => d.subCategory === selectedSubCategory);
            
            // Client-side filtering for department
            if (targetDepartment) {
                data = data.filter(d => d.department === targetDepartment);
            }
        }

        // Client-side sorting by date (descending)
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setArchives(data);
      } else {
        setArchives([]);
      }
    } catch (error: any) {
      console.error("Error fetching archives:", error);
      setArchives([]);
    }
    setLoading(false);
  }, [selectedCategory, selectedSubCategory, currentSSPath]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const handleCategorySelect = (id: string) => {
      setSearchParams({ category: id });
      setSearchTerm('');
  };

  const handleSubCategorySelect = (sub: string) => {
      if (selectedCategory) {
        setSearchParams({ category: selectedCategory, sub });
        setSearchTerm('');
      }
  };

  const handleBack = () => {
      // Handle Sunday School internal navigation
      if (selectedSubCategory === 'SUNDAY SCHOOL' && currentSSPath.length > 0) {
          setCurrentSSPath(prev => prev.slice(0, -1));
          return;
      }

      if (selectedCategory === 'Rawngbawltu te' && selectedSubCategory) {
          setSearchParams({ category: selectedCategory });
      } else {
          setSearchParams({});
      }
      setArchives([]);
  };

  const handleSSFolderClick = (folderName: string) => {
      setCurrentSSPath(prev => [...prev, folderName]);
  };

  const handleAddNew = (prefilledYear?: string) => {
    let defaultDepartment = '';
    if (selectedSubCategory === 'SUNDAY SCHOOL') {
        if (currentSSPath[0] === 'Committee') defaultDepartment = 'Committee';
        if (currentSSPath[0] === 'Hotute') defaultDepartment = 'Hotute';
        if (currentSSPath.length === 2 && currentSSPath[0] === 'Zirtirtute') defaultDepartment = currentSSPath[1];
    }

    setEditingArchive({
      title: '',
      date: new Date().toISOString().split('T')[0],
      category: (selectedCategory as any) || 'Document',
      subCategory: selectedSubCategory || '',
      department: defaultDepartment,
      description: '',
      link: '',
      imageUrls: [],
      ss_year: prefilledYear // Prefill year if provided
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = (entry: ArchiveEntry) => {
    setEditingArchive({ ...entry, imageUrls: entry.imageUrls || [] });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!db?.doc || !window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await db.collection('archives').doc(id).delete();
      fetchArchives();
    } catch (error) {
      console.error("Error deleting archive:", error);
    }
  };

  const handleExportExcel = () => {
      if (isSSDepartmentView) {
          const exportData = SS_YEAR_RANGE.map(year => {
              const record = archives.find(a => a.ss_year === year);
              const teacherList = record?.ss_dept_teachers ? record.ss_dept_teachers.split(',').map(t => t.trim()) : [];
              
              const row: any = { Year: year };
              
              if (!isPuitling) {
                  row.Leader = record?.ss_dept_leader || '-';
                  row['Asst. Leader'] = record?.ss_dept_asst_leader || '-';
                  row.Secretary = record?.ss_dept_secretary || '-';
              }

              // Add teachers to columns
              for (let i = 0; i < teacherColumnCount; i++) {
                  row[`Zirtirtu ${i + 1}`] = teacherList[i] || '-';
              }

              return row;
          });
          const ws = XLSX.utils.json_to_sheet(exportData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Teachers");
          
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          triggerDownload(new Blob([wbout], { type: 'application/octet-stream' }), `${currentSSPath[1]}_Department_Teachers.xlsx`);
      }
  };

  const handleDownloadTemplate = () => {
    if (isSSDepartmentView) {
        const headers = ['Year'];
        if (!isPuitling) {
            headers.push('Leader', 'Asst. Leader', 'Secretary');
        }
        for(let i=1; i<=teacherColumnCount; i++) headers.push(`Zirtirtu ${i}`);
        
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        triggerDownload(new Blob([wbout], { type: 'application/octet-stream' }), `${currentSSPath[1]}_Teachers_Import_Template.xlsx`);

    } else if (isSSHotute) {
        const headers = [
            'Year', 'Superintendent', 'Asst. Supdt', 'Asst. Supdt (NPSS)', 
            'Secretary', 'Asst. Secretary 1', 'Asst. Secretary 2', 
            'Asst. Secy (NPSS) 1', 'Asst. Secy (NPSS) 2'
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hotute_Template");
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        triggerDownload(new Blob([wbout], { type: 'application/octet-stream' }), `SundaySchool_Hotute_Import_Template.xlsx`);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const batch = db.batch();
        let operationCount = 0;

        if (isSSDepartmentView) {
            const department = currentSSPath[1];
            // Fetch existing records for this department
            const existingSnapshot = await db.collection('archives')
                .where('category', '==', 'Rawngbawltu te')
                .where('subCategory', '==', 'SUNDAY SCHOOL')
                .where('department', '==', department)
                .get();
                
            const yearMap = new Map();
            existingSnapshot.docs.forEach((doc: any) => yearMap.set(doc.data().ss_year, doc.id));

            jsonData.forEach((row: any) => {
                const year = row['Year'] ? String(row['Year']) : null;
                if (!year) return;

                const teachers: string[] = [];
                for(let i=1; i<=teacherColumnCount; i++) {
                    const tName = row[`Zirtirtu ${i}`] || row[`Teacher ${i}`]; // Handle both EN/MZ header
                    if (tName) teachers.push(String(tName).trim());
                }

                const docData: any = {
                    category: 'Rawngbawltu te',
                    subCategory: 'SUNDAY SCHOOL',
                    department: department,
                    title: `${department} Department Teachers ${year}`,
                    date: `${year}-01-01`,
                    ss_year: year,
                    ss_dept_teachers: teachers.join(', '),
                    description: `Imported record for ${department} Department ${year}`
                };

                // Only add leadership fields for non-Puitling departments
                if (!isPuitling) {
                    docData.ss_dept_leader = row['Leader'] || '';
                    docData.ss_dept_asst_leader = row['Asst. Leader'] || '';
                    docData.ss_dept_secretary = row['Secretary'] || '';
                }

                if (yearMap.has(year)) {
                    const docRef = db.collection('archives').doc(yearMap.get(year));
                    batch.set(docRef, docData, { merge: true });
                } else {
                    const docRef = db.collection('archives').doc();
                    batch.set(docRef, docData);
                }
                operationCount++;
            });
        } else if (isSSHotute) {
            // Fetch existing Hotute records
            const existingSnapshot = await db.collection('archives')
                .where('category', '==', 'Rawngbawltu te')
                .where('subCategory', '==', 'SUNDAY SCHOOL')
                .where('department', '==', 'Hotute')
                .get();
                
            const yearMap = new Map();
            existingSnapshot.docs.forEach((doc: any) => yearMap.set(doc.data().ss_year, doc.id));

            jsonData.forEach((row: any) => {
                const year = row['Year'] ? String(row['Year']) : null;
                if (!year) return;

                const docData = {
                    category: 'Rawngbawltu te',
                    subCategory: 'SUNDAY SCHOOL',
                    department: 'Hotute',
                    title: `Sunday School Hotute ${year}`,
                    date: `${year}-01-01`,
                    ss_year: year,
                    ss_superintendent: row['Superintendent'] || '',
                    ss_asstSupdt: row['Asst. Supdt'] || '',
                    ss_asstSupdtNPSS: row['Asst. Supdt (NPSS)'] || '',
                    ss_secretary: row['Secretary'] || '',
                    ss_asstSecy1: row['Asst. Secretary 1'] || '',
                    ss_asstSecy2: row['Asst. Secretary 2'] || '',
                    ss_asstSecyNPSS1: row['Asst. Secy (NPSS) 1'] || '',
                    ss_asstSecyNPSS2: row['Asst. Secy (NPSS) 2'] || '',
                    description: `Imported record for Sunday School Hotute ${year}`
                };

                if (yearMap.has(year)) {
                    const docRef = db.collection('archives').doc(yearMap.get(year));
                    batch.set(docRef, docData, { merge: true });
                } else {
                    const docRef = db.collection('archives').doc();
                    batch.set(docRef, docData);
                }
                operationCount++;
            });
        }

        if (operationCount > 0) {
            await batch.commit();
            alert(`Successfully imported/updated ${operationCount} records.`);
            fetchArchives(); // Refresh list
        } else {
            alert("No valid data found in file.");
        }

    } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import file. Please check the format.");
    } finally {
        setLoading(false);
        if (importInputRef.current) importInputRef.current.value = '';
    }
  };

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
                method: 'POST', body: formData,
            });
            const result = await response.json();
            if (result.success) newUrls.push(result.data.url);
        }
        setEditingArchive(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...newUrls] }));
    } catch (error) {
        alert("Upload failed.");
    } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!db?.collection) return;
    setIsSaving(true);
    try {
      const { id, ...data } = editingArchive;
      
      // Ensure category consistency
      if (data.category !== 'Rawngbawltu te') delete data.subCategory;
      if (data.subCategory !== 'SUNDAY SCHOOL') delete data.department;

      // Ensure proper sorting based on Year
      if ((data.department === 'Hotute' || SS_ZIRTIRTUTE_DEPARTMENTS.includes(data.department || '')) && data.ss_year) {
          data.date = `${data.ss_year}-01-01`; // Set date for consistent sorting
      }

      if (id) {
        await db.collection('archives').doc(id).set(data, { merge: true });
      } else {
        await db.collection('archives').add(data);
      }
      setIsEditModalOpen(false);
      fetchArchives();
    } catch (error) {
      console.error("Error saving archive:", error);
      alert("Failed to save.");
    }
    setIsSaving(false);
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchTerm.trim()) return;

    setIsGlobalSearching(true);
    setGlobalSearchResults([]);
    setHasSearched(true);

    if (!db || !db.collection) {
        setIsGlobalSearching(false);
        return;
    }

    try {
        const snapshot = await db.collection('archives')
            .where('category', '==', 'Rawngbawltu te')
            .where('subCategory', '==', 'SUNDAY SCHOOL')
            .get();

        if (!snapshot.empty) {
            const allDocs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ArchiveEntry[];
            const termLower = globalSearchTerm.toLowerCase();
            
            const results = allDocs.filter(doc => {
                if (!SS_ZIRTIRTUTE_DEPARTMENTS.includes(doc.department || '')) return false;

                const teachers = doc.ss_dept_teachers ? doc.ss_dept_teachers.toLowerCase() : '';
                const leader = doc.ss_dept_leader ? doc.ss_dept_leader.toLowerCase() : '';
                const secretary = doc.ss_dept_secretary ? doc.ss_dept_secretary.toLowerCase() : '';
                
                return teachers.includes(termLower) || leader.includes(termLower) || secretary.includes(termLower);
            });
            
            results.sort((a, b) => (b.ss_year || '').localeCompare(a.ss_year || ''));
            setGlobalSearchResults(results);
        }
    } catch (error) {
        console.error("Global search error:", error);
    }
    setIsGlobalSearching(false);
  };

  const clearGlobalSearch = () => {
      setGlobalSearchTerm('');
      setGlobalSearchResults([]);
      setHasSearched(false);
  };

  const filteredArchives = archives.filter(item => {
      const term = searchTerm.toLowerCase();
      
      // Check generic fields
      if (item.title.toLowerCase().includes(term)) return true;
      if (item.description.toLowerCase().includes(term)) return true;
      if (item.ss_year && item.ss_year.includes(term)) return true;

      // Check Zirtirtute specific fields
      if (item.ss_dept_teachers && item.ss_dept_teachers.toLowerCase().includes(term)) return true;
      if (item.ss_dept_leader && item.ss_dept_leader.toLowerCase().includes(term)) return true;
      
      // Check Hotute specific fields
      if (item.ss_superintendent && item.ss_superintendent.toLowerCase().includes(term)) return true;
      if (item.ss_asstSupdt && item.ss_asstSupdt.toLowerCase().includes(term)) return true;
      if (item.ss_asstSupdtNPSS && item.ss_asstSupdtNPSS.toLowerCase().includes(term)) return true;
      if (item.ss_secretary && item.ss_secretary.toLowerCase().includes(term)) return true;
      if (item.ss_asstSecy1 && item.ss_asstSecy1.toLowerCase().includes(term)) return true;
      if (item.ss_asstSecy2 && item.ss_asstSecy2.toLowerCase().includes(term)) return true;
      if (item.ss_asstSecyNPSS1 && item.ss_asstSecyNPSS1.toLowerCase().includes(term)) return true;
      if (item.ss_asstSecyNPSS2 && item.ss_asstSecyNPSS2.toLowerCase().includes(term)) return true;

      return false;
  });

  // --- ANALYTICS LOGIC ---
  const analyticsData = useMemo(() => {
      if (archives.length === 0) return null;

      const stats = {
          total: archives.length,
          byYear: {} as Record<string, number>,
          avgTenure: 0,
          currentYearCount: 0
      };

      let tenureSum = 0;
      let tenureCount = 0;
      const currentYear = new Date().getFullYear().toString();

      archives.forEach(entry => {
          // Yearly Trends
          const year = entry.date.split('-')[0];
          stats.byYear[year] = (stats.byYear[year] || 0) + 1;
          if (year === currentYear) stats.currentYearCount++;

          // Tenure Calculation for Pastors/Elders
          if (entry.tenureYears) {
              const matches = entry.tenureYears.match(/(\d{4})\s*-\s*(\d{4})/);
              if (matches) {
                  const start = parseInt(matches[1]);
                  const end = parseInt(matches[2]);
                  if (!isNaN(start) && !isNaN(end)) {
                      tenureSum += (end - start);
                      tenureCount++;
                  }
              }
          }
      });

      stats.avgTenure = tenureCount > 0 ? parseFloat((tenureSum / tenureCount).toFixed(1)) : 0;

      // Convert byYear to sorted array
      const sortedYears = Object.entries(stats.byYear)
          .map(([year, count]) => ({ year, count }))
          .sort((a, b) => a.year.localeCompare(b.year));

      return { ...stats, sortedYears };
  }, [archives]);

  // Determine layout based on category
  const isListView = selectedCategory === 'Pastors' || selectedCategory === 'Upa kal ta te' || selectedCategory === 'Weekly Program';

  // Helper for Breadcrumbs in Sunday School
  const getBreadcrumbTitle = () => {
      if (selectedSubCategory !== 'SUNDAY SCHOOL') return '';
      if (currentSSPath.length === 0) return 'Sunday School';
      if (currentSSPath.length === 1) return `Sunday School > ${currentSSPath[0]}`;
      if (currentSSPath.length === 2) return `... > ${currentSSPath[0]} > ${currentSSPath[1]}`;
      return 'Sunday School';
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">{t.archives.title}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">{t.archives.subtitle}</p>
        </div>

        {/* --- MAIN GRID VIEW (No Category Selected) --- */}
        {!selectedCategory && (
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
        )}

        {/* --- LIST / SUB-CATEGORY VIEW --- */}
        {selectedCategory && (
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
                                {selectedSubCategory === 'SUNDAY SCHOOL' ? getBreadcrumbTitle() : 
                                 (selectedCategory === 'Rawngbawltu te' && !selectedSubCategory ? 'Departments' : 
                                 (selectedSubCategory || ARCHIVE_SECTIONS.find(s => s.id === selectedCategory)?.label))
                                }
                            </h2>
                            <p className="text-sm text-slate-500">
                                {isViewingRecords || isSSHotute || isSSDepartmentView ? t.archives.viewingRecords : t.archives.selectFolder}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-end md:items-center">
                        {/* Only show controls if we are viewing records */}
                        {(isViewingRecords || isSSHotute || isSSDepartmentView) && (
                            <>
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition ${viewMode === 'list' ? 'bg-white text-church-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <LayoutList size={16} /> {t.archives.list}
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('analytics')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition ${viewMode === 'analytics' ? 'bg-white text-church-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <BarChart3 size={16} /> {t.archives.analytics}
                                    </button>
                                </div>

                                {viewMode === 'list' && (
                                    <div className="relative flex-grow md:flex-grow-0 w-full md:w-auto flex gap-2">
                                        <div className="relative flex-grow">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder={isSSDepartmentView ? t.archives.searchTeachers : t.archives.search} 
                                                className="w-full md:w-64 pl-10 pr-12 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            {searchTerm && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full">
                                                    {filteredArchives.length}
                                                </div>
                                            )}
                                        </div>
                                        {(isSSDepartmentView || isSSHotute) && (
                                            <>
                                                {isAdmin && (
                                                    <>
                                                        <button 
                                                            onClick={handleDownloadTemplate}
                                                            className="p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-sm"
                                                            title="Download Import Template"
                                                        >
                                                            <FileSpreadsheet size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => importInputRef.current?.click()}
                                                            className="p-2 bg-church-50 text-church-700 border border-church-200 rounded-lg hover:bg-church-100 transition shadow-sm"
                                                            title="Import from Excel"
                                                        >
                                                            <FileUp size={20} />
                                                        </button>
                                                        <input 
                                                            type="file" 
                                                            ref={importInputRef} 
                                                            onChange={handleImportFile} 
                                                            className="hidden" 
                                                            accept=".xlsx, .xls, .csv" 
                                                        />
                                                    </>
                                                )}
                                                {isSSDepartmentView && (
                                                    <button 
                                                        onClick={handleExportExcel}
                                                        className="p-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition shadow-sm"
                                                        title="Export to Excel"
                                                    >
                                                        <FileDown size={20} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                        
                        {isAdmin && (isViewingRecords || isSSHotute || isSSDepartmentView) && viewMode === 'list' && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleAddNew()}
                                    className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm transition whitespace-nowrap"
                                >
                                    <Plus size={18} className="mr-2" /> Add Entry
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sub-Category Grid for 'Rawngbawltu te' Root */}
                {selectedCategory === 'Rawngbawltu te' && !selectedSubCategory && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {subCategories.map((sub) => (
                            <button
                                key={sub}
                                onClick={() => handleSubCategorySelect(sub)}
                                className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-church-200 hover:-translate-y-1 transition-all duration-200 text-left group flex items-center"
                            >
                                <div className="p-3 bg-slate-50 text-slate-500 rounded-lg mr-4 group-hover:bg-church-100 group-hover:text-church-600 transition-colors shrink-0">
                                    <Folder size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-church-700 transition-colors line-clamp-2">{sub}</h3>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* SUNDAY SCHOOL ROOT: Committee, Zirtirtute & Hotute Folders */}
                {isSSRoot && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={() => handleSSFolderClick('Committee')}
                            className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-300 transition-all duration-200 text-left group flex items-center"
                        >
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl mr-5 group-hover:scale-110 transition-transform">
                                <Briefcase size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Sunday School Committee</h3>
                                <p className="text-slate-500 text-sm">Committee records & minutes</p>
                            </div>
                        </button>
                        <button
                            onClick={() => handleSSFolderClick('Zirtirtute')}
                            className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-green-300 transition-all duration-200 text-left group flex items-center"
                        >
                            <div className="p-4 bg-green-50 text-green-600 rounded-xl mr-5 group-hover:scale-110 transition-transform">
                                <Users size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Sunday School Zirtirtute</h3>
                                <p className="text-slate-500 text-sm">Teachers by department</p>
                            </div>
                        </button>
                        <button
                            onClick={() => handleSSFolderClick('Hotute')}
                            className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-purple-300 transition-all duration-200 text-left group flex items-center"
                        >
                            <div className="p-4 bg-purple-50 text-purple-600 rounded-xl mr-5 group-hover:scale-110 transition-transform">
                                <UserCog size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Sunday School Hotute</h3>
                                <p className="text-slate-500 text-sm">Yearly Leadership Records</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* SUNDAY SCHOOL ZIRTIRTUTE: Department Folders */}
                {isSSZirtirtuteRoot && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* GLOBAL SEARCH SECTION */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                <SearchIcon size={20} className="mr-2 text-church-600" /> Search Zirtirtu (All Departments)
                            </h3>
                            <form onSubmit={handleGlobalSearch} className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter teacher name (e.g. Lalhruaia)..." 
                                    className="flex-grow p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-church-500 outline-none"
                                    value={globalSearchTerm}
                                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                                />
                                <button 
                                    type="submit" 
                                    className="bg-church-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-church-700 transition flex items-center"
                                    disabled={isGlobalSearching}
                                >
                                    {isGlobalSearching ? <Loader size={20} className="animate-spin" /> : 'Search'}
                                </button>
                                {hasSearched && (
                                    <button 
                                        type="button" 
                                        onClick={clearGlobalSearch}
                                        className="bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
                                    >
                                        Clear
                                    </button>
                                )}
                            </form>

                            {/* Global Search Results */}
                            {hasSearched && !isGlobalSearching && (
                                <div className="mt-6 border-t border-slate-100 pt-6">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                                        Found {globalSearchResults.length} records matching "{globalSearchTerm}"
                                    </h4>
                                    
                                    {globalSearchResults.length > 0 ? (
                                        <div className="grid gap-4">
                                            {globalSearchResults.map((result) => {
                                                // Highlight matches roughly
                                                const matchText = (text: string) => text.toLowerCase().includes(globalSearchTerm.toLowerCase());
                                                
                                                return (
                                                    <div key={result.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-church-300 transition">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="inline-block px-2 py-1 bg-church-100 text-church-700 rounded text-xs font-bold uppercase tracking-wide mb-1">
                                                                    {result.department}
                                                                </span>
                                                                <h5 className="font-bold text-lg text-slate-900">{result.ss_year}</h5>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-slate-600 space-y-1">
                                                            {result.ss_dept_leader && (
                                                                <p><span className="font-semibold text-slate-500">Leader:</span> <span className={matchText(result.ss_dept_leader) ? "bg-yellow-200" : ""}>{result.ss_dept_leader}</span></p>
                                                            )}
                                                            {result.ss_dept_secretary && (
                                                                <p><span className="font-semibold text-slate-500">Secretary:</span> <span className={matchText(result.ss_dept_secretary) ? "bg-yellow-200" : ""}>{result.ss_dept_secretary}</span></p>
                                                            )}
                                                            {result.ss_dept_teachers && (
                                                                <div className="mt-2 pt-2 border-t border-slate-200">
                                                                    <span className="font-semibold text-slate-500 block mb-1">Teachers:</span>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {result.ss_dept_teachers.split(',').map((tName, i) => (
                                                                            <span key={i} className={`px-2 py-1 rounded text-xs border ${matchText(tName) ? "bg-yellow-100 border-yellow-300 text-yellow-900 font-bold" : "bg-white border-slate-200"}`}>
                                                                                {tName.trim()}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 italic">No teachers found matching your search.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {SS_ZIRTIRTUTE_DEPARTMENTS.map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => handleSSFolderClick(dept)}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-yellow-300 transition-all duration-200 text-left group flex items-center"
                                >
                                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg mr-4 group-hover:bg-yellow-100 transition-colors shrink-0">
                                        <FolderOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">{dept}</h3>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* SUNDAY SCHOOL HOTUTE: Table View */}
                {isSSHotute && viewMode === 'list' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900 text-white uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="px-4 py-4 whitespace-nowrap sticky left-0 bg-slate-900 z-10">Year</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Superintendent</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Asst. Supdt</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Asst. Supdt (NPSS)</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Secretary</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Asst. Secretary 1</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Asst. Secretary 2</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Asst. Secy (NPSS) 1</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Asst. Secy (NPSS) 2</th>
                                        {isAdmin && <th className="px-4 py-4 whitespace-nowrap text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredArchives.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-bold text-church-900 sticky left-0 bg-white hover:bg-slate-50">{entry.ss_year}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.ss_superintendent || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.ss_asstSupdt || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.ss_asstSupdtNPSS || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.ss_secretary || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.ss_asstSecy1 || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.ss_asstSecy2 || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.ss_asstSecyNPSS1 || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.ss_asstSecyNPSS2 || '-'}</td>
                                            {isAdmin && (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleEdit(entry)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                                        <button onClick={() => handleDelete(entry.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash size={16}/></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredArchives.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-8 text-center text-slate-500 italic">No leadership records found. Add a new entry to get started.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SUNDAY SCHOOL DEPARTMENT VIEW: Year-based Table */}
                {isSSDepartmentView && viewMode === 'list' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900 text-white uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap sticky left-0 bg-slate-900 z-10 w-24 border-r border-slate-700">Year</th>
                                        {!isPuitling && <th className="px-6 py-4 whitespace-nowrap w-48 border-r border-slate-700">Leader</th>}
                                        {!isPuitling && <th className="px-6 py-4 whitespace-nowrap w-48 border-r border-slate-700">Asst. Leader</th>}
                                        {!isPuitling && <th className="px-6 py-4 whitespace-nowrap w-48 border-r border-slate-700">Secretary</th>}
                                        {/* Dynamic Headers for Zirtirtu 1 to 20/40/60 */}
                                        {Array.from({ length: teacherColumnCount }).map((_, i) => (
                                            <th key={i} className="px-4 py-4 whitespace-nowrap text-[10px] w-40 border-r border-slate-700">Zirtirtu {i + 1}</th>
                                        ))}
                                        {isAdmin && <th className="px-4 py-4 whitespace-nowrap text-right w-24">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {SS_YEAR_RANGE.map((year) => {
                                        // Find entry for this year
                                        const entry = filteredArchives.find(a => a.ss_year === year);
                                        // If filtering is active and no entry matches, skip year row unless it's the specific year being searched
                                        if (searchTerm && !entry) return null;

                                        // Parse teachers string into array
                                        const teacherList = entry?.ss_dept_teachers ? entry.ss_dept_teachers.split(',').map(t => t.trim()) : [];

                                        return (
                                            <tr key={year} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-black text-church-900 sticky left-0 bg-white hover:bg-slate-50 border-r border-slate-100">{year}</td>
                                                {!isPuitling && <td className="px-6 py-4 text-sm text-slate-700 border-r border-slate-100">{entry?.ss_dept_leader || '-'}</td>}
                                                {!isPuitling && <td className="px-6 py-4 text-sm text-slate-700 border-r border-slate-100">{entry?.ss_dept_asst_leader || '-'}</td>}
                                                {!isPuitling && <td className="px-6 py-4 text-sm text-slate-700 border-r border-slate-100">{entry?.ss_dept_secretary || '-'}</td>}
                                                
                                                {/* Map teachers to columns */}
                                                {Array.from({ length: teacherColumnCount }).map((_, i) => (
                                                    <td key={i} className="px-4 py-4 text-xs text-slate-700 border-r border-slate-100">
                                                        {teacherList[i] || '-'}
                                                    </td>
                                                ))}

                                                {isAdmin && (
                                                    <td className="px-4 py-4 text-right">
                                                        {entry ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => handleEdit(entry)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                                                <button onClick={() => handleDelete(entry.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash size={16}/></button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleAddNew(year)} 
                                                                className="text-xs font-bold text-church-600 hover:text-church-800 hover:underline"
                                                            >
                                                                + Add
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    {searchTerm && filteredArchives.length === 0 && (
                                        <tr>
                                            <td colSpan={(isPuitling ? 1 : 4) + teacherColumnCount + (isAdmin ? 1 : 0)} className="px-6 py-8 text-center text-slate-500 italic">No records found matching "{searchTerm}".</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- RECORD LISTING VIEW (Standard) --- */}
                {isViewingRecords && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {loading ? (
                            <div className="col-span-full flex justify-center py-20">
                                <Loader className="animate-spin text-church-500 w-10 h-10" />
                            </div>
                        ) : filteredArchives.length > 0 ? (
                            filteredArchives.map((archive) => {
                                const Icon = CATEGORY_ICONS[archive.category] || FileText;
                                const isVideo = archive.category === 'Video';
                                const videoId = isVideo ? getYouTubeId(archive.link) : null;

                                return (
                                    <div key={archive.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                                        {/* Thumbnail Section */}
                                        <div className="h-48 bg-slate-200 relative overflow-hidden shrink-0">
                                            {isVideo && videoId ? (
                                                <div className="w-full h-full relative cursor-pointer" onClick={() => setPlayingVideoId(videoId)}>
                                                    <img src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} alt="Video Thumbnail" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                            <Play className="ml-1 text-church-600" size={24} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (archive.category === 'Photo' || archive.category === 'Pastors' || archive.category === 'Upa kal ta te') && archive.imageUrls && archive.imageUrls.length > 0 ? (
                                                <div className="w-full h-full relative cursor-pointer" onClick={() => setPreviewImage(archive.imageUrls![0])}>
                                                    <img src={archive.imageUrls[0]} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    {archive.imageUrls.length > 1 && (
                                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-bold">
                                                            +{archive.imageUrls.length - 1}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                                    <Icon size={48} />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3">
                                                <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[10px] font-bold text-slate-700 uppercase tracking-wider shadow-sm border border-slate-200">
                                                    {archive.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{archive.date}</span>
                                                {isAdmin && (
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(archive)} className="text-slate-400 hover:text-blue-600"><Edit size={14} /></button>
                                                        <button onClick={() => handleDelete(archive.id)} className="text-slate-400 hover:text-red-600"><Trash size={14} /></button>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-church-700 transition-colors">{archive.title}</h3>
                                            <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-grow">{archive.description}</p>
                                            
                                            <div className="mt-auto space-y-2">
                                                {/* Read More Button for Bio/Description */}
                                                <button 
                                                    onClick={() => setSelectedArchive(archive)}
                                                    className="w-full py-2 rounded-lg bg-church-50 text-church-600 font-bold text-xs uppercase tracking-wider hover:bg-church-100 transition-colors border border-church-100"
                                                >
                                                    Read Full Details
                                                </button>

                                                {/* External Link Button */}
                                                {archive.link && !isVideo && (
                                                    <a 
                                                        href={archive.link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="flex items-center justify-center w-full py-2 rounded-lg bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 hover:text-slate-800 transition-colors border border-slate-100"
                                                    >
                                                        <ExternalLink size={14} className="mr-2" /> Open Resource
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-20">
                                <div className="inline-block p-4 bg-slate-100 rounded-full mb-4 text-slate-300">
                                    <FolderOpen size={48} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-600 mb-1">No Archives Found</h3>
                                <p className="text-slate-400 text-sm">Try adjusting your search or select a different category.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Video Player Modal */}
        {playingVideoId && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setPlayingVideoId(null)}>
                <button className="absolute top-6 right-6 text-white/70 hover:text-white transition p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button>
                <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-black">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`} 
                        title="YouTube Video" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        )}

        {/* Image Preview Modal */}
        {previewImage && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
                <button className="absolute top-6 right-6 text-white/70 hover:text-white transition p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button>
                <div className="relative max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" />
                </div>
            </div>
        )}

        {/* Reader Modal */}
        {selectedArchive && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedArchive(null)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="relative h-48 md:h-64 shrink-0 bg-slate-900 overflow-hidden">
                        {(selectedArchive.imageUrls && selectedArchive.imageUrls.length > 0) ? (
                            <img 
                                src={selectedArchive.imageUrls[0]} 
                                alt={selectedArchive.title} 
                                className="w-full h-full object-cover opacity-80" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-200">
                                {React.createElement(CATEGORY_ICONS[selectedArchive.category] || FileText, { size: 64 })}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                        <button onClick={() => setSelectedArchive(null)} className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition"><X size={24}/></button>
                        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                            <span className="inline-block px-2 py-1 bg-church-600 rounded text-[10px] font-bold uppercase tracking-widest mb-2">{selectedArchive.category}</span>
                            <h2 className="text-2xl md:text-3xl font-serif font-bold leading-tight">{selectedArchive.title}</h2>
                            <p className="text-sm opacity-80 mt-1">{selectedArchive.date}</p>
                        </div>
                    </div>
                    <div className="p-8 overflow-y-auto">
                        {/* Image Gallery Grid if multiple images */}
                        {selectedArchive.imageUrls && selectedArchive.imageUrls.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 mb-6">
                                {selectedArchive.imageUrls.map((url, i) => (
                                    <img key={i} src={url} className="h-20 w-full object-cover rounded-lg cursor-pointer hover:opacity-80" onClick={() => setPreviewImage(url)} alt={`Gallery ${i}`} />
                                ))}
                            </div>
                        )}
                        
                        <div className="prose prose-slate max-w-none font-serif text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {selectedArchive.description}
                        </div>

                        {selectedArchive.link && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <a 
                                    href={selectedArchive.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-2 text-church-600 font-bold hover:underline"
                                >
                                    <ExternalLink size={16} /> Open Attached Resource
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Edit/Add Modal */}
        {isEditModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b bg-slate-50 rounded-t-2xl flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{editingArchive.id ? 'Edit Entry' : 'Add New Entry'}</h3>
                        <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    
                    <div className="p-6 space-y-5 overflow-y-auto bg-white">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                            <input 
                                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                                value={editingArchive.title || ''} 
                                onChange={e => setEditingArchive({...editingArchive, title: e.target.value})} 
                                placeholder="Archive Title"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                                <input 
                                    type="date"
                                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                                    value={editingArchive.date || ''} 
                                    onChange={e => setEditingArchive({...editingArchive, date: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                <select 
                                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                                    value={editingArchive.category} 
                                    onChange={e => setEditingArchive({...editingArchive, category: e.target.value as any})}
                                >
                                    {Object.keys(CATEGORY_ICONS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Rawngbawltu te Sub-Category Selection */}
                        {editingArchive.category === 'Rawngbawltu te' && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Sub-Category (Committee)</label>
                                <select 
                                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                                    value={editingArchive.subCategory || ''} 
                                    onChange={e => setEditingArchive({...editingArchive, subCategory: e.target.value})}
                                >
                                    <option value="">Select Committee</option>
                                    {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Sunday School Department Selection */}
                        {editingArchive.category === 'Rawngbawltu te' && editingArchive.subCategory === 'SUNDAY SCHOOL' && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Department</label>
                                <select 
                                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                                    value={editingArchive.department || ''} 
                                    onChange={e => setEditingArchive({...editingArchive, department: e.target.value})}
                                >
                                    <option value="">Select Folder</option>
                                    <option value="Committee">Committee</option>
                                    <option value="Hotute">Hotute</option>
                                    {SS_ZIRTIRTUTE_DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                            <textarea 
                                className="w-full border p-2.5 rounded-lg h-32 focus:ring-2 focus:ring-church-500 outline-none" 
                                value={editingArchive.description || ''} 
                                onChange={e => setEditingArchive({...editingArchive, description: e.target.value})} 
                                placeholder="Details about this archive entry..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Link / Resource URL</label>
                            <input 
                                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none" 
                                value={editingArchive.link || ''} 
                                onChange={e => setEditingArchive({...editingArchive, link: e.target.value})} 
                                placeholder="https://... (Drive Link, YouTube, etc.)"
                            />
                        </div>

                        {/* Image Upload for Photos, Pastors, and Elders */}
                        {(editingArchive.category === 'Photo' || editingArchive.category === 'Pastors' || editingArchive.category === 'Upa kal ta te') && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Images</label>
                                <div className="flex gap-2 items-center">
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingImage}
                                        className="px-4 py-2 bg-slate-100 border rounded-lg text-slate-600 hover:bg-slate-200 text-sm font-bold flex items-center"
                                    >
                                        {uploadingImage ? <Loader className="animate-spin mr-2" size={16}/> : <Upload className="mr-2" size={16}/>} 
                                        Upload Images
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleImageUpload} 
                                        className="hidden" 
                                        accept="image/*"
                                        multiple 
                                    />
                                </div>
                                {editingArchive.imageUrls && editingArchive.imageUrls.length > 0 && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                        {editingArchive.imageUrls.map((url, idx) => (
                                            <div key={idx} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                                                <img src={url} className="w-full h-full object-cover" alt="thumb" />
                                                <button 
                                                    type="button"
                                                    onClick={() => setEditingArchive(prev => ({...prev, imageUrls: prev.imageUrls?.filter((_, i) => i !== idx)}))}
                                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end space-x-3 rounded-b-2xl">
                        <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white transition">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-church-600 text-white rounded-xl font-bold hover:bg-church-700 flex items-center shadow-lg shadow-church-200 transition disabled:opacity-50">
                            {isSaving ? <Loader className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18} />} Save Entry
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Archives;
