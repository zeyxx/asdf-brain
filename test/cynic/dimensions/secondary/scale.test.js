/**
 * Tests for lib/cynic/dimensions/secondary/scale.js
 *
 * SCALE Dimension - "Does it scale?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { ScaleEvaluator } = require('../../../../lib/cynic/dimensions/secondary/scale');

describe('SCALE Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new ScaleEvaluator();
  });

  describe('Metadata', () => {
    it('should have name SCALE', () => {
      expect(evaluator.name).toBe('SCALE');
    });

    it('should be SECONDARY category', () => {
      expect(evaluator.category).toBe('SECONDARY');
    });

    it('should belong to ASSIAH world', () => {
      expect(evaluator.world).toBe('ASSIAH');
    });

    it('should have BURN axiom', () => {
      expect(evaluator.axiom).toBe('BURN');
    });
  });

  describe('evaluate()', () => {
    it('should give high score for scalable observation', async () => {
      const observation = {
        scalable: true,
        distributed: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('SCALE');
      expect(result.score).toBeGreaterThan(40);
    });

    it('should penalize non-scalable approaches', async () => {
      const observation = {
        centralized: true,
        bottleneck: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeLessThan(80);
    });

    it('should provide reasoning', async () => {
      const observation = { data: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for scalable score', () => {
      expect(evaluator.passes(70)).toBe(true);
    });

    it('should fail for non-scalable score', () => {
      expect(evaluator.passes(40)).toBe(false);
    });
  });

  describe('Scale Transition Recognition', () => {
    it('should reduce penalty for systems in transition', async () => {
      const staticCentralized = {
        singleNode: true,
        centralized: true,
      };
      const transitioningCentralized = {
        singleNode: true,
        transitionPhase: true,
        roadmapToScale: { phases: ['single', 'multi-region'] },
      };

      const staticResult = await evaluator.evaluate(staticCentralized);
      const transitionResult = await evaluator.evaluate(transitioningCentralized);

      expect(transitionResult.score).toBeGreaterThan(staticResult.score);
    });

    it('should give bonus for roadmapToScale', async () => {
      const withRoadmap = {
        roadmapToScale: { phases: ['phase1', 'phase2'] },
      };
      const withoutRoadmap = {};

      const withResult = await evaluator.evaluate(withRoadmap);
      const withoutResult = await evaluator.evaluate(withoutRoadmap);

      expect(withResult.score).toBeGreaterThan(withoutResult.score);
    });

    it('should give bonus for event-driven architecture', async () => {
      const eventDriven = { eventDriven: true };
      const basic = {};

      const eventResult = await evaluator.evaluate(eventDriven);
      const basicResult = await evaluator.evaluate(basic);

      expect(eventResult.score).toBeGreaterThan(basicResult.score);
    });

    it('should give bonus for prepared-for-scale', async () => {
      const prepared = { preparedForScale: true, scaleReady: true };
      const unprepared = {};

      const prepResult = await evaluator.evaluate(prepared);
      const unprepResult = await evaluator.evaluate(unprepared);

      expect(prepResult.score).toBeGreaterThan(unprepResult.score);
    });

    it('should recognize migration in progress', async () => {
      const migrating = {
        singleNode: true,
        migrationInProgress: true,
      };

      const result = await evaluator.evaluate(migrating);
      // Check that at least one reason mentions transitioning
      const hasTransition = result.details.scalability.reasons.some(r =>
        r.includes('transitioning')
      );
      expect(hasTransition).toBe(true);
    });
  });
});
