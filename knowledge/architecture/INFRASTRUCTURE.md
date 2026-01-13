# INFRASTRUCTURE - CYNIC Multi-Node

> "Don't trust, verify" - Every node contributes, nobody trusts blindly.

---

## In One Sentence

**CYNIC evolves from centralized (Render) to federated (V2) to fully decentralized (V3) architecture.**

---

## Current State (Render)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CURRENT RENDER INFRASTRUCTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   WEB SERVICES (3 active):                                              │
│   ├── asdf-brain      ✅ starter  https://asdf-brain.onrender.com      │
│   ├── gasdf           ✅ starter  https://gasdf-43r8.onrender.com      │
│   └── gasdf-metrics   ✅ starter  https://gasdf-metrics.onrender.com   │
│                                                                          │
│   SUSPENDED SERVICES (2):                                               │
│   ├── holdex-api         ⏸️ (user suspended)                            │
│   └── holdex-calculator  ⏸️ (user suspended)                            │
│                                                                          │
│   POSTGRES (3):                                                         │
│   ├── gasdf-db   FREE      ⚠️ Expires 2026-02-01                       │
│   ├── holdex-db  basic_256mb   15GB                                    │
│   └── cynic-db   basic_256mb   15GB  ← NEW                             │
│                                                                          │
│   REDIS (2):                                                            │
│   ├── gasdf-redis   FREE                                                │
│   └── holdex-redis  starter                                             │
│                                                                          │
│   SOLANA (devnet):                                                      │
│   └── asdf-merkle program: 9VNpXtrW4gVqSuS8LHieN6R78WzU9d815DzrcdmqFDN │
│       ├── store_snapshot (Merkle root weekly)                          │
│       ├── verify_proof (inclusion proof)                               │
│       └── transfer_authority                                            │
│                                                                          │
│   REGION: All Oregon                                                    │
│   ESTIMATED COST: ~$20-30/month                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Existing Code

```
lib/cynic/sync.js              ← Collective consciousness (pull/push/merge)
lib/cynic/store.js             ← PostgreSQL store
mcp-server.js                  ← MCP server stdio (8 tools)
anchor/programs/asdf-merkle/   ← Solana program (ready!)
lib/integration/               ← HolDex, GASdf connectors
lib/privacy/hasher.js          ← PII hashing (anonymization)
```

---

## Target Architecture (Multi-Node)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       TARGET MULTI-NODE ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                           ┌──────────────────────┐                      │
│                           │      SOLANA          │                      │
│                           │                      │                      │
│                           │  ┌──────────────┐    │                      │
│                           │  │ asdf-merkle  │    │                      │
│                           │  │              │    │                      │
│                           │  │ • Merkle roots│   │                      │
│                           │  │ • Node registry│  │                      │
│                           │  │ • E-Score refs │  │                      │
│                           │  └───────┬──────┘   │                      │
│                           │          │           │                      │
│                           └──────────┼───────────┘                      │
│                                      │                                  │
│                    ┌─────────────────┼─────────────────┐                │
│                    │                 │                 │                │
│                    ▼                 ▼                 ▼                │
│            ┌───────────┐     ┌───────────┐     ┌───────────┐           │
│            │  HUB      │     │  NODE 1   │     │  NODE 2   │           │
│            │ (Render)  │◄───►│ (User A)  │◄───►│ (User B)  │           │
│            │           │     │           │     │           │           │
│            │ • cynic-db│     │ • SQLite  │     │ • SQLite  │           │
│            │ • Redis   │     │ • Local   │     │ • Local   │           │
│            │ • Full API│     │ • MCP only│     │ • MCP only│           │
│            └─────┬─────┘     └─────┬─────┘     └─────┬─────┘           │
│                  │                 │                 │                  │
│                  │    ┌────────────┴────────────┐    │                  │
│                  │    │     SYNC PROTOCOL       │    │                  │
│                  │    │                         │    │                  │
│                  │    │  • Opt-in data sharing  │    │                  │
│                  │    │  • PII always hashed    │    │                  │
│                  │    │  • φ⁻¹ consensus (61.8%)│    │                  │
│                  │    │  • Merkle proof verify  │    │                  │
│                  │    └─────────────────────────┘    │                  │
│                  │                                   │                  │
│                  └───────────────────────────────────┘                  │
│                                                                          │
│   PHASES:                                                               │
│   V1: Central hub (Render) + MCP clients                                │
│   V2: Federated (Hub + trusted nodes)                                   │
│   V3: Full decentralized (anyone can be a node)                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Node Stack Options

