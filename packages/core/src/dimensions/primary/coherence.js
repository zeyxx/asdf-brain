/**
 * COHERENCE Dimension Evaluator
 *
 * World: ATZILUT (Emanation)
 * Axiom: PHI ("All ratios derive from φ")
 * Category: PRIMARY
 *
 * Question: "Is it coherent with the whole?"
 *
 * This evaluator checks:
 * - Internal consistency
 * - External alignment with context
 * - Pattern matching with existing knowledge
 * - Cross-reference validation
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class CoherenceEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'COHERENCE',
      category: 'PRIMARY',
      world: 'ATZILUT',
      axiom: 'PHI',
      threshold: 70,
      question: 'Is it coherent with the whole?',
    });
  }

  async evaluate(observation, context = {}) {
    const details = {};
    const scores = [];

    // Handle code as special case
    if (typeof observation === 'string') {
      return this._evaluateCodeCoherence(observation);
    }

    // 1. Internal consistency (35 points)
    const internalScore = this._evaluateInternalConsistency(observation);
    scores.push({ value: internalScore.score, weight: 1.2 });
    details.internal = internalScore;

    // 2. External alignment (35 points)
    const externalScore = this._evaluateExternalAlignment(observation, context);
    scores.push({ value: externalScore.score, weight: 1.2 });
    details.external = externalScore;

    // 3. Pattern coherence (30 points)
    const patternScore = this._evaluatePatternCoherence(observation, context);
    scores.push({ value: patternScore.score, weight: 1.0 });
    details.patterns = patternScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateInternalConsistency(obs) {
    let score = 65;
    const reasons = [];

    // Check for contradicting fields
    if (obs.parts && Array.isArray(obs.parts)) {
      const partTypes = new Set(obs.parts.map(p => p.type));
      if (partTypes.size === 1) {
        score += 20;
        reasons.push('homogeneous parts');
      } else if (partTypes.size <= 3) {
        score += 10;
        reasons.push('mostly consistent parts');
      }
    }

    // Check field consistency
    if (obs.type && obs.content) {
      const typeContentMatch = this._checkTypeContentMatch(obs.type, obs.content);
      score += typeContentMatch ? 15 : -10;
      reasons.push(typeContentMatch ? 'type matches content' : 'type/content mismatch');
    }

    // Check for self-reference consistency
    if (obs.id && obs.references) {
      const selfRef = obs.references.includes(obs.id);
      if (!selfRef) {
        score += 5;
        reasons.push('no circular reference');
      }
    }

    // Validate numeric consistency
    if (obs.score !== undefined && obs.confidence !== undefined) {
      const consistent = (obs.score <= 100 && obs.confidence <= 100);
      score += consistent ? 10 : -15;
      reasons.push(consistent ? 'numeric ranges valid' : 'numeric inconsistency');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateExternalAlignment(obs, context) {
    let score = 60;
    const reasons = [];

    // Check alignment with context
    if (context.existing && Array.isArray(context.existing)) {
      const aligned = this._checkAlignment(obs, context.existing);
      score = aligned;
      reasons.push(`aligned with ${context.existing.length} existing items`);
    }

    // Check project alignment
    if (obs.project && context.project) {
      if (obs.project === context.project) {
        score += 15;
        reasons.push('project aligned');
      }
    }

    // Check world alignment
    if (obs.world && ['ATZILUT', 'BERIAH', 'YETZIRAH', 'ASSIAH'].includes(obs.world)) {
      score += 10;
      reasons.push(`world: ${obs.world}`);
    }

    // Check axiom alignment
    if (obs.axiom && ['PHI', 'VERIFY', 'CULTURE', 'BURN'].includes(obs.axiom)) {
      score += 10;
      reasons.push(`axiom: ${obs.axiom}`);
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluatePatternCoherence(obs, context) {
    let score = 60;
    const reasons = [];

    // Check against known patterns
    if (context.patterns && Array.isArray(context.patterns)) {
      const matches = context.patterns.filter(p => this._matchesPattern(obs, p));
      if (matches.length > 0) {
        score += Math.min(30, matches.length * 10);
        reasons.push(`matches ${matches.length} patterns`);
      }
    }

    // Check structure coherence
    if (obs.structure) {
      const validStructure = ['hierarchical', 'flat', 'graph', 'tree', 'matrix'];
      if (validStructure.includes(obs.structure)) {
        score += 10;
        reasons.push(`valid structure: ${obs.structure}`);
      }
    }

    // Check naming coherence
    if (obs.name) {
      const namePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
      if (namePattern.test(obs.name)) {
        score += 5;
        reasons.push('valid naming');
      }
    }

    return { score: Math.min(100, score), reasons };
  }

  _evaluateCodeCoherence(code) {
    const checks = [];
    const codeStr = String(code);

    // 1. Consistent use of async/await vs callbacks
    const hasAsync = /async\s+(function|\w+\s*\()/.test(codeStr);
    const hasCallbacks = /\.(then|catch)\s*\(/.test(codeStr);
    const hasRawCallbacks = /function\s*\([^)]*callback[^)]*\)/.test(codeStr);

    if (hasAsync && !hasRawCallbacks) {
      checks.push({ name: 'async_consistent', score: 85 });
    } else if (!hasAsync && hasCallbacks) {
      checks.push({ name: 'promise_consistent', score: 75 });
    } else if (hasAsync && hasRawCallbacks) {
      checks.push({ name: 'mixed_async', score: 55 });
    }

    // 2. Consistent error handling
    const tryCatch = (codeStr.match(/try\s*\{/g) || []).length;
    const throwNew = (codeStr.match(/throw\s+new/g) || []).length;
    if (tryCatch > 0 && throwNew > 0) {
      checks.push({ name: 'error_handling', score: 80 });
    }

    // 3. Import style consistency
    const requireImports = (codeStr.match(/require\s*\(/g) || []).length;
    const esImports = (codeStr.match(/import\s+.*from/g) || []).length;
    if ((requireImports > 0) !== (esImports > 0)) {
      checks.push({ name: 'import_consistent', score: 85 });
    } else if (requireImports > 0 && esImports > 0) {
      checks.push({ name: 'import_mixed', score: 50 });
    }

    // 4. Naming convention consistency
    const camelCase = (codeStr.match(/\b[a-z][a-zA-Z0-9]*\s*[=:]/g) || []).length;
    const snake_case = (codeStr.match(/\b[a-z]+_[a-z]+\s*[=:]/g) || []).length;
    if (camelCase > snake_case * 3) {
      checks.push({ name: 'camelCase_consistent', score: 85 });
    } else if (snake_case > camelCase * 3) {
      checks.push({ name: 'snake_case_consistent', score: 85 });
    } else if (camelCase > 0 && snake_case > 0) {
      checks.push({ name: 'naming_mixed', score: 55 });
    }

    if (checks.length === 0) {
      return this.createResult(65, 'Limited coherence data', { checks: [] });
    }

    const score = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
    const consistent = checks.filter(c => c.score >= 75).map(c => c.name);

    return this.createResult(
      Math.round(score),
      consistent.length > 0 ? `Coherent: ${consistent.join(', ')}` : 'Mixed coherence',
      { checks, consistent }
    );
  }

  _checkTypeContentMatch(type, content) {
    const typeStr = String(type).toLowerCase();
    const contentStr = JSON.stringify(content).substring(0, 500).toLowerCase();

    // Type-specific checks
    if (typeStr === 'decision' && (contentStr.includes('chose') || contentStr.includes('decided'))) {
      return true;
    }
    if (typeStr === 'pattern' && (contentStr.includes('pattern') || contentStr.includes('recurring'))) {
      return true;
    }
    if (typeStr === 'code' && (contentStr.includes('function') || contentStr.includes('class'))) {
      return true;
    }

    return true; // Default to match
  }

  _checkAlignment(item, existing) {
    if (!existing.length) return 70;

    // Simple similarity check
    const itemStr = JSON.stringify(item).toLowerCase();
    let similarCount = 0;

    for (const ex of existing.slice(0, 10)) {
      const exStr = JSON.stringify(ex).toLowerCase();
      const overlap = this._calculateOverlap(itemStr, exStr);
      if (overlap > 0.1) similarCount++;
    }

    return Math.min(100, 50 + (similarCount * 10));
  }

  _calculateOverlap(str1, str2) {
    const words1 = new Set(str1.match(/\w+/g) || []);
    const words2 = new Set(str2.match(/\w+/g) || []);
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    return intersection.size / Math.max(words1.size, words2.size);
  }

  _matchesPattern(item, pattern) {
    if (pattern.type && item.type !== pattern.type) return false;
    if (pattern.category && item.category !== pattern.category) return false;
    return true;
  }

  _buildReasoning(details, finalScore) {
    const parts = [];

    if (finalScore >= this.threshold) {
      parts.push(`✅ COHERENCE (${finalScore.toFixed(1)} >= ${this.threshold})`);
    } else {
      parts.push(`❌ COHERENCE (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    if (details.internal?.score < 60) {
      parts.push('internal inconsistency');
    }
    if (details.external?.score < 60) {
      parts.push('external misalignment');
    }

    return parts.join(' | ');
  }
}

module.exports = {
  CoherenceEvaluator,
  evaluator: new CoherenceEvaluator(),
};
