import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer"; // ✅ Add this

const app = express();
app.use(cors());
app.use(express.json());

// --- Multer setup ---
const storage = multer.memoryStorage(); // keep audio in memory
const upload = multer({ storage });

// --- Socket.IO setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("client_message", (data) => {
    console.log("Message from client:", data);
    io.emit("agent_message", data); // forward to agent
  });

  socket.on("agent_reply", (data) => {
    console.log("Reply from agent:", data);
    io.emit("client_reply", data); // forward to client
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// --- Helper stubs (replace with your real functions) ---
async function transcribeAudio(buffer) {
  // TODO: integrate Whisper / OpenAI / AssemblyAI transcription
  console.log("Received audio buffer of length:", buffer.length);
  return "Simulated transcript from audio";
}

async function transcribeChunk(buffer) {
  // TODO: incremental streaming version
  return "Simulated partial transcript";
}

async function analyzeEmotion(text, audioBuffer) {
  // TODO: optional: combine audio tone + text sentiment
  return {
    emotion: "Neutral",
    confidence: 0.5,
  };
}

// --- Combined AI Route ---
app.post("/api/suggest-with-emotion-audio", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message text required" });

    // Send to Hugging Face
    const hfResp = await fetch(
      "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        },
        body: JSON.stringify({ inputs: message }),
      }
    );

    const hfJson = await hfResp.json();
    const emotion = hfJson[0]?.label || "neutral";
    const confidence = hfJson[0]?.score || 0;

    io.emit("agent_message", { transcript: message, emotion, confidence });

    res.json({ transcript: message, emotion, confidence });
  } catch (err) {
    console.error("suggest-with-emotion-audio failed:", err);
    res.status(500).json({ error: "Failed to process text" });
  }
});



// --- Streamed Audio Chunks (optional incremental updates) ---
app.post("/api/stream-audio-chunk", upload.single("audio"), async (req, res) => {
  try {
    const { role } = req.body;
    const chunk = req.file;

    if (!chunk) return res.status(400).json({ error: "No audio chunk" });

    // 1️⃣ Transcribe chunk
    const transcript = await transcribeChunk(chunk.buffer);

    // 2️⃣ Analyze emotion
    const { emotion, confidence } = await analyzeEmotion(transcript, chunk.buffer);

    // 3️⃣ Emit real-time message
    const payload = { transcript, emotion, confidence };
    if (role === "client") io.emit("agent_message", payload);
    if (role === "agent") io.emit("client_reply", payload);

    res.json({ success: true });
  } catch (err) {
    console.error("Error in stream-audio-chunk:", err);
    res.status(500).json({ error: "Failed to stream chunk" });
  }
});

app.post("/api/analyze-emotion", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Text message required" });

    const hfResp = await fetch(
      "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        },
        body: JSON.stringify({ inputs: message }),
      }
    );

    const hfJson = await hfResp.json();
    const emotion = hfJson[0]?.label || "neutral";
    const confidence = hfJson[0]?.score || 0;

    res.json({ emotion, confidence });
  } catch (err) {
    console.error("analyze-emotion failed:", err);
    res.status(500).json({ error: "Failed to analyze emotion" });
  }
});

// --- Ollama text suggestion route ---
app.post("/api/suggest-text", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message text required" });

    // 🔹 Send client message to your Ollama model
    const ollamaResp = await fetch(process.env.OLLAMA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1:latest",  // change if using another
        prompt: `The client said: "${message}". Suggest a kind, empathetic and concise reply the agent could say.`,
      }),
    });

    const text = await ollamaResp.text();

    // 🔹 Emit to the agent dashboard
    io.emit("agent_message", { transcript: message, ai_suggestion: text });

    res.json({ transcript: message, suggestion: text });
  } catch (err) {
    console.error("Ollama suggestion error:", err);
    res.status(500).json({ error: "Failed to fetch suggestion from Ollama" });
  }
});


const PORT = 3001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
