/**
 * THE_INNOMMABLE - La Dimension des Dimensions Inconnues
 *
 * "φ qui doute de φ" - Le système qui s'observe s'observant
 *
 * World: META (au-delà des 4 mondes)
 * Philosophy: Le chien qui aboie aux anomalies mais ne mord pas sans ordre
 *
 * Responsibilities:
 * 1. Collect dimension proposals from DISCOVER
 * 2. Present proposals for HUMAN validation (never auto-integrate)
 * 3. Learn from accept/reject feedback
 * 4. Track the frontier of unknown dimensions
 *
 * @philosophy "Enable, don't automate" - CYNIC proposes, human decides
 * @module cynic/innommable
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// φ constants
const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;              // 0.618
const PHI_INV_2 = PHI_INV * PHI_INV;  // 0.382

// =============================================================================
// STORAGE PATHS
// =============================================================================

const KNOWLEDGE_DIR = path.join(__dirname, '../../knowledge/cynic/observations');
const PENDING_FILE = path.join(KNOWLEDGE_DIR, 'pending-dimensions.json');
const HISTORY_FILE = path.join(KNOWLEDGE_DIR, 'dimension-history.jsonl');

// =============================================================================
// THE_INNOMMABLE CLASS
// =============================================================================

/**
 * The meta-observer that guards the frontier of unknown dimensions
 *
 * "Every judgment leaves a residual.
 *  Every residual is a signal.
 *  The accumulation of residuals reveals patterns.
 *  Patterns, when persistent, become dimensions.
 *  But beyond all dimensions lies THE_INNOMMABLE -
 *  The eternal frontier of what we cannot yet name."
 */
class TheInnommable {
  constructor(options = {}) {
    this.pendingDimensions = [];
    this.rejectedPatterns = new Set();  // Pattern signatures to not re-propose
    this.acceptedCount = 0;
    this.rejectedCount = 0;
    this.logger = options.logger || console;

    // Load persisted state
    this._loadState();
  }

  // ---------------------------------------------------------------------------
  // PROPOSAL RECEPTION
  // ---------------------------------------------------------------------------

