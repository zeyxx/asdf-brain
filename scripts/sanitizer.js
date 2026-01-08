#!/usr/bin/env node
/**
 * asdf-brain sanitizer
 *
 * Removes sensitive data before indexing following $asdfasdfa:
 * "Don't trust, verify" - but also PROTECT
 *
 * Filters:
 * - API keys, secrets, passwords
 * - Database URLs, connection strings
 * - Private keys, wallet keys
 * - Personal emails, IPs
 * - Internal URLs, paths
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// =============================================================================
// SENSITIVE PATTERNS
// =============================================================================

const PATTERNS = {
  // Secrets & Keys
  apiKey: /(?:api[_-]?key|apikey)["\s:=]+["']?([a-zA-Z0-9_\-]{20,})["']?/gi,
  secret: /(?:secret|SECRET)["\s:=]+["']?([a-zA-Z0-9_\-]{16,})["']?/gi,
  password: /(?:password|PASSWORD|passwd|pwd)["\s:=]+["']?([^\s"']{4,})["']?/gi,
  bearer: /Bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  jwt: /eyJ[a-zA-Z0-9_\-]*\.eyJ[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*/g,

  // Database & Connection Strings
  postgresUrl: /postgres(?:ql)?:\/\/[^\s"']+/gi,
  redisUrl: /redis(?:s)?:\/\/[^\s"']+/gi,
  mongoUrl: /mongodb(?:\+srv)?:\/\/[^\s"']+/gi,
  databaseUrl: /DATABASE_URL["\s:=]+["']?([^\s"']+)["']?/gi,

  // Crypto Keys
  privateKey: /(?:private[_-]?key|PRIVATE[_-]?KEY)["\s:=]+["']?([a-zA-Z0-9_\-]{32,})["']?/gi,
  solanaKey: /[1-9A-HJ-NP-Za-km-z]{87,88}/g,  // Base58 private key length
  hexKey: /(?:0x)?[a-fA-F0-9]{64}/g,  // 32-byte hex keys

  // Personal Data
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,

  // Internal Paths
  homePath: /\/home\/[a-zA-Z0-9_]+\//g,
  usersPath: /\/Users\/[a-zA-Z0-9_]+\//g,

  // Specific env vars
  envVars: /(?:HELIUS_API_KEY|ADMIN_PASSWORD|DATA_SIGNING_SECRET|NODE_PRIVATE_KEY|WHITELISTED_API_KEYS)["\s:=]+["']?([^\s"'\n]+)["']?/gi,
};

// =============================================================================
// REDACTION
// =============================================================================

const REDACTIONS = {
  apiKey: '[REDACTED_API_KEY]',
  secret: '[REDACTED_SECRET]',
  password: '[REDACTED_PASSWORD]',
  bearer: 'Bearer [REDACTED_TOKEN]',
  jwt: '[REDACTED_JWT]',
  postgresUrl: 'postgres://[REDACTED]',
  redisUrl: 'redis://[REDACTED]',
  mongoUrl: 'mongodb://[REDACTED]',
  databaseUrl: 'DATABASE_URL=[REDACTED]',
  privateKey: '[REDACTED_PRIVATE_KEY]',
  solanaKey: '[REDACTED_SOLANA_KEY]',
  hexKey: '[REDACTED_HEX_KEY]',
  email: '[REDACTED_EMAIL]',
  ipv4: '[REDACTED_IP]',
  homePath: '/home/[REDACTED]/',
  usersPath: '/Users/[REDACTED]/',
  envVars: '$1=[REDACTED]',
};

// =============================================================================
// SANITIZER FUNCTIONS
// =============================================================================

function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;
  let redactionCount = 0;

  for (const [name, pattern] of Object.entries(PATTERNS)) {
    const redaction = REDACTIONS[name];
    const matches = sanitized.match(pattern);
    if (matches) {
      redactionCount += matches.length;
      sanitized = sanitized.replace(pattern, redaction);
    }
  }

  return { text: sanitized, redactions: redactionCount };
}

function sanitizeEntry(entry) {
  let totalRedactions = 0;

  // Sanitize user content
  if (entry.user?.content) {
    const result = sanitizeText(entry.user.content);
    entry.user.content = result.text;
    totalRedactions += result.redactions;
  }

  // Sanitize assistant content
  if (entry.assistant?.content) {
    const result = sanitizeText(entry.assistant.content);
    entry.assistant.content = result.text;
    totalRedactions += result.redactions;
  }

  // Add sanitization metadata
  entry._sanitized = {
    at: new Date().toISOString(),
    redactions: totalRedactions,
  };

  return { entry, redactions: totalRedactions };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
asdf-brain sanitizer - Privacy & Security filter

Usage:
  node sanitizer.js <input.jsonl> [output.jsonl]
  node sanitizer.js --check <file.jsonl>   # Check for sensitive data
  node sanitizer.js --all                  # Sanitize all known sources

Examples:
  node sanitizer.js conversations.jsonl conversations-safe.jsonl
  node sanitizer.js --check /workspaces/HolDex/training/raw/conversations.jsonl
`);
    process.exit(0);
  }

  // Check mode
  if (args[0] === '--check') {
    const inputFile = args[1];
    if (!inputFile || !fs.existsSync(inputFile)) {
      console.error('File not found');
      process.exit(1);
    }

    console.log(`\n🔍 Checking for sensitive data in: ${inputFile}\n`);

    const fileStream = fs.createReadStream(inputFile);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineNum = 0;
    let sensitiveLines = 0;
    const samples = [];

    for await (const line of rl) {
      lineNum++;
      if (!line.trim()) continue;

      for (const [name, pattern] of Object.entries(PATTERNS)) {
        if (pattern.test(line)) {
          sensitiveLines++;
          if (samples.length < 5) {
            samples.push({ line: lineNum, type: name, preview: line.slice(0, 100) });
          }
          break;
        }
        // Reset lastIndex for global patterns
        pattern.lastIndex = 0;
      }
    }

    console.log(`📊 Results:`);
    console.log(`   Total lines: ${lineNum}`);
    console.log(`   Sensitive:   ${sensitiveLines} (${((sensitiveLines/lineNum)*100).toFixed(1)}%)`);

    if (samples.length > 0) {
      console.log(`\n⚠️  Sample sensitive lines:`);
      for (const s of samples) {
        console.log(`   Line ${s.line} [${s.type}]: ${s.preview}...`);
      }
    }

    console.log(`\n${sensitiveLines > 0 ? '❌ SANITIZATION REQUIRED' : '✅ File appears clean'}\n`);
    process.exit(sensitiveLines > 0 ? 1 : 0);
  }

  // Sanitize mode
  if (args[0] === '--all') {
    const sources = [
      '/workspaces/HolDex/training/raw/conversations.jsonl',
    ];

    for (const source of sources) {
      if (!fs.existsSync(source)) continue;
      const output = source.replace('.jsonl', '-sanitized.jsonl');
      await sanitizeFile(source, output);
    }
    return;
  }

  // Single file mode
  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace('.jsonl', '-sanitized.jsonl');

  await sanitizeFile(inputFile, outputFile);
}

async function sanitizeFile(inputFile, outputFile) {
  console.log(`\n🧹 Sanitizing: ${inputFile}`);
  console.log(`   Output: ${outputFile}\n`);

  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  const output = fs.createWriteStream(outputFile);

  let processed = 0;
  let totalRedactions = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);
      const result = sanitizeEntry(entry);
      output.write(JSON.stringify(result.entry) + '\n');
      totalRedactions += result.redactions;
      processed++;

      if (processed % 1000 === 0) {
        process.stdout.write(`\r   Processed: ${processed} entries, ${totalRedactions} redactions`);
      }
    } catch (e) {
      // Skip malformed JSON
    }
  }

  output.end();

  console.log(`\n\n✅ Complete:`);
  console.log(`   Entries processed: ${processed}`);
  console.log(`   Total redactions:  ${totalRedactions}`);
  console.log(`   Output: ${outputFile}\n`);
}

main().catch(console.error);
