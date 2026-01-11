#!/usr/bin/env node
/**
 * brain-session-start.js - Auto-start brain context session
 *
 * This script runs at SessionStart to ensure CYNIC is ALIVE.
 * It starts a context session and outputs the session_id for Claude to use.
 *
 * Why this matters:
 * - brain_context_start exists but was NEVER called (0 sessions!)
 * - This fixes the "CYNIC has philosophy but isn't alive" problem
 * - Sessions enable: context injection, decision tracking, learning
 *
 * Security note: execSync is used with HARDCODED git commands only (no user input)
 *
 * Usage:
 *   node brain-session-start.js                    # Auto-detect everything
 *   node brain-session-start.js --project holdex  # Force project
 *   node brain-session-start.js --quiet           # Minimal output
 */

'use strict';

const path = require('path');
const { execSync } = require('child_process');
const { getContextLayer } = require('../lib/context-layer');

// =============================================================================
// PROJECT DETECTION (same logic as brain-awakening.js)
// =============================================================================

function detectProject(cwd) {
  const cwdLower = cwd.toLowerCase();

  if (cwdLower.includes('holdex')) return 'holdex';
  if (cwdLower.includes('gasdf')) return 'gasdf';
  if (cwdLower.includes('brain')) return 'brain';
  if (cwdLower.includes('manifesto')) return 'manifesto';
  if (cwdLower.includes('forecast')) return 'asdforecast';

  return 'ecosystem';
}

// =============================================================================
// OPERATOR DETECTION
// Security: HARDCODED git command - no user input - safe from injection
// =============================================================================

function detectOperator() {
  try {
    // HARDCODED command - safe from injection
    const username = execSync('git config user.name', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return username || 'anonymous';
  } catch (e) {
    return 'anonymous';
  }
}

// =============================================================================
// SESSION FILE PERSISTENCE
// =============================================================================

const fs = require('fs');
const SESSION_FILE = '/tmp/asdf-brain-session.json';

function persistSession(session) {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify({
      session_id: session.id,
      project: session.project,
      user_id: session.user_id,
      started_at: session.started_at,
    }, null, 2));
  } catch (e) {
    // Silent fail - tmp might not be writable
  }
}

function loadExistingSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
      // Check if session is still valid (less than 2 hours old)
      const startedAt = new Date(data.started_at);
      const now = new Date();
      const hoursOld = (now - startedAt) / (1000 * 60 * 60);
      if (hoursOld < 2) {
        return data;
      }
    }
  } catch (e) {
    // Silent fail
  }
  return null;
}

// =============================================================================
// MAIN
// =============================================================================

async function startBrainSession(options = {}) {
  const cwd = options.cwd || process.cwd();
  const project = options.project || detectProject(cwd);
  const operator = options.operator || detectOperator();
  const quiet = options.quiet || false;

  // Check for existing valid session
  const existing = loadExistingSession();
  if (existing && existing.project === project) {
    if (!quiet) {
      console.log(`🧠 BRAIN SESSION: Resuming ${existing.session_id.substring(0, 8)}...`);
      console.log(`   Project: ${existing.project.toUpperCase()}`);
      console.log(`   Started: ${existing.started_at}`);
    }
    return existing;
  }

  // Start new session
  const contextLayer = getContextLayer();
  const session = contextLayer.startSession({
    userId: operator,
    project: project,
    context: `SessionStart from ${cwd}`,
  });

  // Persist for later
  persistSession(session);

  if (!quiet) {
    console.log('');
    console.log('🧠 BRAIN SESSION STARTED');
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Project: ${session.project.toUpperCase()}`);
    console.log(`   Operator: ${session.user_id}`);
    console.log('');
    console.log('   Use brain_context_inject to enrich your queries');
    console.log('   Use brain_context_update to record decisions');
    console.log('');
  }

  return {
    session_id: session.id,
    project: session.project,
    user_id: session.user_id,
    started_at: session.started_at,
  };
}

// =============================================================================
// CLI ENTRY POINT
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    project: null,
    quiet: args.includes('--quiet') || args.includes('-q'),
    cwd: process.cwd(),
  };

  // Parse --project flag
  const projectIdx = args.indexOf('--project');
  if (projectIdx !== -1 && args[projectIdx + 1]) {
    options.project = args[projectIdx + 1];
  }

  startBrainSession(options)
    .then(result => {
      // Output JSON for programmatic use
      if (args.includes('--json')) {
        console.log(JSON.stringify(result));
      }
      process.exit(0);
    })
    .catch(err => {
      console.error(`❌ Brain session start failed: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { startBrainSession, detectProject, detectOperator };
