/**
 * ADAPTATION-VELOCITY Dimension Evaluator
 *
 * World: ASSIAH (Action - operational manifestation)
 * Axiom: BURN (Operational learning)
 * Category: META
 *
 * Question: "How quickly can this adapt to feedback?"
 *
 * This dimension measures the operational aspect of learning.
 * While LEARNING_RATE (PHI/essence) measures the capacity to learn,
 * ADAPTATION_VELOCITY (BURN/operation) measures the speed of actual adaptation.
 *
 * This distinction was added to balance dimensions across axioms (6/7/6/6).
 */

'use strict';

const { DimensionEvaluator, PHI, PHI_INV, PHI_INV_2 } = require('../base');

class AdaptationVelocityEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'ADAPTATION_VELOCITY',
      category: 'META',
      world: 'ASSIAH',
      axiom: 'BURN',
      threshold: 38.2, // φ⁻² - minimum acceptable velocity
      question: 'How quickly can this adapt to feedback?',
    });

    // Velocity levels (φ-scaled intervals)
    this.VELOCITY_LEVELS = {
      STATIC: 0,                    // No adaptation
      GLACIAL: PHI_INV_2 * 100,     // 38.2% - Very slow
      MODERATE: 50,                  // Average speed
      RESPONSIVE: PHI_INV * 100,    // 61.8% - Good velocity
      AGILE: 80,                    // High velocity
      INSTANT: 100,                 // Immediate (theoretical max)
    };
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Feedback responsiveness (35 points)
    const feedbackScore = this._evaluateFeedbackResponse(observation, context);
    scores.push({ value: feedbackScore.score, weight: 1.0 });
    details.feedback = feedbackScore;

    // 2. Correction speed (35 points)
    const correctionScore = this._evaluateCorrectionSpeed(observation, context);
    scores.push({ value: correctionScore.score, weight: 1.0 });
    details.correction = correctionScore;

    // 3. Integration latency (30 points)
    const integrationScore = this._evaluateIntegrationLatency(observation, context);
    scores.push({ value: integrationScore.score, weight: 0.9 });
    details.integration = integrationScore;

    const finalScore = this.weightedAverage(scores);
    const velocity = this._classifyVelocity(finalScore);
    const reasoning = this._buildReasoning(details, finalScore, velocity);

    return this.createResult(finalScore, reasoning, { ...details, velocity });
  }

  _evaluateFeedbackResponse(obs, ctx) {
    let score = 50;
    const reasons = [];

    // Check for feedback mechanisms
    if (obs.hasFeedbackLoop === true || obs.feedbackEnabled === true) {
      score += 20;
      reasons.push('has feedback loop');
    }

    if (obs.automaticFeedback === true) {
      score += 15;
      reasons.push('automatic feedback');
    }

    // Check for historical adaptation data
    if (ctx.previousFeedback && ctx.adaptationTime) {
      const hoursToAdapt = ctx.adaptationTime / (1000 * 60 * 60);
      if (hoursToAdapt < 1) {
        score += 25;
        reasons.push('adapts within 1 hour');
      } else if (hoursToAdapt < 24) {
        score += 15;
        reasons.push('adapts within 24 hours');
      } else if (hoursToAdapt < 168) {
        score += 5;
        reasons.push('adapts within 1 week');
      } else {
        score -= 10;
        reasons.push('slow adaptation (>1 week)');
      }
    }

    // Rigid systems
    if (obs.hardcoded === true || obs.static === true) {
      score -= 30;
      reasons.push('hardcoded/static');
    }

    if (obs.immutable === true && obs.byDesign !== true) {
      score -= 20;
      reasons.push('immutable (not by design)');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateCorrectionSpeed(obs, ctx) {
    let score = 50;
    const reasons = [];

    // Error correction mechanisms
    if (obs.selfCorrecting === true) {
      score += 25;
      reasons.push('self-correcting');
    }

    if (obs.errorLearning === true || obs.learnFromErrors === true) {
      score += 20;
      reasons.push('learns from errors');
    }

    if (obs.hotReload === true || obs.hotSwap === true) {
      score += 15;
      reasons.push('hot-reloadable');
    }

    // Manual intervention required
    if (obs.requiresManualFix === true) {
      score -= 20;
      reasons.push('requires manual fix');
    }

    // Batch updates only
    if (obs.batchOnly === true) {
      score -= 10;
      reasons.push('batch updates only');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateIntegrationLatency(obs, ctx) {
    let score = 60;
    const reasons = [];

    // Real-time integration
    if (obs.realTime === true) {
      score += 25;
      reasons.push('real-time integration');
    }

    if (obs.streaming === true) {
      score += 15;
      reasons.push('streaming updates');
    }

    // Continuous integration
    if (obs.continuousLearning === true) {
      score += 20;
      reasons.push('continuous learning');
    }

    // High latency indicators
    if (obs.scheduledOnly === true) {
      score -= 15;
      reasons.push('scheduled updates only');
    }

    if (obs.manualDeploy === true) {
      score -= 20;
      reasons.push('manual deployment required');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _classifyVelocity(score) {
    if (score >= 80) return { level: 'AGILE', description: 'Rapid adaptation capability' };
    if (score >= PHI_INV * 100) return { level: 'RESPONSIVE', description: 'Good adaptation speed' };
    if (score >= 50) return { level: 'MODERATE', description: 'Average adaptation speed' };
    if (score >= PHI_INV_2 * 100) return { level: 'GLACIAL', description: 'Slow but adapting' };
    return { level: 'STATIC', description: 'No meaningful adaptation', warning: true };
  }

  _buildReasoning(details, finalScore, velocity) {
    const parts = [];

    if (finalScore >= this.threshold) {
      parts.push(`✅ ADAPTATION_VELOCITY (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ ADAPTATION_VELOCITY (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    parts.push(`Level: ${velocity.level}`);
    parts.push(velocity.description);

    if (velocity.warning) {
      parts.push('⚠️ System may be too rigid');
    }

    return parts.join(' | ');
  }
}

module.exports = { AdaptationVelocityEvaluator, evaluator: new AdaptationVelocityEvaluator() };
