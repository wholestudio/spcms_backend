import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Studio Patron API',
    version: '1.0.0',
    description:
      'Modular monolith backend for Studio Patron. This foundation documents health and routing surfaces; business endpoints will be added in later phases.',
  },
  servers: [
    {
      url: config.api.baseUrl,
      description: 'Configured API base URL',
    },
  ],
  tags: [
    { name: 'Health', description: 'Liveness and process health' },
    { name: 'Public', description: 'Unauthenticated customer-facing surface (future)' },
    { name: 'Customer', description: 'Authenticated customer surface (future)' },
    { name: 'Admin', description: 'CMS and admin surface (future)' },
  ],
  components: {
    securitySchemes: {
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
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ['./src/routes/**/*.js', './src/modules/**/*.js'],
});

export function setupSwagger(app) {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Studio Patron API Docs',
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
}
