/**
 * server/middleware/stageAuth.js
 * Middleware for stage-based access control
 */

const permissionService = require('../services/permissionService');

/**
 * Middleware to check if user has permission for a specific feature
 * @param {string} feature - Feature name to check
 * @returns {Function} Express middleware
 */
const requireFeature = (feature) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const permission = await permissionService.checkFeaturePermission(userId, feature);
            
            if (!permission.hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    reason: permission.reason,
                    requiredStage: permission.requiredStage,
                    currentStage: permission.currentStage,
                    unlockCondition: permission.unlockCondition,
                    lockMessage: permission.lockMessage
                });
            }
            
            // Add permission info to request for use in route handlers
            req.permission = permission;
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to check permissions',
                error: error.message
            });
        }
    };
};

/**
 * Middleware to check if user can access a specific route
 * @param {string} route - Route path to check
 * @returns {Function} Express middleware
 */
const requireRoute = (route) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const access = await permissionService.checkRouteAccess(userId, route);
            
            if (!access.hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Route access denied',
                    reason: access.reason,
                    requiredStage: access.requiredStage,
                    currentStage: access.currentStage
                });
            }
            
            // Add access info to request
            req.routeAccess = access;
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to check route access',
                error: error.message
            });
        }
    };
};

/**
 * Middleware to check if user has minimum stage level
 * @param {number} minStage - Minimum stage required
 * @returns {Function} Express middleware
 */
const requireStage = (minStage) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const User = require('../models/User');
            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            if (user.userStage < minStage) {
                return res.status(403).json({
                    success: false,
                    message: `Stage ${minStage} required`,
                    requiredStage: minStage,
                    currentStage: user.userStage,
                    reason: `You need to reach Stage ${minStage} to access this feature`
                });
            }
            
            req.userStage = user.userStage;
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to check stage requirement',
                error: error.message
            });
        }
    };
};

/**
 * Middleware to check vision questionnaire access
 * @returns {Function} Express middleware
 */
const requireVisionAccess = () => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const permission = await permissionService.checkVisionQuestionnairePermission(userId);
            
            if (!permission.hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Vision questionnaire locked',
                    reason: permission.reason,
                    unlockCondition: permission.unlockCondition,
                    currentStreak: permission.currentStreak,
                    requiredStreak: permission.requiredStreak,
                    remainingDays: permission.remainingDays,
                    lockMessage: permission.lockMessage
                });
            }
            
            req.visionPermission = permission;
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to check vision access',
                error: error.message
            });
        }
    };
};

/**
 * Middleware to add user permissions to request
 * @returns {Function} Express middleware
 */
const addPermissions = () => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const permissions = await permissionService.getUserPermissions(userId);
            
            req.permissions = permissions;
            next();
        } catch (error) {
            console.error('Failed to add permissions:', error);
            // Don't fail the request, just continue without permissions
            req.permissions = null;
            next();
        }
    };
};

module.exports = {
    requireFeature,
    requireRoute,
    requireStage,
    requireVisionAccess,
    addPermissions
};