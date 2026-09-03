/**
 * WhatsApp Business / API provider contract.
 *
 * @typedef {object} WhatsAppMessage
 * @property {string} to
 * @property {string} [template]
 * @property {string} [text]
 * @property {object} [data]
 *
 * @typedef {object} WhatsAppProvider
 * @property {(message: WhatsAppMessage) => Promise<void>} send
 */
export class UnconfiguredWhatsAppProvider {
  async send() {
    throw new Error('WhatsApp provider is not configured');
  }
}
