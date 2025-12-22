// === 3. LLM INSIGHTS ===
// llmInsights.js
/**
 * LLM integration for enhanced feedback and insights
 */

const llamaService = require('./llamaService');

class LLMInsights {
  constructor() {
    // Use shared llamaService which supports multiple LLM providers
    this.ollama = llamaService;
    this.fallbackEnabled = true;
  }

  /**
   * Get enhanced insights from LLM
   */
  async getEnhancedInsights(userResponses, scoringResults, scoringRules) {
    // Check if Ollama is available
    const isAvailable = await this.ollama.isAvailable();
    if (!isAvailable) {
      console.warn('Ollama not available, using fallback insights');
      return this.generateFallbackInsights(scoringResults);
    }

    try {
      const prompt = this.buildInsightPrompt(userResponses, scoringResults, scoringRules);
      const systemPrompt = this.getSystemPrompt();
      
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
      let response;
      try {
        // Extract JSON from response if it's wrapped in markdown or other text
        const jsonMatch = result.response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : result.response;
        response = JSON.parse(jsonString);
      } catch (parseError) {
        console.warn('Failed to parse LLM JSON response, using fallback');
        return this.generateFallbackInsights(scoringResults);
      }

      return this.formatLLMResponse(response, scoringResults);

    } catch (error) {
      console.warn('LLM insights failed, using fallback:', error.message);
      return this.generateFallbackInsights(scoringResults);
    }
  }

  /**
   * Build comprehensive prompt for LLM
   */
  buildInsightPrompt(userResponses, scoringResults, scoringRules) {
    const { dimensionScores, overallScore, readinessLevel, insights } = scoringResults;

    return `
ANALYZE this professional readiness assessment:

USER PROFILE:
- Dream/Goal: "${userResponses.dream}"
- Importance Level: ${userResponses.importance}
- Timeline: ${userResponses.timeline}
- Readiness: ${userResponses.readiness}
- Belief Level: ${userResponses.beliefLevel}/7

SCORING RESULTS:
- Overall Score: ${overallScore}%
- Skills: ${dimensionScores.skills}% (Technical & functional capabilities)
- Knowledge: ${dimensionScores.knowledge}% (Industry expertise & business acumen)  
- Network: ${dimensionScores.network}% (Professional connections & mentors)
- Foundation: ${dimensionScores.foundation}% (Experience, credibility & track record)
- Mindset: ${dimensionScores.mindset}% (Grit, learning velocity, focus, resilience)

CURRENT ASSESSMENT:
- Readiness Level: ${readinessLevel.level}
- Strengths: ${insights.strengths.join(', ')}
- Weaknesses: ${insights.weaknesses.join(', ')}
- Risk Factors: ${insights.riskFactors.join(', ')}

Provide enhanced professional insights following the JSON format specified in system prompt.
    `;
  }

  /**
   * System prompt for LLM
   */
  getSystemPrompt() {
    return `You are a senior career strategist analyzing professional readiness assessments. 

Provide insights in this exact JSON format:
{
  "validationScore": number (0-100, accuracy of current assessment),
  "keyInsights": ["insight1", "insight2", "insight3"],
  "hiddenStrengths": ["strength1", "strength2"],
  "blindSpots": ["blindspot1", "blindspot2"],
  "careerStrategy": "specific strategic recommendation",
  "immediateActions": ["action1", "action2", "action3"],
  "skillPriorities": ["skill1", "skill2", "skill3"],
  "networkingStrategy": "networking approach recommendation",
  "timelineAdjustment": "timeline recommendation with reasoning",
  "successPredictors": ["predictor1", "predictor2"],
  "riskMitigations": ["mitigation1", "mitigation2"],
  "confidenceBoost": number (-10 to +10, confidence adjustment),
  "personalizedMessage": "encouraging and actionable message"
}

Focus on:
- Professional development strategy
- Specific skill gaps and how to address them
- Network building recommendations
- Realistic timeline assessment
- Hidden strengths to leverage
- Blind spots to address`;
  }

