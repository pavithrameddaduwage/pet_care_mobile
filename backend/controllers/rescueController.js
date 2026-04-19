const RescueCase = require('../models/RescueCase');
const fs = require('fs');
const path = require('path');

// @desc    Get all rescue cases
// @route   GET /api/rescues
exports.getRescues = async (req, res) => {
  try {
    const rescues = await RescueCase.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: rescues.length, data: rescues });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single rescue case
// @route   GET /api/rescues/:id
exports.getRescue = async (req, res) => {
  try {
    const rescue = await RescueCase.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ success: false, error: 'Rescue case not found' });
    }
    res.status(200).json({ success: true, data: rescue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new rescue case
// @route   POST /api/rescues
exports.createRescue = async (req, res) => {
  try {
    const rescueData = { ...req.body };
    
    // Parse coordinates if they come as a string (FormData often sends strings)
    if (typeof rescueData.coordinates === 'string') {
      try {
        rescueData.coordinates = JSON.parse(rescueData.coordinates);
      } catch (e) {
        console.error('Failed to parse coordinates:', e);
      }
    }

    if (req.file) {
      rescueData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const rescue = await RescueCase.create(rescueData);
    console.log('✅ Rescue case created:', rescue._id);
    res.status(201).json({ success: true, data: rescue });
  } catch (err) {
    console.error('❌ Error creating rescue:', err.message);
    const errorMessage = err.errors 
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message;
    res.status(400).json({ success: false, error: errorMessage });
  }
};

// @desc    Update rescue case
// @route   PUT /api/rescues/:id
exports.updateRescue = async (req, res) => {
  try {
    let rescue = await RescueCase.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ success: false, error: 'Rescue case not found' });
    }

    const updateData = { ...req.body };

    // Handle coordinates if updated
    if (typeof updateData.coordinates === 'string') {
      try {
        updateData.coordinates = JSON.parse(updateData.coordinates);
      } catch (e) {
        console.error('Failed to parse coordinates:', e);
      }
    }

    // Handle new image upload
    if (req.file) {
      // Delete old image if it exists
      if (rescue.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', rescue.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    rescue = await RescueCase.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    console.log('Rescue case updated:', rescue._id);
    res.status(200).json({ success: true, data: rescue });
  } catch (err) {
    console.error('Error updating rescue:', err.message);
    const errorMessage = err.errors 
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message;
    res.status(400).json({ success: false, error: errorMessage });
  }
};

// @desc    Delete rescue case
// @route   DELETE /api/rescues/:id
exports.deleteRescue = async (req, res) => {
  try {
    const rescue = await RescueCase.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ success: false, error: 'Rescue case not found' });
    }

    // Delete image file
    if (rescue.imageUrl) {
      const imagePath = path.join(__dirname, '..', rescue.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await rescue.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Add comment to rescue case
// @route   POST /api/rescues/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { text, author } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, error: 'Comment cannot be empty' });
    }

    const rescue = await RescueCase.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ success: false, error: 'Rescue case not found' });
    }

    rescue.comments.push({
      text: text.trim(),
      author: author || 'Volunteer',
      createdAt: new Date()
    });

    await rescue.save();
    res.status(201).json({ success: true, data: rescue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete comment from rescue case
// @route   DELETE /api/rescues/:id/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const rescue = await RescueCase.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ success: false, error: 'Rescue case not found' });
    }

    rescue.comments = rescue.comments.filter(c => c._id.toString() !== req.params.commentId);
    await rescue.save();

    res.status(200).json({ success: true, data: rescue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
