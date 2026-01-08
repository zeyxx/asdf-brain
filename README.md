# asdf-brain

> *"The living memory of the $asdfasdfa ecosystem"*

```
        (  .      )
           )           (              )
                 .  '   .   '  .  '  .
        (    , )       (.   )  (   ',    )
         .' ) ( . )    ,  ( ,     )   ( .
      ). , ( .   (  ) ( , ')  .' (  ,    )
     (_,) . ), ) _) _,')  (, )  (' )  ,  )
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              THIS IS FINE
```

## Philosophy

**Don't trust. Verify.** Every piece of knowledge is traceable to its source.

**Don't extract. Burn.** Knowledge is shared, not hoarded. Open source benefits all.

**φ Distribution.** Golden ratio weights importance:
- 61.8% (φ⁻¹) production patterns
- 23.6% (φ⁻²) development patterns
- 14.6% (φ⁻³) experimental learnings

## Knowledge Quality Formula

```
K = 100 × ∛(D × O × L)

D = Data Quality (is this verified?)
O = Organic (naturally occurring, not forced)
L = Longevity (will this last?)
```

## Structure

```
asdf-brain/
├── knowledge/           # Indexed learnings by repo
│   ├── holdex/         # HolDex patterns (11K+ conversations)
│   ├── gasdf/          # GASdf security & transaction patterns
│   ├── consumer-apps/  # ASDForecast, ASDev learnings
│   ├── infra/          # Deployment patterns (sollama58)
│   └── manifesto/      # Philosophy & architectural decisions
├── agents/             # Operational modes
│   ├── analyzer.js     # Read-only: analyze & report
│   ├── proposer.js     # Create PRs across repos
│   └── autonomous.js   # Direct changes (high confidence)
├── index/              # Unified search
│   ├── cross-repo.jsonl
│   └── signatures.json
└── scripts/            # Pipeline & utilities
```

## The Ecosystem

| Layer | Repos | Purpose |
|-------|-------|---------|
| **Consumer** | ASDForecast, ASDev | User-facing apps |
| **Intelligence** | HolDex, asdf-oracle | Analytics & scoring |
| **Infrastructure** | GASdf, solana-keychain | Core utilities |
| **Philosophy** | asdf-manifesto | The why |

## Operational Modes

### 1. Analyzer (Default)
Read-only analysis across all repos. Reports inconsistencies, suggests improvements.

### 2. Proposer
Creates pull requests when confidence > φ⁻¹ (61.8%).

### 3. Autonomous
Direct modifications when confidence > φ (161.8% normalized = very high).

## Usage

```bash
# Search across ecosystem
npm run brain:search "webhook security"

# Analyze repo consistency
npm run brain:analyze

# Sync knowledge from all repos
npm run brain:sync
```

## Contributing

This brain learns from:
1. Claude Code transcripts (conversation pairs)
2. Git commit patterns
3. Cross-repo analysis
4. Production deployment learnings (sollama58)

All knowledge is signed and verifiable.

---

**$asdfasdfa** — *This is fine.*
