/**
 * Vision Response Analyzer - Intelligent Analysis of Questionnaire Responses
 * Analyzes correlations between responses to determine psychological and behavioral factors
 * Creates deeper insights for enhanced LLM analysis and realistic user assessment
 */

class VisionResponseAnalyzer {
    constructor() {
        // Define response correlation patterns for psychological insights
        this.correlationPatterns = {
            // High Achiever Pattern
            highAchiever: {
                indicators: ['beliefLevel', 'gutFeeling', 'handlingObstacles', 'startingProjects'],
                thresholds: { beliefLevel: 6, gutFeeling: 70, handlingObstacles: 4, startingProjects: 4 },
                weight: 1.2
            },
            
            // Growth Mindset Pattern
            growthMindset: {
                textFields: ['whySucceed', 'pastLessons', 'deepMotivation'],
                keywords: ['learn', 'grow', 'improve', 'develop', 'challenge', 'practice', 'feedback'],
                weight: 1.1
            },
            
            // Fixed Mindset Pattern (negative indicator)
            fixedMindset: {
                textFields: ['selfDoubt', 'beliefHelp'],
                keywords: ['can\'t', 'impossible', 'not good at', 'born with', 'talent', 'natural'],
                weight: -0.8
            },
            
            // Strategic Thinker Pattern
            strategicThinker: {
                indicators: ['industryTrends', 'competitive', 'businessModels', 'decisionLevel'],
                thresholds: { industryTrends: 4, competitive: 4, businessModels: 4 },
                textAnalysis: ['realImpact', 'whySucceed'],
                weight: 1.0
            },
            
            // Execution Pattern
            executionOriented: {
                indicators: ['readiness', 'timeCommitment', 'intensity', 'startingProjects'],
                qualitative: ['projects', 'realImpact'],
                weight: 1.1
            },
            
            // Network Strength Pattern
            networkStrong: {
                indicators: ['support'],
                textFields: ['whySucceed', 'beliefHelp'],
                networkKeywords: ['mentor', 'team', 'network', 'connections', 'colleagues', 'advisor'],
                weight: 1.0
            },
            
            // Risk Tolerance Pattern
            riskTolerance: {
                indicators: ['riskTolerance', 'financial', 'timeline'],
                correlations: {
                    high: { riskTolerance: 'seeker', timeline: 'sprint' },
                    medium: { riskTolerance: 'comfortable', timeline: 'marathon' },
                    low: { riskTolerance: 'avoider', financial: 'tight' }
                },
                weight: 0.9
            },
            
            // Reality Grounding Pattern
            realityGrounded: {
                textFields: ['timeReality', 'selfDoubt'],
                qualitativeIndicators: ['timeReality length > 50', 'detailed planning'],
                weight: 1.0
            },
            
            // Passion/Motivation Pattern
            passionDriven: {
                indicators: ['importance', 'beliefLevel', 'gutFeeling'],
                textFields: ['dream', 'why', 'deepMotivation'],
                emotionalKeywords: ['love', 'passionate', 'excited', 'dream', 'mission', 'purpose'],
                weight: 1.1
            }
        };

        // Factor weights for each of the 5 dimensions
        this.dimensionFactors = {
            competency: {
                primary: ['strategicThinker', 'realityGrounded'],
                secondary: ['executionOriented', 'growthMindset'],
                weight: 0.25
            },
            network: {
                primary: ['networkStrong'],
                secondary: ['highAchiever', 'strategicThinker'],
                weight: 0.20
            },
            mindset: {
                primary: ['growthMindset', 'passionDriven'],
                secondary: ['highAchiever'],
                negative: ['fixedMindset'],
                weight: 0.20
            },
            execution: {
                primary: ['executionOriented', 'highAchiever'],
                secondary: ['realityGrounded', 'riskTolerance'],
                weight: 0.20
            },
            opportunities: {
                primary: ['strategicThinker', 'riskTolerance'],
                secondary: ['networkStrong', 'passionDriven'],
                weight: 0.15
            }
        };
    }

