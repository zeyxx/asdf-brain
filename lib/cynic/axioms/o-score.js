/**
 * O-SCORE - Operator Efficiency
 *
 * "Humans are resources. Measure them wisely."
 *
 * O = 100 × (1 - F) × P × T
 *
 * Like K-Score for tokens, O-Score measures operator efficiency:
 * - F = Fatigue factor (0-1)
 * - P = Productivity (0-1)
 * - T = Time efficiency (0-1)
 *
 * @philosophy Operators who burn out contribute nothing. Balance is key.
 */

'use strict';

const { PHI, PHI_2, PHI_INV, PHI_INV_2, THRESHOLDS, applyPhiCeiling } = require('./constants');

// =============================================================================
// FATIGUE WEIGHTS (φ-derived)
// =============================================================================

/**
 * φ-weighted fatigue signals
 * Higher weight = stronger impact on fatigue
 */
const FATIGUE_WEIGHTS = {
  repetitionRate: PHI_2,     // φ² = 2.618 - repetition is very fatiguing
  errorFrequency: PHI,       // φ = 1.618 - errors indicate struggle
  responseLatency: 1.0,      // baseline
  contextSwitches: PHI_INV,  // φ⁻¹ = 0.618 - less fatiguing
};

// Total weight for normalization
const TOTAL_FATIGUE_WEIGHT =
  FATIGUE_WEIGHTS.repetitionRate +
  FATIGUE_WEIGHTS.errorFrequency +
  FATIGUE_WEIGHTS.responseLatency +
  FATIGUE_WEIGHTS.contextSwitches;

// =============================================================================
// FATIGUE CALCULATION
// =============================================================================

/**
 * Calculate fatigue factor from operator signals
 *
 * @param {Object} signals - Operator fatigue signals
 * @param {number} signals.repetitionRate - How often same actions repeat (0-1)
 * @param {number} signals.errorFrequency - Error rate (0-1)
 * @param {number} signals.responseLatency - Latency increase ratio (0-1)
 * @param {number} signals.contextSwitches - Context switch rate (0-1)
 * @returns {Object} Fatigue analysis
 */
function calculateFatigue(signals = {}) {
  const {
    repetitionRate = 0,
    errorFrequency = 0,
    responseLatency = 0,
    contextSwitches = 0,
  } = signals;

  // Weighted sum of fatigue signals
  const weightedSum =
    Math.min(1, repetitionRate) * FATIGUE_WEIGHTS.repetitionRate +
    Math.min(1, errorFrequency) * FATIGUE_WEIGHTS.errorFrequency +
    Math.min(1, responseLatency) * FATIGUE_WEIGHTS.responseLatency +
    Math.min(1, contextSwitches) * FATIGUE_WEIGHTS.contextSwitches;

  // Normalize to 0-1
  const F = weightedSum / TOTAL_FATIGUE_WEIGHT;

  // Determine severity
  let severity;
  if (F >= PHI_INV) {
    severity = 'HIGH';      // > 61.8% - critical fatigue
  } else if (F >= PHI_INV_2) {
    severity = 'MODERATE';  // > 38.2% - noticeable fatigue
  } else {
    severity = 'LOW';       // < 38.2% - acceptable
  }

  return {
    fatigue: Math.round(F * 1000) / 1000,
    severity,
    components: {
      repetitionRate: Math.round(repetitionRate * 100),
      errorFrequency: Math.round(errorFrequency * 100),
      responseLatency: Math.round(responseLatency * 100),
      contextSwitches: Math.round(contextSwitches * 100),
    },
    weights: FATIGUE_WEIGHTS,
  };
}

// =============================================================================
// O-SCORE CALCULATION
// =============================================================================

/**
 * Calculate O-Score for an operator
 *
 * O = 100 × (1 - F) × P × T
 *
 * @param {Object} metrics - Operator performance metrics
 * @param {number} metrics.productivity - Task completion rate (0-1)
 * @param {number} metrics.timeEfficiency - Time efficiency ratio (0-1)
 * @param {Object} metrics.fatigueSignals - Fatigue signal object
 * @returns {Object} O-Score result
 */
