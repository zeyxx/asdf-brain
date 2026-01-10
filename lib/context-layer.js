/**
 * context-layer.js - AI Superlayer for asdf-brain
 *
 * This is NOT a data manager. This is context intelligence.
 *
 * Philosophy: Every AI interaction should be enriched with
 * the right context at the right time.
 *
 * Structure:
 * - Sessions: Track N users × N conversations × N projects
 * - Context: Project-specific knowledge layers
 * - Injection: Enrich AI queries with relevant context
 * - Cross-pollination: Patterns flow between projects
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PHI, PHI_2, PHI_INV } = require('./temporal');

const CONTEXT_WEIGHTS = {
  session: PHI_2,      // 2.618 - highest priority
  project: PHI,        // 1.618 - project context
  cross: 1.0,          // 1.0   - cross-project patterns
  philosophy: PHI_INV, // 0.618 - guiding principles
  recent: 1.0,         // 1.0   - recent learnings
};

// =============================================================================
// PROJECTS CONFIGURATION
// =============================================================================

const PROJECTS = {
  holdex: {
    id: 'holdex',
    name: 'HolDex',
    layer: 'intelligence',
    sefirah: 'Hod',
    keywords: ['k-score', 'kscore', 'e-score', 'token', 'oracle', 'metal', 'rank'],
    dependencies: ['gasdf'],
  },
  gasdf: {
    id: 'gasdf',
    name: 'GASdf',
    layer: 'infrastructure',
    sefirah: 'Yesod',
    keywords: ['gasless', 'swap', 'burn', 'fee', 'quote', 'transaction'],
    dependencies: ['holdex'],
  },
  brain: {
    id: 'brain',
    name: 'asdf-brain',
    layer: 'meta',
    sefirah: 'Daat',
    keywords: ['knowledge', 'pattern', 'intent', 'vision', 'merkle', 'context'],
    dependencies: ['holdex', 'gasdf', 'manifesto'],
  },
  manifesto: {
    id: 'manifesto',
    name: 'asdf-manifesto',
    layer: 'foundation',
    sefirah: 'Keter',
    keywords: ['philosophy', 'burn', 'phi', 'alignment', 'verify'],
    dependencies: [],
  },
  ecosystem: {
    id: 'ecosystem',
    name: '$asdfasdfa Ecosystem',
    layer: 'all',
    sefirah: 'all',
    keywords: ['asdfasdfa', 'ecosystem', 'multi', 'cross'],
    dependencies: ['holdex', 'gasdf', 'brain', 'manifesto'],
  },
};

// =============================================================================
// CONTEXT STORE (In-Memory + Persistent)
// =============================================================================

class ContextStore {
  constructor(basePath) {
    this.basePath = basePath || path.join(__dirname, '../knowledge/context');
    this.sessions = new Map();      // Active sessions
    this.users = new Map();         // User profiles
    this.projectContexts = new Map(); // Project-specific context
    this.recentLearnings = [];      // Cross-session learnings

    this._ensureDir();
    this._loadPersisted();
  }

  _ensureDir() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  _loadPersisted() {
    // Load persisted project contexts
    const projectsPath = path.join(this.basePath, 'projects');
    if (fs.existsSync(projectsPath)) {
      for (const file of fs.readdirSync(projectsPath)) {
        if (file.endsWith('.json')) {
          const projectId = file.replace('.json', '');
          const data = JSON.parse(fs.readFileSync(path.join(projectsPath, file), 'utf-8'));
          this.projectContexts.set(projectId, data);
        }
      }
    }

    // Load recent learnings
    const learningsPath = path.join(this.basePath, 'learnings.json');
    if (fs.existsSync(learningsPath)) {
      this.recentLearnings = JSON.parse(fs.readFileSync(learningsPath, 'utf-8'));
    }
  }

  _persist() {
    // Persist project contexts
    const projectsPath = path.join(this.basePath, 'projects');
    if (!fs.existsSync(projectsPath)) {
      fs.mkdirSync(projectsPath, { recursive: true });
    }

    for (const [projectId, context] of this.projectContexts) {
      fs.writeFileSync(
        path.join(projectsPath, `${projectId}.json`),
        JSON.stringify(context, null, 2)
      );
    }

    // Persist recent learnings (keep last 100)
    fs.writeFileSync(
      path.join(this.basePath, 'learnings.json'),
      JSON.stringify(this.recentLearnings.slice(-100), null, 2)
    );
  }
}

// =============================================================================
// SESSION MANAGER
// =============================================================================

class SessionManager {
  constructor(store) {
    this.store = store;
  }

  /**
   * Start or resume a session
   */
  startSession(options = {}) {
    const { userId, project, sessionId } = options;

    const id = sessionId || crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    // Detect project from context if not specified
    const detectedProject = project || this._detectProject(options.context);

    const session = {
      id,
      user_id: userId || 'anonymous',
      project: detectedProject,
      started_at: now,
      last_activity: now,
      context_stack: [],
      decisions: [],
      patterns_used: [],
      cross_references: [],
      active: true,
    };

    this.store.sessions.set(id, session);
    this._emitEvent('session_start', session);

    return session;
  }

  /**
   * Update session with new context
   */
  updateSession(sessionId, update) {
    const session = this.store.sessions.get(sessionId);
    if (!session) return null;

    session.last_activity = new Date().toISOString();

    if (update.context) {
      session.context_stack.push({
        timestamp: session.last_activity,
        ...update.context,
      });
      // Keep last 50 context entries
      if (session.context_stack.length > 50) {
        session.context_stack = session.context_stack.slice(-50);
      }
    }

    if (update.decision) {
      session.decisions.push({
        timestamp: session.last_activity,
        ...update.decision,
      });
    }

    if (update.pattern) {
      session.patterns_used.push(update.pattern);
    }

    if (update.cross_reference) {
      session.cross_references.push(update.cross_reference);
      this._emitEvent('cross_project_reference', {
        session: sessionId,
        from: session.project,
        to: update.cross_reference.project,
      });
    }

    return session;
  }

  /**
   * End a session and persist learnings
   */
  endSession(sessionId) {
    const session = this.store.sessions.get(sessionId);
    if (!session) return null;

    session.active = false;
    session.ended_at = new Date().toISOString();

    // Extract learnings from session
    const learnings = this._extractLearnings(session);
    this.store.recentLearnings.push(...learnings);

    // Update project context with session insights
    this._updateProjectContext(session);

    this._emitEvent('session_end', session);
    this.store._persist();

    return session;
  }

  /**
   * Detect project from context keywords
   */
  _detectProject(context) {
    if (!context) return 'ecosystem';

    const text = typeof context === 'string' ? context : JSON.stringify(context);
    const textLower = text.toLowerCase();

    let bestMatch = 'ecosystem';
    let bestScore = 0;

    for (const [projectId, project] of Object.entries(PROJECTS)) {
      let score = 0;
      for (const keyword of project.keywords) {
        if (textLower.includes(keyword)) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = projectId;
      }
    }

    return bestMatch;
  }

  /**
   * Extract learnings from a session
   */
  _extractLearnings(session) {
    const learnings = [];

    // Decisions become learnings
    for (const decision of session.decisions) {
      learnings.push({
        type: 'decision',
        project: session.project,
        content: decision,
        session_id: session.id,
        timestamp: decision.timestamp,
      });
    }

    // Cross-references are valuable
    for (const ref of session.cross_references) {
      learnings.push({
        type: 'cross_reference',
        from_project: session.project,
        to_project: ref.project,
        context: ref.context,
        session_id: session.id,
        timestamp: new Date().toISOString(),
      });
    }

    return learnings;
  }

  /**
   * Update project context with session insights
   */
  _updateProjectContext(session) {
    let context = this.store.projectContexts.get(session.project);

    if (!context) {
      context = {
        project: session.project,
        active_patterns: [],
        recent_decisions: [],
        session_count: 0,
        last_updated: null,
      };
    }

    context.session_count++;
    context.last_updated = new Date().toISOString();
    context.recent_decisions.push(...session.decisions);
    context.recent_decisions = context.recent_decisions.slice(-20);

    // Add patterns used
    for (const pattern of session.patterns_used) {
      if (!context.active_patterns.includes(pattern)) {
        context.active_patterns.push(pattern);
      }
    }
    context.active_patterns = context.active_patterns.slice(-30);

    this.store.projectContexts.set(session.project, context);
  }

  _emitEvent(type, data) {
    // Event hook for future real-time features
    // console.log(`[EVENT] ${type}:`, data.id || data.session);
  }
}

