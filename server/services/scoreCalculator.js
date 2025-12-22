// comprehensiveScoringEngine.js
/**
 * Advanced rule-based scoring engine with comprehensive evaluation
 * Includes cross-validation, inconsistency detection, and psychological profiling
 */

class VisionScoringEngine {
    constructor() {
      this.weights = {
        visionClarity: 0.18,
        motivationAuthenticity: 0.16,
        executionReadiness: 0.15,
        foundationStrength: 0.14,
        knowledgeDepth: 0.12,
        hiddenAssets: 0.11,
        environmentSupport: 0.08,
        psychologicalProfile: 0.06
      };
    }
  
    scoreVision(responses, resumeKeywords = []) {
      const scores = {};
      const insights = {
        redFlags: [],
        inconsistencies: [],
        strengths: [],
        riskFactors: [],
        successPredictors: [],
        recommendedFocus: []
      };
  
      // Core scoring dimensions
      scores.visionClarity = this.scoreVisionClarity(responses, insights);
      scores.motivationAuthenticity = this.scoreMotivationAuthenticity(responses, insights);
      scores.executionReadiness = this.scoreExecutionReadiness(responses, insights);
      scores.foundationStrength = this.scoreFoundationStrength(responses, resumeKeywords, insights);
      scores.knowledgeDepth = this.scoreKnowledgeDepth(responses, resumeKeywords, insights);
      scores.hiddenAssets = this.scoreHiddenAssets(responses, insights);
      scores.environmentSupport = this.scoreEnvironmentSupport(responses, insights);
      scores.psychologicalProfile = this.scorePsychologicalProfile(responses, insights);
  
      // Cross-validation checks
      this.performCrossValidation(responses, scores, insights);
  
      // Calculate overall score
      scores.overall = this.calculateOverallScore(scores);
  
      // Generate detailed feedback
      const feedback = this.generateDetailedFeedback(scores, insights, responses);
  
      return {
        scores,
        insights,
        feedback,
        riskLevel: this.assessRiskLevel(scores, insights),
        successProbability: this.calculateSuccessProbability(scores, insights)
      };
    }
  
    // === 1. VISION CLARITY ===
    scoreVisionClarity(responses, insights) {
      let score = 50;
      
      // Dream analysis
      const dream = responses.dream || '';
      const dreamMetrics = this.analyzeTextQuality(dream);
      
      if (dreamMetrics.wordCount < 20) {
        insights.redFlags.push("Dream description too brief - lacks detail");
        score -= 15;
      } else if (dreamMetrics.wordCount > 100) {
        insights.strengths.push("Detailed, comprehensive vision");
        score += 10;
      }
  
      if (dreamMetrics.specificityScore < 0.3) {
        insights.inconsistencies.push("Dream lacks specificity - too vague");
        score -= 10;
      }
  
      if (dreamMetrics.hasNumbers) {
        insights.strengths.push("Quantified goals in vision");
        score += 5;
      }
  
      // Why analysis
      const why = responses.why || '';
      const whyMetrics = this.analyzeTextQuality(why);
      
      if (whyMetrics.emotionalIntensity < 0.4) {
        insights.riskFactors.push("Low emotional connection to goals");
        score -= 8;
      }
  
      if (whyMetrics.hasPersonalStory) {
        insights.strengths.push("Personal connection to goals");
        score += 8;
      }
  
      // Alignment checks
      const importanceMap = { 'curious': 0, 'interested': 25, 'committed': 50, 'obsessed': 75 };
      const importanceScore = importanceMap[responses.importance] || 0;
      
      if (responses.beliefLevel <= 3 && responses.importance === 'obsessed') {
        insights.inconsistencies.push("Claims obsession but low belief level");
        score -= 12;
      }
  
      if (responses.timeline === 'sprint' && dreamMetrics.complexity > 0.7) {
        insights.inconsistencies.push("Complex goal with unrealistic sprint timeline");
        score -= 8;
      }
  
      score += importanceScore * 0.4;
      score += (responses.beliefLevel || 4) * 5;
  
      return Math.max(0, Math.min(100, score));
    }
  
