#!/usr/bin/env node
/**
 * asdf-brain indexer
 *
 * Indexes knowledge from all ecosystem repos following $asdfasdfa philosophy:
 * - Don't trust, verify (hash all sources)
 * - φ distribution (weight by golden ratio)
 * - K = ∛(D×O×L) quality scoring
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// φ CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;           // 0.618
const PHI_INV_2 = PHI_INV * PHI_INV; // 0.382
const PHI_INV_3 = PHI_INV_2 * PHI_INV; // 0.236

// =============================================================================
// ECOSYSTEM CONFIGURATION
// =============================================================================

const ECOSYSTEM = {
  // Your development repos (zeyxx)
  dev: {
    holdex: { path: '/workspaces/HolDex', layer: 'intelligence', phi_weight: PHI },
    gasdf: { path: '/workspaces/GASdf', layer: 'infrastructure', phi_weight: PHI },
    manifesto: { path: '/workspaces/asdf-manifesto', layer: 'philosophy', phi_weight: PHI_INV },
    claudeMem: { path: '/workspaces/claude-mem', layer: 'tooling', phi_weight: PHI_INV_2 },
  },

  // Production repos (sollama58) - to be cloned
  prod: {
    holdex: { repo: 'sollama58/HolDex', layer: 'intelligence', phi_weight: PHI },
    asdev: { repo: 'sollama58/ASDev', layer: 'consumer', phi_weight: 1.0 },
    forecast: { repo: 'sollama58/ASDForecast', layer: 'consumer', phi_weight: 1.0 },
    burnTracker: { repo: 'sollama58/ASDFBurnTracker', layer: 'consumer', phi_weight: PHI_INV },
  },

  // Layer weights (φ distribution)
  layers: {
    intelligence: PHI,        // 1.618 - core analytics
    infrastructure: PHI,      // 1.618 - core utilities
    consumer: 1.0,            // 1.0   - user apps
    philosophy: PHI_INV,      // 0.618 - guiding docs
    tooling: PHI_INV_2,       // 0.382 - development tools
  }
};

// =============================================================================
// QUALITY CALCULATION (K = ∛(D×O×L))
// =============================================================================

/**
 * Calculate knowledge quality using geometric mean
 * @param {Object} entry - Knowledge entry
 * @returns {number} Quality score 0-100
 */
function calculateQuality(entry) {
  // D = Data Quality (is source verified?)
  const D = entry.verified ? 1.0 : 0.5;

  // O = Organic (naturally occurring pattern vs forced)
  const O = entry.frequency > 1 ? Math.min(1, entry.frequency / 10) : 0.3;

  // L = Longevity (age factor - older = more proven)
  const ageInDays = entry.first_seen
    ? (Date.now() - new Date(entry.first_seen).getTime()) / (1000 * 60 * 60 * 24)
    : 1;
  const L = Math.min(1, ageInDays / 30); // Max at 30 days

  // K = 100 × ∛(D × O × L)
  const K = 100 * Math.cbrt(D * O * L);

  return Math.round(K * 10) / 10;
}

/**
 * Generate verification hash for entry
 */
function generateHash(content) {
  return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16);
}

// =============================================================================
// INDEXER FUNCTIONS
// =============================================================================

/**
 * Index a single repo's knowledge
 */
async function indexRepo(name, config, type) {
  const entries = [];

  if (type === 'dev' && config.path && fs.existsSync(config.path)) {
    // Index from local path
    console.log(`  📂 Indexing ${name} from ${config.path}`);

    // Check for existing training data
    const trainingPath = path.join(config.path, 'training/raw');
    if (fs.existsSync(trainingPath)) {
      const files = fs.readdirSync(trainingPath).filter(f => f.endsWith('.jsonl'));
      for (const file of files) {
        const lines = fs.readFileSync(path.join(trainingPath, file), 'utf-8')
          .split('\n')
          .filter(l => l.trim());

        console.log(`    Found ${lines.length} entries in ${file}`);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            entries.push({
              source: `${name}/${file}`,
              layer: config.layer,
              phi_weight: config.phi_weight * ECOSYSTEM.layers[config.layer],
              data_hash: generateHash(data),
              type: type,
              raw: data,
            });
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    // Index CLAUDE.md for patterns
    const claudeMd = path.join(config.path, 'CLAUDE.md');
    if (fs.existsSync(claudeMd)) {
      const content = fs.readFileSync(claudeMd, 'utf-8');
      entries.push({
        source: `${name}/CLAUDE.md`,
        layer: config.layer,
        phi_weight: config.phi_weight * PHI, // Boost for project context
        data_hash: generateHash(content),
        type: 'context',
        summary: content.slice(0, 500),
      });
    }
  }

  return entries;
}

/**
 * Build unified cross-repo index
 */
async function buildIndex() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain indexer - $asdfasdfa philosophy');
  console.log('═══════════════════════════════════════════════════════════\n');

  const allEntries = [];
  const signatures = {};

  // Index dev repos
  console.log('📦 Indexing development repos (zeyxx)...\n');
  for (const [name, config] of Object.entries(ECOSYSTEM.dev)) {
    const entries = await indexRepo(name, config, 'dev');
    allEntries.push(...entries);
    console.log(`    ✓ ${name}: ${entries.length} entries\n`);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                      RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Calculate quality for all entries
  for (const entry of allEntries) {
    entry.quality = calculateQuality({
      verified: true,
      frequency: 1,
      first_seen: new Date().toISOString(),
    });
    signatures[entry.data_hash] = {
      source: entry.source,
      indexed_at: new Date().toISOString(),
    };
  }

  // Group by layer
  const byLayer = {};
  for (const entry of allEntries) {
    byLayer[entry.layer] = (byLayer[entry.layer] || 0) + 1;
  }

  console.log(`📊 Total entries: ${allEntries.length}`);
  console.log('\nBy Layer:');
  for (const [layer, count] of Object.entries(byLayer)) {
    const weight = ECOSYSTEM.layers[layer] || 1;
    console.log(`  ${layer}: ${count} (φ weight: ${weight.toFixed(3)})`);
  }

  // Write index
  const indexDir = path.join(__dirname, '../index');
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }

  // Write entries (without raw data for size)
  const indexEntries = allEntries.map(e => ({
    source: e.source,
    layer: e.layer,
    phi_weight: e.phi_weight,
    quality: e.quality,
    data_hash: e.data_hash,
    type: e.type,
  }));

  fs.writeFileSync(
    path.join(indexDir, 'cross-repo.jsonl'),
    indexEntries.map(e => JSON.stringify(e)).join('\n')
  );

  fs.writeFileSync(
    path.join(indexDir, 'signatures.json'),
    JSON.stringify(signatures, null, 2)
  );

  console.log(`\n💾 Index written to ${indexDir}/`);
  console.log('═══════════════════════════════════════════════════════════\n');

  return { entries: allEntries.length, signatures: Object.keys(signatures).length };
}

// =============================================================================
// MAIN
// =============================================================================

buildIndex().catch(console.error);
