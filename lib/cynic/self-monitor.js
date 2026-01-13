/**
 * CYNIC Self-Monitor - Deep Health Introspection
 *
 * "φ qui se diagnostique."
 *
 * Provides comprehensive health checks for all CYNIC subsystems:
 * - Integration health (HolDex, GASdf, Claude-Mem)
 * - Knowledge freshness and integrity
 * - Self-judge performance
 * - Resource utilization
 * - Error patterns
 *
 * Works with pulse.js to register subsystem checks.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// PHI CONSTANTS
// =============================================================================

// φ constants - Import from Single Source of Truth (FIXED 2026-01-13)
const { PHI, PHI_INV, PHI_INV_2 } = require('./axioms/constants');

// Thresholds
const THRESHOLDS = {
  // Health levels (0-100 scale)
  HEALTHY: Math.round(PHI_INV * 100),      // 62 - green
  WARNING: Math.round(PHI_INV_2 * 100),    // 38 - yellow
  CRITICAL: Math.round(PHI_INV_2 * PHI_INV * 100), // 24 - red

  // Timing (ms)
  RESPONSE_GOOD: 100,
  RESPONSE_SLOW: 500,
  RESPONSE_TIMEOUT: 5000,

  // Freshness (hours)
  DATA_FRESH: 1,
  DATA_RECENT: 6,
  DATA_STALE: 24,

  // Error rates
  ERROR_RATE_OK: 0.01,      // 1%
  ERROR_RATE_WARN: 0.05,    // 5%
  ERROR_RATE_CRITICAL: 0.10, // 10%
};

// =============================================================================
// HEALTH CHECK RESULTS
// =============================================================================

/**
 * Create a health check result
 */
function healthResult(healthy, score, details = {}) {
  return {
    healthy,
    score: Math.max(0, Math.min(100, Math.round(score))),
    status: healthy ? 'healthy' : score >= THRESHOLDS.WARNING ? 'degraded' : 'critical',
    details,
    checkedAt: new Date().toISOString(),
  };
}

// =============================================================================
// INTEGRATION HEALTH CHECKS
// =============================================================================

/**
 * Check HolDex integration health
 */
async function checkHoldexHealth() {
  try {
    const holdex = require('../integration/holdex-connector');
    const status = holdex.getStatus();

    const checks = {
      hasEvents: status.stats?.total_events > 0,
      recentActivity: false,
      lowErrorRate: true,
      rateLimiterOk: true,
    };

    // Check for recent activity
    if (status.stats?.last_event_time) {
      const lastEventMs = new Date(status.stats.last_event_time).getTime();
      const ageHours = (Date.now() - lastEventMs) / 1000 / 60 / 60;
      checks.recentActivity = ageHours < THRESHOLDS.DATA_STALE;
    }

    // Check error rate
    if (status.stats?.total_events > 0) {
      const errorRate = (status.stats.error_count || 0) / status.stats.total_events;
      checks.lowErrorRate = errorRate < THRESHOLDS.ERROR_RATE_WARN;
    }

    // Check rate limiter (calculate available from limit - used)
    const rateLimit = status.rate_limit || {};
    const available = (rateLimit.limitMinute || 62) - (rateLimit.lastMinute || 0);
    checks.rateLimiterOk = available > 0;

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const score = (passedChecks / Object.keys(checks).length) * 100;

    return healthResult(
      passedChecks >= 3,
      score,
      {
        totalEvents: status.stats?.total_events || 0,
        lastEvent: status.stats?.last_event_time || status.stats?.last_event || null,
        errorCount: status.stats?.error_count || 0,
        rateLimiterAvailable: available,
        checks,
      }
    );
  } catch (error) {
    return healthResult(false, 0, { error: error.message });
  }
}

/**
 * Check GASdf integration health
 */
