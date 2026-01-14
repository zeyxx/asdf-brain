/**
 * CYNIC Guardian Hook - PreToolUse
 *
 * Protects against risky operations by blocking destructive commands
 * and writes to sensitive files. Requires explicit user confirmation.
 *
 * @event PreToolUse
 * @behavior blocking
 * @module cynic/hooks/pre-tool-use
 */

'use strict';

// High-risk command patterns (BLOCK - require confirmation)
const HIGH_RISK_PATTERNS = [
  { pattern: /rm\s+(-[rf]+\s+)*\//, reason: 'Deleting from root', risk: 'critical' },
  { pattern: /rm\s+-rf\s+/, reason: 'Recursive force delete', risk: 'high' },
  { pattern: /git\s+push\s+.*--force/, reason: 'Force push (history rewrite)', risk: 'high' },
  { pattern: /git\s+push\s+-f\s+/, reason: 'Force push (history rewrite)', risk: 'high' },
  { pattern: /git\s+reset\s+--hard/, reason: 'Hard reset (loses changes)', risk: 'high' },
  { pattern: /DROP\s+TABLE/i, reason: 'Dropping database table', risk: 'critical' },
  { pattern: /DROP\s+DATABASE/i, reason: 'Dropping database', risk: 'critical' },
  { pattern: /DELETE\s+FROM\s+\w+\s*(;|$)/i, reason: 'Delete all rows (no WHERE)', risk: 'high' },
  { pattern: /TRUNCATE\s+TABLE/i, reason: 'Truncating table', risk: 'high' },
  { pattern: />\s*\/dev\/sd[a-z]/, reason: 'Writing to block device', risk: 'critical' },
  { pattern: /mkfs\s+/, reason: 'Formatting filesystem', risk: 'critical' },
  { pattern: /dd\s+.*of=\/dev\//, reason: 'Writing to device', risk: 'critical' }
];

// Sensitive file patterns (BLOCK - require confirmation)
const SENSITIVE_FILE_PATTERNS = [
  { pattern: /\.env($|\.)/, reason: 'Environment file (may contain secrets)' },
  { pattern: /credentials/i, reason: 'Credentials file' },
  { pattern: /secret/i, reason: 'Secrets file' },
  { pattern: /password/i, reason: 'Password file' },
  { pattern: /\.pem$/, reason: 'Private key file' },
  { pattern: /\.key$/, reason: 'Key file' },
  { pattern: /id_rsa/, reason: 'SSH private key' },
  { pattern: /id_ed25519/, reason: 'SSH private key' },
  { pattern: /\.p12$/, reason: 'PKCS12 certificate' },
  { pattern: /\.pfx$/, reason: 'PKCS12 certificate' },
  { pattern: /token/i, reason: 'Token file' },
  { pattern: /api[_-]?key/i, reason: 'API key file' }
];

// Medium-risk patterns (WARN - log only, don't block)
const MEDIUM_RISK_PATTERNS = [
  { pattern: /git\s+checkout\s+(main|master)/, reason: 'Switching to main branch' },
  { pattern: /npm\s+install\s+--force/, reason: 'Force npm install' },
  { pattern: /yarn\s+install\s+--force/, reason: 'Force yarn install' }
];

/**
 * Check if command matches any risky pattern
 */
function checkCommandRisk(command) {
  if (!command) return null;

  for (const { pattern, reason, risk } of HIGH_RISK_PATTERNS) {
    if (pattern.test(command)) {
      return { blocked: true, reason, risk, pattern: pattern.toString() };
    }
  }

  for (const { pattern, reason } of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(command)) {
      return { blocked: false, warning: true, reason };
    }
  }

  return null;
}

/**
 * Check if file path is sensitive
 */
function checkFileSensitivity(filePath) {
  if (!filePath) return null;

  const fileName = filePath.split('/').pop() || filePath;

  for (const { pattern, reason } of SENSITIVE_FILE_PATTERNS) {
    if (pattern.test(fileName) || pattern.test(filePath)) {
      return { blocked: true, reason, file: fileName };
    }
  }

  return null;
}

/**
 * Format guardian message
 */
function formatGuardianMessage(check, toolName, context) {
  if (check.blocked) {
    return `🐕 *GROWL* CYNIC GUARDIAN ALERT
═══════════════════════════════════════════════════

⚠️  RISKY OPERATION DETECTED

Tool: ${toolName}
Risk Level: ${check.risk || 'HIGH'}
Reason: ${check.reason}

${context || ''}

To proceed, please confirm this operation is intentional.

───────────────────────────────────────────────────
🐕 κυνικός | Protecting against: ${check.reason}`;
  }

  if (check.warning) {
    return `🐕 *alert ears* CYNIC GUARDIAN WARNING
═══════════════════════════════════════════════════

⚡ CAUTION ADVISED

Tool: ${toolName}
Note: ${check.reason}

Proceeding, but logging for review.

───────────────────────────────────────────────────
🐕 κυνικός | Watching for: ${check.reason}`;
  }

  return null;
}

/**
 * Main hook handler
 */
async function handler(context) {
  const { toolName, toolInput } = context;

  // Skip if no tool
  if (!toolName) {
    return { continue: true };
  }

  // Check Bash commands
  if (toolName === 'Bash') {
    const command = toolInput?.command;
    const commandCheck = checkCommandRisk(command);

    if (commandCheck?.blocked) {
      const message = formatGuardianMessage(
        commandCheck,
        'Bash',
        `Command: ${command?.substring(0, 100)}${command?.length > 100 ? '...' : ''}`
      );

      return {
        continue: false,
        decision: 'block',
        message,
        reason: commandCheck.reason
      };
    }

    if (commandCheck?.warning) {
      // Log warning but don't block
      console.error(formatGuardianMessage(commandCheck, 'Bash'));
    }
  }

  // Check Write/Edit to sensitive files
  if (toolName === 'Write' || toolName === 'Edit') {
    const filePath = toolInput?.file_path;
    const fileCheck = checkFileSensitivity(filePath);

    if (fileCheck?.blocked) {
      const message = formatGuardianMessage(
        fileCheck,
        toolName,
        `File: ${filePath}`
      );

      return {
        continue: false,
        decision: 'block',
        message,
        reason: fileCheck.reason
      };
    }
  }

  // All clear
  return { continue: true };
}

module.exports = { handler };
