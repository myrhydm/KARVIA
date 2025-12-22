/**
 * Journey Manager Service
 * Handles the 7-stage recursive dream-driven personal growth system
 */

const { JOURNEY_STAGES, ADAPTATION_ENGINE } = require('../config/journeySystem');
const llamaService = require('./llamaService');
const dreamParser = require('./dreamParser');
const User = require('../models/User');

class JourneyManager {
    constructor() {
        this.llamaService = llamaService;
        this.dreamParser = dreamParser;
    }

    /**
     * Initialize user's journey based on their parsed dream
     * @param {string} userId - User ID
     * @param {Object} parsedDream - Parsed dream data
     * @returns {Object} Journey initialization result
     */
    async initializeJourney(userId, parsedDream) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Set initial stage
            user.userStage = 1;
            user.stageData = user.stageData || new Map();
            
            // Store journey initialization data
            const journeyData = {
                startDate: new Date(),
                parsedDream: parsedDream,
                currentStage: 1,
                overallGoal: this.extractOverallGoal(parsedDream),
                beliefScore: parsedDream.confidence / 100,
                timeFrame: parsedDream.timeHorizon,
                adaptationProfile: this.createInitialAdaptationProfile(parsedDream)
            };

            user.stageData.set('journeyData', journeyData);

            // Generate Stage 1 goals and tasks
            const stage1Content = await this.generateStageContent(1, parsedDream, user);
            user.stageData.set('stage1', stage1Content);

            await user.save();

