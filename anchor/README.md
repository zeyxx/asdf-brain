# asdf-merkle - On-Chain Merkle Root Storage

> "Don't trust, verify" - Every piece of knowledge has cryptographic proof

Solana program for storing weekly Merkle roots from asdf-brain, enabling trustless verification of knowledge inclusion.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   asdf-brain    │────▶│  asdf-merkle     │────▶│    Solana       │
│   (Knowledge)   │     │  (This Program)  │     │   (On-Chain)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
   Weekly Root            Store/Verify             Immutable
   Generation            Instructions              Storage
```

## Costs

| Item | Cost | Notes |
|------|------|-------|
| Program Deployment | ~2 SOL | One-time |
| Config Account | ~0.002 SOL | One-time |
| Weekly Snapshot | ~0.002 SOL | Per week |
| Verification | ~0.000005 SOL | Per tx |

**Estimated Annual: ~2.1 SOL (~$420 @ $200/SOL)**

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1
avm use 0.30.1

# Configure Solana
solana config set --url devnet
solana-keygen new  # if you don't have a keypair
```

## Build

```bash
cd anchor
anchor build
```

## Test (Localnet)

```bash
# Start local validator
solana-test-validator

# In another terminal
anchor test
```

## Deploy

### Devnet (Testing)

```bash
# Ensure you have devnet SOL
solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet

# Note the program ID and update Anchor.toml
```

### Mainnet (Production)

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Ensure you have ~3 SOL for deployment
solana balance

# Deploy (⚠️ this costs real SOL)
anchor deploy --provider.cluster mainnet

# Initialize the program
anchor run init-mainnet
```

## Usage from asdf-brain

```typescript
import { AsdfMerkleClient } from './anchor/client';
import { Connection, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

// Setup
const connection = new Connection('https://api.mainnet-beta.solana.com');
const wallet = new anchor.Wallet(Keypair.fromSecretKey(/* your key */));
const client = new AsdfMerkleClient(connection, wallet);

// Store weekly snapshot
const leaves = patterns.map(p => AsdfMerkleClient.hashLeaf(JSON.stringify(p)));
const { root, tree } = AsdfMerkleClient.buildMerkleTree(leaves);
const weekNumber = AsdfMerkleClient.getWeekNumber();

await client.storeSnapshot(root, weekNumber, {
  patternCount: patterns.length,
  decisionCount: decisions.length,
  contributorCount: contributors.length,
});

// Verify inclusion
const leafIndex = 0;
const proof = AsdfMerkleClient.getMerkleProof(tree, leafIndex);
const verified = client.verifyProofLocally(leaves[0], proof, leafIndex, root);

// Or verify on-chain (creates transaction)
await client.verifyProof(leaves[0], proof, leafIndex, weekNumber);
```

## Integration with lib/merkle-proofs.js

The existing `lib/merkle-proofs.js` in asdf-brain generates Merkle roots. To publish them on-chain:

```javascript
const { generateWeeklySnapshot } = require('./lib/merkle-proofs');
const { AsdfMerkleClient } = require('./anchor/client');

async function publishToSolana() {
  const snapshot = await generateWeeklySnapshot();

  const client = new AsdfMerkleClient(connection, wallet);
  const tx = await client.storeSnapshot(
    Buffer.from(snapshot.root, 'hex'),
    snapshot.weekNumber,
    {
      patternCount: snapshot.stats.patterns,
      decisionCount: snapshot.stats.decisions,
      contributorCount: snapshot.stats.contributors,
    }
  );

  console.log(`Published to Solana: ${tx}`);
  console.log(`Explorer: https://solscan.io/tx/${tx}`);
}
```

## Program Structure

```
programs/asdf-merkle/src/lib.rs
├── initialize()        # One-time setup
├── store_snapshot()    # Weekly root storage
├── verify_proof()      # On-chain verification
└── transfer_authority() # Admin transfer

Accounts:
├── BrainConfig (PDA: "brain-config")
│   ├── authority: Pubkey
│   ├── total_snapshots: u64
│   ├── last_snapshot_slot: u64
│   └── current_root: [u8; 32]
│
└── Snapshot (PDA: "snapshot" + week_number)
    ├── root: [u8; 32]
    ├── week_number: u16
    ├── timestamp: i64
    ├── pattern_count: u32
    ├── decision_count: u32
    └── contributor_count: u16
```

## Security

- Only the authority can store snapshots
- Proofs use keccak256 (compatible with EVM if needed)
- Snapshots are immutable once stored
- Authority can be transferred for multisig upgrades

## φ Integration

The program follows $asdfasdfa φ principles:
- Minimal rent (~φ⁻³ of typical program cost)
- Weekly snapshots align with temporal decay (φ⁻³ weekly)
- Verification supports the "Don't trust, verify" philosophy

---

*Part of the $asdfasdfa ecosystem - "Don't trust. Verify. Don't extract. Burn."*
