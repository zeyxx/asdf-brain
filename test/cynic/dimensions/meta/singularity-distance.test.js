/**
 * Tests for lib/cynic/dimensions/meta/singularity-distance.js
 *
 * SINGULARITY_DISTANCE Dimension - How far is the singularity?
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { SingularityDistanceEvaluator } = require('../../../../lib/cynic/dimensions/meta/singularity-distance');

describe('SINGULARITY_DISTANCE Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new SingularityDistanceEvaluator();
  });

  describe('Metadata', () => {
    it('should have name SINGULARITY_DISTANCE', () => {
      expect(evaluator.name).toBe('SINGULARITY_DISTANCE');
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

    it('should have threshold of φ⁻² (38.2%)', () => {
      expect(evaluator.threshold).toBeCloseTo(38.2, 1);
    });

    it('should have question about unknowable truth', () => {
      expect(evaluator.question).toContain('unknowable');
    });
  });

  describe('evaluate()', () => {
    it('should evaluate observation for singularity distance', async () => {
      const observation = {
        complexity: 0.5,
        novelty: 0.3,
        emergentBehavior: false,
      };

      const result = await evaluator.evaluate(observation);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasoning');
      expect(typeof result.score).toBe('number');
    });

    it('should return consistent scores for same input', async () => {
      const observation = {
        complexity: 0.5,
        novelty: 0.5,
        emergentBehavior: false,
      };

      const result1 = await evaluator.evaluate(observation);
      const result2 = await evaluator.evaluate(observation);

      expect(result1.score).toBe(result2.score);
    });

    it('should provide reasoning', async () => {
      const observation = {};
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
      expect(typeof result.reasoning).toBe('string');
    });

    it('should include details in result', async () => {
      const observation = {
        complexity: 0.5,
      };
      const result = await evaluator.evaluate(observation);
      expect(result).toHaveProperty('details');
    });

    it('should handle context parameter', async () => {
      const observation = { complexity: 0.5 };
      const context = { history: [], timestamp: Date.now() };
      const result = await evaluator.evaluate(observation, context);
      expect(result).toHaveProperty('score');
    });
  });

  describe('passes()', () => {
    it('should return boolean for pass check', async () => {
      const observation = {
        complexity: 0.5,
        novelty: 0.5,
      };
      const result = await evaluator.evaluate(observation);
      const passes = evaluator.passes(result.score);
      expect(typeof passes).toBe('boolean');
    });

    it('should pass for score above φ⁻² threshold', () => {
      expect(evaluator.passes(50)).toBe(true);
      expect(evaluator.passes(70)).toBe(true);
    });

    it('should fail for score below threshold', () => {
      expect(evaluator.passes(30)).toBe(false);
      expect(evaluator.passes(20)).toBe(false);
    });
  });

  describe('Abstraction Evaluation', () => {
    it('should include abstraction in details', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.details).toHaveProperty('abstraction');
      expect(result.details.abstraction).toHaveProperty('score');
      expect(result.details.abstraction).toHaveProperty('reasons');
    });

    it('should give lower score for abstract concepts (closer to singularity)', async () => {
      const abstract = { abstract: true, theoretical: true };
      const concrete = { concrete: true, practical: true };

      const abstractResult = await evaluator.evaluate(abstract);
      const concreteResult = await evaluator.evaluate(concrete);

      expect(abstractResult.details.abstraction.score).toBeLessThan(
        concreteResult.details.abstraction.score
      );
    });

    it('should detect metaphysical content', async () => {
      const metaphysical = { metaphysical: true, philosophical: true };
      const result = await evaluator.evaluate(metaphysical);

      expect(result.details.abstraction.score).toBeLessThan(50);
      expect(result.details.abstraction.reasons.some(r => r.includes('metaphysical'))).toBe(true);
    });

    it('should reward measurable content', async () => {
      const measurable = { measurable: true, quantifiable: true };
      const result = await evaluator.evaluate(measurable);

      expect(result.details.abstraction.score).toBeGreaterThan(50);
    });

    it('should give high score for implemented code', async () => {
      const implemented = { code: true, implementation: 'function() {}' };
      const result = await evaluator.evaluate(implemented);

      expect(result.details.abstraction.score).toBeGreaterThan(60);
      expect(result.details.abstraction.reasons.some(r => r.includes('implemented'))).toBe(true);
    });
  });

  describe('Knowability Evaluation', () => {
    it('should include knowability in details', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.details).toHaveProperty('knowability');
      expect(result.details.knowability).toHaveProperty('score');
    });

    it('should reward verified knowledge', async () => {
      const verified = { verified: true, tested: true };
      const unverified = {};

      const verifiedResult = await evaluator.evaluate(verified);
      const unverifiedResult = await evaluator.evaluate(unverified);

      expect(verifiedResult.details.knowability.score).toBeGreaterThan(
        unverifiedResult.details.knowability.score
      );
    });

    it('should reward documented knowledge', async () => {
      const documented = { documented: true };
      const result = await evaluator.evaluate(documented);

      expect(result.details.knowability.score).toBeGreaterThan(50);
    });

    it('should reward reproducible results', async () => {
      const reproducible = { reproducible: true };
      const result = await evaluator.evaluate(reproducible);

      expect(result.details.knowability.score).toBeGreaterThan(50);
    });

    it('should penalize unknowable concepts', async () => {
      const unknowable = { unknowable: true, paradox: true };
      const result = await evaluator.evaluate(unknowable);

      expect(result.details.knowability.score).toBeLessThan(50);
      expect(result.details.knowability.reasons.some(r => r.includes('unknowable'))).toBe(true);
    });

    it('should penalize subjective content', async () => {
      const subjective = { subjective: true };
      const result = await evaluator.evaluate(subjective);

      expect(result.details.knowability.score).toBeLessThan(50);
    });
  });

  describe('Grounding Evaluation', () => {
    it('should include grounding in details', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.details).toHaveProperty('grounding');
      expect(result.details.grounding).toHaveProperty('score');
    });

    it('should reward real-world grounding', async () => {
      const grounded = { realWorld: true, deployed: true };
      const theoretical = { pureTheory: true };

      const groundedResult = await evaluator.evaluate(grounded);
      const theoreticalResult = await evaluator.evaluate(theoretical);

      expect(groundedResult.details.grounding.score).toBeGreaterThan(
        theoreticalResult.details.grounding.score
      );
    });

    it('should reward real usage', async () => {
      const withUsers = { users: 100, transactions: 5000 };
      const noUsers = { users: 0 };

      const withResult = await evaluator.evaluate(withUsers);
      const withoutResult = await evaluator.evaluate(noUsers);

      expect(withResult.details.grounding.score).toBeGreaterThan(
        withoutResult.details.grounding.score
      );
    });

    it('should penalize pure theory', async () => {
      const pureTheory = { pureTheory: true };
      const result = await evaluator.evaluate(pureTheory);

      expect(result.details.grounding.score).toBeLessThan(50);
      expect(result.details.grounding.reasons.some(r => r.includes('pure theory'))).toBe(true);
    });
  });

  describe('Distance Calculation', () => {
    it('should include distance in details', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.details).toHaveProperty('distance');
      expect(result.details.distance).toHaveProperty('world');
      expect(result.details.distance).toHaveProperty('value');
    });

    it('should map very abstract to SINGULARITY/ATZILUT', async () => {
      const veryAbstract = {
        abstract: true,
        metaphysical: true,
        unknowable: true,
        pureTheory: true,
      };
      const result = await evaluator.evaluate(veryAbstract);

      expect(['SINGULARITY', 'ATZILUT']).toContain(result.details.distance.world);
    });

    it('should map concrete/deployed to YETZIRAH/ASSIAH', async () => {
      const concrete = {
        concrete: true,
        measurable: true,
        verified: true,
        realWorld: true,
        deployed: true,
        code: true,
      };
      const result = await evaluator.evaluate(concrete);

      expect(['YETZIRAH', 'ASSIAH']).toContain(result.details.distance.world);
    });

    it('should have φ-scaled distance values', async () => {
      const PHI = 1.618033988749895;
      const PHI_INV = 0.618033988749895;

      // ATZILUT should have φ⁻¹ distance
      expect(evaluator.DISTANCES.ATZILUT).toBeCloseTo(PHI_INV, 5);

      // YETZIRAH should have φ distance
      expect(evaluator.DISTANCES.YETZIRAH).toBeCloseTo(PHI, 5);

      // ASSIAH should have φ² distance
      expect(evaluator.DISTANCES.ASSIAH).toBeCloseTo(PHI * PHI, 5);
    });

    it('should warn when too close to singularity', async () => {
      const tooAbstract = {
        abstract: true,
        metaphysical: true,
        unknowable: true,
        pureTheory: true,
        subjective: true,
      };
      const result = await evaluator.evaluate(tooAbstract);

      // If score is very low, should be SINGULARITY with warning
      if (result.details.distance.world === 'SINGULARITY') {
        expect(result.details.distance.warning).toBeDefined();
        expect(result.details.distance.warning).toContain('abstract');
      }
    });
  });

  describe('Kabbalah World Mapping', () => {
    it('should have all four worlds defined', () => {
      expect(evaluator.DISTANCES).toHaveProperty('ATZILUT');
      expect(evaluator.DISTANCES).toHaveProperty('BERIAH');
      expect(evaluator.DISTANCES).toHaveProperty('YETZIRAH');
      expect(evaluator.DISTANCES).toHaveProperty('ASSIAH');
    });

    it('should include world in reasoning', async () => {
      const observation = { concrete: true };
      const result = await evaluator.evaluate(observation);

      expect(result.reasoning).toMatch(/World:/);
    });

    it('should correctly order worlds by distance', () => {
      const distances = evaluator.DISTANCES;

      expect(distances.SINGULARITY).toBeLessThan(distances.ATZILUT);
      expect(distances.ATZILUT).toBeLessThan(distances.BERIAH);
      expect(distances.BERIAH).toBeLessThan(distances.YETZIRAH);
      expect(distances.YETZIRAH).toBeLessThan(distances.ASSIAH);
    });
  });

  describe('Overall Score Behavior', () => {
    it('should give higher score for more knowable content', async () => {
      const highlyKnowable = {
        concrete: true,
        verified: true,
        documented: true,
        reproducible: true,
        realWorld: true,
        code: true,
      };
      const unknowable = {
        abstract: true,
        unknowable: true,
        pureTheory: true,
      };

      const knowableResult = await evaluator.evaluate(highlyKnowable);
      const unknowableResult = await evaluator.evaluate(unknowable);

      expect(knowableResult.score).toBeGreaterThan(unknowableResult.score);
    });

    it('should handle empty observation gracefully', async () => {
      const result = await evaluator.evaluate({});

      expect(result.score).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle mixed signals', async () => {
      const mixed = {
        abstract: true,    // Closer
        verified: true,    // Farther
        pureTheory: true,  // Closer
        deployed: true,    // Farther
      };
      const result = await evaluator.evaluate(mixed);

      // Should be somewhere in the middle
      expect(result.score).toBeGreaterThan(20);
      expect(result.score).toBeLessThan(80);
    });
  });
});
