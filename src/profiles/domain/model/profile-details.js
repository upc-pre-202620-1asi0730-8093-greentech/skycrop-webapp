function normalizeOptionalText(value, maxLength, errorKey) {
    if (value == null) return '';

    if (typeof value !== 'string') {
        throw new TypeError(errorKey);
    }

    const normalized = value.trim();

    if (normalized.length > maxLength) {
        throw new RangeError(errorKey);
    }

    return normalized;
}

/** Immutable profile details validated before persistence. */
export class ProfileDetails {
    constructor({
                    phone = '',
                    occupation = '',
                    language = 'en',
                    emailNotifications = false,
                } = {}) {
        this.phone = normalizeOptionalText(
            phone,
            30,
            'account.invalidPhone',
        );

        this.occupation = normalizeOptionalText(
            occupation,
            120,
            'account.invalidOccupation',
        );

        if (!['en', 'es'].includes(language)) {
            throw new TypeError('account.invalidLanguage');
        }

        if (typeof emailNotifications !== 'boolean') {
            throw new TypeError('account.invalidEmailNotifications');
        }

        this.language = language;
        this.emailNotifications = emailNotifications;

        Object.freeze(this);
    }
}