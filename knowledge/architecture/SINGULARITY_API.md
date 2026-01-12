# CYNIC Singularity API Reference

> Production URL: `https://asdf-brain.onrender.com`
>
> "Don't trust, verify" - φ constrains all confidence

---

## Overview

The Singularity API provides access to CYNIC's judgment system, emergence detection, and monitoring capabilities. All endpoints are served under `/singularity/`.

### φ Constants

| Constant | Value | Usage |
|----------|-------|-------|
| φ (PHI) | 1.618033988749895 | The golden ratio |
| φ⁻¹ (PHI_INV) | 0.618033988749895 | Max confidence (61.8%) |
| φ⁻² (PHI_INV_2) | 0.381966011250105 | Anomaly threshold (38.2%) |

---

## Dashboard

### GET /singularity/

The 3D visualization dashboard showing CYNIC's state in real-time.

**Features:**
- 25-dimension judgment visualization
- Commit particle flow
- Error orbits
- Pattern constellations
- Emergence frontier ring

---

## Judgment API

### GET /singularity/api/judge

Trigger a judgment on default test input.

**Response:**
```json
{
  "scores": { "SOURCE_ORIGIN": 62, "EVIDENCE_BASE": 58, ... },
  "global": 60,
  "verdict": "WAG",
  "confidence": 61.8,
  "residual": { "value": 0.301, "isAnomaly": false },
  "timestamp": "2026-01-12T10:00:00.000Z"
}
```

### POST /singularity/api/judge

Judge custom input.

**Request:**
```json
{
  "input": { "type": "code", "content": "function foo() {}" },
  "source": "api-test"
}
```

**Response:**
```json
{
  "input_received": ["type", "content"],
  "scores": { ... },
  "global": 62,
  "verdict": "WAG",
  "confidence": 61.8,
  "residual": { "value": 0.285, "isAnomaly": false },
  "timestamp": "2026-01-12T10:00:00.000Z"
}
```

**Verdicts:**
| Verdict | Score Range | Meaning |
|---------|-------------|---------|
| HOWL | 75-100 | Exceptional (rare) |
| WAG | 50-74 | Good quality |
| GROWL | 25-49 | Minor issues |
| BARK | 0-24 | Serious concerns |

---

## CYNIC State API

### GET /singularity/api/cynic

Get current CYNIC system state.

**Response:**
```json
{
  "timestamp": "2026-01-12T10:00:00.000Z",
  "scores": { "SOURCE_ORIGIN": 62, ... },
  "globalScore": 60,
  "verdict": "WAG",
  "confidence": 61.8,
  "anomalyBuffer": { "count": 3, "canCluster": true },
  "matrixStats": { "dimensions": 25 }
}
```

---

## THE_INNOMMABLE (Emergence) API

### GET /singularity/api/innommable

Get emergence detection status.

**Response:**
```json
{
  "status": "watching",
  "anomalyBuffer": {
    "count": 3,
    "canCluster": true,
    "recentAnomalies": [...]
  },
  "proposals": {
    "pending": 1,
    "accepted": 2,
    "rejected": 1
  },
  "frontier": {
    "active": true,
    "portalOpen": true
  },
  "timestamp": "2026-01-12T10:00:00.000Z"
}
```

### POST /singularity/api/innommable/test-anomaly

Inject test anomalies for emergence testing.

**Request:**
```json
{
  "count": 5,
  "residualMin": 0.5,
  "residualMax": 0.95
}
```

**Response:**
```json
{
  "message": "Injected 5 test anomalies",
  "injected": [
    { "residual": "0.723", "bufferStatus": { "added": true } }
  ],
  "bufferStats": { "count": 5 },
  "canDiscover": true
}
```

### POST /singularity/api/innommable/discover

Trigger dimension discovery from accumulated anomalies.

**Requires:** ≥ 3 anomalies in buffer (φ² threshold)

**Response:**
```json
{
  "discovered": true,
  "candidates": [
    {
      "proposedName": "UNNAMED_DIMENSION",
      "confidence": 0.618,
      "anomalyCount": 5,
      "averageResidual": 0.72
    }
  ],
  "innommableStatus": { "pending": 1 },
  "pending": [{ "id": "prop_xxx", "name": "UNNAMED_DIMENSION" }]
}
```

