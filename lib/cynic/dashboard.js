/**
 * CYNIC Dashboard - Terminal-based Monitoring View
 *
 * "φ qui se voit en un coup d'œil."
 *
 * Provides real-time terminal dashboard for CYNIC ecosystem monitoring:
 * - Health overview with φ-based thresholds
 * - Active alerts with severity coloring
 * - Metrics summary
 * - Subsystem status grid
 * - Recent anomalies
 * - Pulse heartbeat indicator
 */

'use strict';

const pulse = require('./pulse');
const selfMonitor = require('./self-monitor');
const metrics = require('./metrics');
const alerts = require('./alerts');

// =============================================================================
// PHI CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;                    // 0.618 = 61.8%
const PHI_INV_2 = 1 / (PHI * PHI);          // 0.382 = 38.2%
const PHI_INV_3 = 1 / (PHI * PHI * PHI);    // 0.236 = 23.6%

// Thresholds
const THRESHOLDS = {
  HEALTHY: Math.round(PHI_INV * 100),       // 62
  WARNING: Math.round(PHI_INV_2 * 100),     // 38
  CRITICAL: Math.round(PHI_INV_3 * 100),    // 24
};

// =============================================================================
// ANSI COLORS
// =============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Color text based on health score
 */
function colorByHealth(score, text) {
  if (score >= THRESHOLDS.HEALTHY) {
    return `${COLORS.green}${text}${COLORS.reset}`;
  } else if (score >= THRESHOLDS.WARNING) {
    return `${COLORS.yellow}${text}${COLORS.reset}`;
  } else {
    return `${COLORS.red}${text}${COLORS.reset}`;
  }
}

/**
 * Color text by severity
 */
function colorBySeverity(severity, text) {
  switch (severity) {
    case 'critical':
      return `${COLORS.red}${COLORS.bold}${text}${COLORS.reset}`;
    case 'warning':
      return `${COLORS.yellow}${text}${COLORS.reset}`;
    case 'info':
      return `${COLORS.cyan}${text}${COLORS.reset}`;
    default:
      return text;
  }
}

/**
 * Format duration in human readable form
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${Math.round(ms / 3600000)}h`;
}

/**
 * Create a progress bar
 */
function progressBar(value, max = 100, width = 20) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  let color = COLORS.green;
  if (percent < THRESHOLDS.WARNING) color = COLORS.red;
  else if (percent < THRESHOLDS.HEALTHY) color = COLORS.yellow;

  return `${color}${'█'.repeat(filled)}${COLORS.dim}${'░'.repeat(empty)}${COLORS.reset}`;
}

/**
 * Center text in a given width
 */
