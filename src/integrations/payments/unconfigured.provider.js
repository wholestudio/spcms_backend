/**
 * Payment provider contract.
 *
 * Future providers: Razorpay, additional gateways.
 * Never leak vendor SDKs into domain modules.
 *
 * @typedef {object} PaymentProvider
 * @property {(input: object) => Promise<object>} createOrder
 * @property {(input: object) => Promise<object>} verifyPayment
 * @property {(input: object) => Promise<object>} refund
 */
export class UnconfiguredPaymentProvider {
  async createOrder() {
    throw new Error('Payment provider is not configured');
  }

  async verifyPayment() {
    throw new Error('Payment provider is not configured');
  }

  async refund() {
    throw new Error('Payment provider is not configured');
  }
}
