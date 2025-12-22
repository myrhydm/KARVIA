/**
 * Dream Parser API Routes
 * Handles dream parsing and analysis endpoints
 */

const express = require('express');
const router = express.Router();
const dreamParser = require('../services/dreamParser');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/dream-parser/parse
 * Parse a natural language dream into structured data
 */
router.post('/parse', authenticateToken, async (req, res) => {
    try {
        const { dreamText, confidence, timeHorizon } = req.body;

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

        // Parse the dream
        const result = await dreamParser.parseDream(
            dreamText.trim(),
            confidence || 50,
            timeHorizon || 12
        );

        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: 'Dream parsed successfully'
            });
        } else {
            res.status(422).json({
                success: false,
                error: result.error,
                fallbackData: result.fallbackData,
                message: 'Dream parsing failed, fallback data provided'
            });
        }
    } catch (error) {
        console.error('Error in dream parsing endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to parse dream'
        });
    }
});

/**
 * POST /api/dream-parser/classify
 * Classify a dream as employee or entrepreneur focused
 */
router.post('/classify', authenticateToken, async (req, res) => {
    try {
        const { dreamText } = req.body;

        if (!dreamText || dreamText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Dream text is required'
            });
        }

        const classification = await dreamParser.classifyDreamType(dreamText.trim());

        res.json({
            success: true,
            data: {
                dreamType: classification,
                confidence: classification === 'entrepreneur' ? 0.8 : 0.8 // Simplified confidence
            },
            message: 'Dream classified successfully'
        });
    } catch (error) {
        console.error('Error in dream classification endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to classify dream'
        });
    }
});

/**
 * GET /api/dream-parser/examples
 * Get example dreams for testing and inspiration
 */
router.get('/examples', authenticateToken, async (req, res) => {
    try {
        const examples = dreamParser.getExampleDreams();
        
        res.json({
            success: true,
            data: examples,
            message: 'Example dreams retrieved successfully'
        });
    } catch (error) {
        console.error('Error retrieving example dreams:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to retrieve examples'
        });
    }
});

/**
 * POST /api/dream-parser/validate
 * Validate a parsed dream structure
 */
router.post('/validate', authenticateToken, async (req, res) => {
    try {
        const { parsedDream } = req.body;

        if (!parsedDream || typeof parsedDream !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Parsed dream object is required'
            });
        }

        // Calculate quality score and insights
        const qualityScore = dreamParser.calculateQualityScore(parsedDream);
        const insights = dreamParser.generateInsights(parsedDream);

        res.json({
            success: true,
            data: {
                qualityScore,
                insights,
                isValid: qualityScore > 0.3,
                recommendations: insights.recommendations
            },
            message: 'Dream validation completed'
        });
    } catch (error) {
        console.error('Error in dream validation endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to validate dream'
        });
    }
});

/**
 * POST /api/dream-parser/enhance
 * Enhance a dream with additional structured data
 */
router.post('/enhance', authenticateToken, async (req, res) => {
    try {
        const { dreamText, existingData } = req.body;

        if (!dreamText) {
            return res.status(400).json({
                success: false,
                error: 'Dream text is required'
            });
        }

        // Parse the dream with enhanced context
        const result = await dreamParser.parseDream(
            dreamText.trim(),
            existingData?.confidence || 50,
            existingData?.timeHorizon || 12
        );

        if (result.success) {
            // Merge with existing data if provided
            if (existingData) {
                Object.keys(existingData).forEach(key => {
                    if (existingData[key] && !result.data[key]) {
                        result.data[key] = existingData[key];
                    }
                });
                
                // Recalculate quality score with merged data
                result.data.qualityScore = dreamParser.calculateQualityScore(result.data);
                result.data.insights = dreamParser.generateInsights(result.data);
            }

            res.json({
                success: true,
                data: result.data,
                message: 'Dream enhanced successfully'
            });
        } else {
            res.status(422).json({
                success: false,
                error: result.error,
                fallbackData: result.fallbackData,
                message: 'Dream enhancement failed'
            });
        }
    } catch (error) {
        console.error('Error in dream enhancement endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to enhance dream'
        });
    }
});

/**
 * GET /api/dream-parser/schema
 * Get the dream parsing schema for frontend validation
 */
router.get('/schema', authenticateToken, async (req, res) => {
    try {
        const { 
            EMPLOYEE_DREAM_SCHEMA, 
            ENTREPRENEUR_DREAM_SCHEMA, 
            INDUSTRY_VERTICALS, 
            TECH_FOCUS_AREAS 
        } = require('../config/dreamLanguage');

        res.json({
            success: true,
            data: {
                employeeSchema: EMPLOYEE_DREAM_SCHEMA,
                entrepreneurSchema: ENTREPRENEUR_DREAM_SCHEMA,
                industryVerticals: INDUSTRY_VERTICALS,
                techFocusAreas: TECH_FOCUS_AREAS
            },
            message: 'Schema retrieved successfully'
        });
    } catch (error) {
        console.error('Error retrieving schema:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to retrieve schema'
        });
    }
});

module.exports = router;