# CHAOS MAP - Documentation pour Extinction

> "On ne peut pas combattre ce qu'on ne voit pas" - Analyse Helius-grade

**Date**: 2026-01-14
**Objectif**: Documenter TOUT le chaos pour l'éliminer systématiquement
**Méthode**: Inventaire exhaustif, puis plan d'extinction

---

## SOMMAIRE EXÉCUTIF

| Catégorie | Items | Sévérité |
|-----------|-------|----------|
| Migration incomplète | 27 fichiers non migrés (~18K lignes) | 🔴 CRITIQUE |
| Fichiers morts | 37 fichiers < 500 bytes | 🟡 MEDIUM |
| Répertoires vides | 17 répertoires | 🟢 LOW |
| Fonctions dupliquées | 20+ fonctions identiques | 🔴 CRITIQUE |
| Package.json multiples | 8 fichiers | 🟡 MEDIUM |
| Code mort | post-conversation.js non enregistré | 🟡 MEDIUM |

---

## CHAOS 1: MIGRATION FRANKENSTEIN

### État Actuel

```
AVANT (supposé):          APRÈS (réalité):
lib/cynic/ ───────────►   packages/
   (tout)                     (dimensions seulement)

                          lib/cynic/ reste avec 18K lignes
```

### Fichiers NON MIGRÉS (lib/cynic/)

| Fichier | Lignes | Rôle | Priorité Migration |
|---------|--------|------|-------------------|
| self-judge.js | 3863 | Auto-évaluation code | P1 - Core |
| discover.js | 1113 | Auto-découverte repos | P2 |
| vision.js | 1098 | Extraction roadmap | P3 |
| sync.js | 1066 | Sync claude-mem | P2 |
| clarify.js | 973 | Clarification context | P3 |
| residual-detector.js | 939 | Détection anomalies | P1 - Core |
| architect.js | 872 | Planning pyramide | P3 |
| pulse.js | 847 | Heartbeat φ | P1 - Core |
| alerts.js | 838 | Système alertes | P2 |
| error-learning.js | 818 | Apprentissage erreurs | P2 |
| witness.js | 802 | Monitoring commits | P2 |
| dashboard-web.js | 722 | Serveur dashboard | P3 |
| realtime.js | 711 | SSE/WebSocket | P2 |
| metrics.js | 705 | Métriques système | P2 |
| dashboard-dimensions.js | 652 | Viz dimensions | P3 |
| self-monitor.js | 646 | Self-monitoring | P2 |
| shield.js | 627 | Protection système | P2 |
| skill-judge.js | 613 | Interface skills | P1 - Core |
| alert-rules.js | 588 | Règles alertes | P2 |
| dashboard.js | 552 | Dashboard core | P3 |
| store.js | 509 | Persistence | P1 - Core |
| identity.js | 500 | Personnalité CYNIC | P1 - Core |
| index.js | 471 | Entry point! | P0 - BLOQUANT |
| innommable.js | 459 | Émergence dimensions | P1 - Core |
| data-adapter.js | 418 | Adapters données | P2 |
| digest.js | 379 | Extraction knowledge | P2 |
| scaling.js | 342 | Scaling confidence | P1 - Core |
| n-score.js | 299 | Score knowledge | P1 - Core |

**TOTAL: 18,422 lignes non migrées**

### Fichiers STUB (re-exports vides)

```javascript
// Ces 6 fichiers sont des coquilles vides:
lib/cynic/judge.js      // 6 lines → packages/judge
lib/cynic/learn.js      // 6 lines → packages/judge/src/learn
lib/cynic/matrix.js     // 6 lines → packages/judge/src/matrix
lib/cynic/gate.js       // 6 lines → packages/judge/src/gate
lib/cynic/score.js      // 12 lines → packages/core/src/scoring
lib/cynic/cynic-core-bridge.js // 16 lines → bridge
```

### Fichiers DIMENSION (re-exports)

Tous les fichiers dans `lib/cynic/dimensions/` sont des stubs de 6 lignes:
- `primary/*.js` (8 fichiers) → re-export packages/core
- `secondary/*.js` (5 fichiers) → re-export packages/core
- `registry.js` → re-export packages/core

