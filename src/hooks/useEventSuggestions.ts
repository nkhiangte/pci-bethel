
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { SEED_DATA } from '../pages/InkhawmChanvo';
import { getConstants } from '../constants';
import { Committee, SundaySchoolDepartment, UserProfile, Ministry } from '../types';

export const useEventSuggestions = () => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllNames = async () => {
      setLoading(true);
      const namesSet = new Set<string>();

      // 1. From Inkhawm Chanvo (SEED_DATA)
      SEED_DATA.forEach(group => {
        if (group.members) {
          group.members.forEach(m => namesSet.add(m));
        }
        if (group.subGroups) {
          group.subGroups.forEach(sg => {
            sg.members.forEach(m => namesSet.add(m));
          });
        }
      });

      // 2. From Constants (Pastors and Elders)
      const constants = getConstants('en');
      constants.pastors.forEach(p => namesSet.add(p.name));
      constants.elders.forEach(e => namesSet.add(e.name));

      // 3. From Firestore
      if (db && db.collection) {
        try {
          // Committees
          const committeeSnap = await db.collection('committees').get();
          committeeSnap.docs.forEach((doc: any) => {
            const data = doc.data() as Committee;
            namesSet.add(data.name); // Add committee name itself
            if (data.members) {
              data.members.forEach(m => namesSet.add(m.name));
            }
          });

          // Sunday School
          const ssSnap = await db.collection('sundaySchoolDepartments').get();
          ssSnap.docs.forEach((doc: any) => {
            const data = doc.data() as SundaySchoolDepartment;
            if (data.leader) namesSet.add(data.leader);
            if (data.asstLeader) namesSet.add(data.asstLeader);
            if (data.secretary) namesSet.add(data.secretary);
            if (data.asstSecretary) namesSet.add(data.asstSecretary);
            if (data.teachers) {
              data.teachers.forEach(t => namesSet.add(t));
            }
          });

          // Ministries (Fellowships)
          const ministrySnap = await db.collection('ministries').get();
          ministrySnap.docs.forEach((doc: any) => {
            const data = doc.data() as any;
            namesSet.add(data.name);
            if (data.leader) namesSet.add(data.leader);
            if (data.leaders) data.leaders.forEach((m: any) => namesSet.add(m.name));
            if (data.committeeMembers) data.committeeMembers.forEach((m: any) => namesSet.add(m.name));
            if (data.members) {
              data.members.forEach((m: any) => {
                if (typeof m === 'string') namesSet.add(m);
                else if (m.name) namesSet.add(m.name);
              });
            }
          });

          // KTP Leaders
          const ktpLeadersSnap = await db.collection('ktpLeaders').get();
          ktpLeadersSnap.docs.forEach((doc: any) => {
            const data = doc.data() as any;
            if (data.leaders) data.leaders.forEach((m: any) => namesSet.add(m.name));
            if (data.committeeMembers) data.committeeMembers.forEach((m: any) => namesSet.add(m.name));
            if (data.exOfficioMembers) data.exOfficioMembers.forEach((m: any) => namesSet.add(m.name));
            if (data.groupLeaders) {
              data.groupLeaders.forEach((g: any) => {
                if (g.members) g.members.forEach((m: any) => namesSet.add(m.name));
              });
            }
          });

          // Users (All registered members)
          const userSnap = await db.collection('users').get();
          if (!userSnap.empty) {
            userSnap.docs.forEach((doc: any) => {
              const data = doc.data() as UserProfile;
              if (data.displayName) namesSet.add(data.displayName);
            });
          } else {
            // Fallback to some mock names if DB is empty
            const mockNames = ['Lalhruaitluanga (Admin)', 'Vanlalruata', 'K. Lalduhawma'];
            mockNames.forEach(n => namesSet.add(n));
          }

        } catch (error) {
          console.error("Error fetching suggestions from Firestore:", error);
        }
      }

      // Convert Set to sorted Array
      const allNames = Array.from(namesSet).filter(name => name && name.length > 1).sort();
      setSuggestions(allNames);
      setLoading(false);
    };

    fetchAllNames();
  }, []);

  return { suggestions, loading };
};
