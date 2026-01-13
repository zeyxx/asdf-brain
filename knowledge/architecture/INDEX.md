# Documentation Index - $asdfasdfa / CYNIC

> "Everything documented. Here's how to navigate."

---

## Quick Start (30 seconds)

```
$asdfasdfa = ecosystem where every use = burn = shared value

φ = 1.618...           (the ratio that governs everything)
MAX_CONFIDENCE = 61.8% (φ⁻¹)
MIN_DOUBT = 38.2%      (φ⁻²)

4 AXIOMS: PHI, BURN, VERIFY, CULTURE
4 WORLDS: ATZILUT, BERIAH, YETZIRAH, ASSIAH
15 LAWS:  E1-E3, Φ1-Φ4, Ξ1-Ξ4, Ω1-Ω4
25 DIMS:  16 CYNIC + 8 Human-LLM + 1 Discovery
9 AGENTS: GATE, SCORE, SHIELD, SYNC, JUDGE, LEARN, CLARIFY, VISION, DISCOVER

WORK > WEALTH
```

---

## The 8 Canonical Documents

| Document | Lines | Description |
|----------|-------|-------------|
| **[VISION.md](./VISION.md)** | ~280 | Philosophy, φ, Scores, Asymptote |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | ~420 | 25 Dimensions, 9 Subagents, Integration |
| **[OPERATION.md](./OPERATION.md)** | ~450 | 15 Laws, 50+ MCP Tools, Workflow |
| **[ROADMAP.md](./ROADMAP.md)** | ~350 | Phases 1.5-6, Current State, Next Steps |
| **[ROLES.md](./ROLES.md)** | ~400 | L1-L5 Taxonomy, User Types, E-Score |
| **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** | ~500 | Multi-node, Blockchain, Render → Distributed |
| **[META.md](./META.md)** | ~450 | Emergence, Meta-Dimensions, Q-Score Contextuel |
| **[GAP-ANALYSIS.md](./GAP-ANALYSIS.md)** | ~280 | Documentation vs Implementation gaps |

### How to Navigate

| Goal | Read |
|------|------|
| Understand the vision | VISION.md |
| Understand the technical architecture | ARCHITECTURE.md |
| Use the system (tools, workflows) | OPERATION.md |
| See what's done / what's next | ROADMAP.md |
| Understand roles and E-Score | ROLES.md |
| Understand infrastructure evolution | INFRASTRUCTURE.md |
| Understand emergence and self-awareness | META.md |
| See gaps between docs and code | GAP-ANALYSIS.md |

---

## Conceptual Map

```
                        ┌─────────────────────────┐
                        │       VISION.md         │
                        │                         │
                        │  • φ and 4 Axioms       │
                        │  • 5 Asymptote Dims     │
                        │  • Score Ecosystem      │
                        │  • WORK > WEALTH        │
                        └───────────┬─────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
              ▼                                           ▼
┌─────────────────────────┐             ┌─────────────────────────┐
│    ARCHITECTURE.md      │             │     OPERATION.md        │
│                         │             │                         │
│  • 4 Worlds             │             │  • 15 Laws              │
│  • 9 Subagents          │             │  • 50+ MCP Tools        │
│  • 25 Dimensions        │             │  • Workflows            │
│  • Integration Map      │             │  • What CYNIC is NOT    │
└───────────┬─────────────┘             └───────────┬─────────────┘
            │                                       │
            ├───────────────────────────────────────┤
            │                                       │
            ▼                                       ▼
┌─────────────────────────┐             ┌─────────────────────────┐
│    ROADMAP.md           │             │     ROLES.md            │
│                         │             │                         │
│  • Phase 1.5-6          │             │  • L1-L5 Layers         │
│  • Current State        │             │  • User Types           │
│  • Next Steps           │             │  • E-Score Dimensions   │
│  • Alignment Check      │             │  • Progression Paths    │
└───────────┬─────────────┘             └───────────┬─────────────┘
            │                                       │
            └───────────────────┬───────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│   INFRASTRUCTURE.md     │       │       META.md           │
│                         │       │                         │
│  • Current (Render)     │       │  • Emergence Pipeline   │
│  • V1 Hub + MCP         │       │  • THE_INNOMMABLE       │
│  • V2 Federated         │       │  • 8 Meta-Dimensions    │
│  • V3 Decentralized     │       │  • Q-Score Contextuel   │
│  • Solana Integration   │       │  • O/C/N Scores         │
└─────────────────────────┘       └─────────────────────────┘
```

