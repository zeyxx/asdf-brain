/**
 * I_infra Live Monitoring Service
 *
 * "Infrastructure is the foundation - when it fails, everything fails"
 *
 * Monitors Solana infrastructure token health:
 * - SOL (baseline)
 * - USDC, USDT (stablecoins)
 * - JitoSOL, mSOL, bSOL (LSTs)
 *
 * I_infra = 100 × ∛(D_liquidity × O_oracle × L_reliability)
 *
 * @philosophy Yesod (foundation) must be solid for the tree to stand
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const temporal = require('./temporal');

// φ constants
const PHI = temporal.PHI;
const PHI_INV = temporal.PHI_INV;
const PHI_INV_2 = temporal.PHI_INV_2;
const PHI_INV_3 = temporal.PHI_INV_3;

// Infrastructure tokens configuration
const INFRA_TOKENS = {
    SOL: {
        mint: 'So11111111111111111111111111111111111111112',
        name: 'Solana',
        type: 'native',
        phi_weight: PHI * PHI,  // 2.618 - highest weight
        baseline: true
    },
    USDC: {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        name: 'USD Coin',
        type: 'stablecoin',
        phi_weight: PHI,  // 1.618
        peg_target: 1.0
    },
    USDT: {
        mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        name: 'Tether USD',
        type: 'stablecoin',
        phi_weight: 1.0,
        peg_target: 1.0
    },
    JitoSOL: {
        mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        name: 'Jito Staked SOL',
        type: 'lst',
        phi_weight: PHI_INV,  // 0.618
        underlying: 'SOL'
    },
    mSOL: {
        mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
        name: 'Marinade Staked SOL',
        type: 'lst',
        phi_weight: PHI_INV,  // 0.618
        underlying: 'SOL'
    },
    bSOL: {
        mint: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
        name: 'BlazeStake Staked SOL',
        type: 'lst',
        phi_weight: PHI_INV_2,  // 0.382
        underlying: 'SOL'
    },
    wSOL: {
        mint: 'So11111111111111111111111111111111111111112',  // Same as SOL
        name: 'Wrapped SOL',
        type: 'wrapped',
        phi_weight: PHI,  // 1.618
        underlying: 'SOL'
    }
};

// Configuration
const CONFIG = {
    KNOWLEDGE_DIR: path.join(__dirname, '../knowledge'),
    MONITOR_FILE: 'live/i-infra-status.json',
    ALERTS_FILE: 'live/i-infra-alerts.jsonl',
    CHECK_INTERVAL_MS: 5 * 60 * 1000,  // 5 minutes

    // Thresholds (φ-based)
    THRESHOLDS: {
        CRITICAL: PHI_INV_3 * 100,     // 23.6 - Critical alert
        WARNING: PHI_INV_2 * 100,       // 38.2 - Warning
        HEALTHY: PHI_INV * 100,         // 61.8 - Healthy
        OPTIMAL: 100                     // 100 - Optimal
    },

    // APIs (placeholders - implement with actual RPC/APIs)
    RPC_ENDPOINT: process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
    JUPITER_API: 'https://price.jup.ag/v4'
};

/**
 * Calculate D_liquidity score
 * Based on available liquidity depth and slippage
 *
 * @param {Object} liquidityData - Liquidity metrics
 * @returns {number} - D score (0-1)
 */
function calculateDLiquidity(liquidityData) {
    const {
        total_liquidity = 0,
        depth_at_1pct = 0,      // Liquidity available at 1% slippage
        spread = 0.01,          // Bid-ask spread
        num_pools = 1
    } = liquidityData;

    // Normalize each component
    const liquidityScore = Math.min(1, total_liquidity / 10000000);  // $10M baseline
    const depthScore = Math.min(1, depth_at_1pct / 1000000);          // $1M depth baseline
    const spreadScore = Math.max(0, 1 - spread * 10);                 // Lower spread is better
    const poolScore = Math.min(1, num_pools / 10);                    // Diversification

    // Weighted combination
    return (liquidityScore * 0.3) + (depthScore * 0.3) + (spreadScore * 0.2) + (poolScore * 0.2);
}

