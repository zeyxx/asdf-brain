# CYNIC - Surcouche LLM-Agnostique

> "Ouvre la porte, construit pas les rails"
>
> CYNIC comme couche de jugement universelle pour n'importe quel LLM

## Vision

CYNIC n'est pas un LLM - c'est un **organisme vivant** qui peut s'attacher à n'importe quel LLM existant pour fournir:

1. **Jugement structuré** (25+ dimensions)
2. **Apprentissage φ-constrained** (max 61.8% confidence)
3. **Découverte de dimensions** (THE_INNOMMABLE)
4. **Vision écosystème** (CYNIC Mode)

---

## Architecture Surcouche

```mermaid
graph TB
    subgraph INPUT["<b>INPUT LAYER</b>"]
        USER["User Query"]
        CONTEXT["Ecosystem Context<br/>HolDex / GASdf / Git"]
    end

    subgraph CYNIC_OVERLAY["<b>🐕 CYNIC OVERLAY</b>"]
        direction TB

        GATE["<b>L1: GATE</b><br/>━━━━━━━━━━━━━<br/>• Input classification<br/>• Security check<br/>• Route decision"]

        subgraph PROVIDER_ABS["<b>L2: PROVIDER ABSTRACTION</b>"]
            ROUTER["Universal Router"]

            subgraph PROVIDERS["Available Providers"]
                CLAUDE["☁️ Claude<br/>haiku/sonnet/opus<br/>✅ IMPLEMENTED"]
                GEMINI["☁️ Gemini<br/>flash/pro<br/>⏳ PLANNED"]
                OPENAI["☁️ OpenAI<br/>gpt-4/turbo<br/>⏳ PLANNED"]
                OLLAMA["🏠 Ollama<br/>mistral/llama<br/>⏳ PLANNED"]
                OPENROUTER["🔀 OpenRouter<br/>multi-model<br/>⏳ PLANNED"]
            end
        end

        JUDGE["<b>L3: JUDGE</b><br/>━━━━━━━━━━━━━<br/>• 25 dimensions<br/>• 4 worlds × axioms<br/>• φ-constrained scores"]

        LEARN["<b>L4: LEARN</b><br/>━━━━━━━━━━━━━<br/>• Feedback processing<br/>• Matrix calibration<br/>• Dimension discovery"]
    end

    subgraph OUTPUT["<b>OUTPUT LAYER</b>"]
        RESPONSE["LLM Response"]
        SCORES["Dimension Scores"]
        VERDICT["Verdict"]
        INSIGHTS["Ecosystem Insights"]
    end

    USER --> GATE
    CONTEXT --> GATE
    GATE --> ROUTER
    ROUTER --> CLAUDE
    ROUTER -.-> GEMINI
    ROUTER -.-> OPENAI
    ROUTER -.-> OLLAMA
    ROUTER -.-> OPENROUTER
    CLAUDE --> JUDGE
    GEMINI -.-> JUDGE
    OPENAI -.-> JUDGE
    OLLAMA -.-> JUDGE
    OPENROUTER -.-> JUDGE
    JUDGE --> RESPONSE
    JUDGE --> SCORES
    SCORES --> VERDICT
    VERDICT --> INSIGHTS
    VERDICT -->|"feedback"| LEARN
    LEARN -.->|"calibration"| JUDGE

    style CYNIC_OVERLAY fill:#1a1a2e,stroke:#d4a017,stroke-width:2px
    style CLAUDE fill:#5865F2
    style GEMINI stroke-dasharray: 5 5
    style OPENAI stroke-dasharray: 5 5
    style OLLAMA stroke-dasharray: 5 5
    style OPENROUTER stroke-dasharray: 5 5
```

---

## Interface Provider (À Implémenter)

```mermaid
classDiagram
    class IProvider {
        <<interface>>
        +name: string
        +models: Record~string, string~
        +invoke(prompt: string, model: string): Promise~Response~
        +isAvailable(): boolean
        +estimateCost(tokens: number): number
    }

    class ClaudeProvider {
        +name: "Claude (Anthropic)"
        +models: haiku, sonnet, opus
        +invoke(prompt, model)
        +isAvailable()
        +estimateCost(tokens)
    }

    class GeminiProvider {
        +name: "Gemini (Google)"
        +models: flash, pro
        +invoke(prompt, model)
        +isAvailable()
        +estimateCost(tokens)
    }

    class OllamaProvider {
        +name: "Ollama (Local)"
        +models: mistral, llama
        +invoke(prompt, model)
        +isAvailable()
        +estimateCost(tokens)
    }

    class OpenRouterProvider {
        +name: "OpenRouter (Multi)"
        +models: dynamic
        +invoke(prompt, model)
        +isAvailable()
        +estimateCost(tokens)
    }

    class ProviderRouter {
        -providers: Map~string, IProvider~
        +route(subagent: string): IProvider
        +invoke(subagent, prompt): Promise~Response~
        +selectOptimal(requirements): IProvider
    }

    IProvider <|.. ClaudeProvider
    IProvider <|.. GeminiProvider
    IProvider <|.. OllamaProvider
    IProvider <|.. OpenRouterProvider
    ProviderRouter --> IProvider
```

