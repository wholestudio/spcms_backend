import { UnconfiguredStorageProvider } from './unconfigured.provider.js';

let storageProvider = new UnconfiguredStorageProvider();

export function getStorageProvider() {
  return storageProvider;
}

export function setStorageProvider(provider) {
  storageProvider = provider;
}

export { UnconfiguredStorageProvider };
