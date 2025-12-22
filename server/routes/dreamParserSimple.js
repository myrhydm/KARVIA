/**
 * Simplified Dream Parser Routes for Frontend Integration
 * Provides basic endpoints that work without LLM integration
 */

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

/**
 * POST /api/dream-parser/parse
 * Parse a natural language dream into structured data (simplified)
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

        // Simple parsing logic based on keywords
        const text = dreamText.toLowerCase();
        const isEntrepreneur = text.includes('startup') || text.includes('launch') || text.includes('found') || text.includes('business') || text.includes('company');
        
        // Mock parsed data
        const parsedData = {
            mode: isEntrepreneur ? 'entrepreneur' : 'employee',
            originalText: dreamText.trim(),
            confidence: confidence || 50,
            timeHorizon: timeHorizon || 12,
            qualityScore: 0.8,
            extractedFields: {
                role: extractRole(dreamText),
                industry: extractIndustry(dreamText),
                skills: extractSkills(dreamText),
                market: extractMarket(dreamText)
            },
            insights: {
                strengths: ['Clear vision', 'Specific timeline', 'Actionable goals'],
                opportunities: ['Network building', 'Skill development', 'Market research'],
                recommendations: ['Break down into smaller milestones', 'Find mentors in the field', 'Start building relevant skills']
            },
            createdAt: new Date()
        };

        res.json({
            success: true,
            data: parsedData,
            message: 'Dream parsed successfully'
        });
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

        // Simple classification logic
        const text = dreamText.toLowerCase();
        const entrepreneurKeywords = ['startup', 'launch', 'found', 'business', 'company', 'entrepreneur', 'venture'];
        const hasEntrepreneurKeywords = entrepreneurKeywords.some(keyword => text.includes(keyword));

        const classification = hasEntrepreneurKeywords ? 'entrepreneur' : 'employee';

        res.json({
            success: true,
            data: {
                dreamType: classification,
                confidence: 0.85
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
        const examples = {
            employee: [
                {
                    title: "AI Product Manager at Tech Company",
                    text: "I want to become an AI Product Manager at Anthropic, working on Claude and leading a team of 5-10 engineers to build consumer AI experiences that help millions of people be more productive.",
                    category: "Technology"
                },
                {
                    title: "Senior Software Engineer",
                    text: "I want to become a Senior Software Engineer at Google, specializing in machine learning infrastructure and contributing to projects that advance AI research.",
                    category: "Engineering"
                }
            ],
            entrepreneur: [
                {
                    title: "Tech Startup",
                    text: "I want to start a business that helps people solve everyday challenges through innovative products and services.",
                    category: "Business & Entrepreneurship"
                },
                {
                    title: "EdTech Platform",
                    text: "I want to found an educational technology company that uses adaptive learning algorithms to personalize coding education for children aged 8-16.",
                    category: "Education"
                }
            ]
        };
        
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

// Helper methods
function extractRole(text) {
    const roleKeywords = {
        'product manager': 'Product Manager',
        'software engineer': 'Software Engineer',
        'data scientist': 'Data Scientist',
        'designer': 'Designer',
        'founder': 'Founder',
        'ceo': 'CEO',
        'cto': 'CTO'
    };

    for (const [keyword, role] of Object.entries(roleKeywords)) {
        if (text.toLowerCase().includes(keyword)) {
            return role;
        }
    }
    return 'Professional';
}

function extractIndustry(text) {
    const industryKeywords = {
        'ai': 'Artificial Intelligence',
        'tech': 'Technology',
        'health': 'Healthcare',
        'education': 'Education',
        'finance': 'Finance',
        'wellness': 'Health & Wellness'
    };

    for (const [keyword, industry] of Object.entries(industryKeywords)) {
        if (text.toLowerCase().includes(keyword)) {
            return industry;
        }
    }
    return 'General';
}

function extractSkills(text) {
    const skills = [];
    const skillKeywords = ['leadership', 'management', 'coding', 'design', 'ai', 'machine learning', 'product'];
    
    skillKeywords.forEach(skill => {
        if (text.toLowerCase().includes(skill)) {
            skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
    });

    return skills.length > 0 ? skills : ['Professional Development'];
}

function extractMarket(text) {
    if (text.toLowerCase().includes('b2b') || text.toLowerCase().includes('business')) {
        return 'B2B';
    }
    if (text.toLowerCase().includes('consumer') || text.toLowerCase().includes('people')) {
        return 'B2C';
    }
    return 'B2C';
}

module.exports = router;