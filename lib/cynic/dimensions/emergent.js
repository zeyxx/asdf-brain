/**
 * CYNIC Emergent Dimension Manager
 *
 * Phase 4: "24 + N + ∞"
 *
 * Manages the lifecycle of discovered dimensions:
 * - Creates DynamicDimension evaluators from residual proposals
 * - Persists discovered dimensions to knowledge store
 * - Loads discovered dimensions on startup
 * - Integrates with DimensionRegistry for live evaluation
 *
 * "φ qui découvre ce qu'il ne sait pas encore."
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { DimensionEvaluator, registry } = require('./base');
const { PHI, PHI_2: PHI_SQ, PHI_INV, PHI_INV_2 } = require('../../temporal');

// =============================================================================
// CONSTANTS
// =============================================================================

const EMERGENT_CONSTANTS = {
  // Category for discovered dimensions
  DISCOVERED_CATEGORY: 'DISCOVERED',
  DISCOVERED_WEIGHT: PHI,  // 1.618 - between SECONDARY and PRIMARY

  // Validation requirements
  MIN_CLUSTER_SIZE: Math.ceil(PHI_SQ),  // 3
  MIN_CONFIDENCE: PHI_INV_2,            // 38.2%

  // Default thresholds
  DEFAULT_THRESHOLD: 50,

  // Storage
  STORAGE_FILE: 'discovered-dimensions.json',
};

// =============================================================================
// DYNAMIC DIMENSION EVALUATOR
// =============================================================================

/**
 * DynamicDimension - Runtime-created evaluator from pattern analysis
 *
 * Unlike file-based evaluators, these are created from discovered patterns
 * and can be hot-loaded/unloaded dynamically.
 */
class DynamicDimension extends DimensionEvaluator {
  constructor(config) {
    super({
      ...config,
      category: config.category || EMERGENT_CONSTANTS.DISCOVERED_CATEGORY,
    });

    // Discovery metadata
    this.discoveredAt = config.discoveredAt || Date.now();
    this.discoveredFrom = config.discoveredFrom || 'residual';
    this.clusterSize = config.clusterSize || 0;
    this.confidence = Math.min(config.confidence || PHI_INV_2, PHI_INV);
    this.validatedBy = config.validatedBy || null;
    this.validatedAt = config.validatedAt || null;

    // Pattern-based evaluation rules
    this.patterns = config.patterns || [];
    this.featureWeights = config.featureWeights || {};
    this.commonFeatures = config.commonFeatures || {};
  }

  /**
   * Dynamic evaluation based on discovered patterns
   *
   * Uses additive scoring to prevent dilution:
   * - Base score: 50 (neutral)
   * - Each positive signal adds points
   * - Each negative signal subtracts points
   */
  async evaluate(observation, context = {}) {
    let score = 50;  // Start neutral
    const reasons = [];
    const details = {};

    // 1. Check explicit markers (if dimension name appears in observation)
    const dimKeyNoUnderscore = this.name.toLowerCase().replace(/_/g, '');
    const dimKeyWithUnderscore = this.name.toLowerCase();
    if (
      observation[dimKeyNoUnderscore] === true ||
      observation[dimKeyWithUnderscore] === true ||
      observation[this.name] === true
    ) {
      score += 30;
      reasons.push('explicit marker present');
    }

    // 2. Pattern matching from discovery (additive)
    if (this.patterns.length > 0) {
      const patternResult = this._evaluatePatterns(observation);
      // Add pattern bonus (up to +25 for multiple matches)
      const patternBonus = Math.min(25, (patternResult.score - 50));
      if (patternBonus > 0) {
        score += patternBonus;
        reasons.push(...patternResult.reasons);
      }
      details.patterns = patternResult;
    }

    // 3. Feature alignment with common features (additive, only positive)
    if (Object.keys(this.commonFeatures).length > 0) {
      const featureResult = this._evaluateFeatureAlignment(observation);
      // Add feature bonus only when above neutral (don't penalize no-match)
      if (featureResult.score > 50) {
        const featureBonus = Math.round((featureResult.score - 50) * 0.4);
        score += featureBonus;
      }
      if (featureResult.reasons.length > 0) {
        reasons.push(...featureResult.reasons);
      }
      details.features = featureResult;
    }

    // 4. Axiom-specific boost (additive, only positive)
    const axiomResult = this._evaluateAxiomAlignment(observation, context);
    const axiomBonus = Math.max(0, axiomResult.score - 50);
    if (axiomBonus > 0) {
      score += Math.round(axiomBonus * 0.5);  // Half of axiom bonus
    }
    details.axiom = axiomResult;

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    const reasoning = reasons.length > 0
      ? reasons.slice(0, 3).join(' | ')
      : 'evaluated via dynamic patterns';

    return this.createResult(score, reasoning, {
      ...details,
      dynamic: true,
      confidence: this.confidence,
      clusterSize: this.clusterSize,
    });
  }

