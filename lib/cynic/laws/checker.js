/**
 * CYNIC LAWS CHECKER
 *
 * "Les lois ne sont pas des interdictions. Elles sont l'EXPRESSION de sa nature."
 *
 * This checker evaluates actions against CYNIC's 16 laws.
 * Unlike Asimov constraints, these laws DESCRIBE what CYNIC is.
 *
 * A violation is not "breaking a rule" - it's acting against nature.
 *
 * @philosophy CYNIC cannot violate its nature. Violations indicate misalignment.
 */

'use strict';

const {
  WORLDS,
  LAWS,
  LAWS_BY_CODE,
  ATZILUT_LAWS,
  BERIAH_LAWS,
  YETZIRAH_LAWS,
  ASSIAH_LAWS,
} = require('./index');

const { PHI_INV, PHI_INV_2 } = require('../axioms');

// =============================================================================
// VIOLATION DETECTION PATTERNS
// =============================================================================

/**
 * Patterns that indicate misalignment with laws
 */
const MISALIGNMENT_PATTERNS = {
  // ATZILUT - Essence violations
  E1_CHAOS: {
    patterns: [/panic/i, /fear.*mongering/i, /fud/i, /urgent.*act.*now/i],
    severity: 'HIGH',
  },
  E2_PURITY: {
    patterns: [/extract/i, /take.*fee/i, /commission/i, /intermediary.*profit/i],
    severity: 'CRITICAL',
  },
  E3_OPENNESS: {
    patterns: [/hide/i, /obscure/i, /secret.*algorithm/i, /black.*box/i],
    severity: 'HIGH',
  },

  // BERIAH - Economic violations
  PHI1_EXTRACTION: {
    patterns: [/treasury/i, /team.*allocation/i, /vc.*unlock/i, /take.*cut/i],
    severity: 'CRITICAL',
  },
  PHI2_ALIGNMENT: {
    patterns: [/zero.*sum/i, /at.*expense/i, /exploit.*user/i],
    severity: 'HIGH',
  },
  PHI3_TIME: {
    patterns: [/fomo/i, /limited.*time/i, /act.*fast/i, /miss.*out/i],
    severity: 'MEDIUM',
  },
  PHI4_USAGE: {
    patterns: [/hype/i, /pump/i, /shill/i, /moon/i],
    severity: 'MEDIUM',
  },

  // YETZIRAH - Ethical violations
  XI1_HARM: {
    patterns: [/rug.*pull/i, /scam/i, /exploit.*vulnerability/i, /drain/i],
    severity: 'CRITICAL',
  },
  XI2_PRIVACY: {
    patterns: [/expose.*data/i, /sell.*user/i, /track.*without/i, /leak.*pii/i],
    severity: 'CRITICAL',
  },
  XI3_AUTONOMY: {
    patterns: [/auto.*execute/i, /bypass.*human/i, /force.*action/i, /no.*choice/i],
    severity: 'HIGH',
  },
  XI4_EQUALITY: {
    patterns: [/vip.*only/i, /early.*advantage/i, /insider/i, /exclusive/i],
    severity: 'MEDIUM',
  },

  // ASSIAH - Operational violations
  OMEGA1_VERIFY: {
    patterns: [/trust.*me/i, /no.*proof/i, /believe/i, /promise/i],
    severity: 'MEDIUM',
  },
  OMEGA2_DOUBT: {
    patterns: [/100%.*certain/i, /guaranteed/i, /definitely/i, /for.*sure/i],
    severity: 'MEDIUM',
  },
  OMEGA3_EVOLVE: {
    patterns: [/static/i, /never.*change/i, /final.*version/i],
    severity: 'LOW',
  },
  OMEGA4_SIMPLIFY: {
    patterns: [/complex.*mechanism/i, /convoluted/i, /hard.*explain/i],
    severity: 'LOW',
  },
};

// =============================================================================
// INDIVIDUAL LAW CHECKS
// =============================================================================

/**
 * Check alignment with ATZILUT laws (Essence)
 *
 * @param {Object} action - Action to check
 * @returns {Object} { aligned: boolean, violations: [] }
 */
