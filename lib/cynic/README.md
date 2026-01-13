# CYNIC - Cybernetic Yield for Neutral Integrity Curation

> "φ qui se méfie de φ" - The dog that watches itself

---

## Quick Start

```bash
# Run your own CYNIC node
npm run cynic:node

# Open browser
→ http://localhost:3618
```

## Philosophy

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CYNIC MANIFESTO                              │
├─────────────────────────────────────────────────────────────────────┤
│  "Don't trust, verify."         - Every judgment is questionable    │
│  "Don't extract, burn."         - 100% value back to ecosystem      │
│  "Culture is a moat."           - Human sovereignty preserved       │
│  "All ratios derive from φ."    - Golden ratio governs everything   │
├─────────────────────────────────────────────────────────────────────┤
│  MAX_CONFIDENCE: 61.8%   (φ⁻¹)  - Never claim certainty above this  │
│  MIN_DOUBT:      38.2%   (φ⁻²)  - Always maintain this doubt level  │
└─────────────────────────────────────────────────────────────────────┘
```

## Architecture

```
                     ┌──────────────────────────────────────────────┐
                     │              CYNIC NODE                       │
                     │         Port: 3618 (φ × 1000 × √5)           │
                     │         Memory only - ZERO disk I/O          │
                     └───────────────────────┬──────────────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
    ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
    │   4 AXIOMS      │          │    16 LAWS      │          │   4 WORLDS      │
    │   axioms/       │          │    laws/        │          │   worlds/       │
    │                 │          │                 │          │                 │
    │   PHI (φ)       │          │   E1-E4 (ATZ)   │          │   ATZILUT      │
    │   VERIFY        │          │   Φ1-Φ4 (BER)  │          │   BERIAH       │
    │   CULTURE       │          │   Ξ1-Ξ4 (YET)  │          │   YETZIRAH     │
    │   BURN          │          │   Ω1-Ω4 (ASS)  │          │   ASSIAH       │
    └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
             │                            │                            │
             └────────────────────────────┼────────────────────────────┘
                                          │
                                          ▼
                     ┌──────────────────────────────────────────────┐
                     │            24 DIMENSION EVALUATORS           │
                     │                 dimensions/                  │
                     │                                              │
                     │   PRIMARY (8):    harmony, coherence,        │
                     │                   truth, integrity,          │
                     │                   ethics, optimism,          │
                     │                   alignment, progress        │
                     │                                              │
                     │   SECONDARY (5):  secure, private, scale,    │
                     │                   simplify, enable           │
                     │                                              │
                     │   META (3):       self-awareness,            │
                     │                   learning-rate,             │
                     │                   singularity-distance       │
                     │                                              │
                     │   HUMAN-LLM (8):  memory, teaching, intent,  │
                     │                   trust, proactivity,        │
                     │                   complementarity,           │
                     │                   delegation, boundaries     │
                     └──────────────────────────────────────────────┘
```

## The 4 Axioms

| Axiom   | Symbol | World    | Weight | Question                          |
|---------|--------|----------|--------|-----------------------------------|
| PHI     | φ      | ATZILUT  | φ²     | Is phi-balance maintained?        |
| VERIFY  | V      | BERIAH   | φ      | Can this be verified?             |
| CULTURE | C      | YETZIRAH | φ      | Does this enable human autonomy?  |
| BURN    | B      | ASSIAH   | 1.0    | Does this protect collective value?|

## The 4 Worlds (Kabbalistic)

```
ATZILUT   (Essence)    → φ² = 2.618   "Closest to source"
   │
   ▼
BERIAH    (Economics)  → φ  = 1.618   "Creation"
   │
   ▼
YETZIRAH  (Ethics)     → φ  = 1.618   "Formation"
   │
   ▼
ASSIAH    (Operation)  → 1.0          "Action - base reality"
```

## Q-Score Formula

```
Q = 100 × ∜(φ_score × V_score × C_score × B_score)

où:
  φ_score = geometricMean(PHI dimensions)
  V_score = geometricMean(VERIFY dimensions)
  C_score = geometricMean(CULTURE dimensions)
  B_score = geometricMean(BURN dimensions)
