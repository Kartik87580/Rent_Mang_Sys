import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './apiRouter.js';
import { ensureTablesExist } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRouter);

// Serve built frontend in production if available
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend not built. Run `npm run build` or use Vite dev server.');
    }
  });
});

// Start server
ensureTablesExist()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Rent Management Server running at http://localhost:${PORT}`);
      console.log(`📡 Connected to Neon PostgreSQL (Serverless)`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database tables:', err);
    process.exit(1);
  });

export default app;
