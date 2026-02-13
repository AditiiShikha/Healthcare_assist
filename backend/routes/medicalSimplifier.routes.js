const express = require('express');
const router = express.Router();
const {
  simplifyMedicalText,
  getSimplificationHistory
} = require('../controllers/medicalSimplifier.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// All routes are protected
router.use(protect);

router.post('/', validate('simplifyMedicalText'), simplifyMedicalText);
router.get('/history', getSimplificationHistory);

module.exports = router;