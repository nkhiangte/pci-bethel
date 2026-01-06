
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Tag, Loader, Clock, User, BookOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { Announcement, Event } from '../types';
import { getConstants } from '../constants';
import StatsCounter from '../components/StatsCounter';

// Helper to get next occurrence of a day (0=Sun, 1=Mon, ..., 6=Sat)
const getNextDayOfWeek = (dayOfWeek: number) => {
  const now = new Date();
  const resultDate = new Date(now.getTime());
  const currentDay = now.getDay();
  const daysUntilNext = (dayOfWeek - currentDay + 7) % 7;
  resultDate.setDate(now.getDate() + daysUntilNext);
  return resultDate;
};

// Format date for matching (YYYY-MM-DD)
const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const [news, setNews] = useState<Announcement[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [weeklyProgramDetails, setWeeklyProgramDetails] = useState<any[]>([]);
  const [loadingProgram, setLoadingProgram] = useState(true);
  
  const { announcements: staticNews } = getConstants(language);

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
            const nextDate = getNextDayOfWeek(baseProg.dayOfWeek);
            const dateStr = formatDateForInput(nextDate);
            
            // Find a specific event for that date
            const specificEvent = realEvents.find(e => e.date === dateStr && !e.isCancelled);

            if (specificEvent) {
                return {
                    ...baseProg,
                    name: specificEvent.title,
                    details: specificEvent.program
                };
            }
            
            // Try to find if there's any matching constant data with detailed program
            const constantMatch = allConstantEvents.find(e => e.date === dateStr && e.program);
            if (constantMatch) {
               return {
                   ...baseProg,
                   name: constantMatch.title,
                   details: constantMatch.program
               };
            }

            return baseProg; // Fallback to base program
        });
        
        setWeeklyProgramDetails(detailedPrograms);
        setLoadingProgram(false);
    };

    fetchAndProcessPrograms();
}, [language, t.home.weeklyProgram]);


  const featuredNews = news[0];
  const otherNews = news.slice(1);

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

              {/* Featured News */}
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

              {/* Other News Grid */}
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

      {/* Weekly Program Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif font-bold text-center text-church-900 mb-10">{t.home.weeklyProgramme}</h2>
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
                                        {program.details.hruaitu && (
                                            <div className="flex items-center text-xs text-slate-600">
                                                <span className="font-bold w-16 shrink-0">Hruaitu:</span>
                                                <span className="truncate">{program.details.hruaitu}</span>
                                            </div>
                                        )}
                                        {program.details.tantu && (
                                            <div className="flex items-center text-xs text-slate-600">
                                                <span className="font-bold w-16 shrink-0">Ṭantu:</span>
                                                <span className="truncate">{program.details.tantu}</span>
                                            </div>
                                        )}
                                        {program.details.thuhriltu && (
                                            <div className="flex items-center text-xs text-slate-800 font-medium">
                                                <span className="font-bold w-16 shrink-0">Thusawi:</span>
                                                <span className="truncate">{program.details.thuhriltu}</span>
                                            </div>
                                        )}
                                        {program.details.hawngtu && (
                                            <div className="flex items-center text-xs text-slate-600">
                                                <span className="font-bold w-16 shrink-0">Hawngtu:</span>
                                                <span className="truncate">{program.details.hawngtu}</span>
                                            </div>
                                        )}
                                        {program.details.thupui && (
                                            <div className="flex items-center text-xs text-slate-800 font-medium pt-1 border-t border-slate-200 mt-1">
                                                <span className="font-bold w-16 shrink-0">Thupui:</span>
                                                <span className="italic">{program.details.thupui}</span>
                                            </div>
                                        )}
                                        {!program.details.hruaitu && !program.details.tantu && !program.details.thuhriltu && !program.details.thupui && (
                                           <p className="text-sm text-slate-500">{program.time}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 mt-1">{program.time}</p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
      </div>

      <StatsCounter />
      
    </div>
  );
};

export default Home;
