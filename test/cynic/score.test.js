/**
 * Tests for lib/cynic/score.js
 *
 * CYNIC-SCORE - Score Calculation & Output Formatting
 * "Les chiffres ne mentent pas, mais leur présentation peut éclairer"
 */

import { describe, it, expect } from 'vitest';

const {
  score,
  calculateGlobalScore,
  detectTensions,
  determineVerdict,
  findBlockingDimensions,
  calculateTechnicalDepth,
  formatOutput,
  scoreToGrade,
  DIMENSIONS,
  TOTAL_WEIGHT,
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
} = require('../../lib/cynic/score');

describe('CYNIC-SCORE', () => {
  describe('Constants', () => {
    it('should have 24 dimensions', () => {
      expect(Object.keys(DIMENSIONS)).toHaveLength(24);
    });

    it('should have total weight of 42 (Lucas number)', () => {
      expect(TOTAL_WEIGHT).toBeCloseTo(42, 0);
    });

    it('should have φ constants', () => {
      expect(PHI).toBeCloseTo(1.618, 2);
      expect(PHI_INV).toBeCloseTo(0.618, 2);
      expect(PHI_INV_2).toBeCloseTo(0.382, 2);
      expect(PHI_INV_3).toBeCloseTo(0.236, 2);
    });
  });

  describe('DIMENSIONS structure', () => {
    it('should have 6 PHI/ATZILUT dimensions', () => {
      const phiDims = Object.values(DIMENSIONS).filter(d => d.axiom === 'PHI');
      expect(phiDims).toHaveLength(6);
    });

    it('should have 6 VERIFY/BERIAH dimensions', () => {
      const verifyDims = Object.values(DIMENSIONS).filter(d => d.axiom === 'VERIFY');
      expect(verifyDims).toHaveLength(6);
    });

    it('should have 6 CULTURE/YETZIRAH dimensions', () => {
      const cultureDims = Object.values(DIMENSIONS).filter(d => d.axiom === 'CULTURE');
      expect(cultureDims).toHaveLength(6);
    });

    it('should have 6 BURN/ASSIAH dimensions', () => {
      const burnDims = Object.values(DIMENSIONS).filter(d => d.axiom === 'BURN');
      expect(burnDims).toHaveLength(6);
    });

    it('should have weight and axiom for each dimension', () => {
      Object.entries(DIMENSIONS).forEach(([name, dim]) => {
        expect(dim.weight).toBeDefined();
        expect(dim.axiom).toBeDefined();
        expect(dim.world).toBeDefined();
        expect(typeof dim.index).toBe('number');
      });
    });
  });

  describe('calculateGlobalScore()', () => {
    it('should calculate score from dimension inputs', () => {
      const scores = { HARMONY: 70, TRUTH: 80, ETHICS: 75 };
      const result = calculateGlobalScore(scores);
      expect(result.global).toBeGreaterThan(0);
      expect(result.global).toBeLessThanOrEqual(100);
    });

    it('should return breakdown of contributions', () => {
      const scores = { HARMONY: 70, TRUTH: 80 };
      const result = calculateGlobalScore(scores);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.length).toBe(2);
    });

    it('should track dimensions scored', () => {
      const scores = { HARMONY: 70, TRUTH: 80, ETHICS: 75 };
      const result = calculateGlobalScore(scores);
      expect(result.dimensionsScored).toBe(3);
      expect(result.totalDimensions).toBe(24);
    });

    it('should calculate coverage', () => {
      const scores = { HARMONY: 70, TRUTH: 80 };
      const result = calculateGlobalScore(scores);
      expect(result.coverage).toBeGreaterThan(0);
      expect(result.coverage).toBeLessThanOrEqual(100);
    });

    it('should cap confidence at φ⁻¹ (61.8%)', () => {
      // Full coverage should still cap at 61.8%
      const allScores = {};
      Object.keys(DIMENSIONS).forEach(d => { allScores[d] = 80; });
      const result = calculateGlobalScore(allScores);
      expect(result.confidence).toBeLessThanOrEqual(62);
    });

    it('should handle empty scores', () => {
      const result = calculateGlobalScore({});
      expect(result.global).toBe(0);
      expect(result.dimensionsScored).toBe(0);
    });

    it('should clamp scores to [1, 100]', () => {
      const scores = { HARMONY: -10, TRUTH: 200 };
      const result = calculateGlobalScore(scores);
      expect(result.global).toBeGreaterThan(0);
      expect(result.breakdown[0].score).toBeGreaterThanOrEqual(1);
      expect(result.breakdown[0].score).toBeLessThanOrEqual(100);
    });

    it('should track latency', () => {
      const scores = { HARMONY: 70 };
      const result = calculateGlobalScore(scores);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('detectTensions()', () => {
    it('should detect tensions between same-axiom dimensions with high difference', () => {
      const scores = {
        HARMONY: 90,   // PHI axiom
        COHERENCE: 40, // PHI axiom - same axiom, 50 point difference
      };
      const tensions = detectTensions(scores);
      expect(tensions.length).toBeGreaterThan(0);
    });

    it('should not detect tensions for similar scores', () => {
      const scores = { HARMONY: 70, COHERENCE: 72 };
      const tensions = detectTensions(scores);
      expect(tensions.length).toBe(0);
    });

    it('should return empty array for single dimension', () => {
      const scores = { HARMONY: 70 };
      const tensions = detectTensions(scores);
      expect(tensions).toEqual([]);
    });

    it('should sort tensions by difference (highest first)', () => {
      const scores = {
        HARMONY: 90,
        COHERENCE: 40,  // 50 diff
        TRUTH: 85,
        INTEGRITY: 45,  // 40 diff
      };
      const tensions = detectTensions(scores);
      if (tensions.length >= 2) {
        expect(tensions[0].difference).toBeGreaterThanOrEqual(tensions[1].difference);
      }
    });

    it('should classify severity', () => {
      const scores = { HARMONY: 95, COHERENCE: 30 };
      const tensions = detectTensions(scores);
      if (tensions.length > 0) {
        expect(['high', 'medium', 'low']).toContain(tensions[0].severity);
      }
    });
  });

  describe('determineVerdict()', () => {
    it('should return ACCEPT for score >= 61.8%', () => {
      const result = determineVerdict(65);
      expect(result.verdict).toBe('ACCEPT');
      expect(result.emoji).toBe('✅');
    });

    it('should return TRANSFORM for score in warning zone', () => {
      const result = determineVerdict(50);
      expect(result.verdict).toBe('TRANSFORM');
      expect(result.emoji).toBe('🔄');
    });

    it('should return CRITICAL for score in critical zone', () => {
      const result = determineVerdict(30);
      expect(result.verdict).toBe('CRITICAL');
      expect(result.emoji).toBe('⚠️');
    });

    it('should return REJECT for score below φ⁻³', () => {
      const result = determineVerdict(15);
      expect(result.verdict).toBe('REJECT');
      expect(result.emoji).toBe('❌');
    });

    it('should return TRANSFORM if blocking dimensions exist', () => {
      const blocking = [{ dimension: 'ETHICS', score: 20, threshold: 38, deficit: 18 }];
      const result = determineVerdict(70, { blockingDimensions: blocking });
      expect(result.verdict).toBe('TRANSFORM');
      expect(result.blocking).toEqual(blocking);
    });

    it('should return TRANSFORM for high severity tensions', () => {
      const tensions = [{ dimensions: ['HARMONY', 'COHERENCE'], severity: 'high', difference: 50 }];
      const result = determineVerdict(70, { tensions });
      expect(result.verdict).toBe('TRANSFORM');
      expect(result.tensions).toEqual(tensions);
    });
  });

  describe('findBlockingDimensions()', () => {
    it('should find dimensions below default threshold (38.2%)', () => {
      const scores = { HARMONY: 70, ETHICS: 20 };
      const blocking = findBlockingDimensions(scores);
      expect(blocking.length).toBe(1);
      expect(blocking[0].dimension).toBe('ETHICS');
    });

    it('should calculate deficit', () => {
      const scores = { ETHICS: 20 };
      const blocking = findBlockingDimensions(scores);
      expect(blocking[0].deficit).toBeCloseTo(18.2, 0);
    });

    it('should respect custom thresholds', () => {
      const scores = { HARMONY: 55 };
      const blocking = findBlockingDimensions(scores, { HARMONY: 60 });
      expect(blocking.length).toBe(1);
    });

    it('should return empty array when all pass', () => {
      const scores = { HARMONY: 70, TRUTH: 80 };
      const blocking = findBlockingDimensions(scores);
      expect(blocking).toEqual([]);
    });

    it('should sort by deficit (highest first)', () => {
      const scores = { HARMONY: 30, ETHICS: 10 };
      const blocking = findBlockingDimensions(scores);
      expect(blocking[0].dimension).toBe('ETHICS');
      expect(blocking[0].deficit).toBeGreaterThan(blocking[1].deficit);
    });
  });

  describe('calculateTechnicalDepth()', () => {
    it('should return value between 0 and 1', () => {
      const td = calculateTechnicalDepth({ vocabulary: 0.5, questionDepth: 0.5 });
      expect(td).toBeGreaterThanOrEqual(0);
      expect(td).toBeLessThanOrEqual(1);
    });

    it('should return higher value for expert context', () => {
      const novice = calculateTechnicalDepth({ vocabulary: 0.2, questionDepth: 0.2 });
      const expert = calculateTechnicalDepth({ vocabulary: 0.9, questionDepth: 0.9 });
      expect(expert).toBeGreaterThan(novice);
    });

    it('should use default values', () => {
      const td = calculateTechnicalDepth();
      expect(td).toBeCloseTo(0.5, 1);
    });
  });

  describe('formatOutput()', () => {
    const mockResult = {
      global: 70,
      confidence: 55,
      verdict: { verdict: 'ACCEPT', emoji: '✅' },
      breakdown: [{ dimension: 'HARMONY', score: 75, weight: 2.618 }],
      tensions: [],
    };

    it('should format simple output for low technical depth', () => {
      const output = formatOutput(mockResult, 0.1);
      expect(output.format).toBe('simple');
      expect(output.emoji).toBeDefined();
      expect(output.phrase).toBeDefined();
    });

    it('should format standard output for medium technical depth', () => {
      const output = formatOutput(mockResult, 0.45);
      expect(output.format).toBe('standard');
      expect(output.grade).toBeDefined();
      expect(output.percentage).toBeDefined();
    });

    it('should format detailed output for high technical depth', () => {
      const output = formatOutput(mockResult, 0.8);
      expect(output.format).toBe('detailed');
      expect(output.score).toBeDefined();
      expect(output.dimensions).toBeDefined();
    });

    it('should include technical depth in output', () => {
      const output = formatOutput(mockResult, 0.75);
      expect(output.technicalDepth).toBe(0.75);
    });
  });

  describe('scoreToGrade()', () => {
    it('should return A+ for score >= 90', () => {
      expect(scoreToGrade(95)).toBe('A+');
    });

    it('should return A for score >= 85', () => {
      expect(scoreToGrade(87)).toBe('A');
    });

    it('should return B for score >= 70', () => {
      expect(scoreToGrade(72)).toBe('B');
    });

    it('should return C for score >= 55', () => {
      expect(scoreToGrade(57)).toBe('C');
    });

    it('should return D for score >= 40', () => {
      expect(scoreToGrade(42)).toBe('D');
    });

    it('should return F for score < 35', () => {
      expect(scoreToGrade(20)).toBe('F');
    });
  });

  describe('score() - Main Function', () => {
    it('should return complete score result', () => {
      const scores = { HARMONY: 70, TRUTH: 80, ETHICS: 75 };
      const result = score(scores);

      expect(result.global).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.verdict).toBeDefined();
      expect(result.verdictEmoji).toBeDefined();
      expect(result.breakdown).toBeDefined();
      expect(result.formatted).toBeDefined();
      expect(result.thresholds).toBeDefined();
      expect(result.scorer).toBe('CYNIC-SCORE');
      expect(result.world).toBe('ASSIAH');
    });

    it('should calculate technical depth from context', () => {
      const scores = { HARMONY: 70 };
      const result = score(scores, { context: { vocabulary: 0.9, questionDepth: 0.9 } });
      expect(result.technicalDepth).toBeGreaterThan(0.5);
    });

    it('should respect provided technical depth', () => {
      const scores = { HARMONY: 70 };
      const result = score(scores, { technicalDepth: 0.3 });
      expect(result.technicalDepth).toBe(0.3);
    });

    it('should include φ-based thresholds', () => {
      const scores = { HARMONY: 70 };
      const result = score(scores);
      expect(result.thresholds.accept).toBe(62);
      expect(result.thresholds.warning).toBe(38);
      expect(result.thresholds.critical).toBe(24);
    });

    it('should track latency', () => {
      const scores = { HARMONY: 70, TRUTH: 80 };
      const result = score(scores);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should detect blocking dimensions', () => {
      const scores = { HARMONY: 70, ETHICS: 15 };
      const result = score(scores);
      expect(result.blocking.length).toBe(1);
      expect(result.verdict).toBe('TRANSFORM');
    });

    it('should detect tensions', () => {
      const scores = { HARMONY: 90, COHERENCE: 30 };
      const result = score(scores);
      expect(result.tensions.length).toBeGreaterThan(0);
    });
  });
});
