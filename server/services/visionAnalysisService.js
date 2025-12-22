// visionAnalysisService.js
/**
 * Integration example and utility functions for the comprehensive scoring engine
 */

const { calculateScores } = require('./scoreCalculator');
const { mapScores } = require('./scoreMapper');

class VisionAnalysisService {
  /**
   * Main analysis function that processes vision questionnaire responses
   */
  async analyzeVision(visionData) {
    try {
      // Extract responses and resume keywords
      const { responses } = visionData;
      const resumeKeywords = await this.extractResumeKeywords(visionData.resumeFile);

      // Run comprehensive scoring
      const analysis = calculateScores(responses, resumeKeywords);

      // Map detailed scores to high-level dimensions
      analysis.dimensions = mapScores(analysis.scores);

      // Enhance with additional insights
      const enhancedAnalysis = this.enhanceAnalysis(analysis, responses);

      // Generate personalized recommendations
      const recommendations = this.generateRecommendations(enhancedAnalysis, responses);

      // Create final report
      return {
        ...enhancedAnalysis,
        recommendations,
        timestamp: new Date().toISOString(),
        version: '2.0'
      };

    } catch (error) {
      console.error('Vision analysis error:', error);
      return this.generateFallbackAnalysis(visionData.responses);
    }
  }

  /**
   * Extract keywords from resume file
   */
  async extractResumeKeywords(resumeFile) {
    if (!resumeFile) return [];

    try {
      const { getResumeText } = require('../utils/resumeParser');
      const { extractKeywords } = require('../utils/keywordExtractor');

      const text = await getResumeText(resumeFile);
      return extractKeywords(text);
    } catch (error) {
      console.error('Resume parsing error:', error);
      return [];
    }
  }

  /**
   * Enhance the basic analysis with additional insights
   */
  enhanceAnalysis(analysis, responses) {
    // Add persona classification
    const persona = this.classifyPersona(analysis.scores, responses);
    
    // Add readiness level
    const readinessLevel = this.determineReadinessLevel(analysis.scores);
    
    // Add timeline recommendations
    const timelineRec = this.recommendTimeline(analysis.scores, responses);
    
    // Add learning path suggestions
    const learningPath = this.suggestLearningPath(analysis.scores, responses);

    return {
      ...analysis,
      persona,
      readinessLevel,
      recommendedTimeline: timelineRec,
      learningPath,
      criticalSuccess: this.identifyCriticalSuccessFactors(analysis, responses)
    };
  }

  /**
   * Classify user persona based on scores and responses
   */
  classifyPersona(scores, responses) {
    const { visionClarity, motivationAuthenticity, executionReadiness, foundationStrength } = scores;

    // High vision, high execution
    if (visionClarity >= 70 && executionReadiness >= 70) {
      return {
        type: 'EXECUTOR',
        description: 'Clear vision with strong execution capability',
        strengths: ['Strategic thinking', 'Action-oriented', 'Goal clarity'],
        challenges: ['May need to pace themselves', 'Risk of burnout']
      };
    }

    // High motivation, low execution
    if (motivationAuthenticity >= 70 && executionReadiness < 50) {
      return {
        type: 'DREAMER',
        description: 'Strong motivation but needs execution support',
        strengths: ['High passion', 'Clear why', 'Inspiring vision'],
        challenges: ['Turning ideas into action', 'Time management', 'Breaking down goals']
      };
    }

    // High foundation, low motivation
    if (foundationStrength >= 70 && motivationAuthenticity < 50) {
      return {
        type: 'BUILDER',
        description: 'Strong capabilities but needs motivation boost',
        strengths: ['Technical skills', 'Experience', 'Practical knowledge'],
        challenges: ['Finding passion', 'Setting compelling goals', 'Taking risks']
      };
    }

    // Low across the board
    if (Math.max(visionClarity, motivationAuthenticity, executionReadiness, foundationStrength) < 50) {
      return {
        type: 'EXPLORER',
        description: 'Early stage - needs foundation building',
        strengths: ['Open to learning', 'Honest self-assessment', 'Growth potential'],
        challenges: ['Everything - needs systematic development']
      };
    }

    // Balanced but moderate
    return {
      type: 'BALANCED',
      description: 'Well-rounded profile with steady potential',
      strengths: ['Consistent across areas', 'Realistic expectations', 'Stable progress'],
      challenges: ['May lack standout strengths', 'Needs to find unique edge']
    };
  }

