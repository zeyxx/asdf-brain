#!/usr/bin/env node
/**
 * asdf-brain error extractor (post-mortems)
 *
 * Extracts error patterns, failures, and lessons learned
 * Following $asdfasdfa: "Don't trust, verify" - learn from actual failures
 *
 * Categories:
 * - Critical errors (production, data loss)
 * - Bug patterns (recurring issues)
 * - Fixes applied (solutions that worked)
 * - Lessons learned (explicit learnings)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { streamConversations, KNOWLEDGE_ROOT } = require('./lib/data-sources');

// =============================================================================
// ERROR PATTERN DEFINITIONS
// =============================================================================

const ERROR_PATTERNS = {
  // Critical errors (high severity)
  critical: {
    patterns: [
      /production.*down|prod.*down|site.*down/gi,
      /data\s*(loss|corrupt|missing)/gi,
      /security.*breach|hack|compromis/gi,
      /infinite loop|stack overflow/gi,
      /memory.*leak|OOM|out of memory/gi,
      /database.*corrupt|db.*crash/gi,
    ],
    severity: 'critical',
    phi_weight: 2.618,
  },

  // Runtime errors
  runtime: {
    patterns: [
      /TypeError|ReferenceError|SyntaxError/g,
      /cannot read property|undefined is not/gi,
      /null pointer|NullPointerException/gi,
      /ECONNREFUSED|ECONNRESET|ETIMEDOUT/g,
      /ENOENT|EACCES|EPERM/g,
      /unhandled.*rejection|uncaught.*exception/gi,
    ],
    severity: 'high',
    phi_weight: 1.618,
  },

  // Logic errors
  logic: {
    patterns: [
      /race condition|deadlock|concurrent/gi,
      /off[- ]by[- ]one|boundary|overflow/gi,
      /wrong.*result|incorrect.*calculation/gi,
      /infinite.*recursion|stack.*too.*deep/gi,
      /state.*inconsisten|out of sync/gi,
    ],
    severity: 'medium',
    phi_weight: 1.0,
  },

  // Integration errors
  integration: {
    patterns: [
      /api.*fail|endpoint.*error|404|500/gi,
      /webhook.*fail|webhook.*error/gi,
      /timeout|timed out/gi,
      /rate.*limit|429|too many requests/gi,
      /authentication.*fail|401|403/gi,
      /cors|cross[- ]origin/gi,
    ],
    severity: 'medium',
    phi_weight: 1.0,
  },

  // Data errors
  data: {
    patterns: [
      /invalid.*data|malformed|corrupt/gi,
      /duplicate.*key|unique.*constraint/gi,
      /foreign.*key|referential.*integrity/gi,
      /schema.*mismatch|migration.*fail/gi,
      /parse.*error|json.*invalid/gi,
    ],
    severity: 'medium',
    phi_weight: 1.0,
  },

  // Configuration errors
  config: {
    patterns: [
      /env.*missing|environment.*variable/gi,
      /config.*error|configuration.*invalid/gi,
      /secret.*missing|key.*not.*found/gi,
      /port.*in.*use|bind.*error/gi,
    ],
    severity: 'low',
    phi_weight: 0.618,
  },
};

// Fix patterns - what was done to resolve
const FIX_PATTERNS = [
  { pattern: /fix(ed)?:?\s+(.{10,100})/gi, type: 'explicit_fix' },
  { pattern: /the\s+solution\s+(was|is):?\s+(.{10,100})/gi, type: 'solution' },
  { pattern: /resolved\s+by:?\s+(.{10,100})/gi, type: 'resolution' },
  { pattern: /workaround:?\s+(.{10,100})/gi, type: 'workaround' },
  { pattern: /pour\s+(résoudre|fixer):?\s+(.{10,100})/gi, type: 'solution_fr' },
  { pattern: /corrigé\s+en:?\s+(.{10,100})/gi, type: 'fix_fr' },
];

// Lesson learned patterns
const LESSON_PATTERNS = [
  { pattern: /lesson\s+learned:?\s+(.{10,150})/gi, type: 'lesson' },
  { pattern: /never\s+(again|do):?\s+(.{10,100})/gi, type: 'never_again' },
  { pattern: /always\s+(remember|check|verify):?\s+(.{10,100})/gi, type: 'always_do' },
  { pattern: /next\s+time:?\s+(.{10,100})/gi, type: 'next_time' },
  { pattern: /note\s+to\s+self:?\s+(.{10,100})/gi, type: 'note' },
  { pattern: /j'ai\s+appris:?\s+(.{10,100})/gi, type: 'lesson_fr' },
  { pattern: /à\s+retenir:?\s+(.{10,100})/gi, type: 'remember_fr' },
];

// =============================================================================
// EXTRACTION FUNCTIONS
// =============================================================================

function extractErrors(text) {
  const errors = [];

  for (const [category, config] of Object.entries(ERROR_PATTERNS)) {
    for (const pattern of config.patterns) {
      const matches = text.match(pattern) || [];
      for (const match of matches) {
        // Get context around the match
        const idx = text.indexOf(match);
        const start = Math.max(0, idx - 50);
        const end = Math.min(text.length, idx + match.length + 100);
        const context = text.slice(start, end).replace(/\n/g, ' ').trim();

        errors.push({
          category,
          severity: config.severity,
          phi_weight: config.phi_weight,
          match: match.slice(0, 50),
          context,
        });
      }
    }
  }

  return errors;
}

function extractFixes(text) {
  const fixes = [];

  for (const { pattern, type } of FIX_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const fixText = match[match.length - 1]; // Last capture group
      if (fixText && fixText.length > 10) {
        fixes.push({
          type,
          text: fixText.replace(/\n/g, ' ').trim().slice(0, 150),
        });
      }
    }
  }

  return fixes;
}

function extractLessons(text) {
  const lessons = [];

  for (const { pattern, type } of LESSON_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const lessonText = match[match.length - 1];
      if (lessonText && lessonText.length > 10) {
        lessons.push({
          type,
          text: lessonText.replace(/\n/g, ' ').trim().slice(0, 200),
        });
      }
    }
  }

  return lessons;
}

async function processConversations(outputPath) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain error extractor (post-mortems)');
  console.log('  Extracting failures and lessons learned');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Aggregators
  const errorsByCategory = {};
  const allFixes = [];
  const allLessons = [];
  const postMortems = []; // Significant error incidents
  let processed = 0;
  let withErrors = 0;

  try {
    for await (const entry of streamConversations()) {
      processed++;

      const userText = entry.user?.content || '';
      const assistText = entry.assistant?.content || '';
      const fullText = userText + ' ' + assistText;

      const errors = extractErrors(fullText);
      const fixes = extractFixes(fullText);
      const lessons = extractLessons(fullText);

      if (errors.length > 0) {
        withErrors++;

        // Aggregate by category
        for (const error of errors) {
          if (!errorsByCategory[error.category]) {
            errorsByCategory[error.category] = {
              severity: error.severity,
              phi_weight: error.phi_weight,
              count: 0,
              examples: [],
            };
          }
          errorsByCategory[error.category].count++;
          if (errorsByCategory[error.category].examples.length < 10) {
            errorsByCategory[error.category].examples.push({
              match: error.match,
              context: error.context,
              session: entry.session_id,
            });
          }
        }

        // Create post-mortem for critical/high severity
        const criticalErrors = errors.filter(
          (e) => e.severity === 'critical' || e.severity === 'high'
        );
        if (criticalErrors.length > 0) {
          postMortems.push({
            session_id: entry.session_id,
            timestamp: entry.timestamp,
            errors: criticalErrors.slice(0, 3),
            fixes: fixes.slice(0, 3),
            lessons: lessons.slice(0, 2),
            user_preview: userText.slice(0, 100),
          });
        }
      }

      // Collect fixes and lessons even without detected errors
      allFixes.push(...fixes);
      allLessons.push(...lessons);

      if (processed % 100 === 0) {
        process.stdout.write(`\r   Processed: ${processed}, with errors: ${withErrors}`);
      }
    }
  } catch (e) {
    console.error('Error loading data:', e.message);
    console.log('Run: npm run brain:learn  to extract transcripts first');
    process.exit(1);
  }

  // Deduplicate fixes and lessons by text similarity
  const uniqueFixes = [...new Map(allFixes.map((f) => [f.text.slice(0, 50), f])).values()];
  const uniqueLessons = [...new Map(allLessons.map((l) => [l.text.slice(0, 50), l])).values()];

  // Sort post-mortems by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  postMortems.sort((a, b) => {
    const aMax = Math.min(...a.errors.map((e) => severityOrder[e.severity]));
    const bMax = Math.min(...b.errors.map((e) => severityOrder[e.severity]));
    return aMax - bMax;
  });

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('                      RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Processed: ${processed} conversations`);
  console.log(`⚠️  With errors: ${withErrors} (${((withErrors / processed) * 100).toFixed(1)}%)\n`);

  console.log('Errors by Category:');
  for (const [cat, data] of Object.entries(errorsByCategory).sort(
    (a, b) => b[1].count - a[1].count
  )) {
    console.log(`   ${cat} (${data.severity}): ${data.count}`);
  }

  console.log(`\n📝 Fixes extracted: ${uniqueFixes.length}`);
  console.log(`💡 Lessons learned: ${uniqueLessons.length}`);
  console.log(`🔥 Post-mortems (critical/high): ${postMortems.length}`);

  // Write output
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        metadata: {
          generated: new Date().toISOString(),
          source: 'brain-unified',
          philosophy: "$asdfasdfa: Learn from failures, don't repeat them",
        },
        statistics: {
          total_conversations: processed,
          with_errors: withErrors,
          error_rate: ((withErrors / processed) * 100).toFixed(1) + '%',
          fixes_extracted: uniqueFixes.length,
          lessons_learned: uniqueLessons.length,
          post_mortems: postMortems.length,
        },
        errors_by_category: errorsByCategory,
        fixes: uniqueFixes.slice(0, 100),
        lessons: uniqueLessons.slice(0, 50),
        post_mortems: postMortems.slice(0, 100),
      },
      null,
      2
    )
  );

  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

// =============================================================================
// MAIN
// =============================================================================

const outputPath = process.argv[2] || path.join(KNOWLEDGE_ROOT, 'errors/post-mortems.json');

processConversations(outputPath).catch(console.error);
