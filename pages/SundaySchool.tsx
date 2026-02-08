
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { SundaySchoolDepartment, SSWeeklyReport, SSReportSegment } from '../types';
import { 
  Users, UserCheck, Edit, Save, X, Loader, Database, 
  FileUp, ClipboardList, Calendar, Info, Plus, Trash, 
  ChevronRight, TrendingUp, Sparkles, BookOpen, Wallet
} from 'lucide-react';
import * as XLSX from 'xlsx';

const INITIAL_DEPARTMENTS_DATA: Omit<SundaySchoolDepartment, 'name'>[] = [
    { id: 'pre-beginner', leader: '', asstLeader: '', secretary: '', asstSecretary: '', teachers: [], description: '', students: 0 },
    { id: 'beginner', leader: '', asstLeader: '', secretary: '', asstSecretary: '', teachers: [], description: '', students: 0 },
    { id: 'primary', leader: '', asstLeader: '', secretary: '', asstSecretary: '', teachers: [], description: '', students: 0 },
    { id: 'junior', leader: '', asstLeader: '', secretary: '', asstSecretary: '', teachers: [], description: '', students: 0 },
    { id: 'intermediate', leader: '', asstLeader: '', secretary: '', asstSecretary: '', teachers: [], description: '', students: 0 },
    { id: 'sacrament', leader: '', asstLeader: '', secretary: '', asstSecretary: '', teachers: [], description: '', students: 0 },
    { id: 'senior', leader: '', asstLeader: '', secretary: '', asstSecretary: '', teachers: [], description: '', students: 0 },
    { id: 'puitling', leader: '', asstLeader: '', secretary: '', asstSecretary: '', teachers: [], description: '', students: 0 }
];

const EMPTY_SEGMENT: SSReportSegment = {
    zirtirtu: { kal: 0, kallo: 0 },
    zirtu: { kal: 0, kallo: 0 },
    thawhlawm: 0
};

