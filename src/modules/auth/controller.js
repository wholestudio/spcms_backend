import { sendSuccess } from '../../common/responses/success.js';
import {
  setAuthCookies,
  clearAuthCookies,
  readCookie,
} from '../../common/utils/cookies.js';
import { REFRESH_COOKIE_NAME } from '../../common/constants/api.js';
import * as authService from './service.js';

function clientMeta(req) {
  return {
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  };
}

function readRefreshToken(req) {
  return readCookie(req, REFRESH_COOKIE_NAME) || undefined;
}

export async function register(req, res) {
  const result = await authService.register(req.body, clientMeta(req));
  return sendSuccess(res, {
    statusCode: 201,
    data: {},
    message: result.message,
    requestId: req.id,
  });
}

export async function verifyEmail(req, res) {
  const result = await authService.verifyEmail(req.body, clientMeta(req));
  return sendSuccess(res, {
    data: { user: result.user },
    message: result.message,
    requestId: req.id,
  });
}

export async function resendVerification(req, res) {
  const result = await authService.resendVerification(req.body, clientMeta(req));
  return sendSuccess(res, {
    data: {},
    message: result.message,
    requestId: req.id,
  });
}

export async function login(req, res) {
  const result = await authService.login(req.body, clientMeta(req), { staffOnly: false });
  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return sendSuccess(res, {
    data: { user: result.user },
    message: 'Signed in',
    requestId: req.id,
  });
}

export async function staffLogin(req, res) {
  const result = await authService.login(req.body, clientMeta(req), { staffOnly: true });
  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return sendSuccess(res, {
    data: { user: result.user },
    message: 'Signed in',
    requestId: req.id,
  });
}

export async function refresh(req, res) {
  const result = await authService.refresh(readRefreshToken(req), clientMeta(req));
  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return sendSuccess(res, {
    data: { user: result.user },
    message: 'Session refreshed',
    requestId: req.id,
  });
}

export async function logout(req, res) {
  const result = await authService.logout(readRefreshToken(req), clientMeta(req));
  clearAuthCookies(res);

  return sendSuccess(res, {
    data: {},
    message: result.message,
    requestId: req.id,
  });
}

export async function logoutAll(req, res) {
  const result = await authService.logoutAll(req.user.id, clientMeta(req));
  clearAuthCookies(res);

  return sendSuccess(res, {
    data: {},
    message: result.message,
    requestId: req.id,
  });
}

export async function forgotPassword(req, res) {
  const result = await authService.forgotPassword(req.body, clientMeta(req));
  return sendSuccess(res, {
    data: {},
    message: result.message,
    requestId: req.id,
  });
}

export async function resetPassword(req, res) {
  const result = await authService.resetPassword(req.body, clientMeta(req));
  clearAuthCookies(res);

  return sendSuccess(res, {
    data: {},
    message: result.message,
    requestId: req.id,
  });
}

export async function changePassword(req, res) {
  const result = await authService.changePassword(req.user.id, req.body, clientMeta(req));
  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return sendSuccess(res, {
    data: { user: result.user },
    message: result.message,
    requestId: req.id,
  });
}

export async function me(req, res) {
  const user = await authService.me(req.user.id);

  return sendSuccess(res, {
    data: { user },
    message: 'Session active',
    requestId: req.id,
  });
}
