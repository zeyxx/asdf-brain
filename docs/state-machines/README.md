# Ecosystem State Machine Diagrams

> Generated 2026-01-10 - Comprehensive mapping of all system flows.

## Purpose

These diagrams map **every path** through the system, including:
- Happy paths
- Error states and recovery
- Retry logic
- External dependencies
- File I/O

## Components

| Component | File | Diagrams |
|-----------|------|----------|
| **GASdf** | [gasdf-flows.md](./gasdf-flows.md) | Quote, Submit, Burn |
| **HolDex** | [holdex-flows.md](./holdex-flows.md) | Discovery, K-Score, Prices |
| **Brain** | [brain-flows.md](./brain-flows.md) | Ingestion, Search, Context, Provenance |

## Key Patterns

### φ-Ratios Throughout
- **61.8%** (φ⁻¹): Dominant threshold, max confidence
- **38.2%** (φ⁻²): Mixed boundary, doubt floor
- **23.6%** (φ⁻³): Research threshold
- **76.4%**: Burn rate (1 - φ⁻³)

### CYNIC Philosophy
- Max confidence: 61.8% (never 100%)
- Min doubt: 38.2%
- "Don't trust, verify"

### External Dependencies

```
GASdf:
├── Redis (quotes, replay protection, locks)
├── Helius (priority fees)
├── Jupiter (swaps, pricing)
├── HolDex (K-score verification)
├── Jito (MEV protection)
└── Solana RPC (submit, confirm)

HolDex:
├── Redis (cache, queues, circuit breaker)
├── PostgreSQL (tokens, snapshots)
├── Helius (webhooks, RPC)
├── Raydium (prices - free)
├── Jupiter (prices - fallback)
└── Metaplex (metadata)

Brain:
├── JSONL files (knowledge storage)
├── JSON files (indexes, config)
└── HMAC-SHA256 (signing)
```

## Viewing Diagrams

These use Mermaid syntax. View with:
- GitHub (native rendering)
- VS Code + Mermaid extension
- https://mermaid.live

## Updating

When modifying system flows:
1. Update the relevant diagram
2. Verify all paths are mapped
3. Check error handling coverage
4. Update external dependencies list
