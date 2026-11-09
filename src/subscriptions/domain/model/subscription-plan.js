/** Validated plan price; absent catalogue data never becomes a free plan. */
export class SubscriptionPlan {
  constructor(resource) {
    const amount = resource.price ?? resource.monthlyCost;
    if (resource.id == null || !String(resource.name ?? '').trim() || amount == null || (typeof amount !== 'number' && typeof amount !== 'string') || String(amount).trim() === '' || !Number.isFinite(Number(amount)) || Number(amount) < 0) throw new TypeError('billing.invalidPlan');
    this.id = resource.id;
    this.name = resource.name;
    this.price = Number(amount);
    this.currency = resource.currency ?? 'PEN';
    if (!/^[A-Z]{3}$/.test(this.currency)) throw new TypeError('billing.invalidPlan');
    try { new Intl.NumberFormat('en', {style: 'currency', currency: this.currency}); }
    catch { throw new TypeError('billing.invalidPlan'); }
    this.features = Array.isArray(resource.features) ? resource.features.filter(item => typeof item === 'string') : [];
    Object.freeze(this.features);
    Object.freeze(this);
  }
}

/** Calendar month renewal clamps end-of-month dates instead of overflowing. */
export function renewalDate(start) {
  const date = new Date(start);
  const day = date.getUTCDate();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString();
}

export function isActiveSubscription(resource, now = Date.now()) {
  return resource?.status === 'ACTIVE' && Date.parse(resource.expiresAt) > now;
}
