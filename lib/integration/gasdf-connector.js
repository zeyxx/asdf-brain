/**
 * GASdf Integration Connector
 *
 * "Don't extract, burn."
 *
 * Handles events from GASdf:
 * - Burn events ($asdfasdfa burns)
 * - Swap transactions
 * - Fee distributions
 * - User behavior patterns (anonymized)
 *
 * All data is judged by CYNIC before storage.
 * User data is always hashed. No raw wallets.
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
  // Event types we accept from GASdf
  eventTypes: [
    'burn',              // $asdfasdfa burn
    'swap',              // Token swap via aggregator
    'fee_distributed',   // Fees sent to holders
    'liquidity_add',     // LP added
    'liquidity_remove',  // LP removed
    'stake',             // Staking event
    'unstake',           // Unstaking event
    'reward_claim',      // Reward claimed
  ],

  // Supported tokens
  tokens: {
    asdfasdfa: { symbol: '$asdfasdfa', decimals: 9 },
    usdc: { symbol: 'USDC', decimals: 6 },
    sol: { symbol: 'SOL', decimals: 9 },
    usdt: { symbol: 'USDT', decimals: 6 },
  },

  // Limits (φ-based)
  limits: {
    eventsPerMinute: Math.round(100 * PHI),          // ~162 events/min
    eventsPerHour: Math.round(3000 * PHI_INV),       // ~1854 events/hour
    maxPayloadSize: Math.round(8000 * PHI_INV_2),    // ~3056 bytes
    minBurnAmount: 1, // Minimum burn to track
  },

  // Storage
  storageDir: path.join(__dirname, '../../knowledge/integrations/gasdf'),
  ledgerFile: 'events.jsonl',
  burnsFile: 'burns.jsonl',
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

    return {
      lastMinute: this.events.filter(ts => ts > oneMinuteAgo).length,
      lastHour: this.events.filter(ts => ts > oneHourAgo).length,
      limitMinute: CONFIG.limits.eventsPerMinute,
      limitHour: CONFIG.limits.eventsPerHour,
    };
  },
};

// =============================================================================
// BURN TRACKING
// =============================================================================

const burnTracker = {
  session: {
    total: 0,
    count: 0,
    users: new Set(),
    startTime: Date.now(),
  },

  record(amount, userHash) {
    this.session.total += amount;
    this.session.count++;
    if (userHash) {
      this.session.users.add(userHash);
    }
  },

  getSessionStats() {
    const duration = (Date.now() - this.session.startTime) / 1000 / 60; // minutes
    return {
      total_burned: this.session.total,
      burn_count: this.session.count,
      unique_users: this.session.users.size,
      burn_rate: duration > 0 ? Math.round(this.session.total / duration * 100) / 100 : 0,
      session_duration_min: Math.round(duration * 100) / 100,
    };
  },
};

// =============================================================================
// EVENT VALIDATION
// =============================================================================

/**
 * Validate incoming GASdf event
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
  if (event.type === 'burn') {
    if (event.amount === undefined || event.amount === null) {
      errors.push('burn event requires amount');
    }
    if (event.amount < CONFIG.limits.minBurnAmount) {
      errors.push(`burn amount too small (min: ${CONFIG.limits.minBurnAmount})`);
    }
  }

  if (event.type === 'swap') {
    if (!event.token_in && !event.from_token) {
      errors.push('swap event requires token_in or from_token');
    }
    if (!event.token_out && !event.to_token) {
      errors.push('swap event requires token_out or to_token');
    }
    if (!event.amount_in && !event.amount) {
      errors.push('swap event requires amount_in or amount');
    }
  }

  if (event.type === 'fee_distributed') {
    if (!event.amount) {
      errors.push('fee_distributed requires amount');
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
 * Transform GASdf event for CYNIC ingestion
 */