async function checkGasdfHealth() {
  try {
    const gasdf = require('../integration/gasdf-connector');
    const status = gasdf.getStatus();

    const checks = {
      hasEvents: status.stats?.total_events > 0,
      hasBurns: status.stats?.total_burned > 0,
      recentActivity: false,
      lowErrorRate: true,
    };

    // Check for recent activity (fallback to last_event if last_event_time missing)
    const lastEventTime = status.stats?.last_event_time || status.stats?.last_event;
    if (lastEventTime) {
      const lastEventMs = new Date(lastEventTime).getTime();
      const ageHours = (Date.now() - lastEventMs) / 1000 / 60 / 60;
      checks.recentActivity = ageHours < THRESHOLDS.DATA_STALE;
    }

    // Check error rate
    if (status.stats?.total_events > 0) {
      const errorRate = (status.stats.error_count || 0) / status.stats.total_events;
      checks.lowErrorRate = errorRate < THRESHOLDS.ERROR_RATE_WARN;
    }

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const score = (passedChecks / Object.keys(checks).length) * 100;

    return healthResult(
      passedChecks >= 2,
      score,
      {
        totalEvents: status.stats?.total_events || 0,
        totalBurned: status.stats?.total_burned || 0,
        lastEvent: status.stats?.last_event_time || status.stats?.last_event || null,
        errorCount: status.stats?.error_count || 0,
        checks,
      }
    );
  } catch (error) {
    return healthResult(false, 0, { error: error.message });
  }
}

/**
 * Check Claude-Mem sync health
 */
async function checkClaudeMemHealth() {
  try {
    const claudeMem = require('../integration/claude-mem-connector');
    const status = claudeMem.getStatus();

    const checks = {
      connected: status.connected,
      hasSynced: status.sync_state?.total_synced > 0,
      recentSync: false,
      dbAccessible: status.connected,
    };

    // Check for recent sync
    if (status.sync_state?.last_sync) {
      const lastSyncMs = new Date(status.sync_state.last_sync).getTime();
      const ageHours = (Date.now() - lastSyncMs) / 1000 / 60 / 60;
      checks.recentSync = ageHours < THRESHOLDS.DATA_STALE;
    }

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const score = (passedChecks / Object.keys(checks).length) * 100;

    return healthResult(
      checks.connected,
      score,
      {
        connected: status.connected,
        dbPath: status.db_path,
        totalSynced: status.sync_state?.total_synced || 0,
        lastSync: status.sync_state?.last_sync || null,
        checks,
      }
    );
  } catch (error) {
    return healthResult(false, 0, { error: error.message });
  }
}

/**
 * Check all integrations
 */
async function checkIntegrationsHealth() {
  const [holdex, gasdf, claudeMem] = await Promise.all([
    checkHoldexHealth(),
    checkGasdfHealth(),
    checkClaudeMemHealth(),
  ]);

  const integrations = { holdex, gasdf, claudeMem };
  const scores = [holdex.score, gasdf.score, claudeMem.score];
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const healthyCount = Object.values(integrations).filter(i => i.healthy).length;

  return healthResult(
    healthyCount >= 2,
    avgScore,
    {
      integrations,
      healthyCount,
      totalCount: 3,
      summary: `${healthyCount}/3 integrations healthy`,
    }
  );
}

// =============================================================================
// KNOWLEDGE HEALTH CHECKS
// =============================================================================

/**
 * Check knowledge directory health
 */
async function checkKnowledgeHealth() {
  const knowledgeDir = path.join(__dirname, '../../knowledge');

  try {
    const checks = {
      accessible: false,
      hasSubdirs: false,
      hasLiveData: false,
      dataFresh: false,
    };

    // Check accessibility
    await fs.promises.access(knowledgeDir, fs.constants.R_OK | fs.constants.W_OK);
    checks.accessible = true;

    // Check subdirectories
    const entries = await fs.promises.readdir(knowledgeDir, { withFileTypes: true });
    const subdirs = entries.filter(e => e.isDirectory());
    checks.hasSubdirs = subdirs.length >= 5;

    // Check live data
    const liveDir = path.join(knowledgeDir, 'live');
    try {
      const liveFiles = await fs.promises.readdir(liveDir);
      checks.hasLiveData = liveFiles.length > 0;

      // Check freshness
      let newestMs = 0;
      for (const file of liveFiles) {
        const stat = await fs.promises.stat(path.join(liveDir, file));
        if (stat.mtimeMs > newestMs) newestMs = stat.mtimeMs;
      }
      const ageHours = (Date.now() - newestMs) / 1000 / 60 / 60;
      checks.dataFresh = ageHours < THRESHOLDS.DATA_STALE;
    } catch {
      // live dir might not exist
    }

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const score = (passedChecks / Object.keys(checks).length) * 100;

    return healthResult(
      checks.accessible && checks.hasSubdirs,
      score,
      {
        path: knowledgeDir,
        subdirectories: subdirs.length,
        checks,
      }
    );
  } catch (error) {
    return healthResult(false, 0, { error: error.message, path: knowledgeDir });
  }
}

/**
 * Check learned knowledge health
 */
