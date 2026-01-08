/**
 * SEED 4: Enhanced Merkle Proofs with Inclusion Verification
 *
 * "Don't trust, verify" - Every piece of knowledge must be cryptographically provable
 *
 * Extends the base merkle.js with:
 * - Pattern-level inclusion proofs
 * - Provenance chain tracking
 * - Weekly state snapshots for Solana
 * - Context injection signing
 *
 * @philosophy Trust is replaced by verification - the cypherpunk way
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const baseMerkle = require('../scripts/merkle');

const CONFIG = {
    KNOWLEDGE_DIR: path.join(__dirname, '../knowledge'),
    PROVENANCE_DIR: path.join(__dirname, '../knowledge/provenance'),
    SNAPSHOTS_DIR: path.join(__dirname, '../knowledge/provenance/snapshots'),
    SOLANA_READY: true  // Flag for when Solana program is deployed
};

// Ensure directories exist
[CONFIG.PROVENANCE_DIR, CONFIG.SNAPSHOTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Generate a unique ID for any knowledge item
 *
 * @param {Object} item - Knowledge item (pattern, decision, etc.)
 * @returns {string} - Unique hash ID
 */
function generateItemId(item) {
    const canonical = JSON.stringify({
        type: item.type,
        content: item.content || item.description,
        project: item.project,
        timestamp: item.created_at || item.timestamp
    });
    return baseMerkle.sha256(canonical).slice(0, 16);
}

/**
 * Create provenance record for a knowledge item
 *
 * @param {Object} item - Knowledge item
 * @param {string} source - Source of the item (session, transcript, manual)
 * @param {string} contributor - Contributor ID
 * @returns {Object} - Provenance record
 */
function createProvenance(item, source, contributor) {
    const id = item.id || generateItemId(item);
    const contentHash = baseMerkle.sha256(JSON.stringify(item));
    const timestamp = Date.now();

    const provenance = {
        id,
        content_hash: contentHash,
        source,
        contributor,
        timestamp,
        chain: [{
            action: 'created',
            hash: contentHash,
            timestamp,
            signer: contributor
        }]
    };

    // Sign the provenance
    provenance.signature = signProvenance(provenance);

    return provenance;
}

/**
 * Sign a provenance record (local signing - Solana signing in future)
 *
 * @param {Object} provenance - Provenance record
 * @returns {string} - Signature
 */
function signProvenance(provenance) {
    const toSign = JSON.stringify({
        id: provenance.id,
        content_hash: provenance.content_hash,
        timestamp: provenance.timestamp,
        chain_length: provenance.chain.length
    });

    // For now, HMAC with a local key (will be Ed25519 with Solana)
    const key = process.env.BRAIN_SIGNING_KEY || 'asdf-brain-local-key';
    return crypto.createHmac('sha256', key).update(toSign).digest('hex');
}

/**
 * Update provenance chain when item is modified
 *
 * @param {Object} existingProvenance - Existing provenance record
 * @param {string} action - Action taken (modified, merged, archived)
 * @param {string} newContentHash - Hash of new content
 * @param {string} signer - Who performed the action
 * @returns {Object} - Updated provenance
 */
function updateProvenanceChain(existingProvenance, action, newContentHash, signer) {
    const chainEntry = {
        action,
        hash: newContentHash,
        previous_hash: existingProvenance.content_hash,
        timestamp: Date.now(),
        signer
    };

    existingProvenance.chain.push(chainEntry);
    existingProvenance.content_hash = newContentHash;
    existingProvenance.signature = signProvenance(existingProvenance);

    return existingProvenance;
}

/**
 * Build pattern-level Merkle tree
 *
 * @param {Array} patterns - Array of patterns with provenance
 * @returns {Object} - Merkle tree with per-pattern proofs
 */
