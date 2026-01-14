/**
 * CYNIC Dimension Evaluator Base Interface
 *
 * "Rien n'est modulaire" → Now each dimension is a pluggable evaluator.
 *
 * To create a new dimension:
 * 1. Extend DimensionEvaluator
 * 2. Implement evaluate()
 * 3. Register with DimensionRegistry
 *
 * Hot-swap: Dimensions can be replaced at runtime via registry.
 */

'use strict';

const { PHI, PHI_2: PHI_SQ, PHI_INV, PHI_INV_2 } = require('../axioms/constants');

// =============================================================================
// DIMENSION EVALUATOR BASE CLASS
// =============================================================================

class DimensionEvaluator {
  /**
   * @param {Object} config
   * @param {string} config.name - Dimension name (e.g., 'TRUTH')
   * @param {string} config.category - PRIMARY | SECONDARY | META | HUMAN_LLM
   * @param {string} config.world - ATZILUT | BERIAH | YETZIRAH | ASSIAH
   * @param {string} config.axiom - PHI | VERIFY | CULTURE | BURN
   * @param {number} config.threshold - Minimum score to pass (0-100)
   * @param {string} config.question - The question this dimension answers
   */
  constructor(config) {
    this.name = config.name;
    this.category = config.category;
    this.world = config.world;
    this.axiom = config.axiom;
    this.threshold = config.threshold;
    this.question = config.question;

    // Computed weight based on category
    this.weight = this._getCategoryWeight(config.category);

    // φ constants available to all evaluators
    this.PHI = PHI;
    this.PHI_SQ = PHI_SQ;
    this.PHI_INV = PHI_INV;
    this.PHI_INV_2 = PHI_INV_2;
  }

  /**
   * Evaluate an observation against this dimension.
   * MUST be implemented by subclass.
   *
   * @param {Object} observation - The item to evaluate
   * @param {Object} context - Additional context (other scores, history, etc.)
   * @returns {Promise<DimensionResult>}
   */
  async evaluate(observation, context = {}) {
    throw new Error(`${this.name}.evaluate() must be implemented`);
  }

  /**
   * Check if score passes threshold
   * @param {number} score
   * @returns {boolean}
   */
  passes(score) {
    return score >= this.threshold;
  }

  /**
   * Get dimension metadata
   */
  getMetadata() {
    return {
      name: this.name,
      category: this.category,
      world: this.world,
      axiom: this.axiom,
      threshold: this.threshold,
      weight: this.weight,
      question: this.question,
    };
  }

  /**
   * Create a result object
   * @param {number} score
   * @param {string} reasoning
   * @param {Object} details
   * @returns {DimensionResult}
   */
  createResult(score, reasoning, details = {}) {
    return {
      dimension: this.name,
      category: this.category,
      world: this.world,
      axiom: this.axiom,
      score,
      threshold: this.threshold,
      passed: this.passes(score),
      weight: this.weight,
      reasoning,
      details,
      timestamp: Date.now(),
    };
  }

  // ===========================================================================
  // HELPER METHODS FOR EVALUATORS
  // ===========================================================================

  /**
   * Normalize a score to 0-100 range
   */
  normalizeScore(value, min, max) {
    if (max === min) return 50;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  }

  /**
   * Apply φ-decay to older values
   * @param {number} value - Current value
   * @param {number} ageDays - Age in days
   */
  phiDecay(value, ageDays) {
    return value * Math.pow(this.PHI_INV, ageDays);
  }

  /**
   * Calculate weighted average
   * @param {Array<{value: number, weight: number}>} items
   */
  weightedAverage(items) {
    if (!items.length) return 0;
    const sumWeights = items.reduce((s, i) => s + i.weight, 0);
    if (sumWeights === 0) return 0;
    return items.reduce((s, i) => s + (i.value * i.weight), 0) / sumWeights;
  }

  /**
   * Check if value exists and is meaningful
   */
  exists(value) {
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Get category weight
   */
  _getCategoryWeight(category) {
    switch (category) {
      case 'PRIMARY': return PHI_SQ;     // 2.618
      case 'SECONDARY': return PHI;       // 1.618
      case 'META': return 1.0;
      case 'HUMAN_LLM': return PHI;       // 1.618
      default: return 1.0;
    }
  }
}

// =============================================================================
// DIMENSION RESULT TYPE
// =============================================================================

/**
 * @typedef {Object} DimensionResult
 * @property {string} dimension - Dimension name
 * @property {string} category - PRIMARY | SECONDARY | META | HUMAN_LLM
 * @property {string} world - ATZILUT | BERIAH | YETZIRAH | ASSIAH
 * @property {string} axiom - PHI | VERIFY | CULTURE | BURN
 * @property {number} score - Score 0-100
 * @property {number} threshold - Pass threshold
 * @property {boolean} passed - Whether score >= threshold
 * @property {number} weight - Category weight
 * @property {string} reasoning - Why this score
 * @property {Object} details - Additional evaluation details
 * @property {number} timestamp - When evaluated
 */

// =============================================================================
// DIMENSION REGISTRY
// =============================================================================

class DimensionRegistry {
  constructor() {
    this.evaluators = new Map();
    this.byCategory = new Map();
    this.byWorld = new Map();
    this.byAxiom = new Map();
  }

