import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import twilio, { Twilio } from "twilio";
import { GoogleGenAI, Type } from "@google/genai";
import firebaseConfig from "./firebase-applet-config.json";
import shareHandler from "./api/share";

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
  const dbs = ["(default)", firebaseConfig.firestoreDatabaseId];
  for (const dbId of dbs) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/${collection}/${id}?key=${firebaseConfig.apiKey}`;
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

const DEFAULT_CHURCH_LOGO = "https://www.cpibethel.com/pci-logo.png";
const PRODUCTION_WEB_DOMAIN = "https://www.cpibethel.com";

function cleanHtmlToText(htmlOrText?: string): string {
  if (!htmlOrText) return '';
  return htmlOrText
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/p>|<\/div>|<br\s*\/?>|<\/h[1-6]>|<\/li>|<\/tr>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAtLeastTwoSentences(contentOrText?: string, minSentences = 2): string {
  const text = cleanHtmlToText(contentOrText);
  if (!text) return '';
  const protectedText = text
    .replace(/\b(Rev|Dr|Prof|Upa|Pu|Pi|Tv|Nl|Ch|vs|v|eg|i\.e|etc)\./gi, '$1§DOT§')
    .replace(/(\d+)\.(\d+)/g, '$1§DOT§$2');
  const parts = protectedText.split(/(?<=[.!?])(?=['"]?\s+|$)/);
  if (!parts || !Array.isArray(parts)) return text;
  const sentences = parts
    .map(s => (s ? s.replace(/§DOT§/g, '.').trim() : ''))
    .filter(s => s && s.length > 0);
  if (sentences.length >= minSentences) {
    let combined = sentences.slice(0, minSentences).join(' ');
    if (combined.length < 70 && sentences.length > minSentences) {
      combined = sentences.slice(0, minSentences + 1).join(' ');
    }
    return combined;
  }
  if (sentences.length > 0) {
    return sentences.join(' ');
  }
  if (text.length <= 200) {
    return text;
  }
  const slice = text.slice(0, 200);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 50 ? slice.slice(0, lastSpace) : slice) + '...';
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
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:')) return null; // Reject base64 data URIs
    if (trimmed.startsWith('/')) {
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

  if (data.content && typeof data.content === 'string') {
    const match = data.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      const sanitized = sanitizeUrl(match[1]);
      if (sanitized) return sanitized;
    }
  }

  if (data.text && typeof data.text === 'string') {
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

async function serveIndexWithMeta(req: express.Request, res: express.Response, meta: {
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
}) {
  const indexPath = path.join(process.cwd(), "dist", "index.html");
  const rootIndexPath = path.join(process.cwd(), "index.html");
  const targetHtmlPath = fs.existsSync(indexPath) ? indexPath : rootIndexPath;

  try {
    let html = fs.readFileSync(targetHtmlPath, "utf8");

    const title = meta.title || "Champhai Bethel Kohhran";
    const description = meta.description || "Champhai Bethel Presbyterian Kohhran official website ; inkhawm hunbi, rawngbawlna, record vawnthatna leh kohhran hmalakna hrang hrangte tarlanna.";
    const imageUrl = meta.imageUrl || DEFAULT_CHURCH_LOGO;
    const url = meta.url || `${PRODUCTION_WEB_DOMAIN}${req.originalUrl}`;

    html = html
      .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
      .replace(/<meta property="og:title" content=".*?"\s*\/?>/i, `<meta property="og:title" content="${title}" />`)
      .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`)
      .replace(/<meta name="description" content=".*?"\s*\/?>/i, `<meta name="description" content="${description}" />`)
      .replace(/<meta property="og:description" content=".*?"\s*\/?>/i, `<meta property="og:description" content="${description}" />`)
      .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${description}" />`)
      .replace(/<meta property="og:image" content=".*?"\s*\/?>/i, `<meta property="og:image" content="${imageUrl}" />`)
      .replace(/<meta property="og:image:secure_url" content=".*?"\s*\/?>/i, `<meta property="og:image:secure_url" content="${imageUrl}" />`)
      .replace(/<meta property="og:image:width" content=".*?"\s*\/?>/i, `<meta property="og:image:width" content="1200" />`)
      .replace(/<meta property="og:image:height" content=".*?"\s*\/?>/i, `<meta property="og:image:height" content="630" />`)
      .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${imageUrl}" />`)
      .replace(/<meta property="og:url" content=".*?"\s*\/?>/i, `<meta property="og:url" content="${url}" />`);

    if (!html.includes(`content="${title}"`)) {
      const metaTags = `
        <title>${title}</title>
        <meta name="description" content="${description}" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:image:secure_url" content="${imageUrl}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="${url}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${imageUrl}" />
      `;
      html = html.replace("</head>", `${metaTags}\n</head>`);
    }

    res.send(html);
  } catch (err) {
    console.error("Error serving index with meta:", err);
    res.sendFile(targetHtmlPath);
  }
}

