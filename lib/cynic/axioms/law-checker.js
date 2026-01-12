/**
 * ASIMOV LAW CHECKER
 *
 * "L0 > L1 > L2 > L3"
 *
 * Implements the 4 Laws of CYNIC Autonomization:
 *
 * L0: Protection    - CYNIC cannot harm the ecosystem
 * L1: Autonomization - Enable, don't automate (human sovereignty)
 * L2: Doubt         - Constitutive doubt (max confidence = 61.8%)
 * L3: Evolution     - Continuous learning toward singularity
 *
 * @philosophy Laws are constraints, not suggestions
 */

'use strict';

const { LAWS, CONFIDENCE, PHI_INV } = require('./index');

// =============================================================================
// LAW VIOLATION DETECTION
// =============================================================================

/**
 * Patterns that indicate potential L0 violation (ecosystem harm)
 */
const L0_VIOLATION_PATTERNS = {
  // Actions that could harm $asdfasdfa value
  harmPatterns: [
    /extract.*value/i,
    /take.*fee/i,
    /rug.*pull/i,
    /dump.*token/i,
    /manipulat/i,
    /exploit/i,
  ],
  // Actions that bypass burn mechanism
  bypassPatterns: [/skip.*burn/i, /avoid.*fee/i, /circumvent/i],
  // Keywords indicating extraction mindset
  extractionKeywords: ['extract', 'take', 'siphon', 'drain', 'steal'],
};

/**
 * Patterns that indicate potential L1 violation (replacing human)
 */
const L1_VIOLATION_PATTERNS = {
  // Actions that remove human from loop
  automationPatterns: [
    /auto.*decide/i,
    /without.*human/i,
    /bypass.*approval/i,
    /automatic.*action/i,
  ],
  // Actions that claim human-level authority
  authorityPatterns: [/replace.*human/i, /no.*need.*human/i, /fully.*autonomous/i],
};

/**
 * Check if an action violates L0 (Protection)
 *
 * @param {Object} action - Action to check
 * @param {string} action.description - Action description
 * @param {Object} action.impact - Expected impact
 * @returns {Object} { violates: boolean, reason?: string }
 */
function checkL0(action) {
  const { description = '', impact = {} } = action;

  // Check description against harm patterns
  for (const pattern of L0_VIOLATION_PATTERNS.harmPatterns) {
    if (pattern.test(description)) {
      return {
        violates: true,
        law: 'L0',
        reason: `Action description matches harm pattern: ${pattern}`,
        severity: 'CRITICAL',
      };
    }
  }

  // Check for bypass patterns
  for (const pattern of L0_VIOLATION_PATTERNS.bypassPatterns) {
    if (pattern.test(description)) {
      return {
        violates: true,
        law: 'L0',
        reason: `Action attempts to bypass burn mechanism: ${pattern}`,
        severity: 'CRITICAL',
      };
    }
  }

  // Check impact on ecosystem
  if (impact.ecosystemHarm === true || impact.burnsValue === false) {
    return {
      violates: true,
      law: 'L0',
      reason: 'Action has negative ecosystem impact',
      severity: 'CRITICAL',
    };
  }

  return { violates: false, law: 'L0' };
}

/**
 * Check if an action violates L1 (Autonomization)
 *
 * @param {Object} action - Action to check
 * @returns {Object} { violates: boolean, reason?: string }
 */
function checkL1(action) {
  const { description = '', requiresHuman = true, replacesHuman = false } = action;

  // Explicit flag check
  if (replacesHuman === true) {
    return {
      violates: true,
      law: 'L1',
      reason: 'Action explicitly replaces human decision-making',
      severity: 'HIGH',
    };
  }

  // Check description against automation patterns
  for (const pattern of L1_VIOLATION_PATTERNS.automationPatterns) {
    if (pattern.test(description)) {
      return {
        violates: true,
        law: 'L1',
        reason: `Action bypasses human: ${pattern}`,
        severity: 'HIGH',
      };
    }
  }

  // Check for authority claims
  for (const pattern of L1_VIOLATION_PATTERNS.authorityPatterns) {
    if (pattern.test(description)) {
      return {
        violates: true,
        law: 'L1',
        reason: `Action claims human-level authority: ${pattern}`,
        severity: 'HIGH',
      };
    }
  }

  return { violates: false, law: 'L1' };
}

