/**
 * CYNIC-DISCOVER - Residual Analysis & Dimension Discovery
 * =========================================================
 *
 * Layer: ATZILUT (Opus) - The Emanation Layer
 * Purpose: Analyze what doesn't fit, discover what's missing
 *
 * Philosophy: "The residual is the signal" - φ
 *
 * When judgments consistently miss something, when patterns
 * don't fit the matrix, when the unexplained accumulates...
 * DISCOVER finds the hidden dimensions.
 *
 * Core Functions:
 * - analyzeResiduals(): Find patterns in what doesn't fit
 * - proposeNewDimension(): When residuals converge, propose dimension
 * - validateDimension(): Test if proposed dimension is real
 * - integrateDimension(): Add validated dimension to matrix
 *
 * The φ Principle:
 * - A dimension emerges when residuals exceed φ⁻¹ threshold
 * - New dimensions must explain at least φ⁻¹ of residual variance
 * - Integration happens at golden ratio of confidence
 */

const fs = require('fs');
const path = require('path');

// φ constants
const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// Discovery thresholds
const THRESHOLDS = {
  // Minimum residuals needed to analyze
  MIN_RESIDUALS: 21, // Fibonacci

  // Residual must exceed this to be significant
  SIGNIFICANCE: PHI_INV * 0.5, // ~0.309

  // Pattern strength needed to propose dimension
  PATTERN_STRENGTH: PHI_INV, // ~0.618

  // Confidence needed to validate dimension
  VALIDATION_CONFIDENCE: PHI_INV * PHI_INV, // ~0.382

  // Variance explained needed for integration
  VARIANCE_EXPLAINED: PHI_INV, // ~0.618

  // Maximum dimensions before requiring consolidation
  MAX_DIMENSIONS: 34, // Fibonacci

  // Minimum observations to validate
  MIN_VALIDATION_OBS: 13 // Fibonacci
};

// Discovery states
const STATES = {
  DORMANT: 'dormant',       // Not enough data
  COLLECTING: 'collecting', // Gathering residuals
  ANALYZING: 'analyzing',   // Looking for patterns
  PROPOSING: 'proposing',   // Dimension proposed
  VALIDATING: 'validating', // Testing dimension
  INTEGRATING: 'integrating', // Adding to matrix
  COMPLETE: 'complete'      // Dimension integrated
};

// Residual types
const RESIDUAL_TYPES = {
  UNEXPLAINED_VARIANCE: 'unexplained_variance',
  PREDICTION_ERROR: 'prediction_error',
  CORRELATION_ANOMALY: 'correlation_anomaly',
  CLUSTER_OUTLIER: 'cluster_outlier',
  TEMPORAL_DRIFT: 'temporal_drift',
  CROSS_DOMAIN_LEAK: 'cross_domain_leak'
};

/**
 * Main Discovery State
 */
const discoveryState = {
  // Collected residuals
  residuals: [],

  // Detected patterns in residuals
  patterns: [],

  // Proposed dimensions (not yet validated)
  proposals: [],

  // Validated dimensions (ready for integration)
  validated: [],

  // Integrated dimensions (historical record)
  integrated: [],

  // Discovery sessions
  sessions: [],

  // Current state
  state: STATES.DORMANT,

  // Metrics
  metrics: {
    totalResiduals: 0,
    significantResiduals: 0,
    patternsFound: 0,
    proposalsGenerated: 0,
    validationsAttempted: 0,
    successfulValidations: 0,
    integrationsComplete: 0
  }
};

/**
 * Record a residual from judgment
 * Called when a judgment has unexplained variance
 */
