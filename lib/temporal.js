/**
 * SEED 2: Temporal - Pattern Decay & Evolution
 *
 * "Knowledge has a lifecycle - unused patterns fade, used ones strengthen"
 *
 * Implements φ-based decay for patterns over time.
 * Patterns that aren't referenced decay by φ⁻³ weekly.
 * Patterns that are referenced strengthen.
 *
 * @philosophy Knowledge is alive - it grows with use and fades with neglect
 */

'use strict';

const fs = require('fs');
const path = require('path');

// φ constants - SINGLE SOURCE OF TRUTH
const PHI = 1.618033988749895;
const PHI_2 = PHI * PHI;                    // 2.618... (φ²)
const PHI_INV = 1 / PHI;                    // 0.618... (φ⁻¹)
const PHI_INV_2 = PHI_INV * PHI_INV;        // 0.382... (φ⁻²)
const PHI_INV_3 = PHI_INV_2 * PHI_INV;      // 0.236... (φ⁻³)

// Decay configuration
const CONFIG = {
    DECAY_RATE_WEEKLY: PHI_INV_3,           // ~23.6% decay per week if unused
    STRENGTHEN_RATE: PHI_INV,                // ~61.8% strengthen on reference
    MIN_STRENGTH: 0.1,                       // Minimum strength before archival
    MAX_STRENGTH: 100,                       // Maximum strength cap
    ARCHIVE_THRESHOLD: PHI_INV_3,            // Archive if strength < 23.6%
    HALF_LIFE_HOURS: 168,                    // 1 week
    KNOWLEDGE_DIR: path.join(__dirname, '../knowledge')
};

/**
 * Calculate decay factor based on time elapsed
 * Uses exponential decay with φ⁻³ half-life weekly
 *
 * @param {number} ageMs - Age in milliseconds
 * @returns {number} - Decay factor (0 to 1)
 */
function calculateDecayFactor(ageMs) {
    const ageHours = ageMs / (1000 * 60 * 60);
    // Exponential decay: factor = 0.5^(age / half_life)
    // Modified to use φ⁻³ as decay rate
    const weeksOld = ageHours / CONFIG.HALF_LIFE_HOURS;
    return Math.pow(1 - CONFIG.DECAY_RATE_WEEKLY, weeksOld);
}

/**
 * Apply decay to a pattern's strength
 *
 * @param {Object} pattern - Pattern object with strength and last_accessed
 * @param {number} now - Current timestamp
 * @returns {Object} - Updated pattern
 */
function applyDecay(pattern, now = Date.now()) {
    const lastAccessed = pattern.last_accessed || pattern.created_at || now;
    const ageMs = now - lastAccessed;
    const decayFactor = calculateDecayFactor(ageMs);

    const oldStrength = pattern.strength || 50;
    const newStrength = Math.max(CONFIG.MIN_STRENGTH, oldStrength * decayFactor);

    return {
        ...pattern,
        strength: newStrength,
        decay_applied: now,
        decay_factor: decayFactor,
        should_archive: newStrength < CONFIG.ARCHIVE_THRESHOLD * 100
    };
}

/**
 * Strengthen a pattern when it's referenced/used
 *
 * @param {Object} pattern - Pattern object
 * @param {number} referenceWeight - Weight of the reference (default 1.0)
 * @returns {Object} - Strengthened pattern
 */
function strengthenPattern(pattern, referenceWeight = 1.0) {
    const now = Date.now();
    const currentStrength = pattern.strength || 50;

    // Strengthen by φ⁻¹ (61.8%) scaled by reference weight
    const strengthIncrease = CONFIG.STRENGTHEN_RATE * referenceWeight * 10;
    const newStrength = Math.min(CONFIG.MAX_STRENGTH, currentStrength + strengthIncrease);

    return {
        ...pattern,
        strength: newStrength,
        last_accessed: now,
        access_count: (pattern.access_count || 0) + 1,
        strengthened_at: now
    };
}

/**
 * Process all patterns in a directory, applying decay
 *
 * @param {string} patternsDir - Directory containing pattern files
 * @returns {Object} - Summary of decay operation
 */
