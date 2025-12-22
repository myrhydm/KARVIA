/**
 * server/routes/dreams.js
 * API routes for user dream management and 21-day plan generation
 */

const express = require('express');
const router = express.Router();
const UserDream = require('../models/UserDream');
const WeeklyGoal = require('../models/WeeklyGoal');
const Task = require('../models/Task');
const DreamDiscovery = require('../models/DreamDiscovery');
const authMiddleware = require('../middleware/auth');
const DiscoveryTaskGenerator = require('../services/DiscoveryTaskGenerator');
const { DREAM_ARCHETYPES, ARCHETYPE_SCHEMAS, ARCHETYPE_PATTERNS } = require('../config/dreamLanguage');
const DreamMetadataExtractor = require('../utils/dreamMetadataExtractor');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/dreams/create
 * Create a new user dream
 */
router.post('/create', async (req, res) => {
    try {
        const { dreamText, confidence, timeHorizon, learningStyle, timeCommitment, archetypeType } = req.body;
        
        // Validation
        if (!dreamText || !confidence || !timeHorizon || !learningStyle || !timeCommitment) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required: dreamText, confidence, timeHorizon, learningStyle, timeCommitment'
            });
        }

        // Parse archetype data from dreamText using simple regex patterns
        const archetypeData = parseArchetypeFields(dreamText, archetypeType);
        
        // Extract metadata using DreamMetadataExtractor
        const metadataExtractor = new DreamMetadataExtractor();
        const extractedMetadata = metadataExtractor.extractMetadata(dreamText);
        
        console.log('🔍 Extracted metadata from dream text:', extractedMetadata);
        
        // Merge extracted metadata into archetype data
        archetypeData.targetRole = extractedMetadata.targetRole;
        archetypeData.domain = extractedMetadata.domain; 
        archetypeData.currentRole = extractedMetadata.currentRole;
        archetypeData.location = extractedMetadata.location;
        archetypeData.motivation = extractedMetadata.motivation;
        
        // Update parsing accuracy if metadata was extracted
        if (extractedMetadata.confidence > 0) {
            archetypeData.parsingAccuracy = Math.max(archetypeData.parsingAccuracy || 0, extractedMetadata.confidence);
        }

        // Create new dream
        const dream = new UserDream({
            user: req.user.id,
            dreamText,
            confidence,
            timeHorizon,
            learningStyle,
            timeCommitment,
            archetypeData
        });

        await dream.save();

        res.status(201).json({
            success: true,
            message: 'Dream created successfully',
            data: {
                dreamId: dream._id,
                dreamText: dream.dreamText,
                status: dream.status
            }
        });

    } catch (error) {
        console.error('Error creating dream:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create dream'
        });
    }
});

/**
 * POST /api/dreams/:dreamId/generate-discovery-plan
 * Generate 21-day discovery activities for a dream
 */
router.post('/:dreamId/generate-discovery-plan', async (req, res) => {
    try {
        const { dreamId } = req.params;
        
        // Find the dream
        const dream = await UserDream.findOne({ _id: dreamId, user: req.user.id });
        if (!dream) {
            return res.status(404).json({
                success: false,
                error: 'Dream not found'
            });
        }

        // Check if discovery plan already generated
        if (dream.planGenerated) {
            return res.status(400).json({
                success: false,
                error: 'Discovery plan already generated for this dream'
            });
        }

        console.log('🧠 Starting discovery plan generation for dream:', dream.dreamText.substring(0, 50) + '...');
        
        // Generate discovery plan
        const discoveryPlan = await DiscoveryTaskGenerator.generateDiscoveryPlan(dream);
        
        // Convert to Goals page format and create goals
        const createdGoals = await DiscoveryTaskGenerator.convertToGoalsFormat(
            discoveryPlan, 
            req.user.id, 
            dreamId
        );
        
        // Update dream with plan generated flag and goal IDs
        dream.planGenerated = true;
        dream.planGeneratedAt = new Date();
        dream.journeyStartDate = new Date();
        dream.goalIds = createdGoals.map(goal => goal._id);
        await dream.save();
        
        console.log('✅ Discovery plan generated and posted to Goals page');
        
        res.json({
            success: true,
            message: 'Discovery plan generated successfully',
            data: {
                dreamId: dream._id,
                goalsCreated: createdGoals.length,
                totalActivities: discoveryPlan.weeks.reduce((total, week) => total + week.activities.length, 0),
                journeyStartDate: dream.journeyStartDate,
                discoveryPlan: {
                    weeks: discoveryPlan.weeks.map(week => ({
                        week: week.week,
                        theme: week.theme,
                        activitiesCount: week.activities.length
                    }))
                }
            }
        });
        
    } catch (error) {
        console.error('Error generating discovery plan:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate discovery plan'
        });
    }
});

/**
 * POST /api/dreams/:dreamId/generate-plan
 * Generate 21-day plan for a dream using LLM
 */
