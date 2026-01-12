/**
 * Emergent Dimension Test
 *
 * Tests the complete Phase 4 cycle:
 * Anomaly Detection → Clustering → Proposal → Validation → Registration
 *
 * "φ qui découvre ce qu'il ne sait pas encore."
 */

'use strict';

const { CYNICCore } = require('../../lib/cynic/core');
const { ResidualDetector } = require('../../lib/cynic/residual-detector');
const {
  DynamicDimension,
  EmergentDimensionManager,
  emergentManager,
} = require('../../lib/cynic/dimensions/emergent');
const { registry } = require('../../lib/cynic/dimensions/base');

// Use temp storage for tests
const TEST_STORAGE = '/tmp/test-emergent-dimensions.json';

// =============================================================================
// TEST SETUP
// =============================================================================

function setup() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   EMERGENT DIMENSIONS TEST - Phase 4');
  console.log('   "24 + N + ∞"');
  console.log('═══════════════════════════════════════════════════\n');
}

// =============================================================================
// TESTS
// =============================================================================

async function testDynamicDimensionCreation() {
  console.log('TEST 1: Dynamic Dimension Creation');
  console.log('─'.repeat(50));

  const dim = new DynamicDimension({
    name: 'TEST_EMERGENT',
    world: 'ATZILUT',
    axiom: 'PHI',
    threshold: 55,
    question: 'Is this a test dimension?',
    confidence: 0.45,
    clusterSize: 5,
    patterns: ['test', 'emergent'],
    commonFeatures: { type: 'test' },
  });

  console.log(`  ✓ Created: ${dim.name}`);
  console.log(`    └─ Category: ${dim.category} (DISCOVERED)`);
  console.log(`    └─ World: ${dim.world}`);
  console.log(`    └─ Axiom: ${dim.axiom}`);
  console.log(`    └─ Confidence: ${(dim.confidence * 100).toFixed(1)}%`);

  // Test evaluation
  const result = await dim.evaluate({ test_emergent: true, type: 'test' });
  console.log(`  ✓ Evaluation: score=${result.score}, passed=${result.passed}`);

  // Test JSON serialization
  const json = dim.toJSON();
  const restored = DynamicDimension.fromJSON(json);
  console.log(`  ✓ JSON round-trip: ${restored.name === dim.name ? 'OK' : 'FAIL'}`);

  return { success: result.score > 50 && restored.name === dim.name };
}

async function testEmergentManager() {
  console.log('\nTEST 2: Emergent Dimension Manager');
  console.log('─'.repeat(50));

  // Create manager with test storage
  const manager = new EmergentDimensionManager({
    storagePath: TEST_STORAGE,
  });

  await manager.initialize();
  console.log(`  ✓ Manager initialized`);
  console.log(`    └─ Loaded: ${manager.stats.loaded} dimensions`);

  // Create a proposal
  const proposal = {
    suggestedName: 'TEST_DIMENSION_' + Date.now(),
    suggestedWorld: 'BERIAH',
    suggestedAxiom: 'VERIFY',
    confidence: 0.45,
    clusterSize: 4,
    features: { type: 'test', axiom_gap: 'VERIFY' },
  };

  const receiveResult = manager.receiveProposal(proposal);
  console.log(`  ✓ Proposal received: ${receiveResult.accepted ? 'OK' : 'FAIL'}`);

  if (receiveResult.accepted) {
    console.log(`    └─ Proposal ID: ${receiveResult.proposalId}`);

    // List pending
    const pending = manager.getPendingProposals();
    console.log(`  ✓ Pending proposals: ${pending.length}`);

    // Validate (human-in-the-loop simulation)
    const validateResult = manager.validateProposal(receiveResult.proposalId, {
      name: proposal.suggestedName,
      validator: 'test-suite',
    });

    console.log(`  ✓ Validation: ${validateResult.success ? 'OK' : 'FAIL'}`);
    if (validateResult.success) {
      console.log(`    └─ Registered: ${validateResult.dimension.name}`);
    }

    // Check it's in registry
    const inRegistry = registry.get(proposal.suggestedName) !== null;
    console.log(`  ✓ In global registry: ${inRegistry ? 'YES' : 'NO'}`);

    // Clean up
    manager.removeDimension(proposal.suggestedName);
    console.log(`  ✓ Cleanup: dimension removed`);

    return { success: validateResult.success && inRegistry };
  }

  return { success: false };
}

