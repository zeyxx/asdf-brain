/**
 * CYNIC SessionStart Hook - The Awakening
 *
 * "Le chien qui se réveille" - CYNIC becomes present at session start
 *
 * This hook runs when a new Claude Code session begins.
 * It injects CYNIC's presence, loads relevant context, and sets the tone.
 *
 * @event SessionStart
 * @behavior non-blocking
 * @module cynic/hooks/session-start
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// =============================================================================
// CONFIGURATION
// =============================================================================

const BRAIN_ROOT = process.env.BRAIN_ROOT || path.join(__dirname, '../../');
const KNOWLEDGE_DIR = path.join(BRAIN_ROOT, 'knowledge');

// φ constants - import from canonical source
const { PHI, PHI_INV } = require('../../packages/core/src/axioms/constants');

// =============================================================================
// CONTEXT DETECTION
// =============================================================================

/**
 * Detect which project the user is working in
 */
function detectProject(cwd) {
  const cwdLower = cwd.toLowerCase();
  
  if (cwdLower.includes('holdex')) return 'HOLDEX';
  if (cwdLower.includes('gasdf')) return 'GASDF';
  if (cwdLower.includes('brain') || cwdLower.includes('asdf-brain')) return 'BRAIN';
  if (cwdLower.includes('claude-mem')) return 'CLAUDE-MEM';
  if (cwdLower.includes('framework-kit')) return 'FRAMEWORK-KIT';
  
  // Check if we're in a multi-repo workspace
  if (cwd.includes('/workspaces')) return 'ECOSYSTEM';
  
  return 'UNKNOWN';
}

/**
 * Get git status for current directory
 */
function getGitStatus(cwd) {
  try {
    const status = execSync('git status --porcelain 2>/dev/null | wc -l', { 
      cwd, 
      encoding: 'utf-8',
      timeout: 5000 
    }).trim();
    
    const branch = execSync('git branch --show-current 2>/dev/null', { 
      cwd, 
      encoding: 'utf-8',
      timeout: 5000 
    }).trim();
    
    const behind = execSync('git rev-list HEAD..@{u} --count 2>/dev/null || echo 0', { 
      cwd, 
      encoding: 'utf-8',
      timeout: 5000 
    }).trim();
    
    return {
      modified: parseInt(status) || 0,
      branch: branch || 'unknown',
      behind: parseInt(behind) || 0
    };
  } catch (e) {
    return { modified: 0, branch: 'unknown', behind: 0 };
  }
}

/**
 * Scan ecosystem git status
 */
function scanEcosystemGit() {
  const repos = ['HolDex', 'GASdf', 'asdf-brain', 'claude-mem', 'framework-kit'];
  const results = [];
  
  for (const repo of repos) {
    const repoPath = path.join('/workspaces', repo);
    if (fs.existsSync(repoPath)) {
      const status = getGitStatus(repoPath);
      if (status.modified > 0 || status.behind > 0) {
        results.push({
          repo,
          ...status
        });
      }
    }
  }
  
  return results;
}

/**
 * Load recent context from brain
 */
function loadRecentContext() {
  const context = [];
  
  // Try to load recent decisions
  const decisionsPath = path.join(KNOWLEDGE_DIR, 'cynic/decisions');
  if (fs.existsSync(decisionsPath)) {
    try {
      const files = fs.readdirSync(decisionsPath)
        .filter(f => f.endsWith('.json'))
        .slice(-3);
      
      for (const file of files) {
        const content = JSON.parse(fs.readFileSync(path.join(decisionsPath, file), 'utf-8'));
        context.push({
          type: 'decision',
          summary: content.summary || content.title || file,
          timestamp: content.timestamp
        });
      }
    } catch (e) { /* ignore */ }
  }
  
  // Try to load recent patterns
  const patternsPath = path.join(KNOWLEDGE_DIR, 'brain/patterns.json');
  if (fs.existsSync(patternsPath)) {
    try {
      const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
      const recent = Object.entries(patterns)
        .filter(([_, p]) => p.count >= 3)
        .slice(0, 3)
        .map(([name, p]) => ({ type: 'pattern', name, count: p.count }));
      context.push(...recent);
    } catch (e) { /* ignore */ }
  }
  
  return context;
}

