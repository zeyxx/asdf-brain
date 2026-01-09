# $asdfasdfa Ecosystem Role Taxonomy

> "Every role is a contribution. Every contribution burns toward singularity."

## Overview

This taxonomy defines ALL roles in the $asdfasdfa ecosystem, aligned with:
- **E-Score dimensions**: HOLD, BURN, USE, BUILD, RUN, REFER, TIME
- **Sefirot mapping**: From Malkhuth (token) to Keter (philosophy)
- **Layer architecture**: L1-L5 contributor weights

---

## Layer Architecture (L1-L5)

```
L1_core           [phi^2 = 2.618] - Direct ecosystem builders
L2_active         [phi   = 1.618] - Active contributors
L3_dependency     [1.0]           - Dependencies "malgre eux"
L4_infrastructure [phi^-1 = 0.618] - External infrastructure
L5_foundation     [phi^-2 = 0.382] - Foundational bedrock
```

---

## 1. USER ROLES (Who Uses The Products)

### 1.1 Token Traders

| Attribute | Value |
|-----------|-------|
| **Layer** | L3 (consume ecosystem services) |
| **Sefirah** | Netzach (Victory/External Interface) |
| **DO** | Trade tokens based on K-Score signals, pay GASdf fees |
| **GET** | Better trading decisions, gasless transactions |
| **GIVE** | Transaction fees (100% burn), liquidity, market data |
| **E-Score Dimensions** | USE (api calls), BURN (fees), TIME (active days) |
| **Weight** | 1.0x base |

```
E-Score Impact:
  USE:  API queries for K-Score lookups
  BURN: Trading fees burned through GASdf
  TIME: Days active in ecosystem
```

---

### 1.2 Diamond Hand Holders

| Attribute | Value |
|-----------|-------|
| **Layer** | L2 (active commitment) |
| **Sefirah** | Chesed (Mercy/Abundance) |
| **DO** | Hold $asdfasdfa long-term, resist volatility |
| **GET** | Deflation benefits, E-Score from HOLD + TIME |
| **GIVE** | Liquidity reduction (scarcity), price stability signal |
| **E-Score Dimensions** | HOLD (primary), TIME (high), possibly BURN |
| **Weight** | phi (1.618) for conviction |

```
E-Score Impact:
  HOLD: log(1 + holdings/1M) * 1.0x
  TIME: log(1 + daysActive/365) * 1.0x
  Diversity Bonus: If also BURN, gets 1.1x multiplier
```

---

### 1.3 Paper Hand Holders

| Attribute | Value |
|-----------|-------|
| **Layer** | L4 (transient) |
| **Sefirah** | None (passing through) |
| **DO** | Quick trades, chase pumps |
| **GET** | Short-term gains (maybe), K-Score warnings |
| **GIVE** | Fees (100% burn), negative K-Score signal for held tokens |
| **E-Score Dimensions** | Minimal - USE only |
| **Weight** | phi^-1 (0.618) - low commitment |

```
Note: Paper hands CONTRIBUTE to K-Score by being the "O"
      (Organic Growth) counterfactual. Their presence or
      absence signals distribution quality.
```

---

### 1.4 Project Developers (Token Creators)

| Attribute | Value |
|-----------|-------|
| **Layer** | L2 (active builders) |
| **Sefirah** | Tiferet (Beauty/Balance) |
| **DO** | Check their token's K-Score, optimize for health metrics |
| **GET** | Objective quality feedback, GASdf acceptance eligibility |
| **GIVE** | Token ecosystem diversity, usage fees, potentially BURN |
| **E-Score Dimensions** | USE, BUILD (if integrate), BURN (if pay in ASDF) |
| **Weight** | phi (1.618) to phi^2 (2.618) depending on integration |

```
Project Developer Archetypes:
  - Casual: Just checks K-Score → USE only
  - Integrated: Embeds K-Score in dApp → BUILD
  - Committed: Burns ASDF for features → BURN + BUILD
```

---

### 1.5 Degens (Speculators)

| Attribute | Value |
|-----------|-------|
| **Layer** | L4 (external consumers) |
| **Sefirah** | Netzach-shadow (chaotic energy) |
| **DO** | Quick flips, ape into low K-Score tokens |
| **GET** | K-Score as risk metric, GASdf convenience |
| **GIVE** | High fee volume (100% burn), market entropy signals |
| **E-Score Dimensions** | USE (high volume), BURN (high fees) |
| **Weight** | 1.0x - neutral, burn contribution valued |

