const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');

// 1. Configure Environment Variables
dotenv.config();
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));
// 2. Initialize Express App
const app = express();

// 3. Create HTTP Server (needed for Socket.io)
const server = http.createServer(app);

// 4. Initialize Socket.io (for real-time progress bars)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // This is where our Frontend will run
    methods: ["GET", "POST"]
  }
});

// 5. Middleware (Settings)
// Make 'io' accessible to our routes
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Allow backend to understand JSON data
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
// 6. Basic Route (Test if server is working)
app.get('/', (req, res) => {
  res.send('Video Platform API is running...');
});
// ... existing code ...

// GLOBAL ERROR HANDLER (Add this before server.listen)
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Specific handling for Multer errors
  if (err.message === 'Invalid file type. Only videos are allowed!') {
    return res.status(400).json({ message: err.message });
  }

  // Default error
  res.status(500).json({ message: "Internal Server Error" });
});

// 7. Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});