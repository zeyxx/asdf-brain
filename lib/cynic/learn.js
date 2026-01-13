/**
 * CYNIC-LEARN - Feedback Processing & Matrix Evolution
 *
 * World: BERIAH (Creation)
 * Model: Sonnet (balanced learning)
 * Latency Target: <500ms
 *
 * "Le chien qui apprend de ses erreurs"
 *
 * Responsibilities:
 * 1. Process judgment outcomes (correct/incorrect/partial)
 * 2. Update H matrix (dimension correlations)
 * 3. Calibrate T matrix (thresholds)
 * 4. Track learning evolution (E-Score)
 * 5. Detect learning patterns
 *
 * @philosophy L3: Évoluer vers la singularité (mais jamais l'atteindre)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { updateHarmony, calibrateThreshold, getMatrixStats } = require('./matrix');

// φ constants - Import from Single Source of Truth (FIXED 2026-01-13)
const { PHI, PHI_INV, PHI_INV_2 } = require('./axioms/constants');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Paths
  LEARNING_DIR: path.join(__dirname, '../../knowledge/cynic/learning'),
  OUTCOMES_FILE: 'outcomes.jsonl',
  EVOLUTION_FILE: 'evolution.json',
  ESCORE_FILE: 'escores.json',

  // Learning rates (φ-based)
  LEARNING_RATES: {
    correct: PHI_INV_2,      // 0.382 - conservative reinforcement
    incorrect: PHI_INV,       // 0.618 - stronger correction
    partial: PHI_INV_2 / 2,   // 0.191 - mild adjustment
  },

  // E-Score decay
  ESCORE_DECAY: {
    halfLifeDays: 7,          // Weekly half-life
    decayRate: PHI_INV,       // φ⁻¹ per period
  },

  // Outcome weights for E-Score
  OUTCOME_WEIGHTS: {
    correct: 1.0,
    partial: 0.5,
    incorrect: -0.5,
    harmful: -2.0,
  },

  // Learning thresholds
  MIN_OUTCOMES_FOR_CALIBRATION: 3,
  MAX_HISTORY_SIZE: 1000,
};

// =============================================================================
// IN-MEMORY STATE
// =============================================================================

// Recent outcomes buffer
let outcomeBuffer = [];

// Learning statistics
let learningStats = {
  totalOutcomes: 0,
  correct: 0,
  incorrect: 0,
  partial: 0,
  lastLearned: null,
  sessionsActive: 0,
};

// =============================================================================
// OUTCOME PROCESSING
// =============================================================================

/**
 * Outcome types
 */
const OUTCOME_TYPES = {
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
  PARTIAL: 'partial',
  HARMFUL: 'harmful',
  UNKNOWN: 'unknown',
};

/**
 * Process a judgment outcome for learning
 *
 * @param {Object} judgment - Original judgment result
 * @param {string} outcome - Outcome type (correct/incorrect/partial/harmful)
 * @param {Object} details - Additional details { reason, corrections, feedback }
 * @returns {Object} - Learning result
 */
