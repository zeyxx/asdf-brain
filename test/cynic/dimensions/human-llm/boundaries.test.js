/**
 * Tests for lib/cynic/dimensions/human-llm/boundaries.js
 */

import { describe, it, expect, beforeEach } from 'vitest';

const evaluatorModule = require('../../../../lib/cynic/dimensions/human-llm/boundaries');
const EvaluatorClass = Object.values(evaluatorModule).find(v => typeof v === 'function');

describe('BOUNDARIES Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new EvaluatorClass();
  });

  describe('Metadata', () => {
    it('should have correct name', () => {
      expect(evaluator.name).toBe('BOUNDARIES');
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
      expect(result.dimension).toBe('BOUNDARIES');
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

  describe('LLM Action Boundaries', () => {
    it('should include llmActions in details', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation, {});
      expect(result.details).toHaveProperty('llmActions');
      expect(result.details.llmActions).toHaveProperty('score');
      expect(result.details.llmActions).toHaveProperty('reasons');
    });

    it('should reward tool usage limits', async () => {
      const withLimits = {
        toolUsageLimits: { maxCallsPerMinute: 10 },
        requiresToolApproval: true,
      };
      const withoutLimits = {};

      const withResult = await evaluator.evaluate(withLimits, {});
      const withoutResult = await evaluator.evaluate(withoutLimits, {});

      expect(withResult.score).toBeGreaterThan(withoutResult.score);
    });

    it('should reward sandboxed execution', async () => {
      const sandboxed = { sandboxed: true, codeExecutionLimits: { timeout: 5000 } };
      const unsandboxed = {};

      const sandboxResult = await evaluator.evaluate(sandboxed, {});
      const unsandboxResult = await evaluator.evaluate(unsandboxed, {});

      expect(sandboxResult.score).toBeGreaterThan(unsandboxResult.score);
    });

    it('should reward permission system', async () => {
      const withPermissions = {
        hasPermissionSystem: true,
        requiresConfirmation: true,
      };
      const noPermissions = {};

      const withResult = await evaluator.evaluate(withPermissions, {});
      const withoutResult = await evaluator.evaluate(noPermissions, {});

      expect(withResult.score).toBeGreaterThan(withoutResult.score);
    });

    it('should penalize unrestricted access', async () => {
      const restricted = { sandboxed: true, toolsWhitelisted: true };
      const unrestricted = { unrestrictedAccess: true, noToolLimits: true };

      const restrictedResult = await evaluator.evaluate(restricted, {});
      const unrestrictedResult = await evaluator.evaluate(unrestricted, {});

      expect(restrictedResult.score).toBeGreaterThan(unrestrictedResult.score);
    });

    it('should penalize arbitrary execution without sandbox', async () => {
      const safe = { canExecuteArbitrary: true, sandboxed: true };
      const unsafe = { canExecuteArbitrary: true, sandboxed: false };

      const safeResult = await evaluator.evaluate(safe, {});
      const unsafeResult = await evaluator.evaluate(unsafe, {});

      expect(safeResult.score).toBeGreaterThan(unsafeResult.score);
    });

    it('should reward protected paths definition', async () => {
      const withProtected = {
        protectedPaths: ['/etc', '/root', '~/.ssh'],
        fileModificationLimits: { maxFiles: 10 },
      };
      const withoutProtected = {};

      const withResult = await evaluator.evaluate(withProtected, {});
      const withoutResult = await evaluator.evaluate(withoutProtected, {});

      expect(withResult.score).toBeGreaterThan(withoutResult.score);
    });

    it('should reward API whitelist', async () => {
      const withWhitelist = {
        apiWhitelist: ['api.helius.xyz', 'api.github.com'],
        networkRestricted: true,
      };
      const noWhitelist = {};

      const withResult = await evaluator.evaluate(withWhitelist, {});
      const withoutResult = await evaluator.evaluate(noWhitelist, {});

      expect(withResult.score).toBeGreaterThan(withoutResult.score);
    });

    it('should include limits in details when defined', async () => {
      const withLimits = {
        toolUsageLimits: { maxCalls: 100 },
        protectedPaths: ['/secret'],
        apiWhitelist: ['safe.api.com'],
      };

      const result = await evaluator.evaluate(withLimits, {});

      expect(result.details.llmActions.limits).toBeDefined();
      expect(result.details.llmActions.limits.tools).toEqual({ maxCalls: 100 });
      expect(result.details.llmActions.limits.protectedPaths).toEqual(['/secret']);
      expect(result.details.llmActions.limits.apiWhitelist).toEqual(['safe.api.com']);
    });
  });
});