async function checkLearnedHealth() {
  const learnedDir = path.join(__dirname, '../../knowledge/learned');

  try {
    const liveFile = path.join(learnedDir, 'live.jsonl');

    const checks = {
      fileExists: false,
      hasEntries: false,
      recentEntry: false,
      validFormat: true,
    };

    // Check file exists
    try {
      await fs.promises.access(liveFile);
      checks.fileExists = true;

      // Read and check entries
      const content = await fs.promises.readFile(liveFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      checks.hasEntries = lines.length > 0;

      // Check recent entry
      if (lines.length > 0) {
        try {
          const lastEntry = JSON.parse(lines[lines.length - 1]);
          if (lastEntry.timestamp) {
            const entryMs = new Date(lastEntry.timestamp).getTime();
            const ageHours = (Date.now() - entryMs) / 1000 / 60 / 60;
            checks.recentEntry = ageHours < THRESHOLDS.DATA_STALE;
          }
        } catch {
          checks.validFormat = false;
        }
      }
    } catch {
      // File doesn't exist
    }

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const score = (passedChecks / Object.keys(checks).length) * 100;

    return healthResult(
      checks.fileExists,
      score,
      {
        path: liveFile,
        checks,
      }
    );
  } catch (error) {
    return healthResult(false, 0, { error: error.message });
  }
}

// =============================================================================
// SELF-JUDGE HEALTH CHECK
// =============================================================================

/**
 * Check self-judge health
 */
async function checkSelfJudgeHealth() {
  try {
    const { SelfJudge } = require('./self-judge');

    const checks = {
      moduleLoads: true,
      canInstantiate: false,
      hasAllDimensions: false,
      canJudge: false,
    };

    // Try to instantiate
    const judge = new SelfJudge();
    checks.canInstantiate = true;

    // Check dimensions
    const dimensionCount = Object.keys(judge.dimensions || {}).length;
    checks.hasAllDimensions = dimensionCount >= 3; // primary, secondary, meta

    // Try a simple judgment
    const startMs = Date.now();
    try {
      const result = await judge.judge({
        type: 'health_check',
        content: 'test',
        timestamp: new Date().toISOString(),
      }, { source: 'self-monitor' });

      checks.canJudge = result && typeof result.global === 'number';
    } catch {
      checks.canJudge = false;
    }
    const judgeMs = Date.now() - startMs;

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const score = (passedChecks / Object.keys(checks).length) * 100;

    return healthResult(
      checks.canInstantiate && checks.canJudge,
      score,
      {
        dimensionCount,
        judgeResponseMs: judgeMs,
        checks,
      }
    );
  } catch (error) {
    return healthResult(false, 0, { error: error.message });
  }
}

// =============================================================================
// RESOURCE HEALTH CHECKS
// =============================================================================

/**
 * Check system resources
 */
async function checkResourceHealth() {
  const mem = process.memoryUsage();
  const heapPercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);
  const rssMB = Math.round(mem.rss / 1024 / 1024);

  const checks = {
    heapOk: heapPercent < 85,
    rssOk: rssMB < 500, // Under 500MB
    uptimeOk: process.uptime() > 0,
    eventLoopOk: true,
  };

  // Event loop latency check
  const start = Date.now();
  await new Promise(resolve => setImmediate(resolve));
  const latency = Date.now() - start;
  checks.eventLoopOk = latency < 100;

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = (passedChecks / Object.keys(checks).length) * 100;

  return healthResult(
    passedChecks >= 3,
    score,
    {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      heapPercent,
      rssMB,
      uptimeSeconds: Math.round(process.uptime()),
      eventLoopLatencyMs: latency,
      checks,
    }
  );
}

// =============================================================================
// COMPREHENSIVE HEALTH CHECK
// =============================================================================

/**
 * Run all health checks and return comprehensive report
 */
