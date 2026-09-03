import { UnconfiguredEmailProvider } from './unconfigured.provider.js';

let emailProvider = new UnconfiguredEmailProvider();

export function getEmailProvider() {
  return emailProvider;
}

export function setEmailProvider(provider) {
  emailProvider = provider;
}

export { UnconfiguredEmailProvider };
