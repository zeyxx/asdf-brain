/**
 * Q-SCORE - Hierarchical Quality Score
 *
 * "Quality > Quantity, mathematically proven"
 *
 * Q = 100 × ∜(φ × V × C × B)
 *
 * Like K-Score but for knowledge:
 * - K-Score: K = 100 × ∛(D × O × L) - 3 pillars, balanced
 * - Q-Score: Q = 100 × ∜(φ × V × C × B) - 4 axioms, balanced
 *
 * Key insight: One weak pillar = low score (cannot game by excelling elsewhere)
 *
 * @philosophy Geometric mean forces balance across all axioms
 */

'use strict';

const {
  AXIOMS,
  PHI,
  PHI_INV,
  THRESHOLDS,
  CONFIDENCE,
  getAxiomForDimension,
  applyPhiCeiling,
} = require('./index');

// =============================================================================
// GEOMETRIC MEAN HELPERS
// =============================================================================

/**
 * Calculate geometric mean of an array of values
 * @param {number[]} values - Array of positive numbers
 * @returns {number} Geometric mean
 */
function geometricMean(values) {
  if (!values || values.length === 0) return 0;

  // Filter out zeros/negatives to avoid NaN
  const positives = values.filter((v) => v > 0);
  if (positives.length === 0) return 0;

  // Use log-sum-exp for numerical stability
  const logSum = positives.reduce((sum, v) => sum + Math.log(v), 0);
  return Math.exp(logSum / positives.length);
}

/**
 * Calculate nth root
 * @param {number} value - Value to take root of
 * @param {number} n - Root degree
 * @returns {number} nth root
 */
function nthRoot(value, n) {
  if (value <= 0) return 0;
  return Math.pow(value, 1 / n);
}

// =============================================================================
// AXIOM SCORE CALCULATION
// =============================================================================

/**
 * Calculate score for a single axiom from dimension scores
 *
 * Uses geometric mean: √^n(d1 × d2 × ... × dn)
 *
 * @param {string} axiomName - Axiom name (PHI, VERIFY, CULTURE, BURN)
 * @param {Object} dimensionScores - { HARMONY: 75, TRUTH: 80, ... }
 * @returns {Object} { score, dimensions, missing }
 */
function calculateAxiomScore(axiomName, dimensionScores) {
  const axiom = AXIOMS[axiomName];
  if (!axiom) {
    return { score: 0, error: `Unknown axiom: ${axiomName}` };
  }

  const scores = [];
  const present = [];
  const missing = [];

  for (const dim of axiom.dimensions) {
    const score = dimensionScores[dim];
    if (score !== undefined && score !== null) {
      // Normalize to 0-100 if needed
      const normalized = score > 1 ? score : score * 100;
      scores.push(normalized);
      present.push({ dimension: dim, score: normalized });
    } else {
      missing.push(dim);
      // Use neutral score (50) for missing dimensions
      scores.push(THRESHOLDS.NEUTRAL);
    }
  }

  const score = geometricMean(scores);

  return {
    axiom: axiomName,
    score: Math.round(score * 10) / 10, // 1 decimal
    dimensions: present,
    missing,
    count: scores.length,
    weight: axiom.weight,
  };
}

// =============================================================================
// Q-SCORE CALCULATION
// =============================================================================

/**
 * Calculate hierarchical Q-Score
 *
 * Q = 100 × ∜(φ_score × V_score × C_score × B_score)
 *
 * @param {Object} dimensionScores - { HARMONY: 75, TRUTH: 80, ... }
 * @param {Object} options - { weighted: boolean }
 * @returns {Object} Q-Score result
 */
function calculateQScore(dimensionScores, options = {}) {
  const { weighted = false } = options;

  // Calculate score for each axiom
  const axiomScores = {};
  for (const axiomName of Object.keys(AXIOMS)) {
    axiomScores[axiomName] = calculateAxiomScore(axiomName, dimensionScores);
  }

  // Extract raw scores
  const phi_score = axiomScores.PHI.score;
  const v_score = axiomScores.VERIFY.score;
  const c_score = axiomScores.CULTURE.score;
  const b_score = axiomScores.BURN.score;

  let Q;

  if (weighted) {
    // Weighted version: apply axiom weights
    const weightedProduct =
      Math.pow(phi_score, AXIOMS.PHI.weight) *
      Math.pow(v_score, AXIOMS.VERIFY.weight) *
      Math.pow(c_score, AXIOMS.CULTURE.weight) *
      Math.pow(b_score, AXIOMS.BURN.weight);

    const totalWeight =
      AXIOMS.PHI.weight +
      AXIOMS.VERIFY.weight +
      AXIOMS.CULTURE.weight +
      AXIOMS.BURN.weight;

    Q = nthRoot(weightedProduct, totalWeight);
  } else {
    // Simple 4th root (unweighted, like K-Score's cube root)
    Q = 100 * nthRoot((phi_score * v_score * c_score * b_score) / Math.pow(100, 4), 4);
  }

  // Round to 1 decimal
  Q = Math.round(Q * 10) / 10;

  // Determine verdict based on Q-Score
  const verdict = getVerdict(Q);

  return {
    Q,
    verdict,
    axiomScores,
    breakdown: {
      PHI: phi_score,
      VERIFY: v_score,
      CULTURE: c_score,
      BURN: b_score,
    },
    formula: weighted
      ? 'Q = ∜(φ^w × V^w × C^w × B^w)'
      : 'Q = 100 × ∜(φ × V × C × B / 100^4)',
    meta: {
      dimensionCount: Object.keys(dimensionScores).length,
      weighted,
      timestamp: new Date().toISOString(),
    },
  };
}

