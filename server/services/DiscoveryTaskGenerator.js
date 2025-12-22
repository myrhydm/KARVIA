/**
 * Discovery Task Generator
 * Generates 21-day discovery activities and posts them to existing Goals page
 */

const llamaService = require('./llamaService');
const WeeklyGoal = require('../models/WeeklyGoal');
const Task = require('../models/Task');

class DiscoveryTaskGenerator {
    constructor() {
        this.activitiesPerWeek = 7;
        this.totalWeeks = 3;
        this.totalActivities = 21;
    }

    /**
     * Generate discovery tasks for a user's dream
     * @param {Object} dreamData - User's dream data
     * @returns {Promise<Object>} Generated discovery plan
     */
    async generateDiscoveryPlan(dreamData) {
        try {
            console.log(`🧠 Generating discovery plan for dream: ${dreamData.dreamText.substring(0, 50)}...`);
            
            const prompt = this.buildDiscoveryPrompt(dreamData);
            const llmResult = await llamaService.generateCompletion(prompt);
            
            let discoveryPlan;
            try {
                // Extract the actual response text
                const llmResponse = llmResult.response || llmResult;
                console.log('📏 Full response length:', llmResponse.length);
                
                const cleanedResponse = this.cleanLLMResponse(llmResponse);
                console.log('📏 Cleaned response length:', cleanedResponse.length);
                console.log('🔍 Cleaned response preview:', cleanedResponse.substring(0, 200) + '...');
                console.log('🔍 Cleaned response ending:', '...' + cleanedResponse.substring(cleanedResponse.length - 100));
                
                discoveryPlan = JSON.parse(cleanedResponse);
                console.log('✅ JSON parsing successful!');
            } catch (parseError) {
                console.warn('❌ LLM response parsing failed:', parseError.message);
                console.log('📝 Raw LLM result length:', JSON.stringify(llmResult).length);
                discoveryPlan = this.getFallbackDiscoveryPlan(dreamData);
            }
            
            // Validate and sanitize the plan
            const validatedPlan = this.validateDiscoveryPlan(discoveryPlan);
            
            console.log(`✅ Generated discovery plan with ${validatedPlan.weeks.length} weeks`);
            return validatedPlan;
            
        } catch (error) {
            console.error('Error generating discovery plan:', error);
            return this.getFallbackDiscoveryPlan(dreamData);
        }
    }

