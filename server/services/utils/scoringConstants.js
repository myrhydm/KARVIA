const SCORING_WEIGHTS = {
  visionClarity: 0.18,
  motivationAuthenticity: 0.16,
  executionReadiness: 0.15,
  foundationStrength: 0.14,
  knowledgeDepth: 0.12,
  hiddenAssets: 0.11,
  environmentSupport: 0.08,
  psychologicalProfile: 0.06
};

const SCORE_MAPPINGS = {
  importance: {
    'curious': 0,
    'interested': 25, 
    'committed': 50,
    'obsessed': 75
  },
  
  readiness: {
    'exploring': 20,
    'ready': 50, 
    'unstoppable': 80
  },
  
  timeline: {
    'sprint': 3,
    'marathon': 2,
    'mountain': 1
  },
  
  financial: {
    'tight': -15,
    'limited': -5,
    'moderate': 10,
    'flexible': 20
  },
  
  intensity: {
    'zen': 1,
    'balanced': 2,
    'high': 3,
    'beast': 4
  },
  
  riskTolerance: {
    'avoider': 0,
    'calculated': 25,
    'comfortable': 50,
    'seeker': 75
  },
  
  decisionLevel: {
    'execution': 10,
    'tactical': 25,
    'strategic': 40,
    'ownership': 55
  }
};

module.exports = { SCORING_WEIGHTS, SCORE_MAPPINGS };
