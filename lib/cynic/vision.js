/**
 * CYNIC-VISION - Strategic Analysis & Foresight
 *
 * 🐕 "The dog sees beyond the horizon"
 *
 * World: ATZILUT (Emanation/Divine Wisdom)
 * Model: Opus (deepest reasoning)
 *
 * Purpose:
 * - Strategic analysis of complex situations
 * - Long-term pattern recognition across judgments
 * - Architectural decision support
 * - Meta-level system insights
 * - Future trajectory prediction
 *
 * Philosophy:
 * - "Voir au-delà de l'immédiat"
 * - The highest vantage point sees the farthest
 * - Patterns emerge from accumulated wisdom
 * - φ-vision: see 1.618x further than the obvious
 *
 * @module cynic/vision
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// φ CONSTANTS
// =============================================================================

// φ constants - Import from Single Source of Truth (FIXED 2026-01-13)
const { PHI, PHI_INV, PHI_INV_2, PHI_2: PHI_SQ } = require('./axioms/constants');

// =============================================================================
// PATHS
// =============================================================================

const KNOWLEDGE_ROOT = path.join(__dirname, '../../knowledge/cynic');
const VISION_DIR = path.join(KNOWLEDGE_ROOT, 'vision');
const LEARNING_DIR = path.join(KNOWLEDGE_ROOT, 'learning');
const MATRICES_DIR = path.join(KNOWLEDGE_ROOT, 'matrices');

// Ensure directory exists
if (!fs.existsSync(VISION_DIR)) {
  fs.mkdirSync(VISION_DIR, { recursive: true });
}

const INSIGHTS_PATH = path.join(VISION_DIR, 'insights.jsonl');
const PATTERNS_PATH = path.join(VISION_DIR, 'patterns.json');
const TRAJECTORIES_PATH = path.join(VISION_DIR, 'trajectories.json');
const RECOMMENDATIONS_PATH = path.join(VISION_DIR, 'recommendations.json');

// =============================================================================
// VISION DOMAINS
// =============================================================================

/**
 * Strategic analysis domains
 */
const VISION_DOMAINS = {
  SYSTEM: {
    name: 'System Health',
    description: 'Overall CYNIC system performance and evolution',
    indicators: ['accuracy', 'harmony', 'calibration', 'learning_rate'],
    weight: PHI_SQ,
  },
  PATTERNS: {
    name: 'Pattern Recognition',
    description: 'Recurring themes across judgments',
    indicators: ['dimension_correlations', 'outcome_clusters', 'user_behaviors'],
    weight: PHI,
  },
  ARCHITECTURE: {
    name: 'Architecture',
    description: 'Structural decisions and trade-offs',
    indicators: ['complexity', 'coupling', 'scalability', 'maintainability'],
    weight: PHI,
  },
  TRAJECTORY: {
    name: 'Trajectory',
    description: 'Future direction and evolution',
    indicators: ['growth_rate', 'convergence', 'singularity_distance'],
    weight: PHI_SQ,
  },
  ANOMALIES: {
    name: 'Anomalies',
    description: 'Unexpected behaviors and edge cases',
    indicators: ['residuals', 'outliers', 'emergent_patterns'],
    weight: 1.0,
  },
};

// =============================================================================
// INSIGHT TYPES
// =============================================================================

/**
 * Types of strategic insights
 */
const INSIGHT_TYPES = {
  OBSERVATION: {
    level: 'descriptive',
    actionable: false,
    urgency: 'low',
  },
  PATTERN: {
    level: 'analytical',
    actionable: false,
    urgency: 'medium',
  },
  CORRELATION: {
    level: 'analytical',
    actionable: false,
    urgency: 'medium',
  },
  WARNING: {
    level: 'predictive',
    actionable: true,
    urgency: 'high',
  },
  OPPORTUNITY: {
    level: 'prescriptive',
    actionable: true,
    urgency: 'medium',
  },
  RECOMMENDATION: {
    level: 'prescriptive',
    actionable: true,
    urgency: 'variable',
  },
  PROPHECY: {
    level: 'visionary',
    actionable: false,
    urgency: 'low',
    description: 'Long-term trajectory insight',
  },
};

