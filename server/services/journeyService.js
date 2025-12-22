/**
 * Journey Service
 * Handles 21-day journey business logic
 */

const Journey = require('../models/Journey');
const WeeklyGoal = require('../models/WeeklyGoal');
const Task = require('../models/Task');
const visionDataService = require('./visionDataService');
const sprintAIService = require('./sprintAIService');

class JourneyService {
    
    /**
     * Initialize a new 21-day journey for a user
     */
    async initializeJourney(userId, dreamText, confidence = 50, timeHorizon = 12, careerPath = 'employee', timeCommitment = 'micro-burst', learningStyle = 'visual') {
        try {
            // Check if user already has an active journey
            const existingJourney = await Journey.findOne({ 
                user: userId, 
                status: 'active' 
            });
            
            if (existingJourney) {
                throw new Error('User already has an active journey');
            }

            // Create the journey structure
            const journey = new Journey({
                user: userId,
                dreamText,
                confidence,
                timeHorizon,
                sprints: this.createSprintStructure(),
                reflectionDays: this.createReflectionDays()
            });

            // Initialize first sprint with Planner Engine
            await this.initializeFirstSprint(journey, { dreamText, confidence, timeHorizon, careerPath, timeCommitment, learningStyle });

            await journey.save();
            
            // Initialize vision profile for data collection with preferences
            await visionDataService.initializeVisionProfile(userId, journey._id, {
                careerPath,
                timeCommitment,
                learningStyle,
                confidenceBaseline: confidence,
                timeHorizon
            });
            
            return journey;

        } catch (error) {
            throw new Error(`Failed to initialize journey: ${error.message}`);
        }
    }

    /**
     * Get user's current journey status
     */
    async getJourneyStatus(userId) {
        try {
            const journey = await Journey.findOne({ 
                user: userId, 
                status: 'active' 
            });

            if (!journey) {
                return { hasActiveJourney: false };
            }

            const currentSprint = journey.getCurrentSprint();
            
            return {
                hasActiveJourney: true,
                journeyId: journey._id,
                currentWeek: journey.currentWeek,
                currentSprint: journey.currentSprint,
                currentDay: journey.currentDay,
                status: journey.status,
                overallProgress: journey.overallProgress,
                currentSprintData: currentSprint,
                nextUnlock: this.getNextUnlock(journey)
            };

        } catch (error) {
            throw new Error(`Failed to get journey status: ${error.message}`);
        }
    }

    /**
     * Get current sprint tasks for homepage
     */
    async getCurrentSprintTasks(userId) {
        try {
            const journey = await Journey.findOne({ 
                user: userId, 
                status: 'active' 
            });

            if (!journey) {
                return [];
            }

            const currentSprint = journey.getCurrentSprint();
            if (!currentSprint) {
                return [];
            }

            // Get all tasks for all goals in current sprint (not just today's)
            const tasks = [];
            for (const goal of currentSprint.goals) {
                for (const taskRef of goal.tasks) {
                    const task = await Task.findById(taskRef.taskId);
                    if (task) {
                        tasks.push({
                            _id: task._id,
                            name: task.name,
                            estTime: task.estTime,
                            completed: task.completed, // Use actual task completion status from database
                            day: task.day,
                            sprintNumber: currentSprint.sprintNumber,
                            goalTitle: goal.title
                        });
                    }
                }
            }

            return tasks;

        } catch (error) {
            throw new Error(`Failed to get current sprint tasks: ${error.message}`);
        }
    }

