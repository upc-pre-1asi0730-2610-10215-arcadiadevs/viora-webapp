import { UserSession } from '../domain/model/user-session.entity.js';

/**
 * Backend resource shape for `GET /users/{userId}/sessions` items.
 * @typedef {Object} UserSessionResource
 * @property {number|null} id
 * @property {string|null} device
 * @property {string|null} client
 * @property {string|null} location
 * @property {string|null} lastActiveAt
 * @property {boolean|null} current
 */

/**
 * @typedef {Object} ChangePasswordRequest
 * @property {string} currentPassword
 * @property {string} newPassword
 */

export class UserSessionAssembler {
    /**
     * @param {UserSessionResource} resource
     * @returns {UserSession}
     */
    static toEntityFromResource(resource) {
        return new UserSession({
            id: resource.id ?? null,
            device: resource.device ?? '',
            client: resource.client ?? '',
            location: resource.location ?? '',
            lastActiveAt: resource.lastActiveAt ?? null,
            current: resource.current ?? false,
        });
    }

    /**
     * @param {UserSessionResource[]} resources
     * @returns {UserSession[]}
     */
    static toEntitiesFromResponse(resources) {
        return resources.map((resource) => UserSessionAssembler.toEntityFromResource(resource));
    }
}
