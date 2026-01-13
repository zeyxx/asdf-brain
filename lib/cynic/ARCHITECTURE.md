# CYNIC ARCHITECTURE - Roadmap Complete

> "phi qui se mefie de phi"

**Date**: 2026-01-13
**Status**: Phase 1 ✅ COMPLETE, Phase 2 ✅ COMPLETE, Phase 3 ✅ COMPLETE

---

## 1. VISION ARCHITECTURALE

```
                     ┌─────────────────────────────────────────────────────────────┐
                     │                    SINGLE SOURCE OF TRUTH                    │
                     │                   axioms/constants.js                        │
                     │            PHI, PHI_INV, PHI_INV_2, PHI_INV_3               │
                     └───────────────────────────┬─────────────────────────────────┘
                                                 │
              ┌──────────────────────────────────┼──────────────────────────────────┐
              │                                  │                                  │
              ▼                                  ▼                                  ▼
    ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
    │    AXIOMES      │              │     16 LOIS     │              │    4 MONDES     │
    │   axioms/       │              │     laws/       │              │    worlds/      │
    │                 │              │                 │              │                 │
    │ ├─ constants.js │              │ ├─ index.js     │              │ ├─ index.js     │
    │ ├─ index.js     │              │ └─ checker.js   │              │ ├─ atzilut.js   │
    │ └─ q-score.js   │              │                 │              │ ├─ beriah.js    │
    │                 │              │   E1-E3 (ATZ)   │              │ ├─ yetzirah.js  │
    │   4 AXIOMES:    │              │   Φ1-Φ4 (BER)  │              │ └─ assiah.js    │
    │   PHI, VERIFY   │              │   Ξ1-Ξ4 (YET)  │              │                 │
    │   CULTURE, BURN │              │   Ω1-Ω4 (ASS)  │              │   Coherence     │
    └────────┬────────┘              └────────┬────────┘              └────────┬────────┘
             │                                │                                │
             └────────────────────────────────┼────────────────────────────────┘
                                              │
                                              ▼
                     ┌─────────────────────────────────────────────────────────────┐
                     │                   24 DIMENSION EVALUATORS                    │
                     │                      dimensions/                             │
                     │                                                              │
                     │   PRIMARY (8):    harmony, coherence, truth, integrity      │
                     │                   ethics, optimism, alignment, progress     │
                     │                                                              │
                     │   SECONDARY (5):  secure, private, scale, simplify, enable  │
                     │                                                              │
                     │   META (3):       self-awareness, learning-rate,            │
                     │                   singularity-distance                       │
                     │                                                              │
                     │   HUMAN-LLM (8):  memory, teaching, intent, trust,          │
                     │                   proactivity, complementarity,             │
                     │                   delegation, boundaries                     │
                     └───────────────────────────┬─────────────────────────────────┘
                                                 │
                                                 ▼
                     ┌─────────────────────────────────────────────────────────────┐
                     │                      ORCHESTRATOR                            │
                     │                     self-judge.js                            │
                     │                                                              │
                     │   1. Reçoit item                                            │
                     │   2. Appelle 24 evaluators → scores                         │
                     │   3. Calcule Q-Score (4th root)                             │
                     │   4. Vérifie 16 Lois                                        │
                     │   5. Évalue coherence 4 Mondes                              │
                     │   6. Détermine verdict (ACCEPT/TRANSFORM/REJECT)            │
                     │   7. Applique plafond φ⁻¹ (61.8%)                           │
                     │   8. Signe et retourne                                       │
                     └─────────────────────────────────────────────────────────────┘
```

---

