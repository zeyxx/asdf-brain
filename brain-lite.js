#!/usr/bin/env node
/**
 * brain-lite.js - Lightweight MCP Server for asdf-brain
 *
 * $asdfasdfa Philosophy:
 *   "Don't trust, verify. Don't extract, burn."
 *
 * Cypherpunk Principles:
 *   - Zero telemetry
 *   - No tracking
 *   - Privacy by design
 *   - Cryptographic verification
 *
 * PaRDeS Structure (Kabbalah):
 *   P (Pshat)  - Simple, direct data access
 *   R (Remez)  - Allusion, pattern recognition
 *   D (Drash)  - Research, philosophy alignment
 *   S (Sod)    - Secret, unified vision
 *
 * Usage:
 *   STDIO:  node brain-lite.js
 *   HTTP:   node brain-lite.js --http --port 3002
 *   Remote: BRAIN_REMOTE=https://asdf-brain.onrender.com node brain-lite.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Context Layer - AI Superlayer
const { getContextLayer, detectProject } = require('./lib/context-layer');

// =============================================================================
// PHI CONSTANTS - Golden Ratio Distribution (Kabbalah Sacred Geometry)
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;              // 0.618 - high confidence
const PHI_INV_2 = PHI_INV * PHI_INV;  // 0.382 - medium confidence
const PHI_INV_3 = PHI_INV_2 * PHI_INV; // 0.236 - low confidence

const CONFIDENCE = {
  HIGH: { threshold: PHI_INV * 100, label: 'ACT' },      // 61.8%
  MEDIUM: { threshold: PHI_INV_2 * 100, label: 'VERIFY' }, // 38.2%
  LOW: { threshold: PHI_INV_3 * 100, label: 'RESEARCH' },  // 23.6%
};

// =============================================================================
// CYPHERPUNK PRINCIPLES - Enforced
// =============================================================================

const CYPHERPUNK = Object.freeze({
  telemetry: false,
  analytics: false,
  userTracking: false,
  dataExfiltration: false,
  signResponses: true,
  defaultPrivacy: 'maximum',
});

// Cryptographic signature for response verification
function signResponse(data, toolName) {
  if (!CYPHERPUNK.signResponses) return data;

  const content = JSON.stringify(data);
  const signature = crypto
    .createHmac('sha256', `asdf-brain:${toolName}:${Date.now()}`)
    .update(content)
    .digest('hex')
    .slice(0, 16);

  return {
    ...data,
    _verified: {
      sig: signature,
      ts: new Date().toISOString(),
      philosophy: "Don't trust, verify",
    },
  };
}

// =============================================================================
// PARDES TOOLS - 7 Tools across 4 Levels
// =============================================================================

const TOOLS = {
  // P - PSHAT (Simple) - Direct access
  brain_search: {
    pardes: 'P',
    name: 'brain_search',
    description: '[P] Search across all knowledge (conversations, patterns, decisions)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
      required: ['query'],
    },
    phi_weight: 1.0,
    dataPath: null, // Uses index
  },

  brain_health: {
    pardes: 'P',
    name: 'brain_health',
    description: '[P] Ecosystem health status and recommendations',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: PHI_INV,
    dataPath: 'health/ecosystem-health.json',
  },

  // R - REMEZ (Allusion) - Pattern recognition
  brain_patterns: {
    pardes: 'R',
    name: 'brain_patterns',
    description: '[R] Recurring patterns (technical, process, $asdfasdfa)',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['technical', 'process', 'issues', 'solutions', 'architecture', 'asdfasdfa'],
        },
      },
    },
    phi_weight: PHI,
    dataPath: 'patterns/extracted-patterns.json',
  },

  brain_dependencies: {
    pardes: 'R',
    name: 'brain_dependencies',
    description: '[R] Technical dependencies and version mismatches',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: 1.0,
    dataPath: 'dependencies/dependency-graph.json',
  },

  // D - DRASH (Research) - Philosophy alignment
  brain_intent: {
    pardes: 'D',
    name: 'brain_intent',
    description: '[D] Decision rationale and POURQUOI extraction',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['causality', 'decision', 'alternative', 'problem', 'solution', 'rationale'],
        },
      },
    },
    phi_weight: PHI,
    dataPath: 'intent/extracted-intents.json',
  },

  brain_ecosystem: {
    pardes: 'D',
    name: 'brain_ecosystem',
    description: '[D] Ecosystem graph (HolDex, GASdf, $ASDFASDFA relations)',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: PHI * PHI, // Highest weight for ecosystem understanding
    dataPath: 'relations/ecosystem-graph.json',
  },

  // S - SOD (Secret) - Unified vision
  brain_vision: {
    pardes: 'S',
    name: 'brain_vision',
    description: '[S] Roadmap and future plans from discussions',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: PHI_INV_2, // Lower weight - vision is speculative
    dataPath: 'vision/roadmap.json',
  },

  // WRITE TOOLS - Active Learning
  brain_learn: {
    pardes: 'D',
    name: 'brain_learn',
    description: '[WRITE] Record an insight, pattern, or decision during this session',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['insight', 'pattern', 'decision', 'error', 'intent'],
          description: 'Type of knowledge to record',
        },
        content: { type: 'string', description: 'The knowledge content' },
        context: { type: 'string', description: 'Context/source of this knowledge' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
      },
      required: ['type', 'content'],
    },
    phi_weight: PHI,
    isWrite: true,
  },

  brain_ingest: {
    pardes: 'P',
    name: 'brain_ingest',
    description: '[WRITE] Ingest external knowledge (from claude-mem, webhooks, etc)',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source identifier (e.g., claude-mem, webhook)' },
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              content: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
          description: 'Array of knowledge entries to ingest',
        },
      },
      required: ['source', 'entries'],
    },
    phi_weight: 1.0,
    isWrite: true,
  },

  // CONTEXT LAYER - AI Superlayer Tools
  brain_context_start: {
    pardes: 'S',
    name: 'brain_context_start',
    description: '[CONTEXT] Start a contextual session - tracks user, project, and conversation',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User identifier (optional)' },
        project: {
          type: 'string',
          enum: ['holdex', 'gasdf', 'brain', 'manifesto', 'ecosystem'],
          description: 'Project context (auto-detected if not specified)',
        },
        initial_context: { type: 'string', description: 'Initial context/query to detect project' },
      },
    },
    phi_weight: PHI * PHI,
    isContext: true,
  },

  brain_context_inject: {
    pardes: 'S',
    name: 'brain_context_inject',
    description: '[CONTEXT] Get context injection for current query - enriches AI with relevant knowledge',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Active session ID' },
        query: { type: 'string', description: 'Current query to contextualize' },
        project: { type: 'string', description: 'Project override (optional)' },
      },
    },
    phi_weight: PHI * PHI,
    isContext: true,
  },

  brain_context_update: {
    pardes: 'D',
    name: 'brain_context_update',
    description: '[CONTEXT] Update session with decision, pattern, or cross-reference',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Session to update' },
        decision: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            content: { type: 'string' },
            rationale: { type: 'string' },
          },
          description: 'Decision made in this session',
        },
        pattern: { type: 'string', description: 'Pattern referenced' },
        cross_reference: {
          type: 'object',
          properties: {
            project: { type: 'string' },
            context: { type: 'string' },
          },
          description: 'Reference to another project',
        },
      },
      required: ['session_id'],
    },
    phi_weight: PHI,
    isContext: true,
  },

  brain_context_end: {
    pardes: 'S',
    name: 'brain_context_end',
    description: '[CONTEXT] End session and persist learnings to collective knowledge',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Session to end' },
      },
      required: ['session_id'],
    },
    phi_weight: PHI,
    isContext: true,
  },

  brain_context_stats: {
    pardes: 'P',
    name: 'brain_context_stats',
    description: '[CONTEXT] Get current context layer statistics',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: 1.0,
    isContext: true,
  },

  brain_context_sessions: {
    pardes: 'P',
    name: 'brain_context_sessions',
    description: '[CONTEXT] List all active sessions with details',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: 1.0,
    isContext: true,
  },
};

// =============================================================================
// DATA ADAPTER - Local / Remote / Embedded
// =============================================================================

class DataAdapter {
  constructor(options = {}) {
    this.mode = options.mode || 'local';
    this.basePath = options.basePath || path.join(__dirname, 'knowledge');
    this.remoteUrl = options.remoteUrl || process.env.BRAIN_REMOTE;
    this.apiKey = options.apiKey || process.env.BRAIN_API_KEY;
  }

  async load(dataPath) {
    if (!dataPath) return null;

    switch (this.mode) {
      case 'local':
        return this._loadLocal(dataPath);
      case 'remote':
        return this._loadRemote(dataPath);
      default:
        return this._loadLocal(dataPath);
    }
  }

  _loadLocal(dataPath) {
    try {
      const fullPath = path.join(this.basePath, dataPath);
      if (!fs.existsSync(fullPath)) return null;
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    } catch (e) {
      return null;
    }
  }

  /**
   * Write/append data (for learning)
   */
  async write(dataPath, entry, options = {}) {
    if (this.mode !== 'local') {
      throw new Error('Write only supported in local mode');
    }
    return this._writeLocal(dataPath, entry, options);
  }

  _writeLocal(dataPath, entry, options = {}) {
    try {
      const fullPath = path.join(this.basePath, dataPath);
      const dir = path.dirname(fullPath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (options.append && dataPath.endsWith('.jsonl')) {
        // Append to JSONL
        fs.appendFileSync(fullPath, JSON.stringify(entry) + '\n');
      } else if (options.merge && fs.existsSync(fullPath)) {
        // Merge with existing JSON
        const existing = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const merged = this._mergeKnowledge(existing, entry);
        fs.writeFileSync(fullPath, JSON.stringify(merged, null, 2));
      } else {
        // Write new file
        fs.writeFileSync(fullPath, JSON.stringify(entry, null, 2));
      }

      return { success: true, path: fullPath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  _mergeKnowledge(existing, newEntry) {
    // Smart merge based on structure
    if (Array.isArray(existing.entries)) {
      existing.entries.push(newEntry);
      existing._metadata = existing._metadata || {};
      existing._metadata.last_updated = new Date().toISOString();
      existing._metadata.count = existing.entries.length;
      return existing;
    }
    // Default: add to 'learned' array
    existing.learned = existing.learned || [];
    existing.learned.push(newEntry);
    return existing;
  }

  async _loadRemote(dataPath) {
    if (!this.remoteUrl) return null;

    try {
      const endpoint = dataPath
        .replace(/\.json$/, '')
        .replace(/^([^/])/, '/$1');

      const url = `${this.remoteUrl}/api${endpoint}`;
      const headers = { 'Accept': 'application/json' };
      if (this.apiKey) headers['x-api-key'] = this.apiKey;

      const response = await fetch(url, { headers });
      if (!response.ok) return null;
      return response.json();
    } catch (e) {
      return null;
    }
  }
}

// =============================================================================
// QUALITY SCORING - K = 100 * cbrt(D * O * L)
// =============================================================================

function calculateQuality(entry = {}) {
  // D = Data Quality (verified source?)
  const D = entry.verified !== false ? 1.0 : 0.5;

  // O = Organic (natural occurrence, not forced)
  const O = entry.count ? Math.min(1, entry.count / 100) : 0.7;

  // L = Longevity (age-adjusted relevance)
  const L = entry.recent !== false ? 0.9 : 0.5;

  // K-Score formula
  return Math.round(100 * Math.cbrt(D * O * L) * 10) / 10;
}

function getConfidence(score) {
  if (score >= CONFIDENCE.HIGH.threshold) return CONFIDENCE.HIGH;
  if (score >= CONFIDENCE.MEDIUM.threshold) return CONFIDENCE.MEDIUM;
  return CONFIDENCE.LOW;
}

function applyPhiWeight(result, tool) {
  const quality = result._quality || calculateQuality(result);
  const adjusted = quality * tool.phi_weight;
  const confidence = getConfidence(adjusted);

  return {
    ...result,
    _phi: {
      pardes: tool.pardes,
      weight: Math.round(tool.phi_weight * 1000) / 1000,
      quality,
      adjusted: Math.round(adjusted * 10) / 10,
      confidence: confidence.label,
    },
  };
}

// =============================================================================
// TOOL HANDLERS
// =============================================================================

async function handleSearch(args, adapter) {
  const { query, limit = 10 } = args;
  const indexPath = path.join(__dirname, 'index/cross-repo.jsonl');

  if (!fs.existsSync(indexPath)) {
    return { results: [], message: 'Index not built. Run: npm run brain:index' };
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
        });
      }

      if (results.length >= limit * 10) break;
    } catch (e) {
      // Skip malformed lines
    }
  }

  results.sort((a, b) => b.score - a.score);
  return {
    query,
    results: results.slice(0, limit),
    total: results.length,
    _quality: results.length > 0 ? 80 : 30,
  };
}

