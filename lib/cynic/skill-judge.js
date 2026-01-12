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

const { SelfJudge, DIMENSIONS, PHI, PHI_INV, PHI_INV_2 } = require('./self-judge');
const { updateHarmony, loadHarmony } = require('./matrix');
const fs = require('fs');
const path = require('path');

// =============================================================================
// LEARNING INFRASTRUCTURE
// =============================================================================

const JUDGMENT_HISTORY_PATH = path.join(__dirname, '../../knowledge/cynic/judgments/history.jsonl');
const LEARNED_WEIGHTS_PATH = path.join(__dirname, '../../knowledge/cynic/judgments/learned-weights.json');

/**
 * Simple LRU Cache for repeated judgments
 */
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  _hash(item) {
    const str = typeof item === 'string' ? item : JSON.stringify(item);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  get(item) {
    const key = this._hash(item);
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(item, result) {
    const key = this._hash(item);

    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hits: 1
    });
  }

  recordHit(item) {
    const key = this._hash(item);
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      entry.hits++;
      entry.lastHit = Date.now();
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([k, v]) => ({
        key: k,
        hits: v.hits,
        age: Date.now() - v.timestamp
      }))
    };
  }

  clear() {
    this.cache.clear();
  }
}

// Global cache instance
const judgmentCache = new LRUCache(100);

// =============================================================================
// 5×5 MATRIX DEFINITION (Interface publique)
// =============================================================================

const MATRIX_5x5 = {
  FOUNDATION: {
    description: 'What is it made of?',
    dimensions: {
      SOURCE_ORIGIN: {
        question: 'Where did this come from? Primary vs derivative?',
        maps_to: 'TRUTH',
        axiom: 'VERIFY'
      },
      EVIDENCE_BASE: {
        question: 'What evidence supports it? Hard data vs opinion?',
        maps_to: 'INTEGRITY',
        axiom: 'VERIFY'
      },
      LOGICAL_COHERENCE: {
        question: 'Does it follow logically? Contradictions?',
        maps_to: 'COHERENCE',
        axiom: 'PHI'
      },
      TEMPORAL_VALIDITY: {
        question: 'Still relevant? Outdated assumptions?',
        maps_to: 'PROGRESS',
        axiom: 'BURN'
      },
      DOMAIN_FIT: {
        question: 'Right tool for the job? Context appropriate?',
        maps_to: 'ALIGNMENT',
        axiom: 'BURN'
      }
    }
  },

  STRUCTURE: {
    description: 'How is it built?',
    dimensions: {
      SIMPLICITY: {
        question: "Occam's razor. Unnecessary complexity?",
        maps_to: 'SIMPLIFY',
        axiom: 'CULTURE'
      },
      MODULARITY: {
        question: 'Can parts be reused? Coupled vs decoupled?',
        maps_to: 'SCALE',
        axiom: 'BURN'
      },
      EXTENSIBILITY: {
        question: 'Room to grow? Dead ends?',
        maps_to: 'ENABLE',
        axiom: 'CULTURE'
      },
      ROBUSTNESS: {
        question: 'Handles edge cases? Fails gracefully?',
        maps_to: 'SECURE',
        axiom: 'VERIFY'
      },
      ELEGANCE: {
        question: 'Beautiful solution? Or kludge?',
        maps_to: 'HARMONY',
        axiom: 'PHI'
      }
    }
  },

  DYNAMICS: {
    description: 'How does it move?',
    dimensions: {
      ADAPTABILITY: {
        question: 'Changes with context? Rigid?',
        maps_to: 'PROGRESS',
        axiom: 'BURN'
      },
      SCALABILITY: {
        question: 'Works at 10x? 100x?',
        maps_to: 'SCALE',
        axiom: 'BURN'
      },
      FEEDBACK_LOOPS: {
        question: 'Self-correcting? Or runaway?',
        maps_to: 'LEARNING_RATE',
        axiom: 'META'
      },
      ENERGY_EFFICIENCY: {
        question: 'Effort vs output ratio?',
        maps_to: 'SIMPLIFY',
        axiom: 'CULTURE'
      },
      MOMENTUM: {
        question: 'Sustainable velocity? Burnout risk?',
        maps_to: 'OPTIMISM',
        axiom: 'CULTURE'
      }
    }
  },

  RELATIONSHIPS: {
    description: 'How does it connect?',
    dimensions: {
      DEPENDENCY_HEALTH: {
        question: 'What does it rely on? Single points of failure?',
        maps_to: 'SECURE',
        axiom: 'VERIFY'
      },
      INTERFACE_CLARITY: {
        question: 'Clear boundaries? API well-defined?',
        maps_to: 'SIMPLIFY',
        axiom: 'CULTURE'
      },
      NETWORK_EFFECTS: {
        question: 'Gets better with more users/use?',
        maps_to: 'SCALE',
        axiom: 'BURN'
      },
      COMPOSABILITY: {
        question: 'Plays well with others?',
        maps_to: 'ENABLE',
        axiom: 'CULTURE'
      },
      TRUST_GRADIENT: {
        question: 'Appropriate trust levels? Verify before trust?',
        maps_to: 'TRUST',
        axiom: 'VERIFY'
      }
    }
  },

  META: {
    description: 'What about itself?',
    dimensions: {
      SELF_AWARENESS: {
        question: 'Knows its own limits? Blind spots?',
        maps_to: 'SELF_AWARENESS',
        axiom: 'META'
      },
      REVERSIBILITY: {
        question: 'Can undo? Exit strategy?',
        maps_to: 'SECURE',
        axiom: 'VERIFY'
      },
      MEASURABILITY: {
        question: 'Can we know if it is working?',
        maps_to: 'INTEGRITY',
        axiom: 'VERIFY'
      },
      LEARNABILITY: {
        question: 'Gets smarter over time?',
        maps_to: 'LEARNING_RATE',
        axiom: 'META'
      },
      ALIGNMENT: {
        question: 'Serves intended purpose? Drift risk?',
        maps_to: 'ALIGNMENT',
        axiom: 'BURN'
      }
    }
  }
};

