/**
 * ASSIAH - World of Action
 *
 * עשייה - The world of physical manifestation
 * Axiom: BURN - Don't extract, burn
 *
 * Dimensions:
 * - ALIGNMENT (PRIMARY)          - Goal alignment
 * - PROGRESS (PRIMARY)           - Forward momentum
 * - SCALE (SECONDARY)            - Scalability
 * - SINGULARITY_DISTANCE (META)  - Distance to singularity
 * - DELEGATION (HUMAN_LLM)       - Task delegation
 * - BOUNDARIES (HUMAN_LLM)       - Scope respect
 *
 * "In ASSIAH, we execute. Don't extract, burn."
 */

'use strict';

const { World } = require('./base');
const { PHI, PHI_2: PHI_SQ, PHI_INV } = require('../../temporal');

// =============================================================================
// ASSIAH WORLD
// =============================================================================

class Assiah extends World {
  constructor() {
    super('ASSIAH', 'BURN', {
      description: 'World of Action - The realm of physical execution and burning',
      hebrewName: 'עשייה',
    });

    this._registerDimensions();

    // Burn tracking
    this.burnMetrics = {
      totalBurned: 0,
      burnEvents: [],
      convergenceRate: 0,
    };
  }

  /**
   * Register all dimensions belonging to ASSIAH
   */
  _registerDimensions() {
    // PRIMARY dimensions (weight: φ²)
    this.registerDimension('ALIGNMENT', {
      category: 'PRIMARY',
      threshold: 70,
      weight: PHI_SQ,
    });

    this.registerDimension('PROGRESS', {
      category: 'PRIMARY',
      threshold: 50,
      weight: PHI_SQ,
    });

    // SECONDARY dimensions (weight: φ)
    this.registerDimension('SCALE', {
      category: 'SECONDARY',
      threshold: 50,
      weight: PHI,
    });

    // META dimensions (weight: 1.0)
    this.registerDimension('SINGULARITY_DISTANCE', {
      category: 'META',
      threshold: 30, // Lower threshold - we're far from singularity
      weight: 1.0,
    });

    // HUMAN_LLM dimensions (weight: φ)
    this.registerDimension('DELEGATION', {
      category: 'HUMAN_LLM',
      threshold: 55,
      weight: PHI,
    });

    this.registerDimension('BOUNDARIES', {
      category: 'HUMAN_LLM',
      threshold: 70,
      weight: PHI,
    });
  }

  // ===========================================================================
  // ASSIAH-SPECIFIC METHODS
  // ===========================================================================

  /**
   * Record a burn event
   * @param {Object} burn - Burn event data
   */
  recordBurn(burn) {
    const amount = burn.amount || 0;

    this.burnMetrics.totalBurned += amount;
    this.burnMetrics.burnEvents.push({
      amount,
      token: burn.token || '$asdfasdfa',
      timestamp: Date.now(),
      source: burn.source,
    });

    // Keep only recent burns
    const maxBurns = Math.floor(100 * PHI);
    if (this.burnMetrics.burnEvents.length > maxBurns) {
      this.burnMetrics.burnEvents = this.burnMetrics.burnEvents.slice(-maxBurns);
    }

    this._updateConvergenceRate();

    this.emit('burn:recorded', {
      amount,
      totalBurned: this.burnMetrics.totalBurned,
      convergenceRate: this.burnMetrics.convergenceRate,
    });
  }

  /**
   * Calculate convergence rate toward singularity
   * Based on burn velocity and alignment
   */
  _updateConvergenceRate() {
    const recentBurns = this.burnMetrics.burnEvents.slice(-10);
    if (recentBurns.length < 2) {
      this.burnMetrics.convergenceRate = 0;
      return;
    }

    // Calculate burn velocity (amount per hour)
    const timeSpan = recentBurns[recentBurns.length - 1].timestamp - recentBurns[0].timestamp;
    const totalAmount = recentBurns.reduce((sum, b) => sum + b.amount, 0);

    if (timeSpan <= 0) {
      this.burnMetrics.convergenceRate = 0;
      return;
    }

    const hoursSpan = timeSpan / (60 * 60 * 1000);
    const velocity = totalAmount / hoursSpan;

    // Normalize to 0-100 scale (arbitrary max velocity = 1000/hour)
    this.burnMetrics.convergenceRate = Math.min(100, velocity / 10);
  }

