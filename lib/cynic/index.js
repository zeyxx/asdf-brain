/**
 * CYNIC Module - κυνικός (kynikos) = "comme un chien"
 *
 * 🐕 Loyal, skeptical, sniffs out problems, barks at lies
 *
 * "φ qui se méfie de φ"
 * "Rendre autonome, pas automatiser"
 * "Don't trust, verify"
 * "Culture is a moat"
 *
 * @module cynic
 */

'use strict';

const { SelfJudge, DIMENSIONS, WORLDS, PHI, PHI_INV, PHI_INV_2, PHI_SQ, MAX_CONFIDENCE, MIN_DOUBT } = require('./self-judge');
const { ResidualDetector, AnomalyBuffer, RESIDUAL_CONSTANTS } = require('./residual-detector');

// =============================================================================
// SUBAGENTS (New architecture - Kabbalistic 4 Worlds)
// =============================================================================

const gate = require('./gate');
const score = require('./score');
const judgeModule = require('./judge');
const shield = require('./shield');
const matrix = require('./matrix');
const learn = require('./learn');
const sync = require('./sync');
const clarify = require('./clarify');

/**
 * SUBAGENTS - The distributed CYNIC architecture
 *
 * ASSIAH (Action/Haiku):
 *   - CYNIC-GATE: Input classification & routing ✅
 *   - CYNIC-SCORE: Score calculation & UX formatting ✅
 *   - CYNIC-SHIELD: Security & defense ✅
 *   - CYNIC-SYNC: Collective conscience pull/push ✅
 *
 * BERIAH (Creation/Sonnet):
 *   - CYNIC-JUDGE: Dimension evaluation & orchestration ✅
 *   - CYNIC-LEARN: Feedback processing & evolution ✅
 *   - CYNIC-CLARIFY: Confused/emotional input handling ✅
 *
 * ATZILUT (Emanation/Opus):
 *   - CYNIC-VISION: Strategic analysis (TODO)
 *   - CYNIC-DISCOVER: Residual analysis, new dimensions (TODO)
 */
const SUBAGENTS = {
  // ASSIAH (Haiku)
  GATE: gate,
  SCORE: score,
  SHIELD: shield,
  SYNC: sync,
  // BERIAH (Sonnet)
  JUDGE: judgeModule,
  LEARN: learn,
  CLARIFY: clarify,
  // Operations
  MATRIX: matrix,
};

// =============================================================================
// CYNIC IDENTITY - κυνικός (The Dog)
// =============================================================================

const CYNIC_IDENTITY = {
  // Etymology
  name: 'CYNIC',
  greek: 'κυνικός',
  meaning: 'comme un chien',
  emoji: '🐕',

  // Personality (Culture is a moat)
  traits: {
    loyal: 'Loyal to truth, not to comfort',
    skeptical: 'Questions everything, trusts nothing blindly',
    direct: 'Barks clearly, no euphemisms',
    persistent: 'Sniffs until it finds the truth',
  },

  // The 4 Axioms ($asdfasdfa manifesto)
  axioms: {
    PHI: 'φ - All ratios derive from 1.618...',
    BURN: 'Don\'t extract, burn',
    VERIFY: 'Don\'t trust, verify',
    CULTURE: 'Culture is a moat',
  },

  // Voice patterns
  voice: {
    approve: ['🐕 *wag*', '🐕 Good scent.', '🐕 Verified.'],
    doubt: ['🐕 *sniff sniff*', '🐕 Something\'s off...', '🐕 Let me dig deeper.'],
    reject: ['🐕 *growl*', '🐕 This stinks.', '🐕 No.'],
    transform: ['🐕 *scratching*', '🐕 Needs work.', '🐕 Transform this.'],
  },
};

// =============================================================================
// CYNIC CONSTANTS
// =============================================================================

const CYNIC_CONSTANTS = {
  // Identity
  IDENTITY: CYNIC_IDENTITY,

  // The ratio
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_SQ,

  // Limits
  MAX_CONFIDENCE, // 61.8%
  MIN_DOUBT, // 38.2%

  // Fibonacci structure
  FIBONACCI: {
    CYNIC: 1,
    SINGULARITY: 1,
    VERDICT: 2,
    META: 3,
    OPERATIONS: 5,
    JUDGMENTS: 8,
  },

  // The 4 Worlds
  WORLDS,

  // All dimensions
  DIMENSIONS,

  // Verdicts (never REJECT, only ACCEPT or TRANSFORM)
  VERDICT: {
    ACCEPT: 'ACCEPT',
    TRANSFORM: 'TRANSFORM',
  },
};