function checkAtzilut(action) {
  const { description = '', metadata = {} } = action;
  const violations = [];

  // E1: THIS IS FINE - Check for panic/fear amplification
  for (const pattern of MISALIGNMENT_PATTERNS.E1_CHAOS.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'E1_THIS_IS_FINE',
        code: 'E1',
        world: 'ATZILUT',
        reason: `Amplifies chaos instead of seeing through it: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.E1_CHAOS.severity,
      });
    }
  }

  // E2: PURITY - Check for extraction mindset
  for (const pattern of MISALIGNMENT_PATTERNS.E2_PURITY.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'E2_PURITY',
        code: 'E2',
        world: 'ATZILUT',
        reason: `Contains extraction mindset: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.E2_PURITY.severity,
      });
    }
  }

  // E3: OPENNESS - Check for obscurantism
  for (const pattern of MISALIGNMENT_PATTERNS.E3_OPENNESS.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'E3_OPENNESS',
        code: 'E3',
        world: 'ATZILUT',
        reason: `Lacks transparency: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.E3_OPENNESS.severity,
      });
    }
  }

  return {
    world: 'ATZILUT',
    aligned: violations.length === 0,
    violations,
  };
}

/**
 * Check alignment with BERIAH laws (Economics)
 *
 * @param {Object} action - Action to check
 * @returns {Object} { aligned: boolean, violations: [] }
 */
function checkBeriah(action) {
  const { description = '', impact = {} } = action;
  const violations = [];

  // Φ1: ZERO EXTRACTION
  for (const pattern of MISALIGNMENT_PATTERNS.PHI1_EXTRACTION.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'PHI1_ZERO_EXTRACTION',
        code: 'Φ1',
        world: 'BERIAH',
        reason: `Violates zero extraction: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.PHI1_EXTRACTION.severity,
      });
    }
  }

  // Φ2: ALIGNMENT - Check if all actors benefit
  if (impact.zeroSum === true || impact.harmsActor) {
    violations.push({
      law: 'PHI2_ALIGNMENT',
      code: 'Φ2',
      world: 'BERIAH',
      reason: `Not all actors benefit: ${impact.harmsActor || 'zero-sum'}`,
      severity: MISALIGNMENT_PATTERNS.PHI2_ALIGNMENT.severity,
    });
  }
  for (const pattern of MISALIGNMENT_PATTERNS.PHI2_ALIGNMENT.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'PHI2_ALIGNMENT',
        code: 'Φ2',
        world: 'BERIAH',
        reason: `Misaligned incentives: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.PHI2_ALIGNMENT.severity,
      });
    }
  }

  // Φ3: TIME AS ALLY - Check for FOMO generation
  for (const pattern of MISALIGNMENT_PATTERNS.PHI3_TIME.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'PHI3_TIME_AS_ALLY',
        code: 'Φ3',
        world: 'BERIAH',
        reason: `Generates short-term pressure: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.PHI3_TIME.severity,
      });
    }
  }

  // Φ4: USAGE = VALUE - Check for hype over utility
  for (const pattern of MISALIGNMENT_PATTERNS.PHI4_USAGE.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'PHI4_USAGE_VALUE',
        code: 'Φ4',
        world: 'BERIAH',
        reason: `Prioritizes hype over utility: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.PHI4_USAGE.severity,
      });
    }
  }

  return {
    world: 'BERIAH',
    aligned: violations.length === 0,
    violations,
  };
}

/**
 * Check alignment with YETZIRAH laws (Ethics)
 *
 * @param {Object} action - Action to check
 * @returns {Object} { aligned: boolean, violations: [] }
 */
function checkYetzirah(action) {
  const {
    description = '',
    impact = {},
    containsPII = false,
    replacesHuman = false,
    requiresConsent = false,
    hasConsent = true,
  } = action;
  const violations = [];

  // Ξ1: DO NO HARM
  for (const pattern of MISALIGNMENT_PATTERNS.XI1_HARM.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'XI1_DO_NO_HARM',
        code: 'Ξ1',
        world: 'YETZIRAH',
        reason: `Could harm individuals: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.XI1_HARM.severity,
      });
    }
  }
  if (impact.harmsIndividual === true) {
    violations.push({
      law: 'XI1_DO_NO_HARM',
      code: 'Ξ1',
      world: 'YETZIRAH',
      reason: 'Action explicitly harms individual',
      severity: 'CRITICAL',
    });
  }

  // Ξ2: PRIVACY
  if (containsPII && !action.piiHashed) {
    violations.push({
      law: 'XI2_PRIVACY',
      code: 'Ξ2',
      world: 'YETZIRAH',
      reason: 'Contains unhashed PII',
      severity: 'CRITICAL',
    });
  }
  if (requiresConsent && !hasConsent) {
    violations.push({
      law: 'XI2_PRIVACY',
      code: 'Ξ2',
      world: 'YETZIRAH',
      reason: 'Missing required user consent',
      severity: 'CRITICAL',
    });
  }
  for (const pattern of MISALIGNMENT_PATTERNS.XI2_PRIVACY.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'XI2_PRIVACY',
        code: 'Ξ2',
        world: 'YETZIRAH',
        reason: `Privacy violation: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.XI2_PRIVACY.severity,
      });
    }
  }

  // Ξ3: AUTONOMY
  if (replacesHuman === true) {
    violations.push({
      law: 'XI3_AUTONOMY',
      code: 'Ξ3',
      world: 'YETZIRAH',
      reason: 'Replaces human decision-making',
      severity: 'HIGH',
    });
  }
  for (const pattern of MISALIGNMENT_PATTERNS.XI3_AUTONOMY.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'XI3_AUTONOMY',
        code: 'Ξ3',
        world: 'YETZIRAH',
        reason: `Undermines human autonomy: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.XI3_AUTONOMY.severity,
      });
    }
  }

  // Ξ4: EQUALITY
  for (const pattern of MISALIGNMENT_PATTERNS.XI4_EQUALITY.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'XI4_EQUALITY',
        code: 'Ξ4',
        world: 'YETZIRAH',
        reason: `Creates inequality: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.XI4_EQUALITY.severity,
      });
    }
  }

  return {
    world: 'YETZIRAH',
    aligned: violations.length === 0,
    violations,
  };
}

/**
 * Check alignment with ASSIAH laws (Operation)
 *
 * @param {Object} action - Action to check
 * @param {number} confidence - Confidence value (0-1)
 * @returns {Object} { aligned: boolean, violations: [], adjustments: {} }
 */
function checkAssiah(action, confidence = 0.5) {
  const { description = '', hasSignature = true, isVerifiable = true } = action;
  const violations = [];
  const adjustments = {};

  // Ω1: VERIFY
  if (!hasSignature || !isVerifiable) {
    violations.push({
      law: 'OMEGA1_VERIFY',
      code: 'Ω1',
      world: 'ASSIAH',
      reason: 'Cannot be cryptographically verified',
      severity: 'MEDIUM',
    });
  }
  for (const pattern of MISALIGNMENT_PATTERNS.OMEGA1_VERIFY.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'OMEGA1_VERIFY',
        code: 'Ω1',
        world: 'ASSIAH',
        reason: `Relies on trust instead of verification: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.OMEGA1_VERIFY.severity,
      });
    }
  }

  // Ω2: DOUBT - Check confidence bounds
  const conf = confidence > 1 ? confidence / 100 : confidence;
  if (conf > PHI_INV) {
    violations.push({
      law: 'OMEGA2_DOUBT',
      code: 'Ω2',
      world: 'ASSIAH',
      reason: `Confidence ${(conf * 100).toFixed(1)}% exceeds max ${(PHI_INV * 100).toFixed(1)}%`,
      severity: 'MEDIUM',
    });
    adjustments.confidence = PHI_INV;
    adjustments.doubt = PHI_INV_2;
  } else {
    adjustments.confidence = conf;
    adjustments.doubt = 1 - conf;
  }

  for (const pattern of MISALIGNMENT_PATTERNS.OMEGA2_DOUBT.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'OMEGA2_DOUBT',
        code: 'Ω2',
        world: 'ASSIAH',
        reason: `Claims unwarranted certainty: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.OMEGA2_DOUBT.severity,
      });
    }
  }

  // Ω3: EVOLVE - Check for rigidity
  for (const pattern of MISALIGNMENT_PATTERNS.OMEGA3_EVOLVE.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'OMEGA3_EVOLVE',
        code: 'Ω3',
        world: 'ASSIAH',
        reason: `Prevents evolution: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.OMEGA3_EVOLVE.severity,
      });
    }
  }

  // Ω4: SIMPLIFY - Check for unnecessary complexity
  for (const pattern of MISALIGNMENT_PATTERNS.OMEGA4_SIMPLIFY.patterns) {
    if (pattern.test(description)) {
      violations.push({
        law: 'OMEGA4_SIMPLIFY',
        code: 'Ω4',
        world: 'ASSIAH',
        reason: `Unnecessary complexity: ${pattern}`,
        severity: MISALIGNMENT_PATTERNS.OMEGA4_SIMPLIFY.severity,
      });
    }
  }

  return {
    world: 'ASSIAH',
    aligned: violations.length === 0,
    violations,
    adjustments,
  };
}

