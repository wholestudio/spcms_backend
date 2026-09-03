import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { config } from './config/config.js';
import { setupSwagger } from './config/swagger.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { notFoundHandler } from './common/middleware/not-found.js';
import { createRateLimiter } from './common/middleware/rate-limit.js';
import { requestId } from './common/middleware/request-id.js';
import { logger } from './common/utils/logger.js';
import apiRoutes from './routes/index.js';

function corsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (config.cors.origins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error('Not allowed by CORS'));
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      customProps: (req) => ({
        requestId: req.id,
        environment: config.env,
      }),
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) {
          return 'error';
        }
        if (res.statusCode >= 400) {
          return 'warn';
        }
        return 'info';
      },
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
          };
        },
      },
    }),
  );

  // Helmet defaults protect common HTTP attacks. CSP is off because this service
  // is a JSON API and Swagger UI needs inline scripts. Tune per docs/security.md.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(createRateLimiter());

  if (config.swagger.enabled) {
    setupSwagger(app);
  }

  app.use(config.api.prefix, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