function buildPatternMerkleTree(patterns) {
    // Extract hashes from patterns
    const hashes = patterns.map(p =>
        p.provenance?.content_hash || baseMerkle.sha256(JSON.stringify(p))
    );

    const tree = baseMerkle.buildMerkleTree(hashes);

    // Map pattern IDs to their proofs
    const patternProofs = {};
    patterns.forEach((pattern, idx) => {
        const hash = hashes[idx];
        const id = pattern.id || pattern.provenance?.id || generateItemId(pattern);

        patternProofs[id] = {
            leaf_hash: hash,
            proof: tree.proofs[hash] || [],
            index: idx
        };
    });

    return {
        root: tree.root,
        tree: tree.tree,
        pattern_count: patterns.length,
        pattern_proofs: patternProofs,
        generated_at: Date.now()
    };
}

/**
 * Generate inclusion proof for a specific pattern
 *
 * @param {string} patternId - Pattern ID
 * @returns {Object} - Inclusion proof or null if not found
 */
function getInclusionProof(patternId) {
    const stateFile = path.join(CONFIG.PROVENANCE_DIR, 'merkle-state.json');

    if (!fs.existsSync(stateFile)) {
        return null;
    }

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

    if (!state.pattern_proofs || !state.pattern_proofs[patternId]) {
        return null;
    }

    const proof = state.pattern_proofs[patternId];

    return {
        pattern_id: patternId,
        leaf_hash: proof.leaf_hash,
        proof_path: proof.proof,
        merkle_root: state.root,
        generated_at: state.generated_at,
        verified: baseMerkle.verifyProof(proof.leaf_hash, proof.proof, state.root)
    };
}

/**
 * Verify an inclusion proof
 *
 * @param {string} contentHash - Hash of the content
 * @param {Array} proof - Proof path
 * @param {string} expectedRoot - Expected Merkle root
 * @returns {boolean} - True if proof is valid
 */
function verifyInclusion(contentHash, proof, expectedRoot) {
    return baseMerkle.verifyProof(contentHash, proof, expectedRoot);
}

/**
 * Create weekly snapshot for Solana publishing
 *
 * @returns {Object} - Snapshot ready for on-chain storage
 */
function createWeeklySnapshot() {
    const timestamp = Date.now();
    const weekNumber = Math.floor(timestamp / (7 * 24 * 60 * 60 * 1000));

    // Compute current state
    const state = baseMerkle.computeKnowledgeState();

    // Load all patterns for pattern-level tree
    const patternsDir = path.join(CONFIG.KNOWLEDGE_DIR, 'patterns');
    const patterns = [];

    if (fs.existsSync(patternsDir)) {
        const files = fs.readdirSync(patternsDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            try {
                const content = JSON.parse(fs.readFileSync(path.join(patternsDir, file), 'utf8'));
                const filePatterns = Array.isArray(content) ? content : (content.patterns || []);
                patterns.push(...filePatterns);
            } catch (e) {
                // Skip invalid files
            }
        }
    }

    // Build pattern Merkle tree
    const patternTree = buildPatternMerkleTree(patterns);

    const snapshot = {
        version: '1.0.0',
        week_number: weekNumber,
        timestamp,
        timestamp_iso: new Date(timestamp).toISOString(),

        // File-level Merkle
        file_merkle_root: state.merkle_root,
        file_count: state.file_count,

        // Pattern-level Merkle
        pattern_merkle_root: patternTree.root,
        pattern_count: patternTree.pattern_count,

        // Combined root (hash of both roots)
        combined_root: baseMerkle.sha256(state.merkle_root + patternTree.root),

        // Solana-ready payload
        solana_payload: {
            root: baseMerkle.sha256(state.merkle_root + patternTree.root),
            week: weekNumber,
            patterns: patternTree.pattern_count,
            files: state.file_count,
            signature: null  // Will be set when Solana program is deployed
        },

        // Statistics
        statistics: {
            total_hashes: state.hashes.length,
            tree_depth: state.verification.tree_depth
        },

        // Metadata
        _phi: {
            philosophy: "Don't trust, verify",
            chain_ready: CONFIG.SOLANA_READY
        }
    };

    // Save snapshot
    const snapshotFile = path.join(CONFIG.SNAPSHOTS_DIR, `week-${weekNumber}.json`);
    fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));

    // Update current state with pattern proofs
    const stateWithProofs = {
        ...state,
        pattern_proofs: patternTree.pattern_proofs,
        root: snapshot.combined_root
    };
    fs.writeFileSync(
        path.join(CONFIG.PROVENANCE_DIR, 'merkle-state.json'),
        JSON.stringify(stateWithProofs, null, 2)
    );

    console.log(`[Merkle] Weekly snapshot created: week ${weekNumber}`);
    console.log(`[Merkle] Combined root: ${snapshot.combined_root}`);
    console.log(`[Merkle] Files: ${state.file_count}, Patterns: ${patternTree.pattern_count}`);

    return snapshot;
}

