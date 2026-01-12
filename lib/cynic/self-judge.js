/**
 * CYNIC Self-Judge
 *
 * "φ qui se méfie de φ"
 * "Rendre autonome, pas automatiser"
 *
 * Architecture: 5² = 25 dimensions fondamentales
 *   - 16 CYNIC (8 PRIMARY + 5 SECONDARY + 3 META)
 *   - 8 HUMAN_LLM (autonomization dimensions)
 *   - 1 DISCOVERY (via ResidualDetector - see residual-detector.js)
 *
 * @see /knowledge/architecture/CYNIC_COMPLETE_MATRIX.md
 */

'use strict';

const { PHI, PHI_2: PHI_SQ, PHI_INV, PHI_INV_2 } = require('../temporal');
const crypto = require('crypto');

// Signing key for CYNIC integrity (stable, not time-based)
const CYNIC_SIGNING_KEY = 'cynic:phi-qui-se-mefie-de-phi:v1';

// CYNIC limits
const MAX_CONFIDENCE = PHI_INV; // 61.8% - never exceed
const MIN_DOUBT = PHI_INV_2; // 38.2% - always maintain (space for human)

// =============================================================================
// INFERENCE SCALING CONSTANTS (Fibonacci-based)
// =============================================================================

const FIBONACCI_N = {
  QUICK: 3,     // Fast judgment (Level 1-2 DAAT)
  STANDARD: 5,  // Normal judgment (Level 3 DAAT)
  THOROUGH: 8,  // Deep judgment (Level 4 DAAT)
};

// Diversity/temperature for exploration (φ-based)
const DIVERSITY = {
  LOW: PHI_INV_2,    // 0.382 - conservative exploration
  MEDIUM: PHI_INV,   // 0.618 - balanced exploration
  HIGH: PHI_INV * PHI_INV + PHI_INV_2, // ~1.0 - maximum diversity
};

// =============================================================================
// SELF-REFINEMENT CONSTANTS (Fibonacci iterations)
// =============================================================================

const REFINEMENT = {
  MAX_ITERATIONS: 8,              // Fibonacci: max refinement cycles
  CONVERGENCE_THRESHOLD: 3,       // Fibonacci: consecutive stable iterations
  MIN_IMPROVEMENT: PHI_INV_2 * 10, // 3.82 points minimum improvement per cycle
  TRANSFORMATION_STRATEGIES: [
    'ADD_SOURCE',       // Add verifiable source
    'ADD_SIGNATURE',    // Add cryptographic signature
    'ANONYMIZE',        // Remove PII, add hashes
    'SIMPLIFY',         // Reduce complexity
    'ALIGN_INCENTIVES', // Fix misaligned incentives
    'ENABLE_HUMAN',     // Ensure human enablement
    'ADD_PROOF',        // Add verifiable proof
    'DECENTRALIZE',     // Remove centralization
  ],
};

// =============================================================================
// LEARNING CONSTANTS (φ-weighted reinforcement)
// =============================================================================

const LEARNING = {
  // Learning rate bounds (φ-based)
  BASE_LEARNING_RATE: PHI_INV_2,     // 0.382 - conservative learning
  MIN_LEARNING_RATE: PHI_INV_2 / 10, // 0.0382 - minimum adjustment
  MAX_LEARNING_RATE: PHI_INV,        // 0.618 - maximum adjustment

  // Reward signal weights
  REWARD_WEIGHTS: {
    CORRECT_ACCEPT: PHI,      // 1.618 - rewarded for correct accept
    CORRECT_TRANSFORM: PHI,   // 1.618 - rewarded for correct transform
    FALSE_POSITIVE: -PHI_SQ,  // -2.618 - penalized for wrong accept
    FALSE_NEGATIVE: -PHI,     // -1.618 - penalized for wrong transform
  },

  // Memory settings
  MAX_HISTORY: 100,              // Keep last N judgments for learning
  DECAY_FACTOR: PHI_INV,         // Older judgments decay by φ⁻¹

  // Threshold adjustment bounds
  THRESHOLD_MIN: 30,             // Never go below 30%
  THRESHOLD_MAX: 95,             // Never exceed 95%
  THRESHOLD_STEP: PHI_INV_2 * 5, // ~1.9 points per adjustment

  // Outcome types
  OUTCOMES: {
    CORRECT: 'correct',          // Judgment was right
    INCORRECT: 'incorrect',      // Judgment was wrong
    PARTIAL: 'partial',          // Partially correct
    UNKNOWN: 'unknown',          // No feedback yet
  },
};

// =============================================================================
// THE 4 WORLDS (Kabbalistic mapping to axioms)
// =============================================================================

const WORLDS = {
  ATZILUT: {
    name: 'Atzilut',
    meaning: 'Emanation',
    axiom: 'PHI',
    mode: 'SENSE', // CYNIC senses the ratio
    question: 'Is it harmonious with the universal ratio?',
    dimensions: ['HARMONY', 'COHERENCE'],
  },
  BERIAH: {
    name: 'Beriah',
    meaning: 'Creation',
    axiom: 'VERIFY',
    mode: 'THINK', // CYNIC thinks, verifies
    question: 'Is it verifiable? Can it be proven?',
    dimensions: ['TRUTH', 'INTEGRITY'],
  },
  YETZIRAH: {
    name: 'Yetzirah',
    meaning: 'Formation',
    axiom: 'CULTURE',
    mode: 'FEEL', // CYNIC feels values
    question: 'Is it aligned with our values?',
    dimensions: ['ETHICS', 'OPTIMISM'],
  },
  ASSIAH: {
    name: 'Assiah',
    meaning: 'Action',
    axiom: 'BURN',
    mode: 'ACT', // CYNIC acts (but suggests, doesn't decide)
    question: 'Does it converge toward singularity?',
    dimensions: ['ALIGNMENT', 'PROGRESS'],
  },
};

// =============================================================================
// FIBONACCI STRUCTURE (1, 1, 2, 3, 5, 8)
// =============================================================================

const DIMENSIONS = {
  // -------------------------------------------------------------------------
  // PRIMARY: 8 Judgments (2 per world/axiom) - Weight: φ²
  // -------------------------------------------------------------------------
  PRIMARY: {
    weight: PHI_SQ,

    // ATZILUT / φ
    HARMONY: {
      world: 'ATZILUT',
      axiom: 'PHI',
      question: "L'équilibre φ est-il respecté?",
      threshold: 60,
    },
    COHERENCE: {
      world: 'ATZILUT',
      axiom: 'PHI',
      question: 'Is it coherent with the whole?',
      threshold: 70,
    },

    // BERIAH / VERIFY
    TRUTH: {
      world: 'BERIAH',
      axiom: 'VERIFY',
      question: 'Is it verifiable and reproducible?',
      threshold: 70,
    },
    INTEGRITY: {
      world: 'BERIAH',
      axiom: 'VERIFY',
      question: 'Is it tamper-proof and signed?',
      threshold: 80,
    },

    // YETZIRAH / CULTURE
    ETHICS: {
      world: 'YETZIRAH',
      axiom: 'CULTURE',
      question: 'Respecte-t-il les valeurs cypherpunk?',
      threshold: 75,
    },
    OPTIMISM: {
      world: 'YETZIRAH',
      axiom: 'CULTURE',
      question: 'Construit-il vers le positif?',
      threshold: 50,
    },

    // ASSIAH / BURN
    ALIGNMENT: {
      world: 'ASSIAH',
      axiom: 'BURN',
      question: 'Are incentives aligned?',
      threshold: 70,
    },
    PROGRESS: {
      world: 'ASSIAH',
      axiom: 'BURN',
      question: 'Does it advance toward singularity?',
      threshold: 50,
    },
  },

  // -------------------------------------------------------------------------
  // SECONDARY: 5 Operations (how CYNIC serves humans) - Weight: φ
  // -------------------------------------------------------------------------
  SECONDARY: {
    weight: PHI,

    SECURE: {
      purpose: 'Protect without imprisoning',
      antiPattern: 'Total surveillance',
      threshold: 85,
    },
    PRIVATE: {
      purpose: 'Respect without hiding',
      antiPattern: 'Forced transparency',
      threshold: 90, // Critical - cypherpunk value
    },
    SCALE: {
      purpose: 'Grow without dominating',
      antiPattern: 'Monopoly',
      threshold: 50,
    },
    SIMPLIFY: {
      purpose: 'Clarify without reducing',
      antiPattern: 'Obscurantism',
      threshold: 60,
    },
    ENABLE: {
      purpose: 'Enable autonomy, don\'t automate',
      antiPattern: 'Human replacement',
      threshold: 70, // Key mission
    },
  },

  // -------------------------------------------------------------------------
  // META: 3 Self-Awareness - Weight: 1.0
  // -------------------------------------------------------------------------
  META: {
    weight: 1.0,

    SELF_AWARENESS: {
      question: 'Je sais ce que je ne sais pas',
      threshold: 50,
    },
    LEARNING_RATE: {
      question: "J'apprends de mes erreurs",
      threshold: 50,
    },
    SINGULARITY_DISTANCE: {
      question: 'Je mesure ma distance au but',
      threshold: 30, // Always far from singularity
    },
  },

  // -------------------------------------------------------------------------
  // HUMAN_LLM: 8 Autonomization dimensions (how CYNIC autonomizes humans)
  // "Rendre autonome, pas automatiser"
  // Weight: φ (same as SECONDARY - human-serving dimensions)
  // -------------------------------------------------------------------------
  HUMAN_LLM: {
    weight: PHI,

    // φ (PHI) - Équilibre de la relation
    MEMORY: {
      axiom: 'PHI',
      purpose: 'Qualité de la mémoire contextuelle',
      question: 'Le contexte est-il bien préservé et accessible?',
      threshold: 60,
    },
    TEACHING: {
      axiom: 'PHI',
      purpose: 'Transfert de connaissance bidirectionnel',
      question: "L'humain apprend-il? Le LLM apprend-il de l'humain?",
      threshold: 50,
    },

    // VERIFY - Établir la confiance
    INTENT: {
      axiom: 'VERIFY',
      purpose: "Clarté d'intention détectée",
      question: "L'intention de l'humain est-elle claire et comprise?",
      threshold: 70,
    },
    TRUST: {
      axiom: 'VERIFY',
      purpose: 'Confiance bidirectionnelle humain ↔ LLM',
      question: 'La confiance mutuelle est-elle établie?',
      threshold: 60,
    },

    // CULTURE - Synergie collaborative
    PROACTIVITY: {
      axiom: 'CULTURE',
      purpose: 'Anticipation vs réactivité',
      question: 'Le LLM anticipe-t-il les besoins sans être intrusif?',
      threshold: 50,
    },
    COMPLEMENTARITY: {
      axiom: 'CULTURE',
      purpose: 'Synergie des forces respectives',
      question: 'Humain et LLM utilisent-ils leurs forces complémentaires?',
      threshold: 60,
    },

    // BURN - Respecter les limites
    DELEGATION: {
      axiom: 'BURN',
      purpose: 'Niveau de délégation approprié',
      question: 'La délégation est-elle au bon niveau (ni trop, ni pas assez)?',
      threshold: 60,
    },
    BOUNDARIES: {
      axiom: 'BURN',
      purpose: 'Respect des limites établies',
      question: 'Les limites humain/LLM sont-elles respectées?',
      threshold: 70,
    },
  },
};

