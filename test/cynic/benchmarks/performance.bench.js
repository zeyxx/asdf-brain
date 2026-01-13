/**
 * Performance Benchmarks for CYNIC
 *
 * Establishes performance baselines for:
 * - Single judgment (< 50ms target)
 * - Scaled judgment (< 150ms for n=5)
 * - Dimension evaluation (< 5ms per dimension)
 *
 * PHASE 3.4 - CREATED 2026-01-13
 *
 * Run with: npm run bench
 */

import { bench, describe } from 'vitest';

const { SelfJudge } = require('../../../lib/cynic/self-judge');
const { registry } = require('../../../lib/cynic/dimensions/registry');

// Pre-initialize for accurate benchmarks
const judge = new SelfJudge();

describe('CYNIC Performance Benchmarks', () => {
  describe('Single Judgment', () => {
    bench('simple item judgment', async () => {
      const item = { content: 'Test content for benchmark' };
      await judge.judge(item);
    }, {
      time: 1000, // Run for 1 second
      iterations: 20, // Minimum 20 iterations
    });

    bench('complex item judgment', async () => {
      const item = {
        content: 'Complex item with metadata',
        source: 'https://example.com',
        hash: 'sha256:benchmark',
        signature: 'sig_123',
        tags: ['benchmark', 'test'],
        type: 'contribution',
      };
      await judge.judge(item);
    }, {
      time: 1000,
      iterations: 20,
    });

    bench('minimal item judgment', async () => {
      const item = { content: '' };
      await judge.judge(item);
    }, {
      time: 1000,
      iterations: 20,
    });
  });

  describe('Scaled Judgment', () => {
    bench('n=3 scaled judgment (QUICK)', async () => {
      const item = { content: 'Scaled benchmark test' };
      await judge.judgeWithScaling(item, {}, { n: 3 });
    }, {
      time: 2000,
      iterations: 10,
    });

    bench('n=5 scaled judgment (STANDARD)', async () => {
      const item = { content: 'Scaled benchmark test' };
      await judge.judgeWithScaling(item, {}, { n: 5 });
    }, {
      time: 2000,
      iterations: 10,
    });

    bench('n=8 scaled judgment (THOROUGH)', async () => {
      const item = { content: 'Scaled benchmark test' };
      await judge.judgeWithScaling(item, {}, { n: 8 });
    }, {
      time: 3000,
      iterations: 5,
    });
  });

  describe('Dimension Evaluation', () => {
    const testItem = { content: 'Dimension benchmark test' };
    const context = {};
    const evaluators = registry.getAll();

    bench('evaluate all dimensions (24)', async () => {
      await Promise.all(evaluators.map((e) => e.evaluate(testItem, context)));
    }, {
      time: 1000,
      iterations: 20,
    });

    bench('evaluate single dimension', async () => {
      if (evaluators.length > 0) {
        await evaluators[0].evaluate(testItem, context);
      }
    }, {
      time: 1000,
      iterations: 50,
    });
  });

  describe('World Coherence', () => {
    bench('calculate world coherence', async () => {
      const item = { content: 'World coherence benchmark' };
      const result = await judge.judge(item);
      // World coherence is calculated as part of judge
    }, {
      time: 1000,
      iterations: 20,
    });
  });

  describe('Memory Baseline', () => {
    bench('judgment memory allocation', async () => {
      const items = [];
      for (let i = 0; i < 10; i++) {
        items.push({ content: `Batch item ${i}` });
      }

      const results = await Promise.all(items.map((item) => judge.judge(item)));
    }, {
      time: 2000,
      iterations: 5,
    });
  });
});
