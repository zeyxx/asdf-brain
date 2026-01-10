/**
 * operator-loader.js - Per-Operator Memory Management
 *
 * Loads and saves operator context from knowledge/operators/ structure.
 * Integrates with context-layer.js for session management.
 *
 * Philosophy: Each operator has their own memory zone.
 * Context flows with φ-weighted recency.
 *
 * Directory Structure:
 * knowledge/operators/
 * ├── identity-matrix.json  (public mappings)
 * └── {operator-hash}/
 *     ├── context.json      (current state)
 *     └── history.jsonl     (session history)
 *
 * .private/operators/
 * ├── aliases.json          (real identity mappings)
 * └── {operator-hash}/
 *     ├── feedback.jsonl    (raw feedback)
 *     └── patterns.json     (learned patterns)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// PHI CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_WEIGHTS = {
  current: 1.0,           // φ⁰
  lastSession: 1 / PHI,   // φ⁻¹ = 0.618
  twoAgo: 1 / (PHI * PHI), // φ⁻² = 0.382
  older: 1 / (PHI * PHI * PHI) // φ⁻³ = 0.236
};

// =============================================================================
// PATHS
// =============================================================================

const KNOWLEDGE_BASE = path.join(__dirname, '../knowledge/operators');
const PRIVATE_BASE = path.join(__dirname, '../.private/operators');

// =============================================================================
// OPERATOR LOADER CLASS
// =============================================================================

class OperatorLoader {
  constructor() {
    this.identityMatrix = null;
    this.aliases = null;
    this.operatorCache = new Map();
    this._ensureDirectories();
    this._loadIdentityMatrix();
  }

  _ensureDirectories() {
    if (!fs.existsSync(KNOWLEDGE_BASE)) {
      fs.mkdirSync(KNOWLEDGE_BASE, { recursive: true });
    }
    if (!fs.existsSync(PRIVATE_BASE)) {
      fs.mkdirSync(PRIVATE_BASE, { recursive: true });
    }
  }

  _loadIdentityMatrix() {
    const matrixPath = path.join(KNOWLEDGE_BASE, 'identity-matrix.json');
    if (fs.existsSync(matrixPath)) {
      try {
        this.identityMatrix = JSON.parse(fs.readFileSync(matrixPath, 'utf-8'));
      } catch (e) {
        console.error('Failed to load identity matrix:', e.message);
        this.identityMatrix = { operators: {}, projectAuthority: {} };
      }
    } else {
      this.identityMatrix = { operators: {}, projectAuthority: {} };
    }

    const aliasesPath = path.join(PRIVATE_BASE, 'aliases.json');
    if (fs.existsSync(aliasesPath)) {
      try {
        this.aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf-8'));
      } catch (e) {
        console.error('Failed to load aliases:', e.message);
        this.aliases = { mappings: {}, reverseIndex: {} };
      }
    } else {
      this.aliases = { mappings: {}, reverseIndex: {} };
    }
  }

  /**
   * Resolve operator identifier to operator hash
   */
  resolveOperator(identifier) {
    if (!identifier) return null;

    const normalized = identifier.toLowerCase().trim();

    // Check reverse index for known aliases
    if (this.aliases?.reverseIndex?.[normalized]) {
      return this.aliases.reverseIndex[normalized];
    }

    // Check if it's already an operator hash
    if (normalized.startsWith('op_')) {
      return normalized;
    }

    // Generate new hash for unknown operator
    return this._hashOperator(identifier);
  }

  _hashOperator(identifier, salt = 'asdf-brain-v1') {
    return 'op_' + crypto
      .createHash('sha256')
      .update(identifier.toLowerCase() + salt)
      .digest('hex')
      .slice(0, 8);
  }

  /**
   * Load operator context for session
   */
  loadOperatorContext(operatorId) {
    if (!operatorId) return null;

    const opHash = this.resolveOperator(operatorId);
    if (!opHash) return null;

    // Check cache
    if (this.operatorCache.has(opHash)) {
      return this.operatorCache.get(opHash);
    }

    const opDir = path.join(KNOWLEDGE_BASE, opHash);
    const contextPath = path.join(opDir, 'context.json');
    const historyPath = path.join(opDir, 'history.jsonl');

    let context = {
      operatorId: opHash,
      identity: this.identityMatrix?.operators?.[opHash] || null,
      currentContext: null,
      recentHistory: [],
      patterns: null
    };

    // Load current context
    if (fs.existsSync(contextPath)) {
      try {
        context.currentContext = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
      } catch (e) {
        console.error(`Failed to load context for ${opHash}:`, e.message);
      }
    }

    // Load recent history (last 10 entries with φ weighting)
    if (fs.existsSync(historyPath)) {
      try {
        const lines = fs.readFileSync(historyPath, 'utf-8')
          .split('\n')
          .filter(Boolean)
          .slice(-10);

        context.recentHistory = lines.map((line, idx) => {
          const entry = JSON.parse(line);
          // Apply φ weight based on recency
          const recencyIdx = lines.length - 1 - idx;
          entry._weight = Math.pow(1 / PHI, recencyIdx);
          return entry;
        });
      } catch (e) {
        console.error(`Failed to load history for ${opHash}:`, e.message);
      }
    }

    // Load patterns from private
    const patternsPath = path.join(PRIVATE_BASE, opHash, 'patterns.json');
    if (fs.existsSync(patternsPath)) {
      try {
        context.patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
      } catch (e) {
        // Patterns are optional
      }
    }

    this.operatorCache.set(opHash, context);
    return context;
  }

  /**
   * Save operator context after session update
   */
  saveOperatorContext(operatorId, context) {
    const opHash = this.resolveOperator(operatorId);
    if (!opHash) return false;

    const opDir = path.join(KNOWLEDGE_BASE, opHash);
    if (!fs.existsSync(opDir)) {
      fs.mkdirSync(opDir, { recursive: true });
    }

    const contextPath = path.join(opDir, 'context.json');
    context.lastUpdated = new Date().toISOString();

    try {
      fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
      this.operatorCache.set(opHash, { ...this.operatorCache.get(opHash), currentContext: context });
      return true;
    } catch (e) {
      console.error(`Failed to save context for ${opHash}:`, e.message);
      return false;
    }
  }

  /**
   * Append to session history
   */
  appendHistory(operatorId, entry) {
    const opHash = this.resolveOperator(operatorId);
    if (!opHash) return false;

    const opDir = path.join(KNOWLEDGE_BASE, opHash);
    if (!fs.existsSync(opDir)) {
      fs.mkdirSync(opDir, { recursive: true });
    }

    const historyPath = path.join(opDir, 'history.jsonl');
    entry.ts = entry.ts || new Date().toISOString();

    try {
      fs.appendFileSync(historyPath, JSON.stringify(entry) + '\n');
      return true;
    } catch (e) {
      console.error(`Failed to append history for ${opHash}:`, e.message);
      return false;
    }
  }

  /**
   * Get operator summary for context injection
   */
  getOperatorSummary(operatorId) {
    const context = this.loadOperatorContext(operatorId);
    if (!context) return null;

    const summary = {
      operatorId: context.operatorId,
      displayName: context.identity?.displayName || 'Unknown',
      roles: context.identity?.roles || [],
      primaryProjects: context.identity?.primaryProjects || [],
      communicationStyle: context.identity?.communicationStyle || {},
    };

    // Add active work context
    if (context.currentContext?.activeWork) {
      summary.activeWork = {};
      for (const [project, work] of Object.entries(context.currentContext.activeWork)) {
        summary.activeWork[project] = {
          status: work.status,
          recentProblems: work.recentProblems?.slice(0, 3) || [],
          wipFiles: work.wipFiles?.slice(0, 5) || []
        };
      }
    }

    // Add recent decisions (φ-weighted, most recent first)
    if (context.currentContext?.recentDecisions) {
      summary.recentDecisions = context.currentContext.recentDecisions.slice(-3);
    }

    // Add communication patterns
    if (context.patterns?.communicationPatterns?.preferences) {
      summary.preferences = context.patterns.communicationPatterns.preferences;
    }

    return summary;
  }

  /**
   * List all known operators
   */
  listOperators() {
    return Object.entries(this.identityMatrix?.operators || {}).map(([id, data]) => ({
      id,
      displayName: data.displayName,
      roles: data.roles,
      lastSeen: data.lastSeen
    }));
  }

  /**
   * Register new operator or update existing
   */
  registerOperator(identifier, data) {
    const opHash = this.resolveOperator(identifier);

    // Update identity matrix
    this.identityMatrix.operators[opHash] = {
      ...this.identityMatrix.operators[opHash],
      ...data,
      lastSeen: new Date().toISOString()
    };

    // Save identity matrix
    const matrixPath = path.join(KNOWLEDGE_BASE, 'identity-matrix.json');
    this.identityMatrix.updated = new Date().toISOString();
    fs.writeFileSync(matrixPath, JSON.stringify(this.identityMatrix, null, 2));

    // Update aliases if provided
    if (data.aliases) {
      for (const alias of data.aliases) {
        this.aliases.reverseIndex[alias.toLowerCase()] = opHash;
      }
      const aliasesPath = path.join(PRIVATE_BASE, 'aliases.json');
      fs.writeFileSync(aliasesPath, JSON.stringify(this.aliases, null, 2));
    }

    // Clear cache
    this.operatorCache.delete(opHash);

    return opHash;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let instance = null;

function getOperatorLoader() {
  if (!instance) {
    instance = new OperatorLoader();
  }
  return instance;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  OperatorLoader,
  getOperatorLoader,
  PHI_WEIGHTS,
  KNOWLEDGE_BASE,
  PRIVATE_BASE
};
