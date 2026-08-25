/**
 * Utility to clean Sunday School reports from redundant summary text and cards
 * keeping only the weekly tables and department headers.
 */
export function sanitizeSundaySchoolReportHtml(content: string | undefined): string {
  if (!content) return '';
  let html = content.replace(/&nbsp;/g, ' ');

  // 1. Remove intro paragraphs like "Sunday School Report (2026-08-23): Kal zawng zawng 1103, ..."
  html = html.replace(/<p[^>]*>\s*Sunday\s*School\s*Report[\s\S]*?<\/p>/gi, '');
  html = html.replace(/Sunday\s*School\s*Report\s*\([^)]*\):[\s\S]*?Thawhlawm[\s\S]*?\)\.?/gi, '');

  // 2. Remove Khaikhawmna (Summary) card or container
  html = html.replace(/<div[^>]*>[\s\S]*?(?:📊|Khaikhawmna|Summary)[\s\S]*?<\/div>/gi, (match) => {
    if (/Khaikhawmna|Kal\s*zawng\s*zawng/i.test(match)) {
      return '';
    }
    return match;
  });

  // 3. Remove any standalone summary headings or lists
  html = html.replace(/<h[1-6][^>]*>[\s\S]*?(?:📊|Khaikhawmna)[\s\S]*?<\/h[1-6]>/gi, '');
  html = html.replace(/<ul[^>]*>[\s\S]*?Kal\s*zawng\s*zawng[\s\S]*?<\/ul>/gi, '');
  html = html.replace(/<ol[^>]*>[\s\S]*?Kal\s*zawng\s*zawng[\s\S]*?<\/ol>/gi, '');

  // 4. Remove any stray summary lines
  html = html.replace(/Kal\s*zawng\s*zawng\s*:\s*\d+/gi, '');
  html = html.replace(/Kal\s*lo\s*zawng\s*zawng\s*:\s*\d+/gi, '');
  html = html.replace(/Member\s*zawng\s*zawng[\s\S]*?:\s*\d+/gi, '');
  html = html.replace(/Thawhlawm\s*zawng\s*zawng\s*:\s*₹?[0-9,]+/gi, '');

  return html.trim();
}

/**
 * Returns a concise, beautiful summary snippet for card previews (Home page, Announcements list, etc.)
 */
export function getAnnouncementSnippet(item: { content?: string; category?: string; title?: string; id?: string; summary?: string }): string {
  if (!item || !item.content) return '';

  const isSundaySchool = item.category === 'Sunday School' || 
                         item.id?.startsWith('ss_report_') || 
                         item.title?.toLowerCase().includes('sunday school');

  if (isSundaySchool) {
    const rawContent = item.content;

    // Pattern A: Match totals from HTML table
    const puitlingMatch = rawContent.match(/Puitling Total<\/td>\s*<td[^>]*>([0-9,]+)<\/td>\s*<td[^>]*>([0-9,]+)<\/td>\s*<td[^>]*>([0-9,]+)<\/td>/i);
    const pThawhlawmMatch = rawContent.match(/Puitling Thawhlawm:\s*₹?([0-9,]+)/i);

    const naupangMatch = rawContent.match(/Naupang Total<\/td>\s*<td[^>]*>([0-9,]+)<\/td>\s*<td[^>]*>([0-9,]+)<\/td>\s*<td[^>]*>([0-9,]+)<\/td>/i);
    const nThawhlawmMatch = rawContent.match(/Naupang Thawhlawm:\s*₹?([0-9,]+)/i);

    if (puitlingMatch || naupangMatch) {
      const pKal = puitlingMatch ? parseInt(puitlingMatch[1].replace(/,/g, ''), 10) || 0 : 0;
      const pKallo = puitlingMatch ? parseInt(puitlingMatch[2].replace(/,/g, ''), 10) || 0 : 0;
      const pThawhlawmStr = pThawhlawmMatch ? pThawhlawmMatch[1] : '0';
      const pThawhlawm = parseInt(pThawhlawmStr.replace(/,/g, ''), 10) || 0;

      const nKal = naupangMatch ? parseInt(naupangMatch[1].replace(/,/g, ''), 10) || 0 : 0;
      const nKallo = naupangMatch ? parseInt(naupangMatch[2].replace(/,/g, ''), 10) || 0 : 0;
      const nThawhlawmStr = nThawhlawmMatch ? nThawhlawmMatch[1] : '0';
      const nThawhlawm = parseInt(nThawhlawmStr.replace(/,/g, ''), 10) || 0;

      const totalKal = pKal + nKal;
      const totalKallo = pKallo + nKallo;
      const totalThawhlawm = (pThawhlawm + nThawhlawm).toLocaleString();

      return `Kal zawng zawng: ${totalKal.toLocaleString()} | Kal lo: ${totalKallo.toLocaleString()} | Thawhlawm: ₹${totalThawhlawm} (Puitling: Kal ${pKal.toLocaleString()}, Thawhlawm ₹${pThawhlawm.toLocaleString()} | Naupang: Kal ${nKal.toLocaleString()}, Thawhlawm ₹${nThawhlawm.toLocaleString()})`;
    }
  }

  // Standard announcement: strip HTML and show up to 3 sentences
  const cleanText = item.content.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = cleanText.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [cleanText];
  if (sentences.length <= 3) return cleanText;
  return sentences.slice(0, 3).join('').trim() + '...';
}

