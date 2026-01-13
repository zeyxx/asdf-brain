#!/usr/bin/env node
/**
 * CYNIC Node - Decentralized Self-Judge Server
 *
 * "φ qui se méfie de φ" - The dog that watches itself
 *
 * Run your own CYNIC node:
 *   npm run cynic:node
 *   → http://localhost:3618 (port = φ × 1000 × 2.236...)
 *
 * Philosophy:
 *   - Decentralized: Each user runs their own judge
 *   - Local-first: Your data stays on your machine
 *   - Zero telemetry: No tracking, no extraction
 *   - φ-aligned: All ratios derive from golden ratio
 *
 * Endpoints:
 *   GET  /              → Web UI
 *   GET  /health        → Node health
 *   POST /judge         → Submit item for judgment
 *   GET  /dimensions    → List 24 dimensions
 *   GET  /worlds        → List 4 worlds
 *   GET  /axioms        → List 4 axioms
 *   GET  /api/stats     → Node statistics
 */

'use strict';

const http = require('http');
// Note: fs NOT imported - this node is STATELESS (zero disk I/O)
const path = require('path');
const { URL } = require('url');

// CYNIC Core
const { SelfJudge } = require('./lib/cynic/self-judge');
const { registry } = require('./lib/cynic/dimensions/registry');
const { PHI, PHI_INV, PHI_INV_2 } = require('./lib/cynic/axioms/constants');

// Initialize CYNIC Judge
const judge = new SelfJudge({ logger: { log: () => {}, error: console.error } });

// Node statistics
const stats = {
  startedAt: new Date().toISOString(),
  judgments: 0,
  accepts: 0,
  transforms: 0,
  rejects: 0,
  avgResponseTime: 0,
  totalResponseTime: 0,
};

// Port: φ × 1000 × √5 ≈ 3618 (or from env)
const PORT = process.env.CYNIC_PORT || 3618;

