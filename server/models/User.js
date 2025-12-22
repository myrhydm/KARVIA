/**
 * server/models/User.js
 * Mongoose schema for the User collection.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the User Schema
const UserSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required.']
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true, // Ensures no two users can have the same email
        match: [/.+\@.+\..+/, 'Please fill a valid email address.'] // Basic email validation
    },
    password: {
        type: String,
        required: [true, 'Password is required.']
        // Password will be hashed by bcrypt in the route logic before saving.
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // Extended profile fields
    fullName: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    
    // Professional assets
    blogUrl: {
        type: String,
        default: ''
    },
    twitterHandle: {
        type: String,
        default: ''
    },
    linkedinUrl: {
        type: String,
        default: ''
    },
    sideProjects: {
        type: String,
        default: ''
    },
    
    // Scoring Data Consent - User controls what data to include in scoring
    scoringConsent: {
        // Professional Profile Bundle
        professionalProfile: {
            enabled: {
                type: Boolean,
                default: false
            },
            consentedAt: Date,
            includes: {
                bio: { type: Boolean, default: false },
                blogUrl: { type: Boolean, default: false },
                twitterHandle: { type: Boolean, default: false },
                linkedinUrl: { type: Boolean, default: false },
                sideProjects: { type: Boolean, default: false },
                location: { type: Boolean, default: false }
            }
        },
        
        // Assessment Data Bundle
        assessmentData: {
            enabled: {
                type: Boolean,
                default: true  // Default consent for assessment data
            },
            consentedAt: Date,
            includes: {
                visionQuestionnaire: { type: Boolean, default: true },
                pmAssessment: { type: Boolean, default: true },
                visionProfile: { type: Boolean, default: true },
                personalityData: { type: Boolean, default: false }
            }
        },
        
        // Behavioral Tracking Bundle
        behavioralTracking: {
            enabled: {
                type: Boolean,
                default: true  // Default consent for behavioral tracking
            },
            consentedAt: Date,
            includes: {
                taskPatterns: { type: Boolean, default: true },
                loginBehavior: { type: Boolean, default: true },
                engagementQuality: { type: Boolean, default: true },
                reflectionContent: { type: Boolean, default: false },
                timeTracking: { type: Boolean, default: true }
            }
        },
        
        // External Integrations Bundle (Future)
        externalIntegrations: {
            enabled: {
                type: Boolean,
                default: false
            },
            consentedAt: Date,
            includes: {
                socialMediaActivity: { type: Boolean, default: false },
                professionalNetworks: { type: Boolean, default: false },
                contentCreation: { type: Boolean, default: false },
                marketEngagement: { type: Boolean, default: false }
            }
        }
    },
    
    // User preferences
    preferences: {
        // Learning & Time preferences
        learningStyle: {
            type: String,
            enum: ['hands-on', 'visual', 'reading', 'discussion', 'research', 'community', 'structured'],
            default: 'hands-on'
        },
        timeCommitment: {
            type: String,
            enum: ['light', 'moderate', 'focused-blocks', 'intensive', 'micro', 'focused', 'flexible'],
            default: 'focused'
        },
        
        // Focus & Goals preferences
        focusArea: {
            type: String,
            enum: ['get-job', 'build-business', 'get-promotion', 'skill-building', 'career-change', 'freelance'],
            default: 'skill-building'
        },
        challengeLevel: {
            type: String,
            enum: ['easy-wins', 'balanced', 'stretch', 'ambitious'],
            default: 'balanced'
        },
        
        // Work Style preferences
        collaborationStyle: {
            type: String,
            enum: ['solo', 'small-group', 'community', 'mentorship'],
            default: 'solo'
        },
        accountabilityType: {
            type: String,
            enum: ['self-directed', 'check-ins', 'peer-buddy', 'coach'],
            default: 'self-directed'
        },
        
        // Notification preferences
        notifications: {
            dailyReminders: {
                type: Boolean,
                default: true
            },
            progressUpdates: {
                type: Boolean,
                default: true
            },
            motivationQuotes: {
                type: Boolean,
                default: false
            },
            milestoneCelebrations: {
                type: Boolean,
                default: true
            }
        }
    },
    
    // Resume storage
    resumes: [{
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Flexible stage data - can store any structure per stage
    stageData: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // General engagement tracking
    lastCheckIn: {
        type: Date,
        default: Date.now
    },
    streakCount: {
        type: Number,
        default: 0
    },
    
    // Login tracking for journey progress
    loginCount: {
        type: Number,
        default: 1
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    completedTasks: {
        type: Number,
        default: 0
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    
    // Stage-based progression system
    userStage: {
        type: String,
        default: 'discovery',
        enum: ['discovery', 'onboarding', 'growth', 'mastery', 'mentorship']
    },
    stageStartDate: {
        type: Date,
        default: Date.now
    },
    stageProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    stageMetrics: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    stageHistory: [{
        stage: String,
        startDate: { type: Date, default: Date.now },
        endDate: Date,
        finalScore: Number,
        achievements: [String],
        duration: Number // days
    }],
    
    // Email preferences
    emailPreferences: {
        dailyReminders: {
            type: Boolean,
            default: true
        },
        streakBroken: {
            type: Boolean,
            default: true
        },
        weeklyProgress: {
            type: Boolean,
            default: true
        },
        visionUnlocked: {
            type: Boolean,
            default: true
        },
        unsubscribed: {
            type: Boolean,
            default: false
        }
    },
    
    // Email tracking
    emailHistory: [{
        type: {
            type: String,
            enum: ['daily-reminder', 'streak-broken', 'vision-unlocked', 'welcome', 'progress-update']
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        success: Boolean
    }],
    
    // Legacy fields for backward compatibility
    onboardingCompleted: {
        type: Boolean,
        default: false
    },
    onboardingData: {
        dream: {
            type: String,
            default: ''
        },
        timeline: {
            type: Number,
            default: 12
        },
        confidence: {
            type: Number,
            default: 50
        },
        completedAt: {
            type: Date,
            default: null
        }
    }
});

// Create and export the User model
module.exports = mongoose.model('User', UserSchema);
