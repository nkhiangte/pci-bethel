import React, { useEffect } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeSundaySchoolReportHtml } from '../utils/sanitizeReport';

export default function AutoSync() {
    const { isAdmin } = useAuth();
    
    useEffect(() => {
        if (!db?.collection) return;
        
        const sync = async () => {
            try {
                // 1. Clean any legacy announcements that still contain summary boxes in Firestore
                const ssAnnSnap = await db.collection('announcements').get();
                ssAnnSnap.docs.forEach(async (doc) => {
                    const data = doc.data();
                    if (data.category === 'Sunday School' || doc.id.startsWith('ss_report_') || data.reportId) {
                        const original = data.content || '';
                        const cleaned = sanitizeSundaySchoolReportHtml(original);
                        if (cleaned !== original) {
                            await db.collection('announcements').doc(doc.id).set({
                                content: cleaned,
                                updatedAt: new Date().toISOString()
                            }, { merge: true }).catch(() => {});
                        }
                    }
                });

                // 2. Get latest report and ensure it's synced
                const reportsSnap = await db.collection('sundaySchoolWeeklyReports').orderBy('date', 'desc').limit(1).get();
                if (reportsSnap.empty) return;
                
                const reportDoc = reportsSnap.docs[0];
                const report = reportDoc.data();
                const id = reportDoc.id;
                
                const announcementDocId = `ss_report_${id}`;
                
                const formatSundaySchoolReportToHtml = (r: any): string => {
                    const puitling = r.puitling || {};
                    const naupang = r.naupang || {};
                    
                    const pZirtirtuKal = puitling.zirtirtu?.kal || 0;
                    const pZirtirtuKallo = puitling.zirtirtu?.kallo || 0;
                    const pZirtirtuTotal = pZirtirtuKal + pZirtirtuKallo;

                    const pZirtuKal = puitling.zirtu?.kal || 0;
                    const pZirtuKallo = puitling.zirtu?.kallo || 0;
                    const pZirtuTotal = pZirtuKal + pZirtuKallo;

                    const pChhimtu = puitling.chhimtu || 0;
                    const pKal = pZirtirtuKal + pZirtuKal + pChhimtu;
                    const pKallo = pZirtirtuKallo + pZirtuKallo;
                    const pTotal = pKal + pKallo;
                    const pThawhlawm = puitling.thawhlawm || 0;

                    const nZirtirtuKal = naupang.zirtirtu?.kal || 0;
                    const nZirtirtuKallo = naupang.zirtirtu?.kallo || 0;
                    const nZirtirtuTotal = nZirtirtuKal + nZirtirtuKallo;

                    const nZirtuKal = naupang.zirtu?.kal || 0;
                    const nZirtuKallo = naupang.zirtu?.kallo || 0;
                    const nZirtuTotal = nZirtuKal + nZirtuKallo;

                    const nChhimtu = naupang.chhimtu || 0;
                    const nKal = nZirtirtuKal + nZirtuKal + nChhimtu;
                    const nKallo = nZirtirtuKallo + nZirtuKallo;
                    const nTotal = nKal + nKallo;
                    const nThawhlawm = naupang.thawhlawm || 0;
                    
                    return `
<h3 style="margin-top: 0.5rem; color: #0f172a; font-size: 1.1rem; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">1. Puitling Sunday School</h3>
<table class="church-table" style="width: 100%; border-collapse: collapse; margin-top: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
  <thead>
    <tr style="background-color: #0f172a; color: #ffffff; text-align: left;">
      <th style="padding: 10px 14px; background-color: #0f172a; color: #ffffff !important; font-weight: 800; border: 1px solid #334155; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Hming / Role</th>
      <th style="padding: 10px 14px; background-color: #0f172a; color: #ffffff !important; font-weight: 800; border: 1px solid #334155; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Kal</th>
      <th style="padding: 10px 14px; background-color: #0f172a; color: #ffffff !important; font-weight: 800; border: 1px solid #334155; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Kal lo</th>
      <th style="padding: 10px 14px; background-color: #0f172a; color: #ffffff !important; font-weight: 800; border: 1px solid #334155; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">Zirtirtu</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${pZirtirtuKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; color: #64748b;">${pZirtirtuKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${pZirtirtuTotal}</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">Zirtu</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${pZirtuKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; color: #64748b;">${pZirtuKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${pZirtuTotal}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">Chhimtu</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${pChhimtu}</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; color: #64748b;">-</td>
      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">${pChhimtu}</td>
    </tr>
    <tr style="background: #e2e8f0; font-weight: bold;">
      <td style="padding: 8px 12px; border: 1px solid #94a3b8; color: #0f172a;">Puitling Total</td>
      <td style="padding: 8px 12px; border: 1px solid #94a3b8; text-align: center; color: #0f172a;">${pKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #94a3b8; text-align: center; color: #475569;">${pKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #94a3b8; text-align: center; color: #0f172a;">${pTotal}</td>
    </tr>
  </tbody>
</table>
<p style="margin-top: 0; margin-bottom: 1.5rem; font-weight: bold; color: #047857;">💰 Puitling Thawhlawm: ₹${pThawhlawm.toLocaleString()}</p>

<h3 style="margin-top: 1.5rem; color: #065f46; font-size: 1.1rem; font-weight: 800; border-bottom: 2px solid #a7f3d0; padding-bottom: 0.5rem;">2. Naupang Sunday School</h3>
<table class="church-table" style="width: 100%; border-collapse: collapse; margin-top: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
  <thead>
    <tr style="background-color: #065f46; color: #ffffff; text-align: left;">
      <th style="padding: 10px 14px; background-color: #065f46; color: #ffffff !important; font-weight: 800; border: 1px solid #047857; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Hming / Role</th>
      <th style="padding: 10px 14px; background-color: #065f46; color: #ffffff !important; font-weight: 800; border: 1px solid #047857; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Kal</th>
      <th style="padding: 10px 14px; background-color: #065f46; color: #ffffff !important; font-weight: 800; border: 1px solid #047857; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Kal lo</th>
      <th style="padding: 10px 14px; background-color: #065f46; color: #ffffff !important; font-weight: 800; border: 1px solid #047857; text-align: center; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; font-weight: bold; color: #065f46;">Zirtirtu</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${nZirtirtuKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; color: #64748b;">${nZirtirtuKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${nZirtirtuTotal}</td>
    </tr>
    <tr style="background: #f0fdf4;">
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; font-weight: bold; color: #065f46;">Zirtu</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${nZirtuKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; color: #64748b;">${nZirtuKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${nZirtuTotal}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; font-weight: bold; color: #065f46;">Chhimtu</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${nChhimtu}</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; color: #64748b;">-</td>
      <td style="padding: 8px 12px; border: 1px solid #a7f3d0; text-align: center; font-weight: bold; color: #065f46;">${nChhimtu}</td>
    </tr>
    <tr style="background: #d1fae5; font-weight: bold;">
      <td style="padding: 8px 12px; border: 1px solid #6ee7b7; color: #065f46;">Naupang Total</td>
      <td style="padding: 8px 12px; border: 1px solid #6ee7b7; text-align: center; color: #065f46;">${nKal}</td>
      <td style="padding: 8px 12px; border: 1px solid #6ee7b7; text-align: center; color: #475569;">${nKallo}</td>
      <td style="padding: 8px 12px; border: 1px solid #6ee7b7; text-align: center; color: #065f46;">${nTotal}</td>
    </tr>
  </tbody>
</table>
<p style="margin-top: 0; margin-bottom: 1.5rem; font-weight: bold; color: #047857;">💰 Naupang Thawhlawm: ₹${nThawhlawm.toLocaleString()}</p>
                    `.trim();
                };

                const newHtml = formatSundaySchoolReportToHtml(report);
                const annDoc = await db.collection('announcements').doc(announcementDocId).get();
                const currentData = annDoc.exists ? annDoc.data() : null;
                
                // If not synced yet or contains outdated summary box, update it
                if (!annDoc.exists || (currentData?.content && (currentData.content.includes('Khaikhawmna') || currentData.content.includes('Kal zawng zawng')))) {
                    await db.collection('announcements').doc(announcementDocId).set({
                        id: announcementDocId,
                        title: `Sunday School Report (${report.date})`,
                        date: report.date,
                        category: 'Sunday School',
                        content: newHtml,
                        reportId: id,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
            } catch (e) {
                console.error("AutoSync error", e);
            }
        };
        
        sync();
    }, [isAdmin]);
    
    return null;
}

