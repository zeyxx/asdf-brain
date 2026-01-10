#!/usr/bin/env node
/**
 * asdf-brain philosophy mapper
 *
 * Maps the 4 AXIOMS and their derivations to actual code implementations
 * Following $asdfasdfa: "Don't trust, verify" - verify the philosophy lives in code
 *
 * THE 4 AXIOMS:
 *   I.   φ (PHI)   - The ratio that governs all (1.618...)
 *   II.  BURN      - Economic singularity (100% burn, no extraction)
 *   III. VERIFY    - Cryptographic truth (don't trust, verify)
 *   IV.  CULTURE   - The unforkable moat (open source + cypherpunk + community)
 *
 * Everything else (K-Score, E-Score, CYNIC, PaRDeS, etc.) = DERIVATIONS
 *
 * See: knowledge/philosophy/AXIOMS.md for authoritative source
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// THE 4 AXIOMS
// =============================================================================

const AXIOMS = {
  phi: {
    name: 'φ (PHI)',
    essence: 'The ratio that governs all. 1.618033988749895...',
    manifesto: 'φ = 1.618... φ⁻¹ = 61.8%. φ⁻² = 38.2%. These ratios guide thresholds and weights.',
    patterns: [
      { regex: /1\.618|0\.618|phi|PHI/g, type: 'constant' },
      { regex: /61\.8|38\.2|76\.4|23\.6|golden.*ratio/gi, type: 'threshold' },
      { regex: /φ|Φ/g, type: 'symbol' },
      { regex: /geometric|cube.*root|cbrt|Math\.cbrt/gi, type: 'math' },
    ],
    expected_files: ['harmony.js', 'shared/harmony.js', 'lib/temporal.js'],
    weight: 2.618, // φ² - Foundation
  },

  burn: {
    name: 'BURN',
    essence: 'Economic singularity. All value converges and is destroyed.',
    manifesto: 'Every fee paid to interact with $asdfasdfa is burned. Not 38%. Not 50%. One hundred percent.',
    patterns: [
      { regex: /100\s*%.*burn|burn.*100\s*%/gi, type: 'explicit' },
      { regex: /burnTokens|BURN_ADDRESS|burn.*fee/gi, type: 'implementation' },
      { regex: /no.*treasury|no.*skim|no.*extraction/gi, type: 'anti-pattern' },
      { regex: /singularity|deflat|converge/gi, type: 'concept' },
    ],
    expected_files: ['services/burn.js', 'routes/space.js'],
    weight: 2.618, // φ² - Core
  },

  verify: {
    name: 'VERIFY',
    essence: 'Cryptographic truth. Don\'t trust, verify.',
    manifesto: 'Every K-Score is cryptographically signed. 8 categories. HMAC-SHA256. Verifiable by anyone.',
    patterns: [
      { regex: /hmac|sha256|signature|sign/gi, type: 'crypto' },
      { regex: /verify|verifiable|verification/gi, type: 'verification' },
      { regex: /integrity|tamper|chaos_nonce/gi, type: 'integrity' },
      { regex: /merkle|proof|anchor/gi, type: 'provenance' },
    ],
    expected_files: ['utils/signatures.js', 'tasks/integrityWatchdog.js', 'lib/merkle-proofs.js'],
    weight: 2.618, // φ² - Core
  },

  culture: {
    name: 'CULTURE',
    essence: 'The unforkable moat. Code can be copied, culture cannot.',
    manifesto: 'Everything is MIT licensed. Fork it. Copy it. Compete with us. Culture is a moat.',
    patterns: [
      { regex: /MIT|license|open.*source/gi, type: 'license' },
      { regex: /fork|public|community/gi, type: 'concept' },
      { regex: /cypherpunk|privacy|decentraliz/gi, type: 'values' },
      { regex: /no.*marketing|no.*vc|no.*presale/gi, type: 'anti-pattern' },
    ],
    expected_files: ['LICENSE', 'README.md', 'CONTRIBUTING.md'],
    weight: 1.618, // φ - Essential
  },
};

// =============================================================================
// DERIVATIONS (implementations of axioms)
// =============================================================================

const DERIVATIONS = {
  k_score: {
    name: 'K-Score Formula',
    derives_from: ['phi', 'verify'],
    why: 'Geometric mean (φ) + cryptographic signatures (verify)',
    manifesto: 'K = 100 × ∛(D × O × L). Diamond Hands, Organic Growth, Longevity.',
    patterns: [
      { regex: /k[_-]?score|kscore/gi, type: 'naming' },
      { regex: /diamond.*hands?|conviction/gi, type: 'D_factor' },
      { regex: /organic.*growth?|distribution|anti[_-]?sniper/gi, type: 'O_factor' },
      { regex: /longevity|survival|age/gi, type: 'L_factor' },
    ],
    expected_files: ['tasks/kScoreUpdater.js'],
    weight: 1.618,
  },

  e_score: {
    name: 'E-Score Formula',
    derives_from: ['phi', 'burn'],
    why: 'φ-weighted dimensions measuring contribution toward burns',
    manifesto: 'E = ∏(score_i^φ_weight)^(1/Σweights). 7 dimensions: HOLD, BURN, USE, BUILD, RUN, REFER, TIME.',
    patterns: [
      { regex: /e[_-]?score|escore/gi, type: 'naming' },
      { regex: /HOLD|BURN|USE|BUILD|RUN|REFER|TIME/g, type: 'dimensions' },
      { regex: /contributor|engagement/gi, type: 'concept' },
    ],
    expected_files: ['lib/contributors.js', 'shared/harmony.js'],
    weight: 1.618,
  },

  i_infra: {
    name: 'I-Infra Formula',
    derives_from: ['phi', 'verify'],
    why: 'φ-weighted infrastructure health with oracle verification',
    manifesto: 'I_infra = φ-weighted composite of uptime, response_time, error_rate.',
    patterns: [
      { regex: /i[_-]?infra|infra.*score/gi, type: 'naming' },
      { regex: /uptime|response.*time|error.*rate/gi, type: 'metrics' },
      { regex: /health|monitor|oracle/gi, type: 'concept' },
    ],
    expected_files: ['lib/i-infra-monitor.js'],
    weight: 1.0,
  },

  cynic: {
    name: 'CYNIC Self-Judgment',
    derives_from: ['phi', 'verify'],
    why: 'φ-constrained confidence (61.8% max) + self-verification',
    manifesto: 'CYNIC = φ qui se méfie de φ. Max confidence 61.8%, min doubt 38.2%.',
    patterns: [
      { regex: /cynic/gi, type: 'naming' },
      { regex: /self[_-]?judg|confidence|doubt/gi, type: 'concept' },
      { regex: /61\.8.*confidence|38\.2.*doubt/gi, type: 'threshold' },
    ],
    expected_files: ['lib/cynic.js', 'lib/self-judge.js'],
    weight: 1.618,
  },

  alignment: {
    name: 'Perfect Alignment',
    derives_from: ['burn'],
    why: 'Everyone benefits from burns → aligned incentives',
    manifesto: 'Everyone has the same incentive: maximize usage. The trader wants what the builder wants.',
    patterns: [
      { regex: /oracle|acceptance|fee.*calculation/gi, type: 'oracle' },
      { regex: /burn.*notification|webhook.*burn/gi, type: 'notification' },
      { regex: /align|incentive/gi, type: 'concept' },
    ],
    expected_files: ['routes/oracle.js', 'services/holdex.js'],
    weight: 1.618,
  },

  anti_obscurantism: {
    name: 'Anti-Obscurantism',
    derives_from: ['verify', 'culture'],
    why: 'Formulas published (culture) + verifiable (verify)',
    manifesto: 'No black box algorithms. Every metric signed. Every formula published.',
    patterns: [
      { regex: /transparent|public|open/gi, type: 'concept' },
      { regex: /formula|algorithm|calculation/gi, type: 'math' },
      { regex: /signed|verified|proof/gi, type: 'verification' },
    ],
    expected_files: ['docs/KSCORE.md', 'docs/INTEGRITY.md'],
    weight: 1.0,
  },

  pardes: {
    name: 'PaRDeS Interpretation',
    derives_from: ['phi', 'culture'],
    why: 'φ-weighted levels from Kabbalistic tradition',
    manifesto: '4 levels: P=Pshat (literal), R=Remez (patterns), D=Drash (intent), S=Sod (mystery).',
    patterns: [
      { regex: /pardes|pshat|remez|drash|sod/gi, type: 'naming' },
      { regex: /P.*R.*D.*S|interpretation.*level/gi, type: 'concept' },
    ],
    expected_files: ['lib/daat-levels.js'],
    weight: 0.618,
  },

  sefirot: {
    name: 'Sefirot Architecture',
    derives_from: ['culture'],
    why: 'Kabbalistic tree structure for ecosystem mapping',
    manifesto: 'Keter→Daat→Hod→Yesod→Malkhuth. Each node has its role.',
    patterns: [
      { regex: /sefirot|sefirah|keter|daat|hod|yesod|malkhuth/gi, type: 'naming' },
      { regex: /kabbala|tree.*life/gi, type: 'concept' },
    ],
    expected_files: ['knowledge/philosophy/singularity-analysis.json'],
    weight: 0.618,
  },
};

// Combined for backward compatibility
const PRINCIPLES = { ...AXIOMS, ...DERIVATIONS };

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
  console.log('  4 AXIOMS + DERIVATIONS → Code');
  console.log('═══════════════════════════════════════════════════════════\n');

  const repos = [
    { name: 'HolDex', path: '/workspaces/HolDex' },
    { name: 'GASdf', path: '/workspaces/GASdf' },
  ];

  const results = {
    metadata: {
      generated: new Date().toISOString(),
      philosophy: "$asdfasdfa: Don't trust, verify - verify the code matches the manifesto",
      structure: '4 AXIOMS (φ, BURN, VERIFY, CULTURE) + DERIVATIONS',
      authoritative_source: 'knowledge/philosophy/AXIOMS.md',
    },
    axioms: {},
    derivations: {},
    summary: {
      total_axioms: Object.keys(AXIOMS).length,
      total_derivations: Object.keys(DERIVATIONS).length,
      axioms_implemented: 0,
      axioms_partial: 0,
      axioms_missing: 0,
      derivations_implemented: 0,
      derivations_partial: 0,
      derivations_missing: 0,
    },
    alignment_score: 0,
  };

  let totalWeightedScore = 0;
  let totalWeight = 0;

  // Process AXIOMS first
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│                     THE 4 AXIOMS                            │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  for (const [key, axiom] of Object.entries(AXIOMS)) {
    console.log(`\n🔷 ${axiom.name}`);
    console.log(`   "${axiom.manifesto.slice(0, 60)}..."`);

    const axiomResult = {
      name: axiom.name,
      essence: axiom.essence,
      manifesto_excerpt: axiom.manifesto,
      weight: axiom.weight,
      repos: {},
      status: 'unknown',
      score: 0,
    };

    let axiomMatches = 0;
    let expectedFound = 0;

    for (const repo of repos) {
      if (!fs.existsSync(repo.path)) continue;

      const searchResult = searchForPrinciple(repo.path, axiom);
      const fileCheck = checkExpectedFiles(repo.path, axiom.expected_files);

      axiomResult.repos[repo.name] = {
        matches: searchResult.total_matches,
        files_with_matches: searchResult.files_found.length,
        by_type: searchResult.by_type,
        samples: searchResult.samples.slice(0, 3),
        expected_files: fileCheck,
      };

      axiomMatches += searchResult.total_matches;
      expectedFound += fileCheck.found.length;

      if (searchResult.total_matches > 0) {
        console.log(`   ✅ ${repo.name}: ${searchResult.total_matches} matches in ${searchResult.files_found.length} files`);
      } else {
        console.log(`   ⚠️  ${repo.name}: No matches found`);
      }
    }

    // Calculate axiom score
    if (axiomMatches > 10 && expectedFound > 0) {
      axiomResult.status = 'implemented';
      axiomResult.score = 1.0;
      results.summary.axioms_implemented++;
    } else if (axiomMatches > 0) {
      axiomResult.status = 'partial';
      axiomResult.score = 0.5;
      results.summary.axioms_partial++;
    } else {
      axiomResult.status = 'missing';
      axiomResult.score = 0;
      results.summary.axioms_missing++;
    }

    totalWeightedScore += axiomResult.score * axiom.weight;
    totalWeight += axiom.weight;

    results.axioms[key] = axiomResult;
  }

  // Process DERIVATIONS
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│                      DERIVATIONS                            │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  for (const [key, deriv] of Object.entries(DERIVATIONS)) {
    console.log(`\n📐 ${deriv.name}`);
    console.log(`   Derives from: ${deriv.derives_from.map(a => AXIOMS[a]?.name || a).join(' + ')}`);
    console.log(`   "${deriv.manifesto.slice(0, 50)}..."`);

    const derivResult = {
      name: deriv.name,
      derives_from: deriv.derives_from,
      why: deriv.why,
      manifesto_excerpt: deriv.manifesto,
      weight: deriv.weight,
      repos: {},
      status: 'unknown',
      score: 0,
    };

    let derivMatches = 0;
    let expectedFound = 0;

    for (const repo of repos) {
      if (!fs.existsSync(repo.path)) continue;

      const searchResult = searchForPrinciple(repo.path, deriv);
      const fileCheck = checkExpectedFiles(repo.path, deriv.expected_files);

      derivResult.repos[repo.name] = {
        matches: searchResult.total_matches,
        files_with_matches: searchResult.files_found.length,
        by_type: searchResult.by_type,
        samples: searchResult.samples.slice(0, 3),
        expected_files: fileCheck,
      };

      derivMatches += searchResult.total_matches;
      expectedFound += fileCheck.found.length;

      if (searchResult.total_matches > 0) {
        console.log(`   ✅ ${repo.name}: ${searchResult.total_matches} matches in ${searchResult.files_found.length} files`);
      } else {
        console.log(`   ⚠️  ${repo.name}: No matches found`);
      }
    }

    // Calculate derivation score
    if (derivMatches > 10 && expectedFound > 0) {
      derivResult.status = 'implemented';
      derivResult.score = 1.0;
      results.summary.derivations_implemented++;
    } else if (derivMatches > 0) {
      derivResult.status = 'partial';
      derivResult.score = 0.5;
      results.summary.derivations_partial++;
    } else {
      derivResult.status = 'missing';
      derivResult.score = 0;
      results.summary.derivations_missing++;
    }

    totalWeightedScore += derivResult.score * deriv.weight;
    totalWeight += deriv.weight;

    results.derivations[key] = derivResult;
  }

  // Calculate alignment score (0-100)
  results.alignment_score = Math.round((totalWeightedScore / totalWeight) * 100);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                      RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Alignment Score: ${results.alignment_score}/100`);
  console.log(`\n   AXIOMS (4 foundational):`);
  console.log(`   ✅ Implemented: ${results.summary.axioms_implemented}`);
  console.log(`   ⚠️  Partial: ${results.summary.axioms_partial}`);
  console.log(`   ❌ Missing: ${results.summary.axioms_missing}`);
  console.log(`\n   DERIVATIONS (${results.summary.total_derivations} implementations):`);
  console.log(`   ✅ Implemented: ${results.summary.derivations_implemented}`);
  console.log(`   ⚠️  Partial: ${results.summary.derivations_partial}`);
  console.log(`   ❌ Missing: ${results.summary.derivations_missing}`);

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
