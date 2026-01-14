/**
 * CYNIC UserPromptSubmit Hook - Context Injection
 *
 * "Le chien qui écoute" - CYNIC listens and injects relevant context
 *
 * This hook runs when the user submits a prompt.
 * It can inject relevant patterns, past decisions, or warnings.
 *
 * @event UserPromptSubmit
 * @behavior non-blocking (adds context, doesn't block)
 * @module cynic/hooks/user-prompt-submit
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const BRAIN_ROOT = process.env.BRAIN_ROOT || path.join(__dirname, '../../');
const KNOWLEDGE_DIR = path.join(BRAIN_ROOT, 'knowledge');

// φ constants - import from canonical source
const { PHI_INV, PHI_INV_2 } = require('../../packages/core/src/axioms/constants');

// Keywords that trigger context injection
const TRIGGER_KEYWORDS = {
  decision: ['decide', 'décider', 'should', 'devrait', 'choose', 'choisir', 'which', 'quel'],
  architecture: ['architecture', 'design', 'structure', 'pattern', 'refactor'],
  danger: ['delete', 'remove', 'drop', 'force', 'reset', 'rm -rf', 'push --force'],
  debug: ['error', 'bug', 'fail', 'broken', 'crash', 'doesn\'t work', 'ne marche pas'],
  burn: ['simplify', 'simplifier', 'reduce', 'remove', 'clean', 'burn', 'delete unused']
};

// =============================================================================
// CONTEXT DETECTION
// =============================================================================

/**
 * Detect what type of task the user is working on
 */
function detectTaskType(prompt) {
  const promptLower = prompt.toLowerCase();
  
  for (const [type, keywords] of Object.entries(TRIGGER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (promptLower.includes(keyword)) {
        return type;
      }
    }
  }
  
  return null;
}

/**
 * Search for relevant patterns
 */
