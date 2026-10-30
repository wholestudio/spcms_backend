/**
 * Auth domain — register, verify, login, refresh, password flows.
 *
 * Public routes: /api/v1/auth/*
 * Staff login:   /api/v1/admin/auth/login
 */

export { default as routes } from './routes.js';
export { default as adminAuthRoutes } from './admin.routes.js';
export { MODULE_NAME } from './constants.js';
export * as authService from './service.js';
