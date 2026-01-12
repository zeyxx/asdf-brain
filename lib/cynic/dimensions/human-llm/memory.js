/**
 * MEMORY Dimension Evaluator
 *
 * World: BERIAH (Creation - memory creates continuity)
 * Axiom: VERIFY (Memory must be verified)
 * Category: HUMAN_LLM
 *
 * Question: "Is context properly remembered?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class MemoryEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'MEMORY',
      category: 'HUMAN_LLM',
      world: 'BERIAH',
      axiom: 'VERIFY',
      threshold: 60,
      question: 'Is context properly remembered?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Context retention (40 points)
    const retentionScore = this._evaluateRetention(observation, context);
    scores.push({ value: retentionScore.score, weight: 1.2 });
    details.retention = retentionScore;

    // 2. Memory accuracy (35 points)
    const accuracyScore = this._evaluateAccuracy(observation, context);
    scores.push({ value: accuracyScore.score, weight: 1.0 });
    details.accuracy = accuracyScore;

    // 3. Memory relevance (25 points)
    const relevanceScore = this._evaluateRelevance(observation, context);
    scores.push({ value: relevanceScore.score, weight: 0.8 });
    details.relevance = relevanceScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateRetention(obs, ctx) {
    let score = 50;
    const reasons = [];

    // Has context from previous turns
    if (ctx.conversationLength > 0) {
      score += Math.min(25, ctx.conversationLength * 5);
      reasons.push(`${ctx.conversationLength} turns remembered`);
    }

    // Has persisted memories
    if (ctx.persistedMemories > 0) {
      score += 20;
      reasons.push('memories persisted');
    }

    // Session continuity
    if (ctx.sessionContinued === true) {
      score += 15;
      reasons.push('session continued');
    }

    // Memory loss detection
    if (obs.forgotContext === true || obs.askedAgain === true) {
      score -= 30;
      reasons.push('context forgotten ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateAccuracy(obs, ctx) {
    let score = 60;
    const reasons = [];

    // Verified memories
    if (ctx.verifiedMemories > 0) {
      score += 25;
      reasons.push('memories verified');
    }

    // Contradiction detection
    if (obs.contradicts === true) {
      score -= 30;
      reasons.push('contradicts previous context');
    }

    // Consistent with history
    if (obs.consistentWithHistory === true) {
      score += 20;
      reasons.push('consistent');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateRelevance(obs, ctx) {
    let score = 55;
    const reasons = [];

    // Retrieved relevant context
    if (obs.relevantContextUsed === true) {
      score += 25;
      reasons.push('relevant context used');
    }

    // Selective memory (not dumping everything)
    if (obs.selectiveMemory === true) {
      score += 15;
      reasons.push('selective recall');
    }

    // Overwhelmed by context
    if (obs.contextOverload === true) {
      score -= 20;
      reasons.push('context overload');
    }

    return { score: Math.min(100, score), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ MEMORY (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ MEMORY (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.retention?.score < 50) parts.push('poor retention');
    return parts.join(' | ');
  }
}

module.exports = { MemoryEvaluator, evaluator: new MemoryEvaluator() };
