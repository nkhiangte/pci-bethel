
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Tag, Loader, Clock, User, BookOpen, Star, Music, Users, Flower2, Plus, Edit, Trash, Database, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { Announcement, Event, WeeklyDuty, Staff } from '../types';
import { getConstants } from '../constants';
import StatsCounter from '../components/StatsCounter';
import Card from '../components/Card'; // Import Card component
import { useAuth } from '../contexts/AuthContext';
import ElderEditModal from '../components/ElderEditModal'; // Import new modal component

// Format date for matching (YYYY-MM-DD)
const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  const [news, setNews] = useState<Announcement[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [weeklyProgramDetails, setWeeklyProgramDetails] = useState<any[]>([]);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [weeklyDuties, setWeeklyDuties] = useState<WeeklyDuty | null>(null);
  const [loadingDuties, setLoadingDuties] = useState(true);
  
  const [churchElders, setChurchElders] = useState<Staff[]>([]);
  const [loadingElders, setLoadingElders] = useState(true);
  const [isSeedingElders, setIsSeedingElders] = useState(false);
  const [isElderModalOpen, setIsElderModalOpen] = useState(false);
  const [editingElder, setEditingElder] = useState<Partial<Staff> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);


  const { announcements: staticNews, weeklyDuty: staticDuty, pastors: staticPastors, elders: staticElders } = getConstants(language);

  const getWeekDateRange = () => {
    const today = new Date();
    // Adjust so Monday is 0 and Sunday is 6
    const dayOfWeek = (today.getDay() + 6) % 7;

    // Calculate start of the week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    // Calculate end of the week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startMonth = startOfWeek.toLocaleString('en-US', { month: 'long' });
    const endMonth = endOfWeek.toLocaleString('en-US', { month: 'long' });
    const year = startOfWeek.getFullYear();
    const endYear = endOfWeek.getFullYear();
    const startDay = startOfWeek.getDate();
    const endDay = endOfWeek.getDate();

    let dateRange = '';
    if (year !== endYear) {
      dateRange = `${startDay} ${startMonth} ${year} - ${endDay} ${endMonth} ${endYear}`;
    } else if (startMonth !== endMonth) {
      dateRange = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    } else {
      dateRange = `${startDay} - ${endDay} ${startMonth} ${year}`;
    }
    return `(${dateRange})`;
  };

  const weekRange = getWeekDateRange();


  useEffect(() => {
    const fetchNews = async () => {
      setLoadingNews(true);
      if (!db || !db.collection) {
        setNews(staticNews);
        setLoadingNews(false);
        return;
      }
      try {
        const snapshot = await db.collection('announcements').orderBy('date', 'desc').get();
        if (!snapshot.empty) {
          const fetchedData = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          })) as Announcement[];
          setNews(fetchedData);
        } else {
          setNews(staticNews);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        setNews(staticNews);
      }
      setLoadingNews(false);
    };
    fetchNews();
  }, [language, staticNews]);
  
  useEffect(() => {
    const fetchAndProcessPrograms = async () => {
        setLoadingProgram(true);

        const today = new Date();
        const dayOfWeek = (today.getDay() + 6) % 7; 
        const startOfWeek = new Date(today);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        
        const allConstantEvents = getConstants(language).events;
        
        let realEvents: Event[] = [];
        try {
            if (db && db.collection) {
                const snapshot = await db.collection('events').get();
                if (!snapshot.empty) {
                   realEvents = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Event[];
                }
            }
        } catch (e) {
            console.error("Error fetching events:", e);
        }

        const basePrograms = t.home.weeklyProgram;

        const detailedPrograms = basePrograms.map(baseProg => {
            const programDate = new Date(startOfWeek);
            const dayOffset = (baseProg.dayOfWeek + 6) % 7;
            programDate.setDate(startOfWeek.getDate() + dayOffset);

            const dateStr = formatDateForInput(programDate);
            
            const specificEvent = realEvents.find(e => e.date === dateStr && !e.isCancelled);

            if (specificEvent) {
                return { ...baseProg, name: specificEvent.title, details: specificEvent.program };
            }
            
            const constantMatch = allConstantEvents.find(e => e.date === dateStr && e.program);
            if (constantMatch) {
               return { ...baseProg, name: constantMatch.title, details: constantMatch.program };
            }

            return baseProg;
        });
        
        setWeeklyProgramDetails(detailedPrograms);
        setLoadingProgram(false);
    };

    fetchAndProcessPrograms();
}, [language, t.home.weeklyProgram]);

 useEffect(() => {
    const fetchDuties = async () => {
        setLoadingDuties(true);
        if (!db?.doc) {
            setWeeklyDuties(staticDuty);
            setLoadingDuties(false);
            return;
        }
        try {
            const doc = await db.collection('weeklyDuties').doc('current').get();
            if (doc.exists) {
                setWeeklyDuties({ id: doc.id, ...doc.data() } as WeeklyDuty);
            } else {
                setWeeklyDuties(staticDuty);
            }
        } catch (error) {
            console.error("Error fetching weekly duties:", error);
            setWeeklyDuties(staticDuty);
        }
        setLoadingDuties(false);
    };
    fetchDuties();
  }, [language, staticDuty]);

  const fetchElders = useCallback(async () => {
    setLoadingElders(true);
    if (!db || !db.collection) {
      setChurchElders(staticElders);
      setLoadingElders(false);
      return;
    }
    try {
      // Removed .orderBy('name') to avoid requiring an index and potential permission errors.
      const snapshot = await db.collection('elders').get();
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
        // Client-side sort after fetching to maintain order
        fetchedData.sort((a, b) => a.name.localeCompare(b.name));
        setChurchElders(fetchedData);
      } else {
        setChurchElders(staticElders); // Fallback to static if collection is empty
      }
    } catch (error) {
      console.error("Error fetching elders:", error); // This is where the error is reported
      setChurchElders(staticElders); // Fallback on error
    }
    setLoadingElders(false);
  }, [staticElders]);

  useEffect(() => {
    fetchElders();
  }, [fetchElders]);

  const handleSeedElders = async () => {
    if (!db?.collection || !window.confirm("This will DELETE ALL existing elders and re-seed from the initial data. Are you sure?")) {
        return;
    }

    setIsSeedingElders(true);
    try {
        const eldersRef = db.collection('elders');
        
        // 1. Delete all existing documents
        const existingDocs = await eldersRef.get();
        if (!existingDocs.empty) {
            const deleteBatch = db.batch();
            existingDocs.docs.forEach((doc: any) => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
            console.log("Existing elders deleted.");
        }

        // 2. Add all new documents from staticElders
        const addBatch = db.batch();
        staticElders.forEach(elderData => {
            const newDocRef = eldersRef.doc(); // Firestore generates ID
            addBatch.set(newDocRef, elderData);
        });
        await addBatch.commit();
        console.log("Successfully seeded elders!");

        fetchElders(); // Refresh the list
        alert("Elder data seeding complete!");

    } catch (error) {
        console.error("Error seeding elder data:", error);
        alert("An error occurred during elder data seeding.");
    }
    setIsSeedingElders(false);
  };

  const handleSaveElder = async (elder: Staff) => {
    if (!db?.collection) return;
    setLoadingElders(true);
    try {
      const { id, ...dataToSave } = elder;
      if (id) {
        await db.collection('elders').doc(id).set(dataToSave, { merge: true });
      } else {
        await db.collection('elders').add(dataToSave);
      }
      setIsElderModalOpen(false);
      fetchElders();
    } catch (error) {
      console.error("Error saving elder:", error);
    }
    setLoadingElders(false);
  };

  const handleDeleteElder = async (id: string) => {
    if (!db?.collection || !window.confirm("Are you sure you want to delete this elder?")) return;
    setLoadingElders(true);
    try {
      await db.collection('elders').doc(id).delete();
      fetchElders();
    } catch (error) {
      console.error("Error deleting elder:", error);
    }
    setLoadingElders(false);
  };

  const featuredNews = news[0];
  const otherNews = news.slice(1);
  const seniorPastor = staticPastors.find(p => p.role === 'Senior Pastor');

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loadingNews ? (
            <div className="animate-pulse">
              <div className="h-12 w-1/2 bg-slate-200 rounded mb-8"></div>
              <div className="h-96 bg-slate-200 rounded-xl mb-8"></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="h-64 bg-slate-200 rounded-xl"></div>
                <div className="h-64 bg-slate-200 rounded-xl"></div>
                <div className="h-64 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-serif font-bold text-church-900 mb-8">{t.home.newsTitle || 'News & Updates'}</h1>

              {featuredNews && (
                <div className="mb-12 group">
                  <Link to="/announcements" className="block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                    <div 
                      className="relative h-[500px] bg-cover bg-center flex items-end p-8 text-white"
                      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(${featuredNews.imageUrl || 'https://picsum.photos/seed/church/1200/800'})` }}
                    >
                      <div className="max-w-3xl">
                        <span className="bg-church-500 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide">{featuredNews.category}</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold mt-4 mb-4 leading-tight drop-shadow-md">
                          {featuredNews.title}
                        </h2>
                        <p className="text-slate-200 text-lg mb-6 line-clamp-2 drop-shadow">
                          {featuredNews.content}
                        </p>
                        <div className="flex items-center text-sm font-medium text-slate-300">
                          <Calendar size={16} className="mr-2" /> {featuredNews.date}
                          <span className="mx-3">|</span>
                          <div className="flex items-center text-white font-bold group-hover:underline">
                            Read More <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherNews.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                    <Link to="/announcements" className="block">
                      <div className="aspect-video bg-slate-200 overflow-hidden">
                        <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center text-xs text-slate-500 mb-2">
                          <Tag size={14} className="mr-1.5 text-church-500" /> <span className="font-semibold uppercase">{item.category}</span>
                          <span className="mx-2">•</span>
                          <Calendar size={14} className="mr-1.5" /> <span>{item.date}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-church-700">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-3">
                          {item.content}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Kohhran Puipate (Leaders) Section */}
      <div className="py-16 bg-church-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-center text-church-900 mb-10">{t.home.puipate}</h2>
          
          {isAdmin && (
             <div className="text-center mb-8 flex flex-wrap justify-center gap-4">
                <button 
                  onClick={handleSeedElders} 
                  disabled={isSeedingElders}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                >
                  {isSeedingElders ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Database size={18} className="mr-2" />}
                  Seed Elders Data
                </button>
                <button 
                  onClick={() => { setEditingElder({role: 'Elder', name: '', imageUrl: '', description: ''}); setIsElderModalOpen(true); }}
                  className="inline-flex items-center px-6 py-2 bg-church-600 text-white rounded-full hover:bg-church-700 shadow-sm transition"
                >
                  <Plus size={18} className="mr-2" /> Add New Elder
                </button>
             </div>
          )}

          {loadingElders ? (
             <div className="text-center"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>
          ) : (
            <>
              <div className="grid lg:grid-cols-3 gap-8 justify-center mb-16">
                {/* Senior Pastor Card */}
                {seniorPastor && (
                  <Card className="text-center col-span-1 lg:col-start-2 border-t-4 border-church-500 relative group">
                    <img 
                      src={seniorPastor.imageUrl} 
                      alt={seniorPastor.name} 
                      className="w-full h-64 object-cover object-top" 
                    />
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-slate-900 mb-1">{seniorPastor.name}</h3>
                      <p className="text-church-700 font-semibold text-lg">{seniorPastor.role}</p>
                      {seniorPastor.description && (
                         <p className="text-sm text-slate-500 mt-2 italic">{seniorPastor.description}</p>
                      )}
                      {seniorPastor.period && (
                        <p className="text-sm text-slate-500 mt-1">{seniorPastor.period}</p>
                      )}
                      <Link to="/about" className="mt-4 inline-flex items-center text-church-600 hover:text-church-800 font-medium transition">
                        View All Leaders <ArrowRight size={16} className="ml-1" />
                      </Link>
                    </div>
                  </Card>
                )}
              </div>

              {/* Church Elders Grid */}
              <h3 className="text-2xl font-serif font-bold text-center text-church-900 mb-8">{t.home.kohhranElders}</h3>
              {churchElders.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {churchElders.map(elder => (
                    <Card key={elder.id} className="text-center relative group">
                      <img 
                        src={elder.imageUrl} 
                        alt={elder.name} 
                        className="w-full h-48 object-cover object-top" 
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-slate-900">{elder.name}</h3>
                        <p className="text-church-700 font-medium">{elder.role}</p>
                        {elder.description && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-3">{elder.description}</p>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingElder(elder); setIsElderModalOpen(true); }}
                            className="p-1.5 bg-church-50 text-church-600 rounded-full hover:bg-church-100 transition"
                            title="Edit Elder"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(elder.id || '')}
                            className="p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition"
                            title="Delete Elder"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-100">
                    <Shield size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No elders listed. {isAdmin && "Use the 'Seed Elders Data' button to populate."}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif font-bold text-center text-church-900 mb-2">{t.home.weeklyProgramme}</h2>
            <p className="text-center text-slate-500 font-medium -mt-1 mb-10">{weekRange}</p>

            {loadingDuties ? <div className="text-center"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>
            : weeklyDuties && (
                <div className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider border-b pb-2 mb-2">{weeklyDuties.month} Thla Thawhlawm Chiartu</h3>
                            <ul className="space-y-1 text-slate-700 text-sm list-disc list-inside">{weeklyDuties.thawhlawmChiartute.map((n,i) => <li key={i}>{n}</li>)}</ul>
                        </div>
                         <div>
                            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider border-b pb-2 mb-2">{weeklyDuties.month} Thla Buhfaitham Hralhtu</h3>
                            <ul className="space-y-1 text-slate-700 text-sm list-disc list-inside">{weeklyDuties.buhfaithamHralhtute.map((n,i) => <li key={i}>{n}</li>)}</ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider border-b pb-2 mb-2">{weeklyDuties.month} Thla Usher</h3>
                            <ul className="space-y-1 text-slate-700 text-sm list-disc list-inside">{weeklyDuties.ushers.map((n,i) => <li key={i}>{n}</li>)}</ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="font-bold text-center text-slate-800 uppercase tracking-wider mb-4">{weeklyDuties.weekRange} Kohhran Hun Ruatna</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                           <div className="bg-slate-50 p-3 rounded-lg"><h4 className="text-xs font-bold text-slate-500">Zai Hruaitu</h4><p className="text-sm font-semibold text-church-800 mt-1">{weeklyDuties.zaiHruaitu}</p></div>
                           <div className="bg-slate-50 p-3 rounded-lg"><h4 className="text-xs font-bold text-slate-500">Piano Tumtu</h4><p className="text-sm font-semibold text-church-800 mt-1">{weeklyDuties.pianoTumtu}</p></div>
                           <div className="bg-slate-50 p-3 rounded-lg"><h4 className="text-xs font-bold text-slate-500">Hla Hriltu</h4><p className="text-sm font-semibold text-church-800 mt-1">{weeklyDuties.hlaHriltu}</p></div>
                           <div className="bg-slate-50 p-3 rounded-lg"><h4 className="text-xs font-bold text-slate-500">Light & Sound</h4><p className="text-sm font-semibold text-church-800 mt-1">{weeklyDuties.lightAndSoundDuty}</p></div>
                           <div className="bg-slate-50 p-3 rounded-lg"><h4 className="text-xs font-bold text-slate-500">Pangpar Khawitu</h4><p className="text-sm font-semibold text-church-800 mt-1">{weeklyDuties.pangparKhawitu}</p></div>
                        </div>
                    </div>
                </div>
            )}

            {loadingProgram ? (
                <div className="text-center"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {weeklyProgramDetails.map((program) => (
                        <Link to="/events" key={program.day} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start space-x-4 hover:shadow-md hover:border-church-100 transition group">
                            <div className="p-3 bg-church-50 text-church-600 rounded-lg mt-1 group-hover:bg-church-100">
                                <Clock size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-church-800">{program.day}</h3>
                                <p className="text-church-700 font-semibold mb-2">{program.name}</p>
                                
                                {program.details ? (
                                    <div className="space-y-1 mt-2 bg-slate-50/50 p-2 rounded-md border border-slate-100">
                                        {program.details.hruaitu && ( <div className="flex items-center text-xs text-slate-600"><span className="font-bold w-16 shrink-0">Hruaitu:</span><span className="truncate">{program.details.hruaitu}</span></div>)}
                                        {program.details.tantu && ( <div className="flex items-center text-xs text-slate-600"><span className="font-bold w-16 shrink-0">Ṭantu:</span><span className="truncate">{program.details.tantu}</span></div>)}
                                        {program.details.thuhriltu && ( <div className="flex items-center text-xs text-slate-800 font-medium"><span className="font-bold w-16 shrink-0">Thusawi:</span><span className="truncate">{program.details.thuhriltu}</span></div>)}
                                        {program.details.hawngtu && ( <div className="flex items-center text-xs text-slate-600"><span className="font-bold w-16 shrink-0">Hawngtu:</span><span className="truncate">{program.details.hawngtu}</span></div>)}
                                        {program.details.thupui && ( <div className="flex items-center text-xs text-slate-800 font-medium pt-1 border-t border-slate-200 mt-1"><span className="font-bold w-16 shrink-0">Thupui:</span><span className="italic">{program.details.thupui}</span></div>)}
                                        {!program.details.hruaitu && !program.details.tantu && !program.details.thuhriltu && !program.details.thupui && ( <p className="text-sm text-slate-500">{program.time}</p>)}
                                    </div>
                                ) : ( <p className="text-sm text-slate-500 mt-1">{program.time}</p> )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
      </div>

      <StatsCounter />
      
      {/* Elder Edit/Add Modal */}
      {isElderModalOpen && editingElder && (
        <ElderEditModal
          elder={editingElder}
          onClose={() => { setIsElderModalOpen(false); setEditingElder(null); }}
          onSave={handleSaveElder}
          onDelete={handleDeleteElder}
          isLoading={loadingElders}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
        />
      )}
    </div>
  );
};

export default Home;