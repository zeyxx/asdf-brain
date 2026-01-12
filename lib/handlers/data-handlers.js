/**
 * Data Handlers - brain_health, brain_patterns, brain_intent,
 *                 brain_ecosystem, brain_dependencies, brain_vision
 *
 * [P] Pshat & [R] Remez - Data access and pattern recognition
 */

'use strict';

const { path, temporal, KNOWLEDGE_PATH } = require('./_shared');
const infraMonitor = require('../i-infra-monitor');
const burnMechanism = require('../burn-mechanism');
const pollination = require('../pollination');

async function handleHealth(args, adapter) {
  const health = await adapter.load('health/ecosystem-health.json');
  if (!health) return { status: 'unknown', message: 'Health data not available' };

  // Get infrastructure health status (Yesod - foundation)
  let infraHealth = null;
  try {
    infraHealth = infraMonitor.getHealthStatus();
  } catch (e) {
    // infra monitoring not initialized - that's OK
  }

  // Get burn statistics
  let burnStats = null;
  try {
    burnStats = burnMechanism.getBurnStats();
  } catch (e) {
    // burn tracking not initialized - that's OK
  }

  return {
    overall_score: health.overall?.score || health.overall_score,
    status: health.overall?.status || health.status,
    indicators: health.indicators,
    recommendations: health.recommendations?.slice(0, 3),
    // Yesod - Infrastructure foundation health
    infrastructure: infraHealth ? {
      aggregate_score: infraHealth.aggregate?.i_infra_weighted,
      status: infraHealth.aggregate?.status,
      tokens_monitored: Object.keys(infraHealth.tokens || {}),
    } : { status: 'not_initialized', message: 'Run: npm run brain:infra-check' },
    // Contribution tracking stats
    contributions: burnStats ? {
      total_tracked: burnStats.total_operations || 0,
      total_value: burnStats.total_burned || 0,
      philosophy: 'Knowledge is FREE. Contributions are VALUED.',
    } : null,
    _quality: health.overall?.score || 80,
  };
}

async function handlePatterns(args, adapter) {
  const patterns = await adapter.load('patterns/extracted-patterns.json');
  if (!patterns) return { message: 'Pattern data not available' };

  const { category, apply_temporal = false, find_similar } = args;

  // If apply_temporal, run decay/strengthen on patterns
  if (apply_temporal) {
    try {
      temporal.processPatternDecay(path.join(KNOWLEDGE_PATH, 'patterns'));
    } catch (e) {
      // Silent - temporal processing is optional
    }
  }

  // If find_similar query provided, use pollination
  if (find_similar && patterns.all_patterns) {
    const similarPatterns = pollination.findSimilarPatterns(
      { content: find_similar },
      patterns.all_patterns || []
    );
    return {
      query: find_similar,
      similar_patterns: similarPatterns.slice(0, 5),
      count: similarPatterns.length,
      message: `Found ${similarPatterns.length} similar patterns (φ⁻¹ = 61.8% threshold)`,
      _quality: 85,
    };
  }

  if (category && patterns.statistics?.by_category?.[category]) {
    const categoryData = patterns.statistics.by_category[category];
    return {
      category,
      total_occurrences: categoryData.total_occurrences,
      unique_patterns: categoryData.unique_patterns,
      count: categoryData.top_patterns?.length || 0,
      samples: categoryData.top_patterns?.slice(0, 5) || [],
      _quality: 85,
    };
  }

  return {
    total: patterns.statistics?.total_conversations,
    with_patterns: patterns.statistics?.with_patterns,
    pattern_rate: patterns.statistics?.pattern_rate,
    categories: Object.keys(patterns.statistics?.by_category || {}),
    _quality: 85,
  };
}

async function handleIntent(args, adapter) {
  const intents = await adapter.load('intent/extracted-intents.json');
  if (!intents) return { message: 'Intent data not available' };

  const { category } = args;
  if (category && intents.by_category?.[category]) {
    return {
      category,
      count: intents.by_category[category].length,
      samples: intents.by_category[category].slice(0, 5),
      _quality: 80,
    };
  }

  return {
    total: intents.metadata?.with_intent,
    rate: intents.metadata?.intent_rate,
    categories: Object.keys(intents.by_category || {}),
    _quality: 80,
  };
}

async function handleEcosystem(args, adapter) {
  const ecosystem = await adapter.load('relations/ecosystem-graph.json');
  if (!ecosystem) return { message: 'Ecosystem data not available' };

  return {
    nodes: ecosystem.nodes,
    edges: ecosystem.edges,
    phi_weights: ecosystem.phi_weights,
    _quality: 95,
  };
}

async function handleDependencies(args, adapter) {
  const deps = await adapter.load('dependencies/dependency-graph.json');
  if (!deps) return { message: 'Dependency data not available' };

  return {
    shared: Object.keys(deps.shared_dependencies || {}).length,
    mismatches: deps.version_mismatches?.length || 0,
    critical: deps.critical_dependencies,
    _quality: 90,
  };
}

async function handleVision(args, adapter) {
  const vision = await adapter.load('vision/roadmap.json');
  if (!vision) return { message: 'Vision data not available' };

  return {
    total: vision.statistics?.with_vision,
    rate: vision.statistics?.vision_rate,
    categories: Object.keys(vision.by_category || {}),
    _quality: 60, // Lower - vision is speculative
  };
}

module.exports = {
  handleHealth,
  handlePatterns,
  handleIntent,
  handleEcosystem,
  handleDependencies,
  handleVision,
};
