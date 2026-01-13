/**
 * Tests for lib/cynic/dimensions/primary/harmony.js
 *
 * HARMONY Dimension - "L'équilibre φ est-il respecté?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { HarmonyEvaluator } = require('../../../../lib/cynic/dimensions/primary/harmony');

describe('HARMONY Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new HarmonyEvaluator();
  });

  describe('Metadata', () => {
    it('should have name HARMONY', () => {
      expect(evaluator.name).toBe('HARMONY');
    });

    it('should be PRIMARY category', () => {
      expect(evaluator.category).toBe('PRIMARY');
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
    it('should evaluate object with φ-derived ratio', async () => {
      const observation = {
        ratio: 1.618,
      };
      const result = await evaluator.evaluate(observation);
      expect(result).toHaveProperty('dimension', 'HARMONY');
      expect(result).toHaveProperty('score');
      expect(result.score).toBeGreaterThan(50);
    });

    it('should give high score for φ-constrained confidence', async () => {
      const observation = {
        confidence: 61.8,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should give high score for φ-derived threshold', async () => {
      const observation = {
        threshold: 61.8,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should evaluate balanced structure', async () => {
      const observation = {
        parts: [1, 2, 3],
        total: 6,
      };
      const result = await evaluator.evaluate(observation);
      expect(result).toHaveProperty('passed');
    });

    it('should provide reasoning', async () => {
      const observation = { ratio: 1.618 };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
      expect(typeof result.reasoning).toBe('string');
    });

    it('should include details', async () => {
      const observation = { ratio: 1.618 };
      const result = await evaluator.evaluate(observation);
      expect(result.details).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for high harmony score', () => {
      expect(evaluator.passes(80)).toBe(true);
    });

    it('should fail for low harmony score', () => {
      expect(evaluator.passes(40)).toBe(false);
    });
  });
});
