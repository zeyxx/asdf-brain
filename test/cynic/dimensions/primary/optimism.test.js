/**
 * Tests for lib/cynic/dimensions/primary/optimism.js
 *
 * OPTIMISM Dimension - "Le ton est-il constructif?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { OptimismEvaluator } = require('../../../../lib/cynic/dimensions/primary/optimism');

describe('OPTIMISM Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new OptimismEvaluator();
  });

  describe('Metadata', () => {
    it('should have name OPTIMISM', () => {
      expect(evaluator.name).toBe('OPTIMISM');
    });

    it('should be PRIMARY category', () => {
      expect(evaluator.category).toBe('PRIMARY');
    });

    it('should belong to YETZIRAH world', () => {
      expect(evaluator.world).toBe('YETZIRAH');
    });

    it('should have CULTURE axiom', () => {
      expect(evaluator.axiom).toBe('CULTURE');
    });
  });

  describe('evaluate()', () => {
    it('should give high score for positive content', async () => {
      const observation = {
        content: 'We will succeed and build great things',
        sentiment: 'positive',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('OPTIMISM');
      expect(result.score).toBeGreaterThan(50);
    });

    it('should detect constructive tone', async () => {
      const observation = {
        content: 'Let us improve and grow together',
        constructive: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(40);
    });

    it('should penalize pessimistic content', async () => {
      const observation = {
        content: 'Everything will fail and collapse',
        sentiment: 'negative',
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
    it('should pass for optimistic score', () => {
      expect(evaluator.passes(75)).toBe(true);
    });

    it('should fail for pessimistic score', () => {
      expect(evaluator.passes(30)).toBe(false);
    });
  });
});
