// === 4. COMPREHENSIVE ANALYSIS ===
// comprehensiveAnalysis.js
/**
 * Comprehensive analysis combining scoring engine results with LLM insights
 */

const { ProfessionalReadinessEngine } = require('./scoringEngine');
const { LLMInsights } = require('./llmInsights');
const { PROFESSIONAL_READINESS_DIMENSIONS } = require('./scoringRules');

class ComprehensiveAnalysis {
  constructor(openaiApiKey = null) {
    this.scoringEngine = new ProfessionalReadinessEngine();
    this.llmInsights = new LLMInsights(openaiApiKey);
    this.dimensions = PROFESSIONAL_READINESS_DIMENSIONS;
  }

  /**
   * Generate comprehensive professional readiness analysis
   */
  async generateAnalysis(userResponses, resumeKeywords = []) {
    const startTime = Date.now();

    try {
      // Step 1: Run core scoring engine
      const scoringResults = this.scoringEngine.calculateReadinessScore(
        userResponses, 
        resumeKeywords
      );

      // Step 2: Get LLM enhancement
      const llmEnhancement = await this.llmInsights.getEnhancedInsights(
        userResponses,
        scoringResults,
        this.dimensions
      );

      // Step 3: Combine into comprehensive analysis
      const comprehensiveAnalysis = this.synthesizeAnalysis(
        userResponses,
        scoringResults, 
        llmEnhancement
      );

      // Step 4: Generate actionable recommendations
      const recommendations = this.generateRecommendations(
        scoringResults,
        llmEnhancement,
        userResponses
      );

      return {
        ...comprehensiveAnalysis,
        recommendations,
        processingTime: Date.now() - startTime,
        analysisVersion: '3.0',
        enhancementType: llmEnhancement.llmEnhanced ? 'LLM_ENHANCED' : 'FALLBACK'
      };

    } catch (error) {
      console.error('Comprehensive analysis error:', error);
      return this.generateErrorFallback(userResponses, error);
    }
  }

  /**
   * Synthesize scoring results with LLM insights
   */
  synthesizeAnalysis(userResponses, scoringResults, llmEnhancement) {
    const { dimensionScores, overallScore, readinessLevel, insights, riskAssessment } = scoringResults;

    // Adjust scores based on LLM confidence boost
    const adjustedOverallScore = llmEnhancement.confidence.adjustedScore;
    const confidenceLevel = this.determineConfidenceLevel(
      llmEnhancement.validation.score,
      riskAssessment.level
    );

    return {
      // User profile summary
      profile: {
        dream: userResponses.dream,
        timeline: userResponses.timeline,
        importance: userResponses.importance,
        readiness: userResponses.readiness,
        beliefLevel: userResponses.beliefLevel
      },

      // Enhanced scoring results
      assessment: {
        overallScore: adjustedOverallScore,
        originalScore: overallScore,
        confidenceLevel,
        readinessLevel: {
          ...readinessLevel,
          adjusted: this.adjustReadinessLevel(readinessLevel, adjustedOverallScore)
        }
      },

      // Dimension breakdown with enhanced insights
      dimensions: this.enhanceDimensionData(dimensionScores, llmEnhancement),

      // Synthesized insights
      insights: {
        // Core insights from scoring engine
        strengths: [...insights.strengths, ...llmEnhancement.enhancedInsights.hiddenStrengths],
        weaknesses: [...insights.weaknesses, ...llmEnhancement.enhancedInsights.blindSpots],
        riskFactors: insights.riskFactors,
        
        // Enhanced insights from LLM
        keyInsights: llmEnhancement.enhancedInsights.keyInsights,
        successPredictors: llmEnhancement.enhancedInsights.successPredictors,
        
        // Validation
        llmValidation: llmEnhancement.validation
      },

      // Risk assessment
      risks: {
        level: riskAssessment.level,
        factors: riskAssessment.factors,
        mitigations: [
          ...riskAssessment.mitigation,
          ...llmEnhancement.actionPlan.riskMitigations
        ]
      },

      // Strategic recommendations
      strategy: llmEnhancement.strategy,

      // Personalized messaging
      personalizedMessage: llmEnhancement.personalizedMessage,

      // Metadata
      metadata: {
        timestamp: new Date().toISOString(),
        llmEnhanced: llmEnhancement.llmEnhanced,
        validationScore: llmEnhancement.validation.score
      }
    };
  }

  /**
   * Enhance dimension data with detailed insights
   */
  enhanceDimensionData(dimensionScores, llmEnhancement) {
    const enhancedDimensions = {};

    Object.entries(this.dimensions).forEach(([key, dimensionInfo]) => {
      const score = dimensionScores[key];
      const performance = this.categorizePerformance(score);

      enhancedDimensions[key] = {
        ...dimensionInfo,
        score,
        performance,
        percentile: this.calculatePercentile(score),
        developmentPriority: this.getDevelopmentPriority(score, key, llmEnhancement),
        specificActions: this.getSpecificActions(key, score, llmEnhancement)
      };
    });

    return enhancedDimensions;
  }

  /**
   * Categorize performance level
   */
  categorizePerformance(score) {
    if (score >= 80) return { level: 'EXCELLENT', description: 'Strong competitive advantage' };
    if (score >= 65) return { level: 'GOOD', description: 'Solid foundation with minor gaps' };
    if (score >= 45) return { level: 'DEVELOPING', description: 'Needs focused improvement' };
    return { level: 'NEEDS_WORK', description: 'Requires significant development' };
  }

