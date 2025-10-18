// src/api/client.ts
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function fetchBackendMessage() {
  try {
    const response = await fetch(`${BACKEND_URL}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Error fetching from backend:", error);
    return "Failed to connect to backend.";
  }
}
