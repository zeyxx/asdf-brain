/**
 * LEARNING-RATE Dimension Evaluator
 *
 * World: BERIAH (Creation)
 * Axiom: VERIFY (Learning requires verification)
 * Category: META
 *
 * Question: "Is CYNIC improving over time?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class LearningRateEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'LEARNING_RATE',
      category: 'META',
      world: 'BERIAH',
      axiom: 'VERIFY',
      threshold: 50,
      question: 'Is CYNIC improving over time?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Feedback incorporation (40 points)
    const feedbackScore = this._evaluateFeedback(observation, context);
    scores.push({ value: feedbackScore.score, weight: 1.2 });
    details.feedback = feedbackScore;

    // 2. Accuracy trend (35 points)
    const trendScore = this._evaluateAccuracyTrend(observation, context);
    scores.push({ value: trendScore.score, weight: 1.0 });
    details.trend = trendScore;

    // 3. Adaptation speed (25 points)
    const adaptScore = this._evaluateAdaptation(observation, context);
    scores.push({ value: adaptScore.score, weight: 0.8 });
    details.adaptation = adaptScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateFeedback(obs, ctx) {
    let score = 50;
    const reasons = [];

    // Feedback loop presence
    if (ctx.feedbackCount > 0) {
      score += Math.min(30, ctx.feedbackCount * 3);
      reasons.push(`${ctx.feedbackCount} feedback items`);
    }

    // Incorporated feedback
    if (ctx.incorporatedFeedback > 0) {
      score += 20;
      reasons.push('feedback incorporated');
    }

    // Active learning
    if (obs.learning === true || obs.adapting === true) {
      score += 15;
      reasons.push('active learning');
    }

    // No feedback = can't learn
    if (!ctx.feedbackCount || ctx.feedbackCount === 0) {
      score -= 20;
      reasons.push('no feedback data');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateAccuracyTrend(obs, ctx) {
    let score = 55;
    const reasons = [];

    // Accuracy history
    if (ctx.accuracyHistory && ctx.accuracyHistory.length >= 2) {
      const recent = ctx.accuracyHistory.slice(-5);
      const oldest = recent[0];
      const newest = recent[recent.length - 1];

      if (newest > oldest) {
        score += 30;
        reasons.push('improving accuracy');
      } else if (newest < oldest) {
        score -= 20;
        reasons.push('declining accuracy ⚠️');
      } else {
        score += 10;
        reasons.push('stable accuracy');
      }
    }

    // Current accuracy
    if (ctx.currentAccuracy > 0.618) {
      score += 20;
      reasons.push('high accuracy');
    } else if (ctx.currentAccuracy < 0.382) {
      score -= 15;
      reasons.push('low accuracy');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateAdaptation(obs, ctx) {
    let score = 60;
    const reasons = [];

    // Threshold adjustments
    if (ctx.thresholdAdjustments > 0) {
      score += 20;
      reasons.push('thresholds adjusted');
    }

    // New patterns learned
    if (ctx.newPatternsLearned > 0) {
      score += Math.min(25, ctx.newPatternsLearned * 5);
      reasons.push(`${ctx.newPatternsLearned} new patterns`);
    }

    // Dimension discovery
    if (ctx.dimensionsDiscovered > 0) {
      score += 25;
      reasons.push('discovered new dimensions');
    }

    return { score: Math.min(100, score), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ LEARNING_RATE (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ LEARNING_RATE (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.trend?.score >= 80) parts.push('improving');
    if (details.feedback?.score < 40) parts.push('needs feedback');
    return parts.join(' | ');
  }
}

module.exports = { LearningRateEvaluator, evaluator: new LearningRateEvaluator() };