    // === 2. MOTIVATION AUTHENTICITY ===
    scoreMotivationAuthenticity(responses, insights) {
      let score = 50;
  
      const deepMotivation = responses.deepMotivation || '';
      const motivationMetrics = this.analyzeTextQuality(deepMotivation);
  
      // Depth analysis
      if (motivationMetrics.wordCount < 30) {
        insights.redFlags.push("Shallow motivation explanation");
        score -= 15;
      }
  
      if (motivationMetrics.emotionalIntensity > 0.6) {
        insights.strengths.push("Strong emotional drive");
        score += 12;
      }
  
      // Consistency checks
      const why = responses.why || '';
      const similarity = this.calculateTextSimilarity(deepMotivation, why);
      
      if (similarity < 0.2) {
        insights.inconsistencies.push("Inconsistent motivation explanations");
        score -= 10;
      } else if (similarity > 0.8) {
        insights.riskFactors.push("Repetitive motivation - may lack depth");
        score -= 5;
      }
  
      // Timeline vs importance alignment
      const timelineUrgency = { 'sprint': 3, 'marathon': 2, 'mountain': 1 };
      const importanceUrgency = { 'curious': 1, 'interested': 2, 'committed': 3, 'obsessed': 4 };
      
      const urgencyGap = Math.abs(
        (timelineUrgency[responses.timeline] || 2) - 
        (importanceUrgency[responses.importance] || 2)
      );
  
      if (urgencyGap >= 2) {
        insights.inconsistencies.push("Timeline doesn't match importance level");
        score -= 8;
      }
  
      // Risk tolerance vs goal ambition
      if (responses.riskTolerance === 'avoider' && responses.importance === 'obsessed') {
        insights.inconsistencies.push("Risk-averse but pursuing ambitious goals");
        score -= 7;
      }
  
      return Math.max(0, Math.min(100, score));
    }
  
    // === 3. EXECUTION READINESS ===
    scoreExecutionReadiness(responses, insights) {
      let score = 50;
  
      // Time commitment reality
      const timeReality = responses.timeReality || '';
      const timeMetrics = this.analyzeTextQuality(timeReality);
  
      if (timeMetrics.wordCount < 25) {
        insights.redFlags.push("Unrealistic time planning");
        score -= 12;
      }
  
      if (timeMetrics.hasScheduleDetails) {
        insights.strengths.push("Detailed time planning");
        score += 10;
      }
  
      // Work style alignment
      const workTraits = responses.workTraits || [];
      if (workTraits.includes('routine') && responses.learningStyle === 'spontaneous') {
        insights.inconsistencies.push("Contradictory work style preferences");
        score -= 6;
      }
  
      if (workTraits.includes('perfectionist') && responses.timeline === 'sprint') {
        insights.riskFactors.push("Perfectionist tendencies may slow sprint goals");
        score -= 5;
      }
  
      // Intensity vs time commitment
      const intensityMap = { 'zen': 1, 'balanced': 2, 'high': 3, 'beast': 4 };
      const commitmentMap = { 'micro': 1, 'focused': 3, 'flexible': 2 };
      
      const intensityLevel = intensityMap[responses.intensity] || 2;
      const commitmentLevel = commitmentMap[responses.timeCommitment] || 2;
  
      if (intensityLevel === 4 && commitmentLevel === 1) {
        insights.inconsistencies.push("Beast mode intensity with micro time commitment");
        score -= 10;
      }
  
      // Readiness indicators
      const readinessMap = { 'exploring': 20, 'ready': 50, 'unstoppable': 80 };
      score += (readinessMap[responses.readiness] || 20) * 0.3;
  
      // Past execution track record
      const startingScore = responses.startingProjects || 3;
      const finishingIndicator = responses.pastLessons ? 
        (responses.pastLessons.toLowerCase().includes('finish') || 
         responses.pastLessons.toLowerCase().includes('complete')) : false;
  
      if (startingScore >= 4 && finishingIndicator) {
        insights.strengths.push("Strong execution track record");
        score += 12;
      } else if (startingScore <= 2) {
        insights.riskFactors.push("Weak track record of starting projects");
        score -= 8;
      }
  
      return Math.max(0, Math.min(100, score));
    }
  
