/**
 * Domain entity for a phytosanitary specialist recommended for an alert.
 * @class SpecialistCandidate
 */

/** @typedef {'today'|'tomorrow'|'week'|'unavailable'} SpecialistAvailability */

const AVAILABILITY_LABELS = {
    today: 'Available today',
    tomorrow: 'Available tomorrow',
    week: 'Available this week',
    unavailable: 'Unavailable',
};

export class SpecialistCandidate {
    /**
     * @param {Object} params
     * @param {number|string|null} [params.id=null]
     * @param {string} [params.name='']
     * @param {string} [params.role='']
     * @param {number} [params.successRate=0]
     * @param {number} [params.caseCount=0]
     * @param {number} [params.distanceKm=0]
     * @param {string[]} [params.tags=[]]
     * @param {SpecialistAvailability} [params.availability='week']
     * @param {boolean} [params.bestMatch=false]
     */
    constructor({
        id = null,
        name = '',
        role = '',
        successRate = 0,
        caseCount = 0,
        distanceKm = 0,
        tags = [],
        availability = 'week',
        bestMatch = false,
    } = {}) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.successRate = successRate;
        this.caseCount = caseCount;
        this.distanceKm = distanceKm;
        this.tags = tags;
        this.availability = availability;
        this.bestMatch = bestMatch;
    }

    /** Two-letter monogram used by the avatar bubble. @returns {string} */
    get initials() {
        const parts = this.name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return '\u2014';
        const first = parts[0][0] ?? '';
        const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
        return `${first}${last}`.toUpperCase();
    }

    /** @returns {string} */
    get availabilityLabel() {
        return AVAILABILITY_LABELS[this.availability];
    }

    /** @returns {boolean} */
    get isAvailable() {
        return this.availability !== 'unavailable';
    }

    /** @returns {string} */
    get successRateLabel() {
        return `${Math.round(this.successRate)}% success`;
    }

    /** @returns {string} */
    get caseCountLabel() {
        return `${this.caseCount} cases`;
    }

    /** @returns {string} */
    get distanceLabel() {
        return `${this.distanceKm.toFixed(1)} km away`;
    }
}
