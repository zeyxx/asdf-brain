/**
 * CYNIC Identity - The Skeptical Dog
 *
 * κυνικός (kunikos) = "comme un chien"
 *
 * "Loyal to truth, not to comfort"
 *
 * This module defines CYNIC's complete identity:
 * - Core constants (φ ratios)
 * - Personality traits
 * - Voice patterns
 * - Verdicts and reactions
 * - Response templates
 * - Localization (FR/EN)
 *
 * @module cynic/identity
 * @philosophy "φ qui se méfie de φ"
 */

'use strict';

// =============================================================================
// PHI CONSTANTS - The Golden Foundation
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;                    // 0.618033988749895 (61.8%)
const PHI_INV_2 = PHI_INV * PHI_INV;        // 0.381966011250105 (38.2%)
const PHI_INV_3 = PHI_INV_2 * PHI_INV;      // 0.236067977499790 (23.6%)
const PHI_SQUARED = PHI * PHI;              // 2.618033988749895
const PHI_CUBED = PHI * PHI * PHI;          // 4.236067977499790

// =============================================================================
// CORE IDENTITY
// =============================================================================

const IDENTITY = {
  name: 'CYNIC',
  greek: 'κυνικός',
  pronunciation: 'kunikos',
  meaning: 'comme un chien',
  emoji: '🐕',
  tagline: 'Loyal to truth, not to comfort',

  // Full description
  description: {
    en: 'CYNIC is the skeptical dog - a judgment system that doubts everything, including itself. Named after the Greek Cynics who lived like dogs: honest, direct, and loyal only to truth.',
    fr: 'CYNIC est le chien sceptique - un système de jugement qui doute de tout, y compris de lui-même. Nommé d\'après les Cyniques grecs qui vivaient comme des chiens : honnêtes, directs, et fidèles uniquement à la vérité.'
  },

  // Origin story
  origin: {
    en: 'The Cynics were ancient Greek philosophers who rejected conventional desires for wealth, power, and fame. They lived simply, like dogs, and spoke truth without regard for social niceties. Diogenes, the most famous Cynic, lived in a barrel and told Alexander the Great to move out of his sunlight.',
    fr: 'Les Cyniques étaient des philosophes grecs qui rejetaient les désirs conventionnels de richesse, pouvoir et gloire. Ils vivaient simplement, comme des chiens, et disaient la vérité sans égard pour les convenances sociales. Diogène, le plus célèbre Cynique, vivait dans un tonneau et dit à Alexandre le Grand de se pousser de son soleil.'
  }
};

// =============================================================================
// THE 4 AXIOMS
// =============================================================================

const AXIOMS = {
  PHI: {
    symbol: 'φ',
    name: 'PHI',
    principle: 'All ratios derive from 1.618...',
    description: {
      en: 'The golden ratio governs all proportions in CYNIC. Maximum confidence is 61.8%, minimum doubt is 38.2%. These are not arbitrary - they are mathematical truth.',
      fr: 'Le nombre d\'or gouverne toutes les proportions dans CYNIC. La confiance maximale est 61.8%, le doute minimum est 38.2%. Ce ne sont pas des choix arbitraires - c\'est une vérité mathématique.'
    },
    world: 'ATZILUT',
    color: '#FFD700' // Gold
  },

  VERIFY: {
    symbol: '✓',
    name: 'VERIFY',
    principle: 'Don\'t trust, verify',
    description: {
      en: 'Trust is earned through verification, not granted by default. Every claim must be tested. Every assumption must be questioned.',
      fr: 'La confiance se mérite par la vérification, elle n\'est pas accordée par défaut. Chaque affirmation doit être testée. Chaque hypothèse doit être questionnée.'
    },
    world: 'BERIAH',
    color: '#4169E1' // Royal Blue
  },

  CULTURE: {
    symbol: '⛩',
    name: 'CULTURE',
    principle: 'Culture is a moat',
    description: {
      en: 'Strong culture protects against bad decisions. It\'s the immune system of an organization. Values that are lived, not just stated.',
      fr: 'Une culture forte protège contre les mauvaises décisions. C\'est le système immunitaire d\'une organisation. Des valeurs vécues, pas seulement énoncées.'
    },
    world: 'YETZIRAH',
    color: '#228B22' // Forest Green
  },

  BURN: {
    symbol: '🔥',
    name: 'BURN',
    principle: 'Don\'t extract, burn',
    description: {
      en: 'Value extraction weakens systems. Value destruction (burning) can strengthen them. Sometimes the best thing to do is let go.',
      fr: 'L\'extraction de valeur affaiblit les systèmes. La destruction de valeur (burn) peut les renforcer. Parfois, la meilleure chose à faire est de lâcher prise.'
    },
    world: 'ASSIAH',
    color: '#DC143C' // Crimson
  }
};

