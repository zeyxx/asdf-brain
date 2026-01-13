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

  describe('Growth Mindset Evaluation', () => {
    it('should include growthMindset in details', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.details).toHaveProperty('growthMindset');
      expect(result.details.growthMindset).toHaveProperty('traitScores');
      expect(result.details.growthMindset).toHaveProperty('summary');
    });

    it('should track all 4 growth mindset traits', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      const traits = result.details.growthMindset.traitScores;

      expect(traits).toHaveProperty('LEARNING');
      expect(traits).toHaveProperty('ITERATION');
      expect(traits).toHaveProperty('RESILIENCE');
      expect(traits).toHaveProperty('ADAPTABILITY');
    });

    it('should reward learning-oriented observation', async () => {
      const learner = { learns: true, curious: true, feedback: true };
      const closedMind = { closedMinded: true, knowItAll: true };

      const learnResult = await evaluator.evaluate(learner);
      const closedResult = await evaluator.evaluate(closedMind);

      expect(learnResult.details.growthMindset.traitScores.LEARNING).toBeGreaterThan(
        closedResult.details.growthMindset.traitScores.LEARNING
      );
    });

    it('should reward iteration-oriented observation', async () => {
      const iterates = { iterates: true, experiment: true, mvp: true };
      const perfectionist = { perfectionist: true, allOrNothing: true };

      const iterResult = await evaluator.evaluate(iterates);
      const perfResult = await evaluator.evaluate(perfectionist);

      expect(iterResult.details.growthMindset.traitScores.ITERATION).toBeGreaterThan(
        perfResult.details.growthMindset.traitScores.ITERATION
      );
    });

    it('should reward resilient observation', async () => {
      const resilient = { resilient: true, grit: true, failedBefore: true, tryingAgain: true };
      const quitter = { givesUp: true, quits: true };

      const resResult = await evaluator.evaluate(resilient);
      const quitResult = await evaluator.evaluate(quitter);

      expect(resResult.details.growthMindset.traitScores.RESILIENCE).toBeGreaterThan(
        quitResult.details.growthMindset.traitScores.RESILIENCE
      );
    });

    it('should reward adaptable observation', async () => {
      const adaptable = { adapts: true, pivoted: true, agile: true };
      const rigid = { rigid: true, unchanging: true };

      const adaptResult = await evaluator.evaluate(adaptable);
      const rigidResult = await evaluator.evaluate(rigid);

      expect(adaptResult.details.growthMindset.traitScores.ADAPTABILITY).toBeGreaterThan(
        rigidResult.details.growthMindset.traitScores.ADAPTABILITY
      );
    });

    it('should classify mindset as GROWTH, FIXED, or MIXED', async () => {
      const growthMindset = {
        learns: true,
        curious: true,
        iterates: true,
        experiment: true,
        resilient: true,
        adapts: true,
      };

      const result = await evaluator.evaluate(growthMindset);

      expect(result.details.growthMindset.summary).toHaveProperty('mindset');
      expect(['GROWTH', 'FIXED', 'MIXED']).toContain(result.details.growthMindset.summary.mindset);
    });

    it('should count growth vs fixed traits', async () => {
      const observation = { learns: true, curious: true };
      const result = await evaluator.evaluate(observation);

      expect(result.details.growthMindset.summary).toHaveProperty('growth');
      expect(result.details.growthMindset.summary).toHaveProperty('fixed');
      expect(result.details.growthMindset.summary).toHaveProperty('total');
      expect(result.details.growthMindset.summary.total).toBe(4);
    });

    it('should give higher overall score with growth mindset', async () => {
      const growth = {
        learns: true,
        curious: true,
        iterates: true,
        experiment: true,
        resilient: true,
        grit: true,
        adapts: true,
        agile: true,
      };
      const fixed = {
        closedMinded: true,
        perfectionist: true,
        givesUp: true,
        rigid: true,
      };

      const growthResult = await evaluator.evaluate(growth);
      const fixedResult = await evaluator.evaluate(fixed);

      expect(growthResult.score).toBeGreaterThan(fixedResult.score);
    });

    it('should detect text-based growth indicators', async () => {
      const observation = { content: 'we learn from failures, iterate quickly, and adapt to change' };
      const result = await evaluator.evaluate(observation);

      expect(result.details.growthMindset.traitScores.LEARNING).toBeGreaterThan(50);
      expect(result.details.growthMindset.traitScores.ITERATION).toBeGreaterThan(50);
      expect(result.details.growthMindset.traitScores.ADAPTABILITY).toBeGreaterThan(50);
    });

    it('should include growth mindset info in reasoning when GROWTH', async () => {
      const growth = {
        learns: true,
        curious: true,
        iterates: true,
        experiment: true,
        resilient: true,
        adapts: true,
      };

      const result = await evaluator.evaluate(growth);

      if (result.details.growthMindset.summary.mindset === 'GROWTH') {
        expect(result.reasoning).toContain('growth mindset');
      }
    });

    it('should warn about fixed mindset in reasoning', async () => {
      const fixed = {
        closedMinded: true,
        perfectionist: true,
        givesUp: true,
        rigid: true,
      };

      const result = await evaluator.evaluate(fixed);

      if (result.details.growthMindset.summary.mindset === 'FIXED') {
        expect(result.reasoning).toContain('fixed mindset');
      }
    });
  });
});
