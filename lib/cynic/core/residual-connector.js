/**
 * CYNIC Residual Connector
 *
 * Bridges ResidualDetector with CYNICCore for proactive dimension discovery.
 * "φ qui découvre ce qu'il ne sait pas encore."
 *
 * Flow:
 * 1. After each judgment, analyze residuals
 * 2. Accumulate anomalies in buffer
 * 3. On pulse, attempt dimension discovery
 * 4. Emit events for new dimension proposals
 */

'use strict';

const { ResidualDetector, RESIDUAL_CONSTANTS } = require('../residual-detector');
const { registry } = require('../dimensions/base');
const pulse = require('../pulse');

// =============================================================================
// RESIDUAL CONNECTOR CLASS
// =============================================================================

class ResidualConnector {
  constructor(cynic, options = {}) {
    this.cynic = cynic;
    this.detector = new ResidualDetector(options);
    this.autoDiscover = options.autoDiscover ?? true;
    this.discoveryInterval = options.discoveryInterval ?? 5; // Check every N pulses

    this.stats = {
      judgmentsAnalyzed: 0,
      anomaliesDetected: 0,
      discoveryAttempts: 0,
      dimensionsProposed: 0,
      dimensionsAccepted: 0,
    };

    this.pulseCount = 0;
  }

  // ===========================================================================
  // CORE API
  // ===========================================================================

  /**
   * Analyze a judgment result for residuals
   * @param {Object} observation - The original observation
   * @param {Object} judgmentResult - The CYNIC judgment result
   * @returns {Object} Analysis result
   */
  analyzeJudgment(observation, judgmentResult) {
    this.stats.judgmentsAnalyzed++;

    const analysis = this.detector.analyze(observation, judgmentResult);

    if (analysis.isAnomaly) {
      this.stats.anomaliesDetected++;

      // Emit anomaly event on CYNICCore
      this.cynic.emit('residual:anomaly', {
        timestamp: Date.now(),
        residual: analysis.residual,
        observation: this._sanitizeObservation(observation),
        judgmentScore: judgmentResult.score,
        axiomGaps: analysis.axiomGaps,
        worldGaps: analysis.worldGaps,
      });
    }

    return analysis;
  }

  /**
   * Attempt to discover new dimensions from accumulated anomalies
   * @returns {Object} Discovery result
   */
  attemptDiscovery() {
    this.stats.discoveryAttempts++;

    const result = this.detector.discoverDimensions();

    if (result.discovered && result.proposals && result.proposals.length > 0) {
      for (const proposal of result.proposals) {
        this.stats.dimensionsProposed++;

        // Emit proposal event
        this.cynic.emit('residual:proposal', {
          timestamp: Date.now(),
          proposal: proposal,
          confidence: proposal.confidence,
          clusterSize: proposal.clusterSize,
          suggestedName: proposal.suggestedName,
          suggestedWorld: proposal.suggestedWorld,
          suggestedAxiom: proposal.suggestedAxiom,
        });
      }
    }

    return result;
  }

  /**
   * Accept a proposed dimension (human validation required)
   * @param {Object} proposal - The proposal to accept
   * @param {Object} config - Configuration for the new dimension
   * @returns {Object} Acceptance result
   */
  acceptProposal(proposal, config = {}) {
    const name = config.name || proposal.suggestedName;
    const world = config.world || proposal.suggestedWorld;
    const axiom = config.axiom || proposal.suggestedAxiom;
    const threshold = config.threshold || 50;

    // Check if dimension already exists
    const existing = registry.get(name);
    if (existing) {
      return {
        accepted: false,
        reason: `Dimension ${name} already exists`,
      };
    }

    this.stats.dimensionsAccepted++;

    // Emit acceptance event (dimension creation should be handled by user)
    this.cynic.emit('residual:accepted', {
      timestamp: Date.now(),
      name,
      world,
      axiom,
      threshold,
      proposal,
      note: 'Dimension template created. Implement evaluator manually.',
    });

    return {
      accepted: true,
      dimension: {
        name,
        category: 'DISCOVERED',
        world,
        axiom,
        threshold,
        question: proposal.suggestedQuestion || `Does it satisfy ${name}?`,
      },
      template: this._generateEvaluatorTemplate(name, world, axiom, threshold, proposal),
    };
  }

  // ===========================================================================
  // PULSE INTEGRATION
  // ===========================================================================

