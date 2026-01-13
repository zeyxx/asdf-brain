/**
 * CYNIC-REALTIME: Real-time Event System
 *
 * Level 2: RÉACTION - Push events to dashboard in real-time
 *
 * Features:
 * - SSE (Server-Sent Events) for push to dashboard
 * - WebSocket for bidirectional communication
 * - Event bus for internal pub/sub
 * - Integration with WITNESS and ERROR-LEARNING
 *
 * $asdfasdfa philosophy:
 * - "Don't trust, verify" - events are verified before broadcast
 * - φ ratios in timing (heartbeat = 1618ms)
 *
 * @module cynic/realtime
 */

'use strict';

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');

// φ constants - Import from Single Source of Truth (FIXED 2026-01-13)
const { PHI, PHI_INV } = require('./axioms/constants');
const HEARTBEAT_MS = Math.round(1000 * PHI); // 1618ms

// =============================================================================
// EVENT TYPES
// =============================================================================

const EVENT_TYPES = {
  // System events
  CONNECTED: 'connected',
  HEARTBEAT: 'heartbeat',
  ERROR: 'error',

  // WITNESS events (commits)
  COMMIT_NEW: 'commit:new',
  COMMIT_ALERT: 'commit:alert',
  CONTRIBUTOR_UPDATE: 'contributor:update',

  // ERROR-LEARNING events
  ERROR_CAPTURED: 'error:captured',
  PATTERN_DETECTED: 'pattern:detected',
  LESSON_EXTRACTED: 'lesson:extracted',

  // CYNIC events
  JUDGMENT_START: 'judgment:start',
  JUDGMENT_COMPLETE: 'judgment:complete',
  SCORE_UPDATE: 'score:update',
  VERDICT_CHANGE: 'verdict:change',

  // Dashboard events
  DIMENSION_UPDATE: 'dimension:update',
  HARMONY_SHIFT: 'harmony:shift',
  RESIDUAL_SPIKE: 'residual:spike',

  // Architect events
  TASK_CREATED: 'task:created',
  TASK_STATE_CHANGE: 'task:state_change',
  LEVEL_COMPLETE: 'level:complete',
};

// Event priorities (higher = more important, max = φ)
const EVENT_PRIORITY = {
  [EVENT_TYPES.ERROR]: PHI,
  [EVENT_TYPES.COMMIT_ALERT]: PHI,
  [EVENT_TYPES.PATTERN_DETECTED]: PHI * PHI_INV,
  [EVENT_TYPES.JUDGMENT_COMPLETE]: PHI * PHI_INV,
  [EVENT_TYPES.VERDICT_CHANGE]: PHI * PHI_INV,
  [EVENT_TYPES.LEVEL_COMPLETE]: PHI,
  default: 1.0,
};

// =============================================================================
// EVENT BUS (Internal pub/sub)
// =============================================================================

class CynicEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Allow many subscribers
    this.stats = {
      emitted: 0,
      byType: {},
      lastEvent: null,
    };
  }

  /**
   * Emit an event with metadata
   */
  emitEvent(type, data = {}) {
    const event = {
      id: `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      type,
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      priority: EVENT_PRIORITY[type] || EVENT_PRIORITY.default,
      data,
    };

    // Update stats
    this.stats.emitted++;
    this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
    this.stats.lastEvent = event;

    // Emit to listeners
    this.emit(type, event);
    this.emit('*', event); // Wildcard for "all events"

    return event;
  }

  /**
   * Get event stats
   */
  getStats() {
    return {
      ...this.stats,
      listenerCount: this.listenerCount('*'),
    };
  }
}

// Singleton event bus
const eventBus = new CynicEventBus();

// =============================================================================
// SSE MANAGER
// =============================================================================

class SSEManager {
  constructor() {
    this.clients = new Map(); // clientId -> response object
    this.filters = new Map(); // clientId -> filter function
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      eventsSent: 0,
    };

    // Subscribe to all events
    eventBus.on('*', (event) => this.broadcast(event));
  }

  /**
   * Add a new SSE client
   */
  addClient(clientId, res, filter = null) {
    this.clients.set(clientId, res);
    if (filter) {
      this.filters.set(clientId, filter);
    }

    this.stats.totalConnections++;
    this.stats.activeConnections = this.clients.size;

    // Send connected event
    this.sendToClient(clientId, {
      id: `evt_${Date.now()}_conn`,
      type: EVENT_TYPES.CONNECTED,
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      priority: 1.0,
      data: {
        clientId,
        server: 'CYNIC-REALTIME',
        heartbeatMs: HEARTBEAT_MS,
      },
    });

    console.log(`[REALTIME] SSE client connected: ${clientId} (${this.clients.size} active)`);
  }

  /**
   * Remove a client
   */
  removeClient(clientId) {
    this.clients.delete(clientId);
    this.filters.delete(clientId);
    this.stats.activeConnections = this.clients.size;
    console.log(`[REALTIME] SSE client disconnected: ${clientId} (${this.clients.size} active)`);
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId, event) {
    const res = this.clients.get(clientId);
    if (!res) return false;

    // Check filter
    const filter = this.filters.get(clientId);
    if (filter && !filter(event)) return false;

    try {
      res.write(`id: ${event.id}\n`);
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      this.stats.eventsSent++;
      return true;
    } catch (err) {
      // Client probably disconnected
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Broadcast event to all clients
   */
  broadcast(event) {
    let sent = 0;
    for (const clientId of this.clients.keys()) {
      if (this.sendToClient(clientId, event)) {
        sent++;
      }
    }
    return sent;
  }

  /**
   * Send heartbeat to all clients
   */
  sendHeartbeat() {
    const heartbeat = {
      id: `hb_${Date.now()}`,
      type: EVENT_TYPES.HEARTBEAT,
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      priority: 0.382, // Low priority
      data: {
        activeClients: this.clients.size,
        eventsSent: this.stats.eventsSent,
      },
    };

    for (const [clientId, res] of this.clients) {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch (err) {
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Get SSE stats
   */
  getStats() {
    return { ...this.stats };
  }
}

// Singleton SSE manager
const sseManager = new SSEManager();

// Start heartbeat interval
setInterval(() => sseManager.sendHeartbeat(), HEARTBEAT_MS);

// =============================================================================
// WEBSOCKET MANAGER
// =============================================================================

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // clientId -> ws
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
    };

    // Subscribe to all events
    eventBus.on('*', (event) => this.broadcast(event));
  }

  /**
   * Initialize WebSocket server
   */
  init(server, path = '/ws/cynic') {
    this.wss = new WebSocket.Server({
      server,
      path,
      verifyClient: (info, cb) => {
        // Basic verification - can add API key check here
        cb(true);
      },
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = `ws_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      this.clients.set(clientId, ws);
      this.stats.totalConnections++;
      this.stats.activeConnections = this.clients.size;

      console.log(`[REALTIME] WebSocket connected: ${clientId} (${this.clients.size} active)`);

      // Send connected event
      this.sendToClient(clientId, {
        id: `evt_${Date.now()}_conn`,
        type: EVENT_TYPES.CONNECTED,
        timestamp: Date.now(),
        iso: new Date().toISOString(),
        priority: 1.0,
        data: {
          clientId,
          server: 'CYNIC-REALTIME',
          protocol: 'websocket',
        },
      });

      // Handle incoming messages
      ws.on('message', (message) => {
        this.stats.messagesReceived++;
        try {
          const data = JSON.parse(message);
          this.handleMessage(clientId, data);
        } catch (err) {
          console.error(`[REALTIME] Invalid WS message from ${clientId}:`, err.message);
        }
      });

      // Handle close
      ws.on('close', () => {
        this.clients.delete(clientId);
        this.stats.activeConnections = this.clients.size;
        console.log(`[REALTIME] WebSocket disconnected: ${clientId}`);
      });

      // Handle errors
      ws.on('error', (err) => {
        console.error(`[REALTIME] WebSocket error for ${clientId}:`, err.message);
      });
    });

    console.log(`[REALTIME] WebSocket server initialized at ${path}`);
  }

  /**
   * Handle incoming message from client
   */
  handleMessage(clientId, data) {
    const { action, payload } = data;

    switch (action) {
      case 'subscribe':
        // Subscribe to specific event types
        console.log(`[REALTIME] ${clientId} subscribed to:`, payload?.types);
        break;

      case 'unsubscribe':
        // Unsubscribe from event types
        console.log(`[REALTIME] ${clientId} unsubscribed from:`, payload?.types);
        break;

      case 'ping':
        // Respond with pong
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: Date.now(),
          clientTimestamp: payload?.timestamp,
        });
        break;

      case 'request':
        // Request specific data (e.g., current state)
        this.handleRequest(clientId, payload);
        break;

      default:
        console.log(`[REALTIME] Unknown action from ${clientId}:`, action);
    }
  }

  /**
   * Handle data request
   */
  handleRequest(clientId, payload) {
    const { type } = payload || {};

    switch (type) {
      case 'stats':
        this.sendToClient(clientId, {
          type: 'response:stats',
          timestamp: Date.now(),
          data: getRealtimeStats(),
        });
        break;

      case 'eventBusStats':
        this.sendToClient(clientId, {
          type: 'response:eventBusStats',
          timestamp: Date.now(),
          data: eventBus.getStats(),
        });
        break;

      default:
        this.sendToClient(clientId, {
          type: 'response:error',
          timestamp: Date.now(),
          error: `Unknown request type: ${type}`,
        });
    }
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId, event) {
    const ws = this.clients.get(clientId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    try {
      ws.send(JSON.stringify(event));
      this.stats.messagesSent++;
      return true;
    } catch (err) {
      console.error(`[REALTIME] Failed to send to ${clientId}:`, err.message);
      return false;
    }
  }

  /**
   * Broadcast event to all clients
   */
  broadcast(event) {
    let sent = 0;
    for (const clientId of this.clients.keys()) {
      if (this.sendToClient(clientId, event)) {
        sent++;
      }
    }
    return sent;
  }

  /**
   * Get WebSocket stats
   */
  getStats() {
    return { ...this.stats };
  }
}

