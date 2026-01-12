/**
 * CYNIC Error-to-Learning Pipeline
 *
 * "The wound is where the light enters" - Rumi
 *
 * World: BERIAH (Creation/Understanding)
 * Model: Sonnet (analytical depth)
 *
 * Purpose:
 * - Capture errors at all levels (runtime, validation, logic, integration)
 * - Analyze patterns in errors
 * - Convert errors into CYNIC training data
 * - Learn from mistakes to prevent recurrence
 * - Track error evolution and resolution
 *
 * Philosophy:
 * - Errors are teachers in disguise
 * - Every failure contains a lesson
 * - Self-improvement through failure analysis
 *
 * @module cynic/error-learning
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// PHI CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const PHI_INV_2 = 1 / (PHI * PHI);

// =============================================================================
// PATHS
// =============================================================================

const KNOWLEDGE_ROOT = path.join(__dirname, '../../knowledge');
const ERRORS_DIR = path.join(KNOWLEDGE_ROOT, 'cynic/errors');
const ERRORS_LOG_PATH = path.join(ERRORS_DIR, 'log.jsonl');
const PATTERNS_PATH = path.join(ERRORS_DIR, 'patterns.json');
const LESSONS_PATH = path.join(ERRORS_DIR, 'lessons.json');
const STATS_PATH = path.join(ERRORS_DIR, 'stats.json');

// Ensure directories exist
if (!fs.existsSync(ERRORS_DIR)) {
  fs.mkdirSync(ERRORS_DIR, { recursive: true });
}

// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================

const ERROR_TYPES = {
  RUNTIME: {
    severity: 'high',
    category: 'execution',
    learnable: true,
    description: 'Crashes, exceptions, unhandled rejections',
  },
  VALIDATION: {
    severity: 'medium',
    category: 'input',
    learnable: true,
    description: 'Input validation failures, schema mismatches',
  },
  LOGIC: {
    severity: 'high',
    category: 'code',
    learnable: true,
    description: 'Business logic errors, incorrect behavior',
  },
  INTEGRATION: {
    severity: 'medium',
    category: 'external',
    learnable: true,
    description: 'External service failures, API errors',
  },
  RESOURCE: {
    severity: 'high',
    category: 'system',
    learnable: false,
    description: 'Memory, timeout, quota exceeded',
  },
  SECURITY: {
    severity: 'critical',
    category: 'security',
    learnable: true,
    description: 'Auth failures, permission violations, attacks',
  },
  CONFIGURATION: {
    severity: 'medium',
    category: 'setup',
    learnable: true,
    description: 'Missing config, invalid settings',
  },
  DATA: {
    severity: 'medium',
    category: 'data',
    learnable: true,
    description: 'Corrupt data, missing fields, type mismatches',
  },
};

const SEVERITY_WEIGHTS = {
  critical: PHI * PHI,  // 2.618
  high: PHI,            // 1.618
  medium: 1.0,
  low: PHI_INV,         // 0.618
};

// =============================================================================
// ERROR CAPTURE
// =============================================================================

/**
 * Capture an error for learning
 */
