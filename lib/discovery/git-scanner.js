/**
 * git-scanner.js - CYNIC Auto-Discovery System
 *
 * Philosophy: "Don't be told, DISCOVER. Don't assume, VERIFY."
 *
 * This module enables CYNIC to autonomously:
 * - Scan git repositories for patterns
 * - Extract dependencies and their relationships
 * - Discover code patterns and architectural decisions
 * - Find contributors beyond commit authors
 * - Build knowledge graph from discovered data
 *
 * All discoveries are judged by CYNIC before storage.
 * φ guides the discovery process: explore 61.8%, verify 38.2%
 *
 * SECURITY: Uses execFileSync (not exec) to prevent shell injection.
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// φ constants - Import from Single Source of Truth (FIXED 2026-01-13)
const { PHI, PHI_INV, PHI_INV_2 } = require('../cynic/axioms/constants');

// Configuration
const WORKSPACES_ROOT = '/workspaces';
const KNOWLEDGE_ROOT = path.join(__dirname, '..', '..', 'knowledge');
const DISCOVERED_DIR = path.join(KNOWLEDGE_ROOT, 'discovered');

// Import existing modules (fallback gracefully if not available)
let repoDiscovery, gitIntelligence, SelfJudge;
try {
  repoDiscovery = require('../repo-discovery');
} catch (e) { repoDiscovery = null; }
try {
  gitIntelligence = require('../git-intelligence');
} catch (e) { gitIntelligence = null; }
try {
  const cynic = require('../cynic/self-judge');
  SelfJudge = cynic.SelfJudge;
} catch (e) { SelfJudge = null; }

// =============================================================================
// DISCOVERY CONFIGURATION
// =============================================================================

const SCAN_CONFIG = {
  // File patterns to analyze
  patterns: {
    code: ['*.js', '*.ts', '*.py', '*.go', '*.rs', '*.java', '*.sol'],
    config: ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml'],
    docs: ['README.md', 'CLAUDE.md', 'ARCHITECTURE.md', '*.md'],
    ci: ['.github/workflows/*.yml', '.gitlab-ci.yml', 'Dockerfile', 'docker-compose.yml']
  },
  // Max files to scan per category (φ-based limits)
  limits: {
    filesPerRepo: Math.round(100 * PHI),       // ~162 files
    linesPerFile: Math.round(500 * PHI),       // ~809 lines
    patternsToExtract: Math.round(20 * PHI),   // ~32 patterns
    dependenciesToTrack: Math.round(50 * PHI)  // ~81 dependencies
  },
  // Ignore patterns
  ignore: [
    'node_modules', '.git', 'dist', 'build', '__pycache__',
    '.next', '.nuxt', 'coverage', '.nyc_output', 'vendor'
  ]
};

// =============================================================================
// PATTERN EXTRACTION
// =============================================================================

/**
 * Extract code patterns from a file
 */
