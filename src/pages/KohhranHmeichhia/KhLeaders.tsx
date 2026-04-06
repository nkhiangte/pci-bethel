import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import LeadersPanel from '../../components/LeadersPanel';
import { Loader } from 'lucide-react';

const KhLeaders: React.FC = () => {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const doc = await db.collection('ministries').doc('kpvm').get();
      if (doc.exists) {
        setMembers((doc.data() as any).members || []);
      }
    } catch (error) {
      console.error("Error fetching KH leaders:", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Loader className="animate-spin" />;

  return (
    <LeadersPanel 
      ministryId="kpvm" 
      isAdmin={isAdmin} 
      members={members} 
      onUpdate={fetchData} 
    />
  );
};

export default KhLeaders;
