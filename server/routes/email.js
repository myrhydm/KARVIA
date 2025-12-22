/**
 * server/routes/email.js
 * Email preferences and reminder management routes
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const reminderScheduler = require('../services/reminderScheduler');
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/email/preferences
 * Get user's email preferences
 */
router.get('/preferences', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('emailPreferences');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user.emailPreferences
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/email/preferences
 * Update user's email preferences
 */
router.post('/preferences', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = req.body;
        
        // Validate preferences
        const validPreferences = ['dailyReminders', 'streakBroken', 'weeklyProgress', 'visionUnlocked', 'unsubscribed'];
        const filteredPreferences = {};
        
        for (const key of validPreferences) {
            if (preferences[key] !== undefined) {
                filteredPreferences[key] = Boolean(preferences[key]);
            }
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                $set: {
                    'emailPreferences': {
                        ...filteredPreferences
                    }
                }
            },
            { new: true }
        ).select('emailPreferences');
        
        res.json({
            success: true,
            message: 'Email preferences updated successfully',
            data: user.emailPreferences
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/email/unsubscribe
 * Unsubscribe user from all emails
 */
router.get('/unsubscribe', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Unsubscribe token required'
            });
        }
        
        const user = await User.findByIdAndUpdate(
            token,
            { 
                $set: {
                    'emailPreferences.unsubscribed': true,
                    'emailPreferences.dailyReminders': false,
                    'emailPreferences.streakBroken': false,
                    'emailPreferences.weeklyProgress': false,
                    'emailPreferences.visionUnlocked': false
                }
            },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Invalid unsubscribe token'
            });
        }
        
        res.json({
            success: true,
            message: 'You have been unsubscribed from all emails',
            data: {
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/email/send-welcome
 * Send welcome email to user (admin or trigger)
 */
router.post('/send-welcome', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await reminderScheduler.sendWelcomeEmail(userId);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Welcome email sent successfully',
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send welcome email',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/email/history
 * Get user's email history
 */
router.get('/history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('emailHistory');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                emailHistory: user.emailHistory,
                totalEmails: user.emailHistory.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/email/scheduler/status
 * Get reminder scheduler status (admin only)
 */
router.get('/scheduler/status', verifyToken, async (req, res) => {
    try {
        // Add admin check here if needed
        // if (!req.user.isAdmin) { return res.status(403).json({ success: false, message: 'Admin access required' }); }
        
        const status = reminderScheduler.getStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/email/scheduler/start
 * Start reminder scheduler (admin only)
 */
router.post('/scheduler/start', verifyToken, async (req, res) => {
    try {
        // Add admin check here if needed
        
        reminderScheduler.start();
        
        res.json({
            success: true,
            message: 'Reminder scheduler started successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/email/scheduler/stop
 * Stop reminder scheduler (admin only)
 */
router.post('/scheduler/stop', verifyToken, async (req, res) => {
    try {
        // Add admin check here if needed
        
        reminderScheduler.stop();
        
        res.json({
            success: true,
            message: 'Reminder scheduler stopped successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;