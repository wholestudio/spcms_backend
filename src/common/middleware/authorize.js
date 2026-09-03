import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';

/**
 * Route-level RBAC. Attach after `authenticate`.
 * Action-level and resource-level checks should call helpers from this module
 * rather than branching on roles inside controllers.
 */
export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];
    const allowed = allowedRoles.some((role) => userRoles.includes(role));

    if (!allowed) {
      throw new ForbiddenError('Insufficient role to access this resource');
    }

    next();
  };
}

export function requirePermission(...requiredPermissions) {
  return (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const permissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const allowed = requiredPermissions.every((permission) => permissions.includes(permission));

    if (!allowed) {
      throw new ForbiddenError('Insufficient permission to perform this action');
    }

    next();
  };
}

export function hasRole(user, role) {
  return Array.isArray(user?.roles) && user.roles.includes(role);
}

export function hasPermission(user, permission) {
  return Array.isArray(user?.permissions) && user.permissions.includes(permission);
}
