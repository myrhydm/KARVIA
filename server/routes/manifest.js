const express = require('express');
const router = express.Router();

// POST /api/manifest
// Body: { objective: string }
// Response: { keyResults: [string], timeline: string }
router.post('/', async (req, res) => {
    const { objective } = req.body;
    if (!objective || typeof objective !== 'string') {
        return res.status(400).json({ error: 'Objective is required.' });
    }

    // TODO: Integrate with LLM. For now, mock response.
    // Example: "I want to learn RAG to upskill myself and be more employable in top companies like Google, Meta, Amazon"
    const today = new Date();
    const timeline = new Date(today.setMonth(today.getMonth() + 3)).toISOString().split('T')[0]; // 3 months from now
    const keyResults = [
        'Complete an online RAG course',
        'Build and deploy a RAG demo project',
        'Publish a blog post about RAG learnings',
        'Apply to 3 jobs at top tech companies'
    ];

    res.json({
        keyResults,
        timeline
    });
});

module.exports = router; 