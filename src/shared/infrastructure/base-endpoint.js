/**
 * Generic infrastructure endpoint abstraction for CRUD-like operations.
 *
 * @template TResource
 * @class BaseEndpoint
 */
export class BaseEndpoint {
    /**
     * @param {import('./base-api.js').BaseApi} baseApi - Infrastructure API client.
     * @param {string} endpointPath - Relative endpoint path within the API.
     */
    constructor(baseApi, endpointPath) {
        this.http = baseApi.http;
        this.endpointPath = endpointPath;
    }

    /**
     * Requests all resources from the endpoint.
     * @returns {Promise<import('axios').AxiosResponse<Array<TResource>|Object>>} HTTP response.
     */
    getAll() {
        return this.http.get(this.endpointPath);
    }

    /**
     * Requests one resource by identifier.
     * @param {number|string} id - Resource identifier.
     * @returns {Promise<import('axios').AxiosResponse<TResource|Object>>} HTTP response.
     */
    getById(id) {
        return this.http.get(`${this.endpointPath}/${id}`);
    }

    /**
     * Persists a new resource payload.
     * @param {TResource|Object} resource - Resource payload to create.
     * @returns {Promise<import('axios').AxiosResponse<TResource|Object>>} HTTP response.
     */
    create(resource) {
        return this.http.post(this.endpointPath, resource);
    }

    /**
     * Updates an existing resource payload.
     * @param {number|string} id - Resource identifier.
     * @param {TResource|Object} resource - Resource payload to update.
     * @returns {Promise<import('axios').AxiosResponse<TResource|Object>>} HTTP response.
     */
    update(id, resource) {
        return this.http.put(`${this.endpointPath}/${id}`, resource);
    }

    /**
     * Deletes a resource by identifier.
     * @param {number|string} id - Resource identifier.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response.
     */
    delete(id) {
        return this.http.delete(`${this.endpointPath}/${id}`);
    }
}