// index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ✅ Socket.IO setup
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("client_message", async (text) => {
    console.log("📨 Message from client:", text);

    // Step 1: Analyze emotion (async, non-blocking)
    const emotionPromise = analyzeEmotion(text);

    // Step 2: Generate AI suggestion via Ollama
    const suggestion = await suggestFromOllama(text);

    // Step 3: Wait for emotion result
    const { emotion, confidence } = await emotionPromise;

    // Step 4: Send suggestion + emotion to agent
    io.emit("agent_message", { transcript: text, suggestion, emotion, confidence });
  });

  socket.on("agent_reply", (text) => {
    console.log("💬 Reply from agent:", text);
    io.emit("client_reply", text);
  });

  socket.on("disconnect", () => console.log("🔴 Disconnected:", socket.id));
});

// ✅ -------------- API ROUTES -----------------

// Simple text suggestion (for fetchAiSuggestion)
app.post("/api/suggest-text", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message text required" });

    const suggestion = await suggestFromOllama(message);
    const { emotion, confidence } = await analyzeEmotion(message);

    res.json({ transcript: message, suggestion, emotion, confidence });
  } catch (err) {
    console.error("❌ suggest-text failed:", err);
    res.status(500).json({ error: "Failed to get AI suggestion" });
  }
});

// Standalone emotion analyzer
app.post("/api/analyze-emotion", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Text required" });

    const result = await analyzeEmotion(message);
    res.json(result);
  } catch (err) {
    console.error("❌ Emotion route failed:", err);
    res.status(500).json({ error: "Emotion analysis failed" });
  }
});

// ✅ -------------- HELPERS -----------------

async function suggestFromOllama(text) {
  try {
    const resp = await fetch(
      process.env.OLLAMA_API_URL || "https://86y7be6mjfb4mj-11434.proxy.runpod.net/api/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "qwen2.5:latest",
          prompt: `Client said: "${text}". Suggest a kind, empathetic, and helpful response the agent could say.`,
          stream: true, // 👈 make sure streaming is on
        }),
      }
    );

    // ✅ Collect streaming chunks
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // Ollama sends multiple JSON lines
      for (const line of chunk.split("\n")) {
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
        body: JSON.stringify({ inputs: text }),
      }
    );

    const json = await hfResp.json();
    const emotion = json[0]?.label || "neutral";
    const confidence = json[0]?.score || 0;
    return { emotion, confidence };
  } catch (e) {
    console.error("Emotion analysis failed:", e);
    return { emotion: "unknown", confidence: 0 };
  }
}

// ✅ Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
