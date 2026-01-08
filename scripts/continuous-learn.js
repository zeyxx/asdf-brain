#!/usr/bin/env node
/**
 * asdf-brain continuous learning daemon
 *
 * Watches Claude Code transcripts and auto-updates knowledge
 * Following $asdfasdfa: "Don't trust, verify" - verify from actual data, continuously
 *
 * Flow:
 * 1. Watch ~/.claude/projects/ for new transcripts
 * 2. Extract conversations
 * 3. Sanitize (remove secrets)
 * 4. Run all brain extractors
 * 5. Update knowledge files
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Source directories to watch
  transcriptDirs: [
    path.join(process.env.HOME, '.claude/projects'),
  ],

  // Output paths
  conversationsRaw: '/workspaces/HolDex/training/raw/conversations.jsonl',
  conversationsSafe: '/workspaces/HolDex/training/raw/conversations-safe.jsonl',

  // Scripts
  extractScript: '/workspaces/HolDex/training/scripts/extractConversations.js',
  sanitizeScript: '/workspaces/asdf-brain/scripts/sanitizer.js',
  brainScripts: [
    'extract-intent.js',
    'extract-patterns.js',
    'extract-errors.js',
    'track-evolution.js',
    'analyze-dependencies.js',
    'health-check.js',
    'extract-vision.js',
  ],

  // Timing
  debounceMs: 30000, // Wait 30s after last change before processing
  minIntervalMs: 300000, // Minimum 5 min between full updates
};

// =============================================================================
// STATE
// =============================================================================

let lastUpdateTime = 0;
let updateScheduled = false;
let updateTimeout = null;

// =============================================================================
// LOGGING
// =============================================================================

function log(emoji, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

// =============================================================================
// PIPELINE
// =============================================================================

function runScript(scriptPath, args = []) {
  log('⚙️', `Running ${path.basename(scriptPath)}...`);
  const result = spawnSync('node', [scriptPath, ...args], {
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    log('❌', `Failed: ${result.stderr?.slice(0, 200)}`);
    return false;
  }
  return true;
}

async function runFullPipeline() {
  const startTime = Date.now();
  log('🧠', '=== Starting brain update pipeline ===');

  // Step 1: Extract conversations from transcripts
  log('📥', 'Step 1/4: Extracting conversations from transcripts...');
  if (!runScript(CONFIG.extractScript)) {
    log('⚠️', 'Extraction failed, continuing with existing data');
  }

  // Step 2: Sanitize conversations
  log('🔒', 'Step 2/4: Sanitizing conversations...');
  if (fs.existsSync(CONFIG.conversationsRaw)) {
    runScript(CONFIG.sanitizeScript, [CONFIG.conversationsRaw]);
  }

  // Step 3: Run brain extractors
  log('🔬', 'Step 3/4: Running brain extractors...');
  const scriptsDir = path.join(__dirname);
  for (const script of CONFIG.brainScripts) {
    const scriptPath = path.join(scriptsDir, script);
    if (fs.existsSync(scriptPath)) {
      runScript(scriptPath);
    }
  }

  // Step 4: Update index
  log('📇', 'Step 4/4: Updating search index...');
  const indexerPath = path.join(scriptsDir, 'indexer.js');
  if (fs.existsSync(indexerPath)) {
    runScript(indexerPath);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log('✅', `=== Pipeline complete in ${duration}s ===`);

  lastUpdateTime = Date.now();
}

function scheduleUpdate() {
  if (updateScheduled) {
    // Reset the timer
    clearTimeout(updateTimeout);
  }

  const timeSinceLastUpdate = Date.now() - lastUpdateTime;
  if (timeSinceLastUpdate < CONFIG.minIntervalMs) {
    log('⏳', `Skipping update, last update was ${Math.round(timeSinceLastUpdate / 1000)}s ago`);
    return;
  }

  updateScheduled = true;
  updateTimeout = setTimeout(async () => {
    updateScheduled = false;
    await runFullPipeline();
  }, CONFIG.debounceMs);

  log('📅', `Update scheduled in ${CONFIG.debounceMs / 1000}s`);
}

// =============================================================================
// FILE WATCHER
// =============================================================================

function watchTranscripts() {
  log('👁️', 'Starting transcript watcher...');

  for (const dir of CONFIG.transcriptDirs) {
    if (!fs.existsSync(dir)) {
      log('⚠️', `Directory not found: ${dir}`);
      continue;
    }

    // Watch for changes in project directories
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.jsonl')) {
        log('📝', `Transcript change detected: ${filename}`);
        scheduleUpdate();
      }
    });

    log('✅', `Watching: ${dir}`);
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain continuous learning daemon');
  console.log("  $asdfasdfa: Don't trust, verify - continuously");
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check if running as daemon or one-shot
  const isOneShot = process.argv.includes('--once');

  if (isOneShot) {
    log('🎯', 'Running one-shot pipeline...');
    await runFullPipeline();
    process.exit(0);
  }

  // Run initial pipeline
  log('🚀', 'Running initial pipeline...');
  await runFullPipeline();

  // Start watching
  watchTranscripts();

  log('🟢', 'Daemon running. Press Ctrl+C to stop.');

  // Keep process alive
  process.on('SIGINT', () => {
    log('👋', 'Shutting down...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('👋', 'Shutting down...');
    process.exit(0);
  });
}

main().catch((err) => {
  log('💥', `Fatal error: ${err.message}`);
  process.exit(1);
});
