/**
 * data-sources.js - Unified data source configuration for asdf-brain extractors
 *
 * Philosophy: Multiple inputs, unified processing
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BRAIN_ROOT = path.join(__dirname, '../..');
const KNOWLEDGE_ROOT = path.join(BRAIN_ROOT, 'knowledge');

// =============================================================================
// DATA SOURCES - Priority ordered
// =============================================================================

const DATA_SOURCES = [
  // Brain's own learned data (highest priority)
  {
    name: 'brain-learned',
    path: path.join(KNOWLEDGE_ROOT, 'learned/transcripts.jsonl'),
    format: 'brain',
  },
  // Brain's ingested data
  {
    name: 'brain-ingested',
    path: path.join(KNOWLEDGE_ROOT, 'ingested'),
    format: 'brain',
    isDirectory: true,
  },
  // HolDex training data (if available in ecosystem)
  {
    name: 'holdex-safe',
    path: '/workspaces/HolDex/training/raw/conversations-safe.jsonl',
    format: 'holdex',
  },
  {
    name: 'holdex-ecosystem',
    path: '/workspaces/asdfasdfa-ecosystem/HolDex/training/raw/conversations-safe.jsonl',
    format: 'holdex',
  },
];

// =============================================================================
// FORMAT NORMALIZERS
// =============================================================================

/**
 * Normalize entry to unified format
 * Returns: { user: string, assistant: string, timestamp, session_id, source }
 */
function normalizeEntry(entry, format) {
  switch (format) {
    case 'brain':
      // Brain format: { type: 'human'|'assistant', content, timestamp, source, session_id }
      return {
        type: entry.type,
        content: entry.content || '',
        timestamp: entry.timestamp,
        session_id: entry.session_id,
        source: entry.source,
      };

    case 'holdex':
      // HolDex format: { user: { content }, assistant: { content }, session_id, timestamp }
      return {
        user: entry.user?.content || '',
        assistant: entry.assistant?.content || '',
        timestamp: entry.timestamp,
        session_id: entry.session_id,
        source: 'holdex',
      };

    default:
      return entry;
  }
}

/**
 * Convert brain format (separate messages) to conversation pairs
 */
function pairBrainMessages(entries) {
  const pairs = [];
  let currentPair = {};

  for (const entry of entries) {
    if (entry.type === 'human') {
      // Start new pair
      if (currentPair.user) {
        pairs.push(currentPair);
      }
      currentPair = {
        user: { content: entry.content },
        timestamp: entry.timestamp,
        session_id: entry.session_id,
        source: entry.source,
      };
    } else if (entry.type === 'assistant') {
      currentPair.assistant = { content: entry.content };
      if (!currentPair.timestamp) {
        currentPair.timestamp = entry.timestamp;
      }
      pairs.push(currentPair);
      currentPair = {};
    }
  }

  // Don't forget last pair
  if (currentPair.user) {
    pairs.push(currentPair);
  }

  return pairs;
}

// =============================================================================
// DATA LOADING
// =============================================================================

/**
 * Find first available data source
 */
function findDataSource() {
  for (const source of DATA_SOURCES) {
    if (source.isDirectory) {
      if (fs.existsSync(source.path)) {
        const files = fs.readdirSync(source.path).filter(f => f.endsWith('.jsonl'));
        if (files.length > 0) {
          return { ...source, files: files.map(f => path.join(source.path, f)) };
        }
      }
    } else if (fs.existsSync(source.path)) {
      return source;
    }
  }
  return null;
}

/**
 * Load all available data as conversation pairs
 */
async function loadConversations(options = {}) {
  const { maxEntries = Infinity, verbose = false } = options;

  const source = findDataSource();
  if (!source) {
    throw new Error('No data source available. Run: npm run brain:learn');
  }

  if (verbose) {
    console.log(`📂 Using data source: ${source.name}`);
  }

  const entries = [];
  const files = source.files || [source.path];

  for (const filePath of files) {
    if (verbose) {
      console.log(`   Reading: ${path.basename(filePath)}`);
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      if (entries.length >= maxEntries) break;

      try {
        const entry = JSON.parse(line);
        const normalized = normalizeEntry(entry, source.format);
        entries.push(normalized);
      } catch (e) {
        // Skip malformed lines
      }
    }

    if (entries.length >= maxEntries) break;
  }

  // Convert to conversation pairs if brain format
  if (source.format === 'brain') {
    const pairs = pairBrainMessages(entries);
    if (verbose) {
      console.log(`   Paired ${entries.length} messages into ${pairs.length} conversations`);
    }
    return pairs;
  }

  return entries;
}

/**
 * Stream conversations (for large datasets)
 */
async function* streamConversations(options = {}) {
  const source = findDataSource();
  if (!source) {
    throw new Error('No data source available');
  }

  const files = source.files || [source.path];
  let buffer = [];

  for (const filePath of files) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);
        const normalized = normalizeEntry(entry, source.format);

        if (source.format === 'brain') {
          buffer.push(normalized);

          // Yield when we have a complete pair
          if (normalized.type === 'assistant' && buffer.length >= 2) {
            const pairs = pairBrainMessages(buffer);
            for (const pair of pairs) {
              yield pair;
            }
            buffer = [];
          }
        } else {
          yield normalized;
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
  }

  // Yield remaining buffer
  if (buffer.length > 0 && source.format === 'brain') {
    const pairs = pairBrainMessages(buffer);
    for (const pair of pairs) {
      yield pair;
    }
  }
}

module.exports = {
  DATA_SOURCES,
  BRAIN_ROOT,
  KNOWLEDGE_ROOT,
  findDataSource,
  loadConversations,
  streamConversations,
  normalizeEntry,
  pairBrainMessages,
};
