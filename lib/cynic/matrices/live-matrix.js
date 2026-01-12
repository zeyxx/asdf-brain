/**
 * CYNIC Live Matrix
 *
 * Real-time visibility into all 24 dimensions during judgment.
 * "Je ne comprends pas ce qui est fait" → Now you can see everything.
 *
 * Emits events for each dimension score, world completion, and final judgment.
 */

'use strict';

const { EventEmitter } = require('events');
const { PHI, PHI_2: PHI_SQ, PHI_INV, PHI_INV_2 } = require('../../temporal');

// =============================================================================
// DIMENSION DEFINITIONS (extracted from self-judge.js for reference)
// =============================================================================

const DIMENSION_MAP = {
  // PRIMARY (8) - Weight: φ² = 2.618
  PRIMARY: {
    weight: PHI_SQ,
    dimensions: {
      HARMONY: { world: 'ATZILUT', axiom: 'PHI', threshold: 60 },
      COHERENCE: { world: 'ATZILUT', axiom: 'PHI', threshold: 70 },
      TRUTH: { world: 'BERIAH', axiom: 'VERIFY', threshold: 70 },
      INTEGRITY: { world: 'BERIAH', axiom: 'VERIFY', threshold: 80 },
      ETHICS: { world: 'YETZIRAH', axiom: 'CULTURE', threshold: 75 },
      OPTIMISM: { world: 'YETZIRAH', axiom: 'CULTURE', threshold: 50 },
      ALIGNMENT: { world: 'ASSIAH', axiom: 'BURN', threshold: 70 },
      PROGRESS: { world: 'ASSIAH', axiom: 'BURN', threshold: 50 },
    }
  },

  // SECONDARY (5) - Weight: φ = 1.618
  SECONDARY: {
    weight: PHI,
    dimensions: {
      SECURE: { world: 'BERIAH', axiom: 'VERIFY', threshold: 80 },
      PRIVATE: { world: 'BERIAH', axiom: 'VERIFY', threshold: 75 },
      SCALE: { world: 'ASSIAH', axiom: 'BURN', threshold: 50 },
      SIMPLIFY: { world: 'ATZILUT', axiom: 'PHI', threshold: 60 },
      ENABLE: { world: 'YETZIRAH', axiom: 'CULTURE', threshold: 70 },
    }
  },

  // META (3) - Weight: 1.0
  META: {
    weight: 1.0,
    dimensions: {
      SELF_AWARENESS: { world: 'ATZILUT', axiom: 'PHI', threshold: 50 },
      LEARNING_RATE: { world: 'BERIAH', axiom: 'VERIFY', threshold: 40 },
      SINGULARITY_DISTANCE: { world: 'ASSIAH', axiom: 'BURN', threshold: 30 },
    }
  },

  // HUMAN_LLM (8) - Weight: φ = 1.618
  HUMAN_LLM: {
    weight: PHI,
    dimensions: {
      MEMORY: { world: 'ATZILUT', axiom: 'PHI', threshold: 60 },
      TEACHING: { world: 'ATZILUT', axiom: 'PHI', threshold: 50 },
      INTENT: { world: 'BERIAH', axiom: 'VERIFY', threshold: 70 },
      TRUST: { world: 'BERIAH', axiom: 'VERIFY', threshold: 65 },
      PROACTIVITY: { world: 'YETZIRAH', axiom: 'CULTURE', threshold: 50 },
      COMPLEMENTARITY: { world: 'YETZIRAH', axiom: 'CULTURE', threshold: 60 },
      DELEGATION: { world: 'ASSIAH', axiom: 'BURN', threshold: 55 },
      BOUNDARIES: { world: 'ASSIAH', axiom: 'BURN', threshold: 70 },
    }
  }
};

// =============================================================================
// LIVE MATRIX CLASS
// =============================================================================

class LiveMatrix extends EventEmitter {
  constructor() {
    super();

    // Current judgment state
    this.judgmentId = null;
    this.startTime = null;
    this.scores = {};
    this.worldScores = {};
    this.categoryScores = {};

    // φ constants
    this.PHI = PHI;
    this.MAX_CONFIDENCE = PHI_INV;
    this.MIN_DOUBT = PHI_INV_2;
  }

  // ===========================================================================
  // JUDGMENT LIFECYCLE
  // ===========================================================================