// =============================================================================
// MAPPING ENGINE
// =============================================================================

/**
 * Build reverse mapping: 4 Mondes dimension → [5×5 dimensions]
 */
function buildReverseMapping() {
  const reverse = {};

  for (const [rowName, row] of Object.entries(MATRIX_5x5)) {
    for (const [dimName, config] of Object.entries(row.dimensions)) {
      const target = config.maps_to;
      if (!reverse[target]) {
        reverse[target] = [];
      }
      reverse[target].push({
        name: dimName,
        row: rowName,
        axiom: config.axiom,
        question: config.question
      });
    }
  }

  return reverse;
}

const REVERSE_MAPPING = buildReverseMapping();

/**
 * Convert 5×5 input scores to 4 Mondes format
 * @param {Object} fiveByFiveScores - Scores keyed by 5×5 dimension names
 * @returns {Object} Scores keyed by 4 Mondes dimension names
 */
function mapTo4Worlds(fiveByFiveScores) {
  const fourWorldsScores = {};
  const mappingUsed = {};

  // For each 4 Mondes dimension, aggregate from mapped 5×5 dimensions
  for (const [targetDim, sources] of Object.entries(REVERSE_MAPPING)) {
    const sourceScores = sources
      .map(s => fiveByFiveScores[s.name])
      .filter(score => score !== undefined && score !== null);

    if (sourceScores.length > 0) {
      // φ-weighted geometric mean for multiple sources
      if (sourceScores.length === 1) {
        fourWorldsScores[targetDim] = sourceScores[0];
      } else {
        // Geometric mean (consistent with CYNIC scoring)
        const product = sourceScores.reduce((acc, s) => acc * s, 1);
        fourWorldsScores[targetDim] = Math.pow(product, 1 / sourceScores.length);
      }

      mappingUsed[targetDim] = sources.map(s => s.name);
    }
  }

  return { scores: fourWorldsScores, mapping: mappingUsed };
}

/**
 * Convert 4 Mondes judgment back to 5×5 format
 * @param {Object} judgment - CYNIC judgment with scores
 * @returns {Object} Scores in 5×5 format
 */
