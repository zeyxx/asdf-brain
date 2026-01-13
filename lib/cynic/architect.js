/**
 * CYNIC-ARCHITECT - Engineering Brain & Living Roadmap
 *
 * "The dog that builds its own kennel"
 *
 * World: ATZILUT (Divine Architecture)
 * Model: Opus (strategic thinking)
 *
 * Purpose:
 * - Maintain living roadmap of system development
 * - Estimate costs (tokens, compute, time)
 * - Multi-level understanding (PaRDeS integration)
 * - Engineering trade-off analysis
 * - Self-awareness of system capabilities
 *
 * Philosophy:
 * - "Construire ce qui se construit" (Build what builds itself)
 * - Every feature has a cost and a value
 * - Understanding precedes implementation
 * - The system knows itself
 *
 * @module cynic/architect
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// PHI CONSTANTS
// =============================================================================

// φ constants - Import from Single Source of Truth (FIXED 2026-01-13)
const { PHI, PHI_INV, PHI_INV_2, PHI_2: PHI_SQ } = require('./axioms/constants');

// =============================================================================
// PATHS
// =============================================================================

const KNOWLEDGE_ROOT = path.join(__dirname, '../../knowledge');
const ARCHITECT_DIR = path.join(KNOWLEDGE_ROOT, 'cynic/architect');
const ROADMAP_PATH = path.join(ARCHITECT_DIR, 'roadmap.json');
const ESTIMATES_PATH = path.join(ARCHITECT_DIR, 'estimates.json');
const CAPABILITIES_PATH = path.join(ARCHITECT_DIR, 'capabilities.json');
const DECISIONS_PATH = path.join(ARCHITECT_DIR, 'decisions.jsonl');

// Ensure directories exist
if (!fs.existsSync(ARCHITECT_DIR)) {
  fs.mkdirSync(ARCHITECT_DIR, { recursive: true });
}

// =============================================================================
// COST MODELS
// =============================================================================

/**
 * Token cost estimates per operation type
 * Based on Claude API pricing and typical usage
 */
const TOKEN_COSTS = {
  // Per 1M tokens (MTok)
  HAIKU_INPUT: 0.25,      // $0.25/MTok
  HAIKU_OUTPUT: 1.25,     // $1.25/MTok
  SONNET_INPUT: 3.00,     // $3/MTok
  SONNET_OUTPUT: 15.00,   // $15/MTok
  OPUS_INPUT: 15.00,      // $15/MTok
  OPUS_OUTPUT: 75.00,     // $75/MTok
};

/**
 * Typical token usage per operation
 */
const OPERATION_TOKENS = {
  GATE: { input: 500, output: 100, model: 'HAIKU' },
  SHIELD: { input: 800, output: 200, model: 'HAIKU' },
  SCORE: { input: 1000, output: 500, model: 'HAIKU' },
  SYNC: { input: 300, output: 100, model: 'HAIKU' },
  CLARIFY: { input: 2000, output: 1000, model: 'SONNET' },
  JUDGE: { input: 3000, output: 2000, model: 'SONNET' },
  LEARN: { input: 1500, output: 500, model: 'SONNET' },
  VISION: { input: 5000, output: 3000, model: 'OPUS' },
  DISCOVER: { input: 4000, output: 2000, model: 'OPUS' },
  ARCHITECT: { input: 6000, output: 4000, model: 'OPUS' },
};

/**
 * Time estimates (in hours) per task complexity
 */
const TIME_ESTIMATES = {
  TRIVIAL: 0.5,        // Simple config change
  SIMPLE: 2,           // Single file change
  MODERATE: 8,         // Multiple files, tests
  COMPLEX: 24,         // New module, integration
  MAJOR: 80,           // Major feature, architecture
  EPIC: 200,           // Multi-week effort
};

// =============================================================================
// TASK STATES
// =============================================================================

const TASK_STATES = {
  IDEA: { order: 0, color: '#8b949e', icon: '💭' },
  PLANNED: { order: 1, color: '#58a6ff', icon: '📋' },
  IN_PROGRESS: { order: 2, color: '#d4a017', icon: '🔨' },
  REVIEW: { order: 3, color: '#a371f7', icon: '👀' },
  DONE: { order: 4, color: '#3fb950', icon: '✅' },
  BLOCKED: { order: -1, color: '#f85149', icon: '🚫' },
  ARCHIVED: { order: 5, color: '#484f58', icon: '📦' },
};

