/**
 * Dashboard Handlers - brain_dashboard*
 *
 * [S] Sod - Visual monitoring ("φ qui se voit en un coup d'œil")
 */

'use strict';

const dashboard = require('../cynic/dashboard');
const dashboardWeb = require('../cynic/dashboard-web');

async function handleDashboard(args, adapter) {
  const { format = 'text' } = args;

  try {
    let result;

    switch (format) {
      case 'json':
        result = await dashboard.generateJSON();
        return {
          success: true,
          ...result,
          format: 'json',
          philosophy: "φ qui se voit en données.",
          _quality: 85,
        };

      case 'compact':
        result = await dashboard.generateCompact();
        return {
          success: true,
          ...result,
          format: 'compact',
          philosophy: "φ qui se voit en résumé.",
          _quality: 85,
        };

      case 'text':
      default:
        result = await dashboard.generate();
        return {
          success: true,
          dashboard: result,
          format: 'text',
          message: 'Dashboard rendered. View with monospace font for best results.',
          philosophy: "φ qui se voit en un coup d'œil.",
          _quality: 85,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleDashboardHTML(args, adapter) {
  try {
    const html = await dashboardWeb.renderHTML();

    return {
      success: true,
      html,
      content_type: 'text/html',
      message: 'HTML dashboard generated. Save to file and open in browser.',
      philosophy: "φ qui se voit en beauté.",
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

async function handleDashboardLive(args, adapter) {
  const { port = 3003 } = args;

  try {
    const result = await dashboardWeb.startServer(port);

    return {
      success: result.success,
      url: result.url,
      port: result.port,
      message: result.message,
      philosophy: "φ qui se voit vivre en temps réel.",
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

module.exports = {
  handleDashboard,
  handleDashboardHTML,
  handleDashboardLive,
};
