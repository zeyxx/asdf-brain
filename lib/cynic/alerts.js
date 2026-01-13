/**
 * CYNIC Alerts - Acting on Anomalies
 *
 * "φ qui réagit."
 *
 * Alert system for CYNIC self-monitoring:
 * - Alert rules with conditions and thresholds
 * - Severity levels (critical, warning, info)
 * - Alert deduplication and grouping
 * - Notification channels (extensible)
 * - Alert history and acknowledgment
 * - Escalation policies
 *
 * Works with pulse.js and self-monitor.js to act on detected issues.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// =============================================================================
// PHI CONSTANTS
// =============================================================================

// φ constants - Import from Single Source of Truth (FIXED 2026-01-13)
const { PHI, PHI_INV, PHI_INV_2 } = require('./axioms/constants');

// =============================================================================
// ALERT SEVERITY
// =============================================================================

const SEVERITY = {
  CRITICAL: {
    level: 3,
    name: 'critical',
    emoji: '🔴',
    description: 'Immediate action required',
    escalateAfterMs: Math.round(5 * 60 * 1000 * PHI_INV),  // ~3 min
  },
  WARNING: {
    level: 2,
    name: 'warning',
    emoji: '🟡',
    description: 'Attention needed',
    escalateAfterMs: Math.round(30 * 60 * 1000 * PHI_INV), // ~18 min
  },
  INFO: {
    level: 1,
    name: 'info',
    emoji: '🔵',
    description: 'For your information',
    escalateAfterMs: null, // No escalation
  },
};

// =============================================================================
// ALERT STATE
// =============================================================================

const state = {
  // Active alerts (not acknowledged)
  active: new Map(),

  // Alert history
  history: [],
  historyMaxSize: Math.round(PHI * 500), // ~809 entries

  // Acknowledged alerts
  acknowledged: new Map(),

  // Silenced rules (temporarily disabled)
  silenced: new Map(),

  // Alert statistics
  stats: {
    totalFired: 0,
    totalAcknowledged: 0,
    totalResolved: 0,
    totalEscalated: 0,
    bySeverity: {
      critical: 0,
      warning: 0,
      info: 0,
    },
  },

  // Registered rules
  rules: new Map(),

  // Notification channels
  channels: new Map(),

  // Started
  running: false,
};

// Event emitter for alert events
const alertEmitter = new EventEmitter();

// =============================================================================
// ALERT STRUCTURE
// =============================================================================

/**
 * Create an alert object
 */
function createAlert(rule, context = {}) {
  const now = Date.now();
  const severity = SEVERITY[rule.severity?.toUpperCase()] || SEVERITY.WARNING;

  return {
    id: `alert_${now}_${Math.random().toString(36).substr(2, 9)}`,
    ruleId: rule.id,
    ruleName: rule.name,
    severity: severity.name,
    severityLevel: severity.level,
    emoji: severity.emoji,
    message: formatMessage(rule.message, context),
    description: rule.description || '',
    context,
    firedAt: new Date(now).toISOString(),
    firedAtMs: now,
    escalateAt: severity.escalateAfterMs ? new Date(now + severity.escalateAfterMs).toISOString() : null,
    escalated: false,
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
    resolved: false,
    resolvedAt: null,
    notified: [],
    fingerprint: generateFingerprint(rule, context),
  };
}

/**
 * Format alert message with context variables
 */
function formatMessage(template, context) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return context[key] !== undefined ? context[key] : match;
  });
}

/**
 * Generate fingerprint for deduplication
 */
function generateFingerprint(rule, context) {
  const parts = [rule.id];

  // Add key context values to fingerprint
  if (context.subsystem) parts.push(context.subsystem);
  if (context.source) parts.push(context.source);
  if (context.metric) parts.push(context.metric);

  return parts.join(':');
}

// =============================================================================
// RULE MANAGEMENT
// =============================================================================

/**
 * Register an alert rule
 */
