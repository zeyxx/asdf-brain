/**
 * @asdf/cynic-core - Scoring Module
 *
 * Exports score calculation and formatting functions.
 * Pure functions, no side effects.
 */

'use strict';

const {
  score,
  calculateGlobalScore,
  detectTensions,
  determineVerdict,
  findBlockingDimensions,
  calculateTechnicalDepth,
  formatOutput,
  scoreToGrade,
  DIMENSIONS,
  TOTAL_WEIGHT,
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
} = require('./score');

module.exports = {
  // Main scoring function
  score,

  // Component functions (for testing/extension)
  calculateGlobalScore,
  detectTensions,
  determineVerdict,
  findBlockingDimensions,
  calculateTechnicalDepth,
  formatOutput,
  scoreToGrade,

  // Constants
  DIMENSIONS,
  TOTAL_WEIGHT,
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
};
