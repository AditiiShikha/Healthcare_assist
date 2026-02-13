const express = require('express');
const router = express.Router();
const {
  detectManipulation,
  getDetectionHistory,
  getManipulationStats
} = require('../controllers/manipulationDetector.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// All routes are protected
router.use(protect);

router.post('/', validate('detectManipulation'), detectManipulation);
router.get('/history', getDetectionHistory);
router.get('/stats', getManipulationStats);

module.exports = router;