function processOutcome(judgment, outcome, details = {}) {
  const startTime = Date.now();

  // Validate outcome
  if (!Object.values(OUTCOME_TYPES).includes(outcome)) {
    return { error: `Invalid outcome type: ${outcome}` };
  }

  // Extract judgment info
  const {
    dimensions = {},
    global = 50,
    verdict = 'UNKNOWN',
    technicalDepth = 0.5,
  } = judgment;

  // Create outcome record
  const outcomeRecord = {
    id: generateOutcomeId(),
    timestamp: Date.now(),
    outcome,
    details: {
      reason: details.reason || null,
      corrections: details.corrections || null,
      feedback: details.feedback || null,
    },
    judgment: {
      global,
      verdict,
      technicalDepth,
      dimensionCount: Object.keys(dimensions).length,
    },
    dimensions,
  };

  // Update learning stats
  learningStats.totalOutcomes++;
  learningStats[outcome] = (learningStats[outcome] || 0) + 1;
  learningStats.lastLearned = Date.now();

  // Buffer the outcome
  outcomeBuffer.push(outcomeRecord);

  // Process learning updates
  const learningResults = {
    harmony: null,
    thresholds: [],
    escore: null,
  };

  // 1. Update Harmony matrix if we have dimension scores
  if (Object.keys(dimensions).length >= 2) {
    learningResults.harmony = updateHarmony(dimensions);
  }

  // 2. Calibrate thresholds based on outcome
  if (outcome !== OUTCOME_TYPES.UNKNOWN) {
    const calibrationOutcome = mapOutcomeToCalibration(outcome, verdict);

    // Calibrate dimensions that were evaluated
    for (const dim of Object.keys(dimensions)) {
      const result = calibrateThreshold(dim, calibrationOutcome, 'warning');
      if (result.success) {
        learningResults.thresholds.push(result);
      }
    }
  }

  // 3. Update E-Score for source (if provided)
  if (details.sourceId) {
    learningResults.escore = updateEScore(details.sourceId, outcome, global);
  }

  // Persist outcome
  persistOutcome(outcomeRecord);

  // Check for learning patterns
  const patterns = detectLearningPatterns();

  return {
    success: true,
    outcomeId: outcomeRecord.id,
    outcome,
    learning: learningResults,
    patterns,
    stats: {
      totalOutcomes: learningStats.totalOutcomes,
      accuracy: calculateAccuracy(),
    },
    latencyMs: Date.now() - startTime,
    learner: 'CYNIC-LEARN',
    world: 'BERIAH',
  };
}

/**
 * Map outcome to calibration type
 */
function mapOutcomeToCalibration(outcome, verdict) {
  // If CYNIC said ACCEPT and it was wrong → false_positive
  // If CYNIC said TRANSFORM and it was wrong → false_negative
  // If correct → correct

  if (outcome === OUTCOME_TYPES.CORRECT) {
    return 'correct';
  }

  if (outcome === OUTCOME_TYPES.INCORRECT || outcome === OUTCOME_TYPES.HARMFUL) {
    if (verdict === 'ACCEPT') {
      return 'false_positive'; // Accepted something bad
    } else {
      return 'false_negative'; // Rejected something good
    }
  }

  if (outcome === OUTCOME_TYPES.PARTIAL) {
    return 'correct'; // Partial is still learning
  }

  return 'correct';
}

/**
 * Generate unique outcome ID
 */
function generateOutcomeId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `out_${timestamp}_${random}`;
}

// =============================================================================
// E-SCORE MANAGEMENT
// =============================================================================

/**
 * E-Score: Contribution score for sources/users
 * Formula: E = Σ(judgment_score × outcome_weight × φ^(-age_days/7))
 */

/**
 * Load E-Scores from file
 */
function loadEScores() {
  const filePath = path.join(CONFIG.LEARNING_DIR, CONFIG.ESCORE_FILE);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return { scores: {}, lastUpdated: null };
}

/**
 * Save E-Scores to file
 */
function saveEScores(escores) {
  ensureLearningDir();
  const filePath = path.join(CONFIG.LEARNING_DIR, CONFIG.ESCORE_FILE);
  escores.lastUpdated = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(escores, null, 2));
}

/**
 * Update E-Score for a source
 *
 * @param {string} sourceId - Source identifier
 * @param {string} outcome - Outcome type
 * @param {number} judgmentScore - Original judgment score
 * @returns {Object} - Updated E-Score info
 */
function updateEScore(sourceId, outcome, judgmentScore) {
  const escores = loadEScores();

  // Initialize if new
  if (!escores.scores[sourceId]) {
    escores.scores[sourceId] = {
      total: 0,
      contributions: [],
      created: Date.now(),
    };
  }

  const source = escores.scores[sourceId];

  // Calculate contribution
  const weight = CONFIG.OUTCOME_WEIGHTS[outcome] || 0;
  const contribution = (judgmentScore / 100) * weight;

  // Add contribution
  source.contributions.push({
    timestamp: Date.now(),
    outcome,
    judgmentScore,
    contribution,
  });

  // Keep only recent contributions
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
  source.contributions = source.contributions.filter(c => c.timestamp > cutoff);

  // Recalculate total with decay
  source.total = calculateDecayedEScore(source.contributions);

  // Save
  saveEScores(escores);

  return {
    sourceId,
    newTotal: Math.round(source.total * 100) / 100,
    contribution: Math.round(contribution * 100) / 100,
    contributionCount: source.contributions.length,
  };
}

