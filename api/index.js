import express from 'express';
import cors from 'cors';
import { apiRouter } from '../server/apiRouter.js';
import { ensureTablesExist, getSql } from '../server/db.js';

const app = express();

app.use(cors());
app.use(express.json());

// Auto-initialize Neon DB tables on cold start (cached across invocations)
let tablesInitialized = false;
let initPromise = null;

app.use(async (req, res, next) => {
  if (getSql() && !tablesInitialized) {
    if (!initPromise) {
      initPromise = ensureTablesExist()
        .then(() => {
          tablesInitialized = true;
        })
        .catch((err) => {
          console.error('Failed to auto-initialize Neon DB tables:', err);
          initPromise = null;
        });
    }
    await initPromise;
  }
  next();
});

// Normalize request URL so both `/api/xxx` and `/xxx` match apiRouter routes
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  next();
});

// Mount routes
app.use(apiRouter);

export default app;
