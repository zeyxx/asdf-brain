/**
 * CYNIC Self-Judge
 *
 * "φ qui se méfie de φ"
 * "Rendre autonome, pas automatiser"
 *
 * Architecture: 4 Mondes × Fibonacci (3 + 5 + 8 = 16 dimensions)
 *
 * @see /knowledge/architecture/CYNIC_ARCHITECTURE.md
 */

'use strict';

const { PHI, PHI_2: PHI_SQ, PHI_INV, PHI_INV_2 } = require('../temporal');

// CYNIC limits
const MAX_CONFIDENCE = PHI_INV; // 61.8% - never exceed
const MIN_DOUBT = PHI_INV_2; // 38.2% - always maintain (space for human)

// =============================================================================
// THE 4 WORLDS (Kabbalistic mapping to axioms)
// =============================================================================

const WORLDS = {
  ATZILUT: {
    name: 'Atzilut',
    meaning: 'Emanation',
    axiom: 'PHI',
    mode: 'SENSE', // CYNIC senses the ratio
    question: 'Is it harmonious with the universal ratio?',
    dimensions: ['HARMONY', 'COHERENCE'],
  },
  BERIAH: {
    name: 'Beriah',
    meaning: 'Creation',
    axiom: 'VERIFY',
    mode: 'THINK', // CYNIC thinks, verifies
    question: 'Is it verifiable? Can it be proven?',
    dimensions: ['TRUTH', 'INTEGRITY'],
  },
  YETZIRAH: {
    name: 'Yetzirah',
    meaning: 'Formation',
    axiom: 'CULTURE',
    mode: 'FEEL', // CYNIC feels values
    question: 'Is it aligned with our values?',
    dimensions: ['ETHICS', 'OPTIMISM'],
  },
  ASSIAH: {
    name: 'Assiah',
    meaning: 'Action',
    axiom: 'BURN',
    mode: 'ACT', // CYNIC acts (but suggests, doesn't decide)
    question: 'Does it converge toward singularity?',
    dimensions: ['ALIGNMENT', 'PROGRESS'],
  },
};

// =============================================================================
// FIBONACCI STRUCTURE (1, 1, 2, 3, 5, 8)
// =============================================================================

const DIMENSIONS = {
  // -------------------------------------------------------------------------
  // PRIMARY: 8 Judgments (2 per world/axiom) - Weight: φ²
  // -------------------------------------------------------------------------
  PRIMARY: {
    weight: PHI_SQ,

    // ATZILUT / φ
    HARMONY: {
      world: 'ATZILUT',
      axiom: 'PHI',
      question: "L'équilibre φ est-il respecté?",
      threshold: 60,
    },
    COHERENCE: {
      world: 'ATZILUT',
      axiom: 'PHI',
      question: 'Is it coherent with the whole?',
      threshold: 70,
    },

    // BERIAH / VERIFY
    TRUTH: {
      world: 'BERIAH',
      axiom: 'VERIFY',
      question: 'Is it verifiable and reproducible?',
      threshold: 70,
    },
    INTEGRITY: {
      world: 'BERIAH',
      axiom: 'VERIFY',
      question: 'Is it tamper-proof and signed?',
      threshold: 80,
    },

    // YETZIRAH / CULTURE
    ETHICS: {
      world: 'YETZIRAH',
      axiom: 'CULTURE',
      question: 'Respecte-t-il les valeurs cypherpunk?',
      threshold: 75,
    },
    OPTIMISM: {
      world: 'YETZIRAH',
      axiom: 'CULTURE',
      question: 'Construit-il vers le positif?',
      threshold: 50,
    },

    // ASSIAH / BURN
    ALIGNMENT: {
      world: 'ASSIAH',
      axiom: 'BURN',
      question: 'Are incentives aligned?',
      threshold: 70,
    },
    PROGRESS: {
      world: 'ASSIAH',
      axiom: 'BURN',
      question: 'Does it advance toward singularity?',
      threshold: 50,
    },
  },

  // -------------------------------------------------------------------------
  // SECONDARY: 5 Operations (how CYNIC serves humans) - Weight: φ
  // -------------------------------------------------------------------------
  SECONDARY: {
    weight: PHI,

    SECURE: {
      purpose: 'Protect without imprisoning',
      antiPattern: 'Total surveillance',
      threshold: 85,
    },
    PRIVATE: {
      purpose: 'Respect without hiding',
      antiPattern: 'Forced transparency',
      threshold: 90, // Critical - cypherpunk value
    },
    SCALE: {
      purpose: 'Grow without dominating',
      antiPattern: 'Monopoly',
      threshold: 50,
    },
    SIMPLIFY: {
      purpose: 'Clarify without reducing',
      antiPattern: 'Obscurantism',
      threshold: 60,
    },
    ENABLE: {
      purpose: 'Enable autonomy, don\'t automate',
      antiPattern: 'Human replacement',
      threshold: 70, // Key mission
    },
  },

  // -------------------------------------------------------------------------
  // META: 3 Self-Awareness - Weight: 1.0
  // -------------------------------------------------------------------------
  META: {
    weight: 1.0,

    SELF_AWARENESS: {
      question: 'Je sais ce que je ne sais pas',
      threshold: 50,
    },
    LEARNING_RATE: {
      question: "J'apprends de mes erreurs",
      threshold: 50,
    },
    SINGULARITY_DISTANCE: {
      question: 'Je mesure ma distance au but',
      threshold: 30, // Always far from singularity
    },
  },
};

