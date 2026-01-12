/**
 * EVIDENCE - Empirical validation system
 *
 * Tracks calibration, accuracy, and reliability metrics
 * to validate CYNIC's judgments against reality
 *
 * Features rotation to prevent unbounded growth
 *
 * @module cynic/judge/evidence
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const EVIDENCE_PATH = path.join(__dirname, '../../../knowledge/cynic/judgments/evidence.json');
const ARCHIVE_PATH = path.join(__dirname, '../../../knowledge/cynic/judgments/evidence-archive.json');

// Rotation thresholds (φ-inspired)
const MAX_VALIDATIONS = 1000;           // Rotate after this many validations
const MAX_DIMENSION_ENTRIES = 50;       // Max dimensions to track individually
const ARCHIVE_RETENTION = 10;           // Keep last N archives

// =============================================================================
// EVIDENCE STRUCTURE
// =============================================================================

/**
 * Create empty evidence structure
 */
function createEmptyEvidence() {
  return {
    version: 1,
    created: new Date().toISOString(),
    updated: null,
    rotationCount: 0,

    // Calibration: how well does confidence predict accuracy?
    calibration: {
      buckets: {
        '0-20': { predictions: 0, correct: 0 },
        '20-40': { predictions: 0, correct: 0 },
        '40-60': { predictions: 0, correct: 0 },
        '60-80': { predictions: 0, correct: 0 }
      },
      expectedCalibrationError: null
    },

    // Verdict accuracy
    verdicts: {
      HOWL: { total: 0, confirmed: 0, refuted: 0, partial: 0 },
      WAG: { total: 0, confirmed: 0, refuted: 0, partial: 0 },
      GROWL: { total: 0, confirmed: 0, refuted: 0, partial: 0 },
      BARK: { total: 0, confirmed: 0, refuted: 0, partial: 0 }
    },

    // Dimension-level accuracy (bounded)
    dimensions: {},

    // Overall metrics
    metrics: {
      totalValidated: 0,
      accuracyRate: null,
      brierScore: null,
      lastValidation: null,
      lifetimeValidations: 0  // Persists across rotations
    }
  };
}

// =============================================================================
// LOAD/SAVE
// =============================================================================

/**
 * Load evidence data from file
 */
function loadEvidence(logger = console) {
  try {
    if (fs.existsSync(EVIDENCE_PATH)) {
      const evidence = JSON.parse(fs.readFileSync(EVIDENCE_PATH, 'utf8'));
      // Ensure new fields exist for backward compatibility
      if (!evidence.metrics.lifetimeValidations) {
        evidence.metrics.lifetimeValidations = evidence.metrics.totalValidated || 0;
      }
      if (!evidence.rotationCount) {
        evidence.rotationCount = 0;
      }
      return evidence;
    }
  } catch (e) {
    logger.warn('[Evidence] Failed to load:', e.message);
  }
  return createEmptyEvidence();
}

/**
 * Save evidence data to file
 */
