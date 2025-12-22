const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PMAssessmentData, PMAssessmentResult } = require('../models/pmAssessment');
const { PMAssessmentScoring } = require('../services/pmScoringEngine');

const engine = new PMAssessmentScoring();

router.post('/submit', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { responses } = req.body;
    if (!responses) return res.status(400).json({ error: 'Missing responses' });

    const assessment = new PMAssessmentData({ userId, responses });
    await assessment.save();

    const resultData = engine.scoreAssessment(responses);

    const result = new PMAssessmentResult({
      userId,
      assessmentId: assessment._id,
      dimensionScores: resultData.dimensionScores,
      readinessLevel: resultData.readinessLevel
    });
    await result.save();

    res.json({ success: true, scores: result.dimensionScores, readiness: result.readinessLevel });
  } catch (err) {
    console.error('PM assessment submit error:', err);
    res.status(500).json({ error: 'Failed to process assessment', details: err.message });
  }
});

router.get('/results', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await PMAssessmentResult.findOne({ userId }).sort({ createdAt: -1 }).populate('assessmentId');
    if (!result) return res.status(404).json({ error: 'No assessment found' });

    res.json({
      responses: result.assessmentId.responses,
      scores: result.dimensionScores,
      readiness: result.readinessLevel,
      completedAt: result.assessmentId.completedAt
    });
  } catch (err) {
    console.error('PM assessment results error:', err);
    res.status(500).json({ error: 'Failed to retrieve assessment', details: err.message });
  }
});

module.exports = router;
