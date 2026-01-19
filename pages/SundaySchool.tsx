
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { SundaySchoolDepartment } from '../types';
import { Users, UserCheck, Edit, Save, X, Loader, Database, UploadCloud, FileUp } from 'lucide-react';
import * as XLSX from 'xlsx';

// Initial Empty Data Structure for Admin Population
const INITIAL_DEPARTMENTS_DATA: Omit<SundaySchoolDepartment, 'name'>[] = [
    {
      id: 'pre-beginner',
      leader: '',
      asstLeader: '',
      secretary: '',
      teachers: [],
      description: '',
      students: 0
    },
    {
      id: 'beginner',
      leader: '',
      asstLeader: '',
      secretary: '',
      teachers: [],
      description: '',
      students: 0
    },
    {
      id: 'primary',
      leader: '',
      asstLeader: '',
      secretary: '',
      teachers: [],
      description: '',
      students: 0
    },
    {
      id: 'junior',
      leader: '',
      asstLeader: '',
      secretary: '',
      teachers: [],
      description: '',
      students: 0
    },
    {
      id: 'intermediate',
      leader: '',
      asstLeader: '',
      secretary: '',
      teachers: [],
      description: '',
      students: 0
    },
    {
      id: 'sacrament',
      leader: '',
      asstLeader: '',
      secretary: '',
      teachers: [],
      description: '',
      students: 0
    },
    {
      id: 'senior',
      leader: '',
      asstLeader: '',
      secretary: '',
      teachers: [],
      description: '',
      students: 0
    },
    {
      id: 'puitling',
      leader: '',
      asstLeader: '',
      teachers: [],
      description: '',
      students: 0
    }
];

