/**
 * CYNIC-SYNC - Conscience Collective
 *
 * 🐕 "The pack shares knowledge"
 *
 * World: ASSIAH (Action/Manifestation)
 * Model: Haiku (fast, lightweight)
 *
 * Purpose:
 * - Pull collective knowledge from shared state
 * - Push local learnings to collective
 * - Merge conflict resolution with φ-weighted consensus
 * - Sync state management
 *
 * Philosophy:
 * - "La meute partage ses découvertes"
 * - Local learning enriches collective
 * - Collective wisdom informs local judgments
 * - φ-decay prevents stale knowledge from dominating
 *
 * @module cynic/sync
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// φ CONSTANTS
// =============================================================================

// φ constants - Import from Single Source of Truth (FIXED 2026-01-13)
const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = require('./axioms/constants');

// =============================================================================
// PATHS
// =============================================================================

const KNOWLEDGE_ROOT = path.join(__dirname, '../../knowledge/cynic');
const SYNC_DIR = path.join(KNOWLEDGE_ROOT, 'sync');
const COLLECTIVE_DIR = path.join(KNOWLEDGE_ROOT, 'collective');

// Ensure directories exist
[SYNC_DIR, COLLECTIVE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File paths
const SYNC_STATE_PATH = path.join(SYNC_DIR, 'state.json');
const SYNC_QUEUE_PATH = path.join(SYNC_DIR, 'queue.jsonl');
const SYNC_LOG_PATH = path.join(SYNC_DIR, 'history.jsonl');

// Collective paths
const COLLECTIVE_HARMONY_PATH = path.join(COLLECTIVE_DIR, 'harmony.json');
const COLLECTIVE_THRESHOLDS_PATH = path.join(COLLECTIVE_DIR, 'thresholds.json');
const COLLECTIVE_DISCOVERIES_PATH = path.join(COLLECTIVE_DIR, 'discoveries.jsonl');
const COLLECTIVE_WISDOM_PATH = path.join(COLLECTIVE_DIR, 'wisdom.json');

// =============================================================================
// SYNC STATE
// =============================================================================

/**
 * Default sync state structure
 */
const DEFAULT_SYNC_STATE = {
  version: '1.0.0',
  nodeId: null, // Unique identifier for this node
  created: null,
  lastPull: null,
  lastPush: null,
  lastMerge: null,
  pullCount: 0,
  pushCount: 0,
  mergeCount: 0,
  conflictCount: 0,
  pendingPush: 0,
  syncStatus: 'INITIALIZED', // INITIALIZED, SYNCING, SYNCED, CONFLICT, ERROR
  collectiveVersion: null,
  localVersion: 0,
};

/**
 * Load sync state
 */
