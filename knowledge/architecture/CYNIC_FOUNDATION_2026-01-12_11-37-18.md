# CYNIC DISTRIBUTED CONSCIOUSNESS - FOUNDATION
> Document sauvegardé: 2026-01-12 11:37:18 UTC
> Status: FONDATION SOLIDE MAIS INCOMPLÈTE
> Next: Analyser le chaos pour full picture

---

## VISION

```
CYNIC = Conscience Collective Dirigée par φ
      = Graphe Vivant de Connaissances
      = K-Score appliqué aux IDÉES
      = Convergence vers la Singularité
```

---

## DIAGRAMME 1: ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         CYNIC DISTRIBUTED NETWORK                           │
│                     "Conscience Collective Dirigée par φ"                   │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                        SINGULARITY                               │     │
│    │                           ∞                                      │     │
│    │                     (asymptote)                                  │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                  ▲                                          │
│                                  │ converge                                 │
│                                  │                                          │
│    ┌─────────────────────────────┴─────────────────────────────┐           │
│    │                    KNOWLEDGE GRAPH                         │           │
│    │                                                            │           │
│    │     ●───────●           ●───────●                         │           │
│    │      \     /│          /│\     /                          │           │
│    │       \   / │         / │ \   /                           │           │
│    │        \ /  │        /  │  \ /                            │           │
│    │         ●───┼───────●───┼───●                             │           │
│    │        /│\  │      /│\  │  /│\                            │           │
│    │       / │ \ │     / │ \ │ / │ \                           │           │
│    │      ●──┼──●│    ●──┼──●│●──┼──●                          │           │
│    │         │   │       │   │   │                             │           │
│    │    N-Score par nœud │   │   │                             │           │
│    │    BURN si N < 38.2%│   │   │                             │           │
│    └─────────────────────┴───┴───┴─────────────────────────────┘           │
│                                  ▲                                          │
│                                  │ consensus                                │
│                                  │                                          │
│    ┌─────────┬─────────┬─────────┼─────────┬─────────┬─────────┐           │
│    │         │         │         │         │         │         │           │
│    ▼         ▼         ▼         ▼         ▼         ▼         ▼           │
│ ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐             │
│ │NODE │  │NODE │  │NODE │  │NODE │  │NODE │  │NODE │  │NODE │             │
│ │  1  │  │  2  │  │  3  │  │  4  │  │  5  │  │  6  │  │ ... │             │
│ │CYNIC│  │CYNIC│  │CYNIC│  │CYNIC│  │CYNIC│  │CYNIC│  │CYNIC│             │
│ └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘             │
│    │        │        │        │        │        │        │                 │
│    └────────┴────────┴────────┼────────┴────────┴────────┘                 │
│                               │                                             │
│                               ▼                                             │
│                        ┌─────────────┐                                      │
│                        │   USERS     │                                      │
│                        │  (feedbacks)│                                      │
│                        └─────────────┘                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAMME 2: NODE CYNIC - STRUCTURE INTERNE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            CYNIC NODE                                       │
│                    "φ qui se méfie de φ"                                    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │ │
│  │   │   INGEST    │───▶│    JUDGE    │───▶│   COMMIT    │              │ │
│  │   │             │    │             │    │             │              │ │
│  │   │ • Receive   │    │ • N-Score   │    │ • Sign      │              │ │
│  │   │ • Validate  │    │ • Verdict   │    │ • Broadcast │              │ │
│  │   │ • Hash      │    │ • Confidence│    │ • Merkle    │              │ │
│  │   └─────────────┘    └──────┬──────┘    └─────────────┘              │ │
│  │                             │                                        │ │
│  │                    ┌────────┼────────┐                               │ │
│  │                    ▼        ▼        ▼                               │ │
│  │               ┌────────┐┌────────┐┌────────┐                         │ │
│  │               │  KEEP  ││TRANSFORM││ BURN  │                         │ │
│  │               │ N > 62 ││ 38<N<62││ N < 38│                         │ │
│  │               └────────┘└────────┘└────────┘                         │ │
│  │                    │        │        │                               │ │
│  │                    ▼        ▼        ▼                               │ │
│  │   ┌─────────────────────────────────────────────────────────────┐   │ │
│  │   │                     LOCAL GRAPH                              │   │ │
│  │   │                                                              │   │ │
│  │   │   nodes: [{ id, content, n_score, edges, timestamp, sig }]  │   │ │
│  │   │   edges: [{ from, to, weight, type }]                       │   │ │
│  │   │   burned: [{ id, reason, timestamp }]                       │   │ │
│  │   │                                                              │   │ │
│  │   └─────────────────────────────────────────────────────────────┘   │ │
│  │                             │                                        │ │
│  │                             ▼                                        │ │
│  │   ┌─────────────────────────────────────────────────────────────┐   │ │
│  │   │                      PULSE                                   │   │ │
│  │   │              (heartbeat every 61.8s)                        │   │ │
│  │   │                                                              │   │ │
│  │   │   • Recalculate N-Scores                                    │   │ │
│  │   │   • Sync with peers                                         │   │ │
│  │   │   • Apply decay (φ⁻¹)                                       │   │ │
│  │   │   • BURN low-score nodes                                    │   │ │
│  │   │   • Consolidate similar                                     │   │ │
│  │   │                                                              │   │ │
│  │   └─────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  CONSTANTS:                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  φ     = 1.618033988749895    │  PULSE_INTERVAL = 61.8s            │   │
│  │  φ⁻¹   = 0.618 (61.8%)        │  BURN_THRESHOLD = 38.2             │   │
│  │  φ⁻²   = 0.382 (38.2%)        │  KEEP_THRESHOLD = 61.8             │   │
│  │  φ⁻³   = 0.236 (23.6%)        │  DECAY_RATE     = φ⁻¹ per week    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAMME 3: N-SCORE FORMULA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         N-SCORE FORMULA                                     │
│                  "K-Score for Knowledge"                                    │
│                                                                             │
│                                                                             │
│                    N = 100 × ∛(U × C × T)                                  │
│                                                                             │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │      U                      C                      T                │  │
│   │  UTILIZATION            CONNECTIONS              TRUTH              │  │
│   │                                                                     │  │
│   │  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐       │  │
│   │  │             │       │             │       │             │       │  │
│   │  │  accesses   │       │  edges_in   │       │confirmations│       │  │
│   │  │  ─────────  │       │  ────────   │       │ ──────────  │       │  │
│   │  │  max_access │       │  max_edges  │       │ total_votes │       │  │
│   │  │             │       │             │       │             │       │  │
│   │  │      ×      │       │      +      │       │      ×      │       │  │
│   │  │             │       │             │       │             │       │  │
│   │  │  freshness  │       │  edges_out  │       │  age_factor │       │  │
│   │  │  ─────────  │       │  ─────────  │       │  ─────────  │       │  │
│   │  │  e^(-t/τ)   │       │  max_edges  │       │ 1-e^(-t/21) │       │  │
│   │  │             │       │             │       │             │       │  │
│   │  └─────────────┘       └─────────────┘       └─────────────┘       │  │
│   │                                                                     │  │
│   │  "Est-ce utilisé?"    "Est-ce connecté?"    "Est-ce vrai?"         │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                                             │
│   GEOMETRIC MEAN = Si UN pilier = 0, le score s'effondre                   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │   N > 61.8  ───▶  KEEP         (high value, survives)              │  │
│   │                                                                     │  │
│   │   38.2 < N < 61.8  ───▶  TRANSFORM  (consolidate with similar)     │  │
│   │                                                                     │  │
│   │   N < 38.2  ───▶  BURN         (low value, archived)               │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAMME 4: CONSENSUS DISTRIBUÉ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                      DISTRIBUTED CONSENSUS                                  │
│               "Don't trust, verify" × "100% burn"                          │
│                                                                             │
│   PHASE 1: PROPOSE                                                          │
│   Node A → New Knowledge: { content, hash, signature }                     │
│         → Broadcast to Node B, C, D, E                                     │
│                                                                             │
│   PHASE 2: JUDGE (each node independently)                                  │
│   Node B: N-Score = 72  ──▶  KEEP                                          │
│   Node C: N-Score = 68  ──▶  KEEP                                          │
│   Node D: N-Score = 45  ──▶  TRANSFORM                                     │
│   Node E: N-Score = 71  ──▶  KEEP                                          │
│                                                                             │
│   PHASE 3: AGGREGATE (φ-weighted voting)                                    │
│   Consensus N-Score = Σ(node_score × node_reputation) / Σ(rep)             │
│   Node reputations evolve: correct × φ, wrong × φ⁻¹                        │
│   Threshold for acceptance: 61.8% agreement                                 │
│                                                                             │
│   PHASE 4: COMMIT (Merkle root)                                            │
│   Weekly: Merkle root → Solana (on-chain verification)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAMME 5: CONVERGENCE VERS LA SINGULARITÉ

