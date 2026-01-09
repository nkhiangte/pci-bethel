
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
// FIX: Removed invalid and incorrect import that caused module errors. getConstants is imported from ../constants below.
import { getConstants as getChurchConstants } from '../constants';
import { useVerseOfTheDay } from '../hooks/useVerseOfTheDay';
import { WeeklyDuty, Staff, ProgramField } from '../types';
import { db } from '../services/firebase';
import { 
  Users, BookOpen, UserCheck, Home as HomeIcon, 
  ChevronRight, Shield, Sun, Moon, Clock, 
  Mic, Settings, Music, UserCircle, CalendarDays,
  ListChecks, Radio, ClipboardList
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LargeStatsSphere = () => {
  const [rotation, setRotation] = useState(0);
  
  const stats = [
    { label: "Kohhran Pum", value: "2,094", icon: Users },
    { label: "Dan Zawhkim", value: "1,475", icon: UserCheck },
    { label: "Chhungkua", value: "440", icon: HomeIcon },
    { label: "Sunday School", value: "1,773", icon: BookOpen },
  ];

  useEffect(() => {
    const timer = setInterval(() => setRotation(prev => prev + 180), 4000);
    return () => clearInterval(timer);
  }, []);

  const step = rotation / 180;
  const frontIndex = (step % 2 === 0) ? step % stats.length : (step + 1) % stats.length;
  const backIndex = (step % 2 !== 0) ? step % stats.length : (step + 1) % stats.length;

  const Face = ({ stat }: { stat: any }) => {
      const Icon = stat.icon;
      return (
        <div className="absolute inset-0 w-full h-full flex flex-col justify-center items-center text-center bg-gradient-to-br from-church-800 to-church-950 rounded-full shadow-2xl text-white overflow-hidden border-4 border-white/20" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
           <div className="relative z-10 flex flex-col items-center p-4">
              <Icon size={32} className="text-church-300 mb-3 drop-shadow-md" />
              <span className="text-3xl font-black leading-none mb-1 tracking-tighter">{stat.value}</span>
              <span className="text-[9px] uppercase font-black tracking-[0.2em] opacity-70 leading-none">{stat.label}</span>
           </div>
        </div>
      );
  };

  return (
    <div className="w-40 h-40 md:w-48 md:h-48 relative shrink-0" style={{ perspective: '1200px' }}>
       <div className="w-full h-full relative transition-transform duration-1000 ease-in-out" style={{ transform: `rotateY(${rotation}deg)`, transformStyle: 'preserve-3d' }}>
          <div style={{ transform: 'rotateY(0deg)', backfaceVisibility: 'hidden' }} className="absolute inset-0"><Face stat={stats[frontIndex]} /></div>
          <div style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }} className="absolute inset-0"><Face stat={stats[backIndex]} /></div>
       </div>
    </div>
  );
};

