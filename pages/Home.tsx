
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';
import { WeeklyDuty } from '../types';
import { db } from '../services/firebase';
import { useVerseOfTheDay } from '../hooks/useVerseOfTheDay';
import { ClipboardList, Users, UserCircle, Radio, Music, ArrowRight, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const { weeklyDuty: staticDuty, announcements, pastors, elders } = getConstants(language);
  const [weeklyDuty, setWeeklyDuty] = useState<WeeklyDuty>(staticDuty);
  const { verse, loading: verseLoading, error: verseError } = useVerseOfTheDay();

  useEffect(() => {
    const fetchDuty = async () => {
      if (db && db.collection) {
        try {
          const doc = await db.collection('weeklyDuties').doc('current').get();
          if (doc.exists) {
            setWeeklyDuty(doc.data() as WeeklyDuty);
          }
        } catch (e) {
          console.error("Error fetching duties", e);
        }
      }
    };
    fetchDuty();
  }, [language]);

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

      {/* NEWS SECTION - Moved here as requested */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-900">{t.home.newsTitle}</h2>
          <Link to="/announcements" className="text-sm font-bold text-church-600 hover:text-church-700 flex items-center">
            {t.home.viewAll} <ArrowRight size={16} className="ml-1"/>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {announcements.slice(0, 3).map((item) => (
             <Link key={item.id} to="/announcements" className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition flex flex-col h-full">
                {item.imageUrl && (
                    <div className="h-40 bg-slate-200 overflow-hidden relative">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-800 uppercase tracking-wider shadow-sm">
                            {item.category}
                        </div>
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
         <div className="text-center mb-10">
            <h2 className="text-2xl font-serif font-bold text-slate-900">{t.home.puipate}</h2>
            <div className="h-1 w-20 bg-church-500 mx-auto mt-3 rounded-full"></div>
         </div>
         
         {/* Pastors */}
         <div className="flex justify-center gap-8 mb-12 flex-wrap">
            {pastors.map(p => (
               <div key={p.id} className="text-center group">
                   <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto mb-4 relative bg-slate-200">
                       <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                   </div>
                   <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                   <p className="text-sm text-church-600 font-medium uppercase tracking-wider">{p.role}</p>
               </div>
            ))}
         </div>

         {/* Elders Grid */}
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
            {elders.map(e => (
               <div key={e.id} className="text-center group cursor-pointer">
                   <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md mx-auto mb-3 bg-slate-200">
                       <img src={e.imageUrl} alt={e.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                   </div>
                   <h4 className="font-bold text-sm text-slate-800 leading-tight group-hover:text-church-700 transition-colors">{e.name}</h4>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{e.role}</p>
               </div>
            ))}
         </div>
         
         <div className="text-center mt-12">
            <Link to="/about" className="inline-flex items-center px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-church-700 transition shadow-sm">
               View All Leaders & Profiles <ChevronRight size={16} className="ml-2" />
            </Link>
         </div>
      </section>

    </div>
  );
};

export default Home;
