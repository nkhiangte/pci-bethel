import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import LeadersPanel from '../../components/LeadersPanel';
import { Loader } from 'lucide-react';

const KppLeaders: React.FC = () => {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [leadersImages, setLeadersImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const doc = await db.collection('ministries').doc('pavlai').get();
      if (doc.exists) {
        const data = doc.data() as any;
        setMembers(data.members || []);
        setLeadersImages(data.leadersImages || []);
      }
    } catch (error) {
      console.error("Error fetching KPP leaders:", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Loader className="animate-spin" />;

  return (
    <LeadersPanel 
      ministryId="pavlai" 
      isAdmin={isAdmin} 
      members={members} 
      leadersImages={leadersImages}
      onUpdate={fetchData} 
    />
  );
};

export default KppLeaders;