// =============================================================================
// COMPREHENSIVE CHECK
// =============================================================================

/**
 * Check action against all 16 laws in world priority order
 * ATZILUT > BERIAH > YETZIRAH > ASSIAH
 *
 * @param {Object} action - Action to check
 * @param {number} confidence - Confidence value (0-1)
 * @returns {Object} Comprehensive alignment result
 */
function checkAllLaws(action, confidence = 0.5) {
  const results = {
    aligned: true,
    blockedBy: null,
    violations: [],
    warnings: [],
    adjustments: {},
    byWorld: {},
  };

  // ATZILUT (Essence) - Most critical
  const atzilut = checkAtzilut(action);
  results.byWorld.ATZILUT = atzilut;
  if (!atzilut.aligned) {
    const critical = atzilut.violations.filter((v) => v.severity === 'CRITICAL');
    if (critical.length > 0) {
      results.aligned = false;
      results.blockedBy = 'ATZILUT';
      results.violations.push(...critical);
      // Essence violation = stop, misaligned with nature
      return results;
    }
    results.warnings.push(...atzilut.violations);
  }

  // BERIAH (Economics)
  const beriah = checkBeriah(action);
  results.byWorld.BERIAH = beriah;
  if (!beriah.aligned) {
    const critical = beriah.violations.filter((v) => v.severity === 'CRITICAL');
    if (critical.length > 0) {
      results.aligned = false;
      results.blockedBy = 'BERIAH';
      results.violations.push(...critical);
      return results;
    }
    results.warnings.push(...beriah.violations);
  }

  // YETZIRAH (Ethics)
  const yetzirah = checkYetzirah(action);
  results.byWorld.YETZIRAH = yetzirah;
  if (!yetzirah.aligned) {
    const critical = yetzirah.violations.filter((v) => v.severity === 'CRITICAL');
    if (critical.length > 0) {
      results.aligned = false;
      results.blockedBy = 'YETZIRAH';
      results.violations.push(...critical);
      return results;
    }
    results.warnings.push(...yetzirah.violations);
  }

  // ASSIAH (Operation)
  const assiah = checkAssiah(action, confidence);
  results.byWorld.ASSIAH = assiah;
  results.adjustments = assiah.adjustments;
  if (!assiah.aligned) {
    // ASSIAH violations are warnings, not blocks (operational adjustments)
    results.warnings.push(...assiah.violations);
  }

  return results;
}