    // === 4. FOUNDATION STRENGTH ===
    scoreFoundationStrength(responses, resumeKeywords, insights) {
      let score = 50;
  
      // Experience relevance
      const whySucceed = responses.whySucceed || '';
      const succeedMetrics = this.analyzeTextQuality(whySucceed);
  
      if (succeedMetrics.wordCount < 30) {
        insights.redFlags.push("Weak foundation - can't articulate strengths");
        score -= 15;
      }
  
      if (succeedMetrics.hasExamples) {
        insights.strengths.push("Concrete examples of past success");
        score += 10;
      }
  
      // Resume alignment
      const dreamLower = (responses.dream || '').toLowerCase();
      const relevantKeywords = this.findRelevantKeywords(dreamLower, resumeKeywords);
      
      if (relevantKeywords.length === 0 && resumeKeywords.length > 5) {
        insights.inconsistencies.push("No relevant experience for stated goals");
        score -= 15;
      } else if (relevantKeywords.length >= 3) {
        insights.strengths.push("Strong relevant background");
        score += 12;
      }
  
      // Self-awareness from past lessons
      const pastLessons = responses.pastLessons || '';
      if (pastLessons.length > 50) {
        if (pastLessons.toLowerCase().includes('fail') || 
            pastLessons.toLowerCase().includes('mistake')) {
          insights.strengths.push("Self-aware from past experiences");
          score += 8;
        }
      } else {
        insights.riskFactors.push("Limited self-reflection on past attempts");
        score -= 5;
      }
  
      // Decision-making experience
      const decisionMap = { 'execution': 10, 'tactical': 25, 'strategic': 40, 'ownership': 55 };
      score += (decisionMap[responses.decisionLevel] || 10) * 0.5;
  
      return Math.max(0, Math.min(100, score));
    }
  
    // === 5. KNOWLEDGE DEPTH ===
    scoreKnowledgeDepth(responses, resumeKeywords, insights) {
      let score = 50;
  
      // Domain knowledge scores
      const industryScore = responses.industryTrends || 3;
      const competitiveScore = responses.competitive || 3;
      const businessScore = responses.businessModels || 3;
      
      const knowledgeAvg = (industryScore + competitiveScore + businessScore) / 3;
      score += (knowledgeAvg - 3) * 15;
  
      // Knowledge consistency check
      const knowledgeGap = Math.max(industryScore, competitiveScore, businessScore) - 
                          Math.min(industryScore, competitiveScore, businessScore);
      
      if (knowledgeGap > 2) {
        insights.inconsistencies.push("Uneven domain knowledge - gaps exist");
        score -= 8;
      }
  
      // Real impact analysis
      const realImpact = responses.realImpact || '';
      const impactMetrics = this.analyzeTextQuality(realImpact);
  
      if (impactMetrics.hasNumbers) {
        insights.strengths.push("Quantified past achievements");
        score += 12;
      }
  
      if (impactMetrics.wordCount < 40) {
        insights.redFlags.push("Limited evidence of real impact");
        score -= 10;
      }
  
      // Knowledge vs ambition alignment
      if (knowledgeAvg < 3 && responses.importance === 'obsessed') {
        insights.riskFactors.push("High ambition but low domain knowledge");
        score -= 12;
      }
  
      // Industry-specific checks
      const dream = (responses.dream || '').toLowerCase();
      if (dream.includes('startup') && businessScore < 3) {
        insights.inconsistencies.push("Wants startup but lacks business knowledge");
        score -= 10;
      }
  
      if (dream.includes('lead') || dream.includes('manage')) {
        if (responses.decisionLevel === 'execution') {
          insights.inconsistencies.push("Leadership goals but no leadership experience");
          score -= 8;
        }
      }
  
      return Math.max(0, Math.min(100, score));
    }
  
