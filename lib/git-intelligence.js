/**
 * git-intelligence.js - Proactive Git/GitHub State Awareness
 *
 * Philosophy: Brain should KNOW before being asked.
 * "Don't trust, verify. Don't wait, anticipate."
 *
 * Security: Uses execFileSync (not exec) to prevent command injection.
 * All git commands use explicit argument arrays.
 *
 * CYNIC Integration: All git problems are judged before surfacing.
 * "φ qui surveille le code"
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// =============================================================================
// CYNIC INTEGRATION - Injected at runtime
// =============================================================================

let cynicJudge = null;

function setCynicJudge(judge) {
  cynicJudge = judge;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const REPOS = {
  holdex: {
    path: '/workspaces/HolDex',
    fork: 'zeyxx/HolDex',
    upstream: 'sollama58/HolDex',
    prodBranch: 'main'
  },
  gasdf: {
    path: '/workspaces/GASdf',
    fork: 'zeyxx/GASdf',
    upstream: 'sollama58/GASdf',
    prodBranch: 'main'
  },
  brain: {
    path: '/workspaces/asdf-brain',
    fork: null,
    upstream: 'zeyxx/asdf-brain',
    prodBranch: 'main'
  }
};

const STATE_FILE = path.join(__dirname, '..', 'knowledge', 'live', 'git-state.json');

// =============================================================================
// SAFE EXEC HELPERS (using execFileSync - no shell injection)
// =============================================================================

function execGit(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return null;
  }
}

function execGh(args) {
  try {
    return execFileSync('gh', args, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return null;
  }
}

// =============================================================================
// BRANCH STATE ANALYSIS
// =============================================================================

function getBranchState(repoPath) {
  const branch = execGit(['branch', '--show-current'], repoPath);
  if (!branch) return null;

  const status = execGit(['status', '--porcelain'], repoPath);
  const lines = status ? status.split('\n').filter(Boolean) : [];

  const modified = lines.filter(l => l.startsWith(' M') || l.startsWith('M ')).length;
  const untracked = lines.filter(l => l.startsWith('??')).length;
  const staged = lines.filter(l => l.startsWith('A ') || l.startsWith('M ') || l.startsWith('D ')).length;

  // Check ahead/behind
  let ahead = 0, behind = 0;
  const trackingInfo = execGit(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'], repoPath);
  if (trackingInfo) {
    const parts = trackingInfo.split(/\s+/);
    ahead = parseInt(parts[0]) || 0;
    behind = parseInt(parts[1]) || 0;
  }

  // Get last commit info
  const lastCommit = execGit(['log', '-1', '--format=%H|%s|%ar'], repoPath);
  let commit = null;
  if (lastCommit) {
    const [hash, subject, relative] = lastCommit.split('|');
    commit = { hash: hash.substring(0, 7), subject, relative };
  }

  return {
    branch,
    modified,
    untracked,
    staged,
    ahead,
    behind,
    clean: lines.length === 0,
    lastCommit: commit
  };
}

// =============================================================================
// PR INTELLIGENCE
// =============================================================================

function getPRsForRepo(upstream, limit = 10) {
  const json = execGh([
    'api',
    `repos/${upstream}/pulls?state=all&per_page=${limit}`,
    '--jq',
    '[.[] | {number, title, state, draft, head: .head.ref, merged_at, created_at, user: .user.login}]'
  ]);
  if (!json) return [];

  try {
    return JSON.parse(json);
  } catch (e) {
    return [];
  }
}

function mapBranchToPR(branch, prs) {
  const pr = prs.find(p => p.head === branch);
  if (!pr) return null;

  return {
    number: pr.number,
    title: pr.title,
    state: pr.state,
    merged: pr.merged_at !== null,
    mergedAt: pr.merged_at,
    draft: pr.draft,
    author: pr.user
  };
}

// =============================================================================
// POST-MERGE DETECTION
// =============================================================================

function getCommitsAfterMerge(repoPath, mergeDate) {
  if (!mergeDate) return [];

  const commits = execGit(['log', '--oneline', `--after=${mergeDate}`], repoPath);
  if (!commits) return [];

  return commits.split('\n').filter(Boolean).map(line => {
    const [hash, ...rest] = line.split(' ');
    return { hash, subject: rest.join(' ') };
  });
}

// =============================================================================
// PROD VS DEV DRIFT
// =============================================================================

function checkProdDrift(repoPath, prodBranch = 'main') {
  const currentBranch = execGit(['branch', '--show-current'], repoPath);
  if (currentBranch === prodBranch) return { drift: 0, direction: 'same' };

  const aheadCommits = execGit(['rev-list', `${prodBranch}..HEAD`, '--count'], repoPath);
  const ahead = parseInt(aheadCommits) || 0;

  const behindCommits = execGit(['rev-list', `HEAD..${prodBranch}`, '--count'], repoPath);
  const behind = parseInt(behindCommits) || 0;

  return {
    drift: ahead + behind,
    ahead,
    behind,
    direction: ahead > 0 ? 'ahead' : behind > 0 ? 'behind' : 'same'
  };
}

// =============================================================================
// PROACTIVE SUGGESTIONS
// =============================================================================

function generateSuggestions(repoName, state, pr, drift, postMergeCommits) {
  const suggestions = [];

  if (pr?.merged && postMergeCommits.length > 0) {
    suggestions.push({
      priority: 'high',
      type: 'new_pr_needed',
      message: `${postMergeCommits.length} commits on '${state.branch}' since PR #${pr.number} was merged`,
      action: `Create new PR for: ${postMergeCommits.map(c => c.subject).join(', ')}`,
      command: `gh pr create`
    });
  }

  if (state.ahead > 0 && !pr?.merged) {
    suggestions.push({
      priority: 'medium',
      type: 'push_needed',
      message: `${state.ahead} unpushed commits on '${state.branch}'`,
      action: 'Push changes to remote',
      command: `git push`
    });
  }

  if (state.behind > 0) {
    suggestions.push({
      priority: 'medium',
      type: 'pull_needed',
      message: `${state.behind} commits behind remote`,
      action: 'Pull latest changes',
      command: `git pull`
    });
  }

  if (!state.clean) {
    const parts = [];
    if (state.modified > 0) parts.push(`${state.modified} modified`);
    if (state.untracked > 0) parts.push(`${state.untracked} untracked`);
    if (state.staged > 0) parts.push(`${state.staged} staged`);

    suggestions.push({
      priority: 'low',
      type: 'uncommitted_changes',
      message: parts.join(', '),
      action: 'Review and commit changes'
    });
  }

  if (drift.ahead > 5) {
    suggestions.push({
      priority: 'medium',
      type: 'prod_drift',
      message: `${drift.ahead} commits ahead of production`,
      action: 'Consider merging to prod or creating PR'
    });
  }

  return suggestions;
}

// =============================================================================
// CYNIC JUDGMENT OF GIT PROBLEMS
// =============================================================================

/**
 * Judge a git suggestion/problem with CYNIC
 * Maps git problem types to CYNIC dimensions
 */
