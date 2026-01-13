/**
 * Tests for lib/cynic/dimensions/primary/alignment.js
 *
 * ALIGNMENT Dimension - "L'action suit-elle les 4 axiomes?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { AlignmentEvaluator } = require('../../../../lib/cynic/dimensions/primary/alignment');

describe('ALIGNMENT Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new AlignmentEvaluator();
  });

  describe('Metadata', () => {
    it('should have name ALIGNMENT', () => {
      expect(evaluator.name).toBe('ALIGNMENT');
    });

    it('should be PRIMARY category', () => {
      expect(evaluator.category).toBe('PRIMARY');
    });

    it('should belong to ASSIAH world', () => {
      expect(evaluator.world).toBe('ASSIAH');
    });

    it('should have BURN axiom', () => {
      expect(evaluator.axiom).toBe('BURN');
    });
  });

  describe('evaluate()', () => {
    it('should give high score for burning action', async () => {
      const observation = {
        burns: true,
        improves: true,
        action: 'burn',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('ALIGNMENT');
      expect(result.score).toBeGreaterThan(60);
    });

    it('should penalize extraction', async () => {
      const observation = {
        extracts: true,
        takes: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeLessThan(60);
    });

    it('should detect building action', async () => {
      const observation = {
        builds: true,
        contributes: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should provide reasoning', async () => {
      const observation = { action: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for aligned action', () => {
      expect(evaluator.passes(75)).toBe(true);
    });

    it('should fail for misaligned action', () => {
      expect(evaluator.passes(40)).toBe(false);
    });
  });
});