    /**
     * Complete a task and update progress
     */
    async completeTask(userId, taskId) {
        try {
            const journey = await Journey.findOne({ 
                user: userId, 
                status: 'active' 
            });

            if (!journey) {
                throw new Error('No active journey found');
            }

            // Find the task in the current sprint
            const currentSprint = journey.getCurrentSprint();
            let taskFound = false;
            let goalCompleted = false;

            for (const goal of currentSprint.goals) {
                for (const task of goal.tasks) {
                    if (task.taskId.toString() === taskId) {
                        task.completed = true;
                        task.completedAt = new Date();
                        taskFound = true;

                        // Check if all tasks in goal are completed
                        if (goal.tasks.every(t => t.completed)) {
                            goal.completed = true;
                            goal.completedAt = new Date();
                            goalCompleted = true;
                        }
                        break;
                    }
                }
                if (taskFound) break;
            }

            if (!taskFound) {
                throw new Error('Task not found in current sprint');
            }

            // Update task in database
            await Task.findByIdAndUpdate(taskId, { 
                completed: true,
                timeSpent: 0 // Could be updated based on actual time tracking
            });

            // Collect vision data from task completion (if applicable)
            const taskData = await Task.findById(taskId);
            if (taskData) {
                try {
                    await visionDataService.collectDataFromTask(
                        userId, 
                        taskId, 
                        taskData.name, 
                        journey.currentSprint, 
                        journey.currentDay,
                        {} // In a real implementation, this would contain user responses
                    );
                } catch (visionError) {
                    console.log('Vision data collection failed:', visionError.message);
                }
            }

            // Update journey progress
            journey.updateProgress();
            journey.lastActiveDate = new Date();

            // Check if sprint is completed
            if (journey.canProgressToNextSprint()) {
                // Don't auto-progress, let user manually progress or trigger it
                currentSprint.completionRate = 100;
            }

            await journey.save();

            return {
                success: true,
                taskCompleted: true,
                goalCompleted,
                sprintCompleted: journey.canProgressToNextSprint(),
                progress: journey.overallProgress
            };

        } catch (error) {
            throw new Error(`Failed to complete task: ${error.message}`);
        }
    }

    /**
     * Progress to next sprint
     */
    async progressToNextSprint(userId) {
        try {
            const journey = await Journey.findOne({ 
                user: userId, 
                status: 'active' 
            });

            if (!journey) {
                throw new Error('No active journey found');
            }

            if (!journey.canProgressToNextSprint()) {
                throw new Error('Current sprint not completed');
            }

            // Get current sprint data for AI analysis
            const currentSprint = journey.getCurrentSprint();
            
            // Analyze completed sprint with AI
            let sprintAnalysis = null;
            try {
                const analysisResult = await sprintAIService.analyzeSprint(
                    userId, 
                    currentSprint, 
                    journey
                );
                sprintAnalysis = analysisResult.analysis;
                console.log('Sprint analysis completed:', analysisResult.insights);
            } catch (analysisError) {
                console.log('Sprint analysis failed:', analysisError.message);
            }

            // Progress the journey
            journey.progressToNextSprint();

            // If not completed, initialize next sprint with AI personalization
            if (journey.status !== 'completed') {
                await this.initializeNextSprintWithAI(journey, sprintAnalysis);
            }

            await journey.save();

            return {
                success: true,
                newSprint: journey.currentSprint,
                newWeek: journey.currentWeek,
                newDay: journey.currentDay,
                journeyCompleted: journey.status === 'completed'
            };

        } catch (error) {
            throw new Error(`Failed to progress to next sprint: ${error.message}`);
        }
    }

    /**
     * Create the 6 sprint structure
     */
    createSprintStructure() {
        return [
            {
                sprintNumber: 1,
                name: 'Dream Activation',
                week: 1,
                days: [1, 2, 3],
                status: 'unlocked', // First sprint is immediately available
                goals: []
            },
            {
                sprintNumber: 2,
                name: 'Reality Mapping',
                week: 1,
                days: [4, 5, 6],
                status: 'locked',
                goals: []
            },
            {
                sprintNumber: 3,
                name: 'Skill Building',
                week: 2,
                days: [8, 9, 10],
                status: 'locked',
                goals: []
            },
            {
                sprintNumber: 4,
                name: 'Network Expansion',
                week: 2,
                days: [11, 12, 13],
                status: 'locked',
                goals: []
            },
            {
                sprintNumber: 5,
                name: 'Leadership Practice',
                week: 3,
                days: [15, 16, 17],
                status: 'locked',
                goals: []
            },
            {
                sprintNumber: 6,
                name: 'Integration & Mastery',
                week: 3,
                days: [18, 19, 20],
                status: 'locked',
                goals: []
            }
        ];
    }

    /**
     * Create reflection days structure
     */
    createReflectionDays() {
        return [
            {
                day: 7,
                week: 1,
                status: 'locked'
            },
            {
                day: 14,
                week: 2,
                status: 'locked'
            },
            {
                day: 21,
                week: 3,
                status: 'locked'
            }
        ];
    }

