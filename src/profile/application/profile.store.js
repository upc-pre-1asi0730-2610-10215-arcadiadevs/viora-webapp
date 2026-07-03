/**
 * Application service store for the `Profile` bounded context.
 * Owns the account holder's editable profile that backs the Settings screens.
 *
 * @module useProfileStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { UserProfile } from '../domain/model/user-profile.entity.js';
import { ProfileApi } from '../infrastructure/profile-api.js';

const profileApi = new ProfileApi();

/**
 * Reactive store that exposes Profile commands and queries.
 * @returns {Object} Store state and actions.
 */
export const useProfileStore = defineStore('profile', () => {
    /** @type {import('vue').Ref<UserProfile>} */
    const profile = ref(new UserProfile());

    /** @type {import('vue').Ref<boolean>} */
    const saving = ref(false);

    /** @type {import('vue').Ref<boolean>} */
    const loading = ref(false);

    /** @type {import('vue').Ref<Date|null>} */
    const lastSavedAt = ref(null);

    /** Relative caption for the dashboard header. */
    const lastSyncLabel = computed(() => {
        if (!lastSavedAt.value) return 'No changes saved yet';
        return relativeTime(lastSavedAt.value);
    });

    /** Loads the active account holder's profile from the backend. */
    async function load() {
        try {
            loading.value = true;
            const loaded = await profileApi.getProfile();
            profile.value = loaded;
        } catch {
            // Leave the current profile in place; the view stays usable.
        } finally {
            loading.value = false;
        }
    }

    /**
     * Commits the edited profile to the backend.
     * @param {Object} changes - The edited fields.
     * @param {function} [onDone] - Callback with the saved profile.
     */
    async function save(changes, onDone) {
        try {
            saving.value = true;
            const saved = await profileApi.updateProfile(changes);
            profile.value = saved;
            lastSavedAt.value = new Date();
            onDone?.(saved);
        } catch {
            // Keep the draft so the user can retry.
        } finally {
            saving.value = false;
        }
    }

    /**
     * @param {Date} date
     * @returns {string}
     */
    function relativeTime(date) {
        const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} h ago`;
        const days = Math.floor(hours / 24);
        return `${days} d ago`;
    }

    return {
        profile,
        saving,
        loading,
        lastSavedAt,
        lastSyncLabel,
        load,
        save,
    };
});

export default useProfileStore;
