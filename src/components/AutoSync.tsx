import React, { useEffect } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AutoSync() {
    const { isAdmin } = useAuth();
    
    useEffect(() => {
        if (!isAdmin || !db?.collection) return;
        
        const sync = async () => {
            try {
                // Get latest report
                const reportsSnap = await db.collection('sundaySchoolWeeklyReports').orderBy('date', 'desc').limit(1).get();
                if (reportsSnap.empty) return;
                
                const reportDoc = reportsSnap.docs[0];
                const report = reportDoc.data();
                const id = reportDoc.id;
                
                const announcementDocId = `ss_report_${id}`;
                
                // Check if already synced
                const annDoc = await db.collection('announcements').doc(announcementDocId).get();
                if (annDoc.exists) return; // Already synced!
                
                // Need to sync
                const formatSundaySchoolReportToHtml = (r: any): string => {
                    const puitling = r.puitling || {};
                    const naupang = r.naupang || {};
                    const pKal = (puitling.zirtirtu?.kal || 0) + (puitling.zirtu?.kal || 0);
                    const pKallo = (puitling.zirtirtu?.kallo || 0) + (puitling.zirtu?.kallo || 0);
                    const nKal = (naupang.zirtirtu?.kal || 0) + (naupang.zirtu?.kal || 0);
                    const nKallo = (naupang.zirtirtu?.kallo || 0) + (naupang.zirtu?.kallo || 0);
                    
                    return `
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
                            <td style="padding: 0.5rem;">Total Puitling</td>
                            <td style="padding: 0.5rem; text-align: center;">${pKal}</td>
                            <td style="padding: 0.5rem; text-align: center;">${pKallo}</td>
                            <td style="padding: 0.5rem; text-align: center; font-weight: bold;">${pKal + pKallo}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p style="margin-top: 0; margin-bottom: 1.5rem; font-weight: bold; color: #047857;">💰 Puitling Thawhlawm: ₹${(puitling.thawhlawm || 0).toLocaleString()}</p>
                  
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
                            <td style="padding: 0.5rem;">Total Naupang</td>
                            <td style="padding: 0.5rem; text-align: center;">${nKal}</td>
                            <td style="padding: 0.5rem; text-align: center;">${nKallo}</td>
                            <td style="padding: 0.5rem; text-align: center; font-weight: bold;">${nKal + nKallo}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p style="margin-top: 0; margin-bottom: 1.5rem; font-weight: bold; color: #047857;">💰 Naupang Thawhlawm: ₹${(naupang.thawhlawm || 0).toLocaleString()}</p>
                    `.trim();
                };

                await db.collection('announcements').doc(announcementDocId).set({
                    id: announcementDocId,
                    title: `Sunday School Report (${report.date})`,
                    date: report.date,
                    category: 'Sunday School',
                    content: formatSundaySchoolReportToHtml(report),
                    reportId: id,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                
                console.log("Auto-synced latest report.");
            } catch (e) {
                console.error("AutoSync error", e);
            }
        };
        
        sync();
    }, [isAdmin]);
    
    return null;
}
