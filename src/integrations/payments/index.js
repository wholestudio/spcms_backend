import { UnconfiguredPaymentProvider } from './unconfigured.provider.js';

let paymentProvider = new UnconfiguredPaymentProvider();

export function getPaymentProvider() {
  return paymentProvider;
}

export function setPaymentProvider(provider) {
  paymentProvider = provider;
}

export { UnconfiguredPaymentProvider };
