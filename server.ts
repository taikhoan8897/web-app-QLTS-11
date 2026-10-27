/**
 * THACO AGRI - Root Server Entry Point
 * Delegates to modular server implementation in /server
 */
import { startServer } from './server/index.ts';

startServer().catch((err) => {
  console.error('[THACO AGRI Engine] Failed to start server:', err);
  process.exit(1);
});
