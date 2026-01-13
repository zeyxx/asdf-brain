/**
 * CYNIC Agents Tests
 *
 * Tests for .claude/agents/*.md files
 * Verifies agent definitions are properly structured
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const AGENTS_DIR = path.join(process.cwd(), '.claude/agents');

const EXPECTED_AGENTS = ['cynic-observer', 'cynic-digester', 'cynic-guardian', 'cynic-mentor'];

describe('CYNIC Agents', () => {
  describe('Agent Files', () => {
    EXPECTED_AGENTS.forEach(agentName => {
      describe(`${agentName}.md`, () => {
        const agentPath = path.join(AGENTS_DIR, `${agentName}.md`);

        it('should exist', () => {
          expect(fs.existsSync(agentPath)).toBe(true);
        });

        it('should have frontmatter', () => {
          const content = fs.readFileSync(agentPath, 'utf8');
          expect(content.startsWith('---')).toBe(true);
          expect(content.indexOf('---', 3)).toBeGreaterThan(3);
        });

        it('should have name in frontmatter', () => {
          const content = fs.readFileSync(agentPath, 'utf8');
          expect(content).toMatch(/name:\s*["']?\w+-?\w+/);
        });

        it('should have description in frontmatter', () => {
          const content = fs.readFileSync(agentPath, 'utf8');
          expect(content).toMatch(/description:/);
        });

        it('should contain CYNIC dog emoji', () => {
          const content = fs.readFileSync(agentPath, 'utf8');
          expect(content).toContain('🐕');
        });
      });
    });
  });

  describe('Agent Consistency', () => {
    it('should have all 4 agents defined', () => {
      const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
      expect(files.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('cynic-observer agent', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'cynic-observer.md'), 'utf8');

    it('should be non-blocking', () => {
      expect(content).toMatch(/non-?blocking|never.*block|silent/i);
    });

    it('should mention pattern detection', () => {
      expect(content).toMatch(/pattern|observ|detect/i);
    });

    it('should mention PostToolUse trigger', () => {
      expect(content).toMatch(/PostToolUse|tool.*use/i);
    });
  });

  describe('cynic-digester agent', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'cynic-digester.md'), 'utf8');

    it('should mention conversation digestion', () => {
      expect(content).toMatch(/digest|extract|knowledge/i);
    });

    it('should mention session/conversation end', () => {
      expect(content).toMatch(/session|conversation.*end|post.*conversation/i);
    });
  });

  describe('cynic-guardian agent', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'cynic-guardian.md'), 'utf8');

    it('should mention protection/blocking', () => {
      expect(content).toMatch(/protect|guard|block/i);
    });

    it('should mention risky operations', () => {
      expect(content).toMatch(/risk|danger|destruct|sensitive/i);
    });

    it('should be blocking behavior', () => {
      expect(content).toMatch(/blocking|confirm|warn/i);
    });
  });

  describe('cynic-mentor agent', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'cynic-mentor.md'), 'utf8');

    it('should mention suggestions/recommendations', () => {
      expect(content).toMatch(/suggest|recommend|proactiv/i);
    });

    it('should mention patterns or learning', () => {
      expect(content).toMatch(/pattern|learn|past|similar/i);
    });
  });
});
