/**
 * Tests for lib/cynic/worlds/
 *
 * Verifies the 4 Kabbalistic worlds and WorldManager
 */

import { describe, it, expect, beforeEach } from 'vitest';

const {
  atzilut,
  beriah,
  yetzirah,
  assiah,
  worldManager,
  WORLDS,
  AXIOMS,
  HEBREW,
} = require('../../../lib/cynic/worlds');

describe('Worlds Module', () => {
  describe('Constants', () => {
    it('should export 4 world names', () => {
      expect(WORLDS).toEqual(['ATZILUT', 'BERIAH', 'YETZIRAH', 'ASSIAH']);
    });

    it('should map axioms to worlds', () => {
      expect(AXIOMS.PHI).toBe('ATZILUT');
      expect(AXIOMS.VERIFY).toBe('BERIAH');
      expect(AXIOMS.CULTURE).toBe('YETZIRAH');
      expect(AXIOMS.BURN).toBe('ASSIAH');
    });

    it('should have Hebrew names', () => {
      expect(HEBREW.ATZILUT).toBe('אצילות');
      expect(HEBREW.BERIAH).toBe('בריאה');
      expect(HEBREW.YETZIRAH).toBe('יצירה');
      expect(HEBREW.ASSIAH).toBe('עשייה');
    });
  });

  describe('ATZILUT (PHI)', () => {
    beforeEach(() => {
      atzilut.reset();
    });

    it('should have axiom PHI', () => {
      expect(atzilut.axiom).toBe('PHI');
    });

    it('should have Hebrew name אצילות', () => {
      expect(atzilut.hebrewName).toBe('אצילות');
    });

    it('should have dimensions HARMONY, COHERENCE, etc.', () => {
      const dims = atzilut.getDimensions();
      const dimNames = dims.map((d) => d.name);
      expect(dimNames).toContain('HARMONY');
      expect(dimNames).toContain('COHERENCE');
      expect(dimNames).toContain('SIMPLIFY');
      expect(dimNames).toContain('SELF_AWARENESS');
      expect(dimNames).toContain('MEMORY');
      expect(dimNames).toContain('TEACHING');
    });

    it('should record scores correctly', () => {
      const result = atzilut.recordScore('HARMONY', 80);
      expect(result).toBe(true);
      expect(atzilut.scores.HARMONY.value).toBe(80);
      expect(atzilut.scores.HARMONY.passed).toBe(true);
    });

    it('should evaluate coherence', () => {
      atzilut.recordScore('HARMONY', 70);
      atzilut.recordScore('COHERENCE', 80);
      const coherence = atzilut.evaluateCoherence();
      expect(coherence).toHaveProperty('coherence');
      expect(coherence).toHaveProperty('status');
    });

    it('should check φ alignment', () => {
      atzilut.recordScore('HARMONY', 100);
      atzilut.recordScore('COHERENCE', 61.8);
      const alignment = atzilut.checkPhiAlignment();
      expect(alignment).toHaveProperty('aligned');
      expect(alignment).toHaveProperty('avgRatio');
    });
  });

  describe('BERIAH (VERIFY)', () => {
    beforeEach(() => {
      beriah.reset();
    });

    it('should have axiom VERIFY', () => {
      expect(beriah.axiom).toBe('VERIFY');
    });

    it('should have Hebrew name בריאה', () => {
      expect(beriah.hebrewName).toBe('בריאה');
    });

    it('should have verification dimensions', () => {
      const dims = beriah.getDimensions();
      const dimNames = dims.map((d) => d.name);
      expect(dimNames).toContain('TRUTH');
      expect(dimNames).toContain('INTEGRITY');
      expect(dimNames).toContain('SECURE');
      expect(dimNames).toContain('PRIVATE');
    });

    it('should check if item is verifiable', () => {
      const verifiableItem = {
        hash: 'abc123',
        timestamp: Date.now(),
      };
      const result = beriah.isVerifiable(verifiableItem);
      expect(result.verifiable).toBe(true);
      expect(result.passedChecks).toBeGreaterThanOrEqual(2);
    });

    it('should detect non-verifiable items', () => {
      const nonVerifiable = { content: 'just text' };
      const result = beriah.isVerifiable(nonVerifiable);
      expect(result.verifiable).toBe(false);
    });

    it('should get verification score', () => {
      beriah.recordScore('TRUTH', 80);
      beriah.recordScore('INTEGRITY', 90);
      const score = beriah.getVerificationScore();
      expect(score).toHaveProperty('score');
      expect(score).toHaveProperty('verificationRate');
    });
  });

  describe('YETZIRAH (CULTURE)', () => {
    beforeEach(() => {
      yetzirah.reset();
    });

    it('should have axiom CULTURE', () => {
      expect(yetzirah.axiom).toBe('CULTURE');
    });

    it('should have Hebrew name יצירה', () => {
      expect(yetzirah.hebrewName).toBe('יצירה');
    });

    it('should have cultural dimensions', () => {
      const dims = yetzirah.getDimensions();
      const dimNames = dims.map((d) => d.name);
      expect(dimNames).toContain('ETHICS');
      expect(dimNames).toContain('OPTIMISM');
      expect(dimNames).toContain('ENABLE');
    });

    it('should check if content respects culture', () => {
      const goodContent = {
        content: 'We will build something that helps the community',
        source: 'trusted',
      };
      const result = yetzirah.respectsCulture(goodContent);
      expect(result).toHaveProperty('respects');
      expect(result).toHaveProperty('checks');
    });

    it('should detect harmful patterns', () => {
      const badContent = {
        content: 'This is a scam to exploit users',
      };
      const result = yetzirah.respectsCulture(badContent);
      expect(result.respects).toBe(false);
    });

    it('should get cultural alignment', () => {
      yetzirah.recordScore('ETHICS', 90);
      yetzirah.recordScore('OPTIMISM', 70);
      const alignment = yetzirah.getCulturalAlignment();
      expect(alignment).toHaveProperty('score');
      expect(alignment).toHaveProperty('alignmentRate');
    });
  });

  describe('ASSIAH (BURN)', () => {
    beforeEach(() => {
      assiah.reset();
    });

    it('should have axiom BURN', () => {
      expect(assiah.axiom).toBe('BURN');
    });

    it('should have Hebrew name עשייה', () => {
      expect(assiah.hebrewName).toBe('עשייה');
    });

    it('should have action dimensions', () => {
      const dims = assiah.getDimensions();
      const dimNames = dims.map((d) => d.name);
      expect(dimNames).toContain('ALIGNMENT');
      expect(dimNames).toContain('PROGRESS');
      expect(dimNames).toContain('SCALE');
    });

    it('should record burn events', () => {
      assiah.recordBurn({ amount: 100, token: '$asdfasdfa' });
      expect(assiah.burnMetrics.totalBurned).toBe(100);
      expect(assiah.burnMetrics.burnEvents.length).toBe(1);
    });

    it('should check if action contributes to burn', () => {
      const goodAction = {
        burns: true,
        improves: true,
      };
      const result = assiah.contributesToBurn(goodAction);
      expect(result.contributes).toBe(true);
    });

    it('should detect extraction (bad)', () => {
      const badAction = {
        extracts: true,
        takes: true,
      };
      const result = assiah.contributesToBurn(badAction);
      expect(result.contributes).toBe(false);
    });

    it('should calculate singularity distance', () => {
      const worldStates = {
        ATZILUT: { axiom: 'PHI', coherence: 80 },
        BERIAH: { axiom: 'VERIFY', coherence: 70 },
        YETZIRAH: { axiom: 'CULTURE', coherence: 90 },
        ASSIAH: { axiom: 'BURN', coherence: 85 },
      };
      const result = assiah.calculateSingularityDistance(worldStates);
      expect(result).toHaveProperty('distance');
      expect(result.distance).toBeGreaterThanOrEqual(0);
      expect(result.distance).toBeLessThanOrEqual(1);
    });
  });

  describe('WorldManager', () => {
    beforeEach(() => {
      worldManager.resetAll();
    });

    it('should get world by name', () => {
      expect(worldManager.getWorld('ATZILUT')).toBe(atzilut);
      expect(worldManager.getWorld('BERIAH')).toBe(beriah);
      expect(worldManager.getWorld('YETZIRAH')).toBe(yetzirah);
      expect(worldManager.getWorld('ASSIAH')).toBe(assiah);
    });

    it('should get world by axiom', () => {
      expect(worldManager.getWorldByAxiom('PHI')).toBe(atzilut);
      expect(worldManager.getWorldByAxiom('VERIFY')).toBe(beriah);
      expect(worldManager.getWorldByAxiom('CULTURE')).toBe(yetzirah);
      expect(worldManager.getWorldByAxiom('BURN')).toBe(assiah);
    });

    it('should record score to correct world', () => {
      worldManager.recordScore('HARMONY', 75, 'ATZILUT');
      expect(atzilut.scores.HARMONY.value).toBe(75);
    });

    it('should evaluate all worlds', () => {
      // Record some scores
      worldManager.recordScore('HARMONY', 70, 'ATZILUT');
      worldManager.recordScore('TRUTH', 80, 'BERIAH');
      worldManager.recordScore('ETHICS', 90, 'YETZIRAH');
      worldManager.recordScore('ALIGNMENT', 85, 'ASSIAH');

      const result = worldManager.evaluateAllWorlds();
      expect(result).toHaveProperty('worlds');
      expect(result).toHaveProperty('overallCoherence');
      expect(result).toHaveProperty('singularityDistance');
    });

    it('should check 4-axiom alignment', () => {
      const item = {
        hash: 'abc123',
        timestamp: Date.now(),
        source: 'trusted',
        content: 'Build and improve',
        burns: true,
      };
      const result = worldManager.checkAxiomAlignment(item);
      expect(result).toHaveProperty('aligned');
      expect(result).toHaveProperty('checks');
      expect(result.totalAxioms).toBe(4);
    });

    it('should get all essences', () => {
      const essences = worldManager.getAllEssences();
      expect(essences).toHaveProperty('ATZILUT');
      expect(essences).toHaveProperty('BERIAH');
      expect(essences).toHaveProperty('YETZIRAH');
      expect(essences).toHaveProperty('ASSIAH');
    });

    it('should get stats', () => {
      const stats = worldManager.getStats();
      expect(stats).toHaveProperty('worlds');
      expect(stats).toHaveProperty('totalDimensions');
    });

    it('should reset all worlds', () => {
      worldManager.recordScore('HARMONY', 70, 'ATZILUT');
      worldManager.resetAll();
      expect(Object.keys(atzilut.scores).length).toBe(0);
    });
  });
});