// =============================================================================
// SELF-JUDGE CLASS
// =============================================================================

class SelfJudge {
  constructor(options = {}) {
    this.dimensions = DIMENSIONS;
    this.worlds = WORLDS;
    this.maxConfidence = MAX_CONFIDENCE;
    this.minDoubt = MIN_DOUBT;
    this.logger = options.logger || console;

    // Learning state
    this._judgmentHistory = [];
    this._learningStats = {
      totalJudgments: 0,
      correctAccepts: 0,
      correctTransforms: 0,
      falsePositives: 0,
      falseNegatives: 0,
      totalReward: 0,
      learningIterations: 0,
      thresholdAdjustments: {},
    };

    // Dynamic thresholds (can be adjusted by learning)
    this._dynamicThresholds = {};
  }

  // ---------------------------------------------------------------------------
  // INFERENCE SCALING: Multi-sample judgment with self-consistency
  // ---------------------------------------------------------------------------

  /**
   * Judge with inference-time scaling (best-of-N with self-consistency)
   *
   * @param {Object} item - Item to judge
   * @param {Object} context - Context for judgment
   * @param {Object} options - Scaling options
   * @param {number} options.n - Number of samples (default: FIBONACCI_N.STANDARD = 5)
   * @param {number} options.diversity - Diversity factor (default: DIVERSITY.MEDIUM)
   * @param {string} options.aggregation - 'vote' | 'geometric' | 'weighted' (default: 'geometric')
   * @returns {Object} Scaled judgment with consensus metrics
   */
  async judgeWithScaling(item, context = {}, options = {}) {
    const startTime = Date.now();
    const n = options.n || FIBONACCI_N.STANDARD;
    const diversity = options.diversity || DIVERSITY.MEDIUM;
    const aggregation = options.aggregation || 'geometric';

    // Generate N samples with diversity (skip recording for intermediate samples)
    const samples = [];
    for (let i = 0; i < n; i++) {
      // Apply diversity noise to context + skip recording for samples
      const diverseContext = this._applyDiversity(context, diversity, i, n);
      diverseContext._skipRecord = true; // Don't pollute history with samples
      const result = await this.judge(item, diverseContext);
      samples.push(result);
    }

    // Aggregate samples using selected method
    const aggregated = this._aggregateSamples(samples, aggregation);

    // Calculate consensus metrics
    const consensus = this._calculateConsensus(samples);

    // Determine if judgment is stable (high consensus = stable)
    const isStable = consensus.agreement >= PHI_INV; // 61.8% agreement threshold

    const finalResult = {
      ...aggregated,
      _scaling: {
        method: 'inference-time-scaling',
        n,
        diversity,
        aggregation,
        consensus,
        isStable,
        samples: samples.map(s => ({
          global: s.global,
          verdict: s.verdict.action,
          confidence: s.confidence,
        })),
        improvement: this._calculateImprovement(samples, aggregated),
        duration_ms: Date.now() - startTime,
      },
    };

    // Record ONLY the final aggregated judgment to history (not individual samples)
    // Respect _skipRecord flag from context (used by refinement loop)
    if (!context._skipRecord) {
      await this._logJudgment(item, finalResult);
    }

    return finalResult;
  }

  /**
   * Apply diversity to context for exploration
   * Uses φ-based perturbation to explore judgment space
   */
  _applyDiversity(context, diversity, sampleIndex, totalSamples) {
    // Create a copy of context
    const diverseContext = { ...context };

    // Calculate position in exploration space (0 to 1)
    const position = sampleIndex / (totalSamples - 1 || 1);

    // Apply φ-based noise to numeric context values
    const noise = (position - 0.5) * diversity * 2; // Range: -diversity to +diversity

    // Add stochastic component (simulates inherent judgment uncertainty)
    const stochastic = (Math.random() - 0.5) * diversity * 0.3;

    // Perturb singularity distance slightly
    if (diverseContext.singularityDistance !== undefined) {
      diverseContext.singularityDistance = Math.max(0.1, Math.min(0.9,
        diverseContext.singularityDistance + noise * 0.1 + stochastic * 0.05
      ));
    }

    // Add exploration marker with noise factor for score perturbation
    diverseContext._exploration = {
      sampleIndex,
      totalSamples,
      diversity,
      noise,
      stochastic,
      position,
      // Score perturbation: applied during dimension judgment
      scorePerturbation: Math.round((noise + stochastic) * 10),
    };

    return diverseContext;
  }

  /**
   * Apply score perturbation from diversity exploration
   * Simulates the inherent uncertainty in any judgment
   */
  _perturbScore(score, context) {
    if (!context._exploration || context._exploration.scorePerturbation === 0) {
      return score;
    }

    const perturbation = context._exploration.scorePerturbation;
    const perturbed = score + perturbation;

    // Clamp to valid range [0, 100]
    return Math.max(0, Math.min(100, Math.round(perturbed)));
  }

  /**
   * Aggregate multiple samples into single judgment
   */
  _aggregateSamples(samples, method) {
    if (samples.length === 0) {
      throw new Error('No samples to aggregate');
    }

    if (samples.length === 1) {
      return samples[0];
    }

    switch (method) {
      case 'vote':
        return this._majorityVote(samples);
      case 'weighted':
        return this._weightedAggregate(samples);
      case 'geometric':
      default:
        return this._geometricAggregate(samples);
    }
  }

  /**
   * Geometric mean aggregation (default - φ-aligned)
   */
  _geometricAggregate(samples) {
    const aggregated = { ...samples[0] };

    // Aggregate dimension scores using geometric mean
    const allScores = {};
    for (const sample of samples) {
      for (const [dim, score] of Object.entries(sample.scores)) {
        if (!allScores[dim]) allScores[dim] = [];
        allScores[dim].push(score);
      }
    }

    aggregated.scores = {};
    for (const [dim, scores] of Object.entries(allScores)) {
      aggregated.scores[dim] = this._geometricMean(scores);
    }

    // Recalculate global score
    aggregated.global = this._calculateGlobalScore(aggregated.scores);

    // Recalculate confidence
    const confidence = Math.min(aggregated.global / 100, this.maxConfidence);
    aggregated.confidence = Math.round(confidence * 1000) / 10;
    aggregated.doubt = Math.round((1 - confidence) * 1000) / 10;

    // Re-determine verdict
    aggregated.verdict = this._determineVerdict(aggregated.scores, aggregated.global);

    // Aggregate reasons (keep most common)
    aggregated.reasons = this._aggregateReasons(samples);

    return aggregated;
  }

  /**
   * Majority vote aggregation
   */
  _majorityVote(samples) {
    const aggregated = { ...samples[0] };

    // Vote on dimension scores (round to nearest 10)
    const allScores = {};
    for (const sample of samples) {
      for (const [dim, score] of Object.entries(sample.scores)) {
        if (!allScores[dim]) allScores[dim] = [];
        allScores[dim].push(Math.round(score / 10) * 10); // Bucket to nearest 10
      }
    }

    aggregated.scores = {};
    for (const [dim, scores] of Object.entries(allScores)) {
      aggregated.scores[dim] = this._mode(scores);
    }

    // Recalculate global and verdict
    aggregated.global = this._calculateGlobalScore(aggregated.scores);
    const confidence = Math.min(aggregated.global / 100, this.maxConfidence);
    aggregated.confidence = Math.round(confidence * 1000) / 10;
    aggregated.doubt = Math.round((1 - confidence) * 1000) / 10;
    aggregated.verdict = this._determineVerdict(aggregated.scores, aggregated.global);
    aggregated.reasons = this._aggregateReasons(samples);

    return aggregated;
  }

  /**
   * Weighted aggregation (higher scores get more weight - optimistic bias)
   */
  _weightedAggregate(samples) {
    const aggregated = { ...samples[0] };

    // Weight by global score (better judgments count more)
    const weights = samples.map(s => Math.pow(s.global / 100, PHI));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);

    // Weighted average of dimension scores
    const allScores = {};
    for (let i = 0; i < samples.length; i++) {
      for (const [dim, score] of Object.entries(samples[i].scores)) {
        if (!allScores[dim]) allScores[dim] = 0;
        allScores[dim] += score * normalizedWeights[i];
      }
    }

    aggregated.scores = {};
    for (const [dim, score] of Object.entries(allScores)) {
      aggregated.scores[dim] = Math.round(score);
    }

    // Recalculate global and verdict
    aggregated.global = this._calculateGlobalScore(aggregated.scores);
    const confidence = Math.min(aggregated.global / 100, this.maxConfidence);
    aggregated.confidence = Math.round(confidence * 1000) / 10;
    aggregated.doubt = Math.round((1 - confidence) * 1000) / 10;
    aggregated.verdict = this._determineVerdict(aggregated.scores, aggregated.global);
    aggregated.reasons = this._aggregateReasons(samples);

