import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

import { UserSessionAssembler } from './iam-response.js';

const usersPath = import.meta.env.VITE_USERS_ENDPOINT_PATH || '/users';

/**
 * Infrastructure gateway for IAM account-security operations (Settings > Security).
 * Password change, active sessions, and account deactivation for the active user.
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    #usersEndpoint;

    constructor() {
        super();
        this.#usersEndpoint = new BaseEndpoint(this, usersPath);
    }

    /** Lists the active user's signed-in sessions. */
    getSessions(userId) {
        return this.http.get(`${this.#usersEndpoint.endpointPath}/${userId}/sessions`);
    }

    /** Revokes (signs out) a session. Errors are surfaced to callers. */
    revokeSession(userId, sessionId) {
        return this.http.delete(`${this.#usersEndpoint.endpointPath}/${userId}/sessions/${sessionId}`);
    }

    /** Changes the active user's password. Errors are surfaced to callers. */
    changePassword(userId, request) {
        return this.http.put(`${this.#usersEndpoint.endpointPath}/${userId}/password`, request);
    }

    /** Deactivates the active user's account (Danger zone). */
    deactivateAccount(userId) {
        return this.http.patch(`${this.#usersEndpoint.endpointPath}/${userId}/deactivate`, {});
    }
}
