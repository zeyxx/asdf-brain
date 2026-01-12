/**
 * EVIDENCE - Empirical validation system
 *
 * Tracks calibration, accuracy, and reliability metrics
 * to validate CYNIC's judgments against reality
 *
 * @module cynic/judge/evidence
 */

'use strict';

const fs = require('fs');
const path = require('path');

const EVIDENCE_PATH = path.join(__dirname, '../../../knowledge/cynic/judgments/evidence.json');

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

    // Dimension-level accuracy
    dimensions: {},

    // Overall metrics
    metrics: {
      totalValidated: 0,
      accuracyRate: null,
      brierScore: null,
      lastValidation: null
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
      return JSON.parse(fs.readFileSync(EVIDENCE_PATH, 'utf8'));
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
 * Record validation outcome
 */
function recordEvidence(evidence, originalJudgment, outcome, corrections = {}) {
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

  // 4. Update overall metrics
  evidence.metrics.totalValidated++;
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
    `Total Validations: ${evidence.metrics.totalValidated}`,
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
    lines.push('', '--- Dimension Accuracy ---');
    const sortedDims = Object.entries(evidence.dimensions)
      .sort((a, b) => a[1].meanAbsoluteError - b[1].meanAbsoluteError);
    for (const [dim, data] of sortedDims.slice(0, 5)) {
      lines.push(`${dim}: MAE=${data.meanAbsoluteError.toFixed(1)}, n=${data.validations}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  EVIDENCE_PATH,
  createEmptyEvidence,
  loadEvidence,
  saveEvidence,
  recordEvidence,
  computeReliability,
  updateBrierScore,
  updateCalibrationError,
  generateEvidenceReport
};
