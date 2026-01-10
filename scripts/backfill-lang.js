#!/usr/bin/env node
/**
 * Backfill lang field on existing knowledge entries
 * Uses φ-threshold language detection (61.8% dominant, 38.2% mixed)
 *
 * Usage: node scripts/backfill-lang.js [--force]
 *   --force: Re-detect all entries, even those with existing lang
 */

'use strict';

const fs = require('fs');
const path = require('path');
const langDetect = require('../lib/lang-detect');

const FORCE = process.argv.includes('--force');

const KNOWLEDGE_FILES = [
  'knowledge/learned/live.jsonl',
  'index/cross-repo.jsonl',
];

function backfillFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`  Skipped: ${filePath} (not found)`);
    return { updated: 0, already: 0, total: 0, distribution: {} };
  }

  const lines = fs.readFileSync(fullPath, 'utf8').trim().split('\n').filter(l => l);

  let updated = 0;
  let already = 0;
  const distribution = {};

  const results = lines.map(line => {
    try {
      const entry = JSON.parse(line);

      if (entry.lang && !FORCE) {
        already++;
        distribution[entry.lang] = (distribution[entry.lang] || 0) + 1;
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
      distribution[result.lang] = (distribution[result.lang] || 0) + 1;

      // Update lang:XX tag (remove old, add new)
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags = entry.tags.filter(t => !t.startsWith('lang:'));
        entry.tags.push('lang:' + result.lang);
      }

      updated++;
      return JSON.stringify(entry);
    } catch (e) {
      return line; // Keep malformed lines as-is
    }
  });

  fs.writeFileSync(fullPath, results.join('\n') + '\n');

  return { updated, already, total: lines.length, distribution };
}

console.log('Language Backfill (φ-thresholds: 61.8% dominant, 38.2% mixed)');
console.log(`Mode: ${FORCE ? 'FORCE (re-detect all)' : 'normal (skip existing)'}\n`);
console.log('='.repeat(60));

let totalUpdated = 0;
let totalAlready = 0;
let totalEntries = 0;
const totalDistribution = {};

for (const file of KNOWLEDGE_FILES) {
  console.log(`\nProcessing: ${file}`);
  const stats = backfillFile(file);
  console.log(`  Updated: ${stats.updated}, Already: ${stats.already}, Total: ${stats.total}`);

  totalUpdated += stats.updated;
  totalAlready += stats.already;
  totalEntries += stats.total;

  // Merge distributions
  for (const [lang, count] of Object.entries(stats.distribution || {})) {
    totalDistribution[lang] = (totalDistribution[lang] || 0) + count;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`TOTAL: ${totalUpdated} updated, ${totalAlready} already had lang, ${totalEntries} entries`);
console.log(`Distribution: ${JSON.stringify(totalDistribution)}`);
