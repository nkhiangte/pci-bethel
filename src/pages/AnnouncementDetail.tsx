
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { Announcement } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Calendar, 
  ChevronLeft, 
  Clock, 
  Loader, 
  Share2, 
  ZoomIn, 
  X, 
  Play, 
  Youtube,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AnnouncementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const doc = await db.collection('announcements').doc(id).get();
        if (doc.exists) {
          setAnnouncement({ id: doc.id, ...doc.data() } as Announcement);
        } else {
          console.error("Announcement not found");
          navigate('/announcements');
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  const getYouTubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const shareHandler = () => {
    if (navigator.share) {
      navigator.share({
        title: announcement?.title,
        text: announcement?.title,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="animate-spin text-church-600" size={40} />
      </div>
    );
  }

  if (!announcement) return null;

  const displayImages = announcement.imageUrls || (announcement.imageUrl ? [announcement.imageUrl] : []);
  const displayCaptions = announcement.imageCaptions || [];
  const displayVideos = announcement.videoUrls || (announcement.videoUrl ? [announcement.videoUrl] : []);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header / Back Link */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            to="/announcements" 
            className="flex items-center text-slate-600 hover:text-church-600 font-bold transition group"
          >
            <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            {t.nav.announcements}
          </Link>
          <button 
            onClick={shareHandler}
            className="p-2 text-slate-400 hover:text-church-600 hover:bg-church-50 rounded-full transition"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden"
        >
          {/* Main Title Area */}
          <div className="p-8 md:p-12 pb-4">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center text-church-600 bg-church-50 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-church-100">
                <Tag size={12} className="mr-1.5" />
                {announcement.category}
              </div>
              <div className="flex items-center text-slate-400 text-sm font-bold">
                <Calendar size={16} className="mr-1.5" />
                {announcement.date}
              </div>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-serif font-black text-slate-900 leading-tight mb-8">
              {announcement.title}
            </h1>
          </div>

          {/* Featured Image (if exists) */}
          {displayImages.length > 0 && (
            <div className="px-8 md:px-12 mb-8">
              <div 
                className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 group cursor-zoom-in shadow-lg"
                onClick={() => setPreviewImage(displayImages[0])}
              >
                <img 
                  src={displayImages[0]} 
                  alt={announcement.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="text-white drop-shadow-md" size={48} />
                </div>
              </div>
              {displayCaptions[0] && (
                <p className="mt-3 text-sm text-slate-500 italic text-center px-4">
                  {displayCaptions[0]}
                </p>
              )}
            </div>
          )}

          {/* Content Area */}
          <div className="p-8 md:p-12 pt-0 animate-fade-in">
            <div 
              className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed ql-editor !p-0 text-justify break-normal"
              dangerouslySetInnerHTML={{ __html: announcement.content ? announcement.content.replace(/&nbsp;/g, ' ') : '' }}
            />
          </div>

          {/* Additional Media Section */}
          {(displayImages.length > 1 || displayVideos.length > 0) && (
            <div className="bg-slate-50/80 p-8 md:p-12 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <div className="w-8 h-px bg-slate-200"></div>
                Additional Media
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Videos */}
                {displayVideos.map((url, vIdx) => {
                  const vidId = getYouTubeId(url);
                  if (!vidId) return null;
                  return (
                    <motion.div 
                      key={vIdx}
                      whileHover={{ scale: 1.02 }}
                      className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 cursor-pointer shadow-md group"
                      onClick={() => setPlayingVideoId(vidId)}
                    >
                      <img 
                        src={`https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`} 
                        alt="Video Preview" 
                        className="w-full h-full object-cover opacity-80"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${vidId}/0.jpg`;
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                          <Play className="text-church-600 fill-current ml-1" size={28} />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-white font-bold uppercase tracking-wider">
                        <Youtube size={14} className="text-red-500" /> Watch Video
                      </div>
                    </motion.div>
                  );
                })}

                {/* Remaining Images */}
                {displayImages.slice(1).map((url, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ scale: 1.02 }}
                    className="flex flex-col gap-2"
                  >
                    <div 
                      onClick={() => setPreviewImage(url)}
                      className="relative aspect-video overflow-hidden bg-slate-200 rounded-2xl cursor-zoom-in shadow-md group"
                    >
                      <img 
                        src={url} 
                        alt={`${announcement.title} ${idx + 2}`} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="text-white drop-shadow-md" size={32} />
                      </div>
                    </div>
                    {displayCaptions[idx + 1] && (
                      <p className="text-xs text-slate-500 italic text-center">
                        {displayCaptions[idx + 1]}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-3 bg-white/10 rounded-full">
              <X size={32} />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={previewImage} 
              alt="Full size" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {playingVideoId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
            onClick={() => setPlayingVideoId(null)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-3 bg-white/10 rounded-full">
              <X size={28} />
            </button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black"
              onClick={e => e.stopPropagation()}
            >
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`} 
                title="YouTube Video" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementDetail;
