/**
 * CYNIC Dashboard API Server
 *
 * Serves the 3D singularity dashboard with live CYNIC data
 *
 * Endpoints:
 * - GET /              → Static files (dashboard)
 * - GET /api/cynic     → Current CYNIC state (scores, harmony, residuals)
 * - GET /api/judge     → Trigger a judgment and return results
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

// Import CYNIC modules
let cynic = null;
let matrix = null;
let residualDetector = null;
let innommable = null;

try {
  cynic = require('../../lib/cynic');
  matrix = require('../../lib/cynic/matrix');
  const { getResidualDetector } = require('../../lib/cynic/judge');
  const { getInnommable } = require('../../lib/cynic/innommable');
  residualDetector = getResidualDetector();  // Use singleton, not new instance
  innommable = getInnommable();
  console.log('[Server] CYNIC modules loaded (using shared ResidualDetector singleton)');
} catch (e) {
  console.error('[Server] Failed to load CYNIC:', e.message);
}

const PORT = 8888;
const STATIC_DIR = __dirname;

// MIME types
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// Last judgment cache
let lastJudgment = null;
let lastJudgmentTime = 0;

/**
 * Get current CYNIC state
 */
async function getCynicState() {
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
  if (matrix) {
    try {
      const H = matrix.loadHarmony();
      if (H && H.matrix) {
        state.harmony.matrix = H.matrix;
        state.harmony.dimensions = H._dimensions;
        // Count significant connections (> 0.4)
        let connections = 0;
        for (let i = 0; i < H.matrix.length; i++) {
          for (let j = i + 1; j < H.matrix[i].length; j++) {
            if (H.matrix[i][j] > 0.4) connections++;
          }
        }
        state.harmony.connections = connections;
      }
    } catch (e) {
      console.error('[Server] Failed to load harmony:', e.message);
    }
  }

  // Get last judgment scores
  if (lastJudgment && lastJudgment.scores) {
    state.scores = lastJudgment.scores;
    state.globalScore = lastJudgment.global || 0;
    state.verdict = lastJudgment.verdict || 'UNKNOWN';
    state.confidence = lastJudgment.confidence || 61.8;
  }

  // Get residual buffer
  if (residualDetector) {
    try {
      const bufferStatus = residualDetector.getBufferStatus();
      state.residuals.count = bufferStatus.count || 0;
      state.residuals.weightedCount = bufferStatus.weightedCount || 0;
    } catch (e) {
      // Ignore
    }
  }

  return state;
}

/**
 * Run a CYNIC judgment
 */
async function runJudgment(item) {
  if (!cynic || !cynic.judge) {
    return { error: 'CYNIC not available' };
  }

  try {
    const result = await cynic.judge(item || { test: 'dashboard-live-check', timestamp: Date.now() });

    lastJudgment = {
      scores: result.scores || {},
      global: result.global || 0,
      verdict: result.verdict || 'UNKNOWN',
      confidence: result.confidence || 61.8,
      residual: result.residual || null,
      timestamp: new Date().toISOString(),
    };
    lastJudgmentTime = Date.now();

    // Log if anomaly detected for visibility
    if (result.residual?.isAnomaly) {
      console.log(`[Server] Anomaly detected: residual=${result.residual.value?.toFixed(3)}`);
    }

    return lastJudgment;
  } catch (e) {
    console.error('[Server] Judgment failed:', e.message);
    return { error: e.message };
  }
}

