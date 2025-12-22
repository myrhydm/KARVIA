/**
 * Adaptation Engine
 * Intelligent system that adapts user experience based on behavior patterns
 */

const { ADAPTATION_ENGINE } = require('../config/journeySystem');
const llamaService = require('./llamaService');
const User = require('../models/User');

class AdaptationEngine {
    constructor() {
        this.llamaService = llamaService;
        this.analysisCache = new Map(); // Cache analysis results
        this.adaptationHistory = new Map(); // Track adaptation history per user
    }

    /**
     * Analyze user patterns and recommend adaptations
     * @param {string} userId - User ID
     * @returns {Object} Analysis and adaptation recommendations
     */
    async analyzeAndAdapt(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get comprehensive user data
            const userData = await this.gatherUserData(user);
            
            // Analyze patterns
            const patterns = await this.analyzePatterns(userData);
            
            // Determine adaptations needed
            const adaptations = this.determineAdaptations(patterns);
            
            // Apply adaptations
            const results = await this.applyAdaptations(user, adaptations);
            
            // Store analysis results
            this.storeAnalysisResults(userId, patterns, adaptations, results);

            return {
                success: true,
                data: {
                    patterns,
                    adaptations,
                    results,
                    timestamp: new Date()
                }
            };
        } catch (error) {
            console.error('Error in adaptation analysis:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gather comprehensive user data for analysis
     */
    async gatherUserData(user) {
        const journeyData = user.stageData?.get('journeyData') || {};
        const currentStageData = user.stageData?.get(`stage${user.userStage}`) || {};
        
        // Task completion data
        const taskData = this.extractTaskData(currentStageData);
        
        // Belief and engagement data
        const beliefData = await this.extractBeliefData(user);
        
        // Temporal patterns
        const temporalData = await this.extractTemporalPatterns(user);
        
        // Goal and dream data
        const dreamData = journeyData.parsedDream || {};

        return {
            userId: user.id,
            stage: user.userStage,
            journeyStartDate: journeyData.startDate,
            dreamData,
            taskData,
            beliefData,
            temporalData,
            stageHistory: this.extractStageHistory(user),
            adaptationHistory: this.adaptationHistory.get(user.id) || []
        };
    }

    /**
     * Extract task completion patterns
     */
    extractTaskData(stageData) {
        if (!stageData.goals) {
            return {
                totalTasks: 0,
                completedTasks: 0,
                completionRate: 0,
                averageTimeToComplete: 0,
                difficultyPattern: 'unknown',
                skipPattern: 'none'
            };
        }

        const allTasks = [];
        stageData.goals.forEach(goal => {
            if (goal.tasks) {
                allTasks.push(...goal.tasks);
            }
        });

        const completedTasks = allTasks.filter(task => task.status === 'completed');
        const skippedTasks = allTasks.filter(task => task.status === 'skipped');
        
        // Calculate completion times
        const completionTimes = completedTasks
            .filter(task => task.completedAt && task.scheduledDate)
            .map(task => {
                const scheduled = new Date(task.scheduledDate);
                const completed = new Date(task.completedAt);
                return Math.max(0, (completed - scheduled) / (1000 * 60 * 60 * 24)); // Days
            });

        const avgCompletionDelay = completionTimes.length > 0 
            ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
            : 0;

        // Analyze difficulty patterns
        const difficultyPattern = this.analyzeDifficultyPattern(completedTasks, skippedTasks);
        
        // Analyze skip patterns
        const skipPattern = this.analyzeSkipPattern(skippedTasks);

        // Calculate recent trend (last 7 tasks)
        const recentTasks = allTasks.slice(-7);
        const recentCompletionRate = recentTasks.length > 0 
            ? recentTasks.filter(task => task.status === 'completed').length / recentTasks.length 
            : 0;

        return {
            totalTasks: allTasks.length,
            completedTasks: completedTasks.length,
            skippedTasks: skippedTasks.length,
            completionRate: allTasks.length > 0 ? completedTasks.length / allTasks.length : 0,
            recentCompletionRate,
            averageCompletionDelay: avgCompletionDelay,
            difficultyPattern,
            skipPattern,
            longestStreak: this.calculateLongestStreak(allTasks),
            currentStreak: this.calculateCurrentStreak(allTasks)
        };
    }

    /**
     * Extract belief and motivation patterns
     */
    async extractBeliefData(user) {
        const journeyData = user.stageData?.get('journeyData') || {};
        const currentBelief = journeyData.beliefScore || 0.5;
        
        // This would ideally query a separate reflections/belief tracking collection
        // For now, we'll simulate belief tracking
        const beliefHistory = journeyData.beliefHistory || [
            { date: journeyData.startDate, score: currentBelief }
        ];

        // Calculate belief trend
        const beliefTrend = this.calculateBeliefTrend(beliefHistory);
        
        // Estimate motivation level based on recent activity
        const motivationLevel = this.estimateMotivationLevel(user);

        return {
            currentBelief,
            beliefTrend,
            motivationLevel,
            beliefHistory,
            confidenceGaps: this.identifyConfidenceGaps(user),
            motivationTriggers: this.identifyMotivationTriggers(user)
        };
    }

    /**
     * Extract temporal engagement patterns
     */
    async extractTemporalPatterns(user) {
        // This would analyze login times, task completion times, etc.
        // For now, we'll provide a basic structure
        
        return {
            preferredTimeOfDay: 'morning', // This would be calculated
            consistencyScore: 0.7, // This would be calculated
            weekdayVsWeekendPattern: 'weekday_focused', // This would be calculated
            sessionDuration: 'medium', // This would be calculated
            frequencyPattern: 'daily', // This would be calculated
            engagementTrend: 'stable' // This would be calculated
        };
    }

    /**
     * Analyze patterns to identify user behavior
     */
    async analyzePatterns(userData) {
        const patterns = {
            performance: this.analyzePerformancePattern(userData.taskData),
            belief: this.analyzeBeliefPattern(userData.beliefData),
            engagement: this.analyzeEngagementPattern(userData.temporalData),
            learning: this.analyzeLearningPattern(userData),
            challenge: this.analyzeChallengePattern(userData.taskData),
            consistency: this.analyzeConsistencyPattern(userData.taskData, userData.temporalData)
        };

        // AI-powered pattern recognition
        const aiInsights = await this.generateAIInsights(userData, patterns);
        patterns.aiInsights = aiInsights;

        return patterns;
    }

    /**
     * Analyze performance patterns
     */
    analyzePerformancePattern(taskData) {
        const { completionRate, recentCompletionRate, averageCompletionDelay } = taskData;

        if (completionRate >= 0.9) {
            return {
                category: 'high_performer',
                trend: recentCompletionRate >= completionRate ? 'improving' : 'declining',
                characteristics: ['consistent', 'reliable', 'goal_oriented'],
                adaptationNeeds: ['increased_challenge', 'leadership_opportunities']
            };
        } else if (completionRate >= 0.7) {
            return {
                category: 'consistent_performer',
                trend: recentCompletionRate >= completionRate ? 'improving' : 'stable',
                characteristics: ['steady', 'committed', 'growing'],
                adaptationNeeds: ['skill_building', 'gradual_increase']
            };
        } else if (completionRate >= 0.5) {
            return {
                category: 'developing_performer',
                trend: recentCompletionRate >= completionRate ? 'improving' : 'struggling',
                characteristics: ['learning', 'variable', 'potential'],
                adaptationNeeds: ['support', 'simplified_goals', 'encouragement']
            };
        } else {
            return {
                category: 'struggling_performer',
                trend: 'needs_support',
                characteristics: ['overwhelmed', 'unclear', 'needs_guidance'],
                adaptationNeeds: ['basic_support', 'goal_clarification', 'confidence_building']
            };
        }
    }

    /**
     * Analyze belief patterns
     */
    analyzeBeliefPattern(beliefData) {
        const { currentBelief, beliefTrend } = beliefData;

        const category = currentBelief > 0.8 ? 'high_belief' :
                        currentBelief > 0.6 ? 'medium_belief' :
                        currentBelief > 0.4 ? 'low_medium_belief' : 'low_belief';

        return {
            category,
            trend: beliefTrend,
            currentScore: currentBelief,
            adaptationNeeds: this.getBeliefAdaptationNeeds(category, beliefTrend)
        };
    }

    /**
     * Determine adaptations based on patterns
     */
    determineAdaptations(patterns) {
        const adaptations = {
            taskAdaptations: this.determineTaskAdaptations(patterns.performance, patterns.challenge),
            motivationAdaptations: this.determineMotivationAdaptations(patterns.belief, patterns.engagement),
            structureAdaptations: this.determineStructureAdaptations(patterns.consistency, patterns.engagement),
            contentAdaptations: this.determineContentAdaptations(patterns.learning, patterns.performance),
            timingAdaptations: this.determineTimingAdaptations(patterns.engagement)
        };

        // AI-recommended adaptations
        adaptations.aiRecommendations = this.generateAIRecommendations(patterns);

        return adaptations;
    }

    /**
     * Apply adaptations to user experience
     */
    async applyAdaptations(user, adaptations) {
        const results = {
            applied: [],
            failed: [],
            scheduled: []
        };

        try {
            // Apply task adaptations
            const taskResults = await this.applyTaskAdaptations(user, adaptations.taskAdaptations);
            results.applied.push(...taskResults.applied);
            results.failed.push(...taskResults.failed);

            // Apply motivation adaptations
            const motivationResults = await this.applyMotivationAdaptations(user, adaptations.motivationAdaptations);
            results.applied.push(...motivationResults.applied);
            results.failed.push(...motivationResults.failed);

            // Apply structure adaptations
            const structureResults = await this.applyStructureAdaptations(user, adaptations.structureAdaptations);
            results.applied.push(...structureResults.applied);
            results.failed.push(...structureResults.failed);

            // Schedule future adaptations
            const scheduledResults = await this.scheduleAdaptations(user, adaptations);
            results.scheduled.push(...scheduledResults);

        } catch (error) {
            console.error('Error applying adaptations:', error);
            results.failed.push({
                type: 'system_error',
                error: error.message
            });
        }

        return results;
    }

    /**
     * Apply task-level adaptations
     */
    async applyTaskAdaptations(user, taskAdaptations) {
        const results = { applied: [], failed: [] };
        
        if (!taskAdaptations || taskAdaptations.length === 0) {
            return results;
        }

        const currentStageData = user.stageData?.get(`stage${user.userStage}`);
        if (!currentStageData || !currentStageData.goals) {
            return results;
        }

        for (const adaptation of taskAdaptations) {
            try {
                switch (adaptation.type) {
                    case 'reduce_difficulty':
                        await this.reduceDifficulty(currentStageData, adaptation.amount);
                        results.applied.push({ type: 'reduce_difficulty', amount: adaptation.amount });
                        break;
                        
                    case 'increase_challenge':
                        await this.increaseChallenge(currentStageData, adaptation.amount);
                        results.applied.push({ type: 'increase_challenge', amount: adaptation.amount });
                        break;
                        
                    case 'add_micro_tasks':
                        await this.addMicroTasks(currentStageData, adaptation.count);
                        results.applied.push({ type: 'add_micro_tasks', count: adaptation.count });
                        break;
                        
                    case 'simplify_instructions':
                        await this.simplifyInstructions(currentStageData);
                        results.applied.push({ type: 'simplify_instructions' });
                        break;
                }
            } catch (error) {
                results.failed.push({ 
                    type: adaptation.type, 
                    error: error.message 
                });
            }
        }

        // Save updated stage data
        user.stageData.set(`stage${user.userStage}`, currentStageData);
        await user.save();

        return results;
    }

    /**
     * Generate AI insights about user patterns
     */
    async generateAIInsights(userData, patterns) {
        const insightsPrompt = `
Analyze this user's journey patterns and provide insights:

USER CONTEXT:
- Stage: ${userData.stage} (${userData.stage <= 3 ? 'Early journey' : userData.stage <= 5 ? 'Mid journey' : 'Advanced journey'})
- Dream: ${userData.dreamData.impactStatement || 'Personal goal'}
- Journey duration: ${this.daysSince(userData.journeyStartDate)} days

PERFORMANCE DATA:
- Completion rate: ${(patterns.performance?.completionRate || 0) * 100}%
- Performance category: ${patterns.performance?.category}
- Current streak: ${userData.taskData?.currentStreak || 0} days

PATTERNS IDENTIFIED:
- Performance: ${patterns.performance?.category}
- Belief: ${patterns.belief?.category}
- Engagement: ${patterns.engagement?.category || 'unknown'}

Provide 2-3 specific insights about their journey patterns and what these patterns suggest about their approach to goals. Be encouraging but realistic.

Format as JSON:
{
  "insights": [
    {
      "pattern": "pattern_name",
      "observation": "what you observe",
      "interpretation": "what this means",
      "recommendation": "specific suggestion"
    }
  ]
}
`;

        try {
            const response = await this.llamaService.generateCompletion(insightsPrompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.insights || [];
            }
        } catch (error) {
            console.error('Error generating AI insights:', error);
        }

        return this.getFallbackInsights(patterns);
    }

    /**
     * Helper methods for specific analyses
     */
    analyzeDifficultyPattern(completedTasks, skippedTasks) {
        // Analyze which difficulty levels are being completed vs skipped
        const completedDifficulties = completedTasks.map(task => task.difficulty).filter(Boolean);
        const skippedDifficulties = skippedTasks.map(task => task.difficulty).filter(Boolean);
        
        const easyCompleted = completedDifficulties.filter(d => d === 'easy').length;
        const hardSkipped = skippedDifficulties.filter(d => d === 'hard').length;
        
        if (hardSkipped > easyCompleted) return 'prefers_easy';
        if (easyCompleted === 0 && completedDifficulties.includes('hard')) return 'seeks_challenge';
        return 'balanced';
    }

    analyzeSkipPattern(skippedTasks) {
        if (skippedTasks.length === 0) return 'none';
        if (skippedTasks.length > 5) return 'frequent';
        
        // Analyze reasons if available
        const reasons = skippedTasks.map(task => task.skipReason).filter(Boolean);
        if (reasons.includes('time_constraint')) return 'time_related';
        if (reasons.includes('too_difficult')) return 'difficulty_related';
        return 'occasional';
    }

    calculateLongestStreak(tasks) {
        // Calculate longest consecutive completion streak
        let longest = 0;
        let current = 0;
        
        const sortedTasks = tasks
            .filter(task => task.scheduledDate)
            .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
        
        for (const task of sortedTasks) {
            if (task.status === 'completed') {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 0;
            }
        }
        
        return longest;
    }

    calculateCurrentStreak(tasks) {
        // Calculate current streak from most recent tasks
        const sortedTasks = tasks
            .filter(task => task.scheduledDate)
            .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
        
        let streak = 0;
        for (const task of sortedTasks) {
            if (task.status === 'completed') {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    calculateBeliefTrend(beliefHistory) {
        if (beliefHistory.length < 2) return 'stable';
        
        const recent = beliefHistory.slice(-3);
        const trend = recent[recent.length - 1].score - recent[0].score;
        
        if (trend > 0.1) return 'increasing';
        if (trend < -0.1) return 'decreasing';
        return 'stable';
    }

    estimateMotivationLevel(user) {
        // This would be based on recent activity, engagement metrics, etc.
        return 0.7; // Placeholder
    }

    identifyConfidenceGaps(user) {
        // Identify areas where user shows low confidence
        return []; // Placeholder
    }

    identifyMotivationTriggers(user) {
        // Identify what motivates this user
        return ['progress_tracking', 'social_recognition']; // Placeholder
    }

    extractStageHistory(user) {
        // Extract progression through stages
        return user.stageHistory || [];
    }

    analyzeEngagementPattern(temporalData) {
        return {
            category: 'regular_user', // This would be calculated
            preferredTiming: temporalData.preferredTimeOfDay,
            consistency: temporalData.consistencyScore,
            adaptationNeeds: ['optimize_timing']
        };
    }

    analyzeLearningPattern(userData) {
        return {
            category: 'steady_learner', // This would be calculated
            adaptationNeeds: ['progressive_complexity']
        };
    }

    analyzeChallengePattern(taskData) {
        return {
            category: taskData.difficultyPattern,
            adaptationNeeds: taskData.difficultyPattern === 'prefers_easy' ? ['gradual_increase'] : ['maintain_challenge']
        };
    }

    analyzeConsistencyPattern(taskData, temporalData) {
        return {
            category: temporalData.consistencyScore > 0.7 ? 'consistent' : 'variable',
            adaptationNeeds: temporalData.consistencyScore > 0.7 ? ['maintain_routine'] : ['build_habits']
        };
    }

    getBeliefAdaptationNeeds(category, trend) {
        if (category === 'low_belief' || trend === 'decreasing') {
            return ['confidence_building', 'success_highlighting', 'micro_wins'];
        }
        if (category === 'high_belief' && trend === 'increasing') {
            return ['challenge_increase', 'leadership_opportunities'];
        }
        return ['maintain_support'];
    }

    determineTaskAdaptations(performancePattern, challengePattern) {
        const adaptations = [];
        
        if (performancePattern.category === 'struggling_performer') {
            adaptations.push({ type: 'reduce_difficulty', amount: 'moderate' });
            adaptations.push({ type: 'add_micro_tasks', count: 3 });
            adaptations.push({ type: 'simplify_instructions' });
        } else if (performancePattern.category === 'high_performer') {
            adaptations.push({ type: 'increase_challenge', amount: 'moderate' });
        }
        
        return adaptations;
    }

    determineMotivationAdaptations(beliefPattern, engagementPattern) {
        // Return motivation-related adaptations
        return [];
    }

    determineStructureAdaptations(consistencyPattern, engagementPattern) {
        // Return structure-related adaptations
        return [];
    }

    determineContentAdaptations(learningPattern, performancePattern) {
        // Return content-related adaptations
        return [];
    }

    determineTimingAdaptations(engagementPattern) {
        // Return timing-related adaptations
        return [];
    }

    generateAIRecommendations(patterns) {
        // Generate AI-powered recommendations
        return [];
    }

    async applyMotivationAdaptations(user, adaptations) {
        return { applied: [], failed: [] };
    }

    async applyStructureAdaptations(user, adaptations) {
        return { applied: [], failed: [] };
    }

    async scheduleAdaptations(user, adaptations) {
        return [];
    }

    async reduceDifficulty(stageData, amount) {
        // Reduce difficulty of upcoming tasks
    }

    async increaseChallenge(stageData, amount) {
        // Increase challenge of upcoming tasks
    }

    async addMicroTasks(stageData, count) {
        // Add smaller, easier tasks
    }

    async simplifyInstructions(stageData) {
        // Simplify task instructions
    }

    storeAnalysisResults(userId, patterns, adaptations, results) {
        const history = this.adaptationHistory.get(userId) || [];
        history.push({
            timestamp: new Date(),
            patterns,
            adaptations,
            results
        });
        this.adaptationHistory.set(userId, history);
    }

    daysSince(date) {
        if (!date) return 0;
        const diffTime = Math.abs(new Date() - new Date(date));
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getFallbackInsights(patterns) {
        return [
            {
                pattern: 'progress_tracking',
                observation: 'Making steady progress on your journey',
                interpretation: 'You show commitment to your goals',
                recommendation: 'Continue building on your momentum'
            }
        ];
    }
}

module.exports = new AdaptationEngine();