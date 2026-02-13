const express = require('express');
const router = express.Router();
const {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  getMedicationsNeedingRefill
} = require('../controllers/medication.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// All routes are protected (require authentication)
router.use(protect);

router.route('/')
  .get(getMedications)
  .post(validate('createMedication'), createMedication);

router.get('/refill/needed', getMedicationsNeedingRefill);

router.route('/:id')
  .get(getMedication)
  .put(updateMedication)
  .delete(deleteMedication);

module.exports = router;