function center(text, width) {
  const padding = Math.max(0, width - text.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

/**
 * Pad right
 */
function padRight(text, width) {
  return text + ' '.repeat(Math.max(0, width - text.length));
}

/**
 * Pad left
 */
function padLeft(text, width) {
  return ' '.repeat(Math.max(0, width - text.length)) + text;
}

// =============================================================================
// DASHBOARD SECTIONS
// =============================================================================

/**
 * Generate header section
 */
function generateHeader() {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const pulseStatus = pulse.getStatus();
  const heartbeat = pulseStatus.alive ? `${COLORS.green}♥${COLORS.reset}` : `${COLORS.dim}♡${COLORS.reset}`;

  return [
    `${COLORS.cyan}${COLORS.bold}╔════════════════════════════════════════════════════════════════════════╗${COLORS.reset}`,
    `${COLORS.cyan}${COLORS.bold}║${COLORS.reset}${center(`${heartbeat} CYNIC DASHBOARD - φ qui se méfie de φ ${heartbeat}`, 72)}${COLORS.cyan}${COLORS.bold}║${COLORS.reset}`,
    `${COLORS.cyan}${COLORS.bold}║${COLORS.reset}${center(now, 72)}${COLORS.cyan}${COLORS.bold}║${COLORS.reset}`,
    `${COLORS.cyan}${COLORS.bold}╚════════════════════════════════════════════════════════════════════════╝${COLORS.reset}`,
  ].join('\n');
}

/**
 * Generate health overview section
 */
async function generateHealthOverview() {
  const pulseStatus = pulse.getStatus();
  const diagnostic = await selfMonitor.runQuickCheck();

  const health = diagnostic.overallScore || 0;
  const healthColor = colorByHealth(health, `${health}%`);
  const statusText = health >= THRESHOLDS.HEALTHY ? 'HEALTHY' :
                     health >= THRESHOLDS.WARNING ? 'WARNING' : 'CRITICAL';
  const statusColored = colorByHealth(health, statusText);

  const lines = [
    '',
    `${COLORS.bold}┌─ HEALTH OVERVIEW ─────────────────────────────────────────────────────┐${COLORS.reset}`,
    `│                                                                        │`,
    `│  Overall Health: ${progressBar(health)} ${healthColor} ${statusColored}${' '.repeat(Math.max(0, 20 - statusText.length - health.toString().length))}│`,
    `│                                                                        │`,
  ];

  // Add component health
  if (diagnostic.components) {
    lines.push(`│  Components:                                                           │`);
    for (const [name, comp] of Object.entries(diagnostic.components)) {
      const score = comp.score || 0;
      const icon = comp.healthy ? `${COLORS.green}✓${COLORS.reset}` : `${COLORS.red}✗${COLORS.reset}`;
      const scoreColored = colorByHealth(score, `${score}%`);
      lines.push(`│    ${icon} ${padRight(name, 20)} ${progressBar(score, 100, 15)} ${scoreColored}${' '.repeat(Math.max(0, 15 - score.toString().length))}│`);
    }
  }

  // Pulse info
  if (pulseStatus.alive) {
    lines.push(`│                                                                        │`);
    lines.push(`│  Pulse: ${COLORS.green}ALIVE${COLORS.reset} | Beats: ${pulseStatus.pulseCount} | Uptime: ${formatDuration(pulseStatus.uptime)}${' '.repeat(Math.max(0, 30 - formatDuration(pulseStatus.uptime).length - pulseStatus.pulseCount.toString().length))}│`);
  } else {
    lines.push(`│                                                                        │`);
    lines.push(`│  Pulse: ${COLORS.dim}NOT STARTED${COLORS.reset}${' '.repeat(51)}│`);
  }

  lines.push(`│                                                                        │`);
  lines.push(`${COLORS.bold}└────────────────────────────────────────────────────────────────────────┘${COLORS.reset}`);

  return lines.join('\n');
}

/**
 * Generate alerts section
 */
function generateAlerts() {
  const active = alerts.getActive();
  const stats = alerts.getStats();

  const lines = [
    '',
    `${COLORS.bold}┌─ ALERTS ───────────────────────────────────────────────────────────────┐${COLORS.reset}`,
    `│                                                                        │`,
  ];

  // Stats line
  const criticalCount = active.filter(a => a.severity === 'critical').length;
  const warningCount = active.filter(a => a.severity === 'warning').length;
  const infoCount = active.filter(a => a.severity === 'info').length;

  lines.push(`│  Active: ${colorBySeverity('critical', `${criticalCount} critical`)} | ${colorBySeverity('warning', `${warningCount} warning`)} | ${colorBySeverity('info', `${infoCount} info`)}${' '.repeat(Math.max(0, 25 - criticalCount.toString().length - warningCount.toString().length - infoCount.toString().length))}│`);
  lines.push(`│  Total fired: ${stats.totalFired} | Resolved: ${stats.totalResolved} | Rules: ${stats.registeredRules}${' '.repeat(Math.max(0, 20 - stats.totalFired.toString().length - stats.totalResolved.toString().length - stats.registeredRules.toString().length))}│`);
  lines.push(`│                                                                        │`);

  // Active alerts (max 5)
  if (active.length > 0) {
    lines.push(`│  ${COLORS.bold}Active Alerts:${COLORS.reset}                                                      │`);
    const displayAlerts = active.slice(0, 5);
    for (const alert of displayAlerts) {
      const severity = alert.severity.toUpperCase().slice(0, 4);
      const severityColored = colorBySeverity(alert.severity, padRight(severity, 4));
      const message = alert.message.slice(0, 50);
      const duration = formatDuration(Date.now() - new Date(alert.firedAt).getTime());
      lines.push(`│    ${severityColored} ${padRight(message, 50)} ${padLeft(duration, 6)} │`);
    }
    if (active.length > 5) {
      lines.push(`│    ${COLORS.dim}... and ${active.length - 5} more${COLORS.reset}${' '.repeat(53)}│`);
    }
  } else {
    lines.push(`│  ${COLORS.green}No active alerts - CYNIC is calm${COLORS.reset}${' '.repeat(37)}│`);
  }

  lines.push(`│                                                                        │`);
  lines.push(`${COLORS.bold}└────────────────────────────────────────────────────────────────────────┘${COLORS.reset}`);

  return lines.join('\n');
}

/**
 * Generate metrics section
 */
function generateMetrics() {
  const summary = metrics.getSummary();

  const lines = [
    '',
    `${COLORS.bold}┌─ METRICS ──────────────────────────────────────────────────────────────┐${COLORS.reset}`,
    `│                                                                        │`,
  ];

  // Judgments
  if (summary.judgments) {
    const j = summary.judgments;
    lines.push(`│  ${COLORS.bold}Judgments:${COLORS.reset}                                                          │`);
    lines.push(`│    Total: ${j.total || 0} | Accepted: ${j.accepted || 0} | Rejected: ${j.rejected || 0} | Improved: ${j.improved || 0}${' '.repeat(Math.max(0, 15))}│`);
    if (j.avgConfidence) {
      lines.push(`│    Avg Confidence: ${j.avgConfidence.toFixed(1)}% | Avg Latency: ${j.avgLatency?.toFixed(0) || 0}ms${' '.repeat(30)}│`);
    }
  }

  // Integrations
  if (summary.integrations) {
    const i = summary.integrations;
    lines.push(`│                                                                        │`);
    lines.push(`│  ${COLORS.bold}Integrations:${COLORS.reset}                                                       │`);
    lines.push(`│    Events: ${i.eventsReceived || 0} received | ${i.eventsProcessed || 0} processed | ${i.eventsRejected || 0} rejected${' '.repeat(Math.max(0, 15))}│`);
  }

  // Resources
  if (summary.resources) {
    const r = summary.resources;
    lines.push(`│                                                                        │`);
    lines.push(`│  ${COLORS.bold}Resources:${COLORS.reset}                                                          │`);
    const heapMB = Math.round((r.heapUsed || 0) / 1024 / 1024);
    const heapTotalMB = Math.round((r.heapTotal || 0) / 1024 / 1024);
    const heapPercent = heapTotalMB > 0 ? Math.round((heapMB / heapTotalMB) * 100) : 0;
    lines.push(`│    Heap: ${heapMB}MB / ${heapTotalMB}MB (${heapPercent}%) | Event Loop: ${r.eventLoopLag || 0}ms${' '.repeat(Math.max(0, 20))}│`);
  }

  // Pulse
  if (summary.pulse) {
    const p = summary.pulse;
    lines.push(`│                                                                        │`);
    lines.push(`│  ${COLORS.bold}Pulse:${COLORS.reset}                                                              │`);
    lines.push(`│    Beats: ${p.beats || 0} | Anomalies: ${p.anomalies || 0} | Avg Health: ${(p.avgHealth || 0).toFixed(1)}%${' '.repeat(Math.max(0, 20))}│`);
  }

  lines.push(`│                                                                        │`);
  lines.push(`${COLORS.bold}└────────────────────────────────────────────────────────────────────────┘${COLORS.reset}`);

  return lines.join('\n');
}

/**
 * Generate anomalies section
 */
function generateAnomalies() {
  const anomalies = pulse.getAnomalies(5);

  const lines = [
    '',
    `${COLORS.bold}┌─ RECENT ANOMALIES ─────────────────────────────────────────────────────┐${COLORS.reset}`,
    `│                                                                        │`,
  ];

  if (anomalies.length > 0) {
    for (const anomaly of anomalies) {
      const type = padRight(anomaly.type || 'unknown', 20);
      const severity = anomaly.severity || 'unknown';
      const severityColored = colorBySeverity(severity, padRight(severity, 8));
      const time = new Date(anomaly.timestamp).toLocaleTimeString();
      lines.push(`│    ${severityColored} ${type} ${time}${' '.repeat(Math.max(0, 28 - time.length))}│`);
    }
  } else {
    lines.push(`│  ${COLORS.green}No anomalies detected${COLORS.reset}${' '.repeat(49)}│`);
  }

  lines.push(`│                                                                        │`);
  lines.push(`${COLORS.bold}└────────────────────────────────────────────────────────────────────────┘${COLORS.reset}`);

  return lines.join('\n');
}

/**
 * Generate footer
 */
function generateFooter() {
  return [
    '',
    `${COLORS.dim}─────────────────────────────────────────────────────────────────────────────${COLORS.reset}`,
    `${COLORS.dim}Thresholds: HEALTHY ≥ ${THRESHOLDS.HEALTHY}% (φ⁻¹) | WARNING ≥ ${THRESHOLDS.WARNING}% (φ⁻²) | CRITICAL < ${THRESHOLDS.WARNING}%${COLORS.reset}`,
    `${COLORS.dim}Pulse interval: ${Math.round(PHI_INV * 100)}s | "φ qui se voit en un coup d'œil."${COLORS.reset}`,
    '',
  ].join('\n');
}

// =============================================================================
// MAIN DASHBOARD FUNCTIONS
// =============================================================================

/**
 * Generate complete dashboard
 */
async function generate() {
  const sections = [
    generateHeader(),
    await generateHealthOverview(),
    generateAlerts(),
    generateMetrics(),
    generateAnomalies(),
    generateFooter(),
  ];

  return sections.join('\n');
}

/**
 * Generate compact dashboard (for embedding)
 */
async function generateCompact() {
  const pulseStatus = pulse.getStatus();
  const diagnostic = await selfMonitor.runQuickCheck();
  const active = alerts.getActive();
  const anomalies = pulse.getAnomalies(3);

  const health = diagnostic.overallScore || 0;
  const heartbeat = pulseStatus.alive ? '♥' : '♡';

  return {
    header: `${heartbeat} CYNIC ${colorByHealth(health, `${health}%`)}`,
    health: {
      score: health,
      status: health >= THRESHOLDS.HEALTHY ? 'healthy' : health >= THRESHOLDS.WARNING ? 'warning' : 'critical',
      components: diagnostic.components,
    },
    pulse: {
      alive: pulseStatus.alive,
      beats: pulseStatus.pulseCount,
      uptime: pulseStatus.uptime,
    },
    alerts: {
      critical: active.filter(a => a.severity === 'critical').length,
      warning: active.filter(a => a.severity === 'warning').length,
      info: active.filter(a => a.severity === 'info').length,
      recent: active.slice(0, 3).map(a => ({
        severity: a.severity,
        message: a.message.slice(0, 50),
      })),
    },
    anomalies: anomalies.length,
  };
}

/**
 * Generate JSON dashboard data
 */
async function generateJSON() {
  const pulseStatus = pulse.getStatus();
  const diagnostic = await selfMonitor.runFullDiagnostic();
  const activeAlerts = alerts.getActive();
  const alertStats = alerts.getStats();
  const metricsData = metrics.getAll();
  const anomalies = pulse.getAnomalies(20);
  const healthHistory = pulse.getHealthHistory(50);

  return {
    timestamp: new Date().toISOString(),
    health: {
      score: diagnostic.overallScore,
      status: diagnostic.healthy ? 'healthy' : 'degraded',
      components: diagnostic.components,
      trend: pulseStatus.healthTrend,
    },
    pulse: {
      alive: pulseStatus.alive,
      beats: pulseStatus.pulseCount,
      uptime: pulseStatus.uptime,
      intervalMs: Math.round(PHI_INV * 100 * 1000),
    },
    alerts: {
      active: activeAlerts,
      stats: alertStats,
    },
    metrics: metricsData,
    anomalies,
    healthHistory,
    thresholds: THRESHOLDS,
    phi: {
      PHI,
      PHI_INV,
      PHI_INV_2,
      PHI_INV_3,
    },
  };
}

/**
 * Print dashboard to console
 */
async function print() {
  const dashboard = await generate();
  console.log(dashboard);
}

/**
 * Start live dashboard (refresh on pulse)
 */
function startLive(clear = true) {
  let running = true;

  const refresh = async () => {
    if (!running) return;

    if (clear) {
      // Clear terminal
      process.stdout.write('\x1b[2J\x1b[H');
    }

    await print();
  };

  // Initial render
  refresh();

  // Refresh on pulse
  pulse.on('pulse', refresh);

  // Return stop function
  return () => {
    running = false;
    pulse.off('pulse', refresh);
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  generate,
  generateCompact,
  generateJSON,
  print,
  startLive,
  THRESHOLDS,
  COLORS,
  // Helpers
  colorByHealth,
  colorBySeverity,
  formatDuration,
  progressBar,
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--live')) {
    console.log('Starting live dashboard (Ctrl+C to exit)...\n');

    // Start pulse if not running
    const pulseStatus = pulse.getStatus();
    if (!pulseStatus.alive) {
      selfMonitor.registerWithPulse(pulse);
      pulse.start();
    }

    startLive(true);

    // Handle exit
    process.on('SIGINT', () => {
      pulse.stop();
      process.exit(0);
    });
  } else if (args.includes('--json')) {
    generateJSON().then(data => {
      console.log(JSON.stringify(data, null, 2));
    });
  } else if (args.includes('--compact')) {
    generateCompact().then(data => {
      console.log(JSON.stringify(data, null, 2));
    });
  } else {
    print();
  }
}
