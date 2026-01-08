#!/usr/bin/env node
/**
 * Export Claude-Mem Data for LLM Training
 *
 * Exports observations, sessions, and prompts from claude-mem
 * Output: training/raw/claude-mem-observations.jsonl
 *
 * Philosophy: "Don't Trust, Verify" - All AI decisions are recorded
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PHI = 1.618033988749895;

// claude-mem data location (persistent)
const CLAUDE_MEM_DB = '/workspaces/.claude-mem-data/claude-mem.db';
const OUTPUT_DIR = path.join(__dirname, '..', 'raw');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'claude-mem-observations.jsonl');

// Observation type weights (φ-based)
const TYPE_WEIGHTS = {
  decision: PHI * PHI,    // 2.618 - Decisions shape architecture
  feature: PHI * PHI,     // 2.618 - Features are BUILD
  bugfix: PHI,            // 1.618 - Fixes are valuable
  refactor: PHI,          // 1.618 - Refactors improve quality
  discovery: 1.0,         // 1.0 - Discoveries inform
  change: 1 / PHI,        // 0.618 - Generic changes
};

// Concept weights (what kind of knowledge)
const CONCEPT_WEIGHTS = {
  'how-it-works': PHI,
  'why-it-exists': PHI * PHI,  // Highest - understanding purpose
  'what-changed': 1.0,
  'problem-solution': PHI,
  'gotcha': PHI,               // Important to learn from
  'pattern': PHI * PHI,        // Patterns are reusable
  'trade-off': PHI,
};

async function exportClaudeMem() {
  console.log('🧠 Exporting claude-mem data for LLM training...');
  console.log(`   Source: ${CLAUDE_MEM_DB}`);
  console.log(`   Output: ${OUTPUT_FILE}`);

  // Check if DB exists
  if (!fs.existsSync(CLAUDE_MEM_DB)) {
    console.log('⚠️  claude-mem database not found, skipping...');
    return { observations: 0, sessions: 0, prompts: 0, total: 0 };
  }

  const writeStream = fs.createWriteStream(OUTPUT_FILE);
  let exportedCount = 0;

  try {
    // Export observations using sqlite3 CLI
    const obsJson = execFileSync('sqlite3', [
      CLAUDE_MEM_DB,
      '-json',
      `SELECT
        o.*,
        s.user_prompt as session_prompt,
        s.started_at as session_started
      FROM observations o
      LEFT JOIN sdk_sessions s ON o.memory_session_id = s.memory_session_id
      ORDER BY o.created_at_epoch ASC`
    ], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });

    let observations = [];
    try {
      observations = JSON.parse(obsJson || '[]');
    } catch (e) {
      observations = [];
    }

    console.log(`   Found ${observations.length} observations`);

    for (const obs of observations) {
      // Parse JSON fields safely
      let facts = [], concepts = [], filesRead = [], filesModified = [];
      try { facts = JSON.parse(obs.facts || '[]'); } catch (e) {}
      try { concepts = JSON.parse(obs.concepts || '[]'); } catch (e) {}
      try { filesRead = JSON.parse(obs.files_read || '[]'); } catch (e) {}
      try { filesModified = JSON.parse(obs.files_modified || '[]'); } catch (e) {}

      const typeWeight = TYPE_WEIGHTS[obs.type] || 1.0;
      const conceptWeight = concepts.reduce((sum, c) => sum + (CONCEPT_WEIGHTS[c] || 1.0), 0) / Math.max(concepts.length, 1);

      const record = {
        id: obs.id,
        project: obs.project,
        session_id: obs.memory_session_id,
        type: obs.type,
        title: obs.title,
        subtitle: obs.subtitle,
        text: obs.text,
        narrative: obs.narrative,
        facts,
        concepts,
        files_read: filesRead,
        files_modified: filesModified,
        weights: { type_weight: typeWeight, concept_weight: conceptWeight, combined_weight: typeWeight * conceptWeight },
        prompt_number: obs.prompt_number,
        created_at: obs.created_at,
        discovery_tokens: obs.discovery_tokens || 0,
        session: { prompt: obs.session_prompt, started_at: obs.session_started }
      };

      writeStream.write(JSON.stringify(record) + '\n');
      exportedCount++;
    }

    // Export session summaries
    const summariesJson = execFileSync('sqlite3', [
      CLAUDE_MEM_DB, '-json',
      'SELECT * FROM session_summaries ORDER BY created_at_epoch ASC'
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

    let summaries = [];
    try { summaries = JSON.parse(summariesJson || '[]'); } catch (e) {}

    console.log(`   Found ${summaries.length} session summaries`);

    for (const summary of summaries) {
      let filesRead = [], filesEdited = [];
      try { filesRead = JSON.parse(summary.files_read || '[]'); } catch (e) {}
      try { filesEdited = JSON.parse(summary.files_edited || '[]'); } catch (e) {}

      const record = {
        type: 'session_summary',
        session_id: summary.memory_session_id,
        project: summary.project,
        request: summary.request,
        investigated: summary.investigated,
        learned: summary.learned,
        completed: summary.completed,
        next_steps: summary.next_steps,
        notes: summary.notes,
        files_read: filesRead,
        files_edited: filesEdited,
        prompt_number: summary.prompt_number,
        created_at: summary.created_at,
        discovery_tokens: summary.discovery_tokens || 0,
        weights: { type_weight: PHI * PHI, combined_weight: PHI * PHI }
      };

      writeStream.write(JSON.stringify(record) + '\n');
      exportedCount++;
    }

    // Export user prompts
    const promptsJson = execFileSync('sqlite3', [
      CLAUDE_MEM_DB, '-json',
      'SELECT * FROM user_prompts ORDER BY created_at_epoch ASC'
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

    let prompts = [];
    try { prompts = JSON.parse(promptsJson || '[]'); } catch (e) {}

    console.log(`   Found ${prompts.length} user prompts`);

    for (const prompt of prompts) {
      const record = {
        type: 'user_prompt',
        session_id: prompt.content_session_id,
        prompt_number: prompt.prompt_number,
        content: prompt.content,
        created_at: prompt.created_at,
        weights: { type_weight: 1 / PHI, combined_weight: 1 / PHI }
      };

      writeStream.write(JSON.stringify(record) + '\n');
      exportedCount++;
    }

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      writeStream.end();
    });

    const stats = {
      observations: observations.length,
      summaries: summaries.length,
      prompts: prompts.length,
      total: exportedCount
    };

    // Type distribution
    const typeDistribution = {};
    for (const obs of observations) {
      typeDistribution[obs.type] = (typeDistribution[obs.type] || 0) + 1;
    }

    console.log('\n📊 Export Statistics:');
    console.log(`   Observations: ${stats.observations}`);
    console.log(`   Summaries:    ${stats.summaries}`);
    console.log(`   Prompts:      ${stats.prompts}`);
    console.log(`   Total:        ${stats.total}`);

    if (Object.keys(typeDistribution).length > 0) {
      console.log('\n   By type:');
      for (const [type, count] of Object.entries(typeDistribution)) {
        console.log(`   • ${type}: ${count}`);
      }
    }

    const fileSize = fs.statSync(OUTPUT_FILE).size / 1024;
    console.log(`\n✅ claude-mem export complete`);
    console.log(`   File size: ${fileSize.toFixed(2)} KB`);

    return stats;

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    writeStream.end();
    throw error;
  }
}

if (require.main === module) {
  exportClaudeMem()
    .then(stats => {
      console.log(`\n📦 claude-mem export complete: ${stats.total || stats.observations} records`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Export failed:', err);
      process.exit(1);
    });
}

module.exports = { exportClaudeMem };
