-- CYNIC Schema v1.0
-- φ-based persistent store for distributed CYNIC
-- Database: cynic_db on Render (dpg-d5i6ieur433s73c5ef8g-a)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- CORE TABLES
--------------------------------------------------------------------------------

-- Judgments table (core)
CREATE TABLE IF NOT EXISTS judgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_hash VARCHAR(64) NOT NULL,
    item_type VARCHAR(32) DEFAULT 'unknown',
    scores JSONB NOT NULL,
    global_score DECIMAL(5,2) NOT NULL,
    verdict VARCHAR(16) NOT NULL,
    confidence DECIMAL(4,3) DEFAULT 0.618,
    mode VARCHAR(16) DEFAULT 'standard',
    cynic_says TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    operator_hash VARCHAR(64)
);

-- Harmony matrix (φ-weighted dimensions)
CREATE TABLE IF NOT EXISTS harmony (
    dimension VARCHAR(32) PRIMARY KEY,
    world VARCHAR(16) NOT NULL,
    axiom VARCHAR(16) NOT NULL,
    weight DECIMAL(4,3) NOT NULL,
    threshold INTEGER NOT NULL,
    harmony_score DECIMAL(5,2) DEFAULT 50.0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Residuals for dimension discovery
CREATE TABLE IF NOT EXISTS residuals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judgment_id UUID REFERENCES judgments(id) ON DELETE CASCADE,
    residual DECIMAL(4,3) NOT NULL,
    context JSONB,
    cluster_id INTEGER,
    decayed_weight DECIMAL(4,3) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discovered dimensions (THE_INNOMMABLE gateway)
CREATE TABLE IF NOT EXISTS dimensions (
    name VARCHAR(32) PRIMARY KEY,
    world VARCHAR(16) NOT NULL,
    axiom VARCHAR(16) NOT NULL,
    weight DECIMAL(4,3) NOT NULL,
    threshold INTEGER NOT NULL,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    discovered_by VARCHAR(64),
    is_builtin BOOLEAN DEFAULT FALSE
);

-- Operators (trust tracking)
CREATE TABLE IF NOT EXISTS operators (
    hash VARCHAR(64) PRIMARY KEY,
    trust_score DECIMAL(5,2) DEFAULT 50.0,
    total_judgments INTEGER DEFAULT 0,
    correct_judgments INTEGER DEFAULT 0,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Burns (GASdf integration)
CREATE TABLE IF NOT EXISTS burns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(18,8) NOT NULL,
    token VARCHAR(64) NOT NULL,
    judgment_id UUID REFERENCES judgments(id) ON DELETE SET NULL,
    operator_hash VARCHAR(64),
    tx_signature VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- INDEXES (φ-optimized queries)
--------------------------------------------------------------------------------

-- Judgments indexes
CREATE INDEX IF NOT EXISTS idx_judgments_item_hash ON judgments(item_hash);
CREATE INDEX IF NOT EXISTS idx_judgments_verdict_created ON judgments(verdict, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_judgments_operator ON judgments(operator_hash);
CREATE INDEX IF NOT EXISTS idx_judgments_created ON judgments(created_at DESC);

-- GIN index for JSONB scores queries (e.g., scores->'TRUTH' > 0.7)
CREATE INDEX IF NOT EXISTS idx_judgments_scores ON judgments USING GIN (scores);

-- Residuals indexes
CREATE INDEX IF NOT EXISTS idx_residuals_cluster ON residuals(cluster_id);
CREATE INDEX IF NOT EXISTS idx_residuals_created ON residuals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_residuals_judgment ON residuals(judgment_id);

-- Burns indexes
CREATE INDEX IF NOT EXISTS idx_burns_token ON burns(token);
CREATE INDEX IF NOT EXISTS idx_burns_created ON burns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_burns_operator ON burns(operator_hash);

--------------------------------------------------------------------------------
-- SEED DATA: 4 Mondes dimensions
--------------------------------------------------------------------------------

INSERT INTO dimensions (name, world, axiom, weight, threshold, is_builtin) VALUES
-- ATZILUT / φ (PHI)
('HARMONY', 'ATZILUT', 'PHI', 2.618, 60, TRUE),
('COHERENCE', 'ATZILUT', 'PHI', 2.618, 75, TRUE),

-- BERIAH / VERIFY
('TRUTH', 'BERIAH', 'VERIFY', 2.618, 70, TRUE),
('INTEGRITY', 'BERIAH', 'VERIFY', 2.618, 80, TRUE),

-- YETZIRAH / CULTURE
('ETHICS', 'YETZIRAH', 'CULTURE', 2.618, 80, TRUE),
('OPTIMISM', 'YETZIRAH', 'CULTURE', 2.618, 50, TRUE),

-- ASSIAH / BURN
('ALIGNMENT', 'ASSIAH', 'BURN', 2.618, 60, TRUE),
('PROGRESS', 'ASSIAH', 'BURN', 2.618, 50, TRUE),

-- SECONDARY (φ weight)
('SECURE', 'SECONDARY', 'VERIFY', 1.618, 85, TRUE),
('PRIVATE', 'SECONDARY', 'VERIFY', 1.618, 90, TRUE),
('SCALE', 'SECONDARY', 'BURN', 1.618, 50, TRUE),
('SIMPLIFY', 'SECONDARY', 'PHI', 1.618, 60, TRUE),
('ENABLE', 'SECONDARY', 'CULTURE', 1.618, 40, TRUE),

-- META (1.0 weight)
('SELF_AWARENESS', 'META', 'PHI', 1.000, 50, TRUE),
('LEARNING_RATE', 'META', 'VERIFY', 1.000, 50, TRUE),
('SINGULARITY_DISTANCE', 'META', 'BURN', 1.000, 30, TRUE)

ON CONFLICT (name) DO NOTHING;

-- Seed harmony matrix
INSERT INTO harmony (dimension, world, axiom, weight, threshold, harmony_score) VALUES
('HARMONY', 'ATZILUT', 'PHI', 2.618, 60, 50.0),
('COHERENCE', 'ATZILUT', 'PHI', 2.618, 75, 50.0),
('TRUTH', 'BERIAH', 'VERIFY', 2.618, 70, 50.0),
('INTEGRITY', 'BERIAH', 'VERIFY', 2.618, 80, 50.0),
('ETHICS', 'YETZIRAH', 'CULTURE', 2.618, 80, 50.0),
('OPTIMISM', 'YETZIRAH', 'CULTURE', 2.618, 50, 50.0),
('ALIGNMENT', 'ASSIAH', 'BURN', 2.618, 60, 50.0),
('PROGRESS', 'ASSIAH', 'BURN', 2.618, 50, 50.0),
('SECURE', 'SECONDARY', 'VERIFY', 1.618, 85, 50.0),
('PRIVATE', 'SECONDARY', 'VERIFY', 1.618, 90, 50.0),
('SCALE', 'SECONDARY', 'BURN', 1.618, 50, 50.0),
('SIMPLIFY', 'SECONDARY', 'PHI', 1.618, 60, 50.0),
('ENABLE', 'SECONDARY', 'CULTURE', 1.618, 40, 50.0),
('SELF_AWARENESS', 'META', 'PHI', 1.000, 50, 50.0),
('LEARNING_RATE', 'META', 'VERIFY', 1.000, 50, 50.0),
('SINGULARITY_DISTANCE', 'META', 'BURN', 1.000, 30, 50.0)
ON CONFLICT (dimension) DO NOTHING;

--------------------------------------------------------------------------------
-- VERIFICATION
--------------------------------------------------------------------------------

SELECT
    'CYNIC schema v1.0 ready' as status,
    (SELECT COUNT(*) FROM dimensions) as dimensions_count,
    (SELECT COUNT(*) FROM harmony) as harmony_count;
