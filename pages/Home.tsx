
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants as getChurchConstants } from '../constants';
import { useVerseOfTheDay } from '../hooks/useVerseOfTheDay';
import { WeeklyDuty, Staff, ProgramField, Announcement } from '../types';
import { db } from '../services/firebase';
import { 
  Users, BookOpen, UserCheck, Home as HomeIcon, 
  ChevronRight, Shield, Clock, 
  Music, UserCircle, CalendarDays,
  Radio, ClipboardList, Edit, Save, X, Loader, Bell, ArrowUpRight, ZoomIn, Play, Youtube
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const getYouTubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

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
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  const { verse, loading: verseLoading } = useVerseOfTheDay();
  const { weeklyDuty: staticDuty, pastors: staticPastors, elders: staticElders } = getChurchConstants(language);

  const [weeklyDuty, setWeeklyDuty] = useState<WeeklyDuty>(staticDuty);
  const [churchPastors, setChurchPastors] = useState<Staff[]>(staticPastors);
  const [churchElders, setChurchElders] = useState<Staff[]>(staticElders);
  const [latestNews, setLatestNews] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Edit Duties Modal State
  const [isEditingDuties, setIsEditingDuties] = useState(false);
  const [editDutyForm, setEditDutyForm] = useState<Partial<WeeklyDuty>>({});
  const [isSavingDuties, setIsSavingDuties] = useState(false);

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        if (db?.collection) {
            try {
                const [pSnap, eSnap, dSnap, nSnap] = await Promise.all([
                    db.collection('pastors').orderBy('order', 'asc').get(),
                    db.collection('elders').orderBy('order', 'asc').get(),
                    db.collection('weeklyDuties').doc('current').get(),
                    db.collection('announcements').orderBy('date', 'desc').limit(3).get()
                ]);
                
                if (!pSnap.empty) setChurchPastors(pSnap.docs.map((doc: any) => ({id: doc.id, ...doc.data()})));
                if (!eSnap.empty) setChurchElders(eSnap.docs.map((doc: any) => ({id: doc.id, ...doc.data()})));
                
                if (nSnap && !nSnap.empty) {
                    setLatestNews(nSnap.docs.map((doc: any) => ({id: doc.id, ...doc.data()})));
                }

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

  const handleOpenEditDuties = () => {
    setEditDutyForm({ ...weeklyDuty });
    setIsEditingDuties(true);
  };

  const handleSaveDuties = async () => {
    if (!db?.doc) return;
    setIsSavingDuties(true);
    try {
      await db.collection('weeklyDuties').doc('current').set(editDutyForm, { merge: true });
      setWeeklyDuty(editDutyForm as WeeklyDuty);
      setIsEditingDuties(false);
    } catch (error) {
      console.error("Error saving duties:", error);
      alert("Failed to save changes.");
    }
    setIsSavingDuties(false);
  };

  const handleListChange = (field: keyof WeeklyDuty, value: string) => {
    setEditDutyForm(prev => ({ ...prev, [field]: value.split('\n').map(s => s.trim()).filter(s => s !== '') }));
  };

  const openPreview = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewImage(url);
  };

  const openVideo = (e: React.MouseEvent, vid: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPlayingVideoId(vid);
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

        {/* SECTION: Latest News / Announcements */}
        {latestNews.length > 0 && (
            <div className="space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-slate-200 pb-8">
                    <div>
                        <h2 className="text-xs font-black text-orange-600 uppercase tracking-[0.4em] mb-3">{t.home.latestNews}</h2>
                        <h3 className="text-4xl font-serif font-black text-slate-900 tracking-tight">{t.home.newsTitle}</h3>
                    </div>
                    <Link to="/announcements" className="flex items-center gap-2 text-church-600 font-black uppercase text-[10px] tracking-widest hover:translate-x-1 transition-transform bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
                        {t.home.viewAll} <ArrowUpRight size={14} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {latestNews.map((news) => {
                        const youtubeId = getYouTubeId(news.videoUrl);
                        const coverImage = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : (news.imageUrls?.[0] || news.imageUrl);
                        const firstCaption = news.imageCaptions?.[0];
                        
                        return (
                            <Link to="/announcements" key={news.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="p-8 pb-4 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                            news.category === 'Emergency' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {news.category}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{news.date}</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 leading-tight mb-4 group-hover:text-church-700 transition-colors line-clamp-2">
                                        {news.title}
                                    </h4>
                                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed flex-grow">
                                        {news.content}
                                    </p>
                                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center text-[10px] font-black text-church-600 uppercase tracking-widest">
                                        Read More <ChevronRight size={14} className="ml-1" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <div 
                                        className={`h-52 w-full overflow-hidden bg-slate-100 relative ${!firstCaption ? 'rounded-b-[2.5rem]' : ''} ${youtubeId ? 'cursor-pointer' : 'cursor-zoom-in'}`}
                                        onClick={(e) => youtubeId ? openVideo(e, youtubeId) : coverImage && openPreview(e, coverImage)}
                                    >
                                        {coverImage ? (
                                            <img 
                                              src={coverImage} 
                                              alt={news.title} 
                                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                              onError={(e) => {
                                                  if (youtubeId) (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/0.jpg`;
                                              }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-church-100 to-church-50 flex items-center justify-center">
                                                <Bell size={40} className="text-church-200" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {youtubeId ? (
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                    <Play className="text-red-600 fill-current ml-0.5" size={24} />
                                                </div>
                                            ) : (
                                                <ZoomIn className="text-white drop-shadow-md" size={32} />
                                            )}
                                        </div>
                                        {youtubeId && (
                                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1.5">
                                                <Youtube size={14} className="text-red-500" /> Video
                                            </div>
                                        )}
                                        {news.imageUrls && news.imageUrls.length > 1 && !youtubeId && (
                                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-md">
                                                +{news.imageUrls.length - 1} More
                                            </div>
                                        )}
                                    </div>
                                    {firstCaption && !youtubeId && (
                                        <div className="px-8 py-3 bg-slate-50/50 border-t border-slate-100 rounded-b-[2.5rem]">
                                            <p className="text-[10px] font-bold text-slate-500 italic leading-snug line-clamp-1">{firstCaption}</p>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Lightbox for Full Size Preview */}
        {previewImage && (
            <div 
                className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setPreviewImage(null)}
            >
                <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20">
                    <X size={32} />
                </button>
                <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
                    <img 
                        src={previewImage} 
                        alt="Full size preview" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            </div>
        )}

        {/* Video Modal */}
        {playingVideoId && (
            <div 
                className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={() => setPlayingVideoId(null)}
            >
                <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-3 bg-white/10 rounded-full hover:bg-white/20">
                    <X size={28} />
                </button>
                <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-black">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`} 
                        title="YouTube Video" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        )}

        {/* SECTION: Service Personnel (Unified & Compact Assignment Table) */}
        <div className="space-y-12 relative group/section">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-slate-200 pb-8">
                <div>
                    <h2 className="text-xs font-black text-church-600 uppercase tracking-[0.4em] mb-3">Tunkar Rawngbawltute</h2>
                    <h3 className="text-4xl font-serif font-black text-slate-900 tracking-tight">Duty Personnel</h3>
                </div>
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <button 
                      onClick={handleOpenEditDuties}
                      className="bg-white border border-church-200 text-church-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-church-50 transition shadow-sm"
                    >
                      <Edit size={14} /> Edit Duty
                    </button>
                  )}
                  {weeklyDuty.weekRange && (
                      <div className="bg-church-900 text-white px-6 py-3 rounded-full shadow-lg text-sm font-black tracking-widest flex items-center gap-3">
                          <CalendarDays size={18} className="text-church-400" />
                          {weeklyDuty.weekRange.toUpperCase()}
                      </div>
                  )}
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

      {/* EDIT DUTIES MODAL */}
      {isEditingDuties && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 bg-church-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-church-600 text-white rounded-2xl shadow-lg">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-black text-slate-900">Update Service Assignments</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Direct Edit Mode</p>
                </div>
              </div>
              <button onClick={() => setIsEditingDuties(false)} className="p-2 hover:bg-white rounded-full transition text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-10">
              {/* Row 1: Dates & Core Personnel */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-church-600 uppercase tracking-[0.2em] block">Current Week Range</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-bold text-slate-800 focus:ring-2 focus:ring-church-500 outline-none transition"
                      value={editDutyForm.weekRange || ''}
                      onChange={e => setEditDutyForm({...editDutyForm, weekRange: e.target.value})}
                      placeholder="e.g. 05 - 11 January, 2026"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-church-600 uppercase tracking-[0.2em] block">Zai Hruaitu</label>
                  <div className="relative">
                    <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-bold text-slate-800 focus:ring-2 focus:ring-church-500 outline-none transition"
                      value={editDutyForm.zaiHruaitu || ''}
                      onChange={e => setEditDutyForm({...editDutyForm, zaiHruaitu: e.target.value})}
                      placeholder="Names of song leaders"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Tech Group */}
              <div className="grid md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Piano Tumtu</label>
                  <input className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium" value={editDutyForm.pianoTumtu || ''} onChange={e => setEditDutyForm({...editDutyForm, pianoTumtu: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hla Hriltu</label>
                  <input className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium" value={editDutyForm.hlaHriltu || ''} onChange={e => setEditDutyForm({...editDutyForm, hlaHriltu: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Light & Sound</label>
                  <input className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium" value={editDutyForm.lightAndSoundDuty || ''} onChange={e => setEditDutyForm({...editDutyForm, lightAndSoundDuty: e.target.value})} />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Biak In Pangpar Khawitu</label>
                  <input className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium" value={editDutyForm.pangparKhawitu || ''} onChange={e => setEditDutyForm({...editDutyForm, pangparKhawitu: e.target.value})} />
                </div>
              </div>

              {/* Row 3: Lists */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-church-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Users size={14}/> Offering Counters (One per line)
                  </label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 h-48 font-medium text-sm focus:ring-2 focus:ring-church-500 outline-none transition"
                    value={editDutyForm.thawhlawmChiartute?.join('\n') || ''}
                    onChange={e => handleListChange('thawhlawmChiartute', e.target.value)}
                    placeholder="Pu Lal..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-church-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <UserCircle size={14}/> Ushers List (One per line)
                  </label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 h-48 font-medium text-sm focus:ring-2 focus:ring-church-500 outline-none transition"
                    value={editDutyForm.ushers?.join('\n') || ''}
                    onChange={e => handleListChange('ushers', e.target.value)}
                    placeholder="Nl. Lal..."
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button 
                onClick={() => setIsEditingDuties(false)}
                className="px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-white transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveDuties}
                disabled={isSavingDuties}
                className="px-10 py-3 bg-church-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-church-200 hover:bg-church-700 transition flex items-center gap-3 disabled:opacity-50"
              >
                {isSavingDuties ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                {isSavingDuties ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
