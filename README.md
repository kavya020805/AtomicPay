# 🚀 AtomicPay v2.0

AtomicPay is a **production-grade peer-to-peer (P2P) payment system** demonstrating robust backend engineering with **ACID transactions**, **event-driven architecture**, and **real-time caching**.

> Built to demonstrate complex distributed systems design for Software Development Engineer (SDE) roles.

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────┐
│   React     │────▶│  Express API (JWT Auth + Rate Limiting)  │
│   Frontend  │◀────│                                          │
└─────────────┘     └──────┬──────────┬───────────┬────────────┘
                           │          │           │
                    ┌──────▼──┐  ┌────▼────┐  ┌───▼──────────┐
                    │ Postgres│  │  Redis  │  │    Kafka      │
                    │  (ACID) │  │ (Cache) │  │  (Events)     │
                    └─────────┘  └─────────┘  └───┬──────────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                              ┌─────▼───┐  ┌─────▼───┐  ┌─────▼─────┐
                              │  Email  │  │ Ledger  │  │  Fraud    │
                              │Consumer │  │Consumer │  │ Consumer  │
                              └─────────┘  └─────────┘  └───────────┘
```

## 💡 Key Engineering Problems Solved

### 1. Atomicity & Race Conditions (v1.0 → v2.0)
PostgreSQL ACID transactions with `SELECT ... FOR UPDATE` row-level locking prevent double-spending under concurrent load.

### 2. Redis Caching & Rate Limiting (v2.0)
- **Session caching** — JWT sessions cached in Redis for fast auth verification
- **Rate limiting** — Sliding window rate limiter (10 transfers/min, 5 logins/min)
- **Payment status cache** — Fast polling without hitting the database
- **Distributed locks** — Redis-based locks with Lua scripts for safe release
- **OTP storage** — Time-limited one-time passwords for high-security operations

### 3. Kafka Event-Driven Pipeline (v2.0)
Every completed payment publishes a `payment.completed` event to Kafka, consumed by:
- **Notification Consumer** — Sends email & push notifications (simulated)
- **Ledger Consumer** — Records double-entry debit/credit audit trail
- **Fraud Consumer** — Heuristic rules (high-value, rapid transfers, circular patterns)
- **Analytics Consumer** — Aggregates daily volume, per-user metrics

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Database** | PostgreSQL 15 (Docker, UUID PKs, ACID) |
| **Backend** | Node.js, Express.js 5 |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Cache** | Redis 7 (ioredis) |
| **Message Queue** | Apache Kafka (KafkaJS, Confluent images) |
| **Frontend** | React 18 (Vite) + Tailwind CSS + Shadcn/UI |
| **Infrastructure** | Docker Compose (5 services) |

## 🏃‍♂️ How to Run

### Prerequisites
- Docker & Docker Compose
- Node.js 18+

### Option 1: Docker Compose (Full Stack)
```bash
docker-compose up -d
```
Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5433
- Redis: localhost:6379
- Kafka: localhost:9092

### Option 2: Local Development
```bash
# 1. Start infrastructure services
docker-compose up -d postgres redis zookeeper kafka

# 2. Backend
cd backend
npm install
npm run seed    # Create tables + demo users
npm start       # Start API + Kafka consumers

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Demo Credentials
| User | Email | Password |
|------|-------|----------|
| Alice | alice@atomicpay.com | password123 |
| Bob | bob@atomicpay.com | password123 |
| Charlie | charlie@atomicpay.com | password123 |

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login (returns JWT) |
| POST | `/api/auth/logout` | ✅ | Invalidate session |
| GET | `/api/auth/me` | ✅ | Get current user + wallet |
| GET | `/api/users` | ✅ | List all users |
| GET | `/api/users/search?q=` | ✅ | Search users by name |
| POST | `/api/transfer` | ✅ | Execute P2P transfer |
| GET | `/api/transfer/:id/status` | ✅ | Check transfer status |
| GET | `/api/transactions` | ✅ | Paginated history |
| GET | `/api/transactions/:id/events` | ✅ | Kafka event trail |
| GET | `/health` | ❌ | System health check |

## 📂 Project Structure

```
AtomicPay/
├── docker-compose.yml          # 5-service infrastructure
├── backend/
│   ├── src/
│   │   ├── server.js           # Express bootstrap
│   │   ├── config/             # DB, Redis, Kafka clients
│   │   ├── middleware/         # Auth, rate limiting, validation
│   │   ├── routes/             # API route definitions
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic
│   │   ├── consumers/          # Kafka event consumers
│   │   ├── schema.sql          # PostgreSQL schema
│   │   └── seed.js             # Demo data seeder
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Router root
│   │   ├── context/            # Auth context
│   │   ├── pages/              # Login, Register, Dashboard
│   │   ├── components/         # UI components
│   │   └── ...
│   └── Dockerfile
└── docs/                       # Sprint documentation
```

## 📝 Resume Bullets

- **Leveraged Redis** for rate limiting (sliding window), session caching, and temporary payment state management to improve throughput and reduce database load.
- **Implemented Kafka-based** asynchronous payment event processing pipeline with notification, ledger, fraud detection, and analytics consumers for real-time payment processing.
- **Designed and built** a production-grade P2P payment system with JWT authentication, bcrypt password hashing, ACID transactions with row-level locking, and idempotent transfer APIs.
- **Architected** a modular Express.js backend with layered separation of concerns (routes → controllers → services) supporting graceful shutdown and comprehensive health monitoring.
