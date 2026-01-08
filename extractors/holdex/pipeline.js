#!/usr/bin/env node
/**
 * LLM Training Data Pipeline
 *
 * Master script that orchestrates all data exports
 * Output: training/processed/training-manifest.json
 *
 * Philosophy: "φ guides all ratios"
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PHI = 1.618033988749895;

const TRAINING_DIR = path.join(__dirname, '..');
const MANIFEST_FILE = path.join(TRAINING_DIR, 'processed', 'training-manifest.json');

async function runPipeline(options = {}) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('          $ASDFASDFA LLM TRAINING DATA PIPELINE');
  console.log('          "Friction is Training Data"');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    phi: PHI,
    exports: {},
    errors: [],
    duration_ms: 0
  };

  // Step 1: Git Decisions (always available, no DB needed)
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ STEP 1/5: Extracting Git Decision History                   │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  try {
    const { extractGitDecisions } = require('./extractGitDecisions.js');
    const gitResult = await extractGitDecisions();
    results.exports.git_decisions = {
      status: 'success',
      count: gitResult.total,
      file: 'raw/git-decisions.jsonl',
      stats: gitResult.stats
    };
  } catch (err) {
    console.error('⚠️  Git extraction failed:', err.message);
    results.exports.git_decisions = { status: 'failed', error: err.message };
    results.errors.push({ step: 'git_decisions', error: err.message });
  }

  // Step 2: Claude-Mem Observations (always available, local SQLite)
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ STEP 2/5: Exporting Claude-Mem Observations                 │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  try {
    const { exportClaudeMem } = require('./exportClaudeMem.js');
    const claudeMemResult = await exportClaudeMem();
    results.exports.claude_mem = {
      status: 'success',
      count: claudeMemResult.total || claudeMemResult.observations,
      file: 'raw/claude-mem-observations.jsonl',
      breakdown: claudeMemResult
    };
  } catch (err) {
    console.error('⚠️  Claude-mem export failed:', err.message);
    results.exports.claude_mem = { status: 'failed', error: err.message };
    results.errors.push({ step: 'claude_mem', error: err.message });
  }

  // Step 3: K-Score History (requires DB)
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ STEP 3/5: Exporting K-Score History                         │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  if (process.env.DATABASE_URL) {
    try {
      const { exportKScoreHistory } = require('./exportKScoreHistory.js');
      const kscoreCount = await exportKScoreHistory();
      results.exports.kscore_history = {
        status: 'success',
        count: kscoreCount,
        file: 'raw/kscore-history.jsonl'
      };
    } catch (err) {
      console.error('⚠️  K-Score export failed:', err.message);
      results.exports.kscore_history = { status: 'failed', error: err.message };
      results.errors.push({ step: 'kscore_history', error: err.message });
    }
  } else {
    console.log('⏭️  Skipping K-Score export (DATABASE_URL not set)');
    results.exports.kscore_history = { status: 'skipped', reason: 'no DATABASE_URL' };
  }

  // Step 4: Holder Snapshots (requires DB)
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ STEP 4/5: Exporting Holder Snapshots                        │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  if (process.env.DATABASE_URL) {
    try {
      const { exportHolderSnapshots } = require('./exportHolderSnapshots.js');
      const holderCount = await exportHolderSnapshots();
      results.exports.holder_snapshots = {
        status: 'success',
        count: holderCount,
        file: 'raw/holder-snapshots.jsonl'
      };
    } catch (err) {
      console.error('⚠️  Holder export failed:', err.message);
      results.exports.holder_snapshots = { status: 'failed', error: err.message };
      results.errors.push({ step: 'holder_snapshots', error: err.message });
    }
  } else {
    console.log('⏭️  Skipping Holder export (DATABASE_URL not set)');
    results.exports.holder_snapshots = { status: 'skipped', reason: 'no DATABASE_URL' };
  }

  // Step 5: Label Token Outcomes (requires DB)
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ STEP 5/5: Labeling Token Outcomes                           │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  if (process.env.DATABASE_URL) {
    try {
      const { labelTokenOutcomes } = require('./labelTokenOutcomes.js');
      const labelResult = await labelTokenOutcomes();
      results.exports.token_labels = {
        status: 'success',
        count: labelResult.total,
        file: 'labeled/token-outcomes.jsonl',
        distribution: labelResult.stats
      };
    } catch (err) {
      console.error('⚠️  Labeling failed:', err.message);
      results.exports.token_labels = { status: 'failed', error: err.message };
      results.errors.push({ step: 'token_labels', error: err.message });
    }
  } else {
    console.log('⏭️  Skipping labeling (DATABASE_URL not set)');
    results.exports.token_labels = { status: 'skipped', reason: 'no DATABASE_URL' };
  }

  // Calculate duration and save manifest
  results.duration_ms = Date.now() - startTime;
  results.duration_human = formatDuration(results.duration_ms);

  // Calculate file sizes
  results.files = {};
  const rawDir = path.join(TRAINING_DIR, 'raw');
  const labeledDir = path.join(TRAINING_DIR, 'labeled');

  if (fs.existsSync(rawDir)) {
    for (const file of fs.readdirSync(rawDir)) {
      const filePath = path.join(rawDir, file);
      const stats = fs.statSync(filePath);
      results.files[`raw/${file}`] = {
        size_bytes: stats.size,
        size_human: formatBytes(stats.size)
      };
    }
  }

  if (fs.existsSync(labeledDir)) {
    for (const file of fs.readdirSync(labeledDir)) {
      const filePath = path.join(labeledDir, file);
      const stats = fs.statSync(filePath);
      results.files[`labeled/${file}`] = {
        size_bytes: stats.size,
        size_human: formatBytes(stats.size)
      };
    }
  }

  // Save manifest
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(results, null, 2));

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                     PIPELINE COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📊 Export Summary:');
  for (const [name, data] of Object.entries(results.exports)) {
    const icon = data.status === 'success' ? '✅' : data.status === 'skipped' ? '⏭️' : '❌';
    const count = data.count ? ` (${data.count.toLocaleString()} records)` : '';
    console.log(`   ${icon} ${name}${count}`);
  }

  console.log('\n📁 Files Generated:');
  for (const [file, info] of Object.entries(results.files)) {
    console.log(`   • ${file}: ${info.size_human}`);
  }

  console.log(`\n⏱️  Duration: ${results.duration_human}`);
  console.log(`📋 Manifest: ${MANIFEST_FILE}`);

  if (results.errors.length > 0) {
    console.log(`\n⚠️  ${results.errors.length} error(s) occurred`);
  }

  return results;
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });

  runPipeline()
    .then(results => {
      process.exit(results.errors.length > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Pipeline failed:', err);
      process.exit(1);
    });
}

module.exports = { runPipeline };
