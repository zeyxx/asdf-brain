/**
 * CYNIC Alert Rules - Predefined Monitoring Rules
 *
 * "φ sait quand réagir."
 *
 * Defines all alert rules for CYNIC ecosystem monitoring:
 * - Health degradation
 * - Subsystem failures
 * - Integration issues
 * - Resource exhaustion
 * - Anomaly patterns
 *
 * All thresholds follow φ-based values.
 */

'use strict';

const alerts = require('./alerts');

// =============================================================================
// PHI CONSTANTS - Import from Single Source of Truth (FIXED 2026-01-13)
// =============================================================================

const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = require('./axioms/constants');

// Thresholds
const THRESHOLDS = {
  HEALTH_CRITICAL: Math.round(PHI_INV_3 * 100),  // 24
  HEALTH_WARNING: Math.round(PHI_INV_2 * 100),   // 38
  HEALTH_DEGRADED: Math.round(PHI_INV * 100),    // 62

  MEMORY_WARNING: 70,
  MEMORY_CRITICAL: 85,

  EVENT_LOOP_WARNING: 100,  // ms
  EVENT_LOOP_CRITICAL: 500, // ms

  CONSECUTIVE_FAILURES: 3,
  CONSECUTIVE_CRITICAL: 5,

  STALE_HOURS: 24,
  STALE_WARNING_HOURS: 12,
};

// =============================================================================
// HEALTH RULES
// =============================================================================

const healthRules = [
  {
    id: 'health_critical',
    name: 'Critical Health Level',
    description: 'Overall CYNIC health has dropped to critical levels',
    severity: 'critical',
    message: 'CYNIC health critical: {health}% (threshold: {threshold}%)',
    condition: (data) => {
      if (data.overallHealth !== undefined && data.overallHealth < THRESHOLDS.HEALTH_CRITICAL) {
        return { health: data.overallHealth, threshold: THRESHOLDS.HEALTH_CRITICAL };
      }
      return false;
    },
    throttleMs: 60000, // 1 minute
    channels: ['default', 'file'],
  },

  {
    id: 'health_warning',
    name: 'Low Health Warning',
    description: 'Overall CYNIC health is below optimal levels',
    severity: 'warning',
    message: 'CYNIC health degraded: {health}% (threshold: {threshold}%)',
    condition: (data) => {
      if (data.overallHealth !== undefined &&
          data.overallHealth >= THRESHOLDS.HEALTH_CRITICAL &&
          data.overallHealth < THRESHOLDS.HEALTH_WARNING) {
        return { health: data.overallHealth, threshold: THRESHOLDS.HEALTH_WARNING };
      }
      return false;
    },
    throttleMs: 300000, // 5 minutes
    channels: ['default', 'file'],
  },

  {
    id: 'health_rapid_decline',
    name: 'Rapid Health Decline',
    description: 'Health is declining faster than expected',
    severity: 'warning',
    message: 'Health declining rapidly: {change}% in recent pulses',
    condition: (data) => {
      if (data.healthTrend && data.healthTrend.trend === 'degrading' && data.healthTrend.change < -10) {
        return { change: data.healthTrend.change };
      }
      return false;
    },
    throttleMs: 600000, // 10 minutes
    channels: ['default', 'file'],
  },
];

// =============================================================================
// SUBSYSTEM RULES
// =============================================================================

const subsystemRules = [
  {
    id: 'subsystem_down',
    name: 'Subsystem Down',
    description: 'A CYNIC subsystem is not responding',
    severity: 'critical',
    message: 'Subsystem {subsystem} is DOWN: {error}',
    condition: (data) => {
      if (data.subsystems) {
        for (const [name, status] of Object.entries(data.subsystems)) {
          if (status.healthy === false && status.consecutiveFailures >= THRESHOLDS.CONSECUTIVE_CRITICAL) {
            return {
              subsystem: name,
              error: status.details?.error || 'Not responding',
              failures: status.consecutiveFailures,
            };
          }
        }
      }
      return false;
    },
    throttleMs: 120000, // 2 minutes
    channels: ['default', 'file'],
  },

  {
    id: 'subsystem_degraded',
    name: 'Subsystem Degraded',
    description: 'A CYNIC subsystem is experiencing issues',
    severity: 'warning',
    message: 'Subsystem {subsystem} degraded: {failures} consecutive failures',
    condition: (data) => {
      if (data.subsystems) {
        for (const [name, status] of Object.entries(data.subsystems)) {
          if (status.healthy === false &&
              status.consecutiveFailures >= THRESHOLDS.CONSECUTIVE_FAILURES &&
              status.consecutiveFailures < THRESHOLDS.CONSECUTIVE_CRITICAL) {
            return {
              subsystem: name,
              failures: status.consecutiveFailures,
            };
          }
        }
      }
      return false;
    },
    throttleMs: 300000, // 5 minutes
    channels: ['default', 'file'],
  },
];

