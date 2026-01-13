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

    // 4. Growth Mindset (25 points) - NEW: Learning, iteration, resilience
    const growthScore = this._evaluateGrowthMindset(observation);
    scores.push({ value: growthScore.score, weight: 0.8 });
    details.growthMindset = growthScore;

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

  /**
   * Evaluate growth mindset indicators
   * Core traits: Learning, Iteration, Resilience, Adaptability
   */
  _evaluateGrowthMindset(obs) {
    let score = 50;
    const reasons = [];
    const traitScores = {
      LEARNING: 50,
      ITERATION: 50,
      RESILIENCE: 50,
      ADAPTABILITY: 50,
    };

    const text = this._extractText(obs).toLowerCase();

    // === LEARNING: "Every failure is a lesson" ===
    if (obs.learns === true || obs.learning === true) {
      traitScores.LEARNING += 30;
      reasons.push('learning ✓');
    }
    if (text.includes('learn') || text.includes('study') || text.includes('understand')) {
      traitScores.LEARNING += 15;
    }
    if (obs.curious === true || text.includes('curious') || text.includes('explore')) {
      traitScores.LEARNING += 20;
      reasons.push('curious');
    }
    if (obs.feedback === true || obs.receiveFeedback === true) {
      traitScores.LEARNING += 15;
      reasons.push('seeks feedback');
    }
    if (obs.closedMinded === true || obs.knowItAll === true) {
      traitScores.LEARNING -= 25;
      reasons.push('closed-minded');
    }

    // === ITERATION: "Iterate fast, fail fast" ===
    if (obs.iterates === true || obs.iteration === true) {
      traitScores.ITERATION += 30;
      reasons.push('iteration ✓');
    }
    if (text.includes('iterate') || text.includes('refine') || text.includes('improve')) {
      traitScores.ITERATION += 15;
    }
    if (obs.experiment === true || text.includes('experiment') || text.includes('prototype')) {
      traitScores.ITERATION += 20;
      reasons.push('experiments');
    }
    if (obs.mvp === true || obs.minimumViable === true) {
      traitScores.ITERATION += 15;
      reasons.push('MVP mindset');
    }
    if (obs.perfectionist === true || obs.allOrNothing === true) {
      traitScores.ITERATION -= 20;
      reasons.push('perfectionist');
    }

    // === RESILIENCE: "Fall down seven times, stand up eight" ===
    if (obs.resilient === true || obs.resilience === true) {
      traitScores.RESILIENCE += 30;
      reasons.push('resilient ✓');
    }
    if (text.includes('recover') || text.includes('bounce back') || text.includes('persist')) {
      traitScores.RESILIENCE += 15;
    }
    if (obs.failedBefore === true && obs.tryingAgain === true) {
      traitScores.RESILIENCE += 25;
      reasons.push('tried again after failure');
    }
    if (obs.grit === true || obs.perseverance === true) {
      traitScores.RESILIENCE += 20;
      reasons.push('grit');
    }
    if (obs.givesUp === true || obs.quits === true) {
      traitScores.RESILIENCE -= 30;
      reasons.push('gives up');
    }

    // === ADAPTABILITY: "The bamboo that bends is stronger than the oak that resists" ===
    if (obs.adapts === true || obs.adaptable === true) {
      traitScores.ADAPTABILITY += 30;
      reasons.push('adaptable ✓');
    }
    if (text.includes('adapt') || text.includes('flexible') || text.includes('pivot')) {
      traitScores.ADAPTABILITY += 15;
    }
    if (obs.pivoted === true || obs.changedDirection === true) {
      traitScores.ADAPTABILITY += 20;
      reasons.push('pivoted when needed');
    }
    if (obs.agile === true || obs.responsive === true) {
      traitScores.ADAPTABILITY += 15;
      reasons.push('agile');
    }
    if (obs.rigid === true || obs.unchanging === true) {
      traitScores.ADAPTABILITY -= 25;
      reasons.push('rigid');
    }

    // Clamp all trait scores
    for (const key of Object.keys(traitScores)) {
      traitScores[key] = Math.max(0, Math.min(100, traitScores[key]));
    }

    // Calculate average
    const traits = Object.values(traitScores);
    score = traits.reduce((sum, t) => sum + t, 0) / traits.length;

    // Count growth vs fixed mindset indicators
    const growthCount = traits.filter(t => t >= 60).length;
    const fixedCount = traits.filter(t => t < 40).length;

    return {
      score: Math.max(0, Math.min(100, score)),
      reasons,
      traitScores,
      summary: {
        growth: growthCount,
        fixed: fixedCount,
        total: 4,
        mindset: growthCount >= 3 ? 'GROWTH' : fixedCount >= 2 ? 'FIXED' : 'MIXED',
      },
    };
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

    // Highlight growth mindset
    if (details.growthMindset?.summary) {
      const { mindset, growth, total } = details.growthMindset.summary;
      if (mindset === 'GROWTH') {
        parts.push(`growth mindset (${growth}/${total})`);
      } else if (mindset === 'FIXED') {
        parts.push('fixed mindset ⚠️');
      }
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
