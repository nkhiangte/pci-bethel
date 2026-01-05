
import React, { useState, useEffect } from 'react';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { Calendar as CalendarIcon, MapPin, Clock, Edit, Trash, Plus, X, Save, Loader, AlertCircle } from 'lucide-react';
import { Event } from '../types';

// Helper to get next occurrence of a day (0=Sun, 1=Mon, ..., 6=Sat)
const getNextDayOfWeek = (dayOfWeek: number) => {
  const now = new Date();
  const resultDate = new Date(now.getTime());
  resultDate.setDate(now.getDate() + (dayOfWeek + 7 - now.getDay()) % 7);
  return resultDate;
};

// Format date for Input field (YYYY-MM-DD)
const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const Events: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  
  const [displayEvents, setDisplayEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [language]);

  const fetchEvents = async () => {
    setLoading(true);

    const allConstantEvents = getConstants(language).events;
    
    // 1. Generate Virtual Events from Templates
    const virtualEvents: Event[] = allConstantEvents
      .filter(t => t.isRecurringTemplate && t.dayOfWeek !== undefined)
      .map(t => {
        const nextDate = getNextDayOfWeek(t.dayOfWeek!);
        const dateStr = formatDateForInput(nextDate);
        return {
          ...t,
          date: dateStr,
          id: `virtual_${t.id}_${dateStr}`,
          isRecurringTemplate: false
        };
      });

    // 2. Fetch Real Events from Firestore or use static fallback
    let realEvents: Event[] = [];
    try {
      if (db && db.collection) {
        const snapshot = await db.collection('events').get();
        realEvents = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
      } else {
        realEvents = allConstantEvents.filter(e => !e.isRecurringTemplate && e.date);
      }
    } catch (e) {
      console.error("Error fetching events:", e);
      realEvents = allConstantEvents.filter(e => !e.isRecurringTemplate && e.date);
    }
    
    // 3. Merge virtual and real events
    const mergedEventsMap = new Map<string, Event>();

    [...virtualEvents, ...realEvents].forEach(event => {
       const key = `${event.date}_${event.title}`;
       if (event.isCancelled) {
         // If a real event is a cancellation, ensure it removes a virtual one.
         mergedEventsMap.delete(key);
       } else {
         // Otherwise, it's either a virtual placeholder or a real override.
         // Real events (from DB or static) should overwrite virtual templates.
         const existing = mergedEventsMap.get(key);
         if (!existing || !existing.id.startsWith('virtual_')) {
            mergedEventsMap.set(key, event);
         }
       }
    });


    const finalEvents = Array.from(mergedEventsMap.values());
    finalEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setDisplayEvents(finalEvents);
    
    setLoading(false);
  };

  const handleEditClick = (event: Event) => {
    setEditForm({ ...event });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setEditForm({
      title: '',
      date: formatDateForInput(new Date()),
      time: '07:00 PM',
      type: 'Service',
      description: '',
      location: 'Biak In',
      program: {}
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!db || !db.collection) {
        alert("Database not available.");
        return;
    }
    
    setLoading(true);
    try {
      const eventRef = db.collection('events');
      let docRef;

      const isVirtual = editForm.id?.startsWith('virtual_');
      
      if (editForm.id && !isVirtual) {
        docRef = eventRef.doc(editForm.id);
      } else {
        docRef = eventRef.doc();
      }

      const dataToSave = { ...editForm };
      delete dataToSave.id;
      delete dataToSave.isCancelled; 

      await docRef.set(dataToSave, { merge: true });
      
      setIsEditing(false);
      setEditForm({});
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!db || !db.collection) return;
    
    if (id.startsWith('virtual_')) {
        const eventToDelete = displayEvents.find(e => e.id === id);
        if (eventToDelete) {
            try {
                await db.collection('events').add({
                    title: eventToDelete.title,
                    date: eventToDelete.date,
                    isCancelled: true,
                    type: 'Service'
                });
                setShowDeleteConfirm(null);
                fetchEvents();
            } catch (error) {
                console.error("Error cancelling virtual event:", error);
            }
        }
        return;
    }

    try {
      await db.collection('events').doc(id).delete();
      setShowDeleteConfirm(null);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const ProgramItem: React.FC<{label: string, value?: string}> = ({ label, value }) => value ? (
    <div className="flex text-sm"><span className="font-semibold text-slate-500 w-28 shrink-0">{label}:</span> <span className="font-medium text-slate-800">{value}</span></div>
  ) : null;

  const ProgramList: React.FC<{label: string, items?: string[]}> = ({ label, items }) => items && items.length > 0 ? (
      <div className="flex flex-col sm:flex-row text-sm"><span className="font-semibold text-slate-500 w-28 shrink-0">{label}:</span> 
          <div className="flex flex-col">
              {items.map((item, idx) => <span key={idx} className="font-medium text-slate-800">{item}</span>)}
          </div>
      </div>
  ) : null;

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-church-900">{t.events.title}</h1>
            {isAdmin && (
                <button 
                    onClick={handleAddNew}
                    className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 transition shadow-sm"
                >
                    <Plus size={18} className="mr-2" /> Add Event
                </button>
            )}
        </div>

        {loading && <div className="text-center py-10"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>}

        <div className="space-y-6">
          {!loading && displayEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row relative group hover:shadow-md transition">
              
              {isAdmin && (
                  <div className="absolute top-4 right-4 flex space-x-2 z-10 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-slate-100">
                      <button onClick={() => handleEditClick(event)} className="p-2 text-church-600 hover:bg-church-50 rounded-full transition" title="Edit"><Edit size={18} /></button>
                      <button onClick={() => setShowDeleteConfirm(event.id || '')} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition" title="Delete"><Trash size={18} /></button>
                  </div>
              )}

              <div className="bg-church-50 p-6 flex flex-col items-center justify-center md:w-40 border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                 <span className="text-church-600 font-bold text-xl uppercase tracking-wider">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                 <span className="text-slate-800 font-bold text-4xl my-1">{new Date(event.date).getDate()}</span>
                 <span className="text-slate-500 text-sm font-medium uppercase">{new Date(event.date).toLocaleString('default', { weekday: 'long' })}</span>
              </div>
              
              <div className="p-6 flex-1 pr-16">
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${ event.type === 'Service' ? 'bg-church-100 text-church-700' : 'bg-orange-100 text-orange-700'}`}> {event.type} </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{event.title}</h3>
                
                {event.program && Object.keys(event.program).length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-lg my-4 space-y-2 border border-slate-100">
                        <ProgramItem label="Hruaitu" value={event.program.hruaitu} />
                        <ProgramItem label="Ṭantu" value={event.program.tantu} />
                        <ProgramItem label="Thuhriltu" value={event.program.thuhriltu} />
                        <ProgramItem label="Hawngtu" value={event.program.hawngtu} />
                        <ProgramItem label="Thupui" value={event.program.thupui} />

                        {(event.program.solo || event.program.groupZai || event.program.thawhlawmKhawntute) && <div className="pt-2 mt-2 border-t border-slate-200" />}
                        <ProgramItem label="Solo" value={event.program.solo} />
                        <ProgramItem label="Group Zai" value={event.program.groupZai} />
                        <ProgramList label="Thawhlawm Khawntute" items={event.program.thawhlawmKhawntute} />
                        
                        {(event.program.khuangpu || event.program.pianist || event.program.guitarist || event.program.drummer || event.program.hlaHriltu || event.program.zaiHruaitu) && <div className="pt-2 mt-2 border-t border-slate-200" />}
                        <ProgramList label="Zai Hruaitu" items={event.program.zaiHruaitu} />
                        <ProgramList label="Khuangpu" items={event.program.khuangpu} />
                        <ProgramItem label="Pianist" value={event.program.pianist} />
                        <ProgramItem label="Guitarist" value={event.program.guitarist} />
                        <ProgramItem label="Drummer" value={event.program.drummer} />
                        <ProgramItem label="Hla Hriltu" value={event.program.hlaHriltu} />
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:space-x-6 text-sm text-slate-500 mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center mb-2 sm:mb-0"><Clock className="w-4 h-4 mr-2 text-church-500" /> {event.time}</div>
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-church-500" /> {event.location}</div>
                </div>
              </div>
            </div>
          ))}

          {!loading && displayEvents.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">{t.events.moreComing}</p>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-50">
                    <h3 className="text-xl font-bold text-church-900">{editForm.id && !editForm.id.startsWith('virtual_') ? 'Edit Event' : 'New Event / Program'}</h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-5 overflow-y-auto">
                    <input className="w-full border border-slate-300 rounded-lg p-2.5 text-lg font-bold" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="Event Title" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2.5" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} />
                        <input className="w-full border border-slate-300 rounded-lg p-2.5" value={editForm.time || ''} onChange={e => setEditForm({...editForm, time: e.target.value})} placeholder="Time" />
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-sm text-church-700 mb-3 uppercase tracking-wide">Program Details</h4>
                        <div className="space-y-3">
                           <div className="grid grid-cols-2 gap-3">
                                <input className="w-full border p-2 text-sm" value={editForm.program?.hruaitu || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, hruaitu: e.target.value}})} placeholder="Hruaitu (Conductor)" />
                                <input className="w-full border p-2 text-sm" value={editForm.program?.tantu || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, tantu: e.target.value}})} placeholder="Ṭantu (Reader)" />
                                <input className="w-full border p-2 text-sm" value={editForm.program?.thuhriltu || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, thuhriltu: e.target.value}})} placeholder="Thuhriltu (Preacher)" />
                                <input className="w-full border p-2 text-sm" value={editForm.program?.hawngtu || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, hawngtu: e.target.value}})} placeholder="Hawngtu (Opener)" />
                                <input className="w-full border p-2 text-sm col-span-2" value={editForm.program?.solo || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, solo: e.target.value}})} placeholder="Solo" />
                                <input className="w-full border p-2 text-sm col-span-2" value={editForm.program?.groupZai || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, groupZai: e.target.value}})} placeholder="Group Zai" />
                           </div>
                           <textarea className="w-full border p-2 text-sm" rows={3} value={editForm.program?.thawhlawmKhawntute?.join('\n') || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, thawhlawmKhawntute: e.target.value.split('\n')}})} placeholder="Thawhlawm Khawntute (one per line)"></textarea>
                           <textarea className="w-full border p-2 text-sm" rows={2} value={editForm.program?.zaiHruaitu?.join('\n') || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, zaiHruaitu: e.target.value.split('\n')}})} placeholder="Zai Hruaitu (one per line)"></textarea>
                           <textarea className="w-full border p-2 text-sm" rows={2} value={editForm.program?.khuangpu?.join('\n') || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, khuangpu: e.target.value.split('\n')}})} placeholder="Khuangpu (one per line)"></textarea>
                           <div className="grid grid-cols-2 gap-3">
                               <input className="w-full border p-2 text-sm" value={editForm.program?.pianist || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, pianist: e.target.value}})} placeholder="Pianist" />
                               <input className="w-full border p-2 text-sm" value={editForm.program?.guitarist || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, guitarist: e.target.value}})} placeholder="Guitarist" />
                               <input className="w-full border p-2 text-sm" value={editForm.program?.drummer || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, drummer: e.target.value}})} placeholder="Drummer" />
                               <input className="w-full border p-2 text-sm" value={editForm.program?.hlaHriltu || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, hlaHriltu: e.target.value}})} placeholder="Hla Hriltu" />
                           </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-xl">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center transition shadow-sm">
                        {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={18} className="mr-2" />} Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center text-red-600 mb-4"><AlertCircle className="w-6 h-6 mr-2" /><h3 className="text-lg font-bold">Confirm Delete</h3></div>
                  <p className="text-slate-600 mb-6">{showDeleteConfirm.startsWith('virtual_') ? "This will remove this specific occurrence from the schedule." : "Are you sure? This cannot be undone."}</p>
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                      <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm">Delete Event</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Events;