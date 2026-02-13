const axios = require('axios');
const Interaction = require('../models/Interaction.model');

/**
 * @desc    Detect health misinformation and manipulation
 * @route   POST /api/detect
 * @access  Private
 */
const detectManipulation = async (req, res, next) => {
  try {
    const { text, context } = req.body;
    const userId = req.user.id;

    // Call Python FastAPI service for manipulation detection
    const pythonApiUrl = process.env.PYTHON_API_URL;

    if (!pythonApiUrl) {
      return res.status(503).json({
        success: false,
        message: 'Manipulation detection service is not configured'
      });
    }

    const startTime = Date.now();

    // Make request to Python AI service
    const response = await axios.post(
      `${pythonApiUrl}/detect-manipulation`,
      {
        text,
        context: context || '',
        user_language: req.user.preferredLanguage || 'en'
      },
      {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const responseTime = Date.now() - startTime;

    // Extract response data
    const {
      is_manipulative,
      manipulation_score,
      manipulation_types,
      explanation,
      simplified_explanation,
      confidence,
      recommendations
    } = response.data;

    // Store interaction in database
    const interaction = await Interaction.create({
      userId,
      interactionType: 'manipulation_detection',
      inputText: text,
      outputText: explanation,
      detectionResults: {
        isManipulative: is_manipulative,
        manipulationScore: manipulation_score,
        manipulationTypes: manipulation_types || [],
        explanation,
        simplifiedExplanation: simplified_explanation
      },
      metadata: {
        language: req.user.preferredLanguage || 'en',
        responseTime,
        aiModel: response.data.model_used || 'unknown',
        confidence
      }
    });

    res.status(200).json({
      success: true,
      data: {
        originalText: text,
        isManipulative: is_manipulative,
        manipulationScore: manipulation_score,
        riskLevel: manipulation_score > 70 ? 'high' : manipulation_score > 40 ? 'medium' : 'low',
        manipulationTypes: manipulation_types || [],
        explanation,
        simplifiedExplanation: simplified_explanation,
        recommendations: recommendations || [],
        interactionId: interaction._id,
        confidence
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'Manipulation detection service is currently unavailable. Please try again later.'
      });
    }

    next(error);
  }
};

/**
 * @desc    Get detection history
 * @route   GET /api/detect/history
 * @access  Private
 */
const getDetectionHistory = async (req, res, next) => {
  try {
    const { limit = 20, page = 1, onlyManipulative } = req.query;
    
    const query = {
      userId: req.user.id,
      interactionType: 'manipulation_detection'
    };

    if (onlyManipulative === 'true') {
      query['detectionResults.isManipulative'] = true;
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
};

/**
 * @desc    Get manipulation statistics
 * @route   GET /api/detect/stats
 * @access  Private
 */
const getManipulationStats = async (req, res, next) => {
  try {
    const interactions = await Interaction.find({
      userId: req.user.id,
      interactionType: 'manipulation_detection'
    });

    const totalChecks = interactions.length;
    const manipulativeCount = interactions.filter(i => i.detectionResults?.isManipulative).length;
    
    // Count manipulation types
    const manipulationTypeCounts = {};
    interactions.forEach(interaction => {
      if (interaction.detectionResults?.manipulationTypes) {
        interaction.detectionResults.manipulationTypes.forEach(type => {
          manipulationTypeCounts[type] = (manipulationTypeCounts[type] || 0) + 1;
        });
      }
    });

    // Calculate average manipulation score
    const avgScore = interactions.length > 0
      ? interactions.reduce((sum, i) => sum + (i.detectionResults?.manipulationScore || 0), 0) / interactions.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalChecks,
        manipulativeCount,
        safeCount: totalChecks - manipulativeCount,
        manipulativePercentage: totalChecks > 0 ? ((manipulativeCount / totalChecks) * 100).toFixed(2) : 0,
        averageManipulationScore: avgScore.toFixed(2),
        manipulationTypeBreakdown: manipulationTypeCounts,
        mostCommonType: Object.keys(manipulationTypeCounts).reduce((a, b) => 
          manipulationTypeCounts[a] > manipulationTypeCounts[b] ? a : b, null
        )
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  detectManipulation,
  getDetectionHistory,
  getManipulationStats
};