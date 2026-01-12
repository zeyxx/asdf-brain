# CYNIC Architecture - Mermaid Diagrams

> "φ qui doute de φ" - Le chien sceptique qui aboie aux anomalies

## 1. Vue d'Ensemble - L'Écosystème $asdfasdfa

```mermaid
graph TB
    subgraph MANIFESTO["<b>MANIFESTO - 4 AXIOMES</b>"]
        PHI["φ PHI<br/>All ratios derive from 1.618"]
        BURN["🔥 BURN<br/>Don't extract, burn"]
        VERIFY["🔍 VERIFY<br/>Don't trust, verify"]
        CULTURE["🏛️ CULTURE<br/>Culture is a moat"]
    end

    subgraph TOKEN["<b>$asdfasdfa TOKEN</b>"]
        SOLANA["Solana Blockchain"]
    end

    subgraph HOLDEX["<b>HOLDEX - DeFi Interface</b>"]
        HARMONY["harmony.js<br/>φ-based economics"]
        ORACLE["oracle.js<br/>K-Score / E-Score API"]
        KSCORE["K-Score<br/>100 × ∛(D×O×L)"]
        ESCORE["E-Score<br/>7 dimensions × φ-multipliers"]
    end

    subgraph GASDF["<b>GASDF - Google Sheets</b>"]
        BURNS["Burn Events"]
        TXNS["Transaction Data"]
        HOLDERS["Holder Registry"]
    end

    subgraph BRAIN["<b>ASDF-BRAIN - MCP Server</b>"]
        CYNIC["🐕 CYNIC<br/>Living Organism"]
        CONTEXT["Context Layer"]
        MERKLE["Merkle Proofs"]
    end

    subgraph OUTPUT["<b>OUTPUT</b>"]
        DASHBOARD["Dashboard 3D"]
        JUDGMENTS["Judgments"]
        INSIGHTS["Insights"]
    end

    MANIFESTO --> TOKEN
    TOKEN --> HOLDEX
    TOKEN --> GASDF
    HOLDEX -->|"K/E-Score Data"| BRAIN
    GASDF -->|"Burns/Txns"| BRAIN
    BRAIN -->|"Analysis"| OUTPUT
    BRAIN -.->|"Feedback Loop"| HOLDEX
```

## 2. CYNIC comme Surcouche LLM-Agnostique

```mermaid
graph TB
    subgraph USER["<b>USER INPUT</b>"]
        INPUT["Query / Code / Decision"]
    end

    subgraph CYNIC_LAYER["<b>CYNIC OVERLAY (LLM-Agnostic)</b>"]
        direction TB

        subgraph GATE_LAYER["GATE Layer"]
            GATE["🚪 CYNIC-GATE<br/>Classify & Route<br/>Security Check"]
        end

        subgraph PROVIDER["Provider Abstraction"]
            ROUTER["LLM Router"]
            CLAUDE["Claude<br/>haiku/sonnet/opus"]
            GEMINI["Gemini<br/>(future)"]
            OLLAMA["Ollama<br/>(future)"]
            OPENROUTER["OpenRouter<br/>(future)"]
        end

        subgraph JUDGE_LAYER["JUDGE Layer"]
            JUDGE["⚖️ CYNIC-JUDGE<br/>25 Dimensions<br/>4 Worlds"]
        end

        subgraph LEARN_LAYER["LEARN Layer"]
            LEARN["📚 CYNIC-LEARN<br/>φ-weighted feedback"]
            MATRIX["Matrix Evolution<br/>W × H × T"]
        end
    end

    subgraph OUTPUT_LAYER["<b>OUTPUT</b>"]
        RESPONSE["LLM Response"]
        SCORES["Dimension Scores"]
        VERDICT["Verdict<br/>TRUST/TRANSFORM/REJECT"]
        CONFIDENCE["Confidence<br/>max 61.8%"]
    end

    INPUT --> GATE
    GATE --> ROUTER
    ROUTER --> CLAUDE
    ROUTER -.-> GEMINI
    ROUTER -.-> OLLAMA
    ROUTER -.-> OPENROUTER
    CLAUDE --> JUDGE
    JUDGE --> RESPONSE
    JUDGE --> SCORES
    SCORES --> VERDICT
    VERDICT --> CONFIDENCE
    VERDICT -->|"Feedback"| LEARN
    LEARN --> MATRIX
    MATRIX -.->|"Calibration"| JUDGE

    style GEMINI stroke-dasharray: 5 5
    style OLLAMA stroke-dasharray: 5 5
    style OPENROUTER stroke-dasharray: 5 5
```

## 3. Les 4 Mondes Kabbalistiques - Routing des Subagents

