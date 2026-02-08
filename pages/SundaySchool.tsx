
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { SundaySchoolDepartment, SSWeeklyReport } from '../types';
// Added Trash to the imported icons from lucide-react
import { Users, UserCheck, Edit, Save, X, Loader, Database, UploadCloud, FileUp, ClipboardList, Calendar, Info, Plus, Trash } from 'lucide-react';
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

const SundaySchool: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  
  const [departments, setDepartments] = useState<SundaySchoolDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'report'>('info');
  
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
    if (!departmentId || !db?.collection) return;
    setLoadingReports(true);
    try {
        const snapshot = await db.collection('sundaySchoolReports')
            .where('deptId', '==', departmentId)
            .orderBy('date', 'desc')
            .limit(10)
            .get();
        
        const fetchedReports = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as SSWeeklyReport[];
        setReports(fetchedReports);
    } catch (error) {
        console.error("Error fetching reports:", error);
    }
    setLoadingReports(false);
  }, [departmentId]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
      if (activeTab === 'report') {
          fetchReports();
      }
  }, [activeTab, fetchReports]);

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
          deptId: departmentId,
          zirtirtu: { kal: 0, kallo: 0, thawhlawm: 0 },
          zirtu: { kal: 0, kallo: 0, thawhlawm: 0 }
      });
      setIsReportModalOpen(true);
  };

  const handleSaveReport = async () => {
      if (!db || !db.collection || !editingReport.date) return;
      try {
          const docRef = editingReport.id 
              ? db.collection('sundaySchoolReports').doc(editingReport.id)
              : db.collection('sundaySchoolReports').doc();
          
          await docRef.set(editingReport, { merge: true });
          setIsReportModalOpen(false);
          fetchReports();
      } catch (error) {
          console.error("Error saving report:", error);
          alert("Failed to save report.");
      }
  };

  const handleDeleteReport = async (id: string) => {
      if (!window.confirm("Delete this report?")) return;
      try {
          await db.collection('sundaySchoolReports').doc(id).delete();
          fetchReports();
      } catch (error) {
          console.error(error);
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
  
  const normalizedId = departmentId?.toLowerCase();
  const currentDept = departments.find(d => d.id === normalizedId) || departments[0];

  if (!currentDept) return <div className="text-center py-20">No department data found.</div>;

  const isPuitling = currentDept.id === 'puitling';
  const leaderLabel = isPuitling ? 'Superintendent' : 'Leader';
  const asstLeaderLabel = isPuitling ? 'Asst. Superintendent' : 'Asst. Leader';

  return (
      <div className="py-12 bg-slate-50 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6">
                  <Link to="/" className="text-sm font-bold text-slate-500 hover:text-church-600 mb-4 inline-block">&larr; Back to Home</Link>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                          <h1 className="text-3xl font-serif font-bold text-church-900">{currentDept.name} Department</h1>
                          <p className="text-slate-600 mt-1 text-lg">{currentDept.description || 'No description available.'}</p>
                      </div>
                      
                      {/* Tab Toggle */}
                      <div className="flex bg-slate-200 p-1 rounded-xl border border-slate-300">
                          <button 
                            onClick={() => setActiveTab('info')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'info' ? 'bg-white text-church-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              <Info size={16} /> Information
                          </button>
                          <button 
                            onClick={() => setActiveTab('report')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'report' ? 'bg-white text-church-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              <ClipboardList size={16} /> Weekly Report
                          </button>
                      </div>
                  </div>
              </div>

              {activeTab === 'info' ? (
                  <div className="grid md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="md:col-span-2 space-y-6">
                          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-slate-800 flex items-center"><Users className="mr-2 text-church-600"/> Leadership</h3>
                                  {isAdmin && (
                                      <button onClick={() => { setEditingDept(currentDept); setIsEditModalOpen(true); }} className="p-2 text-slate-400 hover:text-church-600 transition">
                                          <Edit size={18} />
                                      </button>
                                  )}
                              </div>
                              <div className="space-y-4">
                                  <div className="flex justify-between border-b border-slate-50 pb-2">
                                      <span className="text-slate-500">{leaderLabel}</span>
                                      <span className="font-medium text-slate-800">{currentDept.leader || '-'}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-50 pb-2">
                                      <span className="text-slate-500">{asstLeaderLabel}</span>
                                      <span className="font-medium text-slate-800">{currentDept.asstLeader || '-'}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-50 pb-2">
                                      <span className="text-slate-500">Secretary</span>
                                      <span className="font-medium text-slate-800">{currentDept.secretary || '-'}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-50 pb-2">
                                      <span className="text-slate-500">Asst. Secretary</span>
                                      <span className="font-medium text-slate-800">{currentDept.asstSecretary || '-'}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center"><UserCheck className="mr-2 text-church-600"/> Teachers ({currentDept.teachers.length})</h3>
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => importInputRef.current?.click()} 
                                            className="p-1.5 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100" 
                                            title="Import Teachers"
                                        >
                                            <FileUp size={16} />
                                        </button>
                                        <input type="file" ref={importInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImportTeachers} />
                                    </div>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {currentDept.teachers.length > 0 ? (
                                      currentDept.teachers.map((t, i) => (
                                          <div key={i} className="flex items-center text-sm text-slate-700">
                                              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 shrink-0"></div>
                                              {t}
                                          </div>
                                      ))
                                  ) : (
                                      <div className="text-slate-400 italic text-sm col-span-2">No teachers listed yet.</div>
                                  )}
                              </div>
                          </div>
                      </div>

                      <div className="space-y-6">
                          <div className="bg-church-900 text-white rounded-xl p-6 shadow-lg">
                              <h3 className="text-sm font-bold uppercase tracking-widest text-church-200 mb-2">Total Students</h3>
                              <p className="text-5xl font-black">{currentDept.students || 0}</p>
                              <p className="text-sm text-church-300 mt-2">Registered for 2025</p>
                          </div>
                          
                          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">All Departments</h4>
                              <div className="flex flex-col gap-1">
                                  {departments.map(d => (
                                      <Link key={d.id} to={`/sundayschool/${d.id}`} className={`px-3 py-2 rounded text-sm font-medium transition ${d.id === currentDept.id ? 'bg-church-50 text-church-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                          {d.name}
                                      </Link>
                                  ))}
                              </div>
                          </div>

                          {isAdmin && (
                              <button onClick={handleSeed} disabled={isSeeding} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition shadow-sm">
                                  <Database size={16} /> {isSeeding ? 'Resetting...' : 'Reset Firebase Data'}
                              </button>
                          )}
                      </div>
                  </div>
              ) : (
                  /* WEEKLY REPORT VIEW */
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                          <div>
                              <h3 className="text-xl font-bold text-slate-800">Department Weekly Reports</h3>
                              <p className="text-sm text-slate-500">View latest attendance and offerings.</p>
                          </div>
                          {isAdmin && (
                              <button onClick={handleAddReport} className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-lg font-bold hover:bg-church-700 transition shadow-md">
                                  <Plus size={18}/> New Report
                              </button>
                          )}
                      </div>

                      {loadingReports ? (
                          <div className="py-20 text-center"><Loader className="animate-spin mx-auto text-church-500" /></div>
                      ) : reports.length === 0 ? (
                          <div className="bg-white py-20 rounded-2xl text-center border border-dashed border-slate-200">
                              <ClipboardList className="mx-auto text-slate-300 mb-4" size={48} />
                              <p className="text-slate-500 italic">No reports found for this department.</p>
                          </div>
                      ) : (
                          <div className="space-y-8">
                              {reports.map((report) => (
                                  <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group">
                                      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                                          <div className="flex items-center gap-3">
                                              <Calendar size={18} className="text-church-400" />
                                              <span className="font-bold">{new Date(report.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                          </div>
                                          {isAdmin && (
                                              <div className="flex gap-2">
                                                  <button onClick={() => { setEditingReport(report); setIsReportModalOpen(true); }} className="p-1.5 hover:bg-white/10 rounded"><Edit size={16}/></button>
                                                  <button onClick={() => handleDeleteReport(report.id!)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded"><Trash size={16}/></button>
                                              </div>
                                          )}
                                      </div>
                                      
                                      <div className="overflow-x-auto">
                                          <table className="w-full text-left border-collapse">
                                              <thead>
                                                  <tr className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest border-b">
                                                      <th className="px-6 py-4">Hming / Role</th>
                                                      <th className="px-6 py-4">Kal Zat</th>
                                                      <th className="px-6 py-4">Kal lo Zat</th>
                                                      <th className="px-6 py-4 text-right">Thawhlawm (₹)</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100 text-sm">
                                                  <tr className="hover:bg-slate-50/50">
                                                      <td className="px-6 py-4 font-bold text-slate-700">Zirtirtu</td>
                                                      <td className="px-6 py-4 text-slate-600">{report.zirtirtu.kal}</td>
                                                      <td className="px-6 py-4 text-slate-600">{report.zirtirtu.kallo}</td>
                                                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">₹ {report.zirtirtu.thawhlawm.toLocaleString()}</td>
                                                  </tr>
                                                  <tr className="hover:bg-slate-50/50">
                                                      <td className="px-6 py-4 font-bold text-slate-700">Zirtu</td>
                                                      <td className="px-6 py-4 text-slate-600">{report.zirtu.kal}</td>
                                                      <td className="px-6 py-4 text-slate-600">{report.zirtu.kallo}</td>
                                                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">₹ {report.zirtu.thawhlawm.toLocaleString()}</td>
                                                  </tr>
                                                  <tr className="bg-church-50/50 font-black">
                                                      <td className="px-6 py-4 text-church-900 uppercase text-xs tracking-wider">Total</td>
                                                      <td className="px-6 py-4 text-church-900">{report.zirtirtu.kal + report.zirtu.kal}</td>
                                                      <td className="px-6 py-4 text-church-900">{report.zirtirtu.kallo + report.zirtu.kallo}</td>
                                                      <td className="px-6 py-4 text-right font-mono text-church-900 text-lg">₹ {(report.zirtirtu.thawhlawm + report.zirtu.thawhlawm).toLocaleString()}</td>
                                                  </tr>
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}
          </div>

          {/* Department Edit Modal */}
          {isEditModalOpen && editingDept && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                      <div className="p-6 border-b flex justify-between items-center">
                          <h3 className="text-lg font-bold">Edit Department</h3>
                          <button onClick={() => setIsEditModalOpen(false)}><X/></button>
                      </div>
                      <div className="p-6 space-y-4 overflow-y-auto">
                          <div><label className="block text-sm font-bold mb-1">{leaderLabel}</label><input className="w-full border p-2 rounded" value={editingDept.leader || ''} onChange={e => setEditingDept({...editingDept, leader: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold mb-1">{asstLeaderLabel}</label><input className="w-full border p-2 rounded" value={editingDept.asstLeader || ''} onChange={e => setEditingDept({...editingDept, asstLeader: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold mb-1">Secretary</label><input className="w-full border p-2 rounded" value={editingDept.secretary || ''} onChange={e => setEditingDept({...editingDept, secretary: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold mb-1">Asst. Secretary</label><input className="w-full border p-2 rounded" value={editingDept.asstSecretary || ''} onChange={e => setEditingDept({...editingDept, asstSecretary: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold mb-1">Student Count</label><input type="number" className="w-full border p-2 rounded" value={editingDept.students || 0} onChange={e => setEditingDept({...editingDept, students: parseInt(e.target.value)})} /></div>
                          <div><label className="block text-sm font-bold mb-1">Description</label><textarea className="w-full border p-2 rounded h-20" value={editingDept.description || ''} onChange={e => setEditingDept({...editingDept, description: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold mb-1">Teachers (comma separated)</label><textarea className="w-full border p-2 rounded h-24" value={editingDept.teachers?.join(', ') || ''} onChange={e => setEditingDept({...editingDept, teachers: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} /></div>
                      </div>
                      <div className="p-4 border-t flex justify-end gap-2">
                          <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                          <button onClick={handleSaveDept} className="px-4 py-2 bg-church-600 text-white rounded">Save</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Weekly Report Entry Modal */}
          {isReportModalOpen && editingReport && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden">
                      <div className="p-8 border-b bg-church-50 flex justify-between items-center">
                          <div>
                              <h3 className="text-2xl font-serif font-black text-church-900">{editingReport.id ? 'Edit Report' : 'Enter Weekly Report'}</h3>
                              <p className="text-slate-500 text-sm font-medium">{currentDept.name} Department</p>
                          </div>
                          <button onClick={() => setIsReportModalOpen(false)} className="p-2 hover:bg-white rounded-full transition text-slate-400"><X size={24}/></button>
                      </div>
                      
                      <div className="p-8 overflow-y-auto space-y-8">
                          <div className="max-w-xs">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Sunday's Date</label>
                              <div className="relative">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-church-500" size={18} />
                                  <input 
                                      type="date" 
                                      className="w-full border border-slate-200 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none transition bg-slate-50"
                                      value={editingReport.date}
                                      onChange={e => setEditingReport({...editingReport, date: e.target.value})}
                                  />
                              </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-8">
                              {/* Zirtirtu Data */}
                              <div className="space-y-4 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                  <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest mb-4 border-b border-blue-200 pb-2">Zirtirtu (Teachers)</h4>
                                  <div className="space-y-3">
                                      <div>
                                          <label className="block text-[10px] font-bold text-blue-600 mb-1">Kal Zat (Present)</label>
                                          <input type="number" className="w-full border-blue-200 border rounded-lg p-2 font-bold" value={editingReport.zirtirtu?.kal} onChange={e => setEditingReport({...editingReport, zirtirtu: {...editingReport.zirtirtu!, kal: parseInt(e.target.value) || 0}})} />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-bold text-blue-600 mb-1">Kal lo Zat (Absent)</label>
                                          <input type="number" className="w-full border-blue-200 border rounded-lg p-2 font-bold" value={editingReport.zirtirtu?.kallo} onChange={e => setEditingReport({...editingReport, zirtirtu: {...editingReport.zirtirtu!, kallo: parseInt(e.target.value) || 0}})} />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-bold text-blue-600 mb-1">Thawhlawm (₹)</label>
                                          <input type="number" className="w-full border-blue-200 border rounded-lg p-2 font-bold font-mono" value={editingReport.zirtirtu?.thawhlawm} onChange={e => setEditingReport({...editingReport, zirtirtu: {...editingReport.zirtirtu!, thawhlawm: parseFloat(e.target.value) || 0}})} />
                                      </div>
                                  </div>
                              </div>

                              {/* Zirtu Data */}
                              <div className="space-y-4 p-6 bg-green-50 rounded-2xl border border-green-100">
                                  <h4 className="font-black text-green-900 uppercase text-xs tracking-widest mb-4 border-b border-green-200 pb-2">Zirtu (Students)</h4>
                                  <div className="space-y-3">
                                      <div>
                                          <label className="block text-[10px] font-bold text-green-600 mb-1">Kal Zat (Present)</label>
                                          <input type="number" className="w-full border-green-200 border rounded-lg p-2 font-bold" value={editingReport.zirtu?.kal} onChange={e => setEditingReport({...editingReport, zirtu: {...editingReport.zirtu!, kal: parseInt(e.target.value) || 0}})} />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-bold text-green-600 mb-1">Kal lo Zat (Absent)</label>
                                          <input type="number" className="w-full border-green-200 border rounded-lg p-2 font-bold" value={editingReport.zirtu?.kallo} onChange={e => setEditingReport({...editingReport, zirtu: {...editingReport.zirtu!, kallo: parseInt(e.target.value) || 0}})} />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-bold text-green-600 mb-1">Thawhlawm (₹)</label>
                                          <input type="number" className="w-full border-green-200 border rounded-lg p-2 font-bold font-mono" value={editingReport.zirtu?.thawhlawm} onChange={e => setEditingReport({...editingReport, zirtu: {...editingReport.zirtu!, thawhlawm: parseFloat(e.target.value) || 0}})} />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="p-4 bg-church-900 text-white rounded-2xl flex justify-between items-center shadow-lg">
                              <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-church-300 uppercase tracking-widest">Total Collection</span>
                                  <span className="text-3xl font-black font-mono">₹ {((editingReport.zirtirtu?.thawhlawm || 0) + (editingReport.zirtu?.thawhlawm || 0)).toLocaleString()}</span>
                              </div>
                              <div className="text-right">
                                  <span className="text-[10px] font-bold text-church-300 uppercase tracking-widest">Total Present</span>
                                  <p className="text-2xl font-black">{((editingReport.zirtirtu?.kal || 0) + (editingReport.zirtu?.kal || 0))}</p>
                              </div>
                          </div>
                      </div>

                      <div className="p-8 bg-slate-50 border-t flex justify-end gap-3">
                          <button onClick={() => setIsReportModalOpen(false)} className="px-6 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-white transition">Cancel</button>
                          <button onClick={handleSaveReport} className="px-8 py-3 bg-church-600 text-white font-bold rounded-xl shadow-lg hover:bg-church-700 flex items-center transition">
                             <Save size={18} className="mr-2" /> Save Report
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};

export default SundaySchool;
