/**
 * Tests for lib/cynic/dimensions/secondary/enable.js
 *
 * ENABLE Dimension - "Does it enable others?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { EnableEvaluator } = require('../../../../lib/cynic/dimensions/secondary/enable');

describe('ENABLE Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new EnableEvaluator();
  });

  describe('Metadata', () => {
    it('should have name ENABLE', () => {
      expect(evaluator.name).toBe('ENABLE');
    });

    it('should be SECONDARY category', () => {
      expect(evaluator.category).toBe('SECONDARY');
    });

    it('should belong to YETZIRAH world', () => {
      expect(evaluator.world).toBe('YETZIRAH');
    });

    it('should have CULTURE axiom', () => {
      expect(evaluator.axiom).toBe('CULTURE');
    });
  });

  describe('evaluate()', () => {
    it('should give high score for enabling observation', async () => {
      const observation = {
        enables: true,
        empowers: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('ENABLE');
      expect(result.score).toBeGreaterThan(40);
    });

    it('should penalize blocking behavior', async () => {
      const observation = {
        blocks: true,
        restricts: true,
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
    it('should pass for enabling score', () => {
      expect(evaluator.passes(70)).toBe(true);
    });

    it('should fail for blocking score', () => {
      expect(evaluator.passes(40)).toBe(false);
    });
  });
});
