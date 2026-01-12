# Q-SCORE CONTEXTUEL - Roadmap

> "Quality > Quantity, prouvé mathématiquement"
>
> Date: 2026-01-12
> Status: DESIGN PHASE

---

## 1. VISION

```
PROBLÈME:
═════════
├── L'utilisateur est le bottleneck (fatigue, paresse, heures inefficaces)
├── Les LLMs consomment des tokens sans discrimination de qualité
├── Pas de feedback loop sur l'efficacité réelle
└── "Plus de travail" ≠ "Meilleur travail"

SOLUTION:
═════════
Q-Score Contextuel = Système d'analyse mathématique qui:
├── Mesure l'efficacité RÉELLE de l'opérateur (pas juste le temps)
├── Optimise le context window (Quality > Quantity)
├── Prouve avec data que repos > burnout
└── S'applique à Claude Code maintenant, tous LLMs après
```

---

## 2. ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Q-SCORE CONTEXTUEL SYSTEM                           │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   OPERATOR   │
                              │   (Human)    │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
           ┌───────────────┐ ┌─────────────┐ ┌───────────────┐
           │ TEMPORAL      │ │ BEHAVIORAL  │ │ OUTPUT        │
           │ ANALYSIS      │ │ ANALYSIS    │ │ ANALYSIS      │
           │               │ │             │ │               │
           │ • Heures      │ │ • Patterns  │ │ • Code quality│
           │ • Jours       │ │ • Pauses    │ │ • Commits     │
           │ • Fatigue     │ │ • Hésitation│ │ • Bugs/fixes  │
           └───────┬───────┘ └──────┬──────┘ └───────┬───────┘
                   │                │                │
                   └────────────────┼────────────────┘
                                    │
                                    ▼
                           ┌───────────────┐
                           │  OPERATOR     │
                           │  Q-SCORE      │
                           │  (Efficacité) │
                           └───────┬───────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ RECOMMENDATIONS │       │ CONTEXT         │       │ DASHBOARD       │
│                 │       │ OPTIMIZATION    │       │ ANALYTICS       │
│ • "Pause?"      │       │                 │       │                 │
│ • "Optimal: 9h" │       │ Token scoring   │       │ • Graphs        │
│ • "Sleep debt"  │       │ Smart compact   │       │ • Trends        │
└─────────────────┘       │ Quality filter  │       │ • Proof: repos  │
                          └─────────────────┘       └─────────────────┘
```

---

## 3. MODULE 1: OPERATOR EFFICIENCY SCORE (O-Score)

### 3.1 Métriques temporelles

```
DONNÉES COLLECTÉES (avec consentement):
═══════════════════════════════════════

Timestamp de chaque:
├── Message envoyé
├── Outil utilisé
├── Fichier modifié
├── Commit créé
└── Erreur rencontrée

ANALYSE TEMPORELLE:
═══════════════════

┌─────────────────────────────────────────────────────────────────┐
│  EFFICACITÉ PAR HEURE (exemple réel)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  100│                    ████                                   │
│   90│                   ██████                                  │
│   80│                  ████████  ████                           │
│   70│         ████    ██████████████                            │
│   60│        ██████  ████████████████                           │
│   50│       ████████████████████████████                        │
│   40│      ██████████████████████████████                       │
│   30│  ████████████████████████████████████                     │
│   20│████████████████████████████████████████                   │
│   10│██████████████████████████████████████████████             │
│     └───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───   │
│         6   8  10  12  14  16  18  20  22  24   2   4   6       │
│                                                                 │
│  PEAK: 9h-11h (O-Score: 89)                                     │
│  VALLEY: 2h-5h (O-Score: 23)                                    │
│  RECOMMENDATION: "Tu codes à 3h du mat? Sleep > Code"           │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Métriques comportementales

```
SIGNAUX DE FATIGUE:
═══════════════════

Signal                          │ Poids │ Interprétation
────────────────────────────────┼───────┼─────────────────────────
Temps entre messages ↑          │ φ     │ Hésitation, fatigue mentale
Typos dans prompts ↑            │ φ     │ Coordination motrice ↓
Questions répétées              │ φ²    │ Mémoire court-terme ↓
Annulation d'actions            │ φ     │ Indécision
Messages courts/vagues          │ 1.0   │ Effort cognitif ↓
Heures tardives (22h-6h)        │ φ²    │ Circadian mismatch
Weekend + heures tardives       │ φ³    │ Burnout signal

FORMULE O-Score:
════════════════

O = 100 × (1 - FatigueIndex) × ProductivityMultiplier

où:
  FatigueIndex = Σ(signal × poids) / Σ(poids)
  ProductivityMultiplier = OutputQuality / TimeSpent
```