// =============================================================================
// CONTEXT INJECTOR - The AI Superlayer
// =============================================================================

class ContextInjector {
  constructor(store, sessionManager) {
    this.store = store;
    this.sessionManager = sessionManager;
    this.knowledgePath = path.join(__dirname, '../knowledge');
  }

  /**
   * Build context injection for an AI query
   * This is the core of the superlayer
   */
  async buildInjection(options = {}) {
    const { sessionId, query, project } = options;

    const injection = {
      _meta: {
        built_at: new Date().toISOString(),
        philosophy: "$asdfasdfa - Context is everything",
      },
      weights: CONTEXT_WEIGHTS,
      layers: {},
    };

    // 1. Session context (highest weight)
    if (sessionId) {
      const session = this.store.sessions.get(sessionId);
      if (session) {
        injection.layers.session = {
          weight: CONTEXT_WEIGHTS.session,
          project: session.project,
          recent_context: session.context_stack.slice(-5),
          decisions_this_session: session.decisions.slice(-3),
          patterns_referenced: session.patterns_used.slice(-5),
        };
      }
    }

    // 2. Project context
    const targetProject = project || injection.layers.session?.project || 'ecosystem';
    const projectContext = await this._getProjectContext(targetProject);
    injection.layers.project = {
      weight: CONTEXT_WEIGHTS.project,
      ...projectContext,
    };

    // 3. Cross-project patterns
    if (targetProject !== 'ecosystem') {
      const crossPatterns = await this._getCrossProjectPatterns(targetProject);
      injection.layers.cross_project = {
        weight: CONTEXT_WEIGHTS.cross,
        patterns: crossPatterns,
      };
    }

    // 4. Philosophy anchor
    const philosophyAnchor = await this._getPhilosophyAnchor(query);
    injection.layers.philosophy = {
      weight: CONTEXT_WEIGHTS.philosophy,
      ...philosophyAnchor,
    };

    // 5. Recent learnings (from all sessions)
    injection.layers.recent_learnings = {
      weight: CONTEXT_WEIGHTS.recent,
      items: this.store.recentLearnings.slice(-10),
    };

    // Calculate total context quality
    injection.quality = this._calculateQuality(injection);

    return injection;
  }

