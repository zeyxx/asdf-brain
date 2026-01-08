#!/usr/bin/env node
/**
 * auto-sync-claude-mem.js
 *
 * Hook script: Syncs claude-mem observations to asdf-brain
 * Runs automatically on SessionEnd via Claude Code hooks
 *
 * Philosophy: Local feeds collective, collective benefits all
 * $asdfasdfa: "Don't trust, verify"
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// =============================================================================
// CONFIGURATION
// =============================================================================

const BRAIN_ROOT = path.join(__dirname, '..');
const INGEST_PATH = path.join(BRAIN_ROOT, 'knowledge/ingested');
const STATE_PATH = path.join(BRAIN_ROOT, '.claude-mem-sync-state.json');
const LIVE_PATH = path.join(BRAIN_ROOT, 'knowledge/learned/live.jsonl');

// claude-mem database
const CLAUDE_MEM_DB = path.join(process.env.HOME, '.claude-mem/claude-mem.db');

// =============================================================================
// HELPERS
// =============================================================================

function log(emoji, message) {
  // Silent by default for hooks, enable with DEBUG=1
  if (process.env.DEBUG) {
    console.error(`[sync] ${emoji} ${message}`);
  }
}

function querySqlite(sql) {
  try {
    if (!fs.existsSync(CLAUDE_MEM_DB)) {
      log('⚠️', 'claude-mem.db not found');
      return [];
    }

    const result = execSync(`sqlite3 -json "${CLAUDE_MEM_DB}" "${sql}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return JSON.parse(result || '[]');
  } catch (e) {
    log('❌', `SQLite error: ${e.message}`);
    return [];
  }
}

function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return { lastSyncId: 0, lastSyncTime: null, totalSynced: 0 };
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function detectProject(obs) {
  const text = `${obs.title || ''} ${obs.text || ''} ${obs.project || ''}`.toLowerCase();

  if (text.includes('k-score') || text.includes('kscore') || text.includes('holdex')) return 'holdex';
  if (text.includes('gasless') || text.includes('gasdf') || text.includes('burn')) return 'gasdf';
  if (text.includes('brain') || text.includes('knowledge') || text.includes('pattern')) return 'brain';
  if (text.includes('manifesto') || text.includes('philosophy')) return 'manifesto';

  return obs.project?.toLowerCase() || 'ecosystem';
}

// =============================================================================
// MAIN SYNC
// =============================================================================

function sync() {
  const state = loadState();

  // Get new observations since last sync
  const newObs = querySqlite(`
    SELECT id, memory_session_id, project, text, type, title, subtitle,
           facts, narrative, concepts, files_modified, created_at
    FROM observations
    WHERE id > ${state.lastSyncId}
    ORDER BY id ASC
    LIMIT 100
  `);

  if (newObs.length === 0) {
    log('✓', 'No new observations');
    return { synced: 0, total: state.totalSynced };
  }

  log('📥', `Found ${newObs.length} new observations`);

  // Ensure directories exist
  if (!fs.existsSync(INGEST_PATH)) {
    fs.mkdirSync(INGEST_PATH, { recursive: true });
  }

  const entries = [];
  let maxId = state.lastSyncId;

  for (const obs of newObs) {
    const project = detectProject(obs);
    const content = [obs.title, obs.text, obs.narrative].filter(Boolean).join(' | ');

    const entry = {
      id: generateHash(`${obs.id}-${obs.created_at}`),
      source: 'claude-mem',
      source_id: obs.id,
      session_id: obs.memory_session_id,
      type: obs.type || 'observation',
      project,
      content: content.slice(0, 500),
      title: obs.title,
      facts: obs.facts ? JSON.parse(obs.facts) : null,
      concepts: obs.concepts ? JSON.parse(obs.concepts) : null,
      files: obs.files_modified ? JSON.parse(obs.files_modified) : null,
      timestamp: obs.created_at,
      synced_at: new Date().toISOString(),
      hash: generateHash(content)
    };

    entries.push(entry);
    maxId = Math.max(maxId, obs.id);
  }

  // Append to ingested file
  const ingestFile = path.join(INGEST_PATH, 'claude-mem.jsonl');
  const lines = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.appendFileSync(ingestFile, lines);

  // Also append to live learnings
  const liveEntries = entries.map(e => ({
    id: e.id,
    type: e.type === 'decision' ? 'decision' : 'insight',
    content: e.content,
    context: `claude-mem sync: ${e.title || 'observation'}`,
    project: e.project,
    tags: [e.type, 'claude-mem', e.project],
    timestamp: e.synced_at,
    hash: e.hash,
    contributor: 'claude-mem-sync'
  }));

  const liveLines = liveEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.appendFileSync(LIVE_PATH, liveLines);

  // Update state
  state.lastSyncId = maxId;
  state.lastSyncTime = new Date().toISOString();
  state.totalSynced += entries.length;
  saveState(state);

  log('✅', `Synced ${entries.length} observations (total: ${state.totalSynced})`);

  return { synced: entries.length, total: state.totalSynced };
}

// =============================================================================
// RUN
// =============================================================================

// Read stdin (hook input) but we don't need it
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const result = sync();

    // Output for hooks (shown in verbose mode)
    if (result.synced > 0) {
      console.log(`[asdf-brain] Synced ${result.synced} observations from claude-mem`);
    }

    process.exit(0);
  } catch (e) {
    log('❌', `Sync failed: ${e.message}`);
    process.exit(0); // Don't block on errors
  }
});

// Handle direct execution (no stdin)
setTimeout(() => {
  if (!input) {
    try {
      const result = sync();
      if (result.synced > 0) {
        console.log(`Synced ${result.synced} observations (total: ${result.total})`);
      } else {
        console.log('No new observations to sync');
      }
    } catch (e) {
      console.error(`Sync failed: ${e.message}`);
    }
    process.exit(0);
  }
}, 100);
