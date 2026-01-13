/**
 * Tests for lib/cynic/scaling.js
 *
 * Pure functions for inference-time scaling
 * PHASE 2.2 - Extracted from self-judge.js
 */

import { describe, it, expect } from 'vitest';

const scaling = require('../../../lib/cynic/scaling');
const { PHI, PHI_INV, PHI_INV_2 } = require('../../../lib/cynic/axioms/constants');

describe('Scaling Module', () => {
  describe('Constants', () => {
    describe('FIBONACCI_N', () => {
      it('should have QUICK = 3', () => {
        expect(scaling.FIBONACCI_N.QUICK).toBe(3);
      });

      it('should have STANDARD = 5', () => {
        expect(scaling.FIBONACCI_N.STANDARD).toBe(5);
      });

      it('should have THOROUGH = 8', () => {
        expect(scaling.FIBONACCI_N.THOROUGH).toBe(8);
      });

      it('should be Fibonacci numbers', () => {
        const fib = [1, 1, 2, 3, 5, 8, 13, 21];
        expect(fib).toContain(scaling.FIBONACCI_N.QUICK);
        expect(fib).toContain(scaling.FIBONACCI_N.STANDARD);
        expect(fib).toContain(scaling.FIBONACCI_N.THOROUGH);
      });
    });

    describe('DIVERSITY', () => {
      it('should have LOW = φ⁻²', () => {
        expect(scaling.DIVERSITY.LOW).toBeCloseTo(PHI_INV_2, 5);
      });

      it('should have MEDIUM = φ⁻¹', () => {
        expect(scaling.DIVERSITY.MEDIUM).toBeCloseTo(PHI_INV, 5);
      });

      it('should have HIGH > MEDIUM', () => {
        expect(scaling.DIVERSITY.HIGH).toBeGreaterThan(scaling.DIVERSITY.MEDIUM);
        // HIGH = φ⁻¹ × φ⁻¹ + φ⁻² ≈ 0.764
        expect(scaling.DIVERSITY.HIGH).toBeCloseTo(0.764, 2);
      });
    });
  });

  describe('applyDiversity()', () => {
    it('should return a new context object', () => {
      const context = { test: 'value' };
      const result = scaling.applyDiversity(context, 0.5, 0, 3);
      expect(result).not.toBe(context);
      expect(result.test).toBe('value');
    });

    it('should add _exploration metadata', () => {
      const result = scaling.applyDiversity({}, 0.5, 1, 3);
      expect(result._exploration).toBeDefined();
      expect(result._exploration.sampleIndex).toBe(1);
      expect(result._exploration.totalSamples).toBe(3);
      expect(result._exploration.diversity).toBe(0.5);
    });

    it('should perturb singularityDistance if present', () => {
      const context = { singularityDistance: 0.5 };
      const result = scaling.applyDiversity(context, 0.5, 2, 5);
      expect(result.singularityDistance).toBeGreaterThanOrEqual(0.1);
      expect(result.singularityDistance).toBeLessThanOrEqual(0.9);
    });

    it('should include scorePerturbation', () => {
      const result = scaling.applyDiversity({}, 0.5, 0, 3);
      expect(typeof result._exploration.scorePerturbation).toBe('number');
    });
  });

  describe('perturbScore()', () => {
    it('should return unchanged score if no _exploration', () => {
      const result = scaling.perturbScore(50, {});
      expect(result).toBe(50);
    });

    it('should return unchanged score if scorePerturbation is 0', () => {
      const context = { _exploration: { scorePerturbation: 0 } };
      const result = scaling.perturbScore(50, context);
      expect(result).toBe(50);
    });

    it('should apply perturbation', () => {
      const context = { _exploration: { scorePerturbation: 5 } };
      const result = scaling.perturbScore(50, context);
      expect(result).toBe(55);
    });

    it('should clamp to 0-100 range', () => {
      expect(scaling.perturbScore(5, { _exploration: { scorePerturbation: -10 } })).toBe(0);
      expect(scaling.perturbScore(95, { _exploration: { scorePerturbation: 10 } })).toBe(100);
    });
  });

  describe('geometricMean()', () => {
    it('should return 0 for empty array', () => {
      expect(scaling.geometricMean([])).toBe(0);
    });

    it('should return the value for single element', () => {
      expect(scaling.geometricMean([25])).toBeCloseTo(25, 1);
    });

    it('should calculate geometric mean correctly', () => {
      // geometric mean of 4 and 9 is 6
      expect(scaling.geometricMean([4, 9])).toBeCloseTo(6, 1);
    });

    it('should handle zeros with fallback to arithmetic mean', () => {
      const result = scaling.geometricMean([0, 10, 20]);
      expect(result).toBe(10); // arithmetic mean fallback
    });
  });

  describe('mode()', () => {
    it('should return most frequent value', () => {
      expect(scaling.mode([1, 2, 2, 3])).toBe(2);
    });

    it('should handle single value', () => {
      expect(scaling.mode([5])).toBe(5);
    });

    it('should return first most frequent on tie', () => {
      const result = scaling.mode([1, 1, 2, 2, 3]);
      expect([1, 2]).toContain(result);
    });
  });

  describe('calculateConsensus()', () => {
    it('should return perfect agreement for single sample', () => {
      const samples = [{ global: 50, verdict: { action: 'TRANSFORM' } }];
      const result = scaling.calculateConsensus(samples);
      expect(result.agreement).toBe(1);
      expect(result.verdictAgreement).toBe(1);
    });

    it('should calculate agreement correctly', () => {
      const samples = [
        { global: 50, verdict: { action: 'TRANSFORM' } },
        { global: 52, verdict: { action: 'TRANSFORM' } },
        { global: 48, verdict: { action: 'TRANSFORM' } },
      ];
      const result = scaling.calculateConsensus(samples);
      expect(result.agreement).toBeGreaterThan(0.9);
      expect(result.verdictAgreement).toBe(1);
    });

    it('should detect verdict disagreement', () => {
      const samples = [
        { global: 70, verdict: { action: 'ACCEPT' } },
        { global: 50, verdict: { action: 'TRANSFORM' } },
        { global: 30, verdict: { action: 'REJECT' } },
      ];
      const result = scaling.calculateConsensus(samples);
      expect(result.verdictAgreement).toBeCloseTo(0.333, 2);
    });

    it('should calculate variance and stdDev', () => {
      const samples = [
        { global: 40, verdict: { action: 'TRANSFORM' } },
        { global: 60, verdict: { action: 'TRANSFORM' } },
      ];
      const result = scaling.calculateConsensus(samples);
      expect(result.variance).toBe(100);
      expect(result.stdDev).toBe(10);
      expect(result.spread).toBe(20);
      expect(result.mean).toBe(50);
    });
  });

  describe('calculateImprovement()', () => {
    it('should calculate improvement correctly', () => {
      const samples = [{ global: 40 }, { global: 50 }];
      const aggregated = { global: 50 };
      const result = scaling.calculateImprovement(samples, aggregated);

      expect(result.singlePass).toBe(40);
      expect(result.scaled).toBe(50);
      expect(result.delta).toBe(10);
      expect(result.percent).toBe(25);
    });

    it('should handle negative improvement', () => {
      const samples = [{ global: 60 }];
      const aggregated = { global: 50 };
      const result = scaling.calculateImprovement(samples, aggregated);

      expect(result.delta).toBe(-10);
      expect(result.percent).toBeCloseTo(-16.7, 1);
    });
  });

  describe('aggregateReasons()', () => {
    it('should aggregate most frequent reasons', () => {
      const samples = [
        { reasons: { TRUTH: 'No source', HARMONY: 'Good balance' } },
        { reasons: { TRUTH: 'No source', HARMONY: 'Good balance' } },
        { reasons: { TRUTH: 'Has source', HARMONY: 'Good balance' } },
      ];
      const result = scaling.aggregateReasons(samples);
      expect(result.TRUTH).toBe('No source');
      expect(result.HARMONY).toBe('Good balance');
    });

    it('should handle empty samples', () => {
      const result = scaling.aggregateReasons([]);
      expect(result).toEqual({});
    });
  });

  describe('isStable()', () => {
    it('should return true for high agreement', () => {
      const consensus = { agreement: 0.7 }; // > φ⁻¹ (0.618)
      expect(scaling.isStable(consensus)).toBe(true);
    });

    it('should return false for low agreement', () => {
      const consensus = { agreement: 0.5 }; // < φ⁻¹ (0.618)
      expect(scaling.isStable(consensus)).toBe(false);
    });

    it('should use φ⁻¹ as threshold', () => {
      expect(scaling.isStable({ agreement: PHI_INV })).toBe(true);
      expect(scaling.isStable({ agreement: PHI_INV - 0.001 })).toBe(false);
    });
  });

  describe('aggregateScoresGeometric()', () => {
    it('should aggregate using geometric mean', () => {
      const samples = [
        { scores: { TRUTH: 40, HARMONY: 60 } },
        { scores: { TRUTH: 90, HARMONY: 60 } },
      ];
      const result = scaling.aggregateScoresGeometric(samples);
      expect(result.TRUTH).toBe(60); // geometric mean of 40 and 90
      expect(result.HARMONY).toBe(60);
    });
  });
});
