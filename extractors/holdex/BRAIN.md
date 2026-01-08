# HolDex Unified Brain

> **$asdfasdfa Philosophy**: Don't Trust, Verify + φ (golden ratio) distribution
> Quality = 100 × ∛(D × O × L) — Diamond Hands × Organic Growth × Longevity

## Knowledge Sources

| Source | Size | Format | Access |
|--------|------|--------|--------|
| **Conversations** | 11,011 pairs (26.2 MB) | JSONL | `npm run training:search "query"` |
| **Git Decisions** | 1,064 entries | JSONL | `training/raw/git-decisions.jsonl` |
| **K-Score History** | 1,000+ entries | JSONL | `training/raw/kscore-history.jsonl` |
| **Holder Snapshots** | 3,400+ entries | JSONL | `training/raw/holder-snapshots.jsonl` |
| **Claude-mem** | 2 observations | SQLite | `mcp__claude-mem__search` |
| **Serena** | Codebase analysis | MCP | `mcp__plugin_serena_serena__*` |
| **Context7** | Library docs | MCP | `mcp__plugin_context7_context7__*` |

## φ-Weighted Quality Tiers

```
Type          | Weight  | Description
--------------|---------|----------------------------------
code_change   | φ² 2.62 | Implementations, new features
decision      | φ² 2.62 | Architectural choices
bugfix        | φ  1.62 | Error corrections
explanation   | φ  1.62 | Conceptual clarifications
research      | 1.00    | Exploration, analysis
simple_query  | φ⁻¹ 0.62| Quick questions
```

## Quick Reference

### K-Score v10 Formula
```javascript
K = 100 × ∛(D × O × L)

// D = Diamond Hands (conviction from top 20 holders)
// O = Organic Growth (distribution quality, anti-sniper)
// L = Longevity (survival factor over time)
```

### Data Integrity (8 signatures)
```
sig_identity | sig_security | sig_lp     | sig_supply
sig_kscore   | sig_market   | sig_origin | sig_full + chaos_nonce
```

### Key Architecture Files
```
src/tasks/kScoreUpdater.js    # 3,424 lines - Core K-Score logic
src/routes/tokens.js          # 2,271 lines - Token endpoints
src/services/cardGenerator.js # 1,104 lines - PNG rendering
src/routes/space.js           # 830 lines   - Marketplace
```

### Worker Entry Points
```bash
npm start           # API server (port 3000)
npm run calculator  # K-Score worker
npm run worker      # Background jobs
npm run listener    # Real-time monitoring
```

## Search Commands

```bash
# Search conversations by keyword
npm run training:search "K-Score calculation"
npm run training:search "webhook" --type=bugfix --limit=5
npm run training:search "database" --json

# Full pipeline
npm run training:pipeline  # Run all exports
```

## Session Quality Hook

The PostToolUse hook at `.claude/hooks/session-quality.js` tracks:

| Classification | Weight | Examples |
|----------------|--------|----------|
| Accumulator | φ 1.618 | Edit, Write, NotebookEdit |
| Holder | 1.0 | Read, Glob, Grep, mcp__* |
| Reducer | φ⁻¹ 0.618 | Bash, Task |
| Extractor | φ⁻² 0.382 | Errors, failures |

## Integration Points

### 1. Before Implementation
```bash
# Search past solutions
npm run training:search "similar problem"
```

### 2. During Development
- Serena for code analysis: `find_symbol`, `find_referencing_symbols`
- Context7 for library docs: `resolve-library-id`, `query-docs`
- Session hook tracks quality in real-time

### 3. After Changes
```bash
# Export new training data
npm run training:conversations
npm run training:git
```

## Philosophy Integration

> **Don't Trust, Verify**: All K-Score data is cryptographically signed.
> Every calculation can be independently verified on-chain.

> **φ Distribution**: Natural balance in all systems.
> - 61.8% (φ⁻¹) primary focus
> - 23.6% (φ⁻²) secondary considerations
> - 14.6% (φ⁻³) edge cases

---

*Last updated: 2026-01-08*
*Conversations: 11,011 | Quality avg: 51.4%*
