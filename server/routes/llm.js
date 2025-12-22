/**
 * LLM API Routes
 * Simple endpoint for frontend LLM requests
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const llmService = require('../services/llmService');
const User = require('../models/User');
const { VisionData } = require('../models/visionData');

// Apply authentication middleware
router.use(authMiddleware);

/**
 * POST /api/llm/generate
 * Generate content using LLM
 */
router.post('/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }

        console.log('🧠 LLM Generate request:', prompt.substring(0, 100) + '...');
        
        try {
            const planTicket = req.get('X-Plan-Ticket') || req.get('x-plan-ticket');
            const response = await llmService.generateContent(prompt, {
                maxTokens: 1000,
                temperature: 0.7,
                policyTicket: planTicket
            });

            if (response.error) {
                console.error('LLM validation failed:', response.error);
                return res.status(500).json({
                    success: false,
                    error: 'validation_failed',
                    rawContent: response.rawContent
                });
            }

            res.json({
                success: true,
                content: response.content,
                model: response.model,
                provider: response.provider,
                policy: {
                    enforced: String(process.env.IBRAIN_ENFORCE_LLM_POLICY || '').toLowerCase() === 'true',
                    ticketProvided: !!planTicket
                }
            });

        } catch (llmError) {
            console.error('❌ LLM generation failed:', llmError.message);
            
            // Return a helpful fallback response
            res.json({
                success: true,
                content: "I'm here to help you on your journey! Keep moving forward - every step counts toward your dream.",
                model: 'fallback',
                provider: 'system'
            });
        }

    } catch (error) {
        console.error('Error in LLM generate route:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate content'
        });
    }
});

/**
 * GET /api/llm/status
 * Check LLM service status
 */
router.get('/status', async (req, res) => {
    try {
        const testResult = await llmService.testConnection();
        res.json({
            success: true,
            status: testResult.success ? 'connected' : 'disconnected',
            provider: testResult.provider,
            model: testResult.model || 'unknown',
            error: testResult.error || null
        });
    } catch (error) {
        res.json({
            success: false,
            status: 'error',
            error: error.message
        });
    }
});

/**
 * POST /api/llm/plan-week
 * Generate personalized weekly plan based on user input and profile
 */
router.post('/plan-week', async (req, res) => {
    try {
        const { userInput, weekOf } = req.body;
        const userId = req.user.id;
        
        // Input validation
        if (!userInput || userInput.trim().length < 50) {
            return res.status(400).json({
                success: false,
                error: 'input_too_short',
                message: 'Please provide at least 50 characters describing what you want to accomplish'
            });
        }
        
        if (userInput.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'input_too_long',
                message: 'Please keep your input under 500 characters'
            });
        }
        
        // Calculate available days to prevent past-day scheduling
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
        console.log('📅 Available days for task scheduling:', availableDays);
        
        // Fetch user profile data
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'user_not_found',
                message: 'User not found'
            });
        }
        
        // Fetch vision data (optional, use fallbacks if missing)
        const visionData = await VisionData.findOne({ userId: userId });
        
        if (!visionData) {
            return res.status(400).json({
                success: false,
                error: 'vision_assessment_required',
                message: 'Complete your vision assessment for personalized planning'
            });
        }
        
        // Build privacy-safe profile data for LLM
        const profileData = {
            learningStyle: user.preferences?.learningStyle || 'hands-on',
            timeCommitment: user.preferences?.timeCommitment || 'moderate',
            userStage: user.userStage || 'growth',
            // Vision data with fallbacks
            visionLearningStyle: visionData.responses?.learningStyle || 'handson',
            visionTimeCommitment: visionData.responses?.timeCommitment || 'focused',
            intensity: visionData.responses?.intensity || 'balanced',
            dream: visionData.responses?.dream || 'personal growth',
            timeline: visionData.responses?.timeline || 'marathon',
            readiness: visionData.responses?.readiness || 'ready',
            riskTolerance: visionData.responses?.riskTolerance || 'calculated',
            decisionLevel: visionData.responses?.decisionLevel || 'tactical',
            industryTrends: visionData.responses?.industryTrends || 3,
            importance: visionData.responses?.importance || 'interested'
        };
        
        // Build LLM prompt with available days information
        const prompt = buildWeeklyPlanPrompt(userInput, profileData, availableDays);
        
        console.log('🧠 Weekly Plan Generation request for user:', userId);
        console.log('📝 User input:', userInput.substring(0, 100) + '...');
        
        try {
            const planTicket = req.get('X-Plan-Ticket') || req.get('x-plan-ticket');
            const response = await llmService.generateContent(prompt, {
                maxTokens: 1500,
                temperature: 0.7,
                schemaType: 'weekly',
                policyTicket: planTicket
            });

            if (response.error) {
                console.error('LLM weekly plan validation failed:', response.error);
                console.error('Raw LLM response:', response.rawContent);
                throw new Error('LLM validation failed');
            }

            // Parse the JSON response
            const parsedPlan = parseWeeklyPlanResponse(response.content);

            if (!parsedPlan) {
                throw new Error('Failed to parse LLM response');
            }

            res.json({
                success: true,
                goal: parsedPlan.goal,
                availableDays: availableDays, // Include available days for frontend
                metadata: {
                    model: response.model,
                    provider: response.provider,
                    weekOf: weekOf || new Date().toISOString(),
                    policy: {
                        enforced: String(process.env.IBRAIN_ENFORCE_LLM_POLICY || '').toLowerCase() === 'true',
                        ticketProvided: !!planTicket
                    }
                }
            });

        } catch (llmError) {
            console.error('❌ LLM weekly plan generation failed:', llmError.message);
            
            // Return fallback plan
            const fallbackPlan = getFallbackWeeklyPlan();
            res.json({
                success: true,
                goal: fallbackPlan.goal,
                metadata: {
                    model: 'fallback',
                    provider: 'system',
                    weekOf: weekOf || new Date().toISOString()
                }
            });
        }
        
    } catch (error) {
        console.error('Error in weekly plan generation:', error);
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: 'Failed to generate weekly plan'
        });
    }
});