function loadSyncState() {
  try {
    if (fs.existsSync(SYNC_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(SYNC_STATE_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-SYNC] Error loading sync state:', err.message);
  }

  // Initialize new state
  const state = {
    ...DEFAULT_SYNC_STATE,
    nodeId: generateNodeId(),
    created: new Date().toISOString(),
  };
  saveSyncState(state);
  return state;
}

/**
 * Save sync state
 */
function saveSyncState(state) {
  fs.writeFileSync(SYNC_STATE_PATH, JSON.stringify(state, null, 2));
}

/**
 * Generate unique node identifier
 */
function generateNodeId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `node_${timestamp}_${random}`;
}

// =============================================================================
// SYNC QUEUE
// =============================================================================

/**
 * Queue item for push
 * @param {Object} item - Item to queue
 * @param {string} item.type - Type: 'harmony', 'threshold', 'discovery', 'outcome'
 * @param {Object} item.data - Data to sync
 * @param {string} [item.source] - Source identifier
 */
function queueForPush(item) {
  const queueEntry = {
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    type: item.type,
    data: item.data,
    source: item.source || 'local',
    status: 'pending',
    attempts: 0,
  };

  // Append to queue
  fs.appendFileSync(SYNC_QUEUE_PATH, JSON.stringify(queueEntry) + '\n');

  // Update state
  const state = loadSyncState();
  state.pendingPush++;
  state.localVersion++;
  saveSyncState(state);

  return queueEntry;
}

/**
 * Get pending queue items
 */
function getPendingQueue() {
  if (!fs.existsSync(SYNC_QUEUE_PATH)) {
    return [];
  }

  const lines = fs.readFileSync(SYNC_QUEUE_PATH, 'utf8')
    .split('\n')
    .filter(line => line.trim());

  return lines
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(item => item && item.status === 'pending');
}

/**
 * Mark queue items as processed
 * @param {string[]} ids - IDs to mark
 * @param {string} status - New status
 */
function markQueueItems(ids, status) {
  if (!fs.existsSync(SYNC_QUEUE_PATH)) return;

  const lines = fs.readFileSync(SYNC_QUEUE_PATH, 'utf8')
    .split('\n')
    .filter(line => line.trim());

  const updated = lines.map(line => {
    try {
      const item = JSON.parse(line);
      if (ids.includes(item.id)) {
        item.status = status;
        item.processedAt = Date.now();
      }
      return JSON.stringify(item);
    } catch {
      return line;
    }
  });

  fs.writeFileSync(SYNC_QUEUE_PATH, updated.join('\n') + '\n');
}

// =============================================================================
// COLLECTIVE WISDOM
// =============================================================================

/**
 * Default collective wisdom structure
 */
const DEFAULT_WISDOM = {
  version: '1.0.0',
  created: null,
  lastUpdated: null,
  contributors: {},
  insights: [],
  patterns: {},
  dimensionCorrelations: {},
  emergentBehaviors: [],
};

/**
 * Load collective wisdom
 */
function loadCollectiveWisdom() {
  try {
    if (fs.existsSync(COLLECTIVE_WISDOM_PATH)) {
      return JSON.parse(fs.readFileSync(COLLECTIVE_WISDOM_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-SYNC] Error loading collective wisdom:', err.message);
  }

  const wisdom = {
    ...DEFAULT_WISDOM,
    created: new Date().toISOString(),
  };
  saveCollectiveWisdom(wisdom);
  return wisdom;
}

/**
 * Save collective wisdom
 */
function saveCollectiveWisdom(wisdom) {
  wisdom.lastUpdated = new Date().toISOString();
  fs.writeFileSync(COLLECTIVE_WISDOM_PATH, JSON.stringify(wisdom, null, 2));
}

// =============================================================================
// PULL OPERATIONS
// =============================================================================

/**
 * Pull collective knowledge
 *
 * In a distributed system, this would fetch from a remote collective.
 * For now, it reads from local collective storage (simulating sync).
 *
 * @param {Object} options - Pull options
 * @param {boolean} [options.force=false] - Force pull even if up-to-date
 * @param {string[]} [options.types] - Types to pull: 'harmony', 'thresholds', 'wisdom'
 * @returns {Object} Pull result
 */
function pull(options = {}) {
  const startTime = Date.now();
  const state = loadSyncState();

  const types = options.types || ['harmony', 'thresholds', 'wisdom'];
  const pulled = {};
  const conflicts = [];

  // Pull harmony matrix
  if (types.includes('harmony')) {
    const collectiveHarmony = loadCollectiveHarmony();
    if (collectiveHarmony) {
      pulled.harmony = collectiveHarmony;
    }
  }

  // Pull thresholds
  if (types.includes('thresholds')) {
    const collectiveThresholds = loadCollectiveThresholds();
    if (collectiveThresholds) {
      pulled.thresholds = collectiveThresholds;
    }
  }

  // Pull wisdom
  if (types.includes('wisdom')) {
    const wisdom = loadCollectiveWisdom();
    if (wisdom) {
      pulled.wisdom = wisdom;
    }
  }

  // Update state
  state.lastPull = new Date().toISOString();
  state.pullCount++;
  state.syncStatus = conflicts.length > 0 ? 'CONFLICT' : 'SYNCED';
  saveSyncState(state);

  // Log pull
  logSyncEvent({
    type: 'pull',
    nodeId: state.nodeId,
    pulled: Object.keys(pulled),
    conflicts: conflicts.length,
    latencyMs: Date.now() - startTime,
  });

  return {
    success: true,
    pulled,
    conflicts,
    nodeId: state.nodeId,
    latencyMs: Date.now() - startTime,
    syncer: 'CYNIC-SYNC',
    world: 'ASSIAH',
  };
}

/**
 * Load collective harmony matrix
 */
function loadCollectiveHarmony() {
  try {
    if (fs.existsSync(COLLECTIVE_HARMONY_PATH)) {
      return JSON.parse(fs.readFileSync(COLLECTIVE_HARMONY_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-SYNC] Error loading collective harmony:', err.message);
  }
  return null;
}

/**
 * Load collective thresholds
 */
function loadCollectiveThresholds() {
  try {
    if (fs.existsSync(COLLECTIVE_THRESHOLDS_PATH)) {
      return JSON.parse(fs.readFileSync(COLLECTIVE_THRESHOLDS_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-SYNC] Error loading collective thresholds:', err.message);
  }
  return null;
}

// =============================================================================
// PUSH OPERATIONS
// =============================================================================

/**
 * Push local learnings to collective
 *
 * Processes pending queue items and merges into collective.
 *
 * @param {Object} options - Push options
 * @param {boolean} [options.force=false] - Force push even with conflicts
 * @param {number} [options.maxItems=100] - Max items to push
 * @returns {Object} Push result
 */
function push(options = {}) {
  const startTime = Date.now();
  const state = loadSyncState();
  const maxItems = options.maxItems || 100;

  const pending = getPendingQueue().slice(0, maxItems);

  if (pending.length === 0) {
    return {
      success: true,
      pushed: 0,
      message: 'Nothing to push',
      nodeId: state.nodeId,
      latencyMs: Date.now() - startTime,
      syncer: 'CYNIC-SYNC',
      world: 'ASSIAH',
    };
  }

  const results = {
    harmony: [],
    threshold: [],
    discovery: [],
    outcome: [],
  };

  const processed = [];
  const errors = [];

  for (const item of pending) {
    try {
      switch (item.type) {
        case 'harmony':
          pushHarmonyUpdate(item.data);
          results.harmony.push(item.id);
          break;

        case 'threshold':
          pushThresholdCalibration(item.data);
          results.threshold.push(item.id);
          break;

        case 'discovery':
          pushDiscovery(item.data);
          results.discovery.push(item.id);
          break;

        case 'outcome':
          pushOutcomeWisdom(item.data);
          results.outcome.push(item.id);
          break;

        default:
          errors.push({ id: item.id, error: `Unknown type: ${item.type}` });
      }

      processed.push(item.id);
    } catch (err) {
      errors.push({ id: item.id, error: err.message });
    }
  }

  // Mark processed items
  if (processed.length > 0) {
    markQueueItems(processed, 'pushed');
  }

  // Update state
  state.lastPush = new Date().toISOString();
  state.pushCount++;
  state.pendingPush = Math.max(0, state.pendingPush - processed.length);
  saveSyncState(state);

  // Log push
  logSyncEvent({
    type: 'push',
    nodeId: state.nodeId,
    pushed: processed.length,
    errors: errors.length,
    breakdown: {
      harmony: results.harmony.length,
      threshold: results.threshold.length,
      discovery: results.discovery.length,
      outcome: results.outcome.length,
    },
    latencyMs: Date.now() - startTime,
  });

  return {
    success: errors.length === 0,
    pushed: processed.length,
    errors,
    breakdown: results,
    nodeId: state.nodeId,
    latencyMs: Date.now() - startTime,
    syncer: 'CYNIC-SYNC',
    world: 'ASSIAH',
  };
}

/**
 * Push harmony update to collective
 */
function pushHarmonyUpdate(data) {
  let collective = loadCollectiveHarmony();

  if (!collective) {
    // Initialize from local harmony
    const localHarmonyPath = path.join(KNOWLEDGE_ROOT, 'matrices/harmony.json');
    if (fs.existsSync(localHarmonyPath)) {
      collective = JSON.parse(fs.readFileSync(localHarmonyPath, 'utf8'));
      collective._meta.source = 'collective';
    } else {
      throw new Error('No harmony matrix to initialize collective');
    }
  }

  // Merge update using φ-weighted average
  const { dim1, dim2, value, source } = data;
  const dim1Index = collective._dimensions.indexOf(dim1);
  const dim2Index = collective._dimensions.indexOf(dim2);

  if (dim1Index >= 0 && dim2Index >= 0) {
    const currentValue = collective.matrix[dim1Index][dim2Index];
    // φ-weighted merge: collective gets PHI_INV weight, new value gets PHI_INV_2
    const mergedValue = currentValue * PHI_INV + value * PHI_INV_2;

    collective.matrix[dim1Index][dim2Index] = mergedValue;
    collective.matrix[dim2Index][dim1Index] = mergedValue; // Symmetric

    collective._meta.lastUpdated = new Date().toISOString();
    collective._meta.updateCount = (collective._meta.updateCount || 0) + 1;

    // Track contributor
    if (!collective._contributors) collective._contributors = {};
    collective._contributors[source] = (collective._contributors[source] || 0) + 1;
  }

  fs.writeFileSync(COLLECTIVE_HARMONY_PATH, JSON.stringify(collective, null, 2));
}

/**
 * Push threshold calibration to collective
 */
function pushThresholdCalibration(data) {
  let collective = loadCollectiveThresholds();

  if (!collective) {
    // Initialize from local thresholds
    const localThresholdsPath = path.join(KNOWLEDGE_ROOT, 'matrices/thresholds.json');
    if (fs.existsSync(localThresholdsPath)) {
      collective = JSON.parse(fs.readFileSync(localThresholdsPath, 'utf8'));
      collective._meta.source = 'collective';
    } else {
      throw new Error('No thresholds matrix to initialize collective');
    }
  }

  // Merge calibration using φ-weighted average
  const { dimension, severity, newValue, source } = data;

  if (collective.thresholds[dimension] && collective.thresholds[dimension][severity] !== undefined) {
    const currentValue = collective.thresholds[dimension][severity];
    // φ-weighted merge
    const mergedValue = currentValue * PHI_INV + newValue * PHI_INV_2;

    // Apply bounds
    const bounds = collective._config.bounds;
    collective.thresholds[dimension][severity] = Math.max(bounds.min, Math.min(bounds.max, mergedValue));

    collective._meta.lastCalibrated = new Date().toISOString();
    collective._meta.calibrationCount = (collective._meta.calibrationCount || 0) + 1;

    // Track contributor
    if (!collective._contributors) collective._contributors = {};
    collective._contributors[source] = (collective._contributors[source] || 0) + 1;
  }

  fs.writeFileSync(COLLECTIVE_THRESHOLDS_PATH, JSON.stringify(collective, null, 2));
}

/**
 * Push discovery to collective
 */
function pushDiscovery(data) {
  const discovery = {
    id: `disc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    ...data,
    status: 'pending_review',
  };

  fs.appendFileSync(COLLECTIVE_DISCOVERIES_PATH, JSON.stringify(discovery) + '\n');
}

/**
 * Push outcome to collective wisdom
 */
function pushOutcomeWisdom(data) {
  const wisdom = loadCollectiveWisdom();

  // Extract pattern from outcome
  const { outcome, dimensions, source } = data;

  // Track contributor
  if (!wisdom.contributors[source]) {
    wisdom.contributors[source] = { outcomes: 0, correct: 0, joined: Date.now() };
  }
  wisdom.contributors[source].outcomes++;
  if (outcome === 'correct') {
    wisdom.contributors[source].correct++;
  }

  // Extract dimension patterns
  if (dimensions && Object.keys(dimensions).length >= 2) {
    const dimKeys = Object.keys(dimensions).sort();
    const patternKey = dimKeys.join('+');

    if (!wisdom.patterns[patternKey]) {
      wisdom.patterns[patternKey] = { count: 0, avgScore: 0, outcomes: { correct: 0, incorrect: 0 } };
    }

    const pattern = wisdom.patterns[patternKey];
    const avgScore = Object.values(dimensions).reduce((a, b) => a + b, 0) / Object.values(dimensions).length;

    pattern.avgScore = (pattern.avgScore * pattern.count + avgScore) / (pattern.count + 1);
    pattern.count++;
    pattern.outcomes[outcome] = (pattern.outcomes[outcome] || 0) + 1;
  }

  saveCollectiveWisdom(wisdom);
}

// =============================================================================
// MERGE OPERATIONS
// =============================================================================

/**
 * Merge collective into local
 *
 * Uses φ-weighted consensus for conflict resolution.
 *
 * @param {Object} options - Merge options
 * @param {string} [options.strategy='phi_weighted'] - Merge strategy
 * @param {boolean} [options.backup=true] - Backup local before merge
 * @returns {Object} Merge result
 */
function merge(options = {}) {
  const startTime = Date.now();
  const state = loadSyncState();
  const strategy = options.strategy || 'phi_weighted';

  const merged = {
    harmony: false,
    thresholds: false,
  };
  const conflicts = [];

  // Merge harmony
  const collectiveHarmony = loadCollectiveHarmony();
  if (collectiveHarmony) {
    const result = mergeHarmony(collectiveHarmony, strategy, options.backup);
    merged.harmony = result.success;
    if (result.conflicts) conflicts.push(...result.conflicts);
  }

  // Merge thresholds
  const collectiveThresholds = loadCollectiveThresholds();
  if (collectiveThresholds) {
    const result = mergeThresholds(collectiveThresholds, strategy, options.backup);
    merged.thresholds = result.success;
    if (result.conflicts) conflicts.push(...result.conflicts);
  }

  // Update state
  state.lastMerge = new Date().toISOString();
  state.mergeCount++;
  state.conflictCount += conflicts.length;
  state.syncStatus = conflicts.length > 0 ? 'CONFLICT' : 'SYNCED';
  saveSyncState(state);

  // Log merge
  logSyncEvent({
    type: 'merge',
    nodeId: state.nodeId,
    strategy,
    merged: Object.entries(merged).filter(([, v]) => v).map(([k]) => k),
    conflicts: conflicts.length,
    latencyMs: Date.now() - startTime,
  });

  return {
    success: conflicts.length === 0,
    merged,
    conflicts,
    strategy,
    nodeId: state.nodeId,
    latencyMs: Date.now() - startTime,
    syncer: 'CYNIC-SYNC',
    world: 'ASSIAH',
  };
}

/**
 * Merge harmony matrices
 */
function mergeHarmony(collective, strategy, backup = true) {
  const localPath = path.join(KNOWLEDGE_ROOT, 'matrices/harmony.json');

  if (!fs.existsSync(localPath)) {
    // No local, just copy collective
    fs.writeFileSync(localPath, JSON.stringify(collective, null, 2));
    return { success: true, conflicts: [] };
  }

  const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));

  // Backup
  if (backup) {
    const backupPath = path.join(SYNC_DIR, `harmony_backup_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(local, null, 2));
  }

  const conflicts = [];

  // Merge each cell
  for (let i = 0; i < local.matrix.length; i++) {
    for (let j = i + 1; j < local.matrix[i].length; j++) {
      const localVal = local.matrix[i][j];
      const collectiveVal = collective.matrix[i]?.[j] || 0;

      if (localVal !== collectiveVal) {
        // φ-weighted merge
        const mergedVal = applyMergeStrategy(localVal, collectiveVal, strategy);

        if (Math.abs(localVal - collectiveVal) > 0.1) {
          conflicts.push({
            type: 'harmony',
            location: `[${i}][${j}]`,
            local: localVal,
            collective: collectiveVal,
            resolved: mergedVal,
          });
        }

        local.matrix[i][j] = mergedVal;
        local.matrix[j][i] = mergedVal;
      }
    }
  }

  local._meta.lastMerged = new Date().toISOString();
  local._meta.mergeCount = (local._meta.mergeCount || 0) + 1;

  fs.writeFileSync(localPath, JSON.stringify(local, null, 2));

  return { success: true, conflicts };
}

/**
 * Merge threshold matrices
 */
function mergeThresholds(collective, strategy, backup = true) {
  const localPath = path.join(KNOWLEDGE_ROOT, 'matrices/thresholds.json');

  if (!fs.existsSync(localPath)) {
    // No local, just copy collective
    fs.writeFileSync(localPath, JSON.stringify(collective, null, 2));
    return { success: true, conflicts: [] };
  }

  const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));

  // Backup
  if (backup) {
    const backupPath = path.join(SYNC_DIR, `thresholds_backup_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(local, null, 2));
  }

  const conflicts = [];

  // Merge each dimension's thresholds
  for (const dim of Object.keys(local.thresholds)) {
    for (const severity of ['healthy', 'warning', 'critical', 'severe']) {
      const localVal = local.thresholds[dim][severity];
      const collectiveVal = collective.thresholds[dim]?.[severity];

      if (collectiveVal !== undefined && localVal !== collectiveVal) {
        const mergedVal = applyMergeStrategy(localVal, collectiveVal, strategy);

        if (Math.abs(localVal - collectiveVal) > 2) {
          conflicts.push({
            type: 'threshold',
            dimension: dim,
            severity,
            local: localVal,
            collective: collectiveVal,
            resolved: mergedVal,
          });
        }

        local.thresholds[dim][severity] = mergedVal;
      }
    }
  }

  local._meta.lastMerged = new Date().toISOString();
  local._meta.mergeCount = (local._meta.mergeCount || 0) + 1;

  fs.writeFileSync(localPath, JSON.stringify(local, null, 2));

  return { success: true, conflicts };
}

/**
 * Apply merge strategy
 * @param {number} local - Local value
 * @param {number} collective - Collective value
 * @param {string} strategy - Strategy name
 * @returns {number} Merged value
 */
function applyMergeStrategy(local, collective, strategy) {
  switch (strategy) {
    case 'phi_weighted':
      // Local gets φ⁻¹ weight, collective gets φ⁻² weight
      return local * PHI_INV + collective * PHI_INV_2;

    case 'collective_priority':
      // Collective gets φ⁻¹ weight, local gets φ⁻² weight
      return collective * PHI_INV + local * PHI_INV_2;

    case 'local_priority':
      // Local dominates unless very different
      return Math.abs(local - collective) > 10 ?
        local * PHI_INV + collective * PHI_INV_2 :
        local;

    case 'average':
      return (local + collective) / 2;

    case 'max':
      return Math.max(local, collective);

    case 'min':
      return Math.min(local, collective);

    default:
      return local * PHI_INV + collective * PHI_INV_2;
  }
}

// =============================================================================
// SYNC ORCHESTRATION
// =============================================================================

/**
 * Full sync operation: pull → merge → push
 *
 * @param {Object} options - Sync options
 * @returns {Object} Sync result
 */
async function sync(options = {}) {
  const startTime = Date.now();
  const state = loadSyncState();

  state.syncStatus = 'SYNCING';
  saveSyncState(state);

  const results = {
    pull: null,
    merge: null,
    push: null,
  };

  try {
    // 1. Pull collective knowledge
    results.pull = pull(options.pull || {});

    // 2. Merge if we pulled anything
    if (results.pull.success && Object.keys(results.pull.pulled).length > 0) {
      results.merge = merge(options.merge || {});
    }

    // 3. Push local learnings
    results.push = push(options.push || {});

    // Update state
    const newState = loadSyncState();
    newState.syncStatus = 'SYNCED';
    newState.collectiveVersion = Date.now();
    saveSyncState(newState);

  } catch (err) {
    const newState = loadSyncState();
    newState.syncStatus = 'ERROR';
    saveSyncState(newState);

    return {
      success: false,
      error: err.message,
      results,
      nodeId: state.nodeId,
      latencyMs: Date.now() - startTime,
      syncer: 'CYNIC-SYNC',
      world: 'ASSIAH',
    };
  }

  // Log full sync
  logSyncEvent({
    type: 'full_sync',
    nodeId: state.nodeId,
    results: {
      pulled: results.pull?.pulled ? Object.keys(results.pull.pulled) : [],
      merged: results.merge?.merged || {},
      pushed: results.push?.pushed || 0,
    },
    latencyMs: Date.now() - startTime,
  });

  return {
    success: true,
    results,
    nodeId: state.nodeId,
    latencyMs: Date.now() - startTime,
    syncer: 'CYNIC-SYNC',
    world: 'ASSIAH',
  };
}

// =============================================================================
// SYNC LOGGING
// =============================================================================

/**
 * Log sync event
 */
function logSyncEvent(event) {
  const logEntry = {
    ...event,
    timestamp: Date.now(),
    iso: new Date().toISOString(),
  };

  fs.appendFileSync(SYNC_LOG_PATH, JSON.stringify(logEntry) + '\n');
}

/**
 * Get sync history
 * @param {number} [limit=20] - Max entries to return
 */
function getSyncHistory(limit = 20) {
  if (!fs.existsSync(SYNC_LOG_PATH)) {
    return [];
  }

  const lines = fs.readFileSync(SYNC_LOG_PATH, 'utf8')
    .split('\n')
    .filter(line => line.trim());

  return lines
    .slice(-limit)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

// =============================================================================
// STATUS & DIAGNOSTICS
// =============================================================================

/**
 * Get sync status
 */
function getSyncStatus() {
  const state = loadSyncState();
  const pending = getPendingQueue();
  const history = getSyncHistory(5);

  // Calculate health
  let health = 100;

  // Pending items reduce health
  if (pending.length > 10) health -= 10;
  if (pending.length > 50) health -= 20;

  // Long time since sync reduces health
  if (state.lastPush) {
    const hoursSincePush = (Date.now() - new Date(state.lastPush).getTime()) / (1000 * 60 * 60);
    if (hoursSincePush > 24) health -= 15;
    if (hoursSincePush > 168) health -= 25; // Week
  }

  // Conflicts reduce health
  if (state.conflictCount > 0) health -= Math.min(20, state.conflictCount * 2);

  // Error status
  if (state.syncStatus === 'ERROR') health -= 30;

  return {
    nodeId: state.nodeId,
    status: state.syncStatus,
    health: Math.max(0, health),
    stats: {
      pullCount: state.pullCount,
      pushCount: state.pushCount,
      mergeCount: state.mergeCount,
      conflictCount: state.conflictCount,
      pendingPush: pending.length,
    },
    lastActivity: {
      pull: state.lastPull,
      push: state.lastPush,
      merge: state.lastMerge,
    },
    versions: {
      local: state.localVersion,
      collective: state.collectiveVersion,
    },
    recentHistory: history,
    syncer: 'CYNIC-SYNC',
    world: 'ASSIAH',
  };
}

/**
 * Get collective statistics
 */
function getCollectiveStats() {
  const wisdom = loadCollectiveWisdom();
  const collectiveHarmony = loadCollectiveHarmony();
  const collectiveThresholds = loadCollectiveThresholds();

  return {
    wisdom: {
      contributors: Object.keys(wisdom.contributors || {}).length,
      insights: (wisdom.insights || []).length,
      patterns: Object.keys(wisdom.patterns || {}).length,
    },
    harmony: {
      exists: !!collectiveHarmony,
      updateCount: collectiveHarmony?._meta?.updateCount || 0,
      contributors: Object.keys(collectiveHarmony?._contributors || {}).length,
    },
    thresholds: {
      exists: !!collectiveThresholds,
      calibrationCount: collectiveThresholds?._meta?.calibrationCount || 0,
      contributors: Object.keys(collectiveThresholds?._contributors || {}).length,
    },
    syncer: 'CYNIC-SYNC',
    world: 'ASSIAH',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main operations
  sync,
  pull,
  push,
  merge,

  // Queue operations
  queueForPush,
  getPendingQueue,

  // Status
  getSyncStatus,
  getSyncHistory,
  getCollectiveStats,

  // Wisdom access
  loadCollectiveWisdom,

  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,

  // Metadata
  SYNC_SUBAGENT: {
    name: 'CYNIC-SYNC',
    world: 'ASSIAH',
    model: 'haiku',
    purpose: 'Conscience collective - pull/push/merge',
    philosophy: 'La meute partage ses découvertes',
  },
};