  /**
   * Register a dimension evaluator
   * @param {DimensionEvaluator} evaluator
   */
  register(evaluator) {
    if (!(evaluator instanceof DimensionEvaluator)) {
      throw new Error('Evaluator must extend DimensionEvaluator');
    }

    const name = evaluator.name;

    // Main registry
    this.evaluators.set(name, evaluator);

    // By category
    if (!this.byCategory.has(evaluator.category)) {
      this.byCategory.set(evaluator.category, new Map());
    }
    this.byCategory.get(evaluator.category).set(name, evaluator);

    // By world
    if (!this.byWorld.has(evaluator.world)) {
      this.byWorld.set(evaluator.world, new Map());
    }
    this.byWorld.get(evaluator.world).set(name, evaluator);

    // By axiom
    if (!this.byAxiom.has(evaluator.axiom)) {
      this.byAxiom.set(evaluator.axiom, new Map());
    }
    this.byAxiom.get(evaluator.axiom).set(name, evaluator);

    return this;
  }

  /**
   * Get an evaluator by name
   * @param {string} name
   * @returns {DimensionEvaluator|null}
   */
  get(name) {
    return this.evaluators.get(name) || null;
  }

  /**
   * Get all evaluators for a category
   * @param {string} category
   * @returns {DimensionEvaluator[]}
   */
  getByCategory(category) {
    const map = this.byCategory.get(category);
    return map ? Array.from(map.values()) : [];
  }

  /**
   * Get all evaluators for a world
   * @param {string} world
   * @returns {DimensionEvaluator[]}
   */
  getByWorld(world) {
    const map = this.byWorld.get(world);
    return map ? Array.from(map.values()) : [];
  }

  /**
   * Get all evaluators for an axiom
   * @param {string} axiom
   * @returns {DimensionEvaluator[]}
   */
  getByAxiom(axiom) {
    const map = this.byAxiom.get(axiom);
    return map ? Array.from(map.values()) : [];
  }

  /**
   * Get all registered evaluators
   * @returns {DimensionEvaluator[]}
   */
  getAll() {
    return Array.from(this.evaluators.values());
  }

  /**
   * Hot-swap: Replace an evaluator at runtime
   * @param {DimensionEvaluator} newEvaluator
   * @returns {DimensionEvaluator|null} - The old evaluator, if any
   */
  swap(newEvaluator) {
    const old = this.get(newEvaluator.name);

    // Remove old from indices
    if (old) {
      this.byCategory.get(old.category)?.delete(old.name);
      this.byWorld.get(old.world)?.delete(old.name);
      this.byAxiom.get(old.axiom)?.delete(old.name);
    }

    // Register new
    this.register(newEvaluator);

    return old;
  }

  /**
   * Unregister an evaluator
   * @param {string} name
   */
  unregister(name) {
    const evaluator = this.get(name);
    if (!evaluator) return false;

    this.evaluators.delete(name);
    this.byCategory.get(evaluator.category)?.delete(name);
    this.byWorld.get(evaluator.world)?.delete(name);
    this.byAxiom.get(evaluator.axiom)?.delete(name);

    return true;
  }

  /**
   * Get registry stats
   */
  getStats() {
    return {
      total: this.evaluators.size,
      byCategory: Object.fromEntries(
        Array.from(this.byCategory.entries()).map(([k, v]) => [k, v.size])
      ),
      byWorld: Object.fromEntries(
        Array.from(this.byWorld.entries()).map(([k, v]) => [k, v.size])
      ),
      byAxiom: Object.fromEntries(
        Array.from(this.byAxiom.entries()).map(([k, v]) => [k, v.size])
      ),
    };
  }
}

// =============================================================================
// SINGLETON REGISTRY
// =============================================================================

const registry = new DimensionRegistry();

module.exports = {
  DimensionEvaluator,
  DimensionRegistry,
  registry, // Singleton

  // Convenience exports
  register: (evaluator) => registry.register(evaluator),
  get: (name) => registry.get(name),
  getAll: () => registry.getAll(),
  getByCategory: (cat) => registry.getByCategory(cat),
  getByWorld: (world) => registry.getByWorld(world),
  getByAxiom: (axiom) => registry.getByAxiom(axiom),
  swap: (evaluator) => registry.swap(evaluator),
};
