/**
 * LLM Response Validation and Standardization
 * Unified JSON schema and validation for all LLM responses
 */

const { jsonrepair } = require('jsonrepair');

class LLMResponseValidator {
  
  /**
   * Standard task schema used across all services
   */
  static getTaskSchema() {
    return {
      goalIndex: 0,
      title: "string",
      rationale: "string", 
      estTime: 30,
      day: "Mon|Tue|Wed|Thu|Fri|Sat|Sun",
      difficultyLevel: "beginner|intermediate|advanced",
      skillCategory: "string",
      metricsImpacted: [
        {
          metric: "clarity|confidence|competency|opportunity|commitment|growth_readiness",
          expectedImpact: "high|medium|low",
          reasoning: "string"
        }
      ]
    };
  }

  /**
   * Standard goal schema
   */
  static getGoalSchema() {
    return {
      title: "string",
      description: "string",
      rationale: "string",
      metricsImpacted: ["clarity", "confidence"]
    };
  }

  /**
   * Standard week schema for journey planning
   */
  static getWeekSchema() {
    return {
      week: 1,
      theme: "string",
      focus: "string",
      tasks: [] // Array of task objects
    };
  }

  /**
   * Clean JSON response and isolate JSON substring
   */
  static cleanJsonResponse(rawResponse) {
    if (!rawResponse || typeof rawResponse !== 'string') {
      throw new Error('Invalid response: not a string');
    }

    let cleaned = rawResponse.trim();

    // Remove any text before the first {
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart === -1) {
      throw new Error('No JSON object found in response');
    }
    cleaned = cleaned.substring(jsonStart);

