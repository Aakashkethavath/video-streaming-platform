const express = require('express');
const multer = require('multer');
const path = require('path');
const Video = require('../models/Video');
const verifyToken = require('../middleware/auth');

const router = express.Router();
// 1. Configure Multer (Storage + Validation)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// VALIDATION LOGIC
const fileFilter = (req, file, cb) => {
    // Accept video files only (mp4, mkv, avi)
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only videos are allowed!'), false);

    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // Limit: 50MB
});

// 2. Upload Route
// verifyToken = User must be logged in
// POST: Upload Video
router.post('/upload', verifyToken, upload.single('video'), async (req, res) => {
  try {
    const newVideo = new Video({
      title: req.file.originalname,
      description: req.body.description || "",
      filename: req.file.filename,
      size: req.file.size, // SAVE FILE SIZE HERE 
      uploader: req.user.id,
      status: 'uploaded'
    });

    await newVideo.save();

        res.status(201).json({
            message: "Video uploaded successfully",
            video: newVideo
        });
        // Start background processing (pass the video and socket instance)
        simulateProcessing(newVideo, req.io);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- Processing Simulation Helper ---
const simulateProcessing = async (video, io) => {
    let progress = 0;

    // Update DB to 'processing'
    video.status = 'processing';
    await video.save();

    // Send update to frontend: Processing Started
    io.emit('videoProgress', { videoId: video._id, progress: 0, status: 'processing' });

    // Simulate processing (every 2 seconds, increase by 20%)
    const interval = setInterval(async () => {
        progress += 20;

        if (progress < 100) {
            // Send progress update
            io.emit('videoProgress', { videoId: video._id, progress: progress, status: 'processing' });
        } else {
            // Processing Complete
            clearInterval(interval);

            // Randomly decide if Safe or Flagged
            const isSafe = Math.random() > 0.3; // 70% chance of being safe
            video.sensitivity = isSafe ? 'safe' : 'flagged';
            video.status = 'completed';
            await video.save();

            // Send final update
            io.emit('videoProgress', {
                videoId: video._id,
                progress: 100,
                status: 'completed',
                sensitivity: video.sensitivity
            });
        }
    }, 2000); // Run every 2 seconds
};
const fs = require('fs'); // File System module to read files

// ROUTE 1: PUBLIC FEED (For Viewers & Everyone)
router.get('/feed', async (req, res) => {
  try {
    const videos = await Video.find({ 
      status: 'completed', 
      sensitivity: 'safe' 
    })
    .sort({ uploadDate: -1 })
    .populate('uploader', 'username'); // Get uploader's username
    
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROUTE 2: MY VIDEOS (For Editors)
// Returns ALL videos uploaded by the logged-in user (even processing/flagged ones)
router.get('/my-videos', verifyToken, async (req, res) => {
    try {
        const videos = await Video.find({ uploader: req.user.id }).sort({ uploadDate: -1 });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// STREAMING ROUTE
router.get('/stream/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/', filename);

    // 1. Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Video not found" });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // 2. Handle Range Request (Browser asking for a chunk)
    if (range) {
        // Parse the range (e.g., "bytes=32324-")
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        // Calculate chunk size (important for performance)
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });

        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        // Send Status 206 (Partial Content)
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        // 3. Handle Initial Request (If browser doesn't ask for range yet)
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});
// --- ADMIN MODERATION ROUTES ---

// 1. ADMIN: Get ALL videos (with uploader info)
router.get('/admin/all', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access Denied" });
        }
        // .populate('uploader') lets us see WHO uploaded the video
        const videos = await Video.find().populate('uploader', 'username email').sort({ uploadDate: -1 });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ADMIN/OWNER: Delete Video
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: "Video not found" });

        // Allow if Admin OR if User owns the video
        if (req.user.role !== 'admin' && video.uploader.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own videos" });
        }

        await video.deleteOne();
        res.json({ message: "Video deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. ADMIN: Block (Flag) Video
router.put('/:id/block', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Access Denied" });

        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: "Video not found" });

        // "Block" it by forcing sensitivity to 'flagged'
        video.sensitivity = 'flagged';
        await video.save();

        res.json({ message: "Video blocked successfully", video });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 4. ADMIN: Unblock (Safe) Video
router.put('/:id/unblock', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Access Denied" });

        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: "Video not found" });

        // "Unblock" it by forcing sensitivity to 'safe'
        video.sensitivity = 'safe';
        await video.save();

        res.json({ message: "Video unblocked (safe)", video });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;