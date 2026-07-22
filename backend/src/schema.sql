-- AtomicPay v2.0 Schema
-- Supports: UUID PKs, auth, wallets, transactions, Kafka event audit trail

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS payment_events CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ═══════════════════════════════════════════════
-- Users: now with authentication fields
-- ═══════════════════════════════════════════════
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════
-- Wallets: separated from users for clean domain modeling
-- ═══════════════════════════════════════════════
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance_in_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_in_cents >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════
-- Transactions: enhanced with notes, timestamps
-- ═══════════════════════════════════════════════
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID NOT NULL REFERENCES users(id),
    amount_in_cents BIGINT NOT NULL CHECK (amount_in_cents > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    idempotency_key UUID UNIQUE,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- ═══════════════════════════════════════════════
-- Payment Events: Kafka consumer audit trail
-- ═══════════════════════════════════════════════
CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB,
    processed_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════
-- Performance Indexes
-- ═══════════════════════════════════════════════
CREATE INDEX idx_transactions_sender ON transactions(sender_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_payment_events_tx ON payment_events(transaction_id);
CREATE INDEX idx_payment_events_type ON payment_events(event_type);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