    // === 6. HIDDEN ASSETS ===
    scoreHiddenAssets(responses, insights) {
      let score = 50;
  
      // Digital presence
      const hasOnlinePresence = responses.blog || responses.twitter || responses.projects;
      if (hasOnlinePresence) {
        insights.strengths.push("Established online presence");
        score += 8;
      }
  
      // Unique value proposition
      const uniqueValue = responses.uniqueValue || [];
      if (uniqueValue.length >= 3) {
        insights.strengths.push("Multiple unique value propositions");
        score += 10;
      } else if (uniqueValue.length === 0) {
        insights.riskFactors.push("No clear unique value identified");
        score -= 8;
      }
  
      // Resilience indicators
      const obstacleScore = responses.handlingObstacles || 3;
      if (obstacleScore >= 4) {
        insights.strengths.push("Strong resilience and problem-solving");
        score += 10;
      } else if (obstacleScore <= 2) {
        insights.riskFactors.push("Poor track record with obstacles");
        score -= 10;
      }
  
      // Risk tolerance alignment
      const riskMap = { 'avoider': 0, 'calculated': 25, 'comfortable': 50, 'seeker': 75 };
      const riskScore = riskMap[responses.riskTolerance] || 25;
      score += riskScore * 0.2;
  
      // Project launching ability
      const projectScore = responses.startingProjects || 3;
      if (projectScore >= 4) {
        insights.strengths.push("Proven ability to start new initiatives");
        score += 8;
      }
  
      return Math.max(0, Math.min(100, score));
    }
  
    // === 7. ENVIRONMENT SUPPORT ===
    scoreEnvironmentSupport(responses, insights) {
      let score = 50;
  
      // Financial readiness
      const financialMap = { 'tight': -15, 'limited': -5, 'moderate': 10, 'flexible': 20 };
      const financialImpact = financialMap[responses.financial] || 0;
      score += financialImpact;
  
      if (responses.financial === 'tight' && responses.timeline === 'sprint') {
        insights.riskFactors.push("Financial constraints may limit quick progress");
        score -= 8;
      }
  
      // Support system
      const support = responses.support || [];
      if (support.length === 0) {
        insights.riskFactors.push("No support system identified");
        score -= 12;
      } else if (support.length >= 3) {
        insights.strengths.push("Strong support network");
        score += 10;
      }
  
      if (support.includes('solo') && support.length > 1) {
        insights.inconsistencies.push("Claims to prefer solo work but has support system");
        score -= 3;
      }
  
      // Self-doubt analysis
      const selfDoubt = responses.selfDoubt || '';
      const doubtMetrics = this.analyzeTextQuality(selfDoubt);
  
      if (doubtMetrics.emotionalIntensity > 0.7) {
        insights.riskFactors.push("High levels of self-doubt");
        score -= 10;
      }
  
      if (doubtMetrics.wordCount > 80) {
        insights.riskFactors.push("Extensive self-doubt concerns");
        score -= 8;
      }
  
      return Math.max(0, Math.min(100, score));
    }
  
