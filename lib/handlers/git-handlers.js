/**
 * Git Handlers - brain_git_*
 *
 * [R] Remez - Git intelligence with CYNIC judgment
 *
 * Philosophy: "Don't trust, verify. Don't wait, anticipate."
 * "φ qui surveille le code"
 */

'use strict';

const gitIntelligence = require('../git-intelligence');

// CYNIC instance will be injected
let cynicJudge = null;

function setCynicJudge(judge) {
  cynicJudge = judge;
  // Also inject into git-intelligence module
  gitIntelligence.setCynicJudge(judge);
}

/**
 * brain_git_scan - Full ecosystem git scan with CYNIC judgment
 */
async function handleGitScan(args, adapter) {
  const { repos = null, judge = true } = args;

  try {
    const intel = gitIntelligence.scanEcosystem({ judge });

    return {
      success: true,
      timestamp: intel.timestamp,
      repos: Object.keys(intel.repos),
      summary: intel.summary,
      suggestions: intel.suggestions,
      alertable: intel.alertable,
      cynicEnabled: intel.cynicEnabled,
      message: `Scanned ${intel.summary.totalRepos} repos. ${intel.summary.cynicAlerts || 0} CYNIC alerts.`,
      philosophy: "Don't wait, anticipate.",
      _quality: intel.summary.cynicAlerts > 0 ? 60 : 80,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

/**
 * brain_git_status - Get current git state for a repo
 */
async function handleGitStatus(args, adapter) {
  const { repo = 'brain' } = args;

  try {
    const intel = gitIntelligence.gatherIntelligence(repo);

    if (intel.error) {
      return {
        success: false,
        error: intel.error,
        _quality: 30,
      };
    }

    // Judge the suggestions if CYNIC is available
    let suggestions = intel.suggestions || [];
    if (cynicJudge && suggestions.length > 0) {
      suggestions = gitIntelligence.judgeAllSuggestions(suggestions, { repo });
    }

    return {
      success: true,
      repo,
      branch: intel.branch,
      pr: intel.pr,
      drift: intel.drift,
      postMergeCommits: intel.postMergeCommits,
      suggestions,
      alertable: gitIntelligence.getAlertableSuggestions(suggestions),
      recentPRs: intel.recentPRs,
      message: `${repo}: ${intel.branch.branch} - ${intel.branch.clean ? 'clean' : 'uncommitted changes'}`,
      _quality: intel.branch.clean ? 85 : 60,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

/**
 * brain_git_problems - Get all git problems across ecosystem (CYNIC filtered)
 */
async function handleGitProblems(args, adapter) {
  const { severity = 'all' } = args;

  try {
    const intel = gitIntelligence.scanEcosystem({ judge: true });

    let problems = intel.alertable || [];

    // Filter by severity if specified
    if (severity !== 'all') {
      problems = problems.filter(p => p.priority === severity);
    }

    // Group by repo
    const byRepo = {};
    problems.forEach(p => {
      if (!byRepo[p.repo]) byRepo[p.repo] = [];
      byRepo[p.repo].push(p);
    });

    return {
      success: true,
      total: problems.length,
      byRepo,
      problems,
      summary: {
        high: problems.filter(p => p.priority === 'high').length,
        medium: problems.filter(p => p.priority === 'medium').length,
        low: problems.filter(p => p.priority === 'low').length,
        cynicRejected: problems.filter(p => p._cynic?.verdict === 'REJECT').length,
      },
      cynicEnabled: intel.cynicEnabled,
      message: `${problems.length} git problems detected across ${Object.keys(byRepo).length} repos`,
      philosophy: "φ qui surveille le code",
      _quality: problems.length === 0 ? 90 : (problems.length > 5 ? 40 : 60),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      _quality: 20,
    };
  }
}

/**
 * brain_git_drift - Check production drift across all repos
 */
async function handleGitDrift(args, adapter) {
  try {
    const results = {};
    let totalDrift = 0;

    for (const [name, config] of Object.entries(gitIntelligence.REPOS)) {
      const drift = gitIntelligence.checkProdDrift(config.path, config.prodBranch);
      results[name] = {
        ...drift,
        prodBranch: config.prodBranch,
      };
      totalDrift += drift.drift || 0;
    }

    return {
      success: true,
      repos: results,
      totalDrift,
      message: totalDrift === 0
        ? 'All repos in sync with production'
        : `${totalDrift} total commits of drift across repos`,
      philosophy: "Drift is debt. Pay it early.",
      _quality: totalDrift === 0 ? 90 : (totalDrift > 10 ? 40 : 60),
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
  handleGitScan,
  handleGitStatus,
  handleGitProblems,
  handleGitDrift,
  setCynicJudge,
};