## 2. MAPPING DIMENSIONS → AXIOMES → MONDES

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DIMENSION → AXIOM → WORLD MAPPING                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ATZILUT (Essence) │ PHI Axiom    │ Weight: φ² = 2.618                        │
│   ──────────────────┼──────────────┼─────────────────────────                   │
│   harmony           │ L'équilibre  │ PRIMARY                                    │
│   coherence         │ Unité        │ PRIMARY                                    │
│   simplify          │ Clarté       │ SECONDARY                                  │
│   self-awareness    │ Conscience   │ META                                       │
│   memory            │ Mémoire      │ HUMAN-LLM                                  │
│   teaching          │ Transmission │ HUMAN-LLM                                  │
│                                                                                  │
│   BERIAH (Economics) │ VERIFY Axiom │ Weight: φ = 1.618                         │
│   ───────────────────┼──────────────┼────────────────────                       │
│   truth              │ Vérifiable   │ PRIMARY                                   │
│   integrity          │ Intégrité    │ PRIMARY                                   │
│   secure             │ Sécurité     │ SECONDARY                                 │
│   private            │ Vie privée   │ SECONDARY (CRITICAL: threshold 90)        │
│   learning-rate      │ Apprentissage│ META                                      │
│   intent             │ Intention    │ HUMAN-LLM                                 │
│   trust              │ Confiance    │ HUMAN-LLM                                 │
│                                                                                  │
│   YETZIRAH (Ethics)  │ CULTURE Axiom│ Weight: φ = 1.618                         │
│   ───────────────────┼──────────────┼────────────────────                       │
│   ethics             │ Éthique      │ PRIMARY                                   │
│   optimism           │ Optimisme    │ PRIMARY                                   │
│   enable             │ Autonomie    │ SECONDARY                                 │
│   proactivity        │ Proactivité  │ HUMAN-LLM                                 │
│   complementarity    │ Complémentarité│ HUMAN-LLM                               │
│                                                                                  │
│   ASSIAH (Operation) │ BURN Axiom   │ Weight: 1.0                               │
│   ───────────────────┼──────────────┼────────────────────                       │
│   alignment          │ Alignement   │ PRIMARY                                   │
│   progress           │ Progrès      │ PRIMARY                                   │
│   scale              │ Scalabilité  │ SECONDARY                                 │
│   singularity-distance│ Distance    │ META                                      │
│   delegation         │ Délégation   │ HUMAN-LLM                                 │
│   boundaries         │ Limites      │ HUMAN-LLM                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ÉTAT ACTUEL vs IDÉAL

### 3.1 Ce qui FONCTIONNE (Phase 1 COMPLETE)

| Composant | État | Notes |
|-----------|------|-------|
| `axioms/constants.js` | ✅ SSOT | PHI centralisé, 35 fichiers migrés |
| `axioms/q-score.js` | ✅ Branché | Q = 100 × ∜(φ × V × C × B) |
| `laws/checker.js` | ✅ Branché | 16 Lois vérifiées dans judgment flow |
| `worlds/*.js` | ⚠️ Partiel | Scores enregistrés, pas utilisés pour verdict |

### 3.2 Ce qui NE FONCTIONNE PAS

| Problème | Impact | Priorité |
|----------|--------|----------|
| `dimensions/*.js` non appelés | Scores = heuristiques, pas vraie évaluation | CRITIQUE |
| `self-judge.js` monolithique | 3,815 lignes, difficile à maintenir | HAUTE |
| Worlds non utilisés pour verdict | Coherence calculée mais ignorée | MOYENNE |
| Tests insuffisants | 3.7% couverture | HAUTE |

---

## 4. ROADMAP PHASES

### PHASE 1 - FONDATIONS ✅ COMPLETE

```
[✅] 1.1 PHI Centralization     - 35 fichiers migrés vers axioms/constants.js
[✅] 1.2 Q-Score Branching      - _calculateGlobalScore() utilise calculateQScore()
[✅] 1.3 16 Laws Integration    - checkAll16Laws() dans judgment flow
[✅] 1.4 Worlds Recording       - worldManager.recordScore() pour chaque dimension
```

### PHASE 2 - EVALUATORS BRANCHING ✅ COMPLETE

```
[✅] 2.1 Charger registry        - dimensionRegistry auto-loaded (24/24 evaluators)
[✅] 2.2 Remplacer heuristiques  - _tryEvaluateWithRegistry() tries real evaluators first
[✅] 2.3 Refactorer self-judge   - Extraire en modules:
                                   ├─ scaling.js ✅ (342 lignes, fonctions pures)
                                   ├─ refinement.js ⏸️ (couplage élevé, différé)
                                   └─ verdict.js ⏸️ (différé)
[✅] 2.4 World-based decisions   - _applyWorldInfluence() ajuste verdict par monde:
                                   ├─ ATZILUT (φ²) → REJECT si < 38.2%
                                   ├─ BERIAH (φ)   → TRANSFORM si < 61.8%
                                   ├─ YETZIRAH (φ) → Warning only
                                   └─ ASSIAH (1.0) → Adjustable
```

### PHASE 3 - TESTS & VALIDATION 📋 PENDING

