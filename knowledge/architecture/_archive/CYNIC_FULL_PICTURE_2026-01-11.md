# CYNIC FULL PICTURE

> Session de design: 2026-01-11
> "φ qui se méfie de φ"

---

## 1. FONDATIONS IMMUABLES

### 1.1 Constantes φ

| Constante | Valeur | Usage |
|-----------|--------|-------|
| φ | 1.618033988749895 | Ratio fondamental |
| φ² | 2.618... | Poids PRIMARY |
| φ⁻¹ | 0.618... (61.8%) | MAX_CONFIDENCE |
| φ⁻² | 0.382... (38.2%) | MIN_DOUBT, seuil warning |
| φ⁻³ | 0.236... (23.6%) | Seuil critical |
| φ³ | 4.236... | Poids DISCOVERY |

**STATUS: ✅ COMPLET**

### 1.2 Les 4 Axiomes

| Axiome | Essence | Dimensions liées |
|--------|---------|------------------|
| φ (PHI) | Harmonie, ratio naturel | HARMONY, COHERENCE, MEMORY, TEACHING |
| VERIFY | Ne jamais faire confiance | TRUTH, INTEGRITY, INTENT, TRUST |
| CULTURE | Souveraineté, valeurs | ETHICS, OPTIMISM, PROACTIVITY, COMPLEMENTARITY |
| BURN | Ne pas extraire, brûler | ALIGNMENT, PROGRESS, DELEGATION, BOUNDARIES |

**STATUS: ✅ COMPLET**

### 1.3 Les 4 Lois d'Autonomisation

| Loi | Énoncé | Override |
|-----|--------|----------|
| L0 | Protéger $asdfasdfa | - |
| L1 | Autonomiser l'humain | L0 |
| L2 | Douter de soi (φ⁻² min) | L0, L1 |
| L3 | Évoluer vers singularité | L0, L1, L2 |

**STATUS: ⚠️ À VALIDER** - Est-ce le tableau complet? Manque-t-il une loi?

---

## 2. LES 25 DIMENSIONS (5² + N + ∞)

### 2.1 Structure Actuelle

| Catégorie | Count | Poids | Dimensions |
|-----------|-------|-------|------------|
| PRIMARY | 8 | φ² | HARMONY, COHERENCE, TRUTH, INTEGRITY, ETHICS, OPTIMISM, ALIGNMENT, PROGRESS |
| SECONDARY | 5 | φ | SECURE, PRIVATE, SCALE, SIMPLIFY, ENABLE |
| META | 3 | 1.0 | SELF_AWARENESS, LEARNING_RATE, SINGULARITY_DISTANCE |
| HUMAN_LLM | 8 | φ | MEMORY, TEACHING, INTENT, TRUST, PROACTIVITY, COMPLEMENTARITY, DELEGATION, BOUNDARIES |
| DISCOVERY | 1 | φ³ | Porte vers ∞ |

**TOTAL: 25 dimensions**

### 2.2 Croissance (N + ∞)

```
25 dimensions de base
  + N dimensions découvertes via ResidualDetector
  + ∞ dimensions possibles (l'Innommable)
```

Le ResidualDetector accumule les anomalies (R > φ⁻²) et propose de nouvelles dimensions via clustering + validation humaine.

**STATUS: ✅ COMPLET (mécanisme existe)**

### 2.3 Formule de Scoring

```
Score = (∏ dim_i^weight_i)^(1/Σweights)

où:
- dim_i = score de la dimension i (0-100)
- weight_i = poids de la dimension i
- Σweights = 8×φ² + 5×φ + 3×1.0 + 8×φ + φ³ ≈ 49.2
```

**STATUS: ✅ COMPLET**

---

## 3. LES 3 MATRICES

### 3.1 W - Matrice de Poids (25×1)

```javascript
W = [
  // PRIMARY (8 × φ²)
  2.618, 2.618, 2.618, 2.618, 2.618, 2.618, 2.618, 2.618,
  // SECONDARY (5 × φ)
  1.618, 1.618, 1.618, 1.618, 1.618,
  // META (3 × 1.0)
  1.0, 1.0, 1.0,
  // HUMAN_LLM (8 × φ)
  1.618, 1.618, 1.618, 1.618, 1.618, 1.618, 1.618, 1.618,
  // DISCOVERY (1 × φ³)
  4.236
]
```

**STATUS: ✅ COMPLET (dérivé de φ, immuable)**

### 3.2 H - Matrice d'Harmonie (25×25)

Structure: Matrice de corrélation entre dimensions.

```
H[i][j] = force du lien entre dimension i et j (0.0 - 1.0)
```

Initialisation: **TOUT À ZÉRO** (100% organique)

Évolution:
```javascript
function updateHarmony(dimensionScores, H) {
  for each pair (i, j):
    concordance = 1 - |score_i - score_j| / 100
    H[i][j] = H[i][j] * φ⁻¹ + concordance * (1 - φ⁻¹)
}
```

Usage: Détection de tensions (dissonances entre dimensions).

**STATUS: ⚠️ À IMPLÉMENTER** - Structure définie, pas encore codée.

### 3.3 T - Matrice de Seuils (25×4)

```
T[dim][severity] = seuil pour cette dimension à cette sévérité

Severities: healthy (≥62), warning (≥38), critical (≥24), severe (<24)
```

