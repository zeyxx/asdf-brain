#!/usr/bin/env node
/**
 * asdf-brain search
 *
 * φ-weighted cross-repo search following $asdfasdfa philosophy
 *
 * Usage: node search.js "query" [--layer=intelligence] [--limit=10]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// =============================================================================
// φ CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;

// =============================================================================
// CONFIGURATION
// =============================================================================

const KNOWLEDGE_PATHS = {
  holdex: '/workspaces/HolDex/training/raw/conversations.jsonl',
  gasdf: '/workspaces/GASdf/training/raw/conversations.jsonl',
};

// =============================================================================
// SEARCH FUNCTIONS
// =============================================================================

function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

async function loadKnowledge(repoName, filePath) {
  const entries = [];

  if (!fs.existsSync(filePath)) {
    return entries;
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      entries.push({
        repo: repoName,
        ...data
      });
    } catch (e) {
      // Skip malformed
    }
  }

  return entries;
}

function searchEntries(entries, queryTokens, options = {}) {
  const results = [];

  for (const entry of entries) {
    const userText = entry.user?.content || '';
    const assistText = entry.assistant?.content || '';
    const allText = (userText + ' ' + assistText).toLowerCase();

    // Count matches
    let matchCount = 0;
    const matchedTerms = new Set();

    for (const qt of queryTokens) {
      if (allText.includes(qt)) {
        matchCount++;
        matchedTerms.add(qt);
      }
    }

    if (matchCount === 0) continue;

    // Calculate relevance with φ weighting
    const matchRatio = matchedTerms.size / queryTokens.length;
    const qualityScore = entry.quality?.score || 0.5;
    const phiWeight = entry.quality?.phi_weight || 1.0;

    // Layer filter bonus
    let layerBonus = 1.0;
    if (options.layer) {
      // Could filter by repo/layer here
    }

    const relevance = matchRatio * qualityScore * phiWeight * layerBonus;

    if (relevance >= 0.1) {
      results.push({
        relevance,
        entry
      });
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance);
}

function formatResult(result, index) {
  const { entry, relevance } = result;
  const userPreview = (entry.user?.content || '').slice(0, 80).replace(/\n/g, ' ');
  const assistPreview = (entry.assistant?.content || '').slice(0, 120).replace(/\n/g, ' ');

  return `
┌─ #${index + 1} ─────────────────────────────────────────────────────────
│ Repo: ${entry.repo} | Relevance: ${(relevance * 100).toFixed(1)}% | Quality: ${((entry.quality?.score || 0) * 100).toFixed(0)}%
│ Type: ${entry.quality?.type || 'unknown'} | φ-weight: ${(entry.quality?.phi_weight || 1).toFixed(3)}
├──────────────────────────────────────────────────────────────
│ 👤 ${userPreview}${entry.user?.content?.length > 80 ? '...' : ''}
│ 🤖 ${assistPreview}${entry.assistant?.content?.length > 120 ? '...' : ''}
└──────────────────────────────────────────────────────────────`;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
asdf-brain search - φ-weighted cross-repo knowledge search

Usage: node search.js "query" [options]

Options:
  --layer=LAYER   Filter by ecosystem layer (intelligence, infrastructure, consumer)
  --limit=N       Maximum results (default: 10)
  --json          Output as JSON

Examples:
  node search.js "K-Score calculation"
  node search.js "webhook security" --layer=intelligence
  node search.js "gasless" --limit=5
`);
    process.exit(0);
  }

  const query = args.find(a => !a.startsWith('--')) || '';
  const limitArg = args.find(a => a.startsWith('--limit='));
  const layerArg = args.find(a => a.startsWith('--layer='));
  const jsonOutput = args.includes('--json');

  const options = {
    limit: limitArg ? parseInt(limitArg.split('=')[1]) : 10,
    layer: layerArg ? layerArg.split('=')[1] : null,
  };

  console.log(`\n🧠 asdf-brain search: "${query}"`);
  console.log('   Loading knowledge from ecosystem...\n');

  // Load from all repos
  let allEntries = [];
  for (const [name, filePath] of Object.entries(KNOWLEDGE_PATHS)) {
    const entries = await loadKnowledge(name, filePath);
    allEntries = allEntries.concat(entries);
    if (entries.length > 0) {
      console.log(`   ✓ ${name}: ${entries.length} entries`);
    }
  }

  if (allEntries.length === 0) {
    console.log('\n❌ No knowledge found. Run indexer first.');
    process.exit(1);
  }

  // Search
  const queryTokens = tokenize(query);
  const results = searchEntries(allEntries, queryTokens, options);
  const topResults = results.slice(0, options.limit);

  console.log(`\n✅ Found ${results.length} matches (showing top ${topResults.length})\n`);

  if (jsonOutput) {
    console.log(JSON.stringify(topResults.map(r => ({
      relevance: r.relevance,
      repo: r.entry.repo,
      quality: r.entry.quality,
      user: r.entry.user?.content?.slice(0, 200),
      assistant: r.entry.assistant?.content?.slice(0, 500),
    })), null, 2));
  } else {
    for (let i = 0; i < topResults.length; i++) {
      console.log(formatResult(topResults[i], i));
    }
  }

  // Stats
  const avgRelevance = topResults.reduce((s, r) => s + r.relevance, 0) / topResults.length;
  console.log(`\n📊 Average relevance: ${(avgRelevance * 100).toFixed(1)}%`);
  console.log(`   Ecosystem repos searched: ${Object.keys(KNOWLEDGE_PATHS).length}`);
}

main().catch(console.error);
