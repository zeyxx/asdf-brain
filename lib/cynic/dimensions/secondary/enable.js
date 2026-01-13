/**
 * ENABLE Dimension Evaluator
 *
 * World: YETZIRAH (Formation)
 * Axiom: CULTURE ("Culture is a moat")
 * Category: SECONDARY
 *
 * Question: "Does it enable humans?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class EnableEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'ENABLE',
      category: 'SECONDARY',
      world: 'YETZIRAH',
      axiom: 'CULTURE',
      threshold: 70,
      question: 'Does it enable humans?',
    });
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Human empowerment (40 points)
    const empowerScore = this._evaluateEmpowerment(observation);
    scores.push({ value: empowerScore.score, weight: 1.2 });
    details.empowerment = empowerScore;

    // 2. Accessibility (35 points)
    const accessScore = this._evaluateAccessibility(observation);
    scores.push({ value: accessScore.score, weight: 1.0 });
    details.accessibility = accessScore;

    // 3. Autonomy preservation (25 points)
    const autonomyScore = this._evaluateAutonomy(observation);
    scores.push({ value: autonomyScore.score, weight: 0.8 });
    details.autonomy = autonomyScore;

    // 4. Capability Matrix (25 points) - NEW: Explicit capability tracking
    const capabilityScore = this._evaluateCapabilityMatrix(observation);
    scores.push({ value: capabilityScore.score, weight: 0.8 });
    details.capabilityMatrix = capabilityScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateEmpowerment(obs) {
    let score = 55;
    const reasons = [];
    const text = JSON.stringify(obs).toLowerCase();

    // Empowerment markers
    if (obs.enables === true || obs.empowers === true) {
      score += 30;
      reasons.push('explicitly empowering');
    }

    if (text.includes('enable') || text.includes('empower') || text.includes('help')) {
      score += 15;
      reasons.push('empowerment language');
    }

    if (obs.userCentric === true || obs.humanFirst === true) {
      score += 20;
      reasons.push('human-first');
    }

    // Tool for humans, not replacement
    if (obs.tool === true || obs.assistant === true) {
      score += 15;
      reasons.push('tool/assistant');
    }

    // Replacement indicators (negative)
    if (obs.automates === true && !obs.assists) {
      score -= 15;
      reasons.push('automation over enablement');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateAccessibility(obs) {
    let score = 55;
    const reasons = [];

    if (obs.accessible === true) {
      score += 25;
      reasons.push('accessible');
    }

    if (obs.documentation === true || obs.docs === true) {
      score += 15;
      reasons.push('documented');
    }

    if (obs.easyToUse === true || obs.userFriendly === true) {
      score += 15;
      reasons.push('user-friendly');
    }

    if (obs.openSource === true) {
      score += 10;
      reasons.push('open source');
    }

    // Barriers
    if (obs.requiresExpertise === true) {
      score -= 15;
      reasons.push('requires expertise');
    }

    if (obs.paywall === true) {
      score -= 20;
      reasons.push('paywalled');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateAutonomy(obs) {
    let score = 60;
    const reasons = [];

    // Autonomy preservation
    if (obs.preservesAutonomy === true || obs.optIn === true) {
      score += 25;
      reasons.push('preserves autonomy');
    }

    if (obs.optional === true || obs.flexible === true) {
      score += 15;
      reasons.push('optional/flexible');
    }

    if (obs.transparent === true) {
      score += 10;
      reasons.push('transparent');
    }

    // Autonomy reduction
    if (obs.mandatory === true || obs.required === true) {
      score -= 15;
      reasons.push('mandatory');
    }

    if (obs.lockin === true || obs.vendorLock === true) {
      score -= 25;
      reasons.push('vendor lock-in');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  /**
   * Evaluate capability matrix - what human capabilities are enabled?
   * Core capabilities: Education, Creation, Decision, Automation, Collaboration, Ownership
   * "Culture is a moat" - enhance human capabilities, don't replace them
   */
  _evaluateCapabilityMatrix(obs) {
    let score = 50;
    const reasons = [];
    const capabilityScores = {
      EDUCATION: 50,     // Teaches, explains, informs
      CREATION: 50,      // Helps create, build, design
      DECISION: 50,      // Helps decide, choose, evaluate
      AUTOMATION: 50,    // Automates repetitive (not judgment)
      COLLABORATION: 50, // Enables teamwork, sharing
      OWNERSHIP: 50,     // Preserves user control
    };

    const text = JSON.stringify(obs).toLowerCase();

    // === EDUCATION: "Teaching > Doing for them" ===
    if (obs.teaches === true || obs.educational === true) {
      capabilityScores.EDUCATION += 30;
      reasons.push('education ✓');
    }
    if (text.includes('learn') || text.includes('teach') || text.includes('explain')) {
      capabilityScores.EDUCATION += 15;
    }
    if (obs.documentation === true || obs.tutorial === true) {
      capabilityScores.EDUCATION += 15;
      reasons.push('documented');
    }
    if (obs.obscure === true || obs.blackbox === true) {
      capabilityScores.EDUCATION -= 25;
      reasons.push('obscure ⚠️');
    }

    // === CREATION: "Amplify creativity, don't replace it" ===
    if (obs.creativeTools === true || obs.creation === true) {
      capabilityScores.CREATION += 30;
      reasons.push('creation ✓');
    }
    if (text.includes('create') || text.includes('build') || text.includes('design')) {
      capabilityScores.CREATION += 15;
    }
    if (obs.templates === true || obs.scaffolding === true) {
      capabilityScores.CREATION += 15;
      reasons.push('scaffolding');
    }
    if (obs.generatesForYou === true && !obs.userInput) {
      capabilityScores.CREATION -= 20;
      reasons.push('generates without input ⚠️');
    }

    // === DECISION: "Inform decisions, don't make them" ===
    if (obs.informsDecision === true || obs.analytics === true) {
      capabilityScores.DECISION += 30;
      reasons.push('decision support ✓');
    }
    if (text.includes('decide') || text.includes('choose') || text.includes('evaluate')) {
      capabilityScores.DECISION += 15;
    }
    if (obs.transparent === true || obs.explainable === true) {
      capabilityScores.DECISION += 20;
      reasons.push('explainable');
    }
    if (obs.decidesForYou === true || obs.autoDecision === true) {
      capabilityScores.DECISION -= 30;
      reasons.push('auto-decides ⚠️');
    }

    // === AUTOMATION: "Automate the tedious, not the thinking" ===
    if (obs.automatesRepetitive === true || obs.workflow === true) {
      capabilityScores.AUTOMATION += 30;
      reasons.push('automation ✓');
    }
    if (text.includes('automate') || text.includes('workflow') || text.includes('batch')) {
      capabilityScores.AUTOMATION += 15;
    }
    if (obs.humanInLoop === true || obs.reviewStep === true) {
      capabilityScores.AUTOMATION += 20;
      reasons.push('human-in-loop');
    }
    if (obs.fullyAutonomous === true && !obs.humanInLoop) {
      capabilityScores.AUTOMATION -= 25;
      reasons.push('fully autonomous ⚠️');
    }

    // === COLLABORATION: "Together > Alone" ===
    if (obs.collaborative === true || obs.teamwork === true) {
      capabilityScores.COLLABORATION += 30;
      reasons.push('collaboration ✓');
    }
    if (text.includes('share') || text.includes('team') || text.includes('together')) {
      capabilityScores.COLLABORATION += 15;
    }
    if (obs.multiplayer === true || obs.realtime === true) {
      capabilityScores.COLLABORATION += 15;
      reasons.push('realtime collab');
    }
    if (obs.isolated === true || obs.silos === true) {
      capabilityScores.COLLABORATION -= 20;
      reasons.push('isolated ⚠️');
    }

    // === OWNERSHIP: "Your data, your work, your control" ===
    if (obs.userOwned === true || obs.selfHosted === true) {
      capabilityScores.OWNERSHIP += 35;
      reasons.push('ownership ✓');
    }
    if (obs.exportable === true || obs.portable === true) {
      capabilityScores.OWNERSHIP += 20;
      reasons.push('portable');
    }
    if (obs.localFirst === true || obs.offlineCapable === true) {
      capabilityScores.OWNERSHIP += 15;
      reasons.push('local-first');
    }
    if (obs.cloudOnly === true || obs.noExport === true) {
      capabilityScores.OWNERSHIP -= 30;
      reasons.push('cloud lock-in ⚠️');
    }

    // Clamp all capability scores
    for (const key of Object.keys(capabilityScores)) {
      capabilityScores[key] = Math.max(0, Math.min(100, capabilityScores[key]));
    }

    // Calculate weighted average
    const capabilities = Object.values(capabilityScores);
    score = capabilities.reduce((sum, c) => sum + c, 0) / capabilities.length;

    // Count enabled vs diminished capabilities
    const enabledCount = capabilities.filter(c => c >= 60).length;
    const diminishedCount = capabilities.filter(c => c < 40).length;

    return {
      score: Math.max(0, Math.min(100, score)),
      reasons,
      capabilityScores,
      summary: {
        enabled: enabledCount,
        diminished: diminishedCount,
        total: 6,
        verdict: enabledCount >= 4 ? 'ENABLING' : diminishedCount >= 2 ? 'DIMINISHING' : 'NEUTRAL',
      },
    };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ ENABLE (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ ENABLE (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    // Highlight capability matrix
    if (details.capabilityMatrix?.summary) {
      const { verdict, enabled, total } = details.capabilityMatrix.summary;
      if (verdict === 'ENABLING') {
        parts.push(`${enabled}/${total} capabilities enabled`);
      } else if (verdict === 'DIMINISHING') {
        parts.push('capabilities diminished ⚠️');
      }
    }

    if (details.empowerment?.score >= 80) parts.push('empowering');
    if (details.autonomy?.score < 50) parts.push('autonomy concerns');
    return parts.join(' | ');
  }
}

module.exports = { EnableEvaluator, evaluator: new EnableEvaluator() };