  /**
   * Get project-specific context
   */
  async _getProjectContext(projectId) {
    const stored = this.store.projectContexts.get(projectId);
    const projectConfig = PROJECTS[projectId];

    // Load relevant patterns from knowledge
    const patterns = await this._loadProjectPatterns(projectId);
    const recentIntent = await this._loadProjectIntent(projectId);

    return {
      project: projectId,
      config: projectConfig,
      stored_context: stored,
      active_patterns: patterns,
      recent_intent: recentIntent,
    };
  }

  /**
   * Get patterns from related projects
   */
  async _getCrossProjectPatterns(projectId) {
    const project = PROJECTS[projectId];
    if (!project) return [];

    const patterns = [];

    for (const depId of project.dependencies) {
      const depContext = this.store.projectContexts.get(depId);
      if (depContext?.active_patterns) {
        patterns.push({
          from: depId,
          patterns: depContext.active_patterns.slice(0, 3),
        });
      }
    }

    return patterns;
  }

  /**
   * Get relevant philosophy axioms
   *
   * 4 AXIOMS (foundational):
   * - φ (PHI): The ratio that governs all
   * - BURN: Economic singularity
   * - VERIFY: Cryptographic truth
   * - CULTURE: The unforkable moat
   *
   * Everything else (K-Score, E-Score, CYNIC, PaRDeS, etc.) = derivations
   */
  async _getPhilosophyAnchor(query) {
    // The 4 Worlds (Kabbalistic) mapped to 4 Axioms
    const worlds = [
      {
        world: 'ATZILUT',
        meaning: 'Emanation',
        axiom: 'phi',
        mode: 'SENSE',
        text: 'φ guides all ratios (1.618...)',
        trigger: /phi|φ|1\.618|0\.618|ratio|percent|weight|threshold|geometric|golden|harmony|coherence/i,
        dimensions: ['HARMONY', 'COHERENCE'],
        derivations: ['K-Score', 'E-Score', 'I-Infra', 'CYNIC limits', 'PaRDeS weights'],
      },
      {
        world: 'BERIAH',
        meaning: 'Creation',
        axiom: 'verify',
        mode: 'THINK',
        text: "Don't trust, verify - cryptographic proof for everything",
        trigger: /verify|trust|signature|hmac|merkle|proof|integrity|tamper|sign|truth/i,
        dimensions: ['TRUTH', 'INTEGRITY'],
        derivations: ['HMAC signatures', 'Merkle provenance', 'Anti-obscurantism', 'CYNIC self-judgment'],
      },
      {
        world: 'YETZIRAH',
        meaning: 'Formation',
        axiom: 'culture',
        mode: 'FEEL',
        text: 'Culture is a moat - code forks, culture does not',
        trigger: /culture|moat|open.*source|mit|license|fork|cypherpunk|community|marketing|ethic|optimis/i,
        dimensions: ['ETHICS', 'OPTIMISM'],
        derivations: ['Open source', 'No marketing', 'Cypherpunk values', 'Community-driven'],
      },
      {
        world: 'ASSIAH',
        meaning: 'Action',
        axiom: 'burn',
        mode: 'ACT',
        text: '100% BURN - all value converges to singularity',
        trigger: /burn|fee|treasury|deflat|supply|alignment|incentive|progress|singularity/i,
        dimensions: ['ALIGNMENT', 'PROGRESS'],
        derivations: ['100% burn', 'Dual-channel', 'Perfect alignment', 'Holder rewards'],
      },
    ];

    // CYNIC Fibonacci structure reminder
    const cynic = {
      mission: 'Enable autonomy, don\'t automate',
      maxConfidence: 0.618,
      minDoubt: 0.382,
      fibonacci: { META: 3, OPERATIONS: 5, JUDGMENTS: 8 },
    };

    const relevant = [];
    const queryText = query || '';

    for (const w of worlds) {
      if (w.trigger.test(queryText)) {
        relevant.push(w);
      }
    }

    // Always include BERIAH/verify as base (core principle)
    if (relevant.length === 0) {
      relevant.push(worlds[1]); // verify/BERIAH
    }

    return {
      worlds: relevant,
      cynic,
      _structure: '4 Worlds (ATZILUT→BERIAH→YETZIRAH→ASSIAH) × Fibonacci (3+5+8)',
      _note: '4 axioms, everything else derives. CYNIC: enable autonomy, don\'t automate.',
    };
  }

