import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';
import { Staff } from '../types';
import { db } from '../services/firebase';
import { Loader, History, Target, ShieldCheck } from 'lucide-react';
import StatsCounter from '../components/StatsCounter';

const About: React.FC = () => {
  const { t, language } = useLanguage();
  const { pastors: staticPastors, elders: staticElders, proPastors: staticProPastors } = getConstants(language);

  const [churchLeaders, setChurchLeaders] = useState<Staff[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);

  const fetchLeaders = useCallback(async () => {
    setLoadingLeaders(true);
    if (!db || !db.collection) {
      // Fallback: combine static pastors and pro pastors
      const combinedStaticLeaders = [...staticPastors, ...staticProPastors].sort((a, b) => (a.order || 0) - (b.order || 0));
      setChurchLeaders(combinedStaticLeaders);
      setLoadingLeaders(false);
      return;
    }
    try {
      // Fetch Pastors
      const pastorsSnapshot = await db.collection('pastors').orderBy('order', 'asc').orderBy('name', 'asc').get();
      const fetchedPastors = pastorsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Staff[];

      // Fetch Pro Pastors
      const proPastorsSnapshot = await db.collection('proPastors').orderBy('order', 'asc').orderBy('name', 'asc').get();
      const fetchedProPastors = proPastorsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Staff[];

      // Combine and sort
      const combinedLeaders = [...fetchedPastors, ...fetchedProPastors].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const uniqueLeaders = combinedLeaders.filter((leader, index, self) =>
          index === self.findIndex((t) => (
            t.name === leader.name && t.role === leader.role
          ))
      );

      if (uniqueLeaders.length > 0) {
        setChurchLeaders(uniqueLeaders);
      } else {
        const combinedStaticLeaders = [...staticPastors, ...staticProPastors].sort((a, b) => (a.order || 0) - (b.order || 0));
        setChurchLeaders(combinedStaticLeaders);
      }
    } catch (error) {
      console.error("Error fetching church leaders for About page:", error);
      const combinedStaticLeaders = [...staticPastors, ...staticProPastors].sort((a, b) => (a.order || 0) - (b.order || 0));
      setChurchLeaders(combinedStaticLeaders);
    }
    setLoadingLeaders(false);
  }, [staticPastors, staticProPastors]);

  useEffect(() => {
      fetchLeaders();
  }, [fetchLeaders]);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <div className="bg-church-900 py-20 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{t.about.title}</h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">{t.about.subtitle}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* History & Mission */}
        <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-6 text-church-600">
                    <History size={32} className="mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">{t.about.historyTitle}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">
                    {t.about.historyText}
                </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center mb-6 text-church-600">
                    <Target size={32} className="mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">{t.about.missionTitle}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">
                    {t.about.missionText}
                </p>
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center"><ShieldCheck size={20} className="mr-2 text-church-500"/> {t.about.faithTitle}</h3>
                    <p className="text-slate-600 text-sm">{t.about.faithText}</p>
                </div>
            </div>
        </div>

        {/* Stats */}
        <StatsCounter />

        {/* Leaders Section */}
        <div>
            <div className="text-center mb-12">
                <h2 className="text-3xl font-serif font-bold text-church-900 mb-4">{t.about.shepherdsTitle}</h2>
                <div className="h-1 w-20 bg-church-500 mx-auto"></div>
            </div>

            {loadingLeaders ? (
                <div className="flex justify-center"><Loader className="animate-spin text-church-500" /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                    {churchLeaders.map((leader) => (
                        <div key={leader.id} className="bg-white rounded-xl shadow-lg overflow-hidden group hover:-translate-y-2 transition duration-300">
                            <div className="h-80 overflow-hidden relative bg-slate-200">
                                <img 
                                    src={leader.imageUrl} 
                                    alt={leader.name} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    style={{
                                        objectPosition: `${leader.imagePositionX ?? 50}% ${leader.imagePositionY ?? 0}%`,
                                        transform: `scale(${leader.imageScale ?? 1})`
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <p className="text-church-300 font-bold text-sm tracking-wider uppercase mb-1">{leader.role}</p>
                                    <h3 className="text-2xl font-bold">{leader.name}</h3>
                                    {leader.period && <p className="text-xs text-slate-300 mt-1">{leader.period}</p>}
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-600 italic">"{leader.description}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Elders Grid (Static from Constants for now as per fragment) */}
        <div>
            <div className="text-center mb-12">
                <h2 className="text-3xl font-serif font-bold text-church-900 mb-4">{t.home.kohhranElders}</h2>
                <div className="h-1 w-20 bg-church-500 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {staticElders.map((elder) => (
                    <div key={elder.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
                        <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 bg-slate-200">
                            <img src={elder.imageUrl} alt={elder.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{elder.name}</h3>
                            <p className="text-sm text-church-600">{elder.role} {elder.period ? `(${elder.period})` : ''}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default About;