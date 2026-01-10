/**
 * CYNIC Metrics - Quantified Self-Awareness
 *
 * "φ qui se mesure."
 *
 * Collects, aggregates, and reports metrics for all CYNIC operations:
 * - Judgment metrics (count, latency, confidence distribution)
 * - Integration metrics (events, errors, throughput)
 * - Knowledge metrics (size, freshness, growth)
 * - Resource metrics (memory, CPU, event loop)
 *
 * All metrics follow φ-based aggregation windows.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// PHI CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;                    // 0.618
const PHI_INV_2 = 1 / (PHI * PHI);          // 0.382

// Time windows (φ-based, in ms)
const WINDOWS = {
  MINUTE: 60 * 1000,
  PHI_MINUTE: Math.round(PHI * 60 * 1000),           // ~97s
  HOUR: 60 * 60 * 1000,
  PHI_HOUR: Math.round(PHI * 60 * 60 * 1000),        // ~97min
  DAY: 24 * 60 * 60 * 1000,
};

// Aggregation buckets
const BUCKET_COUNT = Math.round(PHI * 10);  // ~16 buckets

// =============================================================================
// METRIC TYPES
// =============================================================================

/**
 * Counter - monotonically increasing value
 */
class Counter {
  constructor(name, description = '') {
    this.name = name;
    this.description = description;
    this.value = 0;
    this.createdAt = Date.now();
    this.lastUpdated = Date.now();
  }

  inc(amount = 1) {
    this.value += amount;
    this.lastUpdated = Date.now();
    return this.value;
  }

  get() {
    return this.value;
  }

  reset() {
    const oldValue = this.value;
    this.value = 0;
    this.lastUpdated = Date.now();
    return oldValue;
  }

  toJSON() {
    return {
      type: 'counter',
      name: this.name,
      description: this.description,
      value: this.value,
      createdAt: new Date(this.createdAt).toISOString(),
      lastUpdated: new Date(this.lastUpdated).toISOString(),
    };
  }
}

/**
 * Gauge - point-in-time value that can go up or down
 */
class Gauge {
  constructor(name, description = '') {
    this.name = name;
    this.description = description;
    this.value = 0;
    this.min = Infinity;
    this.max = -Infinity;
    this.history = [];
    this.historySize = BUCKET_COUNT;
    this.createdAt = Date.now();
    this.lastUpdated = Date.now();
  }

  set(value) {
    this.value = value;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
    this.lastUpdated = Date.now();

    this.history.push({ value, timestamp: this.lastUpdated });
    if (this.history.length > this.historySize) {
      this.history.shift();
    }

    return this.value;
  }

  inc(amount = 1) {
    return this.set(this.value + amount);
  }

  dec(amount = 1) {
    return this.set(this.value - amount);
  }

  get() {
    return this.value;
  }

  getStats() {
    if (this.history.length === 0) {
      return { current: this.value, min: this.value, max: this.value, avg: this.value };
    }

    const values = this.history.map(h => h.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      current: this.value,
      min: this.min === Infinity ? this.value : this.min,
      max: this.max === -Infinity ? this.value : this.max,
      avg: Math.round(avg * 100) / 100,
      samples: this.history.length,
    };
  }

  toJSON() {
    return {
      type: 'gauge',
      name: this.name,
      description: this.description,
      ...this.getStats(),
      createdAt: new Date(this.createdAt).toISOString(),
      lastUpdated: new Date(this.lastUpdated).toISOString(),
    };
  }
}

/**
 * Histogram - distribution of values
 */
class Histogram {
  constructor(name, description = '', buckets = null) {
    this.name = name;
    this.description = description;
    this.buckets = buckets || this._defaultBuckets();
    this.counts = new Array(this.buckets.length + 1).fill(0);
    this.sum = 0;
    this.count = 0;
    this.min = Infinity;
    this.max = -Infinity;
    this.createdAt = Date.now();
    this.lastUpdated = Date.now();
  }

  _defaultBuckets() {
    // φ-based buckets: 1, 1.6, 2.6, 4.2, 6.8, 11, 18, 29, 47, 76, 123, 199...
    const buckets = [1];
    for (let i = 1; i < BUCKET_COUNT; i++) {
      buckets.push(Math.round(buckets[i - 1] * PHI));
    }
    return buckets;
  }

