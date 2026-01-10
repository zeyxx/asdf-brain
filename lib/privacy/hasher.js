/**
 * hasher.js - CYNIC Privacy Layer
 *
 * Philosophy: "What you don't store, you can't leak."
 *
 * This module provides:
 * - Cryptographic hashing for PII protection
 * - Consistent hashing for lookups (same input = same output)
 * - Salt management with φ-based key derivation
 * - PII detection and auto-hashing
 * - Privacy levels (PUBLIC, INTERNAL, PRIVATE, SECRET)
 *
 * φ principles:
 * - Hash length ratios follow φ (32:20:12 ≈ φ:1:φ⁻¹)
 * - Salt iterations based on φ sequences
 * - Privacy thresholds aligned with CYNIC dimensions
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// =============================================================================
// φ CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;   // φ⁻¹
const PHI_INV_2 = 0.381966011250105; // φ⁻²

// Hash length ratios (φ-based)
const HASH_LENGTHS = {
  FULL: 64,                          // SHA-256 full (reference)
  STANDARD: Math.round(64 * PHI_INV), // 40 chars
  SHORT: Math.round(64 * PHI_INV_2),  // 24 chars
  MINI: Math.round(64 * PHI_INV_2 * PHI_INV) // 15 chars
};

// =============================================================================
// PRIVACY LEVELS
// =============================================================================

const PRIVACY_LEVELS = {
  PUBLIC: {
    level: 0,
    description: 'Can be shared openly',
    hashRequired: false,
    retention: 'indefinite'
  },
  INTERNAL: {
    level: 1,
    description: 'Visible within ecosystem only',
    hashRequired: false,
    retention: 'indefinite'
  },
  PRIVATE: {
    level: 2,
    description: 'Should be hashed before storage',
    hashRequired: true,
    retention: '90d'
  },
  SECRET: {
    level: 3,
    description: 'Must be hashed, ephemeral only',
    hashRequired: true,
    retention: 'session'
  }
};

// =============================================================================
// PII PATTERNS - Detection of Personally Identifiable Information
// =============================================================================

const PII_PATTERNS = {
  // High confidence patterns
  email: {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    level: 'PRIVATE',
    confidence: 0.95
  },
  walletAddress: {
    // Solana addresses (32-44 base58 chars)
    pattern: /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g,
    level: 'PRIVATE',
    confidence: 0.8,
    validator: (match) => /^[1-9A-HJ-NP-Za-km-z]+$/.test(match) && match.length >= 32
  },
  ethereumAddress: {
    pattern: /\b0x[a-fA-F0-9]{40}\b/g,
    level: 'PRIVATE',
    confidence: 0.95
  },
  ipAddress: {
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    level: 'PRIVATE',
    confidence: 0.9
  },
  phoneNumber: {
    pattern: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    level: 'SECRET',
    confidence: 0.85
  },
  // Medium confidence patterns
  username: {
    pattern: /@[a-zA-Z0-9_]{3,30}\b/g,
    level: 'INTERNAL',
    confidence: 0.7
  },
  apiKey: {
    pattern: /\b(?:sk|pk|api|key|token)[_-]?[a-zA-Z0-9]{20,}\b/gi,
    level: 'SECRET',
    confidence: 0.9
  },
  privateKey: {
    pattern: /\b[0-9a-fA-F]{64}\b/g,
    level: 'SECRET',
    confidence: 0.6,
    validator: (match) => match.length === 64
  }
};

// =============================================================================
// SALT MANAGEMENT
// =============================================================================

const SALT_CONFIG = {
  // Salt file location
  saltFile: path.join(__dirname, '..', '..', '.private', 'salt.key'),
  // Salt length (φ-based)
  length: Math.round(32 * PHI), // 52 bytes
  // PBKDF2 iterations (Fibonacci-based for φ harmony)
  iterations: 100000,
  // Key derivation function
  algorithm: 'sha512'
};

let _globalSalt = null;

/**
 * Get or create the global salt
 */
