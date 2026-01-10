#!/usr/bin/env node
/**
 * brain-awakening.js - The Living Brain Activation Script
 *
 * Philosophy: asdf-brain should be ALIVE, not dormant.
 * "Don't trust, verify. Don't extract, burn."
 *
 * This script runs at SessionStart to:
 * 1. Detect current project context
 * 2. Check ecosystem health
 * 3. Surface relevant patterns and decisions
 * 4. Alert on issues proactively
 *
 * Security: Uses execSync with hardcoded git commands only (no user input)
 *
 * Usage:
 *   node brain-awakening.js                    # Full awakening
 *   node brain-awakening.js --project holdex  # Force project
 *   node brain-awakening.js --quiet           # Minimal output
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const gitIntel = require('../lib/git-intelligence');
const repoDiscovery = require('../lib/repo-discovery');
const { getOperatorLoader } = require('../lib/operator-loader');

// =============================================================================
// CONFIGURATION
// =============================================================================

const BRAIN_ROOT = path.join(__dirname, '..');
const KNOWLEDGE_ROOT = path.join(BRAIN_ROOT, 'knowledge');

// φ thresholds for alert severity
const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = require('../lib/temporal');
const THRESHOLD_HIGH = PHI_INV;    // φ⁻¹ - Act immediately
const THRESHOLD_MEDIUM = PHI_INV_2;  // φ⁻² - Verify soon
const THRESHOLD_LOW = PHI_INV_3;     // φ⁻³ - Research when time

// =============================================================================
// LOGGING - Emoji-based severity (aligned with HolDex conventions)
// =============================================================================

const log = {
  brain: (msg) => console.log(`🧠 ${msg}`),
  alert: (msg) => console.log(`⚠️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  info: (msg) => console.log(`📋 ${msg}`),
  pattern: (msg) => console.log(`🔄 ${msg}`),
  decision: (msg) => console.log(`📌 ${msg}`),
  vision: (msg) => console.log(`🔮 ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
};

// =============================================================================
// PROJECT DETECTION
// =============================================================================

function detectProject(cwd) {
  const cwdLower = cwd.toLowerCase();

  if (cwdLower.includes('holdex')) return 'holdex';
  if (cwdLower.includes('gasdf')) return 'gasdf';
  if (cwdLower.includes('brain')) return 'brain';
  if (cwdLower.includes('manifesto')) return 'manifesto';
  if (cwdLower.includes('forecast')) return 'asdforecast';

  return 'ecosystem';
}

/**
 * Detect operator from git config (hardcoded command - safe from injection)
 */
