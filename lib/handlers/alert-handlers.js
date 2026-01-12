/**
 * Alerting Handlers - brain_alert_*
 *
 * [S] Sod - φ-escalation alerting ("φ qui réagit")
 */

'use strict';

const alerts = require('../cynic/alerts');
const selfMonitor = require('../cynic/self-monitor');
const pulse = require('../cynic/pulse');

async function handleAlertStatus(args, adapter) {
  try {
    const status = alerts.getStatus();
    const stats = alerts.getStats();
    const active = alerts.getActive();

    return {
      success: true,
      ...status,
      statistics: stats,
      activeCount: active.length,
      criticalCount: active.filter(a => a.severity === 'critical').length,
      warningCount: active.filter(a => a.severity === 'warning').length,
      philosophy: "φ qui surveille.",
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

async function handleAlertActive(args, adapter) {
  const { severity } = args;

  try {
    let active = alerts.getActive();

    if (severity) {
      active = active.filter(a => a.severity === severity);
    }

    return {
      success: true,
      count: active.length,
      alerts: active.map(a => ({
        id: a.id,
        ruleId: a.ruleId,
        severity: a.severity,
        message: a.message,
        firedAt: a.firedAt,
        durationMs: Date.now() - new Date(a.firedAt).getTime(),
        acknowledged: a.acknowledged,
        escalated: a.escalated,
        fireCount: a.fireCount,
      })),
      message: active.length === 0
        ? "No active alerts. CYNIC is calm."
        : `${active.length} active alert(s)`,
      philosophy: "φ qui alerte.",
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

async function handleAlertHistory(args, adapter) {
  const { limit = 50 } = args;

  try {
    const history = alerts.getHistory(limit);
    const stats = alerts.getStats();

    return {
      success: true,
      count: history.length,
      totalFired: stats.totalFired,
      totalResolved: stats.totalResolved,
      totalAcknowledged: stats.totalAcknowledged,
      alerts: history,
      philosophy: "φ qui se souvient.",
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

async function handleAlertRules(args, adapter) {
  const { category } = args;

  try {
    const allRules = alerts.getAllRules();
    let rules = allRules;

    if (category) {
      const alertRulesLib = require('../cynic/alert-rules');
      const categoryRules = alertRulesLib.getRulesByCategory(category);
      const categoryIds = new Set(categoryRules.map(r => r.id));
      rules = allRules.filter(r => categoryIds.has(r.id));
    }

    return {
      success: true,
      count: rules.length,
      totalRules: allRules.length,
      rules: rules.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        severity: r.severity,
        enabled: r.enabled,
        silencedUntil: r.silencedUntil,
        throttleMs: r.throttleMs,
        channels: r.channels,
      })),
      thresholds: require('../cynic/alert-rules').THRESHOLDS,
      philosophy: "φ qui définit ses règles.",
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

async function handleAlertCheck(args, adapter) {
  try {
    const diagnostic = await selfMonitor.runFullDiagnostic();
    const results = await alerts.checkAll(diagnostic);

    const firedAlerts = results.filter(r => r.fired);
    const active = alerts.getActive();

    return {
      success: true,
      rulesChecked: results.length,
      alertsFired: firedAlerts.length,
      activeAlerts: active.length,
      fired: firedAlerts.map(r => ({
        ruleId: r.ruleId,
        alertId: r.alertId,
        severity: r.severity,
        message: r.message,
      })),
      diagnosticScore: diagnostic.overallScore,
      philosophy: "φ qui vérifie.",
      _quality: firedAlerts.length > 0 ? 70 : 90,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertAcknowledge(args, adapter) {
  const { alertId, acknowledgedBy = 'operator' } = args;

  try {
    const result = alerts.acknowledge(alertId, acknowledgedBy);

    return {
      success: result.success,
      message: result.message,
      alert: result.alert ? {
        id: result.alert.id,
        ruleId: result.alert.ruleId,
        severity: result.alert.severity,
        acknowledged: result.alert.acknowledged,
        acknowledgedAt: result.alert.acknowledgedAt,
        acknowledgedBy: result.alert.acknowledgedBy,
      } : null,
      philosophy: "φ qui reconnaît.",
      _quality: result.success ? 80 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertResolve(args, adapter) {
  const { alertId, resolution = 'Manually resolved' } = args;

  try {
    const result = alerts.resolve(alertId, resolution);

    return {
      success: result.success,
      message: result.message,
      alert: result.alert ? {
        id: result.alert.id,
        ruleId: result.alert.ruleId,
        severity: result.alert.severity,
        resolvedAt: result.alert.resolvedAt,
        resolution: result.alert.resolution,
      } : null,
      philosophy: "φ qui résout.",
      _quality: result.success ? 80 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertSilence(args, adapter) {
  const { ruleId, durationMs = 3600000 } = args;

  try {
    const result = alerts.silence(ruleId, durationMs);

    return {
      success: result.success,
      message: result.message,
      rule: result.rule ? {
        id: result.rule.id,
        name: result.rule.name,
        silencedUntil: result.rule.silencedUntil,
        silenceDurationMs: durationMs,
      } : null,
      philosophy: "φ qui se tait temporairement.",
      _quality: result.success ? 80 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleAlertConnectPulse(args, adapter) {
  try {
    alerts.connectToPulse(pulse);

    return {
      success: true,
      message: 'Alerting connected to pulse daemon',
      rulesActive: alerts.getAllRules().length,
      philosophy: "φ qui réagit automatiquement.",
      _quality: 90,
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
  handleAlertStatus,
  handleAlertActive,
  handleAlertHistory,
  handleAlertRules,
  handleAlertCheck,
  handleAlertAcknowledge,
  handleAlertResolve,
  handleAlertSilence,
  handleAlertConnectPulse,
  // Export alerts module for direct access
  alerts,
};
