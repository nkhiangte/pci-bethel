
import { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { SEED_DATA } from '../pages/InkhawmChanvo';
import { getConstants } from '../constants';
import { Committee, SundaySchoolDepartment, UserProfile } from '../types';

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
        // Committees
        try {
          const committeeSnap = await db.collection('committees').get();
          committeeSnap.docs.forEach((doc: any) => {
            const data = doc.data() as Committee;
            if (data.name) namesSet.add(data.name);
            if (data.members) {
              data.members.forEach(m => namesSet.add(m.name));
            }
          });
        } catch {
          // ignore error
        }

        // Sunday School
        try {
          const ssSnap = await db.collection('sundaySchoolDepartments').get();
          ssSnap.docs.forEach((doc: any) => {
            const data = doc.data() as SundaySchoolDepartment;
            if (data.leader) namesSet.add(data.leader);
            if (data.asstLeader) namesSet.add(data.asstLeader);
            if (data.secretary) namesSet.add(data.secretary);
            if (data.asstSecretary) namesSet.add(data.asstSecretary);
            if (data.zirtirtute) {
              data.zirtirtute.forEach(t => namesSet.add(t));
            }
          });
        } catch {
          // ignore error
        }

        // Ministries (Fellowships)
        try {
          const ministrySnap = await db.collection('ministries').get();
          ministrySnap.docs.forEach((doc: any) => {
            const data = doc.data() as any;
            if (data.name) namesSet.add(data.name);
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
        } catch {
          // ignore error
        }

        // KTP Leaders
        try {
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
        } catch {
          // ignore error
        }

        // Users (All registered members - only if authenticated)
        if (auth && auth.currentUser) {
          try {
            const userSnap = await db.collection('users').get();
            if (userSnap && !userSnap.empty) {
              userSnap.docs.forEach((doc: any) => {
                const data = doc.data() as UserProfile;
                if (data.displayName) namesSet.add(data.displayName);
              });
            }
          } catch {
            // ignore error
          }
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
