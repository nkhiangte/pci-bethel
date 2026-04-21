
import { db } from './firebase';
import { KTPMember, CommitteeMember, UserProfile } from '../types';

export interface ContactInfo {
  name: string;
  phone: string;
  source: string;
}

export const findContactByName = async (name: string): Promise<ContactInfo | null> => {
  if (!db || !db.collection) return null;

  // Helper to normalize names by stripping common Mizo titles, punctuation, and all spaces
  const normalizeName = (n: string) => {
      if (!n) return '';
      return n.toLowerCase()
          // flexibly catch titles with or without periods (e.g. "tv ", "tv. ", "upa ")
          .replace(/\b(upa|tv|nl|pu|pi|dr|rev)\.?\s+/g, '') 
          // remove all spaces, dots, and commas to match "H. Lalfakawma" with "H Lalfakawma" or "H.Lalfakawma"
          .replace(/[\.\,\s]/g, '');
  };

  const searchName = normalizeName(name);

  try {
    // 1. Search in KTP Leaders
    const ktpSnap = await db.collection('ktpLeaders').get();
    for (const doc of ktpSnap.docs) {
      const data = doc.data();
      const allMembers: any[] = [
        ...(data.leaders || []),
        ...(data.committeeMembers || []),
        ...(data.exOfficioMembers || [])
      ];
      
      if (data.groupLeaders) {
        data.groupLeaders.forEach((g: any) => {
          if (g.members) allMembers.push(...g.members);
        });
      }

      const found = allMembers.find(m => normalizeName(m.name) === searchName && m.phone);
      if (found) return { name: found.name, phone: found.phone, source: 'KTP' };
    }

    // 2. Search in Committees
    const committeeSnap = await db.collection('committees').get();
    for (const doc of committeeSnap.docs) {
      const data = doc.data();
      if (data.members) {
        const found = data.members.find((m: any) => normalizeName(m.name) === searchName && m.phone);
        if (found) return { name: found.name, phone: found.phone, source: 'Committee' };
      }
    }

    // 3. Search in Ministries
    const ministrySnap = await db.collection('ministries').get();
    for (const doc of ministrySnap.docs) {
      const data = doc.data();
      if (data.leaders) {
        const found = data.leaders.find((m: any) => normalizeName(m.name) === searchName && m.phone);
        if (found) return { name: found.name, phone: found.phone, source: 'Ministry' };
      }
      if (data.members) {
        const found = data.members.find((m: any) => (typeof m === 'object' && normalizeName(m.name) === searchName && m.phone));
        if (found) return { name: found.name, phone: found.phone, source: 'Ministry' };
      }
    }

    // 4. Search in Users (if they have phone stored)
    // For users table we might need to fetch all and filter in JS if titles are used inconsistently
    const userSnap = await db.collection('users').get();
    for (const doc of userSnap.docs) {
       const data = doc.data();
       if (data.displayName && normalizeName(data.displayName) === searchName && data.phone) {
           return { name: data.displayName, phone: data.phone, source: 'User Profile' };
       }
    }

  } catch (error) {
    console.error("Error finding contact:", error);
  }

  return null;
};

export const getWhatsAppLink = (phone: string, message: string) => {
  // Clean phone number (remove non-digits, ensure country code if missing)
  let cleanedPhone = phone.replace(/\D/g, '');
  if (cleanedPhone.length === 10) {
    cleanedPhone = '91' + cleanedPhone; // Default to India/Mizoram code if 10 digits
  }
  
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
};

export const getReminderTemplate = async (language: 'en' | 'mizo' = 'mizo'): Promise<string> => {
  if (!db || !db.collection) return '';
  try {
    const doc = await db.collection('settings').doc(`reminder_template_${language}`).get();
    if (doc.exists) return doc.data().template;
  } catch (e) {
    console.error("Error fetching template:", e);
  }
  
  if (language === 'mizo') {
    return `Chibai {name}, \n\nBethel Kohhran atangin a ni a. Kar thar {date} ({event}) inkhawmah hian {role} i ni tih kan rawn hriattir a che. \n\nI hman dawn em? Khawngaihin min rawn hrilh leh hram dawn nia. \n\nBethel Kohhran App`;
  }
  return `Hello {name}, \n\nThis is a reminder from Bethel Church. You are assigned as {role} for the upcoming service on {date} ({event}). \n\nPlease let us know if you are available. \n\nBethel Church App`;
};

export const sendTwilioMessage = async (phone: string, message: string, type: 'whatsapp' | 'sms') => {
  try {
    const response = await fetch('/api/send-reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, message, type })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }
    return data;
  } catch (error: any) {
    console.error('Twilio Error:', error);
    throw error;
  }
};
export const updateReminderTemplate = async (template: string, language: 'en' | 'mizo' = 'mizo') => {
  if (!db || !db.collection) return;
  await db.collection('settings').doc(`reminder_template_${language}`).set({ template }, { merge: true });
};

export const generateReminderMessage = (template: string, name: string, eventTitle: string, eventDate: string, role: string) => {
  return template
    .replace(/{name}/g, name)
    .replace(/{date}/g, eventDate)
    .replace(/{event}/g, eventTitle)
    .replace(/{role}/g, role);
};
