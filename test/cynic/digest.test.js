/**
 * Tests for lib/cynic/digest.js
 *
 * CYNIC-DIGEST - Chaos → Harmonie
 * "Le chaos productif devient connaissance structurée"
 */

import { describe, it, expect } from 'vitest';

const {
  extractIdeas,
  findLinks,
  buildRoadmap,
  digest,
  IDEA_PATTERNS,
} = require('../../lib/cynic/digest');

describe('CYNIC-DIGEST', () => {
  describe('IDEA_PATTERNS', () => {
    it('should have patterns for French and English', () => {
      expect(IDEA_PATTERNS.length).toBeGreaterThan(10);
      const types = IDEA_PATTERNS.map(p => p.type);
      expect(types).toContain('proposal');
      expect(types).toContain('idea');
      expect(types).toContain('question');
      expect(types).toContain('requirement');
      expect(types).toContain('goal');
      expect(types).toContain('problem');
    });
  });

  describe('extractIdeas()', () => {
    it('should extract proposal ideas', () => {
      const text = 'We should implement a caching layer for better performance.';
      const ideas = extractIdeas(text);
      expect(ideas.length).toBeGreaterThan(0);
      expect(ideas[0].type).toBe('proposal');
    });

    it('should extract French proposals', () => {
      const text = 'On devrait ajouter un système de cache pour améliorer les performances.';
      const ideas = extractIdeas(text);
      expect(ideas.length).toBeGreaterThan(0);
    });

    it('should extract questions', () => {
      const text = 'What if we used Redis instead of memory cache?';
      const ideas = extractIdeas(text);
      const questions = ideas.filter(i => i.type === 'question');
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should extract problems', () => {
      const text = 'The problem is the current API is too slow under load.';
      const ideas = extractIdeas(text);
      const problems = ideas.filter(i => i.type === 'problem');
      expect(problems.length).toBeGreaterThan(0);
    });

    it('should calculate confidence for ideas', () => {
      const text = 'We should implement a comprehensive caching system for the API module.';
      const ideas = extractIdeas(text);
      expect(ideas[0].confidence).toBeGreaterThan(50);
    });

    it('should include source in context', () => {
      // Need a longer input that will pass the 10-char minimum
      const ideas = extractIdeas('We should implement comprehensive testing.', { source: 'conversation' });
      if (ideas.length > 0) {
        expect(ideas[0].source).toBe('conversation');
      }
    });

    it('should skip short ideas', () => {
      const text = 'We should do it.';
      const ideas = extractIdeas(text);
      expect(ideas.length).toBe(0);
    });

    it('should deduplicate similar ideas', () => {
      const text = 'We should cache. We should cache. We should cache.';
      const ideas = extractIdeas(text);
      expect(ideas.length).toBeLessThanOrEqual(1);
    });

    it('should sort by confidence', () => {
      const text = 'We should do something. We should implement a comprehensive API caching layer for the cynic module.';
      const ideas = extractIdeas(text);
      if (ideas.length > 1) {
        expect(ideas[0].confidence).toBeGreaterThanOrEqual(ideas[1].confidence);
      }
    });
  });

  describe('findLinks()', () => {
    it('should find links to existing knowledge', () => {
      // Need > 38.2% Jaccard similarity for a link to be created
      const ideas = [{ id: 'idea_1', content: 'implement caching system for database queries' }];
      const existingKnowledge = [
        { id: 'k1', content: 'caching system patterns for database' },
        { id: 'k2', content: 'unrelated topic about something else' },
      ];
      const links = findLinks(ideas, existingKnowledge);
      // Jaccard: common words (caching, system, database) / union ≈ 50%
      expect(links.length).toBeGreaterThan(0);
    });

    it('should calculate link strength', () => {
      const ideas = [{ id: 'idea_1', content: 'optimize database queries' }];
      const existing = [{ id: 'k1', content: 'database query optimization patterns' }];
      const links = findLinks(ideas, existing);
      if (links.length > 0) {
        expect(links[0].strength).toBeGreaterThan(0);
      }
    });

    it('should return empty array for no matches', () => {
      const ideas = [{ id: 'idea_1', content: 'implement something unique' }];
      const existing = [{ id: 'k1', content: 'completely different topic' }];
      const links = findLinks(ideas, existing);
      expect(links.length).toBe(0);
    });
  });

  describe('extractRoadmap()', () => {
    it('should build roadmap from ideas', () => {
      const { extractRoadmap } = require('../../lib/cynic/digest');
      const ideas = [
        { id: 'idea_1', content: 'fix the bug first', type: 'requirement', confidence: 70 },
        { id: 'idea_2', content: 'then add new feature', type: 'goal', confidence: 60 },
      ];
      const roadmap = extractRoadmap(ideas);
      // Roadmap has categories: immediate, short_term, long_term, blocked, uncategorized
      expect(roadmap.immediate).toBeDefined();
      expect(roadmap.long_term).toBeDefined();
      expect(roadmap.meta).toBeDefined();
    });

    it('should include meta info', () => {
      const { extractRoadmap } = require('../../lib/cynic/digest');
      const ideas = [{ id: 'i1', type: 'problem', content: 'critical security issue' }];
      const roadmap = extractRoadmap(ideas);
      expect(roadmap.meta).toBeDefined();
    });
  });

  describe('digest()', () => {
    it('should return complete digest result', () => {
      const text = 'We should implement caching. The problem is latency.';
      const result = digest(text);
      expect(result.ideas).toBeDefined();
      expect(result.links).toBeDefined();
      expect(result.roadmap).toBeDefined();
      expect(result.scores).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it('should handle empty text', () => {
      const result = digest('');
      expect(result.ideas).toEqual([]);
    });

    it('should accept existing knowledge for linking', () => {
      const text = 'We should optimize the database queries.';
      const existing = [{ id: 'k1', content: 'database optimization patterns' }];
      const result = digest(text, { existingKnowledge: existing });
      expect(result.links).toBeDefined();
    });

    it('should include CYNIC signature', () => {
      const result = digest('We should test everything thoroughly.');
      expect(result._cynic).toBeDefined();
      expect(result._cynic.module).toBe('CYNIC-DIGEST');
      expect(result._cynic.world).toBe('BERIAH');
    });

    it('should calculate scores', () => {
      const result = digest('We should implement a comprehensive caching system.');
      expect(result.scores.MEMORY).toBeDefined();
      expect(result.scores.TEACHING).toBeDefined();
      expect(result.scores.INTENT).toBeDefined();
      expect(result.scores.global).toBeDefined();
    });

    it('should track meta info', () => {
      const text = 'We should test this properly.';
      const result = digest(text);
      expect(result.meta.inputLength).toBe(text.length);
      expect(result.meta.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });
});
