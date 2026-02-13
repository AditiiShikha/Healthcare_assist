const Medication = require('../models/Medication.model');
const axios = require('axios');

/**
 * @desc    Get all medications for logged-in user
 * @route   GET /api/medications
 * @access  Private
 */
const getMedications = async (req, res, next) => {
  try {
    const { isActive, startDate, endDate } = req.query;
    
    const query = { userId: req.user.id };
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const medications = await Medication.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: medications.length,
      data: { medications }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single medication by ID
 * @route   GET /api/medications/:id
 * @access  Private
 */
const getMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { medication }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new medication
 * @route   POST /api/medications
 * @access  Private
 */
const createMedication = async (req, res, next) => {
  try {
    const medicationData = {
      ...req.body,
      userId: req.user.id
    };

    // If purpose and precautions are provided, simplify them using Python API
    if (process.env.PYTHON_API_URL) {
      try {
        // Simplify purpose
        if (medicationData.purpose) {
          const purposeResponse = await axios.post(
            `${process.env.PYTHON_API_URL}/simplify`,
            { text: medicationData.purpose, targetLanguage: req.user.preferredLanguage },
            { timeout: 5000 }
          );
          medicationData.simplifiedPurpose = purposeResponse.data.simplified_text;
        }

        // Simplify precautions
        if (medicationData.precautions && medicationData.precautions.length > 0) {
          const precautionsText = medicationData.precautions.join('. ');
          const precautionsResponse = await axios.post(
            `${process.env.PYTHON_API_URL}/simplify`,
            { text: precautionsText, targetLanguage: req.user.preferredLanguage },
            { timeout: 5000 }
          );
          medicationData.simplifiedPrecautions = precautionsResponse.data.simplified_text.split('. ');
        }
      } catch (apiError) {
        console.warn('Python API not available, skipping simplification:', apiError.message);
      }
    }

    const medication = await Medication.create(medicationData);

    res.status(201).json({
      success: true,
      message: 'Medication created successfully',
      data: { medication }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update medication
 * @route   PUT /api/medications/:id
 * @access  Private
 */
const updateMedication = async (req, res, next) => {
  try {
    let medication = await Medication.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Medication updated successfully',
      data: { medication }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete medication
 * @route   DELETE /api/medications/:id
 * @access  Private
 */
const deleteMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    await medication.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Medication deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get medications needing refill
 * @route   GET /api/medications/refill/needed
 * @access  Private
 */
const getMedicationsNeedingRefill = async (req, res, next) => {
  try {
    const medications = await Medication.find({
      userId: req.user.id,
      isActive: true,
      'refillReminder.enabled': true
    });

    const needingRefill = medications.filter(med => med.needsRefill());

    res.status(200).json({
      success: true,
      count: needingRefill.length,
      data: { medications: needingRefill }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  getMedicationsNeedingRefill
};