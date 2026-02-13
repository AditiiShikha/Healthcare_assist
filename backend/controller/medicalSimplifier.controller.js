const axios = require('axios');
const Interaction = require('../models/Interaction.model');

/**
 * @desc    Simplify medical text
 * @route   POST /api/simplify
 * @access  Private
 */
const simplifyMedicalText = async (req, res, next) => {
  try {
    const { text, targetLanguage, simplificationLevel } = req.body;
    const userId = req.user.id;

    // Call Python FastAPI service for medical text simplification
    const pythonApiUrl = process.env.PYTHON_API_URL;

    if (!pythonApiUrl) {
      return res.status(503).json({
        success: false,
        message: 'Medical simplification service is not configured'
      });
    }

    const startTime = Date.now();

    // Make request to Python AI service
    const response = await axios.post(
      `${pythonApiUrl}/simplify`,
      {
        text,
        target_language: targetLanguage || req.user.preferredLanguage || 'en',
        simplification_level: simplificationLevel || 'basic'
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
      simplified_text,
      original_complexity,
      simplified_complexity,
      medical_terms_replaced,
      readability_score,
      confidence
    } = response.data;

    // Store interaction in database
    const interaction = await Interaction.create({
      userId,
      interactionType: 'medical_simplification',
      inputText: text,
      outputText: simplified_text,
      simplificationResults: {
        originalComplexity: original_complexity,
        simplifiedComplexity: simplified_complexity,
        medicalTermsReplaced: medical_terms_replaced,
        readabilityScore: readability_score
      },
      metadata: {
        language: targetLanguage || req.user.preferredLanguage || 'en',
        responseTime,
        aiModel: response.data.model_used || 'unknown',
        confidence
      }
    });

    res.status(200).json({
      success: true,
      data: {
        originalText: text,
        simplifiedText: simplified_text,
        complexity: {
          original: original_complexity,
          simplified: simplified_complexity,
          improvement: original_complexity - simplified_complexity
        },
        medicalTermsReplaced: medical_terms_replaced,
        readabilityScore: readability_score,
        interactionId: interaction._id
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'Medical simplification service is currently unavailable. Please try again later.'
      });
    }

    next(error);
  }
};

/**
 * @desc    Get simplification history
 * @route   GET /api/simplify/history
 * @access  Private
 */
const getSimplificationHistory = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    const interactions = await Interaction.find({
      userId: req.user.id,
      interactionType: 'medical_simplification'
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Interaction.countDocuments({
      userId: req.user.id,
      interactionType: 'medical_simplification'
    });

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

module.exports = {
  simplifyMedicalText,
  getSimplificationHistory
};