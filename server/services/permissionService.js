/**
 * server/services/permissionService.js
 * Stage-based permission system for access control
 */

const User = require('../models/User');
const { stageConfigs } = require('../config/stages');
const stageManager = require('./stageManager');

class PermissionService {
    /**
     * Check if user has permission for a specific feature
     * @param {string} userId - User ID
     * @param {string} feature - Feature name
     * @returns {Object} Permission result
     */
    async checkFeaturePermission(userId, feature) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                return { 
                    hasPermission: false, 
                    reason: 'User not found' 
                };
            }

            const userStage = user.userStage;
            const permissions = this.getStagePermissions(userStage);
            
            // Check if feature is available in current stage
            if (!permissions.features.includes(feature)) {
                return {
                    hasPermission: false,
                    reason: `Feature '${feature}' not available in Stage ${userStage}`,
                    requiredStage: this.getRequiredStageForFeature(feature),
                    currentStage: userStage
                };
            }

            // Check specific conditions for locked features
            if (feature === 'vision-questionnaire') {
                return await this.checkVisionQuestionnairePermission(userId);
            }

            return {
                hasPermission: true,
                stage: userStage
            };
        } catch (error) {
            return {
                hasPermission: false,
                reason: error.message
            };
        }
    }

    /**
     * Check vision questionnaire specific permissions
     * @param {string} userId - User ID
     * @returns {Object} Permission result
     */
    async checkVisionQuestionnairePermission(userId) {
        try {
            const user = await User.findById(userId);
            
            // Stage 2+ users have vision questionnaire automatically unlocked
            if (user.userStage >= 2) {
                return {
                    hasPermission: true,
                    unlocked: true,
                    message: 'Vision questionnaire available'
                };
            }
            
            // Stage 1 users need 3-day streak to unlock
            const visionUnlock = await stageManager.checkPathwayUnlock(userId, 'vision');
            
            if (!visionUnlock.unlocked) {
                return {
                    hasPermission: false,
                    reason: 'Vision questionnaire locked',
                    unlockCondition: visionUnlock.reason,
                    currentStreak: visionUnlock.currentStreak,
                    requiredStreak: visionUnlock.requiredStreak,
                    remainingDays: visionUnlock.remainingDays,
                    lockMessage: `Complete ${visionUnlock.remainingDays} more day${visionUnlock.remainingDays > 1 ? 's' : ''} to unlock!`
                };
            }

            return {
                hasPermission: true,
                unlocked: true,
                message: 'Vision questionnaire unlocked! 🎉'
            };
        } catch (error) {
            return {
                hasPermission: false,
                reason: error.message
            };
        }
    }

    /**
     * Get permissions for a specific stage
     * @param {number} stage - Stage number
     * @returns {Object} Stage permissions
     */
    getStagePermissions(stage) {
        const basePermissions = {
            1: {
                features: ['dream-input', 'check-in', 'dashboard', 'vision-questionnaire'],
                routes: ['/api/checkin', '/api/stages/current', '/api/stages/update-data'],
                ui: {
                    'vision-questionnaire': 'conditional' // Can be locked based on streak
                }
            },
            2: {
                features: ['dream-input', 'check-in', 'dashboard', 'vision-questionnaire', 'task-feedback', 'progress-tracking'],
                routes: ['/api/checkin', '/api/stages/current', '/api/stages/update-data', '/api/vision/*'],
                ui: {
                    'vision-questionnaire': 'enabled',
                    'task-feedback': 'enabled',
                    'progress-tracking': 'enabled'
                }
            },
            3: {
                features: ['dream-input', 'check-in', 'dashboard', 'vision-questionnaire', 'task-feedback', 'progress-tracking', 'community', 'mentorship'],
                routes: ['/api/checkin', '/api/stages/current', '/api/stages/update-data', '/api/vision/*', '/api/community/*', '/api/mentorship/*'],
                ui: {
                    'vision-questionnaire': 'enabled',
                    'task-feedback': 'enabled',
                    'progress-tracking': 'enabled',
                    'community': 'enabled',
                    'mentorship': 'enabled'
                }
            }
        };

        return basePermissions[stage] || basePermissions[1];
    }

    /**
     * Get required stage for a feature
     * @param {string} feature - Feature name
     * @returns {number} Required stage number
     */
    getRequiredStageForFeature(feature) {
        const featureStages = {
            'dream-input': 1,
            'check-in': 1,
            'dashboard': 1,
            'vision-questionnaire': 1, // Available but locked until streak
            'task-feedback': 2,
            'progress-tracking': 2,
            'community': 3,
            'mentorship': 3
        };

        return featureStages[feature] || 1;
    }

    /**
     * Check if user can access a specific route
     * @param {string} userId - User ID
     * @param {string} route - Route path
     * @returns {Object} Access result
     */
    async checkRouteAccess(userId, route) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                return { 
                    hasAccess: false, 
                    reason: 'User not found' 
                };
            }

            const userStage = user.userStage;
            const permissions = this.getStagePermissions(userStage);
            
            // Check if route is allowed for current stage
            const hasAccess = permissions.routes.some(allowedRoute => {
                if (allowedRoute.includes('*')) {
                    const baseRoute = allowedRoute.replace('*', '');
                    return route.startsWith(baseRoute);
                }
                return route === allowedRoute;
            });

            if (!hasAccess) {
                return {
                    hasAccess: false,
                    reason: `Route '${route}' not accessible in Stage ${userStage}`,
                    requiredStage: this.getRequiredStageForRoute(route),
                    currentStage: userStage
                };
            }

            return {
                hasAccess: true,
                stage: userStage
            };
        } catch (error) {
            return {
                hasAccess: false,
                reason: error.message
            };
        }
    }

    /**
     * Get required stage for a route
     * @param {string} route - Route path
     * @returns {number} Required stage number
     */
    getRequiredStageForRoute(route) {
        const routeStages = {
            '/api/checkin': 1,
            '/api/stages/current': 1,
            '/api/stages/update-data': 1,
            '/api/vision': 1,
            '/api/community': 3,
            '/api/mentorship': 3
        };

        // Check for wildcard matches
        for (const [routePattern, stage] of Object.entries(routeStages)) {
            if (route.startsWith(routePattern)) {
                return stage;
            }
        }

        return 1; // Default to stage 1
    }

    /**
     * Get user's current permissions and UI state
     * @param {string} userId - User ID
     * @returns {Object} Complete permission state
     */
    async getUserPermissions(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const userStage = user.userStage;
            const permissions = this.getStagePermissions(userStage);
            
            // Get specific feature permissions
            const featurePermissions = {};
            for (const feature of permissions.features) {
                featurePermissions[feature] = await this.checkFeaturePermission(userId, feature);
            }

            // Get UI state for each component
            const uiState = {};
            for (const [component, state] of Object.entries(permissions.ui)) {
                if (state === 'conditional') {
                    // Check specific conditions
                    if (component === 'vision-questionnaire') {
                        const visionPermission = await this.checkVisionQuestionnairePermission(userId);
                        uiState[component] = {
                            enabled: visionPermission.hasPermission,
                            locked: !visionPermission.hasPermission,
                            message: visionPermission.lockMessage || visionPermission.message,
                            ...visionPermission
                        };
                    }
                } else {
                    uiState[component] = {
                        enabled: state === 'enabled',
                        locked: false
                    };
                }
            }

            return {
                userStage: userStage,
                permissions: permissions,
                featurePermissions: featurePermissions,
                uiState: uiState,
                streakCount: user.streakCount
            };
        } catch (error) {
            throw new Error(`Failed to get user permissions: ${error.message}`);
        }
    }

    /**
     * Get dashboard configuration for user's stage
     * @param {string} userId - User ID
     * @returns {Object} Dashboard configuration
     */
    async getDashboardConfig(userId) {
        try {
            const userPermissions = await this.getUserPermissions(userId);
            const user = await User.findById(userId);
            
            const dashboardConfig = {
                stage: userPermissions.userStage,
                streakCount: user.streakCount,
                components: {
                    dreamInput: {
                        visible: true,
                        enabled: userPermissions.uiState['dream-input']?.enabled !== false
                    },
                    checkInButton: {
                        visible: true,
                        enabled: true
                    },
                    visionQuestionnaireButton: {
                        visible: true,
                        enabled: userPermissions.uiState['vision-questionnaire']?.enabled || false,
                        locked: userPermissions.uiState['vision-questionnaire']?.locked || false,
                        message: userPermissions.uiState['vision-questionnaire']?.message || 'Complete 3 day streak to unlock!',
                        streakProgress: {
                            current: user.streakCount,
                            required: 3,
                            remaining: Math.max(0, 3 - user.streakCount)
                        }
                    },
                    taskFeedback: {
                        visible: userPermissions.userStage >= 2,
                        enabled: userPermissions.uiState['task-feedback']?.enabled || false
                    },
                    progressTracking: {
                        visible: userPermissions.userStage >= 2,
                        enabled: userPermissions.uiState['progress-tracking']?.enabled || false
                    },
                    community: {
                        visible: userPermissions.userStage >= 3,
                        enabled: userPermissions.uiState['community']?.enabled || false
                    }
                }
            };

            return dashboardConfig;
        } catch (error) {
            throw new Error(`Failed to get dashboard config: ${error.message}`);
        }
    }
}

module.exports = new PermissionService();