/**
 * INTEGRITY Dimension Evaluator
 *
 * World: BERIAH (Creation)
 * Axiom: VERIFY ("Don't trust, verify")
 * Category: PRIMARY
 *
 * Question: "Is it tamper-proof and signed?"
 *
 * This evaluator checks:
 * - Cryptographic signatures
 * - Data integrity (hashes, checksums)
 * - Tamper-evidence
 * - Chain of custody
 */

'use strict';

const { DimensionEvaluator } = require('../base');
const { SCORING } = require('../../axioms/constants');
const crypto = require('crypto');

class IntegrityEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'INTEGRITY',
      category: 'PRIMARY',
      world: 'BERIAH',
      axiom: 'VERIFY',
      threshold: 80, // High threshold - integrity is critical
      question: 'Is it tamper-proof and signed?',
    });
  }

  /**
   * Evaluate integrity/tamper-proofing of an observation
   */
  async evaluate(observation, context = {}) {
    const details = {};
    const scores = [];

    // 1. Signature presence (25 points) - crypto signature
    const signatureScore = this._evaluateSignature(observation);
    scores.push({ value: signatureScore.score, weight: 1.2 });
    details.signature = signatureScore;

    // 2. Hash/checksum (20 points) - content hashing
    const hashScore = this._evaluateHash(observation);
    scores.push({ value: hashScore.score, weight: 1.0 });
    details.hash = hashScore;

    // 3. Immutability markers (15 points)
    const immutabilityScore = this._evaluateImmutability(observation);
    scores.push({ value: immutabilityScore.score, weight: 0.8 });
    details.immutability = immutabilityScore;

    // 4. Chain of custody (20 points)
    const chainScore = this._evaluateChainOfCustody(observation);
    scores.push({ value: chainScore.score, weight: 1.0 });
    details.chain = chainScore;

    // 5. Structural Integrity (20 points) - well-formed data
    const structuralScore = this._evaluateStructuralIntegrity(observation);
    scores.push({ value: structuralScore.score, weight: 0.8 });
    details.structural = structuralScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  // ===========================================================================
  // SUB-EVALUATORS
  // ===========================================================================

  _evaluateSignature(obs) {
    let score = 0;
    const reasons = [];

    // Check for signature field
    if (this.exists(obs.signature)) {
      score += 50;
      reasons.push('signature présente');

      // HMAC format (algo:hash)?
      if (typeof obs.signature === 'string' && obs.signature.includes(':')) {
        score += 20;
        reasons.push('format HMAC');
      }

      // Ed25519 or similar?
      if (obs.signatureType === 'ed25519' || obs.signatureType === 'ecdsa') {
        score += 30;
        reasons.push(`${obs.signatureType} signature`);
      }
    }

    // Check for signer
    if (this.exists(obs.signer) || this.exists(obs.signedBy)) {
      score += 15;
      reasons.push('signer identifié');
    }

    // Check for public key
    if (this.exists(obs.publicKey) || this.exists(obs.pubkey)) {
      score += 15;
      reasons.push('clé publique disponible');
    }

    if (score === 0) {
      reasons.push('aucune signature');
    }

    return { score: Math.min(100, score), reasons };
  }

  _evaluateHash(obs) {
    let score = 0;
    const reasons = [];

    // Check for hash
    if (this.exists(obs.hash)) {
      score += 40;
      reasons.push('hash présent');

      // Validate hash format
      const hash = String(obs.hash);
      if (hash.length === 64) {
        score += 20; // SHA-256 length
        reasons.push('SHA-256 format');
      } else if (hash.length === 128) {
        score += 20; // SHA-512 length
        reasons.push('SHA-512 format');
      }
    }

    // Check for checksum
    if (this.exists(obs.checksum)) {
      score += 30;
      reasons.push('checksum présent');
    }

    // Check for content hash
    if (this.exists(obs.contentHash) || this.exists(obs.dataHash)) {
      score += 35;
      reasons.push('hash de contenu');
    }

    // Check for merkle proof
    if (this.exists(obs.merkleProof) || this.exists(obs.proof)) {
      score += 40;
      reasons.push('preuve Merkle');
    }

    if (score === 0) {
      reasons.push('aucun hash/checksum');
    }

    return { score: Math.min(100, score), reasons };
  }

  _evaluateImmutability(obs) {
    let score = 40; // Base score
    const reasons = [];

    // Check for immutable flag
    if (obs.immutable === true || obs.readonly === true) {
      score += 30;
      reasons.push('marqué immutable');
    }

    // Check for frozen object
    if (obs.frozen === true || Object.isFrozen(obs)) {
      score += 20;
      reasons.push('objet gelé');
    }

    // Check for version/revision
    if (this.exists(obs.version) || this.exists(obs.revision)) {
      score += 15;
      reasons.push('versionné');
    }

    // Check for timestamp
    if (this.exists(obs.createdAt) || this.exists(obs.timestamp)) {
      score += 15;
      reasons.push('horodaté');
    }

    // Check for non-modifiable patterns
    if (obs.type === 'snapshot' || obs.type === 'archive') {
      score += 20;
      reasons.push('type immutable');
    }

    return { score: Math.min(100, score), reasons };
  }

  _evaluateChainOfCustody(obs) {
    let score = 30; // Base score
    const reasons = [];

    // Check for history/audit trail
    if (this.exists(obs.history) || this.exists(obs.auditTrail)) {
      score += 40;
      reasons.push('historique présent');
    }

    // Check for parentId/derivedFrom
    if (this.exists(obs.parentId) || this.exists(obs.derivedFrom)) {
      score += 25;
      reasons.push('chaîne de dérivation');
    }

    // Check for creator
    if (this.exists(obs.creator) || this.exists(obs.author)) {
      score += 15;
      reasons.push('créateur identifié');
    }

    // Check for modifications tracking
    if (this.exists(obs.modifiedBy) || this.exists(obs.lastModified)) {
      score += 15;
      reasons.push('modifications tracées');
    }

    // Check for Merkle root
    if (this.exists(obs.merkleRoot)) {
      score += 30;
      reasons.push('racine Merkle');
    }

    return { score: Math.min(100, score), reasons };
  }

  /**
   * Structural Integrity - Is the data well-formed and internally consistent?
   * This provides a baseline for observations without cryptographic verification
   * All increments use φ-derived SCORING constants (no magic numbers)
   */
  _evaluateStructuralIntegrity(obs) {
    // Baseline: LARGE = 38 (structural integrity starts with moderate trust)
    let score = SCORING.LARGE;
    const reasons = [];

    // === SCHEMA CONSISTENCY ===
    // Well-structured observations with expected fields
    const expectedFields = ['type', 'content', 'timestamp', 'source'];
    const presentFields = expectedFields.filter(f => this.exists(obs[f]));
    if (presentFields.length >= SCORING.FIELDS_MINIMAL) {
      score += SCORING.MEDIUM;
      reasons.push('schema compliant');
    } else if (presentFields.length >= SCORING.FIELDS_SPARSE) {
      score += SCORING.MICRO;
      reasons.push('partial schema');
    }

    // === TYPE VALIDATION ===
    // Known types increase integrity
    const knownTypes = [
      'code', 'test', 'decision', 'pattern', 'insight', 'commit',
      'pr', 'issue', 'refactoring', 'architecture', 'observation'
    ];
    if (obs.type && knownTypes.includes(obs.type.toLowerCase())) {
      score += SCORING.SMALL;
      reasons.push('known type');
    }

    // === REFERENTIAL INTEGRITY ===
    // References that are properly formed
    if (obs.parentId || obs.relatedTo || obs.references) {
      // Check if references look valid (not empty)
      const hasValidRefs = (
        (obs.parentId && String(obs.parentId).length > SCORING.FIELDS_GOOD) ||
        (obs.relatedTo && (Array.isArray(obs.relatedTo) ? obs.relatedTo.length > 0 : true)) ||
        (obs.references && Array.isArray(obs.references) && obs.references.length > 0)
      );
      if (hasValidRefs) {
        score += SCORING.SMALL;
        reasons.push('valid references');
      }
    }

    // === CONTENT INTEGRITY ===
    // Content matches expected structure
    if (obs.content) {
      const content = obs.content;
      const minContentLength = SCORING.MICRO + 1; // 10 chars minimum
      if (typeof content === 'string' && content.length > minContentLength) {
        score += SCORING.MICRO;
        reasons.push('has content');
      } else if (typeof content === 'object' && Object.keys(content).length > 0) {
        score += SCORING.MICRO;
        reasons.push('structured content');
      }
    }

    // === LOGICAL INTEGRITY ===
    // No obvious contradictions
    let contradictions = 0;

    // Can't be both private and public
    if (obs.private === true && obs.public === true) {
      contradictions++;
      reasons.push('contradiction: private/public');
    }

    // Can't be both verified and unverified
    if (obs.verified === true && obs.unverified === true) {
      contradictions++;
      reasons.push('contradiction: verified state');
    }

    // Future creation date is suspicious (> 1 minute in future)
    if (obs.createdAt) {
      const created = new Date(obs.createdAt).getTime();
      const ONE_MINUTE_MS = 60 * 1000;
      if (created > Date.now() + ONE_MINUTE_MS) {
        contradictions++;
        reasons.push('future creation date');
      }
    }

    if (contradictions > 0) {
      score -= contradictions * SCORING.SMALL;
    } else if (score >= SCORING.BASELINE_NEUTRAL) {
      reasons.push('logically consistent');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasons,
      philosophy: 'Well-formed data has inherent integrity',
    };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];

    if (finalScore >= this.threshold) {
      parts.push(`✅ INTEGRITY (${finalScore.toFixed(1)} >= ${this.threshold})`);
    } else {
      parts.push(`❌ INTEGRITY insuffisant (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    // Identify weak areas
    const weakAreas = [];
    if (details.signature.score < 50) weakAreas.push('signature');
    if (details.hash.score < 50) weakAreas.push('hash');
    if (details.chain.score < 50) weakAreas.push('chain');

    if (weakAreas.length > 0) {
      parts.push(`Weak: ${weakAreas.join(', ')}`);
    }

    // Highlight structural integrity if strong
    if (details.structural && details.structural.score >= 70) {
      parts.push('structurally sound');
    }

    return parts.join(' | ');
  }
}

module.exports = {
  IntegrityEvaluator,
  evaluator: new IntegrityEvaluator(),
};