function detectOperatorFromGit() {
  try {
    // Hardcoded git command - no user input - safe
    const username = execSync('git config user.name', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return username || null;
  } catch (e) {
    return null;
  }
}

// =============================================================================
// GIT STATE ANALYSIS (hardcoded commands - no user input)
// =============================================================================

function analyzeGitState(repoPath) {
  try {
    // All commands are hardcoded - safe from injection
    const status = execSync('git status --porcelain', {
      cwd: repoPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const branch = execSync('git branch --show-current', {
      cwd: repoPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    // Check if behind/ahead of remote
    let drift = { ahead: 0, behind: 0 };
    try {
      const trackingInfo = execSync('git rev-list --left-right --count HEAD...@{upstream}', {
        cwd: repoPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim().split(/\s+/);
      drift.ahead = parseInt(trackingInfo[0]) || 0;
      drift.behind = parseInt(trackingInfo[1]) || 0;
    } catch (e) {
      // No upstream configured
    }

    const changes = status.split('\n').filter(l => l.trim());
    const modified = changes.filter(l => l.startsWith(' M') || l.startsWith('M ')).length;
    const untracked = changes.filter(l => l.startsWith('??')).length;
    const staged = changes.filter(l => l.startsWith('A ') || l.startsWith('M ') || l.startsWith('D ')).length;

    return {
      branch,
      modified,
      untracked,
      staged,
      drift,
      hasChanges: changes.length > 0,
    };
  } catch (e) {
    return null;
  }
}

// =============================================================================
// GITHUB PR/FORK STATUS (requires gh CLI)
// =============================================================================

// Fork relationships - CRITICAL KNOWLEDGE
const FORK_MAP = {
  'HolDex': {
    upstream: 'sollama58/HolDex',
    fork: 'zeyxx/HolDex',
    targetBranch: 'NewDexSOCKETS',
  },
};

function checkGitHubStatus() {
  const results = { prs: [], forkSync: [] };

  try {
    // Check for open PRs on upstream repos
    for (const [name, config] of Object.entries(FORK_MAP)) {
      try {
        const prsJson = execSync(`gh api repos/${config.upstream}/pulls --jq '[.[] | {number, title, state, draft}]'`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 5000,
        });
        const prs = JSON.parse(prsJson || '[]');
        if (prs.length > 0) {
          results.prs.push({ repo: name, upstream: config.upstream, prs });
        }
      } catch (e) {
        // gh CLI not available or API error
      }
    }
  } catch (e) {
    // Silent fail - gh might not be installed
  }

  return results;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

function loadHealth() {
  const healthPath = path.join(KNOWLEDGE_ROOT, 'health/ecosystem-health.json');
  try {
    return JSON.parse(fs.readFileSync(healthPath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

// =============================================================================
// RECENT LEARNINGS
// =============================================================================

function loadRecentLearnings(limit = 5) {
  const livePath = path.join(KNOWLEDGE_ROOT, 'learned/live.jsonl');
  try {
    const lines = fs.readFileSync(livePath, 'utf-8').trim().split('\n');
    return lines
      .slice(-limit)
      .map(l => {
        try { return JSON.parse(l); } catch { return null; }
      })
      .filter(Boolean)
      .reverse();
  } catch (e) {
    return [];
  }
}

// =============================================================================
// ECOSYSTEM GRAPH
// =============================================================================

function loadEcosystem() {
  const graphPath = path.join(KNOWLEDGE_ROOT, 'relations/ecosystem-graph.json');
  try {
    return JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

// =============================================================================
// DEPENDENCY CHECK
// =============================================================================

function checkDependencyMismatches() {
  const depsPath = path.join(KNOWLEDGE_ROOT, 'dependencies/dependency-graph.json');
  try {
    const data = JSON.parse(fs.readFileSync(depsPath, 'utf-8'));
    return data.mismatches || [];
  } catch (e) {
    return [];
  }
}

// =============================================================================
// MAIN AWAKENING SEQUENCE
// =============================================================================

async function awaken(options = {}) {
  const cwd = options.cwd || process.cwd();
  const project = options.project || detectProject(cwd);
  const quiet = options.quiet || false;

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  log.brain('ASDF-BRAIN AWAKENING - "Don\'t trust, verify"');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // 1. Project Context
  log.info(`Project detected: ${project.toUpperCase()}`);
  log.info(`Working directory: ${cwd}`);

  // 1b. Operator Context (if available)
  let operatorContext = null;
  const operatorId = options.operator || process.env.OPERATOR_ID || detectOperatorFromGit();
  if (operatorId) {
    try {
      const loader = getOperatorLoader();
      operatorContext = loader.getOperatorSummary(operatorId);
      if (operatorContext) {
        log.info(`Operator: ${operatorContext.displayName}`);
        if (operatorContext.roles?.length > 0) {
          console.log(`   Roles: ${operatorContext.roles.join(', ')}`);
        }
      }
    } catch (e) {
      // Operator loading is optional
    }
  }
  console.log('');

  // 2. Git Intelligence (branches, PRs, post-merge commits)
  console.log('── GIT INTELLIGENCE ───────────────────────────────────────');
  let hasGitAlerts = false;
  let gitSuggestions = [];

  try {
    const intel = gitIntel.scanEcosystem();

    for (const [repoName, data] of Object.entries(intel.repos)) {
      if (data.error) continue;

      const branch = data.branch;
      const pr = data.pr;

      // Build status line
      let status = `${repoName.toUpperCase()} [${branch.branch}]`;
      if (pr) {
        status += pr.merged
          ? ` ← PR #${pr.number} MERGED`
          : ` ← PR #${pr.number} ${pr.state.toUpperCase()}`;
      }

      // Determine alert level
      const alerts = [];
      if (branch.modified > 0) alerts.push(`${branch.modified} modified`);
      if (branch.untracked > 0) alerts.push(`${branch.untracked} untracked`);
      if (branch.behind > 0) alerts.push(`${branch.behind} behind`);

      if (data.postMergeCommits?.length > 0) {
        // Critical: commits after PR was merged
        log.alert(`${status}`);
        console.log(`   🔴 ${data.postMergeCommits.length} commits SINCE PR merged!`);
        data.postMergeCommits.slice(0, 2).forEach(c => {
          console.log(`      • ${c.hash} ${c.subject.substring(0, 50)}`);
        });
        hasGitAlerts = true;
      } else if (alerts.length > 0) {
        log.alert(`${status}: ${alerts.join(', ')}`);
        hasGitAlerts = true;
      } else if (!quiet) {
        log.success(`${status}: clean`);
      }
    }

    // Collect suggestions
    gitSuggestions = intel.suggestions || [];

  } catch (e) {
    // Fallback to simple git state if intel fails
    const repos = [
      { name: 'HolDex', path: '/workspaces/HolDex' },
      { name: 'GASdf', path: '/workspaces/GASdf' },
      { name: 'asdf-brain', path: '/workspaces/asdf-brain' },
    ];

    for (const repo of repos) {
      if (fs.existsSync(repo.path)) {
        const state = analyzeGitState(repo.path);
        if (state) {
          const alerts = [];
          if (state.modified > 0) alerts.push(`${state.modified} modified`);
          if (state.untracked > 0) alerts.push(`${state.untracked} untracked`);
          if (state.drift.behind > 0) alerts.push(`${state.drift.behind} behind`);

          if (alerts.length > 0) {
            log.alert(`${repo.name} [${state.branch}]: ${alerts.join(', ')}`);
            hasGitAlerts = true;
          } else if (!quiet) {
            log.success(`${repo.name} [${state.branch}]: clean`);
          }
        }
      }
    }
  }

  if (!hasGitAlerts && !quiet) {
    log.success('All repositories in sync');
  }
  console.log('');

  // 2b. Action Required (from git intelligence)
  const highPrioritySuggestions = gitSuggestions.filter(s => s.priority === 'high');
  if (highPrioritySuggestions.length > 0) {
    console.log('── 🔴 ACTION REQUIRED ─────────────────────────────────────');
    highPrioritySuggestions.forEach(s => {
      log.alert(`[${s.repo}] ${s.message}`);
      if (s.action) console.log(`   → ${s.action}`);
    });
    console.log('');
  }

  // 2c. Auto-Discovered Repository Structure
  if (!quiet) {
    console.log('── DISCOVERED ECOSYSTEM ───────────────────────────────────');
    try {
      const ecosystem = repoDiscovery.discoverEcosystem();
      const prodBranches = ecosystem.inferences?.prodBranches || {};

      if (Object.keys(prodBranches).length > 0) {
        for (const [repoName, inference] of Object.entries(prodBranches)) {
          const confidence = Math.round((inference.confidence || 0) * 100);
          log.vision(`${repoName.toUpperCase()} PROD: ${inference.remote}/${inference.branch} (${confidence}% confidence)`);
        }
      }

      // Show operator insights if available
      const operators = ecosystem.inferences?.primaryOperators || {};
      const operatorSummary = new Set();
      for (const [repo, branches] of Object.entries(operators)) {
        for (const op of Object.values(branches)) {
          operatorSummary.add(op);
        }
      }
      if (operatorSummary.size > 0) {
        log.info(`Active operators: ${[...operatorSummary].join(', ')}`);
      }
    } catch (e) {
      log.info('Repository discovery: run manually for full analysis');
    }
    console.log('');
  }

  // 3. Ecosystem Health
  console.log('── ECOSYSTEM HEALTH ───────────────────────────────────────');
  const health = loadHealth();
  if (health) {
    const score = health.overall_score || health.overall?.score || 0;
    const status = health.status || health.overall?.status || 'unknown';

    if (score >= 80) {
      log.success(`Health: ${score}/100 (${status})`);
    } else if (score >= 60) {
      log.alert(`Health: ${score}/100 (${status}) - needs attention`);
    } else {
      log.error(`Health: ${score}/100 (${status}) - critical`);
    }

    // Show recommendations
    if (health.recommendations && health.recommendations.length > 0) {
      console.log('');
      log.info('Recommendations:');
      health.recommendations.slice(0, 3).forEach((rec, i) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`   ${priority} ${rec.action}`);
      });
    }
  } else {
    log.alert('Health data not available - run: npm run brain:health');
  }
  console.log('');

  // 4. Dependency Mismatches
  const mismatches = checkDependencyMismatches();
  if (mismatches.length > 0) {
    console.log('── DEPENDENCY ALERTS ──────────────────────────────────────');
    log.alert(`${mismatches.length} version mismatches detected`);
    mismatches.slice(0, 3).forEach(m => {
      console.log(`   • ${m.package}: ${m.versions?.join(' vs ')}`);
    });
    console.log('');
  }

  // 5. Recent Learnings (Context for current session)
  console.log('── RECENT CONTEXT ─────────────────────────────────────────');
  const learnings = loadRecentLearnings(3);
  if (learnings.length > 0) {
    learnings.forEach(l => {
      const icon = l.type === 'decision' ? '📌' : l.type === 'insight' ? '💡' : '🔄';
      const preview = (l.content || '').slice(0, 80);
      console.log(`   ${icon} [${l.type}] ${preview}...`);
    });
  } else {
    log.info('No recent learnings');
  }
  console.log('');

  // 6. Project-Specific Context
  if (project !== 'ecosystem') {
    console.log(`── ${project.toUpperCase()} CONTEXT ────────────────────────────────────────`);
    const ecosystem = loadEcosystem();
    if (ecosystem && ecosystem.nodes && ecosystem.nodes[project]) {
      const node = ecosystem.nodes[project];
      log.info(`Role: ${node.role}`);
      log.info(`Layer: ${node.layer} (${node.sefirah})`);
      if (node.status) log.info(`Status: ${node.status}`);
    }
    console.log('');
  }

  // 7. Codespaces Reminder (critical for multi-repo work)
  if (process.env.CODESPACES === 'true' || process.env.GITHUB_TOKEN) {
    console.log('── CODESPACES REMINDER ────────────────────────────────────');
    log.alert('GITHUB_TOKEN is scoped to origin repo only!');
    console.log('   To push to other repos: unset GITHUB_TOKEN first');
    console.log('   Then: git push https://$(gh auth token)@github.com/OWNER/REPO.git');
    console.log('');
  }

  // 8. Closing
  console.log('═══════════════════════════════════════════════════════════');
  log.brain('Brain is AWAKE and monitoring. φ guides all ratios.');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Return structured data for programmatic use
  return {
    project,
    operator: operatorContext,
    health: health?.overall_score || 0,
    alerts: {
      git: hasGitAlerts,
      dependencies: mismatches.length,
      health: health?.overall_score < 80,
    },
    context: learnings,
  };
}

// =============================================================================
// CLI ENTRY POINT
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    project: null,
    quiet: args.includes('--quiet') || args.includes('-q'),
    cwd: process.cwd(),
  };

  // Parse --project flag
  const projectIdx = args.indexOf('--project');
  if (projectIdx !== -1 && args[projectIdx + 1]) {
    options.project = args[projectIdx + 1];
  }

  awaken(options)
    .then(result => {
      // Exit with code based on alerts
      const hasAlerts = result.alerts.git || result.alerts.dependencies > 0 || result.alerts.health;
      process.exit(hasAlerts ? 1 : 0);
    })
    .catch(err => {
      log.error(`Awakening failed: ${err.message}`);
      process.exit(2);
    });
}

module.exports = { awaken, detectProject };