  /**
   * Calculate approximate percentile
   */
  calculatePercentile(score) {
    // Simplified percentile estimation (could be enhanced with real data)
    if (score >= 85) return 90;
    if (score >= 75) return 75;
    if (score >= 65) return 60;
    if (score >= 50) return 40;
    if (score >= 35) return 25;
    return 10;
  }

  /**
   * Determine development priority
   */
  getDevelopmentPriority(score, dimension, llmEnhancement) {
    const isInSkillPriorities = llmEnhancement.actionPlan.skillPriorities
      .some(priority => priority.toLowerCase().includes(dimension));

    if (score < 40 || isInSkillPriorities) return 'HIGH';
    if (score < 60) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get specific actions for dimension
   */
  getSpecificActions(dimension, score, llmEnhancement) {
    const baseActions = {
      skills: [
        'Complete technical skills assessment',
        'Enroll in relevant online courses',
        'Build practice projects',
        'Seek feedback from experts'
      ],
      knowledge: [
        'Read industry publications weekly',
        'Follow thought leaders',
        'Attend webinars/conferences',
        'Interview professionals in field'
      ],
      network: [
        'Join professional associations',
        'Attend networking events',
        'Engage on professional platforms',
        'Seek informational interviews'
      ],
      foundation: [
        'Document achievements with metrics',
        'Build portfolio of work',
        'Seek leadership opportunities',
        'Get professional references'
      ],
      mindset: [
        'Set incremental goals',
        'Practice stress management',
        'Build support system',
        'Develop growth mindset practices'
      ]
    };

    const actions = baseActions[dimension] || [];
    
    // Add LLM-specific recommendations if available
    const llmActions = llmEnhancement.actionPlan.immediate
      .filter(action => action.toLowerCase().includes(dimension));

    return [...actions.slice(0, 3), ...llmActions];
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(scoringResults, llmEnhancement, userResponses) {
    const { dimensionScores, readinessLevel } = scoringResults;
    const weakestAreas = Object.entries(dimensionScores)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 2);

    return {
      immediate: {
        title: 'Next 7 Days',
        timeframe: 'IMMEDIATE',
        actions: [
          ...llmEnhancement.actionPlan.immediate.slice(0, 2),
          `Focus development on ${weakestAreas[0][0]} (${weakestAreas[0][1]}%)`
        ]
      },

      shortTerm: {
        title: 'Next 30 Days', 
        timeframe: 'SHORT_TERM',
        actions: [
          `Develop ${weakestAreas[0][0]} through targeted learning`,
          `Build ${weakestAreas[1][0]} capabilities systematically`,
          'Create development tracking system',
          'Establish weekly progress check-ins'
        ]
      },

      mediumTerm: {
        title: 'Next 90 Days',
        timeframe: 'MEDIUM_TERM', 
        actions: [
          'Complete comprehensive skill development plan',
          'Build industry network connections',
          'Achieve first major milestone',
          'Reassess and adjust strategy based on progress'
        ]
      },

      strategic: {
        title: 'Strategic Focus',
        timeframe: 'ONGOING',
        actions: [
          llmEnhancement.strategy.career,
          llmEnhancement.strategy.networking,
          'Monitor progress across all dimensions',
          'Continuously refine professional development plan'
        ]
      }
    };
  }

  /**
   * Determine overall confidence level
   */
  determineConfidenceLevel(llmValidation, riskLevel) {
    if (llmValidation >= 85 && riskLevel === 'LOW') return 'HIGH';
    if (llmValidation >= 70 && riskLevel !== 'HIGH') return 'MEDIUM-HIGH';
    if (llmValidation >= 60) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Adjust readiness level based on enhanced scoring
   */
  adjustReadinessLevel(originalLevel, adjustedScore) {
    if (adjustedScore >= 80) return 'READY_TO_LAUNCH';
    if (adjustedScore >= 65) return 'PREPARATION_PHASE';
    if (adjustedScore >= 45) return 'DEVELOPMENT_NEEDED';
    return 'FOUNDATION_BUILDING';
  }

  /**
   * Generate error fallback analysis
   */
  generateErrorFallback(userResponses, error) {
    return {
      profile: {
        dream: userResponses.dream || 'Not specified',
        timeline: userResponses.timeline || 'Not specified'
      },
      assessment: {
        overallScore: 50,
        confidenceLevel: 'LOW',
        readinessLevel: {
          level: 'ANALYSIS_ERROR',
          description: 'Technical analysis failed - manual review needed'
        }
      },
      insights: {
        strengths: ['Completed comprehensive assessment'],
        weaknesses: ['Technical analysis unavailable'],
        keyInsights: ['Manual review with professional advisor recommended']
      },
      risks: {
        level: 'UNKNOWN',
        factors: ['Analysis system error'],
        mitigations: ['Seek professional career coaching']
      },
      recommendations: {
        immediate: {
          title: 'Next Steps',
          actions: ['Seek manual review with career advisor', 'Document goals clearly']
        }
      },
      error: {
        occurred: true,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Public method for simple scoring without LLM
   */
  async getBasicAnalysis(userResponses, resumeKeywords = []) {
    const scoringResults = this.scoringEngine.calculateReadinessScore(
      userResponses,
      resumeKeywords
    );

    const basicLLMInsights = this.llmInsights.generateFallbackInsights(scoringResults);

    return this.synthesizeAnalysis(userResponses, scoringResults, basicLLMInsights);
  }
}

module.exports = { ComprehensiveAnalysis };