const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const axios = require('axios');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// All routes are protected
router.use(protect);

/**
 * @desc    Convert speech to text
 * @route   POST /api/voice/speech-to-text
 * @access  Private
 */
router.post('/speech-to-text', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an audio file'
      });
    }

    const pythonApiUrl = process.env.PYTHON_API_URL;

    if (!pythonApiUrl) {
      return res.status(503).json({
        success: false,
        message: 'Speech-to-text service is not configured'
      });
    }

    // Send audio to Python service for transcription
    const formData = new FormData();
    formData.append('audio', new Blob([req.file.buffer]), req.file.originalname);
    formData.append('language', req.user.preferredLanguage || 'en');

    const response = await axios.post(
      `${pythonApiUrl}/speech-to-text`,
      formData,
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    res.status(200).json({
      success: true,
      data: {
        transcription: response.data.transcription,
        confidence: response.data.confidence,
        language: response.data.language
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'Speech-to-text service is currently unavailable'
      });
    }
    next(error);
  }
});

/**
 * @desc    Convert text to speech
 * @route   POST /api/voice/text-to-speech
 * @access  Private
 */
router.post('/text-to-speech', async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide text to convert'
      });
    }

    const pythonApiUrl = process.env.PYTHON_API_URL;

    if (!pythonApiUrl) {
      return res.status(503).json({
        success: false,
        message: 'Text-to-speech service is not configured'
      });
    }

    const response = await axios.post(
      `${pythonApiUrl}/text-to-speech`,
      {
        text,
        language: req.user.preferredLanguage || 'en',
        voice_gender: 'female', // Can be made configurable
        speaking_rate: 0.9 // Slightly slower for elderly users
      },
      {
        timeout: 30000,
        responseType: 'arraybuffer'
      }
    );

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.length
    });

    res.send(response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'Text-to-speech service is currently unavailable'
      });
    }
    next(error);
  }
});

module.exports = router;