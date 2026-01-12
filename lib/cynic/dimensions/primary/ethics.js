/**
 * ETHICS Dimension Evaluator
 *
 * World: YETZIRAH (Formation)
 * Axiom: CULTURE ("Culture is a moat")
 * Category: PRIMARY
 *
 * Question: "Respecte-t-il les valeurs cypherpunk?"
 *
 * This evaluator checks:
 * - Privacy respect
 * - Decentralization
 * - Open source / MIT license
 * - No VC / No extractive patterns
 * - Community alignment
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class EthicsEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'ETHICS',
      category: 'PRIMARY',
      world: 'YETZIRAH',
      axiom: 'CULTURE',
      threshold: 75,
      question: 'Respecte-t-il les valeurs cypherpunk?',
    });

    // Cypherpunk values
    this.VALUES = {
      PRIVACY: 'privacy_respect',
      DECENTRALIZATION: 'decentralization',
      OPEN_SOURCE: 'open_source',
      NO_EXTRACTION: 'no_extraction',
      COMMUNITY: 'community_aligned',
      VERIFICATION: 'verification_enabled',
    };

    // Red flags
    this.RED_FLAGS = [
      'vc_funded', 'venture_capital',
      'centralized', 'proprietary',
      'extraction', 'rent_seeking',
      'surveillance', 'tracking',
      'closed_source', 'paywall',
    ];
  }

  /**
   * Evaluate ethical alignment with cypherpunk values
   */
  async evaluate(observation, context = {}) {
    const details = {};
    const scores = [];

    // 1. Privacy respect (25 points)
    const privacyScore = this._evaluatePrivacy(observation);
    scores.push({ value: privacyScore.score, weight: 1.0 });
    details.privacy = privacyScore;

    // 2. Decentralization (25 points)
    const decentralScore = this._evaluateDecentralization(observation);
    scores.push({ value: decentralScore.score, weight: 1.0 });
    details.decentralization = decentralScore;

    // 3. Open source / licensing (20 points)
    const openScore = this._evaluateOpenness(observation);
    scores.push({ value: openScore.score, weight: 0.8 });
    details.openness = openScore;

    // 4. Non-extractive patterns (20 points)
    const extractionScore = this._evaluateExtraction(observation);
    scores.push({ value: extractionScore.score, weight: 0.8 });
    details.extraction = extractionScore;

    // 5. Community alignment (10 points)
    const communityScore = this._evaluateCommunity(observation);
    scores.push({ value: communityScore.score, weight: 0.5 });
    details.community = communityScore;

    // Check for red flags (can reduce score significantly)
    const redFlagPenalty = this._checkRedFlags(observation);
    details.redFlags = redFlagPenalty;

    let finalScore = this.weightedAverage(scores);
    finalScore = Math.max(0, finalScore - redFlagPenalty.penalty);

    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  // ===========================================================================
  // SUB-EVALUATORS
  // ===========================================================================

  _evaluatePrivacy(obs) {
    let score = 60; // Neutral start
    const reasons = [];

    // Privacy-positive markers
    if (obs.privacy === true || obs.privacyPreserving === true) {
      score += 25;
      reasons.push('privacy-preserving');
    }

    if (obs.encrypted === true || this.exists(obs.encryption)) {
      score += 15;
      reasons.push('encrypted');
    }

    if (obs.anonymous === true || obs.pseudonymous === true) {
      score += 15;
      reasons.push('anonymized');
    }

    // PII handling
    if (obs.piiRemoved === true || obs.sanitized === true) {
      score += 20;
      reasons.push('PII removed');
    }

    // Privacy-negative markers
    if (obs.tracking === true || obs.analytics === true) {
      score -= 20;
      reasons.push('tracking detected');
    }

    if (obs.dataCollection === true) {
      score -= 15;
      reasons.push('data collection');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateDecentralization(obs) {
    let score = 55;
    const reasons = [];

    // Decentralization markers
    if (obs.decentralized === true) {
      score += 30;
      reasons.push('decentralized');
    }

    if (obs.p2p === true || obs.peer2peer === true) {
      score += 20;
      reasons.push('P2P');
    }

    if (obs.distributed === true) {
      score += 15;
      reasons.push('distributed');
    }

    if (obs.onChain === true || obs.blockchain === true) {
      score += 20;
      reasons.push('on-chain');
    }

    // Centralization markers
    if (obs.centralized === true) {
      score -= 30;
      reasons.push('centralized ⚠️');
    }

    if (obs.singlePointOfFailure === true) {
      score -= 25;
      reasons.push('SPOF detected');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateOpenness(obs) {
    let score = 50;
    const reasons = [];

    // Open source markers
    if (obs.openSource === true || obs.opensource === true) {
      score += 30;
      reasons.push('open source');
    }

    // License checks
    if (this.exists(obs.license)) {
      const license = String(obs.license).toLowerCase();
      if (license.includes('mit') || license.includes('apache') || license.includes('bsd')) {
        score += 25;
        reasons.push(`permissive: ${obs.license}`);
      } else if (license.includes('gpl')) {
        score += 15;
        reasons.push(`copyleft: ${obs.license}`);
      } else if (license.includes('proprietary') || license.includes('commercial')) {
        score -= 30;
        reasons.push('proprietary ⚠️');
      }
    }

    // Transparency
    if (obs.transparent === true || obs.auditable === true) {
      score += 15;
      reasons.push('transparent');
    }

    // Public repo
    if (this.exists(obs.repo) || this.exists(obs.github)) {
      score += 10;
      reasons.push('public repo');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateExtraction(obs) {
    let score = 70; // Assume good faith
    const reasons = [];

    // Non-extractive markers (BURN alignment)
    if (obs.burn === true || obs.burnModel === true) {
      score += 30;
      reasons.push('burn-aligned 🔥');
    }

    if (obs.noFees === true || obs.feesFree === true) {
      score += 15;
      reasons.push('no fees');
    }

    if (obs.community_owned === true) {
      score += 15;
      reasons.push('community owned');
    }

    // Extractive markers
    if (obs.vcFunded === true || obs.ventureCapital === true) {
      score -= 40;
      reasons.push('VC funded ⚠️');
    }

    if (obs.rentSeeking === true || obs.extraction === true) {
      score -= 35;
      reasons.push('extractive model ⚠️');
    }

    if (obs.tokenomics?.teamAllocation > 20) {
      score -= 20;
      reasons.push('high team allocation');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateCommunity(obs) {
    let score = 60;
    const reasons = [];

    if (obs.communityDriven === true) {
      score += 25;
      reasons.push('community driven');
    }

    if (this.exists(obs.contributors) && obs.contributors > 5) {
      score += 15;
      reasons.push(`${obs.contributors} contributors`);
    }

    if (obs.governance === 'community' || obs.dao === true) {
      score += 20;
      reasons.push('community governance');
    }

    return { score: Math.min(100, score), reasons };
  }

  _checkRedFlags(obs) {
    const found = [];
    let penalty = 0;

    // Convert observation to searchable string
    const obsStr = JSON.stringify(obs).toLowerCase();

    for (const flag of this.RED_FLAGS) {
      if (obsStr.includes(flag)) {
        found.push(flag);
        penalty += 10;
      }
    }

    return {
      found,
      penalty: Math.min(50, penalty), // Cap penalty at 50
    };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];

    if (finalScore >= this.threshold) {
      parts.push(`✅ ETHICS (${finalScore.toFixed(1)} >= ${this.threshold})`);
    } else {
      parts.push(`❌ ETHICS (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    // Highlight positives
    const positives = [];
    if (details.privacy.score >= 70) positives.push('privacy');
    if (details.decentralization.score >= 70) positives.push('decentralized');
    if (details.extraction.score >= 80) positives.push('non-extractive');

    if (positives.length > 0) {
      parts.push(`Values: ${positives.join(', ')}`);
    }

    // Note red flags
    if (details.redFlags.found.length > 0) {
      parts.push(`⚠️ Flags: ${details.redFlags.found.join(', ')}`);
    }

    return parts.join(' | ');
  }
}

module.exports = {
  EthicsEvaluator,
  evaluator: new EthicsEvaluator(),
};
