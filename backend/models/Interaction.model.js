const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interactionType: {
    type: String,
    enum: [
      'medical_simplification',
      'manipulation_detection',
      'medication_query',
      'voice_interaction',
      'general_query'
    ],
    required: true
  },
  inputText: {
    type: String,
    required: true
  },
  inputVoice: {
    audioUrl: String,
    duration: Number, // in seconds
    transcription: String
  },
  outputText: {
    type: String,
    required: true
  },
  outputVoice: {
    audioUrl: String,
    duration: Number
  },
  detectionResults: {
    isManipulative: Boolean,
    manipulationScore: Number, // 0-100
    manipulationTypes: [{
      type: String,
      enum: [
        'fear_based',
        'exaggeration',
        'false_urgency',
        'emotional_manipulation',
        'misinformation',
        'unverified_claims'
      ]
    }],
    explanation: String,
    simplifiedExplanation: String
  },
  simplificationResults: {
    originalComplexity: Number, // 0-100
    simplifiedComplexity: Number, // 0-100
    medicalTermsReplaced: Number,
    readabilityScore: Number
  },
  relatedMedication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication'
  },
  userFeedback: {
    helpful: Boolean,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    feedbackDate: Date
  },
  sessionId: {
    type: String,
    index: true
  },
  metadata: {
    language: String,
    deviceType: String,
    responseTime: Number, // in milliseconds
    aiModel: String,
    confidence: Number // 0-100
  }
}, {
  timestamps: true
});


interactionSchema.index({ userId: 1, createdAt: -1 });
interactionSchema.index({ sessionId: 1 });
interactionSchema.index({ interactionType: 1, createdAt: -1 });


interactionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    type: this.interactionType,
    date: this.createdAt,
    helpful: this.userFeedback?.helpful,
    rating: this.userFeedback?.rating
  };
};

module.exports = mongoose.model('Interaction', interactionSchema);