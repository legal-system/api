# Legal Management System API

A production-ready RESTful backend built with **TypeScript**, **Express**, and **PostgreSQL**. Designed as a portfolio project showcasing enterprise software patterns: robust authentication, database version control, connection pooling, graceful process lifecycle management, and security best practices.

---

## 🌟 Key Features & Engineering Highlights

- **Dual-Token Authentication (JWT + Refresh Tokens):**
  - Short-lived signed **JWT Access Tokens** (15 min) for fast, stateless API requests.
  - Unguessable, long-lived **Refresh Tokens** (7 days) stored in secure, `HttpOnly` cookies.
  - Cryptographically hashed storage (SHA-256) and **token rotation** with reuse detection to prevent session hijacking.
- **Production-Ready Process Lifecycle:**
  - **Graceful Shutdown:** Handles `SIGINT` and `SIGTERM` cleanly by completing in-flight requests, closing database pools, and enforcing a 10s watchdog timeout.
  - **Deep Health Checks:** `/api/health` queries PostgreSQL directly to report live status and query latency to load balancers (returns `503 Service Unavailable` if degraded).
- **Strict Database Version Control:**
  - **Sequelize Migrations:** Every schema change is versioned with reversible `up` and `down` scripts.
  - **Data Safety:** Soft deletes (`paranoid: true`), UUIDv4 primary keys, and database-level `CHECK` constraints.
- **Fail-Fast Configuration:**
  - Centralized schema validation using **Zod** ensures the server refuses to boot if any environment variables are invalid or missing.
- **Structured Logging & Security:**
  - High-performance logging with **Pino** and automatic sensitive field redaction (passwords, tokens).
  - Security headers with **Helmet**, rate limiting, and strict **CORS** configurations.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Language:** TypeScript
- **Framework:** Express.js
- **Database / ORM:** PostgreSQL, Sequelize ORM
- **Validation:** Zod
- **Security & Cryptography:** Bcrypt, JSON Web Tokens (`jsonwebtoken`), Node crypto (SHA-256)
- **Logging:** Pino, Pino-HTTP

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- **PostgreSQL** running locally or via cloud instance

### 2. Installation & Environment Setup
Install dependencies:

```bash
npm install
```

Copy the environment template and configure your local database credentials:

```bash
cp .env.example .env
```

Edit `.env` to match your PostgreSQL configuration:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=legal_sys
```

### 3. Database Migrations & Seeding

Apply migrations to create database tables:
```bash
npm run migrate
```

Populate the database with initial demo users:
```bash
npm run seed
```

*(Optional: Roll back migrations or seed data at any time with `npm run migrate:undo:all` and `npm run seed:undo`)*

### 4. Run the API

Start the development server with live reload:
```bash
npm run dev
```

The API will boot on `http://localhost:5000`. Test the health check endpoint:
```bash
curl http://localhost:5000/api/health
```

---

## 📂 Project Structure

```text
├── src/
│   ├── config/         # Environment validation (Zod), DB pool, and Pino logger
│   ├── controllers/    # Request handlers (e.g. health check)
│   ├── database/       # Sequelize migrations and seeders
│   ├── models/         # TypeScript Sequelize models (User, RefreshToken)
│   ├── routes/         # Express routing definitions (/api/health, /api/auth)
│   ├── utils/          # Security helpers (password hashing, JWT, crypto)
│   ├── app.ts          # Express application setup & middleware pipeline
│   └── server.ts       # Server startup & graceful shutdown lifecycle
├── .env.example        # Blueprint template for environment variables
├── package.json
└── tsconfig.json
```
