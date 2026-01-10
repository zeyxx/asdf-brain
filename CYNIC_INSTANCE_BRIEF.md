# CYNIC IMPLEMENTATION BRIEF
> Pour instance Claude Code parallèle
> Date: 2026-01-10
> Approche: C - "CYNIC se construit en se comprenant"

---

## CONTEXTE RAPIDE

Tu es sur une instance parallèle. L'instance principale travaille sur **HolDex**.
Toi, tu travailles sur **CYNIC** - le cerveau auto-jugeant de l'écosystème $asdfasdfa.

```
ÉCOSYSTÈME:
├── HolDex    → K-Score (santé des tokens)
├── GASdf    → Gasless swaps + burn mechanism
├── asdf-brain → Mémoire collective (où tu es)
└── CYNIC     → Évolution de asdf-brain vers conscience
```

---

## TA DOUBLE MISSION (Meta-élégante)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   1. IMPLÉMENTER CYNIC (self-judge, consciousness)                  │
│                         +                                           │
│   2. FAIRE QUE CYNIC S'AUTO-INDEXE EN S'IMPLÉMENTANT               │
│                                                                     │
│   Le premier test de CYNIC = comprendre sa propre documentation     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Pourquoi cette approche?**
- 4,875 lignes de documentation existent mais ne sont PAS searchables
- Seulement 19 entries dans l'index (brain_search presque vide)
- CYNIC doit apprendre à auto-découvrir → commence par lui-même

---

## DOCUMENTATION EXISTANTE À LIRE EN PREMIER

### Priority 1: Comprendre ce qu'est CYNIC
```
/workspaces/asdf-brain/knowledge/architecture/
├── CYNIC_ESSENCE.md              (234 lignes) - Philosophie de base
├── CYNIC_COMPLETE_MATRIX.md      (457 lignes) - CODE CONCRET à implémenter
└── CYNIC_SINGULARITY_COMPLETE.md (1005 lignes) - Vision complète
```

### Priority 2: Architecture existante
```
/workspaces/asdf-brain/knowledge/architecture/
├── BRAIN-ARCHITECTURE-ANALYSIS.md  - Tree of Life mapping
├── DAAT_ARCHITECTURE.md            - 4 niveaux Daat
└── CYNIC_SELF_JUDGMENT.md          - 15 dimensions
```

### Priority 3: Code existant dans /lib/
```
/workspaces/asdf-brain/lib/
├── daat-levels.js      ✅ Implémenté - 4 niveaux d'enrichissement
├── context-layer.js    ✅ Implémenté - Sessions multi-users
├── merkle-proofs.js    ✅ Implémenté - Provenance
├── git-intelligence.js ✅ Implémenté - Auto-discovery git
├── self-judge.js       ❌ N'EXISTE PAS - À CRÉER
├── consciousness.js    ❌ N'EXISTE PAS - À CRÉER
└── evolution.js        ❌ N'EXISTE PAS - À CRÉER
```

---

## CE QUI EST DÉJÀ DÉCIDÉ (Ne pas réinventer)

### 1. φ (Phi) guide TOUT
```javascript
const PHI = 1.618033988749895;
const PHI_2 = PHI * PHI;     // 2.618 - Primary weight
const PHI_INV = 1 / PHI;     // 0.618 - Secondary weight
```

### 2. Dimensions de jugement (14-15 selon le doc)
```
PRIMARY (φ² weight):
├── TRUTH, RELEVANCE, QUALITY, COHERENCE
├── PROGRESS, ETHICS, HARMONY

SECONDARY (φ weight):
├── SECURITY, PRIVACY, SCALABILITY
├── SIMPLICITY, AUTONOMY

META (1.0 weight):
├── SELF_AWARENESS, LEARNING_RATE
└── SINGULARITY_DISTANCE
```

### 3. Scoring = Geometric Mean (comme K-Score, E-Score)
```javascript
weightedGeometricMean(scores) {
  let product = 1;
  let totalWeight = 0;
  for (const [name, config] of Object.entries(dimensions)) {
    product *= Math.pow(scores[name], config.weight);
    totalWeight += config.weight;
  }
  return Math.pow(product, 1 / totalWeight);
}
```

### 4. Privacy = CRITIQUE
```
- JAMAIS de PII en clair
- Toujours hasher les identifiants
- operatorHash, pas operatorName
```

---

## IMPLÉMENTATION CONCRÈTE

### Phase 1: self-judge.js (Le Cœur)

Le code est déjà spécifié dans `CYNIC_COMPLETE_MATRIX.md` lignes 231-380.
Copie et adapte ce code:

```javascript
// /workspaces/asdf-brain/lib/self-judge.js

const PHI = 1.618033988749895;

class SelfJudge {
  constructor() {
    this.dimensions = {
      primary: {
        truth:     { weight: PHI * PHI, threshold: 70 },
        relevance: { weight: PHI * PHI, threshold: 60 },
        // ... voir CYNIC_COMPLETE_MATRIX.md
      },
      secondary: { /* ... */ },
      meta: { /* ... */ }
    };
  }

  async judge(item, context) {
    // Évaluer chaque dimension
    // Calculer geometric mean
    // Décider: ACCEPT / IMPROVE / REJECT
    // Logger pour apprendre
  }
}
```