    /**
     * Analyze user responses to detect psychological and behavioral patterns
     */
    analyzeResponsePatterns(responses) {
        const patternScores = {};
        const correlationInsights = [];
        
        // Analyze each pattern
        Object.entries(this.correlationPatterns).forEach(([patternName, pattern]) => {
            const score = this.calculatePatternScore(responses, pattern);
            patternScores[patternName] = score;
            
            if (score.strength > 0.6) {
                correlationInsights.push({
                    pattern: patternName,
                    strength: score.strength,
                    evidence: score.evidence,
                    implications: this.getPatternImplications(patternName, score.strength)
                });
            }
        });

        return {
            patternScores,
            correlationInsights,
            dimensionReadiness: this.calculateDimensionReadiness(patternScores),
            psychologicalProfile: this.createPsychologicalProfile(patternScores, responses),
            riskFactors: this.identifyRiskFactors(patternScores, responses),
            successPredictors: this.identifySuccessPredictors(patternScores, responses)
        };
    }

    /**
     * Calculate pattern score based on response correlations
     */
    calculatePatternScore(responses, pattern) {
        let score = 0;
        let maxScore = 0;
        const evidence = [];

        // Analyze numerical indicators
        if (pattern.indicators) {
            pattern.indicators.forEach(indicator => {
                const value = responses[indicator];
                if (value !== undefined) {
                    const threshold = pattern.thresholds?.[indicator];
                    if (threshold) {
                        const normalized = Math.min(value / threshold, 1.5); // Allow exceeding threshold
                        score += normalized;
                        maxScore += 1;
                        if (normalized >= 1) {
                            evidence.push(`Strong ${indicator}: ${value}`);
                        }
                    } else {
                        // For non-threshold indicators, normalize differently
                        const normalized = this.normalizeValue(indicator, value);
                        score += normalized;
                        maxScore += 1;
                        if (normalized > 0.7) {
                            evidence.push(`High ${indicator}: ${value}`);
                        }
                    }
                }
            });
        }

        // Analyze text fields for keywords
        if (pattern.textFields && pattern.keywords) {
            pattern.textFields.forEach(field => {
                const text = responses[field] || '';
                const keywordMatches = this.countKeywordMatches(text, pattern.keywords);
                if (keywordMatches > 0) {
                    score += keywordMatches * 0.3;
                    maxScore += 1;
                    evidence.push(`Keyword matches in ${field}: ${keywordMatches}`);
                }
            });
        }

        // Analyze qualitative indicators
        if (pattern.qualitative) {
            pattern.qualitative.forEach(field => {
                const value = responses[field];
                if (value && typeof value === 'string' && value.length > 50) {
                    score += 0.5;
                    maxScore += 1;
                    evidence.push(`Detailed response in ${field}`);
                }
            });
        }

        // Special handling for network keywords
        if (pattern.networkKeywords) {
            pattern.textFields?.forEach(field => {
                const text = responses[field] || '';
                const networkMatches = this.countKeywordMatches(text, pattern.networkKeywords);
                if (networkMatches > 0) {
                    score += networkMatches * 0.4;
                    maxScore += 1;
                    evidence.push(`Network indicators in ${field}: ${networkMatches}`);
                }
            });
        }

        const strength = maxScore > 0 ? (score / maxScore) * (pattern.weight || 1) : 0;
        return {
            strength: Math.min(strength, 1.5), // Cap at 1.5 for exceptional cases
            evidence,
            rawScore: score,
            maxScore
        };
    }

    /**
     * Count keyword matches in text
     */
    countKeywordMatches(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.filter(keyword => lowerText.includes(keyword.toLowerCase())).length;
    }

    /**
     * Normalize values based on field type
     */
    normalizeValue(field, value) {
        const normalizations = {
            beliefLevel: v => v / 7,
            gutFeeling: v => v / 100,
            handlingObstacles: v => v / 5,
            startingProjects: v => v / 5,
            industryTrends: v => v / 5,
            competitive: v => v / 5,
            businessModels: v => v / 5,
        };

        if (normalizations[field]) {
            return normalizations[field](value);
        }

        // Default normalization for arrays or other types
        if (Array.isArray(value)) {
            return Math.min(value.length / 3, 1); // Normalize based on array length
        }

        return 0.5; // Default middle value for unknown types
    }

