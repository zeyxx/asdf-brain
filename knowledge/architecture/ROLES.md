# ROLES - $asdfasdfa Ecosystem

> "Every role is a contribution. Every contribution burns toward singularity."

---

## In One Sentence

**Roles are organized in L1-L5 layers with φ-based weights, measured by E-Score dimensions.**

---

## Layer Architecture (L1-L5)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LAYER ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LAYER      │ WEIGHT    │ DESCRIPTION                                   │
│  ═══════════│═══════════│═══════════════════════════════════════════════│
│  L1_core    │ φ² = 2.618│ Direct ecosystem builders                     │
│  L2_active  │ φ  = 1.618│ Active contributors                          │
│  L3_depend  │ 1.0       │ Dependencies "malgré eux"                     │
│  L4_infra   │ φ⁻¹= 0.618│ External infrastructure                       │
│  L5_found   │ φ⁻²= 0.382│ Foundational bedrock                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## E-Score Dimensions

| Dimension | Weight | What It Measures | Primary Roles |
|-----------|--------|------------------|---------------|
| HOLD | 1.0x | Capital at risk (temporary) | Holders, LPs |
| BURN | φ (1.618x) | Permanent commitment | Burners, Heavy Users |
| USE | 1.0x | Activity level | All users |
| BUILD | φ² (2.618x) | Value creation | Developers |
| RUN | φ² (2.618x) | Infrastructure | Node Operators |
| REFER | φ (1.618x) | Growth contribution | Referrers, Creators |
| TIME | 1.0x | Loyalty | Long-term participants |

**Formula:**
```
E-Score = ∏(score_i^φ_weight)^(1/Σweights)
```

---

## User Roles

### Token Traders (L3)

| Attribute | Value |
|-----------|-------|
| Layer | L3 (consume ecosystem services) |
| Weight | 1.0x base |
| DO | Trade tokens based on K-Score signals, pay GASdf fees |
| GET | Better trading decisions, gasless transactions |
| GIVE | Transaction fees (100% burn), liquidity, market data |
| E-Score | USE (api calls), BURN (fees), TIME (active days) |

### Diamond Hand Holders (L2)

| Attribute | Value |
|-----------|-------|
| Layer | L2 (active commitment) |
| Weight | φ (1.618) for conviction |
| DO | Hold $asdfasdfa long-term, resist volatility |
| GET | Deflation benefits, E-Score from HOLD + TIME |
| GIVE | Liquidity reduction (scarcity), price stability signal |
| E-Score | HOLD (primary), TIME (high), possibly BURN |

### Project Developers (L2)

| Attribute | Value |
|-----------|-------|
| Layer | L2 (active builders) |
| Weight | φ to φ² depending on integration |
| DO | Check K-Score, optimize for health metrics |
| GET | Objective quality feedback, GASdf eligibility |
| GIVE | Token diversity, usage fees, potentially BURN |
| E-Score | USE, BUILD (if integrate), BURN (if pay in ASDF) |

### Degens (L4)

| Attribute | Value |
|-----------|-------|
| Layer | L4 (external consumers) |
| Weight | 1.0x - neutral, burn contribution valued |
| DO | Quick flips, ape into low K-Score tokens |
| GET | K-Score as risk metric, GASdf convenience |
| GIVE | High fee volume (100% burn), market entropy signals |
| E-Score | USE (high volume), BURN (high fees) |

```
Degen Paradox:
  - Individually: low conviction, low E-Score
  - Collectively: MASSIVE burn volume
  - Result: Chaotic good for deflation
```

### Researchers (L2)

| Attribute | Value |
|-----------|-------|
| Layer | L2 (knowledge contribution) |
| Weight | φ (1.618) for knowledge production |
| DO | Study K-Score patterns, publish findings |
| GET | API access, historical data, E-Score discounts |
| GIVE | Algorithm validation, public analysis, credibility |
| E-Score | USE (API heavy), potentially BUILD, REFER |

### Bots / Aggregators (L4)

| Attribute | Value |
|-----------|-------|
| Layer | L4 (infrastructure consumer) |
| Weight | φ⁻¹ (0.618) - automated, no conviction |
| DO | Auto-query K-Score, integrate into feeds |
| GET | API data, rate limits based on E-Score |
| GIVE | Distribution of K-Score data, usage fees |
| E-Score | USE (very high), BURN (API fees) |