// =============================================================================
// INTEGRATION RULES
// =============================================================================

const integrationRules = [
  {
    id: 'integration_holdex_down',
    name: 'HolDex Integration Down',
    description: 'HolDex integration is not working',
    severity: 'critical',
    message: 'HolDex integration down: {error}',
    condition: (data) => {
      if (data.subsystems?.holdex?.healthy === false &&
          data.subsystems?.holdex?.consecutiveFailures >= THRESHOLDS.CONSECUTIVE_FAILURES) {
        return { error: data.subsystems.holdex.details?.error || 'Connection failed' };
      }
      return false;
    },
    throttleMs: 180000, // 3 minutes
    channels: ['default', 'file'],
  },

  {
    id: 'integration_gasdf_down',
    name: 'GASdf Integration Down',
    description: 'GASdf integration is not working',
    severity: 'critical',
    message: 'GASdf integration down: {error}',
    condition: (data) => {
      if (data.subsystems?.gasdf?.healthy === false &&
          data.subsystems?.gasdf?.consecutiveFailures >= THRESHOLDS.CONSECUTIVE_FAILURES) {
        return { error: data.subsystems.gasdf.details?.error || 'Connection failed' };
      }
      return false;
    },
    throttleMs: 180000, // 3 minutes
    channels: ['default', 'file'],
  },

  {
    id: 'integration_claudemem_down',
    name: 'Claude-Mem Integration Down',
    description: 'Claude-Mem sync is not working',
    severity: 'warning',
    message: 'Claude-Mem sync down: {error}',
    condition: (data) => {
      if (data.subsystems?.claudeMem?.healthy === false &&
          data.subsystems?.claudeMem?.consecutiveFailures >= THRESHOLDS.CONSECUTIVE_FAILURES) {
        return { error: data.subsystems.claudeMem.details?.error || 'Sync failed' };
      }
      return false;
    },
    throttleMs: 600000, // 10 minutes
    channels: ['default', 'file'],
  },

  {
    id: 'integration_no_events',
    name: 'No Integration Events',
    description: 'No events received from integrations recently',
    severity: 'info',
    message: 'No integration events in the last {hours} hours',
    condition: (data) => {
      // Check if all integrations have stale data
      const holdexStale = data.subsystems?.holdex?.details?.ageHours > THRESHOLDS.STALE_WARNING_HOURS;
      const gasdfStale = data.subsystems?.gasdf?.details?.ageHours > THRESHOLDS.STALE_WARNING_HOURS;

      if (holdexStale && gasdfStale) {
        return { hours: THRESHOLDS.STALE_WARNING_HOURS };
      }
      return false;
    },
    throttleMs: 3600000, // 1 hour
    channels: ['default'],
  },
];

// =============================================================================
// RESOURCE RULES
// =============================================================================

