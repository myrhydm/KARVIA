/**
 * server/models/Task.js
 * Mongoose schema for the Task collection.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Task Schema
const TaskSchema = new Schema({
    // Reference to the user who owns this task
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Reference to the goal this task belongs to (null for journey tasks)
    goal: {
        type: Schema.Types.ObjectId,
        ref: 'WeeklyGoal',
        required: false // Allow null for journey tasks
    },
    // Reference to the journey this task belongs to (for new 21-day system)
    journey: {
        type: Schema.Types.ObjectId,
        ref: 'Journey',
        required: false
    },
    // Task identification
    name: {
        type: String,
        required: [true, 'Task name is required.'],
        trim: true
    },
    title: {
        type: String,
        trim: true // Alias for name for compatibility
    },
    
    // Time management
    estTime: {
        type: Number,
        required: true,
        min: 0
    },
    // The day of the week the task is scheduled for
    day: {
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        required: true
    },
    // Repeat type for recurring tasks
    repeatType: {
        type: String,
        enum: ['none', 'daily', 'alternate'],
        default: 'none'
    },
    
    // Completion tracking
    completed: {
        type: Boolean,
        default: false
    },
    isReflection: {
        type: Boolean,
        default: false
    },
    // Actual time spent on the task, in minutes
    timeSpent: {
        type: Number,
        default: 0
    },
    
    // Dynamic planning features (optional for manual tasks)
    rationale: {
        type: String,
        required: false,
        trim: true // Why this task is important for the user's dream
    },
    metricsImpacted: [{
        metric: {
            type: String,
            enum: ['commitment', 'clarity', 'growth_readiness', 'competency', 'opportunity', 'confidence', 'mindset'],
            required: false
        },
        expectedImpact: {
            type: String,
            enum: ['low', 'medium', 'high'],
            required: false
        },
        reasoning: {
            type: String,
            required: false // Why this task affects this metric
        }
    }],
    
    // User interaction and adaptation
    userFamiliarity: {
        type: String,
        enum: ['know_this', 'somewhat_familiar', 'no_idea', null],
        default: null // User rates after seeing task
    },
    difficultyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: false
    },
    skillCategory: {
        type: String,
        required: false // e.g., 'market_research', 'networking', 'technical'
    },
    
    // Planning context
    goalIndex: {
        type: Number, // Reference to which goal (0-4) this task supports
        min: 0,
        max: 4
    },
    weekNumber: {
        type: Number,
        min: 1,
        max: 52
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    
    // Adaptive learning
    adaptiveMetadata: {
        generationMethod: {
            type: String,
            enum: ['ai_generated', 'template_based', 'user_created'],
            default: 'ai_generated'
        },
        timeCommitmentStyle: {
            type: String,
            enum: ['micro-burst', 'focused-blocks', 'flexible-flow', 'beast-mode'],
            required: false
        },
        confidenceLevel: {
            type: Number,
            min: 0,
            max: 100 // User's confidence when task was generated
        },
        archetypeContext: {
            type: String,
            enum: ['career', 'creative', 'emotional', 'self-discovery', 'general'],
            default: 'general'
        }
    },
    
    // Completion feedback
    completionFeedback: {
        actualDifficulty: {
            type: String,
            enum: ['much_easier', 'easier', 'as_expected', 'harder', 'much_harder', null],
            default: null
        },
        valueRating: {
            type: Number,
            min: 1,
            max: 5 // How valuable was this task (1-5 stars)
        },
        clarityRating: {
            type: Number,
            min: 1,
            max: 5 // How clear were the instructions
        },
        notes: {
            type: String,
            trim: true
        }
    },
    
    // System learning
    performanceMetrics: {
        completionRate: {
            type: Number,
            default: 0 // 0-1, for similar tasks by similar users
        },
        averageTimeSpent: {
            type: Number,
            default: 0 // Average time spent by similar users
        },
        successRate: {
            type: Number,
            default: 0 // 0-1, how often this type of task leads to progress
        }
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
TaskSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Instance method to update user familiarity rating
TaskSchema.methods.updateFamiliarity = function(familiarityRating) {
    this.userFamiliarity = familiarityRating;
    return this.save();
};

// Instance method to submit completion feedback
TaskSchema.methods.submitCompletionFeedback = function(feedback) {
    this.completionFeedback = {
        ...this.completionFeedback,
        ...feedback
    };
    this.completed = true;
    return this.save();
};

// Static method to find tasks by metric impact
TaskSchema.statics.findByMetricImpact = function(userId, metric, impact = 'high') {
    return this.find({
        user: userId,
        'metricsImpacted.metric': metric,
        'metricsImpacted.expectedImpact': impact
    });
};

// Static method to get user familiarity stats
TaskSchema.statics.getUserFamiliarityStats = function(userId) {
    return this.aggregate([
        { $match: { user: userId, userFamiliarity: { $ne: null } } },
        { $group: {
            _id: '$userFamiliarity',
            count: { $sum: 1 },
            avgTimeSpent: { $avg: '$timeSpent' },
            completionRate: { $avg: { $cond: ['$completed', 1, 0] } }
        }}
    ]);
};

// Static method for adaptive learning insights
TaskSchema.statics.getAdaptiveLearningInsights = function(userId, archetypeContext) {
    return this.aggregate([
        { $match: { 
            user: userId, 
            'adaptiveMetadata.archetypeContext': archetypeContext,
            completed: true 
        }},
        { $group: {
            _id: '$skillCategory',
            avgCompletionTime: { $avg: '$timeSpent' },
            successRate: { $avg: { $cond: ['$completed', 1, 0] } },
            avgValueRating: { $avg: '$completionFeedback.valueRating' },
            taskCount: { $sum: 1 }
        }},
        { $sort: { avgValueRating: -1 } }
    ]);
};

// Create and export the Task model
module.exports = mongoose.model('Task', TaskSchema);