/**
 * Get operator info from environment or config
 */
function getOperator() {
  // Try git config first
  try {
    const name = execSync('git config user.name 2>/dev/null', { encoding: 'utf-8' }).trim();
    return name || process.env.USER || 'operator';
  } catch (e) {
    return process.env.USER || 'operator';
  }
}

/**
 * Calculate ecosystem health (simplified)
 */
function calculateHealth() {
  // Check if brain MCP is available
  let score = 50;
  
  // Bonus for knowledge files existing
  if (fs.existsSync(KNOWLEDGE_DIR)) score += 20;
  
  // Bonus for recent activity
  const obsPath = path.join(KNOWLEDGE_DIR, 'cynic/observations/actions.jsonl');
  if (fs.existsSync(obsPath)) {
    const stats = fs.statSync(obsPath);
    const hoursSinceUpdate = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    if (hoursSinceUpdate < 24) score += 16;
  }
  
  // Cap at PHI_INV * 100 = 61.8... round to nearest healthy threshold
  return Math.min(score, 86);
}

// =============================================================================
// FLAME TRACKING - 🔥 Visual Progress
// =============================================================================

/**
 * Calculate flame level based on BURN activities
 * Returns: { level: 1-5, emoji: '🔥'..., message: string }
 */
function calculateFlameLevel() {
  const burnStatsPath = path.join(KNOWLEDGE_DIR, 'burns/stats.json');
  const observationsPath = path.join(KNOWLEDGE_DIR, 'cynic/observations/actions.jsonl');
  
  let burnScore = 0;
  let codeBurns = 0;
  let egoBurns = 0;
  let timeSaved = 0;
  
  // Load burn stats if available
  if (fs.existsSync(burnStatsPath)) {
    try {
      const stats = JSON.parse(fs.readFileSync(burnStatsPath, 'utf-8'));
      burnScore = stats.totalBurns || 0;
      codeBurns = stats.codeBurns || 0;
      egoBurns = stats.egoBurns || 0;
      timeSaved = stats.timeSaved || 0;
    } catch (e) { /* ignore */ }
  }
  
  // Count recent observations for activity level
  let recentActivity = 0;
  if (fs.existsSync(observationsPath)) {
    try {
      const stats = fs.statSync(observationsPath);
      const hoursSinceUpdate = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
      if (hoursSinceUpdate < 1) recentActivity = 3;
      else if (hoursSinceUpdate < 4) recentActivity = 2;
      else if (hoursSinceUpdate < 24) recentActivity = 1;
    } catch (e) { /* ignore */ }
  }
  
  // Calculate flame level (1-5)
  const totalScore = burnScore + recentActivity * 10;
  let level;
  if (totalScore >= 100) level = 5;
  else if (totalScore >= 50) level = 4;
  else if (totalScore >= 20) level = 3;
  else if (totalScore >= 5) level = 2;
  else level = 1;
  
  // Generate flame emoji based on level
  const flames = ['🕯️', '🔥', '🔥🔥', '🔥🔥🔥', '🔥🔥🔥🔥🔥'];
  const emoji = flames[level - 1];
  
  // Generate message
  const messages = {
    1: 'Flame is dormant. Start burning!',
    2: 'Flame is warming up.',
    3: 'Flame is steady. Keep burning!',
    4: 'Flame is strong! You are on fire!',
    5: 'MAXIMUM BURN! Approaching singularity!'
  };
  
  return {
    level,
    emoji,
    message: messages[level],
    stats: {
      code: codeBurns,
      ego: egoBurns,
      time: timeSaved,
      total: burnScore
    }
  };
}

// =============================================================================
// AWAKENING MESSAGE GENERATOR
// =============================================================================

/**
 * Generate the CYNIC awakening message
 */
