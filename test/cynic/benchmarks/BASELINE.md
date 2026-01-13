# CYNIC Performance Baseline

**Date**: 2026-01-13
**Platform**: Linux (Codespaces)
**Node**: v24.12.0

## Results

| Benchmark | ops/sec | mean (ms) | p99 (ms) | Target | Status |
|-----------|---------|-----------|----------|--------|--------|
| Simple judgment | 1,200 | 0.83 | 5.19 | < 50ms | ✅ PASS |
| Complex judgment | 1,248 | 0.80 | - | < 50ms | ✅ PASS |
| Minimal judgment | 1,542 | 0.65 | - | < 50ms | ✅ PASS |
| n=3 scaled (QUICK) | 1,028 | 0.97 | 3.46 | < 150ms | ✅ PASS |
| n=5 scaled (STANDARD) | ~770 | ~1.3 | - | < 150ms | ✅ PASS |
| n=8 scaled (THOROUGH) | ~608 | ~1.6 | - | < 200ms | ✅ PASS |
| All 24 dimensions | 26,668 | 0.037 | 0.067 | < 5ms | ✅ PASS |
| Single dimension | 758,500 | 0.0013 | - | < 5ms | ✅ PASS |
| World coherence | 1,965 | 0.51 | 3.32 | < 50ms | ✅ PASS |
| Batch of 10 | 360 | 2.78 | 8.75 | < 30ms | ✅ PASS |

## Performance Comparison

- `minimal` 1.04x faster than `complex`
- `minimal` 1.29x faster than `simple`
- `n=3` 1.33x faster than `n=5`
- `n=3` 1.69x faster than `n=8`
- Single dimension 28.44x faster than all 24 dimensions

## φ-Aligned Observations

- Mean judgment time: **0.83ms** (sub-millisecond)
- Scaling overhead: **~0.14ms per sample** (linear)
- Dimension evaluation: **~0.0016ms per dimension**
- All targets exceeded by significant margins

## Notes

- Benchmarks run with vitest bench (experimental)
- Results include console logging overhead
- Actual production performance may be better without logging
