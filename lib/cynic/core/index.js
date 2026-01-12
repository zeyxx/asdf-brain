/**
 * CYNIC Core - The Central Point
 *
 * "CYNIC est le point central de l'écosystème $asdfasdfa"
 *
 * This is the lightweight orchestrator (~300 lines vs 3721).
 * All logic is delegated to modular components.
 *
 * Connects: HolDex + GASdf + Brain + Humans
 */

'use strict';

const { EventEmitter } = require('events');
const { PHI, PHI_INV, PHI_INV_2 } = require('../../temporal');

// Core modules
const { activation, STATES, wake, sleep, isActive } = require('./activation');
const { liveMatrix, startJudgment, recordScore, completeJudgment, getFullMatrix } = require('../matrices/live-matrix');
const { registry, getAll: getAllDimensions, getByCategory, getByWorld } = require('../dimensions/base');

// =============================================================================
// CYNIC CORE CLASS
// =============================================================================

class CYNICCore extends EventEmitter {
  constructor() {
    super();

    // φ constants
    this.PHI = PHI;
    this.MAX_CONFIDENCE = PHI_INV;       // 61.8%
    this.MIN_DOUBT = PHI_INV_2;          // 38.2%

    // State
    this.judgmentIdCounter = 0;

    // Wire up activation events
    this._setupActivationEvents();

    // Wire up matrix events
    this._setupMatrixEvents();
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Wake CYNIC from sleep
   * @param {string} source - holdex | gasdf | brain | human
   */
  wake(source = 'api') {
    return wake(source);
  }

  /**
   * Put CYNIC to sleep
   * @param {string} reason
   */
  sleep(reason = 'manual') {
    return sleep(reason);
  }

  /**
   * Check if CYNIC is active
   */
  isActive() {
    return isActive();
  }

  /**
   * Get current status
   */
  getStatus() {
    const activationStatus = activation.getStatus();
    const matrixStatus = getFullMatrix();
    const registryStats = registry.getStats();

    return {
      ...activationStatus,
      dimensions: registryStats,
      matrix: {
        total: matrixStatus.summary.total,
        evaluated: matrixStatus.summary.evaluated,
      },
      version: '2.0.0-modular',
      architecture: 'refactored',
    };
  }

  /**
   * Judge an observation through all 24 dimensions
   * @param {Object} observation - What to judge
   * @param {Object} options - Judgment options
   * @returns {Promise<JudgmentResult>}
   */
  async judge(observation, options = {}) {
    // Generate judgment ID
    const judgmentId = `cynic-${Date.now()}-${++this.judgmentIdCounter}`;

    // Start judgment state
    if (!activation.startJudging(observation)) {
      throw new Error('Cannot start judging - check activation state');
    }

    // Initialize matrix
    startJudgment(judgmentId);

    try {
      // Run all dimension evaluations
      const results = await this._evaluateAllDimensions(observation, options);

      // Calculate final score
      const finalResult = this._calculateFinalScore(results);

      // Complete matrix
      const matrixResult = completeJudgment(finalResult);

      // Complete judgment state
      activation.completeJudging({
        judgmentId,
        ...finalResult,
      });

      // Emit full result
      this.emit('judgment', {
        judgmentId,
        observation,
        ...finalResult,
        matrix: matrixResult,
        timestamp: Date.now(),
      });

      return {
        judgmentId,
        ...finalResult,
        matrix: matrixResult,
      };

    } catch (error) {
      // Error during judgment
      activation.completeJudging({
        judgmentId,
        error: error.message,
        verdict: 'ERROR',
      });

      this.emit('error', {
        judgmentId,
        error: error.message,
        observation,
      });

      throw error;
    }
  }

  /**
   * Get available dimensions
   */
  getDimensions() {
    return getAllDimensions().map(d => d.getMetadata());
  }

  /**
   * Get current live matrix state
   */
  getMatrix() {
    return getFullMatrix();
  }

  // ===========================================================================
  // INTERNAL METHODS
  // ===========================================================================

  async _evaluateAllDimensions(observation, options = {}) {
    const evaluators = getAllDimensions();
    const results = [];

    // Evaluate in order: PRIMARY → SECONDARY → META → HUMAN_LLM
    const categories = ['PRIMARY', 'SECONDARY', 'META', 'HUMAN_LLM'];

    for (const category of categories) {
      const categoryEvaluators = getByCategory(category);

      for (const evaluator of categoryEvaluators) {
        try {
          // Context includes previous results
          const context = {
            previousResults: results,
            category,
            options,
          };

          const result = await evaluator.evaluate(observation, context);

          // Record in live matrix
          recordScore(result.dimension, result.score, {
            reasoning: result.reasoning,
            passed: result.passed,
          });

          results.push(result);

        } catch (error) {
          // Record failed evaluation
          results.push({
            dimension: evaluator.name,
            category: evaluator.category,
            score: 0,
            passed: false,
            error: error.message,
          });

          recordScore(evaluator.name, 0, {
            error: error.message,
            passed: false,
          });
        }
      }
    }

    return results;
  }

  _calculateFinalScore(results) {
    if (results.length === 0) {
      return {
        score: 0,
        verdict: 'UNKNOWN',
        confidence: 0,
        blocking: [],
      };
    }

    // Weighted average
    let totalWeight = 0;
    let weightedSum = 0;

    for (const result of results) {
      const weight = result.weight || 1.0;
      weightedSum += result.score * weight;
      totalWeight += weight;
    }

    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Get blocking dimensions (below threshold)
    const blocking = results.filter(r => !r.passed);

    // Determine verdict based on blocking count and score
    let verdict;
    if (blocking.length === 0 && score >= 61.8) {
      verdict = 'ACCEPT';
    } else if (blocking.length > results.length * this.MIN_DOUBT) {
      verdict = 'REJECT';
    } else {
      verdict = 'TRANSFORM';
    }

    // Confidence is capped at φ⁻¹ (61.8%)
    const rawConfidence = (score / 100) * (1 - (blocking.length / results.length));
    const confidence = Math.min(rawConfidence, this.MAX_CONFIDENCE);

    return {
      score,
      verdict,
      confidence,
      blocking: blocking.map(b => ({
        dimension: b.dimension,
        score: b.score,
        threshold: b.threshold,
      })),
      passedCount: results.length - blocking.length,
      totalCount: results.length,
      passRate: (results.length - blocking.length) / results.length,
    };
  }

  _setupActivationEvents() {
    activation.on('wake', (data) => this.emit('activation:wake', data));
    activation.on('sleep', (data) => this.emit('activation:sleep', data));
    activation.on('judging:start', (data) => this.emit('activation:judging', data));
    activation.on('judging:complete', (data) => this.emit('activation:complete', data));
    activation.on('learning:start', (data) => this.emit('activation:learning', data));
    activation.on('learning:complete', (data) => this.emit('activation:learned', data));
    activation.on('warning', (data) => this.emit('warning', data));
  }

  _setupMatrixEvents() {
    liveMatrix.on('dimension:score', (data) => this.emit('matrix:dimension', data));
    liveMatrix.on('world:complete', (data) => this.emit('matrix:world', data));
    liveMatrix.on('category:complete', (data) => this.emit('matrix:category', data));
    liveMatrix.on('judgment:start', (data) => this.emit('matrix:start', data));
    liveMatrix.on('judgment:complete', (data) => this.emit('matrix:complete', data));
  }
}

// =============================================================================
// SINGLETON & EXPORTS
// =============================================================================

const cynic = new CYNICCore();

module.exports = {
  CYNICCore,
  cynic, // Singleton

  // Re-export core modules
  activation,
  liveMatrix,
  registry,
  STATES,

  // Convenience exports
  wake: (source) => cynic.wake(source),
  sleep: (reason) => cynic.sleep(reason),
  isActive: () => cynic.isActive(),
  getStatus: () => cynic.getStatus(),
  judge: (obs, opts) => cynic.judge(obs, opts),
  getDimensions: () => cynic.getDimensions(),
  getMatrix: () => cynic.getMatrix(),

  // Event subscription
  on: (event, handler) => cynic.on(event, handler),
  once: (event, handler) => cynic.once(event, handler),
};
