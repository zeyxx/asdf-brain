/**
 * HolDex Integration Connector
 *
 * "K-Score is not a number. It's a judgment."
 *
 * Handles webhooks from HolDex:
 * - K-Score updates
 * - Token health changes
 * - Integrity alerts
 *
 * All data is judged by CYNIC before storage.
 * PII is hashed. Nothing raw survives.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const privacy = require('../privacy');

// =============================================================================
// PHI CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;     // 0.618
const PHI_INV_2 = PHI_INV * PHI_INV; // 0.382

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Event types we accept from HolDex
  eventTypes: [
    'kscore_update',      // K-Score changed
    'token_listed',       // New token listed
    'token_delisted',     // Token removed
    'integrity_alert',    // Suspicious activity
    'holder_change',      // Significant holder movement
    'liquidity_event',    // LP add/remove
  ],

  // Limits (φ-based)
  limits: {
    eventsPerMinute: Math.round(100 * PHI_INV),     // ~62 events/min
    eventsPerHour: Math.round(1000 * PHI),          // ~1618 events/hour
    maxPayloadSize: Math.round(10000 * PHI_INV_2),  // ~3820 bytes
  },

  // Storage
  storageDir: path.join(__dirname, '../../knowledge/integrations/holdex'),
  ledgerFile: 'events.jsonl',
  statsFile: 'stats.json',
  patternsFile: 'patterns.json',
};

// Ensure storage directory exists
if (!fs.existsSync(CONFIG.storageDir)) {
  fs.mkdirSync(CONFIG.storageDir, { recursive: true });
}

// =============================================================================
// RATE LIMITING
// =============================================================================

const rateLimiter = {
  events: [],

  canAccept() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old events
    this.events = this.events.filter(ts => ts > oneMinuteAgo);

    return this.events.length < CONFIG.limits.eventsPerMinute;
  },

  record() {
    this.events.push(Date.now());
  },

  getStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    const lastMinute = this.events.filter(ts => ts > oneMinuteAgo).length;
    const lastHour = this.events.filter(ts => ts > oneHourAgo).length;

    return {
      lastMinute,
      lastHour,
      limitMinute: CONFIG.limits.eventsPerMinute,
      limitHour: CONFIG.limits.eventsPerHour,
      utilizationMinute: Math.round((lastMinute / CONFIG.limits.eventsPerMinute) * 100),
      utilizationHour: Math.round((lastHour / CONFIG.limits.eventsPerHour) * 100),
    };
  },
};

// =============================================================================
// EVENT VALIDATION
// =============================================================================

/**
 * Validate incoming HolDex event
 */