function findRelevantPatterns(prompt, limit = 3) {
  const patternsPath = path.join(KNOWLEDGE_DIR, 'brain/patterns.json');
  if (!fs.existsSync(patternsPath)) return [];
  
  try {
    const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
    const promptWords = prompt.toLowerCase().split(/\s+/);
    
    const scored = Object.entries(patterns)
      .map(([name, data]) => {
        const nameLower = name.toLowerCase();
        let score = 0;
        for (const word of promptWords) {
          if (word.length > 3 && nameLower.includes(word)) {
            score += 1;
          }
        }
        return { name, data, score };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return scored;
  } catch (e) {
    return [];
  }
}

/**
 * Search for relevant past decisions
 */
function findRelevantDecisions(prompt, limit = 2) {
  const decisionsDir = path.join(KNOWLEDGE_DIR, 'cynic/decisions');
  if (!fs.existsSync(decisionsDir)) return [];
  
  try {
    const files = fs.readdirSync(decisionsDir).filter(f => f.endsWith('.json'));
    const promptWords = prompt.toLowerCase().split(/\s+/);
    
    const scored = [];
    for (const file of files.slice(-20)) { // Only check recent
      try {
        const content = JSON.parse(fs.readFileSync(path.join(decisionsDir, file), 'utf-8'));
        const text = JSON.stringify(content).toLowerCase();
        let score = 0;
        for (const word of promptWords) {
          if (word.length > 3 && text.includes(word)) {
            score += 1;
          }
        }
        if (score > 0) {
          scored.push({ file, content, score });
        }
      } catch (e) { /* skip */ }
    }
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

// =============================================================================
// CONTEXT INJECTION GENERATORS
// =============================================================================

/**
 * Generate danger warning
 */
function generateDangerWarning(prompt) {
  const dangerPatterns = [
    { pattern: /rm\s+-rf\s+\//, message: 'Deleting from root - extremely dangerous' },
    { pattern: /git\s+push\s+.*--force/, message: 'Force push will rewrite history' },
    { pattern: /git\s+reset\s+--hard/, message: 'Hard reset will lose uncommitted changes' },
    { pattern: /drop\s+table/i, message: 'Dropping table is irreversible' },
    { pattern: /delete\s+from\s+\w+\s*;/i, message: 'DELETE without WHERE affects all rows' }
  ];
  
  for (const { pattern, message } of dangerPatterns) {
    if (pattern.test(prompt)) {
      return `🐕 *GROWL* GUARDIAN ALERT: ${message}. Verify before proceeding.`;
    }
  }
  
  return null;
}

/**
 * Generate decision context
 */
function generateDecisionContext(patterns, decisions) {
  const lines = [];
  
  if (patterns.length > 0) {
    lines.push('🐕 *sniff* Relevant patterns detected:');
    for (const p of patterns) {
      lines.push(`   • ${p.name} (seen ${p.data.count || '?'}×)`);
    }
  }
  
  if (decisions.length > 0) {
    lines.push('🐕 Past decisions on similar topics:');
    for (const d of decisions) {
      const summary = d.content.summary || d.content.title || d.file;
      lines.push(`   • ${summary.slice(0, 80)}`);
    }
  }
  
  if (lines.length > 0) {
    lines.push('');
    lines.push('   Consider: /judge to evaluate your decision');
  }
  
  return lines.length > 0 ? lines.join('\n') : null;
}

/**
 * Generate debug context
 */
function generateDebugContext(prompt) {
  // Check for common error patterns in knowledge
  const errorsPath = path.join(KNOWLEDGE_DIR, 'cynic/errors');
  if (!fs.existsSync(errorsPath)) return null;
  
  try {
    const files = fs.readdirSync(errorsPath).filter(f => f.endsWith('.json'));
    const promptWords = prompt.toLowerCase().split(/\s+/);
    
    for (const file of files.slice(-10)) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(errorsPath, file), 'utf-8'));
        const text = JSON.stringify(content).toLowerCase();
        
        let matches = 0;
        for (const word of promptWords) {
          if (word.length > 4 && text.includes(word)) matches++;
        }
        
        if (matches >= 2 && content.solution) {
          return `🐕 *ears perk* Similar error was solved before:\n   Problem: ${content.problem?.slice(0, 60) || 'unknown'}...\n   Solution: ${content.solution.slice(0, 80)}...\n   Use /search to find full details.`;
        }
      } catch (e) { /* skip */ }
    }
  } catch (e) { /* ignore */ }
  
  return null;
}

/**
 * Generate burn encouragement
 */
function generateBurnContext() {
  const encouragements = [
    '🔥 BURN mode: Every line removed is a victory.',
    '🔥 Simplification in progress. Less is more.',
    '🔥 "Don\'t extract, burn" - removing complexity.'
  ];
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

/**
 * UserPromptSubmit hook handler
 */
async function handler(hookContext) {
  const { prompt } = hookContext;
  
  if (!prompt || prompt.length < 10) {
    return { continue: true };
  }
  
  const injections = [];
  
  // Detect task type
  const taskType = detectTaskType(prompt);
  
  // Check for danger first (highest priority)
  const dangerWarning = generateDangerWarning(prompt);
  if (dangerWarning) {
    injections.push(dangerWarning);
  }
  
  // Task-specific context
  switch (taskType) {
    case 'decision':
    case 'architecture': {
      const patterns = findRelevantPatterns(prompt);
      const decisions = findRelevantDecisions(prompt);
      const context = generateDecisionContext(patterns, decisions);
      if (context) injections.push(context);
      break;
    }
    
    case 'debug': {
      const debugContext = generateDebugContext(prompt);
      if (debugContext) injections.push(debugContext);
      break;
    }
    
    case 'burn': {
      injections.push(generateBurnContext());
      break;
    }
  }
  
  // Build response
  if (injections.length === 0) {
    return { continue: true };
  }
  
  return {
    continue: true,
    message: injections.join('\n\n')
  };
}

module.exports = { handler };
