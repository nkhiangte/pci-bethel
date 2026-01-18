
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { WeeklyDuty } from '../types';
import { getConstants } from '../constants';
import { Loader, Save, ArrowLeft, Plus, Trash, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDuties: React.FC = () => {
  const { isAdmin } = useAuth();
  const [duties, setDuties] = useState<WeeklyDuty | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDuties();
  }, []);

  const fetchDuties = async () => {
    setLoading(true);
    if (!db || !db.collection) {
        // Fallback for dev/offline
        setDuties(getConstants('en').weeklyDuty); // Default
        setLoading(false);
        return;
    }
    try {
      const doc = await db.collection('weeklyDuties').doc('current').get();
      if (doc.exists) {
        setDuties(doc.data() as WeeklyDuty);
      } else {
        setDuties(getConstants('en').weeklyDuty);
      }
    } catch (error) {
      console.error("Error fetching duties:", error);
      setDuties(getConstants('en').weeklyDuty);
    }
    setLoading(false);
  };

  const handleFieldChange = (field: keyof WeeklyDuty, value: any) => {
    if (!duties) return;
    setDuties({ ...duties, [field]: value });
  };

  const handleArrayChange = (field: 'thawhlawmChiartute' | 'ushers', value: string) => {
      if (!duties) return;
      const array = value.split('\n').filter(line => line.trim() !== '');
      setDuties({ ...duties, [field]: array });
  };

  // Helper for deeply nested program fields
  const handleProgramFieldChange = (
      service: 'sundaySchool' | 'morning' | 'evening', 
      index: number, 
      key: 'label' | 'value', 
      newVal: string
  ) => {
      if (!duties) return;
      const updatedPrograms = { ...duties.servicePrograms };
      const currentServiceProgram = [...updatedPrograms[service]];
      currentServiceProgram[index] = { ...currentServiceProgram[index], [key]: newVal };
      updatedPrograms[service] = currentServiceProgram;
      setDuties({ ...duties, servicePrograms: updatedPrograms });
  };

  const addProgramField = (service: 'sundaySchool' | 'morning' | 'evening') => {
      if (!duties) return;
      const updatedPrograms = { ...duties.servicePrograms };
      updatedPrograms[service] = [...updatedPrograms[service], { id: Date.now().toString(), label: '', value: '' }];
      setDuties({ ...duties, servicePrograms: updatedPrograms });
  };

  const removeProgramField = (service: 'sundaySchool' | 'morning' | 'evening', index: number) => {
      if (!duties) return;
      const updatedPrograms = { ...duties.servicePrograms };
      const currentServiceProgram = [...updatedPrograms[service]];
      currentServiceProgram.splice(index, 1);
      updatedPrograms[service] = currentServiceProgram;
      setDuties({ ...duties, servicePrograms: updatedPrograms });
  };

  const handleSave = async () => {
      if (!db || !db.collection || !duties) return;
      setSaving(true);
      try {
          await db.collection('weeklyDuties').doc('current').set(duties);
          alert("Duties updated successfully!");
      } catch (error) {
          console.error("Error saving:", error);
          alert("Failed to save.");
      }
      setSaving(false);
  };

  if (!isAdmin) return <div className="p-10 text-center text-red-500">Access Denied</div>;
  if (loading || !duties) return <div className="p-20 text-center"><Loader className="animate-spin mx-auto text-church-500"/></div>;

  return (
      <div className="bg-slate-50 min-h-screen py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                  <div>
                      <Link to="/admin" className="text-slate-500 hover:text-church-600 flex items-center mb-2"><ArrowLeft size={16} className="mr-1"/> Dashboard</Link>
                      <h1 className="text-3xl font-serif font-bold text-church-900">Weekly Duties Manager</h1>
                  </div>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-church-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-church-700 transition disabled:opacity-50">
                      {saving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>} Save Changes
                  </button>
              </div>

              <div className="space-y-8">
                  
                  {/* General Info */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">General Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Month</label>
                              <input className="w-full border p-3 rounded-lg" value={duties.month} onChange={e => handleFieldChange('month', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Week Range</label>
                              <input className="w-full border p-3 rounded-lg" value={duties.weekRange} onChange={e => handleFieldChange('weekRange', e.target.value)} />
                          </div>
                      </div>
                  </div>

                  {/* Key People */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Duty Assignees</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Zai Hruaitu</label>
                              <input className="w-full border p-3 rounded-lg" value={duties.zaiHruaitu} onChange={e => handleFieldChange('zaiHruaitu', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hla Hriltu</label>
                              <input className="w-full border p-3 rounded-lg" value={duties.hlaHriltu} onChange={e => handleFieldChange('hlaHriltu', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Piano Tumtu</label>
                              <input className="w-full border p-3 rounded-lg" value={duties.pianoTumtu} onChange={e => handleFieldChange('pianoTumtu', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Light & Sound</label>
                              <input className="w-full border p-3 rounded-lg" value={duties.lightAndSoundDuty} onChange={e => handleFieldChange('lightAndSoundDuty', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Biak In Pangpar</label>
                              <input className="w-full border p-3 rounded-lg" value={duties.pangparKhawitu || ''} onChange={e => handleFieldChange('pangparKhawitu', e.target.value)} />
                          </div>
                      </div>
                  </div>

                  {/* Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Thawhlawm Chhiartute (One per line)</label>
                          <textarea 
                              className="w-full border p-3 rounded-lg h-40" 
                              value={duties.thawhlawmChiartute.join('\n')} 
                              onChange={e => handleArrayChange('thawhlawmChiartute', e.target.value)} 
                          />
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Ushers (One per line)</label>
                          <textarea 
                              className="w-full border p-3 rounded-lg h-40" 
                              value={duties.ushers.join('\n')} 
                              onChange={e => handleArrayChange('ushers', e.target.value)} 
                          />
                      </div>
                  </div>

                  {/* Programs */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-6">Service Programs</h3>
                      
                      {/* Sunday School */}
                      <div className="mb-8">
                          <div className="flex justify-between items-center mb-4 pb-2 border-b">
                              <h4 className="font-bold text-church-600">Sunday School Program</h4>
                              <button onClick={() => addProgramField('sundaySchool')} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 flex items-center"><Plus size={14} className="mr-1"/> Add Item</button>
                          </div>
                          <div className="space-y-3">
                              {duties.servicePrograms.sundaySchool.map((item, idx) => (
                                  <div key={idx} className="flex gap-4 items-center">
                                      <div className="cursor-move text-slate-300"><GripVertical size={16}/></div>
                                      <input className="w-1/3 border p-2 rounded text-sm font-bold text-slate-500" placeholder="Label (e.g. Tantu)" value={item.label} onChange={e => handleProgramFieldChange('sundaySchool', idx, 'label', e.target.value)} />
                                      <input className="flex-1 border p-2 rounded text-sm" placeholder="Value" value={item.value} onChange={e => handleProgramFieldChange('sundaySchool', idx, 'value', e.target.value)} />
                                      <button onClick={() => removeProgramField('sundaySchool', idx)} className="text-red-400 hover:text-red-600"><Trash size={16}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Morning Service */}
                      <div className="mb-8">
                          <div className="flex justify-between items-center mb-4 pb-2 border-b">
                              <h4 className="font-bold text-church-600">Morning Service (Chawhnu)</h4>
                              <button onClick={() => addProgramField('morning')} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 flex items-center"><Plus size={14} className="mr-1"/> Add Item</button>
                          </div>
                          <div className="space-y-3">
                              {duties.servicePrograms.morning.map((item, idx) => (
                                  <div key={idx} className="flex gap-4 items-center">
                                      <div className="cursor-move text-slate-300"><GripVertical size={16}/></div>
                                      <input className="w-1/3 border p-2 rounded text-sm font-bold text-slate-500" placeholder="Label" value={item.label} onChange={e => handleProgramFieldChange('morning', idx, 'label', e.target.value)} />
                                      <input className="flex-1 border p-2 rounded text-sm" placeholder="Value" value={item.value} onChange={e => handleProgramFieldChange('morning', idx, 'value', e.target.value)} />
                                      <button onClick={() => removeProgramField('morning', idx)} className="text-red-400 hover:text-red-600"><Trash size={16}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Evening Service */}
                      <div>
                          <div className="flex justify-between items-center mb-4 pb-2 border-b">
                              <h4 className="font-bold text-church-600">Evening Service (Zan)</h4>
                              <button onClick={() => addProgramField('evening')} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 flex items-center"><Plus size={14} className="mr-1"/> Add Item</button>
                          </div>
                          <div className="space-y-3">
                              {duties.servicePrograms.evening.map((item, idx) => (
                                  <div key={idx} className="flex gap-4 items-center">
                                      <div className="cursor-move text-slate-300"><GripVertical size={16}/></div>
                                      <input className="w-1/3 border p-2 rounded text-sm font-bold text-slate-500" placeholder="Label" value={item.label} onChange={e => handleProgramFieldChange('evening', idx, 'label', e.target.value)} />
                                      <input className="flex-1 border p-2 rounded text-sm" placeholder="Value" value={item.value} onChange={e => handleProgramFieldChange('evening', idx, 'value', e.target.value)} />
                                      <button onClick={() => removeProgramField('evening', idx)} className="text-red-400 hover:text-red-600"><Trash size={16}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      </div>
  );
};

export default AdminDuties;