  /**
   * Receive a dimension proposal from DISCOVER
   *
   * @param {Object} proposal - Dimension candidate from ResidualDetector
   * @returns {Object} Reception result
   */
  async receiveDimensionProposal(proposal) {
    // Generate a signature for this pattern
    const signature = this._generateSignature(proposal);

    // Check if this pattern was already rejected
    if (this.rejectedPatterns.has(signature)) {
      return {
        received: false,
        reason: 'Pattern was previously rejected',
        signature,
      };
    }

    // Check if we already have a pending proposal with same signature
    const existing = this.pendingDimensions.find(p => p.signature === signature);
    if (existing) {
      // Reinforce existing proposal
      existing.reinforceCount = (existing.reinforceCount || 1) + 1;
      existing.lastReinforced = Date.now();
      this._saveState();

      return {
        received: true,
        action: 'reinforced',
        proposalId: existing.id,
        reinforceCount: existing.reinforceCount,
      };
    }

    // Create new pending proposal
    const pendingProposal = {
      id: `dim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      signature,
      ...proposal,
      receivedAt: Date.now(),
      status: 'AWAITING_HUMAN',
      reinforceCount: 1,
    };

    this.pendingDimensions.push(pendingProposal);
    this._saveState();

    // Notify (but never block)
    this._notifyPendingReview(pendingProposal);

    return {
      received: true,
      action: 'created',
      proposalId: pendingProposal.id,
      message: 'Dimension proposal queued for human validation',
      _phi: {
        maxConfidence: PHI_INV,
        philosophy: 'Enable, don\'t automate',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // HUMAN VALIDATION INTERFACE
  // ---------------------------------------------------------------------------

  /**
   * Get all pending dimension proposals
   *
   * @returns {Array} Pending proposals
   */
  getPending() {
    return this.pendingDimensions
      .filter(p => p.status === 'AWAITING_HUMAN')
      .map(p => ({
        id: p.id,
        suggestedName: p.suggestedName,
        confidence: p.confidence,
        clusterSize: p.clusterSize,
        axiomAlignment: p.axiomAlignment,
        averageResidual: p.averageResidual,
        evidence: p.evidence,
        reinforceCount: p.reinforceCount,
        receivedAt: new Date(p.receivedAt).toISOString(),
        age: this._formatAge(Date.now() - p.receivedAt),
      }));
  }

  /**
   * Human accepts a proposed dimension
   *
   * @param {string} proposalId - ID of the proposal to accept
   * @param {Object} feedback - Human feedback and customization
   * @returns {Object} Acceptance result
   */
  async humanValidate(proposalId, { accept, feedback = {} }) {
    const proposalIndex = this.pendingDimensions.findIndex(p => p.id === proposalId);

    if (proposalIndex === -1) {
      return {
        success: false,
        error: 'Proposal not found',
        proposalId,
      };
    }

    const proposal = this.pendingDimensions[proposalIndex];

    if (accept) {
      return this._acceptProposal(proposal, proposalIndex, feedback);
    } else {
      return this._rejectProposal(proposal, proposalIndex, feedback.reason || '');
    }
  }

  /**
   * Accept a proposal
   */
  _acceptProposal(proposal, index, feedback) {
    // Create the accepted dimension
    const acceptedDimension = {
      name: feedback.name || proposal.suggestedName,
      axiom: feedback.axiom || proposal.axiomAlignment,
      definition: feedback.definition || `Dimension discovered from ${proposal.clusterSize} anomalies`,
      threshold: feedback.threshold || Math.round(PHI_INV * 100),
      weight: feedback.weight || 1.0,
      createdAt: new Date().toISOString(),
      createdBy: feedback.validator || 'human',
      proposalId: proposal.id,
      confidence: proposal.confidence,
      status: 'ACCEPTED',
      _origin: {
        signature: proposal.signature,
        clusterSize: proposal.clusterSize,
        averageResidual: proposal.averageResidual,
        reinforceCount: proposal.reinforceCount,
      },
    };

    // Remove from pending
    this.pendingDimensions.splice(index, 1);
    this.acceptedCount++;

    // Record in history
    this._recordHistory('ACCEPTED', proposal, acceptedDimension);

    // Save state
    this._saveState();

    return {
      success: true,
      action: 'accepted',
      dimension: acceptedDimension,
      message: `🐕 *wag* Dimension "${acceptedDimension.name}" accepted! Ready for matrix integration.`,
      nextStep: 'Call integration API to add dimension to matrix',
    };
  }

  /**
   * Reject a proposal
   */
  _rejectProposal(proposal, index, reason) {
    // Add pattern to rejection set
    this.rejectedPatterns.add(proposal.signature);

    // Remove from pending
    this.pendingDimensions.splice(index, 1);
    this.rejectedCount++;

    // Record in history
    this._recordHistory('REJECTED', proposal, { reason });

    // Save state
    this._saveState();

    return {
      success: true,
      action: 'rejected',
      reason,
      message: `🐕 *nod* Dimension rejected. Pattern marked to not re-propose.`,
      note: 'Anomalies retained in buffer for future clustering with different patterns',
    };
  }

  // ---------------------------------------------------------------------------
  // INTROSPECTION
  // ---------------------------------------------------------------------------

  /**
   * Get THE_INNOMMABLE status
   */
  getStatus() {
    return {
      name: 'THE_INNOMMABLE',
      philosophy: 'φ qui doute de φ',

      pendingCount: this.pendingDimensions.length,
      rejectedPatternsCount: this.rejectedPatterns.size,

      stats: {
        accepted: this.acceptedCount,
        rejected: this.rejectedCount,
        pending: this.pendingDimensions.length,
      },

      oldestPending: this.pendingDimensions.length > 0
        ? this._formatAge(Date.now() - Math.min(...this.pendingDimensions.map(p => p.receivedAt)))
        : null,

      _meta: {
        maxConfidence: PHI_INV,
        minDoubt: PHI_INV_2,
        message: 'Le chien aboie aux anomalies. Il ne mord pas sans ordre.',
      },
    };
  }

  /**
   * Summarize the frontier
   */
  summarize() {
    const pending = this.getPending();

    if (pending.length === 0) {
      return {
        hasPending: false,
        message: '🐕 *calm* No pending dimension proposals. The frontier is quiet.',
      };
    }

    const topProposal = pending.sort((a, b) => b.confidence - a.confidence)[0];

    return {
      hasPending: true,
      count: pending.length,
      topProposal: {
        name: topProposal.suggestedName,
        confidence: `${(topProposal.confidence * 100).toFixed(1)}%`,
        axiom: topProposal.axiomAlignment,
        age: topProposal.age,
      },
      message: `🐕 *alert* ${pending.length} dimension proposal(s) await human validation.`,
      action: 'Call innommable.getPending() for details, innommable.humanValidate(id, {accept: true/false}) to decide.',
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Generate a signature for a pattern (to detect duplicates/rejects)
   */
  _generateSignature(proposal) {
    const features = proposal.features || {};
    const key = [
      features.axiom_gap,
      features.world_gap,
      features.weakestDimension,
      features.type,
      Math.round((features.avgMagnitude || 0) / 10) * 10, // Round to 10s
    ].join('|');

    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  }

  /**
   * Notify about pending review (non-blocking)
   */
  _notifyPendingReview(proposal) {
    // Log to stderr (visible in terminal but doesn't block)
    const msg = `[INNOMMABLE] New dimension proposal: "${proposal.suggestedName}" (confidence: ${(proposal.confidence * 100).toFixed(1)}%)`;
    if (process.stderr && process.stderr.write) {
      process.stderr.write(msg + '\n');
    }
  }

  /**
   * Format age for display
   */
  _formatAge(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Record decision in history
   */
  _recordHistory(action, proposal, result) {
    const record = {
      timestamp: Date.now(),
      action,
      proposalId: proposal.id,
      suggestedName: proposal.suggestedName,
      confidence: proposal.confidence,
      result,
    };

    try {
      this._ensureDir();
      fs.appendFileSync(HISTORY_FILE, JSON.stringify(record) + '\n');
    } catch (err) {
      // Silent failure
    }
  }

  /**
   * Save state to disk
   */
  _saveState() {
    try {
      this._ensureDir();
      const state = {
        pendingDimensions: this.pendingDimensions,
        rejectedPatterns: Array.from(this.rejectedPatterns),
        acceptedCount: this.acceptedCount,
        rejectedCount: this.rejectedCount,
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(PENDING_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
      // Silent failure
    }
  }

  /**
   * Load state from disk
   */
  _loadState() {
    try {
      if (fs.existsSync(PENDING_FILE)) {
        const data = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
        this.pendingDimensions = data.pendingDimensions || [];
        this.rejectedPatterns = new Set(data.rejectedPatterns || []);
        this.acceptedCount = data.acceptedCount || 0;
        this.rejectedCount = data.rejectedCount || 0;
      }
    } catch (err) {
      // Start fresh on error
      this.pendingDimensions = [];
      this.rejectedPatterns = new Set();
    }
  }

  /**
   * Ensure storage directory exists
   */
  _ensureDir() {
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let innommableInstance = null;

/**
 * Get or create THE_INNOMMABLE instance
 * Singleton ensures state persists across calls
 */
function getInnommable() {
  if (!innommableInstance) {
    innommableInstance = new TheInnommable();
  }
  return innommableInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  TheInnommable,
  getInnommable,

  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,
};
