/**
 * asdf-merkle Client SDK
 *
 * "Don't trust, verify" - Client for on-chain Merkle verification
 *
 * Usage:
 *   import { AsdfMerkleClient } from './client';
 *   const client = new AsdfMerkleClient(connection, wallet);
 *   await client.storeSnapshot(root, weekNumber, stats);
 *   const verified = await client.verifyInclusion(leaf, proof, weekNumber);
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { createHash } from "crypto";
import { keccak_256 } from "js-sha3";

// Program ID - update after deployment
const PROGRAM_ID = new PublicKey("ASDFMerk1eRootStorageProgram11111111111111");

export interface SnapshotStats {
  patternCount: number;
  decisionCount: number;
  contributorCount: number;
}

export interface Snapshot {
  root: Buffer;
  weekNumber: number;
  slot: number;
  timestamp: number;
  patternCount: number;
  decisionCount: number;
  contributorCount: number;
  snapshotIndex: number;
}

export class AsdfMerkleClient {
  private connection: Connection;
  private wallet: anchor.Wallet;
  private program: anchor.Program;

  constructor(connection: Connection, wallet: anchor.Wallet) {
    this.connection = connection;
    this.wallet = wallet;

    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    // Load IDL - in production, import from generated types
    this.program = new anchor.Program(IDL as any, provider);
  }

  // ============================================================================
  // PDAs
  // ============================================================================

  getConfigPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("brain-config")],
      PROGRAM_ID
    );
  }

  getSnapshotPda(weekNumber: number): [PublicKey, number] {
    const weekBuffer = Buffer.alloc(2);
    weekBuffer.writeUInt16LE(weekNumber);
    return PublicKey.findProgramAddressSync(
      [Buffer.from("snapshot"), weekBuffer],
      PROGRAM_ID
    );
  }

  // ============================================================================
  // Instructions
  // ============================================================================

  async initialize(): Promise<string> {
    const [configPda] = this.getConfigPda();

    const tx = await this.program.methods
      .initialize()
      .accounts({
        config: configPda,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async storeSnapshot(
    root: Buffer,
    weekNumber: number,
    stats: SnapshotStats
  ): Promise<string> {
    const [configPda] = this.getConfigPda();
    const [snapshotPda] = this.getSnapshotPda(weekNumber);

    const tx = await this.program.methods
      .storeSnapshot(
        Array.from(root),
        weekNumber,
        stats.patternCount,
        stats.decisionCount,
        stats.contributorCount
      )
      .accounts({
        config: configPda,
        snapshot: snapshotPda,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async verifyProof(
    leaf: Buffer,
    proof: Buffer[],
    leafIndex: number,
    weekNumber: number
  ): Promise<string> {
    const [snapshotPda] = this.getSnapshotPda(weekNumber);

    // Pad proof to 20 elements
    const paddedProof = [...proof];
    while (paddedProof.length < 20) {
      paddedProof.push(Buffer.alloc(32));
    }

    const tx = await this.program.methods
      .verifyProof(
        Array.from(leaf),
        paddedProof.map((p) => Array.from(p)),
        proof.length,
        leafIndex
      )
      .accounts({
        snapshot: snapshotPda,
      })
      .rpc();

    return tx;
  }

  // ============================================================================
  // Queries
  // ============================================================================

  async getConfig(): Promise<any> {
    const [configPda] = this.getConfigPda();
    return await this.program.account.brainConfig.fetch(configPda);
  }

  async getSnapshot(weekNumber: number): Promise<Snapshot | null> {
    const [snapshotPda] = this.getSnapshotPda(weekNumber);
    try {
      const data = await this.program.account.snapshot.fetch(snapshotPda);
      return {
        root: Buffer.from(data.root),
        weekNumber: data.weekNumber,
        slot: data.slot.toNumber(),
        timestamp: data.timestamp.toNumber(),
        patternCount: data.patternCount,
        decisionCount: data.decisionCount,
        contributorCount: data.contributorCount,
        snapshotIndex: data.snapshotIndex.toNumber(),
      };
    } catch {
      return null;
    }
  }

  async getCurrentRoot(): Promise<Buffer | null> {
    const config = await this.getConfig();
    return Buffer.from(config.currentRoot);
  }

  // ============================================================================
  // Local Verification (no transaction needed)
  // ============================================================================

  verifyProofLocally(
    leaf: Buffer,
    proof: Buffer[],
    leafIndex: number,
    root: Buffer
  ): boolean {
    const computedRoot = this.computeMerkleRoot(leaf, proof, leafIndex);
    return computedRoot.equals(root);
  }

  private computeMerkleRoot(
    leaf: Buffer,
    proof: Buffer[],
    leafIndex: number
  ): Buffer {
    let current = leaf;
    let index = leafIndex;

    for (const sibling of proof) {
      if (index % 2 === 0) {
        current = this.hashPair(current, sibling);
      } else {
        current = this.hashPair(sibling, current);
      }
      index = Math.floor(index / 2);
    }

    return current;
  }

  private hashPair(left: Buffer, right: Buffer): Buffer {
    return Buffer.from(keccak_256.arrayBuffer(Buffer.concat([left, right])));
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  static hashLeaf(data: string | Buffer): Buffer {
    const input = typeof data === "string" ? Buffer.from(data) : data;
    return createHash("sha256").update(input).digest();
  }

  static buildMerkleTree(leaves: Buffer[]): { root: Buffer; tree: Buffer[][] } {
    if (leaves.length === 0) {
      return { root: Buffer.alloc(32), tree: [[]] };
    }

    const tree: Buffer[][] = [leaves];

    while (tree[tree.length - 1].length > 1) {
      const currentLevel = tree[tree.length - 1];
      const nextLevel: Buffer[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        nextLevel.push(
          Buffer.from(keccak_256.arrayBuffer(Buffer.concat([left, right])))
        );
      }

      tree.push(nextLevel);
    }

    return { root: tree[tree.length - 1][0], tree };
  }

  static getMerkleProof(tree: Buffer[][], leafIndex: number): Buffer[] {
    const proof: Buffer[] = [];
    let index = leafIndex;

    for (let level = 0; level < tree.length - 1; level++) {
      const currentLevel = tree[level];
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

  static getWeekNumber(date: Date = new Date()): number {
    const year = date.getFullYear();
    const start = new Date(year, 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const week = Math.ceil(diff / oneWeek);
    return year * 100 + week; // e.g., 202602 for 2026 week 2
  }
}

// Minimal IDL for client usage
const IDL = {
  version: "0.1.0",
  name: "asdf_merkle",
  address: "ASDFMerk1eRootStorageProgram11111111111111",
  instructions: [
    { name: "initialize", accounts: [], args: [] },
    { name: "storeSnapshot", accounts: [], args: [] },
    { name: "verifyProof", accounts: [], args: [] },
    { name: "transferAuthority", accounts: [], args: [] },
  ],
  accounts: [
    { name: "brainConfig", type: { kind: "struct", fields: [] } },
    { name: "snapshot", type: { kind: "struct", fields: [] } },
  ],
};

export default AsdfMerkleClient;