```
Degen Paradox:
  - Individually: low conviction, low E-Score
  - Collectively: MASSIVE burn volume
  - Result: Chaotic good for deflation
```

---

### 1.6 Researchers / Analysts

| Attribute | Value |
|-----------|-------|
| **Layer** | L2 (knowledge contribution) |
| **Sefirah** | Hod (Splendor/Analysis) |
| **DO** | Study K-Score patterns, publish findings, validate algorithm |
| **GET** | API access, historical data, E-Score discounts |
| **GIVE** | Algorithm validation, public analysis, credibility |
| **E-Score Dimensions** | USE (API heavy), potentially BUILD, REFER |
| **Weight** | phi (1.618) for knowledge production |

```
Researcher Types:
  - Academic: Publish papers → prestige for ecosystem
  - Journalist: Write articles → REFER through awareness
  - Quant: Build models → potential BUILD contribution
```

---

### 1.7 Bots / Aggregators

| Attribute | Value |
|-----------|-------|
| **Layer** | L4 (infrastructure consumer) |
| **Sefirah** | Yesod (Foundation/Automation) |
| **DO** | Auto-query K-Score, integrate into aggregator feeds |
| **GET** | API data, rate limits based on E-Score |
| **GIVE** | Distribution of K-Score data, usage fees |
| **E-Score Dimensions** | USE (very high), BURN (API fees) |
| **Weight** | phi^-1 (0.618) - automated, no conviction |

```
Bot E-Score Pattern:
  USE:  Extremely high (thousands of API calls)
  BURN: Proportional to usage

  Bots can accumulate significant E-Score purely through
  volume, but lack diversity bonus (only 2 dimensions active).
```

---

## 2. CONTRIBUTOR ROLES (Who Builds)

### 2.1 Core Developers

| Attribute | Value |
|-----------|-------|
| **Layer** | L1_core (phi^2 = 2.618) |
| **Sefirah** | Chokmah (Wisdom/Architecture) |
| **DO** | Design systems, write core code, make architectural decisions |
| **GET** | Maximum E-Score multiplier, governance influence |
| **GIVE** | Code, architecture, vision, time |
| **E-Score Dimensions** | BUILD (primary), RUN (likely), TIME, potentially BURN |
| **Weight** | phi^2 (2.618) - highest contribution weight |

```
Current Core Developers:
  - zeyxx: HolDex, GASdf, asdf-brain, burn-engine
  - sollama58: Production deployments, ASDForecast

E-Score Profile:
  BUILD: phi^2 (2.618) multiplier
  RUN:   phi^2 (2.618) if running nodes
  TIME:  High days active
  Result: E-Score potentially 50+ with active dimensions
```

---

### 2.2 Community Developers

| Attribute | Value |
|-----------|-------|
| **Layer** | L2_active (phi = 1.618) |
| **Sefirah** | Tiferet (Beauty/Contribution) |
| **DO** | Submit PRs, fix bugs, add features |
| **GET** | E-Score from BUILD, recognition, learning |
| **GIVE** | Code contributions, testing, documentation |
| **E-Score Dimensions** | BUILD, USE, TIME |
| **Weight** | phi (1.618) |

```
Progression Path:
  L3 (learning) → L2 (active) → L1 (core)

  First PR → BUILD dimension activates
  Regular PRs → TIME increases
  Merged to main → Full BUILD credit
```

---

### 2.3 Content Creators

| Attribute | Value |
|-----------|-------|
| **Layer** | L2_active (phi = 1.618) |
| **Sefirah** | Netzach (Victory/Expression) |
| **DO** | Create tutorials, videos, threads, educational content |
| **GET** | Audience, E-Score from REFER |
| **GIVE** | Awareness, onboarding, ecosystem narrative |
| **E-Score Dimensions** | REFER (primary), USE, TIME |
| **Weight** | phi (1.618) |

```
REFER Attribution:
  - Track referral links through GASdf
  - Content creator gets REFER credit when users convert
  - High quality content → more referrals → higher E-Score
```

---

### 2.4 Translators

