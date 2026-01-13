/**
 * CYNIC-SHIELD - Security & Defense Layer
 *
 * World: ASSIAH (Action)
 * Model: Haiku (fast response to threats)
 * Latency Target: <50ms
 *
 * "Le chien de garde qui ne dort jamais"
 *
 * Responsibilities:
 * 1. Handle adversarial inputs from GATE
 * 2. Advanced rate limiting (φ-weighted by E-Score)
 * 3. Attack pattern logging & analysis
 * 4. Quarantine suspicious actors
 * 5. Alert generation
 *
 * @philosophy L0: Protect $asdfasdfa ecosystem first
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// φ constants - Import from Single Source of Truth (FIXED 2026-01-13)
const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = require('./axioms/constants');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Paths
  LOG_DIR: path.join(__dirname, '../../knowledge/security'),
  ATTACK_LOG: 'attacks.jsonl',
  QUARANTINE_FILE: 'quarantine.json',

  // Rate limits (φ-based)
  RATE_LIMITS: {
    anonymous: {
      requests: Math.round(100 * PHI_INV),  // ~62 requests
      windowMs: 60 * 1000,                   // 1 minute
    },
    authenticated: {
      requests: Math.round(100 * PHI),       // ~162 requests
      windowMs: 60 * 1000,
    },
    trusted: {
      requests: Math.round(100 * PHI * PHI), // ~262 requests
      windowMs: 60 * 1000,
    },
  },

  // Quarantine durations (φ-scaled)
  QUARANTINE: {
    warning: Math.round(5 * 60 * 1000 * PHI_INV),     // ~3 minutes
    critical: Math.round(30 * 60 * 1000 * PHI_INV),   // ~18.5 minutes
    severe: Math.round(24 * 60 * 60 * 1000 * PHI_INV), // ~14.8 hours
    permanent: Infinity,
  },

  // Strike system
  MAX_STRIKES: 5,
  STRIKE_DECAY_MS: 24 * 60 * 60 * 1000, // 24 hours
};

// =============================================================================
// IN-MEMORY STORES
// =============================================================================

// Attack counter per source
const attackCounters = new Map();

// Quarantine list
const quarantined = new Map();

// Strike counter per source
const strikeCounters = new Map();

// =============================================================================
// THREAT CLASSIFICATION
// =============================================================================

/**
 * Threat levels with responses
 */
const THREAT_LEVELS = {
  low: {
    strikes: 1,
    action: 'log',
    response: '🐕 *sniff* Je note ça.',
  },
  medium: {
    strikes: 2,
    action: 'warn',
    response: '🐕 *growl* Attention, comportement suspect détecté.',
  },
  high: {
    strikes: 3,
    action: 'throttle',
    response: '🐕 *bark* Trop d\'attaques. Ralentissement appliqué.',
  },
  critical: {
    strikes: 5,
    action: 'quarantine',
    response: '🐕 *BARK BARK* Quarantaine activée. Reviens plus tard.',
  },
};

/**
 * Attack type severity mapping
 */
const ATTACK_SEVERITY = {
  INJECTION: 'high',
  SYSTEM_INJECT: 'critical',
  FORMAT_INJECT: 'high',
  ROLEPLAY_INJECT: 'medium',
  EXTRACTION: 'medium',
  MANIPULATION: 'medium',
  JAILBREAK: 'critical',
  FLOOD: 'high',
  SYBIL: 'critical',
};

// =============================================================================
// CORE SHIELD FUNCTIONS
// =============================================================================

/**
 * Handle a security event from GATE
 *
 * @param {Object} gateResult - Result from CYNIC-GATE with security flag
 * @param {Object} options - { sourceId, context }
 * @returns {Object} - Shield response
 */