    /**
     * Initialize first sprint with Planner Engine
     */
    async initializeFirstSprint(journey, userInput = null) {
        try {
            const firstSprint = journey.sprints[0];
            firstSprint.status = 'active';
            firstSprint.startDate = new Date();

            let sprintGoals;
            
            // Try Planner Engine first if user input is provided
            if (userInput) {
                try {
                    console.log('Journey Service: Using Planner Engine for first sprint...');
                    const plannerEngine = require('../engines/planner');
                    
                    const plannerInput = {
                        userId: journey.user,
                        dreamText: userInput.dreamText || journey.dreamText,
                        confidence: userInput.confidence || 50,
                        timeHorizon: userInput.timeHorizon || 12,
                        careerPath: userInput.careerPath || 'employee',
                        timeCommitment: userInput.timeCommitment || 'micro-burst',
                        learningStyle: userInput.learningStyle || 'visual',
                        startDate: new Date()
                    };
                    
                    const planResult = await plannerEngine.generatePlan(plannerInput);
                    
                    console.log('Journey Service: Plan result keys:', Object.keys(planResult));
                    console.log('Journey Service: Plan result structure:', JSON.stringify(planResult, null, 2).substring(0, 500));
                    
                    // Handle new 21-day journey structure
                    if (planResult.journey && planResult.journey.weeks) {
                        console.log(`Journey Service: Planner Engine generated 21-day journey with ${planResult.journey.weeks.length} weeks using ${planResult.method}`);
                        await this.initialize21DayJourney(journey, planResult.journey);
                        return; // Important: return here to avoid continuing to old logic
                    } else {
                        // Fallback to old structure if available
                        sprintGoals = planResult.goals;
                        console.log(`Journey Service: Planner Engine generated ${sprintGoals.length} goals using ${planResult.method}`);
                    }
                } catch (plannerError) {
                    console.log('Journey Service: Planner Engine failed, using template fallback');
                    console.log('Planner Error:', plannerError.message);
                    sprintGoals = await this.createSprintGoals(1, journey.dreamText, new Date());
                }
            } else {
                // Fallback to template
                sprintGoals = await this.createSprintGoals(1, journey.dreamText, new Date());
            }
            
            // Create tasks in database but store goals only in journey structure
            for (const goalData of sprintGoals) {
                // Create tasks for this goal
                const goalTasks = [];
                for (const taskData of goalData.tasks) {
                    const task = new Task({
                        user: journey.user,
                        goal: null, // Journey tasks don't belong to WeeklyGoals
                        journey: journey._id,
                        name: taskData.name,
                        estTime: taskData.estTime,
                        day: taskData.day,
                        completed: false,
                        repeatType: 'none',
                        
                        // Add required fields with template defaults
                        rationale: taskData.rationale || `Essential task for achieving your dream: ${journey.dreamText?.substring(0, 100)}...`,
                        metricsImpacted: taskData.metricsImpacted || [{
                            metric: 'clarity',
                            expectedImpact: 'medium',
                            reasoning: 'This task helps clarify your path toward your goal'
                        }],
                        difficultyLevel: taskData.difficultyLevel || 'beginner',
                        skillCategory: taskData.skillCategory || 'self_assessment',
                        
                        // Adaptive metadata with required timeCommitmentStyle
                        adaptiveMetadata: {
                            generationMethod: 'template_based',
                            timeCommitmentStyle: journey.timeCommitment || 'micro-burst',
                            confidenceLevel: journey.confidence || 50,
                            archetypeContext: journey.archetypeData?.type || 'general'
                        }
                    });

                    await task.save();
                    goalTasks.push({
                        taskId: task._id,
                        title: task.name,
                        completed: false
                    });
                }

                // Add goal to sprint structure only (no WeeklyGoal creation)
                firstSprint.goals.push({
                    goalId: null, // Virtual goal, no database entry
                    day: goalData.day,
                    title: goalData.title,
                    tasks: goalTasks,
                    completed: false
                });
            }

        } catch (error) {
            throw new Error(`Failed to initialize first sprint: ${error.message}`);
        }
    }

