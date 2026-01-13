/**
 * Tests for lib/cynic/dimensions/base.js
 *
 * Verifies DimensionEvaluator base class
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { DimensionEvaluator } = require('../../../lib/cynic/dimensions/base');
const { PHI, PHI_INV, PHI_INV_2 } = require('../../../lib/cynic/axioms/constants');

describe('DimensionEvaluator Base', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new DimensionEvaluator({
      name: 'TEST',
      category: 'PRIMARY',
      world: 'ATZILUT',
      axiom: 'PHI',
      threshold: 60,
      question: 'Is this a test?',
    });
  });

  describe('Constructor', () => {
    it('should set name correctly', () => {
      expect(evaluator.name).toBe('TEST');
    });

    it('should set category correctly', () => {
      expect(evaluator.category).toBe('PRIMARY');
    });

    it('should set world correctly', () => {
      expect(evaluator.world).toBe('ATZILUT');
    });

    it('should set axiom correctly', () => {
      expect(evaluator.axiom).toBe('PHI');
    });

    it('should set threshold correctly', () => {
      expect(evaluator.threshold).toBe(60);
    });

    it('should set question correctly', () => {
      expect(evaluator.question).toBe('Is this a test?');
    });

    it('should have PHI constant', () => {
      expect(evaluator.PHI).toBeCloseTo(PHI, 10);
    });

    it('should have PHI_INV constant', () => {
      expect(evaluator.PHI_INV).toBeCloseTo(PHI_INV, 10);
    });
  });

  describe('Category Weights', () => {
    it('should assign φ² weight to PRIMARY', () => {
      const primary = new DimensionEvaluator({
        name: 'P',
        category: 'PRIMARY',
        world: 'ATZILUT',
        axiom: 'PHI',
        threshold: 50,
        question: '?',
      });
      expect(primary.weight).toBeCloseTo(PHI * PHI, 5);
    });

    it('should assign φ weight to SECONDARY', () => {
      const secondary = new DimensionEvaluator({
        name: 'S',
        category: 'SECONDARY',
        world: 'BERIAH',
        axiom: 'VERIFY',
        threshold: 50,
        question: '?',
      });
      expect(secondary.weight).toBeCloseTo(PHI, 5);
    });

    it('should assign 1.0 weight to META', () => {
      const meta = new DimensionEvaluator({
        name: 'M',
        category: 'META',
        world: 'YETZIRAH',
        axiom: 'CULTURE',
        threshold: 50,
        question: '?',
      });
      expect(meta.weight).toBe(1.0);
    });

    it('should assign φ weight to HUMAN_LLM', () => {
      const humanLlm = new DimensionEvaluator({
        name: 'H',
        category: 'HUMAN_LLM',
        world: 'ASSIAH',
        axiom: 'BURN',
        threshold: 50,
        question: '?',
      });
      expect(humanLlm.weight).toBeCloseTo(PHI, 5);
    });
  });

  describe('passes()', () => {
    it('should return true for score above threshold', () => {
      expect(evaluator.passes(70)).toBe(true);
    });

    it('should return true for score equal to threshold', () => {
      expect(evaluator.passes(60)).toBe(true);
    });

    it('should return false for score below threshold', () => {
      expect(evaluator.passes(50)).toBe(false);
    });

    it('should return false for zero score', () => {
      expect(evaluator.passes(0)).toBe(false);
    });
  });

  describe('getMetadata()', () => {
    it('should return all metadata fields', () => {
      const meta = evaluator.getMetadata();
      expect(meta).toHaveProperty('name', 'TEST');
      expect(meta).toHaveProperty('category', 'PRIMARY');
      expect(meta).toHaveProperty('world', 'ATZILUT');
      expect(meta).toHaveProperty('axiom', 'PHI');
      expect(meta).toHaveProperty('threshold', 60);
      expect(meta).toHaveProperty('question', 'Is this a test?');
      expect(meta).toHaveProperty('weight');
    });
  });

  describe('evaluate()', () => {
    it('should throw error if not implemented', async () => {
      await expect(evaluator.evaluate({})).rejects.toThrow('must be implemented');
    });
  });

  describe('createResult()', () => {
    it('should create result with all required fields', () => {
      const result = evaluator.createResult(75, 'Good score', { detail: 'value' });
      expect(result).toHaveProperty('dimension', 'TEST');
      expect(result).toHaveProperty('score', 75);
      expect(result).toHaveProperty('passed', true);
      expect(result).toHaveProperty('threshold', 60);
      expect(result).toHaveProperty('reasoning', 'Good score');
      expect(result).toHaveProperty('details');
      expect(result.details.detail).toBe('value');
    });

    it('should mark failed when score below threshold', () => {
      const result = evaluator.createResult(40, 'Low score', {});
      expect(result.passed).toBe(false);
    });
  });

  describe('weightedAverage()', () => {
    it('should calculate weighted average correctly', () => {
      const scores = [
        { value: 100, weight: 2 },
        { value: 50, weight: 1 },
      ];
      // (100*2 + 50*1) / (2+1) = 250/3 = 83.33
      expect(evaluator.weightedAverage(scores)).toBeCloseTo(83.33, 1);
    });

    it('should handle empty array', () => {
      expect(evaluator.weightedAverage([])).toBe(0);
    });

    it('should handle single element', () => {
      const scores = [{ value: 75, weight: 1 }];
      expect(evaluator.weightedAverage(scores)).toBe(75);
    });
  });

});
