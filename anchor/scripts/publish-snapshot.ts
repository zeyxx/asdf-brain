/**
 * Publish Merkle Snapshot to Solana Devnet
 *
 * Usage: npx ts-node scripts/publish-snapshot.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AsdfMerkle } from "../target/types/asdf_merkle";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AsdfMerkle as Program<AsdfMerkle>;

  // Read latest snapshot
  const snapshotsDir = path.join(__dirname, "../../knowledge/provenance/snapshots");
  const files = fs.readdirSync(snapshotsDir).filter(f => f.startsWith("week-")).sort();

  if (files.length === 0) {
    console.error("No snapshots found. Run brain_provenance_snapshot first.");
    process.exit(1);
  }

  const latestFile = files[files.length - 1];
  const snapshot = JSON.parse(fs.readFileSync(path.join(snapshotsDir, latestFile), "utf-8"));

  console.log(`Publishing snapshot: ${latestFile}`);
  console.log(`Week: ${snapshot.week_number}`);
  console.log(`Root: ${snapshot.combined_root}`);

  // Convert hex root to bytes
  const rootBytes = Buffer.from(snapshot.combined_root, "hex");

  // Derive PDAs
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("brain-config")],
    program.programId
  );

  const weekNumber = snapshot.week_number % 65535; // Ensure fits in u16
  const [snapshotPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("snapshot"), Buffer.from(new Uint16Array([weekNumber]).buffer)],
    program.programId
  );

  console.log(`\nConfig PDA: ${configPda.toString()}`);
  console.log(`Snapshot PDA: ${snapshotPda.toString()}`);

  try {
    const tx = await program.methods
      .storeSnapshot(
        Array.from(rootBytes) as any,
        weekNumber,
        snapshot.statistics?.total_hashes || snapshot.solana_payload?.patterns || 0,
        0, // decision count (can be added later)
        1  // contributor count
      )
      .rpc();

    console.log(`\n✅ Snapshot published!`);
    console.log(`Transaction: ${tx}`);
    console.log(`Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    // Verify
    const storedSnapshot = await program.account.snapshot.fetch(snapshotPda);
    console.log(`\nVerification:`);
    console.log(`  Stored root: ${Buffer.from(storedSnapshot.root).toString("hex")}`);
    console.log(`  Week: ${storedSnapshot.weekNumber}`);
    console.log(`  Patterns: ${storedSnapshot.patternCount}`);

  } catch (err: any) {
    if (err.message?.includes("already in use")) {
      console.log(`\n⚠️ Snapshot for week ${weekNumber} already exists on-chain.`);

      // Fetch and display existing
      const existing = await program.account.snapshot.fetch(snapshotPda);
      console.log(`  Existing root: ${Buffer.from(existing.root).toString("hex")}`);
    } else {
      console.error(`\n❌ Error: ${err.message}`);
      throw err;
    }
  }
}

main().catch(console.error);
