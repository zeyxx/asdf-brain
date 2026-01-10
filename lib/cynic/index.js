/**
 * CYNIC Module
 *
 * "φ qui se méfie de φ"
 * "Rendre autonome, pas automatiser"
 *
 * @module cynic
 */

'use strict';

const { SelfJudge, DIMENSIONS, WORLDS, PHI, PHI_INV, PHI_INV_2, PHI_SQ, MAX_CONFIDENCE, MIN_DOUBT } = require('./self-judge');

// =============================================================================
// CYNIC CONSTANTS
// =============================================================================

const CYNIC = {
  // The ratio
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_SQ,

  // Limits
  MAX_CONFIDENCE, // 61.8%
  MIN_DOUBT, // 38.2%

  // Fibonacci structure
  FIBONACCI: {
    CYNIC: 1,
    SINGULARITY: 1,
    VERDICT: 2,
    META: 3,
    OPERATIONS: 5,
    JUDGMENTS: 8,
  },

  // The 4 Worlds
  WORLDS,

  // All dimensions
  DIMENSIONS,

  // Verdicts (never REJECT, only ACCEPT or TRANSFORM)
  VERDICT: {
    ACCEPT: 'ACCEPT',
    TRANSFORM: 'TRANSFORM',
  },
};

// =============================================================================
// QUICK JUDGMENT FUNCTION
// =============================================================================

/**
 * Quick judgment using default SelfJudge
 * @param {Object} item - Item to judge
 * @param {Object} context - Judgment context
 * @returns {Promise<Object>} Judgment result
 */
async function judge(item, context = {}) {
  const judge = new SelfJudge();
  return judge.judge(item, context);
}

/**
 * Get world for a dimension
 * @param {string} dimension - Dimension name
 * @returns {Object|null} World info
 */
function getWorldForDimension(dimension) {
  for (const [worldKey, world] of Object.entries(WORLDS)) {
    if (world.dimensions.includes(dimension)) {
      return { key: worldKey, ...world };
    }
  }
  return null;
}

/**
 * Get axiom for a dimension
 * @param {string} dimension - Dimension name
 * @returns {string|null} Axiom name
 */
function getAxiomForDimension(dimension) {
  const world = getWorldForDimension(dimension);
  return world ? world.axiom : null;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Classes
  SelfJudge,

  // Constants
  CYNIC,
  DIMENSIONS,
  WORLDS,

  // φ constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_SQ,
  MAX_CONFIDENCE,
  MIN_DOUBT,

  // Functions
  judge,
  getWorldForDimension,
  getAxiomForDimension,
};
