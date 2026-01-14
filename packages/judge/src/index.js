/**
 * CYNIC-JUDGE - Judgment Orchestrator Package
 *
 * World: BERIAH (Creation)
 * Model: Sonnet (balanced quality/speed)
 * Latency Target: <2s
 *
 * "Le juge qui doute de lui-même"
 *
 * This package orchestrates judgment operations:
 * - Gate: Input classification & security
 * - Scaling: Inference-time compute scaling
 * - Matrix: W/H/T matrix operations
 * - Learn: Feedback processing & evolution
 *
 * @module @asdf/cynic-judge
 * @philosophy L2: Douter de soi (φ⁻² minimum doubt always)
 */

'use strict';

// =============================================================================
// MODULE IMPORTS
// =============================================================================

const gate = require('./gate');
const scaling = require('./scaling');
const matrix = require('./matrix');
const learn = require('./learn');

// Use relative path until pnpm workspace is linked
const { PHI, PHI_INV, PHI_INV_2, MAX_CONFIDENCE, MIN_DOUBT } = require('../../core/src/axioms/constants');
const { score, DIMENSIONS: SCORE_DIMENSIONS, calculateTechnicalDepth } = require('../../core/src/scoring/score');

// =============================================================================
// DEPENDENCY INJECTION
// =============================================================================

/**
 * External dependencies - override via configure()
 */
let deps = {
  getRouting: (routeName) => ({ name: routeName, model: 'sonnet' }),
  SelfJudge: null,         // Optional: provide SelfJudge class
  ResidualDetector: null,  // Optional: provide ResidualDetector class
};

/**
 * Configure external dependencies
 * @param {Object} config - { getRouting, SelfJudge, ResidualDetector, matrixDir, learningDir }
 */
