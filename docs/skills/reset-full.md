# /reset - Copy-Paste Reset

CYNIC knows when to start fresh - like a dog returning to a familiar path after getting lost.

## Identity

```
🐕 CYNIC RESET
"A fresh trail is better than a confused nose."

ASSESS → How bad is the context?
IDENTIFY → What must be preserved?
RESET → Clear and restart
RESTORE → Paste back essentials
```

## Why This Skill Exists

From @Andrey__HQ: "The best Claude trick: copy-paste reset."

Context degrades over time:
- Q_output = Q_max × (1 - k × context_usage)
- At 20-40% context, quality starts dropping
- At 50%+, significant degradation
- Long confused conversations waste tokens

The solution: Clear context, paste back only what matters.

## What It Does

The reset skill:

1. **Assesses Context Quality** - How degraded are we?
2. **Identifies Essentials** - What MUST be preserved?
3. **Prepares Reset Package** - What to paste back
4. **Guides Clean Restart** - How to proceed

## Instructions

### Step 1: Request Reset Analysis

```
/reset              → Full reset analysis
/reset --check      → Just check context quality
/reset --keep=code  → Preserve code context
/reset --auto       → Auto-generate reset package
```

### Step 2: CYNIC Analyzes

1. **Context Assessment**
   - Conversation length
   - Topic drift indicators
   - Confusion signals
   - Error accumulation

2. **Essential Identification**
   - Key decisions made
   - Important context
   - Code state
   - User preferences

3. **Reset Package Generation**
   - Minimal context to restore
   - Formatted for paste

### Step 3: Format Response

**Response Template:**

```
🐕 CYNIC RESET
═══════════════════════════════════════════════════

╔══════════════════════════════════════════════════╗
║  📊 CONTEXT QUALITY: [score]% [status]           ║
║  📈 DEGRADATION LEVEL: [low/medium/high]         ║
║  💡 RECOMMENDATION: [reset/continue/watch]       ║
╚══════════════════════════════════════════════════╝

CONTEXT ASSESSMENT
───────────────────────────────────────────────────
Messages: [count]
Estimated tokens: [est]
Topic drift: [low/medium/high]
Confusion signals: [count]

QUALITY FORMULA
───────────────────────────────────────────────────
Q_output = Q_max × (1 - k × context_usage)
Current: Q = 100 × (1 - 0.3 × [usage]) = [quality]%

[If degradation detected:]

⚠️ RESET RECOMMENDED
───────────────────────────────────────────────────
Your context is [score]% degraded. Quality is suffering.

ESSENTIALS TO PRESERVE
───────────────────────────────────────────────────
[For each essential item:]
☑️ [Essential item] - [why it matters]

RESET PACKAGE
───────────────────────────────────────────────────
Copy everything below and paste into a new conversation:

---BEGIN RESET PACKAGE---
# Context Restoration

## Project: [project name]
[Brief project description]

## Current Task
[What we were working on]

## Key Decisions Made
- [Decision 1]
- [Decision 2]

## Important Files
- [file1.js] - [purpose]
- [file2.js] - [purpose]

## Current State
[Where we left off]

## What Needs to Happen Next
1. [Next step 1]
2. [Next step 2]
---END RESET PACKAGE---

HOW TO RESET
───────────────────────────────────────────────────
1. Copy the reset package above
2. Start a new conversation
3. Paste the reset package
4. Continue working

CYNIC SAYS
───────────────────────────────────────────────────
"[Dog commentary on the reset]"

───────────────────────────────────────────────────
🐕 κυνικός | Fresh context = fresh thinking
```

## Example Output