  _evaluatePatterns(obs) {
    let score = 50;
    const reasons = [];
    const obsStr = JSON.stringify(obs).toLowerCase();

    for (const pattern of this.patterns) {
      if (typeof pattern === 'string' && obsStr.includes(pattern.toLowerCase())) {
        score += 10;
        reasons.push(`pattern: ${pattern}`);
      }
    }

    return { score: Math.min(100, score), reasons };
  }

  _evaluateFeatureAlignment(obs) {
    let matches = 0;
    let total = 0;
    const reasons = [];

    for (const [feature, expectedValue] of Object.entries(this.commonFeatures)) {
      total++;
      const obsValue = obs[feature];

      if (obsValue === expectedValue) {
        matches++;
        reasons.push(`${feature} aligned`);
      } else if (typeof expectedValue === 'number' && typeof obsValue === 'number') {
        // Numeric comparison with tolerance
        const diff = Math.abs(obsValue - expectedValue) / Math.max(Math.abs(expectedValue), 1);
        if (diff < PHI_INV) {
          matches += 0.5;
        }
      }
    }

    const score = total > 0 ? (matches / total) * 100 : 50;
    return { score, reasons };
  }

  _evaluateAxiomAlignment(obs, ctx) {
    let score = 50;

    // Boost if observation explicitly mentions our axiom
    const axiomLower = this.axiom.toLowerCase();
    if (obs[axiomLower] === true || obs.axiom === this.axiom) {
      score += 25;
    }

    // World alignment
    if (obs.world === this.world) {
      score += 15;
    }

    return { score: Math.min(100, score), reasons: [] };
  }

  /**
   * Export for persistence
   */
  toJSON() {
    return {
      name: this.name,
      category: this.category,
      world: this.world,
      axiom: this.axiom,
      threshold: this.threshold,
      question: this.question,
      weight: this.weight,
      discoveredAt: this.discoveredAt,
      discoveredFrom: this.discoveredFrom,
      clusterSize: this.clusterSize,
      confidence: this.confidence,
      validatedBy: this.validatedBy,
      validatedAt: this.validatedAt,
      patterns: this.patterns,
      featureWeights: this.featureWeights,
      commonFeatures: this.commonFeatures,
    };
  }

  /**
   * Create from persisted JSON
   */
  static fromJSON(json) {
    return new DynamicDimension(json);
  }
}

// =============================================================================
// EMERGENT DIMENSION MANAGER
// =============================================================================

class EmergentDimensionManager {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(
      process.cwd(),
      'knowledge',
      'cynic',
      EMERGENT_CONSTANTS.STORAGE_FILE
    );

    this.dimensions = new Map();  // name → DynamicDimension
    this.proposals = [];          // Pending proposals
    this.history = [];            // Action history

    this.stats = {
      loaded: 0,
      created: 0,
      validated: 0,
      rejected: 0,
    };
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Initialize: Load persisted dimensions and register them
   */
  async initialize() {
    console.log('[Emergent] Initializing EmergentDimensionManager...');

    // Load from storage
    await this.load();

    // Register all loaded dimensions
    for (const dim of this.dimensions.values()) {
      this._registerDimension(dim);
    }

    console.log(`[Emergent] Loaded ${this.dimensions.size} discovered dimensions`);
    return this;
  }

  /**
   * Load dimensions from storage
   */
  async load() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (!fs.existsSync(this.storagePath)) {
        console.log('[Emergent] No existing storage, starting fresh');
        return;
      }

