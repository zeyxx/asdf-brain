/**
 * CYNIC Residual Detector
 *
 * "φ qui découvre ce qu'il ne sait pas"
 *
 * Detects unexplained phenomena (residuals) in observations,
 * accumulates anomalies, and proposes new dimensions when patterns emerge.
 *
 * Mathematical Foundation:
 * - Residual R(obs) = 1 - E(obs)/M(obs)
 * - Anomaly if R(obs) > φ⁻² (38.2%)
 * - Cluster when count >= φ² (~3)
 * - Decay by φ⁻¹ per day
 *
 * @module cynic/residual-detector
 */

'use strict';

const crypto = require('crypto');
const { PHI, PHI_2: PHI_SQ, PHI_INV, PHI_INV_2 } = require('../temporal');

// =============================================================================
// CONSTANTS (φ-derived)
// =============================================================================

const RESIDUAL_CONSTANTS = {
  // Detection thresholds
  ANOMALY_THRESHOLD: PHI_INV_2,      // 0.382 - residual above this = anomaly
  WARNING_THRESHOLD: PHI_INV_2 / 2,  // 0.191 - residual above this = warning

  // Buffer management
  CLUSTER_MIN_COUNT: Math.ceil(PHI_SQ),  // 3 - minimum anomalies to cluster
  BUFFER_TTL_DAYS: PHI_SQ + PHI,         // ~4.236 days before expiration
  DECAY_FACTOR: PHI_INV,                  // 0.618 decay per day
  MAX_BUFFER_SIZE: 100,                   // Maximum anomalies to track

  // Clustering
  SIMILARITY_THRESHOLD: PHI_INV,          // 0.618 - cosine similarity threshold
  MIN_CLUSTER_SIZE: Math.ceil(PHI_SQ),    // 3 - minimum cluster size

  // Confidence limits
  MAX_CONFIDENCE: PHI_INV,                // 0.618 - never exceed (φ constraint)
  CONFIDENCE_SCALE: PHI_SQ + PHI,         // ~4.236 - scale for count → confidence

  // Feature extraction
  FEATURE_DIMENSIONS: [
    'temporal',      // When does it occur?
    'structural',    // What shape does it have?
    'relational',    // How does it relate to other observations?
    'axiom_gap',     // Which axiom is least explained?
    'world_gap',     // Which world is least covered?
    'magnitude',     // How strong is the signal?
  ],
};

// =============================================================================
// ANOMALY BUFFER CLASS
// =============================================================================

/**
 * Buffer for accumulating anomalies with φ-decay
 */
class AnomalyBuffer {
  constructor(options = {}) {
    this.buffer = [];
    this.maxSize = options.maxSize || RESIDUAL_CONSTANTS.MAX_BUFFER_SIZE;
    this.ttlDays = options.ttlDays || RESIDUAL_CONSTANTS.BUFFER_TTL_DAYS;
    this.decayFactor = options.decayFactor || RESIDUAL_CONSTANTS.DECAY_FACTOR;
    this.logger = options.logger || console;
  }