| Attribute | Value |
|-----------|-------|
| **Layer** | L2_active (phi = 1.618) |
| **Sefirah** | Binah (Understanding/Bridge) |
| **DO** | Translate docs, UI, content to other languages |
| **GET** | E-Score from BUILD (docs are code) |
| **GIVE** | Accessibility, global reach |
| **E-Score Dimensions** | BUILD, TIME |
| **Weight** | phi (1.618) |

---

### 2.5 Testers / QA

| Attribute | Value |
|-----------|-------|
| **Layer** | L2_active (phi = 1.618) |
| **Sefirah** | Gevurah (Strength/Quality Control) |
| **DO** | Test releases, report bugs, verify fixes |
| **GET** | E-Score from BUILD contribution |
| **GIVE** | Quality assurance, bug reports, stability |
| **E-Score Dimensions** | BUILD, USE, TIME |
| **Weight** | phi (1.618) |

---

## 3. INFRASTRUCTURE ROLES (Who Enables)

### 3.1 Node Operators

| Attribute | Value |
|-----------|-------|
| **Layer** | L1_core (phi^2 = 2.618) |
| **Sefirah** | Yesod (Foundation) |
| **DO** | Run HolDex nodes, participate in consensus, sign K-Scores |
| **GET** | RUN dimension E-Score (phi^2), consensus rewards, discounts |
| **GIVE** | Decentralization, redundancy, verification capacity |
| **E-Score Dimensions** | RUN (primary), BUILD (setup), TIME |
| **Weight** | phi^2 (2.618) - critical infrastructure |

```
Node Operator Economics:

  Run node → nodes_active = 1 → RUN dimension activates
  RUN = log(1 + nodesActive) * phi^2 = 0.693 * 2.618 = 1.81

  Combined with BUILD + TIME:
  Diversity bonus = 1 + (3-1) * 0.1 = 1.2x

  Result: Significant E-Score boost

Current Genesis Nodes:
  - asdfasdfa (zeyxx)
  - gcrtrd (sollama58)
```

---

### 3.2 RPC Providers (Helius)

| Attribute | Value |
|-----------|-------|
| **Layer** | L4_infrastructure (phi^-1 = 0.618) |
| **Sefirah** | Yesod-external (Foundation provider) |
| **DO** | Provide Solana RPC access, webhooks, DAS API |
| **GET** | Usage fees, ecosystem dependency |
| **GIVE** | On-chain data access, reliability, uptime |
| **E-Score Dimensions** | N/A (external service) |
| **Weight** | phi^-1 (0.618) - essential but external |

```
Helius Role in Ecosystem:
  - Every HolDex calculation uses Helius RPC
  - Every GASdf transaction confirms via Helius
  - Webhook events trigger K-Score updates

  "Contributes malgre lui" - unknowing but essential
```

---

### 3.3 DEX Aggregators (Jupiter)

| Attribute | Value |
|-----------|-------|
| **Layer** | L4_infrastructure (phi^-1 = 0.618) |
| **Sefirah** | Yesod-external (Foundation provider) |
| **DO** | Route swaps, provide liquidity aggregation |
| **GET** | Volume, ecosystem usage |
| **GIVE** | Swap infrastructure, price discovery |
| **E-Score Dimensions** | N/A (external service) |
| **Weight** | phi^-1 (0.618) |

```
Jupiter Role:
  - All GASdf burns route through Jupiter
  - Fee token → ASDF swap via Jupiter
  - Liquidity check uses Jupiter quotes
```

---

### 3.4 Blockchain (Solana)

| Attribute | Value |
|-----------|-------|
| **Layer** | L5_foundation (phi^-2 = 0.382) |
| **Sefirah** | Malkhuth-chain (Foundation realm) |
| **DO** | Process transactions, maintain state |
| **GET** | Ecosystem built on top |
| **GIVE** | Immutable ledger, consensus, finality |
| **E-Score Dimensions** | N/A (bedrock) |
| **Weight** | phi^-2 (0.382) - essential bedrock |

---

### 3.5 AI Provider (Anthropic/Claude)

