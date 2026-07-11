# Sprint 2: Core Backend API ⚙️

## Goal
Set up the Express.js server and build basic CRUD operations for users.

## Tasks
- [ ] Initialize Node.js project (`npm init`) in a `backend` directory.
- [ ] Install dependencies: `express`, `pg` (PostgreSQL client for Node), `dotenv`, `cors`.
- [ ] Create database connection pool using `pg`.
- [ ] Create API Endpoint: `GET /api/users` - Fetch all users and their balances.
- [ ] Create API Endpoint: `GET /api/users/:id` - Fetch a single user.
- [ ] Create API Endpoint: `GET /api/transactions/:userId` - Fetch transaction history for a user.

## Definition of Done
- Express server is running on port 3000.
- Postman or curl can successfully fetch users and transaction histories directly from the PostgreSQL database.
