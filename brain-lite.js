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

// Initialize global CYNIC instance with persistent learning
const cynicJudge = new SelfJudge({ logger: console });

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

// =============================================================================
// PHI CONSTANTS - From temporal.js (single source of truth)
// =============================================================================

const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = temporal;

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
  const { type, content, context, tags = [], contributor_id, session_id, skip_cynic = false } = args;

  // Auto-detect project from content + context
  const textForDetection = `${content} ${context || ''}`;
  const detectedProject = detectProject(textForDetection);

  // Auto-detect language (φ-thresholds: 61.8% dominant, 38.2% mixed)
  const langResult = langDetect.detectLanguage(textForDetection);

  // CYNIC judgment on incoming knowledge (unless skipped)
  let cynicJudgment = null;
  if (!skip_cynic) {
    try {
      // Build item for CYNIC judgment
      const itemToJudge = {
        content,
        source: context ? true : false,
        anonymous: !contributor_id || contributor_id === 'claude-session',
        enablesHuman: true, // Knowledge enables humans by default
        contributesBurn: type === 'pattern' || type === 'decision',
      };

      // Quick judgment for performance (single pass)
      cynicJudgment = await cynicJudge.judge(itemToJudge, {
        singularityDistance: 0.4,
      });
    } catch (e) {
      // CYNIC failure is non-blocking
      cynicJudgment = { error: e.message, global: 50, verdict: { action: 'TRANSFORM' } };
    }
  }

  // Create entry with provenance, project tagging, language, and CYNIC score
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
    // CYNIC judgment metadata
    cynic_score: cynicJudgment?.global || null,
    cynic_verdict: cynicJudgment?.verdict?.action || null,
    cynic_judgment_id: cynicJudgment?._judgmentId || null,
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
    // CYNIC judgment results
    cynic: cynicJudgment ? {
      score: cynicJudgment.global,
      verdict: cynicJudgment.verdict?.action,
      confidence: cynicJudgment.confidence,
      doubt: cynicJudgment.doubt,
      judgment_id: cynicJudgment._judgmentId,
      needs_review: cynicJudgment.verdict?.action === 'TRANSFORM',
    } : null,
    message: `Learned: ${type} recorded for project ${detectedProject}`,
    _philosophy: 'Knowledge is FREE. Contributions are VALUED.',
    _quality: cynicJudgment?.global || 85,
  };
}