  /**
   * Start a new judgment - clears matrix
   * @param {string} judgmentId - Unique ID for this judgment
   */
  startJudgment(judgmentId) {
    this.judgmentId = judgmentId;
    this.startTime = Date.now();
    this.scores = {};
    this.worldScores = {
      ATZILUT: { scores: [], complete: false },
      BERIAH: { scores: [], complete: false },
      YETZIRAH: { scores: [], complete: false },
      ASSIAH: { scores: [], complete: false },
    };
    this.categoryScores = {
      PRIMARY: { scores: [], complete: false },
      SECONDARY: { scores: [], complete: false },
      META: { scores: [], complete: false },
      HUMAN_LLM: { scores: [], complete: false },
    };

    this.emit('judgment:start', {
      judgmentId,
      timestamp: this.startTime,
      totalDimensions: 24,
      categories: Object.keys(DIMENSION_MAP),
      worlds: Object.keys(this.worldScores),
    });
  }

  /**
   * Record a dimension score
   * @param {string} dimension - Dimension name (e.g., 'TRUTH')
   * @param {number} score - Score 0-100
   * @param {Object} metadata - Additional info
   */
  recordScore(dimension, score, metadata = {}) {
    // Find dimension info
    let dimInfo = null;
    let category = null;

    for (const [cat, data] of Object.entries(DIMENSION_MAP)) {
      if (data.dimensions[dimension]) {
        dimInfo = data.dimensions[dimension];
        category = cat;
        break;
      }
    }

    if (!dimInfo) {
      this.emit('warning', { message: `Unknown dimension: ${dimension}` });
      return;
    }

    const entry = {
      dimension,
      score,
      category,
      world: dimInfo.world,
      axiom: dimInfo.axiom,
      threshold: dimInfo.threshold,
      passed: score >= dimInfo.threshold,
      weight: DIMENSION_MAP[category].weight,
      timestamp: Date.now(),
      ...metadata
    };

    // Store score
    this.scores[dimension] = entry;

    // Update world scores
    this.worldScores[dimInfo.world].scores.push(entry);

    // Update category scores
    this.categoryScores[category].scores.push(entry);

    // Emit individual score event
    this.emit('dimension:score', entry);

    // Check if world is complete
    this._checkWorldComplete(dimInfo.world);

    // Check if category is complete
    this._checkCategoryComplete(category);
  }

  /**
   * Complete the judgment
   * @param {Object} finalResult - Final judgment result
   */
  completeJudgment(finalResult) {
    const duration = Date.now() - this.startTime;

    // Calculate aggregates
    const matrix = this.getFullMatrix();

    const result = {
      judgmentId: this.judgmentId,
      duration,
      scores: this.scores,
      worldScores: this._calculateWorldAverages(),
      categoryScores: this._calculateCategoryAverages(),
      matrix,
      finalScore: finalResult?.score,
      verdict: finalResult?.verdict,
      confidence: Math.min(finalResult?.confidence || 0, this.MAX_CONFIDENCE),
      phi: {
        maxConfidence: this.MAX_CONFIDENCE,
        minDoubt: this.MIN_DOUBT,
        constrained: true,
      },
      timestamp: Date.now(),
    };

    this.emit('judgment:complete', result);

    return result;
  }

  // ===========================================================================
  // MATRIX ACCESS
  // ===========================================================================

  /**
   * Get current state of all 24 dimensions
   */
  getFullMatrix() {
    const matrix = {
      dimensions: {},
      byWorld: {},
      byCategory: {},
      byAxiom: {},
      summary: {
        total: 0,
        evaluated: Object.keys(this.scores).length,
        passed: 0,
        failed: 0,
        avgScore: 0,
      }
    };

    let totalScore = 0;

    // Build dimension view
    for (const [category, data] of Object.entries(DIMENSION_MAP)) {
      matrix.byCategory[category] = {
        weight: data.weight,
        dimensions: {}
      };

      for (const [dim, info] of Object.entries(data.dimensions)) {
        matrix.summary.total++;

        const score = this.scores[dim];
        const entry = {
          category,
          world: info.world,
          axiom: info.axiom,
          threshold: info.threshold,
          weight: data.weight,
          score: score?.score ?? null,
          passed: score?.passed ?? null,
          evaluated: !!score,
        };

        matrix.dimensions[dim] = entry;
        matrix.byCategory[category].dimensions[dim] = entry;

        // By world
        if (!matrix.byWorld[info.world]) {
          matrix.byWorld[info.world] = { dimensions: {}, axiom: info.axiom };
        }
        matrix.byWorld[info.world].dimensions[dim] = entry;

        // By axiom
        if (!matrix.byAxiom[info.axiom]) {
          matrix.byAxiom[info.axiom] = { dimensions: {} };
        }
        matrix.byAxiom[info.axiom].dimensions[dim] = entry;

        // Summary
        if (score) {
          totalScore += score.score;
          if (score.passed) {
            matrix.summary.passed++;
          } else {
            matrix.summary.failed++;
          }
        }
      }
    }

    matrix.summary.avgScore = matrix.summary.evaluated > 0
      ? totalScore / matrix.summary.evaluated
      : 0;

    return matrix;
  }

