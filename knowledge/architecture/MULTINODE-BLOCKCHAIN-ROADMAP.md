# CYNIC Multi-Node Blockchain Architecture

> "Don't trust, verify" - Chaque nœud contribue, personne ne fait confiance aveuglément
>
> Date: 2026-01-12
> Status: PLANNING PHASE

---

## 1. ÉTAT ACTUEL (Infrastructure Render)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE RENDER ACTUELLE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   SERVICES WEB (3 actifs):                                                  │
│   ├── asdf-brain      ✅ starter  https://asdf-brain.onrender.com          │
│   ├── gasdf           ✅ starter  https://gasdf-43r8.onrender.com          │
│   └── gasdf-metrics   ✅ starter  https://gasdf-metrics.onrender.com       │
│                                                                              │
│   SERVICES SUSPENDUS (2):                                                   │
│   ├── holdex-api         ⏸️ (user suspended)                                │
│   └── holdex-calculator  ⏸️ (user suspended)                                │
│                                                                              │
│   POSTGRES (3):                                                             │
│   ├── gasdf-db   FREE      ⚠️ Expire 2026-02-01                            │
│   ├── holdex-db  basic_256mb   15GB                                        │
│   └── cynic-db   basic_256mb   15GB  ← NOUVEAU                             │
│                                                                              │
│   REDIS (2):                                                                │
│   ├── gasdf-redis   FREE                                                    │
│   └── holdex-redis  starter                                                 │
│                                                                              │
│   SOLANA (devnet):                                                          │
│   └── asdf-merkle program: 9VNpXtrW4gVqSuS8LHieN6R78WzU9d815DzrcdmqFDN    │
│       ├── store_snapshot (Merkle root weekly)                              │
│       ├── verify_proof (inclusion proof)                                   │
│       └── transfer_authority                                                │
│                                                                              │
│   RÉGION: Tous Oregon                                                       │
│   COÛT ESTIMÉ: ~$20-30/mois                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Code existant pertinent:

```
lib/cynic/sync.js              ← Conscience collective (pull/push/merge)
lib/cynic/store.js             ← PostgreSQL store
mcp-server.js                  ← MCP server stdio (8 tools)
anchor/programs/asdf-merkle/   ← Solana program (prêt!)
lib/integration/               ← HolDex, GASdf connectors
lib/privacy/hasher.js          ← PII hashing (anonymisation)
```

---

