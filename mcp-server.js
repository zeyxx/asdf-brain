#!/usr/bin/env node
/**
 * asdf-brain MCP Server
 *
 * Makes the brain queryable by Claude during conversations
 * Following $asdfasdfa: "Don't trust, verify" - all answers from verified data
 *
 * Tools provided:
 * - brain_search: Search across all knowledge
 * - brain_health: Get ecosystem health status
 * - brain_patterns: Find recurring patterns
 * - brain_intent: Find decision rationale (POURQUOI)
 * - brain_ecosystem: Query ecosystem relationships
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');

// =============================================================================
// MCP PROTOCOL HELPERS
// =============================================================================

function sendResponse(id, result) {
  const response = {
    jsonrpc: '2.0',
    id,
    result,
  };
  console.log(JSON.stringify(response));
}

function sendError(id, code, message) {
  const response = {
    jsonrpc: '2.0',
    id,
    error: { code, message },
  };
  console.log(JSON.stringify(response));
}

function loadJson(relativePath) {
  try {
    const fullPath = path.join(KNOWLEDGE_DIR, relativePath);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

async function brainSearch(query, limit = 10) {
  // Search across indexed knowledge
  const indexPath = path.join(__dirname, 'index/cross-repo.jsonl');
  if (!fs.existsSync(indexPath)) {
    return { results: [], message: 'Index not built. Run npm run brain:index first.' };
  }

  const results = [];
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  const fileStream = fs.createReadStream(indexPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      const text = ((entry.user?.content || '') + ' ' + (entry.assistant?.content || '')).toLowerCase();

      // Score based on term matches
      let score = 0;
      for (const term of queryTerms) {
        if (text.includes(term)) score++;
      }

      if (score > 0) {
        results.push({
          score,
          session_id: entry.session_id,
          timestamp: entry.timestamp,
          preview: (entry.user?.content || '').slice(0, 150),
          quality: entry.quality,
        });
      }

      if (results.length >= limit * 10) break; // Limit processing
    } catch (e) {
      // Skip
    }
  }

  // Sort by score and return top results
  results.sort((a, b) => b.score - a.score);
  return {
    results: results.slice(0, limit),
    total_scanned: results.length,
    query,
  };
}

function brainHealth() {
  const health = loadJson('health/ecosystem-health.json');
  if (!health) {
    return { status: 'unknown', message: 'Health data not available. Run health-check.js first.' };
  }

  return {
    overall_score: health.overall?.score,
    status: health.overall?.status,
    indicators: health.indicators,
    recommendations: health.recommendations,
    last_updated: health.timestamp,
  };
}

function brainPatterns(category = null) {
  const patterns = loadJson('patterns/extracted-patterns.json');
  if (!patterns) {
    return { message: 'Pattern data not available. Run extract-patterns.js first.' };
  }

  if (category && patterns.statistics?.by_category?.[category]) {
    return {
      category,
      data: patterns.statistics.by_category[category],
    };
  }

  return {
    statistics: patterns.statistics,
    categories: Object.keys(patterns.statistics?.by_category || {}),
  };
}

function brainIntent(category = null) {
  const intents = loadJson('intent/extracted-intents.json');
  if (!intents) {
    return { message: 'Intent data not available. Run extract-intent.js first.' };
  }

  if (category && intents.by_category?.[category]) {
    return {
      category,
      count: intents.by_category[category].length,
      samples: intents.by_category[category].slice(0, 5),
    };
  }

  return {
    statistics: {
      total_conversations: intents.metadata?.total_conversations,
      with_intent: intents.metadata?.with_intent,
    },
    categories: Object.keys(intents.by_category || {}),
  };
}

function brainEcosystem() {
  const ecosystem = loadJson('relations/ecosystem-graph.json');
  if (!ecosystem) {
    return { message: 'Ecosystem data not available. Run relation analysis first.' };
  }

  return {
    nodes: ecosystem.nodes,
    edges: ecosystem.edges,
    phi_weights: ecosystem.phi_weights,
  };
}

function brainDependencies() {
  const deps = loadJson('dependencies/dependency-graph.json');
  if (!deps) {
    return { message: 'Dependency data not available. Run analyze-dependencies.js first.' };
  }

  return {
    statistics: deps.statistics,
    shared_dependencies: Object.keys(deps.shared_dependencies || {}),
    version_mismatches: deps.version_mismatches,
    critical_dependencies: deps.critical_dependencies,
  };
}

function brainVision() {
  const vision = loadJson('vision/roadmap.json');
  if (!vision) {
    return { message: 'Vision data not available. Run extract-vision.js first.' };
  }

  return {
    statistics: vision.statistics,
    roadmap: vision.roadmap,
  };
}

// =============================================================================
// MCP SERVER MAIN
// =============================================================================

const TOOLS = [
  {
    name: 'brain_search',
    description: 'Search across all asdf-brain knowledge (conversations, patterns, decisions)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'brain_health',
    description: 'Get current ecosystem health status and recommendations',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'brain_patterns',
    description: 'Find recurring patterns in the codebase (technical, process, $asdfasdfa)',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Pattern category: technical, process, issues, solutions, architecture, asdfasdfa',
        },
      },
    },
  },
  {
    name: 'brain_intent',
    description: 'Find decision rationale and POURQUOI from conversations',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Intent category: causality, decision, alternative, problem, solution, rationale',
        },
      },
    },
  },
  {
    name: 'brain_ecosystem',
    description: 'Query ecosystem relationships (HolDex, GASdf, $ASDFASDFA connections)',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'brain_dependencies',
    description: 'Get technical dependency information and version mismatches',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'brain_vision',
    description: 'Get roadmap items and future plans extracted from discussions',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function handleRequest(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize':
      return sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'asdf-brain',
          version: '1.0.0',
        },
      });

    case 'tools/list':
      return sendResponse(id, { tools: TOOLS });

    case 'tools/call':
      const { name, arguments: args } = params;
      let result;

      switch (name) {
        case 'brain_search':
          result = await brainSearch(args.query, args.limit);
          break;
        case 'brain_health':
          result = brainHealth();
          break;
        case 'brain_patterns':
          result = brainPatterns(args?.category);
          break;
        case 'brain_intent':
          result = brainIntent(args?.category);
          break;
        case 'brain_ecosystem':
          result = brainEcosystem();
          break;
        case 'brain_dependencies':
          result = brainDependencies();
          break;
        case 'brain_vision':
          result = brainVision();
          break;
        default:
          return sendError(id, -32601, `Unknown tool: ${name}`);
      }

      return sendResponse(id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      });

    case 'notifications/initialized':
      // No response needed for notifications
      return;

    default:
      return sendError(id, -32601, `Method not found: ${method}`);
  }
}

// Start server
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    await handleRequest(request);
  } catch (e) {
    sendError(null, -32700, 'Parse error');
  }
});

process.stderr.write('asdf-brain MCP server started\n');
