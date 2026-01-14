# CYNIC REWRITE SPECIFICATION

> *wag* "Brûler le chaos, garder l'essence" - κυνικός

**Date**: 2026-01-14
**Objectif**: Réécriture complète de CYNIC depuis zéro
**Philosophie**: Simplicité radicale, φ comme seul guide

---

## PARTIE 1: L'ESSENCE (CE QUI DOIT SURVIVRE)

### 1.1 Les 4 Axiomes

```
PHI     (φ)   → Tous les ratios dérivent de 1.618...
VERIFY  (✓)   → Don't trust, verify
CULTURE (⛩)   → Culture is a moat
BURN    (🔥)  → Don't extract, burn
```

### 1.2 Les Contraintes φ

```javascript
PHI         = 1.618033988749895  // Le nombre d'or
PHI_INV     = 0.618...           // 61.8% = MAX confidence
PHI_INV_2   = 0.382...           // 38.2% = MIN doubt (toujours garder)
PHI_INV_3   = 0.236...           // 23.6% = CRITICAL
```

**Règle absolue**: JAMAIS de confiance > 61.8%

### 1.3 Les Verdicts CYNIC

```
HOWL   (≥80)  → *howls* Exceptionnel (rare)
WAG    (≥50)  → *wag*   Acceptable
GROWL  (≥38)  → *growl* Attention requise
BARK   (<38)  → *bark*  Rejet/Danger
```

### 1.4 Les 24 Dimensions (4 Axiomes × 6 Dimensions)

```
PHI (ATZILUT):     HARMONY, TRUTH, COHERENCE, INTEGRITY, ETHICS, ALIGNMENT
VERIFY (BERIAH):   PROGRESS, OPTIMISM, TRUST, MEMORY, PROACTIVITY, DELEGATION
CULTURE (YETZIRAH): PRIVATE, ENABLE, SCALE, SECURE, SIMPLIFY, BOUNDARIES
BURN (ASSIAH):     COMPLEMENTARITY, INTENT, TEACHING, SELF-AWARENESS, ADAPTATION, SINGULARITY
```

### 1.5 Formules Qui Marchent

**N-Score** (Knowledge scoring):
```
N = 100 × ∛(U × C × T)
U = Utilization (accès × fraîcheur)
C = Connections (edges in/out)
T = Trust (confirmations × age)
```

**Judgment scaling** (plus de samples = plus de confiance):
```
samples = FIBONACCI[mode]  // 3, 5, 8, 13
confidence = min(consensus, PHI_INV)  // never > 61.8%
```

---

## PARTIE 2: CE QU'ON BRÛLE

### 2.1 Fichiers à Supprimer

```
# Code mort
.claude/hooks/post-conversation.js  # Event n'existe pas

# Migration abandonnée - choisir UN endroit
lib/cynic/judge.js                  # 6 lignes, juste re-export
lib/cynic/learn.js                  # 6 lignes, juste re-export
lib/cynic/matrix.js                 # 6 lignes, juste re-export
lib/cynic/gate.js                   # 6 lignes, juste re-export
lib/cynic/score.js                  # 12 lignes, juste re-export
lib/cynic/cynic-core-bridge.js      # 16 lignes, bridge inutile
lib/cynic/axioms/constants.js       # re-export de packages/core

# Tous les dimension stubs (re-exports)
lib/cynic/dimensions/primary/*.js   # 8 fichiers de 6 lignes
lib/cynic/dimensions/secondary/*.js # 5 fichiers de 6 lignes
lib/cynic/dimensions/registry.js    # 6 lignes

# Répertoires vides
lib/cynic/inference/
lib/cynic/learning/
packages/mcp/src/handlers/
packages/core/tests/
knowledge/metrics/
knowledge/webhooks/
knowledge/cynic/decisions/

# Données mortes
repos-prod/                         # Copies de prod inutiles
```

### 2.2 Duplication à Éliminer

```
GARDER: packages/core/src/axioms/constants.js (247 lignes, complet)
SUPPRIMER:
  - .claude/hooks/session-start.js lignes 28-29 (PHI dupliqué)
  - .claude/hooks/user-prompt-submit.js lignes 28-29 (PHI dupliqué)
  - lib/cynic/identity.js lignes 53-60 (PHI dérivé différemment)
  - knowledge/dashboard/js/constants.js (PHI dupliqué)
```