async function runFullDiagnostic() {
  const startMs = Date.now();

  const [integrations, knowledge, learned, selfJudge, resources] = await Promise.all([
    checkIntegrationsHealth(),
    checkKnowledgeHealth(),
    checkLearnedHealth(),
    checkSelfJudgeHealth(),
    checkResourceHealth(),
  ]);

  const components = {
    integrations,
    knowledge,
    learned,
    selfJudge,
    resources,
  };

  // Calculate overall health (φ-weighted)
  const weights = {
    integrations: PHI,      // 1.618
    knowledge: PHI,         // 1.618
    learned: 1.0,           // 1.0
    selfJudge: PHI * PHI,   // 2.618 (most important)
    resources: 1.0,         // 1.0
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [name, result] of Object.entries(components)) {
    const weight = weights[name] || 1.0;
    weightedSum += result.score * weight;
    totalWeight += weight * 100; // Max score is 100
  }

  const overallScore = Math.round((weightedSum / totalWeight) * 100);
  const healthyCount = Object.values(components).filter(c => c.healthy).length;

  const diagnosticMs = Date.now() - startMs;

  return {
    healthy: healthyCount >= 4,
    overallScore,
    status: overallScore >= THRESHOLDS.HEALTHY ? 'healthy' :
            overallScore >= THRESHOLDS.WARNING ? 'degraded' :
            'critical',
    components,
    summary: {
      healthyComponents: healthyCount,
      totalComponents: Object.keys(components).length,
      overallScore,
      diagnosticMs,
    },
    diagnosticAt: new Date().toISOString(),
    thresholds: THRESHOLDS,
  };
}

/**
 * Quick health check (just essential components)
 */
async function runQuickCheck() {
  const startMs = Date.now();

  const [integrations, resources] = await Promise.all([
    checkIntegrationsHealth(),
    checkResourceHealth(),
  ]);

  const healthy = integrations.healthy && resources.healthy;
  const avgScore = Math.round((integrations.score + resources.score) / 2);

  return {
    healthy,
    score: avgScore,
    overallScore: avgScore, // Alias for dashboard compatibility
    status: healthy ? 'healthy' : avgScore >= THRESHOLDS.WARNING ? 'degraded' : 'critical',
    components: { integrations, resources }, // For dashboard component display
    integrations: integrations.healthy,
    resources: resources.healthy,
    checkMs: Date.now() - startMs,
    checkedAt: new Date().toISOString(),
  };
}

// =============================================================================
// PULSE INTEGRATION
// =============================================================================

/**
 * Register all health checks with pulse
 */
function registerWithPulse(pulse) {
  if (!pulse || !pulse.registerSubsystem) {
    console.warn('[SELF-MONITOR] Cannot register with pulse - invalid pulse module');
    return false;
  }

  // Register integration checks
  pulse.registerSubsystem('holdex', checkHoldexHealth);
  pulse.registerSubsystem('gasdf', checkGasdfHealth);
  pulse.registerSubsystem('claudeMem', checkClaudeMemHealth);

  // Register knowledge checks
  pulse.registerSubsystem('knowledge', checkKnowledgeHealth);

  // Register self-judge check
  pulse.registerSubsystem('selfJudge', checkSelfJudgeHealth);

  // Register resource check
  pulse.registerSubsystem('resources', checkResourceHealth);

  console.log('[SELF-MONITOR] Registered 6 subsystem checks with pulse');
  return true;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Individual checks
  checkHoldexHealth,
  checkGasdfHealth,
  checkClaudeMemHealth,
  checkIntegrationsHealth,
  checkKnowledgeHealth,
  checkLearnedHealth,
  checkSelfJudgeHealth,
  checkResourceHealth,

  // Comprehensive checks
  runFullDiagnostic,
  runQuickCheck,

  // Pulse integration
  registerWithPulse,

  // Constants
  THRESHOLDS,
  healthResult,
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== CYNIC Self-Monitor CLI ===\n');

  console.log('Running full diagnostic...\n');

  runFullDiagnostic().then(report => {
    console.log('=== DIAGNOSTIC REPORT ===\n');

    console.log(`Overall: ${report.status.toUpperCase()} (${report.overallScore}/100)`);
    console.log(`Healthy components: ${report.summary.healthyComponents}/${report.summary.totalComponents}`);
    console.log(`Diagnostic time: ${report.summary.diagnosticMs}ms\n`);

    console.log('--- Components ---');
    for (const [name, result] of Object.entries(report.components)) {
      const icon = result.healthy ? '✓' : '✗';
      console.log(`${icon} ${name}: ${result.status} (${result.score}/100)`);
      if (result.details.error) {
        console.log(`  Error: ${result.details.error}`);
      }
    }

    console.log('\n--- Thresholds ---');
    console.log(`  Healthy: >= ${THRESHOLDS.HEALTHY}`);
    console.log(`  Warning: >= ${THRESHOLDS.WARNING}`);
    console.log(`  Critical: < ${THRESHOLDS.WARNING}`);

    console.log('\nDone.');
  }).catch(console.error);
}