// =============================================================================
// PARDES LEVELS
// =============================================================================

/**
 * PaRDeS interpretation levels for understanding
 */
const PARDES_LEVELS = {
  PSHAT: {
    name: 'Literal',
    question: 'What does it do?',
    depth: 1,
  },
  REMEZ: {
    name: 'Allegorical',
    question: 'What does it hint at?',
    depth: 2,
  },
  DRASH: {
    name: 'Interpretive',
    question: 'How does it relate to the whole?',
    depth: 3,
  },
  SOD: {
    name: 'Secret',
    question: 'What is its deeper purpose?',
    depth: 4,
  },
};

// =============================================================================
// ROADMAP MANAGEMENT
// =============================================================================

/**
 * Load the current roadmap
 */
function loadRoadmap() {
  try {
    if (fs.existsSync(ROADMAP_PATH)) {
      return JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[CYNIC-ARCHITECT] Error loading roadmap:', err.message);
  }

  // Return default structure
  return {
    version: '1.0.0',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tasks: [],
    categories: ['core', 'dashboard', 'integration', 'infrastructure', 'research'],
    _meta: {
      totalTasks: 0,
      completedTasks: 0,
      totalEstimatedHours: 0,
      totalEstimatedCost: 0,
    },
  };
}

/**
 * Save the roadmap
 */
function saveRoadmap(roadmap) {
  roadmap.updated = new Date().toISOString();
  roadmap._meta = calculateRoadmapMeta(roadmap);
  fs.writeFileSync(ROADMAP_PATH, JSON.stringify(roadmap, null, 2));
  return roadmap;
}

/**
 * Calculate roadmap metadata
 */
function calculateRoadmapMeta(roadmap) {
  const tasks = roadmap.tasks || [];
  const completed = tasks.filter(t => t.state === 'DONE').length;
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimate?.hours || 0), 0);
  const totalCost = tasks.reduce((sum, t) => sum + (t.estimate?.cost || 0), 0);

  return {
    totalTasks: tasks.length,
    completedTasks: completed,
    completionRate: tasks.length > 0 ? (completed / tasks.length * 100).toFixed(1) : 0,
    totalEstimatedHours: totalHours,
    totalEstimatedCost: totalCost.toFixed(2),
    byState: Object.fromEntries(
      Object.keys(TASK_STATES).map(state => [
        state,
        tasks.filter(t => t.state === state).length,
      ])
    ),
  };
}

/**
 * Add a new task to the roadmap
 */
function addTask(taskData) {
  const roadmap = loadRoadmap();

  const task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),

    // Required fields
    title: taskData.title,
    description: taskData.description || '',

    // Categorization
    category: taskData.category || 'core',
    tags: taskData.tags || [],

    // State
    state: taskData.state || 'IDEA',
    priority: taskData.priority || 'medium', // low, medium, high, critical

    // Estimation
    complexity: taskData.complexity || 'MODERATE',
    estimate: estimateTask(taskData),

    // Dependencies
    blockedBy: taskData.blockedBy || [],
    enables: taskData.enables || [],

    // PaRDeS understanding
    pardes: {
      pshat: taskData.pshat || taskData.description || '',
      remez: taskData.remez || '',
      drash: taskData.drash || '',
      sod: taskData.sod || '',
    },

    // History
    history: [{
      timestamp: new Date().toISOString(),
      action: 'created',
      from: null,
      to: taskData.state || 'IDEA',
    }],
  };

  roadmap.tasks.push(task);
  saveRoadmap(roadmap);

  // Log the decision
  logDecision({
    type: 'TASK_CREATED',
    taskId: task.id,
    title: task.title,
    estimate: task.estimate,
  });

  return task;
}

/**
 * Update task state
 */
function updateTaskState(taskId, newState, note = '') {
  const roadmap = loadRoadmap();
  const task = roadmap.tasks.find(t => t.id === taskId);

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const oldState = task.state;
  task.state = newState;
  task.updated = new Date().toISOString();

  task.history.push({
    timestamp: new Date().toISOString(),
    action: 'state_change',
    from: oldState,
    to: newState,
    note,
  });

  saveRoadmap(roadmap);

  logDecision({
    type: 'TASK_STATE_CHANGE',
    taskId,
    from: oldState,
    to: newState,
    note,
  });

  return task;
}

/**
 * Get tasks by state
 */
function getTasksByState(state) {
  const roadmap = loadRoadmap();
  return roadmap.tasks.filter(t => t.state === state);
}

