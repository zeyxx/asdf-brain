/**
 * CYNIC Web Dashboard - HTML-based Monitoring View
 *
 * "φ qui se voit dans le navigateur."
 *
 * Generates beautiful HTML dashboard for CYNIC ecosystem monitoring:
 * - Responsive design with φ-based proportions
 * - Real-time updates via SSE or polling
 * - Charts for health history and metrics
 * - Alert timeline
 * - Dark theme with φ-golden accents
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
const PHI_INV = 1 / PHI;
const PHI_INV_2 = 1 / (PHI * PHI);

const THRESHOLDS = {
  HEALTHY: Math.round(PHI_INV * 100),
  WARNING: Math.round(PHI_INV_2 * 100),
  CRITICAL: Math.round(PHI_INV_2 * PHI_INV * 100),
};

// =============================================================================
// HTML TEMPLATES
// =============================================================================

/**
 * Generate CSS styles
 */
function generateStyles() {
  return `
<style>
  :root {
    --phi: 1.618;
    --phi-inv: 0.618;
    --phi-inv-2: 0.382;

    --bg-primary: #0d1117;
    --bg-secondary: #161b22;
    --bg-tertiary: #21262d;
    --text-primary: #f0f6fc;
    --text-secondary: #8b949e;
    --text-muted: #484f58;

    --accent-gold: #d4a017;
    --accent-phi: #c9a227;
    --success: #3fb950;
    --warning: #d29922;
    --error: #f85149;
    --info: #58a6ff;

    --border-color: #30363d;
    --shadow: 0 8px 24px rgba(0,0,0,0.4);

    --radius: 8px;
    --radius-lg: 12px;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.618;
    min-height: 100vh;
    padding: 24px;
  }

  .dashboard {
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 32px;
    padding: 24px;
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
  }

  .header h1 {
    font-size: 2.618rem;
    color: var(--accent-gold);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .header .heartbeat {
    animation: pulse 1.618s infinite;
    color: var(--error);
  }

  .header .heartbeat.alive {
    color: var(--success);
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }

  .header .subtitle {
    color: var(--text-secondary);
    font-style: italic;
  }

  .header .timestamp {
    color: var(--text-muted);
    font-size: 0.875rem;
    margin-top: 8px;
  }

  /* Grid Layout */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 24px;
    margin-bottom: 24px;
  }

  .grid-full {
    grid-column: 1 / -1;
  }

  /* Cards */
  .card {
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    overflow: hidden;
  }

  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-header h2 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-header .badge {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 500;
  }

  .badge-success { background: rgba(63, 185, 80, 0.2); color: var(--success); }
  .badge-warning { background: rgba(210, 153, 34, 0.2); color: var(--warning); }
  .badge-error { background: rgba(248, 81, 73, 0.2); color: var(--error); }
  .badge-info { background: rgba(88, 166, 255, 0.2); color: var(--info); }

  .card-body {
    padding: 20px;
  }

  /* Health Score */
  .health-score {
    text-align: center;
    padding: 32px;
  }

  .health-score .score {
    font-size: 4rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 8px;
  }

  .health-score .score.healthy { color: var(--success); }
  .health-score .score.warning { color: var(--warning); }
  .health-score .score.critical { color: var(--error); }

  .health-score .label {
    font-size: 1.25rem;
    color: var(--text-secondary);
    margin-bottom: 24px;
  }

  .progress-bar {
    height: 8px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .progress-bar .fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.618s ease;
  }

  .progress-bar .fill.healthy { background: linear-gradient(90deg, var(--success), #2ea043); }
  .progress-bar .fill.warning { background: linear-gradient(90deg, var(--warning), #bb8009); }
  .progress-bar .fill.critical { background: linear-gradient(90deg, var(--error), #da3633); }

  /* Components Grid */
  .components {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-top: 24px;
  }

  .component {
    background: var(--bg-tertiary);
    padding: 12px;
    border-radius: var(--radius);
    text-align: center;
  }

  .component .icon {
    font-size: 1.5rem;
    margin-bottom: 4px;
  }

  .component .name {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .component .score {
    font-size: 1.25rem;
    font-weight: 600;
  }

  /* Alerts */
  .alert-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .alert-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: var(--bg-tertiary);
    border-radius: var(--radius);
    border-left: 3px solid;
  }

  .alert-item.critical { border-left-color: var(--error); }
  .alert-item.warning { border-left-color: var(--warning); }
  .alert-item.info { border-left-color: var(--info); }

  .alert-item .severity {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .alert-item.critical .severity { background: rgba(248, 81, 73, 0.2); color: var(--error); }
  .alert-item.warning .severity { background: rgba(210, 153, 34, 0.2); color: var(--warning); }
  .alert-item.info .severity { background: rgba(88, 166, 255, 0.2); color: var(--info); }

  .alert-item .message {
    flex: 1;
    font-size: 0.875rem;
  }

  .alert-item .time {
    font-size: 0.75rem;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .no-alerts {
    text-align: center;
    padding: 32px;
    color: var(--text-muted);
  }

  .no-alerts .icon {
    font-size: 2rem;
    margin-bottom: 8px;
    color: var(--success);
  }

  /* Metrics */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
  }

  .metric {
    text-align: center;
    padding: 16px;
    background: var(--bg-tertiary);
    border-radius: var(--radius);
  }

  .metric .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent-gold);
  }

  .metric .label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }

  /* Pulse Info */
  .pulse-info {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 16px;
    background: var(--bg-tertiary);
    border-radius: var(--radius);
  }

  .pulse-stat {
    text-align: center;
  }

  .pulse-stat .value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .pulse-stat .label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* Footer */
  .footer {
    text-align: center;
    padding: 24px;
    color: var(--text-muted);
    font-size: 0.875rem;
    border-top: 1px solid var(--border-color);
    margin-top: 32px;
  }

  .footer .phi-values {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-bottom: 8px;
  }

  .footer .phi-value {
    color: var(--accent-phi);
  }

  /* Responsive */
  @media (max-width: 768px) {
    body { padding: 12px; }
    .header h1 { font-size: 1.618rem; }
    .grid { grid-template-columns: 1fr; }
    .health-score .score { font-size: 3rem; }
  }
</style>
`;
}

