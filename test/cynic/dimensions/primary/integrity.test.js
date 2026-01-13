/**
 * Tests for lib/cynic/dimensions/primary/integrity.js
 *
 * INTEGRITY Dimension - "Les données sont-elles intègres?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { IntegrityEvaluator } = require('../../../../lib/cynic/dimensions/primary/integrity');

describe('INTEGRITY Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new IntegrityEvaluator();
  });

  describe('Metadata', () => {
    it('should have name INTEGRITY', () => {
      expect(evaluator.name).toBe('INTEGRITY');
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
  });

  describe('evaluate()', () => {
    it('should evaluate data with hash', async () => {
      const observation = {
        hash: 'sha256:abc123',
        data: 'test',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('INTEGRITY');
      expect(result).toHaveProperty('score');
    });

    it('should give higher score for signed data', async () => {
      const observation = {
        signature: 'valid_sig',
        signed: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(20);
    });

    it('should detect tampered data', async () => {
      const observation = {
        tampered: true,
        modified: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeLessThan(70);
    });

    it('should provide reasoning', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for high integrity', () => {
      expect(evaluator.passes(85)).toBe(true);
    });

    it('should fail for low integrity', () => {
      expect(evaluator.passes(70)).toBe(false);
    });
  });
});
