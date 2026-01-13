/**
 * CYNIC-SCORE - Score Calculation & Output Formatting
 *
 * World: ASSIAH (Action)
 * Model: Haiku (fast, cheap)
 * Latency Target: <50ms
 *
 * "Les chiffres ne mentent pas, mais leur présentation peut éclairer"
 *
 * Responsibilities:
 * 1. Calculate global score from dimensions
 * 2. Format output based on technical_depth (UX organique)
 * 3. Generate verdict (ACCEPT/TRANSFORM/REJECT)
 * 4. Detect tensions between dimensions
 *
 * @philosophy UX Organique - pas de niveaux discrets, adaptation continue
 */

'use strict';

// φ constants - Import from Single Source of Truth
const {
  PHI,
  PHI_2,
  PHI_3,
  PHI_SQ,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  AXIOM_WEIGHTS,
  LUCAS_BURN,
  TOTAL_WEIGHT_42,
} = require('./axioms/constants');

// =============================================================================
// DIMENSION WEIGHTS - Unified AXIOM-based Architecture
// =============================================================================
//
// Architecture: DIMENSION → AXIOM → WEIGHT
// Total: 6 dimensions × 4 axioms = 24 dimensions
// Total weight: 6 × L₄ = 6 × 7 = 42 (Lucas number)
//
// Weights per axiom:
//   PHI (ATZILUT):     φ² = 2.618
//   VERIFY (BERIAH):   φ  = 1.618
//   CULTURE (YETZIRAH): φ  = 1.618
//   BURN (ASSIAH):     1 + φ⁻⁴ = 1.146
//
// Sum per group: φ² + φ + φ + (1+φ⁻⁴) = 7 = L₄
// Total: 6 × 7 = 42

/**
 * The 24 dimensions with AXIOM-derived weights
 * Total weight = 42
 */
