/**
 * Vision Profile Model
 * Collects and stores user vision data through journey tasks
 */

const mongoose = require('mongoose');

const VisionDataPointSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['personal', 'professional', 'learning', 'networking', 'leadership', 'values', 'motivation', 'skills', 'timeline', 'support']
    },
    key: {
        type: String,
        required: true // e.g., 'success_definition', 'primary_motivation', 'learning_style'
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Can be string, number, array, object
        required: true
    },
    confidence: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    collectedAt: {
        type: Date,
        default: Date.now
    },
    collectedFrom: {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        },
        sprintNumber: Number,
        day: Number,
        method: {
            type: String,
            enum: ['task_completion', 'check_in', 'reflection', 'direct_input', 'initial_form'],
            default: 'task_completion'
        }
    }
});

const VisionProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    journeyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Journey',
        required: true
    },
    // Personal Discovery (Week 1)
    personalDiscovery: {
        coreValues: [String],
        successDefinition: String,
        primaryMotivation: {
            type: String,
            enum: ['achievement', 'impact', 'growth', 'security', 'recognition', 'autonomy']
        },
        confidenceLevel: {
            baseline: Number,
            trend: [{ date: Date, score: Number }]
        },
        commitmentLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'very_high']
        },
        timeAvailable: {
            type: String,
            enum: ['15min', '30min', '1hour', '2hours+']
        },
        currentSituation: {
            type: String,
            enum: ['employed', 'seeking', 'student', 'transitioning', 'other']
        },
        urgencyLevel: {
            type: String,
            enum: ['low', 'medium', 'high']
        }
    },
    // Professional Development (Week 2)
    professionalDevelopment: {
        skillPriorities: [String],
        learningStyle: {
            type: String,
            enum: ['visual', 'auditory', 'kinesthetic', 'reading', 'mixed']
        },
        learningPreference: {
            type: String,
            enum: ['structured', 'self_directed', 'mixed']
        },
        depthVsBreadth: {
            type: String,
            enum: ['deep_expertise', 'broad_knowledge', 'balanced']
        },
        industryKnowledge: {
            level: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced', 'expert']
            },
            trendAwareness: {
                type: String,
                enum: ['low', 'medium', 'high']
            }
        },
        networkingComfort: {
            type: String,
            enum: ['uncomfortable', 'neutral', 'comfortable', 'loves_it']
        },
        networkingPreference: {
            type: String,
            enum: ['online', 'in_person', 'mixed']
        },
        mentorshipStyle: {
            type: String,
            enum: ['formal', 'informal', 'peer_to_peer', 'mixed']
        },
        communityEngagement: {
            type: String,
            enum: ['observer', 'occasional_participant', 'active_participant', 'leader']
        }
    },
    // Leadership & Vision (Week 3)
    leadershipVision: {
        leadershipStyle: {
            type: String,
            enum: ['lead_by_example', 'directive', 'collaborative', 'servant_leader', 'transformational']
        },
        leadershipPhilosophy: String,
        impactMeasurement: [String],
        successMetrics: [String],
        longTermVision: String,
        riskTolerance: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        changeReadiness: {
            type: String,
            enum: ['resistant', 'cautious', 'open', 'embraces_change']
        },
        planningStyle: {
            type: String,
            enum: ['detailed_plans', 'flexible_frameworks', 'mixed']
        },
        accountabilityPreference: {
            type: String,
            enum: ['self_directed', 'peer_accountability', 'formal_check_ins', 'mixed']
        },
        energyPatterns: {
            mostProductive: {
                type: String,
                enum: ['early_morning', 'late_morning', 'afternoon', 'evening', 'night']
            },
            workStyle: {
                type: String,
                enum: ['focused_blocks', 'frequent_breaks', 'mixed_throughout']
            }
        }
    },
    // Data Collection Progress
    dataPoints: [VisionDataPointSchema],
    completionStatus: {
        personalDiscovery: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        professionalDevelopment: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        leadershipVision: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        overall: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    // AI Analysis
    aiInsights: {
        personalityProfile: String,
        recommendedApproach: String,
        strengthsIdentified: [String],
        growthAreas: [String],
        motivationTriggers: [String],
        adaptationStrategies: [String],
        lastAnalyzed: Date
    }
}, {
    timestamps: true
});

// Indexes for performance
VisionProfileSchema.index({ user: 1 });
VisionProfileSchema.index({ journeyId: 1 });
VisionProfileSchema.index({ 'dataPoints.category': 1 });
VisionProfileSchema.index({ 'dataPoints.key': 1 });

// Methods
VisionProfileSchema.methods.addDataPoint = function(category, key, value, options = {}) {
    const dataPoint = {
        category,
        key,
        value,
        confidence: options.confidence || 5,
        collectedFrom: options.collectedFrom || {}
    };
    
    this.dataPoints.push(dataPoint);
    this.updateCompletionStatus();
};

VisionProfileSchema.methods.updateCompletionStatus = function() {
    const categories = {
        personal: ['personal'],
        professional: ['professional', 'learning', 'networking'], 
        leadership: ['leadership', 'values', 'motivation']
    };
    
    // Calculate completion for each category
    Object.keys(categories).forEach(categoryGroup => {
        const relevantCategories = categories[categoryGroup];
        const relevantPoints = this.dataPoints.filter(dp => 
            relevantCategories.includes(dp.category)
        );
        
        // Simple completion calculation based on data points collected
        const maxPoints = categoryGroup === 'personal' ? 10 : 
                         categoryGroup === 'professional' ? 15 : 10;
        const completion = Math.min(100, (relevantPoints.length / maxPoints) * 100);
        
        this.completionStatus[`${categoryGroup}Discovery`] = completion;
    });
    
    // Overall completion
    const totalCompletion = (
        this.completionStatus.personalDiscovery +
        this.completionStatus.professionalDevelopment +
        this.completionStatus.leadershipVision
    ) / 3;
    
    this.completionStatus.overall = Math.round(totalCompletion);
};

VisionProfileSchema.methods.getDataByCategory = function(category) {
    return this.dataPoints.filter(dp => dp.category === category);
};

VisionProfileSchema.methods.getDataByKey = function(key) {
    return this.dataPoints.find(dp => dp.key === key);
};

module.exports = mongoose.model('VisionProfile', VisionProfileSchema);