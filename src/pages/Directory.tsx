
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Phone, MessageCircle, Users, Loader, User } from 'lucide-react';
import { db } from '../services/firebase';
import { CommitteeMember, KTPMember, Committee, Ministry, KTPHruaitute } from '../types';

interface DirectoryMember {
  id: string;
  name: string;
  role: string;
  phone?: string;
  source: string; // e.g., "Finance Committee", "KTP", "Kohhran Hmeichhia"
  imageUrl?: string;
}

const Directory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allMembers, setAllMembers] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllMembers = async () => {
      setLoading(true);
      try {
        const membersList: DirectoryMember[] = [];

        // 1. Fetch Committees
        const committeesSnapshot = await db.collection('committees').get();
        committeesSnapshot.docs.forEach(doc => {
          const committee = doc.data() as Committee;
          if (committee.members) {
            committee.members.forEach((m, idx) => {
              membersList.push({
                id: `com-${doc.id}-${m.id || idx}`,
                name: m.name,
                role: m.role,
                phone: m.phone,
                source: committee.name,
                imageUrl: m.imageUrl
              });
            });
          }
        });

        // 2. Fetch Ministries (KPP, KH, etc.)
        const ministriesSnapshot = await db.collection('ministries').get();
        ministriesSnapshot.docs.forEach(doc => {
          const ministry = doc.data() as any;
          const ministryName = ministry.name || doc.id.toUpperCase();
          if (ministry.members) {
            ministry.members.forEach((m: any, idx: number) => {
              membersList.push({
                id: `min-${doc.id}-${m.id || idx}`,
                name: m.name,
                role: m.role,
                phone: m.phone,
                source: ministryName,
                imageUrl: m.imageUrl
              });
            });
          }
        });

        // 3. Fetch KTP Leaders
        const ktpDoc = await db.collection('ktpLeaders').doc('2026').get();
        if (ktpDoc.exists) {
          const ktpData = ktpDoc.data() as KTPHruaitute;
          
          // Leaders
          ktpData.leaders?.forEach((m, idx) => {
            membersList.push({
              id: `ktp-leader-${idx}`,
              name: m.name,
              role: m.role || 'Office Bearer',
              phone: m.phone,
              source: 'KTP Office Bearers'
            });
          });

          // Committee Members
          ktpData.committeeMembers?.forEach((m, idx) => {
            membersList.push({
              id: `ktp-com-${idx}`,
              name: m.name,
              role: m.role || 'Committee Member',
              phone: m.phone,
              source: 'KTP Committee'
            });
          });

          // Ex-Officio
          ktpData.exOfficioMembers?.forEach((m, idx) => {
            membersList.push({
              id: `ktp-ex-${idx}`,
              name: m.name,
              role: m.role || 'Ex-Officio',
              phone: m.phone,
              source: 'KTP Ex-Officio'
            });
          });

          // Group Leaders
          ktpData.groupLeaders?.forEach(group => {
            group.members?.forEach((m, idx) => {
              membersList.push({
                id: `ktp-group-${group.id}-${idx}`,
                name: m.name,
                role: m.role || group.groupName,
                phone: m.phone,
                source: `KTP ${group.groupName}`
              });
            });
          });
        }

        setAllMembers(membersList);
      } catch (error) {
        console.error("Error fetching directory members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allMembers.filter(m => 
      (m.name || '').toLowerCase().includes(term) || 
      (m.role || '').toLowerCase().includes(term) ||
      (m.source || '').toLowerCase().includes(term)
    );
  }, [searchTerm, allMembers]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Directory</h1>
        <p className="text-slate-600">Search for leaders and members across all departments</p>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-church-500 focus:border-church-500 text-lg transition-all"
          placeholder="Enter name to search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="h-10 w-10 text-church-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading directory data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {searchTerm.trim() === '' ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-1">Start Searching</h3>
              <p className="text-slate-500">Enter a name above to find contact information</p>
            </div>
          ) : filteredMembers.length > 0 ? (
            <>
              <p className="text-sm font-medium text-slate-500 mb-2 px-2">
                Found {filteredMembers.length} result{filteredMembers.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
                  >
                    <div className="h-14 w-14 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-200">
                      {member.imageUrl ? (
                        <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-7 w-7 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{member.name || 'Unknown'}</h3>
                      <p className="text-xs font-medium text-church-600 uppercase tracking-wider">{member.role || 'Member'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{member.source}</p>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2">
                        <a 
                          href={`tel:${member.phone}`}
                          className="p-2 bg-church-50 text-church-600 rounded-full hover:bg-church-100 transition-colors"
                          title="Call"
                        >
                          <Phone size={18} />
                        </a>
                        <a 
                          href={`https://wa.me/91${String(member.phone).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-1">No results found</h3>
              <p className="text-slate-500">We couldn't find anyone matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Directory;