/**
 * Build LLM prompt for weekly planning
 */
function buildWeeklyPlanPrompt(userInput, profileData, availableDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
    const availableDaysString = availableDays.join(', ');
    return `You are a productivity coach. Create a realistic weekly plan based on the user's input and comprehensive profile.

USER PROFILE:
- Learning Style: ${profileData.learningStyle} (${profileData.visionLearningStyle})
- Time Commitment: ${profileData.timeCommitment} (${profileData.visionTimeCommitment})
- Work Intensity: ${profileData.intensity}
- Primary Goal: ${profileData.dream}
- Timeline Approach: ${profileData.timeline}
- Readiness Level: ${profileData.readiness}
- Risk Tolerance: ${profileData.riskTolerance}
- Decision Level: ${profileData.decisionLevel}
- Current Stage: ${profileData.userStage}
- Industry Knowledge: ${profileData.industryTrends}/5
- Importance Level: ${profileData.importance}

SCHEDULING CONSTRAINTS:
- AVAILABLE DAYS THIS WEEK: ${availableDaysString}
- IMPORTANT: Only schedule tasks for these available days. Do NOT create tasks for past days.

USER INPUT: "${userInput}"

Based on the user's profile and input, create 1 focused weekly goal with 3-7 tasks that:
- Match their learning style and work intensity
- Fit their time commitment level
- Align with their primary goal/dream
- Consider their readiness and risk tolerance
- Are appropriate for their current stage
- Are realistic and achievable within a week

If user mentions multiple areas/goals, streamline them into 1 cohesive weekly goal.

Each task should be:
- Specific and actionable
- 15-90 minutes duration
- Realistic for the week
- Progressive (building on each other)

Return ONLY valid JSON in this exact format:
{
  "goal": {
    "title": "Weekly goal title (concise, specific)",
    "tasks": [
      {
        "name": "Specific task name",
        "estTime": 60
      },
      {
        "name": "Specific task name", 
        "estTime": 45
      },
      {
        "name": "Specific task name",
        "estTime": 90
      }
    ]
  }
}

Remember: Return ONLY the JSON object, no additional text or explanation.`;
}

/**
 * Parse weekly plan response from LLM
 */
