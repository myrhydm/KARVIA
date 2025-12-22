/**
 * Dream Parser Service
 * Parses natural language dreams into structured data using LLM
 */

const llamaService = require('./llamaService');
const {
    DREAM_TYPES,
    EMPLOYEE_DREAM_SCHEMA,
    ENTREPRENEUR_DREAM_SCHEMA,
    DREAM_PARSING_PROMPT,
    VALIDATION_RULES,
    QUALITY_METRICS,
    INDUSTRY_VERTICALS,
    TECH_FOCUS_AREAS
} = require('../config/dreamLanguage');

class DreamParser {
    constructor() {
        this.llamaService = llamaService;
    }

    /**
     * Parse a natural language dream into structured data
     * @param {string} dreamText - The user's dream description
     * @param {number} confidence - User's confidence level (0-100)
     * @param {number} timeHorizon - Time horizon in months
     * @returns {Object} Parsed dream data
     */
    async parseDream(dreamText, confidence = 50, timeHorizon = 12) {
        try {
            // First, classify the dream type
            const dreamType = await this.classifyDreamType(dreamText);
            
            // Generate the parsing prompt
            const prompt = DREAM_PARSING_PROMPT
                .replace('{dreamText}', dreamText)
                .replace('{confidence}', confidence)
                .replace('{timeHorizon}', timeHorizon);

            // Get LLM parsing result
            const llmResponse = await this.llamaService.generateCompletion(prompt);
            
            // Parse and validate the response
            const parsedData = this.parseAndValidateLLMResponse(llmResponse, dreamType);
            
            // Add metadata
            parsedData.rawText = dreamText;
            parsedData.confidence = confidence;
            parsedData.timeHorizon = timeHorizon;
            parsedData.extractedAt = new Date().toISOString();
            
            // Calculate quality score
            parsedData.qualityScore = this.calculateQualityScore(parsedData);
            
            // Generate actionability insights
            parsedData.insights = this.generateInsights(parsedData);
            
            return {
                success: true,
                data: parsedData
            };
        } catch (error) {
            console.error('Error parsing dream:', error);
            return {
                success: false,
                error: error.message,
                fallbackData: this.createFallbackParsing(dreamText, confidence, timeHorizon)
            };
        }
    }

    /**
     * Classify if the dream is employee or entrepreneur focused
     * @param {string} dreamText 
     * @returns {string} 'employee' or 'entrepreneur'
     */
    async classifyDreamType(dreamText) {
        const classificationPrompt = `
        Classify this career dream as either "employee" or "entrepreneur":

        DREAM: "${dreamText}"

        Employee indicators: wants to "join", "work at", "become", mentions specific companies, roles, teams
        Entrepreneur indicators: wants to "start", "launch", "build", "create", "found", mentions business/startup/company

        Respond with only: "employee" or "entrepreneur"
        `;

        try {
            const response = await this.llamaService.generateCompletion(classificationPrompt);
            const classification = response.trim().toLowerCase();
            
            if (classification.includes('entrepreneur')) {
                return DREAM_TYPES.ENTREPRENEUR;
            } else {
                return DREAM_TYPES.EMPLOYEE;
            }
        } catch (error) {
            // Fallback to keyword-based classification
            return this.fallbackClassification(dreamText);
        }
    }

    /**
     * Fallback classification using keywords
     * @param {string} dreamText 
     * @returns {string}
     */
    fallbackClassification(dreamText) {
        const entrepreneurKeywords = ['start', 'launch', 'build', 'create', 'found', 'startup', 'company', 'business'];
        const employeeKeywords = ['join', 'work at', 'become', 'position', 'role', 'job'];
        
        const text = dreamText.toLowerCase();
        
        const entrepreneurScore = entrepreneurKeywords.reduce((score, keyword) => {
            return score + (text.includes(keyword) ? 1 : 0);
        }, 0);
        
        const employeeScore = employeeKeywords.reduce((score, keyword) => {
            return score + (text.includes(keyword) ? 1 : 0);
        }, 0);
        
        return entrepreneurScore > employeeScore ? DREAM_TYPES.ENTREPRENEUR : DREAM_TYPES.EMPLOYEE;
    }