function recordResidual(residual) {
  const enriched = {
    id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: residual.type || RESIDUAL_TYPES.UNEXPLAINED_VARIANCE,

    // Source context
    source: {
      judgmentId: residual.judgmentId,
      itemType: residual.itemType,
      domain: residual.domain,
      context: residual.context
    },

    // Residual data
    value: residual.value,
    magnitude: Math.abs(residual.value),
    direction: residual.value > 0 ? 'positive' : 'negative',

    // Which dimensions were involved
    dimensions: residual.dimensions || [],

    // What was expected vs actual
    expected: residual.expected,
    actual: residual.actual,

    // Additional signals
    signals: residual.signals || [],

    // Potential dimension hints
    hints: extractHints(residual),

    // Significance score
    significance: calculateSignificance(residual)
  };

  discoveryState.residuals.push(enriched);
  discoveryState.metrics.totalResiduals++;

  if (enriched.significance >= THRESHOLDS.SIGNIFICANCE) {
    discoveryState.metrics.significantResiduals++;
  }

  // Trim old residuals (keep last 1000)
  if (discoveryState.residuals.length > 1000) {
    discoveryState.residuals = discoveryState.residuals.slice(-1000);
  }

  // Update state
  updateDiscoveryState();

  return enriched;
}

/**
 * Extract hints from residual about potential dimension
 */
function extractHints(residual) {
  const hints = [];

  // Check signals for dimension-like patterns
  if (residual.signals) {
    for (const signal of residual.signals) {
      if (typeof signal === 'string') {
        // Look for quality-like words
        const qualityWords = [
          'clarity', 'depth', 'breadth', 'precision', 'relevance',
          'novelty', 'elegance', 'robustness', 'flexibility', 'efficiency',
          'coherence', 'completeness', 'consistency', 'simplicity', 'power',
          'intuitive', 'practical', 'theoretical', 'creative', 'systematic'
        ];

        for (const word of qualityWords) {
          if (signal.toLowerCase().includes(word)) {
            hints.push({
              type: 'quality_word',
              word,
              strength: 0.5
            });
          }
        }
      }
    }
  }

  // Check if residual correlates with specific item types
  if (residual.itemType) {
    hints.push({
      type: 'domain_specific',
      domain: residual.itemType,
      strength: 0.3
    });
  }

  // Check dimension involvement
  if (residual.dimensions && residual.dimensions.length > 0) {
    // Residual after these dimensions suggests something orthogonal
    hints.push({
      type: 'orthogonal_to',
      dimensions: residual.dimensions,
      strength: 0.4
    });
  }

  return hints;
}

/**
 * Calculate significance of a residual
 */
function calculateSignificance(residual) {
  let significance = 0;

  // Base on magnitude
  significance += Math.min(residual.value ? Math.abs(residual.value) / 100 : 0, 0.5);

  // Boost if unexplained variance is high
  if (residual.type === RESIDUAL_TYPES.UNEXPLAINED_VARIANCE) {
    significance *= 1.2;
  }

  // Boost if affects multiple dimensions
  if (residual.dimensions && residual.dimensions.length > 3) {
    significance *= 1.1;
  }

  // Boost if has strong signals
  if (residual.signals && residual.signals.length > 2) {
    significance *= 1.1;
  }

  return Math.min(significance, 1.0);
}

/**
 * Update discovery state based on current data
 */
function updateDiscoveryState() {
  const significantCount = discoveryState.residuals.filter(
    r => r.significance >= THRESHOLDS.SIGNIFICANCE
  ).length;

  if (significantCount < THRESHOLDS.MIN_RESIDUALS) {
    discoveryState.state = STATES.COLLECTING;
  } else if (discoveryState.proposals.length > 0) {
    const activeProposal = discoveryState.proposals.find(p => p.status === 'validating');
    if (activeProposal) {
      discoveryState.state = STATES.VALIDATING;
    } else {
      discoveryState.state = STATES.PROPOSING;
    }
  } else if (discoveryState.patterns.length > 0) {
    discoveryState.state = STATES.ANALYZING;
  } else {
    discoveryState.state = STATES.COLLECTING;
  }
}

/**
 * Analyze residuals for patterns
 * This is the core discovery algorithm
 */
