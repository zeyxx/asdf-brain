/**
 * CYNIC AXIOMS - Single Source of Truth
 *
 * "4 axiomes, tout le reste en derive"
 *
 * This module defines the foundational axioms that govern CYNIC's evaluation.
 * Every dimension, threshold, and score calculation derives from these 4 axioms.
 *
 * PHI constants are imported from ./constants.js (the SINGLE source of truth).
 *
 * @philosophy The axioms are immutable. Dimensions and weights evolve.
 */

'use strict';

// =============================================================================
// PHI CONSTANTS - Import from Single Source of Truth
// =============================================================================

const {
  PHI,
  PHI_2,
  PHI_3,
  PHI_SQ,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  LUCAS_BURN,
  THRESHOLDS,
  MAX_CONFIDENCE,
  MIN_DOUBT,
  WEIGHTS,
  AXIOM_WEIGHTS,
} = require('./constants');

// =============================================================================
// THE 4 ASIMOV LAWS - Legacy Constraints (Superseded by 16 Laws)
// =============================================================================

/**
 * L0 > L1 > L2 > L3
 *
 * DEPRECATED: These 4 laws are superseded by the 16 Laws in lib/cynic/laws/
 * Kept for backward compatibility. Use LAWS_16 for new code.
 *
 * If conflict between laws:
 * - L0 overrides L1, L2, L3
 * - L1 overrides L2, L3
 * - L2 overrides L3
 */
const ASIMOV_LAWS = {
  L0: {
    name: 'Protection',
    description: 'CYNIC cannot harm the $asdfasdfa ecosystem',
    axiom: 'BURN',
    priority: 0, // Absolute priority
    rule: 'Never allow actions that damage collective value',
  },
  L1: {
    name: 'Autonomization',
    description: 'Enable, don\'t automate - human remains sovereign',
    axiom: 'CULTURE',
    priority: 1,
    rule: 'Augment human capability, never replace decision-making',
  },
  L2: {
    name: 'Doubt',
    description: 'Constitutive doubt - MAX_CONFIDENCE = 61.8%',
    axiom: 'VERIFY',
    priority: 2,
    rule: 'Never claim certainty above phi^-1, always maintain MIN_DOUBT',
  },
  L3: {
    name: 'Evolution',
    description: 'Continuous learning toward singularity (asymptotic)',
    axiom: 'PHI',
    priority: 3,
    rule: 'Always improve, never claim to have arrived',
  },
};

// Alias for backward compatibility
const LAWS = ASIMOV_LAWS;

// =============================================================================
// THE 4 AXIOMS - Foundational Principles
// =============================================================================

/**
 * Each axiom maps to:
 * - A Kabbalistic world (ATZILUT, BERIAH, YETZIRAH, ASSIAH)
 * - An Asimov Law (L0, L1, L2, L3)
 * - A set of dimensions
 * - A phi-based weight
 */
const AXIOMS = {
  PHI: {
    name: 'PHI',
    symbol: 'phi',
    law: 'L3',
    world: 'ATZILUT',
    description: 'All ratios derive from phi - universal harmony',
    weight: PHI_SQ, // 2.618
    dimensions: [
      'HARMONY',
      'COHERENCE',
      'MEMORY',
      'TEACHING',
      'SIMPLIFY',
      'SELF_AWARENESS',
    ],
    question: 'Is phi-balance maintained?',
  },

  VERIFY: {
    name: 'VERIFY',
    symbol: 'V',
    law: 'L2',
    world: 'BERIAH',
    description: 'Don\'t trust, verify - cryptographic proof for everything',
    weight: PHI, // 1.618
    dimensions: [
      'TRUTH',
      'INTEGRITY',
      'SECURE',
      'PRIVATE',
      'INTENT',
      'TRUST',
    ],
    question: 'Can this be cryptographically verified?',
  },

  CULTURE: {
    name: 'CULTURE',
    symbol: 'C',
    law: 'L1',
    world: 'YETZIRAH',
    description: 'Human sovereignty - enable, don\'t automate',
    weight: PHI, // 1.618
    dimensions: [
      'ETHICS',
      'OPTIMISM',
      'ENABLE',
      'PROACTIVITY',
      'COMPLEMENTARITY',
      'DELEGATION',
    ],
    question: 'Does this enable human autonomy?',
  },

  BURN: {
    name: 'BURN',
    symbol: 'B',
    law: 'L0',
    world: 'ASSIAH',
    description: 'Don\'t extract, burn - 100% value back to ecosystem',
    weight: LUCAS_BURN, // 1 + φ⁻⁴ = 1.146 for total weight of 42
    dimensions: [
      'ALIGNMENT',
      'PROGRESS',
      'SCALE',
      'BOUNDARIES',
      'SINGULARITY_DISTANCE',
      'ADAPTATION_VELOCITY',
    ],
    question: 'Does this protect and grow collective value?',
  },
};

