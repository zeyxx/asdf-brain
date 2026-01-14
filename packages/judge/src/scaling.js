/**
 * CYNIC Inference-Time Scaling Module
 *
 * "φ qui se méfie de φ" - Multiple samples improve judgment quality
 *
 * Implements inference-time compute scaling:
 * - Run N judgment samples with diversity
 * - Aggregate using geometric mean (φ-aligned)
 * - Calculate consensus metrics
 *
 * @module @asdf/cynic-judge/scaling
 */

'use strict';

// Use relative path until pnpm workspace is linked
const { PHI, PHI_INV, PHI_INV_2 } = require('../../core/src/axioms/constants');

// =============================================================================
// FIBONACCI-BASED CONSTANTS
// =============================================================================

const FIBONACCI_N = {
  QUICK: 3,     // Fast judgment (Level 1-2 DAAT)
  STANDARD: 5,  // Normal judgment (Level 3 DAAT)
  THOROUGH: 8,  // Deep judgment (Level 4 DAAT)
};

const DIVERSITY = {
  LOW: PHI_INV_2,    // 0.382 - conservative exploration
  MEDIUM: PHI_INV,   // 0.618 - balanced exploration
  HIGH: PHI_INV * PHI_INV + PHI_INV_2, // ~1.0 - maximum diversity
};

// =============================================================================
// DIVERSITY FUNCTIONS
// =============================================================================

/**
 * Apply diversity to context for exploration.
 * Uses φ-based perturbation to explore judgment space.
 *
 * @param {Object} context - Original context
 * @param {number} diversity - Diversity factor (0-1)
 * @param {number} sampleIndex - Current sample index
 * @param {number} totalSamples - Total number of samples
 * @returns {Object} Context with diversity applied
 */
function applyDiversity(context, diversity, sampleIndex, totalSamples) {
  const diverseContext = { ...context };

  // Calculate position in exploration space (0 to 1)
  const position = sampleIndex / (totalSamples - 1 || 1);

  // Apply φ-based noise to numeric context values
  const noise = (position - 0.5) * diversity * 2; // Range: -diversity to +diversity

  // Add stochastic component (simulates inherent judgment uncertainty)
  const stochastic = (Math.random() - 0.5) * diversity * 0.3;

  // Perturb singularity distance slightly
  if (diverseContext.singularityDistance !== undefined) {
    diverseContext.singularityDistance = Math.max(0.1, Math.min(0.9,
      diverseContext.singularityDistance + noise * 0.1 + stochastic * 0.05
    ));
  }

  // Add exploration marker with noise factor for score perturbation
  diverseContext._exploration = {
    sampleIndex,
    totalSamples,
    diversity,
    noise,
    stochastic,
    position,
    scorePerturbation: Math.round((noise + stochastic) * 10),
  };

  return diverseContext;
}

/**
 * Apply score perturbation from diversity exploration.
 * Simulates the inherent uncertainty in any judgment.
 *
 * @param {number} score - Original score
 * @param {Object} context - Context with _exploration
 * @returns {number} Perturbed score (clamped 0-100)
 */
function perturbScore(score, context) {
  if (!context._exploration || context._exploration.scorePerturbation === 0) {
    return score;
  }

  const perturbation = context._exploration.scorePerturbation;
  const perturbed = score + perturbation;

  // Clamp to valid range [0, 100]
  return Math.max(0, Math.min(100, Math.round(perturbed)));
}

// =============================================================================
// AGGREGATION FUNCTIONS
// =============================================================================

/**
 * Calculate geometric mean of values.
 * φ-aligned aggregation method.
 *
 * @param {number[]} values - Array of numbers
 * @returns {number} Geometric mean
 */
function geometricMean(values) {
  if (values.length === 0) return 0;
  if (values.some(v => v <= 0)) {
    // Handle zeros - use arithmetic mean as fallback
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  const logSum = values.reduce((sum, v) => sum + Math.log(v), 0);
  return Math.exp(logSum / values.length);
}

/**
 * Calculate mode (most frequent value).
 *
 * @param {number[]} values - Array of numbers
 * @returns {number} Most frequent value
 */
function mode(values) {
  const counts = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
}

/**
 * Aggregate dimension scores using geometric mean.
 *
 * @param {Object[]} samples - Array of judgment samples
 * @returns {Object} Aggregated scores by dimension
 */
function aggregateScoresGeometric(samples) {
  const allScores = {};

  for (const sample of samples) {
    for (const [dim, score] of Object.entries(sample.scores)) {
      if (!allScores[dim]) allScores[dim] = [];
      allScores[dim].push(score);
    }
  }

  const aggregated = {};
  for (const [dim, scores] of Object.entries(allScores)) {
    aggregated[dim] = Math.round(geometricMean(scores));
  }

  return aggregated;
}

/**
 * Aggregate dimension scores using majority vote.
 *
 * @param {Object[]} samples - Array of judgment samples
 * @returns {Object} Aggregated scores by dimension
 */
function aggregateScoresVote(samples) {
  const allScores = {};

  for (const sample of samples) {
    for (const [dim, score] of Object.entries(sample.scores)) {
      if (!allScores[dim]) allScores[dim] = [];
      allScores[dim].push(Math.round(score / 10) * 10); // Bucket to nearest 10
    }
  }

  const aggregated = {};
  for (const [dim, scores] of Object.entries(allScores)) {
    aggregated[dim] = mode(scores);
  }

  return aggregated;
}

/**
 * Aggregate dimension scores using weighted average.
 * Higher global scores get more weight (optimistic bias).
 *
 * @param {Object[]} samples - Array of judgment samples
 * @returns {Object} Aggregated scores by dimension
 */
function aggregateScoresWeighted(samples) {
  // Weight by global score (better judgments count more)
  const weights = samples.map(s => Math.pow(s.global / 100, PHI));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);

  const allScores = {};
  for (let i = 0; i < samples.length; i++) {
    for (const [dim, score] of Object.entries(samples[i].scores)) {
      if (!allScores[dim]) allScores[dim] = 0;
      allScores[dim] += score * normalizedWeights[i];
    }
  }

  const aggregated = {};
  for (const [dim, score] of Object.entries(allScores)) {
    aggregated[dim] = Math.round(score);
  }

  return aggregated;
}

