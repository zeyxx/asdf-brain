/**
 * CYNIC Dimension Configurations
 * 26 dimensions organized by category and world
 */

import { PHI, PHI_SQ, PHI_CUBE, PHI_INV, COLORS } from './constants.js';

// 4 MONDES dimensions (internal view)
export const DIMENSIONS_4MONDES = {
  // PRIMARY (8) - φ² weight
  HARMONY:    { category: 'PRIMARY', weight: PHI_SQ, world: 'ATZILUT', color: COLORS.PRIMARY },
  COHERENCE:  { category: 'PRIMARY', weight: PHI_SQ, world: 'ATZILUT', color: COLORS.PRIMARY },
  TRUTH:      { category: 'PRIMARY', weight: PHI_SQ, world: 'BERIAH', color: COLORS.PRIMARY },
  INTEGRITY:  { category: 'PRIMARY', weight: PHI_SQ, world: 'BERIAH', color: COLORS.PRIMARY },
  ETHICS:     { category: 'PRIMARY', weight: PHI_SQ, world: 'YETZIRAH', color: COLORS.PRIMARY },
  OPTIMISM:   { category: 'PRIMARY', weight: PHI_SQ, world: 'YETZIRAH', color: COLORS.PRIMARY },
  ALIGNMENT:  { category: 'PRIMARY', weight: PHI_SQ, world: 'ASSIAH', color: COLORS.PRIMARY },
  PROGRESS:   { category: 'PRIMARY', weight: PHI_SQ, world: 'ASSIAH', color: COLORS.PRIMARY },

  // SECONDARY (5) - φ weight
  SECURE:     { category: 'SECONDARY', weight: PHI, world: 'BERIAH', color: COLORS.SECONDARY },
  PRIVATE:    { category: 'SECONDARY', weight: PHI, world: 'BERIAH', color: COLORS.SECONDARY },
  SCALE:      { category: 'SECONDARY', weight: PHI, world: 'ASSIAH', color: COLORS.SECONDARY },
  SIMPLIFY:   { category: 'SECONDARY', weight: PHI, world: 'YETZIRAH', color: COLORS.SECONDARY },
  ENABLE:     { category: 'SECONDARY', weight: PHI, world: 'YETZIRAH', color: COLORS.SECONDARY },

  // META (3) - 1.0 weight
  SELF_AWARENESS:       { category: 'META', weight: 1.0, world: 'ATZILUT', color: COLORS.META },
  LEARNING_RATE:        { category: 'META', weight: 1.0, world: 'BERIAH', color: COLORS.META },
  SINGULARITY_DISTANCE: { category: 'META', weight: 1.0, world: 'ATZILUT', color: COLORS.META },

  // HUMAN_LLM (8) - φ weight
  MEMORY:          { category: 'HUMAN_LLM', weight: PHI, world: 'BERIAH', color: COLORS.HUMAN_LLM },
  TEACHING:        { category: 'HUMAN_LLM', weight: PHI, world: 'YETZIRAH', color: COLORS.HUMAN_LLM },
  INTENT:          { category: 'HUMAN_LLM', weight: PHI, world: 'ATZILUT', color: COLORS.HUMAN_LLM },
  TRUST:           { category: 'HUMAN_LLM', weight: PHI, world: 'BERIAH', color: COLORS.HUMAN_LLM },
  PROACTIVITY:     { category: 'HUMAN_LLM', weight: PHI, world: 'ASSIAH', color: COLORS.HUMAN_LLM },
  COMPLEMENTARITY: { category: 'HUMAN_LLM', weight: PHI, world: 'YETZIRAH', color: COLORS.HUMAN_LLM },
  DELEGATION:      { category: 'HUMAN_LLM', weight: PHI, world: 'ASSIAH', color: COLORS.HUMAN_LLM },
  BOUNDARIES:      { category: 'HUMAN_LLM', weight: PHI, world: 'BERIAH', color: COLORS.HUMAN_LLM },

  // DISCOVERY (1) - φ³ weight - THE GATE
  DISCOVERY: { category: 'DISCOVERY', weight: PHI_CUBE, world: 'DAAT', color: COLORS.DISCOVERY },

  // DISCOVERED (N) - φ⁻¹ weight - from THE_INNOMMABLE
  CULTURAL_CONTEXT: { category: 'DISCOVERED', weight: PHI_INV, world: 'YETZIRAH', color: COLORS.DISCOVERED, axiomOrigin: 'CULTURE' }
};