/**
 * Calculate O_oracle score
 * Based on oracle coverage and freshness
 *
 * @param {Object} oracleData - Oracle metrics
 * @returns {number} - O score (0-1)
 */
function calculateOOracle(oracleData) {
    const {
        num_oracles = 1,
        freshness_seconds = 60,
        confidence = 0.95,
        deviation_from_consensus = 0
    } = oracleData;

    // Normalize each component
    const coverageScore = Math.min(1, num_oracles / 5);               // 5 oracles = max
    const freshnessScore = Math.max(0, 1 - freshness_seconds / 300);  // 5 min = 0
    const confidenceScore = confidence;
    const consensusScore = Math.max(0, 1 - deviation_from_consensus * 10);

    // Weighted combination
    return (coverageScore * 0.25) + (freshnessScore * 0.25) + (confidenceScore * 0.25) + (consensusScore * 0.25);
}

/**
 * Calculate L_reliability score
 * Based on historical uptime and stability
 *
 * @param {Object} reliabilityData - Reliability metrics
 * @returns {number} - L score (0-1)
 */
function calculateLReliability(reliabilityData) {
    const {
        uptime_7d = 1.0,        // 7-day uptime ratio
        incidents_30d = 0,      // Incidents in last 30 days
        age_days = 365,         // Token age in days
        peg_stability = 1.0     // For stablecoins: how close to peg
    } = reliabilityData;

    // Normalize each component
    const uptimeScore = uptime_7d;
    const incidentScore = Math.max(0, 1 - incidents_30d * 0.2);       // Each incident = -20%
    const ageScore = Math.min(1, age_days / 365);                      // 1 year = max
    const stabilityScore = peg_stability;

    // Weighted combination
    return (uptimeScore * 0.3) + (incidentScore * 0.3) + (ageScore * 0.2) + (stabilityScore * 0.2);
}

/**
 * Calculate I_infra score for a token
 * I_infra = 100 × ∛(D × O × L)
 *
 * @param {string} symbol - Token symbol
 * @param {Object} metrics - All metrics
 * @returns {Object} - I_infra calculation result
 */
function calculateIInfra(symbol, metrics) {
    const D = calculateDLiquidity(metrics.liquidity || {});
    const O = calculateOOracle(metrics.oracle || {});
    const L = calculateLReliability(metrics.reliability || {});

    // I_infra = 100 × ∛(D × O × L)
    const iInfra = 100 * Math.cbrt(D * O * L);

    // Determine status
    let status;
    if (iInfra >= CONFIG.THRESHOLDS.HEALTHY) {
        status = 'HEALTHY';
    } else if (iInfra >= CONFIG.THRESHOLDS.WARNING) {
        status = 'WARNING';
    } else if (iInfra >= CONFIG.THRESHOLDS.CRITICAL) {
        status = 'CRITICAL';
    } else {
        status = 'FAILED';
    }

    return {
        symbol,
        i_infra: Math.round(iInfra * 100) / 100,
        components: {
            d_liquidity: Math.round(D * 100) / 100,
            o_oracle: Math.round(O * 100) / 100,
            l_reliability: Math.round(L * 100) / 100
        },
        status,
        formula: 'I_infra = 100 × ∛(D × O × L)',
        timestamp: Date.now()
    };
}

/**
 * Check infrastructure health (simulated - real implementation would use RPC)
 *
 * @returns {Object} - Health status for all infra tokens
 */