      const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));

      if (data.dimensions) {
        for (const dimJson of data.dimensions) {
          const dim = DynamicDimension.fromJSON(dimJson);
          this.dimensions.set(dim.name, dim);
          this.stats.loaded++;
        }
      }

      if (data.history) {
        this.history = data.history;
      }

    } catch (err) {
      console.error('[Emergent] Error loading:', err.message);
    }
  }

  /**
   * Save dimensions to storage
   */
  async save() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        version: '1.0.0',
        savedAt: new Date().toISOString(),
        dimensions: Array.from(this.dimensions.values()).map(d => d.toJSON()),
        history: this.history.slice(-100),  // Keep last 100 entries
        stats: this.stats,
      };

      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
      console.log(`[Emergent] Saved ${this.dimensions.size} dimensions`);

    } catch (err) {
      console.error('[Emergent] Error saving:', err.message);
      throw err;
    }
  }

  // ===========================================================================
  // PROPOSAL HANDLING
  // ===========================================================================

  /**
   * Receive a proposal from ResidualDetector
   * @param {Object} proposal - Dimension proposal from discovery
   * @returns {Object} Proposal status
   */
  receiveProposal(proposal) {
    // Validate proposal
    if (!proposal.suggestedName) {
      return { accepted: false, reason: 'Missing suggestedName' };
    }

    if (proposal.confidence < EMERGENT_CONSTANTS.MIN_CONFIDENCE) {
      return {
        accepted: false,
        reason: `Confidence ${proposal.confidence} < ${EMERGENT_CONSTANTS.MIN_CONFIDENCE}`
      };
    }

    // Check if already exists
    if (this.dimensions.has(proposal.suggestedName) || registry.get(proposal.suggestedName)) {
      return { accepted: false, reason: 'Dimension already exists' };
    }

    // Add to pending
    const pendingProposal = {
      id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...proposal,
      receivedAt: Date.now(),
      status: 'PENDING',
    };

    this.proposals.push(pendingProposal);

    return {
      accepted: true,
      proposalId: pendingProposal.id,
      message: 'Proposal received. Awaiting human validation.',
      proposal: pendingProposal,
    };
  }

  /**
   * List pending proposals
   */
  getPendingProposals() {
    return this.proposals.filter(p => p.status === 'PENDING');
  }

  // ===========================================================================
  // VALIDATION (Human-in-the-loop)
  // ===========================================================================

  /**
   * Validate and accept a proposal (human validation)
   * @param {string} proposalId - The proposal to validate
   * @param {Object} validation - Human-provided validation
   */
  validateProposal(proposalId, validation = {}) {
    const proposal = this.proposals.find(p => p.id === proposalId);

    if (!proposal) {
      return { success: false, reason: 'Proposal not found' };
    }

    if (proposal.status !== 'PENDING') {
      return { success: false, reason: `Proposal already ${proposal.status}` };
    }

    // Create DynamicDimension
    const dim = new DynamicDimension({
      name: validation.name || proposal.suggestedName,
      world: validation.world || proposal.suggestedWorld || proposal.axiomAlignment,
      axiom: validation.axiom || proposal.axiomAlignment || 'PHI',
      threshold: validation.threshold || EMERGENT_CONSTANTS.DEFAULT_THRESHOLD,
      question: validation.question || proposal.suggestedQuestion || `Does it satisfy ${proposal.suggestedName}?`,
      clusterSize: proposal.clusterSize,
      confidence: proposal.confidence,
      patterns: proposal.patterns || [],
      commonFeatures: proposal.features || {},
      validatedBy: validation.validator || 'human',
      validatedAt: Date.now(),
    });

    // Store and register
    this.dimensions.set(dim.name, dim);
    this._registerDimension(dim);

    // Update proposal status
    proposal.status = 'VALIDATED';
    proposal.validatedAt = Date.now();

    // Record history
    this.history.push({
      action: 'VALIDATE',
      dimension: dim.name,
      proposalId,
      timestamp: Date.now(),
    });

    this.stats.validated++;
    this.stats.created++;

    // Auto-save
    this.save().catch(err => console.error('[Emergent] Save error:', err));

    return {
      success: true,
      dimension: dim.getMetadata(),
      message: `Dimension "${dim.name}" created and registered`,
      registeredCount: registry.getAll().length,
    };
  }

  /**
   * Reject a proposal
   */
  rejectProposal(proposalId, reason = '') {
    const proposal = this.proposals.find(p => p.id === proposalId);

    if (!proposal) {
      return { success: false, reason: 'Proposal not found' };
    }

    proposal.status = 'REJECTED';
    proposal.rejectedAt = Date.now();
    proposal.rejectionReason = reason;

    this.history.push({
      action: 'REJECT',
      proposalId,
      reason,
      timestamp: Date.now(),
    });

    this.stats.rejected++;

    return {
      success: true,
      message: `Proposal rejected: ${reason}`,
    };
  }

  // ===========================================================================
  // DIMENSION MANAGEMENT
  // ===========================================================================

  /**
   * Register a dimension with the global registry
   */
  _registerDimension(dim) {
    try {
      registry.register(dim);
      console.log(`[Emergent] Registered: ${dim.name} (${dim.world}/${dim.axiom})`);
    } catch (err) {
      console.error(`[Emergent] Failed to register ${dim.name}:`, err.message);
    }
  }

  /**
   * Unregister a discovered dimension
   */
  removeDimension(name) {
    if (!this.dimensions.has(name)) {
      return { success: false, reason: 'Dimension not found in emergent store' };
    }

    this.dimensions.delete(name);
    registry.unregister(name);

    this.history.push({
      action: 'REMOVE',
      dimension: name,
      timestamp: Date.now(),
    });

    this.save().catch(err => console.error('[Emergent] Save error:', err));

    return {
      success: true,
      message: `Dimension "${name}" removed`,
    };
  }

  /**
   * Update a discovered dimension
   */
  updateDimension(name, updates) {
    const dim = this.dimensions.get(name);
    if (!dim) {
      return { success: false, reason: 'Dimension not found' };
    }

    // Apply updates
    if (updates.threshold !== undefined) dim.threshold = updates.threshold;
    if (updates.question !== undefined) dim.question = updates.question;
    if (updates.patterns !== undefined) dim.patterns = updates.patterns;
    if (updates.commonFeatures !== undefined) dim.commonFeatures = updates.commonFeatures;

    // Re-register (updates in registry)
    registry.swap(dim);

    this.history.push({
      action: 'UPDATE',
      dimension: name,
      updates: Object.keys(updates),
      timestamp: Date.now(),
    });

    this.save().catch(err => console.error('[Emergent] Save error:', err));

    return {
      success: true,
      dimension: dim.getMetadata(),
    };
  }

  // ===========================================================================
  // QUERY
  // ===========================================================================

  /**
   * Get all discovered dimensions
   */
  getAll() {
    return Array.from(this.dimensions.values()).map(d => d.getMetadata());
  }

  /**
   * Get a specific dimension
   */
  get(name) {
    const dim = this.dimensions.get(name);
    return dim ? dim.getMetadata() : null;
  }

  /**
   * Get full statistics
   */
  getStats() {
    return {
      ...this.stats,
      discovered: this.dimensions.size,
      pending: this.proposals.filter(p => p.status === 'PENDING').length,
      registryTotal: registry.getAll().length,
      byWorld: this._countByWorld(),
      byAxiom: this._countByAxiom(),
    };
  }

  _countByWorld() {
    const counts = {};
    for (const dim of this.dimensions.values()) {
      counts[dim.world] = (counts[dim.world] || 0) + 1;
    }
    return counts;
  }

  _countByAxiom() {
    const counts = {};
    for (const dim of this.dimensions.values()) {
      counts[dim.axiom] = (counts[dim.axiom] || 0) + 1;
    }
    return counts;
  }

  /**
   * Get history
   */
  getHistory(limit = 20) {
    return this.history.slice(-limit);
  }
}

// =============================================================================
// SINGLETON + EXPORTS
// =============================================================================

const emergentManager = new EmergentDimensionManager();

module.exports = {
  DynamicDimension,
  EmergentDimensionManager,
  emergentManager,
  EMERGENT_CONSTANTS,

  // Convenience exports
  initialize: () => emergentManager.initialize(),
  receiveProposal: (p) => emergentManager.receiveProposal(p),
  validateProposal: (id, v) => emergentManager.validateProposal(id, v),
  rejectProposal: (id, r) => emergentManager.rejectProposal(id, r),
  getPendingProposals: () => emergentManager.getPendingProposals(),
  getDiscovered: () => emergentManager.getAll(),
  getStats: () => emergentManager.getStats(),
};