function validateEvent(event) {
  const errors = [];

  // Required fields
  if (!event.type) {
    errors.push('Missing required field: type');
  } else if (!CONFIG.eventTypes.includes(event.type)) {
    errors.push(`Unknown event type: ${event.type}. Valid: ${CONFIG.eventTypes.join(', ')}`);
  }

  if (!event.timestamp) {
    errors.push('Missing required field: timestamp');
  }

  // Type-specific validation
  if (event.type === 'kscore_update') {
    if (event.new_score === undefined || event.new_score === null) {
      errors.push('kscore_update requires new_score');
    }
    if (event.new_score < 0 || event.new_score > 100) {
      errors.push('new_score must be between 0 and 100');
    }
  }

  if (event.type === 'token_listed' || event.type === 'token_delisted') {
    if (!event.token && !event.mint) {
      errors.push(`${event.type} requires token or mint address`);
    }
  }

  if (event.type === 'integrity_alert') {
    if (!event.alert_type) {
      errors.push('integrity_alert requires alert_type');
    }
    if (!event.severity) {
      errors.push('integrity_alert requires severity (low, medium, high, critical)');
    }
  }

  // Size check
  const size = JSON.stringify(event).length;
  if (size > CONFIG.limits.maxPayloadSize) {
    errors.push(`Payload too large: ${size} bytes (max: ${CONFIG.limits.maxPayloadSize})`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// EVENT TRANSFORMATION
// =============================================================================

/**
 * Transform HolDex event for CYNIC ingestion
 * - Hash sensitive fields
 * - Normalize structure
 * - Add metadata
 */
function transformEvent(event, source = 'webhook') {
  // Hash sensitive fields
  const transformed = {
    // Core identity
    id: crypto.randomUUID(),
    source: 'holdex',
    source_type: source,

    // Event data
    type: event.type,
    timestamp: event.timestamp || new Date().toISOString(),
    received_at: new Date().toISOString(),

    // Token info (mint address is public, but we hash for consistency)
    token_hash: event.token || event.mint
      ? privacy.hashForLookup(event.token || event.mint, 'holdex:token')
      : null,
    token_symbol: event.symbol || null, // Symbols are public

    // K-Score data (public metrics)
    kscore: event.type === 'kscore_update' ? {
      old: event.old_score,
      new: event.new_score,
      delta: event.new_score - (event.old_score || 0),
      reason: event.reason || 'unknown',
    } : null,

    // Integrity alerts (public)
    alert: event.type === 'integrity_alert' ? {
      type: event.alert_type,
      severity: event.severity,
      description: event.description || null,
    } : null,

    // Holder info (hashed)
    holder_hash: event.holder || event.wallet
      ? privacy.hashForLookup(event.holder || event.wallet, 'holdex:holder')
      : null,

    // Amounts (public but normalized)
    amount: event.amount || null,

    // Metadata
    meta: {
      original_fields: Object.keys(event).length,
      phi_timestamp: Date.now() * PHI_INV, // φ-normalized timestamp
    },
  };

  // Remove null fields
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === null) {
      delete transformed[key];
    }
  });

  return transformed;
}

// =============================================================================
// PATTERN EXTRACTION
// =============================================================================

/**
 * Extract patterns from HolDex events
 */
function extractPatterns(events) {
  const patterns = {
    kscoreChanges: {
      increases: 0,
      decreases: 0,
      avgDelta: 0,
      largestIncrease: 0,
      largestDecrease: 0,
    },
    alerts: {
      total: 0,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: {},
    },
    activity: {
      tokensTracked: new Set(),
      eventsPerHour: {},
    },
  };

  let totalDelta = 0;
  let deltaCount = 0;

  events.forEach(event => {
    // K-Score patterns
    if (event.kscore) {
      if (event.kscore.delta > 0) {
        patterns.kscoreChanges.increases++;
        patterns.kscoreChanges.largestIncrease = Math.max(
          patterns.kscoreChanges.largestIncrease,
          event.kscore.delta
        );
      } else if (event.kscore.delta < 0) {
        patterns.kscoreChanges.decreases++;
        patterns.kscoreChanges.largestDecrease = Math.min(
          patterns.kscoreChanges.largestDecrease,
          event.kscore.delta
        );
      }
      totalDelta += event.kscore.delta;
      deltaCount++;
    }

    // Alert patterns
    if (event.alert) {
      patterns.alerts.total++;
      if (event.alert.severity) {
        patterns.alerts.bySeverity[event.alert.severity] =
          (patterns.alerts.bySeverity[event.alert.severity] || 0) + 1;
      }
      if (event.alert.type) {
        patterns.alerts.byType[event.alert.type] =
          (patterns.alerts.byType[event.alert.type] || 0) + 1;
      }
    }

    // Track tokens
    if (event.token_hash) {
      patterns.activity.tokensTracked.add(event.token_hash);
    }

    // Activity by hour
    const hour = new Date(event.timestamp).toISOString().slice(0, 13);
    patterns.activity.eventsPerHour[hour] =
      (patterns.activity.eventsPerHour[hour] || 0) + 1;
  });

  // Finalize
  if (deltaCount > 0) {
    patterns.kscoreChanges.avgDelta = Math.round((totalDelta / deltaCount) * 100) / 100;
  }
  patterns.activity.tokensTracked = patterns.activity.tokensTracked.size;

  return patterns;
}

