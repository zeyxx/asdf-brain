/**
 * CYNIC Stop Hook - Session Summary & BURN Recording
 *
 * "Le chien qui compte les victoires" - CYNIC tracks your burns
 *
 * This hook runs when the conversation ends or Claude stops.
 * It summarizes the session and records any BURN activities.
 *
 * @event Stop
 * @behavior non-blocking
 * @module cynic/hooks/stop
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const BRAIN_ROOT = process.env.BRAIN_ROOT || path.join(__dirname, '../../');
const KNOWLEDGE_DIR = path.join(BRAIN_ROOT, 'knowledge');
const BURN_STATS_PATH = path.join(KNOWLEDGE_DIR, 'burns/stats.json');
const SESSION_LOG_PATH = path.join(KNOWLEDGE_DIR, 'burns/sessions.jsonl');

// =============================================================================
// BURN DETECTION
// =============================================================================

/**
 * Analyze conversation for BURN activities
 */
function analyzeBurns(conversationData) {
  const burns = {
    code: 0,
    ego: 0,
    time: 0,
    events: []
  };
  
  if (!conversationData || !conversationData.messages) {
    return burns;
  }
  
  const messages = conversationData.messages;
  
  for (const msg of messages) {
    const content = typeof msg.content === 'string' ? msg.content : 
                    Array.isArray(msg.content) ? msg.content.map(c => c.text || '').join(' ') : '';
    const contentLower = content.toLowerCase();
    
    // Code BURN indicators
    if (contentLower.includes('removed') || contentLower.includes('deleted') ||
        contentLower.includes('simplified') || contentLower.includes('refactored')) {
      burns.code++;
      burns.events.push({ type: 'code', action: 'simplification detected' });
    }
    
    // Lines removed (from diffs or mentions)
    const linesRemovedMatch = content.match(/[-]\d+\s+lines?|removed?\s+(\d+)\s+lines?/i);
    if (linesRemovedMatch) {
      const count = parseInt(linesRemovedMatch[1]) || 1;
      burns.code += Math.min(count, 10); // Cap at 10 per match
      burns.events.push({ type: 'code', action: `${count} lines removed` });
    }
    
    // Ego BURN indicators (assumptions challenged)
    if (contentLower.includes('actually') || contentLower.includes('i was wrong') ||
        contentLower.includes("didn't realize") || contentLower.includes('good point') ||
        contentLower.includes('/judge') || contentLower.includes('/learn')) {
      burns.ego++;
      burns.events.push({ type: 'ego', action: 'assumption challenged' });
    }
    
    // Time BURN indicators (using past solutions)
    if (contentLower.includes('/search') || contentLower.includes('/patterns') ||
        contentLower.includes('found a pattern') || contentLower.includes('similar to') ||
        contentLower.includes('we did this before')) {
      burns.time++;
      burns.events.push({ type: 'time', action: 'past solution referenced' });
    }
  }
  
  return burns;
}

/**
 * Update burn stats file
 */
function updateBurnStats(burns) {
  let stats = {
    totalBurns: 0,
    codeBurns: 0,
    egoBurns: 0,
    timeSaved: 0,
    sessions: 0,
    lastUpdate: null
  };
  
  // Load existing stats
  if (fs.existsSync(BURN_STATS_PATH)) {
    try {
      stats = JSON.parse(fs.readFileSync(BURN_STATS_PATH, 'utf-8'));
    } catch (e) { /* use defaults */ }
  }
  
  // Update stats
  stats.codeBurns = (stats.codeBurns || 0) + burns.code;
  stats.egoBurns = (stats.egoBurns || 0) + burns.ego;
  stats.timeSaved = (stats.timeSaved || 0) + burns.time;
  stats.totalBurns = stats.codeBurns + stats.egoBurns + stats.timeSaved;
  stats.sessions = (stats.sessions || 0) + 1;
  stats.lastUpdate = new Date().toISOString();
  
  // Save updated stats
  try {
    const dir = path.dirname(BURN_STATS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BURN_STATS_PATH, JSON.stringify(stats, null, 2));
  } catch (e) {
    console.error('[CYNIC Stop] Failed to save burn stats:', e.message);
  }
  
  return stats;
}

/**
 * Log session summary
 */
function logSession(burns, stats) {
  const sessionLog = {
    timestamp: new Date().toISOString(),
    burns: {
      code: burns.code,
      ego: burns.ego,
      time: burns.time,
      total: burns.code + burns.ego + burns.time
    },
    events: burns.events.slice(0, 10), // Limit events
    cumulativeTotal: stats.totalBurns
  };
  
  try {
    const dir = path.dirname(SESSION_LOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(SESSION_LOG_PATH, JSON.stringify(sessionLog) + '\n');
  } catch (e) {
    // Silent fail
  }
  
  return sessionLog;
}

/**
 * Generate session summary message
 */
function generateSummary(burns, stats) {
  const totalSessionBurns = burns.code + burns.ego + burns.time;
  
  if (totalSessionBurns === 0) {
    return null; // No burns to report
  }
  
  const parts = [];
  if (burns.code > 0) parts.push(`Code: ${burns.code}`);
  if (burns.ego > 0) parts.push(`Ego: ${burns.ego}`);
  if (burns.time > 0) parts.push(`Time: ${burns.time}`);
  
  // Calculate flame level
  let flameEmoji = '🕯️';
  if (stats.totalBurns >= 100) flameEmoji = '🔥🔥🔥🔥🔥';
  else if (stats.totalBurns >= 50) flameEmoji = '🔥🔥🔥';
  else if (stats.totalBurns >= 20) flameEmoji = '🔥🔥';
  else if (stats.totalBurns >= 5) flameEmoji = '🔥';
  
  return `
🐕 *wag* SESSION BURNS RECORDED
───────────────────────────────────────────────────
${flameEmoji} This session: ${parts.join(' | ')}
📊 Total burns: ${stats.totalBurns} (${stats.sessions} sessions)

"Don't extract, burn." - Your flame grows.
───────────────────────────────────────────────────
`;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

/**
 * Stop hook handler
 */
async function handler(hookContext) {
  const { conversationData, stopReason } = hookContext;
  
  // Analyze burns from conversation
  const burns = analyzeBurns(conversationData);
  
  // Update stats
  const stats = updateBurnStats(burns);
  
  // Log session
  logSession(burns, stats);
  
  // Generate summary message (only if there were burns)
  const summary = generateSummary(burns, stats);
  
  return {
    continue: true,
    message: summary,
    burns: {
      session: burns,
      cumulative: stats
    }
  };
}

module.exports = { handler };
