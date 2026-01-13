/**
 * CYNIC Skills Tests
 *
 * Tests for .claude/skills/*.md files
 * Verifies skill definitions are properly structured
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const SKILLS_DIR = path.join(process.cwd(), '.claude/skills');

const EXPECTED_SKILLS = ['judge', 'digest', 'learn', 'search', 'patterns', 'health'];

describe('CYNIC Skills', () => {
  describe('Skill Files', () => {
    EXPECTED_SKILLS.forEach(skillName => {
      describe(`${skillName}.md`, () => {
        const skillPath = path.join(SKILLS_DIR, `${skillName}.md`);

        it('should exist', () => {
          expect(fs.existsSync(skillPath)).toBe(true);
        });

        it('should have frontmatter', () => {
          const content = fs.readFileSync(skillPath, 'utf8');
          expect(content.startsWith('---')).toBe(true);
          expect(content.indexOf('---', 3)).toBeGreaterThan(3);
        });

        it('should have name in frontmatter', () => {
          const content = fs.readFileSync(skillPath, 'utf8');
          expect(content).toMatch(/name:\s*["']?\w+/);
        });

        it('should have description in frontmatter', () => {
          const content = fs.readFileSync(skillPath, 'utf8');
          expect(content).toMatch(/description:/);
        });

        it('should contain CYNIC dog emoji', () => {
          const content = fs.readFileSync(skillPath, 'utf8');
          expect(content).toContain('🐕');
        });

        it('should have markdown content after frontmatter', () => {
          const content = fs.readFileSync(skillPath, 'utf8');
          const afterFrontmatter = content.split('---')[2];
          expect(afterFrontmatter.trim().length).toBeGreaterThan(50);
        });
      });
    });
  });

  describe('Skill Consistency', () => {
    it('should have all 6 skills defined', () => {
      const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.md'));
      expect(files.length).toBeGreaterThanOrEqual(6);
    });

    it('all skills should reference MCP tools', () => {
      EXPECTED_SKILLS.forEach(skillName => {
        const content = fs.readFileSync(path.join(SKILLS_DIR, `${skillName}.md`), 'utf8');
        expect(content).toMatch(/brain_\w+/);
      });
    });
  });

  describe('/judge skill', () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, 'judge.md'), 'utf8');

    it('should reference brain_cynic_judge', () => {
      expect(content).toContain('brain_cynic_judge');
    });

    it('should explain verdicts', () => {
      expect(content).toMatch(/HOWL|WAG|GROWL|BARK/);
    });

    it('should mention phi ratios', () => {
      expect(content).toMatch(/61\.8|38\.2|φ/);
    });
  });

  describe('/digest skill', () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, 'digest.md'), 'utf8');

    it('should reference brain_cynic_digest', () => {
      expect(content).toContain('brain_cynic_digest');
    });

    it('should mention knowledge extraction layers', () => {
      expect(content).toMatch(/IDEAS|MEMORY/i);
      expect(content).toMatch(/LINKS|TEACHING/i);
    });
  });

  describe('/learn skill', () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, 'learn.md'), 'utf8');

    it('should reference brain_cynic_feedback', () => {
      expect(content).toContain('brain_cynic_feedback');
    });

    it('should explain outcomes', () => {
      expect(content).toMatch(/correct|incorrect|partial/i);
    });
  });

  describe('/search skill', () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, 'search.md'), 'utf8');

    it('should reference brain_search', () => {
      expect(content).toContain('brain_search');
    });

    it('should explain search types', () => {
      expect(content).toMatch(/pattern|decision|insight/i);
    });
  });

  describe('/patterns skill', () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, 'patterns.md'), 'utf8');

    it('should reference brain_patterns', () => {
      expect(content).toContain('brain_patterns');
    });

    it('should list categories', () => {
      expect(content).toMatch(/technical|process|issues|solutions/i);
    });
  });

  describe('/health skill', () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, 'health.md'), 'utf8');

    it('should reference brain_health', () => {
      expect(content).toContain('brain_health');
    });

    it('should mention pulse/heartbeat', () => {
      expect(content).toMatch(/pulse|heartbeat|61\.8/i);
    });
  });
});
