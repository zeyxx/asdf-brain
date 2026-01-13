/**
 * CYNIC-WITNESS - Real-Time Commit Observatory
 *
 * "The dog that watches while others sleep"
 *
 * World: ASSIAH (Material/Action)
 * Model: Haiku (fast, continuous)
 *
 * Purpose:
 * - Monitor git commits across all asdf-* repos in real-time
 * - Analyze each commit for patterns, quality, contributors
 * - Ingest commit data into CYNIC knowledge
 * - Track contributor E-Scores
 * - Detect anomalies and significant changes
 *
 * Philosophy:
 * - "Every commit is a teaching moment"
 * - The watcher that never sleeps
 * - Perception precedes reaction
 *
 * @module cynic/witness
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Lazy-load realtime to avoid circular dependency
let realtime = null;
function getRealtimeModule() {
  if (!realtime) {
    try {
      realtime = require('./realtime');
    } catch (e) {
      // Module not available, ignore
    }
  }
  return realtime;
}

// =============================================================================
// PHI CONSTANTS - Import from Single Source of Truth (FIXED 2026-01-13)
// =============================================================================

const { PHI, PHI_INV, PHI_INV_2 } = require('./axioms/constants');

// Poll interval: φ seconds ≈ 1.618s for responsiveness
const POLL_INTERVAL_MS = Math.round(PHI * 1000);

// =============================================================================
// PATHS
// =============================================================================

const KNOWLEDGE_ROOT = path.join(__dirname, '../../knowledge');
const WITNESS_DIR = path.join(KNOWLEDGE_ROOT, 'cynic/witness');
const COMMITS_PATH = path.join(WITNESS_DIR, 'commits.jsonl');
const CONTRIBUTORS_PATH = path.join(WITNESS_DIR, 'contributors.json');
const STATE_PATH = path.join(WITNESS_DIR, 'state.json');
const ALERTS_PATH = path.join(WITNESS_DIR, 'alerts.jsonl');

// Ensure directories exist
if (!fs.existsSync(WITNESS_DIR)) {
  fs.mkdirSync(WITNESS_DIR, { recursive: true });
}

// =============================================================================
// REPOSITORY CONFIGURATION
// =============================================================================

const REPOS = {
  holdex: {
    path: '/workspaces/HolDex',
    name: 'HolDex',
    owner: 'zeyxx',
    upstream: 'sollama58/HolDex',
    category: 'product',
    weight: PHI,
  },
  gasdf: {
    path: '/workspaces/GASdf',
    name: 'GASdf',
    owner: 'zeyxx',
    upstream: 'sollama58/GASdf',
    category: 'token',
    weight: PHI,
  },
  brain: {
    path: '/workspaces/asdf-brain',
    name: 'asdf-brain',
    owner: 'zeyxx',
    upstream: null,
    category: 'infrastructure',
    weight: PHI * PHI, // Brain commits weighted higher
  },
  manifesto: {
    path: '/workspaces/asdf-manifesto',
    name: 'asdf-manifesto',
    owner: 'zeyxx',
    upstream: null,
    category: 'philosophy',
    weight: PHI,
  },
  claudeMem: {
    path: '/workspaces/claude-mem',
    name: 'claude-mem',
    owner: 'zeyxx',
    upstream: null,
    category: 'memory',
    weight: PHI,
  },
};

// =============================================================================
// COMMIT PATTERNS (for classification)
// =============================================================================

const COMMIT_PATTERNS = {
  // Conventional commits
  feat: { category: 'feature', impact: 'high', emoji: '✨' },
  fix: { category: 'bugfix', impact: 'medium', emoji: '🐛' },
  docs: { category: 'documentation', impact: 'low', emoji: '📝' },
  style: { category: 'style', impact: 'low', emoji: '💄' },
  refactor: { category: 'refactor', impact: 'medium', emoji: '♻️' },
  perf: { category: 'performance', impact: 'high', emoji: '⚡' },
  test: { category: 'testing', impact: 'medium', emoji: '✅' },
  build: { category: 'build', impact: 'low', emoji: '🔧' },
  ci: { category: 'ci', impact: 'low', emoji: '👷' },
  chore: { category: 'maintenance', impact: 'low', emoji: '🔨' },
  revert: { category: 'revert', impact: 'high', emoji: '⏪' },

  // CYNIC-specific
  cynic: { category: 'cynic', impact: 'high', emoji: '🐕' },
  phi: { category: 'philosophy', impact: 'medium', emoji: 'φ' },
  burn: { category: 'economics', impact: 'high', emoji: '🔥' },
};

// =============================================================================
// SAFE EXEC HELPERS
// =============================================================================

function execGit(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    }).trim();
  } catch (e) {
    return null;
  }
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Load witness state
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-WITNESS] Error loading state:', err.message);
  }

  return {
    lastCheck: null,
    lastCommits: {}, // repo -> last seen commit hash
    totalCommitsSeen: 0,
    totalContributors: 0,
    startedAt: new Date().toISOString(),
    isRunning: false,
  };
}

/**
 * Save witness state
 */
