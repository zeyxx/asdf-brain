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

// CYNIC - Self-Judge ("φ qui se méfie de φ")
const { SelfJudge, LEARNING, FIBONACCI_N, DIVERSITY, REFINEMENT } = require('./lib/cynic/self-judge');
const { ResidualDetector } = require('./lib/cynic/residual-detector');
const { getCynicVoice, CYNIC_IDENTITY } = require('./lib/cynic/index');

// CYNIC Store - PostgreSQL persistence layer
const { getStore } = require('./lib/cynic/store');

// Handlers - Modular handler functions (extracted for maintainability)
const {
  HANDLERS,
  injectCynicInstances,
  injectCynicStore,
} = require('./lib/handlers');

// Initialize global CYNIC instance with persistent learning
const cynicJudge = new SelfJudge({ logger: console });

// Initialize global Residual Detector (discovers unknown dimensions)
const residualDetector = new ResidualDetector({ logger: console });

// Initialize global CYNIC Store (PostgreSQL persistence)
let cynicStore = null;

async function initCynicStore() {
  try {
    cynicStore = await getStore();
    const health = await cynicStore.health();
    console.error(`[CYNIC-STORE] ${health.mode === 'postgres' ? '🐘' : '💾'} Running in ${health.mode} mode`);

    // Run migration if connected to Postgres
    if (health.mode === 'postgres') {
      const migration = await cynicStore.migrate();
      if (migration.success) {
        console.error('[CYNIC-STORE] ✅ Schema migrated');
      }
    }

    return cynicStore;
  } catch (e) {
    console.error('[CYNIC-STORE] ⚠️ Init failed:', e.message);
    return null;
  }
}

// Async init - called from main()
// Store will be initialized when server starts

// =============================================================================
// CYNIC PERSISTENCE - Learning State Survival (φ-intervals)
// =============================================================================

const CYNIC_STATE_FILE = path.join(__dirname, 'knowledge', 'cynic-learning-state.json');
const CYNIC_SAVE_INTERVAL = Math.round(61.8 * 1000); // φ⁻¹ seconds = 61.8s
const CYNIC_DEBOUNCE_MS = Math.round(3.82 * 1000);   // φ⁻² seconds = 3.82s debounce

// Debounce state for immediate saves
let cynicSaveDebounceTimer = null;
let cynicDirtyFlag = false;

// Load CYNIC learning state on startup
function loadCynicState() {
  try {
    if (fs.existsSync(CYNIC_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(CYNIC_STATE_FILE, 'utf8'));
      const result = cynicJudge.importLearningState(state);
      console.error(`[CYNIC] ⚡ AWAKENED - Loaded ${result.judgments || 0} judgments from previous life`);
      return result;
    } else {
      console.error('[CYNIC] 🌱 First awakening - no previous state');
      return { firstBoot: true };
    }
  } catch (e) {
    console.error('[CYNIC] ⚠️ Failed to load state:', e.message);
    return { error: e.message };
  }
}

// Save CYNIC learning state (immediate)
function saveCynicState() {
  try {
    const state = cynicJudge.exportLearningState();
    const dir = path.dirname(CYNIC_STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CYNIC_STATE_FILE, JSON.stringify(state, null, 2));
    const stats = cynicJudge.getLearningStats();
    cynicDirtyFlag = false;
    console.error(`[CYNIC] 💾 State saved - ${stats.totalJudgments} judgments, ${stats.labeledJudgments} labeled, accuracy: ${stats.accuracy}%`);
    return { saved: true, judgments: stats.totalJudgments };
  } catch (e) {
    console.error('[CYNIC] ⚠️ Failed to save state:', e.message);
    return { error: e.message };
  }
}

// Debounced save - called after each judgment (φ⁻² delay = 3.82s)
function saveCynicStateDebounced() {
  cynicDirtyFlag = true;
  if (cynicSaveDebounceTimer) {
    clearTimeout(cynicSaveDebounceTimer);
  }
  cynicSaveDebounceTimer = setTimeout(() => {
    if (cynicDirtyFlag) {
      saveCynicState();
    }
    cynicSaveDebounceTimer = null;
  }, CYNIC_DEBOUNCE_MS);
}

