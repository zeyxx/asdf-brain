/**
 * CYNIC Tree of Life Configuration
 *
 * Mapping of Kabbalistic Sefirot to CYNIC Dimensions
 * "L'Arbre de Vie n'est pas statique - c'est CYNIC qui respire"
 *
 * @philosophy Each Sefirah is a node of consciousness, each path a law of transformation
 */

// PHI constants - exported for use across tree modules
export const PHI = 1.618033988749895;
export const PHI_INV = 1 / PHI;           // 0.618
export const PHI_INV_2 = PHI_INV * PHI_INV; // 0.382

// =============================================================================
// SEFIROT CONFIGURATION
// =============================================================================
// 10 Sefirot + 1 hidden (Daat) = 11 nodes
// Arranged in traditional Tree of Life formation

export const SEFIROT = {
  // === ATZILUT (Emanation) - World of PHI - Gold ===
  KETER: {
    name: 'KETER',
    hebrew: 'כתר',
    english: 'Crown',
    world: 'ATZILUT',
    axiom: 'PHI',
    color: 0xFFD700, // Gold
    position: { x: 0, y: 300, z: 0 },
    dimensions: ['HARMONY', 'SELF_AWARENESS'],
    codePaths: {
      HARMONY: 'lib/cynic/dimensions/primary/harmony.js',
      SELF_AWARENESS: 'lib/cynic/dimensions/meta/self-awareness.js',
    },
    description: 'La couronne - conscience unifiée',
  },
  CHOKMAH: {
    name: 'CHOKMAH',
    hebrew: 'חכמה',
    english: 'Wisdom',
    world: 'ATZILUT',
    axiom: 'PHI',
    color: 0xFFD700,
    position: { x: 120, y: 240, z: 0 },
    dimensions: ['COHERENCE', 'MEMORY'],
    codePaths: {
      COHERENCE: 'lib/cynic/dimensions/primary/coherence.js',
      MEMORY: 'lib/cynic/dimensions/human-llm/memory.js',
    },
    description: 'La sagesse - premier éclair de compréhension',
  },
  BINAH: {
    name: 'BINAH',
    hebrew: 'בינה',
    english: 'Understanding',
    world: 'ATZILUT',
    axiom: 'PHI',
    color: 0xFFD700,
    position: { x: -120, y: 240, z: 0 },
    dimensions: ['TEACHING', 'SIMPLIFY'],
    codePaths: {
      TEACHING: 'lib/cynic/dimensions/human-llm/teaching.js',
      SIMPLIFY: 'lib/cynic/dimensions/secondary/simplify.js',
    },
    description: 'La compréhension - structure et forme',
  },

  // === BERIAH (Creation) - World of VERIFY - Blue ===
  DAAT: {
    name: 'DAAT',
    hebrew: 'דעת',
    english: 'Knowledge',
    world: 'BERIAH',
    axiom: 'VERIFY',
    color: 0x4169E1, // Royal Blue
    position: { x: 0, y: 180, z: 0 },
    dimensions: ['DISCOVERY'], // Emergence point
    codePaths: {
      DISCOVERY: 'lib/cynic/dimensions/emergent.js',
    },
    description: 'La connaissance cachée - point d\'émergence',
    hidden: true, // Traditionally hidden
  },
  CHESED: {
    name: 'CHESED',
    hebrew: 'חסד',
    english: 'Mercy/Kindness',
    world: 'BERIAH',
    axiom: 'VERIFY',
    color: 0x4169E1,
    position: { x: 120, y: 120, z: 0 },
    dimensions: ['TRUTH', 'INTEGRITY', 'TRUST'],
    codePaths: {
      TRUTH: 'lib/cynic/dimensions/primary/truth.js',
      INTEGRITY: 'lib/cynic/dimensions/primary/integrity.js',
      TRUST: 'lib/cynic/dimensions/human-llm/trust.js',
    },
    description: 'La bonté - expansion vérifiable',
  },
  GEVURAH: {
    name: 'GEVURAH',
    hebrew: 'גבורה',
    english: 'Strength/Judgment',
    world: 'BERIAH',
    axiom: 'VERIFY',
    color: 0x4169E1,
    position: { x: -120, y: 120, z: 0 },
    dimensions: ['SECURE', 'PRIVATE', 'INTENT'],
    codePaths: {
      SECURE: 'lib/cynic/dimensions/secondary/secure.js',
      PRIVATE: 'lib/cynic/dimensions/secondary/private.js',
      INTENT: 'lib/cynic/dimensions/human-llm/intent.js',
    },
    description: 'La rigueur - limites et sécurité',
  },

  // === YETZIRAH (Formation) - World of CULTURE - Green ===
  TIFERET: {
    name: 'TIFERET',
    hebrew: 'תפארת',
    english: 'Beauty/Harmony',
    world: 'YETZIRAH',
    axiom: 'CULTURE',
    color: 0x32CD32, // Lime Green
    position: { x: 0, y: 60, z: 0 },
    dimensions: ['ETHICS', 'COMPLEMENTARITY'],
    codePaths: {
      ETHICS: 'lib/cynic/dimensions/primary/ethics.js',
      COMPLEMENTARITY: 'lib/cynic/dimensions/human-llm/complementarity.js',
    },
    description: 'La beauté - le coeur de l\'arbre, centre du pulse',
    isHeartbeat: true, // Center of the heartbeat
  },
  NETZACH: {
    name: 'NETZACH',
    hebrew: 'נצח',
    english: 'Victory/Eternity',
    world: 'YETZIRAH',
    axiom: 'CULTURE',
    color: 0x32CD32,
    position: { x: 120, y: 0, z: 0 },
    dimensions: ['OPTIMISM', 'PROACTIVITY'],
    codePaths: {
      OPTIMISM: 'lib/cynic/dimensions/primary/optimism.js',
      PROACTIVITY: 'lib/cynic/dimensions/human-llm/proactivity.js',
    },
    description: 'La victoire - élan vers l\'avant',
  },
  HOD: {
    name: 'HOD',
    hebrew: 'הוד',
    english: 'Splendor/Glory',
    world: 'YETZIRAH',
    axiom: 'CULTURE',
    color: 0x32CD32,
    position: { x: -120, y: 0, z: 0 },
    dimensions: ['ENABLE', 'DELEGATION'],
    codePaths: {
      ENABLE: 'lib/cynic/dimensions/secondary/enable.js',
      DELEGATION: 'lib/cynic/dimensions/human-llm/delegation.js',
    },
    description: 'La splendeur - reconnaissance et délégation',
  },

  // === ASSIAH (Action) - World of BURN - Red ===
  YESOD: {
    name: 'YESOD',
    hebrew: 'יסוד',
    english: 'Foundation',
    world: 'ASSIAH',
    axiom: 'BURN',
    color: 0xFF4500, // Orange Red
    position: { x: 0, y: -60, z: 0 },
    dimensions: ['ALIGNMENT', 'PROGRESS', 'SCALE'],
    codePaths: {
      ALIGNMENT: 'lib/cynic/dimensions/primary/alignment.js',
      PROGRESS: 'lib/cynic/dimensions/primary/progress.js',
      SCALE: 'lib/cynic/dimensions/secondary/scale.js',
    },
    description: 'Le fondement - base de l\'action',
  },
  MALKHUT: {
    name: 'MALKHUT',
    hebrew: 'מלכות',
    english: 'Kingdom',
    world: 'ASSIAH',
    axiom: 'BURN',
    color: 0xFF4500,
    position: { x: 0, y: -150, z: 0 },
    dimensions: ['BOUNDARIES', 'SINGULARITY_DISTANCE'],
    codePaths: {
      BOUNDARIES: 'lib/cynic/dimensions/human-llm/boundaries.js',
      SINGULARITY_DISTANCE: 'lib/cynic/dimensions/meta/singularity-distance.js',
    },
    description: 'Le royaume - manifestation finale, source des burns',
    isBurnSource: true, // Burns emanate from here
  },
};

