import { io, Socket } from "socket.io-client";

const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";


// Create and export a singleton socket
export const socket: Socket = io(URL, {
  transports: ["websocket"],
  autoConnect: true,
});