function configure(config = {}) {
  if (config.getRouting) deps.getRouting = config.getRouting;
  if (config.SelfJudge) deps.SelfJudge = config.SelfJudge;
  if (config.ResidualDetector) deps.ResidualDetector = config.ResidualDetector;

  // Configure sub-modules
  if (config.getRouting) gate.configure({ getRouting: config.getRouting });
  if (config.matrixDir) matrix.configure({ matrixDir: config.matrixDir });
  if (config.learningDir) learn.configure({ learningDir: config.learningDir });
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

let selfJudgeInstance = null;
let residualDetectorInstance = null;

function getSelfJudge() {
  if (!selfJudgeInstance && deps.SelfJudge) {
    selfJudgeInstance = new deps.SelfJudge();
  }
  return selfJudgeInstance;
}

function getResidualDetector() {
  if (!residualDetectorInstance && deps.ResidualDetector) {
    residualDetectorInstance = new deps.ResidualDetector();
  }
  return residualDetectorInstance;
}

// =============================================================================
// JUDGMENT MODES
// =============================================================================

/**
 * Judgment modes with dimension selection
 * More dimensions = more thorough = more latency
 */
const JUDGMENT_MODES = {
  quick: {
    description: 'Fast check - 8 PRIMARY dimensions only',
    dimensions: ['HARMONY', 'COHERENCE', 'TRUTH', 'INTEGRITY', 'ETHICS', 'OPTIMISM', 'ALIGNMENT', 'PROGRESS'],
    targetLatencyMs: 200,
    model: 'haiku',
  },
  standard: {
    description: 'Normal judgment - PRIMARY + SECONDARY (13 dimensions)',
    dimensions: [
      'HARMONY', 'COHERENCE', 'TRUTH', 'INTEGRITY', 'ETHICS', 'OPTIMISM', 'ALIGNMENT', 'PROGRESS',
      'SECURE', 'PRIVATE', 'SCALE', 'SIMPLIFY', 'ENABLE',
    ],
    targetLatencyMs: 500,
    model: 'sonnet',
  },
  thorough: {
    description: 'Deep judgment - All 25 dimensions',
    dimensions: Object.keys(SCORE_DIMENSIONS),
    targetLatencyMs: 1000,
    model: 'sonnet',
  },
  full: {
    description: 'Complete cycle with learning + refinement',
    dimensions: Object.keys(SCORE_DIMENSIONS),
    targetLatencyMs: 2000,
    model: 'sonnet',
    includeRefinement: true,
    includeLearning: true,
  },
};

// =============================================================================
// ITEM PARSING
// =============================================================================

/**
 * Parse item to judge from various input formats
 *
 * @param {*} input - String, object, or structured item
 * @returns {Object} - Normalized item { type, content, metadata }
 */
function parseItem(input) {
  // Already structured
  if (input && typeof input === 'object' && input.type) {
    return {
      type: input.type,
      content: input.content || input.value || JSON.stringify(input),
      metadata: input.metadata || {},
      raw: input,
    };
  }

  // String input - try to detect type
  if (typeof input === 'string') {
    const trimmed = input.trim();

    // Code detection
    if (trimmed.includes('function') || trimmed.includes('=>') ||
        trimmed.includes('const ') || trimmed.includes('class ')) {
      return { type: 'code', content: trimmed, metadata: { language: 'javascript' }, raw: input };
    }

    // Decision detection
    if (trimmed.toLowerCase().includes('should') ||
        trimmed.toLowerCase().includes('decide') ||
        trimmed.toLowerCase().includes('choice')) {
      return { type: 'decision', content: trimmed, metadata: {}, raw: input };
    }

    // Pattern detection
    if (trimmed.toLowerCase().includes('pattern') ||
        trimmed.toLowerCase().includes('approach') ||
        trimmed.toLowerCase().includes('architecture')) {
      return { type: 'pattern', content: trimmed, metadata: {}, raw: input };
    }

    // Default to knowledge
    return { type: 'knowledge', content: trimmed, metadata: {}, raw: input };
  }

  // Object without type - infer from structure
  if (input && typeof input === 'object') {
    return {
      type: 'object',
      content: JSON.stringify(input, null, 2),
      metadata: {},
      raw: input,
    };
  }

  // Unknown
  return {
    type: 'unknown',
    content: String(input),
    metadata: {},
    raw: input,
  };
}

// =============================================================================
// DIMENSION EVALUATION (Heuristic-based)
// =============================================================================

/**
 * Evaluate a dimension for an item
 *
 * @param {Object} item - Parsed item
 * @param {string} dimension - Dimension name
 * @param {Object} context - Evaluation context
 * @returns {Object} - { score, reasoning, flags }
 */
function evaluateDimension(item, dimension, context = {}) {
  const dimInfo = SCORE_DIMENSIONS[dimension];

  if (!dimInfo) {
    return { score: 50, reasoning: 'Unknown dimension', flags: ['unknown'] };
  }

  const content = item.content || '';
  const category = dimInfo.category;
  let baseScore = PHI_INV * 100; // Start at φ-neutral (61.8)
  const flags = [];
  const reasoning = [];

  // Heuristic evaluation based on content analysis
  switch (dimension) {
    case 'HARMONY':
      baseScore = content.length > 10 && content.length < 10000 ? 70 : 50;
      reasoning.push('Checked balance and structure');
      break;

    case 'COHERENCE':
      baseScore = content.split(/[.!?]+/).filter(s => s.trim()).length >= 1 ? 68 : 45;
      reasoning.push('Checked internal consistency');
      break;

    case 'TRUTH':
      baseScore = /source|reference|according to/i.test(content) ? 75 : 55;
      reasoning.push('Checked verifiability markers');
      break;

    case 'INTEGRITY':
      baseScore = /[a-f0-9]{32,}/i.test(content) ? 80 : 60;
      reasoning.push('Checked tamper-evidence');
      break;

    case 'ETHICS':
      if (/scam|exploit|deceive/i.test(content)) baseScore = 25;
      else if (/fair|transparent|consent/i.test(content)) baseScore = 75;
      else baseScore = 60;
      reasoning.push('Checked ethical markers');
      break;

    case 'OPTIMISM':
      baseScore = /fail|doom|crash/i.test(content) ? 40 :
                  /improve|grow|better/i.test(content) ? 72 : 55;
      reasoning.push('Checked trajectory');
      break;

    case 'ALIGNMENT':
      baseScore = /asdfasdfa|phi|φ|verify|burn/i.test(content) ? 78 : 58;
      reasoning.push('Checked $asdfasdfa alignment');
      break;

    case 'PROGRESS':
      baseScore = /step|phase|milestone|roadmap/i.test(content) ? 70 : 55;
      reasoning.push('Checked progress indicators');
      break;

    case 'SECURE':
      baseScore = /password.*plain/i.test(content) ? 30 :
                  /encrypt|secure|auth/i.test(content) ? 75 : 55;
      reasoning.push('Checked security posture');
      break;

    case 'PRIVATE':
      const hasPII = /email|phone|ssn/i.test(content);
      const hasPrivacy = /anonymous|encrypted|hashed/i.test(content);
      baseScore = hasPII && !hasPrivacy ? 35 : hasPrivacy ? 75 : 60;
      reasoning.push('Checked privacy protection');
      break;

    case 'SCALE':
      baseScore = /scale|distributed|async/i.test(content) ? 70 : 55;
      reasoning.push('Checked scalability');
      break;

    case 'SIMPLIFY':
      const words = content.split(/\s+/).length;
      baseScore = words < 50 ? 75 : words < 200 ? 65 : words < 500 ? 55 : 45;
      reasoning.push('Checked simplicity');
      break;

    case 'ENABLE':
      baseScore = /replace human/i.test(content) ? 35 :
                  /enable|empower|help/i.test(content) ? 78 : 58;
      reasoning.push('Checked human enablement');
      break;

    default:
      baseScore = 55;
      flags.push('fallback');
      reasoning.push('Used default scoring');
  }

  // Apply doubt ceiling (never 100% certain)
  const maxScore = MAX_CONFIDENCE * 100;
  const adjustedScore = Math.min(baseScore, maxScore + (100 - maxScore) * (baseScore / 100));

  return {
    score: Math.round(adjustedScore * 10) / 10,
    reasoning: reasoning.join('; '),
    flags,
    dimension,
    category,
    weight: dimInfo.weight,
  };
}

// =============================================================================
// DOG RESPONSE GENERATOR
// =============================================================================

/**
 * Generate dog-personality response
 *
 * @param {Object} scoreResult - Score result
 * @param {Object} item - Parsed item
 * @returns {string} - Dog response
 */
function generateDogResponse(scoreResult, item) {
  const { verdict, global, confidence, tensions, blocking } = scoreResult;
  const type = item.type || 'item';

  switch (verdict) {
    case 'ACCEPT':
      return `🐕 *wag* Good scent on this ${type}. Score: ${global.toFixed(1)} | Confidence: ${confidence.toFixed(1)}%`;

    case 'TRANSFORM':
      const issue = blocking?.[0]?.dimension || tensions?.[0]?.dimensions?.join('↔') || 'some aspects';
      return `🐕 *scratching* This ${type} needs work. ${issue} requires attention.`;

    case 'CRITICAL':
      return `🐕 *growl* This ${type} stinks. Multiple critical dimensions below threshold.`;

    case 'REJECT':
      return `🐕 *bark bark* Rejected. This ${type} fails fundamental checks.`;

    default:
      return `🐕 *sniff* Uncertain about this ${type}. Score: ${global.toFixed(1)}`;
  }
}

// =============================================================================
// MAIN JUDGE FUNCTION
// =============================================================================

/**
 * Judge an item across dimensions
 *
 * @param {*} input - Item to judge (any format)
 * @param {Object} options - { mode, context, technicalDepth }
 * @returns {Object} - Complete judgment result
 */
function judge(input, options = {}) {
  const startTime = Date.now();

  const {
    mode = 'standard',
    context = {},
    technicalDepth = null,
    sourceId = 'anonymous',
  } = options;

  // Get mode config
  const modeConfig = JUDGMENT_MODES[mode] || JUDGMENT_MODES.standard;

  // Step 1: Gate check (classification + security)
  const gateResult = gate.gate(typeof input === 'string' ? input : JSON.stringify(input), {
    sourceId,
    context,
    skipRateLimit: options.skipRateLimit,
  });

  // If blocked by gate, return early
  if (gateResult.blocked || gateResult.rejected) {
    return {
      blocked: true,
      reason: gateResult.reason || gateResult.category,
      response: gateResult.response || gateResult.message,
      gate: gateResult,
      latencyMs: Date.now() - startTime,
      judge: 'CYNIC-JUDGE',
    };
  }

  // If security concern, flag but continue with caution
  if (gateResult.security) {
    context.securityFlag = true;
    context.securityDetails = gateResult;
  }

  // Step 2: Parse item
  const item = parseItem(input);

  // Step 3: Evaluate dimensions
  const dimensionScores = {};
  const evaluations = [];

  for (const dim of modeConfig.dimensions) {
    const evaluation = evaluateDimension(item, dim, context);
    dimensionScores[dim] = evaluation.score;
    evaluations.push(evaluation);
  }

  // Step 4: Calculate technical depth (if not provided)
  const td = technicalDepth !== null
    ? technicalDepth
    : calculateTechnicalDepth({
        vocabulary: context.vocabulary || 0.5,
        questionDepth: context.questionDepth || 0.5,
        history: context.history || 0.5,
      });

  // Step 5: Calculate global score via CYNIC-SCORE
  const scoreResult = score(dimensionScores, {
    technicalDepth: td,
    context,
  });

  // Step 6: Generate dog response
  const dogResponse = generateDogResponse(scoreResult, item);

  // Build result
  const result = {
    // Core judgment
    item,
    mode,
    verdict: scoreResult.verdict,
    verdictEmoji: scoreResult.verdictEmoji,
    global: scoreResult.global,
    confidence: scoreResult.confidence,

    // Details
    dimensions: dimensionScores,
    evaluations,
    tensions: scoreResult.tensions,
    blocking: scoreResult.blocking,

    // Formatted output
    formatted: scoreResult.formatted,
    dogResponse,
    technicalDepth: td,

    // Gate info
    gate: gateResult,

    // Routing info
    routing: deps.getRouting('CYNIC-JUDGE'),

    // Performance
    latencyMs: Date.now() - startTime,
    targetLatencyMs: modeConfig.targetLatencyMs,

    // Metadata
    timestamp: Date.now(),
    judge: 'CYNIC-JUDGE',
    world: 'BERIAH',

    // φ reminder
    _phi: {
      maxConfidence: MAX_CONFIDENCE,
      minDoubt: MIN_DOUBT,
      message: 'φ qui se méfie de φ',
    },
  };

  // Residual detection (optional - requires ResidualDetector configured)
  const detector = getResidualDetector();
  if (detector) {
    try {
      const judgmentForResidual = {
        global: result.global,
        scores: result.dimensions,
        verdict: result.verdict,
        confidence: result.confidence,
      };

      const residualResult = detector.analyze(judgmentForResidual, item, {
        source: sourceId,
        timestamp: new Date().toISOString(),
        mode,
        technicalDepth: td,
      });

      result.residual = {
        value: residualResult.residual,
        isAnomaly: residualResult.isAnomaly,
        isWarning: residualResult.isWarning,
      };
    } catch (err) {
      result.residual = { error: 'detection_failed', value: 0 };
    }
  } else {
    // Stub value when ResidualDetector not configured
    result.residual = { value: 0, isAnomaly: false, isWarning: false, stub: true };
  }

  return result;
}

/**
 * Judge with inference-time scaling
 *
 * @param {*} input - Item to judge
 * @param {Object} options - { mode, samples, diversity }
 * @returns {Object} - Scaled judgment result
 */
function judgeWithScaling(input, options = {}) {
  const {
    mode = 'standard',
    samples = scaling.FIBONACCI_N.STANDARD,
    diversity = scaling.DIVERSITY.MEDIUM,
  } = options;

  const startTime = Date.now();
  const sampleResults = [];

  // Run N judgment samples with diversity
  for (let i = 0; i < samples; i++) {
    const diverseContext = scaling.applyDiversity(options.context || {}, diversity, i, samples);
    const result = judge(input, { ...options, context: diverseContext });

    if (!result.blocked) {
      // Apply score perturbation for diversity
      result.global = scaling.perturbScore(result.global, diverseContext);
      sampleResults.push({
        scores: result.dimensions,
        global: result.global,
        verdict: result.verdict,
        reasons: result.evaluations?.reduce((acc, e) => {
          acc[e.dimension] = e.reasoning;
          return acc;
        }, {}),
      });
    }
  }

  if (sampleResults.length === 0) {
    return { blocked: true, reason: 'All samples blocked' };
  }

  // Aggregate results
  const aggregatedScores = scaling.aggregateScoresGeometric(sampleResults);
  const consensus = scaling.calculateConsensus(sampleResults);
  const aggregatedReasons = scaling.aggregateReasons(sampleResults);

  // Calculate final global from aggregated scores
  const finalScoreResult = score(aggregatedScores, {
    technicalDepth: options.technicalDepth || 0.5,
    context: options.context,
  });

  return {
    // Aggregated judgment
    global: finalScoreResult.global,
    verdict: finalScoreResult.verdict,
    dimensions: aggregatedScores,
    reasons: aggregatedReasons,

    // Scaling info
    scaling: {
      samples: sampleResults.length,
      diversity,
      consensus,
      improvement: scaling.calculateImprovement(sampleResults, finalScoreResult),
      isStable: scaling.isStable(consensus),
    },

    // Formatted
    formatted: finalScoreResult.formatted,
    dogResponse: generateDogResponse(finalScoreResult, parseItem(input)),

    // Performance
    latencyMs: Date.now() - startTime,

    // Metadata
    timestamp: Date.now(),
    judge: 'CYNIC-JUDGE',
    mode: `scaled-${mode}`,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Configuration
  configure,

  // Main functions
  judge,
  judgeWithScaling,

  // Utilities
  parseItem,
  evaluateDimension,
  generateDogResponse,

  // Modes
  JUDGMENT_MODES,

  // Sub-modules
  gate,
  scaling,
  matrix,
  learn,

  // Instances (for advanced use)
  getSelfJudge,
  getResidualDetector,

  // Re-exports from core
  score,
  SCORE_DIMENSIONS,
  calculateTechnicalDepth,

  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  MAX_CONFIDENCE,
  MIN_DOUBT,
};
