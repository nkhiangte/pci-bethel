import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash, X, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarEvent {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: 'event' | 'meeting' | 'holiday' | 'other';
}

const Calendar: React.FC = () => {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'calendar_events'), (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'calendar_events');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDayClick = (day: number) => {
    if (!isAdmin) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setEditingEvent({ date: dateStr, title: '', description: '', type: 'event' });
    setIsModalOpen(true);
  };

  const handleEditEvent = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isAdmin || !db) return;
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'calendar_events', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `calendar_events/${id}`);
      }
    }
  };

  const handleSaveEvent = async () => {
    if (!isAdmin || !db || !editingEvent?.title || !editingEvent?.date) return;
    
    try {
      if (editingEvent.id) {
        await updateDoc(doc(db, 'calendar_events', editingEvent.id), editingEvent);
      } else {
        await addDoc(collection(db, 'calendar_events'), editingEvent);
      }
      setIsModalOpen(false);
      setEditingEvent(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'calendar_events');
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Weekday headers
    const headers = weekDays.map(day => (
      <div key={day} className="text-center font-bold text-slate-500 py-2 text-sm uppercase tracking-wider">
        {day}
      </div>
    ));

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-slate-50/50 border border-slate-100 min-h-[100px] md:min-h-[120px]"></div>);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();

      days.push(
        <div 
          key={i} 
          onClick={() => handleDayClick(i)}
          className={`border border-slate-100 min-h-[100px] md:min-h-[120px] p-2 transition-colors relative group ${isAdmin ? 'cursor-pointer hover:bg-slate-50' : ''} ${isToday ? 'bg-church-50/30' : 'bg-white'}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-church-600 text-white' : 'text-slate-700'}`}>
              {i}
            </span>
            {isAdmin && (
              <button className="opacity-0 group-hover:opacity-100 text-church-600 hover:bg-church-100 p-1 rounded transition-opacity">
                <Plus size={14} />
              </button>
            )}
          </div>
          <div className="space-y-1 mt-2 overflow-y-auto max-h-[70px] md:max-h-[90px] scrollbar-hide">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                onClick={(e) => handleEditEvent(e, event)}
                className={`text-xs p-1.5 rounded truncate flex justify-between items-center group/event ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''} ${
                  event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                  event.type === 'holiday' ? 'bg-red-100 text-red-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}
                title={event.title}
              >
                <span className="truncate font-medium">{event.title}</span>
                {isAdmin && (
                  <button 
                    onClick={(e) => handleDeleteEvent(e, event.id!)}
                    className="opacity-0 group-hover/event:opacity-100 text-red-500 hover:text-red-700 ml-1"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {headers}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-black text-slate-900 flex items-center gap-3">
              <CalendarIcon className="text-church-600" size={32} />
              Church Calendar
            </h1>
            <p className="text-slate-500 mt-1">View upcoming events and schedules.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 min-w-[150px] text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading calendar...</div>
        ) : (
          renderCalendar()
        )}

        {/* Event Modal */}
        {isModalOpen && editingEvent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">
                  {editingEvent.id ? 'Edit Event' : 'Add Event'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none"
                    value={editingEvent.date || ''}
                    onChange={e => setEditingEvent({...editingEvent, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                  <input 
                    type="text" 
                    placeholder="Event title"
                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none"
                    value={editingEvent.title || ''}
                    onChange={e => setEditingEvent({...editingEvent, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select 
                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none"
                    value={editingEvent.type || 'event'}
                    onChange={e => setEditingEvent({...editingEvent, type: e.target.value as any})}
                  >
                    <option value="event">Event</option>
                    <option value="meeting">Meeting</option>
                    <option value="holiday">Holiday</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Optional)</label>
                  <textarea 
                    placeholder="Event details..."
                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none min-h-[100px]"
                    value={editingEvent.description || ''}
                    onChange={e => setEditingEvent({...editingEvent, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEvent}
                  disabled={!editingEvent.title || !editingEvent.date}
                  className="px-6 py-2 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 transition-colors disabled:opacity-50"
                >
                  Save Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
