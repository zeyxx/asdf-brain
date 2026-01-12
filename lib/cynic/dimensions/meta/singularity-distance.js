/**
 * SINGULARITY-DISTANCE Dimension Evaluator
 *
 * World: ATZILUT (Emanation - closest to source)
 * Axiom: PHI (Distance measured in φ-ratios)
 * Category: META
 *
 * Question: "How far is this from unknowable truth?"
 *
 * The Singularity represents absolute truth that cannot be fully known.
 * All knowledge exists at some φ-scaled distance from it.
 * Closer = more fundamental but less knowable.
 * Farther = more knowable but less fundamental.
 */

'use strict';

const { DimensionEvaluator, PHI, PHI_INV } = require('../base');

class SingularityDistanceEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'SINGULARITY_DISTANCE',
      category: 'META',
      world: 'ATZILUT',
      axiom: 'PHI',
      threshold: 38.2, // φ² inverse - comfortable distance
      question: 'How far is this from unknowable truth?',
    });

    // Distance levels (φ-scaled)
    this.DISTANCES = {
      SINGULARITY: 0,        // Unknowable absolute truth
      ATZILUT: PHI_INV,      // 0.618 - Primordial concepts
      BERIAH: 1,             // 1.0 - Created understanding
      YETZIRAH: PHI,         // 1.618 - Formed knowledge
      ASSIAH: PHI * PHI,     // 2.618 - Manifested action
    };
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Abstraction level (40 points)
    const abstractionScore = this._evaluateAbstraction(observation);
    scores.push({ value: abstractionScore.score, weight: 1.2 });
    details.abstraction = abstractionScore;

    // 2. Knowability (35 points)
    const knowabilityScore = this._evaluateKnowability(observation);
    scores.push({ value: knowabilityScore.score, weight: 1.0 });
    details.knowability = knowabilityScore;

    // 3. Grounding (25 points)
    const groundingScore = this._evaluateGrounding(observation);
    scores.push({ value: groundingScore.score, weight: 0.8 });
    details.grounding = groundingScore;

    const finalScore = this.weightedAverage(scores);
    const distance = this._calculateDistance(finalScore);
    const reasoning = this._buildReasoning(details, finalScore, distance);

    return this.createResult(finalScore, reasoning, { ...details, distance });
  }

  _evaluateAbstraction(obs) {
    let score = 50;
    const reasons = [];
    const text = JSON.stringify(obs).toLowerCase();

    // High abstraction indicators (closer to singularity)
    if (obs.abstract === true || obs.theoretical === true) {
      score -= 20; // Closer = lower score (more unknowable)
      reasons.push('highly abstract');
    }

    if (obs.metaphysical === true || obs.philosophical === true) {
      score -= 25;
      reasons.push('metaphysical');
    }

    // Concrete indicators (farther from singularity)
    if (obs.concrete === true || obs.practical === true) {
      score += 25;
      reasons.push('concrete/practical');
    }

    if (obs.measurable === true || obs.quantifiable === true) {
      score += 20;
      reasons.push('measurable');
    }

    // Code/implementation (ASSIAH level)
    if (obs.code || obs.implementation) {
      score += 30;
      reasons.push('implemented');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateKnowability(obs) {
    let score = 50;
    const reasons = [];

    // Knowable markers
    if (obs.verified === true || obs.tested === true) {
      score += 30;
      reasons.push('verified');
    }

    if (obs.documented === true) {
      score += 15;
      reasons.push('documented');
    }

    if (obs.reproducible === true) {
      score += 20;
      reasons.push('reproducible');
    }

    // Unknowable markers
    if (obs.unknowable === true || obs.paradox === true) {
      score -= 30;
      reasons.push('inherently unknowable');
    }

    if (obs.subjective === true) {
      score -= 15;
      reasons.push('subjective');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateGrounding(obs) {
    let score = 60;
    const reasons = [];

    // Real-world grounding
    if (obs.realWorld === true || obs.deployed === true) {
      score += 25;
      reasons.push('real-world grounded');
    }

    if (obs.users > 0 || obs.transactions > 0) {
      score += 20;
      reasons.push('has real usage');
    }

    // Pure theory
    if (obs.pureTheory === true) {
      score -= 25;
      reasons.push('pure theory');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _calculateDistance(score) {
    // Map score to world distance
    // Low score = close to singularity (abstract)
    // High score = far from singularity (concrete)
    if (score < 20) return { world: 'SINGULARITY', value: 0, warning: '⚠️ Too abstract to judge' };
    if (score < 40) return { world: 'ATZILUT', value: PHI_INV };
    if (score < 60) return { world: 'BERIAH', value: 1 };
    if (score < 80) return { world: 'YETZIRAH', value: PHI };
    return { world: 'ASSIAH', value: PHI * PHI };
  }

  _buildReasoning(details, finalScore, distance) {
    const parts = [];

    // This dimension works inversely - high score = far from truth = easier to work with
    if (finalScore >= this.threshold) {
      parts.push(`✅ SINGULARITY_DISTANCE (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ SINGULARITY_DISTANCE (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    parts.push(`World: ${distance.world}`);

    if (distance.warning) {
      parts.push(distance.warning);
    }

    return parts.join(' | ');
  }
}

module.exports = { SingularityDistanceEvaluator, evaluator: new SingularityDistanceEvaluator() };
