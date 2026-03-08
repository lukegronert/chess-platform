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
1. Create a new Railway project
2. Add a PostgreSQL database (Railway will set `DATABASE_URL` automatically)
3. Add a service from GitHub, set root directory to `apps/api`
4. Set build command: `pnpm install && pnpm db:generate && pnpm db:migrate && pnpm build`
5. Set start command: `pnpm start`
6. Add all environment variables from `apps/api/.env`

### Vercel (Web)
1. Import the repo into Vercel
2. Set root directory to `apps/web`
3. Set `NEXT_PUBLIC_API_URL` to your Railway API URL
4. Set `NEXT_PUBLIC_WS_URL` to your Railway API URL

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
