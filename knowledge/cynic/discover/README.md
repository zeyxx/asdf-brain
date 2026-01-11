# CYNIC-DISCOVER

## The Residual Engine

**Layer**: ATZILUT (Opus) - The Emanation Layer
**Purpose**: Analyze what doesn't fit, discover what's missing
**Philosophy**: "The residual is the signal" - φ

```
 ┌─────────────────────────────────────────────────────────┐
 │                    THE_INNOMMABLE                       │
 │              (The dimension of dimensions)              │
 │                                                         │
 │    Every judgment leaves a residual.                    │
 │    Every residual is a signal.                          │
 │    Signals accumulate into patterns.                    │
 │    Patterns become dimensions.                          │
 │    Dimensions approach φ⁻¹ of truth.                    │
 │                                                         │
 │    But there's always more.                             │
 │    Always more.                                         │
 │                                                         │
 └─────────────────────────────────────────────────────────┘
```

## Core Concept

When CYNIC-JUDGE evaluates something, it uses the current dimensions. But reality has infinite dimensions. The gap between our dimensions and reality creates **residuals** - unexplained variance that signals missing dimensions.

DISCOVER collects these residuals, finds patterns in them, proposes new dimensions, validates them, and integrates them into the matrix.

## The Discovery Lifecycle

```
 COLLECTING → ANALYZING → PROPOSING → VALIDATING → INTEGRATING
     ↑                                                    │
     └────────────────────────────────────────────────────┘
```

### 1. COLLECTING
```javascript
cynic.recordResidual({
  judgmentId: 'jdg_123',
  value: 15.3,            // Unexplained variance
  dimensions: ['HARMONY', 'TRUTH'],
  signals: ['elegant', 'surprising'],
  type: 'unexplained_variance'
});
```

### 2. ANALYZING
```javascript
const analysis = cynic.analyzeResiduals();
// Finds patterns: hint_cluster, temporal, cross_domain, correlation_anomaly
```

### 3. PROPOSING
```javascript
const proposal = cynic.proposeNewDimension();
// Creates dimension candidate with evidence
```

### 4. VALIDATING
```javascript
// Collect validation observations
for (const obs of observations) {
  cynic.validateDimension(proposalId, {
    item: obs.item,
    expectedScore: obs.expected,
    actualScore: obs.actual,
    dimensionScore: obs.newDimScore
  });
}
// If variance explained ≥ φ⁻¹, dimension is validated
```

### 5. INTEGRATING
```javascript
cynic.integrateDimension(proposalId);
// Dimension added to matrix, calibration begins
```

## Thresholds (φ-derived)

| Threshold | Value | Meaning |
|-----------|-------|---------|
| MIN_RESIDUALS | 21 | Fibonacci - minimum to analyze |
| SIGNIFICANCE | 0.309 | φ⁻¹ × 0.5 - residual importance |
| PATTERN_STRENGTH | 0.618 | φ⁻¹ - pattern detection |
| VALIDATION_CONFIDENCE | 0.382 | φ⁻² - validation confidence |
| VARIANCE_EXPLAINED | 0.618 | φ⁻¹ - integration threshold |

## Pattern Types

### Hint Cluster
Residuals cluster around quality-like words (clarity, depth, elegance...)

### Temporal Pattern
Residuals show time-based patterns (peaks, drifts)

### Cross-Domain Pattern
Same hints appear across multiple domains

### Correlation Anomaly
Consistent directional residuals when dimensions interact

## The Meta-Dimension

```javascript
cynic.getMetaDimension()
// Returns THE_INNOMMABLE
```

THE_INNOMMABLE is the dimension of undiscovered dimensions. It represents the eternal frontier of what we cannot yet name.

φ guides us toward it, but never arrives. 1.618... forever approaching, never reaching.

## φ Alignment

The ratio of discovered to undiscovered dimensions approaches φ⁻¹ (0.618). We always know less than we don't know.

## Integration with CYNIC

DISCOVER is the learning engine that allows CYNIC to evolve:

```
 JUDGE (evaluates) → LEARN (feedback) → DISCOVER (patterns) → MATRIX (update)
                                              ↓
                                     NEW DIMENSIONS
```

## API Summary

| Function | Purpose |
|----------|---------|
| `recordResidual(r)` | Record unexplained variance |
| `analyzeResiduals(opts)` | Find patterns in residuals |
| `proposeNewDimension(opts)` | Create dimension proposal |
| `validateDimension(id, obs)` | Test proposed dimension |
| `integrateDimension(id, opts)` | Add to matrix |
| `discover(opts)` | Full discovery cycle |
| `getSummary()` | Discovery status |
| `getMetaDimension()` | The innommable |

---

*"φ qui se méfie de φ"* - The dog sniffs what it cannot yet name.