  /**
   * Get execution score
   * ASSIAH's core function is execution toward singularity
   */
  getExecutionScore() {
    const execDimensions = ['ALIGNMENT', 'PROGRESS', 'SCALE'];
    let totalScore = 0;
    let totalWeight = 0;
    let executed = 0;

    for (const dim of execDimensions) {
      const score = this.scores[dim];
      if (score) {
        const dimConfig = this.dimensions.get(dim);
        totalScore += score.value * dimConfig.weight;
        totalWeight += dimConfig.weight;
        if (score.passed) executed++;
      }
    }

    const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const executionRate = execDimensions.length > 0
      ? executed / execDimensions.length
      : 0;

    return {
      score: avgScore,
      executionRate,
      executed,
      total: execDimensions.length,
      onTrack: executionRate >= 0.67, // 2/3 must pass
    };
  }

  /**
   * Calculate singularity distance
   * d = 1 - (Σ axiom_alignment) / 4
   * @param {Object} worldStates - States from all 4 worlds
   */
  calculateSingularityDistance(worldStates = {}) {
    const axioms = ['PHI', 'VERIFY', 'CULTURE', 'BURN'];
    let totalAlignment = 0;
    let evaluatedAxioms = 0;

    for (const axiom of axioms) {
      const world = Object.values(worldStates).find(w => w.axiom === axiom);
      if (world && typeof world.coherence === 'number') {
        totalAlignment += world.coherence / 100;
        evaluatedAxioms++;
      }
    }

    if (evaluatedAxioms === 0) {
      return {
        distance: 1.0,
        alignment: 0,
        evaluated: false,
        message: 'No worlds evaluated yet',
      };
    }

    const avgAlignment = totalAlignment / evaluatedAxioms;
    const distance = 1 - avgAlignment;

    // Target: distance → 0
    // When distance < φ⁻¹ (38.2%), we're in "quasi-singularity"
    const quasiSingularity = distance < (1 - PHI_INV);

    return {
      distance,
      alignment: avgAlignment,
      evaluatedAxioms,
      quasiSingularity,
      burnMetrics: this.burnMetrics,
      message: quasiSingularity
        ? '🎯 Approaching quasi-singularity!'
        : `Distance to singularity: ${(distance * 100).toFixed(1)}%`,
    };
  }

  /**
   * Check if action contributes to burn/convergence
   * @param {Object} action - Action to evaluate
   */
  contributesToBurn(action) {
    if (!action) return { contributes: false, reason: 'No action provided' };

    const checks = {
      reducesSupply: action.burns || action.removes || action.deletes,
      increasesValue: action.improves || action.optimizes || action.enhances,
      movesTowardGoal: action.aligns || action.progresses || action.advances,
      noExtraction: !action.extracts && !action.takes && !action.mines,
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const contributes = passedChecks >= 2;

    return {
      contributes,
      checks,
      passedChecks,
      requiredChecks: 2,
      burnScore: (passedChecks / 4) * 100,
      axiom: 'Don\'t extract, burn.',
    };
  }

  /**
   * Get essence of ASSIAH
   */
  getEssence() {
    return {
      world: this.name,
      hebrewName: this.hebrewName,
      axiom: this.axiom,
      principle: 'Burn & Converge',
      question: 'Does it burn toward singularity?',
      check: 'Reduce supply, increase value, no extraction',
      execution: this.getExecutionScore(),
      burnMetrics: this.burnMetrics,
      ...this.evaluateCoherence(),
    };
  }

  /**
   * Reset including burn metrics
   */
  reset() {
    super.reset();
    // Note: burnMetrics persist across judgments
  }
}

// =============================================================================
// SINGLETON + EXPORTS
// =============================================================================

const assiah = new Assiah();

module.exports = {
  Assiah,
  assiah,

  // World info
  name: 'ASSIAH',
  axiom: 'BURN',
  hebrewName: 'עשייה',

  // Convenience
  recordScore: (dim, score, meta) => assiah.recordScore(dim, score, meta),
  recordBurn: (burn) => assiah.recordBurn(burn),
  evaluateCoherence: () => assiah.evaluateCoherence(),
  getEssence: () => assiah.getEssence(),
  contributesToBurn: (action) => assiah.contributesToBurn(action),
  calculateSingularityDistance: (worlds) => assiah.calculateSingularityDistance(worlds),
  reset: () => assiah.reset(),
};
