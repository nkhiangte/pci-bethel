import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { History, Archive, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const KtpHistory: React.FC = () => {
  const { isAdmin } = useAuth();
  
  const historySubPages = [
    { id: 'overview', path: '/ktp/history', label: 'Overview', icon: History, end: true },
    { id: 'minutes', path: '/ktp/history/minutes', label: 'Minutes Archives', icon: Archive, adminOnly: true },
    { id: 'yearly-reports', path: '/ktp/history/yearly-reports', label: 'Yearly Reports', icon: FileText },
  ];

  const visiblePages = historySubPages.filter(page => !page.adminOnly || isAdmin);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
          {visiblePages.map(page => (
            <NavLink
              key={page.id}
              to={page.path}
              end={page.end}
              className={({ isActive }) => `flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-b-2 border-church-600 text-church-700 bg-church-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <page.icon size={16} />
              {page.label}
            </NavLink>
          ))}
        </div>

        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default KtpHistory;
