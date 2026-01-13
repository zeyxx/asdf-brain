/**
 * Tests for lib/cynic/dimensions/secondary/scale.js
 *
 * SCALE Dimension - "Does it scale?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { ScaleEvaluator } = require('../../../../lib/cynic/dimensions/secondary/scale');

describe('SCALE Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new ScaleEvaluator();
  });

  describe('Metadata', () => {
    it('should have name SCALE', () => {
      expect(evaluator.name).toBe('SCALE');
    });

    it('should be SECONDARY category', () => {
      expect(evaluator.category).toBe('SECONDARY');
    });

    it('should belong to ASSIAH world', () => {
      expect(evaluator.world).toBe('ASSIAH');
    });

    it('should have BURN axiom', () => {
      expect(evaluator.axiom).toBe('BURN');
    });
  });

  describe('evaluate()', () => {
    it('should give high score for scalable observation', async () => {
      const observation = {
        scalable: true,
        distributed: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('SCALE');
      expect(result.score).toBeGreaterThan(40);
    });

    it('should penalize non-scalable approaches', async () => {
      const observation = {
        centralized: true,
        bottleneck: true,
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
    it('should pass for scalable score', () => {
      expect(evaluator.passes(70)).toBe(true);
    });

    it('should fail for non-scalable score', () => {
      expect(evaluator.passes(40)).toBe(false);
    });
  });
});
