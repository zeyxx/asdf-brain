/**
 * @asdf/cynic-core - Judgment Module
 *
 * Exports pure judgment functions.
 * For full judgment with gate/learning, use lib/cynic/judge.js
 */

'use strict';

const {
  parseItem,
  evaluateDimension,
  generateDogResponse,
  JUDGMENT_MODES,
  PHI,
  PHI_INV,
  PHI_INV_2,
  MAX_CONFIDENCE,
  MIN_DOUBT,
} = require('./judge-core');

module.exports = {
  // Core judgment functions (pure)
  parseItem,
  evaluateDimension,
  generateDogResponse,

  // Configuration
  JUDGMENT_MODES,

  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  MAX_CONFIDENCE,
  MIN_DOUBT,
};