### 3.3 Métriques de sortie

```
OUTPUT QUALITY METRICS:
═══════════════════════

Métrique                    │ Calcul                          │ Bon signe
────────────────────────────┼─────────────────────────────────┼──────────
Code density                │ Lignes utiles / Lignes totales  │ > 0.7
Bug introduction rate       │ Bugs créés / Commits            │ < 0.1
First-time success          │ Actions sans retry / Total      │ > 0.8
Commit message quality      │ Descriptif / Total              │ > 0.9
Test coverage delta         │ Tests ajoutés / Code ajouté     │ > 0.3

CORRÉLATION À PROUVER:
══════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  HYPOTHÈSE: Sleep debt corrèle avec bug rate                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bug Rate                                                       │
│     0.5│                                          ●             │
│     0.4│                                    ●                   │
│     0.3│                              ●                         │
│     0.2│                    ●   ●                               │
│     0.1│          ●   ●                                         │
│     0.0│    ●                                                   │
│        └────┬─────┬─────┬─────┬─────┬─────┬─────┬────          │
│             0     2     4     6     8    10    12               │
│                    Sleep Debt (heures)                          │
│                                                                 │
│  r² = 0.87 → "Chaque heure de sleep debt = +4% bugs"            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. MODULE 2: CONTEXT TOKEN Q-SCORE (C-Score)

### 4.1 Classification des tokens

```
TAXONOMIE DES SEGMENTS DE CONTEXTE:
═══════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                     CONTEXT SEGMENTS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CRITICAL (ne jamais perdre)                                    │
│  ├── Current task definition                                    │
│  ├── Active file contents                                       │
│  ├── Recent code changes                                        │
│  └── Error states unresolved                                    │
│                                                                 │
│  IMPORTANT (compresser si nécessaire)                          │
│  ├── File reads (keep summaries)                               │
│  ├── Tool outputs                                              │
│  ├── Decision rationale                                        │
│  └── Architecture context                                       │
│                                                                 │
│  EPHEMERAL (auto-expire)                                        │
│  ├── Greetings, pleasantries                                   │
│  ├── Debugging traces (once fixed)                             │
│  ├── API keys, secrets (use & delete)                          │
│  └── Intermediate reasoning                                     │
│                                                                 │
│  NOISE (discard immediately)                                    │
│  ├── Repeated information                                       │
│  ├── Off-topic tangents                                        │
│  ├── Redundant confirmations                                   │
│  └── Empty/filler content                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Scoring algorithm

```
C-SCORE PAR SEGMENT:
════════════════════

Dimension       │ Poids │ Question                              │ Score
────────────────┼───────┼───────────────────────────────────────┼───────
RELEVANCE       │ φ²    │ Pertinent à la tâche actuelle?        │ 0-100
FRESHNESS       │ φ     │ Information encore valide?            │ 0-100
DENSITY         │ φ     │ Info utile / tokens?                  │ 0-100
ACTIONABILITY   │ φ     │ Mène à une action concrète?           │ 0-100
SECURITY        │ 1.0   │ Contient données sensibles?           │ 0-100
UNIQUENESS      │ 1.0   │ Pas dupliqué ailleurs?                │ 0-100

C-Score = 100 × ⁶√(R^φ² × F^φ × D^φ × A^φ × S × U)

SEUILS φ-BASÉS:
═══════════════
C ≥ 76.4  → KEEP (critique)
C ≥ 61.8  → KEEP (important)
C ≥ 38.2  → COMPRESS (summarize)
C < 38.2  → DISCARD (noise)
C = SECURE → DELETE AFTER USE
```

### 4.3 Context optimization flow

