export const MODULE_NAME = 'auth';

export const AUTH_HEADER_SCHEME = 'Bearer';

export const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
});

export const AUDIT_ACTIONS = Object.freeze({
  REGISTER: 'REGISTER',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  LOGOUT: 'LOGOUT',
  LOGOUT_ALL: 'LOGOUT_ALL',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',
});

export const GENERIC_REGISTER_MESSAGE =
  'If this email can be registered, you will receive a verification message shortly.';

export const GENERIC_EMAIL_MESSAGE =
  'If an account exists for this email, you will receive instructions shortly.';
