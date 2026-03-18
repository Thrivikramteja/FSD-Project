const express = require('express');
const router = express.Router();
const { getImpactStories, createImpactStory, getImpactStoriesByCarehome } = require('../controllers/impactStories.controller');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'public/uploads/';
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'Carehomes/'; // Reuse existing folder
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'Events/'; // Reuse existing folder
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Routes
router.get('/api/impact-stories', getImpactStories);
router.post('/api/impact-stories', upload.array('media'), createImpactStory); // For creating stories
router.get('/api/impact-stories/carehome/:carehomeId', getImpactStoriesByCarehome);

module.exports = router;