async function handleHealth(args, adapter) {
  const health = await adapter.load('health/ecosystem-health.json');
  if (!health) return { status: 'unknown', message: 'Health data not available' };

  return {
    overall_score: health.overall?.score || health.overall_score,
    status: health.overall?.status || health.status,
    indicators: health.indicators,
    recommendations: health.recommendations?.slice(0, 3),
    _quality: health.overall?.score || 80,
  };
}

async function handlePatterns(args, adapter) {
  const patterns = await adapter.load('patterns/extracted-patterns.json');
  if (!patterns) return { message: 'Pattern data not available' };

  const { category } = args;
  if (category && patterns.statistics?.by_category?.[category]) {
    const categoryData = patterns.statistics.by_category[category];
    return {
      category,
      total_occurrences: categoryData.total_occurrences,
      unique_patterns: categoryData.unique_patterns,
      count: categoryData.top_patterns?.length || 0,
      samples: categoryData.top_patterns?.slice(0, 5) || [],
      _quality: 85,
    };
  }

  return {
    total: patterns.statistics?.total_conversations,
    with_patterns: patterns.statistics?.with_patterns,
    pattern_rate: patterns.statistics?.pattern_rate,
    categories: Object.keys(patterns.statistics?.by_category || {}),
    _quality: 85,
  };
}

