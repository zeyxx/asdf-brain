#!/usr/bin/env node
/**
 * Weekly Snapshot Automation
 *
 * "Knowledge preserved forever on-chain"
 *
 * This script is designed to run as a cron job or GitHub Action
 * to automatically publish weekly Merkle roots to Solana.
 *
 * Cron: 0 0 * * 0 (Every Sunday at midnight)
 *
 * Usage:
 *   node scripts/weekly-snapshot.js
 *   node scripts/weekly-snapshot.js --dry-run
 *   node scripts/weekly-snapshot.js --force
 */

const {
  SolanaPublisher,
  KnowledgeCollector,
  MerkleTree,
  getWeekNumber,
  CONFIG,
} = require('./publish-to-solana');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const SNAPSHOT_CONFIG = {
  // Minimum leaves required to publish (avoid empty snapshots)
  minLeaves: 1,

  // Days since last snapshot before warning
  maxDaysSinceSnapshot: 10,

  // Notification webhook (optional)
  webhookUrl: process.env.SNAPSHOT_WEBHOOK_URL,

  // Output paths
  outputDir: path.join(__dirname, '..', 'knowledge', 'provenance'),
  historyFile: path.join(__dirname, '..', 'knowledge', 'provenance', 'snapshot-history.json'),
};

// ============================================================================
// Notification
// ============================================================================