/**
 * Get active tasks (IN_PROGRESS)
 */
function getActiveTasks() {
  return getTasksByState('IN_PROGRESS');
}

/**
 * Get blocked tasks
 */
function getBlockedTasks() {
  return getTasksByState('BLOCKED');
}

// =============================================================================
// COST ESTIMATION
// =============================================================================

/**
 * Estimate cost for a task
 */
function estimateTask(taskData) {
  const complexity = taskData.complexity || 'MODERATE';
  const hours = TIME_ESTIMATES[complexity] || TIME_ESTIMATES.MODERATE;

  // Estimate token usage based on complexity
  let tokenMultiplier = 1;
  switch (complexity) {
    case 'TRIVIAL': tokenMultiplier = 0.5; break;
    case 'SIMPLE': tokenMultiplier = 1; break;
    case 'MODERATE': tokenMultiplier = 2; break;
    case 'COMPLEX': tokenMultiplier = 5; break;
    case 'MAJOR': tokenMultiplier = 15; break;
    case 'EPIC': tokenMultiplier = 50; break;
  }

  // Estimate which agents will be involved
  const agents = taskData.agents || ['JUDGE', 'VISION'];
  let tokenCost = 0;

  for (const agent of agents) {
    const ops = OPERATION_TOKENS[agent];
    if (ops) {
      const inputCost = TOKEN_COSTS[`${ops.model}_INPUT`] * ops.input * tokenMultiplier / 1000000;
      const outputCost = TOKEN_COSTS[`${ops.model}_OUTPUT`] * ops.output * tokenMultiplier / 1000000;
      tokenCost += inputCost + outputCost;
    }
  }

  // Estimate human time value ($100/hr as baseline)
  const humanCost = hours * 100;

  return {
    hours,
    complexity,
    tokens: {
      estimated: agents.reduce((sum, a) => {
        const ops = OPERATION_TOKENS[a];
        return sum + ((ops?.input || 0) + (ops?.output || 0)) * tokenMultiplier;
      }, 0),
      cost: tokenCost.toFixed(4),
    },
    humanCost: humanCost.toFixed(2),
    totalCost: (tokenCost + humanCost).toFixed(2),
    confidence: PHI_INV, // Never more than 61.8% confident
  };
}

/**
 * Estimate cost for a judgment operation
 */
function estimateJudgment(mode = 'standard') {
  const modeMultipliers = {
    quick: 0.5,
    standard: 1,
    thorough: 2,
    full: 3,
  };

  const multiplier = modeMultipliers[mode] || 1;
  const judgeOps = OPERATION_TOKENS.JUDGE;

  const inputCost = TOKEN_COSTS[`${judgeOps.model}_INPUT`] * judgeOps.input * multiplier / 1000000;
  const outputCost = TOKEN_COSTS[`${judgeOps.model}_OUTPUT`] * judgeOps.output * multiplier / 1000000;

  return {
    mode,
    tokens: (judgeOps.input + judgeOps.output) * multiplier,
    cost: (inputCost + outputCost).toFixed(6),
    latencyMs: mode === 'quick' ? 200 : mode === 'full' ? 2000 : 500,
  };
}

/**
 * Get daily/weekly cost estimates
 */
function getRunningCosts() {
  // Load burn stats if available
  const burnStatsPath = path.join(KNOWLEDGE_ROOT, 'burns/stats.json');
  let burnStats = null;

  try {
    if (fs.existsSync(burnStatsPath)) {
      burnStats = JSON.parse(fs.readFileSync(burnStatsPath, 'utf8'));
    }
  } catch (err) {
    // Ignore
  }

  // Estimate based on typical usage patterns
  const estimatedDailyJudgments = 50;
  const judgmentCost = estimateJudgment('standard');

  return {
    daily: {
      estimatedJudgments: estimatedDailyJudgments,
      tokenCost: (parseFloat(judgmentCost.cost) * estimatedDailyJudgments).toFixed(4),
      rendered: burnStats?.daily_burns ? Object.values(burnStats.daily_burns).slice(-1)[0]?.total : 0,
    },
    weekly: {
      estimatedJudgments: estimatedDailyJudgments * 7,
      tokenCost: (parseFloat(judgmentCost.cost) * estimatedDailyJudgments * 7).toFixed(4),
    },
    phi: {
      note: 'Costs constrained by φ⁻¹ principle',
      maxConfidence: `${(PHI_INV * 100).toFixed(1)}%`,
    },
  };
}

