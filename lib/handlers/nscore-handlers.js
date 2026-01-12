/**
 * N-Score Handlers - brain_nscore_*
 *
 * [R] Remez - Knowledge Graph Scoring ("K-Score for Knowledge")
 *
 * Philosophy: "N = 100 × ∛(U × C × T)"
 */

'use strict';

const nScore = require('../cynic/n-score');
const fs = require('fs').promises;
const path = require('path');

// Knowledge path
const KNOWLEDGE_PATH = path.join(__dirname, '../../knowledge/learned/live.jsonl');

/**
 * Load knowledge nodes from live.jsonl
 */
async function loadKnowledgeNodes() {
  try {
    const content = await fs.readFile(KNOWLEDGE_PATH, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());

    return lines.map((line, idx) => {
      try {
        const entry = JSON.parse(line);
        return {
          id: entry.id || `node_${idx}`,
          type: entry.type,
          content: entry.content?.substring(0, 100) + '...',
          project: entry.project,
          // Map to N-Score fields
          accesses: entry._accesses || 1,
          lastAccessed: entry._lastAccessed || entry.timestamp,
          edgesIn: entry._edgesIn || 0,
          edgesOut: entry._edgesOut || (entry.tags?.length || 0),
          confirmations: entry._confirmations || 1,
          totalVotes: entry._totalVotes || 1,
          createdAt: new Date(entry.timestamp).getTime(),
          // Original data
          _original: entry,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (err) {
    return [];
  }
}

/**
 * Handle brain_nscore_calculate
 * Calculate N-Score for a specific node or all nodes
 */
async function handleNScoreCalculate(args, adapter) {
  const { nodeId, limit = 20 } = args;

  const nodes = await loadKnowledgeNodes();

  if (nodes.length === 0) {
    return {
      success: false,
      error: 'No knowledge nodes found',
      _quality: 0,
    };
  }

  if (nodeId) {
    // Score specific node
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      return {
        success: false,
        error: `Node ${nodeId} not found`,
        _quality: 0,
      };
    }

    const result = nScore.calculate(node);
    return {
      success: true,
      node: {
        id: node.id,
        type: node.type,
        project: node.project,
      },
      nScore: result,
      philosophy: 'N = 100 × ∛(U × C × T)',
      _quality: result.score,
    };
  }

  // Score all nodes
  const scored = nScore.scoreAll(nodes).slice(0, limit);

  return {
    success: true,
    total: nodes.length,
    showing: scored.length,
    nodes: scored.map(n => ({
      id: n.id,
      type: n.type,
      project: n.project,
      score: n._nScore.score,
      verdict: n._nScore.verdict,
      U: n._nScore.components.U,
      C: n._nScore.components.C,
      T: n._nScore.components.T,
    })),
    philosophy: 'K-Score for Knowledge',
    _quality: 80,
  };
}

/**
 * Handle brain_nscore_health
 * Get knowledge graph health summary
 */
async function handleNScoreHealth(args, adapter) {
  const nodes = await loadKnowledgeNodes();

  if (nodes.length === 0) {
    return {
      success: true,
      health: nScore.getGraphHealth([]),
      message: 'Knowledge graph is empty',
      _quality: 50,
    };
  }

  const health = nScore.getGraphHealth(nodes);

  return {
    success: true,
    health,
    message: `Graph has ${health.total} nodes: ${health.keep} KEEP, ${health.transform} TRANSFORM, ${health.burn} BURN`,
    recommendations: getRecommendations(health),
    philosophy: 'N = 100 × ∛(U × C × T)',
    _quality: health.health,
  };
}

/**
 * Handle brain_nscore_burn_candidates
 * Get nodes that should be burned (N < 38.2%)
 */
async function handleNScoreBurnCandidates(args, adapter) {
  const { limit = 10 } = args;
  const nodes = await loadKnowledgeNodes();

  const candidates = nScore.getBurnCandidates(nodes).slice(0, limit);

  return {
    success: true,
    total: candidates.length,
    candidates: candidates.map(n => ({
      id: n.id,
      type: n.type,
      project: n.project,
      content: n.content,
      score: n._nScore.score,
      reason: getBurnReason(n._nScore),
    })),
    message: `Found ${candidates.length} nodes below φ⁻² (38.2%) threshold`,
    action: 'Review and use brain_nscore_burn to remove',
    philosophy: "Don't extract, burn",
    _quality: 70,
  };
}

/**
 * Handle brain_nscore_transform_candidates
 * Get nodes that need transformation (38.2% < N < 61.8%)
 */
async function handleNScoreTransformCandidates(args, adapter) {
  const { limit = 10 } = args;
  const nodes = await loadKnowledgeNodes();

  const candidates = nScore.getTransformCandidates(nodes).slice(0, limit);

  return {
    success: true,
    total: candidates.length,
    candidates: candidates.map(n => ({
      id: n.id,
      type: n.type,
      project: n.project,
      content: n.content,
      score: n._nScore.score,
      suggestion: getTransformSuggestion(n._nScore),
    })),
    message: `Found ${candidates.length} nodes in TRANSFORM range (38.2% - 61.8%)`,
    action: 'Consider consolidating similar nodes',
    philosophy: 'Transform, not destroy',
    _quality: 70,
  };
}

/**
 * Get recommendations based on graph health
 */
function getRecommendations(health) {
  const recs = [];

  if (health.burnPct > 20) {
    recs.push({
      priority: 'high',
      action: 'Run brain_nscore_burn_candidates to clean low-value nodes',
      reason: `${health.burnPct}% of nodes are below φ⁻² threshold`,
    });
  }

  if (health.transformPct > 30) {
    recs.push({
      priority: 'medium',
      action: 'Consolidate TRANSFORM nodes with similar content',
      reason: `${health.transformPct}% of nodes need attention`,
    });
  }

  if (health.averageScore < 50) {
    recs.push({
      priority: 'medium',
      action: 'Increase node usage (U) and connections (C)',
      reason: `Average N-Score ${health.averageScore} is below healthy threshold`,
    });
  }

  if (recs.length === 0) {
    recs.push({
      priority: 'low',
      action: 'Knowledge graph is healthy',
      reason: `${health.keepPct}% of nodes are above φ⁻¹ threshold`,
    });
  }

  return recs;
}

/**
 * Get reason for burn recommendation
 */
function getBurnReason(nScore) {
  const { U, C, T } = nScore.components;
  const weakest = Math.min(U, C, T);

  if (weakest === U) {
    return `Low utilization (U=${U}%): Node rarely accessed`;
  }
  if (weakest === C) {
    return `Isolated (C=${C}%): Few connections to other knowledge`;
  }
  return `Unverified (T=${T}%): Lacks confirmations`;
}

/**
 * Get transformation suggestion
 */
function getTransformSuggestion(nScore) {
  const { U, C, T } = nScore.components;
  const weakest = Math.min(U, C, T);

  if (weakest === U) {
    return 'Merge with frequently accessed similar node';
  }
  if (weakest === C) {
    return 'Add links to related knowledge nodes';
  }
  return 'Seek confirmation from other sources';
}

module.exports = {
  handleNScoreCalculate,
  handleNScoreHealth,
  handleNScoreBurnCandidates,
  handleNScoreTransformCandidates,
};
