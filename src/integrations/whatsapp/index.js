import { UnconfiguredWhatsAppProvider } from './unconfigured.provider.js';

let whatsappProvider = new UnconfiguredWhatsAppProvider();

export function getWhatsAppProvider() {
  return whatsappProvider;
}

export function setWhatsAppProvider(provider) {
  whatsappProvider = provider;
}

export { UnconfiguredWhatsAppProvider };
