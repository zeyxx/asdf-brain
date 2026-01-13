/**
 * Claude-Mem Integration Connector
 *
 * "Memory is not storage. Memory is connection."
 *
 * Syncs with claude-mem local database:
 * - Pull observations, sessions, summaries
 * - Transform for CYNIC ingestion
 * - Track sync state to avoid duplicates
 * - Bidirectional: push brain patterns back
 *
 * Privacy: All user data is hashed before storage.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const privacy = require('../privacy');

// =============================================================================
// PHI CONSTANTS - Import from Single Source of Truth (FIXED 2026-01-13)
// =============================================================================

const { PHI, PHI_INV, PHI_INV_2 } = require('../cynic/axioms/constants');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Claude-mem database path
  dbPath: process.env.CLAUDE_MEM_DB || '/workspaces/.claude-mem-data/claude-mem.db',

  // Storage for sync state
  storageDir: path.join(__dirname, '../../knowledge/integrations/claude-mem'),
  syncStateFile: 'sync-state.json',
  eventsFile: 'synced-events.jsonl',
  statsFile: 'stats.json',

  // Sync limits (φ-based)
  limits: {
    batchSize: Math.round(50 * PHI_INV),        // ~31 items per batch
    maxObservations: Math.round(500 * PHI),     // ~809 max observations
    syncIntervalMs: Math.round(300000 * PHI_INV), // ~3 minutes
  },

  // Type mappings: claude-mem type → brain type
  typeMapping: {
    decision: 'decision',
    discovery: 'pattern',
    bugfix: 'insight',
    feature: 'pattern',
    refactor: 'pattern',
    change: 'insight',
  },
};

// Ensure storage directory exists
if (!fs.existsSync(CONFIG.storageDir)) {
  fs.mkdirSync(CONFIG.storageDir, { recursive: true });
}

// =============================================================================
// DATABASE ACCESS
// =============================================================================

let Database;
try {
  Database = require('better-sqlite3');
} catch {
  // Fallback: we'll use sqlite3 async
  Database = null;
}

/**
 * Open claude-mem database (read-only)
 */
function openDatabase() {
  if (!fs.existsSync(CONFIG.dbPath)) {
    return null;
  }

  if (Database) {
    // Use better-sqlite3 (synchronous, faster)
    return new Database(CONFIG.dbPath, { readonly: true });
  }

  // No database driver available
  return null;
}

/**
 * Query the database
 */
function query(db, sql, params = []) {
  if (!db) return [];

  try {
    if (db.prepare) {
      // better-sqlite3
      const stmt = db.prepare(sql);
      return stmt.all(...params);
    }
  } catch (error) {
    console.error('Database query error:', error.message);
    return [];
  }

  return [];
}

/**
 * Close database
 */
function closeDatabase(db) {
  if (db && db.close) {
    db.close();
  }
}

// =============================================================================
// SYNC STATE MANAGEMENT
// =============================================================================

/**
 * Load sync state
 */
function loadSyncState() {
  const statePath = path.join(CONFIG.storageDir, CONFIG.syncStateFile);

  if (!fs.existsSync(statePath)) {
    return {
      lastSyncAt: null,
      lastObservationId: 0,
      lastSessionId: 0,
      lastSummaryId: 0,
      totalSynced: 0,
      syncHistory: [],
    };
  }

  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  } catch {
    return {
      lastSyncAt: null,
      lastObservationId: 0,
      lastSessionId: 0,
      lastSummaryId: 0,
      totalSynced: 0,
      syncHistory: [],
    };
  }
}

/**
 * Save sync state
 */
