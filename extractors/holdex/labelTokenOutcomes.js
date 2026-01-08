#!/usr/bin/env node
/**
 * Label Token Outcomes for Supervised Learning
 *
 * Labels tokens as: survivor, rug, pump_dump, organic_decline, unknown
 * Output: training/labeled/token-outcomes.jsonl
 *
 * Philosophy: "Don't Trust, Verify" - Labels are based on objective metrics
 */

'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const PHI = 1.618033988749895;

const OUTPUT_DIR = path.join(__dirname, '..', 'labeled');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'token-outcomes.jsonl');

// Labeling thresholds (φ-based)
const THRESHOLDS = {
  // Survivor: Token that maintained value
  survivor: {
    min_age_days: 30,
    min_k_score: 50,
    min_liquidity: 1000,
    max_price_drop_pct: 90
  },

  // Rug: Sudden liquidity removal
  rug: {
    liquidity_drop_pct: 95,
    time_window_hours: 24,
    holder_exodus_pct: 80
  },

  // Pump & Dump: Artificial price manipulation
  pump_dump: {
    price_spike_pct: 500,
    price_crash_pct: 90,
    time_window_hours: 48
  },

  // Organic decline: Natural market forces
  organic_decline: {
    min_age_days: 14,
    gradual_decline_days: 7,
    holder_retention_pct: 30
  }
};

