// Enhanced visionScoringService.js - Updated backend integration
const llamaService = require('./llamaService');
const { VisionAnalysisService } = require('./scoringIntegration');
const { VisionScore, VisionFeedback } = require('../models/visionData');

class EnhancedVisionScoringService {
  constructor() {
    // Shared llamaService handles OpenAI or Ollama based on configuration
    this.ollama = llamaService;
    this.localAnalyzer = new VisionAnalysisService();
  }

  async analyzeVisionData(visionData) {
    const startTime = Date.now();
    
    try {
      // First run local comprehensive analysis
      const localAnalysis = await this.localAnalyzer.analyzeVision(visionData);
      
      // Then enhance with LLM if available
      let llmAnalysis = null;
      const isOllamaAvailable = await this.ollama.isAvailable();
      if (isOllamaAvailable) {
        try {
          llmAnalysis = await this.getLLMEnhancement(visionData, localAnalysis);
        } catch (error) {
          console.warn('LLM enhancement failed, using local analysis:', error.message);
        }
      }

      // Combine analyses
      const finalAnalysis = this.combineAnalyses(localAnalysis, llmAnalysis);
      
      // Store in database
      await this.storeAnalysisResults(visionData.userId, finalAnalysis);
      
      return {
        ...finalAnalysis,
        processingTime: Date.now() - startTime,
        analysisVersion: '2.0',
        enhancementUsed: llmAnalysis ? 'LLM_ENHANCED' : 'LOCAL_ONLY'
      };

    } catch (error) {
      console.error('Vision analysis error:', error);
      
      // Fallback to basic local analysis
      const fallbackAnalysis = this.localAnalyzer.generateFallbackAnalysis(visionData.responses);
      await this.storeAnalysisResults(visionData.userId, fallbackAnalysis, 'FALLBACK');
      
      return fallbackAnalysis;
    }
  }

