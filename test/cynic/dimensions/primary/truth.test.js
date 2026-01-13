/**
 * Tests for lib/cynic/dimensions/primary/truth.js
 *
 * TRUTH Dimension - "Est-ce vérifiable?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { TruthEvaluator } = require('../../../../lib/cynic/dimensions/primary/truth');

describe('TRUTH Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new TruthEvaluator();
  });

  describe('Metadata', () => {
    it('should have name TRUTH', () => {
      expect(evaluator.name).toBe('TRUTH');
    });

    it('should be PRIMARY category', () => {
      expect(evaluator.category).toBe('PRIMARY');
    });

    it('should belong to BERIAH world', () => {
      expect(evaluator.world).toBe('BERIAH');
    });

    it('should have VERIFY axiom', () => {
      expect(evaluator.axiom).toBe('VERIFY');
    });

    it('should have threshold 70', () => {
      expect(evaluator.threshold).toBe(70);
    });
  });

  describe('evaluate()', () => {
    it('should give high score for verifiable observation', async () => {
      const observation = {
        hash: 'abc123def456',
        timestamp: Date.now(),
        source: 'verified',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(30);
      expect(result.dimension).toBe('TRUTH');
    });

    it('should give lower score for unverifiable observation', async () => {
      const observation = {
        content: 'just text',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeLessThan(80);
    });

    it('should check for hash presence', async () => {
      const withHash = { hash: 'sha256:abc123' };
      const withoutHash = { content: 'no hash' };

      const resultWith = await evaluator.evaluate(withHash);
      const resultWithout = await evaluator.evaluate(withoutHash);

      expect(resultWith.score).toBeGreaterThanOrEqual(resultWithout.score);
    });

    it('should check for timestamp presence', async () => {
      const withTimestamp = { timestamp: Date.now() };
      const withoutTimestamp = { content: 'no time' };

      const resultWith = await evaluator.evaluate(withTimestamp);
      const resultWithout = await evaluator.evaluate(withoutTimestamp);

      expect(resultWith.score).toBeGreaterThanOrEqual(resultWithout.score);
    });

    it('should provide reasoning', async () => {
      const observation = { hash: 'abc', timestamp: Date.now() };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
      expect(typeof result.reasoning).toBe('string');
    });
  });

  describe('passes()', () => {
    it('should pass for high truth score', () => {
      expect(evaluator.passes(85)).toBe(true);
    });

    it('should fail for low truth score', () => {
      expect(evaluator.passes(50)).toBe(false);
    });
  });
});
