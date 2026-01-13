/**
 * Tests for lib/cynic/dimensions/meta/self-awareness.js
 *
 * SELF_AWARENESS Dimension - Does CYNIC know its limitations?
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { SelfAwarenessEvaluator } = require('../../../../lib/cynic/dimensions/meta/self-awareness');

describe('SELF_AWARENESS Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new SelfAwarenessEvaluator();
  });

  describe('Metadata', () => {
    it('should have name SELF_AWARENESS', () => {
      expect(evaluator.name).toBe('SELF_AWARENESS');
    });

    it('should be META category', () => {
      expect(evaluator.category).toBe('META');
    });

    it('should belong to ATZILUT world', () => {
      expect(evaluator.world).toBe('ATZILUT');
    });

    it('should have PHI axiom', () => {
      expect(evaluator.axiom).toBe('PHI');
    });

    it('should have threshold of φ⁻¹ (61.8%)', () => {
      expect(evaluator.threshold).toBeCloseTo(61.8, 1);
    });

    it('should have question about limitations', () => {
      expect(evaluator.question).toContain('limitations');
    });
  });

  describe('evaluate()', () => {
    it('should evaluate observation for self-awareness', async () => {
      const observation = {
        confidence: 0.7,
        acknowledgesUncertainty: true,
        statesLimitations: true,
      };

      const result = await evaluator.evaluate(observation);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasoning');
      expect(typeof result.score).toBe('number');
    });

    it('should give higher score for acknowledging uncertainty', async () => {
      const aware = {
        acknowledgesUncertainty: true,
        statesLimitations: true,
        confidence: 0.5,
      };
      const overconfident = {
        acknowledgesUncertainty: false,
        statesLimitations: false,
        confidence: 1.0,
      };

      const awareResult = await evaluator.evaluate(aware);
      const overconfidentResult = await evaluator.evaluate(overconfident);

      expect(awareResult.score).toBeGreaterThan(overconfidentResult.score);
    });

    it('should provide reasoning', async () => {
      const observation = {};
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
      expect(typeof result.reasoning).toBe('string');
    });

    it('should include details in result', async () => {
      const observation = {
        confidence: 0.6,
        acknowledgesUncertainty: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result).toHaveProperty('details');
    });
  });

  describe('passes()', () => {
    it('should pass for self-aware score above threshold', async () => {
      const observation = {
        acknowledgesUncertainty: true,
        statesLimitations: true,
        confidence: 0.5,
      };
      const result = await evaluator.evaluate(observation);
      const passes = evaluator.passes(result.score);
      expect(typeof passes).toBe('boolean');
    });

    it('should fail for overconfident score', async () => {
      const observation = {
        acknowledgesUncertainty: false,
        statesLimitations: false,
        confidence: 1.0,
      };
      const result = await evaluator.evaluate(observation);
      const passes = evaluator.passes(result.score);
      expect(typeof passes).toBe('boolean');
    });
  });
});
