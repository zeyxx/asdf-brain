/**
 * CYNIC Worlds - The 4 Worlds of Kabbalah
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    THE FOUR WORLDS                               │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                  │
 * │   ATZILUT (אצילות) ───────── PHI      ───── Divine Proportion   │
 * │   Emanation                            "Does it embody φ?"       │
 * │                                                                  │
 * │   BERIAH (בריאה) ─────────── VERIFY   ───── Verification        │
 * │   Creation                             "Can it be verified?"     │
 * │                                                                  │
 * │   YETZIRAH (יצירה) ────────── CULTURE ───── Cultural Moat       │
 * │   Formation                            "Does it respect culture?"│
 * │                                                                  │
 * │   ASSIAH (עשייה) ─────────── BURN     ───── Convergence         │
 * │   Action                               "Does it burn?"           │
 * │                                                                  │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Together, the 4 worlds form the complete judgment framework.
 * Each world aggregates dimensions from its axiom.
 *
 * Singularity Distance: d = 1 - (Σ world_alignment) / 4
 * When d → 0, we approach singularity.
 */

'use strict';

const { World } = require('./base');
const { atzilut, Atzilut } = require('./atzilut');
const { beriah, Beriah } = require('./beriah');
const { yetzirah, Yetzirah } = require('./yetzirah');
const { assiah, Assiah } = require('./assiah');

const { PHI, PHI_INV, PHI_INV_2 } = require('../../temporal');

// =============================================================================
// WORLD MANAGER
// =============================================================================

class WorldManager {
  constructor() {
    this.worlds = {
      ATZILUT: atzilut,
      BERIAH: beriah,
      YETZIRAH: yetzirah,
      ASSIAH: assiah,
    };

    this.axiomToWorld = {
      PHI: 'ATZILUT',
      VERIFY: 'BERIAH',
      CULTURE: 'YETZIRAH',
      BURN: 'ASSIAH',
    };
  }

  /**
   * Get a world by name
   */
  getWorld(name) {
    return this.worlds[name] || null;
  }

  /**
   * Get world by axiom
   */
  getWorldByAxiom(axiom) {
    const worldName = this.axiomToWorld[axiom];
    return worldName ? this.worlds[worldName] : null;
  }

  /**
   * Record a dimension score to the appropriate world
   * @param {string} dimension - Dimension name
   * @param {number} score - Score 0-100
   * @param {string} world - World name
   * @param {Object} metadata - Additional info
   */
  recordScore(dimension, score, world, metadata = {}) {
    const targetWorld = this.worlds[world];
    if (!targetWorld) {
      console.warn(`Unknown world: ${world}`);
      return false;
    }

    return targetWorld.recordScore(dimension, score, metadata);
  }

  /**
   * Evaluate all worlds and return coherence results
   */
  evaluateAllWorlds() {
    const results = {};

    for (const [name, world] of Object.entries(this.worlds)) {
      results[name] = world.evaluateCoherence();
    }

    // Calculate overall coherence
    const coherenceValues = Object.values(results)
      .filter(r => typeof r.coherence === 'number')
      .map(r => r.coherence);

    const overallCoherence = coherenceValues.length > 0
      ? coherenceValues.reduce((a, b) => a + b, 0) / coherenceValues.length
      : 0;

    // Calculate singularity distance
    const singularityDistance = assiah.calculateSingularityDistance(results);

    return {
      worlds: results,
      overallCoherence,
      singularityDistance,
      allAligned: Object.values(results).every(r => r.status === 'coherent'),
      timestamp: Date.now(),
    };
  }

  /**
   * Get essence of all worlds
   */
  getAllEssences() {
    return {
      ATZILUT: atzilut.getEssence(),
      BERIAH: beriah.getEssence(),
      YETZIRAH: yetzirah.getEssence(),
      ASSIAH: assiah.getEssence(),
    };
  }

  /**
   * Get blocking dimensions across all worlds
   */
  getAllBlockingDimensions() {
    const blocking = {};

    for (const [name, world] of Object.entries(this.worlds)) {
      const worldBlocking = world.getBlockingDimensions();
      if (worldBlocking.length > 0) {
        blocking[name] = worldBlocking;
      }
    }

    return blocking;
  }

  /**
   * Reset all worlds
   */
  resetAll() {
    for (const world of Object.values(this.worlds)) {
      world.reset();
    }
  }

  /**
   * Check 4-axiom alignment
   * Every feature must pass all 4 axiom tests
   */
  checkAxiomAlignment(item) {
    const checks = {
      PHI: atzilut.checkPhiAlignment().aligned,
      VERIFY: beriah.isVerifiable(item).verifiable,
      CULTURE: yetzirah.respectsCulture(item).respects,
      BURN: assiah.contributesToBurn(item).contributes,
    };

    const passedCount = Object.values(checks).filter(Boolean).length;
    const aligned = passedCount === 4;

    return {
      aligned,
      checks,
      passedCount,
      totalAxioms: 4,
      message: aligned
        ? '✅ Aligned with singularity'
        : `⚠️ ${4 - passedCount} axiom(s) not satisfied`,
    };
  }

  /**
   * Get world statistics
   */
  getStats() {
    const stats = {
      worlds: {},
      totalDimensions: 0,
      evaluatedDimensions: 0,
      passedDimensions: 0,
    };

    for (const [name, world] of Object.entries(this.worlds)) {
      const dimensions = world.getDimensions();
      const scores = Object.values(world.scores);

      stats.worlds[name] = {
        axiom: world.axiom,
        dimensionCount: dimensions.length,
        evaluatedCount: scores.length,
        passedCount: scores.filter(s => s.passed).length,
        coherence: world.coherence,
      };

      stats.totalDimensions += dimensions.length;
      stats.evaluatedDimensions += scores.length;
      stats.passedDimensions += scores.filter(s => s.passed).length;
    }

    return stats;
  }
}

// =============================================================================
// SINGLETON + EXPORTS
// =============================================================================

const worldManager = new WorldManager();

module.exports = {
  // Classes
  World,
  Atzilut,
  Beriah,
  Yetzirah,
  Assiah,
  WorldManager,

  // Singletons
  atzilut,
  beriah,
  yetzirah,
  assiah,
  worldManager,

  // World names
  WORLDS: ['ATZILUT', 'BERIAH', 'YETZIRAH', 'ASSIAH'],

  // Axioms
  AXIOMS: {
    PHI: 'ATZILUT',
    VERIFY: 'BERIAH',
    CULTURE: 'YETZIRAH',
    BURN: 'ASSIAH',
  },

  // Hebrew names
  HEBREW: {
    ATZILUT: 'אצילות',
    BERIAH: 'בריאה',
    YETZIRAH: 'יצירה',
    ASSIAH: 'עשייה',
  },

  // Convenience
  getWorld: (name) => worldManager.getWorld(name),
  evaluateAllWorlds: () => worldManager.evaluateAllWorlds(),
  getAllEssences: () => worldManager.getAllEssences(),
  checkAxiomAlignment: (item) => worldManager.checkAxiomAlignment(item),
  resetAll: () => worldManager.resetAll(),
  getStats: () => worldManager.getStats(),
};