async function handleIngest(args, adapter) {
  const { source, entries, skip_cynic = false } = args;

  if (!entries || entries.length === 0) {
    return { success: false, error: 'No entries to ingest', _quality: 0 };
  }

  const results = [];
  const projectCounts = {};
  const langCounts = {};  // Track language distribution
  const cynicStats = { total: 0, accepted: 0, transform: 0, avgScore: 0 };
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

    // CYNIC judgment on ingested entry (unless skipped)
    let cynicJudgment = null;
    if (!skip_cynic) {
      try {
        const itemToJudge = {
          content: entry.content || JSON.stringify(entry),
          source: source ? true : false,
          anonymous: true, // Ingested data is anonymous by default
        };
        cynicJudgment = await cynicJudge.judge(itemToJudge, { singularityDistance: 0.5 });
        cynicStats.total++;
        cynicStats.avgScore += cynicJudgment.global;
        if (cynicJudgment.verdict?.action === 'ACCEPT') {
          cynicStats.accepted++;
        } else {
          cynicStats.transform++;
        }
      } catch (e) {
        // CYNIC failure is non-blocking
      }
    }

    const enriched = {
      ...entry,
      id: crypto.randomBytes(8).toString('hex'),
      source,
      project: detectedProject,  // Auto-tagged project
      lang: langResult.lang,     // Auto-detected language (en/fr/mixed)
      ingested_at: new Date().toISOString(),
      hash: crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex').slice(0, 16),
      // CYNIC metadata
      cynic_score: cynicJudgment?.global || null,
      cynic_verdict: cynicJudgment?.verdict?.action || null,
    };

    const result = await adapter.write(ingestPath, enriched, { append: true });
    results.push({
      id: enriched.id,
      project: detectedProject,
      lang: langResult.lang,
      cynic_score: cynicJudgment?.global || null,
      success: result.success,
    });
  }

  const successful = results.filter(r => r.success).length;

  // Calculate average CYNIC score
  if (cynicStats.total > 0) {
    cynicStats.avgScore = Math.round(cynicStats.avgScore / cynicStats.total);
  }

  return {
    success: successful > 0,
    source,
    total: entries.length,
    ingested: successful,
    failed: entries.length - successful,
    by_project: projectCounts,  // Show project distribution
    by_language: langCounts,    // Show language distribution
    cynic: skip_cynic ? null : {
      judged: cynicStats.total,
      accepted: cynicStats.accepted,
      needs_review: cynicStats.transform,
      avg_score: cynicStats.avgScore,
    },
    _quality: cynicStats.avgScore || (successful > 0 ? 80 : 0),
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

// =============================================================================
// CYNIC HANDLERS - Self-Judge ("φ qui se méfie de φ")
// =============================================================================

async function handleCynicJudge(args, adapter) {
  const { item, mode = 'standard', context = {} } = args;

  if (!item || typeof item !== 'object') {
    return { success: false, error: 'Item must be an object', _quality: 0 };
  }

  const startTime = Date.now();
  let result;

  // Add default context values
  const judgeContext = {
    singularityDistance: 0.4, // φ⁻¹ default distance
    ...context,
  };

  try {
    switch (mode) {
      case 'quick':
        // Single pass judgment
        result = await cynicJudge.judge(item, judgeContext);
        result._mode = 'quick';
        break;

      case 'standard':
        // Inference scaling (N=5)
        result = await cynicJudge.judgeWithScaling(item, judgeContext, {
          n: FIBONACCI_N.STANDARD,
          diversity: DIVERSITY.MEDIUM,
        });
        result._mode = 'standard';
        break;

      case 'thorough':
        // Scaling + Refinement
        result = await cynicJudge.judgeWithRefinement(item, judgeContext, {
          maxIterations: REFINEMENT.MAX_ITERATIONS,
          autoTransform: true,
          useScaling: true,
        });
        result._mode = 'thorough';
        break;

      case 'full':
        // Complete cycle: thorough scaling + refinement
        result = await cynicJudge.judgeWithRefinement(item, judgeContext, {
          maxIterations: REFINEMENT.MAX_ITERATIONS,
          autoTransform: true,
          useScaling: true,
        });
        result._mode = 'full';
        break;

      default:
        result = await cynicJudge.judge(item, judgeContext);
        result._mode = 'default';
    }

    return {
      success: true,
      judgment_id: result._judgmentId,
      global: result.global,
      verdict: result.verdict,
      confidence: result.confidence,
      doubt: result.doubt,
      scores: result.scores,
      mode: result._mode,
      scaling: result._scaling || null,
      refinement: result._refinement || null,
      transformed_item: result.item || null,
      duration_ms: Date.now() - startTime,
      philosophy: 'φ qui se méfie de φ - Rendre autonome, pas automatiser',
      _quality: result.global,
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      _quality: 0,
    };
  }
}

async function handleCynicFeedback(args, adapter) {
  const { judgment_id, outcome, feedback = {} } = args;

  if (!judgment_id) {
    return { success: false, error: 'judgment_id is required', _quality: 0 };
  }

  // Map string outcome to LEARNING.OUTCOMES
  const outcomeMap = {
    'correct': LEARNING.OUTCOMES.CORRECT,
    'incorrect': LEARNING.OUTCOMES.INCORRECT,
    'partial': LEARNING.OUTCOMES.PARTIAL,
  };

  const mappedOutcome = outcomeMap[outcome];
  if (!mappedOutcome) {
    return {
      success: false,
      error: `Invalid outcome: ${outcome}. Must be: correct, incorrect, partial`,
      _quality: 0,
    };
  }

  const result = cynicJudge.recordOutcome(judgment_id, mappedOutcome, feedback);

  if (result.error) {
    return {
      success: false,
      error: result.error,
      judgment_id,
      _quality: 0,
    };
  }

  return {
    success: true,
    judgment_id,
    outcome,
    reward: result.reward,
    learned: result.learned,
    adjustments: result.adjustments || {},
    message: result.learned
      ? `Feedback recorded and learning triggered. Reward: ${result.reward.toFixed(3)}`
      : `Feedback recorded. Reward: ${result.reward.toFixed(3)}`,
    philosophy: 'φ-weighted reinforcement learning from human feedback',
    _quality: 85,
  };
}

async function handleCynicStats(args, adapter) {
  const stats = cynicJudge.getLearningStats();

  return {
    success: true,
    ...stats,
    message: `CYNIC has made ${stats.totalJudgments} judgments with ${stats.accuracy}% accuracy`,
    philosophy: 'φ qui se méfie de φ',
    _quality: 90,
  };
}

async function handleCynicLearn(args, adapter) {
  const result = cynicJudge.learn();

  if (!result.learned) {
    return {
      success: false,
      reason: result.reason,
      message: 'Learning not triggered: ' + result.reason,
      _quality: 50,
    };
  }

  return {
    success: true,
    iteration: result.iteration,
    accuracy: result.accuracy,
    learning_rate: result.learningRate,
    adjustments: result.adjustments,
    message: `Learning iteration ${result.iteration} complete. Accuracy: ${result.accuracy}%`,
    philosophy: result.philosophy,
    _quality: 90,
  };
}

// =============================================================================
// DISCOVERY HANDLERS - Auto-Discovery with CYNIC
// =============================================================================

async function handleDiscover(args, adapter) {
  const { repos = null, judge = true, save = true } = args;

  try {
    const result = await gitScanner.fullScan({ repos, judge, save });

    return {
      success: true,
      timestamp: result.timestamp,
      repos_scanned: result.discoveries.length,
      total_patterns: result.summary?.totalPatterns || 0,
      total_dependencies: result.summary?.totalDependencies || 0,
      total_contributors: result.summary?.totalContributors || 0,
      discoveries: result.discoveries.map(d => ({
        name: d.name,
        patterns: d.patterns.length,
        dependencies: d.dependencies.length,
        contributors: d.contributors.length,
        architecture: d.architecture.map(a => a.value),
        cynic: d.cynic,
      })),
      storage_path: gitScanner.DISCOVERED_DIR,
      message: `Discovered ${result.discoveries.length} repositories with ${result.summary?.totalPatterns || 0} patterns`,
      philosophy: 'CYNIC discovers, never assumes. φ guides the scan.',
      _quality: 85,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Discovery failed: ' + error.message,
      _quality: 20,
    };
  }
}

async function handleDiscoverStatus(args, adapter) {
  try {
    const summary = gitScanner.loadDiscoveries();

    if (!summary) {
      return {
        success: false,
        message: 'No previous discoveries found. Run brain_discover first.',
        _quality: 50,
      };
    }

    return {
      success: true,
      last_scan: summary.timestamp,
      repos_discovered: summary.totalRepos,
      total_patterns: summary.totalPatterns,
      total_dependencies: summary.totalDependencies,
      total_contributors: summary.totalContributors,
      repos: summary.repos,
      storage_path: gitScanner.DISCOVERED_DIR,
      message: `Last scan: ${summary.timestamp}. ${summary.totalRepos} repos, ${summary.totalPatterns} patterns.`,
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to load discovery status: ' + error.message,
      _quality: 20,
    };
  }
}

// =============================================================================
// PRIVACY HANDLERS
// =============================================================================

async function handlePrivacySanitize(args, adapter) {
  const { data, strict = false } = args;

  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: 'Invalid data: must be an object',
      _quality: 20,
    };
  }

  const result = privacy.sanitize(data, { strict });

  if (result.rejected) {
    return {
      success: false,
      rejected: true,
      reason: result.reason,
      score: result.score,
      issues: result.issues,
      message: `Data rejected: privacy score ${result.score} is below threshold`,
      _quality: 40,
    };
  }

  return {
    success: true,
    sanitized: result.sanitized,
    score: result.score,
    improved: result.improved,
    improvement: result.improvement,
    issues_remaining: result.issues.length,
    message: result.improved
      ? `Privacy score improved by ${result.improvement} points (now ${result.score})`
      : `Privacy score: ${result.score}`,
    philosophy: 'What you don\'t store, you can\'t leak.',
    _quality: result.score >= 80 ? 90 : 70,
  };
}

