import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import twilio, { Twilio } from "twilio";
import { GoogleGenAI, Type } from "@google/genai";
import adminPkg from "firebase-admin";
const admin = adminPkg as any;
import firebaseConfig from "./firebase-applet-config.json";

let adminDbInstance: any = null;

function getAdminDb() {
  if (!adminDbInstance) {
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket,
        });
      } catch (e) {
        console.error("Firebase admin init error:", e);
      }
    }
    adminDbInstance = admin.firestore(firebaseConfig.firestoreDatabaseId);
  }
  return adminDbInstance;
}

const DEFAULT_CHURCH_LOGO = "https://i.ibb.co/mVw3Ftpw/PCI-logo.png";
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
  const sentences = parts
    .map(s => s.replace(/§DOT§/g, '.').trim())
    .filter(s => s.length > 0);
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

function extractFirstImage(data: {
  imageUrl?: string;
  image?: string;
  content?: string;
  text?: string;
  imageUrls?: string[];
  images?: string[];
}): string {
  if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim()) {
    return data.imageUrl.trim();
  }
  if (data.image && typeof data.image === 'string' && data.image.trim()) {
    return data.image.trim();
  }
  if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0 && data.imageUrls[0]?.trim()) {
    return data.imageUrls[0].trim();
  }
  if (data.images && Array.isArray(data.images) && data.images.length > 0 && data.images[0]?.trim()) {
    return data.images[0].trim();
  }
  if (data.content && typeof data.content === 'string') {
    const match = data.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
  }
  if (data.text && typeof data.text === 'string') {
    const matchHtml = data.text.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (matchHtml && matchHtml[1] && matchHtml[1].trim()) {
      return matchHtml[1].trim();
    }
    const matchMd = data.text.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/i);
    if (matchMd && matchMd[1] && matchMd[1].trim()) {
      return matchMd[1].trim();
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

  // Announcement share preview route
  app.get("/announcements/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const docRef = getAdminDb().collection("announcements").doc(id);
      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data() as any;
        const displayImgs = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
        const imageUrl = extractFirstImage({
          imageUrl: displayImgs[0],
          imageUrls: displayImgs,
          content: data.content,
        });
        const excerpt = extractAtLeastTwoSentences(data.content);
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
      const docRef = getAdminDb().collection("articles").doc(articleId);
      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data() as any;
        const imageUrl = extractFirstImage({
          imageUrl: data.imageUrl,
          content: data.content,
        });
        const excerpt = extractAtLeastTwoSentences(data.content);
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
