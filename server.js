#!/usr/bin/env node
/**
 * asdf-brain server
 *
 * Unified server for Dashboard + MCP over SSE
 * Following $asdfasdfa: "Don't trust, verify" - all data from verified sources
 *
 * Endpoints:
 * - GET /              → Dashboard
 * - GET /health        → Health check
 * - GET /api/health    → Ecosystem health JSON
 * - GET /api/patterns  → Patterns JSON
 * - GET /api/search    → Search endpoint
 * - GET /api/ecosystem → Ecosystem graph
 * - GET /api/vision    → Roadmap items
 * - GET /sse           → MCP over SSE
 * - POST /mcp          → MCP JSON-RPC
 * - GET /cynic         → CYNIC Dashboard (HTML)
 * - GET /cynic/api     → CYNIC Dashboard (JSON)
 * - GET /cynic/status  → CYNIC Pulse status
 */

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PHI, PHI_2, PHI_INV } = require('./lib/temporal');

// CYNIC modules
const cynicDashboard = require('./lib/cynic/dashboard');
const cynicDashboardWeb = require('./lib/cynic/dashboard-web');
const cynicPulse = require('./lib/cynic/pulse');
const cynicSelfMonitor = require('./lib/cynic/self-monitor');
const cynicAlerts = require('./lib/cynic/alerts');
const cynicRealtime = require('./lib/cynic/realtime');
const { getStore } = require('./lib/cynic/store');

const app = express();
const PORT = process.env.PORT || 3001;
const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');

// CYNIC Store (PostgreSQL persistence)
let cynicStore = null;

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

// API keys for authenticated access (comma-separated in env)
const API_KEYS = new Set(
  (process.env.BRAIN_API_KEYS || '').split(',').filter(k => k.length > 0)
);

// Rate limiting state
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || 60; // requests per window

// Allowed origins for CORS
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .filter(o => o.length > 0);

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Rate limiter
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return next();
  }

  const limit = rateLimits.get(ip);
  if (now > limit.resetAt) {
    limit.count = 1;
    limit.resetAt = now + RATE_LIMIT_WINDOW;
    return next();
  }

  limit.count++;
  if (limit.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((limit.resetAt - now) / 1000)
    });
  }

  next();
}

// API key authentication (for sensitive endpoints)
function requireApiKey(req, res, next) {
  // Skip auth if no keys configured (dev mode)
  if (API_KEYS.size === 0) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || !API_KEYS.has(apiKey)) {
    auditLog(req, 'AUTH_FAILED', { reason: apiKey ? 'invalid_key' : 'missing_key' });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required. Set x-api-key header.'
    });
  }

  auditLog(req, 'AUTH_SUCCESS');
  next();
}

// CORS configuration
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  // Allow if no origins configured (dev mode) or origin is allowed
  if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
}

// Security headers
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  next();
}

// Audit logging
function auditLog(req, action, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    action,
    path: req.path,
    userAgent: req.headers['user-agent']?.slice(0, 100),
    ...details
  };
  // In production, send to external logging service
  console.log('[AUDIT]', JSON.stringify(logEntry));
}

// IP whitelist for sensitive operations (optional)
const IP_WHITELIST = (process.env.IP_WHITELIST || '').split(',').filter(ip => ip.length > 0);

