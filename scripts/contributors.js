#!/usr/bin/env node
/**
 * asdf-brain contributor analyzer
 *
 * Analyzes all contributors to the $asdfasdfa ecosystem on GitHub
 * Maps relationships, contributions, and trust levels
 *
 * Following $asdfasdfa: Don't trust, verify.
 */

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// =============================================================================
// φ CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;

// =============================================================================
// ECOSYSTEM ORGANIZATIONS & REPOS
// =============================================================================

const ECOSYSTEM = {
  // Primary developers
  orgs: ['zeyxx', 'sollama58'],

  // Known repos in ecosystem
  repos: [
    'zeyxx/HolDex',
    'zeyxx/GASdf',
    'zeyxx/asdf-manifesto',
    'zeyxx/asdf-oracle',
    'zeyxx/asdf-validator',
    'zeyxx/asdf-burn-engine',
    'zeyxx/ASDev',
    'zeyxx/ASDForecast',
    'sollama58/HolDex',
    'sollama58/ASDev',
    'sollama58/ASDForecast',
    'sollama58/ASDFBurnTracker',
  ],

  // Trust levels (φ-weighted)
  trustLevels: {
    core: PHI * PHI,      // 2.618 - Core team
    contributor: PHI,     // 1.618 - Regular contributors
    occasional: 1.0,      // 1.0   - Occasional
    new: PHI_INV,         // 0.618 - New contributors
  }
};

// =============================================================================
// GITHUB API HELPERS (using gh CLI)
// =============================================================================

function ghApi(endpoint) {
  const result = spawnSync('gh', ['api', endpoint], { encoding: 'utf-8' });
  if (result.error || result.status !== 0) {
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch (e) {
    return null;
  }
}

function getRepoContributors(repo) {
  return ghApi(`repos/${repo}/contributors?per_page=100`) || [];
}

function getUserInfo(username) {
  return ghApi(`users/${username}`);
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

function calculateTrustScore(contributor, totalContributions) {
  const contributionRatio = contributor.contributions / totalContributions;

  // Base score from contribution ratio
  let score = contributionRatio * 100;

  // φ-weight by number of repos contributed to
  const repoCount = contributor.repos?.length || 1;
  score *= Math.pow(PHI, Math.log2(repoCount + 1) - 1);

  // Cap at 100
  return Math.min(100, Math.round(score * 10) / 10);
}

function classifyTrustLevel(score) {
  if (score >= 50) return 'core';
  if (score >= 20) return 'contributor';
  if (score >= 5) return 'occasional';
  return 'new';
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain contributor analyzer');
  console.log('  Mapping the $asdfasdfa ecosystem');
  console.log('═══════════════════════════════════════════════════════════\n');

  const contributors = new Map();
  let totalContributions = 0;

  // Analyze each repo
  for (const repo of ECOSYSTEM.repos) {
    console.log(`📦 Analyzing: ${repo}`);

    const repoContributors = getRepoContributors(repo);
    if (!repoContributors || repoContributors.length === 0) {
      console.log('   ⚠️  No contributors found or API error\n');
      continue;
    }

    console.log(`   Found ${repoContributors.length} contributors\n`);

    for (const c of repoContributors) {
      const username = c.login;
      totalContributions += c.contributions;

      if (!contributors.has(username)) {
        contributors.set(username, {
          username,
          contributions: 0,
          repos: [],
          avatar: c.avatar_url,
          type: c.type, // User or Bot
        });
      }

      const entry = contributors.get(username);
      entry.contributions += c.contributions;
      entry.repos.push({
        repo,
        contributions: c.contributions,
      });
    }
  }

  // Calculate trust scores
  const results = [];
  for (const [username, data] of contributors) {
    const trustScore = calculateTrustScore(data, totalContributions);
    const trustLevel = classifyTrustLevel(trustScore);

    results.push({
      ...data,
      trustScore,
      trustLevel,
      phiWeight: ECOSYSTEM.trustLevels[trustLevel],
    });
  }

  // Sort by trust score
  results.sort((a, b) => b.trustScore - a.trustScore);

  // Output
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    ECOSYSTEM MAP');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Total contributors: ${results.length}`);
  console.log(`   Total contributions: ${totalContributions}\n`);

  console.log('🏆 Top Contributors:\n');
  for (let i = 0; i < Math.min(10, results.length); i++) {
    const c = results[i];
    const level = c.trustLevel.padEnd(12);
    const repos = c.repos.length;
    console.log(`   ${(i + 1).toString().padStart(2)}. ${c.username.padEnd(20)} | ${level} | φ=${c.phiWeight.toFixed(3)} | ${c.contributions} commits | ${repos} repos`);
  }

  // Group by trust level
  const byLevel = {
    core: results.filter(c => c.trustLevel === 'core'),
    contributor: results.filter(c => c.trustLevel === 'contributor'),
    occasional: results.filter(c => c.trustLevel === 'occasional'),
    new: results.filter(c => c.trustLevel === 'new'),
  };

  console.log('\n📊 By Trust Level:\n');
  for (const [level, members] of Object.entries(byLevel)) {
    console.log(`   ${level}: ${members.length} (φ=${ECOSYSTEM.trustLevels[level].toFixed(3)})`);
  }

  // Save results
  const outputPath = path.join(__dirname, '../index/contributors.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalContributors: results.length,
    totalContributions,
    contributors: results,
    byLevel: {
      core: byLevel.core.map(c => c.username),
      contributor: byLevel.contributor.map(c => c.username),
      occasional: byLevel.occasional.map(c => c.username),
      new: byLevel.new.map(c => c.username),
    }
  }, null, 2));

  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