function registerRule(rule) {
  if (!rule.id || !rule.name) {
    throw new Error('Rule must have id and name');
  }

  const fullRule = {
    id: rule.id,
    name: rule.name,
    description: rule.description || '',
    severity: rule.severity || 'warning',
    message: rule.message || rule.name,
    condition: rule.condition || (() => false),
    throttleMs: rule.throttleMs || Math.round(60 * 1000 * PHI_INV), // ~37s default
    autoResolve: rule.autoResolve !== false,
    enabled: rule.enabled !== false,
    channels: rule.channels || ['default'],
    metadata: rule.metadata || {},
    lastFired: null,
    fireCount: 0,
  };

  state.rules.set(rule.id, fullRule);
  return fullRule;
}

/**
 * Unregister a rule
 */
function unregisterRule(ruleId) {
  return state.rules.delete(ruleId);
}

/**
 * Get a rule by ID
 */
function getRule(ruleId) {
  return state.rules.get(ruleId);
}

/**
 * Get all rules
 */
function getAllRules() {
  return Array.from(state.rules.values());
}

/**
 * Enable/disable a rule
 */
function setRuleEnabled(ruleId, enabled) {
  const rule = state.rules.get(ruleId);
  if (rule) {
    rule.enabled = enabled;
    return true;
  }
  return false;
}

/**
 * Silence a rule for a duration
 */
function silenceRule(ruleId, durationMs) {
  const expiresAt = Date.now() + durationMs;
  state.silenced.set(ruleId, expiresAt);
  return { ruleId, expiresAt: new Date(expiresAt).toISOString() };
}

/**
 * Unsilence a rule
 */
function unsilenceRule(ruleId) {
  return state.silenced.delete(ruleId);
}

/**
 * Check if rule is silenced
 */
function isRuleSilenced(ruleId) {
  const expiresAt = state.silenced.get(ruleId);
  if (!expiresAt) return false;

  if (Date.now() > expiresAt) {
    state.silenced.delete(ruleId);
    return false;
  }

  return true;
}

// =============================================================================
// CHANNEL MANAGEMENT
// =============================================================================

/**
 * Register a notification channel
 */
function registerChannel(name, handler) {
  state.channels.set(name, handler);
}

/**
 * Default channel - logs to console and emits event
 */
registerChannel('default', async (alert) => {
  const prefix = `[ALERT ${alert.emoji} ${alert.severity.toUpperCase()}]`;
  console.log(`${prefix} ${alert.ruleName}: ${alert.message}`);
  alertEmitter.emit('alert', alert);
  return { success: true, channel: 'default' };
});

/**
 * File channel - writes to alerts log
 */
registerChannel('file', async (alert) => {
  try {
    const alertsDir = path.join(__dirname, '../../knowledge/live/alerts');
    await fs.promises.mkdir(alertsDir, { recursive: true });

    const logFile = path.join(alertsDir, 'alerts.jsonl');
    await fs.promises.appendFile(logFile, JSON.stringify({
      timestamp: alert.firedAt,
      severity: alert.severity,
      rule: alert.ruleId,
      message: alert.message,
      context: alert.context,
    }) + '\n');

    return { success: true, channel: 'file' };
  } catch (error) {
    return { success: false, channel: 'file', error: error.message };
  }
});

/**
 * Webhook channel - sends to URL (for future Discord/X integration)
 */
registerChannel('webhook', async (alert, options = {}) => {
  const { url } = options;
  if (!url) {
    return { success: false, channel: 'webhook', error: 'No URL configured' };
  }

  try {
    // Placeholder for webhook implementation
    // In future: fetch(url, { method: 'POST', body: JSON.stringify(alert) })
    console.log(`[WEBHOOK] Would send to ${url}:`, alert.message);
    return { success: true, channel: 'webhook', url };
  } catch (error) {
    return { success: false, channel: 'webhook', error: error.message };
  }
});

// =============================================================================
// ALERT FIRING
// =============================================================================

/**
 * Fire an alert from a rule
 */