function judgeSuggestion(suggestion, context = {}) {
  if (!cynicJudge) {
    return { ...suggestion, _cynic: null };
  }

  // Map git problem to judgeable item
  const item = {
    type: 'git_problem',
    subtype: suggestion.type,
    severity: suggestion.priority,
    content: suggestion.message,
    action: suggestion.action,
    repo: context.repo,
    branch: context.branch,
    // Dimensions that matter for git problems
    dimensions: {
      SOURCE_ORIGIN: suggestion.type === 'new_pr_needed' ? 60 : 70,
      TEMPORAL_VALIDITY: suggestion.priority === 'high' ? 40 : 60,
      ROBUSTNESS: suggestion.type === 'uncommitted_changes' ? 50 : 70,
      DEPENDENCY_HEALTH: suggestion.type === 'prod_drift' ? 40 : 60,
      ALIGNMENT: suggestion.priority === 'high' ? 35 : 55,
    }
  };

  try {
    const judgment = cynicJudge.judge(item, { mode: 'quick' });
    return {
      ...suggestion,
      _cynic: {
        verdict: judgment.verdict,
        confidence: judgment.confidence,
        globalScore: judgment.globalScore,
        shouldAlert: judgment.verdict === 'REJECT' ||
                     (judgment.verdict === 'TRANSFORM' && suggestion.priority === 'high'),
      }
    };
  } catch (e) {
    return { ...suggestion, _cynic: { error: e.message } };
  }
}

/**
 * Judge all suggestions from a repo scan
 */
function judgeAllSuggestions(suggestions, context = {}) {
  return suggestions.map(s => judgeSuggestion(s, { ...context, repo: s.repo }));
}

/**
 * Filter suggestions that CYNIC thinks need attention
 */
function getAlertableSuggestions(judgedSuggestions) {
  return judgedSuggestions.filter(s =>
    s._cynic?.shouldAlert ||
    (s.priority === 'high' && !s._cynic) // High priority without CYNIC still alerts
  );
}

// =============================================================================
// MAIN INTELLIGENCE GATHERING
// =============================================================================