function extractCodePatterns(content, filePath) {
  const patterns = [];
  const ext = path.extname(filePath);

  // JavaScript/TypeScript patterns
  if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
    // Export patterns
    const exports = content.match(/export\s+(default\s+)?(class|function|const|let|var)\s+(\w+)/g) || [];
    exports.forEach(e => patterns.push({ type: 'export', value: e, file: filePath }));

    // Import patterns
    const imports = content.match(/import\s+.*?from\s+['"](.+?)['"]/g) || [];
    imports.forEach(i => patterns.push({ type: 'import', value: i, file: filePath }));

    // Class definitions
    const classes = content.match(/class\s+(\w+)(\s+extends\s+\w+)?/g) || [];
    classes.forEach(c => patterns.push({ type: 'class', value: c, file: filePath }));

    // Async patterns
    const asyncFns = content.match(/async\s+(function\s+)?(\w+)/g) || [];
    asyncFns.forEach(a => patterns.push({ type: 'async', value: a, file: filePath }));

    // φ references (ecosystem signature)
    const phiRefs = content.match(/PHI|phi|φ|1\.618|0\.618|0\.382/g) || [];
    if (phiRefs.length > 0) {
      patterns.push({ type: 'phi_reference', value: `${phiRefs.length} φ references`, file: filePath });
    }
  }

  // Python patterns
  if (ext === '.py') {
    const classes = content.match(/class\s+(\w+)\s*(\([^)]*\))?:/g) || [];
    classes.forEach(c => patterns.push({ type: 'class', value: c, file: filePath }));

    const defs = content.match(/def\s+(\w+)\s*\(/g) || [];
    defs.forEach(d => patterns.push({ type: 'function', value: d, file: filePath }));

    const imports = content.match(/^(from\s+\S+\s+)?import\s+.+$/gm) || [];
    imports.forEach(i => patterns.push({ type: 'import', value: i.trim(), file: filePath }));
  }

  // Solidity patterns
  if (ext === '.sol') {
    const contracts = content.match(/contract\s+(\w+)(\s+is\s+[^{]+)?/g) || [];
    contracts.forEach(c => patterns.push({ type: 'contract', value: c, file: filePath }));

    const functions = content.match(/function\s+(\w+)\s*\([^)]*\)\s*(public|external|internal|private)/g) || [];
    functions.forEach(f => patterns.push({ type: 'function', value: f, file: filePath }));
  }

  return patterns;
}

/**
 * Extract architectural patterns from file structure
 */
function extractArchitecturalPatterns(files) {
  const patterns = [];
  const dirs = new Set();

  files.forEach(f => {
    const parts = f.split('/');
    parts.slice(0, -1).forEach((_, i) => dirs.add(parts.slice(0, i + 1).join('/')));
  });

  // Common architectural patterns
  const archPatterns = {
    'lib/': 'library-pattern',
    'src/': 'src-pattern',
    'src/components/': 'component-architecture',
    'src/hooks/': 'hooks-architecture',
    'src/services/': 'service-layer',
    'src/utils/': 'utility-layer',
    'api/': 'api-layer',
    'routes/': 'route-based',
    'controllers/': 'mvc-pattern',
    'models/': 'model-layer',
    'tests/': 'test-coverage',
    '__tests__/': 'jest-testing',
    'knowledge/': 'knowledge-graph',
    'anchors/': 'provenance-system'
  };

  for (const [pattern, name] of Object.entries(archPatterns)) {
    const matching = [...dirs].filter(d => d.includes(pattern.replace('/', '')));
    if (matching.length > 0) {
      patterns.push({
        type: 'architecture',
        value: name,
        evidence: matching.slice(0, 3)
      });
    }
  }

  return patterns;
}

// =============================================================================
// DEPENDENCY PARSING
// =============================================================================

/**
 * Parse package.json dependencies
 */
function parsePackageJson(content) {
  try {
    const pkg = JSON.parse(content);
    const deps = [];

    // Regular dependencies
    for (const [name, version] of Object.entries(pkg.dependencies || {})) {
      deps.push({ name, version, type: 'production', ecosystem: 'npm' });
    }

    // Dev dependencies
    for (const [name, version] of Object.entries(pkg.devDependencies || {})) {
      deps.push({ name, version, type: 'development', ecosystem: 'npm' });
    }

    // Peer dependencies
    for (const [name, version] of Object.entries(pkg.peerDependencies || {})) {
      deps.push({ name, version, type: 'peer', ecosystem: 'npm' });
    }

    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      dependencies: deps,
      scripts: Object.keys(pkg.scripts || {})
    };
  } catch (e) {
    return null;
  }
}

/**
 * Parse requirements.txt
 */
function parseRequirements(content) {
  const deps = [];
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

  for (const line of lines) {
    const match = line.match(/^([a-zA-Z0-9_-]+)([><=!~]+)?(.+)?$/);
    if (match) {
      deps.push({
        name: match[1],
        version: match[3] || '*',
        constraint: match[2] || '==',
        type: 'production',
        ecosystem: 'pip'
      });
    }
  }

  return { dependencies: deps };
}

