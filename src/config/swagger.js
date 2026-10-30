import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Studio Patron API',
    version: '1.1.0',
    description:
      'Modular monolith backend for Studio Patron. Documents liveness, full auth (register/login/refresh/password), media, and public/customer/admin surfaces.',
  },
  servers: [
    {
      url: config.api.baseUrl,
      description: 'Direct API origin',
    },
    {
      url: 'http://localhost:3000',
      description: 'CMS same-origin proxy (spcms_frontend rewrite)',
    },
  ],
  tags: [
    { name: 'Health', description: 'Liveness and process health' },
    { name: 'Auth', description: 'Customer and staff authentication' },
    { name: 'Public', description: 'Unauthenticated customer-facing surface (future)' },
    { name: 'Customer', description: 'Authenticated customer surface (future)' },
    { name: 'Admin', description: 'CMS and admin surface' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'spcms_session',
        description: 'httpOnly JWT session cookie set by POST /api/v1/admin/auth/login',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' },
          meta: {
            type: 'object',
            properties: {
              requestId: { type: 'string', format: 'uuid' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              requestId: { type: 'string', format: 'uuid' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      HealthData: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'studio-patron-api' },
          environment: { type: 'string', example: 'development' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@studiopatron.com' },
          password: { type: 'string', format: 'password', minLength: 10 },
        },
      },
      SessionUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string', nullable: true },
          role: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CUSTOMER'],
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ['./src/routes/**/*.js', './src/modules/**/*.js'],
});

export function setupSwagger(app) {
  app.get('/api/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Studio Patron API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        docExpansion: 'list',
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    }),
  );
}