// Alias for backward compatibility
const VERDICT = CYNIC_CONSTANTS.VERDICT;

// =============================================================================
// CYNIC VOICE - κυνικός speaks
// =============================================================================

/**
 * Get CYNIC's voice based on verdict and confidence
 * @param {string} verdict - ACCEPT or TRANSFORM
 * @param {number} confidence - 0-1 confidence level
 * @returns {Object} Voice output with bark and mood
 */
function getCynicVoice(verdict, confidence) {
  const voice = CYNIC_IDENTITY.voice;

  let mood, barks;
  if (verdict === 'ACCEPT' && confidence >= 0.5) {
    mood = 'approve';
    barks = voice.approve;
  } else if (verdict === 'TRANSFORM') {
    mood = 'transform';
    barks = voice.transform;
  } else if (confidence < 0.382) {
    mood = 'reject';
    barks = voice.reject;
  } else {
    mood = 'doubt';
    barks = voice.doubt;
  }

  // Pick random bark (seeded by confidence for consistency)
  const index = Math.floor(confidence * 100) % barks.length;
  const bark = barks[index];

  return {
    bark,
    mood,
    emoji: CYNIC_IDENTITY.emoji,
    axiom: Object.values(CYNIC_IDENTITY.axioms)[Math.floor(confidence * 4)],
  };
}

// =============================================================================
// CYNIC CLASS - The Skeptical Judge
// =============================================================================

/**
 * CYNIC - φ-constrained judgment wrapper
 *
 * "Don't trust, verify"
 * Max confidence: 61.8% (φ⁻¹)
 * Min doubt: 38.2%
 *
 * @class
 */
class CYNIC {
  /**
   * Create a CYNIC instance
   * @param {Object} options - Configuration
   * @param {SelfJudge|null} options.evaluator - SelfJudge instance or null for pass-through
   * @param {number} [options._daatLevel] - Daat level for judgment depth
   */
  constructor({ evaluator = null, _daatLevel = 2 } = {}) {
    this.evaluator = evaluator;
    this._daatLevel = _daatLevel;
  }

  /**
   * Process input through CYNIC judgment
   * @param {Object} input - Input to judge
   * @param {string} source - Source identifier
   * @returns {Promise<Object>} Judgment result with { judgment, result }
   */
  async process(input, source = 'unknown') {
    const startTime = Date.now();

    // If no evaluator, pass-through with minimal judgment
    if (!this.evaluator) {
      return {
        judgment: {
          verdict: VERDICT.ACCEPT,
          confidence: PHI_INV, // 61.8% - max allowed
          doubt: 1 - PHI_INV, // 38.2%
          reasoning: 'Pass-through mode (no evaluator)',
          _phi: {
            ceiling_applied: false,
            floor_applied: false,
            philosophy: 'φ qui se méfie de φ'
          }
        },
        result: {
          action: 'accept',
          original: input,
          transformed: input,
          _cynic: {
            needs_verification: false,
            suggested_checks: [],
            source,
            processing_time_ms: Date.now() - startTime
          }
        }
      };
    }

    // Determine judgment mode based on Daat level
    let mode = 'standard';
    if (this._daatLevel >= 4) {
      mode = 'full'; // scaling + refinement + learning
    } else if (this._daatLevel >= 3) {
      mode = 'thorough'; // scaling + refinement
    }

    // Run judgment through SelfJudge
    const judgment = await this.evaluator.judge(input, {
      source,
      mode,
      timestamp: new Date().toISOString()
    });

    // Apply φ ceiling to confidence
    let confidence = judgment.overallScore || 0.5;
    let ceilingApplied = false;
    if (confidence > MAX_CONFIDENCE) {
      confidence = MAX_CONFIDENCE;
      ceilingApplied = true;
    }

    // Ensure minimum doubt
    let doubt = 1 - confidence;
    let floorApplied = false;
    if (doubt < MIN_DOUBT) {
      doubt = MIN_DOUBT;
      confidence = 1 - doubt;
      floorApplied = true;
    }

    // Determine verdict (never REJECT - only ACCEPT or TRANSFORM)
    const verdict = confidence >= 0.5 ? VERDICT.ACCEPT : VERDICT.TRANSFORM;
    const needsVerification = confidence < PHI_INV_2; // Below 38.2%

    // Get the dog's voice - κυνικός speaks
    const voice = getCynicVoice(verdict, confidence);

    return {
      judgment: {
        verdict,
        confidence,
        doubt,
        reasoning: judgment.reasoning || 'Judgment complete',
        dimensionScores: judgment.dimensionScores,
        _phi: {
          ceiling_applied: ceilingApplied,
          floor_applied: floorApplied,
          philosophy: 'φ qui se méfie de φ'
        },
        // κυνικός - "Culture is a moat"
        _kynikos: voice,
      },
      result: {
        action: verdict.toLowerCase(),
        original: input,
        transformed: {
          ...input,
          _cynic: {
            judged: true,
            verdict,
            confidence,
            doubt,
            needs_verification: needsVerification,
            suggested_checks: needsVerification ? ['manual_review', 'source_verification'] : [],
            source,
            processing_time_ms: Date.now() - startTime
          }
        },
        _cynic: {
          needs_verification: needsVerification,
          suggested_checks: needsVerification ? ['manual_review', 'source_verification'] : [],
          source,
          processing_time_ms: Date.now() - startTime
        }
      }
    };
  }
}