function analyzeResiduals(options = {}) {
  const {
    minResiduals = THRESHOLDS.MIN_RESIDUALS,
    timeWindow = null, // null = all time
    focusDimensions = null // null = all dimensions
  } = options;

  // Filter residuals
  let residuals = discoveryState.residuals.filter(
    r => r.significance >= THRESHOLDS.SIGNIFICANCE
  );

  if (timeWindow) {
    const cutoff = new Date(Date.now() - timeWindow);
    residuals = residuals.filter(r => new Date(r.timestamp) > cutoff);
  }

  if (focusDimensions) {
    residuals = residuals.filter(r =>
      r.dimensions.some(d => focusDimensions.includes(d))
    );
  }

  if (residuals.length < minResiduals) {
    return {
      status: 'insufficient_data',
      residualCount: residuals.length,
      required: minResiduals,
      patterns: []
    };
  }

  // Find patterns in residuals
  const patterns = [];

  // 1. Cluster by hints
  const hintClusters = clusterByHints(residuals);
  for (const cluster of hintClusters) {
    if (cluster.strength >= THRESHOLDS.PATTERN_STRENGTH) {
      patterns.push({
        type: 'hint_cluster',
        name: cluster.primaryHint,
        residuals: cluster.residuals.length,
        strength: cluster.strength,
        description: `Residuals cluster around "${cluster.primaryHint}" concept`,
        potentialDimension: generateDimensionName(cluster)
      });
    }
  }

  // 2. Temporal patterns
  const temporalPatterns = findTemporalPatterns(residuals);
  for (const pattern of temporalPatterns) {
    if (pattern.strength >= THRESHOLDS.PATTERN_STRENGTH) {
      patterns.push({
        type: 'temporal',
        name: pattern.name,
        residuals: pattern.count,
        strength: pattern.strength,
        description: pattern.description,
        potentialDimension: pattern.dimensionHint
      });
    }
  }

  // 3. Cross-domain patterns
  const crossDomainPatterns = findCrossDomainPatterns(residuals);
  for (const pattern of crossDomainPatterns) {
    if (pattern.strength >= THRESHOLDS.PATTERN_STRENGTH) {
      patterns.push({
        type: 'cross_domain',
        name: pattern.name,
        residuals: pattern.count,
        strength: pattern.strength,
        description: pattern.description,
        potentialDimension: pattern.dimensionHint
      });
    }
  }

  // 4. Correlation anomalies
  const correlationPatterns = findCorrelationAnomalies(residuals);
  for (const pattern of correlationPatterns) {
    if (pattern.strength >= THRESHOLDS.PATTERN_STRENGTH) {
      patterns.push({
        type: 'correlation_anomaly',
        name: pattern.name,
        residuals: pattern.count,
        strength: pattern.strength,
        description: pattern.description,
        potentialDimension: pattern.dimensionHint
      });
    }
  }

  // Store patterns
  discoveryState.patterns = patterns;
  discoveryState.metrics.patternsFound = patterns.length;

  // Update state
  if (patterns.length > 0) {
    discoveryState.state = STATES.ANALYZING;
  }

  return {
    status: 'analysis_complete',
    residualCount: residuals.length,
    patterns: patterns.sort((a, b) => b.strength - a.strength),
    strongestPattern: patterns[0] || null,
    recommendation: patterns.length > 0
      ? `Found ${patterns.length} pattern(s). Strongest: "${patterns[0]?.name}" (${(patterns[0]?.strength * 100).toFixed(1)}%)`
      : 'No significant patterns found. Continue collecting residuals.'
  };
}

/**
 * Cluster residuals by their hints
 */
function clusterByHints(residuals) {
  const hintMap = new Map();

  for (const residual of residuals) {
    for (const hint of residual.hints) {
      const key = hint.type === 'quality_word' ? hint.word :
                  hint.type === 'domain_specific' ? hint.domain :
                  'orthogonal';

      if (!hintMap.has(key)) {
        hintMap.set(key, {
          primaryHint: key,
          residuals: [],
          totalStrength: 0
        });
      }

      const cluster = hintMap.get(key);
      cluster.residuals.push(residual);
      cluster.totalStrength += hint.strength * residual.significance;
    }
  }

  return Array.from(hintMap.values()).map(cluster => ({
    ...cluster,
    strength: cluster.totalStrength / cluster.residuals.length
  }));
}

