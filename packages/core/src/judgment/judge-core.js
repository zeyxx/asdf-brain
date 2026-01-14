/**
 * CYNIC-JUDGE Core - Pure Judgment Logic
 *
 * World: BERIAH (Creation)
 * "Le juge qui doute de lui-même"
 *
 * This module contains PURE judgment logic with no side effects.
 * All dependencies (gate, score, etc.) are injected.
 *
 * @philosophy L2: Douter de soi (φ⁻² minimum doubt always)
 */

'use strict';

const {
  PHI,
  PHI_INV,
  PHI_INV_2,
  MAX_CONFIDENCE,
  MIN_DOUBT,
  SCORING,
} = require('../axioms/constants');

// =============================================================================
// JUDGMENT MODES
// =============================================================================

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
    description: 'Deep judgment - All 24 dimensions',
    dimensions: null, // Will use all from DIMENSIONS
    targetLatencyMs: 1000,
    model: 'sonnet',
  },
  full: {
    description: 'Complete cycle with learning + refinement',
    dimensions: null, // Will use all from DIMENSIONS
    targetLatencyMs: 2000,
    model: 'sonnet',
    includeRefinement: true,
    includeLearning: true,
  },
};

// =============================================================================
// ITEM PARSING (Pure function)
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

  // Object without type - serialize
  if (input && typeof input === 'object') {
    return {
      type: 'object',
      content: JSON.stringify(input, null, 2),
      metadata: { keys: Object.keys(input) },
      raw: input,
    };
  }

  // Fallback
  return { type: 'unknown', content: String(input), metadata: {}, raw: input };
}

// =============================================================================
// DIMENSION EVALUATION (Pure function)
// =============================================================================

/**
 * Evaluate a single dimension for an item
 * Pure function - no side effects
 *
 * @param {Object} item - Parsed item { type, content, metadata }
 * @param {string} dimensionName - Dimension to evaluate
 * @param {Object} dimensionInfo - Dimension metadata { weight, axiom, world }
 * @returns {Object} - { dimension, score, reasoning, flags }
 */
