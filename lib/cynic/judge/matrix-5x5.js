/**
 * MATRIX 5×5 - Public interface definition
 *
 * The 25 dimensions organized in 5 rows of 5
 * Each dimension maps to a 4 Mondes internal dimension
 *
 * @module cynic/judge/matrix-5x5
 */

'use strict';

// =============================================================================
// 5×5 MATRIX DEFINITION (Interface publique)
// =============================================================================

const MATRIX_5x5 = {
  FOUNDATION: {
    description: 'What is it made of?',
    dimensions: {
      SOURCE_ORIGIN: {
        question: 'Where did this come from? Primary vs derivative?',
        maps_to: 'TRUTH',
        axiom: 'VERIFY'
      },
      EVIDENCE_BASE: {
        question: 'What evidence supports it? Hard data vs opinion?',
        maps_to: 'INTEGRITY',
        axiom: 'VERIFY'
      },
      LOGICAL_COHERENCE: {
        question: 'Does it follow logically? Contradictions?',
        maps_to: 'COHERENCE',
        axiom: 'PHI'
      },
      TEMPORAL_VALIDITY: {
        question: 'Still relevant? Outdated assumptions?',
        maps_to: 'PROGRESS',
        axiom: 'BURN'
      },
      DOMAIN_FIT: {
        question: 'Right tool for the job? Context appropriate?',
        maps_to: 'ALIGNMENT',
        axiom: 'BURN'
      }
    }
  },

  STRUCTURE: {
    description: 'How is it built?',
    dimensions: {
      SIMPLICITY: {
        question: "Occam's razor. Unnecessary complexity?",
        maps_to: 'SIMPLIFY',
        axiom: 'CULTURE'
      },
      MODULARITY: {
        question: 'Can parts be reused? Coupled vs decoupled?',
        maps_to: 'SCALE',
        axiom: 'BURN'
      },
      EXTENSIBILITY: {
        question: 'Room to grow? Dead ends?',
        maps_to: 'ENABLE',
        axiom: 'CULTURE'
      },
      ROBUSTNESS: {
        question: 'Handles edge cases? Fails gracefully?',
        maps_to: 'SECURE',
        axiom: 'VERIFY'
      },
      ELEGANCE: {
        question: 'Beautiful solution? Or kludge?',
        maps_to: 'HARMONY',
        axiom: 'PHI'
      }
    }
  },

  DYNAMICS: {
    description: 'How does it move?',
    dimensions: {
      ADAPTABILITY: {
        question: 'Changes with context? Rigid?',
        maps_to: 'PROGRESS',
        axiom: 'BURN'
      },
      SCALABILITY: {
        question: 'Works at 10x? 100x?',
        maps_to: 'SCALE',
        axiom: 'BURN'
      },
      FEEDBACK_LOOPS: {
        question: 'Self-correcting? Or runaway?',
        maps_to: 'LEARNING_RATE',
        axiom: 'META'
      },
      ENERGY_EFFICIENCY: {
        question: 'Effort vs output ratio?',
        maps_to: 'SIMPLIFY',
        axiom: 'CULTURE'
      },
      MOMENTUM: {
        question: 'Sustainable velocity? Burnout risk?',
        maps_to: 'OPTIMISM',
        axiom: 'CULTURE'
      }
    }
  },

  RELATIONSHIPS: {
    description: 'How does it connect?',
    dimensions: {
      DEPENDENCY_HEALTH: {
        question: 'What does it rely on? Single points of failure?',
        maps_to: 'SECURE',
        axiom: 'VERIFY'
      },
      INTERFACE_CLARITY: {
        question: 'Clear boundaries? API well-defined?',
        maps_to: 'SIMPLIFY',
        axiom: 'CULTURE'
      },
      NETWORK_EFFECTS: {
        question: 'Gets better with more users/use?',
        maps_to: 'SCALE',
        axiom: 'BURN'
      },
      COMPOSABILITY: {
        question: 'Plays well with others?',
        maps_to: 'ENABLE',
        axiom: 'CULTURE'
      },
      TRUST_GRADIENT: {
        question: 'Appropriate trust levels? Verify before trust?',
        maps_to: 'TRUST',
        axiom: 'VERIFY'
      }
    }
  },

  META: {
    description: 'What about itself?',
    dimensions: {
      SELF_AWARENESS: {
        question: 'Knows its own limits? Blind spots?',
        maps_to: 'SELF_AWARENESS',
        axiom: 'META'
      },
      REVERSIBILITY: {
        question: 'Can undo? Exit strategy?',
        maps_to: 'SECURE',
        axiom: 'VERIFY'
      },
      MEASURABILITY: {
        question: 'Can we know if it is working?',
        maps_to: 'INTEGRITY',
        axiom: 'VERIFY'
      },
      LEARNABILITY: {
        question: 'Gets smarter over time?',
        maps_to: 'LEARNING_RATE',
        axiom: 'META'
      },
      ALIGNMENT: {
        question: 'Serves intended purpose? Drift risk?',
        maps_to: 'ALIGNMENT',
        axiom: 'BURN'
      }
    }
  }
};

// =============================================================================
// JUDGMENT MODES
// =============================================================================

