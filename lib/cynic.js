/**
 * CYNIC - The Self-Judging Cycle
 *
 * CYNIC = φ qui se méfie de φ
 *
 * Core philosophy:
 * - CEILING: φ⁻¹ (61.8%) - Never too confident
 * - FLOOR: φ⁻² (38.2%) - Always maintain doubt
 * - TRANSFORM: Don't accept/reject, evolve
 *
 * @module cynic
 * @philosophy "Le doute est le moteur de la connaissance"
 */

const temporal = require('./temporal');

// φ Constants from ecosystem
const PHI = temporal.PHI;
const PHI_INV = temporal.PHI_INV;     // 0.618... - confidence ceiling
const PHI_INV_2 = temporal.PHI_INV_2; // 0.382... - doubt floor

/**
 * Verdict types
 */
const VERDICT = {
  ACCEPT: 'ACCEPT',     // confidence >= 0.5, proceed with caution
  VERIFY: 'VERIFY',     // confidence < 0.5, needs validation
  TRANSFORM: 'TRANSFORM' // item evolved during judgment
};

/**
 * CYNIC Core Class
 * Implements the self-judging cycle: ingest → judge → transform
 */
class CYNIC {
  constructor(options = {}) {
    this.options = {
      confidenceCeiling: PHI_INV,    // Never exceed 61.8%
      doubtFloor: PHI_INV_2,         // Always maintain 38.2% doubt
      transformThreshold: 0.5,        // Below this, transform rather than reject
      ...options
    };

    // Track judgment history for self-calibration
    this.history = [];
    this.maxHistory = 100;

    // Pluggable evaluator
    this.evaluator = options.evaluator || null;
  }

  /**
   * Main processing cycle
   * @param {*} input - Raw input to process
   * @param {string} source - Origin of the input
   * @returns {Object} { ingested, judgment, result }
   */
  async process(input, source = 'unknown') {
    const ingested = await this.ingest(input, source);
    const judgment = await this.judge(ingested);
    const result = await this.transform(ingested, judgment);

    // Record in history for self-calibration
    this._recordHistory({ ingested, judgment, result });

    return { ingested, judgment, result };
  }

  /**
   * Ingest: Normalize and structure input
   * @param {*} input - Raw input
   * @param {string} source - Origin
   * @returns {Object} Structured item
   */
  async ingest(input, source) {
    const timestamp = new Date().toISOString();

    // Handle different input types
    let content, metadata;

    if (typeof input === 'string') {
      content = input;
      metadata = {};
    } else if (typeof input === 'object' && input !== null) {
      content = input.content || input.text || JSON.stringify(input);
      metadata = { ...input };
      delete metadata.content;
      delete metadata.text;
    } else {
      content = String(input);
      metadata = {};
    }

    return {
      content,
      source,
      timestamp,
      metadata,
      _hash: this._hash(content + source + timestamp)
    };
  }

  /**
   * Judge: Evaluate with φ constraints
   * Always caps confidence at φ⁻¹, always maintains φ⁻² doubt
   *
   * @param {Object} item - Ingested item
   * @returns {Object} { confidence, doubt, verdict, raw, reasoning }
   */
  async judge(item) {
    // Get raw evaluation score
    const { score: raw, reasoning } = await this.evaluate(item);

    // Apply φ constraints - THE CORE PHILOSOPHY
    // NEVER too confident - cap at φ⁻¹ (61.8%)
    const confidence = Math.min(raw, this.options.confidenceCeiling);

    // ALWAYS maintain doubt - floor at φ⁻² (38.2%)
    const doubt = Math.max(1 - confidence, this.options.doubtFloor);

    // Determine verdict
    let verdict;
    if (confidence >= this.options.transformThreshold) {
      verdict = VERDICT.ACCEPT;
    } else {
      verdict = VERDICT.VERIFY;
    }

    return {
      confidence,
      doubt,
      verdict,
      raw,          // Original score before φ constraints
      reasoning,
      _phi: {
        ceiling_applied: raw > this.options.confidenceCeiling,
        floor_applied: (1 - confidence) < this.options.doubtFloor,
        philosophy: "φ qui se méfie de φ"
      }
    };
  }

