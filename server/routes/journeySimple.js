/**
 * Simplified Journey Routes for Frontend Integration
 * Provides basic endpoints that work with existing system
 */

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

/**
 * POST /api/journey/initialize
 * Initialize a new journey (simplified version)
 */
router.post('/initialize', authenticateToken, async (req, res) => {
    try {
        const { dreamText, confidence, timeHorizon } = req.body;

        // Basic validation
        if (!dreamText || dreamText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Dream text is required'
            });
        }

        // For now, return a mock successful response
        // This will be replaced with actual journey logic later
        const mockJourneyData = {
            journeyId: `journey_${Date.now()}`,
            userId: req.user.id,
            dreamText: dreamText.trim(),
            confidence,
            timeHorizon,
            stage: 1,
            createdAt: new Date(),
            status: 'active'
        };

        res.json({
            success: true,
            data: mockJourneyData,
            message: 'Journey initialized successfully! (Demo mode - full implementation coming soon)'
        });
    } catch (error) {
        console.error('Error initializing journey:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to initialize journey'
        });
    }
});

/**
 * GET /api/journey/status
 * Get current journey status
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        // Return mock status for now
        const mockStatus = {
            hasActiveJourney: false,
            currentStage: null,
            overallProgress: 0
        };

        res.json({
            success: true,
            data: mockStatus,
            message: 'Journey status retrieved'
        });
    } catch (error) {
        console.error('Error getting journey status:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/journey/current-stage
 * Get current stage information and tasks
 */
router.get('/current-stage', authenticateToken, async (req, res) => {
    try {
        // Return mock stage data
        const mockStageData = {
            stage: {
                id: 1,
                name: '3-Day Activation',
                duration: 3,
                completedDays: 0
            },
            tasks: [
                {
                    id: 'task_1',
                    title: 'Define your vision statement',
                    description: 'Write a clear 2-3 sentence vision of your dream career',
                    estimatedTime: 30,
                    status: 'pending'
                },
                {
                    id: 'task_2',
                    title: 'Research target companies',
                    description: 'Identify 3-5 companies that align with your vision',
                    estimatedTime: 45,
                    status: 'pending'
                }
            ],
            stats: {
                completedTasks: 0,
                currentStreak: 0,
                beliefScore: 75
            }
        };

        res.json({
            success: true,
            data: mockStageData,
            message: 'Current stage data retrieved'
        });
    } catch (error) {
        console.error('Error getting current stage:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
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

        // Mock task completion
        res.json({
            success: true,
            data: { taskId, status: 'completed' },
            message: '🎉 Great job! Task completed successfully!'
        });
    } catch (error) {
        console.error('Error completing task:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/journey/skip-task
 * Skip a task with adaptation
 */
router.post('/skip-task', authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.body;

        if (!taskId) {
            return res.status(400).json({
                success: false,
                error: 'Task ID is required'
            });
        }

        // Mock task skip
        res.json({
            success: true,
            data: { taskId, status: 'skipped' },
            message: 'Task skipped. We\'ll adapt your journey accordingly.'
        });
    } catch (error) {
        console.error('Error skipping task:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/journey/trigger
 * Get motivational trigger/message
 */
router.get('/trigger', authenticateToken, async (req, res) => {
    try {
        const { context } = req.query;

        const motivationalMessages = [
            "You're closer to your dream than you think. Every action today builds tomorrow's reality.",
            "Great journeys begin with a single step. You've already taken yours!",
            "Your future self is counting on the choices you make today.",
            "Dreams don't have expiration dates. Keep pushing forward!",
            "The gap between dreams and reality is called action. What will you do today?"
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
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/journey/adaptation-analysis
 * Get journey adaptation insights
 */
router.get('/adaptation-analysis', authenticateToken, async (req, res) => {
    try {
        const mockInsights = {
            patterns: {
                performance: 'Consistent',
                engagement: 'High',
                belief: 'Growing',
                consistency: 'Strong'
            },
            recommendations: [
                'Continue your current approach - you\'re making excellent progress',
                'Consider adding one stretch goal to challenge yourself further',
                'Share your progress with someone to build accountability'
            ],
            adaptations: []
        };

        res.json({
            success: true,
            data: {
                insights: mockInsights
            },
            message: 'Adaptation analysis completed'
        });
    } catch (error) {
        console.error('Error getting adaptation analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/journey/regenerate-goals
 * Regenerate goals for current stage
 */
router.post('/regenerate-goals', authenticateToken, async (req, res) => {
    try {
        // Mock goal regeneration
        res.json({
            success: true,
            data: { regenerated: true },
            message: 'Goals refreshed! New personalized tasks have been generated for your journey.'
        });
    } catch (error) {
        console.error('Error regenerating goals:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;