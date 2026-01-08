#!/usr/bin/env node
/**
 * extractConversations.js
 *
 * Extracts conversation pairs from Claude Code transcripts
 * Following $asdfasdfa philosophy: φ-weighted quality scoring
 *
 * Input:  ~/.claude/projects/-workspaces-HolDex/*.jsonl
 * Output: training/raw/conversations.jsonl
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// =============================================================================
// φ CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_SQ = PHI * PHI;           // 2.618
const PHI_INV = 1 / PHI;            // 0.618

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  transcriptsDir: path.join(os.homedir(), '.claude/projects/-workspaces-HolDex'),
  outputFile: path.join(__dirname, '../raw/conversations.jsonl'),
  minQuality: 0.05,  // Very low threshold to capture most pairs

  // φ-based weights for interaction types
  weights: {
    code_change: PHI_SQ,    // 2.618
    decision: PHI_SQ,       // 2.618
    bugfix: PHI,            // 1.618
    explanation: PHI,       // 1.618
    research: 1.0,
    simple_query: PHI_INV,  // 0.618
  },
};

// =============================================================================
// STATISTICS
// =============================================================================

const stats = {
  filesProcessed: 0,
  filesSkipped: 0,
  totalMessages: 0,
  userMessages: 0,
  assistantMessages: 0,
  pairsExtracted: 0,
  byQuality: { high: 0, medium: 0, low: 0 },
};

// =============================================================================
// PARSING FUNCTIONS
// =============================================================================

async function parseTranscript(filePath) {
  const messages = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      messages.push(msg);
      stats.totalMessages++;
      if (msg.type === 'user') stats.userMessages++;
      if (msg.type === 'assistant') stats.assistantMessages++;
    } catch (e) {
      // Skip malformed JSON
    }
  }

  return messages;
}

function extractTextContent(msg) {
  if (!msg?.message?.content) return '';
  const content = msg.message.content;

  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content.map(block => {
      if (typeof block === 'string') return block;
      if (block.type === 'text') return block.text || '';
      if (block.type === 'tool_result') return String(block.content || '');
      if (block.type === 'tool_use') return `[Tool: ${block.name}]`;
      return '';
    }).join('\n');
  }

  return '';
}

function detectInteractionType(text) {
  if (/```/.test(text)) return 'code_change';
  if (/\b(fix|bug|error)\b/i.test(text)) return 'bugfix';
  if (/\b(decide|choice|approach)\b/i.test(text)) return 'decision';
  if (/\b(because|therefore|means)\b/i.test(text)) return 'explanation';
  if (/^.{1,50}$/.test(text.trim())) return 'simple_query';
  return 'research';
}

function calculateQuality(userText, assistantText) {
  // Length factor (0-1)
  const totalLen = userText.length + assistantText.length;
  const lengthFactor = Math.min(1, totalLen / 2000);

  // Code factor (bonus for code)
  const hasCode = /```/.test(assistantText);
  const codeFactor = hasCode ? PHI : 1.0;

  // Compute quality
  const rawScore = Math.pow(lengthFactor * codeFactor, 0.5);
  return Math.min(1, rawScore);
}

function buildConversationPairs(messages) {
  const pairs = [];
  const msgMap = new Map();

  // Index all messages by UUID
  for (const msg of messages) {
    if (msg.uuid) {
      msgMap.set(msg.uuid, msg);
    }
  }

  // Find assistant messages linked to user messages
  for (const msg of messages) {
    if (msg.type !== 'assistant') continue;
    if (!msg.parentUuid) continue;

    const parentMsg = msgMap.get(msg.parentUuid);
    if (!parentMsg || parentMsg.type !== 'user') continue;

    const userText = extractTextContent(parentMsg);
    const assistantText = extractTextContent(msg);

    // Skip empty pairs
    if (!userText.trim() && !assistantText.trim()) continue;

    const quality = calculateQuality(userText, assistantText);
    const interactionType = detectInteractionType(userText + assistantText);

    // Quality filtering
    if (quality < CONFIG.minQuality) continue;

    // Track stats
    if (quality >= 0.7) stats.byQuality.high++;
    else if (quality >= 0.3) stats.byQuality.medium++;
    else stats.byQuality.low++;

    pairs.push({
      session_id: msg.sessionId,
      timestamp: msg.timestamp,
      git_branch: msg.gitBranch || parentMsg.gitBranch || null,

      user: {
        uuid: parentMsg.uuid,
        content: userText,
      },

      assistant: {
        uuid: msg.uuid,
        content: assistantText,
      },

      quality: {
        score: Math.round(quality * 1000) / 1000,
        type: interactionType,
        phi_weight: CONFIG.weights[interactionType] || 1.0,
      },
    });

    stats.pairsExtracted++;
  }

  return pairs;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  extractConversations.js - $asdfasdfa Training Pipeline');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n📂 Source: ${CONFIG.transcriptsDir}`);
  console.log(`📄 Output: ${CONFIG.outputFile}\n`);

  if (!fs.existsSync(CONFIG.transcriptsDir)) {
    console.error('❌ Transcripts directory not found');
    process.exit(1);
  }

  const files = fs.readdirSync(CONFIG.transcriptsDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => path.join(CONFIG.transcriptsDir, f));

  console.log(`📊 Found ${files.length} transcript files\n`);

  const allPairs = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if ((i + 1) % 25 === 0 || i === files.length - 1) {
      process.stdout.write(`\r⏳ Processing: ${i + 1}/${files.length} files...`);
    }

    try {
      const messages = await parseTranscript(file);
      if (messages.length === 0) {
        stats.filesSkipped++;
        continue;
      }

      const pairs = buildConversationPairs(messages);
      allPairs.push(...pairs);
      stats.filesProcessed++;
    } catch (e) {
      stats.filesSkipped++;
    }
  }

  console.log('\n');

  // Sort by quality (highest first)
  allPairs.sort((a, b) => b.quality.score - a.quality.score);

  // Write output
  const outputDir = path.dirname(CONFIG.outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (allPairs.length > 0) {
    const outputStream = fs.createWriteStream(CONFIG.outputFile);
    for (const pair of allPairs) {
      outputStream.write(JSON.stringify(pair) + '\n');
    }
    outputStream.end();
  }

  // Print statistics
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                      RESULTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n📁 Files processed: ${stats.filesProcessed}`);
  console.log(`⏭️  Files skipped:   ${stats.filesSkipped}`);
  console.log(`\n📨 Total messages:  ${stats.totalMessages.toLocaleString()}`);
  console.log(`   👤 User:         ${stats.userMessages.toLocaleString()}`);
  console.log(`   🤖 Assistant:    ${stats.assistantMessages.toLocaleString()}`);
  console.log(`\n✅ Pairs extracted: ${stats.pairsExtracted.toLocaleString()}`);
  console.log(`\n📊 By Quality:`);
  console.log(`   🟢 High (≥0.7):   ${stats.byQuality.high.toLocaleString()}`);
  console.log(`   🟡 Medium (≥0.3): ${stats.byQuality.medium.toLocaleString()}`);
  console.log(`   🟠 Low (<0.3):    ${stats.byQuality.low.toLocaleString()}`);

  if (fs.existsSync(CONFIG.outputFile)) {
    const outputSize = fs.statSync(CONFIG.outputFile).size;
    console.log(`\n💾 Output: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📄 File: ${CONFIG.outputFile}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');

  return stats;
}

main().catch(console.error);
