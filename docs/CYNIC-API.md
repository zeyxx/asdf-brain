# CYNIC API Reference

> MCP Tools and Programmatic Interface

## Overview

CYNIC exposes its functionality through MCP (Model Context Protocol) tools. All tools are prefixed with `brain_cynic_` for judgment operations or `brain_` for knowledge operations.

## Judgment Tools

### brain_cynic_judge

Core judgment tool that evaluates items across 25 dimensions.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `item` | object | Yes | Item to judge |
| `context` | object | No | Additional context (singularityDistance, patterns) |
| `mode` | string | No | Judgment mode: `quick`, `standard`, `thorough`, `full` |

**Item Structure:**
```json
{
  "type": "decision|code|knowledge|pattern",
  "content": "The actual content to judge",
  "source": "Optional source identifier",
  "metadata": {}
}
```

**Response:**
```json
{
  "verdict": "HOWL|WAG|GROWL|BARK",
  "score": 72,
  "confidence": 55.3,
  "dimensions": {
    "TRUTH": { "score": 80, "passed": true },
    "INTEGRITY": { "score": 65, "passed": true }
  },
  "blocking": ["SECURE"],
  "suggestions": ["Consider adding validation"],
  "_judgmentId": "jdg_abc123"
}
```

**Modes:**
- `quick` - Single pass, fastest
- `standard` - Scaling only
- `thorough` - Scaling + refinement
- `full` - Complete cycle with learning

### brain_cynic_feedback

Provide outcome feedback on past judgments for learning.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `judgment_id` | string | Yes | The `_judgmentId` from a previous judgment |
| `outcome` | string | Yes | `correct`, `incorrect`, or `partial` |
| `feedback` | object | No | Additional feedback details |

**Response:**
```json
{
  "success": true,
  "adjusted": true,
  "learningRate": 0.382
}
```

### brain_cynic_stats

Get CYNIC introspection statistics.

**Parameters:** None

**Response:**
```json
{
  "totalJudgments": 1234,
  "accuracy": 0.73,
  "precision": 0.68,
  "recall": 0.81,
  "phiScore": 0.618,
  "thresholds": {
    "TRUTH": 70,
    "INTEGRITY": 65
  }
}
```

### brain_cynic_learn

Trigger manual learning cycle.

**Parameters:** None

**Response:**
```json
{
  "cycleCompleted": true,
  "adjustedDimensions": 5,
  "newThresholds": {}
}
```

### brain_cynic_digest

Transform unstructured text into structured knowledge.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to digest |
| `source` | string | No | Source identifier |
| `existingKnowledge` | array | No | Existing knowledge for linking |

**Response:**
```json
{
  "ideas": [
    { "content": "...", "confidence": 0.75, "type": "insight" }
  ],
  "links": [
    { "from": "new_idea", "to": "existing_pattern", "strength": 0.8 }
  ],
  "roadmap": [
    { "action": "...", "priority": "high" }
  ],
  "autoLearned": ["idea_1", "idea_3"]
}
```

### brain_cynic_residual

Analyze judgment for unexplained residual (anomaly detection).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `judgment` | object | Yes | CYNIC judgment result |
| `observation` | object | Yes | Original observation |
| `context` | object | No | Additional context |

**Response:**
```json
{
  "residual": 0.42,
  "isAnomaly": true,
  "accumulated": 15,
  "readyForDiscovery": false
}
```

### brain_cynic_discover_dimensions

Attempt to discover new dimensions from accumulated anomalies.

**Parameters:** None

**Response:**
```json
{
  "candidates": [
    {
      "name": "SUGGESTED_NAME",
      "pattern": "detected pattern",
      "confidence": 0.55,
      "anomalyCount": 12
    }
  ],
  "requiresHumanValidation": true
}
```

### brain_cynic_accept_dimension

Accept a proposed dimension (requires human validation).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `candidate` | object | Yes | Dimension candidate |
| `name` | string | No | Final name (uses suggested if not provided) |
| `definition` | string | No | Human-provided definition |
| `axiom` | string | No | `PHI`, `VERIFY`, `CULTURE`, or `BURN` |
| `threshold` | number | No | Score threshold (default: 50) |

## Knowledge Tools

### brain_search

Search across all knowledge.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `limit` | number | No | Max results (default: 10) |
| `project` | string | No | Filter by project |
| `type` | string | No | `decision`, `pattern`, `insight` |

### brain_patterns

Get detected patterns.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | `technical`, `process`, `issues`, `solutions`, `architecture` |

### brain_health

Get ecosystem health.

**Parameters:** None

**Response:**
```json
{
  "health": 86,
  "status": "healthy",
  "recommendations": [],
  "subsystems": {}
}
```

### brain_learn

Record knowledge to the brain.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | `insight`, `pattern`, `decision`, `error`, `intent` |
| `content` | string | Yes | Knowledge content |
| `tags` | array | No | Tags for categorization |
| `context` | string | No | Source context |

## Constants

### φ (PHI) Ratios

```javascript
PHI       = 1.618033988749895  // Golden ratio
PHI_INV   = 0.618033988749895  // 61.8% - Max confidence
PHI_INV_2 = 0.381966011250105  // 38.2% - Min doubt
PHI_INV_3 = 0.236067977499790  // 23.6% - Critical threshold
```

### Verdict Thresholds

```javascript
HOWL  >= 80   // Exceptional
WAG   >= 50   // Good
GROWL >= 38.2 // Needs work (φ⁻²)
BARK  < 38.2  // Critical
```

### Health Thresholds

```javascript
HEALTHY  >= 62  // φ⁻¹ rounded
WARNING  >= 38  // φ⁻²
CRITICAL >= 24  // φ⁻³
```

## Error Handling

All tools return errors in this format:

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `INVALID_INPUT` - Missing or malformed parameters
- `NOT_FOUND` - Resource not found
- `JUDGMENT_FAILED` - Judgment process failed
- `LEARNING_FAILED` - Learning cycle failed

## Rate Limits

- Judgments: No hard limit (φ-based backpressure)
- Digest: 1 request per 61.8 seconds per source
- Learning cycles: 1 per 61.8 seconds

---

*🐕 κυνικός | Don't trust, verify | φ⁻¹ = 61.8% max*
