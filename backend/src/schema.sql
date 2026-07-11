-- Drop tables if they exist (useful for resetting)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS users;

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    balance_in_cents INTEGER NOT NULL CHECK (balance_in_cents >= 0) -- Constraint prevents negative balances
);

-- Create Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    amount_in_cents INTEGER NOT NULL CHECK (amount_in_cents > 0),
    status VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data ($1000 each = 100000 cents)
INSERT INTO users (username, balance_in_cents) VALUES 
('Alice', 100000),
('Bob', 100000),
('Charlie', 100000);
