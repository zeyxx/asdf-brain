#!/usr/bin/env node
/**
 * asdf-brain evolution tracker
 *
 * Tracks temporal evolution of the ecosystem
 * Following $asdfasdfa: "Don't trust, verify" - verify from actual history
 *
 * Tracks:
 * - Activity over time (conversations, commits)
 * - Topic evolution (what we talk about changes)
 * - Feature development timeline
 * - Drift between dev/prod
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const readline = require('readline');

// =============================================================================
// CONFIGURATION
// =============================================================================

const REPOS = {
  holdex_dev: '/workspaces/HolDex',
  gasdf: '/workspaces/GASdf',
  manifesto: '/workspaces/asdf-manifesto',
};

const TOPIC_PATTERNS = {
  k_score: /k[_-]?score|kscore/gi,
  integrity: /integrity|signature|tamper/gi,
  burn: /burn|fee|100%/gi,
  webhook: /webhook|helius/gi,
  oracle: /oracle|gasdf|acceptance/gi,
  space: /space|marketplace|community/gi,
  security: /security|auth|api[_-]?key/gi,
  performance: /performance|cache|redis|slow/gi,
  database: /database|postgres|timescale|migration/gi,
  ui: /frontend|ui|card|image|png/gi,
};

// =============================================================================
// GIT HISTORY ANALYSIS
// =============================================================================

function getCommitHistory(repoPath) {
  if (!fs.existsSync(repoPath)) {
    return [];
  }

  const result = spawnSync(
    'git',
    ['log', '--format=%H|%aI|%an|%s', '--since=2024-01-01', '-n', '500'],
    { cwd: repoPath, encoding: 'utf-8' }
  );

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .trim()
    .split('\n')
    .filter((line) => line)
    .map((line) => {
      const [hash, date, author, message] = line.split('|');
      return { hash, date, author, message };
    });
}

function analyzeCommitPatterns(commits) {
  const byMonth = {};
  const byAuthor = {};
  const byTopic = {};

  for (const commit of commits) {
    // By month
    const month = commit.date.slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + 1;

    // By author
    byAuthor[commit.author] = (byAuthor[commit.author] || 0) + 1;

    // By topic
    for (const [topic, pattern] of Object.entries(TOPIC_PATTERNS)) {
      if (pattern.test(commit.message)) {
        if (!byTopic[topic]) {
          byTopic[topic] = { count: 0, samples: [] };
        }
        byTopic[topic].count++;
        if (byTopic[topic].samples.length < 3) {
          byTopic[topic].samples.push(commit.message.slice(0, 80));
        }
      }
    }
  }

  return { byMonth, byAuthor, byTopic };
}

// =============================================================================
// CONVERSATION TEMPORAL ANALYSIS
// =============================================================================

async function analyzeConversationTimeline(inputPath) {
  if (!fs.existsSync(inputPath)) {
    return null;
  }

  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const byDate = {};
  const topicsByMonth = {};
  let processed = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    processed++;

    try {
      const entry = JSON.parse(line);
      const timestamp = entry.timestamp;
      if (!timestamp) continue;

      const date = timestamp.slice(0, 10);
      const month = timestamp.slice(0, 7);

      // Count by date
      byDate[date] = (byDate[date] || 0) + 1;

      // Topics by month
      const fullText = (entry.user?.content || '') + ' ' + (entry.assistant?.content || '');

      if (!topicsByMonth[month]) {
        topicsByMonth[month] = {};
      }

      for (const [topic, pattern] of Object.entries(TOPIC_PATTERNS)) {
        const matches = fullText.match(pattern) || [];
        if (matches.length > 0) {
          topicsByMonth[month][topic] = (topicsByMonth[month][topic] || 0) + matches.length;
        }
      }
    } catch (e) {
      // Skip malformed
    }
  }

  return { byDate, topicsByMonth, total: processed };
}

// =============================================================================
// EVOLUTION ANALYSIS
// =============================================================================

function analyzeTopicEvolution(topicsByMonth) {
  const months = Object.keys(topicsByMonth).sort();
  const evolution = {};

  for (const topic of Object.keys(TOPIC_PATTERNS)) {
    evolution[topic] = {
      trend: [],
      total: 0,
      peak_month: null,
      peak_value: 0,
    };

    for (const month of months) {
      const value = topicsByMonth[month]?.[topic] || 0;
      evolution[topic].trend.push({ month, value });
      evolution[topic].total += value;

      if (value > evolution[topic].peak_value) {
        evolution[topic].peak_value = value;
        evolution[topic].peak_month = month;
      }
    }
  }

  return evolution;
}

function calculateMomentum(evolution) {
  // Compare recent 3 months to previous 3 months
  const momentum = {};

  for (const [topic, data] of Object.entries(evolution)) {
    const trend = data.trend;
    if (trend.length < 6) {
      momentum[topic] = 0;
      continue;
    }

    const recent = trend.slice(-3).reduce((sum, t) => sum + t.value, 0);
    const previous = trend.slice(-6, -3).reduce((sum, t) => sum + t.value, 0);

    if (previous === 0) {
      momentum[topic] = recent > 0 ? 1 : 0;
    } else {
      momentum[topic] = ((recent - previous) / previous).toFixed(2);
    }
  }

  return momentum;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain evolution tracker');
  console.log('  Tracking temporal evolution of the ecosystem');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    metadata: {
      generated: new Date().toISOString(),
      philosophy: "$asdfasdfa: Evolution through verification",
    },
    commits: {},
    conversations: null,
    evolution: {},
    momentum: {},
  };

  // Analyze each repo
  console.log('📊 Analyzing commit history...\n');
  for (const [name, repoPath] of Object.entries(REPOS)) {
    const commits = getCommitHistory(repoPath);
    if (commits.length > 0) {
      const analysis = analyzeCommitPatterns(commits);
      results.commits[name] = {
        total: commits.length,
        first_commit: commits[commits.length - 1]?.date,
        last_commit: commits[0]?.date,
        ...analysis,
      };
      console.log(`   ${name}: ${commits.length} commits`);
      console.log(`      First: ${commits[commits.length - 1]?.date.slice(0, 10)}`);
      console.log(`      Last: ${commits[0]?.date.slice(0, 10)}`);
    }
  }

  // Analyze conversations
  console.log('\n📊 Analyzing conversation timeline...');
  const conversationsPath = '/workspaces/HolDex/training/raw/conversations-safe.jsonl';
  const convAnalysis = await analyzeConversationTimeline(conversationsPath);

  if (convAnalysis) {
    results.conversations = {
      total: convAnalysis.total,
      by_date: convAnalysis.byDate,
      topics_by_month: convAnalysis.topicsByMonth,
    };
    console.log(`   Total conversations: ${convAnalysis.total}`);
    console.log(`   Date range: ${Object.keys(convAnalysis.byDate).sort()[0]} to ${Object.keys(convAnalysis.byDate).sort().pop()}`);
  }

  // Evolution analysis
  console.log('\n📊 Analyzing topic evolution...');
  if (convAnalysis?.topicsByMonth) {
    results.evolution = analyzeTopicEvolution(convAnalysis.topicsByMonth);
    results.momentum = calculateMomentum(results.evolution);

    console.log('\n   Topic Momentum (recent vs previous):');
    const sortedMomentum = Object.entries(results.momentum)
      .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));

    for (const [topic, value] of sortedMomentum.slice(0, 5)) {
      const arrow = parseFloat(value) > 0 ? '↑' : parseFloat(value) < 0 ? '↓' : '→';
      console.log(`      ${arrow} ${topic}: ${(parseFloat(value) * 100).toFixed(0)}%`);
    }
  }

  // Write output
  const outputPath = path.join(__dirname, '../knowledge/temporal/evolution.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n\n💾 Saved to: ${outputPath}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
