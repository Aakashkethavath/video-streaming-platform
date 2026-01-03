const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  filename:    { type: String, required: true },
  uploader:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadDate:  { type: Date, default: Date.now },

  // Status for the progress bar
  status:      { type: String, enum: ['pending', 'processing', 'completed'], default: 'pending' },

  // Result of sensitivity analysis
  sensitivity: { type: String, enum: ['safe', 'flagged', 'unverified'], default: 'unverified' }
});

module.exports = mongoose.model('Video', videoSchema);