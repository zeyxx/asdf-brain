/**
 * Privacy Handlers - brain_privacy_*, brain_ephemeral_*
 *
 * [D] Drash - Privacy protection
 *
 * Philosophy: "What you don't store, you can't leak."
 */

'use strict';

const privacy = require('../privacy');

async function handlePrivacySanitize(args, adapter) {
  const { data, strict = false } = args;

  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: 'Invalid data: must be an object',
      _quality: 20,
    };
  }

  const result = privacy.sanitize(data, { strict });

  if (result.rejected) {
    return {
      success: false,
      rejected: true,
      reason: result.reason,
      score: result.score,
      issues: result.issues,
      message: `Data rejected: privacy score ${result.score} is below threshold`,
      _quality: 40,
    };
  }

  return {
    success: true,
    sanitized: result.sanitized,
    score: result.score,
    improved: result.improved,
    improvement: result.improvement,
    issues_remaining: result.issues.length,
    message: result.improved
      ? `Privacy score improved by ${result.improvement} points (now ${result.score})`
      : `Privacy score: ${result.score}`,
    philosophy: 'What you don\'t store, you can\'t leak.',
    _quality: result.score >= 80 ? 90 : 70,
  };
}

async function handlePrivacyCheck(args, adapter) {
  const { data, min_score = 70 } = args;

  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: 'Invalid data: must be an object',
      _quality: 20,
    };
  }

  const result = privacy.isSafe(data, min_score);

  return {
    success: true,
    safe: result.safe,
    score: result.score,
    verdict: result.verdict,
    issues: result.issues,
    threshold: min_score,
    message: result.safe
      ? `Data is safe to store (score: ${result.score})`
      : `Data contains PII that should be hashed (score: ${result.score})`,
    _quality: result.safe ? 85 : 60,
  };
}

async function handlePrivacyDetectPII(args, adapter) {
  const { text } = args;

  if (!text || typeof text !== 'string') {
    return {
      success: false,
      error: 'Invalid text: must be a string',
      _quality: 20,
    };
  }

  const detected = privacy.detectPII(text);

  return {
    success: true,
    pii_found: detected.length > 0,
    count: detected.length,
    types: [...new Set(detected.map(d => d.type))],
    details: detected.map(d => ({
      type: d.type,
      level: d.level,
      confidence: d.confidence,
      position: d.index
    })),
    message: detected.length > 0
      ? `Found ${detected.length} PII patterns: ${[...new Set(detected.map(d => d.type))].join(', ')}`
      : 'No PII detected',
    _quality: 80,
  };
}

async function handlePrivacyHash(args, adapter) {
  const { value, mode = 'standard', purpose = 'default' } = args;

  if (value === undefined || value === null) {
    return {
      success: false,
      error: 'Value is required',
      _quality: 20,
    };
  }

  let hash;
  switch (mode) {
    case 'lookup':
      hash = privacy.hashForLookup(value, purpose);
      break;
    case 'fast':
      hash = privacy.fastHash(value);
      break;
    case 'standard':
    default:
      hash = privacy.hash(value, { purpose });
  }

  return {
    success: true,
    hash,
    mode,
    purpose,
    hash_type: privacy.hasher.getHashType(hash),
    message: `Value hashed using ${mode} mode`,
    _quality: 85,
  };
}

async function handleEphemeralStore(args, adapter) {
  const {
    key,
    value,
    ttl = 'default',
    session_id = null,
    sanitize: doSanitize = true
  } = args;

  if (!key) {
    return {
      success: false,
      error: 'Key is required',
      _quality: 20,
    };
  }

  const ttlMap = {
    short: privacy.TTL.SHORT,
    default: privacy.TTL.DEFAULT,
    long: privacy.TTL.LONG
  };
  const actualTtl = ttlMap[ttl] || privacy.TTL.DEFAULT;

  let dataToStore = value;
  let sanitizeResult = null;
  if (doSanitize && typeof value === 'object' && value !== null) {
    sanitizeResult = privacy.sanitize(value);
    dataToStore = sanitizeResult.sanitized || value;
  }

  const result = privacy.ephemeral.set(key, dataToStore, {
    ttl: actualTtl,
    sessionId: session_id
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      _quality: 30,
    };
  }

  return {
    success: true,
    key,
    expires: result.expires,
    ttl_seconds: Math.round(result.ttl / 1000),
    sanitized: doSanitize && sanitizeResult?.improved,
    message: `Data stored in ephemeral storage. Expires in ${Math.round(result.ttl / 1000)}s`,
    philosophy: 'Some things should not outlive the moment.',
    _quality: 85,
  };
}

async function handleEphemeralGet(args, adapter) {
  const { key, session_id = null, delete_after = false } = args;

  if (!key) {
    return {
      success: false,
      error: 'Key is required',
      _quality: 20,
    };
  }

  const options = { sessionId: session_id };
  const value = delete_after
    ? privacy.ephemeral.getOnce(key, options)
    : privacy.ephemeral.get(key, options);

  if (value === undefined) {
    return {
      success: false,
      found: false,
      message: 'Key not found or expired',
      _quality: 50,
    };
  }

  const ttl = privacy.ephemeral.store.ttl(key, options);

  return {
    success: true,
    found: true,
    value,
    ttl_remaining: ttl > 0 ? Math.round(ttl / 1000) : 0,
    deleted: delete_after,
    message: delete_after
      ? 'Data retrieved and deleted'
      : `Data retrieved. TTL: ${ttl > 0 ? Math.round(ttl / 1000) + 's' : 'expired'}`,
    _quality: 85,
  };
}

module.exports = {
  handlePrivacySanitize,
  handlePrivacyCheck,
  handlePrivacyDetectPII,
  handlePrivacyHash,
  handleEphemeralStore,
  handleEphemeralGet,
};
