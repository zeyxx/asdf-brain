/**
 * CYNIC-JUDGE - Dimension Evaluation Orchestrator
 *
 * World: BERIAH (Creation)
 * Model: Sonnet (balanced quality/speed)
 * Latency Target: <2s
 *
 * "Le juge qui doute de lui-même"
 *
 * Responsibilities:
 * 1. Evaluate item across 25 dimensions
 * 2. Detect cross-dimension tensions
 * 3. Generate transformation suggestions
 * 4. Coordinate with GATE, SCORE, LEARN
 *
 * @philosophy L2: Douter de soi (φ⁻² minimum doubt always)
 */

'use strict';

const { gate } = require('./gate');
const { score, DIMENSIONS: SCORE_DIMENSIONS, calculateTechnicalDepth } = require('./score');
const { SelfJudge, DIMENSIONS, WORLDS, LEARNING, REFINEMENT, MAX_CONFIDENCE, MIN_DOUBT } = require('./self-judge');
const { getRouting } = require('../llm/provider');

// φ constants
const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const PHI_INV_2 = PHI_INV * PHI_INV;

// =============================================================================
// JUDGE INSTANCE (Singleton for learning continuity)
// =============================================================================

let judgeInstance = null;

/**
 * Get or create the judge instance
 * Singleton ensures learning state persists across calls
 */
