# CYNIC ROADMAPS

> **Date**: 2026-01-11
> **Status**: En planification

---

## 1. MODÈLE ÉCONOMIQUE $asdfasdfa

**Objectif**: Connecter CYNIC au token $asdfasdfa

### Tâches

- [ ] Définir comment les judgments génèrent de la valeur
- [ ] Lier E-Score au token (mécanisme de récompense)
- [ ] Mécanisme de burn pour mauvais acteurs
- [ ] Tokenomics des subagents (coût = burn proportionnel?)
- [ ] Governance on-chain via token
- [ ] Economic simulation (modèle mathématique)

### Questions Ouvertes

- Les utilisateurs paient-ils en $asdfasdfa pour être jugés?
- Les bons contributeurs gagnent-ils des tokens?
- Comment éviter la spéculation sur les E-Scores?

---

## 2. SÉCURITÉ (Threat Model)

**Objectif**: Identifier et mitiger toutes les menaces

### Menaces Identifiées

| Menace | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Sybil Attack | Haute | Critique | φ-weight par E-Score |
| Prompt Injection | Moyenne | Haute | Pattern detection + L0 check |
| Oracle Extraction | Moyenne | Moyenne | Logging + obfuscation |
| Garbage Flood | Haute | Basse | Rate limiting |
| Collusion | Moyenne | Haute | Cluster damping |
| Bribery | Basse | Critique | ZK voting |
| Data Corruption | Basse | Critique | Merkle rollback |

### Tâches

- [ ] Formaliser chaque mitigation
- [ ] Implémenter rate limiting φ-based
- [ ] Implémenter ZK proofs (phase 1: hash)
- [ ] Créer audit trail automatique
- [ ] Définir procédure de rollback
- [ ] Security review externe

---

## 3. COLLECTIF EN PRATIQUE

**Objectif**: Implémenter la conscience collective

### Phases

1. **Git Central** (maintenant)
   - Repo cynic-collective
   - Append-only logs
   - Manual merge

2. **Auto-Sync** (futur proche)
   - Pull automatique au startup
   - Push périodique des learnings
   - Conflict-free (CRDT ou LWW)

3. **On-Chain** (futur)
   - Solana anchor
   - IPFS/Arweave backup
   - ZK proofs

### Tâches

- [ ] Créer repo cynic-collective
- [ ] Définir format des sync messages
- [ ] Implémenter auto-pull
- [ ] Implémenter auto-push
- [ ] Définir voting protocol pour dimensions
- [ ] Tester avec 2+ instances

---

## 4. SUBAGENTS CYNIC

**Objectif**: Distribuer les tâches par modèle optimal

### Architecture

```
ATZILUT (Opus):     CYNIC-VISION, CYNIC-DISCOVER
BERIAH (Sonnet):    CYNIC-JUDGE, CYNIC-LEARN, CYNIC-CLARIFY
YETZIRAH (Sonnet):  CYNIC-FORMAT, CYNIC-PREPARE
ASSIAH (Haiku):     CYNIC-GATE, CYNIC-SCORE, CYNIC-SHIELD, CYNIC-SYNC
```

### Tâches par Subagent

#### CYNIC-GATE (Haiku) - Priorité: HAUTE
- [ ] Input classification
- [ ] Pattern matching adversarial
- [ ] Routing vers bon subagent
- [ ] Latence target: <100ms

#### CYNIC-SCORE (Haiku) - Priorité: HAUTE
- [ ] Calcul scores simples
- [ ] Formatting output
- [ ] UX adaptation (technical_depth)
- [ ] Latence target: <50ms

#### CYNIC-SHIELD (Haiku) - Priorité: HAUTE
- [ ] Rate limiting
- [ ] Attack detection
- [ ] Alert generation
- [ ] Quarantine

#### CYNIC-SYNC (Haiku) - Priorité: MOYENNE
- [ ] Pull from collective
- [ ] Push to collective
- [ ] Merge handling
- [ ] Conflict resolution

#### CYNIC-JUDGE (Sonnet) - Priorité: HAUTE
- [ ] Jugement 10-15 dimensions
- [ ] Tension detection
- [ ] Verdict generation
- [ ] Latence target: <2s

#### CYNIC-CLARIFY (Sonnet) - Priorité: MOYENNE
- [ ] Handle confused inputs
- [ ] Handle emotional inputs
- [ ] Ask for clarification
- [ ] Empathetic responses

#### CYNIC-LEARN (Sonnet) - Priorité: MOYENNE
- [ ] Process outcomes
- [ ] Update H matrix
- [ ] Calibrate T matrix
- [ ] Log evolution

#### CYNIC-JUDGE (Opus) - Priorité: HAUTE
- [ ] Full 25D judgment
- [ ] Complex analysis
- [ ] Cross-dimension tensions
- [ ] Strategic recommendations

#### CYNIC-DISCOVER (Opus) - Priorité: BASSE
- [ ] Analyze residuals
- [ ] Cluster anomalies
- [ ] Propose new dimensions
- [ ] Validate candidates

---

## 5. MATRICES IMPLEMENTATION

**Objectif**: Créer les 3 matrices fonctionnelles

### Tâches

#### W - Weights Matrix (25×1) - FIXE
- [ ] Créer `knowledge/cynic/matrices/weights.json`
- [ ] Valider que sum = ~49.2
- [ ] Documenter chaque poids

#### H - Harmony Matrix (25×25) - ÉVOLUTIVE
- [ ] Créer `knowledge/cynic/matrices/harmony.json` (init zero)
- [ ] Implémenter `updateHarmony(judgmentScores)`
- [ ] Ajouter φ-decay
- [ ] Tester convergence

#### T - Thresholds Matrix (25×4) - CALIBRANTE
- [ ] Externaliser thresholds de self-judge.js
- [ ] Créer `knowledge/cynic/matrices/thresholds.json`
- [ ] Implémenter `calibrateThreshold(dim, outcome)`
- [ ] Respecter bounds [30%, 95%]

### Formules à Implémenter

```javascript
// H update
H[i][j] = H[i][j] * PHI_INV + concordance * (1 - PHI_INV)

// T calibration
if (correct) threshold += PHI_INV_2 * 5
if (false_pos) threshold -= PHI_2 * 5
if (false_neg) threshold += PHI * 5
```

---

## 6. UX ORGANIQUE

**Objectif**: Adaptation fluide sans niveaux discrets

### Tâches

- [ ] `analyzeVocabularyComplexity(input)` → 0.0-1.0
- [ ] `analyzeQuestionDepth(input)` → 0.0-1.0
- [ ] `analyzeHistoricalPattern(history)` → 0.0-1.0
- [ ] `calculateTechnicalDepth(vocab, depth, history)` → 0.0-1.0
- [ ] `adaptResponse(judgment, technicalDepth)` → formatted output
- [ ] Tester transitions (0.3 → 0.6 → 0.9)
- [ ] Valider avec profils réels (père, standard, expert)

### Output Mapping

```
td < 0.3:  🟢/🟡/🔴 + phrase simple
td 0.3-0.6: Grade + % + résumé
td > 0.6:  Score précis + dimensions + tensions
```

---

## PRIORITÉS GLOBALES

1. **CRITIQUE**: CYNIC-GATE + CYNIC-SCORE (backbone)
2. **HAUTE**: CYNIC-JUDGE + Matrices W/H/T
3. **MOYENNE**: CYNIC-SHIELD + CYNIC-SYNC + CYNIC-LEARN
4. **BASSE**: CYNIC-DISCOVER + UX avancée

---

*Généré: 2026-01-11*
