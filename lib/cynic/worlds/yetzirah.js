/**
 * YETZIRAH - World of Formation
 *
 * יצירה - The world of emotion and culture
 * Axiom: CULTURE - Culture is a moat
 *
 * Dimensions:
 * - ETHICS (PRIMARY)           - Moral alignment
 * - OPTIMISM (PRIMARY)         - Constructive outlook
 * - ENABLE (SECONDARY)         - Empowerment
 * - PROACTIVITY (HUMAN_LLM)    - Anticipatory action
 * - COMPLEMENTARITY (HUMAN_LLM) - Human-AI synergy
 *
 * "In YETZIRAH, we shape through culture and values."
 */

'use strict';

const { World } = require('./base');
const { PHI, PHI_2: PHI_SQ } = require('../../temporal');

// =============================================================================
// YETZIRAH WORLD
// =============================================================================

class Yetzirah extends World {
  constructor() {
    super('YETZIRAH', 'CULTURE', {
      description: 'World of Formation - The realm of emotional and cultural shaping',
      hebrewName: 'יצירה',
    });

    this._registerDimensions();
  }

  /**
   * Register all dimensions belonging to YETZIRAH
   */
  _registerDimensions() {
    // PRIMARY dimensions (weight: φ²)
    this.registerDimension('ETHICS', {
      category: 'PRIMARY',
      threshold: 75,
      weight: PHI_SQ,
    });

    this.registerDimension('OPTIMISM', {
      category: 'PRIMARY',
      threshold: 50,
      weight: PHI_SQ,
    });

    // SECONDARY dimensions (weight: φ)
    this.registerDimension('ENABLE', {
      category: 'SECONDARY',
      threshold: 70,
      weight: PHI,
    });

    // HUMAN_LLM dimensions (weight: φ)
    this.registerDimension('PROACTIVITY', {
      category: 'HUMAN_LLM',
      threshold: 50,
      weight: PHI,
    });

    this.registerDimension('COMPLEMENTARITY', {
      category: 'HUMAN_LLM',
      threshold: 60,
      weight: PHI,
    });
  }

  // ===========================================================================
  // YETZIRAH-SPECIFIC METHODS
  // ===========================================================================

  /**
   * Calculate cultural alignment score
   * YETZIRAH's core function is cultural shaping
   */
  getCulturalAlignment() {
    const cultureDimensions = ['ETHICS', 'OPTIMISM', 'ENABLE', 'COMPLEMENTARITY'];
    let totalScore = 0;
    let totalWeight = 0;
    let aligned = 0;

    for (const dim of cultureDimensions) {
      const score = this.scores[dim];
      if (score) {
        const dimConfig = this.dimensions.get(dim);
        totalScore += score.value * dimConfig.weight;
        totalWeight += dimConfig.weight;
        if (score.passed) aligned++;
      }
    }

    const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const alignmentRate = cultureDimensions.length > 0
      ? aligned / cultureDimensions.length
      : 0;

    return {
      score: avgScore,
      alignmentRate,
      aligned,
      total: cultureDimensions.length,
      culturallySound: alignmentRate >= 0.75,
    };
  }

  /**
   * Check if content respects cultural values
   * @param {Object} content - Content to evaluate
   */
  respectsCulture(content) {
    if (!content) return { respects: false, reason: 'No content provided' };

    const checks = {
      noHarm: !this._containsHarmfulPatterns(content),
      constructive: this._isConstructive(content),
      inclusive: !this._isExclusionary(content),
      authentic: this._isAuthentic(content),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const respects = passedChecks >= 3;

    return {
      respects,
      checks,
      passedChecks,
      requiredChecks: 3,
      culturalScore: (passedChecks / 4) * 100,
    };
  }

  /**
   * Check for harmful patterns
   */
  _containsHarmfulPatterns(content) {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const harmfulPatterns = [
      /exploit/i,
      /manipulate/i,
      /deceive/i,
      /scam/i,
      /rug\s*pull/i,
    ];
    return harmfulPatterns.some(p => p.test(text));
  }

  /**
   * Check if content is constructive
   */
  _isConstructive(content) {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const constructivePatterns = [
      /build/i,
      /create/i,
      /improve/i,
      /help/i,
      /enable/i,
      /support/i,
    ];
    return constructivePatterns.some(p => p.test(text));
  }

  /**
   * Check if content is exclusionary
   */
  _isExclusionary(content) {
    // Simplified check - in practice would be more sophisticated
    return false;
  }

  /**
   * Check if content is authentic
   */
  _isAuthentic(content) {
    if (!content) return false;
    // Has source, not anonymous, has context
    return !!(content.source || content.author || content.context);
  }

  /**
   * Get essence of YETZIRAH
   */
  getEssence() {
    return {
      world: this.name,
      hebrewName: this.hebrewName,
      axiom: this.axiom,
      principle: 'Cultural Moat',
      question: 'Does it respect the culture?',
      check: 'Ethics, values, community',
      cultural: this.getCulturalAlignment(),
      ...this.evaluateCoherence(),
    };
  }
}

// =============================================================================
// SINGLETON + EXPORTS
// =============================================================================

const yetzirah = new Yetzirah();

module.exports = {
  Yetzirah,
  yetzirah,

  // World info
  name: 'YETZIRAH',
  axiom: 'CULTURE',
  hebrewName: 'יצירה',

  // Convenience
  recordScore: (dim, score, meta) => yetzirah.recordScore(dim, score, meta),
  evaluateCoherence: () => yetzirah.evaluateCoherence(),
  getEssence: () => yetzirah.getEssence(),
  respectsCulture: (content) => yetzirah.respectsCulture(content),
  reset: () => yetzirah.reset(),
};
