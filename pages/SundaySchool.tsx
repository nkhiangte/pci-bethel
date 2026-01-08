
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink, Navigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { SundaySchoolDepartment } from '../types';
import { BookOpen, Users, UserCheck, Edit, Plus, Trash, Save, X, Loader, Database, AlertTriangle } from 'lucide-react';

const INITIAL_DEPARTMENTS_DATA: Omit<SundaySchoolDepartment, 'name'>[] = [
    {
      id: 'pre-beginner',
      leader: 'Pi K Lalrokhumi',
      asstLeader: 'Pi Mary Lalnunmawii',
      secretary: 'Nl K Zothansangi',
      teachers: ['Pi Linda Vanlalruati', 'Pi R.Laldintluangi', 'Pi Lalsiamliani', 'Pi Cicily Lalrindiki'],
      description: 'Focuses on foundational Bible stories and songs for ages 3-4, creating a fun and nurturing environment to introduce them to God\'s love.',
      students: 25
    },
    {
      id: 'beginner',
      leader: 'Pi K Lalbiakthangi',
      asstLeader: 'Pu T Lalramnghaka',
      secretary: 'Nl Ruthi Lalnunfeli',
      teachers: ['Nl Lalnunsiami', 'Pi C.Lalhruaitluangi', 'Nl Chingsawmluni', 'Nl C.Lalrampansangi', 'Nl Lalduhawmi', 'Nl R.Lalrinmawii', 'Pu Vanlalzamlova', 'Pu Tluangzathanga', 'Nl Khupngaihzovi', 'Tv Pauengliana'],
      description: 'Builds upon the basics with more interactive lessons, memory verses, and crafts for children aged 5-6.',
      students: 30
    },
    {
      id: 'primary',
      leader: 'Pu Mungngaihsanga',
      asstLeader: 'Pu C Rodinthara',
      secretary: 'Nl Zosangpuii',
      teachers: ['Pi Hmingthanmawii', 'Nl V.Nunmawii', 'Tv T.Vanneihtluanga', 'Tv C.Lalhumhima', 'Nl Malsawmmawii', 'Nl Enlamchingi', 'Pi Lalbiakdiki', 'Nl F Lalmuankimi', 'Nl Lalnunthari', 'Pu Vanlalruatpuia', 'Nl DL Kimi Suante', 'Pu Vanlalmawia', 'Nl Lalruatsangi', 'Pu Samuel Lalbiakzuala', 'Tv Zothanpuia', 'Tv Lalhmuliana'],
      description: 'Introduces key characters and events from the Old and New Testaments, encouraging students aged 7-9 to apply biblical truths to their lives.',
      students: 45
    },
    {
      id: 'junior',
      leader: 'Tv H Lalfakawma',
      asstLeader: 'Pi Lalmuanpuii Hlawndo',
      secretary: 'Nl Vunglamluni',
      teachers: ['Nl C.Lalremruati', 'Nl Thangdinsangi', 'Tv Vanlalzauva', 'Nl B.Lalrampari', 'Pu Lalhruaitluanga', 'Nl C.Zonunsiami', 'Nl Thangsuankimi', 'Tv Thangzasanga', 'Pi H.Lalchhanhimi', 'Pu C.Lalchhanhima', 'Tv PB.Hmangaihropuia', 'Nl Baby Romalsawmi', 'Nl Zodinsangi', 'Tv Vanlaldanmawia', 'Pu Lalthangliana', 'Nl Niangrosangi', 'Nl Anny Lalliandawli'],
      description: 'Dives deeper into scripture, exploring themes of faith, salvation, and Christian living for pre-teens aged 10-12.',
      students: 50
    },
    {
      id: 'intermediate',
      leader: 'Pu V.Lalbiakdika',
      asstLeader: 'Pu F.Lalhriatpuia',
      secretary: 'Nl Ngurthankimi',
      teachers: ['Pu K.Lalramngheta', 'Pi K Malsawmtluangi', 'Nl PC.Lalrintluangi', 'Pu R.Lalromawia', 'Pu Lalhmunngheta', 'Tv B.Thangzauva', 'Pi LR Dinsangi', 'Nl PC Lalthanmawii', 'Nl B Lalnunsiami', 'Nl C Ramnghinglovi', 'Nl Lalramsangi'],
      description: 'Tackles more complex theological concepts and life application questions, preparing young teens aged 13-15 for a mature faith.',
      students: 40
    },
    {
      id: 'sacrament',
      leader: 'T.Upa Hmingthansanga',
      asstLeader: 'Pu Lalmuanpuia',
      secretary: 'Nl Ningsianmawii',
      teachers: ['Pi Vanlalnghaki Colney', 'Nl Lalmuanchhungi', 'Tv Liankhankhama', 'Nl Lalrammawii Renthlei', 'Tv T.Lalnunzira'],
      description: 'Prepares students for church membership, focusing on the sacraments, church doctrine, and the responsibilities of a believer.',
      students: 35
    },
    {
      id: 'senior',
      leader: 'Pu Zoramenga',
      asstLeader: 'Pu Lalramnghakhlela',
      secretary: 'Nl Lallawmzuali',
      teachers: ['Pi H.Lallawmkimi', 'Tv Vanlalchhana', 'Pu Lalengkima', 'Pu F.Hmingthanzuala', 'Pi C Lalramthari', 'Pi C.Lalchhandami', 'Pu PC Lalmuanpuia', 'Nl Vungngaihdawni', 'Pu C Ramtharnghaka', 'Pi C.Lalrokimi'],
      description: 'Engages in advanced biblical studies, apologetics, and discussions on contemporary issues from a Christian worldview for older teens and young adults.',
      students: 60
    },
    {
      id: 'puitling',
      leader: '', // Left blank as per request
      asstLeader: '',
      secretary: '',
      teachers: [
        'Upa B.Hranghlira', 'Upa K.Vanlalhmuaka', 'Upa HT Vanlalsawma', 'Upa PC Lalhmingliana',
        'Upa R.Lalramhluna', 'Upa Daikhawzama', 'Upa C.Lalthantluanga', 'Upa H.Zairemmawia',
        'Upa C.Zohmingthanga', 'Upa Lianpianga', 'Upa Hmingthanmawia Sailo', 'T.Upa C.Lalthazuala',
        'T.Upa V.Kaizasiama', 'Pi PC Lalhmachhuani', 'Pu K.Lalduhawma', 'Pu K.Thuamluaia',
        'Pu C.Lalzova', 'Pu P.Lalhmingthanga', 'Pi R.Ramengzuali', 'Pu GF Thanga',
        'Pu Dawngsuanpauva', 'Pi V.Sangkungi', 'Pu Lalramthara', 'Pu MS Dawngliana',
        'Pu Lalsanglura Zote', 'Nl.Ngurbawitluangi', 'Pu H.Vanlalthanga', 'Pi Lalhlimthangi Khiangte',
        'Pu Lalmuanpuia Ralte', 'Pi K.Malsawmdawngi', 'Pu T.Sangtluanga', 'Pu K.Lalengthanga',
        'Pu C.Lalmuansanga', 'Pu C.Lalrawngbawla', 'Pu V.Lalbiakzuala', 'Pu JC Laldinthara',
        'Rev.Vankhuma', 'Pu R.Lalmalsawma', 'Pu C.Malsawmdawngliana', 'Pu Kenneth Lalthanzauva',
        'Pu F.Lalduhawma', 'Pu Lalhmingmawia', 'Pu Khawlrosiama', 'Pu L.Khenpauva',
        'Pu Kapthuama', 'Pu Nelson Khiangte', 'Pu C.Vanlalruata'
      ],
      description: 'Bible study and spiritual growth for adults.',
      students: 0 // Placeholder
    }
];