function captureError(error, context = {}) {
  const errorData = {
    id: `err_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    timestamp: Date.now(),
    iso: new Date().toISOString(),

    // Error details
    message: error.message || String(error),
    name: error.name || 'Error',
    stack: error.stack || null,
    code: error.code || null,

    // Classification
    type: classifyError(error, context),
    severity: null, // Set after classification

    // Context
    context: {
      component: context.component || 'unknown',
      operation: context.operation || 'unknown',
      input: sanitizeInput(context.input),
      environment: process.env.NODE_ENV || 'development',
      ...context,
    },

    // Learning metadata
    learning: {
      analyzed: false,
      patternId: null,
      lessonExtracted: false,
      preventionRules: [],
    },
  };

  // Set severity from type
  errorData.severity = ERROR_TYPES[errorData.type]?.severity || 'medium';

  // Log the error
  logError(errorData);

  // Update stats
  updateStats(errorData);

  // Check for patterns
  checkForPatterns(errorData);

  return errorData;
}

/**
 * Classify error based on characteristics
 */
function classifyError(error, context = {}) {
  const message = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();
  const code = error.code;

  // Security errors
  if (message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('permission') ||
      message.includes('auth') ||
      code === 'EACCES') {
    return 'SECURITY';
  }

  // Resource errors
  if (message.includes('timeout') ||
      message.includes('memory') ||
      message.includes('quota') ||
      code === 'ETIMEDOUT' ||
      code === 'ENOMEM') {
    return 'RESOURCE';
  }

  // Integration errors
  if (message.includes('econnrefused') ||
      message.includes('network') ||
      message.includes('api') ||
      message.includes('fetch') ||
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND') {
    return 'INTEGRATION';
  }

  // Validation errors
  if (message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('schema') ||
      name.includes('validation')) {
    return 'VALIDATION';
  }

  // Configuration errors
  if (message.includes('config') ||
      message.includes('missing') ||
      message.includes('undefined') && message.includes('env') ||
      code === 'ENOENT' && context.component?.includes('config')) {
    return 'CONFIGURATION';
  }

  // Data errors
  if (message.includes('json') ||
      message.includes('parse') ||
      message.includes('type') ||
      message.includes('null') ||
      message.includes('undefined')) {
    return 'DATA';
  }

  // Logic errors (type errors, reference errors)
  if (name === 'typeerror' ||
      name === 'referenceerror' ||
      message.includes('cannot read') ||
      message.includes('is not a function')) {
    return 'LOGIC';
  }

  // Default to runtime
  return 'RUNTIME';
}

/**
 * Sanitize input for logging (remove sensitive data)
 */
function sanitizeInput(input) {
  if (!input) return null;

  const sanitized = JSON.parse(JSON.stringify(input));

  // Remove sensitive fields
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential', 'private'];
  function scrub(obj) {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(s => lowerKey.includes(s))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        scrub(obj[key]);
      }
    }
  }
  scrub(sanitized);

  return sanitized;
}

/**
 * Log error to JSONL file
 */
function logError(errorData) {
  fs.appendFileSync(ERRORS_LOG_PATH, JSON.stringify(errorData) + '\n');
}

// =============================================================================
// PATTERN DETECTION
// =============================================================================

/**
 * Load error patterns
 */
function loadPatterns() {
  try {
    if (fs.existsSync(PATTERNS_PATH)) {
      return JSON.parse(fs.readFileSync(PATTERNS_PATH, 'utf8'));
    }
  } catch (err) {
    // Ignore
  }
  return {
    patterns: [],
    _meta: { lastUpdated: null, totalPatterns: 0 },
  };
}

/**
 * Save patterns
 */
function savePatterns(patterns) {
  patterns._meta.lastUpdated = new Date().toISOString();
  patterns._meta.totalPatterns = patterns.patterns.length;
  fs.writeFileSync(PATTERNS_PATH, JSON.stringify(patterns, null, 2));
}

/**
 * Check if error matches known patterns
 * When called without errorData, returns all patterns
 */
function checkForPatterns(errorData) {
  const patterns = loadPatterns();

  // If no errorData, return all patterns
  if (!errorData) {
    return patterns.patterns;
  }

  let matchedPattern = null;

  for (const pattern of patterns.patterns) {
    if (matchesPattern(errorData, pattern)) {
      matchedPattern = pattern;
      pattern.occurrences++;
      pattern.lastSeen = errorData.iso;

      // Update error with pattern info
      errorData.learning.patternId = pattern.id;
      errorData.learning.analyzed = true;

      break;
    }
  }

  // If no pattern matched, might be a new pattern
  if (!matchedPattern) {
    const similar = findSimilarErrors(errorData);
    if (similar.length >= 2) {
      // Create new pattern
      const newPattern = createPattern(errorData, similar);
      patterns.patterns.push(newPattern);
      errorData.learning.patternId = newPattern.id;
    }
  }

  savePatterns(patterns);
  return matchedPattern;
}

/**
 * Check if error matches a pattern
 */
function matchesPattern(errorData, pattern) {
  // Match on type
  if (pattern.type && pattern.type !== errorData.type) return false;

  // Match on component
  if (pattern.component && pattern.component !== errorData.context.component) return false;

  // Match on message signature
  if (pattern.messageSignature) {
    const sig = createMessageSignature(errorData.message);
    if (sig !== pattern.messageSignature) return false;
  }

  return true;
}

/**
 * Create a signature from error message (normalize variable parts)
 */
function createMessageSignature(message) {
  return message
    .replace(/\d+/g, 'N')           // Numbers -> N
    .replace(/'[^']*'/g, "'X'")     // Quoted strings -> 'X'
    .replace(/"[^"]*"/g, '"X"')     // Double quoted -> "X"
    .replace(/\b[a-f0-9]{8,}\b/gi, 'HASH') // Hashes -> HASH
    .replace(/\/[^\s]+/g, '/PATH')  // Paths -> /PATH
    .toLowerCase()
    .substring(0, 100);
}

/**
 * Find similar recent errors
 */
function findSimilarErrors(errorData, limit = 10) {
  if (!fs.existsSync(ERRORS_LOG_PATH)) return [];

  const lines = fs.readFileSync(ERRORS_LOG_PATH, 'utf8')
    .split('\n')
    .filter(Boolean)
    .slice(-100); // Last 100 errors

  const signature = createMessageSignature(errorData.message);
  const similar = [];

  for (const line of lines) {
    try {
      const err = JSON.parse(line);
      if (err.id === errorData.id) continue;
      if (err.type !== errorData.type) continue;

      const errSig = createMessageSignature(err.message);
      if (errSig === signature) {
        similar.push(err);
        if (similar.length >= limit) break;
      }
    } catch {
      continue;
    }
  }

  return similar;
}

/**
 * Create a new error pattern
 */
function createPattern(errorData, similarErrors) {
  const pattern = {
    id: `pat_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    created: new Date().toISOString(),
    lastSeen: errorData.iso,
    type: errorData.type,
    component: errorData.context.component,
    messageSignature: createMessageSignature(errorData.message),
    occurrences: similarErrors.length + 1,
    severity: errorData.severity,
    examples: [errorData.message, ...similarErrors.slice(0, 2).map(e => e.message)],
    lesson: null,
    prevention: [],
    status: 'new',
  };

  console.log(`[ERROR-LEARNING] New pattern detected: ${pattern.id} (${pattern.occurrences} occurrences)`);

  return pattern;
}