const MODES = {
  quick: {
    dimensions: ['SOURCE_ORIGIN', 'SIMPLICITY', 'ADAPTABILITY', 'DEPENDENCY_HEALTH', 'ALIGNMENT'],
    description: 'One dimension per row'
  },
  standard: {
    dimensions: [
      'SOURCE_ORIGIN', 'EVIDENCE_BASE',
      'SIMPLICITY', 'ROBUSTNESS',
      'ADAPTABILITY', 'SCALABILITY',
      'DEPENDENCY_HEALTH', 'INTERFACE_CLARITY',
      'SELF_AWARENESS', 'MEASURABILITY'
    ],
    description: 'Two dimensions per row'
  },
  thorough: {
    dimensions: [
      'SOURCE_ORIGIN', 'EVIDENCE_BASE', 'LOGICAL_COHERENCE',
      'SIMPLICITY', 'ROBUSTNESS', 'ELEGANCE',
      'ADAPTABILITY', 'SCALABILITY', 'FEEDBACK_LOOPS',
      'DEPENDENCY_HEALTH', 'INTERFACE_CLARITY', 'COMPOSABILITY',
      'SELF_AWARENESS', 'MEASURABILITY', 'LEARNABILITY'
    ],
    description: 'Three dimensions per row'
  },
  full: {
    dimensions: Object.values(MATRIX_5x5).flatMap(row => Object.keys(row.dimensions)),
    description: 'All 25 dimensions'
  }
};

// =============================================================================
// VERDICTS (Dog personality)
// =============================================================================

const VERDICTS = {
  HOWL: { threshold: 0.55, emoji: '🐕', description: 'Exceptional quality, rare achievement' },
  WAG: { threshold: 0.45, emoji: '🐕', description: 'Generally good, minor improvements possible' },
  GROWL: { threshold: 0.35, emoji: '🐕', description: 'Minor issues, address before proceeding' },
  BARK: { threshold: 0, emoji: '🐕', description: 'Serious concerns, proceed with caution' }
};

function getVerdict(score) {
  if (score >= VERDICTS.HOWL.threshold) return 'HOWL';
  if (score >= VERDICTS.WAG.threshold) return 'WAG';
  if (score >= VERDICTS.GROWL.threshold) return 'GROWL';
  return 'BARK';
}

// =============================================================================
// MAPPING ENGINE
// =============================================================================

/**
 * Build reverse mapping: 4 Mondes dimension → [5×5 dimensions]
 */
function buildReverseMapping() {
  const reverse = {};

  for (const [rowName, row] of Object.entries(MATRIX_5x5)) {
    for (const [dimName, config] of Object.entries(row.dimensions)) {
      const target = config.maps_to;
      if (!reverse[target]) {
        reverse[target] = [];
      }
      reverse[target].push({
        name: dimName,
        row: rowName,
        axiom: config.axiom,
        question: config.question
      });
    }
  }

  return reverse;
}

const REVERSE_MAPPING = buildReverseMapping();

/**
 * Convert 5×5 input scores to 4 Mondes format
 */
function mapTo4Worlds(fiveByFiveScores) {
  const fourWorldsScores = {};
  const mappingUsed = {};

  for (const [targetDim, sources] of Object.entries(REVERSE_MAPPING)) {
    const sourceScores = sources
      .map(s => fiveByFiveScores[s.name])
      .filter(score => score !== undefined && score !== null);

    if (sourceScores.length > 0) {
      if (sourceScores.length === 1) {
        fourWorldsScores[targetDim] = sourceScores[0];
      } else {
        const product = sourceScores.reduce((acc, s) => acc * s, 1);
        fourWorldsScores[targetDim] = Math.pow(product, 1 / sourceScores.length);
      }
      mappingUsed[targetDim] = sources.map(s => s.name);
    }
  }

  return { scores: fourWorldsScores, mapping: mappingUsed };
}

/**
 * Convert 4 Mondes judgment back to 5×5 format
 */
function mapFrom4Worlds(judgment) {
  const fiveByFiveScores = {};
  const dimensionScores = judgment.scores || {};

  for (const [rowName, row] of Object.entries(MATRIX_5x5)) {
    for (const [dimName, config] of Object.entries(row.dimensions)) {
      const sourceScore = dimensionScores[config.maps_to];
      if (sourceScore !== undefined) {
        fiveByFiveScores[dimName] = {
          score: sourceScore,
          mapped_from: config.maps_to,
          row: rowName,
          question: config.question
        };
      }
    }
  }

  return fiveByFiveScores;
}

/**
 * Get mapping documentation
 */
function getMappingDoc() {
  const doc = [];

  for (const [rowName, row] of Object.entries(MATRIX_5x5)) {
    doc.push(`\n## ${rowName}: ${row.description}\n`);
    for (const [dimName, config] of Object.entries(row.dimensions)) {
      doc.push(`- **${dimName}** → ${config.maps_to} [${config.axiom}]`);
      doc.push(`  "${config.question}"`);
    }
  }

  return doc.join('\n');
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  MATRIX_5x5,
  MODES,
  VERDICTS,
  REVERSE_MAPPING,
  getVerdict,
  mapTo4Worlds,
  mapFrom4Worlds,
  getMappingDoc,
  buildReverseMapping
};
