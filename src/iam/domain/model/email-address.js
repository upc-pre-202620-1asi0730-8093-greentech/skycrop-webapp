/** Normalized email address used by identity and plot invitations. */
export class EmailAddress {
  constructor(value) {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new TypeError('account.invalidEmail');
    }
    this.value = normalized;
    Object.freeze(this);
  }
  toString() { return this.value; }
}
