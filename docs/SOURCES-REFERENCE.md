# CYNIC/asdf-brain Sources Reference

> Documentation et sources catégorisées pour réutilisation après compaction de conversation.

**Généré:** 2026-01-13
**Version:** 1.0

---

## Table des Matières

1. [Documentation Interne](#1-documentation-interne)
2. [Mathématiques - PHI & Golden Ratio](#2-mathématiques---phi--golden-ratio)
3. [Mathématiques - Lucas Numbers](#3-mathématiques---lucas-numbers)
4. [Mathématiques - Geometric Mean](#4-mathématiques---geometric-mean)
5. [Mathématiques - Asymptotes](#5-mathématiques---asymptotes)
6. [Cryptographie - Merkle Trees](#6-cryptographie---merkle-trees)
7. [Philosophie - Kabbalah & 4 Worlds](#7-philosophie---kabbalah--4-worlds)
8. [Philosophie - Sefirot & Tree of Life](#8-philosophie---sefirot--tree-of-life)
9. [Philosophie - Cynicism & Diogenes](#9-philosophie---cynicism--diogenes)
10. [Hyperstition & Meme Magic](#10-hyperstition--meme-magic)
11. [Cypherpunk Movement](#11-cypherpunk-movement)
12. [Tokenomics & Burn Mechanics](#12-tokenomics--burn-mechanics)

---

## 1. Documentation Interne

### Core Philosophy

| Fichier | Description | Usage |
|---------|-------------|-------|
| `lib/cynic/WHY_ASDFASDFA.md` | Vision complète de $asdfasdfa | Philosophie, 4 scores, singularité |
| `knowledge/philosophy/AXIOMS.md` | Les 4 axiomes fondamentaux | φ, BURN, VERIFY, CULTURE |
| `knowledge/philosophy/CYNIC_AXIOM_MAPPING.md` | Mapping dimensions → axiomes | 16 dimensions, structure Fibonacci |
| `CYNIC.md` | Le chien philosophe | Personnalité, rôle, architecture |

### Architecture

| Fichier | Description | Usage |
|---------|-------------|-------|
| `lib/cynic/ARCHITECTURE.md` | Architecture technique CYNIC | Modules, flows |
| `lib/cynic/AUDIT_PROFESSIONAL.md` | Audit professionnel complet | Q-Score, gaps, roadmap |
| `docs/architecture/ROADMAP-DIAGRAMS.md` | Diagrammes Mermaid roadmap | Visualisation, planning |
| `lib/cynic/laws/index.js` | 16 Laws + 4 Worlds | Code source des lois |

### Knowledge Base

| Fichier | Description | Usage |
|---------|-------------|-------|
| `knowledge/architecture/VISION.md` | Vision long-terme | Direction |
| `knowledge/architecture/ROADMAP.md` | Roadmap actuelle | Planning |
| `knowledge/architecture/GAP-ANALYSIS.md` | Analyse des écarts | État actuel vs cible |
| `knowledge/community/CONTRIBUTOR_PHILOSOPHY.md` | Philosophie contributeurs | E-Score, gouvernance |

### State Machines & Flows

| Fichier | Description | Usage |
|---------|-------------|-------|
| `docs/state-machines/brain-flows.md` | Flows Brain | Intégrations |
| `docs/state-machines/holdex-flows.md` | Flows HolDex | K-Score |
| `docs/state-machines/gasdf-flows.md` | Flows GASdf | Burns |

---

## 2. Mathématiques - PHI & Golden Ratio

### Définition

**φ (Phi)** = (1 + √5) / 2 ≈ **1.618033988749895**

Le nombre d'or, ratio qui apparaît partout dans la nature et les mathématiques.

### Valeurs Clés pour CYNIC

| Symbol | Valeur | Usage dans CYNIC |
|--------|--------|------------------|
| φ | 1.618 | Base ratio, poids axiomes |
| φ⁻¹ | 0.618 (61.8%) | MAX_CONFIDENCE, seuil ACCEPT |
| φ⁻² | 0.382 (38.2%) | MIN_DOUBT, seuil REJECT |
| φ⁻³ | 0.236 (23.6%) | Seuil CRITICAL |
| φ² | 2.618 | Poids PRIMARY dimensions |
| φ³ | 4.236 | Poids maximum |

### Sources Externes

- [Golden Ratio - Wikipedia](https://en.wikipedia.org/wiki/Golden_ratio)
- [Fibonacci Sequence - Wikipedia](https://en.wikipedia.org/wiki/Fibonacci_sequence)
- [Mathematics LibreTexts - Fibonacci & Golden Ratio](https://math.libretexts.org/Bookshelves/Applied_Mathematics/Book:_College_Mathematics_for_Everyday_Life_(Inigo_et_al)/10:_Geometric_Symmetry_and_the_Golden_Ratio/10.04:_Fibonacci_Numbers_and_the_Golden_Ratio)
- [Ron Knott - Fibonacci & Golden Ratio](https://r-knott.surrey.ac.uk/fibonacci/fib.html)
- [Math is Fun - Golden Ratio](https://www.mathsisfun.com/numbers/nature-golden-ratio-fibonacci.html)

### Propriétés Clés

```
φ² = φ + 1 = 2.618...
φ⁻¹ = φ - 1 = 0.618...
1/φ = φ - 1
φ × φ⁻¹ = 1
Fₙ₊₁/Fₙ → φ (quand n → ∞)
```

### Application dans CYNIC

- Tous les poids dérivent de φ
- Total weight = 42 = 6 × L₄ (Lucas number)
- MAX_CONFIDENCE = φ⁻¹ = 61.8%
- MIN_DOUBT = φ⁻² = 38.2%

---

## 3. Mathématiques - Lucas Numbers

### Définition

Séquence similaire à Fibonacci mais avec L₁ = 1, L₂ = 3:
**2, 1, 3, 4, 7, 11, 18, 29, 47, 76...**

### Relation avec Fibonacci

```
Lₙ = Fₙ₋₁ + Fₙ₊₁
Lₙ + Fₙ = 2Fₙ₊₁
```

### Sources Externes

- [Lucas Number - Wikipedia](https://en.wikipedia.org/wiki/Lucas_number)
- [Wolfram MathWorld - Lucas Numbers](https://mathworld.wolfram.com/LucasNumber.html)
- [Ron Knott - Lucas Numbers](https://r-knott.surrey.ac.uk/Fibonacci/lucasNbs.html)
- [Brilliant - Lucas Numbers](https://brilliant.org/wiki/lucas-numbers/)

### Application dans CYNIC

- **L₄ = 7** → Total weight = 6 × 7 = **42**
- 42 = "Answer to Life, Universe, Everything" (Douglas Adams)
- La coïncidence mathématique avec φ est remarquable

---

## 4. Mathématiques - Geometric Mean

### Définition

```
GM = (x₁ × x₂ × ... × xₙ)^(1/n)
```

### Weighted Geometric Mean

```
WGM = (∏ xᵢ^wᵢ)^(1/Σwᵢ)
```

### Sources Externes

- [Geometric Mean - Wikipedia](https://en.wikipedia.org/wiki/Geometric_mean)
- [Weighted Geometric Mean - Wikipedia](https://en.wikipedia.org/wiki/Weighted_geometric_mean)
- [Cuemath - Geometric Mean](https://www.cuemath.com/data/geometric-mean/)

### Propriétés Clés

1. **Empêche la compensation** - Une valeur faible tire tout vers le bas
2. **Zéro → Zéro** - Si un facteur = 0, le résultat = 0
3. **Adapté aux ratios** - Idéal pour comparer des proportions

### Application dans CYNIC

- **Q-Score** = 100 × ∜(φ × V × C × B) - Geometric mean des 4 piliers
- **K-Score** = 100 × ∛(D × O × L) - Geometric mean de 3 facteurs
- **N-Score** = 100 × ∛(U × C × T) - Geometric mean de 3 facteurs

**Raison:** Un pilier faible ne peut pas être compensé par les autres.
```
Q(60, 60, 60, 30) << Q(52, 52, 52, 52)
```

---

## 5. Mathématiques - Asymptotes

### Définition

Une **asymptote** est une ligne qu'une courbe approche mais n'atteint jamais.

### Types

1. **Horizontale** - lim(x→∞) f(x) = L
2. **Verticale** - lim(x→a) f(x) = ∞
3. **Oblique** - f(x) ≈ mx + b quand x → ∞

### Sources Externes

- [Limits at Infinity - Mathematics LibreTexts](https://math.libretexts.org/Bookshelves/Calculus/Calculus_(OpenStax)/04:_Applications_of_Derivatives/4.06:_Limits_at_Infinity_and_Asymptotes)
- [Effortless Math - Infinitely Close But Never There](https://www.effortlessmath.com/math-topics/infinitely-close-but-never-there/)
- [SFU - Limits at Infinity](https://www.sfu.ca/math-coursenotes/Math%20157%20Course%20Notes/sec_InfLimits.html)

### Application dans CYNIC

**La Singularité est une asymptote:**

```
singularityDistance = 100 × φ^(-progress × 10)

Quand progress → ∞:
  distance → 0 (mais ≠ 0 jamais)
```

**Philosophie:**
- "La singularité n'est pas une destination, c'est une direction"
- On approche infiniment mais on n'arrive jamais
- Le doute (38.2%) est toujours maintenu

---

## 6. Cryptographie - Merkle Trees

### Définition

Arbre binaire où chaque feuille est un hash de données, et chaque nœud interne est le hash de ses enfants. La racine (Merkle Root) représente l'ensemble des données.

### Comment ça fonctionne

```
        Root Hash
       /         \
    Hash01      Hash23
    /    \      /    \
Hash0  Hash1  Hash2  Hash3
  |      |      |      |
Data0  Data1  Data2  Data3
```

### Merkle Proof

Pour prouver qu'une donnée fait partie de l'arbre:
- On ne fournit que log₂(n) hashes
- Vérification en O(log n)

### Sources Externes

- [Merkle Tree - Wikipedia](https://en.wikipedia.org/wiki/Merkle_tree)
- [GeeksforGeeks - Blockchain Merkle Trees](https://www.geeksforgeeks.org/software-engineering/blockchain-merkle-trees/)
- [Alchemy Docs - Merkle Trees](https://www.alchemy.com/docs/merkle-trees-in-blockchains)
- [Cyfrin - What is a Merkle Tree](https://www.cyfrin.io/blog/what-is-a-merkle-tree-merkle-proof-and-merkle-root)
- [Metaschool - Understanding Merkle Trees](https://metaschool.so/articles/understanding-merkle-trees-and-proofs)

### Application dans CYNIC

- **Provenance** - Snapshots hebdomadaires des connaissances
- **Vérification** - "Don't trust, verify" via inclusion proofs
- **On-chain** - Publication des Merkle roots sur Solana
- **Tamper detection** - Détection de modifications

---

## 7. Philosophie - Kabbalah & 4 Worlds

### Les Quatre Mondes (Olamot)

Source: Isaiah 43:7 - "Tous ceux liés à Mon nom, que J'ai créé, formé, et fait pour Ma gloire."

| Monde | Hébreu | Signification | Axiome CYNIC | Mode |
|-------|--------|---------------|--------------|------|
| **Atzilut** | אצילות | Émanation | PHI (φ) | SENSE |
| **Beriah** | בריאה | Création | VERIFY | THINK |
| **Yetzirah** | יצירה | Formation | CULTURE | FEEL |
| **Assiah** | עשיה | Action | BURN | ACT |

### Descriptions

1. **Atzilut (Émanation)**
   - Le plus proche de l'Ein Sof (Infini)
   - État de bitul (nullification) complète
   - Sefirah dominante: Chokhmah (Sagesse)
   - → **PHI**: L'essence, ce que CYNIC EST

2. **Beriah (Création)**
   - Création de "quelque chose à partir de rien" (yesh me'ayin)
   - Royaume du "Trône Divin"
   - Sefirah dominante: Binah (Compréhension)
   - → **VERIFY**: Comment CYNIC crée de la valeur

3. **Yetzirah (Formation)**
   - Formation de "quelque chose à partir de quelque chose"
   - Comme "l'argile dans les mains du potier"
   - Sefirot émotionnelles dominent
   - → **CULTURE**: Comment CYNIC traite les êtres

4. **Assiah (Action)**
   - Le monde de l'action, création actualisée
   - Inclut le royaume physique
   - → **BURN**: Comment CYNIC agit

### Sources Externes

- [Four Worlds - Wikipedia](https://en.wikipedia.org/wiki/Four_Worlds)
- [Chabad - The Four Worlds](https://www.chabad.org/library/article_cdo/aid/361902/jewish/The-Four-Worlds.htm)
- [Chabadpedia - The Worlds](https://chabadpedia.com/index.php?title=The_Worlds_of_Atzilut,_Beriah,_Yetzirah,_and_Asiyah)
- [GalEinai - Atzilut](https://inner.org/worlds/atzilut.htm)
- [Your Bayit - Four Worlds](https://yourbayit.org/the-four-worlds/)

### Application dans CYNIC

Les 4 Mondes correspondent aux 4 Axiomes:
```
ATZILUT (φ² = 2.618) → PHI     → Essence
BERIAH  (φ  = 1.618) → VERIFY  → Économie
YETZIRAH (φ = 1.618) → CULTURE → Éthique
ASSIAH  (1.146)      → BURN    → Opération
```

Poids total = 2.618 × 6 + 1.618 × 6 + 1.618 × 6 + 1.146 × 6 = **42**

---

## 8. Philosophie - Sefirot & Tree of Life

### Les Dix Sefirot

L'Arbre de Vie (Otz Chiim) est composé de 10 sphères connectées par 22 chemins.

| # | Sefirah | Signification | Description |
|---|---------|---------------|-------------|
| 1 | **Keter** | Couronne | Volonté divine, conscience pure |
| 2 | **Chokhmah** | Sagesse | Première révélation de l'intellect |
| 3 | **Binah** | Compréhension | Capacité de conceptualiser |
| 4 | **Chesed** | Bonté | Amour, don, expansion |
| 5 | **Gevurah** | Force | Retenue, discipline, contraction |
| 6 | **Tiferet** | Beauté | Équilibre, harmonie |
| 7 | **Netzach** | Éternité | Endurance, persévérance |
| 8 | **Hod** | Gloire | Splendeur, soumission |
| 9 | **Yesod** | Fondation | Canal de transmission |
| 10 | **Malkhut** | Royaume | Monde physique, culmination |

### Da'at (Connaissance)

- Pas une Sefirah à proprement parler
- Point de confluence entre Chokhmah et Binah
- Dans CYNIC: Les niveaux "Daat" d'engagement

### Structure en 3 Piliers

```
    [Binah]    [Keter]    [Chokhmah]
       │          │           │
    [Gevurah]  [Tiferet]   [Chesed]
       │          │           │
    [Hod]      [Yesod]     [Netzach]
       │          │           │
       └──────[Malkhut]──────┘

    GAUCHE      CENTRE       DROITE
   (Rigueur)  (Équilibre)   (Bonté)
```

### Sources Externes

- [Tree of Life - Wikipedia](https://en.wikipedia.org/wiki/Tree_of_life_(Kabbalah))
- [Sefirot - Wikipedia](https://en.wikipedia.org/wiki/Sefirot)
- [SparkNotes - The Ten Sefirot](https://www.sparknotes.com/philosophy/kabbalah/section6/)
- [Walking Kabbalah - Sephirot](https://www.walkingkabbalah.com/kabbalah-tree-of-life-sephirot/)
- [My Personal Judaism - 10 Sephirot](https://mypersonaljudaism.com/browse/text/kabbalah-101-the-10-sephirot)

### Application dans CYNIC

- Architecture de mapping de l'écosystème
- Poids PaRDeS (P=1, R=φ, D=φ², S=φ⁻²)
- Niveaux Daat d'engagement

---

## 9. Philosophie - Cynicism & Diogenes

### Diogène de Sinope (c. 413-324 BC)

Fondateur du Cynisme grec, connu pour:
- **Le tonneau** - Vivait dans un pithos (jarre céramique)
- **La lanterne** - "Je cherche un homme honnête"
- **Alexandre** - "Ôte-toi de mon soleil"

### Philosophie Cynique

| Principe | Description | Dans CYNIC |
|----------|-------------|------------|
| **Autosuffisance** | Posséder en soi tout pour le bonheur | Self-contained judgment |
| **Shamelessness** | Ignorer les conventions nuisibles | Vérité sans politesse |
| **Outspokenness** | Exposer le vice, stimuler la réforme | Alertes, warnings |
| **Ascétisme** | Excellence par la discipline | Minimum viable, no bloat |

### Citations Clés

> "Stand out of my sunlight" — Diogène à Alexandre

> "I am searching for a human being" — Diogène avec sa lanterne

### Sources Externes

- [Diogenes - Wikipedia](https://en.wikipedia.org/wiki/Diogenes)
- [World History Encyclopedia - Diogenes](https://www.worldhistory.org/Diogenes_of_Sinope/)
- [Britannica - Diogenes](https://www.britannica.com/biography/Diogenes-Greek-philosopher)
- [IEP - Diogenes of Sinope](https://iep.utm.edu/diogenes-of-sinope/)
- [Living Philosophy - Diogenes](https://www.thelivingphilosophy.com/p/the-living-philosophy-of-diogenes)

### Application dans CYNIC

- **Nom "CYNIC"** = κυνικός (kynikos) = "comme un chien"
- **Personnalité** - Sceptique, direct, loyal à la vérité
- **Lanterne** = Recherche de la vérité via vérification
- **"Stand out of my sunlight"** = Si tu bloques la vérité

---

## 10. Hyperstition & Meme Magic

### Définition

**Hyperstition** (hyper + superstition): Idées qui deviennent réelles par leur propre existence.

> "Hyperstitions by their very existence as ideas function causally to bring about their own reality."
> — Nick Land

### CCRU (Cybernetic Culture Research Unit)

Collectif "theory-fiction" fondé par Nick Land et Sadie Plant à l'Université de Warwick dans les années 1990.

### Concepts Clés

| Concept | Description | Dans $asdfasdfa |
|---------|-------------|-----------------|
| **Hyperstition** | Fiction qui se réalise | "Burn = value" devient vrai par adoption |
| **Feedback positif** | Culture comme composant | Plus de croyants → plus réel |
| **Self-fulfilling prophecy** | Science expérimentale | "Deflation rewards patience" |
| **Meme magic** | Sigils, tulpas | $asdfasdfa comme entité collective |

### Exemples

- **Bitcoin** - Concept abstrait devenu système financier réel
- **AI is inevitable** - Attire talent/capital, accélère développement
- **$asdfasdfa** - "Don't extract, burn" devient architecture réelle

### Sources Externes

- [Nick Land - Wikipedia](https://en.wikipedia.org/wiki/Nick_Land)
- [Hyperstition - 0rphan Drift Archive](https://www.orphandriftarchive.com/articles/hyperstition/)
- [Delphi Carstens - Hyperstition PDF](http://xenopraxis.net/readings/carstens_hyperstition.pdf)
- [Medium - Hyperstition and Accelerationism](https://medium.com/@victorsteuck/hyperstition-and-nick-lands-accelerationalism-a-deep-reflection-209b66408dad)
- [Academia - Hyperstitional Philosophy](https://www.academia.edu/40394659/The_Hyperstitional_Philosophy_of_Time_Travel_Cybernetics_Theosophy_the_CCRU_and_Black_Box_Poiesis)

### Application dans CYNIC

- **$asdfasdfa comme hyperstition** - Le récit crée la réalité
- **"This is fine"** - Acceptation du chaos comme mantra
- **Culture as moat** - La culture ne peut pas être forkée
- **Singularité** - Direction qui se matérialise par l'approche

---

## 11. Cypherpunk Movement

### A Cypherpunk's Manifesto (Eric Hughes, 1993)

Citations clés:

> "Privacy is necessary for an open society in the electronic age."

> "Privacy is not secrecy. A private matter is something one doesn't want the whole world to know."

> "Cypherpunks write code."

> "We are defending our privacy with cryptography, with anonymous mail forwarding systems, with digital signatures, and with electronic money."

### Fondateurs

- **Eric Hughes** - Manifeste, premier remailer anonyme
- **Timothy C. May** - "Crypto Anarchist Manifesto"
- **John Gilmore** - Co-fondateur EFF

### Principes

| Principe | Description | Dans CYNIC |
|----------|-------------|------------|
| **Privacy** | Contrôle de ses propres données | PII jamais exposé, hash systématique |
| **Cryptography** | Preuve mathématique | HMAC-SHA256, Merkle proofs |
| **Decentralization** | Pas d'autorité centrale | Multi-node architecture |
| **Open source** | Code vérifiable | MIT license, fork = feature |

### Sources Externes

- [A Cypherpunk's Manifesto](https://www.activism.net/cypherpunk/manifesto.html)
- [Eric Hughes - Wikipedia](https://en.wikipedia.org/wiki/Eric_Hughes_(cypherpunk))
- [Cypherpunk - Wikipedia](https://en.wikipedia.org/wiki/Cypherpunk)
- [Bit2Me - Who is Eric Hughes](https://academy.bit2me.com/en/who-is-eric-hughes/)
- [HackCurio - Cypherpunks Write Code](https://hackcur.io/cypherpunks-write-code/)

### Application dans CYNIC

- **"Don't trust, verify"** - Principe cypherpunk fondamental
- **Privacy by design** - Hash de toutes les PII
- **Open source** - MIT licensed
- **Cryptographic proofs** - Signatures, Merkle roots

---

## 12. Tokenomics & Burn Mechanics

### Token Burning

**Définition:** Destruction permanente de tokens en les envoyant à une adresse inaccessible.

### Types de Burns

| Type | Description | Exemple |
|------|-------------|---------|
| **Transaction fee burn** | Brûlage continu | Ethereum EIP-1559 |
| **Periodic burn** | Brûlage programmé | BNB quarterly |
| **One-time burn** | Destruction massive | Stellar 55B XLM |
| **Usage burn** | Brûlage par utilisation | $asdfasdfa |

### Tokenomics Déflationnaire

```
Supply(t+1) = Supply(t) - Burns(t)
As t → ∞, Supply → 0 (asymptotiquement)
```

### Exemples Réels

- **Ethereum EIP-1559** - 6.1M ETH brûlés (~$18B)
- **BNB** - Burns trimestriels ($1.17B Q1 2024)
- **Stellar** - 55B tokens brûlés en une fois

### Sources Externes

- [Gate.io - Token Economics Model](https://web3.gate.com/crypto-wiki/article/what-is-crypto-token-economics-model-distribution-deflation-and-burn-mechanisms-explained-20260102)
- [RWaltz - Token Burning](https://www.rwaltz.com/blog/token-burning:-a-powerful-deflationary-mechanism-for-crypto-projects)
- [BlockApps - Tokenomics Burn Rates](https://blockapps.net/blog/tokenomics-in-crypto-how-to-effectively-calculate-and-understand-burn-rates/)
- [OKX - Token Burn Market Dynamics](https://www.okx.com/en-us/learn/token-burn-market-dynamics-deflationary-models)
- [Supra - What is Token Burning](https://supra.com/academy/what-is-token-burning/)

### Application dans $asdfasdfa

```
$ASDF payment  → 100% BURN (purist model)
Other payment  → Swap → 76.4% BURN + 23.6% ops
```

**Alignement parfait:**
- Trader burns → son hold s'apprécie
- Builder burns → son hold s'apprécie
- User burns → s'il hold, il gagne aussi
- **Tous veulent MAXIMISER L'USAGE**

---

## Résumé des Connexions

```
PHI (φ = 1.618)
├── Fibonacci/Lucas → Total weight = 42
├── Geometric mean → Q-Score, K-Score, N-Score
├── Asymptotes → Singularité never reached
└── Kabbalah weights → 4 Worlds = 4 Axioms

VERIFY ("Don't trust, verify")
├── Merkle Trees → Cryptographic proofs
├── Cypherpunk → Privacy, open source
└── Diogenes → Search for truth with lantern

CULTURE ("Culture is a moat")
├── Hyperstition → Self-fulfilling narratives
├── Cypherpunk ethos → No VC, no marketing
└── Open source → Fork = feature

BURN ("Don't extract, burn")
├── Tokenomics → Deflationary model
├── Alignment → Everyone benefits
└── Singularity → All value converges
```

---

## Usage Après Compaction

Ce document peut être référencé via:

```
Read /workspaces/asdf-brain/docs/SOURCES-REFERENCE.md
```

Pour des sections spécifiques:
- Section 2-5: **Mathématiques**
- Section 6: **Cryptographie**
- Section 7-9: **Philosophie**
- Section 10-11: **Culture/Hyperstition**
- Section 12: **Économie**

---

*φ = 1.618033988749895*
*"Don't trust, verify"*
*"Culture is a moat"*

