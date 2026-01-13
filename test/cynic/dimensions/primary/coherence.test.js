/**
 * Tests for lib/cynic/dimensions/primary/coherence.js
 *
 * COHERENCE Dimension - "Les parties s'alignent-elles?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { CoherenceEvaluator } = require('../../../../lib/cynic/dimensions/primary/coherence');

describe('COHERENCE Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new CoherenceEvaluator();
  });

  describe('Metadata', () => {
    it('should have name COHERENCE', () => {
      expect(evaluator.name).toBe('COHERENCE');
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

    it('should have threshold 70', () => {
      expect(evaluator.threshold).toBe(70);
    });
  });

  describe('evaluate()', () => {
    it('should evaluate coherent observation', async () => {
      const observation = {
        parts: ['a', 'b', 'c'],
        consistent: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('COHERENCE');
      expect(result).toHaveProperty('score');
    });

    it('should detect internal consistency', async () => {
      const observation = {
        intent: 'build',
        action: 'build',
        result: 'built',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(40);
    });

    it('should penalize contradiction', async () => {
      const observation = {
        claims: ['yes', 'no'],
        contradicts: true,
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
    it('should pass for coherent score', () => {
      expect(evaluator.passes(80)).toBe(true);
    });

    it('should fail for incoherent score', () => {
      expect(evaluator.passes(50)).toBe(false);
    });
  });
});