function saveState(state) {
  state.lastCheck = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  return state;
}

/**
 * Load contributors
 */
function loadContributors() {
  try {
    if (fs.existsSync(CONTRIBUTORS_PATH)) {
      return JSON.parse(fs.readFileSync(CONTRIBUTORS_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-WITNESS] Error loading contributors:', err.message);
  }

  return {
    byEmail: {},
    byName: {},
    _meta: {
      totalContributors: 0,
      lastUpdated: null,
    },
  };
}

/**
 * Save contributors
 */
function saveContributors(contributors) {
  contributors._meta.lastUpdated = new Date().toISOString();
  contributors._meta.totalContributors = Object.keys(contributors.byEmail).length;
  fs.writeFileSync(CONTRIBUTORS_PATH, JSON.stringify(contributors, null, 2));
  return contributors;
}

// =============================================================================
// COMMIT ANALYSIS
// =============================================================================

/**
 * Get recent commits from a repository
 */
function getRecentCommits(repoKey, since = null, limit = 10) {
  const repo = REPOS[repoKey];
  if (!repo || !fs.existsSync(repo.path)) {
    return [];
  }

  const args = ['log', `--max-count=${limit}`, '--format=%H|%an|%ae|%at|%s'];
  if (since) {
    args.push(`--since=${since}`);
  }

  const output = execGit(args, repo.path);
  if (!output) return [];

  return output.split('\n').filter(Boolean).map(line => {
    const [hash, authorName, authorEmail, timestamp, ...subjectParts] = line.split('|');
    const subject = subjectParts.join('|'); // Handle | in commit message

    return {
      hash,
      shortHash: hash.substring(0, 7),
      author: {
        name: authorName,
        email: authorEmail,
        id: hashEmail(authorEmail),
      },
      timestamp: parseInt(timestamp) * 1000,
      iso: new Date(parseInt(timestamp) * 1000).toISOString(),
      subject,
      repo: repoKey,
      repoName: repo.name,
      category: repo.category,
    };
  });
}

/**
 * Get commit details including files changed
 */
function getCommitDetails(repoKey, hash) {
  const repo = REPOS[repoKey];
  if (!repo || !fs.existsSync(repo.path)) {
    return null;
  }

  // Get stats
  const stats = execGit(['show', hash, '--stat', '--format='], repo.path);
  const diffStat = execGit(['show', hash, '--format=', '--shortstat'], repo.path);

  // Parse stats
  let filesChanged = 0, insertions = 0, deletions = 0;
  if (diffStat) {
    const match = diffStat.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
    if (match) {
      filesChanged = parseInt(match[1]) || 0;
      insertions = parseInt(match[2]) || 0;
      deletions = parseInt(match[3]) || 0;
    }
  }

  // Get files list
  const filesOutput = execGit(['show', hash, '--name-only', '--format='], repo.path);
  const files = filesOutput ? filesOutput.split('\n').filter(Boolean) : [];

  return {
    filesChanged,
    insertions,
    deletions,
    files,
    netLines: insertions - deletions,
    churn: insertions + deletions,
  };
}

/**
 * Hash email for privacy (contributor ID)
 */
function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 12);
}

/**
 * Classify commit based on message
 */