    // === 8. PSYCHOLOGICAL PROFILE ===
    scorePsychologicalProfile(responses, insights) {
      let score = 50;
  
      // Belief vs gut feeling alignment
      const beliefLevel = responses.beliefLevel || 4;
      const gutFeeling = responses.gutFeeling || 50;
      
      const beliefNormalized = (beliefLevel / 7) * 100;
      const beliefGutGap = Math.abs(beliefNormalized - gutFeeling);
  
      if (beliefGutGap > 30) {
        insights.inconsistencies.push("Misalignment between belief and gut feeling");
        score -= 10;
      }
  
      if (beliefLevel >= 6) {
        insights.strengths.push("Strong self-confidence");
        score += 12;
      } else if (beliefLevel <= 3) {
        insights.riskFactors.push("Low self-belief may hinder progress");
        score -= 10;
      }
  
      // Psychological consistency checks
      if (responses.intensity === 'beast' && responses.riskTolerance === 'avoider') {
        insights.inconsistencies.push("High intensity but risk-averse - conflicting traits");
        score -= 8;
      }
  
      // Growth mindset indicators
      const beliefHelp = responses.beliefHelp || '';
      if (beliefHelp.toLowerCase().includes('mentor') || 
          beliefHelp.toLowerCase().includes('learn') ||
          beliefHelp.toLowerCase().includes('practice')) {
        insights.strengths.push("Growth mindset - seeks improvement");
        score += 8;
      }
  
      return Math.max(0, Math.min(100, score));
    }
  
    // === CROSS-VALIDATION ===
    performCrossValidation(responses, scores, insights) {
      // High motivation but low readiness
      if (scores.motivationAuthenticity > 70 && scores.executionReadiness < 40) {
        insights.inconsistencies.push("High motivation but poor execution readiness");
      }
  
      // Strong knowledge but weak foundation
      if (scores.knowledgeDepth > 70 && scores.foundationStrength < 40) {
        insights.inconsistencies.push("Good knowledge but weak practical foundation");
      }
  
      // Confidence vs environment mismatch
      if (scores.psychologicalProfile > 70 && scores.environmentSupport < 30) {
        insights.riskFactors.push("High confidence but unsupportive environment");
      }
  
      // Overconfidence check
      if (scores.motivationAuthenticity > 80 && 
          scores.knowledgeDepth < 40 && 
          scores.foundationStrength < 40) {
        insights.redFlags.push("Potential overconfidence - high motivation despite weak foundation");
      }
  
      // Underconfidence check
      if (scores.foundationStrength > 70 && 
          scores.knowledgeDepth > 60 && 
          scores.psychologicalProfile < 40) {
        insights.recommendedFocus.push("Building self-confidence - foundation is stronger than belief");
      }
    }
  
    // === UTILITY METHODS ===
    analyzeTextQuality(text) {
      if (!text) return { wordCount: 0, specificityScore: 0, emotionalIntensity: 0, hasNumbers: false, hasExamples: false, hasPersonalStory: false, hasScheduleDetails: false, complexity: 0 };
  
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
  
      // Specificity indicators
      const specificWords = ['specific', 'exactly', 'precisely', 'particular', 'detailed'];
      const specificityScore = specificWords.filter(w => text.toLowerCase().includes(w)).length / specificWords.length;
  
      // Emotional intensity
      const emotionalWords = ['passionate', 'excited', 'frustrated', 'angry', 'love', 'hate', 'dream', 'fear', 'hope', 'desperate', 'determined'];
      const emotionalIntensity = emotionalWords.filter(w => text.toLowerCase().includes(w)).length / emotionalWords.length;
  
      // Numbers present
      const hasNumbers = /\d/.test(text);
  
      // Examples present
      const hasExamples = text.toLowerCase().includes('example') || text.toLowerCase().includes('instance') || text.toLowerCase().includes('like when');
  
      // Personal story indicators
      const hasPersonalStory = text.toLowerCase().includes('my') || text.toLowerCase().includes('i ') || text.toLowerCase().includes('when i');
  
      // Schedule details
      const hasScheduleDetails = text.toLowerCase().includes('am') || text.toLowerCase().includes('pm') || 
                                text.toLowerCase().includes('morning') || text.toLowerCase().includes('evening') ||
                                text.toLowerCase().includes('monday') || text.toLowerCase().includes('tuesday');
  
      // Complexity (sentence length variance)
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / Math.max(sentences.length, 1);
      const complexity = Math.min(avgSentenceLength / 20, 1); // Normalize to 0-1
  
      return {
        wordCount,
        specificityScore,
        emotionalIntensity,
        hasNumbers,
        hasExamples,
        hasPersonalStory,
        hasScheduleDetails,
        complexity
      };
    }
  