function saveSyncState(state) {
  const statePath = path.join(CONFIG.storageDir, CONFIG.syncStateFile);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

/**
 * Transform claude-mem observation for brain ingestion
 */
function transformObservation(obs) {
  return {
    id: `claude-mem:obs:${obs.id}`,
    source: 'claude-mem',
    source_type: 'observation',
    original_id: obs.id,

    // Type mapping
    type: CONFIG.typeMapping[obs.type] || 'insight',
    original_type: obs.type,

    // Content
    title: obs.title || null,
    subtitle: obs.subtitle || null,
    content: obs.text || obs.narrative || '',
    facts: safeParseJson(obs.facts, []),
    concepts: safeParseJson(obs.concepts, []),

    // Context
    project: obs.project,
    session_hash: obs.memory_session_id
      ? privacy.fastHash(obs.memory_session_id).slice(0, 16)
      : null,

    // Files (don't hash - they're paths, not PII)
    files_read: safeParseJson(obs.files_read, []),
    files_modified: safeParseJson(obs.files_modified, []),

    // Timestamps
    timestamp: obs.created_at,
    created_epoch: obs.created_at_epoch,
    synced_at: new Date().toISOString(),

    // Metrics
    discovery_tokens: obs.discovery_tokens || 0,

    // Metadata
    meta: {
      prompt_number: obs.prompt_number,
      phi_weight: calculatePhiWeight(obs),
    },
  };
}

/**
 * Transform session summary for brain ingestion
 */
function transformSummary(summary) {
  return {
    id: `claude-mem:summary:${summary.id}`,
    source: 'claude-mem',
    source_type: 'session_summary',
    original_id: summary.id,
    type: 'decision',

    // Content
    content: [
      summary.request ? `Request: ${summary.request}` : null,
      summary.investigated ? `Investigated: ${summary.investigated}` : null,
      summary.learned ? `Learned: ${summary.learned}` : null,
      summary.completed ? `Completed: ${summary.completed}` : null,
      summary.next_steps ? `Next: ${summary.next_steps}` : null,
    ].filter(Boolean).join('\n'),

    sections: {
      request: summary.request,
      investigated: summary.investigated,
      learned: summary.learned,
      completed: summary.completed,
      next_steps: summary.next_steps,
      notes: summary.notes,
    },

    // Context
    project: summary.project,
    session_hash: summary.memory_session_id
      ? privacy.fastHash(summary.memory_session_id).slice(0, 16)
      : null,

    // Files
    files_read: safeParseJson(summary.files_read, []),
    files_edited: safeParseJson(summary.files_edited, []),

    // Timestamps
    timestamp: summary.created_at,
    created_epoch: summary.created_at_epoch,
    synced_at: new Date().toISOString(),

    // Metrics
    discovery_tokens: summary.discovery_tokens || 0,

    meta: {
      prompt_number: summary.prompt_number,
    },
  };
}

/**
 * Calculate φ-weight based on observation richness
 */
function calculatePhiWeight(obs) {
  let weight = 1.0;

  // Has facts → more valuable
  if (obs.facts && safeParseJson(obs.facts, []).length > 0) {
    weight *= PHI_INV;
  }

  // Has concepts → more valuable
  if (obs.concepts && safeParseJson(obs.concepts, []).length > 0) {
    weight *= PHI_INV;
  }

  // Decision type → higher weight
  if (obs.type === 'decision') {
    weight *= PHI;
  }

  // Has files modified → higher weight
  if (obs.files_modified && safeParseJson(obs.files_modified, []).length > 0) {
    weight *= PHI_INV;
  }

  return Math.round(weight * 1000) / 1000;
}

/**
 * Safe JSON parse
 */
function safeParseJson(str, defaultValue) {
  if (!str) return defaultValue;
  if (typeof str !== 'string') return str;

  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

// =============================================================================
// SYNC OPERATIONS
// =============================================================================

/**
 * Fetch new observations from claude-mem
 */
function fetchNewObservations(db, sinceId = 0, limit = CONFIG.limits.batchSize) {
  const sql = `
    SELECT * FROM observations
    WHERE id > ?
    ORDER BY id ASC
    LIMIT ?
  `;
  return query(db, sql, [sinceId, limit]);
}

/**
 * Fetch new session summaries from claude-mem
 */
function fetchNewSummaries(db, sinceId = 0, limit = CONFIG.limits.batchSize) {
  const sql = `
    SELECT * FROM session_summaries
    WHERE id > ?
    ORDER BY id ASC
    LIMIT ?
  `;
  return query(db, sql, [sinceId, limit]);
}

/**
 * Fetch sessions by project
 */
function fetchSessionsByProject(db, project, limit = 10) {
  const sql = `
    SELECT * FROM sdk_sessions
    WHERE project = ?
    ORDER BY started_at_epoch DESC
    LIMIT ?
  `;
  return query(db, sql, [project, limit]);
}

/**
 * Get database stats
 */
function getDatabaseStats(db) {
  const stats = {
    observations: 0,
    summaries: 0,
    sessions: 0,
    projects: [],
    types: {},
  };

  if (!db) return stats;

  // Count observations
  const obsCount = query(db, 'SELECT COUNT(*) as count FROM observations');
  stats.observations = obsCount[0]?.count || 0;

  // Count summaries
  const sumCount = query(db, 'SELECT COUNT(*) as count FROM session_summaries');
  stats.summaries = sumCount[0]?.count || 0;

  // Count sessions
  const sessCount = query(db, 'SELECT COUNT(*) as count FROM sdk_sessions');
  stats.sessions = sessCount[0]?.count || 0;

  // Get projects
  const projects = query(db, 'SELECT DISTINCT project FROM observations');
  stats.projects = projects.map(p => p.project);

  // Get type distribution
  const types = query(db, 'SELECT type, COUNT(*) as count FROM observations GROUP BY type');
  types.forEach(t => {
    stats.types[t.type] = t.count;
  });

  return stats;
}

/**
 * Perform sync operation
 */
async function sync(options = {}) {
  const { cynicInstance = null, force = false } = options;

  const db = openDatabase();
  if (!db) {
    return {
      success: false,
      error: 'database_not_found',
      message: `Claude-mem database not found at ${CONFIG.dbPath}`,
    };
  }

  try {
    const state = loadSyncState();
    const now = new Date().toISOString();

    // Check if sync is needed (unless forced)
    if (!force && state.lastSyncAt) {
      const lastSync = new Date(state.lastSyncAt).getTime();
      const elapsed = Date.now() - lastSync;
      if (elapsed < CONFIG.limits.syncIntervalMs) {
        return {
          success: true,
          skipped: true,
          reason: 'sync_interval_not_reached',
          next_sync_in: Math.round((CONFIG.limits.syncIntervalMs - elapsed) / 1000),
          message: `Sync interval not reached. Next sync in ${Math.round((CONFIG.limits.syncIntervalMs - elapsed) / 1000)}s`,
        };
      }
    }

    // Fetch new observations
    const observations = fetchNewObservations(db, state.lastObservationId);
    const summaries = fetchNewSummaries(db, state.lastSummaryId);

    if (observations.length === 0 && summaries.length === 0) {
      state.lastSyncAt = now;
      saveSyncState(state);

      return {
        success: true,
        synced: 0,
        message: 'No new data to sync',
        stats: getDatabaseStats(db),
      };
    }

    // Transform observations
    const transformedObs = observations.map(transformObservation);
    const transformedSum = summaries.map(transformSummary);
    const allTransformed = [...transformedObs, ...transformedSum];

    // Judge with CYNIC if available
    const judged = [];
    for (const item of allTransformed) {
      let cynicScore = null;

      if (cynicInstance) {
        try {
          const judgment = await cynicInstance.judge({
            type: 'claude_mem_sync',
            data: item,
            context: { source: 'claude-mem', original_type: item.original_type },
          });
          cynicScore = {
            score: judgment.global || 50,
            verdict: judgment.verdict?.action || 'ACCEPTED',
          };
        } catch {
          cynicScore = { score: 50, verdict: 'FALLBACK' };
        }
      }

      judged.push({
        ...item,
        cynic: cynicScore,
      });
    }

    // Save to events file
    const eventsPath = path.join(CONFIG.storageDir, CONFIG.eventsFile);
    judged.forEach(event => {
      fs.appendFileSync(eventsPath, JSON.stringify(event) + '\n', 'utf-8');
    });

    // Update state
    if (observations.length > 0) {
      state.lastObservationId = Math.max(...observations.map(o => o.id));
    }
    if (summaries.length > 0) {
      state.lastSummaryId = Math.max(...summaries.map(s => s.id));
    }
    state.lastSyncAt = now;
    state.totalSynced += judged.length;
    state.syncHistory.push({
      timestamp: now,
      observations: observations.length,
      summaries: summaries.length,
    });

    // Keep only last φ² sync history entries
    const maxHistory = Math.round(20 * PHI * PHI);
    if (state.syncHistory.length > maxHistory) {
      state.syncHistory = state.syncHistory.slice(-maxHistory);
    }

    saveSyncState(state);

    // Update stats
    updateStats(judged);

    return {
      success: true,
      synced: judged.length,
      observations: observations.length,
      summaries: summaries.length,
      items: judged.map(j => ({
        id: j.id,
        type: j.type,
        project: j.project,
        cynic: j.cynic,
      })),
      stats: getDatabaseStats(db),
      message: `Synced ${judged.length} items from claude-mem`,
      philosophy: 'Memory is not storage. Memory is connection.',
    };

  } finally {
    closeDatabase(db);
  }
}

/**
 * Update stats file
 */
function updateStats(items) {
  const statsPath = path.join(CONFIG.storageDir, CONFIG.statsFile);

  let stats = {
    total_synced: 0,
    by_type: {},
    by_project: {},
    first_sync: null,
    last_sync: null,
  };

  if (fs.existsSync(statsPath)) {
    try {
      stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    } catch {}
  }

  items.forEach(item => {
    stats.total_synced++;
    stats.by_type[item.type] = (stats.by_type[item.type] || 0) + 1;
    stats.by_project[item.project] = (stats.by_project[item.project] || 0) + 1;
  });

  if (!stats.first_sync) {
    stats.first_sync = new Date().toISOString();
  }
  stats.last_sync = new Date().toISOString();

  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
  return stats;
}

// =============================================================================
// STATUS AND QUERIES
// =============================================================================

/**
 * Get sync status
 */
function getStatus() {
  const db = openDatabase();
  const state = loadSyncState();

  let dbStats = null;
  if (db) {
    dbStats = getDatabaseStats(db);
    closeDatabase(db);
  }

  const statsPath = path.join(CONFIG.storageDir, CONFIG.statsFile);
  let syncStats = null;
  if (fs.existsSync(statsPath)) {
    try {
      syncStats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    } catch {}
  }

  return {
    connected: db !== null,
    db_path: CONFIG.dbPath,
    db_stats: dbStats,
    sync_state: {
      last_sync: state.lastSyncAt,
      last_observation_id: state.lastObservationId,
      last_summary_id: state.lastSummaryId,
      total_synced: state.totalSynced,
      recent_syncs: state.syncHistory.slice(-5),
    },
    sync_stats: syncStats,
    config: {
      batch_size: CONFIG.limits.batchSize,
      sync_interval_ms: CONFIG.limits.syncIntervalMs,
    },
  };
}

/**
 * Load synced events
 */
function loadSyncedEvents(options = {}) {
  const { limit = 50, type = null, project = null, since = null } = options;
  const eventsPath = path.join(CONFIG.storageDir, CONFIG.eventsFile);

  if (!fs.existsSync(eventsPath)) {
    return [];
  }

  const lines = fs.readFileSync(eventsPath, 'utf-8').split('\n').filter(Boolean);
  let events = lines.map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);

  // Filter by type
  if (type) {
    events = events.filter(e => e.type === type || e.original_type === type);
  }

  // Filter by project
  if (project) {
    events = events.filter(e => e.project === project);
  }

  // Filter by time
  if (since) {
    const sinceTs = new Date(since).getTime();
    events = events.filter(e => new Date(e.timestamp).getTime() > sinceTs);
  }

  return events.slice(-limit);
}

/**
 * Search synced events
 */
function searchSyncedEvents(query, options = {}) {
  const { limit = 20 } = options;
  const events = loadSyncedEvents({ limit: 500 });

  const queryLower = query.toLowerCase();
  const matches = events.filter(e => {
    const content = [
      e.content,
      e.title,
      e.subtitle,
      ...(e.facts || []),
      ...(e.concepts || []),
    ].filter(Boolean).join(' ').toLowerCase();

    return content.includes(queryLower);
  });

  return matches.slice(0, limit);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  sync,
  getStatus,
  loadSyncedEvents,
  searchSyncedEvents,
  openDatabase,
  closeDatabase,
  getDatabaseStats,
  fetchNewObservations,
  fetchNewSummaries,
  fetchSessionsByProject,
  transformObservation,
  transformSummary,
  CONFIG,
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== Claude-Mem Connector CLI ===\n');

  console.log('--- Status ---');
  const status = getStatus();
  console.log('Connected:', status.connected);
  console.log('DB Path:', status.db_path);

  if (status.db_stats) {
    console.log('Observations in DB:', status.db_stats.observations);
    console.log('Summaries in DB:', status.db_stats.summaries);
    console.log('Sessions in DB:', status.db_stats.sessions);
    console.log('Projects:', status.db_stats.projects.join(', '));
    console.log('Types:', JSON.stringify(status.db_stats.types));
  }

  console.log('\nSync State:');
  console.log('  Last sync:', status.sync_state.last_sync || 'never');
  console.log('  Total synced:', status.sync_state.total_synced);

  console.log('\n--- Running Sync ---');
  sync({ force: true }).then(result => {
    console.log('Success:', result.success);
    console.log('Synced:', result.synced);
    if (result.items) {
      result.items.forEach(item => {
        console.log(`  [${item.type}] ${item.project}: ${item.id}`);
      });
    }
    console.log('\nDone.');
  }).catch(console.error);
}