// =============================================================================
// DATA LOADING
// =============================================================================

/**
 * Load evolution data
 */
function loadEvolution() {
  const evolutionPath = path.join(LEARNING_DIR, 'evolution.json');
  try {
    if (fs.existsSync(evolutionPath)) {
      return JSON.parse(fs.readFileSync(evolutionPath, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-VISION] Error loading evolution:', err.message);
  }
  return { epochs: [], currentEpoch: 0, milestones: [] };
}

/**
 * Load outcomes
 */
function loadOutcomes(limit = 100) {
  const outcomesPath = path.join(LEARNING_DIR, 'outcomes.jsonl');
  try {
    if (fs.existsSync(outcomesPath)) {
      const lines = fs.readFileSync(outcomesPath, 'utf8')
        .split('\n')
        .filter(line => line.trim());

      return lines.slice(-limit).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    }
  } catch (err) {
    console.error('[CYNIC-VISION] Error loading outcomes:', err.message);
  }
  return [];
}

/**
 * Load harmony matrix
 */
function loadHarmony() {
  const harmonyPath = path.join(MATRICES_DIR, 'harmony.json');
  try {
    if (fs.existsSync(harmonyPath)) {
      return JSON.parse(fs.readFileSync(harmonyPath, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-VISION] Error loading harmony:', err.message);
  }
  return null;
}

/**
 * Load thresholds matrix
 */
function loadThresholds() {
  const thresholdsPath = path.join(MATRICES_DIR, 'thresholds.json');
  try {
    if (fs.existsSync(thresholdsPath)) {
      return JSON.parse(fs.readFileSync(thresholdsPath, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-VISION] Error loading thresholds:', err.message);
  }
  return null;
}

/**
 * Load patterns cache
 */
function loadPatterns() {
  try {
    if (fs.existsSync(PATTERNS_PATH)) {
      return JSON.parse(fs.readFileSync(PATTERNS_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-VISION] Error loading patterns:', err.message);
  }
  return { discovered: [], lastAnalysis: null };
}

/**
 * Save patterns
 */
function savePatterns(patterns) {
  patterns.lastAnalysis = new Date().toISOString();
  fs.writeFileSync(PATTERNS_PATH, JSON.stringify(patterns, null, 2));
}

// =============================================================================
// STRATEGIC ANALYSIS
// =============================================================================

/**
 * Perform comprehensive strategic analysis
 *
 * @param {Object} options - Analysis options
 * @param {string[]} [options.domains] - Domains to analyze
 * @param {number} [options.depth] - Analysis depth (1-3)
 * @param {boolean} [options.includeRecommendations] - Generate recommendations
 * @returns {Object} Strategic analysis result
 */
function analyze(options = {}) {
  const startTime = Date.now();
  const domains = options.domains || Object.keys(VISION_DOMAINS);
  const depth = Math.min(3, Math.max(1, options.depth || 2));

  // Load all data sources
  const evolution = loadEvolution();
  const outcomes = loadOutcomes(100);
  const harmony = loadHarmony();
  const thresholds = loadThresholds();

  const analysis = {
    timestamp: new Date().toISOString(),
    domains: {},
    insights: [],
    patterns: [],
    trajectories: {},
    recommendations: [],
    meta: {
      dataPoints: outcomes.length,
      epochs: evolution.epochs?.length || 0,
      depth,
    },
  };

  // Analyze each domain
  for (const domain of domains) {
    if (VISION_DOMAINS[domain]) {
      analysis.domains[domain] = analyzeDomain(domain, {
        evolution,
        outcomes,
        harmony,
        thresholds,
        depth,
      });
    }
  }

  // Extract patterns
  analysis.patterns = extractPatterns(outcomes, harmony);

  // Calculate trajectories
  analysis.trajectories = calculateTrajectories(evolution, outcomes);

  // Generate insights
  analysis.insights = generateInsights(analysis);

  // Generate recommendations if requested
  if (options.includeRecommendations) {
    analysis.recommendations = generateRecommendations(analysis);
  }

  // Calculate overall vision score
  analysis.visionScore = calculateVisionScore(analysis);

  // Log insights
  for (const insight of analysis.insights) {
    logInsight(insight);
  }

  return {
    ...analysis,
    latencyMs: Date.now() - startTime,
    visioner: 'CYNIC-VISION',
    world: 'ATZILUT',
  };
}

/**
 * Analyze a specific domain
 */
function analyzeDomain(domainKey, data) {
  const domain = VISION_DOMAINS[domainKey];
  const result = {
    name: domain.name,
    health: 0,
    indicators: {},
    findings: [],
  };

  switch (domainKey) {
    case 'SYSTEM':
      result.indicators = analyzeSystemHealth(data);
      break;
    case 'PATTERNS':
      result.indicators = analyzePatternRecognition(data);
      break;
    case 'ARCHITECTURE':
      result.indicators = analyzeArchitecture(data);
      break;
    case 'TRAJECTORY':
      result.indicators = analyzeTrajectory(data);
      break;
    case 'ANOMALIES':
      result.indicators = analyzeAnomalies(data);
      break;
  }

  // Calculate domain health
  const scores = Object.values(result.indicators).map(i => i.score || 0);
  result.health = scores.length > 0 ?
    Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return result;
}

/**
 * Analyze system health indicators
 */
function analyzeSystemHealth(data) {
  const { evolution, outcomes } = data;

  // Accuracy
  const recentOutcomes = outcomes.slice(-20);
  const correct = recentOutcomes.filter(o => o.outcome === 'correct').length;
  const accuracy = recentOutcomes.length > 0 ?
    (correct / recentOutcomes.length) * 100 : 0;

  // Harmony level
  let harmonyScore = 0;
  if (data.harmony?.matrix) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.harmony.matrix.length; i++) {
      for (let j = i + 1; j < data.harmony.matrix[i].length; j++) {
        sum += data.harmony.matrix[i][j];
        count++;
      }
    }
    harmonyScore = count > 0 ? (sum / count) * 100 : 0;
  }

  // Calibration status
  const calibrationCount = data.thresholds?._meta?.calibrationCount || 0;
  const calibrationScore = Math.min(100, calibrationCount * 10);

  // Learning rate (outcomes per epoch)
  const learningRate = evolution.epochs?.length > 0 ?
    outcomes.length / evolution.epochs.length : 0;

  return {
    accuracy: {
      score: accuracy,
      status: accuracy >= 75 ? 'healthy' : accuracy >= 50 ? 'warning' : 'critical',
      trend: calculateTrend(outcomes.map(o => o.outcome === 'correct' ? 1 : 0)),
    },
    harmony: {
      score: harmonyScore,
      status: harmonyScore >= 10 ? 'healthy' : harmonyScore >= 1 ? 'developing' : 'nascent',
      trend: 'developing',
    },
    calibration: {
      score: calibrationScore,
      status: calibrationCount >= 10 ? 'calibrated' : 'calibrating',
      count: calibrationCount,
    },
    learning_rate: {
      score: Math.min(100, learningRate * 10),
      rate: learningRate,
      status: learningRate >= 5 ? 'active' : 'slow',
    },
  };
}

/**
 * Analyze pattern recognition indicators
 */
function analyzePatternRecognition(data) {
  const { outcomes, harmony } = data;

  // Dimension frequency
  const dimFreq = {};
  for (const outcome of outcomes) {
    if (outcome.dimensions) {
      for (const dim of Object.keys(outcome.dimensions)) {
        dimFreq[dim] = (dimFreq[dim] || 0) + 1;
      }
    }
  }

  // Find correlations in outcomes
  const correlations = [];
  const dimPairs = {};
  for (const outcome of outcomes) {
    if (outcome.dimensions) {
      const dims = Object.keys(outcome.dimensions);
      for (let i = 0; i < dims.length; i++) {
        for (let j = i + 1; j < dims.length; j++) {
          const pair = [dims[i], dims[j]].sort().join('+');
          if (!dimPairs[pair]) {
            dimPairs[pair] = { correct: 0, incorrect: 0, total: 0 };
          }
          dimPairs[pair].total++;
          if (outcome.outcome === 'correct') {
            dimPairs[pair].correct++;
          } else {
            dimPairs[pair].incorrect++;
          }
        }
      }
    }
  }

  // Find significant pairs
  for (const [pair, stats] of Object.entries(dimPairs)) {
    if (stats.total >= 3) {
      const successRate = stats.correct / stats.total;
      if (successRate >= 0.8 || successRate <= 0.2) {
        correlations.push({
          pair,
          successRate,
          total: stats.total,
          significance: successRate >= 0.8 ? 'positive' : 'negative',
        });
      }
    }
  }

  return {
    dimension_correlations: {
      score: Math.min(100, correlations.length * 20),
      count: correlations.length,
      top: correlations.slice(0, 5),
    },
    outcome_clusters: {
      score: Math.min(100, Object.keys(dimPairs).length * 5),
      uniquePairs: Object.keys(dimPairs).length,
    },
    user_behaviors: {
      score: 50, // Placeholder - would analyze E-scores
      status: 'tracking',
    },
  };
}

/**
 * Analyze architecture indicators
 */
function analyzeArchitecture(data) {
  // These are meta-assessments of the CYNIC system itself
  return {
    complexity: {
      score: 70, // 7 subagents implemented
      subagents: 7,
      matrices: 3,
      status: 'growing',
    },
    coupling: {
      score: 85, // Low coupling by design
      status: 'healthy',
      note: 'Subagents communicate through defined interfaces',
    },
    scalability: {
      score: 75,
      status: 'ready',
      note: 'Sync module enables distributed operation',
    },
    maintainability: {
      score: 80,
      status: 'good',
      note: 'Modular design with clear separation',
    },
  };
}

/**
 * Analyze trajectory indicators
 */
function analyzeTrajectory(data) {
  const { evolution, outcomes } = data;

  // Growth rate
  const epochCount = evolution.epochs?.length || 1;
  const growthRate = outcomes.length / Math.max(1, epochCount);

  // Convergence (are thresholds stabilizing?)
  let convergence = 0;
  if (data.thresholds?._calibrationHistory) {
    const recentCalibrations = data.thresholds._calibrationHistory.slice(-10);
    const avgDelta = recentCalibrations.reduce((sum, c) => sum + Math.abs(c.delta), 0) /
      Math.max(1, recentCalibrations.length);
    convergence = Math.max(0, 100 - avgDelta * 10);
  }

  // Singularity distance
  const latestEpoch = evolution.epochs?.[evolution.epochs.length - 1];
  const singularityDistance = latestEpoch?.stats?.avgHarmony ?
    100 / Math.max(0.01, latestEpoch.stats.avgHarmony) : 100;

  return {
    growth_rate: {
      score: Math.min(100, growthRate * 20),
      rate: growthRate,
      trend: growthRate > 5 ? 'accelerating' : 'steady',
    },
    convergence: {
      score: convergence,
      status: convergence > 70 ? 'converging' : 'calibrating',
    },
    singularity_distance: {
      score: Math.max(0, 100 - singularityDistance),
      distance: singularityDistance,
      status: singularityDistance < 50 ? 'approaching' : 'distant',
    },
  };
}

/**
 * Analyze anomaly indicators
 */
function analyzeAnomalies(data) {
  const { outcomes } = data;

  // Find outliers (scores far from mean)
  const scores = outcomes.map(o => o.judgment?.global || 0).filter(s => s > 0);
  const mean = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
  const stdDev = Math.sqrt(
    scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / Math.max(1, scores.length)
  );

  const outliers = scores.filter(s => Math.abs(s - mean) > 2 * stdDev);

  // Find emergent patterns (new dimension combinations)
  const newPatterns = [];
  const seenCombos = new Set();
  for (const outcome of outcomes) {
    if (outcome.dimensions) {
      const combo = Object.keys(outcome.dimensions).sort().join('+');
      if (!seenCombos.has(combo)) {
        seenCombos.add(combo);
        if (seenCombos.size > 10) {
          newPatterns.push(combo);
        }
      }
    }
  }

  return {
    residuals: {
      score: 50, // Placeholder - would analyze actual residuals
      status: 'monitoring',
    },
    outliers: {
      score: Math.max(0, 100 - outliers.length * 20),
      count: outliers.length,
      status: outliers.length === 0 ? 'clean' : 'detected',
    },
    emergent_patterns: {
      score: Math.min(100, newPatterns.length * 20),
      count: newPatterns.length,
      patterns: newPatterns.slice(0, 5),
    },
  };
}

// =============================================================================
// PATTERN EXTRACTION
// =============================================================================

/**
 * Extract patterns from historical data
 */
function extractPatterns(outcomes, harmony) {
  const patterns = [];

  // Outcome patterns
  const outcomeSequence = outcomes.map(o => o.outcome);
  const streaks = findStreaks(outcomeSequence);
  if (streaks.longest >= 3) {
    patterns.push({
      type: 'streak',
      description: `${streaks.longestType} streak of ${streaks.longest}`,
      significance: streaks.longest >= 5 ? 'high' : 'medium',
    });
  }

  // Dimension dominance
  const dimCounts = {};
  for (const outcome of outcomes) {
    if (outcome.dimensions) {
      for (const dim of Object.keys(outcome.dimensions)) {
        dimCounts[dim] = (dimCounts[dim] || 0) + 1;
      }
    }
  }

  const sortedDims = Object.entries(dimCounts)
    .sort(([, a], [, b]) => b - a);

  if (sortedDims.length > 0) {
    const topDim = sortedDims[0];
    const ratio = topDim[1] / outcomes.length;
    if (ratio > 0.5) {
      patterns.push({
        type: 'dominance',
        dimension: topDim[0],
        ratio,
        description: `${topDim[0]} appears in ${Math.round(ratio * 100)}% of judgments`,
        significance: ratio > 0.8 ? 'high' : 'medium',
      });
    }
  }

  // Time patterns (if timestamps available)
  if (outcomes.length > 10) {
    const timestamps = outcomes.map(o => o.timestamp).filter(Boolean);
    if (timestamps.length > 10) {
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      patterns.push({
        type: 'activity',
        avgIntervalMs: avgInterval,
        description: `Average ${Math.round(avgInterval / 1000)}s between judgments`,
        significance: 'low',
      });
    }
  }

  return patterns;
}

/**
 * Find streaks in sequence
 */
function findStreaks(sequence) {
  let longest = 0;
  let longestType = null;
  let current = 0;
  let currentType = null;

  for (const item of sequence) {
    if (item === currentType) {
      current++;
    } else {
      if (current > longest) {
        longest = current;
        longestType = currentType;
      }
      current = 1;
      currentType = item;
    }
  }

  if (current > longest) {
    longest = current;
    longestType = currentType;
  }

  return { longest, longestType };
}

// =============================================================================
// TRAJECTORY CALCULATION
// =============================================================================

/**
 * Calculate future trajectories
 */
function calculateTrajectories(evolution, outcomes) {
  const trajectories = {};

  // Accuracy trajectory
  if (outcomes.length >= 5) {
    const windows = [];
    const windowSize = Math.min(10, Math.floor(outcomes.length / 3));

    for (let i = 0; i <= outcomes.length - windowSize; i += windowSize) {
      const window = outcomes.slice(i, i + windowSize);
      const accuracy = window.filter(o => o.outcome === 'correct').length / window.length;
      windows.push(accuracy);
    }

    if (windows.length >= 2) {
      const trend = calculateTrend(windows);
      trajectories.accuracy = {
        current: windows[windows.length - 1],
        trend,
        prediction: Math.min(1, Math.max(0, windows[windows.length - 1] + trend * 0.1)),
        confidence: Math.min(PHI_INV, 0.3 + windows.length * 0.1),
      };
    }
  }

  // Epoch trajectory
  if (evolution.epochs?.length >= 2) {
    const epochStats = evolution.epochs.map(e => e.stats?.accuracy || 0);
    const trend = calculateTrend(epochStats);

    trajectories.epochs = {
      current: epochStats[epochStats.length - 1],
      trend,
      prediction: Math.min(100, Math.max(0, epochStats[epochStats.length - 1] + trend * 5)),
      confidence: Math.min(PHI_INV, 0.2 + evolution.epochs.length * 0.05),
    };
  }

  return trajectories;
}

/**
 * Calculate trend from values
 */
function calculateTrend(values) {
  if (values.length < 2) return 0;

  // Simple linear regression
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return isNaN(slope) ? 0 : slope;
}

// =============================================================================
// INSIGHT GENERATION
// =============================================================================

/**
 * Generate strategic insights from analysis
 */
function generateInsights(analysis) {
  const insights = [];

  // System health insights
  const systemHealth = analysis.domains.SYSTEM;
  if (systemHealth) {
    if (systemHealth.indicators.accuracy?.score < 50) {
      insights.push({
        type: 'WARNING',
        domain: 'SYSTEM',
        title: 'Low Accuracy Alert',
        description: `Accuracy at ${systemHealth.indicators.accuracy.score.toFixed(1)}%. Review recent judgments.`,
        urgency: 'high',
        actionable: true,
      });
    }

    if (systemHealth.indicators.harmony?.score < 1) {
      insights.push({
        type: 'OBSERVATION',
        domain: 'SYSTEM',
        title: 'Nascent Harmony Matrix',
        description: 'Harmony correlations still developing. More outcomes needed.',
        urgency: 'low',
        actionable: false,
      });
    }
  }

  // Pattern insights
  for (const pattern of analysis.patterns) {
    if (pattern.significance === 'high') {
      insights.push({
        type: 'PATTERN',
        domain: 'PATTERNS',
        title: `Significant ${pattern.type} Pattern`,
        description: pattern.description,
        urgency: 'medium',
        actionable: false,
        data: pattern,
      });
    }
  }

  // Trajectory insights
  if (analysis.trajectories.accuracy) {
    const { trend, prediction, confidence } = analysis.trajectories.accuracy;
    if (Math.abs(trend) > 0.05) {
      insights.push({
        type: 'PROPHECY',
        domain: 'TRAJECTORY',
        title: trend > 0 ? 'Improving Accuracy' : 'Declining Accuracy',
        description: `Accuracy trending ${trend > 0 ? 'up' : 'down'}. Predicted: ${(prediction * 100).toFixed(1)}%`,
        confidence,
        urgency: trend < 0 ? 'high' : 'low',
        actionable: trend < 0,
      });
    }
  }

  // Anomaly insights
  const anomalies = analysis.domains.ANOMALIES;
  if (anomalies?.indicators.outliers?.count > 0) {
    insights.push({
      type: 'WARNING',
      domain: 'ANOMALIES',
      title: 'Outliers Detected',
      description: `${anomalies.indicators.outliers.count} outlier judgments found.`,
      urgency: 'medium',
      actionable: true,
    });
  }

  return insights;
}

/**
 * Log insight to history
 */
function logInsight(insight) {
  const entry = {
    ...insight,
    timestamp: Date.now(),
    iso: new Date().toISOString(),
  };

  fs.appendFileSync(INSIGHTS_PATH, JSON.stringify(entry) + '\n');
}

// =============================================================================
// RECOMMENDATIONS
// =============================================================================

/**
 * Generate strategic recommendations
 */
function generateRecommendations(analysis) {
  const recommendations = [];

  // Based on system health
  const system = analysis.domains.SYSTEM?.indicators;
  if (system) {
    if (system.accuracy?.score < 70) {
      recommendations.push({
        priority: 'high',
        category: 'accuracy',
        title: 'Improve Judgment Accuracy',
        actions: [
          'Review recent incorrect judgments for patterns',
          'Consider threshold recalibration',
          'Analyze dimension weights for imbalances',
        ],
        expectedImpact: 'Increase accuracy by 10-20%',
      });
    }

    if (system.learning_rate?.rate < 2) {
      recommendations.push({
        priority: 'medium',
        category: 'learning',
        title: 'Increase Learning Rate',
        actions: [
          'Process more outcomes with feedback',
          'Enable full judgment mode for richer data',
          'Consider adding automated outcome collection',
        ],
        expectedImpact: 'Faster system evolution',
      });
    }
  }

  // Based on patterns
  if (analysis.patterns.length === 0 && analysis.meta.dataPoints > 20) {
    recommendations.push({
      priority: 'low',
      category: 'patterns',
      title: 'Pattern Discovery',
      actions: [
        'Increase variety of judgment types',
        'Test more dimension combinations',
        'Analyze residuals for hidden patterns',
      ],
      expectedImpact: 'Discover new correlations',
    });
  }

  // Based on trajectory
  if (analysis.trajectories.accuracy?.trend < -0.05) {
    recommendations.push({
      priority: 'critical',
      category: 'trajectory',
      title: 'Reverse Accuracy Decline',
      actions: [
        'Immediate review of calibration history',
        'Check for data quality issues',
        'Consider rolling back recent threshold changes',
      ],
      expectedImpact: 'Stabilize and improve accuracy',
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

// =============================================================================
// VISION SCORE
// =============================================================================

/**
 * Calculate overall vision score
 */
function calculateVisionScore(analysis) {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [domainKey, domainAnalysis] of Object.entries(analysis.domains)) {
    const domain = VISION_DOMAINS[domainKey];
    if (domain && domainAnalysis.health !== undefined) {
      totalScore += domainAnalysis.health * domain.weight;
      totalWeight += domain.weight;
    }
  }

  const baseScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  // Adjust for insights (more insights = more understanding)
  const insightBonus = Math.min(10, analysis.insights.length * 2);

  // Adjust for patterns discovered
  const patternBonus = Math.min(10, analysis.patterns.length * 3);

  return Math.min(100, baseScore + insightBonus + patternBonus);
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick system health check
 */
function checkHealth() {
  const analysis = analyze({ domains: ['SYSTEM'], depth: 1 });
  return {
    health: analysis.domains.SYSTEM?.health || 0,
    indicators: analysis.domains.SYSTEM?.indicators || {},
    warnings: analysis.insights.filter(i => i.type === 'WARNING'),
    visioner: 'CYNIC-VISION',
    world: 'ATZILUT',
  };
}

/**
 * Get strategic forecast
 */
function forecast(horizon = 'short') {
  const analysis = analyze({ domains: ['TRAJECTORY'], depth: 2 });

  const multiplier = horizon === 'long' ? PHI_SQ : horizon === 'medium' ? PHI : 1;

  return {
    horizon,
    trajectories: analysis.trajectories,
    predictions: Object.fromEntries(
      Object.entries(analysis.trajectories).map(([key, traj]) => [
        key,
        {
          predicted: traj.prediction,
          confidence: Math.min(PHI_INV, traj.confidence * multiplier),
          trend: traj.trend > 0 ? 'improving' : traj.trend < 0 ? 'declining' : 'stable',
        },
      ])
    ),
    visioner: 'CYNIC-VISION',
    world: 'ATZILUT',
  };
}

/**
 * Get insight history
 */
function getInsightHistory(limit = 20) {
  if (!fs.existsSync(INSIGHTS_PATH)) {
    return [];
  }

  const lines = fs.readFileSync(INSIGHTS_PATH, 'utf8')
    .split('\n')
    .filter(line => line.trim());

  return lines
    .slice(-limit)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

/**
 * Get vision summary for display
 */
function getSummary() {
  const analysis = analyze({ depth: 1, includeRecommendations: true });

  return {
    visionScore: analysis.visionScore,
    domainHealth: Object.fromEntries(
      Object.entries(analysis.domains).map(([k, v]) => [k, v.health])
    ),
    topInsights: analysis.insights.slice(0, 3),
    topRecommendations: analysis.recommendations.slice(0, 2),
    patterns: analysis.patterns.length,
    dataPoints: analysis.meta.dataPoints,
    visioner: 'CYNIC-VISION',
    world: 'ATZILUT',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main functions
  analyze,
  checkHealth,
  forecast,
  getSummary,

  // History
  getInsightHistory,

  // Constants
  VISION_DOMAINS,
  INSIGHT_TYPES,
  PHI,
  PHI_INV,
  PHI_SQ,

  // Metadata
  VISION_SUBAGENT: {
    name: 'CYNIC-VISION',
    world: 'ATZILUT',
    model: 'opus',
    purpose: 'Strategic analysis & foresight',
    philosophy: 'Voir au-delà de l\'immédiat',
  },
};