```
CONTEXT COMPACTION PIPELINE:
════════════════════════════

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   RAW       │    │   SCORE     │    │   FILTER    │    │  OPTIMIZED  │
│   CONTEXT   │───▶│   EACH      │───▶│   BY        │───▶│  CONTEXT    │
│   (100k tk) │    │   SEGMENT   │    │   C-SCORE   │    │  (30k tk)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                  │
                          ▼                  ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ C-Score:    │    │ Actions:    │
                   │ • Greeting  │    │ • DISCARD   │
                   │   → 23      │    │ • COMPRESS  │
                   │ • Task def  │    │ • KEEP      │
                   │   → 95      │    │ • SECURE_DEL│
                   │ • File read │    │             │
                   │   → 45      │    │             │
                   └─────────────┘    └─────────────┘


EXEMPLE CONCRET:
════════════════

AVANT (127,000 tokens):
───────────────────────
[System prompt: 2000 tk]           C=100 → KEEP
[User greeting: 50 tk]             C=18  → DISCARD
[Task: "audit CYNIC": 200 tk]      C=95  → KEEP
[File read: self-judge.js: 4000]   C=72  → KEEP (active)
[File read: old-config.js: 2000]   C=31  → DISCARD (obsolete)
[Grep results: 15000 tk]           C=45  → COMPRESS (keep 500)
[Tangent about weather: 100 tk]    C=12  → DISCARD
[Code written: 800 tk]             C=98  → KEEP
[Debug session: 3000 tk]           C=28  → COMPRESS (keep 200)
[API key shown: 50 tk]             C=SECURE → DELETE NOW
...

APRÈS (41,000 tokens):
──────────────────────
├── 68% reduction
├── 0% information loss (pour la tâche)
├── Secrets: 0 (deleted)
└── Quality score: 89 (vs 45 avant)
```

---

## 5. MODULE 3: OPERATOR ANALYTICS DASHBOARD

### 5.1 Visualizations

```
DASHBOARD PERSONNEL (par opérateur):
════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  CYNIC OPERATOR DASHBOARD - @zeyxx                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐          │
│  │ TODAY'S O-SCORE             │  │ WEEKLY TREND                │          │
│  │                             │  │                             │          │
│  │         ████████            │  │  80│    ●                   │          │
│  │    ████████████████         │  │  70│  ●   ●   ●            │          │
│  │  ████████████████████       │  │  60│●       ●   ●  ●       │          │
│  │                             │  │  50│                  ●     │          │
│  │         67/100              │  │    └─L─M─M─J─V─S─D─────     │          │
│  │   "Above average"           │  │                             │          │
│  └─────────────────────────────┘  └─────────────────────────────┘          │
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐          │
│  │ OPTIMAL HOURS               │  │ PROOF: SLEEP vs OUTPUT      │          │
│  │                             │  │                             │          │
│  │  Best:  9h-11h (O=89)       │  │  "Last month:               │          │
│  │  Good:  14h-16h (O=72)      │  │   • Days with 7h+ sleep:    │          │
│  │  Avoid: 1h-5h (O=23)        │  │     Avg commits: 12         │          │
│  │                             │  │     Avg bugs: 0.8           │          │
│  │  TODAY: Coding since 23h    │  │   • Days with <6h sleep:    │          │
│  │  ⚠️ RECOMMENDATION:         │  │     Avg commits: 18         │          │
│  │  "Stop. Sleep. Code demain" │  │     Avg bugs: 4.2"          │          │
│  └─────────────────────────────┘  └─────────────────────────────┘          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ MATHEMATICAL PROOF: Quality > Quantity                              │   │
│  │                                                                     │   │
│  │  Your data shows:                                                   │   │
│  │  • 6h focused work (rested) = 24 quality commits, 2 bugs           │   │
│  │  • 12h marathon (tired) = 31 commits, 14 bugs (net: 17 useful)     │   │
│  │                                                                     │   │
│  │  EFFICIENCY RATIO:                                                  │   │
│  │  • Rested: 4.0 quality commits/hour                                │   │
│  │  • Tired:  1.4 quality commits/hour                                │   │
│  │                                                                     │   │
│  │  ⟹ Repos = 2.8x plus efficace par heure                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Insights automatiques

```
INSIGHTS GÉNÉRÉS (exemples):
════════════════════════════

