/**
 * Tests for lib/cynic/dimensions/primary/ethics.js
 *
 * ETHICS Dimension - "La culture est-elle respectée?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { EthicsEvaluator } = require('../../../../lib/cynic/dimensions/primary/ethics');

describe('ETHICS Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new EthicsEvaluator();
  });

  describe('Metadata', () => {
    it('should have name ETHICS', () => {
      expect(evaluator.name).toBe('ETHICS');
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
    it('should give high score for ethical content', async () => {
      const observation = {
        content: 'Building a community that helps everyone',
        intent: 'positive',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('ETHICS');
      expect(result.score).toBeGreaterThan(50);
    });

    it('should penalize harmful content', async () => {
      const observation = {
        content: 'scam exploit rug pull',
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeLessThan(70);
    });

    it('should detect positive indicators', async () => {
      const observation = {
        content: 'open source community contribution',
        tags: ['opensource', 'contribution'],
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should provide reasoning', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for ethical score', () => {
      expect(evaluator.passes(80)).toBe(true);
    });

    it('should fail for unethical score', () => {
      expect(evaluator.passes(60)).toBe(false);
    });
  });

  describe('Cypherpunk Values Checklist', () => {
    it('should include cypherpunkValues in details', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.details).toHaveProperty('cypherpunkValues');
      expect(result.details.cypherpunkValues).toHaveProperty('valueScores');
      expect(result.details.cypherpunkValues).toHaveProperty('summary');
    });

    it('should track all 6 cypherpunk values', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      const values = result.details.cypherpunkValues.valueScores;

      expect(values).toHaveProperty('PRIVACY');
      expect(values).toHaveProperty('DECENTRALIZATION');
      expect(values).toHaveProperty('OPEN_SOURCE');
      expect(values).toHaveProperty('SELF_CUSTODY');
      expect(values).toHaveProperty('PERMISSIONLESS');
      expect(values).toHaveProperty('NO_EXTRACTION');
    });

    it('should reward privacy-preserving observation', async () => {
      const privacyAligned = { privacy: true, encrypted: true, zeroKnowledge: true };
      const surveillanceMode = { tracking: true, surveillance: true };

      const privacyResult = await evaluator.evaluate(privacyAligned);
      const survResult = await evaluator.evaluate(surveillanceMode);

      expect(privacyResult.details.cypherpunkValues.valueScores.PRIVACY).toBeGreaterThan(
        survResult.details.cypherpunkValues.valueScores.PRIVACY
      );
    });

    it('should reward decentralized observation', async () => {
      const decentral = { decentralized: true, p2p: true };
      const central = { centralized: true, singlePointOfFailure: true };

      const decResult = await evaluator.evaluate(decentral);
      const cenResult = await evaluator.evaluate(central);

      expect(decResult.details.cypherpunkValues.valueScores.DECENTRALIZATION).toBeGreaterThan(
        cenResult.details.cypherpunkValues.valueScores.DECENTRALIZATION
      );
    });

    it('should reward open source observation', async () => {
      const openSrc = { openSource: true, auditable: true };
      const closedSrc = { closedSource: true, proprietary: true };

      const openResult = await evaluator.evaluate(openSrc);
      const closedResult = await evaluator.evaluate(closedSrc);

      expect(openResult.details.cypherpunkValues.valueScores.OPEN_SOURCE).toBeGreaterThan(
        closedResult.details.cypherpunkValues.valueScores.OPEN_SOURCE
      );
    });

    it('should reward self-custody', async () => {
      const selfCust = { selfCustody: true, nonCustodial: true };
      const custodial = { custodial: true, thirdPartyCustody: true };

      const selfResult = await evaluator.evaluate(selfCust);
      const custResult = await evaluator.evaluate(custodial);

      expect(selfResult.details.cypherpunkValues.valueScores.SELF_CUSTODY).toBeGreaterThan(
        custResult.details.cypherpunkValues.valueScores.SELF_CUSTODY
      );
    });

    it('should reward permissionless observation', async () => {
      const permissionless = { permissionless: true, trustless: true, noKYC: true };
      const permissioned = { kyc: true, requiresApproval: true };

      const permResult = await evaluator.evaluate(permissionless);
      const reqResult = await evaluator.evaluate(permissioned);

      expect(permResult.details.cypherpunkValues.valueScores.PERMISSIONLESS).toBeGreaterThan(
        reqResult.details.cypherpunkValues.valueScores.PERMISSIONLESS
      );
    });

    it('should reward burn-aligned observation', async () => {
      const burnAlign = { burn: true, noFees: true, communityOwned: true };
      const extractive = { vcFunded: true, rentSeeking: true };

      const burnResult = await evaluator.evaluate(burnAlign);
      const extResult = await evaluator.evaluate(extractive);

      expect(burnResult.details.cypherpunkValues.valueScores.NO_EXTRACTION).toBeGreaterThan(
        extResult.details.cypherpunkValues.valueScores.NO_EXTRACTION
      );
    });

    it('should count aligned and violated values', async () => {
      const fullyAligned = {
        privacy: true,
        decentralized: true,
        openSource: true,
        selfCustody: true,
        permissionless: true,
        burn: true,
      };

      const result = await evaluator.evaluate(fullyAligned);

      expect(result.details.cypherpunkValues.summary.total).toBe(6);
      expect(result.details.cypherpunkValues.summary.aligned).toBeGreaterThanOrEqual(4);
    });

    it('should give higher overall score with all values aligned', async () => {
      const aligned = {
        privacy: true,
        decentralized: true,
        openSource: true,
        selfCustody: true,
        permissionless: true,
        burn: true,
      };
      const misaligned = {
        tracking: true,
        centralized: true,
        closedSource: true,
        custodial: true,
        kyc: true,
        vcFunded: true,
      };

      const alignedResult = await evaluator.evaluate(aligned);
      const misalignedResult = await evaluator.evaluate(misaligned);

      expect(alignedResult.score).toBeGreaterThan(misalignedResult.score);
    });

    it('should include values info in reasoning when violated', async () => {
      const violated = {
        centralized: true,
        proprietary: true,
        vcFunded: true,
      };

      const result = await evaluator.evaluate(violated);
      expect(result.reasoning).toContain('violation');
    });
  });
});
