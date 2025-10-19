import { socket } from "./socket";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Send a reply to the client
export function sendAgentReply(message: string) {
  socket.emit("agent_reply", message);
}

// Listen for client messages
export function subscribeToClientMessages(callback: (message: string) => void) {
  socket.on("agent_message", callback);
  return () => {
    socket.off("agent_message", callback);
  };
}

// export const fetchAiSuggestion = async (message: string): Promise<string> => {
//   const res = await fetch(BACKEND_URL+`/api/suggest-with-emotion-audio`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ message }),
//   });
//   const data = await res.json();
//   return data.suggestion || "No suggestion available";
// };

export const fetchAiSuggestion = async (message: string) => {
  const res = await fetch(`${BACKEND_URL}/api/suggest-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: message }),
  });

  if (!res.ok) throw new Error("AI suggestion request failed");

  return res.json(); // 👈 Return the whole JSON
};




// ...existing imports & socket setup above
// export const fetchEmotion = async (message: string): Promise<{ emotion: string; confidence: number }> => {
//   const res = await fetch(`${BACKEND_URL}/api/analyze-emotion`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ message }),
//   });
//   if (!res.ok) return { emotion: "unknown", confidence: 0 };
//   return res.json();
// };

// export async function fetchEmotion(text: string) {
//   const res = await fetch(`${BACKEND_URL}/api/analyze-emotion`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ message: text }),
//   });
//   if (!res.ok) return { emotion: "unknown", confidence: 0, scores: {} };
//   return res.json();
// }