function mapFrom4Worlds(judgment) {
  const fiveByFiveScores = {};
  const dimensionScores = judgment.scores || {};

  for (const [rowName, row] of Object.entries(MATRIX_5x5)) {
    for (const [dimName, config] of Object.entries(row.dimensions)) {
      const sourceScore = dimensionScores[config.maps_to];
      if (sourceScore !== undefined) {
        fiveByFiveScores[dimName] = {
          score: sourceScore,
          mapped_from: config.maps_to,
          row: rowName,
          question: config.question
        };
      }
    }
  }

  return fiveByFiveScores;
}

// =============================================================================
// JUDGMENT MODES
// =============================================================================

const MODES = {
  quick: {
    dimensions: ['SOURCE_ORIGIN', 'SIMPLICITY', 'ADAPTABILITY', 'DEPENDENCY_HEALTH', 'ALIGNMENT'],
    description: 'One dimension per row'
  },
  standard: {
    dimensions: [
      'SOURCE_ORIGIN', 'EVIDENCE_BASE',
      'SIMPLICITY', 'ROBUSTNESS',
      'ADAPTABILITY', 'SCALABILITY',
      'DEPENDENCY_HEALTH', 'INTERFACE_CLARITY',
      'SELF_AWARENESS', 'MEASURABILITY'
    ],
    description: 'Two dimensions per row'
  },
  thorough: {
    dimensions: [
      'SOURCE_ORIGIN', 'EVIDENCE_BASE', 'LOGICAL_COHERENCE',
      'SIMPLICITY', 'ROBUSTNESS', 'ELEGANCE',
      'ADAPTABILITY', 'SCALABILITY', 'FEEDBACK_LOOPS',
      'DEPENDENCY_HEALTH', 'INTERFACE_CLARITY', 'COMPOSABILITY',
      'SELF_AWARENESS', 'MEASURABILITY', 'LEARNABILITY'
    ],
    description: 'Three dimensions per row'
  },
  full: {
    dimensions: Object.values(MATRIX_5x5).flatMap(row => Object.keys(row.dimensions)),
    description: 'All 25 dimensions'
  }
};

// =============================================================================
// VERDICTS (Dog personality)
// =============================================================================

const VERDICTS = {
  HOWL: { threshold: 0.55, emoji: '🐕', description: 'Exceptional quality, rare achievement' },
  WAG: { threshold: 0.45, emoji: '🐕', description: 'Generally good, minor improvements possible' },
  GROWL: { threshold: 0.35, emoji: '🐕', description: 'Minor issues, address before proceeding' },
  BARK: { threshold: 0, emoji: '🐕', description: 'Serious concerns, proceed with caution' }
};

function getVerdict(score) {
  if (score >= VERDICTS.HOWL.threshold) return 'HOWL';
  if (score >= VERDICTS.WAG.threshold) return 'WAG';
  if (score >= VERDICTS.GROWL.threshold) return 'GROWL';
  return 'BARK';
}

// =============================================================================
// SKILL JUDGE CLASS
// =============================================================================

