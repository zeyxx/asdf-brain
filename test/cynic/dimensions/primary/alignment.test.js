/**
 * Tests for lib/cynic/dimensions/primary/alignment.js
 *
 * ALIGNMENT Dimension - "L'action suit-elle les 4 axiomes?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { AlignmentEvaluator } = require('../../../../lib/cynic/dimensions/primary/alignment');

describe('ALIGNMENT Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new AlignmentEvaluator();
  });

  describe('Metadata', () => {
    it('should have name ALIGNMENT', () => {
      expect(evaluator.name).toBe('ALIGNMENT');
    });

    it('should be PRIMARY category', () => {
      expect(evaluator.category).toBe('PRIMARY');
    });

    it('should belong to ASSIAH world', () => {
      expect(evaluator.world).toBe('ASSIAH');
    });

    it('should have BURN axiom', () => {
      expect(evaluator.axiom).toBe('BURN');
    });
  });

  describe('evaluate()', () => {
    it('should give high score for burning action', async () => {
      const observation = {
        burns: true,
        improves: true,
        action: 'burn',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('ALIGNMENT');
      expect(result.score).toBeGreaterThan(60);
    });

    it('should penalize extraction', async () => {
      const observation = {
        extracts: true,
        takes: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeLessThan(60);
    });

    it('should detect building action', async () => {
      const observation = {
        builds: true,
        contributes: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should provide reasoning', async () => {
      const observation = { action: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for aligned action', () => {
      expect(evaluator.passes(75)).toBe(true);
    });

    it('should fail for misaligned action', () => {
      expect(evaluator.passes(40)).toBe(false);
    });
  });

  describe('Four Axioms Evaluation', () => {
    it('should include axioms in details', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.details).toHaveProperty('axioms');
      expect(result.details.axioms).toHaveProperty('axiomScores');
      expect(result.details.axioms).toHaveProperty('summary');
    });

    it('should reward PHI alignment', async () => {
      const phiAligned = { phiAligned: true, harmonious: true, balanced: true };
      const chaotic = { chaotic: true, unbalanced: true };

      const alignedResult = await evaluator.evaluate(phiAligned);
      const chaoticResult = await evaluator.evaluate(chaotic);

      expect(alignedResult.details.axioms.axiomScores.PHI).toBeGreaterThan(
        chaoticResult.details.axioms.axiomScores.PHI
      );
    });

    it('should reward VERIFY alignment', async () => {
      const verified = { verified: true, transparent: true, auditable: true };
      const opaque = { opaque: true, unverifiable: true };

      const verifiedResult = await evaluator.evaluate(verified);
      const opaqueResult = await evaluator.evaluate(opaque);

      expect(verifiedResult.details.axioms.axiomScores.VERIFY).toBeGreaterThan(
        opaqueResult.details.axioms.axiomScores.VERIFY
      );
    });

    it('should reward CULTURE alignment', async () => {
      const cultural = { cultureAligned: true, communityDriven: true, memeticValue: true };
      const antiCommunity = { antiCommunity: true, extractive: true };

      const culturalResult = await evaluator.evaluate(cultural);
      const antiResult = await evaluator.evaluate(antiCommunity);

      expect(culturalResult.details.axioms.axiomScores.CULTURE).toBeGreaterThan(
        antiResult.details.axioms.axiomScores.CULTURE
      );
    });

    it('should reward BURN alignment', async () => {
      const burning = { burns: true, deflationary: true, contributes: true };
      const extracting = { extracts: true, rentSeeking: true };

      const burnResult = await evaluator.evaluate(burning);
      const extractResult = await evaluator.evaluate(extracting);

      expect(burnResult.details.axioms.axiomScores.BURN).toBeGreaterThan(
        extractResult.details.axioms.axiomScores.BURN
      );
    });

    it('should count aligned and violated axioms', async () => {
      const fullyAligned = {
        phiAligned: true,
        verified: true,
        cultureAligned: true,
        burns: true,
      };

      const result = await evaluator.evaluate(fullyAligned);

      expect(result.details.axioms.summary.total).toBe(4);
      expect(result.details.axioms.summary.aligned).toBeGreaterThanOrEqual(3);
    });

    it('should give higher overall score for axiom-aligned observations', async () => {
      const aligned = {
        phiAligned: true,
        verified: true,
        cultureAligned: true,
        burns: true,
      };
      const misaligned = {
        chaotic: true,
        opaque: true,
        antiCommunity: true,
        extracts: true,
      };

      const alignedResult = await evaluator.evaluate(aligned);
      const misalignedResult = await evaluator.evaluate(misaligned);

      expect(alignedResult.score).toBeGreaterThan(misalignedResult.score);
    });

    it('should include axiom info in reasoning when violated', async () => {
      const violated = {
        chaotic: true,
        opaque: true,
        extracts: true,
      };

      const result = await evaluator.evaluate(violated);
      expect(result.reasoning).toContain('axiom');
    });
  });
});
