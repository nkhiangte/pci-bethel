
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';
import { useVerseOfTheDay } from '../hooks/useVerseOfTheDay';
import Card from '../components/Card';
import { WeeklyDuty, Staff } from '../types';
import { db } from '../services/firebase';
import { Loader, Calendar, Clock, User, Music, BookOpen, ChevronRight, Mic, Edit, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Home: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAdmin } = useAuth();
  const { verse, loading: verseLoading, error: verseError } = useVerseOfTheDay();
  const { weeklyDuty: staticWeeklyDuty, pastors: staticPastors, elders: staticElders } = getConstants(language);

  const [weeklyDuty, setWeeklyDuty] = useState<WeeklyDuty>(staticWeeklyDuty);
  const [loadingDuty, setLoadingDuty] = useState(true);
  const [churchPastors, setChurchPastors] = useState<Staff[]>(staticPastors);
  const [loadingPastors, setLoadingPastors] = useState(true);
  const [churchElders, setChurchElders] = useState<Staff[]>(staticElders);
  const [loadingElders, setLoadingElders] = useState(true);

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

  // Fetch Elders
  const fetchElders = useCallback(async () => {
    setLoadingElders(true);
    if (!db || !db.collection) {
      setChurchElders(staticElders);
      setLoadingElders(false);
      return;
    }
    try {
      const snapshot = await db.collection('elders').orderBy('order', 'asc').orderBy('name', 'asc').get();
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
        setChurchElders(fetchedData);
      } else {
        setChurchElders(staticElders);
      }
    } catch (error) {
      console.error("Error fetching elders:", error);
      setChurchElders(staticElders);
    }
    setLoadingElders(false);
  }, [staticElders]);

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
      fetchElders();
      fetchWeeklyDuty();
  }, [fetchPastors, fetchElders, fetchWeeklyDuty]);

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
    <div className="space-y-12 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Verse of the Day */}
        <section className="mt-8">
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-church-100 text-center max-w-4xl mx-auto relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-church-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-md">
                    {t.home.verseOfTheDay}
                </div>
                {renderVerseContent()}
            </div>
        </section>

        {/* Weekly Duties */}
        <section>
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-serif font-bold text-church-900">{t.nav.duties}</h2>
                    {isAdmin && (
                        <Link to="/admin/duties" className="text-slate-400 hover:text-church-600 transition" title="Edit Duties">
                            <Edit size={20} />
                        </Link>
                    )}
                </div>
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

        {/* Service Times (Inkhawm Hun) */}
        <section>
            <div className="text-center mb-10 relative">
                <h2 className="text-3xl font-serif font-bold text-church-900 inline-block">{t.home.serviceTimes}</h2>
                {isAdmin && (
                    <Link to="/admin/duties" className="absolute ml-3 text-slate-400 hover:text-church-600 transition inline-block" title="Edit Service Times">
                        <Edit size={20} />
                    </Link>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6 bg-church-800 text-white rounded-t-lg">
                        <Calendar className="mx-auto mb-2 opacity-80" />
                        <h4 className="font-bold text-xl">{weeklyDuty.serviceTitles?.sundaySchool || t.home.sundaySchool}</h4>
                    </div>
                    <div className="p-8 flex flex-col items-center justify-center min-h-[160px]">
                        <p className="text-xl font-bold text-slate-800 mb-3 leading-tight">{weeklyDuty.servicePrograms?.sundaySchool || 'Program TBD'}</p>
                        <div className="inline-flex items-center bg-church-50 text-church-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Clock size={14} className="mr-1"/> {weeklyDuty.serviceTimes?.sundaySchool || '10:00 AM'}
                        </div>
                    </div>
                </Card>
                <Card className="text-center hover:shadow-xl transition-shadow duration-300 transform md:-translate-y-4 border-church-200 border-2">
                    <div className="p-6 bg-church-900 text-white rounded-t-lg">
                        <Clock className="mx-auto mb-2 opacity-80" />
                        <h4 className="font-bold text-xl">{weeklyDuty.serviceTitles?.morning || t.home.morningService}</h4>
                    </div>
                    <div className="p-8 flex flex-col items-center justify-center min-h-[160px]">
                        <p className="text-xl font-bold text-slate-800 mb-3 leading-tight">{weeklyDuty.servicePrograms?.morning || 'Program TBD'}</p>
                        <div className="inline-flex items-center bg-church-50 text-church-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Clock size={14} className="mr-1"/> {weeklyDuty.serviceTimes?.morning || '01:30 PM'}
                        </div>
                    </div>
                </Card>
                <Card className="text-center hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6 bg-church-800 text-white rounded-t-lg">
                        <Mic className="mx-auto mb-2 opacity-80" />
                        <h4 className="font-bold text-xl">{weeklyDuty.serviceTitles?.evening || t.home.eveningService}</h4>
                    </div>
                    <div className="p-8 flex flex-col items-center justify-center min-h-[160px]">
                        <p className="text-xl font-bold text-slate-800 mb-3 leading-tight">{weeklyDuty.servicePrograms?.evening || 'Program TBD'}</p>
                        <div className="inline-flex items-center bg-church-50 text-church-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Clock size={14} className="mr-1"/> {weeklyDuty.serviceTimes?.evening || '07:00 PM'}
                        </div>
                    </div>
                </Card>
            </div>
        </section>

        {/* Mid-Week Programs */}
        {weeklyDuty.midWeek && (
            <section className="mb-12">
                <div className="text-center mb-8 relative">
                    <h2 className="text-2xl font-serif font-bold text-slate-800 inline-block">Mid-Week Services</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Nilai Zan */}
                    <Card className="border border-slate-200 bg-white">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-church-100 p-2 rounded-lg text-church-600"><Sun size={24}/></div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{weeklyDuty.midWeek.nilai.title || 'Nilai Zan Inkhawm'}</h3>
                                        <span className="text-sm text-slate-500">{weeklyDuty.midWeek.nilai.time || '07:00 PM'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Hruaitu:</span> <span className="font-medium text-slate-800">{weeklyDuty.midWeek.nilai.hruaitu || 'TBD'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Ṭantu:</span> <span className="font-medium text-slate-800">{weeklyDuty.midWeek.nilai.tantu || 'TBD'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Thupui:</span> <span className="font-medium text-slate-800">{weeklyDuty.midWeek.nilai.thupui || 'TBD'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Hawngtu:</span> <span className="font-medium text-slate-800">{weeklyDuty.midWeek.nilai.thuhriltu || 'TBD'}</span></div>
                            </div>
                        </div>
                    </Card>

                    {/* Inrinni Zan */}
                    <Card className="border border-slate-200 bg-white">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Moon size={24}/></div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{weeklyDuty.midWeek.inrinni.title || 'Inrinni Zan Inkhawm'}</h3>
                                        <span className="text-sm text-slate-500">{weeklyDuty.midWeek.inrinni.time || '07:00 PM'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Hruaitu:</span> <span className="font-medium text-slate-800">{weeklyDuty.midWeek.inrinni.hruaitu || 'TBD'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Ṭantu:</span> <span className="font-medium text-slate-800">{weeklyDuty.midWeek.inrinni.tantu || 'TBD'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Thupui:</span> <span className="font-medium text-slate-800">{weeklyDuty.midWeek.inrinni.thupui || 'TBD'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Thuhriltu:</span> <span className="font-medium text-slate-800">{weeklyDuty.midWeek.inrinni.thuhriltu || 'TBD'}</span></div>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>
        )}

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

        {/* Elders Section */}
        <section>
            <div className="text-center mb-10">
                <h2 className="text-3xl font-serif font-bold text-church-900 mb-2">{t.home.kohhranElders}</h2>
                <div className="h-1 w-20 bg-church-500 mx-auto rounded-full"></div>
            </div>
            
            {loadingElders ? (
                <div className="py-12 flex justify-center"><Loader className="animate-spin text-church-500" /></div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {churchElders.map((elder) => (
                        <Card key={elder.id} className="text-center p-6 hover:shadow-xl transition-all duration-300 border border-slate-100">
                            <div className="h-40 w-40 mx-auto rounded-full overflow-hidden mb-4 bg-slate-200 shadow-md ring-4 ring-slate-50">
                                <img 
                                    src={elder.imageUrl} 
                                    alt={elder.name} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <h3 className="font-bold text-slate-800 text-base mb-1">{elder.name}</h3>
                            <p className="text-church-600 text-xs font-bold uppercase tracking-wider">{elder.role}</p>
                            {elder.period && <p className="text-slate-400 text-xs mt-1">Ordained: {elder.period}</p>}
                        </Card>
                    ))}
                </div>
            )}
        </section>

      </div>
    </div>
  );
};