async function handlePrivacyCheck(args, adapter) {
  const { data, min_score = 70 } = args;

  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: 'Invalid data: must be an object',
      _quality: 20,
    };
  }

  const result = privacy.isSafe(data, min_score);

  return {
    success: true,
    safe: result.safe,
    score: result.score,
    verdict: result.verdict,
    issues: result.issues,
    threshold: min_score,
    message: result.safe
      ? `Data is safe to store (score: ${result.score})`
      : `Data contains PII that should be hashed (score: ${result.score})`,
    _quality: result.safe ? 85 : 60,
  };
}

async function handlePrivacyDetectPII(args, adapter) {
  const { text } = args;

  if (!text || typeof text !== 'string') {
    return {
      success: false,
      error: 'Invalid text: must be a string',
      _quality: 20,
    };
  }

  const detected = privacy.detectPII(text);

  return {
    success: true,
    pii_found: detected.length > 0,
    count: detected.length,
    types: [...new Set(detected.map(d => d.type))],
    details: detected.map(d => ({
      type: d.type,
      level: d.level,
      confidence: d.confidence,
      position: d.index
    })),
    message: detected.length > 0
      ? `Found ${detected.length} PII patterns: ${[...new Set(detected.map(d => d.type))].join(', ')}`
      : 'No PII detected',
    _quality: 80,
  };
}

