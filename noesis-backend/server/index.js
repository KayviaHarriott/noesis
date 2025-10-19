// index.js
import express from "express";
import http from "http";
import https from "https";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { Readable } from "stream";
import { searchRelevantDocs } from "../utils/searchDocs.js";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Socket.IO setup
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("client_message", async (text) => {
    console.log("📨 Message from client:", text);
    
    const emotionPromise = analyzeEmotion(text);
    
    const suggestion = await suggestFromOllama(text);
    
    const { emotion, confidence } = await emotionPromise;
    
    io.emit("agent_message", {
      transcript: text,
      suggestion,
      emotion,
      confidence,
    });
  });

  socket.on("agent_reply", (text) => {
    console.log("💬 Reply from agent:", text);
    io.emit("client_reply", text);
  });

  socket.on("disconnect", () => console.log("🔴 Disconnected:", socket.id));
});


// API ROUTES
app.post("/api/suggest-text", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ error: "Message text required" });

    const suggestion = await suggestFromOllama(message);
    const { emotion, confidence } = await analyzeEmotion(message);

    res.json({ transcript: message, suggestion, emotion, confidence });
  } catch (err) {
    console.error("❌ suggest-text failed:", err);
    res.status(500).json({ error: "Failed to get AI suggestion" });
  }
});

app.post("/api/analyze-emotion", async (req, res) => {
  const { message } = req.body;
  try {
    const response = await fetch(
      `${process.env.HF_INFERENCE_API_URL}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: message }),
      }
    );

    const data = await response.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      return res.json({ emotion: "unknown", confidence: 0, scores: {} });
    }

    const scores = data[0].reduce((acc, cur) => {
      acc[cur.label.toLowerCase()] = cur.score;
      return acc;
    }, {});

    const top = data[0].reduce((a, b) => (a.score > b.score ? a : b));

    res.json({
      emotion: top.label.toLowerCase(),
      confidence: top.score,
      scores, // 👈 include all emotion probabilities
    });
  } catch (err) {
    console.error("Emotion analysis failed:", err);
    res.json({ emotion: "unknown", confidence: 0, scores: {} });
  }
});

app.post("/api/searchDocs", async (req, res) => {
  try {
    const { transcript } = req.body;
    const results = await searchRelevantDocs(transcript);
    // const res = await searchRelevantDocs(transcript);
    res.json(results);
  } catch (err) {
    console.error("Error searching docs:", err);
    res.status(500).json({ error: "Failed to search docs" });
  }
});


// HELPERS
async function suggestFromOllama(text) {
  try {
    const resp = await fetch(
      process.env.OLLAMA_API_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "qwen2.5:latest",
          // prompt: `Client said: "${text}". Suggest a kind, empathetic, and helpful response the agent could say.`,
          prompt: `You are guiding a live customer support agent during a call.

            Client message:
            ---
            ${text}
            ---

            Produce ONLY these sections (no extra text, no markdown headings other than the labels below):

            Reply: A single, kind, empathetic, professional sentence (≤ 40 words) the agent can say verbatim right now.
            Plan:
            - 3–5 concrete next steps the agent will take (imperative verbs, one line each).
            Ask: One short clarifying question that moves the issue forward.
            Notes: 1–2 brief reminders for the agent (tone, compliance, or next-action cues).

            Guidelines:
            - Use plain language. No jargon. No apologies more than once.
            - If the client provided any identifiers (order #, email, etc.), include verifying that info in Plan.
            - If the message suggests urgency or frustration, de-escalate first (Reply), then act (Plan).
            - Do NOT invent policies, credits, or data. Do NOT mention AI or internal tools.
            - Keep total output under 120 words.`,
          stream: true,
        }),
        // avoid TLS issues on Render
        agent: new https.Agent({ rejectUnauthorized: false }),
      }
    );

    // Node streams compatible version
    if (!resp.body) {
      throw new Error("No response body from Ollama");
    }

    const reader = Readable.from(resp.body);
    let fullResponse = "";

    for await (const chunk of reader) {
      const textChunk = chunk.toString();
      for (const line of textChunk.split("\n")) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.response) fullResponse += json.response;
        } catch {
          // non-JSON fragment, skip
        }
      }
    }

    return fullResponse.trim() || "No suggestion generated.";
  } catch (e) {
    console.error("❌ Ollama error:", e);
    return "⚠️ Could not connect to Ollama API.";
  }
}

async function analyzeEmotion(text) {
  try {
    const hfResp = await fetch(
      "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      }
    );

    const json = await hfResp.json();

    if (json.error) {
      console.warn("⚠️ Hugging Face model error:", json.error);
      return { emotion: "unknown", confidence: 0 };
    }

    // ✅ Handle nested and flat array formats
    const results = Array.isArray(json)
      ? (Array.isArray(json[0]) ? json[0] : json)
      : [];

    const top = results.reduce(
      (best, cur) => (cur.score > best.score ? cur : best),
      { label: "neutral", score: 0 }
    );

    return { emotion: top.label, confidence: top.score };
  } catch (err) {
    console.error("❌ Emotion analysis failed:", err);
    return { emotion: "unknown", confidence: 0 };
  }
}


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