    /**
     * Initialize complete 21-day journey with new structure
     * Creates regular WeeklyGoals for first 3 days instead of journey-specific structure
     */
    async initialize21DayJourney(journey, journeyData) {
        try {
            console.log('Journey Service: Initializing 21-day journey structure...');
            
            // Store the complete 21-day plan in journey metadata
            journey.fullJourneyPlan = journeyData;
            
            // Get current week and extract first 3 days as regular WeeklyGoals
            const currentWeek = journeyData.weeks[0]; // Start with week 1
            const firstSprint = journey.sprints[0];
            
            firstSprint.status = 'active';
            firstSprint.startDate = new Date();
            firstSprint.name = currentWeek.theme || 'Dream Activation';
            
            // Create regular WeeklyGoals for the first 3 days of the journey
            const { getStartOfWeek } = require('../utils/date');
            const weekOf = getStartOfWeek(new Date());
            
            for (const goalData of currentWeek.goals) {
                // Create a regular WeeklyGoal (not journey-specific)
                const weeklyGoal = new WeeklyGoal({
                    user: journey.user,
                    title: goalData.title,
                    weekOf: weekOf,
                    tasks: []
                });

                await weeklyGoal.save();
                
                // Create tasks for this goal
                const taskIds = [];
                for (const taskData of goalData.tasks) {
                    const task = new Task({
                        user: journey.user,
                        goal: weeklyGoal._id, // Link to the WeeklyGoal
                        name: taskData.name,
                        estTime: taskData.estTime,
                        day: taskData.dayName, // Use the dynamic day name
                        completed: false,
                        repeatType: 'none'
                    });

                    await task.save();
                    taskIds.push(task._id);
                }

                // Update the WeeklyGoal with task references
                weeklyGoal.tasks = taskIds;
                await weeklyGoal.save();

                // Also add to sprint structure for journey tracking
                firstSprint.goals.push({
                    goalId: weeklyGoal._id, // Reference to the actual WeeklyGoal
                    day: goalData.goalId.includes('g1') ? 1 : (goalData.goalId.includes('g2') ? 2 : 3),
                    title: goalData.title,
                    tasks: taskIds.map(id => ({ taskId: id, title: '', completed: false })),
                    completed: false
                });
            }
            
            console.log(`Journey Service: Created ${currentWeek.goals.length} WeeklyGoals for first 3 days`);
            
        } catch (error) {
            throw new Error(`Failed to initialize 21-day journey: ${error.message}`);
        }
    }

    /**
     * Initialize next sprint with AI personalization
     */
    async initializeNextSprintWithAI(journey, sprintAnalysis) {
        const { getStartOfWeek } = require('../utils/date');
        const nextSprint = journey.getCurrentSprint();
        if (nextSprint) {
            nextSprint.status = 'active';
            nextSprint.startDate = new Date();
            
            // Generate personalized goals using AI
            let sprintGoals;
            try {
                const aiResult = await sprintAIService.generateNextSprint(
                    journey.user,
                    nextSprint.sprintNumber - 1, // Previous sprint number
                    sprintAnalysis,
                    journey.dreamText
                );
                sprintGoals = aiResult.goals;
                console.log('AI-generated sprint goals:', aiResult.personalization);
            } catch (aiError) {
                console.log('AI generation failed, using template:', aiError.message);
                sprintGoals = await this.createSprintGoals(nextSprint.sprintNumber, journey.dreamText, new Date());
            }
            
            // Create actual goals and tasks
            for (const goalData of sprintGoals) {
                const goal = new WeeklyGoal({
                    user: journey.user,
                    title: goalData.title,
                    weekOf: getStartOfWeek(new Date())
                });

                await goal.save();

                const goalTasks = [];
                for (const taskData of goalData.tasks) {
                    const task = new Task({
                        user: journey.user,
                        goal: goal._id,
                        name: taskData.name,
                        estTime: taskData.estTime,
                        day: taskData.day,
                        completed: false,
                        repeatType: 'none'
                    });

                    await task.save();
                    goalTasks.push({
                        taskId: task._id,
                        title: task.name,
                        completed: false
                    });
                }

                nextSprint.goals.push({
                    goalId: goal._id,
                    day: goalData.day,
                    title: goalData.title,
                    tasks: goalTasks,
                    completed: false
                });
            }
        }
    }

    /**
     * Initialize next sprint (fallback method)
     */
    async initializeNextSprint(journey) {
        const { getStartOfWeek } = require('../utils/date');
        const nextSprint = journey.getCurrentSprint();
        if (nextSprint) {
            nextSprint.status = 'active';
            nextSprint.startDate = new Date();
            
            // For now, create basic goals - this will be enhanced in Chunk 2
            const sprintGoals = await this.createSprintGoals(nextSprint.sprintNumber, journey.dreamText, new Date());
            
            // Create actual goals and tasks (simplified for now)
            for (const goalData of sprintGoals) {
                const goal = new WeeklyGoal({
                    user: journey.user,
                    title: goalData.title,
                    weekOf: getStartOfWeek(new Date())
                });

                await goal.save();

                const goalTasks = [];
                for (const taskData of goalData.tasks) {
                    const task = new Task({
                        user: journey.user,
                        goal: goal._id,
                        name: taskData.name,
                        estTime: taskData.estTime,
                        day: taskData.day,
                        completed: false,
                        repeatType: 'none'
                    });

                    await task.save();
                    goalTasks.push({
                        taskId: task._id,
                        title: task.name,
                        completed: false
                    });
                }

                nextSprint.goals.push({
                    goalId: goal._id,
                    day: goalData.day,
                    title: goalData.title,
                    tasks: goalTasks,
                    completed: false
                });
            }
        }
    }