async function fire(ruleId, context = {}) {
  const rule = state.rules.get(ruleId);
  if (!rule) {
    return { success: false, error: `Unknown rule: ${ruleId}` };
  }

  // Check if rule is enabled
  if (!rule.enabled) {
    return { success: false, error: 'Rule is disabled' };
  }

  // Check if rule is silenced
  if (isRuleSilenced(ruleId)) {
    return { success: false, error: 'Rule is silenced' };
  }

  // Check throttling
  if (rule.lastFired && (Date.now() - rule.lastFired) < rule.throttleMs) {
    return { success: false, error: 'Throttled' };
  }

  // Create alert
  const alert = createAlert(rule, context);

  // Check for duplicate (same fingerprint in active alerts)
  const existing = state.active.get(alert.fingerprint);
  if (existing && !existing.resolved) {
    // Update existing alert instead of creating new
    existing.context = { ...existing.context, ...context };
    existing.lastSeenAt = alert.firedAt;
    existing.occurrences = (existing.occurrences || 1) + 1;
    return { success: true, alert: existing, deduplicated: true };
  }

  // Store alert
  state.active.set(alert.fingerprint, alert);

  // Update history
  state.history.push({
    id: alert.id,
    ruleId: alert.ruleId,
    severity: alert.severity,
    message: alert.message,
    firedAt: alert.firedAt,
    fingerprint: alert.fingerprint,
  });

  if (state.history.length > state.historyMaxSize) {
    state.history = state.history.slice(-state.historyMaxSize);
  }

  // Update stats
  state.stats.totalFired++;
  state.stats.bySeverity[alert.severity]++;
  rule.lastFired = Date.now();
  rule.fireCount++;

  // Send to channels
  const notifications = [];
  for (const channelName of rule.channels) {
    const channel = state.channels.get(channelName);
    if (channel) {
      try {
        const result = await channel(alert, rule.metadata);
        notifications.push(result);
        alert.notified.push({ channel: channelName, at: new Date().toISOString() });
      } catch (error) {
        notifications.push({ success: false, channel: channelName, error: error.message });
      }
    }
  }

  // Emit event
  alertEmitter.emit('fired', alert);

  return { success: true, alert, notifications };
}

/**
 * Check a rule's condition and fire if true
 */
async function check(ruleId, data = {}) {
  const rule = state.rules.get(ruleId);
  if (!rule || !rule.enabled) return { fired: false };

  try {
    const shouldFire = await rule.condition(data);
    if (shouldFire) {
      const context = typeof shouldFire === 'object' ? shouldFire : data;
      return await fire(ruleId, context);
    }
    return { fired: false };
  } catch (error) {
    return { fired: false, error: error.message };
  }
}

/**
 * Check all rules against data
 */
async function checkAll(data = {}) {
  const results = [];

  for (const [ruleId, rule] of state.rules) {
    if (!rule.enabled) continue;

    const result = await check(ruleId, data);
    if (result.success) {
      results.push(result);
    }
  }

  return results;
}

// =============================================================================
// ALERT MANAGEMENT
// =============================================================================

/**
 * Acknowledge an alert
 */
function acknowledge(alertId, by = 'system') {
  for (const [fingerprint, alert] of state.active) {
    if (alert.id === alertId || fingerprint === alertId) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      alert.acknowledgedBy = by;
      state.acknowledged.set(fingerprint, alert);
      state.stats.totalAcknowledged++;
      alertEmitter.emit('acknowledged', alert);
      return { success: true, alert };
    }
  }
  return { success: false, error: 'Alert not found' };
}

/**
 * Resolve an alert
 */
function resolve(alertId, reason = 'manual') {
  for (const [fingerprint, alert] of state.active) {
    if (alert.id === alertId || fingerprint === alertId) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      alert.resolveReason = reason;
      state.active.delete(fingerprint);
      state.acknowledged.delete(fingerprint);
      state.stats.totalResolved++;
      alertEmitter.emit('resolved', alert);
      return { success: true, alert };
    }
  }
  return { success: false, error: 'Alert not found' };
}

