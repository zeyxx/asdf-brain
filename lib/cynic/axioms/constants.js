/**
 * CYNIC PHI CONSTANTS - The Single Source of Truth
 *
 * "φ qui gouverne tout, 42 est la réponse"
 *
 * All φ-derived constants live here. Every other module imports from here.
 * This is the ONLY place where PHI is defined.
 *
 * Mathematical Foundation:
 *   φ = (1 + √5) / 2 = 1.618033988749895...
 *   φ² = φ + 1 = 2.618...
 *   φ⁻¹ = φ - 1 = 0.618...
 *   φ⁻² = 2 - φ = 0.382...
 *   φ⁻³ = φ⁻¹ × φ⁻² = 0.236...
 *
 * Lucas Numbers (Lₙ = φⁿ + φ⁻ⁿ):
 *   L₄ = φ⁴ + φ⁻⁴ = 7
 *   42 = 6 × L₄ = 6 × 7 (the answer to everything)
 *
 * @philosophy φ is not arbitrary. It emerges from recursion: φ = 1 + 1/φ
 */

'use strict';

// =============================================================================
// PHI - The Golden Ratio
// =============================================================================

const PHI = 1.618033988749895;

// =============================================================================
// PHI POWERS (positive)
// =============================================================================

const PHI_2 = PHI * PHI;                    // 2.618... (φ²)
const PHI_3 = PHI_2 * PHI;                  // 4.236... (φ³)
const PHI_4 = PHI_3 * PHI;                  // 6.854... (φ⁴)
const PHI_5 = PHI_4 * PHI;                  // 11.09... (φ⁵)

// Aliases for common usage
const PHI_SQ = PHI_2;                       // Alias: φ² (commonly used)

// =============================================================================
// PHI INVERSE POWERS (negative)
// =============================================================================

const PHI_INV = 1 / PHI;                    // 0.618... (φ⁻¹) = MAX_CONFIDENCE
const PHI_INV_2 = PHI_INV * PHI_INV;        // 0.382... (φ⁻²) = MIN_DOUBT
const PHI_INV_3 = PHI_INV_2 * PHI_INV;      // 0.236... (φ⁻³) = CRITICAL
const PHI_INV_4 = PHI_INV_3 * PHI_INV;      // 0.146... (φ⁻⁴)
const PHI_INV_5 = PHI_INV_4 * PHI_INV;      // 0.090... (φ⁻⁵)

// =============================================================================
// LUCAS NUMBERS - Lₙ = φⁿ + φ⁻ⁿ
// =============================================================================

const LUCAS_4 = PHI_4 + PHI_INV_4;          // 7.0 exactly (L₄)
const LUCAS_BURN = 1 + PHI_INV_4;           // 1.146... (BURN weight for total 42)

// =============================================================================
// THE ANSWER - 42
// =============================================================================

const DIMENSIONS_PER_AXIOM = 6;             // 6 dimensions per axiom
const TOTAL_WEIGHT_42 = DIMENSIONS_PER_AXIOM * LUCAS_4; // 6 × 7 = 42

// =============================================================================
// CYNIC CONSTRAINTS - φ-derived limits
// =============================================================================

const MAX_CONFIDENCE = PHI_INV;             // 61.8% - never exceed
const MIN_DOUBT = PHI_INV_2;                // 38.2% - always maintain
const ANOMALY_THRESHOLD = PHI_INV_2;        // 38.2% - residual detection

// =============================================================================
// PHI-BASED THRESHOLDS - No arbitrary numbers
// =============================================================================

const THRESHOLDS = {
  CRITICAL_LOW: Math.round(PHI_INV_3 * 100),    // 24 - Danger zone
  MINIMUM: Math.round(PHI_INV_2 * 100),         // 38 - Min doubt floor
  NEUTRAL: 50,                                   // 50 - Equilibrium
  GOOD: Math.round(PHI_INV * 100),              // 62 - Max confidence
  EXCELLENT: Math.round((1 - PHI_INV_3) * 100), // 76 - Very good
  EXCEPTIONAL: Math.round((PHI_INV + PHI_INV_3) * 100), // 85 - Exceptional
};

// Percentage versions for display
const PHI_THRESHOLDS = {
  healthy: Math.round(PHI_INV * 100),     // 62
  warning: Math.round(PHI_INV_2 * 100),   // 38
  critical: Math.round(PHI_INV_3 * 100),  // 24
};

// =============================================================================
// SCORING INCREMENTS - φ-derived score bonuses/penalties for evaluators
// =============================================================================
//
// Philosophy: "No magic numbers" - all increments derived from φ powers
// Usage: score += SCORING.MEDIUM instead of score += 20
//
// Scale (φ⁻ⁿ × 100):
//   φ⁻⁵ = 9   (MICRO)
//   φ⁻⁴ = 15  (SMALL)
//   φ⁻³ = 24  (MEDIUM)
//   φ⁻² = 38  (LARGE)
//   φ⁻¹ = 62  (MAJOR - rarely used, too big)

