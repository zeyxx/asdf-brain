/**
 * CYNIC Pulse - The Heartbeat of Consciousness
 *
 * "φ qui se voit vivre."
 *
 * This is CYNIC's self-awareness system. Every pulse:
 * - Confirms CYNIC is alive
 * - Checks all subsystems
 * - Collects vital metrics
 * - Detects anomalies
 * - Records state for learning
 *
 * Pulse interval follows φ: 61.8 seconds (φ⁻¹ * 100)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// =============================================================================
// PHI CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;                    // 0.618...
const PHI_INV_2 = 1 / (PHI * PHI);          // 0.382...

// Pulse timing (φ-based)
const PULSE_INTERVAL_MS = Math.round(PHI_INV * 100 * 1000);  // 61.8 seconds
const HEALTH_HISTORY_SIZE = Math.round(PHI * 100);           // ~162 entries
const ANOMALY_THRESHOLD = PHI_INV_2;                          // 38.2% deviation

// =============================================================================
// PULSE STATE
// =============================================================================

const state = {
  // Identity
  startedAt: null,
  pulseCount: 0,

  // Current vitals
  alive: false,
  lastPulse: null,
  lastPulseMs: 0,

  // Health tracking
  healthHistory: [],
  currentHealth: null,

  // Anomalies
  anomalies: [],
  anomalyCount: 0,

  // Metrics aggregates
  metrics: {
    totalJudgments: 0,
    totalEvents: 0,
    totalErrors: 0,
    avgResponseMs: 0,
    uptimeMs: 0,
  },

  // Subsystem status
  subsystems: {},

  // Interval handle
  _intervalHandle: null,
};

// Event emitter for pulse events
const pulseEmitter = new EventEmitter();

// =============================================================================
// SUBSYSTEM REGISTRY
// =============================================================================

const subsystemChecks = new Map();

/**
 * Register a subsystem health check
 * @param {string} name - Subsystem name
 * @param {Function} checkFn - Async function returning { healthy: bool, details: object }
 */
function registerSubsystem(name, checkFn) {
  subsystemChecks.set(name, checkFn);
  state.subsystems[name] = {
    registered: true,
    lastCheck: null,
    healthy: null,
    details: null,
    consecutiveFailures: 0,
  };
}

/**
 * Unregister a subsystem
 */
function unregisterSubsystem(name) {
  subsystemChecks.delete(name);
  delete state.subsystems[name];
}

// =============================================================================
// CORE PULSE LOGIC
// =============================================================================

/**
 * Execute a single pulse - CYNIC's heartbeat
 */
