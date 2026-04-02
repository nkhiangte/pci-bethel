import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { Ministry } from '../types';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Loader, Home, TrendingUp, Book, DollarSign, List, History, Camera, Video, UserSquare
} from 'lucide-react';
import StatsTable from '../components/StatsTable';

const Fellowship: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const [fellowship, setFellowship] = useState<Ministry | null | undefined>(undefined);

  const isKTP = id === 'ktp';
  const isKPVM = id === 'kpvm';
  const [kpvmActiveTab, setKpvmActiveTab] = useState('home');

  const kpvmNavLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'buhfaitham', label: 'Buhfaitham', icon: TrendingUp },
    { id: 'nitin-inkhawm', label: 'Kristian Chhungkua', icon: Users },
  ];

  useEffect(() => {
    if (!id) return;
    const fetchFellowship = async () => {
        if (!db?.collection) {
            const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
            setFellowship(staticFellowship || null);
            return;
        }
        try {
            const docRef = db.collection('ministries').doc(id);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                setFellowship({ ...docSnap.data(), id: docSnap.id } as Ministry);
            } else {
                const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
                setFellowship(staticFellowship || null);
            }
        } catch (error) {
            const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
            setFellowship(staticFellowship || null);
        }
    };
    fetchFellowship();
  }, [id, language]);

  // Redirect KTP to the new dedicated KTP routes
  if (isKTP) return <Navigate to="/ktp/leaders" replace />;

  if (fellowship === undefined) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-church-500" /></div>;
  if (fellowship === null) return <Navigate to="/" />;

  // ── KPVM Render ───────────────────────────────────────────
  if (isKPVM) {
      return (
          <div className="bg-slate-50 min-h-screen pb-12">
              <div className="bg-white border-b border-slate-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                      <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-slate-200 rounded-2xl overflow-hidden shadow-md shrink-0">
                              <img src={fellowship.image} alt={fellowship.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                              <h1 className="text-3xl font-serif font-bold text-slate-900">{fellowship.name}</h1>
                              <p className="text-slate-600 mt-2 max-w-2xl">{fellowship.description}</p>
                          </div>
                      </div>
                  </div>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex space-x-1 overflow-x-auto no-scrollbar">
                          {kpvmNavLinks.map(link => (
                              <button
                                  key={link.id}
                                  onClick={() => setKpvmActiveTab(link.id)}
                                  className={`flex items-center px-5 py-4 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                                      kpvmActiveTab === link.id
                                          ? 'border-church-600 text-church-700 bg-church-50/50'
                                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                  }`}
                              >
                                  <link.icon size={18} className="mr-2" />
                                  {link.label}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {kpvmActiveTab === 'home' && (
                      <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Users size={20} className="mr-2 text-church-600"/> Leadership & Schedule</h3>
                              <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-700">
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Leader</span>
                                      <span className="text-lg font-bold">{fellowship.leader || 'N/A'}</span>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weekly Service</span>
                                      <span className="text-lg font-bold">{fellowship.schedule || 'N/A'}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
                  {kpvmActiveTab === 'buhfaitham' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <StatsTable 
                              title="Buhfaitham Record"
                              collectionName="kpvmBuhfaitham"
                              isAdmin={isAdmin}
                              columns={[
                                  { key: 'year', label: 'Year', type: 'number' },
                                  { key: 'totalFamilies', label: 'Total Families', type: 'number' },
                                  { key: 'donors', label: 'Donors', type: 'number' },
                                  { key: 'percentage', label: '%', type: 'text' },
                                  { key: 'weight', label: 'Weight (kg)', type: 'text' },
                                  { key: 'amount', label: 'Amount (₹)', type: 'text' }
                              ]}
                          />
                      </div>
                  )}
                  {kpvmActiveTab === 'nitin-inkhawm' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <StatsTable 
                              title="Kristian Chhungkua (Nitin Inkhawm)"
                              collectionName="kpvmNitinInkhawm"
                              isAdmin={isAdmin}
                              columns={[
                                  { key: 'year', label: 'Year', type: 'number' },
                                  { key: 'totalHouses', label: 'Total Households', type: 'number' },
                                  { key: 'performers', label: 'Attendees', type: 'number' },
                                  { key: 'percentage', label: '%', type: 'text' }
                              ]}
                          />
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // ── Generic Fallback Render ───────────────────────────────
  return (
    <div className="bg-slate-50 min-h-screen">
        <div className="bg-church-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 bg-white p-2 rounded-full shadow-xl shrink-0">
                        <img src={fellowship.image} alt="Logo" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-serif font-bold mb-2">{fellowship.name}</h1>
                        <p className="text-church-200 text-lg max-w-2xl">{fellowship.description}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
             <div className="bg-white p-8 rounded-xl shadow-sm">
                 <h2 className="text-2xl font-bold text-slate-800 mb-4">About {fellowship.acronym || fellowship.name}</h2>
                 <p className="text-slate-600 leading-relaxed mb-6">{fellowship.description}</p>
                 <div className="grid md:grid-cols-2 gap-6">
                     <div className="p-4 border rounded-lg">
                         <h3 className="font-bold text-slate-700">Leader</h3>
                         <p>{fellowship.leader}</p>
                     </div>
                     <div className="p-4 border rounded-lg">
                         <h3 className="font-bold text-slate-700">Schedule</h3>
                         <p>{fellowship.schedule}</p>
                     </div>
                 </div>
             </div>
        </div>
    </div>
  );
};

export default Fellowship;