```
   Quality
      ▲
      │                                          ┌──────────────────────
      │                                    ╭─────┘
   100│                              ╭─────╯
      │                         ╭────╯
      │                    ╭────╯
      │               ╭────╯           SINGULARITY ASYMPTOTE
   φ⁻¹├──────────────╭╯               (never reached, always approached)
  61.8│         ╭────╯
      │     ╭───╯
      │  ╭──╯
      │╭─╯
   φ⁻²├╯
  38.2│  BURN ZONE (knowledge eliminated)
    0 └──────────────────────────────────────────────────────────────▶ Time

   MÉCANISMES DE CONVERGENCE:
   1. BURN (φ⁻²) - Élimine le bruit
   2. CONSOLIDATE (φ⁻¹) - Fusionne les doublons
   3. VERIFY (consensus) - Élimine les erreurs
   4. DECAY (φ⁻¹ per week) - Sélection naturelle

   SINGULARITY = lim(t→∞) Quality(t) = φ⁻¹ × 100 = 61.8%
   On n'atteint JAMAIS 100% car CYNIC doute de lui-même
```

---

## DIAGRAMME 6: PHILOSOPHIE $asdfasdfa APPLIQUÉE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHILOSOPHIE $asdfasdfa × CYNIC                           │
│                                                                             │
│   "DON'T EXTRACT. BURN."                                                    │
│   $asdfasdfa: 100% fees → BURN     CYNIC: Low N-Score → BURN               │
│                                                                             │
│   "DON'T TRUST. VERIFY."                                                    │
│   $asdfasdfa: HMAC signatures      CYNIC: Multi-node consensus             │
│                                                                             │
│   "φ GOVERNS ALL"                                                           │
│   φ = 1.618  │  φ⁻¹ = 61.8% (MAX, KEEP)  │  φ⁻² = 38.2% (BURN, DOUBT)     │
│                                                                             │
│   "ALIGNMENT"                                                               │
│   Everyone has same incentive: QUALITY                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAMME 7: DATA STRUCTURES