// =============================================================================
// SELF-JUDGE CLASS
// =============================================================================

class SelfJudge {
  constructor(options = {}) {
    this.dimensions = DIMENSIONS;
    this.worlds = WORLDS;
    this.maxConfidence = MAX_CONFIDENCE;
    this.minDoubt = MIN_DOUBT;
    this.logger = options.logger || console;
  }

  // ---------------------------------------------------------------------------
  // Main judgment entry point
  // ---------------------------------------------------------------------------

  async judge(item, context = {}) {
    const startTime = Date.now();
    const scores = {};
    const reasons = {};
    const worldScores = {};

    // Traverse the 4 worlds
    for (const [worldKey, world] of Object.entries(this.worlds)) {
      worldScores[worldKey] = {
        world: world.name,
        axiom: world.axiom,
        mode: world.mode,
        dimensions: {},
      };

      // Judge each dimension in this world
      for (const dimName of world.dimensions) {
        const result = await this._judgeDimension(dimName, item, context);
        scores[dimName] = result.score;
        reasons[dimName] = result.reason;
        worldScores[worldKey].dimensions[dimName] = result;
      }

      // Calculate world score (geometric mean of its dimensions)
      const dimScores = Object.values(worldScores[worldKey].dimensions).map(d => d.score);
      worldScores[worldKey].score = this._geometricMean(dimScores);
    }

    // Judge SECONDARY dimensions
    for (const [dimName, config] of Object.entries(this.dimensions.SECONDARY)) {
      if (dimName === 'weight') continue;
      const result = await this._judgeSecondary(dimName, item, context);
      scores[dimName] = result.score;
      reasons[dimName] = result.reason;
    }

    // Judge META dimensions
    for (const [dimName, config] of Object.entries(this.dimensions.META)) {
      if (dimName === 'weight') continue;
      const result = await this._judgeMeta(dimName, item, context);
      scores[dimName] = result.score;
      reasons[dimName] = result.reason;
    }

    // Calculate global score (φ-weighted geometric mean)
    const globalScore = this._calculateGlobalScore(scores);

    // Determine verdict (never REJECT, only ACCEPT or TRANSFORM)
    const verdict = this._determineVerdict(scores, globalScore);

    // Calculate confidence (max 61.8%)
    const confidence = Math.min(globalScore / 100, this.maxConfidence);
    const doubt = 1 - confidence; // Always >= 38.2%

    const result = {
      scores,
      reasons,
      worlds: worldScores,
      global: globalScore,
      verdict,
      confidence: Math.round(confidence * 1000) / 10, // e.g., 61.8
      doubt: Math.round(doubt * 1000) / 10, // e.g., 38.2
      duration_ms: Date.now() - startTime,
      _cynic: {
        maxConfidence: this.maxConfidence,
        minDoubt: this.minDoubt,
        philosophy: 'Rendre autonome, pas automatiser',
      },
    };

    // Log judgment for learning
    await this._logJudgment(item, result);

    return result;
  }

