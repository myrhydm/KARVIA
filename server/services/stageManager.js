/**
 * Stage Manager Service
 * 
 * Handles user stage progression, stage detection, and stage-specific configuration
 */

const User = require('../models/User');
const TrackingUtils = require('../utils/trackingUtils');

class StageManager {
    constructor() {
        this.stageConfigs = this.initializeStageConfigs();
    }

    /**
     * Get current stage for user
     */
    async getCurrentStage(userId) {
        try {
            const user = await User.findById(userId);
            return user ? user.userStage : 'discovery';
        } catch (error) {
            console.error('Error getting current stage:', error);
            return 'discovery';
        }
    }

    /**
     * Get stage configuration
     */
    getStageConfig(stage) {
        return this.stageConfigs[stage] || this.stageConfigs.discovery;
    }

    /**
     * Check if user is ready for stage progression
     */
    async checkStageProgression(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) return { canProgress: false, reason: 'User not found' };

            const currentStage = user.userStage;
            const stageConfig = this.getStageConfig(currentStage);
            
            // Check progression criteria
            const progressionResult = await this.evaluateProgressionCriteria(user, stageConfig);
            
            if (progressionResult.canProgress) {
                return await this.promoteToNextStage(userId, currentStage);
            }

            return progressionResult;
        } catch (error) {
            console.error('Error checking stage progression:', error);
            return { canProgress: false, reason: 'Error checking progression' };
        }
    }

    /**
     * Evaluate progression criteria for current stage
     */
    async evaluateProgressionCriteria(user, stageConfig) {
        const criteria = stageConfig.progressionCriteria;
        const stageMetrics = user.stageMetrics.get(user.userStage) || {};
        
        // Check minimum score
        const currentScore = stageMetrics.overallScore || 0;
        const meetsScoreThreshold = currentScore >= criteria.minimumScore;
        
        // Check minimum duration
        const stageStartDate = user.stageStartDate || new Date();
        const daysSinceStart = Math.floor((Date.now() - stageStartDate.getTime()) / (1000 * 60 * 60 * 24));
        const meetsDurationRequirement = daysSinceStart >= criteria.minimumDuration;
        
        // Check required achievements
        const userAchievements = stageMetrics.achievements || [];
        const hasRequiredAchievements = criteria.requiredAchievements.every(
            achievement => userAchievements.includes(achievement)
        );

        // Stage-specific checks
        let meetsStageSpecificCriteria = true;
        if (user.userStage === 'discovery') {
            meetsStageSpecificCriteria = await this.checkDiscoverySpecificCriteria(user);
        }

        const canProgress = meetsScoreThreshold && 
                          meetsDurationRequirement && 
                          hasRequiredAchievements && 
                          meetsStageSpecificCriteria;

        return {
            canProgress,
            criteria: {
                scoreThreshold: { met: meetsScoreThreshold, required: criteria.minimumScore, current: currentScore },
                durationRequirement: { met: meetsDurationRequirement, required: criteria.minimumDuration, current: daysSinceStart },
                requiredAchievements: { met: hasRequiredAchievements, required: criteria.requiredAchievements, current: userAchievements },
                stageSpecific: { met: meetsStageSpecificCriteria }
            }
        };
    }

    /**
     * Check discovery stage specific criteria
     */
    async checkDiscoverySpecificCriteria(user) {
        // Check if user has completed core discovery activities
        const stageMetrics = user.stageMetrics.get('discovery') || {};
        
        const hasCompletedDreamCapture = stageMetrics.dreamCaptured || false;
        const hasConsistentLogin = (user.loginCount || 0) >= 21;
        const hasEmotionalConnection = (stageMetrics.emotionalConnectionScore || 0) >= 0.7;
        
        return hasCompletedDreamCapture && hasConsistentLogin && hasEmotionalConnection;
    }

    /**
     * Promote user to next stage
     */
    async promoteToNextStage(userId, currentStage) {
        try {
            const nextStage = this.getNextStage(currentStage);
            if (!nextStage) {
                return { canProgress: false, reason: 'No next stage available' };
            }

            const user = await User.findById(userId);
            
            // Save current stage to history
            const stageEndDate = new Date();
            const stageDuration = Math.floor((stageEndDate - user.stageStartDate) / (1000 * 60 * 60 * 24));
            
            user.stageHistory.push({
                stage: currentStage,
                startDate: user.stageStartDate,
                endDate: stageEndDate,
                finalScore: user.stageMetrics.get(currentStage)?.overallScore || 0,
                achievements: user.stageMetrics.get(currentStage)?.achievements || [],
                duration: stageDuration
            });

            // Update to new stage
            user.userStage = nextStage;
            user.stageStartDate = new Date();
            user.stageProgress = 0;
            
            await user.save();

            // Track stage progression
            await TrackingUtils.trackJourney('stage_progression', userId, {
                fromStage: currentStage,
                toStage: nextStage,
                duration: stageDuration,
                finalScore: user.stageMetrics.get(currentStage)?.overallScore || 0
            });

            return {
                canProgress: true,
                promoted: true,
                fromStage: currentStage,
                toStage: nextStage,
                duration: stageDuration
            };
        } catch (error) {
            console.error('Error promoting to next stage:', error);
            return { canProgress: false, reason: 'Error during promotion' };
        }
    }

    /**
     * Get next stage in progression
     */
    getNextStage(currentStage) {
        const stageProgression = {
            'discovery': 'onboarding',
            'onboarding': 'growth',
            'growth': 'mastery',
            'mastery': 'mentorship'
        };
        
        return stageProgression[currentStage] || null;
    }

    /**
     * Update stage metrics
     */
    async updateStageMetrics(userId, metrics) {
        try {
            const user = await User.findById(userId);
            if (!user) return false;

            const currentStage = user.userStage;
            const existingMetrics = user.stageMetrics.get(currentStage) || {};
            
            user.stageMetrics.set(currentStage, {
                ...existingMetrics,
                ...metrics,
                lastUpdated: new Date()
            });

            await user.save();
            return true;
        } catch (error) {
            console.error('Error updating stage metrics:', error);
            return false;
        }
    }

    /**
     * Initialize stage configurations
     */
    initializeStageConfigs() {
        return {
            discovery: {
                name: 'discovery',
                displayName: 'Discovery',
                description: 'Build the habit of connecting with your dream daily',
                duration: 21, // days
                
                scoringRules: {
                    primaryMetrics: [
                        { metric: 'loginStreak', weight: 0.4, calculator: 'calculateLoginStreak' },
                        { metric: 'dreamEngagement', weight: 0.3, calculator: 'calculateDreamEngagement' },
                        { metric: 'emotionalConnection', weight: 0.2, calculator: 'calculateEmotionalConnection' },
                        { metric: 'completionRate', weight: 0.1, calculator: 'calculateCompletionRate' }
                    ]
                },
                
                progressionCriteria: {
                    minimumScore: 70,
                    minimumDuration: 21,
                    requiredAchievements: [
                        'dream_foundation_complete',
                        'login_streak_21',
                        'emotional_connection_established'
                    ]
                },
                
                uiConfig: {
                    theme: 'discovery',
                    primaryColor: '#8B5CF6',
                    messaging: {
                        welcome: 'Welcome to your dream discovery journey!',
                        daily: 'Ready to visit your dream today?',
                        completion: 'Amazing! You\'ve built a strong foundation with your dream.'
                    }
                }
            },
            
            onboarding: {
                name: 'onboarding',
                displayName: 'Onboarding',
                description: 'Develop comprehensive readiness across all dimensions',
                duration: null, // indefinite
                
                scoringRules: {
                    primaryMetrics: [
                        { metric: 'readiness', weight: 0.25, calculator: 'calculateReadinessScore' },
                        { metric: 'clarity', weight: 0.20, calculator: 'calculateClarityScore' },
                        { metric: 'commitment', weight: 0.20, calculator: 'calculateCommitmentScore' },
                        { metric: 'growth', weight: 0.15, calculator: 'calculateGrowthScore' },
                        { metric: 'opportunity', weight: 0.20, calculator: 'calculateOpportunityScore' }
                    ]
                },
                
                progressionCriteria: {
                    minimumScore: 80,
                    minimumDuration: 60,
                    requiredAchievements: [
                        'five_dimension_mastery',
                        'consistent_task_completion',
                        'goal_clarity_achieved'
                    ]
                },
                
                uiConfig: {
                    theme: 'onboarding',
                    primaryColor: '#3B82F6',
                    messaging: {
                        welcome: 'Let\'s build your comprehensive readiness!',
                        daily: 'Time to develop your skills and clarity.',
                        completion: 'You\'ve mastered the fundamentals!'
                    }
                }
            }
        };
    }
}

module.exports = StageManager;