// =============================================================================
// STORAGE
// =============================================================================

/**
 * Append event to ledger
 */
function appendToLedger(event) {
  const ledgerPath = path.join(CONFIG.storageDir, CONFIG.ledgerFile);
  const line = JSON.stringify(event) + '\n';
  fs.appendFileSync(ledgerPath, line, 'utf-8');
}

/**
 * Load events from ledger
 */
function loadEvents(options = {}) {
  const { limit = 100, since = null, type = null } = options;
  const ledgerPath = path.join(CONFIG.storageDir, CONFIG.ledgerFile);

  if (!fs.existsSync(ledgerPath)) {
    return [];
  }

  const lines = fs.readFileSync(ledgerPath, 'utf-8').split('\n').filter(Boolean);
  let events = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Filter by time
  if (since) {
    const sinceTs = new Date(since).getTime();
    events = events.filter(e => new Date(e.timestamp).getTime() > sinceTs);
  }

  // Filter by type
  if (type) {
    events = events.filter(e => e.type === type);
  }

  // Limit and return most recent
  return events.slice(-limit);
}

/**
 * Update stats
 */
function updateStats(event) {
  const statsPath = path.join(CONFIG.storageDir, CONFIG.statsFile);

  let stats = {
    total_events: 0,
    by_type: {},
    by_day: {},
    first_event: null,
    last_event: null,
    phi_metrics: {},
  };

  if (fs.existsSync(statsPath)) {
    try {
      stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    } catch {}
  }

  // Update
  stats.total_events++;
  stats.by_type[event.type] = (stats.by_type[event.type] || 0) + 1;

  const day = event.timestamp.slice(0, 10);
  stats.by_day[day] = (stats.by_day[day] || 0) + 1;

  if (!stats.first_event) {
    stats.first_event = event.timestamp;
  }
  stats.last_event = event.timestamp;
  stats.last_event_time = event.timestamp; // Alias for health check compatibility

  // φ metrics
  stats.phi_metrics = {
    avg_events_per_day: Math.round(stats.total_events / Object.keys(stats.by_day).length * PHI_INV * 100) / 100,
    type_distribution_phi: Object.values(stats.by_type).reduce((a, b) => a * Math.pow(b, PHI_INV), 1),
  };

  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
  return stats;
}

/**
 * Save patterns
 */
