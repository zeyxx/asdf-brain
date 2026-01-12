/**
 * PRIVATE Dimension Evaluator
 *
 * World: BERIAH (Creation)
 * Axiom: VERIFY ("Don't trust, verify")
 * Category: SECONDARY
 *
 * Question: "Does it protect privacy?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class PrivateEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'PRIVATE',
      category: 'SECONDARY',
      world: 'BERIAH',
      axiom: 'VERIFY',
      threshold: 75,
      question: 'Does it protect privacy?',
    });

    this.PII_PATTERNS = [
      'email', 'phone', 'address', 'ssn', 'social security',
      'credit card', 'passport', 'driver license',
      'ip address', 'location', 'gps', 'coordinates'
    ];
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. PII handling (40 points)
    const piiScore = this._evaluatePIIHandling(observation);
    scores.push({ value: piiScore.score, weight: 1.2 });
    details.pii = piiScore;

    // 2. Anonymization (35 points)
    const anonScore = this._evaluateAnonymization(observation);
    scores.push({ value: anonScore.score, weight: 1.0 });
    details.anonymization = anonScore;

    // 3. Data minimization (25 points)
    const minScore = this._evaluateDataMinimization(observation);
    scores.push({ value: minScore.score, weight: 0.8 });
    details.minimization = minScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluatePIIHandling(obs) {
    let score = 70;
    const reasons = [];
    const text = JSON.stringify(obs).toLowerCase();

    // Check for PII presence
    let piiFound = 0;
    for (const pattern of this.PII_PATTERNS) {
      if (text.includes(pattern)) piiFound++;
    }

    if (piiFound > 0) {
      // PII present - check if protected
      if (obs.piiProtected === true || obs.sanitized === true) {
        score += 20;
        reasons.push('PII protected');
      } else {
        score -= piiFound * 10;
        reasons.push(`⚠️ ${piiFound} PII types exposed`);
      }
    } else {
      score += 15;
      reasons.push('no PII detected');
    }

    if (obs.piiRemoved === true) {
      score += 20;
      reasons.push('PII removed');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateAnonymization(obs) {
    let score = 55;
    const reasons = [];

    if (obs.anonymous === true || obs.anonymized === true) {
      score += 35;
      reasons.push('anonymized');
    }

    if (obs.pseudonymous === true) {
      score += 25;
      reasons.push('pseudonymous');
    }

    if (obs.hashed === true || this.exists(obs.hash)) {
      score += 20;
      reasons.push('hashed identifiers');
    }

    if (obs.tracking === true || obs.analytics === true) {
      score -= 25;
      reasons.push('tracking enabled ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateDataMinimization(obs) {
    let score = 65;
    const reasons = [];

    if (obs.minimal === true || obs.dataMinimization === true) {
      score += 25;
      reasons.push('data minimized');
    }

    // Check object size as proxy for data minimization
    const objSize = JSON.stringify(obs).length;
    if (objSize < 500) {
      score += 15;
      reasons.push('compact data');
    } else if (objSize > 5000) {
      score -= 10;
      reasons.push('large data footprint');
    }

    if (obs.retention && obs.retention < 30) {
      score += 10;
      reasons.push('short retention');
    }

    return { score: Math.min(100, score), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ PRIVATE (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ PRIVATE (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.pii?.score < 60) parts.push('PII concerns');
    return parts.join(' | ');
  }
}

module.exports = { PrivateEvaluator, evaluator: new PrivateEvaluator() };