const SundaySchool: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  
  const [departments, setDepartments] = useState<SundaySchoolDepartment[]>([]);
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
  
  const importInputRef = useRef<HTMLInputElement>(null);

  const getDeptName = useCallback((id: string) => {
      // @ts-ignore
      return t.sundaySchool[id] || id.charAt(0).toUpperCase() + id.slice(1);
  }, [t]);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
        const mappedData = INITIAL_DEPARTMENTS_DATA.map(d => ({ ...d, name: getDeptName(d.id) }));
        setDepartments(mappedData as SundaySchoolDepartment[]);
        setLoading(false);
        return;
    }

    try {
        const snapshot = await db.collection('sundaySchoolDepartments').get();
        if (!snapshot.empty) {
            const fetchedData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as SundaySchoolDepartment[];
            const merged = INITIAL_DEPARTMENTS_DATA.map(init => {
                const found = fetchedData.find(f => f.id === init.id);
                return found || { ...init, name: getDeptName(init.id) };
            });
            setDepartments(merged as SundaySchoolDepartment[]);
        } else {
            const mappedData = INITIAL_DEPARTMENTS_DATA.map(d => ({ ...d, name: getDeptName(d.id) }));
            setDepartments(mappedData as SundaySchoolDepartment[]);
        }
    } catch (e) {
        console.error("Error fetching departments:", e);
        const mappedData = INITIAL_DEPARTMENTS_DATA.map(d => ({ ...d, name: getDeptName(d.id) }));
        setDepartments(mappedData as SundaySchoolDepartment[]);
    }
    setLoading(false);
  }, [getDeptName]);

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
        if (error.message?.includes('permissions')) {
            console.error("DEBUG: Firebase Permission Denied on fetch. Check rules for collection 'sundaySchoolWeeklyReports'.");
        }
    }
    setLoadingReports(false);
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
      if (departmentId === 'report') {
          fetchReports();
      }
  }, [departmentId, fetchReports]);

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

  const handleSaveDept = async () => {
      if (!db || !db.collection || !editingDept || !editingDept.id) return;
      try {
          await db.collection('sundaySchoolDepartments').doc(editingDept.id).set(editingDept, { merge: true });
          setIsEditModalOpen(false);
          fetchDepartments();
      } catch (e: any) {
          console.error("Save Error:", e);
          alert(`Failed to save: ${e.message || 'Unknown error'}`);
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
          
          await docRef.set(editingReport, { merge: true });
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
          fetchReports();
      } catch (error) {
          console.error(error);
          alert("Failed to delete report.");
      }
  };

  const handleImportTeachers = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const normalizedId = departmentId?.toLowerCase();
      const currentDept = departments.find(d => d.id === normalizedId) || departments[0];

      if (!file || !currentDept) return;

      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          const importedTeachers: string[] = [];
          
          jsonData.forEach((row: any[]) => {
              if (row.length > 0) {
                  const val = String(row[0]).trim();
                  if (val && !['name', 'teacher', 'teachers', 'hming', 'zirtirtu'].includes(val.toLowerCase())) {
                      importedTeachers.push(val);
                  }
              }
          });

          if (importedTeachers.length === 0) {
              alert("No valid names found in the first column.");
              return;
          }

          if (window.confirm(`Found ${importedTeachers.length} names. This will REPLACE the existing teacher list for ${currentDept.name}. Proceed?`)) {
              if (db && db.collection) {
                  await db.collection('sundaySchoolDepartments').doc(currentDept.id).update({ teachers: importedTeachers });
                  alert("Teachers imported successfully!");
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
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-church-500"/></div>;
  
  const isReportView = departmentId === 'report';
  const normalizedId = departmentId?.toLowerCase();
  const currentDept = departments.find(d => d.id === normalizedId);

  // If not report view and no department found, show error or redirect
  if (!isReportView && !currentDept) return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <p className="text-slate-500 mb-4">Department not found.</p>
            <Link to="/" className="text-church-600 font-bold underline">Back to Home</Link>
        </div>
    </div>
  );

  const isPuitling = currentDept?.id === 'puitling';
  const leaderLabel = isPuitling ? 'Superintendent' : 'Leader';
  const asstLeaderLabel = isPuitling ? 'Asst. Superintendent' : 'Asst. Leader';

  return (
      <div className="py-12 bg-slate-50 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                  <Link to="/" className="text-sm font-bold text-slate-500 hover:text-church-600 mb-4 inline-block">&larr; Back to Home</Link>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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

              {!isReportView ? (
                  /* DEPARTMENT INFO VIEW */
                  <div className="grid md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="md:col-span-2 space-y-6">
                          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Users className="text-church-600"/> Leadership</h3>
                                  {isAdmin && currentDept && (
                                      <button onClick={() => { setEditingDept(currentDept); setIsEditModalOpen(true); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-church-600 hover:bg-church-50 rounded-xl transition shadow-sm border border-slate-100">
                                          <Edit size={18} />
                                      </button>
                                  )}
                              </div>
                              <div className="grid sm:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                      <div>
                                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{leaderLabel}</span>
                                          <span className="font-bold text-slate-800 text-lg">{currentDept?.leader || 'Not Assigned'}</span>
                                      </div>
                                      <div>
                                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{asstLeaderLabel}</span>
                                          <span className="font-bold text-slate-800 text-lg">{currentDept?.asstLeader || 'Not Assigned'}</span>
                                      </div>
                                  </div>
                                  <div className="space-y-4">
                                      <div>
                                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Secretary</span>
                                          <span className="font-bold text-slate-800 text-lg">{currentDept?.secretary || 'Not Assigned'}</span>
                                      </div>
                                      <div>
                                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asst. Secretary</span>
                                          <span className="font-bold text-slate-800 text-lg">{currentDept?.asstSecretary || 'Not Assigned'}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><UserCheck className="text-church-600"/> Zirtirtute ({currentDept?.teachers.length || 0})</h3>
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => importInputRef.current?.click()} 
                                            className="p-2 bg-green-50 text-green-700 rounded-xl border border-green-200 hover:bg-green-100 shadow-sm transition" 
                                            title="Import Teachers"
                                        >
                                            <FileUp size={18} />
                                        </button>
                                        <input type="file" ref={importInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImportTeachers} />
                                    </div>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {currentDept && currentDept.teachers.length > 0 ? (
                                      currentDept.teachers.map((t, i) => (
                                          <div key={i} className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-church-200 transition-colors">
                                              <div className="w-8 h-8 bg-white text-church-600 rounded-lg flex items-center justify-center font-black text-xs mr-3 shadow-sm border border-slate-100 group-hover:bg-church-600 group-hover:text-white transition-colors">{i+1}</div>
                                              <span className="font-bold text-slate-700">{t}</span>
                                          </div>
                                      ))
                                  ) : (
                                      <div className="text-slate-400 italic text-sm col-span-2 py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">No teachers listed in database.</div>
                                  )}
                              </div>
                          </div>
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
                              <button onClick={handleSeed} disabled={isSeeding} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-50 text-red-700 border border-red-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition shadow-sm">
                                  <Database size={16} /> {isSeeding ? 'Resetting...' : 'Factory Reset Firebase'}
                              </button>
                          )}
                      </div>
                  </div>
              ) : (
                  /* WEEKLY REPORT VIEW (Collective with Naupang/Puitling Breakdown) */
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                          <div className="flex items-center gap-4">
                              <div className="p-4 bg-church-50 rounded-2xl text-church-600 shadow-inner">
                                  <ClipboardList size={32} />
                              </div>
                              <div>
                                  <h3 className="text-2xl font-serif font-black text-slate-800">Weekly Reports</h3>
                                  <p className="text-slate-500 font-medium">Naupang & Puitling Department Summaries</p>
                              </div>
                          </div>
                          {isAdmin && (
                              <button onClick={handleAddReport} className="flex items-center gap-2 px-6 py-3 bg-church-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-church-700 transition shadow-lg shadow-church-100 scale-100 active:scale-95">
                                  <Plus size={18}/> New Weekly Entry
                              </button>
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
                          <div className="space-y-16">
                              {reports.map((report) => (
                                  <div key={report.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden group">
                                      <div className="bg-slate-900 text-white px-10 py-6 flex justify-between items-center border-b border-slate-800">
                                          <div className="flex items-center gap-5">
                                              <div className="bg-church-500 p-3 rounded-xl shadow-lg ring-4 ring-church-500/20">
                                                <Calendar size={22} className="text-white" />
                                              </div>
                                              <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Sunday Service Report</p>
                                                <span className="font-serif font-black text-xl md:text-2xl">{new Date(report.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                              </div>
                                          </div>
                                          {isAdmin && (
                                              <div className="flex gap-2">
                                                  <button onClick={() => { setEditingReport(report); setIsReportModalOpen(true); }} className="p-3 bg-white/5 hover:bg-white/15 rounded-xl transition text-slate-400 hover:text-white border border-white/10" title="Edit"><Edit size={18}/></button>
                                                  <button onClick={() => handleDeleteReport(report.id!)} className="p-3 bg-red-500/10 hover:bg-red-500/30 rounded-xl transition text-red-400 hover:text-red-300 border border-red-500/10" title="Delete"><Trash size={18}/></button>
                                              </div>
                                          )}
                                      </div>
                                      
                                      <div className="p-2 md:p-8 space-y-10">
                                          {/* Naupang Section */}
                                          <div className="overflow-hidden rounded-2xl border border-green-100 bg-green-50/20">
                                              <div className="bg-green-100/50 px-6 py-3 border-b border-green-100 flex items-center gap-2">
                                                  <Sparkles className="text-green-600" size={16} />
                                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-green-700">Naupang Department Report</h4>
                                              </div>
                                              <ReportTable segment={report.naupang} theme="green" />
                                          </div>

                                          {/* Puitling Section */}
                                          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/20">
                                              <div className="bg-slate-100/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                                                  <Users className="text-slate-600" size={16} />
                                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Puitling Department Report</h4>
                                              </div>
                                              <ReportTable segment={report.puitling} theme="slate" />
                                          </div>

                                          {/* Summary Section */}
                                          <div className="mt-8 bg-church-900 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                                              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                                              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                  <div className="flex items-center gap-5">
                                                      <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 text-white">
                                                          <TrendingUp size={32} />
                                                      </div>
                                                      <div>
                                                          <h4 className="text-[10px] font-black text-church-300 uppercase tracking-[0.3em] mb-1">Weekly Collective Summary</h4>
                                                          <p className="text-white text-2xl font-serif font-bold">Total Kohhran Report</p>
                                                      </div>
                                                  </div>
                                                  <div className="grid grid-cols-2 md:flex md:items-center gap-12 text-white">
                                                      <div className="text-right md:text-left">
                                                          <p className="text-[10px] font-black text-church-300 uppercase tracking-widest mb-1">Total Attendance</p>
                                                          <p className="text-4xl font-black">{
                                                              (report.naupang.zirtirtu.kal + report.naupang.zirtu.kal) + 
                                                              (report.puitling.zirtirtu.kal + report.puitling.zirtu.kal)
                                                          }</p>
                                                      </div>
                                                      <div className="text-right">
                                                          <p className="text-[10px] font-black text-church-300 uppercase tracking-widest mb-1">Total Offering</p>
                                                          <p className="text-4xl font-black font-mono text-church-100">₹ {
                                                              (report.naupang.thawhlawm + report.puitling.thawhlawm).toLocaleString()
                                                          }</p>
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
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{leaderLabel}</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.leader || ''} onChange={e => setEditingDept({...editingDept, leader: e.target.value})} /></div>
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{asstLeaderLabel}</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.asstLeader || ''} onChange={e => setEditingDept({...editingDept, asstLeader: e.target.value})} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Secretary</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.secretary || ''} onChange={e => setEditingDept({...editingDept, secretary: e.target.value})} /></div>
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asst. Secretary</label><input className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.asstSecretary || ''} onChange={e => setEditingDept({...editingDept, asstSecretary: e.target.value})} /></div>
                          </div>
                          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Students Registered</label><input type="number" className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" value={editingDept.students || 0} onChange={e => setEditingDept({...editingDept, students: parseInt(e.target.value) || 0})} /></div>
                          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</label><textarea className="w-full border border-slate-200 p-3 rounded-xl h-24 focus:ring-2 focus:ring-church-500 outline-none resize-none" value={editingDept.description || ''} onChange={e => setEditingDept({...editingDept, description: e.target.value})} /></div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teachers (comma separated)</label>
                            <textarea className="w-full border border-slate-200 p-3 rounded-xl h-32 focus:ring-2 focus:ring-church-500 outline-none font-sans text-sm" value={editingDept.teachers?.join(', ') || ''} onChange={e => setEditingDept({...editingDept, teachers: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} placeholder="Hruaitluanga, Lalnunmawii, etc." />
                          </div>
                      </div>
                      <div className="p-8 border-t bg-slate-50 flex justify-end gap-3">
                          <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-white transition">Cancel</button>
                          <button onClick={handleSaveDept} className="px-8 py-3 bg-church-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-church-700 transition flex items-center gap-2"><Save size={16}/> Save Changes</button>
                      </div>
                  </div>
              </div>
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
                              {/* Naupang Data Entry */}
                              <div className="space-y-6">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Naupang Report</h4>
                                  </div>
                                  <ReportEntrySection segment={editingReport.naupang!} onChange={(s) => setEditingReport({...editingReport, naupang: s})} theme="green" />
                              </div>

                              {/* Puitling Data Entry */}
                              <div className="space-y-6">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Puitling Report</h4>
                                  </div>
                                  <ReportEntrySection segment={editingReport.puitling!} onChange={(s) => setEditingReport({...editingReport, puitling: s})} theme="blue" />
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
                                          (editingReport.naupang?.zirtirtu.kal || 0) + (editingReport.naupang?.zirtu.kal || 0) +
                                          (editingReport.puitling?.zirtirtu.kal || 0) + (editingReport.puitling?.zirtu.kal || 0)
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
      </div>
  );
};

// Reusable Sub-components
const ReportTable: React.FC<{ segment: SSReportSegment; theme: string }> = ({ segment, theme }) => {
    const isGreen = theme === 'green';
    const textTheme = isGreen ? 'text-green-800' : 'text-slate-800';

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-white/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-6 py-3">Hming / Role</th>
                        <th className="px-6 py-3 text-center">Kal Zat</th>
                        <th className="px-6 py-3 text-center">Kal lo Zat</th>
                        <th className="px-6 py-3 text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    <tr className="hover:bg-white/40 transition-colors">
                        <td className={`px-6 py-4 font-bold ${textTheme}`}>Zirtirtu</td>
                        <td className="px-6 py-4 text-center text-slate-600 font-bold">{segment.zirtirtu.kal}</td>
                        <td className="px-6 py-4 text-center text-slate-400 font-medium">{segment.zirtirtu.kallo}</td>
                        <td className="px-6 py-4"></td>
                    </tr>
                    <tr className="hover:bg-white/40 transition-colors">
                        <td className={`px-6 py-4 font-bold ${textTheme}`}>Zirtu</td>
                        <td className="px-6 py-4 text-center text-slate-600 font-bold">{segment.zirtu.kal}</td>
                        <td className="px-6 py-4 text-center text-slate-400 font-medium">{segment.zirtu.kallo}</td>
                        <td className="px-6 py-4"></td>
                    </tr>
                    <tr className="bg-white/60 font-black border-t-2 border-slate-100">
                        <td className={`px-6 py-4 text-[10px] uppercase tracking-widest ${textTheme}`}>Total Attendance</td>
                        <td className={`px-6 py-4 text-center text-lg ${textTheme}`}>{segment.zirtirtu.kal + segment.zirtu.kal}</td>
                        <td className="px-6 py-4 text-center text-slate-400 font-bold">{segment.zirtirtu.kallo + segment.zirtu.kallo}</td>
                        <td className={`px-6 py-4 text-right font-mono text-xl ${textTheme}`}>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] uppercase tracking-widest text-slate-400 mb-1">Thawhlawm</span>
                                <span>₹ {segment.thawhlawm.toLocaleString()}</span>
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
    theme: 'green' | 'blue' 
}> = ({ segment, onChange, theme }) => {
    const isGreen = theme === 'green';
    const bgClass = isGreen ? 'bg-green-50/50 border-green-100' : 'bg-blue-50/50 border-blue-100';
    const labelClass = isGreen ? 'text-green-600' : 'text-blue-600';
    const inputClass = isGreen ? 'border-green-200' : 'border-blue-200';

    const update = (role: 'zirtirtu' | 'zirtu', field: string, value: number) => {
        const updated = JSON.parse(JSON.stringify(segment));
        updated[role][field] = value;
        onChange(updated);
    };

    const updateThawhlawm = (value: number) => {
        onChange({ ...segment, thawhlawm: value });
    };

    return (
        <div className="space-y-6">
            {/* Zirtirtu */}
            <div className={`p-6 rounded-2xl border ${bgClass}`}>
                <h5 className={`text-[10px] font-black uppercase tracking-widest mb-4 border-b pb-2 ${labelClass}`}>Zirtirtu (Teachers)</h5>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Kal Zat</label>
                        <input type="number" className={`w-full border rounded-xl p-2 font-bold ${inputClass}`} value={segment.zirtirtu.kal} onChange={e => update('zirtirtu', 'kal', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Kal lo Zat</label>
                        <input type="number" className={`w-full border rounded-xl p-2 font-bold ${inputClass}`} value={segment.zirtirtu.kallo} onChange={e => update('zirtirtu', 'kallo', parseInt(e.target.value) || 0)} />
                    </div>
                </div>
            </div>
            {/* Zirtu */}
            <div className={`p-6 rounded-2xl border ${bgClass}`}>
                <h5 className={`text-[10px] font-black uppercase tracking-widest mb-4 border-b pb-2 ${labelClass}`}>Zirtu (Students)</h5>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Kal Zat</label>
                        <input type="number" className={`w-full border rounded-xl p-2 font-bold ${inputClass}`} value={segment.zirtu.kal} onChange={e => update('zirtu', 'kal', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Kal lo Zat</label>
                        <input type="number" className={`w-full border rounded-xl p-2 font-bold ${inputClass}`} value={segment.zirtu.kallo} onChange={e => update('zirtu', 'kallo', parseInt(e.target.value) || 0)} />
                    </div>
                </div>
            </div>
            {/* Thawhlawm (Combined) */}
            <div className={`p-6 rounded-2xl border ${bgClass} shadow-inner`}>
                <div className="flex items-center gap-2 mb-4">
                    <Wallet size={16} className={labelClass} />
                    <h5 className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}>Department Thawhlawm</h5>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-tighter">Amount (₹)</label>
                    <input 
                        type="number" 
                        className={`w-full border rounded-xl p-3 font-black font-mono text-xl ${inputClass} focus:bg-white transition-colors`} 
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