  observe(value) {
    this.sum += value;
    this.count++;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
    this.lastUpdated = Date.now();

    // Find bucket
    let bucketIndex = this.buckets.length; // +Inf bucket
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) {
        bucketIndex = i;
        break;
      }
    }
    this.counts[bucketIndex]++;

    return this;
  }

  getStats() {
    if (this.count === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    return {
      count: this.count,
      sum: Math.round(this.sum * 100) / 100,
      avg: Math.round((this.sum / this.count) * 100) / 100,
      min: this.min === Infinity ? 0 : this.min,
      max: this.max === -Infinity ? 0 : this.max,
    };
  }

  getPercentile(p) {
    if (this.count === 0) return 0;

    const target = Math.ceil(p * this.count);
    let cumulative = 0;

    for (let i = 0; i < this.counts.length; i++) {
      cumulative += this.counts[i];
      if (cumulative >= target) {
        return i < this.buckets.length ? this.buckets[i] : this.max;
      }
    }

    return this.max;
  }

  toJSON() {
    const stats = this.getStats();
    return {
      type: 'histogram',
      name: this.name,
      description: this.description,
      ...stats,
      p50: this.getPercentile(0.5),
      p90: this.getPercentile(0.9),
      p99: this.getPercentile(0.99),
      buckets: this.buckets.map((b, i) => ({
        le: b,
        count: this.counts[i],
      })),
      createdAt: new Date(this.createdAt).toISOString(),
      lastUpdated: new Date(this.lastUpdated).toISOString(),
    };
  }
}

/**
 * Rate - events per time window
 */
class Rate {
  constructor(name, description = '', windowMs = WINDOWS.MINUTE) {
    this.name = name;
    this.description = description;
    this.windowMs = windowMs;
    this.events = [];
    this.createdAt = Date.now();
  }

  mark() {
    const now = Date.now();
    this.events.push(now);
    this._cleanup(now);
    return this.get();
  }

  _cleanup(now) {
    const cutoff = now - this.windowMs;
    while (this.events.length > 0 && this.events[0] < cutoff) {
      this.events.shift();
    }
  }

  get() {
    this._cleanup(Date.now());
    return this.events.length;
  }

  getPerSecond() {
    return Math.round((this.get() / (this.windowMs / 1000)) * 100) / 100;
  }

  toJSON() {
    return {
      type: 'rate',
      name: this.name,
      description: this.description,
      count: this.get(),
      perSecond: this.getPerSecond(),
      windowMs: this.windowMs,
      createdAt: new Date(this.createdAt).toISOString(),
    };
  }
}

// =============================================================================
// METRICS REGISTRY
// =============================================================================

const registry = {
  counters: new Map(),
  gauges: new Map(),
  histograms: new Map(),
  rates: new Map(),
};

/**
 * Get or create a counter
 */
function counter(name, description = '') {
  if (!registry.counters.has(name)) {
    registry.counters.set(name, new Counter(name, description));
  }
  return registry.counters.get(name);
}

/**
 * Get or create a gauge
 */
function gauge(name, description = '') {
  if (!registry.gauges.has(name)) {
    registry.gauges.set(name, new Gauge(name, description));
  }
  return registry.gauges.get(name);
}

/**
 * Get or create a histogram
 */
function histogram(name, description = '', buckets = null) {
  if (!registry.histograms.has(name)) {
    registry.histograms.set(name, new Histogram(name, description, buckets));
  }
  return registry.histograms.get(name);
}

/**
 * Get or create a rate
 */
function rate(name, description = '', windowMs = WINDOWS.MINUTE) {
  if (!registry.rates.has(name)) {
    registry.rates.set(name, new Rate(name, description, windowMs));
  }
  return registry.rates.get(name);
}

// =============================================================================
// PREDEFINED METRICS
// =============================================================================

// Judgment metrics
const judgments = {
  total: counter('cynic_judgments_total', 'Total number of judgments'),
  accepted: counter('cynic_judgments_accepted', 'Accepted judgments'),
  rejected: counter('cynic_judgments_rejected', 'Rejected judgments'),
  improved: counter('cynic_judgments_improved', 'Improved judgments'),
  latency: histogram('cynic_judgment_latency_ms', 'Judgment latency in ms'),
  confidence: histogram('cynic_judgment_confidence', 'Judgment confidence distribution', [10, 20, 30, 38, 50, 62, 70, 80, 90, 100]),
  rate: rate('cynic_judgments_rate', 'Judgments per minute'),
};

// Integration metrics
const integrations = {
  eventsReceived: counter('integration_events_received', 'Events received from integrations'),
  eventsProcessed: counter('integration_events_processed', 'Events processed successfully'),
  eventsRejected: counter('integration_events_rejected', 'Events rejected'),
  errors: counter('integration_errors_total', 'Integration errors'),
  latency: histogram('integration_latency_ms', 'Integration processing latency'),
  holdexEvents: counter('holdex_events_total', 'HolDex events'),
  gasdfEvents: counter('gasdf_events_total', 'GASdf events'),
  gasdfBurned: counter('gasdf_burned_total', 'Total amount burned via GASdf'),
  claudeMemSynced: counter('claude_mem_synced_total', 'Claude-Mem items synced'),
};