  /**
   * Determine overall readiness level
   */
  determineReadinessLevel(scores) {
    const overall = scores.overall;
    
    if (overall >= 80) {
      return {
        level: 'READY_TO_LAUNCH',
        description: 'Ready for immediate action on ambitious goals',
        timeframe: '0-30 days to start',
        confidence: 'HIGH'
      };
    } else if (overall >= 65) {
      return {
        level: 'PREPARATION_PHASE',
        description: 'Nearly ready - needs focused preparation',
        timeframe: '1-3 months preparation',
        confidence: 'MEDIUM-HIGH'
      };
    } else if (overall >= 45) {
      return {
        level: 'DEVELOPMENT_NEEDED',
        description: 'Significant development required before launch',
        timeframe: '3-6 months development',
        confidence: 'MEDIUM'
      };
    } else {
      return {
        level: 'FOUNDATION_BUILDING',
        description: 'Focus on building fundamental capabilities',
        timeframe: '6+ months foundation work',
        confidence: 'LOW'
      };
    }
  }

  /**
   * Recommend optimal timeline based on analysis
   */
  recommendTimeline(scores, responses) {
    const { executionReadiness, foundationStrength, environmentSupport } = scores;
    const currentTimeline = responses.timeline;

    // Calculate recommended timeline
    let recommended = 'marathon'; // default
    
    if (executionReadiness >= 75 && foundationStrength >= 70) {
      recommended = 'sprint';
    } else if (executionReadiness < 50 || foundationStrength < 50) {
      recommended = 'mountain';
    }

    const timelineMatch = currentTimeline === recommended;

    return {
      current: currentTimeline,
      recommended,
      match: timelineMatch,
      reasoning: this.getTimelineReasoning(recommended, scores),
      adjustment: timelineMatch ? null : this.getTimelineAdjustment(currentTimeline, recommended)
    };
  }

  getTimelineReasoning(timeline, scores) {
    const reasons = {
      'sprint': 'High execution readiness and strong foundation support rapid progress',
      'marathon': 'Balanced approach allows steady progress while building capabilities', 
      'mountain': 'Significant foundation building needed before major progress'
    };
    return reasons[timeline];
  }

  getTimelineAdjustment(current, recommended) {
    if (current === 'sprint' && recommended === 'marathon') {
      return 'Consider extending timeline to build stronger foundation';
    } else if (current === 'sprint' && recommended === 'mountain') {
      return 'Current timeline too aggressive - need substantial preparation';
    } else if (current === 'mountain' && recommended === 'sprint') {
      return 'You may be ready to accelerate - consider shorter timeline';
    } else if (current === 'mountain' && recommended === 'marathon') {
      return 'You can likely move faster than planned';
    } else if (current === 'marathon' && recommended === 'sprint') {
      return 'Strong position to accelerate timeline';
    } else if (current === 'marathon' && recommended === 'mountain') {
      return 'Consider extending timeline for better preparation';
    }
    return null;
  }

  /**
   * Suggest personalized learning path
   */
  suggestLearningPath(scores, responses) {
    const weakestAreas = Object.entries(scores)
      .filter(([key]) => key !== 'overall')
      .sort(([,a], [,b]) => a - b)
      .slice(0, 3)
      .map(([key]) => key);

    const learningStyle = responses.learningStyle;
    const path = [];

    // Generate learning suggestions based on weak areas
    weakestAreas.forEach((area, index) => {
      const suggestion = this.getLearningResourcesForArea(area, learningStyle);
      path.push({
        priority: index + 1,
        area: area.replace(/([A-Z])/g, ' $1').toLowerCase(),
        ...suggestion
      });
    });

    return {
      style: learningStyle,
      prioritizedAreas: path,
      estimatedTimeframe: this.estimateLearningTimeframe(path.length, scores.overall)
    };
  }

