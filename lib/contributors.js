/**
 * SEED 6: Contributor E-Score Tracking
 *
 * "Those who build the ecosystem deserve recognition proportional to their contribution"
 *
 * Implements contributor tracking with 7-dimension E-Score:
 * - HOLD (1.0)   - Holding $asdfasdfa tokens
 * - BURN (φ)    - Burning tokens through actions
 * - USE (1.0)   - Using ecosystem services
 * - BUILD (φ²)  - Building/contributing code or knowledge
 * - RUN (φ²)    - Running infrastructure
 * - REFER (φ)   - Referring others to ecosystem
 * - TIME (1.0)  - Time in ecosystem
 *
 * @philosophy Contributors are the lifeblood of the ecosystem
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const temporal = require('./temporal');

// φ constants from temporal
const PHI = temporal.PHI;
const PHI_2 = PHI * PHI;  // φ² = 2.618...

// E-Score dimension configuration
const E_DIMENSIONS = {
    HOLD: {
        name: 'hold',
        description: 'Holding $asdfasdfa tokens',
        weight: 1.0,
        max_score: 100
    },
    BURN: {
        name: 'burn',
        description: 'Burning tokens through ecosystem actions',
        weight: PHI,  // 1.618
        max_score: 100
    },
    USE: {
        name: 'use',
        description: 'Using ecosystem services (GASdf, HolDex)',
        weight: 1.0,
        max_score: 100
    },
    BUILD: {
        name: 'build',
        description: 'Contributing code, patterns, or knowledge',
        weight: PHI_2,  // 2.618
        max_score: 100
    },
    RUN: {
        name: 'run',
        description: 'Running infrastructure (validators, oracles)',
        weight: PHI_2,  // 2.618
        max_score: 100
    },
    REFER: {
        name: 'refer',
        description: 'Referring others to the ecosystem',
        weight: PHI,  // 1.618
        max_score: 100
    },
    TIME: {
        name: 'time',
        description: 'Time in ecosystem (tenure)',
        weight: 1.0,
        max_score: 100
    }
};

// Configuration
const CONFIG = {
    KNOWLEDGE_DIR: path.join(__dirname, '../knowledge'),
    CONTRIBUTORS_FILE: 'community/contributors.json',
    MIN_CONTRIBUTION_THRESHOLD: 3,  // Minimum contributions to be tracked
    PHI,
    PHI_2
};

/**
 * Generate contributor ID from identifier
 *
 * @param {string} identifier - Wallet address, GitHub username, or other ID
 * @returns {string} - Contributor ID
 */
function generateContributorId(identifier) {
    return crypto.createHash('sha256')
        .update(identifier.toLowerCase())
        .digest('hex')
        .slice(0, 16);
}

/**
 * Calculate E-Score for a contributor
 * E = geometric_mean(dimensions) × φ_weighted
 *
 * @param {Object} scores - Individual dimension scores
 * @returns {Object} - E-Score calculation result
 */
function calculateEScore(scores) {
    const dimensions = [];
    let weightedProduct = 1;
    let totalWeight = 0;

    for (const [key, config] of Object.entries(E_DIMENSIONS)) {
        const score = Math.min(config.max_score, scores[config.name] || 0);
        const weighted = Math.pow(score, config.weight);

        dimensions.push({
            dimension: config.name,
            raw_score: score,
            weight: config.weight,
            weighted_score: weighted
        });

        if (score > 0) {
            weightedProduct *= weighted;
            totalWeight += config.weight;
        }
    }

    // Calculate weighted geometric mean
    // E = ∏(score_i^weight_i)^(1/Σweights)
    const geometricMean = totalWeight > 0
        ? Math.pow(weightedProduct, 1 / totalWeight)
        : 0;

    // Normalize to 0-100 scale
    const eScore = Math.min(100, geometricMean);

    return {
        e_score: Math.round(eScore * 100) / 100,
        dimensions,
        formula: 'E = ∏(score_i^φ_weight_i)^(1/Σweights)',
        total_weight: totalWeight,
        _phi: {
            build_weight: PHI_2,
            run_weight: PHI_2,
            burn_weight: PHI,
            refer_weight: PHI
        }
    };
}