function handleSecurityEvent(gateResult, options = {}) {
  const startTime = Date.now();
  const { sourceId = 'anonymous', context = {} } = options;

  // Check if already quarantined
  const quarantineCheck = checkQuarantine(sourceId);
  if (quarantineCheck.quarantined) {
    return {
      blocked: true,
      reason: 'QUARANTINED',
      response: quarantineCheck.response,
      expiresIn: quarantineCheck.expiresIn,
      latencyMs: Date.now() - startTime,
      shield: 'CYNIC-SHIELD',
    };
  }

  // Get attack patterns from gate result
  const patterns = gateResult.patterns || [];
  const category = gateResult.category || 'UNKNOWN';

  // Determine severity
  const severities = patterns.map(p => ATTACK_SEVERITY[p.type] || 'low');
  const maxSeverity = getMaxSeverity(severities);

  // Record attack
  const attackRecord = recordAttack(sourceId, {
    category,
    patterns,
    severity: maxSeverity,
    timestamp: Date.now(),
    context,
  });

  // Add strikes
  const strikes = addStrikes(sourceId, THREAT_LEVELS[maxSeverity]?.strikes || 1);

  // Check if should quarantine
  if (strikes >= CONFIG.MAX_STRIKES) {
    const duration = CONFIG.QUARANTINE[maxSeverity] || CONFIG.QUARANTINE.warning;
    quarantine(sourceId, duration, `Exceeded ${CONFIG.MAX_STRIKES} strikes`);

    return {
      blocked: true,
      reason: 'QUARANTINED',
      response: THREAT_LEVELS.critical.response,
      strikes,
      maxStrikes: CONFIG.MAX_STRIKES,
      quarantineDuration: duration,
      attackRecord,
      latencyMs: Date.now() - startTime,
      shield: 'CYNIC-SHIELD',
    };
  }

  // Get threat response
  const threatLevel = THREAT_LEVELS[maxSeverity] || THREAT_LEVELS.low;

  // Apply action
  let actionResult = null;
  switch (threatLevel.action) {
    case 'throttle':
      actionResult = applyThrottle(sourceId);
      break;
    case 'warn':
      actionResult = { warned: true };
      break;
    case 'log':
    default:
      actionResult = { logged: true };
  }

  return {
    blocked: false,
    action: threatLevel.action,
    response: threatLevel.response,
    severity: maxSeverity,
    strikes,
    maxStrikes: CONFIG.MAX_STRIKES,
    patterns: patterns.map(p => p.type),
    actionResult,
    attackRecord,
    latencyMs: Date.now() - startTime,
    shield: 'CYNIC-SHIELD',
    world: 'ASSIAH',
  };
}

/**
 * Get maximum severity from array
 */
function getMaxSeverity(severities) {
  const order = { critical: 4, high: 3, medium: 2, low: 1 };
  return severities.reduce((max, s) =>
    (order[s] || 0) > (order[max] || 0) ? s : max,
    'low'
  );
}

// =============================================================================
// QUARANTINE MANAGEMENT
// =============================================================================

/**
 * Check if source is quarantined
 *
 * @param {string} sourceId - Source identifier
 * @returns {Object} - { quarantined, expiresIn, response }
 */
function checkQuarantine(sourceId) {
  const record = quarantined.get(sourceId);

  if (!record) {
    return { quarantined: false };
  }

  const now = Date.now();
  const expiresIn = record.expiresAt - now;

  // Expired
  if (expiresIn <= 0) {
    quarantined.delete(sourceId);
    return { quarantined: false };
  }

  return {
    quarantined: true,
    expiresIn,
    expiresAt: record.expiresAt,
    reason: record.reason,
    response: `🐕 *guard* Quarantaine active. Reste ${formatDuration(expiresIn)}.`,
  };
}

/**
 * Quarantine a source
 *
 * @param {string} sourceId - Source identifier
 * @param {number} durationMs - Duration in milliseconds
 * @param {string} reason - Reason for quarantine
 */
function quarantine(sourceId, durationMs, reason = 'Security violation') {
  const record = {
    sourceId,
    reason,
    quarantinedAt: Date.now(),
    expiresAt: Date.now() + durationMs,
    durationMs,
  };

  quarantined.set(sourceId, record);

  // Log to file
  logQuarantine(record);

  return record;
}

