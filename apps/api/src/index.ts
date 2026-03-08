import './config/env.js'; // Load and validate env vars first
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketServer } from './sockets/index.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import classesRoutes from './routes/classes.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import gamesRoutes from './routes/games.routes.js';
import contentRoutes from './routes/content.routes.js';
import announcementsRoutes from './routes/announcements.routes.js';

const app = express();
const httpServer = createServer(app);

// Trust Railway/Vercel reverse proxy
app.set('trust proxy', 1);

// ── Middleware ────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Rate limit auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'TooManyRequests', message: 'Too many attempts, try again later' },
});

// ── Routes ────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/classes', classesRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/games', gamesRoutes);
app.use('/api/v1', contentRoutes);
app.use('/api/v1/announcements', announcementsRoutes);

// ── Error handler (must be last) ──────────────────────────────────────────

app.use(errorHandler);

// ── Socket.io ─────────────────────────────────────────────────────────────

setupSocketServer(httpServer);

// ── Start ─────────────────────────────────────────────────────────────────

httpServer.listen(env.PORT, () => {
  console.log(`API server running on port ${env.PORT}`);
});

export { app, httpServer };
