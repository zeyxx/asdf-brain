/**
 * @asdf/cynic-core - Axioms Module
 *
 * Exports all φ constants and axiom definitions.
 * Single Source of Truth for CYNIC fundamentals.
 */

'use strict';

const constants = require('./constants');
const axioms = require('./axioms');

module.exports = {
  // All constants
  ...constants,

  // Axiom definitions
  AXIOMS: axioms.AXIOMS,
  WORLDS: axioms.WORLDS,
  ASIMOV_LAWS: axioms.ASIMOV_LAWS,

  // Utility functions from axioms
  getAxiomForDimension: axioms.getAxiomForDimension,
  getWorldForAxiom: axioms.getWorldForAxiom,
  getWeightForAxiom: axioms.getWeightForAxiom,
};