/**
 * Create a new contributor record
 *
 * @param {string} identifier - Contributor identifier
 * @param {string} type - Type (wallet, github, telegram, etc.)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Contributor record
 */
function createContributor(identifier, type, metadata = {}) {
    const id = generateContributorId(identifier);
    const now = Date.now();

    return {
        id,
        identifier,
        type,
        created_at: now,
        last_active: now,

        // Dimension scores
        scores: {
            hold: 0,
            burn: 0,
            use: 0,
            build: 0,
            run: 0,
            refer: 0,
            time: 0
        },

        // Contribution counts
        contributions: {
            patterns_added: 0,
            decisions_recorded: 0,
            code_commits: 0,
            reviews_done: 0,
            burns_initiated: 0,
            referrals: 0
        },

        // Trust level (grows with verified contributions)
        trust_level: 0,  // 0-4 (Observer, Contributor, Builder, Steward, Guardian)

        // E-Score (calculated)
        e_score: null,

        // Metadata
        metadata: {
            ...metadata,
            first_contribution: null,
            rank: null
        },

        // History
        history: []
    };
}

/**
 * Record a contribution from a contributor
 *
 * @param {string} contributorId - Contributor ID
 * @param {string} contributionType - Type of contribution
 * @param {Object} data - Contribution data
 * @returns {Object} - Updated contributor
 */
function recordContribution(contributorId, contributionType, data = {}) {
    const contributors = loadContributors();
    let contributor = contributors.items[contributorId];

    if (!contributor) {
        console.log(`[Contributors] Unknown contributor: ${contributorId}`);
        return null;
    }

    const now = Date.now();
    contributor.last_active = now;

    // Map contribution type to dimension and update scores
    const contributionMap = {
        'pattern_added': { dimension: 'build', score_increment: 5, count_field: 'patterns_added' },
        'decision_recorded': { dimension: 'build', score_increment: 3, count_field: 'decisions_recorded' },
        'code_commit': { dimension: 'build', score_increment: 10, count_field: 'code_commits' },
        'review': { dimension: 'build', score_increment: 4, count_field: 'reviews_done' },
        'burn': { dimension: 'burn', score_increment: 2, count_field: 'burns_initiated' },
        'referral': { dimension: 'refer', score_increment: 8, count_field: 'referrals' },
        'service_use': { dimension: 'use', score_increment: 1, count_field: null },
        'infra_run': { dimension: 'run', score_increment: 15, count_field: null }
    };

    const mapping = contributionMap[contributionType];
    if (!mapping) {
        console.log(`[Contributors] Unknown contribution type: ${contributionType}`);
        return contributor;
    }

    // Update score
    contributor.scores[mapping.dimension] = Math.min(
        E_DIMENSIONS[mapping.dimension.toUpperCase()].max_score,
        (contributor.scores[mapping.dimension] || 0) + mapping.score_increment
    );

    // Update count
    if (mapping.count_field && contributor.contributions[mapping.count_field] !== undefined) {
        contributor.contributions[mapping.count_field]++;
    }

    // Record first contribution
    if (!contributor.metadata.first_contribution) {
        contributor.metadata.first_contribution = now;
    }

    // Update time score based on tenure
    const tenureMs = now - contributor.created_at;
    const tenureDays = tenureMs / (1000 * 60 * 60 * 24);
    contributor.scores.time = Math.min(100, tenureDays / 30 * 10);  // Max at ~10 months

    // Record history
    contributor.history.push({
        type: contributionType,
        timestamp: now,
        data,
        score_delta: mapping.score_increment
    });

    // Recalculate E-Score
    const eResult = calculateEScore(contributor.scores);
    contributor.e_score = eResult.e_score;

    // Update trust level based on E-Score
    contributor.trust_level = calculateTrustLevel(contributor);

    // Save
    contributors.items[contributorId] = contributor;
    saveContributors(contributors);

    console.log(`[Contributors] Recorded ${contributionType} for ${contributorId}, E-Score: ${contributor.e_score}`);

    return contributor;
}

