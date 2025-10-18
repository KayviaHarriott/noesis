// server.js
import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import crypto from "crypto";

// ---- Config ----
const PORT = process.env.PORT || 3001;

// ---- App & WS ----
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ---- In-memory rooms ----
/**
 * rooms = {
 *   [sessionId]: {
 *     client: WebSocket | null,
 *     agent: WebSocket | null,
 *   }
 * }
 */
const rooms = Object.create(null);

// ---- Utility ----
function json(ws, obj) {
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function relayBinary(to, data, meta) {
  // We prefix a tiny JSON header for the receiver to know what this is.
  // Header and binary are framed as a single message by sending text header first,
  // then immediately sending the binary (receiver buffers per-WS frame order).
  if (!to || to.readyState !== to.OPEN) return;
  json(to, { type: "audio-chunk", ...meta });
  to.send(data);
}

// ---- Minimal STT stub (wire your vendor here) ----
// Replace with your streaming STT adapter (Deepgram/Google/Whisper server).
// The contract: call onPartial(text) for partials, onFinal(text) for finals.
class STTStreamer {
  constructor({ onPartial, onFinal }) {
    this.onPartial = onPartial;
    this.onFinal = onFinal;
    // TODO: initialize vendor SDK/connection
  }
  pushWebMOpusChunk(chunk) {
    // TODO: feed into vendor stream
  }
  end() {
    // TODO: close vendor stream
  }
}

// Keep a per-session STT instance that listens to CLIENT audio only.
const sessionSTT = new Map(); // sessionId -> STTStreamer

// ---- WS handling ----
wss.on("connection", (ws) => {
  let role = null;       // 'client' | 'agent'
  let sessionId = null;  // string

  ws.on("message", async (msg, isBinary) => {
    try {
      if (isBinary) {
        // Binary = an Opus/WebM chunk from either role
        if (!sessionId || !role) return;

        const room = rooms[sessionId];
        if (!room) return;

        const target = role === "client" ? room.agent : room.client;

        // Relay to the other side
        relayBinary(target, msg, {
          role,                         // sender's role
          mime: "audio/webm;codecs=opus",
        });

        // If the sender is the client, also tap for STT
        if (role === "client") {
          let stt = sessionSTT.get(sessionId);
          if (!stt) {
            stt = new STTStreamer({
              onPartial: (text) => {
                // push live partial transcript to AGENT only
                if (room.agent) {
                  json(room.agent, {
                    type: "stt",
                    kind: "partial",
                    text,
                    at: Date.now(),
                  });
                }
              },
              onFinal: (text) => {
                if (room.agent) {
                  json(room.agent, {
                    type: "stt",
                    kind: "final",
                    text,
                    at: Date.now(),
                  });
                }
              },
            });
            sessionSTT.set(sessionId, stt);
          }
          stt.pushWebMOpusChunk(msg);
        }
        return;
      }

      // Text frame — parse as control JSON
      const data = JSON.parse(msg.toString());

      if (data.type === "hello") {
        // { type:'hello', sessionId, role:'client' | 'agent' }
        sessionId = String(data.sessionId ?? "").trim() || crypto.randomUUID();
        role = data.role === "agent" ? "agent" : "client";

        rooms[sessionId] ||= { client: null, agent: null };
        rooms[sessionId][role] = ws;

        // Let peer know presence
        const peer = role === "client" ? rooms[sessionId].agent : rooms[sessionId].client;
        json(ws, { type: "welcome", sessionId, role });
        if (peer) {
          json(peer, { type: "peer-joined", role });
          json(ws,   { type: "peer-joined", role: role === "client" ? "agent" : "client" });
        }
        return;
      }

      if (data.type === "bye") {
        ws.close();
        return;
      }
    } catch (e) {
      console.error("WS message error:", e);
    }
  });

  ws.on("close", () => {
    if (sessionId && rooms[sessionId] && role) {
      if (rooms[sessionId][role] === ws) rooms[sessionId][role] = null;
      const other = role === "client" ? "agent" : "client";
      const peer = rooms[sessionId][other];
      if (peer) json(peer, { type: "peer-left", role });

      // Cleanup STT if client leaves
      if (role === "client") {
        const stt = sessionSTT.get(sessionId);
        if (stt) {
          stt.end();
          sessionSTT.delete(sessionId);
        }
      }

      // If both sides are gone, drop room
      if (!rooms[sessionId].client && !rooms[sessionId].agent) {
        delete rooms[sessionId];
      }
    }
  });
});

app.get("/health", (_req, res) => res.send("ok"));

server.listen(PORT, () => {
  console.log(`Voice WS server on :${PORT}`);
});