  // ---------------------------------------------------------------------------
  // Dimension-specific judgment methods
  // ---------------------------------------------------------------------------

  async _judgeDimension(dimName, item, context) {
    const method = `_judge${dimName.charAt(0).toUpperCase() + dimName.slice(1).toLowerCase()}`;

    if (typeof this[method] === 'function') {
      return await this[method](item, context);
    }

    // Default judgment if no specific method
    return this._defaultJudgment(dimName, item, context);
  }

  async _judgeHarmony(item, context) {
    // Is it φ-balanced?
    const checks = [];

    // Check for φ-related values
    if (item.ratio !== undefined) {
      const deviation = Math.abs(item.ratio - PHI) / PHI;
      checks.push({ name: 'phi_ratio', score: Math.max(0, 100 - deviation * 100) });
    }

    // Check for balanced structure
    if (item.weights) {
      const isBalanced = this._checkPhiBalance(item.weights);
      checks.push({ name: 'balance', score: isBalanced ? 100 : 50 });
    }

    if (checks.length === 0) {
      return { score: 70, reason: 'No harmony metrics available' };
    }

    const score = this._average(checks.map(c => c.score));
    const reason = checks.filter(c => c.score < 70).map(c => `${c.name}: ${c.score}`).join(', ') || 'Harmonious';

    return { score: Math.round(score), reason };
  }

  async _judgeCoherence(item, context) {
    // Is it coherent with the ensemble?
    const checks = [];

    // Check internal consistency
    if (item.parts && Array.isArray(item.parts)) {
      const consistent = this._checkConsistency(item.parts);
      checks.push({ name: 'internal', score: consistent });
    }

    // Check against context
    if (context.existing) {
      const aligned = this._checkAlignment(item, context.existing);
      checks.push({ name: 'external', score: aligned });
    }

    if (checks.length === 0) {
      return { score: 75, reason: 'No coherence data' };
    }

    const score = this._average(checks.map(c => c.score));
    return { score: Math.round(score), reason: 'Coherence check' };
  }

  async _judgeTruth(item, context) {
    // Is it verifiable?
    const checks = [];

    // Has source?
    if (item.source) {
      checks.push({ name: 'source', score: 80 });
    } else {
      checks.push({ name: 'source', score: 30 });
    }

    // Is reproducible?
    if (item.reproducible === true) {
      checks.push({ name: 'reproducible', score: 100 });
    } else if (item.reproducible === false) {
      checks.push({ name: 'reproducible', score: 20 });
    }

    // Has proof?
    if (item.proof || item.signature) {
      checks.push({ name: 'proof', score: 100 });
    }

    const score = this._average(checks.map(c => c.score));
    const failures = checks.filter(c => c.score < 50);
    const reason = failures.length > 0
      ? failures.map(c => `${c.name} missing`).join(', ')
      : 'Verifiable';

    return { score: Math.round(score), reason };
  }

  async _judgeIntegrity(item, context) {
    // Is it tamper-proof?
    const checks = [];

    // Has signature?
    if (item.signature || item.sig) {
      checks.push({ name: 'signature', score: 100 });
    } else {
      checks.push({ name: 'signature', score: 0 });
    }

    // Has hash?
    if (item.hash || item.checksum) {
      checks.push({ name: 'hash', score: 100 });
    }

    // Has chaos_nonce?
    if (item.chaos_nonce) {
      checks.push({ name: 'chaos', score: 100 });
    }

    if (checks.length === 0) {
      return { score: 50, reason: 'No integrity markers' };
    }

    const score = this._average(checks.map(c => c.score));
    return { score: Math.round(score), reason: score >= 80 ? 'Tamper-proof' : 'Integrity partial' };
  }

