class PMAssessmentScoring {
  constructor() {
    this.weights = {
      productSkills: 0.25,
      leadership: 0.25,
      businessAcumen: 0.2,
      careerFoundation: 0.15,
      executivePresence: 0.15
    };
  }

  scoreAssessment(responses = {}) {
    const scores = {
      productSkills: this.scoreProductSkills(responses),
      leadership: this.scoreLeadership(responses),
      businessAcumen: this.scoreBusinessAcumen(responses),
      careerFoundation: this.scoreCareerFoundation(responses),
      executivePresence: this.scoreExecutivePresence(responses)
    };

    const overall = this.calculateOverall(scores);
    scores.overall = overall;

    const readinessLevel = this.determineReadinessLevel(overall);

    return { dimensionScores: scores, readinessLevel };
  }

  calculateOverall(scores) {
    let sum = 0;
    let weightSum = 0;
    for (const dim of Object.keys(this.weights)) {
      sum += (scores[dim] || 0) * this.weights[dim];
      weightSum += this.weights[dim];
    }
    return Math.round(sum / weightSum);
  }

  determineReadinessLevel(overall) {
    if (overall >= 80) {
      return { level: 'PM_LEADER', description: 'Ready for senior leadership roles' };
    } else if (overall >= 65) {
      return { level: 'READY_FOR_PM_ROLE', description: 'Prepared for PM responsibilities' };
    } else if (overall >= 50) {
      return { level: 'GROWING', description: 'Developing core product management skills' };
    }
    return { level: 'BEGINNER', description: 'Needs foundational PM training' };
  }

  likertToScore(value) {
    const map = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
    return map[value] || 50;
  }

  // === Question-level scoring functions ===
  scoreRequirementsComfort(val) { return this.likertToScore(parseInt(val)); }
  scoreDiscoveryExperience(text = '') { return Math.min(100, text.split(/\s+/).length * 2); }
  scorePMTools(list = []) { return Math.min(100, (list.length || 0) * 20); }
  scoreCrossTeamLead(val) { return this.likertToScore(parseInt(val)); }
  scoreInfluenceExample(text = '') { return Math.min(100, text.split(/\s+/).length * 2); }
  scoreConflictResolution(val) { return val ? this.likertToScore(parseInt(val)) : 60; }
  scoreMetricsUnderstanding(val) { return this.likertToScore(parseInt(val)); }
  scoreMetricsUse(text = '') { return text ? Math.min(100, text.split(/\s+/).length * 2) : 50; }
  scoreAcumenFocus(list = []) { return list ? Math.min(100, list.length * 25) : 50; }
  scoreExperienceYears(val) {
    const map = { lt1: 40, '1-3': 60, '3-5': 80, '5plus': 100 };
    return map[val] || 50;
  }
  scoreEducationLevel(val) {
    const map = { none: 40, bachelor: 70, master: 85, mba_phd: 100 };
    return val ? (map[val] || 60) : 60;
  }
  scoreCertifications(text = '') { return text ? Math.min(100, text.split(/\s+/).length * 4) : 50; }
  scoreExecPresenting(val) { return this.likertToScore(parseInt(val)); }
  scoreStrategicThinking(val) { return this.likertToScore(parseInt(val)); }
  scoreMindsetChallenge(text = '') { return text ? Math.max(20, 100 - text.split(/\s+/).length * 2) : 80; }

  // Example question scoring (Q2)
  scoreQ2(metricsDefinition, toolProficiency, dataStory) {
    const m = this.scoreMetricsUnderstanding(metricsDefinition);
    const t = this.scorePMTools(Array.isArray(toolProficiency) ? toolProficiency : [toolProficiency]);
    const d = this.scoreMetricsUse(dataStory);
    return Math.round((m + t + d) / 3);
  }

  // === Dimension scoring ===
  scoreProductSkills(r) {
    const req = this.scoreRequirementsComfort(r.requirements_comfort);
    const disc = this.scoreDiscoveryExperience(r.discovery_experience);
    const tools = this.scorePMTools(r.pm_tools || []);
    return Math.round((req + disc + tools) / 3);
  }

  scoreLeadership(r) {
    const lead = this.scoreCrossTeamLead(r.cross_team_lead);
    const influence = this.scoreInfluenceExample(r.influence_example);
    const conflict = this.scoreConflictResolution(r.conflict_resolution);
    return Math.round((lead + influence + conflict) / 3);
  }

  scoreBusinessAcumen(r) {
    const metrics = this.scoreMetricsUnderstanding(r.metrics_understanding);
    const metricsUse = this.scoreMetricsUse(r.metrics_use);
    const focus = this.scoreAcumenFocus(r.acumen_focus || []);
    return Math.round((metrics + metricsUse + focus) / 3);
  }

  scoreCareerFoundation(r) {
    const exp = this.scoreExperienceYears(r.experience_years);
    const edu = this.scoreEducationLevel(r.education_level);
    const cert = this.scoreCertifications(r.certifications);
    return Math.round((exp + edu + cert) / 3);
  }

  scoreExecutivePresence(r) {
    const present = this.scoreExecPresenting(r.exec_presenting);
    const strategic = this.scoreStrategicThinking(r.strategic_thinking);
    const challenge = this.scoreMindsetChallenge(r.mindset_challenge);
    return Math.round((present + strategic + challenge) / 3);
  }
}

module.exports = { PMAssessmentScoring };