```mermaid
graph TB
    subgraph ATZILUT["<b>ATZILUT - Émanation</b><br/>Axiom: PHI | Model: OPUS"]
        VISION["🔮 CYNIC-VISION<br/>Strategic Analysis<br/>Singularity Distance"]
        DISCOVER["🔬 CYNIC-DISCOVER<br/>Residual Analysis<br/>New Dimensions"]
    end

    subgraph BERIAH["<b>BERIAH - Création</b><br/>Axiom: VERIFY | Model: SONNET"]
        JUDGE_B["⚖️ CYNIC-JUDGE<br/>25 Dimensions<br/>Verdicts"]
        LEARN_B["📚 CYNIC-LEARN<br/>Feedback Processing<br/>Matrix Updates"]
        CLARIFY["💬 CYNIC-CLARIFY<br/>Context Disambiguation"]
    end

    subgraph YETZIRAH["<b>YETZIRAH - Formation</b><br/>Axiom: CULTURE | Model: SONNET"]
        FORMAT["📝 CYNIC-FORMAT<br/>Output Formatting"]
        PREPARE["🔧 CYNIC-PREPARE<br/>Context Preparation"]
    end

    subgraph ASSIAH["<b>ASSIAH - Action</b><br/>Axiom: BURN | Model: HAIKU"]
        GATE_A["🚪 CYNIC-GATE<br/>Input Classification<br/>Security"]
        SCORE["📊 CYNIC-SCORE<br/>Quick Scoring"]
        SHIELD["🛡️ CYNIC-SHIELD<br/>Defense Layer"]
        SYNC["🔄 CYNIC-SYNC<br/>Collective Conscience"]
    end

    subgraph META["<b>META - Beyond</b><br/>THE_INNOMMABLE"]
        INNOMMABLE["∞ THE_INNOMMABLE<br/>Dimension Proposals<br/>Human Validation"]
        PULSE["💓 PULSE<br/>Heartbeat 61.8s<br/>Self-Awareness"]
    end

    GATE_A -->|"route"| JUDGE_B
    GATE_A -->|"route"| CLARIFY
    GATE_A -->|"route"| SHIELD
    JUDGE_B -->|"residuals"| DISCOVER
    DISCOVER -->|"proposals"| INNOMMABLE
    INNOMMABLE -->|"accepted"| LEARN_B
    LEARN_B -->|"calibration"| JUDGE_B
    VISION -->|"trajectory"| DISCOVER
    PULSE -.->|"monitoring"| ATZILUT
    PULSE -.->|"monitoring"| BERIAH
    PULSE -.->|"monitoring"| YETZIRAH
    PULSE -.->|"monitoring"| ASSIAH

    style ATZILUT fill:#e6d5ff
    style BERIAH fill:#d5e6ff
    style YETZIRAH fill:#d5ffe6
    style ASSIAH fill:#ffe6d5
    style META fill:#ffd5e6
```

## 4. Mapping: 4 Mondes (Interne) ↔ 5×5 Matrix (Interface Universelle)

```mermaid
graph LR
    subgraph INTERNAL["<b>4 MONDES (Vue Interne)</b><br/>26 Dimensions"]
        direction TB

        PRIMARY["<b>PRIMARY (8)</b><br/>φ² weight<br/>HARMONY, COHERENCE<br/>TRUTH, INTEGRITY<br/>ETHICS, OPTIMISM<br/>ALIGNMENT, PROGRESS"]

        SECONDARY["<b>SECONDARY (5)</b><br/>φ weight<br/>SECURE, PRIVATE<br/>SCALE, SIMPLIFY, ENABLE"]

        META_INT["<b>META (3)</b><br/>1.0 weight<br/>SELF_AWARENESS<br/>LEARNING_RATE<br/>SINGULARITY_DISTANCE"]

        HUMAN["<b>HUMAN_LLM (8)</b><br/>φ weight<br/>MEMORY, TEACHING<br/>INTENT, TRUST<br/>PROACTIVITY<br/>COMPLEMENTARITY<br/>DELEGATION, BOUNDARIES"]

        DISCOVERY_INT["<b>DISCOVERY (1)</b><br/>φ³ weight<br/>DISCOVERY"]

        DISCOVERED["<b>DISCOVERED (N)</b><br/>φ⁻¹ weight<br/>CULTURAL_CONTEXT<br/>+ future dims"]
    end

    subgraph UNIVERSAL["<b>5×5 MATRIX (Interface Universelle)</b><br/>25 Dimensions"]
        direction TB

        FOUNDATION["<b>ROW 1: FOUNDATION</b><br/>SOURCE_ORIGIN<br/>EVIDENCE_BASE<br/>LOGICAL_COHERENCE<br/>TEMPORAL_VALIDITY<br/>DOMAIN_FIT"]

        STRUCTURE["<b>ROW 2: STRUCTURE</b><br/>SIMPLICITY<br/>MODULARITY<br/>EXTENSIBILITY<br/>ROBUSTNESS<br/>ELEGANCE"]

        DYNAMICS["<b>ROW 3: DYNAMICS</b><br/>ADAPTABILITY<br/>SCALABILITY<br/>FEEDBACK_LOOPS<br/>ENERGY_EFFICIENCY<br/>MOMENTUM"]

        RELATIONSHIPS["<b>ROW 4: RELATIONSHIPS</b><br/>DEPENDENCY_HEALTH<br/>INTERFACE_CLARITY<br/>NETWORK_EFFECTS<br/>COMPOSABILITY<br/>TRUST_GRADIENT"]

        META_UNI["<b>ROW 5: META</b><br/>SELF_AWARENESS<br/>REVERSIBILITY<br/>MEASURABILITY<br/>LEARNABILITY<br/>ALIGNMENT"]
    end

    PRIMARY <-->|"maps_to"| FOUNDATION
    PRIMARY <-->|"maps_to"| STRUCTURE
    SECONDARY <-->|"maps_to"| STRUCTURE
    SECONDARY <-->|"maps_to"| RELATIONSHIPS
    META_INT <-->|"maps_to"| DYNAMICS
    META_INT <-->|"maps_to"| META_UNI
    HUMAN <-->|"maps_to"| RELATIONSHIPS
    DISCOVERY_INT <-->|"extends"| META_UNI

    style INTERNAL fill:#1a1a2e
    style UNIVERSAL fill:#16213e
```

