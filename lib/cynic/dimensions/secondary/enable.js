/**
 * ENABLE Dimension Evaluator
 *
 * World: YETZIRAH (Formation)
 * Axiom: CULTURE ("Culture is a moat")
 * Category: SECONDARY
 *
 * Question: "Does it enable humans?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class EnableEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'ENABLE',
      category: 'SECONDARY',
      world: 'YETZIRAH',
      axiom: 'CULTURE',
      threshold: 70,
      question: 'Does it enable humans?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Human empowerment (40 points)
    const empowerScore = this._evaluateEmpowerment(observation);
    scores.push({ value: empowerScore.score, weight: 1.2 });
    details.empowerment = empowerScore;

    // 2. Accessibility (35 points)
    const accessScore = this._evaluateAccessibility(observation);
    scores.push({ value: accessScore.score, weight: 1.0 });
    details.accessibility = accessScore;

    // 3. Autonomy preservation (25 points)
    const autonomyScore = this._evaluateAutonomy(observation);
    scores.push({ value: autonomyScore.score, weight: 0.8 });
    details.autonomy = autonomyScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateEmpowerment(obs) {
    let score = 55;
    const reasons = [];
    const text = JSON.stringify(obs).toLowerCase();

    // Empowerment markers
    if (obs.enables === true || obs.empowers === true) {
      score += 30;
      reasons.push('explicitly empowering');
    }

    if (text.includes('enable') || text.includes('empower') || text.includes('help')) {
      score += 15;
      reasons.push('empowerment language');
    }

    if (obs.userCentric === true || obs.humanFirst === true) {
      score += 20;
      reasons.push('human-first');
    }

    // Tool for humans, not replacement
    if (obs.tool === true || obs.assistant === true) {
      score += 15;
      reasons.push('tool/assistant');
    }

    // Replacement indicators (negative)
    if (obs.automates === true && !obs.assists) {
      score -= 15;
      reasons.push('automation over enablement');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateAccessibility(obs) {
    let score = 55;
    const reasons = [];

    if (obs.accessible === true) {
      score += 25;
      reasons.push('accessible');
    }

    if (obs.documentation === true || obs.docs === true) {
      score += 15;
      reasons.push('documented');
    }

    if (obs.easyToUse === true || obs.userFriendly === true) {
      score += 15;
      reasons.push('user-friendly');
    }

    if (obs.openSource === true) {
      score += 10;
      reasons.push('open source');
    }

    // Barriers
    if (obs.requiresExpertise === true) {
      score -= 15;
      reasons.push('requires expertise');
    }

    if (obs.paywall === true) {
      score -= 20;
      reasons.push('paywalled');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateAutonomy(obs) {
    let score = 60;
    const reasons = [];

    // Autonomy preservation
    if (obs.preservesAutonomy === true || obs.optIn === true) {
      score += 25;
      reasons.push('preserves autonomy');
    }

    if (obs.optional === true || obs.flexible === true) {
      score += 15;
      reasons.push('optional/flexible');
    }

    if (obs.transparent === true) {
      score += 10;
      reasons.push('transparent');
    }

    // Autonomy reduction
    if (obs.mandatory === true || obs.required === true) {
      score -= 15;
      reasons.push('mandatory');
    }

    if (obs.lockin === true || obs.vendorLock === true) {
      score -= 25;
      reasons.push('vendor lock-in');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ ENABLE (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ ENABLE (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.empowerment?.score >= 80) parts.push('empowering');
    if (details.autonomy?.score < 50) parts.push('autonomy concerns');
    return parts.join(' | ');
  }
}

module.exports = { EnableEvaluator, evaluator: new EnableEvaluator() };
