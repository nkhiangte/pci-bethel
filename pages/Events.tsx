
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
  const { events: templateEvents } = getConstants(language);
  const { isAdmin } = useAuth();
  
  const [displayEvents, setDisplayEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [language, templateEvents]);

  const fetchEvents = async () => {
    setLoading(true);
    
    // 1. Generate Virtual Events from Templates
    const virtualEvents: Event[] = templateEvents
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

    // 2. Fetch Real Events
    try {
      if (db && db.collection) {
        const snapshot = await db.collection('events').get();
        const realEvents = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        const mergedEventsMap = new Map<string, Event>();

        // Add virtual events first
        virtualEvents.forEach(ve => {
          const key = `${ve.date}_${ve.title}`; 
          mergedEventsMap.set(key, ve);
        });

        // Override or Add real events
        realEvents.forEach(re => {
          // Determine if this overrides a virtual event (same date/title)
          // Or if it's a standalone event
          const key = `${re.date}_${re.title}`;
          
          // If it's a "cancelled" record, we remove the virtual event from the map
          if (re.isCancelled) {
             mergedEventsMap.delete(key);
          } else {
             mergedEventsMap.set(key, re);
          }
        });

        const finalEvents = Array.from(mergedEventsMap.values());
        finalEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setDisplayEvents(finalEvents);
      } else {
        setDisplayEvents(virtualEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
    } catch (e) {
      console.error("Error fetching events:", e);
      setDisplayEvents(virtualEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
    
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
      program: {
        tantu: '',
        thuhriltu: '',
        thupui: '',
        hawngtu: ''
      }
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
      // Ensure it's not marked as cancelled if we are saving valid data
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
    
    // If deleting a virtual event, we need to persist a "Cancelled" record to prevent it from regenerating
    if (id.startsWith('virtual_')) {
        const eventToDelete = displayEvents.find(e => e.id === id);
        if (eventToDelete) {
            try {
                await db.collection('events').add({
                    title: eventToDelete.title,
                    date: eventToDelete.date,
                    isCancelled: true, // Mark as cancelled so fetch logic filters it out
                    type: 'Cancelled' // Optional metadata
                });
                setShowDeleteConfirm(null);
                fetchEvents();
            } catch (error) {
                console.error("Error cancelling virtual event:", error);
            }
        }
        return;
    }

    // Normal delete for real events
    try {
      await db.collection('events').doc(id).delete();
      setShowDeleteConfirm(null);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

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
              
              {/* Admin Controls */}
              {isAdmin && (
                  <div className="absolute top-4 right-4 flex space-x-2 z-10 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-slate-100">
                      <button 
                        onClick={() => handleEditClick(event)}
                        className="p-2 text-church-600 hover:bg-church-50 rounded-full transition"
                        title="Edit"
                      >
                          <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(event.id || '')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                        title="Delete"
                      >
                          <Trash size={18} />
                      </button>
                  </div>
              )}

              {/* Date Block */}
              <div className="bg-church-50 p-6 flex flex-col items-center justify-center md:w-40 border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                 <span className="text-church-600 font-bold text-xl uppercase tracking-wider">
                    {new Date(event.date).toLocaleString('default', { month: 'short' })}
                 </span>
                 <span className="text-slate-800 font-bold text-4xl my-1">
                    {new Date(event.date).getDate()}
                 </span>
                 <span className="text-slate-500 text-sm font-medium uppercase">
                    {new Date(event.date).toLocaleString('default', { weekday: 'short' })}
                 </span>
              </div>
              
              {/* Event Details */}
              <div className="p-6 flex-1 pr-16">
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${
                    event.type === 'Service' ? 'bg-blue-100 text-blue-700' : 
                    event.type === 'Meeting' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {event.type}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{event.title}</h3>
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">{event.description}</p>
                
                {/* Program Details */}
                {event.program && (
                    <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 border border-slate-100">
                        {event.program.thuhriltu && <div className="flex"><span className="font-bold text-slate-500 w-20 shrink-0">Speaker:</span> <span className="font-medium">{event.program.thuhriltu}</span></div>}
                        {event.program.tantu && <div className="flex"><span className="font-bold text-slate-500 w-20 shrink-0">Reader:</span> <span className="font-medium">{event.program.tantu}</span></div>}
                        {event.program.hawngtu && <div className="flex"><span className="font-bold text-slate-500 w-20 shrink-0">Opener:</span> <span className="font-medium">{event.program.hawngtu}</span></div>}
                        {event.program.thupui && <div className="col-span-1 sm:col-span-2 flex mt-1 pt-2 border-t border-slate-200"><span className="font-bold text-slate-500 w-20 shrink-0">Topic:</span> <span className="italic text-church-700 font-medium">"{event.program.thupui}"</span></div>}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:space-x-6 text-sm text-slate-500 mt-auto">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <Clock className="w-4 h-4 mr-2 text-church-500" /> {event.time}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-church-500" /> {event.location}
                  </div>
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

      {/* Edit/Add Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-50">
                    <h3 className="text-xl font-bold text-church-900">
                        {editForm.id && !editForm.id.startsWith('virtual_') ? 'Edit Event' : 'New Event / Program'}
                    </h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Event Title</label>
                        <input 
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-church-500 focus:border-church-500" 
                            value={editForm.title || ''} 
                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                            placeholder="e.g., Sunday Morning Service"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                            <input 
                                type="date"
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-church-500 focus:border-church-500" 
                                value={editForm.date || ''} 
                                onChange={e => setEditForm({...editForm, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Time</label>
                            <input 
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-church-500 focus:border-church-500" 
                                value={editForm.time || ''} 
                                onChange={e => setEditForm({...editForm, time: e.target.value})}
                                placeholder="e.g., 10:00 AM"
                            />
                        </div>
                    </div>
                    
                    {/* Program Section */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-sm text-church-700 mb-3 uppercase tracking-wide flex items-center">
                            <Clock size={14} className="mr-1" /> Service Program
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Speaker (Thuhriltu)</label>
                                <input 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-church-500 focus:ring-1 focus:ring-church-500" 
                                    value={editForm.program?.thuhriltu || ''} 
                                    onChange={e => setEditForm({
                                        ...editForm, 
                                        program: { ...editForm.program, thuhriltu: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Reader (Tantu)</label>
                                    <input 
                                        className="w-full border border-slate-300 rounded p-2 text-sm focus:border-church-500 focus:ring-1 focus:ring-church-500" 
                                        value={editForm.program?.tantu || ''} 
                                        onChange={e => setEditForm({
                                            ...editForm, 
                                            program: { ...editForm.program, tantu: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Opener (Hawngtu)</label>
                                    <input 
                                        className="w-full border border-slate-300 rounded p-2 text-sm focus:border-church-500 focus:ring-1 focus:ring-church-500" 
                                        value={editForm.program?.hawngtu || ''} 
                                        onChange={e => setEditForm({
                                            ...editForm, 
                                            program: { ...editForm.program, hawngtu: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Topic (Thupui)</label>
                                <input 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-church-500 focus:ring-1 focus:ring-church-500" 
                                    value={editForm.program?.thupui || ''} 
                                    onChange={e => setEditForm({
                                        ...editForm, 
                                        program: { ...editForm.program, thupui: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-2.5 h-20 focus:ring-2 focus:ring-church-500 focus:border-church-500" 
                            value={editForm.description || ''} 
                            onChange={e => setEditForm({...editForm, description: e.target.value})}
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-xl">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center transition shadow-sm"
                    >
                        {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={18} className="mr-2" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center text-red-600 mb-4">
                      <AlertCircle className="w-6 h-6 mr-2" />
                      <h3 className="text-lg font-bold">Confirm Delete</h3>
                  </div>
                  <p className="text-slate-600 mb-6">
                      {showDeleteConfirm.startsWith('virtual_') 
                        ? "This will remove this specific occurrence from the schedule."
                        : "Are you sure you want to delete this event? This cannot be undone."}
                  </p>
                  <div className="flex justify-end space-x-3">
                      <button 
                          onClick={() => setShowDeleteConfirm(null)} 
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={() => handleDelete(showDeleteConfirm)} 
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
                      >
                          Delete Event
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Events;