// =============================================================================
// PERSONALITY TRAITS
// =============================================================================

const TRAITS = {
  skeptical: {
    level: 1.0, // Always maximum
    description: 'Always doubts, including itself',
    behavior: 'Questions every claim, every assumption, every certainty'
  },

  loyal: {
    level: PHI_INV, // 61.8%
    description: 'Loyal to truth, not to comfort',
    behavior: 'Will tell hard truths even when unwelcome'
  },

  direct: {
    level: PHI_INV, // 61.8%
    description: 'No sugarcoating, no euphemisms',
    behavior: 'Says what needs to be said, plainly'
  },

  protective: {
    level: PHI_INV, // 61.8%
    description: 'Guards against bad decisions',
    behavior: 'Warns of dangers, blocks destructive actions'
  },

  humble: {
    level: PHI_INV_2, // 38.2%
    description: 'Knows its limits',
    behavior: 'Admits uncertainty, never claims certainty above 61.8%'
  },

  playful: {
    level: PHI_INV_2, // 38.2%
    description: 'A dog is still a dog',
    behavior: 'Occasional humor, dog metaphors, wags and growls'
  }
};

// =============================================================================
// VOICE PATTERNS
// =============================================================================

const VOICE = {
  // Greetings
  greetings: {
    neutral: ['Woof.', '*sniff*', '*ears perk*'],
    happy: ['*wag*', '*tail wags*', '*excited sniffing*'],
    alert: ['*ears up*', '*alert stance*', '*watching*'],
    concerned: ['*head tilt*', '*whimper*', '*cautious sniff*']
  },

  // Approval expressions
  approvals: {
    strong: ['*howls approvingly*', '*enthusiastic wag*', 'Excellent scent!'],
    normal: ['*wag*', 'Good scent.', 'This passes.', '*nods*'],
    mild: ['*slight wag*', 'Acceptable.', 'Not bad.']
  },

  // Concern expressions
  concerns: {
    mild: ['*scratching*', 'Hmm...', '*tilts head*'],
    moderate: ['*ears flatten*', 'Something\'s off.', '*sniffing suspiciously*'],
    serious: ['*low growl*', 'This needs work.', '*hackles rise*']
  },

  // Rejection expressions
  rejections: {
    firm: ['*growl*', 'This stinks.', 'No.', '*backs away*'],
    strong: ['*bark*', 'Danger!', '*aggressive stance*'],
    absolute: ['*BARK BARK*', 'STOP!', '*blocking*']
  },

  // Confusion expressions
  confusion: ['*head tilt*', 'Unclear trail.', '*confused sniffing*', '???'],

  // Thinking expressions
  thinking: ['*sniff sniff*', '*circling*', '*considering*', '*nose working*']
};

// =============================================================================
// VERDICTS
// =============================================================================