const SCORING = {
  // Increments (φ powers)
  MICRO: Math.round(PHI_INV_5 * 100),     // 9 - tiny adjustment
  SMALL: Math.round(PHI_INV_4 * 100),     // 15 - small bonus/penalty
  MEDIUM: Math.round(PHI_INV_3 * 100),    // 24 - standard increment
  LARGE: Math.round(PHI_INV_2 * 100),     // 38 - significant change
  MAJOR: Math.round(PHI_INV * 100),       // 62 - major (rarely used)

  // Baselines for starting scores
  BASELINE_LOW: Math.round(PHI_INV_2 * 100),   // 38 - pessimistic start
  BASELINE_NEUTRAL: 50,                         // 50 - neutral start
  BASELINE_HIGH: Math.round(PHI_INV * 100),    // 62 - optimistic start

  // Field count thresholds
  FIELDS_GOOD: 5,                               // Well-structured
  FIELDS_MINIMAL: 3,                            // Minimal structure
  FIELDS_SPARSE: 2,                             // Sparse structure
};

// =============================================================================
// TEMPORAL CONSTANTS - Time intervals derived from φ
// =============================================================================

const TEMPORAL = {
  PULSE_INTERVAL_MS: Math.floor(PHI * 60 * 1000),     // ~97s (φ minutes)
  PERSIST_INTERVAL_MS: Math.floor(PHI * 60 * 1000),   // ~97s
  DECAY_RATE_WEEKLY: PHI_INV_3,                        // 23.6% per week
  STRENGTHEN_RATE: PHI_INV,                            // 61.8% on reference
  HALF_LIFE_HOURS: 168,                                // 1 week
};

// =============================================================================
// FIBONACCI CONSTANTS - For inference scaling
// =============================================================================

const FIBONACCI = {
  QUICK: 3,       // Fast judgment (DAAT Level 1-2)
  STANDARD: 5,    // Normal judgment (DAAT Level 3)
  THOROUGH: 8,    // Deep judgment (DAAT Level 4)
  MAX_ITERATIONS: 13, // Maximum refinement cycles
};

// =============================================================================
// AXIOM/WORLD WEIGHTS - Single Source of Truth for dimension weights
// =============================================================================
//
// Architecture unifiée: DIMENSION → AXIOM → POIDS
// Total = 6 × (φ² + φ + φ + (1+φ⁻⁴)) = 6 × 7 = 42
//
// This replaces the old CATEGORY-based weights (PRIMARY, SECONDARY, META, HUMAN_LLM)
// Each dimension's weight is determined ONLY by its axiom.

const AXIOM_WEIGHTS = {
  PHI: PHI_SQ,        // 2.618 - ATZILUT (Essence) - closest to source
  VERIFY: PHI,        // 1.618 - BERIAH (Verification/Economics)
  CULTURE: PHI,       // 1.618 - YETZIRAH (Ethics/Formation)
  BURN: LUCAS_BURN,   // 1.146 - ASSIAH (Action) - 1 + φ⁻⁴ for total 42
};

// Sum per axiom group: φ² + φ + φ + (1+φ⁻⁴) = 2.618 + 1.618 + 1.618 + 1.146 = 7 = L₄
// Total: 6 dimensions × 4 axioms × avg_weight = 24 × 1.75 = 42

// =============================================================================
// LEGACY WEIGHT CONSTANTS - Deprecated, use AXIOM_WEIGHTS instead
// =============================================================================

const WEIGHTS = {
  PRIMARY: PHI_SQ,    // DEPRECATED - use AXIOM_WEIGHTS.PHI
  SECONDARY: PHI,     // DEPRECATED - use AXIOM_WEIGHTS.VERIFY or CULTURE
  META: 1.0,          // DEPRECATED - dimensions now assigned to axioms
  HUMAN_LLM: PHI,     // DEPRECATED - dimensions now assigned to axioms
  DISCOVERY: PHI_INV, // Starting weight for discovered dimensions
};

// =============================================================================
// LAYER WEIGHTS - L1-L5 role layers
// =============================================================================

const LAYER_WEIGHTS = {
  L1_CORE: PHI_SQ,    // 2.618 - Core contributors
  L2_ACTIVE: PHI,     // 1.618 - Active contributors
  L3_DEPEND: 1.0,     // 1.000 - Dependencies
  L4_INFRA: PHI_INV,  // 0.618 - Infrastructure
  L5_FOUND: PHI_INV_2,// 0.382 - Foundation
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core PHI
  PHI,

  // Positive powers
  PHI_2,
  PHI_3,
  PHI_4,
  PHI_5,
  PHI_SQ,  // Alias for PHI_2

  // Inverse powers
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  PHI_INV_4,
  PHI_INV_5,

  // Lucas numbers
  LUCAS_4,          // 7 = φ⁴ + φ⁻⁴
  LUCAS_BURN,       // 1.146 = 1 + φ⁻⁴

  // The Answer
  DIMENSIONS_PER_AXIOM, // 6
  TOTAL_WEIGHT_42,      // 42 = 6 × 7

  // CYNIC constraints
  MAX_CONFIDENCE,
  MIN_DOUBT,
  ANOMALY_THRESHOLD,

  // Thresholds
  THRESHOLDS,
  PHI_THRESHOLDS,

  // Scoring increments
  SCORING,

  // Temporal
  TEMPORAL,

  // Fibonacci
  FIBONACCI,

  // Weights (AXIOM_WEIGHTS is the source of truth)
  AXIOM_WEIGHTS,
  WEIGHTS,          // DEPRECATED - use AXIOM_WEIGHTS
  LAYER_WEIGHTS,
};
