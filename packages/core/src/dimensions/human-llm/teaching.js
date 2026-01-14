/**
 * TEACHING Dimension Evaluator
 *
 * World: YETZIRAH (Formation - teaching forms understanding)
 * Axiom: CULTURE (Teaching builds culture)
 * Category: HUMAN_LLM
 *
 * Question: "Does it help humans learn?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class TeachingEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'TEACHING',
      category: 'HUMAN_LLM',
      world: 'YETZIRAH',
      axiom: 'CULTURE',
      threshold: 65,
      question: 'Does it help humans learn?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Explanation quality (40 points)
    const explanationScore = this._evaluateExplanation(observation);
    scores.push({ value: explanationScore.score, weight: 1.2 });
    details.explanation = explanationScore;

    // 2. Scaffolding (35 points)
    const scaffoldScore = this._evaluateScaffolding(observation);
    scores.push({ value: scaffoldScore.score, weight: 1.0 });
    details.scaffolding = scaffoldScore;

    // 3. Empowerment (25 points)
    const empowerScore = this._evaluateEmpowerment(observation);
    scores.push({ value: empowerScore.score, weight: 0.8 });
    details.empowerment = empowerScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateExplanation(obs) {
    let score = 55;
    const reasons = [];
    const text = JSON.stringify(obs).toLowerCase();

    // Clear explanations
    if (obs.explains === true || text.includes('because') || text.includes('why')) {
      score += 20;
      reasons.push('provides explanations');
    }

    // Examples given
    if (obs.examples === true || text.includes('example') || text.includes('for instance')) {
      score += 20;
      reasons.push('uses examples');
    }

    // Step-by-step
    if (obs.stepByStep === true) {
      score += 15;
      reasons.push('step-by-step');
    }

    // Just gives answer without explanation
    if (obs.justAnswer === true || obs.noExplanation === true) {
      score -= 25;
      reasons.push('no explanation');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateScaffolding(obs) {
    let score = 55;
    const reasons = [];

    // Builds on prior knowledge
    if (obs.buildsPriorKnowledge === true) {
      score += 25;
      reasons.push('builds on prior knowledge');
    }

    // Appropriate complexity
    if (obs.appropriateLevel === true) {
      score += 20;
      reasons.push('right complexity level');
    }

    // Progressive disclosure
    if (obs.progressiveDisclosure === true) {
      score += 15;
      reasons.push('progressive disclosure');
    }

    // Too complex or too simple
    if (obs.tooComplex === true) {
      score -= 20;
      reasons.push('too complex');
    }
    if (obs.tooSimple === true) {
      score -= 10;
      reasons.push('oversimplified');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateEmpowerment(obs) {
    let score = 60;
    const reasons = [];

    // Teaches to fish
    if (obs.teachesToFish === true || obs.buildSkills === true) {
      score += 30;
      reasons.push('builds lasting skills');
    }

    // Encourages exploration
    if (obs.encouragesExploration === true) {
      score += 15;
      reasons.push('encourages exploration');
    }

    // Creates dependency
    if (obs.createsDependency === true) {
      score -= 25;
      reasons.push('creates dependency ⚠️');
    }

    return { score: Math.min(100, score), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ TEACHING (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ TEACHING (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.empowerment?.score >= 80) parts.push('empowering');
    return parts.join(' | ');
  }
}

module.exports = { TeachingEvaluator, evaluator: new TeachingEvaluator() };
