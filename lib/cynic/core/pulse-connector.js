/**
 * CYNIC Pulse Connector
 *
 * Bridges the existing pulse.js with the new modular CYNICCore.
 * Registers dimension evaluators as subsystems for health monitoring.
 *
 * "φ qui se voit vivre, qui s'améliore en vivant."
 */

'use strict';

const { CYNICCore } = require('./index');
const pulse = require('../pulse');
const { registry } = require('../dimensions/base');
const { liveMatrix, getFullMatrix } = require('../matrices/live-matrix');

// =============================================================================
// SUBSYSTEM REGISTRATION
// =============================================================================

/**
 * Register all dimension evaluators as pulse subsystems
 */
function registerDimensionsAsSubsystems() {
  const dimensions = registry.getAll();

  for (const dim of dimensions) {
    pulse.registerSubsystem(`dim:${dim.name}`, async () => {
      // Test the dimension with a minimal observation
      try {
        const testObs = { _healthCheck: true, timestamp: Date.now() };
        const result = await dim.evaluate(testObs, {});

        return {
          healthy: result && typeof result.score === 'number',
          details: {
            name: dim.name,
            category: dim.category,
            world: dim.world,
            axiom: dim.axiom,
            lastScore: result?.score,
            threshold: dim.threshold,
          }
        };
      } catch (error) {
        return {
          healthy: false,
          details: {
            name: dim.name,
            error: error.message,
          }
        };
      }
    });
  }

  console.log(`[Pulse Connector] Registered ${dimensions.length} dimensions as subsystems`);
}

/**
 * Register CYNICCore as a subsystem
 * @param {CYNICCore} cynic
 */
function registerCoreAsSubsystem(cynic) {
  pulse.registerSubsystem('cynic:core', async () => {
    const status = cynic.getStatus();

    return {
      healthy: status.state !== 'ERROR',
      details: {
        state: status.state,
        uptime: status.uptime,
        judgmentCount: status.judgmentCount,
        dimensionsLoaded: status.registry?.total || 0,
      }
    };
  });

  pulse.registerSubsystem('cynic:activation', async () => {
    return {
      healthy: cynic.isActive() || true, // SLEEP is also healthy
      details: {
        isActive: cynic.isActive(),
        state: cynic.getStatus().state,
      }
    };
  });

  pulse.registerSubsystem('cynic:matrix', async () => {
    const matrix = getFullMatrix();

    return {
      healthy: matrix && matrix.scores,
      details: {
        dimensionCount: Object.keys(matrix?.scores || {}).length,
        worldsActive: Object.keys(matrix?.byWorld || {}).length,
        lastUpdate: matrix?.timestamp,
      }
    };
  });

  console.log('[Pulse Connector] Registered CYNICCore as subsystem');
}

// =============================================================================
// CROSS-WORLD COHERENCE
// =============================================================================

/**
 * Check coherence across the 4 Worlds
 * Each world should maintain internal consistency
 */
async function checkCrossWorldCoherence(cynic) {
  const matrix = getFullMatrix();
  if (!matrix || !matrix.byWorld) return null;

  const coherence = {
    timestamp: Date.now(),
    worlds: {},
    overallCoherent: true,
    warnings: [],
  };

  const PHI_INV = 0.618;

  for (const [world, worldData] of Object.entries(matrix.byWorld)) {
    // Extract scores from dimension entries
    const dimensions = worldData.dimensions || {};
    const values = Object.values(dimensions)
      .map(d => d.score)
      .filter(s => s !== null && typeof s === 'number');

    if (values.length === 0) {
      coherence.worlds[world] = {
        average: 0,
        stdDev: 0,
        coherence: 100,
        dimensions: 0,
        note: 'no evaluated dimensions',
      };
      continue;
    }

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Coherence = low variance within world
    const coherenceScore = Math.max(0, 100 - (stdDev * 2));

    coherence.worlds[world] = {
      average: avg,
      stdDev: stdDev,
      coherence: coherenceScore,
      dimensions: values.length,
    };

    // Warning if coherence is below φ⁻¹ threshold
    if (coherenceScore < PHI_INV * 100) {
      coherence.warnings.push(`${world}: low coherence (${coherenceScore.toFixed(1)}%)`);
      coherence.overallCoherent = false;
    }
  }

  return coherence;
}

// Register coherence check as subsystem
function registerCoherenceCheck(cynic) {
  pulse.registerSubsystem('cynic:coherence', async () => {
    const coherence = await checkCrossWorldCoherence(cynic);

    return {
      healthy: coherence?.overallCoherent ?? true,
      details: coherence,
    };
  });

  console.log('[Pulse Connector] Registered cross-world coherence check');
}

// =============================================================================
// PULSE EVENT FORWARDING
// =============================================================================

/**
 * Forward pulse events to CYNICCore
 * @param {CYNICCore} cynic
 */
function forwardPulseEvents(cynic) {
  // Forward pulse events using pulse's event API
  pulse.on('pulse', (data) => {
    cynic.emit('pulse', data);
  });

  pulse.on('anomaly', (data) => {
    cynic.emit('anomaly', data);
  });

  pulse.on('health:change', (data) => {
    cynic.emit('health:change', data);
  });

  pulse.on('subsystem:failure', (data) => {
    cynic.emit('subsystem:failure', data);
  });

  console.log('[Pulse Connector] Forwarding pulse events to CYNICCore');
}

// =============================================================================
// MAIN CONNECTOR
// =============================================================================

/**
 * Connect pulse system to CYNICCore
 * @param {CYNICCore} cynic
 * @param {Object} options
 */
function connect(cynic, options = {}) {
  console.log('[Pulse Connector] Connecting pulse to CYNICCore...');

  // Register subsystems
  registerCoreAsSubsystem(cynic);
  registerDimensionsAsSubsystems();
  registerCoherenceCheck(cynic);

  // Forward events
  forwardPulseEvents(cynic);

  // Auto-start if requested
  if (options.autoStart) {
    pulse.start();
    console.log('[Pulse Connector] Pulse daemon started (interval: 61.8s)');
  }

  return {
    start: () => pulse.start(),
    stop: () => pulse.stop(),
    getStatus: () => pulse.getStatus(),
    checkCoherence: () => checkCrossWorldCoherence(cynic),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  connect,
  registerDimensionsAsSubsystems,
  registerCoreAsSubsystem,
  registerCoherenceCheck,
  checkCrossWorldCoherence,
  forwardPulseEvents,
};