function processPatternDecay(patternsDir = path.join(CONFIG.KNOWLEDGE_DIR, 'patterns')) {
    const summary = {
        processed: 0,
        decayed: 0,
        archived: 0,
        strengthened: 0,
        errors: []
    };

    if (!fs.existsSync(patternsDir)) {
        return summary;
    }

    const files = fs.readdirSync(patternsDir).filter(f => f.endsWith('.json'));
    const now = Date.now();

    for (const file of files) {
        try {
            const filePath = path.join(patternsDir, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            // Handle both single pattern and array of patterns
            const patterns = Array.isArray(content) ? content : (content.patterns || [content]);
            const updatedPatterns = [];
            const archivedPatterns = [];

            for (const pattern of patterns) {
                summary.processed++;
                const decayed = applyDecay(pattern, now);

                if (decayed.should_archive) {
                    archivedPatterns.push(decayed);
                    summary.archived++;
                } else {
                    updatedPatterns.push(decayed);
                    if (decayed.decay_factor < 1) {
                        summary.decayed++;
                    }
                }
            }

            // Save updated patterns
            if (Array.isArray(content)) {
                fs.writeFileSync(filePath, JSON.stringify(updatedPatterns, null, 2));
            } else if (content.patterns) {
                content.patterns = updatedPatterns;
                fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
            }

            // Archive weak patterns
            if (archivedPatterns.length > 0) {
                archivePatterns(archivedPatterns, file);
            }

        } catch (error) {
            summary.errors.push({ file, error: error.message });
        }
    }

    console.log(`[Temporal] Decay processed: ${summary.processed} patterns, ${summary.decayed} decayed, ${summary.archived} archived`);
    return summary;
}

/**
 * Archive weak patterns to a separate location
 *
 * @param {Array} patterns - Patterns to archive
 * @param {string} sourceFile - Original file name
 */
function archivePatterns(patterns, sourceFile) {
    const archiveDir = path.join(CONFIG.KNOWLEDGE_DIR, 'archive', 'weak-patterns');

    if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const archiveFile = path.join(archiveDir, `${timestamp}-${sourceFile}`);

    const existingArchive = fs.existsSync(archiveFile)
        ? JSON.parse(fs.readFileSync(archiveFile, 'utf8'))
        : [];

    fs.writeFileSync(archiveFile, JSON.stringify([...existingArchive, ...patterns], null, 2));
}

/**
 * Get pattern evolution history
 *
 * @param {string} patternId - Pattern identifier
 * @returns {Object} - Evolution history
 */
function getPatternEvolution(patternId) {
    const evolutionFile = path.join(CONFIG.KNOWLEDGE_DIR, 'temporal', 'evolution.json');

    if (!fs.existsSync(evolutionFile)) {
        return { pattern_id: patternId, history: [] };
    }

    const evolution = JSON.parse(fs.readFileSync(evolutionFile, 'utf8'));
    return evolution[patternId] || { pattern_id: patternId, history: [] };
}

/**
 * Record pattern evolution event
 *
 * @param {string} patternId - Pattern identifier
 * @param {string} event - Event type (created, referenced, decayed, archived, merged)
 * @param {Object} data - Event data
 */
function recordEvolution(patternId, event, data = {}) {
    const evolutionDir = path.join(CONFIG.KNOWLEDGE_DIR, 'temporal');
    const evolutionFile = path.join(evolutionDir, 'evolution.json');

    if (!fs.existsSync(evolutionDir)) {
        fs.mkdirSync(evolutionDir, { recursive: true });
    }

    const evolution = fs.existsSync(evolutionFile)
        ? JSON.parse(fs.readFileSync(evolutionFile, 'utf8'))
        : {};

    if (!evolution[patternId]) {
        evolution[patternId] = { pattern_id: patternId, history: [] };
    }

    evolution[patternId].history.push({
        event,
        timestamp: Date.now(),
        ...data
    });

    fs.writeFileSync(evolutionFile, JSON.stringify(evolution, null, 2));
}

/**
 * Calculate K-Score for a pattern based on temporal factors
 * K_pattern = 100 × ∛(D × O × L)
 *
 * @param {Object} pattern - Pattern object
 * @returns {number} - Pattern K-Score
 */
function calculatePatternKScore(pattern) {
    // D (Depth) = specificity × detail_level × cross_references
    const specificity = pattern.specificity || 0.5;
    const detailLevel = Math.min(1, (pattern.content?.length || 100) / 500);
    const crossRefs = Math.min(1, (pattern.related_patterns?.length || 0) / 5);
    const D = specificity * detailLevel * (0.5 + crossRefs * 0.5);

    // O (Organic) = independent_discoveries / total_sources
    const sources = pattern.sources?.length || 1;
    const independentSources = pattern.independent_sources || sources;
    const O = Math.min(1, independentSources / Math.max(1, sources));

    // L (Longevity) = decay_adjusted_age × usage_frequency
    const ageMs = Date.now() - (pattern.created_at || Date.now());
    const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30);
    const decayFactor = calculateDecayFactor(ageMs);
    const usageFreq = Math.min(1, (pattern.access_count || 0) / 10);
    const L = decayFactor * (0.5 + usageFreq * 0.5) * Math.min(1, ageMonths / 3);

    // K = 100 × ∛(D × O × L)
    const K = 100 * Math.cbrt(D * O * L);

    return Math.round(K * 100) / 100;
}

