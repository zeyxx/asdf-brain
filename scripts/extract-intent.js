#!/usr/bin/env node
/**
 * asdf-brain intent extractor
 *
 * Extracts the POURQUOI from conversations
 * Following $asdfasdfa: "Don't trust, verify" - extract from actual data
 *
 * Searches for decision patterns:
 * - "parce que", "because", "donc", "therefore"
 * - "décidé", "decided", "choisi", "chose"
 * - "plutôt que", "instead of", "au lieu de"
 * - "le problème", "the issue", "the problem"
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// =============================================================================
// INTENT PATTERNS (Multi-language)
// =============================================================================

const INTENT_PATTERNS = {
  // Causality (WHY)
  causality: [
    /parce que/i,
    /because/i,
    /car\s/i,
    /donc/i,
    /therefore/i,
    /ainsi/i,
    /puisque/i,
    /since\s/i,
    /due to/i,
    /à cause de/i,
  ],

  // Decision (CHOSE)
  decision: [
    /décidé/i,
    /decided/i,
    /choisi/i,
    /chose\s/i,
    /opté pour/i,
    /opted for/i,
    /we('ll| will) (use|go with)/i,
    /let's (use|go with)/i,
    /on va utiliser/i,
  ],

  // Alternative (INSTEAD OF)
  alternative: [
    /plutôt que/i,
    /instead of/i,
    /au lieu de/i,
    /rather than/i,
    /not .+ but/i,
    /pas .+ mais/i,
  ],

  // Problem (THE ISSUE)
  problem: [
    /le problème/i,
    /the (problem|issue)/i,
    /bug/i,
    /erreur/i,
    /error/i,
    /ne (fonctionne|marche) pas/i,
    /doesn't work/i,
    /failed/i,
    /échoué/i,
  ],

  // Solution (THE FIX)
  solution: [
    /la solution/i,
    /the (solution|fix)/i,
    /pour (résoudre|fixer)/i,
    /to (fix|solve|resolve)/i,
    /corrigé/i,
    /fixed/i,
  ],

  // Rationale (REASON)
  rationale: [
    /la raison/i,
    /the reason/i,
    /c'est (parce|car|pour)/i,
    /this is (because|why)/i,
    /pour cette raison/i,
  ],
};

// =============================================================================
// EXTRACTION FUNCTIONS
// =============================================================================

function extractIntentFromText(text) {
  const intents = [];

  for (const [category, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        // Extract context around the match
        const match = text.match(pattern);
        if (match) {
          const startIdx = Math.max(0, match.index - 50);
          const endIdx = Math.min(text.length, match.index + match[0].length + 150);
          const context = text.slice(startIdx, endIdx).replace(/\n/g, ' ').trim();

          intents.push({
            category,
            pattern: pattern.toString(),
            context: context,
            position: match.index,
          });
        }
        break; // One match per category is enough
      }
    }
  }

  return intents;
}

async function processConversations(inputPath, outputPath) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain intent extractor');
  console.log('  Extracting the POURQUOI from conversations');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const allIntents = [];
  let processed = 0;
  let withIntent = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    processed++;

    try {
      const entry = JSON.parse(line);
      const userText = entry.user?.content || '';
      const assistText = entry.assistant?.content || '';
      const fullText = userText + ' ' + assistText;

      const intents = extractIntentFromText(fullText);

      if (intents.length > 0) {
        withIntent++;
        allIntents.push({
          session_id: entry.session_id,
          timestamp: entry.timestamp,
          quality: entry.quality,
          intents: intents,
          user_preview: userText.slice(0, 100),
          assistant_preview: assistText.slice(0, 100),
        });
      }

      if (processed % 1000 === 0) {
        process.stdout.write(`\r   Processed: ${processed}, found intent: ${withIntent}`);
      }
    } catch (e) {
      // Skip malformed JSON
    }
  }

  // Group by category
  const byCategory = {};
  for (const entry of allIntents) {
    for (const intent of entry.intents) {
      if (!byCategory[intent.category]) {
        byCategory[intent.category] = [];
      }
      byCategory[intent.category].push({
        context: intent.context,
        session: entry.session_id,
        timestamp: entry.timestamp,
      });
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('                      RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Processed: ${processed} conversations`);
  console.log(`🎯 With intent: ${withIntent} (${((withIntent/processed)*100).toFixed(1)}%)\n`);

  console.log('By Category:');
  for (const [cat, items] of Object.entries(byCategory)) {
    console.log(`   ${cat}: ${items.length}`);
  }

  // Write output
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify({
    metadata: {
      generated: new Date().toISOString(),
      source: inputPath,
      total_conversations: processed,
      with_intent: withIntent,
    },
    by_category: byCategory,
    all_intents: allIntents.slice(0, 500), // Limit size
  }, null, 2));

  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

// =============================================================================
// MAIN
// =============================================================================

const inputPath = process.argv[2] || '/workspaces/HolDex/training/raw/conversations-safe.jsonl';
const outputPath = process.argv[3] || path.join(__dirname, '../knowledge/intent/extracted-intents.json');

processConversations(inputPath, outputPath).catch(console.error);