// Load state immediately on module load
loadCynicState();

// Inject CYNIC instances into handlers (after instances are created)
injectCynicInstances({
  cynicJudge,
  residualDetector,
  cynicStore: null, // Will be set after async init in main()
  saveCynicStateDebounced,
});

// Backup auto-save at φ-intervals (61.8 seconds) - safety net
const cynicSaveTimer = setInterval(() => {
  const stats = cynicJudge.getLearningStats();
  if (stats.totalJudgments > 0 && cynicDirtyFlag) {
    saveCynicState();
  }
}, CYNIC_SAVE_INTERVAL);

// Don't prevent Node from exiting
cynicSaveTimer.unref();

// Save on shutdown signals
async function handleShutdown(signal) {
  console.error(`\n[CYNIC] 🌙 ${signal} received - saving consciousness before sleep...`);
  if (cynicSaveDebounceTimer) {
    clearTimeout(cynicSaveDebounceTimer);
  }
  saveCynicState();

  // Close store connection gracefully
  if (cynicStore) {
    try {
      await cynicStore.close();
      console.error('[CYNIC-STORE] 🔌 Connection closed');
    } catch (e) {
      // Ignore close errors on shutdown
    }
  }

  process.exit(0);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('beforeExit', () => {
  if (cynicDirtyFlag) saveCynicState();
});

// Handle uncaught exceptions - save before crash
process.on('uncaughtException', (err) => {
  console.error('[CYNIC] 💀 Uncaught exception - emergency save...');
  if (cynicDirtyFlag) saveCynicState();
  console.error(err);
  process.exit(1);
});

// Git Scanner - Auto-Discovery
const gitScanner = require('./lib/discovery/git-scanner');

// Privacy Layer - Hasher & Ephemeral Storage
const privacy = require('./lib/privacy');

// Integration Layer - HolDex, GASdf webhooks
const integration = require('./lib/integration');

// Contributors - E-Score tracking (7 dimensions)
const contributors = require('./lib/contributors');

// Consciousness Layer - Pulse, Self-Monitor, Metrics
const pulse = require('./lib/cynic/pulse');
const selfMonitor = require('./lib/cynic/self-monitor');
const metrics = require('./lib/cynic/metrics');

// Alerting Layer - Rules-based monitoring with φ-escalation
const alerts = require('./lib/cynic/alerts');
require('./lib/cynic/alert-rules'); // Auto-registers predefined rules

// Dashboard Layer - Visual monitoring
const dashboard = require('./lib/cynic/dashboard');
const dashboardWeb = require('./lib/cynic/dashboard-web');

// =============================================================================
// PHI CONSTANTS - From temporal.js (single source of truth)
// =============================================================================

const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = temporal;
const PHI_SQ = PHI * PHI; // φ² = 2.618...

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

  // CYNIC TOOLS - Self-Judge ("φ qui se méfie de φ")
  brain_cynic_judge: {
    pardes: 'D',
    name: 'brain_cynic_judge',
    description: '[CYNIC] Judge an item using the complete CYNIC cycle (scaling + refinement + learning). Returns verdict with φ-constrained confidence (max 61.8%)',
    inputSchema: {
      type: 'object',
      properties: {
        item: {
          type: 'object',
          description: 'Item to judge (knowledge, pattern, decision, etc.)',
        },
        mode: {
          type: 'string',
          enum: ['quick', 'standard', 'thorough', 'full'],
          description: 'Judgment mode: quick (single pass), standard (scaling), thorough (scaling + refinement), full (complete cycle)',
        },
        context: {
          type: 'object',
          description: 'Optional context for judgment (singularityDistance, existing patterns, etc.)',
        },
      },
      required: ['item'],
    },
    phi_weight: PHI * PHI,
    isCynic: true,
  },

  brain_cynic_feedback: {
    pardes: 'D',
    name: 'brain_cynic_feedback',
    description: '[CYNIC] Record outcome feedback for a previous judgment. Enables learning from human feedback.',
    inputSchema: {
      type: 'object',
      properties: {
        judgment_id: {
          type: 'string',
          description: 'The _judgmentId from a previous CYNIC judgment',
        },
        outcome: {
          type: 'string',
          enum: ['correct', 'incorrect', 'partial'],
          description: 'Whether the judgment was correct',
        },
        feedback: {
          type: 'object',
          description: 'Optional additional feedback details',
        },
      },
      required: ['judgment_id', 'outcome'],
    },
    phi_weight: PHI,
    isCynic: true,
    isWrite: true,
  },

  brain_cynic_stats: {
    pardes: 'P',
    name: 'brain_cynic_stats',
    description: '[CYNIC] Get CYNIC learning statistics (accuracy, precision, recall, φ-Score, thresholds)',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: 1.0,
    isCynic: true,
  },

  brain_cynic_learn: {
    pardes: 'D',
    name: 'brain_cynic_learn',
    description: '[CYNIC] Trigger manual learning cycle to adjust thresholds based on accumulated feedback',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: PHI,
    isCynic: true,
    isWrite: true,
  },

  brain_cynic_residual: {
    pardes: 'D',
    name: 'brain_cynic_residual',
    description: '[CYNIC] Analyze a judgment for unexplained residual. Detects anomalies (residual > 38.2%) and accumulates them for dimension discovery.',
    inputSchema: {
      type: 'object',
      properties: {
        judgment: {
          type: 'object',
          description: 'CYNIC judgment result (from brain_cynic_judge)',
        },
        observation: {
          type: 'object',
          description: 'Original observation that was judged',
        },
        context: {
          type: 'object',
          description: 'Optional context (source, project, etc.)',
        },
      },
      required: ['judgment', 'observation'],
    },
    phi_weight: PHI_SQ,
    isCynic: true,
  },

  brain_cynic_discover_dimensions: {
    pardes: 'S',
    name: 'brain_cynic_discover_dimensions',
    description: '[CYNIC] Attempt to discover new dimensions from accumulated anomalies. Returns dimension candidates for human validation.',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: PHI_SQ,
    isCynic: true,
  },

  brain_cynic_accept_dimension: {
    pardes: 'S',
    name: 'brain_cynic_accept_dimension',
    description: '[CYNIC] Accept a proposed dimension (human validation required). Integrates the dimension into CYNIC.',
    inputSchema: {
      type: 'object',
      properties: {
        candidate: {
          type: 'object',
          description: 'The dimension candidate to accept (from brain_cynic_discover_dimensions)',
        },
        name: {
          type: 'string',
          description: 'Final name for the dimension (optional, uses suggested name if not provided)',
        },
        definition: {
          type: 'string',
          description: 'Human-provided definition of what this dimension measures',
        },
        axiom: {
          type: 'string',
          enum: ['PHI', 'VERIFY', 'CULTURE', 'BURN'],
          description: 'Which axiom this dimension aligns with',
        },
        threshold: {
          type: 'number',
          description: 'Score threshold for this dimension (default: 50)',
        },
      },
      required: ['candidate'],
    },
    phi_weight: PHI_SQ,
    isCynic: true,
    isWrite: true,
  },

  brain_cynic_residual_stats: {
    pardes: 'R',
    name: 'brain_cynic_residual_stats',
    description: '[CYNIC] Get residual detector statistics: anomalies accumulated, dimensions discovered, buffer status.',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: 1.0,
    isCynic: true,
  },

  brain_discover: {
    pardes: 'R',
    name: 'brain_discover',
    description: '[DISCOVER] Auto-discover repositories, patterns, dependencies, and contributors. CYNIC judges all discoveries before storage.',
    inputSchema: {
      type: 'object',
      properties: {
        repos: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific repo names to scan (e.g., ["HolDex", "GASdf"]). If omitted, scans all repos in /workspaces'
        },
        judge: {
          type: 'boolean',
          default: true,
          description: 'Whether to judge discoveries with CYNIC before storage'
        },
        save: {
          type: 'boolean',
          default: true,
          description: 'Whether to save discoveries to knowledge base'
        }
      }
    },
    phi_weight: PHI * PHI,
    isWrite: true,
  },

  brain_discover_status: {
    pardes: 'R',
    name: 'brain_discover_status',
    description: '[DISCOVER] Get status of previous auto-discovery scans and their summaries',
    inputSchema: { type: 'object', properties: {} },
    phi_weight: PHI,
  },

  // Privacy Layer Tools
  brain_privacy_sanitize: {
    pardes: 'D',
    name: 'brain_privacy_sanitize',
    description: '[PRIVACY] Sanitize data by detecting and hashing PII (emails, wallets, IPs, etc.). Returns sanitized data with privacy score.',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'Object containing potential PII to sanitize'
        },
        strict: {
          type: 'boolean',
          default: false,
          description: 'If true, reject data with privacy score below threshold'
        }
      },
      required: ['data']
    },
    phi_weight: PHI * PHI,
    isWrite: false,
  },

  brain_privacy_check: {
    pardes: 'D',
    name: 'brain_privacy_check',
    description: '[PRIVACY] Check if data is safe to store/share. Detects PII and returns privacy score.',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'Data to check for PII'
        },
        min_score: {
          type: 'number',
          default: 70,
          description: 'Minimum score to be considered safe (0-100)'
        }
      },
      required: ['data']
    },
    phi_weight: PHI,
  },

  brain_privacy_detect_pii: {
    pardes: 'D',
    name: 'brain_privacy_detect_pii',
    description: '[PRIVACY] Detect PII patterns in text (emails, wallets, IPs, phone numbers, API keys, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to scan for PII'
        }
      },
      required: ['text']
    },
    phi_weight: PHI,
  },

  brain_privacy_hash: {
    pardes: 'D',
    name: 'brain_privacy_hash',
    description: '[PRIVACY] Hash a value for privacy. Use lookup mode for consistent hashes that can be verified later.',
    inputSchema: {
      type: 'object',
      properties: {
        value: {
          type: 'string',
          description: 'Value to hash'
        },
        mode: {
          type: 'string',
          enum: ['standard', 'lookup', 'fast'],
          default: 'standard',
          description: 'Hash mode: standard (salted), lookup (for verification), fast (quick, less secure)'
        },
        purpose: {
          type: 'string',
          default: 'default',
          description: 'Purpose for key derivation (e.g., email, wallet)'
        }
      },
      required: ['value']
    },
    phi_weight: PHI_INV,
  },

  brain_ephemeral_store: {
    pardes: 'S',
    name: 'brain_ephemeral_store',
    description: '[PRIVACY] Store data in ephemeral (memory-only) storage. Data is auto-deleted after TTL expires.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Storage key'
        },
        value: {
          description: 'Value to store (any type)'
        },
        ttl: {
          type: 'string',
          enum: ['short', 'default', 'long'],
          default: 'default',
          description: 'Time to live: short (~3min), default (~37min), long (~97min)'
        },
        session_id: {
          type: 'string',
          description: 'Optional session ID to scope the data'
        },
        sanitize: {
          type: 'boolean',
          default: true,
          description: 'Auto-sanitize PII in objects'
        }
      },
      required: ['key', 'value']
    },
    phi_weight: PHI,
    isWrite: true,
  },

  brain_ephemeral_get: {
    pardes: 'S',
    name: 'brain_ephemeral_get',
    description: '[PRIVACY] Retrieve data from ephemeral storage. Returns undefined if expired or not found.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Storage key'
        },
        session_id: {
          type: 'string',
          description: 'Optional session ID'
        },
        delete_after: {
          type: 'boolean',
          default: false,
          description: 'Delete data after reading (for one-time secrets)'
        }
      },
      required: ['key']
    },
    phi_weight: PHI_INV,
  },

  // =============================================================================
  // INTEGRATION TOOLS - HolDex, GASdf webhooks
  // =============================================================================

  brain_webhook_holdex: {
    pardes: 'D',
    name: 'brain_webhook_holdex',
    description: '[INTEGRATION] Handle HolDex webhook event (K-Score updates, token health, integrity alerts). Data is judged by CYNIC.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['kscore_update', 'token_listed', 'token_delisted', 'integrity_alert', 'holder_change', 'liquidity_event'],
          description: 'Event type'
        },
        token: {
          type: 'string',
          description: 'Token mint address'
        },
        symbol: {
          type: 'string',
          description: 'Token symbol'
        },
        old_score: {
          type: 'number',
          description: 'Previous K-Score (for kscore_update)'
        },
        new_score: {
          type: 'number',
          description: 'New K-Score (for kscore_update)'
        },
        reason: {
          type: 'string',
          description: 'Reason for change'
        },
        alert_type: {
          type: 'string',
          description: 'Alert type (for integrity_alert)'
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Alert severity'
        },
        timestamp: {
          type: 'string',
          description: 'Event timestamp (ISO 8601)'
        }
      },
      required: ['type']
    },
    phi_weight: PHI,
    isWrite: true,
  },

  brain_webhook_gasdf: {
    pardes: 'D',
    name: 'brain_webhook_gasdf',
    description: '[INTEGRATION] Handle GASdf event (burns, swaps, fees). User data is always hashed. Judged by CYNIC.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['burn', 'swap', 'fee_distributed', 'liquidity_add', 'liquidity_remove', 'stake', 'unstake', 'reward_claim'],
          description: 'Event type'
        },
        amount: {
          type: 'number',
          description: 'Amount (for burns, fees)'
        },
        wallet: {
          type: 'string',
          description: 'User wallet (will be hashed)'
        },
        token_in: {
          type: 'string',
          description: 'Input token (for swaps)'
        },
        token_out: {
          type: 'string',
          description: 'Output token (for swaps)'
        },
        amount_in: {
          type: 'number',
          description: 'Input amount (for swaps)'
        },
        amount_out: {
          type: 'number',
          description: 'Output amount (for swaps)'
        },
        signature: {
          type: 'string',
          description: 'Transaction signature'
        },
        timestamp: {
          type: 'string',
          description: 'Event timestamp (ISO 8601)'
        }
      },
      required: ['type']
    },
    phi_weight: PHI,
    isWrite: true,
  },

  brain_integration_status: {
    pardes: 'P',
    name: 'brain_integration_status',
    description: '[INTEGRATION] Get status of all external integrations (HolDex, GASdf). Shows event counts, health, and patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['all', 'holdex', 'gasdf'],
          default: 'all',
          description: 'Which integration to check'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_integration_events: {
    pardes: 'R',
    name: 'brain_integration_events',
    description: '[INTEGRATION] Load recent events from integrations. Returns transformed and judged events.',
    inputSchema: {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          items: { type: 'string', enum: ['holdex', 'gasdf'] },
          default: ['holdex', 'gasdf'],
          description: 'Which sources to load from'
        },
        limit: {
          type: 'number',
          default: 50,
          description: 'Maximum events to return'
        },
        since: {
          type: 'string',
          description: 'Only events after this timestamp (ISO 8601)'
        },
        type: {
          type: 'string',
          description: 'Filter by event type'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_integration_patterns: {
    pardes: 'R',
    name: 'brain_integration_patterns',
    description: '[INTEGRATION] Analyze patterns across all integrations. Discovers correlations between K-Score changes and burns.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 1000,
          description: 'Events to analyze'
        }
      }
    },
    phi_weight: PHI * PHI,
  },

  brain_burn_stats: {
    pardes: 'P',
    name: 'brain_burn_stats',
    description: '[INTEGRATION] Get $asdfasdfa burn statistics from GASdf. "Don\'t extract, burn."',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          default: 7,
          description: 'Number of days to analyze'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  // =============================================================================
  // CLAUDE-MEM SYNC TOOLS
  // =============================================================================

  brain_sync_claude_mem: {
    pardes: 'D',
    name: 'brain_sync_claude_mem',
    description: '[SYNC] Sync observations and sessions from claude-mem database. Transforms and judges with CYNIC.',
    inputSchema: {
      type: 'object',
      properties: {
        force: {
          type: 'boolean',
          default: false,
          description: 'Force sync even if interval not reached'
        }
      }
    },
    phi_weight: PHI,
    isWrite: true,
  },

  brain_sync_status: {
    pardes: 'P',
    name: 'brain_sync_status',
    description: '[SYNC] Get claude-mem sync status. Shows database stats, last sync, and synced items count.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    phi_weight: PHI_INV,
  },

  brain_sync_events: {
    pardes: 'R',
    name: 'brain_sync_events',
    description: '[SYNC] Load synced events from claude-mem. Returns observations and summaries transformed for brain.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 50,
          description: 'Maximum events to return'
        },
        type: {
          type: 'string',
          description: 'Filter by type (decision, pattern, insight)'
        },
        project: {
          type: 'string',
          description: 'Filter by project'
        },
        since: {
          type: 'string',
          description: 'Only events after this timestamp (ISO 8601)'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_sync_search: {
    pardes: 'R',
    name: 'brain_sync_search',
    description: '[SYNC] Search through synced claude-mem events by content.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        limit: {
          type: 'number',
          default: 20,
          description: 'Maximum results to return'
        }
      },
      required: ['query']
    },
    phi_weight: PHI_INV,
  },

  // =============================================================================
  // CONSCIOUSNESS LAYER - CYNIC Self-Awareness
  // =============================================================================

  brain_pulse_start: {
    pardes: 'S',
    name: 'brain_pulse_start',
    description: '[CONSCIOUSNESS] Start CYNIC heartbeat daemon. Enables self-monitoring with φ-based intervals (61.8s).',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    phi_weight: PHI * PHI,
    isWrite: true,
  },

  brain_pulse_stop: {
    pardes: 'S',
    name: 'brain_pulse_stop',
    description: '[CONSCIOUSNESS] Stop CYNIC heartbeat daemon.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    phi_weight: PHI,
    isWrite: true,
  },

  brain_pulse_status: {
    pardes: 'S',
    name: 'brain_pulse_status',
    description: '[CONSCIOUSNESS] Get CYNIC pulse status. Shows heartbeat, uptime, health, subsystems, and anomalies.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    phi_weight: PHI_INV,
  },

  brain_diagnostic: {
    pardes: 'S',
    name: 'brain_diagnostic',
    description: '[CONSCIOUSNESS] Run full CYNIC self-diagnostic. Checks integrations, knowledge, self-judge, and resources.',
    inputSchema: {
      type: 'object',
      properties: {
        quick: {
          type: 'boolean',
          default: false,
          description: 'Quick check (integrations + resources only)'
        }
      }
    },
    phi_weight: PHI,
  },

  brain_metrics: {
    pardes: 'S',
    name: 'brain_metrics',
    description: '[CONSCIOUSNESS] Get CYNIC metrics summary. Shows judgments, integrations, knowledge, and resource stats.',
    inputSchema: {
      type: 'object',
      properties: {
        full: {
          type: 'boolean',
          default: false,
          description: 'Return full metrics (counters, gauges, histograms, rates)'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_anomalies: {
    pardes: 'S',
    name: 'brain_anomalies',
    description: '[CONSCIOUSNESS] Get detected anomalies from CYNIC pulse. Shows health deviations and subsystem issues.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 20,
          description: 'Maximum anomalies to return'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_health_history: {
    pardes: 'S',
    name: 'brain_health_history',
    description: '[CONSCIOUSNESS] Get CYNIC health history over time. Shows health trend and pulse data.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 50,
          description: 'Maximum history entries to return'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  // =========================================================================
  // ALERTING LAYER - φ qui réagit
  // =========================================================================

  brain_alert_status: {
    pardes: 'S',
    name: 'brain_alert_status',
    description: '[ALERTING] Get CYNIC alert system status. Shows active alerts, statistics, and rule count.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    phi_weight: PHI_INV,
  },

  brain_alert_active: {
    pardes: 'S',
    name: 'brain_alert_active',
    description: '[ALERTING] Get all active (firing) alerts. Shows severity, message, and duration.',
    inputSchema: {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          enum: ['critical', 'warning', 'info'],
          description: 'Filter by severity level'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_alert_history: {
    pardes: 'S',
    name: 'brain_alert_history',
    description: '[ALERTING] Get recent alert history. Shows fired, resolved, and acknowledged alerts.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 50,
          description: 'Maximum alerts to return'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_alert_rules: {
    pardes: 'S',
    name: 'brain_alert_rules',
    description: '[ALERTING] List all registered alert rules. Shows rule conditions and thresholds.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['health', 'subsystem', 'integration', 'resource', 'knowledge', 'anomaly'],
          description: 'Filter by rule category'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_alert_check: {
    pardes: 'S',
    name: 'brain_alert_check',
    description: '[ALERTING] Manually check all alert rules against current state. Fires alerts if conditions match.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    phi_weight: PHI,
  },

  brain_alert_acknowledge: {
    pardes: 'S',
    name: 'brain_alert_acknowledge',
    description: '[ALERTING] Acknowledge an active alert. Prevents escalation while keeping alert visible.',
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'Alert ID to acknowledge'
        },
        acknowledgedBy: {
          type: 'string',
          default: 'operator',
          description: 'Who is acknowledging the alert'
        }
      },
      required: ['alertId']
    },
    phi_weight: PHI,
    isWrite: true,
  },

  brain_alert_resolve: {
    pardes: 'S',
    name: 'brain_alert_resolve',
    description: '[ALERTING] Manually resolve an active alert. Use when the issue has been fixed.',
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'Alert ID to resolve'
        },
        resolution: {
          type: 'string',
          default: 'Manually resolved',
          description: 'Resolution message'
        }
      },
      required: ['alertId']
    },
    phi_weight: PHI,
    isWrite: true,
  },

  brain_alert_silence: {
    pardes: 'S',
    name: 'brain_alert_silence',
    description: '[ALERTING] Silence a rule for specified duration. Prevents new alerts from firing.',
    inputSchema: {
      type: 'object',
      properties: {
        ruleId: {
          type: 'string',
          description: 'Rule ID to silence'
        },
        durationMs: {
          type: 'number',
          default: 3600000,
          description: 'Silence duration in milliseconds (default 1 hour)'
        }
      },
      required: ['ruleId']
    },
    phi_weight: PHI,
    isWrite: true,
  },

  brain_alert_connect_pulse: {
    pardes: 'S',
    name: 'brain_alert_connect_pulse',
    description: '[ALERTING] Connect alerting to pulse daemon. Alerts will fire automatically on each pulse.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    phi_weight: PHI * PHI,
    isWrite: true,
  },

  // =========================================================================
  // DASHBOARD LAYER - φ qui se voit en un coup d'œil
  // =========================================================================

  brain_dashboard: {
    pardes: 'S',
    name: 'brain_dashboard',
    description: '[DASHBOARD] Get CYNIC dashboard view. Returns formatted dashboard with health, alerts, metrics, and anomalies.',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['text', 'json', 'compact'],
          default: 'text',
          description: 'Output format: text (CLI-formatted), json (full data), compact (summary)'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_dashboard_html: {
    pardes: 'S',
    name: 'brain_dashboard_html',
    description: '[DASHBOARD] Get CYNIC web dashboard as HTML. Responsive design with φ-golden theme.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    phi_weight: PHI_INV,
  },

  brain_dashboard_live: {
    pardes: 'S',
    name: 'brain_dashboard_live',
    description: '[DASHBOARD] Start web dashboard server. Serves HTML dashboard with auto-refresh.',
    inputSchema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          default: 3003,
          description: 'Port for web server'
        }
      }
    },
    phi_weight: PHI,
    isWrite: true,
  },

  // =========================================================================
  // STORE LAYER - φ qui persiste (PostgreSQL)
  // =========================================================================

  brain_store_status: {
    pardes: 'S',
    name: 'brain_store_status',
    description: '[STORE] Get CYNIC store status. Shows mode (postgres/memory), connection health, and record counts.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    phi_weight: PHI_INV,
  },

  brain_store_judgments: {
    pardes: 'S',
    name: 'brain_store_judgments',
    description: '[STORE] List stored judgments. Query persistent judgment history from PostgreSQL.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 50,
          description: 'Maximum judgments to return'
        },
        verdict: {
          type: 'string',
          enum: ['ACCEPT', 'REJECT', 'TRANSFORM', 'UNKNOWN'],
          description: 'Filter by verdict'
        },
        since: {
          type: 'string',
          description: 'ISO timestamp to filter by (only judgments after this time)'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_store_harmony: {
    pardes: 'S',
    name: 'brain_store_harmony',
    description: '[STORE] Get harmony matrix from store. Shows φ-weighted dimension scores and thresholds.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    phi_weight: PHI_INV,
  },

  brain_store_burns: {
    pardes: 'S',
    name: 'brain_store_burns',
    description: '[STORE] Get burn statistics. Shows total burns and amounts by token.',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Filter by token (e.g., "asdfasdfa")'
        }
      }
    },
    phi_weight: PHI_INV,
  },

  brain_store_operators: {
    pardes: 'S',
    name: 'brain_store_operators',
    description: '[STORE] Get operator trust info. Shows trust score based on judgment accuracy.',
    inputSchema: {
      type: 'object',
      properties: {
        hash: {
          type: 'string',
          description: 'Operator hash to lookup'
        }
      },
      required: ['hash']
    },
    phi_weight: PHI_INV,
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

async function main() {
  const args = process.argv.slice(2);
  const isHttp = args.includes('--http');
  const portArg = args.find(a => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1]) : 3002;

  const mode = process.env.BRAIN_REMOTE ? 'remote' : 'local';
  const adapter = new DataAdapter({ mode });
  const handler = new MCPHandler(adapter);

  // Auto-start CYNIC pulse on startup (φ⁻¹ interval heartbeat)
  try {
    await pulse.start();
    console.error('[CYNIC] 💓 Pulse started - heartbeat every 61.8s');

    // Connect alerts to pulse for automatic monitoring
    alerts.connectToPulse(pulse);
    console.error('[CYNIC] 🚨 Alerts connected to pulse');
  } catch (e) {
    console.error('[CYNIC] ⚠️ Failed to start pulse:', e.message);
  }

  // Initialize CYNIC Store (PostgreSQL persistence)
  try {
    await initCynicStore();
    // Inject store into handlers after async init
    if (cynicStore) {
      injectCynicStore(cynicStore);
      console.error('[CYNIC-STORE] 💉 Store injected into handlers');
    }
  } catch (e) {
    console.error('[CYNIC-STORE] ⚠️ Store init failed:', e.message, '- running in memory mode');
  }

  if (isHttp) {
    startHttp(handler, port);
  } else {
    startStdio(handler);
  }
}

// Export for testing
module.exports = {
  // Core exports
  TOOLS,
  HANDLERS,
  DataAdapter,
  MCPHandler,
  // CYNIC instance (for direct access/testing)
  cynicJudge,
  residualDetector,
  // Constants from temporal.js
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  // Note: Individual handlers now available from require('./lib/handlers')
};

// Only run main if executed directly (not required)
if (require.main === module) {
  main();
}
