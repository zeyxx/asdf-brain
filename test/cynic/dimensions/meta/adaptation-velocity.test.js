/**
 * Tests for lib/cynic/dimensions/meta/adaptation-velocity.js
 *
 * ADAPTATION_VELOCITY Dimension - How quickly can this adapt to feedback?
 * World: ASSIAH (Action)
 * Axiom: BURN
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { AdaptationVelocityEvaluator } = require('../../../../lib/cynic/dimensions/meta/adaptation-velocity');

describe('ADAPTATION_VELOCITY Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new AdaptationVelocityEvaluator();
  });

  describe('Metadata', () => {
    it('should have name ADAPTATION_VELOCITY', () => {
      expect(evaluator.name).toBe('ADAPTATION_VELOCITY');
    });

    it('should be META category', () => {
      expect(evaluator.category).toBe('META');
    });

    it('should belong to ASSIAH world (operational)', () => {
      expect(evaluator.world).toBe('ASSIAH');
    });

    it('should have BURN axiom', () => {
      expect(evaluator.axiom).toBe('BURN');
    });

    it('should have threshold of phi^-2 (38.2%)', () => {
      expect(evaluator.threshold).toBeCloseTo(38.2, 1);
    });

    it('should have question about feedback adaptation', () => {
      expect(evaluator.question).toContain('feedback');
    });

    it('should have velocity levels defined', () => {
      expect(evaluator.VELOCITY_LEVELS).toBeDefined();
      expect(evaluator.VELOCITY_LEVELS.STATIC).toBe(0);
      expect(evaluator.VELOCITY_LEVELS.INSTANT).toBe(100);
    });
  });

  describe('evaluate()', () => {
    it('should return valid result structure', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);

      expect(result).toHaveProperty('dimension', 'ADAPTATION_VELOCITY');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('details');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should reward systems with feedback loops', async () => {
      const withFeedback = { hasFeedbackLoop: true, automaticFeedback: true };
      const withoutFeedback = { hasFeedbackLoop: false };

      const resultWith = await evaluator.evaluate(withFeedback);
      const resultWithout = await evaluator.evaluate(withoutFeedback);

      expect(resultWith.score).toBeGreaterThan(resultWithout.score);
    });

    it('should reward self-correcting systems', async () => {
      const selfCorrecting = { selfCorrecting: true, errorLearning: true };
      const manual = { requiresManualFix: true };

      const resultAuto = await evaluator.evaluate(selfCorrecting);
      const resultManual = await evaluator.evaluate(manual);

      expect(resultAuto.score).toBeGreaterThan(resultManual.score);
    });

    it('should reward real-time integration', async () => {
      const realTime = { realTime: true, streaming: true };
      const scheduled = { scheduledOnly: true, manualDeploy: true };

      const resultRealTime = await evaluator.evaluate(realTime);
      const resultScheduled = await evaluator.evaluate(scheduled);

      expect(resultRealTime.score).toBeGreaterThan(resultScheduled.score);
    });

    it('should penalize hardcoded/static systems', async () => {
      const static_ = { hardcoded: true, static: true };
      const dynamic = { hasFeedbackLoop: true };

      const resultStatic = await evaluator.evaluate(static_);
      const resultDynamic = await evaluator.evaluate(dynamic);

      expect(resultStatic.score).toBeLessThan(resultDynamic.score);
    });

    it('should include velocity classification in details', async () => {
      const observation = { hasFeedbackLoop: true };
      const result = await evaluator.evaluate(observation);

      expect(result.details).toHaveProperty('velocity');
      expect(result.details.velocity).toHaveProperty('level');
      expect(result.details.velocity).toHaveProperty('description');
    });

    it('should handle context with adaptation time', async () => {
      const observation = { hasFeedbackLoop: true };
      const fastContext = {
        previousFeedback: true,
        adaptationTime: 30 * 60 * 1000, // 30 minutes
      };
      const slowContext = {
        previousFeedback: true,
        adaptationTime: 200 * 60 * 60 * 1000, // 200 hours
      };

      const fastResult = await evaluator.evaluate(observation, fastContext);
      const slowResult = await evaluator.evaluate(observation, slowContext);

      expect(fastResult.score).toBeGreaterThan(slowResult.score);
    });

    it('should return consistent scores for same input', async () => {
      const observation = { hasFeedbackLoop: true, selfCorrecting: true };

      const result1 = await evaluator.evaluate(observation);
      const result2 = await evaluator.evaluate(observation);

      expect(result1.score).toBe(result2.score);
    });
  });

  describe('Velocity Classification', () => {
    it('should classify high scores as AGILE', async () => {
      const observation = {
        hasFeedbackLoop: true,
        automaticFeedback: true,
        selfCorrecting: true,
        errorLearning: true,
        realTime: true,
        streaming: true,
        continuousLearning: true,
      };

      const result = await evaluator.evaluate(observation);
      expect(result.details.velocity.level).toBe('AGILE');
    });

    it('should classify static systems correctly', async () => {
      const observation = {
        hardcoded: true,
        static: true,
        requiresManualFix: true,
        batchOnly: true,
        scheduledOnly: true,
        manualDeploy: true,
      };

      const result = await evaluator.evaluate(observation);
      expect(['STATIC', 'GLACIAL']).toContain(result.details.velocity.level);
    });
  });

  describe('passes()', () => {
    it('should pass for score above threshold', () => {
      expect(evaluator.passes(50)).toBe(true);
      expect(evaluator.passes(61.8)).toBe(true);
    });

    it('should fail for score below threshold', () => {
      expect(evaluator.passes(30)).toBe(false);
      expect(evaluator.passes(20)).toBe(false);
    });

    it('should pass at exactly threshold', () => {
      expect(evaluator.passes(38.2)).toBe(true);
    });
  });
});