router.post('/:dreamId/generate-plan', async (req, res) => {
    try {
        const { dreamId } = req.params;
        
        // Find the dream
        const dream = await UserDream.findOne({ _id: dreamId, user: req.user.id });
        if (!dream) {
            return res.status(404).json({
                success: false,
                error: 'Dream not found'
            });
        }

        if (dream.planGenerated) {
            console.log('⚠️  Plan already exists for this dream - regenerating with fresh data');
            
            // Clean up existing goals and tasks
            if (dream.goalIds && dream.goalIds.length > 0) {
                console.log('🧹 Cleaning up existing goals and tasks...');
                const WeeklyGoal = require('../models/WeeklyGoal');
                const Task = require('../models/Task');
                
                // Delete tasks associated with these goals
                await Task.deleteMany({ goal: { $in: dream.goalIds } });
                
                // Delete the goals themselves
                await WeeklyGoal.deleteMany({ _id: { $in: dream.goalIds } });
                
                console.log(`🧹 Deleted ${dream.goalIds.length} goals and their tasks`);
            }
            
            // Reset plan status to allow regeneration
            dream.planGenerated = false;
            dream.planGeneratedAt = null;
            dream.goalIds = [];
            await dream.save();
        }

        // Generate plan using LLM (we'll implement this next)
        console.log('🚀 Starting plan generation for dream:', dream.dreamText);
        console.log('📊 Dream data being sent to LLM:', {
            dreamText: dream.dreamText,
            confidence: dream.confidence,
            timeHorizon: dream.timeHorizon,
            learningStyle: dream.learningStyle,
            timeCommitment: dream.timeCommitment
        });
        let { plan: planData, provider, model } = await generateDreamPlan(dream);
        console.log('✅ Plan generated successfully:', planData ? 'Success' : 'Failed');
        console.log('🔍 Plan generation method/provider:', provider, model);
        console.log('📋 Raw planData structure:', {
            hasGoals: !!planData?.goals,
            goalsIsArray: Array.isArray(planData?.goals),
            goalsLength: planData?.goals?.length || 0,
            hasWeeks: !!planData?.weeks,
            weeksIsArray: Array.isArray(planData?.weeks),
            weeksLength: planData?.weeks?.length || 0,
            weeksValue: planData?.weeks
        });
        
        // Log detailed plan structure
        if (planData?.goals) {
            console.log('📋 Goals details:', planData.goals.map(g => ({ title: g.title, description: g.description })));
        }
        if (planData?.weeks) {
            console.log('📋 Weeks details:', planData.weeks.map(w => ({ 
                week: w.week, 
                theme: w.theme, 
                taskCount: w.tasks?.length || 0,
                tasks: w.tasks?.map(t => ({ title: t.title, day: t.day })) || []
            })));
        }

        // Validate plan data structure - handle both old format and new journey format
        if (!planData) {
            throw new Error('No plan data received');
        }
        
        // Check for new scalable format (AI-generated) or old format (template fallback)
        const hasScalableFormat = planData.goals && planData.weeks && Array.isArray(planData.goals) && Array.isArray(planData.weeks);
        const hasOldFormat = planData.goals && Array.isArray(planData.goals) && !planData.weeks;
        
        if (!hasScalableFormat && !hasOldFormat) {
            console.error('Invalid plan structure received:', JSON.stringify(planData, null, 2));
            throw new Error('Invalid plan data structure - missing goals or weeks');
        }
        
        console.log('📋 Plan format detected:', hasScalableFormat ? 'Scalable (AI)' : 'Goals (Template)');
        
        // Convert old format to new format if needed
        if (hasOldFormat) {
            console.log('🔄 Converting old format to new format...');
            planData = convertOldFormatToNewFormat(planData);
        }
        
        // Create goals and tasks using existing goal creation engine
        console.log('🎯 Creating goals from plan...');
        
        let goalIds;
        try {
            goalIds = await createGoalsFromPlan(req.user.id, planData, dream);
            console.log('✅ Goals created:', goalIds.length, 'goals');
        } catch (planError) {
            console.error('❌ Error creating goals from plan:', planError.message);
            console.error('❌ Plan data that caused error:', JSON.stringify(planData, null, 2));
            console.error('❌ Full error stack:', planError.stack);
            
            // If it's a validation or structure issue, try to create a fallback plan
            if (planError.message.includes('weeks must be an array') || 
                planError.message.includes('validation failed') ||
                planError.message.includes('required') ||
                planError.message.includes('Task validation')) {
                console.log('🔧 Attempting to create fallback plan structure...');
                
                // Create a comprehensive fallback structure based on dream timeHorizon
                const fallbackWeeks = Math.min(Math.max(parseInt(dream.timeHorizon) || 6, 2), 8); // 2-8 weeks
                console.log(`🔧 Creating ${fallbackWeeks}-week fallback plan`);
                
                const fallbackPlan = {
                    goals: planData.goals || [
                        {
                            title: "Getting Started",
                            description: "Initial steps towards your dream",
                            rationale: "Building a foundation is essential for any journey",
                            metricsImpacted: ["commitment", "clarity"]
                        },
                        {
                            title: "Skill Development", 
                            description: "Learning and growing the skills you need",
                            rationale: "Competency development accelerates progress",
                            metricsImpacted: ["competency", "growth_readiness"]
                        }
                    ],
                    weeks: []
                };
                
                // Generate fallback weeks
                for (let weekNum = 1; weekNum <= fallbackWeeks; weekNum++) {
                    const week = {
                        week: weekNum,
                        theme: weekNum === 1 ? "Foundation" : weekNum <= 3 ? "Exploration" : "Development",
                        focus: weekNum === 1 ? "Getting started and building momentum" : 
                               weekNum <= 3 ? "Understanding your path forward" : 
                               "Building skills and taking action",
                        tasks: [
                            {
                                goalIndex: 0,
                                title: weekNum === 1 ? "Start working on your dream" : `Week ${weekNum} progress check`,
                                rationale: weekNum === 1 ? "Begin taking action towards your goal" : 
                                          `Regular progress reviews help maintain momentum and adjust course`,
                                estTime: 30,
                                day: weekNum === 1 ? "Mon" : "Tue",
                                difficultyLevel: "beginner",
                                skillCategory: weekNum === 1 ? "planning" : "self_assessment",
                                metricsImpacted: [
                                    {
                                        metric: "commitment",
                                        expectedImpact: "medium",
                                        reasoning: weekNum === 1 ? "Taking the first step builds commitment" : 
                                                  "Regular review maintains commitment"
                                    }
                                ]
                            }
                        ]
                    };
                    
                    // Add a second task for weeks 2+
                    if (weekNum > 1) {
                        week.tasks.push({
                            goalIndex: 1,
                            title: `Learn something new related to your dream`,
                            rationale: "Continuous learning builds competency and confidence",
                            estTime: 45,
                            day: "Thu",
                            difficultyLevel: "beginner",
                            skillCategory: "skill_development",
                            metricsImpacted: [
                                {
                                    metric: "competency",
                                    expectedImpact: "medium",
                                    reasoning: "Learning new skills directly improves competency"
                                }
                            ]
                        });
                    }
                    
                    fallbackPlan.weeks.push(week);
                }
                
                goalIds = await createGoalsFromPlan(req.user.id, fallbackPlan, dream);
                console.log('✅ Fallback goals created:', goalIds.length, 'goals');
            } else {
                throw planError; // Re-throw if it's a different error
            }
        }
        
        // Save discovery data for enhanced journey visualization
        console.log('💾 Saving discovery data...');
        await saveDreamDiscoveryData(req.user.id, dreamId, planData, goalIds);
        console.log('✅ Discovery data saved');
        
        // Update dream with generated goal IDs
        dream.goalIds = goalIds;
        dream.planGenerated = true;
        dream.planGeneratedAt = new Date();
        dream.journeyStartDate = new Date();
        dream.currentDay = 1; // reset progress when plan is generated
        
        // Force save and reload to ensure currentDay is definitely set to 1
        await dream.save();
        const savedDream = await UserDream.findById(dream._id);
        
        // Double-check and force currentDay to 1 if it's not
        if (savedDream.currentDay !== 1) {
            console.log(`🔧 Forcing currentDay from ${savedDream.currentDay} to 1`);
            savedDream.currentDay = 1;
            await savedDream.save();
            dream.currentDay = 1; // Update local reference too
        }

        console.log('🎯 Journey created with currentDay:', dream.currentDay);
        console.log('📅 Journey start date:', dream.journeyStartDate);

        res.json({
            success: true,
            message: 'Plan generated successfully',
            data: {
                dreamId: dream._id,
                goalIds: goalIds,
                totalGoals: goalIds.length,
                journeyStartDate: dream.journeyStartDate,
                currentDay: dream.currentDay,
                provider,
                model
            }
        });

    } catch (error) {
        console.error('Error generating plan:', error);
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Failed to generate plan',
            details: error.message
        });
    }
});

/**
 * GET /api/dreams/active
 * Get all active dreams for the user
 */
router.get('/active', async (req, res) => {
    try {
        const dreams = await UserDream.findActiveDreams(req.user.id)
            .populate('goalIds')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: dreams
        });

    } catch (error) {
        console.error('Error fetching active dreams:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dreams'
        });
    }
});