/**
 * Parse Cargo.toml
 */
function parseCargoToml(content) {
  const deps = [];
  const lines = content.split('\n');
  let inDeps = false;
  let depType = 'production';

  for (const line of lines) {
    if (line.match(/^\[dependencies\]/)) {
      inDeps = true;
      depType = 'production';
    } else if (line.match(/^\[dev-dependencies\]/)) {
      inDeps = true;
      depType = 'development';
    } else if (line.match(/^\[/)) {
      inDeps = false;
    } else if (inDeps) {
      const match = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*"?([^"]+)"?/);
      if (match) {
        deps.push({
          name: match[1],
          version: match[2],
          type: depType,
          ecosystem: 'cargo'
        });
      }
    }
  }

  return { dependencies: deps };
}

// =============================================================================
// CONTRIBUTOR DISCOVERY
// =============================================================================

/**
 * Discover contributors from git history
 */
function discoverContributors(repoPath) {
  const contributors = new Map();

  // Get all authors from git log (using execFileSync - safe from injection)
  const authorLog = execGit(['log', '--format=%aN|%aE', '--all'], repoPath);
  if (authorLog) {
    for (const line of authorLog.split('\n').filter(Boolean)) {
      const [name, email] = line.split('|');
      if (!contributors.has(email)) {
        contributors.set(email, {
          name,
          email,
          commits: 0,
          firstSeen: null,
          lastSeen: null
        });
      }
      contributors.get(email).commits++;
    }
  }

  // Get first and last commit dates per author
  for (const [email, data] of contributors) {
    const firstCommit = execGit(['log', '--author=' + email, '--format=%aI', '--reverse', '-1'], repoPath);
    const lastCommit = execGit(['log', '--author=' + email, '--format=%aI', '-1'], repoPath);

    if (firstCommit) data.firstSeen = firstCommit;
    if (lastCommit) data.lastSeen = lastCommit;
  }

  // Convert to array and sort by commits
  return [...contributors.values()]
    .sort((a, b) => b.commits - a.commits)
    .map(c => ({
      ...c,
      // Hash email for privacy
      emailHash: hashString(c.email),
      email: undefined  // Remove raw email
    }));
}

/**
 * Discover co-author relationships
 */
function discoverCoAuthors(repoPath) {
  const coAuthors = [];

  const log = execGit(['log', '--format=%b', '-100'], repoPath);
  if (log) {
    const coAuthorPattern = /Co-[Aa]uthored-[Bb]y:\s*(.+?)\s*<(.+?)>/g;
    let match;
    while ((match = coAuthorPattern.exec(log)) !== null) {
      coAuthors.push({
        name: match[1].trim(),
        emailHash: hashString(match[2].trim())
      });
    }
  }

  // Deduplicate and count
  const counts = new Map();
  for (const ca of coAuthors) {
    const key = ca.emailHash;
    if (!counts.has(key)) {
      counts.set(key, { ...ca, count: 0 });
    }
    counts.get(key).count++;
  }

  return [...counts.values()].sort((a, b) => b.count - a.count);
}

// =============================================================================
// FULL REPOSITORY SCAN
// =============================================================================

/**
 * Scan a single repository
 */
