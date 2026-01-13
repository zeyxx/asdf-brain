/**
 * World Base Class
 *
 * The 4 Worlds of Kabbalah mapped to CYNIC's judgment layers:
 * - ATZILUT (Emanation) → PHI axiom → Divine/Abstract
 * - BERIAH (Creation)   → VERIFY axiom → Intellectual/Verification
 * - YETZIRAH (Formation) → CULTURE axiom → Emotional/Cultural
 * - ASSIAH (Action)     → BURN axiom → Physical/Execution
 *
 * Each world aggregates dimensions from its axiom and provides coherence checking.
 */

'use strict';

const { EventEmitter } = require('events');
const { PHI, PHI_INV, PHI_INV_2, PHI_2: PHI_SQ } = require('../../temporal');

// =============================================================================
// WORLD BASE CLASS
// =============================================================================

class World extends EventEmitter {
  /**
   * @param {string} name - World name (ATZILUT, BERIAH, YETZIRAH, ASSIAH)
   * @param {string} axiom - Associated axiom (PHI, VERIFY, CULTURE, BURN)
   * @param {Object} config - World configuration
   */
  constructor(name, axiom, config = {}) {
    super();

    this.name = name;
    this.axiom = axiom;
    this.description = config.description || '';
    this.hebrewName = config.hebrewName || name;

    // Dimensions belonging to this world
    this.dimensions = new Map();

    // Current state
    this.scores = {};
    this.coherence = null;
    this.lastEvaluation = null;

    // φ thresholds
    this.thresholds = {
      coherent: PHI_INV * 100,        // 61.8% - coherent
      warning: 50,                     // 50% - needs attention
      critical: PHI_INV_2 * 100,      // 38.2% - critical
    };
  }

  // ===========================================================================
  // DIMENSION MANAGEMENT
  // ===========================================================================

  /**
   * Register a dimension to this world
   * @param {string} name - Dimension name
   * @param {Object} config - Dimension configuration
   */
  registerDimension(name, config) {
    this.dimensions.set(name, {
      name,
      category: config.category || 'UNKNOWN',
      threshold: config.threshold || 50,
      weight: config.weight || 1.0,
      evaluator: config.evaluator || null,
    });

    this.emit('dimension:registered', { world: this.name, dimension: name });
  }

  /**
   * Get all dimensions in this world
   */
  getDimensions() {
    return Array.from(this.dimensions.values());
  }

  /**
   * Check if dimension belongs to this world
   */
  hasDimension(name) {
    return this.dimensions.has(name);
  }

  // ===========================================================================
  // EVALUATION
  // ===========================================================================

  /**
   * Record a dimension score
   * @param {string} dimension - Dimension name
   * @param {number} score - Score 0-100
   * @param {Object} metadata - Additional info
   */
  recordScore(dimension, score, metadata = {}) {
    if (!this.dimensions.has(dimension)) {
      this.emit('warning', {
        message: `Dimension ${dimension} not registered in ${this.name}`,
      });
      return false;
    }

    const dimConfig = this.dimensions.get(dimension);

    this.scores[dimension] = {
      value: score,
      passed: score >= dimConfig.threshold,
      threshold: dimConfig.threshold,
      weight: dimConfig.weight,
      timestamp: Date.now(),
      ...metadata,
    };

    this.emit('score:recorded', {
      world: this.name,
      dimension,
      score,
      passed: score >= dimConfig.threshold,
    });

    return true;
  }

  /**
   * Evaluate world coherence
   * @returns {Object} Coherence result
   */
  evaluateCoherence() {
    const scores = Object.values(this.scores);

    if (scores.length === 0) {
      return {
        world: this.name,
        axiom: this.axiom,
        coherence: null,
        status: 'no_data',
        message: 'No dimensions evaluated yet',
      };
    }

    // Calculate weighted average
    let weightedSum = 0;
    let totalWeight = 0;
    let passedCount = 0;

    for (const score of scores) {
      weightedSum += score.value * score.weight;
      totalWeight += score.weight;
      if (score.passed) passedCount++;
    }

    const avgScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const passRate = scores.length > 0 ? passedCount / scores.length : 0;

    // Calculate variance (coherence = low variance)
    let variance = 0;
    for (const score of scores) {
      variance += Math.pow(score.value - avgScore, 2) * score.weight;
    }
    variance = totalWeight > 0 ? variance / totalWeight : 0;
    const stdDev = Math.sqrt(variance);

    // Coherence: 100% - (normalized std dev)
    // High variance = low coherence
    const normalizedStdDev = stdDev / 50; // Normalize to 0-2 range typically
    const coherence = Math.max(0, 100 - normalizedStdDev * 100);

    // Determine status
    let status = 'critical';
    if (coherence >= this.thresholds.coherent) {
      status = 'coherent';
    } else if (coherence >= this.thresholds.warning) {
      status = 'warning';
    }

    this.coherence = coherence;
    this.lastEvaluation = Date.now();

    const result = {
      world: this.name,
      axiom: this.axiom,
      coherence,
      status,
      avgScore,
      passRate,
      variance,
      stdDev,
      dimensionCount: scores.length,
      passedCount,
      scores: this.scores,
      thresholds: this.thresholds,
      phi: {
        coherentThreshold: this.thresholds.coherent,
        criticalThreshold: this.thresholds.critical,
      },
      timestamp: this.lastEvaluation,
    };

    this.emit('coherence:evaluated', result);

    return result;
  }

  /**
   * Get blocking dimensions (below threshold)
   */
  getBlockingDimensions() {
    return Object.entries(this.scores)
      .filter(([_, data]) => !data.passed)
      .map(([name, data]) => ({ name, ...data }));
  }

  /**
   * Check if world is aligned with its axiom
   */
  isAligned() {
    if (this.coherence === null) {
      this.evaluateCoherence();
    }
    return this.coherence >= this.thresholds.coherent;
  }

  // ===========================================================================
  // RESET
  // ===========================================================================

  /**
   * Reset scores for new judgment
   */
  reset() {
    this.scores = {};
    this.coherence = null;
    this.lastEvaluation = null;
    this.emit('reset', { world: this.name });
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Get world state for persistence/display
   */
  toJSON() {
    return {
      name: this.name,
      axiom: this.axiom,
      hebrewName: this.hebrewName,
      description: this.description,
      dimensions: this.getDimensions(),
      scores: this.scores,
      coherence: this.coherence,
      isAligned: this.isAligned(),
      lastEvaluation: this.lastEvaluation,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  World,
  THRESHOLDS: {
    coherent: PHI_INV * 100,
    warning: 50,
    critical: PHI_INV_2 * 100,
  },
};