const SundaySchool: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  const [departments, setDepartments] = useState<SundaySchoolDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<SundaySchoolDepartment | null>(null);
  const [newTeacherName, setNewTeacherName] = useState('');

  const departmentLinks = [
    { id: 'pre-beginner', name: t.sundaySchool.preBeginner },
    { id: 'beginner', name: t.sundaySchool.beginner },
    { id: 'primary', name: t.sundaySchool.primary },
    { id: 'junior', name: t.sundaySchool.junior },
    { id: 'intermediate', name: t.sundaySchool.intermediate },
    { id: 'sacrament', name: t.sundaySchool.sacrament },
    { id: 'senior', name: t.sundaySchool.senior },
    { id: 'puitling', name: t.sundaySchool.puitling },
  ];
  
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
      const staticData = INITIAL_DEPARTMENTS_DATA.map(d => ({ ...d, name: departmentLinks.find(l => l.id === d.id)?.name || 'Unknown' }));
      setDepartments(staticData);
      setLoading(false);
      return;
    }

    try {
      const snapshot = await db.collection('sundaySchoolDepartments').get();
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as SundaySchoolDepartment[];
        // Ensure all static departments are represented if not in DB yet (e.g. new puitling)
        const mergedData = [...fetchedData];
        INITIAL_DEPARTMENTS_DATA.forEach(staticDept => {
            if (!mergedData.find(d => d.id === staticDept.id)) {
                mergedData.push({ ...staticDept, name: departmentLinks.find(l => l.id === staticDept.id)?.name || 'Unknown' });
            }
        });
        
        // Sort based on departmentLinks order
        const sortedData = mergedData.sort((a, b) => {
            const indexA = departmentLinks.findIndex(l => l.id === a.id);
            const indexB = departmentLinks.findIndex(l => l.id === b.id);
            return indexA - indexB;
        });

        setDepartments(sortedData);
      } else {
        const staticData = INITIAL_DEPARTMENTS_DATA.map(d => ({ ...d, name: departmentLinks.find(l => l.id === d.id)?.name || 'Unknown' }));
        setDepartments(staticData);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      const staticData = INITIAL_DEPARTMENTS_DATA.map(d => ({ ...d, name: departmentLinks.find(l => l.id === d.id)?.name || 'Unknown' }));
      setDepartments(staticData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSeedData = async () => {
    if (!db || !db.collection || !window.confirm("This will overwrite existing Sunday School data in Firebase. Are you sure?")) {
        return;
    }
    setIsSeeding(true);
    try {
        const batch = db.batch();
        const collectionRef = db.collection('sundaySchoolDepartments');
        
        INITIAL_DEPARTMENTS_DATA.forEach(deptData => {
            const docRef = collectionRef.doc(deptData.id);
            const fullData = { ...deptData, name: departmentLinks.find(l => l.id === deptData.id)?.name || 'Unknown' };
            batch.set(docRef, fullData);
        });
        
        await batch.commit();
        alert("Sunday School data seeded successfully!");
        fetchDepartments();
    } catch (error) {
        console.error("Error seeding data:", error);
        alert("An error occurred during seeding.");
    }
    setIsSeeding(false);
  };

  const handleOpenModal = (dept: SundaySchoolDepartment) => {
    setEditingDepartment({ ...dept });
    setIsModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!db || !db.collection || !editingDepartment) return;
    setLoading(true);
    try {
      const { id, ...dataToSave } = editingDepartment;
      await db.collection('sundaySchoolDepartments').doc(id).set(dataToSave, { merge: true });
      setIsModalOpen(false);
      fetchDepartments();
    } catch (error) {
      console.error("Error saving department:", error);
    }
    setLoading(false);
  };

  const addTeacher = () => {
    if (newTeacherName.trim() && editingDepartment) {
      const updatedTeachers = [...editingDepartment.teachers, newTeacherName.trim()];
      setEditingDepartment({ ...editingDepartment, teachers: updatedTeachers });
      setNewTeacherName('');
    }
  };

  const removeTeacher = (index: number) => {
    if (editingDepartment) {
      const updatedTeachers = editingDepartment.teachers.filter((_, i) => i !== index);
      setEditingDepartment({ ...editingDepartment, teachers: updatedTeachers });
    }
  };


  const department = departments.find(d => d.id === departmentId);
  
  if (!loading && (!departmentId || !department)) {
      return <Navigate to={`/sundayschool/${departmentLinks[0].id}`} replace />;
  }
  
  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">{t.sundaySchool.title}</h1>
          <p className="max-w-2xl mx-auto text-slate-600">{t.sundaySchool.subtitle}</p>
        </div>
        
        {isAdmin && departments.length > 0 && (
          <div className="text-center mb-8">
            <button 
              onClick={handleSeedData} 
              disabled={isSeeding}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
            >
              {isSeeding ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Database size={18} className="mr-2" />}
              Seed/Reset All Department Data
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-1/4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-24">
              <h3 className="font-bold text-slate-800 p-2">Departments</h3>
              <nav className="flex flex-col space-y-1">
                {departmentLinks.map(link => (
                  <NavLink key={link.id} to={`/sundayschool/${link.id}`} className={({ isActive }) => `px-3 py-2 text-sm font-medium rounded-md transition-colors ${ isActive ? 'bg-church-100 text-church-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>{link.name}</NavLink>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {loading ? <div className="text-center py-20"><Loader className="animate-spin h-10 w-10 mx-auto text-church-500" /></div>
            : department ? (
              <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden relative">
                {isAdmin && (
                  <button onClick={() => handleOpenModal(department)} className="absolute top-4 right-4 flex items-center gap-2 text-xs font-bold text-white bg-church-600 hover:bg-church-700 px-3 py-2 rounded-full transition shadow-md">
                    <Edit size={14} /> Edit
                  </button>
                )}
                <div className="p-8 bg-church-50 border-b border-church-200">
                    <h2 className="text-3xl font-bold text-church-900">{department.name}</h2>
                    <p className="text-slate-600 mt-2">{department.description}</p>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-50 p-4 rounded-lg flex items-center"><UserCheck className="w-8 h-8 text-church-500 mr-4"/><div><div className="text-xs text-slate-500 font-bold uppercase">{t.sundaySchool.leader}</div><div className="text-lg font-bold text-slate-800">{department.leader || 'N/A'}</div></div></div>
                    {department.asstLeader && <div className="bg-slate-50 p-4 rounded-lg flex items-center"><UserCheck className="w-8 h-8 text-slate-400 mr-4"/><div><div className="text-xs text-slate-500 font-bold uppercase">Asst. Leader</div><div className="text-lg font-bold text-slate-800">{department.asstLeader}</div></div></div>}
                    {department.secretary && <div className="bg-slate-50 p-4 rounded-lg flex items-center"><UserCheck className="w-8 h-8 text-slate-400 mr-4"/><div><div className="text-xs text-slate-500 font-bold uppercase">Secretary</div><div className="text-lg font-bold text-slate-800">{department.secretary}</div></div></div>}
                    <div className="bg-slate-50 p-4 rounded-lg flex items-center"><Users className="w-8 h-8 text-church-500 mr-4"/><div><div className="text-xs text-slate-500 font-bold uppercase">{t.sundaySchool.students}</div><div className="text-lg font-bold text-slate-800">{department.students} Students</div></div></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-800 mb-4">{t.sundaySchool.teachers} ({department.teachers.length})</h3>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {department.teachers.map((teacher, index) => (<div key={index} className="bg-slate-100 text-slate-700 text-sm font-medium p-3 rounded-md">{teacher}</div>))}
                    </div>
                  </div>
                </div>
              </div>
            ) : ( <div className="text-center py-20 bg-white rounded-lg shadow-sm"><BookOpen size={48} className="mx-auto text-slate-300 mb-4" /><p className="text-slate-500">{t.sundaySchool.select}</p></div> )}
          </main>
        </div>
      </div>
       {/* Edit Modal */}
      {isModalOpen && editingDepartment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit {editingDepartment.name}</h3>
              <button onClick={() => setIsModalOpen(false)}><X/></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">Leader</label><input className="w-full border p-2 rounded" value={editingDepartment.leader} onChange={e => setEditingDepartment({...editingDepartment, leader: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">Asst. Leader</label><input className="w-full border p-2 rounded" value={editingDepartment.asstLeader} onChange={e => setEditingDepartment({...editingDepartment, asstLeader: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">Secretary</label><input className="w-full border p-2 rounded" value={editingDepartment.secretary} onChange={e => setEditingDepartment({...editingDepartment, secretary: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">Student Count</label><input type="number" className="w-full border p-2 rounded" value={editingDepartment.students} onChange={e => setEditingDepartment({...editingDepartment, students: Number(e.target.value)})} /></div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Teachers</label>
                <div className="space-y-2">
                  {editingDepartment.teachers.map((teacher, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input className="w-full border p-2 rounded bg-slate-50" value={teacher} readOnly />
                      <button onClick={() => removeTeacher(index)} className="p-2 bg-red-100 text-red-600 rounded"><Trash size={16}/></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <input className="w-full border p-2 rounded" placeholder="New teacher name..." value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} />
                  <button onClick={addTeacher} className="px-4 py-2 bg-green-600 text-white rounded font-semibold">Add</button>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 mt-auto">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSaveChanges} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">
                {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SundaySchool;