/**
 * Calculate trust level from contributor data
 *
 * Trust levels:
 * 0 - Observer: New, minimal contributions
 * 1 - Contributor: Regular contributions
 * 2 - Builder: Significant build contributions
 * 3 - Steward: High E-Score, long tenure
 * 4 - Guardian: Top tier, verified identity
 *
 * @param {Object} contributor - Contributor record
 * @returns {number} - Trust level (0-4)
 */
function calculateTrustLevel(contributor) {
    const { e_score, contributions, scores } = contributor;
    const totalContributions = Object.values(contributions).reduce((a, b) => a + b, 0);

    // Guardian: E-Score >= 61.8 (φ⁻¹), 50+ contributions, verified
    if (e_score >= 61.8 && totalContributions >= 50 && contributor.metadata.verified) {
        return 4;
    }

    // Steward: E-Score >= 38.2 (φ⁻²), 20+ contributions
    if (e_score >= 38.2 && totalContributions >= 20) {
        return 3;
    }

    // Builder: build score >= 30, 10+ contributions
    if (scores.build >= 30 && totalContributions >= 10) {
        return 2;
    }

    // Contributor: 3+ contributions
    if (totalContributions >= CONFIG.MIN_CONTRIBUTION_THRESHOLD) {
        return 1;
    }

    // Observer
    return 0;
}

/**
 * Get trust level name
 *
 * @param {number} level - Trust level (0-4)
 * @returns {string} - Level name
 */
function getTrustLevelName(level) {
    const names = ['Observer', 'Contributor', 'Builder', 'Steward', 'Guardian'];
    return names[level] || 'Unknown';
}

/**
 * Load contributors from file
 *
 * @returns {Object} - Contributors registry
 */
function loadContributors() {
    const filePath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.CONTRIBUTORS_FILE);
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
        return {
            items: {},
            count: 0,
            _metadata: {
                created: Date.now(),
                last_updated: Date.now()
            }
        };
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Handle legacy format (contributors) or new format (items)
    if (!data.items && data.contributors) {
        data.items = data.contributors;
    }

    // Ensure items exists
    if (!data.items) {
        data.items = {};
    }

    return data;
}

/**
 * Save contributors to file
 *
 * @param {Object} contributors - Contributors registry
 */
function saveContributors(contributors) {
    const filePath = path.join(CONFIG.KNOWLEDGE_DIR, CONFIG.CONTRIBUTORS_FILE);
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    contributors.count = Object.keys(contributors.items).length;
    contributors._metadata.last_updated = Date.now();

    fs.writeFileSync(filePath, JSON.stringify(contributors, null, 2));
}

/**
 * Register or get a contributor
 *
 * @param {string} identifier - Contributor identifier
 * @param {string} type - Type (wallet, github, telegram)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Contributor record
 */
function getOrCreateContributor(identifier, type, metadata = {}) {
    const id = generateContributorId(identifier);
    const contributors = loadContributors();

    if (contributors.items[id]) {
        return contributors.items[id];
    }

    // Create new contributor
    const contributor = createContributor(identifier, type, metadata);
    contributors.items[id] = contributor;
    saveContributors(contributors);

    console.log(`[Contributors] New contributor registered: ${id} (${type})`);

    return contributor;
}

/**
 * Get contributor by ID
 *
 * @param {string} contributorId - Contributor ID
 * @returns {Object|null} - Contributor record or null
 */