    calculateTextSimilarity(text1, text2) {
      if (!text1 || !text2) return 0;
      
      const words1 = new Set(text1.toLowerCase().split(/\s+/));
      const words2 = new Set(text2.toLowerCase().split(/\s+/));
      
      const intersection = new Set([...words1].filter(w => words2.has(w)));
      const union = new Set([...words1, ...words2]);
      
      return intersection.size / union.size;
    }
  
    findRelevantKeywords(dream, resumeKeywords) {
      const dreamWords = dream.split(/\s+/).map(w => w.toLowerCase());
      return resumeKeywords.filter(keyword => 
        dreamWords.some(word => word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word))
      );
    }
  
    calculateOverallScore(scores) {
      return Math.round(
        Object.entries(this.weights).reduce((total, [key, weight]) => {
          return total + (scores[key] || 0) * weight;
        }, 0)
      );
    }
  
    assessRiskLevel(scores, insights) {
      const redFlagCount = insights.redFlags.length;
      const inconsistencyCount = insights.inconsistencies.length;
      const riskFactorCount = insights.riskFactors.length;
      
      const riskScore = redFlagCount * 3 + inconsistencyCount * 2 + riskFactorCount;
      
      if (riskScore >= 10) return 'HIGH';
      if (riskScore >= 5) return 'MEDIUM';
      return 'LOW';
    }
  
    calculateSuccessProbability(scores, insights) {
      const baseScore = scores.overall;
      const redFlagPenalty = insights.redFlags.length * 5;
      const strengthBonus = insights.strengths.length * 2;
      
      const adjustedScore = Math.max(0, Math.min(100, baseScore - redFlagPenalty + strengthBonus));
      
      return {
        percentage: adjustedScore,
        confidence: insights.inconsistencies.length < 3 ? 'HIGH' : 'MEDIUM'
      };
    }
  
    generateDetailedFeedback(scores, insights, responses) {
      const feedback = {
        topStrengths: insights.strengths.slice(0, 3),
        criticalIssues: insights.redFlags,
        actionPriorities: [],
        riskMitigations: []
      };
  
      // Generate action priorities based on lowest scores
      const sortedScores = Object.entries(scores)
        .filter(([key]) => key !== 'overall')
        .sort(([,a], [,b]) => a - b);
  
      const lowestArea = sortedScores[0];
      if (lowestArea[1] < 60) {
        feedback.actionPriorities.push(`Urgent: Improve ${lowestArea[0].replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
  
      // Risk mitigations
      if (insights.riskFactors.length > 0) {
        feedback.riskMitigations = insights.riskFactors.map(risk => ({
          risk,
          mitigation: this.generateMitigation(risk)
        }));
      }
  
      return feedback;
    }
  
    generateMitigation(risk) {
      const mitigationMap = {
        'Low emotional connection to goals': 'Reconnect with your deeper why - what personal meaning drives this goal?',
        'No support system identified': 'Build relationships with mentors, peers, or communities in your target field',
        'Financial constraints may limit quick progress': 'Focus on low-cost/free resources and consider extending timeline',
        'High levels of self-doubt': 'Start with small wins to build confidence and evidence of capability',
        'Poor track record with obstacles': 'Develop resilience through obstacle planning and stress management',
        'Weak track record of starting projects': 'Begin with micro-commitments and gradually increase scope'
      };
  
      return mitigationMap[risk] || 'Consult with a mentor or coach for personalized guidance';
    }
  }

function calculateScores(responses, resumeKeywords = []) {
  const engine = new VisionScoringEngine();
  return engine.scoreVision(responses, resumeKeywords);
}

module.exports = { calculateScores, VisionScoringEngine };