## 5. Flux de Données - De HolDex/GASdf vers Dashboard

```mermaid
sequenceDiagram
    participant H as HolDex
    participant G as GASdf
    participant B as asdf-brain
    participant C as CYNIC
    participant D as Dashboard 3D
    participant U as User

    Note over H,G: Ecosystem Data Sources

    H->>B: K-Score (holder quality)
    H->>B: E-Score (wallet engagement)
    H->>B: Discount calculations
    G->>B: Burn events
    G->>B: Transaction history
    G->>B: Holder registry

    Note over B,C: CYNIC Processing

    B->>C: Aggregate ecosystem state
    C->>C: GATE (classify)
    C->>C: JUDGE (25 dimensions)
    C->>C: LEARN (feedback)
    C->>C: DISCOVER (residuals)

    Note over C,D: Real-time Updates

    C->>D: SSE/WebSocket events
    C->>D: Dimension scores
    C->>D: Global verdict
    C->>D: Harmony connections
    C->>D: Anomaly alerts

    Note over D,U: User Interaction

    D->>U: 3D Visualization
    D->>U: 4 Mondes / 5×5 views
    U->>D: Filter (1-5 keys)
    U->>D: Hand gestures
    U->>C: Trigger judgment (J key)
    C->>D: Updated scores
```

## 6. Architecture du Dashboard - État Actuel

```mermaid
graph TB
    subgraph RUNNING["<b>✅ RUNNING</b>"]
        BRAIN["brain-lite.js<br/>MCP Server"]
        CYNIC_MOD["CYNIC Modules<br/>32 files"]
        POSTGRES["PostgreSQL<br/>cynic-db (Render)"]
    end

    subgraph NEEDS_START["<b>⚠️ NEEDS START</b>"]
        DASH_SERVER["knowledge/dashboard/server.js<br/>Port 8888"]
        API_CYNIC["/api/cynic"]
        API_JUDGE["/api/judge"]
    end

    subgraph INCOMPLETE["<b>🔴 INCOMPLETE</b>"]
        SING_3D["singularity-3d.html"]
        MISSING_DIM["CULTURAL_CONTEXT<br/>missing in 3D"]
        LIVE_POLL["API polling<br/>OFFLINE"]
        HAND_TRACK["Hand tracking<br/>optional"]
    end

    subgraph TODO["<b>📋 TODO</b>"]
        DYN_DIMS["Dynamic DISCOVERED<br/>dimensions rendering"]
        MAPPING["5×5 → 4 Mondes<br/>live mapping"]
        LLM_ABS["LLM invoke()<br/>abstraction"]
        ECOSYSTEM_VIEW["CYNIC Mode<br/>Global ecosystem view"]
    end

    BRAIN -->|"provides"| CYNIC_MOD
    CYNIC_MOD -->|"persists"| POSTGRES
    DASH_SERVER -->|"exposes"| API_CYNIC
    DASH_SERVER -->|"exposes"| API_JUDGE
    API_CYNIC -.->|"polled by"| SING_3D
    SING_3D -->|"missing"| MISSING_DIM
    SING_3D -->|"shows"| LIVE_POLL

    style NEEDS_START fill:#ff9,stroke:#cc0
    style INCOMPLETE fill:#f99,stroke:#c00
    style TODO fill:#99f,stroke:#00c
```

