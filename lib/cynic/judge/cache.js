/**
 * LRU Cache - Least Recently Used cache for judgments
 *
 * Caches repeated judgments to avoid redundant computation
 *
 * @module cynic/judge/cache
 */

'use strict';

/**
 * Simple LRU Cache for repeated judgments
 */
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  /**
   * Generate hash key from item
   */
  _hash(item) {
    const str = typeof item === 'string' ? item : JSON.stringify(item);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Get cached item (moves to end = most recently used)
   */
  get(item) {
    const key = this._hash(item);
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  /**
   * Set cached item
   */
  set(item, result) {
    const key = this._hash(item);

    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hits: 1
    });
  }

  /**
   * Record a cache hit
   */
  recordHit(item) {
    const key = this._hash(item);
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      entry.hits++;
      entry.lastHit = Date.now();
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([k, v]) => ({
        key: k,
        hits: v.hits,
        age: Date.now() - v.timestamp
      }))
    };
  }

  /**
   * Clear all cached items
   */
  clear() {
    this.cache.clear();
  }
}

// Global cache instance
const judgmentCache = new LRUCache(100);

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  LRUCache,
  judgmentCache
};