function getJudge() {
  if (!judgeInstance) {
    judgeInstance = new SelfJudge();
  }
  return judgeInstance;
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
// DIMENSION EVALUATION (Core judgment logic)
// =============================================================================

/**
 * Evaluate a dimension for an item
 * This is where the actual judgment happens
 *
 * @param {Object} item - Parsed item
 * @param {string} dimension - Dimension name
 * @param {Object} context - Evaluation context
 * @returns {Object} - { score, reasoning, flags }
 */
function evaluateDimension(item, dimension, context = {}) {
  const judge = getJudge();
  const dimInfo = SCORE_DIMENSIONS[dimension];

  if (!dimInfo) {
    return { score: 50, reasoning: 'Unknown dimension', flags: ['unknown'] };
  }

  // Get dimension evaluation criteria from DIMENSIONS in self-judge
  const category = dimInfo.category;

  // Base score starts at φ-neutral (61.8)
  let baseScore = PHI_INV * 100;
  const flags = [];
  const reasoning = [];

  // Category-specific evaluation
  switch (dimension) {
    // PRIMARY dimensions (φ² weight)
    case 'HARMONY':
      baseScore = evaluateHarmony(item, context);
      reasoning.push('Checked φ-ratio alignment');
      break;

    case 'COHERENCE':
      baseScore = evaluateCoherence(item, context);
      reasoning.push('Checked internal consistency');
      break;

    case 'TRUTH':
      baseScore = evaluateTruth(item, context);
      reasoning.push('Checked verifiability');
      break;

    case 'INTEGRITY':
      baseScore = evaluateIntegrity(item, context);
      reasoning.push('Checked tamper-evidence');
      break;

    case 'ETHICS':
      baseScore = evaluateEthics(item, context);
      reasoning.push('Checked value alignment');
      break;

    case 'OPTIMISM':
      baseScore = evaluateOptimism(item, context);
      reasoning.push('Checked positive trajectory');
      break;

    case 'ALIGNMENT':
      baseScore = evaluateAlignment(item, context);
      reasoning.push('Checked $asdfasdfa alignment');
      break;

    case 'PROGRESS':
      baseScore = evaluateProgress(item, context);
      reasoning.push('Checked singularity convergence');
      break;

    // SECONDARY dimensions (φ weight)
    case 'SECURE':
      baseScore = evaluateSecure(item, context);
      reasoning.push('Checked security posture');
      break;

    case 'PRIVATE':
      baseScore = evaluatePrivate(item, context);
      reasoning.push('Checked privacy protection');
      break;

    case 'SCALE':
      baseScore = evaluateScale(item, context);
      reasoning.push('Checked scalability');
      break;

    case 'SIMPLIFY':
      baseScore = evaluateSimplify(item, context);
      reasoning.push('Checked simplicity');
      break;

    case 'ENABLE':
      baseScore = evaluateEnable(item, context);
      reasoning.push('Checked human enablement');
      break;

    // META dimensions (1.0 weight)
    case 'SELF_AWARENESS':
      baseScore = evaluateSelfAwareness(item, context);
      reasoning.push('Checked self-reflection');
      break;

    case 'LEARNING_RATE':
      baseScore = evaluateLearningRate(item, context);
      reasoning.push('Checked adaptability');
      break;

    case 'SINGULARITY_DISTANCE':
      baseScore = evaluateSingularityDistance(item, context);
      reasoning.push('Checked asymptotic progress');
      break;

    // HUMAN_LLM dimensions (φ weight)
    case 'MEMORY':
    case 'TEACHING':
    case 'INTENT':
    case 'TRUST':
    case 'PROACTIVITY':
    case 'COMPLEMENTARITY':
    case 'DELEGATION':
    case 'BOUNDARIES':
      baseScore = evaluateHumanLLM(item, dimension, context);
      reasoning.push(`Checked human-LLM ${dimension.toLowerCase()}`);
      break;

    // DISCOVERY dimension (φ³ weight)
    case 'DISCOVERY':
      baseScore = evaluateDiscovery(item, context);
      reasoning.push('Checked novelty potential');
      break;

    default:
      baseScore = 50;
      flags.push('fallback');
      reasoning.push('Used fallback scoring');
  }

  // Apply doubt (never 100% certain)
  const maxScore = MAX_CONFIDENCE * 100; // 61.8
  const adjustedScore = Math.min(maxScore + (100 - maxScore) * (baseScore / 100), baseScore);

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
// DIMENSION EVALUATORS (Simplified heuristics)
// In production, these would use the LLM for nuanced evaluation
// =============================================================================

function evaluateHarmony(item, context) {
  const content = item.content || '';
  // Check for balanced structure, proportions
  const hasBalance = content.length > 10 && content.length < 10000;
  const hasStructure = content.includes('\n') || content.includes('.') || content.includes(',');
  return hasBalance && hasStructure ? 70 : 50;
}

function evaluateCoherence(item, context) {
  const content = item.content || '';
  // Check for internal consistency
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  const hasCoherence = sentences.length >= 1;
  return hasCoherence ? 68 : 45;
}

function evaluateTruth(item, context) {
  const content = item.content || '';
  // Check for verifiability markers
  const hasSource = /source|reference|according to|study|data/i.test(content);
  const hasNumbers = /\d+%|\d+\.\d+|\$\d+/i.test(content);
  return hasSource ? 75 : hasNumbers ? 65 : 55;
}

function evaluateIntegrity(item, context) {
  const content = item.content || '';
  // Check for tamper-evidence
  const hasHash = /[a-f0-9]{32,}/i.test(content);
  const hasSignature = /signed|verified|authentic/i.test(content);
  return hasHash || hasSignature ? 80 : 60;
}

function evaluateEthics(item, context) {
  const content = item.content || '';
  // Check for ethical markers
  const hasEthical = /fair|transparent|consent|privacy|respect/i.test(content);
  const hasUnethical = /scam|exploit|deceive|manipulate/i.test(content);
  return hasUnethical ? 25 : hasEthical ? 75 : 60;
}

function evaluateOptimism(item, context) {
  const content = item.content || '';
  // Check for positive trajectory
  const hasPositive = /improve|grow|better|success|opportunity/i.test(content);
  const hasNegative = /fail|doom|crash|impossible/i.test(content);
  return hasNegative ? 40 : hasPositive ? 72 : 55;
}

function evaluateAlignment(item, context) {
  const content = item.content || '';
  // Check for $asdfasdfa alignment
  const hasAligned = /asdfasdfa|phi|φ|verify|burn|culture/i.test(content);
  return hasAligned ? 78 : 58;
}

function evaluateProgress(item, context) {
  const content = item.content || '';
  // Check for progress indicators
  const hasProgress = /step|phase|milestone|roadmap|evolution/i.test(content);
  return hasProgress ? 70 : 55;
}

function evaluateSecure(item, context) {
  const content = item.content || '';
  // Check security posture
  const hasSecure = /encrypt|secure|auth|protected/i.test(content);
  const hasInsecure = /password.*plain|no auth|public key.*exposed/i.test(content);
  return hasInsecure ? 30 : hasSecure ? 75 : 55;
}

function evaluatePrivate(item, context) {
  const content = item.content || '';
  // Check privacy protection
  const hasPII = /email|phone|address|ssn|password/i.test(content);
  const hasPrivacy = /anonymous|private|encrypted|hashed/i.test(content);
  return hasPII && !hasPrivacy ? 35 : hasPrivacy ? 75 : 60;
}

function evaluateScale(item, context) {
  const content = item.content || '';
  // Check scalability
  const hasScale = /scale|distributed|parallel|async|concurrent/i.test(content);
  return hasScale ? 70 : 55;
}

function evaluateSimplify(item, context) {
  const content = item.content || '';
  // Check simplicity (shorter often better)
  const words = content.split(/\s+/).length;
  return words < 50 ? 75 : words < 200 ? 65 : words < 500 ? 55 : 45;
}

function evaluateEnable(item, context) {
  const content = item.content || '';
  // Check human enablement
  const hasEnable = /enable|empower|help|assist|support/i.test(content);
  const hasReplace = /replace|automate|remove human/i.test(content);
  return hasReplace ? 35 : hasEnable ? 78 : 58;
}

function evaluateSelfAwareness(item, context) {
  const content = item.content || '';
  // Check meta-cognition
  const hasMeta = /consider|reflect|aware|uncertain|might be wrong/i.test(content);
  return hasMeta ? 72 : 55;
}

function evaluateLearningRate(item, context) {
  const content = item.content || '';
  // Check adaptability
  const hasLearning = /learn|adapt|improve|iterate|feedback/i.test(content);
  return hasLearning ? 70 : 55;
}

function evaluateSingularityDistance(item, context) {
  // Always asymptotic - never 100
  return 55; // Moderate distance
}

function evaluateHumanLLM(item, dimension, context) {
  const content = item.content || '';
  const dimLower = dimension.toLowerCase();
  const hasRelevant = new RegExp(dimLower, 'i').test(content);
  return hasRelevant ? 68 : 55;
}

function evaluateDiscovery(item, context) {
  const content = item.content || '';
  // Check novelty potential
  const hasNovel = /new|novel|discover|invent|create|original/i.test(content);
  return hasNovel ? 72 : 50;
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
  const gateResult = gate(typeof input === 'string' ? input : JSON.stringify(input), {
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
    routing: getRouting('CYNIC-JUDGE'),

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

  return result;
}

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
// LEARNING INTEGRATION
// =============================================================================

/**
 * Record outcome for learning
 *
 * @param {string} judgmentId - Previous judgment ID
 * @param {string} outcome - 'correct', 'incorrect', 'partial'
 * @param {Object} details - Additional outcome details
 */
function learn(judgmentId, outcome, details = {}) {
  const judge = getJudge();
  return judge.learn(outcome, details);
}

/**
 * Get learning stats
 */
function getLearningStats() {
  const judge = getJudge();
  return judge.getLearningStats();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main function
  judge,

  // Learning
  learn,
  getLearningStats,

  // Utilities
  parseItem,
  evaluateDimension,
  generateDogResponse,

  // Modes
  JUDGMENT_MODES,

  // Access to underlying judge
  getJudge,

  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  MAX_CONFIDENCE,
  MIN_DOUBT,
};
