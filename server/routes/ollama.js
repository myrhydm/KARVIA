/**
 * Ollama API Routes - Local LLM integration
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const OllamaService = require('../services/ollama');

const ollama = new OllamaService();

// @route   GET /api/ollama/status
// @desc    Check Ollama service status
// @access  Private
router.get('/status', auth, async (req, res) => {
    try {
        const testResult = await ollama.testConnection();
        res.json({
            available: testResult.success,
            models: testResult.models,
            response: testResult.response,
            error: testResult.error
        });
    } catch (error) {
        console.error('Error checking Ollama status:', error);
        res.status(500).json({ 
            error: 'Failed to check Ollama status',
            details: error.message 
        });
    }
});

// @route   GET /api/ollama/models
// @desc    Get available Ollama models
// @access  Private
router.get('/models', auth, async (req, res) => {
    try {
        const models = await ollama.getModels();
        res.json({ models });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ 
            error: 'Failed to fetch models',
            details: error.message 
        });
    }
});

// @route   POST /api/ollama/generate
// @desc    Generate text completion using Ollama
// @access  Private
router.post('/generate', auth, async (req, res) => {
    try {
        const { prompt, model, temperature, max_tokens, system } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const result = await ollama.generateCompletion(prompt, {
            model,
            temperature,
            max_tokens,
            system
        });

        if (result.success) {
            res.json({
                response: result.response,
                model: result.model,
                created_at: result.created_at
            });
        } else {
            res.status(500).json({ 
                error: 'Generation failed',
                details: result.error 
            });
        }
    } catch (error) {
        console.error('Error generating text:', error);
        res.status(500).json({ 
            error: 'Failed to generate text',
            details: error.message 
        });
    }
});

// @route   POST /api/ollama/chat
// @desc    Chat with Ollama model
// @access  Private
router.post('/chat', auth, async (req, res) => {
    try {
        const { messages, model, temperature } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const result = await ollama.chat(messages, {
            model,
            temperature
        });

        if (result.success) {
            res.json({
                message: result.message,
                model: result.model,
                created_at: result.created_at
            });
        } else {
            res.status(500).json({ 
                error: 'Chat failed',
                details: result.error 
            });
        }
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ 
            error: 'Failed to process chat',
            details: error.message 
        });
    }
});

// @route   POST /api/ollama/analyze-goals
// @desc    Analyze user goals using Ollama
// @access  Private
router.post('/analyze-goals', auth, async (req, res) => {
    try {
        const { goals, userContext } = req.body;

        if (!goals || goals.length === 0) {
            return res.status(400).json({ error: 'Goals are required for analysis' });
        }

        const prompt = `
Analyze the following goals and provide insights:

Goals: ${goals.map(g => `- ${g.title}: ${g.description}`).join('\n')}

${userContext ? `User Context: ${userContext}` : ''}

Please provide:
1. Goal clarity assessment
2. Achievability analysis
3. Suggestions for improvement
4. Priority recommendations

Keep the response concise and actionable.
        `.trim();

        const result = await ollama.generateCompletion(prompt, {
            system: 'You are a helpful goal achievement coach. Provide practical, encouraging advice.',
            max_tokens: 800
        });

        if (result.success) {
            res.json({
                analysis: result.response,
                model: result.model
            });
        } else {
            res.status(500).json({ 
                error: 'Analysis failed',
                details: result.error 
            });
        }
    } catch (error) {
        console.error('Error analyzing goals:', error);
        res.status(500).json({ 
            error: 'Failed to analyze goals',
            details: error.message 
        });
    }
});

module.exports = router;