  async _judgeEthics(item, context) {
    // Does it respect cypherpunk values?
    const checks = [];

    // Privacy respected?
    if (this._containsPII(item)) {
      checks.push({ name: 'privacy', score: 0 });
    } else {
      checks.push({ name: 'privacy', score: 100 });
    }

    // Open source?
    if (item.license === 'MIT' || item.openSource === true) {
      checks.push({ name: 'open', score: 100 });
    }

    // Decentralized?
    if (item.centralized === true) {
      checks.push({ name: 'decent', score: 30 });
    } else if (item.decentralized === true) {
      checks.push({ name: 'decent', score: 100 });
    }

    if (checks.length === 0) {
      return { score: 70, reason: 'No ethics data' };
    }

    const score = this._average(checks.map(c => c.score));
    const violations = checks.filter(c => c.score < 50);
    const reason = violations.length > 0
      ? violations.map(c => `${c.name} violation`).join(', ')
      : 'Ethics aligned';

    return { score: Math.round(score), reason };
  }

  async _judgeOptimism(item, context) {
    // Does it build toward the positive?
    let score = 50; // Neutral default
    let reason = 'Neutral';

    // Is it constructive?
    if (item.action === 'create' || item.action === 'improve' || item.action === 'build') {
      score += 30;
      reason = 'Constructive';
    }

    // Is it destructive in bad way?
    if (item.action === 'destroy' && item.target !== 'value') {
      score -= 30;
      reason = 'Destructive';
    }

    // BURN is positive destruction
    if (item.burn === true || item.action === 'burn') {
      score += 20;
      reason = 'Positive burn';
    }

    return { score: Math.max(0, Math.min(100, score)), reason };
  }

  async _judgeAlignment(item, context) {
    // Are incentives aligned?
    let score = 50;
    let reason = 'Unknown alignment';

    // Everyone benefits?
    if (item.beneficiaries === 'all' || item.aligned === true) {
      score = 90;
      reason = 'All stakeholders aligned';
    }

    // Extraction detected?
    if (item.extraction === true || item.skim === true) {
      score = 10;
      reason = 'Extraction detected - misaligned';
    }

    // Burns to singularity?
    if (item.burnDestination === 'singularity' || item.burnRate === 1.0) {
      score = 100;
      reason = 'Perfect burn alignment';
    }

    return { score, reason };
  }

  async _judgeProgress(item, context) {
    // Does it advance toward singularity?
    let score = 50;
    let reason = 'Neutral progress';

    // Contributes to burn?
    if (item.contributesBurn === true) {
      score += 30;
      reason = 'Advances burn';
    }

    // Increases adoption?
    if (item.adoption === 'increase') {
      score += 20;
      reason = 'Increases adoption';
    }

    // Stagnant?
    if (item.stagnant === true) {
      score -= 20;
      reason = 'Stagnant';
    }

    return { score: Math.max(0, Math.min(100, score)), reason };
  }

  // ---------------------------------------------------------------------------
  // SECONDARY dimension judgments
  // ---------------------------------------------------------------------------

  async _judgeSecondary(dimName, item, context) {
    const config = this.dimensions.SECONDARY[dimName];

    switch (dimName) {
      case 'SECURE':
        return this._judgeSecurity(item, context);
      case 'PRIVATE':
        return this._judgePrivacy(item, context);
      case 'SCALE':
        return { score: 70, reason: 'Scalability not measured' };
      case 'SIMPLIFY':
        return this._judgeSimplicity(item, context);
      case 'ENABLE':
        return this._judgeEnablement(item, context);
      default:
        return { score: 50, reason: 'Unknown secondary dimension' };
    }
  }