async function handlePrivacyHash(args, adapter) {
  const { value, mode = 'standard', purpose = 'default' } = args;

  if (value === undefined || value === null) {
    return {
      success: false,
      error: 'Value is required',
      _quality: 20,
    };
  }

  let hash;
  switch (mode) {
    case 'lookup':
      hash = privacy.hashForLookup(value, purpose);
      break;
    case 'fast':
      hash = privacy.fastHash(value);
      break;
    case 'standard':
    default:
      hash = privacy.hash(value, { purpose });
  }

  return {
    success: true,
    hash,
    mode,
    purpose,
    hash_type: privacy.hasher.getHashType(hash),
    message: `Value hashed using ${mode} mode`,
    _quality: 85,
  };
}

async function handleEphemeralStore(args, adapter) {
  const {
    key,
    value,
    ttl = 'default',
    session_id = null,
    sanitize: doSanitize = true
  } = args;

  if (!key) {
    return {
      success: false,
      error: 'Key is required',
      _quality: 20,
    };
  }

  // Map TTL string to actual value
  const ttlMap = {
    short: privacy.TTL.SHORT,
    default: privacy.TTL.DEFAULT,
    long: privacy.TTL.LONG
  };
  const actualTtl = ttlMap[ttl] || privacy.TTL.DEFAULT;

  // Sanitize if needed
  let dataToStore = value;
  let sanitizeResult = null;
  if (doSanitize && typeof value === 'object' && value !== null) {
    sanitizeResult = privacy.sanitize(value);
    dataToStore = sanitizeResult.sanitized || value;
  }

  const result = privacy.ephemeral.set(key, dataToStore, {
    ttl: actualTtl,
    sessionId: session_id
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      _quality: 30,
    };
  }

  return {
    success: true,
    key,
    expires: result.expires,
    ttl_seconds: Math.round(result.ttl / 1000),
    sanitized: doSanitize && sanitizeResult?.improved,
    message: `Data stored in ephemeral storage. Expires in ${Math.round(result.ttl / 1000)}s`,
    philosophy: 'Some things should not outlive the moment.',
    _quality: 85,
  };
}

async function handleEphemeralGet(args, adapter) {
  const { key, session_id = null, delete_after = false } = args;

  if (!key) {
    return {
      success: false,
      error: 'Key is required',
      _quality: 20,
    };
  }

  const options = { sessionId: session_id };
  const value = delete_after
    ? privacy.ephemeral.getOnce(key, options)
    : privacy.ephemeral.get(key, options);

  if (value === undefined) {
    return {
      success: false,
      found: false,
      message: 'Key not found or expired',
      _quality: 50,
    };
  }

  const ttl = privacy.ephemeral.store.ttl(key, options);

  return {
    success: true,
    found: true,
    value,
    ttl_remaining: ttl > 0 ? Math.round(ttl / 1000) : 0,
    deleted: delete_after,
    message: delete_after
      ? 'Data retrieved and deleted'
      : `Data retrieved. TTL: ${ttl > 0 ? Math.round(ttl / 1000) + 's' : 'expired'}`,
    _quality: 85,
  };
}

