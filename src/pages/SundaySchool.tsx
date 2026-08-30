
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db, storage, handleFirestoreError, OperationType } from '../services/firebase';
import { SundaySchoolDepartment, SSWeeklyReport, SSReportSegment, Staff, SundaySchoolSection, SundaySchoolSectionMember } from '../types';
import { 
  Users, UserCheck, Edit, Save, X, Loader, Database, 
  FileUp, ClipboardList, Calendar, Info, Plus, Trash, 
  ChevronRight, TrendingUp, Sparkles, BookOpen, Wallet,
  User, Phone, MessageCircle, MapPin, Quote, ShieldCheck,
  Camera, Move, ZoomIn, Download, FileDown, Upload, PlusCircle,
  GripVertical, FileSpreadsheet, FileType, Search, Radio
} from 'lucide-react';
import ProtectedContact from '../components/ProtectedContact';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import StaffEditModal from '../components/StaffEditModal';
import 'react-quill-new/dist/quill.snow.css';
import { beginnerSyllabus } from '../constants/beginnerSyllabus';
import { 
  primarySyllabus, 
  intermediateSyllabus, 
  seniorSyllabus, 
  sacramentSyllabus, 
  juniorSyllabus,
  puitlingSyllabus 
} from '../constants/sundaySchoolSyllabus';
import { getNextSundayLesson } from '../services/syllabusService';
import { QuarterlySyllabusItem, quarterlySyllabusData } from '../constants/quarterlySyllabus';
import { getMizoDayName, parseLocalDate } from '../hooks/useWeeklyEvents';

const ReactQuill = lazy(() => import('react-quill-new'));

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'blockquote', 'code-block'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  }
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'blockquote', 'code-block'
];

// dnd-kit imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableZirtirtuCardProps {
  zirtirtuName: string;
  index: number;
  profile?: Staff;
  isAdmin: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

const SortableZirtirtuCard: React.FC<SortableZirtirtuCardProps> = ({ 
  zirtirtuName, 
  index, 
  profile, 
  isAdmin, 
  onEdit, 
  onRemove 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: zirtirtuName });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      onClick={onEdit}
      className={`bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-4 relative group transition-all ${isAdmin ? 'cursor-pointer hover:border-church-300 hover:bg-white hover:shadow-md' : ''}`}
    >
      {isAdmin && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-church-600 transition-opacity z-20"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>
      )}
      
      <div className={`w-14 h-14 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-100 ${isAdmin ? 'ml-4' : ''}`}>
          {profile?.imageUrl ? (
              <img 
                src={profile.imageUrl} 
                alt={zirtirtuName} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
                style={{ objectPosition: `${profile.imagePositionX ?? 50}% ${profile.imagePositionY ?? 0}%` }}
              />
          ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg bg-white">
                  {zirtirtuName.charAt(0)}
              </div>
          )}
      </div>
      <div className="flex-grow min-w-0">
          <h4 className="font-bold text-slate-800 text-base truncate">{zirtirtuName}</h4>
          <p className="text-church-600 font-medium text-xs mb-1 truncate">{profile?.role || 'Zirtirtu'}</p>
          
          {profile?.phoneNumber && (
              <div className="flex items-center gap-2 mt-2">
                  <ProtectedContact 
                      phone={profile.phoneNumber} 
                      name={zirtirtuName} 
                      variant="icon-only" 
                  />
                  <span className="text-slate-400 text-[10px] font-mono">{profile.phoneNumber}</span>
              </div>
          )}
      </div>
      {isAdmin && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                  }}
                  className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 transition-colors border border-red-100 h-fit"
                  title="Remove from Department"
              >
                  <Trash size={14} />
              </button>
              <div className="p-1.5 bg-white text-slate-400 rounded-lg shadow-sm border border-slate-100 h-fit">
                  <Edit size={14} />
              </div>
          </div>
      )}
    </div>
  );
};

const INITIAL_DEPARTMENTS_DATA: Omit<SundaySchoolDepartment, 'name'>[] = [
    { id: 'pre-beginner', leader: '', asstLeader: '', secretary: '', asstSecretary: '', zirtirtute: [], description: '', students: 0, ageGroup: '', room: '', time: '', lessonNumber: '', lessonDate: '', lessonName: '', bibleVerse: '', memoryVerse: '', announcements: '' },
    { id: 'beginner', leader: '', asstLeader: '', secretary: '', asstSecretary: '', zirtirtute: [], description: '', students: 0, ageGroup: '', room: '', time: '', lessonNumber: '', lessonDate: '', lessonName: '', bibleVerse: '', memoryVerse: '', announcements: '' },
    { id: 'primary', leader: '', asstLeader: '', secretary: '', asstSecretary: '', zirtirtute: [], description: '', students: 0, ageGroup: '', room: '', time: '', lessonNumber: '', lessonDate: '', lessonName: '', bibleVerse: '', memoryVerse: '', announcements: '' },
    { id: 'junior', leader: '', asstLeader: '', secretary: '', asstSecretary: '', zirtirtute: [], description: '', students: 0, ageGroup: '', room: '', time: '', lessonNumber: '', lessonDate: '', lessonName: '', bibleVerse: '', memoryVerse: '', announcements: '' },
    { id: 'intermediate', leader: '', asstLeader: '', secretary: '', asstSecretary: '', zirtirtute: [], description: '', students: 0, ageGroup: '', room: '', time: '', lessonNumber: '', lessonDate: '', lessonName: '', bibleVerse: '', memoryVerse: '', announcements: '' },
    { id: 'sacrament', leader: '', asstLeader: '', secretary: '', asstSecretary: '', zirtirtute: [], description: '', students: 0, ageGroup: '', room: '', time: '', lessonNumber: '', lessonDate: '', lessonName: '', bibleVerse: '', memoryVerse: '', announcements: '' },
    { id: 'senior', leader: '', asstLeader: '', secretary: '', asstSecretary: '', zirtirtute: [], description: '', students: 0, ageGroup: '', room: '', time: '', lessonNumber: '', lessonDate: '', lessonName: '', bibleVerse: '', memoryVerse: '', announcements: '' },
    { id: 'puitling', leader: '', asstLeader: '', secretary: '', asstSecretary: '', zirtirtute: [], description: '', students: 0, ageGroup: '', room: '', time: '', lessonNumber: '', lessonDate: '', lessonName: '', bibleVerse: '', memoryVerse: '', announcements: '' }
];

const EMPTY_SEGMENT: SSReportSegment = {
    zirtirtu: { kal: 0, kallo: 0 },
    zirtu: { kal: 0, kallo: 0 },
    chhimtu: 0,
    thawhlawm: 0
};

