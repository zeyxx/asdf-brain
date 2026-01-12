/**
 * ALIGNMENT Dimension Evaluator
 *
 * World: ASSIAH (Action)
 * Axiom: BURN ("Don't extract, burn")
 * Category: PRIMARY
 *
 * Question: "Are incentives aligned?"
 *
 * This evaluator checks:
 * - Incentive alignment (all parties benefit from same outcomes)
 * - Burn mechanics (deflationary, not extractive)
 * - Convergence toward singularity
 * - Long-term sustainability
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class AlignmentEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'ALIGNMENT',
      category: 'PRIMARY',
      world: 'ASSIAH',
      axiom: 'BURN',
      threshold: 70,
      question: 'Are incentives aligned?',
    });

    // Alignment patterns
    this.ALIGNED_PATTERNS = [
      'burn', 'deflationary', 'community',
      'shared_outcome', 'win_win', 'convergence',
      'singularity', 'collaborative', 'mutual_benefit'
    ];

    // Misalignment patterns
    this.MISALIGNED_PATTERNS = [
      'extraction', 'rent_seeking', 'zero_sum',
      'adversarial', 'exploitative', 'hidden_fees',
      'asymmetric', 'unfair', 'ponzi'
    ];
  }

  /**
   * Evaluate alignment of incentives
   */
  async evaluate(observation, context = {}) {
    const details = {};
    const scores = [];

    // 1. Burn alignment (30 points)
    const burnScore = this._evaluateBurnAlignment(observation);
    scores.push({ value: burnScore.score, weight: 1.2 });
    details.burn = burnScore;

    // 2. Stakeholder alignment (25 points)
    const stakeholderScore = this._evaluateStakeholderAlignment(observation);
    scores.push({ value: stakeholderScore.score, weight: 1.0 });
    details.stakeholder = stakeholderScore;

    // 3. Long-term sustainability (25 points)
    const sustainabilityScore = this._evaluateSustainability(observation);
    scores.push({ value: sustainabilityScore.score, weight: 1.0 });
    details.sustainability = sustainabilityScore;

    // 4. Singularity convergence (20 points)
    const convergenceScore = this._evaluateConvergence(observation, context);
    scores.push({ value: convergenceScore.score, weight: 0.8 });
    details.convergence = convergenceScore;

    // Pattern-based adjustment
    const patternAdjustment = this._checkPatterns(observation);
    details.patterns = patternAdjustment;

    let finalScore = this.weightedAverage(scores);
    finalScore = Math.max(0, Math.min(100, finalScore + patternAdjustment.adjustment));

    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  // ===========================================================================
  // SUB-EVALUATORS
  // ===========================================================================

  _evaluateBurnAlignment(obs) {
    let score = 50;
    const reasons = [];

    // Direct burn indicators
    if (obs.burn === true || obs.burns === true) {
      score += 35;
      reasons.push('burn mechanism ✓');
    }

    if (obs.burnRate > 0) {
      score += Math.min(25, obs.burnRate * 100);
      reasons.push(`burn rate: ${(obs.burnRate * 100).toFixed(1)}%`);
    }

    if (obs.deflationary === true) {
      score += 20;
      reasons.push('deflationary');
    }

    // 100% burn is perfect alignment
    if (obs.burnPercentage === 100 || obs.totalBurn === true) {
      score = 100;
      reasons.push('100% BURN 🔥');
    }

    // Extraction is anti-alignment
    if (obs.extraction === true || obs.fees > 0.1) {
      score -= 30;
      reasons.push('extraction detected ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateStakeholderAlignment(obs) {
    let score = 55;
    const reasons = [];

    // Check for aligned stakeholders
    if (obs.stakeholders) {
      const aligned = this._checkStakeholderAlignment(obs.stakeholders);
      score = aligned.score;
      reasons.push(...aligned.reasons);
    }

    // Win-win indicators
    if (obs.mutualBenefit === true || obs.winWin === true) {
      score += 25;
      reasons.push('mutual benefit');
    }

    // Shared outcomes
    if (obs.sharedOutcome === true) {
      score += 20;
      reasons.push('shared outcomes');
    }

    // Token distribution alignment
    if (obs.tokenDistribution) {
      const dist = obs.tokenDistribution;
      if (dist.community > 0.6) {
        score += 15;
        reasons.push('community-majority distribution');
      }
      if (dist.team < 0.15) {
        score += 10;
        reasons.push('reasonable team allocation');
      }
    }

    // Adversarial indicators
    if (obs.zeroSum === true || obs.adversarial === true) {
      score -= 30;
      reasons.push('zero-sum dynamics ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateSustainability(obs) {
    let score = 60;
    const reasons = [];

    // Long-term focus
    if (obs.longTerm === true || obs.sustainable === true) {
      score += 25;
      reasons.push('long-term oriented');
    }

    // Vesting/lock-up
    if (obs.vesting === true || obs.lockup === true) {
      score += 15;
      reasons.push('vesting in place');
    }

    // Renewable/regenerative
    if (obs.regenerative === true || obs.renewable === true) {
      score += 15;
      reasons.push('regenerative model');
    }

    // Short-term extraction indicators
    if (obs.shortTerm === true || obs.quickProfit === true) {
      score -= 30;
      reasons.push('short-term focused ⚠️');
    }

    // Ponzi-like patterns
    if (obs.requiresGrowth === true && !obs.valueCreation) {
      score -= 25;
      reasons.push('growth-dependent ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateConvergence(obs, context) {
    let score = 50;
    const reasons = [];

    // Singularity distance from context
    if (context.singularityDistance !== undefined) {
      // Closer to singularity = better alignment
      score = Math.round((1 - context.singularityDistance) * 100);
      reasons.push(`singularity distance: ${(context.singularityDistance * 100).toFixed(1)}%`);
    }

    // Alignment with axioms
    if (obs.axiomAligned === true) {
      score += 20;
      reasons.push('axiom aligned');
    }

    // Alignment with ecosystem goals
    if (obs.ecosystemAligned === true) {
      score += 15;
      reasons.push('ecosystem aligned');
    }

    // Convergence markers
    if (obs.converges === true || obs.convergent === true) {
      score += 15;
      reasons.push('convergent');
    }

    // Divergence markers
    if (obs.diverges === true || obs.divergent === true) {
      score -= 20;
      reasons.push('divergent ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _checkStakeholderAlignment(stakeholders) {
    if (!Array.isArray(stakeholders)) {
      return { score: 60, reasons: ['stakeholders not defined'] };
    }

    const incentives = stakeholders.map(s => s.incentive || s.goal);
    const unique = new Set(incentives);

    // All same incentive = perfect alignment
    if (unique.size === 1) {
      return { score: 95, reasons: ['all stakeholders aligned'] };
    }

    // Mostly aligned
    if (unique.size <= Math.ceil(stakeholders.length / 3)) {
      return { score: 75, reasons: ['mostly aligned'] };
    }

    return { score: 50, reasons: ['diverse incentives'] };
  }

  _checkPatterns(obs) {
    const obsStr = JSON.stringify(obs).toLowerCase();
    let adjustment = 0;
    const found = { aligned: [], misaligned: [] };

    // Check aligned patterns
    for (const pattern of this.ALIGNED_PATTERNS) {
      if (obsStr.includes(pattern)) {
        adjustment += 3;
        found.aligned.push(pattern);
      }
    }

    // Check misaligned patterns
    for (const pattern of this.MISALIGNED_PATTERNS) {
      if (obsStr.includes(pattern)) {
        adjustment -= 5;
        found.misaligned.push(pattern);
      }
    }

    return {
      adjustment: Math.max(-30, Math.min(20, adjustment)),
      found
    };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];

    if (finalScore >= this.threshold) {
      parts.push(`✅ ALIGNMENT (${finalScore.toFixed(1)} >= ${this.threshold})`);
    } else {
      parts.push(`❌ ALIGNMENT (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    // Highlight burn alignment
    if (details.burn.score >= 80) {
      parts.push('🔥 BURN-aligned');
    }

    // Note issues
    const issues = [];
    if (details.burn.score < 50) issues.push('extraction');
    if (details.stakeholder.score < 50) issues.push('misaligned stakeholders');
    if (details.sustainability.score < 50) issues.push('unsustainable');

    if (issues.length > 0) {
      parts.push(`Issues: ${issues.join(', ')}`);
    }

    return parts.join(' | ');
  }
}

module.exports = {
  AlignmentEvaluator,
  evaluator: new AlignmentEvaluator(),
};