    /**
     * Calculate readiness for each dimension based on pattern scores
     */
    calculateDimensionReadiness(patternScores) {
        const dimensionScores = {};

        Object.entries(this.dimensionFactors).forEach(([dimension, factors]) => {
            let score = 50; // Base score

            // Primary factors (higher weight)
            factors.primary?.forEach(pattern => {
                const patternScore = patternScores[pattern]?.strength || 0;
                score += patternScore * 30; // Max +30 per primary factor
            });

            // Secondary factors (lower weight)
            factors.secondary?.forEach(pattern => {
                const patternScore = patternScores[pattern]?.strength || 0;
                score += patternScore * 15; // Max +15 per secondary factor
            });

            // Negative factors
            factors.negative?.forEach(pattern => {
                const patternScore = patternScores[pattern]?.strength || 0;
                score -= patternScore * 20; // Max -20 per negative factor
            });

            dimensionScores[dimension] = Math.max(0, Math.min(100, score));
        });

        // Calculate overall score
        const overall = Object.entries(dimensionScores).reduce((sum, [dim, score]) => {
            return sum + (score * this.dimensionFactors[dim].weight);
        }, 0);

        dimensionScores.overall = Math.round(overall);

        return dimensionScores;
    }

    /**
     * Create psychological profile based on patterns
     */
    createPsychologicalProfile(patternScores, responses) {
        const profile = {
            dominantTraits: [],
            personalityType: 'balanced',
            motivationStyle: 'mixed',
            decisionMaking: 'analytical',
            riskProfile: 'moderate'
        };

        // Identify dominant traits
        Object.entries(patternScores).forEach(([pattern, score]) => {
            if (score.strength > 0.7) {
                profile.dominantTraits.push({
                    trait: pattern,
                    strength: score.strength,
                    evidence: score.evidence
                });
            }
        });

        // Determine personality type
        if (patternScores.highAchiever?.strength > 0.7 && patternScores.executionOriented?.strength > 0.7) {
            profile.personalityType = 'achiever-executor';
        } else if (patternScores.strategicThinker?.strength > 0.7) {
            profile.personalityType = 'strategic-thinker';
        } else if (patternScores.passionDriven?.strength > 0.7) {
            profile.personalityType = 'passion-driven';
        }

        // Determine motivation style
        const importance = responses.importance;
        if (importance === 'obsessed') {
            profile.motivationStyle = 'intrinsic-high';
        } else if (importance === 'committed') {
            profile.motivationStyle = 'intrinsic-moderate';
        } else {
            profile.motivationStyle = 'exploring';
        }

        // Determine risk profile
        const riskTolerance = responses.riskTolerance;
        if (riskTolerance === 'seeker') {
            profile.riskProfile = 'high';
        } else if (riskTolerance === 'comfortable') {
            profile.riskProfile = 'moderate-high';
        } else if (riskTolerance === 'calculated') {
            profile.riskProfile = 'moderate';
        } else {
            profile.riskProfile = 'conservative';
        }

        return profile;
    }

    /**
     * Identify risk factors that could hinder success
     */
    identifyRiskFactors(patternScores, responses) {
        const risks = [];

        // Fixed mindset risk
        if (patternScores.fixedMindset?.strength > 0.5) {
            risks.push({
                factor: 'Fixed Mindset',
                severity: 'high',
                description: 'Strong fixed mindset patterns may limit growth and adaptation',
                mitigation: 'Focus on developing growth mindset through learning and feedback'
            });
        }

        // Low confidence risk
        if (responses.gutFeeling < 40 || responses.beliefLevel < 4) {
            risks.push({
                factor: 'Low Confidence',
                severity: 'medium',
                description: 'Self-doubt may hinder progress and decision-making',
                mitigation: 'Build confidence through small wins and skill development'
            });
        }

        // Poor execution pattern
        if (patternScores.executionOriented?.strength < 0.3) {
            risks.push({
                factor: 'Execution Gap',
                severity: 'high',
                description: 'Weak execution patterns may prevent turning ideas into reality',
                mitigation: 'Develop project management skills and accountability systems'
            });
        }

        // Weak network
        if (patternScores.networkStrong?.strength < 0.3) {
            risks.push({
                factor: 'Limited Network',
                severity: 'medium',
                description: 'Weak professional network may limit opportunities and support',
                mitigation: 'Actively build professional relationships and seek mentorship'
            });
        }

        // Financial constraints
        if (responses.financial === 'tight') {
            risks.push({
                factor: 'Financial Constraints',
                severity: 'medium',
                description: 'Limited financial flexibility may restrict options',
                mitigation: 'Develop financial planning and consider low-cost alternatives'
            });
        }

        return risks;
    }

