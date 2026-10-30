import { UnconfiguredEmailProvider } from './unconfigured.provider.js';

let emailProvider = new UnconfiguredEmailProvider();

export function getEmailProvider() {
  return emailProvider;
}

export function setEmailProvider(provider) {
  emailProvider = provider;
}

export async function sendVerificationEmail(input) {
  return getEmailProvider().sendVerificationEmail(input);
}

export async function sendPasswordResetEmail(input) {
  return getEmailProvider().sendPasswordResetEmail(input);
}

export { UnconfiguredEmailProvider };
