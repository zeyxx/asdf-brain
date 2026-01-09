/**
 * Brain Burn Mechanism - Contribution Tracker
 *
 * "Don't extract. Burn." - Value flows through $asdfasdfa singularity
 *
 * PHILOSOPHY:
 *   Knowledge is FREE to access - burns happen at TRANSACTION layer.
 *   This module TRACKS contributions, not CHARGES fees.
 *   When actual burns occur (via GASdf, consumer apps, infra),
 *   these contributions can be attributed and verified.
 *
 * FLOW:
 *   brain_learn (write) → contribution tracked → E-Score BUILD credit
 *   brain_search (read) → FREE (knowledge circulates)
 *   Actual burns → GASdf/infra/consumer apps → on-chain $asdfasdfa burn
 *
 * FUTURE (on-chain):
 *   Weekly Merkle root → Solana program
 *   Contribution ledger → verifiable on-chain
 *
 * @sefirah Daat (hidden knowledge) - free to access, valuable when used
 * @principle Knowledge libre, burns via transactions
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const temporal = require('./temporal');
const merkleProofs = require('./merkle-proofs');

// φ constants
const PHI = temporal.PHI;
const PHI_INV = temporal.PHI_INV;
const PHI_INV_2 = temporal.PHI_INV_2;

// Configuration
const CONFIG = {
    KNOWLEDGE_DIR: path.join(__dirname, '../knowledge'),
    BURN_LEDGER_FILE: 'burns/ledger.jsonl',
    BURN_STATS_FILE: 'burns/stats.json',
    ASDFASDFA_MINT: process.env.ASDFASDFA_MINT || 'ASdf...placeholder',
    BURN_ADDRESS: process.env.BURN_ADDRESS || '1111111111111111111111111111111111',

    // Burn rate configuration (from GASdf philosophy)
    BURN_RATE: PHI_INV_2,  // 38.2% of fees burn
    MIN_BURN_AMOUNT: 100,  // Minimum lamports

    // Contribution values (for E-Score attribution, not fees)
    // These represent the VALUE of operations to the ecosystem
    // Higher values = more valuable contributions = higher BUILD score
    OPERATION_COSTS: {
        context_inject: 1000,      // Context injection (medium value)
        pattern_create: 5000,      // Creating a pattern (HIGH - builds knowledge)
        pattern_query: 500,        // Querying patterns (low - consumption)
        decision_record: 3000,     // Recording a decision (high - builds knowledge)
        merkle_proof: 2000,        // Generating a proof (medium - verification)
        session_start: 1000,       // Starting a session (medium)
        session_end: 500,          // Ending a session (low)
        knowledge_search: 800      // Searching knowledge (low - FREE but tracked)
    }
};

/**
 * Generate burn transaction ID
 *
 * @param {Object} burnData - Burn transaction data
 * @returns {string} - Unique burn ID
 */
function generateBurnId(burnData) {
    return crypto.createHash('sha256')
        .update(JSON.stringify({
            operation: burnData.operation,
            amount: burnData.amount,
            timestamp: burnData.timestamp,
            session_id: burnData.session_id
        }))
        .digest('hex')
        .slice(0, 16);
}

/**
 * Calculate burn amount for an operation
 *
 * @param {string} operation - Operation type
 * @param {Object} context - Operation context
 * @returns {number} - Burn amount in lamports
 */
function calculateBurnAmount(operation, context = {}) {
    const baseCost = CONFIG.OPERATION_COSTS[operation] || 500;

    // Apply φ multipliers based on context
    let multiplier = 1.0;

    // Complex operations cost more
    if (context.complexity === 'high') {
        multiplier *= PHI;
    }

    // Cross-project operations cost more
    if (context.cross_project) {
        multiplier *= PHI;
    }

    // Strategic level queries cost more
    if (context.daat_level === 4) {
        multiplier *= PHI;
    } else if (context.daat_level === 3) {
        multiplier *= PHI_INV;
    }

    const totalCost = Math.floor(baseCost * multiplier);
    const burnAmount = Math.floor(totalCost * CONFIG.BURN_RATE);

    return Math.max(CONFIG.MIN_BURN_AMOUNT, burnAmount);
}

/**
 * Create a burn record
 *
 * @param {string} operation - Operation that triggered burn
 * @param {number} amount - Burn amount
 * @param {string} sessionId - Session ID
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Burn record
 */