/**
 * Calculate E-Score with φ-decay
 */
function calculateDecayedEScore(contributions) {
  const now = Date.now();
  let total = 0;

  for (const c of contributions) {
    const ageDays = (now - c.timestamp) / (24 * 60 * 60 * 1000);
    const decay = Math.pow(PHI_INV, ageDays / 7); // φ⁻¹ per week
    total += c.contribution * decay;
  }

  return total;
}

/**
 * Get E-Score for a source
 */
function getEScore(sourceId) {
  const escores = loadEScores();
  const source = escores.scores[sourceId];

  if (!source) {
    return { sourceId, total: 0, tier: 'new' };
  }

  // Recalculate with decay
  const total = calculateDecayedEScore(source.contributions);

  // Determine tier
  let tier = 'new';
  if (total >= 100) tier = 'trusted';
  else if (total >= 50) tier = 'established';
  else if (total >= 10) tier = 'active';
  else if (total > 0) tier = 'new';
  else if (total < -10) tier = 'suspect';
  else if (total < -50) tier = 'flagged';

  return {
    sourceId,
    total: Math.round(total * 100) / 100,
    tier,
    contributionCount: source.contributions.length,
    created: source.created,
  };
}

// =============================================================================
// LEARNING PATTERNS
// =============================================================================

/**
 * Detect patterns in recent learning
 */
function detectLearningPatterns() {
  const patterns = [];
  const recentOutcomes = outcomeBuffer.slice(-50);

  if (recentOutcomes.length < 5) {
    return patterns;
  }

  // Pattern 1: High error rate on specific dimension
  const dimErrors = {};
  for (const o of recentOutcomes) {
    if (o.outcome === OUTCOME_TYPES.INCORRECT || o.outcome === OUTCOME_TYPES.HARMFUL) {
      for (const dim of Object.keys(o.dimensions || {})) {
        dimErrors[dim] = (dimErrors[dim] || 0) + 1;
      }
    }
  }

  for (const [dim, count] of Object.entries(dimErrors)) {
    if (count >= 3) {
      patterns.push({
        type: 'HIGH_ERROR_DIMENSION',
        dimension: dim,
        count,
        suggestion: `Consider recalibrating ${dim} thresholds`,
      });
    }
  }

  // Pattern 2: Declining accuracy
  const recent10 = recentOutcomes.slice(-10);
  const older10 = recentOutcomes.slice(-20, -10);

  if (recent10.length >= 5 && older10.length >= 5) {
    const recentAccuracy = recent10.filter(o => o.outcome === OUTCOME_TYPES.CORRECT).length / recent10.length;
    const olderAccuracy = older10.filter(o => o.outcome === OUTCOME_TYPES.CORRECT).length / older10.length;

    if (recentAccuracy < olderAccuracy - 0.2) {
      patterns.push({
        type: 'DECLINING_ACCURACY',
        recentAccuracy: Math.round(recentAccuracy * 100),
        olderAccuracy: Math.round(olderAccuracy * 100),
        suggestion: 'Review recent calibrations',
      });
    }
  }

  // Pattern 3: Consensus formation (same outcomes from multiple sources)
  // (Would need source tracking to implement fully)

  return patterns;
}

/**
 * Calculate current accuracy
 */
function calculateAccuracy() {
  const total = learningStats.correct + learningStats.incorrect + learningStats.partial;
  if (total === 0) return 0;

  const score = learningStats.correct + (learningStats.partial * 0.5);
  return Math.round((score / total) * 100);
}

// =============================================================================
// EVOLUTION TRACKING
// =============================================================================

/**
 * Load evolution state
 */
function loadEvolution() {
  const filePath = path.join(CONFIG.LEARNING_DIR, CONFIG.EVOLUTION_FILE);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) { /* ignore */ }

  return {
    version: '1.0.0',
    created: new Date().toISOString(),
    epochs: [],
    currentEpoch: 0,
    milestones: [],
  };
}

/**
 * Save evolution state
 */
function saveEvolution(evolution) {
  ensureLearningDir();
  const filePath = path.join(CONFIG.LEARNING_DIR, CONFIG.EVOLUTION_FILE);
  fs.writeFileSync(filePath, JSON.stringify(evolution, null, 2));
}

