/**
 * CYNIC Observable Persistent State
 *
 * Central state management for CYNIC with:
 * - Observable subscriptions (EventEmitter pattern)
 * - Persistent storage to knowledge store
 * - φ-based decay and thresholds
 * - Judgment history and metrics
 *
 * "The state of CYNIC is the state of the singularity."
 */

'use strict';

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const { PHI, PHI_INV, PHI_INV_2, PHI_2: PHI_SQ, PHI_3 } = require('../../temporal');

// =============================================================================
// CONSTANTS
// =============================================================================

const KNOWLEDGE_DIR = path.join(__dirname, '../../../knowledge/live/cynic');
const STATE_FILE = path.join(KNOWLEDGE_DIR, 'state.json');

// φ-based history limits
const MAX_JUDGMENTS = Math.floor(100 * PHI);      // ~162
const MAX_EVENTS = Math.floor(500 * PHI);          // ~809
const MAX_ANOMALIES = Math.floor(50 * PHI);        // ~81

// Persist interval: φ minutes in ms
const PERSIST_INTERVAL = Math.floor(PHI * 60 * 1000); // ~97s

// =============================================================================
// CYNIC STATE CLASS
// =============================================================================

class CYNICState extends EventEmitter {
  constructor() {
    super();

    // Core state
    this.initialized = false;
    this.startTime = null;

    // Judgment state
    this.judgments = {
      total: 0,
      history: [],        // Recent judgments (capped)
      byVerdict: {
        ACCEPT: 0,
        REJECT: 0,
        TRANSFORM: 0,
        UNKNOWN: 0,
      },
      avgScore: 0,
      avgConfidence: 0,
    };

    // Dimension scores (rolling average)
    this.dimensions = {
      scores: {},         // Current scores by dimension
      history: {},        // Recent scores per dimension
      worldAverages: {},  // ATZILUT, BERIAH, YETZIRAH, ASSIAH
      categoryAverages: {}, // PRIMARY, SECONDARY, META, HUMAN_LLM
    };

    // Health metrics
    this.health = {
      current: 50,
      history: [],
      subsystems: {},
    };

    // Learning state
    this.learning = {
      feedbackCount: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      phiScore: 0,         // φ-weighted score
    };

    // Events log
    this.events = [];

    // Anomalies
    this.anomalies = [];

    // Persistence
    this._persistTimer = null;
    this._dirty = false;
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize state - load from disk if exists
   */
  async init() {
    if (this.initialized) return this;

    this.startTime = Date.now();

    // Ensure directory exists
    try {
      await fs.promises.mkdir(KNOWLEDGE_DIR, { recursive: true });
    } catch (err) {
      // Directory may already exist
    }

    // Load persisted state
    await this._loadState();

    // Start persistence timer
    this._persistTimer = setInterval(() => {
      if (this._dirty) {
        this._persistState().catch(err => {
          this.emit('error', { type: 'persist', error: err.message });
        });
      }
    }, PERSIST_INTERVAL);

    this.initialized = true;
    this.emit('init', { startTime: this.startTime });

    return this;
  }

  /**
   * Shutdown - persist final state
   */
  async shutdown() {
    if (this._persistTimer) {
      clearInterval(this._persistTimer);
      this._persistTimer = null;
    }

    await this._persistState();

    this.emit('shutdown', { uptime: Date.now() - this.startTime });
    this.removeAllListeners();
  }

  // ===========================================================================
  // JUDGMENT STATE
  // ===========================================================================

  /**
   * Record a completed judgment
   * @param {Object} judgment - Judgment result from CYNICCore
   */
  recordJudgment(judgment) {
    this.judgments.total++;

    // Update verdict counts
    const verdict = judgment.verdict || 'UNKNOWN';
    this.judgments.byVerdict[verdict] = (this.judgments.byVerdict[verdict] || 0) + 1;

    // Add to history (with limit)
    this.judgments.history.push({
      id: judgment.judgmentId,
      verdict,
      score: judgment.score,
      confidence: judgment.confidence,
      timestamp: Date.now(),
    });

    if (this.judgments.history.length > MAX_JUDGMENTS) {
      this.judgments.history = this.judgments.history.slice(-MAX_JUDGMENTS);
    }

    // Update rolling averages with φ-decay
    this._updateRollingAverage('score', judgment.score);
    this._updateRollingAverage('confidence', judgment.confidence);

    this._markDirty();
    this.emit('judgment:recorded', {
      judgmentId: judgment.judgmentId,
      verdict,
      total: this.judgments.total,
    });
  }

  /**
   * Get judgment statistics
   */
  getJudgmentStats() {
    const total = this.judgments.total;
    const verdicts = this.judgments.byVerdict;

    return {
      total,
      history: this.judgments.history.slice(-10),  // Last 10
      avgScore: this.judgments.avgScore,
      avgConfidence: Math.min(this.judgments.avgConfidence, PHI_INV * 100),
      verdictDistribution: {
        ACCEPT: total > 0 ? (verdicts.ACCEPT / total) : 0,
        REJECT: total > 0 ? (verdicts.REJECT / total) : 0,
        TRANSFORM: total > 0 ? (verdicts.TRANSFORM / total) : 0,
        UNKNOWN: total > 0 ? (verdicts.UNKNOWN / total) : 0,
      },
      phi: {
        maxConfidence: PHI_INV,
        constraintApplied: this.judgments.avgConfidence > PHI_INV * 100,
      },
    };
  }

  // ===========================================================================
  // DIMENSION STATE
  // ===========================================================================

  /**
   * Record dimension scores from a judgment
   * @param {Object} scores - Map of dimension name to score
   * @param {Object} metadata - Additional info (world, category)
   */
  recordDimensionScores(scores, metadata = {}) {
    for (const [dimension, score] of Object.entries(scores)) {
      // Update current score
      this.dimensions.scores[dimension] = {
        value: score,
        timestamp: Date.now(),
        metadata,
      };

      // Update dimension history
      if (!this.dimensions.history[dimension]) {
        this.dimensions.history[dimension] = [];
      }
      this.dimensions.history[dimension].push({
        value: score,
        timestamp: Date.now(),
      });

      // Limit history per dimension
      const maxHistory = Math.floor(20 * PHI); // ~32
      if (this.dimensions.history[dimension].length > maxHistory) {
        this.dimensions.history[dimension] =
          this.dimensions.history[dimension].slice(-maxHistory);
      }
    }

    this._updateWorldAverages();
    this._updateCategoryAverages();

    this._markDirty();
    this.emit('dimensions:updated', { count: Object.keys(scores).length });
  }

  /**
   * Get current dimension scores with φ-decay
   */
  getDimensionScores() {
    const now = Date.now();
    const decayedScores = {};

    for (const [dim, data] of Object.entries(this.dimensions.scores)) {
      const ageMs = now - data.timestamp;
      const ageDays = ageMs / (24 * 60 * 60 * 1000);

      // φ-decay: score * φ^(-ageDays)
      const decayFactor = Math.pow(PHI, -ageDays);
      decayedScores[dim] = {
        current: data.value,
        decayed: data.value * decayFactor,
        decayFactor,
        ageMs,
      };
    }

    return {
      scores: decayedScores,
      worldAverages: this.dimensions.worldAverages,
      categoryAverages: this.dimensions.categoryAverages,
    };
  }

  // ===========================================================================
  // HEALTH STATE
  // ===========================================================================

  /**
   * Record health update
   * @param {number} health - Current health 0-100
   * @param {Object} subsystems - Subsystem health map
   */
  recordHealth(health, subsystems = {}) {
    const previous = this.health.current;
    this.health.current = health;
    this.health.subsystems = subsystems;

    // History with limit
    this.health.history.push({
      value: health,
      timestamp: Date.now(),
    });

    if (this.health.history.length > MAX_EVENTS) {
      this.health.history = this.health.history.slice(-MAX_EVENTS);
    }

    // Emit if significant change
    const delta = Math.abs(health - previous);
    if (delta > PHI_INV_2 * 100) { // > 38.2% change
      this.emit('health:significant_change', {
        previous,
        current: health,
        delta,
      });
    }

    this._markDirty();
  }

  /**
   * Get health trend
   */
  getHealthTrend() {
    const history = this.health.history;
    if (history.length < 2) {
      return { trend: 'stable', slope: 0 };
    }

    // Calculate simple linear regression slope
    const n = Math.min(history.length, 10);
    const recent = history.slice(-n);

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < recent.length; i++) {
      sumX += i;
      sumY += recent[i].value;
      sumXY += i * recent[i].value;
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    let trend = 'stable';
    if (slope > 1) trend = 'improving';
    else if (slope < -1) trend = 'degrading';

    return {
      current: this.health.current,
      trend,
      slope,
      subsystems: this.health.subsystems,
    };
  }

  // ===========================================================================
  // LEARNING STATE
  // ===========================================================================

  /**
   * Record learning feedback
   * @param {Object} feedback - Feedback data
   */
  recordFeedback(feedback) {
    this.learning.feedbackCount++;

    // Update accuracy metrics if provided
    if (typeof feedback.accuracy === 'number') {
      this.learning.accuracy = this._exponentialAverage(
        this.learning.accuracy,
        feedback.accuracy,
        PHI_INV // Weight toward recent
      );
    }

    if (typeof feedback.precision === 'number') {
      this.learning.precision = this._exponentialAverage(
        this.learning.precision,
        feedback.precision,
        PHI_INV
      );
    }

    if (typeof feedback.recall === 'number') {
      this.learning.recall = this._exponentialAverage(
        this.learning.recall,
        feedback.recall,
        PHI_INV
      );
    }

    // Calculate φ-Score: geometric mean weighted by φ
    this._calculatePhiScore();

    this._markDirty();
    this.emit('learning:feedback', { count: this.learning.feedbackCount });
  }

  getLearningStats() {
    return {
      ...this.learning,
      phi: {
        value: PHI,
        scoreFormula: 'φ-Score = (accuracy^φ × precision × recall)^(1/(1+φ))',
      },
    };
  }

  // ===========================================================================
  // EVENTS & ANOMALIES
  // ===========================================================================

  /**
   * Log an event
   * @param {string} type - Event type
   * @param {Object} data - Event data
   */
  logEvent(type, data = {}) {
    const event = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.events.push(event);

    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-MAX_EVENTS);
    }

