const mongoose = require('mongoose');

const pmAssessmentDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  responses: { type: mongoose.Schema.Types.Mixed, required: true },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const pmAssessmentResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PMAssessmentData', required: true },
  dimensionScores: {
    productSkills: { type: Number, min: 0, max: 100 },
    leadership: { type: Number, min: 0, max: 100 },
    businessAcumen: { type: Number, min: 0, max: 100 },
    careerFoundation: { type: Number, min: 0, max: 100 },
    executivePresence: { type: Number, min: 0, max: 100 },
    overall: { type: Number, min: 0, max: 100 }
  },
  readinessLevel: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  PMAssessmentData: mongoose.models.PMAssessmentData || mongoose.model('PMAssessmentData', pmAssessmentDataSchema),
  PMAssessmentResult: mongoose.models.PMAssessmentResult || mongoose.model('PMAssessmentResult', pmAssessmentResultSchema)
};
