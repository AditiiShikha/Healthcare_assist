const Joi = require('joi');

/**
 * Validation schemas
 */
const schemas = {
  // User registration validation
  registerUser: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    age: Joi.number().min(0).max(150).optional(),
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    preferredLanguage: Joi.string().valid('en', 'hi', 'es', 'fr', 'de', 'ta', 'te', 'bn').optional(),
    emergencyContact: Joi.object({
      name: Joi.string().optional(),
      phoneNumber: Joi.string().optional(),
      relationship: Joi.string().optional()
    }).optional()
  }),

  // User login validation
  loginUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Medication creation validation
  createMedication: Joi.object({
    name: Joi.string().required(),
    genericName: Joi.string().optional(),
    dosage: Joi.object({
      amount: Joi.number().positive().required(),
      unit: Joi.string().valid('mg', 'g', 'ml', 'mcg', 'IU', 'tablet', 'capsule', 'drop').required()
    }).required(),
    frequency: Joi.string().valid('once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed', 'custom').required(),
    customSchedule: Joi.array().items(Joi.object({
      time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      withFood: Joi.string().valid('before', 'after', 'with', 'not_required').optional()
    })).optional(),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
    isOngoing: Joi.boolean().optional(),
    purpose: Joi.string().required(),
    precautions: Joi.array().items(Joi.string()).optional(),
    sideEffects: Joi.array().items(Joi.object({
      effect: Joi.string().required(),
      severity: Joi.string().valid('common', 'uncommon', 'rare', 'serious').optional()
    })).optional(),
    prescribedBy: Joi.object({
      doctorName: Joi.string().optional(),
      hospital: Joi.string().optional(),
      contactNumber: Joi.string().optional()
    }).optional(),
    reminderEnabled: Joi.boolean().optional(),
    stockQuantity: Joi.number().min(0).optional(),
    notes: Joi.string().optional()
  }),

  // Medical text simplification validation
  simplifyMedicalText: Joi.object({
    text: Joi.string().required(),
    targetLanguage: Joi.string().valid('en', 'hi', 'es', 'fr', 'de', 'ta', 'te', 'bn').optional(),
    simplificationLevel: Joi.string().valid('basic', 'intermediate', 'advanced').optional()
  }),

  // Manipulation detection validation
  detectManipulation: Joi.object({
    text: Joi.string().required(),
    context: Joi.string().optional()
  })
};

/**
 * Validation middleware factory
 */
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Validation schema not found'
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

module.exports = { validate, schemas };