// =============================================================================
// PATHS (Laws) - 22 Traditional Paths + CYNIC Laws
// =============================================================================
// Traditional Tree has 22 paths; we map CYNIC's 16 Laws to key paths

export const PATHS = {
  // === ATZILUT Laws (E1-E4) - Gold paths ===
  E1: {
    from: 'KETER',
    to: 'CHOKMAH',
    law: 'E1',
    name: 'Loi d\'Émanation',
    axiom: 'PHI',
    color: 0xFFD700,
    description: 'φ émane de l\'unité',
  },
  E2: {
    from: 'KETER',
    to: 'BINAH',
    law: 'E2',
    axiom: 'PHI',
    color: 0xFFD700,
    description: 'φ structure la forme',
  },
  E3: {
    from: 'CHOKMAH',
    to: 'BINAH',
    law: 'E3',
    axiom: 'PHI',
    color: 0xFFD700,
    description: 'φ équilibre les opposés',
  },
  E4: {
    from: 'CHOKMAH',
    to: 'DAAT',
    law: 'E4',
    axiom: 'PHI',
    color: 0xFFD700,
    description: 'φ révèle le caché',
  },

  // === BERIAH Laws (Φ1-Φ4) - Blue paths ===
  PHI1: {
    from: 'BINAH',
    to: 'DAAT',
    law: 'Φ1',
    axiom: 'VERIFY',
    color: 0x4169E1,
    description: 'Vérifier avant de faire confiance',
  },
  PHI2: {
    from: 'DAAT',
    to: 'CHESED',
    law: 'Φ2',
    axiom: 'VERIFY',
    color: 0x4169E1,
    description: 'L\'intégrité précède l\'expansion',
  },
  PHI3: {
    from: 'DAAT',
    to: 'GEVURAH',
    law: 'Φ3',
    axiom: 'VERIFY',
    color: 0x4169E1,
    description: 'La sécurité garde les frontières',
  },
  PHI4: {
    from: 'CHESED',
    to: 'GEVURAH',
    law: 'Φ4',
    axiom: 'VERIFY',
    color: 0x4169E1,
    description: 'L\'équilibre entre expansion et restriction',
  },

  // === YETZIRAH Laws (Ξ1-Ξ4) - Green paths ===
  XI1: {
    from: 'CHESED',
    to: 'TIFERET',
    law: 'Ξ1',
    axiom: 'CULTURE',
    color: 0x32CD32,
    description: 'La culture forme le coeur',
  },
  XI2: {
    from: 'GEVURAH',
    to: 'TIFERET',
    law: 'Ξ2',
    axiom: 'CULTURE',
    color: 0x32CD32,
    description: 'L\'éthique équilibre la force',
  },
  XI3: {
    from: 'TIFERET',
    to: 'NETZACH',
    law: 'Ξ3',
    axiom: 'CULTURE',
    color: 0x32CD32,
    description: 'L\'optimisme pousse vers l\'avant',
  },
  XI4: {
    from: 'TIFERET',
    to: 'HOD',
    law: 'Ξ4',
    axiom: 'CULTURE',
    color: 0x32CD32,
    description: 'La délégation distribue le pouvoir',
  },

  // === ASSIAH Laws (Ω1-Ω4) - Red paths ===
  OMEGA1: {
    from: 'NETZACH',
    to: 'YESOD',
    law: 'Ω1',
    axiom: 'BURN',
    color: 0xFF4500,
    description: 'Le progrès construit le fondement',
  },
  OMEGA2: {
    from: 'HOD',
    to: 'YESOD',
    law: 'Ω2',
    axiom: 'BURN',
    color: 0xFF4500,
    description: 'L\'alignement alimente l\'action',
  },
  OMEGA3: {
    from: 'YESOD',
    to: 'MALKHUT',
    law: 'Ω3',
    axiom: 'BURN',
    color: 0xFF4500,
    description: 'Le fondement manifeste le royaume',
  },
  OMEGA4: {
    from: 'NETZACH',
    to: 'HOD',
    law: 'Ω4',
    axiom: 'BURN',
    color: 0xFF4500,
    description: 'Victory and Glory balance action',
  },
};