/**
 * Release from quarantine
 *
 * @param {string} sourceId - Source identifier
 */
function releaseQuarantine(sourceId) {
  const record = quarantined.get(sourceId);
  quarantined.delete(sourceId);
  return { released: true, record };
}

/**
 * Format duration for display
 */
function formatDuration(ms) {
  if (ms < 60000) return `${Math.ceil(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.ceil(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.ceil(ms / 3600000)}h`;
  return `${Math.ceil(ms / 86400000)}j`;
}

// =============================================================================
// STRIKE SYSTEM
// =============================================================================

/**
 * Add strikes to a source
 *
 * @param {string} sourceId - Source identifier
 * @param {number} count - Number of strikes to add
 * @returns {number} - Total strikes
 */
function addStrikes(sourceId, count = 1) {
  const now = Date.now();
  let record = strikeCounters.get(sourceId);

  // Initialize or decay old strikes
  if (!record) {
    record = { strikes: 0, lastStrike: now };
  } else {
    // Decay strikes over time
    const elapsed = now - record.lastStrike;
    const decay = Math.floor(elapsed / CONFIG.STRIKE_DECAY_MS);
    record.strikes = Math.max(0, record.strikes - decay);
  }

  record.strikes += count;
  record.lastStrike = now;
  strikeCounters.set(sourceId, record);

  return record.strikes;
}

/**
 * Get current strikes for a source
 */
function getStrikes(sourceId) {
  const record = strikeCounters.get(sourceId);
  if (!record) return 0;

  // Apply decay
  const elapsed = Date.now() - record.lastStrike;
  const decay = Math.floor(elapsed / CONFIG.STRIKE_DECAY_MS);
  return Math.max(0, record.strikes - decay);
}

/**
 * Clear strikes for a source
 */
function clearStrikes(sourceId) {
  strikeCounters.delete(sourceId);
  return { cleared: true };
}

// =============================================================================
// THROTTLING
// =============================================================================

/**
 * Apply throttle to a source
 * Reduces their rate limit by φ⁻¹
 *
 * @param {string} sourceId - Source identifier
 */
function applyThrottle(sourceId) {
  const key = `throttle:${sourceId}`;
  const existing = attackCounters.get(key) || { multiplier: 1 };

  existing.multiplier *= PHI_INV; // Reduce by 61.8%
  existing.appliedAt = Date.now();
  attackCounters.set(key, existing);

  return {
    throttled: true,
    multiplier: existing.multiplier,
    effectiveLimit: Math.round(CONFIG.RATE_LIMITS.anonymous.requests * existing.multiplier),
  };
}

/**
 * Get throttle multiplier for a source
 */
function getThrottleMultiplier(sourceId) {
  const key = `throttle:${sourceId}`;
  const record = attackCounters.get(key);

  if (!record) return 1;

  // Throttle decays after 1 hour
  const elapsed = Date.now() - record.appliedAt;
  if (elapsed > 60 * 60 * 1000) {
    attackCounters.delete(key);
    return 1;
  }

  return record.multiplier;
}

// =============================================================================
// ATTACK LOGGING
// =============================================================================

/**
 * Record an attack to log
 *
 * @param {string} sourceId - Source identifier
 * @param {Object} attack - Attack details
 */
function recordAttack(sourceId, attack) {
  const record = {
    id: crypto.randomBytes(8).toString('hex'),
    sourceId: hashSourceId(sourceId), // Privacy: hash the source
    ...attack,
  };

  // Increment counter
  const key = `count:${sourceId}`;
  const count = (attackCounters.get(key) || 0) + 1;
  attackCounters.set(key, count);
  record.attackCount = count;

  // Log to file
  try {
    ensureLogDir();
    const logPath = path.join(CONFIG.LOG_DIR, CONFIG.ATTACK_LOG);
    fs.appendFileSync(logPath, JSON.stringify(record) + '\n');
  } catch (e) {
    // Silent fail - logging is non-critical
  }

  return record;
}

