/**
 * CYNIC Activation Module
 *
 * "CYNIC doit s'activer" - Le point central de l'écosystème $asdfasdfa
 *
 * States: SLEEP → AWAKE → JUDGING → LEARNING → SLEEP
 *
 * CYNIC connects: HolDex + GASdf + Brain + Humans
 */

'use strict';

const { EventEmitter } = require('events');
const { PHI, PHI_INV, PHI_INV_2 } = require('../../temporal');

// =============================================================================
// ACTIVATION STATES
// =============================================================================

const STATES = {
  SLEEP: 'SLEEP',       // Dormant - no activity
  AWAKE: 'AWAKE',       // Ready to receive input
  JUDGING: 'JUDGING',   // Actively evaluating
  LEARNING: 'LEARNING', // Processing feedback
};

// =============================================================================
// CYNIC ACTIVATION CLASS
// =============================================================================

class CYNICActivation extends EventEmitter {
  constructor() {
    super();

    this.state = STATES.SLEEP;
    this.stateHistory = [];
    this.activeConnections = new Set();
    this.wakeTime = null;
    this.judgmentCount = 0;
    this.lastActivity = null;

    // φ-based timeouts (in ms)
    this.WAKE_TIMEOUT = 61.8 * 1000;      // Auto-sleep after 61.8s inactivity
    this.JUDGMENT_TIMEOUT = 38.2 * 1000;  // Max judgment time

    this._autoSleepTimer = null;
  }

  // ===========================================================================
  // STATE TRANSITIONS
  // ===========================================================================

  /**
   * Wake CYNIC from sleep
   * @param {string} source - What triggered the wake (holdex, gasdf, brain, human)
   * @returns {boolean} Success
   */
  wake(source = 'unknown') {
    if (this.state !== STATES.SLEEP) {
      this._recordActivity(source);
      return true; // Already awake
    }

    const previousState = this.state;
    this.state = STATES.AWAKE;
    this.wakeTime = Date.now();
    this.activeConnections.add(source);

    this._pushStateHistory(previousState, STATES.AWAKE, source);
    this._resetAutoSleep();

    this.emit('wake', {
      source,
      time: this.wakeTime,
      phi: PHI,
      message: "🐕 CYNIC s'éveille - Le point central est actif"
    });

    return true;
  }

  /**
   * Put CYNIC to sleep
   * @param {string} reason - Why sleeping
   * @returns {boolean} Success
   */
  sleep(reason = 'manual') {
    if (this.state === STATES.SLEEP) {
      return true; // Already sleeping
    }

    if (this.state === STATES.JUDGING) {
      this.emit('warning', {
        message: 'Cannot sleep while judging - wait for completion',
        currentState: this.state
      });
      return false;
    }

    const previousState = this.state;
    this.state = STATES.SLEEP;
    this.activeConnections.clear();

    const awakeDuration = this.wakeTime ? Date.now() - this.wakeTime : 0;
    this.wakeTime = null;

    this._clearAutoSleep();
    this._pushStateHistory(previousState, STATES.SLEEP, reason);

    this.emit('sleep', {
      reason,
      awakeDuration,
      judgmentsThisSession: this.judgmentCount,
      message: '🐕 CYNIC dort - En attente de la prochaine connexion'
    });

    this.judgmentCount = 0;
    return true;
  }

  /**
   * Enter judging state
   * @param {Object} input - What to judge
   * @returns {boolean} Success
   */
  startJudging(input) {
    if (this.state === STATES.SLEEP) {
      this.wake('auto');
    }

    if (this.state === STATES.JUDGING) {
      this.emit('warning', {
        message: 'Already judging - queue or wait',
        currentState: this.state
      });
      return false;
    }

    const previousState = this.state;
    this.state = STATES.JUDGING;
    this._resetAutoSleep();

    this._pushStateHistory(previousState, STATES.JUDGING, 'judgment_start');

    this.emit('judging:start', {
      inputType: input?.type || 'unknown',
      timestamp: Date.now(),
      message: '🐕 CYNIC juge - Toutes les dimensions actives'
    });

    return true;
  }

