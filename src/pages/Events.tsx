
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { Calendar as CalendarIcon, MapPin, Clock, Edit, Trash, Plus, X, Save, Loader, AlertCircle, Music, Archive, Bell, Flame, Search, CheckCircle2, Clock3, Filter } from 'lucide-react';
import { Event, WeeklyDuty, ArchiveEntry } from '../types';
import AutocompleteInput from '../components/AutocompleteInput';
import { useEventSuggestions } from '../hooks/useEventSuggestions';
import ReminderDashboard from '../components/ReminderDashboard';
import { 
  useWeeklyEvents, 
  useSeptemberBeihrual, 
  getDatesForWeek, 
  formatDateForInput, 
  parseLocalDate, 
  normalizeTitle, 
  isSeptemberDate,
  getMizoDayName
} from '../hooks/useWeeklyEvents';

const Events: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  const { suggestions } = useEventSuggestions();
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Tab state: 'weekly' or 'beihrual'
  const [activeTab, setActiveTab] = useState<'weekly' | 'beihrual'>(
    currentMonth === 8 ? 'beihrual' : 'weekly'
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'filled' | 'unfilled'>('all');

  const { displayEvents, loading: weeklyLoading, fetchEvents } = useWeeklyEvents();
  const { events: septEvents, loading: septLoading, fetchSeptemberMonth } = useSeptemberBeihrual(selectedYear);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

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
            if (ev.program.thuhriltu) description += `  Thuhriltu / Thupui Hawngtu: ${ev.program.thuhriltu}\n`;
            if (ev.program.thupui) description += `  Thupui: ${ev.program.thupui}\n`;
            if (ev.program.tantu) description += `  Ṭantu: ${ev.program.tantu}\n`;
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

  useEffect(() => {
    checkAndArchivePreviousWeek();
  }, [checkAndArchivePreviousWeek]);

  const handleEditClick = (event: Event) => {
    const isSunday = parseLocalDate(event.date).getDay() === 0;
    const isSept = isSeptemberDate(event.date);
    const isBeihrual = event.isBeihrual || (!isSunday && (isSept || event.title.toLowerCase().includes('beihrual')));
    setEditForm({ 
      ...event, 
      isBeihrual,
      program: { 
        hruaitu: '', 
        tantu: '', 
        thuhriltu: '', 
        thupui: '', 
        ...event.program 
      } 
    });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    const defaultDate = activeTab === 'beihrual' ? `${selectedYear}-09-01` : formatDateForInput(new Date());
    const isSunday = parseLocalDate(defaultDate).getDay() === 0;
    const isSept = isSeptemberDate(defaultDate);
    const isBeihrual = !isSunday && isSept;
    setEditForm({
      title: isBeihrual ? (language === 'en' ? 'Beihrual Service' : 'Beihrual Inkhawm') : '',
      date: defaultDate,
      time: '07:00 PM',
      type: 'Service',
      location: 'Biak In',
      isBeihrual: isBeihrual,
      program: { hruaitu: '', tantu: '', thuhriltu: '', thupui: '' }
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!db || !db.collection) return;
    setIsSaving(true);
    try {
      const isVirtual = editForm.id?.startsWith('virtual_');
      const docRef = (editForm.id && !isVirtual) ? db.collection('events').doc(editForm.id) : db.collection('events').doc();
      const dataToSave = { ...editForm };
      delete dataToSave.id;
      delete dataToSave.isCancelled; 
      
      const isSunday = editForm.date ? parseLocalDate(editForm.date).getDay() === 0 : false;
      const isSept = editForm.date ? isSeptemberDate(editForm.date) : false;
      if (!isSunday && (isSept || editForm.title?.toLowerCase().includes('beihrual'))) {
        dataToSave.isBeihrual = true;
      } else if (isSunday && !editForm.title?.toLowerCase().includes('beihrual')) {
        dataToSave.isBeihrual = false;
      }
      
      await docRef.set(dataToSave, { merge: true });
      setIsEditing(false);
      await fetchEvents();
      if (fetchSeptemberMonth) await fetchSeptemberMonth();
    } catch (error) {
      alert(t.stats.saveFail);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!db || !db.collection) return;
    const currentList = activeTab === 'beihrual' ? septEvents : displayEvents;
    if (id.startsWith('virtual_')) {
        const ev = currentList.find(e => e.id === id);
        if (ev) {
            await db.collection('events').add({ title: ev.title, date: ev.date, isCancelled: true, type: 'Service' });
            setShowDeleteConfirm(null);
            fetchEvents();
            if (fetchSeptemberMonth) fetchSeptemberMonth();
        }
        return;
    }
    await db.collection('events').doc(id).delete();
    setShowDeleteConfirm(null);
    fetchEvents();
    if (fetchSeptemberMonth) fetchSeptemberMonth();
  };

  const ProgramItem: React.FC<{label: string, value?: string, highlight?: boolean}> = ({ label, value, highlight }) => value ? (
    <div className="flex flex-col sm:flex-row text-sm py-1 border-b border-slate-100 last:border-0 sm:border-0">
      <span className="font-bold text-slate-500 sm:w-44 shrink-0">{label}:</span> 
      <span className={`font-semibold ${highlight ? 'text-church-900 bg-church-50/80 px-2 py-0.5 rounded' : 'text-slate-900'}`}>{value}</span>
    </div>
  ) : null;

  const weekDates = getDatesForWeek();

  // Filter September events if search or status filter active
  const filteredSeptEvents = septEvents.filter(ev => {
    const p = ev.program || {};
    const matchesSearch = !searchQuery || 
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.date.includes(searchQuery) ||
      (p.hruaitu && p.hruaitu.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tantu && p.tantu.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.thuhriltu && p.thuhriltu.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.thupui && p.thupui.toLowerCase().includes(searchQuery.toLowerCase()));

    const isFilled = !!(p.hruaitu || p.tantu || p.thuhriltu || p.thupui);
    const matchesStatus = filterStatus === 'all' ? true : (filterStatus === 'filled' ? isFilled : !isFilled);

    return matchesSearch && matchesStatus;
  });

  const filledCount = septEvents.filter(ev => {
    const p = ev.program || {};
    return !!(p.hruaitu && p.tantu && p.thuhriltu);
  }).length;

  const isFormSunday = editForm.date ? parseLocalDate(editForm.date).getDay() === 0 : false;
  const isFormBeihrual = !isFormSunday && (
    editForm.isBeihrual || 
    (editForm.date && isSeptemberDate(editForm.date)) || 
    (editForm.title && editForm.title.toLowerCase().includes('beihrual')) ||
    (editForm.title && editForm.title.toLowerCase().includes('nilai'))
  );

  const formSpeakerLabel = normalizeTitle(editForm.title || '').includes('sunday school') 
    ? 'Zirtirtu' 
    : (isFormBeihrual ? t.events.thupuiHawngtu : t.events.thuhriltu);

  const formTopicLabel = normalizeTitle(editForm.title || '').includes('sunday school') 
    ? 'Zirlai' 
    : t.events.thupui;

  return (
    <div className="py-8 sm:py-12 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header & Tab Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-church-900">{t.events.title}</h1>
                    {(new Date().getDay() === 0 && (new Date().getHours() > 19 || (new Date().getHours() === 19 && new Date().getMinutes() >= 30))) && activeTab === 'weekly' && (
                        <span className="bg-church-100 text-church-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">{t.events.nextWeek}</span>
                    )}
                </div>
                <p className="text-slate-500 text-sm font-medium">
                    {activeTab === 'weekly' 
                      ? `${formatDateForInput(weekDates[0])} — ${formatDateForInput(weekDates[6])}` 
                      : `${language === 'mizo' ? 'September Thla Zan Tin Inkhawm' : 'September Nightly Services'} (${selectedYear})`}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {isAdmin && (
                    <button 
                        onClick={() => setShowReminders(true)}
                        className="flex items-center px-3.5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition shadow-sm font-bold text-sm"
                    >
                        <Bell size={16} className="mr-1.5" /> {language === 'mizo' ? 'Hriattirna' : 'Reminders'}
                    </button>
                )}
                {isAdmin && (
                    <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 transition shadow-sm font-bold text-sm">
                        <Plus size={16} className="mr-1.5" /> {t.events.addProgram}
                    </button>
                )}
            </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between mb-8 gap-3">
            <div className="flex items-center w-full sm:w-auto p-0.5 bg-slate-100 rounded-lg">
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={`flex-1 sm:flex-initial px-5 py-2 rounded-md font-bold text-sm transition flex items-center justify-center gap-2 ${
                        activeTab === 'weekly' 
                            ? 'bg-white text-church-900 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Clock3 size={16} />
                    {t.events.viewWeekly}
                </button>
                <button
                    onClick={() => setActiveTab('beihrual')}
                    className={`flex-1 sm:flex-initial px-5 py-2 rounded-md font-bold text-sm transition flex items-center justify-center gap-2 ${
                        activeTab === 'beihrual' 
                            ? 'bg-amber-500 text-white shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Flame size={16} className={activeTab === 'beihrual' ? 'text-white' : 'text-amber-500'} />
                    {t.events.viewBeihrual}
                </button>
            </div>

            {activeTab === 'beihrual' && (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs font-bold text-slate-500">{language === 'mizo' ? 'Kum:' : 'Year:'}</span>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>

        {/* September Beihrual Header Card (When in Beihrual Tab) */}
        {activeTab === 'beihrual' && (
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
                        <Flame size={14} className="text-amber-200" />
                        {t.events.beihrualMonthBadge}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                        {language === 'mizo' ? `September ${selectedYear} Beihrual Inkhawm` : `September ${selectedYear} Beihrual Services`}
                    </h2>
                    <p className="text-amber-100 text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
                        {t.events.beihrualDesc}
                    </p>

                    {/* Progress / Status Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/20">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <span className="text-xs text-amber-100 font-medium block">{language === 'mizo' ? 'Zan Tin Inkhawm' : 'Total Services'}</span>
                            <span className="text-2xl font-black text-white">{septEvents.length}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <span className="text-xs text-amber-100 font-medium block">{language === 'mizo' ? 'Chanvo Ruat Fel' : 'Rosters Filled'}</span>
                            <span className="text-2xl font-black text-white">{filledCount}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 col-span-2 sm:col-span-1">
                            <span className="text-xs text-amber-100 font-medium block">{language === 'mizo' ? 'Ruat La Ngaite' : 'Pending Rosters'}</span>
                            <span className="text-2xl font-black text-amber-200">{septEvents.length - filledCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Search and Filters for September Beihrual */}
        {activeTab === 'beihrual' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder={language === 'mizo' ? 'Zawng rawh (Hruaitu, Thupui, Speaker...)' : 'Search by Leader, Topic, Speaker...'} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
                    <button 
                        onClick={() => setFilterStatus('all')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterStatus === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        {language === 'mizo' ? 'All (30)' : 'All (30)'}
                    </button>
                    <button 
                        onClick={() => setFilterStatus('filled')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${filterStatus === 'filled' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <CheckCircle2 size={12} />
                        {t.events.rosterComplete}
                    </button>
                    <button 
                        onClick={() => setFilterStatus('unfilled')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterStatus === 'unfilled' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        {t.events.needsRoster}
                    </button>
                </div>
            </div>
        )}

        {showReminders && (
            <ReminderDashboard 
                events={activeTab === 'beihrual' ? septEvents : displayEvents} 
                onClose={() => setShowReminders(false)} 
            />
        )}

        {/* Loading Spinner */}
        {((activeTab === 'weekly' && weeklyLoading) || (activeTab === 'beihrual' && septLoading)) && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Loader className="animate-spin h-8 w-8 mx-auto text-church-600 mb-2" />
                <p className="text-xs text-slate-500 font-bold">{language === 'mizo' ? 'Program te lakkhawm mek a ni...' : 'Loading schedules...'}</p>
            </div>
        )}

        {/* Event List Container */}
        {activeTab === 'weekly' && !weeklyLoading && (
            <div className="space-y-6">
              {displayEvents.map((event) => {
                const dateObj = parseLocalDate(event.date);
                const isSunday = dateObj.getDay() === 0;
                const normTitle = normalizeTitle(event.title);
                const isSept = dateObj.getMonth() === 8;
                const isBeihrual = event.isBeihrual || (!isSunday && (normTitle.includes('beihrual') || (isSept && event.time.includes('PM'))));
                const isNilaiZan = normTitle.includes('nilai');
                const isSundaySchool = normTitle.includes('sunday school');
                const speakerLabel = isSundaySchool ? "Zirtirtu" : ((isBeihrual || isNilaiZan) ? t.events.thupuiHawngtu : t.events.thuhriltu);
                const topicLabel = isSundaySchool ? "Zirlai" : t.events.thupui;

                const hasProgramDetails = event.program && Object.values(event.program).some(v => !!v && v.trim() !== '');

                return (
                  <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row relative group hover:shadow-md transition">
                    {isAdmin && (
                        <div className="absolute top-4 right-4 flex space-x-2 z-10 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-100">
                            <button 
                                onClick={() => handleEditClick(event)} 
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-church-700 hover:bg-church-50 rounded-lg transition"
                                title="Edit Program"
                            >
                                <Edit size={14} />
                                <span>{language === 'mizo' ? 'Siamrem' : 'Edit'}</span>
                            </button>
                            <button onClick={() => setShowDeleteConfirm(event.id || '')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash size={14} /></button>
                        </div>
                    )}
                    <div className={`${isBeihrual ? 'bg-amber-50 border-amber-100' : 'bg-church-50 border-slate-100'} p-6 flex flex-col items-center justify-center md:w-44 border-b md:border-b-0 md:border-r shrink-0`}>
                       <span className={`${isBeihrual ? 'text-amber-700' : 'text-church-600'} font-bold text-lg uppercase tracking-wider`}>{dateObj.toLocaleString('default', { month: 'short' })}</span>
                       <span className="text-slate-900 font-bold text-4xl my-1">{dateObj.getDate()}</span>
                       <span className="text-slate-500 text-xs font-bold uppercase">{getMizoDayName(dateObj)}</span>
                    </div>
                    <div className="p-6 flex-1 pr-4 sm:pr-24">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-church-100 text-church-700"> {t.events.service} </span>
                        {isBeihrual && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <Flame size={10} />
                                {t.events.beihrual}
                            </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">{event.title}</h3>
                      
                      {hasProgramDetails ? (
                          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl my-3 space-y-1.5 border border-slate-100">
                              <ProgramItem label={t.events.hruaitu} value={event.program?.hruaitu} />
                              <ProgramItem label={t.events.tantu} value={event.program?.tantu} />
                              <ProgramItem label={speakerLabel} value={event.program?.thuhriltu} highlight={true} />
                              <ProgramItem label={topicLabel} value={event.program?.thupui} />
                          </div>
                      ) : (
                          <div className="bg-slate-50/50 p-4 rounded-xl my-3 border border-dashed border-slate-200 text-slate-400 text-xs italic flex items-center justify-between">
                              <span>{language === 'mizo' ? 'Hun ruatna (Hruaitu, Ṭantu, Thupui Hawngtu) a la ruat lo.' : 'Program roster not yet assigned.'}</span>
                              {isAdmin && (
                                  <button onClick={() => handleEditClick(event)} className="text-church-600 font-bold hover:underline not-italic ml-2">
                                      + {t.events.fillRoster}
                                  </button>
                              )}
                          </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:space-x-6 text-xs font-medium text-slate-500 mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center mb-1 sm:mb-0"><Clock className="w-3.5 h-3.5 mr-1.5 text-church-500" /> {event.time}</div>
                        <div className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1.5 text-church-500" /> {event.location || 'Biak In'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        )}

        {/* September Beihrual 1-30 List */}
        {activeTab === 'beihrual' && !septLoading && (
            <div className="space-y-4">
              {filteredSeptEvents.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-500 font-medium">{language === 'mizo' ? 'Hemi mil inkhawm hmuh a ni lo.' : 'No services found matching your search.'}</p>
                  </div>
              ) : (
                  filteredSeptEvents.map((event) => {
                    const dateObj = parseLocalDate(event.date);
                    const isSunday = dateObj.getDay() === 0;
                    const isSundaySchool = normalizeTitle(event.title).includes('sunday school');
                    const hasProgram = event.program && (event.program.hruaitu || event.program.tantu || event.program.thuhriltu || event.program.thupui);
                    const isComplete = event.program?.hruaitu && event.program?.tantu && event.program?.thuhriltu;

                    const speakerLabel = isSundaySchool ? "Zirtirtu" : (isSunday ? t.events.thuhriltu : t.events.thupuiHawngtu);
                    const topicLabel = isSundaySchool ? "Zirlai" : t.events.thupui;

                    return (
                      <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-amber-300 transition overflow-hidden p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center w-24 shrink-0">
                                <span className="text-xs font-black uppercase text-amber-700 block">SEP</span>
                                <span className="text-2xl font-black text-slate-900 block leading-tight">{dateObj.getDate()}</span>
                                <span className="text-[10px] font-bold text-slate-600 uppercase block">{getMizoDayName(dateObj, true)}</span>
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                                        <Clock size={12} className="text-church-500" />
                                        {event.time}
                                    </span>
                                    {isComplete ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                            <CheckCircle2 size={10} />
                                            {t.events.rosterComplete}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                            {t.events.needsRoster}
                                        </span>
                                    )}
                                </div>

                                {hasProgram ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div>
                                            <span className="font-bold text-slate-500">{t.events.hruaitu}: </span>
                                            <span className="font-semibold text-slate-900">{event.program?.hruaitu || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500">{t.events.tantu}: </span>
                                            <span className="font-semibold text-slate-900">{event.program?.tantu || '—'}</span>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="font-bold text-church-700">{speakerLabel}: </span>
                                            <span className="font-bold text-slate-900">{event.program?.thuhriltu || '—'}</span>
                                        </div>
                                        {event.program?.thupui && (
                                            <div className="sm:col-span-2">
                                                <span className="font-bold text-slate-500">{topicLabel}: </span>
                                                <span className="font-medium text-slate-800 italic">{event.program?.thupui}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic mt-1">{language === 'mizo' ? 'Hruaitu, Ṭantu leh Thupui Hawngtu ruat a la ni lo.' : 'No roster assigned yet.'}</p>
                                )}
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                <button
                                    onClick={() => handleEditClick(event)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-church-50 text-church-700 hover:bg-church-100 border border-church-200 rounded-xl text-xs font-bold transition shadow-sm"
                                >
                                    <Edit size={14} />
                                    {hasProgram ? (language === 'mizo' ? 'Siamrem' : 'Edit') : t.events.fillRoster}
                                </button>
                            </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className={`p-5 sm:p-6 border-b flex justify-between items-center ${isFormBeihrual ? 'bg-amber-500 text-white' : 'bg-church-600 text-white'}`}>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg sm:text-xl font-bold">
                                {isFormBeihrual ? (language === 'mizo' ? 'Beihrual Program Ruatna' : 'Beihrual Service Setup') : t.events.programDetails}
                            </h3>
                            {isFormBeihrual && (
                                <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                                    September
                                </span>
                            )}
                        </div>
                        <p className="text-xs opacity-90 mt-0.5">
                            {isFormBeihrual 
                                ? (language === 'mizo' ? 'Hruaitu, Ṭantu, Thupui leh Thupui Hawngtu dahna' : 'Assign Conductor, Reader, Topic & Topic Opener') 
                                : t.events.programDetails}
                        </p>
                    </div>
                    <button onClick={() => setIsEditing(false)} className="p-1 rounded-full hover:bg-white/20 transition"><X size={20}/></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{t.events.form.title}</label>
                        <input 
                            className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-sm font-medium transition" 
                            value={editForm.title || ''} 
                            onChange={e => setEditForm({...editForm, title: e.target.value})} 
                            placeholder={t.events.form.placeholders.title} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{t.events.form.date}</label>
                            <input 
                                type="date" 
                                className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-sm font-medium transition" 
                                value={editForm.date || ''} 
                                onChange={e => {
                                    const val = e.target.value;
                                    const isSept = isSeptemberDate(val);
                                    setEditForm({
                                        ...editForm, 
                                        date: val,
                                        isBeihrual: isSept || editForm.isBeihrual
                                    });
                                }} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{t.events.form.time}</label>
                            <input 
                                className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-sm font-medium transition" 
                                value={editForm.time || ''} 
                                onChange={e => setEditForm({...editForm, time: e.target.value})} 
                                placeholder={t.events.form.placeholders.time} 
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <AutocompleteInput 
                                label={t.events.hruaitu}
                                value={editForm.program?.hruaitu || ''} 
                                onChange={val => setEditForm({...editForm, program: {...editForm.program, hruaitu: val}})} 
                                suggestions={suggestions}
                                placeholder={t.events.form.placeholders.conductor}
                            />
                            <AutocompleteInput 
                                label={t.events.form.reader}
                                value={editForm.program?.tantu || ''} 
                                onChange={val => setEditForm({...editForm, program: {...editForm.program, tantu: val}})} 
                                suggestions={suggestions}
                                placeholder={t.events.form.placeholders.reader}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{formTopicLabel}</label>
                            <input 
                                className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-sm font-medium transition" 
                                value={editForm.program?.thupui || ''} 
                                onChange={e => setEditForm({...editForm, program: {...editForm.program, thupui: e.target.value}})} 
                                placeholder={t.events.form.placeholders.topic} 
                            />
                        </div>

                        <AutocompleteInput 
                            label={formSpeakerLabel}
                            value={editForm.program?.thuhriltu || ''} 
                            onChange={val => setEditForm({...editForm, program: {...editForm.program, thuhriltu: val}})} 
                            suggestions={suggestions}
                            placeholder={isFormBeihrual ? (t.events.form.placeholders.thupuiHawngtu || 'Thupui hawngtu hming') : t.events.form.placeholders.preacher}
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-2xl border-t border-slate-100">
                    <button onClick={() => setIsEditing(false)} disabled={isSaving} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white transition text-sm disabled:opacity-50">{t.fellowship.cancel}</button>
                    <button onClick={handleSave} disabled={isSaving} className={`flex items-center px-6 py-2 ${isFormBeihrual ? 'bg-amber-600 hover:bg-amber-700' : 'bg-church-600 hover:bg-church-700'} text-white rounded-xl font-bold transition shadow-sm text-sm disabled:opacity-50`}>
                      {isSaving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                      {t.fellowship.save}
                    </button>
                </div>
            </div>
        </div>
      )}

      {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                  <h3 className="text-lg font-bold text-red-600 mb-2">{t.events.deleteConfirm}</h3>
                  <p className="text-slate-600 text-sm mb-6">{t.events.deleteSub}</p>
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-slate-600 font-bold text-sm">{t.fellowship.cancel}</button>
                      <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm shadow-sm">{t.announcements.deleteConfirm}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Events;

