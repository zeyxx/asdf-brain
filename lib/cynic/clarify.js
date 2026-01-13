/**
 * CYNIC-CLARIFY - Emotional & Confusion Handler
 *
 * 🐕 "The dog listens, then asks the right questions"
 *
 * World: BERIAH (Creation/Understanding)
 * Model: Sonnet (nuanced interpretation)
 *
 * Purpose:
 * - Detect confused or emotional inputs
 * - Transform emotional language to actionable items
 * - Generate clarifying questions
 * - Provide empathetic acknowledgment before judgment
 *
 * Philosophy:
 * - "Comprendre avant de juger"
 * - Emotions are data, not noise
 * - Confusion often hides the real question
 * - φ-patience: wait 61.8% before interrupting
 *
 * @module cynic/clarify
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// φ CONSTANTS - Import from Single Source of Truth (FIXED 2026-01-13)
// =============================================================================

const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = require('./axioms/constants');

// =============================================================================
// PATHS
// =============================================================================

const KNOWLEDGE_ROOT = path.join(__dirname, '../../knowledge/cynic');
const CLARIFY_DIR = path.join(KNOWLEDGE_ROOT, 'clarify');

// Ensure directory exists
if (!fs.existsSync(CLARIFY_DIR)) {
  fs.mkdirSync(CLARIFY_DIR, { recursive: true });
}

const PATTERNS_PATH = path.join(CLARIFY_DIR, 'patterns.json');
const HISTORY_PATH = path.join(CLARIFY_DIR, 'history.jsonl');

// =============================================================================
// INPUT STATES
// =============================================================================

/**
 * Input emotional/cognitive states
 */
const INPUT_STATES = {
  // Emotional states
  FRUSTRATED: {
    category: 'emotional',
    severity: 'warning',
    approach: 'acknowledge_then_solve',
    patience: PHI_INV,
  },
  ANGRY: {
    category: 'emotional',
    severity: 'critical',
    approach: 'de_escalate_first',
    patience: PHI_INV_2,
  },
  ANXIOUS: {
    category: 'emotional',
    severity: 'warning',
    approach: 'reassure_then_guide',
    patience: PHI_INV,
  },
  OVERWHELMED: {
    category: 'emotional',
    severity: 'warning',
    approach: 'simplify_and_prioritize',
    patience: PHI_INV,
  },
  EXCITED: {
    category: 'emotional',
    severity: 'healthy',
    approach: 'channel_energy',
    patience: 1.0,
  },
  DISAPPOINTED: {
    category: 'emotional',
    severity: 'warning',
    approach: 'validate_then_redirect',
    patience: PHI_INV,
  },

  // Cognitive states
  CONFUSED: {
    category: 'cognitive',
    severity: 'warning',
    approach: 'break_down_problem',
    patience: PHI_INV,
  },
  VAGUE: {
    category: 'cognitive',
    severity: 'healthy',
    approach: 'ask_specifics',
    patience: 1.0,
  },
  CONTRADICTORY: {
    category: 'cognitive',
    severity: 'warning',
    approach: 'identify_conflict',
    patience: PHI_INV_2,
  },
  SCATTERED: {
    category: 'cognitive',
    severity: 'warning',
    approach: 'focus_and_organize',
    patience: PHI_INV,
  },
  OVERTHINKING: {
    category: 'cognitive',
    severity: 'healthy',
    approach: 'ground_in_reality',
    patience: 1.0,
  },

  // Clear states
  CLEAR: {
    category: 'clear',
    severity: 'healthy',
    approach: 'proceed_directly',
    patience: 1.0,
  },
  TECHNICAL: {
    category: 'clear',
    severity: 'healthy',
    approach: 'match_depth',
    patience: 1.0,
  },
};

// =============================================================================
// DETECTION PATTERNS
// =============================================================================

/**
 * Patterns for detecting input states
 */