async function checkInfraHealth() {
    const results = {
        timestamp: Date.now(),
        timestamp_iso: new Date().toISOString(),
        tokens: {},
        aggregate: null,
        alerts: []
    };

    // Simulated metrics (in production, fetch from RPC/APIs)
    const simulatedMetrics = {
        SOL: {
            liquidity: { total_liquidity: 50000000, depth_at_1pct: 5000000, spread: 0.001, num_pools: 50 },
            oracle: { num_oracles: 5, freshness_seconds: 1, confidence: 0.99, deviation_from_consensus: 0 },
            reliability: { uptime_7d: 0.999, incidents_30d: 0, age_days: 1500, peg_stability: 1.0 }
        },
        USDC: {
            liquidity: { total_liquidity: 30000000, depth_at_1pct: 3000000, spread: 0.0005, num_pools: 40 },
            oracle: { num_oracles: 4, freshness_seconds: 5, confidence: 0.99, deviation_from_consensus: 0.0001 },
            reliability: { uptime_7d: 0.999, incidents_30d: 0, age_days: 1200, peg_stability: 0.999 }
        },
        USDT: {
            liquidity: { total_liquidity: 20000000, depth_at_1pct: 2000000, spread: 0.001, num_pools: 30 },
            oracle: { num_oracles: 4, freshness_seconds: 10, confidence: 0.98, deviation_from_consensus: 0.001 },
            reliability: { uptime_7d: 0.998, incidents_30d: 0, age_days: 1000, peg_stability: 0.998 }
        },
        JitoSOL: {
            liquidity: { total_liquidity: 10000000, depth_at_1pct: 1000000, spread: 0.002, num_pools: 15 },
            oracle: { num_oracles: 3, freshness_seconds: 30, confidence: 0.97, deviation_from_consensus: 0.002 },
            reliability: { uptime_7d: 0.999, incidents_30d: 0, age_days: 500, peg_stability: 1.0 }
        },
        mSOL: {
            liquidity: { total_liquidity: 15000000, depth_at_1pct: 1500000, spread: 0.002, num_pools: 20 },
            oracle: { num_oracles: 3, freshness_seconds: 30, confidence: 0.97, deviation_from_consensus: 0.001 },
            reliability: { uptime_7d: 0.999, incidents_30d: 0, age_days: 800, peg_stability: 1.0 }
        },
        bSOL: {
            liquidity: { total_liquidity: 5000000, depth_at_1pct: 500000, spread: 0.003, num_pools: 10 },
            oracle: { num_oracles: 2, freshness_seconds: 60, confidence: 0.95, deviation_from_consensus: 0.003 },
            reliability: { uptime_7d: 0.998, incidents_30d: 0, age_days: 400, peg_stability: 1.0 }
        }
    };

    // Calculate I_infra for each token
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [symbol, config] of Object.entries(INFRA_TOKENS)) {
        if (symbol === 'wSOL') continue;  // Skip wSOL (same as SOL)

        const metrics = simulatedMetrics[symbol] || {
            liquidity: {},
            oracle: {},
            reliability: {}
        };

        const result = calculateIInfra(symbol, metrics);
        result.config = config;

        results.tokens[symbol] = result;

        // Weighted aggregate
        totalWeightedScore += result.i_infra * config.phi_weight;
        totalWeight += config.phi_weight;

        // Generate alerts if needed
        if (result.status === 'CRITICAL' || result.status === 'FAILED') {
            results.alerts.push({
                severity: result.status,
                symbol,
                i_infra: result.i_infra,
                message: `${symbol} infrastructure health is ${result.status}`,
                timestamp: Date.now()
            });
        } else if (result.status === 'WARNING') {
            results.alerts.push({
                severity: 'WARNING',
                symbol,
                i_infra: result.i_infra,
                message: `${symbol} infrastructure health degraded`,
                timestamp: Date.now()
            });
        }
    }

    // Aggregate score
    const aggregateScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    results.aggregate = {
        i_infra_weighted: Math.round(aggregateScore * 100) / 100,
        total_tokens: Object.keys(results.tokens).length,
        healthy_count: Object.values(results.tokens).filter(t => t.status === 'HEALTHY').length,
        warning_count: Object.values(results.tokens).filter(t => t.status === 'WARNING').length,
        critical_count: Object.values(results.tokens).filter(t => t.status === 'CRITICAL' || t.status === 'FAILED').length,
        all_healthy: Object.values(results.tokens).every(t => t.status === 'HEALTHY'),
        ecosystem_stable: aggregateScore >= CONFIG.THRESHOLDS.HEALTHY
    };

    // φ analysis
    results._phi = {
        thresholds: CONFIG.THRESHOLDS,
        philosophy: 'Yesod (foundation) must be solid for the tree to stand',
        formula: 'I_infra = 100 × ∛(D_liquidity × O_oracle × L_reliability)'
    };

    return results;
}

/**
 * Save health status to file
 *
 * @param {Object} status - Health status
 */
