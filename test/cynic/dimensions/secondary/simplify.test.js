/**
 * Tests for lib/cynic/dimensions/secondary/simplify.js
 *
 * SIMPLIFY Dimension - "Is it as simple as possible?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { SimplifyEvaluator } = require('../../../../lib/cynic/dimensions/secondary/simplify');

describe('SIMPLIFY Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new SimplifyEvaluator();
  });

  describe('Metadata', () => {
    it('should have name SIMPLIFY', () => {
      expect(evaluator.name).toBe('SIMPLIFY');
    });

    it('should be SECONDARY category', () => {
      expect(evaluator.category).toBe('SECONDARY');
    });

    it('should belong to ATZILUT world', () => {
      expect(evaluator.world).toBe('ATZILUT');
    });

    it('should have PHI axiom', () => {
      expect(evaluator.axiom).toBe('PHI');
    });

    it('should have threshold 60', () => {
      expect(evaluator.threshold).toBe(60);
    });
  });

  describe('evaluate()', () => {
    it('should evaluate simple observation', async () => {
      const observation = {
        simple: true,
        minimal: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('SIMPLIFY');
      expect(result.score).toBeGreaterThan(50);
    });

    it('should penalize complexity', async () => {
      const observation = {
        nested: { deep: { deeper: { complex: true } } },
        overEngineered: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeLessThan(80);
    });

    it('should provide reasoning', async () => {
      const observation = { data: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for simple score', () => {
      expect(evaluator.passes(70)).toBe(true);
    });

    it('should fail for complex score', () => {
      expect(evaluator.passes(40)).toBe(false);
    });
  });
});