const SundaySchool: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  
  const [departments, setDepartments] = useState<SundaySchoolDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Partial<SundaySchoolDepartment> | null>(null);
  
  const importInputRef = useRef<HTMLInputElement>(null);

  // Helper to map IDs to Names based on language (or just capitalize ID)
  const getDeptName = useCallback((id: string) => {
      // @ts-ignore
      return t.sundaySchool[id] || id.charAt(0).toUpperCase() + id.slice(1);
  }, [t]);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
        // Fallback
        const mappedData = INITIAL_DEPARTMENTS_DATA.map(d => ({
            ...d,
            name: getDeptName(d.id)
        }));
        setDepartments(mappedData as SundaySchoolDepartment[]);
        setLoading(false);
        return;
    }

    try {
        const snapshot = await db.collection('sundaySchoolDepartments').get();
        if (!snapshot.empty) {
            const fetchedData = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })) as SundaySchoolDepartment[];
            
            // Ensure we have all static IDs even if DB has partial
            const merged = INITIAL_DEPARTMENTS_DATA.map(init => {
                const found = fetchedData.find(f => f.id === init.id);
                return found || { ...init, name: getDeptName(init.id) };
            });
            
            setDepartments(merged as SundaySchoolDepartment[]);
        } else {
            const mappedData = INITIAL_DEPARTMENTS_DATA.map(d => ({
                ...d,
                name: getDeptName(d.id)
            }));
            setDepartments(mappedData as SundaySchoolDepartment[]);
        }
    } catch (e) {
        console.error("Error fetching departments:", e);
        // On error (e.g. collection doesn't exist yet or permission denied), fallback to initial data
        const mappedData = INITIAL_DEPARTMENTS_DATA.map(d => ({
            ...d,
            name: getDeptName(d.id)
        }));
        setDepartments(mappedData as SundaySchoolDepartment[]);
    }
    setLoading(false);
  }, [getDeptName]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

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

  const handleSave = async () => {
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

  const handleImportTeachers = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Find current dept again to be safe inside callback
      const normalizedId = departmentId?.toLowerCase();
      const currentDept = departments.find(d => d.id === normalizedId) || departments[0];

      if (!file || !currentDept) return;

      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Read as array of arrays to get raw rows
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          const importedTeachers: string[] = [];
          
          // Iterate rows and grab first column, skipping potential headers
          jsonData.forEach((row: any[]) => {
              if (row.length > 0) {
                  const val = String(row[0]).trim();
                  // Skip obvious headers
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
                  await db.collection('sundaySchoolDepartments').doc(currentDept.id).update({
                      teachers: importedTeachers
                  });
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

  // Safe Fallback: If loading, show loader. If not found, use first department (Soft Redirect)
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-church-500"/></div>;
  
  // Find department matching ID (case-insensitive), or default to the first one available
  const normalizedId = departmentId?.toLowerCase();
  const currentDept = departments.find(d => d.id === normalizedId) || departments[0];

  if (!currentDept) return <div className="text-center py-20">No department data found.</div>;

  return (
      <div className="py-12 bg-slate-50 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6">
                  {/* Changed link to avoid recursion loop if user somehow gets here without param */}
                  <Link to="/" className="text-sm font-bold text-slate-500 hover:text-church-600 mb-4 inline-block">&larr; Back to Home</Link>
                  <div className="flex justify-between items-start">
                      <div>
                          <h1 className="text-3xl font-serif font-bold text-church-900">{currentDept.name} Department</h1>
                          <p className="text-slate-600 mt-2 text-lg">{currentDept.description || 'No description available.'}</p>
                      </div>
                      {isAdmin && (
                          <div className="flex gap-2">
                              <button 
                                onClick={() => importInputRef.current?.click()} 
                                className="p-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-green-700" 
                                title="Import Teachers from Excel"
                              >
                                  <FileUp size={20} />
                              </button>
                              <input 
                                  type="file" 
                                  ref={importInputRef} 
                                  className="hidden" 
                                  accept=".xlsx, .xls, .csv" 
                                  onChange={handleImportTeachers} 
                              />

                              <button 
                                onClick={handleSeed} 
                                disabled={isSeeding} 
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 text-red-700 text-xs font-bold" 
                                title="Reset Firebase Data"
                              >
                                  <UploadCloud size={16} /> {isSeeding ? 'Resetting...' : 'Reset Data'}
                              </button>
                              <button onClick={() => { setEditingDept(currentDept); setIsEditModalOpen(true); }} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                                  <Edit size={20} />
                              </button>
                          </div>
                      )}
                  </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                          <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Users className="mr-2 text-church-600"/> Leadership</h3>
                          <div className="space-y-4">
                              <div className="flex justify-between border-b border-slate-50 pb-2">
                                  <span className="text-slate-500">Leader</span>
                                  <span className="font-medium text-slate-800">{currentDept.leader || '-'}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-50 pb-2">
                                  <span className="text-slate-500">Asst. Leader</span>
                                  <span className="font-medium text-slate-800">{currentDept.asstLeader || '-'}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-50 pb-2">
                                  <span className="text-slate-500">Secretary</span>
                                  <span className="font-medium text-slate-800">{currentDept.secretary || '-'}</span>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                          <h3 className="font-bold text-slate-800 mb-4 flex items-center"><UserCheck className="mr-2 text-church-600"/> Teachers ({currentDept.teachers.length})</h3>
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

                  <div>
                      <div className="bg-church-900 text-white rounded-xl p-6 shadow-lg">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-church-200 mb-2">Total Students</h3>
                          <p className="text-5xl font-black">{currentDept.students || 0}</p>
                          <p className="text-sm text-church-300 mt-2">Registered for 2025</p>
                      </div>
                      {/* Navigation Sidebar */}
                      <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">All Departments</h4>
                          <div className="flex flex-col gap-1">
                              {departments.map(d => (
                                  <Link 
                                    key={d.id} 
                                    to={`/sundayschool/${d.id}`}
                                    className={`px-3 py-2 rounded text-sm font-medium transition ${d.id === currentDept.id ? 'bg-church-50 text-church-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                  >
                                      {d.name}
                                  </Link>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {isEditModalOpen && editingDept && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                      <div className="p-6 border-b flex justify-between items-center">
                          <h3 className="text-lg font-bold">Edit Department</h3>
                          <button onClick={() => setIsEditModalOpen(false)}><X/></button>
                      </div>
                      <div className="p-6 space-y-4 overflow-y-auto">
                          <div><label className="block text-sm font-bold mb-1">Leader</label><input className="w-full border p-2 rounded" value={editingDept.leader || ''} onChange={e => setEditingDept({...editingDept, leader: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold mb-1">Asst. Leader</label><input className="w-full border p-2 rounded" value={editingDept.asstLeader || ''} onChange={e => setEditingDept({...editingDept, asstLeader: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold mb-1">Secretary</label><input className="w-full border p-2 rounded" value={editingDept.secretary || ''} onChange={e => setEditingDept({...editingDept, secretary: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold mb-1">Student Count</label><input type="number" className="w-full border p-2 rounded" value={editingDept.students || 0} onChange={e => setEditingDept({...editingDept, students: parseInt(e.target.value)})} /></div>
                          <div>
                              <label className="block text-sm font-bold mb-1">Description</label>
                              <textarea className="w-full border p-2 rounded h-20" value={editingDept.description || ''} onChange={e => setEditingDept({...editingDept, description: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-bold mb-1">Teachers (comma separated)</label>
                              <textarea className="w-full border p-2 rounded h-24" value={editingDept.teachers?.join(', ') || ''} onChange={e => setEditingDept({...editingDept, teachers: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} />
                          </div>
                      </div>
                      <div className="p-4 border-t flex justify-end gap-2">
                          <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                          <button onClick={handleSave} className="px-4 py-2 bg-church-600 text-white rounded">Save</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};

export default SundaySchool;