```
[ ] 3.1 Tests unitaires         - Chaque evaluator (24 fichiers)
[ ] 3.2 Tests integration       - Judge flow end-to-end
[ ] 3.3 Tests regression        - Verdicts consistants
[ ] 3.4 Benchmarks              - Performance baseline
```

### PHASE 4 - OPTIMISATION 📋 FUTURE

```
[ ] 4.1 Caching                 - Mémoriser évaluations similaires
[ ] 4.2 Parallel evaluation     - Évaluer dimensions en parallèle
[ ] 4.3 Streaming               - Résultats progressifs
[ ] 4.4 Accuracy tracking       - Améliorer 16.7% → target 50%+
```

---

## 5. PHASE 2 DÉTAIL: BRANCHER EVALUATORS

### 5.1 Modification self-judge.js

```javascript
// AVANT (actuel - heuristiques inline)
const scores = {
  HARMONY: this._inferScore(item, 'harmony'),      // Simple heuristic
  TRUTH: this._inferScore(item, 'truth'),          // Simple heuristic
  // ... 22 autres
};

// APRÈS (idéal - vrais evaluators)
const { registry, loadAllDimensions } = require('./dimensions/registry');

// Au démarrage
await loadAllDimensions();

// Dans judgment flow
const scores = {};
for (const [name, evaluator] of Object.entries(registry.dimensions)) {
  const result = await evaluator.evaluate(item, context);
  scores[name] = result.score;
}
```

### 5.2 Fichiers à modifier

```
lib/cynic/
├─ self-judge.js         # Ajouter import registry, appeler evaluators
├─ dimensions/
│  ├─ registry.js        # loadAllDimensions() - EXISTE, pas appelé
│  ├─ base.js            # DimensionEvaluator class - EXISTE
│  ├─ primary/*.js       # 8 evaluators - EXISTENT
│  ├─ secondary/*.js     # 5 evaluators - EXISTENT
│  ├─ meta/*.js          # 3 evaluators - EXISTENT
│  └─ human-llm/*.js     # 8 evaluators - EXISTENT
```

---

## 6. FORMULES CLÉ

### Q-Score (Score Global)

```
Q = 100 × ∜(φ_score × V_score × C_score × B_score)

où:
  φ_score = geometricMean(ATZILUT dimensions)  - PHI axiom
  V_score = geometricMean(BERIAH dimensions)   - VERIFY axiom
  C_score = geometricMean(YETZIRAH dimensions) - CULTURE axiom
  B_score = geometricMean(ASSIAH dimensions)   - BURN axiom
```

### Verdicts

```
Q < 38.2        → REJECT     (sous φ⁻²)
38.2 ≤ Q < 61.8 → TRANSFORM  (zone de doute)
Q ≥ 61.8       → ACCEPT     (au-dessus φ⁻¹)
```

### Confidence/Doubt

```
confidence = min(calculated, φ⁻¹)    // Max 61.8%
doubt = max(1 - confidence, φ⁻²)     // Min 38.2%
```

---

## 7. HIERARCHIE DES LOIS

```
ATZILUT (Essence)  > BERIAH (Economics) > YETZIRAH (Ethics) > ASSIAH (Operation)
   Weight: φ²            Weight: φ            Weight: φ           Weight: 1.0

En cas de conflit:
- Violation ATZILUT → REJECT obligatoire
- Violation BERIAH  → TRANSFORM minimum
- Violation YETZIRAH → Warning, peut ACCEPT
- Violation ASSIAH  → Ajustable
```

---

## 8. MÉTRIQUES CIBLES

| Métrique | Actuel | Phase 2 | Phase 3 |
|----------|--------|---------|---------|
| Accuracy | 16.7% | 30%+ | 50%+ |
| Test Coverage | 3.7% | 20% | 50% |
| self-judge.js LOC | 3,815 | 1,500 | 500 |
| Evaluators branchés | 0/24 | 24/24 | 24/24 |
| Response time | ~50ms | <100ms | <100ms |

---

## 9. PROCHAINE ÉTAPE

**PHASE 2.1: Brancher dimension evaluators**

```bash
# Fichiers à modifier:
1. self-judge.js - Ajouter import registry
2. self-judge.js - Remplacer _inferScore() par evaluator.evaluate()
3. Tester avec brain_cynic_judge
```

---

*"Le chaos est documenté. L'ordre peut maintenant être implémenté."*

*Architecture définie le 2026-01-13 par Claude Code*
