/**
 * Domain entity for the account holder's profile (Profile & Asset
 * Management bounded context). Backs the Settings > Profile screen:
 * editable personal information plus marketplace-visibility fields
 * that shape how the user's card is presented to specialists.
 *
 * @module UserProfile
 */

/**
 * @typedef {'producer' | 'specialist'} ProfileRole
 */

/**
 * @typedef {Object} UserProfileProps
 * @property {number|string|null} [id]
 * @property {ProfileRole} [role]
 * @property {string} [fullName]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [jobTitle]
 * @property {string} [roleLabel]
 * @property {string} [language]
 * @property {string} [location]
 * @property {string} [specialtyArea]
 * @property {number} [totalHectares]
 * @property {number} [plotCount]
 */

export class UserProfile {
    /** @type {number|string|null} */
    id;
    /** @type {ProfileRole} */
    role;
    /** @type {string} */
    fullName;
    /** @type {string} */
    email;
    /** @type {string} */
    phone;
    /** @type {string} */
    jobTitle;
    /** @type {string} */
    roleLabel;
    /** @type {string} */
    language;
    /** @type {string} */
    location;
    /** @type {string} */
    specialtyArea;
    /** @type {number} */
    totalHectares;
    /** @type {number} */
    plotCount;

    /**
     * @param {UserProfileProps} [props]
     */
    constructor({
        id = null,
        role = 'producer',
        fullName = '',
        email = '',
        phone = '',
        jobTitle = '',
        roleLabel = '',
        language = 'English',
        location = '',
        specialtyArea = '',
        totalHectares = 0,
        plotCount = 0,
    } = {}) {
        this.id = id;
        this.role = role;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.jobTitle = jobTitle;
        this.roleLabel = roleLabel;
        this.language = language;
        this.location = location;
        this.specialtyArea = specialtyArea;
        this.totalHectares = totalHectares;
        this.plotCount = plotCount;
    }

    /** Two-letter monogram used by the avatar bubble. */
    get initials() {
        const parts = this.fullName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return '—';
        const first = parts[0][0] ?? '';
        const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
        return `${first}${last}`.toUpperCase();
    }

    /** "Job title · role" line shown under the name in the editor header. */
    get headline() {
        return [this.jobTitle, this.roleLabel].filter(Boolean).join(' · ');
    }

    /** "24.6 ha · 3 plots" caption for the preview card. */
    get farmSizeLabel() {
        const ha = `${this.totalHectares.toFixed(1)} ha`;
        if (this.plotCount <= 0) return ha;
        return `${ha} · ${this.plotCount} ${this.plotCount === 1 ? 'plot' : 'plots'}`;
    }

    /** Returns a copy with the given fields overridden (immutability helper). */
    withChanges(changes) {
        return new UserProfile({
            id: this.id,
            role: this.role,
            fullName: this.fullName,
            email: this.email,
            phone: this.phone,
            jobTitle: this.jobTitle,
            roleLabel: this.roleLabel,
            language: this.language,
            location: this.location,
            specialtyArea: this.specialtyArea,
            totalHectares: this.totalHectares,
            plotCount: this.plotCount,
            ...changes,
        });
    }
}
