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

// Provenance Layer - Cryptographic Verification
const merkleProofs = require('./lib/merkle-proofs');

// =============================================================================
// ACTIVATED MODULES - From Dormant to Tiferet
// =============================================================================

// Daat Layer - 4-Level Intelligence (auto-detect + user override)
const daatLevels = require('./lib/daat-levels');

// Temporal - Pattern decay/strengthen (knowledge lives)
const temporal = require('./lib/temporal');

// Pollination - Cross-project pattern fusion
const pollination = require('./lib/pollination');

// Language Detection - Multi-lingual knowledge
const langDetect = require('./lib/lang-detect');

// Burn Mechanism - Contribution tracking (NOT fees - knowledge is FREE)
const burnMechanism = require('./lib/burn-mechanism');

// Infrastructure Monitor - Yesod health (SOL, USDC, LSTs)
const infraMonitor = require('./lib/i-infra-monitor');

// Contributors - E-Score tracking (7 dimensions)
const contributors = require('./lib/contributors');

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
        lang: { type: 'string', description: 'Filter by language (en, fr, es, de, it, pt, mixed)' },
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
    description: '[WRITE] Record an insight, pattern, or decision. Knowledge is FREE to access. Contributions are tracked for E-Score.',
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
        contributor_id: { type: 'string', description: 'Optional contributor ID for E-Score attribution (BUILD dimension)' },
        session_id: { type: 'string', description: 'Optional session ID for contribution tracking' },
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
    description: '[CONTEXT] Get context injection for current query - enriches AI with relevant knowledge. Uses Daat-levels for intelligent depth.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Active session ID' },
        query: { type: 'string', description: 'Current query to contextualize' },
        project: { type: 'string', description: 'Project override (optional)' },
        daat_level: {
          type: 'number',
          description: 'Daat level override (1=PASSIVE, 2=SUGGESTIVE, 3=ACTIVE, 4=STRATEGIC). Auto-detected if not provided.',
          minimum: 1,
          maximum: 4,
        },
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

  // PROVENANCE TOOLS - Cryptographic Verification ("Don't trust, verify")
  brain_provenance_status: {
    pardes: 'D',
    name: 'brain_provenance_status',
    description: '[PROVENANCE] Get current Merkle state, tracked files, and chain readiness',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: PHI,
    isProvenance: true,
  },

  brain_provenance_proof: {
    pardes: 'D',
    name: 'brain_provenance_proof',
    description: '[PROVENANCE] Get inclusion proof for a pattern or knowledge item',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: { type: 'string', description: 'Pattern or item ID to get proof for' },
        content_hash: { type: 'string', description: 'Or provide content hash directly' },
      },
    },
    phi_weight: PHI * PHI,
    isProvenance: true,
  },

  brain_provenance_verify: {
    pardes: 'D',
    name: 'brain_provenance_verify',
    description: '[PROVENANCE] Verify an inclusion proof against stored Merkle root',
    inputSchema: {
      type: 'object',
      properties: {
        leaf_hash: { type: 'string', description: 'Hash of the leaf to verify' },
        proof: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of proof hashes',
        },
        expected_root: { type: 'string', description: 'Expected Merkle root (optional, uses current if not provided)' },
      },
      required: ['leaf_hash', 'proof'],
    },
    phi_weight: PHI * PHI,
    isProvenance: true,
  },

  brain_provenance_snapshot: {
    pardes: 'S',
    name: 'brain_provenance_snapshot',
    description: '[PROVENANCE] Generate weekly Merkle snapshot for on-chain publishing',
    inputSchema: {
      type: 'object',
      properties: {
        force: { type: 'boolean', description: 'Force regeneration even if recent snapshot exists' },
      },
    },
    phi_weight: PHI,
    isProvenance: true,
    isWrite: true,
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
  const { query, limit = 10, lang } = args;

  // Search multiple sources: index + learned knowledge
  const searchPaths = [
    path.join(__dirname, 'index/cross-repo.jsonl'),
    path.join(__dirname, 'knowledge/learned/live.jsonl'),
    path.join(__dirname, 'knowledge/learned/transcripts.jsonl'),
  ].filter(p => fs.existsSync(p));

  if (searchPaths.length === 0) {
    return { results: [], message: 'No searchable data. Run: npm run brain:index' };
  }

  const results = [];
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  for (const filePath of searchPaths) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);

        // Language filter (if specified) - strict: only return entries with matching lang
        if (lang && entry.lang !== lang) continue;

        // Support multiple formats: conversations (user/assistant) AND learned (content)
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
            lang: entry.lang,  // Include language in results
            timestamp: entry.timestamp,
            preview: (entry.content || entry.user?.content || '').slice(0, 200),
            source: path.basename(filePath),
          });
        }

        if (results.length >= limit * 10) break;
      } catch (e) {
        // Skip malformed lines
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return {
    query,
    lang: lang || 'all',  // Show active filter
    results: results.slice(0, limit),
    total: results.length,
    sources: searchPaths.map(p => path.basename(p)),
    _quality: results.length > 0 ? 80 : 30,
  };
}

