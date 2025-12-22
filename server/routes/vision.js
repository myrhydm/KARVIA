// routes/vision.js
const express = require('express');
const router = express.Router();
const { VisionData, VisionScore, VisionFeedback } = require('../models/visionData');
const { EnhancedVisionScoringService } = require('../services/visionScoringService');
const { EnhancedVisionScoringEngine } = require('../services/enhancedVisionScoring');
const authMiddleware = require('../middleware/auth'); // Assuming you have auth middleware
const multer = require('multer');
const { extractKeywords } = require('../utils/keywordExtractor');
const { getResumeText } = require('../utils/resumeParser');

const upload = multer({ dest: 'uploads/' });

async function extractResumeKeywords(file) {
  if (!file) return [];
  try {
    const text = await getResumeText(file.path);
    return extractKeywords(text);
  } catch (err) {
    console.error('Resume parse error:', err);
    return [];
  }
}

const scoringService = new EnhancedVisionScoringService();

// Submit vision questionnaire
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { responses } = req.body;

    // Validate required fields
    if (!responses || !responses.dream || !responses.why) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['dream', 'why', 'importance', 'timeline']
      });
    }

    // Check if user already has vision data (update vs create)
    let visionData = await VisionData.findOne({ userId });
    
    if (visionData) {
      // Update existing
      visionData.responses = responses;
      visionData.completedAt = new Date();
      await visionData.save();
    } else {
      // Create new
      visionData = new VisionData({
        userId,
        responses
      });
      await visionData.save();
    }

    // Generate scores and analysis
    const analysis = await scoringService.analyzeVisionData(visionData);

    // Save scores
    let visionScore = await VisionScore.findOne({ userId });
    if (visionScore) {
      Object.assign(visionScore, {
        visionDataId: visionData._id,
        scores: analysis.scores,
        analysis: analysis.analysis,
        personalizedMessage: analysis.personalizedMessage,
        llmModel: analysis.llmModel,
        processingTime: analysis.processingTime,
        generatedAt: new Date()
      });
      await visionScore.save();
    } else {
      visionScore = new VisionScore({
        userId,
        visionDataId: visionData._id,
        scores: analysis.scores,
        analysis: analysis.analysis,
        personalizedMessage: analysis.personalizedMessage,
        llmModel: analysis.llmModel,
        processingTime: analysis.processingTime
      });
      await visionScore.save();
    }

    // Save feedback
    let visionFeedback = await VisionFeedback.findOne({ userId });
    if (visionFeedback) {
      Object.assign(visionFeedback, {
        visionDataId: visionData._id,
        keyStrengths: analysis.keyStrengths,
        improvementAreas: analysis.improvementAreas,
        nextSteps: analysis.nextSteps,
        risks: analysis.risks
      });
      await visionFeedback.save();
    } else {
      visionFeedback = new VisionFeedback({
        userId,
        visionDataId: visionData._id,
        keyStrengths: analysis.keyStrengths,
        improvementAreas: analysis.improvementAreas,
        nextSteps: analysis.nextSteps,
        risks: analysis.risks
      });
      await visionFeedback.save();
    }

    res.json({
      success: true,
      visionDataId: visionData._id,
      scores: analysis.scores,
      message: 'Vision assessment completed successfully'
    });

  } catch (error) {
    console.error('Vision submission error:', error);
    res.status(500).json({ 
      error: 'Failed to process vision assessment',
      details: error.message 
    });
  }
});

// Get user's vision results
router.get('/results', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [visionData, visionScore, visionFeedback] = await Promise.all([
      VisionData.findOne({ userId }).sort({ completedAt: -1 }),
      VisionScore.findOne({ userId }).sort({ generatedAt: -1 }),
      VisionFeedback.findOne({ userId }).sort({ createdAt: -1 })
    ]);

    if (!visionData) {
      return res.status(404).json({ error: 'No vision assessment found' });
    }

    res.json({
      visionData: {
        id: visionData._id,
        completedAt: visionData.completedAt,
        responses: visionData.responses
      },
      scores: visionScore ? visionScore.scores : null,
      analysis: visionScore ? visionScore.analysis : null,
      personalizedMessage: visionScore ? visionScore.personalizedMessage : null,
      feedback: visionFeedback ? {
        keyStrengths: visionFeedback.keyStrengths,
        improvementAreas: visionFeedback.improvementAreas,
        nextSteps: visionFeedback.nextSteps,
        risks: visionFeedback.risks
      } : null
    });

  } catch (error) {
    console.error('Vision results error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve vision results',
      details: error.message 
    });
  }
});

