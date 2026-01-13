/**
 * Tests for lib/cynic/dimensions/primary/progress.js
 *
 * PROGRESS Dimension - "Avance-t-on vers la singularité?"
 */

import { describe, it, expect, beforeEach } from 'vitest';

const { ProgressEvaluator } = require('../../../../lib/cynic/dimensions/primary/progress');

describe('PROGRESS Dimension', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new ProgressEvaluator();
  });

  describe('Metadata', () => {
    it('should have name PROGRESS', () => {
      expect(evaluator.name).toBe('PROGRESS');
    });

    it('should be PRIMARY category', () => {
      expect(evaluator.category).toBe('PRIMARY');
    });

    it('should belong to ASSIAH world', () => {
      expect(evaluator.world).toBe('ASSIAH');
    });

    it('should have BURN axiom', () => {
      expect(evaluator.axiom).toBe('BURN');
    });
  });

  describe('evaluate()', () => {
    it('should give high score for forward progress', async () => {
      const observation = {
        delta: 0.1,
        direction: 'forward',
        improves: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.dimension).toBe('PROGRESS');
      expect(result.score).toBeGreaterThan(40);
    });

    it('should detect movement toward singularity', async () => {
      const observation = {
        singularityDistance: 0.3,
        previousDistance: 0.4,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeGreaterThan(40);
    });

    it('should penalize regression', async () => {
      const observation = {
        delta: -0.2,
        direction: 'backward',
        regresses: true,
      };
      const result = await evaluator.evaluate(observation);
      expect(result.score).toBeLessThan(70);
    });

    it('should provide reasoning', async () => {
      const observation = { action: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('passes()', () => {
    it('should pass for progress score', () => {
      expect(evaluator.passes(70)).toBe(true);
    });

    it('should fail for regression score', () => {
      expect(evaluator.passes(40)).toBe(false);
    });
  });

  describe('Blocker Detection', () => {
    it('should include blockers in details', async () => {
      const observation = { content: 'test' };
      const result = await evaluator.evaluate(observation);
      expect(result.details).toHaveProperty('blockers');
      expect(result.details.blockers).toHaveProperty('summary');
    });

    it('should detect technical blockers', async () => {
      const techDebt = { technicalDebt: true, techDebt: 30 };
      const noDebt = { noBlockers: true };

      const debtResult = await evaluator.evaluate(techDebt);
      const noDebtResult = await evaluator.evaluate(noDebt);

      expect(debtResult.details.blockers.blockers.length).toBeGreaterThan(0);
      expect(noDebtResult.details.blockers.blockers.length).toBe(0);
    });

    it('should detect dependency blockers', async () => {
      const blocked = { blockedDependencies: true };
      const result = await evaluator.evaluate(blocked);

      expect(result.details.blockers.blockers.some(b => b.type === 'dependency')).toBe(true);
    });

    it('should detect infrastructure blockers', async () => {
      const infraBlocked = { infrastructureIssues: true };
      const result = await evaluator.evaluate(infraBlocked);

      expect(result.details.blockers.blockers.some(b => b.type === 'infrastructure')).toBe(true);
    });

    it('should detect resource blockers', async () => {
      const constrained = { resourceConstrained: true, waitingForApproval: true };
      const result = await evaluator.evaluate(constrained);

      expect(result.details.blockers.blockers.some(b => b.type === 'resource')).toBe(true);
      expect(result.details.blockers.blockers.some(b => b.type === 'approval')).toBe(true);
    });

    it('should detect knowledge blockers', async () => {
      const uncertain = { unknownUnknowns: true, missingDocumentation: true };
      const result = await evaluator.evaluate(uncertain);

      expect(result.details.blockers.blockers.some(b => b.type === 'knowledge')).toBe(true);
      expect(result.details.blockers.blockers.some(b => b.type === 'documentation')).toBe(true);
    });

    it('should detect process blockers', async () => {
      const processIssues = { processBottleneck: true, coordinationOverhead: true };
      const result = await evaluator.evaluate(processIssues);

      expect(result.details.blockers.blockers.some(b => b.type === 'process')).toBe(true);
      expect(result.details.blockers.blockers.some(b => b.type === 'coordination')).toBe(true);
    });

    it('should calculate blocker severity correctly', async () => {
      const multipleBlockers = {
        technicalDebt: true,
        infrastructureIssues: true, // severity 25
        unknownUnknowns: true, // severity 20
      };
      const result = await evaluator.evaluate(multipleBlockers);

      expect(result.details.blockers.summary.totalSeverity).toBeGreaterThan(40);
      expect(result.details.blockers.summary.critical).toBeGreaterThan(0);
    });

    it('should reward no blockers', async () => {
      const noBlockers = { noBlockers: true, clearPath: true };
      const hasBlockers = { technicalDebt: true, processBottleneck: true };

      const clearResult = await evaluator.evaluate(noBlockers);
      const blockedResult = await evaluator.evaluate(hasBlockers);

      expect(clearResult.details.blockers.score).toBeGreaterThan(blockedResult.details.blockers.score);
    });

    it('should include blocker info in reasoning', async () => {
      const critical = { infrastructureIssues: true, unknownUnknowns: true };
      const result = await evaluator.evaluate(critical);

      expect(result.reasoning).toContain('blocker');
    });

    it('should give higher overall score without blockers', async () => {
      const clear = { progress: 70, noBlockers: true };
      const blocked = { progress: 70, technicalDebt: true, processBottleneck: true };

      const clearResult = await evaluator.evaluate(clear);
      const blockedResult = await evaluator.evaluate(blocked);

      expect(clearResult.score).toBeGreaterThan(blockedResult.score);
    });
  });
});