/**
 * GET /api/dreams/:dreamId/goals
 * Get all goals for a specific dream
 */
router.get('/:dreamId/goals', async (req, res) => {
    try {
        const { dreamId } = req.params;
        
        const dream = await UserDream.findOne({ _id: dreamId, user: req.user.id })
            .populate({
                path: 'goalIds',
                populate: {
                    path: 'tasks'
                }
            });

        if (!dream) {
            return res.status(404).json({
                success: false,
                error: 'Dream not found'
            });
        }

        res.json({
            success: true,
            data: {
                dream: {
                    id: dream._id,
                    dreamText: dream.dreamText,
                    status: dream.status,
                    currentDay: dream.currentDay
                },
                goals: dream.goalIds
            }
        });

    } catch (error) {
        console.error('Error fetching dream goals:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dream goals'
        });
    }
});

/**
 * GET /api/dreams/:dreamId/discovery
 * Get DreamDiscovery data for enhanced visualization
 */
router.get('/:dreamId/discovery', async (req, res) => {
    try {
        const { dreamId } = req.params;
        
        const discoveryData = await DreamDiscovery.findOne({ 
            user: req.user.id, 
            dreamId: dreamId 
        });
        
        if (!discoveryData) {
            return res.status(404).json({
                success: false,
                error: 'Discovery data not found'
            });
        }
        
        res.json({
            success: true,
            data: discoveryData
        });
        
    } catch (error) {
        console.error('Error fetching discovery data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch discovery data'
        });
    }
});

/**
 * Helper function to generate dream plan using Planner Engine
 */
async function generateDreamPlan(dream) {
    const plannerEngine = require('../engines/planner/index');
    
    try {
        console.log('🧠 Generating 21-day plan using Planner Engine for dream:', dream.dreamText);
        
        // Prepare input for Planner Engine with start day awareness
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const startDayName = dayNames[today.getDay()];
        
        // Calculate available days for Week 1 (remaining days including Sunday)
        const todayIndex = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        let availableDays;
        if (todayIndex === 0) {
            // Sunday - all days available for the week
            availableDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        } else {
            // Other days - remaining days of current week + Sunday of next week
            const remainingThisWeek = dayNames.slice(todayIndex);
            availableDays = [...remainingThisWeek, 'Sun'];
        }
        
        const plannerInput = {
            dreamText: dream.dreamText,
            confidence: dream.confidence,
            timeHorizon: dream.timeHorizon,
            careerPath: 'employee', // Default, could be extracted from dream or user profile
            timeCommitment: dream.timeCommitment,
            learningStyle: dream.learningStyle,
            startDate: today,
            startDay: startDayName, // Add start day for Week 1 awareness
            availableDaysWeek1: availableDays, // Days available in Week 1
            
            // Include archetype metadata for personalized planning
            archetypeData: dream.archetypeData || {},
            
            // Extract key metadata for easy access
            targetRole: dream.archetypeData?.targetRole || '',
            domain: dream.archetypeData?.domain || '',
            currentRole: dream.archetypeData?.currentRole || '',
            location: dream.archetypeData?.location || '',
            motivation: dream.archetypeData?.motivation || ''
        };
        
        console.log(`🗓️  Journey starts on: ${startDayName} (${today.toDateString()})`);
        console.log(`📋 Available days for Week 1: ${plannerInput.availableDaysWeek1.join(', ')}`);
        
        // Generate plan using Planner Engine (includes RAG + LLM)
        const planResult = await plannerEngine.generatePlan(plannerInput);
        
        console.log('✅ Plan generated with method:', planResult.method, 'provider:', planResult.provider);
        console.log('📋 Plan result structure:', {
            hasMethod: !!planResult.method,
            hasProvider: !!planResult.provider,
            hasPlan: !!planResult.plan,
            hasGoals: !!planResult.goals,
            hasAiProviderInfo: !!planResult.aiProviderInfo,
            planKeys: planResult.plan ? Object.keys(planResult.plan) : 'no plan'
        });
        
        // Handle both AI-generated and template fallback plans
        if (planResult.plan && planResult.method !== 'template') {
            // AI-generated plan with goals/weeks structure (including legacy and enhanced Observer Engine plans)
            return {
                plan: planResult.plan,
                provider: planResult.provider,
                model: planResult.model,
                method: planResult.method,
                ragContextUsed: planResult.ragContextUsed,
                aiProviderInfo: planResult.aiProviderInfo,
                weeklyAnalysis: planResult.weeklyAnalysis,
                templateMetadata: planResult.templateMetadata
            };
        } else if (planResult.goals) {
            // Template fallback plan
            return {
                plan: { goals: planResult.goals },
                provider: planResult.provider || 'template',
                model: planResult.model || 'fallback',
                method: planResult.method
            };
        } else {
            throw new Error('Invalid plan structure from Planner Engine');
        }
        
    } catch (error) {
        console.error('Planner Engine error:', error);
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
        
        // Final fallback to local template generation
        console.log('🔄 Using local fallback plan generation...');
        return {
            plan: generateFallbackPlan(dream),
            provider: 'local-fallback',
            model: 'template',
            method: 'fallback'
        };
    }
}


/**
 * Generate fallback plan if LLM fails
 */