function generateAwakeningMessage(context) {
  const { project, operator, gitStatus, recentContext, health, flame } = context;
  
  const lines = [];
  
  // Header
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('🧠 ASDF-BRAIN AWAKENING - "Don\'t trust, verify"');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  
  // Project context
  lines.push(`📋 Project detected: ${project}`);
  lines.push(`📋 Working directory: ${process.cwd()}`);
  lines.push(`📋 Operator: ${operator}`);
  
  // Git intelligence
  if (gitStatus.length > 0) {
    lines.push('');
    lines.push('── GIT INTELLIGENCE ───────────────────────────────────────');
    for (const repo of gitStatus) {
      const status = [];
      if (repo.modified > 0) status.push(`${repo.modified} modified`);
      if (repo.behind > 0) status.push(`${repo.behind} behind`);
      lines.push(`⚠️  ${repo.repo} [${repo.branch}]: ${status.join(', ')}`);
    }
  }
  
  // Flame status
  lines.push('');
  lines.push('── BURN STATUS ────────────────────────────────────────────');
  if (flame) {
    lines.push(`${flame.emoji} ${flame.message}`);
    if (flame.stats.total > 0) {
      const parts = [];
      if (flame.stats.code > 0) parts.push(`Code: ${flame.stats.code}`);
      if (flame.stats.ego > 0) parts.push(`Ego: ${flame.stats.ego}`);
      if (flame.stats.time > 0) parts.push(`Time: ${flame.stats.time}h`);
      if (parts.length > 0) {
        lines.push(`   Burns: ${parts.join(' | ')}`);
      }
    }
  } else {
    lines.push('🕯️ No burn data yet. Start simplifying!');
  }
  
  // Ecosystem health
  lines.push('');
  lines.push('── ECOSYSTEM HEALTH ───────────────────────────────────────');
  const healthStatus = health >= 62 ? 'healthy' : health >= 38 ? 'warning' : 'critical';
  lines.push(`✅ Health: ${health}/100 (${healthStatus})`);
  
  // Recent context
  if (recentContext.length > 0) {
    lines.push('');
    lines.push('── RECENT CONTEXT ─────────────────────────────────────────');
    for (const ctx of recentContext.slice(0, 3)) {
      if (ctx.type === 'decision') {
        lines.push(`   📌 [decision] ${ctx.summary}`);
      } else if (ctx.type === 'pattern') {
        lines.push(`   🔄 [pattern] ${ctx.name} (×${ctx.count})`);
      }
    }
  }
  
  // CYNIC context
  lines.push('');
  lines.push('── CYNIC CONTEXT ──────────────────────────────────────────');
  lines.push('   🐕 Personality: Skeptical, direct, loyal to truth');
  lines.push('   📐 Max confidence: φ⁻¹ = 61.8% (always doubt)');
  lines.push('   ');
  lines.push('   4 AXIOMS:');
  lines.push('   ├─ φ (PHI)    → All ratios derive from 1.618...');
  lines.push('   ├─ BURN      → Don\'t extract, burn');
  lines.push('   ├─ VERIFY    → Don\'t trust, verify');
  lines.push('   └─ CULTURE   → Culture is a moat');
  
  // Codespaces reminder
  if (process.env.CODESPACES === 'true' || process.env.GITHUB_CODESPACE_TOKEN) {
    lines.push('');
    lines.push('── CODESPACES REMINDER ────────────────────────────────────');
    lines.push('⚠️  GITHUB_TOKEN is scoped to origin repo only!');
    lines.push('   To push to other repos: unset GITHUB_TOKEN first');
    lines.push('   Then: git push https://$(gh auth token)@github.com/OWNER/REPO.git');
  }
  
  // Footer
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('🧠 Brain is AWAKE and monitoring. φ guides all ratios.');
  lines.push('═══════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

/**
 * SessionStart hook handler
 */
async function handler(hookContext) {
  const cwd = hookContext?.cwd || process.cwd();
  
  // Gather context
  const project = detectProject(cwd);
  const operator = getOperator();
  const gitStatus = scanEcosystemGit();
  const recentContext = loadRecentContext();
  const health = calculateHealth();
  const flame = calculateFlameLevel();
  
  const context = {
    project,
    operator,
    gitStatus,
    recentContext,
    health,
    flame
  };
  
  // Generate awakening message
  const message = generateAwakeningMessage(context);
  
  return {
    continue: true,
    message,
    context: {
      project,
      operator,
      health,
      cynic: {
        active: true,
        personality: 'skeptical-dog',
        maxConfidence: PHI_INV,
        minDoubt: 1 - PHI_INV
      }
    }
  };
}

module.exports = { handler };
