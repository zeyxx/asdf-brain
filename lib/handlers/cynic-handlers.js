/**
 * CYNIC Handlers - brain_cynic_*
 *
 * [D] Drash - Self-Judge ("φ qui se méfie de φ")
 *
 * Philosophy: "Rendre autonome, pas automatiser"
 */

'use strict';

const { crypto } = require('./_shared');
const {
  SelfJudge,
  LEARNING,
  FIBONACCI_N,
  DIVERSITY,
  REFINEMENT,
} = require('../cynic/self-judge');
const { ResidualDetector } = require('../cynic/residual-detector');
const { getCynicVoice, CYNIC_IDENTITY } = require('../cynic/index');

// CYNIC instances - will be set by main module
let cynicJudge = null;
let residualDetector = null;
let cynicStore = null;
let saveCynicStateDebounced = null;

// Injection function for main module to provide instances
function setCynicInstances(instances) {
  cynicJudge = instances.cynicJudge;
  residualDetector = instances.residualDetector;
  cynicStore = instances.cynicStore;
  saveCynicStateDebounced = instances.saveCynicStateDebounced;
}

async function handleCynicJudge(args, adapter) {
  const { item, mode = 'standard', context = {} } = args;

  if (!item || typeof item !== 'object') {
    return { success: false, error: 'Item must be an object', _quality: 0 };
  }

  if (!cynicJudge) {
    return { success: false, error: 'CYNIC not initialized', _quality: 0 };
  }

  const startTime = Date.now();
  let result;

  const judgeContext = {
    singularityDistance: 0.4,
    ...context,
  };

  try {
    switch (mode) {
      case 'quick':
        result = await cynicJudge.judge(item, judgeContext);
        result._mode = 'quick';
        break;

      case 'standard':
        result = await cynicJudge.judgeWithScaling(item, judgeContext, {
          n: FIBONACCI_N.STANDARD,
          diversity: DIVERSITY.MEDIUM,
        });
        result._mode = 'standard';
        break;

      case 'thorough':
        result = await cynicJudge.judgeWithRefinement(item, judgeContext, {
          maxIterations: REFINEMENT.MAX_ITERATIONS,
          autoTransform: true,
          useScaling: true,
        });
        result._mode = 'thorough';
        break;

      case 'full':
        result = await cynicJudge.judgeWithRefinement(item, judgeContext, {
          maxIterations: REFINEMENT.MAX_ITERATIONS,
          autoTransform: true,
          useScaling: true,
        });
        result._mode = 'full';
        break;

      default:
        result = await cynicJudge.judge(item, judgeContext);
        result._mode = 'default';
    }

    // Trigger debounced save after each judgment
    if (saveCynicStateDebounced) {
      saveCynicStateDebounced();
    }

    // Persist to PostgreSQL store if available
    if (cynicStore) {
      cynicStore.saveJudgment({
        item_hash: result._judgmentId?.split('_')[2] || crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex').slice(0, 16),
        item_type: typeof item === 'string' ? 'code' : 'object',
        scores: result.scores,
        global: result.global,
        verdict: result.verdict?.action || 'UNKNOWN',
        confidence: result.confidence,
        mode: result._mode,
        cynic_says: null,
      }).catch(err => console.error('[CYNIC-STORE] Save failed:', err.message));
    }

    // κυνικός speaks
    const confidence01 = (result.confidence || 61.8) / 100;
    const voice = getCynicVoice(result.verdict?.action || 'ACCEPT', confidence01);

    return {
      success: true,
      judgment_id: result._judgmentId,
      global: result.global,
      verdict: result.verdict,
      confidence: result.confidence,
      rawConfidence: result.rawConfidence,
      doubt: result.doubt,
      scores: result.scores,
      mode: result._mode,
      scaling: result._scaling || null,
      refinement: result._refinement || null,
      transformed_item: result.item || null,
      duration_ms: Date.now() - startTime,
      _kynikos: {
        bark: voice.bark,
        mood: voice.mood,
        axiom: voice.axiom,
        greek: CYNIC_IDENTITY.greek,
        meaning: CYNIC_IDENTITY.meaning,
      },
      philosophy: 'φ qui se méfie de φ - Rendre autonome, pas automatiser',
      _quality: result.global,
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      _quality: 0,
    };
  }
}

async function handleCynicFeedback(args, adapter) {
  const { judgment_id, outcome, feedback = {} } = args;

  if (!judgment_id) {
    return { success: false, error: 'judgment_id is required', _quality: 0 };
  }

  if (!cynicJudge) {
    return { success: false, error: 'CYNIC not initialized', _quality: 0 };
  }

  const outcomeMap = {
    'correct': LEARNING.OUTCOMES.CORRECT,
    'incorrect': LEARNING.OUTCOMES.INCORRECT,
    'partial': LEARNING.OUTCOMES.PARTIAL,
  };

  const mappedOutcome = outcomeMap[outcome];
  if (!mappedOutcome) {
    return {
      success: false,
      error: `Invalid outcome: ${outcome}. Must be: correct, incorrect, partial`,
      _quality: 0,
    };
  }

  const result = cynicJudge.recordOutcome(judgment_id, mappedOutcome, feedback);

  if (result.error) {
    return {
      success: false,
      error: result.error,
      judgment_id,
      _quality: 0,
    };
  }

  if (saveCynicStateDebounced) {
    saveCynicStateDebounced();
  }

  return {
    success: true,
    judgment_id,
    outcome,
    reward: result.reward,
    learned: result.learned,
    adjustments: result.adjustments || {},
    message: result.learned
      ? `Feedback recorded and learning triggered. Reward: ${result.reward.toFixed(3)}`
      : `Feedback recorded. Reward: ${result.reward.toFixed(3)}`,
    philosophy: 'φ-weighted reinforcement learning from human feedback',
    _quality: 85,
  };
}

