/**
 * server/services/llamaService.js
 * Local Llama integration for dream analysis and goal generation
 */

const axios = require('axios');
const { getLLMConfig } = require('../shared/config/llm');
let OpenAI;

class LlamaService {
    constructor() {
        this.config = getLLMConfig();
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        // Prefer configured model but fall back to a sensible default for local models
        this.defaultModel = this.config.model || 'llama3.2:latest';
        this.timeout = 180000; // 3 minutes timeout for complex prompts
    }

    /**
     * Check if the configured LLM provider is available
     * For OpenAI simply verify an API key exists, for Ollama ping the local server
     */
    async isAvailable() {
        if (this.config.provider === 'openai') {
            return !!this.config.apiKey;
        }
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
            return response.status >= 200 && response.status < 300;
        } catch (error) {
            console.error('Llama service not available:', error.message);
            return false;
        }
    }

    /**
     * Generate completion from Llama
     * @param {string} prompt - The prompt to send
     * @param {string} model - Model to use (optional)
     * @returns {Object} Response from Llama
     */
    async generateCompletion(prompt, model = this.defaultModel) {
        try {
            if (this.config.provider === 'openai') {
                if (!OpenAI) {
                    OpenAI = require('openai');
                }
                const result = await this.generateWithOpenAI(prompt, model);
                return { ...result, provider: 'openai' };
            }

            const startTime = Date.now();

            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    num_predict: 16000  // Further increased for complete discovery plans
                }
            }, {
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            return {
                success: true,
                response: response.data.response,
                model: response.data.model,
                provider: 'ollama',
                responseTime: responseTime,
                tokensGenerated: response.data.eval_count || 0,
                tokensPerSecond: response.data.eval_count ? (response.data.eval_count / (responseTime / 1000)).toFixed(2) : 0
            };
        } catch (error) {
            console.error('Llama generation error:', error.message);
            return {
                success: false,
                error: error.message,
                responseTime: 0
            };
        }
    }

    /**
     * Generate a chat-based response from the LLM using role based messages
     * Tries the configured provider first and falls back to the alternative
     * provider before returning an error
     * @param {Array<{role: string, content: string}>} messages
     * @param {string} model - optional model override
     * @returns {Object} LLM response
     */
    async generateChatResponse(messages, model = this.defaultModel) {
        const providers = this.config.provider === 'openai' ? ['openai', 'ollama'] : ['ollama', 'openai'];
        const errors = [];

        for (const provider of providers) {
            try {
                if (provider === 'openai') {
                    const apiKey = process.env.OPENAI_API_KEY || this.config.apiKey;
                    if (!apiKey) {
                        throw new Error('OpenAI API key not configured');
                    }
                    if (!OpenAI) {
                        OpenAI = require('openai');
                    }
                    const openai = new OpenAI({ apiKey });
                    const response = await openai.chat.completions.create({
                        model: provider === this.config.provider ? this.config.model || model : process.env.OPENAI_MODEL || 'gpt-4o-mini',
                        messages,
                        max_tokens: this.config.maxTokens,
                        temperature: this.config.temperature
                    });
                    return {
                        success: true,
                        response: response.choices[0].message.content,
                        model: response.model || model,
                        provider: 'openai'
                    };
                } else {
                    const response = await axios.post(`${this.ollamaUrl}/api/chat`, {
                        model: provider === this.config.provider ? model : this.defaultModel,
                        messages,
                        stream: false
                    }, {
                        timeout: this.timeout,
                        headers: { 'Content-Type': 'application/json' }
                    });
                    return {
                        success: true,
                        response: response.data.message?.content || '',
                        model: response.data.model || model,
                        provider: 'ollama'
                    };
                }
            } catch (error) {
                console.error(`LLM chat error with ${provider}:`, error.message);
                errors.push(`${provider}: ${error.message}`);
            }
        }

        return {
            success: false,
            error: errors.join(' | ')
        };
    }

    /**
     * Generate completion using OpenAI API
     */
    async generateWithOpenAI(prompt, model = this.defaultModel) {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const LLMResponseValidator = require('../shared/llm/responseValidator');
        const openai = new OpenAI({ apiKey: this.config.apiKey });

        const startTime = Date.now();
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { 
                    role: 'system', 
                    content: 'You are Manifestor AI, a professional goal coach. Respond only with valid JSON format.' 
                },
                { 
                    role: 'user', 
                    content: prompt 
                }
            ],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            response_format: { type: 'json_object' }
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Validate and clean the response
        const validationResult = LLMResponseValidator.parseAndValidate(
            response.choices[0].message.content, 
            'goals'  // Use legacy goals format for this service
        );

        let finalResponse = response.choices[0].message.content;
        let validationWarning = null;

        if (!validationResult.success) {
            console.warn('LlamaService: Response validation failed:', validationResult.error);
            finalResponse = JSON.stringify(validationResult.fallbackData);
            validationWarning = validationResult.error;
        } else {
            finalResponse = JSON.stringify(validationResult.data);
        }

        return {
            success: true,
            response: finalResponse,
            model: model,
            provider: 'openai',
            responseTime,
            tokensGenerated: response.usage.completion_tokens || 0,
            tokensPerSecond: response.usage.completion_tokens ? (response.usage.completion_tokens / (responseTime / 1000)).toFixed(2) : 0,
            validationWarning,
            usedFallback: !validationResult.success
        };
    }

    /**
     * Generate SMART goals from user dream
     * @param {Object} dreamData - User's dream and context
     * @returns {Object} Generated goals and tasks
     */
    async generateGoalsFromDream(dreamData) {
        try {
            const LLMPromptBuilder = require('../shared/llm/promptBuilder');
            
            // Use simplified prompt builder
            const prompt = LLMPromptBuilder.buildGoalsPrompt(dreamData);
            const promptStats = LLMPromptBuilder.getPromptStats(prompt);
            
            console.log('🧠 Generating goals for dream:', dreamData.dream);
            console.log(`📝 Prompt stats: ${promptStats.length} chars, ${promptStats.category} complexity`);
            
            const result = await this.generateCompletion(prompt);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            // Parse the JSON response (now already validated)
            const parsedGoals = JSON.parse(result.response);
            
            return {
                success: true,
                goals: parsedGoals.goals || parsedGoals, // Handle both formats
                metadata: {
                    model: result.model,
                    responseTime: result.responseTime,
                    tokensGenerated: result.tokensGenerated,
                    tokensPerSecond: result.tokensPerSecond,
                    promptStats: promptStats,
                    validationWarning: result.validationWarning,
                    usedFallback: result.usedFallback
                }
            };
        } catch (error) {
            console.error('Goal generation error:', error.message);
            return {
                success: false,
                error: error.message,
                goals: this.getFallbackGoals()
            };
        }
    }

    /**
     * Build goal generation prompt
     * @param {Object} dreamData - User's dream and context
     * @returns {string} Formatted prompt
     */
    buildGoalGenerationPrompt(dreamData) {
        const {
            dream,
            currentProfession = 'Unknown',
            expectedProfession = 'Unknown',
            location = 'Unknown',
            urgency = 'medium',
            confidence = 50,
            timeline = 12
        } = dreamData;

        return `You are a professional goal-setting coach with expertise in the SMART goals framework and behavioral psychology. Help create actionable goals for someone pursuing their dream.

USER CONTEXT:
- Dream: "${dream}"
- Current Profession: "${currentProfession}"
- Target Profession: "${expectedProfession}"
- Location: ${location}
- Urgency Level: ${urgency}
- Confidence Level: ${confidence}%
- Timeline: ${timeline} months

TASK:
Generate exactly 3 SMART goals for the next 3 days. Each goal must be:
- Specific, Measurable, Achievable, Relevant, Time-bound
- Focused on immediate actionable steps
- Designed to build momentum and confidence
- Connected to their ultimate dream

For each goal, provide exactly 3 beginner-friendly tasks with:
- Clear action steps (15-60 minutes each)
- Motivational feedback message
- Helpful reference/resource
- One-line coaching insight

IMPORTANT: Respond ONLY with valid JSON in this exact format:

{
  "goals": [
    {
      "title": "Goal title here",
      "description": "Brief description of what this goal achieves",
      "tasks": [
        {
          "name": "Specific task name",
          "duration": 45,
          "feedback": "Motivational message about this task",
          "reference": "https://helpful-resource.com or book/article name",
          "insight": "One-line coaching insight"
        },
        {
          "name": "Specific task name",
          "duration": 30,
          "feedback": "Motivational message about this task", 
          "reference": "https://helpful-resource.com or book/article name",
          "insight": "One-line coaching insight"
        },
        {
          "name": "Specific task name",
          "duration": 60,
          "feedback": "Motivational message about this task",
          "reference": "https://helpful-resource.com or book/article name", 
          "insight": "One-line coaching insight"
        }
      ]
    },
    {
      "title": "Goal title here",
      "description": "Brief description of what this goal achieves",
      "tasks": [
        {
          "name": "Specific task name",
          "duration": 45,
          "feedback": "Motivational message about this task",
          "reference": "https://helpful-resource.com or book/article name",
          "insight": "One-line coaching insight"
        },
        {
          "name": "Specific task name",
          "duration": 30,
          "feedback": "Motivational message about this task",
          "reference": "https://helpful-resource.com or book/article name",
          "insight": "One-line coaching insight"
        },
        {
          "name": "Specific task name", 
          "duration": 60,
          "feedback": "Motivational message about this task",
          "reference": "https://helpful-resource.com or book/article name",
          "insight": "One-line coaching insight"
        }
      ]
    },
    {
      "title": "Goal title here",
      "description": "Brief description of what this goal achieves", 
      "tasks": [
        {
          "name": "Specific task name",
          "duration": 45,
          "feedback": "Motivational message about this task",
          "reference": "https://helpful-resource.com or book/article name",
          "insight": "One-line coaching insight"
        },
        {
          "name": "Specific task name",
          "duration": 30,
          "feedback": "Motivational message about this task",
          "reference": "https://helpful-resource.com or book/article name",
          "insight": "One-line coaching insight"
        },
        {
          "name": "Specific task name",
          "duration": 60,
          "feedback": "Motivational message about this task",
          "reference": "https://helpful-resource.com or book/article name",
          "insight": "One-line coaching insight"
        }
      ]
    }
  ]
}

Remember: Return ONLY the JSON object, no additional text or explanation.`;
    }

    /**
     * Parse goals response from Llama
     * @param {string} response - Raw response from Llama
     * @returns {Array} Parsed goals array
     */
    parseGoalsResponse(response) {
        try {
            // Clean up the response - remove any extra text before/after JSON
            let cleanResponse = response.trim();
            
            // Find JSON object boundaries
            const jsonStart = cleanResponse.indexOf('{');
            const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
            
            if (jsonStart !== -1 && jsonEnd !== -1) {
                cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
            }
            
            // Parse JSON
            const parsed = JSON.parse(cleanResponse);
            
            // Validate structure
            if (!parsed.goals || !Array.isArray(parsed.goals)) {
                throw new Error('Invalid goals structure');
            }
            
            // Ensure we have exactly 3 goals
            if (parsed.goals.length !== 3) {
                console.warn(`Expected 3 goals, got ${parsed.goals.length}`);
            }
            
            // Validate each goal has 3 tasks
            parsed.goals.forEach((goal, goalIndex) => {
                if (!goal.tasks || !Array.isArray(goal.tasks)) {
                    throw new Error(`Goal ${goalIndex + 1} missing tasks array`);
                }
                
                if (goal.tasks.length !== 3) {
                    console.warn(`Goal ${goalIndex + 1} has ${goal.tasks.length} tasks, expected 3`);
                }
            });
            
            return parsed.goals;
        } catch (error) {
            console.error('Failed to parse goals response:', error.message);
            console.error('Raw response:', response);
            
            // Return fallback goals if parsing fails
            return this.getFallbackGoals();
        }
    }

    /**
     * Get fallback goals if parsing fails
     * @returns {Array} Default goals structure
     */
    getFallbackGoals() {
        return [
            {
                title: "Research and Planning",
                description: "Gather information and create a roadmap",
                tasks: [
                    {
                        name: "Research 3 successful people in your field",
                        duration: 45,
                        feedback: "Knowledge is power - every expert was once a beginner",
                        reference: "LinkedIn, industry publications",
                        insight: "Success leaves clues - follow the patterns"
                    },
                    {
                        name: "Write down your specific 30-day goal",
                        duration: 30,
                        feedback: "Clarity transforms dreams into plans",
                        reference: "SMART goals framework",
                        insight: "A goal without a plan is just a wish"
                    },
                    {
                        name: "Create a daily action checklist",
                        duration: 60,
                        feedback: "Small daily actions compound into big results",
                        reference: "Atomic Habits by James Clear",
                        insight: "Systems beat goals - focus on the process"
                    }
                ]
            },
            {
                title: "Skill Development",
                description: "Build foundational skills for your dream",
                tasks: [
                    {
                        name: "Identify 3 key skills you need to develop",
                        duration: 45,
                        feedback: "Self-awareness is the first step to growth",
                        reference: "Industry skill assessments",
                        insight: "Skills are your currency in the new economy"
                    },
                    {
                        name: "Find one free online course or tutorial",
                        duration: 30,
                        feedback: "Learning is earning - invest in yourself",
                        reference: "Coursera, YouTube, Khan Academy",
                        insight: "The best investment you can make is in yourself"
                    },
                    {
                        name: "Practice one new skill for 30 minutes",
                        duration: 60,
                        feedback: "Practice makes progress, not perfection",
                        reference: "Deliberate practice principles",
                        insight: "Consistency beats intensity every time"
                    }
                ]
            },
            {
                title: "Network Building",
                description: "Connect with people who can help your journey",
                tasks: [
                    {
                        name: "Join one online community related to your dream",
                        duration: 45,
                        feedback: "Your network is your net worth",
                        reference: "Discord, Reddit, Facebook groups",
                        insight: "Relationships are the highway to opportunity"
                    },
                    {
                        name: "Introduce yourself to 3 new people online",
                        duration: 30,
                        feedback: "Every connection is a potential opportunity",
                        reference: "LinkedIn, Twitter, community forums",
                        insight: "Be genuinely interested in others' success"
                    },
                    {
                        name: "Share one piece of valuable content",
                        duration: 60,
                        feedback: "Give value first, relationships will follow",
                        reference: "Social media platforms",
                        insight: "Teaching others is the best way to learn"
                    }
                ]
            }
        ];
    }

    /**
     * Analyze dream for insights
     * @param {Object} dreamData - User's dream and context
     * @returns {Object} Analysis insights
     */
    async analyzeDream(dreamData) {
        try {
            const LLMPromptBuilder = require('../shared/llm/promptBuilder');
            
            // Use simplified prompt builder
            const prompt = LLMPromptBuilder.buildAnalysisPrompt(dreamData);
            const promptStats = LLMPromptBuilder.getPromptStats(prompt);
            
            console.log(`🔍 Analyzing dream: ${promptStats.length} chars, ${promptStats.category} complexity`);
            
            const result = await this.generateCompletion(prompt);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            // Parse the JSON response (now already validated)
            const analysis = JSON.parse(result.response);
            
            return {
                success: true,
                analysis: analysis,
                metadata: {
                    model: result.model,
                    responseTime: result.responseTime,
                    tokensGenerated: result.tokensGenerated,
                    tokensPerSecond: result.tokensPerSecond,
                    promptStats: promptStats,
                    validationWarning: result.validationWarning,
                    usedFallback: result.usedFallback
                }
            };
        } catch (error) {
            console.error('Dream analysis error:', error.message);
            return {
                success: false,
                error: error.message,
                analysis: this.getFallbackAnalysis()
            };
        }
    }

    /**
     * Get fallback analysis when validation fails
     */
    getFallbackAnalysis() {
        return {
            realityScore: 75,
            realityExplanation: "This dream appears achievable with proper planning and dedication.",
            clarityScore: 70,
            clarityExplanation: "The dream has good direction but could benefit from more specific details.",
            beliefScore: 80,
            beliefExplanation: "There's strong motivation and belief in the possibility of success.",
            insights: [
                "Focus on building relevant skills consistently",
                "Consider breaking the dream into smaller milestones",
                "Leverage your existing experience and knowledge"
            ],
            nextSteps: [
                "Define specific, measurable outcomes",
                "Research successful people in your target field",
                "Create a timeline with checkpoints"
            ]
        };
    }

    /**
     * Build dream analysis prompt
     * @param {Object} dreamData - User's dream and context
     * @returns {string} Formatted prompt
     */
    buildDreamAnalysisPrompt(dreamData) {
        const {
            dream,
            currentProfession = 'Unknown',
            expectedProfession = 'Unknown',
            urgency = 'medium',
            confidence = 50
        } = dreamData;

        return `You are a professional goal coach and psychologist. Analyze this person's dream and provide insights.

USER DREAM: "${dream}"
CURRENT ROLE: ${currentProfession}
TARGET ROLE: ${expectedProfession}
URGENCY: ${urgency}
CONFIDENCE: ${confidence}%

Provide analysis in JSON format with scores 1-100:

{
  "realityScore": 85,
  "realityExplanation": "Explanation of how realistic this dream is",
  "claritySc ore": 75,
  "clarityExplanation": "How clear and specific the dream is",
  "beliefScore": 90,
  "beliefExplanation": "Analysis of their confidence and belief",
  "insights": [
    "Key insight about their journey",
    "Potential challenge to watch for",
    "Strength they can leverage"
  ],
  "nextSteps": [
    "Immediate action they should take",
    "Skill they should develop",
    "Resource they should explore"
  ]
}

Return only the JSON object.`;
    }

    /**
     * Parse dream analysis response
     * @param {string} response - Raw response from Llama
     * @returns {Object} Parsed analysis
     */
    parseDreamAnalysis(response) {
        try {
            // Clean up the response
            let cleanResponse = response.trim();
            
            const jsonStart = cleanResponse.indexOf('{');
            const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
            
            if (jsonStart !== -1 && jsonEnd !== -1) {
                cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
            }
            
            return JSON.parse(cleanResponse);
        } catch (error) {
            console.error('Failed to parse dream analysis:', error.message);
            
            // Return fallback analysis
            return {
                realityScore: 75,
                realityExplanation: "This dream appears achievable with proper planning and dedication.",
                clarityScore: 70,
                clarityExplanation: "The dream has good direction but could benefit from more specific details.",
                beliefScore: 80,
                beliefExplanation: "There's strong motivation and belief in the possibility of success.",
                insights: [
                    "Focus on building relevant skills consistently",
                    "Consider breaking the dream into smaller milestones",
                    "Leverage your existing experience and knowledge"
                ],
                nextSteps: [
                    "Define specific, measurable outcomes",
                    "Research successful people in your target field",
                    "Create a timeline with checkpoints"
                ]
            };
        }
    }

    /**
     * Test Llama connection and performance
     * @returns {Object} Test results
     */
    async testConnection() {
        try {
            const testPrompt = "Hello! Please respond with exactly this JSON: {\"status\": \"connected\", \"message\": \"Llama is working!\"}";
            
            const result = await this.generateCompletion(testPrompt);
            
            return {
                success: result.success,
                connected: result.success,
                model: result.model,
                responseTime: result.responseTime,
                tokensPerSecond: result.tokensPerSecond,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Get available models
     * @returns {Array} Available models
     */
    async getAvailableModels() {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`);
            return response.data.models || [];
        } catch (error) {
            console.error('Failed to get models:', error.message);
            return [];
        }
    }
}

module.exports = new LlamaService();