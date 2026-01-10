#!/usr/bin/env node
/**
 * Export Holder Snapshots for LLM Training
 *
 * Exports holder_snapshots with conviction classification
 * Output: training/raw/holder-snapshots.jsonl
 *
 * Philosophy: "Conviction > Speculation"
 */

'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = require('../../lib/temporal');

const OUTPUT_DIR = path.join(__dirname, '..', 'raw');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'holder-snapshots.jsonl');

async function exportHolderSnapshots() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com')
      ? { rejectUnauthorized: false }
      : false
  });

  console.log('👥 Exporting holder snapshots for LLM training...');
  console.log(`   Output: ${OUTPUT_FILE}`);

  try {
    const countResult = await pool.query('SELECT COUNT(*) as total FROM holder_snapshots');
    const totalRows = parseInt(countResult.rows[0].total);
    console.log(`   Total records: ${totalRows.toLocaleString()}`);

    const writeStream = fs.createWriteStream(OUTPUT_FILE);

    // Query with token context
    const query = `
      SELECT
        hs.mint,
        hs.holder as wallet,
        hs.balance,
        hs.net_flow as balance_change,
        hs.conviction_class,
        hs.updated_at as snapshot_time,
        hs.last_tx_timestamp,
        hs.buy_count,
        hs.sell_count,
        t.name,
        t.symbol,
        t.supply,
        t.k_score
      FROM holder_snapshots hs
      LEFT JOIN tokens t ON hs.mint = t.mint
      ORDER BY hs.updated_at ASC
    `;

    const result = await pool.query(query);
    let exportedCount = 0;

    for (const row of result.rows) {
      // Calculate holding percentage
      const holdingPct = row.supply > 0
        ? (parseFloat(row.balance) / parseFloat(row.supply)) * 100
        : 0;

      const trainingRecord = {
        // Identifiers
        mint: row.mint,
        wallet: row.wallet,
        token_name: row.name,
        token_symbol: row.symbol,

        // Holder data
        balance: parseFloat(row.balance) || 0,
        balance_change: parseFloat(row.balance_change) || 0,
        holding_pct: holdingPct,
        conviction_class: row.conviction_class,

        // Activity metrics
        buy_count: row.buy_count || 0,
        sell_count: row.sell_count || 0,
        last_tx_timestamp: row.last_tx_timestamp,
        snapshot_time: row.snapshot_time,

        // Token context at snapshot
        token_k_score: parseFloat(row.k_score) || 0,
        token_supply: parseFloat(row.supply) || 0,

        // Derived features for training
        features: {
          is_whale: holdingPct > 5,
          is_accumulator: row.conviction_class === 'accumulator',
          is_extractor: row.conviction_class === 'extractor',
          buy_sell_ratio: row.sell_count > 0 ? (row.buy_count / row.sell_count) : (row.buy_count > 0 ? PHI : 0),
          conviction_score: getConvictionScore(row.conviction_class)
        }
      };

      writeStream.write(JSON.stringify(trainingRecord) + '\n');
      exportedCount++;

      if (exportedCount % 50000 === 0) {
        console.log(`   Exported ${exportedCount.toLocaleString()} / ${totalRows.toLocaleString()} records...`);
      }
    }

    writeStream.end();

    console.log(`✅ Exported ${exportedCount.toLocaleString()} holder snapshots`);
    console.log(`   File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);

    return exportedCount;

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

function getConvictionScore(convictionClass) {
  const scores = {
    accumulator: PHI,        // 1.618
    holder: 1.0,
    reducer: 1 / PHI,        // 0.618
    extractor: 1 / (PHI * PHI) // 0.382
  };
  return scores[convictionClass] || 1.0;
}

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });

  exportHolderSnapshots()
    .then(count => {
      console.log(`\n📦 Holder snapshots export complete: ${count} records`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Export failed:', err);
      process.exit(1);
    });
}

module.exports = { exportHolderSnapshots };