async function handleIntent(args, adapter) {
  const intents = await adapter.load('intent/extracted-intents.json');
  if (!intents) return { message: 'Intent data not available' };

  const { category } = args;
  if (category && intents.by_category?.[category]) {
    return {
      category,
      count: intents.by_category[category].length,
      samples: intents.by_category[category].slice(0, 5),
      _quality: 80,
    };
  }

  return {
    total: intents.metadata?.with_intent,
    rate: intents.metadata?.intent_rate,
    categories: Object.keys(intents.by_category || {}),
    _quality: 80,
  };
}

async function handleEcosystem(args, adapter) {
  const ecosystem = await adapter.load('relations/ecosystem-graph.json');
  if (!ecosystem) return { message: 'Ecosystem data not available' };

  return {
    nodes: ecosystem.nodes,
    edges: ecosystem.edges,
    phi_weights: ecosystem.phi_weights,
    _quality: 95, // High quality - verified connections
  };
}

async function handleDependencies(args, adapter) {
  const deps = await adapter.load('dependencies/dependency-graph.json');
  if (!deps) return { message: 'Dependency data not available' };

  return {
    shared: Object.keys(deps.shared_dependencies || {}).length,
    mismatches: deps.version_mismatches?.length || 0,
    critical: deps.critical_dependencies,
    _quality: 90,
  };
}