const DIMENSIONS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // PHI (ATZILUT) - Essence - 6 dims × φ² = 15.708
  // ═══════════════════════════════════════════════════════════════════════════
  HARMONY:        { weight: AXIOM_WEIGHTS.PHI, axiom: 'PHI', world: 'ATZILUT', index: 0 },
  COHERENCE:      { weight: AXIOM_WEIGHTS.PHI, axiom: 'PHI', world: 'ATZILUT', index: 1 },
  MEMORY:         { weight: AXIOM_WEIGHTS.PHI, axiom: 'PHI', world: 'ATZILUT', index: 2 },
  TEACHING:       { weight: AXIOM_WEIGHTS.PHI, axiom: 'PHI', world: 'ATZILUT', index: 3 },
  SIMPLIFY:       { weight: AXIOM_WEIGHTS.PHI, axiom: 'PHI', world: 'ATZILUT', index: 4 },
  SELF_AWARENESS: { weight: AXIOM_WEIGHTS.PHI, axiom: 'PHI', world: 'ATZILUT', index: 5 },

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFY (BERIAH) - Economics/Verification - 6 dims × φ = 9.708
  // ═══════════════════════════════════════════════════════════════════════════
  TRUTH:     { weight: AXIOM_WEIGHTS.VERIFY, axiom: 'VERIFY', world: 'BERIAH', index: 6 },
  INTEGRITY: { weight: AXIOM_WEIGHTS.VERIFY, axiom: 'VERIFY', world: 'BERIAH', index: 7 },
  SECURE:    { weight: AXIOM_WEIGHTS.VERIFY, axiom: 'VERIFY', world: 'BERIAH', index: 8 },
  PRIVATE:   { weight: AXIOM_WEIGHTS.VERIFY, axiom: 'VERIFY', world: 'BERIAH', index: 9 },
  INTENT:    { weight: AXIOM_WEIGHTS.VERIFY, axiom: 'VERIFY', world: 'BERIAH', index: 10 },
  TRUST:     { weight: AXIOM_WEIGHTS.VERIFY, axiom: 'VERIFY', world: 'BERIAH', index: 11 },

  // ═══════════════════════════════════════════════════════════════════════════
  // CULTURE (YETZIRAH) - Ethics/Formation - 6 dims × φ = 9.708
  // ═══════════════════════════════════════════════════════════════════════════
  ETHICS:          { weight: AXIOM_WEIGHTS.CULTURE, axiom: 'CULTURE', world: 'YETZIRAH', index: 12 },
  OPTIMISM:        { weight: AXIOM_WEIGHTS.CULTURE, axiom: 'CULTURE', world: 'YETZIRAH', index: 13 },
  ENABLE:          { weight: AXIOM_WEIGHTS.CULTURE, axiom: 'CULTURE', world: 'YETZIRAH', index: 14 },
  PROACTIVITY:     { weight: AXIOM_WEIGHTS.CULTURE, axiom: 'CULTURE', world: 'YETZIRAH', index: 15 },
  COMPLEMENTARITY: { weight: AXIOM_WEIGHTS.CULTURE, axiom: 'CULTURE', world: 'YETZIRAH', index: 16 },
  DELEGATION:      { weight: AXIOM_WEIGHTS.CULTURE, axiom: 'CULTURE', world: 'YETZIRAH', index: 17 },

  // ═══════════════════════════════════════════════════════════════════════════
  // BURN (ASSIAH) - Operation/Action - 6 dims × (1+φ⁻⁴) = 6.875
  // ═══════════════════════════════════════════════════════════════════════════
  ALIGNMENT:           { weight: AXIOM_WEIGHTS.BURN, axiom: 'BURN', world: 'ASSIAH', index: 18 },
  PROGRESS:            { weight: AXIOM_WEIGHTS.BURN, axiom: 'BURN', world: 'ASSIAH', index: 19 },
  SCALE:               { weight: AXIOM_WEIGHTS.BURN, axiom: 'BURN', world: 'ASSIAH', index: 20 },
  BOUNDARIES:          { weight: AXIOM_WEIGHTS.BURN, axiom: 'BURN', world: 'ASSIAH', index: 21 },
  SINGULARITY_DISTANCE: { weight: AXIOM_WEIGHTS.BURN, axiom: 'BURN', world: 'ASSIAH', index: 22 },
  ADAPTATION_VELOCITY: { weight: AXIOM_WEIGHTS.BURN, axiom: 'BURN', world: 'ASSIAH', index: 23 },
};

// Total weight = 42 (imported from constants)
const TOTAL_WEIGHT = TOTAL_WEIGHT_42;

// =============================================================================
// SCORE CALCULATION
// =============================================================================

/**
 * Calculate global score using weighted geometric mean
 *
 * Formula: Score = (∏ dim_i^weight_i)^(1/Σweights)
 *        = exp(Σ(weight_i × ln(dim_i)) / Σweights)
 *
 * @param {Object} scores - { HARMONY: 75, TRUTH: 80, ... }
 * @returns {Object} - { global, breakdown, confidence }
 */