/**
 * Handle HTTP requests
 */
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API routes
  if (url.pathname === '/api/cynic') {
    const state = await getCynicState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state, null, 2));
    return;
  }

  if (url.pathname === '/api/judge') {
    const result = await runJudgment();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result, null, 2));
    return;
  }

  // API: Git commits
  if (url.pathname === '/api/commits') {
    try {
      const gitState = JSON.parse(fs.readFileSync(path.join(__dirname, '../live/git-state.json')));
      const commits = [];
      for (const [repo, data] of Object.entries(gitState.repos || {})) {
        if (data.branch?.lastCommit) {
          commits.push({
            repo,
            ...data.branch.lastCommit,
            branch: data.branch.branch
          });
        }
        if (data.recentPRs) {
          data.recentPRs.slice(0, 3).forEach(pr => {
            commits.push({ repo, type: 'PR', ...pr });
          });
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ commits, timestamp: gitState.timestamp }));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  // API: Errors/Alerts
  if (url.pathname === '/api/errors') {
    try {
      const alertsPath = path.join(__dirname, '../live/alerts/alerts.jsonl');
      const lines = fs.readFileSync(alertsPath, 'utf-8').trim().split('\n').slice(-50);
      const alerts = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ alerts: alerts.reverse(), count: alerts.length }));
      return;
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ alerts: [], count: 0 }));
      return;
    }
  }

  // API: Patterns (from temporal data)
  if (url.pathname === '/api/patterns') {
    try {
      const patternsPath = path.join(__dirname, '../cynic/error-learning/patterns.json');
      const patterns = JSON.parse(fs.readFileSync(patternsPath));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(patterns));
      return;
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ patterns: [], count: 0 }));
      return;
    }
  }

  // API: THE_INNOMMABLE (residual detection and dimension emergence)
  if (url.pathname === '/api/innommable') {
    try {
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
          anomalyThreshold: 0.382,  // φ⁻²
          clusterMinCount: 3,       // φ²
          maxConfidence: 0.618,     // φ⁻¹
          philosophy: 'φ qui doute de φ',
        },
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  // API: Trigger dimension discovery (POST)
  if (url.pathname === '/api/innommable/discover' && req.method === 'POST') {
    try {
      if (!residualDetector) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'ResidualDetector not available' }));
        return;
      }

      const discoveryResult = residualDetector.discoverDimensions();

      // If dimensions discovered, send to THE_INNOMMABLE for human validation
      if (discoveryResult.discovered && discoveryResult.candidates && innommable) {
        for (const candidate of discoveryResult.candidates) {
          await innommable.receiveDimensionProposal(candidate);
        }
        discoveryResult.sentToInnommable = true;
        discoveryResult.pendingCount = innommable.getPending().length;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(discoveryResult, null, 2));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  // API: Validate dimension proposal (POST)
  if (url.pathname === '/api/innommable/validate' && req.method === 'POST') {
    try {
      if (!innommable) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'THE_INNOMMABLE not available' }));
        return;
      }

      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { proposalId, accept, feedback } = JSON.parse(body);
          const result = await innommable.humanValidate(proposalId, { accept, feedback });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result, null, 2));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  // API: TEST - Inject fake anomaly (for testing emergence pipeline)
  if (url.pathname === '/api/innommable/test-anomaly' && req.method === 'POST') {
    try {
      if (!residualDetector || !residualDetector.anomalyBuffer) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'ResidualDetector/AnomalyBuffer not available' }));
        return;
      }

      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const input = body ? JSON.parse(body) : {};

          // Generate fake anomaly with random dimension focus
          const dimensions = [
            'SOURCE_ORIGIN', 'EVIDENCE_BASE', 'LOGICAL_COHERENCE', 'TEMPORAL_VALIDITY', 'DOMAIN_FIT',
            'SIMPLICITY', 'MODULARITY', 'EXTENSIBILITY', 'ROBUSTNESS', 'ELEGANCE',
            'ADAPTABILITY', 'SCALABILITY', 'FEEDBACK_LOOPS', 'ENERGY_EFFICIENCY', 'MOMENTUM',
            'DEPENDENCY_HEALTH', 'INTERFACE_CLARITY', 'NETWORK_EFFECTS', 'COMPOSABILITY', 'TRUST_GRADIENT',
            'SELF_AWARENESS', 'REVERSIBILITY', 'MEASURABILITY', 'LEARNABILITY', 'ALIGNMENT'
          ];

          // Pick a random dimension to focus the anomaly on
          const focusDim = input.focusDimension || dimensions[Math.floor(Math.random() * dimensions.length)];
          const residual = input.residual || 0.45 + Math.random() * 0.15;  // 0.45-0.60 (above threshold)

          // Create feature vector - high value for focus dimension
          const features = {};
          dimensions.forEach(d => {
            features[d] = d === focusDim ? 0.8 + Math.random() * 0.2 : Math.random() * 0.3;
          });

          // Create fake anomaly entry
          const fakeAnomaly = {
            residual,
            features,
            judgment: {
              global: 0.3 + Math.random() * 0.2,
              scores: { [focusDim]: 0.15 + Math.random() * 0.1 },
              verdict: 'BARK',
            },
            observation: `test_obs_${Date.now()}`,
            context: {
              source: 'test-injection',
              timestamp: new Date().toISOString(),
            },
            gapAnalysis: {
              totalGap: residual,
              dominantGaps: [{ dimension: focusDim, gap: residual }],
            },
          };

          // Inject into buffer
          const addResult = residualDetector.anomalyBuffer.add(fakeAnomaly);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            injected: {
              id: addResult.id,
              residual,
              focusDimension: focusDim,
            },
            bufferStatus: {
              count: addResult.count,
              weightedCount: addResult.weightedCount,
              shouldCluster: addResult.shouldCluster,
            },
            _hint: addResult.shouldCluster
              ? 'Buffer ready for clustering! POST to /api/innommable/discover'
              : `Need ${Math.ceil(3 - addResult.weightedCount)} more anomalies for clustering`,
          }, null, 2));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  // API: Roadmap (pyramid levels and progress)
  if (url.pathname === '/api/roadmap') {
    try {
      const roadmapPath = path.join(__dirname, '../cynic/architect/roadmap.json');
      const roadmap = JSON.parse(fs.readFileSync(roadmapPath));

      // Calculate singularity distance
      const completedLevels = roadmap._meta?.completedLevels || 0;
      const totalLevels = roadmap._meta?.totalLevels || 6;
      const currentLevel = roadmap._meta?.currentLevel || 0;

      // φ-based progress: each level contributes φ^(level) weight
      const PHI = 1.618033988749895;
      let totalWeight = 0;
      let completedWeight = 0;

      for (let i = 0; i < totalLevels; i++) {
        const weight = Math.pow(PHI, i);
        totalWeight += weight;
        if (i < completedLevels) completedWeight += weight;
      }

      const singularityProgress = (completedWeight / totalWeight) * 100;
      const singularityDistance = 100 - singularityProgress;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        pyramid: roadmap.pyramid,
        meta: roadmap._meta,
        progress: {
          completedLevels,
          totalLevels,
          currentLevel,
          singularityProgress: parseFloat(singularityProgress.toFixed(1)),
          singularityDistance: parseFloat(singularityDistance.toFixed(1)),
          phi: PHI
        },
        timestamp: new Date().toISOString()
      }));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  // Static files
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(STATIC_DIR, filePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch (e) {
    if (e.code === 'ENOENT') {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(500);
      res.end('Server Error');
    }
  }
}

// Create and start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         CYNIC SINGULARITY DASHBOARD SERVER                ║
╠═══════════════════════════════════════════════════════════╣
║  Dashboard:     http://localhost:${PORT}/                    ║
║  API State:     http://localhost:${PORT}/api/cynic           ║
║  API Judge:     http://localhost:${PORT}/api/judge           ║
║  API Roadmap:   http://localhost:${PORT}/api/roadmap         ║
║  API Innommable: http://localhost:${PORT}/api/innommable     ║
╠═══════════════════════════════════════════════════════════╣
║  φ = 1.618 | Max Confidence = 61.8% | Min Doubt = 38.2%   ║
║  THE_INNOMMABLE: φ qui doute de φ                         ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  server.close();
  process.exit(0);
});
