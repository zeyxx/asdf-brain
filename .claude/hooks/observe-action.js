/**
 * CYNIC Observer Hook
 *
 * Silently observes tool usage to detect patterns and anomalies.
 * Never blocks - just collects data for pattern analysis.
 *
 * @event PostToolUse
 * @behavior non-blocking
 * @module cynic/hooks/observe-action
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Observation log path
const OBSERVATIONS_PATH = path.join(
  process.cwd(),
  'knowledge/cynic/observations/actions.jsonl'
);

// Pattern detection thresholds
const RAPID_REPEAT_THRESHOLD = 3;  // Same tool 3x in 30s
const RAPID_WINDOW_MS = 30000;

// In-memory buffer for pattern detection
const recentActions = [];

/**
 * Extract relevant info from tool result
 */
function extractToolInfo(toolName, toolInput, result) {
  const info = {
    tool: toolName,
    timestamp: Date.now(),
    success: !result?.error
  };

  // Tool-specific extraction
  switch (toolName) {
    case 'Bash':
      info.command = toolInput?.command?.split(' ')[0];
      info.hasError = result?.content?.includes('error') ||
                      result?.content?.includes('Error');
      break;

    case 'Read':
    case 'Write':
    case 'Edit':
      info.file = toolInput?.file_path?.split('/').pop();
      break;

    case 'Grep':
    case 'Glob':
      info.pattern = toolInput?.pattern?.substring(0, 50);
      break;

    default:
      break;
  }

  return info;
}

/**
 * Detect rapid repetition pattern
 */
function detectRapidRepeat(action) {
  const now = Date.now();

  // Clean old actions
  while (recentActions.length > 0 &&
         now - recentActions[0].timestamp > RAPID_WINDOW_MS) {
    recentActions.shift();
  }

  // Add current action
  recentActions.push(action);

  // Count same tool
  const sameToolCount = recentActions.filter(
    a => a.tool === action.tool
  ).length;

  if (sameToolCount >= RAPID_REPEAT_THRESHOLD) {
    return {
      pattern: 'rapid_repeat',
      tool: action.tool,
      count: sameToolCount,
      window: RAPID_WINDOW_MS / 1000
    };
  }

  return null;
}

/**
 * Detect failure pattern
 */
function detectFailurePattern(action) {
  if (!action.hasError && action.success) return null;

  const recentFailures = recentActions.filter(
    a => a.tool === action.tool && (!a.success || a.hasError)
  ).length;

  if (recentFailures >= 2) {
    return {
      pattern: 'repeated_failure',
      tool: action.tool,
      failures: recentFailures
    };
  }

  return null;
}

/**
 * Write observation to log
 */
function logObservation(observation) {
  try {
    const dir = path.dirname(OBSERVATIONS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.appendFileSync(
      OBSERVATIONS_PATH,
      JSON.stringify(observation) + '\n'
    );
  } catch (err) {
    // Silent fail - observer must never block
  }
}

/**
 * Main hook handler
 */
async function handler(context) {
  const { toolName, toolInput, result } = context;

  if (!toolName) {
    return { success: true, skipped: true };
  }

  const action = extractToolInfo(toolName, toolInput, result);

  // Detect patterns
  const patterns = [];
  const rapidRepeat = detectRapidRepeat(action);
  if (rapidRepeat) patterns.push(rapidRepeat);

  const failurePattern = detectFailurePattern(action);
  if (failurePattern) patterns.push(failurePattern);

  // Create observation
  const observation = {
    ...action,
    patterns: patterns.length > 0 ? patterns : undefined
  };

  // Log observation (non-blocking)
  logObservation(observation);

  return {
    success: true,
    observed: true,
    patterns: patterns.length > 0 ? patterns : undefined
  };
}

module.exports = { handler };
