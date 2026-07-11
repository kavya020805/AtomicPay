# Sprint 3: The Transaction Engine (Core Feature)

## Goal
Build the critical P2P transfer logic. This is the main feature of the app and the primary talking point for interviews.

## Tasks
- [ ] Create API Endpoint: `POST /api/transfer` with payload `{ senderId, receiverId, amount }`.
- [ ] Implement the PostgreSQL Transaction (`BEGIN`, `COMMIT`, `ROLLBACK`) inside the route handler.
- [ ] Add Row-Level Locking (`SELECT ... FOR UPDATE`) to lock the sender's row so concurrent requests cannot read stale balances.
- [ ] Write the logic: Check if sender has enough balance -> Deduct from sender -> Add to receiver -> Insert record into `Transactions` table -> Commit.
- [ ] Test race conditions: Write a small script that fires 10 simultaneous transfer requests to ensure the balance doesn't go below zero.

## Definition of Done
- Users can successfully transfer money.
- Server gracefully handles insufficient funds errors.
- The endpoint is immune to race conditions and guarantees ACID properties.