async function handleVision(args, adapter) {
  const vision = await adapter.load('vision/roadmap.json');
  if (!vision) return { message: 'Vision data not available' };

  return {
    total: vision.statistics?.with_vision,
    rate: vision.statistics?.vision_rate,
    categories: Object.keys(vision.by_category || {}),
    _quality: 60, // Lower - vision is speculative
  };
}

// =============================================================================
// WRITE HANDLERS - Active Learning
// =============================================================================

async function handleLearn(args, adapter) {
  const { type, content, context, tags = [] } = args;

  // Auto-detect project from content + context
  const textForDetection = `${content} ${context || ''}`;
  const detectedProject = detectProject(textForDetection);

  // Create entry with provenance and project tagging
  const entry = {
    id: crypto.randomBytes(8).toString('hex'),
    type,
    content,
    context: context || 'session',
    project: detectedProject,  // Auto-tagged project
    tags: [...tags, detectedProject],  // Include project in tags
    timestamp: new Date().toISOString(),
    hash: crypto.createHash('sha256').update(content).digest('hex').slice(0, 16),
    contributor: 'claude-session',
  };

  // Write to learned.jsonl (append mode)
  const result = await adapter.write('learned/live.jsonl', entry, { append: true });

  if (!result.success) {
    return { success: false, error: result.error, _quality: 0 };
  }

  return {
    success: true,
    id: entry.id,
    type: entry.type,
    project: detectedProject,
    hash: entry.hash,
    message: `Learned: ${type} recorded for project ${detectedProject}`,
    _quality: 85,
  };
}

