import { AsyncLocalStorage } from 'node:async_hooks';

export const requestContext = new AsyncLocalStorage();

export function getRequestId() {
  return requestContext.getStore()?.requestId;
}

export function getRequestStore() {
  return requestContext.getStore();
}