    return aggregated;
  }

  /**
   * Calculate consensus metrics across samples
   */
  _calculateConsensus(samples) {
    if (samples.length < 2) {
      return { agreement: 1, variance: 0, spread: 0 };
    }

    // Calculate global score statistics
    const globals = samples.map(s => s.global);
    const mean = globals.reduce((a, b) => a + b, 0) / globals.length;
    const variance = globals.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / globals.length;
    const stdDev = Math.sqrt(variance);
    const spread = Math.max(...globals) - Math.min(...globals);

    // Agreement = 1 - normalized standard deviation
    // Perfect agreement = 0 std dev = 1.0 agreement
    const maxPossibleStdDev = 50; // Score range 0-100, max std dev ~50
    const agreement = Math.max(0, 1 - (stdDev / maxPossibleStdDev));

    // Verdict agreement
    const verdicts = samples.map(s => s.verdict.action);
    const verdictCounts = {};
    for (const v of verdicts) {
      verdictCounts[v] = (verdictCounts[v] || 0) + 1;
    }
    const maxVerdictCount = Math.max(...Object.values(verdictCounts));
    const verdictAgreement = maxVerdictCount / samples.length;

    return {
      agreement: Math.round(agreement * 1000) / 1000,
      verdictAgreement: Math.round(verdictAgreement * 1000) / 1000,
      variance: Math.round(variance * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      spread,
      mean: Math.round(mean),
    };
  }

  /**
   * Calculate improvement from scaling
   */
  _calculateImprovement(samples, aggregated) {
    const singlePassScore = samples[0].global;
    const scaledScore = aggregated.global;
    const improvement = scaledScore - singlePassScore;
    const improvementPercent = (improvement / singlePassScore) * 100;

    return {
      singlePass: singlePassScore,
      scaled: scaledScore,
      delta: improvement,
      percent: Math.round(improvementPercent * 10) / 10,
    };
  }

  /**
   * Aggregate reasons from samples (keep most frequent)
   */
  _aggregateReasons(samples) {
    const aggregatedReasons = {};

    for (const sample of samples) {
      for (const [dim, reason] of Object.entries(sample.reasons)) {
        if (!aggregatedReasons[dim]) {
          aggregatedReasons[dim] = {};
        }
        aggregatedReasons[dim][reason] = (aggregatedReasons[dim][reason] || 0) + 1;
      }
    }

    const finalReasons = {};
    for (const [dim, reasons] of Object.entries(aggregatedReasons)) {
      // Get most frequent reason
      finalReasons[dim] = Object.entries(reasons)
        .sort((a, b) => b[1] - a[1])[0][0];
    }

    return finalReasons;
  }

  /**
   * Calculate mode (most frequent value)
   */
  _mode(values) {
    const counts = {};
    for (const v of values) {
      counts[v] = (counts[v] || 0) + 1;
    }
    return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
  }

  // ---------------------------------------------------------------------------
  // SELF-REFINEMENT: Iterative improvement cycle
  // ---------------------------------------------------------------------------

  /**
   * Judge with self-refinement loop
   *
   * Cycle: JUDGE → CRITIQUE → TRANSFORM → JUDGE (repeat until ACCEPT or convergence)
   *
   * @param {Object} item - Item to judge and refine
   * @param {Object} context - Context for judgment
   * @param {Object} options - Refinement options
   * @param {number} options.maxIterations - Max refinement cycles (default: 8)
   * @param {boolean} options.autoTransform - Auto-apply transformations (default: false)
   * @param {boolean} options.useScaling - Use inference scaling for each judgment (default: true)
   * @param {Function} options.onIteration - Callback for each iteration
   * @returns {Object} Final judgment with refinement history
   */
  async judgeWithRefinement(item, context = {}, options = {}) {
    const startTime = Date.now();
    const maxIterations = options.maxIterations || REFINEMENT.MAX_ITERATIONS;
    const autoTransform = options.autoTransform || false;
    const useScaling = options.useScaling !== false;
    const onIteration = options.onIteration || (() => {});

    // Refinement state
    const history = [];
    let currentItem = { ...item };
    let iteration = 0;
    let converged = false;
    let consecutiveStable = 0;
    let lastScore = 0;

    // Refinement loop (skip recording for intermediate iterations)
    const refinementContext = { ...context, _skipRecord: true };

    while (iteration < maxIterations && !converged) {
      iteration++;

      // Judge current state (skip recording until final)
      const judgment = useScaling
        ? await this.judgeWithScaling(currentItem, refinementContext, { n: FIBONACCI_N.QUICK })
        : await this.judge(currentItem, refinementContext);

      // Critique: identify blocking dimensions
      const critique = this._critique(judgment);

      // Check for convergence
      const improvement = judgment.global - lastScore;
      if (Math.abs(improvement) < REFINEMENT.MIN_IMPROVEMENT) {
        consecutiveStable++;
        if (consecutiveStable >= REFINEMENT.CONVERGENCE_THRESHOLD) {
          converged = true;
        }
      } else {
        consecutiveStable = 0;
      }

      // Record iteration
      const iterationRecord = {
        iteration,
        global: judgment.global,
        verdict: judgment.verdict.action,
        confidence: judgment.confidence,
        blocking: critique.blocking,
        suggestions: critique.suggestions,
        improvement,
        converged,
      };
      history.push(iterationRecord);

      // Callback
      await onIteration(iterationRecord, judgment);

      // Check if accepted
      if (judgment.verdict.action === 'ACCEPT') {
        converged = true;
        break;
      }

      // Transform if not converged and auto-transform enabled
      if (!converged && autoTransform && critique.suggestions.length > 0) {
        currentItem = this._applyTransformations(currentItem, critique.suggestions);
      } else if (!converged && !autoTransform) {
        // Without auto-transform, we can't improve - exit loop
        break;
      }

      lastScore = judgment.global;
    }

    // Final re-sign after all transformations (ensures INTEGRITY is valid)
    if (currentItem._signed_by === 'CYNIC') {
      const contentToSign = JSON.stringify({
        ...currentItem,
        signature: undefined,
        _signed_at: undefined,
        _signed_by: undefined,
        _transformations: undefined,
      });
      currentItem.signature = crypto
        .createHmac('sha256', CYNIC_SIGNING_KEY)
        .update(contentToSign)
        .digest('hex')
        .slice(0, 16);
      currentItem._signed_at = Date.now();
    }

    // Final judgment
    const finalJudgment = useScaling
      ? await this.judgeWithScaling(currentItem, context, { n: FIBONACCI_N.STANDARD })
      : await this.judge(currentItem, context);

    return {
      ...finalJudgment,
      item: currentItem, // Transformed item (with valid signature)
      _refinement: {
        method: 'self-refinement-loop',
        iterations: iteration,
        maxIterations,
        converged,
        autoTransform,
        history,
        totalImprovement: finalJudgment.global - (history[0]?.global || 0),
        duration_ms: Date.now() - startTime,
        philosophy: 'INGEST → JUDGE → TRANSFORM → (loop)',
      },
    };
  }

  /**
   * Critique a judgment to identify blocking dimensions and suggest transformations
   */
  _critique(judgment) {
    const blocking = [];
    const suggestions = [];

    // Check each dimension against threshold (5² = 25 dimensions)
    const allDimensions = [
      ...Object.keys(this.dimensions.PRIMARY).filter(k => k !== 'weight'),
      ...Object.keys(this.dimensions.SECONDARY).filter(k => k !== 'weight'),
      ...Object.keys(this.dimensions.META).filter(k => k !== 'weight'),
      ...Object.keys(this.dimensions.HUMAN_LLM).filter(k => k !== 'weight'),
    ];

    for (const dim of allDimensions) {
      const score = judgment.scores[dim];
      const threshold = this._getThreshold(dim);

      if (score < threshold) {
        blocking.push({
          dimension: dim,
          score,
          threshold,
          gap: threshold - score,
          severity: this._calculateSeverity(score, threshold),
        });

        // Suggest transformation based on dimension
        const suggestion = this._suggestTransformation(dim, score, threshold);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    // Sort by severity (most severe first)
    blocking.sort((a, b) => b.severity - a.severity);
    suggestions.sort((a, b) => b.priority - a.priority);

    return {
      blocking,
      suggestions,
      criticalCount: blocking.filter(b => b.severity >= PHI_INV).length,
      totalGap: blocking.reduce((sum, b) => sum + b.gap, 0),
    };
  }

  /**
   * Get threshold for a dimension
   */
  _getThreshold(dim) {
    if (this.dimensions.PRIMARY[dim]) {
      return this.dimensions.PRIMARY[dim].threshold;
    }
    if (this.dimensions.SECONDARY[dim]) {
      return this.dimensions.SECONDARY[dim].threshold;
    }
    if (this.dimensions.META[dim]) {
      return this.dimensions.META[dim].threshold;
    }
    if (this.dimensions.HUMAN_LLM[dim]) {
      return this.dimensions.HUMAN_LLM[dim].threshold;
    }
    return 50; // Default threshold
  }

  /**
   * Calculate severity of a gap (0-1 scale, φ-weighted)
   */
  _calculateSeverity(score, threshold) {
    const gap = threshold - score;
    const maxGap = threshold; // Maximum possible gap
    const normalized = gap / maxGap;
    // Apply φ weighting: larger gaps are exponentially more severe
    return Math.min(1, Math.pow(normalized, 1 / PHI));
  }

  /**
   * Suggest transformation for a blocking dimension
   */
  _suggestTransformation(dimension, score, threshold) {
    const transformations = {
      // PRIMARY dimensions
      HARMONY: {
        strategy: 'REBALANCE',
        action: 'Adjust weights to follow φ ratios',
        field: 'weights',
        priority: PHI_INV,
      },
      COHERENCE: {
        strategy: 'ALIGN',
        action: 'Ensure consistency with existing patterns',
        field: 'parts',
        priority: PHI_INV,
      },
      TRUTH: {
        strategy: 'ADD_SOURCE',
        action: 'Add verifiable source reference',
        field: 'source',
        value: true,
        priority: PHI_SQ,
      },
      INTEGRITY: {
        strategy: 'ADD_SIGNATURE',
        action: 'Add cryptographic signature or hash',
        field: 'signature',
        value: 'required',
        priority: PHI_SQ,
      },
      ETHICS: {
        strategy: 'ANONYMIZE',
        action: 'Remove PII, ensure cypherpunk values',
        field: 'anonymous',
        value: true,
        priority: PHI_SQ,
      },
      OPTIMISM: {
        strategy: 'POSITIVE_FRAME',
        action: 'Frame as constructive action',
        field: 'action',
        value: 'build',
        priority: PHI_INV,
      },
      ALIGNMENT: {
        strategy: 'ALIGN_INCENTIVES',
        action: 'Ensure all stakeholders benefit',
        field: 'beneficiaries',
        value: 'all',
        priority: PHI,
      },
      PROGRESS: {
        strategy: 'ADD_BURN',
        action: 'Connect to burn mechanism',
        field: 'contributesBurn',
        value: true,
        priority: PHI,
      },

      // SECONDARY dimensions
      SECURE: {
        strategy: 'ENCRYPT',
        action: 'Add encryption or security markers',
        field: 'secure',
        value: true,
        priority: PHI,
      },
      PRIVATE: {
        strategy: 'ANONYMIZE',
        action: 'Remove all PII, use hashes',
        field: 'operatorHash',
        value: 'generate',
        priority: PHI_SQ, // Critical
      },
      SCALE: {
        strategy: 'MODULARIZE',
        action: 'Ensure scalable design',
        field: 'scalable',
        value: true,
        priority: PHI_INV,
      },
      SIMPLIFY: {
        strategy: 'SIMPLIFY',
        action: 'Reduce complexity',
        field: 'complexity',
        value: 'low',
        priority: PHI_INV,
      },
      ENABLE: {
        strategy: 'ENABLE_HUMAN',
        action: 'Ensure human autonomy, not replacement',
        field: 'enablesHuman',
        value: true,
        priority: PHI_SQ, // Critical mission
      },

      // META dimensions
      SELF_AWARENESS: {
        strategy: 'ACKNOWLEDGE',
        action: 'Explicitly acknowledge unknowns',
        field: 'acknowledged',
        value: [],
        priority: 1,
      },
      LEARNING_RATE: {
        strategy: 'LOG_CORRECTIONS',
        action: 'Track corrections for learning',
        field: 'corrections',
        priority: 1,
      },
      SINGULARITY_DISTANCE: {
        strategy: 'MAINTAIN_DISTANCE',
        action: 'Ensure φ⁻² distance from singularity',
        field: 'singularityDistance',
        value: PHI_INV_2,
        priority: 1,
      },
    };

    const transform = transformations[dimension];
    if (!transform) {
      return null;
    }

    return {
      dimension,
      ...transform,
      currentScore: score,
      targetScore: threshold,
      gap: threshold - score,
    };
  }

  /**
   * Apply transformations to an item
   */
  _applyTransformations(item, suggestions) {
    const transformed = { ...item };

    for (const suggestion of suggestions) {
      if (suggestion.field && suggestion.value !== undefined) {
        // Handle special values
        if (suggestion.value === 'generate') {
          // Generate a hash
          transformed[suggestion.field] = `auto_${Date.now().toString(36)}`;
        } else if (suggestion.strategy === 'ADD_SIGNATURE' && suggestion.value === 'required') {
          // Generate actual cryptographic signature (φ qui vérifie)
          const contentToSign = JSON.stringify({
            ...transformed,
            _transformations: undefined, // Exclude meta from signature
          });
          const signature = crypto
            .createHmac('sha256', CYNIC_SIGNING_KEY)
            .update(contentToSign)
            .digest('hex')
            .slice(0, 16); // φ⁻² length (≈38% of full hash)
          transformed.signature = signature;
          transformed._signed_at = Date.now();
          transformed._signed_by = 'CYNIC';
        } else if (suggestion.value === 'required') {
          // Mark as required (will fail validation if not provided externally)
          transformed[`_requires_${suggestion.field}`] = true;
        } else if (Array.isArray(suggestion.value)) {
          // Merge arrays
          transformed[suggestion.field] = [
            ...(transformed[suggestion.field] || []),
            ...suggestion.value,
          ];
        } else {
          // Direct value assignment
          transformed[suggestion.field] = suggestion.value;
        }
      }

      // Track transformations applied
      if (!transformed._transformations) {
        transformed._transformations = [];
      }
      transformed._transformations.push({
        dimension: suggestion.dimension,
        strategy: suggestion.strategy,
        field: suggestion.field,
      });
    }

    return transformed;
  }

  /**
   * Stream refinement progress (for UI/logging)
   */
  async *streamRefinement(item, context = {}, options = {}) {
    const maxIterations = options.maxIterations || REFINEMENT.MAX_ITERATIONS;
    const useScaling = options.useScaling !== false;

    let currentItem = { ...item };
    let iteration = 0;
    let converged = false;
    let consecutiveStable = 0;
    let lastScore = 0;

    while (iteration < maxIterations && !converged) {
      iteration++;

      // Judge
      const judgment = useScaling
        ? await this.judgeWithScaling(currentItem, context, { n: FIBONACCI_N.QUICK })
        : await this.judge(currentItem, context);

      // Critique
      const critique = this._critique(judgment);

      // Check convergence
      const improvement = judgment.global - lastScore;
      if (Math.abs(improvement) < REFINEMENT.MIN_IMPROVEMENT) {
        consecutiveStable++;
        converged = consecutiveStable >= REFINEMENT.CONVERGENCE_THRESHOLD;
      } else {
        consecutiveStable = 0;
      }

      // Yield progress
      yield {
        type: 'iteration',
        iteration,
        maxIterations,
        judgment,
        critique,
        improvement,
        converged,
        verdict: judgment.verdict.action,
      };

      // Stop if accepted
      if (judgment.verdict.action === 'ACCEPT') {
        converged = true;
        break;
      }

      // Transform
      if (!converged && critique.suggestions.length > 0) {
        currentItem = this._applyTransformations(currentItem, critique.suggestions);
        yield {
          type: 'transformation',
          iteration,
          transformations: critique.suggestions.map(s => s.strategy),
          item: currentItem,
        };
      } else if (!converged) {
        break;
      }

      lastScore = judgment.global;
    }

    // Final result
    const finalJudgment = useScaling
      ? await this.judgeWithScaling(currentItem, context, { n: FIBONACCI_N.STANDARD })
      : await this.judge(currentItem, context);

    yield {
      type: 'complete',
      iteration,
      converged,
      finalJudgment,
      finalItem: currentItem,
    };
  }

  // ---------------------------------------------------------------------------
  // Main judgment entry point (single pass - original method)
  // ---------------------------------------------------------------------------

  async judge(item, context = {}) {
    const startTime = Date.now();
    const scores = {};
    const reasons = {};
    const worldScores = {};

    // Traverse the 4 worlds
    for (const [worldKey, world] of Object.entries(this.worlds)) {
      worldScores[worldKey] = {
        world: world.name,
        axiom: world.axiom,
        mode: world.mode,
        dimensions: {},
      };

      // Judge each dimension in this world
      for (const dimName of world.dimensions) {
        const result = await this._judgeDimension(dimName, item, context);
        scores[dimName] = result.score;
        reasons[dimName] = result.reason;
        worldScores[worldKey].dimensions[dimName] = result;
      }

      // Calculate world score (geometric mean of its dimensions)
      const dimScores = Object.values(worldScores[worldKey].dimensions).map(d => d.score);
      worldScores[worldKey].score = this._geometricMean(dimScores);
    }

    // Judge SECONDARY dimensions
    for (const [dimName] of Object.entries(this.dimensions.SECONDARY)) {
      if (dimName === 'weight') continue;
      const result = await this._judgeSecondary(dimName, item, context);
      // Apply perturbation for inference scaling
      result.score = context._exploration
        ? this._perturbScore(result.score, context)
        : result.score;
      scores[dimName] = result.score;
      reasons[dimName] = result.reason;
    }

    // Judge META dimensions
    for (const [dimName] of Object.entries(this.dimensions.META)) {
      if (dimName === 'weight') continue;
      const result = await this._judgeMeta(dimName, item, context);
      // Apply perturbation for inference scaling
      result.score = context._exploration
        ? this._perturbScore(result.score, context)
        : result.score;
      scores[dimName] = result.score;
      reasons[dimName] = result.reason;
    }

    // Judge HUMAN_LLM dimensions (autonomization)
    for (const [dimName] of Object.entries(this.dimensions.HUMAN_LLM)) {
      if (dimName === 'weight') continue;
      const result = await this._judgeHumanLLM(dimName, item, context);
      // Apply perturbation for inference scaling
      result.score = context._exploration
        ? this._perturbScore(result.score, context)
        : result.score;
      scores[dimName] = result.score;
      reasons[dimName] = result.reason;
    }

    // Calculate global score (φ-weighted geometric mean)
    const globalScore = this._calculateGlobalScore(scores);

    // Determine verdict (never REJECT, only ACCEPT or TRANSFORM)
    const verdict = this._determineVerdict(scores, globalScore);

    // Calculate confidence with φ-cap transparency
    // Raw confidence = actual calculated value (can exceed 61.8%)
    // Capped confidence = philosophical limit (max φ⁻¹ = 61.8%)
    // The cap is BY DESIGN - "Always doubt, never be certain"
    const rawConfidence = globalScore / 100;
    const cappedConfidence = Math.min(rawConfidence, this.maxConfidence);
    const doubt = 1 - cappedConfidence; // Always >= 38.2%

    // The ratio confidence/doubt = φ when at cap (61.8/38.2 = 1.618...)
    const confidenceDoubtRatio = cappedConfidence / doubt;

    const result = {
      scores,
      reasons,
      worlds: worldScores,
      global: globalScore,
      verdict,
      confidence: Math.round(cappedConfidence * 1000) / 10, // Capped at 61.8%
      rawConfidence: Math.round(rawConfidence * 1000) / 10, // True value (transparency)
      doubt: Math.round(doubt * 1000) / 10, // Always >= 38.2%
      duration_ms: Date.now() - startTime,
      _cynic: {
        maxConfidence: this.maxConfidence,
        minDoubt: this.minDoubt,
        confidenceDoubtRatio: Math.round(confidenceDoubtRatio * 1000) / 1000, // Should be φ when capped
        philosophy: 'φ qui se méfie de φ - Rendre autonome, pas automatiser',
        rationale: 'Cap is BY DESIGN: raw confidence shown for transparency, but we never exceed φ⁻¹',
      },
    };

    // Log judgment for learning (skip for intermediate scaling samples)
    if (!context._skipRecord) {
      await this._logJudgment(item, result);
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Dimension-specific judgment methods
  // ---------------------------------------------------------------------------

  async _judgeDimension(dimName, item, context) {
    const method = `_judge${dimName.charAt(0).toUpperCase() + dimName.slice(1).toLowerCase()}`;

    let result;
    if (typeof this[method] === 'function') {
      result = await this[method](item, context);
    } else {
      // Default judgment if no specific method
      result = this._defaultJudgment(dimName, item, context);
    }

    // Apply perturbation for inference scaling exploration
    if (context._exploration) {
      result.score = this._perturbScore(result.score, context);
    }

    return result;
  }

  async _judgeHarmony(item, _context) {
    // Is it φ-balanced?
    const checks = [];

    // Check for φ-related values
    if (item.ratio !== undefined) {
      const deviation = Math.abs(item.ratio - PHI) / PHI;
      checks.push({ name: 'phi_ratio', score: Math.max(0, 100 - deviation * 100) });
    }

    // Check for balanced structure
    if (item.weights) {
      const isBalanced = this._checkPhiBalance(item.weights);
      checks.push({ name: 'balance', score: isBalanced ? 100 : 50 });
    }

    if (checks.length === 0) {
      return { score: 70, reason: 'No harmony metrics available' };
    }

    const score = this._average(checks.map(c => c.score));
    const reason = checks.filter(c => c.score < 70).map(c => `${c.name}: ${c.score}`).join(', ') || 'Harmonious';

    return { score: Math.round(score), reason };
  }

  async _judgeCoherence(item, context) {
    // Is it coherent with the ensemble?
    const checks = [];

    // Check internal consistency
    if (item.parts && Array.isArray(item.parts)) {
      const consistent = this._checkConsistency(item.parts);
      checks.push({ name: 'internal', score: consistent });
    }

    // Check against context
    if (context.existing) {
      const aligned = this._checkAlignment(item, context.existing);
      checks.push({ name: 'external', score: aligned });
    }

    if (checks.length === 0) {
      return { score: 75, reason: 'No coherence data' };
    }

    const score = this._average(checks.map(c => c.score));
    return { score: Math.round(score), reason: 'Coherence check' };
  }

  async _judgeTruth(item, _context) {
    // Is it verifiable? "Where did this come from?"
    const checks = [];

    // Handle code strings differently
    if (typeof item === 'string') {
      return this._judgeTruthForCode(item);
    }

    // Has source?
    if (item.source) {
      checks.push({ name: 'source', score: 80 });
    } else {
      checks.push({ name: 'source', score: 30 });
    }

    // Is reproducible?
    if (item.reproducible === true) {
      checks.push({ name: 'reproducible', score: 100 });
    } else if (item.reproducible === false) {
      checks.push({ name: 'reproducible', score: 20 });
    }

    // Has proof?
    if (item.proof || item.signature) {
      checks.push({ name: 'proof', score: 100 });
    }

    const score = this._average(checks.map(c => c.score));
    const failures = checks.filter(c => c.score < 50);
    const reason = failures.length > 0
      ? failures.map(c => `${c.name} missing`).join(', ')
      : 'Verifiable';

    return { score: Math.round(score), reason };
  }

  /**
   * Judge TRUTH for code strings - detect source indicators
   */
  _judgeTruthForCode(code) {
    const checks = [];
    const codeStr = String(code);

    // 1. Module documentation (@module, @author, @license)
    const hasModuleDoc = /@module|@author|@license|@copyright/i.test(codeStr);
    checks.push({ name: 'module_doc', score: hasModuleDoc ? 80 : 40 });

    // 2. Source references (@source, @see, @link, // Source:)
    const hasSourceRef = /@source|@see|@link|\/\/\s*Source:|\/\/\s*From:|\/\/\s*Based on/i.test(codeStr);
    if (hasSourceRef) {
      checks.push({ name: 'source_ref', score: 90 });
    }

    // 3. Import/require statements (shows dependencies = traceable sources)
    const importMatches = codeStr.match(/require\s*\(|import\s+.*from|import\s*{/g) || [];
    const importScore = Math.min(80, 40 + importMatches.length * 5);
    checks.push({ name: 'imports', score: importScore });

    // 4. JSDoc/documentation comments (shows intent to document origin)
    const jsDocCount = (codeStr.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
    const docScore = Math.min(85, 30 + jsDocCount * 10);
    checks.push({ name: 'documentation', score: docScore });

    // 5. Test coverage indicators (shows reproducibility intent)
    const hasTests = /describe\s*\(|it\s*\(|test\s*\(|expect\s*\(|assert\.|\.test\./i.test(codeStr);
    if (hasTests) {
      checks.push({ name: 'tests', score: 90 });
    }

    // 6. Version/changelog indicators
    const hasVersion = /@version|@since|CHANGELOG|version\s*[:=]/i.test(codeStr);
    if (hasVersion) {
      checks.push({ name: 'version', score: 85 });
    }

    const score = this._average(checks.map(c => c.score));
    const strongPoints = checks.filter(c => c.score >= 80).map(c => c.name);
    const reason = strongPoints.length > 0
      ? `Source indicators: ${strongPoints.join(', ')}`
      : 'Limited source documentation';

    return { score: Math.round(score), reason };
  }

  async _judgeIntegrity(item, _context) {
    // Is it tamper-proof? "Don't trust, verify"
    const checks = [];

    // Has signature? And is it valid?
    const sig = item.signature || item.sig;
    if (sig) {
      // Verify signature if signed by CYNIC
      if (item._signed_by === 'CYNIC') {
        const contentToVerify = JSON.stringify({
          ...item,
          signature: undefined,
          _signed_at: undefined,
          _signed_by: undefined,
          _transformations: undefined,
        });
        const expectedSig = crypto
          .createHmac('sha256', CYNIC_SIGNING_KEY)
          .update(contentToVerify)
          .digest('hex')
          .slice(0, 16);

        if (sig === expectedSig) {
          checks.push({ name: 'signature', score: 100 }); // Verified!
        } else {
          checks.push({ name: 'signature', score: 20 }); // Tampered!
        }
      } else {
        // External signature - trust but score lower
        checks.push({ name: 'signature', score: 80 });
      }
    } else {
      checks.push({ name: 'signature', score: 0 });
    }

    // Has hash?
    if (item.hash || item.checksum) {
      checks.push({ name: 'hash', score: 100 });
    }

    // Has chaos_nonce?
    if (item.chaos_nonce) {
      checks.push({ name: 'chaos', score: 100 });
    }

    if (checks.length === 0) {
      return { score: 50, reason: 'No integrity markers' };
    }

    const score = this._average(checks.map(c => c.score));
    return { score: Math.round(score), reason: score >= 80 ? 'Tamper-proof' : 'Integrity partial' };
  }

  async _judgeEthics(item, _context) {
    // Does it respect cypherpunk values?
    const checks = [];

    // Privacy respected?
    if (this._containsPII(item)) {
      checks.push({ name: 'privacy', score: 0 });
    } else {
      checks.push({ name: 'privacy', score: 100 });
    }

    // Open source?
    if (item.license === 'MIT' || item.openSource === true) {
      checks.push({ name: 'open', score: 100 });
    }

    // Decentralized?
    if (item.centralized === true) {
      checks.push({ name: 'decent', score: 30 });
    } else if (item.decentralized === true) {
      checks.push({ name: 'decent', score: 100 });
    }

    if (checks.length === 0) {
      return { score: 70, reason: 'No ethics data' };
    }

    const score = this._average(checks.map(c => c.score));
    const violations = checks.filter(c => c.score < 50);
    const reason = violations.length > 0
      ? violations.map(c => `${c.name} violation`).join(', ')
      : 'Ethics aligned';

    return { score: Math.round(score), reason };
  }

  async _judgeOptimism(item, _context) {
    // Does it build toward the positive?
    let score = 50; // Neutral default
    let reason = 'Neutral';

    // Is it constructive?
    if (item.action === 'create' || item.action === 'improve' || item.action === 'build') {
      score += 30;
      reason = 'Constructive';
    }

    // Is it destructive in bad way?
    if (item.action === 'destroy' && item.target !== 'value') {
      score -= 30;
      reason = 'Destructive';
    }

    // BURN is positive destruction
    if (item.burn === true || item.action === 'burn') {
      score += 20;
      reason = 'Positive burn';
    }

    return { score: Math.max(0, Math.min(100, score)), reason };
  }

  async _judgeAlignment(item, _context) {
    // Are incentives aligned? Is it the right tool for the job?

    // Handle code strings differently
    if (typeof item === 'string') {
      return this._judgeAlignmentForCode(item);
    }

    let score = 50;
    let reason = 'Unknown alignment';

    // Everyone benefits?
    if (item.beneficiaries === 'all' || item.aligned === true) {
      score = 90;
      reason = 'All stakeholders aligned';
    }

    // Extraction detected?
    if (item.extraction === true || item.skim === true) {
      score = 10;
      reason = 'Extraction detected - misaligned';
    }

    // Burns to singularity?
    if (item.burnDestination === 'singularity' || item.burnRate === 1.0) {
      score = 100;
      reason = 'Perfect burn alignment';
    }

    return { score, reason };
  }

  /**
   * Judge ALIGNMENT for code - domain fit & purpose alignment
   */
  _judgeAlignmentForCode(code) {
    const checks = [];
    const codeStr = String(code);

    // 1. Appropriate Node.js APIs usage (right tool for job)
    const usesFS = /require\s*\(\s*['"]fs['"]\)|from\s+['"]fs['"]/.test(codeStr);
    const usesPath = /require\s*\(\s*['"]path['"]\)|from\s+['"]path['"]/.test(codeStr);
    const usesCrypto = /require\s*\(\s*['"]crypto['"]\)|from\s+['"]crypto['"]/.test(codeStr);
    const apiCount = [usesFS, usesPath, usesCrypto].filter(Boolean).length;
    if (apiCount > 0) {
      checks.push({ name: 'appropriate_apis', score: 70 + apiCount * 10 });
    }

    // 2. Single responsibility indicators (focused functions)
    const functionCount = (codeStr.match(/function\s+\w+|=>\s*{|async\s+\w+\s*\(/g) || []).length;
    const avgFunctionSize = codeStr.length / Math.max(functionCount, 1);
    if (functionCount > 5 && avgFunctionSize < 500) {
      checks.push({ name: 'single_responsibility', score: 85 });
    } else if (functionCount > 3) {
      checks.push({ name: 'single_responsibility', score: 70 });
    }

    // 3. Consistent naming conventions
    const hasCamelCase = /[a-z][A-Z]/.test(codeStr);
    const hasSnakeCase = /[a-z]_[a-z]/.test(codeStr);
    const hasPascalCase = /class\s+[A-Z]/.test(codeStr);
    // Consistency: mostly one style
    if ((hasCamelCase && !hasSnakeCase) || (hasSnakeCase && !hasCamelCase)) {
      checks.push({ name: 'naming_consistency', score: 85 });
    } else if (hasCamelCase || hasSnakeCase) {
      checks.push({ name: 'naming_consistency', score: 65 }); // Mixed
    }

    // 4. Purpose-built exports (clear interface)
    const hasModuleExports = /module\.exports\s*=\s*{/.test(codeStr);
    const hasNamedExports = /exports\.\w+\s*=|export\s+(const|function|class)/.test(codeStr);
    if (hasModuleExports || hasNamedExports) {
      checks.push({ name: 'clear_interface', score: 80 });
    }

    // 5. Domain-specific patterns (matches purpose)
    const hasJudgmentPatterns = /judge|score|verdict|dimension|evaluate/i.test(codeStr);
    const hasCachePatterns = /cache|lru|get|set|evict/i.test(codeStr);
    const hasEvidencePatterns = /evidence|calibration|brier|accuracy/i.test(codeStr);
    const domainPatterns = [hasJudgmentPatterns, hasCachePatterns, hasEvidencePatterns].filter(Boolean).length;
    if (domainPatterns >= 2) {
      checks.push({ name: 'domain_fit', score: 90 });
    } else if (domainPatterns === 1) {
      checks.push({ name: 'domain_fit', score: 75 });
    }

    // 6. No anti-patterns (misalignment indicators)
    const hasGodObject = (codeStr.match(/this\.\w+/g) || []).length > 50;
    const hasDeepNesting = /{\s*{\s*{\s*{\s*{/.test(codeStr);
    if (hasGodObject || hasDeepNesting) {
      checks.push({ name: 'anti_patterns', score: 30 });
    }

    if (checks.length === 0) {
      return { score: 50, reason: 'No alignment indicators' };
    }

    const score = this._average(checks.map(c => c.score));
    const aligned = checks.filter(c => c.score >= 75).map(c => c.name);
    const reason = aligned.length > 0
      ? `Aligned: ${aligned.join(', ')}`
      : 'Partial alignment';

    return { score: Math.round(score), reason };
  }

  async _judgeProgress(item, _context) {
    // Does it advance toward singularity? Is it temporally valid?

    // Handle code strings differently
    if (typeof item === 'string') {
      return this._judgeProgressForCode(item);
    }

    let score = 50;
    let reason = 'Neutral progress';

    // Contributes to burn?
    if (item.contributesBurn === true) {
      score += 30;
      reason = 'Advances burn';
    }

    // Increases adoption?
    if (item.adoption === 'increase') {
      score += 20;
      reason = 'Increases adoption';
    }

    // Stagnant?
    if (item.stagnant === true) {
      score -= 20;
      reason = 'Stagnant';
    }

    return { score: Math.max(0, Math.min(100, score)), reason };
  }

  /**
   * Judge PROGRESS for code - temporal validity & modern patterns
   */
  _judgeProgressForCode(code) {
    const checks = [];
    const codeStr = String(code);

    // 1. Modern JS syntax (ES6+)
    const hasModernSyntax = /const\s+|let\s+|=>\s*[{(]|async\s+|await\s+|class\s+\w+|`[^`]*\$\{/.test(codeStr);
    const hasLegacySyntax = /\bvar\s+/.test(codeStr);
    if (hasModernSyntax && !hasLegacySyntax) {
      checks.push({ name: 'modern_syntax', score: 85 });
    } else if (hasModernSyntax) {
      checks.push({ name: 'modern_syntax', score: 70 }); // Mixed
    } else {
      checks.push({ name: 'modern_syntax', score: 40 });
    }

    // 2. Async patterns (modern approach)
    const hasAsyncAwait = /async\s+function|async\s*\(|await\s+/.test(codeStr);
    const hasPromises = /\.then\s*\(|Promise\.|new\s+Promise/.test(codeStr);
    if (hasAsyncAwait) {
      checks.push({ name: 'async_patterns', score: 90 });
    } else if (hasPromises) {
      checks.push({ name: 'async_patterns', score: 70 });
    }

    // 3. Module system (ES modules or CommonJS)
    const hasESModules = /import\s+.*from|export\s+(default|const|function|class)/.test(codeStr);
    const hasCommonJS = /require\s*\(|module\.exports|exports\./.test(codeStr);
    if (hasESModules) {
      checks.push({ name: 'module_system', score: 85 });
    } else if (hasCommonJS) {
      checks.push({ name: 'module_system', score: 75 }); // Still valid
    }

    // 4. Deprecated patterns (penalty)
    const hasDeprecated = /\.bind\(this\)|self\s*=\s*this|that\s*=\s*this|__proto__|with\s*\(/.test(codeStr);
    if (hasDeprecated) {
      checks.push({ name: 'deprecated', score: 30 });
    }

    // 5. Modern error handling
    const hasTryCatch = /try\s*{[\s\S]*?catch/.test(codeStr);
    const hasOptionalChaining = /\?\.|&&\s*\w+\s*&&/.test(codeStr);
    if (hasTryCatch || hasOptionalChaining) {
      checks.push({ name: 'error_handling', score: 80 });
    }

    // 6. Strict mode (modern standards)
    const hasStrictMode = /'use strict'|"use strict"/.test(codeStr);
    if (hasStrictMode) {
      checks.push({ name: 'strict_mode', score: 85 });
    }

    // 7. Type hints/JSDoc (forward-looking)
    const hasTypeHints = /@param\s*{|@returns?\s*{|@type\s*{|\*\s*@/.test(codeStr);
    if (hasTypeHints) {
      checks.push({ name: 'type_hints', score: 80 });
    }

    if (checks.length === 0) {
      return { score: 50, reason: 'No temporal indicators' };
    }

    const score = this._average(checks.map(c => c.score));
    const modern = checks.filter(c => c.score >= 75).map(c => c.name);
    const reason = modern.length > 0
      ? `Modern: ${modern.join(', ')}`
      : 'Mixed temporal patterns';

    return { score: Math.round(score), reason };
  }

  // ---------------------------------------------------------------------------
  // SECONDARY dimension judgments
  // ---------------------------------------------------------------------------

  async _judgeSecondary(dimName, item, context) {
    // Config available: this.dimensions.SECONDARY[dimName]

    switch (dimName) {
      case 'SECURE':
        return this._judgeSecurity(item, context);
      case 'PRIVATE':
        return this._judgePrivacy(item, context);
      case 'SCALE':
        return { score: 70, reason: 'Scalability not measured' };
      case 'SIMPLIFY':
        return this._judgeSimplicity(item, context);
      case 'ENABLE':
        return this._judgeEnablement(item, context);
      default:
        return { score: 50, reason: 'Unknown secondary dimension' };
    }
  }

  async _judgeSecurity(item, _context) {
    // Secure without imprisoning
    if (item.encrypted === true || item.secure === true) {
      return { score: 90, reason: 'Secured' };
    }
    if (item.publicData === true && !this._containsPII(item)) {
      return { score: 80, reason: 'Public non-sensitive' };
    }
    return { score: 60, reason: 'Security unknown' };
  }

  async _judgePrivacy(item, _context) {
    // CRITICAL - cypherpunk value
    if (this._containsPII(item)) {
      return { score: 0, reason: 'PII detected - critical violation' };
    }
    if (item.operatorHash && !item.operatorName) {
      return { score: 100, reason: 'Properly anonymized' };
    }
    if (item.anonymous === true) {
      return { score: 100, reason: 'Anonymous' };
    }
    return { score: 70, reason: 'Privacy neutral' };
  }

  async _judgeSimplicity(item, _context) {
    // Clarify without reducing
    if (item.complexity === 'high') {
      return { score: 40, reason: 'Too complex' };
    }
    if (item.complexity === 'low' || item.simple === true) {
      return { score: 90, reason: 'Simple and clear' };
    }
    return { score: 70, reason: 'Moderate complexity' };
  }

  async _judgeEnablement(item, _context) {
    // KEY MISSION: Autonomize, don't automate
    if (item.replacesHuman === true) {
      return { score: 0, reason: 'VIOLATION: Replaces human' };
    }
    if (item.enablesHuman === true || item.autonomizes === true) {
      return { score: 100, reason: 'Enables human autonomy' };
    }
    if (item.assistsHuman === true) {
      return { score: 80, reason: 'Assists human' };
    }
    return { score: 60, reason: 'Enablement unclear' };
  }

  // ---------------------------------------------------------------------------
  // META dimension judgments
  // ---------------------------------------------------------------------------

  async _judgeMeta(dimName, item, context) {
    switch (dimName) {
      case 'SELF_AWARENESS':
        return this._judgeSelfAwareness(item, context);
      case 'LEARNING_RATE':
        return this._judgeLearningRate(item, context);
      case 'SINGULARITY_DISTANCE':
        return this._judgeSingularityDistance(item, context);
      default:
        return { score: 50, reason: 'Unknown meta dimension' };
    }
  }

  async _judgeSelfAwareness(item, context) {
    // Do I know what I don't know?
    const unknowns = context.unknowns || [];
    const acknowledged = context.acknowledged || [];

    if (unknowns.length > 0 && acknowledged.length >= unknowns.length) {
      return { score: 90, reason: 'Unknowns acknowledged' };
    }
    if (unknowns.length > acknowledged.length) {
      return { score: 50, reason: 'Some unknowns not acknowledged' };
    }
    return { score: 70, reason: 'Self-awareness neutral' };
  }

  async _judgeLearningRate(item, context) {
    // Am I learning from errors?
    const errors = context.pastErrors || 0;
    const corrections = context.corrections || 0;

    if (errors === 0) {
      return { score: 70, reason: 'No errors to learn from' };
    }

    const rate = corrections / errors;
    return {
      score: Math.round(rate * 100),
      reason: `Learning rate: ${Math.round(rate * 100)}%`,
    };
  }

  async _judgeSingularityDistance(item, context) {
    // How far am I from the goal?
    // This should always be > 0 (never reach singularity)
    const distance = context.singularityDistance || 0.5;

    // Score is inversely related to distance, but capped
    // We WANT some distance (human space)
    if (distance < 0.1) {
      return { score: 30, reason: 'Too close to singularity - need human space' };
    }
    if (distance > 0.8) {
      return { score: 40, reason: 'Far from singularity' };
    }

    // Sweet spot: 0.382 (φ⁻²) distance
    const idealDistance = PHI_INV_2;
    const deviation = Math.abs(distance - idealDistance);
    const score = Math.round((1 - deviation) * 100);

    return { score, reason: `Distance: ${Math.round(distance * 100)}%` };
  }

  // ---------------------------------------------------------------------------
  // HUMAN_LLM dimension judgments (autonomization)
  // "Rendre autonome, pas automatiser"
  // ---------------------------------------------------------------------------

  async _judgeHumanLLM(dimName, item, context) {
    switch (dimName) {
      case 'MEMORY':
        return this._judgeMemory(item, context);
      case 'TEACHING':
        return this._judgeTeaching(item, context);
      case 'INTENT':
        return this._judgeIntent(item, context);
      case 'TRUST':
        return this._judgeTrust(item, context);
      case 'PROACTIVITY':
        return this._judgeProactivity(item, context);
      case 'COMPLEMENTARITY':
        return this._judgeComplementarity(item, context);
      case 'DELEGATION':
        return this._judgeDelegation(item, context);
      case 'BOUNDARIES':
        return this._judgeBoundaries(item, context);
      default:
        return { score: 50, reason: 'Unknown HUMAN_LLM dimension' };
    }
  }

  async _judgeMemory(item, context) {
    // Qualité de la mémoire contextuelle
    let score = 50;
    let reason = 'Memory neutral';

    // Has context preserved?
    if (context.contextPreserved === true || item.contextPreserved === true) {
      score += 30;
      reason = 'Context well preserved';
    }

    // Has session continuity?
    if (context.sessionId || item.sessionId) {
      score += 10;
    }

    // Has history reference?
    if (item.historyRef || context.historyRef) {
      score += 10;
    }

    return { score: Math.min(100, score), reason };
  }

  async _judgeTeaching(item, context) {
    // Transfert de connaissance bidirectionnel
    let score = 50;
    let reason = 'Teaching neutral';

    // Human learning something?
    if (item.humanLearns === true || context.humanLearns === true) {
      score += 25;
      reason = 'Human learning';
    }

    // LLM learning from human?
    if (item.llmLearns === true || context.llmLearns === true) {
      score += 25;
      reason = score > 75 ? 'Bidirectional learning' : 'LLM learning';
    }

    // Knowledge transfer explicit?
    if (item.knowledgeTransfer || context.knowledgeTransfer) {
      score += 10;
    }

    return { score: Math.min(100, score), reason };
  }

  async _judgeIntent(item, context) {
    // Clarté d'intention détectée
    // "L'intention de l'humain est-elle claire et comprise?"
    let score = 50;
    let reason = 'Intent unclear';

    // Intent explicitly stated? (multiple property names supported)
    const hasIntent = item.intent || context.intent ||
                      item.intentClear === true || context.intentClear === true ||
                      item.intentExplicit === true || context.intentExplicit === true;
    if (hasIntent) {
      score = 80;
      reason = 'Intent explicit';
    }

    // Goal defined? (multiple property names supported)
    const hasGoal = item.goal || context.goal ||
                    item.goalExplicit === true || context.goalExplicit === true ||
                    item.goalDefined === true || context.goalDefined === true;
    if (hasGoal) {
      score += 10;
    }

    // Task clearly specified?
    if (item.taskClear === true || context.taskClear === true ||
        item.requestClear === true || context.requestClear === true) {
      score += 5;
    }

    // Ambiguity detected?
    if (item.ambiguous === true || context.ambiguous === true ||
        item.intentAmbiguous === true || context.intentAmbiguous === true) {
      score -= 20;
      reason = 'Intent ambiguous';
    }

    // Clarification needed?
    if (item.needsClarification === true || context.needsClarification === true) {
      score -= 15;
      reason = 'Needs clarification';
    }

    return { score: Math.max(0, Math.min(100, score)), reason };
  }

  async _judgeTrust(item, context) {
    // Confiance bidirectionnelle humain ↔ LLM
    // "La confiance mutuelle est-elle établie?"
    let score = 50;
    let reasons = [];

    // Human trusts LLM? (multiple property names supported)
    const humanTrusts = context.humanTrusts === true || item.humanTrusts === true ||
                        context.humanTrustsLLM === true || item.humanTrustsLLM === true ||
                        context.humanTrust === true || item.humanTrust === true;
    if (humanTrusts) {
      score += 20;
      reasons.push('human→LLM');
    }

    // LLM trusts human input? (multiple property names supported)
    const llmTrusts = context.llmTrusts === true || item.llmTrusts === true ||
                      context.llmTrustsHuman === true || item.llmTrustsHuman === true ||
                      context.llmTrust === true || item.llmTrust === true;
    if (llmTrusts) {
      score += 20;
      reasons.push('LLM→human');
    }

    // Verification provided? (healthy skepticism - "Don't trust, verify")
    const hasVerification = item.verificationProvided === true || context.verificationProvided === true ||
                            item.verificationRequested === true || context.verificationRequested === true ||
                            item.verified === true || context.verified === true;
    if (hasVerification) {
      score += 15;
      reasons.push('verified');
    }

    // Mutual trust explicitly established?
    if (item.mutualTrust === true || context.mutualTrust === true ||
        item.trustEstablished === true || context.trustEstablished === true) {
      score += 10;
      reasons.push('mutual');
    }

    // Trust explicitly broken? (critical - resets score)
    if (item.trustBroken === true || context.trustBroken === true ||
        item.trustViolated === true || context.trustViolated === true) {
      score = 20;
      return { score, reason: 'Trust broken' };
    }

    // Blind trust? (unhealthy - penalize)
    if (item.blindTrust === true || context.blindTrust === true) {
      score -= 15;
      reasons.push('blind (unhealthy)');
    }

    const reason = reasons.length > 0 ? `Trust: ${reasons.join(', ')}` : 'Trust neutral';
    return { score: Math.min(100, score), reason };
  }

  async _judgeProactivity(item, context) {
    // Anticipation vs réactivité
    let score = 50;
    let reason = 'Reactive';

    // LLM anticipated need?
    if (item.anticipated === true || context.anticipated === true) {
      score = 80;
      reason = 'Proactive anticipation';
    }

    // But not intrusive?
    if (item.intrusive === true) {
      score -= 30;
      reason = 'Too intrusive';
    }

    // Suggestion made appropriately?
    if (item.suggestion && !item.forced) {
      score += 10;
    }

    return { score: Math.max(0, Math.min(100, score)), reason };
  }

  async _judgeComplementarity(item, context) {
    // Synergie des forces respectives
    let score = 50;
    let reason = 'Complementarity unclear';

    // Human doing human things?
    if (item.humanStrength === true || context.humanStrength === true) {
      score += 20;
    }

    // LLM doing LLM things?
    if (item.llmStrength === true || context.llmStrength === true) {
      score += 20;
    }

    // Synergy achieved?
    if (item.synergy === true || context.synergy === true) {
      score = 90;
      reason = 'Strong complementarity';
    }

    // Role confusion?
    if (item.roleConfusion === true) {
      score -= 20;
      reason = 'Role confusion detected';
    }

    return { score: Math.max(0, Math.min(100, score)), reason };
  }

  async _judgeDelegation(item, context) {
    // Niveau de délégation approprié
    let score = 60;
    let reason = 'Delegation neutral';

    // Appropriate level?
    if (item.delegationLevel === 'appropriate' || context.delegationLevel === 'appropriate') {
      score = 90;
      reason = 'Delegation appropriate';
    }

    // Over-delegation (human abdicating)?
    if (item.overDelegation === true || context.overDelegation === true) {
      score = 30;
      reason = 'Over-delegation - human should stay involved';
    }

    // Under-delegation (not using LLM effectively)?
    if (item.underDelegation === true || context.underDelegation === true) {
      score = 40;
      reason = 'Under-delegation - could use more help';
    }

    return { score, reason };
  }

  async _judgeBoundaries(item, context) {
    // Respect des limites établies
    let score = 70;
    let reason = 'Boundaries respected';

    // Boundaries defined?
    if (item.boundaries || context.boundaries) {
      score += 10;
    }

    // Boundary violation?
    if (item.boundaryViolation === true || context.boundaryViolation === true) {
      score = 20;
      reason = 'Boundary violation!';
    }

    // LLM respecting scope?
    if (item.scopeRespected === true) {
      score += 10;
    }

    // Human respecting LLM limitations?
    if (item.limitationsRespected === true) {
      score += 10;
    }

    return { score: Math.min(100, score), reason };
  }

  // ---------------------------------------------------------------------------
  // Helper methods
  // ---------------------------------------------------------------------------

  _defaultJudgment(dimName, item, context) {
    return { score: 50, reason: `No specific judgment for ${dimName}` };
  }

  _calculateGlobalScore(scores) {
    let product = 1;
    let totalWeight = 0;

    // PRIMARY dimensions (weight: φ²)
    for (const dimName of Object.keys(this.dimensions.PRIMARY)) {
      if (dimName === 'weight') continue;
      const score = scores[dimName] || 50;
      const weight = this.dimensions.PRIMARY.weight;
      product *= Math.pow(score, weight);
      totalWeight += weight;
    }

    // SECONDARY dimensions (weight: φ)
    for (const dimName of Object.keys(this.dimensions.SECONDARY)) {
      if (dimName === 'weight') continue;
      const score = scores[dimName] || 50;
      const weight = this.dimensions.SECONDARY.weight;
      product *= Math.pow(score, weight);
      totalWeight += weight;
    }

    // META dimensions (weight: 1.0)
    for (const dimName of Object.keys(this.dimensions.META)) {
      if (dimName === 'weight') continue;
      const score = scores[dimName] || 50;
      const weight = this.dimensions.META.weight;
      product *= Math.pow(score, weight);
      totalWeight += weight;
    }

    // HUMAN_LLM dimensions (weight: φ) - "Rendre autonome, pas automatiser"
    for (const dimName of Object.keys(this.dimensions.HUMAN_LLM)) {
      if (dimName === 'weight') continue;
      const score = scores[dimName] || 50;
      const weight = this.dimensions.HUMAN_LLM.weight;
      product *= Math.pow(score, weight);
      totalWeight += weight;
    }

    return Math.round(Math.pow(product, 1 / totalWeight));
  }

  _determineVerdict(scores, globalScore) {
    // Check critical thresholds
    const criticalDims = ['PRIVATE', 'INTEGRITY', 'ETHICS'];
    for (const dim of criticalDims) {
      const threshold = this.dimensions.SECONDARY[dim]?.threshold ||
                       this.dimensions.PRIMARY[dim]?.threshold || 70;
      if (scores[dim] < threshold) {
        return {
          action: 'TRANSFORM',
          reason: `Critical dimension ${dim} below threshold (${scores[dim]} < ${threshold})`,
          blocking: dim,
        };
      }
    }

    // Check ENABLE - key mission
    if (scores.ENABLE < 50) {
      return {
        action: 'TRANSFORM',
        reason: 'Does not enable human autonomy',
        blocking: 'ENABLE',
      };
    }

    // Global threshold
    if (globalScore >= 70) {
      return { action: 'ACCEPT', reason: 'Sufficient quality' };
    }

    return { action: 'TRANSFORM', reason: 'Global score below threshold' };
  }

  _geometricMean(values) {
    if (values.length === 0) return 0;
    const product = values.reduce((a, b) => a * b, 1);
    return Math.round(Math.pow(product, 1 / values.length));
  }

  _average(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  _checkPhiBalance(weights) {
    // Check if weights follow φ ratios
    const sorted = Object.values(weights).sort((a, b) => b - a);
    if (sorted.length < 2) return true;

    for (let i = 0; i < sorted.length - 1; i++) {
      const ratio = sorted[i] / sorted[i + 1];
      if (Math.abs(ratio - PHI) < 0.2) {
        return true; // φ-balanced
      }
    }
    return false;
  }

  _checkConsistency(_parts) {
    // Simple consistency check
    return 80; // Placeholder
  }

  _checkAlignment(_item, _existing) {
    // Check alignment with existing knowledge
    return 75; // Placeholder
  }

  _containsPII(item) {
    // Check for PII
    const piiFields = ['email', 'phone', 'address', 'ssn', 'password', 'operatorName'];
    for (const field of piiFields) {
      if (item[field] && typeof item[field] === 'string' && item[field].length > 0) {
        return true;
      }
    }
    return false;
  }

  async _logJudgment(item, result) {
    // Generate unique judgment ID
    const judgmentId = `jdg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Store judgment in history for learning
    const record = {
      id: judgmentId,
      timestamp: Date.now(),
      item: this._hashItem(item), // Hash to avoid storing sensitive data
      scores: { ...result.scores },
      global: result.global,
      verdict: result.verdict.action,
      confidence: result.confidence,
      outcome: LEARNING.OUTCOMES.UNKNOWN, // Will be updated by recordOutcome
      reward: 0,
    };

    this._judgmentHistory.push(record);
    this._learningStats.totalJudgments++;

    // Prune history if too long (keep last MAX_HISTORY)
    if (this._judgmentHistory.length > LEARNING.MAX_HISTORY) {
      this._judgmentHistory.shift();
    }

    // Attach ID to result for later outcome recording
    result._judgmentId = judgmentId;

    // Debug logging
    if (this.logger && this.logger.debug) {
      this.logger.debug('CYNIC judgment logged:', {
        id: judgmentId,
        global: result.global,
        verdict: result.verdict.action,
        confidence: result.confidence,
      });
    }

    return judgmentId;
  }

  /**
   * Hash item for storage (privacy-preserving)
   */
  _hashItem(item) {
    const str = JSON.stringify(item);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `item_${Math.abs(hash).toString(36)}`;
  }

  // ---------------------------------------------------------------------------
  // LEARNING FROM OUTCOMES: φ-weighted reinforcement learning
  // ---------------------------------------------------------------------------

  /**
   * Record the outcome of a judgment for learning
   *
   * Call this after you know whether a judgment was correct or not.
   *
   * @param {string} judgmentId - The ID returned in result._judgmentId
   * @param {string} outcome - LEARNING.OUTCOMES.CORRECT | INCORRECT | PARTIAL
   * @param {Object} feedback - Optional additional feedback
   * @returns {Object} Learning update result
   */
  recordOutcome(judgmentId, outcome, feedback = {}) {
    // Find judgment in history
    const record = this._judgmentHistory.find(j => j.id === judgmentId);
    if (!record) {
      return { error: 'Judgment not found', judgmentId };
    }

    // Already has outcome?
    if (record.outcome !== LEARNING.OUTCOMES.UNKNOWN) {
      return { error: 'Outcome already recorded', judgmentId };
    }

    // Record outcome
    record.outcome = outcome;
    record.feedback = feedback;

    // Calculate reward signal
    const reward = this._calculateReward(record);
    record.reward = reward;
    this._learningStats.totalReward += reward;

    // Update stats
    this._updateOutcomeStats(record, outcome);

    // Trigger learning if we have enough data
    const learnResult = this._maybeLearn();

    return {
      judgmentId,
      outcome,
      reward,
      learned: learnResult.learned,
      adjustments: learnResult.adjustments,
    };
  }

  /**
   * Calculate reward signal based on outcome
   */
  _calculateReward(record) {
    const { verdict, outcome } = record;

    if (outcome === LEARNING.OUTCOMES.CORRECT) {
      // Correct judgment
      if (verdict === 'ACCEPT') {
        this._learningStats.correctAccepts++;
        return LEARNING.REWARD_WEIGHTS.CORRECT_ACCEPT;
      } else {
        this._learningStats.correctTransforms++;
        return LEARNING.REWARD_WEIGHTS.CORRECT_TRANSFORM;
      }
    }

    if (outcome === LEARNING.OUTCOMES.INCORRECT) {
      // Incorrect judgment
      if (verdict === 'ACCEPT') {
        // False positive: accepted something that should have been transformed
        this._learningStats.falsePositives++;
        return LEARNING.REWARD_WEIGHTS.FALSE_POSITIVE;
      } else {
        // False negative: transformed something that should have been accepted
        this._learningStats.falseNegatives++;
        return LEARNING.REWARD_WEIGHTS.FALSE_NEGATIVE;
      }
    }

    if (outcome === LEARNING.OUTCOMES.PARTIAL) {
      // Partial credit (φ⁻¹ of full reward)
      return PHI_INV * (verdict === 'ACCEPT'
        ? LEARNING.REWARD_WEIGHTS.CORRECT_ACCEPT
        : LEARNING.REWARD_WEIGHTS.CORRECT_TRANSFORM);
    }

    return 0; // Unknown outcome
  }

  /**
   * Update outcome statistics
   */
  _updateOutcomeStats(record, outcome) {
    // Track per-dimension performance for targeted learning
    if (outcome === LEARNING.OUTCOMES.INCORRECT && record.verdict === 'ACCEPT') {
      // False positive - identify which dimensions failed
      for (const [dim, score] of Object.entries(record.scores)) {
        const threshold = this._getThreshold(dim);
        if (score >= threshold) {
          // This dimension incorrectly passed - may need higher threshold
          if (!this._learningStats.thresholdAdjustments[dim]) {
            this._learningStats.thresholdAdjustments[dim] = { up: 0, down: 0 };
          }
          this._learningStats.thresholdAdjustments[dim].up++;
        }
      }
    } else if (outcome === LEARNING.OUTCOMES.INCORRECT && record.verdict === 'TRANSFORM') {
      // False negative - identify which dimensions were too strict
      for (const [dim, score] of Object.entries(record.scores)) {
        const threshold = this._getThreshold(dim);
        if (score < threshold) {
          // This dimension incorrectly blocked - may need lower threshold
          if (!this._learningStats.thresholdAdjustments[dim]) {
            this._learningStats.thresholdAdjustments[dim] = { up: 0, down: 0 };
          }
          this._learningStats.thresholdAdjustments[dim].down++;
        }
      }
    }
  }

  /**
   * Trigger learning if we have enough labeled data
   */
  _maybeLearn() {
    // Count labeled judgments
    const labeled = this._judgmentHistory.filter(
      j => j.outcome !== LEARNING.OUTCOMES.UNKNOWN
    );

    // Need at least Fibonacci(5) = 5 labeled examples to learn
    if (labeled.length < FIBONACCI_N.STANDARD) {
      return { learned: false, reason: 'Not enough labeled data' };
    }

    // Learn every Fibonacci(3) = 3 new labels
    const lastLearned = this._learningStats.learningIterations * FIBONACCI_N.QUICK;
    if (labeled.length - lastLearned < FIBONACCI_N.QUICK) {
      return { learned: false, reason: 'Not enough new labels since last learning' };
    }

    return this.learn();
  }

  /**
   * Learn from outcomes and adjust thresholds
   *
   * Uses φ-weighted gradient descent to adjust dimension thresholds
   * based on accumulated feedback.
   *
   * @returns {Object} Learning result with adjustments made
   */
  learn() {
    const adjustments = {};
    const labeled = this._judgmentHistory.filter(
      j => j.outcome !== LEARNING.OUTCOMES.UNKNOWN
    );

    if (labeled.length === 0) {
      return { learned: false, reason: 'No labeled data' };
    }

    // Calculate adaptive learning rate based on performance
    const accuracy = this._calculateAccuracy();
    const learningRate = this._calculateLearningRate(accuracy);

    // Process threshold adjustments
    for (const [dim, counts] of Object.entries(this._learningStats.thresholdAdjustments)) {
      const { up, down } = counts;
      const netDirection = up - down;

      if (Math.abs(netDirection) < 2) {
        continue; // Not enough signal
      }

      // Get current threshold
      const currentThreshold = this._getDynamicThreshold(dim);

      // Calculate adjustment (φ-weighted step)
      const step = LEARNING.THRESHOLD_STEP * learningRate;
      let newThreshold;

      if (netDirection > 0) {
        // Need to be more strict (raise threshold)
        newThreshold = Math.min(
          LEARNING.THRESHOLD_MAX,
          currentThreshold + step * Math.log(1 + netDirection)
        );
      } else {
        // Need to be more lenient (lower threshold)
        newThreshold = Math.max(
          LEARNING.THRESHOLD_MIN,
          currentThreshold - step * Math.log(1 + Math.abs(netDirection))
        );
      }

      // Apply adjustment
      const delta = newThreshold - currentThreshold;
      if (Math.abs(delta) >= 0.5) {
        this._dynamicThresholds[dim] = Math.round(newThreshold);
        adjustments[dim] = {
          from: currentThreshold,
          to: Math.round(newThreshold),
          delta: Math.round(delta * 10) / 10,
          direction: netDirection > 0 ? 'stricter' : 'lenient',
        };

        // Reset adjustment counters for this dimension
        this._learningStats.thresholdAdjustments[dim] = { up: 0, down: 0 };
      }
    }

    this._learningStats.learningIterations++;

    // Apply decay to older judgments (φ⁻¹ weight reduction)
    this._applyDecay();

    return {
      learned: true,
      iteration: this._learningStats.learningIterations,
      accuracy: Math.round(accuracy * 1000) / 10,
      learningRate: Math.round(learningRate * 1000) / 1000,
      adjustments,
      philosophy: 'φ-weighted reinforcement learning from human feedback',
    };
  }

  /**
   * Get dynamic threshold (learning-adjusted or default)
   */
  _getDynamicThreshold(dim) {
    if (this._dynamicThresholds[dim] !== undefined) {
      return this._dynamicThresholds[dim];
    }
    return this._getThreshold(dim);
  }

  /**
   * Calculate current accuracy from labeled judgments
   */
  _calculateAccuracy() {
    const labeled = this._judgmentHistory.filter(
      j => j.outcome !== LEARNING.OUTCOMES.UNKNOWN
    );

    if (labeled.length === 0) return 0.5; // No data = assume 50%

    const correct = labeled.filter(
      j => j.outcome === LEARNING.OUTCOMES.CORRECT
    ).length;

    const partial = labeled.filter(
      j => j.outcome === LEARNING.OUTCOMES.PARTIAL
    ).length;

    return (correct + partial * PHI_INV) / labeled.length;
  }

  /**
   * Calculate adaptive learning rate based on performance
   *
   * High accuracy → low learning rate (don't change what works)
   * Low accuracy → high learning rate (need to improve)
   */
  _calculateLearningRate(accuracy) {
    // φ-based adaptive rate
    // accuracy near 1.0 → rate near MIN
    // accuracy near 0.5 → rate near MAX
    const normalized = 1 - accuracy; // 0 = perfect, 0.5 = random
    const scaled = Math.pow(normalized, PHI_INV); // φ-shaped curve

    const rate = LEARNING.MIN_LEARNING_RATE +
      (LEARNING.MAX_LEARNING_RATE - LEARNING.MIN_LEARNING_RATE) * scaled;

    return Math.min(LEARNING.MAX_LEARNING_RATE, Math.max(LEARNING.MIN_LEARNING_RATE, rate));
  }

  /**
   * Apply φ⁻¹ decay to older judgments
   */
  _applyDecay() {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    for (const record of this._judgmentHistory) {
      const age = now - record.timestamp;
      const days = age / dayInMs;

      // Apply φ⁻¹ decay per day
      record.decayWeight = Math.pow(LEARNING.DECAY_FACTOR, days);
    }
  }

  /**
   * Get learning statistics and metrics
   */
  getLearningStats() {
    const labeled = this._judgmentHistory.filter(
      j => j.outcome !== LEARNING.OUTCOMES.UNKNOWN
    );

    const accuracy = this._calculateAccuracy();
    const learningRate = this._calculateLearningRate(accuracy);

    // Calculate precision and recall
    const truePositives = this._learningStats.correctAccepts;
    const falsePositives = this._learningStats.falsePositives;
    const falseNegatives = this._learningStats.falseNegatives;

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;

    // φ-score: F1 weighted by φ ratio (emphasizes precision slightly)
    const phiScore = (PHI * precision + recall) / (PHI + 1);

    return {
      // Counts
      totalJudgments: this._learningStats.totalJudgments,
      labeledJudgments: labeled.length,
      unlabeledJudgments: this._judgmentHistory.length - labeled.length,

      // Outcomes
      correctAccepts: this._learningStats.correctAccepts,
      correctTransforms: this._learningStats.correctTransforms,
      falsePositives: this._learningStats.falsePositives,
      falseNegatives: this._learningStats.falseNegatives,

      // Metrics
      accuracy: Math.round(accuracy * 1000) / 10,
      precision: Math.round(precision * 1000) / 10,
      recall: Math.round(recall * 1000) / 10,
      f1Score: Math.round(f1 * 1000) / 10,
      phiScore: Math.round(phiScore * 1000) / 10, // φ-weighted F1

      // Learning state
      learningRate: Math.round(learningRate * 1000) / 1000,
      learningIterations: this._learningStats.learningIterations,
      totalReward: Math.round(this._learningStats.totalReward * 100) / 100,

      // Threshold adjustments
      dynamicThresholds: { ...this._dynamicThresholds },
      pendingAdjustments: Object.keys(this._learningStats.thresholdAdjustments)
        .filter(dim => {
          const counts = this._learningStats.thresholdAdjustments[dim];
          return Math.abs(counts.up - counts.down) >= 2;
        }),

      // φ philosophy
      _phi: {
        baseRate: LEARNING.BASE_LEARNING_RATE,
        decayFactor: LEARNING.DECAY_FACTOR,
        maxConfidence: MAX_CONFIDENCE,
        minDoubt: MIN_DOUBT,
      },
    };
  }

  /**
   * Reset learning state (use with caution)
   */
  resetLearning() {
    this._judgmentHistory = [];
    this._dynamicThresholds = {};
    this._learningStats = {
      totalJudgments: 0,
      correctAccepts: 0,
      correctTransforms: 0,
      falsePositives: 0,
      falseNegatives: 0,
      totalReward: 0,
      learningIterations: 0,
      thresholdAdjustments: {},
    };

    return { reset: true, message: 'Learning state cleared' };
  }

  /**
   * Export learning state for persistence
   */
  exportLearningState() {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      history: this._judgmentHistory,
      thresholds: this._dynamicThresholds,
      stats: this._learningStats,
    };
  }

  /**
   * Import learning state from persistence
   */
  importLearningState(state) {
    if (!state || state.version !== '1.0.0') {
      return { error: 'Invalid state version' };
    }

    this._judgmentHistory = state.history || [];
    this._dynamicThresholds = state.thresholds || {};
    this._learningStats = state.stats || this._learningStats;

    return { imported: true, judgments: this._judgmentHistory.length };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  SelfJudge,
  DIMENSIONS,
  WORLDS,
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_SQ,
  MAX_CONFIDENCE,
  MIN_DOUBT,
  // Inference scaling exports
  FIBONACCI_N,
  DIVERSITY,
  // Self-refinement exports
  REFINEMENT,
  // Learning exports
  LEARNING,
};