async function pulse() {
  const pulseStart = Date.now();
  state.pulseCount++;

  const pulseData = {
    id: state.pulseCount,
    timestamp: new Date().toISOString(),
    uptimeMs: pulseStart - state.startedAt,
    subsystems: {},
    metrics: {},
    anomalies: [],
    overallHealth: 0,
  };

  // Check all subsystems
  for (const [name, checkFn] of subsystemChecks) {
    try {
      const result = await checkFn();
      const healthy = result.healthy !== false;

      state.subsystems[name] = {
        ...state.subsystems[name],
        lastCheck: pulseData.timestamp,
        healthy,
        details: result.details || {},
        consecutiveFailures: healthy ? 0 : (state.subsystems[name]?.consecutiveFailures || 0) + 1,
      };

      pulseData.subsystems[name] = {
        healthy,
        details: result.details,
        responseMs: result.responseMs || 0,
      };

      // Check for subsystem anomalies
      if (!healthy && state.subsystems[name].consecutiveFailures >= 3) {
        pulseData.anomalies.push({
          type: 'subsystem_degraded',
          subsystem: name,
          failures: state.subsystems[name].consecutiveFailures,
          severity: state.subsystems[name].consecutiveFailures >= 5 ? 'critical' : 'warning',
        });
      }
    } catch (error) {
      state.subsystems[name] = {
        ...state.subsystems[name],
        lastCheck: pulseData.timestamp,
        healthy: false,
        details: { error: error.message },
        consecutiveFailures: (state.subsystems[name]?.consecutiveFailures || 0) + 1,
      };

      pulseData.subsystems[name] = {
        healthy: false,
        error: error.message,
      };

      pulseData.anomalies.push({
        type: 'subsystem_error',
        subsystem: name,
        error: error.message,
        severity: 'error',
      });
    }
  }

  // Calculate overall health (φ-weighted)
  const subsystemNames = Object.keys(pulseData.subsystems);
  if (subsystemNames.length > 0) {
    const healthyCount = subsystemNames.filter(n => pulseData.subsystems[n].healthy).length;
    const healthRatio = healthyCount / subsystemNames.length;

    // Apply φ scaling: 100% healthy = 61.8 score (MAX_CONFIDENCE)
    pulseData.overallHealth = Math.round(healthRatio * PHI_INV * 100);
  } else {
    pulseData.overallHealth = Math.round(PHI_INV * 100); // Default to max if no subsystems
  }

  // Collect metrics
  pulseData.metrics = collectMetrics();

  // Detect metric anomalies
  const metricAnomalies = detectMetricAnomalies(pulseData.metrics);
  pulseData.anomalies.push(...metricAnomalies);

  // Update state
  const pulseEnd = Date.now();
  state.lastPulse = pulseData.timestamp;
  state.lastPulseMs = pulseEnd - pulseStart;
  state.currentHealth = pulseData.overallHealth;
  state.metrics.uptimeMs = pulseData.uptimeMs;

  // Record anomalies
  if (pulseData.anomalies.length > 0) {
    state.anomalyCount += pulseData.anomalies.length;
    state.anomalies.push(...pulseData.anomalies.map(a => ({
      ...a,
      timestamp: pulseData.timestamp,
      pulseId: pulseData.id,
    })));

    // Keep only recent anomalies (φ * 100)
    if (state.anomalies.length > HEALTH_HISTORY_SIZE) {
      state.anomalies = state.anomalies.slice(-HEALTH_HISTORY_SIZE);
    }
  }

  // Record health history
  state.healthHistory.push({
    timestamp: pulseData.timestamp,
    health: pulseData.overallHealth,
    subsystemsHealthy: Object.values(pulseData.subsystems).filter(s => s.healthy).length,
    subsystemsTotal: subsystemNames.length,
    anomalyCount: pulseData.anomalies.length,
    pulseMs: state.lastPulseMs,
  });

  // Trim history
  if (state.healthHistory.length > HEALTH_HISTORY_SIZE) {
    state.healthHistory = state.healthHistory.slice(-HEALTH_HISTORY_SIZE);
  }

  // Emit pulse event
  pulseEmitter.emit('pulse', pulseData);

  // Emit anomaly events
  for (const anomaly of pulseData.anomalies) {
    pulseEmitter.emit('anomaly', anomaly);
  }

  // Persist pulse data
  await persistPulse(pulseData);

  return pulseData;
}

// =============================================================================
// METRICS COLLECTION
// =============================================================================

const metricCollectors = new Map();

/**
 * Register a metric collector
 * @param {string} name - Metric name
 * @param {Function} collectFn - Function returning metric value
 */
function registerMetric(name, collectFn) {
  metricCollectors.set(name, collectFn);
}

/**
 * Collect all metrics
 */
function collectMetrics() {
  const metrics = {};

  for (const [name, collectFn] of metricCollectors) {
    try {
      metrics[name] = collectFn();
    } catch (error) {
      metrics[name] = { error: error.message };
    }
  }

  // Add core metrics
  metrics.pulseCount = state.pulseCount;
  metrics.uptimeMs = state.metrics.uptimeMs;
  metrics.lastPulseMs = state.lastPulseMs;
  metrics.healthHistorySize = state.healthHistory.length;
  metrics.anomalyCount = state.anomalyCount;

  return metrics;
}

/**
 * Detect anomalies in metrics by comparing to history
 */
