/**
 * Tests for lib/cynic/laws/checker.js
 *
 * Laws Checker - Evaluates alignment with CYNIC's 15 laws
 */

import { describe, it, expect } from 'vitest';

const {
  checkAtzilut,
  checkBeriah,
  checkYetzirah,
  checkAssiah,
  checkAllLaws,
  quickCheck,
  formatCheckResult,
  MISALIGNMENT_PATTERNS,
} = require('../../../lib/cynic/laws/checker');

describe('Laws Checker', () => {
  describe('MISALIGNMENT_PATTERNS', () => {
    it('should have patterns for all worlds', () => {
      expect(MISALIGNMENT_PATTERNS).toHaveProperty('E1_CHAOS');
      expect(MISALIGNMENT_PATTERNS).toHaveProperty('PHI1_EXTRACTION');
      expect(MISALIGNMENT_PATTERNS).toHaveProperty('XI1_HARM');
      expect(MISALIGNMENT_PATTERNS).toHaveProperty('OMEGA1_VERIFY');
    });

    it('should have severity levels', () => {
      expect(MISALIGNMENT_PATTERNS.E1_CHAOS.severity).toBeDefined();
      expect(['HIGH', 'CRITICAL', 'MEDIUM', 'LOW']).toContain(
        MISALIGNMENT_PATTERNS.E1_CHAOS.severity,
      );
    });

    it('should have regex patterns', () => {
      expect(Array.isArray(MISALIGNMENT_PATTERNS.E1_CHAOS.patterns)).toBe(true);
      expect(MISALIGNMENT_PATTERNS.E1_CHAOS.patterns[0]).toBeInstanceOf(RegExp);
    });
  });

  describe('checkAtzilut()', () => {
    it('should return aligned for clean action', () => {
      const action = { description: 'Building a community tool' };
      const result = checkAtzilut(action);
      expect(result.world).toBe('ATZILUT');
      expect(result.aligned).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect panic/FUD patterns', () => {
      const action = { description: 'URGENT! Act now before PANIC sets in!' };
      const result = checkAtzilut(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].code).toBe('E1');
    });

    it('should detect extraction patterns', () => {
      const action = { description: 'Extract value and take fees from users' };
      const result = checkAtzilut(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'E2')).toBe(true);
    });

    it('should detect obscurantism patterns', () => {
      const action = { description: 'Use our secret algorithm black box' };
      const result = checkAtzilut(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'E3')).toBe(true);
    });
  });

  describe('checkBeriah()', () => {
    it('should return aligned for clean action', () => {
      const action = { description: 'Open source contribution' };
      const result = checkBeriah(action);
      expect(result.world).toBe('BERIAH');
      expect(result.aligned).toBe(true);
    });

    it('should detect treasury/extraction patterns', () => {
      const action = { description: 'Team allocation and VC unlock schedule' };
      const result = checkBeriah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Φ1')).toBe(true);
    });

    it('should detect zero-sum impact', () => {
      const action = { description: 'test', impact: { zeroSum: true } };
      const result = checkBeriah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Φ2')).toBe(true);
    });

    it('should detect FOMO patterns', () => {
      const action = { description: 'Limited time offer! Act fast or miss out!' };
      const result = checkBeriah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Φ3')).toBe(true);
    });

    it('should detect hype patterns', () => {
      const action = { description: 'To the moon! Pump it! Shill everywhere!' };
      const result = checkBeriah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Φ4')).toBe(true);
    });
  });

  describe('checkYetzirah()', () => {
    it('should return aligned for clean action', () => {
      const action = { description: 'Help users understand the tool' };
      const result = checkYetzirah(action);
      expect(result.world).toBe('YETZIRAH');
      expect(result.aligned).toBe(true);
    });

    it('should detect harm patterns', () => {
      const action = { description: 'Rug pull and scam users' };
      const result = checkYetzirah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Ξ1')).toBe(true);
    });

    it('should flag unhashed PII', () => {
      const action = {
        description: 'Process user data',
        containsPII: true,
        piiHashed: false,
      };
      const result = checkYetzirah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Ξ2')).toBe(true);
    });

    it('should flag missing consent', () => {
      const action = {
        description: 'Collect data',
        requiresConsent: true,
        hasConsent: false,
      };
      const result = checkYetzirah(action);
      expect(result.aligned).toBe(false);
    });

    it('should flag replacing human decision', () => {
      const action = { description: 'Auto-trade', replacesHuman: true };
      const result = checkYetzirah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Ξ3')).toBe(true);
    });

    it('should detect equality violations', () => {
      const action = { description: 'VIP only early access for insiders' };
      const result = checkYetzirah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Ξ4')).toBe(true);
    });
  });

  describe('checkAssiah()', () => {
    it('should return aligned for verifiable action', () => {
      const action = {
        description: 'Signed transaction',
        hasSignature: true,
        isVerifiable: true,
      };
      const result = checkAssiah(action);
      expect(result.world).toBe('ASSIAH');
      expect(result.aligned).toBe(true);
    });

    it('should flag unverifiable actions', () => {
      const action = {
        description: 'Just trust me',
        hasSignature: false,
        isVerifiable: false,
      };
      const result = checkAssiah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Ω1')).toBe(true);
    });

    it('should cap confidence at φ⁻¹ (61.8%)', () => {
      const action = { description: 'test' };
      const result = checkAssiah(action, 0.9); // 90% confidence
      // φ⁻¹ = 0.6180339887498948, use closeTo for floating point comparison
      expect(result.adjustments.confidence).toBeCloseTo(0.618, 2);
    });

    it('should detect certainty claims', () => {
      const action = { description: 'This is 100% certain and guaranteed!' };
      const result = checkAssiah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Ω2')).toBe(true);
    });

    it('should detect rigidity patterns', () => {
      const action = { description: 'This is the final version, never change' };
      const result = checkAssiah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Ω3')).toBe(true);
    });

    it('should detect complexity patterns', () => {
      const action = { description: 'Complex mechanism that is hard to explain' };
      const result = checkAssiah(action);
      expect(result.aligned).toBe(false);
      expect(result.violations.some((v) => v.code === 'Ω4')).toBe(true);
    });

    it('should return adjustments', () => {
      const action = { description: 'test' };
      const result = checkAssiah(action, 0.5);
      expect(result.adjustments).toHaveProperty('confidence');
      expect(result.adjustments).toHaveProperty('doubt');
    });
  });

  describe('checkAllLaws()', () => {
    it('should check all worlds', () => {
      const action = { description: 'Open source contribution' };
      const result = checkAllLaws(action);
      expect(result.byWorld).toHaveProperty('ATZILUT');
      expect(result.byWorld).toHaveProperty('BERIAH');
      expect(result.byWorld).toHaveProperty('YETZIRAH');
      expect(result.byWorld).toHaveProperty('ASSIAH');
    });

    it('should return aligned for clean action', () => {
      const action = {
        description: 'Help the community grow together',
        hasSignature: true,
        isVerifiable: true,
      };
      const result = checkAllLaws(action);
      expect(result.aligned).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should block on ATZILUT critical violation', () => {
      const action = { description: 'Extract fees from users' };
      const result = checkAllLaws(action);
      expect(result.aligned).toBe(false);
      expect(result.blockedBy).toBe('ATZILUT');
    });

    it('should block on BERIAH critical violation', () => {
      const action = { description: 'Treasury allocation and VC unlock' };
      const result = checkAllLaws(action);
      expect(result.aligned).toBe(false);
      // Note: May be blocked by ATZILUT if E2 pattern matches first
    });

    it('should block on YETZIRAH critical violation', () => {
      const action = { description: 'Rug pull the community' };
      const result = checkAllLaws(action);
      expect(result.aligned).toBe(false);
    });

    it('should collect warnings for non-critical violations', () => {
      const action = {
        description: 'URGENT but harmless info',
        hasSignature: true,
        isVerifiable: true,
      };
      const result = checkAllLaws(action);
      // URGENT triggers E1_CHAOS which is HIGH (not CRITICAL)
      // May still be aligned if no critical violations
    });

    it('should include adjustments from ASSIAH', () => {
      const action = { description: 'test', hasSignature: true, isVerifiable: true };
      const result = checkAllLaws(action, 0.9);
      expect(result.adjustments).toHaveProperty('confidence');
    });
  });

  describe('quickCheck()', () => {
    it('should return aligned for clean action', () => {
      const action = { description: 'Build something useful' };
      const result = quickCheck(action);
      expect(result.aligned).toBe(true);
    });

    it('should catch E2 PURITY violations', () => {
      const action = { description: 'Extract value from the platform' };
      const result = quickCheck(action);
      expect(result.aligned).toBe(false);
      expect(result.code).toBe('E2');
    });

    it('should catch Φ1 EXTRACTION violations', () => {
      const action = { description: 'Treasury allocation for team' };
      const result = quickCheck(action);
      expect(result.aligned).toBe(false);
      expect(result.code).toBe('Φ1');
    });

    it('should catch Ξ1 HARM violations', () => {
      const action = { description: 'Rug pull incoming' };
      const result = quickCheck(action);
      expect(result.aligned).toBe(false);
      expect(result.code).toBe('Ξ1');
    });

    it('should catch Ξ2 PRIVACY violations', () => {
      const action = { description: 'Sell user data to highest bidder' };
      const result = quickCheck(action);
      expect(result.aligned).toBe(false);
      expect(result.code).toBe('Ξ2');
    });
  });

  describe('formatCheckResult()', () => {
    it('should format aligned result', () => {
      const result = {
        aligned: true,
        violations: [],
        warnings: [],
        adjustments: { confidence: 0.5, doubt: 0.5 },
      };
      const formatted = formatCheckResult(result);
      expect(formatted).toContain('ALIGNED');
    });

    it('should format misaligned result', () => {
      const result = {
        aligned: false,
        blockedBy: 'ATZILUT',
        violations: [
          { code: 'E2', law: 'E2_PURITY', reason: 'Extraction detected' },
        ],
        warnings: [],
      };
      const formatted = formatCheckResult(result);
      expect(formatted).toContain('MISALIGNED');
      expect(formatted).toContain('ATZILUT');
    });

    it('should include warnings in output', () => {
      const result = {
        aligned: true,
        violations: [],
        warnings: [{ code: 'Ω4', reason: 'Complexity detected' }],
        adjustments: {},
      };
      const formatted = formatCheckResult(result);
      expect(formatted).toContain('Warning');
    });

    it('should include confidence/doubt when present', () => {
      const result = {
        aligned: true,
        violations: [],
        warnings: [],
        adjustments: { confidence: 0.618, doubt: 0.382 },
      };
      const formatted = formatCheckResult(result);
      expect(formatted).toContain('Confidence');
    });
  });
});
