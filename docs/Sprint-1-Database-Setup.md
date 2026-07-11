# Sprint 1: Database Setup

## Goal
Set up the PostgreSQL database using Docker and design the core schema for Users and Transactions.

## Tasks
- [ ] Create a `docker-compose.yml` file to run a PostgreSQL 15 container locally.
- [ ] Define `Users` table schema (id, username, balance_in_cents).
- [ ] Define `Transactions` table schema (id, sender_id, receiver_id, amount_in_cents, status, timestamp).
- [ ] Write SQL scripts to initialize the database schema and seed it with dummy users (e.g., Alice, Bob, Charlie).
- [ ] Understand how to store currency safely (always as integers/cents to avoid floating-point math errors).

## Definition of Done
- A local PostgreSQL database is running via Docker.
- The schema is created, and dummy users are populated with a starting balance of 100000 cents ($1,000.00).