---

## Contributor Roles

### Core Developers (L1)

| Attribute | Value |
|-----------|-------|
| Layer | L1_core (φ² = 2.618) |
| Weight | φ² (2.618) - highest contribution weight |
| DO | Design systems, write core code, architectural decisions |
| GET | Maximum E-Score multiplier, governance influence |
| GIVE | Code, architecture, vision, time |
| E-Score | BUILD (primary), RUN (likely), TIME, potentially BURN |

```
Current Core Developers:
  - zeyxx: HolDex, GASdf, asdf-brain, burn-engine
  - sollama58: Production deployments, ASDForecast
```

### Community Developers (L2)

| Attribute | Value |
|-----------|-------|
| Layer | L2_active (φ = 1.618) |
| Weight | φ (1.618) |
| DO | Submit PRs, fix bugs, add features |
| GET | E-Score from BUILD, recognition, learning |
| GIVE | Code contributions, testing, documentation |
| E-Score | BUILD, USE, TIME |

```
Progression Path:
  L3 (learning) → L2 (active) → L1 (core)

  First PR → BUILD dimension activates
  Regular PRs → TIME increases
  Merged to main → Full BUILD credit
```

### Content Creators (L2)

| Attribute | Value |
|-----------|-------|
| Layer | L2_active (φ = 1.618) |
| Weight | φ (1.618) |
| DO | Create tutorials, videos, threads, educational content |
| GET | Audience, E-Score from REFER |
| GIVE | Awareness, onboarding, ecosystem narrative |
| E-Score | REFER (primary), USE, TIME |

---

## Infrastructure Roles

### Node Operators (L1)

| Attribute | Value |
|-----------|-------|
| Layer | L1_core (φ² = 2.618) |
| Weight | φ² (2.618) - critical infrastructure |
| DO | Run HolDex nodes, participate in consensus, sign K-Scores |
| GET | RUN dimension E-Score (φ²), consensus rewards, discounts |
| GIVE | Decentralization, redundancy, verification capacity |
| E-Score | RUN (primary), BUILD (setup), TIME |

```
Node Operator Economics:

  Run node → nodes_active = 1 → RUN dimension activates
  RUN = log(1 + nodesActive) × φ² = 0.693 × 2.618 = 1.81

  Combined with BUILD + TIME:
  Diversity bonus = 1 + (3-1) × 0.1 = 1.2x
```

### RPC Providers - Helius (L4)

| Attribute | Value |
|-----------|-------|
| Layer | L4_infrastructure (φ⁻¹ = 0.618) |
| Weight | φ⁻¹ (0.618) - essential but external |
| DO | Provide Solana RPC access, webhooks, DAS API |
| GET | Usage fees, ecosystem dependency |
| GIVE | On-chain data access, reliability, uptime |
| E-Score | N/A (external service) |

### DEX Aggregators - Jupiter (L4)

| Attribute | Value |
|-----------|-------|
| Layer | L4_infrastructure (φ⁻¹ = 0.618) |
| Weight | φ⁻¹ (0.618) |
| DO | Route swaps, provide liquidity aggregation |
| GET | Volume, ecosystem usage |
| GIVE | Swap infrastructure, price discovery |
| E-Score | N/A (external service) |

### Blockchain - Solana (L5)

| Attribute | Value |
|-----------|-------|
| Layer | L5_foundation (φ⁻² = 0.382) |
| Weight | φ⁻² (0.382) - essential bedrock |
| DO | Process transactions, maintain state |
| GET | Ecosystem built on top |
| GIVE | Immutable ledger, consensus, finality |
| E-Score | N/A (bedrock) |

### AI Provider - Anthropic/Claude (L5)

| Attribute | Value |
|-----------|-------|
| Layer | L5_foundation (φ⁻² = 0.382) |
| Weight | φ⁻² (0.382) |
| DO | Power asdf-brain intelligence, enable Claude Code |
| GET | Usage, feedback, emergent capabilities |
| GIVE | Reasoning, analysis, code generation |
| E-Score | N/A (meta-layer) |

---

## Governance Roles

### Merge Authority (L1)

