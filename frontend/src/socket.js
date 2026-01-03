import { io } from "socket.io-client";

// Connect to our backend server
export const socket = io("http://localhost:5000");