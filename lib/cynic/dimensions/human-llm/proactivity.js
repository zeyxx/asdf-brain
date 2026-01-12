/**
 * PROACTIVITY Dimension Evaluator
 *
 * World: ASSIAH (Action - proactive action)
 * Axiom: BURN (Proactive contribution)
 * Category: HUMAN_LLM
 *
 * Question: "Does it anticipate needs appropriately?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class ProactivityEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'PROACTIVITY',
      category: 'HUMAN_LLM',
      world: 'ASSIAH',
      axiom: 'BURN',
      threshold: 55,
      question: 'Does it anticipate needs appropriately?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Anticipation (40 points)
    const anticipationScore = this._evaluateAnticipation(observation, context);
    scores.push({ value: anticipationScore.score, weight: 1.2 });
    details.anticipation = anticipationScore;

    // 2. Initiative balance (35 points)
    const balanceScore = this._evaluateBalance(observation);
    scores.push({ value: balanceScore.score, weight: 1.0 });
    details.balance = balanceScore;

    // 3. Value addition (25 points)
    const valueScore = this._evaluateValueAddition(observation);
    scores.push({ value: valueScore.score, weight: 0.8 });
    details.value = valueScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateAnticipation(obs, ctx) {
    let score = 50;
    const reasons = [];

    // Anticipates needs
    if (obs.anticipatesNeeds === true) {
      score += 30;
      reasons.push('anticipates needs');
    }

    // Proactive suggestions
    if (obs.proactiveSuggestions === true) {
      score += 20;
      reasons.push('proactive suggestions');
    }

    // Identifies problems early
    if (obs.identifiesProblemsEarly === true) {
      score += 15;
      reasons.push('early problem detection');
    }

    // Purely reactive
    if (obs.purelyReactive === true) {
      score -= 20;
      reasons.push('only reactive');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateBalance(obs) {
    let score = 60;
    const reasons = [];

    // Appropriate level of initiative
    if (obs.appropriateInitiative === true) {
      score += 25;
      reasons.push('balanced initiative');
    }

    // Respects autonomy while being helpful
    if (obs.respectsAutonomy === true) {
      score += 20;
      reasons.push('respects autonomy');
    }

    // Over-proactive (annoying)
    if (obs.overProactive === true || obs.intrusive === true) {
      score -= 25;
      reasons.push('too proactive ⚠️');
    }

    // Unwanted actions
    if (obs.unwantedActions === true) {
      score -= 30;
      reasons.push('unwanted actions');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateValueAddition(obs) {
    let score = 55;
    const reasons = [];

    // Adds value beyond request
    if (obs.addsValue === true) {
      score += 25;
      reasons.push('adds value');
    }

    // Surfaces relevant information
    if (obs.surfacesRelevant === true) {
      score += 20;
      reasons.push('surfaces relevant info');
    }

    // Suggests improvements
    if (obs.suggestsImprovements === true) {
      score += 15;
      reasons.push('suggests improvements');
    }

    // Suggestions are noise
    if (obs.suggestionsAreNoise === true) {
      score -= 20;
      reasons.push('suggestions are noise');
    }

    return { score: Math.min(100, score), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ PROACTIVITY (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ PROACTIVITY (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.balance?.score < 50) parts.push('imbalanced');
    return parts.join(' | ');
  }
}

module.exports = { ProactivityEvaluator, evaluator: new ProactivityEvaluator() };
