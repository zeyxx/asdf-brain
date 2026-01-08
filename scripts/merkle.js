#!/usr/bin/env node
/**
 * merkle.js - Merkle Tree utilities for asdf-brain
 *
 * Philosophy: Don't trust, verify
 * Purpose: Cryptographic verification of knowledge provenance
 *
 * This prepares knowledge for 100% on-chain verification
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');
const PROVENANCE_DIR = path.join(KNOWLEDGE_DIR, 'provenance');

/**
 * SHA256 hash in hex
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash a file's contents
 */
function hashFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return sha256(content);
}

/**
 * Combine two hashes (for Merkle tree nodes)
 */
function combineHashes(left, right) {
  // Consistent ordering - smaller hash first
  const ordered = left < right ? left + right : right + left;
  return sha256(ordered);
}

/**
 * Build Merkle tree from array of hashes
 * Returns { root, tree, proofs }
 */
function buildMerkleTree(hashes) {
  if (hashes.length === 0) {
    return { root: sha256('empty'), tree: [], proofs: {} };
  }

  // Store original hashes for proof generation
  const leaves = [...hashes];
  const proofs = {};

  // Initialize proofs for each leaf
  leaves.forEach((hash, idx) => {
    proofs[hash] = [];
  });

  let currentLevel = [...leaves];
  const tree = [currentLevel];

  while (currentLevel.length > 1) {
    const nextLevel = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left; // Duplicate last if odd

      const parent = combineHashes(left, right);
      nextLevel.push(parent);

      // Update proofs for all leaves that pass through this node
      leaves.forEach(leafHash => {
        const proof = proofs[leafHash];
        const leafIdx = currentLevel.indexOf(leafHash);

        // Check if this leaf is in left or right subtree
        if (leafIdx !== -1) {
          const pairIdx = leafIdx % 2 === 0 ? leafIdx + 1 : leafIdx - 1;
          const sibling = currentLevel[pairIdx] || currentLevel[leafIdx];
          const direction = leafIdx % 2 === 0 ? 'right' : 'left';

          proof.push({ hash: sibling, direction });

          // Update position for next level
          const parentIdx = Math.floor(leafIdx / 2);
          currentLevel[parentIdx] = parent;
        }
      });
    }

    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0],
    tree,
    proofs
  };
}

/**
 * Verify a Merkle proof
 */
function verifyProof(leafHash, proof, root) {
  let currentHash = leafHash;

  for (const step of proof) {
    if (step.direction === 'left') {
      currentHash = combineHashes(step.hash, currentHash);
    } else {
      currentHash = combineHashes(currentHash, step.hash);
    }
  }

  return currentHash === root;
}

/**
 * Scan knowledge directory and compute state hash
 */
function computeKnowledgeState() {
  const state = {
    timestamp: new Date().toISOString(),
    files: {},
    hashes: []
  };

  // Recursively find all JSON files
  function scanDir(dir, basePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath, relativePath);
      } else if (entry.name.endsWith('.json')) {
        const hash = hashFile(fullPath);
        state.files[relativePath] = {
          hash,
          size: fs.statSync(fullPath).size,
          modified: fs.statSync(fullPath).mtime.toISOString()
        };
        state.hashes.push(hash);
      }
    }
  }

  scanDir(KNOWLEDGE_DIR);

  // Build Merkle tree
  const merkle = buildMerkleTree(state.hashes);

  return {
    ...state,
    merkle_root: merkle.root,
    file_count: Object.keys(state.files).length,
    verification: {
      algorithm: 'SHA256',
      tree_depth: merkle.tree.length,
      chain_ready: true
    }
  };
}

/**
 * Generate contribution hash
 */
function hashContribution(contribution) {
  const canonical = JSON.stringify({
    type: contribution.type,
    contributor: contribution.contributor,
    path: contribution.path,
    content_hash: contribution.content_hash,
    timestamp: contribution.timestamp
  }, null, 0);

  return sha256(canonical);
}

/**
 * Main CLI
 */
async function main() {
  const command = process.argv[2] || 'state';

  switch (command) {
    case 'state': {
      console.log('Computing knowledge state...\n');
      const state = computeKnowledgeState();

      console.log(`Files: ${state.file_count}`);
      console.log(`Merkle Root: ${state.merkle_root}`);
      console.log(`Tree Depth: ${state.verification.tree_depth}`);
      console.log(`\nTimestamp: ${state.timestamp}`);

      // Save state
      const statePath = path.join(PROVENANCE_DIR, 'merkle-state.json');
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
      console.log(`\nState saved to: ${statePath}`);
      break;
    }

    case 'verify': {
      const filePath = process.argv[3];
      if (!filePath) {
        console.error('Usage: node merkle.js verify <file-path>');
        process.exit(1);
      }

      const hash = hashFile(filePath);
      console.log(`File: ${filePath}`);
      console.log(`Hash: ${hash}`);

      // Check against saved state
      const statePath = path.join(PROVENANCE_DIR, 'merkle-state.json');
      if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        const relativePath = path.relative(KNOWLEDGE_DIR, filePath);

        if (state.files[relativePath]) {
          const match = state.files[relativePath].hash === hash;
          console.log(`State Match: ${match ? 'YES' : 'NO (file changed)'}`);
        }
      }
      break;
    }

    case 'hash': {
      const data = process.argv[3];
      if (!data) {
        console.error('Usage: node merkle.js hash <data>');
        process.exit(1);
      }
      console.log(sha256(data));
      break;
    }

    default:
      console.log('Usage: node merkle.js [state|verify|hash]');
      console.log('  state  - Compute and save knowledge state');
      console.log('  verify - Verify a file against saved state');
      console.log('  hash   - Hash arbitrary data');
  }
}

// Export for programmatic use
module.exports = {
  sha256,
  hashFile,
  buildMerkleTree,
  verifyProof,
  computeKnowledgeState,
  hashContribution
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
