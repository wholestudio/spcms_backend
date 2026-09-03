/**
 * Transactional email provider contract.
 *
 * @typedef {object} EmailMessage
 * @property {string|string[]} to
 * @property {string} subject
 * @property {string} [html]
 * @property {string} [text]
 *
 * @typedef {object} EmailProvider
 * @property {(message: EmailMessage) => Promise<void>} send
 */
export class UnconfiguredEmailProvider {
  async send() {
    throw new Error('Email provider is not configured');
  }
}