function classifyCommit(subject) {
  const lowerSubject = subject.toLowerCase();

  // Check for conventional commit prefix
  for (const [prefix, pattern] of Object.entries(COMMIT_PATTERNS)) {
    if (lowerSubject.startsWith(prefix + ':') || lowerSubject.startsWith(prefix + '(')) {
      return {
        type: prefix,
        ...pattern,
      };
    }
  }

  // Fallback classification based on keywords
  if (lowerSubject.includes('fix') || lowerSubject.includes('bug')) {
    return { type: 'fix', ...COMMIT_PATTERNS.fix };
  }
  if (lowerSubject.includes('add') || lowerSubject.includes('new') || lowerSubject.includes('feature')) {
    return { type: 'feat', ...COMMIT_PATTERNS.feat };
  }
  if (lowerSubject.includes('update') || lowerSubject.includes('change')) {
    return { type: 'chore', ...COMMIT_PATTERNS.chore };
  }
  if (lowerSubject.includes('refactor') || lowerSubject.includes('clean')) {
    return { type: 'refactor', ...COMMIT_PATTERNS.refactor };
  }
  if (lowerSubject.includes('doc') || lowerSubject.includes('readme')) {
    return { type: 'docs', ...COMMIT_PATTERNS.docs };
  }
  if (lowerSubject.includes('test')) {
    return { type: 'test', ...COMMIT_PATTERNS.test };
  }

  // Default
  return { type: 'unknown', category: 'other', impact: 'low', emoji: '📦' };
}

/**
 * Analyze a commit fully
 */
function analyzeCommit(commit) {
  const classification = classifyCommit(commit.subject);
  const details = getCommitDetails(commit.repo, commit.hash);
  const repo = REPOS[commit.repo];

  // Calculate impact score
  let impactScore = 0;
  if (details) {
    // Base score from churn
    impactScore = Math.log1p(details.churn) * 10;

    // Adjust for impact type
    if (classification.impact === 'high') impactScore *= PHI;
    else if (classification.impact === 'low') impactScore *= PHI_INV;

    // Adjust for repo weight
    impactScore *= (repo?.weight || 1);

    // Cap at 100
    impactScore = Math.min(100, impactScore);
  }

  // Check for co-authors (Claude, etc.)
  const coAuthors = [];
  if (commit.subject.includes('Co-Authored-By:') || commit.subject.includes('Claude')) {
    coAuthors.push({ name: 'Claude', type: 'AI' });
  }

  // Check for breaking changes
  const isBreaking = commit.subject.includes('!:') ||
                     commit.subject.toLowerCase().includes('breaking');

  return {
    ...commit,
    classification,
    details,
    impactScore: Math.round(impactScore * 10) / 10,
    coAuthors,
    isBreaking,
    isAIAssisted: coAuthors.length > 0,
    analyzedAt: new Date().toISOString(),
  };
}

// =============================================================================
// CONTRIBUTOR TRACKING
// =============================================================================

/**
 * Update contributor stats
 */
function updateContributor(contributors, commit) {
  const { author, impactScore, classification, repo } = commit;
  const email = author.email;
  const id = author.id;

  if (!contributors.byEmail[email]) {
    contributors.byEmail[email] = {
      id,
      name: author.name,
      email: email,
      firstSeen: commit.iso,
      lastSeen: commit.iso,
      totalCommits: 0,
      totalImpact: 0,
      repos: {},
      categories: {},
      eScore: 50, // Start at neutral
    };
  }

  const c = contributors.byEmail[email];
  c.lastSeen = commit.iso;
  c.totalCommits++;
  c.totalImpact += impactScore;

  // Track per-repo
  if (!c.repos[repo]) c.repos[repo] = 0;
  c.repos[repo]++;

  // Track per-category
  if (!c.categories[classification.category]) c.categories[classification.category] = 0;
  c.categories[classification.category]++;

  // Update E-Score (contribution score)
  // E-Score increases with impact, frequency, and variety
  const avgImpact = c.totalImpact / c.totalCommits;
  const repoVariety = Object.keys(c.repos).length;
  const categoryVariety = Object.keys(c.categories).length;

  c.eScore = Math.min(100, Math.round(
    50 + // Base
    avgImpact * 0.5 + // Impact contribution
    Math.log1p(c.totalCommits) * 5 + // Frequency contribution
    repoVariety * 3 + // Repo variety bonus
    categoryVariety * 2 // Category variety bonus
  ));

  // Also track by name for quick lookup
  contributors.byName[author.name] = email;

  return contributors;
}

