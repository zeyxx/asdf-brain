/**
 * Integration Layer - Unified API
 *
 * "Everything connects through φ."
 *
 * Provides unified access to all external integrations:
 * - HolDex: K-Score, token health, integrity
 * - GASdf: Burns, swaps, fees
 * - Claude-Mem: Session and observation sync
 *
 * All data flows through CYNIC before storage.
 */

'use strict';

const holdex = require('./holdex-connector');
const gasdf = require('./gasdf-connector');
const claudeMem = require('./claude-mem-connector');

// =============================================================================
// PHI CONSTANTS - Import from Single Source of Truth (FIXED 2026-01-13)
// =============================================================================

const { PHI, PHI_INV } = require('../cynic/axioms/constants');

// =============================================================================
// UNIFIED WEBHOOK HANDLER
// =============================================================================

/**
 * Handle webhook from any source
 * Auto-detects source or uses provided source
 */
async function handleWebhook(event, options = {}) {
  const { source = null, cynicInstance = null } = options;

  // Auto-detect source if not provided
  let detectedSource = source;
  if (!detectedSource) {
    if (event.kscore || event.new_score !== undefined || event.token_health) {
      detectedSource = 'holdex';
    } else if (event.burn || event.swap || event.type === 'burn') {
      detectedSource = 'gasdf';
    } else if (event.type && holdex.CONFIG.eventTypes.includes(event.type)) {
      detectedSource = 'holdex';
    } else if (event.type && gasdf.CONFIG.eventTypes.includes(event.type)) {
      detectedSource = 'gasdf';
    }
  }

  if (!detectedSource) {
    return {
      success: false,
      error: 'unknown_source',
      message: 'Could not detect event source. Provide source parameter or use known event type.',
      known_sources: ['holdex', 'gasdf'],
    };
  }

  // Route to appropriate handler
  switch (detectedSource) {
    case 'holdex':
      return holdex.handleWebhook(event, { cynicInstance });
    case 'gasdf':
      return gasdf.handleWebhook(event, { cynicInstance });
    default:
      return {
        success: false,
        error: 'unsupported_source',
        message: `Source '${detectedSource}' not supported`,
      };
  }
}

// =============================================================================
// UNIFIED STATUS
// =============================================================================

/**
 * Get status of all integrations
 */
function getStatus() {
  return {
    holdex: holdex.getStatus(),
    gasdf: gasdf.getStatus(),
    claudeMem: claudeMem.getStatus(),
    unified: {
      sources: ['holdex', 'gasdf', 'claude-mem'],
      philosophy: "Everything connects through φ.",
      health: calculateHealth(),
    },
  };
}

/**
 * Calculate overall integration health
 */
function calculateHealth() {
  const holdexStatus = holdex.getStatus();
  const gasdfStatus = gasdf.getStatus();
  const claudeMemStatus = claudeMem.getStatus();

  const metrics = [];

  // HolDex health
  if (holdexStatus.stats) {
    const h = holdexStatus.stats;
    metrics.push({
      source: 'holdex',
      events: h.total_events || 0,
      active: h.total_events > 0,
    });
  } else {
    metrics.push({ source: 'holdex', events: 0, active: false });
  }

  // GASdf health
  if (gasdfStatus.stats) {
    const g = gasdfStatus.stats;
    metrics.push({
      source: 'gasdf',
      events: g.total_events || 0,
      burned: g.total_burned || 0,
      active: g.total_events > 0,
    });
  } else {
    metrics.push({ source: 'gasdf', events: 0, active: false });
  }

  // Claude-Mem health
  const cmSynced = claudeMemStatus.sync_state?.total_synced || 0;
  const cmConnected = claudeMemStatus.connected;
  metrics.push({
    source: 'claude-mem',
    events: cmSynced,
    active: cmConnected && cmSynced > 0,
    connected: cmConnected,
  });

  const totalEvents = metrics.reduce((sum, m) => sum + m.events, 0);
  const activeSources = metrics.filter(m => m.active).length;
  const totalSources = 3;

  return {
    total_events: totalEvents,
    active_sources: activeSources,
    total_sources: totalSources,
    health_score: Math.round((activeSources / totalSources) * 100 * PHI_INV), // max 61.8
    status: activeSources === totalSources ? 'healthy' :
            activeSources >= 2 ? 'good' :
            activeSources === 1 ? 'partial' :
            'inactive',
    by_source: metrics,
  };
}

// =============================================================================
// UNIFIED EVENTS
// =============================================================================

/**
 * Load events from all sources
 */
function loadAllEvents(options = {}) {
  const { limit = 100, since = null, sources = ['holdex', 'gasdf', 'claude-mem'] } = options;

  const events = [];

  if (sources.includes('holdex')) {
    const holdexEvents = holdex.loadEvents({ limit, since });
    events.push(...holdexEvents.map(e => ({ ...e, _source: 'holdex' })));
  }

  if (sources.includes('gasdf')) {
    const gasdfEvents = gasdf.loadEvents({ limit, since });
    events.push(...gasdfEvents.map(e => ({ ...e, _source: 'gasdf' })));
  }

  if (sources.includes('claude-mem')) {
    const claudeMemEvents = claudeMem.loadSyncedEvents({ limit, since });
    events.push(...claudeMemEvents.map(e => ({ ...e, _source: 'claude-mem' })));
  }

  // Sort by timestamp descending
  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Apply limit to combined result
  return events.slice(0, limit);
}