function checkIpWhitelist(req, res, next) {
  if (IP_WHITELIST.length === 0) return next(); // Disabled if no whitelist

  const clientIp = req.ip || req.connection.remoteAddress;
  if (!IP_WHITELIST.includes(clientIp)) {
    auditLog(req, 'IP_BLOCKED', { clientIp });
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(securityHeaders);
app.use(corsMiddleware);
app.use(rateLimiter);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// HELPERS
// =============================================================================

function loadJson(relativePath) {
  try {
    const fullPath = path.join(KNOWLEDGE_DIR, relativePath);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error loading ${relativePath}:`, e.message);
  }
  return null;
}

// =============================================================================
// API ENDPOINTS
// =============================================================================

// Health check for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =============================================================================
// PUBLIC ENDPOINTS (no auth required)
// =============================================================================

// Public health summary (limited data)
app.get('/api/public/health', (req, res) => {
  const health = loadJson('health/ecosystem-health.json');
  if (!health) {
    return res.status(503).json({ error: 'Health data not available' });
  }
  // Only expose score, not details
  res.json({
    overall_score: health.overall_score,
    status: health.overall_score >= 70 ? 'healthy' : 'needs_attention',
    timestamp: health.timestamp
  });
});

// =============================================================================
// PROTECTED ENDPOINTS (API key required)
// =============================================================================

// Ecosystem health (full details)
app.get('/api/health', requireApiKey, (req, res) => {
  const health = loadJson('health/ecosystem-health.json');
  if (!health) {
    return res.status(503).json({ error: 'Health data not available' });
  }
  res.json(health);
});

// Patterns
app.get('/api/patterns', requireApiKey, (req, res) => {
  const patterns = loadJson('patterns/extracted-patterns.json');
  if (!patterns) {
    return res.status(503).json({ error: 'Pattern data not available' });
  }

  // Return summary, not full data
  res.json({
    statistics: patterns.statistics,
    top_patterns: patterns.statistics?.by_category || {},
  });
});

// Search
app.get('/api/search', requireApiKey, async (req, res) => {
  const query = req.query.q;
  const limit = parseInt(req.query.limit) || 10;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" required' });
  }

  const indexPath = path.join(__dirname, 'index/cross-repo.jsonl');
  if (!fs.existsSync(indexPath)) {
    return res.status(503).json({ error: 'Search index not available' });
  }

  const results = [];
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  const readline = require('readline');
  const fileStream = fs.createReadStream(indexPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      // Support multiple formats: conversations (user/assistant) AND learned (content/context/tags)
      const text = [
        entry.user?.content || '',
        entry.assistant?.content || '',
        entry.content || '',
        entry.context || '',
        (entry.tags || []).join(' '),
      ].join(' ').toLowerCase();

      let score = 0;
      for (const term of queryTerms) {
        if (text.includes(term)) score++;
      }

      if (score > 0) {
        results.push({
          score,
          id: entry.id || entry.session_id,
          type: entry.type || 'conversation',
          project: entry.project,
          timestamp: entry.timestamp,
          preview: (entry.content || entry.user?.content || '').slice(0, 200),
        });
      }

      if (results.length >= limit * 10) break;
    } catch (e) {
      // Skip
    }
  }

  results.sort((a, b) => b.score - a.score);
  res.json({
    query,
    results: results.slice(0, limit),
    total: results.length,
  });
});

// Ecosystem
app.get('/api/ecosystem', requireApiKey, (req, res) => {
  const ecosystem = loadJson('relations/ecosystem-graph.json');
  if (!ecosystem) {
    return res.status(503).json({ error: 'Ecosystem data not available' });
  }
  res.json(ecosystem);
});

// Intent/POURQUOI
app.get('/api/intent', requireApiKey, (req, res) => {
  const intent = loadJson('intent/extracted-intents.json');
  if (!intent) {
    return res.status(503).json({ error: 'Intent data not available' });
  }
  res.json({
    metadata: intent.metadata,
    by_category: Object.fromEntries(
      Object.entries(intent.by_category || {}).map(([k, v]) => [k, v.length])
    ),
  });
});

// Vision/Roadmap
app.get('/api/vision', requireApiKey, (req, res) => {
  const vision = loadJson('vision/roadmap.json');
  if (!vision) {
    return res.status(503).json({ error: 'Vision data not available' });
  }
  res.json({
    statistics: vision.statistics,
    roadmap: vision.roadmap,
  });
});

// Dependencies
app.get('/api/dependencies', requireApiKey, (req, res) => {
  const deps = loadJson('dependencies/dependency-graph.json');
  if (!deps) {
    return res.status(503).json({ error: 'Dependency data not available' });
  }
  res.json({
    statistics: deps.statistics,
    version_mismatches: deps.version_mismatches,
    shared: Object.keys(deps.shared_dependencies || {}),
  });
});

// Errors/Post-mortems
app.get('/api/errors', requireApiKey, (req, res) => {
  const errors = loadJson('errors/post-mortems.json');
  if (!errors) {
    return res.status(503).json({ error: 'Error data not available' });
  }
  res.json({
    statistics: errors.statistics,
    by_category: Object.fromEntries(
      Object.entries(errors.errors_by_category || {}).map(([k, v]) => [k, v.count])
    ),
  });
});

// =============================================================================
// CYNIC JUDGE ENDPOINT
// =============================================================================

const { CYNIC } = require('./lib/cynic');
const { SelfJudge } = require('./lib/cynic/self-judge');

app.post('/api/judge', express.json(), async (req, res) => {
  try {
    const { input, source = 'api', dimensions = [] } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input required' });
    }

    // Create CYNIC with optional dimensions
    const judge = new SelfJudge();
    if (dimensions && dimensions.length > 0) {
      for (const dim of dimensions) {
        try {
          judge.loadDimension(dim);
        } catch (e) {
          // Skip unknown dimensions
        }
      }
    }

    const cynic = new CYNIC({ evaluator: judge.dimensions.size > 0 ? judge : null });
    const result = await cynic.process(input, source);

    res.json({
      verdict: result.judgment.verdict,
      confidence: result.judgment.confidence,
      doubt: result.judgment.doubt,
      reasoning: result.judgment.reasoning,
      action: result.result.action,
      needs_verification: result.result.transformed?._cynic?.needs_verification || false,
      suggested_checks: result.result.transformed?._cynic?.suggested_checks || [],
      _phi: {
        ceiling_applied: result.judgment._phi.ceiling_applied,
        floor_applied: result.judgment._phi.floor_applied,
        philosophy: result.judgment._phi.philosophy
      },
      _config: {
        mode: judge.dimensions.size > 0 ? 'dimensional' : 'simple',
        dimensions_loaded: judge.getLoadedDimensions()
      }
    });
  } catch (error) {
    console.error('Judge error:', error);
    res.status(500).json({ error: 'Judge failed', message: error.message });
  }
});

// =============================================================================
// WEBHOOK ENDPOINTS - CYNIC-Guarded Ingestion
// =============================================================================

const WEBHOOK_LOG = path.join(KNOWLEDGE_DIR, 'webhooks', 'incoming.jsonl');
const FLAGGED_LOG = path.join(KNOWLEDGE_DIR, 'webhooks', 'flagged.jsonl');

// Ensure webhook directories exist
const webhookDir = path.join(KNOWLEDGE_DIR, 'webhooks');
if (!fs.existsSync(webhookDir)) {
  fs.mkdirSync(webhookDir, { recursive: true });
}

/**
 * Process webhook through CYNIC and store result
 */
async function processWebhookWithCynic(payload, source, dimensions = ['truth', 'relevance', 'ethics']) {
  const judge = new SelfJudge();
  for (const dim of dimensions) {
    try { judge.loadDimension(dim); } catch (e) { /* skip */ }
  }

  const cynic = new CYNIC({ evaluator: judge });
  const result = await cynic.process(payload, source);

  const entry = {
    timestamp: new Date().toISOString(),
    source,
    payload,
    cynic: {
      verdict: result.judgment.verdict,
      confidence: result.judgment.confidence,
      doubt: result.judgment.doubt,
      reasoning: result.judgment.reasoning,
      action: result.result.action,
      needs_verification: result.result.transformed?._cynic?.needs_verification || false,
      suggested_checks: result.result.transformed?._cynic?.suggested_checks || []
    },
    _phi: result.judgment._phi
  };

  // Store based on verdict
  const logFile = result.judgment.verdict === 'ACCEPT' ? WEBHOOK_LOG : FLAGGED_LOG;
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');

  return entry;
}

/**
 * HolDex Webhook Endpoint
 * Receives: K-Score updates, token events, space activities
 */
app.post('/webhook/holdex', express.json(), async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-holdex-signature'];

    // Add verification metadata
    payload._webhook = {
      received_at: new Date().toISOString(),
      has_signature: !!signature,
      ip: req.ip
    };

    // Process through CYNIC
    const entry = await processWebhookWithCynic(payload, 'holdex-webhook');

    console.log(`[HolDex Webhook] ${entry.cynic.verdict} - ${payload.event || 'unknown'} (${(entry.cynic.confidence * 100).toFixed(1)}%)`);

    res.json({
      received: true,
      cynic: entry.cynic,
      stored: entry.cynic.verdict === 'ACCEPT' ? 'accepted' : 'flagged'
    });
  } catch (error) {
    console.error('HolDex webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GASdf Webhook Endpoint
 * Receives: Burn notifications, fee events, transaction confirmations
 */
app.post('/webhook/gasdf', express.json(), async (req, res) => {
  try {
    const payload = req.body;

    payload._webhook = {
      received_at: new Date().toISOString(),
      ip: req.ip
    };

    // Process through CYNIC with ethics dimension (burn alignment)
    const entry = await processWebhookWithCynic(payload, 'gasdf-webhook', ['truth', 'ethics']);

    console.log(`[GASdf Webhook] ${entry.cynic.verdict} - ${payload.event || 'unknown'} (${(entry.cynic.confidence * 100).toFixed(1)}%)`);

    res.json({
      received: true,
      cynic: entry.cynic,
      stored: entry.cynic.verdict === 'ACCEPT' ? 'accepted' : 'flagged'
    });
  } catch (error) {
    console.error('GASdf webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Generic Webhook Endpoint
 * For any ecosystem service to send data through CYNIC
 */
app.post('/webhook/ingest', express.json(), async (req, res) => {
  try {
    const { payload, source = 'unknown', dimensions } = req.body;

    if (!payload) {
      return res.status(400).json({ error: 'Payload required' });
    }

    const entry = await processWebhookWithCynic(
      payload,
      source,
      dimensions || ['truth', 'relevance']
    );

    res.json({
      received: true,
      cynic: entry.cynic,
      stored: entry.cynic.verdict === 'ACCEPT' ? 'accepted' : 'flagged'
    });
  } catch (error) {
    console.error('Ingest webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Get webhook stats
 */
app.get('/webhook/stats', (req, res) => {
  try {
    let accepted = 0, flagged = 0;

    if (fs.existsSync(WEBHOOK_LOG)) {
      accepted = fs.readFileSync(WEBHOOK_LOG, 'utf-8').split('\n').filter(l => l.trim()).length;
    }
    if (fs.existsSync(FLAGGED_LOG)) {
      flagged = fs.readFileSync(FLAGGED_LOG, 'utf-8').split('\n').filter(l => l.trim()).length;
    }

    res.json({
      total: accepted + flagged,
      accepted,
      flagged,
      acceptance_rate: accepted + flagged > 0 ? (accepted / (accepted + flagged)).toFixed(3) : 0,
      _phi: {
        ceiling: 0.618,
        floor: 0.382,
        philosophy: "Don't trust, verify"
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Stats unavailable' });
  }
});

// =============================================================================
// METRICS WEBHOOK - I_infra Tracking
// =============================================================================

const METRICS_LOG = path.join(KNOWLEDGE_DIR, 'metrics', 'services.jsonl');
const METRICS_SUMMARY = path.join(KNOWLEDGE_DIR, 'metrics', 'summary.json');

// Ensure metrics directory exists
const metricsDir = path.join(KNOWLEDGE_DIR, 'metrics');
if (!fs.existsSync(metricsDir)) {
  fs.mkdirSync(metricsDir, { recursive: true });
}

/**
 * Metrics Webhook - Track service health for I_infra scoring
 * Accepts: uptime, response_time, error_rate, request_count, etc.
 */
app.post('/webhook/metrics', express.json(), async (req, res) => {
  try {
    const { service, metrics, node, period } = req.body;

    if (!service || !metrics) {
      return res.status(400).json({ error: 'service and metrics required' });
    }

    const entry = {
      timestamp: new Date().toISOString(),
      service,
      node: node || 'unknown',
      period: period || 'snapshot',
      metrics: {
        uptime: metrics.uptime,
        response_time_ms: metrics.response_time_ms,
        error_rate: metrics.error_rate,
        request_count: metrics.request_count,
        success_count: metrics.success_count,
        ...metrics
      },
      _i_infra: calculateIInfra(metrics)
    };

    // Append to log
    fs.appendFileSync(METRICS_LOG, JSON.stringify(entry) + '\n');

    // Update summary
    updateMetricsSummary(service, entry);

    console.log(`[Metrics] ${service}@${entry.node}: uptime=${metrics.uptime}% i_infra=${entry._i_infra.score}`);

    res.json({
      received: true,
      service,
      i_infra: entry._i_infra,
      message: `Metrics recorded for ${service}`
    });
  } catch (error) {
    console.error('Metrics webhook error:', error);
    res.status(500).json({ error: 'Metrics processing failed' });
  }
});

/**
 * Calculate I_infra score from metrics
 * Based on φ-weighted components
 */
function calculateIInfra(metrics) {
  // Weights for different metrics (using φ from temporal.js)
  const weights = {
    uptime: PHI_2,           // 2.618 - most important
    response_time: PHI,      // 1.618
    error_rate: PHI,         // 1.618 (inverted)
    availability: 1          // 1.0
  };

  let score = 0;
  let totalWeight = 0;
  const components = {};

  // Uptime (0-100 → 0-1 normalized)
  if (metrics.uptime !== undefined) {
    const uptimeScore = metrics.uptime / 100;
    components.uptime = uptimeScore;
    score += uptimeScore * weights.uptime;
    totalWeight += weights.uptime;
  }

  // Response time (lower is better, cap at 2000ms)
  if (metrics.response_time_ms !== undefined) {
    const rtScore = Math.max(0, 1 - (metrics.response_time_ms / 2000));
    components.response_time = rtScore;
    score += rtScore * weights.response_time;
    totalWeight += weights.response_time;
  }

  // Error rate (lower is better)
  if (metrics.error_rate !== undefined) {
    const errorScore = 1 - Math.min(1, metrics.error_rate);
    components.error_rate = errorScore;
    score += errorScore * weights.error_rate;
    totalWeight += weights.error_rate;
  }

  const finalScore = totalWeight > 0 ? (score / totalWeight) * 100 : 0;

  return {
    score: Math.round(finalScore * 100) / 100,
    components,
    weights,
    _phi: {
      method: 'weighted_average',
      philosophy: 'Infrastructure reliability is the foundation'
    }
  };
}

/**
 * Update metrics summary file
 */
function updateMetricsSummary(service, entry) {
  let summary = {};

  if (fs.existsSync(METRICS_SUMMARY)) {
    try {
      summary = JSON.parse(fs.readFileSync(METRICS_SUMMARY, 'utf-8'));
    } catch (e) { /* start fresh */ }
  }

  if (!summary.services) summary.services = {};

  summary.services[service] = {
    last_update: entry.timestamp,
    node: entry.node,
    latest_metrics: entry.metrics,
    i_infra: entry._i_infra.score,
    history_count: (summary.services[service]?.history_count || 0) + 1
  };

  summary.last_update = entry.timestamp;
  summary.total_services = Object.keys(summary.services).length;

  fs.writeFileSync(METRICS_SUMMARY, JSON.stringify(summary, null, 2));
}

/**
 * Get metrics summary
 */
app.get('/webhook/metrics', (req, res) => {
  try {
    if (!fs.existsSync(METRICS_SUMMARY)) {
      return res.json({ services: {}, message: 'No metrics recorded yet' });
    }

    const summary = JSON.parse(fs.readFileSync(METRICS_SUMMARY, 'utf-8'));
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Metrics unavailable' });
  }
});

// =============================================================================
// CYNIC DASHBOARD - φ qui se méfie de φ
// =============================================================================

/**
 * CYNIC Dashboard - HTML view
 * Auto-refreshes every 62 seconds (φ⁻¹ × 100)
 */
app.get('/cynic', async (req, res) => {
  try {
    const html = await cynicDashboardWeb.generateHTML();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('CYNIC dashboard error:', error);
    res.status(500).send('Dashboard generation failed');
  }
});

/**
 * CYNIC Dashboard - JSON API
 * Returns all dashboard data as JSON
 */
app.get('/cynic/api', async (req, res) => {
  try {
    const data = await cynicDashboardWeb.generateAPIResponse();
    res.json(data);
  } catch (error) {
    console.error('CYNIC API error:', error);
    res.status(500).json({ error: 'API generation failed' });
  }
});

/**
 * CYNIC Pulse Status
 * Returns current pulse/health status
 */
app.get('/cynic/status', async (req, res) => {
  try {
    const pulseStatus = cynicPulse.getStatus();
    const diagnostic = await cynicSelfMonitor.runFullDiagnostic();
    const alertStats = cynicAlerts.getStats();
    const activeAlerts = cynicAlerts.getActive();

    res.json({
      timestamp: new Date().toISOString(),
      pulse: {
        running: pulseStatus.running,
        interval: pulseStatus.interval,
        beatCount: pulseStatus.beatCount,
        uptime: pulseStatus.uptime
      },
      health: {
        score: diagnostic.overallScore,
        status: diagnostic.status,
        healthy: diagnostic.healthy
      },
      components: Object.fromEntries(
        Object.entries(diagnostic.components).map(([k, v]) => [k, {
          healthy: v.healthy,
          score: v.score,
          status: v.status
        }])
      ),
      alerts: {
        active: activeAlerts.length,
        totalFired: alertStats.totalFired,
        resolved: alertStats.resolved,
        rules: alertStats.rulesCount
      },
      _phi: {
        interval: '61.8s (φ⁻¹ × 100)',
        thresholds: {
          healthy: 62,
          warning: 38,
          critical: 24
        },
        philosophy: 'φ qui se méfie de φ'
      }
    });
  } catch (error) {
    console.error('CYNIC status error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

/**
 * CYNIC Store Status
 * Returns store connection status and mode
 */
app.get('/cynic/store', async (req, res) => {
  try {
    if (!cynicStore) {
      return res.json({
        status: 'not_initialized',
        mode: 'none',
        message: 'Store not initialized yet'
      });
    }

    const health = await cynicStore.health();
    res.json({
      status: 'ok',
      mode: health.mode,
      connected: health.healthy,
      _phi: {
        philosophy: "Don't trust, verify - persistence is memory's guarantee"
      }
    });
  } catch (error) {
    console.error('CYNIC store status error:', error);
    res.status(500).json({ error: 'Store status check failed', message: error.message });
  }
});

/**
 * CYNIC Store Judgments
 * Query recent judgments from the store
 */
app.get('/cynic/store/judgments', async (req, res) => {
  try {
    if (!cynicStore) {
      return res.status(503).json({ error: 'Store not initialized' });
    }

    const limit = parseInt(req.query.limit) || 10;
    const judgments = await cynicStore.listJudgments({ limit });

    res.json({
      count: judgments.length,
      judgments,
      mode: cynicStore.memoryMode ? 'memory' : 'postgres'
    });
  } catch (error) {
    console.error('CYNIC store judgments error:', error);
    res.status(500).json({ error: 'Failed to fetch judgments', message: error.message });
  }
});

/**
 * CYNIC Store Test - Save a test judgment
 */
app.post('/cynic/store/test', async (req, res) => {
  try {
    if (!cynicStore) {
      return res.status(503).json({ error: 'Store not initialized' });
    }

    const testJudgment = {
      item_hash: crypto.randomBytes(8).toString('hex'),
      item_type: 'test',
      scores: { test_dimension: 58 },
      global: 58,
      verdict: 'TEST',
      confidence: PHI_INV,
      mode: 'test',
      cynic_says: 'Woof! This is a test judgment to verify persistence.'
    };

    const saved = await cynicStore.saveJudgment(testJudgment);
    console.log('[CYNIC-STORE] Test judgment saved:', saved?.id || 'memory');

    res.json({
      success: true,
      saved: saved || testJudgment,
      message: 'Test judgment persisted',
      mode: cynicStore.memoryMode ? 'memory' : 'postgres'
    });
  } catch (error) {
    console.error('CYNIC store test error:', error);
    res.status(500).json({ error: 'Failed to save test judgment', message: error.message });
  }
});

/**
 * CYNIC Alerts - Active alerts
 */
app.get('/cynic/alerts', (req, res) => {
  try {
    const active = cynicAlerts.getActive();
    const stats = cynicAlerts.getStats();

    res.json({
      active,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('CYNIC alerts error:', error);
    res.status(500).json({ error: 'Alerts fetch failed' });
  }
});

/**
 * CYNIC CLI Dashboard - Plain text output
 */
app.get('/cynic/cli', async (req, res) => {
  try {
    const output = await cynicDashboard.generate();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(output);
  } catch (error) {
    console.error('CYNIC CLI error:', error);
    res.status(500).send('CLI dashboard generation failed');
  }
});

/**
 * Start/Stop CYNIC Pulse (protected)
 */
app.post('/cynic/pulse', requireApiKey, (req, res) => {
  const { action } = req.body;

  try {
    if (action === 'start') {
      cynicPulse.start();
      cynicAlerts.connectToPulse(cynicPulse);
      res.json({ success: true, message: 'Pulse started', status: cynicPulse.getStatus() });
    } else if (action === 'stop') {
      cynicPulse.stop();
      res.json({ success: true, message: 'Pulse stopped', status: cynicPulse.getStatus() });
    } else {
      res.status(400).json({ error: 'Invalid action. Use "start" or "stop"' });
    }
  } catch (error) {
    console.error('CYNIC pulse control error:', error);
    res.status(500).json({ error: 'Pulse control failed' });
  }
});

// =============================================================================
// CYNIC REALTIME - SSE & WebSocket
// =============================================================================

/**
 * CYNIC Realtime SSE Endpoint
 * Server-Sent Events for real-time dashboard updates
 *
 * Query params:
 * - types: comma-separated event types to filter (e.g., "commit:new,error:captured")
 */
app.get('/cynic/sse', cynicRealtime.createSSEHandler());

/**
 * CYNIC Realtime Stats
 * Returns stats about the realtime system
 */
app.get('/cynic/realtime', (req, res) => {
  try {
    const stats = cynicRealtime.getRealtimeStats();
    res.json(stats);
  } catch (error) {
    console.error('CYNIC realtime stats error:', error);
    res.status(500).json({ error: 'Realtime stats failed' });
  }
});

/**
 * CYNIC Realtime Event Types
 * Returns available event types
 */
app.get('/cynic/realtime/types', (req, res) => {
  res.json({
    eventTypes: cynicRealtime.EVENT_TYPES,
    description: 'Available event types for SSE subscription',
    usage: 'Add ?types=commit:new,error:captured to /cynic/sse to filter events',
  });
});

// =============================================================================
// SINGULARITY 3D DASHBOARD
// "φ qui se voit vivre"
// =============================================================================

const SINGULARITY_DIR = path.join(__dirname, 'knowledge/dashboard');

// Import dashboard modules (lazy load to avoid circular deps)
let singularityModules = null;
function getSingularityModules() {
  if (!singularityModules) {
    const { getResidualDetector } = require('./lib/cynic/judge');
    const { getInnommable } = require('./lib/cynic/innommable');
    const matrix = require('./lib/cynic/matrix');
    const cynic = require('./lib/cynic');
    singularityModules = {
      residualDetector: getResidualDetector(),
      innommable: getInnommable(),
      matrix,
      cynic
    };
  }
  return singularityModules;
}

// Singularity Dashboard - Static files
app.use('/singularity', express.static(SINGULARITY_DIR));

// Singularity API - CYNIC state
app.get('/singularity/api/cynic', async (req, res) => {
  try {
    const { residualDetector, matrix } = getSingularityModules();
    const state = {
      timestamp: new Date().toISOString(),
      scores: {},
      globalScore: 0,
      verdict: 'UNKNOWN',
      confidence: 61.8,
      harmony: { connections: 0, matrix: null },
      residuals: { count: 0, buffer: [] },
    };

    // Get harmony matrix
    try {
      const H = matrix.loadHarmony();
      if (H && H.matrix) {
        state.harmony.matrix = H.matrix;
        state.harmony.dimensions = H._dimensions;
        let connections = 0;
        for (let i = 0; i < H.matrix.length; i++) {
          for (let j = i + 1; j < H.matrix[i].length; j++) {
            if (H.matrix[i][j] > 0.4) connections++;
          }
        }
        state.harmony.connections = connections;
      }
    } catch (e) { /* ignore */ }

    // Get residual buffer status
    if (residualDetector) {
      try {
        const bufferStatus = residualDetector.getBufferStatus();
        state.residuals.count = bufferStatus.count || 0;
        state.residuals.weightedCount = bufferStatus.weightedCount || 0;
      } catch (e) { /* ignore */ }
    }

    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Singularity API - THE_INNOMMABLE
app.get('/singularity/api/innommable', async (req, res) => {
  try {
    const { residualDetector, innommable } = getSingularityModules();
    const response = {
      timestamp: new Date().toISOString(),
      residualDetector: residualDetector ? {
        stats: residualDetector.getStats(),
        bufferStatus: residualDetector.anomalyBuffer?.getStats() || { count: 0 },
        discoveredDimensions: residualDetector.getDiscoveredDimensions(),
        canDiscover: residualDetector.anomalyBuffer?.shouldCluster() || false,
      } : null,
      innommable: innommable ? {
        status: innommable.getStatus(),
        summary: innommable.summarize(),
        pending: innommable.getPending(),
      } : null,
      _phi: {
        anomalyThreshold: 0.382,
        clusterMinCount: 3,
        maxConfidence: 0.618,
        philosophy: 'φ qui doute de φ',
      },
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Singularity API - Roadmap
app.get('/singularity/api/roadmap', async (req, res) => {
  try {
    const roadmapPath = path.join(__dirname, 'knowledge/cynic/architect/roadmap.json');
    const roadmap = JSON.parse(fs.readFileSync(roadmapPath));

    const completedLevels = roadmap._meta?.completedLevels || 0;
    const totalLevels = roadmap._meta?.totalLevels || 6;

    const PHI_CONST = 1.618033988749895;
    let totalWeight = 0, completedWeight = 0;
    for (let i = 0; i < totalLevels; i++) {
      const weight = Math.pow(PHI_CONST, i);
      totalWeight += weight;
      if (i < completedLevels) completedWeight += weight;
    }

    const singularityProgress = (completedWeight / totalWeight) * 100;

    res.json({
      pyramid: roadmap.pyramid,
      meta: roadmap._meta,
      progress: {
        completedLevels,
        totalLevels,
        currentLevel: roadmap._meta?.currentLevel || 0,
        singularityProgress: parseFloat(singularityProgress.toFixed(1)),
        singularityDistance: parseFloat((100 - singularityProgress).toFixed(1)),
        phi: PHI_CONST
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Singularity API - Judge
app.get('/singularity/api/judge', async (req, res) => {
  try {
    const { cynic } = getSingularityModules();
    const result = await cynic.judge({ test: 'singularity-check', timestamp: Date.now() });
    res.json({
      scores: result.scores || {},
      global: result.global || 0,
      verdict: result.verdict || 'UNKNOWN',
      confidence: result.confidence || 61.8,
      residual: result.residual || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Singularity API - Git commits
app.get('/singularity/api/commits', (req, res) => {
  try {
    const gitState = loadJson('live/git-state.json');
    const commits = [];
    for (const [repo, data] of Object.entries(gitState?.repos || {})) {
      if (data.branch?.lastCommit) {
        commits.push({ repo, ...data.branch.lastCommit, branch: data.branch.branch });
      }
      if (data.recentPRs) {
        data.recentPRs.slice(0, 3).forEach(pr => {
          commits.push({ repo, type: 'PR', ...pr });
        });
      }
    }
    res.json({ commits, timestamp: gitState?.timestamp });
  } catch (error) {
    res.json({ commits: [], count: 0, error: error.message });
  }
});

// Singularity API - Errors/Alerts
app.get('/singularity/api/errors', (req, res) => {
  try {
    const alertsPath = path.join(__dirname, 'knowledge/live/alerts/alerts.jsonl');
    const lines = fs.readFileSync(alertsPath, 'utf-8').trim().split('\n').slice(-50);
    const alerts = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    res.json({ alerts: alerts.reverse(), count: alerts.length });
  } catch (error) {
    res.json({ alerts: [], count: 0 });
  }
});

// Singularity API - Patterns
app.get('/singularity/api/patterns', (req, res) => {
  try {
    const patternsPath = path.join(__dirname, 'knowledge/cynic/error-learning/patterns.json');
    const patterns = JSON.parse(fs.readFileSync(patternsPath));
    res.json(patterns);
  } catch (error) {
    res.json({ patterns: [], count: 0 });
  }
});

// =============================================================================
// MCP OVER SSE
// =============================================================================

const MCP_TOOLS = [
  { name: 'brain_search', description: 'Search across all asdf-brain knowledge' },
  { name: 'brain_health', description: 'Get ecosystem health status' },
  { name: 'brain_patterns', description: 'Find recurring patterns' },
  { name: 'brain_intent', description: 'Find decision rationale (POURQUOI)' },
  { name: 'brain_ecosystem', description: 'Query ecosystem relationships' },
  { name: 'brain_dependencies', description: 'Get dependency information' },
  { name: 'brain_vision', description: 'Get roadmap items' },
];

// MCP JSON-RPC endpoint
app.post('/mcp', requireApiKey, async (req, res) => {
  const { id, method, params } = req.body;

  try {
    let result;

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'asdf-brain', version: '1.0.0' },
        };
        break;

      case 'tools/list':
        result = { tools: MCP_TOOLS };
        break;

      case 'tools/call':
        const { name, arguments: args } = params;
        let data;

        switch (name) {
          case 'brain_health':
            data = loadJson('health/ecosystem-health.json');
            break;
          case 'brain_patterns':
            data = loadJson('patterns/extracted-patterns.json')?.statistics;
            break;
          case 'brain_intent':
            data = loadJson('intent/extracted-intents.json')?.metadata;
            break;
          case 'brain_ecosystem':
            data = loadJson('relations/ecosystem-graph.json');
            break;
          case 'brain_dependencies':
            data = loadJson('dependencies/dependency-graph.json')?.statistics;
            break;
          case 'brain_vision':
            data = loadJson('vision/roadmap.json')?.roadmap;
            break;
          case 'brain_search':
            // Implement actual search for MCP
            const searchQuery = args?.query || '';
            const searchLimit = args?.limit || 10;
            if (!searchQuery) {
              data = { error: 'Query parameter required', results: [] };
            } else {
              const indexPath = path.join(__dirname, 'index/cross-repo.jsonl');
              if (fs.existsSync(indexPath)) {
                const searchResults = [];
                const queryLower = searchQuery.toLowerCase();
                const queryTerms = queryLower.split(/\s+/);
                const lines = fs.readFileSync(indexPath, 'utf8').split('\n');
                for (const line of lines) {
                  if (!line.trim()) continue;
                  try {
                    const entry = JSON.parse(line);
                    const text = [
                      entry.content || '',
                      entry.context || '',
                      (entry.tags || []).join(' '),
                    ].join(' ').toLowerCase();
                    let score = 0;
                    for (const term of queryTerms) {
                      if (text.includes(term)) score++;
                    }
                    if (score > 0) {
                      searchResults.push({
                        score,
                        id: entry.id,
                        type: entry.type,
                        project: entry.project,
                        timestamp: entry.timestamp,
                        preview: (entry.content || '').slice(0, 200),
                      });
                    }
                  } catch (e) { /* skip */ }
                }
                searchResults.sort((a, b) => b.score - a.score);
                data = {
                  query: searchQuery,
                  results: searchResults.slice(0, searchLimit),
                  total: searchResults.length,
                };
              } else {
                data = { error: 'Search index not available', results: [] };
              }
            }
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        result = {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
        break;

      default:
        return res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
    }

    res.json({ jsonrpc: '2.0', id, result });
  } catch (e) {
    res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: e.message },
    });
  }
});

// SSE endpoint for MCP streaming
app.get('/sse', requireApiKey, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', server: 'asdf-brain' })}\n\n`);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`: keepalive\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// =============================================================================
// DASHBOARD
// =============================================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================================================
// START SERVER
// =============================================================================

const server = app.listen(PORT, async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain server');
  console.log("  $asdfasdfa: Don't trust, verify");
  console.log('  CYNIC: φ qui se méfie de φ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Dashboard:  http://localhost:${PORT}/`);
  console.log(`  CYNIC:      http://localhost:${PORT}/cynic`);
  console.log(`  CYNIC SSE:  http://localhost:${PORT}/cynic/sse`);
  console.log(`  CYNIC WS:   ws://localhost:${PORT}/ws/cynic`);
  console.log(`  API:        http://localhost:${PORT}/api/health`);
  console.log(`  MCP:        http://localhost:${PORT}/mcp`);
  console.log('═══════════════════════════════════════════════════════════');

  // Initialize CYNIC Store (PostgreSQL persistence)
  try {
    cynicStore = await getStore();
    const health = await cynicStore.health();
    console.log(`[CYNIC-STORE] ${health.mode === 'postgres' ? '🐘' : '💾'} Running in ${health.mode} mode`);

    if (health.mode === 'postgres') {
      const migration = await cynicStore.migrate();
      if (migration.success) {
        console.log('[CYNIC-STORE] ✅ Schema migrated');
      }
    }
  } catch (e) {
    console.log('[CYNIC-STORE] ⚠️ Init failed:', e.message, '- running in memory mode');
  }
});

// Attach WebSocket server for CYNIC realtime
cynicRealtime.attachWebSocket(server, '/ws/cynic');
