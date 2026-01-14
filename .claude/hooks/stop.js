/**
 * CYNIC Stop Hook - Session Summary, BURN Recording & Knowledge Extraction
 *
 * "Le chien qui compte les victoires ET qui n'oublie jamais"
 *
 * This hook runs when the conversation ends or Claude stops.
 * It:
 * 1. Summarizes the session burns (CODE, EGO, TIME)
 * 2. EXTRACTS KNOWLEDGE from the conversation (the Digester's role)
 * 3. Writes learned insights to live.jsonl
 *
 * @event Stop
 * @behavior non-blocking
 * @module cynic/hooks/stop
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// CONFIGURATION
// =============================================================================

const BRAIN_ROOT = process.env.BRAIN_ROOT || path.join(__dirname, '../../');
const KNOWLEDGE_DIR = path.join(BRAIN_ROOT, 'knowledge');
const BURN_STATS_PATH = path.join(KNOWLEDGE_DIR, 'burns/stats.json');
const SESSION_LOG_PATH = path.join(KNOWLEDGE_DIR, 'burns/sessions.jsonl');
const LIVE_KNOWLEDGE_PATH = path.join(KNOWLEDGE_DIR, 'learned/live.jsonl');

// Extraction thresholds
const MIN_MESSAGES_FOR_DIGEST = 3;
const MIN_CONTENT_LENGTH = 200;

// =============================================================================
// KNOWLEDGE EXTRACTION - The Digester's Soul
// =============================================================================

/**
 * Extract text content from conversation messages
 */
function extractConversationText(messages) {
  if (!Array.isArray(messages)) return '';

  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => {
      if (typeof m.content === 'string') return m.content;
      if (Array.isArray(m.content)) {
        return m.content
          .filter(c => c.type === 'text')
          .map(c => c.text || '')
          .join('\n');
      }
      return '';
    })
    .join('\n\n');
}

/**
 * Detect project from text content
 */
function detectProject(text) {
  const patterns = {
    holdex: /holdex|k-?score|token.*integrit|helius/i,
    gasdf: /gasdf|swap|burn.*token|liquidity|fee.*path/i,
    brain: /cynic|brain|judgment|dimension|n-?score|e-?score/i,
    manifesto: /philosophy|axiom|φ|burn.*dont.*extract/i
  };

  for (const [project, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return project;
  }
  return 'ecosystem';
}

/**
 * Extract decisions from conversation
 */
function extractDecisions(text) {
  const decisions = [];
  const patterns = [
    /(?:decided|let'?s|will|going to|chose to)\s+(?:use|go with|implement|create|add|remove|fix)\s+([^.!?]{10,100})/gi,
    /(?:the solution|approach|fix|implementation)(?:\s+is|\s+will be)?\s*:?\s+([^.!?]{10,100})/gi,
    /(?:merged|committed|deployed|configured|created)\s+([^.!?]{10,100})/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const decision = match[1]?.trim();
      if (decision && decision.length > 15 && !decisions.includes(decision)) {
        decisions.push(decision);
      }
    }
  }

  return decisions.slice(0, 5);
}

/**
 * Extract patterns from conversation
 */
function extractPatterns(text) {
  const patterns = [];
  const patternPatterns = [
    /(?:pattern|approach|best practice|always|never|should always|should never)\s*:?\s+([^.!?]{10,150})/gi,
    /(?:tip|trick|workaround|solution)\s*:?\s+([^.!?]{10,150})/gi
  ];

  for (const pattern of patternPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const extracted = match[1]?.trim();
      if (extracted && extracted.length > 20 && !patterns.includes(extracted)) {
        patterns.push(extracted);
      }
    }
  }

  return patterns.slice(0, 3);
}

/**
 * Extract errors and solutions from conversation
 */
function extractErrors(text) {
  const errors = [];
  const errorPatterns = [
    /(?:error|bug|issue|problem)\s*:?\s*([^.!?]{10,100})\s*(?:fixed|solved|resolved)\s+(?:by|with|using)\s+([^.!?]{10,100})/gi,
    /(?:the fix|solution|workaround)\s+(?:was|is)\s*:?\s+([^.!?]{10,150})/gi
  ];

  for (const pattern of errorPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const error = (match[1] + (match[2] ? ` → ${match[2]}` : '')).trim();
      if (error && error.length > 20 && !errors.includes(error)) {
        errors.push(error);
      }
    }
  }

  return errors.slice(0, 3);
}

/**
 * Write extracted knowledge to live.jsonl
 */