  /**
   * Evaluate: Core scoring logic
   * Can be overridden or use pluggable evaluator
   *
   * @param {Object} item - Ingested item
   * @returns {Object} { score: 0-1, reasoning: string }
   */
  async evaluate(item) {
    // Use pluggable evaluator if provided
    if (this.evaluator) {
      return await this.evaluator.evaluate(item);
    }

    // Default simple evaluation (Option A from planning)
    const scores = {
      hasSource: item.source && item.source !== 'unknown' ? 0.8 : 0.3,
      hasContent: item.content && item.content.length > 0 ? 0.7 : 0.2,
      hasMetadata: Object.keys(item.metadata || {}).length > 0 ? 0.6 : 0.4
    };

    const score = (scores.hasSource + scores.hasContent + scores.hasMetadata) / 3;

    const reasoning = [
      `source: ${scores.hasSource.toFixed(2)}`,
      `content: ${scores.hasContent.toFixed(2)}`,
      `metadata: ${scores.hasMetadata.toFixed(2)}`
    ].join(', ');

    return { score, reasoning };
  }

  /**
   * Transform: Evolve the item based on judgment
   * Not accept/reject, but transformation
   *
   * @param {Object} item - Ingested item
   * @param {Object} judgment - Judgment result
   * @returns {Object} Transformed result
   */
  async transform(item, judgment) {
    const result = {
      original: item,
      judgment,
      transformed: null,
      action: null
    };

    if (judgment.verdict === VERDICT.ACCEPT) {
      // High confidence - pass through with φ stamp
      result.transformed = {
        ...item,
        _cynic: {
          verified: true,
          confidence: judgment.confidence,
          doubt: judgment.doubt,
          timestamp: new Date().toISOString()
        }
      };
      result.action = 'PASS_WITH_DOUBT';

    } else if (judgment.verdict === VERDICT.VERIFY) {
      // Low confidence - flag for verification
      result.transformed = {
        ...item,
        _cynic: {
          verified: false,
          confidence: judgment.confidence,
          doubt: judgment.doubt,
          needs_verification: true,
          suggested_checks: this._suggestVerification(item, judgment),
          timestamp: new Date().toISOString()
        }
      };
      result.action = 'FLAG_FOR_VERIFICATION';
    }

    return result;
  }

  /**
   * Suggest verification steps for low-confidence items
   * @private
   */
  _suggestVerification(item, judgment) {
    const suggestions = [];

    if (!item.source || item.source === 'unknown') {
      suggestions.push('Verify source authenticity');
    }

    if (!item.content || item.content.length < 10) {
      suggestions.push('Request more context');
    }

    if (judgment.raw < 0.3) {
      suggestions.push('Cross-reference with existing knowledge');
    }

    return suggestions.length > 0 ? suggestions : ['Manual review recommended'];
  }

  /**
   * Record judgment in history for self-calibration
   * @private
   */
  _recordHistory(entry) {
    this.history.push({
      timestamp: new Date().toISOString(),
      confidence: entry.judgment.confidence,
      verdict: entry.judgment.verdict,
      source: entry.ingested.source
    });

    // Trim history
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  /**
   * Get self-calibration metrics
   * CYNIC judging CYNIC
   */
  getSelfMetrics() {
    if (this.history.length === 0) {
      return {
        judgments: 0,
        avgConfidence: 0,
        avgDoubt: 1,
        acceptRate: 0,
        verifyRate: 0
      };
    }

    const avgConfidence = this.history.reduce((sum, h) => sum + h.confidence, 0) / this.history.length;
    const accepts = this.history.filter(h => h.verdict === VERDICT.ACCEPT).length;
    const verifies = this.history.filter(h => h.verdict === VERDICT.VERIFY).length;

    return {
      judgments: this.history.length,
      avgConfidence: Math.round(avgConfidence * 1000) / 1000,
      avgDoubt: Math.round((1 - avgConfidence) * 1000) / 1000,
      acceptRate: Math.round((accepts / this.history.length) * 1000) / 1000,
      verifyRate: Math.round((verifies / this.history.length) * 1000) / 1000,
      _phi: {
        ceiling: this.options.confidenceCeiling,
        floor: this.options.doubtFloor,
        philosophy: "Self-judgment is continuous"
      }
    };
  }

  /**
   * Simple hash for tracking
   * @private
   */
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

/**
 * Create a CYNIC instance with default settings
 */
function createCYNIC(options = {}) {
  return new CYNIC(options);
}

/**
 * Quick judgment without full cycle
 * Useful for simple confidence checks
 */
async function quickJudge(input, source = 'unknown') {
  const cynic = new CYNIC();
  const ingested = await cynic.ingest(input, source);
  return await cynic.judge(ingested);
}

module.exports = {
  CYNIC,
  createCYNIC,
  quickJudge,
  VERDICT,
  // Export constants for external use
  PHI_CEILING: PHI_INV,
  PHI_FLOOR: PHI_INV_2
};
