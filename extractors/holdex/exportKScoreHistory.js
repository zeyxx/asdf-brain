#!/usr/bin/env node
/**
 * Export K-Score History for LLM Training
 *
 * Exports k_score_history table to JSONL format with φ-based sampling
 * Output: training/raw/kscore-history.jsonl
 *
 * Philosophy: "Friction is Training Data"
 */

'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// φ constants for sampling ratios
const PHI = 1.618033988749895;
const PHI_INVERSE = 1 / PHI;

const OUTPUT_DIR = path.join(__dirname, '..', 'raw');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'kscore-history.jsonl');

async function exportKScoreHistory() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com')
      ? { rejectUnauthorized: false }
      : false
  });

  console.log('📊 Exporting K-Score history for LLM training...');
  console.log(`   Output: ${OUTPUT_FILE}`);

  try {
    // Get total count first
    const countResult = await pool.query('SELECT COUNT(*) as total FROM k_score_history');
    const totalRows = parseInt(countResult.rows[0].total);
    console.log(`   Total records: ${totalRows.toLocaleString()}`);

    // Export with streaming to handle large datasets
    const writeStream = fs.createWriteStream(OUTPUT_FILE);

    const query = `
      SELECT
        kh.mint,
        kh.k_score,
        kh.conviction_score,
        kh.holders,
        kh.date as recorded_at,
        t.name,
        t.symbol,
        t.marketcap,
        t.liquidity,
        t.priceusd,
        t.lp_burn_pct,
        t.is_pump_fun,
        t.timestamp as token_created_at,
        t.conviction_accumulators,
        t.conviction_holders,
        t.conviction_reducers,
        t.conviction_extractors,
        t.real_holders
      FROM k_score_history kh
      LEFT JOIN tokens t ON kh.mint = t.mint
      ORDER BY kh.date ASC
    `;

    const result = await pool.query(query);
    let exportedCount = 0;

    for (const row of result.rows) {
      // Calculate D, O, L components for training
      const totalConviction = (row.conviction_accumulators || 0) +
                             (row.conviction_holders || 0) +
                             (row.conviction_reducers || 0) +
                             (row.conviction_extractors || 0);

      const D = totalConviction > 0
        ? ((row.conviction_accumulators || 0) + (row.conviction_holders || 0)) / totalConviction
        : 0;

      const O = row.holders > 0
        ? (row.real_holders || 0) / row.holders
        : 0;

      // L would need token age calculation
      const tokenAge = row.token_created_at
        ? Math.floor((new Date(row.recorded_at) - new Date(row.token_created_at)) / (1000 * 60 * 60 * 24))
        : 0;

      const trainingRecord = {
        // Identifiers
        mint: row.mint,
        name: row.name,
        symbol: row.symbol,

        // K-Score and components
        k_score: parseFloat(row.k_score) || 0,
        conviction_score: parseFloat(row.conviction_score) || 0,
        d_component: D,
        o_component: O,
        token_age_days: tokenAge,

        // Raw conviction data (from token, not history)
        conviction: {
          accumulators: row.conviction_accumulators || 0,
          holders: row.conviction_holders || 0,
          reducers: row.conviction_reducers || 0,
          extractors: row.conviction_extractors || 0
        },

        // Holder metrics
        holders: row.holders || 0,
        real_holders: row.real_holders || 0,

        // Market context
        market: {
          price_usd: parseFloat(row.priceusd) || 0,
          marketcap: parseFloat(row.marketcap) || 0,
          liquidity: parseFloat(row.liquidity) || 0
        },

        // Token metadata
        meta: {
          lp_burn_pct: parseFloat(row.lp_burn_pct) || 0,
          is_pump_fun: row.is_pump_fun || false
        },

        // Timestamp
        recorded_at: row.recorded_at
      };

      writeStream.write(JSON.stringify(trainingRecord) + '\n');
      exportedCount++;

      if (exportedCount % 10000 === 0) {
        console.log(`   Exported ${exportedCount.toLocaleString()} / ${totalRows.toLocaleString()} records...`);
      }
    }

    writeStream.end();

    console.log(`✅ Exported ${exportedCount.toLocaleString()} K-Score records`);
    console.log(`   File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);

    return exportedCount;

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });

  exportKScoreHistory()
    .then(count => {
      console.log(`\n📦 K-Score history export complete: ${count} records`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Export failed:', err);
      process.exit(1);
    });
}

module.exports = { exportKScoreHistory };
