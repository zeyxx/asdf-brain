# CYNIC Emergence Pipeline

> "φ qui se méfie de φ" - The system that questions itself
>
> THE_INNOMMABLE: Where unknown patterns become known dimensions

---

## Overview

The Emergence Pipeline detects patterns that don't fit existing dimensions and proposes new ones for human validation. This is how CYNIC evolves beyond its initial 25 dimensions.

```
JUDGMENT → RESIDUAL → ANOMALY BUFFER → CLUSTERING → PROPOSAL → HUMAN → INTEGRATION
    ↓          ↓            ↓              ↓            ↓          ↓          ↓
  scores    unexplained   φ-decay      pattern      candidate   accept/   matrix
  (0-100)   variance     buffering    detection    dimension   reject    update
```

---

## Stage 1: Judgment & Residual Calculation

Every judgment produces a **residual** - the unexplained variance after scoring across all 25 dimensions.

```javascript
residual = 1 - (explainedVariance / totalVariance)
```

### Residual Interpretation

| Residual | Meaning |
|----------|---------|
| 0.0 - 0.30 | Well-explained by existing dimensions |
| 0.30 - 0.382 | Slight unexplained component |
| **0.382 - 0.618** | **Warning zone** - potential new pattern |
| **> 0.618** | **Anomaly** - strong signal of unknown dimension |

### Anomaly Threshold

```
ANOMALY_THRESHOLD = φ⁻² = 0.382
```

If `residual > 0.382`, the observation is flagged as an anomaly.

---

## Stage 2: Anomaly Buffer (φ-Decay)

Anomalies are collected in a buffer with exponential decay based on φ.

### Buffer Properties

```javascript
const ANOMALY_BUFFER = {
  maxSize: 21,           // Fibonacci number
  decayRate: PHI_INV,    // 0.618 per interval
  clusterThreshold: 3,   // φ² rounded = 3 minimum to cluster
};
```

### Decay Formula

Each buffered anomaly loses relevance over time:

```
relevance(t) = initialRelevance × (φ⁻¹)^t
```

Old anomalies naturally fade, keeping only recent strong signals.

### Cluster Trigger

Dimension discovery is triggered when:
```
bufferCount >= 3 (φ²)
```

---

## Stage 3: Clustering & Pattern Detection

When the buffer reaches threshold, the system clusters anomalies by feature similarity.

### Feature Extraction

Each anomaly captures:
```javascript
{
  structural: { type, complexity, nesting },
  semantic: { category, keywords, intent },
  temporal: { hour, dayOfWeek, frequency },
  contextual: { source, related }
}
```

### Clustering Algorithm

1. Extract feature vectors from buffered anomalies
2. Calculate pairwise similarity
3. Group by similarity > 0.618 (φ⁻¹)
4. Clusters with ≥ 3 members become candidates

---

## Stage 4: Dimension Proposal

Clustered anomalies generate a **dimension proposal** sent to THE_INNOMMABLE.

### Proposal Structure

```javascript
{
  suggestedName: "UNNAMED_DIMENSION",
  source: "residual_clustering",
  features: {
    structural: { dominantType: "async_pattern" },
    semantic: { keywords: ["await", "promise", "callback"] }
  },
  clusterSize: 5,
  confidence: 0.618,           // Never exceeds φ⁻¹
  averageResidual: 0.72,
  timestamp: "2026-01-12T10:00:00.000Z"
}
```

---

## Stage 5: THE_INNOMMABLE

THE_INNOMMABLE is the guardian of emergence - it receives proposals and manages the human validation queue.

### States

| State | Meaning |
|-------|---------|
| `watching` | Monitoring residuals, no active proposals |
| `accumulating` | Buffer filling with anomalies |
| `proposing` | Dimension candidate awaiting validation |
| `integrating` | Accepted dimension being added to matrix |

### Blocking Mechanism

Rejected patterns are remembered to prevent re-proposal:

```javascript
blockedPatterns.set(patternHash, {
  rejectedAt: timestamp,
  reason: feedback,
  similarProposals: count
});
```

---

## Stage 6: Human Validation

Proposed dimensions require human decision:

### Accept Flow

```
POST /singularity/api/innommable/validate
{
  "proposalId": "prop_xxx",
  "accept": true,
  "reason": "Valid pattern for async error handling"
}
```

Result:
- Dimension added to pending integration
- Stats updated: `accepted++`
- Ready for matrix integration

### Reject Flow

```
POST /singularity/api/innommable/validate
{
  "proposalId": "prop_xxx",
  "accept": false,
  "reason": "Too similar to existing FEEDBACK_LOOPS dimension"
}
```

Result:
- Pattern hash blocked
- Similar future proposals filtered
- Stats updated: `rejected++`

---

## Stage 7: Matrix Integration

Accepted dimensions are integrated into the CYNIC judgment matrix.

### Integration Steps

1. Assign dimension to appropriate World (4 Mondes)
2. Calculate initial weight (starts low)
3. Add to active dimension list
4. Begin collecting scores for new dimension
5. Weight increases as dimension proves useful

### Dimension Lifecycle

```
PROPOSED → ACCEPTED → PROBATION → ACTIVE → (DEPRECATED)
                         ↓
              Low usage = weight decay
```

---

## API Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/singularity/api/innommable` | GET | Status & proposals |
| `/singularity/api/innommable/test-anomaly` | POST | Inject test anomalies |
| `/singularity/api/innommable/discover` | POST | Trigger clustering |
| `/singularity/api/innommable/validate` | POST | Accept/reject proposal |

---

## Dashboard Visualization

The 3D dashboard shows emergence in real-time:

- **Frontier Ring**: Purple ring at edge showing anomaly accumulation
- **Portal**: Opens when proposals are pending
- **Anomaly Particles**: Cyan particles orbiting in frontier zone
- **Discovery Counter**: Shows A:accepted R:rejected stats

---

## φ Constants in Emergence

| Constant | Value | Usage |
|----------|-------|-------|
| φ⁻² | 0.382 | Anomaly threshold |
| φ⁻¹ | 0.618 | Max proposal confidence, decay rate |
| φ² | 2.618 → 3 | Min cluster size |
| 21 | Fib(8) | Max buffer size |

---

## Example Flow

```
1. Judgment on async code → residual = 0.72 (anomaly!)
2. Added to buffer (now has 2 anomalies)
3. Another async judgment → residual = 0.65 (anomaly!)
4. Buffer now has 3 → triggers clustering
5. Cluster found: "async error patterns"
6. Proposal created: UNNAMED_DIMENSION (confidence: 61.8%)
7. Human reviews: "This captures async/await patterns well"
8. Human accepts → dimension queued for integration
9. CYNIC now judges async patterns better
10. Future residuals for async code decrease
```

---

## Monitoring Emergence

Check emergence status:
```bash
curl https://asdf-brain.onrender.com/singularity/api/innommable
```

Monitor for high residuals in alerts:
```bash
curl https://asdf-brain.onrender.com/singularity/alerts?severity=warning
```

---

*"The unnamed becomes named through persistent observation"*
*- THE_INNOMMABLE*

*Last updated: 2026-01-12*
