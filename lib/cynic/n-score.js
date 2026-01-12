/**
 * N-Score - "K-Score for Knowledge"
 *
 * Scores knowledge nodes in the brain using φ-derived thresholds.
 * Formula: N = 100 × ∛(U × C × T)
 *
 * @module lib/cynic/n-score
 */

'use strict';

// =============================================================================
// φ CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;           // 0.618... (KEEP threshold)
const PHI_INV_2 = PHI_INV * PHI_INV; // 0.382... (BURN threshold)

// Thresholds as percentages
const THRESHOLDS = {
  KEEP: PHI_INV * 100,      // 61.8%
  TRANSFORM: PHI_INV_2 * 100, // 38.2%
  BURN: PHI_INV_2 * 100,    // Below this = BURN
};

// Decay constants (in days)
const DECAY = {
  FRESHNESS_TAU: 7,    // τ for freshness decay (1 week half-life)
  TRUST_MATURITY: 21,  // Days for trust to mature (3 weeks)
};

// =============================================================================
// N-SCORE CALCULATION
// =============================================================================

/**
 * Calculate N-Score for a knowledge node
 *
 * @param {Object} node - Knowledge node
 * @param {number} node.accesses - Number of times accessed
 * @param {number} node.lastAccessed - Timestamp of last access
 * @param {number} node.edgesIn - Incoming connections
 * @param {number} node.edgesOut - Outgoing connections
 * @param {number} node.confirmations - Positive confirmations
 * @param {number} node.totalVotes - Total votes (up + down)
 * @param {number} node.createdAt - Creation timestamp
 * @param {Object} context - Context for normalization
 * @param {number} context.maxAccesses - Max accesses in graph
 * @param {number} context.maxEdges - Max edges in graph
 * @returns {Object} N-Score result
 */
function calculate(node, context = {}) {
  const now = Date.now();

  // Defaults
  const maxAccesses = context.maxAccesses || 100;
  const maxEdges = context.maxEdges || 50;

  // ==========================================================================
  // U - UTILIZATION
  // "Est-ce utilisé?"
  // ==========================================================================

  const accesses = node.accesses || 0;
  const lastAccessed = node.lastAccessed || node.createdAt || now;

  // Access ratio (0-1)
  const accessRatio = Math.min(1, accesses / maxAccesses);

  // Freshness decay: e^(-t/τ)
  const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);
  const freshness = Math.exp(-daysSinceAccess / DECAY.FRESHNESS_TAU);

  // U = access_ratio × freshness (0-1)
  const U = accessRatio * freshness;

  // ==========================================================================
  // C - CONNECTIONS
  // "Est-ce connecté?"
  // ==========================================================================

  const edgesIn = node.edgesIn || 0;
  const edgesOut = node.edgesOut || 0;

  // Connection ratio: (in + out) / (2 × max)
  const C = Math.min(1, (edgesIn + edgesOut) / (2 * maxEdges));

  // ==========================================================================
  // T - TRUTH
  // "Est-ce vrai?"
  // ==========================================================================

  const confirmations = node.confirmations || 0;
  const totalVotes = node.totalVotes || 1; // Avoid division by zero
  const createdAt = node.createdAt || now;

  // Trust ratio (0-1)
  const trustRatio = confirmations / totalVotes;

  // Age factor: 1 - e^(-t/21) (matures over 21 days)
  const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
  const ageFactor = 1 - Math.exp(-daysSinceCreation / DECAY.TRUST_MATURITY);

  // T = trust × age_factor (0-1)
  const T = trustRatio * ageFactor;

  // ==========================================================================
  // N-SCORE: 100 × ∛(U × C × T)
  // Geometric mean ensures all three pillars matter
  // ==========================================================================

  // Ensure minimum values to avoid zero (use φ⁻³ as floor)
  const U_safe = Math.max(U, 0.01);
  const C_safe = Math.max(C, 0.01);
  const T_safe = Math.max(T, 0.01);

  const product = U_safe * C_safe * T_safe;
  const N = 100 * Math.cbrt(product);

  // ==========================================================================
  // VERDICT
  // ==========================================================================

  let verdict;
  if (N >= THRESHOLDS.KEEP) {
    verdict = 'KEEP';
  } else if (N >= THRESHOLDS.TRANSFORM) {
    verdict = 'TRANSFORM';
  } else {
    verdict = 'BURN';
  }

  return {
    score: Math.round(N * 10) / 10, // 1 decimal
    verdict,
    components: {
      U: Math.round(U * 1000) / 10, // As percentage
      C: Math.round(C * 1000) / 10,
      T: Math.round(T * 1000) / 10,
    },
    details: {
      accesses,
      freshness: Math.round(freshness * 100),
      edgesIn,
      edgesOut,
      trustRatio: Math.round(trustRatio * 100),
      ageFactor: Math.round(ageFactor * 100),
      daysSinceAccess: Math.round(daysSinceAccess * 10) / 10,
      daysSinceCreation: Math.round(daysSinceCreation * 10) / 10,
    },
    thresholds: THRESHOLDS,
    phi: {
      keep: `> ${THRESHOLDS.KEEP.toFixed(1)}%`,
      transform: `${THRESHOLDS.TRANSFORM.toFixed(1)}% - ${THRESHOLDS.KEEP.toFixed(1)}%`,
      burn: `< ${THRESHOLDS.TRANSFORM.toFixed(1)}%`,
    },
  };
}