  /**
   * Get scores for a specific world
   * @param {string} world - ATZILUT, BERIAH, YETZIRAH, ASSIAH
   */
  getWorldScores(world) {
    return this.worldScores[world] || null;
  }

  /**
   * Get scores for a specific category
   * @param {string} category - PRIMARY, SECONDARY, META, HUMAN_LLM
   */
  getCategoryScores(category) {
    return this.categoryScores[category] || null;
  }

  /**
   * Get blocking dimensions (below threshold)
   */
  getBlockingDimensions() {
    return Object.values(this.scores).filter(s => !s.passed);
  }

  /**
   * Get passed dimensions
   */
  getPassedDimensions() {
    return Object.values(this.scores).filter(s => s.passed);
  }

  // ===========================================================================
  // INTERNAL HELPERS
  // ===========================================================================

  _checkWorldComplete(world) {
    const worldDimensions = [];
    for (const data of Object.values(DIMENSION_MAP)) {
      for (const [dim, info] of Object.entries(data.dimensions)) {
        if (info.world === world) {
          worldDimensions.push(dim);
        }
      }
    }

    const evaluatedCount = worldDimensions.filter(d => this.scores[d]).length;

    if (evaluatedCount === worldDimensions.length) {
      this.worldScores[world].complete = true;

      this.emit('world:complete', {
        world,
        scores: this.worldScores[world].scores,
        avgScore: this._calculateAverage(this.worldScores[world].scores),
        allPassed: this.worldScores[world].scores.every(s => s.passed),
      });
    }
  }

  _checkCategoryComplete(category) {
    const categoryDimensions = Object.keys(DIMENSION_MAP[category].dimensions);
    const evaluatedCount = categoryDimensions.filter(d => this.scores[d]).length;

    if (evaluatedCount === categoryDimensions.length) {
      this.categoryScores[category].complete = true;

      this.emit('category:complete', {
        category,
        weight: DIMENSION_MAP[category].weight,
        scores: this.categoryScores[category].scores,
        avgScore: this._calculateAverage(this.categoryScores[category].scores),
        allPassed: this.categoryScores[category].scores.every(s => s.passed),
      });
    }
  }

  _calculateAverage(scores) {
    if (!scores.length) return 0;
    return scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  }

  _calculateWorldAverages() {
    const result = {};
    for (const [world, data] of Object.entries(this.worldScores)) {
      result[world] = {
        avgScore: this._calculateAverage(data.scores),
        count: data.scores.length,
        complete: data.complete,
      };
    }
    return result;
  }

  _calculateCategoryAverages() {
    const result = {};
    for (const [category, data] of Object.entries(this.categoryScores)) {
      result[category] = {
        avgScore: this._calculateAverage(data.scores),
        weight: DIMENSION_MAP[category].weight,
        count: data.scores.length,
        complete: data.complete,
      };
    }
    return result;
  }
}

// =============================================================================
// SINGLETON + EXPORTS
// =============================================================================

const liveMatrix = new LiveMatrix();

module.exports = {
  LiveMatrix,
  liveMatrix,
  DIMENSION_MAP,

  // Convenience exports
  startJudgment: (id) => liveMatrix.startJudgment(id),
  recordScore: (dim, score, meta) => liveMatrix.recordScore(dim, score, meta),
  completeJudgment: (result) => liveMatrix.completeJudgment(result),
  getFullMatrix: () => liveMatrix.getFullMatrix(),
  getBlockingDimensions: () => liveMatrix.getBlockingDimensions(),

  // Event subscription
  on: (event, handler) => liveMatrix.on(event, handler),
  once: (event, handler) => liveMatrix.once(event, handler),
};
