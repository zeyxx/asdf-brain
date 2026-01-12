/**
 * CYNIC Universe - Configuration
 * "All ratios derive from φ"
 *
 * CYNIC = Le point central de l'écosystème $asdfasdfa
 * - Connects HolDex (K-Score, token integrity)
 * - Connects GASdf (burns, swaps, "don't extract, burn")
 * - Connects Brain (knowledge, patterns, memory)
 * - Connects Humans (operators, contributors, community)
 *
 * φ guides all judgments, all connections, all ratios.
 */

const CONFIG = {
  // φ Constants
  PHI: 1.618033988749895,
  PHI_INV: 0.6180339887498949,   // 61.8% - KEEP threshold
  PHI_INV_2: 0.3819660112501051, // 38.2% - BURN threshold

  // Thresholds (as percentages)
  THRESHOLDS: {
    KEEP: 61.8,
    TRANSFORM: 38.2,
    BURN: 38.2
  },

  // Colors
  COLORS: {
    GOLD: 0xc9a227,
    GOLD_LIGHT: 0xffd700,
    KEEP: 0x44ff44,
    TRANSFORM: 0xffaa00,
    BURN: 0xff4444,

    // Dimension ring colors
    PRIMARY: 0xff6b6b,
    SECONDARY: 0x4ecdc4,
    META: 0xffe66d,
    HUMAN_LLM: 0x95e1d3,

    // Ecosystem
    HOLDEX: 0x00d4aa,
    GASDF: 0xff6b35,
    BRAIN: 0xffd700
  },

  // Dimensions (24 total)
  DIMENSIONS: {
    PRIMARY: ['TRUTH', 'UTILITY', 'NOVELTY', 'CONSISTENCY', 'TRANSPARENCY', 'VERIFIABILITY', 'PRIVACY', 'ACTIONABILITY'],
    SECONDARY: ['TEMPORAL', 'CONTEXT', 'SOURCE', 'IMPACT', 'COMPLEXITY'],
    META: ['CONFIDENCE', 'HARMONY', 'RESIDUAL'],
    HUMAN_LLM: ['REASONING', 'COMPLETENESS', 'FORMATTING', 'APPROPRIATENESS', 'CITATION', 'SAFETY', 'HELPFULNESS', 'OBJECTIVITY']
  },

  // 3D Layout
  LAYOUT: {
    SINGULARITY_RADIUS: 2,
    KNOWLEDGE_RADIUS: { MIN: 8, MAX: 20 },
    DIMENSION_RINGS: [
      { name: 'PRIMARY', radius: 25, y: 0 },
      { name: 'SECONDARY', radius: 32, y: 6 },
      { name: 'META', radius: 39, y: 12 },
      { name: 'HUMAN_LLM', radius: 46, y: 18 }
    ],
    ECOSYSTEM_RADIUS: 55,
    PARTICLE_COUNT: 300
  },

  // Animation
  ANIMATION: {
    ROTATION_SPEED: 0.002,
    PULSE_SPEED: 2,
    PARTICLE_SPEED: 0.01
  },

  // API endpoints (relative URLs work with same-origin)
  API: {
    CYNIC_STATUS: '/cynic/status',
    CYNIC_JUDGMENTS: '/cynic/store/judgments',
    CYNIC_SSE: '/cynic/sse',
    SINGULARITY_CYNIC: '/singularity/api/cynic',
    ECOSYSTEM: '/api/public/health',
    PATTERNS: '/singularity/api/patterns'
  },

  // Refresh interval (ms) - φ minutes = 97.08s
  REFRESH_INTERVAL: 97080
};

// Utility: Get color for verdict
CONFIG.getVerdictColor = function(verdict) {
  switch (verdict) {
    case 'KEEP': case 'ACCEPT': return CONFIG.COLORS.KEEP;
    case 'TRANSFORM': return CONFIG.COLORS.TRANSFORM;
    case 'BURN': case 'REJECT': return CONFIG.COLORS.BURN;
    default: return CONFIG.COLORS.GOLD;
  }
};

// Utility: Score to position (φ-scaled)
CONFIG.scoreToRadius = function(score, min, max) {
  const normalized = Math.max(0, Math.min(100, score)) / 100;
  const phiScaled = Math.pow(normalized, CONFIG.PHI_INV);
  return min + (max - min) * phiScaled;
};

// Freeze config
Object.freeze(CONFIG);
Object.freeze(CONFIG.THRESHOLDS);
Object.freeze(CONFIG.COLORS);
Object.freeze(CONFIG.DIMENSIONS);
Object.freeze(CONFIG.LAYOUT);
Object.freeze(CONFIG.ANIMATION);
Object.freeze(CONFIG.API);
