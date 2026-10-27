import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export const app = express();
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// Health checks for Cloud Run & container orchestration
app.get(['/health', '/_health'], (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', service: 'thaco-agri-app', timestamp: new Date().toISOString() });
});

// Mount Modular API Routes
app.use('/api', apiRouter);

// Start full-stack server
export async function startServer() {
  const distPath = path.resolve(ROOT_DIR, 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isDev = process.env.NODE_ENV === 'development';
  const isProduction = !isDev && (process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE || hasDist);

  if (!isProduction) {
    // Development mode: Mount Vite dev server middleware
    const vite = await createViteServer({
      root: ROOT_DIR,
      server: { 
        middlewareMode: true, 
        hmr: process.env.DISABLE_HMR !== 'true' 
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve compiled static files from dist/
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  return new Promise((resolve) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[THACO AGRI Engine] Server running on http://0.0.0.0:${PORT} (mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'})`);
      resolve(app);
    });

    process.on('SIGTERM', () => {
      console.log('[THACO AGRI Engine] Received SIGTERM, closing server...');
      server.close(() => process.exit(0));
    });
  });
}
