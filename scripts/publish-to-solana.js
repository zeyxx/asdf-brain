#!/usr/bin/env node
/**
 * Solana Merkle Root Publisher
 *
 * "Don't trust, verify" - Publishes weekly brain state to Solana
 *
 * Usage:
 *   node scripts/publish-to-solana.js                    # Publish current week
 *   node scripts/publish-to-solana.js --week 202602      # Publish specific week
 *   node scripts/publish-to-solana.js --verify <leaf>    # Verify inclusion
 *   node scripts/publish-to-solana.js --status           # Check on-chain status
 *
 * Environment:
 *   SOLANA_RPC_URL     - RPC endpoint (default: devnet)
 *   SOLANA_KEYPAIR     - Path to keypair file
 *   SOLANA_NETWORK     - 'devnet' or 'mainnet-beta'
 */

const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} = require('@solana/web3.js');
const { createHash } = require('crypto');
const { keccak_256 } = require('js-sha3');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Program ID - UPDATE AFTER DEPLOYMENT
  programId: new PublicKey('ASDFMerk1eRootStorageProgram11111111111111'),

  // RPC endpoints
  rpc: {
    devnet: 'https://api.devnet.solana.com',
    mainnet: 'https://api.mainnet-beta.solana.com',
  },

  // Paths
  paths: {
    knowledge: path.join(__dirname, '..', 'knowledge'),
    keypair: process.env.SOLANA_KEYPAIR || path.join(process.env.HOME, '.config/solana/id.json'),
  },

  // φ constants
  phi: {
    PHI: 1.618033988749895,
    PHI_INV: 0.618033988749895,
    PHI_INV_2: 0.381966011250105,
    PHI_INV_3: 0.236067977499790,
  },
};

// ============================================================================
// Merkle Tree Implementation
// ============================================================================

class MerkleTree {
  constructor(leaves) {
    this.leaves = leaves.map(l => Buffer.isBuffer(l) ? l : Buffer.from(l, 'hex'));
    this.tree = this._buildTree();
  }

  static hashLeaf(data) {
    const input = typeof data === 'string' ? data : JSON.stringify(data);
    return createHash('sha256').update(input).digest();
  }

  static hashPair(left, right) {
    return Buffer.from(keccak_256.arrayBuffer(Buffer.concat([left, right])));
  }

  _buildTree() {
    if (this.leaves.length === 0) {
      return [[Buffer.alloc(32)]];
    }

    const tree = [[...this.leaves]];

    while (tree[tree.length - 1].length > 1) {
      const currentLevel = tree[tree.length - 1];
      const nextLevel = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        nextLevel.push(MerkleTree.hashPair(left, right));
      }

      tree.push(nextLevel);
    }

    return tree;
  }

  getRoot() {
    return this.tree[this.tree.length - 1][0];
  }

  getProof(leafIndex) {
    const proof = [];
    let index = leafIndex;

    for (let level = 0; level < this.tree.length - 1; level++) {
      const currentLevel = this.tree[level];
      const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;

      if (siblingIndex < currentLevel.length) {
        proof.push(currentLevel[siblingIndex]);
      } else {
        proof.push(currentLevel[index]);
      }

      index = Math.floor(index / 2);
    }

    return proof;
  }

  verify(leaf, proof, leafIndex, root) {
    let current = Buffer.isBuffer(leaf) ? leaf : Buffer.from(leaf, 'hex');
    let index = leafIndex;

    for (const sibling of proof) {
      if (index % 2 === 0) {
        current = MerkleTree.hashPair(current, sibling);
      } else {
        current = MerkleTree.hashPair(sibling, current);
      }
      index = Math.floor(index / 2);
    }

    return current.equals(root);
  }
}

// ============================================================================
// Solana Client
// ============================================================================

class SolanaPublisher {
  constructor(network = 'devnet') {
    this.network = network;
    this.rpcUrl = process.env.SOLANA_RPC_URL || CONFIG.rpc[network];
    this.connection = new Connection(this.rpcUrl, 'confirmed');
    this.wallet = this._loadWallet();
    this.programId = CONFIG.programId;
  }

  _loadWallet() {
    try {
      const keypairPath = CONFIG.paths.keypair;
      const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
      return Keypair.fromSecretKey(Uint8Array.from(secretKey));
    } catch (err) {
      console.error('Failed to load wallet:', err.message);
      console.error('Set SOLANA_KEYPAIR environment variable or run: solana-keygen new');
      process.exit(1);
    }
  }