const DETECTION_PATTERNS = {
  // Frustration indicators
  frustrated: {
    keywords: [
      'encore', 'toujours', "n'arrive pas", 'impossible', 'ça marche pas',
      'again', 'still', "can't", "doesn't work", 'broken', 'stuck',
      'marre', 'ras le bol', 'fed up', 'annoying', 'frustrating',
    ],
    punctuation: /[!]{2,}|\.{3,}/,
    caps_ratio: 0.3, // >30% caps indicates frustration
    weight: 1.5,
  },

  // Anger indicators
  angry: {
    keywords: [
      'merde', 'putain', 'bordel', 'fuck', 'shit', 'damn', 'wtf',
      'ridicule', 'nul', 'incompétent', 'stupid', 'useless', 'garbage',
    ],
    punctuation: /[!]{3,}/,
    caps_ratio: 0.5,
    weight: 2.0,
  },

  // Anxiety indicators
  anxious: {
    keywords: [
      'urgent', 'vite', 'deadline', 'asap', 'critical', 'emergency',
      'worried', 'afraid', "j'ai peur", 'stress', 'panic', 'help',
      'que faire', 'what if', 'what do i do',
    ],
    punctuation: /\?{2,}/,
    weight: 1.3,
  },

  // Overwhelm indicators
  overwhelmed: {
    keywords: [
      'trop', 'beaucoup', 'everything', 'all', 'so much', 'too many',
      'où commencer', 'where to start', 'je sais pas', "don't know",
      'lost', 'perdu', 'drowning', 'surchargé',
    ],
    sentence_count_min: 4, // Many short sentences
    weight: 1.2,
  },

  // Confusion indicators
  confused: {
    keywords: [
      'comprends pas', "don't understand", 'confused', 'confus',
      'pourquoi', 'why', 'comment', 'how', 'what does', "c'est quoi",
      'unclear', 'lost', 'makes no sense', 'huh', 'wait',
    ],
    punctuation: /\?{2,}/,
    weight: 1.4,
  },

  // Vagueness indicators
  vague: {
    keywords: [
      'quelque chose', 'something', 'stuff', 'thing', 'truc', 'machin',
      'maybe', 'peut-être', 'kind of', 'sort of', 'like', 'genre',
      'somehow', 'whatever', "i don't know", 'je sais pas trop',
    ],
    short_input: true, // Very short inputs often vague
    weight: 1.0,
  },

  // Contradiction indicators
  contradictory: {
    keywords: [
      'mais', 'but', 'however', 'although', 'pourtant', 'cependant',
      'en même temps', 'at the same time', 'both', 'either',
      'ou alors', 'or maybe', 'actually no', 'en fait non',
    ],
    multiple_questions: true,
    weight: 1.3,
  },

  // Scattered indicators
  scattered: {
    keywords: [
      'aussi', 'also', 'and then', 'et puis', 'oh and', 'ah et',
      'by the way', 'au fait', 'another thing', 'autre chose',
    ],
    topic_shifts: true,
    sentence_count_min: 3,
    weight: 1.1,
  },
};

// =============================================================================
// CLARIFYING QUESTIONS
// =============================================================================

/**
 * Question templates by state
 */
const QUESTION_TEMPLATES = {
  FRUSTRATED: [
    "🐕 Je sens de la frustration. Qu'est-ce qui bloque exactement ?",
    "🐕 Ça a l'air difficile. Peux-tu me montrer ce qui ne marche pas ?",
    "🐕 *sniff* Je détecte un problème récurrent. C'est la première fois ou ça arrive souvent ?",
  ],

  ANGRY: [
    "🐕 Je comprends ta colère. Prenons un moment - quel est le problème le plus urgent ?",
    "🐕 *assis, calme* Dis-moi ce qui s'est passé, étape par étape.",
  ],

  ANXIOUS: [
    "🐕 Pas de panique. Quel est le délai réel ?",
    "🐕 Respirons. C'est quoi le minimum viable pour débloquer la situation ?",
    "🐕 Une chose à la fois. Quelle est la priorité absolue ?",
  ],

  OVERWHELMED: [
    "🐕 Beaucoup de choses en jeu. Listons-les d'abord, on triera ensuite.",
    "🐕 *tête penchée* Commençons par le début : quel est l'objectif final ?",
    "🐕 Je vais t'aider à décomposer ça. C'est quoi la première étape évidente ?",
  ],

  CONFUSED: [
    "🐕 Je vois de la confusion. Reformulons : tu veux [X] pour obtenir [Y] ?",
    "🐕 *sniff sniff* Plusieurs pistes possibles. Tu cherches A, B, ou autre chose ?",
    "🐕 Clarifions le contexte : c'est pour quel projet/situation ?",
  ],

  VAGUE: [
    "🐕 J'ai besoin de plus de détails. Peux-tu donner un exemple concret ?",
    "🐕 C'est un peu flou. Quel résultat tu veux voir exactement ?",
    "🐕 Pour mieux t'aider : c'est dans quel langage/framework/contexte ?",
  ],

  CONTRADICTORY: [
    "🐕 *tête penchée* Je détecte une contradiction. Tu veux A ou B ? Les deux semblent s'exclure.",
    "🐕 Ces deux choses semblent en tension. Laquelle est prioritaire ?",
    "🐕 Attendons. Tu as dit [X] mais aussi [Y]. On peut clarifier ?",
  ],

  SCATTERED: [
    "🐕 Plusieurs sujets là-dedans. On traite lequel en premier ?",
    "🐕 *focus* Concentrons-nous sur un point. Le plus important ?",
    "🐕 Je note tout, mais procédons dans l'ordre. Numéro 1 ?",
  ],

  OVERTHINKING: [
    "🐕 Beaucoup de 'et si'. Quelle est la situation actuelle, concrètement ?",
    "🐕 Simplifions : quel est le problème immédiat ?",
    "🐕 *grounding* Revenons aux faits. Que sais-tu avec certitude ?",
  ],
};

