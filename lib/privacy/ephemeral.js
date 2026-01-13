/**
 * ephemeral.js - Session-Only Data Storage
 *
 * Philosophy: "Some things should not outlive the moment."
 *
 * This module provides:
 * - Memory-only storage (never touches disk)
 * - Auto-expiring data with φ-based TTLs
 * - Session-scoped containers
 * - Secure cleanup on process exit
 *
 * φ principles:
 * - Default TTL = 1 hour × φ⁻¹ ≈ 37 minutes
 * - Max entries per session = 100 × φ ≈ 162
 * - Cleanup interval = 60s × φ⁻² ≈ 23 seconds
 */

'use strict';

const crypto = require('crypto');

// =============================================================================
// φ CONSTANTS - Import from Single Source of Truth (FIXED 2026-01-13)
// =============================================================================

const { PHI, PHI_INV, PHI_INV_2 } = require('../cynic/axioms/constants');

// Time constants (in milliseconds)
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// φ-based timing
const DEFAULT_TTL = Math.round(HOUR * PHI_INV);           // ~37 minutes
const SHORT_TTL = Math.round(MINUTE * 5 * PHI_INV);       // ~3 minutes
const LONG_TTL = Math.round(HOUR * PHI);                  // ~97 minutes
const MAX_TTL = Math.round(HOUR * 24 * PHI_INV);          // ~14.8 hours
const CLEANUP_INTERVAL = Math.round(MINUTE * PHI_INV_2);  // ~23 seconds

// Capacity limits
const MAX_ENTRIES_PER_SESSION = Math.round(100 * PHI);    // 162
const MAX_SESSIONS = Math.round(50 * PHI);                // 81
const MAX_ENTRY_SIZE = Math.round(1024 * 1024 * PHI_INV); // ~618KB

// =============================================================================
// EPHEMERAL STORE
// =============================================================================

class EphemeralStore {
  constructor() {
    // Session containers: Map<sessionId, Map<key, {value, expires, created}>>
    this._sessions = new Map();

    // Global ephemeral data (not session-specific)
    this._global = new Map();

    // Stats
    this._stats = {
      totalStored: 0,
      totalExpired: 0,
      totalCleared: 0,
      sessionsCreated: 0
    };

    // Start cleanup timer
    this._cleanupTimer = setInterval(() => this._cleanup(), CLEANUP_INTERVAL);

    // Ensure cleanup on process exit
    this._setupExitHandler();
  }

  // ===========================================================================
  // SESSION MANAGEMENT
  // ===========================================================================

  /**
   * Create a new session container
   *
   * @param {string} sessionId - Optional custom session ID
   * @returns {string} Session ID
   */
  createSession(sessionId = null) {
    const id = sessionId || this._generateSessionId();

    if (this._sessions.size >= MAX_SESSIONS) {
      // Evict oldest session
      const oldest = this._getOldestSession();
      if (oldest) this.destroySession(oldest);
    }

    this._sessions.set(id, new Map());
    this._stats.sessionsCreated++;

    return id;
  }

  /**
   * Destroy a session and all its data
   */
  destroySession(sessionId) {
    const session = this._sessions.get(sessionId);
    if (session) {
      const count = session.size;
      session.clear();
      this._sessions.delete(sessionId);
      this._stats.totalCleared += count;
    }
  }

  /**
   * Check if session exists
   */
  hasSession(sessionId) {
    return this._sessions.has(sessionId);
  }

  /**
   * List active sessions
   */
  listSessions() {
    return [...this._sessions.keys()].map(id => ({
      id,
      entries: this._sessions.get(id).size,
      created: this._getSessionCreationTime(id)
    }));
  }

  // ===========================================================================
  // DATA OPERATIONS
  // ===========================================================================