// CORS headers for local development
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') text = String(text);
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Parse JSON body from request
 */
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJSON(res, data, status = 200) {
  res.writeHead(status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Send HTML response
 */
function sendHTML(res, html) {
  res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * Generate Web UI HTML
 */
function generateUI() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CYNIC Node | φ qui se méfie de φ</title>
  <style>
    :root {
      --phi: 1.618;
      --gold: #D4AF37;
      --gold-dark: #B8860B;
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --bg-tertiary: #1a1a2e;
      --text-primary: #e8e8e8;
      --text-secondary: #a0a0a0;
      --accept: #4ade80;
      --transform: #fbbf24;
      --reject: #f87171;
      --phi-inv: 61.8%;
      --phi-inv-2: 38.2%;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
      border-radius: 16px;
      border: 1px solid var(--gold);
      margin-bottom: 30px;
    }

    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }

    h1 {
      color: var(--gold);
      font-size: 2em;
      margin-bottom: 10px;
    }

    .tagline {
      color: var(--text-secondary);
      font-style: italic;
    }

    .phi-badge {
      display: inline-block;
      background: var(--gold);
      color: var(--bg-primary);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8em;
      margin-top: 10px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .card {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #333;
    }

    .card h2 {
      color: var(--gold);
      font-size: 1.2em;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .judge-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    textarea {
      background: var(--bg-tertiary);
      border: 1px solid #444;
      border-radius: 8px;
      padding: 15px;
      color: var(--text-primary);
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      min-height: 120px;
    }

    textarea:focus {
      outline: none;
      border-color: var(--gold);
    }

    button {
      background: var(--gold);
      color: var(--bg-primary);
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }

    button:hover {
      background: var(--gold-dark);
      transform: translateY(-2px);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .result {
      background: var(--bg-tertiary);
      border-radius: 8px;
      padding: 20px;
      margin-top: 15px;
      display: none;
    }

    .result.visible { display: block; }

    .verdict {
      font-size: 1.5em;
      font-weight: bold;
      text-align: center;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .verdict.ACCEPT { background: rgba(74, 222, 128, 0.2); color: var(--accept); }
    .verdict.TRANSFORM { background: rgba(251, 191, 36, 0.2); color: var(--transform); }
    .verdict.REJECT { background: rgba(248, 113, 113, 0.2); color: var(--reject); }

    .scores-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .score-item {
      background: var(--bg-secondary);
      padding: 8px;
      border-radius: 6px;
      text-align: center;
      font-size: 0.85em;
    }

    .score-item .name {
      color: var(--text-secondary);
      font-size: 0.75em;
    }

    .score-item .value {
      color: var(--gold);
      font-weight: bold;
    }

    .world-bar {
      display: flex;
      gap: 5px;
      margin-top: 15px;
    }

    .world-segment {
      flex: 1;
      padding: 10px;
      text-align: center;
      border-radius: 6px;
      font-size: 0.8em;
    }

    .world-segment.ATZILUT { background: rgba(147, 51, 234, 0.3); }
    .world-segment.BERIAH { background: rgba(59, 130, 246, 0.3); }
    .world-segment.YETZIRAH { background: rgba(34, 197, 94, 0.3); }
    .world-segment.ASSIAH { background: rgba(249, 115, 22, 0.3); }

    .stat-value {
      font-size: 2em;
      color: var(--gold);
      font-weight: bold;
    }

    .stat-label {
      color: var(--text-secondary);
      font-size: 0.9em;
    }

    .dimensions-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      font-size: 0.85em;
    }

    .dimension-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 10px;
      background: var(--bg-tertiary);
      border-radius: 4px;
    }

    .axioms-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .axiom-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: var(--bg-tertiary);
      border-radius: 6px;
    }

    .axiom-icon { font-size: 1.5em; }
    .axiom-name { color: var(--gold); font-weight: bold; }
    .axiom-desc { color: var(--text-secondary); font-size: 0.85em; }

    footer {
      text-align: center;
      padding: 30px;
      color: var(--text-secondary);
      font-size: 0.85em;
    }

    .confidence-bar {
      height: 8px;
      background: var(--bg-primary);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 10px;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--gold-dark), var(--gold));
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .meta-info {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 0.85em;
      color: var(--text-secondary);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .loading { animation: pulse 1s infinite; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">🐕</div>
      <h1>CYNIC Node</h1>
      <p class="tagline">"φ qui se méfie de φ" - The dog that watches itself</p>
      <span class="phi-badge">φ = ${PHI.toFixed(6)}</span>
    </header>

    <div class="grid">
      <!-- Judge Form -->
      <div class="card">
        <h2>⚖️ Submit for Judgment</h2>
        <form class="judge-form" id="judgeForm">
          <textarea id="content" placeholder="Enter content to judge...&#10;&#10;Examples:&#10;- A community contribution&#10;- A technical decision&#10;- Any observation to evaluate"></textarea>
          <button type="submit" id="submitBtn">Judge with CYNIC</button>
        </form>

        <div class="result" id="result">
          <div class="verdict" id="verdict"></div>

          <div class="meta-info">
            <span>Confidence: <span id="confidence">0</span>%</span>
            <span>Doubt: <span id="doubt">0</span>%</span>
            <span>Global: <span id="global">0</span></span>
          </div>

          <div class="confidence-bar">
            <div class="confidence-fill" id="confidenceBar" style="width: 0%"></div>
          </div>

          <h3 style="margin-top: 20px; margin-bottom: 10px; color: var(--gold);">World Coherence</h3>
          <div class="world-bar" id="worldBar"></div>

          <h3 style="margin-top: 20px; margin-bottom: 10px; color: var(--gold);">Dimension Scores</h3>
          <div class="scores-grid" id="scoresGrid"></div>
        </div>
      </div>

      <!-- Node Stats -->
      <div class="card">
        <h2>📊 Node Statistics</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; text-align: center;">
          <div>
            <div class="stat-value" id="statJudgments">0</div>
            <div class="stat-label">Judgments</div>
          </div>
          <div>
            <div class="stat-value" id="statAvgTime">0</div>
            <div class="stat-label">Avg Time (ms)</div>
          </div>
          <div>
            <div class="stat-value" style="color: var(--accept);" id="statAccepts">0</div>
            <div class="stat-label">Accepts</div>
          </div>
          <div>
            <div class="stat-value" style="color: var(--transform);" id="statTransforms">0</div>
            <div class="stat-label">Transforms</div>
          </div>
        </div>
      </div>

      <!-- 4 Axioms -->
      <div class="card">
        <h2>📐 4 Axioms</h2>
        <div class="axioms-list">
          <div class="axiom-item">
            <span class="axiom-icon">φ</span>
            <div>
              <div class="axiom-name">PHI</div>
              <div class="axiom-desc">All ratios derive from 1.618...</div>
            </div>
          </div>
          <div class="axiom-item">
            <span class="axiom-icon">✓</span>
            <div>
              <div class="axiom-name">VERIFY</div>
              <div class="axiom-desc">Don't trust, verify</div>
            </div>
          </div>
          <div class="axiom-item">
            <span class="axiom-icon">🏛️</span>
            <div>
              <div class="axiom-name">CULTURE</div>
              <div class="axiom-desc">Culture is a moat</div>
            </div>
          </div>
          <div class="axiom-item">
            <span class="axiom-icon">🔥</span>
            <div>
              <div class="axiom-name">BURN</div>
              <div class="axiom-desc">Don't extract, burn</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 24 Dimensions -->
      <div class="card">
        <h2>🎯 24 Dimensions</h2>
        <div class="dimensions-list" id="dimensionsList"></div>
      </div>
    </div>

    <footer>
      <p>🐕 CYNIC Node v1.0 | Running locally on port ${PORT}</p>
      <p>Max Confidence: φ⁻¹ = ${(PHI_INV * 100).toFixed(1)}% | Min Doubt: φ⁻² = ${(PHI_INV_2 * 100).toFixed(1)}%</p>
      <p style="margin-top: 10px;">Decentralized • Local-first • Zero telemetry</p>
    </footer>
  </div>

  <script>
    // Safe text content setter (XSS prevention)
    function safeSetText(el, text) {
      if (el) el.textContent = text;
    }

    // Safe element creator (XSS prevention)
    function createDimensionItem(name, category) {
      const div = document.createElement('div');
      div.className = 'dimension-item';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;

      const catSpan = document.createElement('span');
      catSpan.style.color = 'var(--text-secondary)';
      catSpan.textContent = category;

      div.appendChild(nameSpan);
      div.appendChild(catSpan);
      return div;
    }

    function createScoreItem(dim, score) {
      const div = document.createElement('div');
      div.className = 'score-item';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'name';
      nameDiv.textContent = dim;

      const valueDiv = document.createElement('div');
      valueDiv.className = 'value';
      valueDiv.textContent = score.toFixed(0);

      div.appendChild(nameDiv);
      div.appendChild(valueDiv);
      return div;
    }

    function createWorldSegment(world, coherence) {
      const div = document.createElement('div');
      div.className = 'world-segment ' + world;

      const nameDiv = document.createElement('div');
      nameDiv.textContent = world;

      const valueDiv = document.createElement('div');
      valueDiv.style.fontWeight = 'bold';
      valueDiv.textContent = (coherence * 100).toFixed(0) + '%';

      div.appendChild(nameDiv);
      div.appendChild(valueDiv);
      return div;
    }

    // Load dimensions
    fetch('/dimensions')
      .then(r => r.json())
      .then(dims => {
        const list = document.getElementById('dimensionsList');
        list.innerHTML = ''; // Clear first
        dims.forEach(d => {
          list.appendChild(createDimensionItem(d.name, d.category));
        });
      });

    // Load stats
    function loadStats() {
      fetch('/api/stats')
        .then(r => r.json())
        .then(s => {
          safeSetText(document.getElementById('statJudgments'), s.judgments);
          safeSetText(document.getElementById('statAvgTime'), s.avgResponseTime.toFixed(1));
          safeSetText(document.getElementById('statAccepts'), s.accepts);
          safeSetText(document.getElementById('statTransforms'), s.transforms);
        });
    }
    loadStats();

    // Judge form
    document.getElementById('judgeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const content = document.getElementById('content').value;

      if (!content.trim()) return;

      btn.disabled = true;
      btn.textContent = 'Judging...';
      btn.classList.add('loading');

      try {
        const res = await fetch('/judge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });

        const result = await res.json();

        // Show result
        const resultDiv = document.getElementById('result');
        resultDiv.classList.add('visible');

        // Verdict (safe text setting)
        const verdictDiv = document.getElementById('verdict');
        verdictDiv.className = 'verdict ' + result.verdict.action;
        safeSetText(verdictDiv, result.verdict.action + ' - ' + (result.verdict.reason || ''));

        // Meta
        safeSetText(document.getElementById('confidence'), result.confidence.toFixed(1));
        safeSetText(document.getElementById('doubt'), result.doubt.toFixed(1));
        safeSetText(document.getElementById('global'), result.global.toFixed(1));
        document.getElementById('confidenceBar').style.width = Math.min(100, result.confidence) + '%';

        // World coherence (safe DOM creation)
        const worldBar = document.getElementById('worldBar');
        worldBar.innerHTML = '';
        if (result.worldCoherence && result.worldCoherence.byWorld) {
          Object.entries(result.worldCoherence.byWorld).forEach(([world, data]) => {
            worldBar.appendChild(createWorldSegment(world, data.coherence));
          });
        }

        // Scores (safe DOM creation)
        const scoresGrid = document.getElementById('scoresGrid');
        scoresGrid.innerHTML = '';
        Object.entries(result.scores).forEach(([dim, score]) => {
          scoresGrid.appendChild(createScoreItem(dim, score));
        });

        // Refresh stats
        loadStats();

      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Judge with CYNIC';
        btn.classList.remove('loading');
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Request handler
 */
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  try {
    // Routes
    if (url.pathname === '/' && method === 'GET') {
      // Web UI
      return sendHTML(res, generateUI());
    }

    if (url.pathname === '/health' && method === 'GET') {
      return sendJSON(res, {
        status: 'healthy',
        node: 'CYNIC',
        version: '1.0.0',
        phi: PHI,
        uptime: Math.floor((Date.now() - new Date(stats.startedAt).getTime()) / 1000),
        dimensions: registry.getAll().length,
      });
    }

    if (url.pathname === '/judge' && method === 'POST') {
      const start = Date.now();
      const body = await parseBody(req);

      if (!body.content && !body.item) {
        return sendJSON(res, { error: 'Missing content or item' }, 400);
      }

      const item = body.item || { content: body.content, ...body };
      const result = await judge.judge(item, body.context || {});

      // Update stats
      const duration = Date.now() - start;
      stats.judgments++;
      stats.totalResponseTime += duration;
      stats.avgResponseTime = stats.totalResponseTime / stats.judgments;

      if (result.verdict.action === 'ACCEPT') stats.accepts++;
      else if (result.verdict.action === 'TRANSFORM') stats.transforms++;
      else if (result.verdict.action === 'REJECT') stats.rejects++;

      return sendJSON(res, {
        ...result,
        _node: {
          responseTime: duration,
          judgmentNumber: stats.judgments,
        },
      });
    }

    if (url.pathname === '/dimensions' && method === 'GET') {
      const dims = registry.getAll().map((e) => ({
        name: e.name,
        category: e.category,
        world: e.world,
        axiom: e.axiom,
        threshold: e.threshold,
      }));
      return sendJSON(res, dims);
    }

    if (url.pathname === '/worlds' && method === 'GET') {
      return sendJSON(res, {
        ATZILUT: { name: 'Atzilut', realm: 'Essence', weight: PHI * PHI },
        BERIAH: { name: 'Beriah', realm: 'Economics', weight: PHI },
        YETZIRAH: { name: 'Yetzirah', realm: 'Ethics', weight: PHI },
        ASSIAH: { name: 'Assiah', realm: 'Contribution', weight: 1.0 },
      });
    }

    if (url.pathname === '/axioms' && method === 'GET') {
      return sendJSON(res, {
        PHI: { symbol: 'φ', description: 'All ratios derive from 1.618...' },
        VERIFY: { symbol: '✓', description: "Don't trust, verify" },
        CULTURE: { symbol: '🏛️', description: 'Culture is a moat' },
        BURN: { symbol: '🔥', description: "Don't extract, burn" },
      });
    }

    if (url.pathname === '/api/stats' && method === 'GET') {
      return sendJSON(res, stats);
    }

    // 404
    return sendJSON(res, { error: 'Not found', path: url.pathname }, 404);
  } catch (err) {
    console.error('[CYNIC-NODE] Error:', err.message);
    return sendJSON(res, { error: err.message }, 500);
  }
}

// Create and start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🐕 CYNIC Node Started                                        ║
║                                                                ║
║   "φ qui se méfie de φ" - The dog that watches itself          ║
║                                                                ║
║   ┌────────────────────────────────────────────────────────┐   ║
║   │  Local:   http://localhost:${PORT}                        │   ║
║   │  Health:  http://localhost:${PORT}/health                 │   ║
║   │  Judge:   POST http://localhost:${PORT}/judge             │   ║
║   └────────────────────────────────────────────────────────┘   ║
║                                                                ║
║   4 Axioms: PHI • VERIFY • CULTURE • BURN                      ║
║   4 Worlds: ATZILUT • BERIAH • YETZIRAH • ASSIAH               ║
║   24 Dimensions loaded                                         ║
║                                                                ║
║   Max Confidence: φ⁻¹ = 61.8%                                  ║
║   Min Doubt: φ⁻² = 38.2%                                       ║
║                                                                ║
║   Decentralized • Local-first • Zero telemetry                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🐕 CYNIC Node shutting down...');
  console.log(`   Total judgments: ${stats.judgments}`);
  console.log(`   Accepts: ${stats.accepts} | Transforms: ${stats.transforms} | Rejects: ${stats.rejects}`);
  server.close(() => process.exit(0));
});