// Get vision history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const visionHistory = await VisionData
      .find({ userId })
      .sort({ completedAt: -1 })
      .limit(limit)
      .select('completedAt responses.importance responses.timeline responses.readiness');

    const scoreHistory = await VisionScore
      .find({ userId })
      .sort({ generatedAt: -1 })
      .limit(limit)
      .select('scores generatedAt');

    res.json({
      assessments: visionHistory,
      scores: scoreHistory
    });

  } catch (error) {
    console.error('Vision history error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve vision history',
      details: error.message 
    });
  }
});

// Delete vision data
router.delete('/data', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await Promise.all([
      VisionData.deleteMany({ userId }),
      VisionScore.deleteMany({ userId }),
      VisionFeedback.deleteMany({ userId })
    ]);

    res.json({ success: true, message: 'Vision data deleted successfully' });

  } catch (error) {
    console.error('Vision deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete vision data',
      details: error.message 
    });
  }
});

// ================================
// ADD THESE ENDPOINTS TO server/routes/vision.js
// ================================

// Import Ollama service
const OllamaService = require('../services/ollama');
const ollama = new OllamaService();

// Save vision data only (no analysis)
router.post('/save', authMiddleware, upload.single('resume'), async (req, res) => {
    try {
        const userId = req.user.id;
        let { responses } = req.body;
        if (typeof responses === 'string') {
            try { responses = JSON.parse(responses); } catch (e) { responses = {}; }
        }
        if (!responses) responses = {};
        if (req.file) {
            responses.resume = req.file.path;
        }
        const resumeKeywords = await extractResumeKeywords(req.file);

        // Validate required fields - be more flexible for partial saves
        if (!responses || Object.keys(responses).length === 0) {
            return res.status(400).json({ 
                error: 'No responses provided',
                required: ['At least one response field is required']
            });
        }

        // Check if user already has vision data (one per user)
        let visionData = await VisionData.findOne({ userId });
        
        if (visionData) {
            // Update existing vision
            visionData.responses = responses;
            visionData.resumeKeywords = resumeKeywords;
            visionData.completedAt = new Date();
            await visionData.save();
        } else {
            // Create new vision
            visionData = new VisionData({
                userId,
                responses,
                resumeKeywords
            });
            await visionData.save();
        }

        res.json({
            success: true,
            message: 'Vision saved successfully',
            visionId: visionData._id,
            isUpdate: !!visionData
        });

    } catch (error) {
        console.error('Vision save error:', error);
        res.status(500).json({ 
            error: 'Failed to save vision',
            details: error.message 
        });
    }
});

// Get user's vision data (for editing)
router.get('/data', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const visionData = await VisionData.findOne({ userId }).sort({ completedAt: -1 });

        if (!visionData) {
            return res.status(404).json({ error: 'No vision data found' });
        }

        res.json({
            id: visionData._id,
            responses: visionData.responses,
            completedAt: visionData.completedAt,
            version: visionData.version
        });

    } catch (error) {
        console.error('Vision data error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve vision data',
            details: error.message 
        });
    }
});

