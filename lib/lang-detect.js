/**
 * Language Detection for asdf-brain
 *
 * Simple, fast language detection using characteristic patterns.
 * Supports: en, fr, es, de, it, pt, mixed
 *
 * Strategy: Focus on UNIQUE markers per language to avoid Romance overlap.
 * "Don't trust, verify" - but keep it simple.
 */

'use strict';

// Language patterns - prioritize UNIQUE markers
const PATTERNS = {
  en: [
    /\b(the|a|an)\b/gi,                        // Articles (unique)
    /\b(is|are|was|were|been|being)\b/gi,      // Be verbs
    /\b(have|has|had|do|does|did)\b/gi,        // Aux verbs
    /\b(this|that|these|those)\b/gi,           // Demonstratives
    /\b(and|but|or|so|yet)\b/gi,               // Conjunctions
    /\b(with|from|into|upon|about)\b/gi,       // Prepositions
    /\b(should|would|could|might)\b/gi,        // Modals (unique)
    /\b(which|what|when|where|why|how)\b/gi,   // Question words
  ],
  fr: [
    // UNIQUE French contractions (not in other Romance)
    /\b(c'est|n'est|qu'il|qu'elle|d'un|d'une|l'|j'|n'|s'|m'|t'|qu')\b/gi,
    /\b(c'|d'|l'|j'|n'|s'|m'|t')\w+/gi,        // Elision patterns
    /\b(c'|d'|l'|j'|n'|s'|m'|t')\w+/gi,        // Triple weight (very unique!)
    // French accents (é is common but shared with Spanish/Portuguese, so single weight only)
    /[éèêëîôûùç]/gi,
    // Unique French accent combos (ù, ë, î, ô are rarer in other Romance)
    /[ùëîô]/gi,                                  // Double weight for truly French-specific
    // Common French words
    /\b(le|la|les|un|une|des|du|au|aux)\b/gi,
    /\b(sont|été|être|avoir|fait|peut|qui|que|sera|serait)\b/gi,  // No "est" - overlaps with Spanish "está"
    /\b(de|dans|pour|avec|sans|sur|chez|après|avant|entre)\b/gi,
    /\b(très|mais|aussi|donc|puis|jamais|toujours|tout|tous)\b/gi,
    /\b(ne|pas|plus|rien|ce|cette|ces)\b/gi,   // Negation + demonstratives
    /\w+ée\b|\w+ées\b|\w+és\b/gi,              // Past participle endings (unique)
    /\b(bonjour|bonsoir|salut|merci|oui|non|voilà|alors)\b/gi,  // Common words/greetings
    /\b(comment|pourquoi|quand|où|combien)\b/gi, // Question words
  ],
  es: [
    // UNIQUE Spanish markers
    /[ñ¿¡]/gi,                                 // ñ and inverted punctuation
    /[ñ¿¡]/gi,                                 // Double weight
    /\b(el|los|las|unos|unas)\b/gi,            // Articles (el unique)
    /\b(yo|tú|nosotros|vosotros)\b/gi,         // Pronouns
    /\b(está|están|estoy|estamos)\b/gi,        // Estar conjugations
    /\b(muy|también|porque|además)\b/gi,       // Adverbs
    /\b(hacer|decir|poder|querer|saber)\b/gi,  // Verbs
    /\w+ción\b|\w+ciones\b/gi,                 // -ción endings (unique)
  ],
  de: [
    // UNIQUE German markers
    /[äöüß]/gi,                                // German umlauts + eszett
    /[äöüß]/gi,                                // Double weight
    /\b(der|die|das|ein|eine|einen)\b/gi,      // Articles
    /\b(ich|du|er|wir|ihr)\b/gi,               // Pronouns
    /\b(ist|sind|war|waren|haben|hat)\b/gi,    // Verbs
    /\b(und|aber|oder|denn|weil|dass)\b/gi,    // Conjunctions
    /\b(nicht|auch|noch|schon|sehr)\b/gi,      // Adverbs
    /\b(auf|mit|für|von|zu|bei|nach)\b/gi,     // Prepositions
  ],
  it: [
    // UNIQUE Italian markers
    /\b(gli|dello|della|degli|delle|nell'|dell'|all'|dall'|sull')\b/gi, // Contractions
    /\b(gli|dello|della|degli|delle)\b/gi,     // Double weight for unique contractions
    /(?<![a-zA-ZàâäéèêëïîôùûüÿœæÀÂÄÉÈÊËÏÎÔÙÛÜŸŒÆ])è(?![a-zA-ZàâäéèêëïîôùûüÿœæÀÂÄÉÈÊËÏÎÔÙÛÜŸŒÆ])/gi, // Standalone è only
    /\b(il|lo|uno|gli)\b/gi,                   // Unique articles
    /\b(io|lui|lei|noi|loro|tu|voi)\b/gi,      // Pronouns
    /\b(sono|siamo|hanno|essere|avere|fa|fanno)\b/gi, // Verbs
    /\b(questo|questa|quello|quella|questi|queste)\b/gi, // Demonstratives
    /\b(molto|più|già|sempre|ancora|tutto|tutti)\b/gi, // Adverbs
    /\b(non|anche|così|proprio|ogni|solo)\b/gi, // Common words
    /\b(perché|quando|dove|come|cosa|chi)\b/gi, // Question words
  ],
  pt: [
    // UNIQUE Portuguese markers
    /[ãõ]/gi,                                  // Tildes (unique to Portuguese)
    /[ãõ]/gi,                                  // Double weight
    /[ãõ]/gi,                                  // Triple weight (very distinctive)
    /\b(não|sim|você|vocês)\b/gi,              // Unique words
    /\b(o|os|as|um|uma|uns|umas)\b/gi,         // Articles
    /\b(eu|ele|ela|nós|eles|elas)\b/gi,        // Pronouns
    /\b(é|são|está|estão|tem|têm)\b/gi,        // Verbs
    /\b(muito|mais|já|ainda|sempre)\b/gi,      // Adverbs
    /\w+ão\b|\w+ões\b/gi,                      // -ão/-ões endings (unique)
  ],
};

// Supported languages
const LANGUAGES = Object.keys(PATTERNS);

/**
 * Detect language of text
 * @param {string} text - Text to analyze
 * @returns {Object} { lang, confidence, scores, _phi }
 */
function detectLanguage(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    const scores = {};
    LANGUAGES.forEach(l => scores[l] = 0);
    return { lang: 'unknown', confidence: 0, scores };
  }

  const normalized = text.toLowerCase();
  const wordCount = normalized.split(/\s+/).length;

  // Count matches for each language
  const rawScores = {};
  let total = 0;

  for (const lang of LANGUAGES) {
    let score = 0;
    for (const pattern of PATTERNS[lang]) {
      const matches = normalized.match(pattern) || [];
      score += matches.length;
    }
    rawScores[lang] = score;
    total += score;
  }

  // No matches found
  if (total === 0) {
    const scores = {};
    LANGUAGES.forEach(l => scores[l] = 0);
    return { lang: 'unknown', confidence: 0, scores };
  }

  // Calculate percentages
  const scores = {};
  for (const lang of LANGUAGES) {
    scores[lang] = Math.round((rawScores[lang] / total) * 100);
  }

  // Decision thresholds (φ-influenced)
  const DOMINANT_THRESHOLD = 61.8; // φ⁻¹
  const MIXED_THRESHOLD = 38.2;    // φ⁻²

  // Find dominant language
  let maxLang = LANGUAGES[0];
  let maxScore = scores[maxLang];
  let secondScore = 0;

  for (const lang of LANGUAGES) {
    if (scores[lang] > maxScore) {
      secondScore = maxScore;
      maxScore = scores[lang];
      maxLang = lang;
    } else if (scores[lang] > secondScore) {
      secondScore = scores[lang];
    }
  }

  // Determine result
  let lang;
  let confidence;

  if (maxScore >= DOMINANT_THRESHOLD) {
    lang = maxLang;
    confidence = Math.min(maxScore, 95);
  } else if (maxScore - secondScore < MIXED_THRESHOLD) {
    lang = 'mixed';
    confidence = Math.round(50 + (total / wordCount) * 10);
  } else {
    // Clear leader but below threshold - still classify
    lang = maxLang;
    confidence = maxScore;
  }

  return {
    lang,
    confidence: Math.min(confidence, 95), // Never 100% (CYNIC doubt)
    scores,
    _phi: 'Thresholds: 61.8% dominant, 38.2% mixed boundary',
  };
}

/**
 * Quick language check - just returns lang code
 * @param {string} text - Text to analyze
 * @returns {string} 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'mixed' | 'unknown'
 */
function quickDetect(text) {
  return detectLanguage(text).lang;
}

/**
 * Check if text contains specific language
 * @param {string} text - Text to analyze
 * @param {string} lang - Language to check
 * @returns {boolean}
 */
function containsLanguage(text, lang) {
  const result = detectLanguage(text);
  return result.scores[lang] > 20;
}

module.exports = {
  detectLanguage,
  quickDetect,
  containsLanguage,
  LANGUAGES,
  // Constants for external use
  THRESHOLDS: {
    DOMINANT: 61.8,
    MIXED: 38.2,
  },
};