function createBurnRecord(operation, amount, sessionId, metadata = {}) {
    const timestamp = Date.now();
    const burnId = generateBurnId({ operation, amount, timestamp, session_id: sessionId });

    const record = {
        id: burnId,
        operation,
        amount,
        burn_rate: CONFIG.BURN_RATE,
        session_id: sessionId,
        timestamp,
        timestamp_iso: new Date(timestamp).toISOString(),

        // For future on-chain verification
        chain_ready: {
            mint: CONFIG.ASDFASDFA_MINT,
            burn_address: CONFIG.BURN_ADDRESS,
            amount_lamports: amount,
            signature: null  // Will be set when on-chain
        },

        // Metadata
        metadata: {
            ...metadata,
            contributor_id: metadata.contributor_id || null,
            project: metadata.project || 'brain'
        },

        // Verification
        content_hash: merkleProofs.generateItemId({ operation, amount, timestamp }),

        // Philosophy marker
        _phi: {
            burn_rate: CONFIG.BURN_RATE,
            philosophy: "Don't extract. Burn."
        }
    };

    return record;
}

/**
 * Record a burn to the ledger
 *
 * @param {Object} burnRecord - Burn record to save
 * @returns {Object} - Saved record with ledger position
 */
function recordBurn(burnRecord) {
    const ledgerPath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.BURN_LEDGER_FILE);
    const ledgerDir = path.dirname(ledgerPath);

    if (!fs.existsSync(ledgerDir)) {
        fs.mkdirSync(ledgerDir, { recursive: true });
    }

    // Append to JSONL ledger
    fs.appendFileSync(ledgerPath, JSON.stringify(burnRecord) + '\n');

    // Update stats
    updateBurnStats(burnRecord);

    console.log(`[Burn] Recorded: ${burnRecord.id}, ${burnRecord.amount} lamports for ${burnRecord.operation}`);

    return burnRecord;
}

/**
 * Track a brain operation and record its burn
 *
 * @param {string} operation - Operation type
 * @param {string} sessionId - Session ID
 * @param {Object} context - Operation context
 * @returns {Object} - Burn record
 */
function trackOperation(operation, sessionId, context = {}) {
    const amount = calculateBurnAmount(operation, context);
    const record = createBurnRecord(operation, amount, sessionId, context);
    return recordBurn(record);
}

/**
 * Update burn statistics
 *
 * @param {Object} burnRecord - New burn record
 */
function updateBurnStats(burnRecord) {
    const statsPath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.BURN_STATS_FILE);
    const statsDir = path.dirname(statsPath);

    if (!fs.existsSync(statsDir)) {
        fs.mkdirSync(statsDir, { recursive: true });
    }

    let stats;
    if (fs.existsSync(statsPath)) {
        try {
            stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        } catch (e) {
            stats = null; // Will be recreated below
        }
    }

    // Ensure all required fields exist (defensive)
    if (!stats || typeof stats !== 'object') {
        stats = {};
    }
    stats.total_burned = stats.total_burned || 0;
    stats.total_operations = stats.total_operations || 0;
    stats.by_operation = stats.by_operation || {};
    stats.by_session = stats.by_session || {};
    stats.by_project = stats.by_project || {};
    stats.daily_burns = stats.daily_burns || {};
    stats.created_at = stats.created_at || Date.now();
    stats.last_updated = stats.last_updated || null;

    // Update totals
    stats.total_burned += burnRecord.amount;
    stats.total_operations++;

    // By operation
    if (!stats.by_operation[burnRecord.operation]) {
        stats.by_operation[burnRecord.operation] = { count: 0, total: 0 };
    }
    stats.by_operation[burnRecord.operation].count++;
    stats.by_operation[burnRecord.operation].total += burnRecord.amount;

    // By session
    if (!stats.by_session[burnRecord.session_id]) {
        stats.by_session[burnRecord.session_id] = { count: 0, total: 0 };
    }
    stats.by_session[burnRecord.session_id].count++;
    stats.by_session[burnRecord.session_id].total += burnRecord.amount;

    // By project
    const project = burnRecord.metadata?.project || 'brain';
    if (!stats.by_project[project]) {
        stats.by_project[project] = { count: 0, total: 0 };
    }
    stats.by_project[project].count++;
    stats.by_project[project].total += burnRecord.amount;

    // Daily tracking
    const day = new Date(burnRecord.timestamp).toISOString().split('T')[0];
    if (!stats.daily_burns[day]) {
        stats.daily_burns[day] = { count: 0, total: 0 };
    }
    stats.daily_burns[day].count++;
    stats.daily_burns[day].total += burnRecord.amount;

    // Update timestamp
    stats.last_updated = Date.now();

    // Calculate φ metrics
    stats._phi = {
        avg_burn_per_operation: stats.total_burned / stats.total_operations,
        burn_rate: CONFIG.BURN_RATE,
        // Burn velocity: burns per hour (last 24h)
        velocity_24h: calculateBurnVelocity(stats.daily_burns)
    };

    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