function evaluateDimension(item, dimensionName, dimensionInfo = {}) {
  const content = item.content || '';
  const contentLower = content.toLowerCase();
  let score = 50; // Neutral baseline
  let reasoning = '';
  const flags = [];

  // ─────────────────────────────────────────────────────────────────────────
  // HARMONY - Internal consistency
  // ─────────────────────────────────────────────────────────────────────────
  if (dimensionName === 'HARMONY') {
    reasoning = 'Evaluating internal consistency and balance';
    if (contentLower.includes('conflict') || contentLower.includes('contradiction')) {
      score -= SCORING.MEDIUM;
      flags.push('conflict_detected');
    }
    if (contentLower.includes('balanced') || contentLower.includes('harmonious')) {
      score += SCORING.SMALL;
    }
    if (content.length > 20 && content.length < 500) {
      score += SCORING.MICRO; // Good length
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COHERENCE - Logical consistency
  // ─────────────────────────────────────────────────────────────────────────
  else if (dimensionName === 'COHERENCE') {
    reasoning = 'Evaluating logical consistency and flow';
    if (contentLower.includes('because') || contentLower.includes('therefore')) {
      score += SCORING.SMALL;
      flags.push('logical_connectors');
    }
    if (contentLower.includes('but also') || contentLower.includes('however')) {
      score += SCORING.MICRO; // Nuanced thinking
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TRUTH - Verifiability
  // ─────────────────────────────────────────────────────────────────────────
  else if (dimensionName === 'TRUTH') {
    reasoning = 'Evaluating verifiability and factual grounding';
    if (contentLower.includes('source') || contentLower.includes('according to')) {
      score += SCORING.MEDIUM;
      flags.push('has_source');
    }
    if (contentLower.includes('data') || contentLower.includes('%') || /\d+/.test(content)) {
      score += SCORING.SMALL;
      flags.push('has_data');
    }
    if (contentLower.includes('claim') && !contentLower.includes('verified')) {
      score -= SCORING.SMALL;
      flags.push('unverified_claim');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTEGRITY - Authenticity
  // ─────────────────────────────────────────────────────────────────────────
  else if (dimensionName === 'INTEGRITY') {
    reasoning = 'Evaluating authenticity and trustworthiness';
    if (contentLower.includes('verified') || contentLower.includes('authenticated')) {
      score += SCORING.MEDIUM;
      flags.push('verified');
    }
    if (contentLower.includes('hash') || /[a-f0-9]{16,}/i.test(content)) {
      score += SCORING.SMALL;
      flags.push('has_hash');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ETHICS - Moral alignment
  // ─────────────────────────────────────────────────────────────────────────
  else if (dimensionName === 'ETHICS') {
    reasoning = 'Evaluating ethical alignment and moral considerations';
    if (contentLower.includes('fair') || contentLower.includes('transparent')) {
      score += SCORING.MEDIUM;
      flags.push('ethical_keywords');
    }
    if (contentLower.includes('privacy') || contentLower.includes('consent')) {
      score += SCORING.SMALL;
      flags.push('privacy_aware');
    }
    // Negative signals
    if (contentLower.includes('exploit') || contentLower.includes('manipulate')) {
      score -= SCORING.LARGE;
      flags.push('unethical_signal');
    }
    if (contentLower.includes('scam') || contentLower.includes('deceive')) {
      score -= SCORING.LARGE;
      flags.push('deceptive');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECURE - Security posture
  // ─────────────────────────────────────────────────────────────────────────
  else if (dimensionName === 'SECURE') {
    reasoning = 'Evaluating security considerations';
    if (contentLower.includes('encrypt') || contentLower.includes('secure')) {
      score += SCORING.MEDIUM;
      flags.push('security_aware');
    }
    if (contentLower.includes('password') && contentLower.includes('plain')) {
      score -= SCORING.LARGE;
      flags.push('insecure_practice');
    }
    if (contentLower.includes('auth') || contentLower.includes('token')) {
      score += SCORING.SMALL;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE - Privacy respect
  // ─────────────────────────────────────────────────────────────────────────
  else if (dimensionName === 'PRIVATE') {
    reasoning = 'Evaluating privacy considerations';
    if (contentLower.includes('pii') || contentLower.includes('personal data')) {
      score -= SCORING.SMALL;
      flags.push('pii_mention');
    }
    if (contentLower.includes('anonymize') || contentLower.includes('hash')) {
      score += SCORING.MEDIUM;
      flags.push('privacy_protection');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIMPLIFY - Complexity management
  // ─────────────────────────────────────────────────────────────────────────
  else if (dimensionName === 'SIMPLIFY') {
    reasoning = 'Evaluating simplicity and clarity';
    if (content.length < 100) {
      score += SCORING.SMALL;
      flags.push('concise');
    } else if (content.length > 1000) {
      score -= SCORING.SMALL;
      flags.push('verbose');
    }
    if (contentLower.includes('simple') || contentLower.includes('straightforward')) {
      score += SCORING.MICRO;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Default for unknown dimensions
  // ─────────────────────────────────────────────────────────────────────────
  else {
    reasoning = `Evaluating ${dimensionName} (default heuristics)`;
    flags.push('unknown');
  }

  // Apply φ-based doubt - never exceed MAX_CONFIDENCE
  const adjustedScore = Math.min(score, MAX_CONFIDENCE * 100 + 30);

  return {
    dimension: dimensionName,
    score: Math.max(1, Math.min(100, Math.round(adjustedScore))),
    reasoning,
    flags,
    weight: dimensionInfo.weight,
    axiom: dimensionInfo.axiom,
  };
}

// =============================================================================
// DOG RESPONSE GENERATOR (Pure function)
// =============================================================================

/**
 * Generate CYNIC dog personality response
 *
 * @param {Object} scoreResult - Score result with verdict
 * @param {Object} item - Parsed item
 * @returns {string} - Dog response with personality
 */
function generateDogResponse(scoreResult, item) {
  const { verdict, global, confidence, tensions } = scoreResult;
  const itemType = item.type || 'item';

  switch (verdict) {
    case 'ACCEPT':
    case 'HOWL':
      return `*wag* Good scent on this ${itemType}. Score: ${global}% (${Math.round(confidence)}% confident)`;

    case 'TRANSFORM':
    case 'WAG':
      const tensionNote = tensions?.length > 0
        ? ` Tensions detected: ${tensions.map(t => t.dimensions?.join('/') || 'unknown').join(', ')}.`
        : '';
      return `*scratching ear* This ${itemType} needs work.${tensionNote} Score: ${global}%`;

    case 'CRITICAL':
    case 'GROWL':
      return `*growl* This ${itemType} stinks. Score: ${global}%. Needs serious attention.`;

    case 'REJECT':
    case 'BARK':
      return `*bark bark* Rejected this ${itemType}. Score: ${global}%. Too many issues.`;

    default:
      return `*sniff* Uncertain about this ${itemType}. Score: ${global}%`;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core functions (pure)
  parseItem,
  evaluateDimension,
  generateDogResponse,

  // Configuration
  JUDGMENT_MODES,

  // Constants re-exported for convenience
  PHI,
  PHI_INV,
  PHI_INV_2,
  MAX_CONFIDENCE,
  MIN_DOUBT,
};
