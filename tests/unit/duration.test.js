import { durationToMs } from '../../src/common/utils/duration.js';

describe('durationToMs', () => {
  it('parses JWT-style durations', () => {
    expect(durationToMs('30s')).toBe(30_000);
    expect(durationToMs('15m')).toBe(15 * 60_000);
    expect(durationToMs('8h')).toBe(8 * 60 * 60_000);
    expect(durationToMs('7d')).toBe(7 * 24 * 60 * 60_000);
  });

  it('falls back when the value is not a duration', () => {
    expect(durationToMs('nope', 1000)).toBe(1000);
  });
});