## 2. ARCHITECTURE CIBLE (Multi-Node)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE MULTI-NODE CIBLE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           ┌──────────────────────┐                          │
│                           │      SOLANA          │                          │
│                           │                      │                          │
│                           │  ┌──────────────┐    │                          │
│                           │  │ asdf-merkle  │    │                          │
│                           │  │              │    │                          │
│                           │  │ • Merkle roots│   │                          │
│                           │  │ • Node registry│  │                          │
│                           │  │ • E-Score refs │  │                          │
│                           │  └───────┬──────┘   │                          │
│                           │          │           │                          │
│                           └──────────┼───────────┘                          │
│                                      │                                      │
│                    ┌─────────────────┼─────────────────┐                    │
│                    │                 │                 │                    │
│                    ▼                 ▼                 ▼                    │
│            ┌───────────┐     ┌───────────┐     ┌───────────┐               │
│            │  HUB      │     │  NODE 1   │     │  NODE 2   │               │
│            │ (Render)  │◄───►│ (User A)  │◄───►│ (User B)  │               │
│            │           │     │           │     │           │               │
│            │ • cynic-db│     │ • SQLite  │     │ • SQLite  │               │
│            │ • Redis   │     │ • Local   │     │ • Local   │               │
│            │ • Full API│     │ • MCP only│     │ • MCP only│               │
│            └─────┬─────┘     └─────┬─────┘     └─────┬─────┘               │
│                  │                 │                 │                      │
│                  │    ┌────────────┴────────────┐    │                      │
│                  │    │     SYNC PROTOCOL       │    │                      │
│                  │    │                         │    │                      │
│                  │    │  • Opt-in data sharing  │    │                      │
│                  │    │  • PII always hashed    │    │                      │
│                  │    │  • φ⁻¹ consensus (61.8%)│    │                      │
│                  │    │  • Merkle proof verify  │    │                      │
│                  │    └─────────────────────────┘    │                      │
│                  │                                   │                      │
│                  └───────────────────────────────────┘                      │
│                                                                              │
│   PHASES:                                                                   │
│   V1: Hub central (Render) + MCP clients                                    │
│   V2: Fédéré (Hub + quelques nodes de confiance)                           │
│   V3: Full décentralisé (n'importe qui peut être node)                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. STACK NODE (Options analysées)

### Option A: MCP Server Seul (V1 - Recommandé pour démarrer)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPTION A: MCP + CENTRAL HUB (V1)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER INSTALLE:                                                            │
│   ═══════════════                                                           │
│   ~/.claude/plugins/asdf-brain/                                             │
│   ├── plugin.json          (MCP config)                                     │
│   └── (rien d'autre - tout via API)                                         │
│                                                                              │
│   COMMUNICATION:                                                            │
│   ══════════════                                                            │
│   Claude Code ──MCP──► Plugin ──HTTPS──► asdf-brain.onrender.com            │
│                                               │                              │
│                                               ├── cynic-db (PostgreSQL)     │
│                                               └── Redis (cache)             │
│                                                                              │
│   AVANTAGES:                                   INCONVÉNIENTS:                │
│   ├── Installation triviale (1 fichier)       ├── Single point of failure  │
│   ├── Pas de DB locale                        ├── Latence réseau            │
│   ├── Mises à jour transparentes              ├── Coûts Render              │
│   └── UX simplifiée                           └── Pas vraiment décentralisé │
│                                                                              │
│   DONNÉES: Tout sync au hub, PII hashé par privacy/hasher.js                │
│                                                                              │
│   SCORE: UX 95/100 | Décentralisation 10/100 | Coût $30/mois               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Option B: MCP + SQLite Local (V2 - Transition)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPTION B: MCP + SQLITE LOCAL (V2)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER INSTALLE:                                                            │
│   ═══════════════                                                           │
│   ~/.claude/plugins/asdf-brain/                                             │
│   ├── plugin.json                                                           │
│   ├── brain-node.js        (MCP server avec logic)                         │
│   └── data/                                                                 │
│       ├── local.db         (SQLite - judgments, sessions)                  │
│       └── sync-state.json  (last sync timestamp)                           │
│                                                                              │
│   COMMUNICATION:                                                            │
│   ══════════════                                                            │
│   Claude Code ──MCP──► brain-node.js ──SQLite──► local.db                   │
│                              │                                              │
│                              └──HTTPS (opt-in)──► asdf-brain (hub)          │
│                                                                              │
│   SYNC PROTOCOL:                                                            │
│   ══════════════                                                            │
│   1. Node démarre → check lastSync                                          │
│   2. Si > 1h → pull patterns/decisions du hub                               │
│   3. User génère local judgment                                             │
│   4. Si opt-in: push anonymisé au hub                                       │
│   5. Hub agrège avec φ-weighted merge                                       │
│                                                                              │
│   AVANTAGES:                                   INCONVÉNIENTS:                │
│   ├── Fonctionne offline                      ├── Installation plus lourde │
│   ├── Données locales first                   ├── SQLite à gérer           │
│   ├── Opt-in sync (privacy)                   ├── Sync conflicts possibles │
│   └── Transition vers décentralisé            └── Maintenance du node      │
│                                                                              │
│   SCORE: UX 70/100 | Décentralisation 50/100 | Coût $20/mois + local       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Option C: Full Docker Stack (V3 - Décentralisé)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPTION C: DOCKER STACK (V3)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER INSTALLE:                                                            │
│   ═══════════════                                                           │
│   git clone asdf-brain && docker-compose up                                 │
│                                                                              │
│   docker-compose.yml:                                                       │
│   ├── brain-node      (Node.js MCP server)                                  │
│   ├── postgres        (full DB)                                             │
│   ├── redis           (cache + pub/sub)                                     │
│   └── solana-validator (optionnel - light client)                          │
│                                                                              │
│   COMMUNICATION:                                                            │
│   ══════════════                                                            │
│   Node A ◄──P2P (libp2p/WebRTC)──► Node B                                  │
│      │                                 │                                    │
│      └────────────Solana──────────────┘                                    │
│              (Merkle roots for proof)                                       │
│                                                                              │
│   CONSENSUS:                                                                │
│   ══════════                                                                │
│   - φ⁻¹ majority required (61.8% des nodes)                                │
│   - Nodes avec trust < φ⁻² (38.2%) ignorés                                 │
│   - Merkle proof on-chain = source de vérité                               │
│                                                                              │
│   AVANTAGES:                                   INCONVÉNIENTS:                │
│   ├── Full décentralisé                       ├── Setup complexe           │
│   ├── Pas de single point of failure          ├── Ressources machine       │
│   ├── Consensus trustless                     ├── Coordination difficile   │
│   └── Ready for token incentives              └── UX pour devs seulement   │
│                                                                              │
│   SCORE: UX 30/100 | Décentralisation 95/100 | Coût variable               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. SOLANA: CE QU'ON PEUT FAIRE

### Programme actuel (asdf-merkle)

```rust
// DÉJÀ IMPLÉMENTÉ:
store_snapshot(root, week_number, pattern_count, decision_count, contributor_count)
verify_proof(leaf, proof, proof_len, leaf_index)
transfer_authority(new_authority)

// COÛT ESTIMÉ:
// - Initialize: ~0.002 SOL (one-time)
// - Store snapshot: ~0.001 SOL/week
// - Verify proof: ~0.0001 SOL (compute only)
// TOTAL: ~0.05 SOL/an (~$5)
```

### Extensions possibles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPTIONS D'EXTENSION SOLANA                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   NIVEAU 1: Merkle Roots Only (ACTUEL)                                      │
│   ════════════════════════════════════                                      │
│   ├── Weekly snapshot des patterns/decisions                                │
│   ├── Proof d'inclusion pour n'importe quelle connaissance                 │
│   ├── Coût: ~$5/an                                                          │
│   └── ✅ PRÊT - Programme déployé sur devnet                               │
│                                                                              │
│   NIVEAU 2: + Node Registry                                                 │
│   ═══════════════════════════                                               │
│   ├── PDA par node: NodeRegistry { pubkey, joined_at, contribution_count } │
│   ├── Permet de tracker qui contribue                                       │
│   ├── Coût: ~0.002 SOL/node registration                                    │
│   ├── Nécessite: Nouveau instruction register_node                          │
│   └── Effort: ~2h de dev Anchor                                            │
│                                                                              │
│   NIVEAU 3: + E-Score On-Chain                                              │
│   ════════════════════════════                                              │
│   ├── E-Score par contributeur (HOLD, BURN, USE, BUILD, RUN, REFER, TIME)  │
│   ├── Mise à jour via instruction update_e_score                            │
│   ├── Coût: ~0.001 SOL/update                                               │
│   ├── ATTENTION: PII! Utiliser wallet hash, pas identité                   │
│   └── Effort: ~4h de dev Anchor                                            │
│                                                                              │
│   NIVEAU 4: + Token $asdfasdfa (LATER)                                      │
│   ════════════════════════════════════                                      │
│   ├── SPL Token pour incentives                                             │
│   ├── Mint authority = programme                                            │
│   ├── Distribution basée sur E-Score                                        │
│   ├── Burn mechanism intégré                                                │
│   ├── COMPLEXITÉ: Tokenomics, légal, etc.                                  │
│   └── Effort: ~20h+ de dev + audit                                         │
│                                                                              │
│   RECOMMANDATION COURT TERME:                                               │
│   Niveau 1 (actuel) → Niveau 2 (node registry)                             │
│   Token = LATER, focus sur la tech d'abord                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pour/Contre Solana

```
AVANTAGES SOLANA:
├── Proof of existence (timestamp)      → "Don't trust, verify"
├── Tamper-proof history                → Impossible de falsifier
├── Permissionless verification         → N'importe qui peut vérifier
├── Low cost (~$5/an)                   → Économique
├── Fast finality (400ms)               → Quasi temps réel
└── Programme déjà déployé              → Ready to use

INCONVÉNIENTS/RISQUES:
├── Network downtime (rare mais possible)
├── Gas fees peuvent fluctuer
├── Nécessite wallet + SOL pour write
├── Complexité pour users non-crypto
├── RPC rate limits (Helius/public)
└── Données on-chain = public (privacy!)

MITIGATION:
├── Downtime: Fallback to local proof
├── Gas: Treasury pre-fund
├── Wallet: Backend signe, user n'a pas besoin de wallet
├── Non-crypto: Abstraction complète dans UX
├── Rate limits: Self-hosted RPC ou Helius paid
└── Privacy: JAMAIS de PII on-chain, seulement hashes/Merkle roots
```

---

## 5. DATA LOCALITY & PRIVACY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW - PRIVACY BY DESIGN                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   LOCAL (jamais sync):                                                      │
│   ════════════════════                                                      │
│   ├── Session content (conversations)                                       │
│   ├── User identifiers (email, name)                                        │
│   ├── File paths absolus                                                    │
│   ├── API keys, credentials                                                 │
│   └── Raw code snippets                                                     │
│                                                                              │
│   SYNC ANONYMISÉ (opt-in):                                                  │
│   ═════════════════════════                                                 │
│   ├── Patterns (structure, not content)                                     │
│   │   └── "Error handling pattern" ✓ mais pas le code exact                │
│   ├── Decision types (categories)                                           │
│   │   └── "Architecture decision" ✓ mais pas les détails                   │
│   ├── Dimension scores (aggregated)                                         │
│   ├── Operator hash (not identity)                                          │
│   │   └── SHA256(email + salt) = "a7f3b2c1..."                             │
│   └── Timestamps (bucketed by hour)                                         │
│                                                                              │
│   ON-CHAIN (public):                                                        │
│   ═══════════════════                                                       │
│   ├── Merkle roots (32 bytes hash)                                          │
│   ├── Week numbers                                                          │
│   ├── Aggregate counts (patterns, decisions, contributors)                  │
│   └── Node registry (wallet pubkeys only)                                   │
│                                                                              │
│   PRIVACY FORMULA:                                                          │
│   ═════════════════                                                         │
│   privacy_score = 100 × (1 - PII_detected/total_fields)                     │
│   MINIMUM REQUIS: 95% (seulement 5% de champs avec PII possible)           │
│   CYNIC REJECTS si < 95%                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. ROADMAP D'IMPLÉMENTATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROADMAP MULTI-NODE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PHASE 0: CLEANUP (ACTUEL - Prérequis)                                     │
│   ═══════════════════════════════════════                                   │
│   [■■■■■■■■■■] 100% Audit complet                                           │
│   [□□□□□□□□□□]   0% Refactor lib/cynic/ (axioms/ source of truth)          │
│   [□□□□□□□□□□]   0% Tests 30% coverage                                      │
│   [□□□□□□□□□□]   0% Q-Score hiérarchique                                    │
│                                                                              │
│   PHASE 1: HUB CENTRAL STABLE (V1)                                          │
│   ════════════════════════════════                                          │
│   [ ] Stabiliser asdf-brain.onrender.com                                    │
│   [ ] API publique documentée (/api/v1/*)                                   │
│   [ ] Auth JWT pour operators                                               │
│   [ ] Rate limiting par operator                                            │
│   [ ] MCP plugin distributable (npm package?)                               │
│   [ ] Solana mainnet deployment                                             │
│   [ ] Premier Merkle root on-chain                                          │
│                                                                              │
│   PHASE 2: NODES LÉGERS (V2)                                                │
│   ═══════════════════════════                                               │
│   [ ] brain-node package avec SQLite                                        │
│   [ ] Sync protocol (pull/push/merge)                                       │
│   [ ] Opt-in data sharing UI                                                │
│   [ ] Conflict resolution φ-weighted                                        │
│   [ ] Node registration on-chain                                            │
│   [ ] 2-3 nodes fédérés de confiance                                        │
│                                                                              │
│   PHASE 3: DÉCENTRALISATION (V3)                                            │
│   ════════════════════════════════                                          │
│   [ ] P2P layer (libp2p ou WebRTC)                                          │
│   [ ] Consensus φ⁻¹ (61.8% majority)                                        │
│   [ ] Docker stack facile                                                   │
│   [ ] E-Score on-chain                                                      │
│   [ ] Open registration                                                     │
│   [ ] Governance (proposals, votes)                                         │
│                                                                              │
│   PHASE 4: TOKEN (V4 - OPTIONNEL)                                           │
│   ════════════════════════════════                                          │
│   [ ] $asdfasdfa SPL token                                                  │
│   [ ] Tokenomics design                                                     │
│   [ ] Legal review                                                          │
│   [ ] Incentive mechanisms                                                  │
│   [ ] Burn integration                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. QUESTIONS OUVERTES

```
À DÉCIDER:

1. DISTRIBUTION DU NODE PACKAGE
   ├── npm package? (npm install -g asdf-brain-node)
   ├── GitHub releases?
   ├── Claude Code extension marketplace?
   └── Docker Hub?

2. AUTHENTICATION OPERATORS
   ├── JWT tokens émis par hub?
   ├── Wallet signature (crypto-native)?
   ├── GitHub OAuth?
   └── Combinaison?

3. SYNC FREQUENCY
   ├── Real-time (WebSocket)?
   ├── Polling interval (1h, 24h)?
   ├── On-demand only?
   └── Event-driven?

4. CONFLICT RESOLUTION
   ├── Hub wins (centralisé)?
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

## 8. RECOMMANDATION IMMÉDIATE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT STEPS RECOMMANDÉS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CETTE SEMAINE:                                                            │
│   ══════════════                                                            │
│   1. Finir Phase 0 (cleanup lib/cynic/)                                     │
│   2. Stabiliser le code AVANT de distribuer                                 │
│   3. NE PAS partager tant que pas stable                                    │
│                                                                              │
│   PROCHAIN MILESTONE (Phase 1 ready):                                       │
│   ═══════════════════════════════════                                       │
│   □ Q-Score hiérarchique fonctionnel                                        │
│   □ Tests 30%+ coverage                                                     │
│   □ API v1 documentée                                                       │
│   □ MCP plugin packagé                                                      │
│   □ Premier Merkle root mainnet                                             │
│                                                                              │
│   PUIS:                                                                     │
│   ═════                                                                     │
│   → Partager avec 2-3 personnes de confiance                                │
│   → Collecter feedback                                                      │
│   → Itérer vers Phase 2                                                     │
│                                                                              │
│   PHILOSOPHIE:                                                              │
│   ════════════                                                              │
│   "Don't extract, burn" - Pas de rush to market                            │
│   "Quality > Quantity" - Stack stable avant distribution                    │
│   "Enable, don't automate" - Les users contribuent, ne subissent pas       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*🐕 "La meute se forme quand elle est prête, pas avant."*

*φ guides all ratios. Don't trust, verify.*