  getLearningResourcesForArea(area, style) {
    const resources = {
      visionClarity: {
        handson: { type: 'Create vision board and 90-day action plan', duration: '1-2 weeks' },
        research: { type: 'Read "Good Strategy Bad Strategy" + goal-setting courses', duration: '3-4 weeks' },
        community: { type: 'Join goal-setting groups and find accountability partner', duration: '2-3 weeks' },
        structured: { type: 'Complete structured goal-setting program', duration: '4-6 weeks' }
      },
      motivationAuthenticity: {
        handson: { type: 'Journal daily on deeper motivations and interview others in target field', duration: '2-3 weeks' },
        research: { type: 'Study psychology of motivation and read autobiographies', duration: '3-4 weeks' },
        community: { type: 'Join support groups and share story with others', duration: '2-4 weeks' },
        structured: { type: 'Complete motivation assessment and coaching program', duration: '4-8 weeks' }
      },
      executionReadiness: {
        handson: { type: 'Start small project immediately and track daily habits', duration: '2-4 weeks' },
        research: { type: 'Study productivity systems and time management', duration: '2-3 weeks' },
        community: { type: 'Find execution buddy and join productivity communities', duration: '2-3 weeks' },
        structured: { type: 'Complete project management certification', duration: '6-8 weeks' }
      },
      foundationStrength: {
        handson: { type: 'Build portfolio project in target area', duration: '4-8 weeks' },
        research: { type: 'Take foundational courses in target field', duration: '6-12 weeks' },
        community: { type: 'Find mentor and attend industry meetups', duration: '4-6 weeks' },
        structured: { type: 'Complete relevant certification program', duration: '8-16 weeks' }
      },
      knowledgeDepth: {
        handson: { type: 'Research and analyze 10 companies in target space', duration: '3-4 weeks' },
        research: { type: 'Read industry reports and take specialized courses', duration: '6-8 weeks' },
        community: { type: 'Interview industry professionals and join expert communities', duration: '4-6 weeks' },
        structured: { type: 'Complete industry-specific certification', duration: '8-12 weeks' }
      }
    };

    return resources[area]?.[style] || { type: 'General development needed', duration: '4-6 weeks' };
  }

  estimateLearningTimeframe(areas, overallScore) {
    const baseWeeks = areas * 4;
    const multiplier = overallScore < 50 ? 1.5 : overallScore < 70 ? 1.2 : 1.0;
    return Math.ceil(baseWeeks * multiplier);
  }

