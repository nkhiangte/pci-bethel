import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import twilio, { Twilio } from "twilio";

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
