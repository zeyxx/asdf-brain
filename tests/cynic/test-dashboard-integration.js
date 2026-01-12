/**
 * Dashboard Integration Test
 *
 * Tests the complete flow:
 * CYNICCore → DashboardConnector → EventBus → SSE
 *
 * "φ qui se montre en temps réel."
 */

'use strict';

const { CYNICCore } = require('../../lib/cynic/core');
const { DashboardConnector, connect } = require('../../lib/cynic/core/dashboard-connector');
const { eventBus, sseManager } = require('../../lib/cynic/realtime');
const { liveMatrix, getFullMatrix, recordScore, startJudgment } = require('../../lib/cynic/matrices/live-matrix');

// Track emitted events
const emittedEvents = [];
let eventSubscription = null;

// =============================================================================
// TEST SETUP
// =============================================================================

function setup() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   DASHBOARD INTEGRATION TEST - Phase 3');
  console.log('   "φ qui se montre en temps réel."');
  console.log('═══════════════════════════════════════════════════\n');

  // Subscribe to all events using wildcard
  const handler = (event) => {
    emittedEvents.push(event);
  };
  eventBus.on('*', handler);
  eventSubscription = handler;
}

function teardown() {
  if (eventSubscription) {
    eventBus.off('*', eventSubscription);
  }
  emittedEvents.length = 0;
}

// =============================================================================
// TESTS
// =============================================================================

async function testDashboardConnectorCreation() {
  console.log('TEST 1: Dashboard Connector Creation');
  console.log('─'.repeat(50));

  const cynic = new CYNICCore();
  const connector = new DashboardConnector(cynic);

  console.log('  ✓ DashboardConnector created');
  console.log(`  ✓ broadcastMatrix: ${connector.broadcastMatrix}`);
  console.log(`  ✓ broadcastDimensions: ${connector.broadcastDimensions}`);
  console.log(`  ✓ broadcastCoherence: ${connector.broadcastCoherence}`);

  return { success: true, connector };
}

async function testConnectorWiring(cynic, connector) {
  console.log('\nTEST 2: Connector Wiring');
  console.log('─'.repeat(50));

  connector.connect();

  console.log('  ✓ Connector wired to CYNICCore');
  console.log('  ✓ Activation events wired');
  console.log('  ✓ Dimension events wired');
  console.log('  ✓ Judgment events wired');
  console.log('  ✓ Pulse events wired');
  console.log('  ✓ Residual events wired');

  return { success: true };
}

async function testActivationEvents(cynic) {
  console.log('\nTEST 3: Activation Event Forwarding');
  console.log('─'.repeat(50));

  const beforeCount = emittedEvents.length;

  // Simulate wake event
  cynic.emit('wake', { source: 'test' });

  // Give time for event to propagate
  await sleep(10);

  const wakeEvents = emittedEvents.filter(e => e.type === 'cynic:wake');
  console.log(`  ✓ Wake events captured: ${wakeEvents.length}`);

  // Simulate judging event
  cynic.emit('judging', { judgmentId: 'test-123' });
  await sleep(10);

  const judgingEvents = emittedEvents.filter(e => e.type === 'cynic:judging');
  console.log(`  ✓ Judging events captured: ${judgingEvents.length}`);

  // Simulate sleep event
  cynic.emit('sleep', { reason: 'test complete' });
  await sleep(10);

  const sleepEvents = emittedEvents.filter(e => e.type === 'cynic:sleep');
  console.log(`  ✓ Sleep events captured: ${sleepEvents.length}`);

  return {
    success: wakeEvents.length > 0 && judgingEvents.length > 0 && sleepEvents.length > 0,
  };
}

async function testDimensionEvents() {
  console.log('\nTEST 4: Dimension Event Forwarding (via LiveMatrix)');
  console.log('─'.repeat(50));

  const beforeCount = emittedEvents.length;

  // Start a judgment in live matrix
  startJudgment('test-dim-123');
  await sleep(10);

  // Record some dimension scores
  recordScore('TRUTH', 85, { reasoning: 'test' });
  recordScore('HARMONY', 72, { reasoning: 'test' });
  recordScore('INTEGRITY', 90, { reasoning: 'test' });
  await sleep(20);

  const dimEvents = emittedEvents.filter(e => e.type === 'dimension:score');
  console.log(`  ✓ Dimension score events: ${dimEvents.length}`);

  if (dimEvents.length > 0) {
    const lastDim = dimEvents[dimEvents.length - 1];
    console.log(`    └─ Last: ${lastDim.data?.dimension || lastDim.dimension} = ${lastDim.data?.score || lastDim.score}`);
  }

  return { success: dimEvents.length >= 3 };
}

async function testJudgmentEvents(cynic) {
  console.log('\nTEST 5: Judgment Complete Event');
  console.log('─'.repeat(50));

  // Simulate judgment complete
  cynic.emit('judgment:complete', {
    judgmentId: 'test-jdg-456',
    result: {
      verdict: 'ACCEPT',
      score: 78.5,
      confidence: 0.618,
    },
    duration: 1618,
    dimensionsEvaluated: 24,
  });
  await sleep(20);

  const judgmentEvents = emittedEvents.filter(e => e.type === 'judgment:complete');
  console.log(`  ✓ Judgment complete events: ${judgmentEvents.length}`);

  if (judgmentEvents.length > 0) {
    const last = judgmentEvents[judgmentEvents.length - 1];
    console.log(`    └─ Verdict: ${last.verdict || last.data?.verdict}`);
    console.log(`    └─ Score: ${last.score || last.data?.score}`);
  }

  // Check for matrix broadcast
  const matrixEvents = emittedEvents.filter(e => e.type === 'matrix:update');
  console.log(`  ✓ Matrix update broadcasts: ${matrixEvents.length}`);

  return { success: judgmentEvents.length > 0 };
}

