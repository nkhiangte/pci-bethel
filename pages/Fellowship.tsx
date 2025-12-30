
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, Users, Calendar } from 'lucide-react';

const Fellowship: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { ministries } = getConstants(language);

  const fellowship = ministries.find((m) => m.id === id);

  if (!fellowship) {
    return <Navigate to="/worship" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative bg-church-900 text-white py-20">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={fellowship.image} 
            alt={fellowship.name} 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {fellowship.acronym && (
            <span className="inline-block py-1 px-3 rounded-full bg-church-500 text-white text-sm font-bold tracking-wide mb-4">
              {fellowship.acronym}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">{fellowship.name}</h1>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
            {fellowship.description}
          </p>
        </div>
      </div>

      {/* Details Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Leadership & Schedule</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Leader</h3>
                <p className="text-slate-600 mt-1">{fellowship.leader}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Regular Meeting</h3>
                <p className="text-slate-600 mt-1">{fellowship.schedule}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
             <h3 className="font-bold text-slate-900 mb-4 flex items-center">
               <Calendar className="mr-2 text-church-500" size={20} /> Upcoming Activities
             </h3>
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center text-slate-500 italic">
               No specific activities scheduled for this week. Please check Announcements for updates.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fellowship;
