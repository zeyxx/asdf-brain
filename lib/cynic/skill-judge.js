/**
 * SKILL-JUDGE - Interface 5×5 → 4 Mondes
 *
 * Option A+ : Façade transparente
 *
 * L'utilisateur pense en 5×5 Matrix (universel)
 * CYNIC juge en 4 Mondes (interne)
 * Le mapping est transparent et auditable
 *
 * @philosophy "φ qui se méfie de φ" - Deux vues, une vérité
 * @module cynic/skill-judge
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Internal dependencies
const { SelfJudge, PHI, PHI_INV, PHI_INV_2 } = require('./self-judge');
const { updateHarmony } = require('./matrix');
const { getResidualDetector } = require('./judge');

// Judge modules
const {
  MATRIX_5x5,
  MODES,
  VERDICTS,
  REVERSE_MAPPING,
  getVerdict,
  mapFrom4Worlds,
  getMappingDoc
} = require('./judge/matrix-5x5');

const { LRUCache, judgmentCache } = require('./judge/cache');

const {
  EVIDENCE_PATH,
  createEmptyEvidence,
  loadEvidence,
  saveEvidence,
  recordEvidence,
  computeReliability,
  generateEvidenceReport
} = require('./judge/evidence');

// =============================================================================
// PATHS
// =============================================================================

const JUDGMENT_HISTORY_PATH = path.join(__dirname, '../../knowledge/cynic/judgments/history.jsonl');
const LEARNED_WEIGHTS_PATH = path.join(__dirname, '../../knowledge/cynic/judgments/learned-weights.json');

// =============================================================================
// SKILL JUDGE CLASS
// =============================================================================

/**
 * SkillJudge - Public interface for /judge skill
 *
 * Accepts 5×5 thinking, judges via 4 Mondes internally
 * Features: Learning, Caching, Evidence tracking
 */
class SkillJudge {
  constructor(options = {}) {
    this.selfJudge = new SelfJudge(options);
    this.verbose = options.verbose || false;
    this.logger = options.logger || console;

    // Learning configuration
    this.learning = {
      enabled: options.learning !== false,
      updateHarmony: options.updateHarmony !== false,
      trackHistory: options.trackHistory !== false,
      useCache: options.useCache !== false
    };

    // Load persistent state
    this.learnedWeights = this._loadLearnedWeights();
    this.evidence = loadEvidence(this.logger);

    // Stats for introspection
    this.stats = {
      totalJudgments: 0,
      cacheHits: 0,
      cacheMisses: 0,
      harmonyUpdates: 0,
      feedbackReceived: 0,
      lastLearning: null
    };
  }

  // ===========================================================================
  // LEARNED WEIGHTS
  // ===========================================================================

  _loadLearnedWeights() {
    try {
      if (fs.existsSync(LEARNED_WEIGHTS_PATH)) {
        return JSON.parse(fs.readFileSync(LEARNED_WEIGHTS_PATH, 'utf8'));
      }
    } catch (e) {
      this.logger.warn('[SkillJudge] Failed to load learned weights:', e.message);
    }
    return { adjustments: {}, version: 1, updated: null };
  }