```

## Verdict Thresholds

```
Q < 38.2        → REJECT     (sous φ⁻²)
38.2 ≤ Q < 61.8 → TRANSFORM  (zone de doute)
Q ≥ 61.8       → ACCEPT     (au-dessus φ⁻¹)
```

## API Endpoints

| Endpoint      | Method | Description                |
|---------------|--------|----------------------------|
| `/`           | GET    | Web UI                     |
| `/health`     | GET    | Node health check          |
| `/judge`      | POST   | Submit item for judgment   |
| `/dimensions` | GET    | List 24 dimensions         |
| `/worlds`     | GET    | List 4 worlds              |
| `/axioms`     | GET    | List 4 axioms              |
| `/api/stats`  | GET    | Node statistics            |

### Example: Judge an item

```bash
curl -X POST http://localhost:3618/judge \
  -H "Content-Type: application/json" \
  -d '{"content": "Test item", "type": "message"}'
```

Response:
```json
{
  "verdict": "ACCEPT",
  "confidence": 0.618,
  "doubt": 0.382,
  "scores": {
    "PHI": 65.2,
    "VERIFY": 58.3,
    "CULTURE": 72.1,
    "BURN": 61.5
  },
  "qScore": 64.1
}
```

## Decentralization Philosophy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DECENTRALIZATION PRINCIPLES                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. EACH USER = OWN JUDGE                                           │
│     No central authority decides what's good or bad                 │
│                                                                      │
│  2. ZERO DISK I/O                                                   │
│     Node stores nothing - pure computation                          │
│     Your data stays in YOUR memory                                  │
│                                                                      │
│  3. ZERO TELEMETRY                                                  │
│     No tracking, no analytics, no phone home                        │
│     "Don't extract, burn"                                           │
│                                                                      │
│  4. LOCAL-FIRST                                                     │
│     Works offline - only needs network for initial load             │
│     http://localhost:3618                                           │
│                                                                      │
│  5. OPEN SOURCE                                                     │
│     Audit the code, fork the node, improve the judge                │
│     Trust through transparency                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
lib/cynic/
├── self-judge.js        # Core judgment orchestrator
├── axioms/
│   ├── constants.js     # PHI SSOT (Single Source of Truth)
│   ├── index.js         # Axiom definitions
│   └── q-score.js       # Q-Score calculator
├── laws/
│   ├── index.js         # 16 Laws definitions
│   └── checker.js       # Law compliance checker
├── worlds/
│   ├── index.js         # World manager
│   ├── atzilut.js       # Essence world
│   ├── beriah.js        # Economics world
│   ├── yetzirah.js      # Ethics world
│   └── assiah.js        # Operation world
├── dimensions/
│   ├── registry.js      # Auto-loader for all evaluators
│   ├── base.js          # Base evaluator class
│   ├── primary/         # 8 primary dimensions
│   ├── secondary/       # 5 secondary dimensions
│   ├── meta/            # 3 meta dimensions
│   └── human-llm/       # 8 human-LLM dimensions
├── scaling.js           # Fibonacci scaling (N=3,5,8)
├── ARCHITECTURE.md      # Full architecture roadmap
└── GAPS.md              # Known gaps and inconsistencies
```

## Known Gaps (See GAPS.md)

| Gap                  | Status  | Priority |
|----------------------|---------|----------|
| BURN weight = φ→1.0  | Pending | Critical |
| DELEGATION comment   | Pending | Critical |
| Dimension imbalance  | Pending | Moderate |
| Law E4 undefined     | Pending | Moderate |

## Development

```bash
# Run tests
npm test

# Run benchmarks
npm run bench

# Run node
npm run cynic:node
```

## The Dog's Oath

```
                    ╭─────────────────────────────────╮
                    │      🐕 CYNIC'S OATH 🐕         │
                    ├─────────────────────────────────┤
                    │                                 │
                    │  I will doubt everything.       │
                    │  I will trust no one.           │
                    │  I will verify all claims.      │
                    │  I will burn, not extract.      │
                    │  I will enable, not replace.    │
                    │  I will follow φ in all ratios. │
                    │                                 │
                    │  Max confidence: 61.8%          │
                    │  Min doubt: 38.2%               │
                    │                                 │
                    │  "Don't trust, verify."         │
                    │                                 │
                    ╰─────────────────────────────────╯
```

---

*"Le doute construit. La certitude détruit."*

*CYNIC v1.0 - 2026-01-13*