function getOrCreateSalt() {
  if (_globalSalt) return _globalSalt;

  const saltDir = path.dirname(SALT_CONFIG.saltFile);

  try {
    // Try to load existing salt
    if (fs.existsSync(SALT_CONFIG.saltFile)) {
      _globalSalt = fs.readFileSync(SALT_CONFIG.saltFile);
      return _globalSalt;
    }

    // Create new salt
    if (!fs.existsSync(saltDir)) {
      fs.mkdirSync(saltDir, { recursive: true });
    }

    _globalSalt = crypto.randomBytes(SALT_CONFIG.length);
    fs.writeFileSync(SALT_CONFIG.saltFile, _globalSalt, { mode: 0o600 });

    return _globalSalt;
  } catch (e) {
    // Fallback: in-memory salt (not persisted)
    if (!_globalSalt) {
      _globalSalt = crypto.randomBytes(SALT_CONFIG.length);
    }
    return _globalSalt;
  }
}

/**
 * Derive a key from the global salt for a specific purpose
 */
function deriveKey(purpose, length = 32) {
  const salt = getOrCreateSalt();
  return crypto.pbkdf2Sync(
    purpose,
    salt,
    SALT_CONFIG.iterations,
    length,
    SALT_CONFIG.algorithm
  );
}

// =============================================================================
// CORE HASHING FUNCTIONS
// =============================================================================

/**
 * Hash a string using SHA-256 with optional salt
 *
 * @param {string} input - String to hash
 * @param {Object} options - Hashing options
 * @param {boolean} options.salted - Whether to use salt (default: true)
 * @param {string} options.purpose - Purpose for key derivation (default: 'default')
 * @param {string} options.length - Hash length: 'full', 'standard', 'short', 'mini'
 * @returns {string} Hex hash string with prefix
 */
function hash(input, options = {}) {
  const {
    salted = true,
    purpose = 'default',
    length = 'standard'
  } = options;

  if (input === null || input === undefined) {
    return null;
  }

  const inputStr = String(input);

  // Create hash
  const hashObj = crypto.createHash('sha256');

  if (salted) {
    const key = deriveKey(purpose);
    hashObj.update(key);
  }

  hashObj.update(inputStr);
  const fullHash = hashObj.digest('hex');

  // Truncate based on length setting
  const hashLength = HASH_LENGTHS[length.toUpperCase()] || HASH_LENGTHS.STANDARD;
  const truncatedHash = fullHash.substring(0, hashLength);

  // Add prefix for identification
  const prefix = salted ? 'sh_' : 'h_'; // sh = salted hash, h = plain hash
  return prefix + truncatedHash;
}

/**
 * Hash for consistent lookups (unsalted, deterministic)
 * Use this when you need to find the same hash later
 */
function hashForLookup(input, purpose = 'lookup') {
  if (input === null || input === undefined) return null;

  // Use HMAC for consistent but keyed hashing
  const key = deriveKey(purpose);
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(String(input));

  return 'lh_' + hmac.digest('hex').substring(0, HASH_LENGTHS.STANDARD);
}

/**
 * Fast hash for non-sensitive data (no salt, quick)
 */
function fastHash(input) {
  if (input === null || input === undefined) return null;

  const hashObj = crypto.createHash('sha256');
  hashObj.update(String(input));
  return 'fh_' + hashObj.digest('hex').substring(0, HASH_LENGTHS.SHORT);
}

/**
 * Hash with HMAC for message authentication
 */
function hmacHash(input, key) {
  if (input === null || input === undefined) return null;

  const hmac = crypto.createHmac('sha256', key);
  hmac.update(String(input));
  return 'hm_' + hmac.digest('hex');
}

// =============================================================================
// PII DETECTION AND AUTO-HASHING
// =============================================================================

/**
 * Detect PII in text
 *
 * @param {string} text - Text to scan
 * @returns {Array} Array of detected PII with type, value, and position
 */
function detectPII(text) {
  if (!text || typeof text !== 'string') return [];

  const detected = [];

  for (const [type, config] of Object.entries(PII_PATTERNS)) {
    const matches = text.matchAll(config.pattern);

    for (const match of matches) {
      // Apply validator if exists
      if (config.validator && !config.validator(match[0])) {
        continue;
      }

      detected.push({
        type,
        value: match[0],
        index: match.index,
        length: match[0].length,
        level: config.level,
        confidence: config.confidence
      });
    }
  }

  // Sort by position
  detected.sort((a, b) => a.index - b.index);

  return detected;
}

/**
 * Auto-hash all detected PII in text
 *
 * @param {string} text - Text containing potential PII
 * @param {Object} options - Options
 * @param {number} options.minConfidence - Minimum confidence to hash (default: 0.7)
 * @param {boolean} options.preserveFormat - Keep [HASHED:type] markers (default: true)
 * @returns {Object} { text: sanitized text, hashes: Map of hash -> original }
 */