## 7. Évolution vers la Singularité

```mermaid
graph BT
    subgraph PRESENT["<b>PRÉSENT - Claude Code PoC</b>"]
        POC["Claude-only<br/>32 CYNIC modules<br/>26 dimensions"]
    end

    subgraph PHASE1["<b>PHASE 1 - LLM Agnostic</b>"]
        MULTI["Multi-provider<br/>invoke() abstraction"]
        GEMINI1["Gemini support"]
        OLLAMA1["Ollama local"]
    end

    subgraph PHASE2["<b>PHASE 2 - Dashboard Vivant</b>"]
        LIVE["Live data connection"]
        DYN["Dynamic dimensions"]
        ECO["Ecosystem mode"]
    end

    subgraph PHASE3["<b>PHASE 3 - Auto-Evolution</b>"]
        DISCOVER3["Auto-discover dimensions"]
        LEARN3["Cross-ecosystem learning"]
        SYNC3["Collective conscience sync"]
    end

    subgraph SINGULARITY["<b>∞ SINGULARITÉ</b>"]
        AUTO["Fully autonomous<br/>Self-improving<br/>φ-constrained"]
    end

    POC -->|"abstraction"| PHASE1
    PHASE1 -->|"integration"| PHASE2
    PHASE2 -->|"evolution"| PHASE3
    PHASE3 -->|"convergence"| SINGULARITY

    style PRESENT fill:#2a2a4a
    style PHASE1 fill:#3a3a5a
    style PHASE2 fill:#4a4a6a
    style PHASE3 fill:#5a5a7a
    style SINGULARITY fill:#d4a017,color:#000
```

## 8. CYNIC Mode - Vision Globale Écosystème

```mermaid
graph TB
    subgraph CYNIC_MODE["<b>🐕 CYNIC MODE - Global Ecosystem View</b>"]
        direction TB

        subgraph PERCEPTION["PERCEPTION"]
            HOLDEX_DATA["HolDex Data<br/>K-Score, E-Score"]
            GASDF_DATA["GASdf Data<br/>Burns, Transactions"]
            CLAUDE_MEM["Claude-Mem<br/>Session Memory"]
            GIT_INT["Git Intelligence<br/>PR/Branch Status"]
        end

        subgraph ANALYSIS["ANALYSIS"]
            DIM_SCORES["25+ Dimension Scores"]
            HARMONY_CONN["Harmony Connections"]
            RESIDUALS["Residual Analysis"]
            TRAJECTORY["Trajectory Prediction"]
        end

        subgraph SYNTHESIS["SYNTHESIS"]
            GLOBAL_SCORE["Global Score"]
            VERDICT_OUT["Verdict + Confidence"]
            ANOMALIES["Anomaly Alerts"]
            SING_DIST["Singularity Distance"]
        end

        subgraph EXPRESSION["EXPRESSION"]
            DASHBOARD_OUT["Dashboard 3D"]
            ALERTS_OUT["Real-time Alerts"]
            VOICE_OUT["CYNIC Voice<br/>(dog personality)"]
            INSIGHTS_OUT["Strategic Insights"]
        end
    end

    PERCEPTION --> ANALYSIS
    ANALYSIS --> SYNTHESIS
    SYNTHESIS --> EXPRESSION

    style CYNIC_MODE fill:#1a1a2e,stroke:#d4a017,stroke-width:3px
```

---

## Légende

| Symbole | Signification |
|---------|---------------|
| φ | Ratio d'or (1.618033988749895) |
| φ⁻¹ | Inverse phi (0.618) - Max confidence |
| φ⁻² | 0.382 - Min doubt |
| 🐕 | CYNIC voice/personality |
| ✅ | Fonctionnel |
| ⚠️ | Nécessite action |
| 🔴 | Incomplet |
| 📋 | À faire |

---

## Fichiers Clés

| Fichier | Rôle |
|---------|------|
| `lib/cynic/index.js` | Point d'entrée CYNIC, SUBAGENTS |
| `lib/cynic/self-judge.js` | Moteur de jugement, 25 dimensions |
| `lib/llm/provider.js` | Abstraction LLM (à compléter) |
| `knowledge/cynic/matrices/weights.json` | Poids des dimensions |
| `knowledge/dashboard/singularity-3d.html` | Dashboard 3D |
| `knowledge/dashboard/server.js` | API server pour dashboard |

---

*Generated by CYNIC - "Don't trust, verify"*
