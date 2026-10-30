const UNIT_MS = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Convert JWT-style duration strings (`15m`, `8h`, `7d`) to milliseconds.
 * @param {string} value
 * @param {number} [fallbackMs]
 */
export function durationToMs(value, fallbackMs = 15 * 60_000) {
  if (typeof value !== 'string') {
    return fallbackMs;
  }

  const match = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return amount * UNIT_MS[unit];
}
