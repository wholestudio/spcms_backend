import { createApp } from './app.js';
import { config } from './config/config.js';
import { connectDatabase, disconnectDatabase } from './database/index.js';
import { logger } from './common/utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let httpServer;

async function start() {
  await connectDatabase();

  const app = createApp();

  httpServer = app.listen(config.port, config.host, () => {
    logger.info(
      {
        host: config.host,
        port: config.port,
        env: config.env,
        docs: config.swagger.enabled ? '/api/docs' : undefined,
      },
      'Studio Patron API started',
    );
  });
}

function shutdown(signal) {
  logger.info({ signal }, 'Graceful shutdown started');

  const force = setTimeout(() => {
    logger.error('Graceful shutdown timed out');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  force.unref();

  if (!httpServer) {
    disconnectDatabase()
      .finally(() => process.exit(0))
      .catch(() => process.exit(1));
    return;
  }

  httpServer.close(async () => {
    try {
      await disconnectDatabase();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  shutdown('uncaughtException');
});

start().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