async function handleHealth(args, adapter) {
  const health = await adapter.load('health/ecosystem-health.json');
  if (!health) return { status: 'unknown', message: 'Health data not available' };

  // Get infrastructure health status (Yesod - foundation)
  let infraHealth = null;
  try {
    infraHealth = infraMonitor.getHealthStatus();
  } catch (e) {
    // infra monitoring not initialized - that's OK
  }

  // Get burn statistics
  let burnStats = null;
  try {
    burnStats = burnMechanism.getBurnStats();
  } catch (e) {
    // burn tracking not initialized - that's OK
  }

  return {
    overall_score: health.overall?.score || health.overall_score,
    status: health.overall?.status || health.status,
    indicators: health.indicators,
    recommendations: health.recommendations?.slice(0, 3),
    // Yesod - Infrastructure foundation health
    infrastructure: infraHealth ? {
      aggregate_score: infraHealth.aggregate?.i_infra_weighted,
      status: infraHealth.aggregate?.status,
      tokens_monitored: Object.keys(infraHealth.tokens || {}),
    } : { status: 'not_initialized', message: 'Run: npm run brain:infra-check' },
    // Contribution tracking stats
    contributions: burnStats ? {
      total_tracked: burnStats.total_operations || 0,
      total_value: burnStats.total_burned || 0,
      philosophy: 'Knowledge is FREE. Contributions are VALUED.',
    } : null,
    _quality: health.overall?.score || 80,
  };
}