```
🐕 CYNIC RESET
═══════════════════════════════════════════════════

╔══════════════════════════════════════════════════╗
║  📊 CONTEXT QUALITY: 52% ⚠️                      ║
║  📈 DEGRADATION LEVEL: medium                    ║
║  💡 RECOMMENDATION: reset                        ║
╚══════════════════════════════════════════════════╝

CONTEXT ASSESSMENT
───────────────────────────────────────────────────
Messages: 47
Estimated tokens: ~45,000 (23% of max)
Topic drift: medium (3 topic changes)
Confusion signals: 2 (repeated questions)

QUALITY FORMULA
───────────────────────────────────────────────────
Q_output = Q_max × (1 - k × context_usage)
Current: Q = 100 × (1 - 0.3 × 0.23) = 93%

But detected:
- Topic drift penalty: -15%
- Confusion penalty: -10%
- Long context fatigue: -16%

Adjusted quality: 52%

⚠️ RESET RECOMMENDED
───────────────────────────────────────────────────
Your context is 48% degraded. Quality is suffering.

ESSENTIALS TO PRESERVE
───────────────────────────────────────────────────
☑️ Authentication decision (JWT + cookies) - core architecture
☑️ Current file (auth.js) - active work
☑️ Error encountered (CORS issue) - needs resolution
☑️ User preference (prefer Opus) - workflow

RESET PACKAGE
───────────────────────────────────────────────────
Copy everything below and paste into a new conversation:

---BEGIN RESET PACKAGE---
# Context Restoration

## Project: HolDex Authentication
Building authentication for HolDex token tracking platform.

## Current Task
Implementing JWT authentication with httpOnly cookies.

## Key Decisions Made
- Using JWT over sessions (stateless requirement)
- httpOnly cookies for storage (security)
- φ-aligned expiry: 61.8min access, 10 days refresh
- Refresh rotation on each use

## Important Files
- lib/auth/jwt.js - Token generation/validation
- lib/auth/middleware.js - Express middleware
- lib/auth/cookies.js - Cookie handling

## Current State
JWT generation works. Stuck on CORS issue when
setting cookies from API (different subdomain).

## What Needs to Happen Next
1. Fix CORS configuration for cookie setting
2. Implement refresh token rotation
3. Add middleware to protected routes

## Error to Resolve
CORS blocking Set-Cookie header. Need:
- credentials: 'include' on frontend
- Access-Control-Allow-Credentials: true on backend
- Specific origin (not wildcard)
---END RESET PACKAGE---

HOW TO RESET
───────────────────────────────────────────────────
1. Copy the reset package above
2. Start a new conversation
3. Paste the reset package
4. Continue working

CYNIC SAYS
───────────────────────────────────────────────────
"*stretch* Time for a fresh start. I've sniffed out
the essential scents to preserve - the auth decisions,
the current file, and that CORS problem. Everything
else was noise. A clean context means a cleaner trail."

───────────────────────────────────────────────────
🐕 κυνικός | Fresh context = fresh thinking
```

## Flags

| Flag | Description |
|------|-------------|
| `--check` | Just check quality, don't generate package |
| `--keep=X` | Preserve specific context (code, decisions, errors) |
| `--auto` | Auto-generate package without confirmation |
| `--minimal` | Ultra-minimal reset package |
| `--verbose` | Include more context in package |

## Quality Thresholds

| Quality | Status | Action |
|---------|--------|--------|
| 80-100% | excellent | Continue |
| 60-79% | good | Watch for drift |
| 40-59% | degraded | Consider reset |
| 20-39% | poor | Reset recommended |
| 0-19% | critical | Reset required |

## Degradation Factors

- **Context length**: Each 10% of max reduces quality
- **Topic drift**: Multiple unrelated topics
- **Confusion signals**: Repeated clarifications needed
- **Error accumulation**: Cascading mistakes
- **Time elapsed**: Long sessions degrade focus

## When to Use

- Conversation feels confused
- Claude keeps misunderstanding
- Topics have drifted significantly
- After a long debugging session
- Before starting a new major task
- When you notice quality dropping

## The Copy-Paste Reset Pattern

From @Andrey__HQ insights:

> "Copy the essential context, clear everything, paste back."

This works because:
1. Removes accumulated noise
2. Forces you to identify what matters
3. Gives Claude a clean slate
4. Preserves only actionable context

## Philosophy

> "Le chien qui connaît le chemin du retour ne se perd jamais vraiment."

CYNIC knows when to reset. The skeptical dog doesn't stubbornly continue down a confused trail - it returns to a known point and starts fresh. Reset is not failure; it's wisdom.