function transformEvent(event, source = 'webhook') {
  const transformed = {
    // Core identity
    id: crypto.randomUUID(),
    source: 'gasdf',
    source_type: source,

    // Event data
    type: event.type,
    timestamp: event.timestamp || new Date().toISOString(),
    received_at: new Date().toISOString(),

    // User info (ALWAYS hashed)
    user_hash: event.user || event.wallet || event.address
      ? privacy.hashForLookup(event.user || event.wallet || event.address, 'gasdf:user')
      : null,

    // Transaction info (tx signatures are public, but we hash for pattern detection)
    tx_hash: event.signature || event.tx
      ? privacy.fastHash(event.signature || event.tx).slice(0, 16)
      : null,

    // Amounts (public)
    amount: event.amount || event.amount_in || null,
    amount_out: event.amount_out || null,

    // Tokens (public symbols)
    token_in: normalizeToken(event.token_in || event.from_token),
    token_out: normalizeToken(event.token_out || event.to_token),

    // Burn-specific
    burn: event.type === 'burn' ? {
      amount: event.amount,
      token: normalizeToken(event.token) || '$asdfasdfa',
      permanent: true,
      philosophy: "Don't extract, burn.",
    } : null,

    // Swap-specific
    swap: event.type === 'swap' ? {
      rate: event.amount_out && event.amount_in
        ? Math.round((event.amount_out / event.amount_in) * 1000000) / 1000000
        : null,
      slippage: event.slippage || null,
      route: event.route || 'direct',
    } : null,

    // Fee distribution
    fee: event.type === 'fee_distributed' ? {
      amount: event.amount,
      recipients: event.recipients || null,
      token: normalizeToken(event.token) || 'USDC',
    } : null,

    // Metadata
    meta: {
      phi_timestamp: Date.now() * PHI_INV,
      block: event.block || event.slot || null,
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

/**
 * Normalize token symbol
 */
function normalizeToken(token) {
  if (!token) return null;
  const upper = token.toUpperCase();

  // Known tokens
  if (upper === 'ASDFASDFA' || upper === '$ASDFASDFA') return '$asdfasdfa';
  if (upper === 'SOL' || upper === 'WSOL') return 'SOL';
  if (upper === 'USDC') return 'USDC';
  if (upper === 'USDT') return 'USDT';

  return upper;
}

// =============================================================================
// PATTERN EXTRACTION
// =============================================================================

/**
 * Extract patterns from GASdf events
 */
function extractPatterns(events) {
  const patterns = {
    burns: {
      total: 0,
      count: 0,
      avgBurn: 0,
      largestBurn: 0,
      uniqueUsers: new Set(),
    },
    swaps: {
      count: 0,
      byPair: {},
      avgSlippage: 0,
      totalVolume: 0,
    },
    fees: {
      totalDistributed: 0,
      distributions: 0,
    },
    activity: {
      uniqueUsers: new Set(),
      eventsPerHour: {},
      peakHour: null,
      peakCount: 0,
    },
    phi: {
      burnToSwapRatio: 0,
      userRetention: 0,
    },
  };

  let totalSlippage = 0;
  let slippageCount = 0;

  events.forEach(event => {
    // Burns
    if (event.burn) {
      patterns.burns.total += event.burn.amount;
      patterns.burns.count++;
      patterns.burns.largestBurn = Math.max(patterns.burns.largestBurn, event.burn.amount);
      if (event.user_hash) {
        patterns.burns.uniqueUsers.add(event.user_hash);
      }
    }

    // Swaps
    if (event.swap) {
      patterns.swaps.count++;
      const pair = `${event.token_in || '?'}/${event.token_out || '?'}`;
      patterns.swaps.byPair[pair] = (patterns.swaps.byPair[pair] || 0) + 1;
      if (event.amount) {
        patterns.swaps.totalVolume += event.amount;
      }
      if (event.swap.slippage) {
        totalSlippage += event.swap.slippage;
        slippageCount++;
      }
    }

    // Fees
    if (event.fee) {
      patterns.fees.totalDistributed += event.fee.amount;
      patterns.fees.distributions++;
    }

    // Activity
    if (event.user_hash) {
      patterns.activity.uniqueUsers.add(event.user_hash);
    }

    const hour = event.timestamp.slice(0, 13);
    patterns.activity.eventsPerHour[hour] = (patterns.activity.eventsPerHour[hour] || 0) + 1;
    if (patterns.activity.eventsPerHour[hour] > patterns.activity.peakCount) {
      patterns.activity.peakHour = hour;
      patterns.activity.peakCount = patterns.activity.eventsPerHour[hour];
    }
  });

  // Finalize
  if (patterns.burns.count > 0) {
    patterns.burns.avgBurn = Math.round(patterns.burns.total / patterns.burns.count * 100) / 100;
  }
  patterns.burns.uniqueUsers = patterns.burns.uniqueUsers.size;

  if (slippageCount > 0) {
    patterns.swaps.avgSlippage = Math.round((totalSlippage / slippageCount) * 10000) / 10000;
  }

  patterns.activity.uniqueUsers = patterns.activity.uniqueUsers.size;

  // φ metrics
  if (patterns.swaps.count > 0) {
    patterns.phi.burnToSwapRatio = Math.round((patterns.burns.count / patterns.swaps.count) * 1000) / 1000;
  }

  // Check if ratio is close to φ or φ⁻¹
  const ratio = patterns.phi.burnToSwapRatio;
  if (ratio > 0) {
    patterns.phi.harmony = Math.abs(ratio - PHI_INV) < 0.1 ? 'φ⁻¹ aligned' :
                          Math.abs(ratio - PHI) < 0.2 ? 'φ aligned' :
                          'seeking harmony';
  }

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
  fs.appendFileSync(ledgerPath, JSON.stringify(event) + '\n', 'utf-8');

  // Also track burns separately
  if (event.burn) {
    const burnsPath = path.join(CONFIG.storageDir, CONFIG.burnsFile);
    fs.appendFileSync(burnsPath, JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      amount: event.burn.amount,
      user_hash: event.user_hash,
      tx_hash: event.tx_hash,
    }) + '\n', 'utf-8');

    burnTracker.record(event.burn.amount, event.user_hash);
  }
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
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);

  if (since) {
    const sinceTs = new Date(since).getTime();
    events = events.filter(e => new Date(e.timestamp).getTime() > sinceTs);
  }

  if (type) {
    events = events.filter(e => e.type === type);
  }

  return events.slice(-limit);
}