    /**
     * Build LLM prompt for discovery activities
     */
    buildDiscoveryPrompt(dreamData) {
        return `Create a 21-day discovery plan for: "${dreamData.dreamText}"

Generate 3 weeks, 7 activities each. Focus: Week 1=Foundation, Week 2=Exploration, Week 3=Testing

Return ONLY this JSON format:
{
  "weeks": [
    {
      "week": 1,
      "theme": "Dream Foundation", 
      "activities": [
        {"day": 1, "title": "Dream Visualization", "description": "Visualize achieving your dream", "type": "visualization", "estimatedTime": 30, "instructions": "Spend 30 minutes imagining your dream life"},
        {"day": 2, "title": "Research Success Stories", "description": "Find 3 people who achieved similar dreams", "type": "research", "estimatedTime": 45, "instructions": "Use LinkedIn and industry sites"},
        {"day": 3, "title": "Values Alignment", "description": "Assess how your dream aligns with values", "type": "reflection", "estimatedTime": 20, "instructions": "Write about what excites you most"},
        {"day": 4, "title": "Industry Overview", "description": "Research current industry state", "type": "research", "estimatedTime": 30, "instructions": "Look for trends and opportunities"},
        {"day": 5, "title": "Skills Assessment", "description": "Identify needed skills", "type": "assessment", "estimatedTime": 25, "instructions": "List current vs required skills"},
        {"day": 6, "title": "Network Mapping", "description": "Identify helpful connections", "type": "planning", "estimatedTime": 20, "instructions": "Think mentors and peers"},
        {"day": 7, "title": "Week Reflection", "description": "Reflect on week 1 insights", "type": "reflection", "estimatedTime": 25, "instructions": "What did you learn?"}
      ]
    },
    {
      "week": 2,
      "theme": "Path Exploration",
      "activities": [
        {"day": 8, "title": "Mentor Research", "description": "Find potential mentors", "type": "research", "estimatedTime": 30, "instructions": "Look for accessible mentors"},
        {"day": 9, "title": "Learning Plan", "description": "Create learning roadmap", "type": "planning", "estimatedTime": 25, "instructions": "Identify courses and resources"},
        {"day": 10, "title": "Success Analysis", "description": "Study one success story", "type": "research", "estimatedTime": 20, "instructions": "Understand their journey"},
        {"day": 11, "title": "Obstacle Identification", "description": "Identify potential challenges", "type": "assessment", "estimatedTime": 15, "instructions": "Be honest about challenges"},
        {"day": 12, "title": "Resource Mapping", "description": "Map available resources", "type": "planning", "estimatedTime": 20, "instructions": "Include financial and educational resources"},
        {"day": 13, "title": "First Connection", "description": "Reach out to someone", "type": "action", "estimatedTime": 30, "instructions": "Send thoughtful message"},
        {"day": 14, "title": "Path Reflection", "description": "Reflect on exploration", "type": "reflection", "estimatedTime": 25, "instructions": "How has understanding evolved?"}
      ]
    },
    {
      "week": 3, 
      "theme": "Commitment Testing",
      "activities": [
        {"day": 15, "title": "Daily Practice", "description": "Design small daily practice", "type": "planning", "estimatedTime": 20, "instructions": "Create 15-minute daily practice"},
        {"day": 16, "title": "First Learning", "description": "Start learning key skill", "type": "learning", "estimatedTime": 45, "instructions": "Begin with most important skill"},
        {"day": 17, "title": "Commitment Check", "description": "Assess commitment level", "type": "assessment", "estimatedTime": 15, "instructions": "Rate commitment honestly"},
        {"day": 18, "title": "Support Building", "description": "Build support system", "type": "action", "estimatedTime": 30, "instructions": "Talk to friends/family about dream"},
        {"day": 19, "title": "Milestone Planning", "description": "Plan first milestone", "type": "planning", "estimatedTime": 25, "instructions": "Set specific monthly goal"},
        {"day": 20, "title": "Reality Check", "description": "Final feasibility check", "type": "assessment", "estimatedTime": 20, "instructions": "Balance optimism with realism"},
        {"day": 21, "title": "Journey Complete", "description": "Complete discovery reflection", "type": "reflection", "estimatedTime": 30, "instructions": "Reflect on insights and next steps"}
      ]
    }
  ]
}`;
    }

    /**
     * Clean LLM response to extract JSON
     */
    cleanLLMResponse(response) {
        if (!response || typeof response !== 'string') {
            throw new Error('Invalid response format');
        }
        
        // Remove markdown code blocks if present
        let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Remove any leading/trailing text before JSON
        cleaned = cleaned.trim();
        
        // Find JSON object boundaries - look for the first { to last }
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        
        // Remove any trailing commas before closing braces/brackets
        cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
        
        // Attempt to fix incomplete JSON by adding missing closing braces
        cleaned = this.attemptJSONCompletion(cleaned);
        
        return cleaned;
    }

