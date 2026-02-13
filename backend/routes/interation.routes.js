const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Interaction = require('../models/Interaction.model');

// All routes are protected
router.use(protect);

/**
 * @desc    Get user's interaction history
 * @route   GET /api/interactions
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;

    const query = { userId: req.user.id };
    
    if (type) {
      query.interactionType = type;
    }

    const interactions = await Interaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Interaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        interactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get single interaction
 * @route   GET /api/interactions/:id
 * @access  Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const interaction = await Interaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { interaction }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Submit feedback for interaction
 * @route   PUT /api/interactions/:id/feedback
 * @access  Private
 */
router.put('/:id/feedback', async (req, res, next) => {
  try {
    const { helpful, rating, comment } = req.body;

    const interaction = await Interaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }

    interaction.userFeedback = {
      helpful,
      rating,
      comment,
      feedbackDate: new Date()
    };

    await interaction.save();

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { interaction }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get interaction statistics
 * @route   GET /api/interactions/stats/summary
 * @access  Private
 */
router.get('/stats/summary', async (req, res, next) => {
  try {
    const totalInteractions = await Interaction.countDocuments({ userId: req.user.id });

    const interactionsByType = await Interaction.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: '$interactionType', count: { $sum: 1 } } }
    ]);

    const avgRating = await Interaction.aggregate([
      { $match: { userId: req.user.id, 'userFeedback.rating': { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$userFeedback.rating' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalInteractions,
        interactionsByType: interactionsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        averageRating: avgRating.length > 0 ? avgRating[0].avgRating.toFixed(2) : null
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;