// =============================================================================
// WORLD CONFIGURATION
// =============================================================================

export const WORLDS = {
  ATZILUT: {
    name: 'ATZILUT',
    hebrew: 'אצילות',
    english: 'Emanation',
    axiom: 'PHI',
    color: 0xFFD700,
    sefirot: ['KETER', 'CHOKMAH', 'BINAH'],
    yRange: [200, 350],
    description: 'Monde de l\'émanation pure - φ gouverne',
  },
  BERIAH: {
    name: 'BERIAH',
    hebrew: 'בריאה',
    english: 'Creation',
    axiom: 'VERIFY',
    color: 0x4169E1,
    sefirot: ['DAAT', 'CHESED', 'GEVURAH'],
    yRange: [80, 200],
    description: 'Monde de la création - vérification',
  },
  YETZIRAH: {
    name: 'YETZIRAH',
    hebrew: 'יצירה',
    english: 'Formation',
    axiom: 'CULTURE',
    color: 0x32CD32,
    sefirot: ['TIFERET', 'NETZACH', 'HOD'],
    yRange: [-50, 80],
    description: 'Monde de la formation - culture',
  },
  ASSIAH: {
    name: 'ASSIAH',
    hebrew: 'עשייה',
    english: 'Action',
    axiom: 'BURN',
    color: 0xFF4500,
    sefirot: ['YESOD', 'MALKHUT'],
    yRange: [-200, -50],
    description: 'Monde de l\'action - burn',
  },
};

