/**
 * Tests for lib/cynic/dimensions/secondary/private.js
 *
 * PRIVATE Dimension - "Is privacy respected?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { PrivateEvaluator } = require('../../../../lib/cynic/dimensions/secondary/private');

describe('PRIVATE Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new PrivateEvaluator();
  });

  describe('Metadata', () => {
    it('should have name PRIVATE', () => {
      expect(evaluator.name).toBe('PRIVATE');
    });

    it('should be SECONDARY category', () => {
      expect(evaluator.category).toBe('SECONDARY');
    });

    it('should belong to BERIAH world', () => {
      expect(evaluator.world).toBe('BERIAH');
    });

    it('should have VERIFY axiom', () => {
      expect(evaluator.axiom).toBe('VERIFY');
    });
  });

  describe('evaluate()', () => {
    it('should give high score for privacy-respecting observation', async () => {
      const observation = {
        anonymized: true,
        noPersonalData: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('PRIVATE');
      expect(result.score).toBeGreaterThan(40);
    });

    it('should penalize privacy violations', async () => {
      const observation = {
        exposesEmail: true,
        leaksData: true,
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
    it('should pass for private score', () => {
      expect(evaluator.passes(80)).toBe(true);
    });

    it('should fail for exposed score', () => {
      expect(evaluator.passes(60)).toBe(false);
    });
  });
});
