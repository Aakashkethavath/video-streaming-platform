# Secure Video Streaming & Sensitivity Analysis Platform

A robust full-stack application designed for secure video uploading, content sensitivity analysis, and optimized streaming. This platform features a Multi-Tenant architecture with Role-Based Access Control (RBAC), real-time processing updates via WebSockets, and seamless video playback using HTTP range requests.

## 📌 Project Overview
This project addresses the need for a controlled video sharing environment where content must be monitored. It enables users to upload videos which undergo a simulated sensitivity analysis to classify content as "Safe" or "Flagged," ensuring secure and appropriate content delivery.

**Key Capabilities:**
* **Secure Video Management:** User-isolated storage and management of video content.
* **Real-Time Feedback:** Live progress tracking during video processing stages.
* **Content Moderation:** Automated sensitivity classification to filter safe vs. flagged content.
* **Optimized Streaming:** Smooth playback using chunk-based delivery (HTTP Range Requests).

## ✨ Features

### Core Functionality
* **Secure Authentication:** JWT-based user registration and login system.
* **Video Upload Pipeline:** Robust system handling video file uploads, metadata storage, and validation.
* **Simulated Content Analysis:** Backend logic that mimics AI processing to categorize videos based on sensitivity.
* **Real-Time Status Updates:** Utilizes **Socket.io** to push live processing percentage and status changes to the dashboard.
* **Adaptive Video Player:** Integrated player supporting HTTP Range Requests for efficient streaming without full file downloads.

### Role-Based Access Control (RBAC)
* **Viewer:** Read-only access to assigned or public safe content.
* **Editor:** Full capability to upload, edit, manage, and delete their own video content.
* **Admin:** Complete system control, including the ability to view flagged content, moderate videos, and manage users.

## 🛠️ Technologies Used

### Backend
* **Node.js & Express.js:** RESTful API architecture.
* **MongoDB & Mongoose:** Database for storing user profiles and video metadata.
* **Socket.io:** Real-time bidirectional communication.
* **Multer:** Middleware for handling video file uploads.
* **JWT (JSON Web Tokens):** Secure, stateless authentication.

### Frontend
* **React (Vite):** Fast, modern UI development.
* **Axios:** HTTP client for API requests.
* **Socket.io Client:** Real-time event consumption.
* **CSS Modules:** Responsive and modular styling.

## ⚙️ Installation & Setup Guide

### Prerequisites
* Node.js (Latest LTS version recommended)
* MongoDB (Local instance or Atlas Connection String) 
* Git
### 1. Clone the Repository
```bash
git clone [https://github.com/Aakashkethavath/video-streaming-platform.git](https://github.com/Aakashkethavath/video-streaming-platform.git)
cd video-streaming-platform
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```
Configuration: Create a .env file in the backend directory with the following variables:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_key
FRONTEND_URL=http://localhost:5173
```
(Note: Replace your_mongodb_connection_string with your actual MongoDB Atlas or local connection string)

3. Frontend Setup
Navigate to the frontend directory and install dependencies:

```bash

cd ../frontend
npm install
```
Configuration: Create a .env file in the frontend directory:
```
VITE_API_URL=http://localhost:5000
```
4. Running the Application
You must run both the backend and frontend servers simultaneously. Open two separate terminals:

Terminal 1 (Backend):

```bash

cd backend
npm run dev
```
Note: The server will automatically create the uploads/ folder if it doesn't exist.

Terminal 2 (Frontend):

```bash
cd frontend
npm run dev
```
Access the application at http://localhost:5173.

🚀 Usage
Registration/Login: Create a new account. To test different roles (Admin vs. Editor), you may need to manually update the user's role field in your MongoDB database.

Upload Video: Log in as an Editor or Admin, navigate to the Dashboard, and upload a video file.

Track Progress: Watch the real-time progress bar as the system simulates "Upload," "Processing," and "Sensitivity Analysis."

Stream Content: Click on any "Safe" video to start streaming. "Flagged" videos will be hidden or restricted based on your role.

Admin Moderation: Log in as an Admin to view all content (including flagged videos) and perform deletion or unblocking actions.

🔮 Future Scope
Cloud Storage Integration: Replace local disk storage with AWS S3 or Google Cloud Storage for better scalability.

Advanced Filtering: Add search functionality by upload date, file size, and duration.

Video Compression: Integrate FFmpeg for automatic video compression and thumbnail generation.

Real AI Integration: Replace simulated sensitivity logic with actual AI APIs (e.g., AWS Rekognition) for robust content moderation.

📂 Project Structure
```

video-streaming-platform/
├── backend/                # Server-side logic
│   ├── middleware/         # Auth (JWT) and Upload (Multer) middleware
│   ├── models/             # Mongoose schemas (User, Video)
│   ├── routes/             # API Routes (Auth, Video, Admin)
│   ├── uploads/            # Local directory for storing video files
│   └── index.js            # Entry point for the Express server
│
├── frontend/               # Client-side UI
│   ├── src/
│   │   ├── components/     # Reusable components (VideoUpload, Player)
│   │   ├── context/        # Auth state management
│   │   ├── pages/          # Dashboard, Login, Register pages
│   │   ├── axiosInstance.js # Centralized API configuration
│   │   └── socket.js       # WebSocket connection setup
│   └── vite.config.js      # Vite build configuration
│
└── README.md               # Project documentation
```
