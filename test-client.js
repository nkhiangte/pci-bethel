import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.app().firestore(firebaseConfig.firestoreDatabaseId);

async function check() {
  const reports = await db.collection('sundaySchoolWeeklyReports').orderBy('date', 'desc').limit(1).get();
  if (reports.empty) {
      console.log("No reports found.");
      return;
  }
  const reportDoc = reports.docs[0];
  const report = reportDoc.data();
  const id = reportDoc.id;
  console.log("Latest report:", report.date, id);
  
  // Actually, I should use the proper formatting function from SundaySchool.tsx if I can, but I'll write a full one here
  const puitling = report.puitling || {};
  const naupang = report.naupang || {};
  
  const puitlingZirtirtuKal = puitling.zirtirtu?.kal || 0;
  const puitlingZirtirtuKallo = puitling.zirtirtu?.kallo || 0;
  const puitlingZirtuKal = puitling.zirtu?.kal || 0;
  const puitlingZirtuKallo = puitling.zirtu?.kallo || 0;
  const puitlingThawhlawm = puitling.thawhlawm || 0;

  const naupangZirtirtuKal = naupang.zirtirtu?.kal || 0;
  const naupangZirtirtuKallo = naupang.zirtirtu?.kallo || 0;
  const naupangZirtuKal = naupang.zirtu?.kal || 0;
  const naupangZirtuKallo = naupang.zirtu?.kallo || 0;
  const naupangThawhlawm = naupang.thawhlawm || 0;

  const content = `
    <h3 style="margin-top: 0; color: #0f172a;">1. Puitling Sunday School</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.875rem;">
      <thead>
        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
          <th style="padding: 0.5rem;">Category</th>
          <th style="padding: 0.5rem; text-align: center;">Kal</th>
          <th style="padding: 0.5rem; text-align: center;">Kal Lo</th>
          <th style="padding: 0.5rem; text-align: center;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 0.5rem;">Zirtirtu</td>
          <td style="padding: 0.5rem; text-align: center;">${puitlingZirtirtuKal}</td>
          <td style="padding: 0.5rem; text-align: center;">${puitlingZirtirtuKallo}</td>
          <td style="padding: 0.5rem; text-align: center; font-weight: bold;">${puitlingZirtirtuKal + puitlingZirtirtuKallo}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 0.5rem;">Zirtu</td>
          <td style="padding: 0.5rem; text-align: center;">${puitlingZirtuKal}</td>
          <td style="padding: 0.5rem; text-align: center;">${puitlingZirtuKallo}</td>
          <td style="padding: 0.5rem; text-align: center; font-weight: bold;">${puitlingZirtuKal + puitlingZirtuKallo}</td>
        </tr>
      </tbody>
    </table>
    <p style="margin-top: 0; margin-bottom: 1.5rem; font-weight: bold; color: #047857;">💰 Puitling Thawhlawm: ₹${puitlingThawhlawm.toLocaleString()}</p>

    <h3 style="margin-top: 0; color: #0f172a;">2. Naupang Sunday School</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.875rem;">
      <thead>
        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
          <th style="padding: 0.5rem;">Category</th>
          <th style="padding: 0.5rem; text-align: center;">Kal</th>
          <th style="padding: 0.5rem; text-align: center;">Kal Lo</th>
          <th style="padding: 0.5rem; text-align: center;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 0.5rem;">Zirtirtu</td>
          <td style="padding: 0.5rem; text-align: center;">${naupangZirtirtuKal}</td>
          <td style="padding: 0.5rem; text-align: center;">${naupangZirtirtuKallo}</td>
          <td style="padding: 0.5rem; text-align: center; font-weight: bold;">${naupangZirtirtuKal + naupangZirtirtuKallo}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 0.5rem;">Zirtu</td>
          <td style="padding: 0.5rem; text-align: center;">${naupangZirtuKal}</td>
          <td style="padding: 0.5rem; text-align: center;">${naupangZirtuKallo}</td>
          <td style="padding: 0.5rem; text-align: center; font-weight: bold;">${naupangZirtuKal + naupangZirtuKallo}</td>
        </tr>
      </tbody>
    </table>
    <p style="margin-top: 0; margin-bottom: 1.5rem; font-weight: bold; color: #047857;">💰 Naupang Thawhlawm: ₹${naupangThawhlawm.toLocaleString()}</p>
  `.trim();

  const announcementDocId = `ss_report_${id}`;
  
  await db.collection('announcements').doc(announcementDocId).set({
    id: announcementDocId,
    title: `Sunday School Report (${report.date})`,
    date: report.date,
    category: 'Sunday School',
    content: content,
    reportId: id,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  
  console.log("Announcement synced.");
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
