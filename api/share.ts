import type { IncomingMessage, ServerResponse } from "http";

const FIREBASE_API_KEY = "AIzaSyCby5_5xWpMRPFrzIcDexEkMaxZU6ZYZvo";
const FIREBASE_PROJECT_ID = "bethelpci";
const DEFAULT_CHURCH_LOGO = "https://www.cpibethel.com/pci-logo.png";
const PRODUCTION_WEB_DOMAIN = "https://www.cpibethel.com";

function cleanHtmlToText(htmlOrText?: string): string {
  if (!htmlOrText) return "";
  return htmlOrText
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/p>|<\/div>|<br\s*\/?>|<\/h[1-6]>|<\/li>|<\/tr>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAtLeastTwoSentences(contentOrText?: string, minSentences = 2): string {
  const text = cleanHtmlToText(contentOrText);
  if (!text) return "";
  const protectedText = text
    .replace(/\b(Rev|Dr|Prof|Upa|Pu|Pi|Tv|Nl|Ch|vs|v|eg|i\.e|etc)\./gi, "$1§DOT§")
    .replace(/(\d+)\.(\d+)/g, "$1§DOT§$2");
  const parts = protectedText.split(/(?<=[.!?])(?=['"]?\s+|$)/);
  if (!parts || !Array.isArray(parts)) return text;
  const sentences = parts
    .map((s) => (s ? s.replace(/§DOT§/g, ".").trim() : ""))
    .filter((s) => s && s.length > 0);
  if (sentences.length >= minSentences) {
    let combined = sentences.slice(0, minSentences).join(" ");
    if (combined.length < 70 && sentences.length > minSentences) {
      combined = sentences.slice(0, minSentences + 1).join(" ");
    }
    return combined;
  }
  if (sentences.length > 0) {
    return sentences.join(" ");
  }
  if (text.length <= 200) {
    return text;
  }
  const slice = text.slice(0, 200);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 50 ? slice.slice(0, lastSpace) : slice) + "...";
}

function extractFirstImage(data?: {
  imageUrl?: string;
  image?: string;
  content?: string;
  text?: string;
  imageUrls?: string[];
  images?: string[];
}): string {
  if (!data) return DEFAULT_CHURCH_LOGO;
  const sanitizeUrl = (rawUrl?: string): string | null => {
    if (!rawUrl || typeof rawUrl !== "string") return null;
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("data:")) return null;
    if (trimmed.startsWith("/")) {
      return `${PRODUCTION_WEB_DOMAIN}${trimmed}`;
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return null;
  };

  const img1 = sanitizeUrl(data.imageUrl) || sanitizeUrl(data.image);
  if (img1) return img1;

  if (data.imageUrls && Array.isArray(data.imageUrls)) {
    for (const u of data.imageUrls) {
      const sanitized = sanitizeUrl(u);
      if (sanitized) return sanitized;
    }
  }
  if (data.images && Array.isArray(data.images)) {
    for (const u of data.images) {
      const sanitized = sanitizeUrl(u);
      if (sanitized) return sanitized;
    }
  }

  if (data.content && typeof data.content === "string") {
    const match = data.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      const sanitized = sanitizeUrl(match[1]);
      if (sanitized) return sanitized;
    }
  }

  if (data.text && typeof data.text === "string") {
    const matchHtml = data.text.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (matchHtml && matchHtml[1]) {
      const sanitized = sanitizeUrl(matchHtml[1]);
      if (sanitized) return sanitized;
    }
    const matchMd = data.text.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/i);
    if (matchMd && matchMd[1]) {
      const sanitized = sanitizeUrl(matchMd[1]);
      if (sanitized) return sanitized;
    }
  }

  return DEFAULT_CHURCH_LOGO;
}

function parseFirestoreFields(fields: any): any {
  if (!fields) return {};
  const result: any = {};
  for (const [key, val] of Object.entries(fields)) {
    const v: any = val;
    if (v.stringValue !== undefined) result[key] = v.stringValue;
    else if (v.integerValue !== undefined) result[key] = Number(v.integerValue);
    else if (v.booleanValue !== undefined) result[key] = v.booleanValue;
    else if (v.arrayValue !== undefined) {
      result[key] = (v.arrayValue.values || []).map((item: any) => {
        if (item.stringValue !== undefined) return item.stringValue;
        return item;
      });
    } else if (v.mapValue !== undefined) {
      result[key] = parseFirestoreFields(v.mapValue.fields);
    }
  }
  return result;
}

async function fetchFirestoreDocument(collection: string, id: string) {
  const dbs = ["(default)", "ai-studio-78c67a42-f37a-48bc-bd21-f0cec8d26023"];
  for (const dbId of dbs) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${dbId}/documents/${collection}/${id}?key=${FIREBASE_API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json && json.fields) {
          return parseFirestoreFields(json.fields);
        }
      }
    } catch (err) {
      console.error(`Error querying firestore database ${dbId}:`, err);
    }
  }
  return null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req: any, res: any) {
  try {
    let id = (req.query?.id as string) || (req.query?.articleId as string) || "";
    let type = (req.query?.type as string) || "";

    if (req.url) {
      try {
        const u = new URL(req.url, "http://localhost");
        if (!id) id = u.searchParams.get("id") || u.searchParams.get("articleId") || "";
        if (!type) type = u.searchParams.get("type") || "";

        // Check path segments like /articles/:id
        if (!id) {
          const segments = u.pathname.split("/").filter(Boolean);
          if (segments.length >= 2) {
            const first = segments[segments.length - 2];
            const second = segments[segments.length - 1];
            if (["articles", "announcements"].includes(first)) {
              if (!type) type = first;
              id = second;
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const collectionName = (type && type.startsWith("art")) ? "articles" : "announcements";

    let title = "Champhai Bethel Kohhran";
    let description = "Champhai Bethel Presbyterian Kohhran official website ; inkhawm hunbi, rawngbawlna, record vawnthatna leh kohhran hmalakna hrang hrangte tarlanna.";
    let imageUrl = DEFAULT_CHURCH_LOGO;
    let targetUrl = `${PRODUCTION_WEB_DOMAIN}/${collectionName}${id ? `/${id}` : ""}`;

    if (collectionName === "articles" && id) {
      targetUrl = `${PRODUCTION_WEB_DOMAIN}/articles?id=${id}`;
    }

    if (id) {
      const doc = await fetchFirestoreDocument(collectionName, id);
      if (doc) {
        if (doc.title) {
          title = `${doc.title} - Champhai Bethel Kohhran`;
        }
        const excerpt = extractAtLeastTwoSentences(doc.content || doc.text);
        if (excerpt) {
          description = excerpt;
        }
        const displayImgs = doc.imageUrls || (doc.imageUrl ? [doc.imageUrl] : []);
        imageUrl = extractFirstImage({
          imageUrl: displayImgs[0] || doc.imageUrl,
          imageUrls: displayImgs,
          content: doc.content,
          text: doc.text || doc.content,
        });
      }
    }

    const safeTitle = escapeHtml(title);
    const safeDesc = escapeHtml(description);
    const safeImage = escapeHtml(imageUrl);
    const safeUrl = escapeHtml(targetUrl);

    const lowerImg = imageUrl.toLowerCase();
    const mimeType = lowerImg.includes(".png") ? "image/png" : (lowerImg.includes(".webp") ? "image/webp" : "image/jpeg");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Champhai Bethel Kohhran" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:secure_url" content="${safeImage}" />
  <meta property="og:image:type" content="${mimeType}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${safeUrl}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />

  <!-- Canonical -->
  <link rel="canonical" href="${safeUrl}" />

  <!-- Automatic Client Redirect -->
  <script>
    window.location.replace("${safeUrl}");
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${safeUrl}" />
  </noscript>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; text-align: center; background: #f8fafc; color: #334155;">
  <div style="max-width: 500px; margin: 40px auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <img src="${safeImage}" alt="${safeTitle}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 16px;" />
    <h1 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 8px;">${safeTitle}</h1>
    <p style="font-size: 0.875rem; line-height: 1.5; color: #64748b; margin-bottom: 20px;">${safeDesc}</p>
    <a href="${safeUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500;">Chhiar zawm rawh / Open in App</a>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600, stale-while-revalidate=86400");
    return res.send(html);
  } catch (error: any) {
    console.error("Error generating share preview:", error);
    return res.status(500).send("Error generating preview");
  }
}
