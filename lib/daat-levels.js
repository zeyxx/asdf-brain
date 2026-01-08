/**
 * SEED 5: 4-Level Daat Decision Matrix
 *
 * "Daat is the hidden sefirah - the bridge between wisdom and action"
 *
 * Implements intelligent context enrichment based on query complexity.
 * Higher levels provide deeper, more transformative guidance.
 *
 * Level 1 (PASSIVE):    Factual responses only
 * Level 2 (SUGGESTIVE): Patterns and connections
 * Level 3 (ACTIVE):     Guidance and recommendations
 * Level 4 (STRATEGIC):  Vision alignment and philosophy
 *
 * @philosophy Daat transforms raw data → information → knowledge → wisdom
 */

'use strict';

const temporal = require('./temporal');

// φ constants for scoring
const PHI = temporal.PHI;
const PHI_INV = temporal.PHI_INV;
const PHI_INV_2 = temporal.PHI_INV_2;

/**
 * Daat Level Definitions
 */
const DAAT_LEVELS = {
    1: {
        name: 'PASSIVE',
        description: 'Factual responses - direct answers only',
        context_depth: 'shallow',
        pattern_inclusion: false,
        guidance: false,
        philosophy_alignment: false,
        token_budget: 500,
        triggers: ['what is', 'how do', 'where is', 'simple', 'quick'],
        response_style: 'concise'
    },
    2: {
        name: 'SUGGESTIVE',
        description: 'Patterns and connections - relate to similar cases',
        context_depth: 'medium',
        pattern_inclusion: true,
        guidance: false,
        philosophy_alignment: false,
        token_budget: 1500,
        triggers: ['pattern', 'similar', 'related', 'compare', 'like'],
        response_style: 'informative'
    },
    3: {
        name: 'ACTIVE',
        description: 'Guidance and recommendations - proactive suggestions',
        context_depth: 'deep',
        pattern_inclusion: true,
        guidance: true,
        philosophy_alignment: false,
        token_budget: 3000,
        triggers: ['should', 'recommend', 'best', 'improve', 'optimize', 'fix'],
        response_style: 'advisory'
    },
    4: {
        name: 'STRATEGIC',
        description: 'Vision alignment - connect to ecosystem philosophy',
        context_depth: 'complete',
        pattern_inclusion: true,
        guidance: true,
        philosophy_alignment: true,
        token_budget: 5000,
        triggers: ['architecture', 'vision', 'strategy', 'philosophy', 'align', 'ecosystem', 'principle'],
        response_style: 'visionary'
    }
};

/**
 * Query complexity indicators
 */
const COMPLEXITY_INDICATORS = {
    // Simple queries (Level 1)
    simple: [
        /^what is/i,
        /^where is/i,
        /^how many/i,
        /^list the/i,
        /^show me/i,
        /^get the/i
    ],

    // Comparative queries (Level 2)
    comparative: [
        /compare/i,
        /similar to/i,
        /difference between/i,
        /pattern/i,
        /relate/i,
        /connection/i
    ],

    // Advisory queries (Level 3)
    advisory: [
        /should i/i,
        /recommend/i,
        /best way/i,
        /how to improve/i,
        /optimize/i,
        /fix/i,
        /debug/i,
        /implement/i
    ],

    // Strategic queries (Level 4)
    strategic: [
        /architect/i,
        /design/i,
        /vision/i,
        /philosophy/i,
        /principle/i,
        /align/i,
        /ecosystem/i,
        /strategy/i,
        /roadmap/i,
        /long.?term/i
    ]
};

/**
 * Calculate query complexity score
 *
 * @param {string} query - The query text
 * @param {Object} context - Additional context (session, project, etc.)
 * @returns {Object} - Complexity analysis
 */