  async getLLMEnhancement(visionData, localAnalysis) {
    const prompt = this.buildEnhancementPrompt(visionData, localAnalysis);
    
    const systemPrompt = `You are an expert career coach reviewing a comprehensive analysis. Your task is to:
1. Validate the local analysis findings
2. Provide additional nuanced insights
3. Suggest refinements to recommendations
4. Identify any missed patterns or insights

Return a JSON object with:
{
  "validationScore": number (0-100, how accurate you think the local analysis is),
  "additionalInsights": ["insight1", "insight2"],
  "refinedRecommendations": ["rec1", "rec2"],
  "missedPatterns": ["pattern1", "pattern2"],
  "confidenceBoost": number (-10 to +10, adjustment to confidence),
  "personalizedMessage": "enhanced message based on deeper understanding"
}`;

    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    const result = await this.ollama.generateCompletion(fullPrompt, {
      temperature: 0.7,
      max_tokens: 800,  // Reduced for faster response
      timeout: 60000    // 1 minute timeout
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Try to parse JSON response
    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : result.response;
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.warn('Failed to parse LLM JSON response:', parseError.message);
      // Return a fallback structure
      return {
        validationScore: 75,
        additionalInsights: ["Analysis validated by local processing"],
        refinedRecommendations: ["Continue with current recommendations"],
        missedPatterns: [],
        confidenceBoost: 0,
        personalizedMessage: "Your vision analysis shows good potential for success."
      };
    }
  }

  buildEnhancementPrompt(visionData, localAnalysis) {
    return `
Please review and enhance this vision analysis:

USER RESPONSES SUMMARY:
- Dream: "${visionData.responses.dream}"
- Timeline: ${visionData.responses.timeline}
- Importance: ${visionData.responses.importance}
- Readiness: ${visionData.responses.readiness}
- Belief Level: ${visionData.responses.beliefLevel}/7

LOCAL ANALYSIS RESULTS:
- Overall Score: ${localAnalysis.scores.overall}%
- Persona: ${localAnalysis.persona.type} - ${localAnalysis.persona.description}
- Risk Level: ${localAnalysis.riskLevel}
- Success Probability: ${localAnalysis.successProbability.percentage}%

KEY FINDINGS:
- Strengths: ${localAnalysis.insights.strengths.join(', ')}
- Red Flags: ${localAnalysis.insights.redFlags.join(', ')}
- Risk Factors: ${localAnalysis.insights.riskFactors.join(', ')}

CURRENT RECOMMENDATIONS:
${localAnalysis.recommendations.map(r => `${r.title}: ${r.actions.join(', ')}`).join('\n')}

Please provide validation and enhancements to this analysis.
    `;
  }

  combineAnalyses(localAnalysis, llmAnalysis) {
    if (!llmAnalysis) return localAnalysis;

    // Adjust confidence based on LLM validation
    const confidenceAdjustment = llmAnalysis.confidenceBoost || 0;
    const adjustedProbability = Math.max(0, Math.min(100, 
      localAnalysis.successProbability.percentage + confidenceAdjustment
    ));

    return {
      ...localAnalysis,
      
      // Enhanced success probability
      successProbability: {
        ...localAnalysis.successProbability,
        percentage: adjustedProbability,
        llmValidation: llmAnalysis.validationScore,
        confidence: llmAnalysis.validationScore > 80 ? 'HIGH' : 
                   llmAnalysis.validationScore > 60 ? 'MEDIUM' : 'LOW'
      },

      // Enhanced insights
      insights: {
        ...localAnalysis.insights,
        additionalInsights: llmAnalysis.additionalInsights || [],
        missedPatterns: llmAnalysis.missedPatterns || [],
        llmValidated: true
      },

      // Enhanced recommendations
      recommendations: this.mergeRecommendations(
        localAnalysis.recommendations, 
        llmAnalysis.refinedRecommendations || []
      ),

      // Enhanced personalized message
      personalizedMessage: llmAnalysis.personalizedMessage || localAnalysis.personalizedMessage,
      
      // Analysis metadata
      analysisQuality: {
        localScore: localAnalysis.scores.overall,
        llmValidation: llmAnalysis.validationScore,
        combined: true
      }
    };
  }

  mergeRecommendations(localRecs, llmRecs) {
    // Add LLM refinements as a new category
    const enhanced = [...localRecs];
    
    if (llmRecs.length > 0) {
      enhanced.push({
        timeframe: 'STRATEGIC',
        title: 'AI-Enhanced Insights',
        actions: llmRecs
      });
    }

    return enhanced;
  }

  async storeAnalysisResults(userId, analysis, status = 'SUCCESS') {
    try {
      // Store in VisionScore model
      const visionScore = new VisionScore({
        userId,
        scores: analysis.scores,
        overall: analysis.scores.overall,
        persona: analysis.persona,
        riskLevel: analysis.riskLevel,
        successProbability: analysis.successProbability,
        analysisVersion: '2.0',
        status,
        timestamp: new Date()
      });

      await visionScore.save();

      // Store detailed feedback in VisionFeedback model
      const feedback = new VisionFeedback({
        userId,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        learningPath: analysis.learningPath,
        criticalSuccess: analysis.criticalSuccess,
        readinessLevel: analysis.readinessLevel,
        recommendedTimeline: analysis.recommendedTimeline,
        timestamp: new Date()
      });

      await feedback.save();

      console.log(`Vision analysis stored for user ${userId}`);
      
    } catch (error) {
      console.error('Failed to store vision analysis:', error);
      // Don't throw - analysis was successful even if storage failed
    }
  }

  // API endpoint integration
  static setupRoutes(app) {
    // Enhanced analysis endpoint
    app.post('/api/vision/analyze', async (req, res) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findByToken(token);
        if (!user) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        // Get vision data
        const visionData = await VisionData.findOne({ userId: user._id });
        if (!visionData) {
          return res.status(404).json({ error: 'No vision data found' });
        }

        // Run enhanced analysis
        const scoringService = new EnhancedVisionScoringService();
        const analysis = await scoringService.analyzeVisionData({
          ...visionData.toObject(),
          userId: user._id
        });

        res.json({
          success: true,
          analysis,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Vision analysis API error:', error);
        res.status(500).json({ 
          error: 'Analysis failed',
          details: error.message 
        });
      }
    });

    // Get analysis results endpoint
    app.get('/api/vision/results', async (req, res) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findByToken(token);
        if (!user) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        // Get latest analysis results
        const [visionScore, visionFeedback] = await Promise.all([
          VisionScore.findOne({ userId: user._id }).sort({ timestamp: -1 }),
          VisionFeedback.findOne({ userId: user._id }).sort({ timestamp: -1 })
        ]);

        if (!visionScore) {
          return res.status(404).json({ error: 'No analysis results found' });
        }

        res.json({
          scores: visionScore.scores,
          overall: visionScore.overall,
          persona: visionScore.persona,
          riskLevel: visionScore.riskLevel,
          successProbability: visionScore.successProbability,
          insights: visionFeedback?.insights || {},
          recommendations: visionFeedback?.recommendations || [],
          learningPath: visionFeedback?.learningPath || {},
          criticalSuccess: visionFeedback?.criticalSuccess || [],
          readinessLevel: visionFeedback?.readinessLevel || {},
          recommendedTimeline: visionFeedback?.recommendedTimeline || {},
          analysisVersion: visionScore.analysisVersion,
          timestamp: visionScore.timestamp
        });

      } catch (error) {
        console.error('Get results API error:', error);
        res.status(500).json({ 
          error: 'Failed to retrieve results',
          details: error.message 
        });
      }
    });