const resourceRules = [
  {
    id: 'memory_critical',
    name: 'Critical Memory Usage',
    description: 'Memory usage is critically high',
    severity: 'critical',
    message: 'Memory usage critical: {heapPercent}% of heap used',
    condition: (data) => {
      if (data.subsystems?.resources?.details?.heapPercent >= THRESHOLDS.MEMORY_CRITICAL) {
        return { heapPercent: data.subsystems.resources.details.heapPercent };
      }
      return false;
    },
    throttleMs: 60000, // 1 minute
    channels: ['default', 'file'],
  },

  {
    id: 'memory_warning',
    name: 'High Memory Usage',
    description: 'Memory usage is higher than optimal',
    severity: 'warning',
    message: 'Memory usage high: {heapPercent}% of heap used',
    condition: (data) => {
      const heapPercent = data.subsystems?.resources?.details?.heapPercent;
      if (heapPercent >= THRESHOLDS.MEMORY_WARNING && heapPercent < THRESHOLDS.MEMORY_CRITICAL) {
        return { heapPercent };
      }
      return false;
    },
    throttleMs: 300000, // 5 minutes
    channels: ['default', 'file'],
  },

  {
    id: 'event_loop_blocked',
    name: 'Event Loop Blocked',
    description: 'Event loop is experiencing high latency',
    severity: 'critical',
    message: 'Event loop blocked: {latencyMs}ms latency',
    condition: (data) => {
      if (data.subsystems?.eventLoop?.details?.latencyMs >= THRESHOLDS.EVENT_LOOP_CRITICAL) {
        return { latencyMs: data.subsystems.eventLoop.details.latencyMs };
      }
      return false;
    },
    throttleMs: 60000, // 1 minute
    channels: ['default', 'file'],
  },

  {
    id: 'event_loop_slow',
    name: 'Event Loop Slow',
    description: 'Event loop latency is higher than optimal',
    severity: 'warning',
    message: 'Event loop slow: {latencyMs}ms latency',
    condition: (data) => {
      const latency = data.subsystems?.eventLoop?.details?.latencyMs;
      if (latency >= THRESHOLDS.EVENT_LOOP_WARNING && latency < THRESHOLDS.EVENT_LOOP_CRITICAL) {
        return { latencyMs: latency };
      }
      return false;
    },
    throttleMs: 300000, // 5 minutes
    channels: ['default', 'file'],
  },
];

// =============================================================================
// KNOWLEDGE RULES
// =============================================================================

const knowledgeRules = [
  {
    id: 'knowledge_stale',
    name: 'Knowledge Stale',
    description: 'Knowledge base has not been updated recently',
    severity: 'warning',
    message: 'Knowledge stale: last update {ageHours} hours ago',
    condition: (data) => {
      if (data.subsystems?.knowledge?.details?.ageHours >= THRESHOLDS.STALE_HOURS) {
        return { ageHours: Math.round(data.subsystems.knowledge.details.ageHours) };
      }
      return false;
    },
    throttleMs: 3600000, // 1 hour
    channels: ['default', 'file'],
  },

  {
    id: 'selfjudge_failing',
    name: 'Self-Judge Failing',
    description: 'CYNIC self-judge is not functioning',
    severity: 'critical',
    message: 'Self-judge failing: {error}',
    condition: (data) => {
      if (data.subsystems?.selfJudge?.healthy === false) {
        return { error: data.subsystems.selfJudge.details?.error || 'Judgment failed' };
      }
      return false;
    },
    throttleMs: 120000, // 2 minutes
    channels: ['default', 'file'],
  },
];

// =============================================================================
// ANOMALY RULES
// =============================================================================

const anomalyRules = [
  {
    id: 'anomaly_detected',
    name: 'Anomaly Detected',
    description: 'An anomaly was detected by pulse monitoring',
    severity: 'warning',
    message: 'Anomaly: {type} - {severity}',
    condition: (data) => {
      // This is triggered directly by pulse anomaly events
      if (data.type && data.type.startsWith('anomaly')) {
        return data;
      }
      return false;
    },
    throttleMs: 60000, // 1 minute
    channels: ['default', 'file'],
  },

  {
    id: 'multiple_anomalies',
    name: 'Multiple Anomalies',
    description: 'Multiple anomalies detected in recent pulses',
    severity: 'warning',
    message: '{count} anomalies detected in recent history',
    condition: (data) => {
      if (data.anomalies && data.anomalies.length >= 5) {
        return { count: data.anomalies.length };
      }
      return false;
    },
    throttleMs: 600000, // 10 minutes
    channels: ['default', 'file'],
  },

  {
    id: 'pulse_slowdown',
    name: 'Pulse Slowdown',
    description: 'Pulse checks are taking longer than expected',
    severity: 'warning',
    message: 'Pulse slowdown: {currentMs}ms (avg: {averageMs}ms)',
    condition: (data) => {
      // Check for pulse slowdown anomaly in pulse data
      if (data.anomalies) {
        const slowdown = data.anomalies.find(a => a.type === 'pulse_slowdown');
        if (slowdown) {
          return slowdown;
        }
      }
      return false;
    },
    throttleMs: 300000, // 5 minutes
    channels: ['default', 'file'],
  },
];

// =============================================================================
// GIT INTELLIGENCE RULES (CYNIC-enabled)
// =============================================================================

