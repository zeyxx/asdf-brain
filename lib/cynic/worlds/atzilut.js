/**
 * ATZILUT - World of Emanation
 *
 * אצילות - The highest world, closest to the divine
 * Axiom: PHI (φ) - All ratios derive from 1.618...
 *
 * Dimensions:
 * - HARMONY (PRIMARY)     - Balance and proportion
 * - COHERENCE (PRIMARY)   - Internal consistency
 * - SIMPLIFY (SECONDARY)  - Elegant reduction
 * - SELF_AWARENESS (META) - Self-reflection
 * - MEMORY (HUMAN_LLM)    - Knowledge retention
 * - TEACHING (HUMAN_LLM)  - Knowledge transfer
 *
 * "In ATZILUT, we seek the golden ratio in all things."
 */

'use strict';

const { World } = require('./base');
const { PHI, PHI_2: PHI_SQ } = require('../../temporal');

// =============================================================================
// ATZILUT WORLD
// =============================================================================

class Atzilut extends World {
  constructor() {
    super('ATZILUT', 'PHI', {
      description: 'World of Emanation - The realm of divine proportion',
      hebrewName: 'אצילות',
    });

    this._registerDimensions();
  }

  /**
   * Register all dimensions belonging to ATZILUT
   */
  _registerDimensions() {
    // PRIMARY dimensions (weight: φ²)
    this.registerDimension('HARMONY', {
      category: 'PRIMARY',
      threshold: 60,
      weight: PHI_SQ,
    });

    this.registerDimension('COHERENCE', {
      category: 'PRIMARY',
      threshold: 70,
      weight: PHI_SQ,
    });

    // SECONDARY dimensions (weight: φ)
    this.registerDimension('SIMPLIFY', {
      category: 'SECONDARY',
      threshold: 60,
      weight: PHI,
    });

    // META dimensions (weight: 1.0)
    this.registerDimension('SELF_AWARENESS', {
      category: 'META',
      threshold: 50,
      weight: 1.0,
    });

    // HUMAN_LLM dimensions (weight: φ)
    this.registerDimension('MEMORY', {
      category: 'HUMAN_LLM',
      threshold: 60,
      weight: PHI,
    });

    this.registerDimension('TEACHING', {
      category: 'HUMAN_LLM',
      threshold: 50,
      weight: PHI,
    });
  }

  // ===========================================================================
  // ATZILUT-SPECIFIC METHODS
  // ===========================================================================

  /**
   * Check φ-alignment of this world's scores
   * ATZILUT should embody φ in its very structure
   */
  checkPhiAlignment() {
    const scores = Object.values(this.scores);
    if (scores.length < 2) return { aligned: true, ratio: null };

    // Sort scores
    const sorted = scores.map(s => s.value).sort((a, b) => b - a);

    // Check if successive ratios approximate φ
    const ratios = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] > 0) {
        ratios.push(sorted[i] / sorted[i + 1]);
      }
    }

    // Average ratio should be close to φ
    const avgRatio = ratios.length > 0
      ? ratios.reduce((a, b) => a + b, 0) / ratios.length
      : 1;

    const deviation = Math.abs(avgRatio - PHI);
    const aligned = deviation < 0.382; // Within φ⁻² tolerance

    return {
      aligned,
      avgRatio,
      targetRatio: PHI,
      deviation,
      ratios,
    };
  }

  /**
   * Get essence of ATZILUT
   */
  getEssence() {
    return {
      world: this.name,
      hebrewName: this.hebrewName,
      axiom: this.axiom,
      principle: 'Divine Proportion',
      question: 'Does it embody φ?',
      check: '1.618 in all ratios',
      phiAlignment: this.checkPhiAlignment(),
      ...this.evaluateCoherence(),
    };
  }
}

// =============================================================================
// SINGLETON + EXPORTS
// =============================================================================

const atzilut = new Atzilut();

module.exports = {
  Atzilut,
  atzilut,

  // World info
  name: 'ATZILUT',
  axiom: 'PHI',
  hebrewName: 'אצילות',

  // Convenience
  recordScore: (dim, score, meta) => atzilut.recordScore(dim, score, meta),
  evaluateCoherence: () => atzilut.evaluateCoherence(),
  getEssence: () => atzilut.getEssence(),
  reset: () => atzilut.reset(),
};
