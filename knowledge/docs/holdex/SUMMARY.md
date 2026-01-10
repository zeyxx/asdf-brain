# HolDex Documentation Summary

> Indexed: 2026-01-09
> Source: /workspaces/HolDex/docs/ (9 files, 3442 lines)

## What is HolDex?

HolDex is a Solana blockchain analytics engine that calculates **K-Score** (token health metrics) with cryptographic data integrity. It serves as the **single source of truth** for the $asdfasdfa ecosystem.

## The Three Scores

### K-Score (Token Health) - 0-100

Formula: `K = 100 × ∛(D × O × L)`

| Pillar | Name | Measures |
|--------|------|----------|
| D | Diamond Hands | Holder conviction (accumulator/extractor ratio) |
| O | Organic Growth | Distribution quality (holder count, top 20 concentration) |
| L | Longevity | Survival factor (age + activity) |

**Scoring Tiers:**
- 80-100: Elite (always accepted)
- 60-79: Trusted
- 50-59: Standard
- 30-49: Caution
- <30: Reject

### E-Score (Participant Engagement)

Formula: `E = geometricMean(7 dimensions) × diversityBonus`

| Dimension | Multiplier | Source |
|-----------|------------|--------|
| HOLD | 1.0 | Token holdings |
| BURN | φ (1.618) | Total burned |
| USE | 1.0 | API calls |
| BUILD | φ² (2.618) | Apps live |
| RUN | φ² (2.618) | Nodes active |
| REFER | φ (1.618) | Referrals |
| TIME | 1.0 | Days active |

**Discount Formula:** `discount = 1 - φ^(-E/25)`
- At E=25: 38.2% discount (= 1/φ²)
- At E=50: 61.8% discount (= 1/φ)
- At E=100: 85.4% discount

### I-Score (Infrastructure Health)

Formula: `I = ∛(D × O × L)` where:
- D: Coverage (signature completeness)
- O: Consistency (cross-node agreement)
- L: Recency (verification freshness)

## Data Integrity System

### 9-Category Signatures (HMAC-SHA256)

| # | Category | Protected Data |
|---|----------|----------------|
| 1 | sig_identity | name, symbol, image, decimals |
| 2 | sig_security | mint/freeze authority, verified |
| 3 | sig_lp | LP burn %, locked % |
| 4 | sig_supply | supply, burned amount |
| 5 | sig_kscore | k_score, conviction_*, holders |
| 6 | sig_market | price, mcap, liquidity |
| 7 | sig_origin | is_pump_fun, bonding_complete |
| 8 | sig_holders | Top 20 holder balances |
| 9 | sig_full | Chain of all sigs + chaos_nonce |

### Integrity Watchdog

- Scans every 5 minutes
- Detects tampering via signature verification
- Auto-restores from Redis snapshots (v3 includes holder data)
- Alerts on detection/healing

## Key API Endpoints

### Token Data
- `GET /api/tokens` - Paginated list
- `GET /api/token/:mint` - Full details
- `GET /api/token/:mint/verify` - Integrity check
- `GET /api/token/:mint/evolution` - K-Score history

### Oracle (GASdf integration)
- `GET /oracle/kscore/:mint` - Token acceptance
- `GET /oracle/escore/:wallet` - E-Score + tier
- `GET /oracle/discount/:wallet/:operation` - Fee calculation
- `POST /oracle/webhook/burns` - Burn notifications

### Webhooks
- `POST /webhook/transfers` - Helius transfer events
- `POST /webhook/new-tokens` - Token discovery (CREATE_POOL, TOKEN_MINT)

## Fee Distribution (φ ratios)

```
Total Fee
    │
    ├─── 38.2% ──► Burn (permanent deflation)
    │
    ├─── 38.2% ──► Rewards (participant distribution)
    │
    └─── 23.6% ──► Treasury (operations)
```

## Multi-Node Architecture

- **Shared**: PostgreSQL, DATA_SIGNING_SECRET
- **Per-node**: Redis (for independent verification)
- **Current nodes**: zeyxx/Render, gcrtrd/Render

## Philosophy

> "Don't Trust, Verify" - $asdfasdfa

1. All data cryptographically signed
2. φ (1.618) guides all ratios
3. Geometric mean ensures balanced scoring
4. 100% burn on $ASDF payments
5. Open formula, verifiable on-chain

## Update Frequencies

| Priority | Volume | Staleness |
|----------|--------|-----------|
| High | >$10K | 2 hours |
| Medium | $500-$10K | 12 hours |
| Low | <$500 | 24 hours |

Community-verified tokens get priority.

## Critical Files

| File | Lines | Purpose |
|------|-------|---------|
| kScoreUpdater.js | 3424 | Core K-Score calculation |
| tokens.js | 2271 | Token API endpoints |
| webhooks.js | ~400 | Helius webhook handlers |
| cardGenerator.js | 1104 | K-Score PNG rendering |
| integrityWatchdog.js | ~500 | Signature verification |

## Environment Variables (Required)

- `DATABASE_URL` - PostgreSQL
- `REDIS_URL` - Cache
- `HELIUS_API_KEY` - Solana RPC
- `DATA_SIGNING_SECRET` - HMAC (min 32 chars)
- `ADMIN_PASSWORD` - Admin API (prod)

---

*This summary is indexed by asdf-brain for quick context injection.*