function saveEvidence(evidence, logger = console) {
  try {
    const dir = path.dirname(EVIDENCE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    evidence.updated = new Date().toISOString();
    fs.writeFileSync(EVIDENCE_PATH, JSON.stringify(evidence, null, 2));
  } catch (e) {
    logger.error('[Evidence] Failed to save:', e.message);
  }
}

// =============================================================================
// ROTATION (SCALABILITY)
// =============================================================================

/**
 * Load archive data
 */
function loadArchive(logger = console) {
  try {
    if (fs.existsSync(ARCHIVE_PATH)) {
      return JSON.parse(fs.readFileSync(ARCHIVE_PATH, 'utf8'));
    }
  } catch (e) {
    logger.warn('[Evidence] Failed to load archive:', e.message);
  }
  return { archives: [], aggregated: null };
}

/**
 * Save archive data
 */
function saveArchive(archive, logger = console) {
  try {
    const dir = path.dirname(ARCHIVE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ARCHIVE_PATH, JSON.stringify(archive, null, 2));
  } catch (e) {
    logger.error('[Evidence] Failed to save archive:', e.message);
  }
}

/**
 * Check if rotation is needed
 */
function needsRotation(evidence) {
  return evidence.metrics.totalValidated >= MAX_VALIDATIONS;
}

/**
 * Rotate evidence: archive current, create fresh, preserve aggregates
 */
function rotateEvidence(evidence, logger = console) {
  logger.log('[Evidence] 🔄 Rotating evidence data...');

  // 1. Load existing archive
  const archive = loadArchive(logger);

  // 2. Create archive entry from current evidence
  const archiveEntry = {
    archivedAt: new Date().toISOString(),
    period: {
      from: evidence.created,
      to: evidence.updated
    },
    summary: {
      totalValidated: evidence.metrics.totalValidated,
      accuracyRate: evidence.metrics.accuracyRate,
      brierScore: evidence.metrics.brierScore,
      calibrationError: evidence.calibration.expectedCalibrationError
    },
    verdicts: JSON.parse(JSON.stringify(evidence.verdicts)),
    calibration: JSON.parse(JSON.stringify(evidence.calibration))
  };

  // 3. Add to archives (keep last N)
  archive.archives.push(archiveEntry);
  if (archive.archives.length > ARCHIVE_RETENTION) {
    archive.archives = archive.archives.slice(-ARCHIVE_RETENTION);
  }

  // 4. Update aggregated lifetime stats
  if (!archive.aggregated) {
    archive.aggregated = {
      totalValidations: 0,
      totalConfirmed: 0,
      totalRefuted: 0,
      totalPartial: 0,
      brierScoreSum: 0,
      brierScoreCount: 0
    };
  }

  const agg = archive.aggregated;
  agg.totalValidations += evidence.metrics.totalValidated;

  for (const v of Object.values(evidence.verdicts)) {
    agg.totalConfirmed += v.confirmed;
    agg.totalRefuted += v.refuted;
    agg.totalPartial += v.partial;
  }

  if (evidence.metrics.brierScore !== null) {
    agg.brierScoreSum += evidence.metrics.brierScore * evidence.metrics.totalValidated;
    agg.brierScoreCount += evidence.metrics.totalValidated;
  }

  // 5. Save archive
  saveArchive(archive, logger);

  // 6. Create fresh evidence with carried-over lifetime stats
  const freshEvidence = createEmptyEvidence();
  freshEvidence.rotationCount = (evidence.rotationCount || 0) + 1;
  freshEvidence.metrics.lifetimeValidations = (evidence.metrics.lifetimeValidations || 0) + evidence.metrics.totalValidated;

  logger.log(`[Evidence] ✅ Rotation complete. Archive #${archive.archives.length}, lifetime validations: ${freshEvidence.metrics.lifetimeValidations}`);

  return freshEvidence;
}

/**
 * Prune dimensions to keep only top N by validation count
 */
function pruneDimensions(evidence) {
  const dims = evidence.dimensions;
  const entries = Object.entries(dims);

  if (entries.length <= MAX_DIMENSION_ENTRIES) {
    return; // No pruning needed
  }

  // Sort by validations descending, keep top N
  entries.sort((a, b) => b[1].validations - a[1].validations);
  const toKeep = entries.slice(0, MAX_DIMENSION_ENTRIES);

  evidence.dimensions = Object.fromEntries(toKeep);
}

// =============================================================================
// METRICS CALCULATION
// =============================================================================

/**
 * Update Brier score (proper scoring rule)
 */
function updateBrierScore(evidence, confidence, outcome) {
  const outcomeValue = outcome === 'confirmed' ? 1 : (outcome === 'partial' ? 0.5 : 0);
  const squaredError = Math.pow(confidence - outcomeValue, 2);

  const n = evidence.metrics.totalValidated;
  const currentBrier = evidence.metrics.brierScore || 0;
  evidence.metrics.brierScore = ((n - 1) * currentBrier + squaredError) / n;
}

/**
 * Calculate Expected Calibration Error (ECE)
 */
function updateCalibrationError(evidence) {
  const buckets = evidence.calibration.buckets;
  let ece = 0;
  let totalPredictions = 0;

  const bucketMidpoints = {
    '0-20': 0.10,
    '20-40': 0.30,
    '40-60': 0.50,
    '60-80': 0.70
  };

  for (const [bucketName, data] of Object.entries(buckets)) {
    if (data.predictions > 0) {
      const accuracy = data.correct / data.predictions;
      const expectedConfidence = bucketMidpoints[bucketName];
      ece += Math.abs(accuracy - expectedConfidence) * data.predictions;
      totalPredictions += data.predictions;
    }
  }

  evidence.calibration.expectedCalibrationError = totalPredictions > 0
    ? ece / totalPredictions
    : null;
}

/**
 * Compute reliability score from evidence
 */
function computeReliability(evidence, PHI_INV) {
  if (evidence.metrics.totalValidated < 5) {
    return null;
  }

  const factors = [];

  if (evidence.metrics.accuracyRate !== null) {
    factors.push({ value: evidence.metrics.accuracyRate, weight: 0.4 });
  }

  if (evidence.calibration.expectedCalibrationError !== null) {
    const calibrationScore = Math.max(0, 1 - evidence.calibration.expectedCalibrationError * 2);
    factors.push({ value: calibrationScore, weight: 0.3 });
  }

  if (evidence.metrics.brierScore !== null) {
    const brierScore = Math.max(0, 1 - evidence.metrics.brierScore * 2);
    factors.push({ value: brierScore, weight: 0.3 });
  }

  if (factors.length === 0) return null;

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = factors.reduce((sum, f) => sum + f.value * f.weight, 0);

  // φ-bounded reliability
  return Math.min(weightedSum / totalWeight, PHI_INV);
}

// =============================================================================
// RECORD EVIDENCE
// =============================================================================

/**
 * Record validation outcome (with automatic rotation check)
 */
function recordEvidence(evidence, originalJudgment, outcome, corrections = {}, logger = console) {
  const confidence = originalJudgment?.aggregate?.confidence || 0.5;
  const verdict = originalJudgment?.aggregate?.verdict || 'WAG';

  // 1. Update calibration bucket
  const confidencePct = confidence * 100;
  let bucket;
  if (confidencePct < 20) bucket = '0-20';
  else if (confidencePct < 40) bucket = '20-40';
  else if (confidencePct < 60) bucket = '40-60';
  else bucket = '60-80';

  evidence.calibration.buckets[bucket].predictions++;
  if (outcome === 'confirmed') {
    evidence.calibration.buckets[bucket].correct++;
  }

  // 2. Update verdict accuracy
  if (evidence.verdicts[verdict]) {
    evidence.verdicts[verdict].total++;
    evidence.verdicts[verdict][outcome]++;
  }

  // 3. Update dimension-level evidence
  for (const [dimName, delta] of Object.entries(corrections)) {
    if (!evidence.dimensions[dimName]) {
      evidence.dimensions[dimName] = {
        validations: 0,
        totalError: 0,
        meanAbsoluteError: null
      };
    }
    const dimEvidence = evidence.dimensions[dimName];
    dimEvidence.validations++;
    dimEvidence.totalError += Math.abs(delta);
    dimEvidence.meanAbsoluteError = dimEvidence.totalError / dimEvidence.validations;
  }

  // 4. Prune dimensions if too many
  pruneDimensions(evidence);

  // 5. Update overall metrics
  evidence.metrics.totalValidated++;
  evidence.metrics.lifetimeValidations = (evidence.metrics.lifetimeValidations || 0) + 1;
  evidence.metrics.lastValidation = new Date().toISOString();

  // Calculate accuracy rate
  const allVerdicts = Object.values(evidence.verdicts);
  const totalConfirmed = allVerdicts.reduce((sum, v) => sum + v.confirmed, 0);
  const totalValidated = allVerdicts.reduce((sum, v) => sum + v.total, 0);
  evidence.metrics.accuracyRate = totalValidated > 0
    ? totalConfirmed / totalValidated
    : null;

  // Update Brier and ECE
  updateBrierScore(evidence, confidence, outcome);
  updateCalibrationError(evidence);

  // 6. Check if rotation needed
  if (needsRotation(evidence)) {
    evidence = rotateEvidence(evidence, logger);
  }

  return evidence;
}

// =============================================================================
// REPORTING
// =============================================================================

/**
 * Generate human-readable evidence report
 */
function generateEvidenceReport(evidence, reliability) {
  const lines = [
    '=== CYNIC EVIDENCE REPORT ===',
    '',
    `Current Period Validations: ${evidence.metrics.totalValidated}`,
    `Lifetime Validations: ${evidence.metrics.lifetimeValidations || evidence.metrics.totalValidated}`,
    `Rotation Count: ${evidence.rotationCount || 0}`,
    `Accuracy Rate: ${evidence.metrics.accuracyRate !== null ? (evidence.metrics.accuracyRate * 100).toFixed(1) + '%' : 'N/A'}`,
    `Brier Score: ${evidence.metrics.brierScore !== null ? evidence.metrics.brierScore.toFixed(3) : 'N/A'} (lower is better)`,
    `Calibration Error: ${evidence.calibration.expectedCalibrationError !== null ? evidence.calibration.expectedCalibrationError.toFixed(3) : 'N/A'}`,
    `Reliability: ${reliability !== null ? (reliability * 100).toFixed(1) + '%' : 'Insufficient data'}`,
    '',
    '--- Verdict Breakdown ---'
  ];

  for (const [verdict, data] of Object.entries(evidence.verdicts)) {
    if (data.total > 0) {
      const accuracy = data.confirmed / data.total;
      lines.push(`${verdict}: ${data.total} total, ${(accuracy * 100).toFixed(0)}% confirmed`);
    }
  }

  lines.push('', '--- Calibration Buckets ---');
  for (const [bucket, data] of Object.entries(evidence.calibration.buckets)) {
    if (data.predictions > 0) {
      const accuracy = (data.correct / data.predictions * 100).toFixed(0);
      lines.push(`${bucket}%: ${data.predictions} predictions, ${accuracy}% accurate`);
    }
  }

  if (Object.keys(evidence.dimensions).length > 0) {
    lines.push('', '--- Dimension Accuracy (Top 5) ---');
    const sortedDims = Object.entries(evidence.dimensions)
      .sort((a, b) => b[1].validations - a[1].validations);
    for (const [dim, data] of sortedDims.slice(0, 5)) {
      lines.push(`${dim}: MAE=${data.meanAbsoluteError.toFixed(1)}, n=${data.validations}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get archive summary
 */
function getArchiveSummary(logger = console) {
  const archive = loadArchive(logger);

  if (!archive.archives.length) {
    return { hasArchive: false, message: 'No archived evidence yet' };
  }

  return {
    hasArchive: true,
    archiveCount: archive.archives.length,
    oldestArchive: archive.archives[0]?.period?.from,
    newestArchive: archive.archives[archive.archives.length - 1]?.archivedAt,
    aggregated: archive.aggregated,
    lifetimeAccuracy: archive.aggregated?.totalValidations > 0
      ? archive.aggregated.totalConfirmed / archive.aggregated.totalValidations
      : null
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Paths
  EVIDENCE_PATH,
  ARCHIVE_PATH,

  // Config
  MAX_VALIDATIONS,
  MAX_DIMENSION_ENTRIES,
  ARCHIVE_RETENTION,

  // Core functions
  createEmptyEvidence,
  loadEvidence,
  saveEvidence,
  recordEvidence,

  // Rotation
  needsRotation,
  rotateEvidence,
  pruneDimensions,
  loadArchive,
  getArchiveSummary,

  // Metrics
  computeReliability,
  updateBrierScore,
  updateCalibrationError,

  // Reporting
  generateEvidenceReport
};