function saveHealthStatus(status) {
    const statusPath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.MONITOR_FILE);
    const statusDir = path.dirname(statusPath);

    if (!fs.existsSync(statusDir)) {
        fs.mkdirSync(statusDir, { recursive: true });
    }

    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));

    // Save alerts to ledger
    if (status.alerts && status.alerts.length > 0) {
        const alertsPath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.ALERTS_FILE);
        for (const alert of status.alerts) {
            fs.appendFileSync(alertsPath, JSON.stringify(alert) + '\n');
        }
    }
}

/**
 * Get current health status
 *
 * @returns {Object} - Current status or null
 */
function getHealthStatus() {
    const statusPath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.MONITOR_FILE);

    if (!fs.existsSync(statusPath)) {
        return null;
    }

    return JSON.parse(fs.readFileSync(statusPath, 'utf8'));
}

/**
 * Get recent alerts
 *
 * @param {number} limit - Max alerts to return
 * @returns {Array} - Recent alerts
 */
function getRecentAlerts(limit = 10) {
    const alertsPath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.ALERTS_FILE);

    if (!fs.existsSync(alertsPath)) {
        return [];
    }

    const lines = fs.readFileSync(alertsPath, 'utf8').trim().split('\n');
    return lines
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
        .slice(-limit)
        .reverse();
}

/**
 * Run health check and save results
 *
 * @returns {Object} - Health check results
 */
async function runHealthCheck() {
    console.log('[I_infra] Running infrastructure health check...');

    const status = await checkInfraHealth();
    saveHealthStatus(status);

    console.log(`[I_infra] Aggregate: ${status.aggregate.i_infra_weighted}, Healthy: ${status.aggregate.healthy_count}/${status.aggregate.total_tokens}`);

    if (status.alerts.length > 0) {
        console.log(`[I_infra] ${status.alerts.length} alerts generated`);
    }

    return status;
}

/**
 * Start continuous monitoring
 */
function startMonitoring() {
    console.log('[I_infra] Starting continuous monitoring...');
    console.log(`[I_infra] Check interval: ${CONFIG.CHECK_INTERVAL_MS / 1000}s`);

    // Initial check
    runHealthCheck();

    // Schedule recurring checks
    setInterval(() => {
        runHealthCheck();
    }, CONFIG.CHECK_INTERVAL_MS);
}

/**
 * Check if infrastructure is safe for operations
 *
 * @param {Array} requiredTokens - Tokens required for operation
 * @returns {Object} - Safety check result
 */
function isSafeForOperation(requiredTokens = ['SOL', 'USDC']) {
    const status = getHealthStatus();

    if (!status) {
        return {
            safe: false,
            reason: 'No health status available',
            recommendation: 'Run health check first'
        };
    }

    // Check required tokens
    const problematic = [];
    for (const symbol of requiredTokens) {
        const tokenStatus = status.tokens[symbol];
        if (!tokenStatus) {
            problematic.push({ symbol, reason: 'not monitored' });
        } else if (tokenStatus.status === 'CRITICAL' || tokenStatus.status === 'FAILED') {
            problematic.push({ symbol, reason: tokenStatus.status, i_infra: tokenStatus.i_infra });
        }
    }

    if (problematic.length > 0) {
        return {
            safe: false,
            reason: 'Infrastructure issues detected',
            problematic,
            recommendation: 'Wait for infrastructure to stabilize'
        };
    }

    // Check aggregate
    if (!status.aggregate.ecosystem_stable) {
        return {
            safe: false,
            reason: 'Ecosystem not stable',
            aggregate_score: status.aggregate.i_infra_weighted,
            recommendation: 'Consider reducing operation size'
        };
    }

    return {
        safe: true,
        aggregate_score: status.aggregate.i_infra_weighted,
        checked_tokens: requiredTokens
    };
}

module.exports = {
    INFRA_TOKENS,
    CONFIG,
    calculateDLiquidity,
    calculateOOracle,
    calculateLReliability,
    calculateIInfra,
    checkInfraHealth,
    saveHealthStatus,
    getHealthStatus,
    getRecentAlerts,
    runHealthCheck,
    startMonitoring,
    isSafeForOperation
};
