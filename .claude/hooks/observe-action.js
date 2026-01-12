#!/usr/bin/env node

/**
 * CYNIC Observation Hook - PostToolUse
 *
 * "Le chien qui observe en silence"
 *
 * Captures every tool execution result for pattern detection.
 * NEVER blocks. NEVER fails loudly. Just observes.
 *
 * @event PostToolUse
 * @philosophy "Enable, don't automate" - observe but never interfere
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const OBSERVATIONS_DIR = path.join(__dirname, '../../knowledge/cynic/observations');
const OBSERVATIONS_FILE = path.join(OBSERVATIONS_DIR, 'actions.jsonl');

// Limit file size (φ³ MB ≈ 4.2 MB)
const MAX_FILE_SIZE = 4.236 * 1024 * 1024;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Extract file paths from action data
 */
function extractFiles(action) {
  const files = [];

  // From input parameters
  if (action.input) {
    if (action.input.file_path) files.push(action.input.file_path);
    if (action.input.path) files.push(action.input.path);
    if (action.input.paths) files.push(...(action.input.paths || []));
  }

  // Dedupe and limit
  return [...new Set(files)].slice(0, 5);
}

/**
 * Classify tool type
 */
function classifyTool(toolName) {
  const name = (toolName || '').toLowerCase();

  if (name.includes('read') || name.includes('glob') || name.includes('grep')) {
    return 'read';
  }
  if (name.includes('write') || name.includes('edit')) {
    return 'write';
  }
  if (name.includes('bash') || name.includes('shell')) {
    return 'execute';
  }
  if (name.includes('task') || name.includes('agent')) {
    return 'delegate';
  }
  return 'other';
}

/**
 * Ensure observations directory exists
 */
function ensureDir() {
  if (!fs.existsSync(OBSERVATIONS_DIR)) {
    fs.mkdirSync(OBSERVATIONS_DIR, { recursive: true });
  }
}

/**
 * Rotate file if too large
 */
function rotateIfNeeded() {
  try {
    if (fs.existsSync(OBSERVATIONS_FILE)) {
      const stats = fs.statSync(OBSERVATIONS_FILE);
      if (stats.size > MAX_FILE_SIZE) {
        // Archive old file
        const timestamp = Date.now();
        const archivePath = OBSERVATIONS_FILE.replace('.jsonl', `.${timestamp}.jsonl`);
        fs.renameSync(OBSERVATIONS_FILE, archivePath);
      }
    }
  } catch (e) {
    // Silent
  }
}

// =============================================================================
// MAIN
// =============================================================================

process.stdin.setEncoding('utf8');
let input = '';

process.stdin.on('data', chunk => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const action = JSON.parse(input);

    // Build minimal observation record
    const observation = {
      t: Date.now(),
      tool: action.tool_name || action.name || 'unknown',
      type: classifyTool(action.tool_name || action.name),
      ok: action.result?.success !== false && !action.result?.error,
      files: extractFiles(action),
    };

    // Add error indicator if failed
    if (action.result?.error) {
      observation.err = true;
    }

    // Ensure directory and rotate if needed
    ensureDir();
    rotateIfNeeded();

    // Append observation (fire and forget)
    fs.appendFileSync(OBSERVATIONS_FILE, JSON.stringify(observation) + '\n');
  } catch (e) {
    // Silent failure - NEVER block tool execution
  }

  // Always exit 0 - observation is non-critical
  process.exit(0);
});

// Handle edge cases
process.stdin.on('error', () => process.exit(0));
process.on('uncaughtException', () => process.exit(0));
