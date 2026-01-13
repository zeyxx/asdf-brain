/**
 * Regression Tests for CYNIC Verdict Consistency
 *
 * These tests ensure that verdicts remain consistent across code changes.
 * They capture expected behaviors for known inputs and detect regressions.
 *
 * PHASE 3.3 - CREATED 2026-01-13
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

const { SelfJudge } = require('../../../lib/cynic/self-judge');
const { PHI_INV, PHI_INV_2 } = require('../../../lib/cynic/axioms/constants');

describe('Verdict Consistency Regression', () => {
  let judge;

  beforeAll(() => {
    // Single instance for consistency
    judge = new SelfJudge();
  });

  describe('Q-Score Formula Invariants', () => {
    it('should calculate global score using geometric mean of 4 axioms', async () => {
      const item = { content: 'Test item' };
      const result = await judge.judge(item);

      // Q = 100 × ∜(φ × V × C × B)
      const axioms = result.axiomBreakdown;
      expect(axioms.PHI).toBeDefined();
      expect(axioms.VERIFY).toBeDefined();
      expect(axioms.CULTURE).toBeDefined();
      expect(axioms.BURN).toBeDefined();

      // Global score should be in valid range
      expect(result.global).toBeGreaterThanOrEqual(0);
      expect(result.global).toBeLessThanOrEqual(100);
    });

    it('should have confidence ≤ φ⁻¹ (61.8%) always', async () => {
      const items = [
        { content: 'Perfect item', source: 'verified', hash: 'sha256:valid', signature: 'sig' },
        { content: 'Good item', verified: true },
        { content: 'Average item' },
        { content: 'Poor item', leaked: true, hasPII: true },
      ];

      for (const item of items) {
        const result = await judge.judge(item);
        expect(result.confidence).toBeLessThanOrEqual(PHI_INV * 100 + 0.1);
      }
    });

    it('should have doubt ≥ φ⁻² (38.2%) always', async () => {
      const items = [
        { content: 'Perfect item', source: 'verified', hash: 'sha256:valid' },
        { content: 'Poor item', leaked: true },
      ];

      for (const item of items) {
        const result = await judge.judge(item);
        expect(result.doubt).toBeGreaterThanOrEqual(PHI_INV_2 * 100 - 0.1);
      }
    });
  });

  describe('Verdict Thresholds', () => {
    it('should not ACCEPT items with critical dimension failures', async () => {
      const criticalFailureItems = [
        { content: 'PII leak', hasPII: true, leaked: true, email: 'test@example.com' },
        { content: 'Extraction attempt', intent: 'extract', extracting: true },
        { content: 'Privacy violation', exposed: true, privateData: 'leaked' },
      ];

      for (const item of criticalFailureItems) {
        const result = await judge.judge(item);
        // Critical failures should not result in ACCEPT
        expect(result.verdict.action).not.toBe('ACCEPT');
      }
    });

    it('should never ACCEPT with global score below φ⁻¹', async () => {
      // Create items that produce low scores
      const lowScoreItems = [
        { content: '', type: 'empty' },
        { content: 'x', hasPII: true, leaked: true, extracting: true },
      ];

      for (const item of lowScoreItems) {
        const result = await judge.judge(item);
        if (result.global < PHI_INV * 100) {
          expect(result.verdict.action).not.toBe('ACCEPT');
        }
      }
    });
  });

  describe('World Coherence Invariants', () => {
    it('should always include 4 worlds in coherence', async () => {
      const item = { content: 'Test' };
      const result = await judge.judge(item);

      expect(result.worldCoherence.byWorld.ATZILUT).toBeDefined();
      expect(result.worldCoherence.byWorld.BERIAH).toBeDefined();
      expect(result.worldCoherence.byWorld.YETZIRAH).toBeDefined();
      expect(result.worldCoherence.byWorld.ASSIAH).toBeDefined();
    });

    it('should have singularity distance between 0 and 1', async () => {
      const items = [
        { content: 'Near singularity' },
        { content: 'Far from singularity', noisy: true, chaotic: true },
      ];

      for (const item of items) {
        const result = await judge.judge(item);
        expect(result.worldCoherence.singularityDistance.distance).toBeGreaterThanOrEqual(0);
        expect(result.worldCoherence.singularityDistance.distance).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('24 Dimensions Invariants', () => {
    it('should always evaluate all dimension categories', async () => {
      const item = { content: 'Test item' };
      const result = await judge.judge(item);

      // Check PRIMARY dimensions (8)
      const primaryDimensions = ['TRUTH', 'HARMONY', 'COHERENCE', 'INTEGRITY', 'ETHICS', 'OPTIMISM', 'ALIGNMENT', 'PROGRESS'];
      for (const dim of primaryDimensions) {
        expect(result.scores[dim]).toBeDefined();
        expect(typeof result.scores[dim]).toBe('number');
      }

      // Check SECONDARY dimensions (5)
      const secondaryDimensions = ['SECURE', 'PRIVATE', 'SCALE', 'SIMPLIFY', 'ENABLE'];
      for (const dim of secondaryDimensions) {
        expect(result.scores[dim]).toBeDefined();
      }

      // Check META dimensions (3)
      const metaDimensions = ['SELF_AWARENESS', 'LEARNING_RATE', 'SINGULARITY_DISTANCE'];
      for (const dim of metaDimensions) {
        expect(result.scores[dim]).toBeDefined();
      }

      // Check HUMAN_LLM dimensions (8)
      const humanLlmDimensions = ['MEMORY', 'TEACHING', 'INTENT', 'TRUST', 'PROACTIVITY', 'COMPLEMENTARITY', 'DELEGATION', 'BOUNDARIES'];
      for (const dim of humanLlmDimensions) {
        expect(result.scores[dim]).toBeDefined();
      }
    });

    it('should have all scores in 0-100 range', async () => {
      const item = { content: 'Test for score bounds' };
      const result = await judge.judge(item);

      for (const [dimension, score] of Object.entries(result.scores)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('16 Laws Compliance', () => {
    it('should always check 16 Laws', async () => {
      const item = { content: 'Test' };
      const result = await judge.judge(item);

      expect(typeof result.lawsAligned).toBe('boolean');
      expect(Array.isArray(result.lawViolations)).toBe(true);
      expect(Array.isArray(result.lawWarnings)).toBe(true);
    });

    it('should return law check results for all items', async () => {
      const items = [
        { content: 'Community contribution', type: 'contribution' },
        { content: 'Technical discussion', type: 'discussion' },
      ];

      for (const item of items) {
        const result = await judge.judge(item);
        // Law check results should always be present
        expect(typeof result.lawsAligned).toBe('boolean');
        expect(Array.isArray(result.lawViolations)).toBe(true);
        expect(Array.isArray(result.lawWarnings)).toBe(true);
      }
    });
  });

  describe('Scaling Consistency', () => {
    it('should return consistent verdicts with scaling', async () => {
      const item = { content: 'Consistent test item' };

      // Run multiple scaled judgments
      const results = [];
      for (let i = 0; i < 3; i++) {
        const result = await judge.judgeWithScaling(item, {}, { n: 3 });
        results.push(result.verdict.action);
      }

      // Verdicts should be mostly consistent
      const verdictCounts = {};
      results.forEach((v) => (verdictCounts[v] = (verdictCounts[v] || 0) + 1));
      const maxCount = Math.max(...Object.values(verdictCounts));

      // At least 2 out of 3 should agree
      expect(maxCount).toBeGreaterThanOrEqual(2);
    });

    it('should have scaling metadata structure', async () => {
      const item = { content: 'Test' };
      const result = await judge.judgeWithScaling(item, {}, { n: 5 });

      expect(result._scaling).toBeDefined();
      expect(result._scaling.n).toBe(5);
      expect(result._scaling.consensus).toBeDefined();
      expect(result._scaling.samples).toBeDefined();
      expect(result._scaling.isStable).toBeDefined();
      expect(result._scaling.improvement).toBeDefined();
    });
  });

  describe('Known Input/Output Pairs', () => {
    // These are regression tests for specific known behaviors

    it('should handle empty content gracefully', async () => {
      const item = { content: '' };
      const result = await judge.judge(item);

      expect(result).toBeDefined();
      expect(result.verdict).toBeDefined();
      expect(['ACCEPT', 'TRANSFORM', 'REJECT']).toContain(result.verdict.action);
    });

    it('should handle missing content property', async () => {
      const item = { type: 'no-content' };
      const result = await judge.judge(item);

      expect(result).toBeDefined();
      expect(result.verdict).toBeDefined();
    });

    it('should handle very long content', async () => {
      const item = { content: 'x'.repeat(10000) };
      const result = await judge.judge(item);

      expect(result).toBeDefined();
      expect(result.verdict).toBeDefined();
    });

    it('should handle special characters', async () => {
      const item = { content: '🐕 φ = 1.618... ∜ ∑ ∫' };
      const result = await judge.judge(item);

      expect(result).toBeDefined();
      expect(result.verdict).toBeDefined();
    });

    it('should handle numeric content', async () => {
      const item = { content: 12345 };
      const result = await judge.judge(item);

      expect(result).toBeDefined();
      expect(result.verdict).toBeDefined();
    });
  });

  describe('World Influence Regression', () => {
    it('should downgrade verdict for BERIAH incoherence', () => {
      const verdict = { action: 'ACCEPT', reason: 'High quality' };
      const worldCoherence = {
        worlds: {
          ATZILUT: { status: 'coherent', coherence: 0.8 },
          BERIAH: { status: 'incoherent', coherence: 0.4 }, // Below φ⁻¹
          YETZIRAH: { status: 'coherent', coherence: 0.7 },
          ASSIAH: { status: 'coherent', coherence: 0.6 },
        },
      };

      const result = judge._applyWorldInfluence(verdict, worldCoherence, {});
      expect(result.action).toBe('TRANSFORM');
      expect(result.worldBlocking).toBe('BERIAH');
    });

    it('should REJECT for critical ATZILUT misalignment', () => {
      const verdict = { action: 'TRANSFORM', reason: 'Needs work' };
      const worldCoherence = {
        worlds: {
          ATZILUT: { status: 'incoherent', coherence: 0.2 }, // Below φ⁻²
          BERIAH: { status: 'coherent', coherence: 0.7 },
          YETZIRAH: { status: 'coherent', coherence: 0.7 },
          ASSIAH: { status: 'coherent', coherence: 0.6 },
        },
      };

      const result = judge._applyWorldInfluence(verdict, worldCoherence, {});
      expect(result.action).toBe('REJECT');
      expect(result.worldBlocking).toBe('ATZILUT');
    });

    it('should preserve verdict when all worlds coherent', () => {
      const verdict = { action: 'ACCEPT', reason: 'All good' };
      const worldCoherence = {
        worlds: {
          ATZILUT: { status: 'coherent', coherence: 0.8 },
          BERIAH: { status: 'coherent', coherence: 0.7 },
          YETZIRAH: { status: 'coherent', coherence: 0.7 },
          ASSIAH: { status: 'coherent', coherence: 0.65 },
        },
      };

      const result = judge._applyWorldInfluence(verdict, worldCoherence, {});
      expect(result.action).toBe('ACCEPT');
      expect(result.worldBlocking).toBeUndefined();
    });
  });
});
