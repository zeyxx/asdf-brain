/**
 * CYNIC Dashboard Connector
 *
 * Bridges CYNICCore with the realtime/SSE infrastructure for live visualization.
 * "φ qui se montre en temps réel."
 *
 * Events emitted to SSE:
 * - cynic:wake, cynic:sleep, cynic:judging
 * - dimension:score (each dimension as it's evaluated)
 * - world:complete (when all dimensions in a world are done)
 * - judgment:complete (final result)
 * - coherence:update (cross-world coherence check)
 * - residual:anomaly, residual:proposal
 * - pulse:heartbeat
 */

'use strict';

const { eventBus, sseManager } = require('../realtime');
const { liveMatrix, getFullMatrix } = require('../matrices/live-matrix');

// =============================================================================
// DASHBOARD CONNECTOR CLASS
// =============================================================================

class DashboardConnector {
  constructor(cynic, options = {}) {
    this.cynic = cynic;
    this.broadcastMatrix = options.broadcastMatrix ?? true;
    this.broadcastDimensions = options.broadcastDimensions ?? true;
    this.broadcastCoherence = options.broadcastCoherence ?? true;

    this.stats = {
      eventsEmitted: 0,
      clientsServed: 0,
      matrixBroadcasts: 0,
    };
  }

  // ===========================================================================
  // CONNECT CYNIC EVENTS TO REALTIME
  // ===========================================================================

  /**
   * Wire all CYNICCore events to the realtime eventBus
   */
  connect() {
    console.log('[Dashboard Connector] Wiring CYNICCore to realtime...');

    // Activation events
    this._wireActivationEvents();

    // Dimension events (from live-matrix)
    this._wireDimensionEvents();

    // Judgment events
    this._wireJudgmentEvents();

    // Pulse events
    this._wirePulseEvents();

    // Residual events
    this._wireResidualEvents();

    console.log('[Dashboard Connector] Connected to realtime eventBus');

    return this;
  }

  _wireActivationEvents() {
    this.cynic.on('wake', (data) => {
      this._emit('cynic:wake', {
        state: 'AWAKE',
        source: data.source,
        timestamp: Date.now(),
      });
    });

    this.cynic.on('sleep', (data) => {
      this._emit('cynic:sleep', {
        state: 'SLEEP',
        reason: data.reason,
        timestamp: Date.now(),
      });
    });

    this.cynic.on('judging', (data) => {
      this._emit('cynic:judging', {
        state: 'JUDGING',
        judgmentId: data.judgmentId,
        timestamp: Date.now(),
      });
    });
  }

  _wireDimensionEvents() {
    if (!this.broadcastDimensions) return;

    // Subscribe to live matrix events
    liveMatrix.on('dimension:score', (data) => {
      this._emit('dimension:score', {
        dimension: data.dimension,
        category: data.category,
        world: data.world,
        axiom: data.axiom,
        score: data.score,
        threshold: data.threshold,
        passed: data.passed,
        timestamp: Date.now(),
      });
    });

    liveMatrix.on('world:complete', (data) => {
      this._emit('world:complete', {
        world: data.world,
        avgScore: data.avgScore,
        dimensions: data.dimensions,
        timestamp: Date.now(),
      });
    });

    liveMatrix.on('category:complete', (data) => {
      this._emit('category:complete', {
        category: data.category,
        avgScore: data.avgScore,
        dimensions: data.dimensions,
        timestamp: Date.now(),
      });
    });
  }

  _wireJudgmentEvents() {
    this.cynic.on('judgment:complete', (data) => {
      this._emit('judgment:complete', {
        judgmentId: data.judgmentId,
        verdict: data.result?.verdict,
        score: data.result?.score,
        confidence: data.result?.confidence,
        duration: data.duration,
        dimensionsEvaluated: data.dimensionsEvaluated,
        timestamp: Date.now(),
      });

      // Broadcast full matrix if enabled
      if (this.broadcastMatrix) {
        this._broadcastMatrix();
      }
    });
  }

  _wirePulseEvents() {
    this.cynic.on('pulse', (data) => {
      this._emit('pulse:heartbeat', {
        health: data.health,
        uptime: data.uptime,
        subsystems: data.subsystems,
        timestamp: Date.now(),
      });
    });

    this.cynic.on('health:change', (data) => {
      this._emit('health:change', {
        oldHealth: data.oldHealth,
        newHealth: data.newHealth,
        reason: data.reason,
        timestamp: Date.now(),
      });
    });

    this.cynic.on('subsystem:failure', (data) => {
      this._emit('subsystem:failure', {
        subsystem: data.subsystem,
        error: data.error,
        timestamp: Date.now(),
      });
    });
  }

  _wireResidualEvents() {
    this.cynic.on('residual:anomaly', (data) => {
      this._emit('residual:anomaly', {
        residual: data.residual,
        judgmentScore: data.judgmentScore,
        axiomGaps: data.axiomGaps,
        worldGaps: data.worldGaps,
        timestamp: Date.now(),
      });
    });

    this.cynic.on('residual:proposal', (data) => {
      this._emit('residual:proposal', {
        suggestedName: data.suggestedName,
        suggestedWorld: data.suggestedWorld,
        suggestedAxiom: data.suggestedAxiom,
        confidence: data.confidence,
        clusterSize: data.clusterSize,
        timestamp: Date.now(),
      });
    });
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  _emit(type, data) {
    this.stats.eventsEmitted++;
    // Use emitEvent() for proper event formatting and stats tracking
    eventBus.emitEvent(type, {
      source: 'cynic-core',
      ...data,
    });
  }

  _broadcastMatrix() {
    const matrix = getFullMatrix();
    this.stats.matrixBroadcasts++;

    this._emit('matrix:update', {
      dimensions: matrix.dimensions,
      byWorld: matrix.byWorld,
      byCategory: matrix.byCategory,
      summary: matrix.summary,
      timestamp: Date.now(),
    });
  }

  // ===========================================================================
  // COHERENCE BROADCAST
  // ===========================================================================

  /**
   * Broadcast coherence update
   * @param {Object} coherence - Result from checkCrossWorldCoherence
   */
  broadcastCoherence(coherence) {
    if (!this.broadcastCoherence) return;

    this._emit('coherence:update', {
      overallCoherent: coherence.overallCoherent,
      worlds: coherence.worlds,
      warnings: coherence.warnings,
      timestamp: Date.now(),
    });
  }

  // ===========================================================================
  // STATUS
  // ===========================================================================

  getStatus() {
    return {
      connected: true,
      broadcastMatrix: this.broadcastMatrix,
      broadcastDimensions: this.broadcastDimensions,
      sseClients: sseManager.getStats().clientCount,
      stats: this.stats,
    };
  }
}

// =============================================================================
// CONNECTOR FACTORY
// =============================================================================

/**
 * Connect CYNICCore to dashboard/realtime
 * @param {CYNICCore} cynic
 * @param {Object} options
 */
function connect(cynic, options = {}) {
  const connector = new DashboardConnector(cynic, options);
  return connector.connect();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  DashboardConnector,
  connect,
};
