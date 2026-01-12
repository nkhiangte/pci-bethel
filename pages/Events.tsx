
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { Calendar as CalendarIcon, MapPin, Clock, Edit, Trash, Plus, X, Save, Loader, AlertCircle, Music, Archive } from 'lucide-react';
import { Event, WeeklyDuty, ArchiveEntry } from '../types';

// Helper to get specific dates for the current week (Monday to Sunday)
const getDatesForWeek = () => {
  const now = new Date();
  const day = now.getDay(); 
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  let diffToMonday;
  
  if (day === 0) { // Sunday
    if (hour > 19 || (hour === 19 && minute >= 30)) {
      diffToMonday = 1; // Transition to next week after 7:30 PM Sunday
    } else {
      diffToMonday = -6; // Previous Monday
    }
  } else {
    diffToMonday = 1 - day; 
  }
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates; 
};

const formatDateForInput = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

// Fuzzy Title Normalization: removes acronyms in brackets and extra spaces
const normalizeTitle = (title: string) => {
    return title.toLowerCase().replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
};

// Helper to convert "07:00 PM" string to minutes for correct sorting
const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3].toUpperCase();

    if (hours === 12) {
        hours = modifier === 'AM' ? 0 : 12;
    } else if (modifier === 'PM') {
        hours += 12;
    }
    
    return hours * 60 + minutes;
};

