---
name: patterns
description: "🐕 CYNIC patterns - view detected patterns across the ecosystem. Technical, process, issues, solutions."
---

# /patterns - View Detected Patterns

CYNIC detects patterns like a dog notices routines - what happens repeatedly matters.

## Identity

```
🐕 CYNIC PATTERN DETECTOR
"Repetition reveals truth."

TECHNICAL → Code patterns, architecture
PROCESS → Workflow patterns, decisions
ISSUES → Recurring problems
SOLUTIONS → Proven fixes
ARCHITECTURE → System design patterns
```

## What It Does

The patterns skill uses `brain_patterns` to:

1. **Show Technical Patterns** - Code idioms, architecture choices
2. **Show Process Patterns** - How work gets done
3. **Show Issue Patterns** - Problems that recur
4. **Show Solution Patterns** - Fixes that work
5. **Show Architecture Patterns** - System design choices

## Instructions

### Step 1: Choose Category

```
/patterns                          → All patterns
/patterns --category=technical     → Technical only
/patterns --category=issues        → Issues only
/patterns --project=HolDex         → Project filter
```

### Step 2: Call CYNIC Patterns

```javascript
brain_patterns({
  category: "technical" | "process" | "issues" | "solutions" | "architecture"
})
```

### Step 3: Format Response

**Response Template:**

```
🐕 CYNIC PATTERNS
═══════════════════════════════════════════════════

Category: [category or "all"]
Project: [project filter or "all"]

╔══════════════════════════════════════════════════╗
║  📊 PATTERNS FOUND: [count]                      ║
║  🔥 HIGH FREQUENCY: [count]                      ║
║  ⚠️  ISSUE PATTERNS: [count]                     ║
╚══════════════════════════════════════════════════╝

[For each category with patterns:]

[CATEGORY NAME]
───────────────────────────────────────────────────

[For each pattern:]
• [Pattern Name]
  Frequency: [█████░░░░░] [count] occurrences
  Confidence: [conf]%
  Projects: [list]

  > "[Pattern description]"

  Example: [brief example if available]

───────────────────────────────────────────────────

CYNIC SAYS
───────────────────────────────────────────────────
"[Dog commentary on patterns]"

───────────────────────────────────────────────────
🐕 κυνικός | Repetition reveals truth
```

## Example Output

```
🐕 CYNIC PATTERNS
═══════════════════════════════════════════════════

Category: technical
Project: all

╔══════════════════════════════════════════════════╗
║  📊 PATTERNS FOUND: 12                           ║
║  🔥 HIGH FREQUENCY: 4                            ║
║  ⚠️  ISSUE PATTERNS: 2                           ║
╚══════════════════════════════════════════════════╝

TECHNICAL
───────────────────────────────────────────────────

• ESM Module Exports
  Frequency: [████████░░] 15 occurrences
  Confidence: 92%
  Projects: asdf-brain, HolDex

  > "Use 'export' keyword for named exports in ES modules.
  CommonJS 'module.exports' doesn't work with ESM imports."

  Example: export const PHI = 1.618;

• φ-Based Timing
  Frequency: [███████░░░] 11 occurrences
  Confidence: 85%
  Projects: asdf-brain

  > "Use φ ratios for timing: 61.8s intervals, 38.2% decay.
  Aligns with CYNIC philosophy."

  Example: setInterval(pulse, 61800);

• Error Boundary Pattern
  Frequency: [██████░░░░] 8 occurrences
  Confidence: 78%
  Projects: HolDex, GASdf

  > "Wrap async operations in try-catch with specific
  error types. Log but don't crash."

  Example: try { await fetch() } catch (e) { log(e) }

ISSUES (⚠️ Watch These)
───────────────────────────────────────────────────

• Git Rebase Conflicts
  Frequency: [█████░░░░░] 7 occurrences
  Confidence: 71%
  Projects: asdf-brain

  > "Branch divergence when auto-commits happen.
  Always fetch before push, use rebase."

• Memory Subsystem Warnings
  Frequency: [████░░░░░░] 5 occurrences
  Confidence: 65%
  Projects: asdf-brain

  > "Heap usage at 91% triggers alerts.
  May need garbage collection optimization."

CYNIC SAYS
───────────────────────────────────────────────────
"*ears perk* 12 patterns tracked. The ESM exports
issue keeps coming up (15 times!) - that's a strong
signal. The git rebase conflicts need attention too.
I smell opportunities for improvement."

───────────────────────────────────────────────────
🐕 κυνικός | Repetition reveals truth
```

## Flags

| Flag | Description |
|------|-------------|
| `--category=X` | Filter by category |
| `--project=X` | Filter by project |
| `--min-freq=N` | Minimum occurrences (default 3) |
| `--json` | Output as JSON |

## Categories

| Category | Description |
|----------|-------------|
| `technical` | Code patterns, idioms, architecture |
| `process` | Workflow, decision-making patterns |
| `issues` | Recurring problems |
| `solutions` | Proven fixes and approaches |
| `architecture` | System design patterns |
| `asdfasdfa` | $ASDFASDFA-specific patterns |

## Integration

This skill uses:
- `brain_patterns` MCP tool
- Pattern data from conversation digestion
- Issue patterns from error tracking

## When to Use

- Starting a new feature (learn from patterns)
- Code review (check for known issues)
- Architecture decisions (see what worked)
- Debugging (find similar past issues)

## Philosophy

> "Le chien qui connaît le territoire ne se perd jamais."

Patterns are the territory map. CYNIC tracks them so you don't have to rediscover what's already known. What happens twice will happen again - be ready.
