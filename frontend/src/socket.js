import { io } from "socket.io-client";

// Connect to our backend server
export const socket = io("https://video-streaming-platform-99n4.onrender.com");