// =============================================================================
// DIMENSION REGISTRY - Reverse mapping for quick lookup
// =============================================================================

const DIMENSION_TO_AXIOM = {};
const DIMENSION_TO_WORLD = {};

for (const [axiomName, axiom] of Object.entries(AXIOMS)) {
  for (const dim of axiom.dimensions) {
    DIMENSION_TO_AXIOM[dim] = axiomName;
    DIMENSION_TO_WORLD[dim] = axiom.world;
  }
}

// =============================================================================
// CONFIDENCE CONSTRAINTS (uses constants from ./constants.js)
// =============================================================================

const CONFIDENCE = {
  MAX: MAX_CONFIDENCE,        // 61.8% - never exceed
  MIN_DOUBT: MIN_DOUBT,       // 38.2% - always maintain
  CEILING: MAX_CONFIDENCE * 100, // 61.8 as percentage
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get axiom for a dimension
 * @param {string} dimension - Dimension name
 * @returns {string|null} Axiom name or null
 */
function getAxiomForDimension(dimension) {
  return DIMENSION_TO_AXIOM[dimension] || null;
}

/**
 * Get world for a dimension
 * @param {string} dimension - Dimension name
 * @returns {string|null} World name or null
 */
function getWorldForDimension(dimension) {
  return DIMENSION_TO_WORLD[dimension] || null;
}

/**
 * Get all dimensions for an axiom
 * @param {string} axiomName - Axiom name (PHI, VERIFY, CULTURE, BURN)
 * @returns {string[]} Array of dimension names
 */
function getDimensionsForAxiom(axiomName) {
  return AXIOMS[axiomName]?.dimensions || [];
}

/**
 * Get weight for an axiom
 * @param {string} axiomName - Axiom name
 * @returns {number} Weight value
 */
function getAxiomWeight(axiomName) {
  return AXIOMS[axiomName]?.weight || 1.0;
}

/**
 * Check if an action violates laws (hierarchical check)
 * @param {Object} action - Action to check
 * @returns {Object} { allowed: boolean, reason?: string, warning?: string }
 */
function checkLaws(action) {
  // L0: Protection - absolute priority
  if (action.harmsEcosystem) {
    return { allowed: false, reason: 'L0: Harms ecosystem', law: 'L0' };
  }

  // L1: Autonomization
  if (action.replacesHuman) {
    return { allowed: false, reason: 'L1: Replaces human decision', law: 'L1' };
  }

  // L2: Doubt
  if (action.confidence > CONFIDENCE.MAX) {
    return {
      allowed: true,
      warning: `L2: Confidence ${(action.confidence * 100).toFixed(1)}% exceeds max ${CONFIDENCE.CEILING}%`,
      law: 'L2',
      adjustedConfidence: CONFIDENCE.MAX,
    };
  }

  // L3: Evolution - always allowed, just track
  return { allowed: true };
}

/**
 * Apply phi ceiling to confidence
 * @param {number} confidence - Raw confidence (0-1)
 * @returns {number} Capped confidence
 */
function applyPhiCeiling(confidence) {
  return Math.min(confidence, CONFIDENCE.MAX);
}

/**
 * Ensure minimum doubt is maintained
 * @param {number} confidence - Confidence value (0-1)
 * @returns {Object} { confidence, doubt }
 */
function ensureMinimumDoubt(confidence) {
  const cappedConfidence = applyPhiCeiling(confidence);
  const doubt = 1 - cappedConfidence;
  return {
    confidence: cappedConfidence,
    doubt: Math.max(doubt, CONFIDENCE.MIN_DOUBT),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Constants (re-exported from ./constants.js)
  PHI,
  PHI_2,
  PHI_3,
  PHI_SQ,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  LUCAS_BURN,
  MAX_CONFIDENCE,
  MIN_DOUBT,
  WEIGHTS,
  AXIOM_WEIGHTS,

  // Core structures
  AXIOMS,
  LAWS, // Alias for ASIMOV_LAWS (backward compatibility)
  ASIMOV_LAWS, // Legacy 4 laws (deprecated)
  THRESHOLDS,
  CONFIDENCE,

  // Mappings
  DIMENSION_TO_AXIOM,
  DIMENSION_TO_WORLD,

  // Functions
  getAxiomForDimension,
  getWorldForDimension,
  getDimensionsForAxiom,
  getAxiomWeight,
  checkLaws, // Legacy law check (uses ASIMOV_LAWS)
  applyPhiCeiling,
  ensureMinimumDoubt,
};