// 5×5 MATRIX dimensions (universal interface)
export const DIMENSIONS_5x5 = {
  // ROW 1: FOUNDATION
  SOURCE_ORIGIN:     { category: 'FOUNDATION', weight: PHI_SQ, world: 'BERIAH', color: 0xff6b6b, maps_to: 'TRUTH' },
  EVIDENCE_BASE:     { category: 'FOUNDATION', weight: PHI_SQ, world: 'BERIAH', color: 0xff6b6b, maps_to: 'INTEGRITY' },
  LOGICAL_COHERENCE: { category: 'FOUNDATION', weight: PHI_SQ, world: 'ATZILUT', color: 0xff6b6b, maps_to: 'COHERENCE' },
  TEMPORAL_VALIDITY: { category: 'FOUNDATION', weight: PHI, world: 'ASSIAH', color: 0xff6b6b, maps_to: 'PROGRESS' },
  DOMAIN_FIT:        { category: 'FOUNDATION', weight: PHI, world: 'ASSIAH', color: 0xff6b6b, maps_to: 'ALIGNMENT' },

  // ROW 2: STRUCTURE
  SIMPLICITY:    { category: 'STRUCTURE', weight: PHI, world: 'YETZIRAH', color: 0x4ecdc4, maps_to: 'SIMPLIFY' },
  MODULARITY:    { category: 'STRUCTURE', weight: PHI, world: 'ASSIAH', color: 0x4ecdc4, maps_to: 'SCALE' },
  EXTENSIBILITY: { category: 'STRUCTURE', weight: PHI, world: 'YETZIRAH', color: 0x4ecdc4, maps_to: 'ENABLE' },
  ROBUSTNESS:    { category: 'STRUCTURE', weight: PHI, world: 'BERIAH', color: 0x4ecdc4, maps_to: 'SECURE' },
  ELEGANCE:      { category: 'STRUCTURE', weight: PHI_SQ, world: 'ATZILUT', color: 0x4ecdc4, maps_to: 'HARMONY' },

  // ROW 3: DYNAMICS
  ADAPTABILITY:      { category: 'DYNAMICS', weight: PHI, world: 'ASSIAH', color: 0x45b7d1, maps_to: 'PROGRESS' },
  SCALABILITY:       { category: 'DYNAMICS', weight: PHI, world: 'ASSIAH', color: 0x45b7d1, maps_to: 'SCALE' },
  FEEDBACK_LOOPS:    { category: 'DYNAMICS', weight: 1.0, world: 'META', color: 0x45b7d1, maps_to: 'LEARNING_RATE' },
  ENERGY_EFFICIENCY: { category: 'DYNAMICS', weight: PHI, world: 'YETZIRAH', color: 0x45b7d1, maps_to: 'SIMPLIFY' },
  MOMENTUM:          { category: 'DYNAMICS', weight: PHI, world: 'YETZIRAH', color: 0x45b7d1, maps_to: 'OPTIMISM' },

  // ROW 4: RELATIONSHIPS
  DEPENDENCY_HEALTH: { category: 'RELATIONSHIPS', weight: PHI, world: 'BERIAH', color: 0x96ceb4, maps_to: 'SECURE' },
  INTERFACE_CLARITY: { category: 'RELATIONSHIPS', weight: PHI, world: 'YETZIRAH', color: 0x96ceb4, maps_to: 'SIMPLIFY' },
  NETWORK_EFFECTS:   { category: 'RELATIONSHIPS', weight: PHI, world: 'ASSIAH', color: 0x96ceb4, maps_to: 'SCALE' },
  COMPOSABILITY:     { category: 'RELATIONSHIPS', weight: PHI, world: 'YETZIRAH', color: 0x96ceb4, maps_to: 'ENABLE' },
  TRUST_GRADIENT:    { category: 'RELATIONSHIPS', weight: PHI, world: 'BERIAH', color: 0x96ceb4, maps_to: 'TRUST' },

  // ROW 5: META
  SELF_AWARENESS_5x5: { category: 'META_5x5', weight: 1.0, world: 'ATZILUT', color: 0xdda0dd, maps_to: 'SELF_AWARENESS' },
  REVERSIBILITY:      { category: 'META_5x5', weight: PHI, world: 'BERIAH', color: 0xdda0dd, maps_to: 'SECURE' },
  MEASURABILITY:      { category: 'META_5x5', weight: PHI, world: 'BERIAH', color: 0xdda0dd, maps_to: 'INTEGRITY' },
  LEARNABILITY:       { category: 'META_5x5', weight: 1.0, world: 'META', color: 0xdda0dd, maps_to: 'LEARNING_RATE' },
  ALIGNMENT_5x5:      { category: 'META_5x5', weight: PHI, world: 'ASSIAH', color: 0xdda0dd, maps_to: 'ALIGNMENT' }
};

// Default scores
export const DEFAULT_SCORES = {
  HARMONY: 75, COHERENCE: 80, TRUTH: 85, INTEGRITY: 70,
  ETHICS: 100, OPTIMISM: 65, ALIGNMENT: 72, PROGRESS: 68,
  SECURE: 78, PRIVATE: 82, SCALE: 60, SIMPLIFY: 75, ENABLE: 88,
  SELF_AWARENESS: 55, LEARNING_RATE: 62, SINGULARITY_DISTANCE: 88,
  MEMORY: 70, TEACHING: 65, INTENT: 80, TRUST: 75,
  PROACTIVITY: 58, COMPLEMENTARITY: 72, DELEGATION: 68, BOUNDARIES: 85,
  DISCOVERY: 50,
  CULTURAL_CONTEXT: 45
};