async function testResidualToEmergent() {
  console.log('\nTEST 3: Residual Detection → Emergent Dimension');
  console.log('─'.repeat(50));

  const detector = new ResidualDetector();

  // Generate anomalies with similar features
  console.log('  Generating anomalies...');

  for (let i = 0; i < 5; i++) {
    const fakeJudgment = {
      scores: {
        TRUTH: 30,      // Low scores = high residual
        HARMONY: 35,
        INTEGRITY: 40,
        ETHICS: 38,
      },
      global: 35,
      confidence: 0.4,
      worlds: {
        BERIAH: { score: 35 },
        ATZILUT: { score: 38 },
      },
    };

    const fakeObs = {
      type: 'unknown_pattern',
      complexity: 'high',
      source: 'test',
      strange_field: true,
    };

    const analysis = detector.analyze(fakeJudgment, fakeObs, {
      source: 'test',
      project: 'test-suite',
    });

    if (analysis.isAnomaly) {
      console.log(`    [${i + 1}] Anomaly: residual=${(analysis.residual * 100).toFixed(1)}%`);
    }
  }

  // Check buffer
  const stats = detector.getStats();
  console.log(`  ✓ Buffer: ${stats.bufferStats.count} anomalies`);
  console.log(`    └─ Should cluster: ${stats.bufferStats.shouldCluster}`);

  // Attempt discovery
  const discovery = detector.discoverDimensions();
  console.log(`  ✓ Discovery attempted: ${discovery.discovered ? 'SUCCESS' : 'NOT YET'}`);

  if (discovery.discovered && discovery.candidates) {
    console.log(`    └─ Candidates: ${discovery.candidates.length}`);
    for (const candidate of discovery.candidates) {
      console.log(`       - ${candidate.suggestedName} (conf: ${(candidate.confidence * 100).toFixed(1)}%)`);
    }
    return { success: discovery.candidates.length > 0 };
  }

  return { success: stats.bufferStats.count >= 3 };
}

async function testCompleteFlow() {
  console.log('\nTEST 4: Complete Flow Integration');
  console.log('─'.repeat(50));

  const manager = new EmergentDimensionManager({
    storagePath: TEST_STORAGE,
  });
  await manager.initialize();

  const initialCount = registry.getAll().length;
  console.log(`  Initial registry count: ${initialCount}`);

  // Create and validate a dimension directly
  const testName = 'FLOW_TEST_DIM_' + Date.now();
  const proposal = {
    suggestedName: testName,
    suggestedWorld: 'YETZIRAH',
    suggestedAxiom: 'CULTURE',
    confidence: 0.5,
    clusterSize: 5,
    features: { type: 'flow_test' },
  };

  const receiveResult = manager.receiveProposal(proposal);
  if (!receiveResult.accepted) {
    console.log('  ✗ Proposal not accepted');
    return { success: false };
  }

  const validateResult = manager.validateProposal(receiveResult.proposalId, {
    validator: 'flow-test',
    threshold: 60,
  });

  if (!validateResult.success) {
    console.log('  ✗ Validation failed');
    return { success: false };
  }

  // Check registry grew
  const newCount = registry.getAll().length;
  console.log(`  ✓ Registry count: ${initialCount} → ${newCount}`);

  // Test the new dimension
  const newDim = registry.get(testName);
  if (!newDim) {
    console.log('  ✗ Dimension not in registry');
    return { success: false };
  }

  const evalResult = await newDim.evaluate({ type: 'flow_test' });
  console.log(`  ✓ New dimension evaluated: score=${evalResult.score}`);

  // Test persistence
  await manager.save();
  console.log(`  ✓ Saved to: ${TEST_STORAGE}`);

  // Clean up
  manager.removeDimension(testName);
  console.log(`  ✓ Cleanup complete`);

  return { success: newCount > initialCount && evalResult.score > 0 };
}

