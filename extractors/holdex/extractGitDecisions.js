#!/usr/bin/env node
/**
 * Extract Decision History from Git Commits
 *
 * Reconstructs decision-making patterns from commit history
 * Output: training/raw/git-decisions.jsonl
 *
 * Philosophy: "BUILD > USE > HOLD" - Analyze what was built and why
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PHI = 1.618033988749895;

const OUTPUT_DIR = path.join(__dirname, '..', 'raw');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'git-decisions.jsonl');
const PROJECT_ROOT = path.join(__dirname, '../..');

// Commit type weights (φ-based, reflecting BUILD priority)
const TYPE_WEIGHTS = {
  feat: PHI * PHI,      // 2.618 - New features = highest value
  fix: PHI,             // 1.618 - Bug fixes = high value
  refactor: PHI,        // 1.618 - Improvements = high value
  perf: PHI,            // 1.618 - Performance = high value
  security: PHI * PHI,  // 2.618 - Security = highest value
  docs: 1.0,            // 1.0 - Documentation = normal
  test: 1.0,            // 1.0 - Tests = normal
  chore: 1 / PHI,       // 0.618 - Maintenance = lower
  style: 1 / PHI,       // 0.618 - Styling = lower
};

// Scope categories (what area of the system)
const SCOPE_CATEGORIES = {
  core: ['kscore', 'calculator', 'integrity', 'watchdog', 'harmony'],
  api: ['api', 'routes', 'auth', 'webhook', 'oracle'],
  data: ['db', 'redis', 'migration', 'data'],
  ui: ['frontend', 'ui', 'cards', 'ux'],
  security: ['security', 'sig', 'integrity', 'audit'],
  infra: ['docker', 'render', 'config', 'claude']
};

async function extractGitDecisions() {
  console.log('📜 Extracting decision history from git...');
  console.log(`   Output: ${OUTPUT_FILE}`);

  try {
    // Get commit list using execFileSync (safe, no shell injection)
    const commitHashes = execFileSync('git', [
      'log',
      '--format=%H',
      '--no-merges'
    ], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    }).trim().split('\n').filter(h => h);

    console.log(`   Total commits: ${commitHashes.length}`);

    const writeStream = fs.createWriteStream(OUTPUT_FILE);
    let decisionCount = 0;

    for (let i = 0; i < commitHashes.length; i++) {
      const hash = commitHashes[i];

      try {
        // Get commit details safely
        const subject = execFileSync('git', [
          'log', '-1', '--format=%s', hash
        ], { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();

        const date = execFileSync('git', [
          'log', '-1', '--format=%aI', hash
        ], { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();

        const author = execFileSync('git', [
          'log', '-1', '--format=%an', hash
        ], { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();

        // Parse conventional commit format
        const parsed = parseConventionalCommit(subject);

        if (parsed.type) {
          // Get files changed
          let filesChanged = [];
          try {
            const diffOutput = execFileSync('git', [
              'diff-tree', '--no-commit-id', '--name-only', '-r', hash
            ], { cwd: PROJECT_ROOT, encoding: 'utf8' });
            filesChanged = diffOutput.trim().split('\n').filter(f => f);
          } catch (e) {
            // Ignore diff errors
          }

          const decision = {
            hash: hash.substring(0, 8),
            date: date,
            author: author,
            type: parsed.type,
            scope: parsed.scope,
            description: parsed.description,
            breaking: parsed.breaking,
            category: categorizeScope(parsed.scope),
            weight: TYPE_WEIGHTS[parsed.type] || 1.0,
            files_changed: filesChanged.length,
            files: filesChanged.slice(0, 20),
            features: {
              is_core_change: isCoreChange(filesChanged),
              is_security_related: parsed.type === 'security' || (parsed.scope || '').includes('security'),
              is_phi_related: subject.toLowerCase().includes('phi') || subject.includes('φ'),
              is_kscore_related: parsed.scope === 'kscore' || filesChanged.some(f => f.includes('kScore')),
              complexity: estimateComplexity(filesChanged),
            }
          };

          writeStream.write(JSON.stringify(decision) + '\n');
          decisionCount++;
        }

        if ((i + 1) % 100 === 0) {
          console.log(`   Processed ${i + 1} / ${commitHashes.length} commits...`);
        }

      } catch (err) {
        continue;
      }
    }

    // Wait for stream to finish writing
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      writeStream.end();
    });

    const stats = generateStats(OUTPUT_FILE);

    console.log('\n📊 Decision Statistics:');
    console.log(`   Total decisions extracted: ${decisionCount}`);
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count}`);
    });

    const fileSize = fs.statSync(OUTPUT_FILE).size / 1024;
    console.log(`\n✅ Git decisions extracted`);
    console.log(`   File size: ${fileSize.toFixed(2)} KB`);

    return { total: decisionCount, stats };

  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    throw error;
  }
}

function parseConventionalCommit(subject) {
  const pattern = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
  const match = subject.match(pattern);

  if (match) {
    return {
      type: match[1].toLowerCase(),
      scope: match[2] || null,
      breaking: !!match[3],
      description: match[4]
    };
  }

  const words = subject.split(/[\s:]+/);
  const firstWord = words[0].toLowerCase();

  if (TYPE_WEIGHTS[firstWord]) {
    return {
      type: firstWord,
      scope: null,
      breaking: false,
      description: subject
    };
  }

  return { type: null, scope: null, breaking: false, description: subject };
}

function categorizeScope(scope) {
  if (!scope) return 'general';
  const scopeLower = scope.toLowerCase();

  for (const [category, scopes] of Object.entries(SCOPE_CATEGORIES)) {
    if (scopes.some(s => scopeLower.includes(s))) {
      return category;
    }
  }
  return 'other';
}

function isCoreChange(files) {
  const corePatterns = [/kScoreUpdater/i, /harmony\.js/i, /integrity/i, /calculator/i, /geometric-quality/i];
  return files.some(f => corePatterns.some(p => p.test(f)));
}

function estimateComplexity(files) {
  if (files.length > 10) return 'high';
  if (files.length > 3) return 'medium';
  return 'low';
}

function generateStats(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  const byType = {};
  const byCategory = {};

  for (const line of lines) {
    try {
      const decision = JSON.parse(line);
      byType[decision.type] = (byType[decision.type] || 0) + 1;
      byCategory[decision.category] = (byCategory[decision.category] || 0) + 1;
    } catch (e) { continue; }
  }

  return { byType, byCategory };
}

if (require.main === module) {
  extractGitDecisions()
    .then(() => { console.log(`\n📦 Git decision extraction complete`); process.exit(0); })
    .catch(err => { console.error('Extraction failed:', err); process.exit(1); });
}

module.exports = { extractGitDecisions };
