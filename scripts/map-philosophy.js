#!/usr/bin/env node
/**
 * asdf-brain philosophy mapper
 *
 * Maps manifesto principles to actual code implementations
 * Following $asdfasdfa: "Don't trust, verify" - verify the philosophy lives in code
 *
 * Core Principles from MANIFESTO.md:
 * I.   100% Burn - No extraction
 * II.  Don't trust, verify - Cryptographic signatures
 * III. K-Score - Geometric mean of D×O×L
 * IV.  φ (Phi) - Golden ratio for thresholds
 * V.   Alignment - Everyone benefits from burns
 * VI.  Open Source - MIT licensed, fork as feature
 * VII. Anti-principles - No marketing, no obscurantism
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// MANIFESTO PRINCIPLES
// =============================================================================

const PRINCIPLES = {
  burn_100: {
    name: '100% Burn',
    manifesto: 'Every fee paid to interact with $asdfasdfa is burned. Not 38%. Not 50%. One hundred percent.',
    patterns: [
      { regex: /100\s*%.*burn|burn.*100\s*%/gi, type: 'explicit' },
      { regex: /burnTokens|BURN_ADDRESS|burn.*fee/gi, type: 'implementation' },
      { regex: /no.*treasury|no.*skim|no.*extraction/gi, type: 'anti-pattern' },
    ],
    expected_files: ['services/burn.js', 'routes/space.js'],
    weight: 2.618, // φ² - Core principle
  },

  verify_not_trust: {
    name: "Don't Trust, Verify",
    manifesto: 'Every K-Score is cryptographically signed. 8 categories. HMAC-SHA256. Verifiable by anyone.',
    patterns: [
      { regex: /hmac|sha256|signature|sign/gi, type: 'crypto' },
      { regex: /verify|verifiable|verification/gi, type: 'verification' },
      { regex: /integrity|tamper|chaos_nonce/gi, type: 'integrity' },
    ],
    expected_files: ['utils/signatures.js', 'tasks/integrityWatchdog.js', 'routes/tokens.js'],
    weight: 2.618, // φ² - Core principle
  },

  k_score_formula: {
    name: 'K-Score Formula',
    manifesto: 'K = 100 × ∛(D × O × L). Diamond Hands, Organic Growth, Longevity.',
    patterns: [
      { regex: /k[_-]?score|kscore/gi, type: 'naming' },
      { regex: /diamond.*hands?|conviction/gi, type: 'D_factor' },
      { regex: /organic.*growth?|distribution|anti[_-]?sniper/gi, type: 'O_factor' },
      { regex: /longevity|survival|age/gi, type: 'L_factor' },
      { regex: /geometric|cube.*root|cbrt|Math\.cbrt/gi, type: 'math' },
    ],
    expected_files: ['tasks/kScoreUpdater.js'],
    weight: 1.618, // φ - Important
  },

  phi_ratio: {
    name: 'φ (Phi) Ratio',
    manifesto: 'φ = 1.618... φ⁻¹ = 61.8%. φ⁻² = 38.2%. These ratios guide thresholds and weights.',
    patterns: [
      { regex: /1\.618|0\.618|phi|PHI/g, type: 'constant' },
      { regex: /61\.8|38\.2|golden.*ratio/gi, type: 'threshold' },
      { regex: /φ|Φ/g, type: 'symbol' },
    ],
    expected_files: ['harmony.js', 'shared/harmony.js'],
    weight: 1.0, // 1 - Aesthetic
  },

  alignment: {
    name: 'Perfect Alignment',
    manifesto: 'Everyone has the same incentive: maximize usage. The trader wants what the builder wants.',
    patterns: [
      { regex: /oracle|acceptance|fee.*calculation/gi, type: 'oracle' },
      { regex: /burn.*notification|webhook.*burn/gi, type: 'notification' },
      { regex: /align|incentive/gi, type: 'concept' },
    ],
    expected_files: ['routes/oracle.js', 'services/holdex.js'],
    weight: 1.618, // φ - Important
  },

  open_source: {
    name: 'Open Source as Moat',
    manifesto: 'Everything is MIT licensed. Fork it. Copy it. Compete with us.',
    patterns: [
      { regex: /MIT|license|open.*source/gi, type: 'license' },
      { regex: /fork|public/gi, type: 'concept' },
    ],
    expected_files: ['LICENSE', 'README.md'],
    weight: 0.618, // φ⁻¹ - Supporting
  },

  anti_obscurantism: {
    name: 'Anti-Obscurantism',
    manifesto: 'No black box algorithms. Every metric signed. Every formula published.',
    patterns: [
      { regex: /transparent|public|open/gi, type: 'concept' },
      { regex: /formula|algorithm|calculation/gi, type: 'math' },
      { regex: /signed|verified|proof/gi, type: 'verification' },
    ],
    expected_files: ['docs/KSCORE.md', 'docs/INTEGRITY.md'],
    weight: 1.0, // 1 - Supporting
  },
};

// =============================================================================
// CODE ANALYSIS
// =============================================================================

function searchForPrinciple(basePath, principle) {
  const results = {
    files_found: [],
    total_matches: 0,
    by_type: {},
    samples: [],
  };

  const filesToSearch = [];

  // Walk directory
  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'repos-prod'].includes(entry.name)) {
            walkDir(fullPath);
          }
        } else if (entry.isFile() && /\.(js|ts|md|json)$/.test(entry.name)) {
          filesToSearch.push(fullPath);
        }
      }
    } catch (e) {
      // Permission denied, skip
    }
  }

  walkDir(basePath);

  // Search each file
  for (const filePath of filesToSearch) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(basePath, filePath);

      for (const pattern of principle.patterns) {
        const matches = content.match(pattern.regex) || [];
        if (matches.length > 0) {
          if (!results.files_found.includes(relativePath)) {
            results.files_found.push(relativePath);
          }

          if (!results.by_type[pattern.type]) {
            results.by_type[pattern.type] = 0;
          }
          results.by_type[pattern.type] += matches.length;
          results.total_matches += matches.length;

          // Capture samples
          if (results.samples.length < 5) {
            for (const match of matches.slice(0, 2)) {
              const idx = content.indexOf(match);
              const start = Math.max(0, idx - 30);
              const end = Math.min(content.length, idx + match.length + 50);
              const context = content.slice(start, end).replace(/\n/g, ' ').trim();
              results.samples.push({
                file: relativePath,
                match: match.slice(0, 30),
                context: context.slice(0, 100),
              });
            }
          }
        }
      }
    } catch (e) {
      // Skip unreadable files
    }
  }

  return results;
}

function checkExpectedFiles(basePath, expectedFiles) {
  const found = [];
  const missing = [];

  for (const file of expectedFiles) {
    // Check various paths
    const possiblePaths = [
      path.join(basePath, file),
      path.join(basePath, 'src', file),
    ];

    let exists = false;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        found.push(file);
        exists = true;
        break;
      }
    }
    if (!exists) {
      missing.push(file);
    }
  }

  return { found, missing };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain philosophy mapper');
  console.log('  Mapping manifesto principles to code');
  console.log('═══════════════════════════════════════════════════════════\n');

  const repos = [
    { name: 'HolDex', path: '/workspaces/HolDex' },
    { name: 'GASdf', path: '/workspaces/GASdf' },
  ];

  const results = {
    metadata: {
      generated: new Date().toISOString(),
      philosophy: "$asdfasdfa: Don't trust, verify - verify the code matches the manifesto",
    },
    principles: {},
    summary: {
      total_principles: Object.keys(PRINCIPLES).length,
      implemented: 0,
      partial: 0,
      missing: 0,
    },
    alignment_score: 0,
  };

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const [key, principle] of Object.entries(PRINCIPLES)) {
    console.log(`\n📜 ${principle.name}`);
    console.log(`   "${principle.manifesto.slice(0, 60)}..."`);

    const principleResult = {
      name: principle.name,
      manifesto_excerpt: principle.manifesto,
      weight: principle.weight,
      repos: {},
      status: 'unknown',
      score: 0,
    };

    let principleMatches = 0;
    let expectedFound = 0;
    let expectedTotal = 0;

    for (const repo of repos) {
      if (!fs.existsSync(repo.path)) continue;

      const searchResult = searchForPrinciple(repo.path, principle);
      const fileCheck = checkExpectedFiles(repo.path, principle.expected_files);

      principleResult.repos[repo.name] = {
        matches: searchResult.total_matches,
        files_with_matches: searchResult.files_found.length,
        by_type: searchResult.by_type,
        samples: searchResult.samples.slice(0, 3),
        expected_files: fileCheck,
      };

      principleMatches += searchResult.total_matches;
      expectedFound += fileCheck.found.length;
      expectedTotal += principle.expected_files.length;

      if (searchResult.total_matches > 0) {
        console.log(`   ✅ ${repo.name}: ${searchResult.total_matches} matches in ${searchResult.files_found.length} files`);
      } else {
        console.log(`   ⚠️  ${repo.name}: No matches found`);
      }
    }

    // Calculate principle score
    if (principleMatches > 10 && expectedFound > 0) {
      principleResult.status = 'implemented';
      principleResult.score = 1.0;
      results.summary.implemented++;
    } else if (principleMatches > 0) {
      principleResult.status = 'partial';
      principleResult.score = 0.5;
      results.summary.partial++;
    } else {
      principleResult.status = 'missing';
      principleResult.score = 0;
      results.summary.missing++;
    }

    totalWeightedScore += principleResult.score * principle.weight;
    totalWeight += principle.weight;

    results.principles[key] = principleResult;
  }

  // Calculate alignment score (0-100)
  results.alignment_score = Math.round((totalWeightedScore / totalWeight) * 100);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                      RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Alignment Score: ${results.alignment_score}/100`);
  console.log(`\n   Implemented: ${results.summary.implemented}`);
  console.log(`   Partial: ${results.summary.partial}`);
  console.log(`   Missing: ${results.summary.missing}`);

  // Write output
  const outputPath = path.join(__dirname, '../knowledge/philosophy/manifesto-mapping.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
