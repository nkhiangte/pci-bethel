import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';
import { useVerseOfTheDay } from '../hooks/useVerseOfTheDay';
import Card from '../components/Card';
import { WeeklyDuty, Staff } from '../types';
import { db } from '../services/firebase';
import { Loader, Calendar, Clock, User, Music, BookOpen, ChevronRight, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { t, language } = useLanguage();
  const { verse, loading: verseLoading, error: verseError } = useVerseOfTheDay();
  const { weeklyDuty: staticWeeklyDuty, pastors: staticPastors } = getConstants(language);

  const [weeklyDuty, setWeeklyDuty] = useState<WeeklyDuty>(staticWeeklyDuty);
  const [loadingDuty, setLoadingDuty] = useState(true);
  const [churchPastors, setChurchPastors] = useState<Staff[]>(staticPastors);
  const [loadingPastors, setLoadingPastors] = useState(true);

  // Fetch Pastors
  const fetchPastors = useCallback(async () => {
    setLoadingPastors(true);
    if (!db || !db.collection) {
      setChurchPastors(staticPastors);
      setLoadingPastors(false);
      return;
    }
    try {
      const snapshot = await db.collection('pastors').orderBy('order', 'asc').orderBy('name', 'asc').get();
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
        
        const uniquePastors = fetchedData.filter((pastor, index, self) =>
          index === self.findIndex((t) => (
            t.name === pastor.name
          ))
        );

        setChurchPastors(uniquePastors);
      } else {
        setChurchPastors(staticPastors);
      }
    } catch (error) {
      console.error("Error fetching pastors:", error);
      setChurchPastors(staticPastors);
    }
    setLoadingPastors(false);
  }, [staticPastors]);

  // Fetch Weekly Duty
  const fetchWeeklyDuty = useCallback(async () => {
      setLoadingDuty(true);
      if (!db?.doc) {
          setWeeklyDuty(staticWeeklyDuty);
          setLoadingDuty(false);
          return;
      }
      try {
          const docRef = db.collection('weeklyDuties').doc('current');
          const docSnap = await docRef.get();
          if (docSnap.exists) {
              setWeeklyDuty(docSnap.data() as WeeklyDuty);
          } else {
              setWeeklyDuty(staticWeeklyDuty);
          }
      } catch (error) {
          console.error("Error fetching duty:", error);
          setWeeklyDuty(staticWeeklyDuty);
      }
      setLoadingDuty(false);
  }, [staticWeeklyDuty]);

  useEffect(() => {
      fetchPastors();
      fetchWeeklyDuty();
  }, [fetchPastors, fetchWeeklyDuty]);

  const renderVerseContent = () => {
    if (verseLoading) {
      return (
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      );
    }
    if (verseError) {
      return <p className="text-red-500 text-center text-sm">{verseError}</p>;
    }
    if (verse) {
      const verseParts = verse.match(/(.*) - ([\w\s]+ \d+:\d+.*)/);
      if (verseParts) {
        return (
          <>
            <p className="text-lg md:text-xl italic text-gray-700 font-serif">"{verseParts[1]}"</p>
            <p className="mt-2 text-md font-bold text-church-800">{verseParts[2]}</p>
          </>
        );
      }
      return <p className="text-lg md:text-xl italic text-gray-700 font-serif">"{verse}"</p>;
    }
    return null;
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative -mt-6 mb-12">
         <div className="relative h-[500px] w-full overflow-hidden">
            <div className="absolute inset-0 bg-church-900/60 z-10"></div>
            <img src="https://i.ibb.co/V06hg04Q/WEBBAN.png" className="w-full h-full object-cover" alt="Banner" />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 drop-shadow-lg">Mizoram Synod</h1>
                <h2 className="text-2xl md:text-4xl font-light mb-6">Champhai Bethel Kohhran</h2>
                <p className="text-lg md:text-xl max-w-2xl text-slate-200 mb-8 italic">"{t.home.heroTagline}"</p>
                <div className="flex gap-4">
                    <Link to="/about" className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/50 rounded-full hover:bg-white/30 transition font-medium">{t.home.newHere}</Link>
                    <Link to="/gallery/kohhran-hunpui" className="px-6 py-3 bg-church-600 rounded-full hover:bg-church-500 transition font-bold shadow-lg">{t.home.watchSermons}</Link>
                </div>
            </div>
         </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Verse of the Day */}
        <section>
            <div className="relative bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-church-100 text-center max-w-4xl mx-auto -mt-24 z-30">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-church-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-md">
                    {t.home.verseOfTheDay}
                </div>
                {renderVerseContent()}
            </div>
        </section>

        {/* Weekly Duties */}
        <section>
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                <h2 className="text-3xl font-serif font-bold text-church-900">{t.nav.duties}</h2>
                {weeklyDuty.weekRange && <span className="bg-church-100 text-church-800 px-4 py-1 rounded-full font-medium text-sm">{weeklyDuty.weekRange}</span>}
            </div>
            
            {loadingDuty ? (
                <div className="py-12 flex justify-center"><Loader className="animate-spin text-church-500" /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-l-4 border-church-500">
                        <div className="p-6">
                            <div className="flex items-center mb-3 text-church-600">
                                <User size={20} className="mr-2" />
                                <h3 className="font-bold uppercase text-xs tracking-wider">Hruaitu & Ṭantu</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="block text-xs text-slate-400 uppercase">Zai Hruaitu</span>
                                    <span className="font-medium text-slate-800">{weeklyDuty.zaiHruaitu || 'TBD'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 uppercase">Hla Hriltu</span>
                                    <span className="font-medium text-slate-800">{weeklyDuty.hlaHriltu || 'TBD'}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white border-l-4 border-blue-500">
                        <div className="p-6">
                            <div className="flex items-center mb-3 text-blue-600">
                                <Music size={20} className="mr-2" />
                                <h3 className="font-bold uppercase text-xs tracking-wider">Music & Sound</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="block text-xs text-slate-400 uppercase">Keyboard</span>
                                    <span className="font-medium text-slate-800">{weeklyDuty.pianoTumtu || 'TBD'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 uppercase">Light & Sound</span>
                                    <span className="font-medium text-slate-800">{weeklyDuty.lightAndSoundDuty || 'TBD'}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white border-l-4 border-green-500">
                        <div className="p-6">
                            <div className="flex items-center mb-3 text-green-600">
                                <User size={20} className="mr-2" />
                                <h3 className="font-bold uppercase text-xs tracking-wider">Thawhlawm & Ushers</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="block text-xs text-slate-400 uppercase">Thawhlawm Chhiar</span>
                                    <p className="font-medium text-slate-800 line-clamp-2">{weeklyDuty.thawhlawmChiartute?.join(', ') || 'TBD'}</p>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 uppercase">Ushers</span>
                                    <p className="font-medium text-slate-800 line-clamp-2">{weeklyDuty.ushers?.join(', ') || 'TBD'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white border-l-4 border-purple-500">
                        <div className="p-6">
                            <div className="flex items-center mb-3 text-purple-600">
                                <BookOpen size={20} className="mr-2" />
                                <h3 className="font-bold uppercase text-xs tracking-wider">Others</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="block text-xs text-slate-400 uppercase">Pangpar Khawitu</span>
                                    <span className="font-medium text-slate-800">{weeklyDuty.pangparKhawitu || 'TBD'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 uppercase">Buhfaitham Hralh</span>
                                    <p className="font-medium text-slate-800 line-clamp-2">{weeklyDuty.buhfaithamHralhtute?.join(', ') || 'TBD'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </section>

        {/* Service Times */}
        <section>
            <h2 className="text-3xl font-serif font-bold text-church-900 text-center mb-10">{t.home.serviceTimes}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6 bg-church-800 text-white rounded-t-lg">
                        <Calendar className="mx-auto mb-2 opacity-80" />
                        <h4 className="font-bold text-xl">{t.home.sundaySchool}</h4>
                    </div>
                    <div className="p-8">
                        <p className="text-3xl font-bold text-slate-800">10:00 AM</p>
                        <p className="text-slate-500 mt-2">Every Sunday</p>
                    </div>
                </Card>
                <Card className="text-center hover:shadow-xl transition-shadow duration-300 transform md:-translate-y-4 border-church-200 border-2">
                    <div className="p-6 bg-church-900 text-white rounded-t-lg">
                        <Clock className="mx-auto mb-2 opacity-80" />
                        <h4 className="font-bold text-xl">{t.home.morningService}</h4>
                    </div>
                    <div className="p-8">
                        <p className="text-3xl font-bold text-slate-800">01:30 PM</p>
                        <p className="text-slate-500 mt-2">Every Sunday</p>
                    </div>
                </Card>
                <Card className="text-center hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6 bg-church-800 text-white rounded-t-lg">
                        <Mic className="mx-auto mb-2 opacity-80" />
                        <h4 className="font-bold text-xl">{t.home.eveningService}</h4>
                    </div>
                    <div className="p-8">
                        <p className="text-3xl font-bold text-slate-800">07:00 PM</p>
                        <p className="text-slate-500 mt-2">Every Sunday</p>
                    </div>
                </Card>
            </div>
        </section>

        {/* Pastor Section */}
        {churchPastors.length > 0 && (
            <section className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg bg-slate-200">
                        <img src={churchPastors[0].imageUrl} alt={churchPastors[0].name} className="w-full h-full object-cover" />
                    </div>
                </div>
                <div className="md:w-2/3 text-center md:text-left">
                    <h2 className="text-3xl font-serif font-bold text-church-900 mb-2">Bialtu Pastor</h2>
                    <h3 className="text-xl text-slate-700 font-medium mb-4">{churchPastors[0].name}</h3>
                    <p className="text-slate-600 leading-relaxed text-lg italic mb-6">
                        "{churchPastors[0].description}"
                    </p>
                    <Link to="/about" className="inline-flex items-center text-church-600 font-bold hover:text-church-800">
                        View All Leaders <ChevronRight size={20} />
                    </Link>
                </div>
            </section>
        )}

      </div>
    </div>
  );
};