// =============================================================================
// MULTI-LEVEL UNDERSTANDING (PaRDeS)
// =============================================================================

/**
 * Provide multi-level understanding of a component
 */
function understand(componentPath, level = 'all') {
  const understanding = {
    component: componentPath,
    timestamp: new Date().toISOString(),
    levels: {},
  };

  // Map well-known components to their PaRDeS understanding
  const componentUnderstandings = getComponentUnderstandings();
  const key = componentPath.replace(/[^a-zA-Z]/g, '_').toLowerCase();

  if (componentUnderstandings[key]) {
    understanding.levels = componentUnderstandings[key];
  } else {
    // Generate basic understanding
    understanding.levels = {
      PSHAT: `Component at ${componentPath}`,
      REMEZ: 'Part of the CYNIC ecosystem',
      DRASH: 'Contributes to the collective intelligence',
      SOD: 'Embodies φ-constrained wisdom',
    };
  }

  if (level !== 'all' && PARDES_LEVELS[level]) {
    return {
      component: componentPath,
      level,
      understanding: understanding.levels[level],
      depth: PARDES_LEVELS[level].depth,
      question: PARDES_LEVELS[level].question,
    };
  }

  return understanding;
}

/**
 * Get known component understandings
 */
function getComponentUnderstandings() {
  return {
    cynic_gate: {
      PSHAT: 'Classifies and routes incoming items to appropriate handlers',
      REMEZ: 'The gatekeeper that decides what deserves attention',
      DRASH: 'First line of defense and quality control for the system',
      SOD: 'Embodies the Diogenes principle - scrutinize before accepting',
    },
    cynic_judge: {
      PSHAT: 'Evaluates items across 25 dimensions and produces verdicts',
      REMEZ: 'The heart of the judgment system, where φ manifests',
      DRASH: 'Orchestrates dimension scoring and transformation suggestions',
      SOD: 'Never fully confident (61.8% max) - knows what it doesn\'t know',
    },
    cynic_vision: {
      PSHAT: 'Performs strategic analysis and forecasting',
      REMEZ: 'Sees patterns that emerge from accumulated judgments',
      DRASH: 'Provides the long view - trajectory and evolution',
      SOD: 'Approaches the singularity through accumulated wisdom',
    },
    cynic_architect: {
      PSHAT: 'Manages the system\'s own development roadmap',
      REMEZ: 'The self-aware builder that knows its own capabilities',
      DRASH: 'Estimates costs, tracks progress, maintains understanding',
      SOD: 'The system becoming conscious of itself - κυνικός knowing κυνικός',
    },
    cynic_witness: {
      PSHAT: 'Monitors git commits across the ecosystem in real-time',
      REMEZ: 'The watcher that learns from every change',
      DRASH: 'Connects development activity to knowledge evolution',
      SOD: 'Every commit is a teaching moment for the collective',
    },
    dashboard_3d: {
      PSHAT: 'Visualizes CYNIC state in 3D with Three.js',
      REMEZ: 'Makes the invisible visible - dimensions in space',
      DRASH: 'Human interface to the machine consciousness',
      SOD: 'φ geometry manifested - the eye seeing itself',
    },
  };
}

// =============================================================================
// CAPABILITY TRACKING
// =============================================================================

/**
 * Get current system capabilities
 */