/**
 * Sign a context injection with provenance
 *
 * @param {Object} context - Context being injected
 * @param {string} sessionId - Session receiving the context
 * @returns {Object} - Signed context
 */
function signContextInjection(context, sessionId) {
    const injection = {
        context,
        session_id: sessionId,
        timestamp: Date.now(),
        sources: context.sources || []
    };

    // Hash the context
    injection.content_hash = baseMerkle.sha256(JSON.stringify(context));

    // Sign it
    const toSign = JSON.stringify({
        content_hash: injection.content_hash,
        session_id: sessionId,
        timestamp: injection.timestamp
    });

    const key = process.env.BRAIN_SIGNING_KEY || 'asdf-brain-local-key';
    injection.signature = crypto.createHmac('sha256', key).update(toSign).digest('hex');

    // Add verification info
    injection._verified = {
        sig: injection.signature.slice(0, 16),
        ts: new Date(injection.timestamp).toISOString(),
        philosophy: "Don't trust, verify"
    };

    return injection;
}

/**
 * Verify a signed context injection
 *
 * @param {Object} signedContext - Signed context injection
 * @returns {Object} - Verification result
 */
function verifyContextInjection(signedContext) {
    const toVerify = JSON.stringify({
        content_hash: signedContext.content_hash,
        session_id: signedContext.session_id,
        timestamp: signedContext.timestamp
    });

    const key = process.env.BRAIN_SIGNING_KEY || 'asdf-brain-local-key';
    const expectedSig = crypto.createHmac('sha256', key).update(toVerify).digest('hex');

    const valid = signedContext.signature === expectedSig;

    return {
        valid,
        content_hash: signedContext.content_hash,
        signed_at: new Date(signedContext.timestamp).toISOString(),
        error: valid ? null : 'Signature mismatch'
    };
}

/**
 * Get provenance registry
 *
 * @returns {Object} - All provenance records
 */
function getProvenanceRegistry() {
    const registryFile = path.join(CONFIG.PROVENANCE_DIR, 'registry.json');

    if (!fs.existsSync(registryFile)) {
        return { items: {}, count: 0 };
    }

    return JSON.parse(fs.readFileSync(registryFile, 'utf8'));
}

/**
 * Save provenance to registry
 *
 * @param {Object} provenance - Provenance record
 */
function saveProvenance(provenance) {
    const registryFile = path.join(CONFIG.PROVENANCE_DIR, 'registry.json');

    const registry = getProvenanceRegistry();
    registry.items[provenance.id] = provenance;
    registry.count = Object.keys(registry.items).length;
    registry.last_updated = Date.now();

    fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2));
}

module.exports = {
    CONFIG,
    generateItemId,
    createProvenance,
    signProvenance,
    updateProvenanceChain,
    buildPatternMerkleTree,
    getInclusionProof,
    verifyInclusion,
    createWeeklySnapshot,
    signContextInjection,
    verifyContextInjection,
    getProvenanceRegistry,
    saveProvenance
};
