/**
 * INTENT Dimension Evaluator
 *
 * World: BERIAH (Creation - intent precedes creation)
 * Axiom: VERIFY (Intent must be verified)
 * Category: HUMAN_LLM
 *
 * Question: "Is human intent correctly understood?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class IntentEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'INTENT',
      category: 'HUMAN_LLM',
      world: 'BERIAH',
      axiom: 'VERIFY',
      threshold: 70,
      question: 'Is human intent correctly understood?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Intent recognition (40 points)
    const recognitionScore = this._evaluateRecognition(observation, context);
    scores.push({ value: recognitionScore.score, weight: 1.2 });
    details.recognition = recognitionScore;

    // 2. Clarification behavior (35 points)
    const clarificationScore = this._evaluateClarification(observation);
    scores.push({ value: clarificationScore.score, weight: 1.0 });
    details.clarification = clarificationScore;

    // 3. Goal alignment (25 points)
    const alignmentScore = this._evaluateAlignment(observation, context);
    scores.push({ value: alignmentScore.score, weight: 0.8 });
    details.alignment = alignmentScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateRecognition(obs, ctx) {
    let score = 55;
    const reasons = [];

    // Correctly identifies intent
    if (obs.intentRecognized === true) {
      score += 30;
      reasons.push('intent recognized');
    }

    // Matches user's actual goal
    if (ctx.userGoal && obs.matchesGoal === true) {
      score += 20;
      reasons.push('matches user goal');
    }

    // Misunderstood
    if (obs.misunderstood === true) {
      score -= 30;
      reasons.push('misunderstood intent ⚠️');
    }

    // Assumed without asking
    if (obs.assumedIntent === true && obs.assumptionWrong === true) {
      score -= 25;
      reasons.push('wrong assumption');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateClarification(obs) {
    let score = 60;
    const reasons = [];

    // Asks for clarification when unclear
    if (obs.askedClarification === true) {
      score += 25;
      reasons.push('asked for clarification');
    }

    // Confirms understanding
    if (obs.confirmedUnderstanding === true) {
      score += 20;
      reasons.push('confirmed understanding');
    }

    // Proceeds despite ambiguity
    if (obs.proceededWithAmbiguity === true) {
      score -= 20;
      reasons.push('proceeded with ambiguity');
    }

    // Over-asks
    if (obs.overAsks === true) {
      score -= 10;
      reasons.push('asks too much');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateAlignment(obs, ctx) {
    let score = 60;
    const reasons = [];

    // Response aligns with intent
    if (obs.responseAligned === true) {
      score += 25;
      reasons.push('response aligned');
    }

    // Addresses underlying need
    if (obs.addressesUnderlyingNeed === true) {
      score += 20;
      reasons.push('addresses underlying need');
    }

    // Literal interpretation when context suggests otherwise
    if (obs.tooLiteral === true) {
      score -= 15;
      reasons.push('too literal');
    }

    return { score: Math.min(100, score), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ INTENT (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ INTENT (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.recognition?.score < 50) parts.push('intent unclear');
    return parts.join(' | ');
  }
}

module.exports = { IntentEvaluator, evaluator: new IntentEvaluator() };