// Analyze vision with Enhanced Scoring Engine
router.post('/analyze', authMiddleware, upload.single('resume'), async (req, res) => {
    try {
        const userId = req.user.id;
        let { responses } = req.body;
        if (typeof responses === 'string') {
            try { responses = JSON.parse(responses); } catch (e) { responses = {}; }
        }
        if (!responses) responses = {};
        if (req.file) {
            responses.resume = req.file.path;
        }
        const resumeKeywords = await extractResumeKeywords(req.file);
        const startTime = Date.now();

        // Get or create vision data
        let visionData = await VisionData.findOne({ userId });
        if (!visionData) {
            visionData = new VisionData({
                userId,
                responses,
                resumeKeywords
            });
            await visionData.save();
        } else {
            visionData.responses = responses;
            visionData.resumeKeywords = resumeKeywords;
            await visionData.save();
        }

        // Use Enhanced Scoring Engine
        const enhancedScorer = new EnhancedVisionScoringEngine();
        const analysis = await enhancedScorer.scoreVision(responses, resumeKeywords);

        // Transform analysis to match expected format with enhanced intelligence
        const transformedAnalysis = {
            scores: {
                // Map new dimensions to old format for compatibility
                motivation: analysis.scores.mindset || 50,
                readiness: analysis.scores.execution || 50,
                experience: analysis.scores.competency || 50,
                confidence: analysis.scores.network || 50,
                overall: analysis.scores.overall || 50,
                // Add new dimensions
                competency: analysis.scores.competency || 50,
                network: analysis.scores.network || 50,
                mindset: analysis.scores.mindset || 50,
                execution: analysis.scores.execution || 50,
                opportunities: analysis.scores.opportunities || 50
            },
            analysis: {
                strengths: analysis.insights.strengths || [],
                growthAreas: analysis.insights.growth_areas || [],
                recommendations: analysis.insights.recommendations || [],
                riskFactors: analysis.insights.risk_factors || [],
                successPredictors: (analysis.successPredictors || []).map(p => p.description || p.factor || 'Success factor identified'),
                personalityInsights: analysis.insights.personality_insights || [],
                successFactors: analysis.insights.success_factors || [],
                nextSteps: analysis.insights.next_steps || []
            },
            personalizedMessage: generatePersonalizedMessage(analysis),
            keyStrengths: (analysis.insights.strengths || []).map(strength => ({
                category: 'Core Strength',
                description: strength,
                impact: 'high'
            })),
            improvementAreas: (analysis.insights.growth_areas || []).map(area => ({
                category: 'Development Focus',
                description: area,
                priority: 'high',
                actionable: true
            })),
            nextSteps: (analysis.insights.next_steps || []).map((step, index) => ({
                step: step,
                timeframe: index === 0 ? 'immediate' : index === 1 ? 'week' : 'month',
                difficulty: 'medium'
            })),
            risks: (analysis.riskFactors || []).map(risk => ({
                risk: risk.factor,
                likelihood: risk.severity,
                mitigation: risk.mitigation
            })),
            // Enhanced data
            psychologicalProfile: analysis.psychologicalProfile,
            responseAnalysis: analysis.responseAnalysis,
            successPredictors: analysis.successPredictors,
            riskFactors: analysis.riskFactors,
            keywords: analysis.keywords,
            processingTime: analysis.processingTime,
            method: analysis.method
        };

        // Save analysis results
        await saveEnhancedAnalysisResults(userId, visionData._id, transformedAnalysis, analysis.processingTime);

        res.json({
            success: true,
            message: 'Vision analyzed successfully with intelligent correlation analysis',
            processingTime: analysis.processingTime,
            model: analysis.method,
            dimensions: Object.keys(analysis.scores),
            analysisQuality: {
                completeness: analysis.responseAnalysis?.responseMetrics?.completeness?.overall || 0,
                psychologicalDepth: analysis.psychologicalProfile ? 'high' : 'basic',
                correlationInsights: (analysis.correlationInsights || []).length
            }
        });

    } catch (error) {
        console.error('Enhanced vision analysis error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze vision',
            details: error.message 
        });
    }
});

// Helper function to build OpenAI prompt
function buildAnalysisPrompt(responses, keywords = []) {
    return `
Please analyze this vision questionnaire response:

VISION & MOTIVATION:
- Dream: "${responses.dream}"
- Why now: "${responses.why}"
- Importance level: ${responses.importance}
- Timeline: ${responses.timeline}

WORK STYLE:
- Time commitment: ${responses.timeCommitment}
- Work traits: ${responses.workTraits?.join(', ') || 'None specified'}
- Intensity: ${responses.intensity}
- Learning style: ${responses.learningStyle}

FOUNDATION:
- Readiness: ${responses.readiness}
- Why they'll succeed: "${responses.whySucceed}"
- Past lessons: "${responses.pastLessons || 'None provided'}"

KNOWLEDGE & EXPERIENCE:
- Industry trends knowledge: ${responses.industryTrends}/5
- Competitive landscape: ${responses.competitive}/5
- Business models: ${responses.businessModels}/5
- Real impact: "${responses.realImpact}"
- Decision level: ${responses.decisionLevel}

ASSETS & ATTRIBUTES:
- Digital presence: Blog: ${responses.blog || 'None'}, Twitter: ${responses.twitter || 'None'}
- Projects: "${responses.projects || 'None'}"
- Unique value: ${responses.uniqueValue?.join(', ') || 'None specified'}
- Deep motivation: "${responses.deepMotivation}"
- Starting projects ability: ${responses.startingProjects}/5
- Handling obstacles: ${responses.handlingObstacles}/5
- Risk tolerance: ${responses.riskTolerance}

REALITY CHECK:
- Time reality: "${responses.timeReality}"
- Financial situation: ${responses.financial}
- Support system: ${responses.support?.join(', ') || 'None specified'}
- Self-doubt: "${responses.selfDoubt}"
- Gut feeling confidence: ${responses.gutFeeling}/100
- Belief level: ${responses.beliefLevel}/7
  - What would help belief: "${responses.beliefHelp || 'None provided'}"

Résumé keywords: ${keywords.join(', ') || 'None'}

Please provide a comprehensive analysis with scores and actionable insights.
    `;
}

