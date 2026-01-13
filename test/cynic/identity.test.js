/**
 * CYNIC Identity Module Tests
 *
 * Tests for lib/cynic/identity.js - the personality layer
 */

import { describe, it, expect } from 'vitest';
import {
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  PHI_SQUARED,
  PHI_CUBED,
  IDENTITY,
  AXIOMS,
  TRAITS,
  VOICE,
  VERDICTS,
  TEMPLATES,
  LOCALE,
  getVerdict,
  t,
  formatHeader,
  formatFooter,
  formatVerdictBox,
  generateReaction,
  getVoice
} from '../../lib/cynic/identity.js';

describe('CYNIC Identity', () => {
  describe('PHI Constants', () => {
    it('should define PHI as golden ratio', () => {
      expect(PHI).toBeCloseTo(1.618033988749895, 10);
    });

    it('should define PHI_INV as 1/PHI', () => {
      expect(PHI_INV).toBeCloseTo(1 / PHI, 10);
      expect(PHI_INV).toBeCloseTo(0.618033988749895, 10);
    });

    it('should define PHI_INV_2 as PHI_INV squared', () => {
      expect(PHI_INV_2).toBeCloseTo(PHI_INV * PHI_INV, 10);
      expect(PHI_INV_2).toBeCloseTo(0.381966011250105, 10);
    });

    it('should define PHI_INV_3 as PHI_INV cubed', () => {
      expect(PHI_INV_3).toBeCloseTo(PHI_INV * PHI_INV * PHI_INV, 10);
    });

    it('should define PHI_SQUARED correctly', () => {
      expect(PHI_SQUARED).toBeCloseTo(PHI * PHI, 10);
    });

    it('should define PHI_CUBED correctly', () => {
      expect(PHI_CUBED).toBeCloseTo(PHI * PHI * PHI, 10);
    });

    it('should satisfy PHI identity: PHI = 1 + 1/PHI', () => {
      expect(PHI).toBeCloseTo(1 + PHI_INV, 10);
    });
  });

  describe('IDENTITY Object', () => {
    it('should have correct name', () => {
      expect(IDENTITY.name).toBe('CYNIC');
    });

    it('should have Greek origin', () => {
      expect(IDENTITY.greek).toBe('κυνικός');
      expect(IDENTITY.pronunciation).toBe('kunikos');
      expect(IDENTITY.meaning).toBe('comme un chien');
    });

    it('should have dog emoji', () => {
      expect(IDENTITY.emoji).toBe('🐕');
    });

    it('should have tagline', () => {
      expect(IDENTITY.tagline).toBe('Loyal to truth, not to comfort');
    });

    it('should have EN/FR descriptions', () => {
      expect(IDENTITY.description.en).toBeDefined();
      expect(IDENTITY.description.fr).toBeDefined();
      expect(IDENTITY.description.en).toContain('skeptical dog');
      expect(IDENTITY.description.fr).toContain('chien sceptique');
    });
  });

  describe('AXIOMS', () => {
    it('should have 4 axioms', () => {
      expect(Object.keys(AXIOMS)).toHaveLength(4);
    });

    it('should have PHI axiom', () => {
      expect(AXIOMS.PHI.symbol).toBe('φ');
      expect(AXIOMS.PHI.world).toBe('ATZILUT');
      expect(AXIOMS.PHI.principle).toContain('1.618');
    });

    it('should have VERIFY axiom', () => {
      expect(AXIOMS.VERIFY.symbol).toBe('✓');
      expect(AXIOMS.VERIFY.world).toBe('BERIAH');
      expect(AXIOMS.VERIFY.principle).toContain('verify');
    });

    it('should have CULTURE axiom', () => {
      expect(AXIOMS.CULTURE.symbol).toBe('⛩');
      expect(AXIOMS.CULTURE.world).toBe('YETZIRAH');
      expect(AXIOMS.CULTURE.principle).toContain('moat');
    });

    it('should have BURN axiom', () => {
      expect(AXIOMS.BURN.symbol).toBe('🔥');
      expect(AXIOMS.BURN.world).toBe('ASSIAH');
      expect(AXIOMS.BURN.principle).toContain('burn');
    });

    it('should have EN/FR descriptions for all axioms', () => {
      Object.values(AXIOMS).forEach(axiom => {
        expect(axiom.description.en).toBeDefined();
        expect(axiom.description.fr).toBeDefined();
      });
    });
  });

  describe('TRAITS', () => {
    it('should have skeptical trait at max level', () => {
      expect(TRAITS.skeptical.level).toBe(1.0);
    });

    it('should have phi-based trait levels', () => {
      expect(TRAITS.loyal.level).toBeCloseTo(PHI_INV, 10);
      expect(TRAITS.direct.level).toBeCloseTo(PHI_INV, 10);
      expect(TRAITS.protective.level).toBeCloseTo(PHI_INV, 10);
      expect(TRAITS.humble.level).toBeCloseTo(PHI_INV_2, 10);
      expect(TRAITS.playful.level).toBeCloseTo(PHI_INV_2, 10);
    });
  });

  describe('VOICE', () => {
    it('should have greeting categories', () => {
      expect(VOICE.greetings.neutral).toBeInstanceOf(Array);
      expect(VOICE.greetings.happy).toBeInstanceOf(Array);
      expect(VOICE.greetings.alert).toBeInstanceOf(Array);
    });

    it('should have approval expressions', () => {
      expect(VOICE.approvals.strong).toContain('*howls approvingly*');
      expect(VOICE.approvals.normal).toContain('*wag*');
    });

    it('should have rejection expressions', () => {
      expect(VOICE.rejections.firm).toContain('*growl*');
      expect(VOICE.rejections.absolute).toContain('*BARK BARK*');
    });
  });

  describe('VERDICTS', () => {
    it('should have 4 verdicts with correct thresholds', () => {
      expect(VERDICTS.HOWL.threshold).toBe(80);
      expect(VERDICTS.WAG.threshold).toBe(50);
      expect(VERDICTS.GROWL.threshold).toBeCloseTo(38.2, 1);
      expect(VERDICTS.BARK.threshold).toBe(0);
    });

    it('should have emojis', () => {
      expect(VERDICTS.HOWL.emoji).toBe('🎉');
      expect(VERDICTS.WAG.emoji).toBe('✅');
      expect(VERDICTS.GROWL.emoji).toBe('⚠️');
      expect(VERDICTS.BARK.emoji).toBe('🚫');
    });

    it('should have reactions', () => {
      expect(VERDICTS.HOWL.reaction).toContain('howls');
      expect(VERDICTS.WAG.reaction).toContain('wags');
      expect(VERDICTS.GROWL.reaction).toContain('growl');
      expect(VERDICTS.BARK.reaction).toContain('bark');
    });

    it('should have tail states', () => {
      expect(VERDICTS.HOWL.tailState).toContain('enthusiastically');
      expect(VERDICTS.BARK.tailState).toBe('tucks');
    });
  });

  describe('TEMPLATES', () => {
    it('should have header template', () => {
      expect(TEMPLATES.header).toContain('🐕');
      expect(TEMPLATES.header).toContain('CYNIC');
    });

    it('should have verdictBox template', () => {
      expect(TEMPLATES.verdictBox).toContain('VERDICT');
      expect(TEMPLATES.verdictBox).toContain('Score');
    });

    it('should have divider', () => {
      expect(TEMPLATES.divider).toContain('─');
    });

    it('should have footer template', () => {
      expect(TEMPLATES.footer).toContain('κυνικός');
    });

    it('progressBar should generate correct bar', () => {
      expect(TEMPLATES.progressBar(0, 10)).toBe('░░░░░░░░░░');
      expect(TEMPLATES.progressBar(100, 10)).toBe('██████████');
      expect(TEMPLATES.progressBar(50, 10)).toBe('█████░░░░░');
    });
  });

  describe('LOCALE', () => {
    it('should have EN locale', () => {
      expect(LOCALE.en.judgment).toBe('JUDGMENT');
      expect(LOCALE.en.verdict).toBe('Verdict');
      expect(LOCALE.en.confidence).toBe('Confidence');
    });

    it('should have FR locale', () => {
      expect(LOCALE.fr.judgment).toBe('JUGEMENT');
      expect(LOCALE.fr.verdict).toBe('Verdict');
      expect(LOCALE.fr.confidence).toBe('Confiance');
    });

    it('should have taglines in both languages', () => {
      expect(LOCALE.en.taglines.judge).toContain('verify');
      expect(LOCALE.fr.taglines.judge).toContain('vérifier');
    });
  });

  describe('getVerdict()', () => {
    it('should return HOWL for score >= 80', () => {
      expect(getVerdict(80)).toBe('HOWL');
      expect(getVerdict(100)).toBe('HOWL');
      expect(getVerdict(95)).toBe('HOWL');
    });

    it('should return WAG for score >= 50', () => {
      expect(getVerdict(50)).toBe('WAG');
      expect(getVerdict(79)).toBe('WAG');
      expect(getVerdict(65)).toBe('WAG');
    });

    it('should return GROWL for score >= 38.2', () => {
      expect(getVerdict(38.2)).toBe('GROWL');
      expect(getVerdict(49)).toBe('GROWL');
      expect(getVerdict(40)).toBe('GROWL');
    });

    it('should return BARK for score < 38.2', () => {
      expect(getVerdict(0)).toBe('BARK');
      expect(getVerdict(38.1)).toBe('BARK');
      expect(getVerdict(20)).toBe('BARK');
    });
  });

  describe('t() translation', () => {
    it('should return EN by default', () => {
      expect(t('judgment')).toBe('JUDGMENT');
      expect(t('verdict')).toBe('Verdict');
    });

    it('should return FR when specified', () => {
      expect(t('judgment', 'fr')).toBe('JUGEMENT');
      expect(t('verdict', 'fr')).toBe('Verdict');
    });

    it('should fall back to key if not found', () => {
      expect(t('nonexistent')).toBe('nonexistent');
    });
  });

  describe('formatHeader()', () => {
    it('should format header with action', () => {
      const header = formatHeader('judgment');
      expect(header).toContain('CYNIC');
      expect(header).toContain('JUDGMENT');
    });

    it('should support FR locale', () => {
      const header = formatHeader('judgment', 'fr');
      expect(header).toContain('JUGEMENT');
    });
  });

  describe('formatFooter()', () => {
    it('should include signature', () => {
      const footer = formatFooter('judge');
      expect(footer).toContain('κυνικός');
      expect(footer).toContain('61.8%');
    });
  });

  describe('formatVerdictBox()', () => {
    it('should format verdict box correctly', () => {
      const box = formatVerdictBox('WAG', 75, 55.5);
      expect(box).toContain('WAG');
      expect(box).toContain('75');
      expect(box).toContain('55.5');
    });
  });

  describe('generateReaction()', () => {
    it('should generate reaction for HOWL', () => {
      const reaction = generateReaction('HOWL', 60);
      expect(reaction).toContain('howls');
      expect(reaction).toContain('60.0%');
    });

    it('should generate reaction for BARK', () => {
      const reaction = generateReaction('BARK', 35);
      expect(reaction).toContain('bark');
      expect(reaction).toContain('Critical');
    });

    it('should include blocking dimensions if provided', () => {
      const reaction = generateReaction('GROWL', 45, { blocking: ['TRUTH', 'SECURE'] });
      expect(reaction).toContain('TRUTH');
      expect(reaction).toContain('SECURE');
    });
  });

  describe('getVoice()', () => {
    it('should return voice expression', () => {
      const voice = getVoice('greetings', 'neutral');
      expect(['Woof.', '*sniff*', '*ears perk*']).toContain(voice);
    });

    it('should return default for unknown category', () => {
      expect(getVoice('unknown')).toBe('*sniff*');
    });
  });
});