export const Home: React.FC = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const { verse, loading: verseLoading } = useVerseOfTheDay();
  const { weeklyDuty: staticDuty, pastors: staticPastors, elders: staticElders } = getChurchConstants(language);

  const [weeklyDuty, setWeeklyDuty] = useState<WeeklyDuty>(staticDuty);
  const [churchPastors, setChurchPastors] = useState<Staff[]>(staticPastors);
  const [churchElders, setChurchElders] = useState<Staff[]>(staticElders);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        if (db?.collection) {
            try {
                const [pSnap, eSnap, dSnap] = await Promise.all([
                    db.collection('pastors').orderBy('order', 'asc').get(),
                    db.collection('elders').orderBy('order', 'asc').get(),
                    db.collection('weeklyDuties').doc('current').get()
                ]);
                if (!pSnap.empty) setChurchPastors(pSnap.docs.map((doc: any) => ({id: doc.id, ...doc.data()})));
                if (!eSnap.empty) setChurchElders(eSnap.docs.map((doc: any) => ({id: doc.id, ...doc.data()})));
                if (dSnap.exists) {
                    const data = dSnap.data() as WeeklyDuty;
                    const sanitizedDuty = {
                        ...data,
                        servicePrograms: {
                            sundaySchool: Array.isArray(data.servicePrograms?.sundaySchool) ? data.servicePrograms.sundaySchool : [],
                            morning: Array.isArray(data.servicePrograms?.morning) ? data.servicePrograms.morning : [],
                            evening: Array.isArray(data.servicePrograms?.evening) ? data.servicePrograms.evening : []
                        }
                    };
                    setWeeklyDuty(sanitizedDuty);
                }
            } catch (e) { console.error(e); }
        }
        setLoading(false);
    };
    init();
  }, [staticPastors, staticElders, staticDuty]);

  const ProgramRows = ({ fields }: { fields?: ProgramField[] }) => {
    if (!Array.isArray(fields) || fields.length === 0) return <p className="text-slate-400 italic text-[11px] mt-2">TBD</p>;
    return (
        <div className="space-y-3 mt-4">
            {fields.map((f) => (
                <div key={f.id} className="border-l border-church-200 pl-3">
                    <p className="text-[10px] uppercase font-bold text-church-600 mb-0.5 tracking-wider">{f.label}</p>
                    <p className="font-bold text-slate-800 text-sm leading-tight">{f.value || '-'}</p>
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-24">
        
        {/* Top Row: Verse & Stats */}
        <div className="bg-white px-10 py-12 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-church-600"></div>
            
            <div className="relative z-10 flex-grow text-center md:text-left">
                <div className="inline-flex items-center space-x-3 mb-8 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <BookOpen size={18} className="text-church-600" />
                    <span className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">Vawiin Chang Thlan</span>
                </div>
                <div>
                    {verseLoading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-6 bg-slate-100 rounded w-full"></div>
                            <div className="h-6 bg-slate-100 rounded w-4/5"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/3 mt-6"></div>
                        </div>
                    ) : (
                        <div className="max-w-2xl">
                            <p className="text-xl md:text-2xl font-serif italic text-slate-800 leading-relaxed">
                                "{verse?.split(' - ')[0]}"
                            </p>
                            <p className="text-xs font-black text-church-600 uppercase tracking-[0.3em] mt-6 flex items-center gap-3">
                                <span className="h-px w-8 bg-church-200"></span>
                                {verse?.split(' - ')[1]}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 shrink-0 flex flex-col items-center">
                <LargeStatsSphere />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6">Kohhran Statistics</span>
            </div>
        </div>

        {/* SECTION: Weekly Schedule */}
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-slate-200 pb-8">
                <div>
                    <h2 className="text-xs font-black text-church-600 uppercase tracking-[0.4em] mb-3">Tunkar Hun Ruatna</h2>
                    <h3 className="text-4xl font-serif font-black text-slate-900 tracking-tight">Weekly Church Program</h3>
                </div>
                {weeklyDuty.weekRange && (
                    <div className="bg-church-900 text-white px-6 py-3 rounded-full shadow-lg text-sm font-black tracking-widest flex items-center gap-3">
                        <CalendarDays size={18} className="text-church-400" />
                        {weeklyDuty.weekRange.toUpperCase()}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-0.5 bg-slate-200 border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="bg-white p-8 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><BookOpen size={16}/></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sunday Morning</span>
                    </div>
                    <h4 className="font-serif font-black text-church-900 text-xl mb-1">{weeklyDuty.serviceTitles?.sundaySchool || 'Sunday School'}</h4>
                    <p className="text-slate-500 font-bold text-xs flex items-center gap-1.5"><Clock size={12}/> {weeklyDuty.serviceTimes?.sundaySchool || '10:00 AM'}</p>
                    <ProgramRows fields={weeklyDuty.servicePrograms?.sundaySchool} />
                </div>
                <div className="bg-white p-8 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Sun size={16}/></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sunday Afternoon</span>
                    </div>
                    <h4 className="font-serif font-black text-church-900 text-xl mb-1">{weeklyDuty.serviceTitles?.morning || 'Chawhnu Inkhawm'}</h4>
                    <p className="text-slate-500 font-bold text-xs flex items-center gap-1.5"><Clock size={12}/> {weeklyDuty.serviceTimes?.morning || '01:30 PM'}</p>
                    <ProgramRows fields={weeklyDuty.servicePrograms?.morning} />
                </div>
                <div className="bg-white p-8 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Moon size={16}/></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sunday Night</span>
                    </div>
                    <h4 className="font-serif font-black text-church-900 text-xl mb-1">{weeklyDuty.serviceTitles?.evening || 'Zan Inkhawm'}</h4>
                    <p className="text-slate-500 font-bold text-xs flex items-center gap-1.5"><Clock size={12}/> {weeklyDuty.serviceTimes?.evening || '07:00 PM'}</p>
                    <ProgramRows fields={weeklyDuty.servicePrograms?.evening} />
                </div>
                <div className="bg-white p-8 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Mic size={16}/></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wednesday Night</span>
                    </div>
                    <h4 className="font-serif font-black text-church-900 text-xl mb-1">Nilai Inkhawm</h4>
                    <p className="text-slate-500 font-bold text-xs flex items-center gap-1.5"><Clock size={12}/> 07:00 PM</p>
                    <div className="space-y-3 mt-4">
                        <div className="border-l border-church-200 pl-3">
                            <p className="text-[10px] uppercase font-bold text-church-600 mb-0.5 tracking-wider">Hruaitu</p>
                            <p className="font-bold text-slate-800 text-sm">{weeklyDuty.midWeek?.nilai.hruaitu || '-'}</p>
                        </div>
                        <div className="border-l border-church-200 pl-3">
                            <p className="text-[10px] uppercase font-bold text-church-600 mb-0.5 tracking-wider">Thupui Hawngtu</p>
                            <p className="font-bold text-slate-800 text-sm">{weeklyDuty.midWeek?.nilai.thuhriltu || '-'}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-8 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Shield size={16}/></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saturday Night</span>
                    </div>
                    <h4 className="font-serif font-black text-church-900 text-xl mb-1">Ṭawngṭai Inkhawm</h4>
                    <p className="text-slate-500 font-bold text-xs flex items-center gap-1.5"><Clock size={12}/> 07:00 PM</p>
                    <div className="space-y-3 mt-4">
                        <div className="border-l border-church-200 pl-3">
                            <p className="text-[10px] uppercase font-bold text-church-600 mb-0.5 tracking-wider">Hruaitu</p>
                            <p className="font-bold text-slate-800 text-sm">{weeklyDuty.midWeek?.inrinni.hruaitu || '-'}</p>
                        </div>
                        <div className="border-l border-church-200 pl-3">
                            <p className="text-[10px] uppercase font-bold text-church-600 mb-0.5 tracking-wider">Ṭantu</p>
                            <p className="font-bold text-slate-800 text-sm">{weeklyDuty.midWeek?.inrinni.tantu || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* SECTION: Service Personnel (Unified & Compact Assignment Table) */}
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-slate-200 pb-8">
                <div>
                    <h2 className="text-xs font-black text-church-600 uppercase tracking-[0.4em] mb-3">Tunkar Rawngbawltute</h2>
                    <h3 className="text-4xl font-serif font-black text-slate-900 tracking-tight">Duty Personnel</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* COMBINED: Offering Counters & Ushers at the same elevation - High Density View */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-church-900 text-white p-6 flex items-center gap-3">
                        <ClipboardList size={22} className="text-church-400" />
                        <h4 className="text-sm font-black uppercase tracking-[0.2em]">Monthly Church Service Assignments</h4>
                    </div>
                    
                    <div className="p-8 md:p-10 grid md:grid-cols-12 gap-y-12 md:gap-x-12">
                        {/* Column 1: Thawhlawm Chhiartute */}
                        <div className="md:col-span-4 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-church-50">
                                <Users size={16} className="text-church-600" />
                                <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Offering Counters</h5>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {weeklyDuty.thawhlawmChiartute?.map((name, i) => (
                                    <div key={i} className="flex items-center gap-3 py-1.5 group">
                                        <div className="w-1 h-1 rounded-full bg-church-300 group-hover:bg-church-600 transition-colors"></div>
                                        <span className="text-sm font-bold text-slate-700">{name}</span>
                                    </div>
                                ))}
                                {(!weeklyDuty.thawhlawmChiartute || weeklyDuty.thawhlawmChiartute.length === 0) && (
                                    <p className="text-slate-400 italic text-xs py-2">Updating...</p>
                                )}
                            </div>
                        </div>

                        {/* Column 2: Ushers (Two names per row, No Row Gaps) */}
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
                                {(!weeklyDuty.ushers || weeklyDuty.ushers.length === 0) && (
                                    <p className="text-slate-400 italic text-xs col-span-2 py-4 text-center">Updating...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Specific Group: Worship & Technical (Compact Sidebar) */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center gap-3">
                        <Radio size={22} className="text-church-700" />
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Music & Technical</h4>
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
        </div>

        {/* Leadership Section */}
        <div className="space-y-20">
            <div className="text-center">
                <h2 className="text-xs font-black text-church-600 uppercase tracking-[0.5em] mb-4">Kohhran Hruaitute</h2>
                <h3 className="text-4xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">Spiritual Shepherds</h3>
                <div className="h-1 w-24 bg-church-600 mx-auto mt-8 rounded-full"></div>
            </div>

            {/* Bialtu Pastor Section */}
            {churchPastors.length > 0 && (
                <div className="max-w-5xl mx-auto mb-32">
                    <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl flex flex-col md:flex-row group ring-1 ring-slate-100">
                        <div className="md:w-2/5 aspect-[4/5] md:aspect-auto bg-slate-100 relative">
                            <img 
                                src={churchPastors[0].imageUrl} 
                                alt={churchPastors[0].name} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                style={{ objectPosition: `${churchPastors[0].imagePositionX ?? 50}% ${churchPastors[0].imagePositionY ?? 0}%` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-church-900/20 to-transparent pointer-events-none"></div>
                        </div>
                        <div className="md:w-3/5 p-12 md:p-20 flex flex-col justify-center">
                            <span className="text-church-600 font-black text-[10px] uppercase tracking-[0.4em] mb-6 block">Bialtu Pastor</span>
                            <h2 className="text-4xl md:text-6xl font-serif font-black mb-8 text-slate-900 leading-tight">{churchPastors[0].name}</h2>
                            <p className="text-slate-500 text-lg md:text-xl font-serif italic mb-12 leading-relaxed opacity-80">
                                "{churchPastors[0].description}"
                            </p>
                            <Link to="/about" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-church-700 hover:text-church-900 transition-all group/link">
                                View Full Profile <ChevronRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* All Elders Grid */}
            <div className="space-y-16">
                <div className="flex items-center gap-10 px-4">
                    <div className="flex items-center gap-4">
                        <Shield size={28} className="text-church-600" />
                        <h4 className="text-2xl font-serif font-black text-slate-800 tracking-tight">Kohhran Upate</h4>
                    </div>
                    <div className="h-px bg-slate-200 flex-grow"></div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-12">
                    {churchElders.map((elder) => (
                        <div key={elder.id} className="text-center group">
                            <div className="aspect-square rounded-[3rem] overflow-hidden mb-6 bg-slate-50 ring-4 ring-white shadow-lg relative">
                                <img 
                                    src={elder.imageUrl} 
                                    alt={elder.name} 
                                    className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-church-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                            <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 group-hover:text-church-700 transition-colors">{elder.name}</h3>
                            <p className="text-[10px] text-church-600 font-black uppercase tracking-[0.2em]">{elder.role || 'Upa'}</p>
                            {elder.period && <p className="text-[9px] text-slate-400 mt-4 font-black bg-slate-100 inline-block px-4 py-1.5 rounded-full uppercase tracking-widest">Ord. {elder.period}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
