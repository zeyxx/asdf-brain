#!/usr/bin/env node
/**
 * Backfill lang field on existing knowledge entries
 * Uses φ-threshold language detection (61.8% dominant, 38.2% mixed)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const langDetect = require('../lib/lang-detect');

const KNOWLEDGE_FILES = [
  'knowledge/learned/live.jsonl',
  'index/cross-repo.jsonl',
];

function backfillFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`  Skipped: ${filePath} (not found)`);
    return { updated: 0, already: 0, total: 0 };
  }

  const lines = fs.readFileSync(fullPath, 'utf8').trim().split('\n').filter(l => l);

  let updated = 0;
  let already = 0;

  const results = lines.map(line => {
    try {
      const entry = JSON.parse(line);

      if (entry.lang) {
        already++;
        return line;
      }

      // Detect language from content + context + user/assistant (for conversations)
      const text = [
        entry.content || '',
        entry.context || '',
        entry.user?.content || '',
        entry.assistant?.content || '',
      ].join(' ');

      const result = langDetect.detectLanguage(text);

      entry.lang = result.lang;

      // Add lang:XX tag if tags exist and tag not present
      if (entry.tags && Array.isArray(entry.tags)) {
        const langTag = 'lang:' + result.lang;
        if (!entry.tags.includes(langTag)) {
          entry.tags.push(langTag);
        }
      }

      updated++;
      return JSON.stringify(entry);
    } catch (e) {
      return line; // Keep malformed lines as-is
    }
  });

  fs.writeFileSync(fullPath, results.join('\n') + '\n');

  return { updated, already, total: lines.length };
}

console.log('Language Backfill (φ-thresholds: 61.8% dominant, 38.2% mixed)\n');
console.log('='.repeat(60));

let totalUpdated = 0;
let totalAlready = 0;
let totalEntries = 0;

for (const file of KNOWLEDGE_FILES) {
  console.log(`\nProcessing: ${file}`);
  const stats = backfillFile(file);
  console.log(`  Updated: ${stats.updated}, Already: ${stats.already}, Total: ${stats.total}`);

  totalUpdated += stats.updated;
  totalAlready += stats.already;
  totalEntries += stats.total;
}

console.log('\n' + '='.repeat(60));
console.log(`TOTAL: ${totalUpdated} updated, ${totalAlready} already had lang, ${totalEntries} entries`);