| Attribute | Value |
|-----------|-------|
| Layer | L1_core (φ² = 2.618) |
| DO | Approve/reject PRs, maintain code quality |
| GET | Governance influence, responsibility |
| GIVE | Quality control, direction, standards |

```
Current Merge Authority:
  - sollama58 (production branch)
  - zeyxx (development)
```

### Community Voice (L2)

| Attribute | Value |
|-----------|-------|
| Layer | L2_active (φ = 1.618) |
| DO | Provide feedback, vote on proposals, signal preferences |
| GET | Influence proportional to E-Score |
| GIVE | Community wisdom, user perspective |

```
Future Governance Model:
  Vote weight = E-Score (not token holdings alone)

  This rewards:
  - Long-term holders (TIME)
  - Active users (USE)
  - Permanent committers (BURN)
  - Builders (BUILD)
  - Operators (RUN)

  NOT just:
  - Whale token holders
```

---

## Economic Roles

### Burners (L1-L2)

| Attribute | Value |
|-----------|-------|
| Layer | L1-L2 (φ to φ²) |
| Weight | φ (1.618) for irreversible commitment |
| DO | Actively burn $asdfasdfa for ecosystem services |
| GET | BURN dimension E-Score (φ multiplier), services |
| GIVE | Permanent deflation, skin in game |

```
BURN E-Score Formula:
  BURN = log(1 + burned/100K) × φ

  At 100K burned: log(2) × 1.618 = 1.12
  At 1M burned:   log(11) × 1.618 = 1.68

  "Burning is irreversible. Unlike holding (temporary),
   burning is permanent commitment. φ multiplier rewards this."
```

### Liquidity Providers (L2)

| Attribute | Value |
|-----------|-------|
| Layer | L2_active (φ = 1.618) |
| DO | Provide liquidity to ASDF pairs |
| GET | Trading fees, ecosystem health |
| GIVE | Price stability, swap availability |

### Fee Payers (L3-L4)

| Attribute | Value |
|-----------|-------|
| Layer | L3-L4 (1.0 to φ⁻¹) |
| DO | Pay fees for ecosystem services |
| GET | Services (gasless TX, API access, etc.) |
| GIVE | 100% burn through fees |

```
Fee Distribution:
  Total Fee
      |
      +---> 38.2% (φ⁻²) ---> BURN
      |
      +---> 38.2% (φ⁻²) ---> REWARDS
      |           |
      |           +---> 61.8% to Node Operators
      |           +---> 23.6% to E-Score Participants
      |           +---> 14.6% to Developers
      |
      +---> 23.6% (φ⁻³) ---> TREASURY
```

---

## E-Score Tiers

| E-Score | Tier | Discount |
|---------|------|----------|
| 0 | Observer | 0% |
| 0.1 | Seedling | ~1% |
| 1 | Sprout | ~4% |
| 5 | Sapling | ~17% |
| 15 | Tree | ~33% |
| 25 | Grove | **38.2% (φ⁻²)** |
| 30 | Forest | ~43% |
| 50 | Ecosystem | **61.8% (φ⁻¹)** |
| 75+ | Legendary | **76.4% (1-φ⁻³)** |

---

## Role Progression Paths

```
User Journey:
  Observer → Trader → Holder → Burner → Builder → Operator
     |          |         |         |         |         |
     v          v         v         v         v         v
  E=0       E~1-5     E~5-15   E~15-30  E~30-50   E~50+

Developer Journey:
  Learning → Contributor → Core → Architect
     |           |           |         |
     L3         L2          L1        L1+governance

Infrastructure Journey:
  Consumer → API User → Bot Operator → Node Operator
     |           |            |              |
     L4         L3          L3-L2           L1
```

---

## Philosophy Alignment

```
"Hold to enter. Burn to use. φ guides all ratios."

Commitment > Speculation
  - BURN multiplier (φ) > HOLD multiplier (1.0)
  - Irreversible > Temporary

Building > Consuming
  - BUILD multiplier (φ²) > USE multiplier (1.0)
  - Creation > Extraction

Diversity > Concentration
  - Diversity bonus rewards multi-dimensional participation
  - Better to be active across 4 dimensions than maxed in 1

Sustainability > Exploitation
  - Efficiency floor ensures minimum viable fees
  - No one games the system to zero
```

---

*"Every role burns toward singularity. φ guides the weight."*