// =============================================================================
// CLAUDE-MEM SYNC
// =============================================================================

/**
 * Sync with claude-mem database
 */
async function syncClaudeMem(options = {}) {
  return claudeMem.sync(options);
}

/**
 * Search claude-mem synced events
 */
function searchClaudeMem(query, options = {}) {
  return claudeMem.searchSyncedEvents(query, options);
}

// =============================================================================
// UNIFIED PATTERNS
// =============================================================================

/**
 * Analyze patterns across all sources
 */
function analyzeAllPatterns(options = {}) {
  const holdexPatterns = holdex.analyzePatterns(options);
  const gasdfPatterns = gasdf.analyzePatterns(options);

  // Cross-source correlations
  const correlations = [];

  // Check for K-Score to burn correlations
  if (holdexPatterns.success && gasdfPatterns.success) {
    const kscoreChanges = holdexPatterns.patterns?.kscoreChanges || {};
    const burns = gasdfPatterns.patterns?.burns || {};

    if (kscoreChanges.count > 0 && burns.count > 0) {
      const ratio = burns.count / kscoreChanges.count;
      correlations.push({
        type: 'kscore_burn_correlation',
        ratio: Math.round(ratio * 1000) / 1000,
        phi_aligned: Math.abs(ratio - PHI_INV) < 0.2,
        interpretation: ratio > 1
          ? 'More burns than K-Score changes (active burning)'
          : 'More K-Score changes than burns (market activity)',
      });
    }
  }

  return {
    holdex: holdexPatterns,
    gasdf: gasdfPatterns,
    correlations,
    unified: {
      analyzed_at: new Date().toISOString(),
      philosophy: "Patterns emerge from chaos. φ reveals them.",
    },
  };
}

// =============================================================================
// BURN AGGREGATION
// =============================================================================

/**
 * Get aggregated burn statistics
 */
function getBurnStats(options = {}) {
  const gasdfBurns = gasdf.getBurnStats(options);

  return {
    source: 'gasdf',
    ...gasdfBurns,
    philosophy: "Don't extract, burn.",
  };
}

// =============================================================================
// SIMULATION / TESTING
// =============================================================================

/**
 * Simulate events for testing
 */
async function simulateEvents(options = {}) {
  const { count = 5, source = 'both', cynicInstance = null } = options;

  const results = [];

  if (source === 'holdex' || source === 'both') {
    for (let i = 0; i < Math.ceil(count / 2); i++) {
      const event = {
        type: 'kscore_update',
        token: `simulated_token_${i}`,
        symbol: `SIM${i}`,
        old_score: Math.round(Math.random() * 50 + 25),
        new_score: Math.round(Math.random() * 50 + 30),
        reason: 'simulation',
        timestamp: new Date().toISOString(),
      };
      const result = await holdex.handleWebhook(event, { cynicInstance });
      results.push({ source: 'holdex', ...result });
    }
  }

  if (source === 'gasdf' || source === 'both') {
    for (let i = 0; i < Math.ceil(count / 2); i++) {
      const event = {
        type: 'burn',
        amount: Math.round(Math.random() * 10000 + 100),
        wallet: `simulated_wallet_${i}`,
        timestamp: new Date().toISOString(),
      };
      const result = await gasdf.handleWebhook(event, { cynicInstance });
      results.push({ source: 'gasdf', ...result });
    }
  }

  return {
    success: true,
    simulated: results.length,
    results,
    message: `Simulated ${results.length} events`,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Unified API
  handleWebhook,
  getStatus,
  loadAllEvents,
  analyzeAllPatterns,
  getBurnStats,
  simulateEvents,

  // Claude-Mem sync
  syncClaudeMem,
  searchClaudeMem,

  // Direct access to connectors
  holdex,
  gasdf,
  claudeMem,

  // Constants
  SOURCES: ['holdex', 'gasdf', 'claude-mem'],
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== Integration Layer CLI ===\n');

  console.log('--- Status ---');
  const status = getStatus();
  console.log('HolDex events:', status.holdex.stats?.total_events || 0);
  console.log('GASdf events:', status.gasdf.stats?.total_events || 0);
  console.log('GASdf total burned:', status.gasdf.stats?.total_burned || 0);
  console.log('Claude-Mem connected:', status.claudeMem.connected);
  console.log('Claude-Mem synced:', status.claudeMem.sync_state?.total_synced || 0);
  console.log('Health:', status.unified.health.status, `(${status.unified.health.health_score}%)`);

  console.log('\n--- Claude-Mem Sync ---');
  syncClaudeMem({ force: true }).then(syncResult => {
    console.log('Sync success:', syncResult.success);
    console.log('Synced items:', syncResult.synced || 0);
    if (syncResult.items) {
      syncResult.items.slice(0, 5).forEach(item => {
        console.log(`  [${item.type}] ${item.project}`);
      });
    }

    console.log('\n--- Updated Status ---');
    const newStatus = getStatus();
    console.log('Active sources:', newStatus.unified.health.active_sources, '/', newStatus.unified.health.total_sources);
    console.log('Health score:', newStatus.unified.health.health_score);
    console.log('Status:', newStatus.unified.health.status);

    console.log('\nDone.');
  }).catch(console.error);
}