function scanRepository(repoPath, repoName) {
  const discovery = {
    name: repoName,
    path: repoPath,
    scannedAt: new Date().toISOString(),
    patterns: [],
    dependencies: [],
    contributors: [],
    coAuthors: [],
    architecture: [],
    files: {
      total: 0,
      byType: {}
    }
  };

  // Get all tracked files
  const files = execGit(['ls-files'], repoPath);
  if (!files) return discovery;

  const fileList = files.split('\n').filter(Boolean);
  discovery.files.total = fileList.length;

  // Count files by extension
  for (const file of fileList) {
    const ext = path.extname(file) || 'no-ext';
    discovery.files.byType[ext] = (discovery.files.byType[ext] || 0) + 1;
  }

  // Extract architectural patterns
  discovery.architecture = extractArchitecturalPatterns(fileList);

  // Scan code files for patterns (limited by φ)
  const codeFiles = fileList.filter(f =>
    SCAN_CONFIG.patterns.code.some(p => f.endsWith(p.replace('*', '')))
  ).slice(0, SCAN_CONFIG.limits.filesPerRepo);

  for (const file of codeFiles) {
    try {
      const fullPath = path.join(repoPath, file);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      // Skip files that are too large
      if (lines.length > SCAN_CONFIG.limits.linesPerFile) continue;

      const patterns = extractCodePatterns(content, file);
      discovery.patterns.push(...patterns);
    } catch (e) {
      // Skip files that can't be read
    }
  }

  // Parse dependency files
  for (const file of fileList) {
    try {
      const fullPath = path.join(repoPath, file);
      let deps = null;

      if (file === 'package.json') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        deps = parsePackageJson(content);
      } else if (file === 'requirements.txt') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        deps = parseRequirements(content);
      } else if (file === 'Cargo.toml') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        deps = parseCargoToml(content);
      }

      if (deps?.dependencies) {
        discovery.dependencies.push(...deps.dependencies.slice(0, SCAN_CONFIG.limits.dependenciesToTrack));
      }
    } catch (e) {
      // Skip files that can't be parsed
    }
  }

  // Discover contributors
  discovery.contributors = discoverContributors(repoPath);
  discovery.coAuthors = discoverCoAuthors(repoPath);

  // Limit patterns to configured max
  discovery.patterns = discovery.patterns.slice(0, SCAN_CONFIG.limits.patternsToExtract);

  return discovery;
}

/**
 * Scan all repositories in workspaces
 */
function scanAllRepositories() {
  const discoveries = [];

  try {
    const entries = fs.readdirSync(WORKSPACES_ROOT, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SCAN_CONFIG.ignore.includes(entry.name)) continue;

      const repoPath = path.join(WORKSPACES_ROOT, entry.name);
      const gitPath = path.join(repoPath, '.git');

      if (fs.existsSync(gitPath)) {
        const discovery = scanRepository(repoPath, entry.name);
        discoveries.push(discovery);
      }
    }
  } catch (e) {
    console.error('Error scanning repositories:', e.message);
  }

  return discoveries;
}

// =============================================================================
// CYNIC INTEGRATION
// =============================================================================

/**
 * Judge discoveries with CYNIC before storing
 */
async function judgeDiscoveries(discoveries) {
  if (!SelfJudge) {
    // CYNIC not available, return discoveries as-is
    return discoveries.map(d => ({ ...d, cynic: { available: false } }));
  }

  const judge = new SelfJudge();
  const judgedDiscoveries = [];

  for (const discovery of discoveries) {
    // Judge each discovery
    const judgment = await judge.judge({
      type: 'auto_discovery',
      source: discovery.path,
      content: {
        patterns: discovery.patterns.length,
        dependencies: discovery.dependencies.length,
        contributors: discovery.contributors.length,
        architecture: discovery.architecture.length
      }
    }, {
      project: discovery.name,
      operation: 'git_scan'
    });

    judgedDiscoveries.push({
      ...discovery,
      cynic: {
        available: true,
        score: judgment.globalScore,
        verdict: judgment.verdict,
        confidence: judgment.confidence
      }
    });
  }

  return judgedDiscoveries;
}

// =============================================================================
// PERSISTENCE
// =============================================================================

/**
 * Save discoveries to knowledge base
 */