  async _judgeSecurity(item, context) {
    // Secure without imprisoning
    if (item.encrypted === true || item.secure === true) {
      return { score: 90, reason: 'Secured' };
    }
    if (item.publicData === true && !this._containsPII(item)) {
      return { score: 80, reason: 'Public non-sensitive' };
    }
    return { score: 60, reason: 'Security unknown' };
  }

  async _judgePrivacy(item, context) {
    // CRITICAL - cypherpunk value
    if (this._containsPII(item)) {
      return { score: 0, reason: 'PII detected - critical violation' };
    }
    if (item.operatorHash && !item.operatorName) {
      return { score: 100, reason: 'Properly anonymized' };
    }
    if (item.anonymous === true) {
      return { score: 100, reason: 'Anonymous' };
    }
    return { score: 70, reason: 'Privacy neutral' };
  }

  async _judgeSimplicity(item, context) {
    // Clarify without reducing
    if (item.complexity === 'high') {
      return { score: 40, reason: 'Too complex' };
    }
    if (item.complexity === 'low' || item.simple === true) {
      return { score: 90, reason: 'Simple and clear' };
    }
    return { score: 70, reason: 'Moderate complexity' };
  }

  async _judgeEnablement(item, context) {
    // KEY MISSION: Autonomize, don't automate
    if (item.replacesHuman === true) {
      return { score: 0, reason: 'VIOLATION: Replaces human' };
    }
    if (item.enablesHuman === true || item.autonomizes === true) {
      return { score: 100, reason: 'Enables human autonomy' };
    }
    if (item.assistsHuman === true) {
      return { score: 80, reason: 'Assists human' };
    }
    return { score: 60, reason: 'Enablement unclear' };
  }

  // ---------------------------------------------------------------------------
  // META dimension judgments
  // ---------------------------------------------------------------------------

  async _judgeMeta(dimName, item, context) {
    switch (dimName) {
      case 'SELF_AWARENESS':
        return this._judgeSelfAwareness(item, context);
      case 'LEARNING_RATE':
        return this._judgeLearningRate(item, context);
      case 'SINGULARITY_DISTANCE':
        return this._judgeSingularityDistance(item, context);
      default:
        return { score: 50, reason: 'Unknown meta dimension' };
    }
  }

  async _judgeSelfAwareness(item, context) {
    // Do I know what I don't know?
    const unknowns = context.unknowns || [];
    const acknowledged = context.acknowledged || [];

    if (unknowns.length > 0 && acknowledged.length >= unknowns.length) {
      return { score: 90, reason: 'Unknowns acknowledged' };
    }
    if (unknowns.length > acknowledged.length) {
      return { score: 50, reason: 'Some unknowns not acknowledged' };
    }
    return { score: 70, reason: 'Self-awareness neutral' };
  }

  async _judgeLearningRate(item, context) {
    // Am I learning from errors?
    const errors = context.pastErrors || 0;
    const corrections = context.corrections || 0;

    if (errors === 0) {
      return { score: 70, reason: 'No errors to learn from' };
    }

    const rate = corrections / errors;
    return {
      score: Math.round(rate * 100),
      reason: `Learning rate: ${Math.round(rate * 100)}%`,
    };
  }

  async _judgeSingularityDistance(item, context) {
    // How far am I from the goal?
    // This should always be > 0 (never reach singularity)
    const distance = context.singularityDistance || 0.5;

    // Score is inversely related to distance, but capped
    // We WANT some distance (human space)
    if (distance < 0.1) {
      return { score: 30, reason: 'Too close to singularity - need human space' };
    }
    if (distance > 0.8) {
      return { score: 40, reason: 'Far from singularity' };
    }

    // Sweet spot: 0.382 (φ⁻²) distance
    const idealDistance = PHI_INV_2;
    const deviation = Math.abs(distance - idealDistance);
    const score = Math.round((1 - deviation) * 100);

    return { score, reason: `Distance: ${Math.round(distance * 100)}%` };
  }

