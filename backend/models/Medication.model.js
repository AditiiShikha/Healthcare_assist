const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide medication name'],
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  dosage: {
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['mg', 'g', 'ml', 'mcg', 'IU', 'tablet', 'capsule', 'drop'],
      required: true
    }
  },
  frequency: {
    type: String,
    required: true,
    enum: ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed', 'custom']
  },
  customSchedule: [{
    time: String, // Format: "HH:MM"
    withFood: {
      type: String,
      enum: ['before', 'after', 'with', 'not_required']
    }
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isOngoing: {
    type: Boolean,
    default: false
  },
  purpose: {
    type: String,
    required: true
  },
  simplifiedPurpose: {
    type: String
  },
  precautions: [{
    type: String
  }],
  simplifiedPrecautions: [{
    type: String
  }],
  sideEffects: [{
    effect: String,
    severity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'serious']
    }
  }],
  prescribedBy: {
    doctorName: String,
    hospital: String,
    contactNumber: String
  },
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  reminderTimes: [{
    type: String 
  }],
  stockQuantity: {
    type: Number,
    min: 0
  },
  refillReminder: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 7
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

medicationSchema.index({ userId: 1, isActive: 1 });
medicationSchema.index({ userId: 1, startDate: 1 });


medicationSchema.methods.needsRefill = function() {
  if (!this.refillReminder.enabled) return false;
  return this.stockQuantity <= this.refillReminder.threshold;
};

module.exports = mongoose.model('Medication', medicationSchema);