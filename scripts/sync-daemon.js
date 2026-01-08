#!/usr/bin/env node
/**
 * sync-daemon.js - Background sync daemon
 *
 * Runs independently of Claude Code to ensure no knowledge is lost.
 * Follows $asdfasdfa: "Don't trust" - don't trust that hooks will fire.
 *
 * φ-timed intervals: sync every 13 seconds (Fibonacci)
 *
 * Usage:
 *   node sync-daemon.js           # Run once
 *   node sync-daemon.js --daemon  # Run continuously
 *   node sync-daemon.js --status  # Check status
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// =============================================================================
// CONFIGURATION
// =============================================================================

const BRAIN_ROOT = path.join(__dirname, '..');
const SYNC_SCRIPT = path.join(__dirname, 'auto-sync-claude-mem.js');
const PID_FILE = path.join(BRAIN_ROOT, '.sync-daemon.pid');
const LOG_FILE = path.join(BRAIN_ROOT, 'logs/sync-daemon.log');

// φ-inspired interval: 13 seconds (Fibonacci number)
const SYNC_INTERVAL_MS = 13 * 1000;

// =============================================================================
// HELPERS
// =============================================================================

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;

  // Ensure log directory exists
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFileSync(LOG_FILE, line);

  if (process.argv.includes('--verbose')) {
    process.stdout.write(line);
  }
}

function runSync() {
  try {
    const result = execSync(`node "${SYNC_SCRIPT}"`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (result.trim()) {
      log(`SYNC: ${result.trim()}`);
      return true;
    }
    return false;
  } catch (e) {
    log(`ERROR: ${e.message}`);
    return false;
  }
}

function writePid() {
  fs.writeFileSync(PID_FILE, process.pid.toString());
}

function readPid() {
  try {
    if (fs.existsSync(PID_FILE)) {
      return parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim());
    }
  } catch (e) { /* ignore */ }
  return null;
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

function showStatus() {
  const pid = readPid();

  if (pid && isProcessRunning(pid)) {
    console.log(`Daemon running (PID: ${pid})`);
    console.log(`Log file: ${LOG_FILE}`);
    console.log(`Sync interval: ${SYNC_INTERVAL_MS / 1000}s (φ-timed)`);

    // Show recent logs
    if (fs.existsSync(LOG_FILE)) {
      const logs = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').slice(-5);
      console.log('\nRecent activity:');
      logs.forEach(l => l && console.log(`  ${l}`));
    }
  } else {
    console.log('Daemon not running');
    if (pid) {
      fs.unlinkSync(PID_FILE);
    }
  }
}

function stopDaemon() {
  const pid = readPid();

  if (pid && isProcessRunning(pid)) {
    process.kill(pid, 'SIGTERM');
    fs.unlinkSync(PID_FILE);
    console.log(`Daemon stopped (PID: ${pid})`);
  } else {
    console.log('Daemon not running');
  }
}

function startDaemon() {
  const existingPid = readPid();

  if (existingPid && isProcessRunning(existingPid)) {
    console.log(`Daemon already running (PID: ${existingPid})`);
    return;
  }

  // Fork to background
  const child = spawn(process.argv[0], [__filename, '--daemon-child'], {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();
  console.log(`Daemon started (PID: ${child.pid})`);
  console.log(`Log file: ${LOG_FILE}`);
}

function runDaemonLoop() {
  writePid();
  log('Daemon started');

  // Initial sync
  runSync();

  // φ-timed sync loop
  const interval = setInterval(() => {
    runSync();
  }, SYNC_INTERVAL_MS);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('Daemon stopping (SIGTERM)');
    clearInterval(interval);
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
    process.exit(0);
  });

  process.on('SIGINT', () => {
    log('Daemon stopping (SIGINT)');
    clearInterval(interval);
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
    process.exit(0);
  });
}

// =============================================================================
// MAIN
// =============================================================================

const args = process.argv.slice(2);

if (args.includes('--status')) {
  showStatus();
} else if (args.includes('--stop')) {
  stopDaemon();
} else if (args.includes('--daemon')) {
  startDaemon();
} else if (args.includes('--daemon-child')) {
  runDaemonLoop();
} else {
  // Single run
  const synced = runSync();
  if (!synced) {
    console.log('No new observations to sync');
  }
}
