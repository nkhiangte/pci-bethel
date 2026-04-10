import React, { useState, useEffect, lazy, Suspense } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import 'react-quill-new/dist/quill.snow.css';
import { Save, Plus, Trash, Database } from 'lucide-react';
import { seedSyllabus } from '../services/syllabusService';

const ReactQuill = lazy(() => import('react-quill-new'));

const SundaySchoolDashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const [description, setDescription] = useState('');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [newLeader, setNewLeader] = useState({ name: '', role: '' });
  const [departments, setDepartments] = useState<any[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    // Fetch description and leaders from Firestore
    const fetchData = async () => {
      try {
        const doc = await db.collection('sundaySchoolSettings').doc('dashboard').get();
        if (doc.exists) {
          const data = doc.data();
          setDescription(data?.description || '');
          setLeaders(data?.leaders || []);
        }
        
        // Fetch departments
        const deptsSnapshot = await db.collection('sundaySchoolDepartments').get();
        setDepartments(deptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'sundaySchoolSettings/dashboard or sundaySchoolDepartments');
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      await db.collection('sundaySchoolSettings').doc('dashboard').set({
        description,
        leaders
      });
      alert('Saved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sundaySchoolSettings/dashboard');
    }
  };

  const handleSeedSyllabus = async () => {
    if (!window.confirm('This will seed the syllabus data to Firestore. Continue?')) return;
    setIsSeeding(true);
    try {
      await seedSyllabus();
      alert('Syllabus seeded successfully!');
    } catch (error) {
      alert('Failed to seed syllabus');
    } finally {
      setIsSeeding(false);
    }
  };

  const addLeader = () => {
    setLeaders([...leaders, newLeader]);
    setNewLeader({ name: '', role: '' });
  };

  const removeLeader = (index: number) => {
    setLeaders(leaders.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Sunday School Dashboard</h1>
      
      {isAdmin && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Edit Description</h2>
          <Suspense fallback={<div>Loading editor...</div>}>
            <ReactQuill theme="snow" value={description} onChange={setDescription} className="mb-4" />
          </Suspense>
          
          <h2 className="text-xl font-bold mb-4">Manage Sunday School Hotute</h2>
          <div className="flex gap-2 mb-4">
            <input placeholder="Name" value={newLeader.name} onChange={e => setNewLeader({...newLeader, name: e.target.value})} className="border p-2 rounded" />
            <input placeholder="Role" value={newLeader.role} onChange={e => setNewLeader({...newLeader, role: e.target.value})} className="border p-2 rounded" />
            <button onClick={addLeader} className="bg-blue-500 text-white p-2 rounded"><Plus /></button>
          </div>
          <ul>
            {leaders.map((l, i) => (
              <li key={i} className="flex justify-between items-center mb-2">
                {l.name} - {l.role}
                <button onClick={() => removeLeader(i)} className="text-red-500"><Trash /></button>
              </li>
            ))}
          </ul>
          
          <div className="flex gap-4 mt-4">
            <button onClick={handleSave} className="bg-green-500 text-white p-3 rounded flex items-center gap-2 hover:bg-green-600 transition-colors">
              <Save /> Save Changes
            </button>
            <button 
              onClick={handleSeedSyllabus} 
              disabled={isSeeding}
              className="bg-purple-500 text-white p-3 rounded flex items-center gap-2 hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <Database /> {isSeeding ? 'Seeding...' : 'Seed Syllabus to Firestore'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Sunday School Description</h2>
        <div dangerouslySetInnerHTML={{ __html: description }} />
        
        <h2 className="text-xl font-bold mt-6 mb-4">Sunday School Hotute</h2>
        <ul>
          {leaders.map((l, i) => (
            <li key={i}>{l.name} - {l.role}</li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Departments</h2>
        <div className="grid grid-cols-2 gap-4">
          {departments.map((dept) => (
            <a key={dept.id} href={`#/sundayschool/${dept.id}`} className="block p-4 border rounded hover:bg-slate-50">
              {dept.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SundaySchoolDashboard;
