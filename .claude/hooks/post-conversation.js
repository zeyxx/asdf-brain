#!/usr/bin/env node
/**
 * asdf-brain post-conversation hook
 *
 * Automatically extracts learnings from conversations
 * Runs silently after each significant conversation
 *
 * Following $asdfasdfa: "Don't trust, verify" - learn from actual data
 */

'use strict';

const fs = require('fs');
const path = require('path');

const BRAIN_DIR = path.join(__dirname, '../..');
const LEARNINGS_FILE = path.join(BRAIN_DIR, 'knowledge/realtime/latest-learnings.jsonl');

// Ensure directory exists
const realtimeDir = path.dirname(LEARNINGS_FILE);
if (!fs.existsSync(realtimeDir)) {
  fs.mkdirSync(realtimeDir, { recursive: true });
}

// Read conversation from stdin
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    // Extract key learnings
    const learning = {
      timestamp: new Date().toISOString(),
      session_id: data.session_id || 'unknown',
      type: detectType(data),
      summary: extractSummary(data),
    };

    // Append to learnings file
    fs.appendFileSync(LEARNINGS_FILE, JSON.stringify(learning) + '\n');

    // Silent success
    process.exit(0);
  } catch (e) {
    // Silent failure - don't block conversation
    process.exit(0);
  }
});

function detectType(data) {
  const content = JSON.stringify(data).toLowerCase();

  if (content.includes('fix') || content.includes('bug')) return 'bug_fix';
  if (content.includes('feature') || content.includes('add')) return 'feature';
  if (content.includes('refactor')) return 'refactor';
  if (content.includes('security')) return 'security';
  if (content.includes('k-score') || content.includes('kscore')) return 'kscore';
  if (content.includes('webhook')) return 'webhook';
  if (content.includes('asdfasdfa') || content.includes('burn')) return 'ecosystem';

  return 'general';
}

function extractSummary(data) {
  // Extract first meaningful line
  const text = data.user?.content || data.content || '';
  const lines = text.split('\n').filter((l) => l.trim().length > 10);
  return lines[0]?.slice(0, 200) || 'No summary';
}