/**
 * Format duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Get health status class
 */
function getHealthClass(score) {
  if (score >= THRESHOLDS.HEALTHY) return 'healthy';
  if (score >= THRESHOLDS.WARNING) return 'warning';
  return 'critical';
}

/**
 * Generate HTML dashboard
 */
async function generateHTML() {
  const pulseStatus = pulse.getStatus();
  const diagnostic = await selfMonitor.runFullDiagnostic();
  const activeAlerts = alerts.getActive();
  const alertStats = alerts.getStats();
  const metricsData = metrics.getSummary();

  const health = diagnostic.overallScore || 0;
  const healthClass = getHealthClass(health);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // Generate component cards
  let componentsHTML = '';
  if (diagnostic.components) {
    for (const [name, comp] of Object.entries(diagnostic.components)) {
      const icon = comp.healthy ? '✓' : '✗';
      const iconColor = comp.healthy ? 'var(--success)' : 'var(--error)';
      componentsHTML += `
        <div class="component">
          <div class="icon" style="color: ${iconColor}">${icon}</div>
          <div class="name">${name}</div>
          <div class="score" style="color: ${comp.healthy ? 'var(--success)' : 'var(--error)'}">${comp.score || 0}%</div>
        </div>
      `;
    }
  }

  // Generate alerts HTML
  let alertsHTML = '';
  if (activeAlerts.length > 0) {
    alertsHTML = '<div class="alert-list">';
    for (const alert of activeAlerts.slice(0, 10)) {
      const duration = formatDuration(Date.now() - new Date(alert.firedAt).getTime());
      alertsHTML += `
        <div class="alert-item ${alert.severity}">
          <span class="severity">${alert.severity}</span>
          <span class="message">${alert.message}</span>
          <span class="time">${duration} ago</span>
        </div>
      `;
    }
    alertsHTML += '</div>';
  } else {
    alertsHTML = `
      <div class="no-alerts">
        <div class="icon">✓</div>
        <div>No active alerts - CYNIC is calm</div>
      </div>
    `;
  }

  // Generate metrics HTML
  const j = metricsData.judgments || {};
  const i = metricsData.integrations || {};
  const r = metricsData.resources || {};

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🐕 CYNIC - κυνικός | The Skeptical Dog</title>
  <meta http-equiv="refresh" content="62">
  ${generateStyles()}
</head>
<body>
  <div class="dashboard">
    <header class="header">
      <h1>
        <span class="heartbeat ${pulseStatus.alive ? 'alive' : ''}">♥</span>
        🐕 CYNIC - κυνικός
        <span class="heartbeat ${pulseStatus.alive ? 'alive' : ''}">♥</span>
      </h1>
      <div class="subtitle">"Loyal to truth, not to comfort" | Culture is a moat</div>
      <div class="timestamp">${now} UTC</div>
    </header>

    <div class="grid">
      <!-- Health Card -->
      <div class="card">
        <div class="card-header">
          <h2>🏥 Health Overview</h2>
          <span class="badge badge-${healthClass}">${healthClass.toUpperCase()}</span>
        </div>
        <div class="card-body">
          <div class="health-score">
            <div class="score ${healthClass}">${health}%</div>
            <div class="label">Overall Health Score</div>
            <div class="progress-bar">
              <div class="fill ${healthClass}" style="width: ${health}%"></div>
            </div>
          </div>
          <div class="components">
            ${componentsHTML}
          </div>
        </div>
      </div>

      <!-- Alerts Card -->
      <div class="card">
        <div class="card-header">
          <h2>🚨 Active Alerts</h2>
          <span class="badge badge-${activeAlerts.length > 0 ? (activeAlerts.some(a => a.severity === 'critical') ? 'error' : 'warning') : 'success'}">
            ${activeAlerts.length} active
          </span>
        </div>
        <div class="card-body">
          ${alertsHTML}
        </div>
      </div>

      <!-- Metrics Card -->
      <div class="card">
        <div class="card-header">
          <h2>📊 Metrics</h2>
        </div>
        <div class="card-body">
          <div class="metrics-grid">
            <div class="metric">
              <div class="value">${j.total || 0}</div>
              <div class="label">Judgments</div>
            </div>
            <div class="metric">
              <div class="value">${j.accepted || 0}</div>
              <div class="label">Accepted</div>
            </div>
            <div class="metric">
              <div class="value">${i.eventsReceived || 0}</div>
              <div class="label">Events</div>
            </div>
            <div class="metric">
              <div class="value">${alertStats.totalFired || 0}</div>
              <div class="label">Alerts Fired</div>
            </div>
            <div class="metric">
              <div class="value">${alertStats.registeredRules || 0}</div>
              <div class="label">Rules</div>
            </div>
            <div class="metric">
              <div class="value">${Math.round((r.heapUsed || 0) / 1024 / 1024)}MB</div>
              <div class="label">Memory</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pulse Card -->
      <div class="card">
        <div class="card-header">
          <h2>💓 Pulse</h2>
          <span class="badge badge-${pulseStatus.alive ? 'success' : 'warning'}">
            ${pulseStatus.alive ? 'ALIVE' : 'STOPPED'}
          </span>
        </div>
        <div class="card-body">
          <div class="pulse-info">
            <div class="pulse-stat">
              <div class="value">${pulseStatus.pulseCount || 0}</div>
              <div class="label">Beats</div>
            </div>
            <div class="pulse-stat">
              <div class="value">${formatDuration(pulseStatus.uptime || 0)}</div>
              <div class="label">Uptime</div>
            </div>
            <div class="pulse-stat">
              <div class="value">${pulseStatus.anomalyCount || 0}</div>
              <div class="label">Anomalies</div>
            </div>
            <div class="pulse-stat">
              <div class="value">${Math.round(PHI_INV * 100)}s</div>
              <div class="label">Interval</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="footer">
      <div class="phi-values">
        <span>φ = <span class="phi-value">${PHI.toFixed(6)}</span></span>
        <span>HEALTHY ≥ <span class="phi-value">${THRESHOLDS.HEALTHY}%</span></span>
        <span>WARNING ≥ <span class="phi-value">${THRESHOLDS.WARNING}%</span></span>
      </div>
      <div>CYNIC - "φ qui se voit dans le navigateur."</div>
    </footer>
  </div>
</body>
</html>
`;
}

/**
 * Generate API JSON response
 */
async function generateAPIResponse() {
  const pulseStatus = pulse.getStatus();
  const diagnostic = await selfMonitor.runFullDiagnostic();
  const activeAlerts = alerts.getActive();
  const alertStats = alerts.getStats();
  const metricsData = metrics.getAll();
  const anomalies = pulse.getAnomalies(20);
  const healthHistory = pulse.getHealthHistory(100);

  return {
    timestamp: new Date().toISOString(),
    health: {
      score: diagnostic.overallScore,
      status: getHealthClass(diagnostic.overallScore),
      components: diagnostic.components,
    },
    pulse: {
      alive: pulseStatus.alive,
      beats: pulseStatus.pulseCount,
      uptime: pulseStatus.uptime,
      trend: pulseStatus.healthTrend,
    },
    alerts: {
      active: activeAlerts.map(a => ({
        id: a.id,
        severity: a.severity,
        message: a.message,
        firedAt: a.firedAt,
        acknowledged: a.acknowledged,
      })),
      stats: alertStats,
    },
    metrics: metricsData,
    anomalies,
    history: healthHistory.slice(0, 50),
    thresholds: THRESHOLDS,
  };
}

/**
 * Create simple HTTP server for dashboard
 */
function createServer(port = 3003) {
  const http = require('http');

  const server = http.createServer(async (req, res) => {
    if (req.url === '/api' || req.url === '/api/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const data = await generateAPIResponse();
      res.end(JSON.stringify(data, null, 2));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const html = await generateHTML();
      res.end(html);
    }
  });

  server.listen(port, () => {
    console.log(`[DASHBOARD-WEB] Server running at http://localhost:${port}`);
    console.log(`[DASHBOARD-WEB] API endpoint: http://localhost:${port}/api`);
  });

  return server;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  generateHTML,
  generateAPIResponse,
  createServer,
  THRESHOLDS,
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const port = parseInt(args.find(a => a.startsWith('--port='))?.split('=')[1] || '3003');

  if (args.includes('--serve')) {
    // Start pulse if not running
    const pulseStatus = pulse.getStatus();
    if (!pulseStatus.alive) {
      selfMonitor.registerWithPulse(pulse);
      alerts.connectToPulse(pulse);
      pulse.start();
    }

    createServer(port);
  } else if (args.includes('--json')) {
    generateAPIResponse().then(data => {
      console.log(JSON.stringify(data, null, 2));
    });
  } else {
    generateHTML().then(html => {
      console.log(html);
    });
  }
}