const gitRules = [
  {
    id: 'git_pr_needed',
    name: 'New PR Needed',
    description: 'Commits exist after a merged PR - new PR should be created',
    severity: 'warning',
    message: 'PR needed: {repo} has {commits} commits since PR #{prNumber} was merged',
    condition: (data) => {
      // Check git data for new_pr_needed suggestions
      if (data.git?.alertable) {
        const prNeeded = data.git.alertable.find(s =>
          s.type === 'new_pr_needed' && (s._cynic?.shouldAlert || s.priority === 'high')
        );
        if (prNeeded) {
          return {
            repo: prNeeded.repo,
            commits: prNeeded.message.match(/(\d+) commits/)?.[1] || '?',
            prNumber: prNeeded.message.match(/PR #(\d+)/)?.[1] || '?',
          };
        }
      }
      return false;
    },
    throttleMs: 1800000, // 30 minutes
    channels: ['default', 'file'],
  },

  {
    id: 'git_prod_drift',
    name: 'Production Drift Detected',
    description: 'Code has drifted significantly from production branch',
    severity: 'warning',
    message: 'Drift alert: {repo} is {ahead} commits ahead of production',
    condition: (data) => {
      if (data.git?.alertable) {
        const drift = data.git.alertable.find(s =>
          s.type === 'prod_drift' && (s._cynic?.shouldAlert || s.priority === 'high')
        );
        if (drift) {
          return {
            repo: drift.repo,
            ahead: drift.message.match(/(\d+) commits/)?.[1] || '?',
          };
        }
      }
      return false;
    },
    throttleMs: 3600000, // 1 hour
    channels: ['default', 'file'],
  },

  {
    id: 'git_multiple_problems',
    name: 'Multiple Git Problems',
    description: 'Multiple git problems detected across ecosystem',
    severity: 'warning',
    message: 'Git attention needed: {count} problems across {repos} repos',
    condition: (data) => {
      if (data.git?.alertable && data.git.alertable.length >= 3) {
        const repos = [...new Set(data.git.alertable.map(s => s.repo))];
        return {
          count: data.git.alertable.length,
          repos: repos.length,
        };
      }
      return false;
    },
    throttleMs: 3600000, // 1 hour
    channels: ['default'],
  },

  {
    id: 'git_cynic_alert',
    name: 'CYNIC Git Alert',
    description: 'CYNIC flagged a git problem as needing attention',
    severity: 'info',
    message: 'CYNIC flagged: {repo} - {type} (score: {score})',
    condition: (data) => {
      if (data.git?.alertable) {
        // Find problems that CYNIC specifically flagged (REJECT verdict)
        const cynicAlert = data.git.alertable.find(s =>
          s._cynic?.verdict === 'REJECT'
        );
        if (cynicAlert) {
          return {
            repo: cynicAlert.repo,
            type: cynicAlert.type,
            score: cynicAlert._cynic.globalScore?.toFixed(2) || '?',
          };
        }
      }
      return false;
    },
    throttleMs: 1800000, // 30 minutes
    channels: ['default'],
  },
];

// =============================================================================
// ALL RULES
// =============================================================================

const allRules = [
  ...healthRules,
  ...subsystemRules,
  ...integrationRules,
  ...resourceRules,
  ...knowledgeRules,
  ...anomalyRules,
  ...gitRules,
];

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register all predefined rules
 */
function registerAll() {
  let registered = 0;

  for (const rule of allRules) {
    try {
      alerts.registerRule(rule);
      registered++;
    } catch (error) {
      console.error(`Failed to register rule ${rule.id}:`, error.message);
    }
  }

  console.log(`[ALERT-RULES] Registered ${registered}/${allRules.length} rules`);
  return registered;
}

/**
 * Get rules by category
 */
function getRulesByCategory(category) {
  switch (category) {
    case 'health':
      return healthRules;
    case 'subsystem':
      return subsystemRules;
    case 'integration':
      return integrationRules;
    case 'resource':
      return resourceRules;
    case 'knowledge':
      return knowledgeRules;
    case 'anomaly':
      return anomalyRules;
    case 'git':
      return gitRules;
    default:
      return allRules;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  registerAll,
  getRulesByCategory,
  allRules,
  healthRules,
  subsystemRules,
  integrationRules,
  resourceRules,
  knowledgeRules,
  anomalyRules,
  gitRules,
  THRESHOLDS,
};

// =============================================================================
// AUTO-REGISTER ON LOAD
// =============================================================================

// Register all rules when module is loaded
registerAll();
