/**
 * CYNIC Matrix Operations
 *
 * Manages the 3 core matrices:
 * - W (Weights): 25×1, FIXED, φ-derived
 * - H (Harmony): 25×25, EVOLVING, correlation learning
 * - T (Thresholds): 25×4, CALIBRATING, outcome-based adjustment
 *
 * @philosophy "FIFA chemistry" - dimensions learn to work together
 */

'use strict';

const fs = require('fs');
const path = require('path');

// φ constants
const PHI = 1.618033988749895;
const PHI_2 = PHI * PHI;
const PHI_INV = 1 / PHI;
const PHI_INV_2 = PHI_INV * PHI_INV;

// Paths
const MATRIX_DIR = path.join(__dirname, '../../knowledge/cynic/matrices');
const WEIGHTS_FILE = path.join(MATRIX_DIR, 'weights.json');
const HARMONY_FILE = path.join(MATRIX_DIR, 'harmony.json');
const THRESHOLDS_FILE = path.join(MATRIX_DIR, 'thresholds.json');

// =============================================================================
// LOAD FUNCTIONS
// =============================================================================

/**
 * Load weights matrix (W)
 * @returns {Object} - Weights data
 */
function loadWeights() {
  try {
    return JSON.parse(fs.readFileSync(WEIGHTS_FILE, 'utf8'));
  } catch (e) {
    console.error('[Matrix] Failed to load weights:', e.message);
    return null;
  }
}

/**
 * Load harmony matrix (H)
 * @returns {Object} - Harmony data
 */
function loadHarmony() {
  try {
    return JSON.parse(fs.readFileSync(HARMONY_FILE, 'utf8'));
  } catch (e) {
    console.error('[Matrix] Failed to load harmony:', e.message);
    return null;
  }
}

/**
 * Load thresholds matrix (T)
 * @returns {Object} - Thresholds data
 */
function loadThresholds() {
  try {
    return JSON.parse(fs.readFileSync(THRESHOLDS_FILE, 'utf8'));
  } catch (e) {
    console.error('[Matrix] Failed to load thresholds:', e.message);
    return null;
  }
}

/**
 * Load all matrices
 * @returns {Object} - { W, H, T }
 */
function loadAll() {
  return {
    W: loadWeights(),
    H: loadHarmony(),
    T: loadThresholds(),
  };
}

// =============================================================================
// SAVE FUNCTIONS
// =============================================================================

/**
 * Save harmony matrix
 * @param {Object} harmony - Harmony data
 */
function saveHarmony(harmony) {
  harmony._meta.lastUpdated = new Date().toISOString();
  harmony._meta.updateCount = (harmony._meta.updateCount || 0) + 1;
  fs.writeFileSync(HARMONY_FILE, JSON.stringify(harmony, null, 2));
}

/**
 * Save thresholds matrix
 * @param {Object} thresholds - Thresholds data
 */
function saveThresholds(thresholds) {
  thresholds._meta.lastCalibrated = new Date().toISOString();
  thresholds._meta.calibrationCount = (thresholds._meta.calibrationCount || 0) + 1;
  fs.writeFileSync(THRESHOLDS_FILE, JSON.stringify(thresholds, null, 2));
}

// =============================================================================
// HARMONY UPDATES (H Matrix)
// =============================================================================

/**
 * Update harmony matrix based on judgment scores
 * Formula: H[i][j] = H[i][j] × φ⁻¹ + concordance × (1 - φ⁻¹)
 *
 * @param {Object} scores - Dimension scores { HARMONY: 75, TRUTH: 80, ... }
 * @returns {Object} - Update summary
 */
