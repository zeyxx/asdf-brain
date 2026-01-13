import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AsdfMerkle } from "../target/types/asdf_merkle";
import { expect } from "chai";
import { createHash } from "crypto";

describe("asdf-merkle", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AsdfMerkle as Program<AsdfMerkle>;

  // PDAs
  let configPda: anchor.web3.PublicKey;
  let configBump: number;

  // Test data - week number as weeks since Unix epoch (fits u16 for ~1260 years)
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % 65535;
  const testPatterns = ["pattern1", "pattern2", "pattern3"];

  before(async () => {
    // Derive config PDA
    [configPda, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("brain-config")],
      program.programId
    );
  });

  describe("initialize", () => {
    it("initializes the brain config", async () => {
      const tx = await program.methods
        .initialize()
        .accounts({
          config: configPda,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize tx:", tx);

      // Verify config
      const config = await program.account.brainConfig.fetch(configPda);
      expect(config.authority.toString()).to.equal(
        provider.wallet.publicKey.toString()
      );
      expect(config.totalSnapshots.toNumber()).to.equal(0);
    });
  });

  describe("store_snapshot", () => {
    it("stores a weekly merkle root", async () => {
      // Build Merkle tree from test patterns
      const leaves = testPatterns.map((p) => hashLeaf(p));
      const root = buildMerkleRoot(leaves);

      // Derive snapshot PDA
      const [snapshotPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("snapshot"), Buffer.from(new Uint16Array([weekNumber]).buffer)],
        program.programId
      );

      const tx = await program.methods
        .storeSnapshot(
          Array.from(root) as any,
          weekNumber,
          testPatterns.length,
          5, // decision count
          2  // contributor count
        )
        .accounts({
          config: configPda,
          snapshot: snapshotPda,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Store snapshot tx:", tx);

      // Verify snapshot
      const snapshot = await program.account.snapshot.fetch(snapshotPda);
      expect(Buffer.from(snapshot.root).toString("hex")).to.equal(
        root.toString("hex")
      );
      expect(snapshot.weekNumber).to.equal(weekNumber);
      expect(snapshot.patternCount).to.equal(testPatterns.length);
    });
  });

  describe("verify_proof", () => {
    it("verifies a valid merkle proof", async () => {
      const leaves = testPatterns.map((p) => hashLeaf(p));
      const leafIndex = 0;
      const proof = getMerkleProof(leaves, leafIndex);

      // Derive snapshot PDA
      const [snapshotPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("snapshot"), Buffer.from(new Uint16Array([weekNumber]).buffer)],
        program.programId
      );

      // Pad proof to 20 elements
      const paddedProof = [...proof];
      while (paddedProof.length < 20) {
        paddedProof.push(Buffer.alloc(32));
      }

      const tx = await program.methods
        .verifyProof(
          Array.from(leaves[leafIndex]) as any,
          paddedProof.map((p) => Array.from(p)) as any,
          proof.length,
          leafIndex
        )
        .accounts({
          snapshot: snapshotPda,
        })
        .rpc();

      console.log("Verify proof tx:", tx);
    });

    it("rejects an invalid proof", async () => {
      const leaves = testPatterns.map((p) => hashLeaf(p));
      const fakeLeaf = hashLeaf("fake_pattern");

      const [snapshotPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("snapshot"), Buffer.from(new Uint16Array([weekNumber]).buffer)],
        program.programId
      );

      const paddedProof = Array(20).fill(Array(32).fill(0));

      try {
        await program.methods
          .verifyProof(
            Array.from(fakeLeaf) as any,
            paddedProof,
            1,
            0
          )
          .accounts({
            snapshot: snapshotPda,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err.message).to.include("InvalidProof");
      }
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function hashLeaf(data: string): Buffer {
  return createHash("sha256").update(data).digest();
}

function hashPair(left: Buffer, right: Buffer): Buffer {
  // Use sha256 to match Solana program
  return createHash("sha256").update(Buffer.concat([left, right])).digest();
}

function buildMerkleRoot(leaves: Buffer[]): Buffer {
  if (leaves.length === 0) return Buffer.alloc(32);
  if (leaves.length === 1) return leaves[0];

  const nextLevel: Buffer[] = [];
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i];
    const right = i + 1 < leaves.length ? leaves[i + 1] : left;
    nextLevel.push(hashPair(left, right));
  }

  return buildMerkleRoot(nextLevel);
}

function getMerkleProof(leaves: Buffer[], index: number): Buffer[] {
  if (leaves.length <= 1) return [];

  const proof: Buffer[] = [];
  let currentIndex = index;
  let currentLevel = [...leaves];

  while (currentLevel.length > 1) {
    const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
    if (siblingIndex < currentLevel.length) {
      proof.push(currentLevel[siblingIndex]);
    } else {
      proof.push(currentLevel[currentIndex]);
    }

    // Build next level
    const nextLevel: Buffer[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      nextLevel.push(hashPair(left, right));
    }

    currentLevel = nextLevel;
    currentIndex = Math.floor(currentIndex / 2);
  }

  return proof;
}