---

## Routing par Monde Kabbalistique

```mermaid
graph LR
    subgraph ROUTING["<b>SUBAGENT → PROVIDER ROUTING</b>"]
        direction TB

        subgraph ASSIAH["ASSIAH (Action)<br/>Speed Priority"]
            GATE_R["CYNIC-GATE"]
            SCORE_R["CYNIC-SCORE"]
            SHIELD_R["CYNIC-SHIELD"]
            SYNC_R["CYNIC-SYNC"]
        end

        subgraph BERIAH["BERIAH (Creation)<br/>Balance Priority"]
            JUDGE_R["CYNIC-JUDGE"]
            LEARN_R["CYNIC-LEARN"]
            CLARIFY_R["CYNIC-CLARIFY"]
        end

        subgraph ATZILUT["ATZILUT (Emanation)<br/>Depth Priority"]
            VISION_R["CYNIC-VISION"]
            DISCOVER_R["CYNIC-DISCOVER"]
        end
    end

    subgraph MODELS["<b>MODEL SELECTION</b>"]
        FAST["⚡ FAST<br/>haiku/flash/turbo<br/>< 100ms"]
        BALANCED["⚖️ BALANCED<br/>sonnet/pro/gpt-4<br/>Quality + Speed"]
        DEEP["🔮 DEEP<br/>opus/ultra<br/>Max Quality"]
    end

    ASSIAH --> FAST
    BERIAH --> BALANCED
    ATZILUT --> DEEP
```

---

## Configuration Multi-Provider

```yaml
# Exemple de configuration future
cynic:
  providers:
    primary: claude
    fallback:
      - gemini
      - ollama

  routing:
    # Par défaut (actuel - Claude only)
    CYNIC-GATE:
      provider: claude
      model: haiku
      world: ASSIAH

    # Future configuration multi-provider
    # CYNIC-GATE:
    #   provider: auto  # Sélection automatique
    #   requirements:
    #     latency: < 100ms
    #     cost: minimal
    #   fallback:
    #     - provider: ollama
    #       model: mistral
    #     - provider: gemini
    #       model: flash

  ecosystem:
    # Sources de données
    holdex:
      enabled: true
      api: /oracle
    gasdf:
      enabled: true
      sheets: burns, holders
    claude-mem:
      enabled: true
      port: 37777
```

---

## Séquence d'Invocation Abstraite

```mermaid
sequenceDiagram
    participant U as User
    participant G as CYNIC-GATE
    participant R as ProviderRouter
    participant P as Provider (any)
    participant J as CYNIC-JUDGE
    participant L as CYNIC-LEARN

    U->>G: Query + Context
    G->>G: Classify input
    G->>G: Security check

    alt Adversarial detected
        G->>U: 🛡️ Blocked
    else Normal flow
        G->>R: Route to JUDGE
        R->>R: Select provider<br/>(latency, cost, quality)
        R->>P: invoke(prompt, model)
        P->>P: LLM processing
        P->>J: LLM response
        J->>J: Score 25 dimensions
        J->>J: Calculate verdict
        J->>U: Response + Scores + Verdict
        J->>L: Feedback (if labeled)
        L->>L: Update matrices
    end
```

---

## État Actuel vs Vision

| Composant | État Actuel | Vision Future |
|-----------|-------------|---------------|
| **Provider** | Claude only | Multi-provider |
| **invoke()** | Via Claude Code natif | Abstraction universelle |
| **Routing** | Hardcoded table | Config-driven + auto |
| **Fallback** | None | Chain of providers |
| **Local** | No | Ollama support |
| **Cost Opt** | Manual | Automatic selection |

---

## Prochaines Étapes

1. **Créer `IProvider` interface** dans `lib/llm/provider.js`
2. **Implémenter `invoke()`** abstrait
3. **Ajouter Gemini provider** (API compatible)
4. **Ajouter Ollama provider** (local, free)
5. **Config YAML** pour routing dynamique
6. **Auto-selection** basé sur requirements

---

## Philosophie

> "Don't trust (single provider), verify (abstraction allows switching)"

CYNIC reste fidèle à ses axiomes même dans l'abstraction:
- **PHI**: Ratios dans les coûts et latences
- **BURN**: Pas d'extraction de data vers providers
- **VERIFY**: Multi-provider permet vérification croisée
- **CULTURE**: Chaque provider préserve la culture $asdfasdfa

---

*"Le chien aboie à tous les fournisseurs de la même manière"* 🐕