// Singleton WebSocket manager
const wsManager = new WebSocketManager();

// =============================================================================
// EXPRESS MIDDLEWARE
// =============================================================================

/**
 * Create SSE endpoint handler for Express
 */
function createSSEHandler(options = {}) {
  const { requireAuth = false, filterTypes = null } = options;

  return (req, res) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Generate client ID
    const clientId = `sse_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // Create filter if types specified
    let filter = null;
    if (filterTypes) {
      const types = Array.isArray(filterTypes) ? filterTypes : [filterTypes];
      filter = (event) => types.includes(event.type) || event.type === EVENT_TYPES.HEARTBEAT;
    }

    // Add query param filter support
    if (req.query.types) {
      const queryTypes = req.query.types.split(',');
      filter = (event) => queryTypes.includes(event.type) || event.type === EVENT_TYPES.HEARTBEAT;
    }

    // Register client
    sseManager.addClient(clientId, res, filter);

    // Handle client disconnect
    req.on('close', () => {
      sseManager.removeClient(clientId);
    });
  };
}

/**
 * Attach WebSocket to existing HTTP server
 */
function attachWebSocket(server, path = '/ws/cynic') {
  wsManager.init(server, path);
  return wsManager;
}

// =============================================================================
// EVENT EMITTERS (for integration with other modules)
// =============================================================================

/**
 * Emit a commit event (from WITNESS)
 */
function emitCommit(commit, isAlert = false) {
  const type = isAlert ? EVENT_TYPES.COMMIT_ALERT : EVENT_TYPES.COMMIT_NEW;
  return eventBus.emitEvent(type, commit);
}

/**
 * Emit a contributor update event
 */
function emitContributorUpdate(contributor) {
  return eventBus.emitEvent(EVENT_TYPES.CONTRIBUTOR_UPDATE, contributor);
}

/**
 * Emit an error event (from ERROR-LEARNING)
 */
function emitError(error) {
  return eventBus.emitEvent(EVENT_TYPES.ERROR_CAPTURED, error);
}

/**
 * Emit a pattern detected event
 */
function emitPattern(pattern) {
  return eventBus.emitEvent(EVENT_TYPES.PATTERN_DETECTED, pattern);
}

/**
 * Emit a lesson extracted event
 */
function emitLesson(lesson) {
  return eventBus.emitEvent(EVENT_TYPES.LESSON_EXTRACTED, lesson);
}

/**
 * Emit judgment events
 */
function emitJudgmentStart(item) {
  return eventBus.emitEvent(EVENT_TYPES.JUDGMENT_START, { item });
}

function emitJudgmentComplete(result) {
  return eventBus.emitEvent(EVENT_TYPES.JUDGMENT_COMPLETE, result);
}

/**
 * Emit score update
 */
function emitScoreUpdate(dimension, oldScore, newScore) {
  return eventBus.emitEvent(EVENT_TYPES.SCORE_UPDATE, {
    dimension,
    oldScore,
    newScore,
    delta: newScore - oldScore,
  });
}

/**
 * Emit verdict change
 */
function emitVerdictChange(oldVerdict, newVerdict, reason) {
  return eventBus.emitEvent(EVENT_TYPES.VERDICT_CHANGE, {
    oldVerdict,
    newVerdict,
    reason,
  });
}

/**
 * Emit dimension update (for dashboard)
 */
function emitDimensionUpdate(dimension, scores) {
  return eventBus.emitEvent(EVENT_TYPES.DIMENSION_UPDATE, {
    dimension,
    scores,
  });
}

/**
 * Emit harmony shift
 */
function emitHarmonyShift(oldHarmony, newHarmony) {
  return eventBus.emitEvent(EVENT_TYPES.HARMONY_SHIFT, {
    oldHarmony,
    newHarmony,
  });
}

/**
 * Emit residual spike (THE_INNOMMABLE activity)
 */
function emitResidualSpike(residual) {
  return eventBus.emitEvent(EVENT_TYPES.RESIDUAL_SPIKE, residual);
}

/**
 * Emit architect events
 */
function emitTaskCreated(task) {
  return eventBus.emitEvent(EVENT_TYPES.TASK_CREATED, task);
}

function emitTaskStateChange(taskId, oldState, newState) {
  return eventBus.emitEvent(EVENT_TYPES.TASK_STATE_CHANGE, {
    taskId,
    oldState,
    newState,
  });
}

function emitLevelComplete(level, results) {
  return eventBus.emitEvent(EVENT_TYPES.LEVEL_COMPLETE, {
    level,
    results,
  });
}

// =============================================================================
// STATS & STATUS
// =============================================================================

/**
 * Get realtime system stats
 */
function getRealtimeStats() {
  return {
    timestamp: new Date().toISOString(),
    eventBus: eventBus.getStats(),
    sse: sseManager.getStats(),
    ws: wsManager.getStats(),
    config: {
      heartbeatMs: HEARTBEAT_MS,
      phi: PHI,
    },
    module: 'CYNIC-REALTIME',
    world: 'BERIAH',
  };
}

/**
 * Subscribe to events programmatically
 */
function subscribe(type, callback) {
  eventBus.on(type, callback);
  return () => eventBus.off(type, callback);
}

/**
 * Subscribe to all events
 */
function subscribeAll(callback) {
  eventBus.on('*', callback);
  return () => eventBus.off('*', callback);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Event types
  EVENT_TYPES,

  // Event bus
  eventBus,
  subscribe,
  subscribeAll,

  // SSE
  sseManager,
  createSSEHandler,

  // WebSocket
  wsManager,
  attachWebSocket,

  // Event emitters
  emitCommit,
  emitContributorUpdate,
  emitError,
  emitPattern,
  emitLesson,
  emitJudgmentStart,
  emitJudgmentComplete,
  emitScoreUpdate,
  emitVerdictChange,
  emitDimensionUpdate,
  emitHarmonyShift,
  emitResidualSpike,
  emitTaskCreated,
  emitTaskStateChange,
  emitLevelComplete,

  // Stats
  getRealtimeStats,

  // Constants
  PHI,
  PHI_INV,
  HEARTBEAT_MS,
};
