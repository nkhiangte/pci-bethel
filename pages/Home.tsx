
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';
import { WeeklyDuty, Announcement, Staff } from '../types';
import { db } from '../services/firebase';
import { useVerseOfTheDay } from '../hooks/useVerseOfTheDay';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, Users, UserCircle, Radio, Music, ArrowRight, Calendar, Clock, ChevronRight, Edit, Plus, X, BookOpen, Quote, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import StaffEditModal from '../components/StaffEditModal';

const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  const { weeklyDuty: staticDuty } = getConstants(language);
  
  const [weeklyDuty, setWeeklyDuty] = useState<WeeklyDuty>(staticDuty);
  const [latestNews, setLatestNews] = useState<Announcement[]>([]);
  const [pastors, setPastors] = useState<Staff[]>([]);
  const [elders, setElders] = useState<Staff[]>([]);
  const { verse, loading: verseLoading, error: verseError } = useVerseOfTheDay();

  // Admin & Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff>>({});
  const [targetCollection, setTargetCollection] = useState<'pastors' | 'elders' | 'proPastors'>('pastors');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<Staff | null>(null);

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!db || !db.collection) return;

    try {
        // Fetch Weekly Duty
        const dutyDoc = await db.collection('weeklyDuties').doc('current').get();
        if (dutyDoc.exists) {
            setWeeklyDuty(dutyDoc.data() as WeeklyDuty);
        }

        // Fetch Latest News (Limit 3)
        const newsSnap = await db.collection('announcements').orderBy('date', 'desc').limit(3).get();
        const newsData = newsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Announcement[];
        setLatestNews(newsData);

        // Fetch Pastors
        const pastorsSnap = await db.collection('pastors').orderBy('order', 'asc').get();
        const pastorsData = pastorsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Staff[];
        setPastors(pastorsData);

        // Fetch Elders
        const eldersSnap = await db.collection('elders').orderBy('order', 'asc').get();
        const eldersData = eldersSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Staff[];
        setElders(eldersData);

    } catch (e) {
        console.error("Error fetching homepage data", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, language]);

  // Admin Handlers
  const handleAddNew = (collection: 'pastors' | 'elders') => {
    setEditingStaff({ name: '', role: collection === 'elders' ? 'Upa' : 'Pastor', imageUrl: '', description: '', biography: '' });
    setTargetCollection(collection);
    setIsEditModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, staff: Staff, collection: 'pastors' | 'elders') => {
    e.stopPropagation();
    setEditingStaff(staff);
    setTargetCollection(collection);
    setIsEditModalOpen(true);
  };

  const handleSaveStaff = async (staff: Staff, collectionName: 'pastors' | 'elders' | 'proPastors') => {
    setIsSaving(true);
    try {
      if (staff.id) {
        await db.collection(collectionName).doc(staff.id).set(staff, { merge: true });
      } else {
        const currentList = collectionName === 'pastors' ? pastors : elders;
        const maxOrder = currentList.length > 0 ? Math.max(...currentList.map(s => s.order || 0)) : 0;
        await db.collection(collectionName).add({ ...staff, order: maxOrder + 1 });
      }
      setIsEditModalOpen(false);
      fetchData(); // Refresh list
      if (selectedLeader?.id === staff.id) setSelectedLeader(staff);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save to Firebase.");
    }
    setIsSaving(false);
  };

  const handleDeleteStaff = async (id: string, collectionName: 'pastors' | 'elders' | 'proPastors') => {
    setIsSaving(true);
    try {
      await db.collection(collectionName).doc(id).delete();
      setShowDeleteConfirm(null);
      setIsEditModalOpen(false);
      fetchData(); // Refresh list
      if (selectedLeader?.id === id) setSelectedLeader(null);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete.");
    }
    setIsSaving(false);
  };

  const renderVerseContent = () => {
    if (verseLoading) {
      return (
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-yellow-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-yellow-200 rounded w-1/2"></div>
        </div>
      );
    }
    if (verseError) return null;
    if (verse) {
      const verseParts = verse.match(/(.*) - ([\w\s]+ \d+:\d+.*)/);
      if (verseParts) {
        return (
          <>
            <p className="text-lg md:text-xl italic text-yellow-900 font-serif mb-2">"{verseParts[1]}"</p>
            <p className="text-sm font-bold text-yellow-700 uppercase tracking-widest">{verseParts[2]}</p>
          </>
        );
      }
      return <p className="text-lg italic text-yellow-900 font-serif">"{verse}"</p>;
    }
    return null;
  };

  return (
    <div className="space-y-16 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
      {/* Verse of the Day */}
      <section className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center shadow-sm">
        <h3 className="text-xs font-black text-yellow-600 uppercase tracking-[0.2em] mb-4">{t.home.verseOfTheDay}</h3>
        {renderVerseContent()}
      </section>

      {/* NEWS SECTION */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-900">{t.home.newsTitle}</h2>
          <Link to="/announcements" className="text-sm font-bold text-church-600 hover:text-church-700 flex items-center">
            {t.home.viewAll} <ArrowRight size={16} className="ml-1"/>
          </Link>
        </div>
        
        {latestNews.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
            {latestNews.map((item) => (
                <Link key={item.id} to="/announcements" className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition flex flex-col h-full">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                        <div className="h-40 bg-slate-200 overflow-hidden relative">
                            <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-800 uppercase tracking-wider shadow-sm">
                                {item.category}
                            </div>
                        </div>
                    ) : item.imageUrl ? (
                        <div className="h-40 bg-slate-200 overflow-hidden relative">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-800 uppercase tracking-wider shadow-sm">
                                {item.category}
                            </div>
                        </div>
                    ) : (
                        <div className="h-20 bg-church-50 flex items-center justify-center border-b border-church-100">
                             <div className="text-[10px] font-bold text-church-400 uppercase tracking-wider">{item.category}</div>
                        </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                        <p className="text-xs font-bold text-slate-400 mb-2">{item.date}</p>
                        <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-church-700 transition-colors">{item.title}</h3>
                        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed flex-1">{item.content}</p>
                        <div className="mt-4 flex items-center text-xs font-bold text-church-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                            Read More <ChevronRight size={12} className="ml-1"/>
                        </div>
                    </div>
                </Link>
            ))}
            </div>
        ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 italic">No recent announcements.</p>
            </div>
        )}
      </section>

      {/* Weekly Duty Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">Inkhawm & Rawngbawlna</h2>
                <p className="text-slate-500 text-sm mt-1">{weeklyDuty.weekRange}</p>
            </div>
            <Link to="/events" className="text-sm font-bold text-church-600 hover:text-church-700 flex items-center">
                View Full Schedule <ArrowRight size={16} className="ml-1"/>
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                <div className="bg-church-900 text-white p-6 flex items-center gap-3">
                    <ClipboardList size={22} className="text-church-400" />
                    <h4 className="text-sm font-black uppercase tracking-[0.2em]">Tun thla rawngbawltute</h4>
                </div>
                
                <div className="p-8 md:p-10 grid md:grid-cols-12 gap-y-12 md:gap-x-12">
                    <div className="md:col-span-4 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-church-50">
                            <Users size={16} className="text-church-600" />
                            <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Thawhlawm chhiartute</h5>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {weeklyDuty.thawhlawmChiartute?.map((name, i) => (
                                <div key={i} className="flex items-center gap-3 py-1.5 group">
                                    <div className="w-1 h-1 rounded-full bg-church-300 group-hover:bg-church-600 transition-colors"></div>
                                    <span className="text-sm font-bold text-slate-700">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-8 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-church-50">
                            <UserCircle size={16} className="text-church-600" />
                            <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Ushers (Male & Female)</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-0 divide-y divide-slate-50 border-t border-slate-50">
                            {weeklyDuty.ushers?.map((name, i) => (
                                <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-slate-50 group hover:bg-slate-50 transition-colors px-1">
                                    <span className="text-[9px] font-black text-church-300 group-hover:text-church-600">#</span>
                                    <span className="text-[12px] font-bold text-slate-600 truncate">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center gap-3">
                    <Radio size={22} className="text-church-700" />
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Tun kar rawngbawltute</h4>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-y-6">
                        <div className="group">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Zai Hruaitu</label>
                            <p className="text-sm font-black text-slate-800 group-hover:text-church-700 transition-colors">{weeklyDuty.zaiHruaitu || '-'}</p>
                            <div className="h-0.5 w-full bg-slate-50 mt-2"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Piano</label>
                                <p className="text-sm font-black text-slate-800">{weeklyDuty.pianoTumtu || '-'}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hla Hriltu</label>
                                <p className="text-sm font-black text-slate-800">{weeklyDuty.hlaHriltu || '-'}</p>
                            </div>
                        </div>
                        <div className="group">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Light & Sound</label>
                            <p className="text-sm font-black text-slate-800">{weeklyDuty.lightAndSoundDuty || '-'}</p>
                            <div className="h-0.5 w-full bg-slate-50 mt-2"></div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                                <Music size={10} className="text-church-400"/> Biak In Pangpar
                            </label>
                            <p className="text-sm font-bold text-slate-700 bg-church-50/50 p-2 rounded-lg border border-church-100 text-center">{weeklyDuty.pangparKhawitu || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Service Times Grid */}
      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><Clock size={20} className="mr-2 text-church-500"/> Service Times</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { title: 'Sunday School', time: weeklyDuty.serviceTimes?.sundaySchool || '10:00 AM', icon: Users },
                { title: 'Chawhnu Inkhawm', time: weeklyDuty.serviceTimes?.morning || '01:30 PM', icon: Calendar },
                { title: 'Zan Inkhawm', time: weeklyDuty.serviceTimes?.evening || '07:00 PM', icon: Music },
            ].map((s, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center">
                    <div className="p-3 bg-slate-50 text-church-600 rounded-lg mr-4">
                        <s.icon size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.title}</p>
                        <p className="text-xl font-black text-slate-800">{s.time}</p>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* LEADERS SECTION */}
      <section className="bg-gradient-to-b from-transparent to-slate-50/50 rounded-[3rem] py-8">
         <div className="text-center mb-10 relative">
            <h2 className="text-2xl font-serif font-bold text-slate-900">{t.home.puipate}</h2>
            <div className="h-1 w-20 bg-church-500 mx-auto mt-3 rounded-full"></div>
         </div>
         
         {/* Pastors */}
         <div className="mb-12">
             <div className="flex justify-center gap-8 flex-wrap relative">
                {isAdmin && (
                    <button 
                        onClick={() => handleAddNew('pastors')} 
                        className="absolute right-0 top-0 text-xs font-bold text-white bg-church-600 px-3 py-1 rounded-full hover:bg-church-700 flex items-center shadow-sm"
                    >
                        <Plus size={12} className="mr-1"/> Add Pastor
                    </button>
                )}
                {pastors.length === 0 ? (
                    <p className="text-slate-500 italic">No pastor data available.</p>
                ) : (
                    pastors.map(p => (
                    <div key={p.id} className="text-center group relative cursor-pointer" onClick={() => setSelectedLeader(p)}>
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto mb-4 relative bg-slate-200">
                            <img 
                                src={p.imageUrl} 
                                alt={p.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                style={{
                                    objectPosition: `${p.imagePositionX ?? 50}% ${p.imagePositionY ?? 0}%`,
                                    transform: `scale(${p.imageScale ?? 1})`
                                }}
                            />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                        <p className="text-sm text-church-600 font-medium uppercase tracking-wider">{p.role}</p>
                        
                        {isAdmin && (
                            <button 
                                onClick={(e) => handleEditClick(e, p, 'pastors')}
                                className="absolute top-0 right-0 p-1.5 bg-white text-church-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Edit size={14} />
                            </button>
                        )}
                    </div>
                    ))
                )}
             </div>
         </div>

         {/* Elders Grid */}
         <div className="relative">
             {isAdmin && (
                <div className="text-center mb-6">
                    <button onClick={() => handleAddNew('elders')} className="text-xs font-bold text-white bg-church-600 px-3 py-1 rounded-full hover:bg-church-700 flex items-center mx-auto shadow-sm">
                        <Plus size={12} className="mr-1"/> Add Elder
                    </button>
                </div>
             )}
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
                {elders.map(e => (
                <div key={e.id} className="text-center group cursor-pointer relative" onClick={() => setSelectedLeader(e)}>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md mx-auto mb-3 bg-slate-200">
                        <img 
                            src={e.imageUrl} 
                            alt={e.name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                            style={{
                                objectPosition: `${e.imagePositionX ?? 50}% ${e.imagePositionY ?? 0}%`,
                                transform: `scale(${e.imageScale ?? 1})`
                            }}
                        />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 leading-tight group-hover:text-church-700 transition-colors">{e.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{e.role}</p>
                    
                    {isAdmin && (
                        <button 
                            onClick={(event) => handleEditClick(event, e, 'elders')}
                            className="absolute top-0 right-4 p-1 bg-white text-church-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Edit size={12} />
                        </button>
                    )}
                </div>
                ))}
             </div>
         </div>
         
         <div className="text-center mt-12">
            <Link to="/about" className="inline-flex items-center px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-church-700 transition shadow-sm">
               View All Leaders & Profiles <ChevronRight size={16} className="ml-2" />
            </Link>
         </div>
      </section>

      {/* Staff Edit Modal */}
      {isEditModalOpen && (
          <StaffEditModal
            staff={editingStaff}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveStaff}
            onDelete={handleDeleteStaff}
            isLoading={isSaving}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            collectionName={targetCollection}
          />
      )}

      {/* BIOGRAPHY THEATER MODAL */}
      {selectedLeader && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedLeader(null)}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                
                {/* Header Profile Area */}
                <div className="relative h-48 md:h-56 shrink-0 bg-church-900 text-white flex items-end">
                    <img 
                        src={selectedLeader.imageUrl} 
                        className="absolute inset-0 w-full h-full object-cover opacity-40" 
                        alt="Profile BG"
                        style={{ objectPosition: `${selectedLeader.imagePositionX ?? 50}% ${selectedLeader.imagePositionY ?? 0}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-church-900 via-church-900/60 to-transparent"></div>
                    
                    <button 
                        onClick={() => setSelectedLeader(null)}
                        className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition text-white border border-white/20 z-20"
                    >
                        <X size={24} />
                    </button>

                    <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                        {/* Image */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white shrink-0">
                            <img 
                                src={selectedLeader.imageUrl} 
                                alt={selectedLeader.name} 
                                className="w-full h-full object-cover" 
                                style={{ objectPosition: `${selectedLeader.imagePositionX ?? 50}% ${selectedLeader.imagePositionY ?? 0}%` }}
                            />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <span className="inline-block bg-church-600 text-white text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full mb-3 shadow-lg">
                                {selectedLeader.role}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-serif font-black mb-2 leading-tight">
                                {selectedLeader.name}
                            </h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-church-200 opacity-90">
                                {selectedLeader.period && (
                                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest">
                                        <Calendar size={14} /> Ordination: {selectedLeader.period}
                                    </div>
                                )}
                                <div className="hidden md:block w-1 h-1 rounded-full bg-church-400"></div>
                                <div className="font-bold text-white uppercase tracking-widest text-xs">Champhai Bethel Kohhran</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-8 md:p-12 overflow-y-auto bg-white flex-1">
                    <div className="grid lg:grid-cols-12 gap-12">
                        {/* Bio Text */}
                        <div className="lg:col-span-8">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-px bg-slate-100 flex-1"></div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Biography & Testimonial</h3>
                                <div className="h-px bg-slate-100 flex-1"></div>
                            </div>
                            
                            {selectedLeader.biography ? (
                                <article className="prose prose-slate prose-lg max-w-none font-serif text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedLeader.biography}
                                </article>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <BookOpen size={40} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 italic">Detailed biography not yet added to Firebase.</p>
                                    {isAdmin && <p className="text-church-600 text-sm mt-2 font-bold underline cursor-pointer" onClick={() => {
                                        setEditingStaff(selectedLeader);
                                        setTargetCollection(
                                            pastors.some(p => p.id === selectedLeader.id) ? 'pastors' : 'elders'
                                        );
                                        setIsEditModalOpen(true);
                                    }}>Click here to add biography</p>}
                                </div>
                            )}
                        </div>

                        {/* Sidebar Info */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                                <Quote size={48} className="absolute -top-4 -left-4 text-church-100" />
                                <h4 className="text-xs font-black text-church-600 uppercase tracking-widest mb-4 relative z-10">Mission / Quote</h4>
                                <p className="text-slate-600 italic font-serif leading-relaxed relative z-10">
                                    "{selectedLeader.description}"
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Leadership Record</h4>
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-church-50 rounded-xl flex items-center justify-center text-church-600 shadow-inner">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Current Role</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedLeader.role}</p>
                                    </div>
                                </div>
                            </div>

                            {isAdmin && (
                                <button 
                                    onClick={() => {
                                        setEditingStaff(selectedLeader);
                                        setTargetCollection(
                                            pastors.some(p => p.id === selectedLeader.id) ? 'pastors' : 'elders'
                                        );
                                        setIsEditModalOpen(true);
                                    }}
                                    className="w-full py-4 bg-church-50 text-church-700 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-church-100 hover:bg-church-100 transition shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Edit size={14} /> Edit Firebase Record
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Footer Controls */}
                <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        © Champhai Bethel Kohhran Archives
                    </p>
                    <button 
                        onClick={() => setSelectedLeader(null)}
                        className="px-10 py-3 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition shadow-lg"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Home;