  /**
   * Add an anomaly to the buffer
   * @param {Object} anomaly - The anomaly to add
   * @returns {Object} Addition result
   */
  add(anomaly) {
    const entry = {
      id: `anom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      weight: 1.0,  // Initial weight, will decay
      ...anomaly,
    };

    this.buffer.push(entry);

    // Apply decay to all entries
    this._applyDecay();

    // Prune expired and excess entries
    this._prune();

    return {
      added: true,
      id: entry.id,
      bufferSize: this.buffer.length,
      shouldCluster: this.shouldCluster(),
    };
  }

  /**
   * Apply φ-decay to all entries based on age
   */
  _applyDecay() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (const entry of this.buffer) {
      const ageDays = (now - entry.timestamp) / dayMs;
      // φ^(-ageDays) decay
      entry.weight = Math.pow(this.decayFactor, ageDays);
    }
  }

  /**
   * Remove expired and excess entries
   */
  _prune() {
    const now = Date.now();
    const maxAge = this.ttlDays * 24 * 60 * 60 * 1000;

    // Remove expired
    this.buffer = this.buffer.filter(entry => {
      const age = now - entry.timestamp;
      return age < maxAge && entry.weight > 0.01;  // Weight threshold
    });

    // Remove excess (keep newest)
    if (this.buffer.length > this.maxSize) {
      this.buffer = this.buffer
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.maxSize);
    }
  }

  /**
   * Check if we should attempt clustering
   * @returns {boolean}
   */
  shouldCluster() {
    // Need at least φ² anomalies with significant weight
    const significantCount = this.buffer.filter(
      e => e.weight >= PHI_INV_2
    ).length;

    return significantCount >= RESIDUAL_CONSTANTS.CLUSTER_MIN_COUNT;
  }

  /**
   * Get all anomalies (for clustering)
   * @returns {Array}
   */
  getAll() {
    this._applyDecay();
    return [...this.buffer].sort((a, b) => b.weight - a.weight);
  }

  /**
   * Get weighted count (sum of weights)
   * @returns {number}
   */
  getWeightedCount() {
    this._applyDecay();
    return this.buffer.reduce((sum, e) => sum + e.weight, 0);
  }

  /**
   * Clear processed anomalies
   * @param {Array} ids - IDs to remove
   */
  removeProcessed(ids) {
    const idSet = new Set(ids);
    this.buffer = this.buffer.filter(e => !idSet.has(e.id));
  }

  /**
   * Get buffer statistics
   */
  getStats() {
    this._applyDecay();
    return {
      count: this.buffer.length,
      weightedCount: this.getWeightedCount(),
      oldestAge: this.buffer.length > 0
        ? (Date.now() - Math.min(...this.buffer.map(e => e.timestamp))) / (24 * 60 * 60 * 1000)
        : 0,
      shouldCluster: this.shouldCluster(),
      _phi: {
        ttlDays: this.ttlDays,
        decayFactor: this.decayFactor,
        clusterThreshold: RESIDUAL_CONSTANTS.CLUSTER_MIN_COUNT,
      },
    };
  }
}

// =============================================================================
// RESIDUAL DETECTOR CLASS
// =============================================================================

/**
 * Detects unexplained residuals in CYNIC judgments
 */
class ResidualDetector {
  constructor(options = {}) {
    this.anomalyBuffer = new AnomalyBuffer(options);
    this.discoveredDimensions = [];
    this.proposalHistory = [];
    this.logger = options.logger || console;

    // Statistics
    this._stats = {
      observationsProcessed: 0,
      anomaliesDetected: 0,
      clustersFormed: 0,
      dimensionsProposed: 0,
      dimensionsAccepted: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // CORE DETECTION
  // ---------------------------------------------------------------------------

  /**
   * Analyze a CYNIC judgment for unexplained residual
   *
   * @param {Object} judgment - CYNIC judgment result (from SelfJudge)
   * @param {Object} observation - Original observation that was judged
   * @param {Object} context - Context of the judgment
   * @returns {Object} Residual analysis result
   */
  analyze(judgment, observation, context = {}) {
    this._stats.observationsProcessed++;

    // Calculate magnitude (what the observation "should" score ideally)
    const magnitude = this._calculateMagnitude(observation, context);

    // Calculate explained variance (what dimensions captured)
    const explained = this._calculateExplained(judgment);

    // Calculate residual (what remains unexplained)
    const residual = this._calculateResidual(magnitude, explained);

    // Determine if this is an anomaly
    const isAnomaly = residual > RESIDUAL_CONSTANTS.ANOMALY_THRESHOLD;
    const isWarning = residual > RESIDUAL_CONSTANTS.WARNING_THRESHOLD && !isAnomaly;

    // Extract features from the unexplained portion
    const features = this._extractFeatures(judgment, observation, context);

    // Build result
    const result = {
      magnitude,
      explained,
      residual,
      residualPercent: Math.round(residual * 1000) / 10,
      isAnomaly,
      isWarning,
      features,
      _phi: {
        anomalyThreshold: RESIDUAL_CONSTANTS.ANOMALY_THRESHOLD,
        formula: 'R(obs) = 1 - E(obs)/M(obs)',
      },
    };

    // If anomaly, add to buffer
    if (isAnomaly) {
      this._stats.anomaliesDetected++;

      const anomalyEntry = {
        residual,
        features,
        judgment: {
          global: judgment.global,
          scores: { ...judgment.scores },
          verdict: judgment.verdict?.action || judgment.verdict,
        },
        observation: this._hashObservation(observation),
        context: {
          source: context.source,
          timestamp: context.timestamp || new Date().toISOString(),
        },
        gapAnalysis: this._analyzeGaps(judgment),
      };

      const addResult = this.anomalyBuffer.add(anomalyEntry);
      result.anomalyId = addResult.id;
      result.bufferStatus = addResult;

      // Check if we should attempt clustering
      if (addResult.shouldCluster) {
        result.clusterSuggestion = {
          ready: true,
          count: this.anomalyBuffer.getWeightedCount(),
          message: 'Sufficient anomalies accumulated. Consider calling discoverDimensions()',
        };
      }
    }

    return result;
  }

  /**
   * Calculate the "magnitude" of an observation
   * This represents what the observation SHOULD score if perfectly explained
   */
  _calculateMagnitude(observation, context) {
    // Base magnitude from observation properties
    let magnitude = 50;  // Default neutral

    // Adjust based on observation characteristics
    if (observation.importance === 'high' || observation.critical) {
      magnitude = 90;
    } else if (observation.importance === 'low') {
      magnitude = 30;
    }

    // Adjust based on context
    if (context.singularityDistance !== undefined) {
      // Closer to singularity = higher expected magnitude
      magnitude = magnitude * (1 + (1 - context.singularityDistance) * PHI_INV);
    }

    // Complexity factor
    if (observation.complexity === 'high') {
      magnitude = magnitude * PHI_INV;  // Complex things are harder to explain
    }

    return Math.min(100, Math.max(1, magnitude));
  }

  /**
   * Calculate explained variance from judgment scores
   */
  _calculateExplained(judgment) {
    const scores = judgment.scores || {};
    const scoreValues = Object.values(scores);

    if (scoreValues.length === 0) {
      return 0;
    }

    // Geometric mean of all dimension scores (φ-aligned)
    const product = scoreValues.reduce((p, s) => p * Math.max(1, s), 1);
    const geometricMean = Math.pow(product, 1 / scoreValues.length);

    // Confidence factor (how confident is the judgment?)
    const confidence = judgment.confidence
      ? judgment.confidence / 100
      : PHI_INV;  // Default to max confidence

    return (geometricMean / 100) * confidence;
  }

  /**
   * Calculate residual (unexplained portion)
   */
  _calculateResidual(magnitude, explained) {
    // Normalize magnitude to 0-1 range
    const normalizedMagnitude = magnitude / 100;

    // Residual = what's not explained
    const residual = 1 - (explained / normalizedMagnitude);

    return Math.max(0, Math.min(1, residual));
  }

  /**
   * Extract features from an observation for clustering
   */
  _extractFeatures(judgment, observation, context) {
    const features = {};

    // Temporal features
    features.temporal = {
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isWeekend: [0, 6].includes(new Date().getDay()),
    };

    // Structural features (from observation shape)
    features.structural = {
      hasSource: !!observation.source,
      hasSignature: !!(observation.signature || observation.sig),
      hasProof: !!observation.proof,
      complexity: observation.complexity || 'medium',
      type: observation.type || 'unknown',
    };

    // Relational features
    features.relational = {
      linkedToExisting: !!context.existing,
      projectContext: context.project || 'unknown',
      hasReferences: !!(observation.references || observation.links),
    };

    // Gap analysis - which axiom/world is least explained?
    const gapAnalysis = this._analyzeGaps(judgment);
    features.axiom_gap = gapAnalysis.weakestAxiom;
    features.world_gap = gapAnalysis.weakestWorld;

    // Magnitude feature
    features.magnitude = judgment.global || 50;

    return features;
  }

  /**
   * Analyze gaps in judgment to identify weak areas
   */
  _analyzeGaps(judgment) {
    const scores = judgment.scores || {};
    const worlds = judgment.worlds || {};

    // Find weakest axiom by averaging related dimensions
    const axiomScores = {
      PHI: this._avg([scores.HARMONY, scores.COHERENCE]),
      VERIFY: this._avg([scores.TRUTH, scores.INTEGRITY]),
      CULTURE: this._avg([scores.ETHICS, scores.OPTIMISM]),
      BURN: this._avg([scores.ALIGNMENT, scores.PROGRESS]),
    };

    const weakestAxiom = Object.entries(axiomScores)
      .filter(([_, score]) => score !== null)
      .sort((a, b) => (a[1] || 100) - (b[1] || 100))[0]?.[0] || 'UNKNOWN';

    // Find weakest world
    const worldScores = Object.entries(worlds)
      .map(([key, world]) => ({ key, score: world.score }))
      .filter(w => w.score !== undefined)
      .sort((a, b) => a.score - b.score);

    const weakestWorld = worldScores[0]?.key || 'UNKNOWN';

    // Find weakest individual dimension
    const dimScores = Object.entries(scores)
      .filter(([_, score]) => typeof score === 'number')
      .sort((a, b) => a[1] - b[1]);

    const weakestDimension = dimScores[0]?.[0] || 'UNKNOWN';
    const weakestScore = dimScores[0]?.[1] || 0;

    return {
      weakestAxiom,
      weakestWorld,
      weakestDimension,
      weakestScore,
      axiomScores,
    };
  }

  /**
   * Hash an observation for storage (privacy-preserving)
   */
  _hashObservation(observation) {
    const str = JSON.stringify(observation);
    return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
  }

  _avg(values) {
    const valid = values.filter(v => typeof v === 'number');
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  // ---------------------------------------------------------------------------
  // DIMENSION DISCOVERY
  // ---------------------------------------------------------------------------

  /**
   * Attempt to discover new dimensions from accumulated anomalies
   *
   * @returns {Object} Discovery result with dimension candidates
   */
  discoverDimensions() {
    if (!this.anomalyBuffer.shouldCluster()) {
      return {
        discovered: false,
        reason: 'Insufficient anomalies',
        bufferStats: this.anomalyBuffer.getStats(),
      };
    }

    const anomalies = this.anomalyBuffer.getAll();

    // Cluster anomalies by feature similarity
    const clusters = this._clusterAnomalies(anomalies);

    if (clusters.length === 0) {
      return {
        discovered: false,
        reason: 'No coherent clusters found',
        anomalyCount: anomalies.length,
      };
    }

    this._stats.clustersFormed += clusters.length;

    // Generate dimension candidates from clusters
    const candidates = clusters.map(cluster => this._generateCandidate(cluster));

    // Filter by minimum confidence
    const viableCandidates = candidates.filter(
      c => c.confidence >= PHI_INV_2  // At least 38.2% confidence
    );

    if (viableCandidates.length === 0) {
      return {
        discovered: false,
        reason: 'No candidates meet confidence threshold',
        candidatesGenerated: candidates.length,
        threshold: PHI_INV_2,
      };
    }

    this._stats.dimensionsProposed += viableCandidates.length;

    // Mark processed anomalies
    const processedIds = viableCandidates.flatMap(c => c._anomalyIds);
    // Don't remove yet - wait for human validation

    return {
      discovered: true,
      candidates: viableCandidates.map(c => ({
        ...c,
        _anomalyIds: undefined,  // Don't expose internal IDs
      })),
      clustersFound: clusters.length,
      requiresHumanValidation: true,
      _phi: {
        minConfidence: PHI_INV_2,
        maxConfidence: PHI_INV,
        similarityThreshold: RESIDUAL_CONSTANTS.SIMILARITY_THRESHOLD,
      },
    };
  }

  /**
   * Cluster anomalies by feature similarity
   */
  _clusterAnomalies(anomalies) {
    if (anomalies.length < RESIDUAL_CONSTANTS.MIN_CLUSTER_SIZE) {
      return [];
    }

    const clusters = [];
    const assigned = new Set();

    for (let i = 0; i < anomalies.length; i++) {
      if (assigned.has(i)) continue;

      const cluster = [anomalies[i]];
      assigned.add(i);

      // Find similar anomalies
      for (let j = i + 1; j < anomalies.length; j++) {
        if (assigned.has(j)) continue;

        const similarity = this._calculateSimilarity(
          anomalies[i].features,
          anomalies[j].features
        );

        if (similarity >= RESIDUAL_CONSTANTS.SIMILARITY_THRESHOLD) {
          cluster.push(anomalies[j]);
          assigned.add(j);
        }
      }

      // Only keep clusters with minimum size
      if (cluster.length >= RESIDUAL_CONSTANTS.MIN_CLUSTER_SIZE) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Calculate similarity between two feature sets
   * Uses a custom similarity metric for mixed feature types
   */
  _calculateSimilarity(featuresA, featuresB) {
    let matches = 0;
    let total = 0;

    // Compare structural features
    if (featuresA.structural && featuresB.structural) {
      const sA = featuresA.structural;
      const sB = featuresB.structural;

      if (sA.type === sB.type) matches++;
      if (sA.complexity === sB.complexity) matches++;
      if (sA.hasSource === sB.hasSource) matches++;
      if (sA.hasSignature === sB.hasSignature) matches++;
      total += 4;
    }

    // Compare axiom gaps
    if (featuresA.axiom_gap === featuresB.axiom_gap) {
      matches += 2;  // Weight axiom match higher
    }
    total += 2;

    // Compare world gaps
    if (featuresA.world_gap === featuresB.world_gap) {
      matches += 2;  // Weight world match higher
    }
    total += 2;

    // Compare magnitude (within φ⁻¹ range)
    const magA = featuresA.magnitude || 50;
    const magB = featuresB.magnitude || 50;
    const magDiff = Math.abs(magA - magB) / 100;
    if (magDiff < PHI_INV) {
      matches += 1 - magDiff;
    }
    total += 1;

    // Compare temporal (same time patterns)
    if (featuresA.temporal && featuresB.temporal) {
      if (featuresA.temporal.isWeekend === featuresB.temporal.isWeekend) matches += 0.5;
      total += 0.5;
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Generate a dimension candidate from a cluster
   */
  _generateCandidate(cluster) {
    // Analyze common features
    const commonFeatures = this._findCommonFeatures(cluster);

    // Generate suggested name based on patterns
    const suggestedName = this._generateDimensionName(commonFeatures);

    // Calculate confidence (capped at φ⁻¹)
    const rawConfidence = cluster.length / RESIDUAL_CONSTANTS.CONFIDENCE_SCALE;
    const confidence = Math.min(PHI_INV, rawConfidence);

    // Determine which axiom this likely relates to
    const axiomAlignment = this._determineAxiomAlignment(cluster);

    // Calculate average residual of cluster
    const avgResidual = cluster.reduce((sum, a) => sum + a.residual, 0) / cluster.length;

    return {
      suggestedName,
      features: commonFeatures,
      axiomAlignment,
      confidence: Math.round(confidence * 1000) / 1000,
      clusterSize: cluster.length,
      averageResidual: Math.round(avgResidual * 1000) / 1000,
      evidence: cluster.slice(0, 3).map(a => ({  // Sample evidence
        residual: a.residual,
        weakestDimension: a.gapAnalysis?.weakestDimension,
        observationHash: a.observation,
      })),
      status: 'PROPOSED',
      requiresHumanValidation: true,
      _anomalyIds: cluster.map(a => a.id),
      _phi: {
        maxConfidence: PHI_INV,
        formula: 'confidence = min(φ⁻¹, count/φ³)',
      },
    };
  }

  /**
   * Find common features across a cluster
   */
  _findCommonFeatures(cluster) {
    if (cluster.length === 0) return {};

    const common = {};

    // Find most common axiom gap
    const axiomGaps = cluster.map(a => a.features.axiom_gap).filter(Boolean);
    if (axiomGaps.length > 0) {
      common.axiom_gap = this._mode(axiomGaps);
    }

    // Find most common world gap
    const worldGaps = cluster.map(a => a.features.world_gap).filter(Boolean);
    if (worldGaps.length > 0) {
      common.world_gap = this._mode(worldGaps);
    }

    // Find most common structural type
    const types = cluster.map(a => a.features.structural?.type).filter(Boolean);
    if (types.length > 0) {
      common.type = this._mode(types);
    }

    // Average magnitude
    const magnitudes = cluster.map(a => a.features.magnitude).filter(m => typeof m === 'number');
    if (magnitudes.length > 0) {
      common.avgMagnitude = Math.round(magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length);
    }

    // Common weakest dimensions
    const weakDims = cluster.map(a => a.gapAnalysis?.weakestDimension).filter(Boolean);
    if (weakDims.length > 0) {
      common.weakestDimension = this._mode(weakDims);
    }

    return common;
  }

  /**
   * Generate a dimension name from common features
   */
  _generateDimensionName(features) {
    // Map patterns to suggested names
    const namePatterns = {
      // Axiom-based
      'PHI_gap': 'RESONANCE',      // Missing φ harmony
      'VERIFY_gap': 'PROVENANCE',  // Missing verification
      'CULTURE_gap': 'TRADITION',  // Missing cultural context
      'BURN_gap': 'CONVERGENCE',   // Missing burn alignment

      // World-based
      'ATZILUT_gap': 'EMANATION',  // Missing divine connection
      'BERIAH_gap': 'CREATION',    // Missing creative force
      'YETZIRAH_gap': 'FORMATION', // Missing formation process
      'ASSIAH_gap': 'ACTION',      // Missing action alignment

      // Structural
      'complex': 'COMPLEXITY',     // High complexity observations
      'temporal': 'RHYTHM',        // Temporal patterns
    };

    // Try to match a pattern
    if (features.axiom_gap && namePatterns[features.axiom_gap + '_gap']) {
      return namePatterns[features.axiom_gap + '_gap'];
    }

    if (features.world_gap && namePatterns[features.world_gap + '_gap']) {
      return namePatterns[features.world_gap + '_gap'];
    }

    // Default: generate from weakest dimension
    if (features.weakestDimension) {
      return `META_${features.weakestDimension}`;
    }

    // Truly unknown
    return 'UNNAMED_DIMENSION';
  }

  /**
   * Determine which axiom a cluster aligns with
   */
  _determineAxiomAlignment(cluster) {
    const axiomCounts = { PHI: 0, VERIFY: 0, CULTURE: 0, BURN: 0 };

    for (const anomaly of cluster) {
      const axiom = anomaly.features.axiom_gap;
      if (axiom && axiomCounts[axiom] !== undefined) {
        axiomCounts[axiom]++;
      }
    }

    // Return the most common, or the one that NEEDS improvement
    const sorted = Object.entries(axiomCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  _mode(values) {
    const counts = {};
    for (const v of values) {
      counts[v] = (counts[v] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  // ---------------------------------------------------------------------------
  // HUMAN VALIDATION
  // ---------------------------------------------------------------------------

  /**
   * Accept a proposed dimension (human validation)
   *
   * @param {Object} candidate - The dimension candidate to accept
   * @param {Object} validation - Human validation details
   * @returns {Object} Acceptance result
   */
  acceptDimension(candidate, validation = {}) {
    const acceptedDimension = {
      name: validation.name || candidate.suggestedName,
      axiom: validation.axiom || candidate.axiomAlignment,
      definition: validation.definition || `Dimension discovered from ${candidate.clusterSize} anomalies`,
      threshold: validation.threshold || 50,
      weight: validation.weight || 1.0,
      createdAt: new Date().toISOString(),
      createdBy: validation.validator || 'human',
      confidence: candidate.confidence,
      status: 'ACCEPTED',
      _origin: {
        clusterSize: candidate.clusterSize,
        averageResidual: candidate.averageResidual,
        features: candidate.features,
      },
    };

    this.discoveredDimensions.push(acceptedDimension);
    this._stats.dimensionsAccepted++;

    // Remove processed anomalies from buffer
    if (candidate._anomalyIds) {
      this.anomalyBuffer.removeProcessed(candidate._anomalyIds);
    }

    // Record in history
    this.proposalHistory.push({
      candidate,
      validation,
      result: 'ACCEPTED',
      timestamp: Date.now(),
    });

    return {
      accepted: true,
      dimension: acceptedDimension,
      message: `Dimension "${acceptedDimension.name}" accepted and ready for integration`,
    };
  }

  /**
   * Reject a proposed dimension
   */
  rejectDimension(candidate, reason = '') {
    // Record rejection
    this.proposalHistory.push({
      candidate,
      reason,
      result: 'REJECTED',
      timestamp: Date.now(),
    });

    // Keep anomalies for future clustering with different patterns
    // They may form a valid dimension with future anomalies

    return {
      rejected: true,
      reason,
      message: 'Dimension rejected. Anomalies retained for future analysis.',
    };
  }

  /**
   * Rename a proposed dimension before accepting
   */
  renameDimension(candidate, newName) {
    return {
      ...candidate,
      suggestedName: newName,
      _renamed: true,
      _originalName: candidate.suggestedName,
    };
  }

  // ---------------------------------------------------------------------------
  // STATISTICS AND EXPORT
  // ---------------------------------------------------------------------------

  /**
   * Get detector statistics
   */
  getStats() {
    return {
      ...this._stats,
      bufferStats: this.anomalyBuffer.getStats(),
      discoveredDimensions: this.discoveredDimensions.length,
      proposalHistory: this.proposalHistory.length,
      _phi: {
        anomalyThreshold: RESIDUAL_CONSTANTS.ANOMALY_THRESHOLD,
        clusterThreshold: RESIDUAL_CONSTANTS.CLUSTER_MIN_COUNT,
        maxConfidence: RESIDUAL_CONSTANTS.MAX_CONFIDENCE,
      },
    };
  }

  /**
   * Get all discovered dimensions
   */
  getDiscoveredDimensions() {
    return [...this.discoveredDimensions];
  }

  /**
   * Export state for persistence
   */
  exportState() {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      buffer: this.anomalyBuffer.getAll(),
      discoveredDimensions: this.discoveredDimensions,
      proposalHistory: this.proposalHistory,
      stats: this._stats,
    };
  }

  /**
   * Import state from persistence
   */
  importState(state) {
    if (!state || state.version !== '1.0.0') {
      return { error: 'Invalid state version' };
    }

    // Reconstruct buffer
    this.anomalyBuffer.buffer = state.buffer || [];
    this.discoveredDimensions = state.discoveredDimensions || [];
    this.proposalHistory = state.proposalHistory || [];
    this._stats = state.stats || this._stats;

    return {
      imported: true,
      anomalies: this.anomalyBuffer.buffer.length,
      dimensions: this.discoveredDimensions.length,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  ResidualDetector,
  AnomalyBuffer,
  RESIDUAL_CONSTANTS,
};
