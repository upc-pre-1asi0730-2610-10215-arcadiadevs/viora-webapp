import axios from "axios";

const platformApi = import.meta.env.VITE_VIORA_PLATFORM_API_URL;
const mockApi = import.meta.env.VITE_MOCK_API_URL;
const defaultUserId = import.meta.env.VITE_DEFAULT_USER_ID;
const hasApiUrl = (url) => typeof url === "string" && url.trim().length > 0;

const createClient = (baseURL) => {
    const configured = hasApiUrl(baseURL);
    const client = axios.create({
        baseURL: configured ? baseURL : undefined,
        headers: { "Content-Type": "application/json" }
    });

    client.interceptors.request.use((config) => {
        if (!configured) {
            return Promise.reject(new Error("Viora API URL is not configured."));
        }

        return config;
    });

    return client;
};

/**
 * Shared infrastructure API client factory for bounded contexts.
 *
 * @class BaseApi
 */
export class BaseApi {
    #http;
    #mockHttp;

    /**
     * Creates Axios HTTP clients configured for the active API targets.
     */
    constructor() {
        this.#http = createClient(platformApi);
        this.#mockHttp = createClient(mockApi);

        this.#http.interceptors.request.use((config) => {
            if (!defaultUserId) return config;

            const params = new URLSearchParams(config.params || {});

            if (!params.has("userId")) {
                params.set("userId", defaultUserId);
            }

            config.params = Object.fromEntries(params.entries());
            return config;
        });
    }

    /**
     * Low-level HTTP client used by infrastructure endpoints.
     * @returns {import('axios').AxiosInstance} Axios client instance.
     */
    get http() { return this.#http; }

    /**
     * Low-level HTTP client for temporary mock-backed bounded contexts.
     * @returns {import('axios').AxiosInstance} Axios client instance.
     */
    get mockHttp() { return this.#mockHttp; }
}