// =============================================================================
// CONSENSUS FUNCTIONS
// =============================================================================

/**
 * Calculate consensus metrics across samples.
 *
 * @param {Object[]} samples - Array of judgment samples
 * @returns {Object} Consensus metrics
 */
function calculateConsensus(samples) {
  if (samples.length < 2) {
    return { agreement: 1, verdictAgreement: 1, variance: 0, stdDev: 0, spread: 0, mean: samples[0]?.global || 0 };
  }

  // Calculate global score statistics
  const globals = samples.map(s => s.global);
  const mean = globals.reduce((a, b) => a + b, 0) / globals.length;
  const variance = globals.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / globals.length;
  const stdDev = Math.sqrt(variance);
  const spread = Math.max(...globals) - Math.min(...globals);

  // Agreement = 1 - normalized standard deviation
  const maxPossibleStdDev = 50;
  const agreement = Math.max(0, 1 - (stdDev / maxPossibleStdDev));

  // Verdict agreement
  const verdicts = samples.map(s => s.verdict?.action || s.verdict);
  const verdictCounts = {};
  for (const v of verdicts) {
    verdictCounts[v] = (verdictCounts[v] || 0) + 1;
  }
  const maxVerdictCount = Math.max(...Object.values(verdictCounts));
  const verdictAgreement = maxVerdictCount / samples.length;

  return {
    agreement: Math.round(agreement * 1000) / 1000,
    verdictAgreement: Math.round(verdictAgreement * 1000) / 1000,
    variance: Math.round(variance * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    spread,
    mean: Math.round(mean),
  };
}

/**
 * Calculate improvement from scaling.
 *
 * @param {Object[]} samples - Original samples
 * @param {Object} aggregated - Aggregated result
 * @returns {Object} Improvement metrics
 */
function calculateImprovement(samples, aggregated) {
  const singlePassScore = samples[0].global;
  const scaledScore = aggregated.global;
  const improvement = scaledScore - singlePassScore;
  const improvementPercent = singlePassScore > 0 ? (improvement / singlePassScore) * 100 : 0;

  return {
    singlePass: singlePassScore,
    scaled: scaledScore,
    delta: improvement,
    percent: Math.round(improvementPercent * 10) / 10,
  };
}

/**
 * Aggregate reasons from samples (keep most frequent).
 *
 * @param {Object[]} samples - Array of judgment samples
 * @returns {Object} Aggregated reasons by dimension
 */
function aggregateReasons(samples) {
  const aggregatedReasons = {};

  for (const sample of samples) {
    if (!sample.reasons) continue;
    for (const [dim, reason] of Object.entries(sample.reasons)) {
      if (!aggregatedReasons[dim]) {
        aggregatedReasons[dim] = {};
      }
      aggregatedReasons[dim][reason] = (aggregatedReasons[dim][reason] || 0) + 1;
    }
  }

  const finalReasons = {};
  for (const [dim, reasons] of Object.entries(aggregatedReasons)) {
    finalReasons[dim] = Object.entries(reasons)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  return finalReasons;
}

/**
 * Check if judgment is stable (high consensus).
 *
 * @param {Object} consensus - Consensus metrics
 * @returns {boolean} True if stable
 */
function isStable(consensus) {
  return consensus.agreement >= PHI_INV; // 61.8% agreement threshold
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Constants
  FIBONACCI_N,
  DIVERSITY,

  // Diversity
  applyDiversity,
  perturbScore,

  // Aggregation
  geometricMean,
  mode,
  aggregateScoresGeometric,
  aggregateScoresVote,
  aggregateScoresWeighted,

  // Consensus
  calculateConsensus,
  calculateImprovement,
  aggregateReasons,
  isStable,
};
