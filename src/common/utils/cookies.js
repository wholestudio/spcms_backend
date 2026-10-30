import {
  SESSION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
} from '../constants/api.js';
import { config } from '../../config/config.js';
import { durationToMs } from './duration.js';

export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) {
    return undefined;
  }

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;

    const key = part.slice(0, separator).trim();
    if (key !== name) continue;

    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return part.slice(separator + 1).trim();
    }
  }

  return undefined;
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite,
    ...(config.cookies.domain ? { domain: config.cookies.domain } : {}),
  };
}

export function sessionCookieOptions() {
  return {
    ...baseCookieOptions(),
    path: '/',
    maxAge: durationToMs(config.jwt.accessExpiresIn),
  };
}

export function refreshCookieOptions() {
  return {
    ...baseCookieOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: config.auth.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  };
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  setSessionCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    ...baseCookieOptions(),
    path: '/',
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...baseCookieOptions(),
    path: REFRESH_COOKIE_PATH,
  });
}

export function clearAuthCookies(res) {
  clearSessionCookie(res);
  clearRefreshCookie(res);
}
