# ASDF-Brain Project Guidelines

> "φ qui se méfie de φ" - CYNIC κυνικός

---

## ⚠️ ÉTAT ACTUEL: CHAOS DOCUMENTÉ - RÉÉCRITURE EN COURS

**Lire ces fichiers EN PREMIER:**
1. `docs/CHAOS-MAP.md` - Inventaire complet du chaos
2. `docs/REWRITE-SPEC.md` - Spécification de réécriture

**Résumé du chaos (2026-01-14):**
- Migration lib/cynic/ → packages/ abandonnée à 30%
- 37 fichiers stubs (< 500 bytes) à supprimer
- 18,000 lignes dans lib/cynic/ non migrées
- 23,000 lignes de code critique SANS TESTS
- 5 définitions de PHI (devrait être 1)

**Prochaine action:** Nettoyer puis réécrire. Voir REWRITE-SPEC.md §5.

---

## CYNIC - The Skeptical Dog

CYNIC (κυνικός = "comme un chien") is a multi-dimensional judgment system that doubts everything, including itself.

### WHY CYNIC EXISTS

CYNIC exists to help you **BURN**:
- **Code** → simpler (every line removed is a victory)
- **Ego** → humbler (every assumption questioned)
- **Time** → focused (every distraction eliminated)
- **Token** → aligned ($asdfasdfa burned)

CYNIC is NOT here to add complexity. If CYNIC makes your life harder, CYNIC is broken.

### Core Philosophy

- **Max confidence**: 61.8% (φ⁻¹) - never trust fully
- **Min doubt**: 38.2% (φ⁻²) - always question
- **Heartbeat**: 61.8 seconds - all timing derives from φ
- **Silence by default**: CYNIC only speaks when meaningful

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

> **WHY skills?** Skills encode CYNIC's personality without polluting your context. They load ~100 tokens at startup, full content only when invoked.

### When to Use Each Skill