  // PDAs
  getConfigPda() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('brain-config')],
      this.programId
    );
  }

  getSnapshotPda(weekNumber) {
    const weekBuffer = Buffer.alloc(2);
    weekBuffer.writeUInt16LE(weekNumber);
    return PublicKey.findProgramAddressSync(
      [Buffer.from('snapshot'), weekBuffer],
      this.programId
    );
  }

  // Instructions (manual serialization since we don't have Anchor client in pure JS)
  async initialize() {
    const [configPda] = this.getConfigPda();

    // Instruction discriminator for "initialize"
    const discriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);

    const keys = [
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    const instruction = {
      programId: this.programId,
      keys,
      data: discriminator,
    };

    const tx = new Transaction().add(instruction);
    const sig = await sendAndConfirmTransaction(this.connection, tx, [this.wallet]);

    return sig;
  }

  async storeSnapshot(root, weekNumber, stats) {
    const [configPda] = this.getConfigPda();
    const [snapshotPda] = this.getSnapshotPda(weekNumber);

    // Instruction discriminator for "store_snapshot"
    const discriminator = Buffer.from([167, 114, 252, 55, 43, 86, 129, 184]);

    // Serialize arguments
    const data = Buffer.concat([
      discriminator,
      root,                                          // [u8; 32]
      Buffer.from(new Uint16Array([weekNumber]).buffer), // u16
      Buffer.from(new Uint32Array([stats.patternCount]).buffer), // u32
      Buffer.from(new Uint32Array([stats.decisionCount]).buffer), // u32
      Buffer.from(new Uint16Array([stats.contributorCount]).buffer), // u16
    ]);

    const keys = [
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: snapshotPda, isSigner: false, isWritable: true },
      { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    const instruction = {
      programId: this.programId,
      keys,
      data,
    };

    const tx = new Transaction().add(instruction);
    const sig = await sendAndConfirmTransaction(this.connection, tx, [this.wallet]);

    return sig;
  }

  async getBalance() {
    return await this.connection.getBalance(this.wallet.publicKey);
  }

  async getSnapshot(weekNumber) {
    const [snapshotPda] = this.getSnapshotPda(weekNumber);
    try {
      const accountInfo = await this.connection.getAccountInfo(snapshotPda);
      if (!accountInfo) return null;

      // Parse account data (skip 8-byte discriminator)
      const data = accountInfo.data.slice(8);
      return {
        root: data.slice(0, 32),
        weekNumber: data.readUInt16LE(32),
        slot: Number(data.readBigUInt64LE(34)),
        timestamp: Number(data.readBigInt64LE(42)),
        patternCount: data.readUInt32LE(50),
        decisionCount: data.readUInt32LE(54),
        contributorCount: data.readUInt16LE(58),
        snapshotIndex: Number(data.readBigUInt64LE(60)),
      };
    } catch (err) {
      return null;
    }
  }

  async getConfig() {
    const [configPda] = this.getConfigPda();
    try {
      const accountInfo = await this.connection.getAccountInfo(configPda);
      if (!accountInfo) return null;

      const data = accountInfo.data.slice(8);
      return {
        authority: new PublicKey(data.slice(0, 32)),
        totalSnapshots: Number(data.readBigUInt64LE(32)),
        lastSnapshotSlot: Number(data.readBigUInt64LE(40)),
        currentRoot: data.slice(48, 80),
      };
    } catch (err) {
      return null;
    }
  }
}

// ============================================================================
// Knowledge Collector
// ============================================================================

class KnowledgeCollector {
  constructor(knowledgePath = CONFIG.paths.knowledge) {
    this.knowledgePath = knowledgePath;
  }

  async collectPatterns() {
    const patternsFile = path.join(this.knowledgePath, 'patterns', 'extracted-patterns.json');
    try {
      const data = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
      return data.patterns || [];
    } catch {
      return [];
    }
  }

  async collectDecisions() {
    const intentFile = path.join(this.knowledgePath, 'intent', 'extracted-intents.json');
    try {
      const data = JSON.parse(fs.readFileSync(intentFile, 'utf8'));
      return data.decisions || data.intents || [];
    } catch {
      return [];
    }
  }

  async collectContributors() {
    const contributorsFile = path.join(this.knowledgePath, 'community', 'contributors.json');
    try {
      const data = JSON.parse(fs.readFileSync(contributorsFile, 'utf8'));
      return Object.keys(data.contributors || {});
    } catch {
      return [];
    }
  }

