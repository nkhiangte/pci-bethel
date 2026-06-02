import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import twilio, { Twilio } from "twilio";
import { GoogleGenAI, Type } from "@google/genai";

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