function saveDiscoveries(discoveries) {
  try {
    // Ensure directory exists
    if (!fs.existsSync(DISCOVERED_DIR)) {
      fs.mkdirSync(DISCOVERED_DIR, { recursive: true });
    }

    // Save individual repo discoveries
    for (const discovery of discoveries) {
      const filename = `${discovery.name.toLowerCase()}.json`;
      const filepath = path.join(DISCOVERED_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(discovery, null, 2));
    }

    // Save summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalRepos: discoveries.length,
      totalPatterns: discoveries.reduce((sum, d) => sum + d.patterns.length, 0),
      totalDependencies: discoveries.reduce((sum, d) => sum + d.dependencies.length, 0),
      totalContributors: discoveries.reduce((sum, d) => sum + d.contributors.length, 0),
      repos: discoveries.map(d => ({
        name: d.name,
        patterns: d.patterns.length,
        dependencies: d.dependencies.length,
        contributors: d.contributors.length,
        cynic: d.cynic
      }))
    };

    fs.writeFileSync(
      path.join(DISCOVERED_DIR, '_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    return summary;
  } catch (e) {
    console.error('Error saving discoveries:', e.message);
    return null;
  }
}

/**
 * Load previous discoveries
 */
function loadDiscoveries() {
  try {
    const summaryPath = path.join(DISCOVERED_DIR, '_summary.json');
    if (fs.existsSync(summaryPath)) {
      return JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

// =============================================================================
// MAIN SCAN FUNCTION
// =============================================================================

/**
 * Full ecosystem scan with CYNIC judgment
 */
async function fullScan(options = {}) {
  const { judge = true, save = true, repos = null } = options;

  console.log('🔍 Starting CYNIC auto-discovery scan...');
  console.log(`   φ-limits: ${SCAN_CONFIG.limits.filesPerRepo} files, ${SCAN_CONFIG.limits.patternsToExtract} patterns`);

  // Scan repositories
  let discoveries;
  if (repos) {
    discoveries = repos.map(r => {
      const repoPath = path.join(WORKSPACES_ROOT, r);
      return scanRepository(repoPath, r);
    });
  } else {
    discoveries = scanAllRepositories();
  }

  console.log(`   Found ${discoveries.length} repositories`);

  // Judge with CYNIC
  if (judge) {
    console.log('   Judging discoveries with CYNIC...');
    discoveries = await judgeDiscoveries(discoveries);
  }

  // Save to knowledge base
  let summary = null;
  if (save) {
    console.log('   Saving to knowledge base...');
    summary = saveDiscoveries(discoveries);
  }

  // Report
  console.log('\n📊 Discovery Summary:');
  for (const d of discoveries) {
    const cynicStatus = d.cynic?.available
      ? `[CYNIC: ${d.cynic.score?.toFixed(1) || 'N/A'}]`
      : '[CYNIC: unavailable]';
    console.log(`   ${d.name}: ${d.patterns.length} patterns, ${d.dependencies.length} deps, ${d.contributors.length} contributors ${cynicStatus}`);
  }

  return {
    discoveries,
    summary,
    timestamp: new Date().toISOString()
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Execute git command safely using execFileSync (no shell injection)
 */
function execGit(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024  // 10MB buffer for large repos
    }).trim();
  } catch (e) {
    return null;
  }
}

function hashString(str) {
  // Simple hash for privacy (not cryptographic)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main functions
  fullScan,
  scanRepository,
  scanAllRepositories,

  // Pattern extraction
  extractCodePatterns,
  extractArchitecturalPatterns,

  // Dependency parsing
  parsePackageJson,
  parseRequirements,
  parseCargoToml,

  // Contributor discovery
  discoverContributors,
  discoverCoAuthors,

  // CYNIC integration
  judgeDiscoveries,

  // Persistence
  saveDiscoveries,
  loadDiscoveries,

  // Configuration
  SCAN_CONFIG,
  DISCOVERED_DIR
};

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  fullScan().then(result => {
    console.log('\n✅ Scan complete!');
    console.log(`   Results saved to: ${DISCOVERED_DIR}`);
  }).catch(err => {
    console.error('Scan failed:', err);
    process.exit(1);
  });
}
