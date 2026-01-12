/**
 * CYNIC Dimensions Dashboard - Real-Time 25D Visualization
 *
 * "φ qui se voit dans toutes ses dimensions"
 *
 * Visualizes all 25 CYNIC dimensions in real-time:
 * - 8 PRIMARY (φ² weight) - Core judgments across 4 worlds
 * - 5 SECONDARY (φ weight) - Human-serving operations
 * - 3 META (1.0 weight) - Self-awareness metrics
 * - 8 HUMAN_LLM (φ weight) - Autonomization dimensions
 * - 1 DISCOVERY (φ³ weight) - THE_INNOMMABLE frontier
 *
 * @philosophy "Vision globale en temps réel - Enable, don't automate"
 * @module cynic/dashboard-dimensions
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// PHI CONSTANTS
// =============================================================================

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const PHI_INV_2 = PHI_INV * PHI_INV;
const PHI_SQ = PHI * PHI;
const PHI_CUBE = PHI * PHI * PHI;

// =============================================================================
// DIMENSION CONFIGURATION
// =============================================================================

const DIMENSION_CONFIG = {
  PRIMARY: {
    color: '#d4a017', // Gold
    weight: PHI_SQ,
    icon: '⭐',
    dimensions: [
      { name: 'HARMONY', world: 'ATZILUT', axiom: 'PHI' },
      { name: 'COHERENCE', world: 'ATZILUT', axiom: 'PHI' },
      { name: 'TRUTH', world: 'BERIAH', axiom: 'VERIFY' },
      { name: 'INTEGRITY', world: 'BERIAH', axiom: 'VERIFY' },
      { name: 'ETHICS', world: 'YETZIRAH', axiom: 'CULTURE' },
      { name: 'OPTIMISM', world: 'YETZIRAH', axiom: 'CULTURE' },
      { name: 'ALIGNMENT', world: 'ASSIAH', axiom: 'BURN' },
      { name: 'PROGRESS', world: 'ASSIAH', axiom: 'BURN' },
    ],
  },
  SECONDARY: {
    color: '#58a6ff', // Blue
    weight: PHI,
    icon: '🛡️',
    dimensions: [
      { name: 'SECURE', purpose: 'Protect without imprisoning' },
      { name: 'PRIVATE', purpose: 'Respect without hiding' },
      { name: 'SCALE', purpose: 'Grow without dominating' },
      { name: 'SIMPLIFY', purpose: 'Clarify without reducing' },
      { name: 'ENABLE', purpose: 'Enable, don\'t automate' },
    ],
  },
  META: {
    color: '#a371f7', // Purple
    weight: 1.0,
    icon: '🧠',
    dimensions: [
      { name: 'SELF_AWARENESS', question: 'Je sais ce que je ne sais pas' },
      { name: 'LEARNING_RATE', question: 'J\'apprends de mes erreurs' },
      { name: 'SINGULARITY_DISTANCE', question: 'Je mesure ma distance au but' },
    ],
  },
  HUMAN_LLM: {
    color: '#3fb950', // Green
    weight: PHI,
    icon: '🤝',
    dimensions: [
      { name: 'MEMORY', axiom: 'PHI' },
      { name: 'TEACHING', axiom: 'PHI' },
      { name: 'INTENT', axiom: 'VERIFY' },
      { name: 'TRUST', axiom: 'VERIFY' },
      { name: 'PROACTIVITY', axiom: 'CULTURE' },
      { name: 'COMPLEMENTARITY', axiom: 'CULTURE' },
      { name: 'DELEGATION', axiom: 'BURN' },
      { name: 'BOUNDARIES', axiom: 'BURN' },
    ],
  },
  DISCOVERY: {
    color: '#f85149', // Red
    weight: PHI_CUBE,
    icon: '🔮',
    dimensions: [
      { name: 'THE_INNOMMABLE', description: 'φ qui doute de φ' },
    ],
  },
};

// =============================================================================
// CSS STYLES
// =============================================================================

function generateStyles() {
  return `
<style>
  :root {
    --phi: 1.618;
    --phi-inv: 0.618;
    --phi-inv-2: 0.382;

    --bg-primary: #0d1117;
    --bg-secondary: #161b22;
    --bg-tertiary: #21262d;
    --text-primary: #f0f6fc;
    --text-secondary: #8b949e;
    --text-muted: #484f58;

    --accent-gold: #d4a017;
    --accent-phi: #c9a227;
    --success: #3fb950;
    --warning: #d29922;
    --error: #f85149;
    --info: #58a6ff;
    --purple: #a371f7;

    --border-color: #30363d;
    --shadow: 0 8px 24px rgba(0,0,0,0.4);
    --radius: 8px;
    --radius-lg: 12px;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.618;
    min-height: 100vh;
    padding: 24px;
  }

  .dashboard {
    max-width: 1600px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 32px;
    padding: 24px;
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
  }

  .header h1 {
    font-size: 2rem;
    color: var(--accent-gold);
    margin-bottom: 8px;
  }

  .header .subtitle { color: var(--text-secondary); font-style: italic; }
  .header .timestamp { color: var(--text-muted); font-size: 0.875rem; margin-top: 8px; }

  .global-score {
    display: flex;
    justify-content: center;
    gap: 48px;
    margin: 24px 0;
  }

  .global-score .metric {
    text-align: center;
  }

  .global-score .metric .value {
    font-size: 3rem;
    font-weight: 700;
    line-height: 1;
  }

  .global-score .metric .label {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-top: 4px;
  }

  /* Category Sections */
  .category {
    margin-bottom: 32px;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    overflow: hidden;
  }

  .category-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .category-header h2 {
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .category-header .weight {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 12px;
    background: rgba(255,255,255,0.1);
    color: var(--text-secondary);
  }

  .category-header .avg {
    font-size: 1.2rem;
    font-weight: 600;
  }

  /* Dimension Grid */
  .dimensions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    padding: 16px;
  }

  .dimension {
    background: var(--bg-tertiary);
    border-radius: var(--radius);
    padding: 12px;
    position: relative;
    overflow: hidden;
  }

  .dimension .bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    border-radius: 0 0 var(--radius) var(--radius);
    transition: width 0.3s ease;
  }

  .dimension .name {
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 4px;
  }

  .dimension .meta {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .dimension .score-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dimension .score {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .dimension .threshold {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .dimension .status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status.good { background: var(--success); }
  .status.warning { background: var(--warning); }
  .status.bad { background: var(--error); }

  /* Radar Chart Container */
  .radar-container {
    display: flex;
    justify-content: center;
    padding: 24px;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    margin-bottom: 32px;
  }

  .radar-svg {
    max-width: 600px;
    width: 100%;
  }

  /* Stats Footer */
  .stats {
    display: flex;
    justify-content: center;
    gap: 32px;
    padding: 16px;
    background: var(--bg-tertiary);
    border-radius: var(--radius);
    margin-top: 24px;
  }

  .stat {
    text-align: center;
  }

  .stat .value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--accent-gold);
  }

  .stat .label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* Refresh animation */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .refreshing { animation: pulse 1s infinite; }
</style>
  `;
}

// =============================================================================
// HTML GENERATION
// =============================================================================

/**
 * Generate dimension card HTML
 */
function generateDimensionCard(dim, score, threshold, categoryColor) {
  const percentage = Math.min(100, Math.max(0, score));
  const status = score >= threshold ? 'good' : score >= threshold * 0.8 ? 'warning' : 'bad';

  return `
    <div class="dimension">
      <div class="bar" style="width: ${percentage}%; background: ${categoryColor};"></div>
      <div class="name">${dim.name}</div>
      <div class="meta">${dim.world ? `${dim.world} / ${dim.axiom}` : dim.purpose || dim.question || dim.description || ''}</div>
      <div class="score-row">
        <div class="score" style="color: ${categoryColor};">${score.toFixed(1)}</div>
        <div class="threshold">/ ${threshold}</div>
        <div class="status ${status}"></div>
      </div>
    </div>
  `;
}

/**
 * Generate category section HTML
 */
function generateCategorySection(categoryName, config, scores, thresholds) {
  const dims = config.dimensions;
  const avgScore = dims.reduce((sum, d) => sum + (scores[d.name] || 50), 0) / dims.length;

  const dimensionCards = dims.map(dim => {
    const score = scores[dim.name] || 50;
    const threshold = thresholds[dim.name] || 60;
    return generateDimensionCard(dim, score, threshold, config.color);
  }).join('');

  return `
    <div class="category">
      <div class="category-header">
        <h2>${config.icon} ${categoryName} <span class="weight">(${config.weight.toFixed(3)}x)</span></h2>
        <span class="avg" style="color: ${config.color};">${avgScore.toFixed(1)}</span>
      </div>
      <div class="dimensions-grid">
        ${dimensionCards}
      </div>
    </div>
  `;
}

/**
 * Generate radar chart SVG
 */
function generateRadarChart(scores, size = 500) {
  const center = size / 2;
  const radius = size * 0.4;
  const allDims = [];

  // Collect all dimensions
  for (const [catName, config] of Object.entries(DIMENSION_CONFIG)) {
    for (const dim of config.dimensions) {
      allDims.push({
        name: dim.name,
        score: scores[dim.name] || 50,
        color: config.color,
        category: catName,
      });
    }
  }

  const n = allDims.length;
  const angleStep = (2 * Math.PI) / n;

  // Generate background grid
  let gridLines = '';
  for (let r = 0.2; r <= 1; r += 0.2) {
    const points = [];
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + radius * r * Math.cos(angle);
      const y = center + radius * r * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    gridLines += `<polygon points="${points.join(' ')}" fill="none" stroke="#30363d" stroke-width="1"/>`;
  }

  // Generate axis lines
  let axisLines = '';
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    axisLines += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#30363d" stroke-width="1"/>`;
  }

  // Generate data polygon
  const dataPoints = [];
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const r = (allDims[i].score / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    dataPoints.push(`${x},${y}`);
  }

  // Generate labels
  let labels = '';
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + (radius + 30) * Math.cos(angle);
    const y = center + (radius + 30) * Math.sin(angle);
    const textAnchor = x < center - 10 ? 'end' : x > center + 10 ? 'start' : 'middle';
    const name = allDims[i].name.length > 8 ? allDims[i].name.slice(0, 6) + '..' : allDims[i].name;
    labels += `<text x="${x}" y="${y}" fill="${allDims[i].color}" font-size="10" text-anchor="${textAnchor}" dominant-baseline="middle">${name}</text>`;
  }

  return `
    <svg class="radar-svg" viewBox="0 0 ${size} ${size}">
      ${gridLines}
      ${axisLines}
      <polygon points="${dataPoints.join(' ')}" fill="rgba(212, 160, 23, 0.2)" stroke="var(--accent-gold)" stroke-width="2"/>
      ${labels}
    </svg>
  `;
}

