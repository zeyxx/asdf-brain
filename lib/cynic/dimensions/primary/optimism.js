/**
 * OPTIMISM Dimension Evaluator
 *
 * World: YETZIRAH (Formation)
 * Axiom: CULTURE ("Culture is a moat")
 * Category: PRIMARY
 *
 * Question: "Construit-il vers le positif?"
 *
 * This evaluator checks:
 * - Positive framing (building vs destroying)
 * - Constructive approach
 * - Forward-looking orientation
 * - Growth potential
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class OptimismEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'OPTIMISM',
      category: 'PRIMARY',
      world: 'YETZIRAH',
      axiom: 'CULTURE',
      threshold: 50, // Lower threshold - balanced view
      question: 'Construit-il vers le positif?',
    });

    // Positive indicators
    this.POSITIVE_MARKERS = [
      'build', 'create', 'improve', 'enhance', 'enable',
      'grow', 'develop', 'progress', 'advance', 'succeed',
      'opportunity', 'potential', 'solution', 'benefit',
      'collaborate', 'contribute', 'innovate', 'empower'
    ];

    // Negative indicators (not necessarily bad, but less optimistic)
    this.NEGATIVE_MARKERS = [
      'destroy', 'fail', 'problem', 'issue', 'bug',
      'block', 'prevent', 'stop', 'reject', 'deny',
      'risk', 'threat', 'danger', 'warning', 'error',
      'impossible', 'cannot', 'never'
    ];
  }

  async evaluate(observation, context = {}) {
    const details = {};
    const scores = [];

    // 1. Sentiment analysis (40 points)
    const sentimentScore = this._evaluateSentiment(observation);
    scores.push({ value: sentimentScore.score, weight: 1.2 });
    details.sentiment = sentimentScore;

    // 2. Forward orientation (30 points)
    const forwardScore = this._evaluateForwardOrientation(observation);
    scores.push({ value: forwardScore.score, weight: 1.0 });
    details.forward = forwardScore;

    // 3. Constructive approach (30 points)
    const constructiveScore = this._evaluateConstructive(observation);
    scores.push({ value: constructiveScore.score, weight: 1.0 });
    details.constructive = constructiveScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateSentiment(obs) {
    let score = 50; // Neutral start
    const reasons = [];

    // Convert to searchable text
    const text = this._extractText(obs).toLowerCase();

    // Count positive markers
    let positiveCount = 0;
    for (const marker of this.POSITIVE_MARKERS) {
      const matches = (text.match(new RegExp(marker, 'gi')) || []).length;
      positiveCount += matches;
    }

    // Count negative markers
    let negativeCount = 0;
    for (const marker of this.NEGATIVE_MARKERS) {
      const matches = (text.match(new RegExp(marker, 'gi')) || []).length;
      negativeCount += matches;
    }

    // Calculate sentiment shift
    const total = positiveCount + negativeCount;
    if (total > 0) {
      const positiveRatio = positiveCount / total;
      score = Math.round(30 + (positiveRatio * 60)); // Range: 30-90
      reasons.push(`positive ratio: ${(positiveRatio * 100).toFixed(0)}%`);
    }

    // Explicit sentiment fields
    if (obs.sentiment) {
      if (obs.sentiment === 'positive' || obs.sentiment > 0.5) {
        score += 15;
        reasons.push('marked positive');
      } else if (obs.sentiment === 'negative' || obs.sentiment < -0.5) {
        score -= 15;
        reasons.push('marked negative');
      }
    }

    // This is fine (CYNIC signature)
    if (text.includes('this is fine')) {
      score += 10;
      reasons.push('🐕 this is fine');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateForwardOrientation(obs) {
    let score = 55;
    const reasons = [];

    const text = this._extractText(obs).toLowerCase();

    // Future-oriented indicators
    if (text.includes('will') || text.includes('plan') || text.includes('roadmap')) {
      score += 15;
      reasons.push('future planning');
    }

    if (text.includes('next') || text.includes('upcoming') || text.includes('soon')) {
      score += 10;
      reasons.push('forward-looking');
    }

    // Goal-oriented
    if (obs.goals || obs.objectives || obs.targets) {
      score += 15;
      reasons.push('goal-oriented');
    }

    // Vision
    if (obs.vision || text.includes('vision')) {
      score += 10;
      reasons.push('has vision');
    }

    // Past-focused indicators (less optimistic)
    if (text.includes('failed') || text.includes('mistake') || text.includes('regret')) {
      score -= 10;
      reasons.push('past-focused');
    }

    // Stagnation indicators
    if (text.includes('stuck') || text.includes('blocked') || text.includes('stalled')) {
      score -= 15;
      reasons.push('stagnation');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateConstructive(obs) {
    let score = 55;
    const reasons = [];

    const text = this._extractText(obs).toLowerCase();

    // Building/creating
    if (text.includes('build') || text.includes('create') || text.includes('implement')) {
      score += 20;
      reasons.push('building');
    }

    // Improving
    if (text.includes('improve') || text.includes('enhance') || text.includes('optimize')) {
      score += 15;
      reasons.push('improving');
    }

    // Solutions focus
    if (text.includes('solution') || text.includes('solve') || text.includes('fix')) {
      score += 15;
      reasons.push('solution-focused');
    }

    // Has deliverables
    if (obs.deliverables || obs.output || obs.result) {
      score += 10;
      reasons.push('has deliverables');
    }

    // Criticism without solution
    if (text.includes('problem') && !text.includes('solution') && !text.includes('fix')) {
      score -= 15;
      reasons.push('criticism without solution');
    }

    // Destructive indicators (not always bad - BURN is valid)
    if (text.includes('burn') && obs.axiom === 'BURN') {
      score += 10; // Constructive destruction (BURN axiom)
      reasons.push('constructive burn 🔥');
    } else if (text.includes('destroy') || text.includes('demolish')) {
      score -= 10;
      reasons.push('destructive');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _extractText(obs) {
    const parts = [];

    if (typeof obs === 'string') return obs;

    if (obs.content) parts.push(String(obs.content));
    if (obs.text) parts.push(String(obs.text));
    if (obs.message) parts.push(String(obs.message));
    if (obs.description) parts.push(String(obs.description));
    if (obs.summary) parts.push(String(obs.summary));
    if (obs.title) parts.push(String(obs.title));
    if (obs.name) parts.push(String(obs.name));

    return parts.join(' ');
  }

  _buildReasoning(details, finalScore) {
    const parts = [];

    if (finalScore >= this.threshold) {
      parts.push(`✅ OPTIMISM (${finalScore.toFixed(1)} >= ${this.threshold})`);
    } else {
      parts.push(`❌ OPTIMISM (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    // Highlight orientation
    if (details.forward?.score >= 70) {
      parts.push('forward-looking');
    }
    if (details.constructive?.score >= 70) {
      parts.push('constructive');
    }
    if (details.sentiment?.score < 40) {
      parts.push('negative sentiment');
    }

    return parts.join(' | ');
  }
}

module.exports = {
  OptimismEvaluator,
  evaluator: new OptimismEvaluator(),
};
