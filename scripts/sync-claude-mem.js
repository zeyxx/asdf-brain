#!/usr/bin/env node
/**
 * sync-claude-mem.js - Sync local claude-mem to asdf-brain
 *
 * This script pulls observations from claude-mem (local SQLite)
 * and ingests them into asdf-brain's collective knowledge.
 *
 * Philosophy: Local feeds collective, collective benefits all
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// CONFIGURATION
// =============================================================================

const BRAIN_ROOT = path.join(__dirname, '..');
const INGEST_PATH = path.join(BRAIN_ROOT, 'knowledge/ingested/claude-mem.jsonl');

// claude-mem database locations (check multiple)
const CLAUDE_MEM_PATHS = [
  path.join(process.env.HOME, '.claude-mem/observations.db'),
  '/workspaces/claude-mem/test-storage/observations.db',
  '/workspaces/asdfasdfa-ecosystem/claude-mem/test-storage/observations.db',
];

// State file to track last sync
const STATE_PATH = path.join(BRAIN_ROOT, '.claude-mem-sync-state.json');

// =============================================================================
// LOGGING
// =============================================================================

function log(emoji, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

// =============================================================================
// SQLITE HELPER (without native modules)
// =============================================================================

/**
 * Simple SQLite reader using sqlite3 CLI
 * We avoid native modules for maximum portability
 */
function querySqlite(dbPath, sql) {
  const { execSync } = require('child_process');

  try {
    const result = execSync(`sqlite3 -json "${dbPath}" "${sql}"`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024, // 50MB
    });

    return JSON.parse(result || '[]');
  } catch (e) {
    // If sqlite3 CLI not available or query fails
    log('⚠️', `SQLite query failed: ${e.message}`);
    return [];
  }
}

// =============================================================================
// SYNC LOGIC
// =============================================================================

function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    }
  } catch (e) {
    // Ignore
  }
  return { lastSyncId: 0, lastSyncTime: null };
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function transformObservation(obs) {
  // Transform claude-mem observation format to brain ingest format
  return {
    type: obs.obs_type || obs.type || 'observation',
    content: obs.content || obs.observation || '',
    timestamp: obs.created_at || obs.timestamp || new Date().toISOString(),
    source: 'claude-mem',
    project: obs.project || 'default',
    metadata: {
      original_id: obs.id,
      importance: obs.importance,
      tags: obs.tags ? (typeof obs.tags === 'string' ? JSON.parse(obs.tags) : obs.tags) : [],
    },
  };
}

async function syncFromClaudeMem() {
  log('🔄', '=== Syncing claude-mem to asdf-brain ===');

  // Find the database
  let dbPath = null;
  for (const p of CLAUDE_MEM_PATHS) {
    if (fs.existsSync(p)) {
      dbPath = p;
      break;
    }
  }

  if (!dbPath) {
    log('⚠️', 'No claude-mem database found. Checking paths:');
    CLAUDE_MEM_PATHS.forEach(p => log('  ', p));
    return { synced: 0 };
  }

  log('📂', `Using database: ${dbPath}`);

  // Load sync state
  const state = loadState();
  log('📊', `Last sync ID: ${state.lastSyncId}`);

  // Query new observations
  const sql = `SELECT * FROM observations WHERE id > ${state.lastSyncId} ORDER BY id ASC LIMIT 1000`;
  const observations = querySqlite(dbPath, sql);

  if (observations.length === 0) {
    log('✅', 'No new observations to sync');
    return { synced: 0 };
  }

  log('📥', `Found ${observations.length} new observations`);

  // Ensure output directory exists
  const dir = path.dirname(INGEST_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Transform and write
  let synced = 0;
  let maxId = state.lastSyncId;

  for (const obs of observations) {
    try {
      const transformed = transformObservation(obs);

      // Add ingestion metadata
      const entry = {
        ...transformed,
        ingested_at: new Date().toISOString(),
        hash: crypto.createHash('sha256')
          .update(JSON.stringify(transformed))
          .digest('hex')
          .slice(0, 16),
      };

      fs.appendFileSync(INGEST_PATH, JSON.stringify(entry) + '\n');
      synced++;

      if (obs.id > maxId) {
        maxId = obs.id;
      }
    } catch (e) {
      log('⚠️', `Failed to process observation ${obs.id}: ${e.message}`);
    }
  }

  // Update state
  state.lastSyncId = maxId;
  state.lastSyncTime = new Date().toISOString();
  saveState(state);

  log('✅', `Synced ${synced} observations (last ID: ${maxId})`);

  return { synced, lastId: maxId };
}

// =============================================================================
// ALTERNATIVE: JSON FILE SYNC
// =============================================================================

/**
 * Fallback sync from JSON exports (if SQLite not available)
 */
function syncFromJsonExports() {
  const exportPaths = [
    '/workspaces/claude-mem/exports/',
    path.join(process.env.HOME, '.claude-mem/exports/'),
  ];

  for (const exportDir of exportPaths) {
    if (!fs.existsSync(exportDir)) continue;

    const files = fs.readdirSync(exportDir)
      .filter(f => f.endsWith('.json') || f.endsWith('.jsonl'));

    for (const file of files) {
      log('📄', `Processing export: ${file}`);
      // Process export file...
    }
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  claude-mem → asdf-brain sync');
  console.log('  Local memory feeds collective knowledge');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const result = await syncFromClaudeMem();

    if (result.synced === 0) {
      // Try JSON fallback
      syncFromJsonExports();
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`  Sync complete: ${result.synced} observations ingested`);
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (e) {
    log('💥', `Sync failed: ${e.message}`);
    process.exit(1);
  }
}

main();
