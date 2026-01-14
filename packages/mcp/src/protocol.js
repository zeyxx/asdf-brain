/**
 * MCP Protocol Helpers
 *
 * JSON-RPC 2.0 utilities for MCP communication
 * "Don't trust, verify" - All responses validated
 *
 * @module @asdf/cynic-mcp/protocol
 */

'use strict';

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Send a successful JSON-RPC response
 * @param {string|number} id - Request ID
 * @param {*} result - Result data
 * @param {Function} output - Output function (default: console.log)
 */
function sendResponse(id, result, output = console.log) {
  const response = {
    jsonrpc: '2.0',
    id,
    result,
  };
  output(JSON.stringify(response));
}

/**
 * Send a JSON-RPC error response
 * @param {string|number} id - Request ID
 * @param {number} code - Error code
 * @param {string} message - Error message
 * @param {*} data - Optional error data
 * @param {Function} output - Output function (default: console.log)
 */
function sendError(id, code, message, data = null, output = console.log) {
  const response = {
    jsonrpc: '2.0',
    id,
    error: { code, message, ...(data && { data }) },
  };
  output(JSON.stringify(response));
}

/**
 * Send a JSON-RPC notification (no id, no response expected)
 * @param {string} method - Notification method
 * @param {*} params - Notification params
 * @param {Function} output - Output function (default: console.log)
 */
function sendNotification(method, params, output = console.log) {
  const notification = {
    jsonrpc: '2.0',
    method,
    params,
  };
  output(JSON.stringify(notification));
}

// =============================================================================
// ERROR CODES (JSON-RPC 2.0 Standard)
// =============================================================================

const ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,

  // Custom error codes (-32000 to -32099)
  NOT_INITIALIZED: -32002,
  TOOL_NOT_FOUND: -32001,
  RATE_LIMITED: -32003,
  UNAUTHORIZED: -32004,
};

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

/**
 * Validate a JSON-RPC request
 * @param {Object} request - Request object
 * @returns {Object} - { valid: boolean, error?: { code, message } }
 */
function validateRequest(request) {
  if (!request || typeof request !== 'object') {
    return { valid: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'Invalid request object' } };
  }

  if (request.jsonrpc !== '2.0') {
    return { valid: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'Invalid JSON-RPC version' } };
  }

  if (typeof request.method !== 'string') {
    return { valid: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'Method must be a string' } };
  }

  return { valid: true };
}

/**
 * Parse JSON safely
 * @param {string} text - JSON string
 * @returns {Object} - { success: boolean, data?: *, error?: string }
 */
function parseJson(text) {
  try {
    const data = JSON.parse(text);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

/**
 * Create a tool definition for MCP
 * @param {string} name - Tool name
 * @param {string} description - Tool description
 * @param {Object} inputSchema - JSON Schema for input
 * @returns {Object} - Tool definition
 */
function createTool(name, description, inputSchema) {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      ...inputSchema,
    },
  };
}

/**
 * Create a tool result
 * @param {*} content - Result content
 * @param {boolean} isError - Whether this is an error
 * @returns {Object} - Tool result
 */
function createToolResult(content, isError = false) {
  return {
    content: [
      {
        type: 'text',
        text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
      },
    ],
    isError,
  };
}

// =============================================================================
// STDIO HELPERS
// =============================================================================

/**
 * Create a readline interface for STDIO
 * @param {Object} options - { input, output }
 * @returns {Object} - readline interface
 */
function createStdioInterface(options = {}) {
  const readline = require('readline');
  return readline.createInterface({
    input: options.input || process.stdin,
    output: options.output || process.stdout,
    terminal: false,
  });
}

/**
 * Process STDIO messages
 * @param {Function} handler - Message handler (async)
 * @param {Object} options - { onError, onClose }
 */
function processStdio(handler, options = {}) {
  const rl = createStdioInterface();

  rl.on('line', async (line) => {
    if (!line.trim()) return;

    const parsed = parseJson(line);
    if (!parsed.success) {
      sendError(null, ERROR_CODES.PARSE_ERROR, 'Parse error', parsed.error);
      return;
    }

    const validation = validateRequest(parsed.data);
    if (!validation.valid) {
      sendError(parsed.data?.id || null, validation.error.code, validation.error.message);
      return;
    }

    try {
      await handler(parsed.data);
    } catch (e) {
      sendError(parsed.data.id, ERROR_CODES.INTERNAL_ERROR, e.message);
      if (options.onError) options.onError(e);
    }
  });

  rl.on('close', () => {
    if (options.onClose) options.onClose();
  });

  return rl;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Responses
  sendResponse,
  sendError,
  sendNotification,

  // Error codes
  ERROR_CODES,

  // Validation
  validateRequest,
  parseJson,

  // Tools
  createTool,
  createToolResult,

  // STDIO
  createStdioInterface,
  processStdio,
};
