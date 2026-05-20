import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../translations';
import StatsTable from '../../components/StatsTable';
import { TrendingUp, Users, FileText } from 'lucide-react';
import KhYearlyReportsTab from './KhYearlyReportsTab';

const KhReports: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'buhfaitham' | 'nitin-inkhawm' | 'yearly'>('buhfaitham');

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm space-y-8">
      <div className="flex border-b border-slate-100 gap-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('buhfaitham')}
          className={`pb-4 text-sm font-bold whitespace-nowrap flex items-center gap-2 border-b-4 transition-all ${
            activeTab === 'buhfaitham' ? 'border-church-600 text-church-600' : 'border-transparent text-slate-400 hover:text-church-600'
          }`}
        >
          <TrendingUp size={18} />
          Buhfaitham
        </button>
        <button
          onClick={() => setActiveTab('nitin-inkhawm')}
          className={`pb-4 text-sm font-bold whitespace-nowrap flex items-center gap-2 border-b-4 transition-all ${
            activeTab === 'nitin-inkhawm' ? 'border-church-600 text-church-600' : 'border-transparent text-slate-400 hover:text-church-600'
          }`}
        >
          <Users size={18} />
          Kristian Chhungkua
        </button>
        <button
          onClick={() => setActiveTab('yearly')}
          className={`pb-4 text-sm font-bold whitespace-nowrap flex items-center gap-2 border-b-4 transition-all ${
            activeTab === 'yearly' ? 'border-church-600 text-church-600' : 'border-transparent text-slate-400 hover:text-church-600'
          }`}
        >
          <FileText size={18} />
          Yearly Reports
        </button>
      </div>

      <div className="pt-4">
        {activeTab === 'buhfaitham' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <StatsTable 
              title="Buhfaitham Record"
              collectionName="kpvmBuhfaitham"
              isAdmin={isAdmin}
              columns={[
                { key: 'year', label: t.stats.year, type: 'number' },
                { key: 'totalFamilies', label: t.stats.totalFamilies, type: 'number' },
                { key: 'donors', label: t.stats.donors, type: 'number' },
                { key: 'percentage', label: t.stats.percentage, type: 'text' },
                { key: 'weight', label: t.stats.weight, type: 'text' },
                { key: 'amount', label: t.stats.amount, type: 'text' }
              ]}
            />
          </div>
        )}
        {activeTab === 'nitin-inkhawm' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <StatsTable 
              title="Kristian Chhungkua (Nitin Inkhawm)"
              collectionName="kpvmNitinInkhawm"
              isAdmin={isAdmin}
              columns={[
                { key: 'year', label: t.stats.year, type: 'number' },
                { key: 'totalHouses', label: t.stats.totalHouses, type: 'number' },
                { key: 'performers', label: t.stats.attendees, type: 'number' },
                { key: 'percentage', label: t.stats.percentage, type: 'text' }
              ]}
            />
          </div>
        )}
        {activeTab === 'yearly' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <KhYearlyReportsTab />
          </div>
        )}
      </div>
    </div>
  );
};

export default KhReports;
