# CYNIC Integration Roadmap

> "φ qui se méfie de φ" - A systematic integration plan for the skeptical dog

**Author**: Engineering Team
**Version**: 2.0.0
**Status**: Phase 5 (Testing & Validation)
**Philosophy**: Ship incrementally, verify constantly

---

## Executive Summary

CYNIC (κυνικός = "comme un chien") is a multi-dimensional judgment system that needs proper integration into Claude Code workflows. This roadmap defines a sequential execution plan with clear milestones, dependencies, and verification criteria.

**Total Phases**: 6
**Estimated Completion**: Sequential, each phase ships independently
**Core Principle**: Each phase is production-ready before moving to next

---

## Phase 0: Foundation Audit ✅ COMPLETE

### 0.1 Core Library Status
- [x] lib/cynic/judge.js - Main judgment engine
- [x] lib/cynic/dimensions/* - 25 dimensions (8 primary, 5 secondary, 3 meta, 8 human-llm, 1 discovery)
- [x] lib/cynic/axioms/* - PHI, VERIFY, CULTURE, BURN
- [x] lib/cynic/laws/* - 16 Laws of CYNIC
- [x] lib/cynic/skill-judge.js - 5×5 ↔ 4Mondes interface
- [x] lib/cynic/pulse.js - Heartbeat system (61.8s)
- [x] lib/cynic/innommable.js - Emergence detection

### 0.2 MCP Tools Status
- [x] brain_cynic_judge - Core judgment
- [x] brain_cynic_feedback - Learning from outcomes
- [x] brain_cynic_stats - Introspection
- [x] brain_cynic_learn - Manual learning trigger
- [x] brain_cynic_residual - Anomaly detection
- [x] brain_cynic_discover_dimensions - Dimension discovery
- [x] brain_cynic_digest - Text → Knowledge extraction

### 0.3 Plugin Status
- [x] .claude/plugin.json - Plugin manifest
- [x] .claude/skills/judge.md - /judge skill
- [x] .claude/hooks/observe-action.js - PostToolUse observer
- [x] .claude/hooks/post-conversation.js - Summary extractor

---

## Phase 1: Skills Layer ✅ COMPLETE

> "Skills are the user interface to CYNIC"

### 1.1 /judge Enhancement
**Priority**: HIGH
**Status**: EXISTS, NEEDS ENHANCEMENT

```
Current: Basic judgment formatting
Target:  Rich output with dimension breakdown, suggestions, confidence bars
```

**Tasks**:
- [ ] Add mode auto-detection from context
- [ ] Add dimension breakdown visualization (ASCII bars)
- [ ] Add actionable suggestions for TRANSFORM verdicts
- [ ] Add history reference ("Similar to judgment #X")

**Verification**:
```bash
# Test command
/judge "the decision to use PostgreSQL"
# Expected: Rich output with breakdown
```

### 1.2 /digest Skill
**Priority**: HIGH
**Status**: NEW

**Purpose**: Transform chaotic text into structured knowledge

```markdown
# .claude/skills/digest.md

---
name: digest
description: "🐕 CYNIC digestion - transform chaos into structured knowledge"
---

# /digest - Extract Knowledge from Chaos

Uses brain_cynic_digest to:
1. Extract IDEAS (MEMORY layer)
2. Find LINKS to existing knowledge (TEACHING layer)
3. Build ROADMAP items (INTENT layer)
4. Auto-learn high-confidence ideas
```

**Tasks**:
- [ ] Create .claude/skills/digest.md
- [ ] Define input formats (text, URL, conversation)
- [ ] Define output format (structured knowledge cards)
- [ ] Add confidence thresholds for auto-learning

**Verification**:
```bash
/digest "conversation about authentication patterns"
# Expected: Extracted ideas, links, roadmap items
```

### 1.3 /learn Skill
**Priority**: MEDIUM
**Status**: NEW

**Purpose**: Provide feedback on past judgments for learning

**Tasks**:
- [ ] Create .claude/skills/learn.md
- [ ] Define feedback format (judgment_id, outcome, notes)
- [ ] Show learning impact (weight adjustments)
- [ ] Add undo capability

**Verification**:
```bash
/learn correct jdg_abc123 "Actually worked well"
# Expected: Weights adjusted, confirmation message
```

### 1.4 /search Skill
**Priority**: MEDIUM
**Status**: NEW

**Purpose**: Search across all CYNIC knowledge

**Tasks**:
- [ ] Create .claude/skills/search.md
- [ ] Support query types (patterns, decisions, errors)
- [ ] Format results with relevance scores
- [ ] Add filters (project, date, type)

**Verification**:
```bash
/search "authentication patterns" --type=pattern
# Expected: Relevant patterns with scores
```

### 1.5 /patterns Skill
**Priority**: LOW
**Status**: NEW

**Purpose**: View detected patterns

**Tasks**:
- [ ] Create .claude/skills/patterns.md
- [ ] Filter by category (technical, process, issues, solutions)
- [ ] Show pattern frequency and confidence
- [ ] Link to source conversations

### 1.6 /health Skill
**Priority**: LOW
**Status**: NEW

**Purpose**: CYNIC system health dashboard

**Tasks**:
- [ ] Create .claude/skills/health.md
- [ ] Show pulse status, anomaly count, subsystem health
- [ ] Show learning stats (judgments, accuracy)
- [ ] Alert on critical issues

---

## Phase 2: Agents Layer ✅ COMPLETE

> "Agents are autonomous CYNIC behaviors"

### 2.1 cynic-observer Agent
**Priority**: HIGH
**Status**: EXISTS AS HOOK, CONVERT TO AGENT

**Purpose**: Observe all tool uses, detect patterns

```yaml
# .claude/agents/cynic-observer.yml

name: cynic-observer
description: "Silent observation of tool usage patterns"
trigger: PostToolUse
behavior: non-blocking
output: knowledge/cynic/observations/actions.jsonl
```

**Tasks**:
- [ ] Convert hook to proper agent format
- [ ] Add pattern detection (repeated failures, unusual sequences)
- [ ] Add real-time alerts for anomalies
- [ ] Connect to brain_cynic_residual

### 2.2 cynic-digester Agent
**Priority**: HIGH
**Status**: PARTIAL (hook exists)

**Purpose**: Digest conversations into knowledge

**Tasks**:
- [ ] Create .claude/agents/cynic-digester.md
- [ ] Trigger on conversation end
- [ ] Extract decisions, patterns, errors
- [ ] Store in knowledge base with CYNIC judgment

### 2.3 cynic-guardian Agent
**Priority**: MEDIUM
**Status**: NEW

**Purpose**: Protect against risky decisions

```yaml
trigger: PreToolUse
conditions:
  - tool in [Bash, Write, Edit] AND command.isDestructive
  - file in [.env, credentials, secrets]
behavior: blocking (requires user confirmation)
```

**Tasks**:
- [ ] Create .claude/agents/cynic-guardian.md
- [ ] Define risk patterns (destructive commands, sensitive files)
- [ ] Add confirmation dialog
- [ ] Log blocked attempts

### 2.4 cynic-mentor Agent
**Priority**: LOW
**Status**: NEW

**Purpose**: Proactive suggestions based on context

**Tasks**:
- [ ] Suggest similar past solutions
- [ ] Warn about repeated mistakes
- [ ] Recommend patterns from knowledge base

---

## Phase 3: Identity & Personality ✅ COMPLETE

> "CYNIC speaks with one voice"

### 3.1 Core Identity
**Priority**: HIGH
**Status**: PARTIAL

```typescript
interface CYNICIdentity {
  name: "CYNIC",
  greek: "κυνικός",
  meaning: "comme un chien",
  emoji: "🐕",

  // Personality traits
  traits: {
    skeptical: true,      // Always doubts (min 38.2%)
    loyal: true,          // Loyal to truth
    direct: true,         // No sugarcoating
    protective: true,     // Guards against bad decisions
  },

  // Communication style
  voice: {
    greetings: ["Woof.", "*sniff*", "*ears perk*"],
    approvals: ["*wag*", "Good scent.", "This passes."],
    concerns: ["*scratching*", "Hmm...", "Something's off."],
    rejections: ["*growl*", "This stinks.", "No."],
    confusion: ["*head tilt*", "Unclear trail."],
  },

  // Verdicts (replace ACCEPT/TRANSFORM/REJECT)
  verdicts: {
    HOWL: { threshold: 80, reaction: "*howls approvingly*" },
    WAG:  { threshold: 50, reaction: "*wags steadily*" },
    GROWL:{ threshold: 38, reaction: "*low growl*" },
    BARK: { threshold: 0,  reaction: "*barks warning*" },
  }
}
```

**Tasks**:
- [ ] Create lib/cynic/identity.js
- [ ] Export personality constants
- [ ] Use consistently across all outputs
- [ ] Add localization support (FR/EN)

### 3.2 Response Templates
**Priority**: MEDIUM
**Status**: NEW

**Tasks**:
- [ ] Create response templates for each verdict
- [ ] Add dimension-specific commentary
- [ ] Add context-aware suggestions
- [ ] Add humor (sparingly, like a real dog)

### 3.3 Signature Footer
**Priority**: LOW
**Status**: NEW

```
---
🐕 κυνικός | Don't trust, verify | φ⁻¹ = 61.8% max
```

---

## Phase 4: UX Integration ✅ COMPLETE

> "CYNIC should be invisible until needed"

### 4.1 Keyboard Shortcuts
**Priority**: MEDIUM
**Status**: NEW

```
Ctrl+Shift+J → /judge current context
Ctrl+Shift+D → /digest selection
Ctrl+Shift+H → /health quick view
```

**Tasks**:
- [ ] Define shortcut mappings
- [ ] Document in CLAUDE.md
- [ ] Add to help output

### 4.2 Status Indicators
**Priority**: LOW
**Status**: NEW

**Tasks**:
- [ ] Add pulse indicator to prompt
- [ ] Show last judgment verdict
- [ ] Alert on anomalies

### 4.3 Inline Suggestions
**Priority**: LOW
**Status**: NEW

**Tasks**:
- [ ] Suggest /judge after decisions
- [ ] Suggest /digest after long conversations
- [ ] Suggest /learn after outcomes

---

## Phase 5: Testing & Validation

> "Don't trust, verify"

### 5.1 Unit Tests
**Priority**: HIGH
**Status**: PARTIAL

```
test/cynic/
├── judge.test.js        ✅ EXISTS
├── dimensions/          ✅ EXISTS
├── skills/              ❌ MISSING
└── agents/              ❌ MISSING
```

**Tasks**:
- [ ] Add skill tests (input → expected output)
- [ ] Add agent tests (trigger → behavior)
- [ ] Add integration tests (full flow)
- [ ] Add regression tests for dimension weights

### 5.2 Manual Testing Checklist
**Priority**: HIGH
**Status**: NEW

```bash
# Phase 1: Skills
/judge "test decision"           → Expect: Rich verdict output
/digest "conversation text"      → Expect: Extracted knowledge
/learn correct jdg_xxx          → Expect: Weight adjustment
/search "pattern query"         → Expect: Relevant results
/patterns --category=technical  → Expect: Pattern list
/health                         → Expect: Dashboard

# Phase 2: Agents
# Trigger cynic-observer by using tools
# Trigger cynic-digester by ending conversation
# Trigger cynic-guardian by risky command

# Phase 3: Identity
# Verify voice consistency across all outputs
# Verify verdict reactions match
```

### 5.3 Production Validation
**Priority**: HIGH
**Status**: NEW

**Tasks**:
- [ ] Deploy to Render
- [ ] Verify MCP server connectivity
- [ ] Test skills via Claude Code
- [ ] Monitor anomaly rate

---

## Phase 6: Documentation

> "Code without docs is just noise"

### 6.1 User Documentation
**Priority**: MEDIUM
**Status**: PARTIAL

**Tasks**:
- [ ] Update README.md with CYNIC overview
- [ ] Create CYNIC-QUICKSTART.md
- [ ] Add skill reference docs
- [ ] Add agent reference docs

### 6.2 Developer Documentation
**Priority**: MEDIUM
**Status**: PARTIAL

**Tasks**:
- [ ] Document dimension scoring algorithms
- [ ] Document learning mechanisms
- [ ] Document residual detection
- [ ] Add architecture diagrams

### 6.3 API Documentation
**Priority**: LOW
**Status**: EXISTS (inline)

**Tasks**:
- [ ] Generate JSDoc → Markdown
- [ ] Add MCP tool examples
- [ ] Add response schemas

---

## Execution Order

```
Week 1: Phase 1.1-1.2 (Skills: judge enhancement, digest)
Week 2: Phase 1.3-1.4 (Skills: learn, search)
Week 3: Phase 2.1-2.2 (Agents: observer, digester)
Week 4: Phase 3.1-3.2 (Identity: core, templates)
Week 5: Phase 5.1-5.2 (Testing)
Week 6: Phase 6 (Documentation)
```

## Success Criteria

| Metric | Target | Verification |
|--------|--------|--------------|
| Skills available | 6 | `ls .claude/skills/` |
| Agents active | 4 | Plugin health check |
| Test coverage | >80% | `npm test -- --coverage` |
| Response consistency | 100% | Manual review |
| Production uptime | >99% | Render monitoring |

---

## Appendix A: File Structure

```
asdf-brain/
├── .claude/
│   ├── plugin.json           # Plugin manifest
│   ├── skills/
│   │   ├── judge.md          # /judge skill
│   │   ├── digest.md         # /digest skill (NEW)
│   │   ├── learn.md          # /learn skill (NEW)
│   │   ├── search.md         # /search skill (NEW)
│   │   ├── patterns.md       # /patterns skill (NEW)
│   │   └── health.md         # /health skill (NEW)
│   ├── agents/
│   │   ├── cynic-observer.md   # Observer agent
│   │   ├── cynic-digester.md   # Digester agent
│   │   ├── cynic-guardian.md   # Guardian agent
│   │   └── cynic-mentor.md     # Mentor agent (NEW)
│   └── hooks/
│       ├── observe-action.js    # PostToolUse hook
│       └── post-conversation.js # PostConversation hook
├── lib/cynic/
│   ├── identity.js           # CYNIC personality (NEW)
│   └── ... (existing)
└── docs/
    ├── CYNIC-INTEGRATION-ROADMAP.md  # This file
    ├── CYNIC-QUICKSTART.md           # User guide (NEW)
    └── CYNIC-API.md                  # API reference (NEW)
```

---

## Appendix B: MCP Tool Mapping

| Skill | MCP Tool | Parameters |
|-------|----------|------------|
| /judge | brain_cynic_judge | item, context, mode |
| /digest | brain_cynic_digest | text, source, existingKnowledge |
| /learn | brain_cynic_feedback | judgment_id, outcome, feedback |
| /search | brain_search | query, limit, project |
| /patterns | brain_patterns | category |
| /health | brain_health | - |

---

*"Le chien qui se méfie de tout, même de lui-même."*

φ = 1.618 | max confidence = 61.8% | min doubt = 38.2%
