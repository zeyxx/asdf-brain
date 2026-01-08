/**
 * SEED 3: Cross-Project Pattern Pollination
 *
 * "Patterns that emerge independently in multiple projects are ecosystem truths"
 *
 * Automatically links similar patterns across projects.
 * When similarity > 61.8% (φ⁻¹), patterns are linked.
 * Cross-pollinated patterns strengthen both originals.
 *
 * @philosophy Like bees carrying pollen, insights flow between projects
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const temporal = require('./temporal');

// Configuration
const CONFIG = {
    SIMILARITY_THRESHOLD: temporal.PHI_INV,  // 61.8% - patterns link if similarity exceeds
    CROSS_BOOST: temporal.PHI_INV_2,         // 38.2% - boost when cross-referenced
    KNOWLEDGE_DIR: path.join(__dirname, '../knowledge'),
    PROJECTS: ['holdex', 'gasdf', 'brain', 'manifesto', 'ecosystem']
};

/**
 * Calculate text similarity using Jaccard index on word n-grams
 *
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @param {number} n - N-gram size (default 2)
 * @returns {number} - Similarity score (0 to 1)
 */
function calculateSimilarity(text1, text2, n = 2) {
    if (!text1 || !text2) return 0;

    const getNgrams = (text) => {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2);

        const ngrams = new Set();
        for (let i = 0; i <= words.length - n; i++) {
            ngrams.add(words.slice(i, i + n).join(' '));
        }
        return ngrams;
    };

    const ngrams1 = getNgrams(text1);
    const ngrams2 = getNgrams(text2);

    if (ngrams1.size === 0 || ngrams2.size === 0) return 0;

    const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
    const union = new Set([...ngrams1, ...ngrams2]);

    return intersection.size / union.size;
}

/**
 * Calculate semantic similarity using keyword overlap
 *
 * @param {Object} pattern1 - First pattern
 * @param {Object} pattern2 - Second pattern
 * @returns {number} - Similarity score (0 to 1)
 */
function calculateSemanticSimilarity(pattern1, pattern2) {
    const tags1 = new Set(pattern1.tags || []);
    const tags2 = new Set(pattern2.tags || []);

    // Tag overlap
    const tagIntersection = new Set([...tags1].filter(x => tags2.has(x)));
    const tagUnion = new Set([...tags1, ...tags2]);
    const tagSimilarity = tagUnion.size > 0 ? tagIntersection.size / tagUnion.size : 0;

    // Type match
    const typeMatch = pattern1.type === pattern2.type ? 0.3 : 0;

    // Category match
    const categoryMatch = pattern1.category === pattern2.category ? 0.2 : 0;

    // Content similarity
    const content1 = pattern1.content || pattern1.description || '';
    const content2 = pattern2.content || pattern2.description || '';
    const contentSimilarity = calculateSimilarity(content1, content2);

    // Weighted combination
    return (tagSimilarity * 0.3) + typeMatch + categoryMatch + (contentSimilarity * 0.2);
}

/**
 * Find similar patterns across all projects
 *
 * @param {Object} pattern - Pattern to find matches for
 * @param {Array} allPatterns - All patterns in the system
 * @returns {Array} - Similar patterns with similarity scores
 */