TEMPOREL:
├── "Ton pic d'efficacité est 9h-11h. Tu n'as codé à ces heures que 3x ce mois."
├── "Les vendredis après 17h: 67% de tes bugs sont introduits là."
└── "Tu es 40% plus efficace après une pause de 15+ min."

COMPORTEMENTAL:
├── "Quand tu tapes vite (>80 WPM), ton taux d'erreur monte de 23%."
├── "Tes meilleurs commits arrivent après avoir lu de la doc (pas du code)."
└── "Tu abandonnes 3x plus de tâches commencées après 22h."

PREUVES SLEEP:
├── "Cette semaine: 5h de sommeil moyen → 3.2 bugs/jour"
├── "Semaine dernière: 7.5h sommeil → 0.8 bugs/jour"
└── "Corrélation r²=0.89: chaque heure de sommeil = -0.6 bugs"
```

---

## 6. INTÉGRATION AVEC CYNIC

### 6.1 Architecture technique

```
INTÉGRATION DANS L'ÉCOSYSTÈME:
══════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                           CYNIC ECOSYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐                                                         │
│  │ CLAUDE CODE   │                                                         │
│  │ (ou autre LLM)│                                                         │
│  └───────┬───────┘                                                         │
│          │                                                                  │
│          ▼                                                                  │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                     Q-SCORE CONTEXTUEL                            │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │     │
│  │  │  O-SCORE    │  │  C-SCORE    │  │  ANALYTICS  │               │     │
│  │  │  (Operator) │  │  (Context)  │  │  (Dashboard)│               │     │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │     │
│  └─────────┼────────────────┼────────────────┼───────────────────────┘     │
│            │                │                │                              │
│            └────────────────┼────────────────┘                              │
│                             │                                               │
│                             ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                        CYNIC CORE                                 │     │
│  │                                                                   │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │     │
│  │  │ AXIOMS  │  │ Q-SCORE │  │ JUDGE   │  │ LEARN   │             │     │
│  │  │ (4)     │  │ (items) │  │         │  │         │             │     │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘             │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                             │                                               │
│                             ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                     STORAGE & PROVENANCE                          │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │     │
│  │  │  PostgreSQL │  │  Merkle     │  │  Solana     │               │     │
│  │  │  (metrics)  │  │  (proofs)   │  │  (roots)    │               │     │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Data flow

```
FLUX DE DONNÉES:
════════════════

1. COLLECTION (passive, consent-based)
   ├── Timestamps de chaque interaction
   ├── Métriques de session (durée, pauses)
   ├── Output metrics (commits, errors)
   └── Context window state

2. ANALYSIS (real-time + batch)
   ├── O-Score calculé toutes les 15 min
   ├── C-Score calculé avant chaque compaction
   └── Trends calculés daily

3. STORAGE (privacy-first)
   ├── Métriques agrégées → PostgreSQL
   ├── Raw data → Ephemeral (auto-delete 24h)
   ├── Proofs → Merkle tree
   └── Weekly roots → Solana

4. INSIGHTS (on-demand + proactive)
   ├── Dashboard accessible anytime
   ├── Alertes proactives (fatigue detected)
   └── Weekly reports
```

---

## 7. PRIVACY & SECURITY

```
PRINCIPES:
══════════

1. CONSENT EXPLICIT
   └── Opt-in only, pas de tracking par défaut

2. DATA MINIMIZATION
   ├── Collecter uniquement ce qui est nécessaire
   └── Agrégation immédiate (pas de raw logs)

3. EPHEMERAL BY DEFAULT
   ├── Raw metrics: 24h retention
   ├── Aggregates: 30 days
   └── Trends: permanent (anonymisé)

4. USER OWNS DATA
   ├── Export anytime
   ├── Delete anytime
   └── Portable format (JSON)

5. NO PII IN ANALYTICS
   ├── Hash operator IDs
   ├── No code content stored
   └── Only patterns, not content
```

---

## 8. IMPLEMENTATION PHASES