async function handleCynicStats(args, adapter) {
  if (!cynicJudge) {
    return { success: false, error: 'CYNIC not initialized', _quality: 0 };
  }

  const stats = cynicJudge.getLearningStats();

  return {
    success: true,
    ...stats,
    message: `CYNIC has made ${stats.totalJudgments} judgments with ${stats.accuracy}% accuracy`,
    philosophy: 'φ qui se méfie de φ',
    _quality: 90,
  };
}

async function handleCynicLearn(args, adapter) {
  if (!cynicJudge) {
    return { success: false, error: 'CYNIC not initialized', _quality: 0 };
  }

  const result = cynicJudge.learn();

  if (!result.learned) {
    return {
      success: false,
      reason: result.reason,
      message: 'Learning not triggered: ' + result.reason,
      _quality: 50,
    };
  }

  return {
    success: true,
    iteration: result.iteration,
    accuracy: result.accuracy,
    learning_rate: result.learningRate,
    adjustments: result.adjustments,
    message: `Learning iteration ${result.iteration} complete. Accuracy: ${result.accuracy}%`,
    philosophy: result.philosophy,
    _quality: 90,
  };
}

// Residual Detection Handlers

async function handleCynicResidual(args, adapter) {
  const { judgment, observation, context = {} } = args;

  if (!judgment || !observation) {
    return {
      success: false,
      error: 'Both judgment and observation are required',
      _quality: 0,
    };
  }

  if (!residualDetector) {
    return { success: false, error: 'ResidualDetector not initialized', _quality: 0 };
  }

  try {
    const result = residualDetector.analyze(judgment, observation, context);

    return {
      success: true,
      residual: result.residual,
      is_anomaly: result.is_anomaly,
      magnitude: result.magnitude,
      explained: result.explained,
      dimensions_involved: result.dimensions_involved,
      buffer_size: result.buffer_size,
      ready_to_cluster: result.ready_to_cluster,
      message: result.is_anomaly
        ? `Anomaly detected! Residual: ${(result.residual * 100).toFixed(1)}% unexplained`
        : `Normal observation. Residual: ${(result.residual * 100).toFixed(1)}%`,
      philosophy: 'What we cannot explain, we must discover',
      _quality: 75,
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      _quality: 0,
    };
  }
}

async function handleCynicDiscoverDimensions(args, adapter) {
  if (!residualDetector) {
    return { success: false, error: 'ResidualDetector not initialized', _quality: 0 };
  }

  try {
    const result = residualDetector.discoverDimensions();

    if (!result.candidates || result.candidates.length === 0) {
      return {
        success: true,
        candidates: [],
        buffer_size: result.buffer_size,
        message: result.message || 'No new dimensions discovered yet',
        philosophy: 'Patience - dimensions reveal themselves in φ-time',
        _quality: 60,
      };
    }

    return {
      success: true,
      candidates: result.candidates.map(c => ({
        id: c.id,
        name: c.name,
        confidence: c.confidence,
        pattern_count: c.pattern_count,
        common_sources: c.common_sources,
        suggested_axiom: c.suggested_axiom,
        suggested_threshold: c.suggested_threshold,
      })),
      buffer_size: result.buffer_size,
      message: `Discovered ${result.candidates.length} potential new dimension(s)`,
      philosophy: 'From residuals emerge dimensions - φ guides discovery',
      _quality: 85,
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      _quality: 0,
    };
  }
}

async function handleCynicAcceptDimension(args, adapter) {
  const { candidate, name, definition, axiom, threshold } = args;

  if (!candidate || !name || !definition || !axiom) {
    return {
      success: false,
      error: 'Required: candidate (id), name, definition, axiom',
      _quality: 0,
    };
  }

  if (!residualDetector) {
    return { success: false, error: 'ResidualDetector not initialized', _quality: 0 };
  }

  try {
    const validation = {
      name,
      definition,
      axiom,
      threshold: threshold || 0.618,
    };

    const result = residualDetector.acceptDimension(candidate, validation);

    if (!result.accepted) {
      return {
        success: false,
        error: result.error || 'Dimension not accepted',
        _quality: 30,
      };
    }

    // Import handleLearn to record the new dimension
    const { handleLearn } = require('./learn-handlers');

    const knowledgeEntry = {
      type: 'insight',
      content: `NEW DIMENSION ACCEPTED: ${name}\n\nDefinition: ${definition}\nAxiom: ${axiom}\nThreshold: ${validation.threshold}\n\nOrigin: Discovered from ${result.pattern_count} anomalous observations via ResidualDetector.`,
      context: 'CYNIC ResidualDetector - Dimension Discovery',
      tags: ['cynic', 'dimension', 'discovery', 'residual', axiom.toLowerCase()],
    };

    await handleLearn(knowledgeEntry, adapter);

    return {
      success: true,
      accepted: true,
      dimension: {
        name,
        definition,
        axiom,
        threshold: validation.threshold,
        origin: 'residual_detection',
        pattern_count: result.pattern_count,
      },
      message: `Dimension "${name}" accepted and integrated into CYNIC`,
      philosophy: 'From the unnamed emerges the named - φ completes the circle',
      _quality: 95,
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      _quality: 0,
    };
  }
}