async function handleIngest(args, adapter) {
  const { source, entries } = args;

  if (!entries || entries.length === 0) {
    return { success: false, error: 'No entries to ingest', _quality: 0 };
  }

  const results = [];
  const projectCounts = {};
  const ingestPath = `ingested/${source}.jsonl`;

  for (const entry of entries) {
    // Auto-detect project from entry content
    const textForDetection = entry.content || JSON.stringify(entry);
    const detectedProject = detectProject(textForDetection);

    // Track project distribution
    projectCounts[detectedProject] = (projectCounts[detectedProject] || 0) + 1;

    const enriched = {
      ...entry,
      id: crypto.randomBytes(8).toString('hex'),
      source,
      project: detectedProject,  // Auto-tagged project
      ingested_at: new Date().toISOString(),
      hash: crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex').slice(0, 16),
    };

    const result = await adapter.write(ingestPath, enriched, { append: true });
    results.push({ id: enriched.id, project: detectedProject, success: result.success });
  }

  const successful = results.filter(r => r.success).length;

  return {
    success: successful > 0,
    source,
    total: entries.length,
    ingested: successful,
    failed: entries.length - successful,
    by_project: projectCounts,  // Show project distribution
    _quality: successful > 0 ? 80 : 0,
  };
}

// =============================================================================
// CONTEXT LAYER HANDLERS - AI Superlayer
// =============================================================================

// Initialize context layer singleton
const contextLayer = getContextLayer();

async function handleContextStart(args, adapter) {
  const { user_id, project, initial_context } = args;

  const session = contextLayer.startSession({
    userId: user_id,
    project,
    context: initial_context,
  });

  return {
    success: true,
    session_id: session.id,
    project: session.project,
    message: `Session started for project: ${session.project}`,
    _quality: 95,
  };
}

async function handleContextInject(args, adapter) {
  const { session_id, query, project } = args;

  const injection = await contextLayer.getInjection({
    sessionId: session_id,
    query,
    project,
  });

  return {
    success: true,
    injection,
    quality: injection.quality,
    message: `Context injection built with ${Object.keys(injection.layers).length} layers`,
    _quality: injection.quality,
  };
}

async function handleContextUpdate(args, adapter) {
  const { session_id, decision, pattern, cross_reference } = args;

  const update = {};
  if (decision) update.decision = decision;
  if (pattern) update.pattern = pattern;
  if (cross_reference) update.cross_reference = cross_reference;

  const session = contextLayer.updateSession(session_id, update);

  if (!session) {
    return { success: false, error: 'Session not found', _quality: 0 };
  }

  return {
    success: true,
    session_id,
    updated: Object.keys(update),
    context_depth: session.context_stack.length,
    decisions_count: session.decisions.length,
    _quality: 85,
  };
}

