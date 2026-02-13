const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
router.get('/profile', (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
router.put('/profile', async (req, res, next) => {
  try {
    const User = require('../models/User.model');
    const { name, age, phoneNumber, preferredLanguage, emergencyContact } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, age, phoneNumber, preferredLanguage, emergencyContact },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