/**
 * Auto-resolve alerts when condition is no longer true
 */
async function autoResolve(data = {}) {
  const resolved = [];

  for (const [fingerprint, alert] of state.active) {
    if (alert.resolved) continue;

    const rule = state.rules.get(alert.ruleId);
    if (!rule || !rule.autoResolve) continue;

    try {
      const stillActive = await rule.condition(data);
      if (!stillActive) {
        resolve(alert.id, 'auto');
        resolved.push(alert);
      }
    } catch {
      // Ignore errors during auto-resolve check
    }
  }

  return resolved;
}

/**
 * Escalate overdue alerts
 */
function escalate() {
  const escalated = [];
  const now = Date.now();

  for (const [fingerprint, alert] of state.active) {
    if (alert.escalated || alert.resolved || alert.acknowledged) continue;
    if (!alert.escalateAt) continue;

    const escalateAtMs = new Date(alert.escalateAt).getTime();
    if (now > escalateAtMs) {
      alert.escalated = true;
      alert.escalatedAt = new Date().toISOString();
      state.stats.totalEscalated++;
      alertEmitter.emit('escalated', alert);
      escalated.push(alert);

      // Log escalation
      console.log(`[ALERT ESCALATED ${alert.emoji}] ${alert.ruleName}: ${alert.message}`);
    }
  }

  return escalated;
}

// =============================================================================
// STATUS & QUERIES
// =============================================================================

/**
 * Get active alerts
 */
function getActive(options = {}) {
  const { severity, ruleId, limit = 50 } = options;

  let alerts = Array.from(state.active.values())
    .filter(a => !a.resolved);

  if (severity) {
    alerts = alerts.filter(a => a.severity === severity);
  }

  if (ruleId) {
    alerts = alerts.filter(a => a.ruleId === ruleId);
  }

  // Sort by severity (highest first), then by time (newest first)
  alerts.sort((a, b) => {
    if (b.severityLevel !== a.severityLevel) {
      return b.severityLevel - a.severityLevel;
    }
    return b.firedAtMs - a.firedAtMs;
  });

  return alerts.slice(0, limit);
}

/**
 * Get alert history
 */
function getHistory(options = {}) {
  const { severity, ruleId, limit = 50, since } = options;

  let history = [...state.history];

  if (severity) {
    history = history.filter(h => h.severity === severity);
  }

  if (ruleId) {
    history = history.filter(h => h.ruleId === ruleId);
  }

  if (since) {
    const sinceMs = new Date(since).getTime();
    history = history.filter(h => new Date(h.firedAt).getTime() > sinceMs);
  }

  // Most recent first
  history.reverse();

  return history.slice(0, limit);
}

/**
 * Get alert statistics
 */
function getStats() {
  const activeByServeity = {
    critical: 0,
    warning: 0,
    info: 0,
  };

  for (const alert of state.active.values()) {
    if (!alert.resolved) {
      activeByServeity[alert.severity]++;
    }
  }

  return {
    ...state.stats,
    activeCount: state.active.size,
    activeByServeity,
    acknowledgedCount: state.acknowledged.size,
    silencedRules: state.silenced.size,
    registeredRules: state.rules.size,
    registeredChannels: state.channels.size,
  };
}

/**
 * Get full status
 */
function getStatus() {
  return {
    running: state.running,
    stats: getStats(),
    activeAlerts: getActive({ limit: 10 }),
    recentHistory: getHistory({ limit: 10 }),
    rules: getAllRules().map(r => ({
      id: r.id,
      name: r.name,
      severity: r.severity,
      enabled: r.enabled,
      fireCount: r.fireCount,
      lastFired: r.lastFired ? new Date(r.lastFired).toISOString() : null,
    })),
    silenced: Array.from(state.silenced.entries()).map(([id, exp]) => ({
      ruleId: id,
      expiresAt: new Date(exp).toISOString(),
    })),
  };
}

// =============================================================================
// PULSE INTEGRATION
// =============================================================================

/**
 * Process pulse data and check for alerts
 */