function generateFallbackPlan(dream) {
    const isStartup = dream.dreamText.toLowerCase().includes('startup') || dream.dreamText.toLowerCase().includes('launch');
    
    if (isStartup) {
        return {
            goals: [
                {
                    title: "Market Research",
                    description: "Understand your target market and competition"
                },
                {
                    title: "Problem Validation",
                    description: "Validate the problem you're solving"
                },
                {
                    title: "MVP Planning",
                    description: "Plan your minimum viable product"
                },
                {
                    title: "Go-to-Market Strategy",
                    description: "Plan your market entry strategy"
                },
                {
                    title: "Launch Preparation",
                    description: "Prepare for your product launch"
                }
            ],
            weeks: [
                {
                    week: 1,
                    theme: "Foundation & Research",
                    tasks: [
                        { goalIndex: 0, title: "Survey 10 potential users", estTime: 60, day: "Mon" },
                        { goalIndex: 1, title: "Define core problem", estTime: 30, day: "Tue" },
                        { goalIndex: 0, title: "Research 3 competitors", estTime: 45, day: "Wed" },
                        { goalIndex: 1, title: "Interview 5 potential users", estTime: 90, day: "Thu" }
                    ]
                },
                {
                    week: 2,
                    theme: "Solution Development",
                    tasks: [
                        { goalIndex: 0, title: "Document market insights", estTime: 30, day: "Mon" },
                        { goalIndex: 2, title: "Define core features", estTime: 60, day: "Tue" },
                        { goalIndex: 1, title: "Analyze problem urgency", estTime: 45, day: "Wed" },
                        { goalIndex: 2, title: "Create feature priority list", estTime: 45, day: "Thu" }
                    ]
                },
                {
                    week: 3,
                    theme: "Launch Preparation",
                    tasks: [
                        { goalIndex: 2, title: "Design user flow", estTime: 90, day: "Mon" },
                        { goalIndex: 3, title: "Define target segments", estTime: 60, day: "Tue" },
                        { goalIndex: 3, title: "Plan marketing channels", estTime: 45, day: "Wed" },
                        { goalIndex: 4, title: "Prepare pitch materials", estTime: 90, day: "Thu" }
                    ]
                }
            ]
        };
    }
    
    // Default fallback for other dreams
    return {
        goals: [
            {
                title: "Skill Assessment",
                description: "Evaluate current skills and identify gaps"
            },
            {
                title: "Research & Planning",
                description: "Gather information and create a roadmap"
            },
            {
                title: "Network Building",
                description: "Connect with people who can help your journey"
            },
            {
                title: "Skill Development",
                description: "Build foundational skills for your dream"
            },
            {
                title: "Portfolio Creation",
                description: "Create evidence of your capabilities"
            }
        ],
        weeks: [
            {
                week: 1,
                theme: "Foundation",
                tasks: [
                    { goalIndex: 0, title: "List current skills", estTime: 30, day: "Mon" },
                    { goalIndex: 1, title: "Research 3 successful people in your field", estTime: 45, day: "Tue" },
                    { goalIndex: 2, title: "Join one online community related to your dream", estTime: 45, day: "Wed" },
                    { goalIndex: 3, title: "Find one free online course or tutorial", estTime: 30, day: "Thu" }
                ]
            },
            {
                week: 2,
                theme: "Development",
                tasks: [
                    { goalIndex: 0, title: "Research required skills", estTime: 60, day: "Mon" },
                    { goalIndex: 1, title: "Write down your specific 30-day goal", estTime: 30, day: "Tue" },
                    { goalIndex: 2, title: "Introduce yourself to 3 new people online", estTime: 30, day: "Wed" },
                    { goalIndex: 3, title: "Practice one new skill for 30 minutes", estTime: 60, day: "Thu" }
                ]
            },
            {
                week: 3,
                theme: "Application",
                tasks: [
                    { goalIndex: 0, title: "Identify skill gaps", estTime: 45, day: "Mon" },
                    { goalIndex: 1, title: "Create a daily action checklist", estTime: 60, day: "Tue" },
                    { goalIndex: 2, title: "Share one piece of valuable content", estTime: 60, day: "Wed" },
                    { goalIndex: 4, title: "Start portfolio project", estTime: 90, day: "Thu" }
                ]
            }
        ]
    };
}

/**
 * Convert old format (goals only) to new format (goals + weeks)
 */
function convertOldFormatToNewFormat(planData) {
    console.log('🔄 Converting old format plan with', planData.goals.length, 'goals');
    
    // Map day numbers to day names (consistent with main dayNames array)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Create weeks with tasks generated from goal structure
    const weeks = [];
    const goalsPerWeek = Math.ceil(planData.goals.length / 3);
    
    for (let weekNum = 1; weekNum <= 3; weekNum++) {
        const weekTasks = [];
        const startGoalIndex = (weekNum - 1) * goalsPerWeek;
        const endGoalIndex = Math.min(startGoalIndex + goalsPerWeek, planData.goals.length);
        
        // Process goals for this week
        for (let goalIndex = startGoalIndex; goalIndex < endGoalIndex; goalIndex++) {
            const goal = planData.goals[goalIndex];
            
            // Handle both old format (goals with tasks inside) and planner template format (goals without tasks)
            if (goal.tasks && Array.isArray(goal.tasks)) {
                // Old format: goals have tasks inside them
                goal.tasks.forEach((task, taskIndex) => {
                    weekTasks.push({
                        goalIndex: goalIndex,
                        title: task.name,
                        estTime: task.estTime || 30,
                        day: dayNames[task.day - 1] || dayNames[taskIndex % 7],
                        rationale: task.rationale || 'This task contributes to your dream journey',
                        skillCategory: task.skillCategory || 'general',
                        difficultyLevel: task.difficultyLevel || 'beginner'
                    });
                });
            } else {
                // Planner template format: goals without tasks - generate only 1 task per goal per week
                const taskIndex = weekTasks.length;
                weekTasks.push({
                    goalIndex: goalIndex,
                    title: `Focus on ${goal.title}`,
                    estTime: 60,
                    day: dayNames[taskIndex % 7],
                    rationale: goal.description || `Work on ${goal.title} to advance your dream`,
                    skillCategory: 'general',
                    difficultyLevel: 'beginner'
                });
            }
        }
        
        weeks.push({
            week: weekNum,
            theme: `Week ${weekNum} Goals`,
            tasks: weekTasks
        });
    }
    
    const convertedData = {
        goals: planData.goals,
        weeks: weeks
    };
    
    console.log('✅ Converted to new format:', convertedData.weeks.length, 'weeks with', 
        convertedData.weeks.reduce((sum, week) => sum + week.tasks.length, 0), 'total tasks');
    
    return convertedData;
}

/**
 * Helper function to create goals and tasks using existing system
 */
