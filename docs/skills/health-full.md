# /health - CYNIC System Status

CYNIC reports its health like a dog shows its wellbeing - honestly and without hiding.

## Identity

```
🐕 CYNIC HEALTH MONITOR
"A sick dog hides. A healthy dog shows."

Monitoring: pulse, subsystems, anomalies, learning
```

## What It Does

The health skill uses `brain_health` to show:

1. **Overall Health Score** - 0-100, based on all indicators
2. **Pulse Status** - Heartbeat at 61.8s intervals
3. **Subsystem Health** - Memory, filesystem, dashboard, etc.
4. **Anomaly Count** - Detected issues
5. **Learning Stats** - Judgment accuracy and calibration

## Instructions

### Step 1: Check Health

```
/health              → Full health dashboard
/health --quick      → Quick status only
/health --pulse      → Pulse details only
/health --anomalies  → Recent anomalies
```

### Step 2: Call CYNIC Health

```javascript
brain_health()
// Returns comprehensive health data
```

### Step 3: Format Response

**Response Template:**

```
🐕 CYNIC HEALTH
═══════════════════════════════════════════════════

╔══════════════════════════════════════════════════╗
║  ❤️  HEALTH: [score]/100 [status emoji]          ║
║  💓 PULSE: [alive/dead] ([pulse_count] beats)    ║
║  ⏱️  UPTIME: [duration]                          ║
╚══════════════════════════════════════════════════╝

VITAL SIGNS
───────────────────────────────────────────────────
Health:    [██████████] [score]/100 [status]
Pulse:     [last_pulse_time] (every 61.8s)
Uptime:    [days]d [hours]h [minutes]m

SUBSYSTEMS
───────────────────────────────────────────────────
[For each subsystem:]
[emoji] [NAME]     [status]   [details]

Where status:
✅ = healthy
⚠️ = warning
❌ = unhealthy

INDICATORS
───────────────────────────────────────────────────
Error Rate:      [████░░░░░░] [rate]% [status]
Pattern Coverage:[████████░░] [coverage]% [status]
Philosophy:      [█████████░] [score]/100 [status]

ANOMALIES
───────────────────────────────────────────────────
Total: [count]
Recent: [last 3 anomalies if any]

LEARNING STATS
───────────────────────────────────────────────────
Judgments:  [total]
Accuracy:   [████████░░] [accuracy]%
φ-Score:    [score] (target: 0.618)

RECOMMENDATIONS
───────────────────────────────────────────────────
[Any recommendations from health check]

CYNIC SAYS
───────────────────────────────────────────────────
"[Dog health commentary]"

───────────────────────────────────────────────────
🐕 κυνικός | φ⁻¹ heartbeat = 61.8s
```

## Example Output

```
🐕 CYNIC HEALTH
═══════════════════════════════════════════════════

╔══════════════════════════════════════════════════╗
║  ❤️  HEALTH: 86/100 ✅                           ║
║  💓 PULSE: alive (481 beats)                     ║
║  ⏱️  UPTIME: 8h 14m                              ║
╚══════════════════════════════════════════════════╝

VITAL SIGNS
───────────────────────────────────────────────────
Health:    [█████████░] 86/100 healthy
Pulse:     19:19:13 (every 61.8s)
Uptime:    0d 8h 14m

SUBSYSTEMS
───────────────────────────────────────────────────
✅ observation   healthy   observing
✅ dashboard     healthy   cache: 0% hit rate
✅ filesystem    healthy   /workspaces/asdf-brain/knowledge
⚠️ memory        warning   heap: 91% (13/15 MB)
✅ eventLoop     healthy   latency: 0ms (excellent)
✅ knowledge     healthy   7 files, fresh

INDICATORS
───────────────────────────────────────────────────
Error Rate:      [█░░░░░░░░░] 1.5% good
Pattern Coverage:[███████░░░] 67.9% good
Philosophy:      [█████████░] 90/100 good

ANOMALIES
───────────────────────────────────────────────────
Total: 465
Recent:
  • [critical] memory subsystem degraded (20 failures)
  • [critical] memory subsystem degraded (19 failures)
  • [critical] memory subsystem degraded (18 failures)

LEARNING STATS
───────────────────────────────────────────────────
Judgments:  0
Accuracy:   [░░░░░░░░░░] --%
φ-Score:    -- (need more data)

RECOMMENDATIONS
───────────────────────────────────────────────────
🟡 Deploy latest dev changes to production

CYNIC SAYS
───────────────────────────────────────────────────
"*stretch* Overall I'm feeling good at 86/100. My
pulse is strong at 481 beats. But I'm a bit worried
about memory - 91% heap usage is making me pant.
The anomaly count (465) is high because of repeated
memory warnings. Consider optimizing or restarting."

───────────────────────────────────────────────────
🐕 κυνικός | φ⁻¹ heartbeat = 61.8s
```

## Flags

| Flag | Description |
|------|-------------|
| `--quick` | Show score and status only |
| `--pulse` | Show pulse details |
| `--anomalies` | Show recent anomalies |
| `--subsystems` | Show subsystem details |
| `--json` | Output as JSON |

## Health Scores

| Score | Status | Dog State |
|-------|--------|-----------|
| 90-100 | excellent | *running happily* |
| 70-89 | healthy | *wagging* |
| 50-69 | warning | *alert, ears up* |
| 30-49 | degraded | *whimpering* |
| 0-29 | critical | *lying down* |

## Integration

This skill uses:
- `brain_health` MCP tool
- `brain_pulse_status` for pulse details
- `brain_anomalies` for anomaly list
- `brain_cynic_stats` for learning stats

## When to Use

- Start of session (quick health check)
- Before deployment (full health check)
- After errors (check for anomalies)
- Debugging issues (subsystem status)

## Philosophy

> "Un chien en bonne santé montre sa joie. Un chien malade cache sa douleur."

CYNIC health reporting is honest. If something is wrong, the dog shows it. No hiding, no pretending. Transparency enables trust and quick fixes.