// =============================================================================
// LESSON EXTRACTION
// =============================================================================

/**
 * Load lessons
 */
function loadLessons() {
  try {
    if (fs.existsSync(LESSONS_PATH)) {
      return JSON.parse(fs.readFileSync(LESSONS_PATH, 'utf8'));
    }
  } catch (err) {
    // Ignore
  }
  return {
    lessons: [],
    _meta: { lastUpdated: null, totalLessons: 0 },
  };
}

/**
 * Save lessons
 */
function saveLessons(lessons) {
  lessons._meta.lastUpdated = new Date().toISOString();
  lessons._meta.totalLessons = lessons.lessons.length;
  fs.writeFileSync(LESSONS_PATH, JSON.stringify(lessons, null, 2));
}

/**
 * Extract a lesson from an error pattern
 */
function extractLesson(patternId, lessonData) {
  const patterns = loadPatterns();
  const lessons = loadLessons();

  const pattern = patterns.patterns.find(p => p.id === patternId);
  if (!pattern) {
    throw new Error(`Pattern not found: ${patternId}`);
  }

  const lesson = {
    id: `les_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    created: new Date().toISOString(),
    patternId,
    errorType: pattern.type,
    component: pattern.component,

    // Lesson content
    title: lessonData.title || `Lesson from ${pattern.type} errors`,
    description: lessonData.description || '',
    rootCause: lessonData.rootCause || '',
    prevention: lessonData.prevention || [],
    fix: lessonData.fix || '',

    // CYNIC integration
    dimensions: lessonData.dimensions || ['INTEGRITY', 'LEARNING_RATE'],
    impact: lessonData.impact || 'medium',

    // Status
    applied: false,
    verified: false,
  };

  lessons.lessons.push(lesson);
  saveLessons(lessons);

  // Update pattern
  pattern.lesson = lesson.id;
  pattern.prevention = lesson.prevention;
  pattern.status = 'learned';
  savePatterns(patterns);

  console.log(`[ERROR-LEARNING] Lesson extracted: ${lesson.id} - ${lesson.title}`);

  return lesson;
}

/**
 * Convert lesson to CYNIC training data
 */
function lessonToCynicTraining(lessonId) {
  const lessons = loadLessons();
  const lesson = lessons.lessons.find(l => l.id === lessonId);

  if (!lesson) {
    throw new Error(`Lesson not found: ${lessonId}`);
  }

  return {
    type: 'error_lesson',
    item: {
      source: 'error-learning',
      lessonId: lesson.id,
      errorType: lesson.errorType,
      component: lesson.component,
      description: lesson.description,
      rootCause: lesson.rootCause,
      prevention: lesson.prevention,
    },
    expectedScores: {
      INTEGRITY: lesson.applied ? 80 : 50,
      LEARNING_RATE: 70,
      SELF_AWARENESS: 75,
    },
    verdict: 'TRANSFORM',
    feedback: {
      lesson: lesson.title,
      prevention: lesson.prevention,
    },
  };
}

// =============================================================================
// STATS
// =============================================================================

/**
 * Load stats
 */
function loadStats() {
  try {
    if (fs.existsSync(STATS_PATH)) {
      return JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
    }
  } catch (err) {
    // Ignore
  }
  return {
    totalErrors: 0,
    byType: {},
    bySeverity: {},
    byComponent: {},
    last24h: 0,
    last7d: 0,
    lastUpdated: null,
  };
}

/**
 * Save stats
 */
function saveStats(stats) {
  stats.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
}

/**
 * Update stats with new error
 */
function updateStats(errorData) {
  const stats = loadStats();

  stats.totalErrors++;

  // By type
  stats.byType[errorData.type] = (stats.byType[errorData.type] || 0) + 1;

  // By severity
  stats.bySeverity[errorData.severity] = (stats.bySeverity[errorData.severity] || 0) + 1;

  // By component
  const component = errorData.context.component;
  stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;

  saveStats(stats);
}

/**
 * Recalculate time-based stats
 */
function recalculateTimeStats() {
  if (!fs.existsSync(ERRORS_LOG_PATH)) return;

  const stats = loadStats();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const week = 7 * day;

  let last24h = 0;
  let last7d = 0;

  const lines = fs.readFileSync(ERRORS_LOG_PATH, 'utf8')
    .split('\n')
    .filter(Boolean);

  for (const line of lines) {
    try {
      const err = JSON.parse(line);
      const age = now - err.timestamp;
      if (age < day) last24h++;
      if (age < week) last7d++;
    } catch {
      continue;
    }
  }

  stats.last24h = last24h;
  stats.last7d = last7d;
  saveStats(stats);

  return stats;
}

// =============================================================================
// GLOBAL ERROR HANDLER
// =============================================================================

let originalUncaughtHandler = null;
let originalUnhandledHandler = null;

/**
 * Install global error handlers
 */
function installGlobalHandlers() {
  // Store original handlers
  originalUncaughtHandler = process.listeners('uncaughtException').slice();
  originalUnhandledHandler = process.listeners('unhandledRejection').slice();

  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    captureError(error, {
      component: 'global',
      operation: 'uncaughtException',
      fatal: true,
    });

    // Re-throw to allow original handlers
    console.error('[ERROR-LEARNING] Uncaught Exception captured:', error.message);
  });

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    captureError(error, {
      component: 'global',
      operation: 'unhandledRejection',
      fatal: false,
    });

    console.error('[ERROR-LEARNING] Unhandled Rejection captured:', error.message);
  });

  console.log('[ERROR-LEARNING] Global error handlers installed');
}

/**
 * Create error wrapper for functions
 */
function wrapWithErrorCapture(fn, context = {}) {
  return async function wrapped(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      captureError(error, {
        ...context,
        args: args.length > 0 ? args.map(a => typeof a) : [],
      });
      throw error; // Re-throw after capturing
    }
  };
}

// =============================================================================
// SUMMARY
// =============================================================================

/**
 * Get error learning summary
 */
function getSummary() {
  const stats = recalculateTimeStats();
  const patterns = loadPatterns();
  const lessons = loadLessons();

  return {
    timestamp: new Date().toISOString(),
    stats: {
      totalErrors: stats.totalErrors,
      last24h: stats.last24h,
      last7d: stats.last7d,
      byType: stats.byType,
      bySeverity: stats.bySeverity,
    },
    patterns: {
      total: patterns.patterns.length,
      new: patterns.patterns.filter(p => p.status === 'new').length,
      learned: patterns.patterns.filter(p => p.status === 'learned').length,
    },
    lessons: {
      total: lessons.lessons.length,
      applied: lessons.lessons.filter(l => l.applied).length,
      verified: lessons.lessons.filter(l => l.verified).length,
    },
    topComponents: Object.entries(stats.byComponent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([component, count]) => ({ component, count })),
    module: 'CYNIC-ERROR-LEARNING',
    world: 'BERIAH',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core capture
  captureError,
  classifyError,

  // Patterns
  loadPatterns,
  checkForPatterns,
  findSimilarErrors,

  // Lessons
  loadLessons,
  extractLesson,
  lessonToCynicTraining,

  // Stats
  loadStats,
  recalculateTimeStats,
  getSummary,

  // Global handlers
  installGlobalHandlers,
  wrapWithErrorCapture,

  // Constants
  ERROR_TYPES,
  SEVERITY_WEIGHTS,
  PHI,
  PHI_INV,

  // Metadata
  ERROR_LEARNING_MODULE: {
    name: 'CYNIC-ERROR-LEARNING',
    world: 'BERIAH',
    model: 'sonnet',
    purpose: 'Convert errors into learning',
    philosophy: 'The wound is where the light enters',
  },
};
