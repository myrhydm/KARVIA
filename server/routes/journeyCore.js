/**
 * Journey Core Routes
 * Handles 21-day journey system with sprint management
 */

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const journeyService = require('../services/journeyService');
const visionDataService = require('../services/visionDataService');
const Task = require('../models/Task');
const User = require('../models/User');

/**
 * POST /api/journey/initialize
 * Initialize a new 21-day journey
 */
router.post('/initialize', authenticateToken, async (req, res) => {
    try {
        const { dreamText, confidence, timeHorizon, careerPath, timeCommitment, learningStyle } = req.body;

        // Validation
        if (!dreamText || dreamText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Dream text is required'
            });
        }

        if (dreamText.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Dream text must be less than 1000 characters'
            });
        }

        const journey = await journeyService.initializeJourney(
            req.user.id,
            dreamText.trim(),
            confidence || 50,
            timeHorizon || 52,
            careerPath || 'employee',
            timeCommitment || 'micro-burst',
            learningStyle || 'visual'
        );

        // Mark onboarding as completed after journey initialization
        await User.findByIdAndUpdate(req.user.id, { 
            onboardingCompleted: true 
        });

        res.json({
            success: true,
            data: {
                journeyId: journey._id,
                currentSprint: journey.currentSprint,
                currentWeek: journey.currentWeek,
                currentDay: journey.currentDay,
                status: journey.status,
                startDate: journey.startDate,
                overallProgress: journey.overallProgress,
                onboardingCompleted: true // Include in response for frontend
            },
            message: 'Journey initialized successfully! Your 21-day transformation begins now.'
        });

    } catch (error) {
        console.error('Error initializing journey:', error);
        
        // If user already has a journey, mark onboarding complete and return journey info
        if (error.message.includes('already has an active journey')) {
            try {
                // Mark onboarding as completed
                await User.findByIdAndUpdate(req.user.id, { 
                    onboardingCompleted: true 
                });
                
                // Get existing journey status
                const existingJourney = await journeyService.getJourneyStatus(req.user.id);
                
                return res.json({
                    success: true,
                    data: {
                        ...existingJourney,
                        onboardingCompleted: true
                    },
                    message: 'You already have an active journey! Redirecting to your dashboard...'
                });
            } catch (statusError) {
                console.error('Error getting existing journey:', statusError);
            }
        }
        
        res.status(500).json({
            success: false,
            error: error.message.includes('already has an active journey') ? 
                'You already have an active journey' : 'Failed to initialize journey',
            message: 'Unable to start journey. Please try again.'
        });
    }
});

/**
 * GET /api/journey/status
 * Get current journey status
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const status = await journeyService.getJourneyStatus(req.user.id);
        
        res.json({
            success: true,
            data: status,
            message: 'Journey status retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting journey status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get journey status',
            message: 'Unable to retrieve journey status'
        });
    }
});

/**
 * GET /api/journey/current-sprint
 * Get current sprint information and tasks
 */
router.get('/current-sprint', authenticateToken, async (req, res) => {
    try {
        const status = await journeyService.getJourneyStatus(req.user.id);
        
        if (!status.hasActiveJourney) {
            return res.status(404).json({
                success: false,
                error: 'No active journey found',
                message: 'Start a journey to access sprint information'
            });
        }

        const currentTasks = await journeyService.getCurrentSprintTasks(req.user.id);

        res.json({
            success: true,
            data: {
                sprint: status.currentSprintData,
                week: status.currentWeek,
                day: status.currentDay,
                tasks: currentTasks,
                progress: status.overallProgress,
                nextUnlock: status.nextUnlock
            },
            message: 'Current sprint data retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting current sprint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get current sprint',
            message: 'Unable to retrieve current sprint information'
        });
    }
});

/**
 * POST /api/journey/complete-task
 * Mark a task as completed
 */
router.post('/complete-task', authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.body;

        if (!taskId) {
            return res.status(400).json({
                success: false,
                error: 'Task ID is required'
            });
        }

        const result = await journeyService.completeTask(req.user.id, taskId);

        let message = '🎉 Great job! Task completed successfully!';
        if (result.goalCompleted) {
            message = '🌟 Excellent! Goal completed! You\'re making great progress!';
        }
        if (result.sprintCompleted) {
            message = '🚀 Amazing! Sprint completed! Ready for the next challenge!';
        }

        res.json({
            success: true,
            data: result,
            message: message
        });

    } catch (error) {
        console.error('Error completing task:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Unable to complete task. Please try again.'
        });
    }
});

/**
 * POST /api/journey/skip-task
 * Skip a task with tracking
 */
router.post('/skip-task', authenticateToken, async (req, res) => {
    try {
        const { taskId, reason } = req.body;

        if (!taskId) {
            return res.status(400).json({
                success: false,
                error: 'Task ID is required'
            });
        }

        // For now, just acknowledge the skip
        // In Chunk 2, we'll add proper skip tracking and adaptation
        res.json({
            success: true,
            data: { 
                taskId, 
                skipped: true,
                reason: reason || 'No reason provided'
            },
            message: 'Task skipped. We\'ll adapt your journey accordingly.'
        });

    } catch (error) {
        console.error('Error skipping task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to skip task',
            message: 'Unable to skip task. Please try again.'
        });
    }
});

/**
 * POST /api/journey/progress-sprint
 * Progress to next sprint
 */
router.post('/progress-sprint', authenticateToken, async (req, res) => {
    try {
        const result = await journeyService.progressToNextSprint(req.user.id);

        let message = '🎯 Great! Moving to the next sprint!';
        if (result.journeyCompleted) {
            message = '🎓 Congratulations! You\'ve completed your 21-day journey!';
        }

        res.json({
            success: true,
            data: result,
            message: message
        });

    } catch (error) {
        console.error('Error progressing sprint:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Unable to progress to next sprint.'
        });
    }
});