// Helper function to save analysis results
async function saveAnalysisResults(userId, visionDataId, analysis, processingTime) {
    // Save scores
    let visionScore = await VisionScore.findOne({ userId });
    if (visionScore) {
        Object.assign(visionScore, {
            visionDataId,
            scores: analysis.scores,
            analysis: analysis.analysis,
            personalizedMessage: analysis.personalizedMessage,
            llmModel: 'llama3.2:latest',
            processingTime,
            generatedAt: new Date()
        });
        await visionScore.save();
    } else {
        visionScore = new VisionScore({
            userId,
            visionDataId,
            scores: analysis.scores,
            analysis: analysis.analysis,
            personalizedMessage: analysis.personalizedMessage,
            llmModel: 'llama3.2:latest',
            processingTime
        });
        await visionScore.save();
    }

    // Save feedback
    let visionFeedback = await VisionFeedback.findOne({ userId });
    if (visionFeedback) {
        Object.assign(visionFeedback, {
            visionDataId,
            keyStrengths: analysis.keyStrengths,
            improvementAreas: analysis.improvementAreas,
            nextSteps: analysis.nextSteps,
            risks: analysis.risks
        });
        await visionFeedback.save();
    } else {
        visionFeedback = new VisionFeedback({
            userId,
            visionDataId,
            keyStrengths: analysis.keyStrengths,
            improvementAreas: analysis.improvementAreas,
            nextSteps: analysis.nextSteps,
            risks: analysis.risks
        });
        await visionFeedback.save();
    }
}

// Helper function to generate personalized message
function generatePersonalizedMessage(analysis) {
    const { scores, psychologicalProfile, successPredictors } = analysis;
    const overall = scores?.overall || 0;
    
    let message = `Your vision analysis reveals `;
    
    if (overall >= 80) {
        message += `exceptional potential across key dimensions. `;
    } else if (overall >= 70) {
        message += `strong potential across key dimensions. `;
    } else if (overall >= 60) {
        message += `good foundation across key dimensions. `;
    } else {
        message += `developing foundation across key dimensions. `;
    }
    
    // Add personality-specific insights
    if (psychologicalProfile) {
        switch (psychologicalProfile.personalityType) {
            case 'achiever-executor':
                message += `Your achievement-oriented nature and execution capabilities are significant assets. `;
                break;
            case 'strategic-thinker':
                message += `Your strategic thinking and market awareness provide a strong foundation. `;
                break;
            case 'passion-driven':
                message += `Your passion and purpose-driven approach will sustain long-term motivation. `;
                break;
        }
    }
    
    // Add top success predictor
    const topPredictor = (successPredictors || []).find(p => p.strength === 'high');
    if (topPredictor) {
        message += `Your ${(topPredictor.factor || 'identified strength').toLowerCase()} is a key strength to leverage. `;
    }
    
    message += `Focus on developing your growth areas while building on your strongest dimensions.`;
    
    return message;
}

