/**
 * SIMPLIFY Dimension Evaluator
 *
 * World: ATZILUT (Emanation)
 * Axiom: PHI ("All ratios derive from φ")
 * Category: SECONDARY
 *
 * Question: "Is it as simple as possible?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class SimplifyEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'SIMPLIFY',
      category: 'SECONDARY',
      world: 'ATZILUT',
      axiom: 'PHI',
      threshold: 60,
      question: 'Is it as simple as possible?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // Handle code specially
    if (typeof observation === 'string') {
      return this._evaluateCodeSimplicity(observation);
    }

    // 1. Structural simplicity (40 points)
    const structureScore = this._evaluateStructure(observation);
    scores.push({ value: structureScore.score, weight: 1.2 });
    details.structure = structureScore;

    // 2. Conceptual clarity (35 points)
    const clarityScore = this._evaluateClarity(observation);
    scores.push({ value: clarityScore.score, weight: 1.0 });
    details.clarity = clarityScore;

    // 3. Minimalism (25 points)
    const minimalScore = this._evaluateMinimalism(observation);
    scores.push({ value: minimalScore.score, weight: 0.8 });
    details.minimalism = minimalScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateStructure(obs) {
    let score = 65;
    const reasons = [];

    // Depth/nesting
    const depth = this._calculateDepth(obs);
    if (depth <= 3) {
      score += 25;
      reasons.push('shallow structure');
    } else if (depth > 6) {
      score -= 15;
      reasons.push('deep nesting');
    }

    // Field count
    const fieldCount = Object.keys(obs).length;
    if (fieldCount <= 5) {
      score += 15;
      reasons.push('few fields');
    } else if (fieldCount <= 10) {
      score += 5;
    } else if (fieldCount > 20) {
      score -= 15;
      reasons.push('many fields');
    }

    // Flat structure marker
    if (obs.flat === true || obs.simple === true) {
      score += 10;
      reasons.push('marked simple');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateClarity(obs) {
    let score = 60;
    const reasons = [];

    // Clear type
    if (this.exists(obs.type)) {
      score += 15;
      reasons.push('typed');
    }

    // Clear name
    if (this.exists(obs.name) && obs.name.length < 30) {
      score += 10;
      reasons.push('named');
    }

    // Description
    if (this.exists(obs.description) && obs.description.length < 200) {
      score += 15;
      reasons.push('described');
    }

    // Single responsibility
    if (obs.singleResponsibility === true || obs.focused === true) {
      score += 15;
      reasons.push('focused');
    }

    return { score: Math.min(100, score), reasons };
  }

  _evaluateMinimalism(obs) {
    let score = 60;
    const reasons = [];

    const jsonSize = JSON.stringify(obs).length;
    if (jsonSize < 200) {
      score += 25;
      reasons.push('minimal');
    } else if (jsonSize < 500) {
      score += 15;
      reasons.push('compact');
    } else if (jsonSize > 2000) {
      score -= 15;
      reasons.push('large');
    }

    // No redundancy markers
    if (obs.normalized === true || obs.dry === true) {
      score += 15;
      reasons.push('normalized');
    }

    return { score: Math.min(100, score), reasons };
  }

  _evaluateCodeSimplicity(code) {
    const lines = code.split('\n');
    let score = 60;
    const checks = [];

    // Line count
    if (lines.length < 50) {
      checks.push({ name: 'short', score: 85 });
    } else if (lines.length < 150) {
      checks.push({ name: 'moderate', score: 70 });
    } else {
      checks.push({ name: 'long', score: 50 });
    }

    // Cyclomatic complexity proxy (if/else/for/while count)
    const controlFlow = (code.match(/\b(if|else|for|while|switch|case)\b/g) || []).length;
    if (controlFlow < 5) {
      checks.push({ name: 'low_complexity', score: 85 });
    } else if (controlFlow < 15) {
      checks.push({ name: 'moderate_complexity', score: 65 });
    } else {
      checks.push({ name: 'high_complexity', score: 45 });
    }

    // Nesting depth
    const maxIndent = Math.max(...lines.map(l => (l.match(/^(\s*)/) || [''])[0].length));
    if (maxIndent <= 8) {
      checks.push({ name: 'flat', score: 85 });
    } else if (maxIndent <= 16) {
      checks.push({ name: 'some_nesting', score: 65 });
    }

    score = checks.reduce((s, c) => s + c.score, 0) / checks.length;
    return this.createResult(Math.round(score), `Code simplicity: ${checks.map(c => c.name).join(', ')}`, { checks });
  }

  _calculateDepth(obj, depth = 0) {
    if (typeof obj !== 'object' || obj === null) return depth;
    let maxDepth = depth;
    for (const value of Object.values(obj)) {
      maxDepth = Math.max(maxDepth, this._calculateDepth(value, depth + 1));
    }
    return maxDepth;
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ SIMPLIFY (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ SIMPLIFY (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.structure?.score < 50) parts.push('complex structure');
    return parts.join(' | ');
  }
}

module.exports = { SimplifyEvaluator, evaluator: new SimplifyEvaluator() };