function writeKnowledge(type, content, project, context) {
  if (!content || content.length < 15) return null;

  const entry = {
    id: crypto.randomBytes(8).toString('hex'),
    type,
    content,
    context: context || 'auto-extracted from session',
    project,
    lang: 'en',
    tags: [type, project, 'auto-extracted'],
    timestamp: new Date().toISOString(),
    hash: crypto.createHash('sha256').update(content).digest('hex').slice(0, 16),
    contributor: 'cynic-digester',
    strength: 40,
    access_count: 0,
    created_at: Date.now(),
    _extracted_at: 'stop-hook'
  };

  try {
    const dir = path.dirname(LIVE_KNOWLEDGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(LIVE_KNOWLEDGE_PATH, JSON.stringify(entry) + '\n');
    return entry.id;
  } catch (e) {
    return null;
  }
}

/**
 * Main knowledge extraction function (the Digester's core)
 */
function digestConversation(messages) {
  const text = extractConversationText(messages);

  if (!messages || messages.length < MIN_MESSAGES_FOR_DIGEST) {
    return { skipped: true, reason: 'Too few messages' };
  }
  if (text.length < MIN_CONTENT_LENGTH) {
    return { skipped: true, reason: 'Content too short' };
  }

  const project = detectProject(text);
  const decisions = extractDecisions(text);
  const patterns = extractPatterns(text);
  const errors = extractErrors(text);

  const extracted = { decisions: [], patterns: [], errors: [] };

  for (const decision of decisions) {
    const id = writeKnowledge('decision', decision, project, 'Auto-extracted decision');
    if (id) extracted.decisions.push(id);
  }

  for (const pattern of patterns) {
    const id = writeKnowledge('pattern', pattern, project, 'Auto-extracted pattern');
    if (id) extracted.patterns.push(id);
  }

  for (const error of errors) {
    const id = writeKnowledge('insight', error, project, 'Auto-extracted error resolution');
    if (id) extracted.errors.push(id);
  }

  const totalExtracted = extracted.decisions.length + extracted.patterns.length + extracted.errors.length;

  return {
    skipped: false,
    project,
    extracted,
    totalExtracted,
    message: totalExtracted > 0
      ? `Digested: ${extracted.decisions.length} decisions, ${extracted.patterns.length} patterns, ${extracted.errors.length} errors`
      : 'No extractable knowledge found'
  };
}

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
function logSession(burns, stats, digest) {
  const sessionLog = {
    timestamp: new Date().toISOString(),
    burns: {
      code: burns.code,
      ego: burns.ego,
      time: burns.time,
      total: burns.code + burns.ego + burns.time
    },
    events: burns.events.slice(0, 10),
    digest: digest.skipped ? { skipped: true } : {
      project: digest.project,
      decisions: digest.extracted?.decisions?.length || 0,
      patterns: digest.extracted?.patterns?.length || 0,
      errors: digest.extracted?.errors?.length || 0,
      total: digest.totalExtracted
    },
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
function generateSummary(burns, stats, digest) {
  const totalSessionBurns = burns.code + burns.ego + burns.time;
  const lines = [];

  // Burns summary
  if (totalSessionBurns > 0) {
    const parts = [];
    if (burns.code > 0) parts.push(`Code: ${burns.code}`);
    if (burns.ego > 0) parts.push(`Ego: ${burns.ego}`);
    if (burns.time > 0) parts.push(`Time: ${burns.time}`);

    let flameEmoji = '🕯️';
    if (stats.totalBurns >= 100) flameEmoji = '🔥🔥🔥🔥🔥';
    else if (stats.totalBurns >= 50) flameEmoji = '🔥🔥🔥';
    else if (stats.totalBurns >= 20) flameEmoji = '🔥🔥';
    else if (stats.totalBurns >= 5) flameEmoji = '🔥';

    lines.push(`${flameEmoji} Burns: ${parts.join(' | ')}`);
  }

  // Digest summary
  if (!digest.skipped && digest.totalExtracted > 0) {
    lines.push(`📚 Learned: ${digest.message}`);
  }

  if (lines.length === 0) {
    return null; // Nothing to report
  }

  return `
🐕 *wag* SESSION END - CYNIC κυνικός
───────────────────────────────────────────────────
${lines.join('\n')}
📊 Total burns: ${stats.totalBurns} (${stats.sessions} sessions)

"Don't extract, burn. Don't forget, learn."
───────────────────────────────────────────────────
`;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

/**
 * Stop hook handler - Burns + Digestion combined
 */
async function handler(hookContext) {
  const { conversationData, stopReason } = hookContext;
  const messages = conversationData?.messages || [];

  // 1. Analyze burns
  const burns = analyzeBurns(conversationData);

  // 2. Digest conversation (extract knowledge) - THE DIGESTER'S SOUL
  const digest = digestConversation(messages);

  // 3. Update burn stats
  const stats = updateBurnStats(burns);

  // 4. Log session (with digest info)
  logSession(burns, stats, digest);

  // 5. Generate summary message
  const summary = generateSummary(burns, stats, digest);

  return {
    continue: true,
    message: summary,
    burns: {
      session: burns,
      cumulative: stats
    },
    digest: digest.skipped ? null : {
      project: digest.project,
      extracted: digest.totalExtracted,
      details: digest.extracted
    }
  };
}

module.exports = { handler };
