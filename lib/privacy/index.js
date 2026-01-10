/**
 * CYNIC Privacy Layer
 *
 * "What you don't store, you can't leak."
 * "Some things should not outlive the moment."
 *
 * This module provides comprehensive privacy protection:
 * - hasher.js: Cryptographic hashing for PII
 * - ephemeral.js: Session-only temporary storage
 *
 * All operations follow φ principles for harmony.
 */

'use strict';

const hasher = require('./hasher');
const ephemeral = require('./ephemeral');

// =============================================================================
// UNIFIED PRIVACY API
// =============================================================================

/**
 * Sanitize an object for storage (hash PII, detect sensitive data)
 *
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Options
 * @param {boolean} options.strict - If true, reject objects with unhashed PII
 * @returns {Object} { sanitized, score, issues }
 */
function sanitize(obj, options = {}) {
  const { strict = false } = options;

  // First, check privacy score
  const initialScore = hasher.calculatePrivacyScore(obj);

  if (strict && initialScore.verdict === 'REJECT') {
    return {
      sanitized: null,
      score: initialScore.score,
      issues: initialScore.issues,
      rejected: true,
      reason: 'Privacy score too low for strict mode'
    };
  }

  // Hash PII fields
  const sanitized = hasher.hashObjectPII(obj);

  // Re-check score
  const finalScore = hasher.calculatePrivacyScore(sanitized);

  return {
    sanitized,
    score: finalScore.score,
    issues: finalScore.issues,
    rejected: false,
    improved: finalScore.score > initialScore.score,
    improvement: finalScore.score - initialScore.score
  };
}

/**
 * Store data with automatic privacy handling
 *
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @param {Object} options - Options
 * @param {boolean} options.ephemeral - Use ephemeral storage (default: false)
 * @param {boolean} options.sanitize - Auto-sanitize PII (default: true)
 * @param {number} options.ttl - TTL for ephemeral storage
 * @param {string} options.sessionId - Session ID for ephemeral storage
 */
function secureStore(key, value, options = {}) {
  const {
    ephemeral: useEphemeral = false,
    sanitize: doSanitize = true,
    ttl = ephemeral.TTL.DEFAULT,
    sessionId = null
  } = options;

  let dataToStore = value;

  // Sanitize if needed
  if (doSanitize && typeof value === 'object' && value !== null) {
    const result = sanitize(value);
    dataToStore = result.sanitized || value;
  }

  // Store
  if (useEphemeral) {
    return ephemeral.set(key, dataToStore, { ttl, sessionId });
  }

  // For non-ephemeral, return the sanitized data (caller handles persistence)
  return {
    success: true,
    key,
    data: dataToStore,
    ephemeral: false
  };
}

/**
 * Check if data is safe to store/share
 */
function isSafe(data, minScore = 70) {
  const score = hasher.calculatePrivacyScore(data);
  return {
    safe: score.score >= minScore,
    score: score.score,
    verdict: score.verdict,
    issues: score.issues
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Unified API
  sanitize,
  secureStore,
  isSafe,

  // Hasher module
  hasher,
  hash: hasher.hash,
  hashForLookup: hasher.hashForLookup,
  fastHash: hasher.fastHash,
  detectPII: hasher.detectPII,
  autoHashPII: hasher.autoHashPII,
  hashObjectPII: hasher.hashObjectPII,
  calculatePrivacyScore: hasher.calculatePrivacyScore,
  PRIVACY_LEVELS: hasher.PRIVACY_LEVELS,

  // Ephemeral module
  ephemeral,
  store: ephemeral.store,
  createSession: ephemeral.createSession,
  destroySession: ephemeral.destroySession,
  setOnce: ephemeral.setOnce,
  getOnce: ephemeral.getOnce,
  secureClear: ephemeral.secureClear,
  TTL: ephemeral.TTL,
  LIMITS: ephemeral.LIMITS
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== CYNIC Privacy Layer ===\n');

  // Test unified API
  const testData = {
    userId: 'user123',
    email: 'test@example.com',
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    message: 'Hello world',
    metadata: { public: true }
  };

  console.log('Original data:');
  console.log(JSON.stringify(testData, null, 2));

  console.log('\n--- isSafe() ---');
  const safeCheck = isSafe(testData);
  console.log('Safe:', safeCheck.safe);
  console.log('Score:', safeCheck.score);
  console.log('Issues:', safeCheck.issues.length);

  console.log('\n--- sanitize() ---');
  const sanitized = sanitize(testData);
  console.log('Score improved:', sanitized.improved, `(+${sanitized.improvement})`);
  console.log('New score:', sanitized.score);
  console.log('Sanitized:');
  console.log(JSON.stringify(sanitized.sanitized, null, 2));

  console.log('\n--- secureStore() ephemeral ---');
  const storeResult = secureStore('test-key', testData, {
    ephemeral: true,
    ttl: ephemeral.TTL.SHORT
  });
  console.log('Stored:', storeResult.success);
  console.log('Expires in:', Math.round((storeResult.expires - Date.now()) / 1000), 'seconds');

  // Retrieve
  const retrieved = ephemeral.get('test-key');
  console.log('Retrieved:', !!retrieved);

  // Cleanup
  ephemeral.store.destroy();
  console.log('\nDone.');
}
