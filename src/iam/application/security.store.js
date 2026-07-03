/**
 * Application store for IAM account-security (Settings > Security).
 * Coordinates the real password-change, active-sessions and account-deactivation
 * endpoints for the active user.
 *
 * @module useSecurityStore
 */
import { defineStore } from "pinia";
import { ref } from "vue";

import { IamApi } from "../infrastructure/iam-api.js";
import { UserSessionAssembler } from "../infrastructure/iam-response.js";

const iamApi = new IamApi();
const defaultUserId = import.meta.env.VITE_DEFAULT_USER_ID;

/**
 * Reactive store that exposes IAM security commands and queries.
 * @returns {Object} Store state and actions.
 */
export const useSecurityStore = defineStore("security", () => {
    // ── State ──────────────────────────────────────────────────────────
    const sessions = ref([]);
    const loadingSessions = ref(false);
    const changingPassword = ref(false);
    const deactivating = ref(false);

    // ── Actions ────────────────────────────────────────────────────────

    /** Loads the active user's sessions. */
    async function loadSessions() {
        try {
            loadingSessions.value = true;
            const response = await iamApi.getSessions(defaultUserId);
            const resources = response?.data ?? [];
            sessions.value = UserSessionAssembler.toEntitiesFromResponse(resources);
        } catch {
            // Error silently ignored — keeps current state
        } finally {
            loadingSessions.value = false;
        }
    }

    /** Revokes a session, dropping it from the list on success. */
    async function revokeSession(sessionId) {
        try {
            await iamApi.revokeSession(defaultUserId, sessionId);
            sessions.value = sessions.value.filter(
                (session) => String(session.id) !== String(sessionId),
            );
        } catch {
            // Error silently ignored
        }
    }

    /** Changes the password; reports success/failure (with message) to the caller. */
    async function changePassword(request, onDone) {
        try {
            changingPassword.value = true;
            await iamApi.changePassword(defaultUserId, request);
            onDone?.(true);
        } catch (err) {
            onDone?.(
                false,
                err?.response?.data?.message ??
                    "Could not update your password. Check your current password.",
            );
        } finally {
            changingPassword.value = false;
        }
    }

    /** Deactivates the account; reports completion to the caller. */
    async function deactivateAccount(onDone) {
        try {
            deactivating.value = true;
            await iamApi.deactivateAccount(defaultUserId);
            onDone?.(true);
        } catch {
            onDone?.(false);
        } finally {
            deactivating.value = false;
        }
    }

    return {
        sessions,
        loadingSessions,
        changingPassword,
        deactivating,
        loadSessions,
        revokeSession,
        changePassword,
        deactivateAccount,
    };
});

export default useSecurityStore;