/**
 * Score multiple nodes and return sorted by N-Score
 *
 * @param {Array} nodes - Array of knowledge nodes
 * @param {Object} context - Optional context overrides
 * @returns {Array} Sorted nodes with N-Scores
 */
function scoreAll(nodes, context = {}) {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  // Calculate context from data if not provided
  const maxAccesses = context.maxAccesses ||
    Math.max(...nodes.map(n => n.accesses || 0), 1);
  const maxEdges = context.maxEdges ||
    Math.max(...nodes.map(n => (n.edgesIn || 0) + (n.edgesOut || 0)), 1);

  const ctx = { maxAccesses, maxEdges };

  // Score each node
  const scored = nodes.map(node => ({
    ...node,
    _nScore: calculate(node, ctx),
  }));

  // Sort by score descending
  scored.sort((a, b) => b._nScore.score - a._nScore.score);

  return scored;
}

/**
 * Get nodes to BURN (N < 38.2%)
 *
 * @param {Array} nodes - Array of knowledge nodes
 * @param {Object} context - Optional context
 * @returns {Array} Nodes that should be burned
 */
function getBurnCandidates(nodes, context = {}) {
  const scored = scoreAll(nodes, context);
  return scored.filter(n => n._nScore.verdict === 'BURN');
}

/**
 * Get nodes to TRANSFORM (38.2% < N < 61.8%)
 *
 * @param {Array} nodes - Array of knowledge nodes
 * @param {Object} context - Optional context
 * @returns {Array} Nodes that should be transformed/consolidated
 */
function getTransformCandidates(nodes, context = {}) {
  const scored = scoreAll(nodes, context);
  return scored.filter(n => n._nScore.verdict === 'TRANSFORM');
}

/**
 * Get graph health summary
 *
 * @param {Array} nodes - Array of knowledge nodes
 * @param {Object} context - Optional context
 * @returns {Object} Health summary
 */
function getGraphHealth(nodes, context = {}) {
  if (!nodes || nodes.length === 0) {
    return {
      total: 0,
      keep: 0,
      transform: 0,
      burn: 0,
      averageScore: 0,
      health: 0,
      verdict: 'EMPTY',
    };
  }

  const scored = scoreAll(nodes, context);

  const keep = scored.filter(n => n._nScore.verdict === 'KEEP').length;
  const transform = scored.filter(n => n._nScore.verdict === 'TRANSFORM').length;
  const burn = scored.filter(n => n._nScore.verdict === 'BURN').length;

  const averageScore = scored.reduce((sum, n) => sum + n._nScore.score, 0) / scored.length;

  // Health = weighted average: KEEP contributes fully, TRANSFORM half, BURN nothing
  const health = ((keep * 100) + (transform * 50)) / scored.length;

  let verdict;
  if (health >= THRESHOLDS.KEEP) {
    verdict = 'HEALTHY';
  } else if (health >= THRESHOLDS.TRANSFORM) {
    verdict = 'NEEDS_ATTENTION';
  } else {
    verdict = 'CRITICAL';
  }

  return {
    total: scored.length,
    keep,
    transform,
    burn,
    distribution: {
      keepPct: Math.round(keep / scored.length * 100),
      transformPct: Math.round(transform / scored.length * 100),
      burnPct: Math.round(burn / scored.length * 100),
    },
    averageScore: Math.round(averageScore * 10) / 10,
    health: Math.round(health * 10) / 10,
    verdict,
    phi: {
      formula: 'N = 100 × ∛(U × C × T)',
      meaning: 'K-Score for Knowledge',
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core
  calculate,
  scoreAll,

  // Analysis
  getBurnCandidates,
  getTransformCandidates,
  getGraphHealth,

  // Constants
  THRESHOLDS,
  DECAY,
  PHI,
  PHI_INV,
  PHI_INV_2,
};
