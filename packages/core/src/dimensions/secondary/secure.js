/**
 * SECURE Dimension Evaluator
 *
 * World: BERIAH (Creation)
 * Axiom: VERIFY (Security requires verification)
 * Category: SECONDARY
 *
 * Question: "Is it secure by design?"
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class SecureEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'SECURE',
      category: 'SECONDARY',
      world: 'BERIAH',
      axiom: 'VERIFY',
      threshold: 80,
      question: 'Is it secure by design?',
    });

    // Known vulnerability patterns to detect
    this.VULN_PATTERNS = [
      'eval', 'exec', 'shell', 'injection',
      'unsanitized', 'xss', 'csrf', 'sqli',
      'plaintext', 'unencrypted', 'hardcoded'
    ];
  }

  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Vulnerability presence (40 points)
    const vulnScore = this._evaluateVulnerabilities(observation);
    scores.push({ value: vulnScore.score, weight: 1.2 });
    details.vulnerabilities = vulnScore;

    // 2. Security practices (35 points)
    const practiceScore = this._evaluatePractices(observation);
    scores.push({ value: practiceScore.score, weight: 1.0 });
    details.practices = practiceScore;

    // 3. Defense in depth (25 points)
    const defenseScore = this._evaluateDefenseInDepth(observation);
    scores.push({ value: defenseScore.score, weight: 0.8 });
    details.defense = defenseScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateVulnerabilities(obs) {
    let score = 75;
    const reasons = [];
    const text = JSON.stringify(obs).toLowerCase();

    // Check for vulnerability patterns
    let vulnCount = 0;
    for (const pattern of this.VULN_PATTERNS) {
      if (text.includes(pattern)) vulnCount++;
    }

    if (vulnCount > 0) {
      score -= vulnCount * 10;
      reasons.push(`${vulnCount} vulnerability patterns detected`);
    } else {
      score += 15;
      reasons.push('no vulnerabilities detected');
    }

    // Explicit security markers
    if (obs.secure === true || obs.audited === true) {
      score += 20;
      reasons.push('marked secure/audited');
    }

    if (obs.vulnerabilities && obs.vulnerabilities.length > 0) {
      score -= obs.vulnerabilities.length * 15;
      reasons.push(`${obs.vulnerabilities.length} known vulnerabilities`);
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluatePractices(obs) {
    let score = 55;
    const reasons = [];

    // Encryption
    if (obs.encrypted === true || obs.usesEncryption === true) {
      score += 20;
      reasons.push('uses encryption');
    }

    // Input validation
    if (obs.validatesInput === true || obs.sanitized === true) {
      score += 15;
      reasons.push('validates input');
    }

    // Authentication
    if (obs.authenticated === true) {
      score += 15;
      reasons.push('authenticated');
    }

    // Authorization
    if (obs.authorized === true || obs.rbac === true) {
      score += 10;
      reasons.push('proper authorization');
    }

    // No auth
    if (obs.noAuth === true || obs.publicAccess === true) {
      score -= 20;
      reasons.push('no authentication');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateDefenseInDepth(obs) {
    let score = 60;
    const reasons = [];

    // Multiple layers
    if (obs.multilayerSecurity === true) {
      score += 25;
      reasons.push('multi-layer security');
    }

    // Rate limiting
    if (obs.rateLimited === true) {
      score += 15;
      reasons.push('rate limited');
    }

    // Logging/monitoring
    if (obs.securityLogging === true || obs.monitoring === true) {
      score += 15;
      reasons.push('security monitoring');
    }

    // Single point of failure
    if (obs.singleSecurityLayer === true) {
      score -= 15;
      reasons.push('single security layer');
    }

    return { score: Math.min(100, score), reasons };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];
    if (finalScore >= this.threshold) {
      parts.push(`✅ SECURE (${finalScore.toFixed(1)})`);
    } else {
      parts.push(`❌ SECURE (${finalScore.toFixed(1)} < ${this.threshold})`);
    }
    if (details.vulnerabilities?.score < 60) parts.push('security risks');
    return parts.join(' | ');
  }
}

module.exports = { SecureEvaluator, evaluator: new SecureEvaluator() };
