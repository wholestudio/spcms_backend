export function nowUtc() {
  return new Date();
}

export function toIsoUtc(date = new Date()) {
  return date.toISOString();
}
