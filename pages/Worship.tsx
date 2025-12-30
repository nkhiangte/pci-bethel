import React, { useState } from 'react';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, Users } from 'lucide-react';

const Worship: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ministries');
  const { language, t } = useLanguage();
  const { ministries } = getConstants(language);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-serif font-bold text-church-900">{t.worship.title}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
          <button 
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'ministries' ? 'border-church-500 text-church-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('ministries')}
          >
            {t.worship.tabMinistries}
          </button>
          <button 
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'worship' ? 'border-church-500 text-church-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('worship')}
          >
            {t.worship.tabOrder}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'ministries' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ministries.map((m) => (
              <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition">
                <div className="h-48 overflow-hidden bg-slate-200">
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{m.name}</h3>
                    {m.acronym && <span className="bg-church-100 text-church-700 text-xs px-2 py-1 rounded font-bold">{m.acronym}</span>}
                  </div>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">{m.description}</p>
                  <div className="space-y-2 text-sm text-slate-500 border-t border-slate-100 pt-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" /> {m.leader}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" /> {m.schedule}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">{t.worship.serviceOrderTitle}</h2>
            <div className="space-y-6 relative border-l-2 border-slate-200 ml-4 pl-8">
              {[
                { time: '10:00 AM', event: t.worship.events.callToWorship, detail: 'Elder on Duty' },
                { time: '10:05 AM', event: t.worship.events.invocation, detail: '' },
                { time: '10:10 AM', event: t.worship.events.praise, detail: 'Worship Team' },
                { time: '10:30 AM', event: t.worship.events.reading, detail: 'Psalm 23' },
                { time: '10:40 AM', event: t.worship.events.special, detail: 'Sunday School Intermediates' },
                { time: '10:50 AM', event: t.worship.events.sermon, detail: 'Pastor' },
                { time: '11:30 AM', event: t.worship.events.offertory, detail: '' },
                { time: '11:40 AM', event: t.worship.events.closing, detail: 'Lengkhawm Zai' },
                { time: '11:45 AM', event: t.worship.events.benediction, detail: 'Pastor' },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-[41px] top-0 w-5 h-5 bg-church-500 rounded-full border-4 border-white"></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                    <h4 className="text-lg font-bold text-slate-800">{item.event}</h4>
                    <span className="text-church-600 font-mono font-medium">{item.time}</span>
                  </div>
                  {item.detail && <p className="text-slate-500">{item.detail}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Worship;
