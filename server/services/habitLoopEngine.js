/**
 * Habit Loop Engine
 * Implements the trigger-action-reward-investment cycle for user engagement
 */

const { HABIT_LOOP_SYSTEM, REWARD_SYSTEM } = require('../config/journeySystem');
const llamaService = require('./llamaService');
const User = require('../models/User');

class HabitLoopEngine {
    constructor() {
        this.llamaService = llamaService;
        this.activeNudges = new Map(); // Track active nudges per user
        this.rewardSchedules = new Map(); // Track reward schedules per user
    }

    /**
     * Generate contextual trigger based on user state and time
     * @param {string} userId - User ID
     * @param {string} context - Current context (morning, afternoon, evening, etc.)
     * @returns {Object} Trigger data
     */
    async generateTrigger(userId, context = 'general') {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const userState = await this.analyzeUserState(user);
            const triggerType = this.determineTriggerType(userState, context);
            const trigger = await this.createTrigger(triggerType, userState, user);

            // Store trigger for tracking
            this.activeNudges.set(userId, {
                trigger,
                createdAt: new Date(),
                context,
                userState
            });

            return {
                success: true,
                data: trigger
            };
        } catch (error) {
            console.error('Error generating trigger:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analyze current user state for trigger generation
     */
    async analyzeUserState(user) {
        const journeyData = user.stageData?.get('journeyData');
        const currentStageData = user.stageData?.get(`stage${user.userStage}`);
        const streakData = user.stageData?.get('streakData') || { currentStreak: 0, longestStreak: 0 };

        // Calculate recent completion rate
        const recentCompletionRate = this.calculateRecentCompletionRate(currentStageData);
        
        // Get belief trend
        const currentBelief = journeyData?.beliefScore || 0.5;
        const beliefTrend = this.calculateBeliefTrend(user);

        // Check last activity
        const lastActivity = await this.getLastActivity(user.id);
        const daysSinceActivity = this.daysSince(lastActivity);

        // Get pending tasks
        const pendingTasks = this.getPendingTasks(currentStageData);
        const overdueTasksCount = this.getOverdueTasksCount(pendingTasks);

        return {
            stage: user.userStage,
            stageName: currentStageData?.name || 'Unknown',
            beliefScore: currentBelief,
            beliefTrend: beliefTrend, // 'increasing', 'decreasing', 'stable'
            currentStreak: streakData.currentStreak,
            longestStreak: streakData.longestStreak,
            recentCompletionRate: recentCompletionRate,
            daysSinceActivity: daysSinceActivity,
            pendingTasksCount: pendingTasks.length,
            overdueTasksCount: overdueTasksCount,
            dreamType: journeyData?.parsedDream?.mode || 'unknown',
            urgency: this.calculateUrgency(journeyData),
            momentum: this.calculateMomentum(recentCompletionRate, streakData.currentStreak)
        };
    }

    /**
     * Determine appropriate trigger type based on user state
     */
    determineTriggerType(userState, context) {
        // High urgency + low activity = recovery prompt
        if (userState.daysSinceActivity > 2 && userState.urgency > 0.7) {
            return 'recovery_prompt';
        }

        // Overdue tasks = accountability prompt
        if (userState.overdueTasksCount > 0) {
            return 'accountability_prompt';
        }

        // High momentum = challenge prompt
        if (userState.momentum > 0.8 && userState.currentStreak > 5) {
            return 'challenge_prompt';
        }

        // Low belief = encouragement prompt
        if (userState.beliefScore < 0.4 || userState.beliefTrend === 'decreasing') {
            return 'encouragement_prompt';
        }

        // Milestone reached = celebration prompt
        if (userState.currentStreak > 0 && userState.currentStreak % 7 === 0) {
            return 'celebration_prompt';
        }

        // Default based on context
        const contextMap = {
            'morning': 'identity_anchor',
            'afternoon': 'progress_check',
            'evening': 'reflection_prompt',
            'general': 'motivation_prompt'
        };

        return contextMap[context] || 'motivation_prompt';
    }

    /**
     * Create specific trigger content
     */
    async createTrigger(triggerType, userState, user) {
        const journeyData = user.stageData?.get('journeyData');
        const dream = journeyData?.parsedDream;

        const triggerTemplates = {
            identity_anchor: await this.createIdentityAnchor(dream, userState),
            progress_check: await this.createProgressCheck(userState),
            reflection_prompt: await this.createReflectionPrompt(userState),
            challenge_prompt: await this.createChallengePrompt(userState, dream),
            encouragement_prompt: await this.createEncouragementPrompt(userState, dream),
            recovery_prompt: await this.createRecoveryPrompt(userState, dream),
            accountability_prompt: await this.createAccountabilityPrompt(userState),
            celebration_prompt: await this.createCelebrationPrompt(userState, dream),
            motivation_prompt: await this.createMotivationPrompt(userState, dream)
        };

        const trigger = triggerTemplates[triggerType] || triggerTemplates.motivation_prompt;

        return {
            type: triggerType,
            ...trigger,
            timestamp: new Date(),
            userState: {
                stage: userState.stage,
                beliefScore: userState.beliefScore,
                streak: userState.currentStreak
            }
        };
    }

    /**
     * Trigger creation methods
     */
    async createIdentityAnchor(dream, userState) {
        const targetIdentity = dream?.mode === 'employee' ? dream.role : 'entrepreneur';
        return {
            title: "🌅 Good Morning, Future " + (targetIdentity || "Achiever"),
            message: `Today is another step toward becoming ${targetIdentity}. What's one thing you can do today that ${targetIdentity} would do?`,
            actionPrompt: "Choose your first task of the day",
            motivationBoost: `You believed in this dream ${Math.round(userState.beliefScore * 100)}%. Let's strengthen that belief through action.`
        };
    }

    async createProgressCheck(userState) {
        return {
            title: "📊 Progress Check",
            message: `You're ${userState.recentCompletionRate > 0.7 ? 'crushing it' : 'making progress'} in ${userState.stageName}!`,
            actionPrompt: userState.pendingTasksCount > 0 ? 
                `You have ${userState.pendingTasksCount} tasks waiting. Ready to tackle one?` :
                "All caught up! Want to add a bonus challenge?",
            motivationBoost: userState.currentStreak > 0 ? 
                `Your ${userState.currentStreak}-day streak is building momentum!` :
                "Every expert was once a beginner. Start your streak today!"
        };
    }

    async createReflectionPrompt(userState) {
        const prompts = [
            "What did you learn about yourself today?",
            "How did today's actions bring you closer to your dream?",
            "What would you tell someone else who has the same dream as you?",
            "What are you most grateful for in your journey so far?",
            "If your future self could send you a message, what would it say?"
        ];

        return {
            title: "🌙 Evening Reflection",
            message: "Take a moment to reflect on your journey today.",
            actionPrompt: prompts[Math.floor(Math.random() * prompts.length)],
            motivationBoost: "Reflection turns experience into wisdom."
        };
    }

    async createChallengePrompt(userState, dream) {
        return {
            title: "🔥 Challenge Mode Activated",
            message: `Your ${userState.currentStreak}-day streak shows you're ready for more!`,
            actionPrompt: "Ready for a stretch goal that will accelerate your progress?",
            motivationBoost: `The gap between ${dream?.impactStatement || 'your dream'} and reality is closing. Push further!`
        };
    }

    async createEncouragementPrompt(userState, dream) {
        const encouragements = [
            "Every master was once a disaster. You're learning and growing.",
            "The strongest people are forged in fires of adversity.",
            "Your dream chose you because you're capable of achieving it.",
            "Progress isn't always linear, but it's always worth it.",
            "You've overcome challenges before. This is just another one to conquer."
        ];

        return {
            title: "💪 You've Got This",
            message: encouragements[Math.floor(Math.random() * encouragements.length)],
            actionPrompt: "What's one small step you can take right now?",
            motivationBoost: `Remember why you started: ${dream?.impactStatement || 'to achieve your dream'}.`
        };
    }

    async createRecoveryPrompt(userState, dream) {
        return {
            title: "🎯 Let's Get Back On Track",
            message: `It's been ${userState.daysSinceActivity} days since your last activity. Your dream is still waiting for you.`,
            actionPrompt: "What's the smallest step you can take today to restart your momentum?",
            motivationBoost: "Champions don't quit. They take breaks, learn, and come back stronger."
        };
    }

    async createAccountabilityPrompt(userState) {
        return {
            title: "⏰ Gentle Reminder",
            message: `You have ${userState.overdueTasksCount} overdue task${userState.overdueTasksCount > 1 ? 's' : ''}. No judgment - let's just move forward.`,
            actionPrompt: "Which task would feel best to complete right now?",
            motivationBoost: "Progress beats perfection. One task at a time."
        };
    }

    async createCelebrationPrompt(userState, dream) {
        const milestones = {
            7: "One week of consistency! 🎉",
            14: "Two weeks strong! 🔥",
            21: "Three weeks of commitment! 🌟",
            30: "One month of transformation! 🚀"
        };

        const celebration = milestones[userState.currentStreak] || `${userState.currentStreak} days of dedication! 🎊`;

        return {
            title: "🎉 Celebration Time",
            message: celebration,
            actionPrompt: "How will you reward yourself for this achievement?",
            motivationBoost: `You're proving to yourself that ${dream?.impactStatement || 'your dream'} is achievable!`
        };
    }

    async createMotivationPrompt(userState, dream) {
        const motivations = [
            "Your future self is cheering you on.",
            "Every action you take is a vote for the person you're becoming.",
            "The best time to plant a tree was 20 years ago. The second best time is now.",
            "You don't have to be great to get started, but you have to get started to be great.",
            "Success is the sum of small efforts repeated day in and day out."
        ];

        return {
            title: "✨ Daily Inspiration",
            message: motivations[Math.floor(Math.random() * motivations.length)],
            actionPrompt: "What's one action you can take toward your dream today?",
            motivationBoost: `${dream?.impactStatement || 'Your dream'} is worth every effort you put in.`
        };
    }

    /**
     * Process user action and determine reward
     * @param {string} userId - User ID
     * @param {Object} action - Action taken by user
     * @returns {Object} Reward data
     */
    async processAction(userId, action) {
        try {
            const user = await User.findById(userId);
            const userState = await this.analyzeUserState(user);
            
            // Determine reward type and schedule
            const rewardType = this.determineRewardType(action, userState);
            const reward = await this.generateReward(rewardType, userState, user);

            // Update user investment metrics
            await this.updateInvestmentMetrics(userId, action);

            // Schedule next trigger if appropriate
            await this.scheduleNextTrigger(userId, action, userState);

            return {
                success: true,
                data: {
                    reward,
                    nextTrigger: await this.getNextScheduledTrigger(userId)
                }
            };
        } catch (error) {
            console.error('Error processing action:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Determine appropriate reward type
     */
    determineRewardType(action, userState) {
        // First completion = immediate reward
        if (action.type === 'task_completed' && userState.currentStreak === 0) {
            return 'immediate_badge';
        }

        // Streak milestones = special rewards
        if (action.type === 'task_completed' && userState.currentStreak > 0 && userState.currentStreak % 3 === 0) {
            return 'streak_reward';
        }

        // High quality reflection = insight reward
        if (action.type === 'reflection_completed' && action.quality === 'high') {
            return 'insight_reward';
        }

        // Stage completion = major reward
        if (action.type === 'stage_completed') {
            return 'stage_completion_reward';
        }

        // Random rewards for engagement
        if (Math.random() < 0.3) { // 30% chance
            return 'surprise_reward';
        }

        return 'encouragement_reward';
    }

    /**
     * Generate specific reward content
     */
    async generateReward(rewardType, userState, user) {
        const journeyData = user.stageData?.get('journeyData');
        const dream = journeyData?.parsedDream;

        switch (rewardType) {
            case 'immediate_badge':
                return this.createBadgeReward('first_steps', 'First Steps Taken', 'You\'ve begun your journey!');

            case 'streak_reward':
                return this.createStreakReward(userState.currentStreak);

            case 'insight_reward':
                return await this.createInsightReward(userState, dream);

            case 'stage_completion_reward':
                return this.createStageCompletionReward(userState.stage);

            case 'surprise_reward':
                return await this.createSurpriseReward(dream);

            default:
                return this.createEncouragementReward();
        }
    }

    /**
     * Reward creation methods
     */
    createBadgeReward(badgeId, badgeName, description) {
        return {
            type: 'badge',
            badge: {
                id: badgeId,
                name: badgeName,
                description: description,
                icon: '🏆',
                earnedAt: new Date()
            },
            message: `🎉 Badge Earned: ${badgeName}!`,
            celebration: description
        };
    }

    createStreakReward(streakDays) {
        const milestones = {
            3: { icon: '🔥', message: 'Building heat!' },
            7: { icon: '⚡', message: 'One week strong!' },
            14: { icon: '🌟', message: 'Two weeks of power!' },
            21: { icon: '🚀', message: 'Three weeks of transformation!' },
            30: { icon: '👑', message: 'One month of mastery!' }
        };

        const milestone = milestones[streakDays] || { icon: '💪', message: `${streakDays} days of commitment!` };

        return {
            type: 'streak_milestone',
            streak: {
                days: streakDays,
                icon: milestone.icon,
                achievement: milestone.message
            },
            message: `${milestone.icon} ${milestone.message}`,
            celebration: `Your ${streakDays}-day streak is proof of your dedication!`
        };
    }

    async createInsightReward(userState, dream) {
        // Generate AI insight about user's progress
        const insightPrompt = `
        Generate a personalized insight for a user who is ${userState.recentCompletionRate > 0.7 ? 'performing well' : 'making steady progress'} 
        in their journey toward: ${dream?.impactStatement || 'their dream'}.
        
        Current context:
        - Stage: ${userState.stageName}
        - Belief score: ${Math.round(userState.beliefScore * 100)}%
        - Current streak: ${userState.currentStreak} days
        - Completion rate: ${Math.round(userState.recentCompletionRate * 100)}%
        
        Provide an encouraging, specific insight about their growth pattern in 1-2 sentences.
        `;

        try {
            const insight = await this.llamaService.generateCompletion(insightPrompt);
            return {
                type: 'ai_insight',
                insight: {
                    content: insight.trim(),
                    category: 'progress_analysis',
                    generatedAt: new Date()
                },
                message: '🧠 Personal Insight Generated',
                celebration: 'Your reflection earned you a personalized insight!'
            };
        } catch (error) {
            return this.createEncouragementReward();
        }
    }

    createStageCompletionReward(stage) {
        const stageRewards = {
            1: { name: 'Momentum Builder', icon: '🚀', description: 'You\'ve activated your journey!' },
            2: { name: 'Vision Architect', icon: '🏗️', description: 'You\'ve built a clear vision!' },
            3: { name: 'Momentum Master', icon: '⚡', description: 'You\'ve proven your persistence!' },
            4: { name: 'Discipline Champion', icon: '🏆', description: 'You\'ve mastered routine!' },
            5: { name: 'Resilience Warrior', icon: '⚔️', description: 'You\'ve conquered obstacles!' },
            6: { name: 'Transformation Artist', icon: '🎨', description: 'You\'ve created change!' },
            7: { name: 'Dream Master', icon: '👑', description: 'You\'ve achieved mastery!' }
        };

        const reward = stageRewards[stage] || stageRewards[1];

        return {
            type: 'stage_completion',
            badge: {
                id: `stage_${stage}_complete`,
                name: reward.name,
                description: reward.description,
                icon: reward.icon,
                earnedAt: new Date()
            },
            unlocks: this.getStageUnlocks(stage),
            message: `🎊 Stage ${stage} Complete!`,
            celebration: `${reward.icon} ${reward.description}`
        };
    }

    async createSurpriseReward(dream) {
        const surprises = [
            { type: 'quote', content: await this.generatePersonalizedQuote(dream) },
            { type: 'fact', content: 'Did you know? People who write down their goals are 42% more likely to achieve them!' },
            { type: 'tip', content: 'Pro tip: The 2-minute rule - if something takes less than 2 minutes, do it now!' },
            { type: 'encouragement', content: 'You\'re making progress even when you can\'t see it. Trust the process!' }
        ];

        const surprise = surprises[Math.floor(Math.random() * surprises.length)];

        return {
            type: 'surprise',
            surprise: {
                category: surprise.type,
                content: surprise.content,
                deliveredAt: new Date()
            },
            message: '🎁 Surprise Reward!',
            celebration: 'A little something for your dedication!'
        };
    }

    createEncouragementReward() {
        const encouragements = [
            'Every step counts!',
            'You\'re building something amazing!',
            'Progress over perfection!',
            'Your consistency is inspiring!',
            'Keep up the momentum!'
        ];

        return {
            type: 'encouragement',
            message: encouragements[Math.floor(Math.random() * encouragements.length)],
            celebration: 'Your effort is recognized and appreciated!'
        };
    }

    /**
     * Helper methods
     */
    calculateRecentCompletionRate(stageData) {
        if (!stageData?.goals) return 0;
        
        const recentTasks = [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7); // Last 7 days

        stageData.goals.forEach(goal => {
            goal.tasks?.forEach(task => {
                if (task.scheduledDate >= cutoffDate) {
                    recentTasks.push(task);
                }
            });
        });

        if (recentTasks.length === 0) return 0;

        const completedCount = recentTasks.filter(task => task.status === 'completed').length;
        return completedCount / recentTasks.length;
    }

    calculateBeliefTrend(user) {
        // This would analyze belief score over time
        // For now, return stable
        return 'stable';
    }

    calculateUrgency(journeyData) {
        if (!journeyData?.timeFrame) return 0.5;
        
        const monthsRemaining = journeyData.timeFrame;
        if (monthsRemaining <= 3) return 1.0;
        if (monthsRemaining <= 6) return 0.8;
        if (monthsRemaining <= 12) return 0.6;
        return 0.4;
    }

    calculateMomentum(completionRate, streakDays) {
        return (completionRate * 0.7) + ((streakDays / 30) * 0.3);
    }

    daysSince(date) {
        if (!date) return 99;
        const diffTime = Math.abs(new Date() - new Date(date));
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getPendingTasks(stageData) {
        if (!stageData?.goals) return [];
        
        const pending = [];
        stageData.goals.forEach(goal => {
            goal.tasks?.forEach(task => {
                if (task.status === 'pending') {
                    pending.push(task);
                }
            });
        });
        
        return pending;
    }

    getOverdueTasksCount(pendingTasks) {
        const today = new Date();
        return pendingTasks.filter(task => new Date(task.scheduledDate) < today).length;
    }

    async getLastActivity(userId) {
        // This would query activity logs
        // For now, return recent date
        return new Date();
    }

    getStageUnlocks(stage) {
        // Return what gets unlocked for completing this stage
        return [];
    }

    async generatePersonalizedQuote(dream) {
        const quotes = [
            `"The future belongs to those who believe in the beauty of their dreams." - Eleanor Roosevelt`,
            `"Your dream doesn't have an expiration date. Take a deep breath and try again."`,
            `"Dreams don't work unless you do." - John C. Maxwell`,
            `"The only impossible journey is the one you never begin." - Tony Robbins`
        ];
        
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    async updateInvestmentMetrics(userId, action) {
        // Update user's investment in the system
        // Time invested, emotional investment, etc.
    }

    async scheduleNextTrigger(userId, action, userState) {
        // Schedule when the next trigger should fire
    }

    async getNextScheduledTrigger(userId) {
        // Get the next scheduled trigger for this user
        return null;
    }
}

module.exports = new HabitLoopEngine();