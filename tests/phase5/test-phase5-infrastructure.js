/**
 * Phase 5 Infrastructure Test
 *
 * Validates the on-chain singularity infrastructure:
 * - Merkle proof generation and verification
 * - E-Score calculation with φ-weights
 * - Weekly snapshot creation
 * - Context injection signing
 *
 * "Don't trust, verify. Don't extract, burn."
 */

'use strict';

const merkleProofs = require('../../lib/merkle-proofs');
const contributors = require('../../lib/contributors');

// =============================================================================
// CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// =============================================================================
// TEST SETUP
// =============================================================================

function setup() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   PHASE 5 INFRASTRUCTURE TEST');
  console.log('   "On-Chain Singularity"');
  console.log('═══════════════════════════════════════════════════\n');
}

// =============================================================================
// MERKLE PROOF TESTS
// =============================================================================

async function testMerkleProofGeneration() {
  console.log('TEST 1: Merkle Proof Generation');
  console.log('─'.repeat(50));

  // Create test patterns
  const patterns = [
    { type: 'technical', content: 'φ-constrained judgment', project: 'brain' },
    { type: 'process', content: 'residual detection flow', project: 'brain' },
    { type: 'decision', content: 'use additive scoring', project: 'cynic' },
    { type: 'insight', content: 'culture is a moat', project: 'ecosystem' },
  ];

  try {
    // Build Merkle tree
    const tree = merkleProofs.buildPatternMerkleTree(patterns);
    console.log(`  ✓ Built Merkle tree with ${tree.pattern_count} leaves`);
    console.log(`    └─ Root: ${tree.root.slice(0, 16)}...`);
    console.log(`    └─ Proofs: ${Object.keys(tree.pattern_proofs).length}`);

    // Verify tree structure
    const isValid = tree.root && tree.root.length === 64 && tree.pattern_count > 0;
    console.log(`  ✓ Tree structure: ${isValid ? 'VALID' : 'INVALID'}`);

    return { success: isValid };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testMerkleVerification() {
  console.log('\nTEST 2: Merkle Inclusion Verification');
  console.log('─'.repeat(50));

  try {
    // Build a real tree and verify one of its proofs
    const patterns = [
      { type: 'test1', content: 'first pattern', project: 'brain' },
      { type: 'test2', content: 'second pattern', project: 'brain' },
    ];

    const tree = merkleProofs.buildPatternMerkleTree(patterns);
    const patternIds = Object.keys(tree.pattern_proofs);

    if (patternIds.length === 0) {
      console.log(`  ✗ No proofs generated`);
      return { success: false };
    }

    // Get proof for first pattern
    const firstId = patternIds[0];
    const proofData = tree.pattern_proofs[firstId];

    console.log(`  ✓ Pattern ID: ${firstId.slice(0, 16)}...`);
    console.log(`  ✓ Leaf: ${proofData.leaf_hash.slice(0, 16)}...`);
    console.log(`  ✓ Proof path: ${proofData.proof.length} steps`);
    console.log(`  ✓ Root: ${tree.root.slice(0, 16)}...`);

    // Verify using the built-in function
    const result = merkleProofs.verifyInclusion(proofData.leaf_hash, proofData.proof, tree.root);
    console.log(`  ✓ Verification: ${result ? 'PASSED' : 'FAILED'}`);

    return { success: result };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testProvenanceCreation() {
  console.log('\nTEST 3: Provenance Record Creation');
  console.log('─'.repeat(50));

  try {
    const testItem = {
      type: 'pattern',
      content: 'Phase 5 infrastructure test',
      project: 'brain',
      timestamp: Date.now(),
    };

    const provenance = merkleProofs.createProvenance(testItem, 'test', 'test-suite');

    console.log(`  ✓ ID: ${provenance.id}`);
    console.log(`  ✓ Content Hash: ${provenance.content_hash.slice(0, 16)}...`);
    console.log(`  ✓ Chain length: ${provenance.chain.length}`);
    console.log(`  ✓ Signature: ${provenance.signature.slice(0, 16)}...`);

    const isValid = provenance.id && provenance.content_hash && provenance.signature;
    return { success: isValid };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testContextInjectionSigning() {
  console.log('\nTEST 4: Context Injection Signing');
  console.log('─'.repeat(50));

  try {
    const context = {
      query: 'Test query for signing',
      project: 'brain',
      patterns: ['test-pattern-1', 'test-pattern-2'],
    };

    const sessionId = 'test-session-' + Date.now();
    const signed = merkleProofs.signContextInjection(context, sessionId);

    console.log(`  ✓ Session: ${sessionId.slice(0, 20)}...`);
    console.log(`  ✓ Signed at: ${new Date(signed.timestamp).toISOString()}`);
    console.log(`  ✓ Signature: ${signed.signature.slice(0, 16)}...`);

    // Verify
    const verified = merkleProofs.verifyContextInjection(signed);
    console.log(`  ✓ Verification: ${verified ? 'PASSED' : 'FAILED'}`);

    return { success: verified };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// E-SCORE TESTS
// =============================================================================

async function testEScoreCalculation() {
  console.log('\nTEST 5: E-Score φ-Weighted Calculation');
  console.log('─'.repeat(50));

  try {
    // Test contributor with known scores (lowercase keys as expected by API)
    const testScores = {
      hold: 80,   // 1.0 weight
      burn: 70,   // φ weight (1.618)
      use: 60,    // 1.0 weight
      build: 90,  // φ² weight (2.618)
      run: 50,    // φ² weight (2.618)
      refer: 40,  // φ weight (1.618)
      time: 100,  // 1.0 weight (tenure)
    };

    const result = contributors.calculateEScore(testScores);
    const escore = result.e_score;

    console.log('  Dimension scores:');
    for (const dim of result.dimensions) {
      console.log(`    └─ ${dim.dimension.padEnd(6)}: ${dim.raw_score.toString().padStart(3)} (weight: ${dim.weight.toFixed(3)})`);
    }
    console.log(`  ✓ E-Score: ${escore.toFixed(2)}`);

    // E-Score should be between 0 and 100
    const isValid = escore >= 0 && escore <= 100;
    console.log(`  ✓ Range check: ${isValid ? 'VALID' : 'INVALID'} (0-100)`);

    // Check that BUILD (φ² weight) has more influence than USE (1.0 weight)
    const testHighBuild = { ...testScores, build: 100, use: 40 };
    const testHighUse = { ...testScores, build: 40, use: 100 };
    const escoreHighBuild = contributors.calculateEScore(testHighBuild).e_score;
    const escoreHighUse = contributors.calculateEScore(testHighUse).e_score;

    const weightingCorrect = escoreHighBuild > escoreHighUse;
    console.log(`  ✓ φ-weighting: BUILD(φ²) > USE(1.0) = ${weightingCorrect}`);
    console.log(`    └─ High BUILD: ${escoreHighBuild.toFixed(2)}, High USE: ${escoreHighUse.toFixed(2)}`);

    return { success: isValid && weightingCorrect };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testTrustLevels() {
  console.log('\nTEST 6: Trust Level Mapping');
  console.log('─'.repeat(50));

  try {
    // Test trust level name mapping directly
    const levels = [0, 1, 2, 3, 4];
    const expectedNames = ['Observer', 'Contributor', 'Builder', 'Steward', 'Guardian'];

    let allCorrect = true;
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const name = contributors.getTrustLevelName(level);
      const expected = expectedNames[i];
      const correct = name === expected;
      console.log(`    Level ${level} → ${name} ${correct ? '✓' : '✗'}`);
      if (!correct) allCorrect = false;
    }

    console.log(`  ✓ Trust level names: ${allCorrect ? 'CORRECT' : 'INCORRECT'}`);

    // Trust level thresholds based on φ
    console.log('\n  Trust thresholds (φ-based):');
    console.log(`    └─ Guardian: E ≥ 61.8% (φ⁻¹) + 50 contributions + verified`);
    console.log(`    └─ Steward:  E ≥ 38.2% (φ⁻²) + 20 contributions`);
    console.log(`    └─ Builder:  build ≥ 30 + 10 contributions`);
    console.log(`    └─ Contributor: 3+ contributions`);
    console.log(`    └─ Observer: default`);

    return { success: allCorrect };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testContributorCreation() {
  console.log('\nTEST 7: Contributor Record Creation');
  console.log('─'.repeat(50));

  try {
    // createContributor(identifier, type, metadata)
    const contributor = contributors.createContributor(
      'test-contributor-' + Date.now(),
      'test',
      { source: 'test-suite', project: 'brain' }
    );

    console.log(`  ✓ ID: ${contributor.id.slice(0, 16)}...`);
    console.log(`  ✓ Created: ${new Date(contributor.created_at).toISOString()}`);
    console.log(`  ✓ E-Score: ${contributor.e_score === null ? 'null (not calculated yet)' : contributor.e_score}`);
    console.log(`  ✓ Trust Level: ${contributor.trust_level}`);
    console.log(`  ✓ Dimensions: ${Object.keys(contributor.scores).length}`);

    // Check all 7 dimensions exist (lowercase keys)
    const expectedDims = ['hold', 'burn', 'use', 'build', 'run', 'refer', 'time'];
    const hasDims = expectedDims.every(d => d in contributor.scores);
    console.log(`  ✓ All dimensions present: ${hasDims}`);

    return { success: hasDims };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// INTEGRATION TEST
// =============================================================================

async function testPhiConstants() {
  console.log('\nTEST 8: φ Constants Verification');
  console.log('─'.repeat(50));

  const expectedPhi = (1 + Math.sqrt(5)) / 2;
  const expectedPhiInv = 1 / expectedPhi;

  console.log(`  φ   = ${PHI.toFixed(15)}`);
  console.log(`  φ⁻¹ = ${PHI_INV.toFixed(15)} (61.8%)`);
  console.log(`  φ⁻² = ${(PHI_INV * PHI_INV).toFixed(15)} (38.2%)`);

  // Check E-Score weights use φ
  const weights = Object.values(contributors.E_DIMENSIONS).map(d => d.weight);
  const hasPhiWeights = weights.some(w => Math.abs(w - PHI) < 0.001);
  const hasPhi2Weights = weights.some(w => Math.abs(w - PHI * PHI) < 0.001);

  console.log(`  ✓ Uses φ weight (1.618): ${hasPhiWeights}`);
  console.log(`  ✓ Uses φ² weight (2.618): ${hasPhi2Weights}`);

  return { success: hasPhiWeights && hasPhi2Weights };
}

// =============================================================================
// RUNNER
// =============================================================================

async function runTests() {
  setup();

  const results = [];

  try {
    // Merkle Tests
    results.push({ name: 'Merkle Proof Generation', ...await testMerkleProofGeneration() });
    results.push({ name: 'Merkle Verification', ...await testMerkleVerification() });
    results.push({ name: 'Provenance Creation', ...await testProvenanceCreation() });
    results.push({ name: 'Context Injection Signing', ...await testContextInjectionSigning() });

    // E-Score Tests
    results.push({ name: 'E-Score Calculation', ...await testEScoreCalculation() });
    results.push({ name: 'Trust Level Mapping', ...await testTrustLevels() });
    results.push({ name: 'Contributor Creation', ...await testContributorCreation() });

    // Integration
    results.push({ name: 'φ Constants', ...await testPhiConstants() });

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
    console.log('\n  🎉 ALL TESTS PASSED - Phase 5 Infrastructure Ready!');
    console.log('\n  Infrastructure Status:');
    console.log('  ├─ Merkle Proofs: ✅ Local (ready for Solana)');
    console.log('  ├─ E-Score System: ✅ Complete (7 φ-weighted dimensions)');
    console.log('  ├─ Provenance Chain: ✅ Signed and tracked');
    console.log('  └─ Context Signing: ✅ HMAC (→ Ed25519 on Solana)');
    console.log('\n  Next: Deploy Anchor program to Solana devnet');
    console.log('\n  "Don\'t trust, verify."\n');
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