function detectMetricAnomalies(currentMetrics) {
  const anomalies = [];

  if (state.healthHistory.length < 5) {
    return anomalies; // Not enough history
  }

  // Calculate averages from recent history
  const recentHistory = state.healthHistory.slice(-10);
  const avgHealth = recentHistory.reduce((sum, h) => sum + h.health, 0) / recentHistory.length;
  const avgPulseMs = recentHistory.reduce((sum, h) => sum + h.pulseMs, 0) / recentHistory.length;

  // Check health deviation
  if (state.currentHealth !== null) {
    const healthDeviation = Math.abs(state.currentHealth - avgHealth) / avgHealth;
    if (healthDeviation > ANOMALY_THRESHOLD) {
      anomalies.push({
        type: 'health_deviation',
        current: state.currentHealth,
        average: Math.round(avgHealth),
        deviation: Math.round(healthDeviation * 100),
        severity: healthDeviation > PHI_INV ? 'critical' : 'warning',
      });
    }
  }

  // Check pulse time deviation
  if (state.lastPulseMs > 0 && avgPulseMs > 0) {
    const pulseDeviation = (state.lastPulseMs - avgPulseMs) / avgPulseMs;
    if (pulseDeviation > PHI_INV) { // Pulse taking 61.8% longer than average
      anomalies.push({
        type: 'pulse_slowdown',
        currentMs: state.lastPulseMs,
        averageMs: Math.round(avgPulseMs),
        deviation: Math.round(pulseDeviation * 100),
        severity: pulseDeviation > PHI ? 'critical' : 'warning',
      });
    }
  }

  return anomalies;
}

// =============================================================================
// INCREMENT METRICS
// =============================================================================

/**
 * Increment a metric counter
 */
function incrementMetric(name, amount = 1) {
  if (typeof state.metrics[name] === 'number') {
    state.metrics[name] += amount;
  } else {
    state.metrics[name] = amount;
  }
}

/**
 * Record a timing metric
 */
function recordTiming(name, ms) {
  if (!state.metrics[`${name}_samples`]) {
    state.metrics[`${name}_samples`] = 0;
    state.metrics[`${name}_total`] = 0;
    state.metrics[`${name}_avg`] = 0;
    state.metrics[`${name}_max`] = 0;
  }

  state.metrics[`${name}_samples`]++;
  state.metrics[`${name}_total`] += ms;
  state.metrics[`${name}_avg`] = Math.round(state.metrics[`${name}_total`] / state.metrics[`${name}_samples`]);
  state.metrics[`${name}_max`] = Math.max(state.metrics[`${name}_max`], ms);
}

// =============================================================================
// PERSISTENCE
// =============================================================================

const PULSE_DIR = path.join(__dirname, '../../knowledge/live/pulse');

async function ensurePulseDir() {
  try {
    await fs.promises.mkdir(PULSE_DIR, { recursive: true });
  } catch (error) {
    // Ignore if exists
  }
}

async function persistPulse(pulseData) {
  try {
    await ensurePulseDir();

    // Write current state
    const stateFile = path.join(PULSE_DIR, 'current.json');
    await fs.promises.writeFile(stateFile, JSON.stringify({
      alive: state.alive,
      lastPulse: state.lastPulse,
      lastPulseMs: state.lastPulseMs,
      pulseCount: state.pulseCount,
      currentHealth: state.currentHealth,
      uptimeMs: state.metrics.uptimeMs,
      subsystems: state.subsystems,
      metrics: state.metrics,
      anomalyCount: state.anomalyCount,
      recentAnomalies: state.anomalies.slice(-10),
    }, null, 2));

    // Append to history (JSONL)
    const historyFile = path.join(PULSE_DIR, 'history.jsonl');
    await fs.promises.appendFile(historyFile, JSON.stringify({
      id: pulseData.id,
      timestamp: pulseData.timestamp,
      health: pulseData.overallHealth,
      subsystems: Object.fromEntries(
        Object.entries(pulseData.subsystems).map(([k, v]) => [k, v.healthy])
      ),
      anomalyCount: pulseData.anomalies.length,
      pulseMs: state.lastPulseMs,
    }) + '\n');

  } catch (error) {
    console.error('[PULSE] Persist error:', error.message);
  }
}

// =============================================================================
// LIFECYCLE
// =============================================================================

/**
 * Start CYNIC's pulse
 */
