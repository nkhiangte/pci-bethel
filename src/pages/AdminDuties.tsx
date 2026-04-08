
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { WeeklyDuty } from '../types';
import { getConstants } from '../constants';
import { Loader, Save, ArrowLeft, Plus, Trash, GripVertical, Share2, Copy, Check, MessageCircle, Send, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { findContactByName, getWhatsAppLink, generateReminderMessage, getReminderTemplate } from '../services/notificationService';

const AdminDuties: React.FC = () => {
  const { isAdmin } = useAuth();
  const [duties, setDuties] = useState<WeeklyDuty | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [template, setTemplate] = useState('');

  useEffect(() => {
    fetchDuties();
    const initTemplate = async () => {
      const t = await getReminderTemplate('mizo');
      setTemplate(t);
    };
    initTemplate();
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

  // --- Notification Logic ---

  const sendIndividualWhatsApp = async (name: string, role: string) => {
      if (!duties || !name || !name.trim()) return;
      
      const contact = await findContactByName(name.trim());
      const phone = contact?.phone || ''; // Fallback to manual entry if not found
      
      const message = generateReminderMessage(
        template,
        name.trim(),
        duties.weekRange,
        duties.month,
        role
      );

      const url = getWhatsAppLink(phone, message);
      window.open(url, '_blank');
  };

  const generateShareText = () => {
      if (!duties) return '';
      
      return `*CHAMPHAI BETHEL KOHHRAN*
*Inkhawm leh Rawngbawltu Ruatna*
_${duties.month} | ${duties.weekRange}_

🎵 *Zai Hruaitu:* ${duties.zaiHruaitu}
🎹 *Keyboard:* ${duties.pianoTumtu}
🎤 *Hla Hriltu:* ${duties.hlaHriltu}
🔊 *Light & Sound:* ${duties.lightAndSoundDuty}
🌸 *Pangpar:* ${duties.pangparKhawitu}

*PATHIANNI CHAWHNU*
${duties.servicePrograms.morning.map(p => `${p.label}: ${p.value}`).join('\n')}

*PATHIANNI ZAN*
${duties.servicePrograms.evening.map(p => `${p.label}: ${p.value}`).join('\n')}

*THAWHLALWM CHHIARTU*
${duties.thawhlawmChiartute.join(', ')}

*USHERS*
${duties.ushers.join(', ')}

_Hriattirna: A chunga hming tarlante khan mawhphurhna theuh i hlen ang u._`;
  };

  const handleCopyText = () => {
      const text = generateShareText();
      navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      });
  };

  const handleOpenSMS = () => {
      const text = generateShareText();
      window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  // Reusable Input Component with Notify Button
  const DutyField = ({ label, fieldKey }: { label: string, fieldKey: keyof WeeklyDuty }) => (
      <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
          <div className="flex gap-2">
              <input 
                  className="flex-1 border p-3 rounded-lg text-slate-800" 
                  value={duties?.[fieldKey] as string || ''} 
                  onChange={e => handleFieldChange(fieldKey, e.target.value)} 
              />
              <button 
                  onClick={() => sendIndividualWhatsApp(duties?.[fieldKey] as string, label)}
                  className="p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition border border-green-200"
                  title={`Send WhatsApp to ${label}`}
              >
                  <MessageCircle size={20} />
              </button>
          </div>
      </div>
  );

  // Reusable Component for Array Notifications
  const NotifyList = ({ names, role }: { names: string[], role: string }) => (
    <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Send size={10} /> Notify Individual {role}
        </p>
        <div className="flex flex-wrap gap-2">
            {names.map((name, i) => (
                <button 
                    key={i}
                    onClick={() => sendIndividualWhatsApp(name, role)}
                    className="flex items-center gap-1.5 bg-white text-slate-600 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-green-50 hover:text-green-700 hover:border-green-200 border border-slate-200 transition shadow-sm"
                >
                    {name} <MessageCircle size={12} className="opacity-50" />
                </button>
            ))}
            {names.length === 0 && <span className="text-xs text-slate-400 italic">No names added yet.</span>}
        </div>
    </div>
  );

  if (!isAdmin) return <div className="p-10 text-center text-red-500">Access Denied</div>;
  if (loading || !duties) return <div className="p-20 text-center"><Loader className="animate-spin mx-auto text-church-500"/></div>;

  return (
      <div className="bg-slate-50 min-h-screen py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                      <Link to="/admin" className="text-slate-500 hover:text-church-600 flex items-center mb-2"><ArrowLeft size={16} className="mr-1"/> Dashboard</Link>
                      <h1 className="text-3xl font-serif font-bold text-church-900">Weekly Duties Manager</h1>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={handleOpenSMS} className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-sm font-bold shadow-sm">
                          <Share2 size={16}/> SMS App
                      </button>
                      <button onClick={handleCopyText} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition text-sm font-bold shadow-sm">
                          {copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Copied!' : 'Copy for WhatsApp'}
                      </button>
                      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-church-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-church-700 transition disabled:opacity-50">
                          {saving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>} Save
                      </button>
                  </div>
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
                          <DutyField label="Zai Hruaitu" fieldKey="zaiHruaitu" />
                          <DutyField label="Hla Hriltu" fieldKey="hlaHriltu" />
                          <DutyField label="Piano Tumtu" fieldKey="pianoTumtu" />
                          <DutyField label="Light & Sound" fieldKey="lightAndSoundDuty" />
                          <DutyField label="Biak In Pangpar" fieldKey="pangparKhawitu" />
                      </div>
                  </div>

                  {/* Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Thawhlawm Chhiartute (One per line)</label>
                          <textarea 
                              className="w-full border p-3 rounded-lg h-40 font-mono text-sm" 
                              value={duties.thawhlawmChiartute.join('\n')} 
                              onChange={e => handleArrayChange('thawhlawmChiartute', e.target.value)} 
                          />
                          <NotifyList names={duties.thawhlawmChiartute} role="Thawhlawm Chhiartu" />
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Ushers (One per line)</label>
                          <textarea 
                              className="w-full border p-3 rounded-lg h-40 font-mono text-sm" 
                              value={duties.ushers.join('\n')} 
                              onChange={e => handleArrayChange('ushers', e.target.value)} 
                          />
                          <NotifyList names={duties.ushers} role="Usher" />
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
                                      <div className="flex-1 flex gap-2">
                                          <input className="flex-1 border p-2 rounded text-sm" placeholder="Value" value={item.value} onChange={e => handleProgramFieldChange('sundaySchool', idx, 'value', e.target.value)} />
                                          <button onClick={() => sendIndividualWhatsApp(item.value, item.label)} className="p-2 text-green-600 hover:bg-green-50 rounded border border-transparent hover:border-green-100" title="Notify">
                                              <MessageCircle size={16} />
                                          </button>
                                      </div>
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
                                      <div className="flex-1 flex gap-2">
                                          <input className="flex-1 border p-2 rounded text-sm" placeholder="Value" value={item.value} onChange={e => handleProgramFieldChange('morning', idx, 'value', e.target.value)} />
                                          <button onClick={() => sendIndividualWhatsApp(item.value, item.label)} className="p-2 text-green-600 hover:bg-green-50 rounded border border-transparent hover:border-green-100" title="Notify">
                                              <MessageCircle size={16} />
                                          </button>
                                      </div>
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
                                      <div className="flex-1 flex gap-2">
                                          <input className="flex-1 border p-2 rounded text-sm" placeholder="Value" value={item.value} onChange={e => handleProgramFieldChange('evening', idx, 'value', e.target.value)} />
                                          <button onClick={() => sendIndividualWhatsApp(item.value, item.label)} className="p-2 text-green-600 hover:bg-green-50 rounded border border-transparent hover:border-green-100" title="Notify">
                                              <MessageCircle size={16} />
                                          </button>
                                      </div>
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