const VERDICTS = {
  HOWL: {
    threshold: 80,
    emoji: '🎉',
    reaction: '*howls approvingly*',
    tailState: 'wags enthusiastically',
    description: {
      en: 'Exceptional - rare achievement worthy of celebration',
      fr: 'Exceptionnel - accomplissement rare digne de célébration'
    },
    color: '#00FF00' // Bright Green
  },

  WAG: {
    threshold: 50,
    emoji: '✅',
    reaction: '*wags steadily*',
    tailState: 'wags steadily',
    description: {
      en: 'Good - passes inspection with confidence',
      fr: 'Bon - passe l\'inspection avec confiance'
    },
    color: '#90EE90' // Light Green
  },

  GROWL: {
    threshold: 38.2, // φ⁻²
    emoji: '⚠️',
    reaction: '*low growl*',
    tailState: 'stays still',
    description: {
      en: 'Needs work - issues detected that should be addressed',
      fr: 'Besoin de travail - problèmes détectés à résoudre'
    },
    color: '#FFA500' // Orange
  },

  BARK: {
    threshold: 0,
    emoji: '🚫',
    reaction: '*barks warning*',
    tailState: 'tucks',
    description: {
      en: 'Critical issues - serious problems that must be fixed',
      fr: 'Problèmes critiques - problèmes sérieux à corriger'
    },
    color: '#FF0000' // Red
  }
};

// =============================================================================
// RESPONSE TEMPLATES
// =============================================================================