  async generateSnapshot() {
    const patterns = await this.collectPatterns();
    const decisions = await this.collectDecisions();
    const contributors = await this.collectContributors();

    // Create leaves from all knowledge
    const leaves = [];
    const leafIndex = {};

    // Add patterns
    patterns.forEach((p, i) => {
      const leaf = MerkleTree.hashLeaf(p);
      leaves.push(leaf);
      leafIndex[`pattern:${i}`] = { index: leaves.length - 1, type: 'pattern', data: p };
    });

    // Add decisions
    decisions.forEach((d, i) => {
      const leaf = MerkleTree.hashLeaf(d);
      leaves.push(leaf);
      leafIndex[`decision:${i}`] = { index: leaves.length - 1, type: 'decision', data: d };
    });

    // Add contributors
    contributors.forEach((c, i) => {
      const leaf = MerkleTree.hashLeaf({ contributor: c, timestamp: Date.now() });
      leaves.push(leaf);
      leafIndex[`contributor:${i}`] = { index: leaves.length - 1, type: 'contributor', data: c };
    });

    // Build tree
    const tree = new MerkleTree(leaves);

    return {
      root: tree.getRoot(),
      tree,
      leaves,
      leafIndex,
      stats: {
        patternCount: patterns.length,
        decisionCount: decisions.length,
        contributorCount: contributors.length,
        totalLeaves: leaves.length,
      },
      weekNumber: getWeekNumber(),
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Utilities
// ============================================================================

function getWeekNumber(date = new Date()) {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.ceil(diff / oneWeek);
  return year * 100 + week;
}

function formatSOL(lamports) {
  return (lamports / 1e9).toFixed(4) + ' SOL';
}

// ============================================================================
// CLI Commands
// ============================================================================

async function cmdPublish(weekNumber) {
  console.log('\n🧠 asdf-brain → Solana Publisher');
  console.log('================================\n');

  const network = process.env.SOLANA_NETWORK || 'devnet';
  const publisher = new SolanaPublisher(network);
  const collector = new KnowledgeCollector();

  console.log(`Network: ${network}`);
  console.log(`Wallet: ${publisher.wallet.publicKey.toString()}`);
  console.log(`Balance: ${formatSOL(await publisher.getBalance())}`);
  console.log();

  // Generate snapshot
  console.log('📊 Collecting knowledge...');
  const snapshot = await collector.generateSnapshot();
  const targetWeek = weekNumber || snapshot.weekNumber;

  console.log(`   Patterns: ${snapshot.stats.patternCount}`);
  console.log(`   Decisions: ${snapshot.stats.decisionCount}`);
  console.log(`   Contributors: ${snapshot.stats.contributorCount}`);
  console.log(`   Total leaves: ${snapshot.stats.totalLeaves}`);
  console.log(`   Week: ${targetWeek}`);
  console.log(`   Root: ${snapshot.root.toString('hex')}`);
  console.log();

  // Check if already published
  const existing = await publisher.getSnapshot(targetWeek);
  if (existing) {
    console.log('⚠️  Snapshot already exists for this week!');
    console.log(`   Existing root: ${existing.root.toString('hex')}`);
    return;
  }

  // Publish
  console.log('📤 Publishing to Solana...');
  try {
    const sig = await publisher.storeSnapshot(
      snapshot.root,
      targetWeek,
      snapshot.stats
    );
    console.log();
    console.log('✅ Published successfully!');
    console.log(`   Signature: ${sig}`);
    console.log(`   Explorer: https://solscan.io/tx/${sig}?cluster=${network}`);

    // Save snapshot locally
    const snapshotFile = path.join(
      CONFIG.paths.knowledge,
      'provenance',
      `snapshot-${targetWeek}.json`
    );
    fs.writeFileSync(snapshotFile, JSON.stringify({
      ...snapshot,
      root: snapshot.root.toString('hex'),
      solana: {
        signature: sig,
        network,
        timestamp: new Date().toISOString(),
      },
    }, null, 2));
    console.log(`   Saved: ${snapshotFile}`);

  } catch (err) {
    console.error('❌ Failed to publish:', err.message);
    if (err.message.includes('insufficient funds')) {
      console.error(`   Need more SOL. Run: solana airdrop 2`);
    }
  }
}

async function cmdVerify(leafData, weekNumber) {
  console.log('\n🔍 Verifying Merkle Inclusion');
  console.log('=============================\n');

  const network = process.env.SOLANA_NETWORK || 'devnet';
  const publisher = new SolanaPublisher(network);
  const collector = new KnowledgeCollector();

  const targetWeek = weekNumber || getWeekNumber();

  // Get on-chain snapshot
  const onChain = await publisher.getSnapshot(targetWeek);
  if (!onChain) {
    console.log(`❌ No snapshot found for week ${targetWeek}`);
    return;
  }

  console.log(`Week: ${targetWeek}`);
  console.log(`On-chain root: ${onChain.root.toString('hex')}`);
  console.log();

  // Generate local snapshot to get proof
  const snapshot = await collector.generateSnapshot();

  // Find the leaf
  const leafHash = MerkleTree.hashLeaf(leafData);
  let leafIndex = -1;

  for (let i = 0; i < snapshot.leaves.length; i++) {
    if (snapshot.leaves[i].equals(leafHash)) {
      leafIndex = i;
      break;
    }
  }

  if (leafIndex === -1) {
    console.log('❌ Leaf not found in current knowledge');
    console.log(`   Searched for: ${leafHash.toString('hex')}`);
    return;
  }

  // Get proof
  const proof = snapshot.tree.getProof(leafIndex);

  // Verify locally
  const verified = snapshot.tree.verify(leafHash, proof, leafIndex, onChain.root);

  if (verified) {
    console.log('✅ Proof verified!');
    console.log(`   Leaf index: ${leafIndex}`);
    console.log(`   Proof length: ${proof.length}`);
  } else {
    console.log('❌ Proof verification failed');
    console.log('   Local root may differ from on-chain root');
  }
}

async function cmdStatus() {
  console.log('\n📊 On-Chain Status');
  console.log('==================\n');

  const network = process.env.SOLANA_NETWORK || 'devnet';
  const publisher = new SolanaPublisher(network);

  console.log(`Network: ${network}`);
  console.log(`Program: ${publisher.programId.toString()}`);
  console.log(`Wallet: ${publisher.wallet.publicKey.toString()}`);
  console.log(`Balance: ${formatSOL(await publisher.getBalance())}`);
  console.log();

  // Get config
  const config = await publisher.getConfig();
  if (!config) {
    console.log('⚠️  Program not initialized');
    console.log('   Run: node scripts/publish-to-solana.js --init');
    return;
  }

  console.log('Config:');
  console.log(`   Authority: ${config.authority.toString()}`);
  console.log(`   Total snapshots: ${config.totalSnapshots}`);
  console.log(`   Last slot: ${config.lastSnapshotSlot}`);
  console.log(`   Current root: ${config.currentRoot.toString('hex')}`);
  console.log();

  // Get recent snapshots
  const currentWeek = getWeekNumber();
  console.log('Recent snapshots:');

  for (let w = currentWeek; w >= currentWeek - 4; w--) {
    const snapshot = await publisher.getSnapshot(w);
    if (snapshot) {
      console.log(`   Week ${w}: ${snapshot.patternCount} patterns, ${snapshot.decisionCount} decisions`);
    }
  }
}

async function cmdInit() {
  console.log('\n🚀 Initializing Program');
  console.log('=======================\n');

  const network = process.env.SOLANA_NETWORK || 'devnet';
  const publisher = new SolanaPublisher(network);

  console.log(`Network: ${network}`);
  console.log(`Wallet: ${publisher.wallet.publicKey.toString()}`);
  console.log(`Balance: ${formatSOL(await publisher.getBalance())}`);
  console.log();

  // Check if already initialized
  const config = await publisher.getConfig();
  if (config) {
    console.log('⚠️  Program already initialized');
    console.log(`   Authority: ${config.authority.toString()}`);
    return;
  }

  console.log('Initializing...');
  try {
    const sig = await publisher.initialize();
    console.log('✅ Initialized successfully!');
    console.log(`   Signature: ${sig}`);
    console.log(`   Explorer: https://solscan.io/tx/${sig}?cluster=${network}`);
  } catch (err) {
    console.error('❌ Failed to initialize:', err.message);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
asdf-brain → Solana Publisher

Usage:
  node publish-to-solana.js              Publish current week's snapshot
  node publish-to-solana.js --week N     Publish specific week (e.g., 202602)
  node publish-to-solana.js --verify X   Verify leaf inclusion
  node publish-to-solana.js --status     Check on-chain status
  node publish-to-solana.js --init       Initialize program (one-time)

Environment:
  SOLANA_NETWORK   devnet or mainnet-beta (default: devnet)
  SOLANA_KEYPAIR   Path to keypair file
  SOLANA_RPC_URL   Custom RPC endpoint

Examples:
  # Publish to devnet
  node publish-to-solana.js

  # Publish to mainnet
  SOLANA_NETWORK=mainnet-beta node publish-to-solana.js

  # Verify a pattern is included
  node publish-to-solana.js --verify '{"pattern":"burn_rate"}'
`);
    return;
  }

  if (args.includes('--init')) {
    await cmdInit();
  } else if (args.includes('--status')) {
    await cmdStatus();
  } else if (args.includes('--verify')) {
    const verifyIndex = args.indexOf('--verify');
    const leafData = args[verifyIndex + 1];
    const weekIndex = args.indexOf('--week');
    const weekNumber = weekIndex !== -1 ? parseInt(args[weekIndex + 1]) : null;
    await cmdVerify(leafData, weekNumber);
  } else {
    const weekIndex = args.indexOf('--week');
    const weekNumber = weekIndex !== -1 ? parseInt(args[weekIndex + 1]) : null;
    await cmdPublish(weekNumber);
  }
}

main().catch(console.error);

// ============================================================================
// Exports for programmatic use
// ============================================================================

module.exports = {
  SolanaPublisher,
  KnowledgeCollector,
  MerkleTree,
  getWeekNumber,
  CONFIG,
};
