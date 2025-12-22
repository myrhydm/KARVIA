/**
 * Scoring Consent API Routes
 * 
 * Manages user consent for different data bundles used in scoring calculations
 */

const express = require('express');
const router = express.Router();
const ScoringConsentService = require('../services/ScoringConsentService');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

const consentService = new ScoringConsentService();

/**
 * GET /api/scoring-consent
 * Get user's current consent settings and available data bundles
 */
router.get('/', async (req, res) => {
    try {
        const [consent, availableBundles] = await Promise.all([
            consentService.getUserConsent(req.user.id),
            Promise.resolve(consentService.getAvailableDataBundles())
        ]);

        const consentSummary = consentService.generateConsentSummary(consent);

        res.json({
            success: true,
            data: {
                currentConsent: consent,
                availableBundles,
                consentSummary,
                userId: req.user.id
            }
        });
    } catch (error) {
        console.error('Error getting consent settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get consent settings'
        });
    }
});

/**
 * POST /api/scoring-consent/:bundleType
 * Update consent for a specific data bundle
 */
router.post('/:bundleType', async (req, res) => {
    try {
        const { bundleType } = req.params;
        const { enabled, includes } = req.body;

        // Validate bundle type
        const availableBundles = consentService.getAvailableDataBundles();
        if (!availableBundles[bundleType]) {
            return res.status(400).json({
                success: false,
                error: `Invalid bundle type: ${bundleType}`
            });
        }

        // Validate input
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'enabled field must be a boolean'
            });
        }

        const consentData = { enabled };
        if (includes && typeof includes === 'object') {
            consentData.includes = includes;
        }

        // Update consent
        const updatedConsent = await consentService.updateConsent(
            req.user.id, 
            bundleType, 
            consentData
        );

        // Trigger score recalculation if consent was granted
        if (enabled) {
            try {
                const ScoringEngine = require('../engines/scoring_engine');
                const scoringEngine = new ScoringEngine();
                
                await scoringEngine.scheduleScoreUpdate(req.user.id, {
                    triggerEvents: [{
                        eventType: 'consent_granted',
                        eventData: {
                            bundleType,
                            dataTypes: Object.keys(includes || {}),
                            consentedAt: new Date()
                        }
                    }],
                    priority: 'high'
                });

                console.log(`🔄 Scheduled score recalculation for user ${req.user.id} after ${bundleType} consent`);
            } catch (scoringError) {
                console.error('Error scheduling score update:', scoringError);
                // Don't fail the consent update if scoring fails
            }
        }

        const consentSummary = consentService.generateConsentSummary(updatedConsent);

        res.json({
            success: true,
            message: `${bundleType} consent ${enabled ? 'granted' : 'revoked'} successfully`,
            data: {
                updatedConsent: updatedConsent[bundleType],
                consentSummary: consentSummary[bundleType],
                scoreUpdateScheduled: enabled
            }
        });

    } catch (error) {
        console.error(`Error updating ${req.params.bundleType} consent:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to update consent settings'
        });
    }
});

/**
 * GET /api/scoring-consent/data-preview
 * Preview what data would be included in scoring based on current consent
 */
router.get('/data-preview', async (req, res) => {
    try {
        const consentedData = await consentService.getConsentedUserData(req.user.id);
        const consent = await consentService.getUserConsent(req.user.id);

        // Create a preview of what data is being used
        const dataPreview = {
            basicInfo: {
                included: true,
                data: consentedData.basicInfo,
                reason: 'Always included for account functionality'
            },
            professionalProfile: {
                included: consent.professionalProfile?.enabled || false,
                dataTypes: Object.keys(consentedData.consentedData?.professionalProfile || {}),
                impact: 'Enhances Competency and Opportunity scores'
            },
            assessmentData: {
                included: consent.assessmentData?.enabled || false,
                dataTypes: Object.keys(consent.assessmentData?.includes || {})
                    .filter(key => consent.assessmentData.includes[key]),
                impact: 'Provides foundation for all 5-dimension scores'
            },
            behavioralTracking: {
                included: consent.behavioralTracking?.enabled || false,
                dataTypes: Object.keys(consent.behavioralTracking?.includes || {})
                    .filter(key => consent.behavioralTracking.includes[key]),
                impact: 'Core data for Commitment and Growth Readiness scores'
            },
            externalIntegrations: {
                included: consent.externalIntegrations?.enabled || false,
                dataTypes: Object.keys(consent.externalIntegrations?.includes || {})
                    .filter(key => consent.externalIntegrations.includes[key]),
                impact: 'Enhanced market engagement and network analysis'
            }
        };

        res.json({
            success: true,
            data: {
                dataPreview,
                totalDataSources: Object.values(dataPreview)
                    .reduce((count, bundle) => count + (bundle.included ? 1 : 0), 0),
                privacyLevel: consent.professionalProfile?.enabled ? 'Standard' : 'High Privacy',
                lastUpdated: Math.max(
                    ...Object.values(consent)
                        .map(bundle => bundle.consentedAt ? new Date(bundle.consentedAt).getTime() : 0)
                )
            }
        });

    } catch (error) {
        console.error('Error generating data preview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate data preview'
        });
    }
});

/**
 * POST /api/scoring-consent/revoke-all
 * Revoke all consent and reset to minimum data usage
 */
router.post('/revoke-all', async (req, res) => {
    try {
        const { keepAssessments = true } = req.body;

        // Get default minimal consent
        const defaultConsent = consentService.getDefaultConsent();
        
        if (!keepAssessments) {
            defaultConsent.assessmentData.enabled = false;
            Object.keys(defaultConsent.assessmentData.includes).forEach(key => {
                defaultConsent.assessmentData.includes[key] = false;
            });
        }

        // Update all bundles to minimal consent
        const updatePromises = Object.keys(defaultConsent).map(bundleType => 
            consentService.updateConsent(req.user.id, bundleType, defaultConsent[bundleType])
        );

        await Promise.all(updatePromises);

        const updatedConsent = await consentService.getUserConsent(req.user.id);
        const consentSummary = consentService.generateConsentSummary(updatedConsent);

        res.json({
            success: true,
            message: 'All consent settings reset to minimum data usage',
            data: {
                updatedConsent,
                consentSummary,
                assessmentsKept: keepAssessments
            }
        });

    } catch (error) {
        console.error('Error revoking all consent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to revoke consent settings'
        });
    }
});

/**
 * GET /api/scoring-consent/impact-analysis
 * Analyze the impact of current consent settings on scoring accuracy
 */
router.get('/impact-analysis', async (req, res) => {
    try {
        const consent = await consentService.getUserConsent(req.user.id);
        
        // Calculate scoring completeness based on consent
        const impactAnalysis = {
            overallCompleteness: 0,
            dimensionImpact: {
                commitment: {
                    completeness: 0.7, // Base from behavioral tracking
                    missingData: [],
                    potentialBoost: 0
                },
                clarity: {
                    completeness: 0.6, // Base from basic vision data
                    missingData: [],
                    potentialBoost: 0
                },
                growthReadiness: {
                    completeness: 0.8, // High from behavioral patterns
                    missingData: [],
                    potentialBoost: 0
                },
                competency: {
                    completeness: 0.3, // Low without professional data
                    missingData: [],
                    potentialBoost: 0
                },
                opportunity: {
                    completeness: 0.2, // Very low without network data
                    missingData: [],
                    potentialBoost: 0
                }
            },
            recommendations: []
        };

        // Analyze professional profile impact
        if (!consent.professionalProfile?.enabled) {
            impactAnalysis.dimensionImpact.competency.missingData.push('Professional bio and projects');
            impactAnalysis.dimensionImpact.competency.potentialBoost += 0.3;
            impactAnalysis.dimensionImpact.opportunity.missingData.push('Professional network presence');
            impactAnalysis.dimensionImpact.opportunity.potentialBoost += 0.4;
            
            impactAnalysis.recommendations.push({
                priority: 'high',
                message: 'Enable Professional Profile to significantly boost Competency and Opportunity scores',
                estimatedImprovement: '30-40% increase in professional dimensions'
            });
        }

        // Analyze assessment data impact
        if (!consent.assessmentData?.enabled) {
            Object.keys(impactAnalysis.dimensionImpact).forEach(dimension => {
                impactAnalysis.dimensionImpact[dimension].missingData.push('Vision and assessment insights');
                impactAnalysis.dimensionImpact[dimension].potentialBoost += 0.2;
            });
            
            impactAnalysis.recommendations.push({
                priority: 'critical',
                message: 'Assessment data provides foundation for all scores. Enable for best accuracy.',
                estimatedImprovement: '20% increase across all dimensions'
            });
        }

        // Calculate overall completeness
        const dimensionScores = Object.values(impactAnalysis.dimensionImpact)
            .map(dim => dim.completeness);
        impactAnalysis.overallCompleteness = 
            dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length;

        res.json({
            success: true,
            data: impactAnalysis
        });

    } catch (error) {
        console.error('Error analyzing consent impact:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze consent impact'
        });
    }
});

module.exports = router;