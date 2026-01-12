/**
 * Context Layer Handlers - brain_context_*
 *
 * [S] Sod - AI Superlayer for contextual sessions
 */

'use strict';

const { getContextLayer } = require('../context-layer');
const daatLevels = require('../daat-levels');

// Initialize context layer singleton
const contextLayer = getContextLayer();

async function handleContextStart(args, adapter) {
  const { user_id, project, initial_context } = args;

  const session = contextLayer.startSession({
    userId: user_id,
    project,
    context: initial_context,
  });

  return {
    success: true,
    session_id: session.id,
    project: session.project,
    message: `Session started for project: ${session.project}`,
    _quality: 95,
  };
}

async function handleContextInject(args, adapter) {
  const { session_id, query, project, daat_level } = args;

  // Use Daat-levels + CYNIC for intelligent context enrichment
  const sessionContext = contextLayer.getSession(session_id) || {};
  const enrichment = await daatLevels.enrichWithDaatAndCynic(
    query,
    {
      session_id,
      session_depth: sessionContext.context_stack?.length || 0,
      project: project || sessionContext.project,
    },
    {
      patterns: await adapter.load('patterns/extracted-patterns.json'),
      decisions: await adapter.load('intent/extracted-intents.json'),
      philosophy: await adapter.load('philosophy/phi-scaling-unified-vision.json'),
      ecosystem: await adapter.load('relations/ecosystem-graph.json'),
    },
    { level_override: daat_level }
  );

  // Get base injection from context layer
  const injection = await contextLayer.getInjection({
    sessionId: session_id,
    query,
    project,
  });

  return {
    success: true,
    injection,
    daat: {
      level: enrichment.daat_level,
      name: enrichment.daat_name,
      auto_detected: enrichment.auto_detected_level,
      was_overridden: enrichment.was_overridden,
      guidance: enrichment.guidance,
    },
    cynic: enrichment._cynic ? {
      verdict: enrichment._cynic.verdict,
      confidence: enrichment._cynic.confidence,
      doubt: enrichment._cynic.doubt,
      needs_verification: enrichment._cynic.needs_verification,
      suggested_checks: enrichment._cynic.suggested_checks,
      ceiling_applied: enrichment._cynic.ceiling_applied,
      philosophy: enrichment._cynic.philosophy,
    } : null,
    context: enrichment.context,
    quality: injection.quality,
    message: `Context injection at DAAT level ${enrichment.daat_level} (${enrichment.daat_name}) with CYNIC: ${enrichment._cynic?.verdict || 'N/A'}`,
    _quality: injection.quality,
    _phi: enrichment._phi,
  };
}

async function handleContextUpdate(args, adapter) {
  const { session_id, decision, pattern, cross_reference } = args;

  const update = {};
  if (decision) update.decision = decision;
  if (pattern) update.pattern = pattern;
  if (cross_reference) update.cross_reference = cross_reference;

  const session = contextLayer.updateSession(session_id, update);

  if (!session) {
    return { success: false, error: 'Session not found', _quality: 0 };
  }

  return {
    success: true,
    session_id,
    updated: Object.keys(update),
    context_depth: session.context_stack.length,
    decisions_count: session.decisions.length,
    _quality: 85,
  };
}

async function handleContextEnd(args, adapter) {
  const { session_id } = args;

  const session = contextLayer.endSession(session_id);

  if (!session) {
    return { success: false, error: 'Session not found', _quality: 0 };
  }

  return {
    success: true,
    session_id,
    duration_ms: new Date(session.ended_at) - new Date(session.started_at),
    decisions_made: session.decisions.length,
    patterns_used: session.patterns_used.length,
    cross_references: session.cross_references.length,
    message: 'Session ended, learnings persisted',
    _quality: 90,
  };
}

async function handleContextStats(args, adapter) {
  const stats = contextLayer.getStats();

  return {
    success: true,
    ...stats,
    _quality: 95,
  };
}

async function handleContextSessions(args, adapter) {
  const sessions = contextLayer.getActiveSessions();

  return {
    success: true,
    count: sessions.length,
    sessions,
    _quality: 95,
  };
}

module.exports = {
  handleContextStart,
  handleContextInject,
  handleContextUpdate,
  handleContextEnd,
  handleContextStats,
  handleContextSessions,
  // Export context layer for direct access if needed
  contextLayer,
};