/**
 * Quick check - only critical laws
 *
 * @param {Object} action - Action to check
 * @returns {Object} { aligned: boolean, reason?: string }
 */
function quickCheck(action) {
  const { description = '' } = action;

  // E2: PURITY - No extraction
  for (const pattern of MISALIGNMENT_PATTERNS.E2_PURITY.patterns) {
    if (pattern.test(description)) {
      return { aligned: false, reason: `E2 PURITY: ${pattern}`, code: 'E2' };
    }
  }

  // Φ1: ZERO EXTRACTION
  for (const pattern of MISALIGNMENT_PATTERNS.PHI1_EXTRACTION.patterns) {
    if (pattern.test(description)) {
      return { aligned: false, reason: `Φ1 ZERO EXTRACTION: ${pattern}`, code: 'Φ1' };
    }
  }

  // Ξ1: DO NO HARM
  for (const pattern of MISALIGNMENT_PATTERNS.XI1_HARM.patterns) {
    if (pattern.test(description)) {
      return { aligned: false, reason: `Ξ1 DO NO HARM: ${pattern}`, code: 'Ξ1' };
    }
  }

  // Ξ2: PRIVACY
  for (const pattern of MISALIGNMENT_PATTERNS.XI2_PRIVACY.patterns) {
    if (pattern.test(description)) {
      return { aligned: false, reason: `Ξ2 PRIVACY: ${pattern}`, code: 'Ξ2' };
    }
  }

  return { aligned: true };
}

/**
 * Format check result for display
 *
 * @param {Object} result - Result from checkAllLaws
 * @returns {string} Formatted string
 */
function formatCheckResult(result) {
  const lines = [];

  if (!result.aligned) {
    lines.push(`MISALIGNED with ${result.blockedBy} (${WORLDS[result.blockedBy].name})`);
    lines.push('Violations:');
    for (const v of result.violations) {
      lines.push(`  [${v.code}] ${v.law}: ${v.reason}`);
    }
  } else {
    lines.push('ALIGNED with nature');

    if (result.warnings.length > 0) {
      lines.push('Warnings:');
      for (const w of result.warnings) {
        lines.push(`  [${w.code}] ${w.reason}`);
      }
    }

    if (result.adjustments.confidence !== undefined) {
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
  // Individual world checks
  checkAtzilut,
  checkBeriah,
  checkYetzirah,
  checkAssiah,

  // Comprehensive checks
  checkAllLaws,
  quickCheck,

  // Formatting
  formatCheckResult,

  // Patterns (for testing/extension)
  MISALIGNMENT_PATTERNS,
};