async function createGoalsFromPlan(userId, planData, dreamContext = {}) {
    const WeeklyGoal = require('../models/WeeklyGoal');
    const Task = require('../models/Task');
    const goalIds = [];
    
    console.log('Creating goals from plan data:', JSON.stringify(planData, null, 2));
    
    // Validate that weeks is an array
    if (!planData.weeks || !Array.isArray(planData.weeks)) {
        console.error('planData.weeks is not a valid array:', planData.weeks);
        throw new Error('Invalid plan data: weeks must be an array');
    }
    
    // Process each week
    for (const week of planData.weeks) {
        console.log(`Processing week ${week.week}: ${week.theme}`);
        
        // Calculate week start date - flexible based on generation day
        const today = new Date();
        const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        let weekStartDate;
        if (week.week === 1) {
            // Week 1 starts from today (whatever day it is)
            weekStartDate = new Date(today);
            console.log(`📅 Week 1 starts TODAY (${weekStartDate.toDateString()}) - flexible start`);
        } else {
            // Subsequent weeks start on Monday
            // Calculate the Monday after today for Week 2, then add weeks
            let daysToNextMonday;
            if (currentDayOfWeek === 1) { // Today is Monday
                daysToNextMonday = 7; // Next Monday
            } else if (currentDayOfWeek === 0) { // Today is Sunday
                daysToNextMonday = 1; 
            } else { // Tuesday through Saturday
                daysToNextMonday = 8 - currentDayOfWeek;
            }
            
            const firstFullWeekMonday = new Date(today);
            firstFullWeekMonday.setDate(today.getDate() + daysToNextMonday);
            
            // Week 2 starts on that Monday, Week 3 is +7 days, etc.
            weekStartDate = new Date(firstFullWeekMonday);
            weekStartDate.setDate(firstFullWeekMonday.getDate() + ((week.week - 2) * 7));
            console.log(`📅 Week ${week.week} starts on:`, weekStartDate.toDateString());
        }
        
        // Group tasks by goal for this week (Planner Engine now handles Week 1 day filtering)
        const goalTaskMap = {};
        
        // Initialize goals for this week
        planData.goals.forEach((goal, index) => {
            goalTaskMap[index] = {
                goal: goal,
                tasks: []
            };
        });
        
        // Group tasks by goalIndex (no filtering needed - Planner Engine is now smart)
        week.tasks.forEach(task => {
            if (goalTaskMap[task.goalIndex]) {
                goalTaskMap[task.goalIndex].tasks.push(task);
            }
        });
        
        // Create goals and tasks
        for (const [goalIndex, goalData] of Object.entries(goalTaskMap)) {
            if (goalData.tasks.length > 0) {
                // Create weekly goal
                const goal = new WeeklyGoal({
                    user: userId,
                    title: `${goalData.goal.title} - Week ${week.week}`,
                    description: goalData.goal.description,
                    weekOf: weekStartDate,
                    category: 'journey',
                    journeyWeek: week.week,
                    journeyTheme: week.theme
                });
                
                await goal.save();
                goalIds.push(goal._id);
                
                console.log(`Created goal: ${goal.title}`);
                
                // Create tasks for this goal
                const taskIds = [];
                for (const taskData of goalData.tasks) {
                    // Post-processing filter: Prevent past-day task creation
                    const today = new Date();
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const todayIndex = today.getDay();
                    const originalDay = taskData.day || 'Monday';
                    const taskDayIndex = dayNames.indexOf(originalDay);
                    
                    // Only consider it a past day if it's not Sunday (Sunday can be next week)
                    const isPastDay = taskDayIndex !== -1 && taskDayIndex < todayIndex && originalDay !== 'Sun';
                    
                    let finalDay = originalDay;
                    if (isPastDay) {
                        const taskTitle = typeof taskData.title === 'object' ? taskData.title.activity : taskData.title;
                        console.warn(`⚠️ Journey task "${taskTitle}" scheduled for past day ${originalDay}, reassigning to today`);
                        finalDay = dayNames[todayIndex]; // Reassign to today
                    }
                    
                    // Handle different task data formats from AI responses
                    let taskName, taskEstTime;
                    
                    if (typeof taskData.title === 'object' && taskData.title.activity) {
                        // Handle AI format where title is an object: { title: { activity: "...", description: "..." } }
                        console.log(`⚠️ Journey task title is object: ${JSON.stringify(taskData.title)}, extracting activity`);
                        taskName = taskData.title.activity;
                        taskEstTime = taskData.estTime || 30;
                    } else if (typeof taskData === 'object' && taskData.activity) {
                        // Handle AI format: { activity: "...", duration: "...", description: "..." }
                        console.log(`⚠️ Journey task "${JSON.stringify(taskData)}" scheduled for past day ${originalDay}, reassigning to today`);
                        taskName = taskData.activity;
                        taskEstTime = parseInt(taskData.duration) || 30;
                    } else {
                        // Handle normal format: { title: "...", estTime: 30, ... }
                        taskName = taskData.title || taskData.name;
                        taskEstTime = taskData.estTime || 30;
                    }
                    
                    if (!taskName) {
                        console.error(`❌ Task name is missing for task:`, taskData);
                        continue; // Skip this task
                    }
                    
                    const task = new Task({
                        user: userId,
                        goal: goal._id,
                        name: taskName,
                        estTime: taskEstTime,
                        day: finalDay,
                        status: 'pending',
                        // Required enhanced fields
                        rationale: taskData.rationale || 'This task contributes to your journey towards your dream',
                        skillCategory: taskData.skillCategory || 'general',
                        difficultyLevel: taskData.difficultyLevel || 'beginner',
                        metricsImpacted: taskData.metricsImpacted || [
                            {
                                metric: 'commitment',
                                expectedImpact: 'medium',
                                reasoning: 'Taking action builds commitment to your goals'
                            }
                        ],
                        adaptiveMetadata: {
                            generationMethod: 'ai_generated',
                            timeCommitmentStyle: dreamContext.timeCommitment || 'focused-blocks',
                            confidenceLevel: parseInt(dreamContext.confidence) || 50,
                            archetypeContext: taskData.archetypeContext || 'general'
                        },
                        goalIndex: taskData.goalIndex || 0,
                        weekNumber: week.week || 1
                    });
                    
                    await task.save();
                    taskIds.push(task._id);
                    console.log(`  Created task: ${task.name}`);
                }
                
                
                // Update goal with task IDs
                goal.tasks = taskIds;
                await goal.save();
            }
        }

        // Add reflection task on last day of week (only once per week)
        if (week.week <= 3) { // Only for weeks 1-3
            const reflectionTask = new Task({
                user: userId,
                goal: null,
                name: `Week ${week.week} Reflection: Review progress and insights`,
                estTime: 30,
                day: 'Sun',
                status: 'pending',
                isReflection: true,
                // Required enhanced fields for reflection tasks
                rationale: `Reflecting on your progress helps consolidate learning and plan improvements for future weeks`,
                skillCategory: 'self_assessment',
                difficultyLevel: 'beginner',
                metricsImpacted: [
                    {
                        metric: 'clarity',
                        expectedImpact: 'high',
                        reasoning: 'Reflection clarifies what worked and what needs adjustment'
                    },
                    {
                        metric: 'commitment',
                        expectedImpact: 'medium',
                        reasoning: 'Taking time to reflect reinforces commitment to your journey'
                    }
                ],
                adaptiveMetadata: {
                    generationMethod: 'ai_generated',
                    timeCommitmentStyle: dreamContext.timeCommitment || 'focused-blocks',
                    confidenceLevel: parseInt(dreamContext.confidence) || 50,
                    archetypeContext: 'general'
                },
                goalIndex: null,
                weekNumber: week.week
            });

            await reflectionTask.save();
            console.log(`  Created reflection task for week ${week.week}`);
        }
    }
    
    return goalIds;
}

/**
 * Save DreamDiscovery data for enhanced journey visualization
 */
