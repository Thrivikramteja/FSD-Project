const mongoose = require('mongoose');

const ImpactStorySchema = new mongoose.Schema({
  carehomeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Carehome' },
  title: String,
  description: String,
  images: [String], // File paths for photos
  videos: [String], // File paths for videos
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ImpactStory', ImpactStorySchema);