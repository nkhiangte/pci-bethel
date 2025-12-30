import React from 'react';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { Play, Download } from 'lucide-react';

const Media: React.FC = () => {
  const { language, t } = useLanguage();
  const { sermons } = getConstants(language);

  return (
    <div className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-church-900 mb-12">{t.media.title}</h1>

        {/* Featured Sermon */}
        <div className="bg-church-900 rounded-2xl overflow-hidden shadow-xl mb-16 text-white grid md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <span className="text-church-400 font-bold uppercase tracking-wider text-sm mb-2">{t.media.latestSermon}</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{sermons[0].title}</h2>
              <p className="text-church-100 text-lg mb-6">{sermons[0].preacher} • {sermons[0].date}</p>
              <p className="text-slate-300 mb-8 leading-relaxed">
                {sermons[0].description}
              </p>
              <div className="flex space-x-4">
                <button className="flex items-center px-6 py-3 bg-church-500 hover:bg-church-400 rounded-lg font-medium transition">
                  <Play className="w-5 h-5 mr-2" /> {t.media.watchNow}
                </button>
                <button className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition">
                  <Download className="w-5 h-5 mr-2" /> {t.media.audio}
                </button>
              </div>
            </div>
            <div className="relative h-64 md:h-auto bg-slate-800">
               <img src="https://picsum.photos/800/800?random=50" className="w-full h-full object-cover opacity-60" alt="Sermon Thumbnail" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition">
                   <Play className="w-8 h-8 text-white ml-1" />
                 </div>
               </div>
            </div>
        </div>

        {/* Recent Sermons Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 border-l-4 border-church-500 pl-4">{t.media.recentMessages}</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {sermons.concat(sermons).slice(0, 3).map((sermon, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden group">
                <div className="aspect-video bg-slate-200 relative">
                  <img src={`https://picsum.photos/600/400?random=${50+idx}`} className="w-full h-full object-cover" alt={sermon.title} />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                     <Play className="text-white w-12 h-12" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs text-slate-500 mb-1">{sermon.date}</div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{sermon.title}</h4>
                  <p className="text-church-600 text-sm mb-3">{sermon.preacher}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery Preview */}
        <div>
           <h3 className="text-2xl font-bold text-slate-800 mb-6 border-l-4 border-church-500 pl-4">{t.media.photoGallery}</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[1,2,3,4].map((i) => (
               <div key={i} className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition">
                 <img src={`https://picsum.photos/500/500?random=${100+i}`} alt="Gallery" className="w-full h-full object-cover" />
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Media;
