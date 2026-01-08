# Contributing to asdf-brain

> *"Don't trust, verify. Don't extract, burn."*

Welcome to the collective knowledge system of the $asdfasdfa ecosystem. This document guides contributors through the philosophy and process of adding to the brain.

## Philosophy

asdf-brain operates on **cypherpunk principles**:
- Zero telemetry, zero tracking
- All contributions are cryptographically hashed
- Knowledge provenance is tracked for on-chain verification
- The golden ratio (φ) guides all weighting

### PaRDeS Framework

All knowledge is organized in four layers:

| Level | Name | Content |
|-------|------|---------|
| **P** | P'shat (Simple) | Raw data, indexes, search results |
| **R** | Remez (Allusion) | Patterns, connections, dependencies |
| **D** | Drash (Research) | Intent, philosophy alignment, decisions |
| **S** | Sod (Secret) | Vision, unified truth, ecosystem direction |

## Getting Started

### 1. Register as Contributor

Your entry is added to `knowledge/provenance/registry.json`:

```json
{
  "your-handle": {
    "id": "your-handle",
    "handle": "Your Display Name",
    "trust_level": "contributor",
    "context": "brain",
    "joined": "YYYY-MM-DD",
    "pubkey": null,
    "contributions": 0,
    "areas": ["asdf-brain"]
  }
}
```

### 2. Understand the Structure

```
knowledge/
├── philosophy/      # Manifesto alignment (D layer)
├── intent/          # Extracted intentions (D layer)
├── patterns/        # Code patterns (R layer)
├── errors/          # Post-mortems (P layer)
├── temporal/        # Evolution tracking (R layer)
├── dependencies/    # Dependency graphs (R layer)
├── vision/          # Roadmap, future (S layer)
├── health/          # Ecosystem metrics (P layer)
├── relations/       # Ecosystem graph (R layer)
└── provenance/      # Contribution tracking (meta)
```

### 3. Making Contributions

#### Knowledge Files
- All knowledge is JSON format
- Include `_metadata` with version and contributor info
- Follow existing schema patterns

#### Code Contributions
- Follow cypherpunk principles (no telemetry)
- Use φ weighting where applicable
- Add JSDoc comments with philosophy references

## Contribution Types

### Knowledge Contribution
Adding to the collective memory:

```bash
# After modifying knowledge files
npm run brain:merkle  # Update Merkle state
```

### Pattern Extraction
Identifying patterns across the ecosystem:

```bash
npm run brain:patterns
```

### Intent Documentation
Recording decisions and their reasoning:

```bash
npm run brain:intent
```

## On-Chain Readiness

All contributions are hashed and included in the Merkle tree. This prepares for:
- On-chain verification of knowledge state
- Contributor attribution via Solana
- Trustless knowledge validation

### Merkle Verification

```bash
# Compute current state
npm run brain:merkle

# Verify a specific file
npm run brain:verify path/to/file.json
```

## Trust Levels

| Level | φ Weight | Description |
|-------|----------|-------------|
| **core** | 2.618 (φ²) | Founding contributors |
| **contributor** | 1.618 (φ) | Active trusted contributors |
| **community** | 1.0 | Community contributions |

Trust is earned through consistent, aligned contributions.

## Code of Conduct

1. **Verify, don't trust** - All claims need evidence
2. **Burn, don't extract** - Contribute to the collective, not personal gain
3. **Align with philosophy** - Understand the manifesto
4. **Document intent** - Explain the "why" not just the "what"
5. **Respect the ratio** - φ guides distribution

## Tools

### MCP Server (brain-lite)
Lightweight integration for Claude:
```bash
npm run lite
```

### Full Server
HTTP API for ecosystem:
```bash
npm run start
```

### Health Check
Verify ecosystem state:
```bash
npm run brain:health
```

## Questions?

- Read the manifesto: `asdf-manifesto/`
- Check existing patterns: `knowledge/patterns/`
- Review the ecosystem graph: `knowledge/relations/ecosystem-graph.json`

---

*"This is fine."* - The transformation continues.
