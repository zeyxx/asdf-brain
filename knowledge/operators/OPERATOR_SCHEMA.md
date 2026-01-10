# Operator Identity Matrix Schema

> "The brain sees each operator differently. Context is everything."
> φ guides weights. Sefirot guides zones.

## Overview

The Operator Identity Matrix tracks per-user context across sessions.
Each operator has their own memory zone, preventing context bleed.

## Directory Structure

```
knowledge/operators/
├── OPERATOR_SCHEMA.md    # This file
├── identity-matrix.json  # Public identity mappings
└── {operator-hash}/      # Per-operator zones (hashed IDs)
    ├── context.json      # Current working context
    ├── history.jsonl     # Session history (append-only)
    ├── preferences.json  # Communication style
    └── active-work.json  # In-progress tasks

.private/operators/
├── aliases.json          # Real identity mappings (protected)
└── {operator-hash}/      # Private per-operator data
    ├── feedback.jsonl    # Raw feedback history
    └── patterns.json     # Learned communication patterns
```

## Operator Record Schema

```json
{
  "operatorId": "hash(username)",
  "displayName": "jeanterre552",
  "aliases": ["zeyxx"],
  "roles": ["dev", "operator"],
  "projects": {
    "HolDex": {
      "role": "primary-dev",
      "branches": ["update-newdexsockets"],
      "lastActive": "2026-01-09T12:56:00Z",
      "activeProblems": ["helius-credits", "webhook-ttl"],
      "recentFiles": ["src/tasks/kScoreUpdater.js", "src/routes/webhooks.js"]
    },
    "GASdf": {
      "role": "contributor",
      "branches": ["main"],
      "lastActive": "2026-01-08T14:00:00Z"
    }
  },
  "communicationStyle": {
    "language": "fr",
    "formality": "casual",
    "detailLevel": "high",
    "responsePreference": "concise"
  },
  "sessionContext": {
    "currentSession": "session-id",
    "activeTasks": [],
    "recentDecisions": [],
    "openQuestions": []
  },
  "metrics": {
    "totalSessions": 42,
    "totalContributions": 156,
    "avgSessionDuration": "45m",
    "daatLevelPreference": 3
  }
}
```

## Session History Format (JSONL)

```json
{"ts": "2026-01-09T12:00:00Z", "type": "session_start", "project": "HolDex"}
{"ts": "2026-01-09T12:05:00Z", "type": "problem_identified", "id": "helius-credits", "severity": "critical"}
{"ts": "2026-01-09T12:30:00Z", "type": "fix_applied", "files": ["kScoreUpdater.js", "webhooks.js"]}
{"ts": "2026-01-09T12:45:00Z", "type": "pr_created", "pr": 7, "repo": "sollama58/HolDex"}
{"ts": "2026-01-09T13:00:00Z", "type": "session_end", "summary": "Helius fix + PR"}
```

## Identity Hashing

Operator IDs are hashed for privacy in public knowledge:

```javascript
const operatorHash = crypto
  .createHash('sha256')
  .update(username + SALT)
  .digest('hex')
  .slice(0, 12);
```

Public zones use hashed IDs. Private zones map real identities.

## Cross-Session Memory

When a session starts, brain loads:
1. Operator identity from matrix
2. Last N sessions from history
3. Active problems from context
4. Preferred Daat level

This enables continuity without re-explaining context.

## Sefirot Mapping

| Zone | Sefirah | Purpose |
|------|---------|---------|
| identity-matrix | Binah | Understanding who |
| context.json | Chesed | Current expansion |
| history.jsonl | Netzach | Persistent memory |
| preferences.json | Hod | Communication style |
| active-work.json | Tiferet | Balanced focus |
| patterns.json | Chokmah | Learned wisdom |

## φ Weighting

Context injection weights by recency:
- Current session: φ⁰ = 1.0
- Last session: φ⁻¹ = 0.618
- 2 sessions ago: φ⁻² = 0.382
- 3+ sessions ago: φ⁻³ = 0.236

Older context fades but never disappears.

---

*Schema Version: 1.0*
*Created: 2026-01-09*