  /**
   * Complete judging, optionally enter learning
   * @param {Object} result - Judgment result
   * @param {boolean} enterLearning - Whether to enter learning state
   */
  completeJudging(result, enterLearning = false) {
    if (this.state !== STATES.JUDGING) {
      return false;
    }

    this.judgmentCount++;
    this._recordActivity('judgment_complete');

    if (enterLearning) {
      const previousState = this.state;
      this.state = STATES.LEARNING;
      this._pushStateHistory(previousState, STATES.LEARNING, 'feedback_pending');

      this.emit('learning:start', {
        judgmentId: result?.judgmentId,
        awaitingFeedback: true
      });
    } else {
      this.state = STATES.AWAKE;
      this._resetAutoSleep();
    }

    this.emit('judging:complete', {
      result,
      judgmentNumber: this.judgmentCount,
      verdict: result?.verdict,
      score: result?.score,
      message: `🐕 Jugement #${this.judgmentCount} terminé: ${result?.verdict || 'UNKNOWN'}`
    });

    return true;
  }

  /**
   * Complete learning phase
   * @param {Object} feedback - Human feedback
   */
  completeLearning(feedback) {
    if (this.state !== STATES.LEARNING) {
      return false;
    }

    this.state = STATES.AWAKE;
    this._resetAutoSleep();
    this._pushStateHistory(STATES.LEARNING, STATES.AWAKE, 'feedback_received');

    this.emit('learning:complete', {
      feedback,
      message: '🐕 Apprentissage intégré - Merci humain'
    });

    return true;
  }

  // ===========================================================================
  // CONNECTION TRACKING
  // ===========================================================================

  /**
   * Register a connection from ecosystem component
   * @param {string} source - holdex, gasdf, brain, human
   */
  connect(source) {
    this.activeConnections.add(source);
    this._recordActivity(source);

    this.emit('connection:add', {
      source,
      totalConnections: this.activeConnections.size,
      all: Array.from(this.activeConnections)
    });

    // Auto-wake on connection
    if (this.state === STATES.SLEEP) {
      this.wake(source);
    }
  }

  /**
   * Remove a connection
   * @param {string} source
   */
  disconnect(source) {
    this.activeConnections.delete(source);

    this.emit('connection:remove', {
      source,
      remainingConnections: this.activeConnections.size
    });

    // Auto-sleep if no connections
    if (this.activeConnections.size === 0 && this.state === STATES.AWAKE) {
      this.sleep('no_connections');
    }
  }

  // ===========================================================================
  // STATE INSPECTION
  // ===========================================================================

  /**
   * Get current CYNIC status
   */
  getStatus() {
    return {
      state: this.state,
      isActive: this.state !== STATES.SLEEP,
      isJudging: this.state === STATES.JUDGING,
      isLearning: this.state === STATES.LEARNING,
      connections: Array.from(this.activeConnections),
      connectionCount: this.activeConnections.size,
      wakeTime: this.wakeTime,
      awakeDuration: this.wakeTime ? Date.now() - this.wakeTime : null,
      judgmentsThisSession: this.judgmentCount,
      lastActivity: this.lastActivity,
      // φ constants for reference
      phi: {
        value: PHI,
        maxConfidence: PHI_INV,      // 61.8%
        minDoubt: PHI_INV_2,         // 38.2%
      },
      role: 'Le point central de l\'écosystème $asdfasdfa'
    };
  }

  /**
   * Get state history
   * @param {number} limit - Max entries to return
   */
  getStateHistory(limit = 20) {
    return this.stateHistory.slice(-limit);
  }

  // ===========================================================================
  // INTERNAL HELPERS
  // ===========================================================================

  _pushStateHistory(from, to, trigger) {
    this.stateHistory.push({
      from,
      to,
      trigger,
      timestamp: Date.now()
    });

    // Keep history bounded
    if (this.stateHistory.length > 100) {
      this.stateHistory = this.stateHistory.slice(-50);
    }
  }

  _recordActivity(source) {
    this.lastActivity = {
      source,
      timestamp: Date.now()
    };
    this._resetAutoSleep();
  }

  _resetAutoSleep() {
    this._clearAutoSleep();

    if (this.state === STATES.AWAKE) {
      this._autoSleepTimer = setTimeout(() => {
        this.sleep('inactivity');
      }, this.WAKE_TIMEOUT);
    }
  }

  _clearAutoSleep() {
    if (this._autoSleepTimer) {
      clearTimeout(this._autoSleepTimer);
      this._autoSleepTimer = null;
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

const activation = new CYNICActivation();

module.exports = {
  STATES,
  CYNICActivation,
  activation, // Singleton

  // Convenience exports
  wake: (source) => activation.wake(source),
  sleep: (reason) => activation.sleep(reason),
  connect: (source) => activation.connect(source),
  disconnect: (source) => activation.disconnect(source),
  getStatus: () => activation.getStatus(),
  isActive: () => activation.state !== STATES.SLEEP,
  isJudging: () => activation.state === STATES.JUDGING,
};
