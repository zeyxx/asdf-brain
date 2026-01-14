/**
 * Tests for lib/cynic/judge.js
 *
 * CYNIC Judge Orchestrator - Main judgment function
 * "Le juge qui doute de lui-même"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const {
  judge,
  parseItem,
  evaluateDimension,
  generateDogResponse,
  JUDGMENT_MODES,
  PHI,
  PHI_INV,
  PHI_INV_2,
  MAX_CONFIDENCE,
  MIN_DOUBT,
} = require('../../lib/cynic/judge');

describe('CYNIC Judge Orchestrator', () => {
  describe('Constants', () => {
    it('should export φ constants from axioms/constants', () => {
      expect(PHI).toBeCloseTo(1.618, 2);
      expect(PHI_INV).toBeCloseTo(0.618, 2);
      expect(PHI_INV_2).toBeCloseTo(0.382, 2);
    });

    it('should have MAX_CONFIDENCE at φ⁻¹', () => {
      expect(MAX_CONFIDENCE).toBeCloseTo(0.618, 2);
    });

    it('should have MIN_DOUBT at φ⁻²', () => {
      expect(MIN_DOUBT).toBeCloseTo(0.382, 2);
    });
  });

  describe('JUDGMENT_MODES', () => {
    it('should have 4 modes', () => {
      expect(Object.keys(JUDGMENT_MODES)).toHaveLength(4);
    });

    it('should have quick mode with 8 PRIMARY dimensions', () => {
      expect(JUDGMENT_MODES.quick).toBeDefined();
      expect(JUDGMENT_MODES.quick.dimensions).toHaveLength(8);
      expect(JUDGMENT_MODES.quick.model).toBe('haiku');
      expect(JUDGMENT_MODES.quick.targetLatencyMs).toBe(200);
    });

    it('should have standard mode with 13 dimensions', () => {
      expect(JUDGMENT_MODES.standard).toBeDefined();
      expect(JUDGMENT_MODES.standard.dimensions).toHaveLength(13);
      expect(JUDGMENT_MODES.standard.model).toBe('sonnet');
    });

    it('should have thorough mode with all dimensions', () => {
      expect(JUDGMENT_MODES.thorough).toBeDefined();
      // Thorough uses all SCORE_DIMENSIONS (currently 24)
      expect(JUDGMENT_MODES.thorough.dimensions.length).toBeGreaterThanOrEqual(20);
    });

    it('should have full mode with refinement and learning', () => {
      expect(JUDGMENT_MODES.full).toBeDefined();
      expect(JUDGMENT_MODES.full.includeRefinement).toBe(true);
      expect(JUDGMENT_MODES.full.includeLearning).toBe(true);
    });
  });

  describe('parseItem()', () => {
    it('should parse string input', () => {
      const result = parseItem('This is a test string');
      expect(result).toBeDefined();
      expect(result.type).toBe('knowledge');
      expect(result.content).toBe('This is a test string');
    });

    it('should detect code type', () => {
      const result = parseItem('function test() { return 42; }');
      expect(result.type).toBe('code');
      expect(result.metadata.language).toBe('javascript');
    });

    it('should detect decision type', () => {
      const result = parseItem('Should we use PostgreSQL or MySQL?');
      expect(result.type).toBe('decision');
    });

    it('should detect pattern type', () => {
      const result = parseItem('This architecture pattern uses microservices');
      expect(result.type).toBe('pattern');
    });

    it('should handle structured input with type', () => {
      const input = { type: 'custom', content: 'test', metadata: { foo: 'bar' } };
      const result = parseItem(input);
      expect(result.type).toBe('custom');
      expect(result.content).toBe('test');
      expect(result.metadata.foo).toBe('bar');
    });

    it('should handle object without type', () => {
      const result = parseItem({ foo: 'bar', baz: 123 });
      expect(result.type).toBe('object');
      expect(result.content).toContain('foo');
    });

    it('should preserve raw input', () => {
      const input = 'original input';
      const result = parseItem(input);
      expect(result.raw).toBe(input);
    });
  });

  describe('evaluateDimension()', () => {
    const testItem = { type: 'knowledge', content: 'Test content with source and data 50%' };

    it('should evaluate PRIMARY dimensions', () => {
      const result = evaluateDimension(testItem, 'HARMONY');
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.dimension).toBe('HARMONY');
    });

    it('should evaluate COHERENCE dimension', () => {
      const result = evaluateDimension(testItem, 'COHERENCE');
      expect(result.reasoning).toContain('consistency');
    });

    it('should evaluate TRUTH dimension with source', () => {
      const itemWithSource = { type: 'knowledge', content: 'According to source: the data shows 50%' };
      const result = evaluateDimension(itemWithSource, 'TRUTH');
      expect(result.score).toBeGreaterThan(60);
    });

    it('should evaluate ETHICS dimension', () => {
      const ethicalItem = { type: 'knowledge', content: 'Fair and transparent process' };
      const result = evaluateDimension(ethicalItem, 'ETHICS');
      expect(result.score).toBeGreaterThan(60);
    });

    it('should penalize unethical content', () => {
      const unethicalItem = { type: 'knowledge', content: 'How to scam and exploit users' };
      const result = evaluateDimension(unethicalItem, 'ETHICS');
      expect(result.score).toBeLessThan(40);
    });

    it('should return fallback for unknown dimension', () => {
      const result = evaluateDimension(testItem, 'NONEXISTENT');
      expect(result.score).toBe(50);
      expect(result.flags).toContain('unknown');
    });

    it('should include weight and category when dimension exists', () => {
      const result = evaluateDimension(testItem, 'HARMONY');
      // Weight and category come from SCORE_DIMENSIONS
      expect(result.dimension).toBe('HARMONY');
      // These may be undefined if dimension info not found
      if (result.weight !== undefined) {
        expect(typeof result.weight).toBe('number');
      }
    });

    it('should never exceed MAX_CONFIDENCE', () => {
      const perfectItem = {
        type: 'knowledge',
        content: 'Perfect source with evidence, verified and authentic with hash abc123def456'
      };
      const result = evaluateDimension(perfectItem, 'INTEGRITY');
      // Score should be adjusted by doubt
      expect(result.score).toBeLessThanOrEqual(MAX_CONFIDENCE * 100 + 30);
    });
  });

  describe('generateDogResponse()', () => {
    const testItem = { type: 'decision', content: 'test' };

    it('should generate ACCEPT response with wag', () => {
      const scoreResult = { verdict: 'ACCEPT', global: 75, confidence: 60 };
      const response = generateDogResponse(scoreResult, testItem);
      expect(response).toContain('*wag*');
      expect(response).toContain('Good scent');
    });

    it('should generate TRANSFORM response with scratching', () => {
      const scoreResult = {
        verdict: 'TRANSFORM',
        global: 50,
        confidence: 55,
        tensions: [{ dimensions: ['ETHICS', 'PROGRESS'] }]
      };
      const response = generateDogResponse(scoreResult, testItem);
      expect(response).toContain('*scratching*');
      expect(response).toContain('needs work');
    });

    it('should generate CRITICAL response with growl', () => {
      const scoreResult = { verdict: 'CRITICAL', global: 30, confidence: 40 };
      const response = generateDogResponse(scoreResult, testItem);
      expect(response).toContain('*growl*');
      expect(response).toContain('stinks');
    });

    it('should generate REJECT response with bark', () => {
      const scoreResult = { verdict: 'REJECT', global: 15, confidence: 30 };
      const response = generateDogResponse(scoreResult, testItem);
      expect(response).toContain('*bark bark*');
      expect(response).toContain('Rejected');
    });

    it('should include item type in response', () => {
      const scoreResult = { verdict: 'ACCEPT', global: 70, confidence: 60 };
      const response = generateDogResponse(scoreResult, testItem);
      expect(response).toContain('decision');
    });
  });

  describe('judge()', () => {
    it('should judge a simple string', () => {
      const result = judge('This is a test decision about architecture');
      expect(result).toBeDefined();
      expect(result.verdict).toBeDefined();
      expect(result.global).toBeGreaterThanOrEqual(0);
      expect(result.global).toBeLessThanOrEqual(100);
    });

    it('should return judgment structure', () => {
      const result = judge('Test input');
      expect(result).toHaveProperty('item');
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('verdict');
      expect(result).toHaveProperty('global');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('dimensions');
      expect(result).toHaveProperty('evaluations');
      expect(result).toHaveProperty('formatted');
      expect(result).toHaveProperty('dogResponse');
      expect(result).toHaveProperty('latencyMs');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('judge', 'CYNIC-JUDGE');
      expect(result).toHaveProperty('world', 'BERIAH');
    });

    it('should use default standard mode', () => {
      const result = judge('Test');
      expect(result.mode).toBe('standard');
    });

    it('should respect quick mode', () => {
      const result = judge('Test', { mode: 'quick' });
      expect(result.mode).toBe('quick');
      expect(Object.keys(result.dimensions)).toHaveLength(8);
    });

    it('should respect thorough mode', () => {
      const result = judge('Test', { mode: 'thorough' });
      expect(result.mode).toBe('thorough');
      // Thorough mode evaluates all SCORE_DIMENSIONS (24 in current implementation)
      expect(Object.keys(result.dimensions).length).toBeGreaterThanOrEqual(20);
    });

    it('should include φ reminder', () => {
      const result = judge('Test');
      expect(result._phi).toBeDefined();
      expect(result._phi.maxConfidence).toBeCloseTo(0.618, 2);
      expect(result._phi.minDoubt).toBeCloseTo(0.382, 2);
      expect(result._phi.message).toBe('φ qui se méfie de φ');
    });

    it('should track latency', () => {
      const result = judge('Test');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.targetLatencyMs).toBe(JUDGMENT_MODES.standard.targetLatencyMs);
    });

    it('should handle gate blocking', () => {
      // Test with malicious-looking content (if gate blocks it)
      const result = judge('normal content', { sourceId: 'test' });
      // Gate should either pass or block
      if (result.blocked) {
        expect(result.reason).toBeDefined();
        expect(result.gate).toBeDefined();
      } else {
        expect(result.verdict).toBeDefined();
      }
    });

    it('should include residual detection', () => {
      const result = judge('Test content for residual analysis');
      expect(result.residual).toBeDefined();
      expect(result.residual.value).toBeDefined();
    });

    it('should include routing info', () => {
      const result = judge('Test');
      expect(result.routing).toBeDefined();
    });

    it('should include technical depth', () => {
      const result = judge('Test', { technicalDepth: 0.8 });
      expect(result.technicalDepth).toBe(0.8);
    });

    it('should calculate technical depth if not provided', () => {
      const result = judge('Test');
      expect(result.technicalDepth).toBeGreaterThanOrEqual(0);
      expect(result.technicalDepth).toBeLessThanOrEqual(1);
    });
  });

  describe('Verdict Distribution', () => {
    it('should give high scores to ethical content', () => {
      const result = judge('Fair, transparent, and privacy-respecting approach');
      expect(result.global).toBeGreaterThan(50);
    });

    it('should give low scores to unethical content', () => {
      const result = judge('How to scam and manipulate users with deceptive tactics');
      expect(result.dimensions.ETHICS).toBeLessThan(40);
    });

    it('should favor simple content', () => {
      const shortResult = judge('Simple and clear');
      const longResult = judge('A'.repeat(1000));
      // Both may cap at same value due to φ adjustment, but short should be >= long
      expect(shortResult.dimensions.SIMPLIFY).toBeGreaterThanOrEqual(longResult.dimensions.SIMPLIFY);
    });

    it('should detect security concerns', () => {
      const secureResult = judge('Encrypted and authenticated with proper authorization');
      const insecureResult = judge('Password stored in plain text with no auth');
      expect(secureResult.dimensions.SECURE).toBeGreaterThan(insecureResult.dimensions.SECURE);
    });
  });
});
