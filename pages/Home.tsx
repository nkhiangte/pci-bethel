
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Tag, Loader } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { Announcement } from '../types';
import { getConstants } from '../constants';
import StatsCounter from '../components/StatsCounter';

const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const [news, setNews] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { announcements: staticNews } = getConstants(language);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      if (!db || !db.collection) {
        setNews(staticNews);
        setLoading(false);
        return;
      }
      try {
        const snapshot = await db.collection('announcements').orderBy('date', 'desc').get();
        if (!snapshot.empty) {
          const fetchedData = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          })) as Announcement[];
          setNews(fetchedData);
        } else {
          setNews(staticNews);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        setNews(staticNews);
      }
      setLoading(false);
    };
    fetchNews();
  }, [language, staticNews]);

  const featuredNews = news[0];
  const otherNews = news.slice(1);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-12 w-1/2 bg-slate-200 rounded mb-8"></div>
              <div className="h-96 bg-slate-200 rounded-xl mb-8"></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="h-64 bg-slate-200 rounded-xl"></div>
                <div className="h-64 bg-slate-200 rounded-xl"></div>
                <div className="h-64 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-serif font-bold text-church-900 mb-8">{t.home.newsTitle || 'News & Updates'}</h1>

              {/* Featured News */}
              {featuredNews && (
                <div className="mb-12 group">
                  <Link to="/announcements" className="block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                    <div 
                      className="relative h-[500px] bg-cover bg-center flex items-end p-8 text-white"
                      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(${featuredNews.imageUrl || 'https://picsum.photos/seed/church/1200/800'})` }}
                    >
                      <div className="max-w-3xl">
                        <span className="bg-church-500 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide">{featuredNews.category}</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold mt-4 mb-4 leading-tight drop-shadow-md">
                          {featuredNews.title}
                        </h2>
                        <p className="text-slate-200 text-lg mb-6 line-clamp-2 drop-shadow">
                          {featuredNews.content}
                        </p>
                        <div className="flex items-center text-sm font-medium text-slate-300">
                          <Calendar size={16} className="mr-2" /> {featuredNews.date}
                          <span className="mx-3">|</span>
                          <div className="flex items-center text-white font-bold group-hover:underline">
                            Read More <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Other News Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherNews.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                    <Link to="/announcements" className="block">
                      <div className="aspect-video bg-slate-200 overflow-hidden">
                        <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center text-xs text-slate-500 mb-2">
                          <Tag size={14} className="mr-1.5 text-church-500" /> <span className="font-semibold uppercase">{item.category}</span>
                          <span className="mx-2">•</span>
                          <Calendar size={14} className="mr-1.5" /> <span>{item.date}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-church-700">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-3">
                          {item.content}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <StatsCounter />
      
    </div>
  );
};

export default Home;