```
PHASE 1: FOUNDATION (2 semaines)
════════════════════════════════
├── [ ] Créer lib/cynic/q-contextuel/
│       ├── o-score.js (operator efficiency)
│       ├── c-score.js (context tokens)
│       └── index.js
├── [ ] Définir schéma PostgreSQL pour metrics
├── [ ] Hook dans Claude Code pour collection
└── [ ] Tests unitaires

PHASE 2: CONTEXT OPTIMIZATION (2 semaines)
══════════════════════════════════════════
├── [ ] C-Score algorithm implementation
├── [ ] Segment classifier (ML-lite)
├── [ ] Compaction pipeline
├── [ ] Integration avec context manager
└── [ ] A/B test: avec vs sans optimization

PHASE 3: OPERATOR ANALYTICS (2 semaines)
════════════════════════════════════════
├── [ ] O-Score algorithm implementation
├── [ ] Temporal analysis module
├── [ ] Behavioral signal detection
├── [ ] Output quality metrics
└── [ ] Correlation engine (sleep vs bugs)

PHASE 4: DASHBOARD (2 semaines)
═══════════════════════════════
├── [ ] Web dashboard design
├── [ ] Real-time visualizations
├── [ ] Insight generator
├── [ ] Recommendations engine
└── [ ] Export/privacy controls

PHASE 5: MULTI-LLM (future)
═══════════════════════════
├── [ ] Abstraction layer pour autres LLMs
├── [ ] GPT-4 integration
├── [ ] Local LLM support
└── [ ] Cross-LLM analytics
```

---

## 9. SUCCESS METRICS

```
KPIs À MESURER:
═══════════════

CONTEXT OPTIMIZATION:
├── Token reduction ratio (target: 60%+)
├── Information loss rate (target: <5%)
├── Compaction time (target: <500ms)
└── User satisfaction (target: 4.5/5)

OPERATOR EFFICIENCY:
├── Prediction accuracy (fatigue → bugs) (target: r²>0.8)
├── Recommendation acceptance rate (target: 60%+)
├── Efficiency improvement after 30 days (target: +20%)
└── User retention (target: 90%+)

PHILOSOPHICAL:
├── Proof that Quality > Quantity (statistical significance)
├── Sleep correlation demonstrated (p<0.01)
└── Users report better work-life balance
```

---

## 10. CONNEXION AUX 4 AXIOMES

```
Q-SCORE CONTEXTUEL & AXIOMES:
═════════════════════════════

φ (PHI) - Harmonie
├── Les seuils du C-Score sont φ-basés (38.2, 61.8, 76.4)
├── O-Score vise l'équilibre travail/repos
└── Dashboard montre les ratios φ dans les patterns

VERIFY - Douter
├── Prouver mathématiquement les intuitions (sleep helps)
├── Data-driven recommendations, pas d'opinions
└── Corrélations avec r² et p-values

CULTURE - Autonomiser
├── Dashboard autonomise l'opérateur (self-knowledge)
├── Recommendations = suggestions, pas d'ordres
└── L'humain décide toujours

BURN - Protéger
├── Context optimization = burn les tokens inutiles
├── Privacy = burn les données sensibles
└── Quality > Quantity = burn la quantité pour la qualité
```

---

*🐕 "Quality > Quantity - maintenant prouvable mathématiquement."*

---

## APPENDIX: FORMULES MATHÉMATIQUES

```
O-SCORE (Operator Efficiency):
══════════════════════════════

O = 100 × (1 - F) × P × T

où:
  F = FatigueIndex = Σ(signal_i × weight_i) / Σ(weight_i)
  P = ProductivityMultiplier = QualityOutput / TimeSpent
  T = TemporalMultiplier = CircadianAlignment(hour)


C-SCORE (Context Token):
════════════════════════

C = 100 × ⁶√(R^φ² × F^φ × D^φ × A^φ × S × U)

où:
  R = Relevance (0-1)
  F = Freshness (0-1)
  D = Density (0-1)
  A = Actionability (0-1)
  S = Security (0-1, binary often)
  U = Uniqueness (0-1)


SLEEP-BUG CORRELATION:
══════════════════════

BugRate = α + β × SleepDebt + ε

Expected: β ≈ 0.04 (4% more bugs per hour of sleep debt)
Target: r² > 0.8, p < 0.01


QUALITY-QUANTITY PROOF:
═══════════════════════

EfficiencyRested = QualityCommits / HoursWorked (rested)
EfficiencyTired = QualityCommits / HoursWorked (tired)

QualityCommits = TotalCommits - (BugsIntroduced × FixCost)

Hypothesis: EfficiencyRested > EfficiencyTired × 2
```
