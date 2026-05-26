import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { WeeklyDuty } from '../types';
import { ChevronLeft, Users, UserCircle, ClipboardList } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';

const ThlaTinaRawngbawltute: React.FC = () => {
  const { language } = useLanguage();
  const { t, weeklyDuty: staticDuty } = getConstants(language);
  const navigate = useNavigate();

  const [weeklyDuty, setWeeklyDuty] = useState<WeeklyDuty>(staticDuty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fetchData = async () => {
      setLoading(true);
      if (!db || !db.collection) {
        setWeeklyDuty(staticDuty);
        setLoading(false);
        return;
      }
      try {
        const dutyDoc = await db.collection('weeklyDuties').doc('current').get();
        if (dutyDoc.exists) {
          setWeeklyDuty(dutyDoc.data() as WeeklyDuty);
        } else {
          setWeeklyDuty(staticDuty);
        }
      } catch (err) {
        console.error("Failed to fetch duties", err);
        setWeeklyDuty(staticDuty);
      }
      setLoading(false);
    };

    fetchData();
  }, [staticDuty]);

  if (loading) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin text-church-600">
               <ClipboardList size={32} />
            </div>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-church-600 transition-colors"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
            <div className="bg-church-900 text-white p-6 sm:p-8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <ClipboardList size={28} className="text-church-400" />
                    <div>
                        <h4 className="text-lg sm:text-xl font-black uppercase tracking-[0.2em]">{t.home.ministersMonth}</h4>
                        <p className="text-church-200 text-sm mt-1">{weeklyDuty.month}</p>
                    </div>
                </div>
            </div>
            
            <div className="p-6 sm:p-10 space-y-12">
                {/* Offering Counters */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-church-50">
                        <div className="p-3 bg-church-50 rounded-xl text-church-600">
                            <Users size={24} />
                        </div>
                        <h5 className="text-lg font-black text-slate-800 uppercase tracking-widest">{t.home.offeringCounters}</h5>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {weeklyDuty.thawhlawmChiartute?.map((name, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-church-200 transition-colors">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-church-600 font-black shadow-sm text-sm border border-slate-100">{i + 1}</span>
                                <span className="font-bold text-slate-700 text-base">{name}</span>
                            </div>
                        ))}
                        {(!weeklyDuty.thawhlawmChiartute || weeklyDuty.thawhlawmChiartute.length === 0) && (
                            <div className="col-span-full p-4 text-center text-slate-500 italic">No members assigned</div>
                        )}
                    </div>
                </div>

                {/* Ushers */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-church-50">
                        <div className="p-3 bg-church-50 rounded-xl text-church-600">
                            <UserCircle size={24} />
                        </div>
                        <h5 className="text-lg font-black text-slate-800 uppercase tracking-widest">{t.home.ushers}</h5>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {weeklyDuty.ushers?.map((name, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-church-200 transition-colors">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-church-600 font-black shadow-sm text-sm border border-slate-100">{i + 1}</span>
                                <span className="font-bold text-slate-700 text-base">{name}</span>
                            </div>
                        ))}
                        {(!weeklyDuty.ushers || weeklyDuty.ushers.length === 0) && (
                            <div className="col-span-full p-4 text-center text-slate-500 italic">No members assigned</div>
                        )}
                    </div>
                </div>
                
                {/* Buhfaitham Hralhtute */}
                {weeklyDuty.buhfaithamHralhtute && weeklyDuty.buhfaithamHralhtute.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b-2 border-church-50">
                            <div className="p-3 bg-church-50 rounded-xl text-church-600">
                                <Users size={24} />
                            </div>
                            <h5 className="text-lg font-black text-slate-800 uppercase tracking-widest">Buhfaitham Hralhtute</h5>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {weeklyDuty.buhfaithamHralhtute.map((name, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-church-200 transition-colors">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-church-600 font-black shadow-sm text-sm border border-slate-100">{i + 1}</span>
                                    <span className="font-bold text-slate-700 text-base">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ThlaTinaRawngbawltute;