// =============================================================================
// SEVERITY CLASSIFICATION (φ-based thresholds)
// =============================================================================

/**
 * φ-based thresholds as percentages (for display)
 * - healthy: 62% (φ⁻¹ × 100)
 * - warning: 38% (φ⁻² × 100)
 * - critical: 24% (φ⁻³ × 100)
 */
const PHI_THRESHOLDS = {
    healthy: Math.round(PHI_INV * 100),     // 62
    warning: Math.round(PHI_INV_2 * 100),   // 38
    critical: Math.round(PHI_INV_3 * 100),  // 24
};

/**
 * Classify a score into severity using φ thresholds
 * Input validation: clamps to [0, max] range
 *
 * @param {number} score - The score to classify (0 to max)
 * @param {number} max - Maximum possible score (default 100)
 * @returns {'healthy'|'warning'|'critical'|'severe'} - Severity level
 */
function classifySeverity(score, max = 100) {
    const clamped = Math.max(0, Math.min(max, score));
    const normalized = clamped / max;
    if (normalized >= PHI_INV) return 'healthy';      // ≥ 61.8%
    if (normalized >= PHI_INV_2) return 'warning';    // ≥ 38.2%
    if (normalized >= PHI_INV_3) return 'critical';   // ≥ 23.6%
    return 'severe';                                   // < 23.6%
}

/**
 * Classify severity by count (more items = worse)
 * Uses φ-based thresholds scaled to 10:
 * - 0 = healthy
 * - 1-2 = warning (≤ φ⁻³ × 10 ≈ 2.36)
 * - 3-4 = critical (≤ φ⁻² × 10 ≈ 3.82)
 * - 5+ = severe
 *
 * @param {number} count - Number of items (issues, mismatches, etc.)
 * @returns {'healthy'|'warning'|'critical'|'severe'} - Severity level
 */
function classifyCountSeverity(count) {
    if (count <= 0) return 'healthy';
    if (count <= Math.round(PHI_INV_3 * 10)) return 'warning';   // ≤ 2
    if (count <= Math.round(PHI_INV_2 * 10)) return 'critical';  // ≤ 4
    return 'severe';
}

/**
 * Track severity classification for future calibration analysis
 * Logs to knowledge/temporal/severity-log.jsonl
 *
 * @param {string} source - Where the classification came from (e.g., 'health', 'deps')
 * @param {number} input - The input value (score or count)
 * @param {string} severity - The resulting severity level
 * @param {Object} context - Optional additional context
 */
function trackSeverity(source, input, severity, context = {}) {
    const logDir = path.join(CONFIG.KNOWLEDGE_DIR, 'temporal');
    const logFile = path.join(logDir, 'severity-log.jsonl');

    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const entry = {
            timestamp: Date.now(),
            source,
            input,
            severity,
            thresholds: PHI_THRESHOLDS,
            ...context,
        };

        fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    } catch (e) {
        // Silent fail - tracking is non-critical
    }
}

/**
 * Get severity distribution statistics for calibration analysis
 *
 * @param {string} source - Optional filter by source
 * @returns {Object} - Distribution stats { healthy: N, warning: N, critical: N, severe: N }
 */
function getSeverityStats(source = null) {
    const logFile = path.join(CONFIG.KNOWLEDGE_DIR, 'temporal', 'severity-log.jsonl');
    const stats = { healthy: 0, warning: 0, critical: 0, severe: 0, total: 0 };

    try {
        if (!fs.existsSync(logFile)) return stats;

        const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
        for (const line of lines) {
            try {
                const entry = JSON.parse(line);
                if (source && entry.source !== source) continue;
                if (stats[entry.severity] !== undefined) {
                    stats[entry.severity]++;
                    stats.total++;
                }
            } catch (e) { /* skip malformed lines */ }
        }
    } catch (e) {
        // Return empty stats on error
    }

    return stats;
}

module.exports = {
    // φ constants
    CONFIG,
    PHI,
    PHI_2,
    PHI_INV,
    PHI_INV_2,
    PHI_INV_3,
    // Decay functions
    calculateDecayFactor,
    applyDecay,
    strengthenPattern,
    processPatternDecay,
    archivePatterns,
    getPatternEvolution,
    recordEvolution,
    calculatePatternKScore,
    // Severity classification (φ-based)
    PHI_THRESHOLDS,
    classifySeverity,
    classifyCountSeverity,
    trackSeverity,
    getSeverityStats,
};