// =============================================================================
// INTEGRATION HANDLERS - HolDex, GASdf webhooks
// =============================================================================

async function handleWebhookHoldex(args, adapter) {
  // Add timestamp if not provided
  if (!args.timestamp) {
    args.timestamp = new Date().toISOString();
  }

  try {
    const result = await integration.holdex.handleWebhook(args, {
      cynicInstance: cynicJudge,
    });

    return {
      ...result,
      _quality: result.success ? 85 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'HolDex webhook processing failed: ' + error.message,
      _quality: 20,
    };
  }
}

async function handleWebhookGasdf(args, adapter) {
  // Add timestamp if not provided
  if (!args.timestamp) {
    args.timestamp = new Date().toISOString();
  }

  try {
    const result = await integration.gasdf.handleWebhook(args, {
      cynicInstance: cynicJudge,
    });

    return {
      ...result,
      _quality: result.success ? 85 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'GASdf webhook processing failed: ' + error.message,
      _quality: 20,
    };
  }
}

async function handleIntegrationStatus(args, adapter) {
  const { source = 'all' } = args;

  try {
    if (source === 'holdex') {
      return {
        success: true,
        source: 'holdex',
        status: integration.holdex.getStatus(),
        _quality: 80,
      };
    }

    if (source === 'gasdf') {
      return {
        success: true,
        source: 'gasdf',
        status: integration.gasdf.getStatus(),
        _quality: 80,
      };
    }

    // All sources
    const status = integration.getStatus();
    return {
      success: true,
      sources: ['holdex', 'gasdf'],
      holdex: status.holdex,
      gasdf: status.gasdf,
      unified: status.unified,
      message: `Integration health: ${status.unified.health.status} (${status.unified.health.health_score}%)`,
      philosophy: 'Everything connects through φ.',
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleIntegrationEvents(args, adapter) {
  const { sources = ['holdex', 'gasdf'], limit = 50, since = null, type = null } = args;

  try {
    const events = integration.loadAllEvents({ limit, since, sources });

    // Filter by type if specified
    const filtered = type
      ? events.filter(e => e.type === type)
      : events;

    return {
      success: true,
      count: filtered.length,
      sources,
      events: filtered,
      message: `Loaded ${filtered.length} events from ${sources.join(', ')}`,
      _quality: 75,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleIntegrationPatterns(args, adapter) {
  const { limit = 1000 } = args;

  try {
    const patterns = integration.analyzeAllPatterns({ limit });

    return {
      success: true,
      holdex: patterns.holdex,
      gasdf: patterns.gasdf,
      correlations: patterns.correlations,
      message: 'Pattern analysis complete',
      philosophy: 'Patterns emerge from chaos. φ reveals them.',
      _quality: 85,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleBurnStats(args, adapter) {
  const { days = 7 } = args;

  try {
    const stats = integration.getBurnStats({ days });

    return {
      success: true,
      period_days: days,
      ...stats,
      message: `Burned ${stats.total_burned} $asdfasdfa in ${days} days (${stats.burn_count} burns)`,
      philosophy: "Don't extract, burn.",
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

// =============================================================================
// CLAUDE-MEM SYNC HANDLERS
// =============================================================================

async function handleSyncClaudeMem(args, adapter) {
  const { force = false } = args;

  try {
    const result = await integration.syncClaudeMem({
      force,
      cynicInstance: cynicJudge,
    });

    if (result.skipped) {
      return {
        success: true,
        skipped: true,
        reason: result.reason,
        next_sync_in: result.next_sync_in,
        message: result.message,
        _quality: 60,
      };
    }

    return {
      success: result.success,
      synced: result.synced || 0,
      observations: result.observations || 0,
      summaries: result.summaries || 0,
      items: result.items,
      db_stats: result.stats,
      message: result.message,
      philosophy: 'Memory is not storage. Memory is connection.',
      _quality: result.success ? 85 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Claude-mem sync failed: ' + error.message,
      _quality: 20,
    };
  }
}

async function handleSyncStatus(args, adapter) {
  try {
    const status = integration.claudeMem.getStatus();

    return {
      success: true,
      connected: status.connected,
      db_path: status.db_path,
      db_stats: status.db_stats,
      sync_state: status.sync_state,
      sync_stats: status.sync_stats,
      config: status.config,
      message: status.connected
        ? `Connected. ${status.sync_state?.total_synced || 0} items synced.`
        : 'Not connected to claude-mem database.',
      _quality: status.connected ? 80 : 50,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleSyncEvents(args, adapter) {
  const { limit = 50, type = null, project = null, since = null } = args;

  try {
    const events = integration.claudeMem.loadSyncedEvents({ limit, type, project, since });

    return {
      success: true,
      count: events.length,
      events,
      message: `Loaded ${events.length} synced events from claude-mem`,
      _quality: events.length > 0 ? 80 : 60,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleSyncSearch(args, adapter) {
  const { query, limit = 20 } = args;

  if (!query) {
    return {
      success: false,
      error: 'Query is required',
      _quality: 20,
    };
  }

  try {
    const results = integration.claudeMem.searchSyncedEvents(query, { limit });

    return {
      success: true,
      query,
      count: results.length,
      results,
      message: `Found ${results.length} matching events for "${query}"`,
      _quality: results.length > 0 ? 80 : 60,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

// =============================================================================
// CONSCIOUSNESS HANDLERS - Self-Awareness
// =============================================================================

async function handlePulseStart(args, adapter) {
  try {
    // Register self-monitor checks with pulse
    selfMonitor.registerWithPulse(pulse);

    // Connect alerting to pulse (will check rules on each heartbeat)
    alerts.connectToPulse(pulse);

    const result = await pulse.start();

    // Start recording metrics
    if (result.success) {
      pulse.on('pulse', (data) => {
        metrics.recordPulse(data.overallHealth, data.pulseMs || 0, data.anomalies?.length || 0);
      });
    }

    return {
      success: result.success,
      message: result.message,
      interval: result.interval,
      intervalHuman: result.intervalHuman,
      alertRulesActive: alerts.getAllRules().length,
      philosophy: "φ qui se voit vivre et réagit.",
      _quality: result.success ? 90 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handlePulseStop(args, adapter) {
  try {
    const result = pulse.stop();

    return {
      success: result.success,
      message: result.message,
      totalPulses: result.totalPulses,
      uptimeMs: result.uptimeMs,
      _quality: result.success ? 80 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handlePulseStatus(args, adapter) {
  try {
    const status = pulse.getStatus();

    return {
      success: true,
      ...status,
      philosophy: status.alive ? "CYNIC is alive. φ qui se voit vivre." : "CYNIC pulse not started.",
      _quality: status.alive ? 85 : 60,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleDiagnostic(args, adapter) {
  const { quick = false } = args;

  try {
    const report = quick
      ? await selfMonitor.runQuickCheck()
      : await selfMonitor.runFullDiagnostic();

    return {
      success: true,
      ...report,
      philosophy: "φ qui se diagnostique.",
      _quality: report.healthy ? 90 : report.overallScore >= 38 ? 60 : 30,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleMetrics(args, adapter) {
  const { full = false } = args;

  try {
    const data = full ? metrics.getAll() : metrics.getSummary();

    return {
      success: true,
      ...data,
      philosophy: "φ qui se mesure.",
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAnomalies(args, adapter) {
  const { limit = 20 } = args;

  try {
    const anomalies = pulse.getAnomalies(limit);
    const status = pulse.getStatus();

    return {
      success: true,
      pulseAlive: status.alive,
      totalAnomalies: status.anomalyCount,
      anomalies,
      message: anomalies.length === 0
        ? "No anomalies detected. CYNIC is healthy."
        : `${anomalies.length} anomalies in recent history`,
      philosophy: "φ qui détecte ses anomalies.",
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleHealthHistory(args, adapter) {
  const { limit = 50 } = args;

  try {
    const history = pulse.getHealthHistory(limit);
    const status = pulse.getStatus();

    return {
      success: true,
      pulseAlive: status.alive,
      currentHealth: status.currentHealth,
      healthTrend: status.healthTrend,
      historySize: history.length,
      history,
      philosophy: "φ qui trace son évolution.",
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

// =============================================================================
// ALERTING HANDLERS
// =============================================================================

async function handleAlertStatus(args, adapter) {
  try {
    const status = alerts.getStatus();
    const stats = alerts.getStats();
    const active = alerts.getActive();

    return {
      success: true,
      ...status,
      statistics: stats,
      activeCount: active.length,
      criticalCount: active.filter(a => a.severity === 'critical').length,
      warningCount: active.filter(a => a.severity === 'warning').length,
      philosophy: "φ qui surveille.",
      _quality: 85,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertActive(args, adapter) {
  const { severity } = args;

  try {
    let active = alerts.getActive();

    if (severity) {
      active = active.filter(a => a.severity === severity);
    }

    return {
      success: true,
      count: active.length,
      alerts: active.map(a => ({
        id: a.id,
        ruleId: a.ruleId,
        severity: a.severity,
        message: a.message,
        firedAt: a.firedAt,
        durationMs: Date.now() - new Date(a.firedAt).getTime(),
        acknowledged: a.acknowledged,
        escalated: a.escalated,
        fireCount: a.fireCount,
      })),
      message: active.length === 0
        ? "No active alerts. CYNIC is calm."
        : `${active.length} active alert(s)`,
      philosophy: "φ qui alerte.",
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertHistory(args, adapter) {
  const { limit = 50 } = args;

  try {
    const history = alerts.getHistory(limit);
    const stats = alerts.getStats();

    return {
      success: true,
      count: history.length,
      totalFired: stats.totalFired,
      totalResolved: stats.totalResolved,
      totalAcknowledged: stats.totalAcknowledged,
      alerts: history,
      philosophy: "φ qui se souvient.",
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertRules(args, adapter) {
  const { category } = args;

  try {
    const allRules = alerts.getAllRules();
    let rules = allRules;

    if (category) {
      const alertRulesLib = require('./lib/cynic/alert-rules');
      const categoryRules = alertRulesLib.getRulesByCategory(category);
      const categoryIds = new Set(categoryRules.map(r => r.id));
      rules = allRules.filter(r => categoryIds.has(r.id));
    }

    return {
      success: true,
      count: rules.length,
      totalRules: allRules.length,
      rules: rules.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        severity: r.severity,
        enabled: r.enabled,
        silencedUntil: r.silencedUntil,
        throttleMs: r.throttleMs,
        channels: r.channels,
      })),
      thresholds: require('./lib/cynic/alert-rules').THRESHOLDS,
      philosophy: "φ qui définit ses règles.",
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertCheck(args, adapter) {
  try {
    // Run full diagnostic first to get current state
    const diagnostic = await selfMonitor.runFullDiagnostic();

    // Check all rules against current state
    const results = await alerts.checkAll(diagnostic);

    const firedAlerts = results.filter(r => r.fired);
    const active = alerts.getActive();

    return {
      success: true,
      rulesChecked: results.length,
      alertsFired: firedAlerts.length,
      activeAlerts: active.length,
      fired: firedAlerts.map(r => ({
        ruleId: r.ruleId,
        alertId: r.alertId,
        severity: r.severity,
        message: r.message,
      })),
      diagnosticScore: diagnostic.overallScore,
      philosophy: "φ qui vérifie.",
      _quality: firedAlerts.length > 0 ? 70 : 90,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertAcknowledge(args, adapter) {
  const { alertId, acknowledgedBy = 'operator' } = args;

  try {
    const result = alerts.acknowledge(alertId, acknowledgedBy);

    return {
      success: result.success,
      message: result.message,
      alert: result.alert ? {
        id: result.alert.id,
        ruleId: result.alert.ruleId,
        severity: result.alert.severity,
        acknowledged: result.alert.acknowledged,
        acknowledgedAt: result.alert.acknowledgedAt,
        acknowledgedBy: result.alert.acknowledgedBy,
      } : null,
      philosophy: "φ qui prend acte.",
      _quality: result.success ? 80 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertResolve(args, adapter) {
  const { alertId, resolution = 'Manually resolved' } = args;

  try {
    const result = alerts.resolve(alertId, resolution);

    return {
      success: result.success,
      message: result.message,
      alert: result.alert ? {
        id: result.alert.id,
        ruleId: result.alert.ruleId,
        severity: result.alert.severity,
        resolvedAt: result.alert.resolvedAt,
        resolution: result.alert.resolution,
        totalDurationMs: result.alert.resolvedAt
          ? new Date(result.alert.resolvedAt).getTime() - new Date(result.alert.firedAt).getTime()
          : null,
      } : null,
      philosophy: "φ qui résout.",
      _quality: result.success ? 85 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertSilence(args, adapter) {
  const { ruleId, durationMs = 3600000 } = args;

  try {
    const result = alerts.silenceRule(ruleId, durationMs);
    const rule = alerts.getRule(ruleId);

    return {
      success: result.success,
      message: result.message,
      rule: rule ? {
        id: rule.id,
        name: rule.name,
        silencedUntil: rule.silencedUntil,
        silenceDurationMs: durationMs,
        silenceDurationHuman: `${Math.round(durationMs / 60000)} minutes`,
      } : null,
      philosophy: "φ qui fait silence.",
      _quality: result.success ? 75 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertConnectPulse(args, adapter) {
  try {
    // Connect alerts to pulse
    alerts.connectToPulse(pulse);

    // Check if pulse is running
    const pulseStatus = pulse.getStatus();

    return {
      success: true,
      connected: true,
      pulseAlive: pulseStatus.alive,
      message: pulseStatus.alive
        ? "Alerts connected to pulse. Will check on each heartbeat."
        : "Alerts connected to pulse. Start pulse with brain_pulse_start to activate.",
      rulesCount: alerts.getAllRules().length,
      philosophy: "φ qui écoute son cœur.",
      _quality: 90,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
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
  // CYNIC Layer
  brain_cynic_judge: handleCynicJudge,
  brain_cynic_feedback: handleCynicFeedback,
  brain_cynic_stats: handleCynicStats,
  brain_cynic_learn: handleCynicLearn,
  // Discovery Layer
  brain_discover: handleDiscover,
  brain_discover_status: handleDiscoverStatus,
  // Privacy Layer
  brain_privacy_sanitize: handlePrivacySanitize,
  brain_privacy_check: handlePrivacyCheck,
  brain_privacy_detect_pii: handlePrivacyDetectPII,
  brain_privacy_hash: handlePrivacyHash,
  brain_ephemeral_store: handleEphemeralStore,
  brain_ephemeral_get: handleEphemeralGet,
  // Integration Layer
  brain_webhook_holdex: handleWebhookHoldex,
  brain_webhook_gasdf: handleWebhookGasdf,
  brain_integration_status: handleIntegrationStatus,
  brain_integration_events: handleIntegrationEvents,
  brain_integration_patterns: handleIntegrationPatterns,
  brain_burn_stats: handleBurnStats,
  // Claude-Mem Sync Layer
  brain_sync_claude_mem: handleSyncClaudeMem,
  brain_sync_status: handleSyncStatus,
  brain_sync_events: handleSyncEvents,
  brain_sync_search: handleSyncSearch,
  // Consciousness Layer
  brain_pulse_start: handlePulseStart,
  brain_pulse_stop: handlePulseStop,
  brain_pulse_status: handlePulseStatus,
  brain_diagnostic: handleDiagnostic,
  brain_metrics: handleMetrics,
  brain_anomalies: handleAnomalies,
  brain_health_history: handleHealthHistory,
  // Alerting Layer
  brain_alert_status: handleAlertStatus,
  brain_alert_active: handleAlertActive,
  brain_alert_history: handleAlertHistory,
  brain_alert_rules: handleAlertRules,
  brain_alert_check: handleAlertCheck,
  brain_alert_acknowledge: handleAlertAcknowledge,
  brain_alert_resolve: handleAlertResolve,
  brain_alert_silence: handleAlertSilence,
  brain_alert_connect_pulse: handleAlertConnectPulse,
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
  // CYNIC handlers
  handleCynicJudge,
  handleCynicFeedback,
  handleCynicStats,
  handleCynicLearn,
  // CYNIC instance (for direct access/testing)
  cynicJudge,
  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  // CYNIC constants
  LEARNING,
  FIBONACCI_N,
  DIVERSITY,
  REFINEMENT,
};

// Only run main if executed directly (not required)
if (require.main === module) {
  main();
}