/**
 * Generate global score section
 */
function generateGlobalScore(globalScore, verdictCounts) {
  const verdictColor = globalScore >= 70 ? 'var(--success)' :
                       globalScore >= 50 ? 'var(--warning)' : 'var(--error)';

  return `
    <div class="global-score">
      <div class="metric">
        <div class="value" style="color: ${verdictColor};">${globalScore.toFixed(1)}</div>
        <div class="label">Global Score</div>
      </div>
      <div class="metric">
        <div class="value" style="color: var(--success);">${verdictCounts.ACCEPT || 0}</div>
        <div class="label">ACCEPT</div>
      </div>
      <div class="metric">
        <div class="value" style="color: var(--warning);">${verdictCounts.TRANSFORM || 0}</div>
        <div class="label">TRANSFORM</div>
      </div>
      <div class="metric">
        <div class="value" style="color: var(--error);">${verdictCounts.REJECT || 0}</div>
        <div class="label">REJECT</div>
      </div>
    </div>
  `;
}

// =============================================================================
// MAIN DASHBOARD GENERATION
// =============================================================================

/**
 * Generate the complete dimensions dashboard
 */
function generateDimensionsDashboard(data = {}) {
  const {
    scores = {},
    thresholds = {},
    globalScore = 50,
    verdictCounts = {},
    cacheStats = {},
    residualStats = {},
    innommableStatus = {},
    timestamp = new Date().toISOString(),
  } = data;

  const styles = generateStyles();
  const globalScoreSection = generateGlobalScore(globalScore, verdictCounts);
  const radarChart = generateRadarChart(scores);

  const categorySections = Object.entries(DIMENSION_CONFIG).map(([name, config]) =>
    generateCategorySection(name, config, scores, thresholds)
  ).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CYNIC 25D Dashboard - φ qui se voit</title>
  ${styles}
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>🐕 CYNIC Dimensions Dashboard</h1>
      <div class="subtitle">"φ qui se voit dans toutes ses dimensions"</div>
      <div class="timestamp">Last updated: ${timestamp}</div>
    </div>

    ${globalScoreSection}

    <div class="radar-container">
      ${radarChart}
    </div>

    ${categorySections}

    <div class="stats">
      <div class="stat">
        <div class="value">${cacheStats.hitRate || '0%'}</div>
        <div class="label">Cache Hit Rate</div>
      </div>
      <div class="stat">
        <div class="value">${residualStats.bufferCount || 0}</div>
        <div class="label">Residual Buffer</div>
      </div>
      <div class="stat">
        <div class="value">${innommableStatus.pendingCount || 0}</div>
        <div class="label">Pending Dimensions</div>
      </div>
      <div class="stat">
        <div class="value">${(PHI_INV * 100).toFixed(1)}%</div>
        <div class="label">Max Confidence (φ⁻¹)</div>
      </div>
    </div>
  </div>

  <script>
    // Auto-refresh every φ⁻¹ × 100 seconds (61.8s)
    setTimeout(() => location.reload(), ${Math.round(PHI_INV * 100 * 1000)});
  </script>
</body>
</html>
  `;
}

/**
 * Generate dashboard from current CYNIC state
 */
async function generateDashboardFromState() {
  try {
    // Try to load current state
    const statePath = path.join(__dirname, '../../knowledge/cynic-learning-state.json');
    const harmonyPath = path.join(__dirname, '../../knowledge/cynic/harmony-matrix.json');
    const thresholdsPath = path.join(__dirname, '../../knowledge/cynic/thresholds.json');

    let scores = {};
    let thresholds = {};
    let globalScore = 50;
    let verdictCounts = {};

    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (state.dimensionStats) {
        scores = state.dimensionStats;
      }
      if (state.verdictCounts) {
        verdictCounts = state.verdictCounts;
      }
    }

    if (fs.existsSync(thresholdsPath)) {
      thresholds = JSON.parse(fs.readFileSync(thresholdsPath, 'utf8'));
    }

    // Calculate global from scores
    const allScores = Object.values(scores).filter(s => typeof s === 'number');
    if (allScores.length > 0) {
      globalScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    }

    return generateDimensionsDashboard({
      scores,
      thresholds,
      globalScore,
      verdictCounts,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Return dashboard with default values
    return generateDimensionsDashboard({
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Save dashboard to file
 */
async function saveDashboard(outputPath) {
  const html = await generateDashboardFromState();
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html);
  return outputPath;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  generateDimensionsDashboard,
  generateDashboardFromState,
  saveDashboard,
  DIMENSION_CONFIG,
  generateRadarChart,
  PHI,
  PHI_INV,
};