async function notify(message, type = 'info') {
  const emoji = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  }[type] || '📢';

  console.log(`${emoji} ${message}`);

  // Send to webhook if configured
  if (SNAPSHOT_CONFIG.webhookUrl) {
    try {
      await fetch(SNAPSHOT_CONFIG.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${emoji} asdf-brain: ${message}`,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Failed to send notification:', err.message);
    }
  }
}

// ============================================================================
// History Management
// ============================================================================

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_CONFIG.historyFile, 'utf8'));
  } catch {
    return {
      snapshots: [],
      stats: {
        totalPublished: 0,
        totalPatterns: 0,
        totalDecisions: 0,
        firstSnapshot: null,
        lastSnapshot: null,
      },
    };
  }
}

function saveHistory(history) {
  fs.writeFileSync(SNAPSHOT_CONFIG.historyFile, JSON.stringify(history, null, 2));
}

function addToHistory(history, snapshot, signature) {
  const entry = {
    weekNumber: snapshot.weekNumber,
    root: snapshot.root.toString('hex'),
    stats: snapshot.stats,
    signature,
    timestamp: new Date().toISOString(),
  };

  history.snapshots.push(entry);
  history.stats.totalPublished++;
  history.stats.totalPatterns += snapshot.stats.patternCount;
  history.stats.totalDecisions += snapshot.stats.decisionCount;
  history.stats.lastSnapshot = entry.timestamp;

  if (!history.stats.firstSnapshot) {
    history.stats.firstSnapshot = entry.timestamp;
  }

  return history;
}

// ============================================================================
// Pre-flight Checks
// ============================================================================

async function preflight(publisher, collector) {
  const checks = {
    wallet: false,
    balance: false,
    program: false,
    knowledge: false,
  };

  // Check wallet
  try {
    const balance = await publisher.getBalance();
    checks.wallet = true;
    checks.balance = balance > 10_000_000; // > 0.01 SOL
    if (!checks.balance) {
      await notify(`Low balance: ${(balance / 1e9).toFixed(4)} SOL`, 'warning');
    }
  } catch (err) {
    await notify(`Wallet error: ${err.message}`, 'error');
    return checks;
  }

  // Check program
  try {
    const config = await publisher.getConfig();
    checks.program = !!config;
    if (!checks.program) {
      await notify('Program not initialized', 'error');
    }
  } catch (err) {
    await notify(`Program error: ${err.message}`, 'error');
  }

  // Check knowledge
  try {
    const snapshot = await collector.generateSnapshot();
    checks.knowledge = snapshot.stats.totalLeaves >= SNAPSHOT_CONFIG.minLeaves;
    if (!checks.knowledge) {
      await notify(`Insufficient knowledge: ${snapshot.stats.totalLeaves} leaves`, 'warning');
    }
  } catch (err) {
    await notify(`Knowledge error: ${err.message}`, 'error');
  }

  return checks;
}

// ============================================================================
// Main Automation
// ============================================================================

async function runWeeklySnapshot(options = {}) {
  const { dryRun = false, force = false } = options;

  console.log('\n🗓️  Weekly Snapshot Automation');
  console.log('==============================');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log();

  const network = process.env.SOLANA_NETWORK || 'devnet';
  const publisher = new SolanaPublisher(network);
  const collector = new KnowledgeCollector();
  const history = loadHistory();

  // Pre-flight checks
  console.log('🔍 Running pre-flight checks...');
  const checks = await preflight(publisher, collector);

  const allPassed = Object.values(checks).every(v => v);
  console.log(`   Wallet: ${checks.wallet ? '✓' : '✗'}`);
  console.log(`   Balance: ${checks.balance ? '✓' : '✗'}`);
  console.log(`   Program: ${checks.program ? '✓' : '✗'}`);
  console.log(`   Knowledge: ${checks.knowledge ? '✓' : '✗'}`);
  console.log();

  if (!allPassed && !force) {
    await notify('Pre-flight checks failed. Use --force to override.', 'error');
    process.exit(1);
  }

  // Generate snapshot
  console.log('📊 Generating snapshot...');
  const snapshot = await collector.generateSnapshot();

  console.log(`   Week: ${snapshot.weekNumber}`);
  console.log(`   Patterns: ${snapshot.stats.patternCount}`);
  console.log(`   Decisions: ${snapshot.stats.decisionCount}`);
  console.log(`   Contributors: ${snapshot.stats.contributorCount}`);
  console.log(`   Root: ${snapshot.root.toString('hex').slice(0, 16)}...`);
  console.log();

  // Check if already published
  const existing = await publisher.getSnapshot(snapshot.weekNumber);
  if (existing && !force) {
    await notify(`Week ${snapshot.weekNumber} already published`, 'info');
    return;
  }

  // Dry run check
  if (dryRun) {
    console.log('🏃 DRY RUN - Would publish:');
    console.log(JSON.stringify({
      weekNumber: snapshot.weekNumber,
      root: snapshot.root.toString('hex'),
      stats: snapshot.stats,
    }, null, 2));
    return;
  }

  // Publish
  console.log('📤 Publishing to Solana...');
  try {
    const signature = await publisher.storeSnapshot(
      snapshot.root,
      snapshot.weekNumber,
      snapshot.stats
    );

    // Update history
    addToHistory(history, snapshot, signature);
    saveHistory(history);

    // Save individual snapshot
    const snapshotFile = path.join(
      SNAPSHOT_CONFIG.outputDir,
      `snapshot-${snapshot.weekNumber}.json`
    );
    fs.writeFileSync(snapshotFile, JSON.stringify({
      weekNumber: snapshot.weekNumber,
      root: snapshot.root.toString('hex'),
      stats: snapshot.stats,
      solana: {
        signature,
        network,
        timestamp: new Date().toISOString(),
      },
    }, null, 2));

    await notify(
      `Week ${snapshot.weekNumber} published! ` +
      `${snapshot.stats.patternCount}P/${snapshot.stats.decisionCount}D ` +
      `https://solscan.io/tx/${signature}?cluster=${network}`,
      'success'
    );

    console.log();
    console.log('✅ Success!');
    console.log(`   Signature: ${signature}`);
    console.log(`   Explorer: https://solscan.io/tx/${signature}?cluster=${network}`);

  } catch (err) {
    await notify(`Publish failed: ${err.message}`, 'error');
    process.exit(1);
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  };

  if (args.includes('--help')) {
    console.log(`
Weekly Snapshot Automation

Usage:
  node weekly-snapshot.js              Run weekly snapshot
  node weekly-snapshot.js --dry-run    Preview without publishing
  node weekly-snapshot.js --force      Override checks and republish

Environment:
  SOLANA_NETWORK         devnet or mainnet-beta
  SOLANA_KEYPAIR         Path to keypair
  SNAPSHOT_WEBHOOK_URL   Optional notification webhook

Cron Setup (run every Sunday):
  0 0 * * 0 cd /path/to/asdf-brain && node scripts/weekly-snapshot.js

GitHub Action:
  schedule:
    - cron: '0 0 * * 0'
`);
    return;
  }

  await runWeeklySnapshot(options);
}

main().catch(console.error);

module.exports = { runWeeklySnapshot };
