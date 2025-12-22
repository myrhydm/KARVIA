/**
 * Enhanced Vision Scoring Engine
 * Combines local logic with OpenAI analysis for comprehensive assessment
 * 
 * Scoring Dimensions:
 * 1. Competency (Knowledge + Skills)
 * 2. Network
 * 3. Mindset (Growth vs Fixed mindset assessment)
 * 4. Execution Capabilities
 * 5. Opportunities
 */

const llamaService = require('./llamaService');
const { extractKeywords } = require('../utils/keywordExtractor');
const { VisionResponseAnalyzer } = require('./visionResponseAnalyzer');

class EnhancedVisionScoringEngine {
    constructor() {
        // Utilize shared llamaService for OpenAI or Ollama access
        this.ollama = llamaService;
        this.responseAnalyzer = new VisionResponseAnalyzer();
        
        this.dimensions = {
            competency: {
                weight: 0.25,
                description: 'Knowledge depth and relevant skills',
                components: ['knowledge', 'skills', 'experience']
            },
            network: {
                weight: 0.20,
                description: 'Professional connections and support systems',
                components: ['connections', 'mentors', 'community']
            },
            mindset: {
                weight: 0.20,
                description: 'Growth mindset and psychological readiness',
                components: ['growth_orientation', 'resilience', 'confidence']
            },
            execution: {
                weight: 0.20,
                description: 'Ability to execute and deliver results',
                components: ['track_record', 'time_management', 'focus']
            },
            opportunities: {
                weight: 0.15,
                description: 'Market opportunities and timing',
                components: ['market_timing', 'resources', 'positioning']
            }
        };

        // Proven mindset assessment patterns
        this.mindsetIndicators = {
            growth: [
                'learn', 'improve', 'develop', 'practice', 'feedback', 'challenge',
                'effort', 'process', 'journey', 'growth', 'adapt', 'evolve'
            ],
            fixed: [
                'talent', 'natural', 'born', 'gifted', 'always', 'never',
                'impossible', 'can\'t', 'afraid', 'avoid', 'perfect'
            ],
            resilience: [
                'overcome', 'persist', 'bounce', 'recover', 'determined',
                'obstacles', 'setbacks', 'failure', 'try again', 'persevere'
            ],
            confidence: [
                'believe', 'confident', 'capable', 'achieve', 'succeed',
                'strength', 'ability', 'skilled', 'experienced', 'ready'
            ]
        };

        // Competency keyword categories
        this.competencyKeywords = {
            technical: [
                'programming', 'code', 'software', 'technology', 'digital',
                'ai', 'machine learning', 'data', 'analytics', 'engineering'
            ],
            business: [
                'strategy', 'marketing', 'sales', 'finance', 'operations',
                'management', 'leadership', 'entrepreneurship', 'startup'
            ],
            domain: [
                'industry', 'market', 'competitive', 'trends', 'expertise',
                'specialization', 'knowledge', 'experience', 'background'
            ]
        };

        // Network strength indicators
        this.networkIndicators = {
            strong: [
                'mentor', 'advisor', 'network', 'connections', 'community',
                'colleagues', 'peers', 'partners', 'team', 'support'
            ],
            professional: [
                'linkedin', 'conferences', 'meetups', 'associations',
                'industry', 'professional', 'contacts', 'referrals'
            ],
            collaborative: [
                'collaborate', 'partnership', 'teamwork', 'cooperation',
                'joint', 'together', 'collective', 'group'
            ]
        };

        // Execution capability markers
        this.executionMarkers = {
            delivered: [
                'completed', 'delivered', 'launched', 'shipped', 'built',
                'created', 'developed', 'implemented', 'executed', 'achieved'
            ],
            managed: [
                'managed', 'led', 'coordinated', 'organized', 'planned',
                'scheduled', 'prioritized', 'allocated', 'tracked'
            ],
            results: [
                'results', 'outcomes', 'impact', 'metrics', 'performance',
                'success', 'improvement', 'growth', 'increased', 'reduced'
            ]
        };
    }

