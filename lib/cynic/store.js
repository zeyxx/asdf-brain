/**
 * CYNIC Store - PostgreSQL persistence layer
 *
 * φ-based distributed state for CYNIC judgments, harmony, and discoveries.
 *
 * Database: cynic-db (Render PostgreSQL 16)
 * Connection: SSL required, pooled
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// φ constants - Import from Single Source of Truth (FIXED 2026-01-13)
const { PHI, PHI_INV } = require('./axioms/constants');

class CynicStore {
  constructor(options = {}) {
    this.pool = null;
    this.connected = false;
    this.options = {
      maxConnections: Math.round(PHI * 5), // ~8 connections
      idleTimeout: Math.round(PHI_INV * 60000), // ~37 seconds
      connectionTimeout: 10000,
      ...options
    };
  }

  /**
   * Initialize connection pool
   * @param {string} connectionString - DATABASE_URL from Render
   */
  async connect(connectionString = process.env.CYNIC_DATABASE_URL || process.env.DATABASE_URL) {
    if (this.connected) return this;

    if (!connectionString) {
      console.warn('[CYNIC-STORE] No DATABASE_URL, running in memory-only mode');
      this.memoryMode = true;
      this.memoryStore = {
        judgments: [],
        harmony: new Map(),
        residuals: [],
        operators: new Map(),
        burns: []
      };
      this.connected = true;
      return this;
    }

    try {
      this.pool = new Pool({
        connectionString,
        max: this.options.maxConnections,
        idleTimeoutMillis: this.options.idleTimeout,
        connectionTimeoutMillis: this.options.connectionTimeout,
        ssl: {
          rejectUnauthorized: false // Render requires SSL but self-signed
        }
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.connected = true;
      this.memoryMode = false;
      console.log('[CYNIC-STORE] Connected to PostgreSQL');
      return this;
    } catch (error) {
      console.error('[CYNIC-STORE] Connection failed:', error.message);
      console.warn('[CYNIC-STORE] Falling back to memory-only mode');
      this.memoryMode = true;
      this.memoryStore = {
        judgments: [],
        harmony: new Map(),
        residuals: [],
        operators: new Map(),
        burns: []
      };
      this.connected = true;
      return this;
    }
  }

  /**
   * Run schema migration
   */
  async migrate() {
    if (this.memoryMode) {
      console.log('[CYNIC-STORE] Memory mode, skipping migration');
      return { success: true, mode: 'memory' };
    }

    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await this.pool.query(schema);
      console.log('[CYNIC-STORE] Schema migrated successfully');
      return { success: true, mode: 'postgres' };
    } catch (error) {
      console.error('[CYNIC-STORE] Migration failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Hash an item for deduplication
   */
  hashItem(item) {
    const str = typeof item === 'string' ? item : JSON.stringify(item);
    return crypto.createHash('sha256').update(str).digest('hex').slice(0, 64);
  }

  // ============================================================================
  // JUDGMENTS
  // ============================================================================

  /**
   * Save a judgment
   */
  async saveJudgment(judgment) {
    const itemHash = judgment.item_hash || this.hashItem(judgment.item);
    const record = {
      item_hash: itemHash,
      item_type: judgment.item_type || 'unknown',
      scores: judgment.scores || judgment.dimensions,
      global_score: judgment.global || judgment.aggregate || 50,
      verdict: judgment.verdict || 'UNKNOWN',
      confidence: judgment.confidence || PHI_INV,
      mode: judgment.mode || 'standard',
      cynic_says: judgment.cynic_says,
      operator_hash: judgment.operator_hash
    };

    if (this.memoryMode) {
      const id = `jdg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      this.memoryStore.judgments.push({ id, ...record, created_at: new Date() });
      return { id, ...record };
    }

    const result = await this.pool.query(
      `INSERT INTO judgments (item_hash, item_type, scores, global_score, verdict, confidence, mode, cynic_says, operator_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [record.item_hash, record.item_type, JSON.stringify(record.scores), record.global_score,
       record.verdict, record.confidence, record.mode, record.cynic_says, record.operator_hash]
    );

    return { id: result.rows[0].id, ...record, created_at: result.rows[0].created_at };
  }

  /**
   * Get judgment by item hash
   */
  async getJudgment(itemHash) {
    if (this.memoryMode) {
      return this.memoryStore.judgments.find(j => j.item_hash === itemHash) || null;
    }

    const result = await this.pool.query(
      'SELECT * FROM judgments WHERE item_hash = $1 ORDER BY created_at DESC LIMIT 1',
      [itemHash]
    );
    return result.rows[0] || null;
  }

  /**
   * List recent judgments
   */
  async listJudgments(options = {}) {
    const { limit = 50, verdict, since } = options;

    if (this.memoryMode) {
      let results = [...this.memoryStore.judgments];
      if (verdict) results = results.filter(j => j.verdict === verdict);
      if (since) results = results.filter(j => new Date(j.created_at) > new Date(since));
      return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
    }

    let query = 'SELECT * FROM judgments WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (verdict) {
      query += ` AND verdict = $${paramIndex++}`;
      params.push(verdict);
    }
    if (since) {
      query += ` AND created_at > $${paramIndex++}`;
      params.push(since);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  // ============================================================================
  // HARMONY MATRIX
  // ============================================================================

  /**
   * Get harmony score for a dimension
   */
  async getHarmony(dimension) {
    if (this.memoryMode) {
      return this.memoryStore.harmony.get(dimension) || { dimension, harmony_score: 50 };
    }

    const result = await this.pool.query(
      'SELECT * FROM harmony WHERE dimension = $1',
      [dimension]
    );
    return result.rows[0] || { dimension, harmony_score: 50 };
  }

  /**
   * Update harmony score (φ-weighted learning)
   */
  async updateHarmony(dimension, delta, context = {}) {
    const current = await this.getHarmony(dimension);
    const newScore = Math.max(0, Math.min(100, current.harmony_score + delta));

    if (this.memoryMode) {
      this.memoryStore.harmony.set(dimension, {
        ...current,
        harmony_score: newScore,
        updated_at: new Date()
      });
      return { dimension, harmony_score: newScore, delta };
    }

    await this.pool.query(
      `UPDATE harmony SET harmony_score = $1, updated_at = NOW() WHERE dimension = $2`,
      [newScore, dimension]
    );

    return { dimension, harmony_score: newScore, delta };
  }

  /**
   * Get full harmony matrix
   */
  async getHarmonyMatrix() {
    if (this.memoryMode) {
      return Array.from(this.memoryStore.harmony.values());
    }

    const result = await this.pool.query('SELECT * FROM harmony ORDER BY world, dimension');
    return result.rows;
  }

  // ============================================================================
  // RESIDUALS (Dimension Discovery)
  // ============================================================================

  /**
   * Record a residual for potential dimension discovery
   */
  async recordResidual(judgmentId, residual, context = {}) {
    if (residual < PHI_INV * PHI_INV) return null; // Below threshold (38.2%)

    if (this.memoryMode) {
      const record = {
        id: `res_${Date.now()}`,
        judgment_id: judgmentId,
        residual,
        context,
        decayed_weight: 1.0,
        created_at: new Date()
      };
      this.memoryStore.residuals.push(record);
      return record;
    }

    const result = await this.pool.query(
      `INSERT INTO residuals (judgment_id, residual, context)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [judgmentId, residual, JSON.stringify(context)]
    );
    return result.rows[0];
  }

  /**
   * Get residuals for clustering
   */
  async getResiduals(options = {}) {
    const { minWeight = 0.1, limit = 424 } = options; // 424 = φ³ × 100

    if (this.memoryMode) {
      return this.memoryStore.residuals
        .filter(r => r.decayed_weight >= minWeight)
        .slice(0, limit);
    }

    const result = await this.pool.query(
      `SELECT * FROM residuals WHERE decayed_weight >= $1 ORDER BY created_at DESC LIMIT $2`,
      [minWeight, limit]
    );
    return result.rows;
  }

  /**
   * Apply φ-decay to residuals
   */
  async decayResiduals() {
    if (this.memoryMode) {
      this.memoryStore.residuals = this.memoryStore.residuals
        .map(r => ({ ...r, decayed_weight: r.decayed_weight * PHI_INV }))
        .filter(r => r.decayed_weight >= 0.01);
      return { decayed: this.memoryStore.residuals.length };
    }

    await this.pool.query(
      `UPDATE residuals SET decayed_weight = decayed_weight * $1`,
      [PHI_INV]
    );
    await this.pool.query(`DELETE FROM residuals WHERE decayed_weight < 0.01`);

    const result = await this.pool.query('SELECT COUNT(*) as count FROM residuals');
    return { remaining: parseInt(result.rows[0].count) };
  }

  // ============================================================================
  // OPERATORS
  // ============================================================================

  /**
   * Update operator trust
   */
  async updateOperator(hash, correct) {
    if (this.memoryMode) {
      const current = this.memoryStore.operators.get(hash) || {
        hash,
        trust_score: 50,
        total_judgments: 0,
        correct_judgments: 0
      };
      current.total_judgments++;
      if (correct) current.correct_judgments++;
      current.trust_score = (current.correct_judgments / current.total_judgments) * 100;
      current.last_seen = new Date();
      this.memoryStore.operators.set(hash, current);
      return current;
    }

    await this.pool.query(
      `INSERT INTO operators (hash, total_judgments, correct_judgments, trust_score, last_seen)
       VALUES ($1, 1, $2, $3, NOW())
       ON CONFLICT (hash) DO UPDATE SET
         total_judgments = operators.total_judgments + 1,
         correct_judgments = operators.correct_judgments + $2,
         trust_score = ((operators.correct_judgments + $2)::decimal / (operators.total_judgments + 1)) * 100,
         last_seen = NOW()`,
      [hash, correct ? 1 : 0, correct ? 100 : 0]
    );

    const result = await this.pool.query('SELECT * FROM operators WHERE hash = $1', [hash]);
    return result.rows[0];
  }

  /**
   * Get operator trust
   */
  async getOperator(hash) {
    if (this.memoryMode) {
      return this.memoryStore.operators.get(hash) || null;
    }

    const result = await this.pool.query('SELECT * FROM operators WHERE hash = $1', [hash]);
    return result.rows[0] || null;
  }

  // ============================================================================
  // BURNS
  // ============================================================================

  /**
   * Record a burn event
   */
  async recordBurn(burn) {
    if (this.memoryMode) {
      const record = {
        id: `burn_${Date.now()}`,
        ...burn,
        created_at: new Date()
      };
      this.memoryStore.burns.push(record);
      return record;
    }

    const result = await this.pool.query(
      `INSERT INTO burns (amount, token, judgment_id, operator_hash, tx_signature)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [burn.amount, burn.token, burn.judgment_id, burn.operator_hash, burn.tx_signature]
    );
    return result.rows[0];
  }

  /**
   * Get burn stats
   */
  async getBurnStats(token = null) {
    if (this.memoryMode) {
      let burns = this.memoryStore.burns;
      if (token) burns = burns.filter(b => b.token === token);
      return {
        total_burns: burns.length,
        total_amount: burns.reduce((sum, b) => sum + parseFloat(b.amount), 0)
      };
    }

    const query = token
      ? 'SELECT COUNT(*) as total_burns, COALESCE(SUM(amount), 0) as total_amount FROM burns WHERE token = $1'
      : 'SELECT COUNT(*) as total_burns, COALESCE(SUM(amount), 0) as total_amount FROM burns';

    const result = await this.pool.query(query, token ? [token] : []);
    return {
      total_burns: parseInt(result.rows[0].total_burns),
      total_amount: parseFloat(result.rows[0].total_amount)
    };
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get store stats
   */
  async getStats() {
    if (this.memoryMode) {
      return {
        mode: 'memory',
        judgments: this.memoryStore.judgments.length,
        residuals: this.memoryStore.residuals.length,
        operators: this.memoryStore.operators.size,
        burns: this.memoryStore.burns.length
      };
    }

    const result = await this.pool.query(`
      SELECT
        (SELECT COUNT(*) FROM judgments) as judgments,
        (SELECT COUNT(*) FROM residuals) as residuals,
        (SELECT COUNT(*) FROM operators) as operators,
        (SELECT COUNT(*) FROM burns) as burns
    `);

    return {
      mode: 'postgres',
      ...result.rows[0]
    };
  }

  /**
   * Health check
   */
  async health() {
    if (this.memoryMode) {
      return { healthy: true, mode: 'memory' };
    }

    try {
      await this.pool.query('SELECT 1');
      return { healthy: true, mode: 'postgres' };
    } catch (error) {
      return { healthy: false, mode: 'postgres', error: error.message };
    }
  }

  /**
   * Close connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      console.log('[CYNIC-STORE] Disconnected');
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create store instance
 */
async function getStore(connectionString) {
  if (!instance) {
    instance = new CynicStore();
    await instance.connect(connectionString);
  }
  return instance;
}

module.exports = {
  CynicStore,
  getStore,
  PHI,
  PHI_INV
};
