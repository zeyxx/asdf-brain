/**
 * Provenance Handlers - brain_provenance_*
 *
 * [D] Drash - Cryptographic verification
 *
 * Philosophy: "Don't trust, verify"
 */

'use strict';

const merkleProofs = require('../merkle-proofs');

async function handleProvenanceStatus(args, adapter) {
  const merkleState = await adapter.load('provenance/merkle-state.json');
  const registry = await adapter.load('provenance/registry.json');

  if (!merkleState) {
    return {
      status: 'not_initialized',
      message: 'Provenance system not initialized. Run: npm run brain:snapshot',
      chain_ready: false,
      _quality: 30,
    };
  }

  const lastSnapshot = merkleState.timestamp ? new Date(merkleState.timestamp) : null;
  const hoursSinceSnapshot = lastSnapshot
    ? Math.floor((Date.now() - lastSnapshot.getTime()) / (1000 * 60 * 60))
    : null;

  return {
    status: 'active',
    merkle_root: merkleState.merkle_root,
    file_count: merkleState.file_count,
    files_tracked: Object.keys(merkleState.files || {}),
    last_snapshot: lastSnapshot?.toISOString(),
    hours_since_snapshot: hoursSinceSnapshot,
    snapshot_stale: hoursSinceSnapshot > 168,
    verification: merkleState.verification,
    contributors: registry?.contributors ? Object.keys(registry.contributors) : [],
    chain_ready: merkleState.verification?.chain_ready || false,
    _quality: 90,
  };
}

async function handleProvenanceProof(args, adapter) {
  const { item_id, content_hash } = args;

  if (!item_id && !content_hash) {
    return {
      success: false,
      error: 'Must provide either item_id or content_hash',
      _quality: 0,
    };
  }

  if (item_id) {
    const proof = merkleProofs.getInclusionProof(item_id);
    if (proof) {
      return {
        success: true,
        item_id,
        ...proof,
        _quality: 95,
      };
    }
  }

  const merkleState = await adapter.load('provenance/merkle-state.json');
  if (!merkleState) {
    return {
      success: false,
      error: 'Merkle state not found',
      _quality: 0,
    };
  }

  const hashToFind = content_hash || item_id;
  const files = merkleState.files || {};

  for (const [filePath, fileInfo] of Object.entries(files)) {
    if (fileInfo.hash === hashToFind || fileInfo.hash.startsWith(hashToFind)) {
      const hashIndex = merkleState.hashes.indexOf(fileInfo.hash);
      return {
        success: true,
        file_path: filePath,
        leaf_hash: fileInfo.hash,
        leaf_index: hashIndex,
        merkle_root: merkleState.merkle_root,
        file_size: fileInfo.size,
        last_modified: fileInfo.modified,
        message: 'File found in Merkle tree (proof path requires full tree rebuild)',
        _quality: 85,
      };
    }
  }

  return {
    success: false,
    error: `No item found with id/hash: ${hashToFind}`,
    available_files: Object.keys(files).slice(0, 10),
    _quality: 30,
  };
}

async function handleProvenanceVerify(args, adapter) {
  const { leaf_hash, proof, expected_root } = args;

  let rootToVerify = expected_root;
  if (!rootToVerify) {
    const merkleState = await adapter.load('provenance/merkle-state.json');
    if (!merkleState) {
      return {
        success: false,
        error: 'No Merkle state found and no expected_root provided',
        _quality: 0,
      };
    }
    rootToVerify = merkleState.merkle_root;
  }

  const isValid = merkleProofs.verifyInclusion(leaf_hash, proof, rootToVerify);

  return {
    success: true,
    verified: isValid,
    leaf_hash,
    proof_length: proof.length,
    expected_root: rootToVerify,
    message: isValid
      ? "✓ Proof verified - knowledge inclusion confirmed"
      : "✗ Proof invalid - knowledge not in this Merkle tree",
    philosophy: "Don't trust, verify",
    _quality: isValid ? 100 : 50,
  };
}

async function handleProvenanceSnapshot(args, adapter) {
  const { force = false } = args;

  const merkleState = await adapter.load('provenance/merkle-state.json');
  if (merkleState && !force) {
    const lastSnapshot = new Date(merkleState.timestamp);
    const hoursSince = (Date.now() - lastSnapshot.getTime()) / (1000 * 60 * 60);

    if (hoursSince < 24) {
      return {
        success: false,
        error: 'Recent snapshot exists (< 24h). Use force=true to regenerate.',
        last_snapshot: lastSnapshot.toISOString(),
        hours_since: Math.floor(hoursSince),
        current_root: merkleState.merkle_root,
        _quality: 70,
      };
    }
  }

  try {
    const snapshot = merkleProofs.createWeeklySnapshot();

    return {
      success: true,
      week_number: snapshot.week_number,
      timestamp: snapshot.timestamp_iso,
      file_merkle_root: snapshot.file_merkle_root,
      pattern_merkle_root: snapshot.pattern_merkle_root,
      combined_root: snapshot.combined_root,
      statistics: snapshot.statistics,
      solana_payload: snapshot.solana_payload,
      message: `Weekly snapshot created for week ${snapshot.week_number}`,
      _quality: 95,
    };
  } catch (e) {
    return {
      success: false,
      error: `Snapshot generation failed: ${e.message}`,
      _quality: 0,
    };
  }
}

module.exports = {
  handleProvenanceStatus,
  handleProvenanceProof,
  handleProvenanceVerify,
  handleProvenanceSnapshot,
};
