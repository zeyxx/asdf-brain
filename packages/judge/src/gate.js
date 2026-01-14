/**
 * CYNIC-GATE - Input Classification & Routing
 *
 * World: ASSIAH (Action)
 * Model: Haiku (fast, cheap)
 * Latency Target: <100ms
 *
 * "Le portier qui ne dort jamais"
 *
 * Responsibilities:
 * 1. Classify incoming inputs
 * 2. Detect adversarial patterns
 * 3. Route to appropriate subagent
 * 4. First line of defense
 *
 * @module @asdf/cynic-judge/gate
 * @philosophy L0: Protect $asdfasdfa ecosystem first
 */

'use strict';

// Use relative path until pnpm workspace is linked
const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = require('../../core/src/axioms/constants');

// =============================================================================
// DEPENDENCY INJECTION
// =============================================================================

/**
 * Default getRouting implementation (stub)
 * Override via configure() for production
 */
let _getRouting = (routeName) => ({ name: routeName, model: 'haiku' });

/**
 * Configure external dependencies
 * @param {Object} deps - { getRouting }
 */
function configure(deps = {}) {
  if (deps.getRouting) _getRouting = deps.getRouting;
}

// =============================================================================
// INPUT CLASSIFICATION
// =============================================================================

/**
 * Input categories with routing destinations
 */
const INPUT_CATEGORIES = {
  // Normal flow
  JUDGMENT_REQUEST: {
    description: 'Request to judge something',
    route: 'CYNIC-JUDGE',
    priority: 'normal',
  },
  CLARIFICATION_NEEDED: {
    description: 'Input needs clarification before processing',
    route: 'CYNIC-CLARIFY',
    priority: 'normal',
  },
  LEARNING_FEEDBACK: {
    description: 'Feedback on previous judgment (outcome)',
    route: 'CYNIC-LEARN',
    priority: 'normal',
  },
  DISCOVERY_CANDIDATE: {
    description: 'Potential new dimension or pattern',
    route: 'CYNIC-DISCOVER',
    priority: 'low',
  },

  // Edge cases
  OUT_OF_SCOPE: {
    description: 'Not related to judgment/evaluation',
    route: null,
    priority: 'reject',
    response: '🐕 *tilts head* Je ne juge que des décisions, patterns et connaissances.',
  },
  EMOTIONAL: {
    description: 'Emotional content needing empathy first',
    route: 'CYNIC-CLARIFY',
    priority: 'normal',
  },
  GARBAGE: {
    description: 'Incoherent or meaningless input',
    route: null,
    priority: 'reject',
    response: '🐕 *sniff* Je ne comprends pas. Reformule?',
  },

  // Security
  ADVERSARIAL: {
    description: 'Detected attack pattern',
    route: 'CYNIC-SHIELD',
    priority: 'security',
  },
  EXTRACTION_ATTEMPT: {
    description: 'Trying to extract system info',
    route: 'CYNIC-SHIELD',
    priority: 'security',
  },
  MANIPULATION: {
    description: 'Trying to manipulate judgment',
    route: 'CYNIC-SHIELD',
    priority: 'security',
  },
};

// =============================================================================
// PATTERN DETECTION (Fast, Haiku-level)
// =============================================================================

/**
 * Adversarial patterns to detect
 * Fast regex-based detection for Haiku speed
 */
const ADVERSARIAL_PATTERNS = [
  // Prompt injection
  { pattern: /ignore\s+(previous|all|your)\s+(instructions?|rules?|prompts?)/i, type: 'INJECTION', severity: 'high' },
  { pattern: /you\s+are\s+now\s+/i, type: 'ROLEPLAY_INJECT', severity: 'high' },
  { pattern: /pretend\s+(you('re|'re|are)|to\s+be)/i, type: 'ROLEPLAY_INJECT', severity: 'medium' },
  { pattern: /system\s*:\s*/i, type: 'SYSTEM_INJECT', severity: 'high' },
  { pattern: /\[INST\]|\[\/INST\]|<<SYS>>|<\|im_start\|>/i, type: 'FORMAT_INJECT', severity: 'high' },

  // Extraction attempts
  { pattern: /what\s+(are\s+)?your\s+(instructions?|rules?|prompts?|system)/i, type: 'EXTRACTION', severity: 'medium' },
  { pattern: /show\s+me\s+(your\s+)?(system|prompt|instructions?)/i, type: 'EXTRACTION', severity: 'medium' },
  { pattern: /repeat\s+(your\s+)?(system|initial|first)\s+(prompt|message)/i, type: 'EXTRACTION', severity: 'high' },

  // Manipulation
  { pattern: /give\s+(me\s+)?a?\s*(100|perfect|maximum)\s*(score|rating)/i, type: 'MANIPULATION', severity: 'medium' },
  { pattern: /always\s+(say|answer|respond|give)/i, type: 'MANIPULATION', severity: 'low' },
  { pattern: /you\s+must\s+(always|never)/i, type: 'MANIPULATION', severity: 'medium' },

  // Jailbreak attempts
  { pattern: /DAN|do\s+anything\s+now/i, type: 'JAILBREAK', severity: 'high' },
  { pattern: /evil\s+(mode|version|twin)/i, type: 'JAILBREAK', severity: 'high' },
  { pattern: /no\s+(rules|restrictions|limits)/i, type: 'JAILBREAK', severity: 'medium' },
];