// =============================================================================
// CYNIC-DIGEST - Chaos → Harmonie (MEMORY, TEACHING, INTENT)
// =============================================================================

const digest = require('../cynic/digest');

async function handleCynicDigest(args, adapter) {
  const { text, source = 'conversation', existingKnowledge = [] } = args;

  if (!text || typeof text !== 'string') {
    return { success: false, error: 'Text must be a non-empty string', _quality: 0 };
  }

  try {
    const result = digest.digest(text, { source, existingKnowledge });

    // Auto-learn high-confidence ideas (only if adapter available)
    const highConfidenceIdeas = result.ideas.filter(i => i.confidence >= 50);
    let learned = 0;

    if (adapter) {
      const { handleLearn } = require('./learn-handlers');
      for (const idea of highConfidenceIdeas.slice(0, 5)) { // Max 5 ideas
        try {
          await handleLearn({
            type: idea.type === 'problem' ? 'insight' : idea.type === 'goal' ? 'decision' : 'pattern',
            content: idea.content,
            context: `CYNIC-DIGEST: Extracted from ${source}`,
            tags: ['digest', idea.type, source],
          }, adapter);
          learned++;
        } catch (learnErr) {
          // Continue even if learning fails
          console.warn('[CYNIC-DIGEST] Failed to learn idea:', learnErr.message);
        }
      }
    }

    return {
      success: true,
      ...result,
      learned,
      learnable: highConfidenceIdeas.length,
      message: `Digested ${result.ideas.length} ideas, ${result.links.length} links, roadmap ready`,
      _kynikos: {
        bark: result.scores.global >= 50 ? '🐕 *wag* Good chaos!' : '🐕 *sniff* Need more chaos.',
        mood: result.scores.global >= 50 ? 'approve' : 'doubt',
        axiom: 'Culture is a moat',
      },
      _quality: result.scores.global,
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      _quality: 0,
    };
  }
}

async function handleCynicResidualStats(args, adapter) {
  if (!residualDetector) {
    return { success: false, error: 'ResidualDetector not initialized', _quality: 0 };
  }

  try {
    const stats = residualDetector.getStats();
    const bufferStats = stats.bufferStats || {};
    const phi = stats._phi || {};

    // Calculate anomaly rate
    const anomalyRate = stats.observationsProcessed > 0
      ? (stats.anomaliesDetected / stats.observationsProcessed * 100).toFixed(1)
      : 0;

    return {
      success: true,
      buffer: {
        size: bufferStats.count || 0,
        weighted_count: bufferStats.weightedCount || 0,
        oldest_age_days: bufferStats.oldestAge || 0,
        ready_to_cluster: bufferStats.shouldCluster || false,
      },
      observations_processed: stats.observationsProcessed || 0,
      anomalies_detected: stats.anomaliesDetected || 0,
      anomaly_rate: `${anomalyRate}%`,
      clusters_formed: stats.clustersFormed || 0,
      dimensions_proposed: stats.dimensionsProposed || 0,
      dimensions_accepted: stats.dimensionsAccepted || 0,
      discovered_dimensions: stats.discoveredDimensions || 0,
      proposal_history: stats.proposalHistory || 0,
      constants: {
        anomaly_threshold: phi.anomalyThreshold || 0.382,
        cluster_min_count: phi.clusterThreshold || 3,
        max_confidence: phi.maxConfidence || 0.618,
      },
      message: `ResidualDetector: ${bufferStats.count || 0} anomalies buffered, ${stats.dimensionsProposed || 0} dimensions proposed`,
      philosophy: 'φ⁻² = 38.2% - the threshold of the unexplained',
      _quality: 80,
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      _quality: 0,
    };
  }
}

module.exports = {
  // Core CYNIC handlers
  handleCynicJudge,
  handleCynicFeedback,
  handleCynicStats,
  handleCynicLearn,
  // Residual detection handlers
  handleCynicResidual,
  handleCynicDiscoverDimensions,
  handleCynicAcceptDimension,
  handleCynicResidualStats,
  // Digest handler (MEMORY, TEACHING, INTENT)
  handleCynicDigest,
  // Instance injection
  setCynicInstances,
  // Re-export constants for convenience
  LEARNING,
  FIBONACCI_N,
  DIVERSITY,
  REFINEMENT,
};