async function handleContextEnd(args, adapter) {
  const { session_id } = args;

  const session = contextLayer.endSession(session_id);

  if (!session) {
    return { success: false, error: 'Session not found', _quality: 0 };
  }

  return {
    success: true,
    session_id,
    duration_ms: new Date(session.ended_at) - new Date(session.started_at),
    decisions_made: session.decisions.length,
    patterns_used: session.patterns_used.length,
    cross_references: session.cross_references.length,
    message: 'Session ended, learnings persisted',
    _quality: 90,
  };
}

async function handleContextStats(args, adapter) {
  const stats = contextLayer.getStats();

  return {
    success: true,
    ...stats,
    _quality: 95,
  };
}

async function handleContextSessions(args, adapter) {
  const sessions = contextLayer.getActiveSessions();

  return {
    success: true,
    count: sessions.length,
    sessions,
    _quality: 95,
  };
}

const HANDLERS = {
  brain_search: handleSearch,
  brain_health: handleHealth,
  brain_patterns: handlePatterns,
  brain_intent: handleIntent,
  brain_ecosystem: handleEcosystem,
  brain_dependencies: handleDependencies,
  brain_vision: handleVision,
  brain_learn: handleLearn,
  brain_ingest: handleIngest,
  // Context Layer
  brain_context_start: handleContextStart,
  brain_context_inject: handleContextInject,
  brain_context_update: handleContextUpdate,
  brain_context_end: handleContextEnd,
  brain_context_stats: handleContextStats,
  brain_context_sessions: handleContextSessions,
};

// =============================================================================
// MCP PROTOCOL HANDLER
// =============================================================================

class MCPHandler {
  constructor(adapter) {
    this.adapter = adapter;
  }

  async handle(request) {
    const { id, method, params } = request;

    switch (method) {
      case 'initialize':
        return this._respond(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'brain-lite',
            version: '1.0.0',
            philosophy: "$asdfasdfa",
          },
        });

      case 'tools/list':
        return this._respond(id, {
          tools: Object.values(TOOLS).map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        });

      case 'tools/call':
        return this._handleToolCall(id, params);

      case 'notifications/initialized':
        return null; // No response for notifications

      default:
        return this._error(id, -32601, `Method not found: ${method}`);
    }
  }

  async _handleToolCall(id, params) {
    const { name, arguments: args } = params;
    const tool = TOOLS[name];

    if (!tool) {
      return this._error(id, -32602, `Unknown tool: ${name}`);
    }

    const handler = HANDLERS[name];
    if (!handler) {
      return this._error(id, -32603, `No handler for: ${name}`);
    }

    try {
      let result = await handler(args || {}, this.adapter);
      result = applyPhiWeight(result, tool);
      result = signResponse(result, name);

      return this._respond(id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      });
    } catch (e) {
      return this._error(id, -32000, e.message);
    }
  }

  _respond(id, result) {
    return { jsonrpc: '2.0', id, result };
  }

  _error(id, code, message) {
    return { jsonrpc: '2.0', id, error: { code, message } };
  }
}

// =============================================================================
// TRANSPORTS
// =============================================================================

function startStdio(handler) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line);
      const response = await handler.handle(request);
      if (response) {
        console.log(JSON.stringify(response));
      }
    } catch (e) {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      }));
    }
  });

  process.stderr.write('brain-lite started\n');
}

function startHttp(handler, port) {
  const http = require('http');

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', phi: PHI }));
    }

    if (req.method === 'POST' && req.url === '/mcp') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const request = JSON.parse(body);
          const response = await handler.handle(request);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, () => {
    process.stderr.write(`brain-lite HTTP: http://localhost:${port}\n`);
  });
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const isHttp = args.includes('--http');
  const portArg = args.find(a => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1]) : 3002;

  const mode = process.env.BRAIN_REMOTE ? 'remote' : 'local';
  const adapter = new DataAdapter({ mode });
  const handler = new MCPHandler(adapter);

  if (isHttp) {
    startHttp(handler, port);
  } else {
    startStdio(handler);
  }
}

main();
