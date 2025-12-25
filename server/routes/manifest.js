const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const logger = require('../utils/logger');

// POST /api/manifest
// Body: { objective: string }
// Response: { keyResults: [string], timeline: string }
router.post('/', async (req, res) => {
    const { objective } = req.body;
    if (!objective || typeof objective !== 'string') {
        return res.status(400).json({ error: 'Objective is required.' });
    }

    // Calculate timeline (3 months from now)
    const today = new Date();
    const timeline = new Date(today.setMonth(today.getMonth() + 3)).toISOString().split('T')[0];

    try {
        // Generate key results using LLM
        const prompt = `Given the following personal goal/objective, generate exactly 4 specific, measurable key results that would help achieve it. Return ONLY a JSON array of strings, no other text.

Objective: "${objective}"

Example format: ["Key result 1", "Key result 2", "Key result 3", "Key result 4"]`;

        const result = await llmService.generateContent(prompt, {
            maxTokens: 500,
            temperature: 0.7
        });

        if (result.success && result.content) {
            try {
                // Parse JSON from LLM response
                const content = result.content.trim();
                // Extract JSON array from response (handle markdown code blocks)
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const keyResults = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(keyResults) && keyResults.length > 0) {
                        logger.info({ objective: objective.substring(0, 50) }, 'Generated key results via LLM');
                        return res.json({ keyResults, timeline, source: 'llm' });
                    }
                }
            } catch (parseError) {
                logger.warn({ error: parseError.message }, 'Failed to parse LLM response, using fallback');
            }
        }
    } catch (llmError) {
        logger.warn({ error: llmError.message }, 'LLM generation failed, using fallback');
    }

    // Fallback: Generate contextual mock response based on objective keywords
    const keyResults = generateFallbackKeyResults(objective);
    logger.info({ objective: objective.substring(0, 50) }, 'Using fallback key results');

    res.json({
        keyResults,
        timeline,
        source: 'fallback'
    });
});

// Generate contextual fallback key results based on objective
function generateFallbackKeyResults(objective) {
    const lowerObjective = objective.toLowerCase();

    // Learning/skill-based objectives
    if (lowerObjective.includes('learn') || lowerObjective.includes('skill') || lowerObjective.includes('course')) {
        return [
            'Complete a structured learning program or course',
            'Build a hands-on project demonstrating the new skill',
            'Document learnings through notes or blog posts',
            'Apply the skill in a real-world scenario or job application'
        ];
    }

    // Career/job-based objectives
    if (lowerObjective.includes('job') || lowerObjective.includes('career') || lowerObjective.includes('employ')) {
        return [
            'Update resume and LinkedIn profile',
            'Apply to at least 5 relevant positions',
            'Complete 3 informational interviews',
            'Prepare and practice for technical interviews'
        ];
    }

    // Business/startup objectives
    if (lowerObjective.includes('business') || lowerObjective.includes('startup') || lowerObjective.includes('launch')) {
        return [
            'Validate the idea with 10 potential customers',
            'Create a minimum viable product (MVP)',
            'Establish initial marketing channels',
            'Acquire first paying customers'
        ];
    }

    // Health/fitness objectives
    if (lowerObjective.includes('health') || lowerObjective.includes('fitness') || lowerObjective.includes('weight')) {
        return [
            'Establish a consistent exercise routine',
            'Track nutrition and meals daily',
            'Achieve measurable fitness milestone',
            'Build sustainable healthy habits'
        ];
    }

    // Default generic key results
    return [
        'Define clear milestones for the objective',
        'Create a structured action plan',
        'Track progress weekly with metrics',
        'Review and adjust approach based on results'
    ];
}

module.exports = router;