async function processPulse(pulseData) {
  const results = [];

  // Check all rules with pulse data
  const fired = await checkAll(pulseData);
  results.push(...fired);

  // Auto-resolve cleared conditions
  const resolved = await autoResolve(pulseData);

  // Check for escalations
  const escalated = escalate();

  return {
    fired: fired.length,
    resolved: resolved.length,
    escalated: escalated.length,
    details: {
      fired,
      resolved,
      escalated,
    },
  };
}

/**
 * Connect to pulse system
 */
function connectToPulse(pulse) {
  if (!pulse || !pulse.on) {
    console.warn('[ALERTS] Cannot connect to pulse - invalid pulse module');
    return false;
  }

  // Listen for pulse events
  pulse.on('pulse', async (pulseData) => {
    await processPulse(pulseData);
  });

  // Listen for anomaly events
  pulse.on('anomaly', async (anomaly) => {
    // Convert anomaly to alert context
    await fire('anomaly_detected', {
      type: anomaly.type,
      severity: anomaly.severity,
      ...anomaly,
    });
  });

  state.running = true;
  console.log('[ALERTS] Connected to pulse system');
  return true;
}

// =============================================================================
// PERSISTENCE
// =============================================================================

const ALERTS_DIR = path.join(__dirname, '../../knowledge/live/alerts');

async function persistState() {
  try {
    await fs.promises.mkdir(ALERTS_DIR, { recursive: true });

    // Write current state
    const stateFile = path.join(ALERTS_DIR, 'state.json');
    await fs.promises.writeFile(stateFile, JSON.stringify({
      stats: state.stats,
      activeCount: state.active.size,
      historyCount: state.history.length,
      savedAt: new Date().toISOString(),
    }, null, 2));

    // Write active alerts
    const activeFile = path.join(ALERTS_DIR, 'active.json');
    await fs.promises.writeFile(activeFile, JSON.stringify(
      Array.from(state.active.values()),
      null, 2
    ));

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Rule management
  registerRule,
  unregisterRule,
  getRule,
  getAllRules,
  setRuleEnabled,
  silenceRule,
  unsilenceRule,

  // Channel management
  registerChannel,

  // Alert firing
  fire,
  check,
  checkAll,

  // Alert management
  acknowledge,
  resolve,
  autoResolve,
  escalate,

  // Queries
  getActive,
  getHistory,
  getStats,
  getStatus,

  // Pulse integration
  processPulse,
  connectToPulse,

  // Persistence
  persistState,

  // Events
  on: (event, handler) => alertEmitter.on(event, handler),
  off: (event, handler) => alertEmitter.off(event, handler),
  once: (event, handler) => alertEmitter.once(event, handler),

  // Constants
  SEVERITY,
  PHI,
  PHI_INV,
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== CYNIC Alerts CLI ===\n');

  // Register test rules
  registerRule({
    id: 'test_critical',
    name: 'Test Critical Alert',
    severity: 'critical',
    message: 'This is a test critical alert',
    condition: (data) => data.testCritical === true,
  });

  registerRule({
    id: 'test_warning',
    name: 'Test Warning Alert',
    severity: 'warning',
    message: 'Health dropped to {health}%',
    condition: (data) => data.health && data.health < 50,
  });

  console.log('Rules registered:', getAllRules().length);
  console.log('Channels:', Array.from(state.channels.keys()).join(', '));

  console.log('\n--- Firing test alerts ---');

  fire('test_critical', { testCritical: true }).then(result => {
    console.log('Critical result:', result.success);

    return fire('test_warning', { health: 35 });
  }).then(result => {
    console.log('Warning result:', result.success);

    console.log('\n--- Status ---');
    const status = getStatus();
    console.log('Active alerts:', status.stats.activeCount);
    console.log('Total fired:', status.stats.totalFired);

    for (const alert of status.activeAlerts) {
      console.log(`  ${alert.emoji} ${alert.ruleName}: ${alert.message}`);
    }

    console.log('\nDone.');
  });
}
