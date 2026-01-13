# CYNIC Quickstart Guide

> "φ qui se méfie de φ" - The skeptical dog that doubts everything, including itself

## What is CYNIC?

CYNIC (κυνικός = "comme un chien") is a multi-dimensional judgment system built into asdf-brain. Like the ancient Greek Cynics who lived honestly and directly, CYNIC evaluates knowledge, decisions, and patterns with unwavering skepticism.

**Core Philosophy:**
- Maximum confidence: **61.8%** (φ⁻¹) - Never trust fully
- Minimum doubt: **38.2%** (φ⁻²) - Always question
- Heartbeat: **61.8 seconds** - All timing derives from φ

## Quick Start

### 1. Judging Content

Use the `/judge` skill to evaluate any decision, code, or knowledge:

```
/judge "the decision to use PostgreSQL for user data"
```

**Output:**
```
🐕 CYNIC JUDGMENT
═══════════════════════════════════════════════════

Subject: the decision to use PostgreSQL for user data

╔══════════════════════════════════════════════════╗
║  VERDICT: WAG  ✅                                 ║
║  Score: 72/100 | Confidence: 55.3%               ║
╚══════════════════════════════════════════════════╝

*wags steadily* Good scent here. This passes my inspection.

───────────────────────────────────────────────────
🐕 κυνικός | Don't trust, verify | φ⁻¹ = 61.8% max
```

### 2. Digesting Chaos

Use `/digest` to extract structured knowledge from unstructured text:

```
/digest "Today we decided to migrate from REST to GraphQL because 
of the N+1 problem and client flexibility needs..."
```

**Extracts:**
- **IDEAS** (MEMORY layer) - Core concepts
- **LINKS** (TEACHING layer) - Connections to existing knowledge
- **ROADMAP** (INTENT layer) - Actionable next steps

### 3. Searching Knowledge

Search across all CYNIC knowledge with `/search`:

```
/search "authentication patterns"
/search --type=decision --project=holdex "rate limiting"
```

### 4. Viewing Patterns

See detected patterns with `/patterns`:

```
/patterns --category=technical
/patterns --category=issues
```

Categories: `technical`, `process`, `issues`, `solutions`

### 5. System Health

Check CYNIC system status with `/health`:

```
/health
```

Shows: pulse status, anomaly count, subsystem health, learning stats.

### 6. Providing Feedback

Help CYNIC learn from outcomes with `/learn`:

```
/learn correct jdg_abc123
/learn incorrect jdg_xyz789 "Actually failed in production"
```

## Understanding Verdicts

| Verdict | Score | Dog Says | Meaning |
|---------|-------|----------|---------|
| **HOWL** | ≥80 | *howls approvingly* | Exceptional - rare achievement |
| **WAG** | ≥50 | *wags steadily* | Good - passes inspection |
| **GROWL** | ≥38.2 | *low growl* | Needs work - issues detected |
| **BARK** | <38.2 | *barks warning* | Critical - serious problems |

## The 4 Axioms

CYNIC operates on 4 foundational axioms:

| Axiom | Symbol | Principle | World |
|-------|--------|-----------|-------|
| **PHI** | φ | All ratios derive from 1.618... | ATZILUT |
| **VERIFY** | ✓ | Don't trust, verify | BERIAH |
| **CULTURE** | ⛩ | Culture is a moat | YETZIRAH |
| **BURN** | 🔥 | Don't extract, burn | ASSIAH |

## The 25 Dimensions

CYNIC evaluates across 25 dimensions in 4 categories:

### Primary (8)
TRUTH, INTEGRITY, COHERENCE, ALIGNMENT, PROGRESS, HARMONY, ETHICS, OPTIMISM

### Secondary (5)
SIMPLIFY, ENABLE, SECURE, PRIVATE, SCALE

### Meta (3)
SELF_AWARENESS, DECISION_VELOCITY, SINGULARITY_DISTANCE

### Human-LLM (8)
MEMORY, TEACHING, DELEGATION, TRUST, INTENT, BOUNDARIES, COMPLEMENTARITY, PROACTIVITY

### Discovery (1)
New dimensions discovered through residual detection (INNOMMABLE)

## Autonomous Agents

CYNIC includes 4 autonomous agents that work in the background:

| Agent | Trigger | Purpose |
|-------|---------|---------|
| **cynic-observer** | PostToolUse | Silent pattern detection |
| **cynic-digester** | PostConversation | Extract session knowledge |
| **cynic-guardian** | PreToolUse (risky) | Block dangerous operations |
| **cynic-mentor** | Context-aware | Proactive suggestions |

## MCP Tools

For programmatic access, use the MCP tools:

```javascript
// Judge something
brain_cynic_judge({ item: {...}, mode: 'standard' })

// Digest text
brain_cynic_digest({ text: '...', source: 'conversation' })

// Search knowledge
brain_search({ query: '...', type: 'pattern' })

// Provide feedback
brain_cynic_feedback({ judgment_id: '...', outcome: 'correct' })
```

## Best Practices

1. **Judge significant decisions** - Run `/judge` before committing to major choices
2. **Digest conversations** - Let CYNIC extract knowledge from discussions
3. **Trust the doubt** - If CYNIC growls, investigate before proceeding
4. **Provide feedback** - Help CYNIC learn from actual outcomes
5. **Watch for patterns** - Check `/patterns` regularly for insights

## Philosophy

> "Le chien qui se méfie de tout, même de lui-même."
> 
> The dog that doubts everything, even itself.

CYNIC embodies the ancient Cynic philosophers:
- **Honest** - Says what needs to be said
- **Direct** - No sugarcoating
- **Loyal** - To truth, not to comfort
- **Skeptical** - Questions everything

---

*🐕 κυνικός | Loyal to truth, not to comfort | φ⁻¹ = 61.8% max*
