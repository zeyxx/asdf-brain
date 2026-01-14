/**
 * Shared dependencies and utilities for handlers
 *
 * "Don't trust, verify" - Shared foundation for all handlers
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// φ constants from temporal
const temporal = require('../temporal');
const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = temporal;
const PHI_SQ = PHI * PHI;

// Context detection
const { detectProject } = require('../context-layer');

// Language detection
const langDetect = require('../lang-detect');

// Contribution tracking
const burnMechanism = require('../burn-mechanism');

// Contributors
const contributors = require('../contributors');

// Base paths
const KNOWLEDGE_PATH = path.join(__dirname, '..', '..', 'knowledge');
const INDEX_PATH = path.join(__dirname, '..', '..', 'index');

// =============================================================================
// ACCESS TRACKING - For N-Score Utilization (U) component
// =============================================================================

const ACCESS_TRACKING_FILE = path.join(KNOWLEDGE_PATH, 'learned', 'access-tracking.json');

/**
 * Load access tracking data
 * @returns {Object} Map of nodeId -> { accesses, lastAccessed }
 */
function loadAccessTracking() {
  try {
    if (fs.existsSync(ACCESS_TRACKING_FILE)) {
      return JSON.parse(fs.readFileSync(ACCESS_TRACKING_FILE, 'utf8'));
    }
  } catch (e) {
    // Silent fail - tracking is non-critical
  }
  return {};
}

/**
 * Save access tracking data (debounced internally)
 * @param {Object} tracking - The tracking data
 */
let trackingSaveTimeout = null;
function saveAccessTracking(tracking) {
  // Debounce writes by φ⁻² seconds (3.82s)
  if (trackingSaveTimeout) clearTimeout(trackingSaveTimeout);
  trackingSaveTimeout = setTimeout(() => {
    try {
      const dir = path.dirname(ACCESS_TRACKING_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(ACCESS_TRACKING_FILE, JSON.stringify(tracking, null, 2));
    } catch (e) {
      // Silent fail
    }
    trackingSaveTimeout = null;
  }, Math.round(PHI_INV_2 * 10000)); // 3.82 seconds
}

/**
 * Track access for a list of node IDs
 * @param {Array<string>} nodeIds - IDs of accessed nodes
 */
function trackAccesses(nodeIds) {
  if (!nodeIds || nodeIds.length === 0) return;

  const tracking = loadAccessTracking();
  const now = Date.now();

  for (const id of nodeIds) {
    if (!id) continue;
    if (!tracking[id]) {
      tracking[id] = { accesses: 0, lastAccessed: now };
    }
    tracking[id].accesses++;
    tracking[id].lastAccessed = now;
  }

  saveAccessTracking(tracking);
}

/**
 * Get access stats for a node
 * @param {string} nodeId - Node ID
 * @returns {Object} { accesses, lastAccessed } or defaults
 */
function getAccessStats(nodeId) {
  const tracking = loadAccessTracking();
  return tracking[nodeId] || { accesses: 1, lastAccessed: Date.now() };
}

module.exports = {
  // Node.js built-ins
  fs,
  path,
  crypto,
  readline,

  // φ constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  PHI_SQ,

  // Modules
  temporal,
  detectProject,
  langDetect,
  burnMechanism,
  contributors,

  // Paths
  KNOWLEDGE_PATH,
  INDEX_PATH,

  // Access tracking (for N-Score)
  trackAccesses,
  getAccessStats,
  loadAccessTracking,
};
