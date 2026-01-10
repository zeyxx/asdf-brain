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
const { CYNIC, quickJudge, VERDICT } = require('./cynic');
const { SelfJudge } = require('./self-judge');

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
 * @param {Object} options - Options including { level_override: number }
 * @returns {Object} - Enriched context package
 */
function enrichWithDaat(query, sessionContext = {}, knowledgeBase = {}, options = {}) {
    const analysis = analyzeQueryComplexity(query, sessionContext);
    const autoLevel = determineDaatLevel(analysis);

    // User can override level (1-4), otherwise use auto-detected
    const level = (options.level_override && options.level_override >= 1 && options.level_override <= 4)
        ? options.level_override
        : autoLevel;

    const wasOverridden = options.level_override && options.level_override !== autoLevel;
    const config = getContextConfig(level);

    const enrichment = {
        original_query: query,
        daat_level: level,
        daat_name: config.name,
        auto_detected_level: autoLevel,
        was_overridden: wasOverridden,
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
    // Handle both array and object formats (patterns can be { all_patterns: [...] } or [...])
    const patternArray = Array.isArray(patterns) ? patterns : (patterns?.all_patterns || []);
    if (!patternArray || patternArray.length === 0) return [];

    // Simple keyword matching (can be enhanced with embeddings)
    const queryWords = new Set(query.toLowerCase().split(/\s+/));

    const scored = patternArray.map(p => {
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
    // Handle both array and object formats (decisions can be { by_category: {...} } or [...])
    let decisionArray = [];
    if (Array.isArray(decisions)) {
        decisionArray = decisions;
    } else if (decisions?.by_category) {
        // Flatten all categories into single array
        decisionArray = Object.values(decisions.by_category).flat();
    }
    if (!decisionArray || decisionArray.length === 0) return [];

    const queryWords = new Set(query.toLowerCase().split(/\s+/));

    const scored = decisionArray.map(d => {
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

// =============================================================================
// CYNIC INTEGRATION
// =============================================================================

/**
 * Create a CYNIC instance configured for Daat-level evaluation
 *
 * @param {number} level - Daat level (1-4)
 * @returns {CYNIC} Configured CYNIC instance
 */
function createDaatCynic(level = 1) {
    const judge = new SelfJudge();

    // Load dimensions based on Daat level
    // Level 1: simple (no dimensions)
    // Level 2: relevance
    // Level 3: relevance + quality
    // Level 4: all dimensions (truth, relevance, quality, ethics)

    if (level >= 2) {
        judge.loadDimension('relevance');
    }
    if (level >= 3) {
        judge.loadDimension('quality');
    }
    if (level >= 4) {
        judge.loadDimension('truth');
        judge.loadDimension('ethics');
    }

    return new CYNIC({
        evaluator: judge.dimensions.size > 0 ? judge : null
    });
}

/**
 * Apply CYNIC judgment to enrichment confidence
 *
 * Takes the enrichment from enrichWithDaat and applies φ-constrained
 * confidence scoring via CYNIC.
 *
 * @param {Object} enrichment - Enrichment from enrichWithDaat
 * @returns {Promise<Object>} Enrichment with CYNIC judgment
 */
async function applyCynicToEnrichment(enrichment) {
    const cynic = createDaatCynic(enrichment.daat_level);

    // Prepare input for CYNIC judgment
    const input = {
        content: enrichment.original_query,
        context: enrichment.context,
        level: enrichment.daat_level,
        patterns_found: enrichment.context.patterns.length,
        decisions_found: enrichment.context.decisions.length
    };

    // Process through CYNIC
    const result = await cynic.process(input, `daat-level-${enrichment.daat_level}`);

    // Merge CYNIC judgment into enrichment
    enrichment._cynic = {
        verdict: result.judgment.verdict,
        confidence: result.judgment.confidence,
        doubt: result.judgment.doubt,
        raw_score: result.judgment.raw,
        reasoning: result.judgment.reasoning,
        action: result.result.action,
        needs_verification: result.result.transformed?._cynic?.needs_verification || false,
        suggested_checks: result.result.transformed?._cynic?.suggested_checks || [],
        ceiling_applied: result.judgment._phi.ceiling_applied,
        floor_applied: result.judgment._phi.floor_applied,
        philosophy: result.judgment._phi.philosophy
    };

    // Override the original confidence with CYNIC's φ-constrained confidence
    enrichment._phi.cynic_confidence = result.judgment.confidence;
    enrichment._phi.cynic_doubt = result.judgment.doubt;

    return enrichment;
}

/**
 * Full Daat + CYNIC enrichment pipeline
 *
 * This is the main entry point for context enrichment with CYNIC judgment.
 * Flow: query → enrichWithDaat → CYNIC judgment → enriched output
 *
 * @param {string} query - Original query
 * @param {Object} sessionContext - Current session context
 * @param {Object} knowledgeBase - Access to knowledge (patterns, decisions, etc.)
 * @param {Object} options - Options including { level_override: number }
 * @returns {Promise<Object>} - Enriched context with CYNIC judgment
 */
async function enrichWithDaatAndCynic(query, sessionContext = {}, knowledgeBase = {}, options = {}) {
    // Step 1: Standard Daat enrichment
    const enrichment = enrichWithDaat(query, sessionContext, knowledgeBase, options);

    // Step 2: Apply CYNIC judgment
    const enrichmentWithCynic = await applyCynicToEnrichment(enrichment);

    return enrichmentWithCynic;
}

/**
 * Format enrichment with CYNIC metadata for AI consumption
 *
 * @param {Object} enrichment - Enrichment package with CYNIC
 * @returns {string} - Formatted context string
 */
function formatEnrichmentWithCynic(enrichment) {
    let output = formatEnrichmentForAI(enrichment);

    if (enrichment._cynic) {
        const c = enrichment._cynic;
        output += '\n';
        output += `[CYNIC JUDGMENT]\n`;
        output += `Verdict: ${c.verdict} | Confidence: ${(c.confidence * 100).toFixed(1)}% | Doubt: ${(c.doubt * 100).toFixed(1)}%\n`;

        if (c.ceiling_applied) {
            output += `⚠ Confidence capped at φ⁻¹ (61.8%) - original was higher\n`;
        }

        if (c.needs_verification) {
            output += `⚠ Verification needed:\n`;
            for (const check of c.suggested_checks) {
                output += `  - ${check}\n`;
            }
        }

        output += `Philosophy: ${c.philosophy}\n`;
    }

    return output;
}

/**
 * Quick Daat + CYNIC judgment for a query
 * Useful for simple confidence checks without full enrichment
 *
 * @param {string} query - Query to analyze
 * @param {Object} context - Optional context
 * @returns {Promise<Object>} Quick judgment result
 */
async function quickDaatJudge(query, context = {}) {
    const analysis = analyzeQueryComplexity(query, context);
    const level = determineDaatLevel(analysis);
    const cynic = createDaatCynic(level);

    const result = await cynic.process({ content: query, level }, `daat-quick-${level}`);

    return {
        query,
        daat_level: level,
        daat_name: DAAT_LEVELS[level].name,
        verdict: result.judgment.verdict,
        confidence: result.judgment.confidence,
        doubt: result.judgment.doubt,
        action: result.result.action
    };
}

module.exports = {
    // Core Daat functions
    DAAT_LEVELS,
    COMPLEXITY_INDICATORS,
    analyzeQueryComplexity,
    determineDaatLevel,
    getContextConfig,
    enrichWithDaat,
    calculateEnrichmentConfidence,
    formatEnrichmentForAI,

    // CYNIC integration
    createDaatCynic,
    applyCynicToEnrichment,
    enrichWithDaatAndCynic,
    formatEnrichmentWithCynic,
    quickDaatJudge
};