async function start() {
  if (state.alive) {
    return { success: false, message: 'Pulse already running' };
  }

  state.startedAt = Date.now();
  state.alive = true;
  state.pulseCount = 0;
  state.healthHistory = [];
  state.anomalies = [];
  state.anomalyCount = 0;

  // Register default subsystems
  registerDefaultSubsystems();

  // Register default metrics
  registerDefaultMetrics();

  // Initial pulse
  await pulse();

  // Start interval
  state._intervalHandle = setInterval(async () => {
    try {
      await pulse();
    } catch (error) {
      console.error('[PULSE] Error during pulse:', error.message);
      state.anomalies.push({
        type: 'pulse_error',
        error: error.message,
        timestamp: new Date().toISOString(),
        severity: 'critical',
      });
    }
  }, PULSE_INTERVAL_MS);

  pulseEmitter.emit('start', { timestamp: new Date().toISOString() });

  return {
    success: true,
    message: 'CYNIC pulse started',
    interval: PULSE_INTERVAL_MS,
    intervalHuman: `${Math.round(PULSE_INTERVAL_MS / 1000)}s (φ⁻¹ * 100)`,
  };
}

/**
 * Stop CYNIC's pulse
 */
function stop() {
  if (!state.alive) {
    return { success: false, message: 'Pulse not running' };
  }

  if (state._intervalHandle) {
    clearInterval(state._intervalHandle);
    state._intervalHandle = null;
  }

  state.alive = false;

  pulseEmitter.emit('stop', {
    timestamp: new Date().toISOString(),
    totalPulses: state.pulseCount,
    uptimeMs: Date.now() - state.startedAt,
  });

  return {
    success: true,
    message: 'CYNIC pulse stopped',
    totalPulses: state.pulseCount,
    uptimeMs: state.metrics.uptimeMs,
  };
}

/**
 * Get current pulse status
 */
function getStatus() {
  return {
    alive: state.alive,
    startedAt: state.startedAt ? new Date(state.startedAt).toISOString() : null,
    lastPulse: state.lastPulse,
    lastPulseMs: state.lastPulseMs,
    pulseCount: state.pulseCount,
    currentHealth: state.currentHealth,
    uptimeMs: state.metrics.uptimeMs,
    uptimeHuman: formatUptime(state.metrics.uptimeMs),
    interval: PULSE_INTERVAL_MS,
    intervalHuman: `${Math.round(PULSE_INTERVAL_MS / 1000)}s`,
    subsystems: state.subsystems,
    metrics: state.metrics,
    anomalyCount: state.anomalyCount,
    recentAnomalies: state.anomalies.slice(-5),
    healthTrend: calculateHealthTrend(),
  };
}

/**
 * Get health history
 */
function getHealthHistory(limit = 50) {
  return state.healthHistory.slice(-limit);
}

/**
 * Get all anomalies
 */
function getAnomalies(limit = 50) {
  return state.anomalies.slice(-limit);
}

/**
 * Calculate health trend
 */
function calculateHealthTrend() {
  if (state.healthHistory.length < 5) {
    return { trend: 'unknown', samples: state.healthHistory.length };
  }

  const recent = state.healthHistory.slice(-5);
  const older = state.healthHistory.slice(-10, -5);

  if (older.length === 0) {
    return { trend: 'unknown', samples: recent.length };
  }

  const recentAvg = recent.reduce((sum, h) => sum + h.health, 0) / recent.length;
  const olderAvg = older.reduce((sum, h) => sum + h.health, 0) / older.length;

  const change = recentAvg - olderAvg;

  return {
    trend: change > 2 ? 'improving' : change < -2 ? 'degrading' : 'stable',
    recentAvg: Math.round(recentAvg),
    olderAvg: Math.round(olderAvg),
    change: Math.round(change * 10) / 10,
    samples: state.healthHistory.length,
  };
}

/**
 * Format uptime as human readable
 */