let twilioClient: Twilio | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required");
    }
    twilioClient = twilio(sid, token);
  }
  return twilioClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending reminders
  app.post("/api/send-reminder", async (req, res) => {
    try {
      const { phone, message, type } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ error: "Phone number and message are required" });
      }

      const client = getTwilioClient();
      
      // Clean phone number: ensuring it has a + prefix (assuming indian country code +91 if none provided for a native feel)
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith("+")) {
        // Defaults to India code if they just put 10 digits
        formattedPhone = `+91${formattedPhone}`;
      }

      let fromNumber;
      let toNumber;

      if (type === "whatsapp") {
        fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Default Twilio sandbox number
        if (!fromNumber.startsWith("whatsapp:")) fromNumber = `whatsapp:${fromNumber}`;
        toNumber = `whatsapp:${formattedPhone}`;
      } else {
        fromNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!fromNumber) {
          return res.status(400).json({ error: "TWILIO_PHONE_NUMBER is required for sending standard SMS" });
        }
        toNumber = formattedPhone;
      }

      const msgResult = await client.messages.create({
        body: message,
        from: fromNumber,
        to: toNumber
      });

      res.json({ success: true, messageId: msgResult.sid, status: msgResult.status });
    } catch (error: any) {
      console.error("Twilio Error:", error);
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });

  // API Route for Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, systemInstruction } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API Key missing for Chatbot" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      
      const contents = history || [];
      contents.push({ role: "user", parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: { systemInstruction }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      const msg = error.message || String(error);
      const isInvalidKey = msg.includes("API key not valid") || msg.includes("API_KEY_INVALID");
      if (!isInvalidKey) {
        console.error("Chat Error:", error);
      }
      res.status(500).json({ error: isInvalidKey ? "Invalid API Key provided" : (error.message || "Failed to generate response") });
    }
  });

  // API Route for Daily Verse
  app.post("/api/daily-verse", async (req, res) => {
    try {
      const { language } = req.body;
      // Accept GEMINI_API_KEY as standard, fallback to API_KEY if users set it that way previously
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY; 
      if (!apiKey) {
        // Fail silently as per requirements
        return res.json(null);
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      const langPrompt = language === 'mizo' ? 'Mizo (Mizo Bible)' : 'English (NIV or ESV)';
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a single, uplifting Bible verse for the day in ${langPrompt}. Return ONLY valid JSON with "text" and "reference" fields. No markdown.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              reference: { type: Type.STRING }
            },
            required: ['text', 'reference']
          }
        }
      });

      const jsonText = response.text;
      if (!jsonText) return res.json(null);
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      const msg = error.message || String(error);
      const isInvalidKey = msg.includes("API key not valid") || msg.includes("API_KEY_INVALID");
      if (!isInvalidKey) {
        console.error("Verse Error:", error);
      }
      res.json(null);
    }
  });

  // Share preview endpoint (compatible with Vercel serverless function)
  app.get("/api/share", async (req, res) => {
    return shareHandler(req, res);
  });

  // Announcement share preview route
  app.get("/announcements/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const data = await fetchFirestoreDocument("announcements", id);
      if (data) {
        const displayImgs = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
        const imageUrl = extractFirstImage({
          imageUrl: displayImgs[0],
          imageUrls: displayImgs,
          content: data.content,
        });
        const excerpt = extractAtLeastTwoSentences(data.content || "");
        const title = `${data.title || "Announcement"} - Champhai Bethel Kohhran`;
        const description = excerpt || "Champhai Bethel Kohhran Announcement";
        const url = `${PRODUCTION_WEB_DOMAIN}/announcements/${id}`;

        return serveIndexWithMeta(req, res, { title, description, imageUrl, url });
      }
    } catch (err) {
      console.error("Error fetching announcement for OG meta:", err);
    }
    return serveIndexWithMeta(req, res, {
      title: "Champhai Bethel Kohhran Announcement",
      imageUrl: DEFAULT_CHURCH_LOGO,
      url: `${PRODUCTION_WEB_DOMAIN}/announcements/${id}`,
    });
  });

  // Article share preview route
  app.get("/articles", async (req, res) => {
    const articleId = req.query.id as string;
    if (!articleId) {
      return serveIndexWithMeta(req, res, {
        title: "Articles & Chanchinbu - Champhai Bethel Kohhran",
        imageUrl: DEFAULT_CHURCH_LOGO,
        url: `${PRODUCTION_WEB_DOMAIN}/articles`,
      });
    }

    try {
      const data = await fetchFirestoreDocument("articles", articleId);
      if (data) {
        const imageUrl = extractFirstImage({
          imageUrl: data.imageUrl,
          content: data.content,
        });
        const excerpt = extractAtLeastTwoSentences(data.content || "");
        const title = `${data.title || "Article"} - Champhai Bethel Kohhran`;
        const description = excerpt || "Champhai Bethel Kohhran Article";
        const url = `${PRODUCTION_WEB_DOMAIN}/articles?id=${articleId}`;

        return serveIndexWithMeta(req, res, { title, description, imageUrl, url });
      }
    } catch (err) {
      console.error("Error fetching article for OG meta:", err);
    }

    return serveIndexWithMeta(req, res, {
      title: "Article - Champhai Bethel Kohhran",
      imageUrl: DEFAULT_CHURCH_LOGO,
      url: `${PRODUCTION_WEB_DOMAIN}/articles?id=${articleId}`,
    });
  });

  // Vite middleware for development or Static server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