    /**
     * Attempt to complete truncated JSON
     */
    attemptJSONCompletion(jsonStr) {
        try {
            JSON.parse(jsonStr);
            return jsonStr; // Already valid
        } catch (error) {
            // Count opening vs closing braces and brackets
            const openBraces = (jsonStr.match(/\{/g) || []).length;
            const closeBraces = (jsonStr.match(/\}/g) || []).length;
            const openBrackets = (jsonStr.match(/\[/g) || []).length;
            const closeBrackets = (jsonStr.match(/\]/g) || []).length;
            
            let completed = jsonStr;
            
            // Add missing closing brackets
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                completed += ']';
            }
            
            // Add missing closing braces
            for (let i = 0; i < openBraces - closeBraces; i++) {
                completed += '}';
            }
            
            return completed;
        }
    }

    /**
     * Validate and sanitize discovery plan
     */
    validateDiscoveryPlan(plan) {
        if (!plan || !plan.weeks || !Array.isArray(plan.weeks)) {
            throw new Error('Invalid plan structure');
        }
        
        // Ensure exactly 3 weeks
        if (plan.weeks.length !== 3) {
            throw new Error('Plan must have exactly 3 weeks');
        }
        
        // Validate each week
        plan.weeks.forEach((week, index) => {
            if (!week.activities || !Array.isArray(week.activities)) {
                throw new Error(`Week ${index + 1} missing activities`);
            }
            
            // Ensure each week has activities
            if (week.activities.length === 0) {
                throw new Error(`Week ${index + 1} has no activities`);
            }
            
            // Validate activities
            week.activities.forEach((activity, actIndex) => {
                if (!activity.title || !activity.description) {
                    throw new Error(`Week ${index + 1}, Activity ${actIndex + 1} missing title or description`);
                }
                
                // Set defaults
                activity.estimatedTime = activity.estimatedTime || 30;
                activity.type = activity.type || 'general';
                activity.day = activity.day || (actIndex + 1);
            });
        });
        
        return plan;
    }

    /**
     * Get fallback discovery plan if LLM fails
     */
    getFallbackDiscoveryPlan(dreamData) {
        const dreamKeywords = this.extractDreamKeywords(dreamData.dreamText);
        
        return {
            weeks: [
                {
                    week: 1,
                    theme: "Dream Foundation",
                    activities: [
                        {
                            day: 1,
                            title: "Dream Visualization Session",
                            description: "Close your eyes and spend 20 minutes living in your achieved dream",
                            type: "visualization",
                            estimatedTime: 20,
                            instructions: "Find a quiet space and imagine your dream life in detail"
                        },
                        {
                            day: 2,
                            title: `Research ${dreamKeywords.field} Success Stories`,
                            description: `Find 3 people who achieved similar dreams in ${dreamKeywords.field}`,
                            type: "research",
                            estimatedTime: 30,
                            instructions: dreamKeywords.company ? `Focus on ${dreamKeywords.company} and similar companies` : "Use LinkedIn, industry blogs, and success stories"
                        },
                        {
                            day: 3,
                            title: "Dream Alignment Assessment",
                            description: "Reflect on how well your dream aligns with your values and goals",
                            type: "reflection",
                            estimatedTime: 15,
                            instructions: "Write about what excites you most about this dream"
                        },
                        {
                            day: 4,
                            title: `${dreamKeywords.field} Industry Overview`,
                            description: `Research the current state of ${dreamKeywords.field} industry`,
                            type: "research",
                            estimatedTime: 25,
                            instructions: dreamKeywords.company ? `Focus on ${dreamKeywords.company}'s position in the market` : "Look for trends, opportunities, and challenges"
                        },
                        {
                            day: 5,
                            title: "Skills Gap Analysis",
                            description: "Identify what skills you need to develop for your dream",
                            type: "assessment",
                            estimatedTime: 20,
                            instructions: "List current skills vs required skills"
                        },
                        {
                            day: 6,
                            title: "Network Mapping",
                            description: "Identify people who could help you with your dream",
                            type: "planning",
                            estimatedTime: 15,
                            instructions: "Think of mentors, peers, and industry connections"
                        },
                        {
                            day: 7,
                            title: "Week 1 Reflection",
                            description: "Reflect on your dream foundation week",
                            type: "reflection",
                            estimatedTime: 20,
                            instructions: "What did you learn about your dream this week?"
                        }
                    ]
                },
                {
                    week: 2,
                    theme: "Path Exploration",
                    activities: [
                        {
                            day: 8,
                            title: "Mentor Research",
                            description: "Find potential mentors in your dream field",
                            type: "research",
                            estimatedTime: 30,
                            instructions: "Look for accessible mentors and thought leaders"
                        },
                        {
                            day: 9,
                            title: "Learning Path Planning",
                            description: "Create a learning plan for your dream",
                            type: "planning",
                            estimatedTime: 25,
                            instructions: "Identify courses, books, and resources you need"
                        },
                        {
                            day: 10,
                            title: "Success Story Analysis",
                            description: "Deep dive into one success story from your research",
                            type: "research",
                            estimatedTime: 20,
                            instructions: "Understand their journey, challenges, and strategies"
                        },
                        {
                            day: 11,
                            title: "Dream Obstacles Identification",
                            description: "Identify potential obstacles to your dream",
                            type: "assessment",
                            estimatedTime: 15,
                            instructions: "Be honest about challenges you might face"
                        },
                        {
                            day: 12,
                            title: "Resource Mapping",
                            description: "Map out resources available to help you",
                            type: "planning",
                            estimatedTime: 20,
                            instructions: "Include financial, educational, and network resources"
                        },
                        {
                            day: 13,
                            title: "First Connection Attempt",
                            description: "Reach out to someone in your dream field",
                            type: "action",
                            estimatedTime: 30,
                            instructions: "Send a thoughtful message or comment on their content"
                        },
                        {
                            day: 14,
                            title: "Week 2 Reflection",
                            description: "Reflect on your path exploration week",
                            type: "reflection",
                            estimatedTime: 25,
                            instructions: "How has your understanding of the path evolved?"
                        }
                    ]
                },
                {
                    week: 3,
                    theme: "Commitment Testing",
                    activities: [
                        {
                            day: 15,
                            title: "Daily Practice Design",
                            description: "Design a small daily practice related to your dream",
                            type: "planning",
                            estimatedTime: 20,
                            instructions: "Create something you can do for 15 minutes daily"
                        },
                        {
                            day: 16,
                            title: "First Learning Session",
                            description: `Start learning ${dreamKeywords.skill} essential for your dream`,
                            type: "learning",
                            estimatedTime: 45,
                            instructions: `Begin with the most important ${dreamKeywords.skill} skill or knowledge`
                        },
                        {
                            day: 17,
                            title: "Dream Commitment Assessment",
                            description: "Honestly assess your commitment level to this dream",
                            type: "assessment",
                            estimatedTime: 15,
                            instructions: "Rate your commitment and identify what's holding you back"
                        },
                        {
                            day: 18,
                            title: "Support System Building",
                            description: "Identify and reach out to your support system",
                            type: "action",
                            estimatedTime: 30,
                            instructions: "Talk to friends, family, or mentors about your dream"
                        },
                        {
                            day: 19,
                            title: "First Milestone Planning",
                            description: "Plan your first concrete milestone toward the dream",
                            type: "planning",
                            estimatedTime: 25,
                            instructions: "Set a specific, measurable goal for the next month"
                        },
                        {
                            day: 20,
                            title: "Reality Check Session",
                            description: "Final reality check on your dream's feasibility",
                            type: "assessment",
                            estimatedTime: 20,
                            instructions: "Balance optimism with realistic planning"
                        },
                        {
                            day: 21,
                            title: "Discovery Journey Complete",
                            description: "Complete reflection on your 21-day discovery journey",
                            type: "reflection",
                            estimatedTime: 30,
                            instructions: "Reflect on insights gained and next steps"
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Extract keywords from dream text for personalization
     */
    extractDreamKeywords(dreamText) {
        const text = dreamText.toLowerCase();
        
        // Default keywords
        const keywords = {
            field: 'your field',
            skill: 'key skills',
            action: 'work',
            goal: 'dream'
        };
        
        // AI/ML keywords
        if (text.includes('ai') || text.includes('machine learning') || text.includes('artificial intelligence')) {
            keywords.field = 'AI/ML';
            keywords.skill = 'AI and machine learning';
            keywords.action = 'build AI solutions';
        }
        
        // Product Management keywords
        if (text.includes('product manager') || text.includes('pm') || text.includes('product management')) {
            keywords.field = 'product management';
            keywords.skill = 'product strategy';
            keywords.action = 'develop products';
        }
        
        // Tech keywords
        if (text.includes('tech') || text.includes('software') || text.includes('app') || text.includes('developer')) {
            keywords.field = 'technology';
            keywords.skill = 'programming';
            keywords.action = 'build software';
        }
        
        // Business keywords
        if (text.includes('business') || text.includes('startup') || text.includes('entrepreneur')) {
            keywords.field = 'business';
            keywords.skill = 'business development';
            keywords.action = 'grow business';
        }
        
        // Creative keywords
        if (text.includes('art') || text.includes('design') || text.includes('creative')) {
            keywords.field = 'creative arts';
            keywords.skill = 'artistic skills';
            keywords.action = 'create art';
        }
        
        // Marketing keywords
        if (text.includes('marketing') || text.includes('brand') || text.includes('social media')) {
            keywords.field = 'marketing';
            keywords.skill = 'marketing strategy';
            keywords.action = 'build brands';
        }
        
        // Finance keywords
        if (text.includes('finance') || text.includes('investment') || text.includes('trading')) {
            keywords.field = 'finance';
            keywords.skill = 'financial analysis';
            keywords.action = 'manage finances';
        }
        
        // Healthcare keywords
        if (text.includes('health') || text.includes('medical') || text.includes('doctor')) {
            keywords.field = 'healthcare';
            keywords.skill = 'medical knowledge';
            keywords.action = 'help patients';
        }
        
        // Extract company names for more personalization
        const companyMatches = text.match(/\b(google|microsoft|amazon|facebook|meta|apple|netflix|tesla|spotify|uber|airbnb|anthropic|openai)\b/i);
        if (companyMatches) {
            keywords.company = companyMatches[0];
        }
        
        return keywords;
    }

    /**
     * Convert discovery plan to Goals page format
     * @param {Object} discoveryPlan - Generated discovery plan
     * @param {String} userId - User ID
     * @param {String} dreamId - Dream ID
     * @returns {Promise<Array>} Created goals
     */
    async convertToGoalsFormat(discoveryPlan, userId, dreamId) {
        const createdGoals = [];
        
        try {
            for (const week of discoveryPlan.weeks) {
                // Calculate week start date
                const weekStartDate = new Date();
                weekStartDate.setDate(weekStartDate.getDate() + (week.week - 1) * 7);
                
                // Create weekly goal
                const weeklyGoal = new WeeklyGoal({
                    user: userId,
                    title: `Discovery Week ${week.week}: ${week.theme}`,
                    description: `Week ${week.week} of your 21-day discovery journey`,
                    weekOf: weekStartDate,
                    tasks: [],
                    metadata: {
                        stage: 'discovery',
                        dreamId: dreamId,
                        weekTheme: week.theme,
                        isDiscovery: true
                    }
                });
                
                await weeklyGoal.save();
                
                // Create tasks for this week
                for (const activity of week.activities) {
                    const task = new Task({
                        user: userId,
                        goal: weeklyGoal._id,
                        name: activity.title,
                        description: activity.description,
                        estTime: activity.estimatedTime,
                        day: this.getDayOfWeek(activity.day),
                        completed: false,
                        metadata: {
                            stage: 'discovery',
                            dreamId: dreamId,
                            activityType: activity.type,
                            instructions: activity.instructions,
                            discoveryDay: ((week.week - 1) * 7) + activity.day
                        }
                    });
                    
                    await task.save();
                    weeklyGoal.tasks.push(task._id);
                }
                
                await weeklyGoal.save();
                createdGoals.push(weeklyGoal);
            }
            
            console.log(`✅ Created ${createdGoals.length} weekly goals with discovery activities`);
            return createdGoals;
            
        } catch (error) {
            console.error('Error converting discovery plan to goals format:', error);
            throw error;
        }
    }

    /**
     * Convert day number to day of week
     */
    getDayOfWeek(dayNumber) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[dayNumber % 7];
    }
}

module.exports = new DiscoveryTaskGenerator();