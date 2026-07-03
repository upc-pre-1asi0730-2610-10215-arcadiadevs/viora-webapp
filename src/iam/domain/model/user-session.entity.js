/**
 * Domain entity for a signed-in device/session of the account holder (IAM).
 * Backs the "Active sessions" card in Settings > Security.
 * @class UserSession
 */
export class UserSession {
    /**
     * @param {Object} params
     * @param {number|string|null} [params.id=null] - Session identifier.
     * @param {string} [params.device=''] - Device name (e.g., 'MacBook Pro').
     * @param {string} [params.client=''] - Browser/client name (e.g., 'Chrome').
     * @param {string} [params.location=''] - Geographic location (e.g., 'Tacna, Peru').
     * @param {string|null} [params.lastActiveAt=null] - ISO timestamp of last activity.
     * @param {boolean} [params.current=false] - Whether this is the current session.
     */
    constructor({
        id = null,
        device = '',
        client = '',
        location = '',
        lastActiveAt = null,
        current = false,
    } = {}) {
        this.id = id;
        this.device = device;
        this.client = client;
        this.location = location;
        this.lastActiveAt = lastActiveAt;
        this.current = current;
    }

    /** "MacBook Pro · Chrome" title line. */
    get title() {
        return [this.device, this.client].filter(Boolean).join(' · ');
    }

    /** Material icon name representing the device family. */
    get icon() {
        const label = `${this.device} ${this.client}`.toLowerCase();
        if (/(iphone|android|pixel|galaxy|phone|app)/.test(label)) {
            return 'smartphone';
        }
        if (/(macbook|laptop|notebook)/.test(label)) {
            return 'laptop_mac';
        }
        return 'desktop_windows';
    }

    /** "Active now" / "2 hours ago" / "3 days ago" caption. */
    get lastActiveLabel() {
        if (this.current) {
            return 'Active now';
        }
        if (!this.lastActiveAt) {
            return '';
        }
        const then = new Date(this.lastActiveAt).getTime();
        if (Number.isNaN(then)) {
            return '';
        }
        const minutes = Math.max(0, Math.floor((Date.now() - then) / 60000));
        if (minutes < 1) {
            return 'Active now';
        }
        if (minutes < 60) {
            return `${minutes} min ago`;
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        }
        const days = Math.floor(hours / 24);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }

    /** "Tacna, Peru · Active now" subtitle. */
    get subtitle() {
        return [this.location, this.lastActiveLabel].filter(Boolean).join(' · ');
    }
}