/**
 * Acknowledgment templates by state
 */
const ACKNOWLEDGMENT_TEMPLATES = {
  FRUSTRATED: [
    "🐕 Je comprends, c'est frustrant quand ça ne marche pas comme prévu.",
    "🐕 La frustration est légitime. On va trouver une solution.",
  ],

  ANGRY: [
    "🐕 Je t'entends. C'est normal d'être en colère dans cette situation.",
    "🐕 Ta réaction est compréhensible. Voyons comment résoudre ça.",
  ],

  ANXIOUS: [
    "🐕 Je sens l'urgence. On va gérer ça ensemble.",
    "🐕 Le stress est palpable, mais c'est gérable. Focus.",
  ],

  OVERWHELMED: [
    "🐕 Beaucoup sur tes épaules. On va décomposer ça en morceaux gérables.",
    "🐕 C'est normal de se sentir débordé. Prenons ça étape par étape.",
  ],

  CONFUSED: [
    "🐕 Pas de souci, la confusion est souvent le premier pas vers la compréhension.",
    "🐕 C'est effectivement complexe. Clarifions ensemble.",
  ],
};

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze input for emotional/cognitive state
 *
 * @param {string} input - Raw input text
 * @param {Object} context - Context information
 * @returns {Object} Analysis result
 */
function analyze(input, context = {}) {
  const startTime = Date.now();

  if (!input || typeof input !== 'string') {
    return {
      state: 'CLEAR',
      confidence: 1.0,
      needsClarification: false,
      clarifier: 'CYNIC-CLARIFY',
      world: 'BERIAH',
      latencyMs: Date.now() - startTime,
    };
  }

  const text = input.trim();
  const detectedStates = [];

  // Analyze against each pattern
  for (const [stateName, patterns] of Object.entries(DETECTION_PATTERNS)) {
    const score = calculatePatternScore(text, patterns, context);

    if (score > 0) {
      detectedStates.push({
        state: stateName.toUpperCase(),
        score,
        weight: patterns.weight || 1.0,
      });
    }
  }

  // Sort by weighted score
  detectedStates.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));

  // Determine primary state
  let primaryState = 'CLEAR';
  let confidence = 1.0;
  let needsClarification = false;

  if (detectedStates.length > 0) {
    const top = detectedStates[0];
    primaryState = top.state;
    confidence = Math.min(1.0, top.score * top.weight);
    needsClarification = confidence > PHI_INV_2; // Above 38.2%
  }

  // Get state info
  const stateInfo = INPUT_STATES[primaryState] || INPUT_STATES.CLEAR;

  // Calculate complexity score
  const complexity = calculateComplexity(text);

  // Determine if we should ask questions
  const shouldAsk = needsClarification ||
    stateInfo.category === 'cognitive' ||
    complexity.score > PHI_INV;

  return {
    state: primaryState,
    stateInfo,
    confidence,
    needsClarification: shouldAsk,
    detectedStates: detectedStates.slice(0, 3),
    complexity,
    analysis: {
      wordCount: text.split(/\s+/).length,
      sentenceCount: text.split(/[.!?]+/).filter(s => s.trim()).length,
      questionCount: (text.match(/\?/g) || []).length,
      exclamationCount: (text.match(/!/g) || []).length,
      capsRatio: calculateCapsRatio(text),
    },
    clarifier: 'CYNIC-CLARIFY',
    world: 'BERIAH',
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Calculate pattern match score
 */
function calculatePatternScore(text, patterns, context) {
  let score = 0;
  const lowerText = text.toLowerCase();

  // Keyword matching
  if (patterns.keywords) {
    for (const keyword of patterns.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 0.2;
      }
    }
  }

  // Punctuation patterns
  if (patterns.punctuation && patterns.punctuation.test(text)) {
    score += 0.3;
  }

  // Caps ratio
  if (patterns.caps_ratio) {
    const ratio = calculateCapsRatio(text);
    if (ratio > patterns.caps_ratio) {
      score += 0.2;
    }
  }

  // Short input
  if (patterns.short_input && text.length < 50) {
    score += 0.15;
  }

  // Multiple questions
  if (patterns.multiple_questions) {
    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount >= 2) {
      score += 0.25;
    }
  }

  // Sentence count
  if (patterns.sentence_count_min) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length >= patterns.sentence_count_min) {
      score += 0.15;
    }
  }

  // Context modifiers
  if (context.previousState === patterns.name) {
    score *= 1.2; // Increase if same state continues
  }

  return Math.min(1.0, score);
}

