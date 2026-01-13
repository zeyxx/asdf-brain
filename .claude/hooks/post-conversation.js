/**
 * CYNIC Post-Conversation Hook
 *
 * Extracts knowledge from completed conversations using brain_cynic_digest.
 * Triggered automatically when a conversation ends.
 *
 * @event PostConversation
 * @behavior non-blocking
 * @module cynic/hooks/post-conversation
 */

'use strict';

const MIN_MESSAGES_FOR_DIGEST = 5;
const MIN_CONTENT_LENGTH = 500;

/**
 * Extract relevant text from conversation messages
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
          .map(c => c.text)
          .join('\n');
      }
      return '';
    })
    .join('\n\n---\n\n');
}

/**
 * Detect project context from conversation
 */
function detectProject(text) {
  const patterns = {
    holdex: /holdex|k-?score|token.*integrit/i,
    gasdf: /gasdf|swap|burn.*token|liquidity/i,
    brain: /cynic|brain|judgment|dimension/i
  };

  for (const [project, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return project;
  }
  return 'general';
}

/**
 * Check if conversation is worth digesting
 */
function shouldDigest(messages, text) {
  if (messages.length < MIN_MESSAGES_FOR_DIGEST) return false;
  if (text.length < MIN_CONTENT_LENGTH) return false;

  // Skip if mostly tool usage without discussion
  const userMessages = messages.filter(m => m.role === 'user');
  const avgLength = userMessages.reduce((sum, m) => {
    const content = typeof m.content === 'string' ? m.content : '';
    return sum + content.length;
  }, 0) / userMessages.length;

  if (avgLength < 50) return false;

  return true;
}

/**
 * Main hook handler
 */
async function handler(context) {
  const { messages, sessionId, mcpClient } = context;

  if (!messages || !mcpClient) {
    return { success: false, reason: 'Missing required context' };
  }

  const text = extractConversationText(messages);

  if (!shouldDigest(messages, text)) {
    return {
      success: true,
      skipped: true,
      reason: 'Conversation too short or simple for digestion'
    };
  }

  const project = detectProject(text);

  try {
    // Call brain_cynic_digest MCP tool
    const result = await mcpClient.callTool('asdf-brain', 'brain_cynic_digest', {
      text: text,
      source: \`conversation:\${sessionId || 'unknown'}\`,
      existingKnowledge: []
    });

    // Log digest summary
    const digest = JSON.parse(result.content || '{}');

    return {
      success: true,
      project,
      ideas: digest.ideas?.length || 0,
      links: digest.links?.length || 0,
      roadmap: digest.roadmap?.length || 0,
      autoLearned: digest.autoLearned?.length || 0
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      reason: 'Digest failed but conversation continues'
    };
  }
}

module.exports = { handler };
