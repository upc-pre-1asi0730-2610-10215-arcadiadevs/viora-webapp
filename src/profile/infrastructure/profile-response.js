import { UserProfile } from '../domain/model/user-profile.entity.js';

/**
 * Backend resource shape for `GET/PUT /profiles/{userId}`.
 * @typedef {Object} ProfileResource
 * @property {number|null} id
 * @property {number|null} userId
 * @property {string|null} role
 * @property {string|null} fullName
 * @property {string|null} email
 * @property {string|null} phone
 * @property {string|null} jobTitle
 * @property {string|null} language
 * @property {string|null} location
 * @property {string|null} specialtyArea
 */

/**
 * Request body for `PUT /profiles/{userId}`.
 * @typedef {Object} UpdateProfileRequest
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string} jobTitle
 * @property {string} language
 * @property {string} location
 * @property {string} specialtyArea
 */

/** Producer-facing caption for the backend role enum. */
const ROLE_LABELS = {
    producer: 'Olive producer',
    specialist: 'Phytosanitary specialist',
};

/**
 * Normalizes the backend role string to a ProfileRole.
 * @param {string|null} raw
 * @returns {'producer'|'specialist'}
 */
function toRole(raw) {
    return raw?.toUpperCase() === 'SPECIALIST' ? 'specialist' : 'producer';
}

export class ProfileAssembler {
    /**
     * Maps a backend resource to a domain entity.
     * @param {ProfileResource} resource
     * @returns {UserProfile}
     */
    static toEntityFromResource(resource) {
        const role = toRole(resource.role);
        return new UserProfile({
            id: resource.id ?? null,
            role,
            fullName: resource.fullName ?? '',
            email: resource.email ?? '',
            phone: resource.phone ?? '',
            jobTitle: resource.jobTitle ?? '',
            roleLabel: ROLE_LABELS[role],
            language: resource.language ?? 'English',
            location: resource.location ?? '',
            specialtyArea: resource.specialtyArea ?? '',
        });
    }
}
