/**
 * Utility for formatting dates and calculating relative time.
 * Located in shared/infrastructure as a technical support service.
 */
export const DateTimeFormatter = {
    /**
     * Calculates the time elapsed since a given date and returns a human-readable string.
     * @param {string|Date} date - The date to compare.
     * @returns {string} Formatted string (e.g., "5 min ago").
     */
    formatRelativeTime(date) {
        if (!date) return 'N/A';
        const lastDate = new Date(date);
        const now = new Date();
        const diffInMs = now - lastDate;
        const diffInMins = Math.floor(diffInMs / (1000 * 60));

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins} min ago`;

        const diffInHours = Math.floor(diffInMins / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} days ago`;
    }
};