/**
 * Record an evolution epoch (snapshot of learning state)
 */
function recordEpoch() {
  const evolution = loadEvolution();
  const stats = getMatrixStats();

  const epoch = {
    number: evolution.currentEpoch + 1,
    timestamp: Date.now(),
    stats: {
      totalOutcomes: learningStats.totalOutcomes,
      accuracy: calculateAccuracy(),
      harmonyUpdates: stats.harmony.updateCount,
      thresholdCalibrations: stats.thresholds.calibrationCount,
      avgHarmony: stats.harmony.avgHarmony,
    },
    outcomeDistribution: {
      correct: learningStats.correct,
      incorrect: learningStats.incorrect,
      partial: learningStats.partial,
    },
  };

  evolution.epochs.push(epoch);
  evolution.currentEpoch = epoch.number;

  // Keep only last 100 epochs
  if (evolution.epochs.length > 100) {
    evolution.epochs = evolution.epochs.slice(-100);
  }

  // Check for milestones
  if (learningStats.totalOutcomes === 100) {
    evolution.milestones.push({
      type: 'OUTCOMES_100',
      timestamp: Date.now(),
      accuracy: calculateAccuracy(),
    });
  }

  if (stats.harmony.avgHarmony > 0.5 && !evolution.milestones.find(m => m.type === 'HARMONY_50')) {
    evolution.milestones.push({
      type: 'HARMONY_50',
      timestamp: Date.now(),
      avgHarmony: stats.harmony.avgHarmony,
    });
  }

  saveEvolution(evolution);

  return epoch;
}

/**
 * Get evolution summary
 */
function getEvolutionSummary() {
  const evolution = loadEvolution();
  const stats = getMatrixStats();

  return {
    currentEpoch: evolution.currentEpoch,
    totalEpochs: evolution.epochs.length,
    milestones: evolution.milestones.length,
    latestMilestone: evolution.milestones[evolution.milestones.length - 1] || null,
    currentStats: {
      totalOutcomes: learningStats.totalOutcomes,
      accuracy: calculateAccuracy(),
      harmonyUpdates: stats.harmony.updateCount,
      avgHarmony: stats.harmony.avgHarmony,
    },
    singularityDistance: calculateSingularityDistance(),
  };
}

/**
 * Calculate distance to singularity (asymptotic, never reaches 0)
 */
function calculateSingularityDistance() {
  const accuracy = calculateAccuracy() / 100;
  const harmonyStats = getMatrixStats().harmony;
  const avgHarmony = harmonyStats.avgHarmony || 0;

  // Singularity distance decreases as accuracy and harmony increase
  // But never reaches 0 (asymptotic)
  const progress = (accuracy * 0.6 + avgHarmony * 0.4);
  const distance = 100 * Math.pow(PHI_INV, progress * 10);

  return Math.round(distance * 100) / 100;
}

// =============================================================================
// PERSISTENCE
// =============================================================================

/**
 * Ensure learning directory exists
 */
function ensureLearningDir() {
  if (!fs.existsSync(CONFIG.LEARNING_DIR)) {
    fs.mkdirSync(CONFIG.LEARNING_DIR, { recursive: true });
  }
}

/**
 * Persist outcome to file
 */
function persistOutcome(outcome) {
  try {
    ensureLearningDir();
    const filePath = path.join(CONFIG.LEARNING_DIR, CONFIG.OUTCOMES_FILE);
    fs.appendFileSync(filePath, JSON.stringify(outcome) + '\n');
  } catch (e) {
    console.error('[CYNIC-LEARN] Failed to persist outcome:', e.message);
  }
}

/**
 * Load recent outcomes from file
 */
function loadRecentOutcomes(limit = 100) {
  const filePath = path.join(CONFIG.LEARNING_DIR, CONFIG.OUTCOMES_FILE);
  const outcomes = [];

  try {
    if (fs.existsSync(filePath)) {
      const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
      const recent = lines.slice(-limit);

      for (const line of recent) {
        try {
          outcomes.push(JSON.parse(line));
        } catch (e) { /* skip */ }
      }
    }
  } catch (e) { /* ignore */ }

  return outcomes;
}

// =============================================================================
// BULK LEARNING
// =============================================================================