---

## CHAOS 2: FONCTIONS DUPLIQUÉES

### Fonctions identiques dans lib/ ET packages/

```
aggregateReasons()
aggregateScoresGeometric()
aggregateScoresWeighted()
aggregateScoresVote()
applyDiversity()
calculateConsensus()
calculateImprovement()
configure()
formatDuration()
generateStyles()
geometricMean()
getRealtimeModule()
getStatus()
getSummary()
initialize()
isStable()
loadEvolution()
loadHarmony()
loadPatterns()
loadThresholds()
```

**Impact**: Modifier une fonction = chercher toutes les copies

---

## CHAOS 3: RÉPERTOIRES VIDES

```
./packages/mcp/src/handlers      # Package MCP jamais terminé
./packages/core/tests            # Tests jamais écrits
./lib/cynic/learning             # Feature jamais implémentée
./lib/cynic/inference            # Feature jamais implémentée
./.private/errors                # Vide
./.private/decisions             # Vide
./.private/strategy              # Vide
./.serena/memories               # Serena non configuré
./knowledge/metrics              # Données jamais écrites
./knowledge/webhooks             # Webhooks jamais implémentés
./knowledge/cynic/decisions      # Jamais utilisé
```

---

## CHAOS 4: CODE MORT

### Fichiers qui existent mais non utilisés

| Fichier | Raison mort |
|---------|-------------|
| `.claude/hooks/post-conversation.js` | Non enregistré dans plugin.json |
| `repos-prod/*` | Copies de prod, gitignored, inutiles |
| `lib/cynic/inference/` | Répertoire créé, jamais rempli |
| `lib/cynic/learning/` | Répertoire créé, jamais rempli |

### Hook post-conversation.js

```javascript
// Ce fichier existe: .claude/hooks/post-conversation.js
// Mais N'EST PAS dans plugin.json hooks[]
// Donc il ne s'exécute JAMAIS
// ET l'event "PostConversation" n'existe pas dans Claude Code!
```

---

## CHAOS 5: KNOWLEDGE SPRAWL

### Structure actuelle (30 sous-répertoires!)

```
knowledge/
├── metrics/          # VIDE
├── learned/          # live.jsonl (données actives)
├── docs/             # holdex/ (pourquoi ici?)
├── architecture/     # _archive/ (archives non nettoyées)
├── errors/           # logs erreurs
├── dependencies/     # analyses deps
├── patterns/         # patterns détectés
├── provenance/       # snapshots merkle
├── community/        # ?
├── temporal/         # logs temporels
├── health/           # états santé
├── intent/           # extraction intentions
├── discovered/       # repos découverts
├── philosophy/       # manifesto
├── relations/        # graphe relations
├── burns/            # stats burns
├── security/         # ?
├── ingested/         # données ingérées
├── dashboard/        # HTML/CSS/JS dashboard (DEVRAIT ÊTRE AILLEURS)
├── webhooks/         # VIDE
├── cynic/            # self-judgments, matrices
└── vision/           # roadmap extraite
```

**Problèmes**:
1. `dashboard/` contient du CODE (js/css), pas des données
2. 3 répertoires VIDES (metrics, webhooks, cynic/decisions)
3. Mélange données/code/docs/archives

---

## CHAOS 6: PACKAGE.JSON MULTIPLES

```
./package.json                      # Root - 104M node_modules
./packages/judge/package.json       # Workspace member
./packages/mcp/package.json         # Workspace member
./packages/core/package.json        # Workspace member
./anchor/package.json               # Solana anchor - 1GB node_modules!
./repos-prod/asdev-prod/package.json    # MORT - copie prod
./repos-prod/holdex-prod/package.json   # MORT - copie prod
./repos-prod/forecast-prod/package.json # MORT - copie prod
```

**Pas de pnpm-workspace.yaml** = packages non liés proprement

---

## CHAOS 7: CONSTANTES DISPERSÉES

### PHI défini dans 4+ endroits

