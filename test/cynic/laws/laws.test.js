/**
 * Tests for lib/cynic/laws/index.js
 *
 * The 16 Laws of CYNIC Being (4 per world × 4 worlds = 16 total)
 */

import { describe, it, expect } from 'vitest';

const {
  WORLDS,
  LAWS,
  LAWS_BY_CODE,
  LAWS_BY_WORLD,
  ATZILUT_LAWS,
  BERIAH_LAWS,
  YETZIRAH_LAWS,
  ASSIAH_LAWS,
  NON_LAWS,
  getLawsForWorld,
  getLawByCode,
  getWorldForLaw,
  getAllQuestions,
  getLawsCount,
} = require('../../../lib/cynic/laws');

describe('CYNIC Laws', () => {
  describe('WORLDS Constants', () => {
    it('should have 4 worlds', () => {
      expect(Object.keys(WORLDS)).toHaveLength(4);
    });

    it('should have ATZILUT as highest priority', () => {
      expect(WORLDS.ATZILUT.priority).toBe(0);
    });

    it('should have ASSIAH as lowest priority', () => {
      expect(WORLDS.ASSIAH.priority).toBe(3);
    });

    it('should have Hebrew names', () => {
      expect(WORLDS.ATZILUT.hebrew).toBe('אצילות');
      expect(WORLDS.BERIAH.hebrew).toBe('בריאה');
      expect(WORLDS.YETZIRAH.hebrew).toBe('יצירה');
      expect(WORLDS.ASSIAH.hebrew).toBe('עשיה');
    });

    it('should have φ-based weights', () => {
      expect(WORLDS.ATZILUT.weight).toBeGreaterThan(WORLDS.BERIAH.weight);
      expect(WORLDS.BERIAH.weight).toBeGreaterThan(WORLDS.ASSIAH.weight);
    });

    it('should have descriptive names', () => {
      expect(WORLDS.ATZILUT.name).toBe('Essence');
      expect(WORLDS.BERIAH.name).toBe('Economics');
      expect(WORLDS.YETZIRAH.name).toBe('Ethics');
      expect(WORLDS.ASSIAH.name).toBe('Operation');
    });
  });

  describe('LAWS Collection', () => {
    it('should have 16 laws total', () => {
      expect(Object.keys(LAWS)).toHaveLength(16);
    });

    it('should have 4 ATZILUT laws', () => {
      expect(Object.keys(ATZILUT_LAWS)).toHaveLength(4);
    });

    it('should have 4 BERIAH laws', () => {
      expect(Object.keys(BERIAH_LAWS)).toHaveLength(4);
    });

    it('should have 4 YETZIRAH laws', () => {
      expect(Object.keys(YETZIRAH_LAWS)).toHaveLength(4);
    });

    it('should have 4 ASSIAH laws', () => {
      expect(Object.keys(ASSIAH_LAWS)).toHaveLength(4);
    });

    it('should have unique law codes', () => {
      const codes = Object.values(LAWS).map((law) => law.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(16);
    });

    it('should have questions for all laws', () => {
      Object.values(LAWS).forEach((law) => {
        expect(law.question).toBeDefined();
        expect(typeof law.question).toBe('string');
      });
    });

    it('should have world assignment for all laws', () => {
      Object.values(LAWS).forEach((law) => {
        expect(['ATZILUT', 'BERIAH', 'YETZIRAH', 'ASSIAH']).toContain(law.world);
      });
    });
  });

  describe('LAWS_BY_CODE', () => {
    it('should lookup law by code E1', () => {
      const law = LAWS_BY_CODE['E1'];
      expect(law).toBeDefined();
      expect(law.code).toBe('E1');
    });

    it('should lookup law by code Φ1', () => {
      const law = LAWS_BY_CODE['Φ1'];
      expect(law).toBeDefined();
      expect(law.code).toBe('Φ1');
    });

    it('should lookup law by code Ξ1', () => {
      const law = LAWS_BY_CODE['Ξ1'];
      expect(law).toBeDefined();
      expect(law.code).toBe('Ξ1');
    });

    it('should lookup law by code Ω1', () => {
      const law = LAWS_BY_CODE['Ω1'];
      expect(law).toBeDefined();
      expect(law.code).toBe('Ω1');
    });

    it('should have all 16 codes', () => {
      expect(Object.keys(LAWS_BY_CODE)).toHaveLength(16);
    });
  });

  describe('LAWS_BY_WORLD', () => {
    it('should group laws by world', () => {
      expect(LAWS_BY_WORLD).toHaveProperty('ATZILUT');
      expect(LAWS_BY_WORLD).toHaveProperty('BERIAH');
      expect(LAWS_BY_WORLD).toHaveProperty('YETZIRAH');
      expect(LAWS_BY_WORLD).toHaveProperty('ASSIAH');
    });

    it('should have correct law counts per world (4 each)', () => {
      expect(Object.keys(LAWS_BY_WORLD.ATZILUT)).toHaveLength(4);
      expect(Object.keys(LAWS_BY_WORLD.BERIAH)).toHaveLength(4);
      expect(Object.keys(LAWS_BY_WORLD.YETZIRAH)).toHaveLength(4);
      expect(Object.keys(LAWS_BY_WORLD.ASSIAH)).toHaveLength(4);
    });
  });

  describe('NON_LAWS', () => {
    it('should define what CYNIC is NOT', () => {
      expect(NON_LAWS).toBeDefined();
      expect(typeof NON_LAWS).toBe('object');
    });

    it('should have 5 non-law definitions', () => {
      expect(Object.keys(NON_LAWS)).toHaveLength(5);
    });

    it('should explain boundaries', () => {
      Object.values(NON_LAWS).forEach((nonLaw) => {
        expect(nonLaw).toHaveProperty('description');
        expect(nonLaw).toHaveProperty('rule');
      });
    });

    it('should include NOT_A_CENSOR', () => {
      expect(NON_LAWS.NOT_A_CENSOR).toBeDefined();
    });
  });

  describe('getLawsForWorld()', () => {
    it('should return laws for ATZILUT', () => {
      const laws = getLawsForWorld('ATZILUT');
      expect(Object.keys(laws)).toHaveLength(4);
      Object.values(laws).forEach((law) => {
        expect(law.world).toBe('ATZILUT');
      });
    });

    it('should return laws for BERIAH', () => {
      const laws = getLawsForWorld('BERIAH');
      expect(Object.keys(laws)).toHaveLength(4);
    });

    it('should return empty object for invalid world', () => {
      const laws = getLawsForWorld('INVALID');
      expect(Object.keys(laws)).toHaveLength(0);
    });
  });

  describe('getLawByCode()', () => {
    it('should find law by code E1', () => {
      const law = getLawByCode('E1');
      expect(law).toBeDefined();
      expect(law.code).toBe('E1');
      expect(law.name).toBe('THIS IS FINE');
    });

    it('should find law by code Φ1', () => {
      const law = getLawByCode('Φ1');
      expect(law).toBeDefined();
      expect(law.code).toBe('Φ1');
      expect(law.name).toBe('ZERO EXTRACTION');
    });

    it('should return null for invalid code', () => {
      const law = getLawByCode('INVALID');
      expect(law).toBeNull();
    });
  });

  describe('getWorldForLaw()', () => {
    it('should return world object for ATZILUT law', () => {
      const world = getWorldForLaw('E1_THIS_IS_FINE');
      expect(world).toBeDefined();
      expect(world.name).toBe('Essence');
    });

    it('should return world object for BERIAH law', () => {
      const world = getWorldForLaw('PHI1_ZERO_EXTRACTION');
      expect(world).toBeDefined();
      expect(world.name).toBe('Economics');
    });

    it('should return null for invalid law key', () => {
      const world = getWorldForLaw('INVALID');
      expect(world).toBeNull();
    });
  });

  describe('getAllQuestions()', () => {
    it('should return all 16 questions', () => {
      const questions = getAllQuestions();
      expect(questions).toHaveLength(16);
    });

    it('should return objects with code, name, world, question', () => {
      const questions = getAllQuestions();
      questions.forEach((q) => {
        expect(q).toHaveProperty('code');
        expect(q).toHaveProperty('name');
        expect(q).toHaveProperty('world');
        expect(q).toHaveProperty('question');
        expect(typeof q.question).toBe('string');
      });
    });
  });

  describe('getLawsCount()', () => {
    it('should return counts per world (4 each)', () => {
      const counts = getLawsCount();
      expect(counts.ATZILUT).toBe(4);
      expect(counts.BERIAH).toBe(4);
      expect(counts.YETZIRAH).toBe(4);
      expect(counts.ASSIAH).toBe(4);
    });

    it('should return total of 16', () => {
      const counts = getLawsCount();
      expect(counts.total).toBe(16);
    });
  });
});