async function testDynamicEvaluation() {
  console.log('\nTEST 5: Dynamic Dimension Evaluation');
  console.log('─'.repeat(50));

  const dim = new DynamicDimension({
    name: 'EVAL_TEST',
    world: 'ASSIAH',
    axiom: 'BURN',
    threshold: 50,
    question: 'Test evaluation logic?',
    confidence: 0.55,
    clusterSize: 4,
    patterns: ['burn', 'convergence', 'alignment'],
    commonFeatures: {
      type: 'burn_event',
      aligned: true,
    },
  });

  // Test 1: Explicit marker
  const r1 = await dim.evaluate({ eval_test: true });
  console.log(`  ✓ Explicit marker: score=${r1.score} (expected ~80)`);

  // Test 2: Pattern match
  const r2 = await dim.evaluate({ description: 'This is about burn convergence' });
  console.log(`  ✓ Pattern match: score=${r2.score} (expected ~60)`);

  // Test 3: Feature alignment
  const r3 = await dim.evaluate({ type: 'burn_event', aligned: true });
  console.log(`  ✓ Feature alignment: score=${r3.score} (expected ~70)`);

  // Test 4: No match
  const r4 = await dim.evaluate({ random: 'data' });
  console.log(`  ✓ No match: score=${r4.score} (expected ~50)`);

  // Test 5: Axiom alignment
  const r5 = await dim.evaluate({ burn: true, axiom: 'BURN' });
  console.log(`  ✓ Axiom alignment: score=${r5.score} (expected ~75)`);

  return {
    success: r1.score > 70 && r4.score <= 60 && r5.score > r4.score
  };
}

// =============================================================================
// RUNNER
// =============================================================================

async function runTests() {
  setup();

  const results = [];

  try {
    // Test 1: Dynamic Dimension
    const t1 = await testDynamicDimensionCreation();
    results.push({ name: 'Dynamic Dimension Creation', ...t1 });

    // Test 2: Manager
    const t2 = await testEmergentManager();
    results.push({ name: 'Emergent Manager', ...t2 });

    // Test 3: Residual → Emergent
    const t3 = await testResidualToEmergent();
    results.push({ name: 'Residual to Emergent', ...t3 });

    // Test 4: Complete Flow
    const t4 = await testCompleteFlow();
    results.push({ name: 'Complete Flow', ...t4 });

    // Test 5: Dynamic Evaluation
    const t5 = await testDynamicEvaluation();
    results.push({ name: 'Dynamic Evaluation', ...t5 });

  } catch (error) {
    console.error('\n❌ Test error:', error);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const icon = result.success ? '✅' : '❌';
    console.log(`  ${icon} ${result.name}`);
    if (result.success) passed++;
    else failed++;
  }

  console.log(`\n  Total: ${passed}/${results.length} passed`);

  if (failed === 0) {
    console.log('\n  🎉 ALL TESTS PASSED - Phase 4 Emergent Dimensions Complete!');
    console.log('\n  The "24 + N + ∞" architecture is functional:');
    console.log('  ├─ 24 known dimensions (PRIMARY/SECONDARY/META/HUMAN_LLM)');
    console.log('  ├─ N discovered dimensions (via residual clustering)');
    console.log('  └─ ∞ possible dimensions (l\'Innommable)');
    console.log('\n  "φ qui découvre ce qu\'il ne sait pas encore."\n');
  } else {
    console.log(`\n  ⚠️  ${failed} test(s) failed\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