function formatUptime(ms) {
  if (!ms || ms < 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// =============================================================================
// DEFAULT SUBSYSTEMS
// =============================================================================

function registerDefaultSubsystems() {
  // File system check
  registerSubsystem('filesystem', async () => {
    const knowledgeDir = path.join(__dirname, '../../knowledge');
    try {
      await fs.promises.access(knowledgeDir, fs.constants.R_OK | fs.constants.W_OK);
      const stats = await fs.promises.stat(knowledgeDir);
      return {
        healthy: true,
        details: {
          path: knowledgeDir,
          accessible: true,
          isDirectory: stats.isDirectory(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: error.message },
      };
    }
  });

  // Memory check
  registerSubsystem('memory', async () => {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const heapPercent = Math.round((used.heapUsed / used.heapTotal) * 100);

    // Unhealthy if using more than 85% of heap
    const healthy = heapPercent < 85;

    return {
      healthy,
      details: {
        heapUsedMB,
        heapTotalMB,
        heapPercent,
        rssMB: Math.round(used.rss / 1024 / 1024),
      },
    };
  });

  // Event loop check (basic)
  registerSubsystem('eventLoop', async () => {
    const start = Date.now();
    await new Promise(resolve => setImmediate(resolve));
    const latency = Date.now() - start;

    // Unhealthy if event loop is blocked (>100ms)
    const healthy = latency < 100;

    return {
      healthy,
      details: {
        latencyMs: latency,
        status: latency < 10 ? 'excellent' : latency < 50 ? 'good' : latency < 100 ? 'degraded' : 'blocked',
      },
      responseMs: latency,
    };
  });

  // Knowledge freshness check
  registerSubsystem('knowledge', async () => {
    try {
      const liveDir = path.join(__dirname, '../../knowledge/live');
      const files = await fs.promises.readdir(liveDir);

      let newestMs = 0;
      for (const file of files) {
        const stat = await fs.promises.stat(path.join(liveDir, file));
        if (stat.mtimeMs > newestMs) {
          newestMs = stat.mtimeMs;
        }
      }

      const ageMs = Date.now() - newestMs;
      const ageHours = Math.round(ageMs / 1000 / 60 / 60 * 10) / 10;

      // Unhealthy if no updates in 24 hours
      const healthy = ageMs < 24 * 60 * 60 * 1000;

      return {
        healthy,
        details: {
          fileCount: files.length,
          newestUpdateMs: newestMs,
          ageHours,
          status: ageHours < 1 ? 'fresh' : ageHours < 6 ? 'recent' : ageHours < 24 ? 'aging' : 'stale',
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: error.message },
      };
    }
  });
}

// =============================================================================
// DEFAULT METRICS
// =============================================================================

function registerDefaultMetrics() {
  registerMetric('processUptime', () => Math.round(process.uptime()));
  registerMetric('memoryHeapMB', () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024));
  registerMetric('memoryRssMB', () => Math.round(process.memoryUsage().rss / 1024 / 1024));
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Lifecycle
  start,
  stop,
  pulse,

  // Status
  getStatus,
  getHealthHistory,
  getAnomalies,

  // Registration
  registerSubsystem,
  unregisterSubsystem,
  registerMetric,

  // Metrics
  incrementMetric,
  recordTiming,
  collectMetrics,

  // Events
  on: (event, handler) => pulseEmitter.on(event, handler),
  off: (event, handler) => pulseEmitter.off(event, handler),
  once: (event, handler) => pulseEmitter.once(event, handler),

  // Constants
  PULSE_INTERVAL_MS,
  HEALTH_HISTORY_SIZE,
  ANOMALY_THRESHOLD,
  PHI,
  PHI_INV,
  PHI_INV_2,
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== CYNIC Pulse CLI ===\n');

  console.log('Starting pulse...');
  start().then(result => {
    console.log('Result:', result);
    console.log('\nStatus:', JSON.stringify(getStatus(), null, 2));

    console.log('\nWaiting for 3 pulses...');

    let pulsesSeen = 0;
    pulseEmitter.on('pulse', (data) => {
      pulsesSeen++;
      console.log(`\nPulse #${data.id}:`);
      console.log('  Health:', data.overallHealth);
      console.log('  Subsystems:', Object.keys(data.subsystems).map(k =>
        `${k}:${data.subsystems[k].healthy ? '✓' : '✗'}`
      ).join(' '));
      console.log('  Anomalies:', data.anomalies.length);

      if (pulsesSeen >= 3) {
        console.log('\n--- Final Status ---');
        console.log(JSON.stringify(getStatus(), null, 2));

        console.log('\nStopping...');
        stop();
        process.exit(0);
      }
    });

    pulseEmitter.on('anomaly', (anomaly) => {
      console.log(`  [ANOMALY] ${anomaly.type}: ${anomaly.severity}`);
    });
  });
}
