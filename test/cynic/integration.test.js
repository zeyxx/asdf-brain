/**
 * CYNIC Integration Tests
 *
 * Tests the complete CYNIC integration:
 * - Plugin manifest
 * - Hooks
 * - Identity consistency
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CYNIC Integration', () => {
  describe('Plugin Manifest', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), '.claude/plugin.json'), 'utf8')
    );

    it('should have correct name', () => {
      expect(manifest.name).toBe('asdf-brain');
    });

    it('should have CYNIC in displayName', () => {
      expect(manifest.displayName).toContain('CYNIC');
      expect(manifest.displayName).toContain('κυνικός');
    });

    it('should have version >= 2.0.0', () => {
      const version = manifest.version.split('.').map(Number);
      expect(version[0]).toBeGreaterThanOrEqual(2);
    });

    it('should register 6 skills', () => {
      expect(manifest.skills).toHaveLength(6);
      const skillNames = manifest.skills.map(s => s.name);
      expect(skillNames).toContain('judge');
      expect(skillNames).toContain('digest');
      expect(skillNames).toContain('learn');
      expect(skillNames).toContain('search');
      expect(skillNames).toContain('patterns');
      expect(skillNames).toContain('health');
    });

    it('should register 4 agents', () => {
      expect(manifest.agents).toHaveLength(4);
      const agentNames = manifest.agents.map(a => a.name);
      expect(agentNames).toContain('cynic-observer');
      expect(agentNames).toContain('cynic-digester');
      expect(agentNames).toContain('cynic-guardian');
      expect(agentNames).toContain('cynic-mentor');
    });

    it('should register 2 hooks', () => {
      expect(manifest.hooks).toHaveLength(2);
      const events = manifest.hooks.map(h => h.event);
      expect(events).toContain('PostConversation');
      expect(events).toContain('PostToolUse');
    });

    it('should have metadata with identity', () => {
      expect(manifest.metadata.identity.name).toBe('CYNIC');
      expect(manifest.metadata.identity.greek).toBe('κυνικός');
      expect(manifest.metadata.identity.emoji).toBe('🐕');
    });

    it('should have metadata with axioms', () => {
      expect(manifest.metadata.axioms.PHI).toBeDefined();
      expect(manifest.metadata.axioms.BURN).toBeDefined();
      expect(manifest.metadata.axioms.VERIFY).toBeDefined();
      expect(manifest.metadata.axioms.CULTURE).toBeDefined();
    });

    it('should have metadata with phi constants', () => {
      expect(manifest.metadata.constants.PHI).toBeCloseTo(1.618, 2);
      expect(manifest.metadata.constants.PHI_INV).toBeCloseTo(0.618, 2);
      expect(manifest.metadata.constants.PHI_INV_2).toBeCloseTo(0.382, 2);
    });
  });

  describe('Hook Files', () => {
    const hooksDir = path.join(process.cwd(), '.claude/hooks');

    it('post-conversation.js should exist', () => {
      expect(fs.existsSync(path.join(hooksDir, 'post-conversation.js'))).toBe(true);
    });

    it('observe-action.js should exist', () => {
      expect(fs.existsSync(path.join(hooksDir, 'observe-action.js'))).toBe(true);
    });

    it('post-conversation.js should export handler', () => {
      const content = fs.readFileSync(path.join(hooksDir, 'post-conversation.js'), 'utf8');
      expect(content).toMatch(/module\.exports.*handler|exports.*handler/);
    });

    it('observe-action.js should export handler', () => {
      const content = fs.readFileSync(path.join(hooksDir, 'observe-action.js'), 'utf8');
      expect(content).toMatch(/module\.exports.*handler|exports.*handler/);
    });
  });

  describe('CLAUDE.md Guidelines', () => {
    const claudeMd = fs.readFileSync(path.join(process.cwd(), 'CLAUDE.md'), 'utf8');

    it('should exist and have content', () => {
      expect(claudeMd.length).toBeGreaterThan(1000);
    });

    it('should document CYNIC', () => {
      expect(claudeMd).toContain('CYNIC');
      expect(claudeMd).toContain('κυνικός');
    });

    it('should document axioms', () => {
      expect(claudeMd).toContain('PHI');
      expect(claudeMd).toContain('VERIFY');
      expect(claudeMd).toContain('CULTURE');
      expect(claudeMd).toContain('BURN');
    });

    it('should document verdicts', () => {
      expect(claudeMd).toContain('HOWL');
      expect(claudeMd).toContain('WAG');
      expect(claudeMd).toContain('GROWL');
      expect(claudeMd).toContain('BARK');
    });

    it('should document skills', () => {
      expect(claudeMd).toContain('/judge');
      expect(claudeMd).toContain('/digest');
      expect(claudeMd).toContain('/health');
    });

    it('should document agents', () => {
      expect(claudeMd).toContain('cynic-observer');
      expect(claudeMd).toContain('cynic-guardian');
    });

    it('should have phi constants', () => {
      expect(claudeMd).toContain('61.8');
      expect(claudeMd).toContain('38.2');
    });
  });

  describe('Identity Module', () => {
    it('lib/cynic/identity.js should exist', () => {
      expect(fs.existsSync(path.join(process.cwd(), 'lib/cynic/identity.js'))).toBe(true);
    });

    it('should export all expected constants', async () => {
      const identity = await import('../../lib/cynic/identity.js');
      expect(identity.PHI).toBeDefined();
      expect(identity.IDENTITY).toBeDefined();
      expect(identity.AXIOMS).toBeDefined();
      expect(identity.VERDICTS).toBeDefined();
      expect(identity.getVerdict).toBeDefined();
    });
  });

  describe('File Structure', () => {
    const requiredPaths = [
      '.claude/plugin.json',
      '.claude/skills/judge.md',
      '.claude/skills/digest.md',
      '.claude/skills/learn.md',
      '.claude/skills/search.md',
      '.claude/skills/patterns.md',
      '.claude/skills/health.md',
      '.claude/agents/cynic-observer.md',
      '.claude/agents/cynic-digester.md',
      '.claude/agents/cynic-guardian.md',
      '.claude/agents/cynic-mentor.md',
      '.claude/hooks/post-conversation.js',
      '.claude/hooks/observe-action.js',
      'lib/cynic/identity.js',
      'CLAUDE.md'
    ];

    requiredPaths.forEach(filePath => {
      it(`${filePath} should exist`, () => {
        expect(fs.existsSync(path.join(process.cwd(), filePath))).toBe(true);
      });
    });
  });
});
