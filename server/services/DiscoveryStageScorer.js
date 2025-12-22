/**
 * Discovery Stage Scorer
 * 
 * Uses the new 5-score hybrid quantitative/qualitative system
 * Displays only 3 active scores: Commitment, Clarity, Growth Readiness
 * Competency and Opportunity are calculated but locked in UI
 */

const FiveDimensionCalculator = require('../engines/scoring_engine/services/FiveDimensionCalculator');
const StageManager = require('./stageManager');

class DiscoveryStageScorer {
    constructor() {
        this.calculator = new FiveDimensionCalculator();
        this.stageManager = new StageManager();
    }

    /**
     * Calculate Discovery stage score using 5-dimension hybrid system
     */
    async calculateScore(userId, events, userProfile = {}) {
        try {
            // OPTIMIZATION: Cache check before expensive calculation
            const cacheKey = `discovery_score_${userId}_${events.length}`;
            const cached = await this.getCachedScore(cacheKey);
            if (cached && this.isCacheValid(cached)) {
                return cached;
            }

            // Use the 5-dimension calculator with Discovery stage context
            const dimensionScores = await this.calculator.calculateDimensionScores(
                userId, 
                events, 
                userProfile, 
                'discovery'
            );
            
            // Legacy metrics for backward compatibility (derived from dimension scores)
            const legacyMetrics = this.mapToLegacyMetrics(dimensionScores, events);

            // Determine achievements based on 5-score system
            const achievements = this.calculateAchievements(dimensionScores, events, userProfile);

            // Calculate progression percentage based on overall score
            const progressionPercentage = this.calculateProgressionPercentage(dimensionScores.overall, achievements);

            const result = {
                userId,
                stage: 'discovery',
                overallScore: dimensionScores.overall,
                
                // NEW: 5-Score System
                dimensionScores: {
                    commitment: dimensionScores.commitment,
                    clarity: dimensionScores.clarity,
                    growthReadiness: dimensionScores.growthReadiness,
                    competency: dimensionScores.competency,      // Calculated but locked in UI
                    opportunity: dimensionScores.opportunity     // Calculated but locked in UI
                },
                
                // UI Display Information
                activeScores: ['commitment', 'clarity', 'growthReadiness'],
                lockedScores: ['competency', 'opportunity'],
                
                // Legacy compatibility
                metrics: legacyMetrics,
                
                achievements,
                progressionPercentage,
                insights: this.generateInsights(dimensionScores, achievements),
                recommendations: this.generateRecommendations(dimensionScores, achievements),
                metadata: {
                    eventsProcessed: events.length,
                    calculatedAt: new Date().toISOString(),
                    scoringMethod: 'hybrid_quantitative_qualitative',
                    version: '2.0'
                }
            };

            // OPTIMIZATION: Cache the result
            await this.setCachedScore(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error calculating discovery stage score:', error);
            return this.getDefaultScore(userId);
        }
    }

    /**
     * OPTIMIZATION: Cache management for scores
     */
    async getCachedScore(cacheKey) {
        // Implementation would use Redis or in-memory cache
        // For now, returning null to maintain existing behavior
        return null;
    }

    isCacheValid(cached) {
        if (!cached || !cached.metadata) return false;
        const cacheAge = Date.now() - new Date(cached.metadata.calculatedAt).getTime();
        return cacheAge < 5 * 60 * 1000; // 5 minutes cache
    }

    async setCachedScore(cacheKey, score) {
        // Implementation would use Redis or in-memory cache
        // For now, doing nothing to maintain existing behavior
        return;
    }

    /**
     * Map 5-dimension scores to legacy metrics for backward compatibility
     */
    mapToLegacyMetrics(dimensionScores, events) {
        // Map new scores to old metric names for UI compatibility
        return {
            loginStreak: dimensionScores.commitment,           // Commitment reflects login consistency
            dreamEngagement: dimensionScores.clarity,          // Clarity reflects dream engagement quality
            emotionalConnection: dimensionScores.growthReadiness, // Growth readiness reflects emotional openness
            completionRate: this.calculateActualCompletionRate(events) // Calculate from actual task data
        };
    }

    /**
     * Calculate actual completion rate from task events
     */
    calculateActualCompletionRate(events) {
        const taskEvents = events.filter(e => e.eventType === 'task_completion');
        const totalTasks = events.filter(e => e.eventType === 'task_created').length;
        
        if (totalTasks === 0) return 0;
        return Math.min(1.0, taskEvents.length / totalTasks);
    }

    /**
     * Calculate login streak score (40% weight) - LEGACY METHOD
     */
    calculateLoginStreak(events, userProfile) {
        const dailyLogins = events.filter(e => e.eventType === 'daily_login');
        const repeatLogins = events.filter(e => e.eventType === 'repeat_login');
        
        // Current login count from user profile
        const currentLoginCount = userProfile.loginCount || 1;
        
        // Calculate streak quality
        let streakScore = 0;
        
        // Base score from login count (0.6 weight)
        const loginProgress = Math.min(currentLoginCount / 21, 1);
        streakScore += loginProgress * 0.6;
        
        // Consistency bonus (0.25 weight)
        if (dailyLogins.length > 0) {
            const consistencyScore = this.calculateConsistency(dailyLogins);
            streakScore += consistencyScore * 0.25;
        }
        
        // Engagement quality bonus (0.15 weight)
        const engagementQuality = this.calculateEngagementQuality(dailyLogins, repeatLogins);
        streakScore += engagementQuality * 0.15;
        
        return Math.min(1.0, streakScore);
    }

    /**
     * Calculate dream engagement score (30% weight)
     */
    calculateDreamEngagement(events, userProfile) {
        const dreamEvents = events.filter(e => 
            ['dream_reflection_completed', 'vision_response_submitted', 'insight_recorded'].includes(e.eventType)
        );
        
        let engagementScore = 0;
        
        // Frequency of dream interactions (0.4 weight)
        const dreamInteractionFrequency = Math.min(dreamEvents.length / 21, 1);
        engagementScore += dreamInteractionFrequency * 0.4;
        
        // Quality of dream reflections (0.35 weight)
        const reflectionQuality = this.calculateReflectionQuality(dreamEvents);
        engagementScore += reflectionQuality * 0.35;
        
        // Depth of engagement (0.25 weight)
        const engagementDepth = this.calculateEngagementDepth(dreamEvents);
        engagementScore += engagementDepth * 0.25;
        
        return Math.min(1.0, engagementScore);
    }

    /**
     * Calculate emotional connection score (20% weight)
     */
    calculateEmotionalConnection(events, userProfile) {
        const emotionalEvents = events.filter(e => 
            ['insight_recorded', 'vision_response_submitted', 'feedback_provided'].includes(e.eventType)
        );
        
        let connectionScore = 0;
        
        // Emotional depth in reflections (0.5 weight)
        const emotionalDepth = this.calculateEmotionalDepth(emotionalEvents);
        connectionScore += emotionalDepth * 0.5;
        
        // Consistency of emotional engagement (0.3 weight)
        const emotionalConsistency = this.calculateEmotionalConsistency(emotionalEvents);
        connectionScore += emotionalConsistency * 0.3;
        
        // Personal growth indicators (0.2 weight)
        const growthIndicators = this.calculateGrowthIndicators(emotionalEvents);
        connectionScore += growthIndicators * 0.2;
        
        return Math.min(1.0, connectionScore);
    }

    /**
     * Calculate completion rate score (10% weight)
     */
    calculateCompletionRate(events, userProfile) {
        const taskEvents = events.filter(e => e.eventType === 'task_completion');
        const totalExpectedTasks = 21; // One simple task per day
        
        const completionRate = taskEvents.length / totalExpectedTasks;
        
        // Bonus for consistent completion
        const completionConsistency = this.calculateCompletionConsistency(taskEvents);
        
        return Math.min(1.0, (completionRate * 0.7) + (completionConsistency * 0.3));
    }

    /**
     * Calculate weighted overall score
     */
    calculateWeightedScore(metrics, scoringRules) {
        let totalScore = 0;
        
        scoringRules.forEach(rule => {
            const metricScore = metrics[rule.metric] || 0;
            totalScore += metricScore * rule.weight;
        });
        
        return Math.min(100, Math.max(0, totalScore * 100));
    }

    /**
     * Calculate achievements based on metrics and events
     */
    calculateAchievements(metrics, events, userProfile) {
        const achievements = [];
        
        // Login streak achievements
        const loginCount = userProfile.loginCount || 1;
        if (loginCount >= 3) achievements.push('login_streak_3');
        if (loginCount >= 7) achievements.push('login_streak_7');
        if (loginCount >= 14) achievements.push('login_streak_14');
        if (loginCount >= 21) achievements.push('login_streak_21');
        
        // Dream engagement achievements
        if (metrics.dreamEngagement > 0.7) achievements.push('dream_engagement_high');
        if (metrics.emotionalConnection > 0.7) achievements.push('emotional_connection_established');
        
        // Consistency achievements
        if (metrics.loginStreak > 0.8) achievements.push('consistency_master');
        if (metrics.completionRate > 0.8) achievements.push('completion_champion');
        
        // Overall progress achievements
        const overallScore = this.calculateWeightedScore(metrics, this.stageManager.getStageConfig('discovery').scoringRules.primaryMetrics);
        if (overallScore >= 50) achievements.push('halfway_hero');
        if (overallScore >= 70) achievements.push('dream_foundation_complete');
        
        return achievements;
    }

    /**
     * Calculate progression percentage towards next stage
     */
    calculateProgressionPercentage(overallScore, achievements) {
        const requiredScore = 70;
        const requiredAchievements = ['dream_foundation_complete', 'login_streak_21', 'emotional_connection_established'];
        
        const scoreProgress = Math.min(overallScore / requiredScore, 1) * 0.7;
        
        const achievementProgress = requiredAchievements.filter(req => 
            achievements.includes(req)
        ).length / requiredAchievements.length * 0.3;
        
        return Math.min(100, (scoreProgress + achievementProgress) * 100);
    }

    /**
     * Helper methods for score calculations
     */
    calculateConsistency(dailyLogins) {
        if (dailyLogins.length < 3) return 0;
        
        // Calculate days between logins
        const dates = dailyLogins.map(login => new Date(login.timestamp)).sort();
        const daysDiff = [];
        
        for (let i = 1; i < dates.length; i++) {
            const diff = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
            daysDiff.push(diff);
        }
        
        // Reward consistency (daily logins)
        const avgDaysBetween = daysDiff.reduce((sum, diff) => sum + diff, 0) / daysDiff.length;
        return Math.max(0, 1 - (avgDaysBetween - 1) * 0.2);
    }

    calculateEngagementQuality(dailyLogins, repeatLogins) {
        const totalLogins = dailyLogins.length + repeatLogins.length;
        if (totalLogins === 0) return 0;
        
        // Higher quality if user logs in once per day vs multiple times
        const qualityRatio = dailyLogins.length / totalLogins;
        return qualityRatio * 0.8 + 0.2; // Base 0.2 + quality bonus
    }

    calculateReflectionQuality(dreamEvents) {
        if (dreamEvents.length === 0) return 0;
        
        let totalQuality = 0;
        dreamEvents.forEach(event => {
            let quality = 0.3; // Base quality
            
            // Check for depth indicators
            const content = event.eventData?.content || '';
            if (content.length > 50) quality += 0.2;
            if (content.length > 100) quality += 0.2;
            
            // Check for emotional indicators
            const emotionalWords = ['feel', 'excited', 'passionate', 'challenging', 'growth'];
            const hasEmotionalContent = emotionalWords.some(word => 
                content.toLowerCase().includes(word)
            );
            if (hasEmotionalContent) quality += 0.3;
            
            totalQuality += Math.min(1.0, quality);
        });
        
        return totalQuality / dreamEvents.length;
    }

    calculateEngagementDepth(dreamEvents) {
        if (dreamEvents.length === 0) return 0;
        
        // Look for progression in engagement depth
        const timeSpentEvents = dreamEvents.filter(e => e.eventData?.timeSpent);
        const avgTimeSpent = timeSpentEvents.reduce((sum, e) => 
            sum + (e.eventData.timeSpent || 0), 0) / (timeSpentEvents.length || 1);
        
        // 5 minutes = 1.0 score
        return Math.min(1.0, avgTimeSpent / 300000);
    }

    calculateEmotionalDepth(emotionalEvents) {
        if (emotionalEvents.length === 0) return 0;
        
        // Analyze emotional content depth
        let depthScore = 0;
        emotionalEvents.forEach(event => {
            const content = event.eventData?.content || '';
            
            // Check for personal pronouns (indicates personal reflection)
            if (content.toLowerCase().includes('i ')) depthScore += 0.2;
            
            // Check for emotional expression
            const emotionalIndicators = ['feel', 'excited', 'worried', 'confident', 'passionate'];
            const emotionalMatches = emotionalIndicators.filter(indicator => 
                content.toLowerCase().includes(indicator)
            ).length;
            depthScore += Math.min(0.4, emotionalMatches * 0.1);
            
            // Check for future-oriented language
            const futureIndicators = ['will', 'going to', 'plan to', 'want to'];
            const futureMatches = futureIndicators.filter(indicator => 
                content.toLowerCase().includes(indicator)
            ).length;
            depthScore += Math.min(0.2, futureMatches * 0.05);
        });
        
        return Math.min(1.0, depthScore / emotionalEvents.length);
    }

    calculateEmotionalConsistency(emotionalEvents) {
        if (emotionalEvents.length < 3) return 0;
        
        // Check for consistent emotional engagement over time
        const eventsByDate = {};
        emotionalEvents.forEach(event => {
            const date = new Date(event.timestamp).toDateString();
            eventsByDate[date] = (eventsByDate[date] || 0) + 1;
        });
        
        const daysWithEmotionalEngagement = Object.keys(eventsByDate).length;
        const totalDays = 21;
        
        return daysWithEmotionalEngagement / totalDays;
    }

    calculateGrowthIndicators(emotionalEvents) {
        // Look for growth-oriented language and themes
        const growthKeywords = ['learn', 'grow', 'improve', 'better', 'develop', 'challenge'];
        let growthScore = 0;
        
        emotionalEvents.forEach(event => {
            const content = event.eventData?.content || '';
            const growthMatches = growthKeywords.filter(keyword => 
                content.toLowerCase().includes(keyword)
            ).length;
            growthScore += Math.min(0.3, growthMatches * 0.1);
        });
        
        return Math.min(1.0, growthScore / (emotionalEvents.length || 1));
    }

    calculateCompletionConsistency(taskEvents) {
        if (taskEvents.length < 3) return 0;
        
        // Check for consistent task completion over time
        const completionsByDate = {};
        taskEvents.forEach(event => {
            const date = new Date(event.timestamp).toDateString();
            completionsByDate[date] = (completionsByDate[date] || 0) + 1;
        });
        
        const daysWithCompletions = Object.keys(completionsByDate).length;
        const expectedDays = Math.min(21, taskEvents.length);
        
        return daysWithCompletions / expectedDays;
    }

    /**
     * Generate insights based on scoring
     */
    generateInsights(dimensionScores, achievements) {
        const insights = [];
        
        // 🔥 Commitment insights
        if (dimensionScores.commitment > 0.8) {
            insights.push({
                type: 'strength',
                message: `Exceptional commitment! Your ${Math.round(dimensionScores.commitment * 100)}% consistency score shows strong follow-through habits.`,
                priority: 'medium',
                dimension: 'commitment'
            });
        } else if (dimensionScores.commitment < 0.4) {
            insights.push({
                type: 'opportunity',
                message: `Focus on building daily consistency. Your commitment score of ${Math.round(dimensionScores.commitment * 100)}% can improve with regular engagement.`,
                priority: 'high',
                dimension: 'commitment'
            });
        }
        
        // 🔍 Clarity insights
        if (dimensionScores.clarity > 0.7) {
            insights.push({
                type: 'strength',
                message: `Strong clarity! Your ${Math.round(dimensionScores.clarity * 100)}% clarity score shows well-defined goals and vision.`,
                priority: 'medium',
                dimension: 'clarity'
            });
        } else if (dimensionScores.clarity < 0.5) {
            insights.push({
                type: 'opportunity',
                message: `Refine your vision clarity. Consider writing more specific details about your dream and success criteria.`,
                priority: 'high',
                dimension: 'clarity'
            });
        }
        
        // 🌱 Growth Readiness insights
        if (dimensionScores.growthReadiness > 0.7) {
            insights.push({
                type: 'strength',
                message: `Excellent growth mindset! Your ${Math.round(dimensionScores.growthReadiness * 100)}% growth readiness shows openness to learning and adaptation.`,
                priority: 'medium',
                dimension: 'growthReadiness'
            });
        } else if (dimensionScores.growthReadiness < 0.4) {
            insights.push({
                type: 'opportunity',
                message: `Embrace learning opportunities. Reflect more on challenges and what you can learn from setbacks.`,
                priority: 'medium',
                dimension: 'growthReadiness'
            });
        }
        
        // Overall progress insight
        if (dimensionScores.overall > 0.7) {
            insights.push({
                type: 'celebration',
                message: 'Outstanding progress across all active dimensions! You\'re building a strong foundation for your journey.',
                priority: 'high',
                dimension: 'overall'
            });
        }
        
        return insights;
    }

    /**
     * Generate recommendations based on 5-dimension scoring
     */
    generateRecommendations(dimensionScores, achievements) {
        const recommendations = [];
        
        // 🔥 Commitment recommendations
        if (dimensionScores.commitment < 0.5) {
            recommendations.push({
                type: 'action',
                message: 'Set a specific daily time (e.g., 8 AM) to engage with your journey tasks.',
                priority: 'high',
                dimension: 'commitment'
            });
        }
        
        if (dimensionScores.commitment < 0.6) {
            recommendations.push({
                type: 'habit',
                message: 'Track your daily engagement streak. Aim for 7 consecutive days of task completion.',
                priority: 'medium',
                dimension: 'commitment'
            });
        }
        
        // 🔍 Clarity recommendations
        if (dimensionScores.clarity < 0.6) {
            recommendations.push({
                type: 'reflection',
                message: 'Write 3 specific, measurable outcomes you want from achieving your dream.',
                priority: 'high',
                dimension: 'clarity'
            });
        }
        
        if (dimensionScores.clarity < 0.7) {
            recommendations.push({
                type: 'planning',
                message: 'Break your dream into 3-month milestones with clear success criteria.',
                priority: 'medium',
                dimension: 'clarity'
            });
        }
        
        // 🌱 Growth Readiness recommendations
        if (dimensionScores.growthReadiness < 0.5) {
            recommendations.push({
                type: 'mindset',
                message: 'After each task, write one thing you learned or discovered about yourself.',
                priority: 'medium',
                dimension: 'growthReadiness'
            });
        }
        
        if (dimensionScores.growthReadiness < 0.6) {
            recommendations.push({
                type: 'exploration',
                message: 'Try a new approach to one of your regular tasks this week.',
                priority: 'low',
                dimension: 'growthReadiness'
            });
        }
        
        // Overall recommendations
        if (dimensionScores.overall < 0.4) {
            recommendations.push({
                type: 'focus',
                message: 'Focus on one dimension this week. Choose commitment, clarity, or growth readiness as your primary focus.',
                priority: 'high',
                dimension: 'strategy'
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
            stage: 'discovery',
            overallScore: 0,
            
            // NEW: 5-Score System
            dimensionScores: {
                commitment: 0,
                clarity: 0,
                growthReadiness: 0,
                competency: 0,      // Calculated but locked in UI
                opportunity: 0      // Calculated but locked in UI
            },
            
            // UI Display Information
            activeScores: ['commitment', 'clarity', 'growthReadiness'],
            lockedScores: ['competency', 'opportunity'],
            
            // Legacy compatibility
            metrics: {
                loginStreak: 0,
                dreamEngagement: 0,
                emotionalConnection: 0,
                completionRate: 0
            },
            
            achievements: [],
            progressionPercentage: 0,
            insights: [],
            recommendations: [],
            metadata: {
                eventsProcessed: 0,
                calculatedAt: new Date().toISOString(),
                scoringMethod: 'hybrid_quantitative_qualitative',
                version: '2.0',
                error: true
            }
        };
    }
}

module.exports = DiscoveryStageScorer;