// =============================================================================
// COMMIT INGESTION
// =============================================================================

/**
 * Ingest a new commit into knowledge
 */
function ingestCommit(commit) {
  const entry = {
    ...commit,
    ingestedAt: Date.now(),
    ingestedIso: new Date().toISOString(),
    witness: 'CYNIC-WITNESS',
  };

  fs.appendFileSync(COMMITS_PATH, JSON.stringify(entry) + '\n');

  // Emit realtime event
  const rt = getRealtimeModule();
  if (rt) {
    rt.emitCommit(entry, false);
  }

  return entry;
}

/**
 * Create alert for significant commits
 */
function createAlert(commit, reason) {
  const alert = {
    timestamp: Date.now(),
    iso: new Date().toISOString(),
    type: 'COMMIT_ALERT',
    severity: commit.isBreaking ? 'high' : 'medium',
    reason,
    commit: {
      hash: commit.shortHash,
      repo: commit.repoName,
      author: commit.author.name,
      subject: commit.subject,
      impactScore: commit.impactScore,
    },
    witness: 'CYNIC-WITNESS',
  };

  fs.appendFileSync(ALERTS_PATH, JSON.stringify(alert) + '\n');

  // Emit realtime alert event
  const rt = getRealtimeModule();
  if (rt) {
    rt.emitCommit(alert, true); // isAlert = true
  }

  return alert;
}

// =============================================================================
// POLLING / WATCHING
// =============================================================================

let watchInterval = null;
let state = null;
let contributors = null;

/**
 * Check all repos for new commits
 */
function checkForNewCommits() {
  if (!state) state = loadState();
  if (!contributors) contributors = loadContributors();

  const newCommits = [];

  for (const [repoKey, repo] of Object.entries(REPOS)) {
    if (!fs.existsSync(repo.path)) continue;

    const lastSeen = state.lastCommits[repoKey];
    const recent = getRecentCommits(repoKey, null, 5);

    for (const commit of recent) {
      // Skip if already seen
      if (lastSeen && commit.hash === lastSeen) break;

      // Analyze and ingest
      const analyzed = analyzeCommit(commit);
      newCommits.push(analyzed);
      ingestCommit(analyzed);

      // Update contributor
      contributors = updateContributor(contributors, analyzed);

      // Create alerts for significant commits
      if (analyzed.isBreaking) {
        createAlert(analyzed, 'Breaking change detected');
      } else if (analyzed.impactScore > 50) {
        createAlert(analyzed, 'High impact commit');
      } else if (analyzed.classification.type === 'feat') {
        createAlert(analyzed, 'New feature added');
      }

      console.log(`[CYNIC-WITNESS] ${analyzed.classification.emoji} ${analyzed.repoName}: ${analyzed.shortHash} - ${analyzed.subject.substring(0, 50)}`);
    }

    // Update last seen
    if (recent.length > 0) {
      state.lastCommits[repoKey] = recent[0].hash;
    }
  }

  // Update state
  state.totalCommitsSeen += newCommits.length;
  state.totalContributors = Object.keys(contributors.byEmail).length;
  saveState(state);
  saveContributors(contributors);

  return newCommits;
}

/**
 * Start watching for commits
 */
function startWatching(intervalMs = POLL_INTERVAL_MS) {
  if (watchInterval) {
    console.log('[CYNIC-WITNESS] Already watching');
    return;
  }

  state = loadState();
  contributors = loadContributors();
  state.isRunning = true;
  state.startedAt = new Date().toISOString();
  saveState(state);

  console.log(`[CYNIC-WITNESS] Started watching ${Object.keys(REPOS).length} repos (poll: ${intervalMs}ms)`);

  // Initial check
  checkForNewCommits();

  // Start polling
  watchInterval = setInterval(checkForNewCommits, intervalMs);

  return {
    repos: Object.keys(REPOS),
    interval: intervalMs,
    state,
  };
}

