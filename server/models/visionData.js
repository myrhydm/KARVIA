const mongoose = require('mongoose');

const visionDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  responses: {
    dream: { type: String, required: true },
    why: { type: String, required: true },
    importance: { type: String, enum: ['curious', 'interested', 'committed', 'obsessed'], required: true },
    timeline: { type: String, enum: ['sprint', 'marathon', 'mountain'], required: true },
    timeCommitment: { type: String, enum: ['micro', 'focused', 'flexible'], required: true },
    workTraits: [{ type: String }],
    intensity: { type: String, enum: ['zen', 'balanced', 'high', 'beast'], required: true },
    learningStyle: { type: String, enum: ['handson', 'research', 'community', 'structured'], required: true },
    resume: { type: String },
    readiness: { type: String, enum: ['exploring', 'ready', 'unstoppable'], required: true },
    whySucceed: { type: String, required: true },
    pastLessons: { type: String },
    industryTrends: { type: Number, min: 1, max: 5 },
    competitive: { type: Number, min: 1, max: 5 },
    businessModels: { type: Number, min: 1, max: 5 },
    realImpact: { type: String, required: true },
    decisionLevel: { type: String, enum: ['execution', 'tactical', 'strategic', 'ownership'], required: true },
    blog: { type: String },
    twitter: { type: String },
    projects: { type: String },
    uniqueValue: [{ type: String }],
    deepMotivation: { type: String, required: true },
    startingProjects: { type: Number, min: 1, max: 5 },
    handlingObstacles: { type: Number, min: 1, max: 5 },
    riskTolerance: { type: String, enum: ['avoider', 'calculated', 'comfortable', 'seeker'], required: true },
    timeReality: { type: String, required: true },
    financial: { type: String, enum: ['tight', 'limited', 'moderate', 'flexible'], required: true },
    support: [{ type: String }],
    selfDoubt: { type: String, required: true },
    gutFeeling: { type: Number, min: 0, max: 100, default: 50 },
    beliefLevel: { type: Number, min: 1, max: 7, required: true },
    beliefHelp: { type: String }
  },
  resumeKeywords: [String],
  completedAt: { type: Date, default: Date.now },
  version: { type: String, default: '1.0' }
}, { timestamps: true });

const visionScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  visionDataId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VisionData',
    required: true
  },
  scores: {
    motivation: { type: Number, min: 0, max: 100, required: true },
    readiness: { type: Number, min: 0, max: 100, required: true },
    experience: { type: Number, min: 0, max: 100, required: true },
    confidence: { type: Number, min: 0, max: 100, required: true },
    overall: { type: Number, min: 0, max: 100, required: true }
  },
  analysis: {
    strengths: [{ type: String }],
    growthAreas: [{ type: String }],
    recommendations: [{ type: String }],
    riskFactors: [{ type: String }],
    successPredictors: [{ type: String }]
  },
  persona: { type: mongoose.Schema.Types.Mixed },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
  successProbability: { type: mongoose.Schema.Types.Mixed },
  analysisVersion: { type: String },
  personalizedMessage: { type: String },
  llmModel: { type: String, default: 'gpt-4' },
  processingTime: { type: Number },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const visionFeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  visionDataId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VisionData',
    required: true
  },
  keyStrengths: [{
    category: { type: String, required: true },
    description: { type: String, required: true },
    impact: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  }],
  improvementAreas: [{
    category: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    actionable: { type: Boolean, default: true }
  }],
  nextSteps: [{
    step: { type: String, required: true },
    timeframe: { type: String, enum: ['immediate', 'week', 'month', 'quarter'], required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
  }],
  risks: [{
    risk: { type: String, required: true },
    likelihood: { type: String, enum: ['low', 'medium', 'high'], required: true },
    mitigation: { type: String, required: true }
  }],
  learningPath: { type: mongoose.Schema.Types.Mixed },
  criticalSuccess: { type: mongoose.Schema.Types.Mixed },
  readinessLevel: { type: mongoose.Schema.Types.Mixed },
  recommendedTimeline: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// 🛡️ Prevent OverwriteModelError by checking if model already exists
module.exports = {
  VisionData: mongoose.models.VisionData || mongoose.model('VisionData', visionDataSchema),
  VisionScore: mongoose.models.VisionScore || mongoose.model('VisionScore', visionScoreSchema),
  VisionFeedback: mongoose.models.VisionFeedback || mongoose.model('VisionFeedback', visionFeedbackSchema)
};