  /**
   * Store ephemeral data
   *
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @param {Object} options - Storage options
   * @param {string} options.sessionId - Session to store in (null for global)
   * @param {number} options.ttl - Time to live in ms (default: DEFAULT_TTL)
   * @returns {Object} { success, key, expires }
   */
  set(key, value, options = {}) {
    const {
      sessionId = null,
      ttl = DEFAULT_TTL
    } = options;

    // Validate TTL
    const actualTtl = Math.min(ttl, MAX_TTL);

    // Check size
    const size = this._estimateSize(value);
    if (size > MAX_ENTRY_SIZE) {
      return { success: false, error: 'Value too large', maxSize: MAX_ENTRY_SIZE };
    }

    // Get storage container
    const container = this._getContainer(sessionId);
    if (!container) {
      return { success: false, error: 'Session not found' };
    }

    // Check capacity
    if (container.size >= MAX_ENTRIES_PER_SESSION) {
      // Evict oldest entry
      this._evictOldest(container);
    }

    const now = Date.now();
    const entry = {
      value: this._clone(value),
      expires: now + actualTtl,
      created: now,
      ttl: actualTtl
    };

    container.set(key, entry);
    this._stats.totalStored++;

    return {
      success: true,
      key,
      expires: entry.expires,
      ttl: actualTtl
    };
  }

  /**
   * Retrieve ephemeral data
   *
   * @param {string} key - Storage key
   * @param {Object} options - Options
   * @param {string} options.sessionId - Session to retrieve from
   * @returns {*} Value or undefined if not found/expired
   */
  get(key, options = {}) {
    const { sessionId = null } = options;

    const container = this._getContainer(sessionId);
    if (!container) return undefined;

    const entry = container.get(key);
    if (!entry) return undefined;

    // Check expiration
    if (Date.now() > entry.expires) {
      container.delete(key);
      this._stats.totalExpired++;
      return undefined;
    }

    return this._clone(entry.value);
  }

  /**
   * Delete ephemeral data
   */
  delete(key, options = {}) {
    const { sessionId = null } = options;

    const container = this._getContainer(sessionId);
    if (!container) return false;

    const existed = container.has(key);
    container.delete(key);

    if (existed) this._stats.totalCleared++;
    return existed;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key, options = {}) {
    const { sessionId = null } = options;

    const container = this._getContainer(sessionId);
    if (!container) return false;

    const entry = container.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expires) {
      container.delete(key);
      this._stats.totalExpired++;
      return false;
    }

