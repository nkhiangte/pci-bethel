
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart3, Users, Activity, Home, BookOpen, ArrowLeftRight } from 'lucide-react';

const Statistics: React.FC = () => {
  const { t } = useLanguage();

  // Hardcoded stats as per request
  const stats = {
    date: "31.8.2025",
    population: [
      { label: "Dan zawhkim (Dan chhung a awm mek)", value: 1475 },
      { label: "Kohhran mipa zawng zawng", value: 1032 },
      { label: "Kohhran hmeichhia zawng zawng", value: 1071 },
      { label: "Kohhran mi zawng zawng", value: 2094 },
    ],
    vital: [
      { label: "Naupiang zat (Mipa)", value: 14 },
      { label: "Naupiang zat (Hmeichhia)", value: 10 },
      { label: "Naupiang zawng zawng", value: 24, isTotal: true },
      { label: "Mitthi zat (Mipa)", value: 12 },
      { label: "Mitthi zat (Hmeichhia)", value: 7 },
      { label: "Mitthi zawng zawng", value: 19, isTotal: true },
    ],
    families: [
      { label: "Kohhran mi awm hlangna chhungkua", value: 431 },
      { label: "Inawmpawlhna chhungkua", value: 9 },
    ],
    movement: [
      { label: "Kohhran pawl danga pakai", value: 3 },
      { label: "Kohhran pawl dangah atanga rawn pakai", value: 25 },
    ],
    sundaySchool: [
      { label: "Sunday School Zirtu", value: 1636 },
      { label: "Sunday School Zirtirtu", value: 137 },
      { label: "Sunday School hming ziak", value: 1773, isTotal: true },
    ]
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-church-900 mb-2 text-center">KOHHRAN STATISTICS</h1>
          <span className="bg-church-100 text-church-700 px-4 py-1 rounded-full font-bold text-sm">
            {stats.date}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Population Card */}
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-blue-500 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4">
                <Users size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Population Overview</h2>
            </div>
            <div className="space-y-4">
              {stats.population.map((stat, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0">
                  <span className="text-slate-600">{stat.label}</span>
                  <span className="font-bold text-lg text-church-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vital Statistics Card */}
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-red-500 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg mr-4">
                <Activity size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Vital Statistics</h2>
            </div>
            <div className="space-y-4">
              {stats.vital.map((stat, idx) => (
                <div key={idx} className={`flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 ${stat.isTotal ? 'bg-slate-50 p-2 rounded font-bold' : ''}`}>
                  <span className={`${stat.isTotal ? 'text-slate-900' : 'text-slate-600'}`}>{stat.label}</span>
                  <span className={`text-lg ${stat.isTotal ? 'text-church-900' : 'text-slate-800'}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Families & Movement Card */}
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-green-500 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg mr-4">
                <Home size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Families & Transfer</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Families</h3>
                {stats.families.map((stat, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-slate-600">{stat.label}</span>
                    <span className="font-bold text-lg text-church-900">{stat.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                   <ArrowLeftRight size={14} className="mr-1"/> Movement
                </h3>
                {stats.movement.map((stat, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-slate-600">{stat.label}</span>
                    <span className="font-bold text-lg text-church-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sunday School Card */}
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-yellow-500 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg mr-4">
                <BookOpen size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Sunday School</h2>
            </div>
            <div className="space-y-4">
              {stats.sundaySchool.map((stat, idx) => (
                <div key={idx} className={`flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 ${stat.isTotal ? 'bg-yellow-50 p-3 rounded-lg mt-4' : ''}`}>
                  <span className={`${stat.isTotal ? 'text-yellow-900 font-bold' : 'text-slate-600'}`}>{stat.label}</span>
                  <span className={`text-lg ${stat.isTotal ? 'text-yellow-900 font-bold text-2xl' : 'text-slate-800 font-bold'}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Statistics;