    // Analysis history endpoint
    app.get('/api/vision/history', async (req, res) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findByToken(token);
        if (!user) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        const history = await VisionScore.find({ userId: user._id })
          .sort({ timestamp: -1 })
          .limit(10)
          .select('scores overall persona riskLevel timestamp analysisVersion');

        res.json({ history });

      } catch (error) {
        console.error('History API error:', error);
        res.status(500).json({ 
          error: 'Failed to retrieve history',
          details: error.message 
        });
      }
    });

    // Detailed report endpoint
    app.get('/api/vision/report', async (req, res) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findByToken(token);
        if (!user) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        // Get comprehensive data
        const [visionData, visionScore, visionFeedback] = await Promise.all([
          VisionData.findOne({ userId: user._id }),
          VisionScore.findOne({ userId: user._id }).sort({ timestamp: -1 }),
          VisionFeedback.findOne({ userId: user._id }).sort({ timestamp: -1 })
        ]);

        if (!visionData || !visionScore) {
          return res.status(404).json({ error: 'Insufficient data for report' });
        }

        // Generate comprehensive report
        const report = {
          userProfile: {
            dream: visionData.responses.dream,
            timeline: visionData.responses.timeline,
            importance: visionData.responses.importance,
            readiness: visionData.responses.readiness
          },
          analysis: {
            scores: visionScore.scores,
            overall: visionScore.overall,
            persona: visionScore.persona,
            riskLevel: visionScore.riskLevel,
            successProbability: visionScore.successProbability
          },
          feedback: visionFeedback ? {
            insights: visionFeedback.insights,
            recommendations: visionFeedback.recommendations,
            learningPath: visionFeedback.learningPath,
            criticalSuccess: visionFeedback.criticalSuccess
          } : null,
          metadata: {
            analysisDate: visionScore.timestamp,
            version: visionScore.analysisVersion,
            completedAt: visionData.completedAt
          }
        };

        res.json(report);

      } catch (error) {
        console.error('Report API error:', error);
        res.status(500).json({ 
          error: 'Failed to generate report',
          details: error.message 
        });
      }
    });
  }
}

module.exports = { EnhancedVisionScoringService };