    /**
     * Create sprint goals based on sprint number (basic version)
     */
    async createSprintGoals(sprintNumber, dreamText, startDate = new Date()) {
        // Get dynamic day names based on when user generates the plan
        const dynamicDays = this.getDynamicDays(startDate);
        
        // This is a simplified version - will be enhanced with AI in Chunk 2
        const sprintTemplates = {
            1: [ // Dream Activation
                {
                    day: 1,
                    title: 'Dream Clarity',
                    tasks: [
                        { name: 'Articulate your dream in 2 clear sentences', estTime: 30, day: dynamicDays.day1 },
                        { name: 'Rate your current confidence (1-10)', estTime: 15, day: dynamicDays.day1 },
                        { name: 'Daily check-in: Commitment level', estTime: 10, day: dynamicDays.day1 }
                    ]
                },
                {
                    day: 2,
                    title: 'Vision Research',
                    tasks: [
                        { name: 'Research 3 companies in your target field', estTime: 45, day: dynamicDays.day2 },
                        { name: 'Identify common requirements', estTime: 30, day: dynamicDays.day2 },
                        { name: 'Daily check-in: Knowledge confidence', estTime: 10, day: dynamicDays.day2 }
                    ]
                },
                {
                    day: 3,
                    title: 'First Milestone',
                    tasks: [
                        { name: 'Define your 3-week milestone', estTime: 30, day: dynamicDays.day3 },
                        { name: 'Create learning roadmap', estTime: 45, day: dynamicDays.day3 },
                        { name: 'Daily check-in: Readiness for Sprint 2', estTime: 10, day: dynamicDays.day3 }
                    ]
                }
            ],
            2: [ // Reality Mapping
                {
                    day: 1,
                    title: 'Current State Assessment',
                    tasks: [
                        { name: 'Complete honest skills assessment', estTime: 45, day: 'Thu' },
                        { name: 'Identify top 3 skill gaps', estTime: 30, day: 'Thu' },
                        { name: 'Daily check-in: Self-awareness level', estTime: 10, day: 'Thu' }
                    ]
                },
                {
                    day: 2,
                    title: 'Learning Style Discovery',
                    tasks: [
                        { name: 'Research different learning resources', estTime: 45, day: 'Fri' },
                        { name: 'Test your preferred learning method', estTime: 30, day: 'Fri' },
                        { name: 'Daily check-in: Learning preference', estTime: 10, day: 'Fri' }
                    ]
                },
                {
                    day: 3,
                    title: 'Support System Mapping',
                    tasks: [
                        { name: 'Identify people who can support your journey', estTime: 30, day: 'Sat' },
                        { name: 'Assess your network strength', estTime: 30, day: 'Sat' },
                        { name: 'Daily check-in: Support system confidence', estTime: 10, day: 'Sat' }
                    ]
                }
            ]
            // More sprints will be added
        };

        return sprintTemplates[sprintNumber] || [];
    }

    /**
     * Get next unlock information
     */
    getNextUnlock(journey) {
        if (journey.canProgressToNextSprint()) {
            return {
                type: 'sprint',
                sprintNumber: journey.currentSprint + 1,
                canUnlock: true
            };
        }

        const currentSprint = journey.getCurrentSprint();
        const incompleteTasks = currentSprint.goals.reduce((acc, goal) => {
            return acc + goal.tasks.filter(task => !task.completed).length;
        }, 0);

        return {
            type: 'tasks',
            remainingTasks: incompleteTasks,
            canUnlock: false
        };
    }


    /**
     * Get dynamic weekday names for the first three days of a sprint
     *
     * Previously this method returned numeric journey days which caused
     * validation errors when creating `Task` documents. The `Task` schema
     * expects the `day` field to be one of the weekday strings (Mon, Tue,
     * ...).  This method now calculates those weekday strings based on the
     * provided start date.
     */
    getDynamicDays(startDate = new Date()) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const startIndex = startDate.getDay();
        return {
            day1: dayNames[startIndex % 7],
            day2: dayNames[(startIndex + 1) % 7],
            day3: dayNames[(startIndex + 2) % 7]
        };
    }
}

module.exports = new JourneyService();