function parseWeeklyPlanResponse(response) {
    try {
        // Clean up the response - remove any extra text before/after JSON
        let cleanResponse = response.trim();
        
        // Find JSON object boundaries
        const jsonStart = cleanResponse.indexOf('{');
        const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
        }
        
        // Parse JSON
        const parsed = JSON.parse(cleanResponse);
        
        // Handle both formats gracefully
        // Format 1: {goal: {title, tasks}} - Simple weekly planner
        // Format 2: {goals: [...], weeks: [...]} - Full journey planner
        
        if (parsed.goals && Array.isArray(parsed.goals) && parsed.weeks && Array.isArray(parsed.weeks)) {
            // Convert journey planner format to weekly planner format
            console.log('🔄 Converting journey planner format to weekly format');
            
            // Use first goal and first week's tasks
            const firstGoal = parsed.goals[0];
            const firstWeek = parsed.weeks[0];
            
            if (!firstGoal || !firstWeek || !Array.isArray(firstWeek.tasks)) {
                throw new Error('Invalid journey plan structure - missing goal or week data');
            }
            
            // Convert to expected format
            parsed.goal = {
                title: firstGoal.title,
                tasks: firstWeek.tasks.map(task => ({
                    name: task.title || task.name,
                    estTime: task.estTime || task.estimatedTime || 60
                }))
            };
        } else if (!parsed.goal || !parsed.goal.title || !Array.isArray(parsed.goal.tasks)) {
            throw new Error('Invalid plan structure');
        }
        
        // Validate tasks
        if (parsed.goal.tasks.length < 3 || parsed.goal.tasks.length > 7) {
            console.warn(`Expected 3-7 tasks, got ${parsed.goal.tasks.length}`);
        }
        
        // Validate each task
        parsed.goal.tasks.forEach((task, index) => {
            if (!task.name || typeof task.estTime !== 'number') {
                throw new Error(`Task ${index + 1} missing required fields`);
            }
            
            // Ensure estTime is reasonable (15-90 minutes)
            if (task.estTime < 15 || task.estTime > 90) {
                task.estTime = Math.max(15, Math.min(90, task.estTime));
            }
        });
        
        return parsed;
        
    } catch (error) {
        console.error('Failed to parse weekly plan response:', error.message);
        console.error('Raw response:', response);
        return null;
    }
}

/**
 * Get fallback weekly plan if LLM fails
 */
function getFallbackWeeklyPlan() {
    return {
        goal: {
            title: "Weekly Progress Goal",
            tasks: [
                {
                    name: "Break down your goal into specific steps",
                    estTime: 30
                },
                {
                    name: "Research best practices and resources",
                    estTime: 45
                },
                {
                    name: "Create a detailed action plan",
                    estTime: 60
                },
                {
                    name: "Take the first concrete action step",
                    estTime: 90
                },
                {
                    name: "Review progress and adjust approach",
                    estTime: 30
                }
            ]
        }
    };
}

/**
 * POST /api/llm/add-plan
 * Add generated weekly plan to user's weekly goals
 */
router.post('/add-plan', async (req, res) => {
    try {
        const { plan, weekOf } = req.body;
        const userId = req.user.id;
        
        // Validate input
        if (!plan || !plan.title || !plan.tasks || !Array.isArray(plan.tasks)) {
            return res.status(400).json({
                success: false,
                error: 'invalid_plan',
                message: 'Invalid plan data'
            });
        }
        
        if (!weekOf) {
            return res.status(400).json({
                success: false,
                error: 'invalid_week',
                message: 'Week date is required'
            });
        }
        
        // Parse weekOf date
        const weekDate = new Date(weekOf);
        if (isNaN(weekDate)) {
            return res.status(400).json({
                success: false,
                error: 'invalid_week',
                message: 'Invalid week date'
            });
        }
        
        console.log('🎯 Adding plan to weekly goals for user:', userId);
        console.log('📅 Week of:', weekOf);
        console.log('🎯 Plan:', plan.title);
        
        // Import models
        const WeeklyGoal = require('../models/WeeklyGoal');
        const Task = require('../models/Task');
        
        // Create new weekly goal
        const newGoal = new WeeklyGoal({
            user: userId,
            title: plan.title,
            weekOf: weekDate
        });
        
        const savedGoal = await newGoal.save();
        console.log('✅ Goal created:', savedGoal._id);
        
        // Create tasks for the goal
        const taskPromises = plan.tasks.map(async (task) => {
            const newTask = new Task({
                user: userId,
                goal: savedGoal._id,
                name: task.name,
                estTime: task.estTime || 60,
                day: '', // User will assign days later
                completed: false,
                repeatType: 'none'
            });
            return await newTask.save();
        });
        
        const savedTasks = await Promise.all(taskPromises);
        console.log('✅ Tasks created:', savedTasks.length);
        
        res.json({
            success: true,
            goal: {
                _id: savedGoal._id,
                title: savedGoal.title,
                weekOf: savedGoal.weekOf,
                tasks: savedTasks
            }
        });
        
    } catch (error) {
        console.error('❌ Error adding plan to weekly goals:', error);
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: 'Failed to add plan to weekly goals'
        });
    }
});

module.exports = router;
