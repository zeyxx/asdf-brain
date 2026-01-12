/**
 * Discovery Handlers - brain_discover, brain_discover_status
 *
 * [R] Remez - Auto-discovery with CYNIC judgment
 */

'use strict';

const gitScanner = require('../discovery/git-scanner');

async function handleDiscover(args, adapter) {
  const { repos = null, judge = true, save = true } = args;

  try {
    const result = await gitScanner.fullScan({ repos, judge, save });

    return {
      success: true,
      timestamp: result.timestamp,
      repos_scanned: result.discoveries.length,
      total_patterns: result.summary?.totalPatterns || 0,
      total_dependencies: result.summary?.totalDependencies || 0,
      total_contributors: result.summary?.totalContributors || 0,
      discoveries: result.discoveries.map(d => ({
        name: d.name,
        patterns: d.patterns.length,
        dependencies: d.dependencies.length,
        contributors: d.contributors.length,
        architecture: d.architecture.map(a => a.value),
        cynic: d.cynic,
      })),
      storage_path: gitScanner.DISCOVERED_DIR,
      message: `Discovered ${result.discoveries.length} repositories with ${result.summary?.totalPatterns || 0} patterns`,
      philosophy: 'CYNIC discovers, never assumes. φ guides the scan.',
      _quality: 85,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Discovery failed: ' + error.message,
      _quality: 20,
    };
  }
}

async function handleDiscoverStatus(args, adapter) {
  try {
    const summary = gitScanner.loadDiscoveries();

    if (!summary) {
      return {
        success: false,
        message: 'No previous discoveries found. Run brain_discover first.',
        _quality: 50,
      };
    }

    return {
      success: true,
      last_scan: summary.timestamp,
      repos_discovered: summary.totalRepos,
      total_patterns: summary.totalPatterns,
      total_dependencies: summary.totalDependencies,
      total_contributors: summary.totalContributors,
      repos: summary.repos,
      storage_path: gitScanner.DISCOVERED_DIR,
      message: `Last scan: ${summary.timestamp}. ${summary.totalRepos} repos, ${summary.totalPatterns} patterns.`,
      _quality: 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to load discovery status: ' + error.message,
      _quality: 20,
    };
  }
}

module.exports = {
  handleDiscover,
  handleDiscoverStatus,
};