    this._markDirty();
    this.emit('event', event);
  }

  /**
   * Record an anomaly
   * @param {Object} anomaly - Anomaly data
   */
  recordAnomaly(anomaly) {
    this.anomalies.push({
      ...anomaly,
      timestamp: Date.now(),
    });

    if (this.anomalies.length > MAX_ANOMALIES) {
      this.anomalies = this.anomalies.slice(-MAX_ANOMALIES);
    }

    this._markDirty();
    this.emit('anomaly', anomaly);
  }

  getRecentEvents(limit = 20) {
    return this.events.slice(-limit);
  }

  getRecentAnomalies(limit = 10) {
    return this.anomalies.slice(-limit);
  }

  // ===========================================================================
  // SNAPSHOT
  // ===========================================================================

  /**
   * Get complete state snapshot
   */
  getSnapshot() {
    return {
      initialized: this.initialized,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      judgments: this.getJudgmentStats(),
      dimensions: this.getDimensionScores(),
      health: this.getHealthTrend(),
      learning: this.getLearningStats(),
      recentEvents: this.getRecentEvents(5),
      recentAnomalies: this.getRecentAnomalies(5),
      phi: {
        value: PHI,
        inv: PHI_INV,
        inv2: PHI_INV_2,
        sq: PHI_SQ,
        cubed: PHI_3,
      },
      timestamp: Date.now(),
    };
  }

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  async _loadState() {
    try {
      const data = await fs.promises.readFile(STATE_FILE, 'utf-8');
      const state = JSON.parse(data);

      // Restore state (with validation)
      if (state.judgments) this.judgments = state.judgments;
      if (state.dimensions) this.dimensions = state.dimensions;
      if (state.health) this.health = state.health;
      if (state.learning) this.learning = state.learning;
      if (state.events) this.events = state.events.slice(-MAX_EVENTS);
      if (state.anomalies) this.anomalies = state.anomalies.slice(-MAX_ANOMALIES);

      this.emit('state:loaded', { file: STATE_FILE });
    } catch (err) {
      if (err.code !== 'ENOENT') {
        this.emit('error', { type: 'load', error: err.message });
      }
      // File doesn't exist - start fresh
    }
  }

  async _persistState() {
    const state = {
      judgments: this.judgments,
      dimensions: this.dimensions,
      health: this.health,
      learning: this.learning,
      events: this.events.slice(-100),      // Only persist recent events
      anomalies: this.anomalies.slice(-20), // Only persist recent anomalies
      lastPersist: Date.now(),
    };

    try {
      await fs.promises.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
      this._dirty = false;
      this.emit('state:persisted', { file: STATE_FILE });
    } catch (err) {
      this.emit('error', { type: 'persist', error: err.message });
    }
  }

  _markDirty() {
    this._dirty = true;
  }

  // ===========================================================================
  // INTERNAL HELPERS
  // ===========================================================================

  _updateRollingAverage(field, value) {
    const key = `avg${field.charAt(0).toUpperCase() + field.slice(1)}`;
    const history = this.judgments.history;
    const n = history.length;

    if (n === 0) {
      this.judgments[key] = value;
      return;
    }

    // Exponential moving average with φ-decay
    const alpha = 2 / (n + 1);
    this.judgments[key] = alpha * value + (1 - alpha) * this.judgments[key];
  }

  _exponentialAverage(current, newValue, alpha) {
    return alpha * newValue + (1 - alpha) * current;
  }

  _updateWorldAverages() {
    const worlds = { ATZILUT: [], BERIAH: [], YETZIRAH: [], ASSIAH: [] };

    for (const [dim, data] of Object.entries(this.dimensions.scores)) {
      const world = data.metadata?.world;
      if (world && worlds[world]) {
        worlds[world].push(data.value);
      }
    }

    for (const [world, scores] of Object.entries(worlds)) {
      this.dimensions.worldAverages[world] = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    }
  }

  _updateCategoryAverages() {
    const categories = { PRIMARY: [], SECONDARY: [], META: [], HUMAN_LLM: [] };

    for (const [dim, data] of Object.entries(this.dimensions.scores)) {
      const category = data.metadata?.category;
      if (category && categories[category]) {
        categories[category].push(data.value);
      }
    }

    for (const [category, scores] of Object.entries(categories)) {
      this.dimensions.categoryAverages[category] = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    }
  }

  _calculatePhiScore() {
    const { accuracy, precision, recall } = this.learning;

    if (accuracy === 0 && precision === 0 && recall === 0) {
      this.learning.phiScore = 0;
      return;
    }

    // φ-Score = (accuracy^φ × precision × recall)^(1/(1+φ))
    const numerator = Math.pow(accuracy / 100, PHI) *
                      (precision / 100) *
                      (recall / 100);
    const exponent = 1 / (1 + PHI);

    this.learning.phiScore = Math.pow(numerator, exponent) * 100;
  }
}

// =============================================================================
// SINGLETON + EXPORTS
// =============================================================================

const cynicState = new CYNICState();

module.exports = {
  CYNICState,
  cynicState,

  // Convenience
  init: () => cynicState.init(),
  shutdown: () => cynicState.shutdown(),
  getSnapshot: () => cynicState.getSnapshot(),
  recordJudgment: (j) => cynicState.recordJudgment(j),
  recordDimensionScores: (s, m) => cynicState.recordDimensionScores(s, m),
  recordHealth: (h, s) => cynicState.recordHealth(h, s),
  logEvent: (t, d) => cynicState.logEvent(t, d),
  recordAnomaly: (a) => cynicState.recordAnomaly(a),

  // Event subscription
  on: (event, handler) => cynicState.on(event, handler),
  once: (event, handler) => cynicState.once(event, handler),
};