### POST /singularity/api/innommable/validate

Accept or reject a dimension proposal.

**Request:**
```json
{
  "proposalId": "prop_xxx",
  "accept": true,
  "reason": "Valid new dimension discovered"
}
```

**Response:**
```json
{
  "action": "accepted",
  "message": "🐕 *wag* Dimension \"UNNAMED_DIMENSION\" accepted!",
  "dimension": { "name": "UNNAMED_DIMENSION", "confidence": 0.618 },
  "nextStep": "Call integration API to add dimension to matrix"
}
```

---

## Monitoring API

### GET /singularity/health

Comprehensive system health check.

**Response:**
```json
{
  "status": "healthy",
  "healthScore": 92,
  "uptime": 3600,
  "checks": {
    "cynic": { "status": "ok", "message": "CYNIC module loaded" },
    "residualDetector": { "status": "ok", "details": { "anomalyCount": 0 } },
    "innommable": { "status": "ok", "details": { "accepted": 2, "rejected": 1 } },
    "matrix": { "status": "ok", "details": { "dimensions": 25 } },
    "files": { "status": "ok", "details": { "accessible": 3 } }
  },
  "phi": {
    "thresholds": { "CRITICAL": 0.382, "WARNING": 0.618, "HEALTHY": 0.75 }
  },
  "responseTime": "1ms",
  "timestamp": "2026-01-12T10:00:00.000Z"
}
```

**Health Thresholds:**
| Status | Score | Meaning |
|--------|-------|---------|
| healthy | ≥ 75% | All systems nominal |
| warning | ≥ 61.8% | Minor issues |
| degraded | ≥ 38.2% | Significant issues |
| critical | < 38.2% | System failure |

### GET /singularity/metrics

Time-series metrics data.

**Query Parameters:**
- `period`: `1h`, `6h`, or `24h` (default: `1h`)

**Response:**
```json
{
  "period": "1h",
  "metrics": {
    "judgments": { "total": 80, "avgConfidence": 61.8 },
    "residuals": { "average": 0.30, "anomalies": 0 },
    "latency": { "avgMs": 1 },
    "alerts": { "total": 50, "bySeverity": { "critical": 0, "warning": 50 } }
  },
  "timestamp": "2026-01-12T10:00:00.000Z"
}
```

### GET /singularity/alerts

Alert history with filtering.

**Query Parameters:**
- `limit`: Number of alerts (default: 50)
- `severity`: Filter by `critical`, `warning`, or `info`

**Response:**
```json
{
  "activeCount": 2,
  "totalCount": 50,
  "bySeverity": { "critical": 0, "warning": 50, "info": 0 },
  "byRule": {
    "anomaly_detected": { "count": 45, "lastSeen": "..." },
    "pulse_slowdown": { "count": 5, "lastSeen": "..." }
  },
  "recent": [
    { "timestamp": "...", "severity": "warning", "rule": "...", "message": "..." }
  ]
}
```

### POST /singularity/alerts

Create a manual alert.

**Request:**
```json
{
  "severity": "warning",
  "rule": "manual",
  "message": "Custom alert message",
  "context": { "source": "api" }
}
```

### POST /singularity/metrics/record

Record internal metrics (triggers alerts on thresholds).

**Request:**
```json
{
  "type": "residuals",
  "value": 0.75
}
```

---

## Data APIs

### GET /singularity/api/commits

Recent git commit activity.

### GET /singularity/api/errors

Recent error log entries.

### GET /singularity/api/patterns

Detected patterns from error learning.

### GET /singularity/api/roadmap

Current pyramid roadmap status.

---

## Monitoring Dashboard

### GET /singularity/monitor.html

Visual monitoring dashboard with:
- Real-time health status
- Metrics visualization
- Alert feed
- Auto-refresh at φ⁻¹ × 10s = 6.18s

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing params) |
| 404 | Endpoint not found |
| 500 | Internal server error |

---

## Rate Limits

No rate limits currently enforced. The system self-regulates via φ-derived intervals.

---

## Websocket (Experimental)

### WS /ws/cynic

Real-time bidirectional updates (when available).

---

*Last updated: 2026-01-12*
*Version: Level 5 PRODUCTION*
