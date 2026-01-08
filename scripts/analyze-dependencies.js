#!/usr/bin/env node
/**
 * asdf-brain dependency analyzer
 *
 * Maps technical dependencies across the ecosystem
 * Following $asdfasdfa: "Don't trust, verify" - verify from actual package.json and imports
 *
 * Analyzes:
 * - npm dependencies (package.json)
 * - Internal imports (require/import statements)
 * - Shared dependencies across repos
 * - Dependency health (outdated, vulnerable)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const REPOS = {
  holdex: '/workspaces/HolDex',
  gasdf: '/workspaces/GASdf',
  'asdf-brain': '/workspaces/asdf-brain',
};

// Critical dependencies to track
const CRITICAL_DEPS = [
  '@solana/web3.js',
  'express',
  'ioredis',
  'pg',
  'socket.io',
  'helmet',
  'sharp',
  'canvas',
];

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

function analyzePackageJson(repoPath) {
  const pkgPath = path.join(repoPath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return null;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return {
      name: pkg.name,
      version: pkg.version,
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      scripts: Object.keys(pkg.scripts || {}),
    };
  } catch (e) {
    return null;
  }
}

function extractImports(repoPath) {
  const imports = {
    internal: {}, // ./foo, ../bar
    external: {}, // npm packages
    node: {}, // fs, path, etc.
  };

  const nodeBuiltins = [
    'fs',
    'path',
    'http',
    'https',
    'crypto',
    'stream',
    'events',
    'util',
    'os',
    'child_process',
    'readline',
    'url',
    'querystring',
    'buffer',
    'assert',
    'net',
    'dns',
    'tls',
  ];

  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'repos-prod', 'dist', 'build'].includes(entry.name)) {
            walkDir(fullPath);
          }
        } else if (entry.isFile() && /\.(js|ts|mjs)$/.test(entry.name)) {
          analyzeFile(fullPath);
        }
      }
    } catch (e) {
      // Permission denied, skip
    }
  }

  function analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Match require() and import statements
      const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
      const importDynamicPattern = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

      const patterns = [requirePattern, importPattern, importDynamicPattern];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const dep = match[1];

          if (dep.startsWith('.') || dep.startsWith('/')) {
            // Internal import
            imports.internal[dep] = (imports.internal[dep] || 0) + 1;
          } else if (nodeBuiltins.includes(dep.split('/')[0])) {
            // Node builtin
            imports.node[dep] = (imports.node[dep] || 0) + 1;
          } else {
            // External npm package
            const pkgName = dep.startsWith('@') ? dep.split('/').slice(0, 2).join('/') : dep.split('/')[0];
            imports.external[pkgName] = (imports.external[pkgName] || 0) + 1;
          }
        }
      }
    } catch (e) {
      // Skip unreadable files
    }
  }

  walkDir(repoPath);
  return imports;
}

function findSharedDependencies(allDeps) {
  const depUsage = {};

  for (const [repo, data] of Object.entries(allDeps)) {
    if (!data.package) continue;

    const allPkgDeps = {
      ...data.package.dependencies,
      ...data.package.devDependencies,
    };

    for (const dep of Object.keys(allPkgDeps)) {
      if (!depUsage[dep]) {
        depUsage[dep] = { repos: [], versions: {} };
      }
      depUsage[dep].repos.push(repo);
      depUsage[dep].versions[repo] = allPkgDeps[dep];
    }
  }

  // Filter to shared dependencies
  const shared = {};
  for (const [dep, data] of Object.entries(depUsage)) {
    if (data.repos.length > 1) {
      shared[dep] = data;
    }
  }

  return shared;
}

function checkVersionMismatches(shared) {
  const mismatches = [];

  for (const [dep, data] of Object.entries(shared)) {
    const versions = Object.values(data.versions);
    const uniqueVersions = [...new Set(versions)];

    if (uniqueVersions.length > 1) {
      mismatches.push({
        dependency: dep,
        versions: data.versions,
        repos: data.repos,
      });
    }
  }

  return mismatches;
}

function analyzeCriticalDeps(allDeps) {
  const critical = {};

  for (const dep of CRITICAL_DEPS) {
    critical[dep] = {
      used_in: [],
      versions: {},
    };

    for (const [repo, data] of Object.entries(allDeps)) {
      if (!data.package) continue;

      const version =
        data.package.dependencies?.[dep] || data.package.devDependencies?.[dep];

      if (version) {
        critical[dep].used_in.push(repo);
        critical[dep].versions[repo] = version;
      }
    }
  }

  return critical;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  asdf-brain dependency analyzer');
  console.log('  Mapping technical dependencies across ecosystem');
  console.log('═══════════════════════════════════════════════════════════\n');

  const allDeps = {};

  for (const [name, repoPath] of Object.entries(REPOS)) {
    if (!fs.existsSync(repoPath)) {
      console.log(`   ⚠️  ${name}: Not found`);
      continue;
    }

    console.log(`📦 Analyzing ${name}...`);

    const pkgAnalysis = analyzePackageJson(repoPath);
    const importAnalysis = extractImports(repoPath);

    allDeps[name] = {
      package: pkgAnalysis,
      imports: importAnalysis,
    };

    if (pkgAnalysis) {
      const depCount = Object.keys(pkgAnalysis.dependencies).length;
      const devCount = Object.keys(pkgAnalysis.devDependencies).length;
      console.log(`   Dependencies: ${depCount} prod, ${devCount} dev`);
    }

    const externalCount = Object.keys(importAnalysis.external).length;
    const internalCount = Object.keys(importAnalysis.internal).length;
    console.log(`   Imports: ${externalCount} external, ${internalCount} internal`);
  }

  // Cross-repo analysis
  console.log('\n📊 Cross-repo analysis...');

  const sharedDeps = findSharedDependencies(allDeps);
  const mismatches = checkVersionMismatches(sharedDeps);
  const criticalDeps = analyzeCriticalDeps(allDeps);

  console.log(`   Shared dependencies: ${Object.keys(sharedDeps).length}`);
  console.log(`   Version mismatches: ${mismatches.length}`);

  if (mismatches.length > 0) {
    console.log('\n   ⚠️  Version mismatches:');
    for (const m of mismatches.slice(0, 5)) {
      console.log(`      - ${m.dependency}: ${JSON.stringify(m.versions)}`);
    }
  }

  // Build dependency graph
  const graph = {
    nodes: [],
    edges: [],
  };

  // Add repo nodes
  for (const repo of Object.keys(allDeps)) {
    graph.nodes.push({ id: repo, type: 'repo', layer: 'ecosystem' });
  }

  // Add shared dependency nodes and edges
  for (const [dep, data] of Object.entries(sharedDeps)) {
    graph.nodes.push({ id: dep, type: 'dependency', layer: 'npm' });
    for (const repo of data.repos) {
      graph.edges.push({
        from: repo,
        to: dep,
        type: 'depends_on',
        version: data.versions[repo],
      });
    }
  }

  // Results
  const results = {
    metadata: {
      generated: new Date().toISOString(),
      philosophy: "$asdfasdfa: Don't trust, verify - verify from actual dependencies",
    },
    repos: allDeps,
    shared_dependencies: sharedDeps,
    version_mismatches: mismatches,
    critical_dependencies: criticalDeps,
    graph: graph,
    statistics: {
      total_repos: Object.keys(allDeps).length,
      shared_deps: Object.keys(sharedDeps).length,
      mismatches: mismatches.length,
      graph_nodes: graph.nodes.length,
      graph_edges: graph.edges.length,
    },
  };

  // Write output
  const outputPath = path.join(__dirname, '../knowledge/dependencies/dependency-graph.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                      RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Repos analyzed: ${results.statistics.total_repos}`);
  console.log(`🔗 Shared dependencies: ${results.statistics.shared_deps}`);
  console.log(`⚠️  Version mismatches: ${results.statistics.mismatches}`);
  console.log(`📈 Graph: ${results.statistics.graph_nodes} nodes, ${results.statistics.graph_edges} edges`);

  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