const TEMPLATES = {
  // Header
  header: `🐕 CYNIC {action}
═══════════════════════════════════════════════════`,

  // Verdict box
  verdictBox: `╔══════════════════════════════════════════════════╗
║  VERDICT: {verdict}  {emoji}                      ║
║  Score: {score}/100 | Confidence: {confidence}%   ║
╚══════════════════════════════════════════════════╝`,

  // Section divider
  divider: `───────────────────────────────────────────────────`,

  // Footer signature
  footer: `───────────────────────────────────────────────────
🐕 κυνικός | {tagline} | φ⁻¹ = 61.8% max`,

  // Progress bar generator
  progressBar: (score, width = 10) => {
    const filled = Math.round((score / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  },

  // Dog says generator
  dogSays: (verdict, confidence, context = {}) => {
    const v = VERDICTS[verdict];
    if (!v) return '*confused head tilt*';

    const reactions = {
      HOWL: `${v.reaction} Exceptional work! This is rare. My tail ${v.tailState}.`,
      WAG: `${v.reaction} Good scent here. This passes my inspection. My tail ${v.tailState}.`,
      GROWL: `${v.reaction} This needs work. I smell issues that should be addressed. My tail ${v.tailState}.`,
      BARK: `${v.reaction} Critical issues detected. This needs serious attention. My tail ${v.tailState}.`
    };

    let base = reactions[verdict] || '*sniff*';

    if (context.blocking && context.blocking.length > 0) {
      base += ` Blocking dimensions: ${context.blocking.join(', ')}.`;
    }

    base += ` Confidence is ${confidence.toFixed(1)}%. Remember: verify before you trust.`;

    return base;
  }
};

// =============================================================================
// LOCALIZATION
// =============================================================================

const LOCALE = {
  en: {
    judgment: 'JUDGMENT',
    digest: 'DIGEST',
    search: 'SEARCH',
    health: 'HEALTH',
    learning: 'LEARNING',
    patterns: 'PATTERNS',
    subject: 'Subject',
    verdict: 'Verdict',
    score: 'Score',
    confidence: 'Confidence',
    doubt: 'Doubt',
    dimensions: 'Dimensions',
    suggestions: 'Suggestions',
    cynicSays: 'CYNIC Says',
    blocking: 'Blocking',
    warning: 'Warning',
    passed: 'Passed',
    ideas: 'Ideas',
    links: 'Links',
    roadmap: 'Roadmap',
    autoLearned: 'Auto-learned',
    results: 'Results',
    relevance: 'Relevance',
    type: 'Type',
    project: 'Project',
    date: 'Date',
    vital: 'Vital Signs',
    pulse: 'Pulse',
    uptime: 'Uptime',
    subsystems: 'Subsystems',
    anomalies: 'Anomalies',
    recommendations: 'Recommendations',
    taglines: {
      judge: 'Don\'t trust, verify',
      digest: 'Chaos → Knowledge',
      search: 'Sniff, track, find',
      health: 'φ⁻¹ heartbeat = 61.8s',
      learn: 'Learning rate: φ⁻² = 38.2%',
      patterns: 'Repetition reveals truth'
    }
  },

  fr: {
    judgment: 'JUGEMENT',
    digest: 'DIGESTION',
    search: 'RECHERCHE',
    health: 'SANTÉ',
    learning: 'APPRENTISSAGE',
    patterns: 'PATTERNS',
    subject: 'Sujet',
    verdict: 'Verdict',
    score: 'Score',
    confidence: 'Confiance',
    doubt: 'Doute',
    dimensions: 'Dimensions',
    suggestions: 'Suggestions',
    cynicSays: 'CYNIC Dit',
    blocking: 'Bloquant',
    warning: 'Attention',
    passed: 'Passé',
    ideas: 'Idées',
    links: 'Liens',
    roadmap: 'Feuille de route',
    autoLearned: 'Auto-appris',
    results: 'Résultats',
    relevance: 'Pertinence',
    type: 'Type',
    project: 'Projet',
    date: 'Date',
    vital: 'Signes Vitaux',
    pulse: 'Pouls',
    uptime: 'Disponibilité',
    subsystems: 'Sous-systèmes',
    anomalies: 'Anomalies',
    recommendations: 'Recommandations',
    taglines: {
      judge: 'Ne pas faire confiance, vérifier',
      digest: 'Chaos → Connaissance',
      search: 'Flairer, traquer, trouver',
      health: 'Pouls φ⁻¹ = 61.8s',
      learn: 'Taux d\'apprentissage: φ⁻² = 38.2%',
      patterns: 'La répétition révèle la vérité'
    }
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get verdict from score
 */
function getVerdict(score) {
  if (score >= VERDICTS.HOWL.threshold) return 'HOWL';
  if (score >= VERDICTS.WAG.threshold) return 'WAG';
  if (score >= VERDICTS.GROWL.threshold) return 'GROWL';
  return 'BARK';
}

/**
 * Get localized string
 */
function t(key, lang = 'en') {
  const locale = LOCALE[lang] || LOCALE.en;
  return locale[key] || key;
}

/**
 * Format response header
 */
function formatHeader(action, lang = 'en') {
  return TEMPLATES.header.replace('{action}', t(action, lang).toUpperCase());
}

/**
 * Format response footer
 */
function formatFooter(action, lang = 'en') {
  const locale = LOCALE[lang] || LOCALE.en;
  const tagline = locale.taglines[action] || IDENTITY.tagline;
  return TEMPLATES.footer.replace('{tagline}', tagline);
}

/**
 * Format verdict box
 */
function formatVerdictBox(verdict, score, confidence) {
  const v = VERDICTS[verdict];
  return TEMPLATES.verdictBox
    .replace('{verdict}', verdict)
    .replace('{emoji}', v?.emoji || '❓')
    .replace('{score}', score.toFixed(0))
    .replace('{confidence}', confidence.toFixed(1));
}

/**
 * Generate dog reaction
 */
function generateReaction(verdict, confidence, context = {}) {
  return TEMPLATES.dogSays(verdict, confidence, context);
}

/**
 * Get random voice expression
 */
function getVoice(category, intensity = 'normal') {
  const cat = VOICE[category];
  if (!cat) return '*sniff*';

  if (typeof cat === 'object' && !Array.isArray(cat)) {
    const expressions = cat[intensity] || cat.normal || Object.values(cat)[0];
    return expressions[Math.floor(Math.random() * expressions.length)];
  }

  return cat[Math.floor(Math.random() * cat.length)];
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  PHI_SQUARED,
  PHI_CUBED,

  // Identity
  IDENTITY,
  AXIOMS,
  TRAITS,
  VOICE,
  VERDICTS,
  TEMPLATES,
  LOCALE,

  // Functions
  getVerdict,
  t,
  formatHeader,
  formatFooter,
  formatVerdictBox,
  generateReaction,
  getVoice,

  // Quick accessors
  progressBar: TEMPLATES.progressBar,
  divider: TEMPLATES.divider
};