  /**
   * Format and validate LLM response
   */
  formatLLMResponse(llmResponse, scoringResults) {
    return {
      validation: {
        score: llmResponse.validationScore || 75,
        confidence: llmResponse.validationScore > 80 ? 'HIGH' : 'MEDIUM'
      },
      
      enhancedInsights: {
        keyInsights: llmResponse.keyInsights || [],
        hiddenStrengths: llmResponse.hiddenStrengths || [],
        blindSpots: llmResponse.blindSpots || [],
        successPredictors: llmResponse.successPredictors || []
      },

      strategy: {
        career: llmResponse.careerStrategy || 'Focus on systematic skill development',
        networking: llmResponse.networkingStrategy || 'Build industry connections gradually',
        timeline: llmResponse.timelineAdjustment || 'Current timeline seems appropriate'
      },

      actionPlan: {
        immediate: llmResponse.immediateActions || [],
        skillPriorities: llmResponse.skillPriorities || [],
        riskMitigations: llmResponse.riskMitigations || []
      },

      confidence: {
        adjustment: llmResponse.confidenceBoost || 0,
        adjustedScore: Math.max(0, Math.min(100, 
          scoringResults.overallScore + (llmResponse.confidenceBoost || 0)
        ))
      },

      personalizedMessage: llmResponse.personalizedMessage || 
        'Continue focusing on systematic development across all dimensions.',

      llmEnhanced: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fallback insights when LLM unavailable
   */
  generateFallbackInsights(scoringResults) {
    const { dimensionScores, overallScore, insights } = scoringResults;
    
    // Find weakest dimension
    const weakestDimension = Object.entries(dimensionScores)
      .sort(([,a], [,b]) => a - b)[0];

    const fallbackInsights = {
      validation: { score: 70, confidence: 'MEDIUM' },
      
      enhancedInsights: {
        keyInsights: [
          `Primary development area: ${weakestDimension[0]} (${weakestDimension[1]}%)`,
          `Overall readiness: ${overallScore}% - ${this.getReadinessInterpretation(overallScore)}`
        ],
        hiddenStrengths: insights.strengths.slice(0, 2),
        blindSpots: insights.weaknesses.slice(0, 2),
        successPredictors: ['Systematic skill development', 'Consistent progress tracking']
      },

      strategy: {
        career: `Focus on strengthening ${weakestDimension[0]} through targeted development`,
        networking: 'Build connections in target industry/role area',
        timeline: this.getTimelineRecommendation(overallScore)
      },

      actionPlan: {
        immediate: this.generateImmediateActions(weakestDimension[0], scoringResults),
        skillPriorities: this.getSkillPriorities(dimensionScores),
        riskMitigations: insights.riskFactors.map(risk => `Address: ${risk}`)
      },

      confidence: {
        adjustment: 0,
        adjustedScore: overallScore
      },

      personalizedMessage: this.generatePersonalizedMessage(overallScore, weakestDimension),
      llmEnhanced: false,
      timestamp: new Date().toISOString()
    };

    return fallbackInsights;
  }

  getReadinessInterpretation(score) {
    if (score >= 80) return 'Strong readiness across dimensions';
    if (score >= 65) return 'Good foundation with focused gaps';
    if (score >= 45) return 'Moderate readiness needing development';
    return 'Early stage requiring systematic building';
  }

  getTimelineRecommendation(score) {
    if (score >= 75) return 'Current timeline likely achievable';
    if (score >= 50) return 'Consider extending timeline by 25-50%';
    return 'Extend timeline significantly for foundation building';
  }

  generateImmediateActions(weakestDimension, scoringResults) {
    const actionMap = {
      skills: ['Complete skills gap analysis', 'Start relevant online course', 'Practice daily'],
      knowledge: ['Research industry trends', 'Read 2 industry publications', 'Interview 3 professionals'],
      network: ['Join professional group', 'Reach out to 5 connections', 'Attend industry event'],
      foundation: ['Document past achievements', 'Seek feedback on track record', 'Build portfolio'],
      mindset: ['Set weekly goals', 'Practice resilience exercises', 'Find accountability partner']
    };

    return actionMap[weakestDimension] || ['Focus on systematic development'];
  }

  getSkillPriorities(dimensionScores) {
    return Object.entries(dimensionScores)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 3)
      .map(([dimension]) => `Strengthen ${dimension} capabilities`);
  }

  generatePersonalizedMessage(overallScore, weakestDimension) {
    const [dimension, score] = weakestDimension;
    
    return `Your ${overallScore}% readiness score shows solid potential. Focus on strengthening your ${dimension} area (currently ${score}%) as your primary development priority. With systematic effort, you can make significant progress toward your goals.`;
  }
}

module.exports = { LLMInsights };