async function saveDreamDiscoveryData(userId, dreamId, planData, goalIds) {
    try {
        console.log('📊 Plan data structure:', JSON.stringify(planData, null, 2));
        console.log('📊 Goal IDs:', goalIds);
        
        // Extract week themes dynamically
        const weekThemes = planData.weeks && Array.isArray(planData.weeks) ? 
            planData.weeks.map(week => week.theme || `Week ${planData.weeks.indexOf(week) + 1}`) : 
            ['Week 1', 'Week 2', 'Week 3'];
        
        // Create goal progression mapping
        const goalProgression = {};
        if (planData.weeks && Array.isArray(planData.weeks)) {
            planData.weeks.forEach((week, index) => {
                const weekKey = `week${index + 1}`;
                goalProgression[weekKey] = {
                    focus: week.theme || `Week ${index + 1}`,
                    goalIds: goalIds.slice(index * Math.ceil(goalIds.length / 3), (index + 1) * Math.ceil(goalIds.length / 3))
                };
            });
        } else {
            // Fallback progression
            for (let i = 0; i < 3; i++) {
                const weekKey = `week${i + 1}`;
                goalProgression[weekKey] = {
                    focus: weekThemes[i] || `Week ${i + 1}`,
                    goalIds: goalIds.slice(i * Math.ceil(goalIds.length / 3), (i + 1) * Math.ceil(goalIds.length / 3))
                };
            }
        }
        
        // Extract sub-goals from plan data if available
        const subGoals = new Map();
        if (planData.goals && Array.isArray(planData.goals)) {
            planData.goals.forEach((goal, index) => {
                if (goalIds[index] && goal) {
                    const subGoalList = [];
                    if (goal.milestones && Array.isArray(goal.milestones)) {
                        subGoalList.push(...goal.milestones);
                    } else {
                        // Create default sub-goals based on goal structure
                        const taskCount = (goal.tasks && Array.isArray(goal.tasks)) ? goal.tasks.length : 4;
                        const taskGroups = Math.ceil(taskCount / 3);
                        for (let i = 0; i < taskGroups; i++) {
                            subGoalList.push(`Phase ${i + 1}: ${goal.title || 'Goal'} Progress`);
                        }
                    }
                    subGoals.set(goalIds[index].toString(), subGoalList);
                }
            });
        } else {
            // Fallback: create sub-goals based on number of goals created
            goalIds.forEach((goalId, index) => {
                const subGoalList = [
                    `Phase 1: Getting Started`,
                    `Phase 2: Building Skills`, 
                    `Phase 3: Taking Action`
                ];
                subGoals.set(goalId.toString(), subGoalList);
            });
        }
        
        // Extract habit formation tips
        const habitFormationTips = [];
        if (planData.habitTips) {
            habitFormationTips.push(...planData.habitTips);
        } else {
            // Generate dynamic tips based on user's dream
            habitFormationTips.push(
                "Focus on daily consistency to build momentum",
                "Track your progress to stay motivated",
                "Celebrate each milestone you achieve"
            );
        }
        
        // Create milestones
        const milestones = [];
        if (planData.weeks && Array.isArray(planData.weeks)) {
            planData.weeks.forEach((week, weekIndex) => {
                milestones.push({
                    day: (weekIndex + 1) * 7,
                    title: `Week ${weekIndex + 1} Complete`,
                    description: `Completed ${week.theme || 'Week'} phase`
                });
            });
        } else {
            // Fallback milestones
            weekThemes.forEach((theme, weekIndex) => {
                milestones.push({
                    day: (weekIndex + 1) * 7,
                    title: `Week ${weekIndex + 1} Complete`,
                    description: `Completed ${theme} phase`
                });
            });
        }
        
        // Save to DreamDiscovery collection
        const dreamDiscovery = new DreamDiscovery({
            user: userId,
            dreamId: dreamId,
            weekThemes: weekThemes,
            goalProgression: goalProgression,
            subGoals: subGoals,
            habitFormationTips: habitFormationTips,
            milestones: milestones,
            progressTrackingMetrics: {
                totalGoals: goalIds.length,
                estimatedCompletionDays: 21,
                difficultyLevel: planData.difficultyLevel || 'intermediate'
            }
        });
        
        // Use upsert to replace existing discovery data
        await DreamDiscovery.findOneAndUpdate(
            { user: userId, dreamId: dreamId },
            dreamDiscovery.toObject(),
            { upsert: true, new: true }
        );
        
        console.log('✅ DreamDiscovery data saved successfully');
        
    } catch (error) {
        console.error('❌ Error saving DreamDiscovery data:', error);
        // Don't throw - this is non-critical for plan generation
    }
}

/**
 * PATCH /api/dreams/:dreamId/update-current-day
 * Update the current day for a dream journey
 */
router.patch('/:dreamId/update-current-day', async (req, res) => {
    try {
        const { dreamId } = req.params;
        const { currentDay } = req.body;
        
        if (!currentDay || currentDay < 1 || currentDay > 21) {
            return res.status(400).json({
                success: false,
                error: 'Invalid currentDay value. Must be between 1 and 21.'
            });
        }
        
        const dream = await UserDream.findOne({ _id: dreamId, user: req.user.id });
        if (!dream) {
            return res.status(404).json({
                success: false,
                error: 'Dream not found'
            });
        }
        
        dream.currentDay = currentDay;
        await dream.save();
        
        console.log(`📅 Updated dream ${dreamId} currentDay to ${currentDay}`);
        
        res.json({
            success: true,
            data: { currentDay: dream.currentDay }
        });
        
    } catch (error) {
        console.error('Error updating current day:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update current day'
        });
    }
});

/**
 * GET /api/dreams/:dreamId/discovery-cards
 * Get Self Discovery Stage card data aggregated from all engines
 */
router.get('/:dreamId/discovery-cards', async (req, res) => {
    try {
        const { dreamId } = req.params;
        
        // Find the dream and verify ownership
        const dream = await UserDream.findOne({ _id: dreamId, user: req.user.id });
        if (!dream) {
            return res.status(404).json({
                success: false,
                error: 'Dream not found'
            });
        }

        if (!dream.planGenerated) {
            return res.status(400).json({
                success: false,
                error: 'Plan not generated yet for this dream'
            });
        }

        console.log('🎯 Aggregating Self Discovery Stage card data from all engines...');
        
        // Get data from all engines
        const [
            plannerData,
            trackerData, 
            scoringData,
            discoveryData,
            goalsWithTasks
        ] = await Promise.all([
            getPlannerEngineData(dreamId),
            getTrackerEngineData(req.user.id, dreamId),
            getScoringEngineData(req.user.id),
            getDreamDiscoveryData(dreamId, req.user.id),
            getGoalsWithTasksData(dream.goalIds)
        ]);

        console.log('📊 Data aggregated from all engines, building cards...');
        
        // Build week cards from aggregated engine data
        const weekCards = await buildWeekCardsFromEngineData({
            plannerData,
            trackerData,
            scoringData,
            discoveryData,
            goalsWithTasks,
            dream
        });

        // Calculate overall journey progress from real data
        const overallProgress = calculateOverallJourneyProgress(trackerData, goalsWithTasks);

        res.json({
            success: true,
            data: {
                dreamId: dream._id,
                dreamText: dream.dreamText,
                journeyStartDate: dream.journeyStartDate,
                currentDay: dream.currentDay,
                stage: 'self_discovery',
                weekCards: weekCards,
                overallProgress: overallProgress,
                scoringData: {
                    overallScore: scoringData.stageProfile?.overallScore || 0,
                    achievements: scoringData.stageProfile?.achievements || [],
                    insights: scoringData.stageProfile?.insights || [],
                    recommendations: scoringData.stageProfile?.recommendations || []
                },
                metadata: {
                    generatedAt: new Date(),
                    dataSource: 'all_engines',
                    version: '1.0'
                }
            }
        });

    } catch (error) {
        console.error('Error aggregating discovery cards:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to aggregate discovery card data',
            details: error.message
        });
    }
});

/**
 * GET /api/dreams/:dreamId/week/:weekNumber/card-data  
 * Get detailed card data for a specific week from all engines
 */