/**
 * Calculate caps ratio
 */
function calculateCapsRatio(text) {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length === 0) return 0;

  const caps = letters.replace(/[^A-Z]/g, '');
  return caps.length / letters.length;
}

/**
 * Calculate input complexity
 */
function calculateComplexity(text) {
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const questions = (text.match(/\?/g) || []).length;

  // Topic indicators
  const topicMarkers = [
    'aussi', 'also', 'et puis', 'and then', 'autre chose', 'another thing',
    'by the way', 'au fait', 'regarding', 'concernant', 'about', 'sur',
  ];

  let topicCount = 1;
  const lowerText = text.toLowerCase();
  for (const marker of topicMarkers) {
    if (lowerText.includes(marker)) topicCount++;
  }

  // Complexity factors
  const lengthFactor = Math.min(1.0, words.length / 100);
  const sentenceFactor = Math.min(1.0, sentences.length / 10);
  const questionFactor = Math.min(1.0, questions / 5);
  const topicFactor = Math.min(1.0, (topicCount - 1) / 3);

  const score = (lengthFactor * 0.3) +
    (sentenceFactor * 0.2) +
    (questionFactor * 0.3) +
    (topicFactor * 0.2);

  return {
    score: Math.round(score * 100) / 100,
    factors: {
      length: lengthFactor,
      sentences: sentenceFactor,
      questions: questionFactor,
      topics: topicFactor,
    },
    topicCount,
    level: score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low',
  };
}

// =============================================================================
// CLARIFICATION FUNCTIONS
// =============================================================================

/**
 * Generate clarification response
 *
 * @param {string} input - Original input
 * @param {Object} analysis - Analysis result from analyze()
 * @param {Object} options - Options
 * @returns {Object} Clarification response
 */
