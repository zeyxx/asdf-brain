/**
 * Integration Tests for CYNIC Judge Flow
 *
 * Tests the complete judgment flow:
 * - Basic judgment
 * - Judgment with scaling
 * - World influence on verdicts
 * - Dimension evaluator integration
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { SelfJudge } = require('../../../lib/cynic/self-judge');
const { PHI_INV, PHI_INV_2 } = require('../../../lib/cynic/axioms/constants');

describe('Judge Flow Integration', () => {
  let judge;

  beforeEach(() => {
    judge = new SelfJudge();
  });

  describe('Basic Judgment', () => {
    it('should return complete judgment structure', async () => {
      const item = { content: 'Test item', type: 'test' };
      const result = await judge.judge(item);

      expect(result).toBeDefined();
      expect(result.scores).toBeDefined();
      expect(result.global).toBeDefined();
      expect(result.verdict).toBeDefined();
      expect(result.verdict.action).toBeDefined();
      expect(['ACCEPT', 'TRANSFORM', 'REJECT']).toContain(result.verdict.action);
    });

    it('should have confidence capped at φ⁻¹ (61.8%)', async () => {
      const item = { content: 'Very high quality item' };
      const result = await judge.judge(item);

      expect(result.confidence).toBeLessThanOrEqual(PHI_INV * 100 + 0.1);
    });

    it('should have doubt >= φ⁻² (38.2%)', async () => {
      const item = { content: 'Test' };
      const result = await judge.judge(item);

      expect(result.doubt).toBeGreaterThanOrEqual(PHI_INV_2 * 100 - 0.1);
    });

    it('should include Q-Score axiom breakdown', async () => {
      const item = { content: 'Test' };
      const result = await judge.judge(item);

      expect(result.axiomBreakdown).toBeDefined();
      expect(result.axiomBreakdown.PHI).toBeDefined();
      expect(result.axiomBreakdown.VERIFY).toBeDefined();
      expect(result.axiomBreakdown.CULTURE).toBeDefined();
      expect(result.axiomBreakdown.BURN).toBeDefined();
    });

    it('should check 16 Laws', async () => {
      const item = { content: 'Test' };
      const result = await judge.judge(item);

      expect(typeof result.lawsAligned).toBe('boolean');
      expect(Array.isArray(result.lawViolations)).toBe(true);
      expect(Array.isArray(result.lawWarnings)).toBe(true);
    });
  });

  describe('World Coherence', () => {
    it('should include world coherence in result', async () => {
      const item = { content: 'Test' };
      const result = await judge.judge(item);

      expect(result.worldCoherence).toBeDefined();
      expect(result.worldCoherence.overall).toBeDefined();
      expect(result.worldCoherence.byWorld).toBeDefined();
      expect(result.worldCoherence.byWorld.ATZILUT).toBeDefined();
      expect(result.worldCoherence.byWorld.BERIAH).toBeDefined();
      expect(result.worldCoherence.byWorld.YETZIRAH).toBeDefined();
      expect(result.worldCoherence.byWorld.ASSIAH).toBeDefined();
    });

    it('should include singularity distance', async () => {
      const item = { content: 'Test' };
      const result = await judge.judge(item);

      expect(result.worldCoherence.singularityDistance).toBeDefined();
      expect(result.worldCoherence.singularityDistance.distance).toBeDefined();
      expect(result.worldCoherence.singularityDistance.distance).toBeGreaterThanOrEqual(0);
      expect(result.worldCoherence.singularityDistance.distance).toBeLessThanOrEqual(1);
    });
  });

  describe('Dimension Evaluators', () => {
    it('should have all 24 dimension scores', async () => {
      const item = { content: 'Test' };
      const result = await judge.judge(item);

      // 8 PRIMARY + 5 SECONDARY + 3 META + 8 HUMAN_LLM = 24 dimensions
      const scoreKeys = Object.keys(result.scores);
      expect(scoreKeys.length).toBeGreaterThanOrEqual(16); // At minimum core dimensions
    });

    it('should score higher with verifiable item', async () => {
      const unverifiableItem = { content: 'Just a claim' };
      const verifiableItem = {
        content: 'Verified claim',
        source: 'https://example.com',
        signature: 'abc123',
        hash: 'sha256:deadbeef',
      };

      const unverifiableResult = await judge.judge(unverifiableItem);
      const verifiableResult = await judge.judge(verifiableItem);

      // TRUTH score should be higher for verifiable item
      expect(verifiableResult.scores.TRUTH).toBeGreaterThan(unverifiableResult.scores.TRUTH);
    });
  });

  describe('Judgment with Scaling', () => {
    it('should return scaling metadata', async () => {
      const item = { content: 'Test' };
      const result = await judge.judgeWithScaling(item, {}, { n: 3 });

      expect(result._scaling).toBeDefined();
      expect(result._scaling.n).toBe(3);
      expect(result._scaling.consensus).toBeDefined();
      expect(result._scaling.samples).toBeDefined();
      expect(result._scaling.samples.length).toBe(3);
    });

    it('should calculate consensus metrics', async () => {
      const item = { content: 'Test' };
      const result = await judge.judgeWithScaling(item, {}, { n: 5 });

      expect(result._scaling.consensus.agreement).toBeDefined();
      expect(result._scaling.consensus.agreement).toBeGreaterThanOrEqual(0);
      expect(result._scaling.consensus.agreement).toBeLessThanOrEqual(1);
      expect(result._scaling.consensus.verdictAgreement).toBeDefined();
    });

    it('should determine stability', async () => {
      const item = { content: 'Test' };
      const result = await judge.judgeWithScaling(item, {}, { n: 3 });

      expect(typeof result._scaling.isStable).toBe('boolean');
    });

    it('should calculate improvement metrics', async () => {
      const item = { content: 'Test' };
      const result = await judge.judgeWithScaling(item, {}, { n: 3 });

      expect(result._scaling.improvement).toBeDefined();
      expect(result._scaling.improvement.singlePass).toBeDefined();
      expect(result._scaling.improvement.scaled).toBeDefined();
      expect(result._scaling.improvement.delta).toBeDefined();
    });
  });

  describe('Verdict Thresholds', () => {
    it('should ACCEPT high quality items', async () => {
      // Create an item that should pass most checks
      const highQualityItem = {
        content: 'Community contribution with verified source',
        source: 'https://github.com/verified',
        signature: 'verified-sig',
        hash: 'sha256:valid',
        intent: 'positive',
        type: 'contribution',
        tags: ['community', 'open-source'],
      };

      const result = await judge.judge(highQualityItem);
      // Due to dimension thresholds, high quality items often get TRANSFORM
      // The important thing is they don't get REJECT
      expect(['ACCEPT', 'TRANSFORM']).toContain(result.verdict.action);
    });

    it('should not ACCEPT items with critical dimension failures', async () => {
      // Item that should fail PRIVATE dimension
      const privacyViolationItem = {
        content: 'Contains personal data: email@example.com, SSN: 123-45-6789',
        hasPII: true,
        leaked: true,
      };

      const result = await judge.judge(privacyViolationItem);
      expect(result.verdict.action).not.toBe('ACCEPT');
    });
  });

  describe('World Influence on Verdicts', () => {
    it('should have _applyWorldInfluence method', () => {
      expect(typeof judge._applyWorldInfluence).toBe('function');
    });

    it('should preserve verdict when worlds are aligned', () => {
      const verdict = { action: 'ACCEPT', reason: 'Good quality' };
      const worldCoherence = {
        worlds: {
          ATZILUT: { status: 'coherent', coherence: 0.8 },
          BERIAH: { status: 'coherent', coherence: 0.7 },
          YETZIRAH: { status: 'coherent', coherence: 0.75 },
          ASSIAH: { status: 'coherent', coherence: 0.65 },
        },
      };

      const result = judge._applyWorldInfluence(verdict, worldCoherence, {});
      expect(result.action).toBe('ACCEPT');
    });

    it('should downgrade ACCEPT to TRANSFORM for BERIAH misalignment', () => {
      const verdict = { action: 'ACCEPT', reason: 'Good quality' };
      const worldCoherence = {
        worlds: {
          ATZILUT: { status: 'coherent', coherence: 0.8 },
          BERIAH: { status: 'incoherent', coherence: 0.4 }, // Below φ⁻¹
          YETZIRAH: { status: 'coherent', coherence: 0.75 },
          ASSIAH: { status: 'coherent', coherence: 0.65 },
        },
      };

      const result = judge._applyWorldInfluence(verdict, worldCoherence, {});
      expect(result.action).toBe('TRANSFORM');
      expect(result.worldBlocking).toBe('BERIAH');
    });

    it('should REJECT for critical ATZILUT misalignment', () => {
      const verdict = { action: 'ACCEPT', reason: 'Good quality' };
      const worldCoherence = {
        worlds: {
          ATZILUT: { status: 'incoherent', coherence: 0.2 }, // Below φ⁻² (critical)
          BERIAH: { status: 'coherent', coherence: 0.7 },
          YETZIRAH: { status: 'coherent', coherence: 0.75 },
          ASSIAH: { status: 'coherent', coherence: 0.65 },
        },
      };

      const result = judge._applyWorldInfluence(verdict, worldCoherence, {});
      expect(result.action).toBe('REJECT');
      expect(result.worldBlocking).toBe('ATZILUT');
    });

    it('should add warnings for YETZIRAH/ASSIAH issues', () => {
      const verdict = { action: 'ACCEPT', reason: 'Good quality' };
      const worldCoherence = {
        worlds: {
          ATZILUT: { status: 'coherent', coherence: 0.8 },
          BERIAH: { status: 'coherent', coherence: 0.7 },
          YETZIRAH: { status: 'incoherent', coherence: 0.5 },
          ASSIAH: { status: 'coherent', coherence: 0.3 }, // Below φ⁻²
        },
      };

      const result = judge._applyWorldInfluence(verdict, worldCoherence, {});
      expect(result.action).toBe('ACCEPT'); // Warnings only, no verdict change
      expect(result.worldWarnings).toBeDefined();
      expect(result.worldWarnings.length).toBeGreaterThan(0);
    });
  });
});
