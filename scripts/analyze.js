#!/usr/bin/env node
/**
 * asdf-brain analyzer
 *
 * Compares dev vs prod repos to identify:
 * - Drift (dev ahead of prod)
 * - Divergence (different implementations)
 * - Missing patterns (prod has something dev doesn't)
 *
 * Following $asdfasdfa: Don't trust, verify.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

// =============================================================================
// φ CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;

// =============================================================================
// CONFIGURATION
// =============================================================================

const REPOS = {
  holdex: {
    dev: '/workspaces/HolDex',
    prod: '/workspaces/asdf-brain/repos-prod/holdex-prod',
    priority: PHI,  // High priority
  },
  // Future: asdev, forecast, etc.
};

const CRITICAL_FILES = [
  'src/tasks/kScoreUpdater.js',
  'src/routes/tokens.js',
  'src/services/database.js',
  'src/config/env.js',
  'package.json',
  'CLAUDE.md',
];

// =============================================================================
// SAFE EXEC HELPER
// =============================================================================

function safeGit(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf-8' });
  return result.stdout ? result.stdout.trim() : '';
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function getGitInfo(repoPath) {
  try {
    const head = safeGit(['rev-parse', '--short', 'HEAD'], repoPath);
    const branch = safeGit(['branch', '--show-current'], repoPath);
    const date = safeGit(['log', '-1', '--format=%ci'], repoPath);
    return { head, branch, date };
  } catch (e) {
    return { head: 'unknown', branch: 'unknown', date: 'unknown' };
  }
}

function compareFiles(devPath, prodPath) {
  const results = {
    identical: [],
    devOnly: [],
    prodOnly: [],
    different: [],
  };

  for (const file of CRITICAL_FILES) {
    const devFile = path.join(devPath, file);
    const prodFile = path.join(prodPath, file);

    const devHash = getFileHash(devFile);
    const prodHash = getFileHash(prodFile);

    if (devHash && prodHash) {
      if (devHash === prodHash) {
        results.identical.push({ file, hash: devHash });
      } else {
        results.different.push({ file, devHash, prodHash });
      }
    } else if (devHash && !prodHash) {
      results.devOnly.push({ file, hash: devHash });
    } else if (!devHash && prodHash) {
      results.prodOnly.push({ file, hash: prodHash });
    }
  }

  return results;
}

function analyzeDrift(devInfo, prodInfo) {
  const devDate = new Date(devInfo.date);
  const prodDate = new Date(prodInfo.date);
  const driftDays = (devDate - prodDate) / (1000 * 60 * 60 * 24);

  return {
    driftDays: Math.round(driftDays * 10) / 10,
    devAhead: driftDays > 0,
    needsSync: Math.abs(driftDays) > 1,
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain analyzer - Don\'t trust, verify');
  console.log('═══════════════════════════════════════════════════════════\n');

  const report = {
    timestamp: new Date().toISOString(),
    repos: {},
    summary: { synced: 0, drifted: 0, issues: [] },
  };

  for (const [name, config] of Object.entries(REPOS)) {
    console.log(`\n📦 Analyzing: ${name}`);
    console.log('─'.repeat(50));

    if (!fs.existsSync(config.dev) || !fs.existsSync(config.prod)) {
      console.log(`  ⚠️  Missing repo paths`);
      continue;
    }

    // Git info
    const devInfo = getGitInfo(config.dev);
    const prodInfo = getGitInfo(config.prod);

    console.log(`\n  DEV:  ${devInfo.head} @ ${devInfo.branch} (${devInfo.date.slice(0, 10)})`);
    console.log(`  PROD: ${prodInfo.head} @ ${prodInfo.branch} (${prodInfo.date.slice(0, 10)})`);

    // Drift analysis
    const drift = analyzeDrift(devInfo, prodInfo);
    console.log(`\n  📊 Drift: ${drift.driftDays} days ${drift.devAhead ? '(dev ahead)' : '(prod ahead)'}`);

    if (drift.needsSync) {
      console.log(`  ⚠️  SYNC RECOMMENDED`);
      report.summary.drifted++;
      report.summary.issues.push(`${name}: ${Math.abs(drift.driftDays)} days drift`);
    } else {
      report.summary.synced++;
    }

    // File comparison
    const fileComparison = compareFiles(config.dev, config.prod);

    console.log(`\n  📁 Critical Files:`);
    console.log(`     ✓ Identical: ${fileComparison.identical.length}`);
    console.log(`     ⚡ Different: ${fileComparison.different.length}`);
    console.log(`     📝 Dev only:  ${fileComparison.devOnly.length}`);
    console.log(`     🔒 Prod only: ${fileComparison.prodOnly.length}`);

    if (fileComparison.different.length > 0) {
      console.log(`\n  ⚡ Different files:`);
      for (const diff of fileComparison.different) {
        console.log(`     - ${diff.file}`);
        console.log(`       dev:  ${diff.devHash}`);
        console.log(`       prod: ${diff.prodHash}`);
      }
    }

    report.repos[name] = {
      dev: devInfo,
      prod: prodInfo,
      drift,
      files: fileComparison,
    };
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                      SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`  ✅ Synced repos:  ${report.summary.synced}`);
  console.log(`  ⚠️  Drifted repos: ${report.summary.drifted}`);

  if (report.summary.issues.length > 0) {
    console.log(`\n  Issues:`);
    for (const issue of report.summary.issues) {
      console.log(`    - ${issue}`);
    }
  }

  // Write report
  const reportPath = path.join(__dirname, '../index/analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  💾 Report saved: ${reportPath}`);

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
