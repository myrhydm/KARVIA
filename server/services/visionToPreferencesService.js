/**
 * Vision Quest to Journey Preferences Auto-Population Service
 * Maps completed Vision Quest assessment data to Journey Preferences
 */

const { VisionData } = require('../models/visionData');
const User = require('../models/User');

class VisionToPreferencesService {
    /**
     * Auto-populate Journey Preferences from latest Vision Quest data
     * @param {string} userId - User ID
     * @returns {Object} Updated preferences or null if no vision data
     */
    async populatePreferencesFromVision(userId) {
        try {
            // Get latest Vision Quest data
            const visionData = await VisionData.findOne({ userId }).sort({ completedAt: -1 });
            
            if (!visionData || !visionData.responses) {
                console.log('No Vision Quest data found for user:', userId);
                return null;
            }

            // Get current user
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const responses = visionData.responses;
            const currentPrefs = user.preferences || {};
            
            // Build new preferences from Vision Quest data
            const mappedPreferences = {
                ...currentPrefs,
                learningStyle: this.mapLearningStyle(responses.learningStyle),
                timeCommitment: this.mapTimeCommitment(responses.timeCommitment),
                collaborationStyle: this.mapCollaborationStyle(responses.workTraits),
                challengeLevel: this.mapChallengeLevel(responses.intensity),
                accountabilityType: this.mapAccountabilityType(responses.support),
                focusArea: this.deriveFocusArea(responses.importance, responses.timeline, responses.dream),
                
                // Preserve existing notifications if they exist
                notifications: currentPrefs.notifications || {
                    dailyReminders: true,
                    progressUpdates: true,
                    motivationQuotes: false,
                    milestoneCelebrations: true
                }
            };

            // Update user preferences
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { 
                    $set: { 
                        preferences: mappedPreferences,
                        'stageData.visionPreferencesPopulated': true,
                        'stageData.visionPreferencesPopulatedAt': new Date()
                    }
                },
                { new: true, runValidators: true }
            );

            console.log('✅ Successfully populated preferences from Vision Quest for user:', userId);
            return updatedUser.preferences;

        } catch (error) {
            console.error('Error populating preferences from Vision Quest:', error);
            throw error;
        }
    }

    /**
     * Check if user needs preference population
     * @param {Object} user - User document
     * @returns {boolean} True if population is needed
     */
    needsPreferencePopulation(user) {
        // Check if Vision Quest completed but preferences not populated
        const visionCompleted = user.stageData?.get('visionQuestionnaireCompleted');
        const prefsPopulated = user.stageData?.get('visionPreferencesPopulated');
        
        return visionCompleted && !prefsPopulated;
    }

    /**
     * Map Vision Quest learning style to Journey Preference enum
     */
    mapLearningStyle(visionLearningStyle) {
        const mapping = {
            'handson': 'hands-on',
            'research': 'research',
            'community': 'community',
            'structured': 'structured'
        };
        
        return mapping[visionLearningStyle] || 'hands-on';
    }

    /**
     * Map Vision Quest time commitment to Journey Preference enum
     */
    mapTimeCommitment(visionTimeCommitment) {
        const mapping = {
            'micro': 'micro',
            'focused': 'focused',
            'flexible': 'flexible'
        };
        
        return mapping[visionTimeCommitment] || 'focused';
    }

    /**
     * Map Vision Quest work traits to collaboration style
     */
    mapCollaborationStyle(workTraits) {
        if (!Array.isArray(workTraits)) {
            return 'solo';
        }

        // Priority mapping based on work traits
        if (workTraits.includes('social')) {
            return 'community';
        }
        if (workTraits.includes('solo')) {
            return 'solo';
        }
        if (workTraits.includes('routine')) {
            return 'mentorship'; // Structured people often benefit from mentorship
        }
        if (workTraits.includes('spontaneous')) {
            return 'small-group'; // Flexible people work well in small groups
        }

        return 'solo'; // Default
    }

    /**
     * Map Vision Quest intensity to challenge level
     */
    mapChallengeLevel(intensity) {
        const mapping = {
            'zen': 'easy-wins',
            'balanced': 'balanced', 
            'high': 'stretch',
            'beast': 'ambitious'
        };
        
        return mapping[intensity] || 'balanced';
    }

    /**
     * Map Vision Quest support system to accountability type
     */
    mapAccountabilityType(support) {
        if (!Array.isArray(support)) {
            return 'self-directed';
        }

        // Priority mapping based on support preferences
        if (support.includes('mentors')) {
            return 'coach';
        }
        if (support.includes('peers')) {
            return 'peer-buddy';
        }
        if (support.includes('family') || support.includes('friends')) {
            return 'check-ins';
        }
        if (support.includes('professional')) {
            return 'coach';
        }

        return 'self-directed'; // Default for 'solo' or others
    }

    /**
     * Derive focus area from importance, timeline, and dream analysis
     */
    deriveFocusArea(importance, timeline, dream) {
        if (!dream) {
            return 'skill-building'; // Default
        }

        const dreamLower = dream.toLowerCase();
        
        // Job-focused keywords
        if (dreamLower.includes('job') || dreamLower.includes('hired') || 
            dreamLower.includes('interview') || dreamLower.includes('employment')) {
            return 'get-job';
        }
        
        // Business-focused keywords
        if (dreamLower.includes('business') || dreamLower.includes('startup') || 
            dreamLower.includes('company') || dreamLower.includes('entrepreneur')) {
            return 'build-business';
        }
        
        // Promotion-focused keywords
        if (dreamLower.includes('promotion') || dreamLower.includes('raise') || 
            dreamLower.includes('senior') || dreamLower.includes('lead') || 
            dreamLower.includes('manager')) {
            return 'get-promotion';
        }
        
        // Career change keywords
        if (dreamLower.includes('transition') || dreamLower.includes('switch') || 
            dreamLower.includes('change career') || dreamLower.includes('pivot')) {
            return 'career-change';
        }
        
        // Freelance keywords
        if (dreamLower.includes('freelance') || dreamLower.includes('consultant') || 
            dreamLower.includes('independent') || dreamLower.includes('contract')) {
            return 'freelance';
        }

        // Default based on timeline and importance
        if (timeline === 'sprint' && importance === 'obsessed') {
            return 'get-job'; // Quick, high-intensity goals often job-focused
        }
        
        return 'skill-building'; // Default fallback
    }
}

module.exports = new VisionToPreferencesService();