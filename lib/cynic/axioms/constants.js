/**
 * CYNIC PHI CONSTANTS - The Single Source of Truth
 *
 * "φ qui gouverne tout"
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
// WEIGHT CONSTANTS - φ-based dimension weights
// =============================================================================

const WEIGHTS = {
  PRIMARY: PHI_SQ,    // 2.618 - Primary dimensions
  SECONDARY: PHI,     // 1.618 - Secondary dimensions
  META: 1.0,          // 1.000 - Meta dimensions
  HUMAN_LLM: PHI,     // 1.618 - Human-LLM dimensions
  DISCOVERY: 1.0,     // 1.000 - Discovered dimensions (start low)
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

  // CYNIC constraints
  MAX_CONFIDENCE,
  MIN_DOUBT,
  ANOMALY_THRESHOLD,

  // Thresholds
  THRESHOLDS,
  PHI_THRESHOLDS,

  // Temporal
  TEMPORAL,

  // Fibonacci
  FIBONACCI,

  // Weights
  WEIGHTS,
  LAYER_WEIGHTS,
};
