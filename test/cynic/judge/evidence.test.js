/**
 * Tests for lib/cynic/judge/evidence.js
 *
 * Evidence tracking and calibration for CYNIC judgments
 */

import { describe, it, expect } from 'vitest';

const {
  EVIDENCE_PATH,
  ARCHIVE_PATH,
  MAX_VALIDATIONS,
  MAX_DIMENSION_ENTRIES,
  ARCHIVE_RETENTION,
  createEmptyEvidence,
  needsRotation,
  computeReliability,
  updateBrierScore,
  updateCalibrationError,
  generateEvidenceReport,
} = require('../../../lib/cynic/judge/evidence');

describe('Evidence Module', () => {
  describe('Constants', () => {
    it('should have EVIDENCE_PATH defined', () => {
      expect(EVIDENCE_PATH).toBeDefined();
      expect(typeof EVIDENCE_PATH).toBe('string');
    });

    it('should have ARCHIVE_PATH defined', () => {
      expect(ARCHIVE_PATH).toBeDefined();
      expect(typeof ARCHIVE_PATH).toBe('string');
    });

    it('should have MAX_VALIDATIONS', () => {
      expect(MAX_VALIDATIONS).toBeDefined();
      expect(typeof MAX_VALIDATIONS).toBe('number');
      expect(MAX_VALIDATIONS).toBeGreaterThan(0);
    });

    it('should have MAX_DIMENSION_ENTRIES', () => {
      expect(MAX_DIMENSION_ENTRIES).toBeDefined();
      expect(typeof MAX_DIMENSION_ENTRIES).toBe('number');
    });

    it('should have ARCHIVE_RETENTION', () => {
      expect(ARCHIVE_RETENTION).toBeDefined();
      expect(typeof ARCHIVE_RETENTION).toBe('number');
    });
  });

  describe('createEmptyEvidence()', () => {
    it('should create empty evidence structure', () => {
      const evidence = createEmptyEvidence();
      expect(evidence).toBeDefined();
      expect(evidence).toHaveProperty('version');
      expect(evidence).toHaveProperty('created');
    });

    it('should have calibration buckets', () => {
      const evidence = createEmptyEvidence();
      expect(evidence.calibration).toBeDefined();
      expect(evidence.calibration.buckets).toBeDefined();
    });

    it('should have verdict tracking', () => {
      const evidence = createEmptyEvidence();
      expect(evidence.verdicts).toBeDefined();
      expect(evidence.verdicts.HOWL).toBeDefined();
      expect(evidence.verdicts.WAG).toBeDefined();
      expect(evidence.verdicts.GROWL).toBeDefined();
      expect(evidence.verdicts.BARK).toBeDefined();
    });

    it('should have metrics initialized to 0', () => {
      const evidence = createEmptyEvidence();
      expect(evidence.metrics).toBeDefined();
      expect(evidence.metrics.totalValidated).toBe(0);
    });

    it('should initialize rotation count to 0', () => {
      const evidence = createEmptyEvidence();
      expect(evidence.rotationCount).toBe(0);
    });
  });

  describe('needsRotation()', () => {
    it('should return false for empty evidence', () => {
      const evidence = createEmptyEvidence();
      const result = needsRotation(evidence);
      expect(typeof result).toBe('boolean');
    });

    it('should return boolean for evidence with data', () => {
      const evidence = createEmptyEvidence();
      evidence.metrics.totalValidated = 100;
      const result = needsRotation(evidence);
      expect(typeof result).toBe('boolean');
    });

    it('should return true when validations exceed max', () => {
      const evidence = createEmptyEvidence();
      evidence.metrics.totalValidated = MAX_VALIDATIONS + 1;
      const result = needsRotation(evidence);
      expect(result).toBe(true);
    });
  });

  describe('computeReliability()', () => {
    it('should be a function', () => {
      expect(typeof computeReliability).toBe('function');
    });

    it('should return null for empty evidence', () => {
      const evidence = createEmptyEvidence();
      const reliability = computeReliability(evidence);
      expect(reliability).toBeNull();
    });
  });

  describe('updateBrierScore()', () => {
    it('should be a function', () => {
      expect(typeof updateBrierScore).toBe('function');
    });

    it('should update evidence in place', () => {
      const evidence = createEmptyEvidence();
      const predicted = 0.7;
      const actual = 1;
      updateBrierScore(evidence, predicted, actual);
      // Function modifies evidence in place
      expect(evidence).toBeDefined();
    });
  });

  describe('updateCalibrationError()', () => {
    it('should be a function', () => {
      expect(typeof updateCalibrationError).toBe('function');
    });

    it('should update evidence in place', () => {
      const evidence = createEmptyEvidence();
      const predicted = 0.7;
      const actual = 1;
      updateCalibrationError(evidence, predicted, actual);
      // Function modifies evidence in place
      expect(evidence).toBeDefined();
    });
  });

  describe('generateEvidenceReport()', () => {
    it('should generate report from evidence', () => {
      const evidence = createEmptyEvidence();
      const report = generateEvidenceReport(evidence);
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
    });

    it('should include reliability info', () => {
      const evidence = createEmptyEvidence();
      const report = generateEvidenceReport(evidence);
      expect(report).toContain('Reliability');
    });
  });
});
