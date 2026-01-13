/**
 * Tests for lib/cynic/axioms/
 *
 * CYNIC Axioms - The 4 fundamental truths
 */

import { describe, it, expect } from 'vitest';

const {
  // φ constants
  PHI,
  PHI_2,
  PHI_3,
  PHI_SQ,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  MAX_CONFIDENCE,
  MIN_DOUBT,

  // Configuration
  WEIGHTS,
  AXIOMS,
  LAWS,
  ASIMOV_LAWS,
  THRESHOLDS,
  CONFIDENCE,
  DIMENSION_TO_AXIOM,
  DIMENSION_TO_WORLD,

  // Functions
  getAxiomForDimension,
  getWorldForDimension,
  getDimensionsForAxiom,
  getAxiomWeight,
  checkLaws,
  applyPhiCeiling,
  ensureMinimumDoubt,
} = require('../../../lib/cynic/axioms');

describe('CYNIC Axioms', () => {
  describe('φ (PHI) Constants', () => {
    it('should have PHI = 1.618...', () => {
      expect(PHI).toBeCloseTo(1.618033988749895, 10);
    });

    it('should have PHI_INV = 0.618... (φ⁻¹)', () => {
      expect(PHI_INV).toBeCloseTo(0.6180339887498948, 10);
      expect(PHI_INV).toBeCloseTo(1 / PHI, 10);
    });

    it('should have PHI_INV_2 = 0.382... (φ⁻²)', () => {
      expect(PHI_INV_2).toBeCloseTo(0.38196601125010515, 10);
      expect(PHI_INV_2).toBeCloseTo(1 / (PHI * PHI), 10);
    });

    it('should have PHI_INV_3 = 0.236... (φ⁻³)', () => {
      expect(PHI_INV_3).toBeCloseTo(0.2360679774997896, 10);
    });

    it('should have PHI_2 and PHI_3 as powers', () => {
      expect(PHI_2).toBeCloseTo(PHI * PHI, 10);
      expect(PHI_3).toBeCloseTo(PHI * PHI * PHI, 10);
    });

    it('should have PHI_SQ = φ²', () => {
      expect(PHI_SQ).toBeCloseTo(2.618033988749895, 10);
    });

    it('should satisfy φ identity: φ² = φ + 1', () => {
      expect(PHI * PHI).toBeCloseTo(PHI + 1, 10);
    });

    it('should satisfy φ identity: 1/φ = φ - 1', () => {
      expect(1 / PHI).toBeCloseTo(PHI - 1, 10);
    });
  });

  describe('Confidence Bounds', () => {
    it('should have MAX_CONFIDENCE = φ⁻¹ (61.8%)', () => {
      expect(MAX_CONFIDENCE).toBeCloseTo(0.618, 2);
      expect(MAX_CONFIDENCE).toBe(PHI_INV);
    });

    it('should have MIN_DOUBT = φ⁻² (38.2%)', () => {
      expect(MIN_DOUBT).toBeCloseTo(0.382, 2);
      expect(MIN_DOUBT).toBe(PHI_INV_2);
    });

    it('should ensure MAX_CONFIDENCE + MIN_DOUBT ≈ 1', () => {
      expect(MAX_CONFIDENCE + MIN_DOUBT).toBeCloseTo(1, 10);
    });
  });

  describe('WEIGHTS', () => {
    it('should have 5 dimension weights', () => {
      expect(Object.keys(WEIGHTS)).toHaveLength(5);
    });

    it('should have weight categories', () => {
      expect(WEIGHTS).toHaveProperty('PRIMARY');
      expect(WEIGHTS).toHaveProperty('SECONDARY');
      expect(WEIGHTS).toHaveProperty('META');
      expect(WEIGHTS).toHaveProperty('HUMAN_LLM');
      expect(WEIGHTS).toHaveProperty('DISCOVERY');
    });

    it('should have φ-based PRIMARY weight (φ² = 2.618...)', () => {
      expect(WEIGHTS.PRIMARY).toBeCloseTo(2.618, 2);
    });

    it('should have φ-based SECONDARY weight (φ = 1.618...)', () => {
      expect(WEIGHTS.SECONDARY).toBeCloseTo(1.618, 2);
    });

    it('should have PRIMARY as highest weight', () => {
      const weights = Object.values(WEIGHTS);
      expect(WEIGHTS.PRIMARY).toBe(Math.max(...weights));
    });
  });

  describe('AXIOMS', () => {
    it('should have 4 axioms', () => {
      expect(Object.keys(AXIOMS)).toHaveLength(4);
    });

    it('should have PHI axiom', () => {
      expect(AXIOMS).toHaveProperty('PHI');
      expect(AXIOMS.PHI).toHaveProperty('name');
      expect(AXIOMS.PHI).toHaveProperty('description');
      expect(AXIOMS.PHI).toHaveProperty('dimensions');
    });

    it('should have VERIFY axiom', () => {
      expect(AXIOMS).toHaveProperty('VERIFY');
      expect(AXIOMS.VERIFY.description).toContain('verify');
    });

    it('should have CULTURE axiom', () => {
      expect(AXIOMS).toHaveProperty('CULTURE');
    });

    it('should have BURN axiom', () => {
      expect(AXIOMS).toHaveProperty('BURN');
      expect(AXIOMS.BURN.description).toBeDefined();
    });
  });

  describe('LAWS', () => {
    it('should have law definitions', () => {
      expect(LAWS).toBeDefined();
      expect(typeof LAWS).toBe('object');
    });
  });

  describe('ASIMOV_LAWS', () => {
    it('should have Asimov law references', () => {
      expect(ASIMOV_LAWS).toBeDefined();
      expect(typeof ASIMOV_LAWS).toBe('object');
    });
  });

  describe('THRESHOLDS', () => {
    it('should have threshold definitions', () => {
      expect(THRESHOLDS).toBeDefined();
      expect(typeof THRESHOLDS).toBe('object');
    });

    it('should have CRITICAL_LOW threshold (24)', () => {
      expect(THRESHOLDS).toHaveProperty('CRITICAL_LOW');
      expect(THRESHOLDS.CRITICAL_LOW).toBe(24);
    });

    it('should have MINIMUM threshold (38 ≈ φ⁻²)', () => {
      expect(THRESHOLDS).toHaveProperty('MINIMUM');
      expect(THRESHOLDS.MINIMUM).toBe(38);
    });

    it('should have NEUTRAL threshold (50)', () => {
      expect(THRESHOLDS).toHaveProperty('NEUTRAL');
      expect(THRESHOLDS.NEUTRAL).toBe(50);
    });

    it('should have GOOD threshold (62 ≈ φ⁻¹)', () => {
      expect(THRESHOLDS).toHaveProperty('GOOD');
      expect(THRESHOLDS.GOOD).toBe(62);
    });

    it('should have EXCELLENT threshold (76)', () => {
      expect(THRESHOLDS).toHaveProperty('EXCELLENT');
      expect(THRESHOLDS.EXCELLENT).toBe(76);
    });

    it('should have EXCEPTIONAL threshold (85)', () => {
      expect(THRESHOLDS).toHaveProperty('EXCEPTIONAL');
      expect(THRESHOLDS.EXCEPTIONAL).toBe(85);
    });
  });

  describe('CONFIDENCE', () => {
    it('should have confidence configuration', () => {
      expect(CONFIDENCE).toBeDefined();
      expect(CONFIDENCE).toHaveProperty('MAX');
      expect(CONFIDENCE).toHaveProperty('MIN_DOUBT');
      expect(CONFIDENCE).toHaveProperty('CEILING');
    });

    it('should have MAX = φ⁻¹ (61.8%)', () => {
      expect(CONFIDENCE.MAX).toBeCloseTo(0.618, 2);
    });

    it('should have MIN_DOUBT = φ⁻² (38.2%)', () => {
      expect(CONFIDENCE.MIN_DOUBT).toBeCloseTo(0.382, 2);
    });

    it('should have CEILING as percentage (61.8)', () => {
      expect(CONFIDENCE.CEILING).toBeCloseTo(61.8, 1);
    });
  });

  describe('DIMENSION_TO_AXIOM', () => {
    it('should map dimensions to axioms', () => {
      expect(DIMENSION_TO_AXIOM).toBeDefined();
      expect(typeof DIMENSION_TO_AXIOM).toBe('object');
    });

    it('should map HARMONY to PHI', () => {
      expect(DIMENSION_TO_AXIOM.HARMONY).toBe('PHI');
    });

    it('should map TRUTH to VERIFY', () => {
      expect(DIMENSION_TO_AXIOM.TRUTH).toBe('VERIFY');
    });

    it('should map ETHICS to CULTURE', () => {
      expect(DIMENSION_TO_AXIOM.ETHICS).toBe('CULTURE');
    });

    it('should map PROGRESS to BURN', () => {
      expect(DIMENSION_TO_AXIOM.PROGRESS).toBe('BURN');
    });
  });

  describe('DIMENSION_TO_WORLD', () => {
    it('should map dimensions to worlds', () => {
      expect(DIMENSION_TO_WORLD).toBeDefined();
      expect(typeof DIMENSION_TO_WORLD).toBe('object');
    });

    it('should map HARMONY to ATZILUT', () => {
      expect(DIMENSION_TO_WORLD.HARMONY).toBe('ATZILUT');
    });
  });

  describe('getAxiomForDimension()', () => {
    it('should return axiom for HARMONY', () => {
      const axiom = getAxiomForDimension('HARMONY');
      expect(axiom).toBe('PHI');
    });

    it('should return axiom for TRUTH', () => {
      const axiom = getAxiomForDimension('TRUTH');
      expect(axiom).toBe('VERIFY');
    });

    it('should return null for unknown dimension', () => {
      const axiom = getAxiomForDimension('UNKNOWN');
      expect(axiom).toBeNull();
    });
  });

  describe('getWorldForDimension()', () => {
    it('should return world for HARMONY', () => {
      const world = getWorldForDimension('HARMONY');
      expect(world).toBe('ATZILUT');
    });

    it('should return world for TRUTH', () => {
      const world = getWorldForDimension('TRUTH');
      expect(world).toBe('BERIAH');
    });

    it('should return null for unknown dimension', () => {
      const world = getWorldForDimension('UNKNOWN');
      expect(world).toBeNull();
    });
  });

  describe('getDimensionsForAxiom()', () => {
    it('should return dimensions for PHI', () => {
      const dims = getDimensionsForAxiom('PHI');
      expect(Array.isArray(dims)).toBe(true);
      expect(dims).toContain('HARMONY');
    });

    it('should return dimensions for VERIFY', () => {
      const dims = getDimensionsForAxiom('VERIFY');
      expect(dims).toContain('TRUTH');
    });

    it('should return empty array for unknown axiom', () => {
      const dims = getDimensionsForAxiom('UNKNOWN');
      expect(dims).toHaveLength(0);
    });
  });

  describe('getAxiomWeight()', () => {
    it('should return weight for PHI', () => {
      const weight = getAxiomWeight('PHI');
      expect(weight).toBeGreaterThan(0);
    });

    it('should return 1 for unknown axiom', () => {
      const weight = getAxiomWeight('UNKNOWN');
      expect(weight).toBe(1);
    });
  });

  describe('checkLaws()', () => {
    it('should check laws for action', () => {
      const action = { type: 'test' };
      const result = checkLaws(action);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('allowed');
    });

    it('should pass for harmless action', () => {
      const action = { type: 'info', content: 'Hello' };
      const result = checkLaws(action);
      expect(result.allowed).toBe(true);
    });
  });

  describe('applyPhiCeiling()', () => {
    it('should cap confidence at φ⁻¹', () => {
      const capped = applyPhiCeiling(0.9);
      expect(capped).toBeCloseTo(PHI_INV, 10);
    });

    it('should not change values below ceiling', () => {
      const unchanged = applyPhiCeiling(0.5);
      expect(unchanged).toBe(0.5);
    });

    it('should handle edge case at ceiling', () => {
      const atCeiling = applyPhiCeiling(PHI_INV);
      expect(atCeiling).toBeCloseTo(PHI_INV, 10);
    });

    it('should handle 0', () => {
      expect(applyPhiCeiling(0)).toBe(0);
    });

    it('should handle 1', () => {
      expect(applyPhiCeiling(1)).toBeCloseTo(PHI_INV, 10);
    });
  });

  describe('ensureMinimumDoubt()', () => {
    it('should return object with confidence and doubt', () => {
      const result = ensureMinimumDoubt(0.5);
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('doubt');
    });

    it('should ensure minimum doubt of φ⁻²', () => {
      const result = ensureMinimumDoubt(0.9); // confidence 0.9, doubt 0.1
      expect(result.doubt).toBeGreaterThanOrEqual(PHI_INV_2);
    });

    it('should maintain confidence + doubt = 1', () => {
      const result = ensureMinimumDoubt(0.5);
      expect(result.confidence + result.doubt).toBeCloseTo(1, 10);
    });
  });
});