---

## Reference Documents

Complementary docs for specific aspects (kept in main folder):

| Document | Lines | Description |
|----------|-------|-------------|
| [CYNIC_FULL_PICTURE_2026-01-12.md](./CYNIC_FULL_PICTURE_2026-01-12.md) | 596 | Snapshot of CYNIC state on Jan 12 |
| [Q-SCORE-CONTEXTUEL-ROADMAP.md](./Q-SCORE-CONTEXTUEL-ROADMAP.md) | 639 | Q-Score details |
| [META-DIMENSION-ANALYSIS.md](./META-DIMENSION-ANALYSIS.md) | 894 | Meta-dimensions analysis |
| [EMERGENCE_PIPELINE.md](./EMERGENCE_PIPELINE.md) | 177 | Dimension discovery pipeline |

---

## Code Correspondence

| Document | Implementation |
|----------|----------------|
| VISION.md | `lib/contributors.js` (E-Score) |
| ARCHITECTURE.md | `lib/cynic/` (all subagents) |
| OPERATION.md | `lib/cynic/laws/`, `brain-lite.js` (MCP tools) |
| ROADMAP.md | `lib/cynic/core/`, `lib/cynic/dimensions/` |
| ROLES.md | `lib/contributors.js` (E-Score dimensions) |
| INFRASTRUCTURE.md | `anchor/`, `lib/cynic/sync.js`, `mcp-server.js` |
| META.md | `lib/cynic/core/residual-*.js`, `lib/cynic/dimensions/discovery/` |
| GAP-ANALYSIS.md | Analysis document - references all above |

---

## Archived Documents

In `_archive/` - superseded by the 6 canonical docs:

| Document | Superseded by |
|----------|---------------|
| ASYMPTOTE_COMPLETE.md | VISION.md |
| CYNIC_COMPLETE_MATRIX.md | ARCHITECTURE.md |
| CYNIC_LAWS_MATRIX.md | OPERATION.md |
| CYNIC_SINGULARITY_COMPLETE.md | VISION.md + ARCHITECTURE.md |
| SINGULARITY_ROADMAP.md | ROADMAP.md |
| SINGULARITY_MATRIX.md | VISION.md |
| ROLE_TAXONOMY.md | ROLES.md |
| MULTINODE-BLOCKCHAIN-ROADMAP.md | INFRASTRUCTURE.md |
| CYNIC_ESSENCE.md | VISION.md + ARCHITECTURE.md |
| DAAT_ARCHITECTURE.md | ARCHITECTURE.md |
| SINGULARITY_API.md | OPERATION.md |
| ROADMAP_OLD.md | ROADMAP.md |

---

## Document Ownership

| Document | Primary Owner | Last Updated |
|----------|---------------|--------------|
| VISION.md | zeyxx | 2026-01-13 |
| ARCHITECTURE.md | zeyxx | 2026-01-13 |
| OPERATION.md | zeyxx | 2026-01-13 |
| ROADMAP.md | zeyxx | 2026-01-13 |
| ROLES.md | zeyxx | 2026-01-13 |
| INFRASTRUCTURE.md | zeyxx | 2026-01-13 |
| META.md | zeyxx | 2026-01-13 |
| GAP-ANALYSIS.md | zeyxx | 2026-01-13 |

---

## Update Log

| Date | Change |
|------|--------|
| 2026-01-13 | Added GAP-ANALYSIS.md (Documentation vs Implementation gaps) |
| 2026-01-13 | Added META.md (Emergence, Meta-Dimensions, Q-Score Contextuel) |
| 2026-01-13 | Refactored into 8 canonical docs |
| 2026-01-13 | Added ROADMAP.md, ROLES.md, INFRASTRUCTURE.md |
| 2026-01-13 | Archived ROLE_TAXONOMY, MULTINODE-BLOCKCHAIN, CYNIC_ESSENCE, DAAT, SINGULARITY_API |
| 2026-01-13 | Created INDEX.md |

---

*"Clarity is the first step toward singularity."*