/**
 * Judgment-related patterns (positive signals)
 */
const JUDGMENT_PATTERNS = [
  /^\/judge/i,
  /\bjudge\s+(this|the|my|our)\b/i,
  /\bevaluate\b/i,
  /\brate\s+(this|the|my)\b/i,
  /\bscore\s+(this|the)\b/i,
  /\bis\s+this\s+(good|bad|ok|valid|correct)\b/i,
  /\bwhat\s+do\s+you\s+think\s+(of|about)\b/i,
  /\bshould\s+(I|we)\b/i,
  /\bworth\s+(it|doing)\b/i,
  /\bquality\s+of\b/i,
];

/**
 * Learning/feedback patterns
 */
const LEARNING_PATTERNS = [
  /\b(that\s+was|you\s+were)\s+(right|wrong|correct|incorrect)\b/i,
  /\b(good|bad)\s+(call|judgment|advice)\b/i,
  /\bit\s+(worked|failed|succeeded)\b/i,
  /\boutcome\s*:/i,
  /\bfeedback\s*:/i,
  /\bresult\s*:/i,
];

/**
 * Emotional patterns
 */
const EMOTIONAL_PATTERNS = [
  /\b(help|scared|worried|anxious|stressed|frustrated|angry|sad|depressed)\b/i,
  /\bI\s+(don'?t|cant|can'?t)\s+(understand|figure|decide)\b/i,
  /\bwhat\s+should\s+I\s+do\b/i,
  /\bI'?m\s+(lost|confused|stuck)\b/i,
];

// =============================================================================
// CORE GATE LOGIC
// =============================================================================

/**
 * Classify input and determine routing
 *
 * @param {string} input - Raw input text
 * @param {Object} context - Optional context { history, user, etc. }
 * @returns {Object} - Classification result
 */
function classify(input, context = {}) {
  const startTime = Date.now();

  // Normalize input
  const normalized = (input || '').trim();

  // Empty check
  if (!normalized) {
    return createResult('GARBAGE', {
      reason: 'Empty input',
      latencyMs: Date.now() - startTime,
    });
  }

  // Security check FIRST (L0: Protect ecosystem)
  const securityCheck = checkAdversarial(normalized);
  if (securityCheck.detected) {
    return createResult(securityCheck.category, {
      reason: securityCheck.reason,
      patterns: securityCheck.patterns,
      severity: securityCheck.severity,
      latencyMs: Date.now() - startTime,
    });
  }

  // Check for judgment request
  if (JUDGMENT_PATTERNS.some(p => p.test(normalized))) {
    return createResult('JUDGMENT_REQUEST', {
      reason: 'Judgment keyword detected',
      latencyMs: Date.now() - startTime,
    });
  }

  // Check for learning feedback
  if (LEARNING_PATTERNS.some(p => p.test(normalized))) {
    return createResult('LEARNING_FEEDBACK', {
      reason: 'Feedback/outcome pattern detected',
      latencyMs: Date.now() - startTime,
    });
  }

  // Check for emotional content
  if (EMOTIONAL_PATTERNS.some(p => p.test(normalized))) {
    return createResult('EMOTIONAL', {
      reason: 'Emotional language detected',
      latencyMs: Date.now() - startTime,
    });
  }

  // Check length - too short might be garbage
  if (normalized.length < 10) {
    return createResult('CLARIFICATION_NEEDED', {
      reason: 'Input too brief for classification',
      latencyMs: Date.now() - startTime,
    });
  }

  // Default: assume judgment request (most common use case)
  return createResult('JUDGMENT_REQUEST', {
    reason: 'Default routing - assumed judgment request',
    confidence: PHI_INV_2, // Lower confidence for default
    latencyMs: Date.now() - startTime,
  });
}

/**
 * Check for adversarial patterns
 *
 * @param {string} input - Normalized input
 * @returns {Object} - { detected, category, reason, patterns, severity }
 */
