import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

/** Comma-separated list, e.g. `http://localhost:5173,http://localhost:5175` */
function parseAllowedOrigins() {
  const raw = process.env.FRONTEND_URL?.trim();
  if (raw) {
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
  }
  return ['http://localhost:5173', 'http://localhost:5175'];
}

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, origin);
      }
      return callback(null, false);
    },
  }),
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

if (!process.env.DATABASE_URL) {
  console.warn('Warning: DATABASE_URL is not set');
}
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Login/signup will fail. Set JWT_SECRET in server/.env');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Orbit API listening on port ${PORT}`);
});