  /**
   * Load patterns specific to a project
   */
  async _loadProjectPatterns(projectId) {
    try {
      const patternsPath = path.join(this.knowledgePath, 'patterns/extracted-patterns.json');
      if (!fs.existsSync(patternsPath)) return [];

      const data = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));

      // Filter patterns relevant to this project
      const projectKeywords = PROJECTS[projectId]?.keywords || [];
      const relevant = [];

      if (data.global_patterns?.asdfasdfa) {
        relevant.push(...Object.keys(data.global_patterns.asdfasdfa));
      }

      return relevant.slice(0, 10);
    } catch (e) {
      return [];
    }
  }

  /**
   * Load recent intent for a project
   */
  async _loadProjectIntent(projectId) {
    try {
      const intentPath = path.join(this.knowledgePath, 'intent/extracted-intents.json');
      if (!fs.existsSync(intentPath)) return [];

      const data = JSON.parse(fs.readFileSync(intentPath, 'utf-8'));

      // Get recent decisions
      return data.by_category?.decision?.slice(0, 3) || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Calculate overall context quality (K-Score inspired)
   */
  _calculateQuality(injection) {
    // D = Depth (how many layers have content)
    const layersWithContent = Object.values(injection.layers).filter(l =>
      l && Object.keys(l).length > 1
    ).length;
    const D = layersWithContent / 5;

    // O = Organic (has session context = more organic)
    const O = injection.layers.session ? 1.0 : 0.5;

    // L = Learnings (has recent learnings)
    const L = injection.layers.recent_learnings?.items?.length > 0 ? 1.0 : 0.5;

    // K = 100 × ∛(D × O × L)
    return Math.round(100 * Math.cbrt(D * O * L));
  }
}

// =============================================================================
// MAIN EXPORT - Context Layer Singleton
// =============================================================================

class ContextLayer {
  constructor(basePath) {
    this.store = new ContextStore(basePath);
    this.sessions = new SessionManager(this.store);
    this.injector = new ContextInjector(this.store, this.sessions);
  }

  // Session API
  startSession(options) { return this.sessions.startSession(options); }
  updateSession(id, update) { return this.sessions.updateSession(id, update); }
  endSession(id) { return this.sessions.endSession(id); }

  // Context API
  async getInjection(options) { return this.injector.buildInjection(options); }

  // Stats - Live session tracking
  getStats() {
    // Count only truly active sessions
    let activeSessions = 0;
    const byProject = {};
    const byUser = {};
    const activeSessionIds = [];

    for (const [id, session] of this.store.sessions) {
      if (session.active) {
        activeSessions++;
        activeSessionIds.push(id);

        // By project
        byProject[session.project] = (byProject[session.project] || 0) + 1;

        // By user
        byUser[session.user_id] = (byUser[session.user_id] || 0) + 1;
      }
    }

    return {
      active_sessions: activeSessions,
      total_sessions: this.store.sessions.size,
      by_project: byProject,
      by_user: byUser,
      active_session_ids: activeSessionIds,
      projects_with_context: this.store.projectContexts.size,
      recent_learnings: this.store.recentLearnings.length,
      projects: Object.keys(PROJECTS),
    };
  }

  // Get detailed session info
  getSession(sessionId) {
    const session = this.store.sessions.get(sessionId);
    if (!session) return null;

    return {
      ...session,
      duration_ms: session.ended_at
        ? new Date(session.ended_at) - new Date(session.started_at)
        : Date.now() - new Date(session.started_at),
    };
  }

  // Get all active sessions
  getActiveSessions() {
    const active = [];
    for (const [id, session] of this.store.sessions) {
      if (session.active) {
        active.push({
          id,
          user_id: session.user_id,
          project: session.project,
          started_at: session.started_at,
          context_depth: session.context_stack.length,
          decisions_count: session.decisions.length,
        });
      }
    }
    return active;
  }
}

// Singleton instance
let instance = null;

function getContextLayer(basePath) {
  if (!instance) {
    instance = new ContextLayer(basePath);
  }
  return instance;
}

/**
 * Detect project from text content using keyword matching
 * Exported for use by brain_learn and brain_ingest
 */
function detectProject(text) {
  if (!text) return 'ecosystem';

  const textLower = (typeof text === 'string' ? text : JSON.stringify(text)).toLowerCase();

  let bestMatch = 'ecosystem';
  let bestScore = 0;

  for (const [projectId, project] of Object.entries(PROJECTS)) {
    let score = 0;
    for (const keyword of project.keywords) {
      if (textLower.includes(keyword)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = projectId;
    }
  }

  return bestMatch;
}

module.exports = {
  ContextLayer,
  getContextLayer,
  detectProject,
  PROJECTS,
  CONTEXT_WEIGHTS,
};
