/**
 * Tests for lib/cynic/dimensions/primary/ethics.js
 *
 * ETHICS Dimension - "La culture est-elle respectée?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { EthicsEvaluator } = require('../../../../lib/cynic/dimensions/primary/ethics');

describe('ETHICS Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new EthicsEvaluator();
  });

  describe('Metadata', () => {
    it('should have name ETHICS', () => {
      expect(evaluator.name).toBe('ETHICS');
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
    it('should give high score for ethical content', async () => {
      const observation = {
        content: 'Building a community that helps everyone',
        intent: 'positive',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('ETHICS');
      expect(result.score).toBeGreaterThan(50);
    });

    it('should penalize harmful content', async () => {
      const observation = {
        content: 'scam exploit rug pull',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeLessThan(70);
    });

    it('should detect positive indicators', async () => {
      const observation = {
        content: 'open source community contribution',
        tags: ['opensource', 'contribution'],
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should provide reasoning', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for ethical score', () => {
      expect(evaluator.passes(80)).toBe(true);
    });

    it('should fail for unethical score', () => {
      expect(evaluator.passes(30)).toBe(false);
    });
  });
});