    async scoreVision(responses, resumeKeywords = []) {
        const startTime = Date.now();
        
        try {
            // Step 1: Intelligent Response Analysis
            const responseAnalysis = this.responseAnalyzer.analyzeResponsePatterns(responses);
            
            // Step 2: Extract keywords from all text responses
            const allKeywords = await this.extractAllKeywords(responses, resumeKeywords);
            
            // Step 3: Calculate base scores using correlation analysis
            const correlationScores = responseAnalysis.dimensionReadiness;
            
            // Step 4: Local logic scoring (enhanced with correlation insights)
            const localScores = await this.calculateEnhancedLocalScores(responses, allKeywords, responseAnalysis);
            
            // Step 5: OpenAI enhanced scoring with intelligent context
            const enhancedScores = await this.getIntelligentOpenAIScoring(responses, allKeywords, localScores, responseAnalysis);
            
            // Step 6: Combine all scoring methods
            const finalScores = this.combineIntelligentScores(correlationScores, localScores, enhancedScores);
            
            // Step 7: Generate comprehensive insights
            const insights = await this.generateComprehensiveInsights(responses, allKeywords, finalScores, responseAnalysis);
            
            // Step 8: Create analysis summary for comprehensive understanding
            const analysisSummary = this.responseAnalyzer.generateAnalysisSummary(responses, responseAnalysis);
            
            return {
                scores: finalScores,
                insights,
                keywords: allKeywords,
                responseAnalysis: analysisSummary,
                psychologicalProfile: responseAnalysis.psychologicalProfile || {},
                riskFactors: responseAnalysis.riskFactors || [],
                successPredictors: responseAnalysis.successPredictors || [],
                correlationInsights: responseAnalysis.correlationInsights || [],
                processingTime: Date.now() - startTime,
                method: 'intelligent_correlation_enhanced',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Intelligent scoring failed:', error);
            // Fallback to basic enhanced scoring
            return this.fallbackScoring(responses, resumeKeywords);
        }
    }

    async extractAllKeywords(responses, resumeKeywords = []) {
        const textFields = [
            'dream', 'why', 'deepMotivation', 'whySucceed', 'pastLessons',
            'realImpact', 'timeReality', 'selfDoubt', 'beliefHelp', 'projects'
        ];

        const allText = textFields
            .map(field => responses[field] || '')
            .join(' ');

        // Extract keywords from response text
        const responseKeywords = await extractKeywords(allText);
        
        // Combine with resume keywords
        const allKeywords = [...new Set([...responseKeywords, ...resumeKeywords])];
        
        // Categorize keywords
        return {
            all: allKeywords,
            technical: this.categorizeKeywords(allKeywords, this.competencyKeywords.technical),
            business: this.categorizeKeywords(allKeywords, this.competencyKeywords.business),
            domain: this.categorizeKeywords(allKeywords, this.competencyKeywords.domain),
            network: this.categorizeKeywords(allKeywords, this.networkIndicators.strong),
            execution: this.categorizeKeywords(allKeywords, this.executionMarkers.delivered),
            mindset: this.analyzeMindsetKeywords(allText)
        };
    }

    categorizeKeywords(allKeywords, categoryKeywords) {
        return allKeywords.filter(keyword => 
            categoryKeywords.some(catKeyword => 
                keyword.toLowerCase().includes(catKeyword.toLowerCase()) ||
                catKeyword.toLowerCase().includes(keyword.toLowerCase())
            )
        );
    }

    analyzeMindsetKeywords(text) {
        const lowercaseText = text.toLowerCase();
        
        const growthCount = this.mindsetIndicators.growth
            .filter(word => lowercaseText.includes(word)).length;
        
        const fixedCount = this.mindsetIndicators.fixed
            .filter(word => lowercaseText.includes(word)).length;
        
        const resilienceCount = this.mindsetIndicators.resilience
            .filter(word => lowercaseText.includes(word)).length;
        
        const confidenceCount = this.mindsetIndicators.confidence
            .filter(word => lowercaseText.includes(word)).length;

        return {
            growth: growthCount,
            fixed: fixedCount,
            resilience: resilienceCount,
            confidence: confidenceCount,
            growthRatio: growthCount / Math.max(growthCount + fixedCount, 1)
        };
    }

    async calculateEnhancedLocalScores(responses, keywords, analysisResults) {
        const scores = {};
        const { patternScores, psychologicalProfile } = analysisResults;

        // 1. COMPETENCY (Knowledge + Skills) - Enhanced with strategic thinking patterns
        scores.competency = this.scoreCompetencyEnhanced(responses, keywords, patternScores);

        // 2. NETWORK - Enhanced with network strength patterns
        scores.network = this.scoreNetworkEnhanced(responses, keywords, patternScores);

        // 3. MINDSET - Enhanced with growth/fixed mindset analysis
        scores.mindset = this.scoreMindsetEnhanced(responses, keywords, patternScores, psychologicalProfile);

        // 4. EXECUTION - Enhanced with execution patterns
        scores.execution = this.scoreExecutionEnhanced(responses, keywords, patternScores);

        // 5. OPPORTUNITIES - Enhanced with strategic and risk patterns
        scores.opportunities = this.scoreOpportunitiesEnhanced(responses, keywords, patternScores);

        // Calculate overall score with pattern-based weighting
        scores.overall = this.calculateEnhancedOverallScore(scores, psychologicalProfile);

        return scores;
    }
    
    // Keep original method for fallback
    async calculateLocalScores(responses, keywords) {
        const scores = {};

        // 1. COMPETENCY (Knowledge + Skills)
        scores.competency = this.scoreCompetency(responses, keywords);

        // 2. NETWORK
        scores.network = this.scoreNetwork(responses, keywords);

        // 3. MINDSET (Growth mindset assessment)
        scores.mindset = this.scoreMindset(responses, keywords);

        // 4. EXECUTION
        scores.execution = this.scoreExecution(responses, keywords);

        // 5. OPPORTUNITIES
        scores.opportunities = this.scoreOpportunities(responses, keywords);

        // Calculate overall score
        scores.overall = this.calculateOverallScore(scores);

        return scores;
    }

    scoreCompetency(responses, keywords) {
        let score = 50; // Base score

        // Knowledge depth from domain expertise
        const domainAvg = ((responses.industryTrends || 3) + 
                          (responses.competitive || 3) + 
                          (responses.businessModels || 3)) / 3;
        score += (domainAvg - 3) * 15;

        // Skills from keywords
        const technicalSkills = keywords.technical.length;
        const businessSkills = keywords.business.length;
        const domainSkills = keywords.domain.length;
        
        score += Math.min(technicalSkills * 3, 15);
        score += Math.min(businessSkills * 3, 15);
        score += Math.min(domainSkills * 2, 10);

        // Experience level
        const decisionLevel = responses.decisionLevel;
        const decisionBonus = {
            'execution': 5,
            'tactical': 15,
            'strategic': 25,
            'ownership': 35
        };
        score += decisionBonus[decisionLevel] || 5;

        // Real impact quantification
        const realImpact = responses.realImpact || '';
        if (realImpact.match(/\d+/)) {
            score += 10; // Has quantified impact
        }

        return Math.max(0, Math.min(100, score));
    }

    scoreNetwork(responses, keywords) {
        let score = 50;

        // Support system
        const support = responses.support || [];
        score += Math.min(support.length * 8, 25);

        // Professional network indicators
        const networkKeywords = keywords.network.length;
        score += Math.min(networkKeywords * 5, 20);

        // Online presence
        const hasOnlinePresence = responses.blog || responses.twitter || responses.projects;
        if (hasOnlinePresence) score += 10;

        // Mentor access
        if (support.includes('mentor') || 
            (responses.beliefHelp && responses.beliefHelp.toLowerCase().includes('mentor'))) {
            score += 15;
        }

        // Professional connections mentioned in responses
        const whySucceed = responses.whySucceed || '';
        if (whySucceed.toLowerCase().includes('network') || 
            whySucceed.toLowerCase().includes('connections')) {
            score += 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    scoreMindset(responses, keywords) {
        let score = 50;

        // Growth mindset indicators
        const mindsetData = keywords.mindset;
        
        // Growth vs Fixed mindset ratio
        const growthRatio = mindsetData.growthRatio;
        score += (growthRatio - 0.5) * 40; // -20 to +20 based on ratio

        // Resilience indicators
        score += Math.min(mindsetData.resilience * 5, 20);

        // Confidence indicators
        score += Math.min(mindsetData.confidence * 3, 15);

        // Belief level (1-7 scale)
        const beliefLevel = responses.beliefLevel || 4;
        score += (beliefLevel - 4) * 5;

        // Obstacle handling capability
        const obstacleHandling = responses.handlingObstacles || 3;
        score += (obstacleHandling - 3) * 8;

        // Learning orientation
        const learningStyle = responses.learningStyle;
        if (learningStyle === 'structured' || learningStyle === 'research') {
            score += 5;
        }

        // Self-doubt management
        const selfDoubt = responses.selfDoubt || '';
        if (selfDoubt.length > 100) {
            score -= 10; // Extensive self-doubt
        }

        return Math.max(0, Math.min(100, score));
    }

    scoreExecution(responses, keywords) {
        let score = 50;

        // Track record of starting projects
        const startingProjects = responses.startingProjects || 3;
        score += (startingProjects - 3) * 10;

        // Execution keywords
        const executionKeywords = keywords.execution.length;
        score += Math.min(executionKeywords * 4, 20);

        // Time management and reality
        const timeReality = responses.timeReality || '';
        if (timeReality.length > 50 && timeReality.includes('hour')) {
            score += 10; // Detailed time planning
        }

        // Work traits alignment
        const workTraits = responses.workTraits || [];
        if (workTraits.includes('focused') || workTraits.includes('systematic')) {
            score += 10;
        }

        // Intensity level
        const intensityBonus = {
            'zen': 0,
            'balanced': 5,
            'high': 10,
            'beast': 15
        };
        score += intensityBonus[responses.intensity] || 0;

        // Readiness level
        const readinessBonus = {
            'exploring': 0,
            'ready': 15,
            'unstoppable': 25
        };
        score += readinessBonus[responses.readiness] || 0;

        return Math.max(0, Math.min(100, score));
    }

    scoreOpportunities(responses, keywords) {
        let score = 50;

        // Market knowledge
        const marketKnowledge = (responses.industryTrends || 3) + 
                               (responses.competitive || 3);
        score += (marketKnowledge - 6) * 5;

        // Timeline alignment with market
        const timeline = responses.timeline;
        if (timeline === 'sprint' && responses.industryTrends >= 4) {
            score += 15; // Good timing for fast-moving market
        }

        // Financial readiness
        const financialBonus = {
            'tight': -10,
            'limited': 0,
            'moderate': 10,
            'flexible': 20
        };
        score += financialBonus[responses.financial] || 0;

        // Risk tolerance vs opportunity
        const riskBonus = {
            'avoider': -5,
            'calculated': 10,
            'comfortable': 15,
            'seeker': 20
        };
        score += riskBonus[responses.riskTolerance] || 0;

        // Unique value proposition
        const uniqueValue = responses.uniqueValue || [];
        score += Math.min(uniqueValue.length * 8, 25);

        // Market positioning potential
        const dream = responses.dream || '';
        const why = responses.why || '';
        const hasMarketFocus = dream.toLowerCase().includes('market') ||
                              why.toLowerCase().includes('problem') ||
                              why.toLowerCase().includes('solution');
        if (hasMarketFocus) score += 10;

        return Math.max(0, Math.min(100, score));
    }
    
    // Enhanced scoring methods with pattern analysis
    scoreCompetencyEnhanced(responses, keywords, patternScores) {
        let baseScore = this.scoreCompetency(responses, keywords);
        
        // Apply strategic thinker pattern boost
        if (patternScores.strategicThinker?.strength > 0.6) {
            baseScore += patternScores.strategicThinker.strength * 15;
        }
        
        // Apply reality grounded pattern
        if (patternScores.realityGrounded?.strength > 0.5) {
            baseScore += patternScores.realityGrounded.strength * 10;
        }
        
        return Math.max(0, Math.min(100, baseScore));
    }
    
    scoreNetworkEnhanced(responses, keywords, patternScores) {
        let baseScore = this.scoreNetwork(responses, keywords);
        
        // Strong network pattern boost
        if (patternScores.networkStrong?.strength > 0.5) {
            baseScore += patternScores.networkStrong.strength * 20;
        }
        
        // High achiever network effects
        if (patternScores.highAchiever?.strength > 0.6) {
            baseScore += patternScores.highAchiever.strength * 10;
        }
        
        return Math.max(0, Math.min(100, baseScore));
    }
    
    scoreMindsetEnhanced(responses, keywords, patternScores, psychologicalProfile) {
        let baseScore = this.scoreMindset(responses, keywords);
        
        // Growth mindset boost
        if (patternScores.growthMindset?.strength > 0.5) {
            baseScore += patternScores.growthMindset.strength * 25;
        }
        
        // Fixed mindset penalty
        if (patternScores.fixedMindset?.strength > 0.3) {
            baseScore -= patternScores.fixedMindset.strength * 20;
        }
        
        // Passion-driven boost
        if (patternScores.passionDriven?.strength > 0.6) {
            baseScore += patternScores.passionDriven.strength * 15;
        }
        
        return Math.max(0, Math.min(100, baseScore));
    }
    
    scoreExecutionEnhanced(responses, keywords, patternScores) {
        let baseScore = this.scoreExecution(responses, keywords);
        
        // Execution oriented pattern boost
        if (patternScores.executionOriented?.strength > 0.5) {
            baseScore += patternScores.executionOriented.strength * 20;
        }
        
        // High achiever execution correlation
        if (patternScores.highAchiever?.strength > 0.6) {
            baseScore += patternScores.highAchiever.strength * 15;
        }
        
        return Math.max(0, Math.min(100, baseScore));
    }
    
    scoreOpportunitiesEnhanced(responses, keywords, patternScores) {
        let baseScore = this.scoreOpportunities(responses, keywords);
        
        // Strategic thinker opportunity recognition
        if (patternScores.strategicThinker?.strength > 0.5) {
            baseScore += patternScores.strategicThinker.strength * 20;
        }
        
        // Risk tolerance and opportunity correlation
        if (patternScores.riskTolerance?.strength > 0.5) {
            baseScore += patternScores.riskTolerance.strength * 15;
        }
        
        return Math.max(0, Math.min(100, baseScore));
    }
    
    calculateEnhancedOverallScore(scores, psychologicalProfile) {
        let baseOverall = this.calculateOverallScore(scores);
        
        // Personality type modifiers
        switch (psychologicalProfile.personalityType) {
            case 'achiever-executor':
                baseOverall += 5; // Natural advantage
                break;
            case 'strategic-thinker':
                baseOverall += 3; // Good foundation
                break;
            case 'passion-driven':
                baseOverall += 2; // Motivation advantage
                break;
        }
        
        return Math.max(0, Math.min(100, baseOverall));
    }

    calculateOverallScore(scores) {
        let weightedSum = 0;
        let totalWeight = 0;

        Object.entries(this.dimensions).forEach(([dimension, config]) => {
            if (scores[dimension] !== undefined) {
                weightedSum += scores[dimension] * config.weight;
                totalWeight += config.weight;
            }
        });

        return Math.round(weightedSum / totalWeight);
    }

    async getIntelligentOpenAIScoring(responses, keywords, localScores, analysisResults) {
        const isOllamaAvailable = await this.ollama.isAvailable();
        if (!isOllamaAvailable) {
            console.warn('Ollama not available for intelligent scoring');
            return localScores;
        }

        try {
            const prompt = this.buildIntelligentOpenAIPrompt(responses, keywords, localScores, analysisResults);
            
            const systemPrompt = `You are an elite performance psychologist and career strategist with expertise in:

🧠 PSYCHOLOGICAL ASSESSMENT:
- Advanced personality profiling and behavioral pattern analysis
- Growth vs Fixed mindset (Carol Dweck), Grit (Angela Duckworth), Flow State (Mihaly Csikszentmihalyi)
- Motivation theory (Self-Determination Theory, Achievement Goal Theory)
- Cognitive biases and decision-making patterns

💼 PROFESSIONAL DEVELOPMENT:
- Competency frameworks and skill gap analysis
- Network theory and social capital assessment
- Execution methodologies (OKRs, Agile, Design Thinking)
- Market opportunity evaluation and timing analysis

🎯 PERSONALIZATION:
- Individual difference psychology
- Learning style adaptation (VARK, Kolb)
- Cultural and contextual factors
- Realistic goal setting and achievement strategies

Your mission: Provide brutally honest, psychologically-grounded, actionable analysis that genuinely helps this person achieve their specific dream. Consider their unique psychological makeup, circumstances, and potential.

Principles:
1. Be realistic but encouraging
2. Focus on actionable insights over generic advice
3. Consider psychological patterns and cognitive biases
4. Provide specific, measurable recommendations
5. Address both strengths to leverage and risks to mitigate

Return your response as a valid JSON object.`;

            const fullPrompt = `${systemPrompt}\n\n${prompt}`;
            
            const result = await this.ollama.generateCompletion(fullPrompt, {
                temperature: 0.4,
                max_tokens: 1200,  // Reduced for faster response
                timeout: 90000     // 1.5 minute timeout
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            let aiResponse;
            try {
                const jsonMatch = result.response.match(/\{[\s\S]*\}/);
                const jsonString = jsonMatch ? jsonMatch[0] : result.response;
                aiResponse = JSON.parse(jsonString);
            } catch (parseError) {
                console.warn('Failed to parse Ollama JSON response, using local scores');
                return localScores;
            }
            
            // Store the comprehensive AI analysis
            this.lastAIAnalysis = aiResponse;
            
            return aiResponse.scores || localScores;
            
        } catch (error) {
            console.error('Intelligent Ollama scoring failed:', error);
            return localScores;
        }
    }
    
    // Enhanced method using Ollama
    async getOllamaScoring(responses, keywords, localScores) {
        const isAvailable = await this.ollama.isAvailable();
        if (!isAvailable) {
            console.warn('Ollama not available for enhanced scoring');
            return localScores;
        }

        try {
            const prompt = this.buildOpenAIPrompt(responses, keywords, localScores);
            
            const systemPrompt = `You are an expert career assessment specialist with deep knowledge of:
- Growth mindset vs Fixed mindset psychology (Carol Dweck's research)
- Competency frameworks and skill assessment
- Network effect and professional relationship building
- Execution capabilities and project management
- Market opportunity assessment and timing

Your task is to validate and enhance the local scoring algorithm by providing:
1. Refined scores for each dimension (0-100)
2. Confidence levels for each score
3. Key insights and recommendations
4. Risk factors and mitigation strategies

Be analytical, evidence-based, and provide specific reasoning for score adjustments.

Return your response as a valid JSON object.`;

            const fullPrompt = `${systemPrompt}\n\n${prompt}`;
            
            const result = await this.ollama.generateCompletion(fullPrompt, {
                temperature: 0.3,
                max_tokens: 1000,  // Reduced for faster response
                timeout: 60000     // 1 minute timeout
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            let aiResponse;
            try {
                const jsonMatch = result.response.match(/\{[\s\S]*\}/);
                const jsonString = jsonMatch ? jsonMatch[0] : result.response;
                aiResponse = JSON.parse(jsonString);
            } catch (parseError) {
                console.warn('Failed to parse Ollama JSON response, using local scores');
                return localScores;
            }

            return aiResponse.scores || localScores;
            
        } catch (error) {
            console.error('Ollama scoring failed:', error);
            return localScores;
        }
    }

    buildIntelligentOpenAIPrompt(responses, keywords, localScores, analysisResults) {
        const { psychologicalProfile, correlationInsights, riskFactors, successPredictors, responseMetrics } = analysisResults;
        
        return `
You are analyzing a comprehensive vision assessment with advanced psychological and behavioral insights. Use this intelligence to provide nuanced, personalized analysis.

USER PSYCHOLOGICAL PROFILE:
- Personality Type: ${psychologicalProfile?.personalityType || 'balanced'}
- Motivation Style: ${psychologicalProfile?.motivationStyle || 'mixed'}
- Risk Profile: ${psychologicalProfile?.riskProfile || 'moderate'}
- Decision Making: ${psychologicalProfile?.decisionMaking || 'analytical'}
- Dominant Traits: ${psychologicalProfile?.dominantTraits?.map(t => t.trait).join(', ') || 'balanced approach'}

CORRELATION INSIGHTS:
${(correlationInsights || []).map(insight => `- ${insight.pattern} (${Math.round(insight.strength * 100)}%): ${insight.implications}`).join('\n') || 'No specific correlations detected'}

SUCCESS PREDICTORS:
${(successPredictors || []).map(p => `- ${p.factor} (${p.strength}): ${p.description}`).join('\n') || 'Standard success factors apply'}

RISK FACTORS:
${(riskFactors || []).map(r => `- ${r.factor} (${r.severity}): ${r.description}`).join('\n') || 'No significant risks identified'}

RESPONSE QUALITY METRICS:
- Completeness: ${Math.round(responseMetrics?.completeness?.overall || 0)}%
- Consistency: ${responseMetrics?.consistency?.score || 0}%
- Depth: ${responseMetrics?.depth?.overall || 'basic'}

ALGORITHM SCORES (for reference):
- Competency: ${localScores.competency}/100
- Network: ${localScores.network}/100  
- Mindset: ${localScores.mindset}/100
- Execution: ${localScores.execution}/100
- Opportunities: ${localScores.opportunities}/100
- Overall: ${localScores.overall}/100

USER VISION & MOTIVATION:
Dream: "${responses.dream}"
Why Now: "${responses.why}"
Deep Motivation: "${responses.deepMotivation || 'Not provided'}"
Success Belief: "${responses.whySucceed || 'Not provided'}"
Past Lessons: "${responses.pastLessons || 'Not provided'}"

KEY RESPONSES:
- Belief Level: ${responses.beliefLevel}/7
- Gut Feeling: ${responses.gutFeeling}/100
- Readiness: ${responses.readiness}
- Timeline: ${responses.timeline}
- Risk Tolerance: ${responses.riskTolerance}
- Support System: ${responses.support?.join(', ') || 'None specified'}

Based on this comprehensive analysis, provide realistic, actionable insights that help this specific person achieve their dream. Consider their psychological profile, detected patterns, and unique circumstances.

Respond in this JSON format:
{
  "scores": {
    "competency": number (0-100),
    "network": number (0-100),
    "mindset": number (0-100),
    "execution": number (0-100),
    "opportunities": number (0-100),
    "overall": number (0-100)
  },
  "confidence_levels": {
    "competency": "HIGH|MEDIUM|LOW",
    "network": "HIGH|MEDIUM|LOW",
    "mindset": "HIGH|MEDIUM|LOW",
    "execution": "HIGH|MEDIUM|LOW",
    "opportunities": "HIGH|MEDIUM|LOW"
  },
  "personalized_insights": {
    "strengths": ["personalized strength 1", "strength 2", "strength 3"],
    "growth_areas": ["specific area 1", "area 2", "area 3"],
    "mindset_analysis": "detailed psychological mindset assessment",
    "success_probability": "realistic assessment of success likelihood",
    "key_challenges": "main obstacles this person will face",
    "motivation_sustainability": "assessment of long-term motivation"
  },
  "actionable_recommendations": {
    "immediate_actions": ["specific action 1", "action 2"],
    "30_day_plan": ["month 1 goal 1", "goal 2"],
    "90_day_plan": ["quarter goal 1", "goal 2"],
    "skill_development": ["skill to develop 1", "skill 2"],
    "network_building": ["networking action 1", "action 2"]
  },
  "risk_mitigation": [
    {"risk": "specific risk", "probability": "HIGH|MEDIUM|LOW", "mitigation": "specific strategy", "timeline": "when to address"}
  ],
  "success_accelerators": [
    {"factor": "what to leverage", "action": "how to leverage it", "impact": "expected benefit"}
  ]
}
        `;
    }

    combineIntelligentScores(correlationScores, localScores, enhancedScores) {
        const combined = {};
        
        // Intelligent weighting: 40% correlation analysis, 40% enhanced local, 20% AI
        Object.keys(localScores).forEach(dimension => {
            const correlationScore = correlationScores[dimension] || 50;
            const localScore = localScores[dimension];
            const aiScore = enhancedScores[dimension] || localScore;
            
            // Weighted combination with intelligence from correlation analysis
            combined[dimension] = Math.round(
                correlationScore * 0.4 + 
                localScore * 0.4 + 
                aiScore * 0.2
            );
        });
        
        return combined;
    }
    
    // Keep original method for fallback
    combineScores(localScores, enhancedScores) {
        const combined = {};
        
        // Weight local vs AI scores (70% local, 30% AI for stability)
        Object.keys(localScores).forEach(dimension => {
            const localScore = localScores[dimension];
            const aiScore = enhancedScores[dimension] || localScore;
            
            combined[dimension] = Math.round(localScore * 0.7 + aiScore * 0.3);
        });
        
        return combined;
    }

    async generateComprehensiveInsights(responses, keywords, scores, analysisResults) {
        const { correlationInsights, psychologicalProfile, riskFactors, successPredictors } = analysisResults;
        
        const insights = {
            strengths: [],
            growth_areas: [],
            risk_factors: [],
            recommendations: [],
            personality_insights: [],
            success_factors: [],
            next_steps: []
        };

        // AI-enhanced strengths based on patterns
        if (successPredictors && successPredictors.length > 0) {
            successPredictors.forEach(predictor => {
                insights.strengths.push(`${predictor.factor}: ${predictor.description}`);
                insights.success_factors.push(predictor.leverage);
            });
        }
        
        // Score-based strengths
        Object.entries(scores).forEach(([dimension, score]) => {
            if (dimension !== 'overall' && score >= 70) {
                const dimensionName = dimension.charAt(0).toUpperCase() + dimension.slice(1);
                insights.strengths.push(`Strong ${dimensionName}: ${this.getDimensionStrengthDescription(dimension)}`);
            }
        });

        // Pattern-based growth areas
        if (riskFactors && riskFactors.length > 0) {
            riskFactors.forEach(risk => {
                insights.growth_areas.push(`${risk.factor}: ${risk.description}`);
                insights.recommendations.push(risk.mitigation);
            });
        }
        
        // Score-based growth areas
        Object.entries(scores).forEach(([dimension, score]) => {
            if (dimension !== 'overall' && score < 60) {
                const dimensionName = dimension.charAt(0).toUpperCase() + dimension.slice(1);
                insights.growth_areas.push(`Develop ${dimensionName}: ${this.getDimensionGrowthDescription(dimension)}`);
            }
        });

        // Enhanced risk factors
        insights.risk_factors = riskFactors.map(risk => `${risk.factor} (${risk.severity}): ${risk.description}`);

        // Personality-based insights
        insights.personality_insights = [
            `Primary personality type: ${psychologicalProfile.personalityType}`,
            `Motivation style: ${psychologicalProfile.motivationStyle}`,
            `Risk profile: ${psychologicalProfile.riskProfile}`,
            `Decision making: ${psychologicalProfile.decisionMaking}`
        ];
        
        // Correlation-based insights
        if (correlationInsights && correlationInsights.length > 0) {
            correlationInsights.forEach(insight => {
                insights.personality_insights.push(`${insight.pattern}: ${insight.implications}`);
            });
        }

        // Personalized next steps
        insights.next_steps = this.generatePersonalizedNextSteps(scores, analysisResults);
        
        return insights;
    }

    async fallbackScoring(responses, resumeKeywords) {
        console.warn('Using fallback scoring method');
        
        const keywords = await this.extractAllKeywords(responses, resumeKeywords);
        const scores = await this.calculateLocalScores(responses, keywords);
        const insights = await this.generateInsights(responses, keywords, scores);
        
        return {
            scores,
            insights,
            keywords,
            processingTime: 50,
            method: 'fallback_local_only',
            timestamp: new Date().toISOString()
        };
    }
    
    getDimensionStrengthDescription(dimension) {
        const descriptions = {
            competency: 'Solid knowledge base and relevant skills for your domain',
            network: 'Good professional connections and support system',
            mindset: 'Positive growth-oriented thinking and resilience',
            execution: 'Proven ability to turn ideas into action and deliver results',
            opportunities: 'Good understanding of market timing and positioning'
        };
        return descriptions[dimension] || 'Strong performance in this area';
    }
    
    getDimensionGrowthDescription(dimension) {
        const descriptions = {
            competency: 'Focus on building domain expertise and relevant skills',
            network: 'Invest time in building professional relationships and mentorship',
            mindset: 'Work on developing growth mindset and confidence',
            execution: 'Improve project management and delivery capabilities',
            opportunities: 'Better understand market dynamics and timing'
        };
        return descriptions[dimension] || 'Area needing development and focus';
    }
    
    generatePersonalizedNextSteps(scores, analysisResults) {
        const { psychologicalProfile, riskFactors, successPredictors } = analysisResults;
        const steps = [];
        
        // Based on personality type
        switch (psychologicalProfile.personalityType) {
            case 'achiever-executor':
                steps.push('Set specific, measurable goals with clear deadlines');
                steps.push('Create accountability systems and progress tracking');
                break;
            case 'strategic-thinker':
                steps.push('Develop a comprehensive strategic plan for your vision');
                steps.push('Research market trends and competitive landscape deeply');
                break;
            case 'passion-driven':
                steps.push('Connect your daily actions to your core purpose');
                steps.push('Find communities that share your passion and values');
                break;
            default:
                steps.push('Identify your primary motivation and align actions accordingly');
        }
        
        // Based on lowest scoring dimension
        const lowestDimension = Object.entries(scores)
            .filter(([key]) => key !== 'overall')
            .sort(([,a], [,b]) => a - b)[0];
            
        if (lowestDimension && lowestDimension[1] < 60) {
            const [dimension] = lowestDimension;
            steps.push(`Priority: ${this.getDimensionGrowthDescription(dimension)}`);
        }
        
        // Based on highest risk factor
        const highRisk = riskFactors.find(r => r.severity === 'high');
        if (highRisk) {
            steps.push(`Address: ${highRisk.mitigation}`);
        }
        
        // Based on top success predictor
        const topPredictor = successPredictors.find(p => p.strength === 'high');
        if (topPredictor) {
            steps.push(`Leverage: ${topPredictor.leverage}`);
        }
        
        return steps;
    }
}

module.exports = { EnhancedVisionScoringEngine };