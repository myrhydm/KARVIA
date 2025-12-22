/**
 * server/routes/permissions.js
 * API routes for stage-based permissions and dashboard configuration
 */

const express = require('express');
const router = express.Router();
const permissionService = require('../services/permissionService');
const { verifyToken } = require('../middleware/auth');
const { requireVisionAccess } = require('../middleware/stageAuth');

/**
 * GET /api/permissions/user
 * Get current user's permissions and UI state
 */
router.get('/user', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const permissions = await permissionService.getUserPermissions(userId);
        
        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/permissions/dashboard
 * Get dashboard configuration for user's stage
 */
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const dashboardConfig = await permissionService.getDashboardConfig(userId);
        
        res.json({
            success: true,
            data: dashboardConfig
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/permissions/check/:feature
 * Check if user has access to a specific feature
 */
router.get('/check/:feature', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const feature = req.params.feature;
        
        const permission = await permissionService.checkFeaturePermission(userId, feature);
        
        res.json({
            success: true,
            data: {
                feature: feature,
                hasPermission: permission.hasPermission,
                ...permission
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
 * GET /api/permissions/vision-questionnaire
 * Check vision questionnaire access with detailed info
 */
router.get('/vision-questionnaire', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const permission = await permissionService.checkVisionQuestionnairePermission(userId);
        
        res.json({
            success: true,
            data: {
                feature: 'vision-questionnaire',
                hasPermission: permission.hasPermission,
                ...permission
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
 * POST /api/permissions/vision-questionnaire/access
 * Attempt to access vision questionnaire (will fail if locked)
 */
router.post('/vision-questionnaire/access', verifyToken, requireVisionAccess(), async (req, res) => {
    try {
        // If we get here, user has access
        res.json({
            success: true,
            message: 'Vision questionnaire access granted',
            data: {
                redirectUrl: '/vision-questionnaire',
                unlocked: true
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
 * GET /api/permissions/ui-state
 * Get UI state for all components based on user's stage
 */
router.get('/ui-state', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const permissions = await permissionService.getUserPermissions(userId);
        
        res.json({
            success: true,
            data: {
                stage: permissions.userStage,
                streakCount: permissions.streakCount,
                uiState: permissions.uiState,
                components: {
                    visionQuestionnaire: {
                        enabled: permissions.uiState['vision-questionnaire']?.enabled || false,
                        locked: permissions.uiState['vision-questionnaire']?.locked || false,
                        message: permissions.uiState['vision-questionnaire']?.message || 'Complete 3 day streak to unlock!',
                        currentStreak: permissions.uiState['vision-questionnaire']?.currentStreak || 0,
                        requiredStreak: permissions.uiState['vision-questionnaire']?.requiredStreak || 3,
                        remainingDays: permissions.uiState['vision-questionnaire']?.remainingDays || 3
                    }
                }
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