function calculate(metrics = {}) {
  const {
    productivity = 0.5,      // Default to neutral
    timeEfficiency = 0.5,    // Default to neutral
    fatigueSignals = {},
  } = metrics;

  // Clamp inputs to 0-1
  const P = Math.max(0, Math.min(1, productivity));
  const T = Math.max(0, Math.min(1, timeEfficiency));

  // Calculate fatigue
  const fatigueResult = calculateFatigue(fatigueSignals);
  const F = fatigueResult.fatigue;

  // O-Score formula: O = 100 × (1 - F) × P × T
  const O = 100 * (1 - F) * P * T;

  // Round to 1 decimal
  const score = Math.round(O * 10) / 10;

  // Determine verdict based on φ thresholds
  const verdict = getVerdict(score);

  return {
    score,
    verdict,
    components: {
      fatigue: Math.round(F * 100),
      productivity: Math.round(P * 100),
      timeEfficiency: Math.round(T * 100),
    },
    fatigue: fatigueResult,
    formula: 'O = 100 × (1 - F) × P × T',
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

// =============================================================================
// VERDICT DETERMINATION
// =============================================================================

/**
 * Determine verdict from O-Score using φ-thresholds
 *
 * @param {number} O - O-Score value
 * @returns {Object} Verdict with confidence and recommendation
 */
function getVerdict(O) {
  // Calculate confidence based on distance from threshold
  const distanceFromThreshold = Math.abs(O - THRESHOLDS.GOOD) / 100;
  let rawConfidence = 0.5 + distanceFromThreshold * 0.5;

  // Apply phi ceiling
  const confidence = applyPhiCeiling(rawConfidence);
  const doubt = 1 - confidence;

  if (O < THRESHOLDS.MINIMUM) {
    return {
      verdict: 'CRITICAL',
      confidence: Math.round(confidence * 1000) / 1000,
      doubt: Math.round(doubt * 1000) / 1000,
      reason: `O=${O} < ${THRESHOLDS.MINIMUM} (φ⁻² threshold)`,
      action: 'Operator needs immediate rest or support',
    };
  }

  if (O < THRESHOLDS.GOOD) {
    return {
      verdict: 'DEGRADED',
      confidence: Math.round(confidence * 1000) / 1000,
      doubt: Math.round(doubt * 1000) / 1000,
      reason: `${THRESHOLDS.MINIMUM} <= O=${O} < ${THRESHOLDS.GOOD}`,
      action: 'Consider reducing workload or taking breaks',
    };
  }

  return {
    verdict: 'OPTIMAL',
    confidence: Math.round(confidence * 1000) / 1000,
    doubt: Math.round(doubt * 1000) / 1000,
    reason: `O=${O} >= ${THRESHOLDS.GOOD} (φ⁻¹ threshold)`,
    action: 'Operator is performing efficiently',
  };
}

// =============================================================================
// TREND ANALYSIS
// =============================================================================

/**
 * Analyze O-Score trend over time
 *
 * @param {Array} history - Array of { score, timestamp } objects
 * @returns {Object} Trend analysis
 */
function analyzeTrend(history = []) {
  if (history.length < 2) {
    return {
      trend: 'INSUFFICIENT_DATA',
      direction: null,
      rate: 0,
      recommendation: 'Need more data points',
    };
  }

  // Sort by timestamp
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);

  // Calculate simple linear regression
  const n = sorted.length;
  const sumX = sorted.reduce((sum, _, i) => sum + i, 0);
  const sumY = sorted.reduce((sum, h) => sum + h.score, 0);
  const sumXY = sorted.reduce((sum, h, i) => sum + i * h.score, 0);
  const sumX2 = sorted.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgScore = sumY / n;

  // Determine trend
  let trend, direction;
  if (slope > PHI_INV_2 * 0.1) {
    trend = 'IMPROVING';
    direction = 1;
  } else if (slope < -PHI_INV_2 * 0.1) {
    trend = 'DECLINING';
    direction = -1;
  } else {
    trend = 'STABLE';
    direction = 0;
  }

  // Recommendation based on trend and current level
  const lastScore = sorted[sorted.length - 1].score;
  let recommendation;

  if (trend === 'DECLINING' && lastScore < THRESHOLDS.GOOD) {
    recommendation = 'URGENT: Address declining performance immediately';
  } else if (trend === 'DECLINING') {
    recommendation = 'Monitor closely - performance trend is negative';
  } else if (trend === 'IMPROVING' && lastScore < THRESHOLDS.GOOD) {
    recommendation = 'Positive trend, continue current approach';
  } else if (trend === 'IMPROVING') {
    recommendation = 'Excellent - maintain momentum';
  } else {
    recommendation = 'Stable performance';
  }

  return {
    trend,
    direction,
    rate: Math.round(slope * 1000) / 1000,
    avgScore: Math.round(avgScore * 10) / 10,
    lastScore,
    dataPoints: n,
    recommendation,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core
  calculate,
  calculateFatigue,
  getVerdict,

  // Analysis
  analyzeTrend,

  // Constants
  FATIGUE_WEIGHTS,
  TOTAL_FATIGUE_WEIGHT,
};