// Helper function to save enhanced analysis results
async function saveEnhancedAnalysisResults(userId, visionDataId, analysis, processingTime) {
    try {
        // Save scores with enhanced dimensions using findOneAndUpdate for atomic operation
        await VisionScore.findOneAndUpdate(
            { userId },
            {
                visionDataId,
                scores: analysis.scores,
                analysis: analysis.analysis,
                personalizedMessage: analysis.personalizedMessage,
                llmModel: analysis.method,
                processingTime,
                generatedAt: new Date(),
                keywords: analysis.keywords,
                dimensions: ['competency', 'network', 'mindset', 'execution', 'opportunities']
            },
            { upsert: true, new: true }
        );

        // Save feedback using findOneAndUpdate for atomic operation
        await VisionFeedback.findOneAndUpdate(
            { userId },
            {
                visionDataId,
                keyStrengths: analysis.keyStrengths,
                improvementAreas: analysis.improvementAreas,
                nextSteps: analysis.nextSteps,
                risks: analysis.risks
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error saving enhanced analysis results:', error);
        throw error;
    }
}

// Basic rule-based scoring used when the LLM is unavailable
function calculateFallbackScores(responses) {
    // Motivation Score
    let motivation = 50;
    if (responses.importance === 'obsessed') motivation = 95;
    else if (responses.importance === 'committed') motivation = 80;
    else if (responses.importance === 'interested') motivation = 65;
    else if (responses.importance === 'curious') motivation = 45;

    if (responses.beliefLevel >= 6) motivation += 10;
    else if (responses.beliefLevel <= 3) motivation -= 10;

    // Readiness Score
    let readiness = 50;
    if (responses.readiness === 'unstoppable') readiness = 90;
    else if (responses.readiness === 'ready') readiness = 75;
    else if (responses.readiness === 'exploring') readiness = 45;

    if (responses.timeReality && responses.timeReality.length > 50) readiness += 10;
    if (responses.financial === 'flexible') readiness += 15;
    else if (responses.financial === 'tight') readiness -= 10;

    // Experience Score
    const domainAvg = ((responses.industryTrends || 3) +
                      (responses.competitive || 3) +
                      (responses.businessModels || 3)) / 3;
    let experience = domainAvg * 20;

    if (responses.decisionLevel === 'ownership') experience += 20;
    else if (responses.decisionLevel === 'strategic') experience += 15;
    else if (responses.decisionLevel === 'tactical') experience += 10;

    if (responses.realImpact && responses.realImpact.length > 100) experience += 15;

    // Confidence Score
    let confidence = responses.gutFeeling || 50;
    if (responses.handlingObstacles >= 4) confidence += 15;
    if (responses.startingProjects >= 4) confidence += 10;

    const overall = (motivation + readiness + experience + confidence) / 4;

    return {
        motivation: Math.min(Math.max(motivation, 0), 100),
        readiness: Math.min(Math.max(readiness, 0), 100),
        experience: Math.min(Math.max(experience, 0), 100),
        confidence: Math.min(Math.max(confidence, 0), 100),
        overall: Math.min(Math.max(overall, 0), 100)
    };
}

function generateFallbackInsights(responses, scores) {
    const strengths = identifyStrengths(responses);
    const growthAreas = identifyGrowthAreas(responses);
    const recommendations = generateRecommendations(responses);

    return {
        scores,
        analysis: {
            strengths,
            growthAreas,
            recommendations,
            riskFactors: ['Limited backend analysis'],
            successPredictors: ['Completed comprehensive assessment']
        },
        personalizedMessage: `Based on your responses, you show ${scores.overall >= 70 ? 'strong potential' : 'good foundation'} for achieving your vision. Your ${scores.motivation >= 80 ? 'high motivation' : 'clear goals'} combined with ${scores.readiness >= 70 ? 'strong readiness' : 'developing preparation'} positions you well for success.`,
        keyStrengths: strengths.map(strength => ({
            category: 'Assessment',
            description: strength,
            impact: 'medium'
        })),
        improvementAreas: growthAreas.map(area => ({
            category: 'Development',
            description: area,
            priority: 'medium',
            actionable: true
        })),
        nextSteps: [
            { step: 'Review your assessment results', timeframe: 'immediate', difficulty: 'easy' },
            { step: 'Set up backend for detailed analysis', timeframe: 'week', difficulty: 'medium' },
            { step: 'Create specific action plan', timeframe: 'week', difficulty: 'medium' }
        ],
        risks: [
            { risk: 'Limited detailed analysis without backend', likelihood: 'medium', mitigation: 'Implement full backend system' }
        ]
    };
}

function identifyStrengths(responses) {
    const strengths = [];

    if (responses.importance === 'obsessed' || responses.importance === 'committed') {
        strengths.push('Strong motivation and commitment');
    }

    if (responses.readiness === 'unstoppable') {
        strengths.push('High readiness to take action');
    }

    if (responses.beliefLevel >= 6) {
        strengths.push('Strong self-belief');
    }

    if (responses.uniqueValue && responses.uniqueValue.length >= 3) {
        strengths.push('Multiple unique value propositions');
    }

    if (responses.riskTolerance === 'seeker' || responses.riskTolerance === 'comfortable') {
        strengths.push('Good risk tolerance');
    }

    if (responses.support && responses.support.length >= 2) {
        strengths.push('Strong support system');
    }

    if (responses.handlingObstacles >= 4) {
        strengths.push('Excellent at handling obstacles');
    }

    return strengths.length > 0 ? strengths : ['Completed comprehensive self-assessment'];
}

function identifyGrowthAreas(responses) {
    const growthAreas = [];

    if ((responses.industryTrends || 3) < 3) {
        growthAreas.push('Build industry knowledge');
    }

    if (!responses.timeReality || responses.timeReality.length < 30) {
        growthAreas.push('Define realistic time commitments');
    }

    if (responses.beliefLevel <= 4) {
        growthAreas.push('Build confidence and self-belief');
    }

    if (responses.financial === 'tight') {
        growthAreas.push('Consider financial planning');
    }

    if (!responses.support || responses.support.length === 0) {
        growthAreas.push('Build support network');
    }

    if (responses.gutFeeling < 60) {
        growthAreas.push('Address self-doubt and increase confidence');
    }

    return growthAreas.length > 0 ? growthAreas : ['Continue developing your vision'];
}

function generateRecommendations(responses) {
    const recommendations = [];

    if (responses.timeline === 'sprint') {
        recommendations.push('Focus on quick wins to build momentum');
    }

    if (responses.learningStyle === 'handson') {
        recommendations.push('Start with practical projects over theoretical study');
    }

    if (responses.intensity === 'beast') {
        recommendations.push('Channel your high energy into structured action plans');
    }

    if (responses.timeCommitment === 'micro') {
        recommendations.push('Break goals into 15-30 minute daily actions');
    }

    recommendations.push('Set up backend integration for detailed AI analysis');
    recommendations.push('Create weekly review sessions to track progress');

    return recommendations;
}

// Fallback analysis function
function generateFallbackAnalysis(userId, visionDataId, responses, res) {
    // Use the same logic as in the frontend fallback
    const scores = calculateFallbackScores(responses);
    const analysis = generateFallbackInsights(responses, scores);

    // Save fallback results to database
    saveAnalysisResults(userId, visionDataId, analysis, 100);

    res.json({
        success: true,
        message: 'Vision analyzed with fallback method',
        processingTime: 100,
        model: 'fallback'
    });
}

// Update existing results endpoint to include more data
router.get('/results', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [visionData, visionScore, visionFeedback] = await Promise.all([
            VisionData.findOne({ userId }).sort({ completedAt: -1 }),
            VisionScore.findOne({ userId }).sort({ generatedAt: -1 }),
            VisionFeedback.findOne({ userId }).sort({ createdAt: -1 })
        ]);

        if (!visionData) {
            return res.status(404).json({ error: 'No vision assessment found' });
        }

        res.json({
            visionData: {
                id: visionData._id,
                completedAt: visionData.completedAt,
                responses: visionData.responses
            },
            scores: visionScore ? visionScore.scores : null,
            analysis: visionScore ? visionScore.analysis : null,
            personalizedMessage: visionScore ? visionScore.personalizedMessage : null,
            feedback: visionFeedback ? {
                keyStrengths: visionFeedback.keyStrengths,
                improvementAreas: visionFeedback.improvementAreas,
                nextSteps: visionFeedback.nextSteps,
                risks: visionFeedback.risks
            } : null,
            hasAnalysis: !!visionScore,
            analysisDate: visionScore ? visionScore.generatedAt : null
        });

    } catch (error) {
        console.error('Vision results error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve vision results',
            details: error.message 
        });
    }
});

module.exports = router;
