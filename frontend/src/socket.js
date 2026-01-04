import { io } from "socket.io-client";

// Connect to our backend server
export const socket = io(import.meta.env.VITE_API_URL);