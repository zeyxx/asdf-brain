/**
 * TRUTH Dimension Evaluator
 *
 * World: BERIAH (Creation)
 * Axiom: VERIFY ("Don't trust, verify")
 * Category: PRIMARY
 *
 * Question: "Is it verifiable and reproducible?"
 *
 * This evaluator checks:
 * - Is there a source?
 * - Can it be verified cryptographically?
 * - Is it reproducible?
 * - Does it have provenance?
 */

'use strict';

const { DimensionEvaluator } = require('../base');
const { SCORING } = require('../../axioms/constants');

class TruthEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'TRUTH',
      category: 'PRIMARY',
      world: 'BERIAH',
      axiom: 'VERIFY',
      threshold: 70,
      question: 'Is it verifiable and reproducible?',
    });
  }

  /**
   * Evaluate truth/verifiability of an observation
   */
  async evaluate(observation, context = {}) {
    const scores = [];
    const details = {};

    // 1. Source presence (20 points)
    const sourceScore = this._evaluateSource(observation);
    scores.push({ value: sourceScore.score, weight: 1.0 });
    details.source = sourceScore;

    // 2. Cryptographic signature (25 points) - strictest
    const signatureScore = this._evaluateSignature(observation);
    scores.push({ value: signatureScore.score, weight: 1.2 });
    details.signature = signatureScore;

    // 3. Reproducibility (20 points)
    const reproScore = this._evaluateReproducibility(observation);
    scores.push({ value: reproScore.score, weight: 1.0 });
    details.reproducibility = reproScore;

    // 4. Provenance chain (20 points)
    const provenanceScore = this._evaluateProvenance(observation);
    scores.push({ value: provenanceScore.score, weight: 1.0 });
    details.provenance = provenanceScore;

    // 5. Soft Verification (15 points) - alternative trust signals
    const softScore = this._evaluateSoftVerification(observation, context);
    scores.push({ value: softScore.score, weight: 0.8 });
    details.softVerification = softScore;

    // Calculate weighted average
    const finalScore = this.weightedAverage(scores);

    // Build reasoning
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  // ===========================================================================
  // SUB-EVALUATORS
  // ===========================================================================

  _evaluateSource(obs) {
    let score = 0;
    const reasons = [];

    // Check for source field
    if (this.exists(obs.source)) {
      score += 40;
      reasons.push('source présente');

      // URL source?
      if (typeof obs.source === 'string' && obs.source.startsWith('http')) {
        score += 20;
        reasons.push('URL vérifiable');
      }

      // Structured source?
      if (typeof obs.source === 'object' && obs.source.type) {
        score += 20;
        reasons.push('source structurée');
      }
    } else {
      reasons.push('pas de source');
    }

    // Check for references
    if (obs.references && Array.isArray(obs.references) && obs.references.length > 0) {
      score += 20;
      reasons.push(`${obs.references.length} référence(s)`);
    }

    return { score: Math.min(100, score), reasons };
  }

  _evaluateSignature(obs) {
    let score = 0;
    const reasons = [];

    // Check for signature
    if (this.exists(obs.signature) || this.exists(obs.hash)) {
      score += 50;
      reasons.push('signature/hash présent');

      // HMAC signature?
      if (obs.signature && obs.signature.includes(':')) {
        score += 25;
        reasons.push('format HMAC');
      }

      // Merkle proof?
      if (obs.merkleProof || obs.proof) {
        score += 25;
        reasons.push('preuve Merkle');
      }
    } else {
      // No signature, but check for integrity markers
      if (obs.integrity || obs.checksum) {
        score += 30;
        reasons.push('checksum présent');
      } else {
        reasons.push('pas de signature cryptographique');
      }
    }

    // Verified flag?
    if (obs.verified === true) {
      score += 25;
      reasons.push('marqué vérifié');
    }

    return { score: Math.min(100, score), reasons };
  }

  _evaluateReproducibility(obs) {
    let score = 50; // Base score - assume neutral
    const reasons = [];

    // Type-based reproducibility
    const type = obs.type || obs.obsType || '';

    switch (type.toLowerCase()) {
      case 'code':
      case 'test':
      case 'function':
        score += 30;
        reasons.push('type reproductible (code)');
        break;

      case 'decision':
      case 'pattern':
        score += 15;
        reasons.push('type partiellement reproductible');
        break;

      case 'insight':
      case 'conversation':
        score -= 10;
        reasons.push('type subjectif');
        break;

      default:
        reasons.push('type inconnu');
    }

    // Has steps or methodology?
    if (obs.steps || obs.methodology || obs.instructions) {
      score += 20;
      reasons.push('méthodologie documentée');
    }

    // Has expected output?
    if (obs.expectedOutput || obs.expected) {
      score += 15;
      reasons.push('sortie attendue définie');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateProvenance(obs) {
    let score = 0;
    const reasons = [];

    // Timestamp presence
    if (this.exists(obs.timestamp) || this.exists(obs.createdAt)) {
      score += 25;
      reasons.push('horodatage présent');
    }

    // Creator/author
    if (this.exists(obs.author) || this.exists(obs.creator) || this.exists(obs.operator)) {
      score += 25;
      reasons.push('auteur identifié');
    }

    // Context/session
    if (this.exists(obs.context) || this.exists(obs.sessionId)) {
      score += 20;
      reasons.push('contexte présent');
    }

    // History/chain
    if (obs.history || obs.parentId || obs.derivedFrom) {
      score += 30;
      reasons.push('chaîne de provenance');
    }

    // No provenance at all
    if (score === 0) {
      reasons.push('aucune provenance');
    }

    return { score: Math.min(100, score), reasons };
  }

  /**
   * Soft Verification - Alternative trust signals when crypto verification unavailable
   * "Don't trust, verify" - but verification has many forms
   *
   * Checks: consistency, cross-references, structure, consensus, temporal coherence
   * All increments use φ-derived SCORING constants (no magic numbers)
   */
  _evaluateSoftVerification(obs, context = {}) {
    // Baseline: LARGE - MICRO = 38 - 9 = 29 (soft verification starts lower)
    let score = SCORING.LARGE - SCORING.MICRO;
    const reasons = [];

    // === STRUCTURAL CONSISTENCY ===
    // Well-structured observations are more trustworthy
    const fieldCount = Object.keys(obs).filter(k => !k.startsWith('_')).length;
    if (fieldCount >= SCORING.FIELDS_GOOD) {
      score += SCORING.SMALL;
      reasons.push('well-structured');
    } else if (fieldCount >= SCORING.FIELDS_MINIMAL) {
      score += SCORING.MICRO;
      reasons.push('structured');
    } else if (fieldCount < SCORING.FIELDS_SPARSE) {
      score -= SCORING.SMALL;
      reasons.push('minimal structure');
    }

    // === CROSS-REFERENCES ===
    // References to other observations increase trust
    if (obs.relatedTo || obs.linkedTo || obs.references) {
      score += SCORING.SMALL;
      reasons.push('cross-referenced');
    }
    if (obs.parentId || obs.replyTo || obs.inResponseTo) {
      score += SCORING.MICRO;
      reasons.push('linked to parent');
    }

    // === CONSENSUS MARKERS ===
    // Multiple confirmations increase trust
    if (obs.confirmedBy || obs.agreedBy) {
      const confirmCount = Array.isArray(obs.confirmedBy) ? obs.confirmedBy.length : 1;
      score += Math.min(SCORING.MEDIUM, confirmCount * SCORING.MICRO);
      reasons.push(`${confirmCount} confirmation(s)`);
    }
    if (obs.consensus === true || obs.unanimous === true) {
      score += SCORING.SMALL;
      reasons.push('consensus reached');
    }

    // === TEMPORAL COHERENCE ===
    // Recent observations with valid timestamps are more trustworthy
    if (obs.timestamp || obs.createdAt) {
      const ts = new Date(obs.timestamp || obs.createdAt).getTime();
      const now = Date.now();
      const ageMs = now - ts;
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;

      if (ageMs < 0) {
        score -= SCORING.MEDIUM; // Future timestamp = suspicious
        reasons.push('future timestamp ⚠️');
      } else if (ageMs < oneDay) {
        score += SCORING.MICRO;
        reasons.push('recent');
      } else if (ageMs < oneWeek) {
        score += Math.round(SCORING.MICRO / 2); // Half of MICRO
        reasons.push('within week');
      }
    }

    // === TYPE-BASED TRUST ===
    // Some types are inherently more verifiable
    const type = (obs.type || obs.obsType || '').toLowerCase();
    if (['code', 'test', 'function', 'commit', 'pr'].includes(type)) {
      score += SCORING.SMALL;
      reasons.push('verifiable type');
    } else if (['decision', 'pattern', 'architecture'].includes(type)) {
      score += SCORING.MICRO;
      reasons.push('documented type');
    } else if (['opinion', 'feeling', 'guess'].includes(type)) {
      score -= SCORING.MICRO;
      reasons.push('subjective type');
    }

    // === CYNIC MARKERS ===
    // Previously judged by CYNIC = some level of verification
    if (obs._cynic || obs._judgmentId || obs._verified) {
      score += SCORING.SMALL;
      reasons.push('CYNIC-verified');
    }

    // === ECOSYSTEM MARKERS ===
    // Known ecosystem sources
    if (obs.project && ['brain', 'holdex', 'gasdf', 'cynic'].includes(obs.project.toLowerCase())) {
      score += SCORING.MICRO;
      reasons.push('known project');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasons,
      philosophy: 'Verification has many forms beyond cryptography',
    };
  }

  // ===========================================================================
  // REASONING BUILDER
  // ===========================================================================

  _buildReasoning(details, finalScore) {
    const parts = [];

    // Overall verdict
    if (finalScore >= this.threshold) {
      parts.push(`✅ TRUTH vérifié (${finalScore.toFixed(1)} >= ${this.threshold})`);
    } else {
      parts.push(`❌ TRUTH insuffisant (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    // Add specific findings
    const findings = [];

    if (details.source.score < 50) {
      findings.push('source manquante ou faible');
    }

    if (details.signature.score < 50) {
      findings.push('pas de signature cryptographique');
    }

    if (details.reproducibility.score < 50) {
      findings.push('reproductibilité questionnable');
    }

    if (details.provenance.score < 50) {
      findings.push('provenance incomplète');
    }

    if (findings.length > 0) {
      parts.push('Issues: ' + findings.join(', '));
    }

    // Highlight soft verification if it helped
    if (details.softVerification && details.softVerification.score >= 60) {
      parts.push('soft-verified ✓');
    }

    return parts.join(' | ');
  }
}

// =============================================================================
// EXPORT
// =============================================================================

module.exports = {
  TruthEvaluator,
  evaluator: new TruthEvaluator(),
};
