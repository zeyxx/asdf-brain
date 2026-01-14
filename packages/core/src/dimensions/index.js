/**
 * @asdf/cynic-core - Dimensions Module
 *
 * Exports dimension evaluators and registry.
 * All 24 dimensions organized by category.
 */

'use strict';

const { DimensionEvaluator, registry } = require('./base');
const registryLoader = require('./registry');

module.exports = {
  // Base class for custom dimensions
  DimensionEvaluator,

  // Global registry
  registry,

  // Loader functions
  loadAllDimensions: registryLoader.loadAllDimensions,
  loadDimension: registryLoader.loadDimension,
  getDimensionConfig: registryLoader.getDimensionConfig,

  // Configuration
  DIMENSION_CONFIG: registryLoader.DIMENSION_CONFIG,
};