/**
 * GET /api/journey/full-overview
 * Get complete journey overview for journey page
 */
router.get('/full-overview', authenticateToken, async (req, res) => {
    try {
        const status = await journeyService.getJourneyStatus(req.user.id);
        
        if (!status.hasActiveJourney) {
            return res.status(404).json({
                success: false,
                error: 'No active journey found',
                data: { hasActiveJourney: false }
            });
        }

        // Get the full journey data
        const Journey = require('../models/Journey');
        const journey = await Journey.findById(status.journeyId);

        res.json({
            success: true,
            data: {
                journey: {
                    id: journey._id,
                    dreamText: journey.dreamText,
                    confidence: journey.confidence,
                    timeHorizon: journey.timeHorizon,
                    status: journey.status,
                    startDate: journey.startDate,
                    completedDate: journey.completedDate
                },
                current: {
                    week: journey.currentWeek,
                    sprint: journey.currentSprint,
                    day: journey.currentDay
                },
                sprints: journey.sprints.map(sprint => ({
                    sprintNumber: sprint.sprintNumber,
                    name: sprint.name,
                    week: sprint.week,
                    days: sprint.days,
                    status: sprint.status,
                    completionRate: sprint.completionRate,
                    goalsCount: sprint.goals.length,
                    completedGoals: sprint.goals.filter(g => g.completed).length
                })),
                reflectionDays: journey.reflectionDays,
                progress: journey.overallProgress
            },
            message: 'Journey overview retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting journey overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get journey overview',
            message: 'Unable to retrieve journey information'
        });
    }
});

/**
 * POST /api/journey/collect-vision-data
 * Collect vision data from task completion
 */
router.post('/collect-vision-data', authenticateToken, async (req, res) => {
    try {
        const { taskId, responses, checkInData } = req.body;

        if (!taskId && !checkInData) {
            return res.status(400).json({
                success: false,
                error: 'Either taskId with responses or checkInData is required'
            });
        }

        let result;
        if (taskId) {
            // Collect data from task completion
            const task = await Task.findById(taskId);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            result = await visionDataService.collectDataFromTask(
                req.user.id,
                taskId,
                task.name,
                1, // This should be dynamic based on current sprint
                1, // This should be dynamic based on current day
                responses || {}
            );
        } else {
            // Collect data from check-in
            result = await visionDataService.collectDataFromCheckIn(
                req.user.id,
                checkInData,
                1, // This should be dynamic based on current sprint
                1  // This should be dynamic based on current day
            );
        }

        res.json({
            success: true,
            data: {
                dataPointsCollected: result.dataPoints.length,
                completionStatus: result.completionStatus
            },
            message: 'Vision data collected successfully'
        });

    } catch (error) {
        console.error('Error collecting vision data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to collect vision data',
            message: 'Unable to save your responses'
        });
    }
});

/**
 * GET /api/journey/vision-profile
 * Get user's vision profile
 */
router.get('/vision-profile', authenticateToken, async (req, res) => {
    try {
        const visionProfile = await visionDataService.getVisionProfile(req.user.id);
        
        if (!visionProfile) {
            return res.status(404).json({
                success: false,
                error: 'Vision profile not found',
                message: 'Start a journey to build your vision profile'
            });
        }

        res.json({
            success: true,
            data: visionProfile,
            message: 'Vision profile retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting vision profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get vision profile',
            message: 'Unable to retrieve your profile'
        });
    }
});

/**
 * GET /api/journey/trigger
 * Get motivational trigger/message (placeholder)
 */
router.get('/trigger', authenticateToken, async (req, res) => {
    try {
        const { context } = req.query;

        const motivationalMessages = [
            "You're closer to your dream than you think. Every action today builds tomorrow's reality.",
            "Great journeys begin with a single step. You've already taken yours!",
            "Your future self is counting on the choices you make today.",
            "Dreams don't have expiration dates. Keep pushing forward!",
            "The gap between dreams and reality is called action. What will you do today?",
            "Progress, not perfection. Every small step counts.",
            "You're not just completing tasks, you're building the person you want to become.",
            "Consistency beats perfection. Show up for yourself today."
        ];

        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

        res.json({
            success: true,
            data: {
                trigger: {
                    type: 'encouragement',
                    message: randomMessage,
                    context: context || 'general'
                }
            },
            message: 'Motivational trigger generated'
        });

    } catch (error) {
        console.error('Error generating trigger:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate trigger',
            message: 'Unable to generate motivation'
        });
    }
});

/**
 * POST /api/journey/cleanup-old-goals
 * Clean up old broken WeeklyGoal entries from journey creation
 */
router.post('/cleanup-old-goals', authenticateToken, async (req, res) => {
    try {
        const WeeklyGoal = require('../models/WeeklyGoal');
        
        // Find WeeklyGoals that have empty tasks arrays (broken journey goals)
        const brokenGoals = await WeeklyGoal.find({
            user: req.user.id,
            tasks: { $size: 0 },
            title: { $in: ['Dream Clarity', 'Vision Research', 'First Milestone'] }
        });
        
        if (brokenGoals.length > 0) {
            await WeeklyGoal.deleteMany({
                _id: { $in: brokenGoals.map(g => g._id) }
            });
            
            console.log(`Cleaned up ${brokenGoals.length} broken journey goals for user ${req.user.id}`);
        }
        
        res.json({
            success: true,
            data: {
                removedCount: brokenGoals.length
            },
            message: `Cleaned up ${brokenGoals.length} old journey goals`
        });
        
    } catch (error) {
        console.error('Error cleaning up old goals:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Unable to clean up old goals'
        });
    }
});

module.exports = router;