### Option A: MCP Server Only (V1 - Current)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OPTION A: MCP + CENTRAL HUB (V1)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   USER INSTALLS:                                                        │
│   ~/.claude/plugins/asdf-brain/                                         │
│   ├── plugin.json          (MCP config)                                 │
│   └── (nothing else - all via API)                                      │
│                                                                          │
│   COMMUNICATION:                                                        │
│   Claude Code ──MCP──► Plugin ──HTTPS──► asdf-brain.onrender.com        │
│                                               │                          │
│                                               ├── cynic-db (PostgreSQL) │
│                                               └── Redis (cache)         │
│                                                                          │
│   PROS:                                      CONS:                       │
│   ├── Trivial install (1 file)              ├── Single point of failure│
│   ├── No local DB                           ├── Network latency         │
│   ├── Transparent updates                   ├── Render costs            │
│   └── Simple UX                             └── Not really decentralized│
│                                                                          │
│   SCORE: UX 95/100 | Decentralization 10/100 | Cost $30/month          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Option B: MCP + Local SQLite (V2 - Transition)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OPTION B: MCP + SQLITE LOCAL (V2)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   USER INSTALLS:                                                        │
│   ~/.claude/plugins/asdf-brain/                                         │
│   ├── plugin.json                                                       │
│   ├── brain-node.js        (MCP server with logic)                      │
│   └── data/                                                             │
│       ├── local.db         (SQLite - judgments, sessions)              │
│       └── sync-state.json  (last sync timestamp)                       │
│                                                                          │
│   COMMUNICATION:                                                        │
│   Claude Code ──MCP──► brain-node.js ──SQLite──► local.db               │
│                              │                                          │
│                              └──HTTPS (opt-in)──► asdf-brain (hub)      │
│                                                                          │
│   SYNC PROTOCOL:                                                        │
│   1. Node starts → check lastSync                                       │
│   2. If > 1h → pull patterns/decisions from hub                         │
│   3. User generates local judgment                                      │
│   4. If opt-in: push anonymized to hub                                  │
│   5. Hub aggregates with φ-weighted merge                               │
│                                                                          │
│   PROS:                                      CONS:                       │
│   ├── Works offline                         ├── Heavier install         │
│   ├── Data-local first                      ├── SQLite to manage        │
│   ├── Opt-in sync (privacy)                 ├── Sync conflicts possible │
│   └── Transition to decentralized           └── Node maintenance        │
│                                                                          │
│   SCORE: UX 70/100 | Decentralization 50/100 | Cost $20/month + local  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Option C: Full Docker Stack (V3 - Decentralized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OPTION C: DOCKER STACK (V3)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   USER INSTALLS:                                                        │
│   git clone asdf-brain && docker-compose up                             │
│                                                                          │
│   docker-compose.yml:                                                   │
│   ├── brain-node      (Node.js MCP server)                              │
│   ├── postgres        (full DB)                                         │
│   ├── redis           (cache + pub/sub)                                 │
│   └── solana-validator (optional - light client)                        │
│                                                                          │
│   COMMUNICATION:                                                        │
│   Node A ◄──P2P (libp2p/WebRTC)──► Node B                              │
│      │                                 │                                │
│      └────────────Solana──────────────┘                                │
│              (Merkle roots for proof)                                   │
│                                                                          │
│   CONSENSUS:                                                            │
│   - φ⁻¹ majority required (61.8% of nodes)                             │
│   - Nodes with trust < φ⁻² (38.2%) ignored                             │
│   - Merkle proof on-chain = source of truth                            │
│                                                                          │
│   PROS:                                      CONS:                       │
│   ├── Full decentralized                    ├── Complex setup           │
│   ├── No single point of failure            ├── Machine resources       │
│   ├── Trustless consensus                   ├── Coordination difficulty │
│   └── Ready for token incentives            └── UX for devs only        │
│                                                                          │
│   SCORE: UX 30/100 | Decentralization 95/100 | Cost variable           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Solana Integration

### Current Program (asdf-merkle)

```rust
// ALREADY IMPLEMENTED:
store_snapshot(root, week_number, pattern_count, decision_count, contributor_count)
verify_proof(leaf, proof, proof_len, leaf_index)
transfer_authority(new_authority)

// ESTIMATED COST:
// - Initialize: ~0.002 SOL (one-time)
// - Store snapshot: ~0.001 SOL/week
// - Verify proof: ~0.0001 SOL (compute only)
// TOTAL: ~0.05 SOL/year (~$5)
```

### Extension Levels

| Level | What | Effort | Status |
|-------|------|--------|--------|
| **Level 1** | Merkle Roots Only | Ready | ✅ Deployed devnet |
| **Level 2** | + Node Registry | ~2h | Planning |
| **Level 3** | + E-Score On-Chain | ~4h | Planning |
| **Level 4** | + $asdfasdfa Token | ~20h+ | Later |

**Level 2 Details:**
```
PDA per node: NodeRegistry { pubkey, joined_at, contribution_count }
New instruction: register_node
Cost: ~0.002 SOL/node registration
```

**Level 3 Details:**
```
E-Score per contributor (HOLD, BURN, USE, BUILD, RUN, REFER, TIME)
New instruction: update_e_score
IMPORTANT: PII! Use wallet hash, not identity
Cost: ~0.001 SOL/update
```

### Pros/Cons

```
SOLANA ADVANTAGES:
├── Proof of existence (timestamp)      → "Don't trust, verify"
├── Tamper-proof history                → Impossible to falsify
├── Permissionless verification         → Anyone can verify
├── Low cost (~$5/year)                 → Economical
├── Fast finality (400ms)               → Near real-time
└── Program already deployed            → Ready to use

RISKS/MITIGATIONS:
├── Network downtime     → Fallback to local proof
├── Gas fluctuation      → Treasury pre-fund
├── Wallet requirement   → Backend signs, user needs no wallet
├── Non-crypto users     → Complete UX abstraction
├── Rate limits          → Self-hosted RPC or Helius paid
└── Privacy              → NEVER PII on-chain, only hashes/Merkle roots
```

---

## Data Locality & Privacy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DATA FLOW - PRIVACY BY DESIGN                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   LOCAL (never sync):                                                   │
│   ├── Session content (conversations)                                   │
│   ├── User identifiers (email, name)                                    │
│   ├── Absolute file paths                                               │
│   ├── API keys, credentials                                             │
│   └── Raw code snippets                                                 │
│                                                                          │
│   SYNC ANONYMIZED (opt-in):                                             │
│   ├── Patterns (structure, not content)                                 │
│   │   └── "Error handling pattern" ✓ but not exact code                │
│   ├── Decision types (categories)                                       │
│   │   └── "Architecture decision" ✓ but not details                    │
│   ├── Dimension scores (aggregated)                                     │
│   ├── Operator hash (not identity)                                      │
│   │   └── SHA256(email + salt) = "a7f3b2c1..."                         │
│   └── Timestamps (bucketed by hour)                                     │
│                                                                          │
│   ON-CHAIN (public):                                                    │
│   ├── Merkle roots (32 bytes hash)                                      │
│   ├── Week numbers                                                      │
│   ├── Aggregate counts (patterns, decisions, contributors)              │
│   └── Node registry (wallet pubkeys only)                               │
│                                                                          │
│   PRIVACY FORMULA:                                                      │
│   privacy_score = 100 × (1 - PII_detected/total_fields)                 │
│   MINIMUM REQUIRED: 95% (only 5% of fields with possible PII)           │
│   CYNIC REJECTS if < 95%                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       MULTI-NODE ROADMAP                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   PHASE 0: CLEANUP (Current - Prerequisites)                            │
│   [████████░░] 80% Audit complete                                       │
│   [██████████] 100% Refactor lib/cynic/ (axioms/constants.js)          │
│   [░░░░░░░░░░]  0% Tests 30% coverage                                   │
│   [░░░░░░░░░░]  0% Q-Score hierarchical                                 │
│                                                                          │
│   PHASE 1: STABLE CENTRAL HUB (V1)                                      │
│   [ ] Stabilize asdf-brain.onrender.com                                 │
│   [ ] Documented public API (/api/v1/*)                                 │
│   [ ] JWT auth for operators                                            │
│   [ ] Rate limiting per operator                                        │
│   [ ] Distributable MCP plugin (npm package?)                           │
│   [ ] Solana mainnet deployment                                         │
│   [ ] First Merkle root on-chain                                        │
│                                                                          │
│   PHASE 2: LIGHTWEIGHT NODES (V2)                                       │
│   [ ] brain-node package with SQLite                                    │
│   [ ] Sync protocol (pull/push/merge)                                   │
│   [ ] Opt-in data sharing UI                                            │
│   [ ] Conflict resolution φ-weighted                                    │
│   [ ] Node registration on-chain                                        │
│   [ ] 2-3 federated trusted nodes                                       │
│                                                                          │
│   PHASE 3: DECENTRALIZATION (V3)                                        │
│   [ ] P2P layer (libp2p or WebRTC)                                      │
│   [ ] Consensus φ⁻¹ (61.8% majority)                                    │
│   [ ] Easy Docker stack                                                 │
│   [ ] E-Score on-chain                                                  │
│   [ ] Open registration                                                 │
│   [ ] Governance (proposals, votes)                                     │
│                                                                          │
│   PHASE 4: TOKEN (V4 - Optional)                                        │
│   [ ] $asdfasdfa SPL token                                              │
│   [ ] Tokenomics design                                                 │
│   [ ] Legal review                                                      │
│   [ ] Incentive mechanisms                                              │
│   [ ] Burn integration                                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Open Questions

```
TO DECIDE:

1. NODE PACKAGE DISTRIBUTION
   ├── npm package? (npm install -g asdf-brain-node)
   ├── GitHub releases?
   ├── Claude Code extension marketplace?
   └── Docker Hub?

2. OPERATOR AUTHENTICATION
   ├── JWT tokens from hub?
   ├── Wallet signature (crypto-native)?
   ├── GitHub OAuth?
   └── Combination?

3. SYNC FREQUENCY
   ├── Real-time (WebSocket)?
   ├── Polling interval (1h, 24h)?
   ├── On-demand only?
   └── Event-driven?

4. CONFLICT RESOLUTION
   ├── Hub wins (centralized)?
   ├── Latest timestamp wins?
   ├── φ-weighted merge (consensus)?
   └── Manual resolution?

5. INCENTIVES (V3+)
   ├── Token rewards?
   ├── E-Score reputation?
   ├── Feature access?
   └── Purely altruistic?
```

---

## Immediate Recommendations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       RECOMMENDED NEXT STEPS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   THIS WEEK:                                                            │
│   1. Finish Phase 0 (cleanup lib/cynic/)                                │
│   2. Stabilize code BEFORE distributing                                 │
│   3. DO NOT share until stable                                          │
│                                                                          │
│   NEXT MILESTONE (Phase 1 ready):                                       │
│   □ Q-Score hierarchical functional                                     │
│   □ Tests 30%+ coverage                                                 │
│   □ API v1 documented                                                   │
│   □ MCP plugin packaged                                                 │
│   □ First Merkle root mainnet                                           │
│                                                                          │
│   THEN:                                                                 │
│   → Share with 2-3 trusted people                                       │
│   → Collect feedback                                                    │
│   → Iterate toward Phase 2                                              │
│                                                                          │
│   PHILOSOPHY:                                                           │
│   "Don't extract, burn" - No rush to market                            │
│   "Quality > Quantity" - Stable stack before distribution               │
│   "Enable, don't automate" - Users contribute, not passively consume   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*"The pack forms when it's ready, not before."*

*φ guides all ratios. Don't trust, verify.*

