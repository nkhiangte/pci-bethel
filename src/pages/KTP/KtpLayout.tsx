import React from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { 
  Book, Users, DollarSign, List, History, 
  Camera, Video, UserSquare, Loader 
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getConstants } from '../../constants';

const KtpLayout: React.FC = () => {
  const { language } = useLanguage();
  const fellowship = getConstants(language).ministries.find(m => m.id === 'ktp');

  const ktpNavLinks = [
    { id: 'leaders', path: '/ktp/leaders', label: '2026 Hruaitute', icon: Book },
    { id: 'sub-committees', path: '/ktp/sub-committees', label: 'Sub-Committees', icon: Users }, 
    { id: 'project-budget', path: '/ktp/project-budget', label: 'Project & Budget', icon: DollarSign },
    { id: 'members', path: '/ktp/members', label: 'Member List', icon: List },
    { id: 'history', path: '/ktp/history', label: 'Our History', icon: History },
    { id: 'gallery', path: '/ktp/gallery', label: 'Picture Gallery', icon: Camera },
    { id: 'productions', path: '/ktp/productions', label: 'Productions', icon: Video },
    { id: 'whoswho', path: '/ktp/whoswho', label: "Who's Who", icon: UserSquare },
  ];

  if (!fellowship) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-church-500" /></div>;

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-church-900 text-white border-b border-church-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white p-2 rounded-full shadow-xl shrink-0">
              <img src={fellowship.image} alt={fellowship.name} className="w-full h-full object-contain rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-white">{fellowship.name}</h1>
              <p className="text-church-200 mt-2 max-w-2xl">{fellowship.description}</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto no-scrollbar">
            {ktpNavLinks.map(link => (
              <NavLink
                key={link.id}
                to={link.path}
                className={({ isActive }) => `flex items-center px-4 py-3 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-yellow-400 text-yellow-300'
                    : 'border-transparent text-church-300 hover:text-white hover:border-church-700'
                }`}
              >
                <link.icon size={16} className="mr-2" />
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
};

export default KtpLayout;
