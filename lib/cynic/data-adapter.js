/**
 * CYNIC DataAdapter - φ-Optimized Data Access Layer
 *
 * "Token efficiency through intelligent caching"
 *
 * Features:
 * - LRU cache with φ-timed TTL (61.8s, 38.2s, 161.8s)
 * - Lazy-loading without sacrificing global vision
 * - Streaming state for real-time updates
 * - Parallel I/O for non-blocking performance
 * - Deduplication of redundant loads
 *
 * @philosophy "$asdfasdfa: Don't extract, burn"
 * @module cynic/data-adapter
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// PHI CONSTANTS - Import from Single Source of Truth (FIXED 2026-01-13)
// =============================================================================

const { PHI, PHI_INV, PHI_INV_2, PHI_SQ } = require('./axioms/constants');

// Cache TTLs (in milliseconds)
const TTL = {
  HOT: Math.round(PHI_INV_2 * 100 * 1000),  // 38.2 seconds - frequently accessed
  WARM: Math.round(PHI_INV * 100 * 1000),    // 61.8 seconds - standard
  COLD: Math.round(PHI * 100 * 1000),        // 161.8 seconds - rarely changes
  FROZEN: Math.round(PHI_SQ * 100 * 1000),   // 261.8 seconds - static data
};

// =============================================================================
// LRU CACHE IMPLEMENTATION
// =============================================================================

class LRUCache {
  constructor(maxSize = 34) { // Fibonacci
    this.maxSize = maxSize;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Get item from cache
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set item in cache with TTL
   */
  set(key, value, ttl = TTL.WARM) {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Invalidate a key
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(1) + '%' : '0%',
      _phi: {
        targetHitRate: `${(PHI_INV * 100).toFixed(1)}%`,
        philosophy: 'Cache should serve φ⁻¹ of requests',
      },
    };
  }
}

// =============================================================================
// DATA ADAPTER CLASS
// =============================================================================

class DataAdapter {
  constructor(options = {}) {
    this.basePath = options.basePath || path.join(__dirname, '../../knowledge');
    this.cache = new LRUCache(options.cacheSize || 34);
    this.logger = options.logger || console;
    this.pendingLoads = new Map(); // Deduplication

    // Track what's been loaded this session (for streaming state)
    this.sessionLoads = new Set();
  }

  // ---------------------------------------------------------------------------
  // FILE OPERATIONS (Cached)
  // ---------------------------------------------------------------------------

  /**
   * Read a file with caching
   */
  async readFile(relativePath, options = {}) {
    const fullPath = path.join(this.basePath, relativePath);
    const cacheKey = `file:${relativePath}`;
    const ttl = options.ttl || TTL.WARM;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Check for pending load (deduplication)
    if (this.pendingLoads.has(cacheKey)) {
      return this.pendingLoads.get(cacheKey);
    }

    // Load file
    const loadPromise = this._loadFile(fullPath, options.parse);
    this.pendingLoads.set(cacheKey, loadPromise);

    try {
      const data = await loadPromise;
      this.cache.set(cacheKey, data, ttl);
      this.sessionLoads.add(relativePath);
      return data;
    } finally {
      this.pendingLoads.delete(cacheKey);
    }
  }

  /**
   * Read JSON file with caching
   */
  async readJSON(relativePath, options = {}) {
    return this.readFile(relativePath, { ...options, parse: 'json' });
  }

  /**
   * Read JSONL file with caching
   */
  async readJSONL(relativePath, options = {}) {
    return this.readFile(relativePath, { ...options, parse: 'jsonl' });
  }