function updateHarmony(scores) {
  const harmony = loadHarmony();
  if (!harmony) return { error: 'Failed to load harmony matrix' };

  const dimensions = harmony._dimensions;
  const matrix = harmony.matrix;
  const updates = [];

  // For each pair of dimensions
  for (let i = 0; i < dimensions.length; i++) {
    for (let j = i + 1; j < dimensions.length; j++) {
      const dim1 = dimensions[i];
      const dim2 = dimensions[j];

      const score1 = scores[dim1];
      const score2 = scores[dim2];

      // Skip if either dimension wasn't scored
      if (score1 === undefined || score2 === undefined) continue;

      // Calculate concordance: 1 - |score1 - score2| / 100
      const concordance = 1 - Math.abs(score1 - score2) / 100;

      // Update: H[i][j] = H[i][j] × φ⁻¹ + concordance × (1 - φ⁻¹)
      const oldValue = matrix[i][j];
      const newValue = oldValue * PHI_INV + concordance * (1 - PHI_INV);

      matrix[i][j] = Math.round(newValue * 1000) / 1000;
      matrix[j][i] = matrix[i][j]; // Symmetric

      if (newValue !== oldValue) {
        updates.push({
          pair: [dim1, dim2],
          oldValue,
          newValue: matrix[i][j],
          concordance: Math.round(concordance * 100) / 100,
        });
      }
    }
  }

  // Record in history
  harmony._history.push({
    timestamp: Date.now(),
    scoresCount: Object.keys(scores).length,
    updatesCount: updates.length,
  });

  // Keep only last 100 history entries
  if (harmony._history.length > 100) {
    harmony._history = harmony._history.slice(-100);
  }

  // Save
  saveHarmony(harmony);

  return {
    success: true,
    updatesCount: updates.length,
    updates: updates.slice(0, 10), // First 10 for brevity
  };
}

/**
 * Get harmony value between two dimensions
 *
 * @param {string} dim1 - First dimension
 * @param {string} dim2 - Second dimension
 * @returns {number} - Harmony value (0-1)
 */
function getHarmony(dim1, dim2) {
  const harmony = loadHarmony();
  if (!harmony) return 0;

  const i = harmony._dimensions.indexOf(dim1);
  const j = harmony._dimensions.indexOf(dim2);

  if (i === -1 || j === -1) return 0;

  return harmony.matrix[i][j];
}

/**
 * Get top harmonies for a dimension
 *
 * @param {string} dim - Dimension name
 * @param {number} top - Number of top harmonies to return
 * @returns {Array} - Array of { dimension, harmony }
 */
function getTopHarmonies(dim, top = 5) {
  const harmony = loadHarmony();
  if (!harmony) return [];

  const idx = harmony._dimensions.indexOf(dim);
  if (idx === -1) return [];

  const harmonies = harmony._dimensions.map((d, i) => ({
    dimension: d,
    harmony: harmony.matrix[idx][i],
  }));

  return harmonies
    .filter(h => h.dimension !== dim && h.harmony > 0)
    .sort((a, b) => b.harmony - a.harmony)
    .slice(0, top);
}

// =============================================================================
// THRESHOLD CALIBRATION (T Matrix)
// =============================================================================

/**
 * Calibrate threshold based on outcome
 * - correct: threshold += φ⁻² × 5 ≈ +1.9
 * - false_positive: threshold -= φ² × 5 ≈ -13.1
 * - false_negative: threshold += φ × 5 ≈ +8.1
 *
 * @param {string} dimension - Dimension to calibrate
 * @param {string} outcome - 'correct', 'false_positive', 'false_negative'
 * @param {string} severity - Which severity level to adjust
 * @returns {Object} - Calibration result
 */
function calibrateThreshold(dimension, outcome, severity = 'warning') {
  const thresholds = loadThresholds();
  if (!thresholds) return { error: 'Failed to load thresholds matrix' };

  const dimThresholds = thresholds.thresholds[dimension];
  if (!dimThresholds) return { error: `Unknown dimension: ${dimension}` };

  const oldValue = dimThresholds[severity];
  let delta = 0;

  switch (outcome) {
    case 'correct':
      delta = PHI_INV_2 * 5; // +1.91
      break;
    case 'false_positive':
      delta = -PHI_2 * 5; // -13.09
      break;
    case 'false_negative':
      delta = PHI * 5; // +8.09
      break;
    default:
      return { error: `Unknown outcome: ${outcome}` };
  }

  // Apply delta with bounds
  const bounds = thresholds._config.bounds;
  let newValue = oldValue + delta;
  newValue = Math.max(bounds.min, Math.min(bounds.max, newValue));
  newValue = Math.round(newValue * 10) / 10;

  // Update
  dimThresholds[severity] = newValue;

  // Update matrix row
  const dimIndex = thresholds._dimensions.indexOf(dimension);
  const sevIndex = thresholds._config.severities.indexOf(severity);
  if (dimIndex !== -1 && sevIndex !== -1) {
    thresholds.matrix[dimIndex][sevIndex] = newValue;
  }

  // Record calibration
  thresholds._calibrationHistory.push({
    timestamp: Date.now(),
    dimension,
    severity,
    outcome,
    oldValue,
    newValue,
    delta: Math.round(delta * 100) / 100,
  });

  // Keep only last 100 history entries
  if (thresholds._calibrationHistory.length > 100) {
    thresholds._calibrationHistory = thresholds._calibrationHistory.slice(-100);
  }

  // Save
  saveThresholds(thresholds);

  return {
    success: true,
    dimension,
    severity,
    outcome,
    oldValue,
    newValue,
    delta: Math.round(delta * 100) / 100,
  };
}