function findSimilarPatterns(pattern, allPatterns) {
    const similar = [];

    for (const other of allPatterns) {
        // Skip self
        if (other.id === pattern.id) continue;

        // Skip same project for cross-pollination
        if (other.project === pattern.project) continue;

        const similarity = calculateSemanticSimilarity(pattern, other);

        if (similarity >= CONFIG.SIMILARITY_THRESHOLD) {
            similar.push({
                pattern: other,
                similarity,
                cross_project: true
            });
        }
    }

    // Sort by similarity descending
    return similar.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Link two patterns as related
 *
 * @param {Object} pattern1 - First pattern
 * @param {Object} pattern2 - Second pattern
 * @param {number} similarity - Calculated similarity
 * @returns {Object} - Link record
 */
function createLink(pattern1, pattern2, similarity) {
    const linkId = crypto.createHash('sha256')
        .update(`${pattern1.id}:${pattern2.id}`)
        .digest('hex')
        .slice(0, 16);

    return {
        id: linkId,
        pattern_ids: [pattern1.id, pattern2.id],
        projects: [pattern1.project, pattern2.project],
        similarity,
        cross_project: pattern1.project !== pattern2.project,
        created_at: Date.now(),
        phi_boost: CONFIG.CROSS_BOOST
    };
}

/**
 * Process pollination for a single pattern
 *
 * @param {Object} pattern - Pattern to pollinate
 * @param {Array} allPatterns - All patterns
 * @returns {Object} - Pollination result
 */
function pollinatePattern(pattern, allPatterns) {
    const similar = findSimilarPatterns(pattern, allPatterns);

    if (similar.length === 0) {
        return { pattern, links: [], cross_references: 0 };
    }

    // Update pattern with related patterns
    const relatedPatterns = pattern.related_patterns || [];
    const newLinks = [];

    for (const match of similar) {
        const linkId = `${match.pattern.project}:${match.pattern.id}`;

        if (!relatedPatterns.includes(linkId)) {
            relatedPatterns.push(linkId);
            newLinks.push(createLink(pattern, match.pattern, match.similarity));
        }
    }

    // Apply cross-pollination strength boost
    if (newLinks.length > 0) {
        const boostFactor = 1 + (CONFIG.CROSS_BOOST * newLinks.length);
        pattern.strength = Math.min(
            temporal.CONFIG.MAX_STRENGTH,
            (pattern.strength || 50) * boostFactor
        );
        pattern.cross_pollinated = true;
        pattern.last_pollinated = Date.now();
    }

    pattern.related_patterns = relatedPatterns;

    return {
        pattern,
        links: newLinks,
        cross_references: similar.length
    };
}

/**
 * Load all patterns from knowledge directory
 *
 * @returns {Array} - All patterns
 */
function loadAllPatterns() {
    const patterns = [];
    const patternsDir = path.join(CONFIG.KNOWLEDGE_DIR, 'patterns');

    if (!fs.existsSync(patternsDir)) {
        return patterns;
    }

    const files = fs.readdirSync(patternsDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
        try {
            const content = JSON.parse(fs.readFileSync(path.join(patternsDir, file), 'utf8'));
            const filePatterns = Array.isArray(content) ? content : (content.patterns || []);

            for (const p of filePatterns) {
                // Ensure pattern has required fields
                if (!p.id) {
                    p.id = crypto.createHash('sha256')
                        .update(JSON.stringify(p))
                        .digest('hex')
                        .slice(0, 16);
                }
                patterns.push(p);
            }
        } catch (error) {
            console.error(`[Pollination] Error loading ${file}:`, error.message);
        }
    }

    return patterns;
}

/**
 * Save pollination links
 *
 * @param {Array} links - Links to save
 */
function saveLinks(links) {
    if (links.length === 0) return;

    const linksDir = path.join(CONFIG.KNOWLEDGE_DIR, 'relations');
    const linksFile = path.join(linksDir, 'pattern-links.json');

    if (!fs.existsSync(linksDir)) {
        fs.mkdirSync(linksDir, { recursive: true });
    }

    const existingLinks = fs.existsSync(linksFile)
        ? JSON.parse(fs.readFileSync(linksFile, 'utf8'))
        : { links: [], _metadata: { created: Date.now() } };

    // Add new links (avoid duplicates)
    const existingIds = new Set(existingLinks.links.map(l => l.id));
    const newLinks = links.filter(l => !existingIds.has(l.id));

    existingLinks.links.push(...newLinks);
    existingLinks._metadata.last_updated = Date.now();
    existingLinks._metadata.total_links = existingLinks.links.length;
    existingLinks._metadata.cross_project_links = existingLinks.links.filter(l => l.cross_project).length;

    fs.writeFileSync(linksFile, JSON.stringify(existingLinks, null, 2));

    console.log(`[Pollination] Saved ${newLinks.length} new links (total: ${existingLinks.links.length})`);
}

/**
 * Run full pollination process
 *
 * @returns {Object} - Pollination summary
 */
function runPollination() {
    console.log('[Pollination] Starting cross-project pollination...');

    const allPatterns = loadAllPatterns();
    console.log(`[Pollination] Loaded ${allPatterns.length} patterns`);

    if (allPatterns.length < 2) {
        return { processed: 0, links_created: 0, patterns_linked: 0 };
    }

    const summary = {
        processed: 0,
        links_created: 0,
        patterns_linked: 0,
        cross_project_links: 0
    };

    const allLinks = [];
    const pollinatedPatterns = [];

    for (const pattern of allPatterns) {
        const result = pollinatePattern(pattern, allPatterns);
        summary.processed++;

        if (result.links.length > 0) {
            summary.patterns_linked++;
            summary.links_created += result.links.length;
            summary.cross_project_links += result.links.filter(l => l.cross_project).length;
            allLinks.push(...result.links);
        }

        pollinatedPatterns.push(result.pattern);
    }

    // Save links
    saveLinks(allLinks);

    // Record evolution for pollinated patterns
    for (const pattern of pollinatedPatterns) {
        if (pattern.cross_pollinated) {
            temporal.recordEvolution(pattern.id, 'pollinated', {
                related_count: pattern.related_patterns?.length || 0,
                strength: pattern.strength
            });
        }
    }

    console.log(`[Pollination] Complete: ${summary.patterns_linked} patterns linked, ${summary.links_created} links created`);

    return summary;
}

/**
 * Get ecosystem-level patterns (patterns that appear in multiple projects)
 *
 * @returns {Array} - Ecosystem patterns
 */
function getEcosystemPatterns() {
    const linksFile = path.join(CONFIG.KNOWLEDGE_DIR, 'relations', 'pattern-links.json');

    if (!fs.existsSync(linksFile)) {
        return [];
    }

    const { links } = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
    const crossProjectLinks = links.filter(l => l.cross_project);

    // Count appearances across projects
    const patternProjects = {};

    for (const link of crossProjectLinks) {
        for (let i = 0; i < link.pattern_ids.length; i++) {
            const pid = link.pattern_ids[i];
            const project = link.projects[i];

            if (!patternProjects[pid]) {
                patternProjects[pid] = new Set();
            }
            patternProjects[pid].add(project);
        }
    }

    // Patterns appearing in 3+ projects are ecosystem-level
    const ecosystemPatternIds = Object.entries(patternProjects)
        .filter(([_, projects]) => projects.size >= 3)
        .map(([id, projects]) => ({
            id,
            project_count: projects.size,
            projects: [...projects]
        }));

    return ecosystemPatternIds;
}

/**
 * Detect emergent patterns (new patterns that link to many others)
 *
 * @param {number} threshold - Minimum links to be considered emergent
 * @returns {Array} - Emergent patterns
 */
function detectEmergentPatterns(threshold = 3) {
    const linksFile = path.join(CONFIG.KNOWLEDGE_DIR, 'relations', 'pattern-links.json');

    if (!fs.existsSync(linksFile)) {
        return [];
    }

    const { links } = JSON.parse(fs.readFileSync(linksFile, 'utf8'));

    // Count links per pattern
    const linkCounts = {};

    for (const link of links) {
        for (const pid of link.pattern_ids) {
            linkCounts[pid] = (linkCounts[pid] || 0) + 1;
        }
    }

    // Patterns with many links are emergent/central
    const emergent = Object.entries(linkCounts)
        .filter(([_, count]) => count >= threshold)
        .map(([id, count]) => ({ id, link_count: count }))
        .sort((a, b) => b.link_count - a.link_count);

    return emergent;
}

module.exports = {
    CONFIG,
    calculateSimilarity,
    calculateSemanticSimilarity,
    findSimilarPatterns,
    createLink,
    pollinatePattern,
    loadAllPatterns,
    saveLinks,
    runPollination,
    getEcosystemPatterns,
    detectEmergentPatterns
};
