import React, { useState, useEffect, useCallback } from 'react';
import { Phone, MessageCircle, Loader } from 'lucide-react';
import { db } from '../../services/firebase';
import { KTPHruaitute, KTPSubCommittee } from '../../types';

const KtpSubCommittees: React.FC = () => {
  const [data, setData] = useState<KTPSubCommittee[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!db?.collection) return;
    try {
      const leadersDoc = await db.collection('ktpLeaders').doc('2026').get();
      if (leadersDoc.exists) {
        const hruaitute = leadersDoc.data() as KTPHruaitute;
        setData(hruaitute.subCommittees);
      }
    } catch (e) { console.error("Error fetching KTP data:", e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="p-12 text-center"><Loader className="animate-spin mx-auto text-church-500" /></div>;
  if (!data || data.length === 0) return <div className="p-8 bg-white rounded-xl shadow-sm text-center">No sub-committee data available.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {data.map((committee) => (
        <div key={committee.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-4">{committee.name}</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            {committee.members.map((member, index) => (
              <li key={index} className="flex justify-between items-center text-sm border-b border-slate-100 py-3 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 truncate">{member.name}</p>
                  <p className="text-slate-500 text-xs truncate">{member.role}</p>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={`tel:${member.phone.replace(/\s+/g, '')}`} className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition" title={`Call ${member.name}`}>
                      <Phone size={12} />
                    </a>
                    <a href={`https://wa.me/91${member.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 transition" title={`WhatsApp ${member.name}`}>
                      <MessageCircle size={12} />
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default KtpSubCommittees;
