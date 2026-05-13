import axios from 'axios';
const platformApi = import.meta.env.VITE_VIORA_PLATFORM_API_URL;

/**
 * Shared infrastructure API client factory for bounded contexts.
 *
 * @class BaseApi
 */
export class BaseApi {
    #http;

    /**
     * Creates an Axios HTTP client configured for the platform API.
     */
    constructor() {
        this.#http = axios.create({
            baseURL: platformApi,
            headers: { 'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'}
        });
    }

    /**
     * Low-level HTTP client used by infrastructure endpoints.
     * @returns {import('axios').AxiosInstance} Axios client instance.
     */
    get http() { return this.#http;}
}