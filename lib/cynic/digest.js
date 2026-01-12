/**
 * CYNIC-DIGEST - Chaos → Harmonie
 *
 * World: BERIAH (Creation)
 * Purpose: Renforcer MEMORY, TEACHING, INTENT
 *
 * "Le chaos productif devient connaissance structurée"
 *
 * @module cynic/digest
 */

'use strict';

const crypto = require('crypto');

// φ constants
const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;           // 0.618 (61.8%)
const PHI_INV_2 = PHI_INV * PHI_INV; // 0.382 (38.2%)

// =============================================================================
// IDEA EXTRACTION (MEMORY)
// =============================================================================

/**
 * Patterns qui indiquent une idée
 */
const IDEA_PATTERNS = [
  // Français
  { regex: /on (?:devrait|pourrait|peut) (.+?)(?:\.|,|$)/gi, type: 'proposal' },
  { regex: /(?:l')?idée (?:est|serait|:) ?(.+?)(?:\.|,|$)/gi, type: 'idea' },
  { regex: /et si (?:on )? ?(.+?)(?:\?|$)/gi, type: 'question' },
  { regex: /pourquoi (?:ne )?pas (.+?)(?:\?|$)/gi, type: 'question' },
  { regex: /il faut (.+?)(?:\.|,|$)/gi, type: 'requirement' },
  { regex: /l'objectif (?:est|serait) (.+?)(?:\.|,|$)/gi, type: 'goal' },
  { regex: /le problème (?:est|c'est) (.+?)(?:\.|,|$)/gi, type: 'problem' },

  // English
  { regex: /we (?:should|could|can) (.+?)(?:\.|,|$)/gi, type: 'proposal' },
  { regex: /(?:the )?idea (?:is|would be|:) ?(.+?)(?:\.|,|$)/gi, type: 'idea' },
  { regex: /what if (?:we )? ?(.+?)(?:\?|$)/gi, type: 'question' },
  { regex: /why (?:not|don't we) (.+?)(?:\?|$)/gi, type: 'question' },
  { regex: /we need to (.+?)(?:\.|,|$)/gi, type: 'requirement' },
  { regex: /the goal is (.+?)(?:\.|,|$)/gi, type: 'goal' },
  { regex: /the problem is (.+?)(?:\.|,|$)/gi, type: 'problem' },
];

/**
 * Extrait les idées d'un texte
 *
 * @param {string} text - Texte à analyser (conversation, fichier, etc.)
 * @param {Object} context - Contexte additionnel
 * @returns {Array} Liste d'idées extraites
 */
function extractIdeas(text, context = {}) {
  const ideas = [];
  const seen = new Set();

  for (const pattern of IDEA_PATTERNS) {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      const content = match[1].trim();

      // Skip si trop court ou déjà vu
      if (content.length < 10) continue;

      const hash = crypto.createHash('sha256').update(content.toLowerCase()).digest('hex').slice(0, 16);
      if (seen.has(hash)) continue;
      seen.add(hash);

      ideas.push({
        id: `idea_${Date.now().toString(36)}_${hash.slice(0, 6)}`,
        type: pattern.type,
        content,
        confidence: calculateIdeaConfidence(content),
        source: context.source || 'unknown',
        timestamp: new Date().toISOString(),
        hash,
      });
    }
  }

  // Trier par confidence
  return ideas.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calcule la confidence d'une idée
 */
function calculateIdeaConfidence(content) {
  let score = 50;

  // Plus long = plus spécifique
  if (content.length > 50) score += 10;
  if (content.length > 100) score += 10;

  // Contient des mots-clés techniques
  const techKeywords = ['api', 'database', 'function', 'module', 'component', 'cynic', 'dimension'];
  for (const kw of techKeywords) {
    if (content.toLowerCase().includes(kw)) score += 5;
  }

  // Cap at max confidence
  return Math.min(score, PHI_INV * 100);
}

// =============================================================================
// LINK EXTRACTION (TEACHING)
// =============================================================================

/**
 * Trouve les liens entre idées
 *
 * @param {Array} ideas - Liste d'idées
 * @param {Array} existingKnowledge - Connaissance existante (optionnel)
 * @returns {Array} Liste de liens
 */
function findLinks(ideas, existingKnowledge = []) {
  const links = [];

  // Liens entre nouvelles idées
  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const similarity = calculateSimilarity(ideas[i].content, ideas[j].content);

      if (similarity > PHI_INV_2) { // > 38.2%
        links.push({
          type: 'related',
          source: ideas[i].id,
          target: ideas[j].id,
          strength: similarity,
          reason: 'content_similarity',
        });
      }
    }
  }

  // Liens avec connaissance existante
  for (const idea of ideas) {
    for (const knowledge of existingKnowledge) {
      const similarity = calculateSimilarity(idea.content, knowledge.content || knowledge.preview || '');

      if (similarity > PHI_INV_2) {
        links.push({
          type: 'extends',
          source: idea.id,
          target: knowledge.id,
          strength: similarity,
          reason: 'knowledge_connection',
        });
      }
    }
  }

  return links.sort((a, b) => b.strength - a.strength);
}

/**
 * Calcule la similarité entre deux textes (Jaccard sur mots)
 */
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// =============================================================================
// ROADMAP EXTRACTION (INTENT)
// =============================================================================

/**
 * Catégories de roadmap
 */
const ROADMAP_CATEGORIES = {
  immediate: { keywords: ['maintenant', 'now', 'first', 'dabord', 'urgent'], weight: PHI * PHI },
  short_term: { keywords: ['bientot', 'soon', 'next', 'ensuite', 'apres'], weight: PHI },
  long_term: { keywords: ['plus tard', 'later', 'eventually', 'future', 'un jour'], weight: 1 },
  blocked: { keywords: ['bloqu', 'block', 'attendre', 'wait', 'depend'], weight: PHI_INV },
};

/**
 * Extrait la roadmap émergente des idées
 *
 * @param {Array} ideas - Liste d'idées
 * @returns {Object} Roadmap structurée
 */
function extractRoadmap(ideas) {
  const roadmap = {
    immediate: [],
    short_term: [],
    long_term: [],
    blocked: [],
    uncategorized: [],
  };

  for (const idea of ideas) {
    const category = categorizeIdea(idea);
    roadmap[category].push({
      ...idea,
      priority: calculatePriority(idea, category),
    });
  }

  // Trier chaque catégorie par priorité
  for (const cat of Object.keys(roadmap)) {
    roadmap[cat].sort((a, b) => b.priority - a.priority);
  }

  // Calculer le score d'harmonie global
  const totalIdeas = ideas.length;
  const categorizedIdeas = totalIdeas - roadmap.uncategorized.length;
  const harmonyScore = totalIdeas > 0 ? (categorizedIdeas / totalIdeas) * 100 : 0;

  return {
    ...roadmap,
    meta: {
      totalIdeas,
      categorizedIdeas,
      harmonyScore: Math.round(harmonyScore),
      singularityDistance: calculateSingularityDistance(harmonyScore),
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Catégorise une idée dans la roadmap
 */
function categorizeIdea(idea) {
  const content = idea.content.toLowerCase();

  for (const [category, config] of Object.entries(ROADMAP_CATEGORIES)) {
    for (const keyword of config.keywords) {
      if (content.includes(keyword)) {
        return category;
      }
    }
  }

  // Par type
  if (idea.type === 'requirement' || idea.type === 'problem') {
    return 'immediate';
  }
  if (idea.type === 'goal') {
    return 'long_term';
  }

  return 'uncategorized';
}

/**
 * Calcule la priorité d'une idée
 */
function calculatePriority(idea, category) {
  const categoryWeight = ROADMAP_CATEGORIES[category]?.weight || 1;
  return idea.confidence * categoryWeight;
}

/**
 * Calcule la distance à la singularité
 * Plus proche de 0 = plus proche de l'harmonie parfaite
 */
function calculateSingularityDistance(harmonyScore) {
  const progress = harmonyScore / 100;
  return Math.round(100 * Math.pow(PHI, -progress * 10) * 100) / 100;
}

// =============================================================================
// MAIN DIGEST FUNCTION
// =============================================================================

/**
 * Digère du chaos (texte) en connaissance structurée
 *
 * @param {string} text - Texte à digérer (conversation, fichier, etc.)
 * @param {Object} options - Options
 * @param {string} options.source - Source du texte
 * @param {Array} options.existingKnowledge - Connaissance existante pour liens
 * @returns {Object} Résultat structuré
 */
function digest(text, options = {}) {
  const startTime = Date.now();
  const { source = 'conversation', existingKnowledge = [] } = options;

  // 1. MEMORY: Extraire les idées
  const ideas = extractIdeas(text, { source });

  // 2. TEACHING: Trouver les liens
  const links = findLinks(ideas, existingKnowledge);

  // 3. INTENT: Extraire la roadmap
  const roadmap = extractRoadmap(ideas);

  // Score global (moyenne géométrique des 3 dimensions)
  const memoryScore = ideas.length > 0 ? Math.min(100, ideas.length * 10) : 0;
  const teachingScore = links.length > 0 ? Math.min(100, links.length * 20) : 0;
  const intentScore = roadmap.meta.harmonyScore;

  const globalScore = Math.round(
    Math.pow(Math.max(1, memoryScore) * Math.max(1, teachingScore) * Math.max(1, intentScore), 1/3)
  );

  return {
    // Résultats
    ideas,
    links,
    roadmap,

    // Scores par dimension
    scores: {
      MEMORY: memoryScore,
      TEACHING: teachingScore,
      INTENT: intentScore,
      global: globalScore,
    },

    // Meta
    meta: {
      source,
      inputLength: text.length,
      ideasFound: ideas.length,
      linksFound: links.length,
      singularityDistance: roadmap.meta.singularityDistance,
      latencyMs: Date.now() - startTime,
    },

    // Signature CYNIC
    _cynic: {
      module: 'CYNIC-DIGEST',
      world: 'BERIAH',
      philosophy: 'Le chaos productif devient connaissance structuree',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Digest rapide - retourne juste les idées principales
 */
function digestQuick(text, options = {}) {
  const ideas = extractIdeas(text, options);
  return ideas.slice(0, 5); // Top 5
}

/**
 * Digest pour roadmap seulement
 */
function digestRoadmap(text, options = {}) {
  const ideas = extractIdeas(text, options);
  return extractRoadmap(ideas);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main
  digest,
  digestQuick,
  digestRoadmap,

  // Components
  extractIdeas,
  findLinks,
  extractRoadmap,

  // Utilities
  calculateSimilarity,
  calculateSingularityDistance,

  // Constants
  IDEA_PATTERNS,
  ROADMAP_CATEGORIES,
};