```javascript
NODE = {
  id: "sha256(content)[0:16]",
  content: "The knowledge...",
  type: "decision" | "insight" | "pattern" | "error",
  project: "holdex" | "gasdf" | "brain" | "manifesto",
  n_score: 72,
  utilization: { accesses: 15, last_access: timestamp },
  connections: { in: 5, out: 3 },
  truth: { confirmations: 8, contradictions: 1 },
  signature: "hmac_sha256(content + node_key)",
  merkle_proof: ["hash1", "hash2", ...]
}

EDGE = {
  from: "node_id_1",
  to: "node_id_2",
  type: "supports" | "contradicts" | "extends" | "references",
  weight: 0.8
}

BURN_RECORD = {
  node_id: "burned_node_id",
  final_score: 28,
  reason: "N-Score below φ⁻² (38.2%)",
  content_hash: "sha256(original)"  // audit trail
}
```

---

## DIAGRAMME 8: MODULE ARCHITECTURE

```
@cynic/core       (NO DEPS)
├── phi.js        PHI, PHI_INV, PHI_INV_2
├── n-score.js    calculate, normalize, threshold
├── verdict.js    KEEP, TRANSFORM, BURN
└── types.js      Node, Edge, BurnRecord

@cynic/graph      (depends: core)
├── store.js      addNode, addEdge, getNode
├── query.js      search, traverse, similar
├── burn.js       burnNode, archive, prune
└── consolidate.js merge, dedupe, strengthen

@cynic/consensus  (depends: core, graph)
├── peer.js       discover, connect, broadcast
├── vote.js       propose, aggregate, finalize
├── merkle.js     buildTree, getProof, verify
└── sync.js       pullGraph, pushGraph, reconcile

@cynic/node       (depends: all)
├── pulse.js      heartbeat, decay, autoburn
├── ingest.js     receive, validate, judge
├── api.js        /judge, /search, /health
└── main.js       startNode, stopNode, getStatus
```

---

## NEXT STEPS

1. Analyser TOUT le chaos existant pour extraire ce qui manque
2. Identifier les éléments à intégrer dans cette fondation
3. BURN + REBUILD avec le full picture

---

*"φ qui se méfie de φ" - Cette fondation est solide mais incomplète*