/**
 * Calculate burn velocity (burns per hour in last 24h)
 *
 * @param {Object} dailyBurns - Daily burn data
 * @returns {number} - Burns per hour
 */
function calculateBurnVelocity(dailyBurns) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const todayBurns = dailyBurns[today]?.total || 0;
    const yesterdayBurns = dailyBurns[yesterday]?.total || 0;

    // Average over 24 hours
    return (todayBurns + yesterdayBurns) / 48;  // Per hour
}

/**
 * Get burn statistics
 *
 * @returns {Object} - Current burn statistics
 */
function getBurnStats() {
    const statsPath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.BURN_STATS_FILE);

    if (!fs.existsSync(statsPath)) {
        return {
            total_burned: 0,
            total_operations: 0,
            by_operation: {},
            message: 'No burns recorded yet'
        };
    }

    return JSON.parse(fs.readFileSync(statsPath, 'utf8'));
}

/**
 * Get recent burns from ledger
 *
 * @param {number} limit - Max burns to return
 * @returns {Array} - Recent burn records
 */
function getRecentBurns(limit = 10) {
    const ledgerPath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.BURN_LEDGER_FILE);

    if (!fs.existsSync(ledgerPath)) {
        return [];
    }

    const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n');
    const records = lines
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
        .slice(-limit)
        .reverse();

    return records;
}

/**
 * Generate burn proof for verification
 *
 * @param {string} burnId - Burn ID
 * @returns {Object} - Burn proof
 */
function generateBurnProof(burnId) {
    const ledgerPath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.BURN_LEDGER_FILE);

    if (!fs.existsSync(ledgerPath)) {
        return null;
    }

    const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n');
    const records = lines
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

    const burn = records.find(r => r.id === burnId);
    if (!burn) {
        return null;
    }

    // Generate proof using merkle
    const allHashes = records.map(r => r.content_hash);
    const tree = require('../scripts/merkle').buildMerkleTree(allHashes);

    return {
        burn_id: burnId,
        burn_record: burn,
        merkle_root: tree.root,
        proof_path: tree.proofs[burn.content_hash] || [],
        verified: true,
        generated_at: Date.now(),
        _phi: {
            philosophy: "Don't trust, verify"
        }
    };
}

/**
 * Calculate session burn total
 *
 * @param {string} sessionId - Session ID
 * @returns {Object} - Session burn summary
 */
function getSessionBurnTotal(sessionId) {
    const stats = getBurnStats();
    const sessionStats = stats.by_session?.[sessionId];

    if (!sessionStats) {
        return {
            session_id: sessionId,
            total_burned: 0,
            operations: 0
        };
    }

    return {
        session_id: sessionId,
        total_burned: sessionStats.total,
        operations: sessionStats.count,
        avg_per_operation: sessionStats.total / sessionStats.count
    };
}

/**
 * Integrate burn tracking with contributor E-Score
 *
 * @param {string} contributorId - Contributor ID
 * @param {Object} burnRecord - Burn record
 * @returns {Object} - Attribution result
 */
function attributeBurnToContributor(contributorId, burnRecord) {
    if (!contributorId) return null;

    try {
        const contributors = require('./contributors');
        return contributors.recordContribution(contributorId, 'burn', {
            burn_id: burnRecord.id,
            amount: burnRecord.amount,
            operation: burnRecord.operation
        });
    } catch (e) {
        console.log(`[Burn] Could not attribute to contributor: ${e.message}`);
        return null;
    }
}

module.exports = {
    CONFIG,
    generateBurnId,
    calculateBurnAmount,
    createBurnRecord,
    recordBurn,
    trackOperation,
    updateBurnStats,
    getBurnStats,
    getRecentBurns,
    generateBurnProof,
    getSessionBurnTotal,
    attributeBurnToContributor
};
