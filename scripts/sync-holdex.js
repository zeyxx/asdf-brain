#!/usr/bin/env node
/**
 * SEED 1: HolDex-Brain Data Sync
 *
 * "Don't trust, verify" - Brain must have live K-Score data
 *
 * This script syncs K-Score data from HolDex API to Brain,
 * enabling pattern analysis and training data extraction.
 *
 * @philosophy Yesod (HolDex) feeds Daat (Brain) with verified truth
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
    HOLDEX_API: process.env.HOLDEX_API_URL || 'https://holdex-api.onrender.com',
    SYNC_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes
    OUTPUT_DIR: path.join(__dirname, '../knowledge/live'),
    OUTPUT_FILE: 'holdex-sync.jsonl',
    PHI: 1.618033988749895,
    PHI_INV: 0.618033988749895,
    PHI_INV_2: 0.38196601125010515,
    PHI_INV_3: 0.2360679774997897
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
}

/**
 * Fetch data from HolDex API
 */
async function fetchFromHolDex(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${CONFIG.HOLDEX_API}${endpoint}`;
        console.log(`[HolDex Sync] Fetching: ${url}`);

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Calculate K-Score change significance using phi thresholds
 */
function calculateSignificance(oldScore, newScore) {
    if (!oldScore) return 'new';

    const change = Math.abs(newScore - oldScore);
    const percentChange = change / oldScore;

    if (percentChange >= CONFIG.PHI_INV) return 'critical';      // >= 61.8%
    if (percentChange >= CONFIG.PHI_INV_2) return 'significant'; // >= 38.2%
    if (percentChange >= CONFIG.PHI_INV_3) return 'notable';     // >= 23.6%
    return 'minor';
}

/**
 * Extract patterns from K-Score data
 */
function extractPatterns(tokens, previousData) {
    const patterns = [];
    const previousMap = new Map(previousData.map(t => [t.mint, t]));

    for (const token of tokens) {
        const prev = previousMap.get(token.mint);
        const significance = calculateSignificance(prev?.k_score, token.k_score);

        if (significance !== 'minor') {
            patterns.push({
                type: 'k_score_change',
                mint: token.mint,
                symbol: token.symbol,
                old_score: prev?.k_score || null,
                new_score: token.k_score,
                significance,
                timestamp: Date.now(),
                phi_analysis: {
                    d_score: token.d_score,
                    o_score: token.o_score,
                    l_score: token.l_score,
                    dominant_factor: getDominantFactor(token)
                }
            });
        }
    }

    // Detect ecosystem-wide patterns
    const avgKScore = tokens.reduce((sum, t) => sum + (t.k_score || 0), 0) / tokens.length;
    const prevAvg = previousData.length > 0
        ? previousData.reduce((sum, t) => sum + (t.k_score || 0), 0) / previousData.length
        : null;

    if (prevAvg && Math.abs(avgKScore - prevAvg) / prevAvg >= CONFIG.PHI_INV_3) {
        patterns.push({
            type: 'ecosystem_shift',
            metric: 'average_k_score',
            old_value: prevAvg,
            new_value: avgKScore,
            significance: calculateSignificance(prevAvg, avgKScore),
            timestamp: Date.now()
        });
    }

    return patterns;
}

/**
 * Determine which factor (D, O, L) is dominant in K-Score
 */
function getDominantFactor(token) {
    const { d_score, o_score, l_score } = token;
    if (!d_score || !o_score || !l_score) return 'unknown';

    const max = Math.max(d_score, o_score, l_score);
    if (d_score === max) return 'diamond_hands';
    if (o_score === max) return 'organic_growth';
    return 'longevity';
}

/**
 * Load previous sync data
 */
function loadPreviousData() {
    const filePath = path.join(CONFIG.OUTPUT_DIR, CONFIG.OUTPUT_FILE);
    if (!fs.existsSync(filePath)) return [];

    try {
        const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
        if (lines.length === 0) return [];

        // Get the most recent sync entry
        const lastLine = lines[lines.length - 1];
        const lastSync = JSON.parse(lastLine);
        return lastSync.tokens || [];
    } catch (e) {
        console.error('[HolDex Sync] Error loading previous data:', e.message);
        return [];
    }
}

/**
 * Append sync data to JSONL file
 */
function appendSyncData(data) {
    const filePath = path.join(CONFIG.OUTPUT_DIR, CONFIG.OUTPUT_FILE);
    const line = JSON.stringify(data) + '\n';
    fs.appendFileSync(filePath, line);
}

/**
 * Save extracted patterns
 */
function savePatterns(patterns) {
    if (patterns.length === 0) return;

    const patternsFile = path.join(CONFIG.OUTPUT_DIR, 'holdex-patterns.jsonl');
    for (const pattern of patterns) {
        fs.appendFileSync(patternsFile, JSON.stringify(pattern) + '\n');
    }
    console.log(`[HolDex Sync] Saved ${patterns.length} patterns`);
}

/**
 * Main sync function
 */
async function syncHolDex() {
    console.log('[HolDex Sync] Starting sync...');
    const startTime = Date.now();

    try {
        // Fetch tokens with K-Scores
        const response = await fetchFromHolDex('/api/tokens?limit=100&include_scores=true');
        const tokens = response.tokens || response.data || response || [];

        if (!Array.isArray(tokens) || tokens.length === 0) {
            console.log('[HolDex Sync] No tokens received');
            return { success: false, error: 'No tokens received' };
        }

        // Load previous data for comparison
        const previousData = loadPreviousData();

        // Extract patterns from changes
        const patterns = extractPatterns(tokens, previousData);

        // Calculate statistics
        const stats = {
            total_tokens: tokens.length,
            avg_k_score: tokens.reduce((sum, t) => sum + (t.k_score || 0), 0) / tokens.length,
            high_k_count: tokens.filter(t => t.k_score >= 61.8).length,  // phi^-1 threshold
            medium_k_count: tokens.filter(t => t.k_score >= 38.2 && t.k_score < 61.8).length,
            low_k_count: tokens.filter(t => t.k_score < 38.2).length,
            patterns_detected: patterns.length
        };

        // Create sync record
        const syncRecord = {
            timestamp: Date.now(),
            source: 'holdex',
            duration_ms: Date.now() - startTime,
            stats,
            tokens: tokens.map(t => ({
                mint: t.mint,
                symbol: t.symbol,
                k_score: t.k_score,
                d_score: t.d_score,
                o_score: t.o_score,
                l_score: t.l_score,
                metal_rank: t.metal_rank
            })),
            patterns_count: patterns.length,
            _phi: {
                sync_quality: stats.avg_k_score / 100,
                ecosystem_health: stats.high_k_count / stats.total_tokens
            }
        };

        // Save data
        appendSyncData(syncRecord);
        savePatterns(patterns);

        console.log(`[HolDex Sync] Complete: ${tokens.length} tokens, ${patterns.length} patterns, ${Date.now() - startTime}ms`);
        console.log(`[HolDex Sync] Stats: avg_K=${stats.avg_k_score.toFixed(2)}, high=${stats.high_k_count}, medium=${stats.medium_k_count}, low=${stats.low_k_count}`);

        return { success: true, stats, patterns_count: patterns.length };

    } catch (error) {
        console.error('[HolDex Sync] Error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch I_infra data for infrastructure tokens
 */
async function syncInfraTokens() {
    console.log('[HolDex Sync] Syncing infrastructure tokens (I_infra)...');

    const infraTokens = {
        SOL: 'So11111111111111111111111111111111111111112',
        USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        JitoSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
        bSOL: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1'
    };

    const infraData = {
        timestamp: Date.now(),
        type: 'i_infra_sync',
        tokens: {}
    };

    // For now, use placeholder scores until HolDex implements I_infra API
    // SOL is baseline 100, others estimated based on liquidity/oracle coverage
    const placeholderScores = {
        SOL: { i_infra: 100, d: 100, o: 100, l: 100, note: 'baseline' },
        USDC: { i_infra: 95, d: 98, o: 95, l: 92, note: 'primary stablecoin' },
        USDT: { i_infra: 88, d: 90, o: 85, l: 90, note: 'secondary stablecoin' },
        JitoSOL: { i_infra: 82, d: 85, o: 80, l: 82, note: 'LST - Jito' },
        mSOL: { i_infra: 85, d: 88, o: 82, l: 85, note: 'LST - Marinade' },
        bSOL: { i_infra: 75, d: 78, o: 72, l: 76, note: 'LST - BlazeStake' }
    };

    for (const [symbol, mint] of Object.entries(infraTokens)) {
        infraData.tokens[symbol] = {
            mint,
            ...placeholderScores[symbol],
            phi_weight: symbol === 'SOL' ? 2.618 : (symbol === 'USDC' ? 1.618 : 1.0)
        };
    }

    // Calculate aggregate I_infra score
    const scores = Object.values(infraData.tokens).map(t => t.i_infra);
    infraData.aggregate = {
        avg_i_infra: scores.reduce((a, b) => a + b, 0) / scores.length,
        min_i_infra: Math.min(...scores),
        all_healthy: scores.every(s => s >= 61.8),
        warning_tokens: Object.entries(infraData.tokens)
            .filter(([_, t]) => t.i_infra < 61.8)
            .map(([symbol, _]) => symbol)
    };

    // Save I_infra data
    const infraFile = path.join(CONFIG.OUTPUT_DIR, 'i-infra-sync.jsonl');
    fs.appendFileSync(infraFile, JSON.stringify(infraData) + '\n');

    console.log(`[HolDex Sync] I_infra: avg=${infraData.aggregate.avg_i_infra.toFixed(2)}, healthy=${infraData.aggregate.all_healthy}`);

    return infraData;
}

/**
 * Run continuous sync
 */
async function runContinuousSync() {
    console.log('[HolDex Sync] Starting continuous sync mode');
    console.log(`[HolDex Sync] Interval: ${CONFIG.SYNC_INTERVAL_MS / 1000 / 60} minutes`);

    // Initial sync
    await syncHolDex();
    await syncInfraTokens();

    // Schedule recurring sync
    setInterval(async () => {
        await syncHolDex();
        await syncInfraTokens();
    }, CONFIG.SYNC_INTERVAL_MS);
}

// CLI interface
const args = process.argv.slice(2);
if (args.includes('--once')) {
    // Single sync
    Promise.all([syncHolDex(), syncInfraTokens()])
        .then(([kResult, iResult]) => {
            console.log('[HolDex Sync] Single sync complete');
            process.exit(kResult.success ? 0 : 1);
        })
        .catch(err => {
            console.error('[HolDex Sync] Fatal error:', err);
            process.exit(1);
        });
} else if (args.includes('--continuous')) {
    runContinuousSync();
} else {
    console.log('Usage: node sync-holdex.js [--once|--continuous]');
    console.log('  --once       Run a single sync');
    console.log('  --continuous Run continuous sync every 15 minutes');
}

module.exports = { syncHolDex, syncInfraTokens, CONFIG };
