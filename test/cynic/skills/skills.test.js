/**
 * CYNIC Skills Tests
 *
 * Tests for .claude/skills/*.md files (headers)
 * and docs/skills/*-full.md files (full content)
 *
 * Progressive Disclosure Pattern:
 * - Headers (~100 tokens) in .claude/skills/
 * - Full docs (lazy-loaded) in docs/skills/
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const SKILLS_DIR = path.join(process.cwd(), '.claude/skills');
const DOCS_DIR = path.join(process.cwd(), 'docs/skills');

const EXPECTED_SKILLS = ['judge', 'digest', 'learn', 'search', 'patterns', 'health'];

/**
 * Helper to get full skill content (header + full doc)
 */
function getFullSkillContent(skillName) {
  const headerPath = path.join(SKILLS_DIR, `${skillName}.md`);
  const fullPath = path.join(DOCS_DIR, `${skillName}-full.md`);

  let content = '';
  if (fs.existsSync(headerPath)) {
    content += fs.readFileSync(headerPath, 'utf8');
  }
  if (fs.existsSync(fullPath)) {
    content += '\n' + fs.readFileSync(fullPath, 'utf8');
  }
  return content;
}

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

        it('should contain CYNIC dog emoji or reference to full docs', () => {
          const fullContent = getFullSkillContent(skillName);
          expect(fullContent).toContain('🐕');
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

    it('all skills should reference MCP tools (in full docs)', () => {
      EXPECTED_SKILLS.forEach(skillName => {
        const fullContent = getFullSkillContent(skillName);
        expect(fullContent).toMatch(/brain_\w+/);
      });
    });

    it('all skills should have progressive disclosure reference', () => {
      EXPECTED_SKILLS.forEach(skillName => {
        const headerContent = fs.readFileSync(path.join(SKILLS_DIR, `${skillName}.md`), 'utf8');
        // Headers should point to full docs
        expect(headerContent).toMatch(/docs\/skills\/.*-full\.md/);
      });
    });
  });

  // Skill-specific tests now use full content (header + full docs)
  describe('/judge skill', () => {
    const content = getFullSkillContent('judge');

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
    const content = getFullSkillContent('digest');

    it('should reference brain_cynic_digest', () => {
      expect(content).toContain('brain_cynic_digest');
    });

    it('should mention knowledge extraction layers', () => {
      expect(content).toMatch(/IDEAS|MEMORY/i);
      expect(content).toMatch(/LINKS|TEACHING/i);
    });
  });

  describe('/learn skill', () => {
    const content = getFullSkillContent('learn');

    it('should reference brain_cynic_feedback', () => {
      expect(content).toContain('brain_cynic_feedback');
    });

    it('should explain outcomes', () => {
      expect(content).toMatch(/correct|incorrect|partial/i);
    });
  });

  describe('/search skill', () => {
    const content = getFullSkillContent('search');

    it('should reference brain_search', () => {
      expect(content).toContain('brain_search');
    });

    it('should explain search types', () => {
      expect(content).toMatch(/pattern|decision|insight/i);
    });
  });

  describe('/patterns skill', () => {
    const content = getFullSkillContent('patterns');

    it('should reference brain_patterns', () => {
      expect(content).toContain('brain_patterns');
    });

    it('should list categories', () => {
      expect(content).toMatch(/technical|process|issues|solutions/i);
    });
  });

  describe('/health skill', () => {
    const content = getFullSkillContent('health');

    it('should reference brain_health', () => {
      expect(content).toContain('brain_health');
    });

    it('should mention pulse/heartbeat', () => {
      expect(content).toMatch(/pulse|heartbeat|61\.8/i);
    });
  });
});
