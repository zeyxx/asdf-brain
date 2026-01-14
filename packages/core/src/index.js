/**
 * @asdf/cynic-core
 *
 * CYNIC Core - Pure judgment engine with no side effects.
 * "φ qui se méfie de φ"
 *
 * This package contains:
 * - axioms: φ constants and axiom definitions
 * - dimensions: 24 dimension evaluators
 * - scoring: Score calculation and formatting
 * - judgment: Pure judgment functions
 *
 * Usage:
 *   const { score, parseItem, PHI } = require('@asdf/cynic-core');
 *
 * For full judgment with gate/learning:
 *   const { judge } = require('lib/cynic/judge');
 *
 * @module @asdf/cynic-core
 * @philosophy Modularity, no side effects, φ-derived constants
 */

'use strict';

// =============================================================================
// AXIOMS - Foundation
// =============================================================================

const axioms = require('./axioms');

// =============================================================================
// DIMENSIONS - Evaluators
// =============================================================================

const dimensions = require('./dimensions');

// =============================================================================
// SCORING - Score calculation
// =============================================================================

const scoring = require('./scoring');

// =============================================================================
// JUDGMENT - Pure judgment functions
// =============================================================================

const judgment = require('./judgment');

// =============================================================================
// PUBLIC API
// =============================================================================

module.exports = {
  // ─────────────────────────────────────────────────────────────────────────
  // Top-level functions (most common usage)
  // ─────────────────────────────────────────────────────────────────────────

  // Scoring
  score: scoring.score,
  calculateGlobalScore: scoring.calculateGlobalScore,
  detectTensions: scoring.detectTensions,
  determineVerdict: scoring.determineVerdict,

  // Judgment
  parseItem: judgment.parseItem,
  evaluateDimension: judgment.evaluateDimension,
  generateDogResponse: judgment.generateDogResponse,
  JUDGMENT_MODES: judgment.JUDGMENT_MODES,

  // Dimensions
  DimensionEvaluator: dimensions.DimensionEvaluator,
  loadAllDimensions: dimensions.loadAllDimensions,

  // ─────────────────────────────────────────────────────────────────────────
  // Constants (φ-derived)
  // ─────────────────────────────────────────────────────────────────────────

  PHI: axioms.PHI,
  PHI_INV: axioms.PHI_INV,
  PHI_INV_2: axioms.PHI_INV_2,
  PHI_INV_3: axioms.PHI_INV_3,
  MAX_CONFIDENCE: axioms.MAX_CONFIDENCE,
  MIN_DOUBT: axioms.MIN_DOUBT,
  THRESHOLDS: axioms.THRESHOLDS,
  SCORING: axioms.SCORING,
  AXIOM_WEIGHTS: axioms.AXIOM_WEIGHTS,

  // ─────────────────────────────────────────────────────────────────────────
  // Dimension configuration
  // ─────────────────────────────────────────────────────────────────────────

  DIMENSIONS: scoring.DIMENSIONS,
  TOTAL_WEIGHT: scoring.TOTAL_WEIGHT,

  // ─────────────────────────────────────────────────────────────────────────
  // Submodules (for advanced usage)
  // ─────────────────────────────────────────────────────────────────────────

  axioms,
  dimensions,
  scoring,
  judgment,
};
