/**
 * Tests for lib/cynic/dimensions/secondary/secure.js
 *
 * SECURE Dimension - "Is it secure?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { SecureEvaluator } = require('../../../../lib/cynic/dimensions/secondary/secure');

describe('SECURE Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new SecureEvaluator();
  });

  describe('Metadata', () => {
    it('should have name SECURE', () => {
      expect(evaluator.name).toBe('SECURE');
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
    it('should give high score for secure observation', async () => {
      const observation = {
        encrypted: true,
        authenticated: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('SECURE');
      expect(result.score).toBeGreaterThan(40);
    });

    it('should penalize security issues', async () => {
      const observation = {
        vulnerable: true,
        exposed: true,
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
    it('should pass for secure score', () => {
      expect(evaluator.passes(85)).toBe(true);
    });

    it('should fail for insecure score', () => {
      expect(evaluator.passes(70)).toBe(false);
    });
  });
});
