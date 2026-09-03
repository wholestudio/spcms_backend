/**
 * Auth domain.
 *
 * CURRENT: JWT sign/verify helpers live in common/utils/jwt.js.
 *          authenticate / authorize middleware live in common/middleware.
 * FUTURE: register, login, refresh, password reset — no flows in this foundation.
 */

export { default as routes } from './routes.js';
export { MODULE_NAME } from './constants.js';
