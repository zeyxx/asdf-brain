/**
 * Tests for lib/cynic/matrices/live-matrix.js
 *
 * LiveMatrix - Real-time dimension scoring with event emission
 */

import { describe, it, expect, beforeEach } from 'vitest';

const {
  LiveMatrix,
  liveMatrix,
  DIMENSION_MAP,
  startJudgment,
  recordScore,
  completeJudgment,
  getFullMatrix,
  getBlockingDimensions,
  on,
  once,
} = require('../../../lib/cynic/matrices/live-matrix');

describe('LiveMatrix', () => {
  describe('DIMENSION_MAP', () => {
    it('should be defined', () => {
      expect(DIMENSION_MAP).toBeDefined();
      expect(typeof DIMENSION_MAP).toBe('object');
    });

    it('should have PRIMARY category', () => {
      expect(DIMENSION_MAP).toHaveProperty('PRIMARY');
      expect(DIMENSION_MAP.PRIMARY).toHaveProperty('weight');
      expect(DIMENSION_MAP.PRIMARY).toHaveProperty('dimensions');
    });

    it('should have SECONDARY category', () => {
      expect(DIMENSION_MAP).toHaveProperty('SECONDARY');
    });

    it('should have META category', () => {
      expect(DIMENSION_MAP).toHaveProperty('META');
    });

    it('should have HUMAN_LLM category', () => {
      expect(DIMENSION_MAP).toHaveProperty('HUMAN_LLM');
    });

    it('should have φ-based weights', () => {
      expect(DIMENSION_MAP.PRIMARY.weight).toBeCloseTo(2.618, 2); // φ²
      expect(DIMENSION_MAP.SECONDARY.weight).toBeCloseTo(1.618, 2); // φ
      expect(DIMENSION_MAP.META.weight).toBe(1.0);
    });
  });

  describe('LiveMatrix class', () => {
    let matrix;

    beforeEach(() => {
      matrix = new LiveMatrix();
    });

    it('should instantiate', () => {
      expect(matrix).toBeDefined();
      expect(matrix).toBeInstanceOf(LiveMatrix);
    });

    it('should have φ constants', () => {
      expect(matrix.PHI).toBeCloseTo(1.618, 2);
      expect(matrix.MAX_CONFIDENCE).toBeCloseTo(0.618, 2);
      expect(matrix.MIN_DOUBT).toBeCloseTo(0.382, 2);
    });

    it('should have startJudgment method', () => {
      expect(typeof matrix.startJudgment).toBe('function');
    });

    it('should have recordScore method', () => {
      expect(typeof matrix.recordScore).toBe('function');
    });

    it('should have completeJudgment method', () => {
      expect(typeof matrix.completeJudgment).toBe('function');
    });

    it('should have getFullMatrix method', () => {
      expect(typeof matrix.getFullMatrix).toBe('function');
    });

    it('should start a judgment with ID', () => {
      matrix.startJudgment('test-123');
      expect(matrix.judgmentId).toBe('test-123');
      expect(matrix.startTime).toBeDefined();
    });

    it('should reset state on start', () => {
      matrix.startJudgment('first');
      matrix.recordScore('TRUTH', 80);
      matrix.startJudgment('second');
      expect(matrix.judgmentId).toBe('second');
      expect(Object.keys(matrix.scores)).toHaveLength(0);
    });

    it('should record score for a dimension', () => {
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 75, { reason: 'test' });
      expect(matrix.scores.TRUTH).toBeDefined();
      expect(matrix.scores.TRUTH.score).toBe(75);
    });

    it('should track if dimension passed threshold', () => {
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 80); // threshold is 70
      expect(matrix.scores.TRUTH.passed).toBe(true);
    });

    it('should track if dimension failed threshold', () => {
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 50); // threshold is 70
      expect(matrix.scores.TRUTH.passed).toBe(false);
    });

    it('should get full matrix state', () => {
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 80);
      const fullMatrix = matrix.getFullMatrix();
      expect(fullMatrix).toBeDefined();
      expect(typeof fullMatrix).toBe('object');
    });

    it('should get blocking dimensions', () => {
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 50); // below threshold
      const blocking = matrix.getBlockingDimensions();
      expect(Array.isArray(blocking)).toBe(true);
      expect(blocking[0].dimension).toBe('TRUTH');
      expect(blocking[0].passed).toBe(false);
    });

    it('should complete judgment with result', () => {
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 80);
      const result = matrix.completeJudgment({});
      expect(result).toBeDefined();
      expect(result.judgmentId).toBe('test');
    });

    it('should include world scores in result', () => {
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 80); // BERIAH
      matrix.recordScore('HARMONY', 70); // ATZILUT
      const result = matrix.completeJudgment({});
      expect(result.worldScores).toBeDefined();
    });

    it('should include category scores in result', () => {
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 80); // PRIMARY
      matrix.recordScore('SECURE', 75); // SECONDARY
      const result = matrix.completeJudgment({});
      expect(result.categoryScores).toBeDefined();
    });
  });

  describe('liveMatrix singleton', () => {
    it('should be a LiveMatrix instance', () => {
      expect(liveMatrix).toBeDefined();
      expect(liveMatrix).toBeInstanceOf(LiveMatrix);
    });
  });

  describe('Exported functions', () => {
    it('startJudgment should be a function', () => {
      expect(typeof startJudgment).toBe('function');
    });

    it('recordScore should be a function', () => {
      expect(typeof recordScore).toBe('function');
    });

    it('completeJudgment should be a function', () => {
      expect(typeof completeJudgment).toBe('function');
    });

    it('getFullMatrix should be a function', () => {
      expect(typeof getFullMatrix).toBe('function');
    });

    it('getBlockingDimensions should be a function', () => {
      expect(typeof getBlockingDimensions).toBe('function');
    });

    it('on should be a function for event subscription', () => {
      expect(typeof on).toBe('function');
    });

    it('once should be a function for one-time event subscription', () => {
      expect(typeof once).toBe('function');
    });
  });

  describe('Event emission', () => {
    let matrix;

    beforeEach(() => {
      matrix = new LiveMatrix();
    });

    it('should emit judgment:start event', () => {
      let eventData = null;
      matrix.on('judgment:start', (data) => { eventData = data; });
      matrix.startJudgment('test-123');
      expect(eventData).toBeDefined();
      expect(eventData.judgmentId).toBe('test-123');
    });

    it('should include categories in start event', () => {
      let eventData = null;
      matrix.on('judgment:start', (data) => { eventData = data; });
      matrix.startJudgment('test');
      expect(eventData.categories).toBeDefined();
      expect(eventData.categories).toContain('PRIMARY');
    });

    it('should emit dimension:score event', () => {
      let eventData = null;
      matrix.on('dimension:score', (data) => { eventData = data; });
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 80, { reason: 'test' });
      expect(eventData).toBeDefined();
      expect(eventData.dimension).toBe('TRUTH');
      expect(eventData.score).toBe(80);
    });

    it('should emit warning for unknown dimension', () => {
      let eventData = null;
      matrix.on('warning', (data) => { eventData = data; });
      matrix.startJudgment('test');
      matrix.recordScore('UNKNOWN_DIM', 50);
      expect(eventData).toBeDefined();
      expect(eventData.message).toContain('Unknown dimension');
    });
  });

  describe('World and category tracking', () => {
    let matrix;

    beforeEach(() => {
      matrix = new LiveMatrix();
    });

    it('should track scores by world', () => {
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 80); // BERIAH
      expect(matrix.worldScores.BERIAH.scores).toHaveLength(1);
    });

    it('should track scores by category', () => {
      matrix.startJudgment('test');
      matrix.recordScore('TRUTH', 80); // PRIMARY
      expect(matrix.categoryScores.PRIMARY.scores).toHaveLength(1);
    });

    it('should have getWorldScores method', () => {
      expect(typeof matrix.getWorldScores).toBe('function');
    });

    it('should have getCategoryScores method', () => {
      expect(typeof matrix.getCategoryScores).toBe('function');
    });

    it('should have getPassedDimensions method', () => {
      expect(typeof matrix.getPassedDimensions).toBe('function');
    });
  });
});