    /**
     * Parse and validate LLM response
     * @param {string} llmResponse 
     * @param {string} dreamType 
     * @returns {Object}
     */
    parseAndValidateLLMResponse(llmResponse, dreamType) {
        try {
            // Extract JSON from response
            const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in LLM response');
            }
            
            const parsedData = JSON.parse(jsonMatch[0]);
            
            // Validate against schema
            const schema = dreamType === DREAM_TYPES.EMPLOYEE ? EMPLOYEE_DREAM_SCHEMA : ENTREPRENEUR_DREAM_SCHEMA;
            const validatedData = this.validateAgainstSchema(parsedData, schema, dreamType);
            
            return validatedData;
        } catch (error) {
            console.error('Error parsing LLM response:', error);
            throw new Error('Failed to parse LLM response: ' + error.message);
        }
    }

    /**
     * Validate parsed data against schema
     * @param {Object} data 
     * @param {Object} schema 
     * @param {string} dreamType 
     * @returns {Object}
     */
    validateAgainstSchema(data, schema, dreamType) {
        const validated = { ...schema };
        
        // Copy valid fields from parsed data
        Object.keys(data).forEach(key => {
            if (schema.hasOwnProperty(key)) {
                validated[key] = data[key];
            }
        });
        
        // Ensure mode is set correctly
        validated.mode = dreamType;
        
        // Set parsing confidence
        validated.parsingConfidence = data.parsingConfidence || 0.5;
        
        return validated;
    }

    /**
     * Calculate quality score for parsed dream
     * @param {Object} parsedData 
     * @returns {number}
     */
    calculateQualityScore(parsedData) {
        const rules = VALIDATION_RULES[parsedData.mode];
        let score = 0;
        let maxScore = 0;
        
        // Check required fields
        rules.required.forEach(field => {
            maxScore += 3;
            if (parsedData[field] && parsedData[field] !== null) {
                score += 3;
            }
        });
        
        // Check recommended fields
        rules.recommended.forEach(field => {
            maxScore += 2;
            if (parsedData[field] && parsedData[field] !== null) {
                score += 2;
            }
        });
        
        // Check optional fields
        rules.optional.forEach(field => {
            maxScore += 1;
            if (parsedData[field] && parsedData[field] !== null) {
                score += 1;
            }
        });
        
        return Math.round((score / maxScore) * 100) / 100;
    }

    /**
     * Generate insights about the parsed dream
     * @param {Object} parsedData 
     * @returns {Object}
     */
    generateInsights(parsedData) {
        const insights = {
            clarity: this.assessClarity(parsedData),
            actionability: this.assessActionability(parsedData),
            specificity: this.assessSpecificity(parsedData),
            recommendations: this.generateRecommendations(parsedData)
        };
        
        return insights;
    }

    /**
     * Assess dream clarity
     * @param {Object} parsedData 
     * @returns {Object}
     */
    assessClarity(parsedData) {
        const hasRole = parsedData.role || parsedData.ventureIdea;
        const hasTarget = parsedData.targetCompany || parsedData.targetPersona;
        const hasImpact = parsedData.impactStatement;
        
        let score = 0;
        if (hasRole) score += 0.4;
        if (hasTarget) score += 0.3;
        if (hasImpact) score += 0.3;
        
        return {
            score: score,
            level: score > 0.8 ? 'High' : score > 0.5 ? 'Medium' : 'Low',
            feedback: score > 0.8 ? 'Very clear dream with specific details' :
                     score > 0.5 ? 'Good clarity, could use more specifics' :
                     'Dream needs more specific details'
        };
    }

    /**
     * Assess actionability
     * @param {Object} parsedData 
     * @returns {Object}
     */
    assessActionability(parsedData) {
        const hasSkills = parsedData.techFocus;
        const hasTimeframe = parsedData.timeHorizon > 0;
        const hasSpecificTarget = parsedData.targetCompany || parsedData.industryVertical;
        
        let score = 0;
        if (hasSkills) score += 0.4;
        if (hasTimeframe) score += 0.3;
        if (hasSpecificTarget) score += 0.3;
        
        return {
            score: score,
            level: score > 0.7 ? 'High' : score > 0.4 ? 'Medium' : 'Low',
            nextSteps: this.generateNextSteps(parsedData)
        };
    }

    /**
     * Assess specificity
     * @param {Object} parsedData 
     * @returns {Object}
     */
    assessSpecificity(parsedData) {
        const fields = Object.values(parsedData).filter(value => value !== null && value !== '');
        const totalFields = Object.keys(parsedData).length;
        const completeness = fields.length / totalFields;
        
        return {
            score: completeness,
            level: completeness > 0.7 ? 'High' : completeness > 0.4 ? 'Medium' : 'Low',
            completedFields: fields.length,
            totalFields: totalFields
        };
    }

    /**
     * Generate recommendations
     * @param {Object} parsedData 
     * @returns {Array}
     */
    generateRecommendations(parsedData) {
        const recommendations = [];
        
        if (!parsedData.techFocus) {
            recommendations.push("Consider specifying the technologies or skills you want to work with");
        }
        
        if (parsedData.mode === 'employee' && !parsedData.targetCompany) {
            recommendations.push("Research specific companies in your target industry");
        }
        
        if (parsedData.mode === 'entrepreneur' && !parsedData.targetPersona) {
            recommendations.push("Define your target customer more specifically");
        }
        
        if (!parsedData.industryVertical) {
            recommendations.push("Clarify which industry vertical you're most interested in");
        }
        
        if (parsedData.timeHorizon > 24) {
            recommendations.push("Consider breaking down your long-term goal into shorter milestones");
        }
        
        return recommendations;
    }

    /**
     * Generate next steps
     * @param {Object} parsedData 
     * @returns {Array}
     */
    generateNextSteps(parsedData) {
        const steps = [];
        
        if (parsedData.mode === 'employee') {
            if (parsedData.targetCompany) {
                steps.push(`Research ${parsedData.targetCompany}'s current job openings`);
                steps.push(`Connect with employees at ${parsedData.targetCompany} on LinkedIn`);
            }
            if (parsedData.techFocus) {
                steps.push(`Build projects showcasing ${parsedData.techFocus} skills`);
            }
            if (parsedData.role) {
                steps.push(`Study job descriptions for ${parsedData.role} positions`);
            }
        } else if (parsedData.mode === 'entrepreneur') {
            if (parsedData.targetPersona) {
                steps.push(`Conduct user interviews with ${parsedData.targetPersona}`);
            }
            if (parsedData.ventureIdea) {
                steps.push(`Research competitors in the ${parsedData.ventureIdea} space`);
            }
            if (parsedData.techFocus) {
                steps.push(`Prototype using ${parsedData.techFocus} technology`);
            }
        }
        
        return steps;
    }

    /**
     * Create fallback parsing when LLM fails
     * @param {string} dreamText 
     * @param {number} confidence 
     * @param {number} timeHorizon 
     * @returns {Object}
     */
    createFallbackParsing(dreamText, confidence, timeHorizon) {
        const dreamType = this.fallbackClassification(dreamText);
        const schema = dreamType === DREAM_TYPES.EMPLOYEE ? EMPLOYEE_DREAM_SCHEMA : ENTREPRENEUR_DREAM_SCHEMA;
        
        return {
            ...schema,
            mode: dreamType,
            rawText: dreamText,
            confidence: confidence,
            timeHorizon: timeHorizon,
            impactStatement: dreamText, // Use original text as impact statement
            parsingConfidence: 0.2, // Low confidence for fallback
            qualityScore: 0.3,
            extractedAt: new Date().toISOString(),
            insights: {
                clarity: { score: 0.3, level: 'Low', feedback: 'Automatic parsing failed, manual review needed' },
                actionability: { score: 0.2, level: 'Low', nextSteps: ['Please provide more specific details about your goal'] },
                specificity: { score: 0.2, level: 'Low', completedFields: 3, totalFields: 15 },
                recommendations: ['Try rephrasing your dream with more specific details', 'Include technologies, companies, or target audience']
            }
        };
    }

    /**
     * Get example dreams for testing
     * @returns {Array}
     */
    getExampleDreams() {
        return [
            {
                type: 'employee',
                text: "I want to become an AI Product Manager at Anthropic, working with the consumer AI team to build direct-to-consumer apps that improve mental wellness using foundation models.",
                confidence: 85,
                timeHorizon: 18
            },
            {
                type: 'entrepreneur',
                text: "I want to start a business that helps people improve their daily lives through innovative solutions.",
                confidence: 70,
                timeHorizon: 12
            },
            {
                type: 'employee',
                text: "I dream of working as a Senior Software Engineer at Google focusing on machine learning infrastructure for search algorithms.",
                confidence: 90,
                timeHorizon: 24
            },
            {
                type: 'entrepreneur',
                text: "I want to create a B2B SaaS platform that uses computer vision to help retailers optimize their inventory management and reduce waste.",
                confidence: 75,
                timeHorizon: 15
            }
        ];
    }
}

module.exports = new DreamParser();