    /**
     * Identify success predictors based on patterns
     */
    identifySuccessPredictors(patternScores, responses) {
        const predictors = [];

        // High achiever predictor
        if (patternScores.highAchiever?.strength > 0.7) {
            predictors.push({
                factor: 'High Achievement Orientation',
                strength: 'high',
                description: 'Strong drive and self-belief predict success',
                leverage: 'Channel this drive into strategic goal-setting'
            });
        }

        // Growth mindset predictor
        if (patternScores.growthMindset?.strength > 0.6) {
            predictors.push({
                factor: 'Growth Mindset',
                strength: 'high',
                description: 'Willingness to learn and adapt is crucial for success',
                leverage: 'Embrace challenges as learning opportunities'
            });
        }

        // Strategic thinking predictor
        if (patternScores.strategicThinker?.strength > 0.6) {
            predictors.push({
                factor: 'Strategic Thinking',
                strength: 'medium',
                description: 'Good market understanding and strategic perspective',
                leverage: 'Use strategic insights for competitive advantage'
            });
        }

        // Passion-driven predictor
        if (patternScores.passionDriven?.strength > 0.7) {
            predictors.push({
                factor: 'Passion and Purpose',
                strength: 'high',
                description: 'Strong passion provides sustainable motivation',
                leverage: 'Align goals with your core purpose and values'
            });
        }

        return predictors;
    }

    /**
     * Get implications of detected patterns
     */
    getPatternImplications(patternName, strength) {
        const implications = {
            highAchiever: 'Strong self-belief and goal orientation suggest high potential for success',
            growthMindset: 'Learning orientation will help overcome challenges and adapt to changes',
            fixedMindset: 'May struggle with setbacks and feedback - focus on developing growth mindset',
            strategicThinker: 'Good market awareness provides foundation for strategic decisions',
            executionOriented: 'Strong execution skills increase likelihood of turning ideas into reality',
            networkStrong: 'Good professional network provides support and opportunities',
            riskTolerance: 'Risk orientation affects opportunity evaluation and decision timing',
            realityGrounded: 'Realistic planning helps set achievable goals and timelines',
            passionDriven: 'Passion provides intrinsic motivation for sustained effort'
        };

        return implications[patternName] || 'Pattern provides insights into personality and capabilities';
    }

    /**
     * Generate comprehensive analysis summary for LLM enhancement
     */
    generateAnalysisSummary(responses, analysisResults) {
        return {
            responseMetrics: {
                completeness: this.calculateCompleteness(responses),
                consistency: this.checkResponseConsistency(responses),
                depth: this.assessResponseDepth(responses)
            },
            correlationInsights: analysisResults.correlationInsights,
            psychologicalProfile: analysisResults.psychologicalProfile,
            dimensionReadiness: analysisResults.dimensionReadiness,
            riskFactors: analysisResults.riskFactors,
            successPredictors: analysisResults.successPredictors,
            recommendationAreas: this.generateRecommendationAreas(analysisResults),
            personalizationFactors: this.extractPersonalizationFactors(responses, analysisResults)
        };
    }