function savePatterns(patterns) {
  const patternsPath = path.join(CONFIG.storageDir, CONFIG.patternsFile);
  const existing = fs.existsSync(patternsPath)
    ? JSON.parse(fs.readFileSync(patternsPath, 'utf-8'))
    : { history: [], current: null };

  // Archive current if exists
  if (existing.current) {
    existing.history.push({
      ...existing.current,
      archived_at: new Date().toISOString(),
    });
    // Keep only φ² history entries
    const maxHistory = Math.round(10 * PHI * PHI);
    if (existing.history.length > maxHistory) {
      existing.history = existing.history.slice(-maxHistory);
    }
  }

  existing.current = {
    ...patterns,
    generated_at: new Date().toISOString(),
  };

  fs.writeFileSync(patternsPath, JSON.stringify(existing, null, 2), 'utf-8');
  return existing;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

/**
 * Handle incoming HolDex webhook event
 *
 * @param {Object} event - Raw event from HolDex
 * @param {Object} options - Processing options
 * @returns {Object} Processing result with CYNIC judgment
 */
async function handleWebhook(event, options = {}) {
  const { judge = true, cynicInstance = null } = options;

  // Rate limiting
  if (!rateLimiter.canAccept()) {
    return {
      success: false,
      error: 'rate_limited',
      message: `Rate limit exceeded (${CONFIG.limits.eventsPerMinute}/min)`,
      retry_after: 60,
    };
  }
  rateLimiter.record();

  // Validate
  const validation = validateEvent(event);
  if (!validation.valid) {
    return {
      success: false,
      error: 'validation_failed',
      errors: validation.errors,
      message: `Validation failed: ${validation.errors.join(', ')}`,
    };
  }

  // Transform
  const transformed = transformEvent(event);

  // Judge with CYNIC if available
  let cynicJudgment = null;
  if (judge && cynicInstance) {
    try {
      cynicJudgment = await cynicInstance.judge({
        type: 'holdex_event',
        data: transformed,
        context: { source: 'webhook', event_type: event.type },
      });
    } catch (error) {
      // Don't fail on CYNIC errors, just log
      cynicJudgment = {
        error: error.message,
        fallback: true,
        score: 50, // Neutral
      };
    }
  }

  // Add CYNIC score to transformed event
  transformed.cynic = cynicJudgment ? {
    score: cynicJudgment.global || cynicJudgment.score,
    verdict: cynicJudgment.verdict?.action || 'ACCEPTED',
    judged_at: new Date().toISOString(),
  } : null;

  // Store
  appendToLedger(transformed);
  const stats = updateStats(transformed);

  return {
    success: true,
    event_id: transformed.id,
    type: transformed.type,
    timestamp: transformed.timestamp,
    cynic: transformed.cynic,
    stats: {
      total: stats.total_events,
      today: stats.by_day[transformed.timestamp.slice(0, 10)] || 1,
    },
    rate_limit: rateLimiter.getStats(),
    message: `HolDex ${event.type} event processed successfully`,
    philosophy: 'K-Score is not a number. It\'s a judgment.',
  };
}

/**
 * Get HolDex integration status
 */
function getStatus() {
  const statsPath = path.join(CONFIG.storageDir, CONFIG.statsFile);
  const patternsPath = path.join(CONFIG.storageDir, CONFIG.patternsFile);

  let stats = null;
  let patterns = null;

  if (fs.existsSync(statsPath)) {
    try {
      stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    } catch {}
  }

  if (fs.existsSync(patternsPath)) {
    try {
      patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
    } catch {}
  }

  return {
    connected: true,
    storage_dir: CONFIG.storageDir,
    stats,
    patterns: patterns?.current,
    rate_limit: rateLimiter.getStats(),
    event_types: CONFIG.eventTypes,
    limits: CONFIG.limits,
  };
}

/**
 * Analyze patterns from recent events
 */
function analyzePatterns(options = {}) {
  const { limit = 1000 } = options;

  const events = loadEvents({ limit });
  if (events.length === 0) {
    return {
      success: false,
      message: 'No events to analyze',
    };
  }

  const patterns = extractPatterns(events);
  const saved = savePatterns(patterns);

  return {
    success: true,
    events_analyzed: events.length,
    patterns,
    history_size: saved.history.length,
    message: `Analyzed ${events.length} events, extracted patterns`,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  handleWebhook,
  getStatus,
  analyzePatterns,
  loadEvents,
  validateEvent,
  transformEvent,
  extractPatterns,
  CONFIG,
  rateLimiter,
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== HolDex Connector CLI ===\n');

  // Test with sample event
  const sampleEvent = {
    type: 'kscore_update',
    token: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    symbol: 'TEST',
    old_score: 45,
    new_score: 52,
    reason: 'holder_increase',
    timestamp: new Date().toISOString(),
  };

  console.log('Sample event:');
  console.log(JSON.stringify(sampleEvent, null, 2));

  console.log('\n--- Validation ---');
  const validation = validateEvent(sampleEvent);
  console.log('Valid:', validation.valid);
  console.log('Errors:', validation.errors);

  console.log('\n--- Transformation ---');
  const transformed = transformEvent(sampleEvent);
  console.log(JSON.stringify(transformed, null, 2));

  console.log('\n--- Handle Webhook ---');
  handleWebhook(sampleEvent).then(result => {
    console.log(JSON.stringify(result, null, 2));

    console.log('\n--- Status ---');
    const status = getStatus();
    console.log('Total events:', status.stats?.total_events || 0);
    console.log('Rate limit:', status.rate_limit);

    console.log('\nDone.');
  });
}
