/**
 * Tests for lib/cynic/dimensions/secondary/enable.js
 *
 * ENABLE Dimension - "Does it enable others?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { EnableEvaluator } = require('../../../../lib/cynic/dimensions/secondary/enable');

describe('ENABLE Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new EnableEvaluator();
  });

  describe('Metadata', () => {
    it('should have name ENABLE', () => {
      expect(evaluator.name).toBe('ENABLE');
    });

    it('should be SECONDARY category', () => {
      expect(evaluator.category).toBe('SECONDARY');
    });

    it('should belong to YETZIRAH world', () => {
      expect(evaluator.world).toBe('YETZIRAH');
    });

    it('should have CULTURE axiom', () => {
      expect(evaluator.axiom).toBe('CULTURE');
    });
  });

  describe('evaluate()', () => {
    it('should give high score for enabling observation', async () => {
      const observation = {
        enables: true,
        empowers: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('ENABLE');
      expect(result.score).toBeGreaterThan(40);
    });

    it('should penalize blocking behavior', async () => {
      const observation = {
        blocks: true,
        restricts: true,
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
    it('should pass for enabling score', () => {
      expect(evaluator.passes(70)).toBe(true);
    });

    it('should fail for blocking score', () => {
      expect(evaluator.passes(40)).toBe(false);
    });
  });

  describe('Capability Matrix Evaluation', () => {
    it('should include capabilityMatrix in details', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.details).toHaveProperty('capabilityMatrix');
      expect(result.details.capabilityMatrix).toHaveProperty('capabilityScores');
      expect(result.details.capabilityMatrix).toHaveProperty('summary');
    });

    it('should track all 6 capabilities', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      const caps = result.details.capabilityMatrix.capabilityScores;

      expect(caps).toHaveProperty('EDUCATION');
      expect(caps).toHaveProperty('CREATION');
      expect(caps).toHaveProperty('DECISION');
      expect(caps).toHaveProperty('AUTOMATION');
      expect(caps).toHaveProperty('COLLABORATION');
      expect(caps).toHaveProperty('OWNERSHIP');
    });

    it('should reward educational observation', async () => {
      const educational = { teaches: true, documentation: true, tutorial: true };
      const obscure = { obscure: true, blackbox: true };

      const eduResult = await evaluator.evaluate(educational);
      const obscResult = await evaluator.evaluate(obscure);

      expect(eduResult.details.capabilityMatrix.capabilityScores.EDUCATION).toBeGreaterThan(
        obscResult.details.capabilityMatrix.capabilityScores.EDUCATION
      );
    });

    it('should reward creative tools', async () => {
      const creative = { creativeTools: true, templates: true, scaffolding: true };
      const automated = { generatesForYou: true };

      const createResult = await evaluator.evaluate(creative);
      const autoResult = await evaluator.evaluate(automated);

      expect(createResult.details.capabilityMatrix.capabilityScores.CREATION).toBeGreaterThan(
        autoResult.details.capabilityMatrix.capabilityScores.CREATION
      );
    });

    it('should reward decision support', async () => {
      const support = { informsDecision: true, transparent: true, explainable: true };
      const autoDecide = { decidesForYou: true, autoDecision: true };

      const supportResult = await evaluator.evaluate(support);
      const autoResult = await evaluator.evaluate(autoDecide);

      expect(supportResult.details.capabilityMatrix.capabilityScores.DECISION).toBeGreaterThan(
        autoResult.details.capabilityMatrix.capabilityScores.DECISION
      );
    });

    it('should reward human-in-loop automation', async () => {
      const humanLoop = { automatesRepetitive: true, humanInLoop: true, reviewStep: true };
      const fullyAuto = { fullyAutonomous: true };

      const humanResult = await evaluator.evaluate(humanLoop);
      const autoResult = await evaluator.evaluate(fullyAuto);

      expect(humanResult.details.capabilityMatrix.capabilityScores.AUTOMATION).toBeGreaterThan(
        autoResult.details.capabilityMatrix.capabilityScores.AUTOMATION
      );
    });

    it('should reward collaborative tools', async () => {
      const collab = { collaborative: true, teamwork: true, multiplayer: true };
      const isolated = { isolated: true, silos: true };

      const collabResult = await evaluator.evaluate(collab);
      const isoResult = await evaluator.evaluate(isolated);

      expect(collabResult.details.capabilityMatrix.capabilityScores.COLLABORATION).toBeGreaterThan(
        isoResult.details.capabilityMatrix.capabilityScores.COLLABORATION
      );
    });

    it('should reward user ownership', async () => {
      const owned = { userOwned: true, exportable: true, localFirst: true };
      const locked = { cloudOnly: true, noExport: true };

      const ownedResult = await evaluator.evaluate(owned);
      const lockedResult = await evaluator.evaluate(locked);

      expect(ownedResult.details.capabilityMatrix.capabilityScores.OWNERSHIP).toBeGreaterThan(
        lockedResult.details.capabilityMatrix.capabilityScores.OWNERSHIP
      );
    });

    it('should classify verdict as ENABLING, DIMINISHING, or NEUTRAL', async () => {
      const enabling = {
        teaches: true,
        creativeTools: true,
        informsDecision: true,
        humanInLoop: true,
        collaborative: true,
        userOwned: true,
      };

      const result = await evaluator.evaluate(enabling);

      expect(result.details.capabilityMatrix.summary).toHaveProperty('verdict');
      expect(['ENABLING', 'DIMINISHING', 'NEUTRAL']).toContain(
        result.details.capabilityMatrix.summary.verdict
      );
    });

    it('should count enabled vs diminished capabilities', async () => {
      const observation = { teaches: true, userOwned: true };
      const result = await evaluator.evaluate(observation);

      expect(result.details.capabilityMatrix.summary).toHaveProperty('enabled');
      expect(result.details.capabilityMatrix.summary).toHaveProperty('diminished');
      expect(result.details.capabilityMatrix.summary).toHaveProperty('total');
      expect(result.details.capabilityMatrix.summary.total).toBe(6);
    });

    it('should give higher overall score with enabling capabilities', async () => {
      const enabling = {
        teaches: true,
        creativeTools: true,
        informsDecision: true,
        humanInLoop: true,
        collaborative: true,
        userOwned: true,
      };
      const diminishing = {
        obscure: true,
        decidesForYou: true,
        fullyAutonomous: true,
        isolated: true,
        cloudOnly: true,
      };

      const enableResult = await evaluator.evaluate(enabling);
      const diminishResult = await evaluator.evaluate(diminishing);

      expect(enableResult.score).toBeGreaterThan(diminishResult.score);
    });

    it('should detect text-based capability indicators', async () => {
      const observation = { content: 'learn and create together, share with your team' };
      const result = await evaluator.evaluate(observation);

      expect(result.details.capabilityMatrix.capabilityScores.EDUCATION).toBeGreaterThan(50);
      expect(result.details.capabilityMatrix.capabilityScores.CREATION).toBeGreaterThan(50);
      expect(result.details.capabilityMatrix.capabilityScores.COLLABORATION).toBeGreaterThan(50);
    });

    it('should include capability info in reasoning when ENABLING', async () => {
      const enabling = {
        teaches: true,
        creativeTools: true,
        informsDecision: true,
        humanInLoop: true,
        collaborative: true,
        userOwned: true,
      };

      const result = await evaluator.evaluate(enabling);

      if (result.details.capabilityMatrix.summary.verdict === 'ENABLING') {
        expect(result.reasoning).toContain('capabilities enabled');
      }
    });

    it('should warn about diminished capabilities in reasoning', async () => {
      const diminishing = {
        obscure: true,
        decidesForYou: true,
        fullyAutonomous: true,
        isolated: true,
        cloudOnly: true,
      };

      const result = await evaluator.evaluate(diminishing);

      if (result.details.capabilityMatrix.summary.verdict === 'DIMINISHING') {
        expect(result.reasoning).toContain('diminished');
      }
    });
  });
});
