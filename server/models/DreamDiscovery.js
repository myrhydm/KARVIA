const mongoose = require('mongoose');

const dreamDiscoverySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dreamId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    weekThemes: [{
        type: String,
        required: true
    }],
    goalProgression: {
        week1: {
            focus: String,
            goalIds: [mongoose.Schema.Types.ObjectId]
        },
        week2: {
            focus: String,
            goalIds: [mongoose.Schema.Types.ObjectId]
        },
        week3: {
            focus: String,
            goalIds: [mongoose.Schema.Types.ObjectId]
        }
    },
    subGoals: {
        type: Map,
        of: [String] // goalId -> array of sub-goal descriptions
    },
    habitFormationTips: [{
        type: String
    }],
    milestones: [{
        day: Number,
        title: String,
        description: String
    }],
    progressTrackingMetrics: {
        totalGoals: Number,
        estimatedCompletionDays: Number,
        difficultyLevel: String // 'beginner', 'intermediate', 'advanced'
    }
}, {
    timestamps: true
});

// Ensure one discovery plan per user-dream combination
dreamDiscoverySchema.index({ user: 1, dreamId: 1 }, { unique: true });

module.exports = mongoose.model('DreamDiscovery', dreamDiscoverySchema);