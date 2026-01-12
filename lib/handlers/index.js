/**
 * Handler Index - Central export for all brain-lite handlers
 *
 * Organized by domain following PaRDeS structure:
 *   P (Pshat)  - Simple, direct data access
 *   R (Remez)  - Allusion, pattern recognition
 *   D (Drash)  - Research, philosophy alignment
 *   S (Sod)    - Secret, unified vision
 *
 * "Don't trust, verify" - All handlers are φ-weighted
 */

'use strict';

// Import all handler modules
const searchHandlers = require('./search-handlers');
const dataHandlers = require('./data-handlers');
const learnHandlers = require('./learn-handlers');
const contextHandlers = require('./context-handlers');
const provenanceHandlers = require('./provenance-handlers');
const cynicHandlers = require('./cynic-handlers');
const discoveryHandlers = require('./discovery-handlers');
const privacyHandlers = require('./privacy-handlers');
const integrationHandlers = require('./integration-handlers');
const syncHandlers = require('./sync-handlers');
const consciousnessHandlers = require('./consciousness-handlers');
const alertHandlers = require('./alert-handlers');
const dashboardHandlers = require('./dashboard-handlers');
const storeHandlers = require('./store-handlers');
const gitHandlers = require('./git-handlers');

// Build the complete HANDLERS map (matches TOOLS keys)
const HANDLERS = {
  // Search & Data
  brain_search: searchHandlers.handleSearch,
  brain_health: dataHandlers.handleHealth,
  brain_patterns: dataHandlers.handlePatterns,
  brain_intent: dataHandlers.handleIntent,
  brain_ecosystem: dataHandlers.handleEcosystem,
  brain_dependencies: dataHandlers.handleDependencies,
  brain_vision: dataHandlers.handleVision,

  // Learn
  brain_learn: learnHandlers.handleLearn,
  brain_ingest: learnHandlers.handleIngest,

  // Context Layer
  brain_context_start: contextHandlers.handleContextStart,
  brain_context_inject: contextHandlers.handleContextInject,
  brain_context_update: contextHandlers.handleContextUpdate,
  brain_context_end: contextHandlers.handleContextEnd,
  brain_context_stats: contextHandlers.handleContextStats,
  brain_context_sessions: contextHandlers.handleContextSessions,

  // Provenance Layer
  brain_provenance_status: provenanceHandlers.handleProvenanceStatus,
  brain_provenance_proof: provenanceHandlers.handleProvenanceProof,
  brain_provenance_verify: provenanceHandlers.handleProvenanceVerify,
  brain_provenance_snapshot: provenanceHandlers.handleProvenanceSnapshot,

  // CYNIC Layer
  brain_cynic_judge: cynicHandlers.handleCynicJudge,
  brain_cynic_feedback: cynicHandlers.handleCynicFeedback,
  brain_cynic_stats: cynicHandlers.handleCynicStats,
  brain_cynic_learn: cynicHandlers.handleCynicLearn,

  // CYNIC Residual Detection Layer
  brain_cynic_residual: cynicHandlers.handleCynicResidual,
  brain_cynic_discover_dimensions: cynicHandlers.handleCynicDiscoverDimensions,
  brain_cynic_accept_dimension: cynicHandlers.handleCynicAcceptDimension,
  brain_cynic_residual_stats: cynicHandlers.handleCynicResidualStats,

  // Discovery Layer
  brain_discover: discoveryHandlers.handleDiscover,
  brain_discover_status: discoveryHandlers.handleDiscoverStatus,

  // Privacy Layer
  brain_privacy_sanitize: privacyHandlers.handlePrivacySanitize,
  brain_privacy_check: privacyHandlers.handlePrivacyCheck,
  brain_privacy_detect_pii: privacyHandlers.handlePrivacyDetectPII,
  brain_privacy_hash: privacyHandlers.handlePrivacyHash,
  brain_ephemeral_store: privacyHandlers.handleEphemeralStore,
  brain_ephemeral_get: privacyHandlers.handleEphemeralGet,

  // Integration Layer
  brain_webhook_holdex: integrationHandlers.handleWebhookHoldex,
  brain_webhook_gasdf: integrationHandlers.handleWebhookGasdf,
  brain_integration_status: integrationHandlers.handleIntegrationStatus,
  brain_integration_events: integrationHandlers.handleIntegrationEvents,
  brain_integration_patterns: integrationHandlers.handleIntegrationPatterns,
  brain_burn_stats: integrationHandlers.handleBurnStats,

  // Claude-Mem Sync Layer
  brain_sync_claude_mem: syncHandlers.handleSyncClaudeMem,
  brain_sync_status: syncHandlers.handleSyncStatus,
  brain_sync_events: syncHandlers.handleSyncEvents,
  brain_sync_search: syncHandlers.handleSyncSearch,

  // Consciousness Layer
  brain_pulse_start: consciousnessHandlers.handlePulseStart,
  brain_pulse_stop: consciousnessHandlers.handlePulseStop,
  brain_pulse_status: consciousnessHandlers.handlePulseStatus,
  brain_diagnostic: consciousnessHandlers.handleDiagnostic,
  brain_metrics: consciousnessHandlers.handleMetrics,
  brain_anomalies: consciousnessHandlers.handleAnomalies,
  brain_health_history: consciousnessHandlers.handleHealthHistory,

  // Alerting Layer
  brain_alert_status: alertHandlers.handleAlertStatus,
  brain_alert_active: alertHandlers.handleAlertActive,
  brain_alert_history: alertHandlers.handleAlertHistory,
  brain_alert_rules: alertHandlers.handleAlertRules,
  brain_alert_check: alertHandlers.handleAlertCheck,
  brain_alert_acknowledge: alertHandlers.handleAlertAcknowledge,
  brain_alert_resolve: alertHandlers.handleAlertResolve,
  brain_alert_silence: alertHandlers.handleAlertSilence,
  brain_alert_connect_pulse: alertHandlers.handleAlertConnectPulse,

  // Dashboard Layer
  brain_dashboard: dashboardHandlers.handleDashboard,
  brain_dashboard_html: dashboardHandlers.handleDashboardHTML,
  brain_dashboard_live: dashboardHandlers.handleDashboardLive,

  // Store Layer
  brain_store_status: storeHandlers.handleStoreStatus,
  brain_store_judgments: storeHandlers.handleStoreJudgments,
  brain_store_harmony: storeHandlers.handleStoreHarmony,
  brain_store_burns: storeHandlers.handleStoreBurns,
  brain_store_operators: storeHandlers.handleStoreOperators,

  // Git Intelligence Layer (CYNIC-enabled)
  brain_git_scan: gitHandlers.handleGitScan,
  brain_git_status: gitHandlers.handleGitStatus,
  brain_git_problems: gitHandlers.handleGitProblems,
  brain_git_drift: gitHandlers.handleGitDrift,
};

// Dependency injection functions
function injectCynicInstances(instances) {
  cynicHandlers.setCynicInstances(instances);
  learnHandlers.setCynicJudge(instances.cynicJudge);
  integrationHandlers.setCynicJudge(instances.cynicJudge);
  syncHandlers.setCynicJudge(instances.cynicJudge);
  gitHandlers.setCynicJudge(instances.cynicJudge);
}

function injectCynicStore(store) {
  storeHandlers.setCynicStore(store);
}

module.exports = {
  // Main handlers map
  HANDLERS,

  // Dependency injection
  injectCynicInstances,
  injectCynicStore,

  // Individual handler modules (for direct access/testing)
  searchHandlers,
  dataHandlers,
  learnHandlers,
  contextHandlers,
  provenanceHandlers,
  cynicHandlers,
  discoveryHandlers,
  privacyHandlers,
  integrationHandlers,
  syncHandlers,
  consciousnessHandlers,
  alertHandlers,
  dashboardHandlers,
  storeHandlers,

  // Re-export CYNIC constants for convenience
  ...cynicHandlers,
};
