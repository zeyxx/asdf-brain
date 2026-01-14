/**
 * CYNIC Dimension Registry Loader
 *
 * Automatically loads all dimension evaluators and registers them.
 * Supports hot-swap for runtime dimension replacement.
 *
 * Usage:
 *   const { loadAllDimensions, registry } = require('./dimensions/registry');
 *   await loadAllDimensions();
 *   // Now registry has all 24 dimensions
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { registry, DimensionEvaluator } = require('./base');

// =============================================================================
// DIMENSION CONFIGURATION
// =============================================================================

const DIMENSION_CONFIG = {
  PRIMARY: {
    path: './primary',
    dimensions: [
      'harmony',    // ATZILUT/PHI
      'coherence',  // ATZILUT/PHI
      'truth',      // BERIAH/VERIFY
      'integrity',  // BERIAH/VERIFY
      'ethics',     // YETZIRAH/CULTURE
      'optimism',   // YETZIRAH/CULTURE
      'alignment',  // ASSIAH/BURN
      'progress',   // ASSIAH/BURN
    ]
  },
  SECONDARY: {
    path: './secondary',
    dimensions: [
      'secure',     // BERIAH/VERIFY
      'private',    // BERIAH/VERIFY
      'scale',      // ASSIAH/BURN
      'simplify',   // ATZILUT/PHI
      'enable',     // YETZIRAH/CULTURE
    ]
  },
  META: {
    path: './meta',
    dimensions: [
      'self-awareness',       // ATZILUT/PHI
      'singularity-distance', // ASSIAH/BURN
      'adaptation-velocity',  // ASSIAH/BURN (absorbs LEARNING_RATE)
    ]
  },
  HUMAN_LLM: {
    path: './human-llm',
    dimensions: [
      'memory',         // ATZILUT/PHI
      'teaching',       // ATZILUT/PHI
      'intent',         // BERIAH/VERIFY
      'trust',          // BERIAH/VERIFY
      'proactivity',    // YETZIRAH/CULTURE
      'complementarity',// YETZIRAH/CULTURE
      'delegation',     // YETZIRAH/CULTURE (enables human autonomy)
      'boundaries',     // ASSIAH/BURN
    ]
  }
};

// =============================================================================
// LOADER FUNCTIONS
// =============================================================================

/**
 * Load a single dimension evaluator
 * @param {string} category - PRIMARY, SECONDARY, META, HUMAN_LLM
 * @param {string} dimensionName - Dimension file name (e.g., 'truth')
 * @returns {DimensionEvaluator|null}
 */
function loadDimension(category, dimensionName) {
  const config = DIMENSION_CONFIG[category];
  if (!config) {
    console.warn(`[CYNIC Registry] Unknown category: ${category}`);
    return null;
  }

  try {
    const modulePath = path.join(__dirname, config.path, dimensionName);
    const module = require(modulePath);

    // Module should export an evaluator instance
    const evaluator = module.evaluator || module.default;

    if (evaluator && evaluator instanceof DimensionEvaluator) {
      registry.register(evaluator);
      return evaluator;
    } else {
      console.warn(`[CYNIC Registry] Invalid evaluator in ${dimensionName}`);
      return null;
    }
  } catch (error) {
    // Silently skip missing dimensions (they may not be implemented yet)
    if (error.code !== 'MODULE_NOT_FOUND') {
      console.warn(`[CYNIC Registry] Error loading ${dimensionName}:`, error.message);
    }
    return null;
  }
}

/**
 * Load all dimensions in a category
 * @param {string} category
 * @returns {DimensionEvaluator[]}
 */
function loadCategory(category) {
  const config = DIMENSION_CONFIG[category];
  if (!config) return [];

  const loaded = [];

  for (const dimName of config.dimensions) {
    const evaluator = loadDimension(category, dimName);
    if (evaluator) {
      loaded.push(evaluator);
    }
  }

  return loaded;
}

/**
 * Load all dimensions across all categories
 * @returns {Object} Summary of loaded dimensions
 */
function loadAllDimensions() {
  const summary = {
    total: 0,
    byCategory: {},
    loaded: [],
    missing: []
  };

  for (const category of Object.keys(DIMENSION_CONFIG)) {
    const config = DIMENSION_CONFIG[category];
    const loaded = loadCategory(category);

    summary.byCategory[category] = {
      expected: config.dimensions.length,
      loaded: loaded.length,
      dimensions: loaded.map(e => e.name)
    };

    summary.total += loaded.length;
    summary.loaded.push(...loaded.map(e => e.name));

    // Track missing
    const loadedNames = new Set(loaded.map(e => e.name.toLowerCase()));
    for (const dimName of config.dimensions) {
      if (!loadedNames.has(dimName.replace(/-/g, '_'))) {
        summary.missing.push(`${category}/${dimName}`);
      }
    }
  }

  return summary;
}

/**
 * Get registry stats
 */
function getRegistryStats() {
  const total = DIMENSION_CONFIG.PRIMARY.dimensions.length +
                DIMENSION_CONFIG.SECONDARY.dimensions.length +
                DIMENSION_CONFIG.META.dimensions.length +
                DIMENSION_CONFIG.HUMAN_LLM.dimensions.length;
  return {
    ...registry.getStats(),
    config: {
      PRIMARY: DIMENSION_CONFIG.PRIMARY.dimensions.length,
      SECONDARY: DIMENSION_CONFIG.SECONDARY.dimensions.length,
      META: DIMENSION_CONFIG.META.dimensions.length,
      HUMAN_LLM: DIMENSION_CONFIG.HUMAN_LLM.dimensions.length,
      total
    }
  };
}

/**
 * Hot-reload a dimension (for development/updates)
 * @param {string} category
 * @param {string} dimensionName
 */
function reloadDimension(category, dimensionName) {
  const config = DIMENSION_CONFIG[category];
  if (!config) return null;

  // Clear from require cache
  const modulePath = path.join(__dirname, config.path, dimensionName);
  try {
    const resolvedPath = require.resolve(modulePath);
    delete require.cache[resolvedPath];
  } catch (e) {
    // Module not in cache
  }

  // Reload
  return loadDimension(category, dimensionName);
}

// =============================================================================
// AUTO-LOAD ON IMPORT
// =============================================================================

// Automatically load all available dimensions when this module is imported
const loadSummary = loadAllDimensions();

// Calculate expected total dynamically
const expectedTotal = Object.values(DIMENSION_CONFIG)
  .reduce((sum, cfg) => sum + cfg.dimensions.length, 0);

// Log summary
console.log(`[CYNIC Registry] Loaded ${loadSummary.total}/${expectedTotal} dimensions`);
if (loadSummary.missing.length > 0 && loadSummary.missing.length < 20) {
  console.log(`[CYNIC Registry] Missing: ${loadSummary.missing.join(', ')}`);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Registry access
  registry,

  // Loading functions
  loadDimension,
  loadCategory,
  loadAllDimensions,
  reloadDimension,

  // Stats
  getRegistryStats,

  // Configuration
  DIMENSION_CONFIG,

  // Load summary
  loadSummary,

  // Re-export base class for custom evaluators
  DimensionEvaluator,
};