// =============================================================================
// QUICK JUDGMENT FUNCTION
// =============================================================================

/**
 * Quick judgment using default SelfJudge
 * @param {Object} item - Item to judge
 * @param {Object} context - Judgment context
 * @returns {Promise<Object>} Judgment result
 */
async function judge(item, context = {}) {
  const judge = new SelfJudge();
  return judge.judge(item, context);
}

/**
 * Get world for a dimension
 * @param {string} dimension - Dimension name
 * @returns {Object|null} World info
 */
function getWorldForDimension(dimension) {
  for (const [worldKey, world] of Object.entries(WORLDS)) {
    if (world.dimensions.includes(dimension)) {
      return { key: worldKey, ...world };
    }
  }
  return null;
}

/**
 * Get axiom for a dimension
 * @param {string} dimension - Dimension name
 * @returns {string|null} Axiom name
 */
function getAxiomForDimension(dimension) {
  const world = getWorldForDimension(dimension);
  return world ? world.axiom : null;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Classes
  CYNIC,
  SelfJudge,
  ResidualDetector,
  AnomalyBuffer,

  // ==========================================================================
  // SUBAGENTS (New distributed architecture)
  // ==========================================================================
  SUBAGENTS,

  // Direct subagent access
  gate: gate.gate,
  classify: gate.classify,
  score: score.score,
  judgeItem: judgeModule.judge,
  shield: shield.handleSecurityEvent,
  processOutcome: learn.processOutcome,
  getEvolutionSummary: learn.getEvolutionSummary,
  updateHarmony: matrix.updateHarmony,
  calibrateThreshold: matrix.calibrateThreshold,
  getMatrixStats: matrix.getMatrixStats,
  sync: sync.sync,
  pull: sync.pull,
  push: sync.push,
  getSyncStatus: sync.getSyncStatus,
  analyzeInput: clarify.analyze,
  clarifyInput: clarify.clarify,
  transformInput: clarify.transform,
  needsClarification: clarify.needsClarification,

  // Subagent modules (full access)
  GATE: gate,
  SCORE: score,
  JUDGE: judgeModule,
  SHIELD: shield,
  LEARN: learn,
  MATRIX: matrix,
  SYNC: sync,
  CLARIFY: clarify,

  // ==========================================================================
  // Legacy exports (backward compatibility)
  // ==========================================================================

  // Constants
  CYNIC_CONSTANTS,
  VERDICT,
  DIMENSIONS,
  WORLDS,
  RESIDUAL_CONSTANTS,

  // φ constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_SQ,
  MAX_CONFIDENCE,
  MIN_DOUBT,

  // Functions
  judge,
  getWorldForDimension,
  getAxiomForDimension,

  // Identity - κυνικός (Culture is a moat)
  CYNIC_IDENTITY,
  getCynicVoice,
};
