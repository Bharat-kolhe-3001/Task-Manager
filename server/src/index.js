import './lib/loadEnv.js';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

import { errorHandler } from './middleware/errorHandler.js';

const app = express();

/** Comma-separated list, e.g. http://localhost:5173,http://localhost:5175 */
function parseAllowedOrigins() {
  const raw = process.env.FRONTEND_URL?.trim();

  if (raw) {
    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return [
    'http://localhost:5173',
    'http://localhost:5175',
  ];
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
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json());

// ======================
// API Routes
// ======================

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ======================
// Home Route
// ======================

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Orbit Task Manager API is running 🚀',
  });
});

// ======================
// 404 Route
// ======================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
  });
});

// ======================
// Error Handler
// ======================

app.use(errorHandler);

// ======================
// Environment Validation
// ======================

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not set.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set.');
  process.exit(1);
}

// ======================
// Start Server
// ======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Orbit API listening on port ${PORT}`);
});