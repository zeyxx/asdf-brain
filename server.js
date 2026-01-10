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
 */

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');

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
const { SelfJudge } = require('./lib/self-judge');

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

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain server');
  console.log("  $asdfasdfa: Don't trust, verify");
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Dashboard:  http://localhost:${PORT}/`);
  console.log(`  API:        http://localhost:${PORT}/api/health`);
  console.log(`  MCP:        http://localhost:${PORT}/mcp`);
  console.log('═══════════════════════════════════════════════════════════');
});