  /**
   * Register with pulse system for periodic discovery
   */
  registerWithPulse() {
    // Register subsystem
    pulse.registerSubsystem('cynic:residual', async () => {
      const bufferStats = this.detector.anomalyBuffer.getStats();

      return {
        healthy: true,
        details: {
          bufferSize: bufferStats.size,
          totalWeight: bufferStats.totalWeight,
          shouldCluster: bufferStats.shouldCluster,
          discoveredCount: this.detector.discoveredDimensions.length,
          stats: this.stats,
        }
      };
    });

    // Subscribe to pulse events
    pulse.on('pulse', (data) => {
      this.pulseCount++;

      // Attempt discovery every N pulses if autoDiscover is enabled
      if (this.autoDiscover && this.pulseCount % this.discoveryInterval === 0) {
        const result = this.attemptDiscovery();

        if (result.discovered) {
          console.log(`[Residual Connector] Discovered ${result.proposals?.length || 0} new dimension candidates`);
        }
      }
    });

    console.log('[Residual Connector] Registered with pulse system');
  }

  /**
   * Wire up automatic analysis after each judgment
   */
  wireJudgmentHook() {
    this.cynic.on('judgment:complete', (data) => {
      if (data.observation && data.result) {
        this.analyzeJudgment(data.observation, data.result);
      }
    });

    console.log('[Residual Connector] Wired judgment hook');
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  _sanitizeObservation(obs) {
    // Remove potentially sensitive data
    const sanitized = { ...obs };
    delete sanitized.wallet;
    delete sanitized.email;
    delete sanitized.ip;
    delete sanitized.privateKey;
    return sanitized;
  }

  _generateEvaluatorTemplate(name, world, axiom, threshold, proposal) {
    const className = name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');

    return `/**
 * ${name} Dimension Evaluator (DISCOVERED)
 *
 * World: ${world}
 * Axiom: ${axiom}
 * Category: DISCOVERED
 *
 * Discovered from residual analysis on ${new Date().toISOString()}
 * Cluster size: ${proposal.clusterSize}
 * Confidence: ${(proposal.confidence * 100).toFixed(1)}%
 *
 * Question: "${proposal.suggestedQuestion || `Does it satisfy ${name}?`}"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class ${className}Evaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: '${name}',
      category: 'DISCOVERED',
      world: '${world}',
      axiom: '${axiom}',
      threshold: ${threshold},
      question: '${proposal.suggestedQuestion || `Does it satisfy ${name}?`}',
    });
  }

  async evaluate(observation, context = {}) {
    // TODO: Implement evaluation logic based on cluster patterns
    // Patterns detected: ${JSON.stringify(proposal.patterns || []).slice(0, 100)}...

    let score = 50;
    const reasons = [];

    // Placeholder implementation
    if (observation.${name.toLowerCase()} === true) {
      score += 30;
      reasons.push('explicit marker');
    }

    return this.createResult(score, reasons.join(' | '), { reasons });
  }
}

module.exports = { ${className}Evaluator, evaluator: new ${className}Evaluator() };
`;
  }

  // ===========================================================================
  // STATUS
  // ===========================================================================

  getStatus() {
    const bufferStats = this.detector.anomalyBuffer.getStats();

    return {
      enabled: true,
      autoDiscover: this.autoDiscover,
      pulseCount: this.pulseCount,
      buffer: bufferStats,
      discovered: this.detector.discoveredDimensions,
      proposals: this.detector.proposalHistory.slice(-10),
      stats: this.stats,
    };
  }
}

// =============================================================================
// CONNECTOR FACTORY
// =============================================================================

/**
 * Connect ResidualDetector to CYNICCore
 * @param {CYNICCore} cynic
 * @param {Object} options
 */
function connect(cynic, options = {}) {
  console.log('[Residual Connector] Connecting to CYNICCore...');

  const connector = new ResidualConnector(cynic, options);

  // Register with pulse
  connector.registerWithPulse();

  // Wire judgment hook
  connector.wireJudgmentHook();

  return {
    connector,
    analyze: (obs, result) => connector.analyzeJudgment(obs, result),
    discover: () => connector.attemptDiscovery(),
    accept: (proposal, config) => connector.acceptProposal(proposal, config),
    getStatus: () => connector.getStatus(),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  ResidualConnector,
  connect,
};