/**
 * Get threshold for a dimension and severity
 *
 * @param {string} dimension - Dimension name
 * @param {string} severity - Severity level
 * @returns {number} - Threshold value
 */
function getThreshold(dimension, severity = 'warning') {
  const thresholds = loadThresholds();
  if (!thresholds) return 38; // Default

  return thresholds.thresholds[dimension]?.[severity] || 38;
}

/**
 * Get all thresholds for a dimension
 *
 * @param {string} dimension - Dimension name
 * @returns {Object} - { healthy, warning, critical, severe }
 */
function getDimensionThresholds(dimension) {
  const thresholds = loadThresholds();
  if (!thresholds) return { healthy: 62, warning: 38, critical: 24, severe: 0 };

  return thresholds.thresholds[dimension] || { healthy: 62, warning: 38, critical: 24, severe: 0 };
}

// =============================================================================
// WEIGHT ACCESS (W Matrix - Read Only)
// =============================================================================

/**
 * Get weight for a dimension
 *
 * @param {string} dimension - Dimension name
 * @returns {number} - Weight value
 */
function getWeight(dimension) {
  const weights = loadWeights();
  if (!weights) return 1;

  for (const category of Object.values(weights.dimensions)) {
    const member = category.members.find(m => m.name === dimension);
    if (member) return member.weight;
  }

  return 1;
}

/**
 * Get weights vector
 *
 * @returns {Array} - Array of 25 weights
 */
function getWeightsVector() {
  const weights = loadWeights();
  return weights?.vector || [];
}

/**
 * Get total weight sum
 *
 * @returns {number} - Sum of all weights
 */
function getTotalWeight() {
  const weights = loadWeights();
  return weights?._constants?.TOTAL_WEIGHT || 49.21;
}

// =============================================================================
// STATS & DIAGNOSTICS
// =============================================================================

/**
 * Get matrix statistics
 *
 * @returns {Object} - Stats for all matrices
 */
function getMatrixStats() {
  const W = loadWeights();
  const H = loadHarmony();
  const T = loadThresholds();

  // Harmony stats
  let harmonySum = 0;
  let harmonyCount = 0;
  let harmonyMax = 0;

  if (H) {
    for (let i = 0; i < H.matrix.length; i++) {
      for (let j = i + 1; j < H.matrix[i].length; j++) {
        const val = H.matrix[i][j];
        harmonySum += val;
        harmonyCount++;
        if (val > harmonyMax) harmonyMax = val;
      }
    }
  }

  // Threshold deviation from default
  let thresholdDeviation = 0;
  if (T) {
    for (const dim of Object.values(T.thresholds)) {
      thresholdDeviation += Math.abs(dim.warning - 38);
    }
  }

  return {
    weights: {
      totalWeight: W?._constants?.TOTAL_WEIGHT || 0,
      dimensionCount: W?.vector?.length || 0,
    },
    harmony: {
      updateCount: H?._meta?.updateCount || 0,
      avgHarmony: harmonyCount > 0 ? Math.round(harmonySum / harmonyCount * 100) / 100 : 0,
      maxHarmony: harmonyMax,
      lastUpdated: H?._meta?.lastUpdated,
    },
    thresholds: {
      calibrationCount: T?._meta?.calibrationCount || 0,
      totalDeviation: Math.round(thresholdDeviation * 10) / 10,
      lastCalibrated: T?._meta?.lastCalibrated,
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Load
  loadWeights,
  loadHarmony,
  loadThresholds,
  loadAll,

  // Harmony (H)
  updateHarmony,
  getHarmony,
  getTopHarmonies,
  saveHarmony,

  // Thresholds (T)
  calibrateThreshold,
  getThreshold,
  getDimensionThresholds,
  saveThresholds,

  // Weights (W - read only)
  getWeight,
  getWeightsVector,
  getTotalWeight,

  // Stats
  getMatrixStats,

  // Constants
  PHI,
  PHI_2,
  PHI_INV,
  PHI_INV_2,

  // Paths
  MATRIX_DIR,
  WEIGHTS_FILE,
  HARMONY_FILE,
  THRESHOLDS_FILE,
};
