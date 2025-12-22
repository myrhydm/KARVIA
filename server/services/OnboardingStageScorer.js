/**
 * Onboarding Stage Scorer
 * 
 * Wrapper for the existing FiveDimensionCalculator to provide
 * stage-specific scoring for the onboarding phase
 */

const FiveDimensionCalculator = require('../engines/scoring_engine/services/FiveDimensionCalculator');
const StageManager = require('./stageManager');

class OnboardingStageScorer {
    constructor() {
        this.fiveDimensionCalculator = new FiveDimensionCalculator();
        this.stageManager = new StageManager();
    }

    /**
     * Calculate Onboarding stage score using five-dimension system
     */
    async calculateScore(userId, events, userProfile = {}) {
        try {
            const stageConfig = this.stageManager.getStageConfig('onboarding');
            
            // Use existing five-dimension calculator
            const dimensionScores = await this.fiveDimensionCalculator.calculateDimensionScores(userId, events, userProfile);
            
            // Calculate weighted overall score based on onboarding stage rules
            const overallScore = this.calculateWeightedScore(dimensionScores, stageConfig.scoringRules.primaryMetrics);
            
            // Determine achievements for onboarding stage
            const achievements = this.calculateOnboardingAchievements(dimensionScores, events, userProfile);
            
            // Calculate progression percentage
            const progressionPercentage = this.calculateProgressionPercentage(overallScore, achievements);
            
            return {
                userId,
                stage: 'onboarding',
                overallScore,
                dimensionScores,
                achievements,
                progressionPercentage,
                insights: this.generateOnboardingInsights(dimensionScores, achievements),
                recommendations: this.generateOnboardingRecommendations(dimensionScores, achievements),
                metadata: {
                    eventsProcessed: events.length,
                    calculatedAt: new Date().toISOString(),
                    scoringVersion: '1.0'
                }
            };
        } catch (error) {
            console.error('Error calculating onboarding stage score:', error);
            return this.getDefaultScore(userId);
        }
    }

    /**
     * Calculate weighted overall score for onboarding stage
     */
    calculateWeightedScore(dimensionScores, scoringRules) {
        let totalScore = 0;
        
        scoringRules.forEach(rule => {
            const dimensionScore = dimensionScores[rule.metric] || 0;
            totalScore += dimensionScore * rule.weight;
        });
        
        return Math.min(100, Math.max(0, totalScore * 100));
    }

    /**
     * Calculate onboarding-specific achievements
     */
    calculateOnboardingAchievements(dimensionScores, events, userProfile) {
        const achievements = [];
        
        // Dimension mastery achievements
        if (dimensionScores.readiness > 0.8) achievements.push('readiness_master');
        if (dimensionScores.clarity > 0.8) achievements.push('clarity_master');
        if (dimensionScores.commitment > 0.8) achievements.push('commitment_master');
        if (dimensionScores.growth > 0.8) achievements.push('growth_master');
        if (dimensionScores.opportunity > 0.8) achievements.push('opportunity_master');
        
        // Overall achievements
        const overallScore = dimensionScores.overall || 0;
        if (overallScore > 0.7) achievements.push('well_rounded_achiever');
        if (overallScore > 0.8) achievements.push('five_dimension_mastery');
        
        // Task completion achievements
        const taskCompletionRate = userProfile.completedTasks / (userProfile.totalTasks || 1);
        if (taskCompletionRate > 0.8) achievements.push('consistent_task_completion');
        
        // Goal clarity achievements
        const goalEvents = events.filter(e => ['goal_creation', 'goal_progress_updated'].includes(e.eventType));
        if (goalEvents.length > 5) achievements.push('goal_clarity_achieved');
        
        return achievements;
    }

    /**
     * Calculate progression percentage towards next stage
     */
    calculateProgressionPercentage(overallScore, achievements) {
        const requiredScore = 80;
        const requiredAchievements = ['five_dimension_mastery', 'consistent_task_completion', 'goal_clarity_achieved'];
        
        const scoreProgress = Math.min(overallScore / requiredScore, 1) * 0.7;
        
        const achievementProgress = requiredAchievements.filter(req => 
            achievements.includes(req)
        ).length / requiredAchievements.length * 0.3;
        
        return Math.min(100, (scoreProgress + achievementProgress) * 100);
    }

    /**
     * Generate onboarding-specific insights
     */
    generateOnboardingInsights(dimensionScores, achievements) {
        const insights = [];
        
        // Identify strongest dimension
        const dimensions = ['readiness', 'clarity', 'commitment', 'growth', 'opportunity'];
        const strongest = dimensions.reduce((max, dim) => 
            dimensionScores[dim] > dimensionScores[max] ? dim : max
        );
        
        insights.push({
            type: 'positive',
            message: `Your strongest dimension is ${strongest}. Great work on developing this area!`,
            metric: strongest
        });
        
        // Identify weakest dimension for improvement
        const weakest = dimensions.reduce((min, dim) => 
            dimensionScores[dim] < dimensionScores[min] ? dim : min
        );
        
        if (dimensionScores[weakest] < 0.6) {
            insights.push({
                type: 'improvement',
                message: `Focus on improving your ${weakest} dimension for balanced growth.`,
                metric: weakest
            });
        }
        
        // Overall progress insight
        const overallScore = dimensionScores.overall || 0;
        if (overallScore > 0.7) {
            insights.push({
                type: 'positive',
                message: 'You\'re showing strong overall development across all dimensions!',
                metric: 'overall'
            });
        }
        
        return insights;
    }

    /**
     * Generate onboarding-specific recommendations
     */
    generateOnboardingRecommendations(dimensionScores, achievements) {
        const recommendations = [];
        
        // Readiness recommendations
        if (dimensionScores.readiness < 0.6) {
            recommendations.push({
                priority: 'high',
                action: 'Focus on skill development and problem-solving to boost your readiness.',
                metric: 'readiness'
            });
        }
        
        // Clarity recommendations
        if (dimensionScores.clarity < 0.6) {
            recommendations.push({
                priority: 'high',
                action: 'Refine your goals and make them more specific and actionable.',
                metric: 'clarity'
            });
        }
        
        // Commitment recommendations
        if (dimensionScores.commitment < 0.6) {
            recommendations.push({
                priority: 'medium',
                action: 'Improve your task completion consistency to demonstrate commitment.',
                metric: 'commitment'
            });
        }
        
        // Growth recommendations
        if (dimensionScores.growth < 0.6) {
            recommendations.push({
                priority: 'medium',
                action: 'Engage more in learning activities and seek feedback for growth.',
                metric: 'growth'
            });
        }
        
        // Opportunity recommendations
        if (dimensionScores.opportunity < 0.6) {
            recommendations.push({
                priority: 'medium',
                action: 'Network more and identify opportunities in your field.',
                metric: 'opportunity'
            });
        }
        
        return recommendations;
    }

    /**
     * Get default score for error cases
     */
    getDefaultScore(userId) {
        return {
            userId,
            stage: 'onboarding',
            overallScore: 0,
            dimensionScores: {
                readiness: 0,
                clarity: 0,
                commitment: 0,
                growth: 0,
                opportunity: 0,
                overall: 0
            },
            achievements: [],
            progressionPercentage: 0,
            insights: [],
            recommendations: [],
            metadata: {
                eventsProcessed: 0,
                calculatedAt: new Date().toISOString(),
                error: true
            }
        };
    }
}

module.exports = OnboardingStageScorer;