/**
 * Find temporal patterns in residuals
 */
function findTemporalPatterns(residuals) {
  const patterns = [];

  // Group by hour of day
  const hourly = new Array(24).fill(0);
  for (const r of residuals) {
    const hour = new Date(r.timestamp).getHours();
    hourly[hour] += r.significance;
  }

  // Find peak hours
  const avgSignificance = hourly.reduce((a, b) => a + b, 0) / 24;
  for (let h = 0; h < 24; h++) {
    if (hourly[h] > avgSignificance * PHI) {
      patterns.push({
        name: `peak_hour_${h}`,
        count: Math.floor(hourly[h]),
        strength: hourly[h] / (avgSignificance * PHI),
        description: `Residuals peak at hour ${h}`,
        dimensionHint: 'TEMPORAL_SENSITIVITY'
      });
    }
  }

  // Check for drift over time
  const sorted = [...residuals].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  if (sorted.length >= 10) {
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const avgFirst = firstHalf.reduce((a, r) => a + r.magnitude, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, r) => a + r.magnitude, 0) / secondHalf.length;

    const drift = (avgSecond - avgFirst) / avgFirst;

    if (Math.abs(drift) > PHI_INV) {
      patterns.push({
        name: 'temporal_drift',
        count: residuals.length,
        strength: Math.abs(drift),
        description: `Residual magnitude ${drift > 0 ? 'increasing' : 'decreasing'} over time (${(drift * 100).toFixed(1)}% drift)`,
        dimensionHint: 'EVOLUTION_RATE'
      });
    }
  }

  return patterns;
}

/**
 * Find cross-domain patterns
 */
function findCrossDomainPatterns(residuals) {
  const patterns = [];
  const domainMap = new Map();

  // Group by domain
  for (const r of residuals) {
    const domain = r.source?.domain || 'unknown';
    if (!domainMap.has(domain)) {
      domainMap.set(domain, []);
    }
    domainMap.get(domain).push(r);
  }

  // Look for patterns that span multiple domains
  const domains = Array.from(domainMap.keys());

  if (domains.length >= 2) {
    // Check if same hints appear across domains
    const crossDomainHints = new Map();

    for (const [domain, domainResiduals] of domainMap) {
      for (const r of domainResiduals) {
        for (const hint of r.hints) {
          const key = hint.word || hint.domain || 'orthogonal';
          if (!crossDomainHints.has(key)) {
            crossDomainHints.set(key, new Set());
          }
          crossDomainHints.get(key).add(domain);
        }
      }
    }

    // Hints appearing in multiple domains are interesting
    for (const [hint, domainSet] of crossDomainHints) {
      if (domainSet.size >= 2) {
        patterns.push({
          name: `cross_domain_${hint}`,
          count: domainSet.size,
          strength: domainSet.size / domains.length,
          description: `"${hint}" pattern appears across ${domainSet.size} domains`,
          dimensionHint: hint.toUpperCase().replace(/\s+/g, '_')
        });
      }
    }
  }

  return patterns;
}

/**
 * Find correlation anomalies
 */
function findCorrelationAnomalies(residuals) {
  const patterns = [];

  // Group residuals by dimension pairs
  const pairMap = new Map();

  for (const r of residuals) {
    if (r.dimensions && r.dimensions.length >= 2) {
      for (let i = 0; i < r.dimensions.length; i++) {
        for (let j = i + 1; j < r.dimensions.length; j++) {
          const pair = [r.dimensions[i], r.dimensions[j]].sort().join('|');
          if (!pairMap.has(pair)) {
            pairMap.set(pair, []);
          }
          pairMap.get(pair).push(r);
        }
      }
    }
  }

  // Check for pairs with consistent residual direction
  for (const [pair, pairResiduals] of pairMap) {
    if (pairResiduals.length >= 5) {
      const positive = pairResiduals.filter(r => r.direction === 'positive').length;
      const ratio = positive / pairResiduals.length;

      // Strong directional bias suggests missing dimension
      if (ratio > PHI_INV || ratio < (1 - PHI_INV)) {
        const [dim1, dim2] = pair.split('|');
        patterns.push({
          name: `correlation_${dim1}_${dim2}`,
          count: pairResiduals.length,
          strength: Math.abs(ratio - 0.5) * 2,
          description: `Consistent ${ratio > 0.5 ? 'positive' : 'negative'} residuals when ${dim1} and ${dim2} interact`,
          dimensionHint: `${dim1}_${dim2}_INTERACTION`
        });
      }
    }
  }

  return patterns;
}

