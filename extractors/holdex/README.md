# $ASDFASDFA LLM Training Data Pipeline

> "Friction is Training Data" - Every interaction generates data for the LLM

## Philosophy

This training pipeline follows the $asdfasdfa principles:
- **φ guides all ratios** - Weights and sampling use golden ratio
- **Don't Trust, Verify** - All data is traceable and verifiable
- **BUILD > USE > HOLD** - Feature commits weighted higher than maintenance

## Directory Structure

```
training/
├── scripts/           # Export and processing scripts
│   ├── pipeline.js           # Master orchestrator
│   ├── exportKScoreHistory.js
│   ├── exportHolderSnapshots.js
│   ├── labelTokenOutcomes.js
│   └── extractGitDecisions.js
├── raw/               # Raw exported data (gitignored)
│   ├── kscore-history.jsonl
│   ├── holder-snapshots.jsonl
│   └── git-decisions.jsonl
├── labeled/           # Supervised learning data (gitignored)
│   └── token-outcomes.jsonl
├── processed/         # Pipeline outputs (gitignored)
│   └── training-manifest.json
└── README.md
```

## Usage

### Run Full Pipeline
```bash
npm run training:pipeline
```

### Run Individual Exports
```bash
# Git decisions (no DB required)
npm run training:git

# K-Score history (requires DATABASE_URL)
npm run training:kscore

# Holder snapshots (requires DATABASE_URL)
npm run training:holders

# Label tokens (requires DATABASE_URL)
npm run training:label
```

## Data Formats

### git-decisions.jsonl
```json
{
  "hash": "abc123",
  "type": "feat",
  "scope": "kscore",
  "description": "Add geometric mean calculation",
  "weight": 2.618,
  "category": "core",
  "features": {
    "is_core_change": true,
    "is_phi_related": true
  }
}
```

### kscore-history.jsonl
```json
{
  "mint": "...",
  "k_score": 75.5,
  "d_component": 0.8,
  "o_component": 0.7,
  "conviction": {
    "accumulator": 150,
    "holder": 200,
    "reducer": 50,
    "extractor": 30
  }
}
```

### token-outcomes.jsonl (labeled)
```json
{
  "mint": "...",
  "label": "survivor",
  "label_confidence": 0.85,
  "metrics": {
    "age_days": 45,
    "k_score_current": 72,
    "diamond_ratio": 0.35
  }
}
```

## Training Targets

| LLM | Training Data | Purpose |
|-----|---------------|---------|
| LLM-Builder | git-decisions | Code generation aligned with philosophy |
| LLM-Analyst | kscore-history + token-outcomes | K-Score prediction |
| LLM-Oracle | holder-snapshots | Fee optimization |

## φ-Based Weighting

```javascript
const WEIGHTS = {
  feat: φ² = 2.618,     // New features
  fix: φ = 1.618,       // Bug fixes
  security: φ² = 2.618, // Security fixes
  docs: 1.0,            // Documentation
  chore: 1/φ = 0.618    // Maintenance
};
```
