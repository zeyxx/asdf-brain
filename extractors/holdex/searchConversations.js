#!/usr/bin/env node
/**
 * searchConversations.js
 *
 * φ-weighted keyword search over conversation pairs
 * Simple RAG without embeddings - uses quality scores + keyword matching
 *
 * Usage: node searchConversations.js "query" [--type=bugfix] [--limit=10]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// =============================================================================
// φ CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;  // 0.618

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  dataFile: path.join(__dirname, '../raw/conversations.jsonl'),
  defaultLimit: 10,
  minRelevance: 0.1,  // Minimum relevance score to include
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

function calculateRelevance(conversation, queryTokens, options = {}) {
  const userTokens = tokenize(conversation.user?.content || '');
  const assistantTokens = tokenize(conversation.assistant?.content || '');
  const allTokens = [...userTokens, ...assistantTokens];

  // Count matching tokens
  let matchCount = 0;
  const matchedTerms = new Set();

  for (const qt of queryTokens) {
    for (const t of allTokens) {
      if (t.includes(qt) || qt.includes(t)) {
        matchCount++;
        matchedTerms.add(qt);
      }
    }
  }

  if (matchCount === 0) return 0;

  // Base relevance from match ratio
  const matchRatio = matchedTerms.size / queryTokens.length;

  // φ-weight by quality score
  const qualityBoost = conversation.quality?.score || 0.5;
  const phiWeight = conversation.quality?.phi_weight || 1.0;

  // Type filter bonus
  let typeBonus = 1.0;
  if (options.type && conversation.quality?.type === options.type) {
    typeBonus = PHI;  // 1.618x boost for matching type
  }

  // Calculate final relevance
  const relevance = matchRatio * qualityBoost * phiWeight * typeBonus;

  return Math.min(1, relevance);
}

async function loadConversations() {
  const conversations = [];

  if (!fs.existsSync(CONFIG.dataFile)) {
    console.error('Data file not found:', CONFIG.dataFile);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(CONFIG.dataFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      conversations.push(JSON.parse(line));
    } catch (e) {
      // Skip malformed JSON
    }
  }

  return conversations;
}

function formatResult(conv, relevance, index) {
  const userPreview = (conv.user?.content || '').slice(0, 100).replace(/\n/g, ' ');
  const assistPreview = (conv.assistant?.content || '').slice(0, 150).replace(/\n/g, ' ');

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#${index + 1} | Relevance: ${(relevance * 100).toFixed(1)}% | Quality: ${(conv.quality?.score * 100).toFixed(0)}% | Type: ${conv.quality?.type}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session: ${conv.session_id?.slice(0, 8)}... | ${conv.timestamp?.slice(0, 10)} | Branch: ${conv.git_branch || 'N/A'}

👤 USER:
${userPreview}${conv.user?.content?.length > 100 ? '...' : ''}

🤖 ASSISTANT:
${assistPreview}${conv.assistant?.content?.length > 150 ? '...' : ''}
`;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Usage: node searchConversations.js "query" [options]

Options:
  --type=TYPE    Filter by type (code_change, bugfix, decision, explanation, research, simple_query)
  --limit=N      Maximum results (default: 10)
  --json         Output as JSON
  --full         Show full content (not truncated)

Examples:
  node searchConversations.js "K-Score calculation"
  node searchConversations.js "database error" --type=bugfix --limit=5
  node searchConversations.js "webhook" --json
`);
    process.exit(0);
  }

  // Parse arguments
  const query = args.find(a => !a.startsWith('--')) || '';
  const typeArg = args.find(a => a.startsWith('--type='));
  const limitArg = args.find(a => a.startsWith('--limit='));
  const jsonOutput = args.includes('--json');
  const fullOutput = args.includes('--full');

  const options = {
    type: typeArg ? typeArg.split('=')[1] : null,
    limit: limitArg ? parseInt(limitArg.split('=')[1]) : CONFIG.defaultLimit,
  };

  console.log(`\n🔍 Searching for: "${query}"`);
  if (options.type) console.log(`   Type filter: ${options.type}`);
  console.log(`   Loading conversations...`);

  const conversations = await loadConversations();
  console.log(`   Loaded ${conversations.length} conversations`);

  // Tokenize query
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    console.error('Query too short or invalid');
    process.exit(1);
  }

  // Score all conversations
  const scored = conversations.map(conv => ({
    conv,
    relevance: calculateRelevance(conv, queryTokens, options)
  })).filter(s => s.relevance >= CONFIG.minRelevance);

  // Sort by relevance (φ-weighted)
  scored.sort((a, b) => b.relevance - a.relevance);

  const results = scored.slice(0, options.limit);

  if (results.length === 0) {
    console.log('\n❌ No relevant conversations found');
    process.exit(0);
  }

  console.log(`\n✅ Found ${scored.length} relevant conversations (showing top ${results.length})\n`);

  if (jsonOutput) {
    const output = results.map(r => ({
      relevance: r.relevance,
      ...r.conv
    }));
    console.log(JSON.stringify(output, null, 2));
  } else {
    for (let i = 0; i < results.length; i++) {
      const { conv, relevance } = results[i];
      if (fullOutput) {
        console.log(`\n#${i + 1} | Relevance: ${(relevance * 100).toFixed(1)}%`);
        console.log('USER:', conv.user?.content);
        console.log('\nASSISTANT:', conv.assistant?.content);
        console.log('\n' + '═'.repeat(60));
      } else {
        console.log(formatResult(conv, relevance, i));
      }
    }
  }

  // Stats
  const avgRelevance = results.reduce((sum, r) => sum + r.relevance, 0) / results.length;
  console.log(`\n📊 Average relevance: ${(avgRelevance * 100).toFixed(1)}%`);
}

main().catch(console.error);