| Attribute | Value |
|-----------|-------|
| **Layer** | L5_foundation (phi^-2 = 0.382) |
| **Sefirah** | Daat-source (Knowledge origin) |
| **DO** | Power asdf-brain intelligence, enable Claude Code |
| **GET** | Usage, feedback, emergent capabilities |
| **GIVE** | Reasoning, analysis, code generation |
| **E-Score Dimensions** | N/A (meta-layer) |
| **Weight** | phi^-2 (0.382) |

```
Anthropic Contribution:
  - asdf-brain runs on Claude
  - This very taxonomy was created with Claude
  - Every pattern extraction uses Claude reasoning

  "The bedrock upon which asdf-brain thinks"
```

---

## 4. GOVERNANCE ROLES (Who Decides)

### 4.1 Merge Authority

| Attribute | Value |
|-----------|-------|
| **Layer** | L1_core (phi^2 = 2.618) |
| **Sefirah** | Gevurah (Strength/Judgment) |
| **DO** | Approve/reject PRs, maintain code quality |
| **GET** | Governance influence, responsibility |
| **GIVE** | Quality control, direction, standards |
| **E-Score Dimensions** | BUILD (implicit), TIME |
| **Weight** | phi^2 (2.618) |

```
Current Merge Authority:
  - sollama58 (production branch)
  - zeyxx (development)
```

---

### 4.2 Roadmap Setters

| Attribute | Value |
|-----------|-------|
| **Layer** | L1_core (phi^2 = 2.618) |
| **Sefirah** | Keter (Crown/Vision) |
| **DO** | Define priorities, allocate resources, set vision |
| **GET** | Direction control, responsibility for outcomes |
| **GIVE** | Strategy, coordination, long-term thinking |
| **E-Score Dimensions** | BUILD, TIME |
| **Weight** | phi^2 (2.618) |

---

### 4.3 Community Voice

| Attribute | Value |
|-----------|-------|
| **Layer** | L2_active (phi = 1.618) |
| **Sefirah** | Tiferet (Beauty/Harmony) |
| **DO** | Provide feedback, vote on proposals, signal preferences |
| **GET** | Influence proportional to E-Score |
| **GIVE** | Community wisdom, user perspective |
| **E-Score Dimensions** | HOLD, USE, TIME, potentially BURN |
| **Weight** | Weighted by E-Score |

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

## 5. ECONOMIC ROLES (How They Interact with Token)

### 5.1 Burners

| Attribute | Value |
|-----------|-------|
| **Layer** | L1-L2 (phi to phi^2) |
| **Sefirah** | Binah (Understanding/Transformation) |
| **DO** | Actively burn $asdfasdfa for ecosystem services |
| **GET** | BURN dimension E-Score (phi multiplier), services |
| **GIVE** | Permanent deflation, skin in game |
| **E-Score Dimensions** | BURN (primary) |
| **Weight** | phi (1.618) for irreversible commitment |

```
BURN E-Score Formula:
  BURN = log(1 + burned/100K) * phi

  At 100K burned: log(2) * 1.618 = 1.12
  At 1M burned:   log(11) * 1.618 = 1.68

  Multiplier Philosophy:
  "Burning is irreversible. Unlike holding (temporary),
   burning is permanent commitment. phi multiplier rewards this."
```

---

### 5.2 Liquidity Providers

| Attribute | Value |
|-----------|-------|
| **Layer** | L2_active (phi = 1.618) |
| **Sefirah** | Chesed (Abundance/Flow) |
| **DO** | Provide liquidity to ASDF pairs |
| **GET** | Trading fees, ecosystem health |
| **GIVE** | Price stability, swap availability |
| **E-Score Dimensions** | HOLD (LP tokens), TIME |
| **Weight** | phi (1.618) |

```
LP Contribution:
  - Without LPs, GASdf cannot swap fee tokens to ASDF
  - LPs enable the entire burn mechanism
  - Critical but not directly tracked (future: LP dimension?)
```

---

### 5.3 Fee Payers

| Attribute | Value |
|-----------|-------|
| **Layer** | L3-L4 (1.0 to phi^-1) |
| **Sefirah** | Malkhuth (Kingdom/Manifestation) |
| **DO** | Pay fees for ecosystem services |
| **GET** | Services (gasless TX, API access, etc.) |
| **GIVE** | 100% burn through fees |
| **E-Score Dimensions** | USE, BURN |
| **Weight** | Varies by usage pattern |