function getContributor(contributorId) {
    const contributors = loadContributors();
    return contributors.items[contributorId] || null;
}

/**
 * Get contributor leaderboard
 *
 * @param {number} limit - Max results
 * @param {string} sortBy - Sort field (e_score, trust_level, contributions)
 * @returns {Array} - Sorted contributors
 */
function getLeaderboard(limit = 10, sortBy = 'e_score') {
    const contributors = loadContributors();
    const items = Object.values(contributors.items);

    // Calculate total contributions for sorting
    const withTotals = items.map(c => ({
        ...c,
        total_contributions: Object.values(c.contributions).reduce((a, b) => a + b, 0)
    }));

    // Sort
    let sorted;
    switch (sortBy) {
        case 'trust_level':
            sorted = withTotals.sort((a, b) => b.trust_level - a.trust_level);
            break;
        case 'contributions':
            sorted = withTotals.sort((a, b) => b.total_contributions - a.total_contributions);
            break;
        case 'e_score':
        default:
            sorted = withTotals.sort((a, b) => (b.e_score || 0) - (a.e_score || 0));
    }

    // Add rank
    return sorted.slice(0, limit).map((c, idx) => ({
        rank: idx + 1,
        id: c.id,
        type: c.type,
        e_score: c.e_score,
        trust_level: c.trust_level,
        trust_level_name: getTrustLevelName(c.trust_level),
        total_contributions: c.total_contributions,
        scores: c.scores
    }));
}

/**
 * Get ecosystem contributor statistics
 *
 * @returns {Object} - Statistics
 */
function getContributorStats() {
    const contributors = loadContributors();
    const items = Object.values(contributors.items);

    if (items.length === 0) {
        return {
            total_contributors: 0,
            by_trust_level: {},
            avg_e_score: 0,
            total_contributions: 0
        };
    }

    // Count by trust level
    const byTrustLevel = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalEScore = 0;
    let totalContributions = 0;

    for (const c of items) {
        byTrustLevel[c.trust_level] = (byTrustLevel[c.trust_level] || 0) + 1;
        totalEScore += c.e_score || 0;
        totalContributions += Object.values(c.contributions).reduce((a, b) => a + b, 0);
    }

    return {
        total_contributors: items.length,
        by_trust_level: {
            observer: byTrustLevel[0],
            contributor: byTrustLevel[1],
            builder: byTrustLevel[2],
            steward: byTrustLevel[3],
            guardian: byTrustLevel[4]
        },
        avg_e_score: Math.round(totalEScore / items.length * 100) / 100,
        total_contributions: totalContributions,
        _phi: {
            high_trust_ratio: (byTrustLevel[3] + byTrustLevel[4]) / items.length,
            builder_ratio: (byTrustLevel[2] + byTrustLevel[3] + byTrustLevel[4]) / items.length
        }
    };
}

/**
 * Attribute a knowledge item to a contributor
 *
 * @param {Object} item - Knowledge item (pattern, decision, etc.)
 * @param {string} contributorId - Contributor ID
 * @param {string} contributionType - Type of contribution
 * @returns {Object} - Updated item with attribution
 */
function attributeToContributor(item, contributorId, contributionType) {
    // Add attribution to item
    if (!item.attributions) {
        item.attributions = [];
    }

    item.attributions.push({
        contributor_id: contributorId,
        type: contributionType,
        timestamp: Date.now()
    });

    // Record the contribution
    recordContribution(contributorId, contributionType, {
        item_id: item.id,
        item_type: item.type || 'unknown'
    });

    return item;
}

module.exports = {
    E_DIMENSIONS,
    CONFIG,
    generateContributorId,
    calculateEScore,
    createContributor,
    recordContribution,
    calculateTrustLevel,
    getTrustLevelName,
    loadContributors,
    saveContributors,
    getOrCreateContributor,
    getContributor,
    getLeaderboard,
    getContributorStats,
    attributeToContributor
};
