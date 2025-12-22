/**
 * server/routes/checkin.js
 * API routes for daily check-ins and streak management
 */

const express = require('express');
const router = express.Router();
const stageManager = require('../services/stageManager');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/checkin
 * Daily check-in to maintain streak
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Update check-in streak
        const streakResult = await stageManager.updateCheckInStreak(userId);
        
        // Get updated dashboard message
        const dashboardData = await stageManager.generateDashboardMessage(userId);
        
        // Check if any pathways got unlocked
        const visionUnlock = await stageManager.checkPathwayUnlock(userId, 'vision');
        
        res.json({
            success: true,
            message: streakResult.message,
            data: {
                streakCount: streakResult.streakCount,
                streakUpdated: streakResult.streakUpdated,
                dashboardMessage: dashboardData.message,
                visionUnlocked: visionUnlock.unlocked,
                newUnlock: visionUnlock.unlocked && streakResult.streakCount === 3
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
 * GET /api/checkin/status
 * Get current check-in status
 */
router.get('/status', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { user } = await stageManager.getCurrentStageData(userId);
        const dashboardData = await stageManager.generateDashboardMessage(userId);
        const visionUnlock = await stageManager.checkPathwayUnlock(userId, 'vision');
        
        // Calculate if user can check in today
        const now = new Date();
        const lastCheckIn = user.lastCheckIn;
        const daysDiff = Math.floor((now - lastCheckIn) / (1000 * 60 * 60 * 24));
        
        res.json({
            success: true,
            data: {
                streakCount: user.streakCount,
                lastCheckIn: user.lastCheckIn,
                canCheckInToday: daysDiff >= 1,
                alreadyCheckedIn: daysDiff === 0,
                dashboardMessage: dashboardData.message,
                visionUnlocked: visionUnlock.unlocked,
                remainingDaysForVision: visionUnlock.remainingDays || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;