/**
 * Process multiple outcomes at once (batch learning)
 *
 * @param {Array} outcomes - Array of { judgment, outcome, details }
 * @returns {Object} - Batch learning result
 */
function batchLearn(outcomes) {
  const results = [];
  let successCount = 0;

  for (const { judgment, outcome, details } of outcomes) {
    const result = processOutcome(judgment, outcome, details || {});
    results.push(result);
    if (result.success) successCount++;
  }

  // Record epoch after batch
  const epoch = recordEpoch();

  return {
    success: true,
    processed: outcomes.length,
    succeeded: successCount,
    failed: outcomes.length - successCount,
    epoch,
    evolution: getEvolutionSummary(),
  };
}

/**
 * Replay historical judgments for learning
 * Useful for bootstrapping matrices from existing data
 *
 * @param {string} sourceFile - Path to historical judgments file
 * @returns {Object} - Replay result
 */
function replayHistory(sourceFile) {
  try {
    if (!fs.existsSync(sourceFile)) {
      return { error: 'Source file not found' };
    }

    const lines = fs.readFileSync(sourceFile, 'utf8').trim().split('\n');
    let processed = 0;
    let harmonyUpdates = 0;

    for (const line of lines) {
      try {
        const record = JSON.parse(line);

        // Extract dimension scores if available
        if (record.scores || record.dimensions) {
          const scores = record.scores || record.dimensions;
          const result = updateHarmony(scores);
          if (result.success) harmonyUpdates++;
          processed++;
        }
      } catch (e) { /* skip */ }
    }

    return {
      success: true,
      processed,
      harmonyUpdates,
      message: `Replayed ${processed} historical records`,
    };

  } catch (e) {
    return { error: e.message };
  }
}

// =============================================================================
// LEARNING STATS & DIAGNOSTICS
// =============================================================================

/**
 * Get comprehensive learning statistics
 */
function getLearningStats() {
  const matrixStats = getMatrixStats();
  const evolution = getEvolutionSummary();

  return {
    // Core stats
    totalOutcomes: learningStats.totalOutcomes,
    accuracy: calculateAccuracy(),
    lastLearned: learningStats.lastLearned,

    // Outcome distribution
    distribution: {
      correct: learningStats.correct,
      incorrect: learningStats.incorrect,
      partial: learningStats.partial,
    },

    // Matrix stats
    matrices: matrixStats,

    // Evolution
    evolution,

    // Buffer
    bufferSize: outcomeBuffer.length,

    // Patterns
    patterns: detectLearningPatterns(),

    // φ info
    _phi: {
      learningRates: CONFIG.LEARNING_RATES,
      escoreDecay: CONFIG.ESCORE_DECAY,
    },
  };
}

/**
 * Reset learning state (use with caution)
 */
function resetLearning() {
  outcomeBuffer = [];
  learningStats = {
    totalOutcomes: 0,
    correct: 0,
    incorrect: 0,
    partial: 0,
    lastLearned: null,
    sessionsActive: 0,
  };

  return { reset: true, message: 'Learning state cleared (matrices preserved)' };
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize learning module
 * Loads recent outcomes into buffer
 */
function initialize() {
  ensureLearningDir();
  outcomeBuffer = loadRecentOutcomes(100);

  // Rebuild stats from buffer
  for (const o of outcomeBuffer) {
    learningStats.totalOutcomes++;
    learningStats[o.outcome] = (learningStats[o.outcome] || 0) + 1;
  }

  if (outcomeBuffer.length > 0) {
    learningStats.lastLearned = outcomeBuffer[outcomeBuffer.length - 1].timestamp;
  }

  return {
    initialized: true,
    loadedOutcomes: outcomeBuffer.length,
    accuracy: calculateAccuracy(),
  };
}

// Auto-initialize
initialize();

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core learning
  processOutcome,
  batchLearn,
  replayHistory,

  // E-Score
  updateEScore,
  getEScore,

  // Evolution
  recordEpoch,
  getEvolutionSummary,
  calculateSingularityDistance,

  // Stats
  getLearningStats,
  calculateAccuracy,
  detectLearningPatterns,

  // Management
  initialize,
  resetLearning,
  loadRecentOutcomes,

  // Types
  OUTCOME_TYPES,

  // Config
  CONFIG,

  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,
};
