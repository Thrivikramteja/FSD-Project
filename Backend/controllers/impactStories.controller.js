const ImpactStory = require('../models/ImpactStory');

// Get all impact stories
const getImpactStories = async (req, res) => {
  try {
    const stories = await ImpactStory.find().populate('carehomeId', 'care_home_name city');
    res.json({ stories });
  } catch (error) {
    console.error('Error fetching impact stories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new impact story (for carehomes or admins)
const createImpactStory = async (req, res) => {
  try {
    const { carehomeId, title, description } = req.body;

    // Handle file uploads
    const images = [];
    const videos = [];

    if (req.files) {
      req.files.forEach(file => {
        if (file.mimetype.startsWith('image/')) {
          images.push(file.path);
        } else if (file.mimetype.startsWith('video/')) {
          videos.push(file.path);
        }
      });
    }

    const newStory = new ImpactStory({
      carehomeId,
      title,
      description,
      images,
      videos
    });

    await newStory.save();
    res.status(201).json({ message: 'Impact story created successfully', story: newStory });
  } catch (error) {
    console.error('Error creating impact story:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get impact stories by carehome
const getImpactStoriesByCarehome = async (req, res) => {
  try {
    const { carehomeId } = req.params;
    const stories = await ImpactStory.find({ carehomeId }).populate('carehomeId', 'care_home_name city');
    res.json({ stories });
  } catch (error) {
    console.error('Error fetching impact stories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getImpactStories,
  createImpactStory,
  getImpactStoriesByCarehome
};