function autoHashPII(text, options = {}) {
  const {
    minConfidence = 0.7,
    preserveFormat = true
  } = options;

  if (!text || typeof text !== 'string') {
    return { text, hashes: new Map(), detected: [] };
  }

  const detected = detectPII(text);
  const hashes = new Map();
  let result = text;
  let offset = 0;

  for (const pii of detected) {
    if (pii.confidence < minConfidence) continue;

    // Hash the PII
    const hashedValue = hash(pii.value, { purpose: pii.type });
    hashes.set(hashedValue, pii.value);

    // Replace in text
    const replacement = preserveFormat
      ? `[${pii.type.toUpperCase()}:${hashedValue}]`
      : hashedValue;

    const start = pii.index + offset;
    const end = start + pii.length;

    result = result.substring(0, start) + replacement + result.substring(end);
    offset += replacement.length - pii.length;
  }

  return {
    text: result,
    hashes,
    detected: detected.filter(p => p.confidence >= minConfidence)
  };
}

/**
 * Hash all PII fields in an object
 *
 * @param {Object} obj - Object to sanitize
 * @param {Array} fields - Field names to hash (or auto-detect if empty)
 * @returns {Object} Sanitized object with hashed PII fields
 */
function hashObjectPII(obj, fields = []) {
  if (!obj || typeof obj !== 'object') return obj;

  const result = Array.isArray(obj) ? [] : {};
  const knownPIIFields = [
    'email', 'wallet', 'address', 'ip', 'phone', 'username',
    'name', 'firstName', 'lastName', 'user', 'operator',
    'apiKey', 'token', 'secret', 'password', 'privateKey'
  ];

  const fieldsToHash = fields.length > 0
    ? fields
    : knownPIIFields;

  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();

    // Check if this field should be hashed
    const shouldHash = fieldsToHash.some(f =>
      keyLower.includes(f.toLowerCase())
    );

    if (shouldHash && typeof value === 'string') {
      // Hash the value
      result[key] = hash(value, { purpose: key });
      // Also add the hash mapping
      result[key + 'Hash'] = hashForLookup(value, key);
    } else if (typeof value === 'object' && value !== null) {
      // Recurse
      result[key] = hashObjectPII(value, fields);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// =============================================================================
// PRIVACY LEVEL HELPERS
// =============================================================================

/**
 * Get privacy level for a field name
 */
function getPrivacyLevel(fieldName) {
  const nameLower = fieldName.toLowerCase();

  // Check against PII patterns
  for (const [type, config] of Object.entries(PII_PATTERNS)) {
    if (nameLower.includes(type.toLowerCase())) {
      return PRIVACY_LEVELS[config.level];
    }
  }

  // Default checks
  if (/secret|private|key|token|password/i.test(nameLower)) {
    return PRIVACY_LEVELS.SECRET;
  }
  if (/email|wallet|address|phone|ip/i.test(nameLower)) {
    return PRIVACY_LEVELS.PRIVATE;
  }
  if (/user|name|operator/i.test(nameLower)) {
    return PRIVACY_LEVELS.INTERNAL;
  }

  return PRIVACY_LEVELS.PUBLIC;
}

/**
 * Check if a value needs hashing based on privacy level
 */
function needsHashing(fieldName, value) {
  const level = getPrivacyLevel(fieldName);

  if (!level.hashRequired) return false;

  // Also check value for PII patterns
  if (typeof value === 'string') {
    const detected = detectPII(value);
    if (detected.length > 0) return true;
  }

  return level.hashRequired;
}

// =============================================================================
// CYNIC INTEGRATION
// =============================================================================

/**
 * Calculate privacy score for CYNIC dimension
 *
 * @param {Object} data - Data to evaluate
 * @returns {Object} { score: 0-100, issues: [...], suggestions: [...] }
 */
function calculatePrivacyScore(data) {
  const issues = [];
  const suggestions = [];
  let score = 100;

  if (!data || typeof data !== 'object') {
    return { score: 50, issues: ['Invalid data format'], suggestions: [] };
  }

  const checkValue = (key, value, path = '') => {
    const fullPath = path ? `${path}.${key}` : key;

    if (typeof value === 'string') {
      // Check for PII in string values
      const detected = detectPII(value);
      for (const pii of detected) {
        if (pii.confidence >= 0.8) {
          issues.push({
            path: fullPath,
            type: pii.type,
            level: pii.level,
            message: `Unhashed ${pii.type} detected`
          });
          score -= 15 * pii.confidence;
          suggestions.push(`Hash ${fullPath} using hashObjectPII()`);
        }
      }

      // Check if field name suggests PII but value isn't hashed
      if (needsHashing(key, value) && !value.startsWith('sh_') && !value.startsWith('h_')) {
        issues.push({
          path: fullPath,
          type: 'field_name',
          level: 'PRIVATE',
          message: `Field "${key}" should be hashed`
        });
        score -= 10;
        suggestions.push(`Hash field "${fullPath}"`);
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recurse into nested objects
      for (const [k, v] of Object.entries(value)) {
        checkValue(k, v, fullPath);
      }
    }
  };

  for (const [key, value] of Object.entries(data)) {
    checkValue(key, value);
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    issues,
    suggestions,
    verdict: score >= 90 ? 'ACCEPT' : score >= 70 ? 'TRANSFORM' : 'REJECT',
    philosophy: 'What you don\'t store, you can\'t leak.'
  };
}

// =============================================================================
// VERIFICATION
// =============================================================================

/**
 * Verify if a value matches a hash (for lookup hashes)
 */
function verifyLookupHash(value, lookupHash, purpose = 'lookup') {
  const computed = hashForLookup(value, purpose);
  return computed === lookupHash;
}

/**
 * Check if a string is a valid hash from this module
 */
function isHash(str) {
  if (!str || typeof str !== 'string') return false;
  return /^(sh_|h_|lh_|fh_|hm_)[a-f0-9]+$/.test(str);
}

/**
 * Get hash type from prefix
 */
function getHashType(hashStr) {
  if (!isHash(hashStr)) return null;

  const prefix = hashStr.substring(0, hashStr.indexOf('_') + 1);
  const types = {
    'sh_': 'salted',
    'h_': 'plain',
    'lh_': 'lookup',
    'fh_': 'fast',
    'hm_': 'hmac'
  };

  return types[prefix] || 'unknown';
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core hashing
  hash,
  hashForLookup,
  fastHash,
  hmacHash,

  // PII handling
  detectPII,
  autoHashPII,
  hashObjectPII,

  // Privacy levels
  PRIVACY_LEVELS,
  getPrivacyLevel,
  needsHashing,

  // CYNIC integration
  calculatePrivacyScore,

  // Verification
  verifyLookupHash,
  isHash,
  getHashType,

  // Configuration
  HASH_LENGTHS,
  PII_PATTERNS,

  // Salt management
  deriveKey,
  getOrCreateSalt
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== CYNIC Privacy Layer - Hasher ===\n');

  // Test basic hashing
  const testEmail = 'test@example.com';
  console.log('Input:', testEmail);
  console.log('Salted hash:', hash(testEmail));
  console.log('Lookup hash:', hashForLookup(testEmail));
  console.log('Fast hash:', fastHash(testEmail));

  // Test PII detection
  console.log('\n--- PII Detection ---');
  const testText = 'Contact john@example.com or call 555-123-4567. Wallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  const detected = detectPII(testText);
  console.log('Detected PII:', detected.map(d => ({ type: d.type, confidence: d.confidence })));

  // Test auto-hash
  console.log('\n--- Auto-Hash PII ---');
  const { text: sanitized, hashes } = autoHashPII(testText);
  console.log('Sanitized:', sanitized);
  console.log('Hashes:', hashes.size);

  // Test privacy score
  console.log('\n--- Privacy Score ---');
  const testObj = {
    name: 'John Doe',
    email: 'john@example.com',
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    publicData: 'This is fine'
  };
  const privacyScore = calculatePrivacyScore(testObj);
  console.log('Score:', privacyScore.score);
  console.log('Issues:', privacyScore.issues.length);
  console.log('Verdict:', privacyScore.verdict);

  // Test object hashing
  console.log('\n--- Object Hashing ---');
  const hashedObj = hashObjectPII(testObj);
  console.log('Hashed object:', JSON.stringify(hashedObj, null, 2));

  // Re-check privacy score
  const newScore = calculatePrivacyScore(hashedObj);
  console.log('\nNew score:', newScore.score);
  console.log('New verdict:', newScore.verdict);
}
