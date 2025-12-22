/**
 * Simplified LLM Prompt Builder
 * Clean, maintainable prompts with standardized structure
 */

const LLMResponseValidator = require('./responseValidator');

class LLMPromptBuilder {

  /**
   * Build simplified journey planning prompt
   */
  static buildJourneyPrompt(userInput) {
    const {
      dreamText,
      confidence = 50,
      timeHorizon = 4,
      timeCommitment = 'focused-blocks',
      learningStyle = 'visual',
      careerPath = 'career_transition',
      targetRole = 'Not specified',
      currentRole = 'Not specified',
      domain = 'Not specified',
      location = 'Not specified'
    } = userInput;

    // Calculate appropriate number of goals and tasks based on timeframe
    const numGoals = Math.min(Math.max(Math.floor(timeHorizon / 2), 2), 5);
    const tasksPerWeek = this.getTasksPerWeek(timeCommitment);
    const avgTaskTime = this.getAvgTaskTime(timeCommitment);

    const prompt = `You are Manifestor AI, a professional goal coach. Create a ${timeHorizon}-week journey plan.

USER PROFILE:
- Dream: "${dreamText}"
- Current Role: ${currentRole}
- Target Role: ${targetRole}
- Domain: ${domain}
- Location: ${location}
- Confidence: ${confidence}%
- Time Commitment: ${timeCommitment}
- Learning Style: ${learningStyle}

REQUIREMENTS:
1. Create exactly ${numGoals} major goals that span the ${timeHorizon}-week journey
2. Each week should have ${tasksPerWeek} tasks (${avgTaskTime} minutes each)
3. Start with assessment/research tasks, then build toward practical application
4. Match task difficulty to ${confidence}% confidence level
5. Focus on ${domain} domain knowledge and ${targetRole} role preparation
6. Use days: Mon, Tue, Wed, Thu, Fri, Sat, Sun

WEEK PROGRESSION:
- Week 1-2: Discovery, research, skill assessment
- Week 3-4: Skill building, networking, planning
- Week ${timeHorizon > 4 ? '5+' : '4'}: Implementation, application, results

${this.getDomainGuidance(domain, targetRole)}

${this.getTimeCommitmentGuidance(timeCommitment)}

${this.getLearningStyleGuidance(learningStyle)}

${LLMResponseValidator.getJsonPromptSuffix('journey')}`;

    return prompt;
  }

  /**
   * Build simplified dream analysis prompt
   */
  static buildAnalysisPrompt(dreamData) {
    const {
      dream,
      currentProfession = 'Not specified',
      expectedProfession = 'Not specified',
      urgency = 'medium',
      confidence = 50
    } = dreamData;

    const prompt = `You are a professional goal coach. Analyze this person's dream and provide insights.

DREAM: "${dream}"
CURRENT: ${currentProfession}
TARGET: ${expectedProfession}
URGENCY: ${urgency}
CONFIDENCE: ${confidence}%

Provide analysis with scores 1-100 for:
- Reality: How achievable is this dream?
- Clarity: How specific and well-defined is it?
- Belief: How confident are they in success?

Include 3 insights and 3 next steps.

${LLMResponseValidator.getJsonPromptSuffix('analysis')}`;

    return prompt;
  }

  /**
   * Build simplified goal generation prompt (legacy support)
   */
  static buildGoalsPrompt(dreamData) {
    const {
      dream,
      currentProfession = 'Unknown',
      expectedProfession = 'Unknown',
      timeline = 12,
      confidence = 50
    } = dreamData;

    const prompt = `You are a goal-setting coach. Create 3 actionable goals for someone pursuing their dream.

CONTEXT:
- Dream: "${dream}"
- Current: ${currentProfession}
- Target: ${expectedProfession}
- Timeline: ${timeline} months
- Confidence: ${confidence}%

Create 3 goals, each with 3 tasks (15-60 minutes each).
Focus on immediate actions that build momentum and confidence.

${LLMResponseValidator.getJsonPromptSuffix('goals')}`;

    return prompt;
  }