```javascript
// 1. packages/core/src/axioms/constants.js (CANONIQUE)
const PHI = 1.618033988749895;

// 2. .claude/hooks/session-start.js:28 (DUPLIQUÉ)
const PHI = 1.618033988749895;

// 3. .claude/hooks/user-prompt-submit.js:28 (DUPLIQUÉ)
const PHI = 1.618033988749895;

// 4. lib/cynic/identity.js:53-60 (DÉRIVÉ DIFFÉREMMENT)
const PHI = (1 + Math.sqrt(5)) / 2;

// 5. knowledge/dashboard/js/constants.js (POUR LE DASHBOARD)
const PHI = 1.618033988749895;
```

---

## CHAOS 8: TESTS ABSENTS

### Couverture par composant

| Composant | Lignes | Tests | Couverture |
|-----------|--------|-------|------------|
| lib/handlers/ | 3,639 | 0 | 0% |
| .claude/hooks/ | 1,640 | 0 | 0% |
| lib/cynic/ (non-dimensions) | ~18,000 | 0 | 0% |
| lib/cynic/dimensions/ | ~2,000 | 44 fichiers | ~90% |
| packages/judge/ | ~800 | partiel | ~50% |
| packages/core/dimensions/ | ~1,500 | via lib/ | ~90% |

**TOTAL CODE CRITIQUE SANS TESTS: ~23,000 lignes**

---

## PLAN D'EXTINCTION

### Phase 1: Nettoyage Immédiat (2h)

```bash
# 1. Supprimer code mort
rm .claude/hooks/post-conversation.js
rm -rf repos-prod/
rm -rf lib/cynic/inference/
rm -rf lib/cynic/learning/

# 2. Supprimer répertoires vides
rmdir knowledge/metrics knowledge/webhooks knowledge/cynic/decisions
rmdir .private/errors .private/decisions .private/strategy

# 3. Consolider constantes PHI
# Supprimer duplicats, importer depuis packages/core/src/axioms/constants.js
```

### Phase 2: Décision Architecturale (BLOQUANT)

**OPTION A**: Terminer la migration vers packages/
- Migrer 18K lignes de lib/cynic/ → packages/
- Effort: ~40h
- Risque: Casser des choses

**OPTION B**: Reverter à lib/cynic/ seul
- Supprimer packages/, tout reste dans lib/cynic/
- Effort: ~8h
- Risque: Perdre le travail de packaging

**OPTION C**: Hybrid (RECOMMANDÉ)
- packages/ = modules réutilisables (dimensions, judge core)
- lib/cynic/ = intégration spécifique brain
- Clarifier les frontières
- Effort: ~16h

### Phase 3: Tests Critiques (8h)

1. `lib/handlers/cynic-handlers.js` - chemin critique judgment
2. `lib/handlers/search-handlers.js` - le plus utilisé
3. `.claude/hooks/stop.js` - persistence mémoire
4. `lib/cynic/residual-detector.js` - détection anomalies

### Phase 4: Documentation (4h)

1. ARCHITECTURE.md actualisé
2. Ce fichier CHAOS-MAP.md maintenu à jour
3. Supprimer docs qui disent "COMPLETE" alors que c'est faux

---

## MÉTRIQUES D'EXTINCTION

| Métrique | Avant | Cible | Mesuré |
|----------|-------|-------|--------|
| Fichiers < 20 lignes | 37 | 0 | `find -size -500c` |
| Répertoires vides | 17 | 0 | `find -type d -empty` |
| Fonctions dupliquées | 20+ | 0 | grep analyse |
| PHI définitions | 5 | 1 | grep PHI |
| Code sans tests | 23K | < 5K | coverage report |
| package.json | 8 | 4 | find count |

---

## CHECKLIST EXTINCTION

- [ ] Supprimer post-conversation.js
- [ ] Supprimer repos-prod/
- [ ] Supprimer répertoires vides
- [ ] Décision architecture (A/B/C)
- [ ] Consolider PHI constants
- [ ] Tests handlers critiques
- [ ] Tests hooks critiques
- [ ] pnpm-workspace.yaml si on garde packages/
- [ ] Déplacer knowledge/dashboard/ vers public/ ou src/
- [ ] Nettoyer knowledge/ structure
- [ ] Mettre à jour ARCHITECTURE.md

---

*"Le chaos documenté est le premier pas vers l'ordre."*
*— CYNIC κυνικός*