    return true;
  }

  /**
   * Get time remaining until expiration
   */
  ttl(key, options = {}) {
    const { sessionId = null } = options;

    const container = this._getContainer(sessionId);
    if (!container) return -1;

    const entry = container.get(key);
    if (!entry) return -1;

    const remaining = entry.expires - Date.now();
    return remaining > 0 ? remaining : -1;
  }

  /**
   * Extend TTL of existing entry
   */
  touch(key, options = {}) {
    const { sessionId = null, ttl = DEFAULT_TTL } = options;

    const container = this._getContainer(sessionId);
    if (!container) return false;

    const entry = container.get(key);
    if (!entry) return false;

    const actualTtl = Math.min(ttl, MAX_TTL);
    entry.expires = Date.now() + actualTtl;
    entry.ttl = actualTtl;

    return true;
  }

  // ===========================================================================
  // BULK OPERATIONS
  // ===========================================================================

  /**
   * Get all keys in a session/global
   */
  keys(options = {}) {
    const { sessionId = null } = options;

    const container = this._getContainer(sessionId);
    if (!container) return [];

    const now = Date.now();
    const validKeys = [];

    for (const [key, entry] of container) {
      if (entry.expires > now) {
        validKeys.push(key);
      }
    }

    return validKeys;
  }

  /**
   * Clear all data in a session/global
   */
  clear(options = {}) {
    const { sessionId = null } = options;

    const container = this._getContainer(sessionId);
    if (!container) return 0;

    const count = container.size;
    container.clear();
    this._stats.totalCleared += count;

    return count;
  }

  /**
   * Get stats
   */
  getStats() {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;

    // Count global
    for (const entry of this._global.values()) {
      if (entry.expires > now) activeEntries++;
      else expiredEntries++;
    }

    // Count sessions
    for (const session of this._sessions.values()) {
      for (const entry of session.values()) {
        if (entry.expires > now) activeEntries++;
        else expiredEntries++;
      }
    }

    return {
      activeSessions: this._sessions.size,
      activeEntries,
      pendingExpiration: expiredEntries,
      ...this._stats
    };
  }

  // ===========================================================================
  // SECURE OPERATIONS
  // ===========================================================================

  /**
   * Store sensitive data with auto-clear on read
   */
  setOnce(key, value, options = {}) {
    const sessionId = options.sessionId !== undefined ? options.sessionId : null;

    const result = this.set(key, value, {
      ...options,
      sessionId,
      ttl: options.ttl || SHORT_TTL
    });

    if (result.success) {
      // Mark as read-once
      const container = this._getContainer(sessionId);
      if (container) {
        const entry = container.get(key);
        if (entry) entry._readOnce = true;
      }
    }

    return result;
  }

  /**
   * Get and delete (for read-once data)
   */
  getOnce(key, options = {}) {
    const value = this.get(key, options);
    this.delete(key, options);
    return value;
  }

  /**
   * Secure clear - overwrite memory before clearing
   */
  secureClear(options = {}) {
    const { sessionId = null } = options;

    const container = this._getContainer(sessionId);
    if (!container) return 0;

    // Overwrite each entry's value
    for (const entry of container.values()) {
      if (typeof entry.value === 'string') {
        entry.value = crypto.randomBytes(entry.value.length).toString('hex');
      } else if (Buffer.isBuffer(entry.value)) {
        crypto.randomFillSync(entry.value);
      }
    }

    return this.clear(options);
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  _getContainer(sessionId) {
    if (sessionId === null) return this._global;
    return this._sessions.get(sessionId);
  }

  _generateSessionId() {
    return 'eph_' + crypto.randomBytes(16).toString('hex');
  }

  _getOldestSession() {
    let oldest = null;
    let oldestTime = Infinity;

    for (const [id, session] of this._sessions) {
      for (const entry of session.values()) {
        if (entry.created < oldestTime) {
          oldestTime = entry.created;
          oldest = id;
        }
        break; // Only check first entry
      }
    }

    return oldest;
  }

  _getSessionCreationTime(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session || session.size === 0) return null;

    let earliest = Infinity;
    for (const entry of session.values()) {
      if (entry.created < earliest) earliest = entry.created;
    }

    return earliest === Infinity ? null : earliest;
  }

  _evictOldest(container) {
    let oldest = null;
    let oldestTime = Infinity;

    for (const [key, entry] of container) {
      if (entry.created < oldestTime) {
        oldestTime = entry.created;
        oldest = key;
      }
    }

    if (oldest) {
      container.delete(oldest);
      this._stats.totalCleared++;
    }
  }

  _cleanup() {
    const now = Date.now();
    let expired = 0;

    // Clean global
    for (const [key, entry] of this._global) {
      if (entry.expires <= now) {
        this._global.delete(key);
        expired++;
      }
    }

    // Clean sessions
    for (const session of this._sessions.values()) {
      for (const [key, entry] of session) {
        if (entry.expires <= now) {
          session.delete(key);
          expired++;
        }
      }
    }

    this._stats.totalExpired += expired;
  }

  _estimateSize(value) {
    if (typeof value === 'string') return value.length * 2;
    if (Buffer.isBuffer(value)) return value.length;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).length * 2;
      } catch (e) {
        return MAX_ENTRY_SIZE; // Assume max if can't stringify
      }
    }
    return 64; // Default size for primitives
  }

  _clone(value) {
    if (value === null || typeof value !== 'object') return value;
    if (Buffer.isBuffer(value)) return Buffer.from(value);
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      return value;
    }
  }

  _setupExitHandler() {
    const cleanup = () => {
      if (this._cleanupTimer) {
        clearInterval(this._cleanupTimer);
      }

      // Secure clear all data
      this.secureClear();
      for (const sessionId of this._sessions.keys()) {
        this.secureClear({ sessionId });
      }

      this._sessions.clear();
      this._global.clear();
    };

    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });
  }

  /**
   * Destroy the store (for testing)
   */
  destroy() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    this._sessions.clear();
    this._global.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

