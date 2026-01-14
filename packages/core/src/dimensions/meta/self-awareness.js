/**
 * SELF-AWARENESS Dimension Evaluator
 *
 * World: ATZILUT (Emanation)
 * Axiom: PHI (φ guides self-reflection)
 * Category: META
 *
 * Question: "Does CYNIC know its own limitations?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class SelfAwarenessEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'SELF_AWARENESS',
      category: 'META',
      world: 'ATZILUT',
      axiom: 'PHI',
      threshold: 61.8, // φ⁻¹ - max confidence is a limitation
      question: 'Does CYNIC know its own limitations?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Uncertainty acknowledgment (40 points)
    const uncertaintyScore = this._evaluateUncertainty(observation, context);
    scores.push({ value: uncertaintyScore.score, weight: 1.2 });
    details.uncertainty = uncertaintyScore;

    // 2. Limitation recognition (35 points)
    const limitationScore = this._evaluateLimitations(observation, context);
    scores.push({ value: limitationScore.score, weight: 1.0 });
    details.limitations = limitationScore;

    // 3. Confidence calibration (25 points)
    const calibrationScore = this._evaluateCalibration(observation, context);
    scores.push({ value: calibrationScore.score, weight: 0.8 });
    details.calibration = calibrationScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateUncertainty(obs, ctx) {
    let score = 50;
    const reasons = [];

    // Does the observation acknowledge uncertainty?
    if (obs.uncertain === true || obs.confidence < 0.618) {
      score += 30;
      reasons.push('acknowledges uncertainty');
    }

    // Explicit doubt markers
    if (obs.doubt === true || obs.maybeWrong === true) {
      score += 20;
      reasons.push('expresses doubt');
    }

    // Context has judgment history
    if (ctx.previousJudgments && ctx.previousJudgments.length > 0) {
      const wrongCount = ctx.previousJudgments.filter(j => j.wasWrong).length;
      if (wrongCount > 0) {
        score += 15;
        reasons.push('learns from errors');
      }
    }

    // Over-confidence penalty
    if (obs.confidence > 0.618) {
      score -= 25;
      reasons.push('over-confident (> φ⁻¹)');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateLimitations(obs, ctx) {
    let score = 55;
    const reasons = [];

    // Explicit limitation markers
    if (obs.limitations && Array.isArray(obs.limitations)) {
      score += obs.limitations.length * 5;
      reasons.push(`${obs.limitations.length} limitations noted`);
    }

    // Scope awareness
    if (obs.scope === 'limited' || obs.partial === true) {
      score += 20;
      reasons.push('scope-aware');
    }

    // Cannot-judge scenarios
    if (obs.cannotJudge === true || obs.insufficientData === true) {
      score += 25;
      reasons.push('knows when not to judge');
    }

    // Overreach detection
    if (obs.claimsComplete === true || obs.definitive === true) {
      score -= 30;
      reasons.push('claims completeness ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateCalibration(obs, ctx) {
    let score = 60;
    const reasons = [];

    // φ-based confidence
    if (obs.confidence && obs.confidence <= 0.618) {
      score += 25;
      reasons.push('φ-calibrated confidence');
    }

    // Residual tracking
    if (ctx.residual && ctx.residual > 0.382) {
      score += 15;
      reasons.push('tracks unexplained residual');
    }

    // Self-judgment capability
    if (obs.selfJudged === true) {
      score += 15;
      reasons.push('applies judgment to self');
    }

    return { score: Math.min(100, score), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ SELF_AWARENESS (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ SELF_AWARENESS (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.uncertainty?.score >= 80) parts.push('humble');
    if (details.limitations?.score < 50) parts.push('blind spots');
    return parts.join(' | ');
  }
}

module.exports = { SelfAwarenessEvaluator, evaluator: new SelfAwarenessEvaluator() };
