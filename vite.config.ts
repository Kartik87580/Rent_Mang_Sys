import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { apiRouter } from './server/apiRouter.js'
import { ensureTablesExist } from './server/db.js'

function neonApiPlugin(): Plugin {
  return {
    name: 'neon-api-plugin',
    configureServer(server) {
      // Ensure Neon tables exist on dev server start
      ensureTablesExist().catch(err => {
        console.error('Failed to ensure Neon DB tables:', err);
      });

      // Enhance Connect response object with Express-compatible methods for Vite middleware
      server.middlewares.use((req: any, res: any, next) => {
        if (!res.status) {
          res.status = function (code: number) {
            res.statusCode = code;
            return res;
          };
        }
        if (!res.json) {
          res.json = function (obj: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(obj));
            return res;
          };
        }
        next();
      });

      // Mount API router on /api
      server.middlewares.use('/api', apiRouter);
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), neonApiPlugin()],
})