  _saveLearnedWeights() {
    try {
      const dir = path.dirname(LEARNED_WEIGHTS_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.learnedWeights.updated = new Date().toISOString();
      fs.writeFileSync(LEARNED_WEIGHTS_PATH, JSON.stringify(this.learnedWeights, null, 2));
    } catch (e) {
      this.logger.error('[SkillJudge] Failed to save learned weights:', e.message);
    }
  }

  _applyLearnedWeights(scores) {
    if (!this.learning.enabled || !this.learnedWeights.adjustments) {
      return scores;
    }

    const adjusted = { ...scores };
    for (const [dim, data] of Object.entries(adjusted)) {
      const adjustment = this.learnedWeights.adjustments[dim];
      if (adjustment) {
        const factor = 1 + (adjustment.factor || 0) * PHI_INV_2;
        data.score = Math.min(100, Math.max(0, data.score * factor));
        data.learned_adjustment = adjustment.factor;
      }
    }
    return adjusted;
  }

  // ===========================================================================
  // HISTORY
  // ===========================================================================

  _appendToHistory(judgment, item) {
    if (!this.learning.trackHistory) return;

    try {
      const dir = path.dirname(JUDGMENT_HISTORY_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const entry = {
        timestamp: new Date().toISOString(),
        subject: typeof item === 'string' ? item.slice(0, 200) : '[Object]',
        verdict: judgment.aggregate.verdict,
        confidence: judgment.aggregate.confidence,
        mode: judgment.mode,
        dimensions_evaluated: Object.keys(judgment.dimensions).length
      };

      fs.appendFileSync(JUDGMENT_HISTORY_PATH, JSON.stringify(entry) + '\n');
    } catch (e) {
      this.logger.warn('[SkillJudge] Failed to append history:', e.message);
    }
  }

  // ===========================================================================
  // CORE JUDGMENT
  // ===========================================================================

  /**
   * Judge an item using the 5×5 interface
   */
  async judge(item, options = {}) {
    const mode = options.mode || 'standard';
    const verbose = options.verbose !== undefined ? options.verbose : this.verbose;
    const source = options.source || 'skill-judge';
    const skipCache = options.skipCache || false;

    const modeConfig = MODES[mode];
    if (!modeConfig) {
      throw new Error(`Invalid mode: ${mode}. Use: quick, standard, thorough, or full`);
    }

    this.stats.totalJudgments++;
    const startTime = Date.now();

    // Check cache first
    if (this.learning.useCache && !skipCache) {
      const cached = judgmentCache.get(item);
      if (cached && cached.result.mode === mode) {
        this.stats.cacheHits++;
        judgmentCache.recordHit(item);
        return {
          ...cached.result,
          _meta: {
            ...cached.result._meta,
            from_cache: true,
            cache_age_ms: Date.now() - cached.timestamp,
            cache_hits: cached.hits
          }
        };
      }
      this.stats.cacheMisses++;
    }

    // Run internal 4 Mondes judgment
    const internalJudgment = await this.selfJudge.judge(item, {
      source,
      mode: mode === 'full' ? 'full' : mode === 'thorough' ? 'thorough' : 'standard',
      timestamp: new Date().toISOString()
    });

    // Map results back to 5×5 format
    const fiveByFiveScores = mapFrom4Worlds(internalJudgment);

    // Filter to requested mode dimensions
    let filteredScores = {};
    for (const dimName of modeConfig.dimensions) {
      if (fiveByFiveScores[dimName]) {
        filteredScores[dimName] = fiveByFiveScores[dimName];
      }
    }

    // Apply learned weight adjustments
    filteredScores = this._applyLearnedWeights(filteredScores);

    // Calculate aggregate (φ-constrained)
    const scoreValues = Object.values(filteredScores).map(d => d.score);
    const mean = scoreValues.length > 0
      ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length / 100
      : 0.5;

    const confidence = Math.min(mean, PHI_INV);
    const doubt = Math.max(1 - confidence, PHI_INV_2);
    const verdict = getVerdict(confidence);

    // Build response
    const response = {
      subject: typeof item === 'string' ? item.slice(0, 100) : 'Object',
      mode,
      dimensions: filteredScores,
      aggregate: {
        mean_score: confidence,
        confidence,
        doubt,
        verdict,
        verdict_description: VERDICTS[verdict].description
      },
      cynic_says: this._generateDogSummary(verdict, confidence, filteredScores),
      _meta: {
        interface: '5x5',
        internal: '4worlds',
        mode_dimensions: modeConfig.dimensions.length,
        processing_time_ms: Date.now() - startTime,
        phi_ceiling_applied: mean > PHI_INV,
        doubt_floor_applied: (1 - mean) < PHI_INV_2
      }
    };

    // Add internal view if verbose
    if (verbose) {
      response._internal = {
        four_worlds_judgment: {
          verdict: internalJudgment.verdict,
          confidence: internalJudgment.confidence,
          dimension_scores: internalJudgment.scores
        },
        mapping_used: REVERSE_MAPPING,
        axioms_applied: this._getAxiomsFromDimensions(filteredScores)
      };
    }

    // Update Harmony matrix
    if (this.learning.enabled && this.learning.updateHarmony) {
      try {
        const correlations = this._extractCorrelations(filteredScores, verdict);
        if (correlations.length > 0) {
          updateHarmony(correlations, source);
          this.stats.harmonyUpdates++;
        }
      } catch (e) {
        this.logger.warn('[SkillJudge] Harmony update failed:', e.message);
      }
    }

    // Track history and cache
    this._appendToHistory(response, item);
    if (this.learning.useCache && !skipCache) {
      judgmentCache.set(item, response);
    }

    // ==========================================================================
    // RESIDUAL DETECTION - Connect to DISCOVER/THE_INNOMMABLE
    // "φ qui découvre ce qu'il ne sait pas"
    // ==========================================================================
    try {
      const detector = getResidualDetector();

      // Prepare judgment for residual analysis
      const judgmentForResidual = {
        global: confidence * 100,  // Convert to 0-100 scale
        scores: Object.fromEntries(
          Object.entries(filteredScores).map(([k, v]) => [k, v.score])
        ),
        verdict: verdict,
        confidence: confidence,
      };

      // Analyze for unexplained residual
      const residualResult = detector.analyze(judgmentForResidual, item, {
        source: source,
        timestamp: new Date().toISOString(),
        mode,
      });

      // Attach residual info to response
      response.residual = {
        value: residualResult.residual,
        isAnomaly: residualResult.isAnomaly,
        isWarning: residualResult.isWarning,
      };

      // If anomaly detected, add buffer status
      if (residualResult.isAnomaly) {
        response.residual.bufferStatus = residualResult.bufferStatus;
        response.residual.clusterSuggestion = residualResult.clusterSuggestion;
        this.logger.info(`[SkillJudge] Anomaly detected: residual=${residualResult.residual.toFixed(3)}`);
      }
    } catch (err) {
      // Silent failure - don't block judgment for residual detection
      response.residual = { error: 'detection_failed', message: err.message };
    }

    return response;
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  _extractCorrelations(dimensions, verdict) {
    const correlations = [];
    const dimEntries = Object.entries(dimensions);

    for (let i = 0; i < dimEntries.length; i++) {
      for (let j = i + 1; j < dimEntries.length; j++) {
        const [, dataA] = dimEntries[i];
        const [, dataB] = dimEntries[j];

        const scoreDiff = Math.abs(dataA.score - dataB.score);
        const similarity = 1 - (scoreDiff / 100);

        if (similarity >= PHI_INV) {
          correlations.push({
            from: dataA.mapped_from,
            to: dataB.mapped_from,
            weight: similarity * PHI_INV,
            context: verdict
          });
        }
      }
    }

    return correlations;
  }

  _generateDogSummary(verdict, confidence, dimensions) {
    const weakPoints = Object.entries(dimensions)
      .filter(([, d]) => d.score < 50)
      .map(([name]) => name);

    const strongPoints = Object.entries(dimensions)
      .filter(([, d]) => d.score >= 70)
      .map(([name]) => name);

    let tailState, assessment;

    switch (verdict) {
      case 'HOWL':
        tailState = 'wags enthusiastically';
        assessment = 'This is exceptional work. Rare achievement.';
        break;
      case 'WAG':
        tailState = 'wags steadily';
        assessment = 'Good scent here. Minor improvements possible.';
        break;
      case 'GROWL':
        tailState = 'stays still';
        assessment = 'Something needs attention before proceeding.';
        break;
      case 'BARK':
        tailState = 'tucks';
        assessment = 'Serious concerns detected. Proceed with caution.';
        break;
    }

    const findings = [];
    if (strongPoints.length > 0) {
      findings.push(`Strong in: ${strongPoints.slice(0, 3).join(', ')}`);
    }
    if (weakPoints.length > 0) {
      findings.push(`Weak in: ${weakPoints.slice(0, 3).join(', ')}`);
    }

    return `Woof. ${assessment} I've sniffed around and found: ${findings.join('. ') || 'balanced scores across dimensions'}. My tail ${tailState} because confidence is ${(confidence * 100).toFixed(1)}%. Remember: I'm just a skeptical dog - verify before you trust.`;
  }

  _getAxiomsFromDimensions(dimensions) {
    const axioms = new Set();

    for (const [dimName] of Object.entries(dimensions)) {
      for (const row of Object.values(MATRIX_5x5)) {
        if (row.dimensions[dimName]) {
          axioms.add(row.dimensions[dimName].axiom);
        }
      }
    }

    return Array.from(axioms);
  }

  // ===========================================================================
  // LEARNING
  // ===========================================================================

  learn(feedback = {}) {
    if (!this.learning.enabled) {
      return { success: false, reason: 'Learning disabled' };
    }

    const { originalJudgment = null, corrections = {}, outcome = 'partial', notes = '' } = feedback;

    // Record evidence
    if (originalJudgment) {
      this.evidence = recordEvidence(this.evidence, originalJudgment, outcome, corrections);
      saveEvidence(this.evidence, this.logger);
    }

    const learningRate = PHI_INV_2;
    let adjustmentsMade = 0;

    for (const [dimName, delta] of Object.entries(corrections)) {
      let targetDim = null;
      for (const row of Object.values(MATRIX_5x5)) {
        if (row.dimensions[dimName]) {
          targetDim = row.dimensions[dimName].maps_to;
          break;
        }
      }

      if (targetDim) {
        if (!this.learnedWeights.adjustments[targetDim]) {
          this.learnedWeights.adjustments[targetDim] = {
            factor: 0,
            samples: 0,
            history: []
          };
        }

        const adj = this.learnedWeights.adjustments[targetDim];
        const normalizedDelta = Math.max(-1, Math.min(1, delta / 100));
        adj.factor = adj.factor * (1 - learningRate) + normalizedDelta * learningRate;
        adj.factor = Math.max(-PHI_INV, Math.min(PHI_INV, adj.factor));

        adj.samples++;
        adj.history.push({
          timestamp: new Date().toISOString(),
          delta: normalizedDelta,
          outcome
        });

        if (adj.history.length > 100) {
          adj.history = adj.history.slice(-100);
        }

        adjustmentsMade++;
      }
    }

    this.learnedWeights.version++;
    this._saveLearnedWeights();

    this.stats.feedbackReceived++;
    this.stats.lastLearning = new Date().toISOString();

    this.logger.log(`[SkillJudge] 🐕 Learned from feedback: ${adjustmentsMade} adjustments, outcome=${outcome}`);

    return {
      success: true,
      adjustmentsMade,
      outcome,
      learningRate,
      newVersion: this.learnedWeights.version,
      notes
    };
  }

  // ===========================================================================
  // INTROSPECTION
  // ===========================================================================

  getStats() {
    return {
      ...this.stats,
      cache: judgmentCache.getStats(),
      learnedWeights: {
        version: this.learnedWeights.version,
        dimensions: Object.keys(this.learnedWeights.adjustments).length,
        updated: this.learnedWeights.updated
      },
      learning: this.learning
    };
  }

  getModes() {
    return Object.entries(MODES).map(([name, config]) => ({
      name,
      dimensions: config.dimensions.length,
      description: config.description
    }));
  }

  getMatrix() {
    return MATRIX_5x5;
  }

  getMappingDoc() {
    return getMappingDoc();
  }

  getLearnedWeights() {
    return JSON.parse(JSON.stringify(this.learnedWeights));
  }

  // ===========================================================================
  // EVIDENCE
  // ===========================================================================

  getEvidence() {
    const evidence = JSON.parse(JSON.stringify(this.evidence));
    evidence.summary = {
      totalValidated: evidence.metrics.totalValidated,
      accuracyRate: evidence.metrics.accuracyRate,
      brierScore: evidence.metrics.brierScore,
      calibrationError: evidence.calibration.expectedCalibrationError,
      isWellCalibrated: evidence.calibration.expectedCalibrationError !== null &&
                        evidence.calibration.expectedCalibrationError < 0.1,
      hasEnoughData: evidence.metrics.totalValidated >= 10,
      reliability: computeReliability(evidence, PHI_INV)
    };
    return evidence;
  }

  getEvidenceReport() {
    const reliability = computeReliability(this.evidence, PHI_INV);
    return generateEvidenceReport(this.evidence, reliability);
  }

  resetEvidence() {
    this.evidence = createEmptyEvidence();
    saveEvidence(this.evidence, this.logger);
    return { success: true, message: 'Evidence reset - starting fresh data collection' };
  }

  // ===========================================================================
  // RESET
  // ===========================================================================

  resetLearning() {
    this.learnedWeights = { adjustments: {}, version: 1, updated: null };
    this._saveLearnedWeights();
    judgmentCache.clear();
    this.stats = {
      totalJudgments: 0,
      cacheHits: 0,
      cacheMisses: 0,
      harmonyUpdates: 0,
      feedbackReceived: 0,
      lastLearning: null
    };
    return { success: true, message: 'Learning reset - CYNIC is a puppy again 🐕' };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  SkillJudge,

  // Re-export from modules for convenience
  MATRIX_5x5,
  MODES,
  VERDICTS,
  REVERSE_MAPPING,
  getVerdict,
  mapFrom4Worlds,

  // Cache
  judgmentCache,
  LRUCache,

  // Paths
  JUDGMENT_HISTORY_PATH,
  LEARNED_WEIGHTS_PATH,
  EVIDENCE_PATH,

  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2
};