/**
 * Stop watching
 */
function stopWatching() {
  if (watchInterval) {
    clearInterval(watchInterval);
    watchInterval = null;

    if (state) {
      state.isRunning = false;
      saveState(state);
    }

    console.log('[CYNIC-WITNESS] Stopped watching');
  }
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get recent commits from knowledge
 */
function getRecentIngestedCommits(limit = 20) {
  if (!fs.existsSync(COMMITS_PATH)) return [];

  const lines = fs.readFileSync(COMMITS_PATH, 'utf8')
    .split('\n')
    .filter(Boolean);

  return lines.slice(-limit).map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean).reverse();
}

/**
 * Get contributor stats
 */
function getContributorStats(emailOrName) {
  const contribs = loadContributors();

  // Try email first
  if (contribs.byEmail[emailOrName]) {
    return contribs.byEmail[emailOrName];
  }

  // Try name
  const email = contribs.byName[emailOrName];
  if (email && contribs.byEmail[email]) {
    return contribs.byEmail[email];
  }

  return null;
}

/**
 * Get top contributors by E-Score
 */
function getTopContributors(limit = 10) {
  const contribs = loadContributors();

  return Object.values(contribs.byEmail)
    .sort((a, b) => b.eScore - a.eScore)
    .slice(0, limit);
}

/**
 * Get commit activity summary
 */
function getActivitySummary() {
  const state = loadState();
  const contribs = loadContributors();
  const recent = getRecentIngestedCommits(50);

  // Calculate activity metrics
  const now = Date.now();
  const last24h = recent.filter(c => now - c.timestamp < 24 * 60 * 60 * 1000);
  const last7d = recent.filter(c => now - c.timestamp < 7 * 24 * 60 * 60 * 1000);

  // Category breakdown
  const byCategory = {};
  for (const commit of recent) {
    const cat = commit.classification?.category || 'unknown';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  // Repo breakdown
  const byRepo = {};
  for (const commit of recent) {
    byRepo[commit.repo] = (byRepo[commit.repo] || 0) + 1;
  }

  return {
    timestamp: new Date().toISOString(),
    state: {
      isRunning: state.isRunning,
      startedAt: state.startedAt,
      lastCheck: state.lastCheck,
      totalCommitsSeen: state.totalCommitsSeen,
    },
    contributors: {
      total: Object.keys(contribs.byEmail).length,
      top: getTopContributors(5).map(c => ({
        name: c.name,
        eScore: c.eScore,
        commits: c.totalCommits,
      })),
    },
    activity: {
      last24h: last24h.length,
      last7d: last7d.length,
      avgImpact: recent.length > 0
        ? Math.round(recent.reduce((s, c) => s + (c.impactScore || 0), 0) / recent.length * 10) / 10
        : 0,
    },
    breakdown: {
      byCategory,
      byRepo,
    },
    witness: 'CYNIC-WITNESS',
    world: 'ASSIAH',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core watching
  startWatching,
  stopWatching,
  checkForNewCommits,

  // Analysis
  analyzeCommit,
  classifyCommit,
  getCommitDetails,

  // Queries
  getRecentCommits,
  getRecentIngestedCommits,
  getContributorStats,
  getTopContributors,
  getActivitySummary,

  // State
  loadState,
  loadContributors,

  // Constants
  REPOS,
  COMMIT_PATTERNS,
  POLL_INTERVAL_MS,
  PHI,
  PHI_INV,

  // Metadata
  WITNESS_SUBAGENT: {
    name: 'CYNIC-WITNESS',
    world: 'ASSIAH',
    model: 'haiku',
    purpose: 'Real-time commit observatory',
    philosophy: 'Every commit is a teaching moment',
  },
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║            CYNIC-WITNESS - Commit Observatory              ║');
  console.log('║              "The watcher that never sleeps"               ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Repos: ${Object.keys(REPOS).join(', ').padEnd(48)}║`);
  console.log(`║  Poll Interval: ${POLL_INTERVAL_MS}ms (φ seconds)`.padEnd(60) + '║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  startWatching();

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n[CYNIC-WITNESS] Shutting down...');
    stopWatching();
    process.exit(0);
  });
}
