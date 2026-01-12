/**
 * Consciousness Handlers - brain_pulse_*, brain_diagnostic,
 *                          brain_metrics, brain_anomalies, brain_health_history
 *
 * [S] Sod - Self-awareness ("φ qui se voit vivre")
 */

'use strict';

const pulse = require('../cynic/pulse');
const selfMonitor = require('../cynic/self-monitor');
const metrics = require('../cynic/metrics');
const alerts = require('../cynic/alerts');

async function handlePulseStart(args, adapter) {
  try {
    selfMonitor.registerWithPulse(pulse);
    alerts.connectToPulse(pulse);

    const result = await pulse.start();

    if (result.success) {
      pulse.on('pulse', (data) => {
        metrics.recordPulse(data.overallHealth, data.pulseMs || 0, data.anomalies?.length || 0);
      });
    }

    return {
      success: result.success,
      message: result.message,
      interval: result.interval,
      intervalHuman: result.intervalHuman,
      alertRulesActive: alerts.getAllRules().length,
      philosophy: "φ qui se voit vivre et réagit.",
      _quality: result.success ? 90 : 40,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handlePulseStop(args, adapter) {
  try {
    const result = pulse.stop();

    return {
      success: result.success,
      message: result.message,
      totalPulses: result.totalPulses,
      uptimeMs: result.uptimeMs,
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

async function handlePulseStatus(args, adapter) {
  try {
    const status = pulse.getStatus();

    return {
      success: true,
      ...status,
      philosophy: status.alive ? "CYNIC is alive. φ qui se voit vivre." : "CYNIC pulse not started.",
      _quality: status.alive ? 85 : 60,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleDiagnostic(args, adapter) {
  const { quick = false } = args;

  try {
    const report = quick
      ? await selfMonitor.runQuickCheck()
      : await selfMonitor.runFullDiagnostic();

    return {
      success: true,
      ...report,
      philosophy: "φ qui se diagnostique.",
      _quality: report.healthy ? 90 : report.overallScore >= 38 ? 60 : 30,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleMetrics(args, adapter) {
  const { full = false } = args;

  try {
    const data = full ? metrics.getAll() : metrics.getSummary();

    return {
      success: true,
      ...data,
      philosophy: "φ qui se mesure.",
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

async function handleAnomalies(args, adapter) {
  const { limit = 20 } = args;

  try {
    const anomalies = pulse.getAnomalies(limit);
    const status = pulse.getStatus();

    return {
      success: true,
      pulseAlive: status.alive,
      totalAnomalies: status.anomalyCount,
      anomalies,
      message: anomalies.length === 0
        ? "No anomalies detected. CYNIC is healthy."
        : `${anomalies.length} anomalies in recent history`,
      philosophy: "φ qui détecte ses anomalies.",
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

async function handleHealthHistory(args, adapter) {
  const { limit = 50 } = args;

  try {
    const history = pulse.getHealthHistory(limit);
    const status = pulse.getStatus();

    return {
      success: true,
      pulseAlive: status.alive,
      currentHealth: status.currentHealth,
      healthTrend: status.healthTrend,
      historySize: history.length,
      history,
      philosophy: "φ qui trace son évolution.",
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
  handlePulseStart,
  handlePulseStop,
  handlePulseStatus,
  handleDiagnostic,
  handleMetrics,
  handleAnomalies,
  handleHealthHistory,
  // Export pulse for direct access if needed
  pulse,
  selfMonitor,
  metrics,
};
