# CYNIC Implementation Plan

<!-- Captured before codespace shutdown - 2026-01-10 -->
<!-- Source: brain decision hash pending -->

## L'Essence (Gravée)

```
CYNIC = φ qui se méfie de φ
```

## Architecture Decision

**CYNIC is NOT a replacement for existing infrastructure.**
**CYNIC IS a philosophical filter layer on top of daat-levels.js**

```
INPUT
  ↓
daat-levels.js (contextual analysis - EXISTE)
  ↓
cynic.js (φ limits + doubt - À CRÉER)
  ↓
OUTPUT avec confidence cappée + doute intégré
```

## What CYNIC Adds

| Feature | Exists? | What it does |
|---------|---------|--------------|
| Ceiling φ⁻¹ (61.8%) | ❌ | Never too confident |
| Floor φ⁻² (38.2%) | ❌ | Always doubt |
| Self-judgment | ❌ | CYNIC judges CYNIC |
| Transform | ❌ | Not accept/reject, evolution |

## Implementation Priority

### Phase 1: Core (FIRST)
1. `lib/cynic.js` (~150 lines) - The cycle + limits
2. `lib/self-judge.js` (~100 lines min) - Evaluation logic

### Phase 2: Integration
3. Hook into `daat-levels.js`
4. Add `brain_judge` MCP tool

### Phase 3: Extensions (OPTIONAL)
5. Dimension plugins (if needed)
6. HolDex/GASdf webhooks

## Core Code Structure

```javascript
// lib/cynic.js
const PHI_INV = 0.618033988749895;   // max confidence
const PHI_INV_2 = 0.381966011250105; // doubt floor

class CYNIC {
  async process(input, source) {
    const ingested = await this.ingest(input, source);
    const judgment = await this.judge(ingested);
    const result = await this.transform(ingested, judgment);
    return { ingested, judgment, result };
  }

  async judge(item) {
    const raw = await this.evaluate(item);
    // NEVER too confident
    const confidence = Math.min(raw, PHI_INV);
    // ALWAYS doubt
    const doubt = Math.max(1 - confidence, PHI_INV_2);

    return {
      confidence,
      doubt,
      verdict: confidence >= 0.5 ? 'ACCEPT' : 'VERIFY'
    };
  }
}
```

## Existing Infrastructure to Reuse

| Module | Status | Purpose |
|--------|--------|---------|
| daat-levels.js | ✅ Working | 4-level decision matrix |
| context-layer.js | ✅ Working | Session management |
| burn-mechanism.js | ✅ Working | Contribution tracking |
| temporal.js | ✅ Working | φ constants defined |
| merkle-proofs.js | ✅ Working | Verification |

## Current State

- **12 lib modules**: ALL WORKING
- **18 MCP tools**: ALL WORKING
- **CYNIC docs**: 2,359 lines
- **CYNIC code**: 0 lines

## Key Insight

```
CYNIC ≠ nouveau système
CYNIC = filtre φ sur système existant

On réutilise l'infra, on ajoute la philosophie.
```

## Hybrid Approach for Dimensions

- Core with simple evaluation (essence pure)
- Dimensions as optional plugins
- Can activate/deactivate per context

```javascript
const cynic = new CYNIC();
// Simple mode (default)
await cynic.process(input);

// Extended mode (optional)
cynic.loadDimension('ethics');
cynic.loadDimension('privacy');
await cynic.process(input);
```

## Next Session

1. Create `lib/cynic.js`
2. Create `lib/self-judge.js`
3. Test cycle locally
4. Add MCP tool
5. Commit & push

---

*Plan captured pre-shutdown. Brain has the decision recorded.*
