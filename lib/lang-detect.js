/**
 * Language Detection for asdf-brain
 *
 * Simple, fast language detection using characteristic patterns.
 * Supports: en (English), fr (French), mixed
 *
 * "Don't trust, verify" - but keep it simple.
 */

'use strict';

// French characteristic patterns (high signal)
const FR_PATTERNS = [
  /\b(le|la|les|un|une|des)\b/gi,           // Articles
  /\b(je|tu|il|elle|nous|vous|ils|elles)\b/gi, // Pronouns
  /\b(est|sont|été|être|avoir|fait)\b/gi,   // Common verbs
  /\b(dans|pour|avec|sans|sur|sous)\b/gi,   // Prepositions
  /\b(que|qui|quoi|où|comment|pourquoi)\b/gi, // Question words
  /\b(c'est|n'est|qu'il|qu'elle|d'un)\b/gi, // Contractions
  /[àâäéèêëïîôùûüç]/gi,                     // French accents
  /\b(très|mais|aussi|donc|puis)\b/gi,      // Common adverbs
];

// English characteristic patterns (high signal)
const EN_PATTERNS = [
  /\b(the|a|an)\b/gi,                        // Articles
  /\b(is|are|was|were|been|being)\b/gi,      // Be verbs
  /\b(have|has|had|do|does|did)\b/gi,        // Aux verbs
  /\b(this|that|these|those)\b/gi,           // Demonstratives
  /\b(and|but|or|so|yet)\b/gi,               // Conjunctions
  /\b(with|from|into|upon|about)\b/gi,       // Prepositions
  /\b(should|would|could|might)\b/gi,        // Modals
  /\b(which|what|when|where|why|how)\b/gi,   // Question words
];

/**
 * Detect language of text
 * @param {string} text - Text to analyze
 * @returns {Object} { lang: 'en'|'fr'|'mixed', confidence: 0-100, scores: {en, fr} }
 */
function detectLanguage(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return { lang: 'unknown', confidence: 0, scores: { en: 0, fr: 0 } };
  }

  const normalized = text.toLowerCase();
  const wordCount = normalized.split(/\s+/).length;

  // Count matches
  let frScore = 0;
  let enScore = 0;

  for (const pattern of FR_PATTERNS) {
    const matches = normalized.match(pattern) || [];
    frScore += matches.length;
  }

  for (const pattern of EN_PATTERNS) {
    const matches = normalized.match(pattern) || [];
    enScore += matches.length;
  }

  // Normalize by word count
  const frRatio = frScore / wordCount;
  const enRatio = enScore / wordCount;

  // Determine language
  let lang;
  let confidence;

  const total = frScore + enScore;
  if (total === 0) {
    return { lang: 'unknown', confidence: 0, scores: { en: 0, fr: 0 } };
  }

  const frPct = (frScore / total) * 100;
  const enPct = (enScore / total) * 100;

  // Decision thresholds (φ-influenced)
  const DOMINANT_THRESHOLD = 61.8; // φ⁻¹
  const MIXED_THRESHOLD = 38.2;    // φ⁻²

  if (frPct >= DOMINANT_THRESHOLD) {
    lang = 'fr';
    confidence = Math.min(Math.round(frPct), 95);
  } else if (enPct >= DOMINANT_THRESHOLD) {
    lang = 'en';
    confidence = Math.min(Math.round(enPct), 95);
  } else if (Math.abs(frPct - enPct) < MIXED_THRESHOLD) {
    lang = 'mixed';
    confidence = Math.round(50 + (total / wordCount) * 10);
  } else {
    // Slight preference, but not dominant
    lang = frPct > enPct ? 'fr' : 'en';
    confidence = Math.round(Math.max(frPct, enPct));
  }

  return {
    lang,
    confidence: Math.min(confidence, 95), // Never 100% (CYNIC doubt)
    scores: {
      en: Math.round(enPct),
      fr: Math.round(frPct),
    },
    _phi: 'Thresholds: 61.8% dominant, 38.2% mixed boundary',
  };
}

/**
 * Quick language check - just returns lang code
 * @param {string} text - Text to analyze
 * @returns {string} 'en' | 'fr' | 'mixed' | 'unknown'
 */
function quickDetect(text) {
  return detectLanguage(text).lang;
}

/**
 * Check if text contains specific language
 * @param {string} text - Text to analyze
 * @param {string} lang - Language to check ('en' or 'fr')
 * @returns {boolean}
 */
function containsLanguage(text, lang) {
  const result = detectLanguage(text);
  if (lang === 'en') return result.scores.en > 20;
  if (lang === 'fr') return result.scores.fr > 20;
  return false;
}

module.exports = {
  detectLanguage,
  quickDetect,
  containsLanguage,
  // Constants for external use
  THRESHOLDS: {
    DOMINANT: 61.8,
    MIXED: 38.2,
  },
};
