#!/usr/bin/env node
/**
 * asdf-brain health check
 *
 * Aggregates ecosystem health metrics from all dimensions
 * Following $asdfasdfa: "Don't trust, verify" - health from actual data
 *
 * Health indicators:
 * - Code quality (errors, patterns)
 * - Philosophy alignment
 * - Dependency health
 * - Activity momentum
 * - Dev/prod sync
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// =============================================================================
// CONFIGURATION
// =============================================================================

const PHI = 1.618033988749895;
const KNOWLEDGE_DIR = path.join(__dirname, '../knowledge');

// Health thresholds
const THRESHOLDS = {
  error_rate: { good: 20, warning: 30, critical: 50 }, // % conversations with errors
  pattern_coverage: { good: 70, warning: 50, critical: 30 }, // % with patterns
  philosophy_alignment: { good: 90, warning: 70, critical: 50 }, // alignment score
  version_mismatches: { good: 3, warning: 7, critical: 15 }, // count
  dev_prod_drift_days: { good: 2, warning: 7, critical: 14 }, // days behind
};

// =============================================================================
// HEALTH FUNCTIONS
// =============================================================================

function loadJsonSafe(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

function checkDevProdDrift() {
  const devPath = '/workspaces/HolDex';
  const prodPath = '/workspaces/asdf-brain/repos-prod/sollama58/HolDex';

  if (!fs.existsSync(devPath) || !fs.existsSync(prodPath)) {
    return { status: 'unknown', drift_days: null };
  }

  // Get latest commit dates
  const devResult = spawnSync('git', ['log', '-1', '--format=%aI'], {
    cwd: devPath,
    encoding: 'utf-8',
  });
  const prodResult = spawnSync('git', ['log', '-1', '--format=%aI'], {
    cwd: prodPath,
    encoding: 'utf-8',
  });

  if (devResult.status !== 0 || prodResult.status !== 0) {
    return { status: 'unknown', drift_days: null };
  }

  const devDate = new Date(devResult.stdout.trim());
  const prodDate = new Date(prodResult.stdout.trim());
  const driftMs = devDate - prodDate;
  const driftDays = Math.round(driftMs / (1000 * 60 * 60 * 24));

  let status = 'good';
  if (driftDays > THRESHOLDS.dev_prod_drift_days.critical) status = 'critical';
  else if (driftDays > THRESHOLDS.dev_prod_drift_days.warning) status = 'warning';

  return { status, drift_days: driftDays };
}

function calculateHealthScore(metrics) {
  // φ-weighted health score
  const weights = {
    philosophy_alignment: PHI * PHI, // Most important
    error_rate: PHI,
    pattern_coverage: 1.0,
    version_health: 1.0 / PHI,
    dev_prod_sync: 1.0 / PHI,
  };

  let totalScore = 0;
  let totalWeight = 0;

  for (const [metric, value] of Object.entries(metrics)) {
    if (value === null || value === undefined) continue;

    const weight = weights[metric] || 1.0;
    totalScore += value * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

function getStatusEmoji(status) {
  return status === 'good' ? '✅' : status === 'warning' ? '⚠️' : status === 'critical' ? '🔴' : '❓';
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain health check');
  console.log('  Aggregating ecosystem health metrics');
  console.log('═══════════════════════════════════════════════════════════\n');

  const health = {
    timestamp: new Date().toISOString(),
    philosophy: "$asdfasdfa: Health from actual data",
    indicators: {},
    scores: {},
    overall: null,
  };

  // 1. Error rate from post-mortems
  console.log('📊 Checking error rate...');
  const errors = loadJsonSafe(path.join(KNOWLEDGE_DIR, 'errors/post-mortems.json'));
  if (errors?.statistics) {
    const errorRate = parseFloat(errors.statistics.error_rate);
    let status = 'good';
    if (errorRate > THRESHOLDS.error_rate.critical) status = 'critical';
    else if (errorRate > THRESHOLDS.error_rate.warning) status = 'warning';

    health.indicators.error_rate = {
      value: errorRate,
      unit: '%',
      status,
      details: `${errors.statistics.with_errors}/${errors.statistics.total_conversations} conversations`,
    };
    health.scores.error_rate = 100 - errorRate; // Invert: lower error = higher score
    console.log(`   ${getStatusEmoji(status)} Error rate: ${errorRate}%`);
  }

  // 2. Pattern coverage
  console.log('📊 Checking pattern coverage...');
  const patterns = loadJsonSafe(path.join(KNOWLEDGE_DIR, 'patterns/extracted-patterns.json'));
  if (patterns?.statistics) {
    const coverage = parseFloat(patterns.statistics.pattern_rate);
    let status = 'good';
    if (coverage < THRESHOLDS.pattern_coverage.critical) status = 'critical';
    else if (coverage < THRESHOLDS.pattern_coverage.warning) status = 'warning';

    health.indicators.pattern_coverage = {
      value: coverage,
      unit: '%',
      status,
      details: `${patterns.statistics.with_patterns}/${patterns.statistics.total_conversations} conversations`,
    };
    health.scores.pattern_coverage = coverage;
    console.log(`   ${getStatusEmoji(status)} Pattern coverage: ${coverage}%`);
  }

  // 3. Philosophy alignment
  console.log('📊 Checking philosophy alignment...');
  const philosophy = loadJsonSafe(path.join(KNOWLEDGE_DIR, 'philosophy/manifesto-mapping.json'));
  if (philosophy?.alignment_score !== undefined) {
    const alignment = philosophy.alignment_score;
    let status = 'good';
    if (alignment < THRESHOLDS.philosophy_alignment.critical) status = 'critical';
    else if (alignment < THRESHOLDS.philosophy_alignment.warning) status = 'warning';

    health.indicators.philosophy_alignment = {
      value: alignment,
      unit: '/100',
      status,
      details: `${philosophy.summary.implemented}/${philosophy.summary.total_principles} principles`,
    };
    health.scores.philosophy_alignment = alignment;
    console.log(`   ${getStatusEmoji(status)} Philosophy alignment: ${alignment}/100`);
  }

  // 4. Dependency health
  console.log('📊 Checking dependency health...');
  const deps = loadJsonSafe(path.join(KNOWLEDGE_DIR, 'dependencies/dependency-graph.json'));
  if (deps?.statistics) {
    const mismatches = deps.statistics.mismatches;
    let status = 'good';
    if (mismatches > THRESHOLDS.version_mismatches.critical) status = 'critical';
    else if (mismatches > THRESHOLDS.version_mismatches.warning) status = 'warning';

    health.indicators.version_mismatches = {
      value: mismatches,
      unit: 'mismatches',
      status,
      details: `${deps.statistics.shared_deps} shared dependencies`,
    };
    // Score: 100 if 0 mismatches, decreasing
    health.scores.version_health = Math.max(0, 100 - mismatches * 10);
    console.log(`   ${getStatusEmoji(status)} Version mismatches: ${mismatches}`);
  }

  // 5. Dev/prod drift
  console.log('📊 Checking dev/prod drift...');
  const drift = checkDevProdDrift();
  if (drift.drift_days !== null) {
    health.indicators.dev_prod_drift = {
      value: drift.drift_days,
      unit: 'days',
      status: drift.status,
      details: 'HolDex dev vs sollama58 prod',
    };
    // Score: 100 if 0 days, decreasing
    health.scores.dev_prod_sync = Math.max(0, 100 - drift.drift_days * 5);
    console.log(`   ${getStatusEmoji(drift.status)} Dev/prod drift: ${drift.drift_days} days`);
  }

  // Calculate overall health
  health.overall = {
    score: calculateHealthScore(health.scores),
    status: 'unknown',
  };

  if (health.overall.score >= 80) health.overall.status = 'healthy';
  else if (health.overall.score >= 60) health.overall.status = 'warning';
  else health.overall.status = 'critical';

  // Generate recommendations
  health.recommendations = [];
  if (health.indicators.version_mismatches?.status !== 'good') {
    health.recommendations.push({
      priority: 'high',
      action: 'Sync dependency versions between HolDex and GASdf',
      impact: 'Reduces potential compatibility issues',
    });
  }
  if (health.indicators.dev_prod_drift?.status !== 'good') {
    health.recommendations.push({
      priority: 'medium',
      action: 'Deploy latest dev changes to production',
      impact: 'Keeps prod up to date with bug fixes',
    });
  }
  if (health.indicators.error_rate?.status !== 'good') {
    health.recommendations.push({
      priority: 'high',
      action: 'Review post-mortems and fix recurring errors',
      impact: 'Improves code quality and stability',
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                      HEALTH REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  const statusEmoji =
    health.overall.status === 'healthy' ? '💚' : health.overall.status === 'warning' ? '💛' : '❤️';
  console.log(`${statusEmoji} Overall Health: ${health.overall.score}/100 (${health.overall.status})`);

  if (health.recommendations.length > 0) {
    console.log('\n📋 Recommendations:');
    for (const rec of health.recommendations) {
      console.log(`   [${rec.priority}] ${rec.action}`);
    }
  }

  // Write output
  const outputPath = path.join(KNOWLEDGE_DIR, 'health/ecosystem-health.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(health, null, 2));

  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
