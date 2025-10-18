import { socket } from "./socket";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Send a message to the agent
// Send a message to the agent
export function sendClientMessage(message: string | { transcript: string; audio?: string }) {
  socket.emit("client_message", message);
}

// Listen for agent replies
export function subscribeToAgentReplies(callback: (message: string) => void) {
  socket.on("client_reply", callback);

  // ✅ Ensure cleanup returns void
  return () => {
    socket.off("client_reply", callback);
  };
}

export const sendAudioToBackend = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "speech.webm");

  const response = await fetch(BACKEND_URL+ `/api/suggest-with-emotion-audio`, {
    method: "POST",
    body: formData,
  });

  return await response.json(); // { transcript, suggestion, emotion, confidence }
};