router.get('/:dreamId/week/:weekNumber/card-data', async (req, res) => {
    try {
        const { dreamId, weekNumber } = req.params;
        const weekNum = parseInt(weekNumber);
        
        if (!weekNum || weekNum < 1 || weekNum > 12) {
            return res.status(400).json({
                success: false,
                error: 'Invalid week number. Must be between 1 and 12.'
            });
        }

        // Verify dream ownership
        const dream = await UserDream.findOne({ _id: dreamId, user: req.user.id });
        if (!dream) {
            return res.status(404).json({
                success: false,
                error: 'Dream not found'
            });
        }

        console.log(`🔍 Getting detailed week ${weekNum} data from all engines...`);

        // Get week-specific data from all engines
        const [
            weekTrackerData,
            weekScoringData,
            weekGoalsData,
            weekDiscoveryData
        ] = await Promise.all([
            getWeekTrackerData(req.user.id, weekNum, dream.journeyStartDate),
            getWeekScoringData(req.user.id, weekNum),
            getWeekGoalsData(dream.goalIds, weekNum),
            getWeekDiscoveryData(dreamId, req.user.id, weekNum)
        ]);

        // Build detailed week card data
        const weekCardData = await buildDetailedWeekCard({
            weekNumber: weekNum,
            trackerData: weekTrackerData,
            scoringData: weekScoringData,
            goalsData: weekGoalsData,
            discoveryData: weekDiscoveryData,
            dream
        });

        res.json({
            success: true,
            data: weekCardData
        });

    } catch (error) {
        console.error(`Error getting week ${weekNumber} card data:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to get week card data',
            details: error.message
        });
    }
});

/**
 * POST /api/dreams/:dreamId/week/:weekNumber/milestone-check
 * Check and update milestone status for a week
 */
router.post('/:dreamId/week/:weekNumber/milestone-check', async (req, res) => {
    try {
        const { dreamId, weekNumber } = req.params;
        const weekNum = parseInt(weekNumber);

        console.log(`🏆 Checking milestone completion for week ${weekNum}...`);

        // Get current week progress from tracker engine
        const weekProgress = await getWeekTrackerData(req.user.id, weekNum);
        
        // Check milestone criteria (from discovery data)
        const milestoneResult = await checkWeekMilestone(
            req.user.id,
            dreamId, 
            weekNum,
            weekProgress
        );

        if (milestoneResult.achieved) {
            // Trigger scoring engine update for milestone achievement
            const ScoringEngine = require('../engines/scoring_engine');
            const scoringEngine = new ScoringEngine();
            
            await scoringEngine.scheduleScoreUpdate(req.user.id, {
                triggerEvents: [{
                    eventType: 'milestone_achieved',
                    eventData: {
                        milestoneType: `week_${weekNum}_complete`,
                        journeyDay: calculateJourneyDay(weekNum),
                        ...milestoneResult.data
                    }
                }],
                priority: 'high'
            });

            console.log(`✅ Week ${weekNum} milestone achieved!`);
        }

        res.json({
            success: true,
            data: milestoneResult
        });

    } catch (error) {
        console.error(`Error checking week ${weekNumber} milestone:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to check milestone',
            details: error.message
        });
    }
});

/**
 * Helper: Get data from Planner Engine
 */
async function getPlannerEngineData(dreamId) {
    try {
        // Get discovery data which contains planner engine output
        const discoveryData = await DreamDiscovery.findOne({ dreamId });
        if (!discoveryData) {
            return { weekThemes: [], goals: [] };
        }
        
        return {
            weekThemes: discoveryData.weekThemes || [],
            goals: discoveryData.goalProgression || {},
            milestones: discoveryData.milestones || [],
            habitTips: discoveryData.habitFormationTips || []
        };
    } catch (error) {
        console.error('Error getting planner engine data:', error);
        return { weekThemes: [], goals: [] };
    }
}

/**
 * Helper: Get data from Tracker Engine  
 */
async function getTrackerEngineData(userId, dreamId) {
    try {
        const TrackingEngine = require('../engines/tracking-engine');
        const trackingEngine = new TrackingEngine();
        
        // Get user events for the journey period
        const events = await trackingEngine.getUserEvents(userId, {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
            limit: 500
        });

        // Filter journey-related events
        const journeyEvents = events.filter(event => 
            ['task_completion', 'task_time_logged', 'milestone_achieved', 'stage_completed'].includes(event.eventType)
        );

        return {
            events: journeyEvents,
            totalTasksCompleted: journeyEvents.filter(e => e.eventType === 'task_completion').length,
            totalTimeSpent: journeyEvents
                .filter(e => e.eventType === 'task_time_logged')
                .reduce((sum, e) => sum + (e.eventData.timeSpent || 0), 0),
            completionPatterns: analyzeCompletionPatterns(journeyEvents)
        };
    } catch (error) {
        console.error('Error getting tracker engine data:', error);
        return { events: [], totalTasksCompleted: 0, totalTimeSpent: 0 };
    }
}

/**
 * Helper: Get data from Scoring Engine
 */
async function getScoringEngineData(userId) {
    try {
        const ScoringEngine = require('../engines/scoring_engine');
        const scoringEngine = new ScoringEngine();
        
        // Get current user profile with fresh calculation
        const profile = await scoringEngine.calculateUserProfile(userId, {
            timeWindow: '30d',
            includeInsights: true
        });

        return profile;
    } catch (error) {
        console.error('Error getting scoring engine data:', error);
        return { 
            stageProfile: { 
                overallScore: 0, 
                achievements: [], 
                insights: [], 
                recommendations: [] 
            } 
        };
    }
}

/**
 * Helper: Get Dream Discovery data
 */
async function getDreamDiscoveryData(dreamId, userId) {
    try {
        const discoveryData = await DreamDiscovery.findOne({ 
            dreamId: dreamId, 
            user: userId 
        });
        
        return discoveryData || {};
    } catch (error) {
        console.error('Error getting dream discovery data:', error);
        return {};
    }
}

/**
 * Helper: Get Goals with Tasks data
 */
async function getGoalsWithTasksData(goalIds) {
    try {
        const goals = await WeeklyGoal.find({ 
            _id: { $in: goalIds } 
        }).populate('tasks').lean();
        
        return goals;
    } catch (error) {
        console.error('Error getting goals with tasks:', error);
        return [];
    }
}

/**
 * Helper: Build week cards from all engine data
 */
