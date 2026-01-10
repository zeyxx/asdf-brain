/**
 * Language Detection for asdf-brain
 *
 * Simple, fast language detection using characteristic patterns.
 * Supports: en, fr, es, de, it, pt, mixed
 *
 * "Don't trust, verify" - but keep it simple.
 */

'use strict';

// Language patterns - high signal characteristic words/patterns
const PATTERNS = {
  en: [
    /\b(the|a|an)\b/gi,                        // Articles
    /\b(is|are|was|were|been|being)\b/gi,      // Be verbs
    /\b(have|has|had|do|does|did)\b/gi,        // Aux verbs
    /\b(this|that|these|those)\b/gi,           // Demonstratives
    /\b(and|but|or|so|yet)\b/gi,               // Conjunctions
    /\b(with|from|into|upon|about)\b/gi,       // Prepositions
    /\b(should|would|could|might)\b/gi,        // Modals
    /\b(which|what|when|where|why|how)\b/gi,   // Question words
  ],
  fr: [
    /\b(le|la|les|un|une|des)\b/gi,            // Articles
    /\b(je|tu|il|elle|nous|vous|ils|elles)\b/gi, // Pronouns
    /\b(est|sont|été|être|avoir|fait)\b/gi,    // Common verbs
    /\b(dans|pour|avec|sans|sur|sous)\b/gi,    // Prepositions
    /\b(que|qui|quoi|où|comment|pourquoi)\b/gi, // Question words
    /\b(c'est|n'est|qu'il|qu'elle|d'un)\b/gi,  // Contractions
    /[àâäéèêëïîôùûüç]/gi,                      // French accents
    /\b(très|mais|aussi|donc|puis)\b/gi,       // Common adverbs
  ],
  es: [
    /\b(el|la|los|las|un|una|unos|unas)\b/gi,  // Articles
    /\b(yo|tú|él|ella|nosotros|vosotros|ellos|ellas)\b/gi, // Pronouns
    /\b(es|son|está|están|ser|estar|tiene|tienen)\b/gi, // Common verbs
    /\b(en|para|con|sin|sobre|bajo|entre)\b/gi, // Prepositions
    /\b(que|qué|quién|cómo|dónde|cuándo|por qué)\b/gi, // Question words
    /\b(muy|pero|también|porque|además)\b/gi,  // Common adverbs
    /[áéíóúüñ¿¡]/gi,                           // Spanish accents/punctuation
    /\b(hacer|decir|poder|querer|saber)\b/gi,  // Common verbs
  ],
  de: [
    /\b(der|die|das|ein|eine|einen)\b/gi,      // Articles
    /\b(ich|du|er|sie|wir|ihr|sie)\b/gi,       // Pronouns
    /\b(ist|sind|war|waren|sein|haben|hat)\b/gi, // Common verbs
    /\b(in|auf|mit|für|von|zu|bei|nach)\b/gi,  // Prepositions
    /\b(was|wer|wie|wo|wann|warum)\b/gi,       // Question words
    /\b(und|aber|oder|denn|weil|dass)\b/gi,    // Conjunctions
    /[äöüß]/gi,                                // German characters
    /\b(nicht|auch|noch|schon|sehr)\b/gi,      // Common adverbs
  ],
  it: [
    /\b(il|lo|gli|uno)\b/gi,                   // Unique articles (not shared with fr/es/pt)
    /\b(io|lui|lei|noi|loro)\b/gi,             // Pronouns
    /\b(è|sono|era|erano|essere|avere|hanno)\b/gi, // Common verbs
    /\b(nel|nella|nello|negli|nelle|del|della|dello|dei|degli)\b/gi, // Contractions (unique)
    /\b(che|chi|cosa|perché|quando)\b/gi,      // Question words
    /\b(questo|questa|quello|quella|questi|queste|ciò)\b/gi, // Demonstratives
    /\b(molto|più|già|sempre|ancora|tutto|tutti|ogni)\b/gi, // Common adverbs
    /\b(può|deve|vuole|deve|sembra|significa)\b/gi, // Modal/common verbs
  ],
  pt: [
    /\b(o|a|os|as|um|uma|uns|umas)\b/gi,       // Articles
    /\b(eu|tu|ele|ela|nós|vós|eles|elas)\b/gi, // Pronouns
    /\b(é|são|foi|eram|ser|estar|tem|têm)\b/gi, // Common verbs
    /\b(em|para|com|sem|sobre|sob|entre)\b/gi, // Prepositions
    /\b(que|quem|como|onde|quando|por que|porquê)\b/gi, // Question words
    /\b(e|mas|ou|porém|então|também)\b/gi,     // Conjunctions
    /[ãõç]/gi,                                 // Portuguese characters
    /\b(muito|mais|já|ainda|sempre)\b/gi,      // Common adverbs
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
    // Slight preference, but not dominant
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
 * @returns {string} 'en' | 'fr' | 'es' | 'de' | 'mixed' | 'unknown'
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