/**
 * SkillJudge - Public interface for /judge skill
 *
 * Accepts 5×5 thinking, judges via 4 Mondes internally
 * NOW WITH LEARNING: Evolves from feedback, caches results, updates Harmony
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

    // Load learned weights if they exist
    this.learnedWeights = this._loadLearnedWeights();

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

  /**
   * Load previously learned dimension weights
   */
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

  /**
   * Save learned weights
   */
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

  /**
   * Append judgment to history
   */
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

  /**
   * Apply learned weight adjustments to scores
   */
  _applyLearnedWeights(scores) {
    if (!this.learning.enabled || !this.learnedWeights.adjustments) {
      return scores;
    }

    const adjusted = { ...scores };
    for (const [dim, data] of Object.entries(adjusted)) {
      const adjustment = this.learnedWeights.adjustments[dim];
      if (adjustment) {
        // φ-bounded adjustment: score * (1 + adjustment * φ⁻²)
        const factor = 1 + (adjustment.factor || 0) * PHI_INV_2;
        data.score = Math.min(100, Math.max(0, data.score * factor));
        data.learned_adjustment = adjustment.factor;
      }
    }
    return adjusted;
  }

  /**
   * Judge an item using the 5×5 interface
   *
   * @param {any} item - Item to judge (code, idea, decision, etc.)
   * @param {Object} options - Judgment options
   * @param {string} options.mode - quick|standard|thorough|full
   * @param {boolean} options.verbose - Include internal mapping details
   * @param {string} options.source - Source identifier
   * @returns {Promise<Object>} Judgment result in 5×5 format with optional internal view
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

    // 0. Check cache first (if enabled and not skipped)
    if (this.learning.useCache && !skipCache) {
      const cached = judgmentCache.get(item);
      if (cached && cached.result.mode === mode) {
        this.stats.cacheHits++;
        judgmentCache.recordHit(item);
        // Return cached with updated meta
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

    // 1. Run internal 4 Mondes judgment
    const internalJudgment = await this.selfJudge.judge(item, {
      source,
      mode: mode === 'full' ? 'full' : mode === 'thorough' ? 'thorough' : 'standard',
      timestamp: new Date().toISOString()
    });

    // 2. Map results back to 5×5 format
    const fiveByFiveScores = mapFrom4Worlds(internalJudgment);

    // 3. Filter to requested mode dimensions
    let filteredScores = {};
    for (const dimName of modeConfig.dimensions) {
      if (fiveByFiveScores[dimName]) {
        filteredScores[dimName] = fiveByFiveScores[dimName];
      }
    }

    // 3.5 Apply learned weight adjustments (LEARNING)
    filteredScores = this._applyLearnedWeights(filteredScores);

    // 4. Calculate aggregate (φ-constrained)
    const scoreValues = Object.values(filteredScores).map(d => d.score);
    const mean = scoreValues.length > 0
      ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length / 100
      : 0.5;

    // Apply φ ceiling
    const confidence = Math.min(mean, PHI_INV);
    const doubt = Math.max(1 - confidence, PHI_INV_2);
    const verdict = getVerdict(confidence);

    // 5. Build response
    const response = {
      // === PUBLIC 5×5 VIEW ===
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

      // === TRANSPARENCY META ===
      _meta: {
        interface: '5x5',
        internal: '4worlds',
        mode_dimensions: modeConfig.dimensions.length,
        processing_time_ms: Date.now() - startTime,
        phi_ceiling_applied: mean > PHI_INV,
        doubt_floor_applied: (1 - mean) < PHI_INV_2
      }
    };

    // 6. Add internal view if verbose
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

    // 7. LEARNING: Update Harmony matrix with dimension correlations
    if (this.learning.enabled && this.learning.updateHarmony) {
      try {
        const correlations = this._extractCorrelations(filteredScores, verdict);
        if (correlations.length > 0) {
          await updateHarmony(correlations, source);
          this.stats.harmonyUpdates++;
        }
      } catch (e) {
        this.logger.warn('[SkillJudge] Harmony update failed:', e.message);
      }
    }

    // 8. LEARNING: Track history
    this._appendToHistory(response, item);

    // 9. Cache the result for future lookups
    if (this.learning.useCache && !skipCache) {
      judgmentCache.set(item, response);
    }

    return response;
  }

  /**
   * Extract dimension correlations from judgment for Harmony learning
   */
  _extractCorrelations(dimensions, verdict) {
    const correlations = [];
    const dimEntries = Object.entries(dimensions);

    // Create correlation pairs based on score similarity
    for (let i = 0; i < dimEntries.length; i++) {
      for (let j = i + 1; j < dimEntries.length; j++) {
        const [nameA, dataA] = dimEntries[i];
        const [nameB, dataB] = dimEntries[j];

        // Score similarity indicates correlation
        const scoreDiff = Math.abs(dataA.score - dataB.score);
        const similarity = 1 - (scoreDiff / 100);

        // Only record strong correlations (φ⁻¹ threshold)
        if (similarity >= PHI_INV) {
          correlations.push({
            from: dataA.mapped_from,
            to: dataB.mapped_from,
            weight: similarity * PHI_INV, // φ-bounded
            context: verdict
          });
        }
      }
    }

    return correlations;
  }

  /**
   * Generate dog personality summary
   */
  _generateDogSummary(verdict, confidence, dimensions) {
    const weakPoints = Object.entries(dimensions)
      .filter(([_, d]) => d.score < 50)
      .map(([name, _]) => name);

    const strongPoints = Object.entries(dimensions)
      .filter(([_, d]) => d.score >= 70)
      .map(([name, _]) => name);

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

  /**
   * Get axioms touched by evaluated dimensions
   */
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

  /**
   * Get available modes
   */
  getModes() {
    return Object.entries(MODES).map(([name, config]) => ({
      name,
      dimensions: config.dimensions.length,
      description: config.description
    }));
  }

  /**
   * Get the full 5×5 matrix definition
   */
  getMatrix() {
    return MATRIX_5x5;
  }

  /**
   * Get mapping documentation
   */
  getMappingDoc() {
    const doc = [];

    for (const [rowName, row] of Object.entries(MATRIX_5x5)) {
      doc.push(`\n## ${rowName}: ${row.description}\n`);
      for (const [dimName, config] of Object.entries(row.dimensions)) {
        doc.push(`- **${dimName}** → ${config.maps_to} [${config.axiom}]`);
        doc.push(`  "${config.question}"`);
      }
    }

    return doc.join('\n');
  }

  // ===========================================================================
  // LEARNING METHODS (LEARNABILITY)
  // ===========================================================================

  /**
   * Learn from feedback on a previous judgment
   *
   * This is how CYNIC evolves: when a judgment proves wrong or right,
   * feedback adjusts dimension weights for future judgments.
   *
   * @param {Object} feedback - Feedback object
   * @param {string} feedback.judgmentId - Identifier of the judgment (subject or timestamp)
   * @param {Object} feedback.corrections - Dimension corrections { DIMENSION: +/-score_delta }
   * @param {string} feedback.outcome - 'confirmed' | 'refuted' | 'partial'
   * @param {string} feedback.notes - Optional notes explaining the feedback
   * @returns {Object} Learning result
   */
  learn(feedback = {}) {
    if (!this.learning.enabled) {
      return { success: false, reason: 'Learning disabled' };
    }

    const { corrections = {}, outcome = 'partial', notes = '' } = feedback;

    // φ-bounded learning rate
    const learningRate = PHI_INV_2; // 38.2% - conservative adjustment

    let adjustmentsMade = 0;

    for (const [dimName, delta] of Object.entries(corrections)) {
      // Find the 4 Mondes dimension this maps to
      let targetDim = null;
      for (const row of Object.values(MATRIX_5x5)) {
        if (row.dimensions[dimName]) {
          targetDim = row.dimensions[dimName].maps_to;
          break;
        }
      }

      if (targetDim) {
        // Initialize or update the adjustment
        if (!this.learnedWeights.adjustments[targetDim]) {
          this.learnedWeights.adjustments[targetDim] = {
            factor: 0,
            samples: 0,
            history: []
          };
        }

        const adj = this.learnedWeights.adjustments[targetDim];

        // Exponential moving average for smooth learning
        const normalizedDelta = Math.max(-1, Math.min(1, delta / 100));
        adj.factor = adj.factor * (1 - learningRate) + normalizedDelta * learningRate;

        // Clamp to φ bounds
        adj.factor = Math.max(-PHI_INV, Math.min(PHI_INV, adj.factor));

        adj.samples++;
        adj.history.push({
          timestamp: new Date().toISOString(),
          delta: normalizedDelta,
          outcome
        });

        // Keep history bounded (last 100 samples)
        if (adj.history.length > 100) {
          adj.history = adj.history.slice(-100);
        }

        adjustmentsMade++;
      }
    }

    // Increment version and save
    this.learnedWeights.version++;
    this._saveLearnedWeights();

    // Update stats
    this.stats.feedbackReceived++;
    this.stats.lastLearning = new Date().toISOString();

    // Log the learning event
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

  /**
   * Get learning statistics
   */
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

  /**
   * Reset learned weights (use with caution)
   */
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

  /**
   * Get current learned weight adjustments for introspection
   */
  getLearnedWeights() {
    return JSON.parse(JSON.stringify(this.learnedWeights));
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  SkillJudge,
  MATRIX_5x5,
  MODES,
  VERDICTS,
  REVERSE_MAPPING,
  mapTo4Worlds,
  mapFrom4Worlds,
  getVerdict,

  // Learning infrastructure
  judgmentCache,
  LRUCache,
  JUDGMENT_HISTORY_PATH,
  LEARNED_WEIGHTS_PATH,

  // Constants re-exported for convenience
  PHI,
  PHI_INV,
  PHI_INV_2
};
