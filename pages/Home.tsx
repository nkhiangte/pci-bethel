
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ArrowRight, Bell, Calendar } from 'lucide-react';
import { CHURCH_NAME, getConstants } from '../constants';
import { getDailyVerse } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

const Home: React.FC = () => {
  const [verse, setVerse] = useState<{ text: string; reference: string } | null>(null);
  const { language, t } = useLanguage();
  
  const { announcements, events } = getConstants(language);

  const logoUrl = "https://i.ibb.co/mVw3Ftpw/PCI-logo.png";
  const heroBgUrl = "https://i.ibb.co/G4kcMqmM/117973144-786352218785464-3747589953800462999-n.jpg";

  useEffect(() => {
    const fetchVerse = async () => {
      // Try fetching from Gemini with current language
      const data = await getDailyVerse(language);
      if (data) {
        setVerse(data);
      } else {
        // Fallback
        setVerse(language === 'mizo' ? {
          text: "Aw LALPA, nang chu ka Pathian i ni a, ka chawimawi ang chia, i hming ka fak bawk ang.",
          reference: "Isaia 25:1"
        } : {
          text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
          reference: "Jeremiah 29:11"
        });
      }
    };
    fetchVerse();
  }, [language]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner */}
      <div 
        className="relative h-[600px] bg-cover bg-center flex items-center justify-center text-center px-4"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("${heroBgUrl}")` }}
      >
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <img 
            src={logoUrl} 
            alt="PCI Logo" 
            className="h-24 w-24 md:h-32 md:w-32 mb-6 drop-shadow-xl bg-white rounded-full p-1"
          />
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 tracking-wide shadow-sm">
            {CHURCH_NAME}
          </h1>
          <p className="text-xl md:text-2xl text-church-100 font-light mb-8">{t.home.heroTagline}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/about" className="px-8 py-3 bg-church-500 hover:bg-church-600 text-white rounded-full font-medium transition text-lg">
              {t.home.newHere}
            </Link>
            <Link to="/media" className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-full font-medium transition text-lg">
              {t.home.watchSermons}
            </Link>
          </div>
        </div>
      </div>

      {/* Verse of the Day (Gemini Powered) */}
      <div className="bg-church-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="uppercase tracking-widest text-xs font-semibold text-church-500 mb-2 block">{t.home.verseOfTheDay}</span>
          {verse ? (
            <blockquote className="font-serif text-xl md:text-2xl italic leading-relaxed text-slate-200">
              "{verse.text}"
              <footer className="text-sm mt-4 not-italic font-sans text-church-500 font-bold">— {verse.reference}</footer>
            </blockquote>
          ) : (
            <div className="animate-pulse h-20 bg-church-800 rounded w-3/4 mx-auto"></div>
          )}
        </div>
      </div>

      {/* Quick Info & Announcements */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Latest Announcements */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-serif font-bold text-slate-800">{t.home.latestAnnouncements}</h2>
              <Link to="/announcements" className="text-church-800 font-medium hover:underline flex items-center">
                {t.home.viewAll} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6">
              {announcements.slice(0, 3).map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-start">
                  <div className={`p-3 rounded-full mr-4 shrink-0 ${
                    item.category === 'Emergency' ? 'bg-red-100 text-red-600' : 'bg-church-100 text-church-600'
                  }`}>
                    <Bell className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.category} • {item.date}</span>
                    <h3 className="text-lg font-bold text-slate-800 mt-1 mb-2">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: Weekly Programme */}
          <div className="space-y-8">
            {/* Weekly Schedule Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-church-500">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-church-500" /> {t.home.weeklyProgramme}
              </h3>
              <div className="space-y-5">
                {events.filter(e => e.type === 'Service').map((event) => (
                  <div key={event.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-church-900">{event.title}</span>
                      <span className="text-xs font-bold text-church-500 bg-church-50 px-2 py-0.5 rounded">{event.time}</span>
                    </div>
                    
                    {event.program && (
                      <div className="text-xs text-slate-600 space-y-1 mt-2 bg-slate-50 p-2 rounded">
                        {event.program.thupui && (
                          <div className="flex">
                            <span className="font-semibold w-16 shrink-0 text-slate-500">{t.program.topic}:</span>
                            <span className="italic">"{event.program.thupui}"</span>
                          </div>
                        )}
                        {event.program.hawngtu && (
                          <div className="flex">
                            <span className="font-semibold w-16 shrink-0 text-slate-500">{t.program.opener}:</span>
                            <span>{event.program.hawngtu}</span>
                          </div>
                        )}
                        {event.program.thuhriltu && (
                          <div className="flex">
                            <span className="font-semibold w-16 shrink-0 text-slate-500">{t.program.speaker}:</span>
                            <span>{event.program.thuhriltu}</span>
                          </div>
                        )}
                        {event.program.tantu && (
                          <div className="flex">
                            <span className="font-semibold w-16 shrink-0 text-slate-500">{t.program.reader}:</span>
                            <span>{event.program.tantu}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
               <h3 className="text-xl font-bold mb-4 flex items-center relative z-10">
                <MapPin className="mr-2 text-church-500" /> {t.home.visitUs}
              </h3>
              <p className="text-slate-300 mb-4 relative z-10">
                Bethel Veng, Champhai<br/>
                {t.home.locationText}
              </p>
              <button className="w-full py-2 bg-church-500 hover:bg-church-400 text-white rounded font-medium transition relative z-10">
                {t.home.getDirections}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