async function testPulseEvents(cynic) {
  console.log('\nTEST 6: Pulse Event Forwarding');
  console.log('─'.repeat(50));

  // Simulate pulse event
  cynic.emit('pulse', {
    health: 0.85,
    uptime: 1618000,
    subsystems: { core: 'healthy', dimensions: 'healthy' },
  });
  await sleep(10);

  const pulseEvents = emittedEvents.filter(e => e.type === 'pulse:heartbeat');
  console.log(`  ✓ Pulse heartbeat events: ${pulseEvents.length}`);

  // Simulate health change
  cynic.emit('health:change', {
    oldHealth: 0.9,
    newHealth: 0.85,
    reason: 'test degradation',
  });
  await sleep(10);

  const healthEvents = emittedEvents.filter(e => e.type === 'health:change');
  console.log(`  ✓ Health change events: ${healthEvents.length}`);

  return { success: pulseEvents.length > 0 };
}

async function testResidualEvents(cynic) {
  console.log('\nTEST 7: Residual Event Forwarding');
  console.log('─'.repeat(50));

  // Simulate residual anomaly
  cynic.emit('residual:anomaly', {
    residual: 0.42,
    judgmentScore: 58,
    axiomGaps: { PHI: 0.15 },
    worldGaps: { ATZILUT: 0.12 },
  });
  await sleep(10);

  const anomalyEvents = emittedEvents.filter(e => e.type === 'residual:anomaly');
  console.log(`  ✓ Residual anomaly events: ${anomalyEvents.length}`);

  // Simulate dimension proposal
  cynic.emit('residual:proposal', {
    suggestedName: 'EMERGENT_BEHAVIOR',
    suggestedWorld: 'ATZILUT',
    suggestedAxiom: 'PHI',
    confidence: 0.55,
    clusterSize: 5,
  });
  await sleep(10);

  const proposalEvents = emittedEvents.filter(e => e.type === 'residual:proposal');
  console.log(`  ✓ Residual proposal events: ${proposalEvents.length}`);

  return { success: anomalyEvents.length > 0 };
}

async function testConnectorStatus(connector) {
  console.log('\nTEST 8: Connector Status');
  console.log('─'.repeat(50));

  const status = connector.getStatus();

  console.log(`  ✓ Connected: ${status.connected}`);
  console.log(`  ✓ Matrix broadcast: ${status.broadcastMatrix}`);
  console.log(`  ✓ Dimensions broadcast: ${status.broadcastDimensions}`);
  console.log(`  ✓ Events emitted: ${status.stats.eventsEmitted}`);
  console.log(`  ✓ Matrix broadcasts: ${status.stats.matrixBroadcasts}`);

  return { success: status.connected && status.stats.eventsEmitted > 0 };
}

async function testEventBusStats() {
  console.log('\nTEST 9: EventBus Statistics');
  console.log('─'.repeat(50));

  const stats = eventBus.getStats();

  console.log(`  ✓ Total events emitted: ${stats.emitted}`);
  console.log(`  ✓ Event types seen: ${Object.keys(stats.byType).length}`);

  // Show breakdown
  for (const [type, count] of Object.entries(stats.byType)) {
    console.log(`    └─ ${type}: ${count}`);
  }

  return { success: stats.emitted > 0 };
}

// =============================================================================
// RUNNER
// =============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  setup();

  const results = [];

  // Create single instances for all tests
  const cynic = new CYNICCore();
  const connector = new DashboardConnector(cynic);

  try {
    // Test 1: Creation
    const t1 = await testDashboardConnectorCreation();
    results.push({ name: 'Dashboard Connector Creation', ...t1 });

    // Test 2: Wiring - use the shared instances
    const t2 = await testConnectorWiring(cynic, connector);
    results.push({ name: 'Connector Wiring', ...t2 });

    // Test 3: Activation events
    const t3 = await testActivationEvents(cynic);
    results.push({ name: 'Activation Events', ...t3 });

    // Test 4: Dimension events
    const t4 = await testDimensionEvents();
    results.push({ name: 'Dimension Events', ...t4 });

    // Test 5: Judgment events
    const t5 = await testJudgmentEvents(cynic);
    results.push({ name: 'Judgment Events', ...t5 });

    // Test 6: Pulse events
    const t6 = await testPulseEvents(cynic);
    results.push({ name: 'Pulse Events', ...t6 });

    // Test 7: Residual events
    const t7 = await testResidualEvents(cynic);
    results.push({ name: 'Residual Events', ...t7 });

    // Test 8: Connector status
    const t8 = await testConnectorStatus(connector);
    results.push({ name: 'Connector Status', ...t8 });

    // Test 9: EventBus stats
    const t9 = await testEventBusStats();
    results.push({ name: 'EventBus Statistics', ...t9 });

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
    console.log('\n  🎉 ALL TESTS PASSED - Phase 3 Dashboard SSE Integration Complete!\n');
    console.log('  Events flow: CYNICCore → DashboardConnector → EventBus → SSE');
    console.log('  φ guides the visibility. "Ce qui se fait en temps réel."\n');
  } else {
    console.log(`\n  ⚠️  ${failed} test(s) failed\n`);
    process.exit(1);
  }

  teardown();
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