const Events: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  
  const [displayEvents, setDisplayEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const checkAndArchivePreviousWeek = useCallback(async () => {
    if (!isAdmin || !db?.collection) return;

    const weekDates = getDatesForWeek();
    const currentMonday = weekDates[0];
    
    const prevMonday = new Date(currentMonday);
    prevMonday.setDate(currentMonday.getDate() - 7);
    const prevSunday = new Date(currentMonday);
    prevSunday.setDate(currentMonday.getDate() - 1);
    
    const rangeStr = `${formatDateForInput(prevMonday)} to ${formatDateForInput(prevSunday)}`;
    const archiveTitle = `Weekly Program Archive: ${rangeStr}`;

    try {
      const existing = await db.collection('archives')
        .where('category', '==', 'Weekly Program')
        .where('title', '==', archiveTitle)
        .get();

      if (existing.empty) {
        setIsArchiving(true);
        const dutySnap = await db.collection('weeklyDuties').doc('current').get();
        const duties = dutySnap.exists ? (dutySnap.data() as WeeklyDuty) : null;

        const eventsSnap = await db.collection('events')
          .where('date', '>=', formatDateForInput(prevMonday))
          .where('date', '<=', formatDateForInput(prevSunday))
          .get();
        
        const prevEvents = eventsSnap.docs.map((doc: any) => doc.data() as Event);

        let description = `--- WEEKLY DUTY ROSTER ---\n`;
        if (duties) {
          description += `Week: ${duties.weekRange}\n`;
          description += `Zai Hruaitu: ${duties.zaiHruaitu}\n`;
          description += `Piano: ${duties.pianoTumtu}\n`;
          description += `Hla Hriltu: ${duties.hlaHriltu}\n`;
        }

        description += `--- SERVICE & PROGRAM RECORDS ---\n`;
        prevEvents.forEach(ev => {
          description += `[${ev.date}] ${ev.title}\n`;
          if (ev.program) {
            if (ev.program.hruaitu) description += `  Hruaitu: ${ev.program.hruaitu}\n`;
            if (ev.program.thuhriltu) description += `  Thuhriltu: ${ev.program.thuhriltu}\n`;
          }
          description += `\n`;
        });

        await db.collection('archives').add({
          title: archiveTitle,
          date: formatDateForInput(new Date()),
          category: 'Weekly Program',
          description: description,
          link: ''
        });
      }
    } catch (e) {
      console.error("Auto-archival error:", e);
    } finally {
      setIsArchiving(false);
    }
  }, [isAdmin]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const weekDates = getDatesForWeek();
    const virtualEvents: Event[] = [];
    const basePrograms = t.home.weeklyProgram;
    const dayOrder = [1, 2, 3, 4, 6, 0]; // Monday to Sunday order, skipped Friday (5)
    
    dayOrder.forEach(dayIndex => {
        const dateForDay = weekDates.find(d => d.getDay() === dayIndex);
        if (!dateForDay) return;

        const dateStr = formatDateForInput(dateForDay);
        const dailyTemplates = basePrograms.filter(p => p.dayOfWeek === dayIndex);
        
        dailyTemplates.forEach((template, tIdx) => {
            virtualEvents.push({
                id: `virtual_${template.name}_${dateStr}_${tIdx}`,
                title: template.name,
                date: dateStr,
                time: template.time,
                location: 'Biak In',
                description: '',
                type: 'Service',
                isRecurringTemplate: true,
                dayOfWeek: dayIndex,
                program: {}
            });
        });
    });

    let realEvents: Event[] = [];
    try {
      if (db && db.collection) {
        const snapshot = await db.collection('events')
            .where('date', '>=', formatDateForInput(weekDates[0]))
            .where('date', '<=', formatDateForInput(weekDates[6]))
            .get();
        if (!snapshot.empty) {
            realEvents = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Event[];
        }
      }
    } catch (e) {
      console.error("Fetch DB error:", e);
    }
    
    const mergedEventsMap = new Map<string, Event[]>();
    weekDates.forEach(d => mergedEventsMap.set(formatDateForInput(d), []));

    // Seed the map with virtual events
    virtualEvents.forEach(event => {
        const list = mergedEventsMap.get(event.date) || [];
        list.push(event);
        mergedEventsMap.set(event.date, list);
    });
    
    // Merge real events, evicting fuzzy-matched virtual slots
    realEvents.forEach(event => {
        const key = event.date;
        let list = mergedEventsMap.get(key) || [];
        const normReal = normalizeTitle(event.title);

        if (event.isCancelled) {
            // Remove matching templates if cancelled record exists
            list = list.filter(item => normalizeTitle(item.title) !== normReal);
        } else {
            // Evict template if a specific manual entry exists for this day/time
            const existingIdx = list.findIndex(item => normalizeTitle(item.title) === normReal);
            if (existingIdx !== -1) {
                list[existingIdx] = event; // Replace template with real data
            } else {
                list.push(event); // Add unique new event
            }
        }
        mergedEventsMap.set(key, list);
    });

    const finalEvents = Array.from(mergedEventsMap.values()).flat();
    finalEvents.sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        
        // Correct time sorting:
        return timeToMinutes(a.time) - timeToMinutes(b.time);
    });

    setDisplayEvents(finalEvents);
    setLoading(false);
    checkAndArchivePreviousWeek();
  }, [t.home.weeklyProgram, checkAndArchivePreviousWeek]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEditClick = (event: Event) => {
    setEditForm({ ...event, program: { hruaitu: '', tantu: '', thuhriltu: '', thupui: '', ...event.program } });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setEditForm({
      title: '',
      date: formatDateForInput(new Date()),
      time: '07:00 PM',
      type: 'Service',
      location: 'Biak In',
      program: { hruaitu: '', tantu: '', thuhriltu: '', thupui: '' }
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!db || !db.collection) return;
    setLoading(true);
    try {
      const isVirtual = editForm.id?.startsWith('virtual_');
      const docRef = (editForm.id && !isVirtual) ? db.collection('events').doc(editForm.id) : db.collection('events').doc();
      const dataToSave = { ...editForm };
      delete dataToSave.id;
      delete dataToSave.isCancelled; 
      await docRef.set(dataToSave, { merge: true });
      setIsEditing(false);
      fetchEvents();
    } catch (error) {
      alert("Failed to save.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!db || !db.collection) return;
    if (id.startsWith('virtual_')) {
        const ev = displayEvents.find(e => e.id === id);
        if (ev) {
            await db.collection('events').add({ title: ev.title, date: ev.date, isCancelled: true, type: 'Service' });
            setShowDeleteConfirm(null);
            fetchEvents();
        }
        return;
    }
    await db.collection('events').doc(id).delete();
    setShowDeleteConfirm(null);
    fetchEvents();
  };

  const ProgramItem: React.FC<{label: string, value?: string}> = ({ label, value }) => value ? (
    <div className="flex text-sm py-0.5"><span className="font-bold text-slate-600 w-32 shrink-0">{label}:</span> <span className="font-medium text-slate-900">{value}</span></div>
  ) : null;

  const weekDates = getDatesForWeek();

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-4xl font-serif font-bold text-church-900">{t.events.title}</h1>
                    {(new Date().getDay() === 0 && (new Date().getHours() > 19 || (new Date().getHours() === 19 && new Date().getMinutes() >= 30))) && (
                        <span className="bg-church-100 text-church-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Next Week</span>
                    )}
                </div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
                    {formatDateForInput(weekDates[0])} — {formatDateForInput(weekDates[6])}
                </p>
            </div>
            {isAdmin && (
                <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 transition shadow-sm font-bold">
                    <Plus size={18} className="mr-2" /> Add Program
                </button>
            )}
        </div>

        {loading && <div className="text-center py-10"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>}

        <div className="space-y-6">
          {!loading && displayEvents.map((event) => {
            const dateObj = parseLocalDate(event.date);
            // Replace Thuhriltu with Thupui Hawngtu for Nilai Zan services
            const isNilaiZan = normalizeTitle(event.title).includes('nilai');
            const speakerLabel = isNilaiZan ? "Thupui Hawngtu" : "Thuhriltu";

            return (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row relative group hover:shadow-md transition">
                {isAdmin && (
                    <div className="absolute top-4 right-4 flex space-x-2 z-10 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-slate-100">
                        <button onClick={() => handleEditClick(event)} className="p-2 text-church-600 hover:bg-church-50 rounded-full transition"><Edit size={18} /></button>
                        <button onClick={() => setShowDeleteConfirm(event.id || '')} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"><Trash size={18} /></button>
                    </div>
                )}
                <div className="bg-church-50 p-6 flex flex-col items-center justify-center md:w-40 border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                   <span className="text-church-600 font-bold text-xl uppercase tracking-wider">{dateObj.toLocaleString('default', { month: 'short' })}</span>
                   <span className="text-slate-800 font-bold text-4xl my-1">{dateObj.getDate()}</span>
                   <span className="text-slate-500 text-sm font-medium uppercase">{dateObj.toLocaleString('default', { weekday: 'long' })}</span>
                </div>
                <div className="p-6 flex-1 pr-16">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs font-bold px-2 py-1 rounded uppercase tracking-wide bg-church-100 text-church-700"> SERVICE </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{event.title}</h3>
                  {event.program && Object.values(event.program).some(v => !!v) && (
                      <div className="bg-slate-50 p-5 rounded-lg my-4 space-y-1 border border-slate-100 shadow-inner">
                          <ProgramItem label="Hruaitu" value={event.program.hruaitu} />
                          <ProgramItem label="Ṭantu" value={event.program.tantu} />
                          <ProgramItem label={speakerLabel} value={event.program.thuhriltu} />
                          <ProgramItem label="Thupui" value={event.program.thupui} />
                      </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:space-x-6 text-sm text-slate-500 mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center mb-2 sm:mb-0"><Clock className="w-4 h-4 mr-2 text-church-500" /> {event.time}</div>
                    <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-church-500" /> {event.location}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-church-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-church-900">Program Details</h3>
                    <button onClick={() => setIsEditing(false)}><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                        <input className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none transition" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="Service Name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                            <input type="date" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none transition" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Time</label>
                            <input className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none transition" value={editForm.time || ''} onChange={e => setEditForm({...editForm, time: e.target.value})} placeholder="e.g. 07:00 PM" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Hruaitu</label>
                            <input className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none transition" value={editForm.program?.hruaitu || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, hruaitu: e.target.value}})} placeholder="Conductor name" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                {normalizeTitle(editForm.title || '').includes('nilai') ? "Thupui Hawngtu" : "Thuhriltu"}
                            </label>
                            <input className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none transition" value={editForm.program?.thuhriltu || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, thuhriltu: e.target.value}})} placeholder="Preacher or Speaker name" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Thupui (Topic)</label>
                        <input className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none transition" value={editForm.program?.thupui || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, thupui: e.target.value}})} placeholder="Sermon or lesson topic" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Ṭantu (Reader)</label>
                        <input className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-church-500 outline-none transition" value={editForm.program?.tantu || ''} onChange={e => setEditForm({...editForm, program: {...editForm.program, tantu: e.target.value}})} placeholder="Name of person reading" />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-xl border-t">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-lg font-bold text-slate-600 hover:bg-white transition">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-church-600 text-white rounded-lg font-bold hover:bg-church-700 transition shadow-sm">Save Changes</button>
                </div>
            </div>
        </div>
      )}

      {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-sm w-full">
                  <h3 className="text-lg font-bold text-red-600 mb-4">Confirm Delete</h3>
                  <p className="text-slate-600 mb-6">Remove this occurrence from the schedule?</p>
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-slate-600 font-bold">Cancel</button>
                      <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded font-bold">Delete</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Events;
