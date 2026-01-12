/**
 * HARMONY Dimension Evaluator
 *
 * World: ATZILUT (Emanation)
 * Axiom: PHI ("All ratios derive from φ")
 * Category: PRIMARY
 *
 * Question: "L'équilibre φ est-il respecté?"
 *
 * This evaluator checks:
 * - φ-ratio presence (1.618...)
 * - Balanced structure
 * - Code elegance patterns
 * - Golden proportions
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class HarmonyEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'HARMONY',
      category: 'PRIMARY',
      world: 'ATZILUT',
      axiom: 'PHI',
      threshold: 60,
      question: "L'équilibre φ est-il respecté?",
    });
  }

  /**
   * Evaluate harmony/φ-balance of an observation
   */
  async evaluate(observation, context = {}) {
    const details = {};

    // Detect type and route to appropriate evaluation
    if (typeof observation === 'string') {
      return this._evaluateCode(observation);
    }

    const scores = [];

    // 1. φ-ratio checks (40 points max)
    const phiScore = this._evaluatePhiRatios(observation);
    scores.push({ value: phiScore.score, weight: 1.5 });
    details.phiRatios = phiScore;

    // 2. Balance checks (30 points max)
    const balanceScore = this._evaluateBalance(observation);
    scores.push({ value: balanceScore.score, weight: 1.0 });
    details.balance = balanceScore;

    // 3. Structure harmony (30 points max)
    const structureScore = this._evaluateStructure(observation);
    scores.push({ value: structureScore.score, weight: 1.0 });
    details.structure = structureScore;

    // Calculate weighted average
    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  // ===========================================================================
  // SUB-EVALUATORS
  // ===========================================================================

  _evaluatePhiRatios(obs) {
    let score = 70; // Base score - assume neutral
    const reasons = [];

    // Check for explicit ratio field
    if (obs.ratio !== undefined) {
      const deviation = Math.abs(obs.ratio - this.PHI) / this.PHI;
      const ratioScore = Math.max(0, 100 - deviation * 100);
      score = ratioScore;
      reasons.push(`ratio: ${obs.ratio.toFixed(3)} (déviation: ${(deviation * 100).toFixed(1)}%)`);
    }

    // Check for φ-derived values
    if (obs.confidence !== undefined) {
      // Confidence should be ≤ 61.8%
      if (obs.confidence <= this.PHI_INV * 100) {
        score = Math.max(score, 80);
        reasons.push('confidence φ-constrained');
      }
    }

    // Check thresholds
    if (obs.threshold !== undefined) {
      const isPhiDerived = Math.abs(obs.threshold - 61.8) < 1 ||
                          Math.abs(obs.threshold - 38.2) < 1;
      if (isPhiDerived) {
        score = Math.max(score, 85);
        reasons.push('threshold φ-derived');
      }
    }

    // Check weights
    if (obs.weight !== undefined) {
      const isPhiWeight = Math.abs(obs.weight - this.PHI) < 0.01 ||
                         Math.abs(obs.weight - this.PHI_SQ) < 0.01 ||
                         Math.abs(obs.weight - this.PHI_INV) < 0.01;
      if (isPhiWeight) {
        score = Math.max(score, 85);
        reasons.push('weight φ-derived');
      }
    }

    return {
      score: Math.min(100, score),
      reasons: reasons.length > 0 ? reasons : ['no φ-ratios detected']
    };
  }

  _evaluateBalance(obs) {
    let score = 60;
    const reasons = [];

    // Check for weights array
    if (obs.weights && Array.isArray(obs.weights)) {
      const isBalanced = this._checkPhiBalance(obs.weights);
      score = isBalanced ? 90 : 50;
      reasons.push(isBalanced ? 'weights balanced' : 'weights imbalanced');
    }

    // Check for parts/components
    if (obs.parts && Array.isArray(obs.parts)) {
      const partCount = obs.parts.length;
      // Fibonacci numbers are harmonious
      const fibNumbers = [1, 2, 3, 5, 8, 13, 21];
      if (fibNumbers.includes(partCount)) {
        score = Math.max(score, 80);
        reasons.push(`${partCount} parts (Fibonacci)`);
      }
    }

    // Check dimensions count
    if (obs.dimensions !== undefined) {
      const dimCount = typeof obs.dimensions === 'number' ? obs.dimensions : Object.keys(obs.dimensions).length;
      // 8, 16, 24 are harmonious (8 × 1, 2, 3)
      if ([8, 16, 24].includes(dimCount)) {
        score = Math.max(score, 85);
        reasons.push(`${dimCount} dimensions (harmonious)`);
      }
    }

    return {
      score,
      reasons: reasons.length > 0 ? reasons : ['no balance data']
    };
  }

  _evaluateStructure(obs) {
    let score = 65;
    const reasons = [];

    // Check for hierarchical structure
    if (obs.layers || obs.levels || obs.hierarchy) {
      score = Math.max(score, 75);
      reasons.push('hierarchical structure');
    }

    // Check for 4 worlds alignment
    if (obs.world || obs.worlds) {
      score = Math.max(score, 80);
      reasons.push('world-aligned');
    }

    // Check for axiom alignment
    if (obs.axiom || obs.axioms) {
      score = Math.max(score, 80);
      reasons.push('axiom-aligned');
    }

    // Check for symmetry
    if (obs.symmetric === true || obs.balanced === true) {
      score = Math.max(score, 85);
      reasons.push('symmetric');
    }

    return {
      score,
      reasons: reasons.length > 0 ? reasons : ['basic structure']
    };
  }

  _checkPhiBalance(weights) {
    if (!weights || weights.length < 2) return false;

    // Check if weights follow φ progression
    for (let i = 0; i < weights.length - 1; i++) {
      const ratio = weights[i] / weights[i + 1];
      const deviation = Math.abs(ratio - this.PHI) / this.PHI;
      if (deviation < 0.2) return true; // Within 20% of φ
    }

    // Check if weights are equal (also balanced)
    const allEqual = weights.every(w => Math.abs(w - weights[0]) < 0.01);
    return allEqual;
  }

  // ===========================================================================
  // CODE EVALUATION (for code artifacts)
  // ===========================================================================

  _evaluateCode(code) {
    const checks = [];
    const codeStr = String(code);
    const lines = codeStr.split('\n');

    // 1. Naming conventions (camelCase functions, PascalCase classes)
    const camelCaseFunctions = (codeStr.match(/function\s+[a-z][a-zA-Z0-9]*\s*\(/g) || []).length;
    const pascalCaseClasses = (codeStr.match(/class\s+[A-Z][a-zA-Z0-9]*/g) || []).length;
    if (camelCaseFunctions > 3 || pascalCaseClasses > 0) {
      checks.push({ name: 'naming_conventions', score: 85 });
    }

    // 2. Documentation
    const docComments = (codeStr.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
    if (docComments >= 5) {
      checks.push({ name: 'documented', score: 90 });
    } else if (docComments >= 1) {
      checks.push({ name: 'documented', score: 75 });
    }

    // 3. Small functions
    const functionCount = (codeStr.match(/function\s+\w+|=>\s*\{|async\s+\w+\s*\(/g) || []).length;
    const linesPerFunction = functionCount > 0 ? lines.length / functionCount : 999;
    if (linesPerFunction < 30) {
      checks.push({ name: 'small_functions', score: 90 });
    } else if (linesPerFunction < 60) {
      checks.push({ name: 'small_functions', score: 75 });
    }

    // 4. Guard clauses
    const earlyReturns = (codeStr.match(/if\s*\([^)]+\)\s*\{?\s*return/g) || []).length;
    if (earlyReturns >= 3) {
      checks.push({ name: 'guard_clauses', score: 85 });
    }

    // 5. Flat structure (minimal nesting)
    const maxIndent = Math.max(...lines.map(l => {
      const match = l.match(/^(\s*)/);
      return match ? match[1].length : 0;
    }));
    if (maxIndent <= 12) {
      checks.push({ name: 'flat_structure', score: 90 });
    } else if (maxIndent <= 20) {
      checks.push({ name: 'flat_structure', score: 75 });
    }

    // 6. Named constants (no magic numbers)
    const hasConstants = /const\s+[A-Z_]{2,}\s*=/.test(codeStr);
    if (hasConstants) {
      checks.push({ name: 'named_constants', score: 85 });
    }

    // 7. Section organization
    const sectionComments = (codeStr.match(/\/\/\s*={3,}|\/\/\s*-{3,}/g) || []).length;
    if (sectionComments >= 3) {
      checks.push({ name: 'organized_sections', score: 85 });
    }

    if (checks.length === 0) {
      return this.createResult(60, 'Limited elegance patterns', { checks: [] });
    }

    const score = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
    const elegant = checks.filter(c => c.score >= 80).map(c => c.name);

    return this.createResult(
      Math.round(score),
      elegant.length > 0 ? `Elegant: ${elegant.join(', ')}` : 'Basic elegance',
      { checks, elegant }
    );
  }

  _buildReasoning(details, finalScore) {
    const parts = [];

    if (finalScore >= this.threshold) {
      parts.push(`✅ HARMONY (${finalScore.toFixed(1)} >= ${this.threshold})`);
    } else {
      parts.push(`❌ HARMONY insuffisant (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    // Add key findings
    if (details.phiRatios?.reasons?.length) {
      parts.push(`φ: ${details.phiRatios.reasons[0]}`);
    }

    return parts.join(' | ');
  }
}

module.exports = {
  HarmonyEvaluator,
  evaluator: new HarmonyEvaluator(),
};
