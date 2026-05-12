/**
 * MapboxService.
 * Singleton infrastructure service to manage external Mapbox GL JS SDK assets.
 * Ensures the library is loaded only once and manages the global access token.
 */
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export class MapboxService {
    static #instance = null;
    #isLoaded = false;
    #library = null;

    constructor() {
        if (MapboxService.#instance) return MapboxService.#instance;
        MapboxService.#instance = this;
    }

    /**
     * Dynamically injects Mapbox GL JS scripts and styles into the document.
     * Uses a promise flow to manage asynchronous loading of external resources.
     * @returns {Promise<Object>} The global mapboxgl object.
     */
    loadLibrary() {

        // Start with a resolved promise to enter the .then() chain
        return Promise.resolve().then(() => {
            // If already loaded, return the cached library instance immediately
            if (this.#isLoaded) {
                return this.#library;
            }

            // If not loaded, proceed with DOM element injection
            return new Promise((resolve, reject) => {
                const version = 'v3.1.2';

                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `https://api.mapbox.com/mapbox-gl-js/${version}/mapbox-gl.css`;
                document.head.appendChild(link);

                // Imports the Mapbox GL JS bundle
                const script = document.createElement('script');
                script.src = `https://api.mapbox.com/mapbox-gl-js/${version}/mapbox-gl.js`;
                script.async = true;

                script.onload = () => {
                    this.#isLoaded = true;
                    this.#library = window.mapboxgl;

                    // Ensure we read the token from the current environment context
                    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

                    if (!token || token === 'tu_token_aqui') {
                        console.error("[MapboxService] Critical Error: VITE_MAPBOX_ACCESS_TOKEN is missing or invalid.");
                    }

                    this.#library.accessToken = token;
                    resolve(this.#library);
                };

                script.onerror = () => {
                    reject(new Error("Network Error: Could not download the Mapbox SDK."));
                };

                document.head.appendChild(script);
            });
        }).catch((error) => {
            console.error("Critical failure in Mapbox infrastructure:", error);
            throw error;
        });
    }

    /**
     * Factory method to create a standardized map instance.
     * @param {Object} options - Configuration for the new map instance (container, zoom, etc.).
     * @returns {Promise<Object>} Promise that resolves with the Mapbox map instance.
     */
    createMapInstance(options) {
        return this.loadLibrary()
            .then((mapboxgl) => {
                // Create the instance using the application's default base configuration
                const map = new mapboxgl.Map({
                    style: 'mapbox://styles/mapbox/satellite-v9',
                    attributionControl: false,
                    ...options
                });

                // Add navigation controls (Zoom/Rotate) for better UX
                map.addControl(new mapboxgl.NavigationControl(), 'top-right');

                return map;
            })
            .catch((error) => {
                console.error("Error instantiating the map in the container:", options.container);
                throw error;
            });
    }
}

/**
 * Export a single instance of the service (Singleton) to ensure
 * loading state consistency across the entire application.
 */
export const mapboxService = new MapboxService();