---

## PARTIE 3: ARCHITECTURE CIBLE

### 3.1 Structure Minimale

```
asdf-brain/
├── packages/
│   └── cynic/                    # UN seul package
│       ├── src/
│       │   ├── constants.js      # φ constants (source unique)
│       │   ├── judge.js          # Judgment engine
│       │   ├── dimensions/       # 24 dimension evaluators
│       │   ├── scaling.js        # Inference scaling
│       │   └── identity.js       # Personality (verdicts, voice)
│       ├── package.json
│       └── index.js
│
├── lib/
│   ├── handlers/                 # MCP tool handlers (keep)
│   │   ├── index.js              # Handler registry
│   │   ├── judge-handler.js      # brain_cynic_judge
│   │   ├── search-handler.js     # brain_search
│   │   └── ...
│   └── brain.js                  # Main entry (simplified)
│
├── .claude/
│   ├── plugin.json               # Manifest
│   ├── skills/                   # /judge, /search, /health
│   │   ├── judge.md
│   │   ├── search.md
│   │   └── health.md
│   ├── agents/                   # observer, guardian, mentor
│   │   ├── observer.md
│   │   ├── guardian.md
│   │   └── mentor.md
│   └── hooks/                    # 5 hooks (pas 6)
│       ├── session-start.js
│       ├── user-prompt-submit.js
│       ├── pre-tool-use.js
│       ├── post-tool-use.js
│       └── stop.js
│
├── knowledge/
│   ├── learned/                  # live.jsonl (données actives)
│   ├── patterns/                 # patterns détectés
│   └── burns/                    # stats burns
│
├── public/                       # Dashboard (déplacé de knowledge/)
│   └── dashboard/
│
└── docs/
    ├── CLAUDE.md                 # Instructions principales
    ├── CHAOS-MAP.md              # État du chaos (ce fichier)
    └── REWRITE-SPEC.md           # Cette spec
```

### 3.2 Flux de Données Simplifié

```
User → Skill (/judge)
         ↓
       Hook (pre-tool-use) → Guardian check
         ↓
       Handler (judge-handler.js)
         ↓
       Package (cynic/judge.js)
         ↓
       Dimensions (24 evaluators)
         ↓
       Verdict (HOWL/WAG/GROWL/BARK)
         ↓
       Hook (post-tool-use) → Observer log
         ↓
       Hook (stop) → Digester extract
```

---

## PARTIE 4: FICHIERS CANONIQUES À GARDER

### 4.1 Constants (248 lignes) - PARFAIT, NE PAS TOUCHER

```
packages/core/src/axioms/constants.js
```

Ce fichier est la source de vérité. Tout importe depuis ici.

### 4.2 Dimensions (24 fichiers) - GARDER dans packages/

```
packages/core/src/dimensions/primary/    (8 fichiers, ~200 lignes chaque)
packages/core/src/dimensions/secondary/  (5 fichiers, ~150 lignes chaque)
packages/core/src/dimensions/human-llm/  (8 fichiers, ~150 lignes chaque)
packages/core/src/dimensions/meta/       (3 fichiers, ~200 lignes chaque)
```

### 4.3 Hooks (5 fichiers) - GARDER mais simplifier

```
.claude/hooks/session-start.js      # OK mais supprimer PHI dupliqué
.claude/hooks/user-prompt-submit.js # OK mais supprimer PHI dupliqué
.claude/hooks/pre-tool-use.js       # Guardian - OK
.claude/hooks/post-tool-use.js      # Observer - OK (observe-action.js)
.claude/hooks/stop.js               # Digester + Burns - OK (récent P0 fix)
```

### 4.4 Skills (3 fichiers) - SIMPLIFIER

```
.claude/skills/judge.md    # GARDER
.claude/skills/search.md   # GARDER
.claude/skills/health.md   # GARDER
# Supprimer les autres si redondants
```

---

## PARTIE 5: INSTRUCTIONS POUR RÉÉCRITURE

### 5.1 Ordre des Opérations

