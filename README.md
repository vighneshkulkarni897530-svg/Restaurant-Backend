# 🏨 Govinda's Restaurant & Dining — Backend API & Socket Server

Production-ready Node.js, Express, TypeScript, Prisma ORM, SQLite & Socket.IO server powering the QR Table Ordering System.

---

## 🚀 Quick Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Database Migration & Seeding
```bash
npx prisma db push
npx ts-node prisma/seed.ts
```

### 4. Start Development Server
```bash
npm run dev
```
*Server runs on `http://localhost:5000`*

---

## ☁️ Deployment on Render (Web Service)

- **Runtime**: Node
- **Build Command**: `npm install && npx prisma generate && npx prisma db push && npx ts-node prisma/seed.ts && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV` = `production`
  - `DATABASE_URL` = `file:./dev.db`
  - `JWT_SECRET` = `govindas_hotel_qr_super_secret_jwt_key_2026`
  - `JWT_EXPIRES_IN` = `7d`
  - `FRONTEND_URL` = `*`
