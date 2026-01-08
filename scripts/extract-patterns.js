#!/usr/bin/env node
/**
 * asdf-brain pattern extractor
 *
 * Identifies recurring patterns across conversations
 * Following $asdfasdfa: "Don't trust, verify" - patterns from actual data
 *
 * Pattern types:
 * - Technical (code patterns, architectures, libraries)
 * - Process (workflows, review patterns, deploy patterns)
 * - Issues (recurring bugs, common errors)
 * - Solutions (repeated fixes, established practices)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { streamConversations, KNOWLEDGE_ROOT } = require('./lib/data-sources');

// =============================================================================
// PATTERN DEFINITIONS
// =============================================================================

const PATTERN_EXTRACTORS = {
  // Technical patterns (code-related)
  technical: {
    async_await: /async\s+\w+|await\s+\w+/gi,
    try_catch: /try\s*\{|catch\s*\(/gi,
    redis_usage: /redis\.(get|set|del|hget|hset|lpush|rpush)/gi,
    postgres_query: /pool\.query|db\.query|\.query\s*\(/gi,
    webhook: /webhook|helius.*webhook|webhook.*helius/gi,
    socket_io: /socket\.io|io\.emit|socket\.emit/gi,
    rate_limit: /rate[_-]?limit|throttle|429/gi,
    cron_job: /cron|setInterval|setTimeout.*recurring/gi,
    signature: /signature|hmac|sha256|signing/gi,
    burn_mechanism: /burn|burnTokens|BURN_ADDRESS/gi,
  },

  // Process patterns (workflow-related)
  process: {
    deploy: /deploy|render|production|staging/gi,
    pr_review: /pull request|PR|review|merge/gi,
    hotfix: /hotfix|urgent|emergency|critical/gi,
    refactor: /refactor|cleanup|reorganize/gi,
    migration: /migration|migrate|schema change/gi,
    rollback: /rollback|revert|undo/gi,
  },

  // Issue patterns (problems)
  issues: {
    timeout: /timeout|timed out|ETIMEDOUT|ECONNRESET/gi,
    memory: /memory leak|heap|out of memory|OOM/gi,
    connection: /connection (error|refused|reset)|ECONNREFUSED/gi,
    null_undefined: /null|undefined|cannot read property/gi,
    race_condition: /race condition|concurrent|deadlock/gi,
    infinite_loop: /infinite loop|stack overflow|recursion/gi,
    auth_failure: /unauthorized|401|403|forbidden|auth fail/gi,
    data_integrity: /integrity|tamper|corrupt|invalid signature/gi,
  },

  // Solution patterns (fixes)
  solutions: {
    retry_logic: /retry|backoff|exponential/gi,
    circuit_breaker: /circuit breaker|circuit-breaker|failover/gi,
    graceful_shutdown: /graceful|SIGTERM|SIGINT|shutdown/gi,
    cache_strategy: /cache|invalidate|TTL|expiry/gi,
    queue_pattern: /queue|job|worker|background/gi,
    validation: /validate|sanitize|escape|xss/gi,
  },

  // Architecture patterns
  architecture: {
    microservice: /microservice|service mesh|api gateway/gi,
    event_driven: /event[_-]?driven|pub[_-]?sub|message queue/gi,
    singleton: /singleton|single instance|shared state/gi,
    factory: /factory|create.*instance|builder/gi,
    middleware: /middleware|interceptor|pipe/gi,
    repository: /repository|data access|DAO/gi,
  },

  // $asdfasdfa specific patterns
  asdfasdfa: {
    k_score: /k[_-]?score|kscore|K\s*=\s*100/gi,
    phi_ratio: /phi|golden ratio|1\.618|0\.618/gi,
    diamond_hands: /diamond|conviction|holder/gi,
    organic: /organic|distribution|anti[_-]?sniper/gi,
    longevity: /longevity|survival|age/gi,
    burn_fee: /burn.*fee|fee.*burn|100%\s*burn/gi,
    metal_rank: /diamond|platinum|gold|silver|bronze|iron|rust/gi,
  },
};

// =============================================================================
// EXTRACTION FUNCTIONS
// =============================================================================

function extractPatterns(text) {
  const patterns = {};
  let totalMatches = 0;

  for (const [category, extractors] of Object.entries(PATTERN_EXTRACTORS)) {
    patterns[category] = {};

    for (const [name, regex] of Object.entries(extractors)) {
      const matches = text.match(regex) || [];
      if (matches.length > 0) {
        patterns[category][name] = {
          count: matches.length,
          samples: [...new Set(matches.slice(0, 3))], // Unique samples
        };
        totalMatches += matches.length;
      }
    }

    // Remove empty categories
    if (Object.keys(patterns[category]).length === 0) {
      delete patterns[category];
    }
  }

  return { patterns, totalMatches };
}

function calculatePatternScore(patterns) {
  // φ-weighted scoring based on pattern categories
  const PHI = 1.618;
  const weights = {
    asdfasdfa: PHI * PHI, // Core ecosystem patterns
    technical: PHI,
    architecture: PHI,
    solutions: 1.0,
    issues: 1.0 / PHI, // Problems are less valuable
    process: 1.0 / PHI,
  };

  let score = 0;
  let totalWeight = 0;

  for (const [category, categoryPatterns] of Object.entries(patterns)) {
    const weight = weights[category] || 1.0;
    const patternCount = Object.keys(categoryPatterns).length;
    score += patternCount * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? score / totalWeight : 0;
}

async function processConversations(outputPath) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain pattern extractor');
  console.log('  Identifying recurring patterns in conversations');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Aggregate patterns across all conversations
  const globalPatterns = {};
  const patternsBySession = {};
  let processed = 0;
  let withPatterns = 0;

  try {
    for await (const entry of streamConversations()) {
      processed++;

      const userText = entry.user?.content || '';
      const assistText = entry.assistant?.content || '';
      const fullText = userText + ' ' + assistText;

      const { patterns, totalMatches } = extractPatterns(fullText);

      if (totalMatches > 0) {
        withPatterns++;

        // Aggregate globally
        for (const [category, categoryPatterns] of Object.entries(patterns)) {
          if (!globalPatterns[category]) {
            globalPatterns[category] = {};
          }
          for (const [name, data] of Object.entries(categoryPatterns)) {
            if (!globalPatterns[category][name]) {
              globalPatterns[category][name] = {
                count: 0,
                sessions: 0,
                samples: [],
              };
            }
            globalPatterns[category][name].count += data.count;
            globalPatterns[category][name].sessions += 1;
            globalPatterns[category][name].samples.push(...data.samples);
          }
        }

        // Track by session
        const sessionId = entry.session_id || 'unknown';
        if (!patternsBySession[sessionId]) {
          patternsBySession[sessionId] = {
            patterns: {},
            score: 0,
            conversationCount: 0,
          };
        }
        patternsBySession[sessionId].conversationCount++;

        for (const [category, categoryPatterns] of Object.entries(patterns)) {
          if (!patternsBySession[sessionId].patterns[category]) {
            patternsBySession[sessionId].patterns[category] = {};
          }
          for (const [name, data] of Object.entries(categoryPatterns)) {
            if (!patternsBySession[sessionId].patterns[category][name]) {
              patternsBySession[sessionId].patterns[category][name] = 0;
            }
            patternsBySession[sessionId].patterns[category][name] += data.count;
          }
        }
        patternsBySession[sessionId].score = calculatePatternScore(
          patternsBySession[sessionId].patterns
        );
      }

      if (processed % 100 === 0) {
        process.stdout.write(`\r   Processed: ${processed}, with patterns: ${withPatterns}`);
      }
    }
  } catch (e) {
    console.error('Error loading data:', e.message);
    console.log('Run: npm run brain:learn  to extract transcripts first');
    process.exit(1);
  }

  // Clean up samples (unique, limited)
  for (const category of Object.values(globalPatterns)) {
    for (const pattern of Object.values(category)) {
      pattern.samples = [...new Set(pattern.samples)].slice(0, 5);
    }
  }

  // Sort sessions by score
  const topSessions = Object.entries(patternsBySession)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 20)
    .map(([id, data]) => ({
      session_id: id,
      ...data,
    }));

  // Calculate statistics
  const stats = {
    total_conversations: processed,
    with_patterns: withPatterns,
    pattern_rate: ((withPatterns / processed) * 100).toFixed(1) + '%',
    by_category: {},
  };

  for (const [category, patterns] of Object.entries(globalPatterns)) {
    const totalCount = Object.values(patterns).reduce((sum, p) => sum + p.count, 0);
    const patternCount = Object.keys(patterns).length;
    stats.by_category[category] = {
      total_occurrences: totalCount,
      unique_patterns: patternCount,
      top_patterns: Object.entries(patterns)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name, data]) => ({ name, count: data.count, sessions: data.sessions })),
    };
  }

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('                      RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Processed: ${processed} conversations`);
  console.log(`🔍 With patterns: ${withPatterns} (${stats.pattern_rate})\n`);

  console.log('By Category:');
  for (const [cat, data] of Object.entries(stats.by_category)) {
    console.log(`\n   ${cat.toUpperCase()}: ${data.total_occurrences} occurrences`);
    for (const p of data.top_patterns.slice(0, 3)) {
      console.log(`      - ${p.name}: ${p.count} (${p.sessions} sessions)`);
    }
  }

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
          philosophy: "$asdfasdfa: Don't trust, verify",
        },
        statistics: stats,
        global_patterns: globalPatterns,
        top_sessions: topSessions,
      },
      null,
      2
    )
  );

  console.log(`\n\n💾 Saved to: ${outputPath}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

// =============================================================================
// MAIN
// =============================================================================

const outputPath = process.argv[2] || path.join(KNOWLEDGE_ROOT, 'patterns/extracted-patterns.json');

processConversations(outputPath).catch(console.error);
