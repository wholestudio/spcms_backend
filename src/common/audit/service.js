import { logger } from '../utils/logger.js';
import * as auditRepository from './repository.js';

/**
 * Best-effort audit write. Failures are logged and never thrown to the caller.
 */
export async function recordAudit(entry) {
  try {
    await auditRepository.createAuditLog(entry);
  } catch (error) {
    logger.error(
      { err: error, action: entry?.action, userId: entry?.userId },
      'Failed to write audit log',
    );
  }
}