  /**
   * Get tasks per week based on time commitment
   */
  static getTasksPerWeek(timeCommitment) {
    const taskCounts = {
      'micro-burst': '3-4',
      'focused-blocks': '4-5', 
      'flexible-flow': '4-5',
      'beast-mode': '6-7'
    };
    return taskCounts[timeCommitment] || '4-5';
  }

  /**
   * Get average task time based on commitment
   */
  static getAvgTaskTime(timeCommitment) {
    const taskTimes = {
      'micro-burst': '15-30',
      'focused-blocks': '45-90',
      'flexible-flow': '30-90', 
      'beast-mode': '120-240'
    };
    return taskTimes[timeCommitment] || '45-90';
  }

  /**
   * Get domain-specific guidance (simplified)
   */
  static getDomainGuidance(domain, targetRole) {
    if (!domain || domain === 'Not specified') {
      return '';
    }

    const domainTips = {
      'AI-first': `Focus on AI tools, model integration, and AI product strategy. Include tasks on prompt engineering and AI workflow optimization.`,
      'Software': `Include programming practice, system design, and portfolio development. Focus on technical skill building.`,
      'Marketing': `Emphasize digital marketing, campaign development, and analytics. Include content creation and audience research.`,
      'Fintech': `Focus on financial regulations, payment systems, and fintech trends. Include compliance and security considerations.`,
      'Storytelling': `Emphasize narrative structure, audience engagement, and content strategy across different mediums.`
    };

    const guidance = domainTips[domain] || `Focus on ${domain} industry knowledge, best practices, and ${targetRole} role requirements.`;
    
    return `DOMAIN FOCUS (${domain}): ${guidance}\n`;
  }

  /**
   * Get time commitment guidance (simplified)
   */
  static getTimeCommitmentGuidance(timeCommitment) {
    const guides = {
      'micro-burst': 'Tasks: Quick 15-30 minute actions. Focus on bite-sized wins.',
      'focused-blocks': 'Tasks: 45-90 minute focused sessions. Allow for deep work.',
      'flexible-flow': 'Tasks: Variable 30-120 minutes. Mix quick and deep tasks.',
      'beast-mode': 'Tasks: Intensive 2-4 hour sessions. Combine related activities for maximum impact.'
    };

    return `TIME STYLE: ${guides[timeCommitment] || guides['focused-blocks']}\n`;
  }

  /**
   * Get learning style guidance (simplified)
   */
  static getLearningStyleGuidance(learningStyle) {
    const guides = {
      'visual': 'Include videos, diagrams, and visual resources.',
      'auditory': 'Include podcasts, interviews, and discussions.',
      'kinesthetic': 'Include hands-on practice and real projects.',
      'reading': 'Include articles, books, and written materials.'
    };

    return `LEARNING STYLE: ${guides[learningStyle] || guides['visual']}\n`;
  }

  /**
   * Build test prompt for connection validation
   */
  static buildTestPrompt() {
    return `Test system functionality. Respond with exactly this JSON:

{
  "goals": [
    {
      "title": "System Test",
      "description": "Verify AI connectivity", 
      "rationale": "Testing is essential",
      "metricsImpacted": ["clarity"]
    }
  ],
  "weeks": [
    {
      "week": 1,
      "theme": "Testing", 
      "focus": "System validation",
      "tasks": [
        {
          "goalIndex": 0,
          "title": "Verify system works",
          "rationale": "Ensure connectivity",
          "estTime": 5,
          "day": "Mon",
          "difficultyLevel": "beginner",
          "skillCategory": "testing",
          "metricsImpacted": [
            {
              "metric": "clarity",
              "expectedImpact": "high",
              "reasoning": "Test confirms system status"
            }
          ]
        }
      ]
    }
  ]
}`;
  }

  /**
   * Get user-friendly prompt length estimate
   */
  static getPromptStats(prompt) {
    return {
      length: prompt.length,
      words: prompt.split(' ').length,
      estimatedTokens: Math.ceil(prompt.length / 4),
      category: prompt.length < 2000 ? 'short' : prompt.length < 5000 ? 'medium' : 'long'
    };
  }
}

module.exports = LLMPromptBuilder;