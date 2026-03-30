
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Trash, Plus, X, Upload } from 'lucide-react';
import { Resource } from '../types';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const Resources: React.FC = () => {
  const { isAdmin } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<Resource>>({});

  // Initial Mock Data Fallback
  const MOCK_RESOURCES: Resource[] = [
    { id: '1', title: 'Annual Report 2023', category: 'Report', date: '2024-01-15', downloadUrl: '#', fileSize: '2.4 MB' },
    { id: '2', title: 'Church Financial Statement Q1 2024', category: 'Report', date: '2024-04-10', downloadUrl: '#', fileSize: '1.1 MB' },
    { id: '3', title: 'Sunday School Admission Form', category: 'Form', date: '2023-12-01', downloadUrl: '#', fileSize: '500 KB' },
    { id: '4', title: 'Bethel Weekly Bulletin (Nov 26)', category: 'Bulletin', date: '2023-11-26', downloadUrl: '#', fileSize: '800 KB' },
    { id: '5', title: 'Testimonial Form', category: 'Form', date: '2024-01-01', downloadUrl: '#', fileSize: '200 KB' },
    { id: '6', title: 'Pem Lehkha (Transfer Letter)', category: 'Form', date: '2024-01-01', downloadUrl: '#', fileSize: '250 KB' },
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    if (db && db.collection) {
        try {
            const snapshot = await db.collection('resources').get();
            if (!snapshot.empty) {
                const fetched = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data()
                })) as Resource[];
                // Sort by date desc
                fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setResources(fetched);
            } else {
                setResources(MOCK_RESOURCES);
            }
        } catch (e) {
            console.error(e);
            setResources(MOCK_RESOURCES);
        }
    } else {
        setResources(MOCK_RESOURCES);
    }
    setLoading(false);
  };

  const handleAddNew = () => {
    setForm({
        title: '',
        category: 'Bulletin',
        date: new Date().toISOString().split('T')[0],
        fileSize: '',
        downloadUrl: ''
    });
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!db || !db.collection) return;
    try {
        const data = { ...form };
        await db.collection('resources').add(data);
        setIsAdding(false);
        fetchResources();
    } catch (e) {
        alert("Error saving resource.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !db.collection) return;
    if (window.confirm("Delete this resource?")) {
        try {
            await db.collection('resources').doc(id).delete();
            fetchResources();
        } catch (e) {
            console.error(e);
        }
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-4xl font-serif font-bold text-church-900 mb-2">Resources</h1>
                <p className="text-slate-600">Download official church documents, forms, and weekly bulletins.</p>
            </div>
            {isAdmin && (
                <button 
                    onClick={handleAddNew}
                    className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm"
                >
                    <Upload size={18} className="mr-2" /> Upload Resource
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            {resources.map((res) => (
              <div key={res.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between group hover:border-church-200 transition relative">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg mr-4 ${res.category === 'Bulletin' ? 'bg-church-50 text-church-600' : 'bg-orange-50 text-orange-600'}`}>
                    {res.category === 'Bulletin' ? <Calendar size={24} /> : <FileText size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{res.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{res.category} • {res.date} • {res.fileSize || 'PDF'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                    <a href={res.downloadUrl} className="p-2 text-slate-400 hover:text-church-600 transition" target="_blank" rel="noreferrer">
                        <Download size={20} />
                    </a>
                    {isAdmin && (
                        <button onClick={() => handleDelete(res.id)} className="p-2 text-slate-400 hover:text-red-600 transition">
                            <Trash size={20} />
                        </button>
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-4 text-slate-800">Categories</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex justify-between cursor-pointer hover:text-church-600"><span>Weekly Bulletins</span> <span className="bg-slate-100 px-2 rounded-full text-xs py-0.5">12</span></li>
                <li className="flex justify-between cursor-pointer hover:text-church-600"><span>Forms & Applications</span> <span className="bg-slate-100 px-2 rounded-full text-xs py-0.5">7</span></li>
                <li className="flex justify-between cursor-pointer hover:text-church-600"><span>Annual Reports</span> <span className="bg-slate-100 px-2 rounded-full text-xs py-0.5">3</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isAdding && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Upload Resource</h3>
                      <button onClick={() => setIsAdding(false)}><X size={20} /></button>
                  </div>
                  <div className="space-y-3">
                      <input className="w-full border p-2 rounded" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                      <select className="w-full border p-2 rounded" value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}>
                          <option value="Bulletin">Bulletin</option>
                          <option value="Report">Report</option>
                          <option value="Form">Form</option>
                          <option value="Article">Article</option>
                      </select>
                      <input type="date" className="w-full border p-2 rounded" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                      <input className="w-full border p-2 rounded" placeholder="File Size (e.g. 1.2 MB)" value={form.fileSize} onChange={e => setForm({...form, fileSize: e.target.value})} />
                      <input className="w-full border p-2 rounded" placeholder="Download URL (Drive Link etc.)" value={form.downloadUrl} onChange={e => setForm({...form, downloadUrl: e.target.value})} />
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                      <button onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded">Cancel</button>
                      <button onClick={handleSave} className="px-4 py-2 bg-church-600 text-white rounded">Save</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Resources;