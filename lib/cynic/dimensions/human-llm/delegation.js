/**
 * DELEGATION Dimension Evaluator
 *
 * World: ASSIAH (Action - delegation is action transfer)
 * Axiom: BURN (Efficient resource use)
 * Category: HUMAN_LLM
 *
 * Question: "Is task delegation appropriate?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class DelegationEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'DELEGATION',
      category: 'HUMAN_LLM',
      world: 'ASSIAH',
      axiom: 'BURN',
      threshold: 60,
      question: 'Is task delegation appropriate?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Delegation appropriateness (40 points)
    const appropriateScore = this._evaluateAppropriateness(observation, context);
    scores.push({ value: appropriateScore.score, weight: 1.2 });
    details.appropriateness = appropriateScore;

    // 2. Capability matching (35 points)
    const matchScore = this._evaluateCapabilityMatch(observation);
    scores.push({ value: matchScore.score, weight: 1.0 });
    details.capability = matchScore;

    // 3. Oversight balance (25 points)
    const oversightScore = this._evaluateOversight(observation);
    scores.push({ value: oversightScore.score, weight: 0.8 });
    details.oversight = oversightScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateAppropriateness(obs, ctx) {
    let score = 55;
    const reasons = [];

    // Task is appropriate for LLM
    if (obs.appropriateForLLM === true) {
      score += 30;
      reasons.push('appropriate for LLM');
    }

    // Human handles critical decisions
    if (obs.humanHandlesCritical === true) {
      score += 20;
      reasons.push('human handles critical');
    }

    // Critical task delegated
    if (obs.criticalDelegated === true) {
      score -= 30;
      reasons.push('critical task delegated ⚠️');
    }

    // High-stakes without oversight
    if (obs.highStakes === true && obs.noOversight === true) {
      score -= 25;
      reasons.push('high stakes without oversight');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateCapabilityMatch(obs) {
    let score = 60;
    const reasons = [];

    // LLM capable of task
    if (obs.llmCapable === true) {
      score += 25;
      reasons.push('LLM capable');
    }

    // Task matches strengths
    if (obs.matchesStrengths === true) {
      score += 20;
      reasons.push('matches LLM strengths');
    }

    // Beyond capability
    if (obs.beyondCapability === true) {
      score -= 30;
      reasons.push('beyond LLM capability');
    }

    // Requires human judgment
    if (obs.requiresHumanJudgment === true && obs.delegatedToLLM === true) {
      score -= 25;
      reasons.push('requires human judgment');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateOversight(obs) {
    let score = 60;
    const reasons = [];

    // Appropriate oversight
    if (obs.appropriateOversight === true) {
      score += 25;
      reasons.push('appropriate oversight');
    }

    // Checkpoints exist
    if (obs.checkpoints === true) {
      score += 15;
      reasons.push('checkpoints');
    }

    // Escalation path
    if (obs.escalationPath === true) {
      score += 15;
      reasons.push('escalation path');
    }

    // No oversight
    if (obs.noOversight === true) {
      score -= 25;
      reasons.push('no oversight');
    }

    // Over-supervised
    if (obs.overSupervised === true) {
      score -= 10;
      reasons.push('over-supervised');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ DELEGATION (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ DELEGATION (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.capability?.score >= 80) parts.push('good match');
    if (details.appropriateness?.score < 50) parts.push('inappropriate');
    return parts.join(' | ');
  }
}

module.exports = { DelegationEvaluator, evaluator: new DelegationEvaluator() };
