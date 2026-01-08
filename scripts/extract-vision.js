#!/usr/bin/env node
/**
 * asdf-brain vision extractor
 *
 * Extracts roadmap items and future plans from conversations
 * Following $asdfasdfa: "Don't trust, verify" - vision from actual discussions
 *
 * Extracts:
 * - Future plans (TODO, NEXT, LATER)
 * - Feature requests
 * - Technical debt items
 * - Architecture improvements
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { streamConversations, KNOWLEDGE_ROOT } = require('./lib/data-sources');

// =============================================================================
// VISION PATTERNS
// =============================================================================

const VISION_PATTERNS = {
  // Future plans
  future: {
    patterns: [
      /TODO:?\s+(.{10,100})/gi,
      /FIXME:?\s+(.{10,100})/gi,
      /HACK:?\s+(.{10,100})/gi,
      /next\s+(step|phase|we\s+(should|could|will)):?\s*(.{10,100})/gi,
      /later\s+we\s+(should|could|will):?\s*(.{10,100})/gi,
      /eventually:?\s+(.{10,100})/gi,
      /in\s+the\s+future:?\s+(.{10,100})/gi,
      /prochaine\s+étape:?\s+(.{10,100})/gi,
      /plus\s+tard:?\s+(.{10,100})/gi,
    ],
    category: 'planned',
  },

  // Feature requests
  features: {
    patterns: [
      /we\s+(need|want|should\s+add):?\s+(.{10,100})/gi,
      /it\s+would\s+be\s+(nice|good|great)\s+to:?\s+(.{10,100})/gi,
      /feature\s+request:?\s+(.{10,100})/gi,
      /new\s+feature:?\s+(.{10,100})/gi,
      /il\s+(faut|faudrait):?\s+(.{10,100})/gi,
      /on\s+devrait:?\s+(.{10,100})/gi,
    ],
    category: 'feature',
  },

  // Technical debt
  debt: {
    patterns: [
      /technical\s+debt:?\s+(.{10,100})/gi,
      /tech\s+debt:?\s+(.{10,100})/gi,
      /needs?\s+refactor(ing)?:?\s+(.{10,100})/gi,
      /should\s+be\s+refactored:?\s+(.{10,100})/gi,
      /dette\s+technique:?\s+(.{10,100})/gi,
      /à\s+refactoriser:?\s+(.{10,100})/gi,
    ],
    category: 'debt',
  },

  // Architecture
  architecture: {
    patterns: [
      /architecture:?\s+(.{10,100})/gi,
      /we\s+could\s+improve:?\s+(.{10,100})/gi,
      /better\s+approach:?\s+(.{10,100})/gi,
      /should\s+restructure:?\s+(.{10,100})/gi,
      /restructurer:?\s+(.{10,100})/gi,
    ],
    category: 'architecture',
  },

  // Scaling
  scaling: {
    patterns: [
      /when\s+we\s+scale:?\s+(.{10,100})/gi,
      /for\s+scaling:?\s+(.{10,100})/gi,
      /scalability:?\s+(.{10,100})/gi,
      /performance\s+improvement:?\s+(.{10,100})/gi,
    ],
    category: 'scaling',
  },

  // Security improvements
  security: {
    patterns: [
      /security\s+improvement:?\s+(.{10,100})/gi,
      /should\s+be\s+more\s+secure:?\s+(.{10,100})/gi,
      /harden:?\s+(.{10,100})/gi,
      /sécurité:?\s+(.{10,100})/gi,
    ],
    category: 'security',
  },
};

// =============================================================================
// EXTRACTION FUNCTIONS
// =============================================================================

function extractVision(text) {
  const items = [];

  for (const [type, config] of Object.entries(VISION_PATTERNS)) {
    for (const pattern of config.patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        // Get the last capture group (the actual content)
        const content = match[match.length - 1];
        if (content && content.length > 10) {
          // Get context around match
          const idx = text.indexOf(match[0]);
          const start = Math.max(0, idx - 30);
          const end = Math.min(text.length, idx + match[0].length + 50);
          const context = text.slice(start, end).replace(/\n/g, ' ').trim();

          items.push({
            type,
            category: config.category,
            content: content.replace(/\n/g, ' ').trim().slice(0, 150),
            context: context.slice(0, 200),
          });
        }
      }
    }
  }

  return items;
}

async function processConversations(outputPath) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain vision extractor');
  console.log('  Extracting roadmap and future plans');
  console.log('═══════════════════════════════════════════════════════════\n');

  const allItems = [];
  const byCategory = {};
  let processed = 0;
  let withVision = 0;

  try {
    for await (const entry of streamConversations()) {
      processed++;

      const userText = entry.user?.content || '';
      const assistText = entry.assistant?.content || '';
      const fullText = userText + ' ' + assistText;

      const items = extractVision(fullText);

      if (items.length > 0) {
        withVision++;

        for (const item of items) {
          allItems.push({
            ...item,
            session_id: entry.session_id,
            timestamp: entry.timestamp,
          });

          if (!byCategory[item.category]) {
            byCategory[item.category] = [];
          }
          byCategory[item.category].push(item.content);
        }
      }

      if (processed % 100 === 0) {
        process.stdout.write(`\r   Processed: ${processed}, with vision items: ${withVision}`);
      }
    }
  } catch (e) {
    console.error('Error loading data:', e.message);
    console.log('Run: npm run brain:learn  to extract transcripts first');
    process.exit(1);
  }

  // Deduplicate by content similarity
  const deduped = {};
  for (const [category, items] of Object.entries(byCategory)) {
    deduped[category] = [...new Map(items.map((i) => [i.slice(0, 50), i])).values()];
  }

  // Sort by frequency
  const sortedByFrequency = {};
  for (const [category, items] of Object.entries(byCategory)) {
    const freq = {};
    for (const item of items) {
      const key = item.slice(0, 50);
      freq[key] = (freq[key] || 0) + 1;
    }
    sortedByFrequency[category] = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([text, count]) => ({ text, count }));
  }

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('                      RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Processed: ${processed} conversations`);
  console.log(`🔮 With vision items: ${withVision} (${((withVision / processed) * 100).toFixed(1)}%)\n`);

  console.log('By Category:');
  for (const [cat, items] of Object.entries(deduped)) {
    console.log(`   ${cat}: ${items.length} unique items`);
  }

  console.log('\n📋 Top Items by Category:');
  for (const [cat, items] of Object.entries(sortedByFrequency)) {
    if (items.length === 0) continue;
    console.log(`\n   ${cat.toUpperCase()}:`);
    for (const item of items.slice(0, 3)) {
      console.log(`      (${item.count}x) ${item.text.slice(0, 60)}...`);
    }
  }

  // Build roadmap structure
  const roadmap = {
    immediate: [], // High frequency items
    planned: [], // Explicitly planned
    wishlist: [], // Feature requests with low frequency
  };

  for (const [category, items] of Object.entries(sortedByFrequency)) {
    for (const item of items) {
      const entry = { category, text: item.text, mentions: item.count };
      if (item.count >= 3) {
        roadmap.immediate.push(entry);
      } else if (category === 'planned' || category === 'debt') {
        roadmap.planned.push(entry);
      } else {
        roadmap.wishlist.push(entry);
      }
    }
  }

  // Sort roadmap by mentions
  roadmap.immediate.sort((a, b) => b.mentions - a.mentions);
  roadmap.planned.sort((a, b) => b.mentions - a.mentions);
  roadmap.wishlist.sort((a, b) => b.mentions - a.mentions);

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
          philosophy: "$asdfasdfa: Vision from actual discussions",
        },
        statistics: {
          total_conversations: processed,
          with_vision: withVision,
          vision_rate: ((withVision / processed) * 100).toFixed(1) + '%',
        },
        by_category: sortedByFrequency,
        roadmap: roadmap,
        all_items: allItems.slice(0, 500),
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

const outputPath = process.argv[2] || path.join(KNOWLEDGE_ROOT, 'vision/roadmap.json');

processConversations(outputPath).catch(console.error);