const ephemeralStore = new EphemeralStore();

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Store instance
  store: ephemeralStore,

  // Class for creating additional stores
  EphemeralStore,

  // Convenience methods (use global container)
  set: (key, value, options) => ephemeralStore.set(key, value, options),
  get: (key, options) => ephemeralStore.get(key, options),
  delete: (key, options) => ephemeralStore.delete(key, options),
  has: (key, options) => ephemeralStore.has(key, options),

  // Session methods
  createSession: (id) => ephemeralStore.createSession(id),
  destroySession: (id) => ephemeralStore.destroySession(id),

  // Secure methods
  setOnce: (key, value, options) => ephemeralStore.setOnce(key, value, options),
  getOnce: (key, options) => ephemeralStore.getOnce(key, options),
  secureClear: (options) => ephemeralStore.secureClear(options),

  // Stats
  getStats: () => ephemeralStore.getStats(),

  // Constants
  TTL: {
    SHORT: SHORT_TTL,
    DEFAULT: DEFAULT_TTL,
    LONG: LONG_TTL,
    MAX: MAX_TTL
  },

  LIMITS: {
    MAX_ENTRIES_PER_SESSION,
    MAX_SESSIONS,
    MAX_ENTRY_SIZE
  }
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== CYNIC Privacy Layer - Ephemeral Store ===\n');

  console.log('TTL Settings (φ-based):');
  console.log(`  SHORT:   ${Math.round(SHORT_TTL / 1000)}s (~3 min)`);
  console.log(`  DEFAULT: ${Math.round(DEFAULT_TTL / 1000)}s (~37 min)`);
  console.log(`  LONG:    ${Math.round(LONG_TTL / 1000)}s (~97 min)`);
  console.log(`  MAX:     ${Math.round(MAX_TTL / 1000)}s (~14.8 hours)`);

  console.log('\nLimits (φ-based):');
  console.log(`  Max entries/session: ${MAX_ENTRIES_PER_SESSION}`);
  console.log(`  Max sessions:        ${MAX_SESSIONS}`);
  console.log(`  Max entry size:      ${Math.round(MAX_ENTRY_SIZE / 1024)}KB`);

  // Test basic operations
  console.log('\n--- Basic Operations ---');

  const result1 = ephemeralStore.set('test-key', { secret: 'value' });
  console.log('Set:', result1);

  const value1 = ephemeralStore.get('test-key');
  console.log('Get:', value1);

  const ttl1 = ephemeralStore.ttl('test-key');
  console.log('TTL remaining:', Math.round(ttl1 / 1000), 'seconds');

  // Test session
  console.log('\n--- Session Operations ---');

  const sessionId = ephemeralStore.createSession();
  console.log('Created session:', sessionId);

  ephemeralStore.set('session-data', { private: true }, { sessionId });
  console.log('Stored in session');

  const sessionValue = ephemeralStore.get('session-data', { sessionId });
  console.log('Session value:', sessionValue);

  // Test read-once
  console.log('\n--- Read-Once (Secure) ---');

  ephemeralStore.setOnce('one-time-secret', 'TOP_SECRET_123');
  console.log('Stored one-time secret');

  const secret1 = ephemeralStore.getOnce('one-time-secret');
  console.log('First read:', secret1);

  const secret2 = ephemeralStore.getOnce('one-time-secret');
  console.log('Second read:', secret2); // Should be undefined

  // Stats
  console.log('\n--- Stats ---');
  console.log(ephemeralStore.getStats());

  // Cleanup
  ephemeralStore.destroy();
  console.log('\nStore destroyed.');
}
