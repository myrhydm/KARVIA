const DIMENSION_CONFIG = {
  vision: {
    weight: 0.2,
    color: '#8b5cf6',
    components: ['visionClarity']
  },
  drive: {
    weight: 0.2,
    color: '#ef4444',
    components: ['motivationAuthenticity', 'psychologicalProfile']
  },
  execution: {
    weight: 0.2,
    color: '#3b82f6',
    components: ['executionReadiness', 'hiddenAssets']
  },
  foundation: {
    weight: 0.2,
    color: '#10b981',
    components: ['foundationStrength', 'knowledgeDepth']
  },
  support: {
    weight: 0.2,
    color: '#f59e0b',
    components: ['environmentSupport']
  }
};

function mapScores(detailed) {
  const dimensions = {};
  for (const [name, cfg] of Object.entries(DIMENSION_CONFIG)) {
    const values = cfg.components.map(c => detailed[c] ?? 0);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    dimensions[name] = {
      score: Math.round(avg),
      weight: cfg.weight,
      color: cfg.color
    };
  }
  return dimensions;
}

module.exports = { DIMENSION_CONFIG, mapScores };
