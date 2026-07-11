# AtomicPay ⚛️💸

AtomicPay is a peer-to-peer (P2P) money transfer application designed to demonstrate robust backend engineering, specifically focusing on data integrity, ACID database transactions, and race-condition prevention.

## 🚀 The Core Problem Solved
In distributed systems, moving money safely is difficult. If User A sends $50 to User B, we cannot simply deduct $50 from A and add $50 to B in two separate database calls. If the server crashes in between, the money is lost. Furthermore, if User A rapid-fires the "Send" button, a race condition might allow them to overdraw their account. 

AtomicPay solves this by utilizing **PostgreSQL ACID Transactions** and **Row-Level Locking** to guarantee that money transfers are atomic (all-or-nothing) and immune to concurrency bugs.

## 🛠 Features
- **Secure P2P Transfers**: Send money between users safely.
- **Transaction History**: View a ledger of all incoming and outgoing funds.
- **Race Condition Prevention**: Prevents double-spending attacks under heavy load.
- **Transaction Visualizer**: A unique frontend dashboard that visually explains to the user (or interviewer) how the database lock and atomic transfer work under the hood in real-time.

## 💻 Tech Stack
- **Database**: PostgreSQL (Relational schema, ACID transactions)
- **Backend**: Node.js & Express.js (REST API)
- **Frontend**: React (or Vanilla JS/Vite) with a visual transaction flow simulator
- **Styling**: Vanilla CSS / Custom UI

## 📂 Project Structure
- `docs/` - Contains Sprint documentation and project planning.
- `backend/` - Node.js API server (to be initialized).
- `frontend/` - React frontend application (to be initialized).