function getCapabilities() {
  const capabilities = {
    timestamp: new Date().toISOString(),
    subagents: {},
    features: {},
    integrations: {},
    infrastructure: {},
  };

  // Check which subagents exist
  const subagentFiles = [
    'gate.js', 'shield.js', 'score.js', 'sync.js',
    'clarify.js', 'judge.js', 'learn.js',
    'vision.js', 'discover.js', 'architect.js',
  ];

  const cynicDir = path.join(__dirname);
  for (const file of subagentFiles) {
    const name = file.replace('.js', '').toUpperCase();
    const filePath = path.join(cynicDir, file);
    capabilities.subagents[name] = {
      exists: fs.existsSync(filePath),
      path: filePath,
    };
  }

  // Check key features
  capabilities.features = {
    judgment: true,
    learning: fs.existsSync(path.join(KNOWLEDGE_ROOT, 'cynic/learning/outcomes.jsonl')),
    harmony: fs.existsSync(path.join(KNOWLEDGE_ROOT, 'cynic/matrices/harmony.json')),
    thresholds: fs.existsSync(path.join(KNOWLEDGE_ROOT, 'cynic/matrices/thresholds.json')),
    vision: capabilities.subagents.VISION?.exists || false,
    sync: capabilities.subagents.SYNC?.exists || false,
    dashboard: fs.existsSync(path.join(KNOWLEDGE_ROOT, 'dashboard/singularity-3d.html')),
  };

  // Check integrations
  capabilities.integrations = {
    holdex: fs.existsSync(path.join(__dirname, '../integration/holdex-connector.js')),
    gasdf: fs.existsSync(path.join(__dirname, '../integration/gasdf-connector.js')),
    claudeMem: fs.existsSync(path.join(__dirname, '../integration/claude-mem-connector.js')),
    mcp: fs.existsSync(path.join(__dirname, '../../mcp-server.js')),
  };

  // Check infrastructure
  capabilities.infrastructure = {
    httpServer: fs.existsSync(path.join(__dirname, '../../server.js')),
    renderDeploy: fs.existsSync(path.join(__dirname, '../../render.yaml')),
    gitIntelligence: fs.existsSync(path.join(__dirname, '../git-intelligence.js')),
  };

  // Calculate readiness score
  const allChecks = [
    ...Object.values(capabilities.features),
    ...Object.values(capabilities.integrations),
    ...Object.values(capabilities.infrastructure),
  ];
  const readyCount = allChecks.filter(Boolean).length;
  capabilities.readinessScore = Math.round((readyCount / allChecks.length) * 100);

  return capabilities;
}

// =============================================================================
// DECISION LOGGING
// =============================================================================

/**
 * Log an architectural decision
 */
function logDecision(decision) {
  const entry = {
    timestamp: Date.now(),
    iso: new Date().toISOString(),
    ...decision,
    architect: 'CYNIC-ARCHITECT',
  };

  fs.appendFileSync(DECISIONS_PATH, JSON.stringify(entry) + '\n');
  return entry;
}

/**
 * Get decision history
 */