// =============================================================================
// VERDICT DETERMINATION
// =============================================================================

/**
 * Determine verdict from Q-Score
 *
 * Uses phi-based thresholds:
 * - REJECT: Q < 38.2 (phi^-2)
 * - TRANSFORM: 38.2 <= Q < 61.8
 * - ACCEPT: Q >= 61.8 (phi^-1)
 *
 * @param {number} Q - Q-Score value
 * @returns {Object} Verdict with confidence
 */
function getVerdict(Q) {
  // Calculate confidence based on distance from threshold
  const distanceFromThreshold = Math.abs(Q - THRESHOLDS.GOOD) / 100;
  let rawConfidence = 0.5 + distanceFromThreshold * 0.5;

  // Apply phi ceiling
  const confidence = applyPhiCeiling(rawConfidence);
  const doubt = 1 - confidence;

  if (Q < THRESHOLDS.MINIMUM) {
    return {
      verdict: 'REJECT',
      confidence: Math.round(confidence * 1000) / 1000,
      doubt: Math.round(doubt * 1000) / 1000,
      reason: `Q=${Q} < ${THRESHOLDS.MINIMUM} (phi^-2 threshold)`,
      action: 'Do not accept - quality too low',
    };
  }

  if (Q < THRESHOLDS.GOOD) {
    return {
      verdict: 'TRANSFORM',
      confidence: Math.round(confidence * 1000) / 1000,
      doubt: Math.round(doubt * 1000) / 1000,
      reason: `${THRESHOLDS.MINIMUM} <= Q=${Q} < ${THRESHOLDS.GOOD}`,
      action: 'Transform before accepting - improve weak axioms',
    };
  }

  return {
    verdict: 'ACCEPT',
    confidence: Math.round(confidence * 1000) / 1000,
    doubt: Math.round(doubt * 1000) / 1000,
    reason: `Q=${Q} >= ${THRESHOLDS.GOOD} (phi^-1 threshold)`,
    action: 'Accept with verification',
  };
}

// =============================================================================
// WEAKNESS ANALYSIS
// =============================================================================

/**
 * Identify weakest axiom(s) pulling Q-Score down
 *
 * @param {Object} qScoreResult - Result from calculateQScore
 * @returns {Object} Weakness analysis
 */
function analyzeWeaknesses(qScoreResult) {
  const { breakdown, Q } = qScoreResult;

  // Sort axioms by score (ascending = weakest first)
  const sorted = Object.entries(breakdown).sort(([, a], [, b]) => a - b);

  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  // Calculate how much the weakest axiom is pulling down the score
  const avgWithoutWeakest =
    (breakdown.PHI + breakdown.VERIFY + breakdown.CULTURE + breakdown.BURN - weakest[1]) / 3;

  const drag = avgWithoutWeakest - Q;

  return {
    weakestAxiom: weakest[0],
    weakestScore: weakest[1],
    strongestAxiom: strongest[0],
    strongestScore: strongest[1],
    imbalance: strongest[1] - weakest[1],
    drag: Math.round(drag * 10) / 10,
    recommendation:
      weakest[1] < THRESHOLDS.MINIMUM
        ? `Critical: ${weakest[0]} at ${weakest[1]} - focus improvement here`
        : weakest[1] < THRESHOLDS.GOOD
          ? `Improve ${weakest[0]} (${weakest[1]}) to reach phi^-1 threshold`
          : 'All axioms above threshold - maintain balance',
  };
}

// =============================================================================
// COMPARE WITH K-SCORE PHILOSOPHY
// =============================================================================

/**
 * Show how Q-Score relates to K-Score philosophy
 *
 * K-Score: K = 100 × ∛(D × O × L)
 * Q-Score: Q = 100 × ∜(φ × V × C × B)
 *
 * Same principle: geometric mean forces balance
 */
const COMPARISON = {
  'K-Score': {
    formula: 'K = 100 × ∛(D × O × L)',
    pillars: ['Diamond Hands (D)', 'Organic Growth (O)', 'Longevity (L)'],
    root: 3,
    purpose: 'Token quality measurement',
  },
  'Q-Score': {
    formula: 'Q = 100 × ∜(φ × V × C × B)',
    pillars: ['PHI (φ)', 'VERIFY (V)', 'CULTURE (C)', 'BURN (B)'],
    root: 4,
    purpose: 'Knowledge quality measurement',
  },
  principle: 'Geometric mean prevents gaming - cannot compensate weak pillar with strong ones',
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main functions
  calculateQScore,
  calculateAxiomScore,
  getVerdict,
  analyzeWeaknesses,

  // Helpers
  geometricMean,
  nthRoot,

  // Documentation
  COMPARISON,
};