function gatherIntelligence(repoName) {
  const config = REPOS[repoName];
  if (!config || !fs.existsSync(config.path)) {
    return { error: `Repo ${repoName} not found` };
  }

  const state = getBranchState(config.path);
  if (!state) return { error: 'Could not read git state' };

  const prs = config.upstream ? getPRsForRepo(config.upstream) : [];
  const pr = mapBranchToPR(state.branch, prs);

  const postMergeCommits = pr?.merged
    ? getCommitsAfterMerge(config.path, pr.mergedAt)
    : [];

  const drift = checkProdDrift(config.path, config.prodBranch);
  const suggestions = generateSuggestions(repoName, state, pr, drift, postMergeCommits);

  return {
    repo: repoName,
    timestamp: new Date().toISOString(),
    branch: state,
    pr,
    postMergeCommits,
    drift,
    suggestions,
    recentPRs: prs.slice(0, 5).map(p => ({
      number: p.number,
      title: p.title.substring(0, 50),
      state: p.merged_at ? 'merged' : p.state,
      branch: p.head
    }))
  };
}

// =============================================================================
// FULL ECOSYSTEM SCAN
// =============================================================================

function scanEcosystem(options = {}) {
  const { judge = true } = options;
  const results = {};
  const allSuggestions = [];

  for (const [name, config] of Object.entries(REPOS)) {
    if (fs.existsSync(config.path)) {
      const intel = gatherIntelligence(name);
      results[name] = intel;

      if (intel.suggestions) {
        allSuggestions.push(...intel.suggestions.map(s => ({
          ...s,
          repo: name
        })));
      }
    }
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  allSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // CYNIC judges all suggestions if available
  const judgedSuggestions = judge && cynicJudge
    ? judgeAllSuggestions(allSuggestions)
    : allSuggestions;

  // Filter suggestions that CYNIC thinks need immediate attention
  const alertable = getAlertableSuggestions(judgedSuggestions);

  const summary = {
    timestamp: new Date().toISOString(),
    repos: results,
    suggestions: judgedSuggestions,
    alertable,
    cynicEnabled: !!cynicJudge,
    summary: {
      totalRepos: Object.keys(results).length,
      highPriority: judgedSuggestions.filter(s => s.priority === 'high').length,
      mediumPriority: judgedSuggestions.filter(s => s.priority === 'medium').length,
      lowPriority: judgedSuggestions.filter(s => s.priority === 'low').length,
      cynicAlerts: alertable.length,
    }
  };

  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(summary, null, 2));
  } catch (e) {
    // Ignore persistence errors
  }

  return summary;
}

// =============================================================================
// FORMATTED OUTPUT
// =============================================================================

function formatForAwakening(intel) {
  const lines = [];

  for (const [repo, data] of Object.entries(intel.repos)) {
    if (data.error) continue;

    const branch = data.branch;
    const pr = data.pr;

    let status = `${repo.toUpperCase()} [${branch.branch}]`;
    if (pr) {
      status += pr.merged
        ? ` <- PR #${pr.number} MERGED`
        : ` <- PR #${pr.number} ${pr.state.toUpperCase()}`;
    }
    lines.push(status);

    const details = [];
    if (branch.modified > 0) details.push(`${branch.modified} modified`);
    if (branch.untracked > 0) details.push(`${branch.untracked} untracked`);
    if (branch.ahead > 0) details.push(`${branch.ahead} ahead`);
    if (branch.behind > 0) details.push(`${branch.behind} behind`);

    if (details.length > 0) {
      lines.push(`   ${details.join(', ')}`);
    }

    if (data.postMergeCommits?.length > 0) {
      lines.push(`   !!! ${data.postMergeCommits.length} COMMITS SINCE MERGE:`);
      data.postMergeCommits.slice(0, 3).forEach(c => {
        lines.push(`      - ${c.hash} ${c.subject}`);
      });
    }
  }

  const highPriority = intel.suggestions.filter(s => s.priority === 'high');
  if (highPriority.length > 0) {
    lines.push('');
    lines.push('ACTION REQUIRED:');
    highPriority.forEach(s => {
      lines.push(`   [${s.repo}] ${s.message}`);
      if (s.action) lines.push(`   -> ${s.action}`);
    });
  }

  return lines.join('\n');
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Configuration
  REPOS,
  // Core functions
  getBranchState,
  getPRsForRepo,
  mapBranchToPR,
  getCommitsAfterMerge,
  checkProdDrift,
  gatherIntelligence,
  scanEcosystem,
  formatForAwakening,
  // CYNIC Integration
  setCynicJudge,
  judgeSuggestion,
  judgeAllSuggestions,
  getAlertableSuggestions,
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  const intel = scanEcosystem();
  console.log('\n' + formatForAwakening(intel));
  console.log('\n--- Raw Data ---');
  console.log(JSON.stringify(intel.summary, null, 2));
}