const normalizeName = (name: string): string => {
  if (!name) return '';
  
  // 1. Protect titles with periods
  let normalized = name
    .replace(/Dr\./g, '__DR__')
    .replace(/Nl\./g, '__NL__')
    .replace(/Tv\./g, '__TV__');
    
  // 2. Replace all other periods with space
  normalized = normalized.replace(/\./g, ' ');
  
  // 3. Restore protected titles
  normalized = normalized
    .replace(/__DR__/g, 'Dr.')
    .replace(/__NL__/g, 'Nl.')
    .replace(/__TV__/g, 'Tv.');
    
  // 4. Clean up multiple spaces and trim
  return normalized.replace(/\s+/g, ' ').trim();
};

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr || dateStr === 'Tarlan a awm lo') return dateStr || 'Tarlan a awm lo';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const SundaySchool: React.FC = () => {
  const { departmentId, section } = useParams<{ departmentId: string; section?: string }>();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const [departments, setDepartments] = useState<SundaySchoolDepartment[]>([]);
  const [allZirtirtute, setAllZirtirtute] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Weekly Report States
  const [reports, setReports] = useState<SSWeeklyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Partial<SSWeeklyReport>>({});

  // Dept Management States
  const [isSeeding, setIsSeeding] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Partial<SundaySchoolDepartment> | null>(null);
  
  // Group Photo States
  const [isUploadingGroupPhoto, setIsUploadingGroupPhoto] = useState(false);
  const [groupPhotoUrlInput, setGroupPhotoUrlInput] = useState('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const groupPhotoFileRef = useRef<HTMLInputElement>(null);
  const [quarterlySyllabus, setQuarterlySyllabus] = useState<QuarterlySyllabusItem[]>([]);

  // Zirtirtu Profile States
  const [selectedZirtirtuName, setSelectedZirtirtuName] = useState<string | null>(null);
  const [zirtirtuProfile, setZirtirtuProfile] = useState<Staff | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isZirtirtuEditModalOpen, setIsZirtirtuEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Section (Pawl) States
  const [ssSections, setSsSections] = useState<SundaySchoolSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Partial<SundaySchoolSection> | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<SundaySchoolSectionMember> & { sectionId: string } | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  
  const importInputRef = useRef<HTMLInputElement>(null);
  const sectionMemberImportRef = useRef<HTMLInputElement>(null);

  const getDeptName = useCallback((id: string) => {
      // @ts-ignore
      return t.sundaySchool[id] || id.charAt(0).toUpperCase() + id.slice(1);
  }, [t]);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    let fetchedDepts: SundaySchoolDepartment[] = [];
    
    try {
        if (!db || !db.collection) {
            fetchedDepts = INITIAL_DEPARTMENTS_DATA.map(d => ({ ...d, name: getDeptName(d.id) })) as SundaySchoolDepartment[];
        } else {
            // Test connection
            try {
                await db.collection('test').doc('connection').get({ source: 'server' });
            } catch (connErr: any) {
                if (connErr.message?.includes('offline')) {
                    console.error("Please check your Firebase configuration. The client is offline.");
                }
            }
            const snapshot = await db.collection('sundaySchoolDepartments').get();
            if (!snapshot.empty) {
                const fetchedData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as any[];
                fetchedDepts = INITIAL_DEPARTMENTS_DATA.map(init => {
                    const found = fetchedData.find(f => f.id.toLowerCase() === init.id.toLowerCase());
                    if (found) {
                        return {
                            ...init,
                            ...found,
                            zirtirtute: found.zirtirtute || found.teachers || found.zirtirtu || [],
                            students: found.students || found.studentCount || 0,
                            name: getDeptName(init.id)
                        };
                    }
                    return { ...init, name: getDeptName(init.id) };
                }) as SundaySchoolDepartment[];
            } else {
                fetchedDepts = INITIAL_DEPARTMENTS_DATA.map(d => ({ ...d, name: getDeptName(d.id) })) as SundaySchoolDepartment[];
            }
        }
    } catch (e) {
        console.error("Error fetching departments from Firestore:", e);
        fetchedDepts = INITIAL_DEPARTMENTS_DATA.map(d => ({ ...d, name: getDeptName(d.id) })) as SundaySchoolDepartment[];
    }

    // Auto-fill next Sunday lesson if blank
    console.log("Auto-filling syllabus for departments...");
    const updatedWithSyllabus = await Promise.all(fetchedDepts.map(async (dept) => {
        const isLessonBlank = !dept.lessonNumber || dept.lessonNumber.trim() === '' || dept.lessonNumber === 'Tarlan a awm lo';
        if (isLessonBlank) {
            console.log(`Attempting to auto-fill lesson for ${dept.id}`);
            const nextLesson = await getNextSundayLesson(dept.id);
            if (nextLesson) {
                console.log(`Auto-filled ${dept.id} with:`, nextLesson.lessonName);
                return {
                    ...dept,
                    lessonNumber: nextLesson.lessonNumber,
                    lessonDate: nextLesson.date,
                    lessonName: nextLesson.lessonName
                };
            } else {
                console.log(`No lesson found for ${dept.id}`);
            }
        }
        return dept;
    }));

    setDepartments(updatedWithSyllabus);

    // Fetch teachers profiles
    try {
        if (db && db.collection) {
            const staffColls = ['ss_teachers', 'elders', 'pastors', 'proPastors'];
            let combinedStaff: Staff[] = [];
            
            for (const coll of staffColls) {
              const snap = await db.collection(coll).get();
              const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
              combinedStaff = [...combinedStaff, ...data];
            }
            setAllZirtirtute(combinedStaff);
        }
    } catch (staffError) {
        console.error("Error fetching staff profiles:", staffError);
    }
    
    setLoading(false);
  }, [getDeptName]);

  const fetchSections = useCallback(async () => {
    if (!db || !db.collection || !departmentId) return;
    setLoadingSections(true);
    try {
      const snap = await db.collection('sundaySchoolDepartments')
        .doc(departmentId)
        .collection('sections')
        .get();
      const sections = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SundaySchoolSection));
      
      // Perform natural sorting so 'Pawl 2' comes before 'Pawl 10'
      sections.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      
      setSsSections(sections);
      if (sections.length > 0 && !activeSectionId) {
        setActiveSectionId(sections[0].id);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
    setLoadingSections(false);
  }, [departmentId, activeSectionId]);

  useEffect(() => {
    if (section === 'sections') {
      fetchSections();
    } else {
      setSelectedMemberIds([]);
    }
  }, [section, fetchSections]);

  useEffect(() => {
    setSelectedMemberIds([]);
  }, [activeSectionId]);

  const handleSelectAllMembers = (members: SundaySchoolSectionMember[], checked: boolean) => {
    if (checked) {
      setSelectedMemberIds(members.map(m => m.id));
    } else {
      setSelectedMemberIds([]);
    }
  };

  const handleSelectMemberRow = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedMembers = async (sectionId: string) => {
    if (!db || !db.collection || !departmentId || selectedMemberIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedMemberIds.length} selected members?`)) return;

    setIsSaving(true);
    try {
      const sectionRef = db.collection('sundaySchoolDepartments').doc(departmentId).collection('sections').doc(sectionId);
      const sectionData = ssSections.find(s => s.id === sectionId);
      if (sectionData) {
        const updatedMembers = sectionData.members.filter(m => !selectedMemberIds.includes(m.id));
        await sectionRef.update({ members: updatedMembers });
        setSelectedMemberIds([]);
        fetchSections();
      }
    } catch (error) {
      console.error("Error deleting selected members:", error);
    }
    setIsSaving(false);
  };

  const handleSaveSection = async () => {
    if (!db || !db.collection || !departmentId || !editingSection?.name) return;
    setIsSaving(true);
    try {
      if (editingSection.id) {
        await db.collection('sundaySchoolDepartments').doc(departmentId).collection('sections').doc(editingSection.id).update({
          name: editingSection.name
        });
      } else {
        await db.collection('sundaySchoolDepartments').doc(departmentId).collection('sections').add({
          name: editingSection.name,
          members: [],
          createdAt: new Date().toISOString()
        });
      }
      setIsSectionModalOpen(false);
      fetchSections();
    } catch (error) {
      console.error("Error saving section:", error);
    }
    setIsSaving(false);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!db || !db.collection || !departmentId || !window.confirm("Delete this section and all its members?")) return;
    try {
      await db.collection('sundaySchoolDepartments').doc(departmentId).collection('sections').doc(sectionId).delete();
      if (activeSectionId === sectionId) setActiveSectionId(null);
      fetchSections();
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  const handleSaveMember = async () => {
    if (!db || !db.collection || !departmentId || !editingMember || !editingMember.name || !editingMember.sectionId) return;
    setIsSaving(true);
    try {
      const sectionRef = db.collection('sundaySchoolDepartments').doc(departmentId).collection('sections').doc(editingMember.sectionId);
      const sectionData = ssSections.find(s => s.id === editingMember.sectionId);
      if (!sectionData) throw new Error("Section data not found");

      let updatedMembers = [...(sectionData.members || [])];
      
      if (editingMember.id) {
        // Edit existing
        updatedMembers = updatedMembers.map(m => m.id === editingMember.id ? { id: m.id, name: editingMember.name! } : m);
      } else {
        // Add new
        updatedMembers.push({
          id: Math.random().toString(36).substr(2, 9),
          name: editingMember.name
        });
      }

      await sectionRef.update({ members: updatedMembers });
      setIsMemberModalOpen(false);
      fetchSections();
    } catch (error) {
      console.error("Error saving member:", error);
    }
    setIsSaving(false);
  };

  const handleDeleteMember = async (sectionId: string, memberId: string) => {
    if (!db || !db.collection || !departmentId || !window.confirm("Remove this member?")) return;
    try {
      const sectionRef = db.collection('sundaySchoolDepartments').doc(departmentId).collection('sections').doc(sectionId);
      const sectionData = ssSections.find(s => s.id === sectionId);
      if (sectionData) {
        const updatedMembers = sectionData.members.filter(m => m.id !== memberId);
        await sectionRef.update({ members: updatedMembers });
        fetchSections();
      }
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  const handleImportMembers = async (e: React.ChangeEvent<HTMLInputElement>, targetSectionId: string) => {
    const file = e.target.files?.[0];
    if (!file || !db || !departmentId || !targetSectionId) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      const importedMembers: SundaySchoolSectionMember[] = [];
      const startIndex = jsonData[0] && String(jsonData[0][0]).toLowerCase().includes('name') ? 1 : 0;

      for (let i = startIndex; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row[0]) {
          importedMembers.push({
            id: Math.random().toString(36).substr(2, 9),
            name: String(row[0]).trim()
          });
        }
      }

      if (importedMembers.length === 0) {
        alert("No valid data found.");
        return;
      }

      if (window.confirm(`Import ${importedMembers.length} members?`)) {
        const sectionRef = db.collection('sundaySchoolDepartments').doc(departmentId).collection('sections').doc(targetSectionId);
        const sectionData = ssSections.find(s => s.id === targetSectionId);
        const existingMembers = sectionData?.members || [];
        await sectionRef.update({ members: [...existingMembers, ...importedMembers] });
        fetchSections();
        alert("Members imported successfully!");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import members.");
    } finally {
      if (sectionMemberImportRef.current) sectionMemberImportRef.current.value = '';
    }
  };

  const exportSectionToExcel = (section: SundaySchoolSection) => {
    const data = section.members.map((m, i) => ({
      'S.No': i + 1,
      'Name': m.name
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, section.name);
    XLSX.writeFile(workbook, `${section.name}_Members.xlsx`);
  };

  const exportSectionToPDF = (section: SundaySchoolSection) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(section.name, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Sunday School Section Members - ${new Date().toLocaleDateString()}`, 14, 30);
    
    autoTable(doc, {
      startY: 40,
      head: [['Sl.No', 'Name']],
      body: section.members.map((m, i) => [i + 1, m.name]),
      headStyles: { fillColor: [44, 62, 80], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 40 },
    });
    
    doc.save(`${section.name}_Members.pdf`);
  };

  const fetchReports = useCallback(async () => {
    if (!db || !db.collection) return;
    setLoadingReports(true);
    try {
        const snapshot = await db.collection('sundaySchoolWeeklyReports')
            .orderBy('date', 'desc')
            .limit(20)
            .get();
        
        const fetchedReports = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as SSWeeklyReport[];
        setReports(fetchedReports);
    } catch (error: any) {
        console.error("Error fetching reports:", error);
    }
    setLoadingReports(false);
  }, []);

  useEffect(() => {
    console.log("Fetching departments for:", departmentId);
    fetchDepartments();
  }, [fetchDepartments, departmentId]);

  useEffect(() => {
    const fetchQuarterlySyllabus = async () => {
      if (!departmentId || departmentId === 'report' || !db?.collection) {
        setQuarterlySyllabus([]);
        return;
      }
      try {
        const doc = await db.collection('sundaySchoolQuarterlySyllabus').doc(departmentId).get();
        if (doc.exists) {
          setQuarterlySyllabus(doc.data().items || []);
        } else {
          // Fallback to local constants
          setQuarterlySyllabus(quarterlySyllabusData[departmentId] || []);
        }
      } catch (e) {
        if (e && typeof e === 'object' && 'code' in e && e.code === 'permission-denied') {
          handleFirestoreError(e, OperationType.GET, `sundaySchoolQuarterlySyllabus/${departmentId}`);
        }
        console.error("Error fetching quarterly syllabus:", e);
        setQuarterlySyllabus(quarterlySyllabusData[departmentId] || []);
      }
    };
    fetchQuarterlySyllabus();
  }, [departmentId]);

  useEffect(() => {
      if (departmentId === 'report') {
          fetchReports();
      }
  }, [departmentId, fetchReports]);

  useEffect(() => {
    const fetchZirtirtuProfile = async () => {
      if (!selectedZirtirtuName || !db?.collection) {
        setZirtirtuProfile(null);
        return;
      }
      setLoadingProfile(true);
      try {
        const snap = await db.collection('ss_teachers').where('name', '==', selectedZirtirtuName).limit(1).get();
        if (!snap.empty) {
          setZirtirtuProfile({ id: snap.docs[0].id, ...snap.docs[0].data() } as Staff);
        } else {
          setZirtirtuProfile(null);
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
      }
      setLoadingProfile(false);
    };
    fetchZirtirtuProfile();
  }, [selectedZirtirtuName]);

  const handleClearZirtirtuteExceptPuitling = async () => {
      if (!db || !db.collection || !window.confirm("This will remove ALL zirtirtute and leadership from all departments EXCEPT Puitling. Are you sure?")) return;
      setIsSeeding(true);
      try {
          const batch = db.batch();
          const deptsToClear = ['pre-beginner', 'beginner', 'primary', 'junior', 'intermediate', 'sacrament', 'senior'];
          deptsToClear.forEach(id => {
              const docRef = db.collection('sundaySchoolDepartments').doc(id);
              batch.update(docRef, { 
                  zirtirtute: [],
                  leader: '',
                  asstLeader: '',
                  secretary: '',
                  asstSecretary: ''
              });
          });
          await batch.commit();
          fetchDepartments();
          alert("Zirtirtute and leadership cleared successfully (Puitling preserved)!");
      } catch(e: any) {
          console.error(e);
          alert(`Failed to clear data: ${e.message}`);
      }
      setIsSeeding(false);
  };

  const handleSeed = async () => {
      if (!db || !db.collection || !window.confirm("This will RESET all Sunday School data in Firebase to empty fields. Are you sure?")) return;
      setIsSeeding(true);
      try {
          const batch = db.batch();
          INITIAL_DEPARTMENTS_DATA.forEach(dept => {
              const docRef = db.collection('sundaySchoolDepartments').doc(dept.id);
              batch.set(docRef, { ...dept, name: getDeptName(dept.id) });
          });
          await batch.commit();
          fetchDepartments();
          alert("All data reset successfully!");
      } catch(e: any) {
          console.error(e);
          alert(`Failed to save data to Firebase: ${e.message}`);
      }
      setIsSeeding(false);
  };

  const handleSeedSyllabus = async () => {
      if (!db || !db.collection || !window.confirm("This will seed/update the Sunday School Syllabus (weekly and quarterly) in Firebase. Continue?")) return;
      setIsSeeding(true);
      try {
          const { seedSyllabus } = await import('../services/syllabusService');
          await seedSyllabus();
          alert("Syllabus seeded successfully!");
          fetchDepartments();
      } catch(e: any) {
          console.error(e);
          alert(`Failed to seed syllabus: ${e.message}`);
      }
      setIsSeeding(false);
  };

  const handleSaveDept = async () => {
      if (!db || !db.collection || !editingDept || !editingDept.id) return;
      try {
          const normalizedDept = {
              ...editingDept,
              leader: normalizeName(editingDept.leader || ''),
              asstLeader: normalizeName(editingDept.asstLeader || ''),
              secretary: normalizeName(editingDept.secretary || ''),
              asstSecretary: normalizeName(editingDept.asstSecretary || ''),
              zirtirtute: (editingDept.zirtirtute || []).map(n => normalizeName(n))
          };
          await db.collection('sundaySchoolDepartments').doc(editingDept.id).set(normalizedDept, { merge: true });
          setIsEditModalOpen(false);
          fetchDepartments();
      } catch (e: any) {
          console.error("Save Error:", e);
          alert(`Failed to save: ${e.message || 'Unknown error'}`);
      }
  };

  const formatSundaySchoolReportToHtml = (report: Partial<SSWeeklyReport>): string => {
    const puitling = report.puitling || EMPTY_SEGMENT;
    const naupang = report.naupang || EMPTY_SEGMENT;

    const puitlingZirtirtuKal = puitling.zirtirtu?.kal || 0;
    const puitlingZirtirtuKallo = puitling.zirtirtu?.kallo || 0;
    const puitlingZirtirtuTotal = puitlingZirtirtuKal + puitlingZirtirtuKallo;

    const puitlingZirtuKal = puitling.zirtu?.kal || 0;
    const puitlingZirtuKallo = puitling.zirtu?.kallo || 0;
    const puitlingZirtuTotal = puitlingZirtuKal + puitlingZirtuKallo;

    const puitlingChhimtu = puitling.chhimtu || 0;
    const puitlingKal = puitlingZirtirtuKal + puitlingZirtuKal + puitlingChhimtu;
    const puitlingKallo = puitlingZirtirtuKallo + puitlingZirtuKallo;
    const puitlingTotal = puitlingKal + puitlingKallo;
    const puitlingThawhlawm = puitling.thawhlawm || 0;

    const naupangZirtirtuKal = naupang.zirtirtu?.kal || 0;
    const naupangZirtirtuKallo = naupang.zirtirtu?.kallo || 0;
    const naupangZirtirtuTotal = naupangZirtirtuKal + naupangZirtirtuKallo;

    const naupangZirtuKal = naupang.zirtu?.kal || 0;
    const naupangZirtuKallo = naupang.zirtu?.kallo || 0;
    const naupangZirtuTotal = naupangZirtuKal + naupangZirtuKallo;

    const naupangChhimtu = naupang.chhimtu || 0;
    const naupangKal = naupangZirtirtuKal + naupangZirtuKal + naupangChhimtu;
    const naupangKallo = naupangZirtirtuKallo + naupangZirtuKallo;
    const naupangTotal = naupangKal + naupangKallo;
    const naupangThawhlawm = naupang.thawhlawm || 0;

    const grandKal = puitlingKal + naupangKal;
    const grandKallo = puitlingKallo + naupangKallo;
    const grandTotal = grandKal + grandKallo;
    const totalThawhlawm = puitlingThawhlawm + naupangThawhlawm;

    return `
<h3 style="margin-top: 0.5rem; color: #0f172a; font-size: 1.1rem; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">1. Puitling Sunday School</h3>
<table class="church-table" style="width: 100%; border-collapse: collapse; margin-top: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
  <thead>
    <tr style="background-color: #0f172a; color: #ffffff; text-align: left;">
      <th style="padding: 10px 14px; background-color: #0f172a; color: #ffffff !important; font-weight: 800; border: 1px solid #334155; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Hming / Role</th>
      <th style="padding: 10px 14px; background-color: #0f172a; color: #ffffff !important; font-weight: 800; border: 1px solid #334155; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Kal</th>
      <th style="padding: 10px 14px; background-color: #0f172a; color: #ffffff !important; font-weight: 800; border: 1px solid #334155; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Kal lo</th>
      <th style="padding: 10px 14px; background-color: #0f172a; color: #ffffff !important; font-weight: 800; border: 1px solid #334155; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">Zirtirtu</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${puitlingZirtirtuKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; color: #64748b;">${puitlingZirtirtuKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${puitlingZirtirtuTotal}</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">Zirtu</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${puitlingZirtuKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; color: #64748b;">${puitlingZirtuKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${puitlingZirtuTotal}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">Chhimtu</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${puitlingChhimtu}</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; color: #64748b;">-</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${puitlingChhimtu}</td>
    </tr>
    <tr style="background: #e2e8f0; font-weight: bold;">
      <td style="padding: 8px 12px; border: 1px solid #94a3b8; color: #0f172a;">Puitling Total</td>
      <td style="padding: 8px 12px; border: 1px solid #94a3b8; text-align: center; color: #0f172a;">${puitlingKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #94a3b8; text-align: center; color: #475569;">${puitlingKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #94a3b8; text-align: center; color: #0f172a;">${puitlingTotal}</td>
    </tr>
  </tbody>
</table>
<p style="margin-top: 0; margin-bottom: 1.5rem; font-weight: bold; color: #047857;">💰 Puitling Thawhlawm: ₹${puitlingThawhlawm.toLocaleString()}</p>

<h3 style="margin-top: 1.5rem; color: #065f46; font-size: 1.1rem; font-weight: 800; border-bottom: 2px solid #a7f3d0; padding-bottom: 0.5rem;">2. Naupang Sunday School</h3>
<table class="church-table" style="width: 100%; border-collapse: collapse; margin-top: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
  <thead>
    <tr style="background-color: #065f46; color: #ffffff; text-align: left;">
      <th style="padding: 10px 14px; background-color: #065f46; color: #ffffff !important; font-weight: 800; border: 1px solid #047857; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Hming / Role</th>
      <th style="padding: 10px 14px; background-color: #065f46; color: #ffffff !important; font-weight: 800; border: 1px solid #047857; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Kal</th>
      <th style="padding: 10px 14px; background-color: #065f46; color: #ffffff !important; font-weight: 800; border: 1px solid #047857; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Kal lo</th>
      <th style="padding: 10px 14px; background-color: #065f46; color: #ffffff !important; font-weight: 800; border: 1px solid #047857; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; font-weight: bold; color: #065f46;">Zirtirtu</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${naupangZirtirtuKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; color: #64748b;">${naupangZirtirtuKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${naupangZirtirtuTotal}</td>
    </tr>
    <tr style="background: #f0fdf4;">
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; font-weight: bold; color: #065f46;">Zirtu</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${naupangZirtuKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; color: #64748b;">${naupangZirtuKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${naupangZirtuTotal}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; font-weight: bold; color: #065f46;">Chhimtu</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${naupangChhimtu}</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; color: #64748b;">-</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${naupangChhimtu}</td>
    </tr>
    <tr style="background: #d1fae5; font-weight: bold;">
      <td style="padding: 8px 12px; border: 1px solid #6ee7b7; color: #065f46;">Naupang Total</td>
      <td style="padding: 8px 12px; border: 1px solid #6ee7b7; text-align: center; color: #065f46;">${naupangKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #6ee7b7; text-align: center; color: #475569;">${naupangKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #6ee7b7; text-align: center; color: #065f46;">${naupangTotal}</td>
    </tr>
  </tbody>
</table>
<p style="margin-top: 0; margin-bottom: 1.5rem; font-weight: bold; color: #047857;">💰 Naupang Thawhlawm: ₹${naupangThawhlawm.toLocaleString()}</p>
    `.trim();
  };

  const syncReportToAnnouncement = async (report: Partial<SSWeeklyReport>, id: string) => {
    if (!db || !db.collection || !report.date) return;
    try {
      const announcementDocId = `ss_report_${id}`;
      const content = formatSundaySchoolReportToHtml(report);
      
      await db.collection('announcements').doc(announcementDocId).set({
        id: announcementDocId,
        title: `Sunday School Report (${report.date})`,
        date: report.date,
        category: 'Sunday School',
        content: content,
        reportId: id,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to sync report to announcements:", err);
    }
  };

  const handleAddReport = () => {
      setEditingReport({
          date: new Date().toISOString().split('T')[0],
          naupang: JSON.parse(JSON.stringify(EMPTY_SEGMENT)),
          puitling: JSON.parse(JSON.stringify(EMPTY_SEGMENT))
      });
      setIsReportModalOpen(true);
  };

  const handleSaveReport = async () => {
      if (!db || !db.collection || !editingReport.date) {
          alert("Please select a date.");
          return;
      }
      try {
          const docRef = editingReport.id 
              ? db.collection('sundaySchoolWeeklyReports').doc(editingReport.id)
              : db.collection('sundaySchoolWeeklyReports').doc();
          
          const reportToSave = {
              ...editingReport,
              id: docRef.id
          };
          
          await docRef.set(reportToSave, { merge: true });

          // Automatically sync updated report to Latest News / Announcements
          await syncReportToAnnouncement(reportToSave, docRef.id);

          setIsReportModalOpen(false);
          fetchReports();
      } catch (error: any) {
          console.error("Error saving report:", error);
          if (error.message?.includes('permissions')) {
             alert("Insufficient permissions. You must be an administrator to save reports.");
          } else {
             alert("Failed to save report: " + error.message);
          }
      }
  };

  const handleDeleteReport = async (id: string) => {
      if (!db || !db.collection || !window.confirm("Delete this report?")) return;
      try {
          await db.collection('sundaySchoolWeeklyReports').doc(id).delete();
          // Also delete linked announcement if exists
          await db.collection('announcements').doc(`ss_report_${id}`).delete().catch(() => {});
          fetchReports();
      } catch (error) {
          console.error(error);
          alert("Failed to delete report.");
      }
  };

  const handleSyncAllReports = async () => {
      if (!db || !db.collection || reports.length === 0) return;
      try {
          let count = 0;
          for (const rep of reports) {
              if (rep.id && rep.date) {
                  await syncReportToAnnouncement(rep, rep.id);
                  count++;
              }
          }
          alert(`Successfully synced ${count} Sunday School report(s) to Latest News / Announcements!`);
      } catch (err: any) {
          alert("Failed to sync reports: " + err.message);
      }
  };

  const handleSaveZirtirtuProfile = async (staff: Staff, collectionName: string) => {
    if (!db?.collection || !currentDept) return;
    setIsSaving(true);
    try {
      const oldName = zirtirtuProfile?.name;
      const newName = normalizeName(staff.name);
      
      const normalizedStaff = {
        ...staff,
        name: newName
      };

      // 1. Save the profile
      if (staff.id) {
        await db.collection(collectionName).doc(staff.id).set(normalizedStaff, { merge: true });
      } else {
        await db.collection(collectionName).add(normalizedStaff);
      }

      // 2. If name changed, update all references in the department
      if (oldName && oldName !== newName) {
        const updatedZirtirtute = (currentDept.zirtirtute || []).map(name => name === oldName ? newName : name);
        const updates: any = { zirtirtute: updatedZirtirtute };
        
        if (currentDept.leader === oldName) updates.leader = newName;
        if (currentDept.asstLeader === oldName) updates.asstLeader = newName;
        if (currentDept.secretary === oldName) updates.secretary = newName;
        if (currentDept.asstSecretary === oldName) updates.asstSecretary = newName;

        await db.collection('sundaySchoolDepartments').doc(currentDept.id).update(updates);
      } else if (!(currentDept.zirtirtute || []).includes(newName)) {
        // New zirtirtu being added
        const updatedZirtirtute = [...(currentDept.zirtirtute || []), newName];
        await db.collection('sundaySchoolDepartments').doc(currentDept.id).update({
          zirtirtute: updatedZirtirtute
        });
      }

      setIsZirtirtuEditModalOpen(false);
      setZirtirtuProfile(normalizedStaff);
      fetchDepartments(); // Refresh to show new image/role
    } catch (error) {
      console.error("Error saving zirtirtu profile:", error);
      alert("Failed to save zirtirtu profile.");
    }
    setIsSaving(false);
  };

  const handleRemoveZirtirtuFromDept = async (zirtirtuName: string) => {
    if (!db || !currentDept || !window.confirm(`Remove ${zirtirtuName} from ${currentDept.name} department?`)) return;
    setIsSaving(true);
    try {
      const updatedZirtirtute = (currentDept.zirtirtute || []).filter(name => name !== zirtirtuName);
      const updates: any = { zirtirtute: updatedZirtirtute };
      
      // Also clear leadership roles if they held them
      if (currentDept.leader === zirtirtuName) updates.leader = '';
      if (currentDept.asstLeader === zirtirtuName) updates.asstLeader = '';
      if (currentDept.secretary === zirtirtuName) updates.secretary = '';
      if (currentDept.asstSecretary === zirtirtuName) updates.asstSecretary = '';

      await db.collection('sundaySchoolDepartments').doc(currentDept.id).update(updates);
      fetchDepartments();
    } catch (error) {
      console.error("Error removing zirtirtu:", error);
      alert("Failed to remove zirtirtu.");
    }
    setIsSaving(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentDept) return;

    const oldIndex = (currentDept.zirtirtute || []).indexOf(active.id as string);
    const newIndex = (currentDept.zirtirtute || []).indexOf(over.id as string);

    const newZirtirtute = arrayMove(currentDept.zirtirtute || [], oldIndex, newIndex);

    try {
      // Optimistic update
      setDepartments(prev => prev.map(d => d.id === currentDept.id ? { ...d, zirtirtute: newZirtirtute } : d));
      
      await db.collection('sundaySchoolDepartments').doc(currentDept.id).update({
        zirtirtute: newZirtirtute
      });
    } catch (error) {
      console.error("Error reordering zirtirtute:", error);
      fetchDepartments(); // Revert on error
    }
  };

  const handleDeleteZirtirtuProfile = async (id: string, collectionName: string) => {
    if (!db || !window.confirm("Delete this zirtirtu profile?") || !currentDept) return;
    setIsSaving(true);
    try {
      // 1. Get the zirtirtu profile to know their name
      const profileDoc = await db.collection(collectionName).doc(id).get();
      const zirtirtuName = profileDoc.data()?.name;

      // 2. Delete the profile
      await db.collection(collectionName).doc(id).delete();

      // 3. Remove from department's zirtirtute list
      if (zirtirtuName) {
        const updatedZirtirtute = (currentDept.zirtirtute || []).filter(name => name !== zirtirtuName);
        await db.collection('sundaySchoolDepartments').doc(currentDept.id).update({
          zirtirtute: updatedZirtirtute
        });
      }

      setZirtirtuProfile(null);
      setIsZirtirtuEditModalOpen(false);
      setShowDeleteConfirm(null);
      fetchDepartments(); // Refresh
    } catch (error) {
      console.error("Error deleting profile:", error);
      alert("Failed to delete profile.");
    }
    setIsSaving(false);
  };

  const handleDownloadExcel = () => {
    if (!currentDept) return;
    
    // Prepare data for Excel
    const excelData = [
      ['Name', 'Designation', 'Phone Number'],
      ... (currentDept.zirtirtute || []).map(zirtirtuName => {
        const profile = allZirtirtute.find(t => t.name === zirtirtuName);
        return [
          zirtirtuName,
          profile?.role || 'Zirtirtu',
          profile?.phoneNumber || profile?.phone || ''
        ];
      })
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Zirtirtute List");
    XLSX.writeFile(workbook, `${currentDept.name}_Zirtirtute_List.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const data = [
      ['Name', 'Designation', 'Phone Number'],
      ['Lalnunmawii', 'Zirtirtu', '9876543210'],
      ['Hruaitluanga', 'Asst. Zirtirtu', '9876543211']
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Zirtirtute Template");
    XLSX.writeFile(workbook, "SundaySchool_Zirtirtute_Template.xlsx");
  };

  const handleImportZirtirtute = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const normalizedId = departmentId?.toLowerCase();
      const currentDept = departments.find(d => d.id === normalizedId) || departments[0];

      if (!file || !currentDept) return;

      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          const importedZirtirtute: { name: string, designation: string, phone: string }[] = [];
          
          // Skip header row if it looks like one
          const firstRow = jsonData[0];
          const startIndex = firstRow && String(firstRow[0]).toLowerCase().includes('name') ? 1 : 0;

          for (let i = startIndex; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (row && row.length > 0) {
                  const name = normalizeName(String(row[0] || '').trim());
                  const designation = String(row[1] || 'Zirtirtu').trim();
                  const phone = String(row[2] || '').trim();
                  
                  if (name) {
                      importedZirtirtute.push({ name, designation, phone });
                  }
              }
          }

          if (importedZirtirtute.length === 0) {
              alert("No valid data found in the Excel file.");
              return;
          }

          if (window.confirm(`Found ${importedZirtirtute.length} zirtirtute. This will update their profiles and REPLACE the existing zirtirtu list for ${currentDept.name}. Proceed?`)) {
              if (db && db.collection) {
                  setLoading(true);
                  
                  // Update/Create profiles in ss_teachers
                  // We do this sequentially to avoid batch query issues, though it's slower
                  for (const t of importedZirtirtute) {
                      const snap = await db.collection('ss_teachers').where('name', '==', t.name).limit(1).get();
                      if (!snap.empty) {
                          await db.collection('ss_teachers').doc(snap.docs[0].id).update({ 
                              role: t.designation, 
                              phoneNumber: t.phone 
                          });
                      } else {
                          await db.collection('ss_teachers').add({
                              name: t.name,
                              role: t.designation,
                              phoneNumber: t.phone,
                              imageUrl: '',
                              biography: '',
                              createdAt: new Date().toISOString()
                          });
                      }
                  }
                  
                  // Update department zirtirtute list
                  const zirtirtuNames = importedZirtirtute.map(t => t.name);
                  await db.collection('sundaySchoolDepartments').doc(currentDept.id).update({ zirtirtute: zirtirtuNames });
                  
                  alert("Zirtirtute imported and profiles updated successfully!");
                  fetchDepartments();
              } else {
                  alert("Database connection unavailable.");
              }
          }
      } catch (error: any) {
          console.error("Import error:", error);
          alert(`Failed to import: ${error.message || 'Unknown error'}`);
      } finally {
          if (importInputRef.current) importInputRef.current.value = '';
          setLoading(false);
      }
  };

  const handleGroupPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const normalizedId = departmentId?.toLowerCase();
    const currentDept = departments.find(d => d.id === normalizedId);
    
    if (!file || !currentDept) return;
    
    setIsUploadingGroupPhoto(true);
    try {
      const storageRef = storage.ref(`sunday_school_groups/${currentDept.id}_${Date.now()}`);
      await storageRef.put(file);
      const url = await storageRef.getDownloadURL();
      
      await db.collection('sundaySchoolDepartments').doc(currentDept.id).update({
        groupPhotoUrl: url
      });
      
      setDepartments(prev => prev.map(d => d.id === currentDept.id ? { ...d, groupPhotoUrl: url } : d));
      setShowPhotoInput(false);
    } catch (error: any) {
      console.error('Failed to upload group photo:', error);
      alert('Failed to upload photo: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploadingGroupPhoto(false);
      if (groupPhotoFileRef.current) groupPhotoFileRef.current.value = '';
    }
  };

  const handleSaveGroupPhotoUrl = async () => {
    const normalizedId = departmentId?.toLowerCase();
    const currentDept = departments.find(d => d.id === normalizedId);
    if (!currentDept || !groupPhotoUrlInput.trim()) return;

    setIsUploadingGroupPhoto(true);
    try {
      await db.collection('sundaySchoolDepartments').doc(currentDept.id).update({
        groupPhotoUrl: groupPhotoUrlInput.trim()
      });
      setDepartments(prev => prev.map(d => d.id === currentDept.id ? { ...d, groupPhotoUrl: groupPhotoUrlInput.trim() } : d));
      setGroupPhotoUrlInput('');
      setShowPhotoInput(false);
    } catch (error: any) {
      console.error('Failed to save group photo URL:', error);
      alert('Failed to save photo URL: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploadingGroupPhoto(false);
    }
  };

  const handleRemoveGroupPhoto = async () => {
    const normalizedId = departmentId?.toLowerCase();
    const currentDept = departments.find(d => d.id === normalizedId);
    if (!currentDept || !window.confirm("Remove this group photograph?")) return;

    try {
      await db.collection('sundaySchoolDepartments').doc(currentDept.id).update({
        groupPhotoUrl: ''
      });
      setDepartments(prev => prev.map(d => d.id === currentDept.id ? { ...d, groupPhotoUrl: '' } : d));
    } catch (error: any) {
      console.error('Failed to remove group photo:', error);
      alert('Failed to remove photo: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-church-500"/></div>;
  
  const isReportView = departmentId === 'report';
  const normalizedId = departmentId?.toLowerCase();
  const currentDept = departments.find(d => d.id === normalizedId);

  if (!isReportView && !currentDept) return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <p className="text-slate-500 mb-4">Department not found.</p>
            <Link to="/" className="text-church-600 font-bold underline">Back to Home</Link>
        </div>
    </div>
  );

  const isPuitling = currentDept?.id === 'puitling';

  const isBeginner = departmentId === 'beginner';

  return (
      <div className="py-12 bg-slate-50 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                  <Link to="/" className="text-sm font-bold text-slate-500 hover:text-church-600 mb-4 inline-block">&larr; Back to Home</Link>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-4">
                          <img 
                              src="https://firebasestorage.googleapis.com/v0/b/bethelpci.firebasestorage.app/o/committee_logos%2F1775482969296_mss.jpg?alt=media&token=6a190ac6-0db1-4ca8-bd0e-2a0c4474fa38" 
                              alt="Sunday School Logo" 
                              className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-slate-200"
                              referrerPolicy="no-referrer"
                          />
                          <div>
                              <h1 className="text-4xl font-serif font-black text-church-900 leading-tight">
                                  {isReportView ? 'Sunday School Weekly Reports' : `${currentDept?.name} Department`}
                              </h1>
                              <p className="text-slate-500 mt-1 text-lg font-medium">
                                  {isReportView ? 'Breakdown of Naupang and Puitling department reports.' : (currentDept?.description || 'Sunday School department details.')}
                              </p>
                          </div>
                      </div>
                  </div>
              </div>

              {!isReportView ? (
                  /* DEPARTMENT INFO VIEW */
                  <div className="grid md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="md:col-span-2 space-y-6">
                          {/* Navigation Tabs */}
                          <div className="flex flex-wrap gap-2 mb-4">
                              <Link 
                                  to={`/sundayschool/${departmentId}`} 
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!section ? 'bg-church-600 text-white border-church-600 shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
                              >
                                  Main Info
                              </Link>
                              {isPuitling ? (
                                  <Link 
                                      to={`/sundayschool/${departmentId}/sections`} 
                                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${section === 'sections' ? 'bg-church-600 text-white border-church-600 shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
                                  >
                                      Pawl (Section)
                                  </Link>
                              ) : (
                                  <Link 
                                      to={`/sundayschool/${departmentId}/quarterly`} 
                                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${section === 'quarterly' ? 'bg-church-600 text-white border-church-600 shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
                                  >
                                      Thla thum zir
                                  </Link>
                              )}
                              <Link 
                                  to={`/sundayschool/${departmentId}/calendar`} 
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${section === 'calendar' ? 'bg-church-600 text-white border-church-600 shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
                              >
                                  Syllabus Calendar
                              </Link>
                              <Link 
                                  to={`/sundayschool/${departmentId}/teachers`} 
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${section === 'teachers' ? 'bg-church-600 text-white border-church-600 shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
                              >
                                  Zirtirtute
                              </Link>
                          </div>

                          {!section && (
                            <>
                              {/* Pawl Info Section */}
                              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                                      <Info className="text-church-600"/> Pawl Info
                                  </h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Age Group / Class</span>
                                          <p className="text-lg font-bold text-slate-800">{currentDept?.ageGroup || 'Tarlan a awm lo'}</p>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Room Awmna</span>
                                          <p className="text-lg font-bold text-slate-800">{currentDept?.room || 'Tarlan a awm lo'}</p>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Inkhawm Tan Hun</span>
                                          <p className="text-lg font-bold text-slate-800">{currentDept?.time || 'Tarlan a awm lo'}</p>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Zirlai Zah</span>
                                          <p className="text-lg font-bold text-slate-800">{currentDept?.students || 0}</p>
                                      </div>
                                  </div>
                              </div>

                              {/* Kar tin zirlai Section */}
                              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                                      <BookOpen className="text-church-600"/> Zirlai No. & Date
                                  </h3>
                                  <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Zirlai No.</span>
                                              <p className="text-lg font-bold text-slate-800">{currentDept?.lessonNumber || 'Tarlan a awm lo'}</p>
                                          </div>
                                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date</span>
                                              <p className="text-lg font-bold text-slate-800">{formatDate(currentDept?.lessonDate)}</p>
                                          </div>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Zirlai Hming</span>
                                          <p className="text-lg font-bold text-slate-800">{currentDept?.lessonName || 'Tarlan a awm lo'}</p>
                                      </div>
                                      {departmentId === 'puitling' && (
                                        <>
                                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bible Chang</span>
                                              <p className="text-lg font-bold text-slate-800">{currentDept?.bibleVerse || 'Tarlan a awm lo'}</p>
                                          </div>
                                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Thuvawn</span>
                                              <p className="text-lg font-bold text-slate-800">{currentDept?.memoryVerse || 'Tarlan a awm lo'}</p>
                                          </div>
                                        </>
                                      )}
                                  </div>
                              </div>

                              {/* Quick Links Section */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {isPuitling ? (
                                    <Link to={`/sundayschool/${departmentId}/sections`} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                        <Database className="text-church-600 mb-3 group-hover:scale-110 transition-transform" />
                                        <h4 className="font-bold text-slate-800">Pawl (Section)</h4>
                                        <p className="text-xs text-slate-500 mt-1">Manage Sunday School Sections</p>
                                    </Link>
                                  ) : (
                                    <Link to={`/sundayschool/${departmentId}/quarterly`} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                        <Sparkles className="text-church-600 mb-3 group-hover:scale-110 transition-transform" />
                                        <h4 className="font-bold text-slate-800">Thla thum zir</h4>
                                        <p className="text-xs text-slate-500 mt-1">Quarterly study materials</p>
                                    </Link>
                                  )}
                                  <Link to={`/sundayschool/${departmentId}/calendar`} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                      <Calendar className="text-church-600 mb-3 group-hover:scale-110 transition-transform" />
                                      <h4 className="font-bold text-slate-800">Syllabus Calendar</h4>
                                      <p className="text-xs text-slate-500 mt-1">Full year schedule</p>
                                  </Link>
                                  <Link to={`/sundayschool/${departmentId}/teachers`} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                      <Users className="text-church-600 mb-3 group-hover:scale-110 transition-transform" />
                                      <h4 className="font-bold text-slate-800">Zirtirtute</h4>
                                      <p className="text-xs text-slate-500 mt-1">Department teachers</p>
                                  </Link>
                              </div>

                              {/* Hriattirna Section */}
                              {currentDept?.announcements && currentDept.announcements !== '<p><br></p>' && (
                                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                                          <MessageCircle className="text-church-600"/> Hriattirna
                                      </h3>
                                      <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: currentDept.announcements }} />
                                  </div>
                              )}
                            </>
                          )}

                          {/* Pawl (Section) Management Section */}
                          {section === 'sections' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                              {/* Global Search Bar */}
                              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                                <div className="relative">
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                  <input 
                                    type="text" 
                                    placeholder="Search any name across all Pawls..." 
                                    value={globalSearchQuery}
                                    onChange={e => setGlobalSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold focus:ring-2 focus:ring-church-500 outline-none transition-all"
                                  />
                                </div>
                                {globalSearchQuery && (
                                  <div className="mt-4 max-h-64 overflow-y-auto divide-y divide-slate-50">
                                    {(() => {
                                      const results = ssSections.flatMap(s => 
                                        s.members
                                          .filter(m => m.name.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                                          .map(m => ({ ...m, sectionName: s.name, sectionId: s.id }))
                                      );
                                      
                                      if (results.length === 0) return <p className="py-4 text-center text-slate-400 italic">No matches found for "{globalSearchQuery}"</p>;
                                      
                                      return results.map(res => (
                                        <div 
                                          key={`${res.sectionId}-${res.id}`} 
                                          className="py-3 flex justify-between items-center hover:bg-slate-50 cursor-pointer px-2 rounded-lg"
                                          onClick={() => {
                                            setActiveSectionId(res.sectionId);
                                            setGlobalSearchQuery('');
                                          }}
                                        >
                                          <span className="font-bold text-slate-800">{res.name}</span>
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">{res.sectionName}</span>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                )}
                              </div>

                              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Database className="text-church-600"/> Pawl (Sections)
                                  </h3>
                                  {isAdmin && (
                                    <button 
                                      onClick={() => {
                                        setEditingSection({ name: '' });
                                        setIsSectionModalOpen(true);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition shadow-lg shadow-church-100 font-bold text-sm"
                                    >
                                      <PlusCircle size={18} /> Add New Pawl
                                    </button>
                                  )}
                                </div>

                                {loadingSections ? (
                                  <div className="py-12 flex justify-center"><Loader className="animate-spin text-church-500" /></div>
                                ) : ssSections.length === 0 ? (
                                  <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <Database size={48} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-500">No sections found. Add one to get started.</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {ssSections.map(s => (
                                      <div key={s.id} className="group relative">
                                        <button 
                                          onClick={() => setActiveSectionId(s.id)}
                                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${activeSectionId === s.id ? 'bg-church-600 text-white border-church-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-church-400'}`}
                                        >
                                          {s.name} ({s.members?.length || 0})
                                        </button>
                                        {isAdmin && (
                                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                                            <button 
                                              onClick={() => { setEditingSection(s); setIsSectionModalOpen(true); }}
                                              className="p-1 bg-white border border-slate-200 rounded-full text-blue-600 hover:bg-blue-50 shadow-sm"
                                            >
                                              <Edit size={12} />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteSection(s.id)}
                                              className="p-1 bg-white border border-slate-200 rounded-full text-red-600 hover:bg-red-50 shadow-sm"
                                            >
                                              <Trash size={12} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {activeSectionId && ssSections.find(s => s.id === activeSectionId) && (
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                                  {(() => {
                                    const section = ssSections.find(s => s.id === activeSectionId)!;
                                    const filteredMembers = section.members.filter(m => 
                                      m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                                    );

                                    return (
                                      <>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                          <div className="flex items-center gap-4 w-full md:w-auto">
                                            <h3 className="text-xl font-bold text-slate-800">{section.name} Members</h3>
                                            <div className="relative flex-1 md:w-64 max-w-xs">
                                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                              <input 
                                                type="text" 
                                                placeholder="Search name..." 
                                                value={memberSearchQuery}
                                                onChange={e => setMemberSearchQuery(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-church-500 outline-none"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                            {selectedMemberIds.length > 0 && isAdmin && (
                                              <button 
                                                onClick={() => handleDeleteSelectedMembers(section.id)}
                                                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-xs shadow-md transition"
                                              >
                                                <Trash size={16} /> Delete Selected ({selectedMemberIds.length})
                                              </button>
                                            )}
                                            <button 
                                              onClick={() => exportSectionToExcel(section)}
                                              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 font-bold text-xs border border-emerald-100 transition"
                                            >
                                              <FileSpreadsheet size={16} /> Excel
                                            </button>
                                            <button 
                                              onClick={() => exportSectionToPDF(section)}
                                              className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 font-bold text-xs border border-amber-100 transition"
                                            >
                                              <FileType size={16} /> PDF
                                            </button>
                                            {isAdmin && (
                                              <>
                                                <button 
                                                  onClick={() => sectionMemberImportRef.current?.click()}
                                                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 font-bold text-xs border border-slate-200 transition"
                                                >
                                                  <FileUp size={16} /> Import
                                                </button>
                                                <button 
                                                  onClick={() => {
                                                    setEditingMember({ name: '', sectionId: section.id });
                                                    setIsMemberModalOpen(true);
                                                  }}
                                                  className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 font-bold text-xs transition shadow-sm"
                                                >
                                                  <Plus size={16} /> Add Member
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        <input 
                                          type="file" 
                                          ref={sectionMemberImportRef} 
                                          className="hidden" 
                                          accept=".xlsx, .xls, .csv" 
                                          onChange={(e) => handleImportMembers(e, section.id)} 
                                        />

                                        <div className="overflow-x-auto">
                                          <table className="w-full">
                                            <thead>
                                              <tr className="border-b-2 border-slate-50 text-left">
                                                {isAdmin && (
                                                  <th className="py-4 px-4 w-10">
                                                    <input 
                                                      type="checkbox" 
                                                      className="rounded border-slate-300 text-church-600 focus:ring-church-500 w-4 h-4"
                                                      checked={selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0}
                                                      onChange={(e) => handleSelectAllMembers(filteredMembers, e.target.checked)}
                                                    />
                                                  </th>
                                                )}
                                                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Sl.No</th>
                                                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">Name</th>
                                                {isAdmin && <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>}
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                              {filteredMembers.length === 0 ? (
                                                <tr>
                                                  <td colSpan={isAdmin ? 4 : 3} className="py-12 text-center text-slate-400 italic">No members found.</td>
                                                </tr>
                                              ) : (
                                                filteredMembers.map((m, i) => (
                                                  <tr 
                                                    key={m.id} 
                                                    className={`hover:bg-slate-50 transition-colors group ${selectedMemberIds.includes(m.id) ? 'bg-church-50/50' : ''}`}
                                                  >
                                                    {isAdmin && (
                                                      <td className="py-4 px-4">
                                                        <input 
                                                          type="checkbox" 
                                                          className="rounded border-slate-300 text-church-600 focus:ring-church-500 w-4 h-4"
                                                          checked={selectedMemberIds.includes(m.id)}
                                                          onChange={() => handleSelectMemberRow(m.id)}
                                                        />
                                                      </td>
                                                    )}
                                                    <td className="py-4 px-4 text-sm font-bold text-slate-400">{i + 1}</td>
                                                    <td className="py-4 px-4 text-sm font-bold text-slate-800">{m.name}</td>
                                                    {isAdmin && (
                                                      <td className="py-4 px-4 text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                                          <button 
                                                            onClick={() => {
                                                              setEditingMember({ ...m, sectionId: section.id });
                                                              setIsMemberModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                          >
                                                            <Edit size={14} />
                                                          </button>
                                                          <button 
                                                            onClick={() => handleDeleteMember(section.id, m.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                          >
                                                            <Trash size={14} />
                                                          </button>
                                                        </div>
                                                      </td>
                                                    )}
                                                  </tr>
                                                ))
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quarterly Syllabus Section */}
                          {section === 'quarterly' && quarterlySyllabus.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                                    <Sparkles className="text-church-600"/> Thla thum chhung zir (2026)
                                </h3>
                                <div className="space-y-6">
                                    {quarterlySyllabus.map((item, index) => {
                                        const currentMonth = new Date().getMonth();
                                        const currentQuarterIndex = Math.floor(currentMonth / 3);
                                        const isCurrentQuarter = index === currentQuarterIndex;
                                        
                                        return (
                                            <div key={index} className={`p-6 rounded-2xl border transition-all duration-300 ${isCurrentQuarter ? 'bg-church-50 border-church-200 shadow-md ring-1 ring-church-200 scale-[1.02]' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex justify-between items-center mb-4 border-b border-church-100 pb-2">
                                                    <h4 className="text-sm font-black text-church-700 uppercase tracking-widest">{item.period}</h4>
                                                    {isCurrentQuarter && (
                                                        <span className="px-2 py-1 bg-church-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                                                            <Sparkles size={10} /> Current Quarter
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hla</span>
                                                    <p className="text-sm font-bold text-slate-800">{item.hla}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Thu</span>
                                                    <p className="text-sm font-bold text-slate-800">{item.thu}</p>
                                                </div>
                                                {item.thuInchhang && (
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Thu inchhang</span>
                                                        <p className="text-sm font-bold text-slate-800">{item.thuInchhang}</p>
                                                    </div>
                                                )}
                                                {item.solfaZir && (
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Solfa zir</span>
                                                        <p className="text-sm font-bold text-slate-800">{item.solfaZir}</p>
                                                    </div>
                                                )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                          )}
                          
                          {/* Syllabus Calendar Section */}
                          {section === 'calendar' && (() => {
                            const syllabuses: Record<string, any[]> = {
                              beginner: beginnerSyllabus,
                              primary: primarySyllabus,
                              intermediate: intermediateSyllabus,
                              senior: seniorSyllabus,
                              sacrament: sacramentSyllabus,
                              junior: juniorSyllabus,
                              puitling: puitlingSyllabus
                            };
                            const currentSyllabus = syllabuses[departmentId || ''];
                            
                            if (currentSyllabus) {
                              return (
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-xl font-black text-slate-800 mb-6">Syllabus Calendar</h3>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-4 gap-4 p-3 border-b-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <div>Date</div>
                                            <div>Zirlai No.</div>
                                            <div className="col-span-2">Zirlai</div>
                                        </div>
                                        {(() => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            
                                            // Find the first lesson that is today or in the future
                                            const upcomingIndex = currentSyllabus.findIndex(item => {
                                                const itemDate = new Date(item.date);
                                                return itemDate >= today;
                                            });

                                            return currentSyllabus.map((item, index) => {
                                                const isUpcoming = index === upcomingIndex;
                                                return (
                                                    <div key={index} className={`grid grid-cols-4 gap-4 p-3 border-b border-slate-100 text-sm transition-all duration-300 ${isUpcoming ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-100 rounded-xl scale-[1.01] z-10' : ''}`}>
                                                        <div className={`font-bold ${isUpcoming ? 'text-amber-700' : 'text-church-700'}`}>
                                                            {formatDate(item.date)}
                                                            {isUpcoming && <span className="ml-2 text-[8px] font-black uppercase tracking-widest bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">Upcoming</span>}
                                                        </div>
                                                        <div className={`font-bold ${isUpcoming ? 'text-amber-600' : 'text-slate-600'}`}>{item.lessonNumber}</div>
                                                        <div className={`col-span-2 ${isUpcoming ? 'text-amber-900 font-bold' : 'text-slate-800'}`}>{item.lessonName}</div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Zirtirtute Section */}
                          {section === 'teachers' && (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><UserCheck className="text-church-600"/> Zirtirtute ({currentDept?.zirtirtute?.length || 0})</h3>
                                {isAdmin && currentDept && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleDownloadExcel}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 font-bold text-sm"
                                            title="Download Excel List"
                                        >
                                            <FileDown size={18} /> Excel
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setZirtirtuProfile({ id: '', name: '', role: 'Zirtirtu', imageUrl: '', description: '', qualification: '', biography: '' } as Staff);
                                                setIsZirtirtuEditModalOpen(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition-all shadow-lg shadow-church-100 font-bold text-sm"
                                        >
                                            <PlusCircle size={18} /> Add Zirtirtu
                                        </button>
                                        <button 
                                            onClick={() => { setEditingDept(currentDept); setIsEditModalOpen(true); }} 
                                            className="p-2 bg-slate-50 text-slate-400 hover:text-church-600 hover:bg-church-50 rounded-xl transition shadow-sm border border-slate-100"
                                            title="Edit Department"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={handleDownloadTemplate} 
                                            className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 hover:bg-blue-100 shadow-sm transition" 
                                            title="Download Template"
                                        >
                                            <FileDown size={18} />
                                        </button>
                                        <button 
                                            onClick={() => importInputRef.current?.click()} 
                                            className="p-2 bg-green-50 text-green-700 rounded-xl border border-green-200 hover:bg-green-100 shadow-sm transition" 
                                            title="Import Zirtirtute"
                                        >
                                            <Upload size={18} />
                                        </button>
                                        <input type="file" ref={importInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImportZirtirtute} />
                                    </div>
                                )}
                              </div>
                              
                              {/* Group Photo Section */}
                              <div className="mb-8 relative">
                                {currentDept?.groupPhotoUrl ? (
                                  <div className="relative group rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                                    <img src={currentDept.groupPhotoUrl} alt={`${currentDept?.name} Group`} className="w-full h-auto object-cover max-h-[400px]" />
                                    {isAdmin && (
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-4">
                                        <button onClick={() => setShowPhotoInput(!showPhotoInput)} className="px-4 py-2 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-100 shadow-lg flex items-center gap-2"><Edit size={16}/> Change Photo</button>
                                        <button onClick={handleRemoveGroupPhoto} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg flex items-center gap-2"><Trash size={16} /> Remove</button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  isAdmin && (
                                     <button onClick={() => setShowPhotoInput(!showPhotoInput)} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-church-600 hover:border-church-200 transition font-medium flex items-center justify-center gap-2">
                                        <Camera size={24} /> Add Group Photograph
                                     </button>
                                  )
                                )}

                                {isAdmin && showPhotoInput && (
                                  <div className="mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-slate-700">Update Group Photograph</h4>
                                        <button onClick={() => setShowPhotoInput(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                      <div className="flex items-center gap-4">
                                        <input type="file" ref={groupPhotoFileRef} accept="image/*" onChange={handleGroupPhotoUpload} className="hidden" />
                                        <button disabled={isUploadingGroupPhoto} onClick={() => groupPhotoFileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 border border-emerald-100 disabled:opacity-50 transition w-full justify-center sm:w-auto">
                                          {isUploadingGroupPhoto ? <Loader className="animate-spin" size={18} /> : <FileUp size={18} />}
                                          Upload File
                                        </button>
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest hidden sm:block">OR</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <input type="url" value={groupPhotoUrlInput} onChange={e => setGroupPhotoUrlInput(e.target.value)} placeholder="Paste image URL here..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-church-500 outline-none" />
                                        <button disabled={isUploadingGroupPhoto || !groupPhotoUrlInput.trim()} onClick={handleSaveGroupPhotoUrl} className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition disabled:opacity-50 flex items-center gap-2"><Save size={16}/> Save Link</button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {!currentDept || !currentDept.zirtirtute || currentDept.zirtirtute.length === 0 ? (
                                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                      <Users size={48} className="mx-auto text-slate-300 mb-3" />
                                      <p className="text-slate-500">Zirtirtu tarlan a awm lo.</p>
                                  </div>
                              ) : (
                                  <DndContext 
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                  >
                                    <SortableContext 
                                      items={currentDept.zirtirtute || []}
                                      strategy={verticalListSortingStrategy}
                                    >
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {(currentDept.zirtirtute || []).map((zirtirtuName, i) => {
                                              const profile = allZirtirtute.find(p => p.name === zirtirtuName);
                                              return (
                                                  <SortableZirtirtuCard 
                                                    key={zirtirtuName}
                                                    zirtirtuName={zirtirtuName}
                                                    index={i}
                                                    profile={profile}
                                                    isAdmin={isAdmin}
                                                    onEdit={() => {
                                                      if (isAdmin) {
                                                          const p = allZirtirtute.find(prof => prof.name === zirtirtuName);
                                                          setZirtirtuProfile(p || { id: '', name: zirtirtuName, role: 'Zirtirtu', imageUrl: '', description: '', qualification: '', biography: '' } as Staff);
                                                          setIsZirtirtuEditModalOpen(true);
                                                      }
                                                    }}
                                                    onRemove={() => handleRemoveZirtirtuFromDept(zirtirtuName)}
                                                  />
                                              );
                                          })}
                                      </div>
                                    </SortableContext>
                                  </DndContext>
                              )}
                          </div>
                          )}
                      </div>

                      <div className="space-y-6">
                          <div className="bg-church-900 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-church-300 mb-2 relative z-10">Total Students</h3>
                              <p className="text-6xl font-black relative z-10">{currentDept?.students || 0}</p>
                              <p className="text-sm text-church-400 mt-4 font-medium relative z-10">Academic Session 2025</p>
                          </div>
                          
                          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Browse Departments</h4>
                              <div className="grid grid-cols-1 gap-1.5">
                                  {departments.map(d => (
                                      <Link key={d.id} to={`/sundayschool/${d.id}`} className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${d.id === currentDept?.id ? 'bg-church-50 text-church-700 shadow-sm border border-church-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
                                          {d.name}
                                          <ChevronRight size={14} className={`transition-transform ${d.id === currentDept?.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                                      </Link>
                                  ))}
                              </div>
                          </div>

                          {isAdmin && (
                              <div className="space-y-2">
                                  <button onClick={handleClearZirtirtuteExceptPuitling} disabled={isSeeding} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-orange-50 text-orange-700 border border-orange-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition shadow-sm">
                                      <Trash size={16} /> Clear Zirtirtute (Excl. Puitling)
                                  </button>
                                  <button onClick={handleSeedSyllabus} disabled={isSeeding} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-church-50 text-church-700 border border-church-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-church-100 transition shadow-sm">
                                      <Database size={16} /> {isSeeding ? 'Seeding...' : 'Seed Syllabus to Firestore'}
                                  </button>
                                  <button onClick={handleSeed} disabled={isSeeding} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-50 text-red-700 border border-red-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition shadow-sm">
                                      <Database size={16} /> {isSeeding ? 'Resetting...' : 'Factory Reset Firebase'}
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              ) : (
                  /* WEEKLY REPORT VIEW (Collective with Naupang/Puitling Breakdown) */
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                          <div className="flex items-center gap-4">
                              <img 
                                  src="https://firebasestorage.googleapis.com/v0/b/bethelpci.firebasestorage.app/o/committee_logos%2F1775482969296_mss.jpg?alt=media&token=6a190ac6-0db1-4ca8-bd0e-2a0c4474fa38" 
                                  alt="Sunday School Logo" 
                                  className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-200"
                                  referrerPolicy="no-referrer"
                              />
                              <div>
                                  <h3 className="text-2xl font-serif font-black text-slate-800">Weekly Reports</h3>
                                  <p className="text-slate-500 font-medium">Naupang & Puitling Department Summaries</p>
                              </div>
                          </div>
                          {isAdmin && (
                              <div className="flex flex-wrap items-center gap-3">
                                  {reports.length > 0 && (
                                      <button 
                                          onClick={handleSyncAllReports} 
                                          className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition shadow-sm"
                                          title="Sync all saved reports to Latest News / Announcements"
                                      >
                                          <Radio size={14} className="text-church-600"/> Sync to Latest News
                                      </button>
                                  )}
                                  <button onClick={handleAddReport} className="flex items-center gap-2 px-6 py-3 bg-church-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-church-700 transition shadow-lg shadow-church-100 scale-100 active:scale-95">
                                      <Plus size={18}/> New Weekly Entry
                                  </button>
                              </div>
                          )}
                      </div>

                      {loadingReports ? (
                          <div className="py-24 text-center"><Loader className="animate-spin mx-auto text-church-500" size={40} /></div>
                      ) : reports.length === 0 ? (
                          <div className="bg-white py-24 rounded-[3rem] text-center border border-dashed border-slate-200 shadow-sm">
                              <BookOpen className="mx-auto text-slate-200 mb-6" size={64} />
                              <h4 className="text-xl font-bold text-slate-400">No Reports Found</h4>
                              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Weekly collective records haven't been entered yet.</p>
                          </div>
                      ) : (
                          <div className="space-y-24">
                              {reports.map((report) => (
                                  <div key={report.id} className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden group">
                                      <div className="bg-slate-900 text-white px-6 py-6 md:px-12 md:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800">
                                          <div className="flex items-center gap-4 md:gap-6">
                                              <div className="bg-church-600 p-3 md:p-4 rounded-2xl shadow-lg ring-4 ring-church-600/20">
                                                <Calendar size={24} className="text-white md:w-7 md:h-7" />
                                              </div>
                                              <div>
                                                <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400 mb-1">Kohhran Service Report</p>
                                                <span className="font-serif font-black text-xl md:text-3xl tracking-tight">
                                                    {(() => {
                                                        const d = report.date ? parseLocalDate(report.date) : new Date();
                                                        return `${getMizoDayName(d)}, ${d.getDate()} ${d.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
                                                    })()}
                                                </span>
                                              </div>
                                          </div>
                                          {isAdmin && (
                                              <div className="flex gap-2 self-end sm:self-auto">
                                                  <button onClick={() => { setEditingReport(report); setIsReportModalOpen(true); }} className="p-3 md:p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition text-slate-300 hover:text-white border border-white/10" title="Edit"><Edit size={18}/></button>
                                                  <button onClick={() => handleDeleteReport(report.id!)} className="p-3 md:p-4 bg-red-500/10 hover:bg-red-500/30 rounded-2xl transition text-red-400 hover:text-red-300 border border-red-500/10" title="Delete"><Trash size={18}/></button>
                                              </div>
                                          )}
                                      </div>
                                      
                                       <div className="p-4 md:p-12 space-y-8 md:space-y-12 bg-white">
                                          {/* Puitling Section - High Contrast Slate */}
                                          <div className="overflow-hidden rounded-3xl border-2 border-slate-200 shadow-sm">
                                              <div className="bg-slate-800 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
                                                  <div className="flex items-center gap-2 md:gap-3">
                                                    <Users className="text-slate-400" size={18} />
                                                    <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-white">Puitling Sunday School Report</h4>
                                                  </div>
                                                  <span className="bg-slate-700/50 text-slate-300 text-[8px] md:text-[10px] px-2 py-1 rounded-full font-bold uppercase border border-slate-600 hidden sm:inline-block">Department</span>
                                              </div>
                                              <ReportTable segment={report.puitling} theme="slate" />
                                          </div>

                                          {/* Naupang Section - High Contrast Emerald */}
                                          <div className="overflow-hidden rounded-3xl border-2 border-emerald-100 shadow-sm">
                                              <div className="bg-emerald-800 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
                                                  <div className="flex items-center gap-2 md:gap-3">
                                                    <Sparkles className="text-emerald-400" size={18} />
                                                    <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-white">Naupang Sunday School Report</h4>
                                                  </div>
                                                  <span className="bg-emerald-700/50 text-emerald-100 text-[8px] md:text-[10px] px-2 py-1 rounded-full font-bold uppercase border border-emerald-600 hidden sm:inline-block">Department</span>
                                              </div>
                                              <ReportTable segment={report.naupang} theme="emerald" />
                                          </div>

                                          {/* Grand Summary Section - High Contrast Gradient */}
                                          <div className="mt-8 md:mt-12 bg-gradient-to-br from-church-900 to-slate-900 rounded-[2.5rem] p-6 md:p-14 shadow-2xl relative overflow-hidden group">
                                              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-125"></div>
                                              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                                                  <div className="flex items-center gap-6">
                                                      <div className="p-5 bg-church-600 rounded-[2rem] text-white shadow-2xl ring-8 ring-white/5">
                                                          <TrendingUp size={40} />
                                                      </div>
                                                      <div>
                                                          <h4 className="text-xs font-black text-church-400 uppercase tracking-[0.4em] mb-2">Grand Total Summary</h4>
                                                          <p className="text-white text-3xl md:text-4xl font-serif font-black tracking-tight">Kohhran Pum Record</p>
                                                      </div>
                                                  </div>
                                                  
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-8 md:gap-16">
                                                      <div className="bg-white/5 backdrop-blur-md p-5 md:p-6 rounded-3xl border border-white/10">
                                                          <p className="text-[9px] md:text-[10px] font-black text-church-300 uppercase tracking-widest mb-2">Collective Attendance</p>
                                                          <p className="text-3xl md:text-5xl font-black text-white">{
                                                              (report.naupang.zirtirtu.kal + report.naupang.zirtu.kal + (report.naupang.chhimtu || 0)) + 
                                                              (report.puitling.zirtirtu.kal + report.puitling.zirtu.kal + (report.puitling.chhimtu || 0))
                                                          }</p>
                                                          <div className="h-1.5 w-12 bg-church-500 mt-4 rounded-full"></div>
                                                      </div>
                                                      <div className="bg-white/5 backdrop-blur-md p-5 md:p-6 rounded-3xl border border-white/10">
                                                          <p className="text-[9px] md:text-[10px] font-black text-church-300 uppercase tracking-widest mb-2">Total Thawhlawm</p>
                                                          <p className="text-3xl md:text-5xl font-black font-mono text-church-400">₹ {
                                                              (report.naupang.thawhlawm + report.puitling.thawhlawm).toLocaleString()
                                                          }</p>
                                                          <div className="h-1.5 w-12 bg-church-400 mt-4 rounded-full"></div>
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}
          </div>

          {/* Department Metadata Edit Modal */}
          {isEditModalOpen && editingDept && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in zoom-in-95">
                      <div className="p-8 border-b flex justify-between items-center bg-church-50">
                          <h3 className="text-xl font-black text-church-900 uppercase tracking-widest">Edit Department Info</h3>
                          <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400"><X size={24}/></button>
                      </div>
                      <div className="p-8 space-y-5 overflow-y-auto max-h-[70vh]">
                          {/* Leadership Fields Removed */}
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Age Group / Class</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.ageGroup || ''} onChange={e => setEditingDept({...editingDept, ageGroup: e.target.value})} /></div>
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Room Awmna</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.room || ''} onChange={e => setEditingDept({...editingDept, room: e.target.value})} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inkhawm Tan Hun</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.time || ''} onChange={e => setEditingDept({...editingDept, time: e.target.value})} /></div>
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Students Registered</label><input type="number" className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.students || 0} onChange={e => setEditingDept({...editingDept, students: parseInt(e.target.value) || 0})} /></div>
                           </div>
                           <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zirlai Hming</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.lessonName || ''} onChange={e => setEditingDept({...editingDept, lessonName: e.target.value})} /></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zirlai No.</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.lessonNumber || ''} onChange={e => setEditingDept({...editingDept, lessonNumber: e.target.value})} /></div>
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label><input type="date" className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.lessonDate || ''} onChange={e => setEditingDept({...editingDept, lessonDate: e.target.value})} /></div>
                          </div>
                          {departmentId === 'puitling' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bible Chang</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.bibleVerse || ''} onChange={e => setEditingDept({...editingDept, bibleVerse: e.target.value})} /></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thuvawn</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.memoryVerse || ''} onChange={e => setEditingDept({...editingDept, memoryVerse: e.target.value})} /></div>
                            </div>
                          )}
                          <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hriattirna</label>
                              <Suspense fallback={<div>Loading editor...</div>}>
                                <ReactQuill 
                                  theme="snow" 
                                  value={editingDept.announcements || ''} 
                                  onChange={val => setEditingDept(prev => prev ? ({ ...prev, announcements: val }) : null)} 
                                  modules={quillModules}
                                  formats={quillFormats}
                                  className="bg-white rounded-xl" 
                                />
                              </Suspense>
                          </div>
                          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</label><textarea className="w-full border border-slate-200 p-3 rounded-xl h-24 focus:ring-2 focus:ring-church-500 outline-none resize-none" value={editingDept.description || ''} onChange={e => setEditingDept({...editingDept, description: e.target.value})} /></div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zirtirtute (comma separated)</label>
                            <textarea className="w-full border border-slate-200 p-3 rounded-xl h-32 focus:ring-2 focus:ring-church-500 outline-none font-sans text-sm" value={editingDept.zirtirtute?.join(', ') || ''} onChange={e => setEditingDept({...editingDept, zirtirtute: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} placeholder="Hruaitluanga, Lalnunmawii, etc." />
                          </div>
                      </div>
                      <div className="p-8 border-t bg-slate-50 flex justify-end gap-3">
                          <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-white transition">Cancel</button>
                          <button onClick={handleSaveDept} className="px-8 py-3 bg-church-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-church-700 transition flex items-center gap-2"><Save size={16}/> Save Changes</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Zirtirtu Profile View Modal Removed */}

          {/* Zirtirtu Edit Modal */}
          {isZirtirtuEditModalOpen && (
              <StaffEditModal
                  staff={zirtirtuProfile || { name: selectedZirtirtuName!, role: 'Zirtirtu' }}
                  onClose={() => setIsZirtirtuEditModalOpen(false)}
                  onSave={handleSaveZirtirtuProfile}
                  onDelete={handleDeleteZirtirtuProfile}
                  isLoading={isSaving}
                  showDeleteConfirm={showDeleteConfirm}
                  setShowDeleteConfirm={setShowDeleteConfirm}
                  collectionName={'ss_teachers' as any} 
              />
          )}

          {/* Weekly Report Entry Modal - Categorized */}
          {isReportModalOpen && editingReport && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="p-8 border-b bg-church-50 flex justify-between items-center">
                          <div>
                              <h3 className="text-2xl font-serif font-black text-church-900 leading-tight">{editingReport.id ? 'Edit Report' : 'New Weekly Entry'}</h3>
                              <p className="text-slate-500 text-sm font-medium">Sunday School Breakdown Report</p>
                          </div>
                          <button onClick={() => setIsReportModalOpen(false)} className="p-2.5 hover:bg-white rounded-full transition text-slate-400"><X size={24}/></button>
                      </div>
                      
                      <div className="p-8 overflow-y-auto space-y-12 max-h-[70vh] bg-slate-50/50">
                          <div className="max-w-xs mx-auto text-center">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Sunday's Date</label>
                              <div className="relative">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-church-500" size={18} />
                                  <input 
                                      type="date" 
                                      className="w-full border border-slate-200 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition bg-white shadow-sm"
                                      value={editingReport.date}
                                      onChange={e => setEditingReport({...editingReport, date: e.target.value})}
                                  />
                              </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-12">
                              <div className="space-y-6">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Puitling Report</h4>
                                  </div>
                                  <ReportEntrySection segment={editingReport.puitling!} onChange={(s) => setEditingReport({...editingReport, puitling: s})} theme="slate" />
                              </div>

                              <div className="space-y-6">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Naupang Report</h4>
                                  </div>
                                  <ReportEntrySection segment={editingReport.naupang!} onChange={(s) => setEditingReport({...editingReport, naupang: s})} theme="emerald" />
                              </div>
                          </div>

                          <div className="p-8 bg-church-900 text-white rounded-[2rem] flex justify-between items-center shadow-2xl">
                              <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-church-300 uppercase tracking-widest mb-1">Collective Grand Total</span>
                                  <span className="text-4xl font-black font-mono">₹ {
                                      ((editingReport.naupang?.thawhlawm || 0) + (editingReport.puitling?.thawhlawm || 0)).toLocaleString()
                                  }</span>
                              </div>
                              <div className="text-right">
                                  <span className="text-[10px] font-black text-church-300 uppercase tracking-widest mb-1">Total Attendance</span>
                                  <p className="text-3xl font-black">{
                                      (
                                          (editingReport.naupang?.zirtirtu.kal || 0) + (editingReport.naupang?.zirtu.kal || 0) + (editingReport.naupang?.chhimtu || 0) +
                                          (editingReport.puitling?.zirtirtu.kal || 0) + (editingReport.puitling?.zirtu.kal || 0) + (editingReport.puitling?.chhimtu || 0)
                                      )
                                  }</p>
                              </div>
                          </div>
                      </div>

                      <div className="p-8 bg-slate-50 border-t flex justify-end gap-3">
                          <button onClick={() => setIsReportModalOpen(false)} className="px-6 py-3 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-white transition">Cancel</button>
                          <button onClick={handleSaveReport} className="px-8 py-3 bg-church-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-church-700 flex items-center transition">
                             <Save size={18} className="mr-2" /> Finalize Report
                          </button>
                      </div>
                  </div>
              </div>
          )}
          {/* Section Modal */}
          {isSectionModalOpen && editingSection && (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b flex justify-between items-center bg-church-50">
                  <h3 className="text-xl font-black text-church-900 uppercase tracking-widest">{editingSection.id ? 'Edit Pawl' : 'Add New Pawl'}</h3>
                  <button onClick={() => setIsSectionModalOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pawl Name (e.g. Section A)</label>
                    <input 
                      className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none font-bold" 
                      value={editingSection.name} 
                      onChange={e => setEditingSection({...editingSection, name: e.target.value})}
                      placeholder="Enter section name"
                    />
                  </div>
                </div>
                <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                  <button onClick={() => setIsSectionModalOpen(false)} className="px-6 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-white transition">Cancel</button>
                  <button 
                    disabled={isSaving || !editingSection.name} 
                    onClick={handleSaveSection} 
                    className="px-6 py-2 bg-church-600 text-white rounded-xl font-bold hover:bg-church-700 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader className="animate-spin" size={16}/> : <Save size={16}/>} Save Section
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Member Modal */}
          {isMemberModalOpen && editingMember && (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b flex justify-between items-center bg-church-50">
                  <h3 className="text-xl font-black text-church-900 uppercase tracking-widest">{editingMember.id ? 'Edit Member' : 'Add New Member'}</h3>
                  <button onClick={() => setIsMemberModalOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Name</label>
                    <input 
                      className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none font-bold" 
                      value={editingMember.name} 
                      onChange={e => setEditingMember({...editingMember, name: e.target.value})}
                      placeholder="Enter full name"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                  <button onClick={() => setIsMemberModalOpen(false)} className="px-6 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-white transition">Cancel</button>
                  <button 
                    disabled={isSaving || !editingMember.name} 
                    onClick={handleSaveMember} 
                    className="px-6 py-2 bg-church-600 text-white rounded-xl font-bold hover:bg-church-700 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader className="animate-spin" size={16}/> : <Save size={16}/>} Save Member
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
  );
};

// Reusable Sub-components
const ReportTable: React.FC<{ segment: SSReportSegment; theme: string }> = ({ segment, theme }) => {
    const isEmerald = theme === 'emerald';
    const textTheme = isEmerald ? 'text-emerald-950' : 'text-slate-950';
    const accentBg = isEmerald ? 'bg-emerald-50' : 'bg-slate-50';
    const totalBg = isEmerald ? 'bg-emerald-100/50' : 'bg-slate-100/50';

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[300px]">
                <thead>
                    <tr className="bg-slate-900 text-white text-[10px] md:text-xs font-black uppercase tracking-wider border-b border-slate-800">
                        <th className="px-4 md:px-8 py-3.5 md:py-4 text-white font-black">Hming / Role</th>
                        <th className="px-2 md:px-8 py-3.5 md:py-4 text-center text-white font-black">Kal</th>
                        <th className="px-2 md:px-8 py-3.5 md:py-4 text-center text-white font-black">Kal lo</th>
                        <th className="px-2 md:px-8 py-3.5 md:py-4 text-center text-white font-black">Total</th>
                        <th className="px-2 md:px-8 py-3.5 md:py-4 text-right text-white font-black"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className={`px-4 md:px-8 py-4 md:py-6 text-xs md:text-base font-bold ${textTheme}`}>Zirtirtu</td>
                        <td className={`px-2 md:px-8 py-4 md:py-6 text-center text-lg md:text-xl font-black ${textTheme}`}>{segment.zirtirtu.kal}</td>
                        <td className="px-2 md:px-8 py-4 md:py-6 text-center text-sm md:text-base text-slate-400 font-bold">{segment.zirtirtu.kallo}</td>
                        <td className="px-2 md:px-8 py-4 md:py-6 text-center text-lg md:text-xl font-black text-slate-600">{segment.zirtirtu.kal + segment.zirtirtu.kallo}</td>
                        <td className="px-2 md:px-8 py-4 md:py-6"></td>
                    </tr>
                    <tr className={`${accentBg} hover:bg-slate-100/30 transition-colors`}>
                        <td className={`px-4 md:px-8 py-4 md:py-6 text-xs md:text-base font-bold ${textTheme}`}>Zirtu</td>
                        <td className={`px-2 md:px-8 py-4 md:py-6 text-center text-lg md:text-xl font-black ${textTheme}`}>{segment.zirtu.kal}</td>
                        <td className="px-2 md:px-8 py-4 md:py-6 text-center text-sm md:text-base text-slate-400 font-bold">{segment.zirtu.kallo}</td>
                        <td className="px-2 md:px-8 py-4 md:py-6 text-center text-lg md:text-xl font-black text-slate-600">{segment.zirtu.kal + segment.zirtu.kallo}</td>
                        <td className="px-2 md:px-8 py-4 md:py-6"></td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className={`px-4 md:px-8 py-4 md:py-6 text-xs md:text-base font-bold ${textTheme}`}>Chhimtu</td>
                        <td className={`px-2 md:px-8 py-4 md:py-6 text-center text-lg md:text-xl font-black ${textTheme}`}>{segment.chhimtu || 0}</td>
                        <td className="px-2 md:px-8 py-4 md:py-6 text-center text-sm md:text-base text-slate-400 font-bold">-</td>
                        <td className="px-2 md:px-8 py-4 md:py-6 text-center text-lg md:text-xl font-black text-slate-600">{segment.chhimtu || 0}</td>
                        <td className="px-2 md:px-8 py-4 md:py-6"></td>
                    </tr>
                    <tr className={`${totalBg} font-black border-t-2 border-slate-200`}>
                        <td className={`px-4 md:px-8 py-6 md:py-8 text-[9px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.3em] ${textTheme}`}>Total</td>
                        <td className={`px-2 md:px-8 py-6 md:py-8 text-center text-xl md:text-3xl ${textTheme} tracking-tight`}>{(segment.zirtirtu.kal + segment.zirtu.kal + (segment.chhimtu || 0))}</td>
                        <td className="px-2 md:px-8 py-6 md:py-8 text-center text-sm md:text-base text-slate-400 font-bold">{segment.zirtirtu.kallo + segment.zirtu.kallo}</td>
                        <td className={`px-2 md:px-8 py-6 md:py-8 text-center text-xl md:text-3xl ${textTheme} tracking-tight`}>{(segment.zirtirtu.kal + segment.zirtu.kal + (segment.chhimtu || 0)) + (segment.zirtirtu.kallo + segment.zirtu.kallo)}</td>
                        <td className={`px-4 md:px-8 py-6 md:py-8 text-right ${textTheme}`}>
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] text-slate-400 mb-1 font-black">Thawhlawm</span>
                                <span className="font-mono text-lg md:text-3xl font-black tracking-tighter">₹ {segment.thawhlawm.toLocaleString()}</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const ReportEntrySection: React.FC<{ 
    segment: SSReportSegment; 
    onChange: (s: SSReportSegment) => void; 
    theme: 'emerald' | 'slate' 
}> = ({ segment, onChange, theme }) => {
    const isEmerald = theme === 'emerald';
    const bgClass = isEmerald ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-200';
    const labelClass = isEmerald ? 'text-emerald-700' : 'text-slate-800';
    const inputClass = isEmerald ? 'border-emerald-200 focus:ring-emerald-500' : 'border-slate-300 focus:ring-slate-500';

    const update = (role: 'zirtirtu' | 'zirtu', field: string, value: number) => {
        const updated = JSON.parse(JSON.stringify(segment));
        updated[role][field] = value;
        onChange(updated);
    };

    const updateThawhlawm = (value: number) => {
        onChange({ ...segment, thawhlawm: value });
    };

    const updateChhimtu = (value: number) => {
        onChange({ ...segment, chhimtu: value });
    };

    return (
        <div className="space-y-6">
            <div className={`p-6 rounded-3xl border shadow-sm ${bgClass}`}>
                <h5 className={`text-[10px] font-black uppercase tracking-widest mb-4 border-b pb-2 ${labelClass}`}>Zirtirtu</h5>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Kal Zat</label>
                        <input type="number" className={`w-full border rounded-xl p-3 font-black text-lg ${inputClass}`} value={segment.zirtirtu.kal} onChange={e => update('zirtirtu', 'kal', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Kal lo Zat</label>
                        <input type="number" className={`w-full border rounded-xl p-3 font-black text-lg ${inputClass}`} value={segment.zirtirtu.kallo} onChange={e => update('zirtirtu', 'kallo', parseInt(e.target.value) || 0)} />
                    </div>
                </div>
            </div>
            <div className={`p-6 rounded-3xl border shadow-sm ${bgClass}`}>
                <h5 className={`text-[10px] font-black uppercase tracking-widest mb-4 border-b pb-2 ${labelClass}`}>Zirtu (Students)</h5>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Kal Zat</label>
                        <input type="number" className={`w-full border rounded-xl p-3 font-black text-lg ${inputClass}`} value={segment.zirtu.kal} onChange={e => update('zirtu', 'kal', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Kal lo Zat</label>
                        <input type="number" className={`w-full border rounded-xl p-3 font-black text-lg ${inputClass}`} value={segment.zirtu.kallo} onChange={e => update('zirtu', 'kallo', parseInt(e.target.value) || 0)} />
                    </div>
                </div>
            </div>
            <div className={`p-6 rounded-3xl border shadow-sm ${bgClass}`}>
                <h5 className={`text-[10px] font-black uppercase tracking-widest mb-4 border-b pb-2 ${labelClass}`}>Chhimtu (Guest)</h5>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Kal Zat</label>
                    <input type="number" className={`w-full border rounded-xl p-3 font-black text-lg ${inputClass}`} value={segment.chhimtu || 0} onChange={e => updateChhimtu(parseInt(e.target.value) || 0)} />
                </div>
            </div>
            <div className={`p-8 rounded-3xl border shadow-lg bg-white ${isEmerald ? 'border-emerald-200' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${isEmerald ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        <Wallet size={20} />
                    </div>
                    <h5 className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Department Thawhlawm</h5>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-tighter">Amount (₹)</label>
                    <input 
                        type="number" 
                        className={`w-full border rounded-2xl p-4 font-black font-mono text-2xl ${inputClass} focus:ring-4 focus:ring-opacity-20 transition-all`} 
                        value={segment.thawhlawm} 
                        onChange={e => updateThawhlawm(parseFloat(e.target.value) || 0)} 
                        placeholder="0"
                    />
                </div>
            </div>
        </div>
    );
};

export default SundaySchool;