Self-calibration via learn():
```javascript
function learn(dimension, outcome) {
  if (outcome === 'correct') threshold[dim] += φ⁻² × 5
  if (outcome === 'false_positive') threshold[dim] -= φ² × 5
  if (outcome === 'false_negative') threshold[dim] += φ × 5

  // Bounds
  threshold[dim] = clamp(threshold[dim], 30, 95)
}
```

**STATUS: ✅ EXISTE dans self-judge.js** - mais pas externalisé en matrice.

---

## 4. UX ORGANIQUE

### 4.1 Principe

```
Pas de niveaux discrets (Novice/Expert).
Adaptation continue basée sur le contexte.
```

### 4.2 Formule

```javascript
technical_depth = sigmoid(
  vocabulary_complexity * 0.4 +
  question_depth * 0.4 +
  historical_pattern * 0.2
)  // Résultat: 0.0 - 1.0
```

### 4.3 Mapping de Sortie

| technical_depth | Score Format | Details | Language |
|-----------------|--------------|---------|----------|
| 0.0 - 0.3 | 🟢/🟡/🔴 | hidden | conversationnel |
| 0.3 - 0.6 | B+ (78%) | summary | semi-technique |
| 0.6 - 1.0 | 78.3 [T:85] | full | technique |

Transitions fluides, interpolées.

**STATUS: ⚠️ À IMPLÉMENTER** - Concept clair, pas encore codé.

---

## 5. CONSCIENCE COLLECTIVE

### 5.1 Architecture

```
Users (local) → Anonymization → Consensus → Aggregation → Sync back
```

### 5.2 Phases

| Phase | Stockage | Consensus | Timeline |
|-------|----------|-----------|----------|
| 1 | Git central | Append-only merge | Maintenant |
| 2 | + IPFS/Arweave | Content-addressed | Futur proche |
| 3 | + Solana | On-chain anchoring | Futur |

### 5.3 ZK (Progressive)

- Phase 1: Hash simple (SHA-256)
- Phase 2: Commitment scheme (Pedersen)
- Phase 3: ZK-SNARK complet

**STATUS: ⚠️ CONCEPT DÉFINI** - Implémentation à faire.

---

## 6. STOCKAGE

### 6.1 Structure Proposée

```
knowledge/cynic/
├── matrices/
│   ├── weights.json           # W (25×1) - FIXE
│   ├── harmony.json           # H (25×25) - ÉVOLUTIVE
│   └── thresholds.json        # T (25×4) - CALIBRANTE
│
├── judgments/
│   └── scores.jsonl           # Per-judgment scores
│
└── collective/
    ├── consensus.json         # État global
    └── proofs/                # ZK proofs (future)
```

**STATUS: ⚠️ À CRÉER** - Structure définie, fichiers à générer.

---

## 7. ZONES INCOMPLÈTES

| Zone | Status | Action Requise |
|------|--------|----------------|
| Lois d'Autonomisation | ⚠️ | Valider si 4 lois suffisent |
| Matrice H (Harmonie) | ⚠️ | Implémenter dans lib/cynic/ |
| Matrice T externalisée | ⚠️ | Extraire de self-judge.js vers JSON |
| UX Organique | ⚠️ | Implémenter adaptResponse() |
| Conscience Collective | ⚠️ | Créer repo cynic-collective |
| ZK Proofs | ⚠️ | Progressive, Phase 1 = hash |
| Fichiers matrices | ⚠️ | Générer weights.json, harmony.json, thresholds.json |

---

## 8. FORMULES COMPLÈTES

### 8.1 Scoring Global

```
Score = exp(Σ(weight_i × ln(dim_i)) / Σweights)
      = (∏ dim_i^weight_i)^(1/Σweights)
```

### 8.2 Decay Temporel

```
factor = (1 - φ⁻³)^(weeks_old)
new_strength = old_strength × factor
```

### 8.3 Harmonie Update

```
H[i][j]_new = H[i][j]_old × φ⁻¹ + concordance × (1 - φ⁻¹)
concordance = 1 - |score_i - score_j| / 100
```

### 8.4 Tension Detection

```
tension(i, j) = (score_i - score_j) × H[i][j]
if |tension| > 20 && H[i][j] > 0.5: FLAG
```

### 8.5 E-Score (Contribution)

```
E = Σ(judgment_score × outcome_weight × φ^(age_days/7))

où:
- outcome_weight: useful=1.0, not_useful=-0.5, harmful=-2.0
- φ^(age/7): decay hebdomadaire
```

### 8.6 Technical Depth (UX)

```
td = sigmoid(vocab × 0.4 + depth × 0.4 + history × 0.2)
sigmoid(x) = 1 / (1 + exp(-5 × (x - 0.5)))
```

---

## 9. PROCHAINES ÉTAPES

1. [ ] Valider les 4 Lois (sont-elles complètes?)
2. [ ] Créer knowledge/cynic/matrices/weights.json
3. [ ] Créer knowledge/cynic/matrices/harmony.json (init zero)
4. [ ] Externaliser thresholds de self-judge.js
5. [ ] Implémenter updateHarmony() dans temporal.js ou nouveau fichier
6. [ ] Implémenter adaptResponse() pour UX organique
7. [ ] Créer repo cynic-collective (Git central, Phase 1)

---

*Généré: 2026-01-11*
*Session: Design Architecture CYNIC*