function calculateGlobalScore(scores) {
  const startTime = Date.now();

  // Validate and normalize scores
  const normalizedScores = {};
  let weightedLogSum = 0;
  let usedWeight = 0;
  const breakdown = [];

  for (const [dim, info] of Object.entries(DIMENSIONS)) {
    const score = scores[dim];

    if (score === undefined || score === null) {
      // Skip missing dimensions
      continue;
    }

    // Clamp to [1, 100] (avoid log(0))
    const clamped = Math.max(1, Math.min(100, score));
    normalizedScores[dim] = clamped;

    // Weighted log sum
    weightedLogSum += info.weight * Math.log(clamped);
    usedWeight += info.weight;

    breakdown.push({
      dimension: dim,
      score: clamped,
      weight: info.weight,
      axiom: info.axiom,
      world: info.world,
      contribution: info.weight * Math.log(clamped),
    });
  }

  // Calculate geometric mean
  const globalScore = usedWeight > 0
    ? Math.exp(weightedLogSum / usedWeight)
    : 0;

  // Confidence based on how many dimensions were scored
  const coverage = usedWeight / TOTAL_WEIGHT;
  const confidence = Math.min(PHI_INV * 100, coverage * 100); // Max 61.8%

  return {
    global: Math.round(globalScore * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    coverage: Math.round(coverage * 100) / 100,
    dimensionsScored: Object.keys(normalizedScores).length,
    totalDimensions: Object.keys(DIMENSIONS).length,
    breakdown: breakdown.sort((a, b) => b.contribution - a.contribution),
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Detect tensions between dimensions
 * Tension = high difference between correlated dimensions
 *
 * @param {Object} scores - Dimension scores
 * @param {Object} harmonyMatrix - H matrix (optional, defaults to null)
 * @returns {Array} - Array of tension objects
 */
function detectTensions(scores, harmonyMatrix = null) {
  const tensions = [];
  const dims = Object.keys(scores);

  for (let i = 0; i < dims.length; i++) {
    for (let j = i + 1; j < dims.length; j++) {
      const dim1 = dims[i];
      const dim2 = dims[j];
      const score1 = scores[dim1];
      const score2 = scores[dim2];

      const diff = Math.abs(score1 - score2);

      // Check if dimensions should be correlated
      const harmony = harmonyMatrix?.[dim1]?.[dim2] || 0;

      // Tension if high harmony but high difference
      // Or if same axiom but very different scores
      const sameAxiom = DIMENSIONS[dim1]?.axiom === DIMENSIONS[dim2]?.axiom;

      if ((harmony > 0.5 && diff > 20) || (sameAxiom && diff > 30)) {
        tensions.push({
          dimensions: [dim1, dim2],
          scores: [score1, score2],
          difference: diff,
          harmony,
          sameAxiom,
          severity: diff > 40 ? 'high' : diff > 25 ? 'medium' : 'low',
        });
      }
    }
  }

  return tensions.sort((a, b) => b.difference - a.difference);
}

/**
 * Determine verdict based on score and thresholds
 *
 * @param {number} globalScore - Global score (0-100)
 * @param {Object} options - { blockingDimensions, tensions }
 * @returns {Object} - { verdict, emoji, reason }
 */
function determineVerdict(globalScore, options = {}) {
  const { blockingDimensions = [], tensions = [] } = options;

  // Check for blocking dimensions (any dimension < 38.2%)
  if (blockingDimensions.length > 0) {
    return {
      verdict: 'TRANSFORM',
      emoji: '🔄',
      reason: `Blocking: ${blockingDimensions.map(b => b.dimension).join(', ')}`,
      blocking: blockingDimensions,
    };
  }

  // Check for high severity tensions
  const highTensions = tensions.filter(t => t.severity === 'high');
  if (highTensions.length > 0) {
    return {
      verdict: 'TRANSFORM',
      emoji: '⚡',
      reason: `Tensions: ${highTensions.map(t => t.dimensions.join('↔')).join(', ')}`,
      tensions: highTensions,
    };
  }

  // Score-based verdict
  if (globalScore >= PHI_INV * 100) {
    // ≥ 61.8%
    return {
      verdict: 'ACCEPT',
      emoji: '✅',
      reason: 'Score above φ⁻¹ threshold',
    };
  } else if (globalScore >= PHI_INV_2 * 100) {
    // ≥ 38.2%
    return {
      verdict: 'TRANSFORM',
      emoji: '🔄',
      reason: 'Score in warning zone (φ⁻² to φ⁻¹)',
    };
  } else if (globalScore >= PHI_INV_3 * 100) {
    // ≥ 23.6%
    return {
      verdict: 'CRITICAL',
      emoji: '⚠️',
      reason: 'Score in critical zone (φ⁻³ to φ⁻²)',
    };
  } else {
    return {
      verdict: 'REJECT',
      emoji: '❌',
      reason: 'Score below φ⁻³ threshold',
    };
  }
}

/**
 * Find blocking dimensions (score < threshold)
 *
 * @param {Object} scores - Dimension scores
 * @param {Object} thresholds - Custom thresholds (optional)
 * @returns {Array} - Blocking dimensions
 */
function findBlockingDimensions(scores, thresholds = {}) {
  const blocking = [];
  const defaultThreshold = PHI_INV_2 * 100; // 38.2%

  for (const [dim, score] of Object.entries(scores)) {
    const threshold = thresholds[dim] || defaultThreshold;
    if (score < threshold) {
      blocking.push({
        dimension: dim,
        score,
        threshold,
        deficit: threshold - score,
      });
    }
  }

  return blocking.sort((a, b) => b.deficit - a.deficit);
}

// =============================================================================
// UX ORGANIQUE - OUTPUT FORMATTING
// =============================================================================

/**
 * Calculate technical depth from input characteristics
 * Continuous 0.0 - 1.0, no discrete levels
 *
 * @param {Object} context - { vocabulary, questionDepth, history }
 * @returns {number} - Technical depth 0.0 to 1.0
 */
function calculateTechnicalDepth(context = {}) {
  const {
    vocabulary = 0.5,      // Vocabulary complexity 0-1
    questionDepth = 0.5,   // Question depth 0-1
    history = 0.5,         // Historical pattern 0-1
  } = context;

  // Weighted combination
  const raw = vocabulary * 0.4 + questionDepth * 0.4 + history * 0.2;

  // Sigmoid for smooth transitions
  // sigmoid(x) = 1 / (1 + exp(-5 × (x - 0.5)))
  const sigmoid = 1 / (1 + Math.exp(-5 * (raw - 0.5)));

  return Math.round(sigmoid * 1000) / 1000;
}

/**
 * Format score output based on technical depth
 * Organic adaptation - no discrete levels felt by user
 *
 * @param {Object} result - { global, confidence, verdict, breakdown, tensions }
 * @param {number} technicalDepth - 0.0 to 1.0
 * @returns {Object} - Formatted output
 */
function formatOutput(result, technicalDepth = 0.5) {
  const { global, confidence, verdict, breakdown, tensions } = result;

  // === LOW TECHNICAL DEPTH (< 0.3) ===
  // Simple emoji + short phrase
  if (technicalDepth < 0.3) {
    const emoji = global >= 62 ? '🟢' : global >= 38 ? '🟡' : '🔴';
    const phrase = global >= 62
      ? 'Ça a l\'air bon.'
      : global >= 38
        ? 'Quelques ajustements à faire.'
        : 'Attention, problèmes détectés.';

    return {
      format: 'simple',
      display: `${emoji} ${phrase}`,
      emoji,
      phrase,
      technicalDepth,
    };
  }

  // === MEDIUM TECHNICAL DEPTH (0.3 - 0.6) ===
  // Grade + percentage + summary
  if (technicalDepth < 0.6) {
    const grade = scoreToGrade(global);
    const summary = generateSummary(result);

    return {
      format: 'standard',
      display: `${grade} (${Math.round(global)}%) - ${summary}`,
      grade,
      percentage: Math.round(global),
      summary,
      verdict: verdict.verdict,
      technicalDepth,
    };
  }

  // === HIGH TECHNICAL DEPTH (>= 0.6) ===
  // Full details: score, dimensions, tensions
  const topDimensions = breakdown?.slice(0, 5) || [];
  const topTensions = tensions?.slice(0, 3) || [];

  return {
    format: 'detailed',
    display: formatDetailedDisplay(result),
    score: global,
    confidence,
    verdict: verdict.verdict,
    dimensions: topDimensions.map(d => ({
      name: d.dimension,
      score: d.score,
      weight: Math.round(d.weight * 100) / 100,
    })),
    tensions: topTensions.map(t => ({
      pair: t.dimensions.join('↔'),
      diff: t.difference,
      severity: t.severity,
    })),
    technicalDepth,
  };
}

/**
 * Convert score to letter grade
 *
 * @param {number} score - Score 0-100
 * @returns {string} - Letter grade
 */
function scoreToGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D+';
  if (score >= 40) return 'D';
  if (score >= 35) return 'D-';
  return 'F';
}

/**
 * Generate short summary based on result
 *
 * @param {Object} result - Score result
 * @returns {string} - Summary text
 */
function generateSummary(result) {
  const { verdict, tensions = [] } = result;

  if (verdict.verdict === 'ACCEPT') {
    return 'Solide sur les dimensions clés.';
  }

  if (verdict.blocking?.length > 0) {
    const dim = verdict.blocking[0].dimension;
    return `${dim} nécessite attention.`;
  }

  if (tensions.length > 0) {
    return 'Tensions internes à résoudre.';
  }

  if (verdict.verdict === 'CRITICAL') {
    return 'Plusieurs dimensions critiques.';
  }

  return 'Améliorations recommandées.';
}

/**
 * Format detailed display for high technical depth
 *
 * @param {Object} result - Full result
 * @returns {string} - Formatted string
 */
function formatDetailedDisplay(result) {
  const { global, confidence, verdict, breakdown, tensions } = result;

  let display = `Score: ${global.toFixed(1)} | Conf: ${confidence.toFixed(1)}% | ${verdict.emoji} ${verdict.verdict}`;

  if (breakdown?.length > 0) {
    const top3 = breakdown.slice(0, 3).map(d => `${d.dimension}:${d.score}`).join(', ');
    display += `\nTop: ${top3}`;
  }

  if (tensions?.length > 0) {
    const t = tensions[0];
    display += `\n⚡ Tension: ${t.dimensions.join('↔')} (Δ${t.difference})`;
  }

  return display;
}

// =============================================================================
// MAIN SCORE FUNCTION
// =============================================================================

/**
 * Main scoring function - calculates and formats output
 *
 * @param {Object} scores - Dimension scores { HARMONY: 75, ... }
 * @param {Object} options - { technicalDepth, harmonyMatrix, thresholds }
 * @returns {Object} - Complete scored result with formatting
 */
function score(scores, options = {}) {
  const startTime = Date.now();

  const {
    technicalDepth = 0.5,
    harmonyMatrix = null,
    thresholds = {},
    context = {},
  } = options;

  // Calculate technical depth if context provided
  const td = context.vocabulary !== undefined
    ? calculateTechnicalDepth(context)
    : technicalDepth;

  // Calculate global score
  const scoreResult = calculateGlobalScore(scores);

  // Detect tensions
  const tensions = detectTensions(scores, harmonyMatrix);

  // Find blocking dimensions
  const blocking = findBlockingDimensions(scores, thresholds);

  // Determine verdict
  const verdict = determineVerdict(scoreResult.global, {
    blockingDimensions: blocking,
    tensions,
  });

  // Build full result
  const result = {
    ...scoreResult,
    tensions,
    blocking,
    verdict,
  };

  // Format output based on technical depth
  const formatted = formatOutput(result, td);

  return {
    // Core
    global: scoreResult.global,
    confidence: scoreResult.confidence,
    verdict: verdict.verdict,
    verdictEmoji: verdict.emoji,

    // Details
    breakdown: scoreResult.breakdown,
    tensions,
    blocking,

    // Formatted output
    formatted,
    technicalDepth: td,

    // Thresholds (for reference)
    thresholds: {
      accept: Math.round(PHI_INV * 100),     // 62
      warning: Math.round(PHI_INV_2 * 100),  // 38
      critical: Math.round(PHI_INV_3 * 100), // 24
    },

    // Performance
    latencyMs: Date.now() - startTime,
    scorer: 'CYNIC-SCORE',
    world: 'ASSIAH',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main function
  score,

  // Calculation
  calculateGlobalScore,
  detectTensions,
  determineVerdict,
  findBlockingDimensions,

  // UX Organique
  calculateTechnicalDepth,
  formatOutput,
  scoreToGrade,

  // Data (24 dimensions, total weight = 42)
  DIMENSIONS,
  TOTAL_WEIGHT,
  AXIOM_WEIGHTS,

  // Constants (re-exported from axioms/constants.js)
  PHI,
  PHI_2,
  PHI_3,
  PHI_SQ,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  LUCAS_BURN,
};
