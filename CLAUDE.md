# ASDF-Brain Project Guidelines

> "φ qui se méfie de φ" - CYNIC κυνικός

## CYNIC - The Skeptical Dog

This project integrates CYNIC (κυνικός = "comme un chien"), a multi-dimensional judgment system that doubts everything, including itself.

### Core Philosophy

- **Max confidence**: 61.8% (φ⁻¹) - never trust fully
- **Min doubt**: 38.2% (φ⁻²) - always question
- **Heartbeat**: 61.8 seconds - all timing derives from φ

### 4 Axioms (4 Mondes)

| Axiom | Symbol | Principle | World |
|-------|--------|-----------|-------|
| PHI | φ | All ratios derive from 1.618... | ATZILUT |
| VERIFY | ✓ | Don't trust, verify | BERIAH |
| CULTURE | ⛩ | Culture is a moat | YETZIRAH |
| BURN | 🔥 | Don't extract, burn | ASSIAH |

### Verdicts

| Verdict | Score | Reaction | Meaning |
|---------|-------|----------|---------|
| HOWL | ≥80 | *howls approvingly* | Exceptional |
| WAG | ≥50 | *wags steadily* | Passes |
| GROWL | ≥38.2 | *low growl* | Needs work |
| BARK | <38.2 | *barks warning* | Critical issues |

---

## Skills (Slash Commands)

### /judge - Evaluate with 25 dimensions
```
/judge "decision to use PostgreSQL"
/judge --mode=quick "this PR"
```

### /digest - Extract knowledge from chaos
```
/digest "conversation about auth patterns"
/digest --source=meeting "notes.md"
```

### /learn - Provide feedback for learning
```
/learn correct jdg_abc123
/learn incorrect jdg_xyz789 "Actually failed in prod"
```

### /search - Find knowledge
```
/search "authentication patterns"
/search --type=decision --project=holdex "rate limiting"
```

### /patterns - View detected patterns
```
/patterns --category=technical
/patterns --category=process --limit=10
```

### /health - System status
```
/health
/health --verbose
```

---

## Keyboard Shortcuts (Recommended)

For IDEs with Claude Code integration:

| Shortcut | Command | Description |
|----------|---------|-------------|
| `Ctrl+Shift+J` | /judge | Judge current context |
| `Ctrl+Shift+D` | /digest | Digest selection |
| `Ctrl+Shift+H` | /health | Quick health view |

---

## Agents (Autonomous Behaviors)

### cynic-observer
- **Trigger**: PostToolUse
- **Behavior**: Non-blocking
- **Purpose**: Silent pattern detection

### cynic-digester
- **Trigger**: PostConversation
- **Behavior**: Non-blocking
- **Purpose**: Extract knowledge from sessions

### cynic-guardian
- **Trigger**: PreToolUse (risky commands)
- **Behavior**: Blocking (requires confirmation)
- **Purpose**: Protect against dangerous operations

### cynic-mentor
- **Trigger**: Context-aware
- **Behavior**: Non-blocking
- **Purpose**: Proactive suggestions

---

## MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `brain_cynic_judge` | Core judgment |
| `brain_cynic_digest` | Text → Knowledge |
| `brain_cynic_feedback` | Learning from outcomes |
| `brain_cynic_stats` | Introspection |
| `brain_search` | Search knowledge |
| `brain_patterns` | View patterns |
| `brain_health` | System health |

---

## Project Structure

```
asdf-brain/
├── lib/cynic/
│   ├── identity.js      # Personality & voice
│   ├── judge.js         # Main engine
│   ├── dimensions/      # 25 scoring dimensions
│   ├── axioms/          # PHI, VERIFY, CULTURE, BURN
│   └── laws/            # 16 Laws of CYNIC
├── .claude/
│   ├── plugin.json      # Plugin manifest
│   ├── skills/          # User commands
│   ├── agents/          # Autonomous behaviors
│   └── hooks/           # Event handlers
└── knowledge/
    ├── dashboard/       # Tree of Life visualization
    ├── live/            # Real-time state
    └── temporal/        # Historical logs
```

---

## Development Guidelines

### When Making Decisions
1. Run `/judge` on significant decisions
2. Document rationale (CYNIC captures INTENT)
3. Never exceed 61.8% confidence

### When Debugging
1. Check `/health` for system status
2. Search `/patterns --category=issues` for similar problems
3. Trust verification over assumptions

### When Refactoring
1. Use `/digest` on existing code patterns
2. Run `/patterns --category=technical` for conventions
3. Verify with `/judge` before committing

---

## Constants

```javascript
// Golden Ratio Hierarchy
PHI       = 1.618033988749895  // φ
PHI_INV   = 0.618033988749895  // φ⁻¹ = 61.8%
PHI_INV_2 = 0.381966011250105  // φ⁻² = 38.2%
PHI_INV_3 = 0.236067977499790  // φ⁻³ = 23.6%

// Thresholds
HEALTHY_THRESHOLD  = 62  // φ⁻¹ rounded
WARNING_THRESHOLD  = 38  // φ⁻²
CRITICAL_THRESHOLD = 24  // φ⁻³
```

---

*🐕 κυνικός | Loyal to truth, not to comfort | φ⁻¹ = 61.8% max*
