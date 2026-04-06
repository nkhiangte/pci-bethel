import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { Ministry } from '../types';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Loader, Home, TrendingUp, Book, DollarSign, List, History, Camera, Video, UserSquare,
  Edit, Save, X, Upload, Trash2
} from 'lucide-react';
import { storage, handleFirestoreError, OperationType } from '../services/firebase';
import StatsTable from '../components/StatsTable';

const Fellowship: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const [fellowship, setFellowship] = useState<Ministry | null | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Ministry>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isKTP = id === 'ktp';
  const isKPVM = id === 'kpvm';
  const [kpvmActiveTab, setKpvmActiveTab] = useState('home');

  const kpvmNavLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'buhfaitham', label: 'Buhfaitham', icon: TrendingUp },
    { id: 'nitin-inkhawm', label: 'Kristian Chhungkua', icon: Users },
  ];

  useEffect(() => {
    if (!id) return;
    const fetchFellowship = async () => {
        if (!db?.collection) {
            const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
            setFellowship(staticFellowship || null);
            return;
        }
        try {
            const docRef = db.collection('ministries').doc(id);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                setFellowship({ ...docSnap.data(), id: docSnap.id } as Ministry);
            } else {
                const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
                setFellowship(staticFellowship || null);
            }
        } catch (error) {
            const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
            setFellowship(staticFellowship || null);
        }
    };
    fetchFellowship();
  }, [id, language]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id || !fellowship) return;
    setIsSaving(true);
    try {
      let imageUrl = editForm.image || fellowship.image;

      if (logoFile) {
        const storageRef = storage.ref(`ministry_logos/${id}_${Date.now()}`);
        await storageRef.put(logoFile);
        imageUrl = await storageRef.getDownloadURL();
      }

      const updatedData = {
        ...editForm,
        image: imageUrl
      };

      await db.collection('ministries').doc(id).set(updatedData, { merge: true });
      setFellowship({ ...fellowship, ...updatedData });
      setIsEditing(false);
      setLogoFile(null);
    } catch (error) {
      console.error("Error saving fellowship:", error);
    }
    setIsSaving(false);
  };

  const openEditModal = () => {
    if (!fellowship) return;
    setEditForm(fellowship);
    setIsEditing(true);
  };

  // Redirect KTP to the new dedicated KTP routes
  if (isKTP) return <Navigate to="/ktp/leaders" replace />;

  if (fellowship === undefined) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-church-500" /></div>;
  if (fellowship === null) return <Navigate to="/" />;

  // ── Shared Edit Modal ─────────────────────────────────────
  const editModal = isEditing && (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <form onSubmit={handleSave}>
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <h3 className="text-xl font-bold text-slate-800">Edit {fellowship.name}</h3>
            <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
              <input
                className="w-full border p-2 rounded"
                value={editForm.name || ''}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
              <textarea
                className="w-full border p-2 rounded h-24"
                value={editForm.description || ''}
                onChange={e => setEditForm({...editForm, description: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Logo / Image</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded border overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={logoFile ? URL.createObjectURL(logoFile) : editForm.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-grow">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-church-50 file:text-church-700 hover:file:bg-church-100"
                    onChange={e => setLogoFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Leader</label>
                <input
                  className="w-full border p-2 rounded"
                  value={editForm.leader || ''}
                  onChange={e => setEditForm({...editForm, leader: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Schedule</label>
                <input
                  className="w-full border p-2 rounded"
                  value={editForm.schedule || ''}
                  onChange={e => setEditForm({...editForm, schedule: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div className="p-6 border-t bg-slate-50 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-white font-medium transition">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-church-600 text-white rounded-lg hover:bg-church-700 font-medium flex items-center shadow-md transition disabled:opacity-50">
              {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={18} className="mr-2" />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── KPVM Render ───────────────────────────────────────────
  if (isKPVM) {
      return (
          <div className="bg-slate-50 min-h-screen pb-12">
              <div className="bg-white border-b border-slate-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                      <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-slate-200 rounded-2xl overflow-hidden shadow-md shrink-0 relative group">
                              <img src={fellowship.image} alt={fellowship.name} className="w-full h-full object-cover" />
                              {isAdmin && (
                                  <button
                                      onClick={openEditModal}
                                      className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  >
                                      <Edit size={20} />
                                  </button>
                              )}
                          </div>
                          <div>
                              <h1 className="text-3xl font-serif font-bold text-slate-900">{fellowship.name}</h1>
                              <p className="text-slate-600 mt-2 max-w-2xl">{fellowship.description}</p>
                          </div>
                      </div>
                  </div>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex space-x-1 overflow-x-auto no-scrollbar">
                          {kpvmNavLinks.map(link => (
                              <button
                                  key={link.id}
                                  onClick={() => setKpvmActiveTab(link.id)}
                                  className={`flex items-center px-5 py-4 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                                      kpvmActiveTab === link.id
                                          ? 'border-church-600 text-church-700 bg-church-50/50'
                                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                  }`}
                              >
                                  <link.icon size={18} className="mr-2" />
                                  {link.label}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {kpvmActiveTab === 'home' && (
                      <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Users size={20} className="mr-2 text-church-600"/> Leadership & Schedule</h3>
                              <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-700">
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Leader</span>
                                      <span className="text-lg font-bold">{fellowship.leader || 'N/A'}</span>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weekly Service</span>
                                      <span className="text-lg font-bold">{fellowship.schedule || 'N/A'}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
                  {kpvmActiveTab === 'buhfaitham' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <StatsTable
                              title="Buhfaitham Record"
                              collectionName="kpvmBuhfaitham"
                              isAdmin={isAdmin}
                              columns={[
                                  { key: 'year', label: 'Year', type: 'number' },
                                  { key: 'totalFamilies', label: 'Total Families', type: 'number' },
                                  { key: 'donors', label: 'Donors', type: 'number' },
                                  { key: 'percentage', label: '%', type: 'text' },
                                  { key: 'weight', label: 'Weight (kg)', type: 'text' },
                                  { key: 'amount', label: 'Amount (₹)', type: 'text' }
                              ]}
                          />
                      </div>
                  )}
                  {kpvmActiveTab === 'nitin-inkhawm' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <StatsTable
                              title="Kristian Chhungkua (Nitin Inkhawm)"
                              collectionName="kpvmNitinInkhawm"
                              isAdmin={isAdmin}
                              columns={[
                                  { key: 'year', label: 'Year', type: 'number' },
                                  { key: 'totalHouses', label: 'Total Households', type: 'number' },
                                  { key: 'performers', label: 'Attendees', type: 'number' },
                                  { key: 'percentage', label: '%', type: 'text' }
                              ]}
                          />
                      </div>
                  )}
              </div>

              {editModal}
          </div>
      );
  }

  // ── Generic Fallback Render ───────────────────────────────
  return (
    <div className="bg-slate-50 min-h-screen">
        <div className="bg-church-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 bg-white p-2 rounded-full shadow-xl shrink-0 relative group">
                        <img src={fellowship.image} alt="Logo" className="w-full h-full object-cover rounded-full" />
                        {isAdmin && (
                            <button
                                onClick={openEditModal}
                                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
                            >
                                <Edit size={24} />
                            </button>
                        )}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-serif font-bold mb-2">{fellowship.name}</h1>
                        <p className="text-church-200 text-lg max-w-2xl">{fellowship.description}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
             <div className="bg-white p-8 rounded-xl shadow-sm">
                 <h2 className="text-2xl font-bold text-slate-800 mb-4">About {fellowship.acronym || fellowship.name}</h2>
                 <p className="text-slate-600 leading-relaxed mb-6">{fellowship.description}</p>
                 <div className="grid md:grid-cols-2 gap-6">
                     <div className="p-4 border rounded-lg">
                         <h3 className="font-bold text-slate-700">Leader</h3>
                         <p>{fellowship.leader}</p>
                     </div>
                     <div className="p-4 border rounded-lg">
                         <h3 className="font-bold text-slate-700">Schedule</h3>
                         <p>{fellowship.schedule}</p>
                     </div>
                 </div>
             </div>
        </div>

        {editModal}
    </div>
  );
};

export default Fellowship;
