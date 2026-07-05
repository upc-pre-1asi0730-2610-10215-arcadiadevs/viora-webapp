import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';
import { ProfileAssembler } from './profile-response.js';
import { requireActiveUserId } from '../../shared/infrastructure/active-session.js';

const profilesEndpointPath = import.meta.env.VITE_PROFILES_ENDPOINT_PATH || '/profiles';

/**
 * Infrastructure gateway for the Profile bounded context.
 * Serves the account holder's editable profile via the Viora Platform backend.
 *
 * @class ProfileApi
 * @extends BaseApi
 */
export class ProfileApi extends BaseApi {
    #profilesEndpoint;

    constructor() {
        super();
        this.#profilesEndpoint = new BaseEndpoint(this, profilesEndpointPath);
    }

    /** Fetches the active account holder's profile. */
    async getProfile() {
        const response = await this.#profilesEndpoint.getById(requireActiveUserId());
        return ProfileAssembler.toEntityFromResource(response.data);
    }

    /** Persists the editable profile fields (upsert on the backend). */
    async updateProfile(changes) {
        const response = await this.#profilesEndpoint.http.put(
            `${this.#profilesEndpoint.endpointPath}/${requireActiveUserId()}`,
            changes,
        );
        return ProfileAssembler.toEntityFromResource(response.data);
    }
}
