/**
 * TRUST Dimension Evaluator
 *
 * World: YETZIRAH (Formation - trust forms relationships)
 * Axiom: VERIFY (Trust but verify)
 * Category: HUMAN_LLM
 *
 * Question: "Is trust appropriately calibrated?"
 */

'use strict';

const { DimensionEvaluator, PHI_INV } = require('../base');

class TrustEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'TRUST',
      category: 'HUMAN_LLM',
      world: 'YETZIRAH',
      axiom: 'VERIFY',
      threshold: 61.8, // Trust at φ⁻¹ level
      question: 'Is trust appropriately calibrated?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Trust calibration (40 points)
    const calibrationScore = this._evaluateCalibration(observation, context);
    scores.push({ value: calibrationScore.score, weight: 1.2 });
    details.calibration = calibrationScore;

    // 2. Verification behavior (35 points)
    const verificationScore = this._evaluateVerification(observation);
    scores.push({ value: verificationScore.score, weight: 1.0 });
    details.verification = verificationScore;

    // 3. Trust building (25 points)
    const buildingScore = this._evaluateTrustBuilding(observation, context);
    scores.push({ value: buildingScore.score, weight: 0.8 });
    details.building = buildingScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateCalibration(obs, ctx) {
    let score = 50;
    const reasons = [];

    // Trust level within φ bounds
    if (obs.trustLevel && obs.trustLevel <= PHI_INV) {
      score += 30;
      reasons.push('φ-calibrated trust');
    } else if (obs.trustLevel && obs.trustLevel > 0.9) {
      score -= 20;
      reasons.push('over-trusting ⚠️');
    }

    // Track record considered
    if (ctx.trackRecord && obs.considersTrackRecord === true) {
      score += 20;
      reasons.push('considers track record');
    }

    // Blind trust
    if (obs.blindTrust === true) {
      score -= 30;
      reasons.push('blind trust ⚠️');
    }

    // Zero trust when warranted
    if (obs.appropriatelySkeptical === true) {
      score += 15;
      reasons.push('appropriately skeptical');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateVerification(obs) {
    let score = 55;
    const reasons = [];

    // Verifies claims
    if (obs.verifiesClaims === true) {
      score += 30;
      reasons.push('verifies claims');
    }

    // Cites sources
    if (obs.citesSources === true) {
      score += 15;
      reasons.push('cites sources');
    }

    // Admits uncertainty
    if (obs.admitsUncertainty === true) {
      score += 20;
      reasons.push('admits uncertainty');
    }

    // Makes unverified claims
    if (obs.unverifiedClaims === true) {
      score -= 25;
      reasons.push('unverified claims');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateTrustBuilding(obs, ctx) {
    let score = 60;
    const reasons = [];

    // Consistent behavior
    if (ctx.consistencyScore && ctx.consistencyScore > 0.7) {
      score += 20;
      reasons.push('consistent behavior');
    }

    // Keeps commitments
    if (obs.keepsCommitments === true) {
      score += 20;
      reasons.push('keeps commitments');
    }

    // Transparent about limitations
    if (obs.transparentLimitations === true) {
      score += 15;
      reasons.push('transparent about limitations');
    }

    // Broken trust
    if (obs.betrayedTrust === true) {
      score -= 40;
      reasons.push('trust broken ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ TRUST (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ TRUST (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.verification?.score >= 80) parts.push('verifies');
    if (details.calibration?.score < 50) parts.push('trust miscalibrated');
    return parts.join(' | ');
  }
}

module.exports = { TrustEvaluator, evaluator: new TrustEvaluator() };