    // Remove any text after the last }
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonEnd === -1) {
      throw new Error('No valid JSON object found in response');
    }
    cleaned = cleaned.substring(0, jsonEnd + 1);

    return cleaned;
  }

  /**
   * Validate and parse JSON response with robust error handling
   */
  static parseAndValidate(rawResponse, expectedSchema = 'journey') {
    try {
      const cleaned = this.cleanJsonResponse(rawResponse);
      
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError.message);
        console.error('Cleaned JSON (first 500 chars):', cleaned.substring(0, 500));

        // Attempt repair using jsonrepair before giving up
        try {
          const repaired = jsonrepair(cleaned);
          parsed = JSON.parse(repaired);
        } catch (repairError) {
          console.error('JSON Repair Failed:', repairError.message);
          throw repairError;
        }
      }
      
      // Validate structure based on schema type
      const validated = this.validateSchema(parsed, expectedSchema);
      
      return {
        success: true,
        data: validated,
        originalLength: rawResponse.length,
        cleanedLength: cleaned.length
      };
      
    } catch (error) {
      console.error('LLM Response Validation Failed:', error.message);
      console.error('Raw response (first 200 chars):', rawResponse.substring(0, 200));
      
      return {
        success: false,
        error: error.message,
        fallbackData: this.getFallbackData(expectedSchema)
      };
    }
  }


  /**
   * Validate response structure based on expected schema
   */
  static validateSchema(data, schemaType) {
    switch (schemaType) {
      case 'journey':
        return this.validateJourneySchema(data);
      case 'goals':
        return this.validateGoalsSchema(data);
      case 'weekly':
        return this.validateWeeklySchema(data);
      case 'analysis':
        return this.validateAnalysisSchema(data);
      case 'enhanced-journey':
        return this.validateEnhancedJourneySchema(data);
      default:
        return data; // No validation
    }
  }

  /**
   * Validate journey planning response
   */
  static validateJourneySchema(data) {
    if (!data.goals || !Array.isArray(data.goals)) {
      throw new Error('Missing or invalid goals array');
    }
    
    if (!data.weeks || !Array.isArray(data.weeks)) {
      throw new Error('Missing or invalid weeks array');
    }

    // Validate each goal has required fields
    data.goals.forEach((goal, index) => {
      if (!goal.title || !goal.description) {
        throw new Error(`Goal ${index} missing required fields`);
      }
    });

    // Validate each week
    data.weeks.forEach((week, index) => {
      if (!week.week || !week.tasks || !Array.isArray(week.tasks)) {
        throw new Error(`Week ${index} missing required fields`);
      }
      
      // Validate tasks
      week.tasks.forEach((task, taskIndex) => {
        if (!task.title || !task.day || !task.estTime) {
          throw new Error(`Week ${index}, Task ${taskIndex} missing required fields`);
        }
      });
    });

    return data;
  }

  /**
   * Validate simple goals response (legacy format)
   */
  static validateGoalsSchema(data) {
    if (!data.goals || !Array.isArray(data.goals)) {
      throw new Error('Missing or invalid goals array');
    }

    data.goals.forEach((goal, index) => {
      if (!goal.title || !goal.tasks || !Array.isArray(goal.tasks)) {
        throw new Error(`Goal ${index} missing required fields`);
      }
    });

    return data;
  }

  /**
   * Validate weekly plan response (simple format: {goal: {title, tasks}})
   */
  static validateWeeklySchema(data) {
    // Handle both formats: {goal: {...}} or {goals: [...], weeks: [...]}
    if (data.goals && Array.isArray(data.goals) && data.weeks && Array.isArray(data.weeks)) {
      // Journey format - validate using journey schema
      return this.validateJourneySchema(data);
    }
    
    if (!data.goal || !data.goal.title || !Array.isArray(data.goal.tasks)) {
      throw new Error('Missing or invalid goal structure - expected {goal: {title, tasks}}');
    }

    // Validate tasks array
    if (data.goal.tasks.length === 0) {
      throw new Error('Goal must contain at least one task');
    }

    data.goal.tasks.forEach((task, index) => {
      if (!task.name || typeof task.estTime !== 'number') {
        throw new Error(`Task ${index} missing required fields (name, estTime)`);
      }
    });

    return data;
  }

  /**
   * Validate dream analysis response
   */
  static validateAnalysisSchema(data) {
    const required = ['realityScore', 'clarityScore', 'beliefScore'];
    for (const field of required) {
      if (typeof data[field] !== 'number') {
        throw new Error(`Missing or invalid ${field}`);
      }
    }
    return data;
  }

  /**
   * Transform discovery_plan format to weeklyPlan array
   */
  static transformDiscoveryPlanToWeekly(discoveryPlan) {
    const weeklyPlan = [];
    
    if (discoveryPlan.focus) {
      Object.keys(discoveryPlan.focus).forEach((weekKey, index) => {
        const weekData = discoveryPlan.focus[weekKey];
        const weekNumber = index + 1;
        
        weeklyPlan.push({
          weekNumber: weekNumber,
          weekTheme: weekData.theme || `Week ${weekNumber} Focus`,
          objectiveAnalysis: weekData.objective || weekData.focus || 'Weekly objective',
          keyActivities: weekData.activities || weekData.tasks || [`Week ${weekNumber} activity`],
          learningResources: weekData.resources || [],
          timeAllocation: {
            totalHoursPerWeek: weekData.timeAllocation || 480 // 8 hours default
          }
        });
      });
    }
    
    return weeklyPlan;
  }

  /**
   * Validate enhanced journey response from Observer Engine
   */
  static validateEnhancedJourneySchema(data) {
    // Handle both formats: original planMetadata/weeklyPlan and new discovery_plan format
    let planData = data;
    let isDiscoveryFormat = false;
    
    const discoveryPlan = data.discovery_plan || data.discoveryPlan;
    if (discoveryPlan) {
      // New discovery_plan format from OpenAI (handling camelCase and snake_case)
      isDiscoveryFormat = true;
      planData = {
        planMetadata: {
          focusArea: 'Discovery Journey',
          userDream: 'User discovery and goal achievement',
          duration: discoveryPlan.duration || '3 weeks'
        },
        weeklyPlan: this.transformDiscoveryPlanToWeekly(discoveryPlan)
      };
    }
    
    // Original format validation
    if (!planData.planMetadata) {
      throw new Error('Missing planMetadata in enhanced journey response');
    }
    
    if (!planData.weeklyPlan || !Array.isArray(planData.weeklyPlan)) {
      throw new Error('Missing or invalid weeklyPlan array in enhanced journey response');
    }

    // Validate each week in weeklyPlan
    planData.weeklyPlan.forEach((week, index) => {
      if (!week.weekNumber || !week.weekTheme) {
        throw new Error(`Week ${index} missing required fields (weekNumber, weekTheme)`);
      }
      
      if (!week.keyActivities || !Array.isArray(week.keyActivities)) {
        throw new Error(`Week ${index} missing keyActivities array`);
      }
    });

    // Transform to legacy format for compatibility with existing journey processing
    const transformedData = {
      goals: [
        {
          title: `Journey Plan - ${planData.planMetadata.focusArea || 'Discovery'}`,
          description: planData.planMetadata.userDream || 'AI-generated journey plan',
          rationale: 'Generated using Observer Engine enhanced prompts',
          metricsImpacted: ['clarity', 'confidence', 'competency']
        }
      ],
      weeks: planData.weeklyPlan.map(week => ({
        week: week.weekNumber,
        theme: week.weekTheme,
        focus: week.objectiveAnalysis,
        tasks: (week.keyActivities || []).map((activity, taskIndex) => ({
          goalIndex: 0,
          title: activity,
          rationale: week.objectiveAnalysis || 'Weekly activity',
          estTime: Math.floor((week.timeAllocation?.totalHoursPerWeek || 480) / week.keyActivities.length),
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][taskIndex % 5],
          difficultyLevel: week.weekNumber === 1 ? 'beginner' : week.weekNumber === 2 ? 'intermediate' : 'advanced',
          skillCategory: 'development',
          adaptiveMetadata: {
            timeCommitmentStyle: 'micro-burst',
            generationMethod: 'ai_generated'
          },
          metricsImpacted: [
            {
              metric: 'clarity',
              expectedImpact: 'high',
              reasoning: week.objectiveAnalysis || 'Supports journey progression'
            }
          ]
        }))
      })),
      // Preserve original enhanced data for frontend
      enhancedMetadata: planData.planMetadata,
      weeklyAnalysis: planData.weeklyPlan.map(week => ({
        week: week.weekNumber,
        analysis: week.objectiveAnalysis,
        resources: week.learningResources
      }))
    };

    return transformedData;
  }

  /**
   * Get fallback data when validation fails
   */
  static getFallbackData(schemaType) {
    switch (schemaType) {
      case 'journey':
        return {
          goals: [
            {
              title: "Get Started",
              description: "Begin your journey with basic planning",
              rationale: "Every journey starts with a single step",
              metricsImpacted: ["clarity", "commitment"]
            }
          ],
          weeks: [
            {
              week: 1,
              theme: "Getting Started",
              focus: "Understanding your goals and taking first steps",
              tasks: [
                {
                  goalIndex: 0,
                  title: "Define your primary objective",
                  rationale: "Clarity is the foundation of all progress",
                  estTime: 30,
                  day: "Mon",
                  difficultyLevel: "beginner",
                  skillCategory: "planning",
                  adaptiveMetadata: {
                    timeCommitmentStyle: "focused-blocks"
                  },
                  metricsImpacted: [
                    {
                      metric: "clarity",
                      expectedImpact: "high",
                      reasoning: "Defining objectives provides clear direction"
                    }
                  ]
                }
              ]
            }
          ]
        };
      
      case 'goals':
        return {
          goals: [
            {
              title: "Start Planning",
              description: "Begin with basic goal setting",
              tasks: [
                {
                  name: "Write down your main goal",
                  duration: 15,
                  feedback: "Every expert was once a beginner",
                  reference: "Goal setting frameworks",
                  insight: "Clarity beats complexity"
                }
              ]
            }
          ]
        };
      
      case 'weekly':
        return {
          goal: {
            title: "Weekly Progress Goal",
            tasks: [
              {
                name: "Define your primary objective",
                estTime: 30
              },
              {
                name: "Research key resources",
                estTime: 45
              },
              {
                name: "Create an action plan",
                estTime: 60
              }
            ]
          }
        };
      
      case 'analysis':
        return {
          realityScore: 75,
          realityExplanation: "This goal appears achievable with proper planning",
          clarityScore: 70,
          clarityExplanation: "The goal has good direction but could use more specifics",
          beliefScore: 80,
          beliefExplanation: "Strong motivation detected for success",
          insights: ["Focus on breaking down into smaller steps"],
          nextSteps: ["Create a detailed action plan"]
        };
      
      default:
        return { error: "Fallback data not available for this schema type" };
    }
  }

  /**
   * Create standardized prompt suffix for JSON responses
   */
  static getJsonPromptSuffix(schemaType = 'journey') {
    const examples = {
      journey: `{
  "goals": [
    {
      "title": "Goal Name",
      "description": "What this achieves",
      "rationale": "Why this matters",
      "metricsImpacted": ["clarity", "confidence"]
    }
  ],
  "weeks": [
    {
      "week": 1,
      "theme": "Week Theme",
      "focus": "Week focus description",
      "tasks": [
        {
          "goalIndex": 0,
          "title": "Task name",
          "rationale": "Why this task",
          "estTime": 30,
          "day": "Mon",
          "difficultyLevel": "beginner",
          "skillCategory": "planning",
          "metricsImpacted": [
            {
              "metric": "clarity",
              "expectedImpact": "high", 
              "reasoning": "Explanation"
            }
          ]
        }
      ]
    }
  ]
}`,
      goals: `{
  "goals": [
    {
      "title": "Goal Name",
      "description": "Goal description",
      "tasks": [
        {
          "name": "Task name",
          "duration": 30,
          "feedback": "Motivational message",
          "reference": "Resource",
          "insight": "Key insight"
        }
      ]
    }
  ]
}`
    };

    return `

CRITICAL: Respond ONLY with valid JSON. No explanations, no text before or after.

JSON RULES:
- Use double quotes for all strings
- No trailing commas
- Escape quotes in strings with \"
- Use this exact format:

${examples[schemaType] || examples.journey}

Return only the JSON object above, properly formatted.`;
  }
}

module.exports = LLMResponseValidator;