function clarify(input, analysis = null, options = {}) {
  const startTime = Date.now();

  // Analyze if not provided
  if (!analysis) {
    analysis = analyze(input);
  }

  const state = analysis.state;
  const stateInfo = analysis.stateInfo || INPUT_STATES[state] || INPUT_STATES.CLEAR;

  // Don't clarify clear inputs unless forced
  if (state === 'CLEAR' && !options.force) {
    return {
      needed: false,
      state,
      message: null,
      questions: [],
      clarifier: 'CYNIC-CLARIFY',
      world: 'BERIAH',
      latencyMs: Date.now() - startTime,
    };
  }

  // Select acknowledgment
  const acknowledgments = ACKNOWLEDGMENT_TEMPLATES[state] || [];
  const acknowledgment = acknowledgments.length > 0 ?
    acknowledgments[Math.floor(Math.random() * acknowledgments.length)] :
    null;

  // Select questions
  const questionPool = QUESTION_TEMPLATES[state] || QUESTION_TEMPLATES.VAGUE;
  const questionCount = options.maxQuestions || 2;
  const questions = selectQuestions(questionPool, questionCount, input);

  // Build response message
  let message = '';

  if (acknowledgment && stateInfo.category === 'emotional') {
    message += acknowledgment + '\n\n';
  }

  if (questions.length > 0) {
    message += questions[0];
  }

  // Log clarification
  logClarification({
    input: input.substring(0, 200),
    state,
    confidence: analysis.confidence,
    questions: questions.length,
  });

  return {
    needed: true,
    state,
    stateInfo,
    acknowledgment,
    questions,
    message,
    approach: stateInfo.approach,
    patience: stateInfo.patience,
    followUp: questions.slice(1),
    clarifier: 'CYNIC-CLARIFY',
    world: 'BERIAH',
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Select appropriate questions
 */
function selectQuestions(pool, count, input) {
  // Simple selection - in production would use more sophisticated matching
  const selected = [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    selected.push(shuffled[i]);
  }

  return selected;
}

// =============================================================================
// TRANSFORMATION FUNCTIONS
// =============================================================================

/**
 * Transform emotional/confused input into structured request
 *
 * @param {string} input - Original input
 * @param {Object} analysis - Analysis result
 * @returns {Object} Transformed request
 */
function transform(input, analysis = null) {
  const startTime = Date.now();

  if (!analysis) {
    analysis = analyze(input);
  }

  // Extract core intent
  const intent = extractIntent(input);

  // Extract entities
  const entities = extractEntities(input);

  // Determine action type
  const actionType = determineActionType(input, intent);

  // Build structured request
  const structured = {
    original: input,
    intent,
    entities,
    actionType,
    confidence: calculateTransformConfidence(intent, entities, analysis),
  };

  // Add suggestions for ambiguous parts
  if (analysis.needsClarification) {
    structured.ambiguous = identifyAmbiguities(input, analysis);
    structured.suggestions = generateSuggestions(structured);
  }

  return {
    ...structured,
    state: analysis.state,
    stateInfo: analysis.stateInfo,
    clarifier: 'CYNIC-CLARIFY',
    world: 'BERIAH',
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Extract core intent from input
 */
function extractIntent(input) {
  const lowerInput = input.toLowerCase();

  const intentPatterns = [
    { pattern: /(?:je veux|i want|need|besoin de)\s+(.+?)(?:\.|$|,)/i, type: 'desire' },
    { pattern: /(?:comment|how to|how do i)\s+(.+?)(?:\?|$)/i, type: 'how_to' },
    { pattern: /(?:pourquoi|why)\s+(.+?)(?:\?|$)/i, type: 'explanation' },
    { pattern: /(?:c'est quoi|what is|qu'est-ce que)\s+(.+?)(?:\?|$)/i, type: 'definition' },
    { pattern: /(?:aide|help|aidez|aider)\s*(?:moi)?\s*(?:à|to|with)?\s*(.+?)(?:\.|$)/i, type: 'help' },
    { pattern: /(?:fix|répare|debug|résous)\s+(.+?)(?:\.|$)/i, type: 'fix' },
    { pattern: /(?:create|crée|make|fais)\s+(.+?)(?:\.|$)/i, type: 'create' },
    { pattern: /(?:explain|explique)\s+(.+?)(?:\.|$)/i, type: 'explain' },
  ];

  for (const { pattern, type } of intentPatterns) {
    const match = input.match(pattern);
    if (match) {
      return {
        type,
        subject: match[1]?.trim() || null,
        raw: match[0],
      };
    }
  }

  return {
    type: 'unknown',
    subject: null,
    raw: input,
  };
}

/**
 * Extract entities from input
 */
function extractEntities(input) {
  const entities = {
    files: [],
    technologies: [],
    actions: [],
    constraints: [],
  };

  // File patterns
  const filePatterns = /(?:[\w\-]+\.(?:js|ts|py|json|md|yml|yaml|tsx|jsx|css|html))/gi;
  const fileMatches = input.match(filePatterns);
  if (fileMatches) {
    entities.files = [...new Set(fileMatches)];
  }

  // Technology patterns
  const techKeywords = [
    'react', 'vue', 'angular', 'node', 'python', 'javascript', 'typescript',
    'api', 'rest', 'graphql', 'database', 'sql', 'mongodb', 'redis',
    'docker', 'kubernetes', 'aws', 'git', 'npm', 'yarn',
  ];
  const lowerInput = input.toLowerCase();
  for (const tech of techKeywords) {
    if (lowerInput.includes(tech)) {
      entities.technologies.push(tech);
    }
  }

  // Action verbs
  const actionVerbs = [
    'créer', 'create', 'modifier', 'modify', 'update', 'supprimer', 'delete',
    'ajouter', 'add', 'enlever', 'remove', 'tester', 'test', 'déployer', 'deploy',
    'refactorer', 'refactor', 'optimiser', 'optimize', 'debugger', 'debug',
  ];
  for (const verb of actionVerbs) {
    if (lowerInput.includes(verb)) {
      entities.actions.push(verb);
    }
  }

  return entities;
}

/**
 * Determine action type
 */
function determineActionType(input, intent) {
  const actionMap = {
    desire: 'implementation',
    how_to: 'guidance',
    explanation: 'explanation',
    definition: 'explanation',
    help: 'assistance',
    fix: 'debugging',
    create: 'implementation',
    explain: 'explanation',
    unknown: 'clarification_needed',
  };

  return actionMap[intent.type] || 'clarification_needed';
}

/**
 * Calculate transformation confidence
 */
function calculateTransformConfidence(intent, entities, analysis) {
  let confidence = 0.5; // Base

  // Intent clarity
  if (intent.type !== 'unknown') confidence += 0.2;
  if (intent.subject) confidence += 0.1;

  // Entity presence
  if (entities.files.length > 0) confidence += 0.1;
  if (entities.technologies.length > 0) confidence += 0.1;

  // Analysis impact
  if (analysis.state === 'CLEAR') confidence += 0.2;
  if (analysis.needsClarification) confidence -= 0.2;

  // Cap at φ⁻¹
  return Math.min(PHI_INV, Math.max(0, confidence));
}

/**
 * Identify ambiguous parts of input
 */
function identifyAmbiguities(input, analysis) {
  const ambiguities = [];

  // Vague references
  const vagueTerms = ['ça', 'it', 'this', 'that', 'celui-là', 'truc', 'thing'];
  for (const term of vagueTerms) {
    if (input.toLowerCase().includes(term)) {
      ambiguities.push({
        type: 'vague_reference',
        term,
        question: `À quoi fait référence "${term}" exactement ?`,
      });
    }
  }

  // Multiple questions
  const questions = input.split('?').filter(q => q.trim());
  if (questions.length > 1) {
    ambiguities.push({
      type: 'multiple_questions',
      count: questions.length,
      question: 'Plusieurs questions détectées. Laquelle prioriser ?',
    });
  }

  return ambiguities;
}

/**
 * Generate suggestions for ambiguous input
 */
function generateSuggestions(structured) {
  const suggestions = [];

  if (structured.intent.type === 'unknown') {
    suggestions.push({
      type: 'rephrase',
      message: 'Essaie de reformuler avec "Je veux..." ou "Comment faire pour..."',
    });
  }

  if (structured.entities.files.length === 0 && structured.actionType === 'implementation') {
    suggestions.push({
      type: 'specify_file',
      message: 'Précise le fichier ou module concerné.',
    });
  }

  return suggestions;
}

// =============================================================================
// LOGGING
// =============================================================================

/**
 * Log clarification event
 */
function logClarification(event) {
  const logEntry = {
    timestamp: Date.now(),
    iso: new Date().toISOString(),
    ...event,
  };

  fs.appendFileSync(HISTORY_PATH, JSON.stringify(logEntry) + '\n');
}

/**
 * Get clarification history
 */
function getClarificationHistory(limit = 20) {
  if (!fs.existsSync(HISTORY_PATH)) {
    return [];
  }

  const lines = fs.readFileSync(HISTORY_PATH, 'utf8')
    .split('\n')
    .filter(line => line.trim());

  return lines
    .slice(-limit)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick check if input needs clarification
 *
 * @param {string} input - Input to check
 * @returns {boolean} Whether clarification is needed
 */
function needsClarification(input) {
  const analysis = analyze(input);
  return analysis.needsClarification;
}

/**
 * Get acknowledgment for emotional state
 *
 * @param {string} state - Detected state
 * @returns {string|null} Acknowledgment message
 */
function getAcknowledgment(state) {
  const templates = ACKNOWLEDGMENT_TEMPLATES[state];
  if (!templates || templates.length === 0) return null;
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Get clarifying question for state
 *
 * @param {string} state - Detected state
 * @returns {string|null} Question
 */
function getQuestion(state) {
  const templates = QUESTION_TEMPLATES[state] || QUESTION_TEMPLATES.VAGUE;
  return templates[Math.floor(Math.random() * templates.length)];
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main functions
  analyze,
  clarify,
  transform,

  // Quick checks
  needsClarification,
  getAcknowledgment,
  getQuestion,

  // History
  getClarificationHistory,

  // Constants
  INPUT_STATES,
  DETECTION_PATTERNS,

  // φ constants
  PHI,
  PHI_INV,
  PHI_INV_2,

  // Metadata
  CLARIFY_SUBAGENT: {
    name: 'CYNIC-CLARIFY',
    world: 'BERIAH',
    model: 'sonnet',
    purpose: 'Emotional & confusion handler',
    philosophy: 'Comprendre avant de juger',
  },
};