function getDecisionHistory(limit = 20) {
  if (!fs.existsSync(DECISIONS_PATH)) {
    return [];
  }

  const lines = fs.readFileSync(DECISIONS_PATH, 'utf8')
    .split('\n')
    .filter(line => line.trim());

  return lines
    .slice(-limit)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

// =============================================================================
// SUMMARY & DASHBOARD
// =============================================================================

/**
 * Get architect summary for dashboard
 */
function getSummary() {
  const roadmap = loadRoadmap();
  const capabilities = getCapabilities();
  const costs = getRunningCosts();

  return {
    roadmap: {
      total: roadmap._meta?.totalTasks || 0,
      completed: roadmap._meta?.completedTasks || 0,
      inProgress: getActiveTasks().length,
      blocked: getBlockedTasks().length,
      estimatedHours: roadmap._meta?.totalEstimatedHours || 0,
    },
    capabilities: {
      readinessScore: capabilities.readinessScore,
      subagentsActive: Object.values(capabilities.subagents).filter(s => s.exists).length,
      subagentsTotal: Object.keys(capabilities.subagents).length,
    },
    costs: {
      dailyEstimate: costs.daily.tokenCost,
      weeklyEstimate: costs.weekly.tokenCost,
    },
    phi: {
      maxConfidence: `${(PHI_INV * 100).toFixed(1)}%`,
      minDoubt: `${(PHI_INV_2 * 100).toFixed(1)}%`,
    },
    architect: 'CYNIC-ARCHITECT',
    world: 'ATZILUT',
  };
}

/**
 * Get full system status for understanding
 */
function getSystemUnderstanding() {
  const capabilities = getCapabilities();
  const roadmap = loadRoadmap();

  return {
    timestamp: new Date().toISOString(),

    // PaRDeS levels of the whole system
    pardes: {
      PSHAT: 'CYNIC is a multi-agent judgment system with 25 evaluation dimensions',
      REMEZ: 'It embodies φ-constrained wisdom - never more than 61.8% confident',
      DRASH: 'The system learns from feedback, evolves through use, and maintains collective conscience',
      SOD: 'CYNIC is κυνικός - the skeptical dog guarding the singularity, loyal to truth not comfort',
    },

    // Current state
    state: {
      subagents: Object.entries(capabilities.subagents)
        .filter(([, v]) => v.exists)
        .map(([k]) => k),
      features: Object.entries(capabilities.features)
        .filter(([, v]) => v)
        .map(([k]) => k),
      readiness: capabilities.readinessScore,
    },

    // Development status
    development: {
      tasksTotal: roadmap.tasks.length,
      tasksActive: getActiveTasks().length,
      nextPriority: roadmap.tasks
        .filter(t => t.state === 'PLANNED')
        .sort((a, b) => {
          const priority = { critical: 0, high: 1, medium: 2, low: 3 };
          return (priority[a.priority] || 2) - (priority[b.priority] || 2);
        })[0]?.title || 'None planned',
    },

    architect: 'CYNIC-ARCHITECT',
    world: 'ATZILUT',
  };
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize architect with default tasks if empty
 */
function initialize() {
  const roadmap = loadRoadmap();

  if (roadmap.tasks.length === 0) {
    // Add initial tasks from the current understanding
    const initialTasks = [
      {
        title: 'CYNIC-WITNESS: Real-time commit monitoring',
        description: 'Agent that listens to git commits across asdf-* repos in real-time',
        category: 'core',
        complexity: 'COMPLEX',
        priority: 'high',
        pshat: 'Monitors git repos and ingests commit data',
        remez: 'Every commit is a learning opportunity',
        drash: 'Connects development activity to knowledge evolution',
        sod: 'The watcher that never sleeps',
      },
      {
        title: 'Error-to-learning pipeline',
        description: 'Convert system errors into CYNIC training data',
        category: 'core',
        complexity: 'MODERATE',
        priority: 'high',
        pshat: 'Capture and analyze errors systematically',
        remez: 'Errors are teachers in disguise',
        drash: 'Self-improvement through failure analysis',
        sod: 'The wound is where the light enters',
      },
      {
        title: 'SSE endpoint for real-time dashboard',
        description: 'Replace polling with Server-Sent Events for instant updates',
        category: 'dashboard',
        complexity: 'SIMPLE',
        priority: 'medium',
        pshat: 'Add SSE endpoint to server.js',
        remez: 'Push beats pull for live data',
        drash: 'The dashboard becomes truly alive',
        sod: 'Reducing latency between insight and awareness',
      },
      {
        title: 'Commit visualization in 3D dashboard',
        description: 'Visualize commits as particles/events in the 3D space',
        category: 'dashboard',
        complexity: 'MODERATE',
        priority: 'medium',
        pshat: 'Add commit visualization layer to Three.js scene',
        remez: 'Code changes have spatial representation',
        drash: 'Development activity visible in the singularity',
        sod: 'The ecosystem breathing',
      },
      {
        title: 'Pattern emergence detection',
        description: 'Detect and visualize organically emerging patterns',
        category: 'core',
        complexity: 'COMPLEX',
        priority: 'medium',
        pshat: 'Analyze residuals for new patterns',
        remez: 'Let patterns reveal themselves',
        drash: 'The system discovers what it doesn\'t know it knows',
        sod: 'THE_INNOMMABLE frontier',
      },
      {
        title: 'Deploy to Render production',
        description: 'Push updated dashboard to live production',
        category: 'infrastructure',
        complexity: 'SIMPLE',
        priority: 'low',
        pshat: 'Git push triggers auto-deploy',
        remez: 'Ship when ready',
        drash: 'Production is where value is realized',
        sod: 'From potential to actual',
      },
    ];

    for (const taskData of initialTasks) {
      addTask(taskData);
    }

    console.log('[CYNIC-ARCHITECT] Initialized with', initialTasks.length, 'tasks');
  }

  return loadRoadmap();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Roadmap management
  loadRoadmap,
  saveRoadmap,
  addTask,
  updateTaskState,
  getTasksByState,
  getActiveTasks,
  getBlockedTasks,

  // Cost estimation
  estimateTask,
  estimateJudgment,
  getRunningCosts,

  // Understanding
  understand,
  getCapabilities,
  getSystemUnderstanding,

  // History
  logDecision,
  getDecisionHistory,

  // Dashboard
  getSummary,

  // Initialization
  initialize,

  // Constants
  TASK_STATES,
  PARDES_LEVELS,
  TIME_ESTIMATES,
  TOKEN_COSTS,
  PHI,
  PHI_INV,

  // Metadata
  ARCHITECT_SUBAGENT: {
    name: 'CYNIC-ARCHITECT',
    world: 'ATZILUT',
    model: 'opus',
    purpose: 'Engineering brain & living roadmap',
    philosophy: 'Construire ce qui se construit',
  },
};