function analyzeQueryComplexity(query, context = {}) {
    const analysis = {
        query,
        scores: {
            simple: 0,
            comparative: 0,
            advisory: 0,
            strategic: 0
        },
        factors: [],
        word_count: query.split(/\s+/).length,
        has_code: /```|`[^`]+`/.test(query),
        has_question: /\?/.test(query)
    };

    // Check against patterns
    for (const [level, patterns] of Object.entries(COMPLEXITY_INDICATORS)) {
        for (const pattern of patterns) {
            if (pattern.test(query)) {
                analysis.scores[level] += 1;
                analysis.factors.push({ level, pattern: pattern.source });
            }
        }
    }

    // Adjust based on context
    if (context.session_depth > 5) {
        // Deep sessions tend to be more complex
        analysis.scores.advisory += 0.5;
    }

    if (context.project === 'manifesto' || context.project === 'ecosystem') {
        // Philosophy-related projects bump to strategic
        analysis.scores.strategic += 0.5;
    }

    if (analysis.word_count > 50) {
        // Long queries are usually more complex
        analysis.scores.advisory += 0.3;
    }

    if (analysis.has_code) {
        // Code-related queries are at least advisory
        analysis.scores.advisory += 0.5;
    }

    return analysis;
}

/**
 * Determine Daat level from query analysis
 *
 * @param {Object} analysis - Query complexity analysis
 * @returns {number} - Daat level (1-4)
 */
function determineDaatLevel(analysis) {
    const { scores } = analysis;

    // Find highest scoring level
    const levelScores = [
        { level: 4, score: scores.strategic },
        { level: 3, score: scores.advisory },
        { level: 2, score: scores.comparative },
        { level: 1, score: scores.simple }
    ];

    // Sort by score descending
    levelScores.sort((a, b) => b.score - a.score);

    // If no clear winner, default based on query length
    if (levelScores[0].score === 0) {
        if (analysis.word_count < 10) return 1;
        if (analysis.word_count < 30) return 2;
        return 3;
    }

    // Use φ threshold for tie-breaking
    // If top two are within PHI_INV_2 of each other, use the higher level
    if (levelScores.length > 1) {
        const diff = levelScores[0].score - levelScores[1].score;
        if (diff < PHI_INV_2 && levelScores[1].level > levelScores[0].level) {
            return levelScores[1].level;
        }
    }

    return levelScores[0].level;
}

/**
 * Get context configuration for a Daat level
 *
 * @param {number} level - Daat level (1-4)
 * @returns {Object} - Context configuration
 */
function getContextConfig(level) {
    const config = DAAT_LEVELS[level] || DAAT_LEVELS[1];

    return {
        level,
        name: config.name,
        token_budget: config.token_budget,
        include_patterns: config.pattern_inclusion,
        include_guidance: config.guidance,
        include_philosophy: config.philosophy_alignment,
        response_style: config.response_style,

        // φ-weighted context layers
        layers: {
            session: level >= 1,
            project: level >= 2,
            cross_project: level >= 3,
            ecosystem: level >= 4,
            philosophy: level >= 4
        },

        // What to inject
        inject: {
            recent_patterns: level >= 2 ? Math.min(5, level * 2) : 0,
            related_decisions: level >= 3 ? Math.min(3, level) : 0,
            philosophy_principles: level >= 4 ? 3 : 0,
            ecosystem_context: level >= 4
        }
    };
}

/**
 * Enrich query with Daat-level appropriate context
 *
 * @param {string} query - Original query
 * @param {Object} sessionContext - Current session context
 * @param {Object} knowledgeBase - Access to knowledge (patterns, decisions, etc.)
 * @returns {Object} - Enriched context package
 */
function enrichWithDaat(query, sessionContext = {}, knowledgeBase = {}) {
    const analysis = analyzeQueryComplexity(query, sessionContext);
    const level = determineDaatLevel(analysis);
    const config = getContextConfig(level);

    const enrichment = {
        original_query: query,
        daat_level: level,
        daat_name: config.name,
        analysis,
        config,

        // Context to inject
        context: {
            session: null,
            patterns: [],
            decisions: [],
            philosophy: [],
            ecosystem: null
        },

        // Response guidance
        guidance: {
            style: config.response_style,
            token_budget: config.token_budget,
            should_cite_sources: level >= 2,
            should_suggest_next: level >= 3,
            should_align_philosophy: level >= 4
        },

        // Metadata
        _phi: {
            level_weight: Math.pow(PHI, level - 1),
            confidence: calculateEnrichmentConfidence(analysis, level)
        }
    };

    // Populate context based on level
    if (config.layers.session && sessionContext) {
        enrichment.context.session = {
            id: sessionContext.session_id,
            depth: sessionContext.session_depth || 0,
            project: sessionContext.project
        };
    }

    if (config.include_patterns && knowledgeBase.patterns) {
        enrichment.context.patterns = selectRelevantPatterns(
            query,
            knowledgeBase.patterns,
            config.inject.recent_patterns
        );
    }

    if (config.include_guidance && knowledgeBase.decisions) {
        enrichment.context.decisions = selectRelevantDecisions(
            query,
            knowledgeBase.decisions,
            config.inject.related_decisions
        );
    }

    if (config.include_philosophy && knowledgeBase.philosophy) {
        enrichment.context.philosophy = selectPhilosophyPrinciples(
            query,
            knowledgeBase.philosophy,
            config.inject.philosophy_principles
        );
    }

    if (config.layers.ecosystem && knowledgeBase.ecosystem) {
        enrichment.context.ecosystem = knowledgeBase.ecosystem;
    }

    return enrichment;
}

/**
 * Calculate confidence in enrichment appropriateness
 *
 * @param {Object} analysis - Query analysis
 * @param {number} level - Determined level
 * @returns {string} - Confidence label
 */
function calculateEnrichmentConfidence(analysis, level) {
    const levelScores = [
        analysis.scores.simple,
        analysis.scores.comparative,
        analysis.scores.advisory,
        analysis.scores.strategic
    ];

    const maxScore = Math.max(...levelScores);
    const totalScore = levelScores.reduce((a, b) => a + b, 0);

    if (totalScore === 0) return 'DEFAULT';
    if (maxScore / totalScore >= PHI_INV) return 'HIGH';
    if (maxScore / totalScore >= PHI_INV_2) return 'MEDIUM';
    return 'LOW';
}

/**
 * Select relevant patterns for context injection
 */
function selectRelevantPatterns(query, patterns, limit) {
    if (!patterns || patterns.length === 0) return [];

    // Simple keyword matching (can be enhanced with embeddings)
    const queryWords = new Set(query.toLowerCase().split(/\s+/));

    const scored = patterns.map(p => {
        const content = (p.content || p.description || '').toLowerCase();
        const contentWords = new Set(content.split(/\s+/));
        const overlap = [...queryWords].filter(w => contentWords.has(w)).length;
        return { pattern: p, score: overlap };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.pattern);
}

/**
 * Select relevant decisions for context injection
 */
function selectRelevantDecisions(query, decisions, limit) {
    if (!decisions || decisions.length === 0) return [];

    const queryWords = new Set(query.toLowerCase().split(/\s+/));

    const scored = decisions.map(d => {
        const content = (d.content || d.rationale || '').toLowerCase();
        const contentWords = new Set(content.split(/\s+/));
        const overlap = [...queryWords].filter(w => contentWords.has(w)).length;
        return { decision: d, score: overlap };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.decision);
}

/**
 * Select philosophy principles for context injection
 */
function selectPhilosophyPrinciples(query, philosophy, limit) {
    if (!philosophy || !philosophy.principles) return [];

    const principles = philosophy.principles;
    const queryLower = query.toLowerCase();

    // Match principles mentioned in query
    const matched = principles.filter(p =>
        queryLower.includes(p.keyword?.toLowerCase() || p.name?.toLowerCase())
    );

    if (matched.length >= limit) {
        return matched.slice(0, limit);
    }

    // Add core principles if not enough matches
    const core = principles.filter(p => p.core === true);
    return [...matched, ...core].slice(0, limit);
}

/**
 * Format enrichment for AI consumption
 *
 * @param {Object} enrichment - Enrichment package
 * @returns {string} - Formatted context string
 */
function formatEnrichmentForAI(enrichment) {
    const lines = [];

    lines.push(`[DAAT LEVEL ${enrichment.daat_level}: ${enrichment.daat_name}]`);
    lines.push(`Response style: ${enrichment.guidance.style}`);
    lines.push('');

    if (enrichment.context.patterns.length > 0) {
        lines.push('RELEVANT PATTERNS:');
        for (const p of enrichment.context.patterns) {
            lines.push(`- ${p.content || p.description}`);
        }
        lines.push('');
    }

    if (enrichment.context.decisions.length > 0) {
        lines.push('RELEVANT DECISIONS:');
        for (const d of enrichment.context.decisions) {
            lines.push(`- ${d.content}: ${d.rationale || ''}`);
        }
        lines.push('');
    }

    if (enrichment.context.philosophy.length > 0) {
        lines.push('PHILOSOPHY ALIGNMENT:');
        for (const p of enrichment.context.philosophy) {
            lines.push(`- ${p.name}: ${p.description || ''}`);
        }
        lines.push('');
    }

    if (enrichment.guidance.should_align_philosophy) {
        lines.push('GUIDANCE: Ensure response aligns with $asdfasdfa philosophy');
    }

    return lines.join('\n');
}

module.exports = {
    DAAT_LEVELS,
    COMPLEXITY_INDICATORS,
    analyzeQueryComplexity,
    determineDaatLevel,
    getContextConfig,
    enrichWithDaat,
    calculateEnrichmentConfidence,
    formatEnrichmentForAI
};