    /**
     * Calculate response completeness
     */
    calculateCompleteness(responses) {
        const requiredFields = ['dream', 'why', 'importance', 'timeline', 'readiness'];
        const optional = ['deepMotivation', 'whySucceed', 'pastLessons', 'realImpact'];
        
        const requiredComplete = requiredFields.filter(field => responses[field]).length;
        const optionalComplete = optional.filter(field => responses[field]).length;
        
        return {
            required: (requiredComplete / requiredFields.length) * 100,
            optional: (optionalComplete / optional.length) * 100,
            overall: ((requiredComplete * 2 + optionalComplete) / (requiredFields.length * 2 + optional.length)) * 100
        };
    }

    /**
     * Check response consistency
     */
    checkResponseConsistency(responses) {
        const consistencyChecks = [];
        
        // Check belief vs gut feeling alignment
        const beliefLevel = responses.beliefLevel || 4;
        const gutFeeling = responses.gutFeeling || 50;
        const beliefGutAlignment = Math.abs((beliefLevel / 7) - (gutFeeling / 100));
        
        if (beliefGutAlignment > 0.3) {
            consistencyChecks.push('Belief level and gut feeling show some misalignment');
        }
        
        // Check readiness vs timeline alignment
        const readiness = responses.readiness;
        const timeline = responses.timeline;
        if (readiness === 'unstoppable' && timeline === 'lifetime') {
            consistencyChecks.push('High readiness with long timeline may indicate unclear urgency');
        }
        
        return {
            score: Math.max(0, 100 - (consistencyChecks.length * 20)),
            issues: consistencyChecks
        };
    }

    /**
     * Assess response depth and thoughtfulness
     */
    assessResponseDepth(responses) {
        const textFields = ['dream', 'why', 'deepMotivation', 'whySucceed', 'pastLessons', 'realImpact'];
        const depths = textFields.map(field => {
            const text = responses[field] || '';
            return {
                field,
                length: text.length,
                depth: text.length > 100 ? 'high' : text.length > 50 ? 'medium' : 'low'
            };
        });
        
        const avgDepth = depths.reduce((sum, d) => sum + d.length, 0) / depths.length;
        
        return {
            average: avgDepth,
            fieldDepths: depths,
            overall: avgDepth > 100 ? 'thoughtful' : avgDepth > 50 ? 'adequate' : 'brief'
        };
    }

    /**
     * Generate recommendation areas based on analysis
     */
    generateRecommendationAreas(analysisResults) {
        const areas = [];
        const { dimensionReadiness, riskFactors, successPredictors } = analysisResults;
        
        // Find lowest scoring dimension for improvement focus
        const lowestDimension = Object.entries(dimensionReadiness)
            .filter(([key]) => key !== 'overall')
            .sort(([,a], [,b]) => a - b)[0];
            
        if (lowestDimension && lowestDimension[1] < 60) {
            areas.push({
                area: 'Primary Development',
                focus: lowestDimension[0],
                score: lowestDimension[1],
                priority: 'high'
            });
        }
        
        // Add risk mitigation areas
        riskFactors.filter(r => r.severity === 'high').forEach(risk => {
            areas.push({
                area: 'Risk Mitigation',
                focus: risk.factor,
                priority: 'high',
                action: risk.mitigation
            });
        });
        
        // Add strength leverage areas
        successPredictors.filter(p => p.strength === 'high').forEach(predictor => {
            areas.push({
                area: 'Strength Leverage',
                focus: predictor.factor,
                priority: 'medium',
                action: predictor.leverage
            });
        });
        
        return areas;
    }

    /**
     * Extract personalization factors for customized recommendations
     */
    extractPersonalizationFactors(responses, analysisResults) {
        return {
            learningStyle: responses.learningStyle,
            workStyle: responses.workTraits,
            timePreference: responses.timeCommitment,
            intensityLevel: responses.intensity,
            riskProfile: analysisResults.psychologicalProfile.riskProfile,
            motivationStyle: analysisResults.psychologicalProfile.motivationStyle,
            dominantTraits: analysisResults.psychologicalProfile.dominantTraits.map(t => t.trait),
            timeline: responses.timeline,
            supportSystem: responses.support
        };
    }
}

module.exports = { VisionResponseAnalyzer };