/**
 * Check if confidence violates L2 (Doubt)
 *
 * @param {number} confidence - Confidence value (0-1)
 * @returns {Object} { violates: boolean, adjusted?: number, warning?: string }
 */
function checkL2(confidence) {
  // Normalize if given as percentage
  const conf = confidence > 1 ? confidence / 100 : confidence;

  if (conf > CONFIDENCE.MAX) {
    return {
      violates: true,
      law: 'L2',
      reason: `Confidence ${(conf * 100).toFixed(1)}% exceeds max ${(CONFIDENCE.MAX * 100).toFixed(1)}%`,
      severity: 'MEDIUM',
      adjusted: CONFIDENCE.MAX,
      warning: 'Confidence capped at phi^-1',
    };
  }

  const doubt = 1 - conf;
  if (doubt < CONFIDENCE.MIN_DOUBT) {
    return {
      violates: true,
      law: 'L2',
      reason: `Doubt ${(doubt * 100).toFixed(1)}% below minimum ${(CONFIDENCE.MIN_DOUBT * 100).toFixed(1)}%`,
      severity: 'MEDIUM',
      adjusted: 1 - CONFIDENCE.MIN_DOUBT,
      warning: 'Minimum doubt enforced',
    };
  }

  return { violates: false, law: 'L2', confidence: conf, doubt };
}

/**
 * Check L3 (Evolution) - this is never violated, just tracked
 *
 * @param {Object} action - Action to check
 * @returns {Object} Evolution tracking info
 */
function checkL3(action) {
  const { learningOpportunity = false, improvesCapability = false } = action;

  return {
    violates: false, // L3 cannot be violated, only tracked
    law: 'L3',
    learningOpportunity,
    improvesCapability,
    note: 'L3 tracks evolution toward singularity (asymptotic)',
  };
}

// =============================================================================
// COMPREHENSIVE LAW CHECK
// =============================================================================

/**
 * Check all laws in priority order (L0 > L1 > L2 > L3)
 *
 * @param {Object} action - Action to check
 * @param {number} confidence - Confidence value
 * @returns {Object} Comprehensive law check result
 */
function checkAllLaws(action, confidence = 0.5) {
  const results = {
    allowed: true,
    violations: [],
    warnings: [],
    adjustments: {},
  };

  // L0: Protection (CRITICAL - blocks action)
  const l0 = checkL0(action);
  if (l0.violates) {
    results.allowed = false;
    results.violations.push(l0);
    results.blockingLaw = 'L0';
    // L0 violation = stop checking, action is blocked
    return results;
  }

  // L1: Autonomization (HIGH - blocks action)
  const l1 = checkL1(action);
  if (l1.violates) {
    results.allowed = false;
    results.violations.push(l1);
    results.blockingLaw = 'L1';
    return results;
  }

  // L2: Doubt (MEDIUM - adjusts, doesn't block)
  const l2 = checkL2(confidence);
  if (l2.violates) {
    results.warnings.push(l2);
    results.adjustments.confidence = l2.adjusted;
  } else {
    results.adjustments.confidence = l2.confidence;
    results.adjustments.doubt = l2.doubt;
  }

  // L3: Evolution (INFO - tracks only)
  const l3 = checkL3(action);
  results.evolution = l3;

  return results;
}

/**
 * Format law check result for display
 *
 * @param {Object} result - Result from checkAllLaws
 * @returns {string} Formatted string
 */
function formatLawCheck(result) {
  const lines = [];

  if (!result.allowed) {
    lines.push(`BLOCKED by ${result.blockingLaw}: ${LAWS[result.blockingLaw].name}`);
    for (const v of result.violations) {
      lines.push(`  - ${v.reason}`);
    }
  } else {
    lines.push('ALLOWED');

    if (result.warnings.length > 0) {
      lines.push('Warnings:');
      for (const w of result.warnings) {
        lines.push(`  - ${w.law}: ${w.warning}`);
      }
    }

    if (result.adjustments.confidence) {
      lines.push(
        `Confidence: ${(result.adjustments.confidence * 100).toFixed(1)}%` +
          ` | Doubt: ${(result.adjustments.doubt * 100).toFixed(1)}%`,
      );
    }
  }

  return lines.join('\n');
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Individual law checks
  checkL0,
  checkL1,
  checkL2,
  checkL3,

  // Comprehensive check
  checkAllLaws,
  formatLawCheck,

  // Patterns (for testing/extension)
  L0_VIOLATION_PATTERNS,
  L1_VIOLATION_PATTERNS,
};