/**
 * Load burn history
 */
function loadBurns(options = {}) {
  const { limit = 100, since = null } = options;
  const burnsPath = path.join(CONFIG.storageDir, CONFIG.burnsFile);

  if (!fs.existsSync(burnsPath)) {
    return [];
  }

  const lines = fs.readFileSync(burnsPath, 'utf-8').split('\n').filter(Boolean);
  let burns = lines.map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);

  if (since) {
    const sinceTs = new Date(since).getTime();
    burns = burns.filter(b => new Date(b.timestamp).getTime() > sinceTs);
  }

  return burns.slice(-limit);
}

/**
 * Update stats
 */
function updateStats(event) {
  const statsPath = path.join(CONFIG.storageDir, CONFIG.statsFile);

  let stats = {
    total_events: 0,
    total_burned: 0,
    burn_count: 0,
    swap_count: 0,
    by_type: {},
    by_day: {},
    first_event: null,
    last_event: null,
  };

  if (fs.existsSync(statsPath)) {
    try { stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8')); } catch {}
  }

  stats.total_events++;
  stats.by_type[event.type] = (stats.by_type[event.type] || 0) + 1;

  if (event.burn) {
    stats.total_burned += event.burn.amount;
    stats.burn_count++;
  }

  if (event.swap) {
    stats.swap_count++;
  }

  const day = event.timestamp.slice(0, 10);
  if (!stats.by_day[day]) {
    stats.by_day[day] = { events: 0, burned: 0 };
  }
  stats.by_day[day].events++;
  if (event.burn) {
    stats.by_day[day].burned += event.burn.amount;
  }

  if (!stats.first_event) {
    stats.first_event = event.timestamp;
  }
  stats.last_event = event.timestamp;

  // φ metrics
  stats.phi = {
    avg_burn_per_day: Object.keys(stats.by_day).length > 0
      ? Math.round(stats.total_burned / Object.keys(stats.by_day).length * 100) / 100
      : 0,
    burn_rate_phi: Math.round(stats.burn_count * PHI_INV * 100) / 100,
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

  if (existing.current) {
    existing.history.push({ ...existing.current, archived_at: new Date().toISOString() });
    const maxHistory = Math.round(10 * PHI * PHI);
    if (existing.history.length > maxHistory) {
      existing.history = existing.history.slice(-maxHistory);
    }
  }

  existing.current = { ...patterns, generated_at: new Date().toISOString() };
  fs.writeFileSync(patternsPath, JSON.stringify(existing, null, 2), 'utf-8');
  return existing;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

/**
 * Handle incoming GASdf event
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
    };
  }

  // Transform
  const transformed = transformEvent(event);

  // Judge with CYNIC if available
  let cynicJudgment = null;
  if (judge && cynicInstance) {
    try {
      cynicJudgment = await cynicInstance.judge({
        type: 'gasdf_event',
        data: transformed,
        context: { source: 'webhook', event_type: event.type },
      });
    } catch (error) {
      cynicJudgment = { error: error.message, fallback: true, score: 50 };
    }
  }

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
    burn: transformed.burn,
    cynic: transformed.cynic,
    stats: {
      total_events: stats.total_events,
      total_burned: stats.total_burned,
      session: burnTracker.getSessionStats(),
    },
    rate_limit: rateLimiter.getStats(),
    message: `GASdf ${event.type} event processed`,
    philosophy: "Don't extract, burn.",
  };
}

/**
 * Get GASdf integration status
 */
function getStatus() {
  const statsPath = path.join(CONFIG.storageDir, CONFIG.statsFile);
  const patternsPath = path.join(CONFIG.storageDir, CONFIG.patternsFile);

  let stats = null;
  let patterns = null;

  if (fs.existsSync(statsPath)) {
    try { stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8')); } catch {}
  }

  if (fs.existsSync(patternsPath)) {
    try { patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf-8')); } catch {}
  }

  return {
    connected: true,
    storage_dir: CONFIG.storageDir,
    stats,
    patterns: patterns?.current,
    session: burnTracker.getSessionStats(),
    rate_limit: rateLimiter.getStats(),
    event_types: CONFIG.eventTypes,
    tokens: CONFIG.tokens,
  };
}

/**
 * Get burn statistics
 */
function getBurnStats(options = {}) {
  const { days = 7 } = options;
  const burns = loadBurns({ limit: 10000 });

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceTs = since.getTime();

  const recentBurns = burns.filter(b => new Date(b.timestamp).getTime() > sinceTs);

  const total = recentBurns.reduce((sum, b) => sum + b.amount, 0);
  const uniqueUsers = new Set(recentBurns.map(b => b.user_hash).filter(Boolean)).size;

  return {
    period_days: days,
    total_burned: total,
    burn_count: recentBurns.length,
    unique_users: uniqueUsers,
    avg_burn: recentBurns.length > 0 ? Math.round(total / recentBurns.length * 100) / 100 : 0,
    daily_avg: Math.round(total / days * 100) / 100,
    session: burnTracker.getSessionStats(),
  };
}

/**
 * Analyze patterns
 */
function analyzePatterns(options = {}) {
  const { limit = 1000 } = options;
  const events = loadEvents({ limit });

  if (events.length === 0) {
    return { success: false, message: 'No events to analyze' };
  }

  const patterns = extractPatterns(events);
  const saved = savePatterns(patterns);

  return {
    success: true,
    events_analyzed: events.length,
    patterns,
    history_size: saved.history.length,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  handleWebhook,
  getStatus,
  getBurnStats,
  analyzePatterns,
  loadEvents,
  loadBurns,
  validateEvent,
  transformEvent,
  extractPatterns,
  CONFIG,
  rateLimiter,
  burnTracker,
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== GASdf Connector CLI ===\n');

  const sampleBurn = {
    type: 'burn',
    amount: 1000,
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    signature: 'abc123...',
    timestamp: new Date().toISOString(),
  };

  console.log('Sample burn event:');
  console.log(JSON.stringify(sampleBurn, null, 2));

  console.log('\n--- Validation ---');
  const validation = validateEvent(sampleBurn);
  console.log('Valid:', validation.valid);

  console.log('\n--- Transformation ---');
  const transformed = transformEvent(sampleBurn);
  console.log(JSON.stringify(transformed, null, 2));

  console.log('\n--- Handle Webhook ---');
  handleWebhook(sampleBurn).then(result => {
    console.log(JSON.stringify(result, null, 2));

    console.log('\n--- Burn Stats ---');
    const burnStats = getBurnStats();
    console.log(JSON.stringify(burnStats, null, 2));

    console.log('\nDone.');
  });
}
