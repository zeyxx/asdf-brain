/**
 * Integration Handlers - brain_webhook_*, brain_integration_*, brain_burn_stats
 *
 * [D] Drash - HolDex, GASdf webhooks and integration
 *
 * Philosophy: "Everything connects through φ."
 */

'use strict';

const integration = require('../integration');

// CYNIC instance will be injected
let cynicJudge = null;

function setCynicJudge(judge) {
  cynicJudge = judge;
}

async function handleWebhookHoldex(args, adapter) {
  if (!args.timestamp) {
    args.timestamp = new Date().toISOString();
  }

  try {
    const result = await integration.holdex.handleWebhook(args, {
      cynicInstance: cynicJudge,
    });

    return {
      ...result,
      _quality: result.success ? 85 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'HolDex webhook processing failed: ' + error.message,
      _quality: 20,
    };
  }
}

async function handleWebhookGasdf(args, adapter) {
  if (!args.timestamp) {
    args.timestamp = new Date().toISOString();
  }

  try {
    const result = await integration.gasdf.handleWebhook(args, {
      cynicInstance: cynicJudge,
    });

    return {
      ...result,
      _quality: result.success ? 85 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'GASdf webhook processing failed: ' + error.message,
      _quality: 20,
    };
  }
}

async function handleIntegrationStatus(args, adapter) {
  const { source = 'all' } = args;

  try {
    if (source === 'holdex') {
      return {
        success: true,
        source: 'holdex',
        status: integration.holdex.getStatus(),
        _quality: 80,
      };
    }

    if (source === 'gasdf') {
      return {
        success: true,
        source: 'gasdf',
        status: integration.gasdf.getStatus(),
        _quality: 80,
      };
    }

    // All sources
    const status = integration.getStatus();
    return {
      success: true,
      sources: ['holdex', 'gasdf'],
      holdex: status.holdex,
      gasdf: status.gasdf,
      unified: status.unified,
      message: `Integration health: ${status.unified.health.status} (${status.unified.health.health_score}%)`,
      philosophy: 'Everything connects through φ.',
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleIntegrationEvents(args, adapter) {
  const { sources = ['holdex', 'gasdf'], limit = 50, since = null, type = null } = args;

  try {
    const events = integration.loadAllEvents({ limit, since, sources });

    const filtered = type
      ? events.filter(e => e.type === type)
      : events;

    return {
      success: true,
      count: filtered.length,
      sources,
      events: filtered,
      message: `Loaded ${filtered.length} events from ${sources.join(', ')}`,
      _quality: 75,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleIntegrationPatterns(args, adapter) {
  const { limit = 1000 } = args;

  try {
    const patterns = integration.analyzeAllPatterns({ limit });

    return {
      success: true,
      holdex: patterns.holdex,
      gasdf: patterns.gasdf,
      correlations: patterns.correlations,
      message: 'Pattern analysis complete',
      philosophy: 'Patterns emerge from chaos. φ reveals them.',
      _quality: 85,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleBurnStats(args, adapter) {
  const { days = 7 } = args;

  try {
    const stats = integration.getBurnStats({ days });

    return {
      success: true,
      period_days: days,
      ...stats,
      message: `Burned ${stats.total_burned} $asdfasdfa in ${days} days (${stats.burn_count} burns)`,
      philosophy: "Don't extract, burn.",
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

module.exports = {
  handleWebhookHoldex,
  handleWebhookGasdf,
  handleIntegrationStatus,
  handleIntegrationEvents,
  handleIntegrationPatterns,
  handleBurnStats,
  setCynicJudge,
};