// Knowledge metrics
const knowledge = {
  itemsLearned: counter('knowledge_items_learned', 'Knowledge items learned'),
  patternsDetected: counter('knowledge_patterns_detected', 'Patterns detected'),
  decisionsRecorded: counter('knowledge_decisions_recorded', 'Decisions recorded'),
  searchQueries: counter('knowledge_search_queries', 'Search queries'),
  searchLatency: histogram('knowledge_search_latency_ms', 'Search latency'),
};

// Resource metrics
const resources = {
  heapUsed: gauge('process_heap_used_bytes', 'Heap memory used'),
  heapTotal: gauge('process_heap_total_bytes', 'Total heap memory'),
  rss: gauge('process_rss_bytes', 'Resident set size'),
  eventLoopLag: gauge('process_event_loop_lag_ms', 'Event loop lag'),
  uptime: gauge('process_uptime_seconds', 'Process uptime'),
};

// Pulse metrics
const pulse = {
  beats: counter('pulse_beats_total', 'Total pulse beats'),
  anomalies: counter('pulse_anomalies_total', 'Anomalies detected'),
  health: gauge('pulse_health_score', 'Current health score'),
  latency: histogram('pulse_latency_ms', 'Pulse check latency'),
};

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

/**
 * Record a judgment
 */
function recordJudgment(result, latencyMs) {
  judgments.total.inc();
  judgments.rate.mark();
  judgments.latency.observe(latencyMs);

  if (result.confidence) {
    judgments.confidence.observe(result.confidence);
  }

  if (result.verdict === 'accept' || result.action === 'ACCEPT') {
    judgments.accepted.inc();
  } else if (result.verdict === 'reject' || result.action === 'REJECT') {
    judgments.rejected.inc();
  } else if (result.verdict === 'improve' || result.action === 'IMPROVE') {
    judgments.improved.inc();
  }
}

/**
 * Record an integration event
 */
function recordIntegrationEvent(source, success, latencyMs = 0, amount = 0) {
  integrations.eventsReceived.inc();

  if (success) {
    integrations.eventsProcessed.inc();
  } else {
    integrations.eventsRejected.inc();
  }

  if (latencyMs > 0) {
    integrations.latency.observe(latencyMs);
  }

  switch (source) {
    case 'holdex':
      integrations.holdexEvents.inc();
      break;
    case 'gasdf':
      integrations.gasdfEvents.inc();
      if (amount > 0) {
        integrations.gasdfBurned.inc(amount);
      }
      break;
    case 'claude-mem':
      integrations.claudeMemSynced.inc();
      break;
  }
}

/**
 * Record a knowledge operation
 */
function recordKnowledgeOp(type, latencyMs = 0) {
  switch (type) {
    case 'learn':
      knowledge.itemsLearned.inc();
      break;
    case 'pattern':
      knowledge.patternsDetected.inc();
      break;
    case 'decision':
      knowledge.decisionsRecorded.inc();
      break;
    case 'search':
      knowledge.searchQueries.inc();
      if (latencyMs > 0) {
        knowledge.searchLatency.observe(latencyMs);
      }
      break;
  }
}

/**
 * Update resource metrics
 */
function updateResourceMetrics() {
  const mem = process.memoryUsage();
  resources.heapUsed.set(mem.heapUsed);
  resources.heapTotal.set(mem.heapTotal);
  resources.rss.set(mem.rss);
  resources.uptime.set(Math.round(process.uptime()));
}

/**
 * Record pulse metrics
 */
function recordPulse(health, latencyMs, anomalyCount = 0) {
  pulse.beats.inc();
  pulse.health.set(health);
  pulse.latency.observe(latencyMs);
  if (anomalyCount > 0) {
    pulse.anomalies.inc(anomalyCount);
  }
}

// =============================================================================
// REPORTING
// =============================================================================

/**
 * Get all metrics as JSON
 */
function getAll() {
  const result = {
    counters: {},
    gauges: {},
    histograms: {},
    rates: {},
    collectedAt: new Date().toISOString(),
  };

  for (const [name, metric] of registry.counters) {
    result.counters[name] = metric.toJSON();
  }
  for (const [name, metric] of registry.gauges) {
    result.gauges[name] = metric.toJSON();
  }
  for (const [name, metric] of registry.histograms) {
    result.histograms[name] = metric.toJSON();
  }
  for (const [name, metric] of registry.rates) {
    result.rates[name] = metric.toJSON();
  }

  return result;
}

/**
 * Get summary report
 */
