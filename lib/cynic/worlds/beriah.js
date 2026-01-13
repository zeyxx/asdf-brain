/**
 * BERIAH - World of Creation
 *
 * בריאה - The world of intellect and verification
 * Axiom: VERIFY - Don't trust, verify
 *
 * Dimensions:
 * - TRUTH (PRIMARY)        - Factual accuracy
 * - INTEGRITY (PRIMARY)    - Structural soundness
 * - SECURE (SECONDARY)     - Security posture
 * - PRIVATE (SECONDARY)    - Privacy protection
 * - LEARNING_RATE (META)   - Adaptation speed
 * - INTENT (HUMAN_LLM)     - Purpose detection
 * - TRUST (HUMAN_LLM)      - Trust calibration
 *
 * "In BERIAH, nothing is accepted without proof."
 */

'use strict';

const { World } = require('./base');
const { PHI, PHI_2: PHI_SQ } = require('../../temporal');

// =============================================================================
// BERIAH WORLD
// =============================================================================

class Beriah extends World {
  constructor() {
    super('BERIAH', 'VERIFY', {
      description: 'World of Creation - The realm of intellectual verification',
      hebrewName: 'בריאה',
    });

    this._registerDimensions();
  }

  /**
   * Register all dimensions belonging to BERIAH
   */
  _registerDimensions() {
    // PRIMARY dimensions (weight: φ²)
    this.registerDimension('TRUTH', {
      category: 'PRIMARY',
      threshold: 70,
      weight: PHI_SQ,
    });

    this.registerDimension('INTEGRITY', {
      category: 'PRIMARY',
      threshold: 80,
      weight: PHI_SQ,
    });

    // SECONDARY dimensions (weight: φ)
    this.registerDimension('SECURE', {
      category: 'SECONDARY',
      threshold: 80,
      weight: PHI,
    });

    this.registerDimension('PRIVATE', {
      category: 'SECONDARY',
      threshold: 75,
      weight: PHI,
    });

    // META dimensions (weight: 1.0)
    this.registerDimension('LEARNING_RATE', {
      category: 'META',
      threshold: 40,
      weight: 1.0,
    });

    // HUMAN_LLM dimensions (weight: φ)
    this.registerDimension('INTENT', {
      category: 'HUMAN_LLM',
      threshold: 70,
      weight: PHI,
    });

    this.registerDimension('TRUST', {
      category: 'HUMAN_LLM',
      threshold: 65,
      weight: PHI,
    });
  }

  // ===========================================================================
  // BERIAH-SPECIFIC METHODS
  // ===========================================================================

  /**
   * Calculate verification score
   * BERIAH's core function is verification - aggregate all verify-related dimensions
   */
  getVerificationScore() {
    const verifyDimensions = ['TRUTH', 'INTEGRITY', 'SECURE', 'PRIVATE'];
    let totalScore = 0;
    let totalWeight = 0;
    let verified = 0;

    for (const dim of verifyDimensions) {
      const score = this.scores[dim];
      if (score) {
        const dimConfig = this.dimensions.get(dim);
        totalScore += score.value * dimConfig.weight;
        totalWeight += dimConfig.weight;
        if (score.passed) verified++;
      }
    }

    const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const verificationRate = verifyDimensions.length > 0
      ? verified / verifyDimensions.length
      : 0;

    return {
      score: avgScore,
      verificationRate,
      verified,
      total: verifyDimensions.length,
      passed: verificationRate >= 0.75, // 3/4 must pass
    };
  }

  /**
   * Check if something is cryptographically verifiable
   * @param {Object} item - Item to check
   */
  isVerifiable(item) {
    if (!item) return { verifiable: false, reason: 'No item provided' };

    const checks = {
      hasHash: !!item.hash || !!item.signature || !!item.merkleProof,
      hasTimestamp: !!item.timestamp || !!item.createdAt,
      hasSource: !!item.source || !!item.author || !!item.origin,
      hasIntegrity: !!item.checksum || !!item.digest,
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const verifiable = passedChecks >= 2; // At least 2 verification markers

    return {
      verifiable,
      checks,
      passedChecks,
      requiredChecks: 2,
      recommendation: verifiable
        ? 'Item can be verified'
        : 'Add hash/signature for verification',
    };
  }

  /**
   * Get essence of BERIAH
   */
  getEssence() {
    return {
      world: this.name,
      hebrewName: this.hebrewName,
      axiom: this.axiom,
      principle: 'Cryptographic Verification',
      question: 'Can it be verified?',
      check: 'Hash, signature, proof',
      verification: this.getVerificationScore(),
      ...this.evaluateCoherence(),
    };
  }
}

// =============================================================================
// SINGLETON + EXPORTS
// =============================================================================

const beriah = new Beriah();

module.exports = {
  Beriah,
  beriah,

  // World info
  name: 'BERIAH',
  axiom: 'VERIFY',
  hebrewName: 'בריאה',

  // Convenience
  recordScore: (dim, score, meta) => beriah.recordScore(dim, score, meta),
  evaluateCoherence: () => beriah.evaluateCoherence(),
  getEssence: () => beriah.getEssence(),
  isVerifiable: (item) => beriah.isVerifiable(item),
  reset: () => beriah.reset(),
};
