/**
 * server/models/UserDream.js
 * Mongoose schema for the UserDream collection.
 * Stores user dreams and references to goals created for achieving them.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the UserDream Schema
const UserDreamSchema = new Schema({
    // Reference to the user who owns this dream
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The user's dream text
    dreamText: {
        type: String,
        required: [true, 'Dream text is required.'],
        trim: true
    },
    // User's confidence level (1-100)
    confidence: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    // Target timeline in weeks
    timeHorizon: {
        type: Number,
        required: true,
        min: 1
    },
    // Learning style preference
    learningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
        required: true
    },
    // Time commitment style
    timeCommitment: {
        type: String,
        enum: ['micro-burst', 'focused-blocks', 'flexible-flow', 'beast-mode'],
        required: true
    },
    // Archetype data for personalized journey tracking
    archetypeData: {
        type: {
            type: String,
            enum: ['career', 'creative', 'emotional', 'self-discovery', null],
            default: null
        },
        // Career archetype fields
        desired_role: { type: String, default: '' },
        desired_company: { type: String, default: '' },
        current_role: { type: String, default: '' },
        current_location: { type: String, default: '' },
        
        // Creative archetype fields
        creative_goal: { type: String, default: '' },
        current_challenge: { type: String, default: '' },
        
        // Emotional archetype fields
        current_emotion: { type: String, default: '' },
        desired_emotion: { type: String, default: '' },
        
        // Self-discovery archetype fields
        rediscover_aspect: { type: String, default: '' },
        after_experience: { type: String, default: '' },
        
        // Common fields across all archetypes
        emotional_driver: { type: String, default: '' },
        motivation: { type: String, default: '' },
        
        // Future enhancement for role suggestions
        suggested_role: { type: String, default: '' },
        
        // Tracking completed template fields
        completedFields: [{ type: String }],
        
        // Metadata
        selectedTemplate: { type: String, default: '' },
        parsingAccuracy: { type: Number, default: 0 }, // 0-100% how well we parsed
        lastParsedAt: { type: Date, default: Date.now },
        
        // Auto-extracted metadata from dream text
        targetRole: { type: String, default: '' },      // "Product Manager", "Coach", "Founder"
        domain: { type: String, default: '' },          // "AI tools", "Storytelling", "Digital wellness"  
        currentRole: { type: String, default: '' },     // "Customer success", "Agency marketing", "Freelancing"
        location: { type: String, default: '' },        // "Berlin", "Austin", "Dubai"
        motivation: { type: String, default: '' }       // "Ready to own", "Amplify stories", "Scale my ideas"
    },
    // Status of the dream journey
    status: {
        type: String,
        enum: ['active', 'completed', 'paused', 'archived'],
        default: 'active'
    },
    // Array of goal IDs created for this dream (references to WeeklyGoal)
    goalIds: [{
        type: Schema.Types.ObjectId,
        ref: 'WeeklyGoal'
    }],
    // Plan generation metadata
    planGenerated: {
        type: Boolean,
        default: false
    },
    planGeneratedAt: {
        type: Date
    },
    // 21-day journey specific fields
    journeyStartDate: {
        type: Date
    },
    currentDay: {
        type: Number,
        default: 1,
        min: 1,
        max: 21
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
UserDreamSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Instance method to add goal ID
UserDreamSchema.methods.addGoalId = function(goalId) {
    if (!this.goalIds.includes(goalId)) {
        this.goalIds.push(goalId);
    }
    return this.save();
};

// Instance method to remove goal ID
UserDreamSchema.methods.removeGoalId = function(goalId) {
    this.goalIds = this.goalIds.filter(id => !id.equals(goalId));
    return this.save();
};

// Static method to find active dreams for a user
UserDreamSchema.statics.findActiveDreams = function(userId) {
    return this.find({ user: userId, status: 'active' });
};

// Create and export the UserDream model
module.exports = mongoose.model('UserDream', UserDreamSchema);