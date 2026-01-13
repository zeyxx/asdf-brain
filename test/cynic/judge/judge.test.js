/**
 * Tests for lib/cynic/judge/
 *
 * CYNIC Judge - Matrix 5x5, Evidence, Cache
 */

import { describe, it, expect, beforeEach } from 'vitest';

const {
  // Matrix
  MATRIX_5x5,
  MODES,
  VERDICTS,
  REVERSE_MAPPING,
  getVerdict,
  mapTo4Worlds,
  mapFrom4Worlds,
  getMappingDoc,

  // Cache
  LRUCache,
  judgmentCache,

  // Evidence
  createEmptyEvidence,
} = require('../../../lib/cynic/judge/index');

describe('CYNIC Judge', () => {
  describe('MATRIX_5x5', () => {
    it('should have 5 categories', () => {
      const categories = Object.keys(MATRIX_5x5);
      expect(categories).toHaveLength(5);
    });

    it('should have FOUNDATION category', () => {
      expect(MATRIX_5x5).toHaveProperty('FOUNDATION');
      expect(MATRIX_5x5.FOUNDATION).toHaveProperty('description');
      expect(MATRIX_5x5.FOUNDATION).toHaveProperty('dimensions');
    });

    it('should have STRUCTURE category', () => {
      expect(MATRIX_5x5).toHaveProperty('STRUCTURE');
    });

    it('should have DYNAMICS category', () => {
      expect(MATRIX_5x5).toHaveProperty('DYNAMICS');
    });

    it('should have RELATIONSHIPS category', () => {
      expect(MATRIX_5x5).toHaveProperty('RELATIONSHIPS');
    });

    it('should have META category', () => {
      expect(MATRIX_5x5).toHaveProperty('META');
    });

    it('should have 5 dimensions per category', () => {
      Object.values(MATRIX_5x5).forEach((category) => {
        expect(Object.keys(category.dimensions)).toHaveLength(5);
      });
    });

    it('should have 25 dimensions total', () => {
      let total = 0;
      Object.values(MATRIX_5x5).forEach((category) => {
        total += Object.keys(category.dimensions).length;
      });
      expect(total).toBe(25);
    });

    it('should have question and maps_to for each dimension', () => {
      Object.values(MATRIX_5x5).forEach((category) => {
        Object.values(category.dimensions).forEach((dim) => {
          expect(dim).toHaveProperty('question');
          expect(dim).toHaveProperty('maps_to');
          expect(dim).toHaveProperty('axiom');
        });
      });
    });

    it('should map to valid axioms', () => {
      const validAxioms = ['PHI', 'VERIFY', 'CULTURE', 'BURN', 'META'];
      Object.values(MATRIX_5x5).forEach((category) => {
        Object.values(category.dimensions).forEach((dim) => {
          expect(validAxioms).toContain(dim.axiom);
        });
      });
    });
  });

  describe('MODES', () => {
    it('should have mode definitions', () => {
      expect(MODES).toBeDefined();
      expect(typeof MODES).toBe('object');
    });

    it('should have quick mode', () => {
      expect(MODES).toHaveProperty('quick');
      expect(MODES.quick).toHaveProperty('dimensions');
      expect(MODES.quick).toHaveProperty('description');
    });

    it('should have standard mode', () => {
      expect(MODES).toHaveProperty('standard');
    });

    it('should have thorough mode', () => {
      expect(MODES).toHaveProperty('thorough');
    });

    it('should have full mode', () => {
      expect(MODES).toHaveProperty('full');
      expect(MODES.full.dimensions).toHaveLength(25);
    });
  });

  describe('VERDICTS', () => {
    it('should have verdict definitions', () => {
      expect(VERDICTS).toBeDefined();
      expect(typeof VERDICTS).toBe('object');
    });

    it('should have HOWL verdict', () => {
      expect(VERDICTS).toHaveProperty('HOWL');
      expect(VERDICTS.HOWL).toHaveProperty('emoji');
      expect(VERDICTS.HOWL).toHaveProperty('threshold');
      expect(VERDICTS.HOWL).toHaveProperty('description');
    });

    it('should have WAG verdict', () => {
      expect(VERDICTS).toHaveProperty('WAG');
    });

    it('should have GROWL verdict', () => {
      expect(VERDICTS).toHaveProperty('GROWL');
    });

    it('should have BARK verdict', () => {
      expect(VERDICTS).toHaveProperty('BARK');
    });

    it('should have φ-based thresholds', () => {
      expect(VERDICTS.HOWL.threshold).toBeCloseTo(0.6, 1); // > φ⁻¹
      expect(VERDICTS.GROWL.threshold).toBeCloseTo(0.382, 2); // φ⁻²
    });
  });

  describe('REVERSE_MAPPING', () => {
    it('should map internal dimensions to public dimensions', () => {
      expect(REVERSE_MAPPING).toBeDefined();
      expect(typeof REVERSE_MAPPING).toBe('object');
    });

    it('should have mapping for TRUTH', () => {
      expect(REVERSE_MAPPING).toHaveProperty('TRUTH');
      expect(Array.isArray(REVERSE_MAPPING.TRUTH)).toBe(true);
    });

    it('should have mapping for HARMONY', () => {
      expect(REVERSE_MAPPING).toHaveProperty('HARMONY');
    });
  });

  describe('getVerdict()', () => {
    it('should return HOWL for high score (> 60%)', () => {
      const verdict = getVerdict(0.85);
      expect(verdict).toBe('HOWL');
    });

    it('should return WAG for medium-high score (52-60%)', () => {
      const verdict = getVerdict(0.55);
      expect(verdict).toBe('WAG');
    });

    it('should return GROWL for medium-low score (38.2-52%)', () => {
      const verdict = getVerdict(0.40);
      expect(verdict).toBe('GROWL');
    });

    it('should return BARK for low score (< 38.2%)', () => {
      const verdict = getVerdict(0.20);
      expect(verdict).toBe('BARK');
    });

    it('should return string verdict', () => {
      const verdict = getVerdict(0.75);
      expect(typeof verdict).toBe('string');
      expect(['HOWL', 'WAG', 'GROWL', 'BARK']).toContain(verdict);
    });
  });

  describe('mapTo4Worlds()', () => {
    it('should map 5x5 scores to 4 worlds', () => {
      const scores5x5 = {
        SOURCE_ORIGIN: 80,
        EVIDENCE_BASE: 70,
        LOGICAL_COHERENCE: 75,
        TEMPORAL_VALIDITY: 60,
        DOMAIN_FIT: 65,
      };
      const result = mapTo4Worlds(scores5x5);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle empty input', () => {
      const result = mapTo4Worlds({});
      expect(result).toBeDefined();
    });
  });

  describe('mapFrom4Worlds()', () => {
    it('should map 4 worlds scores back to 5x5', () => {
      const scores4Worlds = {
        TRUTH: 80,
        HARMONY: 75,
        COHERENCE: 70,
        PROGRESS: 65,
      };
      const result = mapFrom4Worlds(scores4Worlds);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle empty input', () => {
      const result = mapFrom4Worlds({});
      expect(result).toBeDefined();
    });
  });

  describe('getMappingDoc()', () => {
    it('should return documentation string', () => {
      const doc = getMappingDoc();
      expect(typeof doc).toBe('string');
      expect(doc.length).toBeGreaterThan(0);
    });

    it('should include dimension mappings', () => {
      const doc = getMappingDoc();
      expect(doc).toContain('FOUNDATION');
      expect(doc).toContain('SOURCE_ORIGIN');
    });
  });

  describe('LRUCache', () => {
    let cache;

    beforeEach(() => {
      cache = new LRUCache(3);
    });

    it('should instantiate with max size', () => {
      expect(cache).toBeDefined();
      expect(cache.maxSize).toBe(3);
    });

    it('should set and get values', () => {
      cache.set('key1', 'value1');
      const result = cache.get('key1');
      expect(result).toBeDefined();
      expect(result.result).toBe('value1');
    });

    it('should return null for missing keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should evict oldest when full', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // Should evict 'a'
      expect(cache.get('a')).toBeNull();
      expect(cache.get('d').result).toBe(4);
    });

    it('should update LRU order on get', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.get('a'); // Access 'a' to make it recent
      cache.set('d', 4); // Should evict 'b' now
      expect(cache.get('a').result).toBe(1);
      expect(cache.get('b')).toBeNull();
    });

    it('should have clear method', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      expect(cache.get('a')).toBeNull();
      expect(cache.get('b')).toBeNull();
    });

    it('should have getStats method', () => {
      cache.set('a', 1);
      const stats = cache.getStats();
      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(3);
      expect(stats.entries).toHaveLength(1);
    });

    it('should track hits with recordHit', () => {
      cache.set('item', 'result');
      cache.recordHit('item');
      const entry = cache.get('item');
      expect(entry.hits).toBe(2); // Initial 1 + recordHit 1
    });
  });

  describe('judgmentCache', () => {
    it('should be a pre-configured cache instance', () => {
      expect(judgmentCache).toBeDefined();
      expect(typeof judgmentCache.get).toBe('function');
      expect(typeof judgmentCache.set).toBe('function');
    });
  });

  describe('createEmptyEvidence()', () => {
    it('should create evidence structure', () => {
      const evidence = createEmptyEvidence();
      expect(evidence).toBeDefined();
      expect(evidence).toHaveProperty('version');
      expect(evidence).toHaveProperty('created');
    });

    it('should have calibration buckets', () => {
      const evidence = createEmptyEvidence();
      expect(evidence.calibration).toBeDefined();
      expect(evidence.calibration.buckets).toBeDefined();
      expect(evidence.calibration.buckets['0-20']).toBeDefined();
    });

    it('should have verdict tracking', () => {
      const evidence = createEmptyEvidence();
      expect(evidence.verdicts).toBeDefined();
      expect(evidence.verdicts.HOWL).toBeDefined();
      expect(evidence.verdicts.WAG).toBeDefined();
      expect(evidence.verdicts.GROWL).toBeDefined();
      expect(evidence.verdicts.BARK).toBeDefined();
    });

    it('should have metrics', () => {
      const evidence = createEmptyEvidence();
      expect(evidence.metrics).toBeDefined();
      expect(evidence.metrics.totalValidated).toBe(0);
    });

    it('should initialize rotation count to 0', () => {
      const evidence = createEmptyEvidence();
      expect(evidence.rotationCount).toBe(0);
    });
  });
});
