/**
 * Tests for lib/cynic/dimensions/human-llm/memory.js
 *
 * MEMORY Dimension - "Is context properly remembered?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { MemoryEvaluator } = require('../../../../lib/cynic/dimensions/human-llm/memory');

describe('MEMORY Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new MemoryEvaluator();
  });

  describe('Metadata', () => {
    it('should have name MEMORY', () => {
      expect(evaluator.name).toBe('MEMORY');
    });

    it('should be HUMAN_LLM category', () => {
      expect(evaluator.category).toBe('HUMAN_LLM');
    });

    it('should belong to BERIAH world', () => {
      expect(evaluator.world).toBe('BERIAH');
    });

    it('should have VERIFY axiom', () => {
      expect(evaluator.axiom).toBe('VERIFY');
    });

    it('should have threshold 60', () => {
      expect(evaluator.threshold).toBe(60);
    });
  });

  describe('evaluate()', () => {
    it('should evaluate observation with good context', async () => {
      const observation = { content: 'Continuing conversation' };
      const context = {
        conversationLength: 5,
        persistedMemories: 3,
        sessionContinued: true,
      };
      const result = await evaluator.evaluate(observation, context);
      expect(result.dimension).toBe('MEMORY');
      expect(result.score).toBeGreaterThan(60);
    });

    it('should penalize forgotten context', async () => {
      const observation = {
        forgotContext: true,
        askedAgain: true,
      };
      const result = await evaluator.evaluate(observation, {});
      expect(result.score).toBeLessThan(50);
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
      expect(result.details.retention).toBeDefined();
      expect(result.details.accuracy).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for good memory score', () => {
      expect(evaluator.passes(70)).toBe(true);
    });

    it('should fail for poor memory score', () => {
      expect(evaluator.passes(50)).toBe(false);
    });
  });
});
