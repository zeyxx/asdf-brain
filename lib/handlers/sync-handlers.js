/**
 * Sync Handlers - brain_sync_*
 *
 * [D] Drash - Claude-mem synchronization
 *
 * Philosophy: "Memory is not storage. Memory is connection."
 */

'use strict';

const integration = require('../integration');

// CYNIC instance will be injected
let cynicJudge = null;

function setCynicJudge(judge) {
  cynicJudge = judge;
}

async function handleSyncClaudeMem(args, adapter) {
  const { force = false } = args;

  try {
    const result = await integration.syncClaudeMem({
      force,
      cynicInstance: cynicJudge,
    });

    if (result.skipped) {
      return {
        success: true,
        skipped: true,
        reason: result.reason,
        next_sync_in: result.next_sync_in,
        message: result.message,
        _quality: 60,
      };
    }

    return {
      success: result.success,
      synced: result.synced || 0,
      observations: result.observations || 0,
      summaries: result.summaries || 0,
      items: result.items,
      db_stats: result.stats,
      message: result.message,
      philosophy: 'Memory is not storage. Memory is connection.',
      _quality: result.success ? 85 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Claude-mem sync failed: ' + error.message,
      _quality: 20,
    };
  }
}

async function handleSyncStatus(args, adapter) {
  try {
    const status = integration.claudeMem.getStatus();

    return {
      success: true,
      connected: status.connected,
      db_path: status.db_path,
      db_stats: status.db_stats,
      sync_state: status.sync_state,
      sync_stats: status.sync_stats,
      config: status.config,
      message: status.connected
        ? `Connected. ${status.sync_state?.total_synced || 0} items synced.`
        : 'Not connected to claude-mem database.',
      _quality: status.connected ? 80 : 50,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleSyncEvents(args, adapter) {
  const { limit = 50, type = null, project = null, since = null } = args;

  try {
    const events = integration.claudeMem.loadSyncedEvents({ limit, type, project, since });

    return {
      success: true,
      count: events.length,
      events,
      message: `Loaded ${events.length} synced events from claude-mem`,
      _quality: events.length > 0 ? 80 : 60,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleSyncSearch(args, adapter) {
  const { query, limit = 20 } = args;

  if (!query) {
    return {
      success: false,
      error: 'Query is required',
      _quality: 20,
    };
  }

  try {
    const results = integration.claudeMem.searchSyncedEvents(query, { limit });

    return {
      success: true,
      query,
      count: results.length,
      results,
      message: `Found ${results.length} matching events for "${query}"`,
      _quality: results.length > 0 ? 80 : 60,
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
  handleSyncClaudeMem,
  handleSyncStatus,
  handleSyncEvents,
  handleSyncSearch,
  setCynicJudge,
};
