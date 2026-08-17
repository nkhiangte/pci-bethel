import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('/app/firebase-service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function check() {
  const reports = await db.collection('sundaySchoolWeeklyReports').orderBy('date', 'desc').limit(5).get();
  console.log("Reports:", reports.docs.map(d => d.data()));
  
  const announcements = await db.collection('announcements').orderBy('date', 'desc').limit(5).get();
  console.log("Announcements:", announcements.docs.map(d => ({ id: d.id, title: d.data().title })));
}
check().catch(console.error);