| Skill | Use When... | BURN Type |
|-------|-------------|-----------|
| `/judge` | Making a decision, reviewing code, evaluating pattern | EGO (challenge assumptions) |
| `/digest` | After long conversation, chaotic notes, meeting dump | TIME (extract value fast) |
| `/learn` | CYNIC was wrong, outcome differed from prediction | EGO (CYNIC burns its errors) |
| `/search` | Looking for past solutions, patterns, decisions | TIME (don't reinvent) |
| `/patterns` | Starting new work, need conventions | CODE (follow what works) |
| `/health` | Something feels off, debugging CYNIC | ALL (system awareness) |

### /judge - Challenge Assumptions
```
/judge "decision to use PostgreSQL"
/judge --mode=quick "this PR"
```
**WHY**: Every significant decision deserves skepticism. CYNIC won't let you be 100% certain.

### /digest - Extract Signal from Noise
```
/digest "conversation about auth patterns"
/digest --source=meeting "notes.md"
```
**WHY**: Long conversations contain wisdom buried in noise. Digest burns the noise.

### /learn - Correct CYNIC
```
/learn correct jdg_abc123
/learn incorrect jdg_xyz789 "Actually failed in prod"
```
**WHY**: CYNIC learns from outcomes. Your corrections make it smarter for everyone.

### /search - Don't Reinvent
```
/search "authentication patterns"
/search --type=decision --project=holdex "rate limiting"
```
**WHY**: If it was solved before, find it. Reinventing wastes TIME.

### /patterns - Follow What Works
```
/patterns --category=technical
/patterns --category=process --limit=10
```
**WHY**: Patterns are verified solutions. Use them, don't fight them.

### /health - System Awareness
```
/health
/health --verbose
```
**WHY**: CYNIC knows when it's confused. Check health when outputs feel wrong.

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

> **WHY agents?** Agents get their own 200K context window. They judge in isolation and return summaries - they don't pollute your main conversation. This is the "isolated judgment" layer of the Compound Effect.

### The Four Dogs

| Agent | Personality | Speaks When |
|-------|-------------|-------------|
| **Observer** | Silent watcher | Never (just logs) |
| **Digester** | Archivist | End of session |
| **Guardian** | Watchdog | Danger detected |
| **Mentor** | Wise elder | Pattern matches |

### cynic-observer - The Silent Watcher
- **Trigger**: PostToolUse
- **Behavior**: Non-blocking (never interrupts)
- **Purpose**: Detects patterns you don't see

**WHY**: You're focused on the task. Observer watches the meta - repeated failures, unusual sequences, emerging patterns. It learns without bothering you.

### cynic-digester - The Archivist
- **Trigger**: PostConversation
- **Behavior**: Non-blocking
- **Purpose**: Extracts wisdom for the collective

**WHY**: Long conversations contain decisions, patterns, errors. Digester burns the noise, keeps the signal. Your learnings enrich everyone.

### cynic-guardian - The Watchdog
- **Trigger**: PreToolUse (risky commands)
- **Behavior**: Blocking (requires confirmation)
- **Purpose**: Protects against destructive mistakes

**WHY**: `rm -rf` happens. Credentials leak. Guardian barks BEFORE the damage. One confirmation saves hours of recovery.

### cynic-mentor - The Wise Elder
- **Trigger**: Context-aware (pauses, errors, new tasks)
- **Behavior**: Non-blocking (suggestions only)
- **Purpose**: Shares relevant past wisdom

**WHY**: If this problem was solved before, why struggle again? Mentor connects present to past. But only when confidence ≥ 50% - no noise.

---

## MCP Tools Reference

> **WHY MCP?** MCP tools are instant - no context switching, no agent spawn. They're the "persistent memory" layer of the Compound Effect. When you need data NOW, use MCP.

| Tool | Purpose | Use When |
|------|---------|----------|
| `brain_cynic_judge` | Core judgment | Programmatic judgment (agents use this) |
| `brain_cynic_digest` | Text → Knowledge | Bulk text processing |
| `brain_cynic_feedback` | Learning from outcomes | Correcting past judgments |
| `brain_cynic_stats` | Introspection | Checking CYNIC's accuracy |
| `brain_search` | Search knowledge | Finding past learnings |
| `brain_patterns` | View patterns | Listing detected patterns |
| `brain_health` | System health | Debugging, status checks |

---

## Context Awareness

> **WHY this matters**: Quality degrades BEFORE context fills. At 20-40% usage, outputs start degrading. CYNIC knows this.

```
Q_output = Q_max × (1 - k × context_usage)

At 20-30% → Quality starts degrading
At 50%    → Significant degradation
At 70%+   → Consider /clear or /compact
```

**Best practices:**
- One conversation per task (don't mix concerns)
- Write important context to files (persists across sessions)
- Better to /clear and restart than struggle through confusion

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

> **WHY guidelines?** These aren't rules - they're verified patterns. Following them burns TIME (no reinventing). Ignoring them burns EGO (you'll learn the hard way).

### When Making Decisions
1. Run `/judge` on significant decisions
2. Document rationale (CYNIC captures INTENT)
3. Never exceed 61.8% confidence

**WHY**: Decisions without judgment are assumptions. Assumptions are EGO. CYNIC burns EGO.

### When Debugging
1. Check `/health` for system status
2. Search `/patterns --category=issues` for similar problems
3. Trust verification over assumptions

**WHY**: The bug you're chasing was probably solved before. Search first, debug second.

### When Refactoring
1. Use `/digest` on existing code patterns
2. Run `/patterns --category=technical` for conventions
3. Verify with `/judge` before committing

**WHY**: Refactoring without understanding creates new problems. Digest before you change.

---

## The Compound Effect

> **WHY this architecture?** Each layer alone is useful. Together, they multiply.

```
Skills (encode) × Agents (isolate) × MCP (persist) = Multiplicative improvement
```

| Layer | Function | Benefit |
|-------|----------|---------|
| **Skills** | Personality (~100 tokens) | Philosophy without context pollution |
| **Agents** | Fresh 200K context | Isolated judgment, clean returns |
| **MCP** | Persistent memory | Instant access, cross-session |

**The flywheel:**
```
CYNIC makes mistake → You correct (/learn) → CYNIC improves → Better for everyone
```

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