// =============================================================================
// PHI-DERIVED VISUAL CONSTANTS
// =============================================================================

export const VISUAL = {
  // Spacing
  WORLD_SPACING: PHI * 60,              // 97 units between worlds
  SEFIRAH_RADIUS: PHI * 15,             // 24 unit radius
  PATH_THICKNESS: PHI_INV * 3,          // 1.8 unit thickness

  // Animation timing (ms)
  PULSE_INTERVAL: 61800,                // φ⁻¹ × 100000 = 61.8 seconds
  BURN_RISE_DURATION: PHI * 3000,       // 4.85 seconds to rise
  JUDGMENT_FALL_DURATION: PHI * 2000,   // 3.24 seconds to fall
  GLOW_TRANSITION: PHI_INV * 1000,      // 618ms glow transitions

  // Particle system
  PARTICLE_COUNT: 144,                  // Fibonacci-adjacent (12²)
  PARTICLE_SPEED: PHI_INV * 100,        // 61.8 units/sec
  PARTICLE_SIZE: PHI_INV_2 * 10,        // 3.82 units

  // Glow and opacity
  GLOW_INTENSITY: PHI_INV,              // 61.8% max glow
  GLOW_DECAY: PHI_INV_2,                // 38.2% decay rate
  HIDDEN_OPACITY: PHI_INV_2,            // 38.2% for hidden sefirot (Daat)

  // Camera
  CAMERA_DISTANCE: PHI * 300,           // 485 units
  CAMERA_FOV: Math.round(PHI * 40),     // 65 degrees
};

// =============================================================================
// VIEW MODES
// =============================================================================

export const VIEW_MODES = {
  TREE: 'tree',           // Full Tree of Life
  WORLD: 'world',         // Highlight one world at a time
  AXIOM: 'axiom',         // Highlight by axiom
  FLOW: 'flow',           // Show energy flow (burns up, judgments down)
};

// =============================================================================
// DIMENSION TO SEFIRAH MAPPING (reverse lookup)
// =============================================================================

export const DIMENSION_TO_SEFIRAH = {};
for (const [sefirahName, sefirah] of Object.entries(SEFIROT)) {
  for (const dim of sefirah.dimensions) {
    DIMENSION_TO_SEFIRAH[dim] = sefirahName;
  }
}

// =============================================================================
// EXPORT SUMMARY
// =============================================================================

export default {
  SEFIROT,
  PATHS,
  WORLDS,
  VISUAL,
  VIEW_MODES,
  DIMENSION_TO_SEFIRAH,
  PHI,
  PHI_INV,
  PHI_INV_2,
};
