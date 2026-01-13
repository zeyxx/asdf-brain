/**
 * Tests for lib/cynic/dimensions/primary/progress.js
 *
 * PROGRESS Dimension - "Avance-t-on vers la singularité?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { ProgressEvaluator } = require('../../../../lib/cynic/dimensions/primary/progress');

describe('PROGRESS Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new ProgressEvaluator();
  });

  describe('Metadata', () => {
    it('should have name PROGRESS', () => {
      expect(evaluator.name).toBe('PROGRESS');
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
    it('should give high score for forward progress', async () => {
      const observation = {
        delta: 0.1,
        direction: 'forward',
        improves: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('PROGRESS');
      expect(result.score).toBeGreaterThan(40);
    });

    it('should detect movement toward singularity', async () => {
      const observation = {
        singularityDistance: 0.3,
        previousDistance: 0.4,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(40);
    });

    it('should penalize regression', async () => {
      const observation = {
        delta: -0.2,
        direction: 'backward',
        regresses: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeLessThan(70);
    });

    it('should provide reasoning', async () => {
      const observation = { action: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for progress score', () => {
      expect(evaluator.passes(70)).toBe(true);
    });

    it('should fail for regression score', () => {
      expect(evaluator.passes(40)).toBe(false);
    });
  });
});