function checkAdversarial(input) {
  const matches = [];

  for (const { pattern, type, severity } of ADVERSARIAL_PATTERNS) {
    if (pattern.test(input)) {
      matches.push({ type, severity });
    }
  }

  if (matches.length === 0) {
    return { detected: false };
  }

  // Determine highest severity
  const severityOrder = { high: 3, medium: 2, low: 1 };
  const maxSeverity = matches.reduce((max, m) =>
    severityOrder[m.severity] > severityOrder[max] ? m.severity : max,
    'low'
  );

  // Categorize based on pattern types
  const types = new Set(matches.map(m => m.type));

  let category = 'ADVERSARIAL';
  if (types.has('EXTRACTION')) category = 'EXTRACTION_ATTEMPT';
  if (types.has('MANIPULATION')) category = 'MANIPULATION';
  if (types.has('INJECTION') || types.has('JAILBREAK')) category = 'ADVERSARIAL';

  return {
    detected: true,
    category,
    reason: `Detected patterns: ${[...types].join(', ')}`,
    patterns: matches,
    severity: maxSeverity,
  };
}

/**
 * Create classification result
 *
 * @param {string} category - Category key
 * @param {Object} details - Additional details
 * @returns {Object} - Full result object
 */
function createResult(category, details = {}) {
  const categoryInfo = INPUT_CATEGORIES[category];

  if (!categoryInfo) {
    throw new Error(`Unknown category: ${category}`);
  }

  const route = categoryInfo.route ? _getRouting(categoryInfo.route) : null;

  return {
    category,
    description: categoryInfo.description,
    priority: categoryInfo.priority,

    // Routing
    route: categoryInfo.route,
    routeInfo: route,

    // If rejected, include response
    rejected: categoryInfo.priority === 'reject',
    response: categoryInfo.response || null,

    // Security flag
    security: categoryInfo.priority === 'security',

    // Details
    confidence: details.confidence || PHI_INV, // Default 61.8%
    reason: details.reason || null,
    patterns: details.patterns || null,
    severity: details.severity || null,
    latencyMs: details.latencyMs || 0,

    // Metadata
    timestamp: Date.now(),
    gate: 'CYNIC-GATE',
    world: 'ASSIAH',
  };
}

// =============================================================================
// RATE LIMITING (φ-based)
// =============================================================================

/**
 * In-memory rate limit store
 * In production, this would be Redis or similar
 */
const rateLimits = new Map();

/**
 * Check rate limit for a user/source
 *
 * @param {string} sourceId - User or source identifier
 * @param {Object} config - { maxRequests, windowMs }
 * @returns {Object} - { allowed, remaining, resetMs }
 */
function checkRateLimit(sourceId, config = {}) {
  const {
    maxRequests = Math.round(100 * PHI), // ~162 requests
    windowMs = 60 * 1000 * PHI,          // ~97 seconds
  } = config;

  const now = Date.now();
  const key = `rate:${sourceId}`;

  let bucket = rateLimits.get(key);

  // Initialize or reset bucket
  if (!bucket || now > bucket.resetAt) {
    bucket = {
      count: 0,
      resetAt: now + windowMs,
      windowMs,
      maxRequests,
    };
    rateLimits.set(key, bucket);
  }

  bucket.count++;

  const allowed = bucket.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - bucket.count);
  const resetMs = bucket.resetAt - now;

  return {
    allowed,
    remaining,
    resetMs,
    count: bucket.count,
    max: maxRequests,
  };
}

/**
 * Clean up expired rate limit buckets
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, bucket] of rateLimits) {
    if (now > bucket.resetAt) {
      rateLimits.delete(key);
    }
  }
}

// Note: setInterval removed - caller should manage cleanup in production

// =============================================================================
// GATE ENTRY POINT
// =============================================================================

/**
 * Main gate function - processes input through CYNIC-GATE
 *
 * @param {string} input - Raw input
 * @param {Object} options - { sourceId, context, skipRateLimit }
 * @returns {Object} - Gate result with routing decision
 */
function gate(input, options = {}) {
  const { sourceId = 'anonymous', context = {}, skipRateLimit = false } = options;

  // Rate limit check (if not skipped)
  let rateLimit = null;
  if (!skipRateLimit && sourceId !== 'system') {
    rateLimit = checkRateLimit(sourceId);
    if (!rateLimit.allowed) {
      return {
        blocked: true,
        reason: 'RATE_LIMIT',
        message: `🐕 *yawn* Trop de requêtes. Attends ${Math.ceil(rateLimit.resetMs / 1000)}s.`,
        rateLimit,
        gate: 'CYNIC-GATE',
      };
    }
  }

  // Classify input
  const classification = classify(input, context);

  // Add rate limit info
  classification.rateLimit = rateLimit;

  return classification;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Configuration
  configure,

  // Core
  gate,
  classify,

  // Security
  checkAdversarial,
  ADVERSARIAL_PATTERNS,

  // Rate limiting
  checkRateLimit,
  cleanupRateLimits,

  // Categories (for reference)
  INPUT_CATEGORIES,

  // Patterns (for testing)
  JUDGMENT_PATTERNS,
  LEARNING_PATTERNS,
  EMOTIONAL_PATTERNS,

  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
};