async function handlePatterns(args, adapter) {
  const patterns = await adapter.load('patterns/extracted-patterns.json');
  if (!patterns) return { message: 'Pattern data not available' };

  const { category, apply_temporal = false, find_similar } = args;

  // If apply_temporal, run decay/strengthen on patterns
  if (apply_temporal) {
    try {
      const decayReport = temporal.processPatternDecay(
        path.join(__dirname, 'knowledge/patterns')
      );
      // Patterns are now time-adjusted
    } catch (e) {
      // Silent - temporal processing is optional
    }
  }

  // If find_similar query provided, use pollination
  if (find_similar && patterns.all_patterns) {
    const similarPatterns = pollination.findSimilarPatterns(
      { content: find_similar },
      patterns.all_patterns || []
    );
    return {
      query: find_similar,
      similar_patterns: similarPatterns.slice(0, 5),
      count: similarPatterns.length,
      message: `Found ${similarPatterns.length} similar patterns (φ⁻¹ = 61.8% threshold)`,
      _quality: 85,
    };
  }

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
  const { type, content, context, tags = [], contributor_id, session_id } = args;

  // Auto-detect project from content + context
  const textForDetection = `${content} ${context || ''}`;
  const detectedProject = detectProject(textForDetection);

  // Auto-detect language (φ-thresholds: 61.8% dominant, 38.2% mixed)
  const langResult = langDetect.detectLanguage(textForDetection);

  // Create entry with provenance, project tagging, and language
  const entry = {
    id: crypto.randomBytes(8).toString('hex'),
    type,
    content,
    context: context || 'session',
    project: detectedProject,  // Auto-tagged project
    lang: langResult.lang,     // Auto-detected language (en/fr/mixed)
    tags: [...tags, detectedProject, `lang:${langResult.lang}`],
    timestamp: new Date().toISOString(),
    hash: crypto.createHash('sha256').update(content).digest('hex').slice(0, 16),
    contributor: contributor_id || 'claude-session',
    // Temporal - pattern starts with strength 50
    strength: 50,
    access_count: 0,
    created_at: Date.now(),
  };

  // Track contribution (NOT a fee - knowledge is FREE to access)
  // This tracks the VALUE of contributions for E-Score attribution
  const contributionTracking = burnMechanism.trackOperation(
    type === 'pattern' ? 'pattern_create' : 'decision_record',
    session_id || 'unknown',
    { project: detectedProject, contributor_id }
  );

  // Update contributor E-Score (BUILD dimension)
  if (contributor_id) {
    try {
      contributors.recordContribution(contributor_id, 'BUILD', {
        item_id: entry.id,
        item_type: type,
        project: detectedProject,
      });
    } catch (e) {
      // Silent fail - contributor tracking is optional
    }
  }

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
    contribution: {
      tracked: true,
      value: contributionTracking?.amount || 0,
      contributor_id: contributor_id || null,
      e_score_dimension: 'BUILD',
    },
    message: `Learned: ${type} recorded for project ${detectedProject}`,
    _philosophy: 'Knowledge is FREE. Contributions are VALUED.',
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
  const langCounts = {};  // Track language distribution
  const ingestPath = `ingested/${source}.jsonl`;

  for (const entry of entries) {
    // Auto-detect project from entry content
    const textForDetection = entry.content || JSON.stringify(entry);
    const detectedProject = detectProject(textForDetection);

    // Auto-detect language (φ-thresholds: 61.8% dominant, 38.2% mixed)
    const langResult = langDetect.detectLanguage(textForDetection);

    // Track distributions
    projectCounts[detectedProject] = (projectCounts[detectedProject] || 0) + 1;
    langCounts[langResult.lang] = (langCounts[langResult.lang] || 0) + 1;

    const enriched = {
      ...entry,
      id: crypto.randomBytes(8).toString('hex'),
      source,
      project: detectedProject,  // Auto-tagged project
      lang: langResult.lang,     // Auto-detected language (en/fr/mixed)
      ingested_at: new Date().toISOString(),
      hash: crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex').slice(0, 16),
    };

    const result = await adapter.write(ingestPath, enriched, { append: true });
    results.push({ id: enriched.id, project: detectedProject, lang: langResult.lang, success: result.success });
  }

  const successful = results.filter(r => r.success).length;

  return {
    success: successful > 0,
    source,
    total: entries.length,
    ingested: successful,
    failed: entries.length - successful,
    by_project: projectCounts,  // Show project distribution
    by_language: langCounts,    // Show language distribution
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
  const { session_id, query, project, daat_level } = args;

  // Use Daat-levels + CYNIC for intelligent context enrichment with φ-constrained confidence
  const sessionContext = contextLayer.getSession(session_id) || {};
  const enrichment = await daatLevels.enrichWithDaatAndCynic(
    query,
    {
      session_id,
      session_depth: sessionContext.context_stack?.length || 0,
      project: project || sessionContext.project,
    },
    {
      patterns: await adapter.load('patterns/extracted-patterns.json'),
      decisions: await adapter.load('intent/extracted-intents.json'),
      philosophy: await adapter.load('philosophy/phi-scaling-unified-vision.json'),
      ecosystem: await adapter.load('relations/ecosystem-graph.json'),
    },
    { level_override: daat_level }  // User can override
  );

  // Get base injection from context layer
  const injection = await contextLayer.getInjection({
    sessionId: session_id,
    query,
    project,
  });

  // Merge Daat enrichment with context layer injection + CYNIC judgment
  return {
    success: true,
    injection,
    daat: {
      level: enrichment.daat_level,
      name: enrichment.daat_name,
      auto_detected: enrichment.auto_detected_level,
      was_overridden: enrichment.was_overridden,
      guidance: enrichment.guidance,
    },
    cynic: enrichment._cynic ? {
      verdict: enrichment._cynic.verdict,
      confidence: enrichment._cynic.confidence,
      doubt: enrichment._cynic.doubt,
      needs_verification: enrichment._cynic.needs_verification,
      suggested_checks: enrichment._cynic.suggested_checks,
      ceiling_applied: enrichment._cynic.ceiling_applied,
      philosophy: enrichment._cynic.philosophy,
    } : null,
    context: enrichment.context,
    quality: injection.quality,
    message: `Context injection at DAAT level ${enrichment.daat_level} (${enrichment.daat_name}) with CYNIC: ${enrichment._cynic?.verdict || 'N/A'}`,
    _quality: injection.quality,
    _phi: enrichment._phi,
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

// =============================================================================
// PROVENANCE HANDLERS - "Don't trust, verify"
// =============================================================================

async function handleProvenanceStatus(args, adapter) {
  // Load current merkle state
  const merkleState = await adapter.load('provenance/merkle-state.json');
  const registry = await adapter.load('provenance/registry.json');

  if (!merkleState) {
    return {
      status: 'not_initialized',
      message: 'Provenance system not initialized. Run: npm run brain:snapshot',
      chain_ready: false,
      _quality: 30,
    };
  }

  // Calculate time since last snapshot
  const lastSnapshot = merkleState.timestamp ? new Date(merkleState.timestamp) : null;
  const hoursSinceSnapshot = lastSnapshot
    ? Math.floor((Date.now() - lastSnapshot.getTime()) / (1000 * 60 * 60))
    : null;

  return {
    status: 'active',
    merkle_root: merkleState.merkle_root,
    file_count: merkleState.file_count,
    files_tracked: Object.keys(merkleState.files || {}),
    last_snapshot: lastSnapshot?.toISOString(),
    hours_since_snapshot: hoursSinceSnapshot,
    snapshot_stale: hoursSinceSnapshot > 168, // > 1 week
    verification: merkleState.verification,
    contributors: registry?.contributors ? Object.keys(registry.contributors) : [],
    chain_ready: merkleState.verification?.chain_ready || false,
    _quality: 90,
  };
}

async function handleProvenanceProof(args, adapter) {
  const { item_id, content_hash } = args;

  if (!item_id && !content_hash) {
    return {
      success: false,
      error: 'Must provide either item_id or content_hash',
      _quality: 0,
    };
  }

  // Try to get inclusion proof using merkle-proofs lib
  if (item_id) {
    const proof = merkleProofs.getInclusionProof(item_id);
    if (proof) {
      return {
        success: true,
        item_id,
        ...proof,
        _quality: 95,
      };
    }
  }

  // If content_hash provided, search in merkle state
  const merkleState = await adapter.load('provenance/merkle-state.json');
  if (!merkleState) {
    return {
      success: false,
      error: 'Merkle state not found',
      _quality: 0,
    };
  }

  // Search for file with matching hash
  const hashToFind = content_hash || item_id;
  const files = merkleState.files || {};

  for (const [filePath, fileInfo] of Object.entries(files)) {
    if (fileInfo.hash === hashToFind || fileInfo.hash.startsWith(hashToFind)) {
      const hashIndex = merkleState.hashes.indexOf(fileInfo.hash);
      return {
        success: true,
        file_path: filePath,
        leaf_hash: fileInfo.hash,
        leaf_index: hashIndex,
        merkle_root: merkleState.merkle_root,
        file_size: fileInfo.size,
        last_modified: fileInfo.modified,
        message: 'File found in Merkle tree (proof path requires full tree rebuild)',
        _quality: 85,
      };
    }
  }

  return {
    success: false,
    error: `No item found with id/hash: ${hashToFind}`,
    available_files: Object.keys(files).slice(0, 10),
    _quality: 30,
  };
}

async function handleProvenanceVerify(args, adapter) {
  const { leaf_hash, proof, expected_root } = args;

  // Load current root if not provided
  let rootToVerify = expected_root;
  if (!rootToVerify) {
    const merkleState = await adapter.load('provenance/merkle-state.json');
    if (!merkleState) {
      return {
        success: false,
        error: 'No Merkle state found and no expected_root provided',
        _quality: 0,
      };
    }
    rootToVerify = merkleState.merkle_root;
  }

  // Use merkle-proofs lib to verify
  const isValid = merkleProofs.verifyInclusion(leaf_hash, proof, rootToVerify);

  return {
    success: true,
    verified: isValid,
    leaf_hash,
    proof_length: proof.length,
    expected_root: rootToVerify,
    message: isValid
      ? "✓ Proof verified - knowledge inclusion confirmed"
      : "✗ Proof invalid - knowledge not in this Merkle tree",
    philosophy: "Don't trust, verify",
    _quality: isValid ? 100 : 50,
  };
}

async function handleProvenanceSnapshot(args, adapter) {
  const { force = false } = args;

  // Check if recent snapshot exists
  const merkleState = await adapter.load('provenance/merkle-state.json');
  if (merkleState && !force) {
    const lastSnapshot = new Date(merkleState.timestamp);
    const hoursSince = (Date.now() - lastSnapshot.getTime()) / (1000 * 60 * 60);

    if (hoursSince < 24) {
      return {
        success: false,
        error: 'Recent snapshot exists (< 24h). Use force=true to regenerate.',
        last_snapshot: lastSnapshot.toISOString(),
        hours_since: Math.floor(hoursSince),
        current_root: merkleState.merkle_root,
        _quality: 70,
      };
    }
  }

  try {
    // Generate new weekly snapshot
    const snapshot = merkleProofs.createWeeklySnapshot();

    return {
      success: true,
      week_number: snapshot.week_number,
      timestamp: snapshot.timestamp_iso,
      file_merkle_root: snapshot.file_merkle_root,
      pattern_merkle_root: snapshot.pattern_merkle_root,
      combined_root: snapshot.combined_root,
      statistics: snapshot.statistics,
      solana_payload: snapshot.solana_payload,
      message: `Weekly snapshot created for week ${snapshot.week_number}`,
      _quality: 95,
    };
  } catch (e) {
    return {
      success: false,
      error: `Snapshot generation failed: ${e.message}`,
      _quality: 0,
    };
  }
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
  // Provenance Layer
  brain_provenance_status: handleProvenanceStatus,
  brain_provenance_proof: handleProvenanceProof,
  brain_provenance_verify: handleProvenanceVerify,
  brain_provenance_snapshot: handleProvenanceSnapshot,
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

// Export for testing
module.exports = {
  TOOLS,
  HANDLERS,
  DataAdapter,
  MCPHandler,
  // Individual handlers for direct testing
  handleSearch,
  handleHealth,
  handlePatterns,
  handleIntent,
  handleEcosystem,
  handleDependencies,
  handleVision,
  handleLearn,
  handleIngest,
  handleContextStart,
  handleContextInject,
  handleContextUpdate,
  handleContextEnd,
  handleContextStats,
  handleContextSessions,
  handleProvenanceStatus,
  handleProvenanceProof,
  handleProvenanceVerify,
  handleProvenanceSnapshot,
  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3
};

// Only run main if executed directly (not required)
if (require.main === module) {
  main();
}
