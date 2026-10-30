import { config } from '../../config/config.js';
import { logger } from '../../common/utils/logger.js';

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
 * @property {(input: { to: string, verifyUrl: string }) => Promise<void>} sendVerificationEmail
 * @property {(input: { to: string, resetUrl: string }) => Promise<void>} sendPasswordResetEmail
 */
export class UnconfiguredEmailProvider {
  async send() {
    throw new Error('Email provider is not configured');
  }

  async sendVerificationEmail({ to, verifyUrl }) {
    await this.#fallback('verification', to, verifyUrl);
  }

  async sendPasswordResetEmail({ to, resetUrl }) {
    await this.#fallback('password-reset', to, resetUrl);
  }

  async #fallback(kind, to, url) {
    if (!config.isProduction) {
      logger.info({ kind, to, url }, 'Email provider unconfigured; auth link for local testing');
      return;
    }

    logger.error(
      { kind, to },
      'Email provider is not configured; cannot send auth email in production',
    );
  }
}