function getSummary() {
  updateResourceMetrics();

  return {
    judgments: {
      total: judgments.total.get(),
      accepted: judgments.accepted.get(),
      rejected: judgments.rejected.get(),
      improved: judgments.improved.get(),
      avgLatencyMs: judgments.latency.getStats().avg,
      p99LatencyMs: judgments.latency.getPercentile(0.99),
      avgConfidence: judgments.confidence.getStats().avg,
      ratePerMin: judgments.rate.get(),
    },
    integrations: {
      eventsReceived: integrations.eventsReceived.get(),
      eventsProcessed: integrations.eventsProcessed.get(),
      eventsRejected: integrations.eventsRejected.get(),
      errors: integrations.errors.get(),
      holdexEvents: integrations.holdexEvents.get(),
      gasdfEvents: integrations.gasdfEvents.get(),
      gasdfBurned: integrations.gasdfBurned.get(),
      claudeMemSynced: integrations.claudeMemSynced.get(),
    },
    knowledge: {
      itemsLearned: knowledge.itemsLearned.get(),
      patternsDetected: knowledge.patternsDetected.get(),
      decisionsRecorded: knowledge.decisionsRecorded.get(),
      searchQueries: knowledge.searchQueries.get(),
    },
    resources: {
      heapUsedMB: Math.round(resources.heapUsed.get() / 1024 / 1024),
      heapTotalMB: Math.round(resources.heapTotal.get() / 1024 / 1024),
      rssMB: Math.round(resources.rss.get() / 1024 / 1024),
      uptimeSeconds: resources.uptime.get(),
    },
    pulse: {
      beats: pulse.beats.get(),
      currentHealth: pulse.health.get(),
      anomalies: pulse.anomalies.get(),
      avgLatencyMs: pulse.latency.getStats().avg,
    },
    collectedAt: new Date().toISOString(),
  };
}

/**
 * Reset all metrics
 */
function resetAll() {
  for (const metric of registry.counters.values()) {
    metric.reset();
  }
  // Gauges and histograms keep their state
  return { reset: true, timestamp: new Date().toISOString() };
}

// =============================================================================
// PERSISTENCE
// =============================================================================

const METRICS_DIR = path.join(__dirname, '../../knowledge/live/metrics');

async function persistMetrics() {
  try {
    await fs.promises.mkdir(METRICS_DIR, { recursive: true });

    const summary = getSummary();
    const summaryFile = path.join(METRICS_DIR, 'current.json');
    await fs.promises.writeFile(summaryFile, JSON.stringify(summary, null, 2));

    // Append to history
    const historyFile = path.join(METRICS_DIR, 'history.jsonl');
    await fs.promises.appendFile(historyFile, JSON.stringify({
      timestamp: summary.collectedAt,
      judgments: summary.judgments.total,
      integrationEvents: summary.integrations.eventsReceived,
      health: summary.pulse.currentHealth,
      heapMB: summary.resources.heapUsedMB,
    }) + '\n');

    return { persisted: true, path: summaryFile };
  } catch (error) {
    return { persisted: false, error: error.message };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Metric factories
  counter,
  gauge,
  histogram,
  rate,

  // Predefined metrics
  judgments,
  integrations,
  knowledge,
  resources,
  pulse,

  // Convenience methods
  recordJudgment,
  recordIntegrationEvent,
  recordKnowledgeOp,
  recordPulse,
  updateResourceMetrics,

  // Reporting
  getAll,
  getSummary,
  resetAll,
  persistMetrics,

  // Classes (for advanced use)
  Counter,
  Gauge,
  Histogram,
  Rate,

  // Constants
  WINDOWS,
  BUCKET_COUNT,
  PHI,
  PHI_INV,
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== CYNIC Metrics CLI ===\n');

  // Simulate some activity
  console.log('Simulating metrics...\n');

  for (let i = 0; i < 10; i++) {
    recordJudgment({ confidence: 45 + Math.random() * 20, verdict: Math.random() > 0.3 ? 'accept' : 'reject' }, 50 + Math.random() * 200);
  }

  for (let i = 0; i < 5; i++) {
    recordIntegrationEvent('holdex', true, 30 + Math.random() * 100);
    recordIntegrationEvent('gasdf', true, 20 + Math.random() * 50, Math.round(Math.random() * 1000));
  }

  recordKnowledgeOp('learn');
  recordKnowledgeOp('pattern');
  recordKnowledgeOp('search', 150);

  recordPulse(62, 50, 0);

  console.log('--- Summary ---');
  console.log(JSON.stringify(getSummary(), null, 2));

  console.log('\n--- Judgment Histogram ---');
  console.log(JSON.stringify(judgments.latency.toJSON(), null, 2));

  console.log('\nDone.');
}
