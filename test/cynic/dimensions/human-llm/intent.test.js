/**
 * Tests for lib/cynic/dimensions/human-llm/intent.js
 */

import { describe, it, expect, beforeEach } from 'vitest';

const evaluatorModule = require('../../../../lib/cynic/dimensions/human-llm/intent');
const EvaluatorClass = Object.values(evaluatorModule).find(v => typeof v === 'function');

describe('INTENT Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new EvaluatorClass();
  });

  describe('Metadata', () => {
    it('should have correct name', () => {
      expect(evaluator.name).toBe('INTENT');
    });

    it('should be HUMAN_LLM category', () => {
      expect(evaluator.category).toBe('HUMAN_LLM');
    });

    it('should have a world defined', () => {
      expect(['ATZILUT', 'BERIAH', 'YETZIRAH', 'ASSIAH']).toContain(evaluator.world);
    });

    it('should have an axiom defined', () => {
      expect(['PHI', 'VERIFY', 'CULTURE', 'BURN']).toContain(evaluator.axiom);
    });

    it('should have a threshold', () => {
      expect(typeof evaluator.threshold).toBe('number');
      expect(evaluator.threshold).toBeGreaterThan(0);
      expect(evaluator.threshold).toBeLessThanOrEqual(100);
    });
  });

  describe('evaluate()', () => {
    it('should return a valid result structure', async () => {
      const observation = { content: 'Test observation' };
      const result = await evaluator.evaluate(observation, {});
      
      expect(result).toBeDefined();
      expect(result.dimension).toBe('INTENT');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should provide reasoning', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation, {});
      expect(result.reasoning).toBeDefined();
      expect(typeof result.reasoning).toBe('string');
    });

    it('should include details in result', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation, {});
      expect(result.details).toBeDefined();
    });

    it('should return consistent scores for same input', async () => {
      const observation = { content: 'consistent test' };
      const result1 = await evaluator.evaluate(observation, {});
      const result2 = await evaluator.evaluate(observation, {});
      // Scores should be within 10 points of each other (some evaluators have randomness)
      expect(Math.abs(result1.score - result2.score)).toBeLessThan(15);
    });
  });

  describe('passes()', () => {
    it('should return true for score above threshold', () => {
      expect(evaluator.passes(evaluator.threshold + 10)).toBe(true);
    });

    it('should return false for score below threshold', () => {
      expect(evaluator.passes(evaluator.threshold - 20)).toBe(false);
    });
  });
});
