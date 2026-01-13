/**
 * SCALE Dimension Evaluator
 *
 * World: ASSIAH (Action)
 * Axiom: BURN ("Don't extract, burn")
 * Category: SECONDARY
 *
 * Question: "Can it scale without extraction?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class ScaleEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'SCALE',
      category: 'SECONDARY',
      world: 'ASSIAH',
      axiom: 'BURN',
      threshold: 50,
      question: 'Can it scale without extraction?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Scalability indicators (40 points)
    const scaleScore = this._evaluateScalability(observation);
    scores.push({ value: scaleScore.score, weight: 1.2 });
    details.scalability = scaleScore;

    // 2. Non-extractive scaling (40 points)
    const extractionScore = this._evaluateNonExtraction(observation);
    scores.push({ value: extractionScore.score, weight: 1.2 });
    details.extraction = extractionScore;

    // 3. Resource efficiency (20 points)
    const efficiencyScore = this._evaluateEfficiency(observation);
    scores.push({ value: efficiencyScore.score, weight: 0.6 });
    details.efficiency = efficiencyScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateScalability(obs) {
    let score = 50;
    const reasons = [];

    if (obs.scalable === true) {
      score += 30;
      reasons.push('marked scalable');
    }

    if (obs.distributed === true || obs.decentralized === true) {
      score += 20;
      reasons.push('distributed architecture');
    }

    if (obs.horizontal === true || obs.horizontalScaling === true) {
      score += 15;
      reasons.push('horizontal scaling');
    }

    if (obs.stateless === true) {
      score += 10;
      reasons.push('stateless');
    }

    // Bottleneck indicators
    if (obs.centralized === true || obs.singleNode === true) {
      // Check for transition indicators that reduce penalty
      const inTransition = this._isInScaleTransition(obs);
      if (inTransition.transitioning) {
        score -= 5; // Reduced penalty for systems in transition
        reasons.push(`centralized (transitioning: ${inTransition.reason})`);
      } else {
        score -= 20;
        reasons.push('centralized bottleneck');
      }
    }

    // Bonus for systems preparing for scale
    const transitionBonus = this._evaluateScalePreparation(obs);
    score += transitionBonus.bonus;
    if (transitionBonus.reasons.length > 0) {
      reasons.push(...transitionBonus.reasons);
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  /**
   * Check if system is actively transitioning to distributed architecture
   */
  _isInScaleTransition(obs) {
    if (obs.transitionPhase === true || obs.migrationInProgress === true) {
      return { transitioning: true, reason: 'active migration' };
    }
    if (obs.roadmapToScale && typeof obs.roadmapToScale === 'object') {
      return { transitioning: true, reason: 'roadmap defined' };
    }
    if (obs.preparingForDistributed === true || obs.preparedForScale === true) {
      return { transitioning: true, reason: 'infrastructure prepared' };
    }
    return { transitioning: false };
  }

  /**
   * Bonus points for systems actively preparing to scale
   */
  _evaluateScalePreparation(obs) {
    let bonus = 0;
    const reasons = [];

    // Roadmap to scale is defined
    if (obs.roadmapToScale) {
      bonus += 15;
      reasons.push('scale roadmap defined');
    }

    // Infrastructure prepared for distribution
    if (obs.preparingForDistributed === true || obs.preparedForScale === true) {
      bonus += 10;
      reasons.push('prepared for distribution');
    }

    // Architecture designed for future scale
    if (obs.scaleReady === true || obs.horizontalReady === true) {
      bonus += 10;
      reasons.push('scale-ready architecture');
    }

    // Message queue or event-driven (enables future scale)
    if (obs.eventDriven === true || obs.messageQueue === true) {
      bonus += 8;
      reasons.push('event-driven');
    }

    return { bonus, reasons };
  }

  _evaluateNonExtraction(obs) {
    let score = 60;
    const reasons = [];

    // BURN alignment - scaling without extraction
    if (obs.burn === true || obs.burnModel === true) {
      score += 30;
      reasons.push('burn-aligned scaling 🔥');
    }

    if (obs.noFees === true || obs.feeless === true) {
      score += 20;
      reasons.push('feeless');
    }

    if (obs.communityOwned === true) {
      score += 15;
      reasons.push('community owned');
    }

    // Extraction indicators
    if (obs.fees > 0.05) {
      score -= 20;
      reasons.push('high fees');
    }

    if (obs.vcFunded === true) {
      score -= 25;
      reasons.push('VC extraction risk');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateEfficiency(obs) {
    let score = 60;
    const reasons = [];

    if (obs.efficient === true || obs.optimized === true) {
      score += 20;
      reasons.push('optimized');
    }

    if (obs.complexity && obs.complexity === 'O(1)') {
      score += 25;
      reasons.push('constant time');
    } else if (obs.complexity && obs.complexity.includes('log')) {
      score += 15;
      reasons.push('logarithmic');
    }

    if (obs.caching === true) {
      score += 10;
      reasons.push('cached');
    }

    return { score: Math.min(100, score), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ SCALE (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ SCALE (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.extraction?.score >= 80) parts.push('non-extractive');
    return parts.join(' | ');
  }
}

module.exports = { ScaleEvaluator, evaluator: new ScaleEvaluator() };