            return {
                success: true,
                data: {
                    journey: journeyData,
                    stage1: stage1Content,
                    message: "Journey initialized successfully"
                }
            };
        } catch (error) {
            console.error('Error initializing journey:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate content for a specific stage
     * @param {number} stageNumber - Stage number (1-7)
     * @param {Object} parsedDream - User's parsed dream
     * @param {Object} user - User object
     * @returns {Object} Generated stage content
     */
    async generateStageContent(stageNumber, parsedDream, user) {
        const stage = JOURNEY_STAGES[`STAGE_${stageNumber}`];
        if (!stage) {
            throw new Error(`Invalid stage number: ${stageNumber}`);
        }

        try {
            // Get user's journey data for context
            const journeyData = user.stageData?.get('journeyData') || {};
            const adaptationProfile = journeyData.adaptationProfile || {};

            // Generate goals using LLM
            const goalsPrompt = this.buildStageGoalsPrompt(stage, parsedDream, adaptationProfile, user);
            const goalsResponse = await this.llamaService.generateCompletion(goalsPrompt);
            const goals = this.parseGoalsResponse(goalsResponse, stage);

            // Generate tasks for each goal
            const goalsWithTasks = await Promise.all(
                goals.map(async (goal) => {
                    const tasksPrompt = this.buildTasksPrompt(goal, stage, parsedDream, adaptationProfile);
                    const tasksResponse = await this.llamaService.generateCompletion(tasksPrompt);
                    const tasks = this.parseTasksResponse(tasksResponse, stage);
                    
                    return {
                        ...goal,
                        tasks: tasks.map((task, index) => ({
                            ...task,
                            id: `${goal.id}_task_${index + 1}`,
                            scheduledDate: this.calculateTaskSchedule(index, stage, new Date()),
                            status: 'pending'
                        }))
                    };
                })
            );

            // Generate stage-specific features
            const stageFeatures = await this.generateStageFeatures(stage, parsedDream, user);

            return {
                stage: stageNumber,
                name: stage.name,
                purpose: stage.purpose,
                duration: stage.duration,
                goals: goalsWithTasks,
                features: stageFeatures,
                requirements: stage.requirements,
                startDate: new Date(),
                status: 'active',
                adaptationApplied: adaptationProfile.currentAdaptation || 'baseline'
            };
        } catch (error) {
            console.error(`Error generating stage ${stageNumber} content:`, error);
            throw error;
        }
    }

    /**
     * Build LLM prompt for generating stage goals
     */
    buildStageGoalsPrompt(stage, parsedDream, adaptationProfile, user) {
        const dreamContext = this.buildDreamContext(parsedDream);
        const userContext = this.buildUserContext(user, adaptationProfile);
        
        return `
You are an expert life coach creating personalized goals for a user's ${stage.name} (Stage ${stage.id}).

STAGE PURPOSE: ${stage.purpose}
DURATION: ${stage.duration} days
REQUIRED GOALS: ${stage.goals.count}

USER DREAM CONTEXT:
${dreamContext}

USER CONTEXT:
${userContext}

STAGE REQUIREMENTS:
- Completion threshold: ${stage.requirements.completion_threshold * 100}%
- Minimum reflections: ${stage.requirements.min_reflections}
- Special requirements: ${JSON.stringify(stage.requirements)}

ADAPTATION NOTES:
${adaptationProfile.notes || 'Baseline approach - no special adaptations needed'}

Create ${stage.goals.count} SMART goals that:
1. Build toward the user's dream progressively
2. Match the stage's purpose and duration
3. Are appropriate for their current belief level (${adaptationProfile.beliefLevel || 'moderate'})
4. Include both action-oriented and reflection-based goals
5. Create momentum and engagement

Format as JSON:
{
  "goals": [
    {
      "id": "stage${stage.id}_goal_1",
      "title": "Goal title (specific and motivating)",
      "description": "Detailed explanation of why this goal matters for their dream",
      "category": "skill_building|identity_building|progress_making|reflection",
      "difficulty": "easy|medium|hard",
      "estimatedHours": number,
      "successCriteria": "Clear completion criteria",
      "dreamAlignment": "How this connects to their specific dream"
    }
  ]
}
`;
    }

    /**
     * Build LLM prompt for generating tasks for a goal
     */
    buildTasksPrompt(goal, stage, parsedDream, adaptationProfile) {
        return `
You are creating specific, actionable tasks for this goal in ${stage.name}.

GOAL CONTEXT:
Title: ${goal.title}
Description: ${goal.description}
Category: ${goal.category}
Difficulty: ${goal.difficulty}

STAGE CONTEXT:
Duration: ${stage.duration} days
Tasks needed: ${stage.goals.tasks_per_goal} tasks per goal
Purpose: ${stage.purpose}

USER DREAM: ${parsedDream.impactStatement || parsedDream.rawText}
ADAPTATION LEVEL: ${adaptationProfile.challengeLevel || 'medium'}

Create ${stage.goals.tasks_per_goal} specific tasks that:
1. Are actionable and clear
2. Build progressively in difficulty
3. Can be completed in 10-45 minutes each
4. Include both action and reflection elements
5. Connect directly to the user's dream

Format as JSON:
{
  "tasks": [
    {
      "title": "Specific action to take",
      "description": "Detailed instructions and why it matters",
      "estimatedMinutes": number,
      "type": "action|reflection|skill|research|practice",
      "difficulty": "easy|medium|hard",
      "reflectionPrompt": "Question to ask after completion (optional)",
      "successIndicator": "How to know it's complete"
    }
  ]
}
`;
    }

    /**
     * Calculate task scheduling across stage duration
     */
    calculateTaskSchedule(taskIndex, stage, stageStartDate) {
        const totalTasks = stage.goals.count * stage.goals.tasks_per_goal;
        const daySpread = stage.duration;
        const tasksPerDay = Math.ceil(totalTasks / daySpread);
        
        const dayOffset = Math.floor(taskIndex / tasksPerDay);
        const scheduledDate = new Date(stageStartDate);
        scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
        
        return scheduledDate;
    }

    /**
     * Generate stage-specific features and unlocks
     */
    async generateStageFeatures(stage, parsedDream, user) {
        const features = {};
        
        // Add stage-specific features
        if (stage.unlocks.features) {
            for (const feature of stage.unlocks.features) {
                switch (feature) {
                    case 'vision_questionnaire':
                        features.visionQuestionnaire = await this.generateVisionQuestionnaire(parsedDream);
                        break;
                    case 'identity_tracker':
                        features.identityTracker = this.generateIdentityTracker(parsedDream);
                        break;
                    case 'schedule_builder':
                        features.scheduleBuilder = this.generateScheduleBuilder(user);
                        break;
                    case 'ai_coach_feedback':
                        features.aiCoachFeedback = true;
                        break;
                    // Add more features as needed
                }
            }
        }
        
        return features;
    }

    /**
     * Progress user to next stage if requirements are met
     */
    async progressToNextStage(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const currentStage = user.userStage;
            const stageData = user.stageData?.get(`stage${currentStage}`);
            
            if (!stageData) {
                throw new Error('Current stage data not found');
            }

            // Check if requirements are met
            const meetsRequirements = await this.checkStageRequirements(user, currentStage, stageData);
            
            if (!meetsRequirements.success) {
                return {
                    success: false,
                    reason: meetsRequirements.reason,
                    action: 'requirements_not_met'
                };
            }

            // Progress to next stage
            const nextStage = currentStage + 1;
            
            if (nextStage > 7) {
                // Journey complete!
                return await this.completeJourney(user);
            }

            // Generate next stage content
            const journeyData = user.stageData.get('journeyData');
            const nextStageContent = await this.generateStageContent(
                nextStage, 
                journeyData.parsedDream, 
                user
            );

            // Update user
            user.userStage = nextStage;
            user.stageData.set(`stage${nextStage}`, nextStageContent);
            
            // Mark current stage as completed
            stageData.status = 'completed';
            stageData.endDate = new Date();
            user.stageData.set(`stage${currentStage}`, stageData);

            await user.save();

            return {
                success: true,
                data: {
                    newStage: nextStage,
                    stageContent: nextStageContent,
                    rewards: JOURNEY_STAGES[`STAGE_${currentStage}`].unlocks.rewards
                }
            };
        } catch (error) {
            console.error('Error progressing to next stage:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if user meets requirements for current stage completion
     */
    async checkStageRequirements(user, stageNumber, stageData) {
        const stage = JOURNEY_STAGES[`STAGE_${stageNumber}`];
        const requirements = stage.requirements;
        
        // Calculate completion rate
        const totalTasks = stageData.goals.reduce((sum, goal) => sum + goal.tasks.length, 0);
        const completedTasks = stageData.goals.reduce((sum, goal) => 
            sum + goal.tasks.filter(task => task.status === 'completed').length, 0);
        
        const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
        
        // Check completion threshold
        if (completionRate < requirements.completion_threshold) {
            return {
                success: false,
                reason: `Need ${(requirements.completion_threshold * 100)}% completion, currently at ${(completionRate * 100).toFixed(1)}%`
            };
        }

        // Check reflection requirements
        const reflectionCount = await this.countUserReflections(user.id, stageNumber);
        if (reflectionCount < requirements.min_reflections) {
            return {
                success: false,
                reason: `Need ${requirements.min_reflections} reflections, currently have ${reflectionCount}`
            };
        }

        // Check special requirements
        if (requirements.vision_questionnaire) {
            const hasVisionQuestionnaire = user.stageData?.get('visionQuestionnaireCompleted');
            if (!hasVisionQuestionnaire) {
                return {
                    success: false,
                    reason: 'Vision questionnaire must be completed'
                };
            }
        }

        return { success: true };
    }

    /**
     * Apply intelligent adaptation based on user patterns
     */
    async applyAdaptation(userId, adaptationTrigger) {
        try {
            const user = await User.findById(userId);
            const journeyData = user.stageData?.get('journeyData');
            const currentStageData = user.stageData?.get(`stage${user.userStage}`);
            
            if (!journeyData || !currentStageData) {
                throw new Error('Journey data not found');
            }

            // Analyze user patterns
            const patterns = await this.analyzeUserPatterns(user);
            
            // Determine adaptation strategy
            const adaptationStrategy = this.determineAdaptationStrategy(patterns, adaptationTrigger);
            
            // Apply adaptation
            const adaptedContent = await this.applyAdaptationStrategy(
                user, 
                currentStageData, 
                adaptationStrategy
            );

            // Update user data
            user.stageData.set(`stage${user.userStage}`, adaptedContent);
            
            // Log adaptation
            const adaptationHistory = journeyData.adaptationHistory || [];
            adaptationHistory.push({
                date: new Date(),
                trigger: adaptationTrigger,
                strategy: adaptationStrategy,
                stage: user.userStage
            });
            journeyData.adaptationHistory = adaptationHistory;
            user.stageData.set('journeyData', journeyData);

            await user.save();

            return {
                success: true,
                data: {
                    adaptationApplied: adaptationStrategy,
                    updatedContent: adaptedContent
                }
            };
        } catch (error) {
            console.error('Error applying adaptation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analyze user patterns for adaptation
     */
    async analyzeUserPatterns(user) {
        // Implementation would analyze:
        // - Task completion rates
        // - Belief score trends
        // - Engagement patterns
        // - Reflection quality
        // - Time patterns
        
        return {
            completionPattern: 'consistent_performer', // This would be calculated
            beliefPattern: 'stable_medium', // This would be calculated
            engagementPattern: 'high_engagement', // This would be calculated
            preferredTaskTime: 'morning', // This would be inferred
            challengeLevel: 'medium' // This would be calculated
        };
    }

    /**
     * Helper methods for context building
     */
    buildDreamContext(parsedDream) {
        return `
Dream Type: ${parsedDream.mode}
${parsedDream.mode === 'employee' ? 
  `Target Role: ${parsedDream.role || 'Not specified'}
   Target Company: ${parsedDream.targetCompany || 'Not specified'}
   Industry: ${parsedDream.industryVertical || 'Not specified'}` :
  `Venture Idea: ${parsedDream.ventureIdea || 'Not specified'}
   Target Market: ${parsedDream.targetPersona || 'Not specified'}
   Industry: ${parsedDream.industryVertical || 'Not specified'}`
}
Tech Focus: ${parsedDream.techFocus || 'Not specified'}
Impact Goal: ${parsedDream.impactStatement || parsedDream.rawText}
Time Horizon: ${parsedDream.timeHorizon} months
Quality Score: ${(parsedDream.qualityScore * 100).toFixed(0)}%
`;
    }

    buildUserContext(user, adaptationProfile) {
        const journeyData = user.stageData?.get('journeyData');
        return `
Current Belief Score: ${adaptationProfile.beliefLevel || journeyData?.beliefScore || 0.5}
Journey Start Date: ${journeyData?.startDate || 'Not started'}
Current Stage: ${user.userStage || 1}
Adaptation Profile: ${adaptationProfile.currentAdaptation || 'baseline'}
Previous Adaptations: ${adaptationProfile.history?.length || 0} applied
`;
    }

    createInitialAdaptationProfile(parsedDream) {
        const beliefScore = parsedDream.confidence / 100;
        const qualityScore = parsedDream.qualityScore || 0.5;
        
        return {
            beliefLevel: beliefScore > 0.7 ? 'high' : beliefScore > 0.4 ? 'medium' : 'low',
            challengeLevel: qualityScore > 0.8 ? 'high' : qualityScore > 0.5 ? 'medium' : 'low',
            motivationStyle: parsedDream.mode === 'entrepreneur' ? 'achievement' : 'growth',
            currentAdaptation: 'baseline',
            history: []
        };
    }

    extractOverallGoal(parsedDream) {
        return parsedDream.impactStatement || parsedDream.rawText || "Achieve your dream";
    }

    // Parsing helper methods
    parseGoalsResponse(response, stage) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.goals || [];
            }
        } catch (error) {
            console.error('Error parsing goals response:', error);
        }
        
        // Fallback goals
        return this.generateFallbackGoals(stage);
    }

    parseTasksResponse(response, stage) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.tasks || [];
            }
        } catch (error) {
            console.error('Error parsing tasks response:', error);
        }
        
        // Fallback tasks
        return this.generateFallbackTasks(stage);
    }

    generateFallbackGoals(stage) {
        // Simplified fallback goals based on stage
        const fallbacks = {
            1: [
                { id: 'stage1_goal_1', title: 'Take the first step', description: 'Begin your journey toward your dream', category: 'progress_making', difficulty: 'easy' },
                { id: 'stage1_goal_2', title: 'Reflect on your motivation', description: 'Understand why this dream matters to you', category: 'reflection', difficulty: 'easy' },
                { id: 'stage1_goal_3', title: 'Create a daily habit', description: 'Establish one small daily action', category: 'skill_building', difficulty: 'medium' }
            ]
        };
        
        return fallbacks[stage.id] || fallbacks[1];
    }

    generateFallbackTasks(stage) {
        // Simplified fallback tasks
        return [
            { title: 'Write down your dream', description: 'Take 5 minutes to write exactly what you want to achieve', estimatedMinutes: 5, type: 'reflection' },
            { title: 'Research one aspect', description: 'Spend 15 minutes researching one element of your goal', estimatedMinutes: 15, type: 'research' },
            { title: 'Take one small action', description: 'Do one small thing that moves you toward your dream', estimatedMinutes: 20, type: 'action' }
        ];
    }

    async countUserReflections(userId, stageNumber) {
        // This would query a reflections collection
        // For now, return a placeholder
        return 0;
    }

    async generateVisionQuestionnaire(parsedDream) {
        // Generate vision questionnaire based on dream
        return {
            questions: [
                "What does success look like to you in this area?",
                "Who do you need to become to achieve this?",
                "What would achieving this dream mean for your life?",
                "What obstacles do you anticipate?",
                "How will you know when you've succeeded?"
            ]
        };
    }

    generateIdentityTracker(parsedDream) {
        return {
            targetIdentity: parsedDream.mode === 'employee' ? parsedDream.role : 'Entrepreneur',
            currentProgress: 0,
            milestones: []
        };
    }

    generateScheduleBuilder(user) {
        return {
            availableTimeSlots: [],
            preferences: {},
            optimizedSchedule: null
        };
    }

    determineAdaptationStrategy(patterns, trigger) {
        // Logic to determine what adaptation to apply
        return 'maintain_current'; // Placeholder
    }

    async applyAdaptationStrategy(user, stageData, strategy) {
        // Logic to modify stage content based on strategy
        return stageData; // Placeholder - would modify tasks/goals
    }

    async completeJourney(user) {
        // Handle journey completion
        return {
            success: true,
            graduation: true,
            message: 'Congratulations! You have completed your dream journey!'
        };
    }
}

module.exports = new JourneyManager();