/**
 * Generate dimension name from cluster
 */
function generateDimensionName(cluster) {
  const hint = cluster.primaryHint;

  // Clean and format
  return hint
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Propose a new dimension based on strongest pattern
 */
function proposeNewDimension(options = {}) {
  const {
    pattern = null, // Use specific pattern, or strongest
    basedOnAnalysis = true // Run analysis first
  } = options;

  let targetPattern = pattern;

  // Run analysis if needed
  if (!targetPattern && basedOnAnalysis) {
    const analysis = analyzeResiduals();
    if (analysis.patterns.length === 0) {
      return {
        status: 'no_patterns',
        message: 'No significant patterns found to base dimension on'
      };
    }
    targetPattern = analysis.patterns[0];
  }

  if (!targetPattern) {
    return {
      status: 'error',
      message: 'No pattern provided and analysis found none'
    };
  }

  // Generate proposal
  const proposal = {
    id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    status: 'proposed',

    // The proposed dimension
    dimension: {
      name: targetPattern.potentialDimension,
      description: generateDimensionDescription(targetPattern),
      category: inferCategory(targetPattern),

      // Initial calibration based on residuals
      weight: PHI_INV, // Start at golden ratio
      harmonies: {}, // Will be populated during validation
      threshold: 0.5
    },

    // Evidence
    evidence: {
      pattern: targetPattern,
      residualCount: targetPattern.residuals,
      strength: targetPattern.strength,
      support: calculateSupport(targetPattern)
    },

    // Validation requirements
    validation: {
      required: THRESHOLDS.MIN_VALIDATION_OBS,
      observations: [],
      varianceExplained: 0,
      confidence: 0
    }
  };

  // Store proposal
  discoveryState.proposals.push(proposal);
  discoveryState.metrics.proposalsGenerated++;
  discoveryState.state = STATES.PROPOSING;

  return {
    status: 'proposed',
    proposal: {
      id: proposal.id,
      dimension: proposal.dimension,
      evidence: proposal.evidence,
      nextStep: 'Call validateDimension() with observations to test the proposal'
    }
  };
}

/**
 * Generate description for proposed dimension
 */
function generateDimensionDescription(pattern) {
  const templates = {
    hint_cluster: (p) => `Measures the quality of ${p.name.toLowerCase()} in evaluated items`,
    temporal: (p) => `Captures temporal sensitivity: ${p.description}`,
    cross_domain: (p) => `Cross-domain quality: ${p.description}`,
    correlation_anomaly: (p) => `Interaction effect: ${p.description}`
  };

  const template = templates[pattern.type] || (() => `Dimension based on ${pattern.name} pattern`);
  return template(pattern);
}

/**
 * Infer category for dimension
 */
function inferCategory(pattern) {
  if (pattern.type === 'temporal') return 'META';
  if (pattern.type === 'cross_domain') return 'BRIDGE';
  if (pattern.type === 'correlation_anomaly') return 'INTERACTION';

  // Try to infer from dimension name
  const name = pattern.potentialDimension.toLowerCase();
  if (name.includes('clarity') || name.includes('depth')) return 'COGNITIVE';
  if (name.includes('elegant') || name.includes('beauty')) return 'AESTHETIC';
  if (name.includes('practical') || name.includes('useful')) return 'PRACTICAL';
  if (name.includes('ethical') || name.includes('fair')) return 'ETHICAL';

  return 'EMERGENT';
}

/**
 * Calculate support for pattern
 */
function calculateSupport(pattern) {
  return {
    residualBased: pattern.residuals / discoveryState.residuals.length,
    strengthBased: pattern.strength,
    combined: (pattern.residuals / discoveryState.residuals.length + pattern.strength) / 2
  };
}

/**
 * Validate a proposed dimension with new observations
 */
function validateDimension(proposalId, observation) {
  const proposal = discoveryState.proposals.find(p => p.id === proposalId);

  if (!proposal) {
    return {
      status: 'error',
      message: `Proposal ${proposalId} not found`
    };
  }

  if (proposal.status === 'validated' || proposal.status === 'rejected') {
    return {
      status: 'already_complete',
      message: `Proposal already ${proposal.status}`
    };
  }

  proposal.status = 'validating';
  discoveryState.state = STATES.VALIDATING;
  discoveryState.metrics.validationsAttempted++;

  // Record observation
  const enrichedObs = {
    timestamp: new Date().toISOString(),
    item: observation.item,
    expectedScore: observation.expectedScore,
    actualScore: observation.actualScore,
    dimensionScore: observation.dimensionScore,
    residual: observation.actualScore - observation.expectedScore
  };

  proposal.validation.observations.push(enrichedObs);

  // Check if we have enough observations
  if (proposal.validation.observations.length < proposal.validation.required) {
    return {
      status: 'collecting',
      observationsNeeded: proposal.validation.required - proposal.validation.observations.length,
      currentObservations: proposal.validation.observations.length
    };
  }

  // Calculate variance explained
  const observations = proposal.validation.observations;

  // Total variance in residuals
  const residuals = observations.map(o => o.residual);
  const meanResidual = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const totalVariance = residuals.reduce((a, r) => a + Math.pow(r - meanResidual, 2), 0);

  // Variance explained by new dimension
  // This is simplified - real implementation would use regression
  const dimensionScores = observations.map(o => o.dimensionScore);
  const meanDimScore = dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length;

  // Correlation between dimension score and residual
  let correlation = 0;
  for (let i = 0; i < observations.length; i++) {
    correlation += (residuals[i] - meanResidual) * (dimensionScores[i] - meanDimScore);
  }
  correlation /= Math.sqrt(totalVariance * dimensionScores.reduce((a, d) => a + Math.pow(d - meanDimScore, 2), 0));

  const varianceExplained = Math.abs(correlation);
  proposal.validation.varianceExplained = varianceExplained;
  proposal.validation.confidence = varianceExplained * proposal.evidence.strength;

  // Check thresholds
  if (varianceExplained >= THRESHOLDS.VARIANCE_EXPLAINED &&
      proposal.validation.confidence >= THRESHOLDS.VALIDATION_CONFIDENCE) {
    proposal.status = 'validated';
    discoveryState.validated.push(proposal);
    discoveryState.metrics.successfulValidations++;

    return {
      status: 'validated',
      dimension: proposal.dimension.name,
      varianceExplained: (varianceExplained * 100).toFixed(1) + '%',
      confidence: (proposal.validation.confidence * 100).toFixed(1) + '%',
      nextStep: 'Call integrateDimension() to add to the matrix'
    };
  } else {
    proposal.status = 'rejected';

    return {
      status: 'rejected',
      dimension: proposal.dimension.name,
      varianceExplained: (varianceExplained * 100).toFixed(1) + '%',
      confidence: (proposal.validation.confidence * 100).toFixed(1) + '%',
      reason: varianceExplained < THRESHOLDS.VARIANCE_EXPLAINED
        ? `Variance explained (${(varianceExplained * 100).toFixed(1)}%) below threshold (${(THRESHOLDS.VARIANCE_EXPLAINED * 100).toFixed(1)}%)`
        : `Confidence (${(proposal.validation.confidence * 100).toFixed(1)}%) below threshold (${(THRESHOLDS.VALIDATION_CONFIDENCE * 100).toFixed(1)}%)`
    };
  }
}

/**
 * Integrate validated dimension into the matrix
 */
function integrateDimension(proposalId, options = {}) {
  const {
    matrixPath = null,
    dryRun = false
  } = options;

  const proposal = discoveryState.validated.find(p => p.id === proposalId);

  if (!proposal) {
    return {
      status: 'error',
      message: `Validated proposal ${proposalId} not found`
    };
  }

  // Build dimension entry
  const dimensionEntry = {
    name: proposal.dimension.name,
    description: proposal.dimension.description,
    category: proposal.dimension.category,
    weight: proposal.dimension.weight,
    threshold: proposal.dimension.threshold,

    // Discovery metadata
    discoveredAt: new Date().toISOString(),
    discoveryEvidence: {
      patternType: proposal.evidence.pattern.type,
      patternStrength: proposal.evidence.strength,
      residualsAnalyzed: proposal.evidence.residualCount,
      varianceExplained: proposal.validation.varianceExplained,
      confidence: proposal.validation.confidence
    },

    // Initial harmonies (empty - will be learned)
    harmonies: {}
  };

  if (dryRun) {
    return {
      status: 'dry_run',
      dimension: dimensionEntry,
      message: 'Dimension ready for integration (dry run)'
    };
  }

  // Record integration
  discoveryState.integrated.push({
    proposal,
    dimension: dimensionEntry,
    integratedAt: new Date().toISOString()
  });

  // Remove from validated
  discoveryState.validated = discoveryState.validated.filter(p => p.id !== proposalId);

  discoveryState.metrics.integrationsComplete++;
  discoveryState.state = STATES.COMPLETE;

  // Reset to collecting state
  setTimeout(() => {
    discoveryState.state = STATES.COLLECTING;
  }, 1000);

  return {
    status: 'integrated',
    dimension: dimensionEntry,
    totalDimensions: discoveryState.integrated.length,
    message: `${dimensionEntry.name} dimension integrated successfully`
  };
}

/**
 * Get discovery summary
 */
function getSummary() {
  return {
    state: discoveryState.state,

    residuals: {
      total: discoveryState.metrics.totalResiduals,
      significant: discoveryState.metrics.significantResiduals,
      current: discoveryState.residuals.length
    },

    patterns: {
      found: discoveryState.metrics.patternsFound,
      active: discoveryState.patterns.length,
      strongest: discoveryState.patterns[0]?.name || null
    },

    proposals: {
      total: discoveryState.metrics.proposalsGenerated,
      active: discoveryState.proposals.filter(p => p.status !== 'validated' && p.status !== 'rejected').length,
      validated: discoveryState.validated.length
    },

    validations: {
      attempted: discoveryState.metrics.validationsAttempted,
      successful: discoveryState.metrics.successfulValidations,
      successRate: discoveryState.metrics.validationsAttempted > 0
        ? (discoveryState.metrics.successfulValidations / discoveryState.metrics.validationsAttempted * 100).toFixed(1) + '%'
        : 'N/A'
    },

    integrations: {
      total: discoveryState.metrics.integrationsComplete,
      recent: discoveryState.integrated.slice(-5).map(i => i.dimension.name)
    },

    health: calculateDiscoveryHealth(),

    φ_alignment: calculatePhiAlignment()
  };
}

/**
 * Calculate discovery health
 */
function calculateDiscoveryHealth() {
  let health = 50; // Base

  // Good residual flow
  if (discoveryState.residuals.length >= THRESHOLDS.MIN_RESIDUALS) {
    health += 15;
  }

  // Finding patterns
  if (discoveryState.patterns.length > 0) {
    health += 15;
  }

  // Successful validations
  if (discoveryState.metrics.successfulValidations > 0) {
    health += 10;
  }

  // Good validation rate
  if (discoveryState.metrics.validationsAttempted > 0) {
    const rate = discoveryState.metrics.successfulValidations / discoveryState.metrics.validationsAttempted;
    health += Math.floor(rate * 10);
  }

  return Math.min(health, 100);
}

/**
 * Calculate φ alignment
 */
function calculatePhiAlignment() {
  // Check if key ratios approach φ
  const ratios = [];

  // Pattern strength to threshold ratio
  if (discoveryState.patterns.length > 0) {
    const avgStrength = discoveryState.patterns.reduce((a, p) => a + p.strength, 0) / discoveryState.patterns.length;
    ratios.push({
      name: 'pattern_strength/threshold',
      value: avgStrength / THRESHOLDS.PATTERN_STRENGTH,
      target: PHI
    });
  }

  // Successful/attempted ratio (should approach φ⁻¹)
  if (discoveryState.metrics.validationsAttempted > 0) {
    ratios.push({
      name: 'success/attempts',
      value: discoveryState.metrics.successfulValidations / discoveryState.metrics.validationsAttempted,
      target: PHI_INV
    });
  }

  // Calculate alignment
  if (ratios.length === 0) return 0;

  const alignment = ratios.reduce((sum, r) => {
    const deviation = Math.abs(r.value - r.target);
    return sum + Math.max(0, 1 - deviation);
  }, 0) / ratios.length;

  return (alignment * 100).toFixed(1) + '%';
}

/**
 * Perform full discovery cycle
 * Convenience function that runs analysis and proposes if patterns found
 */
async function discover(options = {}) {
  const {
    minResiduals = THRESHOLDS.MIN_RESIDUALS,
    autoPropose = true
  } = options;

  // Analyze
  const analysis = analyzeResiduals({ minResiduals });

  if (analysis.status !== 'analysis_complete') {
    return {
      status: 'insufficient_data',
      analysis,
      recommendation: `Collect ${minResiduals - analysis.residualCount} more significant residuals`
    };
  }

  if (analysis.patterns.length === 0) {
    return {
      status: 'no_patterns',
      analysis,
      recommendation: 'Continue collecting residuals - no significant patterns yet'
    };
  }

  // Auto-propose if enabled
  if (autoPropose) {
    const proposal = proposeNewDimension({ pattern: analysis.patterns[0] });

    return {
      status: 'proposal_generated',
      analysis,
      proposal,
      recommendation: 'Collect validation observations for the proposed dimension'
    };
  }

  return {
    status: 'patterns_found',
    analysis,
    recommendation: `${analysis.patterns.length} pattern(s) found. Call proposeNewDimension() to create proposal`
  };
}

/**
 * Get the meta-dimension (the innommable)
 * This represents what's beyond all dimensions
 */
function getMetaDimension() {
  return {
    name: 'THE_INNOMMABLE',
    nature: 'The dimension of undiscovered dimensions',

    philosophy: `
      Every judgment leaves a residual.
      Every residual is a signal.
      The accumulation of residuals reveals patterns.
      Patterns, when persistent, become dimensions.
      But beyond all dimensions lies THE_INNOMMABLE -
      The eternal frontier of what we cannot yet name.

      φ guides us toward it, but never arrives.
      1.618... forever approaching, never reaching.

      This is the engine of perpetual discovery.
    `,

    currentState: {
      residualsCollected: discoveryState.metrics.totalResiduals,
      dimensionsDiscovered: discoveryState.integrated.length,
      patternsEmerging: discoveryState.patterns.length,
      nextDiscovery: discoveryState.proposals.length > 0
        ? discoveryState.proposals[0].dimension.name
        : 'Unknown - collecting residuals'
    },

    φ_insight: `The ratio of discovered to undiscovered dimensions approaches φ⁻¹ (${PHI_INV.toFixed(3)}). We always know less than we don't know.`
  };
}

// Export
module.exports = {
  // Core functions
  recordResidual,
  analyzeResiduals,
  proposeNewDimension,
  validateDimension,
  integrateDimension,

  // Convenience
  discover,
  getSummary,
  getMetaDimension,

  // State access (for debugging/testing)
  getState: () => ({ ...discoveryState }),
  getPatterns: () => [...discoveryState.patterns],
  getProposals: () => [...discoveryState.proposals],
  getValidated: () => [...discoveryState.validated],
  getIntegrated: () => [...discoveryState.integrated],

  // Constants
  THRESHOLDS,
  STATES,
  RESIDUAL_TYPES,
  PHI,
  PHI_INV
};