  /**
   * Internal file loader
   */
  async _loadFile(fullPath, parseMode) {
    return new Promise((resolve, reject) => {
      fs.readFile(fullPath, 'utf8', (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            resolve(null); // File doesn't exist
          } else {
            reject(err);
          }
          return;
        }

        try {
          if (parseMode === 'json') {
            resolve(JSON.parse(data));
          } else if (parseMode === 'jsonl') {
            const lines = data.trim().split('\n').filter(Boolean);
            resolve(lines.map(line => JSON.parse(line)));
          } else {
            resolve(data);
          }
        } catch (parseErr) {
          reject(parseErr);
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // BATCH OPERATIONS (Parallel I/O)
  // ---------------------------------------------------------------------------

  /**
   * Load multiple files in parallel
   */
  async loadBatch(relativePaths, options = {}) {
    const promises = relativePaths.map(p =>
      this.readFile(p, options).catch(err => ({ error: err.message, path: p }))
    );

    return Promise.all(promises);
  }

  /**
   * Load all CYNIC knowledge in parallel
   */
  async loadCynicKnowledge() {
    const files = [
      { path: 'cynic/harmony-matrix.json', ttl: TTL.COLD },
      { path: 'cynic/thresholds.json', ttl: TTL.COLD },
      { path: 'cynic-learning-state.json', ttl: TTL.WARM },
      { path: 'cynic/observations/actions.jsonl', ttl: TTL.HOT },
    ];

    const results = await Promise.all(
      files.map(f => this.readFile(f.path, { ttl: f.ttl, parse: 'json' }).catch(() => null))
    );

    return {
      harmonyMatrix: results[0],
      thresholds: results[1],
      learningState: results[2],
      recentActions: results[3],
      loadedAt: Date.now(),
    };
  }

  // ---------------------------------------------------------------------------
  // STREAMING STATE (Real-time Vision)
  // ---------------------------------------------------------------------------

  /**
   * Get streaming state snapshot
   * Returns a minimal view of the system state without reloading everything
   */
  getStreamingState() {
    const cacheStats = this.cache.getStats();

    return {
      timestamp: Date.now(),
      cache: {
        size: cacheStats.size,
        hitRate: cacheStats.hitRate,
        sessionLoads: this.sessionLoads.size,
      },
      loaded: Array.from(this.sessionLoads),
      _phi: {
        efficiency: cacheStats.hits > 0
          ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)).toFixed(3)
          : 0,
        targetEfficiency: PHI_INV,
      },
    };
  }

  /**
   * Subscribe to state changes (for real-time dashboard)
   */
  createStateStream(intervalMs = Math.round(PHI_INV_2 * 100 * 1000)) {
    const stream = {
      running: false,
      interval: null,
      listeners: new Set(),

      start: () => {
        if (stream.running) return;
        stream.running = true;
        stream.interval = setInterval(() => {
          const state = this.getStreamingState();
          for (const listener of stream.listeners) {
            try { listener(state); } catch (e) { /* silent */ }
          }
        }, intervalMs);
        stream.interval.unref();
      },

      stop: () => {
        stream.running = false;
        if (stream.interval) {
          clearInterval(stream.interval);
          stream.interval = null;
        }
      },

      subscribe: (fn) => {
        stream.listeners.add(fn);
        return () => stream.listeners.delete(fn);
      },
    };

    return stream;
  }

  // ---------------------------------------------------------------------------
  // INVALIDATION
  // ---------------------------------------------------------------------------

  /**
   * Invalidate cache entry
   */
  invalidate(relativePath) {
    const cacheKey = `file:${relativePath}`;
    this.cache.invalidate(cacheKey);
  }

  /**
   * Invalidate all CYNIC-related cache entries
   */
  invalidateCynic() {
    for (const key of this.cache.cache.keys()) {
      if (key.includes('cynic')) {
        this.cache.invalidate(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clearCache() {
    this.cache.clear();
  }

  // ---------------------------------------------------------------------------
  // STATISTICS
  // ---------------------------------------------------------------------------

  getStats() {
    return {
      cache: this.cache.getStats(),
      sessionLoads: this.sessionLoads.size,
      basePath: this.basePath,
      ttl: {
        HOT: `${TTL.HOT / 1000}s`,
        WARM: `${TTL.WARM / 1000}s`,
        COLD: `${TTL.COLD / 1000}s`,
        FROZEN: `${TTL.FROZEN / 1000}s`,
      },
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let adapterInstance = null;

function getDataAdapter(options = {}) {
  if (!adapterInstance) {
    adapterInstance = new DataAdapter(options);
  }
  return adapterInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  DataAdapter,
  getDataAdapter,
  LRUCache,
  TTL,
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_SQ,
};