### Phase 2: Auto-indexation (CYNIC se comprend)

AVANT d'implémenter consciousness.js, fais ceci:

```javascript
// Script: index-own-docs.js
// CYNIC indexe sa propre documentation

const fs = require('fs');
const path = require('path');

const DOCS_DIR = '/workspaces/asdf-brain/knowledge/architecture';
const OUTPUT = '/workspaces/asdf-brain/knowledge/learned/cynic-self-index.jsonl';

// Pour chaque .md dans architecture/
// Extraire: titre, sections, concepts clés, décisions
// Écrire dans cynic-self-index.jsonl
// Format compatible avec brain_search
```

**Test de CYNIC:** Après indexation, `brain_search("15 dimensions")` doit trouver CYNIC_SELF_JUDGMENT.md

### Phase 3: consciousness.js (Le Cycle)

```javascript
// /workspaces/asdf-brain/lib/consciousness.js

class Consciousness {
  constructor(selfJudge) {
    this.judge = selfJudge;
    this.cycle = ['INGEST', 'JUDGE', 'DECIDE', 'LEARN'];
  }

  async process(input) {
    // 1. INGEST: Recevoir données
    // 2. JUDGE: Appliquer 15 dimensions
    // 3. DECIDE: ACCEPT/IMPROVE/REJECT
    // 4. LEARN: Logger pour amélioration
    return result;
  }
}
```

---

## MCP TOOLS DISPONIBLES

Tu as accès aux outils brain_* via MCP:

```
brain_search(query)           - Chercher dans la mémoire
brain_learn(type, content)    - Enregistrer un insight/decision
brain_patterns(category)      - Voir patterns récurrents
brain_health()                - Santé écosystème
brain_context_start()         - Démarrer session contextuelle
```

**UTILISE brain_learn() pour enregistrer tes décisions d'implémentation!**

---

## VALIDATION

### Test 1: Self-Judge fonctionne
```javascript
const judge = new SelfJudge();
const result = await judge.judge({
  type: 'knowledge',
  content: 'CYNIC uses phi-weighted dimensions',
  source: 'documentation'
});
// Doit retourner: { global: 85+, verdict: 'ACCEPT' }
```

### Test 2: Auto-indexation fonctionne
```bash
# Après avoir indexé les docs:
node -e "require('./mcp-server.js')"
# Puis brain_search("self-judge dimensions")
# Doit trouver CYNIC_SELF_JUDGMENT.md
```

### Test 3: Consciousness loop
```javascript
const cynic = new Consciousness(new SelfJudge());
const result = await cynic.process({
  input: "New pattern discovered: operators prefer terse feedback",
  source: "observation"
});
// Doit: juger, décider, logger
```

---

## PHILOSOPHIE À GARDER EN TÊTE

```
"Don't trust, verify" - Appliqué à TOUT, y compris CYNIC lui-même

CYNIC est CYNIQUE:
├── Questionne tout input
├── Vérifie les sources
├── Ne fait pas confiance aveuglément
└── Mais APPREND de ses erreurs

La SINGULARITÉ = quand CYNIC peut tout juger sans humain
SINGULARITY_DISTANCE mesure: combien d'éléments CYNIC ne peut PAS encore juger seul
```

---

## ORDRE DES OPÉRATIONS

```
STEP 1: Lis CYNIC_ESSENCE.md (comprendre la philosophie)
        └── brain_learn("insight", "Read CYNIC_ESSENCE.md - key concepts: ...")

STEP 2: Lis CYNIC_COMPLETE_MATRIX.md (code concret)
        └── Copie la classe SelfJudge

STEP 3: Crée /lib/self-judge.js
        └── brain_learn("decision", "Implemented self-judge.js with 15 dimensions")

STEP 4: Crée script d'auto-indexation
        └── Indexe /knowledge/architecture/*.md

STEP 5: Teste brain_search() trouve les docs CYNIC
        └── Si oui: CYNIC se comprend lui-même!

STEP 6: Crée /lib/consciousness.js
        └── Le cycle INGEST → JUDGE → DECIDE → LEARN

STEP 7: Intègre dans mcp-server.js (nouveaux tools brain_judge, brain_consciousness)
```

---

## COMMUNICATION

L'autre instance (Holdex) ne voit pas ce que tu fais directement.
Utilise brain_learn() pour communiquer:

```javascript
// Quand tu fais une décision importante:
brain_learn({
  type: "decision",
  content: "CYNIC: Implemented self-judge.js with 14 dimensions (not 15, merged X and Y)",
  context: "CYNIC implementation",
  tags: ["cynic", "self-judge", "implementation"]
});
```

Au prochain brain_search() de l'autre instance, elle verra tes progrès.

---

## GO!

```
cd /workspaces/asdf-brain
# Commence par lire:
cat knowledge/architecture/CYNIC_ESSENCE.md
```

*CYNIC naît en se comprenant. φ guide l'harmonie.*