async function buildWeekCardsFromEngineData({ plannerData, trackerData, scoringData, discoveryData, goalsWithTasks, dream }) {
    const weekCards = [];
    const weekThemes = plannerData.weekThemes || [];
    
    // Group goals by journey week
    const goalsByWeek = new Map();
    goalsWithTasks.forEach(goal => {
        const week = goal.journeyWeek || 1;
        if (!goalsByWeek.has(week)) {
            goalsByWeek.set(week, []);
        }
        goalsByWeek.get(week).push(goal);
    });

    // Build cards for each week that has data
    for (let weekNum = 1; weekNum <= Math.max(weekThemes.length, goalsByWeek.size, 3); weekNum++) {
        const weekGoals = goalsByWeek.get(weekNum) || [];
        const weekTheme = weekThemes[weekNum - 1] || `Week ${weekNum}`;
        
        // Calculate real task progress for this week
        const weekTasks = weekGoals.flatMap(goal => goal.tasks || []);
        const completedTasks = weekTasks.filter(task => task.completed);
        const totalEstTime = weekTasks.reduce((sum, task) => sum + (task.estTime || 0), 0);
        const totalActualTime = weekTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
        
        // Get week-specific tracker events
        const weekTrackerEvents = trackerData.events.filter(event => {
            if (!event.eventData.taskId) return false;
            return weekTasks.some(task => task._id.toString() === event.eventData.taskId);
        });

        // Get week-specific milestones from discovery data
        const weekMilestones = (discoveryData.milestones || []).filter(milestone => 
            milestone.day <= weekNum * 7 && milestone.day > (weekNum - 1) * 7
        );

        // Calculate week progress percentage
        const weekProgress = weekTasks.length > 0 ? 
            Math.round((completedTasks.length / weekTasks.length) * 100) : 0;

        // Determine week status
        let weekStatus = 'locked';
        if (weekProgress === 100) {
            weekStatus = 'completed';
        } else if (weekProgress > 0 || weekNum === 1) {
            weekStatus = 'current';
        }

        // Calculate efficiency metrics
        const efficiency = totalEstTime > 0 ? 
            Math.round((totalEstTime / Math.max(totalActualTime, 1)) * 100) : 100;

        weekCards.push({
            weekNumber: weekNum,
            theme: weekTheme,
            status: weekStatus,
            progress: {
                completed: completedTasks.length,
                total: weekTasks.length,
                percentage: weekProgress
            },
            timeMetrics: {
                estimated: totalEstTime,
                actual: totalActualTime,
                efficiency: efficiency
            },
            milestones: weekMilestones,
            achievements: [], // Will be populated from scoring engine
            trackerEvents: weekTrackerEvents.length,
            goals: weekGoals.map(goal => ({
                id: goal._id,
                title: goal.title,
                tasksCompleted: (goal.tasks || []).filter(t => t.completed).length,
                totalTasks: (goal.tasks || []).length
            }))
        });
    }

    return weekCards;
}

/**
 * Helper: Calculate overall journey progress from real data
 */
function calculateOverallJourneyProgress(trackerData, goalsWithTasks) {
    const allTasks = goalsWithTasks.flatMap(goal => goal.tasks || []);
    const completedTasks = allTasks.filter(task => task.completed);
    
    const totalTasks = allTasks.length;
    const completed = completedTasks.length;
    const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    
    return {
        totalTasks,
        completedTasks: completed,
        percentage,
        totalTimeSpent: trackerData.totalTimeSpent || 0,
        totalEvents: trackerData.events.length
    };
}

/**
 * Helper: Analyze completion patterns from tracker events
 */
function analyzeCompletionPatterns(events) {
    const completionEvents = events.filter(e => e.eventType === 'task_completion');
    
    if (completionEvents.length === 0) {
        return { streak: 0, averageTime: 0, consistency: 0 };
    }

    // Calculate completion streak
    const sortedEvents = completionEvents.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    let streak = 0;
    let lastCompletionDate = null;
    
    for (const event of sortedEvents) {
        const eventDate = new Date(event.timestamp).toDateString();
        if (!lastCompletionDate) {
            lastCompletionDate = eventDate;
            streak = 1;
        } else if (eventDate === lastCompletionDate) {
            continue; // Same day, don't increment
        } else {
            const daysDiff = Math.abs(
                (new Date(eventDate) - new Date(lastCompletionDate)) / (1000 * 60 * 60 * 24)
            );
            if (daysDiff <= 1) {
                streak++;
                lastCompletionDate = eventDate;
            } else {
                break; // Streak broken
            }
        }
    }

    return {
        streak,
        averageTime: completionEvents.reduce((sum, e) => 
            sum + (e.eventData.actualTime || 0), 0) / completionEvents.length,
        consistency: Math.min(100, (completionEvents.length / 21) * 100) // Based on 21-day journey
    };
}

/**
 * Helper functions for detailed week data
 */
async function getWeekTrackerData(userId, weekNumber, journeyStartDate) {
    // Implementation would get week-specific tracker data
    return { events: [], weekProgress: 0 };
}

async function getWeekScoringData(userId, weekNumber) {
    // Implementation would get week-specific scoring data  
    return { weekScore: 0, achievements: [] };
}

async function getWeekGoalsData(goalIds, weekNumber) {
    // Implementation would get week-specific goals data
    return [];
}

async function getWeekDiscoveryData(dreamId, userId, weekNumber) {
    // Implementation would get week-specific discovery data
    return {};
}

async function buildDetailedWeekCard(data) {
    // Implementation would build detailed week card
    return data;
}

async function checkWeekMilestone(userId, dreamId, weekNumber, weekProgress) {
    // Implementation would check milestone completion criteria
    return { achieved: false, data: {} };
}

function calculateJourneyDay(weekNumber) {
    return weekNumber * 7;
}

/**
 * Parse archetype fields from dreamText using simple regex patterns
 * @param {string} dreamText - User's dream text
 * @param {string} archetypeType - Selected archetype type
 * @returns {Object} Parsed archetype data
 */
function parseArchetypeFields(dreamText, archetypeType) {
    if (!archetypeType || !DREAM_ARCHETYPES[archetypeType.toUpperCase()]) {
        return { 
            type: null, 
            completedFields: [], 
            parsingAccuracy: 0,
            lastParsedAt: new Date(),
            selectedTemplate: '',
            // Empty all fields
            desired_role: '',
            desired_company: '',
            current_role: '',
            current_location: '',
            creative_goal: '',
            current_challenge: '',
            current_emotion: '',
            desired_emotion: '',
            rediscover_aspect: '',
            after_experience: '',
            emotional_driver: '',
            motivation: '',
            suggested_role: ''
        };
    }

    const archetype = DREAM_ARCHETYPES[archetypeType.toUpperCase()];
    const schema = ARCHETYPE_SCHEMAS[archetype];
    const patterns = ARCHETYPE_PATTERNS[archetype];
    
    const extractedData = { ...schema };
    const completedFields = [];
    let successfulExtractions = 0;

    // Extract fields using regex patterns
    for (const [field, pattern] of Object.entries(patterns)) {
        const match = dreamText.match(pattern);
        if (match && match[1]) {
            extractedData[field] = match[1].trim();
            completedFields.push(field);
            successfulExtractions++;
        }
    }

    // Calculate parsing accuracy
    const totalRequiredFields = schema.required_fields.length;
    const requiredFieldsFound = completedFields.filter(field => 
        schema.required_fields.includes(field)
    ).length;
    
    const parsingAccuracy = totalRequiredFields > 0 
        ? Math.round((requiredFieldsFound / totalRequiredFields) * 100) 
        : 0;

    return {
        ...extractedData,
        completedFields,
        parsingAccuracy,
        lastParsedAt: new Date()
    };
}

module.exports = router;