/**
 * repo-discovery.js - Auto-Discovery of Repository Structure
 *
 * Philosophy: Brain should LEARN, not be told.
 * "Observe patterns, infer truth, verify continuously."
 *
 * This module discovers:
 * - Repository locations
 * - Branch roles (prod vs dev) from commit patterns
 * - Operators and their commit styles
 * - Deployment targets (Render services)
 * - Sync state between repos
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const KNOWLEDGE_FILE = path.join(__dirname, '..', 'knowledge', 'live', 'repo-map.json');
const WORKSPACES_ROOT = '/workspaces';

// =============================================================================
// AUTO-DISCOVERY
// =============================================================================

function discoverRepos() {
  const repos = {};

  try {
    const entries = fs.readdirSync(WORKSPACES_ROOT, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const repoPath = path.join(WORKSPACES_ROOT, entry.name);
      const gitPath = path.join(repoPath, '.git');

      if (fs.existsSync(gitPath)) {
        const repoInfo = analyzeRepo(repoPath, entry.name);
        if (repoInfo) {
          repos[entry.name.toLowerCase()] = repoInfo;
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }

  return repos;
}

function analyzeRepo(repoPath, name) {
  try {
    // Get all remotes
    const remotes = getRemotes(repoPath);

    // Get all branches (local + remote)
    const branches = getBranches(repoPath);

    // Analyze branch patterns to determine roles
    const branchRoles = analyzeBranchRoles(repoPath, branches);

    // Get operators (who commits where)
    const operators = analyzeOperators(repoPath, branches);

    // Current state
    const currentBranch = execGit(['branch', '--show-current'], repoPath);

    return {
      name,
      path: repoPath,
      remotes,
      branches,
      branchRoles,
      operators,
      currentBranch,
      discoveredAt: new Date().toISOString()
    };
  } catch (e) {
    return null;
  }
}

function getRemotes(repoPath) {
  const remotes = {};
  const output = execGit(['remote', '-v'], repoPath);
  if (!output) return remotes;

  for (const line of output.split('\n')) {
    const match = line.match(/^(\w+)\s+(.+?)\s+\((fetch|push)\)$/);
    if (match && match[3] === 'fetch') {
      const [, name, url] = match;
      // Extract owner/repo from URL
      const repoMatch = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
      remotes[name] = {
        url,
        ownerRepo: repoMatch ? repoMatch[1] : null
      };
    }
  }

  return remotes;
}

function getBranches(repoPath) {
  const branches = { local: [], remote: {} };

  // Local branches
  const localOutput = execGit(['branch', '--format=%(refname:short)'], repoPath);
  if (localOutput) {
    branches.local = localOutput.split('\n').filter(Boolean);
  }

  // Remote branches
  const remoteOutput = execGit(['branch', '-r', '--format=%(refname:short)'], repoPath);
  if (remoteOutput) {
    for (const branch of remoteOutput.split('\n').filter(Boolean)) {
      const [remote, ...nameParts] = branch.split('/');
      const name = nameParts.join('/');
      if (name && !name.includes('HEAD')) {
        if (!branches.remote[remote]) branches.remote[remote] = [];
        branches.remote[remote].push(name);
      }
    }
  }

  return branches;
}

// =============================================================================
// PATTERN ANALYSIS - Infer branch roles from commit patterns
// =============================================================================

function analyzeBranchRoles(repoPath, branches) {
  const roles = {};

  // Analyze each remote's branches
  for (const [remote, branchList] of Object.entries(branches.remote)) {
    for (const branch of branchList) {
      const analysis = analyzeBranchPattern(repoPath, `${remote}/${branch}`);
      const key = `${remote}/${branch}`;
      roles[key] = {
        branch,
        remote,
        ...analysis
      };
    }
  }

  // Infer prod branch: highest hotfix ratio, short commit messages
  let prodCandidate = null;
  let highestProdScore = 0;

  for (const [key, data] of Object.entries(roles)) {
    const prodScore = calculateProdScore(data);
    if (prodScore > highestProdScore) {
      highestProdScore = prodScore;
      prodCandidate = key;
    }
  }

  if (prodCandidate) {
    roles[prodCandidate].inferredRole = 'production';
    roles[prodCandidate].prodScore = highestProdScore;
  }

  return roles;
}

function analyzeBranchPattern(repoPath, branchRef) {
  // Get recent commits (last 20)
  const logOutput = execGit([
    'log', branchRef, '-20',
    '--format=%H|%an|%s|%ar'
  ], repoPath);

  if (!logOutput) return { commits: 0 };

  const commits = logOutput.split('\n').filter(Boolean).map(line => {
    const [hash, author, subject, relativeDate] = line.split('|');
    return { hash, author, subject, relativeDate };
  });

  // Analyze patterns
  const analysis = {
    commits: commits.length,
    authors: [...new Set(commits.map(c => c.author))],
    patterns: {
      hotfixes: 0,        // Short messages like "fix", "fixes", "DB FIX"
      features: 0,        // Messages starting with "feat:", "feature:"
      structured: 0,      // Messages following conventional commits
      quickFixes: 0       // Very short messages (<20 chars)
    },
    avgMessageLength: 0
  };

  let totalLength = 0;

  for (const commit of commits) {
    const msg = commit.subject.toLowerCase();
    totalLength += commit.subject.length;

    // Detect patterns
    if (msg.length < 20) analysis.patterns.quickFixes++;
    if (/^(fix|fixes|hotfix|db fix|please|pls)/i.test(msg)) analysis.patterns.hotfixes++;
    if (/^(feat|feature|chore|refactor|docs|test|ci)(\(|:)/i.test(msg)) analysis.patterns.structured++;
    if (/^feat/i.test(msg)) analysis.patterns.features++;
  }

  analysis.avgMessageLength = commits.length > 0 ? totalLength / commits.length : 0;

  return analysis;
}

function calculateProdScore(branchData) {
  if (!branchData.commits || branchData.commits === 0) return 0;

  // Production branches tend to have:
  // - More hotfixes/quick fixes
  // - Shorter commit messages
  // - Fewer structured commits
  // - Often single operator

  let score = 0;

  // Hotfix ratio
  const hotfixRatio = (branchData.patterns?.hotfixes || 0) / branchData.commits;
  score += hotfixRatio * 40;

  // Quick fix ratio
  const quickFixRatio = (branchData.patterns?.quickFixes || 0) / branchData.commits;
  score += quickFixRatio * 30;

  // Inverse structured ratio (less structured = more prod-like)
  const structuredRatio = (branchData.patterns?.structured || 0) / branchData.commits;
  score += (1 - structuredRatio) * 20;

  // Short average message length
  if (branchData.avgMessageLength < 30) score += 10;

  return score;
}

// =============================================================================
// OPERATOR ANALYSIS
// =============================================================================

function analyzeOperators(repoPath, branches) {
  const operators = {};

  for (const [remote, branchList] of Object.entries(branches.remote)) {
    for (const branch of branchList) {
      const logOutput = execGit([
        'log', `${remote}/${branch}`, '-50',
        '--format=%an'
      ], repoPath);

      if (logOutput) {
        const authors = logOutput.split('\n').filter(Boolean);
        const authorCounts = {};

        for (const author of authors) {
          authorCounts[author] = (authorCounts[author] || 0) + 1;
        }

        // Primary operator = most commits
        const sorted = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          const key = `${remote}/${branch}`;
          operators[key] = {
            primary: sorted[0][0],
            contributors: sorted.map(([name, count]) => ({ name, commits: count }))
          };
        }
      }
    }
  }

  return operators;
}

// =============================================================================
// SYNC ANALYSIS
// =============================================================================

function analyzeSyncState(repoPath, branches, remotes) {
  const syncState = {};

  // Compare each pair of remotes for same-named branches
  const remoteNames = Object.keys(remotes);

  for (let i = 0; i < remoteNames.length; i++) {
    for (let j = i + 1; j < remoteNames.length; j++) {
      const remote1 = remoteNames[i];
      const remote2 = remoteNames[j];

      const branches1 = branches.remote[remote1] || [];
      const branches2 = branches.remote[remote2] || [];

      // Find common branches
      for (const branch of branches1) {
        if (branches2.includes(branch)) {
          const ref1 = `${remote1}/${branch}`;
          const ref2 = `${remote2}/${branch}`;

          const ahead = execGit(['rev-list', '--count', `${ref2}..${ref1}`], repoPath);
          const behind = execGit(['rev-list', '--count', `${ref1}..${ref2}`], repoPath);

          syncState[`${ref1}<->${ref2}`] = {
            ahead: parseInt(ahead) || 0,
            behind: parseInt(behind) || 0
          };
        }
      }
    }
  }

  return syncState;
}

// =============================================================================
// FULL ECOSYSTEM DISCOVERY
// =============================================================================

function discoverEcosystem() {
  const repos = discoverRepos();

  // Add cross-repo sync analysis
  const ecosystem = {
    timestamp: new Date().toISOString(),
    repos,
    crossRepoSync: {},
    inferences: {
      prodBranches: {},
      primaryOperators: {}
    }
  };

  // Extract inferences
  for (const [repoName, repoData] of Object.entries(repos)) {
    // Find prod branch
    for (const [branchKey, roleData] of Object.entries(repoData.branchRoles || {})) {
      if (roleData.inferredRole === 'production') {
        ecosystem.inferences.prodBranches[repoName] = {
          branch: roleData.branch,
          remote: roleData.remote,
          confidence: roleData.prodScore / 100
        };
      }
    }

    // Find primary operator per branch
    for (const [branchKey, opData] of Object.entries(repoData.operators || {})) {
      if (!ecosystem.inferences.primaryOperators[repoName]) {
        ecosystem.inferences.primaryOperators[repoName] = {};
      }
      ecosystem.inferences.primaryOperators[repoName][branchKey] = opData.primary;
    }
  }

  // Persist
  try {
    const dir = path.dirname(KNOWLEDGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(ecosystem, null, 2));
  } catch (e) {
    // Ignore
  }

  return ecosystem;
}

// =============================================================================
// HELPERS
// =============================================================================

function execGit(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return null;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  discoverRepos,
  analyzeRepo,
  analyzeBranchRoles,
  analyzeOperators,
  analyzeSyncState,
  discoverEcosystem,
  KNOWLEDGE_FILE
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('🔍 Discovering ecosystem...\n');
  const ecosystem = discoverEcosystem();

  console.log('=== DISCOVERED REPOS ===');
  for (const [name, data] of Object.entries(ecosystem.repos)) {
    console.log(`\n📁 ${name.toUpperCase()}`);
    console.log(`   Path: ${data.path}`);
    console.log(`   Current: ${data.currentBranch}`);
    console.log(`   Remotes: ${Object.keys(data.remotes).join(', ')}`);

    // Show inferred prod branch
    const prodInference = ecosystem.inferences.prodBranches[name];
    if (prodInference) {
      console.log(`   🏭 PROD (inferred): ${prodInference.remote}/${prodInference.branch} (${(prodInference.confidence * 100).toFixed(0)}% confidence)`);
    }
  }

  console.log('\n=== INFERENCES ===');
  console.log(JSON.stringify(ecosystem.inferences, null, 2));
}
