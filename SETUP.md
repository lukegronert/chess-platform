# Chess School Platform — Setup Guide

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- **PostgreSQL** 15+ (local or Railway)
- **Cloudflare R2** account (for PDF storage — optional in dev)

---

## 1. Install Dependencies

```bash
cd chess-platform
pnpm install
```

---

## 2. Environment Variables

Copy the example env file into each app:

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

Then edit `apps/api/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/chess_platform
JWT_ACCESS_SECRET=change-me-to-a-random-secret-32-chars
JWT_REFRESH_SECRET=change-me-to-another-random-secret
CLIENT_URL=http://localhost:3000
PORT=4000

# Optional in dev — skip if you don't have R2 yet
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=chess-platform-pdfs
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## 3. Database Setup

```bash
# Create the database
createdb chess_platform

# Run Prisma migrations
cd apps/api
pnpm db:generate     # generate Prisma client
pnpm db:migrate      # apply schema (creates all tables)
pnpm db:seed         # create initial admin user
```

The seed creates:
- **Admin**: `admin@chess.school` / `admin123!` ← change this password immediately

---

## 4. Run in Development

From the root, run both apps in parallel:

```bash
pnpm dev
```

Or run each separately:
```bash
# Terminal 1 — API (port 4000)
cd apps/api && pnpm dev

# Terminal 2 — Web (port 3000)
cd apps/web && pnpm dev
```

Visit:
- **App**: http://localhost:3000
- **API health**: http://localhost:4000/health
- **Prisma Studio**: `cd apps/api && pnpm db:studio`

---

## 5. Cloudflare R2 Setup (for PDF uploads)

1. Create a Cloudflare R2 bucket named `chess-platform-pdfs`
2. Create an R2 API token with Read+Write permissions
3. Set the CORS policy on your bucket:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-vercel-domain.vercel.app"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```
4. Fill in the R2 env vars in `apps/api/.env`

---

## 6. Deployment

### Railway (API + Database)

Railway uses `railpack.json` at the repo root — no manual build/start command configuration needed.

1. Create a new Railway project
2. Add a **PostgreSQL** addon — Railway sets `DATABASE_URL` automatically when linked to your service
3. Add a service from GitHub (point at the repo root, not `apps/api`)
4. Railway auto-detects `railpack.json` and runs:
   - **Build**: `pnpm --filter @chess/api db:generate && pnpm --filter @chess/api db:deploy && pnpm --filter @chess/api build`
   - **Start**: `node apps/api/dist/index.js`
5. Set environment variables in Railway:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Auto-set by Railway PostgreSQL addon |
| `JWT_ACCESS_SECRET` | Long random string (`openssl rand -hex 64`) |
| `JWT_REFRESH_SECRET` | Different long random string |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | Your Vercel URL (e.g. `https://chess-platform.vercel.app`) |
| `R2_ACCOUNT_ID` | Cloudflare account ID hex string (not the full URL) |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | e.g. `chess-platform-pdfs` |
| `R2_PUBLIC_URL` | e.g. `https://pub-xxx.r2.dev` |

> `PORT` is set automatically by Railway — do not set it manually.

6. After first successful deploy, seed the database:
```bash
railway run --service <service-name> pnpm --filter @chess/api db:seed
```
This creates `admin@chess.school` / `admin123!` — **change the password immediately**.

7. Set the healthcheck path to `/health` in Railway service settings.

---

### Vercel (Web)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this GitHub repo
2. In project settings, configure:

| Setting | Value |
|---|---|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js (auto-detected) |
| **Build Command** | *(leave as default — `next build`)* |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |

> The install command must go up to the repo root so the `@chess/shared` workspace package is available during the build.

3. Set environment variables in Vercel:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-api.up.railway.app/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `https://your-api.up.railway.app` |

4. After deploying, copy the Vercel URL and update `CLIENT_URL` in Railway so CORS allows the frontend.

---

## Project Structure

```
chess-platform/
├── apps/
│   ├── api/              Express + Socket.io + Prisma
│   │   ├── src/
│   │   │   ├── config/   env, prisma client
│   │   │   ├── controllers/
│   │   │   ├── middleware/  auth, validate, errorHandler
│   │   │   ├── routes/
│   │   │   ├── services/  auth, game (Chess.js), storage (R2)
│   │   │   └── sockets/   game, messaging
│   │   └── prisma/       schema + seed
│   └── web/              Next.js 14 App Router
│       └── src/
│           ├── app/      Pages by route group: (admin) (teacher) (student) (auth)
│           ├── components/  chess/, messaging/, content/, curriculum/, layout/
│           ├── hooks/    useAuth, useGame, useMessages
│           ├── lib/      api client, socket client, utils
│           └── stores/   authStore, gameStore, notificationStore (Zustand)
└── packages/
    └── shared/           TypeScript types + socket event constants
```

---

## Key URLs by Role

| Role | Dashboard | Key Features |
|------|-----------|--------------|
| Admin | `/admin/dashboard` | Users, Classes, Announcements |
| Teacher | `/teacher/dashboard` | Classes, Curriculum, Content, Messages |
| Student | `/student/dashboard` | Games, Classes, Messages, Content |

---

## Adding Users

Use the Admin panel at `/admin/users` to create teacher and student accounts.

Or directly via API:
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@chess.school","password":"admin123!"}'

# Use the returned accessToken for authenticated requests
curl -X POST http://localhost:4000/api/v1/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@chess.school","password":"password123","displayName":"Coach Smith","role":"TEACHER"}'
```