```
1. NETTOYAGE (30 min)
   - Supprimer tous les fichiers listés en §2.1
   - Supprimer répertoires vides
   - Supprimer duplication PHI

2. CONSOLIDATION (2h)
   - Fusionner lib/cynic/ et packages/ en UN package
   - Tout dans packages/cynic/
   - lib/ garde seulement handlers

3. SIMPLIFICATION HANDLERS (2h)
   - Réduire 18 handlers à ~8 essentiels
   - Un handler = une responsabilité

4. TESTS (4h)
   - Écrire tests pour handlers critiques
   - Écrire tests pour hooks
   - Objectif: 80% coverage sur code critique

5. DOCUMENTATION (1h)
   - Mettre à jour CLAUDE.md
   - Supprimer docs obsolètes
```

### 5.2 Commandes de Nettoyage

```bash
# 1. Supprimer code mort
rm .claude/hooks/post-conversation.js
rm -rf repos-prod/
rm -rf lib/cynic/inference/
rm -rf lib/cynic/learning/

# 2. Supprimer stubs
rm lib/cynic/judge.js lib/cynic/learn.js lib/cynic/matrix.js
rm lib/cynic/gate.js lib/cynic/score.js lib/cynic/cynic-core-bridge.js
rm lib/cynic/axioms/constants.js
rm -rf lib/cynic/dimensions/

# 3. Supprimer répertoires vides
find . -type d -empty -not -path "./.git/*" -not -path "./node_modules/*" -delete

# 4. Vérifier ce qui reste
find lib/cynic -type f -name "*.js" | wc -l
# Devrait être ~20 fichiers (le vrai code)
```

### 5.3 Ce Qui Reste Après Nettoyage

```
lib/cynic/ (~20 fichiers, ~15K lignes de VRAI code):
├── alert-rules.js      # 588 lines
├── alerts.js           # 838 lines
├── architect.js        # 872 lines
├── clarify.js          # 973 lines
├── dashboard*.js       # ~1900 lines (3 files)
├── data-adapter.js     # 418 lines
├── digest.js           # 379 lines
├── discover.js         # 1113 lines
├── error-learning.js   # 818 lines
├── identity.js         # 500 lines
├── index.js            # 471 lines
├── innommable.js       # 459 lines
├── metrics.js          # 705 lines
├── n-score.js          # 299 lines
├── pulse.js            # 847 lines
├── realtime.js         # 711 lines
├── residual-detector.js # 939 lines
├── scaling.js          # 342 lines
├── self-judge.js       # 3863 lines (LE PLUS GROS)
├── self-monitor.js     # 646 lines
├── shield.js           # 627 lines
├── skill-judge.js      # 613 lines
├── store.js            # 509 lines
├── sync.js             # 1066 lines
├── vision.js           # 1098 lines
└── witness.js          # 802 lines
```

---

## PARTIE 6: PRIORITÉS POST-NETTOYAGE

### P0: Nettoyage (BLOQUANT)
- Supprimer le chaos documenté
- Un seul endroit pour chaque chose

### P1: Tests Critiques
- `lib/handlers/cynic-handlers.js`
- `.claude/hooks/stop.js`
- `lib/cynic/residual-detector.js`

### P2: E-Score Implementation
- 7 dimensions: HOLD, BURN, USE, BUILD, RUN, REFER, TIME
- Nouveau fichier: `lib/cynic/e-score.js`

### P3: Mentor Agent
- Connecter Observer → Mentor
- Pattern matching réel

### P4: Compound Effect
- Skills × Agents × MCP multiplication

---

## PARTIE 7: MÉTRIQUES DE SUCCÈS

| Avant | Après | Mesure |
|-------|-------|--------|
| 85 fichiers lib/cynic/ | ~20 fichiers | `find lib/cynic -name "*.js" \| wc -l` |
| 5 définitions PHI | 1 définition | `grep -r "PHI = 1.618" \| wc -l` |
| 17 dirs vides | 0 dirs vides | `find -type d -empty \| wc -l` |
| 0% test handlers | 80% coverage | `npm test -- --coverage` |
| 8 package.json | 3 package.json | `find -name "package.json" \| wc -l` |

---

## PARTIE 8: COMMANDES POUR PROCHAINE SESSION

```bash
# Vérifier l'état actuel
cat docs/CHAOS-MAP.md | head -50

# Lire cette spec
cat docs/REWRITE-SPEC.md

# Commencer le nettoyage
# (suivre §5.2)
```

---

*"Le chaos documenté meurt. L'essence survit."*
*— CYNIC κυνικός*