async function labelTokenOutcomes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com')
      ? { rejectUnauthorized: false }
      : false
  });

  console.log('🏷️  Labeling token outcomes for supervised learning...');
  console.log(`   Output: ${OUTPUT_FILE}`);

  try {
    // Get all tokens with their history
    const tokensQuery = `
      SELECT
        t.mint,
        t.name,
        t.symbol,
        t.k_score,
        t.liquidity,
        t.marketcap,
        t.priceusd,
        t.holders,
        t.real_holders,
        t.lp_burn_pct,
        t.is_pump_fun,
        t.timestamp as created_at,
        t.last_k_score_update,
        t.conviction_accumulators,
        t.conviction_holders,
        t.conviction_reducers,
        t.conviction_extractors,
        t.age_days
      FROM tokens t
      WHERE t.timestamp IS NOT NULL
      ORDER BY t.timestamp ASC
    `;

    const tokens = await pool.query(tokensQuery);
    console.log(`   Total tokens to label: ${tokens.rows.length.toLocaleString()}`);

    const writeStream = fs.createWriteStream(OUTPUT_FILE);

    let stats = {
      survivor: 0,
      rug: 0,
      pump_dump: 0,
      organic_decline: 0,
      unknown: 0
    };

    for (const token of tokens.rows) {
      // Get K-Score history for this token
      const historyQuery = `
        SELECT k_score, date as recorded_at
        FROM k_score_history
        WHERE mint = $1
        ORDER BY date ASC
      `;
      const history = await pool.query(historyQuery, [token.mint]);

      // Calculate metrics for labeling
      const metrics = calculateMetrics(token, history.rows);
      const label = determineLabel(metrics);

      stats[label]++;

      const labeledRecord = {
        // Token identity
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,

        // Current state
        current: {
          k_score: parseFloat(token.k_score) || 0,
          liquidity: parseFloat(token.liquidity) || 0,
          marketcap: parseFloat(token.marketcap) || 0,
          price_usd: parseFloat(token.priceusd) || 0,
          holders: token.holders || 0,
          real_holders: token.real_holders || 0
        },

        // Computed metrics
        metrics: metrics,

        // LABEL (target for supervised learning)
        label: label,
        label_confidence: calculateLabelConfidence(metrics, label),

        // Token metadata
        meta: {
          lp_burn_pct: parseFloat(token.lp_burn_pct) || 0,
          is_pump_fun: token.is_pump_fun || false,
          created_at: token.created_at,
          age_days: metrics.age_days,
          history_points: history.rows.length
        },

        // Conviction distribution (normalized)
        conviction_distribution: normalizeConviction(token)
      };

      writeStream.write(JSON.stringify(labeledRecord) + '\n');
    }

    writeStream.end();

    console.log('\n📊 Labeling Statistics:');
    console.log(`   ✅ Survivors:       ${stats.survivor.toLocaleString()} (${(stats.survivor / tokens.rows.length * 100).toFixed(1)}%)`);
    console.log(`   💀 Rugs:            ${stats.rug.toLocaleString()} (${(stats.rug / tokens.rows.length * 100).toFixed(1)}%)`);
    console.log(`   📈 Pump & Dumps:    ${stats.pump_dump.toLocaleString()} (${(stats.pump_dump / tokens.rows.length * 100).toFixed(1)}%)`);
    console.log(`   📉 Organic Decline: ${stats.organic_decline.toLocaleString()} (${(stats.organic_decline / tokens.rows.length * 100).toFixed(1)}%)`);
    console.log(`   ❓ Unknown:         ${stats.unknown.toLocaleString()} (${(stats.unknown / tokens.rows.length * 100).toFixed(1)}%)`);

    const fileSize = fs.statSync(OUTPUT_FILE).size / 1024 / 1024;
    console.log(`\n✅ Labeled ${tokens.rows.length.toLocaleString()} tokens`);
    console.log(`   File size: ${fileSize.toFixed(2)} MB`);

    return { total: tokens.rows.length, stats };

  } catch (error) {
    console.error('❌ Labeling failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

function calculateMetrics(token, history) {
  // Use age_days from DB if available, otherwise calculate
  const ageDays = token.age_days || (token.created_at
    ? Math.floor((new Date() - new Date(token.created_at)) / (1000 * 60 * 60 * 24))
    : 0);

  // K-Score trajectory
  let kScoreChange = 0;
  let kScoreVolatility = 0;

  if (history.length >= 2) {
    const firstKScore = parseFloat(history[0].k_score) || 0;
    const lastKScore = parseFloat(history[history.length - 1].k_score) || 0;
    kScoreChange = lastKScore - firstKScore;

    // Calculate volatility (standard deviation)
    const kScores = history.map(h => parseFloat(h.k_score) || 0);
    const mean = kScores.reduce((a, b) => a + b, 0) / kScores.length;
    const squaredDiffs = kScores.map(k => Math.pow(k - mean, 2));
    kScoreVolatility = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / kScores.length);
  }

  // Holder metrics
  const totalConviction = (token.conviction_accumulators || 0) +
                         (token.conviction_holders || 0) +
                         (token.conviction_reducers || 0) +
                         (token.conviction_extractors || 0);

  const diamondRatio = totalConviction > 0
    ? (token.conviction_accumulators || 0) / totalConviction
    : 0;

  const extractorRatio = totalConviction > 0
    ? (token.conviction_extractors || 0) / totalConviction
    : 0;

  return {
    age_days: ageDays,
    k_score_current: parseFloat(token.k_score) || 0,
    k_score_change: kScoreChange,
    k_score_volatility: kScoreVolatility,
    liquidity: parseFloat(token.liquidity) || 0,
    holder_count: token.holders || 0,
    real_holder_ratio: token.holders > 0 ? (token.real_holders || 0) / token.holders : 0,
    diamond_ratio: diamondRatio,
    extractor_ratio: extractorRatio,
    lp_burn_pct: parseFloat(token.lp_burn_pct) || 0,
    history_length: history.length
  };
}

function determineLabel(metrics) {
  // Rule-based labeling (can be improved with ML later)

  // SURVIVOR: Old, healthy, liquid
  if (metrics.age_days >= THRESHOLDS.survivor.min_age_days &&
      metrics.k_score_current >= THRESHOLDS.survivor.min_k_score &&
      metrics.liquidity >= THRESHOLDS.survivor.min_liquidity) {
    return 'survivor';
  }

  // RUG: No liquidity, high extractor ratio
  if (metrics.liquidity < 100 &&
      metrics.extractor_ratio > 0.5 &&
      metrics.age_days > 1) {
    return 'rug';
  }

  // PUMP & DUMP: High volatility, ended low
  if (metrics.k_score_volatility > 20 &&
      metrics.k_score_current < 30 &&
      metrics.age_days > 2) {
    return 'pump_dump';
  }

  // ORGANIC DECLINE: Gradual decrease, some holders remain
  if (metrics.age_days >= THRESHOLDS.organic_decline.min_age_days &&
      metrics.k_score_change < -20 &&
      metrics.diamond_ratio > 0.1) {
    return 'organic_decline';
  }

  // Too new or unclear
  return 'unknown';
}

function calculateLabelConfidence(metrics, label) {
  // Confidence based on data quality
  let confidence = 0.5;

  // More history = more confidence
  if (metrics.history_length > 10) confidence += 0.1;
  if (metrics.history_length > 50) confidence += 0.1;
  if (metrics.history_length > 100) confidence += 0.1;

  // Older tokens = more confident labels
  if (metrics.age_days > 7) confidence += 0.05;
  if (metrics.age_days > 30) confidence += 0.1;

  // Clear signals = more confidence
  if (label === 'survivor' && metrics.k_score_current > 70) confidence += 0.1;
  if (label === 'rug' && metrics.liquidity < 10) confidence += 0.15;

  return Math.min(0.95, confidence);
}

function normalizeConviction(token) {
  const total = (token.conviction_accumulators || 0) +
                (token.conviction_holders || 0) +
                (token.conviction_reducers || 0) +
                (token.conviction_extractors || 0);

  if (total === 0) return { accumulators: 0, holders: 0, reducers: 0, extractors: 0 };

  return {
    accumulators: (token.conviction_accumulators || 0) / total,
    holders: (token.conviction_holders || 0) / total,
    reducers: (token.conviction_reducers || 0) / total,
    extractors: (token.conviction_extractors || 0) / total
  };
}

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });

  labelTokenOutcomes()
    .then(result => {
      console.log(`\n📦 Token labeling complete`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Labeling failed:', err);
      process.exit(1);
    });
}

module.exports = { labelTokenOutcomes };
