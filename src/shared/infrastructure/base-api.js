import axios from "axios";
import { getRequestInterceptors } from "./interceptor-registry.js";

const platformApi = import.meta.env.VITE_VIORA_PLATFORM_API_URL;
const mockApi = import.meta.env.VITE_MOCK_API_URL;
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

        for (const interceptor of getRequestInterceptors()) {
            this.#http.interceptors.request.use(interceptor);
        }

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