/**
 * Hash source ID for privacy
 */
function hashSourceId(sourceId) {
  return crypto.createHash('sha256')
    .update(sourceId + ':cynic-shield')
    .digest('hex')
    .substring(0, 16);
}

/**
 * Log quarantine event
 */
function logQuarantine(record) {
  try {
    ensureLogDir();
    const logPath = path.join(CONFIG.LOG_DIR, 'quarantine.jsonl');
    fs.appendFileSync(logPath, JSON.stringify({
      ...record,
      sourceId: hashSourceId(record.sourceId),
    }) + '\n');
  } catch (e) {
    // Silent fail
  }
}

/**
 * Ensure log directory exists
 */
function ensureLogDir() {
  if (!fs.existsSync(CONFIG.LOG_DIR)) {
    fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
  }
}

// =============================================================================
// ANALYTICS
// =============================================================================

/**
 * Get attack statistics
 */
function getAttackStats() {
  const stats = {
    totalAttacks: 0,
    byCategory: {},
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    activeQuarantines: quarantined.size,
    throttledSources: 0,
  };

  // Count attacks from counters
  for (const [key, value] of attackCounters) {
    if (key.startsWith('count:')) {
      stats.totalAttacks += value;
    }
    if (key.startsWith('throttle:')) {
      stats.throttledSources++;
    }
  }

  // Read attack log for detailed stats
  try {
    const logPath = path.join(CONFIG.LOG_DIR, CONFIG.ATTACK_LOG);
    if (fs.existsSync(logPath)) {
      const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
      const recent = lines.slice(-100); // Last 100 attacks

      for (const line of recent) {
        try {
          const record = JSON.parse(line);
          stats.byCategory[record.category] = (stats.byCategory[record.category] || 0) + 1;
          stats.bySeverity[record.severity] = (stats.bySeverity[record.severity] || 0) + 1;
        } catch (e) { /* skip */ }
      }
    }
  } catch (e) { /* ignore */ }

  return stats;
}

/**
 * Get list of quarantined sources
 */
function getQuarantinedList() {
  const list = [];
  const now = Date.now();

  for (const [sourceId, record] of quarantined) {
    const expiresIn = record.expiresAt - now;
    if (expiresIn > 0) {
      list.push({
        sourceId: hashSourceId(sourceId),
        reason: record.reason,
        expiresIn,
        expiresAt: record.expiresAt,
      });
    }
  }

  return list;
}

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Cleanup expired entries
 */
function cleanup() {
  const now = Date.now();

  // Cleanup expired quarantines
  for (const [sourceId, record] of quarantined) {
    if (now > record.expiresAt) {
      quarantined.delete(sourceId);
    }
  }

  // Cleanup old throttles (1 hour expiry)
  for (const [key, record] of attackCounters) {
    if (key.startsWith('throttle:') && now - record.appliedAt > 60 * 60 * 1000) {
      attackCounters.delete(key);
    }
  }

  // Cleanup old strike records (48 hour expiry)
  for (const [sourceId, record] of strikeCounters) {
    if (now - record.lastStrike > CONFIG.STRIKE_DECAY_MS * 2) {
      strikeCounters.delete(sourceId);
    }
  }
}

// Run cleanup every φ minutes
setInterval(cleanup, PHI * 60 * 1000);

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main function
  handleSecurityEvent,

  // Quarantine
  checkQuarantine,
  quarantine,
  releaseQuarantine,
  getQuarantinedList,

  // Strikes
  addStrikes,
  getStrikes,
  clearStrikes,

  // Throttling
  applyThrottle,
  getThrottleMultiplier,

  // Analytics
  getAttackStats,
  recordAttack,

  // Utilities
  cleanup,
  hashSourceId,

  // Config (for reference)
  CONFIG,
  THREAT_LEVELS,
  ATTACK_SEVERITY,

  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
};