  /**
   * Identify critical success factors
   */
  identifyCriticalSuccessFactors(analysis, responses) {
    const factors = [];

    // Based on persona and weak areas
    if (analysis.insights.riskFactors.length > 2) {
      factors.push({
        factor: 'Risk Mitigation',
        importance: 'CRITICAL',
        description: 'Address multiple risk factors before proceeding',
        actions: analysis.insights.riskFactors.slice(0, 2)
      });
    }

    if (analysis.scores.environmentSupport < 50) {
      factors.push({
        factor: 'Environment Optimization',
        importance: 'HIGH',
        description: 'Improve support system and remove obstacles',
        actions: ['Build stronger support network', 'Address financial constraints', 'Minimize self-doubt']
      });
    }

    if (analysis.scores.executionReadiness < 60) {
      factors.push({
        factor: 'Execution System',
        importance: 'HIGH',
        description: 'Develop reliable execution habits and systems',
        actions: ['Create daily routine', 'Set up accountability', 'Start with micro-commitments']
      });
    }

    return factors;
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(analysis, responses) {
    const recs = [];

    // Immediate actions (next 7 days)
    recs.push({
      timeframe: 'IMMEDIATE',
      title: 'Next 7 Days',
      actions: this.generateImmediateActions(analysis, responses)
    });

    // Short-term (next 30 days)
    recs.push({
      timeframe: 'SHORT_TERM',
      title: 'Next 30 Days', 
      actions: this.generateShortTermActions(analysis, responses)
    });

    // Medium-term (next 90 days)
    recs.push({
      timeframe: 'MEDIUM_TERM',
      title: 'Next 90 Days',
      actions: this.generateMediumTermActions(analysis, responses)
    });

    return recs;
  }

  generateImmediateActions(analysis, responses) {
    const actions = [];

    if (analysis.insights.redFlags.length > 0) {
      actions.push('Address critical red flags: ' + analysis.insights.redFlags[0]);
    }

    if (analysis.scores.visionClarity < 60) {
      actions.push('Clarify your vision: write one-page detailed description of success');
    }

    if (analysis.scores.executionReadiness < 50) {
      actions.push('Start micro-commitment: dedicate 15 minutes daily to goal-related activity');
    }

    actions.push('Review and validate this analysis with trusted advisor');

    return actions.slice(0, 3); // Max 3 immediate actions
  }

  generateShortTermActions(analysis, responses) {
    const actions = [];

    if (analysis.scores.foundationStrength < 60) {
      actions.push('Complete skills gap analysis and create learning plan');
    }

    if (analysis.scores.environmentSupport < 50) {
      actions.push('Build support network: identify and connect with 3 relevant people');
    }

    if (analysis.scores.knowledgeDepth < 60) {
      actions.push('Conduct industry research: analyze 5 companies/leaders in target space');
    }

    if (analysis.persona.type === 'DREAMER') {
      actions.push('Create detailed project plan with specific milestones');
    }

    return actions.slice(0, 4);
  }

  generateMediumTermActions(analysis, responses) {
    const actions = [];

    actions.push('Execute first major milestone of your plan');
    
    if (analysis.scores.hiddenAssets < 70) {
      actions.push('Build online presence: start blog or showcase project');
    }

    actions.push('Seek feedback and iterate on approach based on real results');
    actions.push('Plan next phase based on 90-day learnings');

    return actions;
  }

  /**
   * Fallback analysis for error cases
   */
  generateFallbackAnalysis(responses) {
    const scores = {
      visionClarity: 50,
      motivationAuthenticity: 50,
      executionReadiness: 50,
      foundationStrength: 50,
      knowledgeDepth: 50,
      hiddenAssets: 50,
      environmentSupport: 50,
      psychologicalProfile: 50,
      overall: 50
    };

    return {
      scores,
      dimensions: mapScores(scores),
      insights: {
        redFlags: ['Analysis system error - manual review needed'],
        inconsistencies: [],
        strengths: ['Completed comprehensive assessment'],
        riskFactors: ['Technical analysis unavailable'],
        successPredictors: ['Commitment to self-evaluation'],
        recommendedFocus: ['Manual review with advisor']
      },
      riskLevel: 'MEDIUM',
      successProbability: { percentage: 50, confidence: 'LOW' },
      feedback: {
        topStrengths: ['Self-awareness through assessment'],
        criticalIssues: ['Technical analysis failed'],
        actionPriorities: ['Seek manual review'],
        riskMitigations: []
      }
    };
  }
}

// Usage example
/*
const analysisService = new VisionAnalysisService();

const sampleResponse = {
  responses: {
    dream: "I want to become a senior software engineer at a top tech company within 2 years...",
    why: "I'm frustrated with my current role and want to prove I can achieve something ambitious...",
    importance: "committed",
    timeline: "marathon",
    // ... all other questionnaire responses
  },
  resumeFile: null // or file object
};

analysisService.analyzeVision(sampleResponse)
  .then(analysis => {
    console.log('Overall Score:', analysis.scores.overall);
    console.log('Persona:', analysis.persona.type);
    console.log('Risk Level:', analysis.riskLevel);
    console.log('Recommendations:', analysis.recommendations);
  });
*/

module.exports = { VisionAnalysisService };
