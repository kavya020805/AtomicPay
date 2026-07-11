# 🚀 AtomicPay

AtomicPay is a peer-to-peer (P2P) money transfer application designed to demonstrate robust backend engineering, specifically focusing on data integrity, **ACID database transactions**, and **race-condition prevention**.

> Built as a demonstration of complex state management and database consistency for Software Development Engineer (SDE) roles.

## 💡 The Core Problem Solved
In distributed systems, moving money safely is difficult. If User A sends $50 to User B, we cannot simply deduct $50 from A and add $50 to B in two separate database calls. If the server crashes in between, the money is lost. Furthermore, if User A rapid-fires the "Send" button, a race condition might allow them to overdraw their account. 

AtomicPay solves this by utilizing **PostgreSQL ACID Transactions** and **Row-Level Locking** to guarantee that money transfers are atomic (all-or-nothing) and immune to concurrency bugs.

## ✨ Features
- **Secure P2P Transfers**: Send money between users safely via a robust Express.js backend.
- **Transaction History**: View a ledger of all incoming and outgoing funds.
- **Race Condition Prevention**: Prevents double-spending attacks under heavy load using `SELECT ... FOR UPDATE` locks.
- **Transaction Visualizer Engine**: A unique frontend dashboard that visually explains how the database lock and atomic transfer work under the hood in real-time. Features a live SQL terminal and animated packet transfers.
- **Professional Dashboard**: Built with an immersive all-black theme, Shadcn/UI components, and smooth CSS animations.

## 🛠️ Tech Stack
- **Database**: PostgreSQL (Docker containerized on port 5433)
- **Backend**: Node.js & Express.js (REST API, `pg` driver)
- **Frontend**: React (Vite) + Tailwind CSS + Shadcn/UI
- **Styling**: Vanilla CSS Keyframes for complex transaction flow animations

## 🏃‍♂️ How to Run Locally

### 1. Database Setup (Docker)
Ensure you have Docker installed, then run:
```bash
docker run --name atomicpay-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=atomicpay -p 5433:5432 -d postgres
```
*(Note: We map to port 5433 to avoid conflicts if you already have Postgres running).*

### 2. Backend API
```bash
cd backend
npm install
npm run seed  # Run this once to populate dummy users
npm start
```
*The backend runs on `http://localhost:3000`.*

### 3. Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
*The frontend runs on `http://localhost:5173`.*

## 📂 Project Structure
- `docs/` - Contains Sprint documentation and project planning.
- `backend/` - Node.js API server (handles lock mechanisms).
- `frontend/` - React frontend application (handles the visualizer and dashboard).