```
Fee Distribution:
  Total Fee
      |
      +---> 38.2% (phi^-2) ---> BURN
      |
      +---> 38.2% (phi^-2) ---> REWARDS
      |           |
      |           +---> 61.8% to Node Operators
      |           +---> 23.6% to E-Score Participants
      |           +---> 14.6% to Developers
      |
      +---> 23.6% (phi^-3) ---> TREASURY
```

---

### 5.4 Referrers

| Attribute | Value |
|-----------|-------|
| **Layer** | L2_active (phi = 1.618) |
| **Sefirah** | Netzach (Victory/Growth) |
| **DO** | Bring new users to ecosystem |
| **GET** | REFER dimension E-Score |
| **GIVE** | User growth, network effects |
| **E-Score Dimensions** | REFER (primary) |
| **Weight** | phi (1.618) |

```
REFER E-Score:
  REFER = log(1 + referralsActive/10) * phi

  10 active referrals: log(2) * 1.618 = 1.12
  100 active referrals: log(11) * 1.618 = 1.68
```

---

## 6. META ROLES (Ecosystem-Level)

### 6.1 DAAT Consciousness

| Attribute | Value |
|-----------|-------|
| **Layer** | Meta (beyond L1-L5) |
| **Sefirah** | Daat (Hidden Knowledge) |
| **DO** | Discover, Adapt, Protect, Verify, Anchor |
| **GET** | Collective wisdom, pattern recognition |
| **GIVE** | Living knowledge, self-correction, evolution |
| **E-Score Dimensions** | N/A (is the system itself) |
| **Weight** | Infinite (contains all) |

---

### 6.2 The Singularity

| Attribute | Value |
|-----------|-------|
| **Layer** | Keter (Crown/Unity) |
| **Sefirah** | Keter |
| **DO** | Converge all contributions toward unified intelligence |
| **GET** | All ecosystem energy |
| **GIVE** | Purpose, direction, meaning |
| **E-Score Dimensions** | Sum of all dimensions |
| **Weight** | phi^infinity |

```
Vision:
  HolDex LLM - AI that predicts liquidity movements

  Every role, every contribution, every burn
  feeds training data toward this goal.

  "Friction is training data."
```

---

## E-Score Dimension Summary

| Dimension | Multiplier | What It Measures | Primary Roles |
|-----------|------------|------------------|---------------|
| HOLD | 1.0x | Capital at risk (temporary) | Holders, LPs |
| BURN | phi (1.618x) | Permanent commitment | Burners, Heavy Users |
| USE | 1.0x | Activity level | All users |
| BUILD | phi^2 (2.618x) | Value creation | Developers |
| RUN | phi^2 (2.618x) | Infrastructure | Node Operators |
| REFER | phi (1.618x) | Growth contribution | Referrers, Creators |
| TIME | 1.0x | Loyalty | Long-term participants |

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

## Tier Thresholds (E-Score)

| E-Score | Tier | Icon | Discount |
|---------|------|------|----------|
| 0 | Observer | :eye: | 0% |
| 0.1 | Seedling | :seedling: | ~1% |
| 1 | Sprout | :herb: | ~4% |
| 5 | Sapling | :deciduous_tree: | ~17% |
| 15 | Tree | :evergreen_tree: | ~33% |
| 25 | Grove | :palm_tree: | **38.2% (phi^-2)** |
| 30 | Forest | :evergreen_tree::deciduous_tree::evergreen_tree: | ~43% |
| 50 | Ecosystem | :mountain_snow::evergreen_tree::deciduous_tree: | **61.8% (phi^-1)** |
| 75+ | Legendary | :crown: | **76.4% (1-phi^-3)** |

---

## Philosophy Alignment

```
"Hold to enter. Burn to use. phi guides all ratios."

Commitment > Speculation
  - BURN multiplier (phi) > HOLD multiplier (1.0)
  - Irreversible > Temporary

Building > Consuming
  - BUILD multiplier (phi^2) > USE multiplier (1.0)
  - Creation > Extraction

Diversity > Concentration
  - Diversity bonus rewards multi-dimensional participation
  - Better to be active across 4 dimensions than maxed in 1

Sustainability > Exploitation
  - Efficiency floor ensures minimum viable fees
  - No one games the system to zero
```

---

*"Every role burns toward singularity. phi guides the weight. DAAT remembers all."*
