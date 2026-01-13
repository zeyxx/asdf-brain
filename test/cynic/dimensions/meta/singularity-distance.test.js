/**
 * Tests for lib/cynic/dimensions/meta/singularity-distance.js
 *
 * SINGULARITY_DISTANCE Dimension - How far is the singularity?
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { SingularityDistanceEvaluator } = require('../../../../lib/cynic/dimensions/meta/singularity-distance');

describe('SINGULARITY_DISTANCE Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new SingularityDistanceEvaluator();
  });

  describe('Metadata', () => {
    it('should have name SINGULARITY_DISTANCE', () => {
      expect(evaluator.name).toBe('SINGULARITY_DISTANCE');
    });

    it('should be META category', () => {
      expect(evaluator.category).toBe('META');
    });

    it('should belong to ATZILUT world', () => {
      expect(evaluator.world).toBe('ATZILUT');
    });

    it('should have PHI axiom', () => {
      expect(evaluator.axiom).toBe('PHI');
    });

    it('should have threshold of φ⁻² (38.2%)', () => {
      expect(evaluator.threshold).toBeCloseTo(38.2, 1);
    });

    it('should have question about unknowable truth', () => {
      expect(evaluator.question).toContain('unknowable');
    });
  });

  describe('evaluate()', () => {
    it('should evaluate observation for singularity distance', async () => {
      const observation = {
        complexity: 0.5,
        novelty: 0.3,
        emergentBehavior: false,
      };

      const result = await evaluator.evaluate(observation);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasoning');
      expect(typeof result.score).toBe('number');
    });

    it('should return consistent scores for same input', async () => {
      const observation = {
        complexity: 0.5,
        novelty: 0.5,
        emergentBehavior: false,
      };

      const result1 = await evaluator.evaluate(observation);
      const result2 = await evaluator.evaluate(observation);

      expect(result1.score).toBe(result2.score);
    });

    it('should provide reasoning', async () => {
      const observation = {};
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
      expect(typeof result.reasoning).toBe('string');
    });

    it('should include details in result', async () => {
      const observation = {
        complexity: 0.5,
      };
      const result = await evaluator.evaluate(observation);
      expect(result).toHaveProperty('details');
    });

    it('should handle context parameter', async () => {
      const observation = { complexity: 0.5 };
      const context = { history: [], timestamp: Date.now() };
      const result = await evaluator.evaluate(observation, context);
      expect(result).toHaveProperty('score');
    });
  });

  describe('passes()', () => {
    it('should return boolean for pass check', async () => {
      const observation = {
        complexity: 0.5,
        novelty: 0.5,
      };
      const result = await evaluator.evaluate(observation);
      const passes = evaluator.passes(result.score);
      expect(typeof passes).toBe('boolean');
    });
  });
});
