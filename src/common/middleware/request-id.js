import { randomUUID } from 'node:crypto';
import { REQUEST_ID_HEADER } from '../constants/api.js';
import { requestContext } from '../utils/request-context.js';

export function requestId(req, res, next) {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id = typeof incoming === 'string' && incoming.trim() ? incoming.trim() : randomUUID();
  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  requestContext.run({ requestId: id }, next);
}