  // ---------------------------------------------------------------------------
  // Helper methods
  // ---------------------------------------------------------------------------

  _defaultJudgment(dimName, item, context) {
    return { score: 50, reason: `No specific judgment for ${dimName}` };
  }

  _calculateGlobalScore(scores) {
    let product = 1;
    let totalWeight = 0;

    // PRIMARY dimensions (weight: φ²)
    for (const dimName of Object.keys(this.dimensions.PRIMARY)) {
      if (dimName === 'weight') continue;
      const score = scores[dimName] || 50;
      const weight = this.dimensions.PRIMARY.weight;
      product *= Math.pow(score, weight);
      totalWeight += weight;
    }

    // SECONDARY dimensions (weight: φ)
    for (const dimName of Object.keys(this.dimensions.SECONDARY)) {
      if (dimName === 'weight') continue;
      const score = scores[dimName] || 50;
      const weight = this.dimensions.SECONDARY.weight;
      product *= Math.pow(score, weight);
      totalWeight += weight;
    }

    // META dimensions (weight: 1.0)
    for (const dimName of Object.keys(this.dimensions.META)) {
      if (dimName === 'weight') continue;
      const score = scores[dimName] || 50;
      const weight = this.dimensions.META.weight;
      product *= Math.pow(score, weight);
      totalWeight += weight;
    }

    return Math.round(Math.pow(product, 1 / totalWeight));
  }

  _determineVerdict(scores, globalScore) {
    // Check critical thresholds
    const criticalDims = ['PRIVATE', 'INTEGRITY', 'ETHICS'];
    for (const dim of criticalDims) {
      const threshold = this.dimensions.SECONDARY[dim]?.threshold ||
                       this.dimensions.PRIMARY[dim]?.threshold || 70;
      if (scores[dim] < threshold) {
        return {
          action: 'TRANSFORM',
          reason: `Critical dimension ${dim} below threshold (${scores[dim]} < ${threshold})`,
          blocking: dim,
        };
      }
    }

    // Check ENABLE - key mission
    if (scores.ENABLE < 50) {
      return {
        action: 'TRANSFORM',
        reason: 'Does not enable human autonomy',
        blocking: 'ENABLE',
      };
    }

    // Global threshold
    if (globalScore >= 70) {
      return { action: 'ACCEPT', reason: 'Sufficient quality' };
    }

    return { action: 'TRANSFORM', reason: 'Global score below threshold' };
  }

  _geometricMean(values) {
    if (values.length === 0) return 0;
    const product = values.reduce((a, b) => a * b, 1);
    return Math.round(Math.pow(product, 1 / values.length));
  }

  _average(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  _checkPhiBalance(weights) {
    // Check if weights follow φ ratios
    const sorted = Object.values(weights).sort((a, b) => b - a);
    if (sorted.length < 2) return true;

    for (let i = 0; i < sorted.length - 1; i++) {
      const ratio = sorted[i] / sorted[i + 1];
      if (Math.abs(ratio - PHI) < 0.2) {
        return true; // φ-balanced
      }
    }
    return false;
  }

  _checkConsistency(parts) {
    // Simple consistency check
    return 80; // Placeholder
  }

  _checkAlignment(item, existing) {
    // Check alignment with existing knowledge
    return 75; // Placeholder
  }

  _containsPII(item) {
    // Check for PII
    const piiFields = ['email', 'phone', 'address', 'ssn', 'password', 'operatorName'];
    for (const field of piiFields) {
      if (item[field] && typeof item[field] === 'string' && item[field].length > 0) {
        return true;
      }
    }
    return false;
  }

  async _logJudgment(item, result) {
    // Log for learning (implement storage later)
    if (this.logger && this.logger.debug) {
      this.logger.debug('CYNIC judgment:', {
        global: result.global,
        verdict: result.verdict.action,
        confidence: result.confidence,
      });
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  SelfJudge,
  DIMENSIONS,
  WORLDS,
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_SQ,
  MAX_CONFIDENCE,
  MIN_DOUBT,
};
